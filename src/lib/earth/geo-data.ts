/**
 * SYSTEMBOOM Earth — curated local geographic dataset.
 *
 * This is the prototype's semantic layer: real, well-known coordinates
 * (approximate label anchors, not survey data) powering zoom-driven
 * labels, breadcrumbs and search until Google Places / richer data
 * sources are enabled. The UI never claims survey precision.
 *
 * Semantic zoom tiers (camera altitude, metres):
 *   E0 space      > 12,000 km   — whole Earth
 *   E1 planet      3,500–12,000 km — continents
 *   E2 country       700–3,500 km — countries
 *   E3 region        150–700 km   — provinces / major geography
 *   E4 city           25–150 km   — cities
 *   E5 neighbourhood   4–25 km    — districts, local structure
 *   E6 place            < 4 km    — precise public places
 *   E7 ground        (architecture only — future Street View tier)
 */

export type GeoTier =
  | "continent"
  | "country"
  | "region"
  | "city"
  | "district"
  | "place";

export interface GeoLabel {
  id: string;
  name: string;
  tier: GeoTier;
  lat: number;
  lon: number;
}

export interface GeoPlace extends GeoLabel {
  tier: "place";
  area: string;
  city: string;
  country: string;
  /** Approximate elevation context, honest wording only. */
  context?: string;
}

/** Label visibility bands per tier — metres of camera distance. */
export const TIER_DISPLAY: Record<GeoTier, [near: number, far: number]> = {
  continent: [3_500_000, 13_000_000],
  country: [700_000, 4_200_000],
  region: [150_000, 900_000],
  city: [25_000, 190_000],
  district: [3_500, 32_000],
  place: [0, 6_000],
};

export const CONTINENTS: GeoLabel[] = [
  { id: "asia", name: "Asia", tier: "continent", lat: 34, lon: 95 },
  { id: "europe", name: "Europe", tier: "continent", lat: 50, lon: 14 },
  { id: "africa", name: "Africa", tier: "continent", lat: 3, lon: 21 },
  { id: "north-america", name: "North America", tier: "continent", lat: 46, lon: -101 },
  { id: "south-america", name: "South America", tier: "continent", lat: -14, lon: -59 },
  { id: "oceania", name: "Oceania", tier: "continent", lat: -24, lon: 140 },
  { id: "antarctica", name: "Antarctica", tier: "continent", lat: -79, lon: 20 },
];

export const COUNTRIES: GeoLabel[] = [
  { id: "nepal", name: "Nepal", tier: "country", lat: 28.2, lon: 84.1 },
  { id: "india", name: "India", tier: "country", lat: 22.5, lon: 79 },
  { id: "china", name: "China", tier: "country", lat: 35, lon: 103 },
  { id: "japan", name: "Japan", tier: "country", lat: 36.5, lon: 138.5 },
  { id: "thailand", name: "Thailand", tier: "country", lat: 15.5, lon: 101 },
  { id: "indonesia", name: "Indonesia", tier: "country", lat: -2.5, lon: 118 },
  { id: "pakistan", name: "Pakistan", tier: "country", lat: 30, lon: 69.5 },
  { id: "bangladesh", name: "Bangladesh", tier: "country", lat: 23.8, lon: 90.3 },
  { id: "south-korea", name: "South Korea", tier: "country", lat: 36.3, lon: 127.9 },
  { id: "saudi-arabia", name: "Saudi Arabia", tier: "country", lat: 24, lon: 45 },
  { id: "turkey", name: "Türkiye", tier: "country", lat: 39, lon: 35.5 },
  { id: "russia", name: "Russia", tier: "country", lat: 60, lon: 90 },
  { id: "uk", name: "United Kingdom", tier: "country", lat: 53.5, lon: -2.4 },
  { id: "france", name: "France", tier: "country", lat: 46.6, lon: 2.4 },
  { id: "germany", name: "Germany", tier: "country", lat: 51.1, lon: 10.4 },
  { id: "spain", name: "Spain", tier: "country", lat: 40.3, lon: -3.7 },
  { id: "italy", name: "Italy", tier: "country", lat: 42.8, lon: 12.6 },
  { id: "norway", name: "Norway", tier: "country", lat: 61, lon: 8.8 },
  { id: "iceland", name: "Iceland", tier: "country", lat: 64.9, lon: -18.6 },
  { id: "egypt", name: "Egypt", tier: "country", lat: 26.7, lon: 30 },
  { id: "kenya", name: "Kenya", tier: "country", lat: 0.4, lon: 37.9 },
  { id: "south-africa", name: "South Africa", tier: "country", lat: -29, lon: 24.7 },
  { id: "usa", name: "United States", tier: "country", lat: 39.5, lon: -98.6 },
  { id: "canada", name: "Canada", tier: "country", lat: 56.9, lon: -103.5 },
  { id: "mexico", name: "Mexico", tier: "country", lat: 23.8, lon: -102.4 },
  { id: "brazil", name: "Brazil", tier: "country", lat: -10.8, lon: -52.9 },
  { id: "peru", name: "Peru", tier: "country", lat: -9.9, lon: -74.4 },
  { id: "argentina", name: "Argentina", tier: "country", lat: -35.2, lon: -65.2 },
  { id: "australia", name: "Australia", tier: "country", lat: -25.5, lon: 134.3 },
  { id: "new-zealand", name: "New Zealand", tier: "country", lat: -42.7, lon: 172.5 },
];

