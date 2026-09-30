# CANONICAL COMPOSER FIELD CONTRACT
**Universal Social Post Composer · workbook-driven · 2026-09-29**

SOURCE OF TRUTH: `references/8 Task details.xlsx` (50 sheets, ALL read — foundation
00/01/08/09/10/11, Activity 02–06, monetization 07, Meal 12–16, Problem 17–21, Project
22–27, Meeting 28–33, Health 34–42, Life Moment 43–48; `Sheet1` is empty). Authority
order applied: 11_UNIVERSAL_RECORD_RULES → APPROVED per-domain decision logs + field
contracts + UX contracts → domain overviews → 00_README/01_PRODUCT_MAP → prior FINAL
OWNER RULES → the prototype code (context only, never requirement truth).

SCOPE RULE (from 11 + the master prompt §19–§21): the Social composer carries
**QUICK → MORE DETAILS → ADVANCED DETAILS** capture on ONE draft, plus **ENRICH LATER**
after POST. Full specialist WORKSPACES (Complete Meeting tools, the Problem thread,
Complete Project tools, the 3D Health body, the detailed Memory form) stay OUT of the
composer and are reached from the record afterwards. User-facing depth labels are
**"More details"** and, ONLY for Health, **"Private health details"** (§48/§49 — Health's
depth is named for what it is, never a generic "Advanced"); never LEVEL 1/2/3, never
completion percentages. (Sheet 46 informally calls the Social expansion "A little more";
the universal label rule outranks that wording — recorded here, applied as "More details".)

### UC-C3 presentation classification (added 2026-09-29, owner UX-completion pass)

The DATA-completeness rule above does not mandate a UI shape — §2 of the UC-C3 brief:
"decide the correct PRESENTATION for every canonical field... DATA COMPLETENESS does not
mean UI CLUTTER." Every field row's TIER (Q/M/A/S/P) is unchanged; UC-C3 adds a
**PRESENTATION** dimension describing HOW a Quick/More field reaches the screen. No
CURRENT field lost capture capability in this pass — every one of them is still reachable,
several through a friendlier control than the field-matrix this repository shipped through
2026-09-29 evening.

- **AUTO** — never asked; resolved from context (record `status:"open"`/`"active"`,
  `record:"none"` for words-alone, the media-implies-Life-Moment default).
- **INLINE** — visible the instant its tier is open (Meal Occasion, Activity's common four,
  Problem's own words, Meeting's Subject + When).
- **CONTEXTUAL** — reveals automatically once a prior choice makes it relevant, and ONLY
  then (Meal's Home-cooked → Preparation + Ingredients; Occasion=Other → the custom-wording
  field). Never a persistent empty box waiting to be noticed.
- **ADDABLE** — a "+ Field" chip in the More-details group; tapping it reveals the real
  input, focused, in place. This is the UC-C3 answer to §40/§51 ("no field matrix"): every
  More-details field for Life Moment/Meal/Activity/Problem/Project/Meeting that is not
  CONTEXTUAL is ADDABLE — visible only once added, or once it already carries a value
  (editing/Keep-draft/Smart-Assist prefill all count as "added").
- **PICKER** — a focused, separate SHEET rather than inline controls: the Record chooser
  itself (seven records + Just post, §6/§72), the Activity type list beyond the common four
  (§39), the Health type list beyond the common six (§47), the People picker (§22/§73), the
  Place picker (§24/§74), My Media (§12), and the Media organizer (§16). A picker always
  collapses back to a compact summary in the main composer (the record pill, "Run · Change",
  "3 people", "Bologna", "6 media · Edit") — the picker's own UI never persists once closed.
- **DELIBERATE EDITOR** — a named, opened-on-purpose sub-editor for genuinely structured
  data, kept OUT of the linear field flow entirely: Meal's Foods & drinks item list
  (13_MEAL_FIELDS — "do not flatten all into one string", reached via its own ADDABLE
  chip, §46).

No field's STATUS below changes because of this addendum — IMPLEMENTED stays IMPLEMENTED.
Read PRESENTATION as answering "how does the person reach it," never "is it captured."

## Legend

- **TIER** — Q quick · M more details · A advanced details · S full-specialist-only
  (out of composer) · P post-POST (enrich-later surface) · ARCH architecture rule.
- **CUR/FUT** — CUR: canonical for the current product (MVP). FUT: Version-1/future
  per the workbook roadmaps. CUR-LIVE: canonical now but only realizable against live
  infrastructure this repository does not contain (devices, uploads, reference DBs).
- **REQ** — R required · O optional · AD adaptive (appears/required only in context).
  Per 11: minimum-valid = human meaning + known temporal context; nothing else required.
- **SOURCE** — U user · AI-S AI suggested · EXIF/META media metadata · CTX context
  (origin surface) · DEV device · CONN connected source · LBL/MENU/RCP/RCPT label/menu/
  recipe/receipt · REF reference database · DRV derived · SYS system. AI-ESTIMATE is
  never presented as measured (§70–§72); nothing in this prototype estimates.
- **SOCIAL** — what the Social projection may carry (§29 allowlist enforced in
  `composer/submit.ts`); "rec-only" = stored on the Human Record, never rendered by
  `Moment.tsx` (verified by suite).
- **PERSIST** — where it lives in this prototype: `Moment.<prop>`, `fields.<key>`
  (KindFields on the Moment = the record), `draft` (UDraft only, gone on POST), `live`
  (live-product storage; not stored here).
