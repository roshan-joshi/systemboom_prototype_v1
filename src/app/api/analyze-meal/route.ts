/**
 * UC-MEAL-AI — the Composer's ONLY Meal-vision boundary. The browser talks ONLY to this route;
 * it never calls DeepSeek directly and the API key never reaches client code (it is read here,
 * server-side, and nowhere else — never `NEXT_PUBLIC_`, never imported by a "use client" file).
 *
 * PRIVACY (§SERVER BOUNDARY / §PRIVACY BOUNDARY): the request this route builds for the
 * provider carries ONLY encoded image bytes plus a minimal, fixed instruction — no caption,
 * GPS, filename, asset id, user id, or account information is ever read from, or forwarded on
 * behalf of, the request that reaches this route.
 *
 * PROVIDER: DeepSeek, model `deepseek-flash` (verified vision-capable against the official
 * DeepSeek API docs — see AGENTS.md "UC-MEAL-AI Phase 0"), via the OpenAI-compatible SDK,
 * baseURL `https://api.deepseek.com`. Never silently substituted.
 *
 * `?mock=<scenario>` or `?mock=<scenario>:<delayMs>` is a test-only determinism seam (same
 * convention as `/api/geocode`'s `?mock=1`): resolves a canned, deterministic observation
 * instead of calling DeepSeek, optionally after sleeping `delayMs` (to test late-result
 * safety), so automated tests never depend on, or hit, a live external service, and never need
 * a real API key. The Composer's own UI never sends this param unless the page itself was
 * loaded with `?mockai=`.
 */
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import OpenAI from "openai";
import type { AIConfidence, MealAIObservation, MealIdentity, NutritionEstimate, NutritionValue, ObservedFood, OcrObservation } from "@/components/style-lab/social/data";

const MODEL = "deepseek-flash";
// 2026-10-05: raised 10s → 30s (multi 20s → 40s). A busy plate (many distinct items) makes the thinking-capable
// model reason for 10–18s even with thinking disabled; at 10s the route aborted and silently answered "nothing
// detected" for perfectly ordinary breakfast photos. The client ceilings in analyzeMealMedia.ts stay ABOVE these.
const SINGLE_IMAGE_TIMEOUT_MS = 30_000;
const MULTI_IMAGE_TIMEOUT_MS = 40_000;

