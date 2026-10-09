/**
 * PHASE B — the Composer's ONLY structured-nutrition boundary. "AI recognizes. USDA supplies
 * facts. AI estimates only as fallback." The browser talks ONLY to this route; it never calls
 * USDA directly, and the key never reaches client code (read here, server-side, and nowhere
 * else — never `NEXT_PUBLIC_`, never imported by a "use client" file; same contract as
 * `/api/analyze-meal`'s DEEPSEEK_API_KEY).
 *
 * PRIVACY: the request this route builds for USDA carries ONLY the factual lookup material —
 * the food's canonical lookup name plus fixed search parameters. No identity, filename, GPS,
 * caption, sourceMetadata, or account information is ever read from, or forwarded on behalf
 * of, the request that reaches this route. Provable via the `?mock=echo` seam below.
 *
 * PROVIDER: USDA FoodData Central search, `https://api.nal.usda.gov/fdc/v1/foods/search`.
 * The response is normalized into SYSTEMBOOM's own `FoodFacts` shape — `source: "usda"`,
 * `fdcId` preserved, calories/protein/carbs/fat with units, per-100 g basis, retrieval
 * timestamp. No acceptable match → `{ facts: null }`. Timeout 5 s. Failure → `{ facts:
 * null }` with server-side logging only — never a technical user error.
 *
 * `?mock=<scenario>` is the test-only determinism seam (same convention as `/api/geocode`'s
 * `?mock=1` and `/api/analyze-meal`'s `?mock=`): `found` (a canned fact set), `miss`
 * (`{facts: null}`, HTTP 200), `fail` (HTTP 500 — exercises the client's failure path),
 * `echo` (the exact outgoing USDA request shape with the api_key REDACTED — the privacy
 * proof). The Composer sends it only when the page itself was loaded with `?mockfacts=`.
 */
import { request as httpsRequest } from "node:https";
import { NextRequest, NextResponse } from "next/server";
import type { FoodFacts } from "@/components/style-lab/social/data";

const USDA_HOST = "api.nal.usda.gov";
const USDA_SEARCH_PATH = "/fdc/v1/foods/search";
const USDA_SEARCH_URL = `https://${USDA_HOST}${USDA_SEARCH_PATH}`;
const TIMEOUT_MS = 5_000;

/** The exact, minimal search request — its own function so `?mock=echo` can show precisely
 *  what would be sent (with the key redacted): only factual lookup material, nothing else. */
function buildSearchRequest(canonicalName: string) {
  return {
    url: `${USDA_SEARCH_URL}?api_key=[REDACTED]`,
    method: "POST" as const,
    body: {
      query: canonicalName,
      // Curated/typical data first — Branded entries are noisy for generic foods.
      dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)"],
      pageSize: 5,
    },
  };
}

/** A normalized USDA entry before the selection verdict (`match`/`basedOn`) is attached. */
type FoodFactsBase = Omit<FoodFacts, "match" | "basedOn">;

interface UsdaNutrient {
  nutrientId?: number;
  nutrientNumber?: string;
  nutrientName?: string;
  unitName?: string;
  value?: number;
}
interface UsdaFood {
  fdcId?: number;
  description?: string;
  foodNutrients?: UsdaNutrient[];
}

function nutrientValue(nutrients: UsdaNutrient[], numbers: string[], names: RegExp, unit?: RegExp): number | undefined {
  const hit = nutrients.find(
    (n) =>
      typeof n.value === "number" &&
      Number.isFinite(n.value) &&
      ((n.nutrientNumber !== undefined && numbers.includes(String(n.nutrientNumber))) || (typeof n.nutrientName === "string" && names.test(n.nutrientName))) &&
      (!unit || (typeof n.unitName === "string" && unit.test(n.unitName))),
  );
  return hit?.value;
}

/** Normalizes one USDA search food into SYSTEMBOOM's own `FoodFacts` — or null if the entry
 *  carries nothing usable. USDA search nutrients are reported per 100 g. */
