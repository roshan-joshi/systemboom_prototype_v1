"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  Suspense,
} from "react";
import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import type * as THREE from "three";
import { detectTier, QUALITY } from "@/lib/cosmos/quality";
import { CosmosAmbience, storedMuted } from "@/lib/cosmos/ambience";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { PLANET_BY_ID, type PlanetId } from "@/lib/cosmos/planets";
import { SYSTEMBOOM_OFFICES } from "@/lib/systemboom-origin";
import { geoChildren, geoPath, type GlobeGeoLabel } from "@/lib/earth/globe-geo";
import { EarthExplorer } from "@/components/earth/EarthExplorer";
import { Scene } from "./Scene";
import type { SurfaceTarget } from "./Earth";
import type { CameraHandle, EarthJourney } from "./CameraRig";
import { CosmosLoading } from "./CosmosLoading";
import {
  CosmosNav,
  GlobeBreadcrumb,
  InspectBar,
  PlanetInfoPanel,
  QuietCopy,
} from "./overlays";
import type { CosmosMode, PlanetRefs } from "./types";

function subscribeMobile(cb: () => void) {
  const mql = window.matchMedia("(max-width: 767px)");
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

function useIsMobile() {
  return useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false,
  );
}

/**
 * Earth-surface handoff stages:
 * approach — R3F camera descends toward Earth, atmosphere thickens
 * live     — the geographic provider owns the frame, Cosmos paused
 * closing  — atmosphere returns, R3F Earth resumes
 */
type ExplorerStage = "off" | "approach" | "live" | "closing";

