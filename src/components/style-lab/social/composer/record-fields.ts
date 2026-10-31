/**
 * SOCIAL-4 — PROJECT · PROBLEM · MEETING · HEALTH field behaviour on the V2 Universal Field Contract. This module is each
 * category's MEANING (which observations may fill which field, what is never filled); every transition — suggest · edit · clear
 * protection · confirm — is `field-contract.ts`. No second state machine. Cells live beside the effective values inside the
 * domain (`domain.field`), so Keep draft carries ownership. All functions are pure.
 */
import type { AIConfidence, RecordAIObservation, RecordKindAI, RecordSource, RecordValue } from "../data";
import { confirmFields, edit, emptyCell, hasUnconfirmed, isBlankValue, isSuggestedDefault, suggest, type FieldCell } from "./field-contract";
import type { HealthDomain, HealthType, MeetingDomain, ProblemDomain, ProjectDomain } from "./types";

export type RecordDomain = ProjectDomain | ProblemDomain | MeetingDomain | HealthDomain;
export type RecCell = FieldCell<string, RecordSource>;

/** the intelligent fields per kind — the only ones a reading may ever touch (everything else is the person's alone) */
export const RECORD_FIELDS: Record<RecordKindAI, readonly string[]> = {
  project: ["title", "goal", "focus", "target"],
  problem: ["description", "category", "urgency", "attempt", "nextAction"],
  meeting: ["subject", "purpose"],
  health: ["healthType", "description", "bodyArea", "severity"],
};
/** what the suggestion card shows and Looks right may confirm (the Quick fields) */
export const RECORD_SHOWN: Record<RecordKindAI, readonly string[]> = {
  project: ["title", "goal"],
  problem: ["description", "attempt", "urgency"],
  meeting: ["subject", "purpose"],
  health: ["healthType", "description", "bodyArea"],
};

const HEALTH_TYPES: readonly string[] = ["symptom", "condition", "injury", "appointment", "diagnosis", "medication", "measurement", "test", "imaging", "procedure", "vaccination", "dental", "vision", "mental", "document", "allergy", "other"];

type AnyDomain = Record<string, unknown> & { field?: Partial<Record<string, RecCell>> };
const cellOf = (d: AnyDomain, k: string): RecCell => d.field?.[k] ?? emptyCell();
const write = (d: AnyDomain, values: Record<string, string | undefined>, cells: Record<string, RecCell>): AnyDomain => ({ ...d, ...values, field: { ...d.field, ...cells } });

/** A person's edit / clear of an intelligent field, through the contract (called by `setDomain` for these four kinds). */
export function editRecordDomain<D extends RecordDomain>(kind: RecordKindAI, prev: D, patch: Partial<D>): D {
  const p = prev as AnyDomain;
  const cells: Record<string, RecCell> = {};
  for (const k of RECORD_FIELDS[kind]) {
    if (!(k in patch)) continue;
    const incoming = (patch as Record<string, unknown>)[k] as string | undefined;
    if (incoming === p[k]) continue;
    cells[k] = edit(cellOf(p, k), incoming);
  }
  const next = { ...p, ...patch } as AnyDomain;
  return (Object.keys(cells).length ? { ...next, field: { ...next.field, ...cells } } : next) as D;
}

/** the readings a category may offer, in the order they are applied */
function readings(kind: RecordKindAI, o: RecordAIObservation): { key: string; v?: RecordValue<string> }[] {
  switch (kind) {
    case "project":
      return [{ key: "title", v: o.project?.name }, { key: "goal", v: o.project?.goal }, { key: "focus", v: o.project?.stage }];
    case "problem":
      return [{ key: "description", v: o.problem?.description }, { key: "urgency", v: o.problem?.urgency }, { key: "attempt", v: o.problem?.attempt }, { key: "nextAction", v: o.problem?.nextAction }];
    case "meeting":
      return [{ key: "subject", v: o.meeting?.subject }, { key: "purpose", v: o.meeting?.purpose }];
    case "health": {
      const type = o.health?.type && HEALTH_TYPES.includes(o.health.type.value) ? o.health.type : undefined;
      return [{ key: "healthType", v: type }, { key: "description", v: o.health?.description }, { key: "bodyArea", v: o.health?.bodyArea }, { key: "severity", v: o.health?.severity }];
    }
  }
}

/**
 * Apply ONE reading to a domain: HIGH and MEDIUM fill an untouched, empty field (the contract's `suggest` — never over a person's
 * value, never over a cleared one); LOW stays blank. Severity (Health) and urgency (Problem) fill ONLY from the person's own words
 * (`user_text`) — never from what an image looks like. `ref` is the asset the reading came from.
 */
