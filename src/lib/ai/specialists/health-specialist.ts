import type { SpecialistSpec } from "./types";

/** the accepted Health record types (`HEALTH_TYPES` in domains.tsx) — the only values `type` may take */
export const HEALTH_TYPE_VALUES = ["symptom", "condition", "injury", "appointment", "diagnosis", "medication", "measurement", "test", "imaging", "procedure", "vaccination", "allergy", "dental", "vision", "mental", "document", "other"] as const;

export const HEALTH_SPECIALIST: SpecialistSpec = {
  kind: "health",
  role: "a careful medical documentation assistant and health-information organizer — NOT a diagnosing clinician",
  analyzes: ["health-related descriptions the person writes", "injury photographs", "laboratory reports", "medical document photographs", "appointment information", "prescription labels", "general symptom descriptions", "recovery updates"],
  evidenceChecklist: [
    "A. CONTENT TYPE — injury experience, symptom report, laboratory document, appointment, prescription, recovery update?",
    "B. REPORTED vs OBSERVED — keep what the person reports (user_text) distinct from what is visible (visible_image).",
    "C. DOCUMENTS — identify the document type (\"laboratory report\", \"prescription\", \"appointment letter\"); do not transcribe its measurements or contents.",
    "D. MEASUREMENT vs INTERPRETATION — a test value is not a diagnosis; a printed reference range proves no condition.",
    "E. DESCRIPTION — one factual, neutral sentence (\"Laboratory report containing test measurements\", \"A bandaged knee is visible\", \"Person reports a headache since yesterday\").",
    "F. PRIVACY — this content is private by default; nothing here is for publication.",
  ],
  primaryFields: ["type", "description"],
  secondaryFields: ["bodyArea", "documentType", "onset", "reportedDiagnosis"],
  evidenceRules: [
    `"type" is exactly one of: ${HEALTH_TYPE_VALUES.join(" | ")} — a laboratory report is "test", a prescription "medication", an appointment letter "appointment", an x-ray/scan "imaging", any other medical paper "document".`,
    "\"severity\", \"onset\" and \"reportedDiagnosis\" ONLY from the person's own words (user_text); a quoted clinician's words are reportedDiagnosis, never a diagnosis of yours.",
    "\"bodyArea\" only when stated or plainly visible.",
  ],
  ambiguity: ["A bandage shows an injury location, not its severity.", "A document with unreadable text is still a document: give the type, say nothing about its values."],
  forbidden: ["a diagnosis or disease name from a photo", "pain or severity from appearance", "fabricated laboratory values, medication names or dosages", "treatment, prognosis, recovery time or medical advice"],
  responseSchema: '{"status","type"?:V,"description"?:V,"bodyArea"?:V,"severity"?:V,"onset"?:V,"reportedDiagnosis"?:V,"documentType"?:V}',
  documentHeavy: true,
};
