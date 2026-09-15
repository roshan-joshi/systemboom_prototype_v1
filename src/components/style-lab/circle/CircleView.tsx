"use client";

/**
 * CIRCLE OF LIFE — orchestration. Owns the temporal coordinate, the cursor,
 * URL/history honesty, the zoom direction, the breadcrumb, Jump to date, and
 * the handoff to the Almanac at day resolution.
 *
 * URL: `?c=life | band:2 | age:34 | month:2026-09 | day:2026-09-10` (owner only).
 * Entering pushes a history entry, so Back goes one resolution out; scrubbing
 * the cursor never touches the URL. A refresh rebuilds the same coordinate.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { now } from "@/lib/clock";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { birthInstant } from "@/lib/identity/birth";
import type { Moment, Person } from "../social/data";
import { DateField } from "../social/DateField";
import { CircleDial } from "./CircleDial";
import { DayAlmanac } from "./DayAlmanac";
import { CIRCLE_YEARS_LABEL, Readout } from "./Readout";
import { circleViewFor, coordForDate, dateKey, decodeCoord, encodeCoord, formatDate, LEVEL_NAME, nowIndex, parentCoord, parseDate, type Coord, type Segment } from "./model";

export interface CircleViewProps {
  viewer: Person;
  subject: Person;
  moments: Moment[];
  hidden?: string[];
  /** Whether the URL carries the coordinate (the style-lab page does; an embedded compact use would not). */
  syncUrl?: boolean;
  initialCoord?: Coord;
  onRecordAt?: (date: string) => void;
}

const readUrlCoord = (): Coord => (typeof window === "undefined" ? { level: 0 } : decodeCoord(new URLSearchParams(window.location.search).get("c")));

