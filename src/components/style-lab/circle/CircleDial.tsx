"use client";

/**
 * CIRCLE OF LIFE — the dial renderer.
 *
 * One SVG instrument at every resolution: segments on a main ring, the parent
 * level as a quiet inner context ring, a precise red present boundary, and a
 * cursor that TURNs through siblings. TAP enters; BACK (Escape / context ring /
 * breadcrumb) goes outward. The same grammar at every level.
 *
 * The signature motion — ZOOM THROUGH TIME — is one orchestrated transformation:
 * the leaving ring rotates the chosen segment to 12 o'clock while it recedes to
 * the context radius; the arriving ring grows from that radius. Under reduced
 * motion: a short crossfade, same hierarchy.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { angleOf, arcPath, polar, segmentAngles } from "./geometry";
import type { CircleView, Segment } from "./model";

export const VB = 400;
const C = VB / 2;
const R_MAIN = 156;
const R_CONTEXT = 112;
const STROKE: Record<number, number> = { 0: 28, 1: 24, 2: 24, 3: 18, 4: 18 };
const GAP_PX: Record<number, number> = { 0: 5, 1: 4, 2: 4, 3: 3, 4: 3 };
const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

export interface DialProps {
  view: CircleView;
  /** Parent ring drawn as quiet context (undefined at LIFE). */
  context?: CircleView;
  /** Index of the segment the cursor rests on. */
  cursor: number;
  onCursor: (i: number) => void;
  /** Desktop inspect: the segment under the pointer (undefined when none). */
  onHover?: (i: number | undefined) => void;
  onEnter: (seg: Segment) => void;
  onBack: () => void;
  reduced: boolean;
  /** Direction of the last resolution change, for the zoom motion. */
  direction: "in" | "out" | "none";
  /** Angle (on the previous ring) of the segment that was entered, so the leaving ring can rotate it to 12. */
  enteredAngle?: number;
  /** Compact mode (day level): the dial shrinks and stops being the primary object. */
  compact?: boolean;
  /** Owner may look closer; visitors turn but cannot enter. */
  interactive: boolean;
  className?: string;
  children?: React.ReactNode;
}

/** ONE density signal: the depth (opacity) of lived material. Floor 0.42 so lived time always reads against the unwritten. */
const density = (count: number | undefined, max: number) => (count === undefined || max === 0 ? 0.42 : 0.42 + 0.58 * Math.min(1, count / max));
/** Unwritten time has less material: a thinner, quieter arc. Not a colour — a depth. */
const UNWRITTEN = { opacity: 0.2, width: 0.72 };