export const CITIES: GeoLabel[] = [
  { id: "kathmandu", name: "Kathmandu", tier: "city", lat: 27.7103, lon: 85.3222 },
  { id: "pokhara", name: "Pokhara", tier: "city", lat: 28.21, lon: 83.99 },
  { id: "delhi", name: "New Delhi", tier: "city", lat: 28.61, lon: 77.21 },
  { id: "mumbai", name: "Mumbai", tier: "city", lat: 19.08, lon: 72.88 },
  { id: "tokyo", name: "Tokyo", tier: "city", lat: 35.68, lon: 139.69 },
  { id: "kyoto", name: "Kyoto", tier: "city", lat: 35.01, lon: 135.77 },
  { id: "beijing", name: "Beijing", tier: "city", lat: 39.9, lon: 116.4 },
  { id: "shanghai", name: "Shanghai", tier: "city", lat: 31.23, lon: 121.47 },
  { id: "bangkok", name: "Bangkok", tier: "city", lat: 13.76, lon: 100.5 },
  { id: "singapore", name: "Singapore", tier: "city", lat: 1.35, lon: 103.82 },
  { id: "seoul", name: "Seoul", tier: "city", lat: 37.57, lon: 126.98 },
  { id: "dubai", name: "Dubai", tier: "city", lat: 25.2, lon: 55.27 },
  { id: "istanbul", name: "Istanbul", tier: "city", lat: 41.01, lon: 28.98 },
  { id: "moscow", name: "Moscow", tier: "city", lat: 55.76, lon: 37.62 },
  { id: "london", name: "London", tier: "city", lat: 51.51, lon: -0.13 },
  { id: "paris", name: "Paris", tier: "city", lat: 48.86, lon: 2.35 },
  { id: "berlin", name: "Berlin", tier: "city", lat: 52.52, lon: 13.41 },
  { id: "rome", name: "Rome", tier: "city", lat: 41.9, lon: 12.5 },
  { id: "madrid", name: "Madrid", tier: "city", lat: 40.42, lon: -3.7 },
  { id: "oslo", name: "Oslo", tier: "city", lat: 59.91, lon: 10.75 },
  { id: "reykjavik", name: "Reykjavík", tier: "city", lat: 64.15, lon: -21.94 },
  { id: "cairo", name: "Cairo", tier: "city", lat: 30.04, lon: 31.24 },
  { id: "nairobi", name: "Nairobi", tier: "city", lat: -1.29, lon: 36.82 },
  { id: "cape-town", name: "Cape Town", tier: "city", lat: -33.92, lon: 18.42 },
  { id: "new-york", name: "New York", tier: "city", lat: 40.71, lon: -74.01 },
  { id: "chicago", name: "Chicago", tier: "city", lat: 41.88, lon: -87.63 },
  { id: "los-angeles", name: "Los Angeles", tier: "city", lat: 34.05, lon: -118.24 },
  { id: "toronto", name: "Toronto", tier: "city", lat: 43.65, lon: -79.38 },
  { id: "mexico-city", name: "Mexico City", tier: "city", lat: 19.43, lon: -99.13 },
  { id: "sao-paulo", name: "São Paulo", tier: "city", lat: -23.55, lon: -46.63 },
  { id: "buenos-aires", name: "Buenos Aires", tier: "city", lat: -34.6, lon: -58.38 },
  { id: "lima", name: "Lima", tier: "city", lat: -12.05, lon: -77.04 },
  { id: "cusco", name: "Cusco", tier: "city", lat: -13.53, lon: -71.97 },
  { id: "sydney", name: "Sydney", tier: "city", lat: -33.87, lon: 151.21 },
  { id: "melbourne", name: "Melbourne", tier: "city", lat: -37.81, lon: 144.96 },
  { id: "auckland", name: "Auckland", tier: "city", lat: -36.85, lon: 174.76 },
];

export const REGIONS: GeoLabel[] = [
  { id: "bagmati", name: "Bagmati Province", tier: "region", lat: 27.85, lon: 85.55 },
  { id: "gandaki", name: "Gandaki Province", tier: "region", lat: 28.4, lon: 84.1 },
  { id: "khumbu", name: "Khumbu · High Himalaya", tier: "region", lat: 27.95, lon: 86.8 },
];