function normalizeUsdaFood(food: UsdaFood): FoodFactsBase | null {
  if (!food || typeof food.fdcId !== "number" || !Array.isArray(food.foodNutrients)) return null;
  const n = food.foodNutrients;
  // Energy (adversarial finding #3): Foundation foods often report energy ONLY as the Atwater
  // rows — "Energy (Atwater General Factors)" (957) / "Energy (Atwater Specific Factors)"
  // (958) — so match 208/957/958 and any name BEGINNING "Energy", still strictly in KCAL
  // (a kJ-only row is skipped, never unit-converted — no fabricated transforms).
  const calories = nutrientValue(n, ["208", "957", "958"], /^energy/i, /^kcal$/i);
  const protein = nutrientValue(n, ["203"], /^protein$/i);
  const carbs = nutrientValue(n, ["205"], /^carbohydrate, by difference$/i);
  const fat = nutrientValue(n, ["204"], /^total lipid \(fat\)$/i);
  if (calories === undefined && protein === undefined && carbs === undefined && fat === undefined) return null;
  return {
    source: "usda",
    fdcId: food.fdcId,
    matchedName: typeof food.description === "string" && food.description.trim() ? food.description.trim().slice(0, 120) : "(unnamed)",
    nutrition: { calories, protein, carbs, fat },
    units: { calories: "kcal", protein: "g", carbs: "g", fat: "g" },
    basis: "per 100 g",
    retrievedAt: new Date().toISOString(),
  };
}

/**
 * Test-only candidate fixtures (`?mock=fixture-<name>`): a USDA-search-shaped candidate list, in
 * USDA-like order, run through the SAME selection code the real path uses — so a test proves the
 * actual ranking/classification, not a canned answer. Real FDC ids/values appear where they were
 * observed live (2026-10-02); invented entries carry synthetic ids (9,000,000+).
 */
