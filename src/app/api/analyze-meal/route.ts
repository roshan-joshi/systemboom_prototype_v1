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
import OpenAI from "openai";
import type { AIConfidence, MealAIObservation, NutritionEstimate, NutritionValue, ObservedFood, OcrObservation } from "@/components/style-lab/social/data";

const MODEL = "deepseek-flash";
const SINGLE_IMAGE_TIMEOUT_MS = 10_000;
const MULTI_IMAGE_TIMEOUT_MS = 20_000;

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
    "Identify visible foods/drinks, a likely meal type if the image makes it evident, " +
    "approximate portion cues (e.g. \"one plate\", \"two pieces\" — never a fabricated exact " +
    "weight), and any visible text on a menu, package label, or receipt. Respond with ONLY a " +
    "JSON object, no prose, matching exactly:\n" +
    "{\n" +
    '  "foods": [{"name": string, "confidence": "high"|"medium"|"low", "portion"?: string}],\n' +
    '  "possibleMealType"?: "breakfast"|"lunch"|"dinner"|"snack",\n' +
    '  "ingredients"?: string[],\n' +
    '  "nutrition"?: {"calories"?: {"min": number, "max": number}, "protein"?: {"min": number, "max": number}, "carbs"?: {"min": number, "max": number}, "fat"?: {"min": number, "max": number}},\n' +
    '  "ocr"?: [{"kind": "menu"|"package"|"receipt", "text": string}],\n' +
    '  "confidence": "high"|"medium"|"low"\n' +
    "}\n" +
    'If the image is not meaningfully food-related, return {"foods": [], "confidence": "high"} ' +
    "and omit every other key. Never invent a fact you cannot actually see. Prefer a min/max " +
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
  return { range: { min, max }, unit, source: "ai_visual_estimate", confidence: toConfidence(o.confidence) ?? "medium" };
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

  const confidence: AIConfidence = toConfidence(o.confidence) ?? (foods.length ? "low" : "high");

  return {
    schemaVersion: 1,
    providerModel: MODEL,
    analyzedAt: new Date().toISOString(),
    foods,
    possibleMealType,
    ingredients,
    nutritionEstimate,
    ocrObservations: ocrObservations.length ? ocrObservations : undefined,
    confidence,
  };
}

/** Deterministic canned responses for the test suite — never a real provider call. */
function buildMockObservation(scenario: string): MealAIObservation | null {
  const base = { schemaVersion: 1 as const, providerModel: MODEL, analyzedAt: new Date().toISOString() };
  switch (scenario) {
    case "fail":
      return null;
    case "nonfood":
      return { ...base, foods: [], confidence: "high" };
    case "lowconf":
      return { ...base, foods: [{ name: "a dish", confidence: "low" }], confidence: "low" };
    case "ocr-menu":
      return { ...base, foods: [], ocrObservations: [{ kind: "menu", text: "Dal Bhat Set — NPR 450" }], confidence: "medium" };
    case "ocr-label":
      return { ...base, foods: [], ocrObservations: [{ kind: "package", text: "Serving size 1 cup — 250 kcal" }], confidence: "medium" };
    case "ocr-receipt":
      return { ...base, foods: [], ocrObservations: [{ kind: "receipt", text: "1x Momo, 1x Coke — Thamel Restaurant" }], confidence: "medium" };
    case "meal":
    default:
      return {
        ...base,
        foods: [
          { name: "Dal bhat", confidence: "high", portion: "one plate" },
          { name: "Rice", confidence: "high", portion: "one plate" },
          { name: "Chicken curry", confidence: "medium", portion: "one bowl" },
          { name: "Vegetables", confidence: "medium" },
        ],
        possibleMealType: "dinner",
        nutritionEstimate: {
          calories: { range: { min: 700, max: 900 }, unit: "kcal", source: "ai_visual_estimate", confidence: "medium" },
          protein: { range: { min: 25, max: 35 }, unit: "g", source: "ai_visual_estimate", confidence: "medium" },
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
    const completion = await client.chat.completions.create(payload, { signal: controller.signal });
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
