/**
 * V0.4 P1 — the SEVEN-category classifier (Stage B). Deterministic, server-side, pure: it reads the neutral Pass 1 observation
 * plus the model's own seven relevance scores and produces ONE suggestion + up to two alternatives — never a selection. The
 * PRIMARY-SUBJECT RULE is enforced here, not trusted to the model: a construction site with workers is a Project, not an
 * Activity; a runner is an Activity; plated food is a Meal; a whiteboard with an agenda is a Meeting; a lab report is Health;
 * an empty chair has no specialist match and is offered as a Life Moment.
 */
import { KNOWLEDGE_RULES, type KnowledgeCategory } from "../knowledge/ai-knowledge-base";
import { visionEvidenceText, type PrimarySubject, type UniversalVisualObservationV1 } from "./universal-visual-observation";

export type SuggestKind = "moment" | "meal" | "activity" | "health" | "problem" | "project" | "meeting";
export const SUGGEST_KINDS: readonly SuggestKind[] = ["moment", "meal", "activity", "health", "problem", "project", "meeting"];

export interface CategoryScore {
  kind: SuggestKind;
  score: number; // 0..1
  confidence: "high" | "medium" | "low";
}
export interface CategorySuggestion {
  schemaVersion: 1;
  primary: CategoryScore;
  alternatives: CategoryScore[];
  /** true when no specialist category reaches the floor — the neutral Life Moment is offered, nothing is claimed */
  noMatch: boolean;
  /** the rule ids that shaped the decision (record-only / tests) */
  reasons: string[];
}

export const SUGGEST_FLOOR = 0.45;
export const ALTERNATIVE_FLOOR = 0.3;
const label = (s: number): CategoryScore["confidence"] => (s >= 0.75 ? "high" : s >= SUGGEST_FLOOR ? "medium" : "low");
const clamp = (n: number) => Math.max(0, Math.min(1, n));

/** model scores are untrusted numbers: validated, bounded, defaulted to 0 */
export function normalizeScores(raw: unknown): Record<SuggestKind, number> {
  const out = Object.fromEntries(SUGGEST_KINDS.map((k) => [k, 0])) as Record<SuggestKind, number>;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const r = raw as Record<string, unknown>;
    for (const k of SUGGEST_KINDS) {
      const alias = k === "moment" ? (r.moment ?? r.lifeMoment ?? r.life_moment) : r[k];
      const n = typeof alias === "number" ? alias : typeof alias === "string" ? ({ high: 0.85, medium: 0.6, low: 0.25 } as Record<string, number>)[alias] ?? Number(alias) : NaN;
      out[k] = Number.isFinite(n) ? clamp(n) : 0;
    }
  }
  return out;
}

const CONSTRUCTION = /scaffold|construction|crane|building site|under construction|hard hat|rebar|reinforcement|excavat|concrete|blueprint|site plan|floor plan/i;
const DOCUMENT = /report|form|letter|document|prescription|receipt|invoice|agenda|minutes|slide|whiteboard|notes/i;

/**
 * UHI-DEC-014 — PRIMARY EXPERIENCE OVER INCIDENTAL OBJECTS.
 *
 * A category's characteristic OBJECT appearing in a photograph does not make that category the experience: cake at a
 * birthday, food at a wedding, workers on a site, a whiteboard in an office, a laptop on a desk. Each specialist category
 * therefore declares the SUBJECT (and, where it matters, the observable action) that must be present before it may LEAD a
 * suggestion. Without that support the category is INCIDENTAL: it stays available as an alternative the person can choose,
 * but it cannot outrank a human occasion the evidence actually supports.
 *
 * This is one rule over `primarySubject` + observable actions — the neutral Pass 1 facts — not a table of object shortcuts.
 */
type Support = { supported: boolean; why: string };
/**
 * `raw` is the model's OWN seven-way score, before any support is added, and `legacy` carries the dedicated classifiers'
 * verdicts from the same call (`isFood`, and "this is an activity and the activity is the subject"). Meal and Activity are
 * supported either by the picture's subject OR by BOTH of their own judges agreeing strongly — a real photograph often
 * labels its subject as the person holding the plate, and a category must not be demoted by that wording alone. The
 * incidental case stays caught, because there the model's own score for that category is low (cake at a birthday: 0.2).
 */
