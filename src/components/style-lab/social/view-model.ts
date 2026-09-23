/**
 * THE PRIVACY VIEW MODEL — the only life data a viewer may receive.
 *
 * Q1 / C1 is a data contract, not a display rule. Every Social surface
 * renders a PersonView + LifeView produced HERE for the (viewer, subject)
 * pair. The OWNER shape carries exact self-data. The OTHER shape carries the
 * 15-year band and nothing else: no birthDate, birthTime, birth instant,
 * exact age, day count, next-round data, or the band's calendar years (which
 * would reveal the birth year). Those fields are ABSENT, not hidden.
 *
 * In the live system this is the server's job: visitor payloads never
 * contain birth-derivable fields; the server computes the band and ships
 * only the band. The prototype mirrors that boundary in one module so the
 * browser never needs another person's birth instant to render Social.
 */

import { birthInstant, type BirthTruth } from "@/lib/identity/birth";
import { CIRCLE_BANDS, computeLifeTime, currentBandIndex } from "@/lib/life-time";
import type { Moment, Person } from "./data";
import { BAND_COUNT, bandCalendarYears, pad2 } from "./life";

const DAY_MS = 86_400_000;
const YEAR_DAYS = 365.25;

/** Identity a viewer may render. Contact details exist only on the owner's own view. */
export interface PersonView {
  id: string;
  name: string;
  avatar?: string;
  home: string;
  verified?: boolean;
  cover?: string;
  contact?: { phone?: string; email?: string };
}

export interface OwnerLife {
  scope: "owner";
  /** The owner's own birth truth — feeds the counter and the ring tick. */
  birth: BirthTruth;
  precision: "day" | "minute";
  exact: string;
  years: number;
  months: number;
  days: number;
  totalDays: number;
  /** 0–1 across the 150-year Circle. */
  fraction: number;
  band: string;
  bandIndex: number;
  /** Calendar years of a band — owner only (reveals the birth year). */
  bandYears: (i: number) => [number, number];
}

export interface OtherLife {
  scope: "other";
  band: string;
  bandIndex: number;
}

export type LifeView = OwnerLife | OtherLife;

/** What a ring needs. `fraction` (the red tick) exists only for the owner. */
export interface RingView {
  bandIndex: number;
  fraction?: number;
  momentsByBand?: number[];
}

const isOwner = (viewer: Person, subject: Person) => viewer.id === subject.id;

export function personViewFor(viewer: Person, subject: Person): PersonView {
  const v: PersonView = { id: subject.id, name: subject.name, home: subject.home };
  if (subject.avatar) v.avatar = subject.avatar;
  if (subject.verified) v.verified = true;
  if (subject.cover) v.cover = subject.cover;
  if (isOwner(viewer, subject)) v.contact = { phone: subject.phone, email: subject.email };
  return v;
}

function bandAt(subject: Person, at: Date): { band: string; bandIndex: number } {
  // Phase 4.4-A (A12): an id that resolves to no known person renders band-less and neutral —
  // never another person's life, never an invented band.
  if (subject.unavailable) return { band: "—", bandIndex: -1 };
  const { at: birth } = birthInstant(subject);
  const years = computeLifeTime(birth, at).years;
  const bandIndex = currentBandIndex(years);
  return { band: CIRCLE_BANDS[bandIndex], bandIndex };
}

export function lifeViewFor(viewer: Person, subject: Person, at: Date): LifeView {
  if (!isOwner(viewer, subject) || subject.unavailable) return { scope: "other", ...bandAt(subject, at) };
  const { at: birth, precision } = birthInstant(subject);
  const t = computeLifeTime(birth, at);
  const totalDays = Math.floor((at.getTime() - birth.getTime()) / DAY_MS);
  const bandIndex = currentBandIndex(t.years);
  return {
    scope: "owner",
    birth: { birthDate: subject.birthDate, birthTime: subject.birthTime, birthTimeKnown: subject.birthTimeKnown },
    precision,
    exact: `${t.years}y ${pad2(t.months)}m ${pad2(t.days)}d`,
    years: t.years,
    months: t.months,
    days: t.days,
    totalDays,
    fraction: Math.min(1, Math.max(0, totalDays / (150 * YEAR_DAYS))),
    band: CIRCLE_BANDS[bandIndex],
    bandIndex,
    bandYears: (i) => bandCalendarYears(subject, i),
  };
}

