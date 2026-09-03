/**
 * SYSTEMBOOM DESTINATION INTELLIGENCE — provider-independent arrival model.
 *
 * Every meaningful journey that ends somewhere known produces one
 * DestinationContext; the Google and Leaflet providers both feed the same
 * DestinationPanel from it. Honesty rules are enforced at the model level:
 * arbitrary surface coordinates are never given invented place names, and
 * coordinate precision is always carried explicitly.
 */

import type { Destination, GeoPlace } from "@/lib/earth/geo-data";
import { PLACES } from "@/lib/earth/geo-data";
import type { SystemboomOffice } from "@/lib/systemboom-origin";

export type DestinationType =
  | "OFFICE"
  | "CITY"
  | "LANDMARK"
  | "PLACE"
  | "NATURAL_FEATURE"
  | "SURFACE_TARGET";

export type DestinationPrecision = "exact" | "approximate" | "city" | "region";

export interface DestinationContext {
  id: string;
  type: DestinationType;
  name: string;
  /** Small uppercase hierarchy line above the name ("MAHARAJGUNJ · KATHMANDU"). */
  eyebrow?: string;
  country?: string;
  latitude: number;
  longitude: number;
  precision: DestinationPrecision;
  /** One short factual context line — never promotional copy. */
  description?: string;
  /** Owner-supplied or provider-supplied address block (pre-line). */
  displayAddress?: string;
  /** Honest coordinate-quality note, when precision demands it. */
  precisionNote?: string;
  source: "systemboom-office" | "curated" | "surface" | "google-places";
}

/** "60.40° N · 51.50° W" */
export function formatCoordinates(lat: number, lon: number): string {
  const la = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? "N" : "S"}`;
  const lo = `${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? "E" : "W"}`;
  return `${la} · ${lo}`;
}

/* ------------------------------------------------------------------ */

export function destinationFromOffice(office: SystemboomOffice): DestinationContext {
  return {
    id: office.id,
    type: "OFFICE",
    name: office.name,
    eyebrow: "Systemboom",
    latitude: office.latitude,
    longitude: office.longitude,
    precision: office.precision,
    displayAddress: office.displayAddress,
    precisionNote:
      office.precision === "city"
        ? "Approximate — city-level location"
        : office.needsGeocodeVerification
          ? "Map position approximate — address as supplied"
          : undefined,
    source: "systemboom-office",
  };
}

export function destinationFromPlace(place: GeoPlace): DestinationContext {
  return {
    id: place.id,
    type: "LANDMARK",
    name: place.name,
    eyebrow: [place.area, place.city].filter(Boolean).join(" · "),
    country: place.country,
    latitude: place.lat,
    longitude: place.lon,
    precision: "approximate",
    description: place.context,
    source: "curated",
  };
}

/**
 * Curated search-destination metadata: type plus one short factual line.
 * Facts only (geography, elevation, role) — never marketing copy.
 */
const DESTINATION_META: Record<string, { type: DestinationType; description?: string }> = {
  kathmandu: { type: "CITY", description: "Historic Himalayan valley and Nepal's capital." },
  everest: { type: "NATURAL_FEATURE", description: "Earth's highest mountain — 8,849 m above sea level." },
  sydney: { type: "CITY", description: "Harbour city on Australia's east coast." },
  tokyo: { type: "CITY", description: "Japan's capital, on Tokyo Bay." },
  "new-york": { type: "CITY", description: "Largest city in the United States, on the Atlantic coast." },
  london: { type: "CITY", description: "Capital of the United Kingdom, on the River Thames." },
  "grand-canyon": { type: "NATURAL_FEATURE", description: "Colorado River canyon in Arizona, United States." },
  kyoto: { type: "CITY", description: "Japan's former imperial capital." },
  reykjavik: { type: "CITY", description: "Iceland's capital, on the North Atlantic coast." },
};

/** Country portion of a curated detail line ("Nepal · 8,849 m" → "Nepal"). */
function countryFromDetail(detail: string): string | undefined {
  const first = detail.split("·")[0]?.trim();
  return first || undefined;
}

export function destinationFromSearch(dest: Destination): DestinationContext {
  // Landmarks with a richer curated record reuse it.
  const place = PLACES.find((p) => p.id === dest.id);
  if (place) return destinationFromPlace(place);

  const meta = DESTINATION_META[dest.id];
  const type = meta?.type ?? "PLACE";
  const country =
    type === "CITY" || type === "NATURAL_FEATURE" ? countryFromDetail(dest.detail) : undefined;
  return {
    id: dest.id,
    type,
    name: dest.name,
    eyebrow:
      type === "CITY" && country
        ? `${dest.name} · ${country}`
        : dest.detail,
    country,
    latitude: dest.lat,
    longitude: dest.lon,
    precision: type === "CITY" ? "city" : "approximate",
    description: meta?.description,
    source: "curated",
  };
}

/**
 * An arbitrary Earth surface arrival. NEVER invents a place name —
 * coordinates lead; the optional context line comes only from the curated
 * breadcrumb classification actually containing the point.
 */
export function destinationFromSurface(
  lat: number,
  lon: number,
  crumbs: string[],
): DestinationContext {
  // crumbs: ["Earth", "Asia", "Nepal", ...] — most specific last.
  const region = crumbs.slice(1).reverse().join(" · ");
  return {
    id: `surface-${lat.toFixed(2)}-${lon.toFixed(2)}`,
    type: "SURFACE_TARGET",
    name: formatCoordinates(lat, lon),
    eyebrow: "Selected location",
    latitude: lat,
    longitude: lon,
    precision: "region",
    description: region || undefined,
    source: "surface",
  };
}

export function destinationFromGooglePlace(r: {
  id: string;
  name: string;
  detail: string;
  lat: number;
  lng: number;
}): DestinationContext {
  return {
    id: `gp-${r.id}`,
    type: "PLACE",
    name: r.name,
    displayAddress: r.detail || undefined,
    latitude: r.lat,
    longitude: r.lng,
    precision: "exact",
    source: "google-places",
  };
}
