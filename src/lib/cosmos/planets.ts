/**
 * SYSTEMBOOM Cosmos — central planetary data.
 *
 * Astronomy facts (ordinal, type, day length, moon counts, distance)
 * are accurate values sourced from NASA planetary fact sheets
 * (moon counts as recognized in 2025).
 *
 * Visual values (radius, orbitRadius, periods, angles) are a compressed
 * CINEMATIC representation — deliberately not to scale, tuned for
 * legibility and depth. The UI never claims scientific scale.
 */

export type PlanetId =
  | "mercury"
  | "venus"
  | "earth"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune";

export interface PlanetSpec {
  id: PlanetId;
  name: string;
  ordinal: string;
  type: string;
  dayLength: string;
  moons: number;
  distance: string;
  fact: string;
  /* — cinematic model — */
  radius: number;
  orbitRadius: number;
  /** Real orbital period in years; visual speed derives from it, compressed. */
  periodYears: number;
  /** Real rotation period in hours (negative = retrograde). */
  spinHours: number;
  tiltDeg: number;
  /** Deterministic starting position on the orbit (degrees). */
  initialAngleDeg: number;
  texture: string;
  ringTexture?: string;
}

export const PLANETS: PlanetSpec[] = [
  {
    id: "mercury",
    name: "Mercury",
    ordinal: "1st planet from the Sun",
    type: "Rocky planet",
    dayLength: "1,408 hours",
    moons: 0,
    distance: "0.39 AU",
    fact: "A year on Mercury lasts only 88 Earth days.",
    radius: 0.42,
    orbitRadius: 7.5,
    periodYears: 0.241,
    spinHours: 1407.6,
    tiltDeg: 0.03,
    initialAngleDeg: 300,
    texture: "/cosmos/2k_mercury.jpg",
  },
  {
    id: "venus",
    name: "Venus",
    ordinal: "2nd planet from the Sun",
    type: "Rocky planet",
    dayLength: "5,832 hours",
    moons: 0,
    distance: "0.72 AU",
    fact: "Venus spins backwards — its Sun rises in the west.",
    radius: 0.95,
    orbitRadius: 10.5,
    periodYears: 0.615,
    spinHours: -5832.5,
    tiltDeg: 177.4,
    initialAngleDeg: 210,
    texture: "/cosmos/2k_venus_atmosphere.jpg",
  },
  {
    id: "earth",
    name: "Earth",
    ordinal: "3rd planet from the Sun",
    type: "Rocky planet · our world",
    dayLength: "23.9 hours",
    moons: 1,
    distance: "1.00 AU",
    fact: "The only known world where life writes its own story.",
    radius: 1.05,
    orbitRadius: 14,
    periodYears: 1,
    spinHours: 23.9,
    tiltDeg: 23.4,
    initialAngleDeg: 350,
    texture: "/cosmos/2k_earth_daymap.jpg",
  },
  {
    id: "mars",
    name: "Mars",
    ordinal: "4th planet from the Sun",
    type: "Rocky planet",
    dayLength: "24.6 hours",
    moons: 2,
    distance: "1.52 AU",
    fact: "Home to Olympus Mons — the tallest volcano we know.",
    radius: 0.66,
    orbitRadius: 17.5,
    periodYears: 1.88,
    spinHours: 24.6,
    tiltDeg: 25.2,
    initialAngleDeg: 130,
    texture: "/cosmos/2k_mars.jpg",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    ordinal: "5th planet from the Sun",
    type: "Gas giant",
    dayLength: "9.9 hours",
    moons: 95,
    distance: "5.20 AU",
    fact: "More massive than every other planet combined.",
    radius: 2.7,
    orbitRadius: 25,
    periodYears: 11.86,
    spinHours: 9.9,
    tiltDeg: 3.1,
    initialAngleDeg: 25,
    texture: "/cosmos/2k_jupiter.jpg",
  },
  {
    id: "saturn",
    name: "Saturn",
    ordinal: "6th planet from the Sun",
    type: "Gas giant",
    dayLength: "10.7 hours",
    moons: 274,
    distance: "9.58 AU",
    fact: "Its rings are mostly water ice — and astonishingly thin.",
    radius: 2.3,
    orbitRadius: 32.5,
    periodYears: 29.45,
    spinHours: 10.7,
    tiltDeg: 26.7,
    initialAngleDeg: 175,
    texture: "/cosmos/2k_saturn.jpg",
    ringTexture: "/cosmos/2k_saturn_ring_alpha.png",
  },
  {
    id: "uranus",
    name: "Uranus",
    ordinal: "7th planet from the Sun",
    type: "Ice giant",
    dayLength: "17.2 hours",
    moons: 28,
    distance: "19.2 AU",
    fact: "Rolls around the Sun on its side, tilted 98 degrees.",
    radius: 1.35,
    orbitRadius: 39.5,
    periodYears: 84.0,
    spinHours: -17.2,
    tiltDeg: 97.8,
    initialAngleDeg: 205,
    texture: "/cosmos/2k_uranus.jpg",
  },
  {
    id: "neptune",
    name: "Neptune",
    ordinal: "8th planet from the Sun",
    type: "Ice giant",
    dayLength: "16.1 hours",
    moons: 16,
    distance: "30.1 AU",
    fact: "Winds here reach 2,000 km/h — the fastest in the Solar System.",
    radius: 1.3,
    orbitRadius: 45.5,
    periodYears: 164.8,
    spinHours: 16.1,
    tiltDeg: 28.3,
    initialAngleDeg: 195,
    texture: "/cosmos/2k_neptune.jpg",
  },
];