interface ImageInput {
  dataUrl: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The exact, minimal instruction + image content that would be sent to the provider. Kept as
 * its own function so the server privacy-payload test (§SERVER PRIVACY PAYLOAD) can inspect
 * precisely what would be sent — via the `?mock=echo` seam below, never a real provider call.
 *
 * `extra_body: { thinking: { type: "disabled" } }` (2026-10-01 fix): `deepseek-flash` defaults
 * to "thinking mode" and emits a separate `reasoning_content` field before `content`. Live
 * verification (`_verify-deepseek-live.js`) proved a real call with `max_tokens: 300` spent the
 * ENTIRE budget on reasoning (`finish_reason: "length"`, `reasoning_tokens` === `max_tokens`,
 * `content: ""`) — the model never reached the point of writing the requested JSON. Disabling
 * thinking stops that budget being spent on invisible reasoning at all. `max_tokens: 800`
 * (raised from 700) gives the now-reasoning-free response enough headroom for ~5 foods plus a
 * full nutrition estimate. The Node `openai` SDK has no typed `thinking` parameter — `extra_body`
 * is included as a plain extra key on the (non-literal, function-returned) payload object, which
 * TypeScript's structural typing allows through to `.create()` without an excess-property error,
 * and the SDK serializes it into the real JSON body exactly as given — confirmed by reading it
 * back out of the `?mock=echo` introspection payload (§SERVER PRIVACY PAYLOAD test).
 */
function buildProviderPayload(images: ImageInput[]) {
  const SYSTEM_PROMPT =
    "You are a food-recognition assistant analyzing photo(s) for a personal food journal. " +
    "Identify the ONE meal, dish or drink the way an ordinary person would name it, a likely meal " +
    "type if the image makes it evident, and any visible text on a menu, package label, or " +
    "receipt. Respond with ONLY a JSON object, no prose, matching exactly:\n" +
    "{\n" +
    '  "isFood": boolean,\n' +
    '  "meal": {"name": string|null, "canonicalName": string|null, "brand"?: string, "confidence": "high"|"medium"|"low"},\n' +
    '  "visibleComponents"?: [{"name": string, "confidence": "high"|"medium"|"low"}],\n' +
    '  "preparation"?: {"value": "raw"|"grilled"|"fried"|"baked"|"boiled"|"roasted"|"steamed"|"cooked", "confidence": "high"|"medium"|"low"},\n' +
    '  "portion"?: {"value": string, "confidence": "high"|"medium"|"low"},\n' +
    '  "possibleMealType"?: "breakfast"|"lunch"|"dinner"|"snack",\n' +
    '  "setting"?: {"value": "home"|"restaurant"|"takeaway"|"packaged"|"work"|"event"|"travel", "confidence": "high"|"medium"|"low"},\n' +
    '  "nutrition"?: {"calories"?: {"min": number, "max": number}, "protein"?: {"min": number, "max": number}, "carbs"?: {"min": number, "max": number}, "fat"?: {"min": number, "max": number}},\n' +
    '  "ocr"?: [{"kind": "menu"|"package"|"receipt", "text": string}],\n' +
    '  "confidence": "high"|"medium"|"low"\n' +
    "}\n" +
    '"isFood" is true ONLY if the image meaningfully depicts food, drink, or a meal context. ' +
    '"meal.name" is the meal as a person would say it — "Burger", "Pizza", "Dal bhat", "Biryani", ' +
    '"Caesar salad" — NEVER a list of ingredients or components ("bun, patty, lettuce" or ' +
    '"rice, dal, curry" is wrong). Use a specific name only when the image visually supports it; if ' +
    'the dish cannot be responsibly identified, set "name" and "canonicalName" to null and ' +
    '"confidence" to "low" — never invent a specific dish. "canonicalName" is a normalized, ' +
    'lookup-oriented identity for the same meal (e.g. "cheeseburger") — never a brand guess. ' +
    'The top-level "confidence" is how sure you are that the image shows food or a meal; how sure ' +
    'you are of the dish NAME is "meal.confidence" — so a clearly food photo whose exact dish name is ' +
    'uncertain still has top-level "confidence" "high" (and a lower "meal.confidence"). ' +
    '"visibleComponents" lists at most 6 of the most prominent items, only what is clearly VISIBLE on the plate or in the glass ' +
    '("rice", "lentils", "pickle") — never recipe ingredients, never hidden seasoning, oil, salt ' +
    'or ghee; omit anything you are unsure of. "preparation" only when it is visually obvious, ' +
    '"setting" only when evident (e.g. a restaurant table, an aeroplane or train tray = "travel", a sealed package = "packaged"), ' +
    '"portion" only as a human-scale amount such as "1 bowl" or "2 slices" — NEVER grams, ' +
    'millilitres or ounces — and "possibleMealType" only when the image makes it evident; omit each ' +
    'when unsure. "brand" is included ONLY when a brand or product name is clearly legible on a visible ' +
    "package or label — it is text you read, never a guess; omit it otherwise, and it is never a " +
    "nutrition source. Never claim a nutrition data source, database, or authority of any kind: any " +
    "nutrition you provide is always your own visual estimate and nothing else. " +
    'If the image is not meaningfully food-related, return {"isFood": false, "confidence": "high"} ' +
    "and omit every other key. When the image IS food, always include your whole-meal " +
    "\"nutrition\" estimate (calories, protein, carbs and fat, each as a min/max range for the amount " +
    "visible) — it is your own visual estimate, so keep the ranges honest and wide enough. Never " +
    "invent a fact you cannot actually see. Prefer a min/max " +
    "range over a single exact number for nutrition — you cannot know exact recipe, hidden " +
    "oil, or exact weight from a photograph. Never make an allergen safety claim beyond a " +
    'tentative "may contain" when genuinely evidenced. Never provide medical advice or a ' +
    "diagnosis of any kind.";
  // Fix 3 — the final instruction sits in the USER message, immediately beside the image(s),
  // text first: a short, strict reinforcement of the system prompt's own JSON contract, kept
  // short so it never redefines (or drifts from) the one schema already specified above.
  const USER_TEXT = "Analyze the attached photo(s). Respond ONLY with the JSON object described above — no prose, no markdown, no explanation.";
  return {
    model: MODEL,
    messages: [
      { role: "system" as const, content: SYSTEM_PROMPT },
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: USER_TEXT },
          ...images.map((img) => ({ type: "image_url" as const, image_url: { url: img.dataUrl } })),
        ],
      },
    ],
    response_format: { type: "json_object" as const },
    // 2026-10-01 reliability fix (Phase A exit, OPTION A): raised from 800 → 4000. Live proof
    // showed `finish_reason:"length"` with `reasoning_tokens` consuming 729-800 of an 800
    // budget — `thinking: disabled` is not reliably honored call-to-call, so the budget must
    // survive worst-case reasoning overhead on its own. Prompt/schema unchanged.
    max_tokens: 4000,
    extra_body: { thinking: { type: "disabled" } },
  };
}

/** Fix 4 — some providers wrap JSON in a markdown fence even under `response_format:
 *  json_object` and an explicit "no markdown" instruction. Strip it before parsing. */
function stripMarkdownFence(s: string): string {
  const trimmed = s.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fence ? fence[1].trim() : trimmed;
}

/**
 * 2026-10-01 fix — DeepSeek returns confidence as a NUMBER (e.g. 0.9, 0.55) in real responses,
 * not the "high"|"medium"|"low" enum the prompt asks for (confirmed live via
 * `_verify-deepseek-live.js` against a real photo). Without converting it, every real food/
 * nutrition value fell through to the "low" default below, discarding the model's actual
 * signal. Accepts EITHER shape — a string enum (kept, in case a future response already
 * complies) or a number, mapped: >= 0.8 → "high", >= 0.5 → "medium", < 0.5 → "low".
 */
