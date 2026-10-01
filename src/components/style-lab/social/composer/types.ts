/**
 * UNIVERSAL SOCIAL POST COMPOSER — the authoritative draft model (greenfield · 2026-09-29).
 *
 * Brief: references/social-composer/GREENFIELD-BRIEF.md. The architecture is ONE common
 * composer state plus a SELECTED DOMAIN ADAPTER — never seven independent forms (§6).
 * Common fields (text · media · people · place · audience · event time) have one source of
 * truth (§7); domains give them semantic meaning but never duplicate them.
 *
 * Nothing here is a Post or a Human Record: until POST everything is draft (§27).
 */
import type { FoodItemState, FoodSource, MealAIObservation, Moment, Privacy, RecordPlace, RecordPlaceSource } from "../data";
import { LIBRARY } from "../data";

/** §6 — the eight resolutions of one composition. `social` = no Human Record at all. */
export type RecordIntent = "social" | "moment" | "meal" | "activity" | "health" | "problem" | "project" | "meeting";
export type SpecialistIntent = Exclude<RecordIntent, "social" | "moment">;
export type RecordKind = Exclude<RecordIntent, "social">;

/** §6 — who decided the current intent. AI/media defaults never masquerade as the person. */
export type IntentSource = "default" | "user" | "media" | "ai";

/**
 * §21 — the EVENT's own time, tracked separately from postedAt. Unknown stays unknown:
 * an absent date is never replaced by the posting clock. Provenance says who supplied it.
 *
 * §18 canonical precision: exact | date-only | month | year | approximate | unknown
 * (life-period is a live seam). "month"/"year"/"approximate" keep the picked date only
 * as a sort ANCHOR — display never fabricates the finer precision. "unknown" lives on
 * the draft as `timeUnknown` (no date at all → the record is UNPLACED in the Circle).
 */
export interface EventTime {
  /** YYYY-MM-DD — for month/year/approximate this is the anchor, never the claim. */
  date: string;
  /** "day" when only a date is known; the clock part is then only a sort anchor. */
  precision: "day" | "minute" | "month" | "year" | "approximate";
  /** "ai" = Smart Assist read it from the person's own words — still theirs to edit. */
  provenance: "user" | "exif" | "circle" | "ai";
}

/** §17 — place precision tiers (exact GPS is a live seam; unknown = no place given). */
export type PlacePrecision = "venue" | "cityRegion" | "country" | "approximate";

/** UC-C4.2 — the canonical Moment.recordPlace shape, re-exported for the composer's own use. */
export type { RecordPlace, RecordPlaceSource };

/** §24 — a metadata finding awaiting the person's review (never auto-published, §23). */
export interface MetadataFinding {
  date?: string;
  place?: string;
  source: "exif";
  /** null = unreviewed; the person must Use or Ignore before POST (temporal honesty). */
  resolution: "used" | "ignored" | null;
}

/* ---- per-domain drafts (§6 domainDrafts) — preserved across category switches (§26) ---- */
export interface MomentDomain {
  feeling?: string;
  /** §13 — a milestone the person marks intentionally (projection shows it only then). */
  milestone?: string;
  /** MOMENT-007 — the richer account, distinct from the caption. Record depth only. */
  story?: string;
  /** Life period in the person's own words (the chapter OBJECT model is a live seam). */
  chapter?: string;
}
/** UC-MEAL-AI — re-exported for the composer's own use (canonical shape lives in data.ts). */
export type { FoodItemState };

