# PHASE 4.4 — IMPLEMENTATION PLAN (§53–§54, §75)

## Why the order differs from the brief's A–G

The brief's shape runs Moment → People → Chat/Notifications → Place/Life → Composer → Safety →
mastering. The evidence suggests a different path.

- **Truth before connection.** Three defects make today's Social untrustworthy: Edit corrupts time,
  Discard publishes, and View as public lies. The phone thread is also dead. None of these needs a
  product decision, so they go first (4.4-A).
- **Privacy rules before new doorways.** Every new doorway (permalink, Place, Person World, a
  notification landing) would multiply the life-position inference and the `friends` leak.
  So D-1, D-2 and D-4 land in 4.4-B, before 4.4-D opens those doorways.
- **Relationships become two-sided before notifications exist.** Notifications to "the other
  party" can't be built on a one-perspective graph (4.4-C before 4.4-E).
- **Celestial waits.** It is flag-off on the product route. Its fixes also touch files that hold
  the owner's uncommitted Light-mode pass, so it goes in its own slice (4.4-G), after D-3, D-5 and
  D-6.

## Rules for every slice

- `expressions.tsx` stays byte-identical. Verify `AGENTS.md` too, unless the slice adds its
  exception rows: then it changes by those rows only.
- Every edit under `src/components/style-lab/social/**` is recorded as an `AGENTS.md` exception row,
  with a covering test.
- Any accepted-suite assertion that changes is recorded as a supersession that strengthens its
  invariant.
- English stays byte-identical wherever accepted selectors match text.
- Every accepted suite runs green before the slice closes. The chain is the ~31 suites listed in
  `AGENTS.md`, plus the Devanagari crops.
- Also before closing: `tsc` and eslint on `src`, `next build`, and the two 4.3 audit scripts
  re-run with verdicts updated.
- No commit, push or deploy unless the owner asks.

---

## NEXT 3 IMPLEMENTATION SLICES

### Slice 4.4-A — Moment + Respond TRUTH

**Complexity:** MEDIUM · **Owner decisions:** none (D-19 is optional polish)

**Goal.** A Moment can be recorded, edited, discarded and discussed without the product lying or
losing data, on every device. The owner's View as public renders everything through the public
stand-in: no exact age, and no only-me Moment.

*Part 2 of P0-3 (friends-only and author filtering) follows D-2 and D-4 in 4.4-B.*

**Scope.** Safe fixes A1–A26 in [SAFE-FIXES-NO-DECISION.md](SAFE-FIXES-NO-DECISION.md). Must-haves:

- **A1 — View as public, part 1 (P0-3).** The stream, conversation, menus and Life Cursor render
  through `PUBLIC_VIEWER`, and the owner's only-me Moments are dropped while previewing.
- **A2–A4 — Composer truth (P0-4).**
  - Edit keeps `at` and `atPrecision`, or moves to day precision + `sharedAt`.
  - Edit keeps existing media.
  - Discard during Posting cancels, and the body is inert while posting.
- **A5–A8 — phone conversation (P0-5, RS-02, RS-18, RS-16).**
  - Reply works.
  - Respond focuses the composer.
  - The Person card sits above the thread.
  - Focus returns to the opener; Escape closes the top layer only; the scrim does not scroll the
    page; a sent response is revealed.
- **A9–A13 — Composer data hygiene.** Kind fields scoped; one media type; pre-birth refusal; no
  raw-name ids and no `PEOPLE.m` fallback; the meeting names its people once.
- **A15–A18 — response truth.** A date when not today; the fixture clock fixed; line breaks kept;
  IME guard; "Write a response" at zero focuses the composer.
- **A19–A26 — honesty and accessibility.** Copy link confirms only on success; menu focus and
  roving; focus after Hide/Delete; 44px phone targets; a decorative author ring; inert grid
  tiles; Moment-chrome i18n; fixture truth; failure live regions.