export default function CosmosExperience() {
  const [mode, setMode] = useState<CosmosMode>("system");
  const [selected, setSelected] = useState<PlanetId | null>(null);
  const [explorerStage, setExplorerStage] = useState<ExplorerStage>("off");
  const [cosmosPaused, setCosmosPaused] = useState(false);
  const [haze, setHaze] = useState(false);
  const [ready, setReady] = useState(false);
  const [journey, setJourney] = useState<EarthJourney | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [explorerOffice, setExplorerOffice] = useState<string | null>(null);
  /** Office selection memory — set by stage one, consumed by stage two. */
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  const [officeAnnounce, setOfficeAnnounce] = useState("");

  const planetRefs: PlanetRefs = useRef({});
  const earthBodyRef = useRef<THREE.Mesh | null>(null);
  const facingRef = useRef({ lat: 27.7, lon: 85.3 });
  const surfaceTargetRef = useRef<SurfaceTarget | null>(null);
  const handoffView = useRef<{ lat: number; lon: number; zoom?: number; geoId?: string }>({
    lat: 27.7,
    lon: 85.3,
  });
  const pendingTarget = useRef<{
    lat: number;
    lon: number;
    zoom?: number;
    geoId?: string;
  } | null>(null);
  /** Semantic navigation memory: the deep map context left via the ladder. */
  const mapReturn = useRef<{ lat: number; lon: number; zoom: number } | null>(null);
  /** The current semantic geographic subject (null = whole Earth). */
  const [selectedGeo, setSelectedGeo] = useState<GlobeGeoLabel | null>(null);
  const selectedGeoRef = useRef<GlobeGeoLabel | null>(null);
  useEffect(() => {
    selectedGeoRef.current = selectedGeo;
  }, [selectedGeo]);

  /** Map arrival scale per semantic tier — the target decides the depth. */
  const GEO_MAP_ZOOM: Record<string, number> = useMemo(
    () => ({ country: 6.8, region: 9.5, city: 11.5 }),
    [],
  );
  const cameraHandleRef = useRef<CameraHandle | null>(null);
  /** Live camera distance to Earth (in radii) — decides click stage. */
  const earthDistRef = useRef(99);

  const tier = useMemo(() => detectTier(), []);
  const q = QUALITY[tier];
  const reduced = useReducedMotionPref();
  const isMobile = useIsMobile();
  const { progress } = useProgress();

  /* ---------- Cosmos ambience ---------- */
  const ambienceRef = useRef<CosmosAmbience | null>(null);
  const [soundMuted, setSoundMuted] = useState(false);
  useEffect(() => {
    const muted = storedMuted();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of persisted preference
    setSoundMuted(muted);
    const ambience = new CosmosAmbience(isMobile ? 0.045 : 0.06, muted);
    ambienceRef.current = ambience;
    ambience.start();
    return () => {
      ambience.dispose();
      ambienceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- volume tier fixed at mount
  }, []);
  const toggleSound = useCallback(() => {
    const ambience = ambienceRef.current;
    if (!ambience) return;
    const next = !ambience.muted;
    ambience.setMuted(next);
    setSoundMuted(next);
  }, []);

  // Reveal once assets are in — with a safety valve so we never trap the user.
  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(() => setReady(true), 400);
      return () => clearTimeout(t);
    }
  }, [progress]);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 8000);
    return () => clearTimeout(t);
  }, []);

  const select = useCallback((id: PlanetId) => {
    setSelected(id);
    setMode("focus");
    setJourney(null);
    setInfoOpen(false);
    if (id !== "earth") {
      setSelectedOfficeId(null);
      setSelectedGeo(null);
    }
  }, []);

  const returnToSystem = useCallback(() => {
    setGMode(false);
    setMode("system");
    setSelected(null);
    setJourney(null);
    setInfoOpen(false);
    setSelectedOfficeId(null);
    setOfficeAnnounce("");
    setSelectedGeo(null);
  }, []);

  /* ---------- Earth surface handoff (R3F → geographic provider) ---------- */

  const enterExplorer = useCallback((officeId?: string | null) => {
    setGMode(false);
    // Resolve the geographic target NOW — the provider mounts with the
    // approach and captures initialView immediately, so a deferred update
    // would strand every natural descent on a stale default.
    handoffView.current = pendingTarget.current ?? { ...facingRef.current };
    pendingTarget.current = null;
    setSelected("earth");
    setMode("explorer");
    setExplorerStage("approach");
    setExplorerOffice(officeId ?? null);
    setJourney(null);
    setInfoOpen(false);
  }, []);

  // Natural deep-zoom intent: open where the user is actually looking.
  // Navigation memory: descending back over the area the user left via the
  // semantic ladder returns to that deep context — no second search needed.
  const onApproachEarth = useCallback(() => {
    const surface = surfaceTargetRef.current;
    let target: { lat: number; lon: number; zoom?: number; geoId?: string } | null =
      surface && performance.now() - surface.at < 1600
        ? { lat: surface.lat, lon: surface.lon }
        : null;
    // Selected geography decides the map's arrival scale — a selected
    // country opens a country-scale map, a selected city a city-scale map —
    // as long as the user is actually diving toward it.
    const sel = selectedGeoRef.current;
    if (
      sel &&
      sel.kind !== "continent" &&
      (!target || Math.hypot(sel.lat - target.lat, sel.lon - target.lon) < 16)
    ) {
      target = {
        lat: sel.lat,
        lon: sel.lon,
        zoom: GEO_MAP_ZOOM[sel.kind] ?? 11.5,
        geoId: sel.id,
      };
    }
    const mem = mapReturn.current;
    if (target && mem && Math.hypot(mem.lat - target.lat, mem.lon - target.lon) < 0.7) {
      target = { ...mem };
    }
    pendingTarget.current = target;
    enterExplorer(null);
  }, [enterExplorer, GEO_MAP_ZOOM]);

  /* ---------- SYSTEMBOOM two-stage office journeys ----------
     FIRST CLICK  — "show me where SYSTEMBOOM is": Earth grows into a close
                    3D inspection with the office signal attached. No map.
     SECOND CLICK — on the already-selected office from close Earth:
                    "take me there" — full descent into the map provider. */

  /** Earth is close enough that another office click means "take me there". */
  const CLOSE_INSPECT_MAX = 2.35;

  const officeSelect = useCallback(
    (officeId: string) => {
      const office = SYSTEMBOOM_OFFICES.find((o) => o.id === officeId);
      if (!office) return;
      setInfoOpen(false);
      const earthClose =
        mode === "focus" &&
        selected === "earth" &&
        earthDistRef.current < CLOSE_INSPECT_MAX;
      if (earthClose && selectedOfficeId === officeId) {
        // Stage two — descend to the office and hand off to the map.
        setJourney({
          lat: office.latitude,
          lon: office.longitude,
          kind: "descend",
          officeId,
        });
        setOfficeAnnounce(`Travelling to ${office.name}.`);
      } else {
        // Stage one — focus Earth and settle into close inspection.
        setSelectedOfficeId(officeId);
        setSelected("earth");
        setMode("focus");
        setJourney({
          lat: office.latitude,
          lon: office.longitude,
          kind: "inspect",
          officeId,
        });
        setOfficeAnnounce(`${office.role} selected. Earth focused.`);
      }
    },
    [mode, selected, selectedOfficeId],
  );

  const onSurfaceFocus = useCallback((target: { lat: number; lon: number }) => {
    setJourney({ lat: target.lat, lon: target.lon, kind: "focus" });
  }, []);

  /* ---------- THE WORLD ITSELF IS THE INTERFACE (final model) ----------
     Manual zoom/pinch/drag = explore the 3D Earth indefinitely.
     Clicking a GEOGRAPHIC NAME = explicit "take me there": one guided
     journey straight through the atmosphere into the map, framed on that
     geography. Offices keep their special two-stage behaviour. */

  const [geoAnnounce, setGeoAnnounce] = useState("");

  /** A geographic name on the globe was activated: travel to its map. */
  const geoNavigate = useCallback((label: GlobeGeoLabel) => {
    setSelected("earth");
    setMode("focus");
    setInfoOpen(false);
    // Brief territory acknowledgement rides along during the descent
    // (the selected-country boundary renders while the journey runs).
    setSelectedGeo(label);
    pendingTarget.current = {
      lat: label.lat,
      lon: label.lon,
      geoId: label.id,
    };
    setJourney({ lat: label.lat, lon: label.lon, kind: "descend" });
    setGeoAnnounce(`Travelling to ${label.name}.`);
  }, []);

  /* ---------- keyboard: world-class Earth without a mouse ----------
     Arrows rotate, +/- zoom, G enters geography mode (arrows cycle the
     currently relevant targets, Enter travels, Escape leaves the mode). */
  const [gMode, setGMode] = useState(false);
  const [gIndex, setGIndex] = useState(0);

  /** The currently relevant semantic targets (children of the selection). */
  const geoCandidates = useMemo(() => {
    const kids = geoChildren(selectedGeo?.id ?? null);
    // Deepest selections with no children fall back to their siblings.
    return kids.length > 0 ? kids : geoChildren(selectedGeo?.parent ?? null);
  }, [selectedGeo]);

  // Reset the geography cursor whenever the candidate set changes —
  // tracked by key rather than a state write inside an effect.
  const gListKey = useMemo(() => geoCandidates.map((c) => c.id).join("|"), [geoCandidates]);
  const gIndexKey = useRef(gListKey);
  if (gIndexKey.current !== gListKey) {
    gIndexKey.current = gListKey;
    if (gIndex !== 0) setGIndex(0);
  }

  const earthKeysActive =
    mode === "focus" && selected === "earth" && explorerStage === "off";

  useEffect(() => {
    if (!earthKeysActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;
      const h = cameraHandleRef.current;
      if (gMode) {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          setGIndex((i) => {
            const n = (i + 1) % Math.max(1, geoCandidates.length);
            const c = geoCandidates[n];
            if (c) setGeoAnnounce(`${c.name}, ${c.kind}. Press Enter to view.`);
            return n;
          });
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          setGIndex((i) => {
            const n = (i - 1 + geoCandidates.length) % Math.max(1, geoCandidates.length);
            const c = geoCandidates[n];
            if (c) setGeoAnnounce(`${c.name}, ${c.kind}. Press Enter to view.`);
            return n;
          });
        } else if (e.key === "Enter") {
          e.preventDefault();
          const c = geoCandidates[gIndex];
          if (c) {
            setGMode(false);
            geoNavigate(c);
          }
        } else if (e.key === "Escape") {
          e.preventDefault();
          e.stopImmediatePropagation();
          setGMode(false);
          setGeoAnnounce("Geography mode off.");
        }
        return;
      }
      if (e.key === "g" || e.key === "G") {
        setGMode(true);
        const c = geoCandidates[0];
        setGeoAnnounce(
          `Geography mode. ${c ? `${c.name}, ${c.kind}. ` : ""}Arrow keys to choose, Enter to view, Escape to leave.`,
        );
      } else if (e.key === "ArrowLeft") h?.rotate(-0.09, 0);
      else if (e.key === "ArrowRight") h?.rotate(0.09, 0);
      else if (e.key === "ArrowUp") h?.rotate(0, -0.06);
      else if (e.key === "ArrowDown") h?.rotate(0, 0.06);
      else if (e.key === "+" || e.key === "=") h?.zoomIn();
      else if (e.key === "-") h?.zoomOut();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [earthKeysActive, gMode, gIndex, geoCandidates, geoNavigate]);

  /** Breadcrumb EARTH: all territory treatment retires; the full globe returns. */
  const geoNavigateEarth = useCallback(() => {
    setSelectedGeo(null);
    setSelected("earth");
    setMode("focus");
    setJourney(null);
    setInfoOpen(false);
    cameraHandleRef.current?.resetView();
    setGeoAnnounce("Viewing full Earth.");
  }, []);


  const onJourneyHandoff = useCallback(
    (officeId?: string) => {
      const office = officeId
        ? SYSTEMBOOM_OFFICES.find((o) => o.id === officeId)
        : undefined;
      if (office) {
        pendingTarget.current = { lat: office.latitude, lon: office.longitude };
      }
      enterExplorer(officeId ?? null);
    },
    [enterExplorer],
  );

  // Descent: camera closes in, atmosphere thickens, surface fades in.
  useEffect(() => {
    if (explorerStage !== "approach") return;
    const timers = [
      setTimeout(() => setHaze(true), reduced ? 0 : 1000),
      setTimeout(() => setExplorerStage("live"), reduced ? 80 : 1700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [explorerStage, reduced]);

  useEffect(() => {
    if (explorerStage !== "live") return;
    ambienceRef.current?.setDucked(true);
    const timers = [
      setTimeout(() => setHaze(false), reduced ? 120 : 850),
      setTimeout(() => setCosmosPaused(true), reduced ? 150 : 900),
    ];
    return () => timers.forEach(clearTimeout);
  }, [explorerStage, reduced]);

  // Ascent: atmosphere returns, the R3F Earth takes back the frame.
  const exitExplorer = useCallback(() => {
    setHaze(true);
    ambienceRef.current?.setDucked(false);
    const t1 = setTimeout(
      () => {
        setCosmosPaused(false);
        setExplorerStage("closing");
        setMode("focus");
        setSelected("earth");
      },
      reduced ? 30 : 420,
    );
    const t2 = setTimeout(() => setHaze(false), reduced ? 80 : 1150);
    const t3 = setTimeout(() => {
      setExplorerStage("off");
      setExplorerOffice(null);
    }, reduced ? 120 : 1250);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [reduced]);

  /**
   * The map breadcrumb's EARTH: the explicit exit back to the living 3D
   * Earth. Everything else in the map ladder navigates WITHIN the map.
   * The globe returns already facing the geography the user was viewing —
   * never an unrelated hemisphere.
   */
  const navigateOut = useCallback(
    (target: {
      kind: "earth";
      name: string;
      from: { lat: number; lon: number; zoom: number };
    }) => {
      mapReturn.current = target.from;
      exitExplorer();
      setGeoAnnounce("Returning to Earth view.");
      setTimeout(
        () => {
          setSelectedGeo(null);
          setJourney({
            lat: target.from.lat,
            lon: target.from.lon,
            kind: "inspect",
            dist: 5.7,
          });
          setGeoAnnounce("Viewing full Earth.");
        },
        reduced ? 100 : 550,
      );
    },
    [exitExplorer, reduced],
  );

  // Escape walks one meaningful level out
  // (the surface handles its own Escape while live).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || explorerStage !== "off" || gMode) return;
      if (journey) setJourney(null);
      else if (infoOpen) setInfoOpen(false);
      else if (selectedGeo) setSelectedGeo(null);
      else if (mode === "focus") returnToSystem();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, explorerStage, journey, infoOpen, selectedGeo, returnToSystem, gMode]);

  const announcement =
    explorerStage === "live"
      ? "Earth surface view — zoom to streets and places"
      : mode === "system"
        ? "Solar System view"
        : selected
          ? `${PLANET_BY_ID[selected].name} focused — drag to orbit, scroll to zoom`
          : "";

  const explorerActive = explorerStage !== "off";
  const inspecting = mode === "focus" && selected && !explorerActive;

  /* ---------- UI recedes while the user manipulates the planet ---------- */
  const [manipulating, setManipulating] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const calm = (ms: number) => {
      clearTimeout(t);
      t = setTimeout(() => setManipulating(false), ms);
    };
    const onDown = (e: PointerEvent) => {
      if (e.target instanceof HTMLCanvasElement) {
        setManipulating(true);
        clearTimeout(t);
      }
    };
    const onUp = () => calm(1000);
    const onWheel = (e: WheelEvent) => {
      if (e.target instanceof HTMLCanvasElement) {
        setManipulating(true);
        calm(1300);
      }
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("wheel", onWheel);
    };
  }, []);
  const uiReceded = Boolean(manipulating && inspecting);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __SB_SURFACE?: object }).__SB_SURFACE = surfaceTargetRef;
      (window as unknown as { __SB_FACING?: object }).__SB_FACING = facingRef;
      (window as unknown as { __SB_STATE?: object }).__SB_STATE = {
        mode,
        selected,
        stage: explorerStage,
        journey,
        explorerOffice,
        selectedOfficeId,
        selectedGeo: selectedGeo
          ? { id: selectedGeo.id, kind: selectedGeo.kind, name: selectedGeo.name }
          : null,
        geoPath: ["Earth", ...(selectedGeo ? geoPath(selectedGeo.id).map((l) => l.name) : [])],
      };
    }
  });

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#04070e]">
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          explorerStage === "live" ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden
      >
        <Canvas
          dpr={[1, q.dprMax]}
          camera={{ fov: isMobile ? 58 : 46, near: 0.1, far: 600, position: [18, 14, 37] }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          frameloop={cosmosPaused ? "never" : "always"}
        >
          <Suspense fallback={null}>
            <Scene
              mode={mode}
              selected={selected}
              onSelect={select}
              tier={tier}
              reduced={reduced}
              isMobile={isMobile}
              planetRefs={planetRefs}
              earthBodyRef={earthBodyRef}
              facingRef={facingRef}
              surfaceTargetRef={surfaceTargetRef}
              onApproachEarth={onApproachEarth}
              journey={journey}
              onJourneyDone={() => setJourney(null)}
              onJourneyHandoff={onJourneyHandoff}
              onUserGrab={() => setJourney(null)}
              onOfficeSelect={officeSelect}
              onSurfaceFocus={onSurfaceFocus}
              cameraHandleRef={cameraHandleRef}
              selectedOfficeId={selectedOfficeId}
              earthDistRef={earthDistRef}
              onGeoNavigate={geoNavigate}
              selectedGeoId={selectedGeo?.id ?? null}
              focusedGeoId={gMode ? (geoCandidates[gIndex]?.id ?? null) : null}
            />
          </Suspense>
        </Canvas>
      </div>

      {explorerActive && (
        <EarthExplorer
          visible={explorerStage === "live"}
          initialView={handoffView.current}
          initialOfficeId={explorerOffice}
          reduced={reduced}
          onExited={exitExplorer}
          onNavigateOut={navigateOut}
        />
      )}

      {/* Atmospheric transition — the seam between worlds */}
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-20 transition-opacity duration-700 ${
          haze ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(130% 130% at 50% 62%, rgba(255,255,255,0.96) 0%, rgba(186,214,242,0.92) 38%, rgba(104,150,205,0.55) 68%, rgba(24,44,84,0.1) 100%)",
        }}
      />

      <CosmosNav
        onSelectPlanet={select}
        onHome={returnToSystem}
        minimal={explorerActive || mode === "focus"}
        soundMuted={soundMuted}
        onToggleSound={toggleSound}
      />

      {mode === "system" && !explorerActive && <QuietCopy />}

      {/* Semantic ladder on the planet — mirrors the map breadcrumb */}
      {inspecting && selected === "earth" && (
        <GlobeBreadcrumb
          path={selectedGeo ? geoPath(selectedGeo.id) : []}
          onEarth={geoNavigateEarth}
          onNavigate={geoNavigate}
          receded={uiReceded}
        />
      )}

      {inspecting && (
        <InspectBar
          name={PLANET_BY_ID[selected].name}
          isEarth={selected === "earth"}
          onBack={returnToSystem}
          onReset={() => cameraHandleRef.current?.resetView()}
          onZoomIn={() => cameraHandleRef.current?.zoomIn()}
          onZoomOut={() => cameraHandleRef.current?.zoomOut()}
          infoOpen={infoOpen}
          onToggleInfo={() => setInfoOpen((v) => !v)}
          onOffice={officeSelect}
          selectedOfficeId={selectedOfficeId}
          receded={uiReceded}
          earthDistRef={selected === "earth" ? earthDistRef : undefined}
        />
      )}

      {inspecting && infoOpen && (
        <PlanetInfoPanel
          planetId={selected}
          onReturn={returnToSystem}
          onExploreEarth={() => enterExplorer(null)}
        />
      )}

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <p aria-live="polite" className="sr-only">
        {officeAnnounce}
      </p>
      <p aria-live="polite" className="sr-only">
        {geoAnnounce}
      </p>

      {/* Screen-reader mirror: only the CURRENTLY relevant geography */}
      {inspecting && selected === "earth" && (
        <nav aria-label="Geography on Earth" className="sr-only">
          {geoCandidates.map((c) => (
            <button key={c.id} onClick={() => geoNavigate(c)}>
              {c.name}, {c.kind}. Press Enter to view.
            </button>
          ))}
        </nav>
      )}

      <CosmosLoading progress={progress} done={ready} />
    </div>
  );
}
