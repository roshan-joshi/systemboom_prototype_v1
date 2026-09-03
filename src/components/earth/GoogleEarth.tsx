"use client";

/**
 * SYSTEMBOOM EARTH — Google Maps 3D (Map3DElement).
 *
 * Final prototype Earth architecture: the R3F Cosmos hands the viewport to
 * Google's photorealistic 3D Earth through an atmospheric cross-fade, and
 * the same gesture keeps working — orbit-scale globe → continent → country
 * → city → street → place. Places API (New) powers real search; a curated
 * list gives instant flights without API calls.
 *
 * API key: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY only — never hardcoded. Without
 * it this component renders a clear configuration state (no silent
 * fallback). Google attribution is native to Map3DElement and never
 * obscured. 3D building coverage varies by region; Google degrades to
 * satellite/terrain automatically and we never claim otherwise.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { CHIP_BASE, useChrome } from "@/components/cosmos/overlays";
import { DESTINATIONS, type Destination } from "@/lib/earth/geo-data";
import { SYSTEMBOOM_OFFICES } from "@/lib/systemboom-origin";
import { crumbTarget, formatAltitude, resolveContext } from "@/lib/earth/breadcrumb";
import { googleMapsKey, loadGoogleMaps } from "@/lib/earth/google-loader";
import {
  destinationFromGooglePlace,
  destinationFromOffice,
  destinationFromSearch,
  destinationFromSurface,
  type DestinationContext,
} from "@/lib/earth/destination";
import { DestinationPanel } from "./DestinationPanel";

/** Camera range (m) at handoff — matches the R3F Earth's apparent size. */
const START_RANGE = 9_000_000;
/** Range the entry descent settles at, continuing the approach. */
const DESCENT_RANGE = 5_200_000;
/** Zooming out beyond this range hands control back to the Cosmos. */
const RETURN_RANGE = 13_500_000;

type Status = "boot" | "ready" | "no-key" | "error";

interface SearchResult {
  id: string;
  name: string;
  detail: string;
  lat: number;
  lng: number;
}

/** Approximate Leaflet-zoom ↔ Map3D-range conversions (900px viewport basis). */
const zoomToRange = (zoom: number, lat: number) =>
  (156543 * Math.cos((lat * Math.PI) / 180) * 900) / 2 ** zoom;
const rangeToZoom = (range: number, lat: number) =>
  Math.max(
    3,
    Math.round(
      Math.log2((156543 * Math.cos((lat * Math.PI) / 180) * 900) / Math.max(range, 100)),
    ),
  );

