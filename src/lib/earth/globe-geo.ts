/**
 * SYSTEMBOOM EARTH CONTINUUM — globe geographic orientation data.
 *
 * A deliberately tiny, hand-curated set of continent / country / region /
 * major-city anchor points for the semantic-zoom label layer on the R3F
 * Earth. This is ORIENTATION data, not a GIS dataset: a few dozen points,
 * kept local, no runtime geospatial service.
 *
 * Source & license: the entries below are hand-written approximate
 * centroids of well-known geographic entities — public-domain facts
 * (coordinates of continents, countries and cities are not copyrightable).
 * No external dataset was imported or redistributed.
 *
 * Country boundary geometry for the selected-territory treatment lives
 * separately in country-shapes.ts (Natural Earth subset) — only the
 * currently selected country is ever drawn, so the Earth never becomes
 * a political map. The imagery stays dominant; text provides semantics.
 *
 * Semantic zoom bands (camera distance in Earth radii — see GEO_BANDS):
 *   continent  Z2–Z3   country  Z4   region  Z5   city  Z6
 */

export type GeoLabelKind = "continent" | "country" | "region" | "city";

export interface GlobeGeoLabel {
  id: string;
  name: string;
  kind: GeoLabelKind;
  lat: number;
  lon: number;
  /** Semantic parent (continent for countries, country for regions/cities). */
  parent?: string;
}

/**
 * Visibility bands per kind — camera distance from Earth center, in radii.
 * Tuned to the quality-based deep floor (desktop 1.62r / mobile 1.55r):
 * hierarchy hands over progressively (EUROPE → UNITED KINGDOM → LONDON)
 * instead of stacking every level at once.
 */
export const GEO_BANDS: Record<GeoLabelKind, { min: number; max: number }> = {
  continent: { min: 1.95, max: 6.4 },
  country: { min: 1.6, max: 2.15 },
  region: { min: 1.52, max: 1.75 },
  city: { min: 1.45, max: 2.0 },
};

/** Label collision priority (lower wins). Offices use 1 (selected) / 2. */
export const GEO_PRIORITY: Record<GeoLabelKind, number> = {
  country: 4,
  city: 5,
  continent: 5,
  region: 6,
};

