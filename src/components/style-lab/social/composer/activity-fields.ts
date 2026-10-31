/**
 * V3 — ACTIVITY field behaviour. The first post-Meal domain on the V2 Universal Field Contract: this module is Activity's own
 * meaning (what a reading may fill, which source outranks which, what may be derived); the TRANSITIONS (suggest / supersede /
 * edit / confirm / clear protection) are all `field-contract.ts` — there is no second state machine here.
 *
 * Cells live beside the effective values inside `ActivityDomain.field`, so they travel with the one UDraft (Keep draft
 * preserves ownership). Every function is pure.
 */
import type { AIConfidence, ActivityAIObservation, ActivitySource, MealAIObservation } from "../data";
import { confirmFields, edit, emptyCell, hasUnconfirmed, isBlankValue, isSuggestedDefault, supersede, type FieldCell } from "./field-contract";
import type { ActivityDomain, ActivityType } from "./types";

export type ActField = "type" | "activityName" | "distance" | "duration" | "setting" | "pace" | "avgSpeed";
export type ActCell = FieldCell<string, ActivitySource>;
export const ACT_FIELDS: readonly ActField[] = ["type", "activityName", "distance", "duration", "setting", "pace", "avgSpeed"];

/** the card's confirm set: what Looks right confirms (the fields the card actually shows) */
export const ACT_SHOWN: readonly ActField[] = ["type", "activityName", "setting", "distance", "duration", "pace", "avgSpeed"];

/** Activity's own source ranking (the contract only applies it): the person's words outrank a screen readout, which outranks
 *  the AI's visual reading, which outranks arithmetic. A later asset never outranks the primary. */
const RANK: Record<ActivitySource, number> = { user: 6, user_text: 5, ocr: 4, photo_ai: 3, photo_ai_secondary: 2, derived: 1 };
export const outranks = (incoming: ActivitySource | undefined, current: ActivitySource | undefined): boolean =>
  current === undefined || (incoming !== undefined && RANK[incoming] > RANK[current]);

const cellOf = (a: ActivityDomain, k: ActField): ActCell => a.field?.[k] ?? emptyCell();
const valueOf = (a: ActivityDomain, k: ActField): string | undefined => (a as Record<string, unknown>)[k] as string | undefined;
const writeCells = (a: ActivityDomain, patch: Partial<Record<ActField, ActCell>>): ActivityDomain => ({ ...a, field: { ...a.field, ...patch } });

/* ------------------------------------------------------------------------------- parsing + derived */

export function parseDistanceKm(s: string | undefined): number | null {
  const m = s?.trim().match(/^(\d+(?:[.,]\d+)?)\s*(km|kilometres?|kilometers?|mi|miles?)\b/i);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  if (!Number.isFinite(n) || n <= 0 || n > 1000) return null;
  return m[2].toLowerCase().startsWith("k") ? n : n * 1.609344;
}
export function parseDurationMin(s: string | undefined): number | null {
  const m = s?.trim().match(/^(\d+(?:[.,]\d+)?)\s*(min(?:ute)?s?|hours?|hrs?|h)\b/i);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  const min = m[2].toLowerCase().startsWith("h") ? n * 60 : n;
  return min > 0 && min <= 1440 ? min : null;
}

/** DERIVED value (arithmetic over a valid distance + duration only — never a measurement, always `derived` provenance). */
export function derivedPace(a: ActivityDomain): { key: "pace" | "avgSpeed"; value: string } | null {
  const km = parseDistanceKm(a.distance);
  const min = parseDurationMin(a.duration);
  if (km === null || min === null) return null;
  if (a.type === "run" || a.type === "walk" || a.type === "hiking") {
    const per = min / km; // minutes per km
    if (per < 1.5 || per > 30) return null;
    const m = Math.floor(per);
    const sec = Math.round((per - m) * 60);
    return { key: "pace", value: sec === 60 ? `${m + 1}:00 /km` : `${m}:${String(sec).padStart(2, "0")} /km` };
  }
  if (a.type === "cycling") {
    const kmh = km / (min / 60);
    if (kmh < 3 || kmh > 80) return null;
    return { key: "avgSpeed", value: `${Math.round(kmh * 10) / 10} km/h` };
  }
  return null;
}

