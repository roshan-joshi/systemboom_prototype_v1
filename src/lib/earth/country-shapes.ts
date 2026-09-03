/**
 * SYSTEMBOOM TERRITORY FOCUS — selected-country boundary geometry.
 *
 * Source: Natural Earth, ne_50m_admin_0_countries (public domain,
 * https://www.naturalearthdata.com/about/terms-of-use/), fetched from the
 * official natural-earth-vector GitHub mirror and subset locally to the 18
 * countries in SYSTEMBOOM's curated globe dataset. Geometry is simplified
 * (Douglas–Peucker, per-country tolerance) for cinematic globe rendering —
 * these are recognisable territory silhouettes, not survey borders.
 * Remote overseas territories are intentionally excluded so selection
 * stays focused on the main landmass. Total: ~6.4k points / ~106 KB.
 *
 * Only the CURRENTLY SELECTED country's geometry is ever rendered —
 * the cinematic Earth is never covered in political borders.
 */

import shapes from "./country-shapes.json";

/** rings of [lon, lat], largest landmass first */
export type CountryRings = [number, number][][];

const COUNTRY_SHAPES = shapes as unknown as Record<string, CountryRings>;

export function countryRings(countryId: string): CountryRings | null {
  return COUNTRY_SHAPES[countryId] ?? null;
}

export function hasCountryShape(countryId: string): boolean {
  return countryId in COUNTRY_SHAPES;
}
