/**
 * SEED CONTENT — style-lab Social preview (Phase 4 final).
 * Real places, plausible human moments, the demo identities. Photography is
 * CC-licensed from Wikimedia Commons (public/mock/social/CREDITS.md).
 * Nothing here is product data; it exists so the design can be judged with
 * real content and real edge cases (see §11 of the build order).
 */

import { demoUser } from "@/lib/mock/demo-user";

export interface Person {
  id: string;
  name: string;
  avatar?: string;
  birthDate: string;
  birthTime?: string;
  birthTimeKnown: boolean;
  home: string;
  verified?: boolean;
  phone?: string;
  email?: string;
  cover?: string;
  /** Phase 4.4-A — set only on the neutral stand-in returned for an id that resolves to no known
   *  person. Never on real people. Surfaces render it as unavailable, never as someone else. */
  unavailable?: true;
}

/**
 * Phase 4.4-A (A12) — the neutral identity for an id that resolves to no known person. It is NOT
 * a fixture person, carries no life data (the view model renders it band-less) and is never
 * listed among the people present. Before this, unknown ids resolved to the real fixture "M".
 * Its id is deliberately NOT the requested id: a resolver contract (`personOf(pid).id === pid`)
 * is how callers — the Celestial participation list among them — tell "this person" from
 * "nobody we can show", so an unresolved id is counted, never rendered as a person.
 */
export function unavailablePerson(id: string): Person {
  return { id: `unavailable:${id}`, name: "—", birthDate: "", birthTimeKnown: false, home: "", unavailable: true };
}

export type Kind = "moment" | "meal" | "activity" | "problem" | "health" | "project" | "meeting";
export type Privacy = "public" | "friends" | "onlyme";

export interface Photo {
  src: string;
  w: number;
  h: number;
  alt: string;
}

/** UC-C3 §9/§15 — one gallery item; `videoDuration` marks a video (poster = the frame). */
export interface GalleryItem extends Photo {
  videoDuration?: string;
}

export type Media =
  | { kind: "photos"; items: Photo[] }
  | { kind: "video"; poster: Photo; duration: string; caption?: string }
  /* UC-C3 §9 (owner-directed — supersedes the one-media-kind contract for photos/videos):
     mixed photos + videos in ONE post. All-photo sets still emit "photos" and a single
     video still emits "video", so every accepted fixture and rendering stays byte-identical;
     "gallery" appears only for the new mixed/multi-video sets. */
  | { kind: "gallery"; items: GalleryItem[] }
  | { kind: "link"; url: string; title: string; description: string; image?: Photo; host: string };

export interface KindFields {
  what?: string;
  venue?: string;
  with?: string[];
  measure?: string;
  duration?: string;
  title?: string;
  status?: "open" | "resolved" | "active";
  measurement?: string;
  value?: string;
  name?: string;
  progress?: [number, number];
  since?: string;
  /* ---- Universal Composer (greenfield · 2026-09-29) — additive record fields.
     Legacy keys above remain for the accepted fixtures; new posts write these. ---- */
  /** Meal: breakfast | lunch | dinner | snack | drink | other */
  occasion?: string;
  /** Meal: what was eaten/drunk, the person's own words. */
  items?: string;
  /** Meal: home | restaurant | takeaway | delivery | event | other */
  context?: string;
  /** Activity: run | walk | cycling | gym | hiking | swimming | sport | mindbody | travel | learning | hobby | other */
  activityType?: string;
  distance?: string;
  intensity?: string;
  route?: string;
  goal?: string;
  /** Health (record-only): body area — NEVER rendered in the Social projection. */
  bodyArea?: string;
  /** Health: symptom | injury | appointment | other */
  healthType?: string;
  /** Health (record-only): user-reported severity — never rendered socially. */
  severity?: string;
  /** Health (record-only): the PRIVATE note — enriches the record, never the projection. */
  privateNote?: string;
  /** Problem: category / impact / when-it-started context. */
  category?: string;
  impact?: string;
  relatedProject?: string;
  /** Project / Meeting */
  milestone?: string;
  subject?: string;
  purpose?: string;
  online?: boolean;
  /** Free notes at record depth (More details). Meeting/Problem/Meal/Activity. */
  notes?: string;
  /* ---- Canonical pass (workbook-driven · 2026-09-29) — additive record fields.
     Every key below is RECORD-ONLY unless a projection surface explicitly renders it
     (none do today): stored on the Human Record, never rendered by Moment.tsx. ---- */
  /** Life Moment: the richer account, distinct from the caption (MOMENT-007). */
  story?: string;
  /** Life Moment: life period in the person's own words. */
  chapter?: string;
  /** Meal: the person's own occasion wording when Occasion = other. */
  occasionCustom?: string;
  preparation?: string;
  ingredients?: string;
  experience?: string;
  /** Meal: cost context — sensitive, never auto-published. */
  cost?: string;
  /** Meal Advanced: structured food/drink items (13_MEAL_FIELDS "do not flatten"). */
  foodItems?: { name: string; quantity?: string }[];
  /* Activity — adaptive per-subtype More-details fields (04_ACTIVITY_TYPES). */
  felt?: string;
  steps?: string;
  pace?: string;
  avgSpeed?: string;
  elevation?: string;
  exercises?: string;
  matchKind?: string;
  team?: string;
  opponent?: string;
  water?: string;
  laps?: string;
  stroke?: string;
  style?: string;
  workedOn?: string;
  topic?: string;
  learned?: string;
  transport?: string;
  /* Health — type-adaptive (38_HEALTH_FIELDS); record-only, never rendered. */
  measureValue?: string;
  measureUnit?: string;
  medication?: string;
  /* Problem — IMPACT ≠ URGENCY; ATTEMPT (tried) ≠ NEXT ACTION (intent). */
  urgency?: string;
  attempt?: string;
  nextAction?: string;
  /** Project: aimed completion in the person's words. */
  target?: string;
  /** Project (UC-C3 §52): human-readable current work; a related Problem in words. */
  focus?: string;
  relatedProblem?: string;
}

export interface Note {
  id: string;
  authorId: string;
  text: string;
  at: string;
  parentId?: string;
  responses: number;
  respondedByViewer?: boolean;
  edited?: boolean;
  /** S2 §6.1 — Response Boom: person id → expression id. ONE per person (the invariant lives in
   *  the reducer); the same registry and single-active rule as a Moment's Boom, at conversation
   *  weight. Never a Like: no ranking, no score, participation only. */
  expressions?: Record<string, string>;
  /** S2 §6.4 — a deleted response with replies keeps its place as a quiet tombstone; the
   *  conversation under it survives. Content fields are CLEARED, not hidden. */
  removed?: true;
  /** S2 §6.6 — at most one image: Respond stays lighter than the Moment Composer. */
  photo?: Photo;
  /** S2 §6.5 — the ids of people actually mentioned, resolved when the mention was chosen from
   *  the suggestions (never scanned from free text at render time; the names in `text` are
   *  linkified only when their id is in this list). */
  mentions?: string[];
}

