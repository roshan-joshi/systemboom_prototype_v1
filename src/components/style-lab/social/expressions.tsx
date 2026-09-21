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

import { useEffect, useId, useRef, useState } from "react";
/*
 * ── R3.7 GRAVITY EXPRESSIONS ─────────────────────────────────────────────────
 * The EMOTION CHAMBER is a bore seen obliquely (asset level, `_build-emotion-cores.js`),
 * and at component level the chamber is a real second layer: `MascotExpression` clips a copy
 * of its own artwork to the opening (`data-sb-core-layer`) so the core can lag the shell by a
 * pixel or two during a pointer preview (chamber depth), and a one-shot per-expression WAKE
 * plays inside the opening on preview. The picker is a GRAVITY DOCK: six characters on ONE
 * shared ground (transparent hit targets, contact shadows, a shallow arc on desktop), never
 * six tiles. Commit sends the activated chamber to the Boom Lens beside Respond as one
 * flight (`data-sb-core-flight`), so the same emotional object survives every scale.
 */
import { PersonIdentity } from "@/components/identity/PersonIdentity";
import { useT } from "@/lib/i18n/LocaleProvider";
import { formatNumberLocale } from "@/lib/i18n/format";
import type { Moment } from "./data";
import { useSocial } from "./store";

export type ExpressionId =
  | "care" | "joy" | "laugh" | "wow" | "celebrate" | "support"
  | "love" | "respect" | "thanks" | "proud" | "inspired" | "curious"
  | "touched" | "withyou" | "agree" | "thinking" | "nostalgia" | "speechless";

/** §11 — emotional groups. They order the library; they are never exposed as tabs. */
export type ExpressionGroup = "energy" | "warmth" | "thought";

/**
 * R3.3 §6 — COLOUR families. Four family hues carry all eighteen expressions as shades:
 * WARMTH (rose) · ENERGY (amber) · WONDER (blue) · CONNECTION (teal-green). Colour lives
 * inside Expression objects only, and Boom red stays reserved for ownership.
 */
export type ExpressionFamily = "warmth" | "energy" | "wonder" | "connection";

/**
 * Which expressions have their own artwork on disk. R3.5: the QUICK SIX carry EMOTION-CORE
 * composites — the owner's render with a machined cutaway revealing a large internal core
 * (heart · sun · laughter-waves+tear · starburst · firework · cradled orb). The FACE itself
 * is untouched and the R3.2 facial-render blocker still stands; true per-expression 3D
 * renders replace these composites file-for-file. Extended twelve: neutral until then.
 */
const RENDERED = new Set<ExpressionId>(["care", "joy", "laugh", "wow", "celebrate", "support"]);

/**
 * R3.7 — where the chamber OPENING sits inside the md/lg square artwork (fractions of the
 * side), derived from the compositor's geometry (source opening ≈ (703, 592), r ≈ 76×83 in
 * a 1055×1024 render whose alpha box is x231 y90 594×841, padded to an 841 square). The
 * clip is a hair inside the opening so a shifted core layer stays under the lip.
 */
