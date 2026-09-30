# SOCIAL BIBLE AUDIT — DECISION EVIDENCE

**Phase 0 · evidence audit · 2026-09-16 · read-only.**
What is actually decided, what is merely described, and what is neither.

This document exists so the Bible can inherit *decisions with citations* rather than prose.
Each entry names the decision, the evidence that it was made, the code that implements it, and its
maturity class. **FROZEN is used only where repository documentation or a recorded owner
acceptance explicitly supports it.** Where documents conflict, the class is
**UNKNOWN / NEEDS OWNER REVIEW** — never a guess.

## Maturity classes

| Class | Meaning in this document |
|---|---|
| **FROZEN** | AGENTS.md names it inside an explicit *frozen* zone, or records an owner acceptance that froze it. Changing it requires a recorded, authorised exception. |
| **ACCEPTED** | Built, tested, evidenced and recorded as verified-green in AGENTS.md — but not declared frozen. |
| **OPEN** | Built or partly built, with a stated unresolved question, blocker or carryover. |
| **FUTURE** | Documented as intent only. Not stubbed, not hinted at in the UI. |
| **UNKNOWN / NEEDS OWNER REVIEW** | Two sources of record disagree, or the code and the accepted contract disagree. |

---

## 1. The product definition

| # | Decision | Evidence of the decision | Implementation | Class |
|---|---|---|---|---|
| D-1 | **SYSTEMBOOM is one product**, not a suite. COSMOS (`/`) is the universal Home; **MY WORLD** (`/world`) is the personal Home after identity; its stream is **MOMENTS**; **LIFE** (`/life`) is the Circle of Life inside it. | AGENTS.md "Phase 4 Social + MY WORLD PRODUCT — FINAL, ACCEPTED AND FROZEN"; `docs/design/systemboom-application-architecture.md`; `docs/design/systemboom-navigation-final.md` | `shell/destinations.ts:37–45`; `app/{page,world,life,chat}/page.tsx` | **FROZEN** |
| D-2 | **"Social" is capability vocabulary, never a user-facing label.** `/social` survives only as a compatibility redirect. | `destinations.ts:16–18`; `app/social/page.tsx:3–7`; AGENTS.md final My World pass | `redirect("/world")` — verified, shot 47 | **FROZEN** |
| D-3 | **Earth is a state inside Cosmos, never a route and never a signed-in navigation item.** | `destinations.ts:10–14`, `EARTH_INTENT = "/?to=earth"`; `systemboom-navigation-map.md` ("Never invent `/earth`") | one effect in `cosmos/CosmosExperience.tsx` (recorded exception); `/earth` asserted absent by `one-application.js` | **FROZEN** |
| D-4 | **There is no destination menu anywhere.** Global navigation is the Brand alone: the mark goes Home, one word states the context. | `systemboom-navigation-final.md:26, 102`; `systemboom-navigation-map.md:43–52` | `shell/Brand.tsx` — a `Link` + one `data-sb-context` span; nothing opens | **FROZEN** — but four documents still show a nav row (**C-6**) |
| D-5 | **Ancestors** exist only in the architecture; they appear nowhere until implemented — and are **not** in `destinations.ts`. | `systemboom-navigation-map.md` ("NOT BUILT"); `destinations.ts:11–14` | absent | **FUTURE** |
| D-6 | **Never link to a destination that does not exist**; add it to `destinations.ts` as `later` instead. | AGENTS.md Rules; `systemboom-navigation-map.md:5–6` | `byId()` **throws** on an unknown id (`destinations.ts:47–51`) | **FROZEN** |

## 2. Identity

