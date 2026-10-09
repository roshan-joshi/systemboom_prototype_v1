/**
 * SYSTEMBOOM — UNIVERSAL COMPOSER FIELD CONTRACT (Phase V2).
 *
 * The contract standardizes how an intelligent Composer field BEHAVES — not what any domain's fields MEAN.
 * It knows nothing about Meal, nutrition, USDA, Open Food Facts, DeepSeek or any other category: it only knows the
 * transitions of one field once it receives an automated suggestion, a stronger structured source, a user edit,
 * a user clear or a confirmation. Every function is pure (no I/O, no AI, no React, no clock unless injected) so it can be
 * tested — and adopted by a future category — without any Meal infrastructure.
 *
 * One cell carries the seven universal semantics:
 *   value       the EFFECTIVE value the Composer shows and the record saves (blank = undefined)
 *   source      where the original evidence came from — a domain-owned vocabulary (generic `S`)
 *   confidence  the automated observation's confidence, where one applies
 *   state       "default" (= suggested_default) · "confirmed" · "corrected" · "cleared"
 *   user owned  derived from `state` — anything but "default" means the person has taken ownership
 *   ref         a reference to the immutable underlying evidence (generic `R`)
 *   scope       the field SET a cell lives in (one set per scope — e.g. one per attached photo); the functions act on one
 *               set and never see another, so a sibling scope cannot be mutated by construction
 * `original` keeps what the automation first said so a correction or a clear can always be traced back to it.
 *
 * STATE NAMES: the stored value "default" IS the contract's `suggested_default` (the Meal records already persist it;
 * renaming it would churn saved data for no behavioural gain).
 */

export type FieldState = "default" | "confirmed" | "corrected" | "cleared";
/** the contract's name for a suggested default (same stored value as `FieldState` "default") */
export const SUGGESTED_DEFAULT: FieldState = "default";
export type FieldConfidence = "high" | "medium" | "low";

export interface FieldCell<V, S extends string = string, R = unknown> {
  value?: V;
  state: FieldState;
  /** what the automation first said — never rewritten */
  original?: V;
  confidence?: FieldConfidence;
  source?: S;
  ref?: R;
  /** when the person last changed / cleared / confirmed this field (ISO) */
  at?: string;
}

/** The universal source of a person's own value. A domain's source vocabulary must include it. */
export const USER_SOURCE = "user";

export type Clock = () => string;
const isoNow: Clock = () => new Date().toISOString();

export const emptyCell = <V, S extends string = string, R = unknown>(): FieldCell<V, S, R> => ({ state: "default" });

/** a blank value: nothing, an empty/whitespace string, or an empty list */
export const isBlankValue = (v: unknown): boolean => v === undefined || v === null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && v.length === 0);
export const sameValue = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/** the person has taken ownership (edit · clear · explicit confirmation) — automation must not replace this cell's value */
export const isUserTouched = (cell: FieldCell<unknown>): boolean => cell.state !== "default";
/** an untouched, populated automatic value */
export const isSuggestedDefault = (cell: FieldCell<unknown>): boolean => cell.state === "default" && !isBlankValue(cell.value);
/** the person deliberately removed the value (distinct from a field that was simply never populated) */
export const isUserCleared = (cell: FieldCell<unknown>): boolean => cell.state === "cleared";
/** never populated and never touched */
export const isUntouchedEmpty = (cell: FieldCell<unknown>): boolean => cell.state === "default" && isBlankValue(cell.value);

/**
 * AUTOMATED SUGGESTION. Fills ONE cell from a reading — only while it has never been filled (`original` unset) — and never
 * over the person's own value: a corrected / cleared / confirmed cell keeps its value and state, and the reading is still
 * remembered as evidence. HIGH and MEDIUM confidence populate; LOW (or a missing value) is not promoted — the cell is returned
 * unchanged (blank stays blank; the caller keeps the observation itself as evidence).
 */
export function suggest<V, S extends string, R>(
  cell: FieldCell<V, S, R>,
  value: V | undefined,
  meta: { confidence?: FieldConfidence; source?: S; ref?: R },
): FieldCell<V, S, R> {
  if (value === undefined || cell.original !== undefined) return cell;
  if (meta.confidence === "low") return cell;
  const next: FieldCell<V, S, R> = { ...cell, original: value, confidence: meta.confidence, source: meta.source, ref: meta.ref };
  return cell.state === "default" && cell.value === undefined ? { ...next, value } : next;
}