export function GoogleEarth({
  visible,
  initialView,
  initialOfficeId,
  reduced,
  onExited,
  onFailed,
  onNavigateOut,
}: {
  visible: boolean;
  /** Coordinates handed over from the R3F approach raycast (optional zoom). */
  initialView: { lat: number; lon: number; zoom?: number };
  /** Continue the journey to this SYSTEMBOOM office and select it. */
  initialOfficeId?: string | null;
  reduced: boolean;
  /** Called when the surface releases control back to the R3F Earth. */
  onExited: () => void;
  /** Missing key / load failure — the provider switch falls back gracefully. */
  onFailed: () => void;
  /** Semantic ladder: a breadcrumb navigated outward past map scales. */
  onNavigateOut?: (target: {
    kind: "earth" | "continent" | "country";
    name: string;
    lat?: number;
    lon?: number;
    from: { lat: number; lon: number; zoom: number };
  }) => void;
}) {
  const { chip, panel } = useChrome();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const mapsLibs = useRef<{ maps3d: any; places: any } | null>(null);
  const markerRef = useRef<any>(null);
  const exiting = useRef(false);
  const suppressReturn = useRef(true);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<Status>("boot");
  const [crumbs, setCrumbs] = useState<string[]>(["Earth"]);
  const [altitude, setAltitude] = useState(START_RANGE);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [destination, setDestination] = useState<DestinationContext | null>(null);
  /** Journeys invalidate any pending arrival — no stale panels mid-flight. */
  const arrivalToken = useRef(0);

  /** Camera settles → brief pause → the destination panel rises. */
  const scheduleArrival = (ctx: DestinationContext, afterMs: number) => {
    const token = ++arrivalToken.current;
    setDestination(null);
    setTimeout(() => {
      if (token !== arrivalToken.current || !mapRef.current || exiting.current) return;
      setDestination(ctx);
    }, afterMs + 220);
  };

  /* ---------- init / teardown ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!container.current || mapRef.current) return;
      if (!googleMapsKey()) {
        onFailed();
        return;
      }
      try {
        const maps = await loadGoogleMaps();
        const [maps3d, places] = await Promise.all([
          maps.importLibrary("maps3d"),
          maps.importLibrary("places"),
        ]);
        if (cancelled || !container.current) return;
        mapsLibs.current = { maps3d, places };

        const { Map3DElement, MapMode } = maps3d;
        const map = new Map3DElement({
          center: { lat: initialView.lat, lng: initialView.lon, altitude: 0 },
          range: START_RANGE,
          tilt: 0,
          heading: 0,
          mode: MapMode.HYBRID,
        });
        map.style.width = "100%";
        map.style.height = "100%";
        container.current.appendChild(map);
        mapRef.current = map;
        if (process.env.NODE_ENV !== "production") {
          (window as any).__SB_MAP3D = map;
        }

        // SYSTEMBOOM offices — the Cosmic Beacon's surface counterparts.
        try {
          const { Marker3DElement } = maps3d;
          if (Marker3DElement) {
            for (const office of SYSTEMBOOM_OFFICES) {
              const marker = new Marker3DElement({
                position: {
                  lat: office.latitude,
                  lng: office.longitude,
                  altitude: 20,
                },
                label: office.name,
              });
              map.appendChild(marker);
            }
          }
        } catch {
          /* decorative */
        }

        // Camera context: poll (version-tolerant) → breadcrumb + return watch.
        pollTimer.current = setInterval(() => {
          const m = mapRef.current;
          if (!m) return;
          const center = m.center;
          const range: number = m.range ?? START_RANGE;
          if (center) {
            const ctx = resolveContext(center.lat, center.lng, range);
            setCrumbs(ctx.crumbs);
            setAltitude(range);
          }
          if (!suppressReturn.current && !exiting.current && range >= RETURN_RANGE) {
            requestReturnRef.current();
          }
        }, 450);

        setStatus("ready");

        // Continue the apparent descent as the atmosphere clears.
        // Office journeys keep descending to the office and select it.
        setTimeout(() => {
          suppressReturn.current = false;
          const m = mapRef.current;
          if (!m) return;
          const office = SYSTEMBOOM_OFFICES.find((o) => o.id === initialOfficeId);
          if (office) {
            const endCamera = {
              center: { lat: office.latitude, lng: office.longitude, altitude: 0 },
              range: 1_800,
              tilt: 55,
              heading: 0,
            };
            if (reduced || !m.flyCameraTo) {
              m.center = endCamera.center;
              m.range = endCamera.range;
              m.tilt = endCamera.tilt;
              scheduleArrival(destinationFromOffice(office), 150);
            } else {
              m.flyCameraTo({ endCamera, durationMillis: 4200 });
              scheduleArrival(destinationFromOffice(office), 4200);
            }
            placeMarker(office.latitude, office.longitude, true);
          } else {
            const settleRange = initialView.zoom
              ? Math.max(1_400, zoomToRange(initialView.zoom, initialView.lat))
              : DESCENT_RANGE;
            if (!reduced && m.flyCameraTo) {
              m.flyCameraTo({
                endCamera: {
                  center: { lat: initialView.lat, lng: initialView.lon, altitude: 0 },
                  range: settleRange,
                  tilt: 0,
                  heading: 0,
                },
                durationMillis: 2400,
              });
            } else if (initialView.zoom) {
              m.range = settleRange;
            }
            // Arbitrary surface arrival — coordinates + supported context only.
            scheduleArrival(
              destinationFromSurface(
                initialView.lat,
                initialView.lon,
                resolveContext(initialView.lat, initialView.lon, 120_000).crumbs,
              ),
              reduced ? 200 : 2500,
            );
          }
        }, reduced ? 200 : 800);
      } catch {
        if (!cancelled) onFailed();
      }
    })();

    return () => {
      cancelled = true;
      if (pollTimer.current) clearInterval(pollTimer.current);
      try {
        mapRef.current?.stopCameraAnimation?.();
        mapRef.current?.remove();
      } catch {
        /* element already detached */
      }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- flights ---------- */
  const flyTo = (
    lat: number,
    lng: number,
    range: number,
    tilt: number,
    ctx: DestinationContext | null,
  ) => {
    const map = mapRef.current;
    setSearchOpen(false);
    setResults(null);
    // The old destination retires while the flight is underway.
    arrivalToken.current++;
    setDestination(null);
    if (!map) return;
    placeMarker(lat, lng, range < 50_000);
    map.stopCameraAnimation?.();
    const endCamera = {
      center: { lat, lng, altitude: 0 },
      range,
      tilt,
      heading: 0,
    };
    if (reduced || !map.flyCameraTo) {
      map.center = endCamera.center;
      map.range = range;
      map.tilt = tilt;
      if (ctx) scheduleArrival(ctx, 150);
      return;
    }
    const from = map.center ?? { lat: 0, lng: 0 };
    const degrees = Math.hypot(from.lat - lat, from.lng - lng);
    const durationMillis = Math.min(6500, Math.max(1800, degrees * 90 + 1500));
    map.flyCameraTo({ endCamera, durationMillis });
    if (ctx) scheduleArrival(ctx, durationMillis);
  };

  const placeMarker = async (lat: number, lng: number, show: boolean) => {
    const libs = mapsLibs.current;
    const map = mapRef.current;
    if (!libs || !map) return;
    try {
      markerRef.current?.remove();
      markerRef.current = null;
      if (!show) return;
      const { Marker3DElement } = libs.maps3d;
      if (!Marker3DElement) return;
      const marker = new Marker3DElement({
        position: { lat, lng, altitude: 12 },
      });
      map.appendChild(marker);
      markerRef.current = marker;
    } catch {
      /* markers are decorative — never block the flight */
    }
  };

  const flyToDestination = (d: Destination) => {
    const range = Math.max(d.altitude, 1_400);
    const tilt = Math.min(Math.max(90 + d.pitch, 0), 62);
    flyTo(
      d.lat,
      d.lon,
      range,
      range < 50_000 ? Math.max(tilt, 45) : tilt,
      destinationFromSearch(d),
    );
  };

  /* ---------- SEMANTIC ZOOM LADDER: breadcrumbs are navigation ---------- */
  const [crumbsExpanded, setCrumbsExpanded] = useState(false);

  const navigateCrumb = (name: string, isActive: boolean) => {
    const m = mapRef.current;
    if (!m || exiting.current || isActive) return;
    setCrumbsExpanded(false);
    const center = m.center ?? { lat: 0, lng: 0 };
    const from = {
      lat: center.lat,
      lon: center.lng,
      zoom: rangeToZoom(m.range ?? DESCENT_RANGE, center.lat),
    };
    const target = crumbTarget(name);
    if (!target) return;
    if (target.tier === "earth" || target.tier === "continent" || target.tier === "country") {
      if (!onNavigateOut) return;
      exiting.current = true;
      m.stopCameraAnimation?.();
      onNavigateOut({
        kind: target.tier,
        name: target.name,
        lat: target.lat,
        lon: target.lon,
        from,
      });
      return;
    }
    const range = target.tier === "region" ? 300_000 : target.tier === "city" ? 30_000 : 4_000;
    flyTo(target.lat, target.lon, range, target.tier === "district" ? 45 : 0, null);
  };

  const compress = crumbs.length > 4 && !crumbsExpanded;
  const crumbRows = crumbs.map((name, i) => ({
    name,
    isActive: i === crumbs.length - 1,
    hideOnMobile: compress && i > 0 && i < crumbs.length - 2,
    ellipsisAfter: compress && i === 0,
  }));

  /* ---------- Places API (New) search ---------- */
  const runSearch = async () => {
    const libs = mapsLibs.current;
    const text = query.trim();
    if (!libs || !text) return;
    setSearching(true);
    setResults(null);
    try {
      const { Place } = libs.places;
      const { places } = await Place.searchByText({
        textQuery: text,
        fields: ["location", "displayName", "formattedAddress"],
        maxResultCount: 6,
      });
      setResults(
        (places ?? []).map((p: any, i: number) => ({
          id: p.id ?? String(i),
          name: p.displayName ?? text,
          detail: p.formattedAddress ?? "",
          lat: p.location?.lat() ?? 0,
          lng: p.location?.lng() ?? 0,
        })),
      );
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  /* ---------- return to the Cosmos ---------- */
  const requestReturn = () => {
    if (exiting.current) return;
    exiting.current = true;
    mapRef.current?.stopCameraAnimation?.();
    onExited();
  };
  const requestReturnRef = useRef(requestReturn);
  useEffect(() => {
    requestReturnRef.current = requestReturn;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      if (searchOpen) setSearchOpen(false);
      else if (destination) setDestination(null);
      else requestReturnRef.current();
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });

  }, [searchOpen, destination]);

  const curated = DESTINATIONS.filter(
    (d) =>
      !query.trim() ||
      d.name.toLowerCase().includes(query.trim().toLowerCase()) ||
      d.detail.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const showConfigState = status === "no-key" || status === "error";

  return (
    <div
      className={`fixed inset-0 z-10 bg-[#04070e] transition-opacity duration-700 ${
        visible && status !== "boot" ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!visible}
    >
      {/* Google 3D Earth — the content. Attribution renders natively and stays. */}
      <div ref={container} className="absolute inset-0 isolate" />

      {/* Top scrim keeps floating chips readable without touching attribution */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/45 to-transparent"
      />

      {showConfigState && (
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className={`w-[min(94vw,430px)] rounded-3xl border p-7 backdrop-blur-xl ${panel}`}>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase opacity-60">
              Earth Explorer
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Google Maps configuration required
            </h2>
            <p className="mt-3 text-sm leading-relaxed opacity-85">
              {status === "no-key"
                ? "The 3D Earth runs on Google Maps Platform. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local and restart the dev server."
                : "Google Maps failed to load — check the API key, enabled APIs, and network, then reload."}
            </p>
            <ul className="mt-3 list-disc pl-5 text-xs leading-relaxed opacity-60">
              <li>Enable: Maps JavaScript API</li>
              <li>Enable: Places API (New)</li>
            </ul>
            <p className="mt-3 text-xs opacity-50">
              The Cosmos remains fully explorable without it.
            </p>
            <button onClick={requestReturn} className={`${CHIP_BASE} ${chip} mt-5 w-full`}>
              <ArrowLeft size={15} /> Back to Space
            </button>
          </div>
        </div>
      )}

      {!showConfigState && (
        <>
          {/* Back + search cluster */}
          <div className="fixed top-[4.4rem] left-3 z-30 flex gap-2 sm:left-6">
            <button onClick={requestReturn} className={`${CHIP_BASE} ${chip} max-sm:!px-3`}>
              <ArrowLeft size={15} /> <span className="hidden sm:inline">Space</span>
            </button>
            <button
              onClick={() => {
                setSearchOpen((v) => !v);
                setQuery("");
                setResults(null);
              }}
              aria-expanded={searchOpen}
              aria-label="Search Earth"
              className={`${CHIP_BASE} ${chip} max-sm:!px-3`}
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
                    <span
                      aria-hidden
                      className={`text-white/35 ${!row.hideOnMobile && compress && i === crumbs.length - 2 ? "max-sm:hidden" : ""}`}
                    >
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
              <span className="ml-1 border-l border-white/20 pl-2 text-[11px] text-white/50">
                {formatAltitude(altitude)}
              </span>
            </nav>
          </div>

          {/* Search panel — Places API (New) + curated instant flights */}
          {searchOpen && (
            <div
              role="dialog"
              aria-label="Search Earth"
              className={`fixed top-32 left-1/2 z-30 w-[min(92vw,400px)] -translate-x-1/2 rounded-2xl border p-3 backdrop-blur-xl ${panel}`}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runSearch();
                }}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2.5"
              >
                <Search size={15} className="shrink-0 opacity-60" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setResults(null);
                  }}
                  placeholder="Search anywhere on Earth…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-white/40"
                />
                {searching && <Loader2 size={15} className="animate-spin opacity-60" />}
              </form>

              <ul className="mt-2 flex max-h-72 flex-col overflow-y-auto" role="listbox">
                {results?.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() =>
                        flyTo(r.lat, r.lng, 1_600, 55, destinationFromGooglePlace(r))
                      }
                      className="flex w-full flex-col rounded-xl px-4 py-2.5 text-left text-sm hover:bg-white/10 focus-visible:outline-[#8fc2ff]"
                    >
                      {r.name}
                      <span className="text-xs opacity-50">{r.detail}</span>
                    </button>
                  </li>
                ))}
                {results && results.length === 0 && !searching && (
                  <li className="px-4 py-3 text-sm opacity-60">No places found.</li>
                )}
                {!results &&
                  curated.map((d) => (
                    <li key={d.id}>
                      <button
                        onClick={() => flyToDestination(d)}
                        className="flex w-full items-baseline justify-between gap-3 rounded-xl px-4 py-2.5 text-left text-sm hover:bg-white/10 focus-visible:outline-[#8fc2ff]"
                      >
                        {d.name}
                        <span className="text-xs opacity-50">{d.detail}</span>
                      </button>
                    </li>
                  ))}
              </ul>
              <p className="px-4 pt-1 pb-2 text-[11px] opacity-45">
                Press Enter to search Earth (Google Places) — or pick a
                SYSTEMBOOM destination.
              </p>
            </div>
          )}

          {/* Destination intelligence — same surface as the Leaflet fallback,
              lifted clear of Google's native attribution */}
          <DestinationPanel
            destination={destination}
            onClose={() => setDestination(null)}
            desktopOffsetClass="sm:bottom-24"
          />
        </>
      )}

      {/* Screen-reader location context */}
      <p aria-live="polite" className="sr-only">
        {crumbs.join(", ")} — camera range {formatAltitude(altitude)}
      </p>
    </div>
  );
}