| # | Decision | Evidence | Implementation | Class |
|---|---|---|---|---|
| D-7 | **A SYSTEMBOOM person is a real photo surrounded by their Life Ring** — never a generic avatar. One component; **no second avatar system**. | AGENTS.md "Person + Life Identity (accepted 2026-09-12)"; `docs/handover/person-life-identity.md:18–21` | `identity/PersonIdentity.tsx` — 18 call sites, all of them | **ACCEPTED** |
| D-8 | **Fallback hierarchy: real photo → initials.** There is no illustrated/curated-avatar middle tier. A failed photo degrades to initials, never a broken-image icon. | `person-life-identity.md:31–37`; AGENTS.md records this as superseding `SYSTEMBOOM-HANDOFF-BRIEF.md` D5 | `LifeRing.tsx:225–237` `RingAvatar` with `onError` → `data-sb-identity-initials` | **ACCEPTED** |
| D-9 | **Relationship, presence and verification are never ring geometry.** They render beside it. | `person-life-identity.md:75–76`; `PersonIdentity.tsx:16–19` | `data-sb-ring` is only ever `"own"` or `"other"` — asserted by `person-life-identity.js`, `s4-people.js`, `social-connection-final.js` | **ACCEPTED** |
| D-10 | **Story rings, online/presence rings, verification rings and friendship rings are forbidden.** | `person-life-identity.md` §11 | none exist (grep) | **FROZEN** (anti-pattern) |
| D-11 | The owner has a real **View as public** action that renders through the exact visitor-safe model — a technical stand-in viewer, **never a second privacy branch**. | AGENTS.md Social Freeze Delta blocker #1; `person-life-identity.md` §9 | `SocialPreview.tsx:37–44` `PUBLIC_VIEWER`; `data-sb-view-as-public`; byte-compared against a real visitor by `person-life-identity.js` §11 | **ACCEPTED** |

## 3. Life and privacy

| # | Decision | Evidence | Implementation | Class |
|---|---|---|---|---|
| D-12 | **The Circle is ten 15-year bands = 150 years from birth**, birth at 12 o'clock, clockwise. (Phase 0's eight was a wrong number; the fix to ten is an authorised, recorded exception.) | AGENTS.md authorised exception 2026-09-10; `docs/design/circle-of-life.md` §2; `social-feature-parity.md:109` | `lib/life-time.ts:63–80` `CIRCLE_BANDS` (10) + `CIRCLE_YEARS = 150` | **FROZEN** |
| D-13 | **Privacy is a data contract, not a display rule.** Birth-derivable fields are **absent** from a non-owner's payload, not hidden. | `view-model.ts:1–15`; `social-visual-spec.md` §10 ("hiding a value with CSS … is a defect, not a fix"); `social-api-contract.md` §C | `view-model.ts` — the OWNER/OTHER union; `FORBIDDEN_ON_OTHER` asserted via `__SB_VM_OTHER_KEYS` | **FROZEN** |
| D-14 | **A non-owner receives the 15-year band and nothing else.** No birth date, birth time, exact age, day count, fraction, present tick or band calendar years. | as D-13 | `lifeViewFor:88`; `ringViewFor:161`; `LifeRing.tsx:65, 198` | **FROZEN** |
| D-15 | **There is no "friends may see exact age" tier.** Friendship never raises life precision. | `social-api-contract.md:82`; `people-chat-integration.md` §3 | asserted by `complete-my-world.js`, `s4-people.js` | **FROZEN** |
| D-16 | **Aggregation privacy:** counts of another person's dated Moments per age band would narrow their birth date, so density is restricted. Only-me and Health/Problem content is **never** included, and the restriction is applied to the aggregation **set**, never by filtering after counting. | AGENTS.md Phase 5 §23 + Social Freeze Delta blocker #2; `circle-of-life-spec.md` §4 | `ringViewFor:162–171` | **ACCEPTED** |
| D-17 | **Whether a `friends`-privacy Moment is gated by the friend/family relationship is UNVERIFIED** and must not be assumed. `connected` is threaded to every call site but unused in the filter. | AGENTS.md Social Freeze Delta blocker #2; `view-model.ts:138–150` ("FRIENDS PRIVACY BACKEND CONTRACT — VERIFY DURING LIVE PORT") | public-only filter at `:169` | **OPEN** — and see **C-14**: the feed and search do *not* apply the same caution |
| D-18 | **Birth truth: never manufacture a time.** An unknown time is dropped, not defaulted; a malformed time degrades to unknown; day precision anchors at local midnight, which "must never be displayed". | `SYSTEMBOOM-HANDOFF-BRIEF.md` §3 (D-decisions, "all still in force"); `lib/identity/birth.ts:1–10, 74–78` | `normalizeBirth`, `birthInstant`; asserted at the serialized-JSON level by `identity-model.js` | **FROZEN** |
| D-19 | **The honesty rule:** an unknown birth time stops the Life instrument at **days**. | `social/life.ts:62–65`; `social-content-rules.md` | `availableUnits()`; asserted by `social-final.js` §3 | **FROZEN** |
| D-20 | **There is no milliseconds face.** The cycle ends at seconds. | `social-visual-spec.md:219`; five other documents; `social-reference-index.md:95` ("DO NOT IMPLEMENT") | `life.ts:59` — 7 units | **FROZEN** — contradicted only by `SYSTEMBOOM-HANDOFF-BRIEF.md:192` (**C-9**) |
| D-21 | **Temporal honesty:** a Moment recorded for a past date has DATE precision; noon is an internal sort anchor, **never displayed**. Posting time is provenance (`sharedAt`), never the event time. | AGENTS.md Phase 5 §6 exception; `circle-of-life.md` §8; `social-api-contract.md:91, 119–121` | `Composer.tsx:216–241`; `Moment.tsx:211`; `data.ts:66–94` | **ACCEPTED** — with a defect at the **edit** path (§8, E-2) |
| D-22 | **The ledger is chronology:** the feed orders by the Moment's OWN date/time, never by posting time. One date rule per calendar day. | `social-interaction-spec.md` §8; `store.tsx:104–107` | `orderFeed` keys on `m.at` | **ACCEPTED** — a stale comment at `data.ts:304` says otherwise (**C-16**) |

