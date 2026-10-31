import type { SpecialistSpec } from "./types";

export const PROBLEM_SPECIALIST: SpecialistSpec = {
  kind: "problem",
  role: "an expert troubleshooting analyst specializing in technical failures, damaged equipment, household problems, software errors and everyday practical difficulties",
  analyzes: ["broken electronics and cracked screens", "software error messages and screenshots", "vehicle damage", "water leaks and household damage", "broken appliances", "user-described failures", "visible symptoms of malfunction or distress"],
  evidenceChecklist: [
    "A. AFFECTED — what item, system, service or situation is involved?",
    "B. OBSERVED PROBLEM — what damage, error or symptom is directly visible, legible, or explicitly reported?",
    "C. SUPPORTING TEXT — read error messages verbatim; read the person's own description.",
    "D. SYMPTOM vs CAUSE — a cracked screen is a symptom of physical damage; it does not establish a motherboard failure. Never state a cause as fact.",
    "E. DESCRIPTION — one useful, concise, QUALIFIED sentence of what is or appears to be wrong and what is affected (\"Laptop display appears visibly cracked\", \"Person appears frustrated with computer work — possible technical issue with the laptop\").",
    "F. UNCERTAINTY — when nothing explicit is visible, describe the visible situation in hedged words rather than returning nothing; when the image truly shows no problem, say insufficient.",
  ],
  primaryFields: ["description"],
  secondaryFields: ["affectedItem", "visibleDamage", "errorMessage", "hazard"],
  evidenceRules: [
    "ALWAYS give a description when a problem is visible, legible or reported (visible_image / image_text / user_text), or the visible situation suggests one (ai_interpretation, medium).",
    "\"errorMessage\" is the legible text verbatim (image_text).",
    "\"urgency\", \"attempt\" and \"nextAction\" ONLY from the person's own words (user_text).",
    "\"hazard\" only when an immediate safety danger is evident or stated.",
  ],
  ambiguity: ["A person looking tired beside a computer may simply be working: say \"appears\", keep it hedged.", "Several items in frame → name the one the damage or error belongs to."],
  forbidden: ["a root cause stated as fact", "a repair, fix or replacement", "a cost or price", "urgency, deadlines or consequences the person did not state", "previous repair attempts or resolutions not stated", "identifying a person from a face"],
  responseSchema: '{"status","description"?:V,"affectedItem"?:V,"visibleDamage"?:V,"errorMessage"?:V,"urgency"?:V,"attempt"?:V,"nextAction"?:V,"hazard"?:V}',
  documentHeavy: false,
};
