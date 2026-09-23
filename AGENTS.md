<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Frozen zone — Phase 1 Cosmos / Earth (accepted 1.10C)

`src/components/cosmos/**`, `src/components/earth/**` and `src/lib/earth/**` are the ACCEPTED Phase 1 experience. Do not refactor them to make later phases easier; connect through the existing callbacks and props. The rule protects working behavior — it does not preserve bugs.

Authorized exceptions (owner-approved, keep them, do not "clean up"):

- **2026-09-10 · Phase 2.2 — `CameraRig` `calm` prop.** One optional prop (default `false`, behavior identical) scaling the orbital speed factor while the identity gate is open, threaded through `Scene`.
- **2026-09-10 · Phase 2.2.1 hotfix — `CameraRig` focus memory.** Root cause: React passive effects run AFTER the R3F frame loop has already drawn a frame in the new mode; the system-mode `minDistance` clamp (14 units) moved the camera before the focus-memory effect sampled it, storing an offset beyond the focus-mode `maxDistance` (13r), so the next focus could never reach its target and `travelling` stuck. Fix: the offset is recorded in the frame loop while settled (`settledOffset`), the effect stores that, an un-settled leave stores nothing, and remembered offsets are clamped into the mode's reachable band at use. Verified by `prototype-tests/camera-refocus.js`.

- **2026-09-10 · Phase 4 — `src/lib/life-time.ts` `CIRCLE_BANDS` eight → ten.** The Phase 0 constant of eight 15-year bands was a wrong number; the live product's Circle of Life has ten (150 years, e.g. 2000–2149, verified from `references/social/`). Only the band list and a `CIRCLE_YEARS = 150` export changed; `currentBandIndex()` derives from the list length and is otherwise untouched.

# Frozen zone — Phase 4 Social (accepted 4.1, frozen 4.2 · 2026-09-11)

Phase 4 Social is the **accepted visual + interaction reference for the live-system
handover**. The developer of `next.systemboom.co.uk` ports Social from this reference and
its documents; nothing here is a draft any more.

The accepted Social reference consists of exactly:

- `src/components/style-lab/social/**` — `SocialPreview.tsx` (composition, scoped tokens,
  harness), `Chrome.tsx`, `ProfileHero.tsx`, `LifeRing.tsx`, `LifeCounter.tsx`,
  `CircleModule.tsx`, `Moment.tsx`, `Media.tsx`, `Composer.tsx`, `DateField.tsx`,
  `view-model.ts` (the privacy boundary), `life.ts`, `store.tsx`, `data.ts`
- `src/app/style-lab/social/page.tsx` (the route `/style-lab/social`)
- `public/fonts/noto-sans-devanagari/**` and `public/mock/social/**` (+ `CREDITS.md`)
- `docs/handover/README-for-developer.md`, `social-visual-spec.md`,
  `social-interaction-spec.md`, `social-content-rules.md`, `social-api-contract.md`,
  `social-visual-qa.md`, `social-reference-index.md`
- `docs/design/social-wireframes.md`, `docs/design/composer-states.md`,
  `docs/social-feature-parity.md`
- `prototype-tests/social-final.js`, `prototype-tests/social-devanagari-crops.js`, and the
  evidence they produce under `prototype-evidence/phase-04-final/**` (gitignored)

Phase 5 (Circle of Life) lives beside Social, not inside it: `src/components/style-lab/circle/**`,
`src/app/style-lab/circle/page.tsx`, `docs/design/circle-of-life.md`,
`docs/handover/circle-of-life-spec.md`, `prototype-tests/circle.js`,
`prototype-evidence/phase-05-circle/**`. It imports the frozen Social components and store
(`MomentEntry`, `Composer`, `LifeRing`, `DateField`, `SocialStore`, `view-model.ts`) as documented
seams and does not modify them beyond the recorded exceptions below.

Rules:

- Do not refactor these merely to make later phases easier. Future phases (Phase 5 Circle /
  Life, Phase 2 entry journey, Phase 6 "View in Life") connect through the existing props,
  callbacks, the `SocialStore` reducer and the documented integration seams (the disabled
  "View in Life" slot, the "Open Life — later" control, the `view-model.ts` boundary, the
  `data-sb-*` hooks used by the suite).
- Frozen does not preserve genuine defects. A defect is fixed, recorded below, and covered by
  `social-final.js`; a preference is not a defect.
- **Accepted behaviour, its tests and its evidence are authoritative.** The
  documents describe them. If a document and the accepted, tested behaviour
  disagree, that is a conflict to REPORT and then fix in the document — never a
  licence to change accepted behaviour to match stale prose.
- This section freezes Social only. It does not freeze `src/components/style-lab/StyleLab.tsx`,
  `demos.tsx`, the Phase 0 tokens in `globals.css`, or any other application code.

Authorized exceptions (owner-approved; record every one here, keep them, do not "clean up"):

| Date | Phase | File | Reason | Behavioural effect | Test / evidence protecting it |
|---|---|---|---|---|---|
| — | — | — | none yet | — | — |

