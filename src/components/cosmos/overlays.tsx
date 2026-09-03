"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Info,
  Menu,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  SunMedium,
  Volume2,
  VolumeX,
} from "lucide-react";
import { SYSTEMBOOM_OFFICES } from "@/lib/systemboom-origin";
import { SystemboomLogo } from "@/components/ui/SystemboomLogo";
import { setTheme, useTheme } from "@/lib/use-theme";
import {
  PLANETS,
  PLANET_BY_ID,
  type PlanetId,
} from "@/lib/cosmos/planets";

/* ---------- floating material helpers ---------- */

export function useChrome() {
  const theme = useTheme();
  const chip =
    theme === "light"
      ? "bg-[rgba(235,244,255,0.16)] border-white/30 text-white hover:bg-[rgba(235,244,255,0.28)]"
      : "bg-[rgba(9,14,24,0.52)] border-white/10 text-[#e9eff8] hover:bg-[rgba(22,32,50,0.6)]";
  const panel =
    theme === "light"
      ? "bg-[rgba(16,32,56,0.78)] border-white/20 text-white"
      : "bg-[rgba(8,12,21,0.78)] border-white/10 text-[#e9eff8]";
  return { theme, chip, panel };
}

export const CHIP_BASE =
  "sb-transition inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-medium backdrop-blur-md focus-visible:outline-[#8fc2ff]";

const PLANET_TINTS: Record<PlanetId, string> = {
  mercury: "#9c9488",
  venus: "#d9b98a",
  earth: "#6f9fd8",
  mars: "#c4714a",
  jupiter: "#c9a97e",
  saturn: "#d8c49a",
  uranus: "#9fd4d8",
  neptune: "#5d7fd4",
};

/* ============================================================
   NAVIGATION
   ============================================================ */

type NavPanel = "explore" | "learn" | "signin" | "menu" | null;