type NutrientSpec = { kcal?: number; protein?: number; carbs?: number; fat?: number };
function fx(fdcId: number, description: string, n: NutrientSpec): UsdaFood {
  const rows: UsdaNutrient[] = [];
  if (n.kcal !== undefined) rows.push({ nutrientNumber: "208", nutrientName: "Energy", unitName: "KCAL", value: n.kcal });
  if (n.protein !== undefined) rows.push({ nutrientNumber: "203", nutrientName: "Protein", unitName: "G", value: n.protein });
  if (n.carbs !== undefined) rows.push({ nutrientNumber: "205", nutrientName: "Carbohydrate, by difference", unitName: "G", value: n.carbs });
  if (n.fat !== undefined) rows.push({ nutrientNumber: "204", nutrientName: "Total lipid (fat)", unitName: "G", value: n.fat });
  return { fdcId, description, foodNutrients: rows };
}
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const BANANA_POWDER = () => fx(173945, "Bananas, dehydrated, or banana powder", { kcal: 346, protein: 3.89, carbs: 88.3, fat: 1.81 });
const BANANA_RAW = () => fx(2709224, "Banana, raw", { kcal: 97, protein: 0.74, carbs: 22.71, fat: 0.28 });
const BANANA_BAKED = () => fx(2709225, "Banana, baked", { kcal: 161, protein: 0.82, carbs: 32.43, fat: 3.21 });
const BANANA_CHIPS = () => fx(2709200, "Banana chips", { kcal: 519, protein: 2.3, carbs: 58.4, fat: 33.6 });
const SPINACH_CREAMED = () => fx(2709628, "Spinach, creamed", { kcal: 90, protein: 2.39, carbs: 6.11, fat: 6.09 });
const SPINACH_RAW = () => fx(2709614, "Spinach, raw", { kcal: 27, protein: 2.85, carbs: 2.41, fat: 0.62 });
const SPINACH_CANNED = () => fx(9000101, "Spinach, canned", { kcal: 23, protein: 2.97, carbs: 3.5, fat: 0.5 });
const soupPair = (a: number, b: number): UsdaFood[] => [
  fx(9000701, "Soup, chicken", { kcal: a, protein: 3, carbs: 5, fat: 2 }),
  fx(9000702, "Soup, beef", { kcal: b, protein: 4, carbs: 6, fat: 3 }),
];
const FIXTURES: Record<string, (query: string) => UsdaFood[]> = {
  banana: () => [BANANA_POWDER(), BANANA_RAW(), BANANA_BAKED()],
  "banana-late": () => [BANANA_RAW(), BANANA_BAKED(), BANANA_POWDER()],
  spinach: () => [SPINACH_CREAMED(), SPINACH_RAW(), SPINACH_CANNED()],
  "spinach-late": () => [SPINACH_RAW(), SPINACH_CANNED(), SPINACH_CREAMED()],
  // the semantically right candidate is the LESS complete one (no fat)
  completeness: () => [fx(2709224, "Banana, raw", { kcal: 97, protein: 0.74, carbs: 22.71 }), BANANA_POWDER()],
  weak: () => [BANANA_POWDER(), BANANA_BAKED(), BANANA_CHIPS()],
  minor: () => [BANANA_BAKED(), BANANA_CHIPS()],
  exact: () => [BANANA_RAW(), BANANA_BAKED()],
  sloppyjoe: () => [
    fx(2706884, "Sloppy joe sandwich, on wheat bun", { kcal: 180, protein: 11.85, carbs: 18.43, fat: 6.44 }),
    fx(2706883, "Sloppy joe sandwich, on white bun", { kcal: 185, protein: 11.32, carbs: 19.95, fat: 6.42 }),
    fx(2706378, "Sloppy joe, no bun", { kcal: 140, protein: 12.06, carbs: 5.48, fat: 7.63 }),
    fx(2708171, "Crackers, sandwich", { kcal: 494, protein: 11.47, carbs: 58.38, fat: 24.54 }),
    fx(2706973, "Cuban sandwich", { kcal: 228, protein: 15.86, carbs: 16.3, fat: 10.69 }),
  ],
  // Real pages observed live (2026-10-02) that the first correction round leaked a wrong number on:
  ambiguous: () => [
    fx(747997, "Eggs, Grade A, Large, egg white", { kcal: 55, protein: 10.7, carbs: 2.36, fat: 0 }),
    fx(748967, "Eggs, Grade A, Large, egg whole", { kcal: 148, protein: 12.4, carbs: 0.96, fat: 9.96 }),
    fx(748236, "Eggs, Grade A, Large, egg yolk", { kcal: 334, protein: 16.2, carbs: 1.02, fat: 28.8 }),
    fx(2707180, "Egg, Benedict", { kcal: 288, protein: 13.81, carbs: 8.48, fat: 22.1 }),
    fx(2707179, "Egg, creamed", { kcal: 148, protein: 7.79, carbs: 5.52, fat: 10.35 }),
  ],
  meatless: () => [
    fx(2707466, "Bacon bits", { kcal: 476, protein: 32, carbs: 28.6, fat: 25.9 }),
    fx(172439, "Bacon, meatless", { kcal: 309, protein: 11.7, carbs: 5.31, fat: 29.5 }),
    fx(2705856, "Beef, bacon, cooked", { kcal: 449, protein: 31.3, carbs: 1.4, fat: 34.4 }),
    fx(2706135, "Turkey bacon, cooked", { kcal: 368, protein: 29.5, carbs: 4.24, fat: 25.87 }),
    fx(174602, "Bacon and beef sticks", { kcal: 517, protein: 29.1, carbs: 0.8, fat: 44.2 }),
  ],
  composed: () => [
    fx(2708990, "Beans and white rice", { kcal: 164, protein: 6.5, carbs: 25.19, fat: 4.21 }),
    fx(2708422, "Rice, white, cooked, glutinous", { kcal: 96, protein: 2.01, carbs: 20.97, fat: 0.19 }),
    fx(2708994, "Black beans and white rice", { kcal: 160, protein: 6.01, carbs: 24.42, fat: 4.32 }),
  ],
  // Review-driven fixtures (ids observed live where real, otherwise synthetic 9,000,000+):
  // real page observed live (2026-10-02): the group-first-name heuristic matched "tofu" to the fish-tempura dish
  tofu: () => [
    fx(167722, "Tofu yogurt", { kcal: 94, protein: 3.5, carbs: 16, fat: 1.8 }),
    fx(172451, "Tofu, fried", { kcal: 270, protein: 18.8, carbs: 8.86, fat: 20.2 }),
    fx(167695, "Mayonnaise, made with tofu", { kcal: 322, protein: 5.95, carbs: 3.06, fat: 31.8 }),
    fx(2707455, "Soup, miso or tofu", { kcal: 24, protein: 2.21, carbs: 2.3, fat: 0.85 }),
    fx(2706844, "Fish, tofu, and vegetables, tempura", { kcal: 177, protein: 4.01, carbs: 4.53, fat: 16 }),
  ],
  "peach-plural": () => [
    fx(169928, "Peaches, yellow, raw", { kcal: 39, protein: 0.91, carbs: 9.54, fat: 0.25 }),
    fx(9000401, "Peach, frozen", { kcal: 55, protein: 0.6, carbs: 14, fat: 0.1 }),
  ],
  "peach-singular": () => [fx(9000402, "Peach, raw", { kcal: 39, protein: 0.91, carbs: 9.54, fat: 0.25 })],
  cookedmethod: () => [
    fx(9000501, "Chicken, fried, cooked", { kcal: 246, protein: 24, carbs: 8, fat: 13 }),
    fx(9000502, "Egg, whole, cooked, fried", { kcal: 196, protein: 13.6, carbs: 0.83, fat: 14.8 }),
  ],
  // tie-break order: token overlap → nutrition completeness → USDA order
  "tie-overlap": () => [
    fx(9000601, "Rice, white, long-grain, regular, enriched", { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 }),
    fx(9000602, "Rice, white", { kcal: 129, protein: 2.7, carbs: 28 }),
  ],
  "tie-completeness": () => [
    fx(9000611, "Rice, white", { kcal: 129, protein: 2.7, carbs: 28 }),
    fx(9000612, "Rice, brown", { kcal: 123, protein: 2.7, carbs: 25.6, fat: 1 }),
  ],
  "tie-order": () => [
    fx(9000621, "Rice, white", { kcal: 129, protein: 2.7, carbs: 28, fat: 0.3 }),
    fx(9000622, "Rice, brown", { kcal: 123, protein: 2.7, carbs: 25.6, fat: 1 }),
  ],
  // the same-rank agreement guard's boundaries (ratio 1.25, floor 25 kcal)
  "agree-124": () => soupPair(100, 124),
  "agree-130": () => soupPair(100, 130),
  "agree-floor": () => soupPair(5, 20),
  // energy extraction: Atwater-only rows (957/958 KCAL) and a kJ-only row (never taken as kcal)
  energyatwater: () => [
    {
      fdcId: 9200001,
      description: "Spinach, raw",
      foodNutrients: [
        { nutrientNumber: "957", nutrientName: "Energy (Atwater General Factors)", unitName: "KCAL", value: 26.6 },
        { nutrientNumber: "958", nutrientName: "Energy (Atwater Specific Factors)", unitName: "KCAL", value: 20.7 },
        { nutrientNumber: "203", nutrientName: "Protein", unitName: "G", value: 2.85 },
        { nutrientNumber: "205", nutrientName: "Carbohydrate, by difference", unitName: "G", value: 2.41 },
        { nutrientNumber: "204", nutrientName: "Total lipid (fat)", unitName: "G", value: 0.619 },
      ],
    },
  ],
  energykj: () => [
    {
      fdcId: 9200002,
      description: "Spinach, raw",
      foodNutrients: [
        { nutrientNumber: "268", nutrientName: "Energy", unitName: "kJ", value: 111 },
        { nutrientNumber: "203", nutrientName: "Protein", unitName: "G", value: 2.85 },
      ],
    },
  ],
  // query-derived fixtures: drive the real client + renderer through each classification
  "ui-confident": (q) => [fx(9100001, titleCase(q), { kcal: 120, protein: 4, carbs: 20, fat: 2 })],
  // "frozen" is a SAFE preparation that never collides with a preparation word already inside one of the
  // four lookup names ("steamed rice" carries the cooked family; a ", baked" candidate for it would —
  // correctly — be a different preparation, not a minor one)
  "ui-likely": (q) => [fx(9100002, `${titleCase(q)}, frozen`, { kcal: 150, protein: 5, carbs: 22, fat: 4 })],
  "ui-uncertain": (q) => [fx(9100003, `${titleCase(q)}, dehydrated`, { kcal: 350, protein: 9, carbs: 80, fat: 2 }), fx(9100004, `${titleCase(q)}, baked`, { kcal: 150, protein: 5, carbs: 22, fat: 4 })],
};
const MAX_MOCK_DELAY_MS = 10_000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------------------------------------
 * SEMANTIC SELECTION + CONFIDENCE GATE (Phase B correction).
 *
 * The accepted Phase B rule scored candidates by nutrition COMPLETENESS and broke ties by USDA's
 * own order, so live USDA published "Bananas, dehydrated, or banana powder" (346 kcal) for
 * "banana" and "Spinach, creamed" for "spinach" as plain fact. Now: rank by what the candidate
 * IS, then classify how far to trust the winner.
 *
 *   rank 1  exact        the candidate's primary name equals the query's food words, and it
 *                        carries exactly the preparation the query asked for
 *   rank 2  common name  contains the query's food words, no preparation on either side
 *   rank 3  common name  contains them, and its preparation MATCHES the query's
 *   rank 4  common name  contains them, but its preparation DIFFERS from the query's
 *   rank 5  no common-name match (token overlap only)
 *   then, in order: token overlap (Jaccard) → nutrition completeness → USDA relevance order.
 *
 * A candidate whose PRIMARY name (USDA writes the food first: "Banana, raw") carries extra food
 * words of its own — "Banana chips", "Spinach souffle", "Cuban sandwich" — is a different food,
 * not a descriptor of the queried one, and never counts as a common-name match.
 * raw / fresh / plain are the natural state, so they are neutral, never a qualifier. Everything
 * else on the owner's list is a preparation qualifier, folded into families so the query's
 * "steamed rice" meets USDA's "cooked" and "banana powder" meets "dehydrated".
 *
 * Verdict: CONFIDENT (ranks 1–3 — publish clean), LIKELY (rank 4 with a SAFE difference —
 * publish with "based on …"), UNCERTAIN (no common-name match, a MATERIAL difference, the query's
 * own preparation missing from the winner, or tied candidates with different preparations —
 * publish NO number). Missing = nothing usable on the page at all (a plain miss).
 * ---------------------------------------------------------------------------------------- */