**Files likely touched.**
- `social/Composer.tsx`, `DateField.tsx`, `Moment.tsx`, `Media.tsx`, `store.tsx`, `data.ts`
  (fixtures only), `SocialPreview.tsx`, `LifeCursor.tsx`
- `world/PersonCard.tsx`
- the 8 catalogs (new keys: edit-close confirm, "(you)", more/less, tooltips, "Show fewer",
  "Life instruments")

**Data contracts.**
- No schema change.
- The Edit rule: "never invent a clock time; a date change drops to day precision and stamps
  `sharedAt`".
- The Response time grammar: `HH:MM` today, `DD MON YYYY · HH:MM` otherwise.
- Record both in `social-api-contract.md` §D.

**Components.** `Composer`, `MomentEntry` / `NoteRow` / `NoteComposer` / `MomentConversation`,
`Popover`, `Media`, `PersonCard` layer.

**Tests.** A new suite, `prototype-tests/social-4-4a-truth.js`:
- **Edit and Discard:**
  - edit a minute-precision Moment → its time is unchanged;
  - move its date → day precision, and no clock is shown;
  - edit a link Moment → its title is kept;
  - Discard inside the posting window → nothing is posted.
- **View as public (part 1):**
  - no exact age and no only-me Moment in the stream while previewing;
  - every readout and ring resolves through the stand-in viewer.
  - (The "matches a genuine visitor exactly" check lands in 4.4-B, with D-2 and D-4.)
- **Phone thread (390 and 360, 40 responses):**
  - Reply opens a reply composer and posts under its parent;
  - Respond → `activeElement` is the textarea;
  - an author opens a visible Person card (hit-test);
  - Escape layering works;
  - focus returns to the opener.
- **Other:** a pre-birth date is refused; no "with M"; response dates render.
- **Re-run:** `social-audit-4-3-verify.cjs`. V1–V4 must flip. K "flag off" must stay green.

**Privacy risks.**
- The View-as-public stand-in must never reach the network or storage. It is a render-time viewer
  only.
- Localised tooltips must keep band-only text for other people.

**Dependencies.** None.

**Definition of done.**
- P0-3 part 1, P0-4 and P0-5 are closed and runtime-verified.
- RS-02, RS-18 and RS-23 are closed.
- The new suite is green; all accepted suites are green.
- `AGENTS.md` rows are recorded for each frozen file touched.
- 4.3 verdicts A, C and V1–V4 are updated.

---

### Slice 4.4-B — LIFE-PRIVACY + AUDIENCE RULES

**Complexity:** MEDIUM · **Owner decisions:** **D-1, D-2, D-4 (required)**, D-8 (optional, same slice)

**Goal.** No Social surface lets anyone derive another person's birth-date precision, and
visibility means what it says: `friends` Moments reach only "your people", and a World shows the
right person's Moments.

**Scope.** Recommended defaults shown; each follows the owner's choice.

- **P0-1 (D-1 (c)).** Other people's Moments carry no life-position text: readout, Search Moment
  rows, phone thread header, Life Cursor. Author, response and "with" rings use the **current**
  band. Visitor rings have no density. Owner Moments are unchanged (exact age).
- **P0-2 (D-2 (a)+(i)).** `friends` Moments are visible only to friend or family.
  - Enforced in one place: a `canSee(viewer, moment, relationshipOf)` rule in `view-model.ts`.
  - Consumed by `orderFeed`, Search (Moments, Photos, Places tallies), the notification target
    lookup and `reveal`.
- **D-4.**
  - The owner stream holds own Moments plus connected people's visible Moments.
  - A visitor on another World sees that person's Moments only.
  - View as public (fixed in 4.4-A) follows the same rule.
- **P0-3 part 2.** While previewing, View as public applies the same `canSee` rule with the
  public stand-in: friends-only Moments disappear; on a visitor route only the subject's Moments
  remain. The test compares the preview's stream with a genuine stranger's, byte for byte.