export interface Moment {
  id: string;
  authorId: string;
  /** The moment's own date-time — this leads. */
  at: string;
  /** When it was shared, if different (backdated). Provenance only — never the event time. */
  sharedAt?: string;
  /**
   * Temporal precision of `at`. "day": the person supplied only a date, so the clock part of
   * `at` is a sort anchor (12:00) and is NEVER displayed. Absent = "minute" (a real event time).
   */
  atPrecision?: "day" | "minute";
  /**
   * Canonical §18 — the CLAIMED precision of the event's time, beyond day/minute:
   * "month"/"year": only that much is known — `at` keeps the picked date purely as a sort
   * anchor and display renders the month/year grammar only. "approximate": the date is a
   * best guess ("around …"). "unknown": the person stated the event's date is not known —
   * `at` is the RECORDING time (provenance, never the claim) and the record is UNPLACED:
   * excluded from the Circle, the Day Almanac and every Life density. Absent = the
   * existing day/minute model. Exact-age claims are suppressed for any value here.
   */
  timePrecision?: "month" | "year" | "approximate" | "unknown";
  /**
   * Canonical §17 — how precise the stated `place` is (venue · city/region · country ·
   * approximate). Captured for the live disclosure engine; absent = unstated.
   */
  placePrecision?: "venue" | "cityRegion" | "country" | "approximate";
  /**
   * Universal Composer — what this Social entry IS underneath. Absent (every fixture and every
   * classified post): a real Human Record that belongs to Life/Circle. `"none"`: a SOCIAL POST
   * ONLY — the text-only default and the explicit "Social only" media override; it lives in the
   * stream but never enters the Circle, the Day Almanac or any Life density.
   * LIVE CONTRACT: Social Post → zero or one Human Record; this field is the prototype's stand-in
   * for that link (a real record id in the live system).
   */
  record?: "none";
  /**
   * Universal Composer §28 — HUMAN RECORD PRIVACY, a separate axis from the social audience
   * (`privacy`). A specialist record created from Social defaults to "private": the audience
   * sees only the Social projection; the record's own depth (privateNote, severity, bodyArea…)
   * is never rendered to anyone but the owner. LIVE CONTRACT: enforced server-side.
   */
  recordPrivacy?: "private";
  /**
   * Universal Composer §36 — STOP SHARING removed this post's Social projection. The Human
   * Record remains (Life/Circle/density keep it); only the social stream lets go of it.
   */
  unshared?: true;
  place?: string;
  text?: string;
  kind: Kind;
  fields?: KindFields;
  feeling?: string;
  privacy: Privacy;
  media?: Media;
  responses: number;
  respondedByViewer?: boolean;
  responders: string[];
  notes: Note[];
  edited?: boolean;
  /** R2 — Boom Expressions: viewer id → expression id. ONE per viewer (the invariant lives in
   *  the reducer). Additive prototype field; the live contract is
   *  docs/handover/moment-expression-contract.md. Never present on Health/Problem. */
  expressions?: Record<string, string>;
  /** Stage 23 — Celestial Resonance: viewer id → resonanceId. ONE per viewer (the invariant
   *  lives in the reducer). A SIBLING of `expressions`, never a replacement: the same viewer
   *  may hold one Boom Expression and one Celestial Resonance on the same Moment, and changing
   *  either must leave the other byte-identical. Additive prototype field; the contract is
   *  references/celestial-resonance-bible/22-DATA-CONTRACT.md. */
  resonances?: Record<string, string>;
}

export interface Notification {
  id: string;
  whoId: string;
  text: string;
  at: string;
  unread: boolean;
  momentId?: string;
  /** "request": a friend request — the row itself offers Accept / Decline.
   *  "resonance": a Celestial Resonance on one of your Moments (Stage 23, Signal tier). */
  /**
   * S4 — the meaningful event kinds. `request` and `resonance` render their own rows;
   * `reply` / `mention` / `response-boom` land INSIDE the Moment's conversation on the exact
   * response (`noteId`); `moment-boom` lands on the Moment; `accepted` opens the person.
   * LIVE CONTRACT: event text below is fixture grammar standing in for backend-provided
   * event strings (documented S5/S6 carryover) — the LIVE system supplies kind + refs.
   * Chat messages are deliberately NOT bell events: message-unread has its own truthful
   * badge (accepted complete-My-World rule — never a combined total).
   */
  kind?: "request" | "resonance" | "reply" | "mention" | "response-boom" | "moment-boom" | "accepted";
  /** S4 — the exact response an event is about; landing opens the conversation on it. */
  noteId?: string;
  /** Stage 23 — the resonanceId for a `kind: "resonance"` row. Semantic id only: never copy,
   *  never any Life-derived field. */
  resonanceId?: string;
}

/* ---------- people ---------- */

const P = (p: Person) => p;