export function CosmosNav({
  onSelectPlanet,
  onHome,
  minimal = false,
  soundMuted,
  onToggleSound,
}: {
  onSelectPlanet: (id: PlanetId) => void;
  onHome: () => void;
  /** Deep-Earth exploration: recede so the map dominates. */
  minimal?: boolean;
  soundMuted?: boolean;
  onToggleSound?: () => void;
}) {
  const { theme, chip, panel } = useChrome();
  const [open, setOpen] = useState<NavPanel>(null);
  const close = () => setOpen(null);

  const selectPlanet = (id: PlanetId) => {
    close();
    onSelectPlanet(id);
  };

  return (
    <>
      {open && (
        <button
          aria-label="Close panel"
          onClick={close}
          className="fixed inset-0 z-20 cursor-default"
        />
      )}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <button
          onClick={() => {
            close();
            onHome();
          }}
          aria-label="SYSTEMBOOM — return to Solar System"
          className="pointer-events-auto rounded-full p-1 focus-visible:outline-[#8fc2ff]"
        >
          <SystemboomLogo height={22} priority />
        </button>

        {/* Desktop center controls — recede during deep Earth exploration */}
        <nav
          aria-label="Cosmos"
          className={`pointer-events-auto hidden items-center gap-2 ${minimal ? "" : "md:flex"}`}
        >
          <button
            className={`${CHIP_BASE} ${chip}`}
            aria-expanded={open === "explore"}
            onClick={() => setOpen(open === "explore" ? null : "explore")}
          >
            Explore
          </button>
          <button
            className={`${CHIP_BASE} ${chip}`}
            onClick={() => {
              close();
              onSelectPlanet("earth");
            }}
          >
            Earth
          </button>
          <button
            className={`${CHIP_BASE} ${chip}`}
            aria-expanded={open === "learn"}
            onClick={() => setOpen(open === "learn" ? null : "learn")}
          >
            Learn
          </button>
        </nav>

        <div className="pointer-events-auto flex items-center gap-2">
          {onToggleSound && (
            <button
              aria-label={soundMuted ? "Enable Cosmos ambience" : "Mute Cosmos ambience"}
              aria-pressed={!soundMuted}
              onClick={onToggleSound}
              className={`${CHIP_BASE} ${chip} !px-3`}
            >
              {soundMuted ? (
                <VolumeX size={17} strokeWidth={1.75} />
              ) : (
                <Volume2 size={17} strokeWidth={1.75} />
              )}
            </button>
          )}
          <button
            aria-label={`Switch to ${theme === "dark" ? "Solar Observatory (light)" : "Deep Cosmos (dark)"} mode`}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`${CHIP_BASE} ${chip} !px-3`}
          >
            {theme === "dark" ? (
              <SunMedium size={17} strokeWidth={1.75} />
            ) : (
              <Moon size={17} strokeWidth={1.75} />
            )}
          </button>
          <button
            className={`${CHIP_BASE} ${chip} hidden sm:inline-flex`}
            aria-expanded={open === "signin"}
            onClick={() => setOpen(open === "signin" ? null : "signin")}
          >
            Sign In
          </button>
          {!minimal && (
            <button
              aria-label="Menu"
              aria-expanded={open === "menu"}
              onClick={() => setOpen(open === "menu" ? null : "menu")}
              className={`${CHIP_BASE} ${chip} !px-3 md:hidden`}
            >
              <Menu size={18} strokeWidth={1.75} />
            </button>
          )}
        </div>
      </header>

      {/* Explore — accessible planet index */}
      {open === "explore" && (
        <div
          role="menu"
          aria-label="Solar System"
          className={`fixed top-20 left-1/2 z-30 w-64 -translate-x-1/2 rounded-2xl border p-2 backdrop-blur-xl ${panel}`}
        >
          <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-[0.18em] uppercase opacity-60">
            Solar System
          </p>
          {PLANETS.map((p) => (
            <button
              key={p.id}
              role="menuitem"
              onClick={() => selectPlanet(p.id)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-white/10 focus-visible:outline-[#8fc2ff]"
            >
              <span
                aria-hidden
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: PLANET_TINTS[p.id] }}
              />
              {p.name}
              <ChevronRight size={14} className="ml-auto opacity-40" />
            </button>
          ))}
          <p className="px-3 pt-1 pb-2 text-xs opacity-50">
            Cinematic view — not to scale.
          </p>
        </div>
      )}

      {/* Learn */}
      {open === "learn" && (
        <div
          className={`fixed top-20 left-1/2 z-30 w-[min(92vw,380px)] -translate-x-1/2 rounded-2xl border p-6 backdrop-blur-xl ${panel}`}
          role="dialog"
          aria-label="About SYSTEMBOOM Cosmos"
        >
          <p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-60">
            SYSTEMBOOM Cosmos
          </p>
          <p className="mt-3 text-sm leading-relaxed opacity-90">
            From the universe to your life. SYSTEMBOOM begins in space because
            that is where every story does — the Cosmos is the doorway to your
            world, your time and your people.
          </p>
          <p className="mt-3 text-sm leading-relaxed opacity-90">
            The view is a cinematic representation: planet identity, order and
            orbits are real; sizes, distances and speeds are compressed for
            feeling. Facts shown use NASA planetary data.
          </p>
          <p className="mt-4 text-xs leading-relaxed opacity-60">
            Planetary textures: Solar System Scope (CC BY 4.0), based on NASA
            imagery. Earth Explorer imagery: Esri World Imagery and
            OpenStreetMap contributors, attributed in-view. Prototype.
          </p>
          <button onClick={close} className={`${CHIP_BASE} ${chip} mt-5 w-full`}>
            Close
          </button>
        </div>
      )}

      {/* Sign In — prototype gate */}
      {open === "signin" && (
        <div
          className={`fixed top-20 right-4 z-30 w-[min(92vw,340px)] rounded-2xl border p-6 backdrop-blur-xl sm:right-6 ${panel}`}
          role="dialog"
          aria-label="Sign in"
        >
          <p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-60">
            Enter SYSTEMBOOM
          </p>
          <p className="mt-3 text-sm leading-relaxed opacity-90">
            The entry experience — from the Cosmos to your Earth, your world
            and your life — arrives in Phase 2 of this prototype.
          </p>
          <div
            className="mt-5 flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-full bg-[#d92a20]/45 px-6 text-sm font-semibold text-white/70"
            aria-disabled="true"
          >
            Enter SYSTEMBOOM — coming in Phase 2
          </div>
          <button onClick={close} className={`${CHIP_BASE} ${chip} mt-3 w-full`}>
            Close
          </button>
        </div>
      )}

      {/* Mobile menu */}
      {open === "menu" && (
        <div
          className={`fixed inset-x-3 top-20 z-30 rounded-2xl border p-3 backdrop-blur-xl md:hidden ${panel}`}
          role="dialog"
          aria-label="Cosmos menu"
        >
          <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-[0.18em] uppercase opacity-60">
            Solar System
          </p>
          <div className="grid grid-cols-2">
            {PLANETS.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPlanet(p.id)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-white/10 focus-visible:outline-[#8fc2ff]"
              >
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: PLANET_TINTS[p.id] }}
                />
                {p.name}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2 border-t border-white/10 pt-3">
            <button
              className={`${CHIP_BASE} ${chip} flex-1`}
              onClick={() => setOpen("learn")}
            >
              Learn
            </button>
            <button
              className={`${CHIP_BASE} ${chip} flex-1`}
              onClick={() => setOpen("signin")}
            >
              Sign In
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================
   GLOBE BREADCRUMB — the semantic ladder, on the planet itself.
   WHERE AM I lives here; the bottom EARTH chip answers scale.
   ============================================================ */

export function GlobeBreadcrumb({
  path,
  onEarth,
  onNavigate,
  receded = false,
}: {
  /** Ancestors → current target ([] = whole Earth, no pill shown). */
  path: import("@/lib/earth/globe-geo").GlobeGeoLabel[];
  onEarth: () => void;
  onNavigate: (label: import("@/lib/earth/globe-geo").GlobeGeoLabel) => void;
  receded?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  if (path.length === 0) return null;
  const compress = path.length > 3 && !expanded;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-[4.6rem] z-20 flex justify-center px-4 transition-opacity duration-500 ${
        receded ? "opacity-35" : "opacity-100"
      }`}
    >
      <nav
        aria-label="Geographic scale ladder"
        className="pointer-events-auto flex max-w-full items-center gap-1 overflow-hidden rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium tracking-wide text-white/90 backdrop-blur-md [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]"
      >
        <button
          onClick={() => {
            setExpanded(false);
            onEarth();
          }}
          aria-label="View Earth"
          className="sb-transition rounded-full px-1 py-1.5 text-white/65 hover:scale-[1.04] hover:text-white focus-visible:outline-[#8fc2ff]"
        >
          EARTH
        </button>
        {compress && (
          <>
            <span aria-hidden className="text-white/35">/</span>
            <button
              onClick={() => setExpanded(true)}
              aria-label="Show all geographic levels"
              className="rounded-full px-1.5 py-1.5 text-white/65 hover:text-white focus-visible:outline-[#8fc2ff]"
            >
              …
            </button>
          </>
        )}
        {path.map((label, i) => {
          const isActive = i === path.length - 1;
          if (compress && i < path.length - 2) return null;
          return (
            <span key={label.id} className="flex items-center gap-1 whitespace-nowrap">
              <span aria-hidden className="text-white/35">/</span>
              {isActive ? (
                <span aria-current="location" className="px-1 py-1.5 text-white">
                  {label.name.toUpperCase()}
                </span>
              ) : (
                <button
                  onClick={() => {
                    setExpanded(false);
                    onNavigate(label);
                  }}
                  aria-label={`View ${label.name}`}
                  className="sb-transition rounded-full px-1 py-1.5 text-white/65 hover:scale-[1.04] hover:text-white focus-visible:outline-[#8fc2ff]"
                >
                  {label.name.toUpperCase()}
                </button>
              )}
            </span>
          );
        })}
      </nav>
    </div>
  );
}

/* ============================================================
   PLANET INFORMATION
   ============================================================ */

export function PlanetInfoPanel(props: {
  planetId: PlanetId;
  onReturn: () => void;
  onExploreEarth: () => void;
}) {
  // Remount per planet so transient state (the explore note) resets cleanly.
  return <PlanetInfoPanelInner key={props.planetId} {...props} />;
}

function PlanetInfoPanelInner({
  planetId,
  onReturn,
  onExploreEarth,
}: {
  planetId: PlanetId;
  onReturn: () => void;
  onExploreEarth: () => void;
}) {
  const { chip, panel } = useChrome();
  const spec = PLANET_BY_ID[planetId];
  const [note, setNote] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <aside
      className={`fixed bottom-3 left-3 z-30 w-[calc(100vw-1.5rem)] max-w-sm rounded-3xl border p-6 backdrop-blur-xl sm:bottom-8 sm:left-8 ${panel}`}
      aria-label={`${spec.name} information`}
    >
      <button
        onClick={onReturn}
        className="mb-4 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium opacity-80 hover:opacity-100 focus-visible:outline-[#8fc2ff]"
      >
        <ArrowLeft size={15} /> Solar System
      </button>
      <p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-60">
        {spec.ordinal}
      </p>
      <h2
        ref={heading}
        tabIndex={-1}
        className="mt-1 text-3xl font-semibold tracking-tight !outline-none"
      >
        {spec.name}
      </h2>
      <p className="mt-0.5 text-sm opacity-70">{spec.type}</p>
      <p className="mt-3 text-sm leading-relaxed opacity-90">{spec.fact}</p>

      <p className="mt-3 text-[11px] leading-relaxed opacity-50">
        Drag to orbit · scroll or pinch to move closer
        {planetId === "earth" ? " · double-tap a place to focus" : ""}.
      </p>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {(
          [
            ["Day", spec.dayLength],
            ["Moons", String(spec.moons)],
            ["Distance", spec.distance],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="rounded-xl border border-white/10 bg-white/5 px-2 py-2.5">
            <dt className="text-[11px] tracking-wide uppercase opacity-55">{k}</dt>
            <dd className="mt-0.5 text-sm font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      {planetId === "earth" ? (
        <button
          onClick={onExploreEarth}
          className="sb-transition mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#d92a20] px-6 font-semibold text-white hover:bg-[#f04136] focus-visible:outline-[#8fc2ff]"
        >
          Explore Earth <ArrowRight size={16} />
        </button>
      ) : (
        <>
          <button
            onClick={() => setNote((v) => !v)}
            aria-expanded={note}
            className={`${CHIP_BASE} ${chip} mt-5 w-full`}
          >
            Explore {spec.name} <ArrowRight size={15} />
          </button>
          {note && (
            <p className="mt-2 text-xs leading-relaxed opacity-60">
              Deep exploration of {spec.name} arrives in a later phase —
              prototype.
            </p>
          )}
        </>
      )}
    </aside>
  );
}

/* ============================================================
   PLANET INSPECTION BAR — the UI recedes, the planet dominates.
   ============================================================ */

/**
 * First-use coaching lifecycle, session-scoped so React strict-mode
 * double-mounting can't strand the whisper on screen: "unknown" until the
 * persisted flag is read once, "show" while the first-use whisper is owed,
 * "done" after it retires (interaction, timeout, or a previous visit).
 */
let coachSession: "unknown" | "show" | "done" = "unknown";

export function InspectBar({
  name,
  isEarth,
  onBack,
  onReset,
  onZoomIn,
  onZoomOut,
  infoOpen,
  onToggleInfo,
  onOffice,
  selectedOfficeId,
  receded = false,
  earthDistRef,
}: {
  name: string;
  isEarth: boolean;
  onBack: () => void;
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  infoOpen: boolean;
  onToggleInfo: () => void;
  onOffice: (officeId: string) => void;
  /** Two-stage memory: the selected office travels on its next activation. */
  selectedOfficeId: string | null;
  /** Active manipulation: nonessential controls fade so the planet dominates. */
  receded?: boolean;
  /** Live Earth camera distance (radii) — feeds the quiet altitude readout. */
  earthDistRef?: React.MutableRefObject<number>;
}) {
  const { chip, panel } = useChrome();
  const [officesOpen, setOfficesOpen] = useState(false);
  const [coach, setCoach] = useState(false);
  const [altitude, setAltitude] = useState("");

  // Quiet scale context — derived from the camera/planet relationship.
  useEffect(() => {
    if (!isEarth || !earthDistRef) {
      setAltitude("");
      return;
    }
    const format = () => {
      const d = earthDistRef.current;
      if (d > 90) return "";
      const km = Math.max(120, (d - 1) * 6371);
      const step = km > 20000 ? 1000 : km > 2000 ? 100 : 50;
      return `${(Math.round(km / step) * step).toLocaleString("en-US")} km`;
    };
    setAltitude(format());
    const t = setInterval(() => setAltitude(format()), 350);
    return () => clearInterval(t);
  }, [isEarth, earthDistRef]);

  const recede = receded && !officesOpen;
  const ghost = recede
    ? "opacity-0 pointer-events-none"
    : "opacity-100";
  const dim = recede ? "opacity-60" : "opacity-100";

  // One-time gentle coaching: shows quietly on the first visit, retires as
  // soon as the user demonstrates the interaction (or after a few seconds),
  // and never returns on later visits. Help remains discoverable in the
  // planet info panel.
  useEffect(() => {
    if (coachSession === "unknown") {
      try {
        coachSession = localStorage.getItem("sb-coach-planet") ? "done" : "show";
        localStorage.setItem("sb-coach-planet", "seen");
      } catch {
        coachSession = "done";
      }
    }
    if (coachSession !== "show") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of persisted preference
    setCoach(true);
    const retire = () => {
      coachSession = "done";
      setCoach(false);
    };
    let t = setTimeout(retire, 6000);
    const onFirstInteraction = (e: Event) => {
      if (!(e.target instanceof HTMLCanvasElement)) return;
      clearTimeout(t);
      t = setTimeout(retire, 900);
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("wheel", onFirstInteraction);
    };
    window.addEventListener("pointerdown", onFirstInteraction);
    window.addEventListener("wheel", onFirstInteraction, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("wheel", onFirstInteraction);
    };
  }, []);

  return (
    <>
      {/* Short viewports (phone landscape) get a compact strip:
          [←] [EARTH · altitude] [+] [−] [SB] — Earth stays the hero. */}
      <div className="fixed bottom-4 left-1/2 z-30 flex max-w-[96vw] -translate-x-1/2 items-center gap-1.5 sm:bottom-6 [@media(max-height:480px)]:bottom-2 [@media(max-height:480px)]:scale-90">
        <button
          onClick={onBack}
          className={`${CHIP_BASE} ${chip} sb-transition !px-3.5 ${dim}`}
        >
          <ArrowLeft size={15} />{" "}
          <span className="hidden sm:inline [@media(max-height:480px)]:hidden">
            Solar System
          </span>
        </button>
        <span
          className={`${CHIP_BASE} ${chip} sb-transition pointer-events-none !px-4 text-xs font-semibold tracking-[0.2em] uppercase ${dim}`}
        >
          {name}
          {altitude && (
            <span className="ml-1 border-l border-white/20 pl-2 text-[10px] font-normal tracking-normal normal-case opacity-60">
              {altitude}
            </span>
          )}
        </span>
        <button
          aria-label="Zoom in"
          onClick={onZoomIn}
          className={`${CHIP_BASE} ${chip} sb-transition !px-3 ${ghost}`}
        >
          <Plus size={15} />
        </button>
        <button
          aria-label="Zoom out"
          onClick={onZoomOut}
          className={`${CHIP_BASE} ${chip} sb-transition !px-3 ${ghost}`}
        >
          <Minus size={15} />
        </button>
        <button
          aria-label="Reset view"
          onClick={onReset}
          className={`${CHIP_BASE} ${chip} sb-transition !px-3 ${ghost} [@media(max-height:480px)]:hidden`}
        >
          <RotateCcw size={14} />
        </button>
        <button
          aria-label={infoOpen ? "Hide planet information" : "Show planet information"}
          aria-expanded={infoOpen}
          onClick={onToggleInfo}
          className={`${CHIP_BASE} ${infoOpen ? "border-white/40 bg-white/20 text-white" : chip} sb-transition !px-3 ${ghost} [@media(max-height:480px)]:hidden`}
        >
          <Info size={15} />
        </button>
        {isEarth && (
          <button
            aria-expanded={officesOpen}
            aria-label="SYSTEMBOOM locations on Earth"
            onClick={() => setOfficesOpen((v) => !v)}
            className={`${CHIP_BASE} ${chip} sb-transition !px-3.5 ${ghost}`}
          >
            <span className="text-xs max-sm:hidden">SYSTEMBOOM</span>
            <span className="text-xs sm:hidden">SB</span>
          </button>
        )}
      </div>

      {/* Accessible SYSTEMBOOM locations list */}
      {isEarth && officesOpen && (
        <div
          role="dialog"
          aria-label="SYSTEMBOOM locations on Earth"
          className={`fixed bottom-20 left-1/2 z-30 w-[min(92vw,320px)] -translate-x-1/2 rounded-2xl border p-3 backdrop-blur-xl ${panel}`}
        >
          <p className="px-3 pt-1 pb-2 text-[11px] font-semibold tracking-[0.18em] uppercase opacity-60">
            SYSTEMBOOM on Earth
          </p>
          {SYSTEMBOOM_OFFICES.map((office) => {
            const isSel = selectedOfficeId === office.id;
            return (
              <button
                key={office.id}
                aria-pressed={isSel}
                onClick={() => {
                  setOfficesOpen(false);
                  onOffice(office.id);
                }}
                className={`flex w-full flex-col rounded-xl px-3 py-2.5 text-left text-sm hover:bg-white/10 focus-visible:outline-[#8fc2ff] ${
                  isSel ? "bg-white/10" : ""
                }`}
              >
                {office.role}
                <span className="text-xs opacity-55">
                  {office.deepLine}
                  {isSel ? " · selected — again to travel" : ""}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* One-time coaching whisper — retires on first interaction */}
      {coach && !recede && (
        <p className="pointer-events-none fixed bottom-20 left-1/2 z-20 -translate-x-1/2 text-xs text-white/55 transition-opacity duration-700 [text-shadow:0_1px_8px_rgba(0,0,0,0.8)] [@media(max-height:480px)]:hidden">
          <span className="sm:hidden">Drag Earth · pinch · tap a place name</span>
          <span className="hidden sm:inline">
            Drag Earth · scroll or pinch to move closer
            {isEarth ? " · tap a place name to travel" : ""}
          </span>
        </p>
      )}
    </>
  );
}

/* ============================================================
   QUIET SUPPORTING COPY
   ============================================================ */

export function QuietCopy() {
  return (
    <div className="pointer-events-none fixed bottom-5 left-4 z-20 max-w-[16rem] select-none sm:bottom-8 sm:left-8">
      <p className="text-[11px] font-semibold tracking-[0.28em] text-white/75 uppercase [text-shadow:0_1px_10px_rgba(0,0,0,0.7)]">
        From the universe
        <br />
        to your life.
      </p>
      <p className="mt-2 hidden text-xs leading-relaxed text-white/45 [text-shadow:0_1px_10px_rgba(0,0,0,0.7)] sm:block">
        Explore your universe. Preserve your life. Connect your world.
      </p>
    </div>
  );
}