const STOP_WORDS = new Set(["the", "a", "an", "of", "and", "or", "in", "on", "with", "for", "to"]);
const NEUTRAL_WORDS = new Set(["raw", "fresh", "plain"]);
const QUALIFIER_FAMILY = new Map<string, string>(
  Object.entries({
    cooked: "cooked", boiled: "cooked", steamed: "cooked",
    baked: "baked", roasted: "roasted", grilled: "grilled", fried: "fried", canned: "canned",
    dried: "dried", dehydrated: "dried", powdered: "dried", powder: "dried",
    creamed: "creamed", frozen: "frozen", juice: "juice", concentrate: "concentrate",
    baby: "baby", strained: "strained", sweetened: "sweetened", unsweetened: "unsweetened",
  }),
); // a Map, never a plain object: a food word like "constructor" must not read an inherited member
/** Preparations that change what the food IS nutritionally (water removed, fat/sugar/cream added,
 *  syrup/brine, a drink instead of the food). A winner that differs by one of these is never
 *  published as the queried food's fact. The rest (cooked, baked, frozen, a variety word like
 *  "baby") are safe to publish WITH the qualifier shown. */
const MATERIAL_FAMILIES = new Set(["dried", "concentrate", "juice", "creamed", "fried", "sweetened", "canned", "strained"]);
/** Descriptors that say the entry is NOT the food (the vegetarian stand-in, the imitation). A candidate
 *  carrying one the query did not itself ask for is a different food, never a common-name match —
 *  found live: "Bacon, meatless" and "Chicken, meatless, breaded, fried" both passed as "bacon" /
 *  "fried chicken". */
