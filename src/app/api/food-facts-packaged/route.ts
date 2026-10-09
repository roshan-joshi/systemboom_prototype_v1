/**
 * PHASE B2 — the Composer's PACKAGED-food nutrition boundary, a sibling of `/api/food-facts`
 * (USDA). "AI recognizes. Structured sources supply facts. AI estimates only as final fallback."
 * Open Food Facts = packaged/branded products. The browser talks ONLY to this route.
 *
 * PROVIDER: Open Food Facts public search, `https://world.openfoodfacts.org/cgi/search.pl`
 * (the single global database — see LOCALE below). No API key exists or is required; therefore no
 * secret is read here and none can leak. A static, non-personal User-Agent identifies the app, as
 * OFF asks.
 *
 * REQUEST: `{ canonicalName, brand? }`. `brand` is text the recognition READ on a visible package;
 * it is lookup material, like the food's name. Nothing else the client sends is ever read or
 * forwarded (no identity, filename, GPS, caption, sourceMetadata) — provable via `?mock=echo`.
 *
 * RESPONSE: `{ facts: FoodFacts | null }` — the SAME normalized `FoodFacts` shape the USDA route
 * returns (`source: "openfoodfacts"`, `productId` = the product code, per-100 g figures with units,
 * `retrievedAt`), so the Composer renders one kind of fact. A miss, a withheld ambiguity, a
 * timeout, or any failure → `{ facts: null }` with server-side logging only; the client then
 * continues the chain (USDA → AI estimate) and shows nothing technical.
 *
 * SELECTION (conservative, like USDA's): a wrong packaged number published as fact is the failure
 * this phase exists to prevent, so — (1) a requested brand must appear in the product's brands;
 * (2) the product must be the requested food (shares a canonical word) or be named by its brand
 * alone (the flagship product); without a brand, EVERY canonical word must be in the product name;
 * (3) energy must be present as kcal (a kJ-only product is skipped, never converted); (4) if the
 * best-ranked products disagree on calories by > 25% and > 25 kcal the answer is withheld.
 *
 * LOCALE: not applicable. One global database, no country/language parameter; the interface
 * locale cannot change a lookup (facts are language-neutral numbers per 100 g).
 *
 * `?mock=<scenario>[:delayMs]` (test-only, same convention as the sibling routes): `found`,
 * `miss`, `fail` (HTTP 500), `echo` (the exact outgoing request), `fixture-<name>` (candidate
 * products run through the REAL selection). The Composer sends it only when the page was loaded
 * with `?mockpackaged=`.
 */
import { request as httpsRequest } from "node:https";
import { NextRequest, NextResponse } from "next/server";
import type { FoodFacts } from "@/components/style-lab/social/data";

const OFF_HOST = "world.openfoodfacts.org";
const OFF_PATH = "/cgi/search.pl";
const TIMEOUT_MS = 5_000;
const USER_AGENT = "SYSTEMBOOM-prototype/0.1 (nutrition lookup)";
const MAX_MOCK_DELAY_MS = 10_000;
const AGREEMENT_RATIO = 1.25;
const AGREEMENT_FLOOR_KCAL = 25;

const STOP_WORDS = new Set(["the", "a", "an", "of", "and", "or", "in", "on", "with", "for", "to"]);

function plainWords(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w));
}

/** The exact, minimal search request — its own function so `?mock=echo` shows precisely what
 *  would be sent: only the brand + canonical name (as search terms) and fixed parameters. */
function buildSearchRequest(canonicalName: string, brand?: string) {
  const canonWords = plainWords(canonicalName);
  const brandWords = brand ? plainWords(brand) : [];
  // Prepend the brand unless the canonical name already carries it (search terms are brand + food).
  const terms = brandWords.length && !brandWords.every((w) => canonWords.includes(w)) ? `${brand} ${canonicalName}` : canonicalName;
  const params = new URLSearchParams({
    search_terms: terms,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: "10",
    fields: "code,product_name,generic_name,brands,nutriments",
  });
  return {
    url: `https://${OFF_HOST}${OFF_PATH}?${params.toString()}`,
    method: "GET" as const,
    headers: { "User-Agent": USER_AGENT },
  };
}

interface OffProduct {
  code?: unknown;
  product_name?: unknown;
  generic_name?: unknown;
  brands?: unknown;
  nutriments?: unknown;
}

const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined);
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

interface Eligible {
  product: OffProduct;
  code: string;
  name: string;
  kcal: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  overlap: number;
  /** Words in the product's own name that are neither the brand nor the requested food —
   *  "Plant-Based", "biscuits", "B-ready", "560G": each marks a variant, not the plain product. */
  extras: number;
  order: number;
}