/** Recompute the derived value after ANY change to type/distance/duration. A derived value is only ever written over a blank or
 *  a previously derived, untouched cell — the person's own pace/speed (any state but an untouched derived one) is never touched. */
export function withDerived(a: ActivityDomain): ActivityDomain {
  let next = a;
  const want = derivedPace(a);
  for (const key of ["pace", "avgSpeed"] as const) {
    const cell = cellOf(next, key);
    const isDerived = cell.source === "derived" && cell.state === "default";
    if (want && want.key === key) {
      if (cell.state !== "default") continue; // the person owns it
      if (!isBlankValue(valueOf(next, key)) && !isDerived) continue; // a value of unknown origin (e.g. a record's own) stays
      if (valueOf(next, key) === want.value && isDerived) continue;
      next = writeCells({ ...next, [key]: want.value }, { [key]: { state: "default", value: want.value, original: want.value, source: "derived" } });
    } else if (isDerived) {
      // the inputs no longer support it (or the type changed) — take back only what arithmetic wrote
      const { [key]: _gone, ...rest } = next as ActivityDomain & Record<string, unknown>;
      void _gone;
      next = writeCells(rest as ActivityDomain, { [key]: emptyCell() });
    }
  }
  return next;
}

/* ------------------------------------------------------------------------------- user edits */

/** A person's edit (or clear) of the intelligent fields: routed through the contract so ownership is recorded. Called by
 *  `setDomain("activity", …)`, the one seam every Activity editor goes through. */
export function editActivity(prev: ActivityDomain, patch: Partial<ActivityDomain>): ActivityDomain {
  let next: ActivityDomain = { ...prev, ...patch };
  const cells: Partial<Record<ActField, ActCell>> = {};
  let touched = false;
  for (const key of ACT_FIELDS) {
    if (!(key in patch)) continue;
    const incoming = (patch as Record<string, unknown>)[key] as string | undefined;
    if (incoming === valueOf(prev, key)) continue; // no change — no ownership claimed
    cells[key] = edit(cellOf(prev, key), incoming);
    touched = true;
  }
  if (touched) next = writeCells(next, cells);
  return touched ? withDerived(next) : next;
}

/* ------------------------------------------------------------------------------- automation */

const fmtKm = (km: number) => `${Math.round(km * 100) / 100} km`;
const fmtMin = (m: number) => `${Math.round(m)} min`;

/** The category signal's three-way decision, read from the EXISTING category seam (the Meal analysis of a photo that is not food):
 *  HIGH selects Activity, MEDIUM asks, anything else is silent. Food is never an Activity. */
export const categoryVerdict = (o: MealAIObservation | null | undefined): "select" | "ask" | "none" => {
  const c = o && !o.isFood ? o.activityCategory : undefined;
  // V3.1 — people incidentally visible in a scene (a site, a building, a document…) are not the photo's subject: no selection, no ask
  if (c?.primary === false) return "none";
  return !c || c.isActivity !== true ? "none" : c.confidence === "high" ? "select" : c.confidence === "medium" ? "ask" : "none";
};

/**
 * Apply ONE asset's reading to the draft's Activity fields — field confidence is its own system (HIGH and MEDIUM fill, LOW stays
 * blank). The primary asset's reading outranks a later asset's; a later asset can only fill what is still empty. A person's
 * edit / clear / confirmation is never replaced, and a value of unknown origin already in the field is never overwritten.
 * A screen readout becomes a suggestion only when it is HIGH confidence (OCR provenance).
 */
