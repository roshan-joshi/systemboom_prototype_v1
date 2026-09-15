/**
 * Birth truth — validation, normalization and the precision-aware instant.
 *
 * The existing parseBirthInstant() in ../life-time defaults an unknown time
 * to "00:00", which is fine for the style-lab demo (its seed always has a
 * time) but would let a real identity publish invented hours, minutes and
 * seconds. Runtime consumers use birthInstant() instead: it returns the
 * instant together with its PRECISION, and "day" precision means the
 * consumer must render years / months / days only.
 */

import { now } from "../clock";
import type { BirthPrecision } from "./types";

export type BirthDateProblem = "empty" | "invalid" | "future";

export interface BirthTruth {
  birthDate: string;
  birthTime?: string;
  birthTimeKnown: boolean;
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** "YYYY-MM-DD" → local-calendar parts, or null when not a real date. */
export function parseBirthDate(
  value: string,
): { year: number; month: number; day: number } | null {
  const m = DATE_RE.exec(value.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  // Round-trip through Date so 1991-02-30 and month 13 are rejected.
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return { year, month, day };
}

export function validateBirthDate(value: string, at: Date = now()): BirthDateProblem | null {
  if (!value || !value.trim()) return "empty";
  const parts = parseBirthDate(value);
  if (!parts) return "invalid";
  const birthDay = new Date(parts.year, parts.month - 1, parts.day);
  const today = new Date(at.getFullYear(), at.getMonth(), at.getDate());
  if (birthDay.getTime() > today.getTime()) return "future";
  return null;
}

export function isValidBirthTime(value: string): boolean {
  return TIME_RE.test(value.trim());
}

/**
 * The single place birth truth is enforced: an unknown time is DROPPED, not
 * defaulted, and a malformed time counts as unknown rather than being stored.
 */
export function normalizeBirth(input: {
  birthDate: string;
  birthTime?: string | null;
  birthTimeKnown: boolean;
}): BirthTruth {
  const birthDate = input.birthDate.trim();
  const time = input.birthTime?.trim() ?? "";
  const known = input.birthTimeKnown && isValidBirthTime(time);
  return known
    ? { birthDate, birthTime: time, birthTimeKnown: true }
    : { birthDate, birthTimeKnown: false };
}

/**
 * The birth instant with its precision. Day precision anchors at local
 * midnight purely so calendar math has a Date to work with — that midnight
 * is NOT a claim about the time of birth and must never be displayed.
 */
export function birthInstant(truth: BirthTruth): { at: Date; precision: BirthPrecision } {
  const parts = parseBirthDate(truth.birthDate);
  if (!parts) {
    throw new Error(`birthInstant: invalid birthDate "${truth.birthDate}"`);
  }
  if (truth.birthTimeKnown && truth.birthTime && isValidBirthTime(truth.birthTime)) {
    const [h, min] = truth.birthTime.split(":").map(Number);
    return {
      at: new Date(parts.year, parts.month - 1, parts.day, h, min, 0, 0),
      precision: "minute",
    };
  }
  return {
    at: new Date(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0),
    precision: "day",
  };
}
