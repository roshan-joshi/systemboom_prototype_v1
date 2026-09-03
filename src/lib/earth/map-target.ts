/**
 * SYSTEMBOOM MAP TARGETS — how a semantic geography is framed in the map.
 *
 * One provider-independent resolver: a clicked geographic name becomes a
 * concrete map framing — real country bounds (Natural Earth subset),
 * curated continent framing extents, or a point+zoom for regions/cities.
 * Google and Leaflet both consume this; neither invents its own framing.
 */

import { countryRings } from "./country-shapes";
import { GEO_BY_ID, type GlobeGeoLabel } from "./globe-geo";

/** [[latMin, lonMin], [latMax, lonMax]] */
export type GeoBounds = [[number, number], [number, number]];

export interface MapTarget {
  kind: GlobeGeoLabel["kind"];
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** Fit these bounds (countries: real geometry; continents: curated extent). */
  bounds?: GeoBounds;
  /** Point targets (region/city) arrive at this zoom instead. */
  zoom?: number;
  /** Country whose real boundary should be identified on the map. */
  boundaryCountryId?: string;
}

/**
 * Curated continent FRAMING extents — camera framing, not political
 * definitions. Chosen so the landmass reads comfortably in the viewport.
 */
const CONTINENT_BOUNDS: Record<string, GeoBounds> = {
  "ct-africa": [[-35, -18], [37, 52]],
  "ct-europe": [[35, -11], [71, 45]],
  "ct-asia": [[-10, 40], [72, 145]],
  "ct-namerica": [[7, -168], [72, -52]],
  "ct-samerica": [[-56, -82], [13, -34]],
  "ct-oceania": [[-47, 110], [0, 180]],
};

/** Real bounds of a country's included geometry (main landmass focus). */
export function countryBounds(countryId: string): GeoBounds | null {
  const rings = countryRings(countryId);
  if (!rings || rings.length === 0) return null;
  let latMin = 90;
  let latMax = -90;
  let lonMin = 180;
  let lonMax = -180;
  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      if (lat < latMin) latMin = lat;
      if (lat > latMax) latMax = lat;
      if (lon < lonMin) lonMin = lon;
      if (lon > lonMax) lonMax = lon;
    }
  }
  return [
    [latMin, lonMin],
    [latMax, lonMax],
  ];
}

/** Resolve the map framing for a semantic geography id. */
export function geoMapTarget(geoId: string): MapTarget | null {
  const label = GEO_BY_ID[geoId];
  if (!label) return null;
  const base = {
    kind: label.kind,
    id: label.id,
    name: label.name,
    lat: label.lat,
    lon: label.lon,
  };
  if (label.kind === "continent") {
    return { ...base, bounds: CONTINENT_BOUNDS[label.id] };
  }
  if (label.kind === "country") {
    const bounds = countryBounds(label.id);
    return bounds
      ? { ...base, bounds, boundaryCountryId: label.id }
      : { ...base, zoom: 6.8, boundaryCountryId: label.id };
  }
  if (label.kind === "region") {
    // Regions keep their parent country's boundary as context.
    const parentCountry =
      label.parent && GEO_BY_ID[label.parent]?.kind === "country" ? label.parent : undefined;
    return { ...base, zoom: 9.5, boundaryCountryId: parentCountry };
  }
  // city
  const parentCountry =
    label.parent && GEO_BY_ID[label.parent]?.kind === "country" ? label.parent : undefined;
  return { ...base, zoom: 11.5, boundaryCountryId: parentCountry };
}