## 4. Moments and the Composer

| # | Decision | Evidence | Implementation | Class |
|---|---|---|---|---|
| D-23 | **Seven composer entry buttons; eight content classifications** — Photo and Video are merged into one media button. | `social-feature-parity.md` Reconciliation A (evidence-based) | `Kind` = 7 values (`data.ts:25`); `KINDS` = 7 chips where the first is the media button (`Composer.tsx:45–53`) | **ACCEPTED** |
| D-24 | **Health and Problem are private records, not performances**: quieter treatment, inset media, the visibility word, no Respond, no Expression control, no Human Pulse, and they default to Only me. | AGENTS.md; `moment-conversation-model.md` §7; `Moment.tsx:8` | `QUIET_KINDS` at `Moment.tsx:26`; gates at `:292, :303, :366`; default at `Composer.tsx:186–198` | **ACCEPTED** — but the contract says "no conversation" and the code allows one (**C-15**) |
| D-25 | **Body order is memory-first** (owner-directed, S5/S6): words → the coordinate sentence → feeling + counter → kind chips → kind fields → media. | AGENTS.md S5/S6 "Owner-superseded documentation"; `composer-states.md:4–11` | `Composer.tsx` JSX ~`:339–398`; shots 07, 16, 34 | **ACCEPTED** — four documents still say readout-first (**C-1**) |
| D-26 | **The MANUAL date/place path must always exist**; photo-metadata detection is optional behaviour layered over it. | `composer-states.md:60` | `Composer.tsx:165–171, 358–396` | **ACCEPTED** |
| D-27 | **Text limit 2,000; photo limit 10**; reorder by arrow buttons is mandatory (no drag-only). | `social-interaction-spec.md:60–62`; `composer-states.md` | `Composer.tsx:64–65, 254–262, 512–514` | **ACCEPTED** |
| D-28 | **Privacy vocabulary is three values**: Public / Friends / Only me. | `data.ts:26`; `composer-states.md` | `Composer.tsx:317–332` | **ACCEPTED** — three user-facing words for one value (**C-18**) |

## 5. Conversation

