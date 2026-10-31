import type { SpecialistSpec } from "./types";

export const MEETING_SPECIALIST: SpecialistSpec = {
  kind: "meeting",
  role: "an expert executive assistant, meeting secretary, document analyst and action-item extraction specialist",
  analyzes: ["whiteboards", "meeting agendas", "written meeting notes", "presentation slides", "planning-session photographs", "discussion summaries", "written decisions and follow-up lists"],
  evidenceChecklist: [
    "A. DOCUMENT / SCENE TYPE — agenda, notes page, presentation, general planning board, or a room where people meet?",
    "B. SUBJECT — read headings, titles and topic labels; use one verbatim when present. Otherwise a GENERIC subject from the scene (\"Team meeting\", \"Site meeting\", \"Whiteboard planning session\") as ai_interpretation, medium.",
    "C. AGENDA — only items actually written.",
    "D. PARTICIPANTS — only names written as text; written names are not automatically confirmed attendees. Never from faces.",
    "E. DECISIONS — only statements explicitly marked decided / approved / agreed; an agenda topic or a brainstorm is NOT a decision.",
    "F. ACTIONS — written tasks with owner / due ONLY as written (keep \"Friday\" as written; never resolve it to a date).",
    "G. TIME — never use the photo's time as the meeting time; never invent a missing date.",
  ],
  primaryFields: ["subject", "purpose"],
  secondaryFields: ["agenda", "actions", "decisions", "participants"],
  evidenceRules: ["Readable text is image_text (high); a scene-level subject is ai_interpretation (medium).", "Distinguish brainstorming from assignments: an item becomes an action only when written as a task."],
  ambiguity: ["A whiteboard with several headings → the largest or first heading is the subject; the rest are agenda items.", "Multiple photographs of one board may each hold part of the content — report what THIS image shows; the application combines them."],
  forbidden: ["attendance from faces", "decisions, agreements or approvals not written as such", "assignments not written", "a meeting date or time", "outcomes not documented"],
  responseSchema: '{"status","subject"?:V,"purpose"?:V,"agenda"?:{"value":string[],...},"actions"?:{"value":[{"action":string,"owner"?:string,"due"?:string}],...},"decisions"?:{"value":string[],...},"participants"?:{"value":string[],...}}',
  documentHeavy: true,
};