function subjectSupport(kind: SuggestKind, subject: PrimarySubject, hasAction: boolean, establishedByRule: Set<SuggestKind>, raw: Record<SuggestKind, number>, legacy?: { isFood?: boolean; activityHigh?: boolean }): Support {
  if (establishedByRule.has(kind)) return { supported: true, why: "" };
  const personDoingSomething = subject === "person" && hasAction;
  switch (kind) {
    // food must BE the subject of the picture — or its own two judges must both say so
    case "meal":
      return { supported: subject === "food" || (!!legacy?.isFood && raw.meal >= OWN_JUDGE_STRONG), why: "meal.needs-food-subject" };
    // a person doing something must be the subject — people inside a wider scene are participants, not the activity
    case "activity":
      return { supported: (subject === "person" && hasAction) || (!!legacy?.activityHigh && raw.activity >= OWN_JUDGE_STRONG), why: "activity.needs-person-doing" };
    // the board, agenda or notes must BE what was photographed — a whiteboard on an office wall is furniture
    case "meeting":
      return { supported: subject === "document" || subject === "screen", why: "meeting.needs-document-subject" };
    // the work, the document, the thing itself is the subject — not a plate of food or someone mid-action
    case "project":
    case "health":
    case "problem":
      return { supported: !personDoingSomething && subject !== "food", why: `${kind}.needs-own-subject` };
    default:
      return { supported: true, why: "" };
  }
}

/**
 * The model's own score LEADS and is never reduced — a matching Knowledge-Base rule can only add to it. (Damping every
 * score was a defect: only categories with rules could earn it back, so Life Moment — which has none — was structurally
 * penalised and a clear celebration fell under its own threshold.)
 */
const KB_SUPPORT = 0.25;
/** a category whose own dedicated judge AND seven-way score both say "this is it", even if the subject wording differs */
const OWN_JUDGE_STRONG = 0.75;
/**
 * A Knowledge-Base rule may lift a category INTO the suggestion band — it may never push one PAST the model's own stronger
 * judgment. (Without this ceiling a single word match, "dinner" inside "anniversary dinner party", lifted Meal above an
 * occasion the model scored higher — the object-shortcut failure this whole rule set exists to prevent.)
 */
const KB_LIFT_CEILING = 0.65;
/** an incidental category can still be offered — it simply may not lead past this band */
export const INCIDENTAL_CEILING = 0.44;
/** a human occasion this strong outranks a category supported only by an object in the frame */
export const OCCASION_LEAD = 0.6;
/** scores this close are a genuine ambiguity: offer both, and say "likely" rather than "best" */
export const AMBIGUITY_BAND = 0.15;
/** food present AND the subject keeps Meal in the suggestion band — it never overrides the model's own hedging */
export const FOOD_SUBJECT_FLOOR = SUGGEST_FLOOR + 0.1;