/** 13_MEAL_FIELDS Advanced — one structured food/drink item ("do not flatten"). */
export interface FoodItem {
  name: string;
  quantity?: string;
  /**
   * UC-MEAL-AI — provenance + lifecycle. Both absent = a manually-typed item, byte-identical
   * to every pre-existing FoodItem. This composer's own UI resolves a rejected AI suggestion
   * by simply not adding it (matching the existing FoodItemsEditor's remove-item model) —
   * `"rejected"` is declared for a future surface that keeps a visible rejected list.
   */
  source?: FoodSource;
  state?: FoodItemState;
}
export interface MealDomain {
  occasion?: "breakfast" | "lunch" | "dinner" | "snack" | "drink" | "other";
  /** The person's own occasion wording when the canonical six don't fit. */
  occasionCustom?: string;
  items?: string;
  /** Canonical 8 contexts (13_MEAL_FIELDS): takeaway covers Takeaway–Delivery. */
  context?: "home" | "restaurant" | "takeaway" | "packaged" | "work" | "event" | "travel" | "other";
  preparation?: string;
  ingredients?: string;
  experience?: string;
  cost?: string;
  foodItems?: FoodItem[];
  notes?: string;
  /**
   * UC-MEAL-AI — this composition's own AI reading. NEVER cleared/mutated once set (§AI
   * OBSERVATION IMMUTABILITY) — it is exactly what gets carried onto the record at submit
   * (`KindFields.mealAIObservation`), independent of anything the person does with the
   * suggested foods afterward. Whether the SUGGESTION CARD is still shown is tracked
   * separately by `aiObservationDismissed` below — dismissal is a UI concern, never data loss.
   */
  aiObservation?: MealAIObservation | null;
  /** UC-MEAL-AI — the person acted on (accepted/adjusted) the current `aiObservation`, so its
   *  suggestion card stops showing. The observation itself is untouched. */
  aiObservationDismissed?: boolean;
}
export type ActivityType =
  | "run" | "walk" | "cycling" | "gym" | "hiking" | "swimming"
  | "sport" | "mindbody" | "travel" | "learning" | "hobby" | "other";
export interface ActivityDomain {
  type?: ActivityType;
  distance?: string;
  duration?: string;
  session?: string;
  sport?: string;
  practice?: string;
  intensity?: string;
  route?: string;
  goal?: string;
  notes?: string;
  /* 04_ACTIVITY_TYPES — adaptive More-details fields per subtype (all record-only). */
  purpose?: string;
  felt?: string;
  steps?: string;
  pace?: string;
  avgSpeed?: string;
  elevation?: string;
  exercises?: string;
  matchKind?: "match" | "training";
  team?: string;
  opponent?: string;
  water?: "pool" | "open";
  laps?: string;
  stroke?: string;
  style?: string;
  workedOn?: string;
  topic?: string;
  learned?: string;
  transport?: string;
}
/** 38_HEALTH_FIELDS — the canonical record types (Episode is a grouping layer, not here). */
export type HealthType =
  | "symptom" | "condition" | "injury" | "appointment" | "diagnosis" | "medication"
  | "measurement" | "test" | "imaging" | "procedure" | "vaccination" | "allergy"
  | "dental" | "vision" | "mental" | "document" | "other";
export interface HealthDomain {
  bodyArea?: string;
  healthType?: HealthType;
  severity?: string;
  /** Type-adaptive (Measurement): original value + unit, retained as given. */
  measureValue?: string;
  measureUnit?: string;
  /** Type-adaptive (Medication): identity only — prescription/plan/intake are live layers. */
  medication?: string;
  /** §16 — PRIVATE record note. Enriches the Health record; never the Social projection. */
  privateNote?: string;
}
export interface ProblemDomain {
  category?: string;
  impact?: string;
  /** IMPACT ≠ URGENCY (17_PROBLEM) — two separate optional dimensions. */
  urgency?: string;
  /** ATTEMPT = already tried; NEXT ACTION = future intent. Frozen semantics. */
  attempt?: string;
  nextAction?: string;
  relatedProject?: string;
  notes?: string;
}
export interface ProjectDomain {
  title?: string;
  goal?: string;
  milestone?: string;
  /** Aimed completion, the person's words (date object + change history are live). */
  target?: string;
  /** 23_PROJECT "Current focus" — human-readable current work (UC-C3 §52). */
  focus?: string;
  /** A related Problem in the person's words (record links are the live seam). */
  relatedProblem?: string;
  notes?: string;
}
export interface MeetingDomain {
  subject?: string;
  purpose?: string;
  online?: boolean;
  duration?: string;
  related?: string;
  notes?: string;
}
export interface DomainDrafts {
  moment: MomentDomain;
  meal: MealDomain;
  activity: ActivityDomain;
  health: HealthDomain;
  problem: ProblemDomain;
  project: ProjectDomain;
  meeting: MeetingDomain;
}

