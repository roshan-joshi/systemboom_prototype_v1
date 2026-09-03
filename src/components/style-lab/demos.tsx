"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, ChevronRight, MapPin } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Pill, Skeleton } from "@/components/ui/bits";
import { PrimaryAction, SecondaryAction } from "@/components/ui/actions";
import { demoUser } from "@/lib/mock/demo-user";
import {
  CIRCLE_BANDS,
  computeLifeTime,
  currentBandIndex,
  parseBirthInstant,
  type LifeTime,
} from "@/lib/life-time";
import { M2, M3, easeOut, easeSpatial } from "@/lib/motion";
import { now } from "@/lib/clock";

/* ============================================================
   IDENTITY MINI — seed of the future Identity Horizon
   ============================================================ */

export function IdentityMini({ life }: { life: LifeTime | null }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-edge">
      <div className="relative h-44 sm:h-56">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={demoUser.cover}
          alt="Cover — dusk over Himalayan ridgelines (placeholder artwork)"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--content)] to-transparent" />
      </div>
      <div className="material-content -mt-px flex flex-col gap-4 border-0 px-5 pb-6 sm:px-7">
        <div className="-mt-10 flex items-end gap-4">
          <Avatar src={demoUser.avatar} name={demoUser.name} size="xl" ring />
          <div className="pb-1">
            <h3 className="type-section">{demoUser.name}</h3>
            <p className="type-meta flex items-center gap-1.5">
              <MapPin size={13} strokeWidth={1.75} /> {demoUser.location}
            </p>
          </div>
        </div>
        <p className="type-body max-w-md text-muted">{demoUser.bio}</p>
        <div className="flex flex-wrap items-center gap-2.5">
          <Pill>
            <CalendarDays size={14} strokeWidth={1.75} />
            {life
              ? `${life.years}y · ${life.months}m · ${life.days}d`
              : "— · — · —"}
          </Pill>
          <Pill boom>NOW</Pill>
          <span className="type-meta">Life Counter · calculated from date of birth</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   LIFE COUNTER — static treatment (live ticking arrives later)
   ============================================================ */

