"use client";

/**
 * SYSTEMBOOM EARTH — provider switch.
 *
 * Google Maps 3D is the APPROVED preferred Earth provider; Leaflet + OSM
 * is a TEMPORARY fallback so the prototype stays fully explorable until
 * a Google Maps key is configured. Both providers consume the identical
 * handoff contract, so activation is just the presence of
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY — no application redesign.
 *
 * Selection:
 *   key present and Google initializes  → GOOGLE
 *   otherwise (or runtime failure)      → OPENSTREETMAP FALLBACK
 */

import { useEffect, useState } from "react";
import { googleMapsKey } from "@/lib/earth/google-loader";
import { GoogleEarth } from "./GoogleEarth";
import { LeafletEarth } from "./LeafletEarth";

export interface EarthExplorerProps {
  visible: boolean;
  /** Coordinates handed over from the R3F approach (optional arrival zoom). */
  initialView: { lat: number; lon: number; zoom?: number };
  /** When set, the journey continues to this SYSTEMBOOM office and selects it. */
  initialOfficeId?: string | null;
  reduced: boolean;
  /** Called when the surface releases control back to the R3F Earth. */
  onExited: () => void;
  /** Semantic ladder: a breadcrumb navigated outward past map scales. */
  onNavigateOut?: (target: {
    kind: "earth" | "continent" | "country";
    name: string;
    lat?: number;
    lon?: number;
    from: { lat: number; lon: number; zoom: number };
  }) => void;
}

export function EarthExplorer(props: EarthExplorerProps) {
  const [provider, setProvider] = useState<"google" | "leaflet">(() =>
    googleMapsKey() ? "google" : "leaflet",
  );

  // Developer-only visibility — never part of the consumer UI.
  useEffect(() => {
    console.info(
      `[SYSTEMBOOM] Earth provider: ${provider === "google" ? "GOOGLE" : "OPENSTREETMAP FALLBACK"}`,
    );
  }, [provider]);

  if (provider === "google") {
    return <GoogleEarth {...props} onFailed={() => setProvider("leaflet")} />;
  }
  return <LeafletEarth {...props} />;
}
