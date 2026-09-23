"use client";

/**
 * THE CELESTIAL FIELD — the Resonate interaction.
 *
 * Contract: 22-COMPONENT-ARCHITECTURE.md §1–§2 · 22-MOTION-RUNTIME.md · 22.1 closure §1–§2.
 *
 * A SPATIAL ARC / HORIZON, never a grid, emoji tray, reaction bar, radial dashboard or card
 * picker. The eight objects sit on a horizon you look across; the layout is driven by the
 * labels actually measured in the active language (layout.ts), not by English widths.
 *
 * STATE MACHINE: CLOSED → OPENING → OPEN → PREVIEW → SELECTED → COMMIT → SETTLE, with
 * CANCEL/RETURN reachable from OPEN or PREVIEW. No animation queue; every phase change
 * interrupts cleanly.
 *
 * COMMIT TIMING (22.1 §1, non-negotiable): `onCommit` fires EXACTLY ONCE at COMMIT START and
 * persistence begins immediately. The settle animation runs afterwards and can be interrupted,
 * unmounted or navigated away from without ever undoing the commit.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useTheme } from "@/lib/use-theme";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { M2, easeOut } from "@/lib/motion";
import { RESONANCES, resonanceById } from "@/lib/celestial/registry";
import { commitMotion, previewMotion, REDUCED_CROSSFADE_S, reducedTransition } from "@/lib/celestial/motion";
import type { FieldPhase, LearningState, ResonanceId } from "@/lib/celestial/types";
import { labelCapFor, layoutArc, objectSizeFor, perRowFor, type ArcLayout, type ItemBox } from "./layout";
import { atmosphere, artifactAura, masteredAsset, nightSky, nightSkyTheme, objectFilter, OBJECT_LIGHT, RESONATE_INK_SOLAR, starField } from "./visual";
import { useResonanceName } from "./ResonanceMark";

/** Each object enters through the horizon according to its own physical character. The field
 * settles after this one shot; it never idles or loops. */
function entryAnimation(profile: string) {
  switch (profile) {
    case "attraction": return "sb-cel-enter-attract 260ms cubic-bezier(.16,1,.3,1)";
    case "radiate": return "sb-cel-enter-radiate 225ms cubic-bezier(.22,1,.36,1)";
    case "rhythmic-burst": return "sb-cel-enter-burst 270ms cubic-bezier(.22,1,.36,1)";
    case "arrive": return "sb-cel-enter-arrive 280ms cubic-bezier(.16,1,.3,1)";
    case "expand-significance": return "sb-cel-enter-expand 285ms cubic-bezier(.16,1,.3,1)";
    case "surround-hold-stabilize-stay": return "sb-cel-enter-surround 300ms cubic-bezier(.22,1,.36,1)";
    case "reveal": return "sb-cel-enter-reveal 275ms cubic-bezier(.22,1,.36,1)";
    default: return "sb-cel-enter-inspect 290ms cubic-bezier(.22,1,.36,1)";
  }
}

export interface CelestialFieldProps {
  open: boolean;
  /** The viewer's current Resonance on this subject, if any. */
  selected?: ResonanceId | null;
  /** Fires EXACTLY ONCE at COMMIT START. Persist immediately — never wait for SETTLE. */
  onCommit: (id: ResonanceId) => void;
  /** Re-selecting the current Resonance clears it, if the surface allows removal. */
  onRemove?: () => void;
  onCancel: () => void;
  /** Local product progress, supplied by the caller. Never derived from profiling. */
  learningState?: LearningState;
  /** Excludes objects that are wrong for a serious context (Health/Problem Moments). */
  seriousContext?: boolean;
  /** Object art footprint in CSS px. */
  objectSize?: number;
  labelledBy?: string;
}

const PHASE_ORDER: Record<FieldPhase, number> = {
  closed: 0, opening: 1, open: 2, preview: 3, selected: 4, commit: 5, settle: 6, cancel: 7, return: 8,
};

/**
 * MOUNT IS OPEN. The parent owns `open`; a closed field renders nothing and an opening field
 * is a fresh instance, so every open starts from a clean state machine with no stale phase,
 * no stale commit guard and no leftover timer. (It also keeps the component free of
 * refs-during-render and setState-in-effect, both of which the React Compiler rejects.)
 */
