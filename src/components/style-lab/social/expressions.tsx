"use client";

/**
 * SYSTEMBOOM EXPRESSION LANGUAGE (R3.1) — living expressions.
 *
 * R2 proved the interaction model (one active Expression per viewer per Moment,
 * select / change / remove, visibility inheritance, Health–Problem exclusion).
 * R3 makes the language itself world-class: TWELVE expressions in two groups,
 * carried by the SYSTEMBOOM mascot's own body language rather than by a tiny
 * decorative symbol beside it.
 *
 * ── ASSET STATUS (R3.1 §3, §48 — honest) ────────────────────────────────────
 * The owner's 3D mascot LANDED (`references/brand/WhatsApp Image 2026-09-15 at
 * 07.40.41.png`, real alpha): dark metallic body, rope fuse, live spark, genuine
 * material depth. It is now the shipped artwork at three optical sizes in
 * `public/brand/expressions/` — `neutral-sm` is a HEAD crop (fuse dropped) for
 * summary/control use, `neutral-md`/`lg` are the full character (§33, §36, §50).
 *
 * What is STILL BLOCKED: the eighteen PER-EXPRESSION renders. The owner supplied
 * ONE pose — a mischievous grin — so every expression currently wears the same
 * face. Per §4/§5 the face must change per emotion (eyes, brows, mouth); per §48
 * that cannot be faked here, and adding more symbols to compensate is explicitly
 * forbidden. So: the language, deck, library, poses, mass-motion, sizes,
 * accessibility and localization are all real and finished against the slots —
 * `{id}-sm|md|lg.webp` plus the `RENDERED` set — and the per-expression faces are
 * reported as ART ASSET BLOCKED with full briefs in
 * `docs/handover/expression-render-briefs.md`.
 *
 * ── MOTION DNA (§31–§35) ─────────────────────────────────────────────────────
 * ENTRY → EMOTIONAL GESTURE → BOOM PULSE → SETTLE. Shared grammar, per-family
 * timing (quiet 300ms · warm 380ms · energetic 460ms). One-shot, event-driven,
 * compositor-friendly; the feed never animates on its own (§36, §84, §107).
 */

import { useEffect, useRef, useState } from "react";
import { PersonIdentity } from "@/components/identity/PersonIdentity";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { Moment } from "./data";
import { useSocial } from "./store";
import { Popover } from "./Moment";

export type ExpressionId =
  | "care" | "joy" | "laugh" | "wow" | "celebrate" | "support"
  | "love" | "respect" | "thanks" | "proud" | "inspired" | "curious"
  | "touched" | "withyou" | "agree" | "thinking" | "nostalgia" | "speechless";

/** §11 — emotional groups. They order the library; they are never exposed as tabs. */
export type ExpressionGroup = "energy" | "warmth" | "thought";

/** Which expressions have real 3D renders on disk. Empty until the owner asset lands (§3). */
const RENDERED = new Set<ExpressionId>();

/** Energy family → the default one-shot duration. Quiet emotions settle sooner (§32). */
type Energy = "quiet" | "warm" | "lively";
const DURATION: Record<Energy, number> = { quiet: 300, warm: 380, lively: 460 };

/**
 * R3.2 §15–§16 — per-expression emotional TEMPO for the quick six. Every one still runs the
 * shared DNA (ANTICIPATE → EXPRESS → BOOM PULSE → SETTLE); what differs is how long the
 * character takes to get through it. Tuned by watching the real-speed captures, not by
 * copying the brief's numbers: Wow is the sharpest thing in the set and Celebrate the most
 * extended, and the gap between them has to be felt, not measured.
 */
const TEMPO: Partial<Record<ExpressionId, number>> = {
  care: 360,      // soft
  joy: 300,       // light
  laugh: 400,     // playful
  wow: 260,       // sharp
  celebrate: 460, // energetic
  support: 380,   // grounded
};
const durationOf = (d: ExpressionDef) => TEMPO[d.id] ?? DURATION[d.energy];

/**
 * §28–§29 MASS. This character is a heavy metal bomb, not a rubber emoji: small
 * amplitude, strong acceleration, short overshoot, firm settle. "heavy" barely
 * overshoots and lands hard (Support, Respect, With you); "light" may bound a
 * little (Joy, Celebrate, Laugh).
 */
type Mass = "heavy" | "normal" | "light";

export interface ExpressionDef {
  id: ExpressionId;
  labelKey: string;
  quick: boolean;
  group: ExpressionGroup;
  energy: Energy;
  mass: Mass;
  /** Accent lives INSIDE the expressive object only — never UI chrome, never the Life Ring. */
  accent: string;
  /**
   * The mascot's own body language for this feeling — the part a pose can honestly carry
   * with the current 2D artwork, and the transform the 3D render will inherit.
   */
  pose: { rotate?: number; x?: number; y?: number; scale?: number; origin?: string };
  /** Fuse/spark energy (§34): the character's emotional charge, never an explosion metaphor. */
  fuse: "calm" | "warm" | "lift" | "flare" | "burst" | "steady" | "wobble";
  /** A supporting mark. Secondary to the pose — it may never be the entire feeling (§5). */
  mark?: (s: number) => React.ReactNode;
  markAt?: "tr" | "cradle";
}