function selectProduct(canonicalName: string, brand: string | undefined, products: OffProduct[]): FoodFacts | null {
  const brandWords = brand ? plainWords(brand) : [];
  const canonWords = plainWords(canonicalName).filter((w) => !brandWords.includes(w));
  const eligible: Eligible[] = [];
  products.forEach((product, order) => {
    if (!product || typeof product !== "object") return;
    const code = str(product.code);
    const name = str(product.product_name) || str(product.generic_name);
    if (!code || !name) return;
    const n = (product.nutriments && typeof product.nutriments === "object" ? product.nutriments : {}) as Record<string, unknown>;
    // Energy must come as kcal — never converted from kJ, never guessed.
    const kcal = num(n["energy-kcal_100g"]);
    if (kcal === undefined) return;
    const productBrands = plainWords(str(product.brands));
    if (brandWords.length && !brandWords.every((w) => productBrands.includes(w))) return; // a different brand is a different product
    const nameWords = plainWords(`${str(product.product_name)} ${str(product.generic_name)}`);
    const shared = canonWords.filter((w) => nameWords.includes(w)).length;
    const overlap = canonWords.length ? shared / canonWords.length : 1;
    if (brandWords.length) {
      const namedByBrandOnly = nameWords.length > 0 && nameWords.every((w) => brandWords.includes(w));
      if (!(shared > 0 || namedByBrandOnly)) return; // same brand, but a different product
    } else if (overlap < 1) {
      return; // no brand to anchor on: every canonical word must be in the product's name
    }
    const extras = plainWords(str(product.product_name)).filter((w) => !brandWords.includes(w) && !canonWords.includes(w)).length;
    eligible.push({ product, code, name, kcal, protein: num(n["proteins_100g"]), carbs: num(n["carbohydrates_100g"]), fat: num(n["fat_100g"]), overlap, extras, order });
  });
  if (!eligible.length) return null;
  // The plain product beats a variant of it (found live: "hazelnut spread" + Nutella must not
  // resolve to "Nutella Plant-Based" while plain "Nutella" exists), then the closer name match,
  // then OFF's own order.
  eligible.sort((a, b) => a.extras - b.extras || b.overlap - a.overlap || a.order - b.order);
  const best = eligible[0];
  // With no brand to anchor on, only the plain product is acceptable ("banana" must never become
  // "Banana chips" — found live); a named variant is offered only when a brand identifies it.
  if (!brandWords.length && best.extras > 0) return null;
  const group = eligible.filter((e) => e.extras === best.extras);
  const hi = Math.max(...group.map((e) => e.kcal));
  const lo = Math.min(...group.map((e) => e.kcal));
  if (hi - lo > AGREEMENT_FLOOR_KCAL && hi > lo * AGREEMENT_RATIO) return null; // the best candidates disagree — withhold, never guess
  return {
    source: "openfoodfacts",
    productId: best.code,
    matchedName: best.name,
    nutrition: { calories: best.kcal, protein: best.protein, carbs: best.carbs, fat: best.fat },
    units: { calories: "kcal", protein: "g", carbs: "g", fat: "g" },
    basis: "per 100 g",
    retrievedAt: new Date().toISOString(),
    // CONFIDENT = the plain product; LIKELY = the best available is a named variant, and the person
    // is told which ("based on …") — the same conditional transparency the USDA route uses.
    // Evidence of identity: the product's own words cover part of the requested food. A product
    // named only by its brand ("maggi") proves the brand, not the food → LIKELY, and named.
    match: best.extras === 0 && best.overlap > 0 ? "confident" : "likely",
    ...(best.extras === 0 && best.overlap > 0 ? null : { basedOn: best.name.slice(0, 60) }),
  };
}