export function CelestialField(props: CelestialFieldProps) {
  if (!props.open) return null;
  return <CelestialFieldOpen {...props} />;
}

function CelestialFieldOpen({
  open,
  selected = null,
  onCommit,
  onRemove,
  onCancel,
  learningState = "new",
  seriousContext = false,
  objectSize: objectSizeBase = 56,
  labelledBy,
}: CelestialFieldProps) {
  const { t } = useT();
  const theme = useTheme();
  const reduced = useReducedMotionPref();
  const name = useResonanceName();

  const items = useMemo(() => RESONANCES.filter((r) => !seriousContext || r.seriousContextSafe), [seriousContext]);

  const [phase, setPhase] = useState<FieldPhase>("opening");
  const [active, setActive] = useState<ResonanceId | null>(null);
  const [committing, setCommitting] = useState<ResonanceId | null>(null);
  const [focusIndex, setFocusIndex] = useState(() => Math.max(0, items.findIndex((r) => r.resonanceId === selected)));

  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const minRefs = useRef<(HTMLSpanElement | null)[]>([]);
  /** Guards COMMIT-once. Reset only when the field re-opens. */
  const committedRef = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => { if (settleTimer.current) { clearTimeout(settleTimer.current); settleTimer.current = null; } };

  /* OPENING → OPEN. The only timed hand-off on the entry path. */
  useEffect(() => {
    if (phase !== "opening") return undefined;
    const to = setTimeout(() => setPhase("open"), reduced ? REDUCED_CROSSFADE_S * 1000 : 120);
    return () => clearTimeout(to);
  }, [phase, reduced]);

  /* Focus moves into the field on open; the caller returns focus to the affordance on close. */
  useEffect(() => {
    if (phase === "open") itemRefs.current[focusIndex]?.focus({ preventScroll: true });
    // focusIndex intentionally omitted: this is the ENTRY focus only, not every arrow key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === "open"]);

  useEffect(() => clearTimer, []);

  /* ---------- measured, localization-aware layout ---------- */
  const [layout, setLayout] = useState<ArcLayout | null>(null);
  const [width, setWidth] = useState(0);
  // Derived for RENDER. The layout effect recomputes its own from the measured width, so
  // this value is deliberately not a dependency of that effect.
  const objectSize = objectSizeFor(width || 900, objectSizeBase);
  const perRow = layout?.perRow ?? perRowFor(width || 900);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const el = rootRef.current;
    if (!el) return undefined;
    const measure = () => {
      const w = el.clientWidth;
      if (!w) return;
      const size = objectSizeFor(w, objectSizeBase);
      // Measure what the browser ACTUALLY rendered for this language. getComputedStyle, not
      // getBoundingClientRect — a transform-scaled preview must not corrupt the measurement
      // (the Batch C.1 defect).
      const boxes: ItemBox[] = labelRefs.current.slice(0, items.length).map((n, i) => {
        if (!n) return { w: size, h: 16, minW: size };
        const cs = getComputedStyle(n);
        const twin = minRefs.current[i];
        // min-content twin = the longest unbreakable word in THIS language. The clamped box
        // width cannot reveal it, which is how a Dutch/Russian label overflowed at 390px.
        const minW = twin ? parseFloat(getComputedStyle(twin).width) || 0 : 0;
        return {
          w: Math.max(parseFloat(cs.width) || 0, size),
          h: parseFloat(cs.height) || 16,
          minW: Math.max(minW, size),
        };
      });
      setWidth(w);
      setLayout(layoutArc(boxes, w, size));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  /* objectSize and perRow are derived from the measured width INSIDE this effect; the
     rendered values are deliberately not dependencies (they are this effect's own output). */
  }, [open, items.length, objectSizeBase, learningState, t]);

  /* ---------- commit ---------- */
  const commit = useCallback((id: ResonanceId) => {
    if (committedRef.current) return;             // EXACTLY ONCE
    if (id === selected && onRemove) { committedRef.current = true; onRemove(); onCancel(); return; }
    committedRef.current = true;
    setPhase("commit");
    setCommitting(id);
    onCommit(id);                                  // ← persistence begins HERE, at COMMIT START
    const hold = reduced ? REDUCED_CROSSFADE_S * 1000 : commitMotion(resonanceById(id)!.motionProfile).hold;
    clearTimer();
    settleTimer.current = setTimeout(() => {
      setPhase("settle");
      settleTimer.current = setTimeout(() => { setCommitting(null); onCancel(); }, reduced ? REDUCED_CROSSFADE_S * 1000 : 160);
    }, hold);
  }, [selected, onRemove, onCancel, onCommit, reduced]);

  const cancel = useCallback(() => {
    // Interrupt presentation without ever undoing a commit already persisted.
    committedRef.current = true;
    setPhase("cancel");
    setActive(null);
    clearTimer();
    settleTimer.current = setTimeout(onCancel, REDUCED_CROSSFADE_S * 1000);
  }, [onCancel]);

  /* ---------- keyboard ---------- */
  const onKeyDown = (e: React.KeyboardEvent) => {
    const n = items.length;
    if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); cancel(); return; }
    const move = (d: number) => {
      e.preventDefault();
      const next = (focusIndex + d + n) % n;
      setFocusIndex(next);
      setActive(items[next].resonanceId);
      setPhase((p) => (PHASE_ORDER[p] < PHASE_ORDER.preview ? "preview" : p));
      itemRefs.current[next]?.focus({ preventScroll: true });
    };
    if (e.key === "ArrowRight" || e.key === "ArrowDown") move(1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") move(-1);
    else if (e.key === "Home") move(-focusIndex);
    else if (e.key === "End") move(n - 1 - focusIndex);
  };

  const showEvent = phase === "commit" || phase === "settle";
  /* The readout: one line, always present, so the field never reflows as attention moves. */
  const READOUT_H = 64;
  const h = (layout?.height ?? objectSize * 2.4) + READOUT_H;
  const readoutFor = committing ?? active ?? selected;
  const readoutDef = readoutFor ? resonanceById(readoutFor) : undefined;
  const sky = atmosphere(theme);
  const readoutAccent = readoutDef ? OBJECT_LIGHT[readoutDef.objectKey].accent : "var(--text)";
  /* Labels share one baseline per field while the objects keep their curve. */
  const maxLift = layout ? Math.max(0, ...layout.positions.map((q) => q.lift)) : 0;
  /* The core sits between the horizons, so the orbits pass through the objects rather than
     under them — the constellation reads as one system seen edge-on. */
  const coreY = (layout && layout.horizons.length > 1
    // between the upper row's contact line and the TOP of the lower row's objects — the open
    // gap, so the core never sits behind a planet.
    ? (layout.horizons[0][0].y + (layout.horizons[1][0].y - objectSize)) / 2
    : (h - READOUT_H) * 0.5) + 10;
  /* Seeded on the geometry, so the sky is stable between renders and screenshots. */
  const stars = useMemo(
    () => (width > 0 ? starField(Math.round(width) * 31 + items.length, Math.round((width * h) / 2600), width + 20, h + 20) : []),
    [width, h, items.length],
  );

  /* A small, direct pointer response gives the shared sky depth without a timer, RAF loop,
     or any movement after the person stops attending. Touch and reduced-motion stay still. */
  const setDepth = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType !== "mouse") return;
    const el = rootRef.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    el.style.setProperty("--sb-depth-x", `${(((event.clientX - box.left) / box.width) - .5) * 5}px`);
    el.style.setProperty("--sb-depth-y", `${(((event.clientY - box.top) / box.height) - .5) * 4}px`);
  };
  const clearDepth = () => {
    rootRef.current?.style.setProperty("--sb-depth-x", "0px");
    rootRef.current?.style.setProperty("--sb-depth-y", "0px");
  };

  return (
    <motion.div
      ref={rootRef}
      data-sb-celestial-field
      data-sb-field-phase={phase}
      data-sb-field-mode={layout?.mode ?? "arc"}
      data-sb-reduced-motion={reduced ? "1" : "0"}
      role="radiogroup"
      aria-label={labelledBy ? undefined : t("celestial.field.aria")}
      aria-labelledby={labelledBy}
      onKeyDown={onKeyDown}
      onPointerMove={setDepth}
      onPointerLeave={clearDepth}
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === "closed" || phase === "cancel" ? 0 : 1 }}
      transition={reduced ? reducedTransition : { duration: M2, ease: easeOut }}
      className="sb-celestial-field relative w-full select-none"
      style={{ height: h, minHeight: objectSize * 1.8 }}
    >
      <style>{`@keyframes sb-cel-enter-attract{from{opacity:0;transform:translate(12px,10px) scale(.82)}to{opacity:1;transform:none}}@keyframes sb-cel-enter-radiate{from{opacity:0;transform:scale(.7)}65%{opacity:1;transform:scale(1.08)}to{opacity:1;transform:none}}@keyframes sb-cel-enter-burst{from{opacity:0;transform:translateY(13px) rotate(3deg) scale(.82)}55%{opacity:1;transform:translateY(-2px) rotate(-1deg) scale(1.03)}to{opacity:1;transform:none}}@keyframes sb-cel-enter-arrive{from{opacity:0;transform:translate(20px,11px) scale(.78)}to{opacity:1;transform:none}}@keyframes sb-cel-enter-expand{from{opacity:0;transform:translateY(12px) scale(.72)}to{opacity:1;transform:none}}@keyframes sb-cel-enter-surround{from{opacity:0;transform:translateY(12px) rotate(-5deg) scale(.8)}70%{opacity:1;transform:rotate(1deg) scale(1.03)}to{opacity:1;transform:none}}@keyframes sb-cel-enter-reveal{from{opacity:0;filter:brightness(.6);transform:scale(.94)}to{opacity:1;filter:brightness(1);transform:none}}@keyframes sb-cel-enter-inspect{from{opacity:0;transform:translate(-10px,10px) scale(.8)}55%{opacity:1;transform:translate(2px,-1px) scale(1.03)}to{opacity:1;transform:none}}@keyframes sb-cel-label-arrive{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
      {/* ───────────── THE SKY ─────────────
          The field is a STAGE, not a container: star depth, a nebula haze, orbit traces and a
          luminous basin the objects stand on. All of it is one-shot — it settles and holds.
          Nothing loops, so there is no passive motion to distract from the human content above. */}
      {width > 0 && (
        <motion.div
          aria-hidden
          data-sb-celestial-sky
          className="pointer-events-none absolute overflow-hidden"
          style={{ inset: -10, maskImage: "linear-gradient(transparent,black 12%,black 80%,transparent)", WebkitMaskImage: "linear-gradient(transparent,black 12%,black 80%,transparent)" }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reduced ? reducedTransition : { duration: 0.55, ease: easeOut }}
        >
          <span data-sb-depth-sky className="absolute inset-0">
          {/* deep wash + nebula haze */}
          
          <span className="absolute inset-0" style={{ background: sky.haze }} />
          {/* star depth */}
          <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${width + 20} ${h + 20}`} preserveAspectRatio="none">
            {stars.map((st, i) => (
              <circle key={i} cx={st.x} cy={st.y} r={st.r} fill={sky.star} opacity={st.o} />
            ))}
          </svg>
          {/* ONE ORBITAL SYSTEM. Not a ring per row: a single set of concentric orbits around
              a luminous core, which the objects sit on. That shared geometry is what turns
              eight separate pictures into one constellation. */}
          <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${width + 20} ${h + 20}`} preserveAspectRatio="none">
            <defs>
              <radialGradient id="sb-cel-core">
                <stop offset="0%" stopColor={sky.core} stopOpacity="1" />
                <stop offset="38%" stopColor={sky.core} stopOpacity="0.42" />
                <stop offset="100%" stopColor={sky.core} stopOpacity="0" />
              </radialGradient>
            </defs>
            {[0.42, 0.64].map((k, i) => (
              <ellipse
                key={k}
                cx={(width + 20) / 2}
                cy={coreY}
                rx={(width + 20) * k}
                ry={Math.max(10, (h + 20) * k * 0.25)}
                fill="none"
                stroke={sky.orbit}
                strokeWidth={i === 2 ? 0.9 : 0.65}
                opacity={0.45 - i * 0.15}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          {/* the nebula band the whole system rides on */}
          <span className="absolute inset-0" style={{ background: sky.nebula }} />
          {/* the basin: the luminous floor the horizon sits on */}
          <span className="absolute inset-0" style={{ background: sky.basin }} />
          </span>
        </motion.div>
      )}

      {/* THE HORIZON — the contact line the objects stand on, curving with them. */}
      {layout && layout.mode !== "stack" && width > 0 && (
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${width} ${h}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="sb-celestial-horizon" x1="0" x2="1">
              <stop offset="0" stopColor="currentColor" stopOpacity="0" />
              <stop offset="0.18" stopColor="currentColor" stopOpacity="0.34" />
              <stop offset="0.82" stopColor="currentColor" stopOpacity="0.34" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {layout.horizons.map((pts, i) => (
            <path
              key={i}
              d={pts.length < 2 ? "" : pts.map((q, j) => (j === 0 ? `M ${q.x - 60} ${q.y}` : `L ${q.x} ${q.y}`)).join(" ") + ` L ${pts[pts.length - 1].x + 60} ${pts[pts.length - 1].y}`}
              fill="none"
              stroke="url(#sb-celestial-horizon)"
              strokeWidth="1"
              className="text-text"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      )}
      {items.map((d, i) => {
        const p = layout?.positions[i];
        const isSelected = selected === d.resonanceId;
        const isActive = active === d.resonanceId;
        const isCommitting = committing === d.resonanceId;
        const dim = committing !== null && !isCommitting;
        const pv = previewMotion(d.motionProfile);
        const cm = commitMotion(d.motionProfile);
        const light = OBJECT_LIGHT[d.objectKey];
        const lit = isActive || isSelected || isCommitting;
        /* The object rises out of the horizon as the field opens, in canonical order. */
        return (
          <div
            key={d.resonanceId}
            className="absolute flex flex-col items-center"
            style={{
              left: p ? p.x : "50%",
              top: p ? p.y : 0,
              transform: "translate(-50%, 0)",
              transition: layout && !reduced ? "left 180ms ease-out, top 180ms ease-out" : undefined,
              opacity: layout ? 1 : 0,
            }}
          >
            {/* The object rises out of the horizon in canonical order as the field opens. */}
            <span
              className="flex flex-col items-center"
              style={
                layout && !reduced
                  ? { animation: `${entryAnimation(d.motionProfile)} ${18 + i * 12}ms both` }
                  : undefined
              }
            >
            <button
              ref={(n) => { itemRefs.current[i] = n; }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={i === focusIndex ? 0 : -1}
              data-sb-resonance-item={d.resonanceId}
              data-sb-resonance-state={isCommitting ? "commit" : isSelected ? "selected" : isActive ? "preview" : "rest"}
              aria-label={name(d.resonanceId)}
              onPointerEnter={() => { if (!committing) { setActive(d.resonanceId); setPhase((p2) => (PHASE_ORDER[p2] < PHASE_ORDER.preview ? "preview" : p2)); } }}
              onPointerLeave={() => { if (!committing && active === d.resonanceId) setActive(null); }}
              onFocus={() => { setFocusIndex(i); if (!committing) setActive(d.resonanceId); }}
              onClick={() => commit(d.resonanceId)}
              className="sb-celestial-item relative grid place-items-center rounded-full focus-visible:outline-[var(--focus)]"
              style={{ width: objectSize, height: objectSize, opacity: dim ? 0.3 : 1, transition: `opacity ${reduced ? REDUCED_CROSSFADE_S : 0.22}s linear` }}
            >
              {/* THE AURA — the light this object casts into the field. It is the object's own
                  colour, taken from its master art, and it breathes only on attention. */}
              <span
                aria-hidden
                data-sb-resonance-aura
                className="pointer-events-none absolute"
                style={{
                  width: objectSize * 2.5,
                  height: objectSize * 2.5,
                  background: artifactAura(
                    d.objectKey,
                    light.intensity * (theme === "light" ? 0.45 : 1) * (isCommitting ? 1.5 : lit ? 1 : 0.42),
                  ),
                  opacity: isCommitting ? 1 : lit ? 0.95 : 0.5,
                  transform: reduced ? "none" : `scale(${isCommitting ? 1.1 : lit ? 1 : 0.8})`,
                  transition: reduced
                    ? `opacity ${REDUCED_CROSSFADE_S}s linear`
                    : "opacity 380ms cubic-bezier(.22,1,.36,1), transform 480ms cubic-bezier(.22,1,.36,1), background 380ms linear",
                }}
              />
              {/* the contact glow where the object meets the horizon */}
              <span
                aria-hidden
                className="pointer-events-none absolute"
                style={{
                  width: objectSize * 1.15,
                  height: objectSize * 0.3,
                  top: objectSize * 0.86,
                  borderRadius: "50%",
                  background: `radial-gradient(ellipse at 50% 50%, color-mix(in srgb, ${light.accent} ${lit ? 34 : 16}%, transparent) 0%, transparent 70%)`,
                  filter: "blur(3px)",
                  transition: reduced ? `opacity ${REDUCED_CROSSFADE_S}s linear` : "background 380ms linear",
                }}
              />
              <motion.span
                className="relative block"
                data-sb-object-motion
                style={{ width: objectSize, height: objectSize, willChange: reduced ? "opacity" : "transform, filter" }}
                animate={
                  reduced
                    ? { opacity: 1 }
                    : isCommitting ? cm.animate
                    : isActive ? pv.animate
                    : { scale: 1, x: 0, y: 0, rotate: 0, filter: "brightness(1)" }
                }
                transition={
                  reduced
                    ? reducedTransition
                    : isCommitting ? { duration: cm.duration, times: cm.times, ease: cm.ease ? [...cm.ease] : undefined }
                    : isActive ? { duration: pv.duration, times: pv.times, ease: pv.ease ? [...pv.ease] : undefined }
                    : { duration: 0.24, ease: easeOut }
                }
              >
                {theme === "light" && light.needsNightSky && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ background: nightSky(), borderRadius: "50%" }}
                  />
                )}
                {/* THE OBJECT — feathered, not framed. The masters are square scenes with a baked
                    sky; a rounded tile reads as an app icon, so the edge is dissolved into the
                    field's own atmosphere instead. The streak objects keep a wider feather so
                    the comet's tail and the meteor trails survive. */}
                {/* eslint-disable-next-line @next/next/no-img-element -- local static asset */}
                <img
                  src={masteredAsset(d.objectKey, nightSkyTheme(theme, light.needsNightSky), showEvent && isCommitting ? "event" : "object")}
                  alt=""
                  width={objectSize}
                  height={objectSize}
                  draggable={false}
                  className="block h-full w-full object-cover"
                  style={{
                    filter: objectFilter(theme, light.accent, objectSize, lit, light.intensity),
                    transition: reduced ? `filter ${REDUCED_CROSSFADE_S}s linear` : "filter 380ms cubic-bezier(.22,1,.36,1)",
                  }}
                />
              </motion.span>
              {/* A short reflection anchors each artifact to the shared optical floor.
                  Quiet reflected bodies cast less light than the Sun or the travellers. */}
              <span aria-hidden className="pointer-events-none absolute" style={{
                left: 0, top: objectSize * 0.86, width: objectSize, height: objectSize * 0.24,
                backgroundImage: `url("${masteredAsset(d.objectKey, theme, "object")}")`,
                backgroundSize: "100% 100%", transform: "scaleY(-1)",
                opacity: (theme === "light" ? 0.16 : 0.24) * light.intensity,
                filter: "blur(1px)", maskImage: "linear-gradient(transparent, #000)",
              }} />
              <span aria-hidden className="pointer-events-none absolute rounded-[50%]" style={{
                left: "4%", width: "92%", height: "13%", top: "88%",
                borderBottom: `1px solid color-mix(in srgb, ${light.accent} ${theme === "light" ? 48 : 65}%, transparent)`,
                boxShadow: `0 3px 7px color-mix(in srgb, ${theme === "light" ? "#596576" : light.accent} ${theme === "light" ? 18 : Math.round(23 * light.intensity)}%, transparent)`,
              }} />
              {isSelected && (
                /* THE SEAL RING — a held orbit, in the object's own light, not a UI outline. */
                <span
                  aria-hidden
                  className="pointer-events-none absolute rounded-full"
                  style={{
                    inset: -Math.round(objectSize * 0.16),
                    border: `1px solid color-mix(in srgb, ${light.accent} 70%, transparent)`,
                    boxShadow: `0 0 ${objectSize * 0.34}px color-mix(in srgb, ${light.accent} 40%, transparent), inset 0 0 ${objectSize * 0.2}px color-mix(in srgb, ${light.accent} 22%, transparent)`,
                  }}
                />
              )}
            </button>
            <ResonanceLabel
              ref={(n) => { labelRefs.current[i] = n; }}
              objectName={t(d.objectNameKey)}
              meaning={t(d.meaningKey)}
              learningState={learningState}
              emphasised={isActive || isSelected}
              width={width}
              perRow={perRow}
              objectSize={objectSize}
              minRef={(n) => { minRefs.current[i] = n; }}
              accent={light.accent}
              lit={lit}
              lift={maxLift - (p?.lift ?? 0)}
              entering={layout !== null && !reduced}
              delay={105 + i * 16}
            />
            </span>
          </div>
        );
      })}
      {/* THE READOUT. The canonical phrase belongs to whatever the person is looking at —
          it is the teaching surface, and at LEARNED it is also what keeps the meaning
          recoverable without the per-item labels. */}
      <div
        data-sb-celestial-readout
        data-sb-readout-for={readoutFor ?? ""}
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 bottom-0 text-center"
        style={{ height: READOUT_H }}
      >
        {readoutDef ? (
          <span key={readoutFor} className="sb-celestial-readout inline-flex flex-col items-center leading-tight">
            {learningState === "learned" && (
              <span className="text-[11px] tracking-wide text-text opacity-80">
                {t(readoutDef.objectNameKey)}{" "}
                <span aria-hidden className="opacity-40">·</span>{" "}
                {t(readoutDef.meaningKey)}
              </span>
            )}
            {/* The canonical phrase — the emotional line, lit by the object it belongs to,
                flanked by two small sparks so it reads as an inscription, not a caption. */}
            <span className="inline-flex items-center gap-2.5">
            <Spark accent={readoutAccent} />
            <span
              className="text-[13.5px] leading-snug"
              style={{
                /* Light: ink carrying a breath of the object's own hue (AA-safe at 22%) — the
                   former fixed bronze read as antique print on the pearl ground. */
                color: theme === "light" ? `color-mix(in srgb, ${readoutAccent} 22%, ${RESONATE_INK_SOLAR})` : `color-mix(in srgb, ${readoutAccent} 82%, var(--text))`,
                textShadow: theme === "light" ? "none" : `0 0 18px color-mix(in srgb, ${readoutAccent} 32%, transparent)`,
                letterSpacing: "0.005em",
              }}
            >
              {t(readoutDef.canonicalPhraseKey)}
            </span>
            <Spark accent={readoutAccent} />
            </span>
          </span>
        ) : (
          <span className="text-[12.5px] text-muted opacity-60" style={{ letterSpacing: "0.02em" }}>
            {t("celestial.field.aria")}
          </span>
        )}
      </div>

      <CelestialFieldCloseTrigger available={open && phase !== "cancel"} onActivate={cancel} label={t("celestial.field.close")} />
    </motion.div>
  );
}

/** A four-point star. Small, and only ever beside the canonical phrase. */
function Spark({ accent }: { accent: string }) {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden style={{ opacity: 0.85 }}>
      <path d="M5 0l1.05 3.95L10 5l-3.95 1.05L5 10 3.95 6.05 0 5l3.95-1.05z" fill={accent} />
    </svg>
  );
}

/* ---------------- label ---------------- */

interface LabelProps {
  objectName: string;
  meaning: string;
  learningState: LearningState;
  emphasised: boolean;
  width: number;
  perRow: number;
  objectSize: number;
  minRef: (n: HTMLSpanElement | null) => void;
  accent: string;
  lit: boolean;
  lift: number;
  entering: boolean;
  delay: number;
}

/**
 * OBJECT · MEANING. The bare emotion word is NEVER the identity on its own — all eight meaning
 * words also exist in the Boom vocabulary, so the object always carries the identity
 * (22-OWNER-DECISION-MASCOT-PRESERVED.md §1.3). At LEARNED the label retires and the celestial
 * object/seal identity stands alone — still never the bare word.
 *
 * The PHRASE is not repeated eight times under the horizon; it lives in the shared readout
 * below, where it belongs to whatever the person is actually looking at.
 *
 * Content sizes itself: `max-content` up to a measured cap, then wraps. Never a fixed English
 * width, never clipped — Devanagari and Cyrillic simply take the room they need.
 */
const ResonanceLabel = function ResonanceLabelImpl({
  ref, objectName, meaning, learningState, emphasised, width, perRow, objectSize, minRef, accent, lit, lift, entering, delay,
}: LabelProps & { ref?: React.Ref<HTMLSpanElement> }) {
  const text = (
    <>
      <span data-sb-object-name style={{ display:"block", fontSize:9.5, lineHeight:1.5, textTransform:"uppercase", letterSpacing: "0.07em", opacity: lit ? 0.82 : 0.65, fontWeight: 500 }}>{objectName}</span>
      <span
        style={{
          display:"block", fontSize:12, lineHeight:1.5, fontWeight: 600,
          textShadow: lit ? `0 0 16px color-mix(in srgb, ${accent} 25%, transparent)` : undefined,
        }}
      >
        {meaning}
      </span>
    </>
  );
  if (learningState === "learned") {
    // Measured as zero-width so the layout can pack the objects closer.
    return (
      <>
        <span ref={ref} data-sb-resonance-label data-sb-label-compact="1" className="block h-0 w-0 overflow-hidden" />
        <span ref={minRef} aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden" />
      </>
    );
  }
  return (
    <>
    <span
      ref={ref}
      data-sb-resonance-label
      className="block text-center text-[11px] leading-[1.35] text-text"
      style={{
        marginTop: 8 + lift,
        width: "max-content",
        /* The cap follows the density the layout chose, so for one frame after a density change
           it can be narrower than the longest word in this language. min-content makes that
           frame harmless: a label can never be clipped in ANY state, transient or settled. */
        minWidth: "min-content",
        maxWidth: width ? labelCapFor(width, perRow, objectSize) : 110,
        whiteSpace: "normal",
        overflowWrap: "normal",
        wordBreak: "normal",
        hyphens: "none",
        opacity: emphasised ? 1 : 0.9,
        transition: "opacity 150ms linear",
        animation: entering ? `sb-cel-label-arrive 360ms cubic-bezier(.22,1,.36,1) ${delay}ms both` : undefined,
      }}
    >
      {text}
    </span>
    {/* The min-content twin: invisible, unmeasured by the user, but it is what tells the
        layout the narrowest this label can ever be in the active language. */}
    <span
      ref={minRef}
      aria-hidden
      className="pointer-events-none absolute -z-10 text-[11px] font-medium leading-tight tracking-wide opacity-0"
      style={{ width: "min-content", whiteSpace: "normal", overflowWrap: "normal", wordBreak: "normal", visibility: "hidden", left: -9999, top: 0 }}
    >
      {text}
    </span>
    </>
  );
};

/* ---------------- close trigger ---------------- */

/**
 * CANONICAL REQUIREMENT (Batch C.1, restated in 22-LOCALIZATION-ACCESSIBILITY-CONTRACT.md §2):
 * a hidden control must not remain focusable. When unavailable this is tabindex -1, aria-hidden
 * AND inert — all three, in lockstep with the field's own phase.
 */
export function CelestialFieldCloseTrigger({ available, onActivate, label }: { available: boolean; onActivate: () => void; label: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (available) el.removeAttribute("inert");
    else el.setAttribute("inert", "");
  }, [available]);
  return (
    <button
      ref={ref}
      type="button"
      data-sb-celestial-close
      data-sb-close-available={available ? "1" : "0"}
      tabIndex={available ? 0 : -1}
      aria-hidden={available ? undefined : true}
      onClick={onActivate}
      aria-label={label}
      className="absolute right-0 top-0 grid h-8 w-8 place-items-center rounded-full text-muted transition-opacity hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]"
      style={{ opacity: available ? 1 : 0, pointerEvents: available ? "auto" : "none" }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
    </button>
  );
}
