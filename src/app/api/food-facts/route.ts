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
function normalizeUsdaFood(food: UsdaFood): FoodFacts | null {
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

  const mock = req.nextUrl.searchParams.get("mock");
  if (mock !== null) {
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
    // Best-of-page pick (adversarial finding #3): a one-nutrient first hit must not beat a
    // complete entry one position later. Calories weigh most; ties keep USDA's own relevance
    // order (earlier wins).
    let best: { facts: FoodFacts; score: number } | null = null;
    for (const food of foods) {
      const facts = normalizeUsdaFood(food);
      if (!facts) continue;
      const score =
        (facts.nutrition.calories !== undefined ? 4 : 0) +
        (facts.nutrition.protein !== undefined ? 1 : 0) +
        (facts.nutrition.carbs !== undefined ? 1 : 0) +
        (facts.nutrition.fat !== undefined ? 1 : 0);
      if (!best || score > best.score) best = { facts, score };
    }
    return NextResponse.json({ facts: best?.facts ?? null }); // null = no acceptable match
  } catch (err) {
    // Server-side logging only — the client never receives provider error details.
    console.error("[food-facts] USDA call failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ facts: null });
  }
}