export const DISTRICTS: GeoLabel[] = [
  { id: "maharajgunj", name: "Maharajgunj", tier: "district", lat: 27.7392, lon: 85.3305 },
  { id: "thamel", name: "Thamel", tier: "district", lat: 27.7154, lon: 85.3123 },
  { id: "patan", name: "Patan", tier: "district", lat: 27.6733, lon: 85.325 },
  { id: "boudha", name: "Boudha", tier: "district", lat: 27.7215, lon: 85.3620 },
  { id: "kirtipur", name: "Kirtipur", tier: "district", lat: 27.6789, lon: 85.2775 },
];

export const PLACES: GeoPlace[] = [
  {
    id: "tuth",
    name: "T.U. Teaching Hospital",
    tier: "place",
    lat: 27.7358,
    lon: 85.3305,
    area: "Maharajgunj",
    city: "Kathmandu",
    country: "Nepal",
    context: "Kathmandu Valley · roughly 1,300 m above sea level",
  },
  {
    id: "pashupatinath",
    name: "Pashupatinath Temple",
    tier: "place",
    lat: 27.7104,
    lon: 85.3487,
    area: "Gaushala",
    city: "Kathmandu",
    country: "Nepal",
    context: "On the banks of the Bagmati river",
  },
  {
    id: "swayambhunath",
    name: "Swayambhunath Stupa",
    tier: "place",
    lat: 27.7149,
    lon: 85.2904,
    area: "Swayambhu",
    city: "Kathmandu",
    country: "Nepal",
    context: "Hilltop stupa overlooking the valley",
  },
  {
    id: "durbar-square",
    name: "Kathmandu Durbar Square",
    tier: "place",
    lat: 27.7043,
    lon: 85.3076,
    area: "Basantapur",
    city: "Kathmandu",
    country: "Nepal",
    context: "Historic royal plaza of the old city",
  },
  {
    id: "tia",
    name: "Tribhuvan International Airport",
    tier: "place",
    lat: 27.6981,
    lon: 85.3592,
    area: "Sinamangal",
    city: "Kathmandu",
    country: "Nepal",
    context: "Nepal's primary international gateway",
  },
];

/* ============================================================
   SEARCH DESTINATIONS — curated prototype list
   ============================================================ */

export interface Destination {
  id: string;
  name: string;
  detail: string;
  lat: number;
  lon: number;
  /** Arrival camera altitude in metres. */
  altitude: number;
  /** Arrival pitch in degrees (negative looks down). */
  pitch: number;
}

export const DESTINATIONS: Destination[] = [
  { id: "kathmandu", name: "Kathmandu", detail: "Nepal", lat: 27.7103, lon: 85.3222, altitude: 32_000, pitch: -87 },
  { id: "everest", name: "Mount Everest", detail: "Nepal · 8,849 m", lat: 27.9881, lon: 86.925, altitude: 42_000, pitch: -75 },
  { id: "sydney", name: "Sydney", detail: "Australia", lat: -33.868, lon: 151.209, altitude: 30_000, pitch: -87 },
  { id: "tokyo", name: "Tokyo", detail: "Japan", lat: 35.68, lon: 139.69, altitude: 34_000, pitch: -87 },
  { id: "new-york", name: "New York", detail: "United States", lat: 40.713, lon: -74.006, altitude: 28_000, pitch: -87 },
  { id: "london", name: "London", detail: "United Kingdom", lat: 51.507, lon: -0.128, altitude: 28_000, pitch: -87 },
  { id: "grand-canyon", name: "Grand Canyon", detail: "United States", lat: 36.1069, lon: -112.1129, altitude: 38_000, pitch: -72 },
  { id: "tuth", name: "T.U. Teaching Hospital", detail: "Maharajgunj · Kathmandu", lat: 27.7358, lon: 85.3305, altitude: 1_600, pitch: -60 },
  { id: "pashupatinath", name: "Pashupatinath Temple", detail: "Kathmandu · Nepal", lat: 27.7104, lon: 85.3487, altitude: 1_800, pitch: -60 },
  { id: "durbar-square", name: "Kathmandu Durbar Square", detail: "Kathmandu · Nepal", lat: 27.7043, lon: 85.3076, altitude: 1_800, pitch: -60 },
  { id: "kyoto", name: "Kyoto", detail: "Japan", lat: 35.01, lon: 135.77, altitude: 30_000, pitch: -87 },
  { id: "reykjavik", name: "Reykjavík", detail: "Iceland", lat: 64.15, lon: -21.94, altitude: 30_000, pitch: -87 },
];
