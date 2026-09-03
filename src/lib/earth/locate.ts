/**
 * SYSTEMBOOM GEOGRAPHIC ADDRESS TRAIL — provider-independent reverse location.
 *
 * One question: WHERE IS THIS POINT? Answered in two layers:
 *
 *   LOCAL (synchronous, always available, honest):
 *     continent + country from Natural Earth point-in-polygon and the
 *     curated geographic model; region/city/district from the curated
 *     containment data; SYSTEMBOOM offices and curated places snap to
 *     their known identities. Nothing is ever invented.
 *
 *   ONLINE (optional enrichment, OSM Nominatim in the fallback provider):
 *     deepens the hierarchy (district, road, named place) when reachable.
 *     Throttled (Nominatim usage policy: max ~1 req/s), cached by rounded
 *     coordinate, abortable. Failure degrades silently to the local answer.
 *
 * Known SYSTEMBOOM data always outranks reverse geocoding: office identity
 * and owner-supplied addresses are never overwritten, and the resolver
 * never upgrades the Development Office's city-level precision.
 */

import { PLACES, type GeoPlace } from "./geo-data";
import { SYSTEMBOOM_OFFICES, type SystemboomOffice } from "@/lib/systemboom-origin";
import { countryRings } from "./country-shapes";
import { GLOBE_GEO_LABELS, GEO_BY_ID, geoByName } from "./globe-geo";
import { crumbTarget, resolveContext } from "./breadcrumb";

/* ------------------------------------------------------------------ */
/* Model                                                               */
/* ------------------------------------------------------------------ */

export type TrailLevel =
  | "earth"
  | "continent"
  | "country"
  | "region"
  | "city"
  | "district"
  | "street"
  | "place";

/** One clickable rung of the geographic address trail. */
export interface TrailEntry {
  name: string;
  level: TrailLevel;
  /** Navigable anchor for this level (curated center, else the point). */
  lat: number;
  lon: number;
  /** Semantic id when this rung maps to the curated globe model. */
  geoId?: string;
}

export type LocatePrecision =
  | "place"
  | "street"
  | "district"
  | "city"
  | "region"
  | "country"
  | "continent"
  | "coordinates";

export interface ResolvedLocation {
  lat: number;
  lon: number;

  continent?: string;
  country?: string;
  /** Curated globe id (cn-nepal) when the country is in the model. */
  countryGeoId?: string;
  countryCode?: string;

  region?: string;
  city?: string;
  district?: string;

  road?: string;
  postcode?: string;

  placeName?: string;
  placeType?: string;

  /** Known-identity snaps — these outrank any reverse geocoding. */
  office?: SystemboomOffice;
  knownPlace?: GeoPlace;

  source: "local" | "local+osm";
  precision: LocatePrecision;
}

/* ------------------------------------------------------------------ */
/* Local resolution                                                    */
/* ------------------------------------------------------------------ */