export const PEOPLE: Record<string, Person> = {
  // Phase 4.4-A owner fixture add-on — the ITALIAN SOCIAL CIRCLE. Every person here is a FICTIONAL
  // prototype identity: names, cities, birth data, relationships, Moments and responses are
  // invented fixture data and imply nothing about anyone photographed. Six real CC0 portraits
  // (face-framed crops, public/mock/social/cast/, provenance in CREDITS.md + credits.json +
  // docs/fixtures/photo-sources.md); everyone else deliberately has NO photo and exercises the
  // initials fallback. Stable internal keys and ids are unchanged (`maya` / `u-demo-001` is
  // Giulia; `asha` / `p-asha` is Sofia, …) — this is a fixture-content change, not a migration.
  // Every adult is 20–35 in the prototype's Sept 2026; initials are unique across the circle.
  // Story: a circle of friends from around Italy. Chiara lives in Boudha this year; Elena married
  // into Ratmate (Nuwakot); in late Aug–Sept 2026 the others joined them in Nepal — which is why
  // the recent Moments are Nepali places and the older, personal ones are Italian.
  maya: P({
    id: demoUser.id,
    name: demoUser.name,
    avatar: demoUser.avatar,
    birthDate: demoUser.dateOfBirth,
    birthTime: demoUser.birthTime,
    birthTimeKnown: demoUser.birthTimeKnown,
    home: demoUser.location,
    verified: true,
    phone: "+39 351 555 0142",
    email: "giulia.bianchi@example.com",
    cover: "/mock/social/terraces.jpg",
  }),
  asha: P({ id: "p-asha", name: "Sofia Romano", avatar: "/mock/social/cast/sofia-romano.jpg", birthDate: "1994-03-12", birthTimeKnown: false, home: "Firenze, Italy", verified: true, phone: "+39 348 555 0190", email: "sofia.romano@example.com", cover: "/mock/social/phewa-dusk.jpg" }),
  bikash: P({ id: "p-bikash", name: "Luca Rinaldi", avatar: "/mock/social/cast/luca-rinaldi.jpg", birthDate: "1995-07-21", birthTimeKnown: false, home: "Torino, Italy", cover: "/mock/social/nyatapola.jpg" }),
  ramesh: P({ id: "p-ramesh", name: "Marco Bellini", birthDate: "1995-07-21", birthTimeKnown: false, home: "Milano, Italy" }),
  sunita: P({ id: "p-sunita", name: "Elena Ricci", avatar: "/mock/social/cast/elena-ricci.jpg", birthDate: "1992-11-02", birthTimeKnown: false, home: "Napoli, Italy" }),
  prakash: P({ id: "p-prakash", name: "Chiara Conti", avatar: "/mock/social/cast/chiara-conti.jpg", birthDate: "2001-05-30", birthTimeKnown: false, home: "Boudha, Kathmandu" }),
  krishna: P({ id: "p-krishna", name: "Federico Alessandro Castelbarco Visconti", birthDate: "1993-01-15", birthTimeKnown: false, home: "Venezia, Italy", avatar: "/mock/social/cast/federico-castelbarco.jpg" }),
  m: P({ id: "p-m", name: "M", birthDate: "1999-12-31", birthTimeKnown: false, home: "" }),

  // The wider circle — friends, strangers and pending requests around Giulia. No portrait is
  // available locally for these (see docs/fixtures/photo-sources.md "still required"), so each
  // renders the initials fallback until a licensed portrait is supplied.
  marcus: P({ id: "p-marcus", name: "Matteo Gallo", birthDate: "1993-07-19", birthTimeKnown: false, home: "Bologna, Italy" }),
  grace: P({ id: "p-grace", name: "Aurora Ferrari", birthDate: "1996-05-30", birthTimeKnown: false, home: "Roma, Italy" }),
  theo: P({ id: "p-theo", name: "Andrea Costa", birthDate: "1994-03-11", birthTimeKnown: false, home: "Bari, Italy" }),
  hannah: P({ id: "p-hannah", name: "Camilla Greco", birthDate: "1992-09-08", birthTimeKnown: false, home: "Palermo, Italy" }),
  rory: P({ id: "p-rory", name: "Francesca Marino", birthDate: "1997-01-26", birthTimeKnown: false, home: "Genova, Italy" }),
  nadia: P({ id: "p-nadia", name: "Martina Moretti", birthDate: "1998-11-14", birthTimeKnown: false, home: "Verona, Italy" }),
  walt: P({ id: "p-walt", name: "Beatrice Esposito", birthDate: "2000-04-02", birthTimeKnown: false, home: "Napoli, Italy" }),
  sofia: P({ id: "p-sofia", name: "Alice Lombardi", birthDate: "1996-06-21", birthTimeKnown: false, home: "Milano, Italy" }),
};

if (PEOPLE.krishna.name.length !== 40) throw new Error("seed: the 40-character name must be exactly 40 characters");

/**
 * Final Social Connection pass — self-critique correction: Chrome's search People group and the
 * People utility's own "Find someone" field started as two separate name-matching
 * implementations, a real drift risk. One filter, both callers.
 */
/* ─────────────── R3.3 — HARNESS-ONLY Human Pulse scale fixtures (§31–§32) ───────────────
 * Review fixtures for 1 → 1,000+ people expressing on one Moment. Synthetic people exist
 * ONLY behind `sim-` ids the review harness generates (`?pulse=` on the style-lab route,
 * never the product route); every name here is fictional. Deterministic throughout — the
 * same id always resolves to the same person, so who-expressed lists are stable.
 */
const SYNTH_FIRST = ["Giorgia", "Lorenzo", "Sara", "Davide", "Noemi", "Pietro", "Irene", "Simone", "Ludovica", "Tommaso", "Greta", "Riccardo", "Anna", "Gabriele", "Viola", "Edoardo", "Bianca", "Nicolò", "Emma", "Leonardo", "Ginevra", "Filippo", "Arianna", "Samuele"];
const SYNTH_LAST = ["Rossi", "Russo", "Colombo", "Bruno", "Ricciardi", "Galli", "Mancini", "Fontana", "Caruso", "Leone", "Santoro", "Longo", "Gentile", "Martinelli", "Vitale", "Serra"];
const SYNTH_HOME = ["Bologna, Italy", "Milano, Italy", "Roma, Italy", "Torino, Italy", "Firenze, Italy", "Napoli, Italy", "Padova, Italy", "Trieste, Italy"];
const synthCache = new Map<string, Person>();
export function synthPerson(id: string): Person {
  const hit = synthCache.get(id);
  if (hit) return hit;
  const n = Number(id.replace(/\D/g, "")) || 1;
  const person: Person = {
    id,
    name: `${SYNTH_FIRST[n % SYNTH_FIRST.length]} ${SYNTH_LAST[(n * 7 + 3) % SYNTH_LAST.length]}`,
    birthDate: `${1991 + ((n * 13) % 15)}-${String(1 + ((n * 5) % 12)).padStart(2, "0")}-${String(1 + ((n * 11) % 28)).padStart(2, "0")}`,
    birthTimeKnown: false,
    home: SYNTH_HOME[(n * 3) % SYNTH_HOME.length],
  };
  synthCache.set(id, person);
  return person;
}

/** The §31–§32 distributions. Real cast first (so small who-lists show real people), then sims. */
export function simulateExpressions(spec: string): Record<string, string> | null {
  const DIST: Record<string, [string, number][]> = {
    "1": [["care", 1]],
    "2": [["care", 1], ["joy", 1]],
    "5": [["care", 2], ["joy", 1], ["support", 1], ["wow", 1]],
    "20": [["care", 8], ["joy", 5], ["support", 4], ["wow", 3]],
    "100same": [["care", 100]],
    "90-10": [["care", 90], ["joy", 10]],
    "100mixed": [["care", 50], ["joy", 25], ["support", 14], ["wow", 10]],
    "1000mixed": [["care", 400], ["joy", 250], ["support", 150], ["wow", 80], ["laugh", 60], ["celebrate", 30], ["thanks", 20], ["respect", 9]],
    "18mix": [["care", 18], ["joy", 15], ["laugh", 12], ["wow", 10], ["celebrate", 9], ["support", 8], ["proud", 7], ["speechless", 6], ["love", 5], ["thanks", 4], ["touched", 4], ["withyou", 3], ["respect", 3], ["inspired", 2], ["curious", 2], ["agree", 1], ["thinking", 1], ["nostalgia", 1]],
  };
  const dist = DIST[spec];
  if (!dist) return null;
  const real = Object.values(PEOPLE).map((p) => p.id).filter((id) => id !== PEOPLE.maya.id && id !== PEOPLE.m.id);
  const out: Record<string, string> = {};
  let i = 0;
  for (const [expr, n] of dist) {
    for (let k = 0; k < n; k++) {
      out[i < real.length ? real[i] : `sim-${i - real.length + 1}`] = expr;
      i += 1;
    }
  }
  // §10 evidence — the mixed hundred and the mixed thousand include the VIEWER (Giulia), so
  // "viewer's expression first" is demonstrable: hers is Support, never the biggest count.
  if (spec === "100mixed" || spec === "1000mixed") out[PEOPLE.maya.id] = "support";
  return out;
}