/** The readout's life position for a moment: exact for the viewer's own, band for anyone else. */
export function momentLifeFor(viewer: Person, author: Person, at: Date): { exact?: string; band: string } {
  const life = lifeViewFor(viewer, author, at);
  return life.scope === "owner" ? { exact: life.exact, band: life.band } : { band: life.band };
}

function bandCounts(subject: Person, moments: Moment[]): number[] {
  const counts = new Array(BAND_COUNT).fill(0) as number[];
  for (const m of moments) counts[bandAt(subject, new Date(m.at)).bandIndex] += 1;
  return counts;
}

/**
 * Ring data for a subject. Others get band-level fill only — no tick, no
 * calendar years, no exact age; that part is unconditional.
 *
 * Documented-memory density (`momentsByBand`) is two different rules depending
 * on whether the caller passes `connected`:
 *
 * - `connected` OMITTED (legacy call sites — `CircleModule`, the full Circle):
 *   unchanged since Phase 5 §23 — density only for the OWNER's own ring;
 *   nothing is computed for anyone else. Do not pass a fifth argument here
 *   merely to "try" the new behaviour — it is a deliberate opt-in.
 * - `connected` PASSED (Person + Life Identity pass, §8–§9 — `PersonIdentity`
 *   call sites: ProfileHero, PersonCard): a visitor's density is aggregated
 *   from Moments that viewer may actually see. Health/Problem content and an
 *   only-me Moment are NEVER included, regardless of relationship — that part
 *   is unconditional. `public` Moments always count.
 *
 *   `friends`-privacy Moments do NOT currently count toward a connected
 *   viewer's density, even when `connected` is true. **FRIENDS PRIVACY
 *   BACKEND CONTRACT — VERIFY DURING LIVE PORT** (Social Freeze Delta,
 *   2026-09-12): nothing in this repo's handover evidence (`social-api-
 *   contract.md`, `docs/SYSTEMBOOM-HANDOFF-BRIEF.md`) confirms that the live
 *   product's friend/family relationship is actually what gates visibility of
 *   a `privacy:"friends"` Moment — that is a real backend contract this
 *   prototype cannot verify. Per the owner's explicit instruction, an
 *   unverified relationship must never be assumed to unlock additional
 *   density: `connected` is threaded through every call site so that once the
 *   live contract is confirmed, turning it on is a one-line change to the
 *   filter below — not a redesign. Until then, relationship makes no
 *   difference to what a non-owner's ring shows.
 *
 *   The aggregation SET is the safeguard either way: we never compute a full
 *   count and hide entries after. Position (bandIndex/fraction) does not
 *   change either way — a visitor still gets no fraction, no tick, no
 *   calendar years, so this cannot narrow a birth date beyond what the band
 *   itself already discloses.
 */
export function ringViewFor(viewer: Person, subject: Person, at: Date, moments?: Moment[], connected?: boolean): RingView {
  const life = lifeViewFor(viewer, subject, at);
  const ring: RingView = { bandIndex: life.bandIndex };
  if (life.scope === "owner") ring.fraction = life.fraction;
  if (moments && life.scope === "owner") {
    ring.momentsByBand = bandCounts(subject, moments.filter((m) => m.authorId === subject.id));
  } else if (moments && life.scope === "other" && connected !== undefined) {
    // FRIENDS PRIVACY BACKEND CONTRACT — VERIFY DURING LIVE PORT: only `public` counts here.
    // `connected` is intentionally unused in this filter until that contract is confirmed (see
    // the doc comment above) — it stays a real parameter, not a placeholder, so every call site
    // is already correct the day the live team verifies the contract.
    const visible = moments.filter((m) => m.authorId === subject.id && m.kind !== "health" && m.kind !== "problem" && m.privacy === "public");
    ring.momentsByBand = bandCounts(subject, visible);
  }
  return ring;
}

/** Keys that must never appear on a non-owner view (asserted by the suite). */
export const FORBIDDEN_ON_OTHER = ["birth", "birthDate", "birthTime", "precision", "exact", "years", "months", "days", "totalDays", "fraction", "bandYears"] as const;