const NEGATING_WORDS = new Set(["meatless", "imitation", "substitute", "vegetarian", "vegan", "analog", "analogue"]);
/** Same-rank candidates whose calories disagree by more than this ratio (and by more than the
 *  floor, so near-zero foods never trip it) mean the common name alone does not identify ONE food
 *  — found live: "egg" → white 55 / whole 148 / yolk 334 / Benedict 288 kcal. Tiny differences
 *  (wheat bun 180 vs white bun 185) are not ambiguity. */
const AGREEMENT_RATIO = 1.25;
const AGREEMENT_FLOOR_KCAL = 25;

/** Lowercase ASCII words of a text — diacritics folded first (jalapeño → jalapeno), everything else
 *  that is not a letter treated as a separator. */
function plainWords(text: string): string[] {
  return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
}

/** Plural folding shared by the query and every candidate, so singular and plural of the same
 *  word always meet at one stem (peach/peaches, radish/radishes, sandwich/sandwiches, cookie/
 *  cookies, potato/potatoes). The folded form is only ever compared, never displayed. */
function fold(word: string): string {
  if (word.length > 4 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && /(ch|sh|x|ss|z|o)es$/.test(word)) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith("ie")) return `${word.slice(0, -2)}y`;
  if (word.length > 3 && word.endsWith("s") && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
  return word;
}