/* ────── Celestial Social Universe — HARNESS-ONLY multi-person Resonance fixtures ──────
 * Review fixtures for the shared Resonance Constellation, 0 → 1,000+ people each holding ONE
 * Celestial Resonance on one Moment (`?resonance=` on the style-lab route, never the product
 * route). Same architecture as `simulateExpressions` above: real cast first so small
 * who-lists show real people, then deterministic `sim-` synthetic people. The two systems
 * stay strict siblings — this map is `Moment.resonances`, never `Moment.expressions`.
 * Canonical Primary-8 ids only; distributions are deliberately NOT sorted by count so the
 * canonical-order invariant is actually exercised. */
export function simulateResonances(spec: string): Record<string, string> | null {
  const DIST: Record<string, [string, number][]> = {
    // M1 — one person
    "1": [["venus-love", 1]],
    // M2 — three people, two meanings
    "3": [["venus-love", 2], ["moon-touched", 1]],
    // M3 — eight people, five meanings
    "8": [["venus-love", 2], ["sun-joy", 2], ["comet-wow", 1], ["saturn-support", 2], ["moon-touched", 1]],
    // M4 — sixteen people, all eight meanings
    "16": [["venus-love", 3], ["sun-joy", 2], ["meteor-laugh", 1], ["comet-wow", 2], ["jupiter-celebrate", 2], ["saturn-support", 3], ["moon-touched", 2], ["mercury-curious", 1]],
    // M5 — fifty-six people, all eight (counts deliberately non-monotonic in canonical order)
    "50": [["venus-love", 9], ["sun-joy", 12], ["meteor-laugh", 4], ["comet-wow", 7], ["jupiter-celebrate", 5], ["saturn-support", 11], ["moon-touched", 6], ["mercury-curious", 2]],
    // M6 — many people, one shared meaning
    "200same": [["venus-love", 200]],
    // Count-formatting evidence — 1,204 people, all eight
    "1000": [["venus-love", 300], ["sun-joy", 260], ["meteor-laugh", 90], ["comet-wow", 130], ["jupiter-celebrate", 110], ["saturn-support", 180], ["moon-touched", 94], ["mercury-curious", 40]],
    // No-popularity gate — Moment A (Venus 2 · Moon 2) vs Moment B (Venus 45 · Moon 2): only
    // the neutral number may differ between the two; Venus's dignity may not.
    "2v2m": [["venus-love", 2], ["moon-touched", 2]],
    "45v2m": [["venus-love", 45], ["moon-touched", 2]],
  };
  // Privacy gate — a resonator whose identity the view model cannot resolve (an id outside the
  // cast and outside the sim- namespace). It must be counted as a person and never rendered as
  // somebody else.
  if (spec === "ghost") return { [PEOPLE.asha.id]: "venus-love", "p-unresolvable": "venus-love", [PEOPLE.bikash.id]: "moon-touched" };
  // M7 — the viewer has already selected one (five people, viewer's is Saturn — never the biggest)
  if (spec === "mine") {
    const sim = simulateResonances("3");
    if (!sim) return null;
    sim[PEOPLE.maya.id] = "saturn-support";
    sim["sim-201"] = "sun-joy";
    return sim;
  }
  const dist = DIST[spec];
  if (!dist) return null;
  const real = Object.values(PEOPLE).map((p) => p.id).filter((id) => id !== PEOPLE.maya.id && id !== PEOPLE.m.id);
  const out: Record<string, string> = {};
  let i = 0;
  for (const [rid, n] of dist) {
    for (let k = 0; k < n; k++) {
      out[i < real.length ? real[i] : `sim-${i - real.length + 1}`] = rid;
      i += 1;
    }
  }
  return out;
}

export function matchPeople(term: string, excludeId?: string, limit?: number): Person[] {
  const t = term.trim().toLowerCase();
  if (!t) return [];
  const found = Object.values(PEOPLE).filter((p) => p.id !== excludeId && p.name.toLowerCase().includes(t));
  return limit ? found.slice(0, limit) : found;
}

/* ---------- media library (the account's MY MEDIA — reusable Media Assets, UC-C3 §12) ---------- */

export interface LibraryPhoto extends Photo {
  id: string;
  /** UC-C3 §9 — the asset's own kind. Absent = photo (every pre-UC-C3 asset). */
  mediaKind?: "photo" | "video";
  /** Video assets only — the clip length shown on tiles and in the feed. */
  duration?: string;
  /** File metadata when the file carries it — drives the confirmable readout. */
  takenAt?: string;
  takenPlace?: string;
}
/** The canonical name going forward: MEDIA ASSET ≠ HUMAN RECORD ≠ SOCIAL POST (§13). */
export type MediaAsset = LibraryPhoto;

const ph = (id: string, src: string, w: number, h: number, alt: string, takenAt?: string, takenPlace?: string): LibraryPhoto => ({
  id,
  src: `/mock/social/${src}`,
  w,
  h,
  alt,
  takenAt,
  takenPlace,
});

/** A fixture VIDEO asset: a real poster frame + duration (the prototype's honest video). */
const vid = (id: string, src: string, w: number, h: number, alt: string, duration: string, takenAt?: string, takenPlace?: string): LibraryPhoto => ({
  ...ph(id, src, w, h, alt, takenAt, takenPlace),
  mediaKind: "video",
  duration,
});

export const LIBRARY: LibraryPhoto[] = [
  ph("rain", "rain-street.jpg", 1920, 1254, "A rain-wet hiti courtyard in Kathmandu", "2026-09-10T07:31:00", "Thamel, Kathmandu"),
  ph("thamel", "thamel-lane.jpg", 1920, 1440, "A Thamel lane at night, shop lights on", "2026-09-09T20:14:00", "Thamel, Kathmandu"),
  ph("nyatapola", "nyatapola.jpg", 1920, 1556, "Nyatapola temple, Bhaktapur", "2026-08-03T16:02:00", "Bhaktapur"),
  ph("phewa", "phewa-dusk.jpg", 1920, 1440, "Dusk over Phewa lake", "2026-09-09T18:20:00", "Phewa Tal, Pokhara"),
  ph("boudha", "boudha-night.jpg", 1920, 1280, "Boudhanath stupa at night with lights", "2026-09-08T21:30:00", "Boudhanath, Kathmandu"),
  ph("face", "face-portrait.jpg", 1920, 2879, "An older Nepali woman laughing, gold earrings", "2026-09-07T11:45:00", "Bhaktapur"),
  ph("thali", "meal-thali.jpg", 1920, 1280, "Dal bhat tarkari on a steel plate"),
  ph("durbar", "durbar-square.jpg", 1920, 1280, "Kathmandu Durbar Square, crowd and temples"),
  ph("paraglide", "paragliding.jpg", 1248, 832, "Paragliders landing by Phewa lake", "2026-09-10T06:05:00", "Sarangkot, Pokhara"),
  ph("terraces", "terraces.jpg", 1920, 1440, "Terraced hillsides"),
  ph("wedding", "wedding.jpg", 1920, 1080, "A Nepali wedding, red and gold"),
  ph("document", "document.jpg", 1038, 788, "A 1965 map of Nepal's borders, flat scan"),
  ph("snow", "snowfield.jpg", 1920, 1440, "Trekkers on a snow ridge under a hard blue sky"),
  ph("swayambhu", "swayambhu.jpg", 1920, 1280, "Swayambhunath stupa"),
  ph("garden", "garden.jpg", 1920, 1241, "A garden park in Kathmandu"),
  ph("panorama", "himalaya-panorama.jpg", 1920, 509, "Annapurna range panorama from Mustang"),
  ...Array.from({ length: 10 }, (_, i) =>
    ph(`jatra${i + 1}`, `jatra-${pad(i + 1)}.jpg`, i === 6 || i === 7 ? 1280 : 1920, i === 6 || i === 7 ? 720 : i === 5 || i === 8 ? 1440 : 1280, `Bisket Jatra, Bhaktapur — frame ${i + 1}`, "2026-04-13T15:00:00", "Bhaktapur"),
  ),
  /* UC-C3 §9/§12 — fixture VIDEO assets in My Media (poster frame + duration; the honest
     prototype video, same model the accepted m-video fixture uses). */
  vid("vid-phewa", "video-poster-9x16.jpg", 675, 1200, "Dusk over Phewa lake, portrait video", "1:24", "2026-09-09T18:24:00", "Phewa Tal, Pokhara"),
  vid("vid-kora", "boudha-night.jpg", 1920, 1280, "Evening kora around Boudhanath, video", "0:42", "2026-09-08T21:35:00", "Boudhanath, Kathmandu"),
  vid("vid-terrace", "terraces.jpg", 1920, 1440, "Wind over the rice terraces, video", "2:05"),
];
function pad(n: number) {
  return String(n).padStart(2, "0");
}
const lib = (id: string): Photo => {
  const p = LIBRARY.find((x) => x.id === id)!;
  return { src: p.src, w: p.w, h: p.h, alt: p.alt };
};

