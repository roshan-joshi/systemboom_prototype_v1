# UNIVERSAL SOCIAL POST COMPOSER — CANONICAL HANDOVER
Workbook-driven canonical pass · 2026-09-29 · builds on the greenfield composer
(`UNIVERSAL-SOCIAL-COMPOSER-GREENFIELD-HANDOVER.md`, 2026-09-29)

## STATUS
**COMPLETE** for the prototype scope, with the honest boundaries stated under
PROTOTYPE-ONLY SEAMS and FUTURE-ONLY ITEMS. The default composer is still effortless
Social; all seven canonical Human Record worlds capture correctly at Quick / More
details / Advanced details on ONE draft; nothing fake was built. Test results, tsc,
eslint and build are recorded at the end.

## CANONICAL SOURCES READ
ALL 50 sheets of `references/8 Task details.xlsx`, in the mandated authority order:
11_UNIVERSAL_RECORD_RULES → the APPROVED per-domain decision logs / field contracts /
UX contracts (16/21/27/33/42/48 + 13/18/23/29/38/44 + 14/19/24/30/39/45 + 15/20/26/
32/41/47 + 04/05/25/31/40/46) → domain overviews (02/12/17/22/28/37/43) → 00_README /
01_PRODUCT_MAP → 08_DECISION_LOG / 09_DOMAIN_TEMPLATE / 10_SOURCE_NOTES → prior owner
rules (03/06/07/34/35/36) → prototype code as context only. `Sheet1` is empty. No
overview-only shortcuts were taken.

## SOURCE CLASSIFICATION
- **Current** (drove this pass): 11, all six domain field contracts, the Simple/
  Complete and lifecycle sheets' capture-relevant rows, 46_LIFE_MOMENT_SOCIAL_UX,
  04_ACTIVITY_TYPES, 14_MEAL_CONTEXTS.
- **Future** (documented seams, never faked): V1 rows of 06/39/45 (wearables, DICOM,
  AI grouping/reconstruction, voice/testimony, time-scrubbed body), connected-source
  provenance classes, multi-record grouping.
- **Reference** (obligations restated, not implementable client-side): 34/35/36 Health
  security/compliance (live/backend contract), 07 monetization (no composer impact —
  the free core stays complete by construction), 10_SOURCE_NOTES (live-product
  artifacts: PhotoForm/AddMemoryModal exist only in the live product).

## FIELD CONTRACT COVERAGE
`references/social-composer/CANONICAL-COMPOSER-FIELD-CONTRACT.md` — every relevant
canonical field of all seven domains + the common layer, each row carrying tier,
CUR/FUT, required/optional/adaptive, visibility condition, source/provenance, social
eligibility, privacy, media role, Circle/time, relationships, AI behavior, persistence
and IMPLEMENTATION STATUS ∈ {IMPLEMENTED, PARTIAL, MISSING→built, OUT-OF-COMPOSER,
FUTURE-SEAM}. No cherry-picking: rows that are not built say so and say why.

## CURRENT COMPOSER BEFORE (audit, post-greenfield)
One common draft + seven adapters; Quick + one "A little more" drawer; Meal 6-context
list with a split Takeaway/Delivery; Health 4 types; day-only event precision; place
as a bare string; no cover control; no story/chapter; no structured meal items; no
per-subtype activity depth; no urgency/attempt/next-action; no project status/target.

## CURRENT COMPOSER AFTER (this pass)
Same opening state (unchanged — proven byte-level by the greenfield suite staying
green), plus: canonical depth labels **More details / Advanced details**; §18 time
precision (exact date · month · year · approximate · date-unknown ⇒ UNPLACED); §17
place precision; §12 cover selection; Life Moment Story + Chapter; Meal custom
occasion + the canonical eight contexts + preparation/ingredients/experience/cost +
Advanced structured MealFoodItems; Activity per-subtype adaptive More fields (13
subtypes served) + purpose + felt; Health 17 canonical types + type-adaptive
Measurement (value/unit) and Medication (name) + the §22 "Shared in this post" vs
"Private record details" grouping; Problem urgency/attempt/next-action; Project
internal status=active + target.

## DEFAULT SOCIAL FLOW
Unchanged from the accepted greenfield §5: Create post · identity + Audience ·
"What's happening?" · Photo/Video · People · Place · Record details · POST. Text-only
⇒ Social Post only (`record:"none"`, MOMENT-009); media ⇒ Life Moment by default
(MOMENT-010) with "Social only" as the explicit override; hidden until asked:
categories, dates, Life age, Feeling, every specialist field.

## RECORD DETAILS
"Social mode" clearly apart from RECORD AS × exactly seven (Life Moment · Meal ·
Activity · Health · Problem · Project · Meeting). No Media world, no Social in the
record list (MOMENT-004: Photo/Video are media primitives).