export const PLANET_BY_ID = Object.fromEntries(
  PLANETS.map((p) => [p.id, p]),
) as Record<PlanetId, PlanetSpec>;

/** Visual seconds for one Earth orbit; other periods compress via ^0.55. */
export const EARTH_ORBIT_SECONDS = 240;

export function orbitAngularSpeed(periodYears: number): number {
  const visualSeconds = EARTH_ORBIT_SECONDS * Math.pow(periodYears, 0.55);
  return (Math.PI * 2) / visualSeconds;
}

/** Visual self-rotation speed: Earth spins once per ~40s; others scale by real day length. */
export function spinAngularSpeed(spinHours: number): number {
  const earthVisual = (Math.PI * 2) / 40;
  return earthVisual * (23.9 / spinHours);
}

/* ============================================================
   EARTH EXPLORER — example public places (demo data)
   ============================================================ */

export interface Hotspot {
  id: string;
  place: string;
  region: string;
  lat: number;
  lon: number;
  note: string;
}

export const HOTSPOTS: Hotspot[] = [
  {
    id: "kathmandu",
    place: "Kathmandu",
    region: "Asia · Nepal",
    lat: 27.71,
    lon: 85.32,
    note: "A valley of temples beneath the high Himalaya.",
  },
  {
    id: "kyoto",
    place: "Kyoto",
    region: "Asia · Japan",
    lat: 35.01,
    lon: 135.77,
    note: "Sixteen centuries of seasons, kept carefully.",
  },
  {
    id: "nairobi",
    place: "Nairobi",
    region: "Africa · Kenya",
    lat: -1.29,
    lon: 36.82,
    note: "The only capital with a wild savanna at its edge.",
  },
  {
    id: "reykjavik",
    place: "Reykjavík",
    region: "Europe · Iceland",
    lat: 64.15,
    lon: -21.94,
    note: "Where the northern lights visit the city itself.",
  },
  {
    id: "cusco",
    place: "Cusco",
    region: "South America · Peru",
    lat: -13.53,
    lon: -71.97,
    note: "Once the navel of the Inca world, 3,400m up.",
  },
  {
    id: "sydney",
    place: "Sydney",
    region: "Oceania · Australia",
    lat: -33.87,
    lon: 151.21,
    note: "A harbour city that begins each global sunrise.",
  },
];