/* ---------- places (curated + free) ---------- */

export const PLACES = [
  "Thamel, Kathmandu",
  "Kathmandu, Nepal",
  "Bhaktapur Durbar Square",
  "Patan Durbar Square",
  "पाटन दरबार स्क्वायर",
  "Boudhanath, Kathmandu",
  "स्वयम्भू, काठमाडौँ",
  "Phewa Tal, Pokhara",
  "Sarangkot, Pokhara",
  "Nagarkot",
  "Ratmate, Nuwakot",
  "Lalitpur",
  "Mustang",
  "London, United Kingdom",
];

export const FEELINGS = ["calm", "grateful", "nostalgic", "tired", "proud", "anxious", "hopeful", "homesick", "quiet", "restless"];

/* ---------- 600 words ---------- */

const SIX_HUNDRED = `The window came down in three pieces on a Tuesday, which is not how the carpenter said it would happen. He said it would come down whole. It had held the east side of the house for a hundred and forty years by his count and by the lintel's, which has a date cut into it that nobody in the family can read any more, and when we finally worked the last peg free the middle rail simply let go of the uprights and sat down in the dust like something tired.

I have been drawing this window for a week without seeing it. It is the one above the kitchen, the one our host's grandmother leaned out of to call the children in, the one with the carved peacock that has lost its head. Twelve struts, each a different bird or leaf, and the dark red paint that was never really paint but linseed and brick dust and time. I studied windows like this in Torino, from photographs, and in a photograph a thing like that is simply weather. It is there the way the hill is there.

The carpenter is younger than me. That surprised me and then it stopped surprising me; who else would still be learning this. He measured nothing. He put his thumb in the mortise of the fallen rail and closed his eyes and said the wood was sal, from before the earthquake of 1934, cut in the winter, and that the peacock had been carved by a left-handed man. I asked how he knew the last part and he showed me the direction of the chisel strokes on the feathers, which lean the wrong way, and I stood there holding a piece of somebody else's house and understood that in all my drawings I had never once looked at the feathers.

We laid the pieces on the courtyard stones in the order they came out. Our host's daughter photographed everything, which is the reason I am writing this down at all: she asked me what the window was for, and I started to say for light, and stopped, because that is not what it was for. It was for looking down into the square. It was for being seen from the square. Half the courtship in this neighbourhood happened between windows like this one, our host says, and she says it with a face that made me not ask which half.

The plan is this. The rails that can be saved will be saved. Two struts are gone past saving and will be recut by the same young man in the same sal, if sal can still be had, and if not, in the closest thing, and he will carve two new birds and he will carve them left-handed, he says, because the window has been left-handed for a hundred and forty years and it would be rude to change it now. The peacock will get its head back. We found the head; it was in a biscuit tin under the stairs, which is where everything in this house ends up.

It will take the winter, and I will be home in Torino long before it is done. They have promised to send me the pieces as they go back, and I will put them here, so there is a record somewhere that is not a tin. Today, the first day, nothing is fixed and the east side of the house is a hole with a sheet over it and the whole square can see straight into the kitchen, which the old grandmother, they tell me, would have found hilarious.

A year ago I would not have come. I would have drawn it from a photograph and gone back to work. I do not know what changed except that the window did, and that I was standing in the courtyard when it did, and that a nine-year-old asked me a question I could not answer with the first word that came.`;

/* ---------- moments (feed order = the Moment's own `at`, newest first — see store.orderFeed) ---------- */

const M = (m: Omit<Moment, "responders" | "notes"> & Partial<Pick<Moment, "responders" | "notes">>): Moment => ({
  responders: [],
  notes: [],
  ...m,
});