/** Test-only candidate pages (`?mock=fixture-<name>`), shaped like OFF's search response. */
const prod = (code: string, name: string, brands: string, kcal: number | null, protein = 6.3, carbs = 57.5, fat = 30.9, generic?: string): OffProduct => ({
  code,
  product_name: name,
  ...(generic ? { generic_name: generic } : null),
  brands,
  nutriments: kcal === null ? { "energy-kj_100g": 2252, proteins_100g: protein } : { "energy-kcal_100g": kcal, proteins_100g: protein, carbohydrates_100g: carbs, fat_100g: fat },
});
const FIXTURES: Record<string, () => OffProduct[]> = {
  // a different Nutella product first, then the flagship — only the flagship is the requested food
  nutella: () => [prod("8000500310427", "Nutella B-ready", "Nutella, Ferrero", 480, 8, 55, 25), prod("3017620422003", "Nutella", "Nutella, Ferrero", 539, 6.3, 57.5, 30.9, "Hazelnut spread with cocoa")],
  wrongbrand: () => [prod("8001505005592", "Hazelnut spread", "Nocciolata, Rigoni", 540)],
  conflict: () => [prod("3017620422003", "Nutella", "Nutella, Ferrero", 539), prod("3017620425035", "Nutella", "Nutella, Ferrero", 250)],
  noenergy: () => [prod("3017620422003", "Nutella", "Nutella, Ferrero", null)],
  // found live: the variant arrives FIRST in OFF's order — the plain product must still win
  plantbased: () => [prod("8000500426494", "Nutella Plant-Based", "Ferrero, Nutella", 534, 6.8, 53.4, 31.8, "Hazelnut and cocoa spread."), prod("3017620422003", "Nutella", "Nutella, Ferrero", 539, 6.3, 57.5, 30.9, "Hazelnut spread with cocoa")],
  // only a variant exists → published as LIKELY and named, never as the plain product
  // a product named only by its brand proves the brand, not the food → LIKELY
  brandonly: () => [prod("3017620422003", "Nutella", "Nutella, Ferrero", 539)],
  // no brand given: a variant ("Banana chips") must never stand in for the plain food
  bananachips: () => [prod("8718403887518", "Banana chips", "Fruitsnack", 528, 2, 56, 32)],
  variantonly: () => [prod("8000500426494", "Nutella Plant-Based", "Ferrero, Nutella", 534, 6.8, 53.4, 31.8, "Hazelnut and cocoa spread.")],
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The one real OFF call — `node:https` pinned to IPv4 (same transport lesson as the USDA route:
 *  some networks blackhole AAAA, and `fetch` exposes no socket options). 5 s total timeout. */
function offSearch(path: string): Promise<{ status: number; json: unknown } | null> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (v: { status: number; json: unknown } | null) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    const req = httpsRequest({ host: OFF_HOST, path, method: "GET", family: 4, headers: { "User-Agent": USER_AGENT, Accept: "application/json" } }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => {
        const status = res.statusCode ?? 0;
        // OFF answers anonymous traffic under load with an HTML 503 page — report the status, don't parse it.
        if (status < 200 || status >= 300) return done({ status, json: null });
        try {
          done({ status, json: JSON.parse(Buffer.concat(chunks).toString("utf8")) });
        } catch (err) {
          console.error("[food-facts-packaged] OFF returned non-JSON:", err instanceof Error ? err.message : err);
          done(null);
        }
      });
      res.on("error", () => done(null));
    });
    req.setTimeout(TIMEOUT_MS, () => {
      console.error("[food-facts-packaged] OFF request timed out");
      req.destroy();
      done(null);
    });
    req.on("error", (err) => {
      console.error("[food-facts-packaged] OFF request failed:", err.message);
      done(null);
    });
    req.end();
  });
}

export async function POST(req: NextRequest) {
  let body: { canonicalName?: unknown; brand?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ facts: null }, { status: 400 });
  }
  const canonicalName = typeof body.canonicalName === "string" ? body.canonicalName.trim().slice(0, 120) : "";
  const brand = typeof body.brand === "string" && body.brand.trim() ? body.brand.trim().slice(0, 60) : undefined;
  if (!canonicalName) return NextResponse.json({ facts: null }, { status: 400 });

  const mockRaw = req.nextUrl.searchParams.get("mock");
  if (mockRaw !== null) {
    const [mock, delayStr] = mockRaw.split(":");
    const delay = Number(delayStr);
    if (Number.isFinite(delay) && delay > 0) await sleep(Math.min(delay, MAX_MOCK_DELAY_MS));
    if (mock.startsWith("fixture-")) {
      const name = mock.slice("fixture-".length);
      const make = Object.prototype.hasOwnProperty.call(FIXTURES, name) ? FIXTURES[name] : undefined;
      return NextResponse.json({ facts: make ? selectProduct(canonicalName, brand, make()) : null });
    }
    switch (mock) {
      case "found":
        return NextResponse.json({
          facts: {
            source: "openfoodfacts",
            productId: "3017620422003",
            matchedName: "Nutella",
            nutrition: { calories: 539, protein: 6.3, carbs: 57.5, fat: 30.9 },
            units: { calories: "kcal", protein: "g", carbs: "g", fat: "g" },
            basis: "per 100 g",
            retrievedAt: new Date().toISOString(),
            match: "confident",
          } satisfies FoodFacts,
        });
      case "fail":
        return NextResponse.json({ facts: null }, { status: 500 });
      case "echo":
        return NextResponse.json({ facts: null, _debugProviderRequest: buildSearchRequest(canonicalName, brand) });
      case "miss":
      default:
        return NextResponse.json({ facts: null });
    }
  }

  try {
    const shape = buildSearchRequest(canonicalName, brand);
    const res = await offSearch(shape.url.slice(`https://${OFF_HOST}`.length));
    if (!res) return NextResponse.json({ facts: null }); // already logged server-side
    if (res.status < 200 || res.status >= 300) {
      console.error("[food-facts-packaged] OFF search failed:", res.status);
      return NextResponse.json({ facts: null });
    }
    const data = res.json as { products?: OffProduct[] };
    const products = Array.isArray(data.products) ? data.products : [];
    return NextResponse.json({ facts: selectProduct(canonicalName, brand, products) });
  } catch (err) {
    console.error("[food-facts-packaged] OFF call failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ facts: null });
  }
}
