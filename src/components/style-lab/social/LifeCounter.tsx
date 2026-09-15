"use client";

/**
 * MY LIFE IN — the number is the control.
 *
 * Default face: Y/M/D over the hourglass over H/M/S, unit-coloured (red =
 * years, the unit that decides the band; navy = months; grey = days) and
 * ticking live. Tapping the number — or the unit word beneath it, which is
 * the real, focusable control — cycles single-unit totals: years · months ·
 * weeks · days · hours · minutes · seconds · milliseconds. Digits roll like
 * a mechanical counter (≤300ms, ease-out); under reduced motion nothing
 * finer than seconds animates but every value still updates.
 *
 * Honesty rule: when the birth time is unknown the instrument has fewer
 * stops — it ends at days. Nothing is greyed out or labelled unavailable.
 */

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { now } from "@/lib/clock";
import type { BirthTruth } from "@/lib/identity/birth";
import type { OwnerLife } from "./view-model";
import { availableUnits, compositeFace, digitSize, formatInt, nextRoundDays, pad2, unitTotal, UNIT_TICK_MS, type Unit } from "./life";

const UNIT_COLOUR: Record<Unit, string> = {
  years: "var(--boom)",
  months: "var(--navy)",
  weeks: "var(--navy)",
  days: "var(--unit-grey)",
  hours: "var(--boom)",
  minutes: "var(--navy)",
  seconds: "var(--unit-grey)",
};

/**
 * A run of characters. Each position is keyed by its character, so a changed
 * digit remounts and its mount animation is the roll; unchanged digits keep
 * their element and stay still. No previous-value bookkeeping is needed.
 */
function Rolling({ text, color, fontSize, animate }: { text: string; color?: string; fontSize: number; animate: boolean }) {
  return (
    <span className="inline-flex tabular-nums" style={{ color, fontSize, lineHeight: 1 }} aria-hidden>
      {[...text].map((ch, i) => (
        <span key={`${i}-${ch}`} className={`inline-block ${animate ? "sb-roll" : ""}`} style={{ minWidth: /\d/.test(ch) ? "0.62em" : undefined, textAlign: "center" }}>
          {ch}
        </span>
      ))}
    </span>
  );
}

const subscribeNoop = () => () => {};