- **D-8, if decided.** Gate responses on `quiet`, or correct the doc.

**Files likely touched.** `social/view-model.ts` (the one rule), `store.tsx` (`orderFeed`),
`Moment.tsx`, `Chrome.tsx` (search), `LifeCursor.tsx`, `identity/PersonIdentity.tsx`,
`world/PersonCard.tsx`, `ProfileHero.tsx` (visitor density), `world/WorldProvider.tsx` (expose
`relationshipOf` to the rule).

**Data contracts.**
- `social-api-contract.md` §D:106: `lifeAtMoment` becomes owner-only; non-owners get none.
- `PersonRef` carries the current band only.
- The audience rule is written once in `docs/handover` (`friends` = friend ∪ family, enforced
  server-side for feed, search, notifications and permalinks).
- Update `circle-of-life.md` §6 and `person-life-identity.md` §4/§10 to match.

**Components.** `momentLifeFor` / `ringViewFor` / the new `canSee` in the view model, the Moment
readout, `SearchField` results, `LifeCursor`, `PersonIdentity`.

**Tests.** A new suite, `prototype-tests/social-4-4b-privacy.js`. It sweeps every surface for every
viewer (Maya, Bikash, Asha, a stranger):
- **The bracket test:** for every non-owner author, no two rendered values anywhere allow
  bounding their birth date more tightly than their current band.
- **Density:** no visitor ring carries density.
- **`friends` Moments** (Prakash's, Bikash's): absent for a non-connected viewer across the feed,
  Search, Photos, Places tallies and notification landing; present for friend and family.
- **Visitor World:** holds the subject's Moments only.

**Supersessions** to record, where accepted assertions change:
- `person-life-identity.js` §6 (visitor density);
- `circle.js` visitor checks, if any assert the band readout on others' Moments.

**Privacy risks.** This slice *is* the privacy slice. Watch for:
- the ring's `at` parameter left on the Moment date;
- the Life Cursor on other people's historical years;
- a Search Moment row that still prints the band.

**Dependencies.** 4.4-A (View as public must use the same rule). Owner decisions D-1, D-2, D-4.

**Definition of done.**
- P0-1, P0-2 and P0-3 part 2 are closed.
- The bracket test passes for all fixture people.
- Docs are updated.
- 4.3 verdict J reads SAFE (direct + inference).

---

### Slice 4.4-C — RELATIONSHIP, CHAT + NOTIFICATION TRUTH

**Complexity:** MEDIUM · **Owner decisions:** D-18 (wording, Family Remove, conversation after Remove), with recommended defaults. D-1, D-2 and D-4 are inherited through 4.4-B.

**Goal.** Relationships are two-sided and every surface agrees. Chat reaches only the people it
should. Notifications never say anything untrue. The people found around a Moment are doorways.

**Scope.** Safe fixes C1–C20.
- **C1 — viewer-relative relationships.** Store requester/addressee, or key by pair. Supersede
  `social-connection-final.js:184-191`.
- **C2** — Hero Message opens a chat with the World's person.
- **C3** — request notifications record their outcome and read-sync everywhere.
- **C4–C5** — the Chat guard (connected people or an existing conversation; never yourself) and a
  failed send that keeps the text.
- **C6** — doorways: Celestial who-resonated → Person; Chat header → Person.
- **C7, C8** — Search's own row; honest notification landing.
- **C9–C12** — Life link bounds, deep-link query survival, the visitor Circle link, derived Places.
- **C13–C20** — people-row relationship word, Remove confirm, shared breakpoint, Chat frame, the
  Celestial notification path made honest, Chat/notification i18n, IdentityGate avatar, visitor
  counter heading.
- **With D-18 defaults:** one wording per state (en string supersession recorded); Family has no
  Remove on PersonCard; a conversation becomes read-only after Remove or Decline.

**Files likely touched.**
- `world/model.ts`, `world/WorldProvider.tsx`, `world/People.tsx`, `world/PersonCard.tsx`,
  `world/Messages.tsx`, `world/ChatSurface.tsx`