/** §6 — THE ComposerDraft. */
export interface UDraft {
  origin: "social" | "circle";
  text: string;
  /** §28 — the SOCIAL audience. Record privacy is a separate axis (owner-private default). */
  audience: Privacy;
  /* common media — UC-C3 §9: ordered ASSET references (photos and videos mixed; the lead
     position is the cover). A link is a separate reference attachment (§10), not a source. */
  mediaIds: string[];
  /** Caption for a single-video post (the accepted burned-caption model). */
  videoCaption?: string;
  link?: string;
  /* common people/place (§7 — one source of truth) */
  people: string[];
  place?: string;
  /** §17 — how precise the given place is (stored on the record for live disclosure). */
  placePrecision?: PlacePrecision;
  /**
   * UC-C4.2 — provenance of the CURRENT `place` value. Set only by the handlers that
   * actually assign `place` in this phase: metadata autofill ('metadata'), the person's own
   * typed/picked/precision action ('user'), a Smart Assist acceptance ('ai'). A metadata
   * source is never overwritten by later metadata once the person's own action has set this
   * to 'user' (user override precedence) — see `applyDetectedMetadata`.
   */
  placeSource?: RecordPlaceSource;
  /**
   * UC-C4.2 — the canonical Human Record place, tracked in PARALLEL to `place` above and
   * NEVER cleared merely by the person hiding/removing the Social place (the "No place"
   * clear handler intentionally does not touch this field): only an unambiguous, explicit
   * replacement of the record-level place changes it. Absent on every legacy/pre-UC-C4.2
   * draft; a first edit that does not touch Place keeps it that way (see `uDraftFromMoment`).
   */
  recordPlace?: RecordPlace;
  /* intent */
  intent: RecordIntent;
  intentSource: IntentSource;
  /* event time (§21) — absent means "now" for social, unknown for records */
  eventTime?: EventTime;
  /** §18 — the person states the event's date is unknown: the record is UNPLACED. */
  timeUnknown?: true;
  metadata?: MetadataFinding;
  domains: DomainDrafts;
  /**
   * UC-C3 §40/§51 — which optional More-details fields the person deliberately ADDED per
   * kind (a field also shows whenever it has a value). Lives on the draft so Keep-draft
   * restores exactly what was open.
   */
  revealed?: Partial<Record<RecordKind, string[]>>;
  editingId?: string;
}

export const EMPTY_DOMAINS: DomainDrafts = {
  moment: {}, meal: {}, activity: {}, health: {}, problem: {}, project: {}, meeting: {},
};

export function emptyUDraft(): UDraft {
  return {
    origin: "social",
    text: "",
    audience: "public",
    mediaIds: [],
    people: [],
    intent: "social",
    intentSource: "default",
    domains: { moment: {}, meal: {}, activity: {}, health: {}, problem: {}, project: {}, meeting: {} },
  };
}

/** The Circle's "Record here" doorway (§32/§origin) — an explicit Life Moment at a coordinate. */
export function circleUDraft(date: string): UDraft {
  return {
    ...emptyUDraft(),
    origin: "circle",
    intent: "moment",
    intentSource: "user",
    eventTime: { date, precision: "day", provenance: "circle" },
  };
}

/**
 * §31 — the one intent resolution. Explicit user/AI-accepted intent wins; then media means a
 * Life Moment; words alone stay Social only.
 */
export function resolveIntent(d: UDraft): RecordIntent {
  if (d.intentSource === "user" || d.intentSource === "ai") return d.intent;
  const hasMedia = d.mediaIds.length > 0 || !!d.link;
  return hasMedia ? "moment" : "social";
}

export function hasAnyMedia(d: UDraft): boolean {
  return d.mediaIds.length > 0 || !!d.link;
}