const OPENING_AT = { x: 70.8, y: 59.7, rx: 8.6, ry: 9.5 };
export const FAMILY_ORDER: ExpressionFamily[] = ["warmth", "energy", "wonder", "connection"];
const FAMILY_TONE: Record<ExpressionFamily, string> = { warmth: "#E06A88", energy: "#E8A13C", wonder: "#5FA8E6", connection: "#3E9E78" };

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
  /** Colour family (§6). Independent of `group`, which orders the library. */
  family: ExpressionFamily;
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
  { id: "care", labelKey: "expr.care", quick: true, group: "warmth", family: "warmth", energy: "quiet", mass: "heavy", accent: "#E06A88",
    pose: { scale: 0.90, y: 4, rotate: -10, origin: "50% 88%" }, fuse: "warm", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M10 16.4C5.2 13 3 10.6 3 7.9 3 5.9 4.6 4.4 6.5 4.4c1.4 0 2.7.8 3.5 2 .8-1.2 2.1-2 3.5-2 1.9 0 3.5 1.5 3.5 3.5 0 2.7-2.2 5.1-7 8.5z" fill="currentColor" /></svg>) },
  { id: "joy", labelKey: "expr.joy", quick: true, group: "energy", family: "energy", energy: "warm", mass: "light", accent: "#E8A13C",
    pose: { y: -6, scale: 1.08, origin: "50% 95%" }, fuse: "lift", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M4 7.5c1.6-2 3.4-2 5 0M11 7.5c1.6-2 3.4-2 5 0" stroke="currentColor" strokeWidth="2.3" {...st} /></svg>) },
  { id: "laugh", labelKey: "expr.laugh", quick: true, group: "energy", family: "energy", energy: "lively", mass: "light", accent: "#E3912F",
    pose: { rotate: 14, y: -2, scale: 1.05, origin: "50% 90%" }, fuse: "wobble", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M3.6 11.2c1.9 2.6 4.2 3.9 6.4 3.9s4.5-1.3 6.4-3.9" stroke="currentColor" strokeWidth="2.4" {...st} /><path d="M5.4 6.2c.9-1 1.9-1 2.8 0M11.8 6.2c.9-1 1.9-1 2.8 0" stroke="currentColor" strokeWidth="1.9" {...st} /></svg>) },
  { id: "wow", labelKey: "expr.wow", quick: true, group: "energy", family: "wonder", energy: "warm", mass: "normal", accent: "#5FA8E6",
    pose: { scale: 1.16, y: -4, rotate: -9, origin: "50% 78%" }, fuse: "flare", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M10 1.6v4M10 14.4v4M1.6 10h4M14.4 10h4M4.2 4.2l2.6 2.6M15.8 4.2l-2.6 2.6M4.2 15.8l2.6-2.6M15.8 15.8l-2.6-2.6" stroke="currentColor" strokeWidth="2.1" {...st} /></svg>) },
  { id: "celebrate", labelKey: "expr.celebrate", quick: true, group: "energy", family: "energy", energy: "lively", mass: "light", accent: "#E8772E",
    pose: { y: -8, scale: 1.1, rotate: -8, origin: "50% 95%" }, fuse: "burst", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M10 2.4v3.1M15.2 4.4l-1.9 2.3M4.8 4.4l1.9 2.3" stroke="currentColor" strokeWidth="2.2" {...st} /><circle cx="16.6" cy="9.6" r="1.4" fill="currentColor" /><circle cx="3.4" cy="9.6" r="1.4" fill="currentColor" /></svg>) },
  { id: "support", labelKey: "expr.support", quick: true, group: "warmth", family: "connection", energy: "quiet", mass: "heavy", accent: "#3E9E78",
    pose: { scale: 1.02, y: 0, origin: "50% 100%" }, fuse: "steady", markAt: "cradle",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 24 24" aria-hidden><path d="M3.2 10.5c-.6 5.2 3 9 8.8 9s9.4-3.8 8.8-9" stroke="currentColor" strokeWidth="2.6" {...st} /></svg>) },

  // ---- ENERGY (extended) ----
  { id: "proud", labelKey: "expr.proud", quick: false, group: "energy", family: "energy", energy: "warm", mass: "normal", accent: "#D9A648",
    pose: { y: -4, scale: 1.05, rotate: 0, origin: "50% 100%" }, fuse: "lift", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M4.6 3.4h10.8v6.2a5.4 5.4 0 0 1-10.8 0z" stroke="currentColor" strokeWidth="2.1" {...st} /><path d="M7.6 15.6h4.8M10 14.9v.7" stroke="currentColor" strokeWidth="2.1" {...st} /></svg>) },
  { id: "speechless", labelKey: "expr.speechless", quick: false, group: "energy", family: "wonder", energy: "quiet", mass: "heavy", accent: "#8898B5",
    pose: { scale: 0.97, y: 1, rotate: 2, origin: "50% 95%" }, fuse: "calm", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M16.6 9.4c0 3.3-2.9 5.9-6.6 5.9-.9 0-1.8-.2-2.6-.5L3.4 16.4l1.2-3.2a5.5 5.5 0 0 1-1.2-3.8C3.4 6.1 6.3 3.5 10 3.5s6.6 2.6 6.6 5.9z" stroke="currentColor" strokeWidth="2" {...st} /></svg>) },

  // ---- WARMTH (extended) ----
  { id: "love", labelKey: "expr.love", quick: false, group: "warmth", family: "warmth", energy: "warm", mass: "normal", accent: "#D14E72",
    pose: { scale: 1.06, y: -3, rotate: -4, origin: "50% 90%" }, fuse: "warm", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M8.4 17C4 13.9 2 11.7 2 9.2 2 7.4 3.4 6 5.2 6c1.2 0 2.3.7 3.2 1.8C9.3 6.7 10.4 6 11.6 6c1.8 0 3.2 1.4 3.2 3.2 0 2.5-2 4.7-6.4 7.8z" fill="currentColor" /><path d="M14.4 5.4c2.4-.2 4 1.3 4 3.3 0 1.4-.8 2.7-2.3 4.1" stroke="currentColor" strokeWidth="1.9" {...st} /></svg>) },
  { id: "thanks", labelKey: "expr.thanks", quick: false, group: "warmth", family: "warmth", energy: "warm", mass: "normal", accent: "#D08472",
    pose: { rotate: 13, y: 4, scale: 0.95, origin: "50% 100%" }, fuse: "warm", markAt: "cradle",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 24 24" aria-hidden><path d="M4.4 15.4c2.2 3 4.8 4.5 7.6 4.5s5.4-1.5 7.6-4.5" stroke="currentColor" strokeWidth="2.5" {...st} /></svg>) },
  { id: "touched", labelKey: "expr.touched", quick: false, group: "warmth", family: "warmth", energy: "quiet", mass: "heavy", accent: "#C67E97",
    pose: { scale: 0.9, y: 4, rotate: 8, origin: "50% 100%" }, fuse: "warm", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><circle cx="10" cy="10" r="2" fill="currentColor" /><path d="M14.4 5.6a6.2 6.2 0 0 1 0 8.8M17.6 2.4a10.8 10.8 0 0 1 0 15.2" stroke="currentColor" strokeWidth="1.9" {...st} /></svg>) },
  { id: "withyou", labelKey: "expr.withYou", quick: false, group: "warmth", family: "connection", energy: "quiet", mass: "heavy", accent: "#57A08B",
    pose: { scale: 1.0, x: -2, origin: "50% 100%" }, fuse: "steady", markAt: "cradle",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 24 24" aria-hidden><path d="M2.6 19.4c0-3.4 2.4-5.6 5.4-5.6s5.4 2.2 5.4 5.6M13 19.4c0-3.4 2.2-5.6 4.6-5.6 1.5 0 2.9.6 3.8 1.7" stroke="currentColor" strokeWidth="2.4" {...st} /></svg>) },

  // ---- THOUGHT / CONNECTION (extended) ----
  { id: "respect", labelKey: "expr.respect", quick: false, group: "thought", family: "connection", energy: "quiet", mass: "heavy", accent: "#4C9AA0",
    pose: { rotate: 0, y: -1, scale: 1.0, origin: "50% 100%" }, fuse: "calm", markAt: "cradle",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 24 24" aria-hidden><path d="M5 19h14M8.2 19c-2.4-1.6-3.6-3.7-3.9-6.4M15.8 19c2.4-1.6 3.6-3.7 3.9-6.4" stroke="currentColor" strokeWidth="2.4" {...st} /></svg>) },
  { id: "inspired", labelKey: "expr.inspired", quick: false, group: "thought", family: "wonder", energy: "warm", mass: "normal", accent: "#58AECB",
    pose: { y: -7, scale: 1.04, rotate: -3, origin: "50% 100%" }, fuse: "lift", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M5 11.6 10 6.4l5 5.2M5 17 10 11.8l5 5.2" stroke="currentColor" strokeWidth="2.3" {...st} /></svg>) },
  { id: "curious", labelKey: "expr.curious", quick: false, group: "thought", family: "wonder", energy: "quiet", mass: "normal", accent: "#6E8BC4",
    pose: { rotate: -16, y: 0, scale: 0.99, origin: "50% 95%" }, fuse: "calm", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M5.6 14.6c-2.4-2.4-2.4-6.2 0-8.6M9.4 12.4c-1.2-1.2-1.2-3.2 0-4.4" stroke="currentColor" strokeWidth="2.2" {...st} /><circle cx="14.4" cy="10.2" r="1.7" fill="currentColor" /></svg>) },
  { id: "agree", labelKey: "expr.agree", quick: false, group: "thought", family: "connection", energy: "quiet", mass: "heavy", accent: "#4EA062",
    pose: { y: 2, scale: 1.0, rotate: 5, origin: "50% 100%" }, fuse: "steady", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M3.6 10.8 8 15.2 16.6 5.4" stroke="currentColor" strokeWidth="2.6" {...st} /></svg>) },
  { id: "thinking", labelKey: "expr.thinking", quick: false, group: "thought", family: "wonder", energy: "quiet", mass: "normal", accent: "#7F93B8",
    pose: { rotate: -10, y: 1, scale: 0.98, origin: "50% 95%" }, fuse: "calm", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><circle cx="5.4" cy="14.6" r="1.5" fill="currentColor" /><circle cx="10" cy="11.4" r="2" fill="currentColor" /><circle cx="15" cy="7.2" r="2.6" fill="currentColor" /></svg>) },
  { id: "nostalgia", labelKey: "expr.nostalgia", quick: false, group: "thought", family: "warmth", energy: "quiet", mass: "heavy", accent: "#B78D80",
    pose: { rotate: 6, y: 3, scale: 0.95, origin: "50% 100%" }, fuse: "warm", markAt: "tr",
    mark: (s) => (<svg width={s} height={s} viewBox="0 0 20 20" aria-hidden><path d="M3.4 10a6.6 6.6 0 1 0 2-4.7" stroke="currentColor" strokeWidth="2.2" {...st} /><path d="M2.6 2.8v3.8h3.8" stroke="currentColor" strokeWidth="2.2" {...st} /><path d="M10 6.8V10l2.4 1.6" stroke="currentColor" strokeWidth="2" {...st} /></svg>) },
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
  const warm = () => { for (const d of QUICK) { new Image().src = mascotSrc(d.id, "md"); new Image().src = coreSrc(d.id); } };
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
  if (id && RENDERED.has(id)) return `/brand/expressions/${id}-${bucket}.webp`;
  // R3.8 — at body scale the un-rendered state is the VESSEL: the mascot with its dormant,
  // empty chamber (a core can be received). The face crop keeps the neutral head.
  return bucket === "sm" ? "/brand/expressions/neutral-sm.webp" : `/brand/expressions/neutral-chamber-${bucket}.webp`;
}
/** R3.8 — the emotion as a small lit CORE OBJECT (the extended twelve are provisional family orbs). */
export const coreSrc = (id: ExpressionId) => `/brand/expressions/${id}-core.webp`;
/** R3.8 §11 — the lens is an OBLIQUE CHAMBER APERTURE, not a circle: rotated ellipse, in px. */
export function lensClip(px: number) {
  const cx = px / 2, cy = px / 2, rx = px * 0.5, ry = px * 0.44, th = -12;
  const c = Math.cos((th * Math.PI) / 180), sn = Math.sin((th * Math.PI) / 180);
  const x1 = (cx + rx * c).toFixed(2), y1 = (cy + rx * sn).toFixed(2), x2 = (cx - rx * c).toFixed(2), y2 = (cy - rx * sn).toFixed(2);
  return `path("M ${x1} ${y1} A ${rx} ${ry} ${th} 1 1 ${x2} ${y2} A ${rx} ${ry} ${th} 1 1 ${x1} ${y1} Z")`;
}
/**
 * R3.9.1 — the SIGNET RING. The aperture keeps its oblique chamber identity (an ellipse at
 * −12°, never a generic circular badge), machined from theme metal (`--sig-*` tokens: warm
 * brass on Solar Observatory, dark steel on Deep Cosmos), with the EMOTION'S OWN LIGHT on the
 * top arc — the rim lit by the core seated inside (physics, not decoration) — and the scarce
 * Boom-red segment on the lower rim for ownership.
 */
function LensShell({ px, owned, accent }: { px: number; owned: boolean; accent?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const cx = px / 2, cy = px / 2, rx = px * 0.5 - 0.6, ry = px * 0.46 - 0.6;
  const sw = Math.max(1.8, px * 0.075);
  return (
    <svg aria-hidden className="sb-lens-shell pointer-events-none absolute inset-0" width={px} height={px} viewBox={`0 0 ${px} ${px}`}>
      <defs>
        <linearGradient id={`m${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--sig-lo)" }} />
          <stop offset="52%" style={{ stopColor: "var(--sig-mid)" }} />
          <stop offset="100%" style={{ stopColor: "var(--sig-hi)" }} />
        </linearGradient>
      </defs>
      <g transform={`rotate(-12 ${cx} ${cy})`}>
        {/* dark parting line seating the ring against the page */}
        <ellipse cx={cx} cy={cy} rx={rx + 0.5} ry={ry + 0.5} fill="none" stroke="var(--sig-edge)" strokeWidth="1" />
        {/* the machined metal ring */}
        <ellipse cx={cx} cy={cy} rx={rx - sw / 2 + 0.5} ry={ry - sw / 2 + 0.5} fill="none" stroke={`url(#m${uid})`} strokeWidth={sw} />
        {/* the emotion's light on the rim — brightest at the top, dying along the sides (§16) */}
        {accent && (
          <path data-sb-sig-light d={`M ${cx - rx * 0.62} ${cy - ry * 0.72} A ${rx - sw / 2} ${ry - sw / 2} 0 0 1 ${cx + rx * 0.62} ${cy - ry * 0.72}`} fill="none" stroke={accent} strokeOpacity=".9" strokeWidth={Math.max(1.3, sw * 0.62)} strokeLinecap="round" />
        )}
        {/* ownership: the scarce Boom-red segment, machined into the lower rim */}
        {owned && <path data-sb-own-mark d={`M ${cx - rx * 0.42} ${cy + ry * 0.86} A ${rx - sw / 2} ${ry - sw / 2} 0 0 0 ${cx + rx * 0.42} ${cy + ry * 0.86}`} fill="none" stroke="var(--boom)" strokeWidth={Math.max(1.4, sw * 0.66)} strokeLinecap="round" />}
      </g>
    </svg>
  );
}

/* ───────────────────────────── R3.3 — THE BOOM LENS ─────────────────────────────
 * SYSTEMBOOM's second expression primitive. The LIVING MASCOT is for choosing a feeling
 * (deck, library, large preview); the BOOM LENS is for SUMMARISING human feeling — the
 * selected compact state, the Moment's Human Pulse, the Expression Spectrum and the
 * who-expressed lists. A tiny precision optical object: physical rim, material lens
 * surface, a dedicated HALF-FACE optical crop (brow · eye · mouth edge · fuse cue — never
 * the whole bomb shrunk to 24px), one restrained semantic mark seated IN the rim, and an
 * optional scarce Boom-red ownership segment. No glassmorphism, no blur, no glow.
 */
export type LensTier = "xs" | "sm" | "md";
const LENS_PX: Record<LensTier, number> = { xs: 22, sm: 28, md: 40 };

/** Per-expression lens render once it exists; the neutral optical crop until then (§24).
    R3.9.1: the UI's resting lens is the Emotion Signet (coreSrc); these optical crops remain
    the documented slot for the true facial renders and are still built by the compositor. */
export function lensSrc(id: ExpressionId | undefined, tier: LensTier) {
  return id && RENDERED.has(id) ? `/brand/expressions/${id}-lens-${tier}.webp` : `/brand/expressions/neutral-lens-${tier}.webp`;
}

/* R3.9.1 — the rim chip micro-glyphs are retired: the SIGNET's orb IS the semantic object
   at every scale, so a second tiny symbol beside it was redundancy (owner-superseded; the
   invariant — never a floating sticker — is unchanged and still asserted). */

/**
 * §21–§23 — deterministic MICRO-VARIANT. Three presentation leans per expression so a
 * detailed list never reads as one cloned character, chosen from stable inputs (person ·
 * Moment · expression) — the same person's expression never changes between opens, and the
 * emotional face itself never varies.
 */
export function lensVariant(...parts: string[]): 0 | 1 | 2 {
  let h = 0;
  for (const ch of parts.join("|")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (h % 3) as 0 | 1 | 2;
}
const VARIANT_LEAN = [-2.5, 0, 2.5];

export function BoomLens({ id, tier = "xs", size, owned = false, variant, pulse = false, land = false, className = "" }: {
  id: ExpressionId;
  tier?: LensTier;
  size?: number;
  owned?: boolean;
  variant?: 0 | 1 | 2;
  /** the full one-shot (entry + gesture + mass + ring) — R3.3 §26 */
  pulse?: boolean;
  /** R3.8 §9–§10 — LANDING: the orb has just arrived from the vessel; a thump + ring only */
  land?: boolean;
  className?: string;
}) {
  const def = expressionDef(id)!;
  const px = size ?? LENS_PX[tier];
  const lean = variant === undefined ? 0 : VARIANT_LEAN[variant];
  const ms = durationOf(def);
  const pulseTo = def.mass === "heavy" ? 1.62 : def.mass === "light" ? 2.02 : 1.85;
  const active = pulse || land;
  const anim = pulse ? `sb-expr-in ${def.quick ? `sb-g-${def.id}` : `sb-energy-${def.energy}`}` : land ? "sb-lens-land" : "";
  return (
    <span
      data-sb-lens={id}
      data-sb-lens-tier={tier}
      data-sb-lens-family={def.family}
      data-sb-lens-owned={owned ? "" : undefined}
      data-sb-lens-variant={variant}
      data-sb-lens-shape="chamber"
      className={`sb-lens relative inline-block shrink-0 align-middle ${className}`}
      style={{ width: px, height: px, color: def.accent }}
    >
      {active && (
        <span aria-hidden className="sb-boom-pulse absolute inset-[-12%] rounded-full" style={{ border: `1.5px solid ${def.accent}`, animationDuration: `${land ? 240 : ms + 60}ms`, ["--pulse-to" as string]: pulseTo }} />
      )}
      {/* R3.9.1 EMOTION SIGNET — the resting lens is the EXACT core object the person touched
          on the horizon, seated in the oblique chamber aperture: emotion first, shell second.
          The seat keeps the aperture's clip and its inset machined shading; the orb sits IN it. */}
      <span aria-hidden className={`sb-lens-surface sb-signet-seat relative block h-full w-full ${anim}`} style={{ clipPath: lensClip(px), animationDuration: active ? `${land ? 220 : ms}ms` : undefined }}>
        {active && RENDERED.has(id) && (
          <span className="sb-core-in pointer-events-none absolute inset-0" style={{ animationDuration: `${land ? 200 : Math.min(320, ms)}ms`, background: `radial-gradient(circle at 50% 42%, ${def.accent} 0%, transparent 46%)` }} />
        )}
        <span className={`block h-full w-full ${active ? `sb-mass sb-mass-${def.mass}` : ""}`} style={land ? { animationDuration: "240ms" } : undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coreSrc(id)} alt="" draggable={false} decoding="async" width={px} height={px} className="sb-signet-orb block h-full w-full select-none object-contain" style={lean ? { transform: `rotate(${lean * 2.2}deg)` } : undefined} />
        </span>
      </span>
      <LensShell px={px} owned={owned} accent={def.accent} />
    </span>
  );
}

/** R3.8 §12 — the DORMANT chamber: the closed control before any feeling is chosen. Same
    aperture, empty bore — a vessel that can receive a core, never a face pre-stating one. */
export function DormantLens({ size }: { size: number }) {
  return (
    <span aria-hidden data-sb-lens-dormant data-sb-lens-shape="chamber" className="sb-lens relative inline-block shrink-0 align-middle" style={{ width: size, height: size }}>
      <span className="sb-lens-surface relative block h-full w-full" style={{ clipPath: lensClip(size) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/expressions/neutral-chamber-lens-sm.webp" alt="" draggable={false} width={size} height={size} data-sb-express-neutral className="block h-full w-full select-none object-cover" style={{ opacity: 0.92 }} />
      </span>
      <LensShell px={size} owned={false} />
    </span>
  );
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
export function MascotExpression({ id, size, animate = false, marks = true, preview = false, entry = "arrive", ignite = false, className = "" }: { id: ExpressionId; size: number; animate?: boolean; marks?: boolean; preview?: boolean; entry?: "arrive" | "lock"; ignite?: boolean; className?: string }) {
  const def = expressionDef(id)!;
  const markSize = Math.round(size * (def.markAt === "cradle" ? 0.40 : 0.32));
  const cradle = def.markAt === "cradle";
  const ms = durationOf(def);
  const bucket = size <= 30 ? "sm" : size <= 90 ? "md" : "lg";
  // R3.2 self-critique — the POSE is BODY language. The `sm` tier is a face crop with no
  // body in it, so applying a body rotation/lift there only tilts and clips a head: the
  // committed control was showing a cropped jaw. At face scale the FACE is the whole state.
  const body = bucket !== "sm";
  // R3.7 — the chamber is a second layer only where there IS a chamber: rendered art, body tiers.
  const chamber = body && RENDERED.has(id);
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
      {/* R3.8 §9 — `entry="lock"`: the vessel is already on stage; the shell ABSORBS the core
          (a short contraction → release) instead of arriving from nothing */}
      <span aria-hidden className={`block h-full w-full ${animate ? `${entry === "lock" ? "sb-lock" : "sb-expr-in"} ${def.quick ? `sb-g-${def.id}` : `sb-energy-${def.energy}`}` : ""}`} style={{ animationDuration: animate ? `${ms}ms` : undefined }}>
        <span className={`${animate ? `sb-mass sb-mass-${def.mass}` : "block h-full w-full"}`}>
          <span className="relative block h-full w-full" style={{ transform: pose, transformOrigin: def.pose.origin ?? "50% 100%" }} data-sb-pose={id} data-sb-pose-applied={body ? "body" : "face"}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mascotSrc(id, bucket)} alt="" draggable={false} decoding="async" width={size} height={size} className="block h-full w-full select-none object-contain" />
            {/* R3.7 §2/§14 — the CORE LAYER: the same artwork clipped to the opening, so the
                chamber has real depth: on a pointer preview the shell rises and the core lags
                it by ~1.5px (inertia — the core is inside, further from the light). Never
                scroll-linked, never passive; reduced motion removes the offset entirely. */}
            {chamber && (
              <span aria-hidden data-sb-core-layer className="sb-core-layer pointer-events-none absolute inset-0 block h-full w-full" style={{ backgroundImage: `url(${mascotSrc(id, bucket)})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center", clipPath: `ellipse(${OPENING_AT.rx}% ${OPENING_AT.ry}% at ${OPENING_AT.x}% ${OPENING_AT.y}%)` }} />
            )}
            {/* R3.7 §6–§7 — PREVIEW wakes the chamber: one short (~120ms) per-expression light
                event INSIDE the opening — Care fills, Joy radiates, Laugh compresses/releases,
                Wow contracts→snaps, Celebrate rises, Support closes. Never the expression. */}
            {chamber && preview && (
              <span aria-hidden data-sb-core-wake={id} className={`sb-core-wake sb-cw-${id}`} style={{ left: `${OPENING_AT.x}%`, top: `${OPENING_AT.y}%`, width: `${OPENING_AT.rx * 2.1}%`, height: `${OPENING_AT.ry * 2.1}%`, color: def.accent }} />
            )}
            {/* R3.8 §9 — IGNITION on commit: the core lights inside the opening (clipped to it) */}
            {chamber && animate && ignite && (
              <span aria-hidden data-sb-core-ignite={id} className="sb-core-in pointer-events-none absolute inset-0" style={{ animationDuration: `${Math.min(320, ms)}ms`, clipPath: `ellipse(${OPENING_AT.rx}% ${OPENING_AT.ry}% at ${OPENING_AT.x}% ${OPENING_AT.y}%)`, background: `radial-gradient(circle at ${OPENING_AT.x}% ${OPENING_AT.y}%, ${def.accent} 0%, transparent 16%)` }} />
            )}
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
            ? { color: def.accent, left: "50%", bottom: -Math.round(size * 0.05), transform: "translateX(-50%)", width: markSize, height: markSize, opacity: 0.86 }
            : { color: def.accent, top: -Math.round(size * 0.04), right: -Math.round(size * 0.04), width: markSize, height: markSize, opacity: 0.86 }}
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
 * R3.9 §7–§13 — THE EMOTIONAL EVENT. Mounted on the stage only while the vessel PERFORMS a
 * commit: the feeling escapes the chamber into the Moment's local space as real ENERGY forms
 * (the same drawings the chamber holds, rendered free with soft emission), staged in true
 * depth — background pieces pass BEHIND the vessel (z 0 < the vessel's 1), foreground toward
 * the viewer (z 3) — while the shell receives the emotion's light AT the chamber and the
 * ground a restrained reflection (light has a source, §16). Every element is one-shot and the
 * whole event is over before the lens lands. Reduced motion never mounts this component.
 */
function EmotionEvent({ id, px }: { id: ExpressionId; px: number }) {
  const def = expressionDef(id)!;
  const ms = durationOf(def);
  const cx = (OPENING_AT.x / 100) * px;
  const cy = (OPENING_AT.y / 100) * px;
  const E = "/brand/expressions";
  const piece = (role: string, cls: string, size: number, style: React.CSSProperties, src?: string, z = 2) => (
    <span key={role} aria-hidden data-sb-ev={role} className={`sb-ev ${cls}`} style={{ left: cx, top: cy, width: size, height: size, zIndex: z, ...(src ? { backgroundImage: `url(${E}/${src})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" } : {}), ...style }} />
  );
  // shared: the shell receives the core's light AT the chamber; the ground a weaker reflection
  const shellLight = piece("shell-light", "sb-ev-light", px * 0.62, { animationDuration: `${Math.min(420, ms + 60)}ms`, transform: "translate(-50%,-50%)", background: `radial-gradient(circle at 42% 40%, ${def.accent} 0%, transparent 62%)`, opacity: 0 }, undefined, 2);
  const groundLight = (
    <span key="ground" aria-hidden data-sb-ev="ground-light" className="sb-ev sb-ev-light" style={{ left: "50%", top: px * 0.99, width: px * 0.92, height: px * 0.24, zIndex: 0, transform: "translate(-50%,-50%)", animationDuration: `${Math.min(540, ms + 120)}ms`, background: `radial-gradient(closest-side, ${def.accent} 0%, transparent 68%)`, opacity: 0, filter: "opacity(.72)" }} />
  );
  // a light SWEEPING THE METAL is clipped to the vessel's own silhouette bounds — it must
  // never escape as a fog block over the Moment behind (critique pass 1, weakness #2)
  const sheen = (bg: string, dur: number, delay = 0) => (
    <span key="sheen" aria-hidden data-sb-ev="sheen" className="sb-ev" style={{ left: "50%", top: px * 0.5, width: px * 0.94, height: px * 0.94, transform: "translate(-50%,-50%)", borderRadius: "50%", overflow: "hidden", zIndex: 2 }}>
      <span className="sb-ev sb-ev-sheen" style={{ position: "absolute", inset: 0, animationDuration: `${dur}ms`, animationDelay: `${delay}ms`, background: bg }} />
    </span>
  );
  const parts: React.ReactNode[] = [shellLight, groundLight];
  if (id === "care") {
    // §8 HERO — one large dimensional heart toward the viewer, two smaller at other depths
    parts.push(
      piece("emotion-fg", "sb-ev-emerge", px * 0.66, { animationDuration: `${ms * 1.15}ms`, animationDelay: "40ms", ["--tx" as string]: `${-px * 0.18}px`, ["--ty" as string]: `${-px * 0.44}px`, ["--s0" as string]: 0.28, ["--s1" as string]: 1.16 }, "care-energy.webp", 3),
      piece("emotion-bg", "sb-ev-emerge", px * 0.26, { animationDuration: `${ms * 0.85}ms`, animationDelay: "120ms", ["--tx" as string]: `${-px * 0.52}px`, ["--ty" as string]: `${-px * 0.30}px`, ["--s1" as string]: 0.9 }, "care-energy.webp", 0),
      piece("emotion-mg", "sb-ev-emerge", px * 0.2, { animationDuration: `${ms * 0.8}ms`, animationDelay: "180ms", ["--tx" as string]: `${px * 0.30}px`, ["--ty" as string]: `${-px * 0.34}px`, ["--s1" as string]: 0.85 }, "care-energy.webp", 2),
    );
  } else if (id === "joy") {
    // §9 — radiant, not explosive: four controlled rays of light leave the chamber
    [[-42, 0.40], [-10, 0.46], [22, 0.44], [52, 0.38]].forEach(([deg, d], i) => {
      const rad = ((deg as number) - 90) * (Math.PI / 180);
      parts.push(piece(`ray-${i}`, "sb-ev-emerge", px * 0.52, { animationDuration: `${ms * 0.85}ms`, animationDelay: `${40 + i * 26}ms`, rotate: `${deg}deg`, ["--tx" as string]: `${Math.cos(rad) * px * (d as number)}px`, ["--ty" as string]: `${Math.sin(rad) * px * (d as number)}px`, ["--s0" as string]: 0.25, ["--s1" as string]: 1.05 }, "joy-ray.webp", i === 1 ? 3 : i % 2 ? 2 : 0));
    });
    parts.push(sheen("linear-gradient(100deg, transparent 30%, rgba(255,236,180,.4) 50%, transparent 70%)", ms * 0.9, 60));
  } else if (id === "laugh") {
    // §10 — two rhythmic resonance waves + ONE transparent droplet; no looping shake
    parts.push(
      piece("wave-1", "sb-ev-wave", px * 0.7, { animationDuration: `${ms * 0.72}ms`, animationDelay: "40ms", ["--s1" as string]: 1.5 }, "laugh-wave.webp", 2),
      piece("wave-2", "sb-ev-wave", px * 0.7, { animationDuration: `${ms * 0.72}ms`, animationDelay: `${40 + ms * 0.22}ms`, ["--s1" as string]: 1.9 }, "laugh-wave.webp", 0),
      piece("droplet", "sb-ev-drop", px * 0.11, { left: px * 0.40, top: px * 0.62, animationDuration: `${ms * 0.7}ms`, animationDelay: `${ms * 0.3}ms`, background: "radial-gradient(circle at 38% 30%, #ffffff 0%, #bfe0ff 45%, rgba(94,158,214,.85) 100%)", borderRadius: "50% 50% 60% 60%" }, undefined, 3),
    );
  } else if (id === "wow") {
    // §11 — collapse → rapid expansion: one restrained pressure ring + a cool reflection
    parts.push(
      piece("pressure", "sb-ev-wave", px * 0.6, { animationDuration: `${ms * 0.62}ms`, animationDelay: "30ms", ["--s0" as string]: 0.3, ["--s1" as string]: 1.8, border: `1.5px solid ${def.accent}`, borderRadius: "50%", opacity: 0 }, undefined, 3),
      sheen("linear-gradient(100deg, transparent 32%, rgba(180,215,255,.46) 50%, transparent 68%)", ms * 0.7),
    );
  } else if (id === "celebrate") {
    // §12 — a local controlled spark bloom: five embers on believable arcs, gone quickly
    [[-0.34, -0.4, -0.5, -0.06], [-0.12, -0.5, -0.16, -0.1], [0.12, -0.48, 0.2, -0.04], [0.3, -0.36, 0.46, 0.02], [-0.02, -0.42, 0.05, 0.06]].forEach(([mx, my, tx, ty], i) => {
      parts.push(piece(`ember-${i}`, "sb-ev-arc", px * (i === 1 ? 0.16 : 0.12), { animationDuration: `${ms * 0.72}ms`, animationDelay: `${50 + i * 24}ms`, ["--mx" as string]: `${(mx as number) * px}px`, ["--my" as string]: `${(my as number) * px}px`, ["--tx" as string]: `${(tx as number) * px}px`, ["--ty" as string]: `${(ty as number) * px}px` }, "celebrate-ember.webp", i % 2 ? 3 : 0));
    });
  } else if (id === "support") {
    // §13 — the most mature event: two structures close gently around the orb; energy settles DOWN
    parts.push(
      piece("arc-left", "sb-ev-close", px * 0.6, { animationDuration: `${ms}ms`, animationDelay: "40ms", ["--fx" as string]: `${-px * 0.2}px`, ["--fy" as string]: `${-px * 0.08}px`, ["--r0" as string]: "-24deg" }, "support-arc.webp", 3),
      piece("arc-right", "sb-ev-close", px * 0.6, { animationDuration: `${ms}ms`, animationDelay: "80ms", ["--fx" as string]: `${px * 0.2}px`, ["--fy" as string]: `${-px * 0.08}px`, ["--sx" as string]: -1, ["--r0" as string]: "24deg" }, "support-arc.webp", 2),
    );
  }
  return <span aria-hidden data-sb-emotion-event={id} className="pointer-events-none absolute inset-0" style={{ color: def.accent }}>{parts}</span>;
}

/**
 * The one compact Expression entry beside Respond (§25 of R3). R3.8 — the EMOTION HORIZON:
 * tap → ONE vessel mascot appears on a stage with six CORE OBJECTS on a shallow horizon
 * below it. Preview moves a core toward the chamber and the vessel shows that feeling;
 * commit sends the core INTO the chamber (the shell locks it, the vessel performs, one Boom
 * Pulse), the unused cores recede, and the activated chamber collapses into the Boom Lens
 * beside Respond — one object changing scale. "More" is the EMOTION ATLAS: the same vessel,
 * all eighteen as cores in four family bands. Never six (or eighteen) mascot clones. Never
 * rendered on Health/Problem — the caller gates on quiet kinds (§17, §90 of R3).
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
  /** §9 stage 1 — the chosen CORE accelerates into the chamber (a clone flies; the real one hides). */
  const [coreFlight, setCoreFlight] = useState<null | { id: ExpressionId; x: number; y: number; d: number; s: number; dx: number; dy: number }>(null);
  /** §9 stage 2 — the vessel PERFORMS the feeling (lock → gesture → fuse → Boom Pulse). */
  const [performing, setPerforming] = useState<ExpressionId | null>(null);
  /** §9–§10 stage 3 — the activated chamber collapses into the lens beside Respond. */
  const [flight, setFlight] = useState<null | { id: ExpressionId; dx: number; dy: number; s: number; x: number; y: number }>(null);
  const [landing, setLanding] = useState(false);
  const [closing, setClosing] = useState(false);
  /** R3.7 §6 RETOUCH — tapping the committed control answers with a small core + rim response. */
  const [retouch, setRetouch] = useState(false);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const clearTimers = () => { timers.current.forEach((x) => window.clearTimeout(x)); timers.current = []; };
  useEffect(() => () => clearTimers(), []);
  /** phone vs desktop, measured at open time from the real frame (the surface is transient) */
  const [phone, setPhone] = useState(false);
  const heroPx = phone ? 88 : 100;
  // phone: 6 × 46 + gaps + 16 padding = 297 ≤ the 304 a 320-wide frame leaves (r3-1 §8 caught 48)
  const corePx = phone ? 36 : 44;
  const hitPx = phone ? 46 : 56;
  const LENS_CTRL = 36;
  const [announce, setAnnounce] = useState("");
  const wrap = useRef<HTMLSpanElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLSpanElement>(null);
  const mine = (moment.expressions ?? {})[me.id] as ExpressionId | undefined;
  const mineDef = mine ? expressionDef(mine) : undefined;

  useEffect(() => {
    if (!open) return;
    const b = btn.current;
    if (b) {
      // Both surfaces hang from the control's left edge and are clamped into the frame.
      const frame = (b.closest("[data-sb-social-frame]") ?? document.documentElement).getBoundingClientRect();
      // layout width, not the bounding box — the surface is mid-way through its scale-in
      // when this runs, and a transformed box under-reports by up to 6% (a real 360 overflow)
      const w = rail.current?.offsetWidth ?? Math.min(more ? 436 : 400, frame.width * 0.94);
      const over = b.getBoundingClientRect().left + w - (frame.right - 8);
      setShift(over > 0 ? -Math.ceil(over) : 0);
    }
    // §25 — the atlas opens ABOVE the control, so its scroller may never be taller than the
    // room actually available there (minus the vessel on stage).
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

  /** the chamber opening's viewport position on the vessel currently on stage */
  const openingAt = () => {
    const a = stage.current?.getBoundingClientRect();
    if (!a) return null;
    return { x: a.left + (a.width * OPENING_AT.x) / 100, y: a.top + (a.height * OPENING_AT.y) / 100, d: a.width * (OPENING_AT.rx * 2) / 100 };
  };

  const finish = (id: ExpressionId | null) => {
    setClosing(false);
    setOpen(false);
    setMore(false);
    setPreview(null);
    setPerforming(null);
    setCoreFlight(null);
    setLanding(false);
    setPlayed((k) => (id ? k + 1 : 0));
    btn.current?.focus({ preventScroll: true });
  };

  const commit = (id: ExpressionId | null) => {
    dispatch({ type: "express", id: moment.id, expression: id });
    setAnnounce(id ? t("expr.optionAria", { name: t(expressionDef(id)!.labelKey) }) : t("expr.remove"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const core = id ? rail.current?.querySelector<HTMLElement>(`[data-sb-expression-option='${id}'] [data-sb-core]`) : null;
    const opening = openingAt();
    if (!id || reduce || !core || !opening) { clearTimers(); finish(id); return; }
    // §9 — CORE SELECTED → core accelerates into the chamber (120ms) → shell locks it, the vessel
    // performs (gesture · fuse · Boom Pulse) → unused cores recede → the activated chamber
    // collapses into the compact Boom Lens (200ms). The truth (the store) changed above already;
    // the control's lens stays hidden until the chamber lands on it.
    clearTimers();
    const c = core.getBoundingClientRect();
    setCoreFlight({ id, x: opening.x - opening.d / 2, y: opening.y - opening.d / 2, d: Math.round(opening.d), s: c.width / opening.d, dx: c.left + c.width / 2 - opening.x, dy: c.top + c.height / 2 - opening.y });
    setLanding(true);
    setPreview(null);
    const tempo = durationOf(expressionDef(id)!);
    later(() => { setCoreFlight(null); setPerforming(id); }, 120);
    later(() => {
      const o = openingAt();
      const b = btn.current?.getBoundingClientRect();
      if (o && b) {
        const x = b.left + (b.width - LENS_CTRL) / 2;
        const y = b.top + (b.height - LENS_CTRL) / 2;
        setFlight({ id, x, y, s: o.d / LENS_CTRL, dx: o.x - (x + LENS_CTRL / 2), dy: o.y - (y + LENS_CTRL / 2) });
      }
      setClosing(true);
    }, 120 + Math.round(tempo * 0.7));
    later(() => finish(id), 120 + Math.round(tempo * 0.7) + 200);
  };

  const openDeck = () => {
    // a tap while the commit is still performing snaps it to its final state, then opens
    if (performing || coreFlight || flight) { clearTimers(); setFlight(null); finish(mine ?? null); }
    // A drag that commits arms `skipClick` for a click the browser then never delivers
    // (the surface unmounts first). Disarm on every open, or the next TAP would be swallowed.
    skipClick.current = false;
    clearTimers();
    setClosing(false);
    setLanding(false);
    const frame = btn.current?.closest("[data-sb-social-frame]");
    setPhone((frame?.getBoundingClientRect().width ?? window.innerWidth) < 672);
    // RETOUCH (§6): a committed control answers the tap with a small core + rim response
    if (mine && !open) {
      setRetouch(true);
      later(() => setRetouch(false), 220);
    }
    setOpen((v) => !v);
    setMore(false);
  };

  const move = (e: React.KeyboardEvent) => {
    const items = [...(rail.current?.querySelectorAll<HTMLElement>("[role=radio]") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    const cols = more ? 5 : items.length;
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
    onClick: () => { if (skipClick.current) { skipClick.current = false; return; } if (performing || coreFlight) return; commit(mine === def.id ? null : def.id); },
    onPointerEnter: () => setPreview(def.id),
    onPointerLeave: () => setPreview((v) => (v === def.id ? null : v)),
    onFocus: () => setPreview(def.id),
    onBlur: () => setPreview((v) => (v === def.id ? null : v)),
    "data-sb-expression-option": def.id,
    style: { ["--seat-accent" as string]: `color-mix(in srgb, ${def.accent} 34%, transparent)` },
  });

  /**
   * R3.8 §2–§4 — a CORE on the horizon: an invisible hit target (56px desktop / 48px phone)
   * holding one small lit orb (44 / 38px). The six sit on a shallow horizon below the vessel —
   * the outer ones a little higher, so the line wraps around its base. Preview: the core rises
   * and leans toward the chamber. The chosen core rests inside an orbit ring in its accent with
   * the Boom notch. REVEAL: the six rise into position, 12ms stagger, ≤180ms.
   */
  const horizonY = (i: number) => (phone ? 0 : -Math.round(Math.abs(i - 2.5) * 2.4));
  const coreBtn = (def: ExpressionDef, i: number) => {
    const own = mine === def.id;
    const gone = coreFlight?.id === def.id || performing === def.id;
    return (
      <button
        key={def.id}
        {...common(def)}
        className={`sb-core sb-press relative grid shrink-0 place-items-center rounded-full focus-visible:outline-[var(--focus)] ${own ? "sb-seat-own sb-core-own" : ""}`}
        style={{ ...common(def).style, width: hitPx, height: hitPx, translate: `0 ${horizonY(i)}px`, ["--toward" as string]: i < 3 ? 1 : -1 }}
        data-sb-previewing={preview === def.id && preview !== mine ? "" : undefined}
        data-sb-horizon-index={i}
      >
        {own && <span aria-hidden data-sb-seat-orbit className="sb-seat-orbit sb-core-orbit pointer-events-none absolute" style={{ boxShadow: `inset 0 0 0 2px color-mix(in srgb, ${def.accent} 62%, transparent)` }} />}
        <span className="sb-core-body sb-rise-in block" style={{ animationDelay: `${i * 12}ms` }}>
          <span data-sb-core={def.id} className="sb-core-obj relative block" style={{ width: corePx, height: corePx, visibility: gone ? "hidden" : undefined }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coreSrc(def.id)} alt="" draggable={false} decoding="async" width={corePx} height={corePx} className="block h-full w-full select-none" />
          </span>
        </span>
        {own && <span aria-hidden data-sb-own-mark className="absolute bottom-[2px] left-1/2 h-[6px] w-[6px] -translate-x-1/2 rotate-45 rounded-[1.5px]" style={{ background: "var(--boom)" }} />}
      </button>
    );
  };

  /** R3.8 §13 — an ATLAS core: the orb with its name beneath, no card; preview in the same vessel. */
  const atlasCore = (def: ExpressionDef, i: number) => {
    const own = mine === def.id;
    const gone = coreFlight?.id === def.id || performing === def.id;
    return (
      <button
        key={def.id}
        {...common(def)}
        style={{ ...common(def).style, animationDelay: `${Math.min(i * 14, 240)}ms` }}
        className={`sb-lib-cell sb-core sb-tile-in sb-press relative flex flex-col items-center justify-start gap-1 rounded-[14px] px-0.5 pt-1.5 pb-1 focus-visible:outline-[var(--focus)] ${own ? "sb-lib-cell-own sb-core-own" : ""}`}
        data-sb-previewing={preview === def.id && preview !== mine ? "" : undefined}
      >
        {own && <span aria-hidden data-sb-seat-orbit className="sb-seat-orbit sb-core-orbit sb-core-orbit-atlas pointer-events-none absolute" style={{ boxShadow: `inset 0 0 0 2px color-mix(in srgb, ${def.accent} 62%, transparent)` }} />}
        <span className="sb-core-body block">
          <span data-sb-core={def.id} className="sb-core-obj relative block" style={{ width: 40, height: 40, visibility: gone ? "hidden" : undefined }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coreSrc(def.id)} alt="" draggable={false} decoding="async" width={40} height={40} className="block h-full w-full select-none" />
          </span>
        </span>
        <span className={`max-w-full truncate text-[11px] leading-tight font-semibold ${own ? "text-text" : "text-muted"}`}>{t(def.labelKey)}</span>
        {own && <span aria-hidden data-sb-own-mark className="absolute right-1 bottom-[18px] h-[5px] w-[5px] rotate-45 rounded-[1px]" style={{ background: "var(--boom)" }} />}
      </button>
    );
  };

  // §13 — four family bands: warmth · energy · wonder · connection. LIBRARY (canonical) unchanged.
  const bands: [ExpressionFamily, ExpressionDef[]][] = FAMILY_ORDER.map((f) => [f, LIBRARY.filter((e) => e.family === f)]);
  const captionId = performing ?? preview ?? mine ?? null;
  /** the vessel on stage: performing → the previewed → the owned → dormant */
  const heroId: ExpressionId | null = performing ?? preview ?? mine ?? null;

  /**
   * R3.2 §24–§25 — DRAG PREVIEW. Holding and sliding across the horizon previews each core in
   * the vessel; the expression commits only on an intentional release. Tap is untouched.
   */
  const dragFrom = useRef<string | null>(null);
  const dragOver = useRef<string | null>(null);
  const skipClick = useRef(false);
  // a finger between two cores is still on the horizon: fall back to the nearest core when the
  // point lands in a gap inside the radiogroup (the old 3×2 grid had no gaps to fall into)
  const seatAt = (x: number, y: number) => {
    const hit = (document.elementFromPoint(x, y)?.closest("[data-sb-expression-option]") as HTMLElement | null)?.getAttribute("data-sb-expression-option");
    if (hit) return hit;
    const group = rail.current?.querySelector<HTMLElement>("[role=radiogroup]");
    const g = group?.getBoundingClientRect();
    if (!group || !g || x < g.left - 8 || x > g.right + 8 || y < g.top - 8 || y > g.bottom + 8) return null;
    let best: HTMLElement | null = null, bd = Infinity;
    group.querySelectorAll<HTMLElement>("[data-sb-expression-option]").forEach((o) => {
      const r = o.getBoundingClientRect();
      const d = Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
      if (d < bd) { bd = d; best = o; }
    });
    return bd <= 12 && best ? (best as HTMLElement).getAttribute("data-sb-expression-option") : null;
  };
  const dragHandlers = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragFrom.current = seatAt(e.clientX, e.clientY);
      dragOver.current = dragFrom.current;
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!dragFrom.current) return;
      const over = seatAt(e.clientX, e.clientY);
      // always re-assert: stepping from a core into the gap beside it fires that core's
      // pointerleave (which clears the preview) while the nearest core is still the same one
      if (over) {
        dragOver.current = over;
        setPreview(over as ExpressionId);
      }
    },
    onPointerUp: (e: React.PointerEvent) => {
      const from = dragFrom.current;
      const over = seatAt(e.clientX, e.clientY);
      dragFrom.current = null;
      dragOver.current = null;
      if (from && over && over !== from) {
        skipClick.current = true;
        commit(over as ExpressionId);
      }
    },
    onPointerCancel: () => { dragFrom.current = null; dragOver.current = null; },
  };

  /** §5 — the single hero vessel on its stage: grounded by a contact shadow, previewing the
      core under attention, performing on commit. Dormant = the empty chamber. */
  const stageEl = (
    <div className="sb-stage relative flex justify-center pt-1 pb-1" data-sb-horizon-stage={heroId ?? "neutral"} data-sb-performing={performing ?? undefined}>
      <span ref={stage} className={`sb-stage-art relative block ${!performing && preview ? "sb-hero-preview" : ""}`} style={{ width: heroPx, height: heroPx }} key={performing ? `perf-${performing}` : "stage"}>
        {heroId ? (
          <MascotExpression key={performing ? `p-${performing}` : `v-${heroId}`} id={heroId} size={heroPx} marks={false} preview={!performing && preview === heroId} animate={!!performing} entry="lock" ignite={!!performing} className="relative z-[1]" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/brand/expressions/neutral-chamber-${heroPx > 90 ? "lg" : "md"}.webp`} alt="" aria-hidden draggable={false} width={heroPx} height={heroPx} data-sb-vessel-dormant className="relative z-[1] block h-full w-full select-none object-contain" />
        )}
        {performing && <EmotionEvent id={performing} px={heroPx} />}
      </span>
    </div>
  );

  const header = (
    <div className="flex items-center gap-1 px-1">
      <p className={`min-w-0 flex-1 truncate text-[13px] leading-6 font-semibold ${captionId ? "text-text" : "text-muted"}`} data-sb-deck-caption>
        {captionId ? t(expressionDef(captionId)!.labelKey) : t("expr.railAria")}
      </p>
      {mine && (
        <button type="button" onClick={() => commit(null)} className="sb-press inline-flex h-8 shrink-0 items-center rounded-full px-2 text-[12px] font-medium text-muted hover:text-text focus-visible:outline-[var(--focus)]" data-sb-expression-remove>
          {t("expr.remove")}
        </button>
      )}
      {!more && (
        <button type="button" onClick={() => setMore(true)} className="sb-press inline-flex h-8 shrink-0 items-center rounded-full border border-[var(--hair)] px-2.5 text-[12px] font-medium text-muted hover:bg-steel/12 hover:text-text focus-visible:outline-[var(--focus)]" data-sb-expression-more>
          {t("expr.more")}
        </button>
      )}
    </div>
  );

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
        className={`sb-press relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border focus-visible:outline-[var(--focus)] ${mineDef ? "sb-seat sb-seat-own sb-ctrl-own border-transparent @2xl:h-10 @2xl:w-10" : "border-[var(--hair)] hover:border-steel/60 @2xl:h-10 @2xl:w-10"}`}
        style={mineDef ? { ["--seat-accent" as string]: `color-mix(in srgb, ${mineDef.accent} 30%, transparent)`, boxShadow: `0 0 0 1.5px color-mix(in srgb, ${mineDef.accent} 30%, transparent)` } : undefined}
        data-sb-express={mine ?? ""}
        data-sb-retouch={retouch ? "" : undefined}
        data-sb-landing={landing ? "" : undefined}
      >
        {/* R3.8 §12 — closed, the control is the compact CHAMBER: dormant (empty bore) before a
            feeling is chosen, the selected Emotion Core inside it after. Never a tiny full mascot.
            The lens stays hidden while the chamber is still flying in from the vessel. */}
        {mineDef ? (
          <span className="inline-flex" style={landing ? { opacity: 0 } : undefined}>
            <BoomLens key={played} id={mineDef.id} tier="sm" size={LENS_CTRL} owned land={played > 0} />
          </span>
        ) : (
          <DormantLens size={LENS_CTRL} />
        )}
      </button>
      <span role="status" aria-live="polite" className="sr-only">{announce}</span>
      {/* §9 stage 1 — the chosen core, accelerating into the chamber */}
      {coreFlight && (
        <span
          aria-hidden
          data-sb-core-flight={coreFlight.id}
          className="sb-core-flight pointer-events-none fixed z-40"
          style={{ left: coreFlight.x, top: coreFlight.y, width: coreFlight.d, height: coreFlight.d, ["--fdx" as string]: `${coreFlight.dx}px`, ["--fdy" as string]: `${coreFlight.dy}px`, ["--fs" as string]: coreFlight.s }}
        >
          {/* a background span, not an <img>: a freshly mounted image element can paint its
              placeholder box for a frame before the cached bitmap lands — the flight must not */}
          <span className="block h-full w-full" style={{ backgroundImage: `url(${coreSrc(coreFlight.id)})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" }} />
        </span>
      )}
      {/* §9–§10 stage 3 — the activated chamber collapsing into the lens beside Respond */}
      {flight && (
        <span
          aria-hidden
          data-sb-lens-flight={flight.id}
          className="sb-lens-flight pointer-events-none fixed z-40"
          style={{ left: flight.x, top: flight.y, width: LENS_CTRL, height: LENS_CTRL, ["--fdx" as string]: `${flight.dx}px`, ["--fdy" as string]: `${flight.dy}px`, ["--fs" as string]: flight.s }}
          onAnimationEnd={() => setFlight(null)}
        >
          {/* R3.9.1 — the ORB itself returns from the chamber into the aperture: one object */}
          <span className="block h-full w-full" style={{ backgroundImage: `url(${coreSrc(flight.id)})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" }} />
        </span>
      )}

      {open && !more && (
        <div
          ref={rail}
          style={{ left: shift }}
          className={`sb-horizon absolute bottom-full z-20 mb-1 pt-1.5 pb-2 ${phone ? "px-2" : "px-3"} ${closing ? "sb-dock-out pointer-events-none" : "sb-horizon-in"}`}
          data-sb-expression-rail
          data-sb-expression-deck
          data-sb-emotion-horizon
          data-sb-committing={performing || coreFlight ? "" : undefined}
          data-sb-closing={closing ? "" : undefined}
          aria-hidden={closing || undefined}
        >
          {header}
          {stageEl}
          <div
            role="radiogroup"
            aria-label={t("expr.railAria")}
            className="sb-horizon-line flex items-end justify-center gap-0.5"
            onKeyDown={move}
            onPointerLeave={() => setPreview(null)}
            {...dragHandlers}
            data-sb-deck-pattern="horizon"
          >
            {QUICK.map((d, i) => coreBtn(d, i))}
          </div>
        </div>
      )}

      {open && more && (
        <div
          ref={rail}
          style={{ left: shift }}
          className={`sb-horizon sb-atlas absolute bottom-full z-20 mb-1 w-[min(94vw,392px)] @2xl:w-[min(94vw,436px)] px-2.5 pt-1.5 pb-2 ${closing ? "sb-dock-out pointer-events-none" : "sb-horizon-in"}`}
          data-sb-expression-panel
          data-sb-expression-library
          data-sb-expression-field
          data-sb-emotion-atlas
          data-sb-committing={performing || coreFlight ? "" : undefined}
          data-sb-closing={closing ? "" : undefined}
          aria-hidden={closing || undefined}
        >
          {header}
          {stageEl}
          {/* all eighteen as CORES, named — this is how the language is learned (§25–§27) */}
          <div role="radiogroup" aria-label={t("expr.railAria")} style={{ maxHeight: Math.max(120, libMax - heroPx - 48) }}
            className="flex flex-col overflow-y-auto overscroll-contain" onKeyDown={move} onPointerLeave={() => setPreview(null)} {...dragHandlers}>
            {(() => { let n = 0; return bands.map(([family, sec], i) => (
              <div key={family} className={`sb-field-band grid grid-cols-5 gap-x-0.5 rounded-[14px] px-0.5 pb-0.5 ${i > 0 ? "mt-1 border-t border-[var(--hair)] pt-1.5" : ""}`} data-sb-field-band={family} style={{ ["--band-tone" as string]: FAMILY_TONE[family] }}>
                {sec.map((def) => atlasCore(def, n++))}
              </div>
            )); })()}
          </div>
        </div>
      )}
    </span>
  );
}

/**
 * HUMAN PULSE (R3.3 §7–§15) — how SYSTEMBOOM represents many people expressing feeling
 * around one Moment without repeating the mascot into visual noise. One quiet line: up to
 * THREE equal-size Boom Lenses (the viewer's own first, then the most represented types —
 * informational order only, never a winner) and the number of PEOPLE in human language.
 * 100 people choosing Care is ONE Care lens and "100 people", never 100 mascots and never a
 * bigger one. No per-expression counts in the feed, no passive animation, ever.
 *
 * Tap → the EXPRESSION SPECTRUM (§16–§18): every type actually present, same-size lenses,
 * localized names, functional counts, canonical order — no bars, no percentages, no ranking.
 * Selecting a type → PEOPLE WHO EXPRESSED THIS (§19–§20): a human surface — real photo +
 * viewer-safe Life Ring at identity scale, name, that person's lens with its deterministic
 * micro-variant. Never ranked.
 */
export function ExpressionSummary({ moment }: { moment: Moment }) {
  const { me, personOf } = useSocial();
  const { t, tp, locale } = useT();
  const [view, setView] = useState<null | "spectrum" | { who: ExpressionId }>(null);
  const [shown, setShown] = useState(24);
  // §36 — the panels hang from the pulse but must never leave the frame: at 320 the pulse
  // sits ~84px in and a 300px panel would overhang the right edge. Same clamp as the deck.
  const [shift, setShift] = useState(0);
  const wrap = useRef<HTMLSpanElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // §16/§39 — one stable semantic ordering: the canonical library order, zeros omitted.
  const entries = expressionEntries(moment);
  const counts = new Map<ExpressionId, number>();
  for (const [, id] of entries) counts.set(id, (counts.get(id) ?? 0) + 1);
  const libIndex = new Map(LIBRARY.map((d, i) => [d.id, i]));
  const present = [...counts.keys()].sort((x, y) => (libIndex.get(x) ?? 99) - (libIndex.get(y) ?? 99));
  const mine = (moment.expressions ?? {})[me.id] as ExpressionId | undefined;

  // §9–§10 — representatives: the viewer's expression first, then the most represented
  // distinct types (ties broken canonically). All equal size; ordering is information only.
  const reps: ExpressionId[] = mine && counts.has(mine) ? [mine] : [];
  for (const [id] of [...counts.entries()]
    .filter(([id]) => id !== mine)
    .sort((x, y) => y[1] - x[1] || (libIndex.get(x[0]) ?? 99) - (libIndex.get(y[0]) ?? 99))) {
    if (reps.length >= 3) break;
    reps.push(id);
  }

  useEffect(() => {
    if (!view) return;
    const b = btn.current;
    if (b) {
      const frame = (b.closest("[data-sb-social-frame]") ?? document.documentElement).getBoundingClientRect();
      const w = Math.min(typeof view === "object" ? 320 : 300, frame.width * 0.94);
      const over = b.getBoundingClientRect().left + w - (frame.right - 8);
      setShift(over > 0 ? -Math.ceil(over) : 0);
    }
    const onDown = (e: PointerEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setView(null); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !wrap.current?.contains(document.activeElement)) return;
      e.stopPropagation();
      setView((v) => {
        if (v && typeof v === "object") return "spectrum"; // who → back to the spectrum
        btn.current?.focus({ preventScroll: true });
        return null;
      });
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey, true);
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true }));
    return () => { window.removeEventListener("pointerdown", onDown); window.removeEventListener("keydown", onKey, true); };
  }, [view]);

  if (entries.length === 0) return null;
  const people = entries.length;
  const nFmt = formatNumberLocale(locale, people);
  const peopleText = tp("expr.peopleN", people, { n: nFmt });
  // §38 — the label says PRESENCE ("100 people expressed feelings on this Moment") and,
  // where useful, which feelings were represented. Decorative lens detail is never read.
  const pulseAria = `${tp("expr.pulseAria", people, { n: nFmt })} — ${present.map((id) => t(expressionDef(id)!.labelKey)).join(", ")}`;
  const whoId = view && typeof view === "object" ? view.who : null;
  const whoRows = whoId ? entries.filter(([, id]) => id === whoId) : [];

  return (
    <span ref={wrap} className="relative">
      <button
        ref={btn}
        type="button"
        aria-expanded={view !== null}
        aria-haspopup="true"
        aria-label={pulseAria}
        onClick={() => setView((v) => (v ? null : "spectrum"))}
        className="sb-press inline-flex min-h-9 items-center gap-1.5 rounded-full px-1 text-muted hover:text-text focus-visible:outline-[var(--focus)]"
        data-sb-expression-summary={people}
        data-sb-human-pulse
      >
        <span aria-hidden className="flex items-center">
          {/* first-on-top stacking: the viewer's lens (and its rim chip) is never covered */}
          {reps.map((id, i) => (
            <span key={id} className={`relative ${i > 0 ? "-ml-1.5" : ""}`} style={{ zIndex: reps.length - i }}>
              <BoomLens id={id} tier="xs" owned={id === mine} />
            </span>
          ))}
        </span>
        <span className="text-[12.5px] whitespace-nowrap">{peopleText}</span>
      </button>

      {view === "spectrum" && (
        <div
          ref={panel}
          style={{ left: shift }}
          className="sb-deck sb-spectrum-in absolute bottom-full z-20 mb-2 w-[min(94vw,300px)] rounded-[20px] border border-[var(--hair)] p-1.5 shadow-[0_18px_40px_-18px_rgba(0,0,0,.55)]"
          data-sb-expression-spectrum
          role="group"
          aria-label={t("expr.spectrumTitle")}
        >
          <p className="truncate px-1.5 pt-0.5 pb-1 text-[12px] leading-5 font-medium text-muted">{t("expr.spectrumTitle")}</p>
          <div className="flex max-h-[min(46vh,300px)] flex-col overflow-y-auto overscroll-contain">
            {present.map((id) => {
              const def = expressionDef(id)!;
              const n = counts.get(id)!;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setShown(24); setView({ who: id }); }}
                  aria-label={`${t(def.labelKey)} — ${tp("expr.peopleN", n, { n: formatNumberLocale(locale, n) })}`}
                  className="sb-press flex w-full items-center gap-2.5 rounded-[12px] px-1.5 py-1.5 hover:bg-steel/12 focus-visible:outline-[var(--focus)]"
                  data-sb-spectrum-row={id}
                  data-sb-spectrum-count={n}
                >
                  <BoomLens id={id} tier="md" owned={id === mine} />
                  <span className="min-w-0 flex-1 truncate text-left text-[13px] font-medium text-text">{t(def.labelKey)}</span>
                  <span className="text-[12px] text-muted tabular-nums">{formatNumberLocale(locale, n)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {whoId && (
        <div
          ref={panel}
          style={{ left: shift }}
          className="sb-deck sb-spectrum-in absolute bottom-full z-20 mb-2 w-[min(94vw,320px)] rounded-[20px] border border-[var(--hair)] p-1.5 shadow-[0_18px_40px_-18px_rgba(0,0,0,.55)]"
          data-sb-expression-who-panel
          role="group"
          aria-label={t("expr.whoFor", { name: t(expressionDef(whoId)!.labelKey) })}
        >
          <div className="flex items-center gap-1 px-0.5 pb-1">
            <button type="button" onClick={() => setView("spectrum")} className="sb-press inline-flex min-h-8 items-center rounded-full px-2 text-[12px] font-medium text-muted hover:text-text focus-visible:outline-[var(--focus)]" data-sb-who-back>
              ‹ {t("expr.back")}
            </button>
            <p className="min-w-0 flex-1 truncate text-[12px] leading-5 font-medium text-muted">{t("expr.whoFor", { name: t(expressionDef(whoId)!.labelKey) })}</p>
          </div>
          <ul className="flex max-h-[min(46vh,320px)] flex-col overflow-y-auto overscroll-contain" data-sb-expression-who data-sb-who-for={whoId}>
            {whoRows.slice(0, shown).map(([personId]) => {
              const person = personOf(personId);
              return (
                <li key={personId} className="flex items-center gap-2.5 px-1.5 py-1.5">
                  <PersonIdentity viewer={me} subject={person} size={40} />
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-text">{person.name}</span>
                  <BoomLens id={whoId} tier="sm" size={26} variant={lensVariant(personId, moment.id, whoId)} owned={personId === me.id} />
                </li>
              );
            })}
            {whoRows.length > shown && (
              <li className="px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => {
                    // self-critique: when this click reveals the rest, the button unmounts —
                    // hand keyboard focus to Back instead of dropping it on <body>.
                    const last = whoRows.length - shown <= 48;
                    setShown((v) => v + 48);
                    if (last) requestAnimationFrame(() => wrap.current?.querySelector<HTMLElement>("[data-sb-who-back]")?.focus({ preventScroll: true }));
                  }}
                  className="sb-press inline-flex min-h-8 items-center rounded-full px-2 text-[12px] font-medium text-muted hover:text-text focus-visible:outline-[var(--focus)]"
                  data-sb-who-more
                >
                  {t("expr.showMorePeople")} · {formatNumberLocale(locale, whoRows.length - shown)}
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </span>
  );
}
