import type { RecordKindAI } from "@/components/style-lab/social/data";

/**
 * One specialist persona = one typed instruction set. The prompt builder renders it; the validator enforces the same
 * contract on the way back (nothing a persona is forbidden to conclude can survive normalization either).
 */
export interface SpecialistSpec {
  kind: RecordKindAI;
  /** the expert role the model plays — stated first in the system prompt */
  role: string;
  /** the kinds of material this specialist analyzes */
  analyzes: string[];
  /** the INTERNAL evidence-review procedure (performed before answering; never narrated back) */
  evidenceChecklist: string[];
  /** the fields this specialist is responsible for filling (the mapper's targets) */
  primaryFields: string[];
  /** observation-only fields (shown on the card or kept at record depth, never a form field) */
  secondaryFields: string[];
  /** how strong the evidence must be per claim; where a generic suggestion is welcome */
  evidenceRules: string[];
  /** known ambiguities and how to resolve them */
  ambiguity: string[];
  /** conclusions this specialist must never draw — the validator drops them too */
  forbidden: string[];
  /** the exact JSON response contract (the accepted V2 category shape) */
  responseSchema: string;
  /** whether this category typically carries dense text/documents (drives the reasoning policy) */
  documentHeavy: boolean;
}