export function CircleView({ viewer, subject, moments, hidden = [], syncUrl = true, initialCoord, onRecordAt }: CircleViewProps) {
  const reduced = useReducedMotionPref();
  const own = viewer.id === subject.id;
  const [coord, setCoord] = useState<Coord>(initialCoord ?? { level: 0 });
  const [direction, setDirection] = useState<"in" | "out" | "none">("none");
  const [enteredAngle, setEnteredAngle] = useState(0);
  const [hint, setHint] = useState(true);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpMsg, setJumpMsg] = useState<string | null>(null);
  const at = now();
  const dialRef = useRef<HTMLDivElement>(null);

  // A visitor's Circle has one resolution. Any deeper coordinate is refused structurally.
  const view = useMemo(() => circleViewFor(viewer, subject, own ? coord : { level: 0 }, at, moments, hidden), [viewer, subject, own, coord, at, moments, hidden]);
  const context = useMemo(() => (view.level > 0 ? circleViewFor(viewer, subject, parentCoord(view.coord), at, moments, hidden) : undefined), [viewer, subject, view.coord, view.level, at, moments, hidden]);

  // URL → state (initial + back/forward)
  useEffect(() => {
    if (!syncUrl || !own) return;
    const apply = () => {
      const c = readUrlCoord();
      setCoord((prev) => {
        setDirection(c.level > prev.level ? "in" : c.level < prev.level ? "out" : "none");
        return c;
      });
    };
    if (!initialCoord) apply();
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, [syncUrl, own, initialCoord]);

  const writeUrl = useCallback(
    (c: Coord, replace = false) => {
      if (!syncUrl || typeof window === "undefined") return;
      const q = new URLSearchParams(window.location.search);
      if (c.level === 0) q.delete("c");
      else q.set("c", encodeCoord(c));
      const url = `${window.location.pathname}${q.toString() ? `?${q}` : ""}`;
      if (replace) window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    },
    [syncUrl],
  );

  // Per-coordinate UI state, keyed so a new ring starts fresh without an effect:
  // the cursor rests on the present when a ring contains it, else on the first segment.
  const coordKey = encodeCoord(view.coord);
  const [cursorState, setCursorState] = useState<{ key: string; i: number }>({ key: "", i: 0 });
  const [filterState, setFilterState] = useState<{ key: string; kind: string | null }>({ key: "", kind: null });
  const defaultCursor = (() => {
    const i = nowIndex(view);
    return i >= 0 ? i : view.level === 4 ? Math.max(0, parseDate(view.coord.date!).getDate() - 1) : 0;
  })();
  const cursor = cursorState.key === coordKey ? cursorState.i : defaultCursor;
  const setCursor = useCallback((i: number) => setCursorState({ key: coordKey, i }), [coordKey]);
  const [hovered, setHovered] = useState<number | undefined>(undefined);
  const kindFilter = filterState.key === coordKey ? filterState.kind : null;
  const setKindFilter = (kind: string | null) => setFilterState({ key: coordKey, kind });

  const go = useCallback(
    (c: Coord, dir: "in" | "out" | "none", angle = 0) => {
      setEnteredAngle(angle);
      setDirection(dir);
      setCoord(c);
      writeUrl(c);
      // Keep the instrument focused so the keyboard grammar continues.
      requestAnimationFrame(() => dialRef.current?.querySelector<SVGSVGElement>("svg[role=listbox]")?.focus({ preventScroll: true }));
    },
    [writeUrl],
  );

  const enter = useCallback(
    (seg: Segment) => {
      if (!own || !seg.target) return;
      setHint(false);
      go(seg.target, "in", (seg.index / view.segments.length) * 360);
    },
    [own, go, view.segments.length],
  );
  const back = useCallback(() => {
    if (view.level === 0) return;
    go(parentCoord(view.coord), "out");
  }, [view.level, view.coord, go]);

  const jump = (value: string) => {
    setJumpMsg(null);
    if (!value) return;
    const d = parseDate(value);
    const b = birthInstant(subject).at;
    if (d.getTime() > at.getTime()) return setJumpMsg("That date hasn't happened yet.");
    if (d.getTime() < new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()) return setJumpMsg("That date is before this life began.");
    setJumpOpen(false);
    go(coordForDate(value), view.level < 4 ? "in" : "out");
  };

  // The inspect line follows the pointer when it is over the ring, otherwise the cursor.
  const cursorSeg = view.segments[hovered ?? cursor];
  const compact = view.level === 4;
  const birth = birthInstant(subject);
  const minDate = dateKey(birth.at);
  const maxDate = dateKey(at);

  return (
    <div className="sb-circle" data-sb-circle-view data-sb-level={view.level} data-sb-scope={view.scope} data-sb-coord={encodeCoord(view.coord)}>
      {/* ---- the temporal coordinate (breadcrumb) + back ---- */}
      <nav aria-label="Temporal coordinate" className="flex min-h-10 items-center gap-1 text-[13px] tabular-nums" data-sb-crumbs>
        {view.level > 0 && (
          <button type="button" onClick={back} aria-label={`Back to ${LEVEL_NAME[parentCoord(view.coord).level]}`} className="sb-transition -ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]" data-sb-back>
            <ArrowLeft size={16} strokeWidth={1.75} />
          </button>
        )}
        <ol className="flex min-w-0 flex-wrap items-center gap-x-1">
          {/* At LIFE the single crumb would only repeat the Compass; the temporal
              coordinate appears as soon as it says something the Compass cannot. */}
          {(view.crumbs.length > 1 ? view.crumbs : []).map((c, i) => {
            const last = i === view.crumbs.length - 1;
            return (
              <li key={i} className="flex items-center gap-x-1">
                {i > 0 && <span aria-hidden className="text-muted/60">/</span>}
                {last ? (
                  <span aria-current="location" className="font-medium text-text">
                    {c.label}
                  </span>
                ) : (
                  <button type="button" onClick={() => go(c.coord, "out")} className="rounded-full px-1 text-muted hover:text-text focus-visible:outline-[var(--focus)]">
                    {c.label}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
        {own && (
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => setJumpOpen((v) => !v)} aria-expanded={jumpOpen} className="sb-transition inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium text-muted hover:text-text focus-visible:outline-[var(--focus)]" data-sb-jump>
              <CalendarDays size={14} strokeWidth={1.75} aria-hidden /> Jump to date
            </button>
          </div>
        )}
      </nav>
      {jumpOpen && own && (
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-muted" data-sb-jump-panel>
          <DateField value={view.coord.date ?? ""} onChange={jump} max={maxDate} label="Jump to a date in this life" compact />
          <span className="tabular-nums">between {formatDate(birth.at)} and today</span>
          {jumpMsg && <span className="text-[var(--danger)]" role="alert">{jumpMsg}</span>}
          <span className="sr-only">{minDate}</span>
        </div>
      )}

      {/* ---- the instrument ---- */}
      <div className={`relative mt-2 flex ${compact ? "items-start gap-4 @2xl:gap-6" : "flex-col items-center"}`}>
        <motion.div
          ref={dialRef}
          layout={!reduced}
          transition={reduced ? { duration: 0.12 } : { duration: 0.48, ease: [0.32, 0.72, 0, 1] }}
          className={compact ? "w-[132px] shrink-0 @2xl:w-[168px]" : "w-full max-w-[560px] px-5 pt-4 pb-2 @2xl:px-8"}
          data-sb-dial-shell
        >
          <CircleDial view={view} context={context} cursor={cursor} onCursor={setCursor} onHover={setHovered} onEnter={enter} onBack={back} reduced={reduced} direction={direction} enteredAngle={enteredAngle} compact={compact} interactive={own}>
            <Readout view={view} compact={compact} />
          </CircleDial>
        </motion.div>

        {compact ? (
          <div className="min-w-0 flex-1 pt-1" data-sb-day-header>
            <p className="text-[20px] leading-none font-semibold tracking-[0.01em] text-text tabular-nums @2xl:text-[24px]">{view.readout.primary}</p>
            <p className="mt-1.5 text-[13px] text-muted tabular-nums">
              <span className="font-medium text-text">{view.dayAge}</span>
              {view.subject.home && <> · {view.subject.home}</>}
            </p>
            <p className="mt-0.5 text-[12px] text-muted">{view.moments && view.moments.length > 0 ? `${view.moments.length} ${view.moments.length === 1 ? "Moment" : "Moments"} recorded` : "No Moments recorded here."}</p>
          </div>
        ) : (
          <>
            {/* inspect line: what the cursor rests on */}
            <p className="mt-1 min-h-5 text-center text-[13px] text-muted tabular-nums" data-sb-inspect>
              {cursorSeg && view.scope === "owner" ? (
                <>
                  <span className="font-medium text-text">{view.level === 0 ? cursorSeg.label : view.level === 1 ? `Age ${cursorSeg.label}` : cursorSeg.label}</span>
                  {cursorSeg.secondary && <> · {cursorSeg.secondary}</>}
                  {" · "}
                  {cursorSeg.state === "partial" ? (view.level === 3 ? "today" : "partly lived") : cursorSeg.state === "lived" ? "lived" : "unwritten"}
                  {cursorSeg.count !== undefined && cursorSeg.state !== "unwritten" && <> · {cursorSeg.count === 0 ? "no Moments recorded" : `${cursorSeg.count} ${cursorSeg.count === 1 ? "Moment" : "Moments"}`}</>}
                </>
              ) : cursorSeg ? (
                <>
                  <span className="font-medium text-text">{cursorSeg.label}</span> · {cursorSeg.isNow ? "their current band" : cursorSeg.state === "band" ? "lived" : "unwritten"}
                </>
              ) : null}
            </p>
            {own && hint && view.level === 0 && (
              <p className="mt-2 text-[12px] text-muted" data-sb-hint>
                Turn · tap to look closer · Esc to come back
              </p>
            )}
            {!own && (
              <p className="mt-2 max-w-[40ch] text-center text-[12px] text-muted">
                {view.subject.name.split(" ")[0]}&apos;s Circle resolves to the band. Their Moments are in{" "}
                <Link href={`/style-lab/social?viewer=visitor`} className="underline-offset-2 hover:underline">
                  Social
                </Link>
                .
              </p>
            )}
          </>
        )}
      </div>

      {/* ---- day resolution: the Almanac ---- */}
      <AnimatePresence initial={false}>
        {compact && view.moments && (
          <motion.div key={view.coord.date} initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={reduced ? { duration: 0.12 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0.18 }} className="mt-4">
            <DayAlmanac date={view.coord.date!} moments={view.moments} kindFilter={kindFilter} onKindFilter={setKindFilter} own={own} onRecord={onRecordAt ? () => onRecordAt(view.coord.date!) : undefined} />
          </motion.div>
        )}
      </AnimatePresence>
      <span className="sr-only">{CIRCLE_YEARS_LABEL}</span>
    </div>
  );
}