- `social/Chrome.tsx`, `social/ProfileHero.tsx`, `social/SocialPreview.tsx`, `social/store.tsx`
- `circle/model.ts`, `circle/DayAlmanac.tsx`, `circle/CircleView.tsx`
- `shell/intent.ts`, `shell/PersonalDestination.tsx`, `shell/CosmosRoot.tsx`
- `identity/IdentityGate.tsx`, `app/social/page.tsx`
- `celestial/ResonateControl.tsx` (C6, C17 — **only after the Light pass is resolved**, or split
  C6 and C17 out to 4.4-G)
- the catalogs

**Data contracts** — new, in `docs/handover/`:
- **Relationship:** `{ viewerId, subjectId, state, requestedBy?, since }`.
- **Request transitions:** add, cancel, accept, decline, remove; who may perform each.
- **Messaging permission:** connected, or an existing conversation → read-only after Remove.
- **Notification outcome field** on `kind:"request"`.
- This is the first draft of the relationship section `social-api-contract.md` lacks (PF-02).

**Components.**
- relationship store and selectors: `relationshipOf(viewer, subject)`, `canMessage`
- `PeopleButton` / `PeoplePanel`, `PersonCard`, `ProfileHero` relationship row
- `NotificationsPanel` request row, `MessagesPanel` / `MiniChat` / `ChatSurface`
- the `ResonanceSummary` who rows
- `CircleView` / `DayAlmanac`, `PersonalDestination`

**Tests.** A new suite, `prototype-tests/social-4-4c-connection.js`:
- **Directionality:** the requester sees Requested + Cancel and never Accept; the addressee sees
  Accept.
- **Consistency:** as Bikash, Hero, PersonCard, People and Search agree.
- **Chat:** `/chat?c=p-ramesh` (none), `?c=u-demo-001` (self) and an unknown id are all refused
  honestly.
- **Notifications:** accept in People → the request notification is read and its outcome is
  "Now friends"; Accept → Remove never shows "Declined".
- **Doorways:** resonator row → Person card; Chat header → Person card.
- **Life links:** `/life?c=day:1983-02-06` for Maya → the Life level plus the refusal sentence;
  a future day has no "Record".
- **Deep links:** a signed-out `/life?c=…` survives identity.

**Privacy risks.**
- Two-sided relationships must not leak "who asked whom" to third parties.
- Opening a Person card from a who-list must stay band-only.

**Dependencies.** 4.4-B, because the audience rule consumes `relationshipOf`. D-18 defaults.

**Definition of done.**
- PF-03, ID-02, ID-03, CN-02, CN-03, CN-23 and PL-08 are closed.
- The new suite is green, with supersessions recorded.
- 4.3 verdicts F and H are updated.

---

## Later slices (after owner review of the first three)

Each later slice carries the §54 fields. They stay brief until the owner has reviewed 4.4-A to 4.4-C.

### 4.4-D — Moment connective tissue

**Complexity:** MEDIUM · **Decisions:** D-12, D-15, D-16, D-18 (World route), D-32

- **Goal.** A Moment has an address and leads outward:
  - View in Life (own Moments);
  - a permalink;
  - Place → Moments here;
  - Person card → that person's World;
  - Life → back to My World.
- **Files.**
  - `social/Moment.tsx` (View in Life link, Place button, Copy link)
  - `store.tsx`, a new `app/world` query handling (`?m=`, `?p=`)
  - `SocialPreview.tsx` (a visitor route that is no longer harness-only)
  - `world/PersonCard.tsx`, `shell/WorldShell.tsx` (Life return)
  - `Chrome.tsx` (Place narrowing entry)
- **Data contracts.**
  - Permalink resolution through `canSee` (4.4-B). Never reveals only-me, unauthorised
    `friends`, hidden or deleted Moments.
  - Visitor World route: the subject's Moments only.
  - Place: text now, structured later.