function toConfidence(v: unknown): AIConfidence | undefined {
  if (v === "high" || v === "medium" || v === "low") return v;
  if (typeof v === "number" && Number.isFinite(v)) return v >= 0.8 ? "high" : v >= 0.5 ? "medium" : "low";
  return undefined;
}

function normalizeNutritionValue(v: unknown, unit: string): NutritionValue | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const min = typeof o.min === "number" && Number.isFinite(o.min) ? o.min : undefined;
  const max = typeof o.max === "number" && Number.isFinite(o.max) ? o.max : undefined;
  if (min === undefined || max === undefined || min < 0 || max < min) return undefined;
  // PHASE B — CODE determines provenance, never the provider: whatever "source" string the
  // model may fabricate (live runs really did return "USDA FoodData Central") is deliberately
  // never read. AI-estimated nutrition is always `ai_estimate` — a range, never fake precision.
  return { range: { min, max }, unit, source: "ai_estimate", confidence: toConfidence(o.confidence) ?? "medium" };
}

/**
 * Validates and normalizes raw provider JSON into SYSTEMBOOM's own `MealAIObservation` shape.
 * Provider JSON is NEVER trusted blindly: malformed output, an unexpected type, or a missing
 * field all degrade to a safely partial (or fully null) observation rather than propagating a
 * crash into the Meal flow (§PROVIDER RESPONSE VALIDATION).
 */
