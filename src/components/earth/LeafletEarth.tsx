"use client";

/**
 * SYSTEMBOOM EARTH — Leaflet + OpenStreetMap (TEMPORARY FALLBACK PROVIDER).
 *
 * Active only while no Google Maps key is configured (Google 3D is the
 * approved future provider — see GoogleEarth.tsx). Consumes the exact same
 * handoff state and props, so swapping providers changes nothing upstream.
 *
 * OSM Standard tiles, prototype only (see src/lib/earth/tiles.ts).
 * Attribution stays visible. No prefetching, no offline tiles.
 */

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import { ArrowLeft, Minus, Plus, Search } from "lucide-react";
import { CHIP_BASE, useChrome } from "@/components/cosmos/overlays";
import { useTheme } from "@/lib/use-theme";
import {
  DESTINATIONS,
  PLACES,
  type Destination,
} from "@/lib/earth/geo-data";
import { MAP_TILES } from "@/lib/earth/tiles";
import { SYSTEMBOOM_OFFICES } from "@/lib/systemboom-origin";
import { crumbTarget, formatAltitude, resolveContext } from "@/lib/earth/breadcrumb";
import { GLOBE_GEO_LABELS, geoByName } from "@/lib/earth/globe-geo";
import { countryRings } from "@/lib/earth/country-shapes";
import { geoMapTarget, type MapTarget } from "@/lib/earth/map-target";
import {
  destinationFromOffice,
  destinationFromPlace,
  destinationFromResolved,
  destinationFromSearch,
  destinationFromSurface,
  type DestinationContext,
} from "@/lib/earth/destination";
import {
  announceResolved,
  resolveLocationLocal,
  resolveLocationOnline,
  trailFromResolved,
  TRAIL_LEVEL_ZOOM,
  type TrailEntry,
} from "@/lib/earth/locate";
import { geoPath } from "@/lib/earth/globe-geo";
import { DestinationPanel } from "./DestinationPanel";

/** Leaflet zoom at which we hand back to the R3F Earth. */
const EXIT_ZOOM = 4;
const ENTRY_ZOOM = 5;

/**
 * The country boundary is content, not chrome — it lives INSIDE the inverted
 * map container, so a dark steel line on day tiles auto-inverts to a light
 * line on night tiles. One color, legible in both themes, no counter-invert.
 */
const TERRITORY_COLOR = "#33517e";

/** Zoom bands where SYSTEMBOOM in-map geographic targets are shown. */
const COUNTRY_TARGET_BAND: [number, number] = [3, 6.4];
const CITY_TARGET_BAND: [number, number] = [6.2, 10];

/** In-map geographic target — honest SYSTEMBOOM overlay, clearly interactive
 *  (raster OSM text is never claimed clickable). Content-layer colors:
 *  dark ink + light halo on day tiles, auto-inverted on night tiles. */
function geoTargetHtml(name: string, kind: "country" | "city"): string {
  const size = kind === "country" ? 11 : 10;
  const spacing = kind === "country" ? "0.16em" : "0.1em";
  return `<span class="sb-geo-target-label" style="display:flex;width:150px;height:24px;align-items:center;justify-content:center;font-size:${size}px;font-weight:650;letter-spacing:${spacing};text-transform:uppercase;color:#16324f;text-shadow:0 1px 0 rgba(255,255,255,0.9),0 0 8px rgba(255,255,255,0.65);cursor:pointer;">
    <span style="border-bottom:1px dotted rgba(22,50,79,0.75);padding-bottom:1.5px;">${name}</span>
  </span>`;
}