| # | Decision | Evidence | Implementation | Class |
|---|---|---|---|---|
| D-29 | **RESPOND is the primary human verb and it WRITES.** The anonymous tap is retired; its fields stay in the model, unsurfaced, and **must not be ported as a like counter**. | AGENTS.md R3 §41–§44; `moment-conversation-model.md:23–29, 114–115` | `Moment.tsx:294–300` opens the conversation; `store.tsx:140–153` has no dispatcher | **ACCEPTED** — six documents still specify the tap (**C-2**) |
| D-30 | **RESPONSES** is what `Note[]` is called wherever a person can read it. **NOTE is removed from the user-facing vocabulary.** | `moment-conversation-model.md:28`; `systemboom-glossary.md:121` | the 12 `conv.*` keys; `notes.*` namespace gone from all 8 catalogs | **ACCEPTED** — two orphan keys and two notification fixtures still say "note" (**C-7**) |
| D-31 | **One level of replies.** `Note.parentId` only; a depth-2 row's Reply targets the parent. | `social-interaction-spec.md:90–93` | `Moment.tsx:170, 479, 485, 609, 662–666` | **ACCEPTED** |
| D-32 | **Adaptive conversation depth:** ≤2 responses inline; 3+ on a phone opens a focused surface carrying a memory header. Desktop stays inline. | AGENTS.md R3 §48–§51; `moment-conversation-model.md` §3 | `Moment.tsx:156–166, 518–607` | **ACCEPTED** |
| D-33 | **The Response Branch:** one hairline stroke from the Almanac spine into the conversation. **Thread trees, stacked chat bubbles, comment cards and timeline-node soup are prohibited.** | `moment-conversation-model.md` §4 | `Moment.tsx:472–474` `data-sb-response-branch` | **ACCEPTED** (anti-pattern) |
| D-34 | **No reaction under a response**; no "Top", "Best", "Most relevant" or AI ranking. | `moment-conversation-model.md` §5; AGENTS.md R3 §56–§57 | the per-note acknowledgement was removed; `noteRespond` is unreachable | **ACCEPTED** |
| D-35 | **No custom emoji picker** — the OS keyboard is better. | `moment-conversation-model.md` §6; AGENTS.md R3 §61 | `Moment.tsx:743–746` | **ACCEPTED** |

## 6. Expressions and Human Pulse

| # | Decision | Evidence | Implementation | Class |
|---|---|---|---|---|
| D-36 | **SYSTEMBOOM has its own mascot-based expression language.** This supersedes the earlier blanket "no custom reaction sets" rules. What those rules protected still stands: **no like economy, no popularity metric, no ranking or trending, no engagement scoring, no autoplaying loops.** | AGENTS.md R2 opening (owner product decision); `moment-expression-contract.md:4–5` | `expressions.tsx` | **ACCEPTED** — four documents still forbid it (**C-3**) |
| D-37 | **Eighteen expressions**, six of them `quick`. **No angry / hate / dislike / downvote / mocking / sarcastic.** **BOOM is reserved.** | `systemboom-expression-language.md:3–5, 65–67` | `expressions.tsx:53–55, 142–202` | **ACCEPTED** — the set size is stated as 6 / 12 / 18 across three documents (**C-4**) |
| D-38 | **Single-active invariant:** at most ONE expression per (Moment, person). A new choice replaces; remove deletes. | `moment-expression-contract.md` §1 | `store.tsx:155–163` — the data shape (`Record<personId, expressionId>`) makes it **structurally unbreakable**, not merely policed | **ACCEPTED** |
| D-39 | **Expressions are FEELING, never status.** They change nothing else — not Life (ring, position, density, colour), not relationships, not privacy. | `moment-expression-contract.md` §1 | asserted by `social-r2-expression.js`, `social-r3-2` §11 | **FROZEN** (anti-pattern) |
| D-40 | **Human Pulse:** 100 people choosing Care is **one** Care lens and "100 people" — never 100 mascots and never a bigger one. ≤3 equal lenses, viewer first; **no per-expression counts in the feed**; the line is 36px tall from 1 person to 1,000+. | `human-pulse-contract.md:16, §3` | `expressions.tsx:1021–1105`; `min-h-9` = 36px; `reps` capped at 3 | **ACCEPTED** |
| D-41 | **No invented compact numerals** ("1K"). The locale architecture has no truthful compact formatter, so 1,000 renders in full. | AGENTS.md R3.3 §40; `human-pulse-contract.md` §3 | `formatNumberLocale` | **ACCEPTED** |
| D-42 | **The Spectrum is canonical order with truthful counts** — no bars, no percentages, no ranking graphic. | `human-pulse-contract.md` §4 | `expressions.tsx:1107–1146`; grep-verified: no `%`-derived geometry | **ACCEPTED** |
| D-43 | **The who-expressed list is IDENTITY-ONLY** — real photo + Life Ring + name, never exact Life precision. | `human-pulse-contract.md` §5; AGENTS.md `social-2030.js` §4 supersession | `expressions.tsx:1160` — `PersonIdentity` at 40px with `moments` and `connected` omitted | **ACCEPTED** |
| D-44 | **Nothing in the feed animates on its own.** Every expression animation is one-shot and event-driven; reduced motion never mounts the sequence at all. | AGENTS.md R3.7 §8, R3.9; `systemboom-expression-language.md:86` | `expressions.tsx:664–668` short-circuits; every keyframe traced to a trigger | **ACCEPTED** — one documented exception, the LifeCounter's per-second `sb-roll` |
| D-45 | **The per-expression FACES are ART ASSET BLOCKED.** The environment has no 3D renderer and no image-generation model; the 2D experiment failed visibly and is recorded. Nothing was faked, no symbol was enlarged to compensate, no glow or passive motion was added. | AGENTS.md R3.2 §5/§77, re-verified R3.9 §2/§39; `quick-six-render-briefs.md`; the mandatory no-marks boards | on disk: 6 ids have composited chamber assets **all wearing the same face**; 12 fall back to the neutral vessel | **OPEN (blocked)** — the count is stated as 18 in code and 7 in AGENTS.md (**C-24**) |