export function classifyCategories(vision: UniversalVisualObservationV1 | null, modelScores: unknown, legacy?: { isFood?: boolean; activityHigh?: boolean }): CategorySuggestion {
  const s = normalizeScores(modelScores);
  const reasons: string[] = [];
  const evidence = vision ? visionEvidenceText(vision) : "";
  const subject = vision?.primarySubject ?? "unknown";
  const hasAction = !!vision?.actions.length;

  // 1. the model's own judgment of all seven, supported (never replaced) by Knowledge-Base rules over what is visible
  const boost: Partial<Record<SuggestKind, number>> = {};
  if (evidence) {
    for (const r of KNOWLEDGE_RULES) if (r.patterns.some((p) => p.test(evidence))) { const k = r.category as KnowledgeCategory as SuggestKind; boost[k] = Math.max(boost[k] ?? 0, KB_SUPPORT); reasons.push(r.id); }
  }
  const raw = { ...s };
  for (const k of SUGGEST_KINDS) {
    const b = boost[k] ?? 0;
    s[k] = b ? clamp(Math.max(raw[k], Math.min(raw[k] + b, KB_LIFT_CEILING))) : raw[k];
  }

  // 2. legacy signals from the same call. `isFood` means FOOD IS PRESENT — not that the meal is the experience, so it
  //    raises Meal fully only when food is also the subject; otherwise it merely keeps Meal available as a candidate.
  if (legacy?.isFood) {
    const asSubject = subject === "food";
    s.meal = Math.max(s.meal, asSubject ? FOOD_SUBJECT_FLOOR : SUGGEST_FLOOR);
    reasons.push(asSubject ? "legacy.isFood-as-subject" : "legacy.isFood-present-only");
  }
  if (legacy?.activityHigh) { s.activity = Math.max(s.activity, 0.8); reasons.push("legacy.activityHigh"); }

  // 3. SUBJECT RULES — a scene whose subject is the work itself is that work (a site is a Project, not the workers' Activity)
  const establishedByRule = new Set<SuggestKind>();
  if (CONSTRUCTION.test(evidence) && subject !== "person" && subject !== "food") {
    s.project = Math.max(s.project, 0.8);
    s.activity = Math.min(s.activity, INCIDENTAL_CEILING); // the site is the subject; the workers in it are not the experience
    establishedByRule.add("project");
    reasons.push("rule.construction-is-project");
  }
  if (subject === "document" && !DOCUMENT.test(evidence)) reasons.push("rule.document-without-known-type");

  // 4. INCIDENTAL-OBJECT CEILING — a category may lead only where its OWN subject is what was photographed. Every
  //    correct outcome in this product's own table is subject-supported (plated food, a runner, a site, a board, a
  //    report, a damaged thing); a category present only as an object in someone else's scene is held below the lead
  //    band and offered as a choice instead. With no Pass 1 observation there is no subject evidence either, so nothing
  //    is demoted (legacy readings behave exactly as before).
  const incidental = new Set<SuggestKind>();
  for (const k of SUGGEST_KINDS) {
    if (k === "moment" || s[k] < SUGGEST_FLOOR || !vision) continue;
    const sup = subjectSupport(k, subject, hasAction, establishedByRule, raw, legacy);
    if (sup.supported) continue;
    incidental.add(k);
    s[k] = Math.min(s[k], INCIDENTAL_CEILING);
    reasons.push(`rule.incidental:${sup.why}`);
  }

  // 5. decision — the primary human experience leads; Life Moment is a real answer, never a consolation
  const specialists = SUGGEST_KINDS.filter((k) => k !== "moment").map((k) => ({ kind: k, score: s[k], confidence: label(s[k]) })).sort((a, b) => b.score - a.score);
  const top = specialists[0];
  const moment: CategoryScore = { kind: "moment", score: s.moment, confidence: label(s.moment) };
  const specialistLeads = !!top && top.score >= SUGGEST_FLOOR && top.score >= s.moment;
  if (incidental.size) reasons.push("rule.experience-over-incidental-object");

  const noSpecialist = !top || top.score < SUGGEST_FLOOR;
  const noMatch = noSpecialist && s.moment < OCCASION_LEAD;
  const primary: CategoryScore = !noSpecialist && specialistLeads ? { ...top } : { ...moment, score: Math.max(s.moment, 0.5), confidence: label(Math.max(s.moment, 0.5)) };

  // alternatives: the other supported candidates, plus the one that just lost — a near-tie is a real choice, not a verdict
  const pool: CategoryScore[] = [...specialists, moment].filter((c) => c.kind !== primary.kind);
  const alternatives = pool
    .filter((c) => c.score >= ALTERNATIVE_FLOOR || (c.kind === primary.kind ? false : Math.abs(primary.score - c.score) <= AMBIGUITY_BAND && c.score >= INCIDENTAL_CEILING))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  // honest uncertainty — when the runner-up is within the ambiguity band the primary is a LIKELY match, not a best one
  const closest = alternatives[0];
  const ambiguous = !!closest && Math.abs(primary.score - closest.score) <= AMBIGUITY_BAND;
  if (ambiguous && primary.confidence === "high") {
    primary.confidence = "medium";
    reasons.push("rule.ambiguous-primary-stated-as-likely");
  }
  return { schemaVersion: 1, primary, alternatives, noMatch, reasons };
}
