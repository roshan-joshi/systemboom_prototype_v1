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

import { now } from "@/lib/clock";
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

/* ────────────────────────────── THE ACCESS SEAM ──────────────────────────────
 * Social Wall S1 (owner-decided §5.3): ONE canonical audience matrix. Every surface — the feed,
 * a person's World, View as public, Search, a notification landing — answers "may this viewer
 * see this Moment?" HERE, never with its own re-implementation.
 *
 *                 PUBLIC   FRIENDS   ONLY ME
 *   owner (self)   yes       yes       yes
 *   friend         yes       yes       no
 *   family         yes       yes       no
 *   request-in     yes       no        no
 *   request-out    yes       no        no
 *   stranger       yes       no        no
 *   View as public yes       no        no      (the stranger row, verbatim)
 *
 * PROTOTYPE ENFORCEMENT vs LIVE CONTRACT: here this filters client state; in the live system the
 * SERVER must apply this same matrix before a Moment ever reaches a visitor payload
 * (docs/handover/social-api-contract.md §D). Client filtering is presentation, not security.
 * The matrix is deliberately extensible: a future audience type adds a row here, nowhere else. */

export type ViewerRelationship = "self" | "friend" | "family" | "request-in" | "request-out" | "none";

/** Family qualifies as CONNECTED for Friends-audience access (S1 §5.2). */
export const connectedRel = (r: ViewerRelationship) => r === "self" || r === "friend" || r === "family";

export function canSeeMoment(m: Moment, viewerId: string, rel: ViewerRelationship): boolean {
  if (m.authorId === viewerId) return true;
  if (m.privacy === "public") return true;
  if (m.privacy === "friends") return connectedRel(rel);
  return false; // "onlyme" — and any future audience type is invisible until a row above says otherwise
}

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

/**
 * The readout's life position for a moment: exact-at-the-moment for the viewer's OWN Moments;
 * for anyone else, the author's CURRENT band — never the band at the Moment's date. S1 §5.6
 * (owner-decided): a historical band derived from a Moment date narrows a birth date (seeing
 * "0–15" on a 1998 Moment brackets the birth year); the visitor-safe identity is the person's
 * current band, which every other surface already discloses.
 */
export function momentLifeFor(viewer: Person, author: Person, at: Date): { exact?: string; band: string } {
  if (isOwner(viewer, author)) {
    const life = lifeViewFor(viewer, author, at);
    return life.scope === "owner" ? { exact: life.exact, band: life.band } : { band: life.band };
  }
  return { band: bandAt(author, now()).band };
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
 * Documented-memory density (`momentsByBand`) is OWNER-ONLY — Social Wall S1 §5.6
 * (owner-decided, 2026-09-25), superseding the Person + Life Identity connected-density opt-in
 * and closing the Social Freeze Delta's "flip on later" seam: a per-band count buckets another
 * person's dated Moments by the band they were in AT THAT DATE, and every bucket is a birth-date
 * constraint (three buckets can bracket a birth year to months). No relationship unlocks it.
 * The `connected` parameter is kept so no call site churns; it changes nothing.
 *
 * The aggregation SET remains the safeguard for the owner too: Health/Problem and only-me
 * content stand inside the owner's own counts because only the owner ever receives them.
 */
export function ringViewFor(viewer: Person, subject: Person, at: Date, moments?: Moment[], connected?: boolean): RingView {
  const life = lifeViewFor(viewer, subject, at);
  const ring: RingView = { bandIndex: life.bandIndex };
  if (life.scope === "owner") ring.fraction = life.fraction;
  if (moments && life.scope === "owner") {
    // Universal Composer: a social-only post (record "none") is not a Human Record — it never
    // counts as documented life. Health/Problem and only-me records still stand (owner-only set).
    // §18 — an unknown-date record cannot be banded truthfully: no density from an anchor.
    ring.momentsByBand = bandCounts(subject, moments.filter((m) => m.authorId === subject.id && m.record !== "none" && m.timePrecision !== "unknown"));
  }
  // S1 §5.6: no non-owner branch — another person's ring never carries per-band density.
  void connected;
  return ring;
}

/** Keys that must never appear on a non-owner view (asserted by the suite). */
export const FORBIDDEN_ON_OTHER = ["birth", "birthDate", "birthTime", "precision", "exact", "years", "months", "days", "totalDays", "fraction", "bandYears"] as const;
