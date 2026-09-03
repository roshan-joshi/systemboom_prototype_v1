/**
 * SYSTEMBOOM offices — the single source of truth for every office
 * representation: cosmic beacons, Earth-surface signals, Google markers
 * and Leaflet fallback markers all consume this configuration.
 */

export type OfficeType = "HEAD_OFFICE" | "DEVELOPMENT_OFFICE";

export interface SystemboomOffice {
  id: string;
  type: OfficeType;
  name: string;
  /** Short role label for beacons ("Head Office"). */
  role: string;
  /**
   * Owner-supplied display address — shown EXACTLY as provided.
   * Never overwritten by geocoder output (store normalized results
   * separately if a geocoder is ever wired).
   */
  displayAddress: string;
  /** Near-space label line ("London · Earth") — LOD 2 beacons. */
  nearLine: string;
  /** Deep-inspection label line ("London, United Kingdom") — LOD 3 beacons. */
  deepLine: string;
  latitude: number;
  longitude: number;
  /** Honest coordinate quality. */
  precision: "approximate" | "city";
  /** True when the coordinate has not been verified by a geocoding provider. */
  needsGeocodeVerification: boolean;
}

export const SYSTEMBOOM_OFFICES: SystemboomOffice[] = [
  {
    id: "head-office",
    type: "HEAD_OFFICE",
    name: "SYSTEMBOOM Head Office",
    role: "Head Office",
    displayAddress: "Unit 20-21 Vittoria Worth\n10 Stour Road\nE3 2NT\nUnited Kingdom",
    nearLine: "London · Earth",
    deepLine: "London, United Kingdom",
    // TEMPORARY approximation for the Stour Road / E3 2NT area (Fish Island,
    // London) — no geocoding provider is configured in this environment.
    latitude: 51.5366,
    longitude: -0.0225,
    precision: "approximate",
    needsGeocodeVerification: true,
  },
  {
    id: "development-office",
    type: "DEVELOPMENT_OFFICE",
    name: "SYSTEMBOOM Development Office",
    role: "Development Office",
    displayAddress: "Kathmandu\nNepal",
    nearLine: "Kathmandu · Earth",
    deepLine: "Kathmandu, Nepal",
    // City-level only — exact development-office address not yet supplied.
    latitude: 27.7172,
    longitude: 85.324,
    precision: "city",
    needsGeocodeVerification: false,
  },
];

export const HEAD_OFFICE = SYSTEMBOOM_OFFICES[0];