export const SEED_MOMENTS: Moment[] = [
  M({
    id: "m-rain",
    authorId: "u-demo-001",
    expressions: { "p-asha": "care", "p-bikash": "joy" },
    at: "2026-09-10T07:40:00",
    place: "Thamel, Kathmandu",
    text: "Thamel smelled of rain and juniper before the shops opened. First light on the wet flagstones, and the tea seller already had his kettle going.",
    kind: "moment",
    feeling: "calm",
    privacy: "public",
    media: { kind: "photos", items: [lib("rain")] },
    responses: 3,
    responders: ["p-asha", "p-bikash", "p-prakash"],
    // S2 — one seeded Response Boom so the conversation-weight expression is visible on the
    // first screen without interaction (Luca felt Sofia's response).
    notes: [{ ...n("n-rain-1", "p-asha", "Come to Pokhara — it is still raining here too.", "2026-09-10T08:02:00"), expressions: { "p-bikash": "care" } }],
  }),
  M({
    id: "m-1983",
    authorId: "p-sunita",
    expressions: { "u-demo-001": "respect" },
    // Owner fixture add-on — re-dated from 1983 (the id is kept stable): the author is now 20–35,
    // and a Moment before its author's birth is exactly what the Composer refuses (and D-17,
    // ancestral records, is an open owner decision). The boundary-map scan it used to carry is
    // not an Italian school slip, so it carries no photo rather than a wrong one.
    at: "1998-09-14T12:00:00",
    atPrecision: "day", // a remembered first day: the day is known, the hour is not
    sharedAt: "2026-09-10T09:12:00",
    place: "Vomero, Napoli",
    text: "First day of school. Mamma kept the admission slip in the tin for twenty-eight years. I found it today.",
    kind: "moment",
    privacy: "friends",
    responses: 14,
    responders: ["u-demo-001", "p-bikash", "p-asha", "p-prakash", "p-krishna"],
    notes: [n("n-1983-1", "u-demo-001", "The tin! Zia keeps everything.", "2026-09-10T09:40:00")],
  }),
  M({
    id: "m-meal",
    authorId: "p-bikash",
    at: "2026-09-10T12:15:00",
    place: "Bhaktapur Durbar Square",
    // Owner fixture add-on — MOMENT B: a smaller multi-person Resonance, two meanings.
    resonances: { "p-asha": "mercury-curious", "p-sunita": "comet-wow", "p-hannah": "mercury-curious" },
    text: "Dashain scaffolding is going up on the Nyatapola steps already. The whole square is holding its breath for the festival.",
    kind: "meal",
    fields: { what: "Newari khaja set", venue: "Nyatapola Café", with: ["p-ramesh", "p-prakash", "p-krishna"] },
    privacy: "public",
    media: { kind: "photos", items: [lib("thali")] },
    responses: 5,
    responders: ["u-demo-001", "p-asha", "p-sunita", "p-ramesh", "p-prakash"],
    notes: [
      n("n-meal-1", "p-asha", "Save me a plate.", "2026-09-10T12:40:00"),
      n("n-meal-2", "p-bikash", "Always.", "2026-09-10T12:52:00", "n-meal-1"),
    ],
  }),
  M({
    id: "m-sameage",
    authorId: "p-ramesh",
    at: "2026-09-10T12:20:00",
    place: "Patan Durbar Square",
    text: "Across the valley from Luca, same festival, same scaffolding, same birthday — we checked.",
    // Owner fixture add-on — MOMENT A: five people, four meanings, two people sharing one.
    resonances: { "u-demo-001": "venus-love", "p-asha": "venus-love", "p-prakash": "moon-touched", "p-bikash": "saturn-support", "p-sunita": "sun-joy" },
    kind: "moment",
    privacy: "public",
    responses: 2,
    responders: ["p-bikash", "u-demo-001"],
  }),
  M({
    id: "m-activity",
    authorId: "p-asha",
    at: "2026-09-10T06:05:00",
    place: "Sarangkot, Pokhara",
    text: "Up before the ridge; the thermals came early.",
    // Owner fixture add-on — MOMENT D: exactly one person's Resonance.
    resonances: { "p-bikash": "jupiter-celebrate" },
    kind: "activity",
    fields: { what: "Paragliding", measure: "1,240 m", duration: "28 min" },
    privacy: "public",
    media: { kind: "photos", items: [lib("paraglide")] },
    responses: 12,
    responders: ["u-demo-001", "p-bikash", "p-sunita", "p-prakash", "p-krishna", "p-ramesh", "p-m"],
    notes: [n("n-act-1", "u-demo-001", "That colour on the lake.", "2026-09-10T07:01:00")],
  }),
  M({
    id: "m-health",
    authorId: "u-demo-001",
    at: "2026-09-09T21:10:00",
    place: "Kathmandu, Nepal",
    text: "Evening reading after the Boudha walk.",
    kind: "health",
    fields: { measurement: "Blood pressure", value: "118/76 mmHg" },
    privacy: "onlyme",
    responses: 0,
  }),
  M({
    id: "m-video",
    authorId: "p-asha",
    at: "2026-09-09T18:20:00",
    place: "Phewa Tal, Pokhara",
    text: "Boat back across Phewa as the light went.",
    // Owner fixture add-on — MOMENT C: a broader constellation, eight people across six meanings.
    resonances: { "u-demo-001": "venus-love", "p-bikash": "sun-joy", "p-prakash": "comet-wow", "p-sunita": "moon-touched", "p-krishna": "jupiter-celebrate", "p-ramesh": "sun-joy", "p-marcus": "meteor-laugh", "p-grace": "venus-love" },
    kind: "moment",
    privacy: "public",
    media: { kind: "video", poster: { src: "/mock/social/video-poster-9x16.jpg", w: 675, h: 1200, alt: "Dusk over Phewa lake, portrait video" }, duration: "1:24", caption: "9 SEP 2026 · Phewa Tal" },
    responses: 21,
    responders: ["u-demo-001", "p-bikash", "p-sunita", "p-prakash", "p-krishna", "p-ramesh"],
    notes: [
      { ...n("n-vid-1", "p-prakash", "Machhapuchhre showing off again, @Giulia Bianchi.", "2026-09-09T20:14:00"), mentions: ["u-demo-001"] },
      n("n-vid-2", "u-demo-001", "Every time.", "2026-09-09T20:30:00", "n-vid-1"),
    ],
  }),
  M({
    id: "m-project",
    authorId: "p-prakash",
    at: "2026-09-08T18:00:00",
    place: "Boudhanath, Kathmandu",
    text: "Marigolds in, the bench next. Nonna would have moved the bench twice by now.",
    kind: "project",
    fields: { name: "Nonna's garden", progress: [3, 8], since: "2026-06-12" },
    privacy: "friends",
    media: { kind: "photos", items: [lib("garden")] },
    responses: 8,
    responders: ["u-demo-001", "p-asha", "p-bikash", "p-sunita"],
  }),
  M({
    id: "m-boudha",
    authorId: "p-prakash",
    at: "2026-09-08T21:30:00",
    place: "Boudhanath, Kathmandu",
    text: "Butter lamps at Boudha for Nonna's anniversary. Three kora, then momos at the usual place.",
    kind: "moment",
    feeling: "grateful",
    privacy: "public",
    media: { kind: "photos", items: [lib("boudha")] },
    responses: 8,
    responders: ["u-demo-001", "p-asha", "p-bikash", "p-sunita", "p-ramesh"],
  }),
  M({
    id: "m-meeting",
    authorId: "p-sunita",
    at: "2026-09-08T11:00:00",
    place: "Ratmate, Nuwakot",
    text: "We agreed the roof before the monsoon returns. Luca is drawing it; I am finding the tin.",
    kind: "meeting",
    fields: { with: ["u-demo-001", "p-bikash"], venue: "Ratmate school", duration: "1 h" },
    privacy: "friends",
    responses: 4,
    responders: ["u-demo-001", "p-bikash", "p-asha", "p-prakash"],
    notes: Array.from({ length: 6 }, (_, i) =>
      n(`n-meet-${i}`, ["p-bikash", "u-demo-001", "p-asha", "p-bikash", "p-sunita", "p-prakash"][i], ["Drawing is half done.", "I can bring the ladder.", "Count me in for the painting.", "Tin from the Trishuli side is cheaper.", "Cheaper and thinner.", "I know a man."][i], `2026-09-08T1${2 + i}:0${i}:00`),
    ),
  }),
  M({
    id: "m-problem",
    authorId: "u-demo-001",
    at: "2026-09-07T09:30:00",
    place: "Kathmandu, Nepal",
    text: "Third month without the repair. Keeping the letters here so I stop keeping them in my head.",
    kind: "problem",
    fields: { title: "Landlord dispute", status: "open" },
    privacy: "onlyme",
    responses: 0,
  }),
  M({
    id: "m-face",
    authorId: "p-prakash",
    at: "2026-09-07T11:45:00",
    place: "Bhaktapur",
    text: "The tea-shop aama, laughing at my Newari. Fair.",
    kind: "moment",
    privacy: "friends",
    media: { kind: "photos", items: [lib("face")] },
    responses: 19,
    responders: ["u-demo-001", "p-asha", "p-bikash", "p-sunita", "p-krishna", "p-ramesh"],
  }),
  M({
    id: "m-600",
    authorId: "p-bikash",
    at: "2026-09-06T19:00:00",
    place: "Bhaktapur Durbar Square",
    text: SIX_HUNDRED,
    kind: "project",
    fields: { name: "The east window", progress: [0, 12], since: "2026-09-06" },
    privacy: "public",
    responses: 31,
    responders: ["u-demo-001", "p-asha", "p-sunita", "p-prakash", "p-krishna", "p-ramesh", "p-m"],
    notes: [n("n-600-1", "p-krishna", "Left-handed. I never looked either.", "2026-09-06T21:10:00")],
  }),
  M({
    id: "m-one",
    authorId: "p-prakash",
    at: "2026-09-06T23:58:00",
    place: "Boudhanath, Kathmandu",
    text: "Home.",
    kind: "moment",
    privacy: "public",
    responses: 6,
    responders: ["u-demo-001", "p-asha", "p-bikash"],
  }),
  M({
    id: "m-nepali-1",
    authorId: "u-demo-001",
    at: "2026-09-04T06:10:00",
    place: "स्वयम्भू, काठमाडौँ",
    text: "बिहानै स्वयम्भूको भर्याङ चढ्दा बाँदरहरू भन्दा पहिले पुगियो। भदौ १९ — हावा चिसो, आकाश खुला।",
    kind: "moment",
    feeling: "quiet",
    privacy: "public",
    media: { kind: "photos", items: [lib("swayambhu")] },
    responses: 9,
    responders: ["p-asha", "p-bikash", "p-krishna", "p-prakash"],
    // Phase 4.4-A (A25) — the response notification nt5 already claims.
    notes: [n("n-nepali-1-1", "p-krishna", "बिहानको स्वयम्भू — सबैभन्दा शान्त समय।", "2026-09-09T07:15:00")],
  }),
  M({
    id: "m-nepali-2",
    authorId: "p-krishna",
    at: "2026-09-05T17:30:00",
    place: "पाटन दरबार स्क्वायर",
    // Devanagari script coverage is kept on purpose (social-devanagari-crops, i18n). Federico is
    // learning Nepali for the trip: "Evening of Bhadau 20. In the shade of the Krishna temple, I
    // listened to old stories of Patan."
    text: "भदौ २० गते साँझ। कृष्ण मन्दिरको छहारीमा बसेर पाटनका पुराना कथा सुनें।",
    kind: "moment",
    privacy: "friends",
    media: { kind: "photos", items: [lib("durbar")] },
    responses: 7,
    responders: ["u-demo-001", "p-sunita", "p-bikash"],
  }),
  M({
    id: "m-noplace",
    authorId: "p-m",
    at: "2026-09-03T22:00:00",
    text: "Somewhere between two buses.",
    kind: "moment",
    privacy: "public",
    responses: 1,
    responders: ["p-prakash"],
  }),
  M({
    id: "m-tenphotos",
    authorId: "p-sunita",
    at: "2026-04-13T15:00:00",
    sharedAt: "2026-09-02T20:00:00",
    place: "Bhaktapur",
    text: "Bisket Jatra, finally sorted from three phones. Ten that survived.",
    kind: "moment",
    privacy: "public",
    media: { kind: "photos", items: Array.from({ length: 10 }, (_, i) => lib(`jatra${i + 1}`)) },
    responses: 27,
    responders: ["u-demo-001", "p-asha", "p-bikash", "p-prakash", "p-krishna", "p-ramesh", "p-m"],
  }),
  M({
    id: "m-forty",
    authorId: "p-asha",
    at: "2026-09-01T16:40:00",
    place: "Kathmandu Durbar Square",
    text: "Forty of us to welcome Elena back to Kathmandu. She refused to make a speech.",
    kind: "moment",
    feeling: "proud",
    privacy: "public",
    media: { kind: "photos", items: [lib("durbar")] },
    responses: 38,
    responders: ["u-demo-001", "p-bikash", "p-sunita", "p-prakash", "p-krishna", "p-ramesh", "p-m"],
    notes: fortyNotes(),
  }),
  M({
    id: "m-link",
    authorId: "p-prakash",
    at: "2026-09-02T09:00:00",
    place: "Boudhanath, Kathmandu",
    text: "The recording from the kora last winter finally went up.",
    kind: "moment",
    privacy: "public",
    media: { kind: "link", url: "https://example.org/watch?v=kora-2025", title: "Boudha morning kora — field recording (12 min)", description: "Bells, prayer wheels and the first buses on the ring road. Recorded 14 December 2025.", host: "example.org", image: lib("boudha") },
    responses: 4,
    responders: ["u-demo-001", "p-asha"],
  }),
  M({
    id: "m-panorama",
    authorId: "u-demo-001",
    expressions: { "p-krishna": "wow", "p-prakash": "celebrate", "p-asha": "joy" },
    at: "2026-08-30T08:15:00",
    place: "Mustang",
    text: "The whole range in one breath. Nothing I own is this wide.",
    // Owner fixture add-on — Giulia's own Moment, seen by others: six people, five meanings.
    resonances: { "p-asha": "comet-wow", "p-bikash": "comet-wow", "p-sunita": "venus-love", "p-prakash": "mercury-curious", "p-krishna": "saturn-support", "p-hannah": "sun-joy" },
    kind: "moment",
    privacy: "public",
    media: { kind: "photos", items: [lib("panorama")] },
    responses: 16,
    responders: ["p-asha", "p-bikash", "p-sunita", "p-prakash", "p-krishna"],
    // Phase 4.4-A (A25) — the response notification nt3 already claims.
    notes: [n("n-panorama-1", "p-bikash", "Which pass was this from? I want that exact view.", "2026-09-10T10:30:00")],
  }),
  M({
    id: "m-snow",
    authorId: "u-demo-001",
    at: "2026-08-28T10:30:00",
    place: "Mustang",
    text: "Day four. The sky was a colour I don't have a word for in either language.",
    kind: "activity",
    fields: { what: "Trek", measure: "14.2 km", duration: "6 h 40 m" },
    privacy: "public",
    media: { kind: "photos", items: [lib("snow")] },
    responses: 22,
    responders: ["p-asha", "p-bikash", "p-sunita", "p-prakash", "p-krishna", "p-ramesh"],
    // Phase 4.4-A (A25) — the response notification nt8 already claims.
    notes: [n("n-snow-1", "p-m", "Fourteen kilometres in that cold. Rest well.", "2026-09-07T22:40:00")],
  }),
  M({
    id: "m-wedding",
    authorId: "p-sunita",
    at: "2022-10-17T12:00:00",
    atPrecision: "day", // the prints carry the date, not the hour
    sharedAt: "2026-08-27T19:00:00",
    place: "Ratmate, Nuwakot",
    text: "Our wedding day in Ratmate. Four years on, I finally scanned the prints Mamma kept in the tin.",
    kind: "moment",
    feeling: "nostalgic",
    privacy: "friends",
    media: { kind: "photos", items: [lib("wedding")] },
    responses: 33,
    responders: ["u-demo-001", "p-asha", "p-bikash", "p-prakash", "p-krishna", "p-ramesh"],
  }),
];

