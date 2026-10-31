/**
 * Knowledge Engine — deterministic post-processing of ONE validated specialist observation (or of its absence):
 *   1. receive the validated observation (or null)  2. gather its evidence labels + the person's words
 *   3. match Knowledge-Base rules  4. check category compatibility (a conflict becomes a HINT, never an override)
 *   5. apply safe generic fallbacks ONLY into fields that are still empty (title / description / Health type)
 *   6. return the observation for the V2 mapper (which protects confirmed / corrected / cleared fields on its own).
 * Failure behaviour: with no observation at all, the person's own words (and nothing else) may seed the catch-all
 * description — never an unseen object. Pure, synchronous, no I/O.
 */
import type { RecordAIObservation, RecordKindAI, RecordValue } from "@/components/style-lab/social/data";
import { withStrength } from "../universal-observation";
import { KNOWLEDGE_RULES, type KnowledgeCategory, type KnowledgeRule } from "./ai-knowledge-base";

const KB = (value: string): RecordValue => withStrength({ value, confidence: "medium", source: "system_knowledge" });
const TEXT = (value: string): RecordValue => withStrength({ value: value.trim().slice(0, 200), confidence: "medium", source: "user_text" });

/** every string the observation carries — values and evidence — plus the person's words */
function evidenceText(o: RecordAIObservation | null, text: string): string {
  const parts: string[] = [text];
  const walk = (v: unknown) => {
    if (!v) return;
    if (typeof v === "string") parts.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === "object") Object.values(v as Record<string, unknown>).forEach(walk);
  };
  if (o) walk(o[o.category]);
  return parts.join(" \n ");
}
export function matchRules(evidence: string): KnowledgeRule[] {
  return KNOWLEDGE_RULES.filter((r) => r.patterns.some((p) => p.test(evidence)));
}

export interface KnowledgeResult {
  observation: RecordAIObservation;
  matched: string[];
  filled: string[];
}

export function applyKnowledge(kind: RecordKindAI, validated: RecordAIObservation | null, text: string): KnowledgeResult {
  const base: RecordAIObservation = validated ?? { category: kind, status: "insufficient" };
  const block = { ...((base[kind] ?? {}) as Record<string, RecordValue | undefined>) };
  const matched = matchRules(evidenceText(validated, text));
  const own = matched.filter((r) => r.category === kind);
  const filled: string[] = [];
  const fill = (key: string, v: RecordValue | undefined) => {
    if (!v || block[key]) return;
    block[key] = v;
    filled.push(key);
  };
  const first = own[0];
  const bare = !validated || validated.status === "insufficient"; // no reading at all — the person's own words may seed the catch-all
  switch (kind) {
    case "project":
      fill("name", first?.fallbackTitle ? KB(first.fallbackTitle) : undefined);
      if (bare && text.trim().length >= 3) fill("description", TEXT(text));
      else fill("description", first?.fallbackDescription ? KB(first.fallbackDescription) : undefined);
      break;
    case "problem":
      fill("description", first?.fallbackDescription ? KB(first.fallbackDescription) : bare && text.trim().length >= 3 ? TEXT(text) : undefined);
      break;
    case "meeting":
      fill("subject", first?.fallbackTitle ? KB(first.fallbackTitle) : undefined);
      fill("purpose", bare && text.trim().length >= 3 ? TEXT(text) : undefined);
      break;
    case "health":
      fill("type", first?.healthType ? KB(first.healthType) : undefined);
      fill("description", bare && text.trim().length >= 3 ? TEXT(text) : first?.fallbackDescription ? KB(first.fallbackDescription) : undefined);
      break;
  }
  // category compatibility — evidence that points at ANOTHER category is a hint for the existing suggestion mechanism
  const others = matched.map((r) => r.category).filter((c): c is KnowledgeCategory => c !== kind);
  const hint = own.length === 0 && others.length ? others[0] : undefined;
  const complete = Object.values(block).some((v) => v !== undefined);
  const observation: RecordAIObservation = { ...base, category: kind, status: complete ? "complete" : "insufficient", [kind]: block, ...(hint ? { categoryHint: hint } : {}), ...(matched.length ? { knowledge: matched.map((r) => r.id) } : {}) };
  return { observation, matched: matched.map((r) => r.id), filled };
}