interface ParsedText {
  /** food words of the first comma segment — USDA's primary name */
  primary: Set<string>;
  /** food words of every later segment — descriptors */
  descriptors: Set<string>;
  /** preparation-qualifier families */
  quals: Set<string>;
}
function parseFoodText(text: string): ParsedText {
  const out: ParsedText = { primary: new Set(), descriptors: new Set(), quals: new Set() };
  text.split(",").forEach((segment, i) => {
    for (const raw of plainWords(segment)) {
      const w = fold(raw);
      if (STOP_WORDS.has(w) || NEUTRAL_WORDS.has(w)) continue;
      const family = QUALIFIER_FAMILY.get(w);
      if (family) out.quals.add(family);
      else (i === 0 ? out.primary : out.descriptors).add(w);
    }
  });
  // USDA writes "Egg, whole, cooked, fried": "cooked" is implied by the named method, not a second
  // preparation — otherwise fried egg would never match "fried egg".
  if (out.quals.has("cooked") && ["baked", "roasted", "grilled", "fried"].some((m) => out.quals.has(m))) out.quals.delete("cooked");
  return out;
}
const sameSet = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((x) => b.has(x));

interface Candidate {
  facts: FoodFactsBase;
  description: string;
  index: number;
  completeness: number;
  rank: 1 | 2 | 3 | 4 | 5;
  overlap: number;
  quals: Set<string>;
  /** descriptor words the query never asked for ("on wheat bun", "with potatoes") */
  extraDescriptors: number;
}

/** Every usable candidate, best first. */
function rankCandidates(canonicalName: string, foods: UsdaFood[]): Candidate[] {
  const q = parseFoodText(canonicalName);
  const heads = new Set([...q.primary, ...q.descriptors]);
  const wanted = q.quals;
  const out: Candidate[] = [];
  foods.forEach((food, index) => {
    const facts = normalizeUsdaFood(food);
    if (!facts) return;
    const description = typeof food.description === "string" ? food.description : "";
    const c = parseFoodText(description);
    const nameMatch =
      heads.size > 0 &&
      [...heads].every((t) => c.primary.has(t) || c.descriptors.has(t)) &&
      [...c.primary].every((t) => heads.has(t)) &&
      ![...c.primary, ...c.descriptors].some((t) => NEGATING_WORDS.has(t) && !heads.has(t));
    const extraDescriptors = [...c.descriptors].filter((t) => !heads.has(t));
    const rank: Candidate["rank"] = !nameMatch ? 5 : !sameSet(c.quals, wanted) ? 4 : extraDescriptors.length === 0 ? 1 : wanted.size === 0 ? 2 : 3;
    const a = new Set([...heads, ...wanted]);
    const b = new Set([...c.primary, ...c.descriptors, ...c.quals]);
    const shared = [...a].filter((t) => b.has(t)).length;
    const overlap = Math.round((shared / (a.size + b.size - shared || 1)) * 10_000) / 10_000;
    const completeness =
      (facts.nutrition.calories !== undefined ? 4 : 0) +
      (facts.nutrition.protein !== undefined ? 1 : 0) +
      (facts.nutrition.carbs !== undefined ? 1 : 0) +
      (facts.nutrition.fat !== undefined ? 1 : 0);
    out.push({ facts, description, index, completeness, rank, overlap, quals: c.quals, extraDescriptors: extraDescriptors.length });
  });
  return out.sort((x, y) => x.rank - y.rank || y.overlap - x.overlap || y.completeness - x.completeness || x.index - y.index);
}

type Verdict =
  | { kind: "confident"; chosen: Candidate; reason: string }
  | { kind: "likely"; chosen: Candidate; basedOn: string; reason: string }
  | { kind: "uncertain"; reason: string };