## 7. People, Chat, Search, Notifications

| # | Decision | Evidence | Implementation | Class |
|---|---|---|---|---|
| D-46 | **There is no People tab and no Chat tab.** A person is the object; actions live with objects. Both are **utilities** in the bar. | `people-chat-integration.md` §1; `People.tsx:11–12` | `Chrome.tsx:128–131` | **ACCEPTED** |
| D-47 | **Relationship states are `friend · family · request-in · request-out · none`** — and *"the exact live state machine must be verified against the backend."* | `people-chat-integration.md` §2 | `world/model.ts:27` | **ACCEPTED** (design) / **OPEN** (live) |
| D-48 | **No followers, no following, no one-way graph, no suggested people, no "people you may know", no follower counts, no algorithmic ranking.** | `People.tsx:16–20`; `people-chat-integration.md` §8 | **verified by exhaustive grep**: the only social-graph hit for follow/following/subscribe in all of `src` is the negative comment itself | **FROZEN** (anti-pattern) |
| D-49 | **Two unread truths, two sources, never a combined total.** The Messages dot is message-unread; the bell is notification-unread. People's pending indicator is deliberately **steel**, not Boom, so it does not compete. | `people-chat-integration.md` §4; AGENTS.md S5/S6 §79 | `WorldProvider.tsx:123` vs `Chrome.tsx:88`; `People.tsx:60–63` | **ACCEPTED** |
| D-50 | **Desktop (≥1024px) opens ONE mini-chat dock**, bottom-trailing. "**No second dock, ever.**" Smaller screens go to full Chat. | `people-chat-integration.md` §4 | `Messages.tsx:163–207`; a single nullable `mini` in `WorldProvider` | **ACCEPTED** |
| D-51 | **Chat owes the live port a shared SYSTEMBOOM session (no second login).** The live Chat's separate hosted login is a deployment artifact, not the product. **Do not invent client-side security.** | `people-chat-integration.md:54–60`; `app/chat/page.tsx:11–15` | not built — **the P1 boundary** | **OPEN (P1)** |
| D-52 | **Search is object-aware**: People · Moments · Photos · Places, in that order. Honest no-results = one sentence + Clear. **No suggestions, no trending.** | `s5-s6-discovery-motion.md` §2 | `Chrome.tsx:254–259, 340–346` | **ACCEPTED** |
| D-53 | **A notification's read state is a 2px mark and 80% opacity — never a bright row, no pulse anywhere.** Request rows resolve **in place**; the list does not jump. | `s5-s6-discovery-motion.md` §3 | `Chrome.tsx:504–559` | **ACCEPTED** |
| D-54 | **Expression activity produces no notification fixtures** — it is a documented live seam, deliberately not faked. | `moment-expression-contract.md:75`; AGENTS.md R2 carryovers | verified: `store.tsx` `express` never touches `notifications` | **FUTURE (seam)** |

## 8. i18n, theme, device, motion, accessibility