function normalizeProviderOutput(raw: string | null | undefined): MealAIObservation | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripMarkdownFence(raw));
  } catch (err) {
    // Fix 4 — log the exact raw content that failed to parse (server-side only) and degrade
    // to a safe null; never throw into the Meal flow.
    console.error("[analyze-meal] JSON.parse failed on provider content:", err instanceof Error ? err.message : err);
    console.error("[analyze-meal] raw content was:", JSON.stringify(raw));
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;

  const foodsRaw = Array.isArray(o.foods) ? o.foods : [];
  const foods: ObservedFood[] = foodsRaw
    .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
    .filter((f) => typeof f.name === "string" && f.name.trim().length > 0)
    .slice(0, 20) // a practical maximum item count — never an unbounded list
    .map((f) => ({
      name: String(f.name).trim().slice(0, 80),
      // PHASE B — the lookup-oriented identity, kept beside (never replacing) the everyday name.
      canonicalName: typeof f.canonicalName === "string" && f.canonicalName.trim() ? f.canonicalName.trim().slice(0, 80) : undefined,
      // PHASE B2 — printed brand text the model read (recognition only; it only picks which factual source is asked first).
      brand: typeof f.brand === "string" && f.brand.trim() ? f.brand.trim().slice(0, 60) : undefined,
      confidence: toConfidence(f.confidence) ?? "low",
      portion: typeof f.portion === "string" && f.portion.trim() ? f.portion.trim().slice(0, 40) : undefined,
    }));

  const mealTypeRaw = o.possibleMealType;
  const possibleMealType =
    mealTypeRaw === "breakfast" || mealTypeRaw === "lunch" || mealTypeRaw === "dinner" || mealTypeRaw === "snack" ? mealTypeRaw : undefined;

  const ingredientsRaw = Array.isArray(o.ingredients) ? o.ingredients.filter((s): s is string => typeof s === "string" && s.trim().length > 0) : [];
  const ingredients = ingredientsRaw.length ? ingredientsRaw.slice(0, 20).map((s) => s.trim().slice(0, 60)) : undefined;

  let nutritionEstimate: NutritionEstimate | undefined;
  if (o.nutrition && typeof o.nutrition === "object") {
    const n = o.nutrition as Record<string, unknown>;
    const calories = normalizeNutritionValue(n.calories, "kcal");
    const protein = normalizeNutritionValue(n.protein, "g");
    const carbs = normalizeNutritionValue(n.carbs, "g");
    const fat = normalizeNutritionValue(n.fat, "g");
    if (calories || protein || carbs || fat) nutritionEstimate = { calories, protein, carbs, fat };
  }

  const ocrRaw = Array.isArray(o.ocr) ? o.ocr : [];
  const ocrObservations: OcrObservation[] = ocrRaw
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .filter((r) => (r.kind === "menu" || r.kind === "package" || r.kind === "receipt") && typeof r.text === "string" && r.text.trim())
    .slice(0, 10)
    .map((r) => ({ kind: r.kind as OcrObservation["kind"], text: String(r.text).trim().slice(0, 500) }));

  // MEAL CAPTURE EXTENSION — secondary observations, each kept ONLY when it is defensible:
  //  - visibleComponents: usable (non-low) named items, deduped, bounded; the provider's confidence
  //    decides, never a guess of ours.
  //  - preparation: a fixed small vocabulary AND high confidence; anything else is dropped (never
  //    derived from the meal name).
  //  - portion: high confidence AND human-scale — any measured amount (g/kg/ml/l/oz/lb…) is rejected
  //    outright, because a photograph cannot justify it.
  const PREPARATIONS = new Set(["raw", "grilled", "fried", "baked", "boiled", "roasted", "steamed", "cooked"]);
  const MEASURED = /\d\s*(?:g|gm|gms|gram|grams|kg|mg|ml|millilit\w*|l|litre|litres|liter|liters|oz|ounce|ounces|lb|lbs|pound|pounds|cc|kcal)\b/i;
  let visibleComponents: { name: string; confidence: AIConfidence }[] | undefined;
  if (o.isFood === true && Array.isArray(o.visibleComponents)) {
    const seen = new Set<string>();
    const list: { name: string; confidence: AIConfidence }[] = [];
    for (const c of o.visibleComponents) {
      if (!c || typeof c !== "object") continue;
      const r = c as Record<string, unknown>;
      const name = typeof r.name === "string" ? r.name.trim().slice(0, 40) : "";
      const conf = toConfidence(r.confidence) ?? "low";
      if (!name || conf === "low" || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      list.push({ name, confidence: conf });
      if (list.length >= 12) break;
    }
    if (list.length) visibleComponents = list;
  }
  const detail = (v: unknown): { value: string; confidence: AIConfidence } | null => {
    if (!v || typeof v !== "object") return null;
    const r = v as Record<string, unknown>;
    const value = typeof r.value === "string" ? r.value.trim() : "";
    return value ? { value, confidence: toConfidence(r.confidence) ?? "low" } : null;
  };
  const prepRaw = o.isFood === true ? detail(o.preparation) : null;
  // MEAL V1 — HIGH and MEDIUM both fill (the person sees one clean value); LOW is dropped. The confidence is kept beside it.
  const preparation = prepRaw && prepRaw.confidence !== "low" && PREPARATIONS.has(prepRaw.value.toLowerCase()) ? prepRaw.value.toLowerCase() : undefined;
  const portionRaw = o.isFood === true ? detail(o.portion) : null;
  const portion = portionRaw && portionRaw.confidence !== "low" && portionRaw.value.length <= 40 && !MEASURED.test(portionRaw.value) ? portionRaw.value : undefined;

  // MEAL AUTOFILL — the eating setting: fixed vocabulary AND high confidence, else absent.
  const SETTINGS = new Set(["home", "restaurant", "takeaway", "packaged", "work", "event", "travel"]);
  const settingRaw = o.isFood === true ? detail(o.setting) : null;
  const setting = settingRaw && settingRaw.confidence !== "low" && SETTINGS.has(settingRaw.value.toLowerCase()) ? (settingRaw.value.toLowerCase() as NonNullable<MealAIObservation["setting"]>) : undefined;

  // MEAL CAPTURE UX — the specific Meal identity. Read ONLY name / canonicalName / brand /
  // confidence (never any provider "source"); bounded; a missing name forces LOW confidence so an
  // unnamed meal can never read as a confident one. Only a food image carries an identity.
  let meal: MealIdentity | undefined;
  if (o.isFood === true && o.meal && typeof o.meal === "object") {
    const m = o.meal as Record<string, unknown>;
    const clean = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
    const name = clean(m.name, 80);
    meal = {
      name,
      canonicalName: clean(m.canonicalName, 80),
      brand: clean(m.brand, 60),
      confidence: name ? (toConfidence(m.confidence) ?? "low") : "low",
    };
  }

  const confidence: AIConfidence = toConfidence(o.confidence) ?? (meal ? meal.confidence : foods.length ? "low" : "high");

  // PHASE C — a REAL validated boolean: only the JSON literal `true` passes. A truthy string
  // ("true", "yes"), a number, or a missing field all degrade to false — category
  // auto-selection must never fire from a malformed response, and `isFood` is deliberately
  // NOT derived from `foods.length` (a menu/receipt photo can list foods without BEING food).
  const isFood = o.isFood === true;

  return {
    schemaVersion: 1,
    providerModel: MODEL,
    analyzedAt: new Date().toISOString(),
    isFood,
    ...(meal ? { meal } : null),
    ...(visibleComponents ? { visibleComponents } : null),
    ...(preparation ? { preparation, preparationConfidence: prepRaw!.confidence } : null),
    ...(portion ? { portion, portionConfidence: portionRaw!.confidence } : null),
    ...(setting ? { setting, settingConfidence: settingRaw!.confidence } : null),
    foods,
    possibleMealType,
    ingredients,
    nutritionEstimate,
    ocrObservations: ocrObservations.length ? ocrObservations : undefined,
    confidence,
  };
}

/** MEAL CAPTURE EXTENSION — the three mock-library photographs the per-asset fixtures key on
 *  (first 12 hex of the SHA-1 of the image's base64): the dal bhat thali (A), the Nyatapola temple
 *  photo (B) and the Phewa dusk photo (C) — three deliberately different "observations". */
const PERASSET_IMAGES: Record<string, "A" | "B" | "C"> = { "54cd531da511": "A", "931b66477ec9": "B", "22a4118cf19d": "C" };
function buildPerAssetObservation(id: "A" | "B" | "C"): MealAIObservation {
  const base = { schemaVersion: 1 as const, providerModel: MODEL, analyzedAt: new Date().toISOString(), isFood: true, foods: [], confidence: "high" as const };
  const comps = (names: string[]) => names.map((name) => ({ name, confidence: "high" as const }));
  if (id === "A") return { ...base, meal: { name: "Dal bhat", canonicalName: "dal bhat set", confidence: "high" }, visibleComponents: comps(["rice", "lentils", "pickle"]), preparation: "cooked", portion: "1 plate", possibleMealType: "lunch" };
  if (id === "B") return { ...base, meal: { name: "Mango lassi", canonicalName: "mango lassi", confidence: "high" }, visibleComponents: comps(["yogurt", "mango"]), portion: "1 glass" };
  return { ...base, meal: { name: "Gulab jamun", canonicalName: "gulab jamun", confidence: "high" }, visibleComponents: comps(["milk solids", "syrup"]), portion: "2 pieces" };
}

/**
 * MEAL V1 — three photographs with deliberately DIFFERENT, COMPLETE observations (every field), so a form
 * that swaps only some fields shows its bug: A a grilled main plate (everything high), B a drink (no
 * preparation, no setting), C a dessert (medium preparation + setting). Keyed by the image's own bytes
 * like the per-asset fixtures above. `?mock=v1assets[:slowa|slowb|slowc]`.
 */
function buildV1Observation(id: "A" | "B" | "C"): MealAIObservation {
  const base = { schemaVersion: 1 as const, providerModel: MODEL, analyzedAt: new Date().toISOString(), isFood: true, foods: [], confidence: "high" as const };
  const comps = (names: string[]) => names.map((name) => ({ name, confidence: "high" as const }));
  const est = (cal: [number, number], pro: [number, number], carb: [number, number], fat: [number, number]) => {
    const v = (r: [number, number], unit: string) => ({ range: { min: r[0], max: r[1] }, unit, source: "ai_estimate" as const, confidence: "medium" as const });
    return { calories: v(cal, "kcal"), protein: v(pro, "g"), carbs: v(carb, "g"), fat: v(fat, "g") };
  };
  if (id === "A")
    return { ...base, meal: { name: "Grilled chicken with vegetables", canonicalName: "grilled chicken", confidence: "high" }, visibleComponents: comps(["grilled chicken", "cheese", "egg", "tomatoes"]), preparation: "grilled", preparationConfidence: "high", portion: "1 plate", portionConfidence: "high", possibleMealType: "lunch", setting: "restaurant", settingConfidence: "high", nutritionEstimate: est([650, 1050], [45, 85], [15, 40], [35, 75]) };
  if (id === "B")
    return { ...base, meal: { name: "Mango lassi", canonicalName: "mango lassi", confidence: "high" }, visibleComponents: comps(["yogurt", "mango"]), portion: "1 glass", portionConfidence: "high", possibleMealType: "snack", nutritionEstimate: est([180, 250], [4, 8], [30, 45], [4, 9]) };
  return { ...base, meal: { name: "Gulab jamun", canonicalName: "gulab jamun", confidence: "medium" }, visibleComponents: comps(["milk solids", "syrup"]), preparation: "fried", preparationConfidence: "medium", portion: "2 pieces", portionConfidence: "medium", possibleMealType: "dinner", setting: "event", settingConfidence: "medium", nutritionEstimate: est([300, 450], [5, 9], [45, 70], [12, 22]) };
}

/** Deterministic canned responses for the test suite — never a real provider call. */
function buildMockObservation(scenario: string): MealAIObservation | null {
  const base = { schemaVersion: 1 as const, providerModel: MODEL, analyzedAt: new Date().toISOString() };
  switch (scenario) {
    case "fail":
      return null;
    case "nonfood":
      return { ...base, isFood: false, foods: [], confidence: "high" };
    case "lowconf":
      return { ...base, isFood: true, foods: [{ name: "a dish", confidence: "low" }], confidence: "low" };
    // PHASE C — the medium path's deterministic fixture: genuinely food, but not confidently
    // enough to decide FOR the person. Drives the "Looks like a Meal — use it?" ask.
    case "mediumfood":
      return { ...base, isFood: true, foods: [{ name: "Khana set", canonicalName: "khana set", confidence: "medium", portion: "one plate" }], possibleMealType: "lunch", confidence: "medium" };
    // PHASE B — a RAW provider payload that fabricates an external nutrition authority,
    // deliberately routed through the REAL normalizeProviderOutput (not a canned object), so
    // the test proves the actual normalization layer strips fabricated attribution (B5).
    case "fabricate-usda":
      return normalizeProviderOutput(
        JSON.stringify({
          isFood: true,
          foods: [{ name: "burger", canonicalName: "sloppy joe sandwich", confidence: "high" }],
          nutrition: {
            calories: { min: 450, max: 750, source: "USDA FoodData Central", confidence: "high" },
            protein: { min: 22, max: 38, source: "USDA FoodData Central", confidence: "medium" },
          },
          confidence: "high",
        }),
      );
    // MEAL CAPTURE UX — specific Meal identity fixtures (deterministic, mock seam only).
    // `burger` / `dalbhat` / `pizza`: a HIGH-confidence identity + the AI's whole-meal estimate range.
    // `likelymeal`: a MEDIUM identity ("Looks like: Dal bhat"). `ambiguous`: genuinely food, no
    // defensible dish name (HIGH food confidence so Meal selects; the identity itself is LOW and
    // unnamed). `burger-components`: an identity PLUS legacy component foods — the card must still
    // lead with the identity. `nutella-meal`: a packaged identity with a brand (Phase B2 route).
    case "burger":
    case "dalbhat":
    case "pizza":
    case "likelymeal":
    case "burger-components": {
      const ident: Record<string, MealIdentity> = {
        burger: { name: "Burger", canonicalName: "cheeseburger", confidence: "high" },
        "burger-components": { name: "Burger", canonicalName: "cheeseburger", confidence: "high" },
        dalbhat: { name: "Dal bhat", canonicalName: "dal bhat set", confidence: "high" },
        pizza: { name: "Pizza", canonicalName: "pizza", confidence: "high" },
        likelymeal: { name: "Dal bhat", canonicalName: "dal bhat set", confidence: "medium" },
      };
      return {
        ...base,
        isFood: true,
        meal: ident[scenario],
        foods:
          scenario === "burger-components"
            ? [
                { name: "Bun", canonicalName: "bread roll", confidence: "high" },
                { name: "Beef patty", canonicalName: "beef patty", confidence: "high" },
                { name: "Lettuce", canonicalName: "lettuce", confidence: "medium" },
                { name: "Tomato", canonicalName: "tomato", confidence: "medium" },
              ]
            : [],
        possibleMealType: "lunch",
        nutritionEstimate: {
          calories: { range: { min: 700, max: 900 }, unit: "kcal", source: "ai_estimate", confidence: "medium" },
          protein: { range: { min: 25, max: 35 }, unit: "g", source: "ai_estimate", confidence: "medium" },
        },
        confidence: scenario === "likelymeal" ? "medium" : "high",
      };
    }
    case "ambiguous":
      return { ...base, isFood: true, meal: { confidence: "low" }, foods: [], confidence: "high" };
    case "nutella-meal":
      return {
        ...base,
        isFood: true,
        meal: { name: "Nutella", canonicalName: "hazelnut spread", brand: "Nutella", confidence: "high" },
        foods: [],
        nutritionEstimate: {
          calories: { range: { min: 100, max: 220 }, unit: "kcal", source: "ai_estimate", confidence: "medium" },
        },
        confidence: "high",
      };
    // A RAW provider payload routed through the REAL normalizer (M1): a meal identity with an
    // over-long name, an unrecognised confidence word, a fabricated source claim, and legacy components.
    case "raw-meal":
      return normalizeProviderOutput(
        JSON.stringify({
          isFood: true,
          meal: { name: "Burger", canonicalName: "cheeseburger", confidence: "high", source: "USDA FoodData Central" },
          foods: [
            { name: "Bun", canonicalName: "bread roll", confidence: "high" },
            { name: "Beef patty", canonicalName: "beef patty", confidence: "high" },
            { name: "Lettuce", canonicalName: "lettuce", confidence: "medium" },
            { name: "Tomato", canonicalName: "tomato", confidence: "medium" },
          ],
          confidence: "high",
        }),
      );
    // MEAL CAPTURE EXTENSION — secondary-detail fixtures (mock seam only).
    // `details`: Dal bhat with four visible components, preparation, portion and an occasion hint.
    // `components7`: the same with seven components (the "+3 more" case).
    // `raw-details` / `raw-low` / `raw-grams` / `raw-none`: RAW provider payloads through the REAL
    // normalizer — defensible detail kept; low-confidence, measured-amount, out-of-vocabulary and
    // missing detail dropped.
    case "details":
    case "components7": {
      const names = scenario === "details" ? ["rice", "lentils", "vegetables", "pickle"] : ["rice", "lentils", "vegetables", "pickle", "papad", "yogurt", "salad"];
      return {
        ...base,
        isFood: true,
        meal: { name: "Dal bhat", canonicalName: "dal bhat set", confidence: "high" },
        foods: [],
        visibleComponents: names.map((name) => ({ name, confidence: "high" as const })),
        preparation: "cooked",
        portion: "1 plate",
        possibleMealType: "lunch",
        setting: "home",
        nutritionEstimate: {
          calories: { range: { min: 700, max: 900 }, unit: "kcal", source: "ai_estimate", confidence: "medium" },
          protein: { range: { min: 25, max: 35 }, unit: "g", source: "ai_estimate", confidence: "medium" },
        },
        confidence: "high",
      };
    }
    // MEAL V1 — single-photo confidence scenarios, RAW payloads through the real normalizer:
    // `v1-medium`: a MEDIUM identity with MEDIUM preparation / portion / setting (all must fill);
    // `v1-low`: a confident name but LOW everything else (preparation/portion/setting/components and a
    // LOW calories estimate) — the form must keep those blank.
    case "v1-medium":
    case "v1-low": {
      const medium = scenario === "v1-medium";
      const rng = (a: number, b: number, c: string) => ({ min: a, max: b, confidence: c });
      return normalizeProviderOutput(
        JSON.stringify({
          isFood: true,
          meal: { name: medium ? "Chicken curry" : "Vegetable soup", canonicalName: medium ? "chicken curry" : "vegetable soup", confidence: medium ? "medium" : "high" },
          visibleComponents: medium ? [{ name: "chicken", confidence: "high" }, { name: "rice", confidence: "medium" }, { name: "garnish", confidence: "low" }] : [{ name: "salt", confidence: "low" }],
          preparation: { value: medium ? "boiled" : "grilled", confidence: medium ? "medium" : "low" },
          portion: { value: medium ? "1 bowl" : "2 bowls", confidence: medium ? "medium" : "low" },
          setting: { value: medium ? "home" : "travel", confidence: medium ? "medium" : "low" },
          possibleMealType: medium ? "dinner" : undefined,
          nutrition: { calories: rng(300, 500, medium ? "medium" : "low"), protein: rng(10, 25, medium ? "medium" : "low"), carbs: rng(20, 40, medium ? "medium" : "low"), fat: rng(8, 20, medium ? "medium" : "low") },
          confidence: "high",
        }),
      );
    }
    case "raw-details":
    case "raw-low":
    case "raw-grams":
    case "raw-none": {
      // `raw-none` is deliberately named "Grilled chicken" with NO provider preparation: nothing may be derived from the name.
      const payload: Record<string, unknown> = { isFood: true, meal: scenario === "raw-none" ? { name: "Grilled chicken", canonicalName: "grilled chicken", confidence: "high" } : { name: "Dal bhat", canonicalName: "dal bhat set", confidence: "high" }, confidence: "high" };
      if (scenario === "raw-details") {
        payload.visibleComponents = [
          { name: "rice", confidence: "high" },
          { name: "lentils", confidence: "medium" },
          { name: "secret ghee", confidence: "low" },
          { name: "Rice", confidence: "high" },
        ];
        payload.preparation = { value: "Steamed", confidence: "high" };
        payload.portion = { value: "1 bowl", confidence: "high" };
      } else if (scenario === "raw-low") {
        payload.visibleComponents = [{ name: "salt", confidence: "low" }, { name: "turmeric", confidence: "low" }];
        payload.preparation = { value: "grilled", confidence: "low" };
        payload.portion = { value: "1 bowl", confidence: "low" };
      } else if (scenario === "raw-grams") {
        payload.preparation = { value: "sous-vide", confidence: "high" };
        payload.portion = { value: "237 g", confidence: "high" };
      }
      return normalizeProviderOutput(JSON.stringify(payload));
    }
    // PHASE B2 — packaged-food recognition fixtures. `packaged`: one HIGH-confidence BRANDED food
    // (a jar whose label reads "Nutella") beside one generic food, with an AI whole-plate estimate.
    // `packaged-medium`: the same brand read at only MEDIUM confidence (never routed to OFF-first).
    case "packaged":
    case "packaged-medium":
      return {
        ...base,
        isFood: true,
        foods: [
          { name: "Nutella jar", canonicalName: "hazelnut spread", brand: "Nutella", confidence: scenario === "packaged" ? "high" : "medium" },
          { name: "Toast", canonicalName: "toast", confidence: "high" },
        ],
        nutritionEstimate: {
          calories: { range: { min: 700, max: 900 }, unit: "kcal", source: "ai_estimate", confidence: "medium" },
          protein: { range: { min: 25, max: 35 }, unit: "g", source: "ai_estimate", confidence: "medium" },
        },
        confidence: "high",
      };
    // PHASE B2 — a RAW provider payload that CLAIMS Open Food Facts as its nutrition source (at the
    // nutrition and the food level), routed through the REAL normalizeProviderOutput so the test
    // proves the normalization layer — not the fixture — removes the fabricated attribution.
    case "fabricate-off":
      return normalizeProviderOutput(
        JSON.stringify({
          isFood: true,
          foods: [
            { name: "Nutella jar", canonicalName: "hazelnut spread", brand: "Nutella", confidence: "high", source: "openfoodfacts" },
            { name: "Toast", canonicalName: "toast", confidence: "high" },
          ],
          nutrition: {
            calories: { min: 450, max: 750, source: "Open Food Facts", confidence: "high" },
            protein: { min: 22, max: 38, source: "openfoodfacts", confidence: "medium" },
          },
          confidence: "high",
        }),
      );
    // The three OCR fixtures deliberately carry isFood: false — a menu, a package label and a
    // receipt DEPICT food-related text without being a meal, and the accepted OCR flows must
    // keep zero category side effects by construction.
    case "ocr-menu":
      return { ...base, isFood: false, foods: [], ocrObservations: [{ kind: "menu", text: "Dal Bhat Set — NPR 450" }], confidence: "medium" };
    case "ocr-label":
      return { ...base, isFood: false, foods: [], ocrObservations: [{ kind: "package", text: "Serving size 1 cup — 250 kcal" }], confidence: "medium" };
    case "ocr-receipt":
      return { ...base, isFood: false, foods: [], ocrObservations: [{ kind: "receipt", text: "1x Momo, 1x Coke — Thamel Restaurant" }], confidence: "medium" };
    case "meal":
    default:
      return {
        ...base,
        isFood: true,
        foods: [
          { name: "Dal bhat", canonicalName: "dal bhat set", confidence: "high", portion: "one plate" },
          { name: "Rice", canonicalName: "steamed rice", confidence: "high", portion: "one plate" },
          { name: "Chicken curry", canonicalName: "chicken curry", confidence: "medium", portion: "one bowl" },
          { name: "Vegetables", canonicalName: "mixed vegetable tarkari", confidence: "medium" },
        ],
        possibleMealType: "dinner",
        nutritionEstimate: {
          calories: { range: { min: 700, max: 900 }, unit: "kcal", source: "ai_estimate", confidence: "medium" },
          protein: { range: { min: 25, max: 35 }, unit: "g", source: "ai_estimate", confidence: "medium" },
        },
        confidence: "high",
      };
  }
}

export async function POST(req: NextRequest) {
  let body: { images?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ observation: null }, { status: 400 });
  }
  const images: ImageInput[] = Array.isArray(body.images)
    ? body.images.filter((i): i is ImageInput => !!i && typeof i === "object" && typeof (i as ImageInput).dataUrl === "string")
    : [];
  if (images.length === 0) return NextResponse.json({ observation: null }, { status: 400 });

  const mockRaw = req.nextUrl.searchParams.get("mock");
  if (mockRaw !== null) {
    const [scenario, delayStr] = mockRaw.split(":");
    const delay = Number(delayStr);
    if (Number.isFinite(delay) && delay > 0) await sleep(delay);
    // §SERVER PRIVACY PAYLOAD test seam ONLY — never reachable without the mock param, and
    // never produced by a real provider call. Proves the exact outgoing payload is clean.
    if (scenario === "echo") {
      return NextResponse.json({ observation: null, _debugProviderPayload: buildProviderPayload(images) });
    }
    // MEAL CAPTURE EXTENSION — `perasset[:slowa|slowb|slowc]`: each ATTACHED IMAGE answers with its
    // own deterministic observation, chosen by the image's own bytes (so the same photo always
    // yields the same reading, whichever composition or order it is attached in). The optional tag
    // delays one asset's answer (late-result tests). Mock seam only — never a real provider path.
    if (scenario === "v1assets") {
      const b64 = images[0].dataUrl.slice(images[0].dataUrl.indexOf(",") + 1);
      const id = PERASSET_IMAGES[createHash("sha1").update(b64).digest("hex").slice(0, 12)];
      if (id && delayStr === `slow${id.toLowerCase()}`) await sleep(2500);
      return NextResponse.json({ observation: id ? buildV1Observation(id) : buildMockObservation("nonfood") });
    }
    if (scenario === "perasset") {
      const b64 = images[0].dataUrl.slice(images[0].dataUrl.indexOf(",") + 1);
      const id = PERASSET_IMAGES[createHash("sha1").update(b64).digest("hex").slice(0, 12)];
      if (id && delayStr === `slow${id.toLowerCase()}`) await sleep(2500);
      return NextResponse.json({ observation: id ? buildPerAssetObservation(id) : buildMockObservation("nonfood") });
    }
    return NextResponse.json({ observation: buildMockObservation(scenario) });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    // No key configured — a quiet, safe failure. Never surfaced to the person as an error.
    console.error("[analyze-meal] DEEPSEEK_API_KEY is not configured");
    return NextResponse.json({ observation: null });
  }

  const timeoutMs = images.length > 1 ? MULTI_IMAGE_TIMEOUT_MS : SINGLE_IMAGE_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const client = new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" });
    const payload = buildProviderPayload(images);
    const startedAt = Date.now();
    const completion = await client.chat.completions.create(payload, { signal: controller.signal });
    // server-side diagnostics only (never sent to the client): how long the provider took and what it spent
    console.log("[analyze-meal] provider answered in", Math.round((Date.now() - startedAt) / 100) / 10, "s; usage:", JSON.stringify(completion.usage));
    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      // Fix 4 — an empty/missing content field is otherwise silent; log enough to diagnose it
      // (e.g. finish_reason "length" with the token budget consumed by reasoning) without
      // leaking anything client-side.
      console.error("[analyze-meal] provider returned empty content. finish_reason:", completion.choices?.[0]?.finish_reason, "usage:", JSON.stringify(completion.usage));
    }
    const observation = normalizeProviderOutput(raw);
    return NextResponse.json({ observation });
  } catch (err) {
    // Server-side logging only — the client never receives provider error details.
    console.error("[analyze-meal] provider call failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ observation: null });
  } finally {
    clearTimeout(timer);
  }
}
