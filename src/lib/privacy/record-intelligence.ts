/**
 * V0.4 P1 CORRECTION 1 — PRIVATE INTELLIGENCE BOUNDARY.
 *
 * AI-generated observations (recognized objects, scene, actions, extracted text, evidence, confidences, category scores,
 * provenance, per-asset readings) are private internal intelligence of the record's OWNER — never public Social content.
 * This module is the ONE serialization rule every public projection applies: the feed another person sees, "View as
 * public", search rows, and any future API that returns a post to anyone but its author. The owner's own view and the
 * private record keep everything (authorized private processing — Looks right / Adjust / Circle depth — still needs it).
 *
 * The rule is a key DENY-LIST on `Moment.fields` and `Moment` itself, applied by `publicMomentFor`; a caller cannot opt back
 * in (`publicPostPayload` ignores any "include" request — PRI-P1-008). Pure TypeScript, no I/O.
 */
import type { KindFields, Moment } from "@/components/style-lab/social/data";

/** every `fields` key that carries intelligence or provenance — not a user-approved value */
export const PRIVATE_INTELLIGENCE_FIELD_KEYS = [
  "visualObservation",
  "mealAIObservation",
  "activityAIObservation",
  "recordAIObservation",
  "recordProvenance",
  "activityProvenance",
  "mealAssets",
  "mixedAssets",
  "mealNutrition",
  "foodItems",
] as const satisfies readonly (keyof KindFields)[];

/** `Moment`-level keys that are provenance, not content */
export const PRIVATE_INTELLIGENCE_MOMENT_KEYS = ["recordPlace"] as const satisfies readonly (keyof Moment)[];

const FIELD_SET = new Set<string>(PRIVATE_INTELLIGENCE_FIELD_KEYS);
const MOMENT_SET = new Set<string>(PRIVATE_INTELLIGENCE_MOMENT_KEYS);

export function stripPrivateIntelligence(fields: KindFields | undefined): KindFields | undefined {
  if (!fields) return fields;
  const out: Record<string, unknown> = {};
  let changed = false;
  for (const [k, v] of Object.entries(fields)) {
    if (FIELD_SET.has(k)) { changed = true; continue; }
    out[k] = v;
  }
  return changed ? (out as KindFields) : fields;
}

/** the Moment as anyone but its owner may receive it — same object when nothing had to go (cheap, referentially stable) */
export function publicMomentFor(m: Moment, viewerIsOwner: boolean): Moment {
  if (viewerIsOwner) return m;
  const fields = stripPrivateIntelligence(m.fields);
  const hasMomentKey = PRIVATE_INTELLIGENCE_MOMENT_KEYS.some((k) => k in m);
  if (fields === m.fields && !hasMomentKey) return m;
  const copy: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(m)) if (!MOMENT_SET.has(k)) copy[k] = v;
  if (fields) copy.fields = fields;
  else delete copy.fields;
  return copy as unknown as Moment;
}

/** the outbound public payload of a post — the deny-list cannot be bypassed by asking for hidden properties */
export function publicPostPayload(m: Moment, _request?: { include?: readonly string[] }): Moment {
  void _request; // deliberately ignored — there is no public opt-in for private intelligence
  return publicMomentFor(m, false);
}

/** true when a serialized value still carries private intelligence (used by tests and guards) */
export function containsPrivateIntelligence(value: unknown): boolean {
  const s = JSON.stringify(value) ?? "";
  return [...FIELD_SET, ...MOMENT_SET, "evidenceStrength", "requiresConfirmation", "primarySubject", "categories"].some((k) => s.includes(`"${k}"`));
}