export const GLOBE_GEO_LABELS: GlobeGeoLabel[] = [
  /* ---- continents (Z2–Z3) ---- */
  { id: "ct-africa", name: "Africa", kind: "continent", lat: 6, lon: 19 },
  { id: "ct-europe", name: "Europe", kind: "continent", lat: 52, lon: 14 },
  { id: "ct-asia", name: "Asia", kind: "continent", lat: 42, lon: 92 },
  { id: "ct-namerica", name: "North America", kind: "continent", lat: 46, lon: -101 },
  { id: "ct-samerica", name: "South America", kind: "continent", lat: -14, lon: -59 },
  { id: "ct-oceania", name: "Oceania", kind: "continent", lat: -26, lon: 141 },

  /* ---- countries (Z4) — a restrained, well-spread set ---- */
  { id: "cn-uk", name: "United Kingdom", kind: "country", lat: 54.3, lon: -2.3, parent: "ct-europe" },
  { id: "cn-nepal", name: "Nepal", kind: "country", lat: 28.6, lon: 83.6, parent: "ct-asia" },
  { id: "cn-france", name: "France", kind: "country", lat: 46.6, lon: 2.4, parent: "ct-europe" },
  { id: "cn-germany", name: "Germany", kind: "country", lat: 51.1, lon: 10.4, parent: "ct-europe" },
  { id: "cn-spain", name: "Spain", kind: "country", lat: 40.2, lon: -3.6, parent: "ct-europe" },
  { id: "cn-italy", name: "Italy", kind: "country", lat: 42.8, lon: 12.8, parent: "ct-europe" },
  { id: "cn-india", name: "India", kind: "country", lat: 21.8, lon: 78.9, parent: "ct-asia" },
  { id: "cn-china", name: "China", kind: "country", lat: 35.5, lon: 103.9, parent: "ct-asia" },
  { id: "cn-japan", name: "Japan", kind: "country", lat: 36.6, lon: 138.2, parent: "ct-asia" },
  { id: "cn-australia", name: "Australia", kind: "country", lat: -25.3, lon: 134.4, parent: "ct-oceania" },
  { id: "cn-usa", name: "United States", kind: "country", lat: 39.5, lon: -98.6, parent: "ct-namerica" },
  { id: "cn-canada", name: "Canada", kind: "country", lat: 58.3, lon: -103.2, parent: "ct-namerica" },
  { id: "cn-brazil", name: "Brazil", kind: "country", lat: -10.8, lon: -52.9, parent: "ct-samerica" },
  { id: "cn-russia", name: "Russia", kind: "country", lat: 60.4, lon: 93.3, parent: "ct-asia" },
  { id: "cn-egypt", name: "Egypt", kind: "country", lat: 26.6, lon: 29.8, parent: "ct-africa" },
  { id: "cn-safrica", name: "South Africa", kind: "country", lat: -29.1, lon: 25.1, parent: "ct-africa" },
  { id: "cn-indonesia", name: "Indonesia", kind: "country", lat: -2.4, lon: 117.9, parent: "ct-asia" },
  { id: "cn-mexico", name: "Mexico", kind: "country", lat: 23.9, lon: -102.5, parent: "ct-namerica" },

  /* ---- regions (Z5) — only real first-level divisions we can stand behind ---- */
  { id: "rg-england", name: "England", kind: "region", lat: 53.2, lon: -2.6, parent: "cn-uk" },
  { id: "rg-bagmati", name: "Bagmati", kind: "region", lat: 27.9, lon: 85.7, parent: "cn-nepal" },

  /* ---- major cities (Z6) — orientation, not POI mapping ---- */
  { id: "cy-london", name: "London", kind: "city", lat: 51.507, lon: -0.128, parent: "cn-uk" },
  { id: "cy-kathmandu", name: "Kathmandu", kind: "city", lat: 27.717, lon: 85.324, parent: "cn-nepal" },
  { id: "cy-tokyo", name: "Tokyo", kind: "city", lat: 35.68, lon: 139.69, parent: "cn-japan" },
  { id: "cy-sydney", name: "Sydney", kind: "city", lat: -33.87, lon: 151.21, parent: "cn-australia" },
  { id: "cy-newyork", name: "New York", kind: "city", lat: 40.71, lon: -74.01, parent: "cn-usa" },
  { id: "cy-paris", name: "Paris", kind: "city", lat: 48.86, lon: 2.35, parent: "cn-france" },
  { id: "cy-delhi", name: "New Delhi", kind: "city", lat: 28.61, lon: 77.21, parent: "cn-india" },
  { id: "cy-cairo", name: "Cairo", kind: "city", lat: 30.04, lon: 31.24, parent: "cn-egypt" },
  { id: "cy-saopaulo", name: "São Paulo", kind: "city", lat: -23.55, lon: -46.63, parent: "cn-brazil" },
  { id: "cy-losangeles", name: "Los Angeles", kind: "city", lat: 34.05, lon: -118.24, parent: "cn-usa" },
];

/* ============================================================
   SEMANTIC HIERARCHY — one flexible ladder, both directions.
   ============================================================ */

export const GEO_BY_ID: Record<string, GlobeGeoLabel> = Object.fromEntries(
  GLOBE_GEO_LABELS.map((l) => [l.id, l]),
);

/** Ancestors → target, e.g. [Asia, Nepal, Kathmandu]. Never includes Earth. */
export function geoPath(id: string): GlobeGeoLabel[] {
  const path: GlobeGeoLabel[] = [];
  let cur = GEO_BY_ID[id];
  let guard = 0;
  while (cur && guard++ < 6) {
    path.unshift(cur);
    cur = cur.parent ? GEO_BY_ID[cur.parent] : (undefined as never);
  }
  return path;
}

/** Direct semantic children (Asia → its curated countries…). */
export function geoChildren(id: string | null): GlobeGeoLabel[] {
  if (id === null) return GLOBE_GEO_LABELS.filter((l) => l.kind === "continent");
  return GLOBE_GEO_LABELS.filter((l) => l.parent === id);
}

/** Case-insensitive name lookup (breadcrumb names ↔ globe labels). */
export function geoByName(name: string): GlobeGeoLabel | undefined {
  const n = name.trim().toLowerCase();
  return GLOBE_GEO_LABELS.find((l) => l.name.toLowerCase() === n);
}