/** Approximate visible ground height for a zoom level — feeds the scale chip. */
function pseudoAltitude(zoom: number, lat: number, viewportPx: number): number {
  const metersPerPixel =
    (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
  return Math.max(200, metersPerPixel * viewportPx);
}

/** SYSTEMBOOM lens marker markup (no default Leaflet pins). */
function lensHtml(active: boolean): string {
  if (active) {
    return `<span style="position:relative;display:block;width:26px;height:26px;">
      <span style="position:absolute;inset:0;border-radius:9999px;background:rgba(217,42,32,0.25);"></span>
      <span style="position:absolute;inset:5px;border-radius:9999px;background:#d92a20;box-shadow:0 1px 6px rgba(0,0,0,0.4);"></span>
      <span style="position:absolute;inset:10.5px;border-radius:9999px;background:#ffffff;"></span>
    </span>`;
  }
  return `<span style="position:relative;display:block;width:20px;height:20px;">
    <span style="position:absolute;inset:0;border-radius:9999px;border:2.5px solid #d92a20;background:rgba(10,13,20,0.35);box-shadow:0 1px 5px rgba(0,0,0,0.35);"></span>
    <span style="position:absolute;inset:6.5px;border-radius:9999px;background:#ffd08a;"></span>
  </span>`;
}

/**
 * The Cosmic Office Mast continued onto the surface — the same anatomy the
 * user followed from space: mascot · thin mast · illuminated contact point.
 */
/** The address trail for a curated semantic geography (globe lineage). */
function trailForGeo(geoId: string): TrailEntry[] {
  const entries: TrailEntry[] = [{ name: "Earth", level: "earth", lat: 0, lon: 0 }];
  for (const l of geoPath(geoId)) {
    entries.push({ name: l.name, level: l.kind, lat: l.lat, lon: l.lon, geoId: l.id });
  }
  return entries;
}

function officeMastHtml(selected: boolean): string {
  const glow = selected ? 1 : 0.85;
  return `<span style="position:relative;display:block;width:52px;height:72px;">
    <span style="position:absolute;left:2px;top:-2px;width:48px;height:48px;border-radius:9999px;background:radial-gradient(circle, rgba(255,210,165,${(0.9 * glow).toFixed(2)}) 0%, rgba(244,100,66,${(0.5 * glow).toFixed(2)}) 42%, rgba(217,42,32,0.16) 70%, transparent 100%);"></span>
    <span style="position:absolute;left:12px;top:7px;display:flex;width:28px;height:28px;align-items:center;justify-content:center;filter:drop-shadow(0 0 6px rgba(255,190,120,0.8));">
      <img src="/icon.png" alt="" style="width:27px;height:27px;object-fit:contain;filter:drop-shadow(0 1px 4px rgba(0,0,0,0.7));"/>
    </span>
    <span style="position:absolute;left:25px;top:37px;bottom:11px;width:2px;background:linear-gradient(to bottom, rgba(240,246,252,1), rgba(240,246,252,0.35));box-shadow:0 0 4px rgba(180,205,240,0.7);"></span>
    <span style="position:absolute;left:19.5px;bottom:3px;width:13px;height:13px;border-radius:9999px;border:1.5px solid rgba(225,236,248,0.95);background:rgba(10,13,20,0.4);box-shadow:0 0 5px rgba(180,205,240,0.5);"></span>
    <span style="position:absolute;left:23px;bottom:6.5px;width:6px;height:6px;border-radius:9999px;background:#ffd08a;box-shadow:0 0 9px 3px rgba(255,195,125,0.85);"></span>
    ${
      selected
        ? `<span style="position:absolute;left:15px;bottom:-1.5px;width:22px;height:22px;border-radius:9999px;border:1.5px solid rgba(217,42,32,0.7);animation:sb-beacon-pulse 4.2s ease-out infinite;"></span>`
        : ""
    }
  </span>`;
}



export function LeafletEarth({
  visible,
  initialView,
  initialOfficeId,
  reduced,
  onExited,
  onNavigateOut,
}: {
  visible: boolean;
  /** Coordinates handed over from the R3F approach (zoom or semantic target). */
  initialView: { lat: number; lon: number; zoom?: number; geoId?: string };
  /** Continue the journey to this SYSTEMBOOM office and select it. */
  initialOfficeId?: string | null;
  reduced: boolean;
  /** Called when the surface releases control back to the R3F Earth. */
  onExited: () => void;
  /** Map breadcrumb EARTH — the explicit exit back to the 3D Earth. */
  onNavigateOut?: (target: {
    kind: "earth";
    name: string;
    from: { lat: number; lon: number; zoom: number };
  }) => void;
}) {
  const { chip, panel } = useChrome();
  const theme = useTheme();
  // Over bright day imagery the cosmos' light chips wash out — map chrome
  // always uses a dark spatial-navigation glass.
  const mapChip =
    theme === "light"
      ? "bg-[rgba(14,28,50,0.6)] border-white/25 text-white hover:bg-[rgba(14,28,50,0.75)]"
      : chip;
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const officeMarkersRef = useRef<Record<string, Marker>>({});
  const exiting = useRef(false);
  const suppressExitZoom = useRef(true);
  const lastZoomRef = useRef(ENTRY_ZOOM);
  /** Real country boundary + focus cue currently identified on the map. */
  const territoryRef = useRef<import("leaflet").LayerGroup | null>(null);
  const territoryIdRef = useRef<string | null>(null);
  /** SYSTEMBOOM in-map geographic targets, gated by zoom band. */
  const geoTargetsRef = useRef<
    { marker: Marker; band: [number, number]; onMap: boolean }[]
  >([]);

  const [ready, setReady] = useState(false);
  const [crumbs, setCrumbs] = useState<string[]>(["Earth"]);
  const [altitude, setAltitude] = useState(1_000_000);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [destination, setDestination] = useState<DestinationContext | null>(null);
  const [navAnnounce, setNavAnnounce] = useState("");
  const [crumbsExpanded, setCrumbsExpanded] = useState(false);

  /* ---------- GEOGRAPHIC ADDRESS TRAIL (Phase 1.10C) ----------
     The active spatial path of the user's explicit selection. null =
     no selection; the breadcrumb falls back to live view context. */
  const [trail, setTrail] = useState<TrailEntry[] | null>(null);
  const [locating, setLocating] = useState(false);
  const [selAnnounce, setSelAnnounce] = useState("");
  const trailRef = useRef<TrailEntry[] | null>(null);
  useEffect(() => {
    trailRef.current = trail;
  }, [trail]);
  /** Latest-selection-wins: token + abort for in-flight reverse lookups. */
  const selToken = useRef(0);
  const selAbort = useRef<AbortController | null>(null);
  /** The generic selected-location lens (never the office mascot). */
  const selMarkerRef = useRef<Marker | null>(null);
  const selPointRef = useRef<{ lat: number; lon: number } | null>(null);
  /** Journeys invalidate any pending arrival — no stale panels mid-flight. */
  const arrivalToken = useRef(0);
  const tempMarkerRef = useRef<Marker | null>(null);

  /* ---------- destination arrivals ---------- */

  const syncMarkers = (ctx: DestinationContext | null) => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    for (const p of PLACES) {
      const active = ctx?.id === p.id;
      markersRef.current[p.id]?.setIcon(
        L.divIcon({
          className: "sb-lens",
          html: lensHtml(active),
          iconSize: active ? [26, 26] : [20, 20],
          iconAnchor: active ? [13, 13] : [10, 10],
        }),
      );
    }
    for (const office of SYSTEMBOOM_OFFICES) {
      officeMarkersRef.current[office.id]?.setIcon(
        L.divIcon({
          className: "sb-origin",
          html: officeMastHtml(ctx?.type === "OFFICE" && ctx.id === office.id),
          iconSize: [52, 72],
          iconAnchor: [26, 65],
        }),
      );
    }
    // Ordinary destinations without a standing marker get a temporary
    // SYSTEMBOOM lens — the mascot stays reserved for SYSTEMBOOM offices.
    // Map selections (sel-*) already carry their own selection lens.
    tempMarkerRef.current?.remove();
    tempMarkerRef.current = null;
    if (
      ctx &&
      ctx.type !== "OFFICE" &&
      !ctx.id.startsWith("sel-") &&
      !PLACES.some((p) => p.id === ctx.id)
    ) {
      tempMarkerRef.current = L.marker([ctx.latitude, ctx.longitude], {
        icon: L.divIcon({
          className: "sb-lens",
          html: lensHtml(true),
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
        interactive: false,
      }).addTo(map);
    }
  };

  const presentDestination = (ctx: DestinationContext | null) => {
    setDestination(ctx);
    syncMarkers(ctx);
  };

  /** A new journey begins: retire the old panel, invalidate pending arrivals. */
  const beginJourney = () => {
    arrivalToken.current++;
    presentDestination(null);
  };

  /** Camera settles → brief pause → the destination panel rises. */
  const scheduleArrival = (build: () => DestinationContext, afterMs: number) => {
    const token = arrivalToken.current;
    setTimeout(() => {
      if (token !== arrivalToken.current || !mapRef.current || exiting.current) return;
      presentDestination(build());
    }, afterMs + 220);
  };

  /* ---------- country territory: real boundary as map content ---------- */

  /**
   * Identify a country's REAL boundary on the map (Natural Earth subset) with
   * a restrained lens cue near its center — context, never a cage. Selection
   * of geography NEVER shows the SYSTEMBOOM office mascot.
   */
  const setTerritory = (countryId: string | null) => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __SB_TERRITORY?: string | null }).__SB_TERRITORY =
        countryId;
    }
    if (territoryIdRef.current === countryId) return;
    territoryRef.current?.remove();
    territoryRef.current = null;
    territoryIdRef.current = countryId;
    if (!countryId) return;
    const rings = countryRings(countryId);
    if (!rings) return;
    const group = L.layerGroup();
    for (const ring of rings) {
      const latlngs = ring.map(([lon, lat]) => [lat, lon] as [number, number]);
      L.polygon(latlngs, {
        color: TERRITORY_COLOR,
        weight: 1.6,
        opacity: 0.85,
        fillColor: TERRITORY_COLOR,
        fillOpacity: 0.045,
        interactive: false,
        className: "sb-territory",
      }).addTo(group);
    }
    const label = GLOBE_GEO_LABELS.find((g) => g.id === countryId);
    if (label) {
      // Small focus lens near the country center — restrained, non-interactive.
      L.marker([label.lat, label.lon], {
        icon: L.divIcon({
          className: "sb-lens",
          html: lensHtml(false),
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
        interactive: false,
        zIndexOffset: 200,
      }).addTo(group);
    }
    group.addTo(map);
  };

  /* ---------- in-map semantic navigation (names travel WITHIN the map) --- */

  /** Suppress the zoom-out exit while a semantic flight is underway. */
  const flightGuard = (ms: number) => {
    suppressExitZoom.current = true;
    window.setTimeout(() => {
      suppressExitZoom.current = false;
      if (mapRef.current) lastZoomRef.current = mapRef.current.getZoom();
    }, ms + 450);
  };

  /** Padding keeps fitted geography clear of the ladder and bottom chrome. */
  const FIT_PADDING = {
    paddingTopLeft: [36, 136] as [number, number],
    paddingBottomRight: [36, 92] as [number, number],
  };

  /**
   * Fly the MAP to a semantic geography: countries fit their real bounds,
   * continents their curated extent, regions/cities a point + scale. The
   * selection is context — after arrival the user is free.
   */
  const navigateGeo = (target: MapTarget) => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || exiting.current) return;
    beginJourney();
    // A semantic journey resets any point selection and owns the trail.
    selToken.current++;
    selAbort.current?.abort();
    selMarkerRef.current?.remove();
    selMarkerRef.current = null;
    selPointRef.current = null;
    setLocating(false);
    setTrail(trailForGeo(target.id));
    setTerritory(target.boundaryCountryId ?? null);
    const ms = reduced ? 150 : 1900;
    flightGuard(ms);
    if (target.bounds) {
      const b = L.latLngBounds(target.bounds);
      if (reduced) map.fitBounds(b, { ...FIT_PADDING, animate: false });
      else map.flyToBounds(b, { ...FIT_PADDING, duration: 1.9 });
    } else {
      const zoom = target.zoom ?? 9.5;
      if (reduced) map.setView([target.lat, target.lon], zoom, { animate: false });
      else map.flyTo([target.lat, target.lon], zoom, { duration: 1.9 });
    }
    setNavAnnounce(`Viewing ${target.name}.`);
    // Semantic arrivals stay quiet at country/continent scale; a city may
    // surface its curated destination context (honesty: curated only).
    if (target.kind === "city") {
      const curated = DESTINATIONS.find(
        (d) => d.name.toLowerCase() === target.name.toLowerCase(),
      );
      if (curated) scheduleArrival(() => destinationFromSearch(curated), ms);
    }
  };
  // Map markers are wired once at init — keep them on the latest closure.
  const navigateGeoRef = useRef(navigateGeo);
  useEffect(() => {
    navigateGeoRef.current = navigateGeo;
  });

  /* ---------- selection: MAP CLICK = "WHAT IS HERE?" ---------- */

  const clearSelMarker = () => {
    selMarkerRef.current?.remove();
    selMarkerRef.current = null;
    selPointRef.current = null;
  };

  const placeSelMarker = (lat: number, lon: number) => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    clearSelMarker();
    selPointRef.current = { lat, lon };
    selMarkerRef.current = L.marker([lat, lon], {
      icon: L.divIcon({
        className: "sb-lens",
        html: lensHtml(true),
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      }),
      interactive: false,
      zIndexOffset: 350,
    }).addTo(map);
  };

  /**
   * A click selects — it never repositions the map. The location resolves
   * locally at once (continent/country/known identity), the lens appears at
   * the point, and the trail enriches when the reverse lookup returns.
   * Latest selection always wins; stale lookups can never overwrite it.
   */
  const selectPoint = (lat: number, lon: number) => {
    const map = mapRef.current;
    if (!map || exiting.current) return;
    const token = ++selToken.current;
    selAbort.current?.abort();
    const ctl = new AbortController();
    selAbort.current = ctl;

    const local = resolveLocationLocal(lat, lon);
    arrivalToken.current++; // retire any pending arrival panel
    setTrail(trailFromResolved(local));
    if (local.office || local.knownPlace) {
      // Known SYSTEMBOOM identity — final immediately, never geocoded over.
      clearSelMarker();
      setLocating(false);
      presentDestination(destinationFromResolved(local));
      setSelAnnounce(announceResolved(local));
      return;
    }
    placeSelMarker(lat, lon);
    presentDestination(null);
    setLocating(true);
    resolveLocationOnline(local, ctl.signal).then((full) => {
      if (token !== selToken.current || !mapRef.current || exiting.current) return;
      setLocating(false);
      setTrail(trailFromResolved(full));
      presentDestination(destinationFromResolved(full));
      setSelAnnounce(announceResolved(full));
    });
  };
  const selectPointRef = useRef(selectPoint);
  useEffect(() => {
    selectPointRef.current = selectPoint;
  });

  /** Clear the active selection back to live view context. */
  const clearSelection = () => {
    selToken.current++;
    selAbort.current?.abort();
    clearSelMarker();
    setLocating(false);
    setTrail(null);
  };
  const panAway = () => {
    clearSelection();
    presentDestination(null);
  };
  const panAwayRef = useRef(panAway);
  useEffect(() => {
    panAwayRef.current = panAway;
  });

  // Dev/test hook: the current address trail state.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      (
        window as unknown as {
          __SB_TRAIL?: { entries: { name: string; level: string }[] | null; locating: boolean };
        }
      ).__SB_TRAIL = {
        entries: trail ? trail.map((e) => ({ name: e.name, level: e.level })) : null,
        locating,
      };
    }
  }, [trail, locating]);

  /* ---------- init / teardown ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!container.current || mapRef.current) return;

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "/leaflet/leaflet.css";
        document.head.appendChild(link);
      }

      const L = (await import("leaflet")).default;
      if (cancelled || !container.current) return;
      leafletRef.current = L;

      const map = L.map(container.current, {
        zoomControl: false,
        attributionControl: true,
        worldCopyJump: true,
        minZoom: 3,
        maxZoom: MAP_TILES.maxZoom,
        zoomSnap: 0.25,
      });
      mapRef.current = map;
      if (process.env.NODE_ENV !== "production") {
        (window as unknown as { __SB_MAP?: LeafletMap }).__SB_MAP = map;
      }
      map.attributionControl.setPrefix(false);

      L.tileLayer(MAP_TILES.url, {
        attribution: MAP_TILES.attribution,
        maxZoom: MAP_TILES.maxZoom,
      }).addTo(map);

      map.setView([initialView.lat, initialView.lon], ENTRY_ZOOM, { animate: false });

      /* SYSTEMBOOM place lenses */
      for (const place of PLACES) {
        const marker = L.marker([place.lat, place.lon], {
          icon: L.divIcon({
            className: "sb-lens",
            html: lensHtml(false),
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
          keyboard: true,
          title: `${place.name} — ${place.area}, ${place.city}`,
        }).addTo(map);
        marker.on("click", () => arriveAtMarker(() => destinationFromPlace(place), place.lat, place.lon));
        markersRef.current[place.id] = marker;
      }

      /* SYSTEMBOOM offices — the Cosmic Office Mast's surface counterparts */
      for (const office of SYSTEMBOOM_OFFICES) {
        const marker = L.marker([office.latitude, office.longitude], {
          icon: L.divIcon({
            className: "sb-origin",
            html: officeMastHtml(false),
            iconSize: [52, 72],
            // The contact point at the mast base marks the coordinate.
            iconAnchor: [26, 65],
          }),
          keyboard: true,
          title: office.name,
          zIndexOffset: 400,
        }).addTo(map);
        marker.on("click", () =>
          arriveAtMarker(() => destinationFromOffice(office), office.latitude, office.longitude),
        );
        officeMarkersRef.current[office.id] = marker;
        // City-precision offices get a soft approximate-area lens instead of
        // pretending the mast base is an exact building.
        if (office.precision === "city") {
          L.circle([office.latitude, office.longitude], {
            radius: 2400,
            color: "rgba(255,190,120,0.55)",
            weight: 1.2,
            dashArray: "3 7",
            fillColor: "#f05a3c",
            fillOpacity: 0.05,
            className: "sb-origin-area",
            interactive: false,
          }).addTo(map);
        }
      }

      /* SYSTEMBOOM in-map geographic targets — countries stay clickable
         names at continent scales, cities at country scales. */
      for (const g of GLOBE_GEO_LABELS) {
        if (g.kind !== "country" && g.kind !== "city") continue;
        const band = g.kind === "country" ? COUNTRY_TARGET_BAND : CITY_TARGET_BAND;
        const marker = L.marker([g.lat, g.lon], {
          icon: L.divIcon({
            className: "sb-geo-target",
            html: geoTargetHtml(g.name, g.kind),
            iconSize: [150, 24],
            iconAnchor: [75, 12],
          }),
          keyboard: true,
          title: `View ${g.name}`,
          // The NAME is the navigation affordance — it must win the tap
          // even where an office mast crowds it at continent scale.
          zIndexOffset: 500,
        });
        marker.on("click", () => {
          const mt = geoMapTarget(g.id);
          if (mt) navigateGeoRef.current(mt);
        });
        geoTargetsRef.current.push({ marker, band, onMap: false });
      }
      const updateGeoTargets = () => {
        const z = map.getZoom();
        for (const t of geoTargetsRef.current) {
          const show = z >= t.band[0] && z < t.band[1];
          if (show && !t.onMap) {
            t.marker.addTo(map);
            t.onMap = true;
          } else if (!show && t.onMap) {
            t.marker.remove();
            t.onMap = false;
          }
        }
      };
      map.on("zoomend", updateGeoTargets);

      const updateContext = () => {
        const c = map.getCenter();
        const alt = pseudoAltitude(
          map.getZoom(),
          c.lat,
          container.current?.clientHeight ?? 800,
        );
        const ctx = resolveContext(c.lat, c.lng, alt);
        setCrumbs(ctx.crumbs);
        setAltitude(alt);
      };
      map.on("moveend zoomend", updateContext);

      /* GEOGRAPHIC ADDRESS TRAIL — a map click asks "what is here?".
         Selection, never repositioning. */
      map.on("click", (e) => {
        if (exiting.current || suppressExitZoom.current) return;
        selectPointRef.current(e.latlng.lat, e.latlng.lng);
      });

      // Panning far from the selected point retires the leaf quietly and
      // the ladder returns to broader live map context.
      map.on("moveend", () => {
        const sel = selPointRef.current;
        if (!sel || suppressExitZoom.current || exiting.current) return;
        if (!map.getBounds().pad(0.35).contains([sel.lat, sel.lon])) {
          panAwayRef.current();
        }
      });

      // ZOOMING OUT past country scale hands control back to the 3D Earth —
      // only on an actual outward gesture, never on a semantic fit that lands
      // at a wide continent scale.
      map.on("zoomend", () => {
        const z = map.getZoom();
        const prev = lastZoomRef.current;
        lastZoomRef.current = z;
        if (suppressExitZoom.current || exiting.current) return;
        if (z <= EXIT_ZOOM && z < prev) requestReturnRef.current();
      });

      updateContext();
      updateGeoTargets();
      setReady(true);

      // Continue the apparent descent as the atmosphere clears.
      // Office journeys keep descending to the office and select it —
      // the same signal that led the flight becomes the map marker.
      // Every arrival produces destination context; arbitrary surface
      // arrivals stay honest (coordinates + supported classification only).
      setTimeout(() => {
        suppressExitZoom.current = false;
        lastZoomRef.current = map.getZoom();
        if (cancelled || !mapRef.current) return;
        const office = SYSTEMBOOM_OFFICES.find((o) => o.id === initialOfficeId);
        const geoTarget = initialView.geoId ? geoMapTarget(initialView.geoId) : null;
        if (office) {
          if (reduced) {
            map.setView([office.latitude, office.longitude], 15, { animate: false });
          } else {
            map.flyTo([office.latitude, office.longitude], 15, { duration: 3 });
          }
          // The office journey's trail — owner-supplied identity as the leaf.
          setTrail(trailFromResolved(resolveLocationLocal(office.latitude, office.longitude)));
          selPointRef.current = { lat: office.latitude, lon: office.longitude };
          scheduleArrival(() => destinationFromOffice(office), reduced ? 100 : 3000);
        } else if (geoTarget) {
          // A clicked geographic NAME arrives at the REAL geography: country
          // bounds fitted, continent extent framed, city at city scale. No
          // destination card for country/continent — the map itself is the
          // answer; the user is free from here.
          navigateGeoRef.current(geoTarget);
        } else {
          if (!reduced) {
            map.flyTo(
              [initialView.lat, initialView.lon],
              initialView.zoom ?? ENTRY_ZOOM + 1.5,
              { duration: 2.2 },
            );
          } else if (initialView.zoom) {
            map.setView([initialView.lat, initialView.lon], initialView.zoom, {
              animate: false,
            });
          }
          scheduleArrival(
            () =>
              destinationFromSurface(
                initialView.lat,
                initialView.lon,
                resolveContext(initialView.lat, initialView.lon, 120_000).crumbs,
              ),
            reduced ? 150 : 2300,
          );
        }
      }, reduced ? 200 : 750);
    })();

    return () => {
      cancelled = true;
      selAbort.current?.abort();
      selMarkerRef.current = null;
      markersRef.current = {};
      officeMarkersRef.current = {};
      geoTargetsRef.current = [];
      territoryRef.current = null;
      territoryIdRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- marker activation: short settle, then context ---------- */
  const arriveAtMarker = (build: () => DestinationContext, lat: number, lon: number) => {
    const map = mapRef.current;
    if (!map) return;
    beginJourney();
    // Known markers share the same location identity as clicks: the trail
    // resolves from the same local model (office/place snap included).
    selToken.current++;
    selAbort.current?.abort();
    clearSelMarker();
    setLocating(false);
    setTrail(trailFromResolved(resolveLocationLocal(lat, lon)));
    selPointRef.current = { lat, lon };
    if (reduced) {
      map.setView([lat, lon], Math.max(map.getZoom(), 16.5), { animate: false });
      scheduleArrival(build, 80);
      return;
    }
    map.flyTo([lat, lon], Math.max(map.getZoom(), 16.5), { duration: 1.1 });
    scheduleArrival(build, 1100);
  };

  /* ---------- staged cinematic flight (search journeys) ---------- */
  const flyTo = (dest: Destination) => {
    const map = mapRef.current;
    if (!map) return;
    setSearchOpen(false);
    // The old destination retires while the flight is underway.
    beginJourney();
    // Search shares the click path's location identity (canonical trail).
    selToken.current++;
    selAbort.current?.abort();
    clearSelMarker();
    setLocating(false);
    const searchTrail = trailFromResolved(resolveLocationLocal(dest.lat, dest.lon));
    if (searchTrail[searchTrail.length - 1]?.name !== dest.name) {
      // Curated destinations are known identities — the leaf is honest.
      searchTrail.push({ name: dest.name, level: "place", lat: dest.lat, lon: dest.lon });
    }
    setTrail(searchTrail);
    selPointRef.current = { lat: dest.lat, lon: dest.lon };

    // Leaflet's flyTo already arcs: zooms out, crosses, descends.
    const target = destZoom(dest);
    if (reduced) {
      map.setView([dest.lat, dest.lon], target, { animate: false });
      scheduleArrival(() => destinationFromSearch(dest), 100);
      return;
    }
    const from = map.getCenter();
    const degrees = Math.hypot(from.lat - dest.lat, from.lng - dest.lon);
    const duration = Math.min(4, Math.max(1.6, degrees / 35 + 1.2));
    map.flyTo([dest.lat, dest.lon], target, { duration });
    scheduleArrival(() => destinationFromSearch(dest), duration * 1000);
  };

  /* ---------- SEMANTIC ZOOM LADDER: breadcrumbs are navigation ---------- */

  /**
   * Navigate an ancestor of the ACTIVE ADDRESS TRAIL. The trail truncates to
   * that rung (leaf marker retires), the map moves to that level's scale —
   * countries fit their real bounds — and EARTH alone exits to the 3D globe.
   */
  const navigateTrail = (name: string): boolean => {
    const t = trailRef.current;
    const map = mapRef.current;
    if (!t || !map) return false;
    const idx = t.findIndex((e) => e.name === name);
    if (idx < 0) return false;
    const entry = t[idx];
    if (entry.level === "earth") {
      if (!onNavigateOut) return true;
      exiting.current = true;
      onNavigateOut({
        kind: "earth",
        name: "Earth",
        from: {
          lat: map.getCenter().lat,
          lon: map.getCenter().lng,
          zoom: map.getZoom(),
        },
      });
      return true;
    }
    selToken.current++;
    selAbort.current?.abort();
    clearSelMarker();
    setLocating(false);
    setTrail(t.slice(0, idx + 1));
    if ((entry.level === "country" || entry.level === "continent") && entry.geoId) {
      const mt = geoMapTarget(entry.geoId);
      if (mt) {
        navigateGeo(mt);
        return true;
      }
    }
    beginJourney();
    const zoom = TRAIL_LEVEL_ZOOM[entry.level];
    flightGuard(reduced ? 150 : 1700);
    if (reduced) map.setView([entry.lat, entry.lon], zoom, { animate: false });
    else map.flyTo([entry.lat, entry.lon], zoom, { duration: 1.7 });
    setNavAnnounce(`Viewing ${entry.name}.`);
    return true;
  };

  const navigateCrumb = (name: string, isActive: boolean) => {
    const map = mapRef.current;
    if (!map || exiting.current) return;
    if (isActive) return; // already here — no restart, subtle acknowledgement only
    setCrumbsExpanded(false);
    // An active address trail owns the ladder.
    if (navigateTrail(name)) return;
    const target = crumbTarget(name);
    if (!target) return;
    // ONLY the EARTH crumb exits through the atmosphere back to 3D — the
    // globe returns already facing this map view, never a random hemisphere.
    if (target.tier === "earth") {
      if (!onNavigateOut) return;
      exiting.current = true;
      onNavigateOut({
        kind: "earth",
        name: target.name,
        from: {
          lat: map.getCenter().lat,
          lon: map.getCenter().lng,
          zoom: map.getZoom(),
        },
      });
      return;
    }
    // Every other crumb navigates WITHIN the map — countries fit their real
    // bounds, continents their extent, regions/cities zoom to scale.
    if (target.tier === "continent" || target.tier === "country") {
      const g = geoByName(target.name);
      const mt = g ? geoMapTarget(g.id) : null;
      if (mt) {
        navigateGeo(mt);
        return;
      }
    }
    beginJourney();
    const zoom =
      target.tier === "continent"
        ? 4.25
        : target.tier === "country"
          ? 6.8
          : target.tier === "region"
            ? 9.5
            : target.tier === "city"
              ? 12
              : 14.5;
    flightGuard(reduced ? 150 : 1700);
    if (reduced) {
      map.setView([target.lat, target.lon], zoom, { animate: false });
    } else {
      map.flyTo([target.lat, target.lon], zoom, { duration: 1.7 });
    }
    setNavAnnounce(`Viewing ${target.name}.`);
  };

  /**
   * The ladder shows the ACTIVE ADDRESS TRAIL when a selection exists,
   * otherwise the live view context. Mobile compression: EARTH / … /
   * parent / current — EARTH always stays one tap away; "…" reveals the
   * hidden ancestors. Desktop shows all.
   */
  const ladder = trail ? trail.map((e) => e.name) : crumbs;
  const compress = ladder.length > 4 && !crumbsExpanded;
  const crumbRows = ladder.map((name, i) => ({
    name,
    isActive: i === ladder.length - 1 && !locating,
    hideOnMobile: compress && i > 0 && i < ladder.length - 2,
    ellipsisAfter: compress && i === 0,
  }));

  /* ---------- return to the 3D Earth ---------- */
  const requestReturn = () => {
    if (exiting.current) return;
    exiting.current = true;
    onExited();
  };
  const requestReturnRef = useRef(requestReturn);
  useEffect(() => {
    requestReturnRef.current = requestReturn;
  });

  /* ---------- keyboard: Escape walks the address trail back out ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      if (searchOpen) setSearchOpen(false);
      else if (destination) presentDestination(null);
      else {
        // Semantic back: one rung up the active trail; EARTH exits to 3D.
        const t = trailRef.current;
        if (t && t.length >= 2) navigateTrail(t[t.length - 2].name);
        else requestReturnRef.current();
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchOpen, destination]);

  const zoom = (dir: 1 | -1) => {
    const map = mapRef.current;
    if (!map) return;
    if (dir > 0) map.zoomIn(1);
    else map.zoomOut(1);
  };

  const results = DESTINATIONS.filter(
    (d) =>
      !query.trim() ||
      d.name.toLowerCase().includes(query.trim().toLowerCase()) ||
      d.detail.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div
      className={`fixed inset-0 z-10 transition-opacity duration-700 ${
        visible && ready ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!visible}
    >
      {/* Geographic surface — the content. Dark theme gets a tasteful
          inversion treatment; OSM data and attribution are unchanged. */}
      <div
        ref={container}
        // isolate: Leaflet's internal panes (z-index 400+) must never paint
        // above SYSTEMBOOM chrome — in light theme there is no invert filter
        // to contain them, so force a stacking context explicitly.
        className="absolute inset-0 isolate"
        style={
          theme === "dark"
            ? {
                filter: "invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.92)",
                background: "#0a0d14",
              }
            : { background: "#dbe6f0" }
        }
      />
      {/* Un-invert attribution and SYSTEMBOOM markers so brand colors stay true in dark mode.
          The territory boundary and geo targets are CONTENT — they invert with
          the tiles so their ink always contrasts the imagery beneath. */}
      {theme === "dark" && (
        <style>{`.leaflet-control-attribution{filter:invert(1) hue-rotate(180deg);}
.sb-origin,.sb-lens,.sb-origin-area{filter:invert(1) hue-rotate(180deg);}`}</style>
      )}
      <style>{`.sb-geo-target{background:none;border:none;cursor:pointer;}
.sb-geo-target-label{transition:transform .25s ease;}
.sb-geo-target:hover .sb-geo-target-label,.sb-geo-target:focus-visible .sb-geo-target-label{transform:scale(1.07);}
.sb-geo-target:focus-visible{outline:2px solid #8fc2ff;outline-offset:2px;border-radius:8px;}`}</style>

      {/* Back + search cluster */}
      <div className="fixed top-[4.4rem] left-3 z-30 flex gap-2 sm:left-6">
        <button onClick={requestReturn} className={`${CHIP_BASE} ${mapChip} max-sm:!px-3`}>
          <ArrowLeft size={15} /> <span className="hidden sm:inline">Space</span>
        </button>
        <button
          onClick={() => {
            setSearchOpen((v) => !v);
            setQuery("");
          }}
          aria-expanded={searchOpen}
          aria-label="Search Earth"
          className={`${CHIP_BASE} ${mapChip} max-sm:!px-3`}
        >
          <Search size={15} /> <span className="hidden sm:inline">Search Earth</span>
        </button>
      </div>

      {/* Semantic zoom ladder — location, navigation and scale in one */}
      <div className="fixed inset-x-0 top-[7.6rem] z-20 flex flex-col items-center gap-1 px-4 sm:top-[4.6rem] sm:px-44">
        <nav
          aria-label="Geographic scale ladder"
          className="pointer-events-auto flex max-w-full items-center gap-1 overflow-hidden rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium tracking-wide text-white/85 backdrop-blur-sm"
        >
          {crumbRows.map((row, i) => (
            <span
              key={`${row.name}-${i}`}
              className={`flex items-center gap-1 whitespace-nowrap ${row.hideOnMobile ? "max-sm:hidden" : ""}`}
            >
              {i > 0 && (
                <span aria-hidden className={`text-white/35 ${row.hideOnMobile ? "" : compress && i === crumbs.length - 2 ? "max-sm:hidden" : ""}`}>
                  /
                </span>
              )}
              {row.isActive ? (
                <span aria-current="location" className="px-1 py-1.5 text-white">
                  {row.name.toUpperCase()}
                </span>
              ) : (
                <button
                  onClick={() => navigateCrumb(row.name, false)}
                  aria-label={`View ${row.name}`}
                  className="sb-transition rounded-full px-1 py-1.5 text-white/60 hover:scale-[1.04] hover:text-white focus-visible:outline-[#8fc2ff]"
                >
                  {row.name.toUpperCase()}
                </button>
              )}
              {row.ellipsisAfter && (
                <span className="flex items-center gap-1 sm:hidden">
                  <span aria-hidden className="text-white/35">/</span>
                  <button
                    onClick={() => setCrumbsExpanded(true)}
                    aria-label="Show all geographic levels"
                    className="rounded-full px-1.5 py-1.5 text-white/60 hover:text-white focus-visible:outline-[#8fc2ff]"
                  >
                    …
                  </button>
                </span>
              )}
            </span>
          ))}
          {locating && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              <span aria-hidden className="text-white/35">/</span>
              <span className="animate-pulse px-1 text-[11px] italic text-white/50">
                locating…
              </span>
            </span>
          )}
          <span className="ml-1 border-l border-white/20 pl-2 text-[11px] text-white/50">
            {formatAltitude(altitude)}
          </span>
        </nav>
      </div>

      {/* Zoom controls */}
      <div className="fixed top-1/2 right-3 z-20 flex -translate-y-1/2 flex-col gap-2 sm:right-5">
        <button aria-label="Zoom in" onClick={() => zoom(1)} className={`${CHIP_BASE} ${mapChip} h-11 w-11 !px-0`}>
          <Plus size={16} />
        </button>
        <button aria-label="Zoom out" onClick={() => zoom(-1)} className={`${CHIP_BASE} ${mapChip} h-11 w-11 !px-0`}>
          <Minus size={16} />
        </button>
      </div>

      {/* Search panel — curated prototype destinations */}
      {searchOpen && (
        <div
          role="dialog"
          aria-label="Search Earth"
          className={`fixed top-32 left-1/2 z-30 w-[min(92vw,380px)] -translate-x-1/2 rounded-2xl border p-3 backdrop-blur-xl ${panel}`}
        >
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2.5">
            <Search size={15} className="shrink-0 opacity-60" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Where on Earth?"
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/40"
            />
          </div>
          <ul className="mt-2 flex max-h-72 flex-col overflow-y-auto" role="listbox">
            {results.map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => flyTo(d)}
                  className="flex w-full items-baseline justify-between gap-3 rounded-xl px-4 py-2.5 text-left text-sm hover:bg-white/10 focus-visible:outline-[#8fc2ff]"
                >
                  {d.name}
                  <span className="text-xs opacity-50">{d.detail}</span>
                </button>
              </li>
            ))}
            {results.length === 0 && (
              <li className="px-4 py-3 text-sm opacity-60">
                Nothing in the prototype index — full place search arrives with
                the Google provider.
              </li>
            )}
          </ul>
          <p className="px-4 pt-1 pb-2 text-[11px] opacity-45">
            Curated prototype destinations — not a full geocoder.
          </p>
        </div>
      )}

      {/* Destination intelligence — arrival creates context */}
      <DestinationPanel
        destination={destination}
        onClose={() => presentDestination(null)}
        desktopOffsetClass="sm:bottom-10"
      />
      {/* The mobile sheet must never bury OSM attribution — lift it above. */}
      {destination && (
        <style>{`@media (max-width: 639px){.leaflet-bottom.leaflet-right{bottom:12.5rem;}}`}</style>
      )}

      {/* Screen-reader location context */}
      <p aria-live="polite" className="sr-only">
        {crumbs.join(", ")} — view height {formatAltitude(altitude)}
      </p>
      <p aria-live="polite" className="sr-only">
        {navAnnounce}
      </p>
      {/* One announcement per explicit location selection — never per pan */}
      <p aria-live="polite" className="sr-only">
        {selAnnounce}
      </p>
    </div>
  );
}

function destZoom(dest: Destination): number {
  // Map curated arrival altitudes onto Leaflet zooms.
  if (dest.altitude <= 2_000) return 17;
  if (dest.altitude <= 40_000) return 12.5;
  return 11;
}