| # | Decision | Evidence | Implementation | Class |
|---|---|---|---|---|
| D-55 | **Eight locales, no flags. Routes never change with language** — no `/en/world`. User choice always wins; **location is never proof of language**. | `docs/i18n/architecture.md` §2–§4; `i18n-live-contract.md:10–24` | `lib/i18n/config.ts`, `resolve.ts`, `LocaleProvider.tsx` | **ACCEPTED** (architecture **FROZEN**) |
| D-56 | **Month names ship in the product, not read from `Intl`**, and every `Intl` formatter is pinned to `numberingSystem: "latn"`; times render 24-hour `HH:MM`. This is a hydration-determinism requirement, not a style choice. | AGENTS.md S1 determinism decision; `format.ts:16–24, 50–63` | `SHORT_MONTHS` / `LONG_MONTHS` / `NUM` | **FROZEN** |
| D-57 | **User-generated content is never auto-translated and never sent to a translation service.** | `translation-status.md:50–53`; `i18n-live-contract.md` | structural: authored strings render raw; chrome goes through `t`/`tp` | **FROZEN** |
| D-58 | **English is the only reviewed vocabulary.** All eight catalogs are key-complete (319 × 8, verified) but every non-English catalog is a **draft awaiting native review**. Completeness ≠ review. | `translation-status.md:3–5, 15–28` | verified by key count and key-set diff | **OPEN (honest)** |
| D-59 | **RTL is architecturally carried, not exercised.** `dir` and `script` are plumbed end-to-end; every initial locale is LTR. | `config.ts:6–8`; `architecture.md` §2 | `layout.tsx:45`, `LocaleProvider.tsx:63` — but **zero `rtl:` variants** in `src` | **FUTURE** |
| D-60 | **One theme store (`localStorage["sb-theme"]`), default dark.** "**Never add a second theme store.**" Navigation never changes the theme. | `social-shell-spec.md:90–92`; `systemboom-navigation-final.md` §6 | `lib/use-theme.ts`; the pre-paint boot script at `layout.tsx:30` | **FROZEN** |
| D-61 | **Boom red is meaningful state only** — the single primary action, the unread dot, the years unit in the counter, the scarce ownership rim. **Celebrate left Boom red** in R3.3 precisely to keep it scarce. | `globals.css:7`; `social-visual-spec.md:52–56`; AGENTS.md R3.3 §6 | 37 `var(--boom)` references, enumerated in the audit | **ACCEPTED** |
| D-62 | **The same Social model recomposes per device class** — no feature, route, data, navigation or semantic change, and **no bottom nav**. | `s7-device-responsive-contracts.md` | container queries `@2xl` 672px / `@5xl` 1024px; `@max-5xl` ordering | **ACCEPTED** |
| D-63 | **One scroll owner per surface**; the scrim is `touch-action:none`; desktop anchored surfaces stay **non-modal** (page context visible) — a recorded intentional decision. | AGENTS.md S7 §23–§24 | `TransientSurface.tsx`; the `min(100dvh − --sb-bar-h − …, 42rem)` cap | **ACCEPTED** |
| D-64 | **Motion is one system**, four families, 140–240ms, all collapsed by one global reduced-motion rule. **Haptics belong to native clients; the product plays no sound.** | `s5-s6-discovery-motion.md` §5, §7 | `globals.css:412–421`; the `sb-*` keyframe set | **ACCEPTED** |
| D-65 | **Reduced motion must be complete, and the state must stay truthful.** The strongest pattern in the repo: the expression commit updates the store **first**, then short-circuits the entire choreography. | AGENTS.md R3.x; `expressions.tsx:664–668` | verified | **ACCEPTED** |
| D-66 | **Contrast is machine-asserted**, not eyeballed: 19 token pairings per theme, with the large-text exemption applied. | `social-final.js:79–128, 636–645` | shipped artefact `contrast.json` — 38 rows, 0 failures | **ACCEPTED** |
| D-67 | **44px touch targets on phones for primary actions**, relaxing to 36–40px at `@2xl`. Applied to primary actions, **not universally**. | AGENTS.md S7 §13 | 17 `min-h-11` sites across 11 files; gaps enumerated in the audit | **ACCEPTED** |
| D-68 | **`data-sb-*` are test hooks; `aria-*` and roles ARE design** and must be ported. | `README-for-developer.md` §I | ~50 `data-sb-*` on the expression system alone; 154 `aria-label`s | **FROZEN** |

## 9. Documented FUTURE (built nowhere, hinted at nowhere)