## MEDIA ARCHITECTURE
POST ≠ RECORD ≠ MEDIA. Photos reference stable LIBRARY asset ids (the §11 stable-
identity stand-in); multiple, preview, remove, reorder and **cover** (lead position =
the cover in this media model) in the manager; one-media-kind contract kept; original
asset metadata is never overwritten — the EXIF finding is REVIEWED ("From the photo …
Use / Not this") and writes only the draft's eventTime. Honest gaps: device capture
(Take Photo / Record Video / Files) and upload retry are FUTURE-SEAM — no camera or
upload pipeline exists in this repo, and the mock picker is labeled "Choose photos".

## MULTI-EVENT SUPPORT
Canonical default preserved: one POST ⇒ zero or one PRIMARY record (§73). The
architecture PERMITS one-post→many-records at exactly one seam — `buildSubmission`
in `composer/submit.ts` is the single orchestration point a live grouping engine
extends ("Suggested events / Keep together / Adjust" is V1 per 45). No grouping UI
was faked.

## RECLASSIFICATION (§74)
Edit → Record details → a different category: suite-proven (canonical C10) to keep
media (byte-identical items), event time, audience and people, drop the old
category's fields, and stay the SAME Moment id. Human meaning outranks the original
guess.

## PEOPLE
One common People control (`fields.with`, resolved ids only; unmatched names said out
loud — A12). Domains reference it, never duplicate it. People ROLES
(prepared/hosted/participant/provider) are FUTURE-SEAM: the prototype's people model
has no role dimension; the live people graph carries them.

## PLACE
One common Place (name) + §17 precision (venue · city/region · country · approximate)
offered once a place is stated, stored additively as `Moment.placePrecision` for the
live disclosure engine. Exact GPS is a live/device seam. Unknown = simply no place.

## TIME / PRECISION / UNPLACED (§18/§21)
postedAt ≠ happenedAt: `at` is the event's time (noon sort anchor at day precision),
`sharedAt` the posting provenance. NEW: `Moment.timePrecision` —
- **month/year**: the picked date is only the anchor; the feed heading renders
  "JUL 2019" / "2015"; no day, no clock, and **no exact-age claim** (band only);
- **approximate**: "around 14 JUL 2019";
- **unknown** ("Date unknown" in the When area, records only): the record is
  **UNPLACED** — excluded from the Circle, the Day Almanac, ring density and the
  month count; `at` keeps the recording time as provenance, never displayed as a
  claim; it stays reachable in the stream. A dedicated Unplaced tray is a live seam.
- **life-period** precision is FUTURE-SEAM (needs the chapter/band model).
Before-birth and future dates stay refused in the Life rule's own words (A11).

## AI / PROVENANCE (§70–§72)
One suggestion max above the 0.75 floor, silence below; accept classifies ONLY
(`intentSource:"ai"`), never writes fields; Keep dismisses for the composition.
`suggest-record.ts` remains the labeled PROTOTYPE HEURISTIC — the replaceable seam
for real vision/OCR/EXIF intelligence. No AI output is presented as fact anywhere;
nothing estimates nutrition, routes, anatomy or dates. Draft-level provenance is
tracked (`intentSource`, `eventTime.provenance`, metadata `source:"exif"` +
resolution); a full per-field provenance ledger is a live persistence seam.

## SOCIAL PROJECTION (§29 / §77–§81)
`projectedFields` in `submit.ts` is the one allowlist deciding what the Social card
may carry per kind; everything else in a domain draft dies with the draft, and
record-only keys (below) are stored but never rendered by `Moment.tsx`. Adversarially
probed: an exact Activity route and Health measurement values are stored yet absent
from the rendered DOM.

## RECORD PRIVACY (§28)
The social audience (`privacy`) and the Human Record's own depth are separate axes:
every specialist record born in Social carries `recordPrivacy:"private"`. Health
additionally states the boundary in place (§22): a "Shared in this post" group (what
travels: words, media, the kind word, with the chosen audience) above a "Private
record details" group (When · type-adaptive fields · severity · private note), plus
the sharing-awareness line above POST.

## LIFE MOMENT
- **Quick**: the common composer IS the quick Life Moment (caption = post text, per 46).
- **More details**: When (+precision) · Feeling · **Story** (the richer account,
  distinct from the caption — MOMENT-007, record depth) · Milestone · **Chapter**
  (the person's own life-period words; the chapter OBJECT model is live).
- **Detailed/advanced**: Travel / Soundtrack / Favourite / detailed cover flows are
  OUT-OF-COMPOSER by canon (46: "Detailed Life Moment only" — the standalone Memory
  form is the enrichment surface and exists in the live product).
- **Future seams**: voice memories, documents-as-media, reflections, testimony,
  AI grouping/trip reconstruction (V1 per 45).

## MEAL
- **Quick**: Occasion (six culture-neutral options; **Other opens the person's own
  wording**) · "What did you have?".
- **More details**: Context (the canonical EIGHT: Home cooked · Restaurant–Café ·
  Takeaway–Delivery · Packaged · Work–School · Event–Party · Travel · Other) ·
  Preparation · Ingredients · Experience · Cost · Notes · When.
- **Advanced details**: the structured **MealFoodItems** list (0..N, name + optional
  portion — "do not flatten all into one string"); items are record depth in the
  prototype (name eligibility is a live projection choice).
- **FUTURE-SEAM (never faked)**: nutrition/macros/micronutrients (needs LABEL /
  REFERENCE DATABASE provenance), allergen evidence states, dietary attributes,
  product/barcode/menu, the reusable Recipe object, receipt OCR, people roles.

## ACTIVITY
- **Type coverage**: all 12 canonical subtypes.
- **Adaptive Quick**: distance+duration (run/walk/cycle/hike/swim), workout+duration
  (gym), sport+duration (sport), practice+duration (mind & body); none for
  hobby/learning/travel/other — never every metric at once, never required.
- **Adaptive More details** (04, all record-only): walk→steps; run→pace+elevation;
  cycle→avg speed+elevation; hike→elevation; gym→exercises; sport→match-or-training +
  team + opponent; swim→pool/open water + laps + stroke; mind&body→style;
  hobby→what-I-worked-on; learning→topic+what-I-learned; travel→transport; plus common
  purpose, how-it-felt, intensity, route (sensitive — stored, never rendered), goal,
  notes, When.
- **Advanced (FUTURE-SEAM)**: HR, calories, cadence, splits, power, SWOLF, elevation
  profiles, detailed GPS series, equipment — DEVICE/CONNECTED sources that do not
  exist here; nothing simulates them and no estimate is shown as measured.

## HEALTH
- **Type coverage**: the 17 canonical record types (Symptom · Condition · Injury ·
  Appointment · Diagnosis · Medication · Measurement · Test · Imaging · Procedure ·
  Vaccination · Allergy · Dental · Vision · Mental wellbeing · Document · Other).
  Health Episode is deliberately NOT a capture type (HEALTH-010 — grouping layer).
- **Type-adaptive capture**: Measurement → value + original unit; Medication →
  identity only (prescription/plan/intake are distinct live layers, HEALTH-012).
- **BodyAnchor**: free-text broad body area — honest under HEALTH-006 (broad anatomy
  valid, no false precision, no chest→heart inference). The structured BodyAnchor
  (system/region/structure/laterality) + the already-built 3D body live in the
  product, not this repo — FUTURE-SEAM with the 36-sheet security rules restated.
- **Privacy — PROTOTYPE ENFORCEMENT**: every Health field is record-only (never
  rendered by any projection surface), `recordPrivacy:"private"`, no Respond/
  expression controls on Health, §22 grouping states the boundary in place.
- **LIVE/BACKEND CONTRACT (35/36 — NOT implemented here, stated not claimed)**:
  server-side record/field authorization, body-anchor existence privacy, signed media
  URLs, tenant isolation, audit logging, deletion propagation, AI/vector isolation.
  No regulatory-compliance claim is made (34's own rule).

## PROBLEM
- **Living record semantics**: the composer creates the Problem at its honest minimum
  (the words; Status=Open internal, never asked). IMPACT ≠ URGENCY (two fields),
  ATTEMPT (already tried) ≠ NEXT ACTION (future intent) — captured as distinct facts.
- **Event history**: Observations[] / Evidence / Hypotheses / Decisions / Attempts[] /
  Verification / Outcome / Lessons are the Problem WORLD's living thread —
  OUT-OF-COMPOSER by canon; `docs/handover/social-api-contract.md` carries the seam.

## PROJECT
- **Simple**: name (or the words) · goal · milestone · target · notes · start (When);
  status defaults **active** internally (23: "Default Planned/Active by context",
  never asked at creation).
- **Advanced capture**: nothing further belongs in the composer per 23's tiers.
- **Full specialist boundary**: phases/tasks/dependencies/risks/budget/updates thread/
  change history (preserve previous+current+reason+time) = Complete Project tools,
  OUT-OF-COMPOSER; change-history persistence is a live obligation.

## MEETING
- **Social Basic (MEET-004) holds**: subject · When (the one quick-level When) ·
  common People · optional media; More details = purpose · duration · related to ·
  notes · the Online small detail. Suite-proven: no agenda/transcript/recording/
  minutes/attendance vocabulary, no mode list (29: mode is Simple-tier).
- **Simple/Complete data compatibility**: the captured fields map 1:1 onto the
  canonical Meeting's Identity/Time/People/Outputs groups — no conversion needed.
- **Full specialist boundary**: Before/During/After workspace, decisions/actions/
  commitments/questions, series, consent/retention — the Meeting world.

## DRAFT
Nothing exists before POST; Keep draft restores verbatim (in-memory `state.udraft`;
the entry bar says "Draft kept — continue your post"). Durable autosave = live seam.

## ENRICH LATER
Edit details (owner ⋯ → the same composer, A2/A3 truth); View details = the feed card;
View in Life = the accepted disabled seam; "Open in Meal/Health/…" specialist worlds =
FUTURE-SEAM (they exist in the live product only).

## SHARE LATER / STOP SHARING
Unchanged from greenfield: `Moment.unshared` — Stop sharing removes the Social
projection (feed + search) while the record keeps Life/Circle/density; the Day
Almanac's "Share" returns the SAME record; delete purges saved bookmarks.

## EDIT VS UPDATE
Edit corrects THIS event (same id; same-date edits keep `at`/`atPrecision` exactly;
moved dates take the day anchor + provenance; media kept unless deliberately changed).
A new event is a new POST. Precision claims patch without rewriting the anchor.

## CIRCLE
Automatic placement whenever the event is temporally placeable (noon anchor);
"Record here" seeds an explicit Life Moment at the inherited coordinate (date never
re-asked, MOMENT-014); UNPLACED records are excluded rather than faked into a date.

## DESKTOP · IPHONE/MOBILE · DARK/LIGHT
Desktop: the 400–560px centred modal (transform-free S7 centring). Phone (360):
full-viewport sheet, safe-area footer, 36–44px targets, POST reachable with More +
Advanced open (probed in ru, the longest locale: no horizontal overflow, POST
visible). Both themes exercised by the suites (canonical C-sections run light;
social-composer runs dark 360 + light desktop).

## ACCESSIBILITY
Dialog semantics + focus trap + return; aria-expanded on Record details / More
details / Advanced details; radio semantics on every chip select; labeled fields
(useId); the §44 refusal line is spoken and focus moves to the problem; Escape ladder
(panel → discard) unchanged; the unknown-date claim is an aria-pressed toggle.

## LOCALIZATION
74 new keys × 8 locales (**601 keys per catalog, key-complete**): depth labels, time/
place precision, cover, story/chapter, meal depth + canonical contexts (Takeaway–
Delivery merged per 13; Packaged/Work–School/Travel added; `ctxDelivery` retired from
all eight), activity subtype fields, 13 new Health types, measurement/medication,
§22 group labels, problem/project additions, `moments.around`/`moments.dateUnknown`.
Non-Latin coverage suite-proven in ne (no English leaks; Nepali precision chips);
ru probed at 360. New non-English values are draft pending native review (the
standing translation-status process).

## FILES CREATED
- `references/social-composer/CANONICAL-COMPOSER-FIELD-CONTRACT.md` (the §4 artifact)
- `prototype-tests/social-composer-canonical.js` (59 checks)
- this handover

## FILES CHANGED
- `src/components/style-lab/social/composer/types.ts` — EventTime precision widened;
  `PlacePrecision`; `timeUnknown`/`placePrecision` on UDraft; Story/Chapter,
  FoodItem/meal depth, activity subtype fields, HealthType×17 + measure/medication,
  problem urgency/attempt/nextAction, project target; `uDraftFromMoment` round-trips
  all of it.
- `src/components/style-lab/social/composer/domains.tsx` — canonical MEAL_CONTEXTS(8)
  / HEALTH_TYPES(17); `activityMoreExtras`; custom occasion; rewritten More panels;
  §22 Health grouping; WhenField precision + Date-unknown; `AdvancedDisclosure` +
  `FoodItemsEditor`.
- `src/components/style-lab/social/composer/UniversalComposer.tsx` — "More details"
  label; place-precision select; Make-cover control.
- `src/components/style-lab/social/composer/submit.ts` — extended per-kind
  projections (record-only depth); project status default; time/place precision and
  UNPLACED anchor rules.
- `src/components/style-lab/social/data.ts` — KindFields additive record keys;
  `Moment.timePrecision`/`placePrecision`; status union + "active".
- `src/components/style-lab/social/Moment.tsx` (frozen — recorded exception) —
  DateRule coarse/unknown grammar; exact-age suppression under coarse claims; no
  recording-clock claim for unknown dates.
- `src/components/style-lab/social/SocialPreview.tsx` — a coarse/unknown Moment
  always states its own date rule.
- `src/lib/i18n/format.ts` — `sbDateCoarse` (deterministic, shipped month tables).
- `src/components/style-lab/circle/model.ts`, `social/view-model.ts`,
  `social/CircleModule.tsx` — UNPLACED exclusions.
- catalogs ×8 — 74 new keys, 4 relabeled contexts, `ctxDelivery` removed.
- `prototype-tests/social-composer.js`, `prototype-tests/social-final.js` — the
  recorded 4→17 Health-type supersession (invariants unchanged).

## FILES REMOVED
None (the greenfield pass already removed the legacy Composer).

## TEST RESULTS
- **social-composer-canonical 59/59** (new — from the contract, §100)
- social-composer 67/67 · social-4-4a-truth 125/125 · social-final 194/194 ·
  s3-moments 17/17 · s6-motion 55/55 · circle 132/132 · s3-s4-loops 14/14 ·
  social-shell 68/68 · final-app 31/31 · i18n 45/45 · person-life-identity PASS ·
  complete-my-world 62/62 · s7-device-mastery 56/56
- Full fleet, one final run (all green): one-application 40 · my-world-2030 ·
  social-connection-final · social-2030 · social-2030-final · s2-person-world 47 ·
  locale-resolution · s4-people 20 · s5-discovery 48 · social-s1–s7
  (24/29/14/13/15/8/8) · social-4-4a1-p06 599 · social-r2 43 · r3 80 · r3.1 69 ·
  r3.2 92 · r3.3 102 · r3.5 20 · r3.6 21 · r3.7 37 · r3.8 34 · r3.9 31 · devanagari
  crops (0 page errors) · celestial-s0 64 / s2-field 40 / s3-s6 32 /
  s7-constellation 114 · gate-desktop/mobile/fallback · identity-model 13. Counts
  unchanged everywhere except the two recorded supersessions and the new suite.

## TYPESCRIPT · ESLINT · BUILD
`tsc --noEmit` 0 errors · eslint 0 errors (pre-existing img/unused warnings only) ·
`next build` passes (recorded in the ledger with the fleet).

## FUTURE-ONLY ITEMS NOT IMPLEMENTED (never faked)
Multi-event grouping UI (V1), voice/documents/testimony/reflections, AI trip/event
reconstruction, wearables/device metrics, nutrition/allergen/product/recipe layers,
DICOM/imaging depth, structured BodyAnchor + 3D body, people roles, life-period
precision, Unplaced tray, compact-unit engine (§85), specialist worlds ("Open in …").

## PROTOTYPE-ONLY SEAMS
Mock media library = device capture + upload + EXIF pipeline; `suggest-record.ts` =
the AI classifier; in-memory draft = autosave; `fields.*` on the Moment = the record
store; client-side privacy = the server-side enforcement contract
(`docs/handover/social-api-contract.md` §D).

## ADVERSARIAL AUDIT (§111 — all 18, answered honestly)
1. Post in seconds — YES (default flow unchanged; suite §1/§2).
2. Did More/Advanced make Quick heavier — NO (both closed by default; suite-proven
   opening state unchanged).
3. Every category can use Photo/Video — YES (media is common; C10).
4. Type change reuses media — YES (C10: byte-identical items).
5. Post with optional fields absent — YES (minimum formula only; §5).
6. Unknown remains unknown — YES (ignored EXIF stays unknown; Date-unknown claim).
7. Old record can remain Unplaced — YES (C2: excluded from Circle/density/almanac).
8. AI suggestion → fact — NO (accept classifies only; low confidence is silence).
9. Social exposing private Health — NO (C6 + probe: stored, never rendered;
   recordPrivacy private; preview scope green).
10. Social exposing exact route — NO (probe: route stored, absent from DOM).
11. Meal AI claiming nutrition from a photo — impossible here (no nutrition layer
    exists; FUTURE-SEAM stated, not simulated).
12. Attempt overwriting Next Action — NO (distinct fields, C7).
13. Project history silently overwritten — temporal truth preserved (A2); the field
    change-history ledger is a stated live obligation, not silently dropped.
14. Meeting Social exposing transcript — NO transcript exists; C9 asserts no
    workspace vocabulary leaks.
15. One post → multiple real events when deliberately grouped — NOT in MVP by canon
    (§73 default 0..1; 45: grouping is V1); the single orchestration seam is stated.
16. Reclassification preserves history — YES (C10).
17. Phone keyboard hiding POST — footer is sticky + safe-area; POST visible at 360
    with every drawer open (probe B); real-keyboard behavior is a device test the
    prototype cannot honestly claim beyond this.
18. Long translation breaking layout — NO at 360 in ru (probe B) and ne (C11);
    zh tracking rule still green (s7 §12).

## OWNER DECISIONS REQUIRED
None new. One wording note, resolved by authority order and recorded: sheet 46 calls
the Social expansion "A little more" while the universal rules mandate the label
"More details" — the universal label rule (and the master prompt §21) outranks; the
composer now says "More details".

## TRUE BLOCKERS
None for the prototype. Everything canonical-CURRENT that a client-side prototype can
truthfully build is built; everything else is a named seam above.

---

# UC-C3 — FINAL UX / MEDIA / SMART ASSIST / CANONICAL FIELD CONVERGENCE
Owner-directed interaction-layer completion pass · 2026-09-29, same day as the pass above

## UC-C3 STATUS
**COMPLETE.** This pass did NOT rebuild the canonical data model above — it redesigned the
INTERACTION LAYER on top of it, per the owner's explicit instruction ("this is NOT another
rebuild... PRESERVE those architectural foundations"). Every canonical field from the
contract is still captured; none disappeared; the presentation of many of them changed
from a persistent field-matrix to contextual/addable/picker controls (see the new
"UC-C3 presentation classification" section added to
`CANONICAL-COMPOSER-FIELD-CONTRACT.md`). `social-composer.js` rewritten to the §71–§84
required-test matrix (112/112); `social-composer-canonical.js` re-pointed to the new
wiring with every stored truth re-verified (62/62); the four other composer-touching
suites re-pointed with recorded supersessions (see TEST RESULTS below). tsc 0, eslint 0,
`next build` passes. Not committed, not pushed (owner instruction); no screenshots were
generated (owner performs the visual review).

## VISUAL UX BEFORE / AFTER
**Before** (the pass this section follows): a tall default modal with a visible character
counter; a persistent "Social mode / Record as" block showing all eight choices at once
below the action row; People as `<input placeholder="Names, comma-separated">`; Place as
a bare text input; media as three tabs (Photos/Video/Link) with Photos as a fixed
4–6-column grid; Activity's 12 types and Health's 17 types both fully expanded inline;
Meal/Activity/Problem/Project "More details" rendering every canonical field as an empty
box simultaneously; no visible AI capability at all.

**After**: a compact opening (identity + Audience, the textarea, four human-worded
actions, Post — nothing else, ~330px tall on desktop); the record choice lives in a
focused chooser SHEET (Just post + the seven records, each with a one-line human
explanation) that CLOSES on selection, leaving one smart pill ("Meal · Dinner · Change");
People and Place are real search-driven pickers with chips/precision; media has explicit
sources (Upload / Camera / My Media / a separate Link row) and a My Media library that
reuses existing account assets with real multi-select across photos AND videos; Activity
and Health lead with their common few and open a focused picker for the full canonical
list; every domain's "More details" reveals only fields that already have a value or were
explicitly added via a "+ Field" chip; a subtle ✦ Smart Assist control sits at the end of
the action row, off to the side, offering one quiet extraction suggestion when enabled.

## DEFAULT COMPOSER
Identity + Audience row, the textarea (2-row min-height, grows with content up to 38vh),
Media/People/Place/Add-details + the ✦ Smart Assist control, footer with just Post (the
character count appears only within 200 characters of the limit). No date, no Life age,
no classification row, no Social-only label — matching §71's required test exactly.

## ACTION ROW
`Media` (state: "Media · N" once assets are attached) · `People` ("People · N") ·
`Place` (shows the chosen place name in place of the label) · `Add details` (becomes the
colored record PILL once a record is chosen, e.g. "Meal · Dinner  Change") · a subtle
sparkle (✦) `Smart Assist` control at the end, never a fifth primary action in the same
visual weight (§25).

## RECORD CHOOSER
A focused sheet (`data-sb-sheet-panel="record"`): "Just post" (with the honest hint
"Don't add this to My Life") leads, then the seven canonical records, each as a 44px+ row
with an icon, its name, and a one-line human description pulled from new
`ucomposer.desc*` catalog keys ("A memory or experience", "Food or drink", "Something you
did", "A health event", "Something you're trying to solve", "Something you're working
on", "People coming together"). Selecting any row calls the existing `chooseIntent` and
immediately closes the sheet — the chooser never lingers once a choice is made.

## SELECTED RECORD PILL
Replaces the action-row's "Add details" chip once a record is chosen:
`{icon} {Record name}{ · subtype if known} Change`. The subtype grows in as soon as the
domain's own quick field supplies one (Meal's occasion, Activity's type, Health's type) —
e.g. "Meal · Dinner", "Activity · Run", "Health · Symptom". Tapping the pill (or its
trailing "Change") reopens the chooser sheet at the current selection.

## MEDIA SOURCES
"Add media" opens with four rows: **Upload** (a real `<input type=file multiple
accept="image/*,video/*">` — genuine device multi-select, mixed photos and videos in one
operation), **Camera** (`capture="environment"`, a real device capture intent), **My
Media** (opens the library picker below), and **Add a link** (a separate reference row,
never presented as a fourth "media type" alongside photos/video — §10's explicit
correction). With any visual media attached, the link row disables itself with the stated
reason (`ucomposer.linkSeparate`); a link never blocks a video from also being added
(UC-C3 §9 supersedes the old A10 one-media-kind-of-three-tabs contract for photos/videos
specifically — recorded in AGENTS.md).

## MULTI-UPLOAD
`registerUploads()` (new: `composer/media-assets.ts`) accepts a `FileList`/`File[]` and
registers each as a session-scoped `MediaAsset` via `URL.createObjectURL` — genuinely
one operation for N mixed photos and videos. `MEDIA_LIMIT` (10) is the ONE configurable
constant referenced everywhere the limit is enforced or stated (no hardcoded "10"
scattered through the UI, per §11's explicit instruction). §57 (upload failures) is
answered honestly, not faked: this prototype has no network transport for a file to fail
against (a local file becomes an object URL synchronously); what CAN fail — a file the
browser cannot decode — degrades through the new `Thumb` component to the same quiet
labeled-placeholder pattern `Media.tsx`'s `SafeImg` already uses in the feed, everywhere
the composer renders a thumbnail (collage, organizer, My Media grid). True upload
failure/retry against a real backend is stated as a live seam, not built as a fake state
machine that would perform identically to success.

## MY MEDIA
A dedicated sheet reusing `allAssets()` (the mock LIBRARY's photos + fixture videos +
this session's uploads). Filters: All / Photos / Videos; a live text search over each
asset's `alt`. Grid tiles show a numbered selection badge (not an ambiguous dot), a play
mark + duration for videos, and the existing EXIF-dot convention for assets carrying
metadata. The footer states the running count against the limit and reads "Add {n}".
Selecting existing assets here is REUSE by reference — `assetById()` resolves the same
id every time; nothing is re-uploaded, copied, or duplicated (verified in
`social-composer.js` §12: the same asset removed from one post and reselected shows no
duplicate storage, and the record posted only once).

## MEDIA ORGANIZER
A focused sheet over the SAME draft: each attached asset as a row (thumbnail, its own
label, a "Cover" badge on the lead item), with Make-cover / move-earlier / move-later /
remove controls, all keyboard-operable (never drag-only, per §65). "Remove" is explicitly
NOT delete (§17): it unlinks the asset from THIS draft only — confirmed in
`social-composer.js` §12, where a removed video is shown to still exist in My Media
immediately after. A single video's caption field surfaces here in place, matching the
accepted burned-caption model.

## COVER / ORDER
Unchanged mechanic from the canonical pass, now reachable from the organizer instead of
inline arrows on the collage: the lead item in `mediaIds` IS the cover (§12/§16 — "the
mosaic's lead is the cover"); Make-cover moves any item to that position.

## PEOPLE PICKER
A real search-driven picker (§22/§73): a labeled search field, a live-filtered result
list via the existing `matchPeople()` helper, a "Recent" section when the query is empty,
selected people shown as removable chips inside the sheet AND as a compact chip row in
the main composer body. An unresolved name is said out loud via
`ucomposer.noPeopleMatch` and NEVER becomes a selectable row or a stored id (A12 held
through the redesign — the harness never lets you select what does not exist). No
comma-separated text input remains anywhere in the product.

## PLACE PICKER
A real picker (§24/§74): search/typed entry, a quiet "Place found" offer when the
attached photo's own EXIF place differs from what's typed (Use/never silent), a
suggested/recent list drawn from the existing `PLACES` fixture, and the accepted §17
precision chips (venue / city-region / country / approximate) once a place is set, with
a "No place" clear action. No exact-GPS/current-location control exists — never forced,
matching §24's explicit instruction.

## SMART ASSIST
New `composer/smart-assist.ts` — the ONE service boundary for all AI-shaped behavior.
`extractAssist(text, hasMedia, excludeId)` is a deterministic, clearly-labeled PROTOTYPE
HEURISTIC (word/number pattern matching over the fixture vocabulary — activity type,
distance, duration, meal occasion, a matched real place, matched real people, a soft
yesterday/today cue) — never presented as model certainty, and built on the same
`suggestRecordType` signal already accepted as the honest classification seam. Exactly
one suggestion shows at a time, debounced 900ms, only when Smart Assist is enabled, only
above the existing 0.75 confidence floor (uncertainty is silence, unchanged from the
canonical pass). "Use details" fills draft fields (with the person's actual words
preserved verbatim) and NEVER posts; "Ignore" is final for that composition — the same
suggestion never returns after being dismissed (verified: typing more text that still
matches the same signal shows nothing further).

## SMART ASSIST OFF
A real global switch (`smartAssistEnabled()`/`setSmartAssist()`, `localStorage`-backed,
`sb-smart-assist`) reachable from the composer's own ✦ menu ("Turn off"/"Turn on" — no
separate Settings surface was required for this prototype, per §68's allowance). With it
off: no suggestions ever appear, and EVERY composer capability — all seven records, every
Quick/More field, media, people, place, submission — works identically by hand
(`social-composer.js` §7 proves this explicitly: the exact same Activity+distance record
posts correctly with Smart Assist off). Deterministic EXIF metadata review (§20) is
correctly NOT gated by this switch — it is declared, honestly, as context/metadata, never
AI inference (§26's explicit distinction).

## SMART ASSIST CAPABILITY FLAGS
`ASSIST_CAPABILITIES` in `smart-assist.ts` — a named registry of `{tier, implemented}`
per capability: `categorySuggestion`/`naturalLanguageExtraction`/`metadataSuggestion` are
CORE and implemented; `captionAssist`/`mediaUnderstanding`/`ocrExtraction`/
`eventGrouping` are ENHANCED and NOT implemented (no infrastructure exists — never
faked); `advancedDomainAssist` is PREMIUM/FUTURE and not implemented. `assistCan(cap)` is
the one gate the composer would call to enable a future capability — the seam is real
and typed, but nothing here fakes an unimplemented tier as working, and no billing/paywall
UI was built (§28/§70's explicit instruction).

## AI PRIVACY
Smart Assist never runs against Health text more deeply than the same
`naturalLanguageExtraction` every domain gets (category/body-area suggestion only, never
diagnosis) — and per the canonical pass's Health handling, nothing Smart Assist could
extract is more revealing than what was already typed. No "Analyze document" action was
built because no document analysis capability exists to gate (§33/§69 — the honest
absence, not a missing gate around a real thing). AI analysis scope is unrelated to and
never expands Social publication scope — Use details only ever changes draft fields the
person already sees and can edit before Post.

## AI PROVENANCE
`EventTime.provenance` gained a fourth value, `"ai"` (alongside `user`/`exif`/`circle`),
used only when Smart Assist infers a soft "yesterday" cue — architecturally present, not
surfaced in the Quick UI per §37's explicit allowance ("Do not need to display all labels
in Quick UI. But architecture must preserve them"). Every other extracted field
(distance, duration, occasion, place, people) is written as an ordinary draft value with
no separate storage of "this came from AI" beyond that one eventTime case — a full
per-field evidence ledger is the same PROTOTYPE-ONLY SEAM already recorded in the
canonical pass above (`PERSIST`: `draft` / `Moment.<prop>`, no ledger table exists here).

## MEAL UX
Quick unchanged (Occasion + "What did you have?"). More is now CONTEXT-FIRST: choosing a
context (e.g. "Home cooked") pre-opens exactly its own canonical fields (Preparation +
Ingredients) via the `MEAL_CONTEXT_PRIORITY` map — every other canonical Meal field
(experience, cost, notes) waits as a "+ Field" chip. The structured Foods & drinks editor
(13_MEAL_FIELDS) is now reached through its own "+ Foods & drinks" chip rather than
appearing automatically — a DELIBERATE EDITOR per the new presentation classification,
never inline in the linear flow.

## ACTIVITY UX
Quick now leads with the common four (Run/Walk/Gym/Cycling) + "More…", never the full
12-type wall (§39); choosing "More…" opens a focused type-picker sheet that collapses
back to "Activity · {Type} · Change" on selection. More-details is per-subtype adaptive
(unchanged data model from the canonical pass) but every field is now an ADDABLE "+
Field" chip instead of a pre-rendered empty box — Run shows "+ Pace + Elevation + Purpose
…", not eight empty inputs at once (§40's explicit target). Switching subtypes back and
forth still preserves every field already filled (§26, re-verified).

## HEALTH UX
Quick now shows Body area + a "Choose" control, never all 17 types persistently (§47);
the picker leads with the common six (Symptom/Injury/Appointment/Medication/Measurement/
Test) + "More…" for the full canonical list. The depth panel is explicitly labeled
"Private health details" — never "Advanced details" (§49's explicit instruction) — with
the §22/§48 shared-vs-private boundary stated as one clear summary sentence instead of
the earlier repeated explanatory boxes.

## PROBLEM UX
Unchanged data/creation model (§50/§80): the words themselves are the whole quick state;
Status=Open stays internal. More-details fields (impact, urgency, category, related
project, attempt, next action, notes) are now ADDABLE chips instead of a pre-rendered
matrix; no lifecycle concept (Solution/Verification/Outcome/Lessons) is ever offered at
creation, confirmed by an explicit negative test.

## PROJECT UX
Quick unchanged (title + goal, posts on title alone). More gained "Current focus" and
"Related problem" as new ADDABLE human-worded fields (23_PROJECT_FIELDS's "Current
focus" and a related-Problem reference in the person's own words) — Project still reads
as a human note, never a project-management tool, per §52's explicit instruction.

## MEETING UX
Unchanged (§53/§81, MEET-004): Subject + common People + When at quick level; More adds
Purpose/Duration/Related-to/Notes as ADDABLE chips; still zero mode list, zero workspace
vocabulary (Agenda/Transcript/Recording/Minutes/Attendance) anywhere in Social.

## EXIT / DRAFT RECOVERY
§55's explicit correction: the idle footer now carries exactly ONE control (Post) — the
redundant "X + Cancel" pairing is gone. An untouched composer's X closes immediately,
with no dialog for nothing. A meaningful draft's X opens a small recovery row: "Keep this
draft?" / **Keep draft** / **Discard** / **Continue editing** — the ambiguous "Back" label
from the canonical pass is retired (recorded supersession, `social-final.js` +
`social-4-4a-truth.js`). Nested pickers (the record chooser, media sources, My Media, the
organizer, People, Place, the Activity/Health type pickers) each carry their own Back
that returns to the composer, never closes it (§56, verified for the record chooser and
the media→My-Media chain).

## MOBILE
360×800 opens as a full-viewport sheet with POST always reachable; the record chooser
renders as ≥44px readable rows (not the old ≤36px quiet chips) — a deliberate UC-C3
reversal recorded as a supersession in `s6-motion.js`, because "easier than ordinary
social media" outranks density at this specific surface. No horizontal overflow at 360
across every new sheet.

## ACCESSIBILITY
Every new sheet is a labeled `role="group"` with a heading and a focus-managed Back
button (focus lands on Back on open, returns to the opener on close); the record chooser
and every picker use real `role="radio"`/`aria-pressed`/`aria-checked` semantics; the
organizer's reorder controls are real buttons (never drag-only, §65); selection is never
color-only (the chosen record pill carries an icon + bold weight + the colored
background together).

## LOCALIZATION
66 new `ucomposer.*` keys × 8 locales (**670 keys per catalog, key-complete**) for every
new UI surface: action words, the chooser's descriptions, media sources, My Media,
the organizer, People/Place picker strings, Smart Assist's menu and suggestion grammar,
the When control's collapsed states, and the new Project/addable-field labels. Verified
end-to-end in ne (Nepali): the entire opening state, the full seven-record chooser, and
the §18 time-precision chips all render with zero English leakage.

## CANONICAL FIELD CONTRACT COVERAGE
Every CURRENT field from `CANONICAL-COMPOSER-FIELD-CONTRACT.md` remains reachable — a
scripted grep-audit against `composer/domains.tsx` + `composer/submit.ts` confirmed every
canonical field key (`bodyArea`, `healthType`, `measureValue`/`measureUnit`,
`medication`, `privateNote`, `severity`, `foodItems`, `preparation`, `ingredients`,
`experience`, `cost`, `occasionCustom`, `activityType`, `distance`, `duration`, `pace`,
`elevation`, `exercises`, `matchKind`, `team`, `opponent`, `water`, `laps`, `stroke`,
`style`, `workedOn`, `topic`, `learned`, `transport`, `purpose`, `felt`, `intensity`,
`route`, `goal`, `story`, `chapter`, `milestone`, `feeling`, `urgency`, `attempt`,
`nextAction`, `category`, `relatedProject`, `target`, `focus`, `relatedProblem`,
`subject`, `online`) is still wired. The new "UC-C3 presentation classification" section
added to `CANONICAL-COMPOSER-FIELD-CONTRACT.md` records HOW each reaches the screen
(AUTO/INLINE/CONTEXTUAL/ADDABLE/PICKER/DELIBERATE EDITOR) without changing any field's
canonical TIER, REQ, or STATUS.

## TEST RESULTS
- **`social-composer.js`** — rewritten to the §71–§84 required-test matrix: **112/112**.
- **`social-composer-canonical.js`** — re-pointed wiring, every stored truth unchanged:
  **62/62**.
- **`social-4-4a-truth.js`** — re-pointed (new `udetails`/`ukind`/`upeople`/`umedia`/
  `uwhen` helpers; A11/A12/A9/A10 truths re-verified through the new pickers/sheets):
  **125/125**.
- **`s6-motion.js`** — re-pointed with two recorded supersessions (action words are
  capitalized human language, not lowercase quiet-chip text; record rows are ≥44px
  readable rows in a focused sheet, not ≤36px quiet chips): **55/55**.
- **`s3-moments.js`** — re-pointed (`[data-sb-when-value]`, `[data-sb-kind-label]`):
  **17/17**.
- Full fleet re-verified green with unchanged counts: `social-final` 194 (composer §10/
  §14 rewired: chooser sheet, My Media sourcing, the Keep-this-draft? recovery ask, the
  Meal/Activity/Health/Project/Meeting quick shapes) · `social-shell` 68 ·
  `s3-s4-loops` 14 · `final-app` 31 · `circle` 132 · `complete-my-world` 62 ·
  `s7-device-mastery` 56 · `i18n` 45 · `s2-person-world` 47 · `person-life-identity` 47 ·
  `one-application` 40 · `my-world-2030` 27 · `social-connection-final` 45 ·
  `social-2030` 31 · `social-2030-final` 35 · `locale-resolution` 21 · `s4-people` 20 ·
  `s5-discovery` 48 · `social-s1-trust` 24 · `social-s2-respond` 29 ·
  `social-s3-people` 14 · `social-s4-signal` 13 · `social-s5-moment` 15 ·
  `social-s6-safety` 8 · `social-s7-polish` 8 · `social-4-4a1-p06` 599 ·
  `social-r2-expression` 43 · `social-r3-3d-expression` 80 ·
  `social-r3-1-living-expression` 69 · `social-r3-2-signature-expression` 92 ·
  `social-r3-3-human-pulse` 102 · `social-r3-5-emotion-core` 20 ·
  `social-r3-6-premium-expressions` 21 · `social-r3-7-gravity-expressions` 37 ·
  `social-r3-8-emotion-horizon` 34 · `social-r3-9-signature-emotion-engine` 31 ·
  `social-devanagari-crops` (0 page errors) · `celestial-s0` 64 ·
  `celestial-s2-field` 40 · `celestial-s3-s6` 32 · `celestial-s7-constellation` 114 ·
  `gate-desktop`/`gate-mobile`/`gate-fallback` PASS · `identity-model` 13.
  `tsc --noEmit` 0 · `eslint` 0 errors · `next build` passes.

## PROTOTYPE LIMITATIONS
- **§57 upload failure/retry**: this environment has no network upload transport (a
  device file becomes a local object URL synchronously) — a true "8 ready, 1 needs
  attention, Retry" flow would have nothing real to retry against. What is real and
  built: a file that fails to DECODE degrades to the same quiet labeled placeholder used
  throughout the product (`Media.tsx`'s `SafeImg`), and the asset stays selected rather
  than silently vanishing.
- **§28/§70 capability tiers**: the flag registry is real and typed; the ENHANCED/
  PREMIUM capabilities it names (caption assist, media/OCR understanding, event
  grouping, deeper domain assist) are NOT implemented — no model or vision pipeline
  exists in this repository, honestly stated rather than stubbed to look functional.
- **AI provenance ledger**: full per-field/per-suggestion evidence tracking is a
  documented live seam (one `EventTime.provenance: "ai"` value exists; a general ledger
  does not) — unchanged from the canonical pass's own PROTOTYPE-ONLY SEAMS.
- Real device Camera/Upload write to `URL.createObjectURL` (session-scoped, cleared on
  reload) rather than durable server storage — the honest boundary already recorded for
  the mock LIBRARY throughout this project.

## FUTURE / PREMIUM AI SEAMS
`assistCan()` is the single point the live system flips on ENHANCED (caption assist,
media understanding, OCR, event grouping) or PREMIUM/FUTURE (deep domain-specific
assist) capabilities per plan entitlement — no composer redesign required when that
infrastructure lands, matching this project's existing `src/lib/entitlements/`
architecture from the S8 monetization-foundation pass.

## OWNER DECISIONS REQUIRED
None new.

## TRUE BLOCKERS
None for the prototype. The interaction-layer redesign is complete against every
required test in the UC-C3 brief; remaining gaps are the same class of honestly-stated,
infrastructure-dependent seams already recorded throughout this project's handover
documents.