| 2026-09-11 | 4.3 (§6, §51) | `social/Chrome.tsx` | Dead navigation: every nav item and the logo were `href="#"` | Superseded by the one-application correction below | — |
| 2026-09-11 | one-application correction (§4, §12, §25) | `social/Chrome.tsx` | Social carried a second application navigation (Home · About · World · Friends · Profile) competing with the shell's, and called the feed "World" | Social now renders the shared `AppMark` + `AppNav`: one model, one row — World · Social · Life · People with **Social** active. Profile and Friends move to their correct layers (account menu / People); About leaves the app navigation. **Owner-directed vocabulary change:** the Phase 4.1 rename of the feed's nav item to "World" is superseded — World means the person's own context. Two assertions in `social-final.js` were updated to the new vocabulary (active item "Social"); no check was weakened or removed. | `one-application.js` §1–2; `social-shell.js` §3–4; `social-final.js` 180/180 |
| 2026-09-11 | 4.3 (§23, §24) | `social/Chrome.tsx`, `social/data.ts` | Search and notifications were generic | Search results carry dates, place tallies and band-safe life position, and a Moments group; notification rows name the Moment by its own date and place; one fixture's duplicated, wrongly formatted date removed | `social-shell.js` §9; `social-final.js` §8–9 unchanged and green |
| 2026-09-11 | 4.3 (§47) | `identity/IdentityGate.tsx` (Phase 2, paused — not frozen) | The signed-in view claimed "your world opens in the next phase" | Superseded by the final navigation row below | — |
| 2026-09-12 | final navigation (§6, §12, §32) | `social/Chrome.tsx` | Social still carried a destination row beside the shell's | Superseded by the My World row below | — |
| 2026-09-12 | final My World pass (§3, §7, §15–16) | `social/Chrome.tsx` | The Compass exposed the architecture as UI (a destination menu of Cosmos · Earth · Social · Life), and the feed's destination was still called "Social" | The bar opens with the shared **Brand**: the mark links Home to Cosmos and **MY WORLD** is stated beside it — no menu, no row, at any width, and the word stays visible at 360 (tighter plate, 36px phone utility targets, the inert chat placeholder hidden below 672px). **Owner-directed:** the `social-final.js` brand assertion and one contrast pick now read MY WORLD; nothing was weakened. | `final-app.js` §1–2; `social-shell.js` §3–4; `social-final.js` 180/180 |
| 2026-09-12 | final My World pass (§19, §22) | `social/ProfileHero.tsx` | Life was invisible on phones until the bottom of the stream (entry at ≈5,291px) | The owner's Circle row becomes the compact Life entry: `band 30–45 · 12,731 days · Life →` linking to `/life` (`data-sb-life-entry`), in the first screen (≈394px at 360×800). Visitor hero unchanged. | `final-app.js` §4; `one-application.js` §4; measurements in `prototype-evidence/final-my-world/*-measurements.json` |
| 2026-09-12 | final navigation (§17) | `cosmos/CosmosExperience.tsx` (Phase 1, frozen — owner-authorised in §17) | Earth is a real destination with no route; the Compass must actually enter it | One effect (~14 lines) reads `?to=earth`, consumes it from the URL, holds it in a ref so a re-run still applies it, and calls the existing `select("earth")` after 700 ms. No DOM simulation, no duplication, no other change. | `final-app.js` §3 (`__SB_STATE` reports `mode: focus, selected: earth`); `camera-refocus.js` and the gate suites unchanged and green |
| 2026-09-12 | final navigation (§14, §15, §16) | `identity/IdentityGate.tsx` (Phase 2, paused — not frozen) | A person who asked for Social or Life had to ask again after identity | The signed-in view's one action reads **Continue to Social** / **Continue to Life**, honouring the destination remembered in `sb-intent`, defaulting to Social. No hub. | `final-app.js` §4; gate suites unchanged and green |
| 2026-09-12 | final navigation (§4, §37) | `social/CircleModule.tsx` | "Open Life" pointed at the development alias | It points at the canonical `/life`. | `circle.js` §20; `social-shell.js` §5 |
| 2026-09-12 | final My World pass (§9) | `identity/IdentityGate.tsx` (Phase 2, paused — not frozen) | The gate's action said "Continue to Social" | It reads **Enter My World** → `/world` (or **Continue to Life** when Life was the remembered request). | `final-app.js` §1, §6; gate suites unchanged and green |
| 2026-09-12 | complete My World (§10–§27) | `social/data.ts` | The live system has friend requests; notifications had no actionable kind | `Notification.kind?: "request"`; one fixture `n-request` (Prakash, "asked to be your friend", unread) first in `SEED_NOTIFICATIONS`. No accepted fixture changed. | `complete-my-world.js` §3; `social-final.js` §8–9 green |
| 2026-09-12 | complete My World (§10–§40) | `social/Chrome.tsx` | People and Chat must be reachable from the accepted bar without new navigation | `TopBar` gains a real **Messages** utility (`data-sb-messages`, message-unread dot, panel) shown when the World provider exists — replacing the inert chat placeholder; the theme toggle hides below @2xl and the account menu gains **Appearance** (Deep Cosmos / Solar Observatory) and a wired **Logout** (clear identity → `/`); notification request rows carry Accept / Decline (min-h-9) resolving to an outcome chip; search people rows (`data-sb-search-person`) carry a relationship chip and open the person surface. No navigation row added. | `complete-my-world.js` §2–§4, §8; `social-shell.js` 68/68; `social-final.js` 180/180 |
| 2026-09-12 | complete My World (§29–§31) | `social/SocialPreview.tsx` | Cosmos → My World continuity and the People/Chat mounts | Wrapped in `WorldProvider`; mounts `<PersonCard/>`, `<MiniChat/>` and the Messages panel; dark `.sb-social` ground becomes `var(--bg-atmosphere,var(--page))` (the existing radial token — material bridge, no stars) with the light block explicitly `#F5F5F6`; a one-shot `sb-arrive` 480 ms resolve (reduced-motion: none) plays when the `sb-arrive` sessionStorage flag was set by a Cosmos entry action | `complete-my-world.js` §1 (per-frame dark, radial in dark only); `social-final.js` green |
| 2026-09-12 | complete My World (§12) | `social/Moment.tsx` | A person in the stream is an object; their name must open the person surface | Another author's name renders as `<button data-sb-open-person>` when the World provider exists (via `useWorldMaybe`); otherwise unchanged text | `complete-my-world.js` §2; `social-final.js` green |
| 2026-09-12 | complete My World (§48) | `social/Media.tsx` | A failed photo destroyed the Moment's structure | `SafeImg`: `onError` swaps the image for a quiet `data-sb-media-fallback` block carrying the photo's own words (alt); layout, person and readout stay | `complete-my-world.js` §6 (404 image keeps person/words/Respond) |
| 2026-09-12 | Person + Life Identity (§1–§3, §21–§24) | `social/LifeRing.tsx` | A SYSTEMBOOM person is a real photo + Life Ring, not a generic avatar; a failed photo must degrade gracefully | `RingAvatar` gains an `onError` fallback (`data-sb-identity-photo` → `data-sb-identity-initials`, never a broken icon); the documented-memory `depth` swing widened 0.35–1.0 → 0.28–1.0 (self-critique: the nuance was barely visible at 56–80px) — lived/unwritten position and the owner-only tick are untouched | `person-life-identity.js` §1–§2, §6; `social-final.js`/`circle.js` unchanged and green |
| 2026-09-12 | Person + Life Identity (§8–§9) | `social/view-model.ts` `ringViewFor` | Documented-memory density needed to become viewer-safe for a connected friend/family visitor, without touching the Phase 5 §23 owner-only default | New optional 5th parameter `connected?: boolean`. **Omitted** (every existing call site — `CircleModule`, the full Circle): behaviour is bit-for-bit unchanged. **Passed** (new `PersonIdentity` call sites only): a non-owner's density is aggregated only from Moments that viewer may see (`public` always, `friends` only when `connected`), never Health/Problem or only-me content, regardless of relationship | `person-life-identity.js` §6 (Krishna 1→0, Prakash 5→3, Maya's private Moments excluded even from a connected visitor); `circle.js` unchanged and green |
| 2026-09-12 | Person + Life Identity (§0–§3, §33) | new `identity/PersonIdentity.tsx` | Do not create separate avatar logic per surface | The one Person Identity component (real photo + Life Ring, resolved from the privacy view model) that Profile, Moment, Search, Friend, Notification, Chat and Composer all render from | `person-life-identity.js` §3 (Krishna's photo is bit-for-bit identical across search, person card, mini chat and full Chat) |
| 2026-09-12 | Person + Life Identity (§1, §11, §27) | `social/ProfileHero.tsx` | The profile identity needed a real photo, viewer-safe density, and a meaningful ring→Life entry | Converted to `PersonIdentity`; new optional `connected`/`moments` props; the owner's ring is now wrapped in a real `Link` to `/life` (`data-sb-hero-ring-entry`, a normal Tab stop) — "look closer," not decoration; a visitor's ring stays inert | `person-life-identity.js` §5, §8; `social-final.js`/`final-app.js`/`one-application.js` unchanged and green |
| 2026-09-12 | Person + Life Identity (§13–§16) | `social/Chrome.tsx`, `social/Composer.tsx`, `social/Moment.tsx`, `world/PersonCard.tsx`, `world/Messages.tsx`, `world/ChatSurface.tsx` | Same rule as above — no bespoke avatar JSX per surface | Every `<LifeRing person={personViewFor(...)} ring={ringViewFor(...)} .../>` triple replaced with `<PersonIdentity .../>`; `PersonCard` additionally passes `moments` + `connected` (the person-card tier is large enough for documented-memory nuance) | `person-life-identity.js` §3–§4, §7; `complete-my-world.js`/`social-final.js`/`social-shell.js` unchanged and green |
| 2026-09-12 | Person + Life Identity (§1–§2) | `social/data.ts`, `lib/mock/demo-user.ts`, `identity/IdentityGate.tsx` (Phase 2, paused — not frozen) | Real profile photos where the product has them, not illustrations | `PEOPLE.krishna.avatar` set to a real, CC-licensed portrait (`face-portrait-man.jpg`); `demoUser.avatar` (Maya, the owner) changed from an illustrated SVG to a real photo (`face-portrait.jpg`) — the earlier curated-avatar/initials-only convention is superseded for identity surfaces; every other fixture (Asha, Bikash, Ramesh, Prakash, M) deliberately keeps no photo, exercising the initials fallback | `person-life-identity.js` §1 (photo vs. initials per fixture); `public/mock/social/CREDITS.md` + `credits.json` updated |
| 2026-09-12 | Social Freeze Delta (blocker #2) | `social/view-model.ts` `ringViewFor` | **Supersedes the row above's "`friends` only when `connected`" clause.** Owner audit: nothing in this repo's handover evidence verifies that the live product actually shows a connected friend/family viewer's Friends-privacy Moments. An unverified relationship must never be assumed to unlock density | A non-owner's density now counts `public` Moments only, full stop — `connected` no longer adds `friends`-privacy content, though the parameter stays threaded through every call site so the live team can flip the filter on in one place once the contract is confirmed. Recorded in code as **FRIENDS PRIVACY BACKEND CONTRACT — VERIFY DURING LIVE PORT** | `person-life-identity.js` §6 (Krishna 1→0, now 0/0; Prakash 5→3, now 3/3 either way) |
| 2026-09-12 | Social Freeze Delta (blocker #1) | `social/ProfileHero.tsx`, `social/SocialPreview.tsx` | The owner needs a real "View as public" action rendering through the exact visitor-safe model — not a second page or a duplicated privacy branch | New optional props (`canPreviewPublic`, `selfPreview`, `onEnterPreview`, `onExitPreview`); `SocialPreview` passes a technical stand-in `viewer` (`PUBLIC_VIEWER`, never rendered/named) so `lifeViewFor`/`personViewFor`/`ringViewFor` resolve through their existing "other" branch — the same one a genuine stranger gets. A quiet "Viewing as public" banner + "Return to My World" button; Composer hidden while previewing; `CircleModule` (unchanged) also renders its visitor branch because it receives the same stand-in viewer | `person-life-identity.js` §11 (46/46 — includes a byte-for-byte comparison of the preview's DOM shape against a genuine visitor's) |
| 2026-09-12 | Social Freeze Delta (defect fix, discovered via blocker #1) | `social/CircleModule.tsx` | The compact module's "N moments recorded this month" line rendered for ANY viewer, unconditionally — a density leak the band-readout's own owner-gating didn't cover, invisible to `circle.js` because its checks scope to `[data-sb-band-readout]` only, not this sibling line | Wrapped in `{own && (...)}` — a visitor (and the owner's own public preview) now sees nothing beyond the band | `person-life-identity.js` §11 (two assertions: a genuine visitor and the preview path both); `circle.js` unchanged and green (no accepted assertion depended on the leak) |
| 2026-09-12 | Social 2030 (§1–§2, residue #2) | `world/PersonCard.tsx` | The life fact ("Circle band X · relationship") read as a caption under a hovercard-style name+action block — old-social residue, not a life surface | The life line now matches the name's own typographic tier (13px, medium); the privacy sentence moved to sit directly beside the fact it explains rather than stranded after the action row | `social-2030.js` §2 |
| 2026-09-12 | Social 2030 (§1/§9, residue #1) | `social/Chrome.tsx` (notification request row) | A friend request read as a bare abstract social action with no life/place context, unlike every other surface in the product | Added `band {momentLifeFor(...).band}` inline, reusing the exact grammar search rows and Moment readouts already use — no new data, no new privacy exposure | `social-2030.js` §1 |
| 2026-09-12 | Social 2030 (§2/§12, residue #3) | `social/Chrome.tsx` (search People row) | Life position trailed the name as small right-aligned metadata — a generic contacts-list pattern | Restructured into a two-line block (name, then life position as its subtitle) — same content, same `data-sb-search-life` contract the accepted suites assert, only the layout changed | `social-2030.js` §3; `social-shell.js`/`complete-my-world.js` unchanged and green (relationship text still inside `[data-sb-search-life]`) |
| 2026-09-12 | Social 2030 (§2/§8, residue #4) | `social/Moment.tsx` (who-responded popover) | Bare name+avatar rows read as a "liked by" list of accounts | Each responder now states their life position (exact for self, band otherwise) — a list of lives | `social-2030.js` §4 |
| 2026-09-12 | Social 2030 (§1/§9, residue #5) | `social/SocialPreview.tsx` (pagination) | "Load more" is the generic wording of an algorithmic feed; this is a chronological life record | Reordered to `{N} earlier · Load more` — time leads. Confirmed harmless to `social-final.js`'s `pick()` (a label string, not a text match) and `social-devanagari-crops.js` (its selector matches on `[data-sb-load-more]` regardless of text) | `social-2030.js` §4b; both suites re-run green |
| 2026-09-12 | Social 2030 Final Delta (§1) — **ProfileHero re-opened for this delta only** | `social/ProfileHero.tsx` | Owner-authorized redesign: the cover-photo + overlapping-avatar grammar (Facebook's convention) is removed entirely, reversing the "foundation, do not redesign" status this file held under the earlier Complete My World / final My World rows above | Single `<PersonIdentity size={96}>`, nothing overlapping it; a "My World" / "{name}'s World" kicker states whose World this is; a stable relationship word (Friends/Family) shows for a connected visitor; the owner's Born fact stays a real `<dl>`; cover photo stays real, editable data ("Change cover photo" preserved) but no longer defines the layout, and moves into a quiet `@2xl+`-only utility row with "Who can see your profile" to protect the mobile first-Moment budget; no follower/following statistics anywhere | `social-2030.js` §7 (no cover banner, one ring, world-context kicker, relationship word, no follower stats); `complete-my-world.js` mobile first-Moment measurement re-confirmed (811px, under the 900px ceiling) |
| 2026-09-12 | Social 2030 Final Delta (§2) — **supersedes rows "Social 2030 (§1/§9, residue #1)" and "(§2/§8, residue #4)" above** | `social/Chrome.tsx` (notification request row), `social/Moment.tsx` (who-responded popover) | Re-auditing life-context density against a three-tier model (PRIMARY/SECONDARY/IDENTITY-ONLY) introduced by this delta: a dense notification row and a dense responder list are IDENTITY-ONLY surfaces — the real photo + Life Ring already say "this is a life"; printing a band label on top of that in these two specific surfaces was over-application, reconsidered and reverted | Notification request row and responder-popover rows no longer print a band/exact-age label; both keep the real photo + Life Ring only. PersonCard and the search People row (SECONDARY tier) keep their life-position text — that reconsideration went the other way, deliberately | `social-2030.js` §1 and §4 now assert the ABSENCE of band text (updated from asserting presence — recorded, not silent; no check removed, the invariant just flipped per the delta's own instruction to question every band label the previous pass added) |
| 2026-09-12 | Social 2030 Final Delta (§3–§4) | `social/LifeCursor.tsx` (new file), `social/SocialPreview.tsx` | The Almanac (My World's own Moments stream) had no sense of "which part of a recorded life the viewer is currently browsing" while scrolling through history — the Life Ring only ever says where a person is *now* | New restrained `LifeCursor`: a plain in-flow `position: sticky` row (not a fixed HUD, no glass/blur, no shadow, no scrubber, no ambient animation), silent at the top of the feed and for the current year, showing only a real Moment's year + viewer-safe life position + place once genuine history has scrolled past a fixed trigger line. Mounted as the first child of the Moments sheet (`data-sb-sheet`) | `social-2030.js` §8 (silent at top; a real historical year/position/place from actual Moment data, never fabricated, never the current year; `position: sticky`, no box-shadow/backdrop-filter; appears on mobile only after scrolling into history; silent again back at the top) |
| 2026-09-12 | Social 2030 Final Delta (§3, self-critique correction) | `social/SocialPreview.tsx` (the Moments-sheet section and its outer `data-sb-social-frame`) | Two bugs found while building the Life Cursor, both invisible to every prior test because they only checked `getComputedStyle(el).position === "sticky"` (the CSS *declaration*), never whether an element actually tracked the viewport on a real scroll: (1) `overflow-hidden`, added to the sheet section to clip the cursor's now-removed negative-margin bleed, defeated its own sticky positioning; (2) the outer `data-sb-social-frame` wrapper's unconditional `overflow-hidden` (pre-existing, load-bearing only for Moment media's mobile edge-to-edge bleed, `Moment.tsx`'s `-mx-[var(--bleed)]`, which is already `0` past the `@2xl` container breakpoint) was *also* silently defeating sticky for every descendant at any width — including the already-accepted `TopBar`, which has therefore never actually stuck to the viewport on scroll in the shipped product either | Removed the sheet-level `overflow-hidden` (cursor no longer needs a bleed to clip). Split the frame wrapper into an outer `@container` sizing div and an inner plain div carrying `overflow-hidden @2xl:overflow-visible` (a container query cannot match the same element that establishes it, so the clip has to live one level in) — the mobile media-bleed clip stays exactly where it's load-bearing (confirmed: no horizontal scroll at the 360 frame), and real sticky behaviour is restored above `@2xl` for the Life Cursor *and* for `TopBar` — no change to `Chrome.tsx`, no prop, class, or test contract touched | Diagnostic script confirmed `TopBar` and the Life Cursor both now track the real viewport top (`rect.top` 0 and 52 respectively) instead of scrolling away with the page; `social-2030.js` 30/30 re-run after the fix; the seven other accepted suites re-run green (see below) |
| 2026-09-12 | My World 2030 Visual Leap (§1–§3) — **owner-directed reopening of the "no cover" reading from the previous row** | `social/ProfileHero.tsx` | Owner review of `prototype-evidence/person-life-identity/` judged the previous redesign's EXECUTION too empty and too small, not its removed grammar: the real cover capability (`person.cover`, already present on Maya/Asha/Bikash's fixtures, never rendered) stayed dormant, and the photo/ring read as a generic small avatar | The cover now renders as a real WORLD HORIZON — full width, ~104px mobile/~176px desktop, a soft material fade into the card background, no hard banner edge — only when `person.cover` is set (Krishna's fixture demonstrates the quiet theme-material fallback); the ring never overlaps it (the Facebook grammar stays rejected, just the empty space around it doesn't). The Life Instrument becomes a single CSS-scaled ring (168px design size, `scale(0.6905)` below `@2xl` → ~116px rendered) — one ring in the DOM at every width, not a responsive pair. The "My life in" ticking counter is removed from the Hero entirely (own self-critique, see below) | `my-world-2030.js` §1–§2, §6; `social-2030.js` §7 updated (records the cover supersession, does not weaken it) |
| 2026-09-12 | My World 2030 Visual Leap (§4–§7) | `social/LifeRing.tsx`, `identity/PersonIdentity.tsx` | The flat, thin-stroke ring read as a generic avatar border at any size, and the current 15-year band was communicated mainly by the "band …" text beside it, not by the ring itself | New INSTRUMENT treatment, gated strictly on `size ≥ 140` (currently only the Profile Hero's 168px design size — every other call site, 20–96px, is bit-for-bit unchanged): a thicker machined stroke (~0.095× diameter) with a radial sheen (`radialGradient`, per-theme via `--ice-hi`/`--steel-hi` with sane defaults); the current band rises 3px in radius with its own stroke width, a `drop-shadow`, and a dedicated `--navy` accent (self-critique correction below) instead of the ambient ice tone, so geometry reads as "current" in both themes, not just against a dark ground; a thin highlight arc outlines it. Owner-only, from the SAME `momentsByBand` the existing opacity-depth mechanic already reads (no new privacy surface): fine engraved tick marks across a lived band, density-scaled, meaning ONLY "Moments documented here," gone below `@2xl`/instrument scale. New optional `animateEntry` prop (default off everywhere) plays the ONE profile-entry resolve — CSS keyframes already covered by the existing global reduced-motion rule, nothing bespoke | `my-world-2030.js` §2–§5; `person-life-identity.js` §7–§8, §23–§27 unchanged and green (ring geometry/interaction contract untouched below 140px) |
| 2026-09-12 | My World 2030 Visual Leap (§8) | `app/globals.css`, `social/LifeRing.tsx` | The Life Instrument needed ONE real entry event (portrait resolves → ring gains depth → current band settles → NOW tick resolves), not a perpetual idle animation | Two new keyframes, `sb-instrument-resolve` and `sb-band-settle` (~260–460ms, staggered via `animation-delay`), applied only when `animateEntry` is passed (Profile Hero only); the existing global `@media (prefers-reduced-motion: reduce)` rule (already relied on by `sb-beacon-pulse`) collapses both to their final state automatically — no bespoke reduced-motion branch needed | `person-life-identity.js` §9 (superseded assertion, see below); `my-world-2030.js` visual evidence |
| 2026-09-12 | My World 2030 Visual Leap (§9, relationship/message) | `social/ProfileHero.tsx` | §9's mandated hierarchy includes "RELATIONSHIP / MESSAGE where visitor" — a connected visitor had a relationship word but no way to act on it from the Hero itself | A subordinate "Message" pill beside the relationship word, shown only when `connected` (the same `heroConnected = world?.canMessage(me.id)` `SocialPreview` already computes for `heroRelationship`) — opens the existing mini-chat dock (≥1024px) or full Chat, exactly like `PersonCard`'s own action. Self-critique correction: the first draft asked `world.canMessage(subject.id)` — wrong question, since `subject` is always the profile's owner, never "the other person"; fixed to reuse the already-correct `connected` prop and, for the action itself, `viewer.id` | `my-world-2030.js` §9 area (visitor Message button present in evidence); no `WorldProvider`/`PersonCard` change |
| 2026-09-12 | My World 2030 Visual Leap (§9–§10, progressive disclosure) | `social/ProfileHero.tsx` | Owner-only cover/visibility controls competing with the identity above them, especially on mobile | Desktop (`@2xl+`) keeps them as a plain, subordinate row (unchanged from the previous delta). Below `@2xl`, they move behind one native `<details>`/`<summary>` "Manage profile ▾" disclosure, closed by default — real progressive disclosure instead of the previous delta's "hidden below `@2xl`, unreachable on mobile at all" | `my-world-2030.js` §6 (`[data-sb-owner-manage]` present, closed by default; mobile first-Moment still 810px, under the 900px ceiling) |
| 2026-09-12 | My World 2030 Visual Leap (§14, shell audit) | `social/Chrome.tsx` | Audit-only per the brief — proportion/material/depth, never a redesign | The light TopBar's flat 1px shadow line becomes a soft, layered shadow (same "instrument" material language, far quieter); the inner row's vertical padding grows `py-2` → `py-2.5`. No class, prop, colour, or text touched beyond that | `social-final.js`, `social-shell.js`, `one-application.js`, `final-app.js` unchanged and green (no assertion depends on the exact shadow/padding values) |
| 2026-09-12 | My World 2030 Visual Leap (self-critique, weakness #4) | `social/SocialPreview.tsx` | `overflow-hidden` on the sheet's padded content div (from the previous delta's Life Cursor fix) is unrelated to this pass but is recorded here for completeness: unchanged this pass, confirmed still correct against the new Hero | — (no change; regression-checked) | `my-world-2030.js` §8 (Life Cursor still activates over historical scroll with the new Hero) |

Owner-superseded assertions for this pass (recorded, never silent; no check weakened or removed):

- **2026-09-12 · `social-2030.js` §7.** "No cover-photo banner" is superseded by "the cover renders as a real World Horizon, with no avatar overlap" — the grammar that stays banned is the OVERLAP, not the photo's existence. 31/31 (was 30/30).
- **2026-09-12 · `person-life-identity.js` §9 (reduced motion).** "The ring has no running animation to suppress — it was never animating" is superseded by "reduced motion collapses the Life Instrument's one entry animation to an instant, static final state" — the Hero now has one real, intentional entry animation; the invariant that matters is that reduced motion still ends it instantly (0.01ms, the same global rule `sb-beacon-pulse` already relies on), not that no animation is declared. 47/47 (was 46/46).

| 2026-09-13 | Final Social Connection (§0, §3–§8) | `world/People.tsx` (new file), `social/Chrome.tsx` | Owner review: relationship mechanics existed (Search's People group, the notification request row, `PersonCard`'s full action set) but nothing put "who are my people, who is requesting, how do I find someone" anywhere discoverable — reachable only by guessing the right Search interaction | A new **People** utility beside Search/Messages/Notifications/Account (`PeopleButton` + `PeoplePanel`, mounted in `TopBar`) — not a navigation tab. Three sections: Find someone (a live filter, reusing the same person-discovery model as Search — see the shared-helper row below), Requests (only rendered while real incoming/outgoing data exists, split into "Wants to connect" and "Waiting on them"), Your People (existing friend/family, each with Message). Every row reads/writes the SAME `WorldProvider` relationships map Search/PersonCard/notifications already use — accepting here is the same `accept` a notification would dispatch. No suggested people, no "people you may know," no follower counts | `social-connection-final.js` §2–§6, §11 (People discoverable desktop+360, real pending-request indicator with no animation, Requests/Your-People sections, cross-surface relationship agreement) |
| 2026-09-13 | Final Social Connection (§10–§14) | `social/ProfileHero.tsx` | The Hero's relationship display only ever handled `friend`/`family` (`REL_WORD`) — `none`/`request-in`/`request-out` rendered nothing at all, so a stranger's Person surface was a dead end and a pending request was invisible there. Owner: "Friends" beside "Message" could read as descriptive text, not a state/action | All five relationship states now render as a STATE chip + the one meaningful ACTION: `none` → **Add friend** (primary), `request-out` → **Requested** chip + Cancel, `request-in` → **Wants to connect** chip + **Accept**/Decline, `friend`/`family` → state chip + **Message**. A ~200ms `sb-rel-resolve` keyframe plays once per state change (collapses to instant under reduced motion, the same global rule already relied on elsewhere) — no bounce/glow/particles. A new `prakashVisitor` viewer mode (test-only, additive) exercises the seeded `request-in` relationship directly on the Hero | `social-connection-final.js` §10 (Hero request-in → Accept → friend, live); `person-life-identity.js`/`social-2030.js` unchanged and green (friend/family rendering itself untouched) |
| 2026-09-13 | Final Social Connection (§17–§19) | `shell/Brand.tsx`, `social/Chrome.tsx`, `social/SocialPreview.tsx`, `social/store.tsx` | Owner audit: the global brand always said "MY WORLD" (a static per-route label from `destinations.ts`) while the Hero correctly said "{Name}'s World" for a visitor — the same page disagreeing with itself about whose World it was | `Brand` gains an optional `label` override (routing/Home behaviour on `current` untouched); `TopBar` passes it as `worldLabel`, computed once in `SocialPreview.tsx` from the same `isOwnerView` the Hero already uses. A **Return to My World** item appears in the account menu only while `!isOwnerView`, resetting the viewer — no Cosmos round trip. `isOwnerView` itself changed from an enumerated list of visitor-mode strings to `me.id === profile.id` (self-critique: the list was already missing the new `prakashVisitor` mode; identity-derived is correct for any future mode without edits) | `social-connection-final.js` §7–§8 (brand/hero text agree for owner and visitor; Return to My World lands back on `owner`) |
| 2026-09-13 | Final Social Connection (§22–§23) | `social/ProfileHero.tsx` | Owner audit ("if the Life Ring were removed, would this look like a conventional profile?"): yes — a centered cover, centered avatar, centered name/place/band stack is the Facebook/X shape regardless of the ring's own redesign | Desktop (`@2xl+`) becomes an asymmetric row: the Life Instrument anchors the left, a left-aligned column beside it carries name, place, relationship state/action, AND the Life entry/band line (self-critique: moved into the same column after a first draft left it centered one line below, which reintroduced exactly the "reverts halfway down" problem this exists to fix) — one cohesive primary-identity block, not centered. Mobile (`<@2xl`) keeps the proven centered stack unchanged | `social-connection-final.js` §16 (`flexDirection: row` at desktop); mobile first-Moment measurement unchanged |
| 2026-09-13 | Final Social Connection (§16) | `social/Moment.tsx` | A Moment's real `fields.with` person-id array (e.g. Bikash's Nyatapola meal, `with: ["p-ramesh","p-prakash","p-krishna"]`) was rendered as inert text ("with 3") — real, already-known people, not discoverable | The "with N" text becomes a button opening a small sheet listing the actual referenced people (`PersonIdentity` + name, each opening the person surface) — only when the Moment's own data already names them; never inferred, no face recognition, no fabricated tags. Self-critique correction (two real bugs, both caught before shipping): (1) the popover's `<div role="menu">`/`<ul>` was first nested inside a `<p>`, an HTML-illegal nesting causing a genuine hydration-mismatch warning — fixed by keeping the kind-word/parts text in its own real `<p>` and placing the popover as a sibling, both inside a `<div>` wrapper; (2) that same restructuring initially broke `social-final.js`'s own `[data-sb-kind='meal'] p span.uppercase` contrast measurement (silently soft-failed, not a hard failure, but a real loss of coverage) by moving the kind-word span out of a `<p>` entirely — restored by keeping that exact `<p>` intact | `social-connection-final.js` §15b (`data-sb-moment-with` opens the real referenced people); `social-final.js` 180/180 with its contrast pick restored (confirmed re-measuring, not silently skipped) |
| 2026-09-13 | Final Social Connection (self-critique #1 — People) | `social/data.ts`, `social/Chrome.tsx`, `world/People.tsx` | Chrome's Search "People" group and the new People utility's "Find someone" field were two separate name-matching implementations — a real drift risk (a future privacy/matching fix to one could silently miss the other) | New `matchPeople(term, excludeId?, limit?)` in `data.ts`; both callers use it — behaviourally identical to each's previous inline filter (confirmed: Search still includes the acting viewer's own name in results, matching its pre-existing behaviour) | `social-connection-final.js` (Search and People rows both exercised); `social-final.js`/`social-shell.js` search sections unchanged and green |
| 2026-09-13 | Final Social Connection (self-critique #4 — mobile/list) | `world/People.tsx` | The Requests/Your-People/Find-someone lists had no internal scroll cap (unlike `NotificationsPanel`'s `max-h-[60vh] overflow-y-auto`) — a longer list would push the entire page down before reaching Moments, worst on a small (mobile) viewport | Each list section capped (`max-h-[40vh]`/`max-h-[50vh] overflow-y-auto`), matching the existing Notifications pattern — the panel itself stays compact regardless of list length | `social-connection-final.js` §3, §6–§8 (panel present and usable at 360) |
| 2026-09-13 | Final Social Connection (self-critique #5 — light mode) | `world/People.tsx` | The People rows had no visual separation between them — a flat list that read as a generic, undifferentiated white surface, most noticeable in light theme (§41's explicit warning) | A hairline divider between rows (`border-b border-[var(--hair)] last:border-0`), plus the incoming/outgoing Requests split above given its own sub-labels — real structure in both themes | `prototype-evidence/social-connection-final/` §7–§8 (recaptured with dividers visible) |
| 2026-09-13 | Social 2030 Final — wider human cast (owner-directed §16–§19) | `social/data.ts` (PEOPLE), `world/model.ts` (RELATIONSHIPS), `public/mock/social/**` (+8 portraits, CREDITS.md, credits.json), `docs/fixtures/photo-sources.md` (new) | The cast was a single-locale (Nepali) set; the owner asked for one believable global human network so People/Search/relationships read like a real network, not a test set | **+8 fictional US/UK personas** (Marcus Bell/NY, Grace Okafor/London, Theo Adeyemi/Bristol, Hannah Reyes/Boston, Rory MacLeod/Edinburgh, Nadia Haddad/Manchester, Walt Brennan/Austin, Sofia Marchetti/Brooklyn) beside the unchanged Nepali core. Each uses a real **CC0** adult portrait (Unsplash-via-Commons; name/city/birth/relationships are fictional fixture data — recorded in CREDITS.md + credits.json + photo-sources.md with the standard disclaimer). Relationships added: 4 friend, 2 none, 2 request-out — **deliberately no second `request-in`** (Prakash stays the single incoming request) and **no new Moments/conversations/notifications**, so every count contract holds (3 conversations, first-Moment "2 responses", notification unread all unchanged). Devanagari/40-char-name/same-DOB/privacy fixtures untouched | `social-2030-final.js` §1 (populated network, global cast present, real photos); `social-connection-final.js` 44/44, `person-life-identity.js` 47/47, `complete-my-world.js` 62/62 unchanged and green; `prototype-evidence/social-2030-final/fixture-cast.png` |
| 2026-09-13 | Social 2030 Final (§20–§22, self-critique #1) | `social/ProfileHero.tsx` | The World Wall (cover) still read as a full-width masthead above a centred identity — wall-first, not person-first, and a hard-ish banner edge | The cover is shallower (`h-[92px] @2xl:h-[150px]`, was 104/176), fades into the card over a longer eased `color-mix` transition (atmosphere, not a banner edge), and **caps at 56px on a short/landscape viewport** (`[@media(max-height:520px)]`) so it can never consume the whole first screen (§70). The person now leads | `social-2030-final.js` §3 (landscape cover ≤80px, utility bar on first screen), §10 (cover ≤160px, still asymmetric row); `my-world-2030.js`/`social-connection-final.js` unchanged and green |
| 2026-09-13 | Social 2030 Final (§9, §86, self-critique #2) | `social/ProfileHero.tsx` | On mobile the owner's private contact pill ("only you see this") sat above the first Moment, pushing Moments below the first 360 screen | The contact pill is desktop-only inline (`hidden @2xl:inline-flex`) and moves into the existing mobile "Manage profile" disclosure — the mobile first screen is the person + Life + first Moment. Measured first-Moment top **820px → 726px** at 360×800 (well within the first viewport, and the 900px accepted ceiling) | `social-2030-final.js` §3 (first Moment <820); `complete-my-world.js` mobile first-Moment still green |
| 2026-09-13 | Social 2030 Final (§4/§64, self-critique — real bug) | `social/Chrome.tsx`, `shell/Brand.tsx` | A longer visitor context label ("{Name}'s World") widened the phone top-bar row ~10px past 360 — a genuine horizontal-overflow bug found by the new viewport-matrix suite (never caught before because no prior suite measured overflow at every phone width in visitor mode) | Phone top-bar gaps/padding tightened (`gap-1 px-2`, utility cluster `gap-0`; desktop spacing unchanged) and the `Brand` context label truncates on small screens (`max-w-[46vw] truncate @2xl:max-w-none`) as the safety net for any long name. 36px utility tap targets preserved | `social-2030-final.js` §2 (no horizontal overflow at 360/375/390/393/412/430 + landscape + tablet + 1280–1920, owner and visitor); `social-shell.js`/`one-application.js`/`final-app.js` top-bar checks unchanged and green |

Owner-superseded assertions for the Social 2030 Final pass (recorded, never silent; no check weakened or removed):

- **2026-09-13 · none.** This pass added a new suite (`social-2030-final.js`, 34 checks) and did not change any existing accepted assertion; every prior suite runs unchanged and green.

Format for a new row: date · phase · file · reason · behavioural effect · test/evidence.

Owner-superseded assertions (accepted-suite updates — recorded, never silent; no check weakened or removed):

- **2026-09-12 · `social-final.js` (avatar menu).** The menu item list gains
  **Appearance** (with its theme choices) and the "later" qualifier leaves
  **Logout** (it is real now): expected items are
  `Statistics · Weather · Exchange · Settings · Appearance · Logout`. 180/180.
- **2026-09-12 · `social-shell.js` (chat utility).** The bar's chat control is no
  longer asserted as an inert placeholder; it asserts the real Messages utility
  (`[data-sb-messages]`, accessible name `/^Messages/`). 68/68.

# Phase 4 Social + MY WORLD PRODUCT — FINAL, ACCEPTED AND FROZEN (complete-My-World pass · 2026-09-12)

Phase 4 Social is complete and frozen for the live-developer handoff, together
with the SYSTEMBOOM shell that connects it to the rest of the product, and —
as of the complete-My-World pass — the People, relationship and Chat
integration model of My World.

**SYSTEMBOOM is one product (final My World model).** COSMOS (`/`) is the
universal Home; **MY WORLD** (`/world`) is the personal Home after identity, its
stream is **MOMENTS**, and **LIFE** (`/life`) is the Circle of Life inside it.
Earth is a state inside Cosmos (deep link `/?to=earth`) and never a signed-in
navigation item; `/social` is a compatibility redirect to `/world` — "Social" is
capability vocabulary, never a user-facing label. There is **no destination menu
anywhere**: the one global control is the Brand (the mark links Home, one word
states the context), Life is entered contextually (the hero's Circle row and the
Circle module), and identity leads directly into My World with the requested
destination remembered. Navigation never changes the theme; the theme is one
stored preference, default dark, so dark Cosmos enters dark My World without a
flash. The architecture is `docs/design/systemboom-application-architecture.md`,
the navigation design is `docs/design/systemboom-navigation-final.md`, and their
single implementation is `src/components/shell/destinations.ts` + `Brand.tsx`.

**Person + Life Identity (accepted 2026-09-12).** A SYSTEMBOOM person is a real
photo surrounded by their Life Ring — never a generic avatar. One component,
`identity/PersonIdentity.tsx`, is the single entry point every identity surface
(Profile, Moment, Search, Friend, Notification, Chat, Composer) renders from;
there is no second avatar system. Fallback hierarchy: real photo → initials —
no illustrated/curated-avatar tier. Documented-memory density is viewer-safe
and, since the Social Freeze Delta (below), **public-Moments-only** for any
non-owner — never Health/Problem or only-me content, and not yet
`friends`-privacy content either, since that backend contract is unverified.
This is an explicit opt-in on `ringViewFor`'s 5th parameter (`connected`) —
every call site that omits it keeps the Phase 5 §23 owner-only behaviour
verbatim. Relationship and online/presence state are never ring geometry —
they render beside it. The owner also has a real **View as public** action on
their own profile, rendering through this exact same visitor-safe model (a
technical stand-in `viewer`, never a second privacy branch). The contract is
`docs/handover/person-life-identity.md`.

**Social 2030 (accepted 2026-09-12).** SYSTEMBOOM = the Life Network: a person
is PERSON + RELATIONSHIPS + MOMENTS + PLACE + LIFE POSITION + MEMORY. This
pass touched no foundation (Moments, People, Search, Notifications, Composer,
Chat, Circle, Cosmos, theme, privacy and ring geometry are all unchanged
mechanically) — it corrected five places where the *hierarchy* still read as
an existing social network rather than a life record (recorded individually
below): a friend request with no life context, a person surface where the
life fact lost to a hovercard-style action row, a search row that treated life
position as trailing metadata, a "liked by"-style responder list, and
"Load more" leading with generic wording instead of time. Future directions
(Moment provenance, Cosmos Knowledge, cited AI research, Life retrieval) are
documented, not built — `docs/handover/social-2030-future-seams.md`.

**People and Chat (accepted 2026-09-12).** Actions live with objects — there is
no People tab and no Chat tab. Search rows, Moment authors and notification
rows open the **person surface** (band-only Life Ring, relationship word, one
primary action, Message where connected, quiet Remove); relationship states are
`friend · family · request-in · request-out · none` (design states — the live
state machine must be verified against the backend). **Messages** is a utility
beside Search/Notifications/Account: its dot is message-unread only, the bell's
is notification-unread only, never a combined total. Desktop (≥1024px) opens the
ONE mini-chat dock, bottom-trailing; smaller screens go to the full Chat.
**Chat** is a personal destination at `/chat` (`?c=<person>` deep link), a
utility surface never shown as navigation, wearing the same brand, theme and
identity — the live port owes it the **shared SYSTEMBOOM session (no second
login)**. Cosmos → My World is perceptually continuous: dark `.sb-social`
ground is the shared `--bg-atmosphere` radial and arrival plays one 480 ms
`sb-arrive` resolve (none under reduced motion). The contract is
`docs/handover/people-chat-integration.md` +
`docs/handover/my-world-product-completeness.md` (launch classification:
P0 none; P1 = chat SSO, server-side guards, friends/requests state-machine
mapping, person-level block decision, real unread sources).

**Accepted source**
- `src/components/style-lab/social/**` (the Phase 4 reference, with the
  exceptions recorded above)
- `src/components/shell/**` — `destinations.ts` (the destination model),
  `Brand.tsx` (the one global control), `WorldShell.tsx` (the shared page
  frame), `CosmosRoot.tsx` (the root: frozen Cosmos + gate seam + Enter-my-world
  chip), `PersonalDestination.tsx` + `intent.ts` (identity continuation)
- `src/app/page.tsx`, `src/app/world/page.tsx` (MY WORLD), `src/app/life/page.tsx`,
  `src/app/social/page.tsx` (redirect), `src/app/style-lab/social/page.tsx`,
  `src/app/style-lab/circle/page.tsx`
- `src/components/world/**` — `model.ts` (relationship + conversation design
  fixtures), `WorldProvider.tsx` (the one truthful reducer), `PersonCard.tsx`,
  `Messages.tsx` (button / panel / `ConversationBody` / `MiniChat`),
  `People.tsx` (button / panel — the People discoverability utility),
  `ChatSurface.tsx`
- `src/app/chat/page.tsx` (full Chat)
- `src/components/identity/PersonIdentity.tsx` (the one Person Identity component)
- `.sb-surface` tokens in `src/app/globals.css` (additive)

**Accepted documentation** — `docs/design/systemboom-navigation-final.md` (the
authoritative navigation design), `docs/design/systemboom-application-architecture.md`;
`docs/handover/`: `README-for-developer.md`,
`social-visual-spec.md`, `social-interaction-spec.md`, `social-content-rules.md`,
`social-api-contract.md`, `social-visual-qa.md`, `social-reference-index.md`,
`systemboom-navigation-map.md`, `social-shell-spec.md`,
`my-world-product-completeness.md`, `people-chat-integration.md`,
`person-life-identity.md`, `social-2030-future-seams.md`; `docs/design/`:
`social-wireframes.md`, `composer-states.md`; `docs/social-feature-parity.md`.

**Accepted tests and evidence** — `prototype-tests/social-final.js` (180 checks),
`prototype-tests/social-shell.js` (68 checks),
`prototype-tests/one-application.js` (40 checks),
`prototype-tests/final-app.js` (31 checks — the final My World acceptance),
`prototype-tests/circle.js` (132 checks),
`prototype-tests/complete-my-world.js` (62 checks — the product-completeness
acceptance: continuity, People, requests, Messages/mini chat, full Chat,
non-happy states, privacy, account, performance),
`prototype-tests/person-life-identity.js` (47 checks — the Person + Life
Identity acceptance: real photo/fallback, image failure, one identity system
across every context, viewer-safe density, privacy, ring interaction, the
Social Freeze Delta's View as public + friends-privacy correction, and the
My World 2030 Visual Leap's superseded reduced-motion assertion),
`prototype-tests/social-2030.js` (31 checks — the category-definition
hierarchy corrections, the Final Delta's ProfileHero/Life Cursor pass, and
no-regression proof),
`prototype-tests/my-world-2030.js` (27 checks — the Visual Leap acceptance:
World Horizon, the Life Instrument, current-band geometry, memory material,
restraint/no-HUD, owner/visitor/360, Moments/People untouched),
`prototype-tests/social-connection-final.js` (44 checks — the Final Social
Connection acceptance: People discoverability, the full relationship state
machine on every surface, owner/visitor header context, the profile
"old-social" test, Moment → People),
`prototype-tests/social-2030-final.js` (34 checks — the Social 2030 Final
spatial/mobile/desktop/performance acceptance: the wider human cast, the
viewport matrix with no horizontal overflow at every phone/tablet/desktop
width + landscape, mobile first-Moment priority, short-viewport World Wall
cap, desktop width discipline, performance guards — no WebGL/no persistent
animation loops — Life-only ring, and the no-hover / motion-off /
change-the-logo / old-social generic tests),
`prototype-tests/social-devanagari-crops.js`;
`prototype-evidence/phase-04-final/**`, `prototype-evidence/phase-04-final-social/**`,
`prototype-evidence/phase-05-circle/**`,
**`prototype-evidence/final-my-world/**`** (the final visual set, incl. baseline/after
mobile measurements), **`prototype-evidence/complete-my-world/**`** (39
captures, 29 honestly N/A), **`prototype-evidence/person-life-identity/**`**
(30 captures), **`prototype-evidence/social-2030/**`** (19 captures — the
hierarchy-correction, Final Delta ProfileHero/Life Cursor, and first-impression
evidence), **`prototype-evidence/my-world-2030/**`** (16 captures — the
Visual Leap evidence: cover, instrument, current-band geometry, memory
material, owner/visitor/360, dark/light),
**`prototype-evidence/social-connection-final/**`** (40 captures — People
entry/surface, every relationship state, header context, Return to My World,
the profile old-social test, Moment → People) and
**`prototype-evidence/social-2030-final/**`** (the visual-freeze evidence:
mobile 360/390/412 + landscape, desktop 1280/1440/1920, every Moment kind,
relationship states, the wider cast, motion frame-strips, a11y/Devanagari/
emoji/200%-text, `fixture-cast.png`, `photo-sources.md`). The wider fictional
cast (8 US/UK personas beside the Nepali core) is documented in
`public/mock/social/CREDITS.md`, `credits.json` and `docs/fixtures/photo-sources.md`
— real CC0 portraits, fictional persona data.
`prototype-evidence/one-application/**` and
`prototype-evidence/final-systemboom-app/**` are Compass-era history —
SUPERSEDED, do not implement from them.

**Rules**
- Accepted behaviour + tests + evidence are authoritative; documentation
  describes them. A contradiction is reported, not silently resolved by changing
  behaviour.
- Do not refactor these to make later phases easier. Connect through the
  documented seams: `destinations.ts`, `WorldShell`, the Circle's `?c=`
  coordinate, the disabled "View in Life" slot, the `SocialStore` reducer, the
  `WorldProvider` reducer and the `data-sb-*` hooks the suites assert.
- Frozen does not preserve defects. A defect is fixed, recorded in the table
  above, and covered by a test.
- Never link to a destination that does not exist; add it to `destinations.ts`
  as `later` instead.

Phase 4 exceptions recorded during Phase 5 (owner-directed in the Phase 5 brief; each protected by `prototype-tests/circle.js` and unchanged assertions in `social-final.js`):

| Date | Phase | File | Reason | Behavioural effect | Test / evidence protecting it |
|---|---|---|---|---|---|
| 2026-09-11 | 5 (§6) | `social/data.ts`, `social/Composer.tsx`, `social/Moment.tsx` | Temporal honesty: a Moment recorded for a past date has DATE precision; posting time is provenance, not the event time (closes the Phase 4.2 open question) | `Moment.atPrecision?: "day" \| "minute"`; the composer stamps a backdated Moment `at = date + 12:00` (sort anchor, never displayed) with `atPrecision: "day"`; the readout omits the clock for day-precision Moments; fixtures `m-1983`, `m-wedding` marked day-precision | `circle.js` §11 (date-only Moment shows no fabricated time); `social-final.js` sections 10/14 unchanged and green |
| 2026-09-11 | 5 (§23) | `social/view-model.ts` `ringViewFor` | Aggregation privacy: counts of another person's dated Moments per AGE band narrow their birth date | `momentsByBand` is produced for the owner only; a visitor's ring has no density | `circle.js` §9 (visitor ring/module carry no counts); `social-final.js` §2 green |
| 2026-09-11 | 5 (§24, §35) | `social/CircleModule.tsx` | The compact Social Circle is a glanceable instrument; the full Circle owns time navigation; "Open Life" is the documented entry seam | The date picker becomes an informational `today · DD MON YYYY` line (same `data-sb-date-display`); the visitor band hover reads `lived` / `unwritten` with no count; "Open Life — later" becomes a link to `/style-lab/circle` | `social-final.js` §14 Circle date grammar unchanged and green; `circle.js` §20 |

# Phase S1 — Global Language Foundation + Multilingual UX (owner-directed · 2026-09-13)

SYSTEMBOOM becomes a true multilingual global product. S1 adds a dependency-free i18n
layer and routes user-facing **system** strings through it. The full contract is
`docs/i18n/architecture.md`; the live-port obligations are
`docs/handover/i18n-live-contract.md`; resolution policy `docs/i18n/locale-resolution.md`;
glossary `docs/i18n/systemboom-glossary.md`; QA state `docs/i18n/translation-status.md`.

**The freeze is respected, not weakened.** Every English catalog value is
**byte-identical** to the string it replaced, so the accepted Phase 4 / My World suites
render the exact same English DOM and stay green (verified: social-final 180,
social-shell 68, one-application 40, final-app 31, circle 132, complete-my-world 62,
person-life-identity 47, social-2030 31, my-world-2030 27, social-connection-final 44,
locale-resolution 21). Only non-English output differs, exercised by the new suites. **No
accepted assertion was weakened or removed.**

New foundation (not frozen; the accepted S1 reference):
`src/lib/i18n/**` (config, resolve, server, format, messages, LocaleProvider, 8 catalogs),
`src/components/i18n/LanguageMenu.tsx` + `RegionSuggestion.tsx`,
`prototype-tests/locale-resolution.js` (21) + `prototype-tests/i18n.js` (45),
`prototype-evidence/i18n-s1/**`.

Authorized exceptions — files touched to route their hardcoded system strings through the
i18n catalog. Owner-directed by the S1 brief; English output is byte-identical, so no
accepted assertion changes.

| Date | Phase | File | Reason | Behavioural effect | Test / evidence protecting it |
|---|---|---|---|---|---|
| 2026-09-13 | S1 | `social/Moment.tsx` (frozen Phase 4) | Date rules, kind words, Respond, response/note counts, with-N were hardcoded English | Rendered via `useT`/`sbDate`; en byte-identical (dates keep "DD MON YYYY", counts keep en plural) | `social-final.js`/`i18n.js` |
| 2026-09-13 | S1 | `social/ProfileHero.tsx` (frozen Phase 4) | World kicker, relationship word, all actions, the compact Life entry (band · days · Life →) were hardcoded English | Rendered via `useT`; `days` via `formatNumberLocale` (latn, so en = "12,732"); en byte-identical | `social-final.js`/`final-app.js`/`i18n.js` |
| 2026-09-13 | S1 | `social/Chrome.tsx` (frozen Phase 4) | Search (placeholder/groups/empty/place tallies), notifications, the Account menu, relationship chips were hardcoded English; the authenticated Language control had to live in Account (§72) | Rendered via `useT`/`tp`; the `LanguageMenu` is embedded in the Account popover (`data-sb-account-language`), never a top-bar icon; en byte-identical (menu items still `Statistics · Weather · Exchange · Settings · Appearance · Logout`) | `social-final.js`/`social-shell.js`/`complete-my-world.js`/`i18n.js` |
| 2026-09-13 | S1 | `social/SocialPreview.tsx` (frozen Phase 4) | Composer prompt, "My life in", visitor counter line, pagination, end-of-feed, the visitor "{Name}'s World" label were hardcoded English | Rendered via `useT`/`tp`; pagination `{n} earlier · Load more` (en identical, `/1 earlier/` intact); en byte-identical | `social-final.js`/`i18n.js` |
| 2026-09-13 | S1 | `shell/Brand.tsx` (accepted, not frozen) | The persistent top-bar context word ("My World"/"Life") was hardcoded English | Localized via a destination→key map; en renders "My World" → CSS-uppercased "MY WORLD" (byte-identical), so the accepted brand assertion is unchanged | `social-final.js`/`social-shell.js`/`i18n.js` |
| 2026-09-13 | S1 | `shell/CosmosRoot.tsx` (accepted, not frozen) | Pre-login language had to be accessible in Cosmos; "Enter my world" was hardcoded | Mounts the immersive `LanguageMenu` when signed-out, clear of the frozen Cosmos overlay's chip cluster; "Enter my world" via `useT` (en identical; `/Enter My World/i` intact) | `social-shell.js`/`final-app.js`/`i18n.js` |
| 2026-09-13 | S1 | `world/People.tsx` (accepted, not frozen) | People panel + button strings were hardcoded English | Rendered via `useT`/`tp`; en byte-identical | `complete-my-world.js`/`i18n.js` |
| 2026-09-13 | S1 (self-critique cycle 1–2) | `social/CircleModule.tsx` (frozen Phase 4) | The compact Life instrument's strings (Circle of Life, days/band units, band readout, per-band counts, this-month count, today · date, Open Life) were hardcoded English | Rendered via `useT`/`tp`; the informational date via `sbDate(locale)` (en identical "DD MON YYYY", so `circle.js`'s `/^\d{2} [A-Z]{3} \d{4}$/` holds); en byte-identical throughout | `circle.js` (132)/`i18n.js` |
| 2026-09-13 | S1 (self-critique cycle 2) | `social/Moment.tsx`, `social/ProfileHero.tsx` (frozen Phase 4) | Second-pass audit found remaining system-text leaks: the Moment ⋯ menu (Edit/Change privacy/privacy names/Delete/confirm/Keep/Report/Hide/Copy link + sr announcements), the readout privacy/feeling/edited labels, the `kindLine` connectors (with/since/of/only you), and ProfileHero's sr-only "Born" label + birth-date format | All routed through `useT`/`tp`; the birth date via `sbDate(locale)` (en identical); the "feeling {mood}" mood value and all human content stay original; en byte-identical | `social-final.js` (180)/`person-life-identity.js` (47)/`i18n.js` |
| 2026-09-13 | S1 | `app/layout.tsx` | Locale had to be resolved server-side before paint and the region suggestion mounted | Async root layout resolves locale (`resolveRequestLocale`), renders `<html lang dir>` + `LocaleProvider`, adds the pre-paint `localeBootScript` and mounts `RegionSuggestion`; theme boot unchanged | `i18n.js` (first paint / no-flash / no hydration mismatch) |

Determinism decision (§23, recorded so it is not "cleaned up"): month names are **shipped**
in `src/lib/i18n/format.ts` (`SHORT_MONTHS`/`LONG_MONTHS`), NOT read from `Intl`, and every
`Intl` formatter is pinned to `numberingSystem: "latn"`; times render as 24-hour `HH:MM`.
This is required because a browser's ICU can diverge from the SSR runtime's (e.g. Chromium
lacks Nepali date data and falls back to English while Node renders Nepali) — an
uncorrected divergence is a hydration mismatch. Native numerals are a future enhancement
gated on SSR/client ICU parity.

Owner-superseded assertions for this pass: **none.** No accepted check was weakened,
changed, or removed; English output is byte-identical throughout.

# Phase S2 — Person World + Profile Identity (owner-directed · 2026-09-13)

The Person World (`ProfileHero.tsx`) is reopened — owner-directed by the S2 brief (§3) — to
resolve the "partially centered" desktop composition and make the human, not a profile card,
lead. English output stays **byte-identical** (the accepted suites are unaffected); the frozen
i18n architecture is untouched; Moments / Composer / People / Search / Notifications / Chat /
Circle are NOT redesigned. Verified green: social-final 180, social-2030 31, circle 132,
social-connection-final 44, person-life-identity 47, my-world-2030 27, complete-my-world 62,
one-application 40, final-app 31, social-shell 68, social-2030-final 35, locale-resolution 21,
i18n 45, **s2-person-world 47 (new)**; tsc + eslint clean.

| Date | Phase | File | Reason | Behavioural effect | Test / evidence protecting it |
|---|---|---|---|---|---|
| 2026-09-13 | S2 (§3–§8) | `social/ProfileHero.tsx` | Desktop was left-aligned *inside* a block that was itself centered in the card — the "partially centered" old-social grammar (§57) | Desktop is now LEFT-ANCHORED: the identity region is `@2xl:items-start @2xl:text-left`, capped `@2xl:max-w-[760px]` so the negative space is intentional; the ring anchors the left and the name/place/Life/relationship/Born/contact form one cohesive block beside it (Born + contact moved INTO the identity column). Mobile keeps the compact centered stack. The identity row stays `@2xl:flex-row` (the accepted §10 asymmetry check holds) | `s2-person-world.js` §2 (left-aligned, ring <28% into the card, flex-row); `social-2030-final.js` §10, `social-connection-final.js` §16 unchanged and green |
| 2026-09-13 | S2 (§29/§6) | `social/ProfileHero.tsx` | View as public + cover/visibility management sat as loose stacked rows; on mobile they stacked and pushed the first Moment down | One subordinate `data-sb-owner-footer` row: desktop states View-as-public + Change-cover + Who-can-see left-aligned; mobile puts View-as-public BESIDE the Manage-profile disclosure (both small pills share a row). Owner mobile first-Moment **726 → 686px** (improved, §61) | `s2-person-world.js` §9; `my-world-2030.js` §6 (`data-sb-owner-manage` still present), `person-life-identity.js` §11 unchanged and green |
| 2026-09-13 | S2 (§55) | `social/ProfileHero.tsx` | A broken World Wall image showed a broken-image box | The cover `<img>` gains `onError` → the theme atmospheric field (the same fallback as no-cover); reset when the source changes. `data-sb-cover` reflects the effective state | `s2-person-world.js` §8 (broken Wall → fallback, no broken image) |
| 2026-09-13 | S2 (§25/§46, self-critique) | `social/ProfileHero.tsx` | The Verified badge `aria-label` was hardcoded English | Localised via `t("profile.verified")` (+ `profile.born` sr-only label localised in S1-style); en byte-identical | `s2-person-world.js` §11 (ne aria = प्रमाणित); catalog completeness (158 keys × 8) |
| 2026-09-13 | S2 (§13/§30, self-critique cycle 2) | `social/ProfileHero.tsx` | The change-photo camera button sat over the Life Ring's lower-right segments, competing with the instrument | Moved into the corner GAP outside the ring (`-right-1 -bottom-1`, smaller, card-coloured with a soft shadow) so the Life Ring reads as a clean instrument (never over the face) | `s2-person-world.js` §6 (ring/photo intact); `person-life-identity.js` ring checks unchanged and green |
| 2026-09-13 | S2 (harness only — not the product route) | `social/SocialPreview.tsx` | The Person World needed to be exercised against name/photo/wall/relationship variants the fixtures don't contain | Review-only query params (gated to `!product`): `?profileName=` (long/CJK/Devanagari names), `?photo=bad\|none\|broken`, `?wall=bad\|broken`, `?rel=<state>`. They clone the profile subject (id preserved, so owner/visitor scope is unchanged) and force a relationship. Null on the product route | `s2-person-world.js` §7–§10; `_capture-s2.js` evidence |

New: `prototype-tests/s2-person-world.js` (47 checks) + `prototype-tests/_capture-s2.js`;
`prototype-evidence/s2-person-world/**` (41 shots: owner/visitor × light/dark × 360/390/412 +
desktop, es/ne/zh, identity resilience, relationship states, View-as-public, a11y, transition).
New catalog keys (all 8 locales, en byte-identical): `profile.verified`, `profile.born`.

Documented S2 carryover (NOT changed — out of Person-World scope, and §74 protects Circle/Life
internals): the shared exact-age readout ("34y 10m 09d") and the sidebar "My life in" LifeCounter
("years · months · days", "Your Nth day…") remain English on non-English profiles. These are Life-
formatter / frozen-LifeCounter primitives shared with Moments/Composer/Circle (localising the
LifeCounter's aria would also break `social-final.js`'s `aria-label^='Unit'` selector); they belong
to the Life-localization phase. The Person World's own strings are fully localised in all 8 locales.

Owner-superseded assertions for this pass: **none.** No accepted check was weakened, changed, or
removed; English output is byte-identical throughout.

# Phase S3 + S4 — Human Activity + Human Connection (owner-directed · 2026-09-13)

Combined pass completing the two core human systems. This MODERNISES existing accepted
capability — it adds no features (no stories/followers/likes/reactions/recommendations/
gamification). The substantive work is **completing the localisation S1 deferred** (§46/§47):
the Composer, Media captions, and the DateField date grammar were on fallback English; they
are now fully localised in all 8 catalogs with English **byte-identical** (every accepted
suite renders the same English DOM and stays green). The Moment / Almanac / People /
relationship systems (accepted in Phase 4, Social 2030 Final, Final Social Connection, S2)
are audited and preserved, not redesigned. Frozen zones (S0 Cosmos, S1 i18n architecture,
S2 Person World, Circle, Chat, Search, Notifications) are untouched beyond the documented
S4 request/relationship consistency seams.

Verified green: social-final 180, social-2030 31, circle 132, social-connection-final 44,
person-life-identity 47, my-world-2030 27, complete-my-world 62, one-application 40,
final-app 31, social-shell 68, social-2030-final 35, s2-person-world 47, locale-resolution 21,
i18n 45, **s3-moments 17 (new)**, **s4-people 20 (new)**, **s3-s4-loops 14 (new)**;
tsc + eslint(src) clean; `next build` passes.

| Date | Phase | File | Reason | Behavioural effect | Test / evidence protecting it |
|---|---|---|---|---|---|
| 2026-09-13 | S3 §46 | `social/Composer.tsx` (frozen Phase 4) | The whole Composer was hardcoded English (S1 deferred it) | Every Composer string routed through the frozen S1 catalog: chrome (New/Edit moment, Post/Save/Cancel/Discard/Keep draft/Back), privacy (names + hints + "Who can see this"), the life readout (localised via `sbDate`, `latn` count), feeling, the 7 kinds (Title-case aria + lowercase small labels, both locale-complete; en aria "Meal"/"Photos & video" and small labels "media,meal,…" byte-identical — social-final's selectors hold), kind FIELDS + placeholders, the media panel (Photos/Video/Link, Paste a link, Choose photos, move/remove-photo aria, Attach video, Burn date, Caption, validation), and the footer. en byte-identical throughout | `s3-moments.js` §4 (ne no English leak; en kind words unchanged); `social-final.js` 180/180 |
| 2026-09-13 | S3 §47 | `social/Media.tsx` (frozen Phase 4) | The load-fail fallback, "Show N more photos" and "Play video, {duration}" were English | Localised (plural-correct via `tp`); the video's own baked caption stays content (§12, not translated) | `s3-moments.js` §7; `complete-my-world.js` §6 media fallback unchanged |
| 2026-09-13 | S3 §12/§47 | `social/DateField.tsx` (frozen Phase 4) | The date display used en `formatDate` ("DD MON YYYY") | Localised via `sbDate(locale)` — en byte-identical ("14 JUL 2019"), other locales get the shipped-table month; temporal precision unchanged | `social-final.js` §backdated date, `circle.js` date grammar unchanged and green |

New: `prototype-tests/s3-moments.js` (17), `prototype-tests/s4-people.js` (20),
`prototype-tests/s3-s4-loops.js` (14) + `prototype-tests/_capture-s3s4.js`;
`prototype-evidence/s3-s4-human-social/**`. New catalog keys (all 8 locales, en
byte-identical): the `composer.*` set (chrome, privacy, readout, feeling, kinds Title-case
+ lowercase, fields, placeholders, media, validation, footer), `media.couldNotLoad`,
`media.showMoreN`, `media.playVideo`.

Documented S3 carryover (NOT changed — a shared Life primitive outside S3's Moment scope,
§74 protects Circle/Life internals): the compact exact-age readout ("34y 10m 09d") and the
sidebar "My life in" LifeCounter remain English on non-English profiles. These belong to the
Life-localization phase; every Moment/Composer/People string owned by S3/S4 is localised.

Owner-superseded assertions for this pass: **none.** No accepted check was weakened,
changed, or removed; English output is byte-identical throughout.

# Phase S5 + S6 — Discovery + Signal + Motion (owner-directed · 2026-09-14)

Combined pass connecting the systems that already exist — PERSON, LIFE, MOMENTS, PEOPLE,
RELATIONSHIPS — through discovery (Search), signal (Notifications), one motion language and
state change, with two owner-directed CARRYOVER VISUAL CORRECTIONS (the S3 Composer read like
a form; the S4 People surface read like a contact directory). **No new features:** no
recommendations/trending/suggested people, followers, stories, reaction pickers, gamification,
sounds or simulated haptics. The Moment data, relationship state machine, S2 profile model, S1
i18n architecture, routes, Chat internals and the Circle are unchanged. Contract:
`docs/handover/s5-s6-discovery-motion.md`; the Composer body order in
`docs/design/composer-states.md` is updated (owner-directed supersession, see below).

Verified green: social-final 180, social-shell 68, one-application 40, final-app 31, circle 132,
complete-my-world 62, person-life-identity 47, social-2030 31, my-world-2030 27,
social-connection-final 44, social-2030-final 35, s2-person-world 47, locale-resolution 21,
i18n 45, s3-moments 17, s4-people 20, s3-s4-loops 14, **s5-discovery 48 (new)**,
**s6-motion 53 (new)**; tsc + eslint(src) clean; `next build` passes. English output is
byte-identical everywhere the accepted suites look.

New (not frozen; the accepted S5/S6 reference): `src/components/world/TransientSurface.tsx`
(`TransientSurface`, `Scrim`), `src/components/world/focus-moment.ts`,
`prototype-tests/s5-discovery.js`, `prototype-tests/s6-motion.js`, `prototype-tests/_capture-s5s6.js`,
`prototype-evidence/s5-s6-discovery-motion/**` (52 captures incl. before-references and nine
start/mid/end frame strips captured at 5× slower playback — evidence method only).

| Date | Phase | File | Reason | Behavioural effect | Test / evidence protecting it |
|---|---|---|---|---|---|
| 2026-09-14 | S5/S6 Part A (§4–§11) — **owner-directed reopening of the Composer's accepted body order** | `social/Composer.tsx` (frozen Phase 4), `social/DateField.tsx` (`quiet` prop, default off) | Owner review of the S3 evidence: the expanded mobile Composer still read like a structured form (author row, boxed "WHERE THIS SITS" block with two fields, textarea, a palette of seven equal 40px circles) | MEMORY FIRST: header carries author + privacy beside the title; the words come first (17/18px, focused, the notebook rule under them turns focus-blue instead of a 2px box ring); the coordinate is ONE sentence `today · DD MON YYYY · <age> · ⌖ place` whose date (`DateField quiet`) and place ARE the instruments — same `data-sb-readout-state` element, FROM THE PHOTO / Confirm / Change unchanged; feeling + counter; kinds as quiet glyph+word chips (media a shade stronger; 11px/500 words intact); kind fields and the media panel reveal as one group (`sb-reveal`). Machine, validation, drafts, keyboard, i18n and every `data-sb-*`/aria contract unchanged | `social-final.js` 180/180 (every Composer state), `circle.js` (date grammar), `s3-moments.js` 17/17, `s6-motion.js` §5 (order, no boxed block, chip size, reveal) |
| 2026-09-14 | S5/S6 Part A (§12–§18) | `world/People.tsx` | Owner review of the S4 evidence: search field + section headings + repeated rows + right-side pill buttons = CRM ancestry | HUMAN FIRST: face + Life Ring lead (40px; 48px + town for a person asking to connect, Accept/Decline under them on a phone), name + life beside; red **Add friend** only for a stranger; **Message** a glyph+word affordance, not a pill column; Find someone an underline; rows separated by rhythm and `--divider`. State machine, store and every `data-sb-people-*` contract unchanged. Opening a person no longer closes the panel (return context) | `social-connection-final.js` 44/44, `s4-people.js` 20/20, `social-2030-final.js` 35/35, `s6-motion.js` §6 |
| 2026-09-14 | S5/S6 §79 | `world/People.tsx` (`PeopleButton`) | Three Boom-red dots (People / Messages / Bell) competed equally on a phone; the People dot duplicated the same request already carried by the bell | People's pending indicator is steel, not boom (still real, still animation-free); message-unread and notification-unread keep red | `social-connection-final.js` §2 (present, `animationName` none) |
| 2026-09-14 | S5 §19–§33, §55 | `social/Chrome.tsx` (`TopBar`, `SearchField`) | Search treated People, Moments and Places as identical rows in a dropdown; phone search was the desktop dropdown squeezed to 92vw | `TopBar` gains `search`/`onSearch`/`surface` props and publishes `--sb-bar-h` (bar bottom edge). Search results are a transient surface: People (28px identity, name, safe band, relationship chip — `[data-sb-search-life]` contract unchanged) · Moments (words, then person ring + `name · date · place`) · Photos (image + accepted date-only text) · Places (pin, place, tally; choosing narrows to that place). Zero state = one hint + Recent; no results = the sentence + Clear. Phone = local sheet with Back · field (auto-focus) · Clear. Selecting a Moment/Photo reveals + lands on it; selecting a person opens the Person surface, focus returns to the field without re-opening (one click restores); Escape leaves without wiping the words | `social-final.js` §9, `social-shell.js` §8–9, `s5-discovery.js` §1–§6, §14 |
| 2026-09-14 | S5 §34–§44 | `social/Chrome.tsx` (`NotificationsPanel`) | In-flow panel pushed My World down; Moment events named the Moment by date only; no direct landing | Transient surface; request rows lead with a 32px identity and resolve in place (`sb-rel-resolve`); Moment rows add the Moment's own image and land on THAT Moment (`reveal` + `focusMoment`, panel closes, marks read); header wraps as whole units (ru); localized `unread` aria | `social-shell.js` §9, `complete-my-world.js` §3/§6, `social-2030.js` §1, `s5-discovery.js` §7–§11 |
| 2026-09-14 | S5 §28/§41 (additive seam) | `social/store.tsx` | A Search result / Notification can point at a Moment beyond the loaded window | New reducer action `reveal { id }`: widens the visible window to include that Moment (the same rule `post` uses). UI window only — no Moment data changes | `s5-discovery.js` §6 (m-1983 revealed + landed) |
| 2026-09-14 | S5/S6 §53, §86 | `world/PersonCard.tsx` | The destination of every discovery loop was hardcoded English and appeared with no settle | Text routes through the catalog (en byte-identical: "Add Friend", "Cancel request", "Friends", "Circle band …", the privacy sentence); `sb-surface-in` on the card, `sb-rel-resolve` on the action group keyed by state | `complete-my-world.js` §2, `social-2030.js` §2, `s5-discovery.js` §15 (ne: no English) |
| 2026-09-14 | S5/S6 §84, §86 | `world/Messages.tsx` (`MessagesButton`, `MessagesPanel`) | The utility joined the surface family; its utility text was hardcoded English | Section placed by the surface; `chat.*` keys; ring stays **28px** (the accepted dense-scale contract — a 32px draft was reverted when `person-life-identity.js` caught it) | `person-life-identity.js` §7 (28px), `complete-my-world.js` §4 |
| 2026-09-14 | S6 §65 | `social/SocialPreview.tsx` (wrapper around the frozen Hero) | My view → Public view had no perspective transition and the page's stacked panels were in-flow | Hero wrapper: `data-sb-perspective`, a 200ms opacity settle (WAAPI) and a 700ms `data-sb-perspective-switching` window that collapses the Hero's own entry replay (scoped CSS — `ProfileHero.tsx` untouched). Panels become `TransientSurface`s over one `Scrim`; exactly one open at a time, Search included | `s6-motion.js` §7 (ring stays put), §1 (one family), `s5-discovery.js` §13 (exclusivity) |
| 2026-09-14 | S6 §50–§73 | `app/globals.css` | Motion needed to be one product system | Keyframes `sb-surface-in`, `sb-scrim-in`, `sb-reveal`, `sb-target-settle`, class `.sb-press` (140ms press depth) — all collapsed by the existing global reduced-motion rule | `s6-motion.js` §1–§2, §9 |

Owner-superseded documentation for this pass (recorded, never silent): `docs/design/composer-states.md`
"Body order (binding, readout-first)" → memory-first (the Phase 4 readout-first order is
superseded by the S5/S6 brief §5–§7). No accepted assertion was weakened, changed or removed.

Suite correction (not a supersession): `prototype-tests/s3-s4-loops.js` "owner sees exact
permitted Life" hard-coded the day count `12,732` written on 2026-09-13; the prototype clock is
live time, so it failed on 2026-09-14 regardless of this pass. It now asserts the shape
(`\d{1,3},\d{3} days` or an exact age). The invariant is unchanged.

Documented S5/S6 carryovers (NOT changed): notification EVENT TEXT ("asked to be your friend",
"shared a moment", "responded to your Mustang panorama") is fixture text in `social/data.ts`
standing in for backend-provided event grammar and stays English in every locale — it belongs to
the live event contract, not the catalog. The exact-age primitive ("34y 10m 10d") stays English
(Life-localization phase, as recorded under S2/S3). `prototype-tests/s2-person-world.js` §70's
`!/12,732/` visitor check has become vacuous over time (live clock) but still asserts the exact-
age absence; left as accepted.

# Phase S7 — Device Mastery (owner-directed · 2026-09-14)

Responsive product-mastery pass: the SAME Social model recomposes per device class — no
feature, route, data, navigation (no bottom nav), semantics or frozen-architecture change.
Contract: `docs/handover/s7-device-responsive-contracts.md`; artifacts:
`prototype-evidence/s7-device-mastery/**` (60 shots + `device-matrix.png` contact sheet +
`layout-metrics.md` first-view/surface metrics). Safe areas, virtual keyboards and slow
networks are SIMULATED in desktop Chromium and labelled so — no physical-device claim.

Verified green on final source: all S0–S6 suites (counts unchanged: 180/68/40/31/132/62/47/
31/27/44/35/47/21/45/17/20/14/48/53 + devanagari crops) and **s7-device-mastery 56 (new)**;
tsc + eslint(src) clean; `next build` passes. English DOM byte-identical everywhere the
accepted suites look.

| Date | Phase | File | Reason | Behavioural effect | Test / evidence protecting it |
|---|---|---|---|---|---|
| 2026-09-14 | S7 §10–§12 (320 survival) | `shell/Brand.tsx`, `social/Chrome.tsx` (TopBar/SearchField) | At 320 the bar overflowed 9px and the Search toggle silently collapsed to zero width (an essential utility hidden); the brand was `shrink-0` so nothing could give | `Brand` becomes `min-w-0` (logo `shrink-0`): under pressure the CONTEXT WORD truncates first, the mark and utilities never. The search wrapper is a phone flex row (`min-w-9`, toggle `shrink-0`, right-aligned beside the utilities), the utility cluster `shrink-0`. One row at every width — flex-wrap was tried and rejected (a wrapping bar breaks on base sizes before shrinking; it doubled the 360 bar) | `s7-device-mastery.js` §1 (320–430: no overflow, every essential visible, bar ≤64px), §3 (40-char visitor at 360/320) |
| 2026-09-14 | S7 §15 (safe areas) | `social/Chrome.tsx`, `social/Composer.tsx`, `world/PersonCard.tsx`, `world/Messages.tsx` (MiniChat) | No `env()` anywhere — notch/home-indicator devices would clip the bar and bottom actions | Bar pads `env(safe-area-inset-top)`; Composer footer, PersonCard sheet, MiniChat and every surface cap add `env(safe-area-inset-bottom)`. Additive, zero on plain browsers | `s7-device-mastery.js` §10 (structural); simulation-labelled |
| 2026-09-14 | S7 §13 (touch targets) | `social/Moment.tsx` (frozen — Respond), `social/Chrome.tsx` (notif Accept/Decline), `world/People.tsx`, `world/PersonCard.tsx`, `social/Composer.tsx` (Post, kind chips) | Primary actions sat at 32–36px on phones where 44 was available | Phone-only `min-h-11` (44px) on Respond / Accept / Decline / Add friend / Message-primary / Post; kind chips 36px phone; **desktop sizes byte-identical** (`@2xl:` restores the accepted 36/40/32px) | `s7-device-mastery.js` §5 (44px at 360, 36px restored at 1440); `social-final` 180/180 unchanged |
| 2026-09-14 | S7 §23–§24 (scroll owners) | `social/Chrome.tsx` (Notifications), `world/People.tsx`, `world/Messages.tsx`, `world/TransientSurface.tsx` (Scrim) | Desktop panels nested two vertical scrollers (inner `@2xl:max-h-[40/50/60vh]` regions inside the capped section); touch-scrolling the scrim moved My World under a focused surface | ONE scroll owner per surface: the section scrolls, capped `min(100dvh − bar − inset-bottom, 42rem)`, `overscroll-contain`; inner caps removed; the scrim is `touch-action:none`. Desktop anchored surfaces stay non-modal (page context visible) — recorded as the intentional §24 decision | `s7-device-mastery.js` §9; `s5-discovery`/`s6-motion` unchanged and green |
| 2026-09-14 | S7 §47–§48 (tablet) | `social/SocialPreview.tsx` (two order classes) | Between @2xl and @5xl the support ASIDE (Circle module) rendered ABOVE the feed — tablet portrait reached the first Moment at 1152px, a giant widget before any life | `@max-2xl:order-*` → `@max-5xl:order-*`: Moments come first everywhere below @5xl; the Circle module follows the feed. Tablet 768 first Moment 1152 → 671px; phone and desktop DOM order unchanged | `s7-device-mastery.js` §7; `layout-metrics.md` baseline table |
| 2026-09-14 | S7 §5/§17 (short landscape) | `social/ProfileHero.tsx` (frozen — responsive recomposition only) | At 844×390 the hero consumed 2.7 screens: contact pill + management row rendered in full | At `max-height ≤ 520px` the contact pill and desktop management row compact behind the existing Manage-profile disclosure (the phone treatment). First Moment 1058 → 577px. Portrait ≥521px is bit-for-bit unchanged | `s7-device-mastery.js` §4; `s2-person-world` 47/47 unchanged |
| 2026-09-14 | S7 §50 (defect, found by evidence) | `social/SocialPreview.tsx` (SCOPED_CSS `.sb-composer-shell`) | The ≥@2xl Composer was centred by `left:50% + translateX(-50%)` — Motion animates the shell's inline `transform`, silently replacing the centring: the tablet capture caught the modal right-pinned and clipped | Centring moved to `inset:auto 0; margin-inline:auto` — transform-free, so Motion's y-settle composes. Off-centre 0px at 768/820/1440 | `s7-device-mastery.js` §7 (off-centre ≤ 8px); `social-final` composer shell checks green |
| 2026-09-14 | S7 §55 (CJK) | `social/SocialPreview.tsx` (SCOPED_CSS) | 简体中文 labels inherited the Latin small-caps tracking (1.54px on 通知) — broken kerning, not an instrument voice | `:lang(zh-Hans) .sb-social [class*="tracking-"]{letter-spacing:0.02em}` | `s7-device-mastery.js` §12 |

Owner-superseded assertions for this pass: **none.** No accepted check was weakened, changed
or removed; every prior suite runs byte-identical and green. (S6's own `s6-motion.js` §5
asserts kind chips ≤36px — the S7 phone bump keeps exactly 36px there.)

Documented S7 carryovers (NOT changed): `world/ChatSurface.tsx`'s `h-[calc(100dvh-57px)]`
hardcodes the Chat bar height — Chat is not redesigned in S7 (§87); flagged for the Chat
phase. Mock images stay single-size (no srcset) — a live-CDN concern, recorded honestly in
`layout-metrics.md`. 200% phone zoom is verified as WCAG-reflow equivalence (320px CSS
viewport), not body-zoom inside a fixed frame.

# Social R2 — Boom Expressions + Moment Conversation (owner-directed creative round · 2026-09-14)

**Owner product decision:** SYSTEMBOOM has its own animated MASCOT-BASED expression
language — this supersedes the earlier blanket prohibitions on custom emoji/reaction sets
(recorded here, never silent). Everything those rules actually protected stays protected:
no like economy, no popularity metrics, no ranking/trending, no reaction pickers in the
LIKE sense, no engagement scoring, no autoplaying loops, and Health/Problem remain
non-social. RESPOND stays the primary visible verb. Contract:
`docs/handover/moment-expression-contract.md`; mascot audit:
`prototype-evidence/social-r2-expression/15-mascot-source-audit.md`.

Mascot policy (§7–§10): the only canonical mascot is the RASTER bomb in the official logo;
`public/brand/systemboom-mascot.png` is an alpha-bounded crop (pixels untouched, no redraw,
no second mascot). Six expressions (care · joy · wonder · support · celebrate · respect)
are the SAME character plus a small surrounding SVG mark + accent (colour lives inside the
expressive object only), sharing one motion personality: quick arrival → tiny overshoot →
ONE Boom Pulse → calm settle. One-shot, event-driven, reduced-motion complete; nothing in
the feed animates on its own.

Verified green on final source: every S0–S7 suite unchanged (社final 180, shell 68,
one-application 40, final-app 31, circle 132, complete-my-world 62, person-life-identity 47,
social-2030 31, my-world-2030 27, social-connection-final 44, social-2030-final 35,
s2-person-world 47, locale-resolution 21, i18n 45, s3-moments 17, s4-people 20,
s3-s4-loops 14, s5-discovery 48, s6-motion 53, s7-device-mastery 56, devanagari crops) +
**social-r2-expression 42 (new)**; tsc + eslint(src) clean; `next build` passes; catalogs
297 keys × 8, key-complete.

| Date | Phase | File | Reason | Behavioural effect | Test / evidence protecting it |
|---|---|---|---|---|---|
| 2026-09-14 | R2 §4–§28 (new, not frozen) | `social/expressions.tsx`, `public/brand/systemboom-mascot.png` | The new primitive needed one registry + reusable components, never per-expression JSX scattered through Moment | `EXPRESSIONS` registry (id, localized name, accent, mark, placement, motion), `Mascot`, `MascotExpression` (static-first, one-shot `animate`), `ExpressionControl` (44px control beside Respond; frame-clamped rail; radiogroup with arrow keys/Escape/focus return; select/replace/re-tap-or-Remove clears; sr-status announcements), `ExpressionSummary` (≤3 marks + count; who-popover: photo + Life Ring + name + feeling, registry order, no ranking, no exact Life) | `social-r2-expression.js` §1–§3, §8, §11–§12 |
| 2026-09-14 | R2 §4/§133 | `social/data.ts` (frozen Phase 4 — additive), `social/store.tsx` | The primitive needs prototype state with the single-active invariant | Additive optional `Moment.expressions?: Record<personId, expressionId>`; seeds on three PUBLIC fixtures only (m-rain: Asha care + Bikash joy; m-panorama: Krishna wonder + Prakash celebrate + Asha joy; m-1983: Maya respect); reducer action `express` sets/replaces/removes the acting viewer's single entry. No count contract of any accepted suite changes | `social-r2-expression.js` §2, §5; `social-final` 180/180 |
| 2026-09-14 | R2 §17/§25 | `social/Moment.tsx` (frozen Phase 4) | The action region gains the SYSTEMBOOM grammar: [Respond] [mascot Expression] [counts] | `<ExpressionControl/>` after Respond and `<ExpressionSummary/>` after the responses count, both gated `!quiet` (Health/Problem excluded, like Respond). Respond keeps first `aria-pressed` position (S6 §10c contract intact) | `social-r2-expression.js` §1, §4; `s3-moments`/`s6-motion` green |
| 2026-09-14 | R2 §31–§33, §44, §49, §64 | `social/Moment.tsx` (Notes/NoteRow/NoteComposer) | Responses must read attached to THIS memory, not a generic comments section | RESPONSE BRANCH: one hairline stroke from the Almanac spine into the conversation (`data-sb-response-branch`); a one-line recent-response preview in the collapsed feed (`data-sb-response-preview`, opens the conversation); a just-sent note settles once (`sb-reveal`, onSent seam); a response author opens their Person World (`data-sb-note-author` — the §44 loop that was missing); existing order/reply-depth/edit/delete/failure semantics untouched | `social-r2-expression.js` §6–§7; `social-final` §4 notes flows byte-identical |
| 2026-09-14 | R2 §30/§94 + §36 | `social/Moment.tsx`, all 8 catalogs | Notes chrome was hardcoded English (S1/S3 carryover), and the composer carried two DEAD buttons (☺ feeling / ▣ image) that promised nothing | 10 `notes.*` keys ×8 (en byte-identical incl. the accepted selectors `Write a note…`, `Reply to …`, `Edit note`, "Couldn't send. Kept here."); the dead buttons removed — Send is now a real always-visible action; 13 `expr.*` keys ×8 | `social-r2-expression.js` §12; `social-final` note contracts green |

Owner-superseded RULES for this round (recorded): the S3/S5-era "no custom reaction sets /
no reaction pickers" blanket rules are superseded by the owner's mascot-expression
decision. `s6-motion.js` §10c is UNCHANGED and still green — it guards like-economy grammar
(`data-sb-like`, aria "React…", reaction pickers as like-menus), which R2 deliberately does
not build. No accepted assertion was weakened, changed or removed.

Documented R2 carryovers (NOT changed): sticker-scale mascot INSIDE a response needs an
additive `Note.expression` schema — seam documented, not faked (§38); double-tap shortcut
REJECTED (§62 — conflicts with photo-expand/video targets; decision recorded in the
contract); note-menu Popover label "Note" and the note-report toast remain the accepted
English fixtures pending the wider notes-localization phase; expression NOTIFICATION events
are a documented live seam, not prototype fixtures.

# Social R3 — the SYSTEMBOOM Expression language + Moment conversation (owner-directed · 2026-09-15)

R2 proved the interaction model; R3 makes the language itself the product. TWELVE expressions
in two groups, carried by the mascot's own body language; one conversation vocabulary; a calm
action bar; adaptive conversation depth. Contracts:
`docs/handover/systemboom-expression-language.md`, `moment-conversation-model.md`,
`expression-asset-contract.md`; glossary + translation-status updated (307 keys × 8).

**ASSET AUDIT (§3) — the owner's 3D mascot is NOT in the repository.** `references/brand/`
still holds only the June 2D logo. Per §3 that blocks the final ARTWORK SWAP and nothing
else: the whole language ships against documented asset slots
(`public/brand/expressions/{id}-{sm,md,lg}.webp` + the `RENDERED` set), rendering the
canonical 2D crop until the frames land — partial delivery supported, one expression at a
time. Per §6 **no facial artwork was invented**: per-expression BODY POSE (angle, lift, lean,
scale, origin) and fuse energy are implemented and real; eyes/brows/mouth remain artist work.
Honest consequence, reported rather than hidden: with the 2D fallback the FACE is identical
across all twelve, so the supporting mark still does more semantic work than §1/§5 want —
**this is the R3 blocker**.

Verified green: every S0–S7 + R2 suite unchanged in count, **social-r3-3d-expression 77 (new)**;
tsc + eslint(src) clean; `next build` passes.

| Date | Phase | File | Reason | Behavioural effect | Test / evidence |
|---|---|---|---|---|---|
| 2026-09-15 | R3 §5–§24 | `social/expressions.tsx` (R2 file, rewritten) | Six symbol-led expressions were not a language | Twelve expressions, `quick`(care·joy·laugh·wow·celebrate·support) / `extended`(respect·thanks·inspired·curious·touched·withyou); each carries pose + fuse + accent + mark + energy family; `RENDERED` asset slots; `MascotExpression` splits ENTRY (outer, animated) from POSE (inner, static) so the emotion survives reduced motion; Quick rail + a **More panel naming all twelve** (§27/§64 — the names are how the language is learned); no angry/dislike/downvote; BOOM reserved (§24) | `social-r3-3d-expression.js` §1–§3, §13–§14 |
| 2026-09-15 | R3 §31–§36 | `social/SocialPreview.tsx` (SCOPED_CSS) | One motion DNA, three energies | ENTRY → GESTURE → BOOM PULSE → SETTLE; quiet 300 / warm 380 / lively 460ms; fuse keyframes (lift·flare·burst·warm·steady); Celebrate's four local sparks. All one-shot, event-driven; the feed animates nothing on its own | `social-r3-3d-expression.js` §10 |
| 2026-09-15 | R3 §41–§44 — **owner-superseded, see below** | `social/Moment.tsx` (frozen Phase 4) | "3 responses · 1 note" put two competing conversation counts on one row (§42 forbids it) | The anonymous Respond TAP is **retired** — R2 gave feeling a home, and a second "+1" is the like-economy this product rejects. **RESPOND now writes** (opens the conversation, cursor in the composer); **RESPONSES** is the written conversation (`Note[]` keeps the storage name); **REPLY** unchanged; **NOTE** gone from the UI. Fields (`responses`/`responders`/`respondedByViewer`) stay in the model, unsurfaced — no data change, no fiction | `social-r3-3d-expression.js` §5; `social-final` 180/180 |
| 2026-09-15 | R3 §44–§46 | `social/Moment.tsx` | The foot wrapped to two rows at 360 and made every number its own action | One ACTION row (`data-sb-actions`: Respond · Expression · ⋯) that never wraps at 320/360, and one quiet PRESENCE line beneath (`data-sb-presence`: ≤3 mascot heads + people + responses). Presence is information, not actions | `social-r3-3d-expression.js` §4 |
| 2026-09-15 | R3 §48–§51 | `social/Moment.tsx` (new `MomentConversation`) | A 40-response thread destroyed the Almanac on a phone | Adaptive depth: ≤2 responses inline; 3+ on a phone opens a focused surface carrying a MEMORY HEADER (photo + Life Ring + safe life position + date · place + excerpt + media thumb), the responses, and the composer above the keyboard with the home-indicator inset. Desktop stays inline. Still one Moment's conversation — no list, no presence dots, no typing status | `social-r3-3d-expression.js` §6 |
| 2026-09-15 | R3 §56–§57 | `social/Moment.tsx` (`NoteRow`) | A per-response acknowledgement toggle was a reaction under every response | Removed — expressions stay attached to the Moment; the reducer action remains for compatibility | `social-r3-3d-expression.js` §5 |
| 2026-09-15 | R3 §65–§67, §94 | all 8 catalogs | Twelve semantic names + one conversation vocabulary | `expr.*` ×12 + `expr.more`, `conv.*` ×12, `moments.writeResponse`; `expr.wonder` → `expr.wow`; the `notes.*` set retired. 307 keys × 8, key-complete. Four emotionally-nuanced names flagged draft for native review (§66) | `social-r3-3d-expression.js` §14; `docs/i18n/translation-status.md` |

**Owner-superseded assertions (recorded, never silent; no check weakened or removed):**

- **`social-final.js` §5** — "Respond toggles on and the count updates (2 → 3)" + "tapping the
  count opens the who-responded list" are superseded by the retirement of the tap. The
  invariant (Respond is a real action reaching a real conversation) is re-asserted: Respond
  opens the conversation with the cursor in the composer, and the presence line states it
  truthfully. Note→response aria-labels/text updated alongside. 180/180.
- **`social-2030.js` §4** — the dense-people identity invariant (no band/age text) moves from
  the retired responder list to the who-EXPRESSED list, which is now this product's dense
  people list. 31/31.
- **`s6-motion.js` §10c** — the like-economy guard now reads "one Respond verb + one Expression
  control per Moment"; its emoji check expresses instead of tapping. 53/53.
- **`social-shell.js`** — the quiet-kind record check reads "its responses intact" (same object,
  new word). 68/68.
- **`social-r2-expression.js`** — R2's six-set expectations updated to the R3 twelve
  (`wonder` → `wow`, third quick option is `laugh`) and the R3 conversation vocabulary. 42/42.

Documented R3 carryovers (NOT changed): the twelve 3D renders remain artist work (the blocker
above); sticker-scale mascot inside a response still needs the additive `Note.expression`
schema — seam documented, not faked (§59); double-tap remains REJECTED (§92, R2 §62); no
custom Unicode emoji picker is built — the OS keyboard is better (§61).

# Social R3.1 — Living Expression art direction (owner-directed · 2026-09-15)

Owner verdict on R3: **the interaction architecture is ACCEPTED; the visual art is REJECTED**
— "the current expression system looks too dull. This is a visual / emotional failure, not an
interaction-architecture failure." R3.1 keeps every interaction system built in R2/R3 and
rebuilds the art direction on the owner's real 3D mascot, which **landed during this round**.

**ASSET STATUS (§3, §48) — honest, and the reason this round returns ART ASSET BLOCKED.**
The owner supplied `references/brand/WhatsApp Image 2026-09-15 at 07.40.41.png` (1055×1024,
real alpha): a dark metallic bomb with rope fuse and live spark, genuine material depth. It is
extracted and shipping at three optical sizes in `public/brand/expressions/`
(`neutral-sm` is a HEAD CROP — the fuse and feet are dropped because below ~30px they are
noise; `neutral-md`/`lg` are the full character). **One pose was supplied**, so all eighteen
expressions currently wear the same face. Per §4–§5 the FACE must change per emotion; per §48
that cannot be faked here and compensating with more symbols is forbidden. So: the language,
Deck, Library, poses, mass motion, sizes, accessibility and localization are real and
finished against the slots (`{id}-{sm,md,lg}.webp` + `RENDERED`), and the per-expression
faces are reported as **ART ASSET BLOCKED** with full per-expression briefs in
`docs/handover/expression-render-briefs.md`. The proof is the mandatory no-marks board,
`prototype-evidence/social-r3-1-living-expression/02-quick-six-no-marks.png`: with every mark
hidden the six are not tellable apart. That board is the deliverable, not a failure to hide.

Verified green: every S0–S7 + R2 suite unchanged in count, `social-r3-3d-expression` 77 → **79**
(18-expression + owned-seat updates, see below), **social-r3-1-living-expression 69 (new)**;
tsc + eslint(src) clean; `next build` passes.

| Date | Phase | File | Reason | Behavioural effect | Test / evidence |
|---|---|---|---|---|---|
| 2026-09-15 | R3.1 §10–§14 | `social/expressions.tsx` | Twelve expressions in two flat groups, with a semantic duplicate | **Eighteen** expressions carrying `quick` + an emotional `group` (energy · warmth · thought) + `energy` + **`mass`**. New: Love, Proud, Agree, Thinking, Nostalgia, Speechless. §14 resolved by dropping **Surprised** (it was Wow twice) and giving the slot to **Nostalgia** — a life-memory emotion this product needed and had no word for. §12 Care ↔ Love kept distinct in every locale (nl `Warmte`/`Liefde`, ne `स्नेह`/`माया`). The groups ORDER the library and are never tabs (§11) | `social-r3-1-living-expression.js` §1 |
| 2026-09-15 | R3.1 §19–§24 | `social/expressions.tsx`, `social/SocialPreview.tsx` (SCOPED_CSS) | The quick rail was a flat row of small icons on a plain pill — the "dull" verdict | The **QUICK DECK**: six dimensional SEATS, each a shallow machined well (recess + rim light, real material — never glow), 64px cells (68 at @2xl) holding 56px characters, with one caption line stating the semantic name of whatever the person is attending to. Attention raises the character out of its seat (a transition, so reduced motion ends it instantly while the state stays legible). More/Remove sit outside the scroller so they can never scroll out of reach | `social-r3-1-living-expression.js` §2, §8 |
| 2026-09-15 | R3.1 §24 — **owner-superseded, see below** | `social/expressions.tsx` | The selected state was a flat accent outline + dot | The chosen expression **OWNS its seat**: a deeper recess whose floor picks up the expression's own accent, plus one small **Boom notch** (a rotated square) on the rim. Shape and material, never a red circle, never colour alone | `social-r3-1-living-expression.js` §3; `social-r3-3d-expression.js` §13 |
| 2026-09-15 | R3.1 §25–§27 | `social/expressions.tsx`, `SocialPreview.tsx` | The More panel read as a settings grid of tiny icons | The **EXPRESSION LIBRARY**: a domed material ground, 54px art, 2–3 columns with breathing room, the emotional groups separated by air and a hairline (never tabs, never labels), every expression NAMED. Its scroller is capped to the room actually available above the control, measured on open — so on a phone the library can never leave the screen | `social-r3-1-living-expression.js` §4, §8 |
| 2026-09-15 | R3.1 §27–§29 | `SocialPreview.tsx` (SCOPED_CSS), `social/expressions.tsx` | Motion read as rubber-emoji bounce, ignoring that this character is a heavy metal bomb | A separate **MASS IMPULSE** layer between the entry animation and the static pose: `heavy` barely overshoots and lands hard (300ms, `cubic-bezier(.16,.86,.26,1)`), `normal` takes one clean overshoot (360ms), `light` may bound once (440ms). The Boom Pulse becomes one thin **pressure ring** leaving the character's own edge, mass-scaled via `--pulse-to` (heavy 1.62 · normal 1.85 · light 2.02) — displaced air, not a Material ripple, not a glow | `social-r3-1-living-expression.js` §6 |
| 2026-09-15 | R3.1 §32–§33, §36–§38, §50 | `social/expressions.tsx` | A whole-body character shrunk to 20px is unreadable, and the empty control showed a faded mascot | Size buckets now resolve **optical crops**: ≤30px serves the `sm` HEAD CROP (presence line, who-list, the control), 31–96px the full character at `md`, above that `lg`. The empty control wears the **neutral social mascot** at full opacity — calm and attentive, an invitation rather than a pre-stated feeling | `social-r3-1-living-expression.js` §5 |
| 2026-09-15 | R3.1 §4, §43, §62 | `social/expressions.tsx` | The no-marks test had no honest way to run | Every supporting mark carries `data-sb-mark` and `MascotExpression` takes `marks`, so marks can be removed at will and the character judged alone. Mark scale was also cut (0.5→0.38 of the art, 0.62→0.46 cradled) so the real 3D artwork leads and the symbol supports — §5, and never compensation for weak facial art | `social-r3-1-living-expression.js` §7; evidence `02-quick-six-no-marks.png` |
| 2026-09-15 | R3.1 §54 | all 8 catalogs | Six new expressions needed names | `expr.love · proud · agree · thinking · nostalgia · speechless` added to all eight locales (313 keys × 8, key-complete), marked **draft pending native review**; `expr.care` corrected in nl/ne where it collided with the new `expr.love`. English is unchanged and byte-identical | `social-r3-1-living-expression.js` §11; `i18n.js` 45/45 |

**Owner-superseded assertions (recorded, never silent; no check weakened or removed):**

- **`social-r3-3d-expression.js` §1, §2, §14** — "twelve" becomes "eighteen" and the extended
  set is re-ordered by emotional group. The invariants (one ordered registry, a distinct body
  transform per expression, every expression named in every locale, no negative expressions)
  are unchanged and now cover a larger set. 77 → 79.
- **`social-r3-3d-expression.js` §13** — "the selected expression is shown by shape/outline"
  is superseded by "shown by an owned seat + Boom notch". The invariant it protects — selection
  is never communicated by colour alone — is asserted more strictly, not less.

Documented R3.1 carryovers (NOT changed, and the reason this round is not "complete"):

- **The eighteen per-expression FACES are ART ASSET BLOCKED.** One pose exists; eyes, brows
  and mouth per emotion are artist work. Briefs: `docs/handover/expression-render-briefs.md`.
  Nothing was substituted to paper over this, and no glow, looping animation or extra symbol
  was added to compensate (explicitly forbidden by the R3.1 STOP list).
- Life Ring, privacy, the Moment model, the conversation model and the Respond vocabulary are
  untouched. Health and Problem remain records with no expression control (§17).

# Social R3.2 — Signature Living Expressions (owner-directed · 2026-09-15)

One goal: make the six primary SYSTEMBOOM expressions a signature product interaction. The
R3.1 foundation (the owner's 3D mascot, optical crops, the registry, Quick/More, responsive
surfaces, one-active invariant, privacy, localization, keyboard, reduced motion) is NOT
rebuilt — R3.2 finishes the QUICK SIX: art direction, motion, touch and brand character.

**ART CAPABILITY (§5) — determined by experiment, not assertion: NO.** This environment has
a 2D raster pipeline (sharp/libvips) and headless Chromium, but no 3D renderer and no
image-generation model. The two best attempts it can make are recorded in
`prototype-evidence/social-r3-2-signature-expression/00-art-capability-experiment.png`: a
puppet-warp squint for Laugh mis-registers into a doubled eye, and closing the grin — which
**Care and Support both require** — is a blurred rectangle across the character. The mascot's
mouth is modelled geometry (individual shaded teeth, gums, a dark lip form on a reflective
sphere under a fixed key light); it cannot be opened, closed or re-sculpted in 2D.

**Therefore QUICK SIX FINAL ART = BLOCKED, reported as such (§77).** The judgement artifact is
`01-quick-six-no-label-no-mark.png`: with every mark, label and symbol removed, all six wear
the same grin and differ only in body pose. Per §12 that is a FAIL. Exact per-expression
production specifications (eyes · brows · mouth/teeth · body angle · fuse curve · spark ·
lighting · camera · crop safety · serious-context requirements), plus the missing NEUTRAL
pose, are in `docs/handover/quick-six-render-briefs.md`. Nothing was faked, no symbol was
enlarged to compensate, no glow and no passive motion were added.

Verified green: every S0–S7 + R2 + R3 + R3.1 suite unchanged in count, **social-r3-2-signature-expression 92 (new)**;
tsc + eslint(src) clean; `next build` passes.

| Date | Phase | File | Reason | Behavioural effect | Test / evidence |
|---|---|---|---|---|---|
| 2026-09-15 | R3.2 §20–§22 | `social/expressions.tsx` | Evidence at 320/360/390 showed the single scrolling row fitting only ~4.2 of the six, at 56px — too small for a face to read | **ONE phone pattern, chosen and the other deleted: 3×2.** All six visible at 320–430 with the character at **68px** in an 84px seat; desktop keeps one horizontal row (56px in 68px). Measured at open time from `[data-sb-social-frame]`. The caption moved to its own line above the seats so it can never collide with More/Remove, and More/Remove sit in a footer outside the seats | `social-r3-2-signature-expression.js` §5–§6; evidence 06–12, 38 |
| 2026-09-15 | R3.2 §24–§25 | `social/expressions.tsx` | Tap was the only way in; the brief asks for an optional drag preview that never performs | Pointer drag across the deck previews (`data-sb-previewing`: the seat lights, the character lifts, the caption names it) and commits only on an intentional release. **TAP is untouched** — a press that never leaves its seat falls through to the button's own click. Verified: zero expression keyframes run while a finger crosses the deck, only the seat's own transition | `social-r3-2-signature-expression.js` §7 |
| 2026-09-15 | R3.2 §24 (bug found by the new suite) | `social/expressions.tsx` | A drag that committed armed `skipClick` for a click the browser then never delivered (the deck unmounts first), so the **next tap anywhere in the deck was swallowed** | `skipClick` is disarmed on every deck open | `social-r3-2-signature-expression.js` §7 ("TAP still works") |
| 2026-09-15 | R3.2 §15–§17 | `social/expressions.tsx`, `SocialPreview.tsx` (SCOPED_CSS) | Three energy families gave six expressions three temperaments | **Per-expression tempo** (Care 360 · Joy 300 · Laugh 400 · Wow 260 · Celebrate 460 · Support 380ms, inside the brief's bands) and **six per-expression gestures** (`sb-g-care/joy/laugh/wow/celebrate/support`) on top of the shared DNA. §17 fuse language completed with a new `wobble` for Laugh's short energetic flick | `social-r3-2-signature-expression.js` §8; evidence 26–31 |
| 2026-09-15 | R3.2 §16/§18 | `social/expressions.tsx` | The pressure ring's +140ms tail pushed Celebrate's one-shot to 600ms, outside its own band | The ring clears at `tempo + 60ms` — a dissipation, not a second act. Every expression's whole one-shot now lives inside its tempo band | `social-r3-2-signature-expression.js` §8 |
| 2026-09-15 | R3.2 §29–§30, §33 (self-critique — real defect) | `social/expressions.tsx` | The POSE is BODY language, and the `sm` tier is a FACE CROP with no body in it. Applying a body rotation/lift there produced a tilted, clipped head: the committed control was showing a cropped jaw | The pose applies at the `md`/`lg` tiers only (`data-sb-pose-applied`). At face scale the face IS the state. Presence miniatures also lost their marks and grew 20 → 24px | `social-r3-2-signature-expression.js` §2, §9; evidence 13–19 |
| 2026-09-15 | R3.2 §30, §37, §58 (self-critique — real defect) | `social/expressions.tsx` | The committed control was a flat `--boom-soft` circle — a coloured wash behind the mascot, exactly the "heavy button circle" §37 bans and colour-only selection under §58 | The committed control becomes the same **owned seat material** as the deck (recessed, floor tinted by the expression's own accent) with a thin **Boom rim** along its lower edge. Material and shape, never colour alone | `social-r3-2-signature-expression.js` §3 |
| 2026-09-15 | R3.2 §29, §33, §52–§53 | `prototype-tests/_build-expression-assets.js` (new), `public/brand/expressions/**` | The `sm` tier was a head-and-shoulders crop carrying a lot of body; §29 asks for a dedicated optical crop emphasising eyes, brows, mouth and a fuse cue | The asset pipeline is now a repeatable, auditable file. `sm` is a tight **face window** expressed as fractions of the source's own alpha box (so a re-render at any resolution still crops correctly); `md`/`lg` stay the full character. Measured: **sm 3.4KB · md 7.0KB · lg 17.8KB** | `social-r3-2-signature-expression.js` §2; evidence 02, 35 |
| 2026-09-15 | R3.2 §54 | `social/expressions.tsx`, `social/SocialPreview.tsx` | The deck's art loaded only on first open, and nothing said what the first paint waits on | `prefetchQuickArt()` warms the Quick Six MD **once, on idle** after Social settles (`requestIdleCallback`, 1.2s fallback); the extended set stays strictly on demand. The first Social paint waits on nothing but the 3.4KB neutral face crop the action control already needs. Deliberately no `<link rel=preload>` — it must never compete with the first Moment's photograph | evidence 35 |
| 2026-09-15 | R3.2 §1/§46, §14 (self-critique — art) | `social/expressions.tsx`, `SocialPreview.tsx` | On the bigger 3×2 character the supporting marks read as a sticker tray, and the character looked pasted onto the seat rather than resting in it | Mark scale cut again (0.38 → **0.32** of the art, cradled 0.46 → 0.40) at 0.86 opacity — the symbol supports, it never compensates. A real **contact shadow** on the seat floor (darkens, never lights) gives the character physical weight. Care's pose draws further inward (scale 0.90, 10°) and Wow's recoil is stronger (scale 1.16, −9°) so both read better statically | evidence 01, 06–12 |

**Owner-superseded assertions:** none. Every prior suite runs unchanged and green; R3.1's
own deck assertions (cell 64–72px, art 56–64px, six touch targets, More reachable) still hold
because the desktop deck keeps those exact numbers and the phone deck only grew.

Documented R3.2 carryovers (NOT changed — and the reason this round is not visually complete):

- **The six per-expression FACES are ART ASSET BLOCKED.** One pose exists. Care and Support
  both need a closed, non-grinning mouth that cannot be synthesised here; Joy and Laugh need
  open versus squeezed eyes; Wow needs wide eyes and an O mouth. Briefs:
  `docs/handover/quick-six-render-briefs.md`.
- **The NEUTRAL control also needs its own render** — the supplied pose is a mischievous
  grin, and the empty control is the most-seen mascot surface in the product (§28).
- Extended (non-Quick) expressions keep provisional art by design (§35–§36); this is stated
  in the briefs rather than presented as final.
- Life Ring, privacy, Moment data and the Respond/Responses/Reply vocabulary are untouched.

# Social R3.3 — Human Pulse (owner-directed · 2026-09-16)

R3.2's interaction architecture stands; the Quick-Six facial-art blocker stands. R3.3 solves
the SCALING problem: how many people expressing feeling around one Moment is represented
without repeating the mascot into visual noise — 1 → 100 → 10,000. Contract:
`docs/handover/human-pulse-contract.md`; evidence:
`prototype-evidence/social-r3-3-human-pulse/` (35 artifacts).

Two primitives now exist: the **LIVING MASCOT** (choosing a feeling — deck/library,
unchanged) and the **BOOM LENS** (summarising feeling — a tiny optical token: physical rim,
dedicated half-face crops per tier, ONE rim-seated semantic mark, scarce Boom-red ownership
segment; no glass, no blur, no glow). The feed aggregate is the **HUMAN PULSE**: ≤3 equal
lenses + "{n} people" — 100 × Care is ONE Care lens + 100 people; no per-expression counts in
the feed; the line is 36px tall at every scale; nothing animates passively. Tap → the
**EXPRESSION SPECTRUM** (every type present, truthful counts, canonical order, no
bars/percentages/ranking) → **people who expressed this** (40px identity, IDENTITY-ONLY,
batched, deterministic micro-variants).

Verified green: every accepted suite (counts below), **social-r3-3-human-pulse 92 (new)**;
tsc + eslint(src) clean; `next build` passes; catalogs **319 keys × 8**, key-complete,
English byte-identical outside the expression surfaces.

| Date | Phase | File | Reason | Behavioural effect | Test / evidence |
|---|---|---|---|---|---|
| 2026-09-16 | R3.3 §2–§5 | `social/expressions.tsx`, `SocialPreview.tsx` (SCOPED_CSS), `prototype-tests/_build-expression-assets.js`, `public/brand/expressions/neutral-lens-{xs,sm,md}.webp` | A whole bomb shrunk to 22px cannot summarise feeling | The **BoomLens** primitive + three dedicated optical windows cut from the mascot's alpha box (xs 1.5KB · sm 3.3KB · md 5.3KB), rim from inset shading per theme, rim-chip marks (dedicated micro-glyphs for the quick six, registry marks for extended), `data-sb-lens*` hooks, `RENDERED`-gated per-expression slots (`{id}-lens-{tier}.webp`) | `social-r3-3-human-pulse.js` §3; evidence 08 |
| 2026-09-16 | R3.3 §6 | `social/expressions.tsx` (registry) | Eighteen unrelated accent hues | Four colour FAMILIES (warmth rose · energy amber · wonder blue · connection teal-green); every accent re-derived as a family shade; **Celebrate leaves Boom red** — red is the scarce ownership colour only. Marks now draw in `currentColor` so the palette lives in ONE field. New `ExpressionDef.family` (the library-ordering `group` is untouched) | `social-r3-3-human-pulse.js` §3 (4 families); deck/library suites green |
| 2026-09-16 | R3.3 §7–§15, §25–§30 | `social/expressions.tsx` (`ExpressionSummary` rewritten as Human Pulse) | The R3 summary listed every person in one popover and could never scale | ≤3 equal XS lenses (viewer first — `owned` rim, never size), "{n} people" via `expr.peopleN` + `formatNumberLocale`; same 36px line from 1 to 1,000+; no per-expression counts in the feed; commit/change/remove update the total quietly and animate only the viewer's control; `data-sb-expression-summary` keeps its accepted attribute semantics | `social-r3-3-human-pulse.js` §1–§2, §6–§7 |
| 2026-09-16 | R3.3 §16–§20 | `social/expressions.tsx` | Detail without analytics | The **Expression Spectrum** (canonical order, truthful counts, MD lenses, one 200ms `sb-spectrum-in` expansion, reduced-motion direct) and the per-type **who-expressed** panel (PersonIdentity 40px, name, that person's lens, 24-batch + Show more, Escape steps back, focus returns). The old who-popover is superseded | `social-r3-3-human-pulse.js` §4–§5, §10 |
| 2026-09-16 | R3.3 §21–§23 | `social/expressions.tsx` (`lensVariant`) | Cloned-character repetition in people lists | Three presentation leans chosen deterministically from person·Moment·expression; same person = same variant on every open; the face never varies | `social-r3-3-human-pulse.js` §5 |
| 2026-09-16 | R3.3 §1B/§26 | `social/expressions.tsx` (control) | The committed control was an ad-hoc face-crop + rim | It IS the viewer's Boom Lens (sm, owned) and plays the same one-shot (mass impulse + pressure ring) on commit — living mascot performs, settles into the lens | `social-r3-2` §3/§12 green via the lens; `social-r3-3` §6 |
| 2026-09-16 | R3.3 §31–§32 (harness only) | `social/store.tsx` (`pulse-sim` action, `personOf` sim fallback), `social/data.ts` (`synthPerson`, `simulateExpressions`), `social/SocialPreview.tsx` (`?pulse=`) | 1/2/5/20/100/1,000/18-type states cannot come from the accepted fixtures | Review-only scale fixtures behind `?pulse=` on the style-lab route (never product): deterministic distributions, synthetic people behind `sim-` ids resolving to stable fictional identities; `100mixed`/`1000mixed` include the viewer so viewer-first ordering is demonstrable. No accepted fixture changed | `social-r3-3-human-pulse.js` §1; every count-contract suite green |

**Owner-superseded assertions (recorded, never silent; no invariant weakened):**

- **`social-r2-expression.js` §3** and **`social-r3-3d-expression.js` §who** — "tap the summary
  → the who-list" becomes "tap the pulse → the Spectrum → a feeling → ITS people". The
  invariants (real photo + Life Ring + name, never exact Life precision, never ranking) are
  unchanged and now asserted per feeling, plus a new truthful-counts/canonical-order check.
  42 → **43** and 79 → **80**.
- **`social-r2-expression.js` §9** and **`social-r3-2-signature-expression.js` §12** — the
  committed control's inner token is `[data-sb-lens]` (was `[data-sb-expression]`); same
  reduced-motion and one-shot invariants.
- **`social-r3-1-living-expression.js` §5** and **`social-r3-2-signature-expression.js` §9** —
  the presence miniatures moved from the `sm` face crop to the dedicated **Boom-Lens XS**
  optical tier; floating `[data-sb-mark]` symbols stay at zero, with at most one
  rim-integrated `[data-sb-lens-mark]` per lens (§5 of R3.3). 69 and 92 unchanged in count.
- **`social-2030.js` §4** — the dense people list sits one deliberate step deeper (via the
  Spectrum); the IDENTITY-ONLY invariant it protects is unchanged. 31/31.

Documented R3.3 carryovers (NOT changed):

- **The per-expression FACES remain ART ASSET BLOCKED** (R3.2 §77 verdict stands). Every lens
  wears the same neutral render today, stated on the evidence boards; the rim marks carry the
  type at aggregate scale until `{id}-lens-{tier}.webp` renders land — a file drop + one line.
- The R3.2 §54 idle warm of the Quick-Six MD is deliberately kept; it is the single MD on the
  wire in a long feed and is asserted as exactly that.
- Compact number forms ("1K") are NOT invented — the locale architecture has no truthful
  compact formatter, so 1,000 renders as the full locale-grouped numeral (§40).
- Life Ring, privacy, Moment data, Respond vocabulary, Health/Problem exclusion: untouched.

# Social R3.5 — Emotion Core (owner-directed · 2026-09-16)

Fixes the "all Expressions look too similar" problem WITHOUT touching Human Pulse, Spectrum,
privacy, aggregation, devices or interaction logic. The mascot becomes an EMOTIONAL VESSEL:
a precision cutaway chamber, machined into the smooth upper-right body panel of the owner's
untouched render, reveals a large internal EMOTION CORE per quick expression — heart (Care) ·
radiant sun (Joy) · laughter-waves + a real tear cue (Laugh) · blue starburst (Wow) ·
orange-red firework (Celebrate) · teal cradle holding a warm orb (Support). Emotion now reads
from INSIDE the mascot before any label; the rim-chip mark remains only as the small
secondary cue. Evidence: `prototype-evidence/social-r3-5-emotion-core/` (14 artifacts,
board 01 is the mandatory NO-LABEL test).

**Honesty:** these are COMPOSITES — the owner render + a rendered chamber (headless-Chromium
SVG over the source, real alpha), built by `prototype-tests/_build-emotion-cores.js`,
repeatable and auditable. The FACE is untouched and the R3.2 per-expression facial-render
blocker STANDS; true 3D renders replace these composites file-for-file. Two of the six lean
on their cue rather than the face (Laugh's tear, Support's cradled orb) — recorded, and both
still read within the set. The extended twelve stay on the neutral lens, stated plainly.

Verified green: every accepted suite (chain below), **social-r3-5-emotion-core 20 (new)**;
tsc + eslint(src) clean; `next build` passes. No catalog change (319 × 8 untouched).

| Date | Phase | File | Reason | Behavioural effect | Test / evidence |
|---|---|---|---|---|---|
| 2026-09-16 | R3.5 §CORE/§MATERIAL | `prototype-tests/_build-emotion-cores.js` (new), `public/brand/expressions/{six}-{sm,md,lg,lens-xs,lens-sm,lens-md}.webp`, `neutral-lens-*` reframed | The six differed only by pose + external badge | Chamber geometry (source ellipse cx 694 · cy 583 · rx 82 · ry 92, −10°): dark interior, per-core internal gradients whose light dies before the rim, inner-wall bevel consistent with the key light, machined lip with lit lower edge, one 10% crystal catch-light — no frosted glass, no neon, no HUD, no sticker. Every asset ≤ 7.2KB md / 1.8KB lens-xs | `social-r3-5-emotion-core.js` §1–§2; evidence 01–08 |
| 2026-09-16 | R3.5 §BOOM LENS | `_build-emotion-cores.js` (lens windows), `social/expressions.tsx` (`RENDERED` + six) | The lens showed eye only; the core sat outside its crop | The lens windows widen to HALF FACE + CORE (x 0.03–0.93 · y 0.375–0.845 at XS, per-tier variants); the quick six resolve `{id}-lens-{tier}.webp` / `{id}-md/lg.webp` through the existing `RENDERED` gate — the drop-in slot design did its job, zero layout/motion/test plumbing changed. Neutral lens tiers reframed to the same window so extended lenses share the composition | `social-r3-5-emotion-core.js` §3; `social-r3-3-human-pulse.js` 102/102 |
| 2026-09-16 | R3.5 §MOTION/§RULES 5–8 | `social/expressions.tsx` (BoomLens), `SocialPreview.tsx` (`sb-core-in`) | Selection needed core-activation, inside the vessel | On commit only: one ≤320ms internal energy swell (a radial accent light at the core's position, CLIPPED by the lens surface — light never leaves the mascot) → the existing mass impulse → Boom Pulse → static settle. Total stays inside each expression's R3.2 tempo band. Reduced motion: the final core is simply visible. No passive animation anywhere (asserted) | `social-r3-5-emotion-core.js` §5–§6 |

**Owner-superseded assertions (recorded, never silent):**

- **`social-r3-1-living-expression.js` §5/§7** — "all six wear the SAME face (ART ASSET
  BLOCKED)" becomes "each quick expression carries its own Emotion-Core artwork (6 distinct
  files) — and the facial renders remain artist work". The invariant was honesty about what
  differentiates the six; it still says exactly that. The presence-line src check generalises
  from `neutral-lens-xs` to the per-expression `-lens-xs` tier. 69/69.
- **`social-r3-3-human-pulse.js` §9** — the documented idle warm now legitimately covers the
  quick six's own MD deck art (six files ≤ 7.2KB each); LG still never loads. 102/102.

Documented R3.5 carryovers (NOT changed): the R3.2 facial-art blocker and its briefs
(`quick-six-render-briefs.md`) stand — the cores solve READABILITY, not the face; the neutral
control still needs its own calm render; extended-twelve art remains provisional; Life Ring,
privacy, Moment data, Human Pulse model and all counts untouched.

# Social R3.6 — Premium Living Expressions (owner-directed · 2026-09-16)

The polish round on the Emotion-Core system. Scope held to: quick tray · More panel ·
selected state · compact readability · animation/delight · light+dark quality. Human Pulse,
Spectrum, Who Expressed, privacy, Life Ring, feed logic and i18n untouched. Evidence:
`prototype-evidence/social-r3-6-premium-expressions/` (18 artifacts; board 01 is the
no-label test at large tile · tray scale · Boom-Lens scale).

| Date | Phase | File | Reason | Behavioural effect | Test / evidence |
|---|---|---|---|---|---|
| 2026-09-16 | R3.6 §CORE/§FACE | `_build-emotion-cores.js`, all six asset sets | The cores read; the face didn't participate, and the badges still hedged | Chamber grew (rx 90 · ry 99), cores scaled ×1.1; **FACE support**: a per-expression emotional catch-light on the pupil's edge; **fuse variation**: a subtle accent tinge over the spark. Additive light only — geometry untouched, the R3.2 facial blocker stands | evidence 01–07 |
| 2026-09-16 | R3.6 §QUICK TRAY | `expressions.tsx`, `SocialPreview.tsx` | The tray read as a utility sheet | External badges REMOVED from tray and library — the vessel carries the emotion (marks stay only as the Boom-Lens rim chip). Desktop tile 56→60; caption leads at 13px semibold in text colour when naming; softer 22px seats; hover/preview brightens the vessel (transition-only anticipation) | `social-r3-6-premium-expressions.js` §1; evidence 08–09, 16–17 |
| 2026-09-16 | R3.6 §MORE PANEL | `expressions.tsx`, `SocialPreview.tsx` | A flat grid | A real library: 62px tiles, names attached beneath at 12px semibold, wider panel (392/436), one staggered 240ms `sb-tile-in` arrival (≤16ms×n delay) then stillness; owned tile = inset expression ring + Boom notch | §4; evidence 10–11, 18 |
| 2026-09-16 | R3.6 §SELECTED | `expressions.tsx` | The committed control was too quiet | The control wears a 2px ring in the expression's own shade around the owned seat + Boom rim + core lens; the owned tray seat gains the same inset ring. Shape+material+colour together, never colour alone | §2; evidence 12–13 |
| 2026-09-16 | R3.6 §LIGHT | `SocialPreview.tsx` (SCOPED_CSS) | Light mode was the weakest surface | Dedicated warm-paper gradients for deck/library, crisper light wells, white hover state — designed light material, not the dark theme washed out | §3; evidence 08, 10, 12, 16 |
| 2026-09-16 | R3.6 §ANIMATION | `SocialPreview.tsx` (sb-g-* keyframes) | The sequence lacked a real anticipation phase | All six signature gestures gain a scale-dip ANTICIPATION (0–~15%) before the expressive move; full commit = anticipation → core ignition (`sb-core-in`, clipped) → mass response → Boom Pulse → static settle, inside each tempo band. **Real bug found by the new suite:** reduced motion zeroed durations but not the stagger DELAYS, leaving library tiles invisible in their from-state — `animation-delay:0` under reduce fixes it | §5–§6 |

**Owner-superseded assertions:** `social-r3-1-living-expression.js` §7 — "marks individually
removable (≥5)" becomes "the tray shows NO external badges (0)"; the invariant (never rely on
tiny external badges) is asserted directly. Suite correction (not a supersession): r3-1 §2
was accidentally measuring the focus-RISEN first seat (art×1.10); it now measures a resting
seat, same 56–64 bound. All other suites unchanged: r2 43 · r3 80 · r3-1 69 · r3-2 92 ·
r3-3 102 · r3-5 20 · **r3-6 21 (new)**; tsc/eslint clean; `next build` passes; full chain
green (run recorded below in this entry's verification).

Carryovers: the facial-render blocker and briefs stand (composites remain placeholders);
extended-twelve art provisional; neutral render still wanted.

# Social R3.7 — Gravity Expressions (owner-directed · 2026-09-16)

R3.6 behaviour is accepted; R3.7 fixes VISUAL / MOTION language only. Human Pulse, Spectrum,
Who Expressed, privacy, Life, counts and expression semantics are untouched. Three ideas:
the **EMOTION CHAMBER** (the core physically INSIDE the mascot — a bore seen obliquely, and a
real second layer in the component), the **GRAVITY DOCK** (six characters on ONE shared
ground, never six tiles), and a **five-state motion contract** (REVEAL · PREVIEW · COMMIT ·
SETTLE · RETOUCH) with CORE → BOOM LENS continuity. Evidence:
`prototype-evidence/social-r3-7-gravity-expressions/` (18 boards + 6 real-speed strips).

| Date | Phase | File | Reason | Behavioural effect | Test / evidence |
|---|---|---|---|---|---|
| 2026-09-16 | R3.7 §2–§3 | `prototype-tests/_build-emotion-cores.js`, all six asset sets, `neutral-lens-*` | The core looked inserted into a circular badge, not living inside the body | The chamber is a **bore seen obliquely**: the machined lip stays, the actual opening (r 84) is offset toward the lower-right inside it, so the shell wall reads thick upper-left / thin lower-right; the core is drawn deeper and ×1.3, partly UNDER the wall, with the wall's cast shadow across it and its own light reflecting on the lit far wall. `--layers` renders shell → aperture → core → assembled for board 06. **Lens windows are core-led** (XS/SM x .40–1.0 · y .35–.83; MD x .22–1.0): the chamber fills ~40% of the lens, brow/eye-edge/teeth still say SYSTEMBOOM. Face untouched — the R3.2 facial blocker stands | `social-r3-7-gravity-expressions.js` §2, §6; evidence 06, 16 |
| 2026-09-16 | R3.7 §2, §14 | `social/expressions.tsx` (`MascotExpression`) | Depth had to be real in the component, not only in paint | `data-sb-core-layer`: the same artwork as a background span clipped to the opening (`OPENING_AT`), so on a pointer preview the shell rises 4px and the core lags ~1.5px (micro-parallax, transition-only, inside `prefers-reduced-motion: no-preference` — none under reduce). `preview` prop mounts a one-shot ~120ms **chamber wake** per expression (`sb-cw-*`: Care fills · Joy radiates · Laugh compresses/releases · Wow contracts→snaps · Celebrate rises · Support closes) — light inside the opening, never the expression | §3, §11 |
| 2026-09-16 | R3.7 §4–§5, §11–§12 — **owner-superseded, see below** | `social/expressions.tsx`, `SocialPreview.tsx` (SCOPED_CSS) | Six machined wells read as six app tiles | **GRAVITY DOCK**: seats are transparent hit targets (68/84px) on ONE ground with one directional light (Deep Cosmos / Solar Observatory warm ground); desktop places the six on a shallow symmetric arc (`translate` 10/4/0/0/4/10px, a ±3° lean applied to the artwork via `--lean` so hit boxes stay axis-aligned); phone keeps the 3×2 spatial field. Contact shadows ground each character. The chosen one rests inside an **orbit ring** in its accent (inset 2px, direct child) + Boom notch. Caption row now carries More/Remove (still outside the seats). **REVEAL**: `sb-rise-in` 120ms, 12ms stagger, ≤180ms total | §1, §9–§10; evidence 01–03 |
| 2026-09-16 | R3.7 §6, §8 | `social/expressions.tsx` (`commit`, `data-sb-core-flight`), `SocialPreview.tsx` | Commit shrank a whole mascot into the action row | **CORE → BOOM LENS**: the chamber's real position is measured before the dock lets go; a 220ms flight (the lens crop, `sb-core-flight`) converges on the control while the control's own lens + gesture + ignition + mass + pulse play (unchanged, inside the tempo band); the dock **fades 140ms, inert** (`data-sb-closing`) so the flight visibly leaves a body that is still there. Reduced motion: no flight, no fade, final state at once | §4, §11; evidence 07–15, rs-* |
| 2026-09-16 | R3.7 §6 RETOUCH | `social/expressions.tsx`, `SocialPreview.tsx` | Tapping the committed control only opened the dock | The control answers with a 160ms core + rim response (`data-sb-retouch` → animation on the lens ROOT, never on the surface that carries the commit animations); the dock still opens. Never the full commit again | §5 |
| 2026-09-16 | R3.7 §9 | `social/expressions.tsx` (control) | The selected state beside Respond was too small | Chamber-led SM lens at **36px** in a 40px (desktop) / 44px (phone) control, with the accent ring, owned material (`sb-ctrl-own`) and Boom rim | §6; evidence 16 |
| 2026-09-16 | R3.7 §10 — **owner-superseded, see below** | `social/expressions.tsx` (field) | More resembled a settings/emoji grid | **EXPRESSION FIELD**: eighteen free-standing characters (no card, 62px, name beneath) in four **family bands** — warmth · energy · wonder · connection — each band's ground faintly warmed by its tone, separated by air + hairline, never tabs. `LIBRARY` (canonical order for the Spectrum) is unchanged. **Real defect fixed**: the panel was centred on the control and, at desktop, the Moments sheet clipped its left third (never captured at 1440 before) — it now hangs from the control and is frame-clamped like the dock | §7; `social-r3-1` §4, `social-r3-3d` §2; evidence 04–05 |

**Owner-superseded assertions (recorded, never silent; each invariant restated):**

- **`social-r3-1-living-expression.js` §1** and **`social-r3-3d-expression.js` §2** — library order
  "quick six first, then energy · warmth · thought" → "four family bands, warmth · energy ·
  wonder · connection, each quick expression leading its family". Still all eighteen, one
  stable order. 69/69 · 80/80.
- **`social-r3-1-living-expression.js` §2** — "each seat is a machined recess (inset shadow)" →
  "each seat is a transparent hit target on ONE shared ground". Dimension still from material
  (ground + contact shadow), never glow. 69/69.
- **`social-r3-2-signature-expression.js` §6** — "one row = identical tops" → "one row: x strictly
  increasing, tops within a 14px band" (the desktop arc). 92/92.
- **`social-r3-2-signature-expression.js` §7** — "zero keyframes while a finger crosses the deck"
  → "zero EXPRESSION keyframes" (`sb-cw-*` chamber wake ≤140ms and the dock's own `sb-rise-in`
  are preview/reveal, never the expression). 92/92.

Suite note (not a supersession): `social-r3-7` excludes the LifeCounter's per-second digit
roll (`sb-roll`) by name from its "nothing running" checks — it is the accepted Life
instrument and outside R3.7.

Verified green on final source: all prior suites unchanged in count, **social-r3-7-gravity-expressions 37 (new)**;
tsc + eslint(src) clean; `next build` passes; catalogs untouched (319 × 8).

Carryovers: the per-expression FACIAL renders remain ART ASSET BLOCKED (R3.2 §77; briefs in
`quick-six-render-briefs.md`) — the chamber composites are the honest interim and true renders
replace them file-for-file; extended-twelve art provisional; neutral render still wanted.

# Social R3.8 — Emotion Horizon (owner-directed · 2026-09-16)

R3.7 mechanics accepted; the owner's visual verdict on the picker: "still an old reaction menu —
six repeated copies of the same mascot". R3.8 changes the INTERACTION CONCEPT: **ONE vessel
mascot + six EMOTION CORES on a shallow horizon**; preview puts the core into the vessel; commit
sends the core into the chamber, the vessel performs, and the chamber collapses into a
chamber-shaped Boom Lens. "More" is the **Emotion Atlas** — the same vessel, eighteen cores in
four family bands. Human Pulse / Spectrum / Who logic, privacy, Life, counts and expression
semantics are untouched. Evidence: `prototype-evidence/social-r3-8-emotion-horizon/` (18 boards +
6 real-speed strips; 01 is the R3.7 picker beside 02–03 for the owner's A/B).

| Date | Phase | File | Reason | Behavioural effect | Test / evidence |
|---|---|---|---|---|---|
| 2026-09-16 | R3.8 §3–§4 | `prototype-tests/_build-emotion-horizon.js` (new), `public/brand/expressions/{18}-core.webp`, `neutral-chamber-{md,lg,lens-xs,lens-sm,lens-md}.webp` | The emotions needed to be selectable OBJECTS, not mascot clones | Eighteen CORE OBJECTS rendered as lit translucent orbs (one key light upper-left, specular, dark inner rim, the emotion's form inside): the quick six from the bespoke R3.5 core drawings; the extended twelve as PROVISIONAL family-toned orbs carrying their registry glyph (stated as provisional). Plus the NEUTRAL DORMANT CHAMBER — the vessel with an empty bore — for the hero at rest and the closed control. `_build-emotion-cores.js` became an importable module (main guarded) | `social-r3-8-emotion-horizon.js` §1–§2; evidence 05 |
| 2026-09-16 | R3.8 §11, §18 | `_build-emotion-cores.js` (LENS35), all lens tiers | At compact scale the core must dominate | Lens windows tightened onto the chamber (XS/SM x .55–1.0 · y .42–.76; MD x .40–1.0 · y .36–.82): the opening fills ~55% of the lens; lip, brushed body and lower teeth remain the SYSTEMBOOM cue | §5, §7; evidence 13, 16 |
| 2026-09-16 | R3.8 §1–§2, §5–§8 — **owner-superseded, see below** | `social/expressions.tsx` (`ExpressionControl`), `SocialPreview.tsx` (SCOPED_CSS) | Six mascot seats read as a reaction menu | **EMOTION HORIZON**: a local field growing from the control (masked edges, no border, radius 18, one directional light; Solar Observatory warm in light) holding ONE vessel (100px desktop / 88px phone, contact shadow, dormant chamber until attended) and six core objects (44/36px in 56/46px hit targets) on a shallow horizon whose outer cores sit higher. PREVIEW (hover/focus/drag): the core rises and leans toward the chamber, the vessel renders that expression (chamber wake + a small `sb-hero-preview` gesture), the label names it. `data-sb-deck-pattern="horizon"` on every device; caption row keeps More/Remove | §1, §3, §9–§10; evidence 02–04, 06–09 |
| 2026-09-16 | R3.8 §9–§10 | `social/expressions.tsx` (`commit`, `data-sb-core-flight`, `data-sb-lens-flight`, `data-sb-landing`), `SocialPreview.tsx` | The commit had to be one continuous object | Three stages, ≈300–500ms: the core ACCELERATES into the vessel's opening (120ms, ease-in) while the others recede → the shell LOCKS it (`sb-lock` + the expression's `sb-g-*`, ignition clipped to the opening, mass, fuse, Boom Pulse on the VESSEL) → at 120 + 0.4·tempo the activated chamber collapses into the lens beside Respond (200ms) while the field fades, inert; the control's lens stays hidden until it LANDS (`land`: a 220ms thump + one 240ms ring — the gesture already happened; the whole event is over inside ~820ms even for Celebrate). The store is true from the tap. A tap on the control mid-performance snaps to the final state. Reduced motion: final state at once | §4, §11; evidence 10–12, rs-* |
| 2026-09-16 | R3.8 §11–§12, §21 | `social/expressions.tsx` (`BoomLens`, `LensShell`, `DormantLens`, `lensClip`) | The circular lens still read as a badge; the closed control showed a tiny mascot | The Boom Lens IS the oblique chamber aperture: a rotated ellipse (`clip-path: path()`, per px size) with a drawn metal SHELL FRAGMENT (thick upper-left, thin lower-right) and the Boom-red ownership segment on the lower rim; the same object at 22/28/36/40px, so Human Pulse, Spectrum and Who wear it with no logic change. Closed control: `DormantLens` (empty bore) before a choice, the selected core after — `data-sb-express-neutral` now points at `neutral-chamber-lens-sm.webp` | §5, §7; `social-r3-3-human-pulse.js` 102/102 |
| 2026-09-16 | R3.8 §13 — **owner-superseded, see below** | `social/expressions.tsx` (Atlas) | The Field was eighteen repeated bombs | **EMOTION ATLAS**: the same vessel stays on stage; eighteen cores (40px, named beneath) in four family bands; attending any core previews it in the vessel; scroller capped to the room above the control minus the stage | §6; `social-r3-1` §1/§4, `social-r3-3d` §2; evidence 14–15 |
| 2026-09-16 | R3.8 §22 (defect found by `social-r3-1` §8) | `social/expressions.tsx` | 6 × 48px hits + 24px padding overflowed a 320-wide frame | Phone cores 46px hits / 36px orbs with 16px field padding (297px ≤ the 304 available); desktop unchanged | `social-r3-1` §8, `social-r3-2` §5 (320/360/390/430) |
| 2026-09-16 | R3.8 §8 (defect found by `social-r3-2` §7) | `social/expressions.tsx` (`seatAt`, drag move) | A finger between two cores (the horizon has gaps; the old 3×2 had none) previewed nothing: leaving a core into the gap fired its `pointerleave` (clearing the preview) and the move handler saw the same nearest core, so it never re-set it | Drag falls back to the nearest core within 12px inside the radiogroup and re-asserts the preview on every move — no dead zones on the horizon | `social-r3-2` §7 |

**Owner-superseded assertions (recorded, never silent; each invariant restated on the one vessel):**

- **`social-r3-1` §1** and **`social-r3-3d` §2** — library structure read from mascots
  (`data-sb-expression-group`, per-tile poses/energies) → read from the Atlas's four family
  bands and from the vessel while attending each core (12 sampled, ≥10 distinct poses, 3
  energies). **§2** — six mascot seats (64–72px cells, 56–64px art) → six core hit targets
  (44–72px) holding 36–48px core objects on one ground. **§4** — Atlas art ≥36px, 4–6 per row.
  **§5** — the closed control wears the dormant chamber lens; the horizon shows `-core.webp`.
  **§6/§7/§10** — mass, impulse, pose and reduced-motion pose checks move to the vessel (the
  impulse plays on the vessel at ~+200ms; settle checked at +1100). 69/69.
- **`social-r3-2` §1/§2/§8/§12** — distinct poses, masses, energies, tier and render are read from
  the vessel per attended core; the commit's gesture/tempo/pulse are sampled on the vessel at
  +200ms; "no LG in the action row" now reads "no LG as a picker tile" (the vessel legitimately
  renders LG on desktop). **§5/§6** — `3x2` / `row` → `horizon`; per-option art 56–68 → cores
  34–48 under one 84–110px vessel. **§7** — preview keyframes exclude `sb-hero-preview`. 92/92.
- **`social-r3-5` §1/§5/§8** — six `-core.webp` on the horizon; ignition sampled on the vessel
  (`data-sb-core-ignite`, clipped to the opening); the untouched Moment wears the dormant
  chamber. 20/20.
- **`social-r3-6` §1/§4/§5/§7** — tray art 60 → core 44; Atlas art ≥36; the commit sequence
  sampled on the vessel at +200ms; 360 = one vessel + six 36px cores. 21/21.
- **`social-r3-7` §1–§4/§10/§11** — dock → horizon (`.sb-core-body`, `translate` offsets, outer
  cores HIGHER), the chamber layer/wake/parallax on the vessel, the flight is the core entering
  the chamber, 360 cores 36px. 37/37.

Suite corrections (not supersessions): the "nothing runs a second later" checks in
`social-r2` §motion, `social-r3-3d` §motion, `social-r3-5` §5 and `social-r3-6` §5 now exclude
the sidebar LifeCounter's per-second digit roll (`sb-roll`) by name — it is the accepted Life
instrument, not the feed, and those checks had only ever missed it by timing luck (a 220ms tick
every second). The invariant — no expression motion after the one-shot — is unchanged.

Verified green on final source: every prior suite unchanged in count except the recorded
supersessions above, **social-r3-8-emotion-horizon 34 (new)**; tsc + eslint(src) clean;
`next build` passes; catalogs untouched (319 × 8).

Carryovers: FACIAL renders remain ART ASSET BLOCKED (R3.2 §77) — the cores solve recognition
without pretending to be faces; extended-twelve cores are provisional family orbs; neutral render
still wanted.

# Social R3.9 — Signature Emotion Engine (owner-directed · 2026-09-16)

R3.8's architecture (one mascot · Emotion Horizon · cores · Boom Lens · Human Pulse · Spectrum)
is accepted and NOT rebuilt. R3.9 makes committing an expression ONE local EMOTIONAL EVENT:
CORE AWAKENS → CHARACTER RESPONDS → THE EMOTION ESCAPES INTO LOCAL SPACE → SHELL AND GROUND
RECEIVE THE LIGHT → BOOM IMPULSE → COLLAPSE INTO THE LENS → COMPLETE STILLNESS (≤ ~900ms even
for Celebrate). Plus WORLD LIGHT (a persistent theme-truthful ambient, distinct from the
short-lived emotion light). Evidence: `prototype-evidence/social-r3-9-signature-emotion-engine/`
(26 boards + 6 real-speed strips + `SIGNATURE-EMOTION-ENGINE.png`, the one-image filmstrip).

**§2/§39 capability gate, honestly re-verified this round:** this environment has NO
image-generation or image-edit capability (checked: no such tool exposed; no generative model on
the host — sharp/PIL/Chromium are raster tools). The R3.2 experiment (2D warps fail visibly on
the modelled mouth) stands, so the seven true facial renders remain **ART ASSET BLOCKED** and
board 02 states it on its face. Nothing was faked to close it.

| Date | Phase | File | Reason | Behavioural effect | Test / evidence |
|---|---|---|---|---|---|
| 2026-09-16 | R3.9 §7–§13 | `prototype-tests/_build-emotion-events.js` (new), `public/brand/expressions/{care,joy,laugh,wow,celebrate,support}-energy.webp` + `joy-ray` / `laugh-wave` / `celebrate-ember` / `support-arc` | The feeling had to briefly ESCAPE the chamber as physical energy, never stickers | Ten free ENERGY forms — the chamber's own core drawings rendered standalone with a tight emission falloff and the key light baked into their gradients (a wrongly-lit form cannot happen); every file ≤ ~10KB WebP | `social-r3-9` §1, §11; board 26 |
| 2026-09-16 | R3.9 §7–§17 | `social/expressions.tsx` (`EmotionEvent`, mounted on the stage only while performing), `SocialPreview.tsx` (`sb-ev-*` keyframes) | Commit was a state change with a flight, not an emotional event | Per-expression events in REAL DEPTH (bg pieces pass BEHIND the vessel z0 < vessel z1 < mg z2 < fg z3): **Care (hero)** — one large dimensional heart toward the viewer + two smaller at other depths; **Joy** — four controlled light rays + a warm sheen crossing the shell; **Laugh** — two rhythmic resonance waves + ONE transparent droplet; **Wow** — collapse → one restrained pressure ring toward the viewer + a cool reflection over the metal; **Celebrate** — five embers on believable gravity arcs; **Support** — two structures closing gently around the orb, energy settling DOWN. Every event: a shell light AT the chamber in the expression's accent + a restrained ground reflection (light has a source, §16); one-shot; unmounted with the field; never mounted under reduced motion. The collapse now starts at 120 + 0.7·tempo so the event owns the stage first | `social-r3-9` §1–§3, §9–§10; boards 03–13, rs-*, filmstrip |
| 2026-09-16 | R3.9 §14–§16, §31–§32 | `SocialPreview.tsx` (`--wl`/`--wl-a` tokens, stage rim/ground application, `?worldlight=` harness param + frame attr) | The mascot had to belong to THIS person's World without the World changing any emotion's meaning | **WORLD LIGHT**: a persistent ambient tone — Deep Cosmos cool / Solar Observatory warm (the live seam is the World Wall's atmosphere token, which does not exist in this repo yet; the shipped truth source is the theme material, honestly documented) — applied at 10–14% opacity to the vessel's upper-left rim (screen blend), the contact-shadow tint and the ground pool ONLY. Emotion light is the second, short-lived system: a warm World still receives Wow's blue (asserted). Harness-only `?worldlight=warm\|cool` forces a tone for review | `social-r3-9` §4; boards 16–18 |
| 2026-09-16 | R3.9 §18–§19 | `SocialPreview.tsx` (horizon chrome) | Screenshot test: the eye still met a rounded popup first | Radius 18→16, shadow halved, edge mask strengthened (dissolves to 22% at the rim) — mascot + cores lead | `social-r3-9` §6; boards 14–15 |
| 2026-09-16 | R3.9 §34 | `social/expressions.tsx` | Motion must respect humans | Scrolling is never locked; a route change/unmount clears every timer; choosing another expression mid-event snaps the old commit to its final state first — events never stack (asserted ≤1 container) | `social-r3-9` §5 |

**Owner-superseded assertions: none.** Two timing-constant suite corrections (invariants
unchanged): `social-r3-8` §4's stage-3 sample time moved from 0.5·tempo to 0.7·tempo (the R3.9
collapse timing), 34/34; `social-r2`'s Celebrate settle check measures at 1150ms instead of a
knife-edge 900ms — the one-shot nominally ends ~885ms and chain-load setTimeout jitter alone
pushed it over. 43/43.

Critique loop (§48, run for real — 10 found → fixed, then 5 → fixed):
1–3 (during build): the horizon fade began before Care/Wow's event finished (collapse 0.55→0.7·tempo);
the Joy/Wow metal sheen escaped the vessel as a fog block over the Moment (now clipped to the
vessel's silhouette bounds); Joy's rays were too small to read (0.34→0.52·px, longer travel).
4: every screencast board showed the rest frame — the frame picker compared relative times against
absolute CDP timestamps (capture bug, fixed). 5: the Care heart was washed out by its own halo
(inner form 0.92→1.14, tighter halo, fg heart 0.52→0.66·px, duration ×1.15). 6: Support's arcs
were unreadable at 42px (stroke 20→30, size 0.6·px). 7: "collapse" frames were picked after the
fade (now +12ms into it). 8: the lens crop caught feed content above the control. 9: the ground
reflection was imperceptible (opacity .5→.72, wider). 10: the passive board lacked the running-
animation count (now printed on the board). Pass 2 (5): collapse depiction, Support arc legibility
re-check, light-mode Care peak verified as strong as dark, lens-cell crops, filmstrip stage labels
for pre-tap frames.

Verified green on final source: every prior suite unchanged in count,
**social-r3-9-signature-emotion-engine 31 (new)**; tsc + eslint(src) clean; `next build` passes;
catalogs untouched (319 × 8); no new dependency, no WebGL, no particle engine, no persistent RAF.

Carryovers: the seven true FACIAL renders remain ART ASSET BLOCKED (briefs stand; the chamber,
cores and events carry meaning honestly until they land); extended-twelve cores provisional;
the World-Wall atmosphere token is a documented live seam (`s5-s6`-style — theme fallback ships);
a native haptic pattern could map to anticipation → core lock → Boom impulse (documented only, no
web fake).

# Social R3.9.1 — Emotion Signet (owner-directed · 2026-09-17)

Owner audit of the shipped selected state (light mode screenshot): "after the user chooses, at
last it only seems like a round." Verdict accepted — the resting Boom Lens was a 36px crop of
the dark chamber: on a light page a dark hole with a fleck of core, a continuity break (the
person touches a LUMINOUS ORB and receives a DARK DISC), an accent halo that read as a focus
ring, and — worst on screen — the browser's rectangular focus outline around a spherical core.

| Date | Phase | File | Reason | Behavioural effect | Test / evidence |
|---|---|---|---|---|---|
| 2026-09-17 | R3.9.1 | `social/expressions.tsx` (`BoomLens`, `LensShell`), `SocialPreview.tsx` (`--sig-*` tokens, `.sb-signet-*`) | Emotion first, shell second — at rest, not only in the brief | **EMOTION SIGNET**: the resting lens is the EXACT core object the person touched (`{id}-core.webp`, ~82% of the disc) seated in the oblique chamber aperture (same `lensClip` ellipse at −12° — the chamber identity, never a circular badge) on a dark seat well, ringed by machined theme metal (`--sig-*`: dark steel in Deep Cosmos, warm brass in Solar Observatory) with the EMOTION'S LIGHT on the top arc (the rim lit by the core — §16 physics) and the scarce Boom-red segment machined into the lower rim for ownership. Perfect object permanence: horizon orb → chamber → the ORB ITSELF returns as the lens (the collapse flight now carries the core, not a chamber crop). Dormant control keeps the empty-aperture chamber crop (`neutral-chamber-lens-sm.webp`) in the same ring. Human Pulse, Spectrum and Who inherit automatically — architecture untouched | `social-r3-8` §5/§7, `social-r3-9` §10, boards below |
| 2026-09-17 | R3.9.1 | `social/expressions.tsx` (LENS_MARK removed), `SocialPreview.tsx` | The rim chip was a second tiny symbol beside an orb that now IS the symbol | The rim-chip micro-glyphs are retired — redundancy, not information. The invariant (never a floating sticker; ≤1 rim-integrated mark) is unchanged and still asserted. `lensSrc` stays exported as the documented slot for the true facial renders (the compositor still builds the optical tiers) | `social-r3-3` §3 (`marks ≤ 1` holds at 0) |
| 2026-09-17 | R3.9.1 | `SocialPreview.tsx` (`.sb-core:focus-visible`) | The browser's rectangular focus outline was the cheapest pixel on the page — form-control language around a spherical object, duplicating orbit + notch + caption | Custom circular focus: `outline:none` + a 2px accent ring with a soft halo (border-radius follows the core button; 14px on Atlas cells). Keyboard visibility preserved — one selection language | screenshot evidence; keyboard flow suites green |

**Owner-superseded assertions (recorded, never silent; each invariant restated):** every
compact-lens SRC contract moves from the optical crops to the signet's core object —
`social-r3-1` §5 (presence `-lens-xs` → `-core`), `social-r3-2` §9 (miniatures), `social-r3-3`
§3 + asset audit (feed signet, long-feed tier list), `social-r3-5` §3/§4/§6/§7 (pulse/Spectrum/
reduced/serious; **extended twelve now wear their provisional family-orb cores** — `respect-core.webp`
instead of the neutral lens, stated provisional), `social-r3-6` §2, `social-r3-7` §6 (distinct-file
hashes now over the cores), `social-r3-8` §5. The invariant in all of them — the compact state
carries each expression's own distinct emotion, never a shrunken mascot, never colour alone — is
asserted unchanged (shape `chamber`, `path()` clip, shell, inset rim all still checked).

Verified green on final source: full chain (all 31 suites + devanagari) after the change;
tsc + eslint(src) clean; `next build` passes. No new assets (the 18 core orbs already existed);
no motion added at rest.

# Phase 4.4-A — Moment + Respond truth (owner-directed · 2026-09-23)

A truth-restoration slice, not a redesign. It fixes places where the prototype published
against the person's intent, corrupted a Moment, showed owner-only data under "View as public",
broke the phone conversation, or claimed success it did not have. The baseline is the Phase 4.3
audit (`references/social-bible-audit/phase-4.3/`); the IDs below (A1…A26, MC-/RS-/CO- rows,
P0-3/4/5) are that package's.

**Not in this slice (owner decisions stay open):** D-1 life position on other people's Moments,
D-2 what `friends` means, D-3 Celestial's launch posture, D-4 whose Moments a World holds. The
Life-position policy, visitor ring density, relationship architecture, notifications, Chat,
Place, permalinks, View in Life and the Celestial phone row (P0-6) are untouched.
`expressions.tsx` is byte-identical; no Celestial file was edited (the owner's uncommitted Light-mode work in them is untouched).

**Prototype vs live.** Everything below is enforced in the client prototype only (reducers +
fixtures, no server). The matching live requirements are written into
`docs/handover/social-api-contract.md` §D / §D.4 and are NOT implemented by this repository.

| Date | Phase | File | Reason | Behavioural effect | Test / evidence |
|---|---|---|---|---|---|
| 2026-09-23 | 4.4-A (A2, P0-4) | `social/Composer.tsx` | Edit rewrote `at` to `T12:00:00` from both branches of a dead `initialTime` and never touched `atPrecision` (an edited 07:40 Moment read "12:00" and moved in the chronology) | Same date → the Moment's own `at` and `atPrecision` are kept exactly. A deliberately moved date → `atPrecision:"day"` (noon is only the sort anchor), and `sharedAt` keeps provenance (unchanged, or the original `at`). `initialTime` removed | `social-4-4a-truth.js` §1 |
| 2026-09-23 | 4.4-A (A3, P0-4) | `social/Composer.tsx` | Edit rebuilt link and video media from mock constants and dropped any photo not in the mock library | An edit keeps the Moment's own media object unless the person changes it (a kept link keeps its description/image, a kept video its poster/duration/caption); photos outside the library keep their place as `orig-<i>` | §1 (photos, link, video byte-identical after edit) |
| 2026-09-23 | 4.4-A (A4, P0-4) — **runtime-verified defect** | `social/Composer.tsx` | Discard during the 900 ms Posting window still published the Moment (default Public): the timer was never cleared | The one pending publication lives in a ref and is cleared on Discard, Cancel, Escape and unmount; Cancel/Escape while posting cancels first, then asks. The body is `inert` while posting (composer-states.md "every control disabled") so no edit can race the pending post | §2 (Cancel→Discard, Escape→Discard, Cancel→Keep draft; control: an uninterrupted Post publishes) |
| 2026-09-23 | 4.4-A (A9) | `social/Composer.tsx`, `social/store.tsx` (`Draft.videoCaption`) | Kind fields leaked across kinds (a Meal's `with` posted on an Activity); the burned-in video caption rode on `fields.title`, the Problem kind's title | Only `KIND_FIELDS[kind]` keys are posted/edited; an ordinary Moment carries no `fields`. The video caption is its own draft field | §5 |
| 2026-09-23 | 4.4-A (A10) | `social/Composer.tsx` | Photos, video and link could all be attached; submit silently kept one | The UI enforces the current one-type media contract: once one kind is attached the others are disabled with the reason stated (`composer.oneMediaKind`). D-20 governs any extension | §5 |
| 2026-09-23 | 4.4-A (A11) | `social/Composer.tsx`, `social/DateField.tsx` (`min`) | Dates before the author's birth were accepted and showed a negative age, while the Circle refuses them | Refused with the Life rule's own sentence ("That date is before this life began."), Post disabled, no negative age, the date field starts at the birth date. This enforces the established rule; D-17 covers only future ancestral records | §5 |
| 2026-09-23 | 4.4-A (A12) | `social/Composer.tsx`, `social/store.tsx` (`personOf`), `social/data.ts` (`Person.unavailable`, `unavailablePerson`), `social/view-model.ts` (guard) | An unmatched "with" name was stored as a person id and then resolved to the real fixture person "M" | Only resolved people are stored; unmatched names are said out loud (`composer.peopleNotFound`) and the field shows who was recorded. An unknown id resolves to a neutral "unavailable" identity (name "—", band-less via a one-line view-model guard, never listed among people present) — never to another person | §5 (+ unit check) |
| 2026-09-23 | 4.4-A (A14) | `social/Composer.tsx` | Closing an edit with changes dropped them without asking | "Discard your changes?" with Discard changes / Keep editing | §1 |
| 2026-09-23 | 4.4-A (A1, P0-3 part 1) | `social/store.tsx` (`PreviewScope`, `previewing`), `social/SocialPreview.tsx` (`MomentsSheet`), `social/Moment.tsx`, `social/LifeCursor.tsx` | "View as public" applied the public stand-in to the Hero and Circle only; the feed, conversations, menus and Life Cursor still rendered as the owner (exact ages, only-me Health/Problem) | The Moments sheet renders inside `PreviewScope`: `me` is the public stand-in for rendering, the feed is ordered for it (no only-me Moment), and every write dispatched inside is refused (only loadMore/reveal/landed pass). Boom and Resonate are wrapped `inert` there (no Celestial/Boom file touched); composers and person doorways are not rendered; a stranger's menu shows, paused; the pause is stated once. **Part 2 is not settled**: `friends` Moments and other authors' Moments are exactly as the owner view has them (D-2 / D-4, Phase 4.4-B) | §3 (incl. no stand-in in the store, storage or network; part-2 non-settlement checks) |
| 2026-09-23 | 4.4-A (A5–A8, P0-5) — **runtime-verified defects** | `social/Moment.tsx` (`MomentConversation`) | Phone deep thread: Reply buttons did nothing (`onReply={() => {}}`), Respond focused the dialog instead of the composer, Escape on a menu/person closed the whole thread, focus fell to `<body>` on close, the page could scroll behind | Reply writes under its parent exactly as inline; Respond lands the cursor in the composer; Escape and Tab belong to the top-most layer (a Person card, a menu, a response being edited close first); Tab is trapped in the dialog; focus returns to the opener; wheel/touch on the header or scrim never scroll the page (the list still scrolls, overscroll contained); a just-sent response is revealed | §4 at 390 and 360 |
| 2026-09-23 | 4.4-A (A7) — **runtime-verified defect** | `world/PersonCard.tsx` (not frozen) | Opened from the phone thread, the Person card painted BEHIND it (both z-60) while holding focus | `z-[66]` (above the thread, below the language sheet at z-70); Tab trapped inside the card | §4 (hit-test at three points) |
| 2026-09-23 | 4.4-A (A13) | `social/Moment.tsx` (`kindLine`) | A Meeting named its people twice ("with Maya, Bikash … with 2" — the names of the time; the owner fixture add-on below renamed the cast) | Named once, in the one "with …" control that also opens them (`data-sb-moment-with` kept; a Meal still reads "with N") | §7 |
| 2026-09-23 | 4.4-A (A15) | `social/Moment.tsx` (`NoteRow`), `social/data.ts` (`fortyNotes`) | Responses showed only `HH:MM`, never the day; the 40-response fixture wrote UTC as local, so responses read as written before their Moment (11:18 under 16:40) | `HH:MM` for today, `DD MON YYYY · HH:MM` otherwise, inside `<time dateTime>`; the fixture uses local wall-clock time (a hoisted helper — the seed calls it during module init) | §6 |
| 2026-09-23 | 4.4-A (A16, A17) | `social/Moment.tsx` | A response's line breaks were not rendered and edit was a single-line input; Enter confirming an IME candidate could send a half-written response | Responses render `white-space: pre-line`; edit is a textarea (Enter saves, Shift+Enter breaks, Escape cancels, cursor at the end); Enter is ignored while composing (`isComposing` / 229) | §6 |
| 2026-09-23 | 4.4-A (A18, A20) | `social/Moment.tsx` (`Popover`, entry) | "Write a response" at zero opened without focusing; menus returned no focus, had no arrow keys, and re-ran their effect on every parent render (snapping focus back to the first item); Hide/Delete left focus on `<body>` | Zero-response "Write a response" writes; `Popover` runs once per opening, returns focus to its trigger, and supports ↑ ↓ Home End; Hide/Delete move focus to the neighbouring Moment's readout and announce through one shared live region (`src/lib/announce.ts`, new); a deleted response leaves focus in its conversation | §6, §7 |
| 2026-09-23 | 4.4-A (A19) | `social/Moment.tsx` | "Link copied." showed even when the copy failed | Confirmation only after `writeText` resolves; a failure says "Couldn't copy the link." (Whether Copy link should exist before permalinks is D-12) | §7 |
| 2026-09-23 | 4.4-A (A21) | `social/Moment.tsx` | Reply and the response ⋯ were 28px targets on phones; the Moment ⋯ 36px | Phone-only 44×44 pointer targets for Reply and the response ⋯ via a pseudo-element hit area (layout unchanged; `@2xl` restores); the Moment ⋯ and the thread's Back are 44px on phones, desktop sizes unchanged | §4 (elementFromPoint across 44px) |
| 2026-09-23 | 4.4-A (A22) | `social/LifeRing.tsx`, `social/Moment.tsx` | `label=""` was documented as "decorative" but LifeRing still announced "Name — " beside a name already read | An empty position label renders the ring `aria-hidden`, no `role=img` (affects every `label=""` call site — search rows, chat rows, who-lists — the same double announcement); the stray sr-only viewer-name spans in Notes are removed | §7 |
| 2026-09-23 | 4.4-A (A23) | `social/Media.tsx` | Grid tiles 1–3 were buttons that did nothing; the video play button did nothing | Only the "+N more" tile is a button; the others are figures. The play control is disabled until playback exists (D-20); "Show fewer" localised | §7 |
| 2026-09-23 | 4.4-A (A24) | `social/Moment.tsx`, `social/Media.tsx`, `social/LifeCursor.tsx`, `social/SocialPreview.tsx`, 8 catalogs | Hard-coded English in the Moment chrome | 21 new keys × 8 locales (384 each, key-complete); English byte-identical ("more", "less", "(you)", "More", "Show fewer", "Life {band}", …) | §8, `i18n.js` |
| 2026-09-23 | 4.4-A (A25) | `social/data.ts` | Fixture untruths: `m-panorama` carried the retired `wonder` id (silently dropped); nt3/nt5/nt8 said "responded to your …" about Moments nobody had responded to; nt1 used the retired word "note" | `wonder` → `wow`; the three responses those notifications already claim are added (`p-bikash` on m-panorama 10 SEP 10:30, `p-krishna` on m-nepali-1 09 SEP 07:15, `p-m` on m-snow 07 SEP 22:40); nt1 reads "responded to your Thamel moment". nt4 ("mentioned you") is left for D-24 | §6/§7 + fleet |
| 2026-09-23 | 4.4-A (A26) | `social/Composer.tsx`, `social/Moment.tsx` | Failures were shown but not announced | A failed post is `role=alert`; a failed response send is in a polite live region | §7 |
| 2026-09-23 | 4.4-A (independent review fixes) | `social/Moment.tsx`, `social/Composer.tsx`, `social/Media.tsx`, `src/lib/announce.ts` | A four-lens read-only review of this slice's own diff found focus and state gaps it had introduced or left | The delete confirmation is a labelled group of menu items and focus lands on Keep; the ⋯ menu resets its confirmation when it closes. The phone thread keeps Tab trapped while a menu or an edit is open (they own only Escape; the edit form owns Escape at form level). Opened to read, focus is on the responses list itself (keys scroll it, not the page). The wheel/touch guard falls back from a non-scrolling textarea to the list, and conversation textareas contain their overscroll. A reply sent from a thread returns focus to that response's Reply. Hit areas no longer cover the words above (8px above the meta row on phones). `announce()` speaks inside an open aria-modal dialog. The with-people list uses menu roles and returns focus to its "with …" trigger. "Show N more" / "Show fewer" hand focus to each other. Post closes the privacy menu and its options are disabled while posting (a choice made then could not reach the post); focus waits on the busy Post button and moves to Retry on failure. A cleared or malformed date blocks Post (no NaN age). An unavailable author is never a clickable doorway | `social-4-4a-truth.js` §2, §4, §5, §7 |
| 2026-09-23 | 4.4-A (MC-20 stale landing) | `social/Chrome.tsx` (`NotificationsPanel.goToMoment`) | A notification whose Moment had since been deleted or hidden closed the panel onto nothing | It announces "That Moment is no longer available." and the panel stays. (Which Moments a viewer may be taken to is the audience rule — 4.4-B/C) | §7 |

**Owner-superseded assertion (recorded, never silent; no invariant weakened):**

- **`social-final.js` §5** — the own-response edit field is selected as
  `textarea[aria-label='Edit response']` (was `input[…]`): the field is a textarea so a response
  keeps its line breaks (A16). Enter still saves; "own note edits and shows 'edited'" is
  asserted exactly as before. 180/180.

**Documented carryovers (NOT changed):** the per-response author ring is still drawn at the
response's time (D-1 hardening, 4.4-B); response delete still cascades and has no confirm (D-9);
Report is still toast-only (D-10); Copy link still copies an unresolvable `systemboom.example`
URL (D-12); Celestial's phone action row still loses ⋯ at ≤390 with the flag on (P0-6, D-3/D-5);
the retired `respond {count, byViewer}` is still described in `social-api-contract.md` §D.4
(tracked as RS-40).

## Phase 4.4-A — owner fixture add-on: the Italian social circle + multi-person Celestial Resonance (2026-09-23)

Owner-requested demo-data change, applied after the truth fixes above and before the final
screenshots. **Fixture/data/asset content only** — no rendering, layout, interaction or privacy
logic changed, **no Celestial file was edited** (`src/components/celestial/**`, `src/lib/celestial/**`
untouched; the owner's uncommitted Light-mode work in them is untouched), `expressions.tsx` is
byte-identical, and the Celestial flag's committed default stays OFF (D-3 is not decided: the
owner/dev enable path `?celestial=1` on the normal `/world` page, stored locally, shows it).

**Cast.** The Nepali core and the US/UK wider cast are replaced by one fictional ITALIAN circle of
adults aged 20–35 (mostly women), keeping every stable internal key and id (`maya`/`u-demo-001`
is Giulia Bianchi; `asha`/`p-asha` Sofia Romano; `bikash` Luca Rinaldi; `ramesh` Marco Bellini
(the same-DOB pair with Luca is kept); `sunita` Elena Ricci; `prakash` Chiara Conti; `krishna`
Federico Alessandro Castelbarco Visconti (the exactly-40-character name fixture); `m` stays
"M"; `marcus`/`grace`/`theo`/`hannah`/`rory`/`nadia`/`walt`/`sofia` are Matteo Gallo, Aurora
Ferrari, Andrea Costa, Camilla Greco, Francesca Marino, Martina Moretti, Beatrice Esposito, Alice
Lombardi). Relationships (`world/model.ts`), conversations and notification kinds are unchanged
by id. Initials are unique; no first name is a substring of another (Search matches substrings).
Giulia keeps Maya's birth data (34 — inside 20–35; the owner suggested "late 20s", but her exact
birth instant drives accepted Life/Circle/tick/day-count assertions, so it is kept and the choice
documented). Six real CC0 portraits (face-framed crops, `public/mock/social/cast/`) — every other
person deliberately renders the initials fallback; the nine portraits still required are listed
in `docs/fixtures/photo-sources.md`. Nothing was downloaded.

**Story, so the content is coherent.** Chiara lives in Boudha this year and Elena married into
Ratmate (Nuwakot); in late Aug–Sept 2026 the others joined them in Nepal — so the recent Moments
keep their Nepali places (and every place-driven assertion), while the personal ones became
Italian. The Devanagari fixtures are kept for script coverage (Giulia and Federico write Nepali on
the trip).

| Date | Phase | File | Reason | Behavioural effect | Test / evidence |
|---|---|---|---|---|---|
| 2026-09-23 | 4.4-A fixture add-on (owner §5–§9) | `social/data.ts` (PEOPLE, synth people, Moments, notes, RECENT_SEARCHES), `lib/mock/demo-user.ts`, `public/mock/social/cast/*.jpg` (6 new), `CREDITS.md`, `credits.json`, `docs/fixtures/photo-sources.md` | Owner: replace the obviously Nepali population with a coherent fictional Italian circle, real photo where available, no mixed identities | Names, homes, avatars and birth dates of the fixture people; the harness-only synthetic people are Italian adults 20–35. Moment content adjusted where it named people or a Nepali family history the new cast cannot have: `m-sameage`/`m-meeting` name Luca; `m-project`/`m-boudha` honour Chiara's Nonna; `m-face` is "the tea-shop aama"; `m-600` is Luca documenting a restoration at the house the circle stays in; `m-forty` welcomes Elena back (no age is stated anywhere — no birth-derived text); `m-wedding` is Elena's in Ratmate; `m-nepali-2` is a traveller listening to stories. **`m-1983` (id kept) is re-dated 1998-09-14 in Vomero, Napoli** — a Moment before its author's birth is exactly what the Composer refuses, and D-17 (ancestral records) is open; the boundary-map scan it carried was not a school slip, so it carries no photo rather than a wrong one | `person-life-identity.js` §1; `social-2030.js` §8; `social-final.js` §14; fleet |
| 2026-09-23 | 4.4-A fixture add-on (owner §2–§4, §10–§12) | `social/data.ts` (`Moment.resonances` on five Moments) | The normal feed could not show what multi-person Resonance looks like | Seeded with real cast ids, one Resonance per person, canonical ids only, no author on their own Moment: **A** `m-sameage` (Marco) 5 people — Venus ×2 (Giulia, Sofia), Sun (Elena), Saturn (Luca), Moon (Chiara); **B** `m-meal` (Luca) 3 — Mercury ×2 (Sofia, Camilla), Comet (Elena); **C** `m-video` (Sofia) 8 — Venus ×2, Sun ×2, Meteor, Comet, Jupiter, Moon; **D** `m-activity` (Sofia) 1 — Luca → Jupiter; `m-panorama` (Giulia's own) 6 — Comet ×2, Venus, Mercury, Saturn, Sun. **E**: `m-rain` and every other Moment keep zero (the Celestial suites use `m-rain`). Rendered by the unchanged approved components; nothing is ranked, scaled or reordered by count | `celestial-s7`, `celestial-s3-s6` unchanged and green; `prototype-evidence/phase-4.4a-truth/owner-fixture/` |
| 2026-09-23 | 4.4-A fixture add-on (§7 "no mixed identities") | `identity/IdentityGate.tsx` (Phase 2, paused — not frozen), `lib/identity/demo-seed.ts` | The gate said "Enter as Maya Rai" over the old avatar while Social showed Giulia | The gate reads the one demo identity (`demoUser.name` / `demoUser.avatar`) instead of copies. The demo identity's place anchors on the curated **Italy** centroid (`cn-italy`, labelled "Bologna, Italy") — the frozen curated geography has no Italian city, and anchors are centroids by design | `gate-desktop`, `gate-mobile`, `gate-fallback`, `identity-model` |
| 2026-09-23 | 4.4-A fixture add-on (harness) | `social/SocialPreview.tsx`, `circle/CirclePreview.tsx` (viewer labels only), comments in `social/store.tsx`, `world/model.ts`, `identity/IdentityProvider.tsx`, `lib/identity/types.ts` | Harness labels and comments named the old cast | "Giulia (owner) · Sofia (no birth time) · Luca → Giulia · Sofia → Giulia · Chiara → Giulia"; `?viewer=` values are unchanged internal tokens | `social-connection-final.js` |
| 2026-09-23 | 4.4-A (celestial-s7 regression, A12 refinement) | `social/data.ts` (`unavailablePerson`) | The neutral unavailable identity kept the requested id, so Celestial's own resolver contract (`personOf(pid).id === pid` ⇒ "this person") drew an unresolvable resonator as a person instead of counting them | Its id is `unavailable:<id>`: counted, never rendered — fixed in data, not in `ResonateControl.tsx` | `celestial-s7-constellation.js` 114/114 |

**Owner-superseded assertions — fixture vocabulary only (recorded, never silent; no invariant
weakened or removed).** Every change below substitutes the new fixture's name, photo path, place
or date for the old one; what each check proves is unchanged:

- Names typed/matched: `social-final` (§2 readouts "Giulia Bianchi"/"Luca Rinaldi"), `social-shell`
  (gate button, World text, Search "Giulia"/"Sofia"), `one-application`, `final-app`,
  `complete-my-world`, `celestial-s3-s6` ("Enter as Giulia Bianchi"), `complete-my-world` (Marco,
  Elena, Chiara, Luca), `social-2030` (Federico, Sofia, "Giulia’s World"), `my-world-2030`
  (Federico), `social-connection-final` (Marco, Federico, Luca; harness labels "Sofia → Giulia",
  "Luca → Giulia"), `s5-discovery` (Federico, Giulia, Marco; the name regex), `s6-motion` (Marco),
  `social-r2-expression` ("Sofia Romano", "Luca Rinaldi"), `social-r3-3d-expression` (header regex),
  `celestial-s7-constellation` ("Sofia Romano", "Giulia Bianchi" — this file is one of the owner's uncommitted Light-mode files; the only change made to it is these four name strings, lines 187, 401, 419, 420, because the check names the fixture people and cannot be isolated elsewhere), `i18n` (the person's name
  "Giulia Bianchi" and place "Bologna" stay original), `social-4-4a-truth` (Sofia; "with Giulia, Luca"),
  `gate-desktop`/`gate-mobile`/`gate-fallback` ("Enter as Giulia Bianchi"), `identity-model`
  (name, Italy anchor, avatar — this suite was **already failing before this pass** on the avatar
  the Person + Life Identity pass changed; it now asserts the current avatar).
- `social-2030-final` §1 — "the global US/UK cast is present" → "the wider Italian circle is
  present" (Matteo Gallo, Aurora Ferrari, Andrea Costa); the populated-network and ≥5-real-photos
  checks are unchanged.
- `social-2030` §2 — the person card's life fact reads "Circle band 30–45" (Federico is 33; was
  Krishna's 60–75). The check is the typographic tier, unchanged.
- `social-2030` §8 and `social-final` §14 — the oldest Moment is `m-1983` re-dated **14 SEP 1998**
  (was 06 FEB 1983); the Life Cursor place check also accepts its new place. Chronology, provenance
  ("shared") and cursor invariants are unchanged.
- `circle` §7 — the day header states the owner's own place, now "Bologna" (was "Kathmandu").
- `s4-people` §2–§3 — the name typed is "aurora" (was "grace") and the unconnected person is
  "marco" (`p-ramesh`, was "ramesh").
- `complete-my-world` §6 (media failure) — the broken image is the Moment's own photo, selected as
  `img:not([data-sb-identity-photo])`: the Meal's author now has a real portrait, so the first
  `img` in the Moment was his face. Same failure, same structure-survives assertion.
- `s5-discovery` §6 — the deep, media-led Moment beyond the loaded window is `m-wedding`
  ("wedding day"; was `m-1983` "admission", which no longer carries a photo). Same Photos-result →
  reveal → land invariant.
- `my-world-2030` §8 — the Life Cursor check is made at a 900px-tall desktop frame scrolled to
  `m-wedding`, then the suite's 1200px frame is restored: with `m-1983` photo-less, the historical
  tail is shorter than a 1200px screen and the trigger line correctly stays over the current year
  there. Same "activates over historical scroll" invariant.
- `person-life-identity` §1 — the owner's photo is `cast/giulia-bianchi.jpg`; the 40-character
  family member's is `cast/federico-castelbarco.jpg` in all six surfaces. **Photo-vs-initials is
  restated, not weakened:** three fixtures that had no photo now carry a licensed portrait (the
  owner's "real photo when available"), so they assert photo-and-no-initials, and the initials
  fallback is asserted on three fixtures that deliberately have none (MB, MG, AF). 47 → 49.

**Not changed (documented):** Moment places of the Sept 2026 trip and all LIBRARY photo captions
(image truth); the `PLACES` composer list; historical design wireframes and decision records
(`docs/design/social-wireframes.md`, `docs/SYSTEMBOOM-HANDOFF-BRIEF.md`, earlier AGENTS.md rows)
still show the names of their time; `ui/Avatar.tsx`'s "Maya Rai → MR" doc example. P0-6 is not
touched: with the flag on, the phone action row measurements are recorded in
`prototype-evidence/phase-4.4a-truth/owner-fixture/phone-action-row-metrics.json`.

**Verified on final source (owner fixture add-on + truth fixes, one fleet run, suites re-run
after a test-only correction marked ↻):** social-final 180 · social-shell 68 · one-application 40 ·
final-app 31 · circle 132 ↻ · complete-my-world 62 ↻ · person-life-identity 49 · social-2030 31 ·
my-world-2030 27 ↻ · social-connection-final 44 · social-2030-final 35 · s2-person-world 47 ·
locale-resolution 21 · i18n 45 · s3-moments 17 · s4-people 20 ↻ · s3-s4-loops 14 · s5-discovery 48 ↻ ·
s6-motion 53 · s7-device-mastery 56 · social-r2 43 · r3 80 · r3.1 69 · r3.2 92 · r3.3 102 · r3.5 20 ·
r3.6 21 · r3.7 37 · r3.8 34 · r3.9 31 · devanagari crops pass · celestial-s0 64 · celestial-s2-field 40 ·
celestial-s3-s6 32 · celestial-s7-constellation 114 · **social-4-4a-truth 125 (new)** ·
identity-model 13 (was failing before this pass) · gate-desktop · gate-mobile · gate-fallback ·
amend-desktop · amend-mobile · trail-desktop · trail-mobile PASS. `tsc --noEmit` and eslint clean;
`next build` passes; `expressions.tsx` SHA-256 `dd78c369…a0194e` unchanged.

