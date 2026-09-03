/**
 * Centralized map tile configuration for the TEMPORARY Leaflet fallback —
 * swap the source here without touching map components.
 *
 * PROTOTYPE ONLY: OpenStreetMap DATA is open (ODbL), but the public
 * openstreetmap.org tile server is a community-funded public service and
 * is NOT SYSTEMBOOM's production tile infrastructure. Google Maps 3D is
 * the approved future provider (activated by NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).
 * No prefetching, no bulk download, no offline caching.
 */

export interface TileSource {
  id: string;
  label: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

export const MAP_TILES: TileSource = {
  id: "osm-standard",
  label: "Map",
  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "© OpenStreetMap contributors",
  maxZoom: 19,
};