/** §34 EDIT — the same event reopens with its truth intact (A2/A3 temporal + media rules). */
export function uDraftFromMoment(m: Moment): UDraft {
  // A3 — every visual media kind round-trips as asset references; anything outside the
  // library keeps its place as `orig-<i>` (buildMedia restores the original item for it).
  const mediaIds =
    m.media?.kind === "photos"
      ? m.media.items.map((p, i) => LIBRARY.find((l) => l.src === p.src)?.id ?? `orig-${i}`)
      : m.media?.kind === "gallery"
        ? m.media.items.map((p, i) => LIBRARY.find((l) => l.src === p.src)?.id ?? `orig-${i}`)
        : m.media?.kind === "video"
          ? [LIBRARY.find((l) => l.mediaKind === "video" && l.src === (m.media as { poster: { src: string } }).poster.src)?.id ?? "orig-0"]
          : [];
  const f = m.fields ?? {};
  const intent: RecordIntent = m.record === "none" ? "social" : (m.kind as RecordIntent);
  const anchorPrecision: EventTime["precision"] =
    m.timePrecision === "month" || m.timePrecision === "year" || m.timePrecision === "approximate"
      ? m.timePrecision
      : m.atPrecision ?? "minute";
  return {
    origin: "social",
    text: m.text ?? "",
    audience: m.privacy,
    mediaIds,
    videoCaption: m.media?.kind === "video" ? m.media.caption : undefined,
    link: m.media?.kind === "link" ? m.media.url : undefined,
    people: (f.with as string[] | undefined) ?? [],
    place: m.place,
    placePrecision: m.placePrecision,
    // UC-C4.2 §16 — carry the Moment's own recordPlace over EXACTLY as it is (a legacy
    // Moment predating this schema simply has none). Never auto-promote `m.place` into a
    // fabricated recordPlace here: it stays unset until the person's OWN Place action in
    // this edit creates one. `placeSource` mirrors the Moment's own recordPlace provenance
    // when it exists; a legacy Moment's bare `place` (no recordPlace at all) is treated as
    // already-established — never silently overwritten by incidental new metadata should
    // the person attach media in this same edit without touching Place themselves.
    recordPlace: m.recordPlace,
    placeSource: m.recordPlace?.source ?? (m.place ? "user" : undefined),
    intent,
    intentSource: "user",
    // A2 — the Moment's own time is carried, never re-derived from the posting clock.
    // An unknown-date record carries NO claimed event time (its `at` is only the
    // recording anchor); everything else keeps its own date + stated precision.
    eventTime: m.timePrecision === "unknown" ? undefined : { date: m.at.slice(0, 10), precision: anchorPrecision, provenance: "user" },
    timeUnknown: m.timePrecision === "unknown" ? true : undefined,
    domains: {
      ...structuredCloneDomains(),
      moment: { feeling: m.feeling, milestone: f.milestone, story: f.story, chapter: f.chapter },
      meal: {
        occasion: f.occasion as MealDomain["occasion"], occasionCustom: f.occasionCustom, items: f.items,
        context: f.context as MealDomain["context"], preparation: f.preparation, ingredients: f.ingredients,
        experience: f.experience, cost: f.cost, foodItems: f.foodItems, notes: f.notes,
        // UC-MEAL-AI — the record's own original observation carries over on edit, unchanged;
        // this edit's UI never regenerates or replaces it (immutability, §AI OBSERVATION).
        aiObservation: f.mealAIObservation,
      },
      activity: {
        type: f.activityType as ActivityType, distance: f.distance, duration: f.duration, intensity: f.intensity,
        route: f.route, goal: f.goal, notes: f.notes, purpose: f.purpose, felt: f.felt, steps: f.steps,
        pace: f.pace, avgSpeed: f.avgSpeed, elevation: f.elevation, exercises: f.exercises,
        matchKind: f.matchKind as ActivityDomain["matchKind"], team: f.team, opponent: f.opponent,
        water: f.water as ActivityDomain["water"], laps: f.laps, stroke: f.stroke, style: f.style,
        workedOn: f.workedOn, topic: f.topic, learned: f.learned, transport: f.transport,
      },
      health: {
        bodyArea: f.bodyArea, healthType: f.healthType as HealthDomain["healthType"], severity: f.severity,
        measureValue: f.measureValue, measureUnit: f.measureUnit, medication: f.medication, privateNote: f.privateNote,
      },
      problem: { category: f.category, impact: f.impact, urgency: f.urgency, attempt: f.attempt, nextAction: f.nextAction, relatedProject: f.relatedProject, notes: f.notes },
      project: { title: f.name ?? f.title, goal: f.goal, milestone: f.milestone, target: f.target, focus: f.focus, relatedProblem: f.relatedProblem, notes: f.notes },
      meeting: { subject: f.subject, purpose: f.purpose, online: f.online, duration: f.duration, related: f.relatedProject, notes: f.notes },
    },
    editingId: m.id,
  };
}

function structuredCloneDomains(): DomainDrafts {
  return { moment: {}, meal: {}, activity: {}, health: {}, problem: {}, project: {}, meeting: {} };
}