/** Ray-cast point-in-ring ([lon, lat] rings). */
function inRing(lat: number, lon: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** Natural Earth point-in-polygon over the curated country set. */
export function countryAtPoint(
  lat: number,
  lon: number,
): { geoId: string; name: string; continent?: string } | null {
  for (const label of GLOBE_GEO_LABELS) {
    if (label.kind !== "country") continue;
    const rings = countryRings(label.id);
    if (!rings) continue;
    for (const ring of rings) {
      if (inRing(lat, lon, ring)) {
        const parent = label.parent ? GEO_BY_ID[label.parent] : undefined;
        return { geoId: label.id, name: label.name, continent: parent?.name };
      }
    }
  }
  return null;
}

const OFFICE_SNAP_DEG = 0.005; // ~500 m — the mast footprint
const PLACE_SNAP_DEG = 0.003; // ~300 m — curated place lens

/**
 * Resolve everything the local model can honestly say about a point.
 * Synchronous — powers the immediate trail while any enrichment runs.
 */
export function resolveLocationLocal(lat: number, lon: number): ResolvedLocation {
  const loc: ResolvedLocation = { lat, lon, source: "local", precision: "coordinates" };

  // Known identities first — SYSTEMBOOM data outranks everything.
  // (The Development Office is city-precision: its coordinate marks a city,
  //  so a nearby click still resolves to the office identity honestly.)
  loc.office = SYSTEMBOOM_OFFICES.find(
    (o) => Math.hypot(o.latitude - lat, o.longitude - lon) < OFFICE_SNAP_DEG,
  );
  loc.knownPlace = loc.office
    ? undefined
    : PLACES.find((p) => Math.hypot(p.lat - lat, p.lon - lon) < PLACE_SNAP_DEG);

  // Curated containment (continent / country / region / city / district) —
  // altitude 1000 m asks for the deepest classification of the point itself.
  const crumbs = resolveContext(lat, lon, 1000).crumbs;
  for (const name of crumbs) {
    const t = crumbTarget(name);
    if (!t) continue;
    if (t.tier === "continent") loc.continent = name;
    else if (t.tier === "country") loc.country = name;
    else if (t.tier === "region") loc.region = name;
    else if (t.tier === "city") loc.city = name;
    else if (t.tier === "district") loc.district = name;
  }

  // Real polygons are the country authority where we have them.
  const poly = countryAtPoint(lat, lon);
  if (poly) {
    loc.country = poly.name;
    loc.countryGeoId = poly.geoId;
    if (poly.continent) loc.continent = poly.continent;
  } else if (loc.country) {
    // A bounding-box country claim is only kept when we have no polygon
    // for it (polygons refute sloppy boxes near borders).
    const g = geoByName(loc.country);
    if (g && countryRings(g.id)) loc.country = undefined;
    else if (g) loc.countryGeoId = g.id;
  }
  if (!loc.country) {
    loc.region = undefined;
    loc.city = undefined;
    loc.district = undefined;
  }

  if (loc.office || loc.knownPlace) loc.precision = "place";
  else if (loc.district) loc.precision = "district";
  else if (loc.city) loc.precision = "city";
  else if (loc.region) loc.precision = "region";
  else if (loc.country) loc.precision = "country";
  else if (loc.continent) loc.precision = "continent";

  // A curated place carries its own hierarchy fragments.
  if (loc.knownPlace) {
    loc.district = loc.district ?? loc.knownPlace.area;
    loc.city = loc.city ?? loc.knownPlace.city;
    loc.placeName = loc.knownPlace.name;
  }
  if (loc.office) {
    loc.placeName = loc.office.name;
    // A city-precision office marks a CITY, not an address — claiming a
    // district for it would falsely upgrade its honesty level.
    if (loc.office.precision === "city") loc.district = undefined;
  }

  return loc;
}

/* ------------------------------------------------------------------ */
/* Online enrichment — OSM Nominatim (fallback provider only)          */
/* ------------------------------------------------------------------ */

interface NominatimAddress {
  country?: string;
  country_code?: string;
  state?: string;
  province?: string;
  region?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city_district?: string;
  road?: string;
  postcode?: string;
}

interface NominatimResult {
  name?: string;
  category?: string;
  type?: string;
  address?: NominatimAddress;
}

/** Categories whose `name` is a genuine point of interest, not a boundary. */
const POI_CATEGORIES = new Set([
  "amenity",
  "building",
  "tourism",
  "leisure",
  "shop",
  "office",
  "aeroway",
  "healthcare",
  "historic",
  "railway",
  "man_made",
  "natural",
]);

const osmCache = new Map<string, NominatimResult | null>();
let osmLastRequest = 0;
const OSM_MIN_INTERVAL_MS = 1100; // Nominatim usage policy: ~1 req/s
const OSM_TIMEOUT_MS = 5000;

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("aborted", "AbortError"));
      },
      { once: true },
    );
  });

/**
 * Reverse-geocode via Nominatim. Throttled, cached by rounded coordinate,
 * abortable. Returns null on any failure — callers already hold the honest
 * local answer, so failure only means "no deeper detail".
 */
async function osmReverse(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<NominatimResult | null> {
  const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const hit = osmCache.get(key);
  if (hit !== undefined) return hit;
  try {
    const wait = osmLastRequest + OSM_MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait, signal);
    if (signal?.aborted) return null;
    osmLastRequest = Date.now();
    const ctl = new AbortController();
    const timeout = setTimeout(() => ctl.abort(), OSM_TIMEOUT_MS);
    signal?.addEventListener("abort", () => ctl.abort(), { once: true });
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=en`,
      { signal: ctl.signal, headers: { Accept: "application/json" } },
    );
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimResult;
    osmCache.set(key, data);
    return data;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[SB locate] reverse lookup unavailable (${key}): ${String(err)}`);
    }
    return null; // aborted, offline, blocked — the local answer stands
  }
}

/**
 * Enrich a local resolution with OSM detail. The local answer is never
 * contradicted: polygon country stands, office/curated identities stand,
 * OSM only fills levels the local model could not name.
 */