export function LifeCounter({ life, scale = "module", showNextRound = false, className = "" }: { life: OwnerLife; scale?: "module" | "hero" | "inline"; showNextRound?: boolean; className?: string }) {
  // Only an owner's own life ever reaches this instrument (OwnerLife carries the birth truth).
  const person = life.birth;
  const reduced = useReducedMotionPref();
  // The counter is time: the server and the client never agree on the seconds,
  // so the digits render only after mount (a fixed-width placeholder before).
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const units = useMemo(() => availableUnits(person), [person]);
  /** -1 = the composite face; otherwise an index into `units`. */
  const [face, setFace] = useState(-1);
  const [tick, setTick] = useState(() => now());
  const [announce, setAnnounce] = useState("");
  const unit: Unit | null = face >= 0 ? units[face] : null;

  // Tick at the true cadence of what is shown (1s for the composite face).
  useEffect(() => {
    const ms = unit ? UNIT_TICK_MS[unit] : 1000;
    const id = setInterval(() => setTick(now()), ms);
    return () => clearInterval(id);
  }, [unit]);

  const cycle = useCallback(
    (dir: 1 | -1) => {
      setFace((f) => {
        const n = f + dir;
        const next = n >= units.length ? -1 : n < -1 ? units.length - 1 : n;
        const label = next === -1 ? "years, months, days" : units[next];
        setAnnounce(`Showing ${label}.`);
        return next;
      });
    },
    [units],
  );

  const s = scale === "module" ? 1 : scale === "hero" ? 0.68 : 0.5;
  const animate = !reduced || unit !== "seconds";
  const precision = life.precision;
  const f = compositeFace(person, tick);
  const round = nextRoundDays(f.totalDays);

  if (!mounted) {
    return (
      <div className={`flex flex-col items-center ${className}`} data-sb-counter aria-busy="true" style={{ minHeight: scale === "module" ? 150 : 96 }}>
        <span className="mt-2 text-muted" style={{ fontSize: 44 * s, lineHeight: 1 }} aria-hidden>––</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`} data-sb-counter data-sb-counter-face={unit ?? "composite"} data-sb-counter-units={units.join(",")} data-sb-reduced={reduced ? "true" : "false"}>
      <button
        type="button"
        onClick={() => cycle(1)}
        aria-label={unit ? `Life in ${unit}. Tap to change unit.` : "Life in years, months and days. Tap to change unit."}
        className="group rounded-2xl px-2 py-1 text-center outline-none focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
      >
        {unit === null ? (
          <span className="flex flex-col items-center gap-1">
            <span className="flex items-end gap-[0.35em]" style={{ fontSize: 44 * s }}>
              <UnitPart n={f.years} u="y" color={UNIT_COLOUR.years} size={44 * s} animate={animate} />
              <UnitPart n={f.months} u="m" color={UNIT_COLOUR.months} size={44 * s} animate={animate} pad />
              <UnitPart n={f.days} u="d" color={UNIT_COLOUR.days} size={44 * s} animate={animate} pad />
            </span>
            {precision === "minute" && f.hours !== null && f.minutes !== null && f.seconds !== null ? (
              <>
                <span aria-hidden className="my-1 flex items-center gap-2 text-muted">
                  <span className="h-px w-8 bg-[var(--hair)]" />
                  <Hourglass size={14 * s + 4} />
                  <span className="h-px w-8 bg-[var(--hair)]" />
                </span>
                <span className="flex items-end gap-[0.35em]" style={{ fontSize: 30 * s }}>
                  <UnitPart n={f.hours} u="h" color={UNIT_COLOUR.hours} size={30 * s} animate={animate} pad />
                  <UnitPart n={f.minutes} u="m" color={UNIT_COLOUR.minutes} size={30 * s} animate={animate} pad />
                  <UnitPart n={f.seconds} u="s" color={UNIT_COLOUR.seconds} size={30 * s} animate={animate && !reduced} pad />
                </span>
              </>
            ) : (
              <span className="mt-1 text-[12px] text-muted">counted in days</span>
            )}
          </span>
        ) : (
          <SingleUnit person={person} unit={unit} at={tick} scale={s} animate={animate} />
        )}
      </button>

      {/* the visible, accessible control — nothing else lives under the number */}
      <div className="mt-1 flex items-center">
        <button
          type="button"
          onClick={() => cycle(1)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              cycle(1);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              cycle(-1);
            }
          }}
          aria-label={`Unit: ${unit ?? "years, months, days"}. Change unit`}
          className="group relative inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium tracking-[0.02em] text-muted hover:text-text focus-visible:outline-[var(--focus)]"
        >
          <span>{unit ?? "years · months · days"}</span>
          <span aria-hidden className="text-[10px] opacity-60">▾</span>
          <span aria-hidden className="pointer-events-none absolute top-full left-1/2 mt-0.5 -translate-x-1/2 whitespace-nowrap text-[11px] text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            change unit
          </span>
        </button>
      </div>

      {showNextRound && scale === "module" && (
        <p className="mt-4 text-[12px] text-muted tabular-nums">
          Your {formatInt(round.target)}
          <sup>th</sup> day is in {formatInt(round.inDays)} days
        </p>
      )}
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
      <span className="sr-only">{unit ? `${formatInt(unitTotal(person, tick, unit))} ${unit}` : `${f.years} years ${f.months} months ${f.days} days`}</span>
    </div>
  );
}

function UnitPart({ n, u, color, size, animate, pad = false }: { n: number; u: string; color: string; size: number; animate: boolean; pad?: boolean }) {
  return (
    <span className="inline-flex items-baseline">
      <Rolling text={pad ? pad2(n) : String(n)} color={color} fontSize={size} animate={animate} />
      <span className="ml-[0.08em] font-medium text-muted" style={{ fontSize: size * 0.36 }} aria-hidden>
        {u}
      </span>
    </span>
  );
}

function SingleUnit({ person, unit, at, scale, animate }: { person: BirthTruth; unit: Unit; at: Date; scale: number; animate: boolean }) {
  const text = formatInt(unitTotal(person, at, unit));
  const size = digitSize(text) * scale;
  return (
    <span className="flex flex-col items-center">
      <Rolling text={text} color={UNIT_COLOUR[unit]} fontSize={size} animate={animate} />
    </span>
  );
}

export function Hourglass({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden className="text-[var(--boom)]">
      <path d="M4 1.5h8M4 14.5h8M5 2v2.2c0 1 .5 1.8 1.3 2.4L8 8l-1.7 1.4C5.5 10 5 10.8 5 11.8V14M11 2v2.2c0 1-.5 1.8-1.3 2.4L8 8l1.7 1.4c.8.6 1.3 1.4 1.3 2.4V14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6.2 12.5h3.6L8 10.8z" fill="currentColor" />
    </svg>
  );
}