- **Components.** `MomentEntry` foot and readout, `PersonCard` actions, the `WorldShell` return,
  the `SearchField` place entry.
- **Tests.** A new `social-4-4d-seams.js`:
  - own View in Life lands on `/life?c=day:<date>`;
  - a visitor has no View in Life;
  - a permalink as owner, friend and stranger each gets the right result (only-me and friends
    refused);
  - a logged-out permalink → sign-in wall;
  - Place → narrowed Search;
  - Person card → World: band-only, subject's Moments only.
- **Privacy risks.** Permalinks are the widest new surface. Every lookup goes through `canSee`, and
  no Life precision travels in the URL.
- **Dependencies.** 4.4-B, 4.4-C.
- **Definition of done.**
  - MC-24, PL-01, PL-04, PF-04 and PL-15 closed.
  - 4.3 verdicts E and G read YES.

### 4.4-E — Notifications as human events

**Complexity:** MEDIUM · **Decisions:** D-13, D-24

- **Goal.** The human events that matter produce a truthful, quiet signal that lands exactly where
  it happened.
- **Files.** `social/store.tsx` (prototype producers, labelled prototype), `data.ts` (the
  Notification type: `kind`, `subjectType`, `noteId`, audience), `Chrome.tsx`
  (`NotificationsPanel` rows, grouping, landing), `focus-moment.ts`, the catalogs.
- **Data contracts.** A Notification kind + payload section in `docs/handover`:
  - kinds: response, reply, inclusion, request/accepted, quiet Boom/Resonance;
  - a people-first per-Moment grouping key;
  - `privacySafePreview`;
  - a server-side audience check.
  - The prototype producers are reducer-local and never presented as live.
- **Components.** `NotificationsPanel` rows, the grouped row, the landing (opens the conversation
  at the response).
- **Tests.** A new `social-4-4e-signal.js`:
  - a response → one row;
  - five responders → one grouped row naming only visible people;
  - Boom/Resonance quiet (no dot);
  - landing opens the thread at that response;
  - a gone target reads "no longer available";
  - nothing counts engagement.
- **Privacy risks.** Grouping could name people the recipient may not see; notification text must
  carry no Life fields.
- **Dependencies.** 4.4-B, 4.4-C, 4.4-D (landing via permalink).
- **Definition of done.** CN-04 to CN-13 and RS-21 closed; 4.3 verdict I reads YES (prototype).

### 4.4-F — Safety foundation

**Complexity:** MEDIUM · **Decisions:** D-9, D-10, D-14, D-27

- **Goal.** A person can protect themselves and their memories.
- **Files.** `social/Moment.tsx` (response menu for the Moment's owner, Report flow, delete
  placeholder, undo), `store.tsx`, `world/PersonCard.tsx` (Block, Report person),
  `world/Messages.tsx` (Report message), `world/WorldProvider.tsx` (blocked set), the catalogs.
- **Data contracts.**
  - Report `{ targetType, targetId, reason, at }` → review queue; hidden for the reporter.
  - Block: two-way, per person.
  - Owner hide `{ responseId, hiddenBy }`.
  - A response tombstone.
  - A "responses off" flag.
- **Components.** The response ⋯ menu, a Report sheet, Block in the Person card, a tombstone row,
  the undo toast.
- **Tests.** A new `social-4-4f-safety.js`:
  - the owner hides a visitor's response → gone for everyone, and its author sees "hidden by";
  - delete with replies → a placeholder, and the replies stay;
  - Block → the person's Moments, responses and messages disappear both ways;
  - Report → recorded and hidden for the reporter;
  - the toast is true.
- **Privacy risks.** A block must not reveal itself to the blocked person beyond absence; reports
  are never visible to their target.
- **Dependencies.** 4.4-C (the two-sided graph).
- **Definition of done.** RS-09, XC-07, XC-08 and ID-09 closed.

### 4.4-G — Celestial coexistence