function n(id: string, authorId: string, text: string, at: string, parentId?: string): Note {
  return { id, authorId, text, at, parentId, responses: 0 };
}

/** `YYYY-MM-DDTHH:MM:SS` in local time — the fixtures' time grammar (store.localISO, without the
 *  import cycle). A function declaration on purpose: SEED_MOMENTS calls fortyNotes() while this
 *  module is still initialising, so nothing it uses may be a not-yet-initialised `const`. */
function localWallClock(d: Date): string {
  const p = (v: number) => String(v).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function fortyNotes(): Note[] {
  const authors = ["p-bikash", "p-sunita", "p-prakash", "p-krishna", "p-ramesh", "p-m", "u-demo-001", "p-asha"];
  const lines = [
    "Best evening in months.",
    "Who took the one of the momos?",
    "The band was our guide's nephew, apparently.",
    "I left my scarf at the café — anyone?",
    "Elena, you look like you never left.",
    "I never really did. Thank you.",
    "The scarf is with me.",
    "Next year at Patan?",
    "Only if the momos come too.",
    "Marco promised a speech and delivered a song.",
    "It was a speech with notes.",
    "Send the group photo when you have it.",
    "Uploading tomorrow, the phone died.",
    "I have three from the steps.",
    "Mine are all of the sky.",
    "That's how we know you were happy.",
    "Happy and looking up.",
    "The tea seller remembered all of us.",
    "He remembers the ones who don't pay.",
    "Speaking of which.",
    "Paid. Twice.",
    "Welcome back, Elena.",
    "फेरि स्वागत छ, एलेना।",
    "What did she say?",
    "Welcome back.",
    "Same wish, two scripts.",
    "Bring your mamma next time.",
    "She'll bring the tin.",
    "The tin comes to everything now.",
    "Home safe, all of you?",
    "Home. Bus took two hours.",
    "Walked. Faster.",
    "Show-off.",
    "Photos in the morning, promise.",
    "Morning is here.",
    "Photos are not.",
    "Patience is a moment too.",
    "That belongs on a wall.",
    "It is on one now.",
    "Goodnight, all forty of you.",
  ];
  const notes: Note[] = [];
  let t = new Date("2026-09-01T17:00:00").getTime();
  for (let i = 0; i < 40; i++) {
    t += (3 + (i % 7)) * 60_000;
    const id = `n-forty-${i}`;
    // every third note is a reply to the previous top-level note
    const parent = i > 0 && i % 3 === 2 ? notes.filter((x) => !x.parentId).slice(-1)[0]?.id : undefined;
    // Phase 4.4-A (A15) — local wall-clock time, like every other fixture. `toISOString()` wrote
    // UTC as if it were local, so responses read as written before the Moment itself (11:18 under 16:40).
    // S4 — Elena's thanks on Giulia's own welcome (n-forty-22), the response-boom event's truth.
    const expressions = i === 22 ? { "p-sunita": "thanks" as const } : undefined;
    notes.push({ id, authorId: authors[i % authors.length], text: lines[i], at: localWallClock(new Date(t)), parentId: parent, responses: i % 5 === 0 ? 2 : 0, expressions });
  }
  return notes;
}

/* ---------- notifications ---------- */

export const SEED_NOTIFICATIONS: Notification[] = [
  // The live system has friends; a request arrives as a notification and is
  // answered where it appears (complete-My-World pass, recorded exception).
  // S1: the single incoming request is Francesca (p-rory) — Chiara joined the connected circle
  // when My World composition became owner + accepted connections only.
  { id: "n-request", whoId: "p-rory", text: "asked to be your friend", at: "2026-09-11T08:05:00", unread: true, kind: "request" },
  { id: "nt1", whoId: "p-asha", text: "responded to your Thamel moment", at: "2026-09-10T08:02:00", unread: true, momentId: "m-rain", noteId: "n-rain-1" },
  { id: "nt2", whoId: "p-sunita", text: "shared a moment", at: "2026-09-10T09:12:00", unread: true, momentId: "m-1983" },
  { id: "nt3", whoId: "p-bikash", text: "responded to your Mustang panorama", at: "2026-09-10T10:30:00", unread: true, momentId: "m-panorama", noteId: "n-panorama-1" },
  { id: "nt4", whoId: "p-prakash", text: "mentioned you in a response", at: "2026-09-09T20:14:00", unread: false, momentId: "m-video", noteId: "n-vid-1", kind: "mention" },
  { id: "nt5", whoId: "p-krishna", text: "responded to your स्वयम्भू moment", at: "2026-09-09T07:15:00", unread: false, momentId: "m-nepali-1", noteId: "n-nepali-1-1" },
  { id: "nt6", whoId: "p-ramesh", text: "shared a moment", at: "2026-09-08T12:25:00", unread: false, momentId: "m-sameage" },
  { id: "nt7", whoId: "p-sunita", text: "added you to a meeting at Ratmate school", at: "2026-09-08T11:05:00", unread: false, momentId: "m-meeting" },
  { id: "nt8", whoId: "p-m", text: "responded to your snow trek", at: "2026-09-07T22:40:00", unread: false, momentId: "m-snow", noteId: "n-snow-1" },
  // S4 — the remaining meaningful event kinds, each truthful against a real fixture:
  // Sofia's n-forty-23 IS a reply to Giulia's n-forty-22; Elena's thanks IS on n-forty-22
  // (seeded below in fortyNotes); Luca's joy IS on m-rain (the R2 Moment-Boom seed);
  // Matteo IS a friend today. All read — no accepted unread-count contract changes.
  { id: "nt-reply", whoId: "p-asha", text: "replied to your response", at: "2026-09-06T21:40:00", unread: false, momentId: "m-forty", noteId: "n-forty-23", kind: "reply" },
  { id: "nt-response-boom", whoId: "p-sunita", text: "felt thanks about your response", at: "2026-09-06T21:20:00", unread: false, momentId: "m-forty", noteId: "n-forty-22", kind: "response-boom" },
  { id: "nt-moment-boom", whoId: "p-bikash", text: "felt joy about your Thamel moment", at: "2026-09-06T20:10:00", unread: false, momentId: "m-rain", kind: "moment-boom" },
  { id: "nt-accepted", whoId: "p-marcus", text: "accepted your friend request", at: "2026-09-05T18:30:00", unread: false, kind: "accepted" },
];

export const RECENT_SEARCHES = ["Boudha", "Elena Ricci", "Mustang", "भदौ"];