export function applyActivityObservation(a: ActivityDomain, obs: ActivityAIObservation, isPrimary: boolean, assetId?: string): ActivityDomain {
  if (obs.isActivity !== true) return a;
  const src: ActivitySource = isPrimary ? "photo_ai" : "photo_ai_secondary";
  const readings: { key: ActField; value: string | undefined; confidence?: AIConfidence; source: ActivitySource }[] = [
    { key: "type", value: obs.activityType, confidence: obs.activityTypeConfidence, source: src },
    { key: "activityName", value: obs.activityName, confidence: obs.activityNameConfidence, source: src },
    { key: "setting", value: obs.setting, confidence: obs.settingConfidence, source: src },
    { key: "distance", value: obs.readout?.confidence === "high" && obs.readout.distanceKm ? fmtKm(obs.readout.distanceKm) : undefined, confidence: obs.readout?.confidence, source: "ocr" },
    { key: "duration", value: obs.readout?.confidence === "high" && obs.readout.durationMinutes ? fmtMin(obs.readout.durationMinutes) : undefined, confidence: obs.readout?.confidence, source: "ocr" },
  ];
  let next = a;
  const cells: Partial<Record<ActField, ActCell>> = {};
  const values: Record<string, string> = {};
  for (const r of readings) {
    if (r.value === undefined || r.confidence === "low" || r.confidence === undefined) continue;
    const cur = cellOf(next, r.key);
    if (!isBlankValue(valueOf(next, r.key)) && isBlankValue(cur.value)) continue; // a value of unknown origin is the person's
    const updated = supersede(cur, r.value, { confidence: r.confidence, source: r.source, ref: assetId ? { assetId } : undefined }, outranks);
    if (updated === cur) continue;
    cells[r.key] = updated;
    values[r.key] = r.value;
  }
  if (Object.keys(cells).length) next = withDerived(writeCells({ ...next, ...values } as ActivityDomain, cells));
  return next;
}

/** "Use details" from the person's OWN words: `user_text` provenance — Smart Assist only READ them. */
export function applyTextReading(a: ActivityDomain, r: { type?: ActivityType; distance?: string; duration?: string }): ActivityDomain {
  let next = a;
  const cells: Partial<Record<ActField, ActCell>> = {};
  const values: Record<string, string> = {};
  for (const [key, value] of [["type", r.type], ["distance", r.distance], ["duration", r.duration]] as [ActField, string | undefined][]) {
    if (!value) continue;
    const cur = cellOf(next, key);
    if (!isBlankValue(valueOf(next, key)) && isBlankValue(cur.value)) continue; // unknown-origin value stays
    const updated = supersede(cur, value, { confidence: "high", source: "user_text" }, outranks);
    if (updated === cur) continue;
    cells[key] = updated;
    values[key] = value;
  }
  if (Object.keys(cells).length) next = withDerived(writeCells({ ...next, ...values } as ActivityDomain, cells));
  return next;
}

/* ------------------------------------------------------------------------------- Looks right */

const populated = (a: ActivityDomain): ActField[] => ACT_SHOWN.filter((k) => isSuggestedDefault(cellOf(a, k)));
/** whether anything shown on the card is still an untouched suggested default (i.e. something is left to confirm) */
export const activityHasUnconfirmed = (a: ActivityDomain): boolean => !!a.field && hasUnconfirmed(a.field as Record<string, unknown>, populated(a));
/** Looks right: confirm every shown, populated, still-suggested field — state only; provenance (source) is never rewritten. */
export function confirmActivity(a: ActivityDomain): ActivityDomain {
  if (!a.field) return a;
  return { ...a, field: confirmFields(a.field as Record<string, unknown>, populated(a)) as ActivityDomain["field"] };
}

/** record-only provenance for the posted record (JSON-safe) */
export function activityProvenance(a: ActivityDomain): Record<string, { source?: ActivitySource; state: ActCell["state"]; confidence?: AIConfidence }> | undefined {
  const out: Record<string, { source?: ActivitySource; state: ActCell["state"]; confidence?: AIConfidence }> = {};
  for (const k of ACT_FIELDS) {
    const c = a.field?.[k];
    if (!c || (isBlankValue(c.value) && c.state === "default")) continue;
    out[k] = { ...(c.source ? { source: c.source } : {}), state: c.state, ...(c.confidence ? { confidence: c.confidence } : {}) };
  }
  return Object.keys(out).length ? out : undefined;
}

/** A removed asset takes back ONLY what its own reading wrote and the person never touched (state "default"); everything the
 *  person edited, cleared or confirmed stays. Derived values are recomputed from what remains. */
export function revokeActivityAsset(a: ActivityDomain, assetId: string): ActivityDomain {
  let next = a;
  const cells: Partial<Record<ActField, ActCell>> = {};
  for (const k of ACT_FIELDS) {
    const c = a.field?.[k];
    if (c && c.state === "default" && (c.ref as { assetId?: string } | undefined)?.assetId === assetId) {
      const { [k]: _gone, ...rest } = next as ActivityDomain & Record<string, unknown>;
      void _gone;
      next = rest as ActivityDomain;
      cells[k] = emptyCell();
    }
  }
  return Object.keys(cells).length ? withDerived(writeCells(next, cells)) : a;
}
