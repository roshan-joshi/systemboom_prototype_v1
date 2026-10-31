/**
 * UNIVERSAL MEDIA INTELLIGENCE ENGINE V3 — the Universal Observation Contract.
 *
 * Every specialist (Project · Problem · Meeting · Health) answers in its own category shape (`RecordAIObservation`, the
 * accepted V2-compatible type in `data.ts`); this module is the ONE shared vocabulary layered on top of it:
 *   · `EvidenceStrength` — how a value is supported: read/seen/said (`direct`), a reasonable reading of the scene
 *     (`supported_inference`), a deterministic Knowledge-Base fallback (`generic_fallback`), or `unknown`.
 *   · `requiresConfirmation` — anything that is not a direct, high-confidence reading is PROVISIONAL: it fills the field as a
 *     suggested default (the V2 contract's `default` state) and waits for Looks right / an edit / a clear.
 *   · `toUniversalObservation` — the category-neutral projection (primary identity + catch-all description) used by the
 *     Knowledge Engine and tests. No parallel state: it is derived from the stored observation, never persisted twice.
 * Pure TypeScript: no I/O, no AI, no React.
 */
import type { RecordAIObservation, RecordKindAI, RecordSource, RecordValue } from "@/components/style-lab/social/data";

export type EvidenceStrength = "direct" | "supported_inference" | "generic_fallback" | "unknown";

/** the strength a value's SOURCE implies — the validator stamps it, the mapper reads it */
export function strengthOf(source: Exclude<RecordSource, "user">): EvidenceStrength {
  switch (source) {
    case "user_text":
    case "image_text":
    case "visible_image":
      return "direct";
    case "ai_interpretation":
      return "supported_inference";
    case "system_knowledge":
      return "generic_fallback";
    default:
      return "unknown";
  }
}
/** a value needs the person's confirmation unless it was directly read/seen/said with high confidence */
export const needsConfirmation = (v: Pick<RecordValue<unknown>, "confidence" | "source">): boolean => strengthOf(v.source) !== "direct" || v.confidence !== "high";

/** stamp the shared contract onto a category value (idempotent; never changes value/source/confidence) */
export function withStrength<T>(v: RecordValue<T>): RecordValue<T> {
  return { ...v, evidenceStrength: strengthOf(v.source), requiresConfirmation: needsConfirmation(v) };
}

export interface UniversalObservation {
  schemaVersion: 1;
  assetId: string | null;
  category: RecordKindAI;
  status: RecordAIObservation["status"];
  /** the one value that names the record (project name · problem description · meeting subject · health type) */
  primaryIdentity: RecordValue | null;
  /** the neutral description every specialist can give even when the identity is unknown */
  catchAllDescription: RecordValue | null;
  /** a different category the evidence points at — a HINT for the existing suggestion mechanism, never an override */
  categoryHint?: RecordAIObservation["categoryHint"];
  observations: Record<string, unknown>;
}

export function toUniversalObservation(o: RecordAIObservation, assetId: string | null = null): UniversalObservation {
  const block = (o[o.category] ?? {}) as Record<string, RecordValue | undefined>;
  const identity = o.category === "project" ? block.name : o.category === "problem" ? block.description : o.category === "meeting" ? block.subject : block.type;
  return {
    schemaVersion: 1,
    assetId,
    category: o.category,
    status: o.status,
    primaryIdentity: identity ?? null,
    catchAllDescription: (o.category === "problem" ? block.description : block.description) ?? null,
    ...(o.categoryHint ? { categoryHint: o.categoryHint } : {}),
    observations: { ...block },
  };
}