function Ring({ view, r, stroke, gapPx, cursor, hovered, showLabels, dim = false, id, unit = 1 }: { view: CircleView; r: number; stroke: number; gapPx: number; cursor?: number; hovered?: number; showLabels: boolean; dim?: boolean; id?: string; unit?: number }) {
  // Quiet context (the level above): the segment we are inside keeps its material; its siblings recede. No outlines.
  const contextOpacity = (i: number) => (dim ? (cursor === i ? 1 : 0.32) : 1);
  const n = view.segments.length;
  const angles = useMemo(() => segmentAngles(n, r, gapPx), [n, r, gapPx]);
  // Labels keep a constant on-screen size: `unit` is viewBox units per CSS pixel.
  const fs = (view.level === 3 || view.level === 4 ? 10.5 : 11.5) * unit;
  const labelR = r + stroke / 2 + 8 + fs * 0.55;
  const labelEvery = n > 16 ? 5 : 1;
  return (
    <g data-sb-ring-level={view.level} opacity={dim ? 0.6 : 1}>
      {view.segments.map((s, i) => {
        const { a0, a1, mid } = angles[i];
        const parts: React.ReactNode[] = [];
        const op = density(s.count, view.maxCount);
        if (s.state === "lived" || s.state === "band") {
          parts.push(<path key="l" d={arcPath(C, C, r, a0, a1)} fill="none" stroke="var(--ice)" strokeOpacity={s.state === "band" && s.isNow ? op * 0.7 : op} strokeWidth={stroke} strokeLinecap="butt" />);
        } else if (s.state === "unwritten") {
          parts.push(<path key="u" d={arcPath(C, C, r, a0, a1)} fill="none" stroke="var(--steel)" strokeOpacity={UNWRITTEN.opacity} strokeWidth={stroke * UNWRITTEN.width} />);
        } else {
          const split = a0 + (a1 - a0) * s.lived;
          if (split > a0 + 0.01) parts.push(<path key="l" d={arcPath(C, C, r, a0, split)} fill="none" stroke="var(--ice)" strokeOpacity={op} strokeWidth={stroke} />);
          if (a1 > split + 0.01) parts.push(<path key="u" d={arcPath(C, C, r, split, a1)} fill="none" stroke="var(--steel)" strokeOpacity={UNWRITTEN.opacity} strokeWidth={stroke * UNWRITTEN.width} />);
        }
        const isCursor = cursor === i;
        const isHover = hovered === i;
        const showLabel = showLabels && (labelEvery === 1 || i % labelEvery === 0 || i === n - 1 || isCursor || s.isNow);
        const [lx, ly] = polar(C, C, labelR, view.level === 0 ? a0 - 1 : mid);
        return (
          <g key={s.key} id={id ? `${id}-${i}` : undefined} role={id ? "option" : undefined} aria-selected={id ? isCursor : undefined} aria-disabled={id && !s.enterable ? true : undefined} aria-label={id ? s.name : undefined} data-sb-seg={s.key} data-sb-seg-state={s.state} data-sb-seg-count={s.count ?? ""} data-sb-seg-lived={s.lived.toFixed(3)} opacity={contextOpacity(i)}>
            {parts}
            {!dim && (isCursor || isHover) && <path d={arcPath(C, C, r + stroke / 2 + 4, a0, a1)} fill="none" stroke="var(--text)" strokeOpacity={isCursor ? 0.7 : 0.35} strokeWidth={1.25} data-sb-cursor-mark={isCursor ? "cursor" : "hover"} />}
            {showLabel && (
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize={fs} fontWeight={isCursor || s.isNow ? 600 : 500} fill={isCursor ? "var(--text)" : "var(--muted)"} className="tabular-nums" style={{ fontVariantNumeric: "tabular-nums" }} aria-hidden>
                {view.level === 0 ? `${i * 15}` : s.label}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function NowTick({ angle, r, stroke }: { angle: number; r: number; stroke: number }) {
  const len = stroke + 10;
  return <rect x={C - 1.25} y={C - r - stroke / 2 - 5} width={2.5} height={len} rx={1} fill="var(--boom)" transform={`rotate(${angle} ${C} ${C})`} data-sb-now-tick={angle.toFixed(2)} />;
}

export function CircleDial({ view, context, cursor, onCursor, onHover, onEnter, onBack, reduced, direction, enteredAngle = 0, compact = false, interactive, className = "", children }: DialProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const id = useId().replace(/:/g, "");
  const [hovered, setHovered] = useState<number | undefined>();
  // Focus ring only for keyboard users; the dial is focused programmatically after a tap so the grammar continues.
  const [kbd, setKbd] = useState(false);
  // viewBox units per CSS pixel, so labels keep a readable on-screen size at 360px and at 560px alike.
  const [unit, setUnit] = useState(1);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width;
      if (w > 0) setUnit(VB / w);
    });
    ro.observe(svg);
    return () => ro.disconnect();
  }, []);
  const n = view.segments.length;
  const stroke = STROKE[view.level];
  const angles = useMemo(() => segmentAngles(n, R_MAIN, GAP_PX[view.level]), [n, view.level]);
  const drag = useRef<{ x: number; y: number; moved: boolean; last: number } | null>(null);
  // Keyboard turns can arrive faster than a render; act on the latest cursor, never a stale closure.
  const cursorRef = useRef(cursor);
  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);
  const turn = (i: number) => {
    cursorRef.current = i;
    onCursor(i);
  };

  const indexAt = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return -1;
      const b = svg.getBoundingClientRect();
      const x = ((clientX - b.left) / b.width) * VB;
      const y = ((clientY - b.top) / b.height) * VB;
      const dist = Math.hypot(x - C, y - C);
      if (dist < R_CONTEXT - 24 && !compact) return -2; // the centre: not a segment
      const a = angleOf(C, C, x, y);
      return Math.min(n - 1, Math.floor((a / 360) * n));
    },
    [n, compact],
  );

  const buzz = () => {
    try {
      (navigator as Navigator & { vibrate?: (p: number) => boolean }).vibrate?.(4);
    } catch {
      /* progressive enhancement only */
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setKbd(false);
    if (compact) return;
    const i = indexAt(e.clientX, e.clientY);
    if (i === -2) return;
    drag.current = { x: e.clientX, y: e.clientY, moved: false, last: i };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    svgRef.current?.focus({ preventScroll: true });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) {
      if (!compact) {
        const h = indexAt(e.clientX, e.clientY);
        const next = h >= 0 ? h : undefined;
        if (next !== hovered) {
          setHovered(next);
          onHover?.(next);
        }
      }
      return;
    }
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) d.moved = true;
    const i = indexAt(e.clientX, e.clientY);
    if (i >= 0 && i !== d.last) {
      d.last = i;
      onCursor(i); // TURN: the cursor snaps to whole segments
      buzz();
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const i = indexAt(e.clientX, e.clientY);
    if (i < 0) return;
    if (!d.moved) {
      // TAP: enter the segment under the finger (owner) — one gesture, at every level.
      onCursor(i);
      const s = view.segments[i];
      if (interactive && s.enterable) onEnter(s);
    }
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") return;
    setKbd(true);
    const c = cursorRef.current;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      turn((c + 1) % n);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      turn((c - 1 + n) % n);
    } else if (e.key === "Home") {
      e.preventDefault();
      turn(0);
    } else if (e.key === "End") {
      e.preventDefault();
      turn(n - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const s = view.segments[c];
      if (interactive && s?.enterable) onEnter(s);
    } else if (e.key === "Escape" || e.key === "Backspace") {
      if (view.level > 0) {
        e.preventDefault();
        onBack();
      }
    }
  };
  // Wheel scrubs siblings only while the dial is intentionally focused — never hijacks page scroll.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      if (document.activeElement !== svg) return;
      e.preventDefault();
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(delta) < 2) return;
      onCursor((cursor + (delta > 0 ? 1 : -1) + n) % n);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [cursor, n, onCursor]);

  const seg = view.segments[cursor];
  const listLabel = view.scope === "other" ? `${view.subject.name}'s life, band resolution` : view.level === 0 ? "Your life, ten bands of fifteen years" : `${view.readout.primary}, ${n} ${view.level === 1 ? "years" : view.level === 2 ? "months" : "days"}`;

  const t = reduced ? { duration: 0.12 } : { duration: 0.48, ease: EASE };
  const origin = { transformOrigin: `${C}px ${C}px`, transformBox: "view-box" as const };

  return (
    <div className={`relative ${className}`} data-sb-dial data-sb-dial-level={view.level} data-sb-dial-scope={view.scope}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB} ${VB}`}
        role="listbox"
        tabIndex={0}
        aria-label={listLabel}
        aria-activedescendant={`${id}-${cursor}`}
        aria-describedby={`${id}-desc`}
        className="block h-auto w-full touch-none select-none"
        style={{ overflow: "visible", outline: "none" }}
        onKeyUp={(e) => { if (e.key === "Tab") setKbd(true); }}
        onBlur={() => setKbd(false)}
        data-sb-kbd={kbd ? "" : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
        onPointerLeave={() => { setHovered(undefined); onHover?.(undefined); }}
        onKeyDown={onKeyDown}
      >
        <desc id={`${id}-desc`}>Turn with the arrow keys, Enter to look closer, Escape to go out.</desc>
        {/* focus ring for the whole instrument */}
        {kbd && <circle cx={C} cy={C} r={R_MAIN + stroke / 2 + 26 * unit} fill="none" stroke="var(--focus)" strokeWidth={2 * unit} pointerEvents="none" data-sb-focus-ring />}

        {/* the parent level as quiet context — also the way back */}
        {context && !compact && (
          <motion.g key={`ctx-${view.level}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={reduced ? { duration: 0.12 } : { duration: 0.32, delay: 0.16, ease: EASE }} onClick={onBack} className="cursor-pointer" role="presentation" data-sb-context-ring>
            <Ring view={context} r={R_CONTEXT} stroke={3} gapPx={2} showLabels={false} dim cursor={context.segments.findIndex((s) => s.target && matches(s, view))} unit={unit} />
          </motion.g>
        )}

        <AnimatePresence initial={false} mode="popLayout">
          <motion.g
            key={`ring-${view.level}-${view.coord.band ?? ""}-${view.coord.age ?? ""}-${view.coord.ym ?? ""}`}
            style={origin}
            initial={direction === "none" ? false : reduced ? { opacity: 0 } : direction === "in" ? { scale: R_CONTEXT / R_MAIN, opacity: 0, rotate: 0 } : { scale: 1.18, opacity: 0, rotate: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={reduced ? { opacity: 0 } : direction === "in" ? { scale: R_CONTEXT / R_MAIN, opacity: 0, rotate: -enteredAngle } : { scale: 1.18, opacity: 0 }}
            transition={t}
          >
            <Ring view={view} r={R_MAIN} stroke={stroke} gapPx={GAP_PX[view.level]} cursor={cursor} hovered={hovered} showLabels={!compact} id={id} unit={unit} />
            {view.nowAngle !== undefined && <NowTick angle={view.nowAngle} r={R_MAIN} stroke={stroke} />}
            {/* generous, invisible hit arcs so no one has to aim at a thin wedge */}
            {!compact &&
              view.segments.map((s, i) => (
                <path key={`hit-${s.key}`} d={arcPath(C, C, R_MAIN, angles[i].a0, angles[i].a1)} fill="none" stroke="transparent" strokeWidth={stroke + 22} pointerEvents="stroke" className={interactive && s.enterable ? "cursor-pointer" : "cursor-default"} aria-hidden />
              ))}
          </motion.g>
        </AnimatePresence>
      </svg>
      {/* centre readout (HTML for typography) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="pointer-events-auto text-center" style={{ width: compact ? "60%" : "52%" }}>
          {children}
        </div>
      </div>
      {/* live region: what the cursor rests on */}
      <p className="sr-only" aria-live="polite" data-sb-dial-live>
        {seg ? `${seg.name}${seg.enterable && interactive ? ". Enter to look closer." : ""}` : ""}
      </p>
    </div>
  );
}

/** Does the context segment lead to the ring currently shown? */
function matches(s: Segment, view: CircleView): boolean {
  const t = s.target;
  if (!t) return false;
  if (t.level === 1) return t.band === view.coord.band;
  if (t.level === 2) return t.age === view.coord.age;
  if (t.level === 3) return t.ym === view.coord.ym;
  if (t.level === 4) return t.date === view.coord.date;
  return false;
}