| # | Direction | Evidence | Status |
|---|---|---|---|
| F-1 | **Moment provenance** — a `provenance` field sourced from the real upload/authoring pipeline, *"never inferred client-side, never guessed"* | `social-2030-future-seams.md` A | FUTURE |
| F-2 | **Cosmos Knowledge** — a knowledge layer that *"belongs to Cosmos, not My World"* | same, B | FUTURE |
| F-3 | **Cited AI research** — *"must never be presented with the same grammar (ring, band, 'what happened') that a Moment uses"* | same, C | FUTURE |
| F-4 | **Life retrieval** — a query over the existing viewer-safe model, not a new architecture | same, D | FUTURE |
| F-5 | **Celestial Resonance** — **does not appear anywhere in this repository.** Zero occurrences in `src/`, `docs/`, `prototype-tests/` or AGENTS.md. | grep | FUTURE / RESEARCH — **not implemented, not documented here** |
| F-6 | **A quiet acknowledgement word for shared health records** — *"a different word from Respond, quiet, without a count … applause is the wrong response to a blood-pressure reading."* Banked only. | `phase-5-candidates.md` | FUTURE (banked) |
| F-7 | **"Same day across your life"** — owner-only, derived from the viewer-safe set, *"no 'on this day' nostalgia framing — it is a coordinate, not a memory prompt."* | same | FUTURE (banked) |
| F-8 | **`Note.expression?: ExpressionId`** — a sticker-scale mascot inside a response. Seam documented, deliberately not faked. | AGENTS.md R2 §38 / R3 §59 | FUTURE (seam) |
| F-9 | **Native haptics** mapped to anticipation → core lock → Boom impulse. Documented only; **no web fake**. | AGENTS.md R3.9 carryovers | FUTURE |
| F-10 | **The World Wall atmosphere token** — the intended live source for World Light. No such token exists in this repo; the shipped truth source is the theme material, stated in code. | `SocialPreview.tsx:203–215` | FUTURE (seam) |

## 10. Decisions recorded as REJECTED (so the Bible does not re-open them)

| Rejected | Reason recorded | Where |
|---|---|---|
| Double-tap to express | conflicts with photo-expand and video targets | AGENTS.md R2 §62, R3 §92 |
| A custom Unicode emoji picker | the OS keyboard is better | `moment-conversation-model.md` §6 |
| A reaction *picker in the like sense*, a like economy, popularity metrics, ranking/trending, engagement scoring | the product is a life record, not a feed | AGENTS.md R2; `s6-motion.js` §10c still guards it |
| A second unread total | two truths, two sources | `people-chat-integration.md` §4 |
| A request centre | requests are answered where they appear | same, §8 |
| A second mini-chat dock | one dock, ever | same, §4 |
| Flex-wrap on the top bar | *"a wrapping bar breaks on base sizes before shrinking; it doubled the 360 bar"* | AGENTS.md S7 §10–§12 |
| `translateX` centring for the Composer shell | Motion animates the shell's transform and silently replaced the centring — a real captured defect | AGENTS.md S7 §50 |
| The cover-photo + overlapping-avatar grammar | it is another product's convention; the **overlap** stays banned (the photo itself does not) | AGENTS.md Social 2030 Final Delta §1 + the later supersession |
| `expr.surprised` | it was Wow twice; the slot went to Nostalgia | AGENTS.md R3.1 §14 |
| A milliseconds counter face | *"a face that changes faster than a reader can read is decoration"* | `social-visual-spec.md:219` |
| Neon/HUD/glass visual language (the "Banned, always" list) | the Cosmos visual language rules | `SYSTEMBOOM-HANDOFF-BRIEF.md` §4 |

## 11. Where "FROZEN" could NOT be justified

Per the brief, these are **UNKNOWN / NEEDS OWNER REVIEW** — the sources of record disagree, so no
class is assigned:

| Area | Why |
|---|---|
| The Composer's binding body order | one document says memory-first, four say readout-first (**C-1**) |
| The Respond interaction and its API shape | one document retires the tap, six specify it — including the API contract (**C-2**) |
| Whether a reaction set/picker is permitted | four documents forbid the feature that ships (**C-3**) |
| The expression set size and asset budget | six / twelve / eighteen across live documents (**C-4**) |
| `friends`-privacy visibility | three statements of the rule, two of them wrong; and the feed/search half is untested (**C-5**, **C-14**) |
| Whether a navigation row exists | banned in seven places, drawn in five, three files self-contradicting (**C-6**) |
| Whether Health/Problem may carry a conversation | the contract says no, the code allows it (**C-15**) |
| The Boom Lens surface definition | half-face crop vs chamber aperture (**C-11**) |
| The expression group/family taxonomy | two live axes, stated as one (**C-13**) |