- **STATUS** — IMPLEMENTED · PARTIAL · MISSING · OUT-OF-COMPOSER · FUTURE-SEAM.
  Rows marked **[A✚]** were MISSING/PARTIAL at audit (post-UC-G greenfield) and are
  built in THIS canonical pass; their final status is stated after the arrow.
  FUTURE-SEAM = honestly not buildable in this repo (no devices/uploads/reference
  data/backend); the seam is documented, never faked (§99).

Every row carries: tier, CUR/FUT, REQ, visibility condition, source/provenance, social
eligibility, privacy, media role, Circle/time behavior, relationships, AI behavior,
persistence, status. Domain and subtype come from the section context.

---

## 1 · COMMON (one source of truth — §7; domains reference, never duplicate)

| FIELD | TIER | CUR | REQ | VISIBILITY | SOURCE | SOCIAL | PRIVACY | MEDIA | CIRCLE/TIME | REL | AI | PERSIST | STATUS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Text — "What's happening?" (adaptive per-category question) | Q | CUR | AD (min-formula) | always | U | is the post | audience | — | — | — | heuristic reads it | `Moment.text` | IMPLEMENTED |
| Audience (Public/Friends/Only me) | Q | CUR | R (default Public) | always | U | the social axis | separate from record privacy (§77) | — | — | — | never AI-set | `Moment.privacy` | IMPLEMENTED |
| Photos (multiple, ≤10) | Q | CUR | O | media panel | U (mock library = the device-capture stand-in) | selected media eligible | audience | primitive (§11) | EXIF→review | — | media→Life-Moment default (§10) | `Moment.media` | IMPLEMENTED |
| Video (one) | Q | CUR | O | media panel; one-kind rule | U | eligible | audience | primitive | — | — | same default | `Moment.media` | PARTIAL (fixture video; no recording pipeline) |
| Link | Q | CUR | O | media panel | U | eligible | audience | primitive | — | — | same default | `Moment.media` | IMPLEMENTED (prototype preview fixture) |
| Media preview · remove · reorder | Q | CUR | O | with photos | U | — | — | manager (§12) | — | — | — | draft order → media | IMPLEMENTED |
| Cover selection | Q | CUR | O | ≥2 photos | U | presentation only | — | manager (§12) | — | — | AI cover = FUT | lead position of `media.items` | **[A✚]** MISSING → IMPLEMENTED (Make-cover = lead position; the mosaic's lead IS the cover in this media model) |
| Device capture (Take Photo / Record Video / Files) | Q | CUR-LIVE | O | device | DEV | — | — | manager | — | — | — | live | FUTURE-SEAM (no camera/file pipeline; the mock picker is honestly labeled "Choose photos") |
| Upload retry / progress | Q | CUR-LIVE | — | upload failure | SYS | — | — | manager | — | — | — | live | FUTURE-SEAM (no real upload exists) |
| Media asset stable identity, reuse across records (§11) | ARCH | CUR | — | — | SYS | — | — | POST ≠ RECORD ≠ MEDIA | — | many records ↔ one asset | — | `photoIds` reference stable LIBRARY ids | PARTIAL (stable ids + reuse by reference; cross-record sharing UI = FUTURE-SEAM with grouping) |
| Original media metadata never overwritten (§14) | ARCH | CUR | — | — | EXIF | — | — | record interpretation separate | review writes `eventTime`, never the asset | — | — | LIBRARY untouched | IMPLEMENTED |
| People (who was there) | Q | CUR | O | People panel / domain's own field (one input ever) | U | names eligible; relationship privacy applies | — | — | — | `fields.with` person ids | suggestions FUT | `fields.with` | IMPLEMENTED (A12: unmatched names announced, never stored) |
| People ROLES (prepared/hosted/participant/provider…) (§16) | A | CUR-LIVE | O | where useful | U | rel. privacy | — | — | — | role per link | — | live | FUTURE-SEAM (flat people model here; roles need the live people graph) |
| Place (name) | Q | CUR | O | Place panel | U | general place eligible | exact home/GPS sensitive | — | — | — | — | `Moment.place` | IMPLEMENTED |
| Place precision (venue / city–region / country / approximate) (§17) | M | CUR | O | with a place | U | governs live disclosure | precision = privacy tier | — | — | — | — | `Moment.placePrecision` | **[A✚]** MISSING → IMPLEMENTED (captured + stored; server-side disclosure enforcement = live contract) |
| Exact coordinates / GPS | A | FUT | O | device | DEV/EXIF | sensitive, never auto | — | — | — | — | — | live | FUTURE-SEAM (no geo model) |
| Event time — When (§18/§21) | M (Meeting: Q) | CUR | O | More details | U/EXIF/CTX(circle) | date grammar eligible | — | — | postedAt ≠ happenedAt; noon anchor, `sharedAt` provenance | — | EXIF finding reviewed, never auto | `Moment.at/atPrecision/sharedAt` | IMPLEMENTED |
| Time precision — date-only / month / year / approximate / unknown (§18) | M | CUR | O | with When | U | display never fabricates precision | — | — | unknown ⇒ UNPLACED (excluded from Circle/density); month/year/approx: truthful grammar, no exact-age claim | — | — | `Moment.timePrecision` (additive) | **[A✚]** MISSING → IMPLEMENTED |
| Life-period precision | A | FUT | O | — | U | — | — | — | needs chapter/band model | — | — | live | FUTURE-SEAM |
| UNPLACED records surface/tray | ARCH | CUR-LIVE | — | — | SYS | — | — | — | excluded from Circle (built); a dedicated Unplaced tray | — | — | live | PARTIAL (exclusion built; tray = FUTURE-SEAM — unplaced records remain reachable in the stream) |
| createdAt / postedAt / happenedAt / updatedAt (§18) | ARCH | CUR | — | — | SYS | — | — | — | `at`(event) + `sharedAt`(posted) + edited flag | — | — | Moment | PARTIAL (documented mapping; full four-stamp model = live contract, `social-api-contract.md`) |
| Record intent + intentSource (classification) | Q | CUR | R (default social) | Record details | U/media/AI-S | — | — | media→moment default | — | — | one suggestion max (§72) | draft → `kind`/`record` | IMPLEMENTED |
| AI category suggestion (≥0.75 or silence, one max) | Q | CUR | O | passive row | AI-S (labeled PROTOTYPE HEURISTIC) | — | — | — | — | — | accept=classify only; Keep dismisses | draft | IMPLEMENTED (`suggest-record.ts` is the replaceable seam — no real vision/OCR claimed) |
| Metadata review — "From the photo" (§23/§24) | Q | CUR | R before POST when a finding exists | EXIF-dated photo attached | EXIF | — | — | — | Use → eventTime(exif); Ignore → unknown | — | never auto-published | draft → eventTime | IMPLEMENTED |
| Draft keep / restore | — | CUR | O | discard flow | SYS | — | — | — | — | — | — | in-memory `state.udraft` | IMPLEMENTED (durable autosave = live seam) |
| Multi-event grouping — one post → several records (§73) | ARCH | FUT (V1 per 45) | — | multiple media spanning events | AI-S | — | — | grouping ≠ duplication | human meaning outranks timestamps | — | "Suggested events / Keep together / Adjust" | live | FUTURE-SEAM (orchestrator returns 0..1 by canon default; `buildSubmission` is the single seam a grouping engine extends) |
| Reclassification preserving media/time/place/people/social (§74) | P | CUR | — | edit → Record details | U | unchanged | unchanged | preserved | preserved | preserved | — | same Moment id | IMPLEMENTED (suite-proven) |
| Stop sharing vs delete (§80) | P | CUR | — | owner ⋯ menu | U | projection removed; record stays | — | — | record keeps Circle/density | — | — | `Moment.unshared` | IMPLEMENTED |
| Share later (§81) | P | CUR | — | Day Almanac, own unshared record | U | SAME record returns | — | — | — | — | — | `unshared` cleared | IMPLEMENTED |
| Enrich later: Edit details | P | CUR | — | owner ⋯ | U | — | — | — | A2/A3 truth | — | — | same Moment | IMPLEMENTED |
| Enrich later: View details | P | CUR | — | feed card | — | — | — | — | — | — | — | — | IMPLEMENTED (the card is the Social detail) |
| Enrich later: "Open in Meal/Health/…" specialist world | P | CUR-LIVE | — | — | — | — | — | — | — | — | — | live | FUTURE-SEAM (no specialist worlds in this repo) |
| Enrich later: View in Life | P | CUR | — | ⋯ slot | — | — | — | — | — | — | — | — | OUT-OF-COMPOSER (the accepted disabled seam) |
| Locale-aware units — km/miles, canonical value+unit (§85) | M | CUR-LIVE | O | metric fields | U | — | — | — | — | — | — | free text today | FUTURE-SEAM (free text accepts any unit; canonical value+unit storage + conversion = live contract) |
| One orchestrator, idempotent single POST (§96–§97) | ARCH | CUR | — | — | SYS | — | — | — | — | — | — | `buildSubmission` + posting lock | IMPLEMENTED (900 ms cancellable, duplicate-locked, retry keeps draft) |
| Human validation sentences (§98) | ARCH | CUR | — | on refusal | SYS | — | — | — | before-birth/future refused in the Life rule's words | — | — | — | IMPLEMENTED (issue line + focus moves to the problem) |
| Social projection statement when sensitive (§22–§23) | M | CUR | AD | specialist kinds | SYS | states exactly what will be shared | — | — | — | — | — | — | **[A✚]** PARTIAL → IMPLEMENTED (Health: "Shared in this post" vs "Private record details" labeled groups + sharing line) |

## 2 · LIFE MOMENT (sheets 43–48; Social-origin UX = sheet 46, binding)

Default classification for media posts (§10, MOMENT-010); text-only stays Social-only
(MOMENT-009). Social action label POST; My Life/Circle SAVE (MOMENT-013 — the Circle
doorway seeds the same composer with the coordinate inherited, never re-asked).

| FIELD | TIER | CUR | REQ | VISIBILITY | SOURCE | SOCIAL | PRIVACY | MEDIA | CIRCLE/TIME | REL | AI | PERSIST | STATUS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Caption / title ("What's happening?") | Q | CUR | AD | always | U/AI-S | the post text | audience | — | — | — | caption suggestion = live MVP AI | `Moment.text` | IMPLEMENTED (caption = post text at Social origin, per 46) |
| Story (richer account, distinct from caption — MOMENT-007) | M | CUR | O | More details | U/AI-assist(FUT) | rec-only (the detailed form is the enrichment surface) | record depth | — | — | — | never silently rewritten (MOMENT-020) | `fields.story` | **[A✚]** MISSING → IMPLEMENTED (record-only) |
| When + precision | M | CUR | O | More details | U/EXIF | date grammar | — | — | automatic placement when placeable | — | EXIF reviewed | `at`/`timePrecision` | IMPLEMENTED (+ precision built this pass) |
| Feeling | M | CUR | O | More details | U | eligible when set | not diagnostic, never forced | — | — | — | no emotion inference | `Moment.feeling` | IMPLEMENTED |
| Milestone | M | CUR | O | More details | U | eligible when set | — | — | — | Moment ≠ Milestone (attribute, not a 2nd record) | AI "possible milestone" = FUT | `fields.milestone` | IMPLEMENTED |
| Chapter (user-defined life period) | M | CUR | O | More details | U | rec-only | — | — | separate from Circle chronology | — | AI chapter suggestion = FUT | `fields.chapter` | **[A✚]** MISSING → IMPLEMENTED (record-only free text; the chapter OBJECT model = live) |
| Travel mode / detail / service | S | CUR | O | detailed Memory form only (46: "Detailed Life Moment only") | U | — | — | — | — | — | — | live | OUT-OF-COMPOSER |
| Soundtrack | S | CUR | O | detailed form only | U | — | — | — | — | — | — | live | OUT-OF-COMPOSER |
| Favourite | S | CUR | O | detailed form only | U | — | owner's private signal | — | — | — | never an AI life score | live | OUT-OF-COMPOSER |
| Cover (multi-photo) | Q | CUR | O | ≥2 photos | U/SYS | presentation | — | manager | — | — | AI suggestion = FUT | lead item | **[A✚]** built (common row) |
| Audio / voice memory, documents as media | — | FUT | O | — | ORIGINAL MEDIA | — | — | primitive | — | — | transcript = derived | live | FUTURE-SEAM |
| Later reflection / another person's testimony | P | FUT | O | — | U / attributed source | — | — | — | own timestamp | — | never rewrites the original | live | FUTURE-SEAM |
| Record privacy separate from Social publication (MOMENT-015) | ARCH | CUR | — | ⋯ Change privacy | U | — | separate axes | — | — | — | — | `privacy` + ⋯ | IMPLEMENTED (specialists additionally get `recordPrivacy:"private"`) |

## 3 · MEAL (sheets 12–16)

Not a nutrition app first — a human meal record (12). Occasion is culture-neutral.
Canonical context list (13): Home cooked · Restaurant–Café · Takeaway–Delivery ·
Packaged · Work–School · Event–Party · Travel · Other.

| FIELD | TIER | CUR | REQ | VISIBILITY | SOURCE | SOCIAL | PRIVACY | MEDIA | CIRCLE/TIME | REL | AI | PERSIST | STATUS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| What did you have? | Q | CUR | AD (words or media suffice) | Meal selected | U/AI-S/CTX | eligible | — | photo often IS the answer | — | — | — | `fields.items` | IMPLEMENTED |
| Occasion (Breakfast/Lunch/Dinner/Snack/Drink/Other) | Q | CUR | O | Meal selected | U/CTX/AI-S | eligible | — | — | — | — | — | `fields.occasion` | IMPLEMENTED |
| Occasion — custom wording | M | CUR | O | Occasion = Other | U | eligible | cultural meaning preserved, no forced taxonomy | — | — | — | — | `fields.occasionCustom` | **[A✚]** MISSING → IMPLEMENTED |
| Context (canonical 8) | M | CUR | O | More details | U/CTX/AI-S | broad level eligible | — | — | — | — | — | `fields.context` | **[A✚]** PARTIAL → IMPLEMENTED (list aligned to the canonical 8; was 6 with Takeaway/Delivery split) |
| MealFoodItem list (0..N — "do not flatten all into one string") | A | CUR | O | Advanced details | U/AI-S/LBL/MENU/RCP | names ELIGIBLE (live projection may select them); prototype stores them at record depth and projects only the person's own "What did you have?" words | — | — | — | items belong to THIS Meal | AI item suggestion = live | `fields.foodItems[{name,quantity?}]` | **[A✚]** MISSING → IMPLEMENTED (name + optional portion per item; deeper item structure = live) |
| Quantity / portion / unit (per item) | A | CUR | O | per item | U/LBL/RCP | usually private | never invent exact grams | — | — | — | AI-ESTIMATE not built | item `quantity` | **[A✚]** built (free text; canonical units = §85 seam) |
| Preparation method | M | CUR | O | More details | U/RCP/MENU | optional | — | — | — | — | visual inference stays suggestion (live) | `fields.preparation` | **[A✚]** MISSING → IMPLEMENTED (rec-only) |
| Ingredients | M | CUR | O | More details | LBL/RCP/MENU/U | not auto-published | — | — | — | — | possible ≠ confirmed (live) | `fields.ingredients` | **[A✚]** MISSING → IMPLEMENTED (rec-only) |
| Experience / reaction | M | CUR | O | More details | U | user's choice | human memory field | — | — | — | — | `fields.experience` | **[A✚]** MISSING → IMPLEMENTED (rec-only) |
| Cost / currency / receipt context | M | CUR | O | More details | U/RCPT | sensitive, not auto-published | — | — | — | — | receipt OCR = live | `fields.cost` | **[A✚]** MISSING → IMPLEMENTED (rec-only; receipt/split/payment depth = FUTURE-SEAM) |
| Notes / story | M | CUR | O | More details | U | story only when intended | private notes stay private | — | — | — | — | `fields.notes` | IMPLEMENTED (rec-only) |
| Nutrition — energy/macros | A | CUR-LIVE | O | — | LBL/REF/RCP/DRV | never auto-published | source+confidence preserved | — | — | — | AI-ESTIMATE labeled (live) | live | FUTURE-SEAM (no nutrition reference DB here — never faked) |
| Micronutrients | A | FUT | O | — | LBL/REF | private | — | — | — | — | — | live | FUTURE-SEAM |
| Allergen evidence states (confirmed/declared/possible/not-established) | A | CUR-LIVE | O | — | LBL/RCP/MENU/U/AI-OBS | sensitive, never auto-share | never claim allergen-safe from image | — | — | — | evidence-state model | live | FUTURE-SEAM |
| Dietary attributes | A | CUR-LIVE | O | — | LBL/MENU/U | private/selected | no medical suitability inference | — | — | — | — | live | FUTURE-SEAM |
| Recipe relationship (Recipe ≠ Meal, reusable object) | A | CUR-LIVE | O | — | U/IMPORT | independent sharing | — | — | — | one recipe ↔ many Meals | — | live | FUTURE-SEAM (no recipe object model; a text field would fake a relationship) |
| Product / brand / menu item / barcode | A | CUR-LIVE | O | context-adaptive | LBL/MENU/REF | selected basics | — | — | — | — | label extraction = live | live | FUTURE-SEAM |
| Who prepared / shared / hosted (roles) | A | CUR-LIVE | O | — | U | rel. privacy | — | — | — | people roles | — | live | FUTURE-SEAM (common People carries WHO; roles need the live graph) |
| When / Place / People / media | — | — | — | common | — | — | — | media belongs to the Meal — no duplicate Life Moment (§10) | unknown ⇒ Unplaced Meal | — | — | common | IMPLEMENTED (common rows) |

## 4 · ACTIVITY (sheets 02–06; per-type contract = sheet 04)

Subtypes (04): Walk · Run · Cycle · Hike · Workout/Gym · Sport · Swim · Mind & Body ·
Hobby · Learning · Travel · Other. Quick metrics are ADAPTIVE (§15) — never every
metric at once; irrelevant types hide them; metrics are never required to save.

| FIELD | TIER | CUR | REQ | VISIBILITY | SOURCE | SOCIAL | PRIVACY | MEDIA | CIRCLE/TIME | REL | AI | PERSIST | STATUS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Activity type (12) | Q | CUR | O | Activity selected | U/AI-S/CTX | eligible | — | — | — | — | do not ask twice | `fields.activityType` | IMPLEMENTED |
| Distance + Duration | Q | CUR | AD (run/walk/cycle/hike/swim) | per type | U (DEV = live) | summary eligible | — | — | — | — | — | `fields.distance/duration` | IMPLEMENTED |
| Workout type + Duration | Q | CUR | AD (gym) | gym | U | eligible | — | — | — | — | — | `fields.what/duration` | IMPLEMENTED |
| Sport + Duration | Q | CUR | AD (sport) | sport | U | eligible | — | — | — | — | — | `fields.what/duration` | IMPLEMENTED |
| Practice + Duration | Q | CUR | AD (mind & body) | mindbody | U | eligible | — | — | — | — | — | `fields.what/duration` | IMPLEMENTED |
| Purpose (training/commute/fun/recovery…) | M | CUR | O | More details | U/AI-S | user's choice | private by default | — | — | — | — | `fields.purpose` | **[A✚]** MISSING → IMPLEMENTED (rec-only) |
| How it felt (feeling around the activity) | M | CUR | O | More details | U | private unless shared | human context, not fitness data | — | — | — | no diagnosis | `fields.felt` | **[A✚]** MISSING → IMPLEMENTED (rec-only; before/after split = live enrichment) |
| Intensity | M | CUR | O | More details | U | rec-only | — | — | — | — | — | `fields.intensity` | IMPLEMENTED |
| Route (named/description) | M | CUR | O | More details | U | rec-only — exact route/home start-end NEVER auto-published | sensitive | — | — | — | — | `fields.route` | IMPLEMENTED (stored, never rendered socially) |
| Goal / Notes / When | M | CUR | O | More details | U | rec-only | — | — | unknown ⇒ Unplaced | — | — | `fields.goal/notes` | IMPLEMENTED |
| Steps | M | CUR | AD (walk) | walk | U (DEV = live) | not auto-published | — | — | — | — | — | `fields.steps` | **[A✚]** MISSING → IMPLEMENTED (user-typed; device source = seam) |
| Pace | M | CUR | AD (run) | run | U/DRV(live) | selected summary only | — | — | — | — | — | `fields.pace` | **[A✚]** MISSING → IMPLEMENTED |
| Average speed | M | CUR | AD (cycle) | cycling | U | rec-only | — | — | — | — | — | `fields.avgSpeed` | **[A✚]** MISSING → IMPLEMENTED |
| Elevation | M | CUR | AD (cycle/hike; run = advanced) | cycling/hiking/run | U | rec-only | — | — | — | — | — | `fields.elevation` | **[A✚]** MISSING → IMPLEMENTED |
| Exercises (what was trained) | M | CUR | AD (gym) | gym | U | rec-only | — | — | — | — | NL exercise extraction = live | `fields.exercises` | **[A✚]** MISSING → IMPLEMENTED (free text; structured sets/reps/load = FUTURE-SEAM) |
| Match or training | M | CUR | AD (sport) | sport | U | rec-only | — | — | — | — | — | `fields.matchKind` | **[A✚]** MISSING → IMPLEMENTED |
| Team · Opponent | M | CUR | AD (sport) | sport | U | rel. privacy | solo sports never forced | — | — | — | — | `fields.team/opponent` | **[A✚]** MISSING → IMPLEMENTED (rec-only) |
| Pool / open water · Laps · Stroke | M | CUR | AD (swim) | swimming | U | rec-only | — | — | — | — | — | `fields.water/laps/stroke` | **[A✚]** MISSING → IMPLEMENTED |
| Style (yoga/meditation/…) | M | CUR | AD (mind & body) | mindbody | U | rec-only | — | — | — | — | — | `fields.style` | **[A✚]** MISSING → IMPLEMENTED |
| What I worked on | M | CUR | AD (hobby) | hobby | U | rec-only | — | — | — | — | — | `fields.workedOn` | **[A✚]** MISSING → IMPLEMENTED |
| Topic/course · What I learned | M | CUR | AD (learning) | learning | U | rec-only | — | — | — | related Project = live link | — | `fields.topic/learned` | **[A✚]** MISSING → IMPLEMENTED |
| Transport (travel) | M | CUR | AD (travel) | travel | U | rec-only | — | — | — | places = common Place | — | `fields.transport` | **[A✚]** MISSING → IMPLEMENTED (from/to lives in the words; primary places = common) |
| HR · calories · cadence · splits · power · SWOLF · elevation profile · detailed GPS series | A | CUR-LIVE | O | device/connected | DEV/CONN/DRV | series private by default | health-sensitive metrics | — | — | — | estimates labeled, never "measured" | live | FUTURE-SEAM (no device/connected integration — never simulated) |
| Equipment (bike etc.) | A | CUR-LIVE | O | — | U/CONN | rec-only | — | — | — | — | — | live | FUTURE-SEAM |
| Related Project/Problem/Meeting/Life Moment links | A | CUR-LIVE | O | — | U/AI-S | never auto-exposed | no silent linking | — | — | reference links | — | live | FUTURE-SEAM (no record-reference picker) |

## 5 · HEALTH (sheets 34–42)

Highest-sensitivity domain. **PROTOTYPE ENFORCEMENT** here: record-only fields are
stored in `fields.*` and never rendered by any projection surface (`Moment.tsx`
kindLine renders none of them); `recordPrivacy:"private"` marks record depth;
Health/Problem carry no Respond/expression controls. **LIVE/BACKEND CONTRACT** (35/36,
documented in `docs/handover/social-api-contract.md` and this row set, NOT implemented
here): server-side record/field authorization, purpose-scoped APIs, encryption, audit,
body-anchor existence privacy, signed media URLs, tenant isolation, deletion
propagation, AI/vector isolation. No regulatory-compliance claim is made (sheet 34's
own rule).

| FIELD | TIER | CUR | REQ | VISIBILITY | SOURCE | SOCIAL | PRIVACY | MEDIA | CIRCLE/TIME | REL | AI | PERSIST | STATUS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Record type (Symptom/Condition/Injury/Appointment/Diagnosis/Medication/Measurement/Test/Imaging/Procedure/Vaccination/Allergy/Dental/Vision/Mental/Document/Other) | Q | CUR | O | Health selected | U/AI-S | rec-only (kind word "health" is all the card says) | sensitive | — | — | — | AI never promotes symptom→diagnosis (HEALTH-009) | `fields.healthType` | **[A✚]** PARTIAL (was 4 types) → IMPLEMENTED (17 canonical types) |
| Health Episode (grouping layer) | S | CUR | O | Health world | U | — | sensitive | — | episode ≠ children (HEALTH-010) | groups records | AI reconstruction = FUT | live | OUT-OF-COMPOSER (never a quick-capture type) |
| Title / what happened | Q | CUR | R (min) | the words | U | audience-chosen story only | — | — | — | — | — | `Moment.text` | IMPLEMENTED |
| Body area (BodyAnchor stand-in) | Q | CUR | O | Health selected | U (3D body = live MVP core) | rec-only — NEVER rendered | body-map existence itself is sensitive (36) | — | — | 0/1/many anchors valid; broad anatomy valid; NO chest→heart inference | AI anatomy suggestion = live | `fields.bodyArea` | PARTIAL (free-text broad anatomy — honest; structured BodyAnchor {system/region/structure/laterality} + 3D picking = FUTURE-SEAM, briefs in handover) |
| When + precision | M | CUR | O | Private record details | U | rec-grammar | — | — | historical approximate valid; unknown ⇒ Unplaced | — | never fabricated | common | IMPLEMENTED (+ precision this pass) |
| Severity | M | CUR | O | Private record details | U/source scale (live) | rec-only | — | — | — | — | vague words never converted to scores | `fields.severity` | IMPLEMENTED (rec-only) |
| Private note | M | CUR | O | Private record details | U | rec-only, stated "never shared" | — | — | — | — | — | `fields.privateNote` | IMPLEMENTED (rec-only) |
| Measurement value + unit | M | CUR | AD (type = Measurement) | Private record details | U (DEV/CONN = live) | rec-only | original unit retained | — | trend intelligence = live | — | — | `fields.measureValue/measureUnit` | **[A✚]** MISSING → IMPLEMENTED |
| Medication name | M | CUR | AD (type = Medication) | Private record details | U (vocabularies = live) | rec-only | — | — | — | prescription/plan/intake layers = live (HEALTH-012) | no prescribing AI ever | `fields.medication` | **[A✚]** MISSING → IMPLEMENTED (identity only; regimen layers = FUTURE-SEAM) |
| "Shared in this post" vs "Private record details" grouping (§22) | M | CUR | — | Health selected | SYS | states the boundary in place | — | — | — | — | — | — | **[A✚]** PARTIAL → IMPLEMENTED (two labeled groups + the sharing-awareness line above POST) |
| Provider / caregiver / facility | M | CUR-LIVE | O | — | U/CONN | private | provider relation ≠ access | — | — | org/place links | — | live | FUTURE-SEAM (no provider/org model) |
| Symptom pattern/triggers · Condition status · Diagnosis coding · Prescription/plan/intake · Test order/result/report/interpretation · Imaging/DICOM · Procedure outcome · Vaccination lot/site · Allergy evidence · Dental/Vision structures · Family history | A/S | CUR-LIVE | O | Health world | per 38 | never auto-published (never-auto-share list) | highest sensitivity | imaging = first-class artifact (live) | meaningful events only reach Circle | knowledge layers stay distinct (HEALTH-013) | truth hierarchy §70; MVP AI organizational only (HEALTH-023) | live | OUT-OF-COMPOSER / FUTURE-SEAM (the full Health world; the composer captures the quick record honestly and stops) |
| Wearable/device streams | — | CUR-LIVE | — | — | DEV/CONN | never | — | — | raw streams never become Circle noise (HEALTH-015) | — | normalization first | live | FUTURE-SEAM |

## 6 · PROBLEM (sheets 17–21)

A living thread over time in the Problem world; the composer creates the Problem with
minimum honest state. Status=Open internal, never asked. WAITING ≠ BLOCKED,
IMPACT ≠ URGENCY, NEXT ACTION (intent) ≠ ATTEMPT (tried) are frozen semantics.

| FIELD | TIER | CUR | REQ | VISIBILITY | SOURCE | SOCIAL | PRIVACY | MEDIA | CIRCLE/TIME | REL | AI | PERSIST | STATUS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| What's the problem? (the words) | Q | CUR | R (min) | Problem selected | U | intended story | investigation DB never dumped | evidence media optional | — | — | AI structure never overwrites framing | `Moment.text` | IMPLEMENTED |
| Status (Open default, internal) | — | CUR | R (auto) | never asked | SYS | rec-only | — | — | — | — | — | `fields.status:"open"` | IMPLEMENTED |
| Category / type | M | CUR | O | More details | U/AI-S | rec-only | — | — | — | — | type never blocks creation | `fields.category` | IMPLEMENTED |
| Impact | M | CUR | O | More details | U | rec-only | — | — | — | — | — | `fields.impact` | IMPLEMENTED |
| Urgency (distinct from impact) | M | CUR | O | More details | U | rec-only | — | — | — | — | — | `fields.urgency` | **[A✚]** MISSING → IMPLEMENTED |
| What have you tried (Attempt) | M | CUR | O | More details | U | rec-only | failures preserved | — | — | attempt ≠ next action | — | `fields.attempt` | **[A✚]** MISSING → IMPLEMENTED (free text; the dated Attempt[] thread = Problem world) |
| Next action (intent) | M | CUR | O | More details | U | rec-only | — | — | — | — | — | `fields.nextAction` | **[A✚]** MISSING → IMPLEMENTED |
| Related project | M | CUR | O | More details | U | rec-only | — | — | — | text ref (live = record link) | — | `fields.relatedProject` | IMPLEMENTED |
| Notes / When (discovered) | M | CUR | O | More details | U | rec-only | — | — | unknown ⇒ Unplaced | — | — | common | IMPLEMENTED |
| Subject/object reference · how-known source | M | CUR-LIVE | O | — | U/AI-S | rec-only | — | — | — | needs reference model | AI-detected needs acceptance | live | FUTURE-SEAM |
| Observations[] · Evidence items · Hypotheses · Causes · Constraints · Dependencies · Options · Decisions · Attempts[] · Results · Workaround · Solution · Verification · Resolution state · Outcome · Lessons · External case · Cost | A/S | CUR-LIVE | O | Problem world | per 18 | never auto | evidence originals preserved | evidence media | dated ProblemEvents reach Circle when meaningful | thread objects distinct | conflicting evidence never silently reconciled | live | OUT-OF-COMPOSER (the living thread — reached from the record, not the composer) |
| Full lifecycle (In Progress/Waiting/Blocked/Resolved/Closed/Reopened) | P | CUR-LIVE | — | Problem world | U/SYS | — | — | — | — | Waiting ≠ Blocked | never auto-resolved | live | OUT-OF-COMPOSER |

## 7 · PROJECT (sheets 22–27)

Simple + Complete are the SAME record (PROJ: no conversion, no duplicate). The composer
is the Simple quick entry.

| FIELD | TIER | CUR | REQ | VISIBILITY | SOURCE | SOCIAL | PRIVACY | MEDIA | CIRCLE/TIME | REL | AI | PERSIST | STATUS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Project name / What are you working on? | Q | CUR | R (name or words) | Project selected | U | eligible | — | — | — | — | — | `fields.name` | IMPLEMENTED |
| Goal | Q | CUR | O | Project selected | U | eligible when set | — | — | — | distinct from Purpose | — | `fields.goal` | IMPLEMENTED |
| Status (Planned/Active default by context) | — | CUR | R (auto) | never asked at creation | SYS/U | rec-only | — | — | — | full transitions = Project world | AI never silently ranks | `fields.status:"active"` | **[A✚]** MISSING → IMPLEMENTED (internal default; editable lifecycle = Project world) |
| Milestone | M | CUR | O | More details | U | eligible when set | — | — | milestone ≠ task | — | — | `fields.milestone` | IMPLEMENTED |
| Target (aimed completion) | M | CUR | O | More details | U | rec-only | — | — | original vs current target history = live | — | — | `fields.target` | **[A✚]** MISSING → IMPLEMENTED (rec-only text; date-object + change history = live) |
| Notes / Start (When) | M | CUR | O | More details | U | rec-only | — | — | historical start valid; unknown ⇒ Unplaced | — | — | common | IMPLEMENTED |
| Purpose · Success criteria · Constraints · Priority · Progress · Current focus · Phases · Tasks · Dependencies · Sub-projects · Updates thread · Risks · Budget/Costs · Change history · Deliverables · Outcome · Lessons · Organizations | A/S | CUR-LIVE | O | Project world | per 23 | field-aware disclosure | child objects may be stricter | files/media = resources | significance-aware ProjectEvents only | canonical links | AI drafts require acceptance | live | OUT-OF-COMPOSER (Complete Project tools) |

## 8 · MEETING (sheets 28–33)

**Social Meeting stays Basic (MEET-004):** who, what about, when/context, optional
media, optional small detail, POST. The Complete Meeting workspace is never exposed
from the Social composer.

| FIELD | TIER | CUR | REQ | VISIBILITY | SOURCE | SOCIAL | PRIVACY | MEDIA | CIRCLE/TIME | REL | AI | PERSIST | STATUS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Subject / what was this about | Q | CUR | R (subject or words) | Meeting selected | U/AI-assist(live) | eligible | — | — | — | — | — | `fields.subject` | IMPLEMENTED |
| When (visible immediately — the one kind with Q-level When) | Q | CUR | O | Meeting selected | U | date grammar | — | — | scheduled vs actual = live distinction | — | — | common | IMPLEMENTED |
| Participants (common People) | Q | CUR | O | People | U | rel. privacy | unknown participant valid | — | — | roles/attendance = Complete | — | `fields.with` | IMPLEMENTED |
| Purpose | M | CUR | O | More details | U | rec-only | — | — | — | distinct from Objective (Complete) | — | `fields.purpose` | IMPLEMENTED |
| Duration | M | CUR | O | More details | U | rec-only | never fabricated from approximate time | — | — | — | — | `fields.duration` | IMPLEMENTED |
| Related to | M | CUR | O | More details | U | rec-only | — | — | — | text ref (live = record link) | — | `fields.relatedProject` | IMPLEMENTED |
| Notes (human note) | M | CUR | O | More details | U | rec-only | private vs shared notes = Complete | — | — | — | human note ≠ transcript | `fields.notes` | IMPLEMENTED |
| Online (small detail) | M | CUR | O | More details | U | rec-only | platform-neutral | — | — | — | — | `fields.online` | IMPLEMENTED |
| Meeting mode (In person/Online/Hybrid/Phone/Other) | S | CUR | O | Simple (My Life) tier — 29: Social Basic = "No" | U/CONN | — | — | — | — | — | — | live | OUT-OF-COMPOSER (the retained Online checkbox is the Basic-tier small detail) |
| Meeting type · Objective · Agenda · Preparation · Roles · Attendance · Organizations · Recording · Transcript · Topics · Decisions · Actions · Commitments · Open questions · Disagreement · Minutes · Series · Follow-up · Consent/retention | S | CUR-LIVE | O | Complete Meeting | per 29 | transcript/private notes never leak to Social | artifact-level permissions | recording = ORIGINAL MEDIA | series = independent occurrences | knowledge layers distinct (MEET-007) | review-by-exception; AI never confirms decisions | live | OUT-OF-COMPOSER |

---

## Classification summary (§3 of the master prompt)

- **A — MUST BUILD NOW (this pass):** every **[A✚]** row above — time precision
  (month/year/approximate/unknown + Unplaced exclusion), place precision, cover
  selection, depth labels ("More details"/"Advanced details"), §22 Health grouping,
  Life Moment Story + Chapter, Meal custom occasion + canonical contexts + preparation/
  ingredients/experience/cost + Advanced food-item list, Activity per-type adaptive
  More fields (13 subtypes served), Health 17 types + measurement/medication adaptive
  fields, Problem urgency/attempt/next-action, Project status default + target.
- **B — DATA-ARCHITECTURE SEAM (documented, additive fields where cheap):**
  provenance-per-field persistence, canonical value+unit, four-stamp time model,
  multi-record grouping (one seam: `buildSubmission`), media-asset sharing across
  records, people roles.
- **C — FULL SPECIALIST WORLD (out of the Social composer by canon):** Complete
  Meeting/Project tools, the Problem thread, the Health world + 3D body, the detailed
  Memory form (Travel/Soundtrack/Favourite), Health Episode.
- **D — FUTURE (V1 — never faked):** voice memories, testimony, reflections,
  trip reconstruction, AI grouping, wearables, DICOM, time-scrubbed body.
- **E — REFERENCE:** sheets 34–36 security/compliance (live obligations, restated in
  §5 header), 07 monetization (no composer impact; free core complete by construction).

## Verification

Tests derive from THIS contract (master prompt §100): `prototype-tests/`
`social-composer-canonical.js` (new — 59 checks, C1 common · C2 time · C3–C9 one section
per domain · C10 reclassification · C11 localization) beside the existing
`social-composer.js` (§47 greenfield matrix, kept green). Every CURRENT row is either
suite-covered or explicitly OUT-OF-COMPOSER / FUTURE-SEAM above — no silent omissions.

Recorded supersessions in prior suites (invariants unchanged, the type list grew to the
canonical set): `social-composer.js` and `social-final.js` asserted 4 Health types →
now assert the 17 canonical types (38_HEALTH_FIELDS).
