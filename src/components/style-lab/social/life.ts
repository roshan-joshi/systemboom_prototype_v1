/**
 * Life geometry and counter arithmetic for the Social preview.
 * One source for: the ten-band Circle (ring at every scale), the exact /
 * band age policy, and the MY LIFE IN unit totals with the honesty rule.
 * Precision always comes from birthInstant() so Phase 3 shares the code.
 */

import { birthInstant, type BirthTruth } from "@/lib/identity/birth";
import { CIRCLE_BANDS, CIRCLE_YEARS, computeLifeTime, currentBandIndex } from "@/lib/life-time";

export const BAND_COUNT = CIRCLE_BANDS.length; // 10
export const BAND_YEARS = CIRCLE_YEARS / BAND_COUNT; // 15
const DAY_MS = 86_400_000;
const YEAR_DAYS = 365.25;

export interface LifePosition {
  years: number;
  months: number;
  days: number;
  /** "34y 10m 06d" — only when the viewer owns the moment. */
  exact?: string;
  band: string;
  bandIndex: number;
  /** 0–1 across the 150-year Circle; drives the red tick. */
  fraction: number;
  /** Whole days lived at the instant. */
  totalDays: number;
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

export function lifePosition(person: BirthTruth, at: Date, isSelf: boolean): LifePosition {
  const { at: birth } = birthInstant(person);
  const t = computeLifeTime(birth, at);
  const bandIndex = currentBandIndex(t.years);
  const totalDays = Math.floor((at.getTime() - birth.getTime()) / DAY_MS);
  const fraction = Math.min(1, Math.max(0, totalDays / (CIRCLE_YEARS * YEAR_DAYS)));
  const base: LifePosition = {
    years: t.years,
    months: t.months,
    days: t.days,
    band: CIRCLE_BANDS[bandIndex],
    bandIndex,
    fraction,
    totalDays,
  };
  if (!isSelf) return base;
  return { ...base, exact: `${t.years}y ${pad2(t.months)}m ${pad2(t.days)}d` };
}

/** Calendar years a band spans for a person, e.g. band 2 of 1991 → [2021, 2036]. */
export function bandCalendarYears(person: BirthTruth, bandIndex: number): [number, number] {
  const y = birthInstant(person).at.getFullYear();
  return [y + bandIndex * BAND_YEARS, y + (bandIndex + 1) * BAND_YEARS];
}

/* ---------- MY LIFE IN ---------- */

export const UNITS = ["years", "months", "weeks", "days", "hours", "minutes", "seconds"] as const;
export type Unit = (typeof UNITS)[number];

/** The honesty rule: an unknown birth time stops the instrument at days. */
export function availableUnits(person: BirthTruth): Unit[] {
  return birthInstant(person).precision === "minute" ? [...UNITS] : UNITS.slice(0, 4);
}

/** True cadence of each unit — how often its total changes. */
export const UNIT_TICK_MS: Record<Unit, number> = {
  years: 60_000,
  months: 60_000,
  weeks: 60_000,
  days: 60_000,
  hours: 1_000,
  minutes: 1_000,
  seconds: 1_000,
};

export function unitTotal(person: BirthTruth, at: Date, unit: Unit): number {
  const { at: birth } = birthInstant(person);
  const ms = at.getTime() - birth.getTime();
  switch (unit) {
    case "years": {
      return computeLifeTime(birth, at).years;
    }
    case "months": {
      const t = computeLifeTime(birth, at);
      return t.years * 12 + t.months;
    }
    case "weeks":
      return Math.floor(ms / (7 * DAY_MS));
    case "days":
      return Math.floor(ms / DAY_MS);
    case "hours":
      return Math.floor(ms / 3_600_000);
    case "minutes":
      return Math.floor(ms / 60_000);
    case "seconds":
      return Math.floor(ms / 1_000);
  }
}

/** The composite face: Y/M/D over H/M/S — the second row only when the time is known. */
export function compositeFace(person: BirthTruth, at: Date) {
  const { at: birth, precision } = birthInstant(person);
  const t = computeLifeTime(birth, at);
  return {
    years: t.years,
    months: t.months,
    days: t.days,
    hours: precision === "minute" ? t.hours : null,
    minutes: precision === "minute" ? t.minutes : null,
    seconds: precision === "minute" ? t.seconds : null,
    totalDays: Math.floor((at.getTime() - birth.getTime()) / DAY_MS),
  };
}

/** Next round number of days and when it arrives — always forward. */
export function nextRoundDays(totalDays: number): { target: number; inDays: number } {
  const step = totalDays < 10_000 ? 1_000 : 1_000;
  const target = Math.ceil((totalDays + 1) / step) * step;
  return { target, inDays: target - totalDays };
}

/** Digit-count → font size for a 300px module (tabular Geist, thousands grouped). */
export function digitSize(text: string): number {
  const digits = text.replace(/\D/g, "").length;
  if (digits <= 3) return 56;
  if (digits <= 6) return 44;
  if (digits <= 9) return 34;
  if (digits <= 12) return 26;
  return 22;
}

export const formatInt = (n: number) => n.toLocaleString("en-GB");