**Complexity:** MEDIUM · **Decisions:** D-3, D-5, D-6, D-7, D-21, D-26, D-28 · *starts after the uncommitted Light pass is resolved*

- **Goal.** Respond, Boom and Resonate read as three distinct verbs on every device, and Celestial
  can be enabled on `/world`.
- **Files.** `celestial/ResonateControl.tsx`, `CelestialField.tsx`, `CelestialEnvironment.tsx`;
  `social/Moment.tsx` (presence cue, explainer mount); the `expressions.tsx` guard only if D-26 is
  approved; `AGENTS.md` rows (D-28); `docs/handover/celestial-resonance-contract.md`.
- **Data contracts.** Unchanged (`22-DATA-CONTRACT.md`). A presence-line count rule per D-6.
- **Components.** The Resonate doorway (phone glyph), `ResonanceSummary` (≤3 seals in the feed,
  stage cap), the Field (Remove, dismissal), the first-use explainer.
- **Tests.**
  - An extended `celestial-s7-constellation.js`.
  - A new `social-4-4g-verbs.js`:
    - ⋯ inside the column at 320/360/390 with the flag on;
    - Respond visually primary (a computed-weight check);
    - both presence summaries carry a system cue;
    - the explainer shows once;
    - only one picker open at a time.
- **Privacy risks.** Who-list name visibility (D-26).
- **Dependencies.** D-3, D-21 and the Light-pass outcome.
- **Definition of done.** RX-01, RX-02, RX-07, RX-08, RX-10, RX-11, RX-13, RX-15 and RX-16 closed;
  the flag decision is applied.

### 4.4-H — Composer + media ownership

**Complexity:** LARGE · **Decisions:** D-11, D-20, D-22, D-30

- **Goal.** A Moment can say who was there, with consent, and its media behaves like memory.
- **Files.** `social/Composer.tsx`, `data.ts` (the additive `present` field), `Moment.tsx`,
  `Media.tsx` (lightbox, playback), the catalogs.
- **Data contracts.**
  - `present?: PresentRef[]` with states and self-removal.
  - Alt text on upload.
  - A single-type media contract (unless D-20 extends it).
  - An upload pipeline (`width`/`height`/`takenAt`/`takenPlace`).
- **Components.** A people-present picker (identity chips, labels), a self-removal control, the
  lightbox, the video player, an alt field.
- **Tests.** A new `social-4-4h-memory.js`:
  - named people resolve to chips, and unknown names become labels, never guessed;
  - a named person can remove themselves;
  - the inclusion notification is sent;
  - lightbox keyboard and swipe;
  - video tap-to-play, never autoplay;
  - alt required.
- **Privacy risks.** Tagging consent. `present` must respect the Moment's privacy and never raise
  Life precision.
- **Dependencies.** 4.4-B, 4.4-E.
- **Definition of done.** CO-12 to CO-15, MC-10, MC-11 and MC-13 closed.

### 4.4-I — Mastering

**Complexity:** MEDIUM · **Decisions:** D-23 (optional), D-19

- **Goal.** Every surface is consistent, accessible, localised and light on phones.
- **Files.** Z-series files, the catalogs, `docs/handover/*` (stale docs), `translation-status.md`.
- **Data contracts.** None.
- **Components.**
  - The no-Moments empty state
  - Feed and pagination loading/error seams
  - Menus (roving), dialogs (traps)
  - The Search combobox
- **Tests.**
  - A contrast audit (dark, light, and Celestial light).
  - A focus-order walk of the Moment, the thread, the Person card and Search.
  - An i18n sweep with no English outside the recorded carryovers, in all 8 locales.
  - Final captures at 320/360/390 and desktop, in dark and light.
- **Privacy risks.** Localised tooltips must stay band-only.
- **Dependencies.** All of the above.
- **Definition of done.** XC-12 to XC-22 closed; the 4.3 scorecard re-run shows no BROKEN.