/** A short, human "based on …" phrase — the winner's preparation words plus its food name,
 *  never the full USDA description. */
function basedOnPhrase(description: string, differing: string[]): string {
  const prep: string[] = [];
  for (const w of plainWords(description)) {
    const family = QUALIFIER_FAMILY.get(fold(w));
    if (family && differing.includes(family) && !prep.includes(w)) prep.push(w);
  }
  const head = plainWords(description.split(",")[0]).filter((w) => !STOP_WORDS.has(fold(w)) && !NEUTRAL_WORDS.has(fold(w)) && !QUALIFIER_FAMILY.has(fold(w))).slice(0, 3);
  return [...prep, ...head].slice(0, 4).join(" ");
}

function judge(canonicalName: string, ranked: Candidate[]): Verdict | null {
  const best = ranked[0];
  if (!best) return null;
  if (best.rank <= 3) {
    const kcal = ranked.filter((r) => r.rank === best.rank).map((r) => r.facts.nutrition.calories).filter((v): v is number => typeof v === "number");
    const lo = Math.min(...kcal);
    const hi = Math.max(...kcal);
    if (kcal.length >= 2 && hi - lo > AGREEMENT_FLOOR_KCAL && hi > lo * AGREEMENT_RATIO) return { kind: "uncertain", reason: `same-rank candidates disagree (${lo}–${hi} kcal): the name alone does not identify one food` };
    return { kind: "confident", chosen: best, reason: ["", "exact name", "common name, no preparation", "common name, preparation matches"][best.rank] };
  }
  if (best.rank === 5) return { kind: "uncertain", reason: "no candidate matches the common name" };
  const wanted = parseFoodText(canonicalName).quals;
  const missing = [...wanted].filter((f) => !best.quals.has(f));
  const extra = [...best.quals].filter((f) => !wanted.has(f));
  if (missing.length > 0) return { kind: "uncertain", reason: `the winner lacks the preparation asked for (${missing.join(", ")})` };
  const material = extra.filter((f) => MATERIAL_FAMILIES.has(f));
  if (material.length > 0) return { kind: "uncertain", reason: `the winner's preparation materially changes the food (${material.join(", ")})` };
  // A "likely" match is the queried food prepared differently — nothing more. A winner that also
  // carries descriptors of its own ("fried, with potatoes, vegetable, frozen meal", "glutinous")
  // is a different or composed food: no number.
  if (best.extraDescriptors > 0) return { kind: "uncertain", reason: "the winner is more than the food prepared differently (it carries its own descriptors)" };
  const tied = ranked.slice(1).some((r) => r.rank === 4 && r.overlap === best.overlap && !sameSet(r.quals, best.quals));
  if (tied) return { kind: "uncertain", reason: "tied candidates differ in preparation" };
  return { kind: "likely", chosen: best, basedOn: basedOnPhrase(best.description, extra), reason: `common name, safe preparation difference (${extra.join(", ")})` };
}

/** The route's answer for one candidate page — the single path the real call AND every fixture
 *  take. UNCERTAIN publishes no number at all. */
function selectionBody(canonicalName: string, foods: UsdaFood[]): { facts: FoodFacts | null; uncertain?: true } {
  const verdict = judge(canonicalName, rankCandidates(canonicalName, foods));
  if (!verdict) return { facts: null };
  if (verdict.kind === "uncertain") return { facts: null, uncertain: true };
  const facts: FoodFacts = { ...verdict.chosen.facts, match: verdict.kind, ...(verdict.kind === "likely" ? { basedOn: verdict.basedOn } : {}) };
  return { facts };
}

/**
 * The one real USDA call — `node:https` with `family: 4`, NOT `fetch`. Diagnosed live
 * (2026-10-02, raw probes in the Phase B addendum): this host publishes AAAA records whose
 * addresses silently blackhole from some networks; Node's hostname-based connection logic
 * (happy-eyeballs) then never completes a handshake against api.nal.usda.gov even though
 * every IPv4 address answers in <1 s — deterministically reproduced, while IPv4-pinned
 * connects succeeded 100% of the time. `fetch` exposes no socket options, so the call uses
 * node:https directly with the address family pinned. Same 5 s total timeout, same quiet
 * null-on-failure, same payload — nothing else about the boundary changes.
 */
