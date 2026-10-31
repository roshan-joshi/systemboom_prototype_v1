/**
 * Observation validator — the ONE place a provider's raw answer becomes a `RecordAIObservation`. Model output is UNTRUSTED
 * data: only the category's own contract survives (bounded strings, enum-validated Health type, user-text-only fields,
 * unknown keys dropped); every kept value is stamped with the Universal Observation Contract (evidence strength +
 * requires-confirmation). Pure: no I/O, no AI, no React — the route and the mock fixtures both run through it.
 */
import type { AIConfidence, RecordAIObservation, RecordKindAI, RecordSource, RecordValue } from "@/components/style-lab/social/data";
import { HEALTH_TYPE_VALUES } from "./specialists/health-specialist";
import { withStrength } from "./universal-observation";

const SOURCES: readonly Exclude<RecordSource, "user">[] = ["user_text", "image_text", "visible_image", "ai_interpretation"];

export function stripMarkdownFence(s: string): string {
  const t = s.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return m ? m[1] : t;
}
const conf = (v: unknown): AIConfidence | undefined => (v === "high" || v === "medium" || v === "low" ? v : typeof v === "number" && Number.isFinite(v) ? (v >= 0.8 ? "high" : v >= 0.5 ? "medium" : "low") : undefined);
const src = (v: unknown): Exclude<RecordSource, "user"> => (typeof v === "string" && (SOURCES as readonly string[]).includes(v) ? (v as Exclude<RecordSource, "user">) : "ai_interpretation");

/** one bounded observed string; anything malformed is dropped */
export function val(v: unknown, max = 160): RecordValue | undefined {
  if (!v || typeof v !== "object") return undefined;
  const r = v as Record<string, unknown>;
  const value = typeof r.value === "string" ? r.value.trim().slice(0, max) : "";
  if (!value || /^(null|insufficient|unknown|n\/a)$/i.test(value)) return undefined;
  const c = conf(r.confidence) ?? "low";
  const evidence = typeof r.evidence === "string" && r.evidence.trim() ? r.evidence.trim().slice(0, 200) : undefined;
  return withStrength({ value, confidence: c, source: src(r.source), ...(evidence ? { evidence } : {}) });
}
export function list(v: unknown, max = 12): RecordValue<string[]> | undefined {
  if (!v || typeof v !== "object") return undefined;
  const r = v as Record<string, unknown>;
  const items = Array.isArray(r.value) ? r.value.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim().slice(0, 160)).slice(0, max) : [];
  if (!items.length) return undefined;
  return withStrength({ value: items, confidence: conf(r.confidence) ?? "low", source: src(r.source) });
}
export function actions(v: unknown): RecordValue<{ action: string; owner?: string; due?: string }[]> | undefined {
  if (!v || typeof v !== "object") return undefined;
  const r = v as Record<string, unknown>;
  const items = Array.isArray(r.value)
    ? r.value
        .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
        .map((x) => ({ action: typeof x.action === "string" ? x.action.trim().slice(0, 160) : "", owner: typeof x.owner === "string" && x.owner.trim() ? x.owner.trim().slice(0, 60) : undefined, due: typeof x.due === "string" && x.due.trim() ? x.due.trim().slice(0, 40) : undefined }))
        .filter((x) => x.action)
        .slice(0, 12)
    : [];
  if (!items.length) return undefined;
  return withStrength({ value: items, confidence: conf(r.confidence) ?? "low", source: src(r.source) });
}
const onlyUserText = (v?: RecordValue): RecordValue | undefined => (v && v.source === "user_text" ? v : undefined);

export type ValidationOutcome = { ok: true; observation: RecordAIObservation } | { ok: false; reason: "empty" | "invalid_json" | "not_object" };

/** Only the category's own contract survives; `insufficient` when nothing usable was read. Never throws. */
export function validateRecordObservation(kind: RecordKindAI, raw: string | null | undefined): ValidationOutcome {
  if (!raw) return { ok: false, reason: "empty" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripMarkdownFence(raw));
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { ok: false, reason: "not_object" };
  const o = parsed as Record<string, unknown>;
  let body: RecordAIObservation[RecordKindAI] | undefined;
  switch (kind) {
    case "project":
      body = { name: val(o.name, 80), goal: val(o.goal, 160), description: val(o.description, 160), stage: val(o.stage, 60), tasks: list(o.tasks) };
      break;
    case "problem":
      body = { description: val(o.description, 200), affectedItem: val(o.affectedItem, 60), visibleDamage: val(o.visibleDamage, 120), errorMessage: val(o.errorMessage, 160), urgency: onlyUserText(val(o.urgency, 40)), attempt: onlyUserText(val(o.attempt, 160)), nextAction: onlyUserText(val(o.nextAction, 160)), hazard: val(o.hazard, 120) };
      break;
    case "meeting":
      body = { subject: val(o.subject, 100), purpose: val(o.purpose, 160), agenda: list(o.agenda), actions: actions(o.actions), decisions: list(o.decisions), participants: list(o.participants, 20) };
      break;
    case "health": {
      const type = val(o.type, 20);
      body = {
        type: type && (HEALTH_TYPE_VALUES as readonly string[]).includes(type.value.toLowerCase()) ? { ...type, value: type.value.toLowerCase() } : undefined,
        description: val(o.description, 200),
        bodyArea: val(o.bodyArea, 40),
        severity: onlyUserText(val(o.severity, 40)),
        onset: onlyUserText(val(o.onset, 60)),
        reportedDiagnosis: onlyUserText(val(o.reportedDiagnosis, 100)),
        documentType: val(o.documentType, 40),
      };
      break;
    }
  }
  const clean = Object.fromEntries(Object.entries(body ?? {}).filter(([, v]) => v !== undefined));
  const complete = Object.keys(clean).length > 0;
  return { ok: true, observation: { category: kind, status: complete ? "complete" : "insufficient", [kind]: clean } as RecordAIObservation };
}
/** the legacy one-call shape (null for anything invalid) — kept for the mock fixtures */
export const normalizeRecordObservation = (kind: RecordKindAI, raw: string | null | undefined): RecordAIObservation | null => {
  const r = validateRecordObservation(kind, raw);
  return r.ok ? r.observation : null;
};