/**
 * V3.1 — OBJECTIVE-TYPE fields (Project goal · Meeting purpose) state what someone WANTS, not what a photo shows. They fill only
 * from a STATED objective: the person's own words or text actually read in the image (`user_text` / `image_text` — the contract's
 * `direct` strength from a textual source), and the text must be semantically an objective rather than the record's own
 * name/subject or a scene description echoed back. An inferred goal (`ai_interpretation`, a visual reading) stays in the
 * observation (record depth / card) and never reaches the field. Confidence alone decides nothing here.
 */
const OBJECTIVE_KEYS: Record<RecordKindAI, readonly string[]> = { project: ["goal"], problem: [], meeting: ["purpose"], health: [] };
const norm = (s?: string) => (s ?? "").trim().toLowerCase().replace(/[.\s]+$/, "");
export function isStatedObjective(kind: RecordKindAI, key: string, v: RecordValue<string>, o: RecordAIObservation): boolean {
  if (!OBJECTIVE_KEYS[kind].includes(key)) return true;
  if (v.source !== "user_text" && v.source !== "image_text") return false;
  const block = (o[kind] ?? {}) as Record<string, RecordValue | undefined>;
  const echoes = [block.name?.value, block.subject?.value, block.description?.value].map(norm).filter(Boolean);
  return !echoes.includes(norm(v.value));
}

export function applyRecordObservation<D extends RecordDomain>(kind: RecordKindAI, domain: D, o: RecordAIObservation, assetId?: string): D {
  if (o.category !== kind || o.status !== "complete") return domain;
  let d = domain as AnyDomain;
  const values: Record<string, string | undefined> = {};
  const cells: Record<string, RecCell> = {};
  for (const r of readings(kind, o)) {
    const v = r.v;
    if (!v || isBlankValue(v.value) || v.confidence === "low") continue;
    if ((r.key === "severity" || r.key === "urgency") && v.source !== "user_text") continue; // never from appearance
    if (!isStatedObjective(kind, r.key, v, o)) continue; // V3.1 — an objective must be stated, never inferred from a scene
    const cur = cellOf(d, r.key);
    if (!isBlankValue(d[r.key]) && isBlankValue(cur.value)) continue; // a value of unknown origin is the person's
    const next = suggest(cur, v.value, { confidence: v.confidence, source: v.source, ref: assetId ? { assetId, evidence: v.evidence } : { evidence: v.evidence } });
    if (next === cur) continue;
    cells[r.key] = next;
    if (next.value !== undefined && next.state === "default") values[r.key] = next.value;
  }
  if (Object.keys(cells).length) d = write(d, values, cells);
  return d as D;
}

export const recordHasUnconfirmed = (kind: RecordKindAI, d: RecordDomain): boolean => {
  const a = d as AnyDomain;
  return !!a.field && hasUnconfirmed(a.field as Record<string, unknown>, RECORD_SHOWN[kind].filter((k) => isSuggestedDefault(cellOf(a, k))));
};
/** Looks right: confirm the shown, populated, still-suggested fields — state only, never the source. */
export function confirmRecordDomain<D extends RecordDomain>(kind: RecordKindAI, d: D): D {
  const a = d as AnyDomain;
  if (!a.field) return d;
  const keys = RECORD_SHOWN[kind].filter((k) => isSuggestedDefault(cellOf(a, k)));
  return { ...a, field: confirmFields(a.field as Record<string, unknown>, keys) } as D;
}
/** the fields a reading filled that the person has not touched (what the card lists) */
export const recordSuggested = (kind: RecordKindAI, d: RecordDomain): string[] => {
  const a = d as AnyDomain;
  return RECORD_SHOWN[kind].filter((k) => { const c = cellOf(a, k); return !!c.value && c.state !== "cleared" && c.source !== undefined && c.source !== "user"; });
};
export function recordProvenance(kind: RecordKindAI, d: RecordDomain): Record<string, { source?: RecordSource; state: RecCell["state"]; confidence?: AIConfidence }> | undefined {
  const a = d as AnyDomain;
  const out: Record<string, { source?: RecordSource; state: RecCell["state"]; confidence?: AIConfidence }> = {};
  for (const k of RECORD_FIELDS[kind]) {
    const c = a.field?.[k];
    if (!c || (isBlankValue(c.value) && c.state === "default")) continue;
    out[k] = { ...(c.source ? { source: c.source } : {}), state: c.state, ...(c.confidence ? { confidence: c.confidence } : {}) };
  }
  return Object.keys(out).length ? out : undefined;
}
export const asHealthType = (v: string | undefined): HealthType | undefined => (v && HEALTH_TYPES.includes(v) ? (v as HealthType) : undefined);
