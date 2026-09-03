/**
 * SYSTEMBOOM prototype clock — the single time source.
 *
 * Every dated experience (Life Counter, Circle of Life, feed timestamps,
 * memories) must read time from here, never from scattered `new Date()`.
 *
 * Normal runtime: real current time.
 * Development/testing: inject a deterministic reference time either via
 *   NEXT_PUBLIC_SB_FIXED_NOW="2026-09-01T10:00:00" (build/dev env)
 * or at runtime with setReferenceTime().
 */

let referenceTime: Date | null = (() => {
  const fixed = process.env.NEXT_PUBLIC_SB_FIXED_NOW;
  if (!fixed) return null;
  const d = new Date(fixed);
  return Number.isNaN(d.getTime()) ? null : d;
})();

/** Freeze the prototype at a specific instant (pass null to resume real time). */
export function setReferenceTime(instant: Date | null): void {
  referenceTime = instant;
}

/** The current prototype time. Always use this instead of `new Date()`. */
export function now(): Date {
  return referenceTime ? new Date(referenceTime.getTime()) : new Date();
}