const st = { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const EXPRESSIONS: ExpressionDef[] = [
  // ---- QUICK SIX (§9) — highest art quality; they must read without their marks ----
  { id: "care", labelKey: "expr.care", quick: true, group: "warmth", energy: "quiet", mass: "heavy", accent: "#E05A7E",
    pose: { scale: 0.90, y: 4, rotate: -10, origin: "50% 88%" }, fuse: "warm", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M10 16.4C5.2 13 3 10.6 3 7.9 3 5.9 4.6 4.4 6.5 4.4c1.4 0 2.7.8 3.5 2 .8-1.2 2.1-2 3.5-2 1.9 0 3.5 1.5 3.5 3.5 0 2.7-2.2 5.1-7 8.5z" fill="#E05A7E" /></svg>) },
  { id: "joy", labelKey: "expr.joy", quick: true, group: "energy", energy: "warm", mass: "light", accent: "#E8A13C",
    pose: { y: -6, scale: 1.08, origin: "50% 95%" }, fuse: "lift", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M4 7.5c1.6-2 3.4-2 5 0M11 7.5c1.6-2 3.4-2 5 0" stroke="#E8A13C" strokeWidth="2.3" {...st} /></svg>) },
  { id: "laugh", labelKey: "expr.laugh", quick: true, group: "energy", energy: "lively", mass: "light", accent: "#E8A13C",
    pose: { rotate: 14, y: -2, scale: 1.05, origin: "50% 90%" }, fuse: "wobble", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M3.6 11.2c1.9 2.6 4.2 3.9 6.4 3.9s4.5-1.3 6.4-3.9" stroke="#E8A13C" strokeWidth="2.4" {...st} /><path d="M5.4 6.2c.9-1 1.9-1 2.8 0M11.8 6.2c.9-1 1.9-1 2.8 0" stroke="#E8A13C" strokeWidth="1.9" {...st} /></svg>) },
  { id: "wow", labelKey: "expr.wow", quick: true, group: "energy", energy: "warm", mass: "normal", accent: "#5FA8E6",
    pose: { scale: 1.16, y: -4, rotate: -9, origin: "50% 78%" }, fuse: "flare", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M10 1.6v4M10 14.4v4M1.6 10h4M14.4 10h4M4.2 4.2l2.6 2.6M15.8 4.2l-2.6 2.6M4.2 15.8l2.6-2.6M15.8 15.8l-2.6-2.6" stroke="#5FA8E6" strokeWidth="2.1" {...st} /></svg>) },
  { id: "celebrate", labelKey: "expr.celebrate", quick: true, group: "energy", energy: "lively", mass: "light", accent: "#D92A20",
    pose: { y: -8, scale: 1.1, rotate: -8, origin: "50% 95%" }, fuse: "burst", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M10 2.4v3.1M15.2 4.4l-1.9 2.3M4.8 4.4l1.9 2.3" stroke="#D92A20" strokeWidth="2.2" {...st} /><circle cx="16.6" cy="9.6" r="1.4" fill="#D92A20" /><circle cx="3.4" cy="9.6" r="1.4" fill="#D92A20" /></svg>) },
  { id: "support", labelKey: "expr.support", quick: true, group: "warmth", energy: "quiet", mass: "heavy", accent: "#3E9E78",
    pose: { scale: 1.02, y: 0, origin: "50% 100%" }, fuse: "steady", markAt: "cradle",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 24 24" aria-hidden><path d="M3.2 10.5c-.6 5.2 3 9 8.8 9s9.4-3.8 8.8-9" stroke="#3E9E78" strokeWidth="2.6" {...st} /></svg>) },

  // ---- ENERGY (extended) ----
  { id: "proud", labelKey: "expr.proud", quick: false, group: "energy", energy: "warm", mass: "normal", accent: "#C9913E",
    pose: { y: -4, scale: 1.05, rotate: 0, origin: "50% 100%" }, fuse: "lift", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M4.6 3.4h10.8v6.2a5.4 5.4 0 0 1-10.8 0z" stroke="#C9913E" strokeWidth="2.1" {...st} /><path d="M7.6 15.6h4.8M10 14.9v.7" stroke="#C9913E" strokeWidth="2.1" {...st} /></svg>) },
  { id: "speechless", labelKey: "expr.speechless", quick: false, group: "energy", energy: "quiet", mass: "heavy", accent: "#8595A8",
    pose: { scale: 0.97, y: 1, rotate: 2, origin: "50% 95%" }, fuse: "calm", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M16.6 9.4c0 3.3-2.9 5.9-6.6 5.9-.9 0-1.8-.2-2.6-.5L3.4 16.4l1.2-3.2a5.5 5.5 0 0 1-1.2-3.8C3.4 6.1 6.3 3.5 10 3.5s6.6 2.6 6.6 5.9z" stroke="#8595A8" strokeWidth="2" {...st} /></svg>) },

  // ---- WARMTH (extended) ----
  { id: "love", labelKey: "expr.love", quick: false, group: "warmth", energy: "warm", mass: "normal", accent: "#D93A6A",
    pose: { scale: 1.06, y: -3, rotate: -4, origin: "50% 90%" }, fuse: "warm", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M8.4 17C4 13.9 2 11.7 2 9.2 2 7.4 3.4 6 5.2 6c1.2 0 2.3.7 3.2 1.8C9.3 6.7 10.4 6 11.6 6c1.8 0 3.2 1.4 3.2 3.2 0 2.5-2 4.7-6.4 7.8z" fill="#D93A6A" /><path d="M14.4 5.4c2.4-.2 4 1.3 4 3.3 0 1.4-.8 2.7-2.3 4.1" stroke="#D93A6A" strokeWidth="1.9" {...st} /></svg>) },
  { id: "thanks", labelKey: "expr.thanks", quick: false, group: "warmth", energy: "warm", mass: "normal", accent: "#C98B3E",
    pose: { rotate: 13, y: 4, scale: 0.95, origin: "50% 100%" }, fuse: "warm", markAt: "cradle",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 24 24" aria-hidden><path d="M4.4 15.4c2.2 3 4.8 4.5 7.6 4.5s5.4-1.5 7.6-4.5" stroke="#C98B3E" strokeWidth="2.5" {...st} /></svg>) },
  { id: "touched", labelKey: "expr.touched", quick: false, group: "warmth", energy: "quiet", mass: "heavy", accent: "#C2708F",
    pose: { scale: 0.9, y: 4, rotate: 8, origin: "50% 100%" }, fuse: "warm", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><circle cx="10" cy="10" r="2" fill="#C2708F" /><path d="M14.4 5.6a6.2 6.2 0 0 1 0 8.8M17.6 2.4a10.8 10.8 0 0 1 0 15.2" stroke="#C2708F" strokeWidth="1.9" {...st} /></svg>) },
  { id: "withyou", labelKey: "expr.withYou", quick: false, group: "warmth", energy: "quiet", mass: "heavy", accent: "#7C93A8",
    pose: { scale: 1.0, x: -2, origin: "50% 100%" }, fuse: "steady", markAt: "cradle",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 24 24" aria-hidden><path d="M2.6 19.4c0-3.4 2.4-5.6 5.4-5.6s5.4 2.2 5.4 5.6M13 19.4c0-3.4 2.2-5.6 4.6-5.6 1.5 0 2.9.6 3.8 1.7" stroke="#7C93A8" strokeWidth="2.4" {...st} /></svg>) },

  // ---- THOUGHT / CONNECTION (extended) ----
  { id: "respect", labelKey: "expr.respect", quick: false, group: "thought", energy: "quiet", mass: "heavy", accent: "#8E7CC3",
    pose: { rotate: 0, y: -1, scale: 1.0, origin: "50% 100%" }, fuse: "calm", markAt: "cradle",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 24 24" aria-hidden><path d="M5 19h14M8.2 19c-2.4-1.6-3.6-3.7-3.9-6.4M15.8 19c2.4-1.6 3.6-3.7 3.9-6.4" stroke="#8E7CC3" strokeWidth="2.4" {...st} /></svg>) },
  { id: "inspired", labelKey: "expr.inspired", quick: false, group: "thought", energy: "warm", mass: "normal", accent: "#4FB0A8",
    pose: { y: -7, scale: 1.04, rotate: -3, origin: "50% 100%" }, fuse: "lift", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M5 11.6 10 6.4l5 5.2M5 17 10 11.8l5 5.2" stroke="#4FB0A8" strokeWidth="2.3" {...st} /></svg>) },
  { id: "curious", labelKey: "expr.curious", quick: false, group: "thought", energy: "quiet", mass: "normal", accent: "#6E8BC4",
    pose: { rotate: -16, y: 0, scale: 0.99, origin: "50% 95%" }, fuse: "calm", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M5.6 14.6c-2.4-2.4-2.4-6.2 0-8.6M9.4 12.4c-1.2-1.2-1.2-3.2 0-4.4" stroke="#6E8BC4" strokeWidth="2.2" {...st} /><circle cx="14.4" cy="10.2" r="1.7" fill="#6E8BC4" /></svg>) },
  { id: "agree", labelKey: "expr.agree", quick: false, group: "thought", energy: "quiet", mass: "heavy", accent: "#4E9E62",
    pose: { y: 2, scale: 1.0, rotate: 5, origin: "50% 100%" }, fuse: "steady", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M3.6 10.8 8 15.2 16.6 5.4" stroke="#4E9E62" strokeWidth="2.6" {...st} /></svg>) },
  { id: "thinking", labelKey: "expr.thinking", quick: false, group: "thought", energy: "quiet", mass: "normal", accent: "#7E8BA0",
    pose: { rotate: -10, y: 1, scale: 0.98, origin: "50% 95%" }, fuse: "calm", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><circle cx="5.4" cy="14.6" r="1.5" fill="#7E8BA0" /><circle cx="10" cy="11.4" r="2" fill="#7E8BA0" /><circle cx="15" cy="7.2" r="2.6" fill="#7E8BA0" /></svg>) },
  { id: "nostalgia", labelKey: "expr.nostalgia", quick: false, group: "thought", energy: "quiet", mass: "heavy", accent: "#A98C6B",
    pose: { rotate: 6, y: 3, scale: 0.95, origin: "50% 100%" }, fuse: "warm", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M3.4 10a6.6 6.6 0 1 0 2-4.7" stroke="#A98C6B" strokeWidth="2.2" {...st} /><path d="M2.6 2.8v3.8h3.8" stroke="#A98C6B" strokeWidth="2.2" {...st} /><path d="M10 6.8V10l2.4 1.6" stroke="#A98C6B" strokeWidth="2" {...st} /></svg>) },
];

/** §11 — the library orders by emotional group; the groups are never shown as tabs. */
export const GROUP_ORDER: ExpressionGroup[] = ["energy", "warmth", "thought"];

export const QUICK = EXPRESSIONS.filter((e) => e.quick);
/** Library order: quick six first (they are the language's core), then by emotional group. */
export const LIBRARY = [...QUICK, ...GROUP_ORDER.flatMap((g) => EXPRESSIONS.filter((e) => !e.quick && e.group === g))];
export const expressionDef = (id: string) => EXPRESSIONS.find((e) => e.id === id);

/**
 * R3.2 §54 — the Quick Six deck art is warmed ONCE, on idle, after Social has settled. The
 * first Social paint waits on nothing but the neutral face crop (3.4KB) that the Moment
 * action control already needs; the extended set stays strictly on demand, loading only when
 * a person opens the library. Deliberately no `<link rel=preload>`: this must never compete
 * with the first Moment's own photograph.
 */
export function prefetchQuickArt() {
  if (typeof window === "undefined") return;
  const warm = () => { for (const d of QUICK) new Image().src = mascotSrc(d.id, "md"); };
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
  if (ric) ric(warm, { timeout: 3000 });
  else window.setTimeout(warm, 1200);
}

/**
 * The shipped 3D mascot, or an expression's own render once it exists (§3 slot).
 * `sm` is the OPTICAL HEAD CROP (§32–§33, §36): below ~30px the full character's fuse and
 * feet are noise, so the summary and the neutral control show the face instead of a
 * shrunken whole body. `md`/`lg` are the full character.
 */
function mascotSrc(id?: ExpressionId, size?: "sm" | "md" | "lg") {
  const bucket = size ?? "md";
  return id && RENDERED.has(id) ? `/brand/expressions/${id}-${bucket}.webp` : `/brand/expressions/neutral-${bucket}.webp`;
}

/**
 * One mascot expression. FACE + BODY + FUSE + MOTION carry the emotion; the mark only
 * supports it (§4–§5). `animate` plays the one-shot ENTRY → MASS IMPULSE → BOOM PULSE →
 * SETTLE; everything else is the strong static state (§70 of R3).
 *
 * Four deliberate layers, because each must survive something the others do not:
 *   pulse   — the pressure ring, outside the character
 *   entry   — scale/opacity arrival + the energy family's gesture
 *   mass    — the body impulse (§28): how heavy this character is when it lands
 *   pose    — a STATIC transform, so the emotion survives reduced motion entirely
 */
export function MascotExpression({ id, size, animate = false, marks = true, className = "" }: { id: ExpressionId; size: number; animate?: boolean; marks?: boolean; className?: string }) {
  const def = expressionDef(id)!;
  const markSize = Math.round(size * (def.markAt === "cradle" ? 0.40 : 0.32));
  const cradle = def.markAt === "cradle";
  const ms = durationOf(def);
  const bucket = size <= 30 ? "sm" : size <= 96 ? "md" : "lg";
  // R3.2 self-critique — the POSE is BODY language. The `sm` tier is a face crop with no
  // body in it, so applying a body rotation/lift there only tilts and clips a head: the
  // committed control was showing a cropped jaw. At face scale the FACE is the whole state.
  const body = bucket !== "sm";
  const pose = body
    ? `translate(${def.pose.x ?? 0}px, ${def.pose.y ?? 0}px) rotate(${def.pose.rotate ?? 0}deg) scale(${def.pose.scale ?? 1})`
    : "none";
  // A heavy body displaces less air than a light one — the ring is mass-scaled (§27–§29).
  const pulseTo = def.mass === "heavy" ? 1.62 : def.mass === "light" ? 2.02 : 1.85;
  return (
    <span
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: size, height: size }}
      data-sb-expression={id}
      data-sb-expression-energy={def.energy}
      data-sb-expression-mass={def.mass}
      data-sb-expression-group={def.group}
    >
      {animate && (
        <span aria-hidden className="sb-boom-pulse absolute inset-[-12%] rounded-full" style={{ border: `1.5px solid ${def.accent}`, animationDuration: `${ms + 60}ms`, ["--pulse-to" as string]: pulseTo }} />
      )}
      <span aria-hidden className={`block h-full w-full ${animate ? `sb-expr-in ${def.quick ? `sb-g-${def.id}` : `sb-energy-${def.energy}`}` : ""}`} style={{ animationDuration: animate ? `${ms}ms` : undefined }}>
        <span className={`${animate ? `sb-mass sb-mass-${def.mass}` : "block h-full w-full"}`}>
          <span className="relative block h-full w-full" style={{ transform: pose, transformOrigin: def.pose.origin ?? "50% 100%" }} data-sb-pose={id} data-sb-pose-applied={body ? "body" : "face"}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mascotSrc(id, bucket)} alt="" draggable={false} decoding="async" width={size} height={size} className="block h-full w-full select-none object-contain" />
            {/* The fuse carries emotional charge (§34) — a light over the artwork's own spark,
                never a redraw of the character, never a permanent flame in the feed (§36). */}
            {animate && def.fuse !== "calm" && (
              <span aria-hidden className={`sb-fuse sb-fuse-${def.fuse} absolute rounded-full`} style={{ animationDuration: `${ms}ms`, top: `${size * 0.02}px`, right: `${size * 0.1}px`, width: Math.max(5, size * 0.2), height: Math.max(5, size * 0.2), background: `radial-gradient(circle, ${def.accent} 0%, transparent 68%)` }} />
            )}
          </span>
        </span>
      </span>
      {/* §4/§43/§62 — the mark is removable BY DESIGN so the no-marks board can prove, honestly,
          how much of the meaning the character itself is carrying today. */}
      {marks && def.mark && (
        <span
          aria-hidden
          data-sb-mark={id}
          className={`absolute ${animate ? "sb-mark-in" : ""}`}
          style={cradle
            ? { left: "50%", bottom: -Math.round(size * 0.05), transform: "translateX(-50%)", width: markSize, height: markSize, opacity: 0.86 }
            : { top: -Math.round(size * 0.04), right: -Math.round(size * 0.04), width: markSize, height: markSize, opacity: 0.86 }}
        >
          {def.mark(markSize)}
        </span>
      )}
      {/* §15 — Celebrate's one tiny local burst: four sparks, one event, tiny radius, no engine. */}
      {animate && id === "celebrate" && (
        <span aria-hidden className="pointer-events-none absolute inset-0">
          {[[-17, -13], [17, -15], [-14, 13], [15, 11]].map(([x, y], i) => (
            <span key={i} className="sb-spark absolute top-1/2 left-1/2 h-1 w-1 rounded-full" style={{ background: def.accent, ["--sx" as string]: `${x}px`, ["--sy" as string]: `${y}px`, animationDelay: `${140 + i * 30}ms` }} />
          ))}
        </span>
      )}
    </span>
  );
}

/** Entries of a Moment's expressions, registry-ordered — stable, never popularity-ordered. */
export function expressionEntries(moment: Moment): [string, ExpressionId][] {
  const raw = moment.expressions ?? {};
  return Object.entries(raw).filter((e): e is [string, ExpressionId] => !!expressionDef(e[1]));
}

/**
 * The one compact Expression entry beside Respond (§25 of R3). Tap → the QUICK DECK; a clear
 * "More" opens the EXPRESSION LIBRARY carrying all eighteen WITH their localized names
 * (§25–§27 — the labels are how the language is learned, and how a less tech-confident person
 * reads it). Selecting commits the viewer's single Expression; re-selecting or Remove clears
 * it. Never rendered on Health/Problem — the caller gates on quiet kinds (§17, §90 of R3).
 */
export function ExpressionControl({ moment }: { moment: Moment }) {
  const { me, dispatch } = useSocial();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [played, setPlayed] = useState(0);
  const [shift, setShift] = useState(0);
  const [preview, setPreview] = useState<ExpressionId | null>(null);
  const [libMax, setLibMax] = useState(428);
  /**
   * R3.2 §20–§22 — ONE phone pattern, chosen from real 320/360/390/430 evidence: 3×2.
   * A single scrolling row of six could only fit ~4.2 seats at 320 and forced the character
   * down to 56px; 3×2 fits all six at every phone width AND gives the mascot 68px, which is
   * the size at which the eyes, brow and mouth actually read. Measured at open time (the
   * deck is transient, so there is nothing to keep in sync afterwards).
   */
  const [phone, setPhone] = useState(false);
  const seatPx = phone ? 84 : 68;
  const artPx = phone ? 68 : 56;
  const [announce, setAnnounce] = useState("");
  const wrap = useRef<HTMLSpanElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const mine = (moment.expressions ?? {})[me.id] as ExpressionId | undefined;
  const mineDef = mine ? expressionDef(mine) : undefined;

  useEffect(() => {
    if (!open) return;
    const b = btn.current;
    if (b && !more) {
      const frame = (b.closest("[data-sb-social-frame]") ?? document.documentElement).getBoundingClientRect();
      const deckW = rail.current?.getBoundingClientRect().width ?? Math.min(432, frame.width * 0.94);
      const over = b.getBoundingClientRect().left + deckW - (frame.right - 8);
      setShift(over > 0 ? -Math.ceil(over) : 0);
    }
    // §25 — the library opens ABOVE the control, so its scroller may never be taller than the
    // room actually available there; otherwise on a phone the top of the library leaves the
    // screen and the quick six become unreachable.
    if (b && more) setLibMax(Math.max(196, Math.min(428, Math.round(b.getBoundingClientRect().top) - 96)));
    const onDown = (e: PointerEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) { setOpen(false); setMore(false); } };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && wrap.current?.contains(document.activeElement)) {
        e.stopPropagation();
        if (more) { setMore(false); return; }
        setOpen(false);
        btn.current?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey, true);
    requestAnimationFrame(() => {
      const box = rail.current;
      (box?.querySelector<HTMLElement>("[aria-checked=true]") ?? box?.querySelector<HTMLElement>("[role=radio]"))?.focus({ preventScroll: true });
    });
    return () => { window.removeEventListener("pointerdown", onDown); window.removeEventListener("keydown", onKey, true); };
  }, [open, more]);

  const commit = (id: ExpressionId | null) => {
    dispatch({ type: "express", id: moment.id, expression: id });
    setOpen(false);
    setMore(false);
    setPreview(null);
    setPlayed((k) => (id ? k + 1 : 0));
    setAnnounce(id ? t("expr.optionAria", { name: t(expressionDef(id)!.labelKey) }) : t("expr.remove"));
    btn.current?.focus({ preventScroll: true });
  };

  const openDeck = () => {
    // A drag that commits arms `skipClick` for a click the browser then never delivers
    // (the deck unmounts first). Disarm on every open, or the next TAP would be swallowed.
    skipClick.current = false;
    const frame = btn.current?.closest("[data-sb-social-frame]");
    setPhone((frame?.getBoundingClientRect().width ?? window.innerWidth) < 672);
    setOpen((v) => !v);
    setMore(false);
  };

  const move = (e: React.KeyboardEvent) => {
    const items = [...(rail.current?.querySelectorAll<HTMLElement>("[role=radio]") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    const cols = more || phone ? 3 : items.length;
    let to = -1;
    if (e.key === "ArrowRight") to = (i + 1) % items.length;
    if (e.key === "ArrowLeft") to = (i - 1 + items.length) % items.length;
    if (e.key === "ArrowDown") to = Math.min(items.length - 1, i + cols);
    if (e.key === "ArrowUp") to = Math.max(0, i - cols);
    if (e.key === "Home") to = 0;
    if (e.key === "End") to = items.length - 1;
    if (to >= 0) { e.preventDefault(); items[to]?.focus(); }
  };

  const first = more ? LIBRARY[0] : QUICK[0];
  const common = (def: ExpressionDef) => ({
    type: "button" as const,
    role: "radio",
    "aria-checked": mine === def.id,
    tabIndex: mine === def.id || (!mine && def.id === first.id) ? 0 : -1,
    "aria-label": t("expr.optionAria", { name: t(def.labelKey) }),
    onClick: () => { if (skipClick.current) { skipClick.current = false; return; } commit(mine === def.id ? null : def.id); },
    onPointerEnter: () => setPreview(def.id),
    onPointerLeave: () => setPreview((v) => (v === def.id ? null : v)),
    onFocus: () => setPreview(def.id),
    "data-sb-expression-option": def.id,
    style: { ["--seat-accent" as string]: `color-mix(in srgb, ${def.accent} 34%, transparent)` },
  });

  /**
   * §19–§24 — a SEAT: a shallow machined well the character sits in, rising on attention.
   * R3.2 §20–§21: on a phone the six sit 3×2 so the character can be big enough to read as a
   * FACE (68px inside an 84px seat at 320) instead of six thumbnails in a scrolling row.
   */
  const seat = (def: ExpressionDef) => (
    <button
      key={def.id}
      {...common(def)}
      className={`sb-seat sb-press relative grid shrink-0 place-items-center rounded-[20px] focus-visible:outline-[var(--focus)] ${mine === def.id ? "sb-seat-own" : ""}`}
      style={{ ...common(def).style, width: seatPx, height: seatPx }}
      data-sb-previewing={preview === def.id && preview !== mine ? "" : undefined}
    >
      <span className="sb-seat-art block">
        <MascotExpression id={def.id} size={artPx} />
      </span>
      {/* §24 — ownership is a small Boom notch on the seat's rim, never a red circle */}
      {mine === def.id && <span aria-hidden data-sb-own-mark className="absolute bottom-[5px] left-1/2 h-[7px] w-[7px] -translate-x-1/2 rotate-45 rounded-[1.5px]" style={{ background: "var(--boom)" }} />}
    </button>
  );

  /** §25–§26 — a library cell: larger art, room to breathe, the name always present. */
  const cell = (def: ExpressionDef) => (
    <button
      key={def.id}
      {...common(def)}
      className={`sb-lib-cell sb-press relative flex flex-col items-center justify-start gap-1 rounded-[16px] px-1 pt-2 pb-1.5 focus-visible:outline-[var(--focus)] ${mine === def.id ? "sb-lib-cell-own" : ""}`}
    >
      <MascotExpression id={def.id} size={54} className="sb-seat-art" />
      <span className="max-w-full truncate text-[11.5px] leading-tight font-medium text-muted">{t(def.labelKey)}</span>
      {mine === def.id && <span aria-hidden data-sb-own-mark className="absolute bottom-[3px] left-1/2 h-[6px] w-[6px] -translate-x-1/2 rotate-45 rounded-[1.5px]" style={{ background: "var(--boom)" }} />}
    </button>
  );

  // §11 — the groups ORDER the library. They are structure and air, never tabs, never labels.
  const sections: ExpressionDef[][] = [QUICK, ...GROUP_ORDER.map((g) => EXPRESSIONS.filter((e) => !e.quick && e.group === g))];
  const captionId = preview ?? mine ?? null;

  /**
   * R3.2 §24–§25 — DRAG PREVIEW. Holding and sliding across the deck previews each seat
   * (it rises, the caption names it); the expression commits only on an intentional release.
   * Passing a finger over a seat NEVER plays the full expression. Tap is untouched: a press
   * that never leaves its seat falls through to the button's own click.
   */
  const dragFrom = useRef<string | null>(null);
  const dragOver = useRef<string | null>(null);
  const skipClick = useRef(false);
  const seatAt = (x: number, y: number) =>
    (document.elementFromPoint(x, y)?.closest("[data-sb-expression-option]") as HTMLElement | null)?.getAttribute("data-sb-expression-option") ?? null;
  const dragHandlers = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragFrom.current = seatAt(e.clientX, e.clientY);
      dragOver.current = dragFrom.current;
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!dragFrom.current) return;
      const over = seatAt(e.clientX, e.clientY);
      if (over && over !== dragOver.current) {
        dragOver.current = over;
        setPreview(over as ExpressionId);
      }
    },
    onPointerUp: (e: React.PointerEvent) => {
      const from = dragFrom.current;
      const over = seatAt(e.clientX, e.clientY);
      dragFrom.current = null;
      dragOver.current = null;
      // A real drag: it started on one seat and released on another. Commit the release
      // target and swallow the click the browser will still deliver to the origin seat.
      if (from && over && over !== from) {
        skipClick.current = true;
        commit(over as ExpressionId);
      }
    },
    onPointerCancel: () => { dragFrom.current = null; dragOver.current = null; },
  };

  return (
    <span ref={wrap} className="relative inline-flex">
      <button
        ref={btn}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={mineDef ? t("expr.yoursAria", { name: t(mineDef.labelKey) }) : t("expr.open")}
        title={mineDef ? t(mineDef.labelKey) : t("expr.open")}
        onClick={openDeck}
        className={`sb-press relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border focus-visible:outline-[var(--focus)] @2xl:h-9 @2xl:w-9 ${mineDef ? "sb-seat sb-seat-own border-transparent" : "border-[var(--hair)] hover:border-steel/60"}`}
        style={mineDef ? { ["--seat-accent" as string]: `color-mix(in srgb, ${mineDef.accent} 34%, transparent)` } : undefined}
        data-sb-express={mine ?? ""}
      >
        {/* R3.2 §29–§30 — the control wears the dedicated OPTICAL FACE CROP, not a shrunken
            whole body: at 30px the eyes, brow and grin are the only things that can read.
            §30 — once committed it shows that expression's own face, and never animates on. */}
        {mineDef ? <MascotExpression key={played} id={mineDef.id} size={30} animate={played > 0} /> : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mascotSrc(undefined, "sm")} alt="" aria-hidden draggable={false} width={30} height={30} data-sb-express-neutral className="block select-none" style={{ width: 30, height: 30 }} />
        )}
        {/* §58 — the committed control is material + shape (a seat the character has settled
            into, with the Boom notch on its rim), never a flat coloured circle. */}
        {mineDef && <span aria-hidden data-sb-own-mark className="pointer-events-none absolute inset-0 rounded-full" style={{ borderBottom: "2px solid var(--boom)" }} />}
      </button>
      <span role="status" aria-live="polite" className="sr-only">{announce}</span>

      {open && !more && (
        <div
          ref={rail}
          style={{ left: shift }}
          className="sb-deck sb-surface-in absolute bottom-full z-20 mb-2 rounded-[24px] border border-[var(--hair)] px-2 pt-1.5 pb-1.5 shadow-[0_18px_40px_-18px_rgba(0,0,0,.55)]"
          data-sb-expression-rail
          data-sb-expression-deck
        >
          {/* §22 — the semantic name leads the deck, on its own line, so the seats never shrink
              to make room for text and the caption can never collide with More / Remove. */}
          <p className="mb-1 truncate px-1 text-[12px] leading-5 font-medium text-muted" data-sb-deck-caption>
            {captionId ? t(expressionDef(captionId)!.labelKey) : t("expr.railAria")}
          </p>
          <div
            role="radiogroup"
            aria-label={t("expr.railAria")}
            className={phone ? "grid gap-2" : "flex items-end gap-1"}
            /* explicit tracks: Tailwind's grid-cols-3 is minmax(0,1fr), whose min-content is
               ZERO — inside the deck's shrink-to-fit absolute box that collapsed the whole
               deck to the caption's width and let the seats overflow it. */
            style={phone ? { gridTemplateColumns: `repeat(3, ${seatPx}px)` } : undefined}
            onKeyDown={move}
            onPointerLeave={() => setPreview(null)}
            {...dragHandlers}
            data-sb-deck-pattern={phone ? "3x2" : "row"}
          >
            {QUICK.map(seat)}
          </div>
          <div className="mt-1 flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setMore(true)}
              className="sb-press inline-flex h-8 shrink-0 items-center rounded-full border border-[var(--hair)] px-2.5 text-[12px] font-medium text-muted hover:bg-steel/12 hover:text-text focus-visible:outline-[var(--focus)]"
              data-sb-expression-more
            >
              {t("expr.more")}
            </button>
            {mine && (
              <button type="button" onClick={() => commit(null)} className="sb-press inline-flex h-8 shrink-0 items-center rounded-full px-2 text-[12px] font-medium text-muted hover:text-text focus-visible:outline-[var(--focus)]" data-sb-expression-remove>
                {t("expr.remove")}
              </button>
            )}
          </div>
        </div>
      )}

      {open && more && (
        <div
          ref={rail}
          className="sb-lib sb-surface-in absolute bottom-full left-1/2 z-20 mb-2 w-[min(94vw,368px)] @2xl:w-[min(94vw,404px)] -translate-x-1/2 rounded-[26px] border border-[var(--hair)] p-2.5 shadow-[0_20px_44px_-18px_rgba(0,0,0,.6)]"
          data-sb-expression-panel
          data-sb-expression-library
        >
          <div className="flex items-center gap-2 px-1 pb-2">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{t("expr.railAria")}</p>
            {mine && (
              <button type="button" onClick={() => commit(null)} className="sb-press ml-auto inline-flex min-h-8 items-center rounded-full px-2 text-[12px] font-medium text-muted hover:text-text focus-visible:outline-[var(--focus)]" data-sb-expression-remove>
                {t("expr.remove")}
              </button>
            )}
          </div>
          {/* All eighteen WITH their names — this is how the language is learned (§25–§27) */}
          <div role="radiogroup" aria-label={t("expr.railAria")} style={{ maxHeight: libMax }}
            className="flex flex-col overflow-y-auto overscroll-contain" onKeyDown={move} onPointerLeave={() => setPreview(null)}>
            {sections.map((sec, i) => (
              <div key={i} className={`grid grid-cols-3 gap-1 ${i > 0 ? "mt-2.5 border-t border-[var(--hair)] pt-2.5" : ""}`}>
                {sec.map(cell)}
              </div>
            ))}
          </div>
        </div>
      )}
    </span>
  );
}

/**
 * HUMAN PRESENCE (§38–§39, §45) — one quiet line that answers "are people here?", never
 * "how popular is this?". Up to three distinct mascot expressions + the number of people,
 * then the written conversation. Tapping the expressions opens WHO felt WHAT (§40).
 */
export function ExpressionSummary({ moment }: { moment: Moment }) {
  const { me, personOf } = useSocial();
  const { t, tp } = useT();
  const [who, setWho] = useState(false);
  const entries = expressionEntries(moment);
  if (entries.length === 0) return null;
  const distinct = EXPRESSIONS.filter((d) => entries.some(([, id]) => id === d.id)).slice(0, 3);
  return (
    <span className="relative">
      <button
        type="button"
        aria-expanded={who}
        aria-label={tp("expr.summaryN", entries.length)}
        onClick={() => setWho((v) => !v)}
        className="sb-press inline-flex min-h-9 items-center gap-1.5 rounded-full px-1 text-muted hover:text-text focus-visible:outline-[var(--focus)]"
        data-sb-expression-summary={entries.length}
      >
        <span aria-hidden className="flex items-center">
          {distinct.map((d, i) => (
            <span key={d.id} className={`flex items-center justify-center rounded-full bg-[var(--sheet-bg)] ${i > 0 ? "-ml-1.5" : ""}`} style={{ padding: 1 }}>
              <MascotExpression id={d.id} size={24} marks={false} />
            </span>
          ))}
        </span>
        <span className="tabular-nums">{entries.length}</span>
      </button>
      {who && (
        <Popover onClose={() => setWho(false)} label={t("expr.whoTitle")}>
          <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto" data-sb-expression-who>
            {entries.map(([personId, id]) => {
              const p = personOf(personId);
              const def = expressionDef(id)!;
              return (
                <li key={personId} className="flex items-center gap-2 px-2 py-1 text-[13px] whitespace-nowrap">
                  <PersonIdentity viewer={me} subject={p} size={24} />
                  <span className="text-text">{p.name}</span>
                  <span aria-hidden className="ml-auto flex items-center pl-3"><MascotExpression id={def.id} size={26} /></span>
                  <span className="text-muted">{t(def.labelKey)}</span>
                </li>
              );
            })}
          </ul>
        </Popover>
      )}
    </span>
  );
}
