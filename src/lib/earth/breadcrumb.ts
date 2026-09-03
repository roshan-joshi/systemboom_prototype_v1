/**
 * Spatial context resolution for the Earth Explorer breadcrumb.
 * Curated bounding boxes — honest approximations for the prototype;
 * a Places/geocoding service replaces this later.
 */

interface BBox {
  name: string;
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

const CONTINENT_BOXES: BBox[] = [
  { name: "Antarctica", latMin: -90, latMax: -60, lonMin: -180, lonMax: 180 },
  { name: "Oceania", latMin: -50, latMax: 0, lonMin: 110, lonMax: 180 },
  { name: "Asia", latMin: 0, latMax: 78, lonMin: 60, lonMax: 180 },
  { name: "Asia", latMin: 12, latMax: 55, lonMin: 26, lonMax: 60 },
  { name: "Europe", latMin: 36, latMax: 72, lonMin: -11, lonMax: 60 },
  { name: "Africa", latMin: -35, latMax: 36, lonMin: -18, lonMax: 52 },
  { name: "North America", latMin: 7, latMax: 84, lonMin: -170, lonMax: -50 },
  { name: "South America", latMin: -56, latMax: 13, lonMin: -82, lonMax: -34 },
];

const COUNTRY_BOXES: BBox[] = [
  { name: "Nepal", latMin: 26.3, latMax: 30.5, lonMin: 80.0, lonMax: 88.2 },
  { name: "India", latMin: 6.5, latMax: 26.3, lonMin: 68, lonMax: 97.4 },
  { name: "China", latMin: 30.5, latMax: 53.5, lonMin: 88.2, lonMax: 135 },
  { name: "Japan", latMin: 30.9, latMax: 45.6, lonMin: 129.4, lonMax: 145.9 },
  { name: "Australia", latMin: -44, latMax: -10, lonMin: 112.8, lonMax: 154 },
  { name: "United States", latMin: 24.4, latMax: 49.4, lonMin: -125, lonMax: -66.8 },
  { name: "United Kingdom", latMin: 49.9, latMax: 58.7, lonMin: -8.2, lonMax: 1.8 },
  { name: "Iceland", latMin: 63.2, latMax: 66.6, lonMin: -24.6, lonMax: -13.4 },
  { name: "Kenya", latMin: -4.7, latMax: 5.1, lonMin: 33.9, lonMax: 41.9 },
  { name: "Peru", latMin: -18.4, latMax: -0.03, lonMin: -81.4, lonMax: -68.6 },
  { name: "Egypt", latMin: 22, latMax: 31.7, lonMin: 24.7, lonMax: 36.9 },
  { name: "France", latMin: 42.3, latMax: 51.1, lonMin: -4.8, lonMax: 8.2 },
  { name: "Germany", latMin: 47.3, latMax: 55.1, lonMin: 5.9, lonMax: 15 },
];

const CITY_POINTS: { name: string; lat: number; lon: number; r: number }[] = [
  { name: "Kathmandu", lat: 27.7103, lon: 85.3222, r: 0.28 },
  { name: "Sydney", lat: -33.868, lon: 151.209, r: 0.5 },
  { name: "Tokyo", lat: 35.68, lon: 139.69, r: 0.55 },
  { name: "Kyoto", lat: 35.01, lon: 135.77, r: 0.3 },
  { name: "New York", lat: 40.713, lon: -74.006, r: 0.45 },
  { name: "London", lat: 51.507, lon: -0.128, r: 0.45 },
  { name: "Reykjavík", lat: 64.15, lon: -21.94, r: 0.3 },
  { name: "Nairobi", lat: -1.29, lon: 36.82, r: 0.35 },
  { name: "Cusco", lat: -13.53, lon: -71.97, r: 0.3 },
  { name: "Pokhara", lat: 28.21, lon: 83.99, r: 0.22 },
];

const REGION_BOXES: BBox[] = [
  { name: "Bagmati", latMin: 27.3, latMax: 28.4, lonMin: 84.9, lonMax: 86.2 },
  { name: "Khumbu", latMin: 27.7, latMax: 28.2, lonMin: 86.5, lonMax: 87.1 },
];

const DISTRICT_POINTS: { name: string; lat: number; lon: number; r: number }[] = [
  { name: "Maharajgunj", lat: 27.7392, lon: 85.3305, r: 0.016 },
  { name: "Thamel", lat: 27.7154, lon: 85.3123, r: 0.012 },
  { name: "Patan", lat: 27.6733, lon: 85.325, r: 0.018 },
  { name: "Boudha", lat: 27.7215, lon: 85.362, r: 0.014 },
  { name: "Sinamangal", lat: 27.6981, lon: 85.3592, r: 0.014 },
  { name: "Gaushala", lat: 27.7104, lon: 85.3487, r: 0.012 },
];

function inBox(lat: number, lon: number, b: BBox) {
  return lat >= b.latMin && lat <= b.latMax && lon >= b.lonMin && lon <= b.lonMax;
}

export interface SpatialContext {
  /** Ordered crumbs, always starting with EARTH. */
  crumbs: string[];
  /** The deepest resolved context name (for the scale chip). */
  focusName: string;
}

/**
 * Resolve breadcrumb crumbs for a camera position.
 * Altitude (metres) truncates depth so planetary views stay quiet.
 */
export function resolveContext(lat: number, lon: number, altitude: number): SpatialContext {
  const crumbs: string[] = ["Earth"];

  if (altitude < 13_000_000) {
    const continent = CONTINENT_BOXES.find((b) => inBox(lat, lon, b));
    if (continent) crumbs.push(continent.name);
  }
  if (altitude < 3_600_000) {
    const country = COUNTRY_BOXES.find((b) => inBox(lat, lon, b));
    if (country) crumbs.push(country.name);
  }
  if (altitude < 750_000) {
    const region = REGION_BOXES.find((b) => inBox(lat, lon, b));
    if (region) crumbs.push(region.name);
  }
  if (altitude < 190_000) {
    const city = CITY_POINTS.find(
      (c) => Math.hypot(lat - c.lat, lon - c.lon) < c.r,
    );
    if (city) crumbs.push(city.name);
  }
  if (altitude < 30_000) {
    const district = DISTRICT_POINTS.find(
      (d) => Math.hypot(lat - d.lat, lon - d.lon) < d.r,
    );
    if (district) crumbs.push(district.name);
  }

  return { crumbs, focusName: crumbs[crumbs.length - 1] };
}

/* ============================================================
   SEMANTIC ZOOM LADDER — every crumb is a navigable scale.
   ============================================================ */

export type CrumbTier = "earth" | "continent" | "country" | "region" | "city" | "district";

export interface CrumbTarget {
  name: string;
  tier: CrumbTier;
  lat: number;
  lon: number;
}

const boxCenter = (b: BBox) => ({
  lat: (b.latMin + b.latMax) / 2,
  lon: (b.lonMin + b.lonMax) / 2,
});

/** Better-composed continent anchors than raw bbox centers. */
const CONTINENT_ANCHORS: Record<string, { lat: number; lon: number }> = {
  Asia: { lat: 34, lon: 92 },
  Europe: { lat: 50, lon: 14 },
  Africa: { lat: 3, lon: 21 },
  "North America": { lat: 44, lon: -100 },
  "South America": { lat: -14, lon: -59 },
  Oceania: { lat: -25, lon: 140 },
  Antarctica: { lat: -79, lon: 20 },
};

/** Resolve a breadcrumb name back to a navigable geographic target. */
export function crumbTarget(name: string): CrumbTarget | null {
  if (name === "Earth") return { name, tier: "earth", lat: 0, lon: 0 };
  const anchor = CONTINENT_ANCHORS[name];
  if (anchor) return { name, tier: "continent", ...anchor };
  const country = COUNTRY_BOXES.find((b) => b.name === name);
  if (country) return { name, tier: "country", ...boxCenter(country) };
  const region = REGION_BOXES.find((b) => b.name === name);
  if (region) return { name, tier: "region", ...boxCenter(region) };
  const city = CITY_POINTS.find((c) => c.name === name);
  if (city) return { name, tier: "city", lat: city.lat, lon: city.lon };
  const district = DISTRICT_POINTS.find((d) => d.name === name);
  if (district) return { name, tier: "district", lat: district.lat, lon: district.lon };
  return null;
}

/** "12,400 km" / "38 km" / "640 m" formatting for the scale chip. */
export function formatAltitude(metres: number): string {
  if (metres >= 10_000) {
    return `${Math.round(metres / 1000).toLocaleString()} km`;
  }
  if (metres >= 1_000) {
    return `${(metres / 1000).toFixed(1)} km`;
  }
  return `${Math.round(metres)} m`;
}
