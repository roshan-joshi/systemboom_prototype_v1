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
}

export type Kind = "moment" | "meal" | "activity" | "problem" | "health" | "project" | "meeting";
export type Privacy = "public" | "friends" | "onlyme";

export interface Photo {
  src: string;
  w: number;
  h: number;
  alt: string;
}

export type Media =
  | { kind: "photos"; items: Photo[] }
  | { kind: "video"; poster: Photo; duration: string; caption?: string }
  | { kind: "link"; url: string; title: string; description: string; image?: Photo; host: string };

export interface KindFields {
  what?: string;
  venue?: string;
  with?: string[];
  measure?: string;
  duration?: string;
  title?: string;
  status?: "open" | "resolved";
  measurement?: string;
  value?: string;
  name?: string;
  progress?: [number, number];
  since?: string;
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
  kind?: "request" | "resonance";
  /** Stage 23 — the resonanceId for a `kind: "resonance"` row. Semantic id only: never copy,
   *  never any Life-derived field. */
  resonanceId?: string;
}

/* ---------- people ---------- */

const P = (p: Person) => p;

export const PEOPLE: Record<string, Person> = {
  maya: P({
    id: demoUser.id,
    name: demoUser.name,
    avatar: demoUser.avatar,
    birthDate: demoUser.dateOfBirth,
    birthTime: demoUser.birthTime,
    birthTimeKnown: demoUser.birthTimeKnown,
    home: "Kathmandu, Nepal",
    verified: true,
    phone: "+977 9841 203 118",
    email: "maya.rai@example.com",
    cover: "/mock/social/terraces.jpg",
  }),
  asha: P({ id: "p-asha", name: "Asha Gurung", birthDate: "1994-03-12", birthTimeKnown: false, home: "Pokhara, Nepal", verified: true, phone: "+977 9806 552 190", email: "asha.gurung@example.com", cover: "/mock/social/phewa-dusk.jpg" }),
  bikash: P({ id: "p-bikash", name: "Bikash Shrestha", birthDate: "1988-07-21", birthTimeKnown: false, home: "Bhaktapur, Nepal", cover: "/mock/social/nyatapola.jpg" }),
  ramesh: P({ id: "p-ramesh", name: "Ramesh Karki", birthDate: "1988-07-21", birthTimeKnown: false, home: "Lalitpur, Nepal" }),
  sunita: P({ id: "p-sunita", name: "Sunita Tamang", birthDate: "1979-11-02", birthTimeKnown: false, home: "Nuwakot, Nepal" }),
  prakash: P({ id: "p-prakash", name: "Prakash Lama", birthDate: "2001-05-30", birthTimeKnown: false, home: "Boudha, Kathmandu" }),
  krishna: P({ id: "p-krishna", name: "Krishna Bahadur Gurung Tamang Magar Rana", birthDate: "1966-01-15", birthTimeKnown: false, home: "Patan, Lalitpur", avatar: "/mock/social/face-portrait-man.jpg" }),
  m: P({ id: "p-m", name: "M", birthDate: "1999-12-31", birthTimeKnown: false, home: "" }),

  // Social 2030 Final — the wider human network. Fictional prototype personas set in US/UK
  // contexts, so People/Search/relationships read as one believable global network rather than a
  // single-locale test set. Every photo is a real CC0 portrait of an adult (public/mock/social/
  // CREDITS.md + docs/fixtures/photo-sources.md); the person's NAME, CITY, birth data,
  // relationships and any Moments are fictional fixture data and imply nothing about the
  // photographed individual. Real cover/World-Wall imagery is added where a persona's own World
  // becomes navigable; until then these read through People/Search/Person surfaces.
  marcus: P({ id: "p-marcus", name: "Marcus Bell", birthDate: "1980-07-19", birthTimeKnown: false, home: "New York, NY", avatar: "/mock/social/cast-marcus.jpg" }),
  grace: P({ id: "p-grace", name: "Grace Okafor", birthDate: "1990-05-30", birthTimeKnown: false, home: "London, UK", avatar: "/mock/social/cast-grace.jpg" }),
  theo: P({ id: "p-theo", name: "Theo Adeyemi", birthDate: "1994-03-11", birthTimeKnown: false, home: "Bristol, UK", avatar: "/mock/social/cast-theo.jpg" }),
  hannah: P({ id: "p-hannah", name: "Hannah Reyes", birthDate: "1992-09-08", birthTimeKnown: false, home: "Boston, MA", avatar: "/mock/social/cast-hannah.jpg" }),
  rory: P({ id: "p-rory", name: "Rory MacLeod", birthDate: "1987-01-26", birthTimeKnown: false, home: "Edinburgh, UK", avatar: "/mock/social/cast-rory.jpg" }),
  nadia: P({ id: "p-nadia", name: "Nadia Haddad", birthDate: "1989-11-14", birthTimeKnown: false, home: "Manchester, UK", avatar: "/mock/social/cast-nadia.jpg" }),
  walt: P({ id: "p-walt", name: "Walt Brennan", birthDate: "1955-04-02", birthTimeKnown: false, home: "Austin, TX", avatar: "/mock/social/cast-walt.jpg" }),
  sofia: P({ id: "p-sofia", name: "Sofia Marchetti", birthDate: "1996-06-21", birthTimeKnown: false, home: "Brooklyn, NY", avatar: "/mock/social/cast-sofia.jpg" }),
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
const SYNTH_FIRST = ["Anil", "Sita", "Rohan", "Mina", "Kiran", "Laxmi", "Dipesh", "Puja", "Suman", "Rita", "Hari", "Gita", "Nabin", "Sarita", "Emma", "Liam", "Noah", "Ava", "Oliver", "Amelia", "Lucas", "Isla", "Ethan", "Freya"];
const SYNTH_LAST = ["Shrestha", "Gurung", "Tamang", "Rai", "Thapa", "Magar", "Karki", "Adhikari", "Baker", "Hughes", "Turner", "Collins", "Ward", "Foster", "Murphy", "Reid"];
const SYNTH_HOME = ["Kathmandu, Nepal", "Pokhara, Nepal", "Lalitpur, Nepal", "London, UK", "Bristol, UK", "Austin, USA", "Boston, USA", "Sydney, Australia"];
const synthCache = new Map<string, Person>();
export function synthPerson(id: string): Person {
  const hit = synthCache.get(id);
  if (hit) return hit;
  const n = Number(id.replace(/\D/g, "")) || 1;
  const person: Person = {
    id,
    name: `${SYNTH_FIRST[n % SYNTH_FIRST.length]} ${SYNTH_LAST[(n * 7 + 3) % SYNTH_LAST.length]}`,
    birthDate: `${1958 + ((n * 13) % 48)}-${String(1 + ((n * 5) % 12)).padStart(2, "0")}-${String(1 + ((n * 11) % 28)).padStart(2, "0")}`,
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
  // §10 evidence — the mixed hundred and the mixed thousand include the VIEWER (Maya), so
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

/* ---------- photo library (what the composer's picker offers) ---------- */

export interface LibraryPhoto extends Photo {
  id: string;
  /** File metadata when the file carries it — drives the confirmable readout. */
  takenAt?: string;
  takenPlace?: string;
}

const ph = (id: string, src: string, w: number, h: number, alt: string, takenAt?: string, takenPlace?: string): LibraryPhoto => ({
  id,
  src: `/mock/social/${src}`,
  w,
  h,
  alt,
  takenAt,
  takenPlace,
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

I have been looking at this window my whole life without seeing it. It is the one above the kitchen, the one my grandmother leaned out of to call us in, the one with the carved peacock that has lost its head. Twelve struts, each a different bird or leaf, and the dark red paint that was never really paint but linseed and brick dust and time. When you are a child a thing like that is simply weather. It is there the way the hill is there.

The carpenter is younger than me. That surprised me and then it stopped surprising me; who else would still be learning this. He measured nothing. He put his thumb in the mortise of the fallen rail and closed his eyes and said the wood was sal, from before the earthquake of 1934, cut in the winter, and that the peacock had been carved by a left-handed man. I asked how he knew the last part and he showed me the direction of the chisel strokes on the feathers, which lean the wrong way, and I stood there holding a piece of my own house and understood that I had never once looked at the feathers.

We laid the pieces on the courtyard stones in the order they came out. My daughter photographed everything, which is the reason I am writing this down at all: she asked what the window was for, and I started to say for light, and stopped, because that is not what it was for. It was for looking down into the square. It was for being seen from the square. Half the courtship in this neighbourhood happened between windows like this one, my grandmother said, and she said it with a face that made me not ask which half.

The plan is this. The rails that can be saved will be saved. Two struts are gone past saving and will be recut by the same young man in the same sal, if sal can still be had, and if not, in the closest thing, and he will carve two new birds and he will carve them left-handed, he says, because the window has been left-handed for a hundred and forty years and it would be rude to change it now. The peacock will get its head back. I have found the head; it was in the tin with the wedding prints, which is where everything in this family ends up.

It will take the winter. I will put the pieces here as they go back, so there is a record somewhere that is not a tin. Today, the first day, nothing is fixed and the east side of the house is a hole with a sheet over it and the whole square can see straight into my kitchen, which my grandmother would have found hilarious.

Three hundred and something days ago I would not have started this. I would have paid someone and gone to work. I do not know what changed except that the window did, and that I was standing in the courtyard when it did, and that my daughter asked me a question I could not answer with the first word that came.`;

/* ---------- moments (feed order = sharedAt ?? at, newest first) ---------- */

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
    notes: [n("n-rain-1", "p-asha", "Come to Pokhara — it is still raining here too.", "2026-09-10T08:02:00")],
  }),
  M({
    id: "m-1983",
    authorId: "p-sunita",
    expressions: { "u-demo-001": "respect" },
    at: "1983-02-06T12:00:00",
    atPrecision: "day", // a scanned print: the day is known, the hour is not
    sharedAt: "2026-09-10T09:12:00",
    place: "Ratmate, Nuwakot",
    text: "First day of school. Aama kept the admission slip in the tin for forty-three years. I scanned it today.",
    kind: "moment",
    privacy: "friends",
    media: { kind: "photos", items: [lib("document")] },
    responses: 14,
    responders: ["u-demo-001", "p-bikash", "p-asha", "p-prakash", "p-krishna"],
    notes: [n("n-1983-1", "u-demo-001", "The tin! Aama keeps everything.", "2026-09-10T09:40:00")],
  }),
  M({
    id: "m-meal",
    authorId: "p-bikash",
    at: "2026-09-10T12:15:00",
    place: "Bhaktapur Durbar Square",
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
    text: "Across the valley from Bikash, same festival, same scaffolding, same birthday — we checked.",
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
    kind: "moment",
    privacy: "public",
    media: { kind: "video", poster: { src: "/mock/social/video-poster-9x16.jpg", w: 675, h: 1200, alt: "Dusk over Phewa lake, portrait video" }, duration: "1:24", caption: "9 SEP 2026 · Phewa Tal" },
    responses: 21,
    responders: ["u-demo-001", "p-bikash", "p-sunita", "p-prakash", "p-krishna", "p-ramesh"],
    notes: [
      n("n-vid-1", "p-prakash", "Machhapuchhre showing off again.", "2026-09-09T20:14:00"),
      n("n-vid-2", "u-demo-001", "Every time.", "2026-09-09T20:30:00", "n-vid-1"),
    ],
  }),
  M({
    id: "m-project",
    authorId: "p-prakash",
    at: "2026-09-08T18:00:00",
    place: "Boudhanath, Kathmandu",
    text: "Marigolds in, the bench next. Ama would have moved the bench twice by now.",
    kind: "project",
    fields: { name: "Ama's memorial garden", progress: [3, 8], since: "2026-06-12" },
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
    text: "Butter lamps at Boudha for Ama's anniversary. Three kora, then momos at the usual place.",
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
    text: "We agreed the roof before the monsoon returns. Bikash is drawing it; I am finding the tin.",
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
    text: "Sano Ama, laughing at my Newari. Fair.",
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
  }),
  M({
    id: "m-nepali-2",
    authorId: "p-krishna",
    at: "2026-09-05T17:30:00",
    place: "पाटन दरबार स्क्वायर",
    text: "भदौ २० गते साँझ। कृष्ण मन्दिरको छहारीमा बसेर नातिनीलाई पुराना कथा सुनाएँ।",
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
    text: "Forty of us for Sunita's fortieth-something. She refused to say which.",
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
    expressions: { "p-krishna": "wonder", "p-prakash": "celebrate", "p-asha": "joy" },
    at: "2026-08-30T08:15:00",
    place: "Mustang",
    text: "The whole range in one breath. Nothing I own is this wide.",
    kind: "moment",
    privacy: "public",
    media: { kind: "photos", items: [lib("panorama")] },
    responses: 16,
    responders: ["p-asha", "p-bikash", "p-sunita", "p-prakash", "p-krishna"],
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
  }),
  M({
    id: "m-wedding",
    authorId: "p-sunita",
    at: "2022-10-17T12:00:00",
    atPrecision: "day", // the prints carry the date, not the hour
    sharedAt: "2026-08-27T19:00:00",
    place: "Ratmate, Nuwakot",
    text: "Our wedding day. Four years on, I finally scanned the prints Aama kept in the tin.",
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

function fortyNotes(): Note[] {
  const authors = ["p-bikash", "p-sunita", "p-prakash", "p-krishna", "p-ramesh", "p-m", "u-demo-001", "p-asha"];
  const lines = [
    "Best evening in months.",
    "Who took the one of the momos?",
    "The band was Krishna dai's nephew, apparently.",
    "I left my scarf at the café — anyone?",
    "Sunita, you looked forty exactly.",
    "Fifty-two, and thank you.",
    "The scarf is with me.",
    "Next year at Patan?",
    "Only if the momos come too.",
    "Ramesh promised a speech and delivered a song.",
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
    "Long life, Sunita didi.",
    "जिउँदो रहनुहोस्, दिदी।",
    "What did she say?",
    "Live long.",
    "Same wish, two scripts.",
    "Bring Aama next time.",
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
    notes.push({ id, authorId: authors[i % authors.length], text: lines[i], at: new Date(t).toISOString().slice(0, 19), parentId: parent, responses: i % 5 === 0 ? 2 : 0 });
  }
  return notes;
}

/* ---------- notifications ---------- */

export const SEED_NOTIFICATIONS: Notification[] = [
  // The live system has friends; a request arrives as a notification and is
  // answered where it appears (complete-My-World pass, recorded exception).
  { id: "n-request", whoId: "p-prakash", text: "asked to be your friend", at: "2026-09-11T08:05:00", unread: true, kind: "request" },
  { id: "nt1", whoId: "p-asha", text: "left a note on your Thamel moment", at: "2026-09-10T08:02:00", unread: true, momentId: "m-rain" },
  { id: "nt2", whoId: "p-sunita", text: "shared a moment", at: "2026-09-10T09:12:00", unread: true, momentId: "m-1983" },
  { id: "nt3", whoId: "p-bikash", text: "responded to your Mustang panorama", at: "2026-09-10T10:30:00", unread: true, momentId: "m-panorama" },
  { id: "nt4", whoId: "p-prakash", text: "mentioned you in a note", at: "2026-09-09T20:30:00", unread: false, momentId: "m-video" },
  { id: "nt5", whoId: "p-krishna", text: "responded to your स्वयम्भू moment", at: "2026-09-09T07:15:00", unread: false, momentId: "m-nepali-1" },
  { id: "nt6", whoId: "p-ramesh", text: "shared a moment", at: "2026-09-08T12:25:00", unread: false, momentId: "m-sameage" },
  { id: "nt7", whoId: "p-sunita", text: "added you to a meeting at Ratmate school", at: "2026-09-08T11:05:00", unread: false, momentId: "m-meeting" },
  { id: "nt8", whoId: "p-m", text: "responded to your snow trek", at: "2026-09-07T22:40:00", unread: false, momentId: "m-snow" },
];

export const RECENT_SEARCHES = ["Boudha", "Sunita Tamang", "Mustang", "भदौ"];