export async function resolveLocationOnline(
  local: ResolvedLocation,
  signal?: AbortSignal,
): Promise<ResolvedLocation> {
  // Known SYSTEMBOOM identities are final — do not geocode over them.
  if (local.office || local.knownPlace) return local;
  const osm = await osmReverse(local.lat, local.lon, signal);
  if (!osm || signal?.aborted) return local;
  const a = osm.address ?? {};
  const out: ResolvedLocation = { ...local, source: "local+osm" };

  if (!out.country && a.country) out.country = a.country;
  if (!out.countryCode && a.country_code) out.countryCode = a.country_code.toUpperCase();
  if (!out.continent && out.country) {
    const g = geoByName(out.country);
    const parent = g?.parent ? GEO_BY_ID[g.parent] : undefined;
    if (parent) out.continent = parent.name;
  }
  out.region = out.region ?? a.state ?? a.province ?? a.region;
  out.city = out.city ?? a.city ?? a.town ?? a.village ?? a.municipality;
  out.district =
    out.district ?? a.suburb ?? a.neighbourhood ?? a.quarter ?? a.city_district;
  out.road = a.road;
  out.postcode = a.postcode;
  if (osm.name && osm.category && POI_CATEGORIES.has(osm.category)) {
    out.placeName = osm.name;
    out.placeType = osm.type;
  }

  if (out.placeName) out.precision = "place";
  else if (out.road) out.precision = "street";
  else if (out.district) out.precision = "district";
  else if (out.city) out.precision = "city";
  else if (out.region) out.precision = "region";
  else if (out.country) out.precision = "country";
  else if (out.continent) out.precision = "continent";
  else out.precision = "coordinates";

  return out;
}

/* ------------------------------------------------------------------ */
/* Trail construction                                                  */
/* ------------------------------------------------------------------ */

/** Anchor a trail rung on curated geography when it exists, else the point. */
function anchored(
  name: string,
  level: TrailLevel,
  lat: number,
  lon: number,
): TrailEntry {
  const t = crumbTarget(name);
  const g = level === "continent" || level === "country" ? geoByName(name) : undefined;
  return {
    name,
    level,
    lat: t?.lat ?? lat,
    lon: t?.lon ?? lon,
    geoId: g?.id,
  };
}

/**
 * The SYSTEMBOOM Geographic Address Trail for a resolved location:
 * EARTH / continent / country / region / city / district / leaf.
 * Only levels the data actually supports appear — nothing is invented.
 * The street rung appears only when no named place resolved deeper.
 */
export function trailFromResolved(loc: ResolvedLocation): TrailEntry[] {
  const { lat, lon } = loc;
  const trail: TrailEntry[] = [{ name: "Earth", level: "earth", lat, lon }];
  if (loc.continent) trail.push(anchored(loc.continent, "continent", lat, lon));
  if (loc.country) {
    const e = anchored(loc.country, "country", lat, lon);
    e.geoId = e.geoId ?? loc.countryGeoId;
    trail.push(e);
  }
  if (loc.region) trail.push(anchored(loc.region, "region", lat, lon));
  if (loc.city) trail.push(anchored(loc.city, "city", lat, lon));
  if (loc.district) trail.push(anchored(loc.district, "district", lat, lon));
  if (loc.office) {
    trail.push({ name: loc.office.name, level: "place", lat, lon });
  } else if (loc.knownPlace) {
    trail.push({ name: loc.knownPlace.name, level: "place", lat, lon });
  } else if (loc.placeName) {
    trail.push({ name: loc.placeName, level: "place", lat, lon });
  } else if (loc.road) {
    trail.push({ name: loc.road, level: "street", lat, lon });
  }
  return trail;
}

/** Map arrival scale for a trail level (in-map navigation). */
export const TRAIL_LEVEL_ZOOM: Record<Exclude<TrailLevel, "earth">, number> = {
  continent: 4.25,
  country: 6.8,
  region: 9.5,
  city: 11.5,
  district: 13.75,
  street: 15.75,
  place: 16.5,
};

/** One-time selection announcement for assistive tech. */
export function announceResolved(loc: ResolvedLocation): string {
  const leaf = loc.placeName ?? loc.road;
  if (leaf) {
    const context = [loc.district, loc.city, loc.country]
      .filter((v): v is string => !!v && v !== leaf)
      .join(", ");
    return `Selected ${leaf}${context ? `, ${context}` : ""}.`;
  }
  const geo = [loc.district, loc.city, loc.region, loc.country]
    .filter(Boolean)
    .join(", ");
  if (geo) return `Selected location in ${geo}.`;
  return `Selected location, ${Math.abs(loc.lat).toFixed(2)} ${loc.lat >= 0 ? "north" : "south"}, ${Math.abs(loc.lon).toFixed(2)} ${loc.lon >= 0 ? "east" : "west"}.`;
}