function usdaSearch(apiKey: string, body: object): Promise<{ status: number; json: unknown } | null> {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const req = httpsRequest(
      {
        hostname: USDA_HOST,
        path: `${USDA_SEARCH_PATH}?api_key=${encodeURIComponent(apiKey)}`,
        method: "POST",
        family: 4,
        timeout: TIMEOUT_MS,
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode ?? 0, json: JSON.parse(Buffer.concat(chunks).toString("utf8")) });
          } catch {
            resolve(null);
          }
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error(`USDA search timed out after ${TIMEOUT_MS}ms`)));
    req.on("error", (err) => {
      console.error("[food-facts] USDA call failed:", err instanceof Error ? err.message : err);
      resolve(null);
    });
    req.end(payload);
  });
}

/** Deterministic canned responses for the test suite — never a real USDA call. */
function buildMockFacts(canonicalName: string): FoodFacts {
  return {
    source: "usda",
    fdcId: 2345678,
    matchedName: canonicalName.toUpperCase(),
    nutrition: { calories: 354, protein: 20, carbs: 35, fat: 14 },
    units: { calories: "kcal", protein: "g", carbs: "g", fat: "g" },
    basis: "per 100 g",
    retrievedAt: new Date().toISOString(),
    match: "confident",
  };
}

export async function POST(req: NextRequest) {
  let body: { canonicalName?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ facts: null }, { status: 400 });
  }
  const canonicalName = typeof body.canonicalName === "string" ? body.canonicalName.trim().slice(0, 120) : "";
  if (!canonicalName) return NextResponse.json({ facts: null }, { status: 400 });

  const mockRaw = req.nextUrl.searchParams.get("mock");
  if (mockRaw !== null) {
    // `scenario` or `scenario:delayMs` (same convention as /api/analyze-meal) — the delay lets a
    // test hold a lookup in flight to prove late-result safety.
    const [mock, delayStr] = mockRaw.split(":");
    const delay = Number(delayStr);
    // capped: this seam is reachable without auth, so it must never hold a request open for long
    if (Number.isFinite(delay) && delay > 0) await sleep(Math.min(delay, MAX_MOCK_DELAY_MS));
    if (mock.startsWith("fixture-")) {
      const name = mock.slice("fixture-".length);
      const make = Object.prototype.hasOwnProperty.call(FIXTURES, name) ? FIXTURES[name] : undefined;
      return NextResponse.json(selectionBody(canonicalName, make ? make(canonicalName) : []));
    }
    switch (mock) {
      case "found":
        return NextResponse.json({ facts: buildMockFacts(canonicalName) });
      case "miss":
        return NextResponse.json({ facts: null });
      case "fail":
        // Exercises the client's catch path — a real transport/server failure, not a miss.
        return NextResponse.json({ facts: null }, { status: 500 });
      case "echo":
        // §PRIVACY test seam ONLY — never reachable without the mock param. Proves the exact
        // outgoing USDA request carries nothing but the lookup material (key redacted).
        return NextResponse.json({ facts: null, _debugProviderRequest: buildSearchRequest(canonicalName) });
      default:
        return NextResponse.json({ facts: null });
    }
  }

  const apiKey = process.env.USDA_FDC_API_KEY;
  if (!apiKey) {
    // No key configured — a quiet, safe absence. The Meal flow falls back to the AI estimate.
    console.error("[food-facts] USDA_FDC_API_KEY is not configured");
    return NextResponse.json({ facts: null });
  }

  try {
    const shape = buildSearchRequest(canonicalName);
    const res = await usdaSearch(apiKey, shape.body);
    if (!res) return NextResponse.json({ facts: null }); // already logged server-side
    if (res.status < 200 || res.status >= 300) {
      console.error("[food-facts] USDA search failed:", res.status);
      return NextResponse.json({ facts: null });
    }
    const data = res.json as { foods?: UsdaFood[] };
    const foods = Array.isArray(data.foods) ? data.foods : [];
    return NextResponse.json(selectionBody(canonicalName, foods));
  } catch (err) {
    // Server-side logging only — the client never receives provider error details.
    console.error("[food-facts] USDA call failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ facts: null });
  }
}