/**
 * STRONGER SOURCE. A structured / verifiable reading replaces the effective value of a cell the person has NOT touched —
 * subject to a caller-supplied priority policy (`outranks(incoming, current)`; the domain owns the source vocabulary and
 * ranking, the contract only applies the rule). A user-touched cell is never replaced. Default policy: always outranks.
 */
export function supersede<V, S extends string, R>(
  cell: FieldCell<V, S, R>,
  value: V,
  meta: { confidence?: FieldConfidence; source?: S; ref?: R },
  outranks: (incoming: S | undefined, current: S | undefined) => boolean = () => true,
): FieldCell<V, S, R> {
  if (cell.state !== "default") return cell;
  if (!outranks(meta.source, cell.source)) return cell;
  return { ...cell, value, original: value, confidence: meta.confidence, source: meta.source, ref: meta.ref };
}

/**
 * USER EDIT / CLEAR. A blank value is a deliberate CLEAR (state "cleared", effective value blank, original evidence kept);
 * a value equal to the original is an acceptance ("confirmed"); anything else is a CORRECTION ("corrected"). The source
 * evidence is never rewritten — only a cell that never had any evidence is attributed to the person.
 */
export function edit<V, S extends string, R>(cell: FieldCell<V, S, R>, value: V | undefined, now: Clock = isoNow): FieldCell<V, S, R> {
  const blank = isBlankValue(value);
  const same = !blank && cell.original !== undefined && sameValue(value, cell.original);
  const next: FieldCell<V, S, R> = { ...cell, value: blank ? undefined : value, state: blank ? "cleared" : same ? "confirmed" : "corrected", at: now() };
  if (!blank && !same && cell.source === undefined) next.source = USER_SOURCE as S;
  return next;
}

/** CONFIRM one cell: an untouched populated default becomes "confirmed". Only the state (and its timestamp) changes — never the source. */
export function confirm<V, S extends string, R>(cell: FieldCell<V, S, R>, now: Clock = isoNow): FieldCell<V, S, R> {
  return isSuggestedDefault(cell) ? { ...cell, state: "confirmed", at: now() } : cell;
}

/**
 * CONFIRM a field set (ONE scope): every listed field that is currently populated and still a suggested default becomes
 * confirmed. Blank fields, fields not listed (hidden / out of scope), and user-owned fields are untouched; sibling scopes are
 * never seen. Returns a new set — the input is not mutated.
 */
export function confirmFields<T extends object>(set: T, keys: readonly (keyof T)[], now: Clock = isoNow): T {
  const out: Record<string, unknown> = { ...(set as Record<string, unknown>) };
  const at = now();
  for (const k of keys) {
    const c = (set as Record<string, unknown>)[k as string] as FieldCell<unknown> | undefined;
    if (c && isSuggestedDefault(c)) out[k as string] = { ...c, state: "confirmed", at };
  }
  return out as T;
}
/** whether any listed field of this set is still a populated suggested default (i.e. something is left to confirm) */
export function hasUnconfirmed<T extends object>(set: T | undefined, keys: readonly (keyof T)[]): boolean {
  return !!set && keys.some((k) => isSuggestedDefault((set as Record<string, unknown>)[k as string] as FieldCell<unknown>));
}

/**
 * SCOPE ISOLATION. Apply a transition to ONE scope's field set; every other scope is returned as the very same object.
 * A scope with no set yet is created from `seed`.
 */
export function inScope<Sc>(scopes: Record<string, Sc>, id: string, fn: (set: Sc) => Sc, seed: () => Sc): Record<string, Sc> {
  return { ...scopes, [id]: fn(scopes[id] ?? seed()) };
}

/**
 * SAVE (zero effort). The record is built from the effective value; an untouched suggested default is saved AS a suggested
 * default — saving never confirms anything. Returns a plain JSON-safe copy.
 */
export function toRecord<V, S extends string, R>(cell: FieldCell<V, S, R>): FieldCell<V, S, R> {
  return JSON.parse(JSON.stringify(cell)) as FieldCell<V, S, R>;
}