export function LifeCounterDemo({ life }: { life: LifeTime | null }) {
  const bandIdx = life ? currentBandIndex(life.years) : 2;

  const cells = life
    ? ([
        ["Years", life.years],
        ["Months", life.months],
        ["Days", life.days],
        ["Hours", life.hours],
        ["Minutes", life.minutes],
        ["Seconds", life.seconds],
      ] as const)
    : null;

  return (
    <div className="material-content flex flex-col gap-6 rounded-3xl p-6 sm:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <p className="type-label">Your life · time lived</p>
        <span className="type-meta">Static treatment — ticks live in a later phase</span>
      </div>

      {life && cells ? (
        <>
          <p className="type-counter text-4xl font-medium tracking-tight sm:text-5xl">
            {life.years}
            <span className="text-steel">y</span> · {life.months}
            <span className="text-steel">m</span> · {life.days}
            <span className="text-steel">d</span>
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {cells.map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-edge bg-surface px-3 py-3 text-center"
              >
                <p className="type-counter text-xl">{value}</p>
                <p className="type-meta text-xs tracking-wide uppercase">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className="type-meta">
              <strong className="type-counter text-text">
                {life.totalDays.toLocaleString()}
              </strong>{" "}
              days lived
            </p>
            <p className="type-meta">
              Born 4 Nov 1991 · 06:42 · {demoUser.location.split(",")[0]}
            </p>
            <p className="type-meta">
              Circle band{" "}
              <span className="font-semibold text-boom-strong">
                {CIRCLE_BANDS[bandIdx]}
              </span>
            </p>
            <span className="type-meta inline-flex items-center gap-1 rounded-full border border-edge px-3 py-1">
              View in Circle <ChevronRight size={13} /> prototype
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}
    </div>
  );
}

/* ============================================================
   CIRCLE SAMPLE — visual language only, NOT the functional Circle
   ============================================================ */

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polar(cx, cy, r, start);
  const e = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

export function CircleSample({ life }: { life: LifeTime | null }) {
  const ageYears = life ? life.years + life.months / 12 : 34.8;
  const bandIdx = currentBandIndex(Math.floor(ageYears));
  const C = 130;
  const R = 100;
  const gap = 5; // degrees between bands
  const span = 360 / CIRCLE_BANDS.length;

  const nowFraction = Math.min((ageYears - bandIdx * 15) / 15, 1);
  const nowAngle = bandIdx * span + gap / 2 + (span - gap) * nowFraction;
  const nowPoint = polar(C, C, R, nowAngle);

  return (
    <div className="material-content flex flex-col items-center gap-5 rounded-3xl p-6 sm:flex-row sm:gap-10 sm:p-8">
      <svg
        viewBox="0 0 260 260"
        className="w-56 max-w-full shrink-0 sm:w-64"
        role="img"
        aria-label={`Circle of Life sample: eight 15-year bands from birth to 105+, current band ${CIRCLE_BANDS[bandIdx]}`}
      >
        {CIRCLE_BANDS.map((band, i) => {
          const start = i * span + gap / 2;
          const end = (i + 1) * span - gap / 2;
          const isCurrent = i === bandIdx;
          const isPast = i < bandIdx;
          return (
            <path
              key={band}
              d={arcPath(C, C, R, start, end)}
              fill="none"
              stroke={
                isCurrent ? "var(--boom)" : isPast ? "var(--steel)" : "var(--edge)"
              }
              strokeOpacity={isCurrent ? 1 : isPast ? 0.75 : 1}
              strokeWidth={isCurrent ? 11 : 8}
              strokeLinecap="round"
            />
          );
        })}
        {/* NOW marker */}
        <circle cx={nowPoint.x} cy={nowPoint.y} r={7} fill="var(--boom)" />
        <circle
          cx={nowPoint.x}
          cy={nowPoint.y}
          r={11.5}
          fill="none"
          stroke="var(--boom)"
          strokeOpacity={0.35}
          strokeWidth={2}
        />
        {/* Birth marker at top */}
        <circle cx={C} cy={C - R} r={3} fill="var(--ice)" />
        <text
          x={C}
          y={C - 8}
          textAnchor="middle"
          fill="var(--text)"
          fontSize="22"
          fontWeight="600"
          fontFamily="var(--font-geist-sans)"
        >
          {CIRCLE_BANDS[bandIdx]}
        </text>
        <text
          x={C}
          y={C + 16}
          textAnchor="middle"
          fill="var(--boom-strong)"
          fontSize="11"
          fontWeight="700"
          letterSpacing="2"
          fontFamily="var(--font-geist-sans)"
        >
          NOW
        </text>
      </svg>

      <div className="flex max-w-sm flex-col gap-3">
        <p className="type-label">Circle of Life · visual language sample</p>
        <p className="type-body text-muted">
          Birth sits at the top. Fifteen-year bands run clockwise toward 105+.
          Lived time renders in steel, the future stays faint, and Boom red
          marks exactly one thing: <strong className="text-text">now</strong>.
        </p>
        <p className="type-meta">
          Not the functional Circle — interaction, zoom levels and data density
          arrive in their own phase.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   MOTION STUDIES — press, selection, panel reveal, spatial
   ============================================================ */

const REACTIONS = [
  { key: "love", glyph: "❤️", label: "Love" },
  { key: "laugh", glyph: "😂", label: "Laugh" },
  { key: "wow", glyph: "😮", label: "Wow" },
  { key: "fire", glyph: "🔥", label: "Fire" },
  { key: "clap", glyph: "👏", label: "Clap" },
  { key: "sad", glyph: "😢", label: "Sad" },
] as const;

export function MotionStudies() {
  const [reaction, setReaction] = useState<string | null>("fire");
  const [panelOpen, setPanelOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Press + selection */}
      <div className="material-content flex flex-col gap-6 rounded-3xl p-6 sm:p-7">
        <div>
          <p className="type-label mb-1">M1 · Feedback — press &amp; reaction selection</p>
          <p className="type-meta">
            Tap targets acknowledge instantly. Red appears only on the chosen
            reaction.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Reactions">
          {REACTIONS.map((r) => {
            const active = reaction === r.key;
            return (
              <motion.button
                key={r.key}
                whileTap={{ scale: 0.88 }}
                transition={{ duration: 0.14, ease: easeOut }}
                onClick={() => setReaction(active ? null : r.key)}
                aria-pressed={active}
                aria-label={r.label}
                className={`sb-transition inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border px-3 text-lg transition-[border-color,background] ${
                  active
                    ? "border-boom bg-boom/12"
                    : "border-edge bg-surface hover:border-steel/50"
                }`}
              >
                <span aria-hidden>{r.glyph}</span>
                {active && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    transition={{ duration: 0.14, ease: easeOut }}
                    className="text-sm font-semibold text-boom-strong"
                  >
                    {r.label}
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>
        <motion.div whileTap={{ scale: 0.97 }} className="self-start">
          <PrimaryAction>Boom — publish</PrimaryAction>
        </motion.div>
      </div>

      {/* Panel reveal */}
      <div className="material-content flex flex-col gap-6 rounded-3xl p-6 sm:p-7">
        <div>
          <p className="type-label mb-1">M2 · Component — floating panel reveal</p>
          <p className="type-meta">
            Transient SYSTEMBOOM material slides in on component timing, 220ms.
          </p>
        </div>
        <SecondaryAction
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen((v) => !v)}
          className="self-start"
        >
          {panelOpen ? "Dismiss panel" : "Reveal floating panel"}
        </SecondaryAction>
        <div className="min-h-28">
          <AnimatePresence>
            {panelOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: M2, ease: easeOut }}
                className="material-floating rounded-2xl p-4"
              >
                <p className="font-medium">Saved to your Life</p>
                <p className="type-meta">
                  This moment now lives on 1 Sep 2026 in your Circle.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Spatial */}
      <div className="material-content flex flex-col gap-6 rounded-3xl p-6 sm:p-7 lg:col-span-2">
        <div>
          <p className="type-label mb-1">M3 · Spatial — moment expands in place</p>
          <p className="type-meta">
            The same surface grows from summary to detail — continuity, not
            replacement. 360ms spatial easing.
          </p>
        </div>
        <motion.button
          layout
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          transition={{ duration: M3, ease: easeSpatial }}
          className={`overflow-hidden rounded-2xl border border-edge bg-surface text-left ${
            expanded ? "w-full" : "w-full max-w-xs"
          }`}
        >
          <motion.div layout className="relative" transition={{ duration: M3, ease: easeSpatial }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mock/media-lake.svg"
              alt="Alpine lake at first light (placeholder artwork)"
              className={`w-full object-cover ${expanded ? "h-56" : "h-32"}`}
            />
          </motion.div>
          <motion.div layout className="flex flex-col gap-1 p-4">
            <p className="font-semibold">Gosaikunda at first light</p>
            <p className="type-meta">Photo Journey · 12 May 2016 · Langtang</p>
            {expanded && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: M2, ease: easeOut, delay: 0.1 }}
                className="type-body mt-2 text-muted"
              >
                Fourth morning of the trek. The lake held perfectly still for
                about ten minutes — long enough for one frame that mattered.
                Tap again to collapse.
              </motion.p>
            )}
          </motion.div>
        </motion.button>
      </div>
    </div>
  );
}

/* ============================================================
   LIFE-TIME HOOK — computed client-side after mount
   ============================================================ */

const subscribeNoop = () => () => {};

export function useDemoLifeTime(): LifeTime | null {
  // Server renders null (skeleton); the client computes after hydration.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const birth = useMemo(
    () => parseBirthInstant(demoUser.dateOfBirth, demoUser.birthTime),
    [],
  );
  return useMemo(
    () => (mounted ? computeLifeTime(birth, now()) : null),
    [mounted, birth],
  );
}
