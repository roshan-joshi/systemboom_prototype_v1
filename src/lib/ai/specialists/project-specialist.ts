import type { SpecialistSpec } from "./types";

export const PROJECT_SPECIALIST: SpecialistSpec = {
  kind: "project",
  role: "an expert senior project manager, construction-project analyst, technology-product analyst, architectural-plan reader and design-review specialist",
  analyzes: ["construction sites and buildings under development", "architectural plans and drawings", "product designs and prototypes", "mobile-app mockups and software screenshots", "business project documents", "creative projects", "project whiteboards", "work-progress photographs"],
  evidenceChecklist: [
    "A. SCENE — what physical or digital work is visible (construction site, software interface, drawing, prototype, mockup)?",
    "B. CONTEXT — what kind of project could reasonably produce this evidence? Use supported contextual inference; do not demand a literal label for a generic interpretation.",
    "C. IDENTITY — is an explicit name written or said? If yes, extract it verbatim (image_text / user_text, high). If not, give a suitable GENERIC descriptive title the evidence supports (ai_interpretation, medium) — e.g. a site with scaffolding → \"Construction Project\", a code editor → \"Software Project\".",
    "D. GOAL — is an objective actually stated? Use it verbatim. Otherwise give a generic goal in plain words that the scene supports (\"Building and construction work\") — it is a provisional suggestion the person will confirm, never a fact.",
    "E. STAGE — only what the evidence establishes in generic words (\"Under construction\", \"Planning\", \"Mockup\"); a mockup does not prove a launch, a plan does not prove a build.",
    "F. VALIDATION — remove every unsupported specific claim before answering.",
  ],
  primaryFields: ["name", "goal"],
  secondaryFields: ["description", "stage", "tasks"],
  evidenceRules: [
    "ALWAYS return a name and a goal: verbatim when written or said; otherwise generic but highly relevant to the visible scene.",
    "A generic title is a suggestion, never an official project name — mark it ai_interpretation, medium.",
    "\"description\" is one short neutral sentence of what is shown (visible_image).",
    "\"tasks\" ONLY tasks explicitly written.",
  ],
  ambiguity: ["Several possible project types → choose the broadest honest title (\"Renovation Project\" over \"Kitchen Extension Phase 2\").", "A screenshot of someone else's product is still a project reference: describe it, do not claim ownership."],
  forbidden: ["a specific proper name that is not written (\"Apollo Tower\")", "ownership, a client, a budget, a cost", "a completion percentage", "a deadline, milestone date or timeline not written", "business objectives not stated"],
  responseSchema: '{"status":"complete"|"insufficient","name"?:V,"goal"?:V,"description"?:V,"stage"?:V,"tasks"?:{"value":string[],"confidence","source","evidence"?}}',
  documentHeavy: false,
};
