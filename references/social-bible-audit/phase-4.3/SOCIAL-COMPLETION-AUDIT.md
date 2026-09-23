# SOCIAL COMPLETION AUDIT — Phase 4.3

**Status of this audit: COMPLETE (audit-only).** No product code was changed. The only files
written are audit tooling (`prototype-tests/social-audit-4-3.cjs`,
`prototype-tests/social-audit-4-3-verify.cjs`), evidence, and this package.

**Verdict on Social: PARTIAL.** Much of Social works in the prototype. The Almanac, the
identity system, Boom, the Circle, People, Search and Chat all exist and hold up. What does
not exist yet is what connects them. A Moment has no URL, its Place does nothing, and
*View in Life* is disabled. No Social action produces a notification. The relationship graph
holds only the owner's side. Two Life-privacy rules are not enforced, and three flows corrupt
data or mislead the person using them. P0 is seven items (see
[SOCIAL-COMPLETION-PRIORITIES.md](SOCIAL-COMPLETION-PRIORITIES.md)).

**Ready for Phase 4.4 implementation: YES.**
- **Slice 4.4-A** can start now; it needs no owner decision.
- **4.4-B** waits on decisions D-1, D-2 and D-4.
- **4.4-C** inherits those through its dependency on 4.4-B and uses D-18 defaults.

## 0. How to read this package

| | |
|---|---|
| Implementation truth | Current code on `main` at `fcf4e1e` plus the uncommitted working tree (§1) |
| Product truth | `AGENTS.md`, `docs/handover/*`, `docs/design/*`, `references/social-bible-audit/*`, `references/celestial-resonance-bible/*` |
| Method | Nine parallel subsystem auditors read code and docs, and every finding carries a `file:line`. A runtime probe in a real browser (Chromium via puppeteer-core, dev server `:3210`) answered the §52 questions. A second verification pass then re-checked the claims that code reading could not settle. |
| Status words | COMPLETE · PARTIAL · MISSING · BROKEN · DISCONNECTED · CONFLICT · OWNER DECISION — as defined in the brief. No scores. |
| ✔ runtime-verified | The finding was reproduced in the browser this phase (`evidence/results.json`) |
| "Prototype" | Behaviour of the client-side React reducers (`store.tsx`, `WorldProvider.tsx`) and fixtures (`data.ts`, `world/model.ts`). Nothing persists across reload, and no server exists. See §12. |
| Row IDs | `MC` Moment core · `RS` Respond · `RX` Boom + Celestial · `ID` identity · `PF` People/Friends/Search · `CN` Chat/Notifications · `CO` Composer · `PL` Place/Life/Cosmos · `XC` cross-cutting. The other documents cite these IDs. |
| Other IDs | **D-n**: owner decisions ([OWNER-DECISIONS-REQUIRED.md](OWNER-DECISIONS-REQUIRED.md)) · **A1…A26, C1…C20, X1…X7, Z1…Z7**: safe fixes ([SAFE-FIXES-NO-DECISION.md](SAFE-FIXES-NO-DECISION.md)) · **Bible C-n / E-n / P-n / ED-n**: the earlier bible audit's IDs in `../SOCIAL_BIBLE_CONTRADICTIONS.md`, `../SOCIAL_BIBLE_AUDIT.md` and `../SOCIAL_BIBLE_PRIVACY_MATRIX.md`. A bare "C-15" inside the master table or appendix means Bible C-15, never safe fix C15. |

Package index: [README.md](README.md).

## 1. Repository state (§3)

Recorded before and after the audit. Nothing was reset, restored, stashed, committed, pushed
or deployed.

- Branch `main`, HEAD `fcf4e1e`.
- **Pre-existing dirty work (the owner's, untouched):** the uncommitted Light-mode correction
  pass. That is 10 modified files, 277 insertions and 185 deletions:
  - `prototype-tests/_build-celestial-environment.cjs`
  - `prototype-tests/celestial-s7-constellation.js`
  - `public/celestial/environment-solar{,-frame-left,-frame-right,-portrait}.svg`
  - `src/components/celestial/{CelestialEnvironment,CelestialField,ResonateControl}.tsx`
  - `src/components/celestial/visual.ts`
- **Pre-existing untracked:**
  - `prototype-tests/celestial-light-capture.cjs`
  - `references/celestial-resonance-bible/`
  - `references/social-bible-audit/` (the whole folder, including this package, is untracked)
  - `Claude outputs/`
- **Added by 4.3 (untracked):**
  - `prototype-tests/social-audit-4-3.cjs`
  - `prototype-tests/social-audit-4-3-verify.cjs`
  - `references/social-bible-audit/phase-4.3/**`
  - `prototype-evidence/phase-4.3-social-audit/**` (gitignored)
- **Preservation hashes, re-checked after the audit:**
  - `src/components/style-lab/social/expressions.tsx`: `dd78c369…a0194e`, unchanged
  - `AGENTS.md`: `02acdd99…384e23`, unchanged

## 2. Scorecard (§50) — status only

| Subsystem | Status | What decides it |
|---|---|---|
| My World | **PARTIAL** | The owner hierarchy is coherent. The stream holds every author's Moments on anyone's World, a CONFLICT with the contract (MC-31). `/world` always renders fixture Maya, not the signed-in identity (ID-06). No route shows another person's World (ID-05). |
| Profile | **PARTIAL** | The owner Hero is complete. The visitor perspective is BROKEN: an inverted request direction and Message-to-self (ID-02, ID-03). The photo, cover and visibility controls are inert (ID-08). View as public is BROKEN (ID-04). |
| Moment | **PARTIAL** | The Moment is the unit of the Almanac, but outside the feed it has no presence: no URL (MC-24), an inert Place (MC-07), and View in Life disabled (MC-18). Edit is BROKEN (MC-19). |
| Composer | **PARTIAL — contains BROKEN** | Creating a Moment works. Edit rewrites the time to 12:00 and rebuilds media (CO-10). Discard during Posting still publishes, ✔ (CO-22). Also BROKEN: fields leak across kinds (CO-11), mixed media is silently dropped (CO-05), and pre-birth dates are accepted (CO-09). |
| Respond | **PARTIAL** | The inline flow works, but timestamps are BROKEN (RS-23), delete cascades other people's replies (RS-07), and edit loses line breaks (RS-06). On the phone deep thread, Reply is dead ✔, Respond does not focus the composer ✔, and a person opened from a response is hidden behind the thread ✔ (RS-05, RS-02, RS-18). There is no owner stewardship (RS-09), and no notifications (RS-21). |
| Boom | **COMPLETE (subsystem) · PARTIAL (integration)** | The mascot, Human Pulse, Spectrum and who-list are accepted and untouched. Integration gaps: the trigger is icon-only on touch (RX-04), the who-list falls back to a raw name (RX-18), and the `wonder` fixture is dropped (RX-26). |
| Celestial | **DISCONNECTED** | Off on `/world` by default (XC-33). With the flag on, Resonate pushes the ⋯ menu off the Moment at 390 and below ✔ (RX-01). It outweighs Respond visually (RX-02), and its count policy conflicts with Human Pulse's (RX-13, RX-14). |
| People | **PARTIAL** | Find, Requests and Your people work. There are no recent people, no people-from-Places and no path to a person's World (PF-04, PF-12). |
| Friends | **PARTIAL** | Five relationship states work from the owner's side. The graph stores one perspective only, so it is BROKEN in visitor modes (PF-03). The live Friends page and Family tree are DISCONNECTED (PF-06). |
| Search | **PARTIAL** | Four groups with real identity, band-only. `friends` content is not gated (PF-01). Your own row is a dead click (PF-23). There is no combobox keyboard support (PF-19). |
| Notifications | **DISCONNECTED** | The UI and read state work. **No Social action creates a notification** ✔. Fixtures claim responses that do not exist and use retired vocabulary (CN-05, CN-06). There is no grouping (CN-13). |
| Chat | **PARTIAL** | It exists and carries real identity. `?c=` opens a sendable thread with anyone, including yourself (CN-23). There is no doorway to a Person or a Moment (CN-29, CN-30). It runs its own store (CN-21). |
| Place seam | **MISSING** | Place is plain text and tapping it does nothing (PL-01). Search Places come from a static list (PL-02). |
| Life seam | **PARTIAL** | Life → Moment exists: the DayAlmanac renders `MomentEntry` (PL-06). Moment → Life is DISCONNECTED (PL-04). Pre-birth `?c=` links are BROKEN (PL-08). |
| Cosmos seam | **PARTIAL** | Brand, entry and arrival are complete (PL-12, PL-13). Earth has no link from My World (PL-03). Deep links lose their query through identity (PL-14). |
| Media | **PARTIAL** | Photos, grid, fallback and link card work. Video has no playback (XC-24), and there is no lightbox, captions or alt-text authoring (MC-10, MC-11, MC-13). |
| Privacy | **CONFLICT** | The Life data boundary is structurally sound (XC-01). But a band shown at each Moment's date lets anyone narrow another person's birth date (MC-03, ID-01, PL-11). `friends` Moments reach strangers (XC-02). |
| Safety | **MISSING** | No block, mute or report-person. Report on a Moment or response is only a toast. A Moment's owner cannot remove a response on their own Moment (XC-07, XC-08, RS-09). |
| i18n | **PARTIAL** | 8 × 363 keys, key-complete. Hard-coded English remains in Chat, the Moment chrome, notification dates and identity entry (XC-12 to XC-14). 14 keys are orphaned. |
| Accessibility | **PARTIAL** | The pickers are complete. Menus have no focus return or arrow keys (XC-16). The phone conversation has no focus return (XC-15). Failures are not announced (XC-18). |
| Mobile | **PARTIAL** | With the flag off, S7 is complete at 320–430 (XC-19). With the flag on, the action row is BROKEN ✔ (RX-01). The phone conversation defects above also apply. |
| Themes | **CONFLICT** | Dark is complete. In light mode with the flag on, the page is forced into Solar Observatory scenery, against the owner's direction. Two light material languages also coexist (XC-26). |
| Performance | **PARTIAL** | No loops and no WebGL. Images are 19 MB, single size, with an 836 KB avatar. The LifeCounter ticks while hidden (XC-20, XC-21). |

## 3. The §52 blocker questions — verified, not assumed

Source: `evidence/results.json` (first probe, corrected by the second pass).

| # | Question | Verdict | Evidence |
|---|---|---|---|
| A | Can users create and manage a Moment reliably? | **NO, not reliably.** Create, edit and delete work mechanically. Edit rewrites time to 12:00 and rebuilds media. Discard during Posting publishes anyway ✔. Nothing persists across reload (prototype). | results A · V4 · CO-10, CO-22 |
| B | Can another person Respond? | **YES** (prototype, one acting viewer at a time) | results B · RS-03 |
| C | Can conversation continue clearly? | **Desktop: YES**, one reply level. **Phone deep thread: NO.** Reply is dead ✔, Respond does not focus the composer ✔, and opening a person hides behind the thread ✔. | V1–V3 · RS-02, RS-05, RS-18 |
| D | Are Boom and Celestial understandable and independent? | **Independent: YES** in data and state. **Understandable: NOT DEMONSTRATED.** Boom is icon-only on touch. Eight meaning words are shared. Two presence lines both end "{n} people". There is no onboarding and no user evidence. | results D · RX-04, RX-10, RX-11 |
| E | Can people find and open another person? | **Find: YES** (Search, People). **Open their World: NO.** It stops at the Person card. | results E · ID-05, PF-04 |
| F | Can people move into Chat? | **YES** for connected people, via the card → mini chat. The guard is UI-only, and `/chat?c=` opens with anyone. | results F · CN-23 |
| G | Can a Moment connect to Life? | **Moment → Life: NO** (disabled). **Life → Moment: YES** (DayAlmanac, owner). | results G · PL-04, PL-06 |
| H | Are Friends reconnected? | **PARTIAL.** People utility, requests and accept all work on the owner-perspective fixture graph. The live Friends and Family pages are unreachable. Visitor perspective is inverted. | results H · PF-03, PF-06 |
| I | Do Notifications carry Social actions correctly? | **NO.** Fixture-only. Only `read`, `readAll` and `notifications` reducer cases write them. | results I · CN-05 |
| J | Are privacy rules safe? | **Direct fields: YES.** A visitor (Bikash on Maya's World) sees no birth date, day count or exact age other than their own. **Inference: NO.** Bands at Moment dates bracket birth dates (Sunita: 15 years → ~3.5 years from two fixtures). `friends` is not enforced. View as public is not truthful. | results J · MC-03, XC-02, XC-04 |
| K | Is mobile usable? | **PARTIAL.** Layout: with Celestial OFF, every action-row control is inside the Moment column at 390, 360 and 320. **With Celestial ON (NO):** at 360 and 320 Resonate and ⋯ fall outside the column ✔, so Edit, Delete, Privacy, Report, Hide and Copy link are unreachable; at 390 the ⋯ also leaves the column (P0-6). **Either way (NO):** the phone deep conversation is BROKEN ✔ (V1–V3, P0-5). | K390/K360/K320 · V1–V3 · `13-*.png`, `14-*.png` |

**Correction recorded (my own tooling defect).** The first K probe reported "YES (no overflow)"
at 390 and 360 because it measured document overflow only. That is blind to a control clipped by
an `overflow-hidden` ancestor. The fixed probe measures every action-row control against the
Moment column, and it overturned that verdict. Both scripts are in `prototype-tests/`.

**Other runtime facts measured:**
- §62 worst case: `m-forty` has 40 responses (27 top-level + 13 replies), a 20-person Boom pulse
  and an 8-type constellation.
  - Desktop: 673 px closed, 1162 px with the constellation open (1.22 screens of 950).
  - 390: 608 px closed, 1149 px open (1.36 screens of 844).
  - `responses: 38` in the fixture is the retired tap counter, which nothing renders.
  - Page errors: 0.
- **`results.json` reading guide:** each entry keeps the raw probe `verdict` and `evidence`; its
  `synthesis` field carries the final answer in this table.

## 4. UX questions (§58)

| Question | Answer |
|---|---|
| Does My World have a clear purpose? | **For the owner, yes.** The Hero says who and where in life, the Almanac says what happened, and Life is one tap away. **For everyone else, no.** A visitor's World shows everyone's Moments, not the person's. |
| Does a new user understand Moment? | **Partly.** The coordinate sentence (date · age · place) and "What happened at {age}?" teach it well. Nothing explains why a Moment differs from a post. The empty feed has no first-Moment state (MC-32). |
| Is Respond obviously different from Resonate? | **Only by label.** Both are labelled pills in one row. Resonate's gold glow makes it the loudest element, which inverts the documented hierarchy (RX-02). |
| Is Boom obviously different from Celestial? | **No.** Boom is an unlabelled 44 px mascot lens between two labelled pills. Eight meanings share words. Both presence summaries are wordless and both say "{n} people" (RX-11, RX-14). |
| Do action rows feel overloaded? | **With Celestial on, yes.** Five controls; on phones the ⋯ is pushed out. With it off, no. |
| Does a Moment become too tall? | **Closed: acceptable** (608–673 px worst case). **Opened constellation: 1.2–1.4 screens.** The inline Celestial stage has no height cap (RX-16). |
| Does conversation feel connected to the Moment? | **Yes inline** (Response Branch, preview, memory header on phones). The phone deep thread breaks at Reply. |
| Can users find people? | **Yes** (Search, People "Find someone"). |
| Can users understand relationship state? | **As the owner, yes**, although wording drifts: "Wants to connect" vs "Asked to be your friend", "Add Friend" vs "Add friend". **In visitor modes, no:** the direction is inverted and surfaces disagree (PF-03). |
| Can they move between Moment, Person, Life, Place and Chat? | **Moment → Person → Chat: yes.** **Moment → Life, Moment → Place, Person → their World, Chat → Person or Moment: no.** That is the missing connective tissue. |
| Does mobile preserve this hierarchy? | **Flag off, yes.** Flag on, the action row breaks. The deep phone thread breaks either way. |
| What feels disconnected? | Place, Life (outward), another person's World, notifications (no producers), the live Friends pages, Chat → Person, who-lists → Person, and the three separate in-memory stores (`/world`, `/life`, `/chat`). |

## 4b. Feed / wall (§21)

| Check | Status | Evidence |
|---|---|---|
| Chronology | **COMPLETE.** Sorted by `at`, newest first. No algorithmic or engagement ranking anywhere. The comment at `data.ts:369` wrongly says `sharedAt ?? at` | `store.tsx:113-119` · MC-30 |
| Loading | **PARTIAL.** Images are lazy with reserved aspect. There is no feed skeleton and no load-more pending or error state | `Media.tsx:26, 34` · MC-32 |
| Pagination | **COMPLETE (prototype).** 8 first, then +8 per "{n} earlier · Load more", then the end sentence. No infinite scroll, no virtualisation | `store.tsx:95, 203-204`; `SocialPreview.tsx:749-758` |
| Long feed | **COMPLETE.** Summaries are static. The Life Cursor appears only over historical years. With the flag off, nothing animates on its own | MC-33 · XC-21 |
| Density / separation | **COMPLETE.** A hairline + `pt-6` between entries, `gap-8`, one date rule per day | `SocialPreview.tsx:737-742` |
| Media-heavy Moments | **COMPLETE.** Own aspect, max 480 px, sheet-edge bleed on phones, a 2×2 grid with +N | `05-…`/`06-…png`; `Media.tsx` |
| Text-only Moments | **COMPLETE.** Readout, body and actions only (fixtures `m-sameage`, `m-one`, `m-noplace`) | MC-09 |
| Celestial-heavy Moments | **PARTIAL.** 8 types / 16 resonators at 360 puts ~200 px of footer chrome under a ~220 px photo. The opened stage is uncapped. The phone row loses ⋯ ✔ | `09-…png`, `density-*.png` · RX-01, RX-16 |
| Many responses | **COMPLETE (closed).** A count + a one-line preview (`m-forty`: 608 px at 390 and 673 px desktop, closed). Phones open the focused surface at 3+ top-level, where Reply is BROKEN ✔ | `density-*.png` · RS-05 |
| Zero interactions | **COMPLETE.** "Write a response", with no Human Pulse or constellation rendered | `05-moment-no-responses.png` |
| High participation | **COMPLETE.** Boom: ≤3 equal lenses + "{n} people". Celestial: per-type counts in the feed (policy conflict RX-13) | `07-…`/`09-…png` |
| Scope | **CONFLICT.** Every author's Moments appear on anyone's World | MC-31 · D-4 |

**§62 composition note.** The measured worst case has no people present and no Life link.
- People present renders inside the kind line ("with N"), so it adds no row.
- View in Life is either a pill inside the existing action row (desktop) or a ⋯ item, so it adds
  no row either.
- The full composition is therefore **projected, not measured**, to be within a few pixels of
  `m-forty`.

## 5. Empty states (§67) and error states (§68)

**Empty states** — the goal is to teach without gamifying.

| State | Status |
|---|---|
| No Moments | **MISSING.** There is only the end-of-feed sentence. A first-time owner has no invitation that explains a Moment (MC-32). |
| No Responses | **COMPLETE** ("Write a response", empty sentence) |
| No Friends | **COMPLETE** (People), but it has no harness toggle to review |
| No Notifications | **COMPLETE** (`?notifications=empty`) |
| No search results | **COMPLETE** (sentence + Clear) |
| No Resonance / no Boom | **COMPLETE by design:** the summary is absent |
| No media / no place | **COMPLETE:** the element is omitted |
| No conversations | **PARTIAL:** the panel is localized, `/chat` is English |

**Error states.** The prototype has no backend; these are seams.

| State | Status |
|---|---|
| Moment failed to save | **PARTIAL:** harness-only (`?fail=1`), keeps the draft with Retry |
| Response failed | **COMPLETE:** keeps the text with Retry (harness) |
| Media upload failed | **MISSING:** no upload exists; display fallback only |
| Resonance / Expression failed | **MISSING** |
| Friend action failed | **MISSING:** a synchronous reducer |
| Chat send failed | **DISCONNECTED:** `ChatMessage.failed` and `error.sendFailed` exist but are never used |
| Chat open failed | **MISSING:** an unknown `?c=` silently shows the list |
| Notification target gone | **MISSING:** silent return (`focus-moment.ts:14-15`) |
| Copy link | **BROKEN:** reports success even on failure, and the link resolves nowhere |

## 6. Cross-cutting quality (§39–§43)

- **Mobile (§39).** The S7 contract holds with the flag off (`s7-device-mastery.js`, 56 checks).
  - With the flag on, the action row is BROKEN at 360 and 320 (✔ K).
  - The phone deep thread is BROKEN (✔ V1–V3).
  - Secondary targets are 28–36 px: response ⋯, Reply, Moment ⋯, constellation close.
  - Safe areas and the keyboard are simulated, never tested on a physical device.
- **Dark / light (§40).**
  - Dark (Deep Cosmos) is complete.
  - Light with the flag off is clean (`#F5F5F6`).
  - Light with the flag on is forced into Solar Observatory scenery. The uncommitted correction made it pearl, but it is still scenery. That conflicts with the direction "do not automatically force large decorative Solar Observatory scenery". Boom's horizon, deck and library are still warm beige paper, so light currently has two material languages (XC-26). This is recorded, not reopened: theme design is out of scope for 4.3.
- **Language (§41).** Eight catalogs, matching the brief's eight languages: `en`, `es`, `it`,
  `nl`, `ru`, `hi`, `ne`, `zh-Hans`. Each has 363 keys and is key-complete.
  - **Per-item check:**

    | Item | Status |
    |---|---|
    | Respond / Response / Reply | localized (`conv.*`, `moments.*`); "(you)", "more/less" and the ⋯ label are English |
    | Edit / delete | localized, response menu included |
    | People and relationship labels | localized; wording drifts |
    | Notifications | chrome localized; day headers and coordinate dates English; event text a recorded fixture carryover |
    | Constellation | fully catalog-routed |
    | Moment composer | localized (S3) |
    | Empty states | localized, except `/chat` |
    | Errors | Composer and response localized; chat error keys orphaned |
  - `docs/i18n/translation-status.md` still says 319.
  - Hard-coded English:
    - Chat (all of `ChatSurface` and `ConversationBody`)
    - Moment chrome: "(you)", "more/less", the ⋯ aria, "People in this Moment" (whose key already exists), and the age/band tooltips
    - notification day headers and dates
    - LifeCursor, PersonIdentity band title, "Search results", "Show fewer"
    - the whole identity entry (IdentityGate, CreateIdentityForm)
  - Recorded carryovers (the exact-age primitive, LifeCounter, notification event text) are respected and not flagged.
  - Orphan keys: 14 (XC-12).
- **Accessibility (§42).**
  - Complete: the Boom and Celestial pickers, the Composer trap, and reduced motion.
  - PARTIAL:
    - `role=menu` popovers return no focus and have no arrow keys.
    - The phone conversation has no trap and no focus return.
    - PersonCard does not trap Tab.
    - Hide and Delete strand focus.
    - Failures are not announced.
    - When selected, the Resonate button's accessible name drops the visible word "Resonate".
    - The expanded constellation hears Escape only when focus is inside it.
  - **Contrast: not re-measured in 4.3.**
    - The accepted suites carry contrast picks (`social-final.js`, including the kind-word
      pick).
    - The uncommitted Light pass measured the Celestial light orbit ring at 4.49:1.
    - Celestial light text and seals have no systematic contrast audit. This belongs to 4.4-I.
  - **Focus order: not audited systematically in 4.3.**
    - Known breaks: focus lost after Hide and Delete; no return from menus or the phone
      conversation.
- **Performance (§43).**
  - No rAF loops, no WebGL, and the sticky sky is measured cheap.
  - Costs found:
    - `public/mock/social` is 19 MB of single-size JPEGs.
    - The owner avatar is 1920×2879 / 836 KB, loaded eagerly at 20–168 px.
    - The LifeCounter re-renders every second while CSS-hidden below @5xl.
    - The TopBar rewrites `--sb-bar-h` on every scroll event.
    - **Celestial flag on only** (the CelestialEnvironment stylesheet is not rendered on the
      default route):
      - `backdrop-filter: blur(18px)` sits on the sticky light bar. The same file forbids it
        elsewhere.
      - 29 `:has()` rules; root-level hover rules re-evaluate on every hover.

## 7. Terminology audit (§69)

| Term | Current use | Competing labels | Recommendation |
|---|---|---|---|
| **My World** | "My World", "{Name}'s World" | "a friend's page" (`en.ts:156`, ChatSurface); "Social" only in the harness | Replace "a friend's page" with "{Name}'s World" |
| **Moment** | Moment | "{n} Moment" vs "{n} moment"; "no Moments recorded" vs "no moments recorded"; the verb is **Post**, "Posting…" | Pick one capitalisation. Keep "Post" as the verb (short and understood) or move to "Record"; that is an owner call, D-22 |
| **Respond** | Respond · Response · Reply | "note" survives in fixtures ("left a note", "mentioned you in a note"), orphan keys, `data-sb-note*` hooks and the API contract (`respond {count}`) | Fix fixtures and docs; keep the hooks (test contract) |
| **Boom / Expression** | "Boom" is never user-facing; UI says "Express how this moment felt", "Express {name}" | — | Fine. The trigger needs a visible word on touch (RX-04) |
| **Human Pulse** | never user-facing; aria "{n} people expressed feelings on this Moment" | Celestial's presence also reads "{n} people" | Give each summary a system cue (D-6) |
| **Resonate / Celestial Resonance / Resonance Constellation** | Resonate (verb), Celestial Resonance (aria), "Resonance constellation" (visible title) | The system name "Celestial Resonance" is never visible; the 8 meaning words equal Boom words | Owner-resolved by object + meaning pairing; the gap is feed level (RX-11) |
| **Life** | Life, Circle of Life, Open Life, View in Life | The band appears five ways: "band X", "Circle band X", "Band X", "Life X" (LifeCursor), "Band … years" | One band grammar |
| **People / Friends** | People, Your people, Friends (privacy hint "your people") | "Add friend" vs "Add Friend"; "Wants to connect" vs "Asked to be your friend" vs "Asked you" | One word per state (D-18) |
| **Chat** | Route/brand "Chat"; utility and panel "Messages"; action "Message" | "Open in Chat", "Close chat" | Acceptable split (utility = Messages, destination = Chat); document it |

## 8. Prototype vs data contract vs live requirement (§70)

| Capability | Prototype (this repo) | Data contract (`docs/handover`) | Live integration requirement |
|---|---|---|---|
| Moment create/edit/delete | Client reducer, in-memory; edit corrupts time | `social-api-contract.md` §D; no edit-precision rule enforced | Server write with precision and zone; edit must never invent a clock time |
| Moment visibility | Filters `onlyme` only; `friends` is a glyph | Three values (§D:101); `friends` server contract **unverified** (`view-model.ts:138`) | Server audience filtering for feed, search, notifications and permalinks |
| Responses | Reducer; one reply level; no pagination | Retired `respond {count, byViewer}` still in the contract (C-2) | Response entity with cursor pagination, author PersonRef (current band), capability flags, report/hide |
| Boom | Complete reducer, 18 ids | `moment-expression-contract.md` is stale (6 ids, `wonder`) | Map ids; the notification seam is documented only |
| Celestial | Reducer, flag-gated, harness sims | `references/celestial-resonance-bible/22-DATA-CONTRACT.md`; **absent from `docs/handover`** | Adapter behind `momentIntegration`; the count policy decision |
| Relationships | One owner-perspective map, synchronous | **The state model and transitions only** (`people-chat-integration.md` §2, marked unverified). No directional per-pair API or payload; `PersonRef` carries no relationship field | Directional per pair; request state machine; mapping to the live Friends/Family |
| Notifications | Fixtures; no producers | **No payload or kind contract** | Server-generated events, kinds, aggregation, audience checks |
| Chat | Separate store per route; UI-only guard | `people-chat-integration.md` (P1: shared session) | Shared SYSTEMBOOM session; server messaging guard; delivery/failure states |
| Permalink | None (a fake `systemboom.example` link) | None | Server-resolved route with privacy |
| Place | Free text | `place?: string` | Optional structured place (Places API) — owner decision |
| Life | Owner `/life?c=` works | `circle-of-life-spec.md` | Server refusal of deep coordinates for non-owners (P1) |
| Safety | Toasts only | `canHide` / `canReport` flags only | Block, mute, report (person, Moment, response, message), review queue |

## 9. Master audit table (§72)

287 rows from nine subsystem audits, grouped by subsystem, with IDs. Some capabilities appear
under more than one lens on purpose. For example, *View as public* is seen from Moment, Respond,
identity, Composer and privacy, and each row carries that lens's evidence.

How to read the table:

- **Duplicates.** Where the same capability appears in several rows, one row is the canonical
  record: its CAPABILITY cell carries a `[…]` tag, and the other rows carry `[see ID]`. Status,
  owner flag and phase are aligned to the canonical row.
- **OWNER DECISION?** Either `YES · D-n`, pointing to the decision in
  [OWNER-DECISIONS-REQUIRED.md](OWNER-DECISIONS-REQUIRED.md), or `NO`. `(safe part: …)` names the
  part of the row that can be fixed now without that decision.
- **PROPOSED PHASE.** `(auditor: Px)` marks a row re-prioritised during synthesis; the reasons are
  in [SOCIAL-COMPLETION-PRIORITIES.md](SOCIAL-COMPLETION-PRIORITIES.md).
- **✔** marks a row reproduced in the browser.

| ID | SURFACE | CAPABILITY | CURRENT STATUS | EVIDENCE | MISSING | RISK | DEPENDENCY | OWNER DECISION? | PROPOSED PHASE |
|---|---|---|---|---|---|---|---|---|---|
| **MC** | **MOMENT CORE (object · feed · media · links · overflow)** | | | | | | | | |
| MC-01 | Moment | Central object model (type) | **PARTIAL** | data.ts:66-100; social-api-contract.md §D:86-121 | stable identity/URL, structured place, timezone/offset, per-viewer capability flags; retired tap fields still in the type (85-87) | live contract drift; a developer ports like-counter fields | API contract rewrite | NO | P1 |
| MC-02 | Moment readout | Author identity (photo, Life Ring, name → Person surface) | **COMPLETE** | Moment.tsx:181, 186-192; identity/PersonIdentity.tsx | — | low | view-model.ts | NO | n/a |
| MC-03 | Moment readout | Life position of another author at the Moment's date [see ID-01] | **CONFLICT** | Moment.tsx:112, 194-198; view-model.ts:80-85, 110-113; circle-of-life.md:96-98; content-rules §3:40-41; api-contract §D:106 | a rule that prevents bounding the birth date across Moments | hard privacy rule (birth-derived calendar precision) | owner decision + server lifeAtMoment | YES · D-1 | P0 |
| MC-04 | Moment readout | Date rule, TODAY, chronology grouping | **COMPLETE** | Moment.tsx:33-48; SocialPreview.tsx:738-746; store.tsx:113-119 | — | low | — | NO | n/a |
| MC-05 | Moment readout | Time + temporal precision | **PARTIAL** | Moment.tsx:215; data.ts:73-77; store.tsx:303, 311-314 | event timezone/offset; precision destroyed by edit (see edit row) | wrong times/order across zones | API §D | NO | P1 |
| MC-06 | Moment readout | Backdated 'shared <when>' provenance | **PARTIAL** | Moment.tsx:45, 175; SocialPreview.tsx:740 | provenance on a backdated Moment that is not first on its day | provenance lost or misattributed | — | NO | P2 |
| MC-07 | Moment readout | Place display and interaction [see PL-01] | **PARTIAL** | Moment.tsx:199-204, 221-227; data.ts:78; Chrome.tsx:254 | click behaviour; structured Place; Earth link | SPACE→PLACE model not connected | Earth deep link /?to=earth; owner | YES · D-16 | P1 (auditor: P2) |
| MC-08 | Moment kind line | People present (fields.with) | **BROKEN** | Moment.tsx:89-90, 121, 247-272; Composer.tsx:672-674; store.tsx:271 | id-only picker; tagging consent; no duplicate meeting 'with' | unmatched names render as fixture person 'M' | people picker; owner (tagging) | YES · D-11 (safe part: A12, A13) | P1 |
| MC-09 | Moment body | Text with 420-char more/less | **COMPLETE** | Moment.tsx:28, 169-170, 276-285 | 'more'/'less' localized (281) | i18n leak | catalog | NO | P2 |
| MC-10 | Media | Single + multi photo at own aspect, +N grid | **PARTIAL** | Media.tsx:29-76 | lightbox/fullscreen/gestures/download; tiles 1-3 are no-op buttons; 'Show fewer' English (71); srcset | dead affordances; no way to see a photo larger | owner (media scope); CDN | YES · D-20 | P1 |
| MC-11 | Media | Video [video] | **PARTIAL** | Media.tsx:78-93; interaction-spec §3:81 | playback; the play button has no action | visible control that does nothing | live media pipeline | YES · D-20 | P1 |
| MC-12 | Media | Link card | **COMPLETE** | Media.tsx:96-112 | live unfurl endpoint (canned in prototype, Composer.tsx:212) | low | live unfurl | NO | P2 |
| MC-13 | Media | Alt text | **PARTIAL** | data.ts:32; Media.tsx:20-26; Composer.tsx:214; api-contract §D.2:133 | alt authoring in Composer; contract says optional | a11y for uploaded photos | upload pipeline | NO | P1 |
| MC-14 | Media | Loading + failure fallback | **COMPLETE** | Media.tsx:15-27, 34 | — | low | — | NO | n/a |
| MC-15 | Moment actions | Respond (writes) | **COMPLETE** | Moment.tsx:162-167, 293-303 | docs still describe the retired tap | porting the wrong API | doc correction | NO | P2 |
| MC-16 | Moment actions | Boom Expression + Human Pulse | **COMPLETE** | Moment.tsx:304, 372; expressions.tsx:1075 | fixture 'wonder' dropped (data.ts:643) | low | preservation boundary | NO | P2 |
| MC-17 | Moment actions | Celestial Resonance | **DISCONNECTED** | Moment.tsx:305, 362, 373; flags.tsx:30-39; ResonateControl.tsx:36, 74, 137 | enabled on /world (default off by rollout contract) | low | flag rollout | YES · D-3 | P2 |
| MC-18 | Moment actions | View in Life [see PL-04] | **DISCONNECTED** | Moment.tsx:307-310, 344, 351; CirclePreview.tsx:94 | link to /life?c=day:<date> for own Moments; rule for others | only visibly disabled affordance in product | Phase 6; owner | YES · D-15 | P1 (auditor: P2) |
| MC-19 | Overflow (own) | Edit | **BROKEN** | Composer.tsx:119, 209-212, 220, 596-598; store.tsx:143-144 | time/precision preservation; media preservation; focus back to the Moment | silent data corruption, fabricated '12:00' | — | NO | P0 |
| MC-20 | Overflow (own) | Delete | **PARTIAL** | Moment.tsx:333-343; store.tsx:145-146 | undo, focus management, orphaned notification handling, failure state | accidental loss; focus lost | owner (undo) | YES · D-27 (safe part: A20) | P1 |
| MC-21 | Overflow (own) | Change privacy | **COMPLETE** | Moment.tsx:320-332; store.tsx:147-148 | server + failure state | low | live API | NO | n/a |
| MC-22 | Overflow (other) | Report / Hide | **PARTIAL** | Moment.tsx:348-349, 686; store.tsx:190-191 | report endpoint/reason; persistent hide; undo | false assurance ('someone will look') | live moderation API | YES · D-10 | P1 |
| MC-23 | Overflow (other) | Copy link | **BROKEN** | Moment.tsx:350; src/app (no Moment route) | a resolvable URL; confirmation only on success; owner access | user-visible link that resolves nowhere | permalink decision | YES · D-12 (safe part: A19) | P1 |
| MC-24 | Linking | Moment permalink + privacy on links [Moment permalink] | **MISSING** | src/app routes; focus-moment.ts:11-27; store.tsx:205-210 | route, server resolution, non-disclosure for onlyme/friends/hidden/deleted | cannot share or return to a Moment | owner + live API | YES · D-12 | P1 |
| MC-25 | Privacy | Others' only-me filtered | **COMPLETE** | store.tsx:117; Chrome.tsx:253 | server-side filter (api §D:115) | low in prototype | live API | NO | n/a |
| MC-26 | Privacy | friends privacy enforcement [see XC-02] | **OWNER DECISION** | store.tsx:113-119; Chrome.tsx:253; view-model.ts:138-150 | relationship gate in feed/search/density | disclosure if live mirrors prototype | backend relationship contract | YES · D-2 | P0 |
| MC-27 | Privacy | View as public over the Moments stream [see XC-04] | **BROKEN** | SocialPreview.tsx:516, 717, 737-746; Moment.tsx:103, 112; moment-conversation-model.md:104 | feed rendered through PUBLIC_VIEWER | owner shown only-me Health/Problem and exact ages as 'public' | — | NO | P0 (auditor: P1) |
| MC-28 | Conversation | Inline + focused phone conversation | **PARTIAL** | Moment.tsx:157-167, 466-525, 536-614 | Reply in focused surface (596, 599); focus trap + return | deep threads cannot be replied to on phones | — | NO | P1 |
| MC-29 | Conversation | Health/Problem response gating | **CONFLICT** | Moment.tsx:374-395; moment-conversation-model.md:103 | decision | private record accepts conversation | owner | YES · D-8 | P1 |
| MC-30 | Feed | Chronology + 8-per-page Load more + end sentence | **COMPLETE** | store.tsx:95, 113-119, 203-204; SocialPreview.tsx:749-758 | live cursor pagination (api §G:196-203) | low | live API | NO | P1 |
| MC-31 | Feed | Whose Moments the stream holds [whose Moments a World holds] | **CONFLICT** | store.tsx:113-119; api-contract §G:204; feature-parity §6:121; wireframes §1:28-38 | author filter for visitor streams (or a decision) | a visitor's World view is a network feed | owner | YES · D-4 | P1 |
| MC-32 | Feed | Empty / loading / error states | **MISSING** | SocialPreview.tsx:749-758; store.tsx:143-148, 203-204 | first-Moment empty state, skeleton, load/pagination/mutation failure + retry | live port invents them ad hoc | live API | NO | P1 |
| MC-33 | Feed | Life Cursor | **PARTIAL** | LifeCursor.tsx:38-93; SocialPreview.tsx:717 | single-subject meaning; preview viewer; localized prefix; bar-height token | reads as one life while switching between authors | feed-scope decision | NO | P2 |
| MC-34 | Moment | Keyboard / focus | **PARTIAL** | Moment.tsx:416-460, 546-563 | arrow keys in menus; focus return; focus trap on aria-modal surface | a11y | — | NO | P2 |
| MC-35 | Moment | Mobile layout | **PARTIAL** | Moment.tsx:221-227, 287, 297, 312, 379 | 44px ⋯ and responses targets on phone | tap accuracy | — | NO | P2 |
| MC-36 | Moment | Dark/light | **COMPLETE** | SocialPreview.tsx:54-71 | — | low | — | NO | n/a |
| MC-37 | Moment | Localization of system strings | **PARTIAL** | Moment.tsx:195, 197, 254, 281, 644, 649, 675; Media.tsx:71; LifeCursor.tsx:77 | catalog routing | English leaks in 7 locales | catalogs | NO | P2 |
| MC-38 | Moment | Live updates | **MISSING** | store.tsx:4-6; api-contract §H:206-222 | socket-driven insert/update/remove | stale conversations | live WebSocket | NO | P2 |
| **RS** | **RESPOND / CONVERSATION** | | | | | | | | |
| RS-01 | Moment action row | Respond verb opens conversation with cursor in composer (desktop / shallow) | **COMPLETE** | Moment.tsx:162-167, 293-303; social-final.js:250-253 | — | low | none | NO | n/a |
| RS-02 | Moment action row (phone, 3+ top-level) | Respond puts cursor in composer in the focused surface | **BROKEN** | Moment.tsx:164, 546-548 override NoteComposer autoFocus :609/:734; _capture-r3.js:126 forces focus · ✔ runtime-verified 4.3 V1 (activeElement = dialog DIV) | composer focus after dialog mount | The primary verb does not do what it promises on the primary device | none | NO | P1 |
| RS-03 | Conversation (all) | Multiple people write responses | **COMPLETE** | store.tsx:120-128, 192-193; data.ts:687-741 | live multi-user arrival | low in prototype | live WebSocket (social-api-contract.md:210) | NO | n/a |
| RS-04 | Inline conversation | One reply level (parentId) | **COMPLETE** | Moment.tsx:485-502, 669-673; social-final.js:278-283 | addressee context for reply-to-reply | low | none | YES · D-19 | P2 |
| RS-05 | Focused conversation surface (phone) | Reply to a response | **BROKEN** | Moment.tsx:596, 599 onReply={() => {}}; Reply still rendered :669-673; composer :609 has no parentId · ✔ runtime-verified 4.3 V2 (27 Reply buttons, none opens a composer) | reply state + reply composer | Reply is impossible where deep threads live on phones; visible dead control | none | NO | P0 |
| RS-06 | Response ⋯ (own) | Edit own response | **PARTIAL** | Moment.tsx:653-665, 682; store.tsx:194-195 | multi-line edit (input strips newlines), Escape, failure path | Silent loss of line breaks | none | NO | P2 |
| RS-07 | Response ⋯ (own) | Delete own response | **OWNER DECISION** | Moment.tsx:683 (no confirm); store.tsx:197 cascades replies; social-interaction-spec.md:101 | confirm/undo, failure path, cascade policy | Deleting my words deletes other people's replies | owner decision on cascade vs tombstone | YES · D-9 | P1 |
| RS-08 | Response ⋯ (other) | Report a response | **PARTIAL** | Moment.tsx:686; en.ts:96 'someone will look' | report record, reason, hide-pending-review, live endpoint | UI promises review that does not exist | safety API | YES · D-10 | P1 (auditor: P0) |
| RS-09 | Response ⋯ (Moment owner viewing others' responses) | Owner hides/removes an inappropriate response on their own Moment | **MISSING** | Moment.tsx:680-687 branches only on note authorship | owner stewardship action + contract permission | A person cannot remove abuse from their own memory | owner decision; moderation API | YES · D-9 | P1 (auditor: P0) |
| RS-10 | Response / Person surface | Block / mute a person from a response | **MISSING** | my-world-product-completeness.md:34 | person-level block | launch safety | backend contract | YES · D-10 | P1 |
| RS-11 | Conversation ordering | Truthful chronology, no ranking | **COMPLETE** | store.tsx:193; Moment.tsx:171, 474, 485; moment-conversation-model.md:82, 113 | client relies on server order (no sort by at) | low | server ordering | NO | n/a |
| RS-12 | Inline conversation (desktop) | Long-thread collapse / batching | **PARTIAL** | Moment.tsx:464, 474-475, 507-519, 383 vs preview :391-392 | window consistent with preview; batching; replies in hidden count | Previewed newest response disappears on open; 40-thread explodes after posting | owner decision on window | YES · D-19 | P2 |
| RS-13 | Feed presence line | Recent-response preview | **COMPLETE** | Moment.tsx:387-394 | — | low | none | NO | n/a |
| RS-14 | Adaptive depth | Threshold matches doc | **CONFLICT** | Moment.tsx:163 (top-level) vs moment-conversation-model.md:54 ('3+ responses') | doc precision | 2 top-level + many replies stays inline at 360 | doc fix | NO | P3 |
| RS-15 | Focused conversation surface (360) | Memory header, full list, bottom composer | **PARTIAL** | Moment.tsx:536-614; social-r3-3d-expression.js:145-155; evidence 19-focused-conversation-mobile.png | focus return, touch-none scrim (TransientSurface.tsx:38-46, 68), batching, reveal of just-sent response (:609) | Lost focus, scroll bleed, 'did it send?' | none | NO | P1 |
| RS-16 | Focused conversation surface | Escape closes top-most layer only | **BROKEN** | Moment.tsx:419-428, 549-550; PersonCard.tsx:52-58; spec social-interaction-spec.md:14 | layer-aware Escape | Escape on a menu dismisses the whole conversation | none | NO | P2 |
| RS-17 | Response author (inline) | Author → Person World | **COMPLETE** | Moment.tsx:637-640; social-r2-expression.js:129-130 | — | low | WorldProvider | NO | n/a |
| RS-18 | Response author (phone focused surface) | Author → Person World visible above the surface | **BROKEN** | PersonCard.tsx:82 and Moment.tsx:555 both z-[60]; PersonCard mounted earlier SocialPreview.tsx:673 vs sheet :716 (code-inferred) · ✔ runtime-verified 4.3 V3 (card mounts behind the surface; evidence 14-*.png) | z-order / close-then-open | Invisible dialog holding focus; loop to Message broken on phone | browser verification | NO | P1 |
| RS-19 | Life day view (/life) | Response author → Person | **DISCONNECTED** | circle/DayAlmanac.tsx:60; Moment.tsx:637 (no WorldProvider) | WorldProvider on the Life route | Names are dead text in Life | Circle composition | NO | P2 |
| RS-20 | Response → Chat | Continue a conversation privately | **PARTIAL** | PersonCard.tsx:72-76, 131-135; WorldProvider.tsx:27-39 | Moment context; strangers cannot message | low | owner decision | YES · D-25 | P3 |
| RS-21 | Notifications | Responses generate notifications (on your Moment, reply to you, mention) and land on the response | **MISSING** | store.tsx:192-193, 225-226; data.ts:102-115; Chrome.tsx:471-477 | runtime events, response/reply kinds, noteId, open-conversation landing | Conversation has no return loop | live event contract | YES · D-13 | P1 |
| RS-22 | Notification fixtures | Truthful response notifications | **CONFLICT** | data.ts:749, 751-753, 756 vs data.ts:640-652, 566-578, 653-665, 475; moment-conversation-model.md:28 | matching fixtures / retired word removed | Rows claim responses and a mention that do not exist | mentions decision | YES · D-24 (safe part: A25) | P2 |
| RS-23 | Response row | Timestamp | **BROKEN** | Moment.tsx:667; store.tsx:311-314; data.ts:397-407 (1983 Moment); data.ts:738 UTC shift; evidence 19-focused-conversation-mobile.png | date when not today; correct fixture clock; zone-bearing instants | Temporal truth violated in a memory product | none | NO | P1 |
| RS-24 | Response row | Edited state | **COMPLETE** | Moment.tsx:668; store.tsx:195 | editedAt in contract | low | contract | NO | n/a |
| RS-25 | Response row | Person identity (photo + Life Ring + name) | **COMPLETE** | Moment.tsx:632, 637-644; PersonIdentity.tsx:61-65 | decorative ring label to avoid double name (LifeRing.tsx:76, 101) | a11y noise | none | NO | P3 |
| RS-26 | Response row / contract | No Life leak in author rows | **PARTIAL** | Moment.tsx:632 (band at note.at); view-model.ts:80-85, 110-113; social-api-contract.md:66-82, 123-128; store.tsx:271 holds full Person client-side | contract: PersonRef band = current band; server-side PersonRef only | Timestamped band series can bracket a birthday at a 15-year boundary | live API | YES · D-1 | P2 |
| RS-27 | Response composer | Mentions | **MISSING** | no parsing in Moment.tsx:698-772; data.ts:752 claims one | model, privacy rule, notification | low (future) | owner decision | YES · D-24 | P3 |
| RS-28 | Response composer | Attachments / media / links | **MISSING** | moment-conversation-model.md:84-97; Moment.tsx:750-757, 645 | by design; no linkify, no overflow-wrap | Long URL can overflow at 360 | none (wrap) / owner (links) | NO | P3 |
| RS-29 | Response composer | Keyboard (Enter/Shift+Enter, IME, newlines) | **PARTIAL** | Moment.tsx:740-745, 645, 661; Messages.tsx:133; en.ts:341 | isComposing guard; rendered newlines | Premature send for CJK/Devanagari IME users (plausible) | none | NO | P1 |
| RS-30 | Response composer (phone) | Mobile composer above keyboard, touch targets | **PARTIAL** | Moment.tsx:608-609, 670, 675, 766; layout.tsx:18-25; s7-device-responsive-contracts.md:43-44 | real-device keyboard verification; 44px Reply/⋯ | Composer hidden by keyboard on iOS; small targets | device QA | NO | P2 |
| RS-31 | Conversation data | Pagination / loading / fetch error | **MISSING** | data.ts:626; Moment.tsx:592-605; social-api-contract.md:161-162 | cursor pagination, loading and error states | Large threads unscalable | live API | NO | P1 |
| RS-32 | Conversation | Empty state | **COMPLETE** | Moment.tsx:482; en.ts:333 | 'Write a response' does not focus composer (Moment.tsx:378) | low | none | NO | P3 |
| RS-33 | Response composer | Send failure keeps text + Retry | **COMPLETE** | Moment.tsx:710-715, 760-764; social-final.js:306-310 | edit/delete failure paths | low | none | NO | n/a |
| RS-34 | Response composer | Length / rate limits | **MISSING** | Moment.tsx:29, 627-628, 730-749 | maxLength + server limit + rate limit | abuse / layout | contract | NO | P2 |
| RS-35 | Permissions | Who may respond (visitor vs owner vs connection) | **OWNER DECISION** | Moment.tsx:517-520 (composer for all); store.tsx:113-119 (friends visibility not enforced); social-api-contract.md:105 | canRespond rule, per-Moment off switch | Strangers on public Moments; unenforced friends visibility in prototype | owner decision + server visibility | YES · D-14 | P1 |
| RS-36 | Health / Problem | No conversation on private records | **CONFLICT** | Moment.tsx:371-395 vs moment-conversation-model.md:102-103 (C-15) | gate or contract change | Private record accepts conversation | owner decision | YES · D-8 | P1 |
| RS-37 | View as public | Conversation shows the visitor perspective [see XC-04] | **BROKEN** | SocialPreview.tsx:516, 737-743; Moment.tsx:103 vs moment-conversation-model.md:104 | preview viewer threaded into MomentEntry | Owner preview is not what a visitor sees | none | NO | P0 (auditor: P2) |
| RS-38 | Conversation chrome | Localization | **PARTIAL** | Moment.tsx:644, 648, 675; PersonIdentity.tsx:65; en.ts:101 | '(you)', 'more/less', aria 'More', 'Circle band' keys | English leakage in 7 locales | catalog keys ×8 | NO | P2 |
| RS-39 | Conversation DOM | Clean accessible output | **BROKEN** | Moment.tsx:521-522 | remove stray spans | Screen reader reads viewer's name meaninglessly | none | NO | P3 |
| RS-40 | Handover docs | One Respond vocabulary and API shape | **CONFLICT** | social-api-contract.md:103-105, 157-162, 210-212; social-interaction-spec.md:73-76, 98-101; social-content-rules.md:113-120, 188-189; social-feature-parity.md:86, 88 vs moment-conversation-model.md:23-29, 114-115 | doc corrections | Live team ships the retired tap as a like counter | none (doc fix per AGENTS.md rule) | NO | P1 |
| RS-41 | Response row | No reaction under a response; Response Branch | **COMPLETE** | Moment.tsx:481, 666-691; store.tsx:198-202 unreachable | — | low | none | NO | n/a |
| **RX** | **BOOM + CELESTIAL (feeling layers, combined action experience)** | | | | | | | | |
| RX-01 | Moment action row | Respond + Boom + Resonate + View in Life + ⋯ fit on phones | **BROKEN** | Moment.tsx:290-358; prototype-evidence/celestial-social-universe/phone-light-360.png, phone-dark-390.png; moment-conversation-model.md:41 · ✔ runtime-verified 4.3 K360/K320 (Resonate + ⋯ outside the column; flag off: fits) · evidence 13-*.png | The ⋯ overflow (Report/Hide/Edit/Delete) falls outside the Moment column at 360 and is cut at 390 when Resonate is on | Safety and owner-management actions unreachable on phones | Celestial momentIntegration flag on | YES · D-5 (safe part: X1) | P0 — Celestial launch gate (auditor: P0) |
| RX-02 | Moment action row | Visual hierarchy: Respond as primary verb | **CONFLICT** | AGENTS.md R2 'RESPOND stays the primary visible verb'; moment-conversation-model.md:25 vs ResonateControl.tsx:104-131; page-light-multi-8p.png | A decided order of emphasis between Respond, Boom and Resonate | Feeling-picking visually outranks writing; reads as a reaction bar | Owner decision on hierarchy | YES · D-5 | P1 |
| RX-03 | Moment (global) | Celestial part of Social completion | **OWNER DECISION** | flags.tsx:30-39 (dark by default); 20-OWNER-DECISION-BOOM-CELESTIAL.md; 22-OWNER-DECISION-MASCOT-PRESERVED.md §3 | A launch decision for momentIntegration | Scope ambiguity decides which items are blocking | none | YES · D-3 | P0 |
| RX-04 | Boom trigger | Discoverability and label | **PARTIAL** | expressions.tsx:895-919 (icon-only; aria-label + title); en.ts:301 | Visible label; touch has no tooltip | First-time users cannot tell the dark lens is an Expression control | Preservation boundary; onboarding decision | YES · D-7 | P1 |
| RX-05 | Boom Emotion Horizon | Names visible before commit on touch | **PARTIAL** | expressions.tsx:735-739, 752-774, 877-878 | Names of the quick six before tapping on touch (only drag-preview or Atlas) | Learning by committing, which produces notifications once live | Preservation boundary | YES · D-7 | P2 |
| RX-06 | Celestial Field | Chooser, state machine, keyboard, close trigger | **COMPLETE** | CelestialField.tsx:77-578, 690-714 | Nothing at prototype level | None beyond live port | Flag on | NO | n/a |
| RX-07 | Celestial Field | Dismissal and coexistence with the Boom deck | **PARTIAL** | ResonateControl.tsx:51-72; CelestialField.tsx:200-202; 22-COMPONENT-ARCHITECTURE.md §1 (Scrim) | Outside-click/scrim close; one-open-at-a-time | Field and Boom deck open together; stale Fields on several Moments | none | NO | P2 |
| RX-08 | Celestial Field | Remove own resonance | **PARTIAL** | CelestialField.tsx:177; en.ts:351 unused | Visible remove control | Users cannot find how to withdraw | none | NO | P2 |
| RX-09 | Celestial Field | Learning states NEW→LEARNING→LEARNED | **MISSING** | ResonateControl.tsx:139-147; CelestialField.tsx:88; 22-COMPONENT-ARCHITECTURE.md §5; LEARNING-LAYER.md §2-§4 | Local progress counter, learningState prop, long-press/tooltip sheet | Permanent NEW density; no learning curve | Local progress storage | YES · D-7 | P2 |
| RX-10 | Moment (three verbs) | First-use onboarding: Respond vs Boom vs Resonate | **MISSING** | No code; 19-LEARNABILITY-USABILITY.md §4; 21-CELESTIAL-RESONANCE-FINAL-BIBLE.md ch.36 | Any explanation surface or validated copy | Users read Boom and Resonate as synonyms (unvalidated either way) | Owner decision; real-user testing | YES · D-7 | P1 |
| RX-11 | Presence line | Vocabulary disambiguation of the 8 shared words | **PARTIAL** | CelestialField.tsx:619-634; ResonateControl.tsx:352; en.ts:318 vs 356 ('{n} people' identical); ne.ts/zh-Hans.ts vs es.ts divergence | A feed-level differentiator; a consistent locale rule | '2 people' and '16 people' side by side read as the same thing or get summed | Owner decision on presence grammar | YES · D-6 | P1 |
| RX-12 | Boom Human Pulse | At most 3 equal lenses + '{n} people', static, 36px | **COMPLETE** | expressions.tsx:1020-1107; human-pulse-contract.md §3 | Nothing at prototype level | Representatives are chosen by count (sanctioned by R3.3) | none | NO | n/a |
| RX-13 | Resonance Constellation | Count guardrails (no totals, 1.0k, '—' zeros, no animation for others' commits) | **CONFLICT** | ResonateControl.tsx:227-240, 246, 286-294; resonance-summary.ts:29 vs COUNT-TRANSITION-RULES.md §1.7-§1.8, §2 | Alignment between code and COUNT-TRANSITION-RULES | Drift toward scoreboard grammar, or docs that mislead the port | Owner count-policy decision | YES · D-6 | P1 |
| RX-14 | Presence line | One anti-popularity count policy across Boom and Celestial | **OWNER DECISION** | human-pulse-contract.md:69 vs COUNT-TRANSITION-RULES.md §0; ResonateControl.tsx:286-290 | A unified rule | Two contradictory count grammars on one Moment | none | YES · D-6 | P1 |
| RX-15 | Presence line (desktop) | Layout of the responses toggle beside the constellation | **BROKEN** | ResonateControl.tsx:262 (w-full); Moment.tsx:371; CelestialEnvironment.tsx:186-188; page-light-multi-8p.png, page-dark-all8-16p.png | Width constraint above the phone container | '1 response' wraps to two lines, pushed away from its preview | none | NO | P2 |
| RX-16 | Resonance expanded stage | Calm, bounded who-detail | **PARTIAL** | ResonateControl.tsx:202, 300-389; phone-dark-360-expanded.png | Height cap / scroll owner | Up to 192 names inline push the feed by thousands of px | none | NO | P2 |
| RX-17 | Boom Spectrum / who-list | Canonical Spectrum, batched identity-only who-list | **COMPLETE** | expressions.tsx:1109-1189; human-pulse-contract.md §4-§5 | Server paging | Low | Live API | NO | n/a |
| RX-18 | Boom who-list | Identity resolution for unknown ids | **BROKEN** | expressions.tsx:1159-1165; store.tsx:271 (PEOPLE.m fallback) vs ResonateControl.tsx:334-339 | Unresolvable-id guard; view-model name read | Mis-attribution to a real fixture person (prototype edge) | Preservation-boundary defect fix | YES · D-26 | P2 |
| RX-19 | Both who-lists | Life privacy (no exact age/day count/birth precision) | **COMPLETE** | view-model.ts:71-78, 87-88; expressions.tsx:1163; ResonateControl.tsx:336, 361; 22-DATA-CONTRACT.md §5 | Nothing at prototype level | Live port must keep the view-model boundary server-side | Live API | NO | n/a |
| RX-20 | Both who-lists | Name visibility policy and block/hidden filtering | **OWNER DECISION** | expressions.tsx:1159-1165; ResonateControl.tsx:332-372; moment-expression-contract.md:67-69; 22-DATA-CONTRACT.md §7 | A policy for strangers on public Moments; server filtering | Exposes social graph to any viewer | Live backend | YES · D-26 | P1 |
| RX-21 | Notifications | Boom Expression notifications | **MISSING** | moment-expression-contract.md:75-76; data.ts:111 | Kind, producer, grouping policy | Silent expressions, or triple notifications once added | Owner notification policy | YES · D-13 | P2 |
| RX-22 | Notifications | Celestial Resonance Signal row | **DISCONNECTED** | Chrome.tsx:547-551; store.tsx:224-232; ResonateControl.tsx:404-407; en.ts:359; celestial-s3-s6.js:183 | Producer, momentId landing, flag gate, localized text, real test | Untested row can render with the flag off if the backend sends the kind | notificationsIntegration flag | NO | P2 |
| RX-23 | Notifications | Respond notification vocabulary and truth | **CONFLICT** | data.ts:749-752, 641-652 vs moment-conversation-model.md:28 | 'response' vocabulary; nt3 points at a Moment with no responses | Stale retired-tap semantics ported to live | none | NO | P3 |
| RX-24 | Health / Problem Moments | Celestial serious-context offering | **OWNER DECISION** | Moment.tsx:305; ResonateControl.tsx:33, 142 (dead); registry.ts seriousContextSafe; 21-CELESTIAL-RESONANCE-FINAL-BIBLE.md:350 | A decision; the code path is dormant | Bible and code disagree on the core serious-context value | none | YES · D-26 | P2 |
| RX-25 | Health / Problem Moments | Conversation on quiet kinds | **CONFLICT** | Moment.tsx:374-395 vs moment-conversation-model.md:102-103; social-shell.js:288-289; SOCIAL_BIBLE_CONTRADICTIONS.md C-15 | Doc/behaviour alignment | Private health record accepts responses the contract says it should not | Owner confirmation | YES · D-8 | P2 |
| RX-26 | Boom data | Seeded expressions valid against the registry | **BROKEN** | data.ts:643 ('wonder'); expressions.tsx:485-488; moment-expression-contract.md:18 | Fixture fix; live id-migration note (wonder→wow) | Silent data loss in the prototype and in any live data created under R2 ids | none | NO | P2 |
| RX-27 | Docs / governance | Frozen-zone exception records and handover location for Celestial | **CONFLICT** | AGENTS.md (0 Celestial mentions); 22-REPOSITORY-INTEGRATION-AUDIT.md:51, 79; SOCIAL_BIBLE_AUDIT.md:1222; docs/handover has no Celestial file | AGENTS.md rows; docs/handover pointer; updated audit | Live developer ports from docs/handover and misses Celestial; frozen edits look unauthorised | none | YES · D-28 | P1 |
| RX-28 | Docs | Boom contract currency | **CONFLICT** | moment-expression-contract.md:18, 28-41 vs expressions.tsx:53-56, 141-203, 1040-1048; systemboom-expression-language.md:27 | Updated id list, accents, representative rule | Live port builds the R2 six | none | NO | P3 |
| RX-29 | Accessibility | Label-in-name for the Resonate trigger and the Who button | **PARTIAL** | ResonateControl.tsx:96, 268, 294 | Accessible names containing the visible text | Voice-control users cannot target the controls | none | NO | P2 |
| RX-30 | Accessibility | Boom picker semantics | **COMPLETE** | expressions.tsx:714-742, 920, 626-634 | Minor: imperative announcement 'Express {name}' (665); aria-haspopup='true' on a radiogroup popup (899) | Low | Preservation boundary | NO | P3 |
| RX-31 | Long feed | Moment-local calm | **PARTIAL** | CelestialEnvironment.tsx:82-83, 109-111; ResonateControl.tsx:114-120; systemboom-expression-language.md:193 | Keep hover/open feedback local to the Moment | Page-wide sky shifts on hover; a gold glow repeats on every Moment | none | NO | P2 |
| RX-32 | Moment (multi-person) | One per viewer per system, independent | **COMPLETE** | store.tsx:171-189; 22-DATA-CONTRACT.md §9 | Server enforcement | Low | Live API | NO | n/a |
| RX-33 | Moment (own) | Self-expression / self-resonance | **OWNER DECISION** | Moment.tsx:304-305 (no isSelf gate) | A policy | Author inflates '{n} people' | none | YES · D-26 | P3 |
| RX-34 | Moment action row | View in Life seam [see PL-04] | **DISCONNECTED** | Moment.tsx:307-310, 344, 351 | A live destination; a disabled control occupies a desktop slot and duplicates the ⋯ entry | Footer density | Phase 6 View in Life | YES · D-15 | P1 (auditor: P3) |
| **ID** | **PERSON IDENTITY / PROFILE / LIFE RING** | | | | | | | | |
| ID-01 | Moment readout / author ring / note author / conversation header / Life Cursor | Visitor-safe life position on others' dated Moments [life position on others' Moments (canonical)] | **CONFLICT** | Moment.tsx:112,181,197,570-574,632; LifeCursor.tsx:76-77; social-api-contract.md §D lifeAtMoment; circle-of-life.md:97-98; data.ts:138 Sunita + m-wedding 2022-10-17 '30–45' vs m-tenphotos 2026-04-13 '45–60' | Mitigation against band-boundary birth-date inference | Any person with Moments on both sides of a 15-year edge has their birth date narrowed, to the day with dense posting. This violates the hard Life-privacy rule | Server lifeAtMoment computation; owner decision on the rule | YES · D-1 | P0 |
| ID-02 | Visitor ProfileHero (harness prakashVisitor / any asymmetric state) | Relationship state + action from the viewer's perspective | **BROKEN** | SocialPreview.tsx:512; model.ts:34; store.tsx:126; ProfileHero.tsx:117,235-249; social-connection-final.js:184-189; people-chat-integration.md §2 | Viewer-relative relationship; requester must see Requested/Cancel, not Accept | Live developer ports an inverted state machine; a requester can accept their own request | Viewer-relative relationship API (not in social-api-contract.md §C) | NO | P1 |
| ID-03 | Visitor ProfileHero Message → MiniChat | Message the profile's person | **BROKEN** | ProfileHero.tsx:108-114; Messages.tsx:177,195-197; WorldProvider.tsx:119-120 | Conversation keyed on the other person from the viewer's perspective | The dock is headed by the visitor's own name and photo | Viewer-relative conversations API | NO | P1 |
| ID-04 | View as public | Owner previews exactly what the public sees [see XC-04] | **BROKEN** | SocialPreview.tsx:516,678,704,717,743; Moment.tsx:103,112; store.tsx:117,274; data.ts:452-459,520-527; person-life-identity.js:320-343 | Stream, Life Cursor and menus through the public stand-in | The preview shows onlyme Health/Problem Moments and exact ages under a 'Viewing as public' banner, which misleads the owner about exposure | none | NO | P0 (auditor: P1) |
| ID-05 | Person World (visitor) routing | Open another person's World from PersonCard / Search / Moment [see PF-04] | **MISSING** | SocialPreview.tsx:465-471; PersonCard.tsx:110-141; my-world-product-completeness.md:17 | A product route; no 'open their World' action | The visitor Hero is harness-only; the live port must map it to the live profile page | Live profile page/route | YES · D-18 | P1 |
| ID-06 | /world owner identity | My World renders the signed-in person | **DISCONNECTED** | store.tsx:104-110,263-264; PersonalDestination.tsx:16-38; Chrome.tsx:84,198 | Binding the gate identity to the Social viewer/profile | A created identity sees fixture Maya's birth data and contact as its own (prototype only) | Live session / viewer API §A | NO | P1 |
| ID-07 | Visitor Person World stream | Moment history of the visited person [see MC-31] | **CONFLICT** | store.tsx:113-118; SocialPreview.tsx:738; social-api-contract.md:204; social-feature-parity.md:121; bible C-14 | Author filter; friends-privacy gating | The visitor sees everyone's friends-only Moments inside another person's World | friends privacy backend contract | YES · D-4 | P1 |
| ID-08 | ProfileHero owner management | Change photo / cover / profile visibility | **DISCONNECTED** | ProfileHero.tsx:196,316,320,336,340 (no onClick); social-feature-parity.md:44 | Upload flows; visibility semantics | Inert controls promise actions that do nothing | Live profile/media APIs | YES · D-23 | P1 |
| ID-09 | PersonCard / Person World | Person-level block / report | **MISSING** | PersonCard.tsx:110-141; my-world-product-completeness.md:34,48-50 | Block/report person | Launch safety gap if the live product lacks it | Safety API | YES · D-10 | P1 |
| ID-10 | Visitor ProfileHero / PersonCard ring | Documented-memory density + engraving for non-owners | **CONFLICT** | view-model.ts:164-171; PersonIdentity.tsx:36,63; LifeRing.tsx:18-21 vs 86-87,149-155; circle-of-life.md:99-101; my-world-2030.js:128-131 | One agreed rule | Docs and comments claim owner-only while visitors see engraving; same inference class as the P0 row | Owner decision; friends contract | YES · D-1 | P0 (auditor: P2) |
| ID-11 | CircleModule visitor | Band-only compact Circle | **COMPLETE** | CircleModule.tsx:31,44-80; conflicts with social-api-contract.md §C momentsThisMonth | Contract doc correction | Live dev may ship a visitor month count (a density leak) | none | NO | P2 |
| ID-12 | Sidebar counter (visitor) | Counter theirs-to-see copy | **PARTIAL** | SocialPreview.tsx:696-701; s2-person-world/10-visitor-desktop-light.png | Correct heading ('MY LIFE IN' on another person's World) | Ownership copy error | none | NO | P2 |
| ID-13 | PersonIdentity / RingAvatar (all surfaces) | Real photo → initials, no second avatar system | **COMPLETE** | PersonIdentity.tsx:61-66; LifeRing.tsx:225-237 | Failed-src reset (LifeRing.tsx:226); aria trailing dash (LifeRing.tsx:76) | Low | none | NO | P2 |
| ID-14 | IdentityGate / Cosmos identity chip | Signed-in person identity | **CONFLICT** | IdentityGate.tsx:202,277; cosmos/overlays.tsx:198; ui/Avatar.tsx:19-60; PersonIdentity.tsx:10 | Life Ring + onError fallback | Second avatar system; broken-image icon on a failed photo | Frozen Phase 1 exception for overlays.tsx | YES · D-29 (safe part: C19) | P2 |
| ID-15 | Search people / Notifications / People / Chat | Identity + band-only life text | **COMPLETE** | Chrome.tsx:367-377,512,540; People.tsx:121-137; Messages.tsx:88,195; ChatSurface.tsx:84,115 | — | — | Server PersonRef {bandIndex, bandLabel} only | NO | n/a |
| ID-16 | Chat /chat?c= | Message connected people only | **DISCONNECTED** | ChatSurface.tsx:51; people-chat-integration.md §2 | Relationship guard on the deep link | A stranger's conversation can be opened by URL | Server-side guard (P1 in my-world-product-completeness.md:48-50) | NO | P1 |
| ID-17 | Resonance people list / Boom who-expressed | Open the person surface from a person row | **PARTIAL** | ResonateControl.tsx:359-363; expressions.tsx:1161-1165 | openPerson link (Boom list is a preservation boundary: report only) | Inconsistent discoverability | none | YES · D-26 (safe part: C6) | P2 |
| ID-18 | Identity accessible labels | Localized position labels / tooltips | **PARTIAL** | PersonIdentity.tsx:65; LifeCursor.tsx:77; Moment.tsx:195,197; LifeRing.tsx:109,185; CircleModule.tsx:87; ProfileHero.tsx:121 | Catalog keys | English announced on every non-English locale | none | NO | P2 |
| ID-19 | Person World | About / bio | **OWNER DECISION** | lib/mock/demo-user.ts:18 (bio exists); data.ts:11-23 (no field); ProfileHero.tsx (none) | Field + render + visibility | Low | Profile API | YES · D-23 | P3 |
| ID-20 | Person World | Home-place / profile visibility | **OWNER DECISION** | view-model.ts:72; ProfileHero.tsx:205,320; PersonCard.tsx:96; social-api-contract.md §C homePlace | Visibility model | Home city always public | Profile settings API | YES · D-23 | P2 |
| ID-21 | Person World | Friends/family list, mutual people, shared Moments/Places | **OWNER DECISION** | No code; people-chat-integration.md §8 (no request centre) | Everything | Low | Relationship API | YES · D-23 | P3 |
| ID-22 | Profile photo | Real-photo rule enforcement | **OWNER DECISION** | person-life-identity.md §2; SocialPreview.tsx:535 (?photo=bad renders unchallenged) | Upload validation / moderation | Illustrations or logos inside the Life Ring | Upload pipeline | YES · D-30 | P2 |
| ID-23 | Client data boundary | Visitor payloads carry band only | **PARTIAL** | data.ts:135-157 (all birthDates client-side); view-model.ts:11-14; social-api-contract.md §C | Server-computed band; prototype mirrors the boundary only | Live port must not ship fixtures' shape | Server view model | NO | P1 |
| ID-24 | Handover docs | Docs match accepted identity behaviour | **CONFLICT** | person-life-identity.md:27-30,56-68,80-84,93-99; social-visual-spec.md:106-110,191-197; social-feature-parity.md:47,51; social-content-rules.md:103-105 | Corrections | Live dev implements superseded sizes, overlap, hero counter, friends density | none | NO | P2 |
| **PF** | **PEOPLE · FRIENDS · RELATIONSHIPS · SEARCH** | | | | | | | | |
| PF-01 | Moments feed + Search + ring | `friends` privacy enforced against relationship [see XC-02] | **OWNER DECISION** | store.tsx:117; Chrome.tsx:253; view-model.ts:164-169; data.ts:478-490, 530-541 vs model.ts:34; SOCIAL_BIBLE_CONTRADICTIONS.md C-14 | One contract for feed, search and density; does Family count as Friends | Friends-only Moments of non-connected people are readable and searchable in the reference (Prakash, request-in) | Backend privacy filter | YES · D-2 | P0 |
| PF-02 | Data contract | Relationship + request API (directional, per viewer–subject pair) | **MISSING** | social-api-contract.md:123-128 (PersonRef 'Nothing else'); no relationship section; my-world-product-completeness.md:18-19, 48-51 | relationship field on PersonRef, home, request endpoints with requester/addressee, state machine | The live port has to guess the state mapping; the UI chips have no data source | Live friends/requests backend | NO | P1 |
| PF-03 | WorldProvider / ProfileHero / PersonCard / People / Search (visitor modes) | Viewer-relative relationship state | **BROKEN** | WorldProvider.tsx:118-127; SocialPreview.tsx:509-512; ProfileHero.tsx:235-248; social-connection-final.js:184-191 | Direction and per-pair keying | The requester sees Accept on his own request; Hero says Friends while PersonCard says Not connected | Recorded supersession of the accepted test | NO | P1 |
| PF-04 | PersonCard → Person World | Open another person's World / profile [another person's World] | **MISSING** | PersonCard.tsx:110-141; SocialPreview.tsx:465; store.tsx:108-110; social-feature-parity.md:121; people-chat-integration.md:33-34 | Route or action to the visitor profile page | A class-A live capability (visitor profile) has no reference entry; every discovery loop ends at a dialog | Live profile page mapping | YES · D-18 | P1 |
| PF-05 | Visitor World feed | Visitor profile shows the subject's Moments only [see MC-31] | **CONFLICT** | store.tsx:113-119, 274 vs social-api-contract.md:204 | Author filter in visitor mode | The reference visitor page reads as a shared feed, not the person's World | Profile-opening decision | YES · D-4 | P1 (auditor: P2) |
| PF-06 | People / live Friends & Family pages | Connection to the live Friends page (tabs, grid, Unfriend) and Family tree | **DISCONNECTED** | People.tsx:163-258 (no link); social-feature-parity.md:32, 115; my-world-product-completeness.md:21 | Entry point, or an owner decision that People replaces them | Live Friends functionality is orphaned in the new shell | Owner decision + live routes | YES · D-18 | P1 |
| PF-07 | Chat | Messaging only between connected people | **PARTIAL** | PersonCard.tsx:131-134 (UI only); ChatSurface.tsx:49-51; WorldProvider.tsx:58-79 | Guard in reducer/deep link; server-side guard live; policy after Remove | A stranger can be messaged via /chat?c=; a removed friend's conversation stays sendable | Chat SSO + backend | YES · D-18 (safe part: C4) | P1 |
| PF-08 | Relationship model | Five states + actions (owner perspective) | **COMPLETE** | model.ts:27, 49; WorldProvider.tsx:47-57; People.tsx:73-114; PersonCard.tsx:110-141; ProfileHero.tsx:212-251; Chrome.tsx:522-529 | Transition validation (reducer unguarded) | Low in the prototype | — | NO | n/a |
| PF-09 | PersonCard | Family relationship handling (Remove, creation) | **CONFLICT** | PersonCard.tsx:131-139; WorldProvider.tsx:50-55 vs my-world-product-completeness.md:20 | Rule for whether family can be removed or created here | A family tie is destroyed from a card with no confirmation | Live family tree | YES · D-18 | P2 |
| PF-10 | PersonCard | Remove confirmation | **PARTIAL** | PersonCard.tsx:136 | Inline confirm | Accidental unfriend | Suite update | NO | P2 |
| PF-11 | People | Friends vs Family distinction / filtering | **PARTIAL** | People.tsx:133-139, 175; prototype-evidence/social-connection-final/07-people-surface-desktop.png | State word on rows; any filter | Family reads as friends | — | NO | P2 |
| PF-12 | People | Recent people / people from Places / shared connections | **MISSING** | People.tsx:163-258; Chrome.tsx:424 | All three | Low; future expansion | Directional graph; privacy decision for mutuals | YES · D-23 | P3 |
| PF-13 | Notifications | Request notification consistency with relationship state | **BROKEN** | Chrome.tsx:529; Chrome.tsx:524-525 vs People.tsx:97-101, PersonCard.tsx:113-117 | State-derived outcome; read-sync on accept elsewhere | Untrue 'Declined'; bell stays red for a resolved request | — | NO | P2 |
| PF-14 | Notifications | 'Accepted your request' / relationship event kinds | **MISSING** | data.ts:111 | Event kind + backend event | The requester never learns the outcome | Notifications API | NO | P2 |
| PF-15 | Moment people lists | Who-expressed and Resonance people open the Person surface | **DISCONNECTED** | expressions.tsx:1159-1167; ResonateControl.tsx:359-364 | openPerson on rows | Dead ends | BOOM preservation boundary + Celestial owners | YES · D-26 (safe part: C6) | P2 |
| PF-16 | Chat | Chat → Person surface; cross-route relationship state | **MISSING** | ChatSurface.tsx:29-37, 104-118 | PersonCard in /chat; shared provider | Chat identity is terminal; state resets across routes (prototype) | Chat phase | NO | P2 |
| PF-17 | Search | People / Moments / Photos / Places with photo + Life Ring | **COMPLETE** | Chrome.tsx:349-434, 367, 391; s5-s6-discovery-motion.md:32-51 | — | — | Search API | NO | n/a |
| PF-18 | Search | Life privacy in results | **COMPLETE** | Chrome.tsx:375; view-model.ts:110-112 | Band-at-Moment narrowing decision (Chrome.tsx:391) | Birth window derivable across band transitions | Owner decision | YES · D-1 | P1 |
| PF-19 | Search | Keyboard / screen-reader | **PARTIAL** | Chrome.tsx:285-304 | combobox/listbox semantics, arrow nav, localized region label | Weak keyboard discovery | — | NO | P2 |
| PF-20 | Search | Mobile sheet, zero state, no-results | **COMPLETE** | Chrome.tsx:308-347 | — | — | — | NO | n/a |
| PF-21 | Search | Recent searches | **PARTIAL** | data.ts:759; Chrome.tsx:336-338 vs s5-s6-discovery-motion.md:49 | Real history + storage contract | Fixture presented as personal history | Owner decision on storage | YES · D-23 | P2 |
| PF-22 | Search | Matching depth (author→Moments, place/home, diacritics) | **PARTIAL** | data.ts:277-282; Chrome.tsx:254-259 | Author-name Moment matching, folding, derived places | Low recall | Live search API | NO | P3 |
| PF-23 | Search | Own-row destination | **BROKEN** | Chrome.tsx:257, 357-363 | A destination or a non-interactive row | Dead click | — | NO | P2 |
| PF-24 | All people surfaces | No follower / popularity metrics | **COMPLETE** | People.tsx:17-18 (only hits); data.ts:280 insertion order | — | — | — | NO | n/a |
| PF-25 | i18n on people surfaces | Relationship vocabulary consistency | **OWNER DECISION** | en.ts:57-70, 151-152, 288 | One term per state | The same state reads three ways | en byte-identical assertions | YES · D-18 | P2 |
| PF-26 | Handover docs | Docs describe the accepted People/Search model | **CONFLICT** | people-chat-integration.md:9-16, 87; social-feature-parity.md:32; social-shell-spec.md:47, 57; social-visual-spec.md:302-304; social-interaction-spec.md:138; s5-s6 :37-39 vs :93-94; systemboom-navigation-map.md:37 | Doc updates | A developer ports a stale model (no People, 3 search groups, a 'no request centre' rule) | — | NO | P2 |
| **CN** | **CHAT · NOTIFICATIONS** | | | | | | | | |
| CN-01 | Notifications | Friend-request notification answered in place | **COMPLETE** | Chrome.tsx:505-533; data.ts:748; WorldProvider.tsx:50-57 | Outcome is not recorded on the row; resolving the request elsewhere does not mark it read | False 'Declined' after Remove; bell stays unread for a resolved request | Live requests API and state machine (my-world-product-completeness.md:19) | NO | P2 |
| CN-02 | Notifications | Request outcome chip truthfulness | **BROKEN** | Chrome.tsx:529; PersonCard.tsx:136 | Store the resolved outcome instead of deriving it from the live relationship | An untrue relationship statement | none | NO | P2 |
| CN-03 | Notifications | Cross-surface read sync for requests | **DISCONNECTED** | PersonCard.tsx:113-118; People.tsx:97-101; ProfileHero.tsx:117-118 vs store.tsx:213-214 | Bridge between WorldProvider relationship actions and SocialStore read state | Stale unread dot and count | Live: server-side notification state | NO | P2 |
| CN-04 | Notifications | Kind model and payload contract (response, reply, mention, inclusion, Boom, Resonance, accepted) | **PARTIAL** | data.ts:102-115 (kind 'request' \| 'resonance' only); social-api-contract.md has no Notification section (only :72, :80, :213) | Explicit kinds, subject ids (momentId, noteId, subjectType), audience, privacy-safe preview, event grammar template | The live port has no contract to map human events; English free text cannot be localised | Backend notifications API | YES · D-13 | P1 |
| CN-05 | Notifications | Notifications generated by actions | **MISSING** | store.tsx:137-202, 225-226; WorldProvider.tsx:50-79 | Any event generation; everything is a fixture | The prototype cannot show that response, Boom or Resonance events reach anyone | Live server events / WebSocket (social-api-contract.md:206-213) | YES · D-13 | P1 |
| CN-06 | Notifications | 'Someone Responded to your Moment' | **CONFLICT** | data.ts:751, 753, 756 point at Moments with notes: [] (data.ts:641-665, 567-578) vs moment-conversation-model.md:25-29 | Fixtures coherent with the R3 Respond-writes model; a 'response' kind | Landing shows no Response from the named person; the retired tap leaks back in as meaning | Owner vocabulary decision (bible C-7) | YES · D-13 | P1 |
| CN-07 | Notifications | 'Replied to your Response' | **MISSING** | No fixture or kind; Note.parentId exists (data.ts:60) | Kind, noteId target, response-level landing | Conversation replies go unseen | Notification contract; response-level deep link | YES · D-13 | P1 |
| CN-08 | Notifications | 'Resonated' (Celestial) signal row | **DISCONNECTED** | data.ts:111-114; Chrome.tsx:547-551; store.tsx:224-233 never dispatched (SocialPreview.tsx:487, 601); flags.tsx:111-117 notifications surface never queried | Reachable harness mode, flag gate, a momentId on the fixture, the Resonance named in text or aria | A 'PASS' claim with no rendered row (23-CONTROLLED-IMPLEMENTATION.md:16 vs celestial-s3-s6.js:183) | Celestial flags (ship dark) | YES · D-13 | P2 |
| CN-09 | Notifications | 'Used Boom' (Expression) notification | **MISSING** | moment-expression-contract.md:75-76 (seam); store.tsx:171-179 does not touch notifications | Kind plus a noise policy | Either unseen feeling or notification noise at scale | Owner noise and aggregation decision | YES · D-13 | P2 |
| CN-10 | Notifications | 'Included you in a Moment' | **PARTIAL** | Fixture nt7 data.ts:755 matches m-meeting.with data.ts:511; no kind | Kind; generation from the composer `with` field; audience check | Tagging with no notice, or notice to people outside the audience | Notification contract | YES · D-13 | P2 |
| CN-11 | Notifications | Mention | **CONFLICT** | Fixture nt4 data.ts:752; no mention model in src; the target m-video has no mention (data.ts:473-476) | Mention model, or removal of the fixture | The fixture advertises a capability that does not exist | Owner decision | YES · D-24 | P3 |
| CN-12 | Notifications | Chat message delivered as a signal | **COMPLETE** | Messages.tsx:31-48; WorldProvider.tsx:143; people-chat-integration.md:38-40 | Nothing by design: the Messages dot, not the bell | none | Live real unread source (P1) | NO | n/a |
| CN-13 | Notifications | Grouping and noise control ('Maya and 4 others…') | **MISSING** | Chrome.tsx:464-468 (day grouping only); store.tsx:234-241 | Actor or per-Moment aggregation, caps, mute | Row-per-person floods once Response, Boom and Resonance events are real | Owner grammar decision; backend aggregation | YES · D-13 | P1 |
| CN-14 | Notifications | Read / unread / mark all read | **COMPLETE** | Chrome.tsx:89, 138-141, 472, 491, 510, 524-525, 566; store.tsx:211-214 | Persistence (in memory only); request rows have no dot | Low | Live notification state | NO | n/a |
| CN-15 | Notifications to Moment | Land on the exact Moment | **PARTIAL** | Chrome.tsx:471-477; store.tsx:205-210; focus-moment.ts:11-27 (early return :14-15) | Response-level landing (noteId); a visible outcome for a deleted, hidden or not-visible target; live fetch by id / Moment route | Silent dead action after the panel closes | Moment-by-id API; landing owner decision | YES · D-12 (safe part: C8) | P2 |
| CN-16 | Notifications | Privacy of notification content and identity | **PARTIAL** | Identity band-only: Chrome.tsx:512, 540. No visibility filter: Chrome.tsx:463, 535-536 vs Search Chrome.tsx:253 | Client visibility guard; server audience rule plus privacySafePreview payload (22-COMPONENT-ARCHITECTURE.md:143-149) | A future fixture or payload could show an only-me Moment's date, place or thumbnail | Backend audience enforcement | NO | P1 |
| CN-17 | Notifications | Localisation of notification chrome | **PARTIAL** | store.tsx:316-324; Chrome.tsx:501, 554; event text data.ts:749-756 | Localised day header and date; templated event grammar | Half-translated rows in every non-English locale | Event grammar from the live contract | NO | P2 |
| CN-18 | Chat | Messages utility, panel and unread dot | **COMPLETE** | Messages.tsx:31-106; WorldProvider.tsx:143 | Real unread source | Low | Chat API | NO | n/a |
| CN-19 | Chat | Person identity (real photo + Life Ring, band-only) | **COMPLETE** | Messages.tsx:88, 195; ChatSurface.tsx:84, 115; PersonIdentity.tsx:61-66 | none | none | none | NO | n/a |
| CN-20 | Chat | Desktop mini dock vs phone full /chat | **PARTIAL** | Messages.tsx:64-65, 166-211; ChatSurface.tsx:63, 105-113; five matchMedia sites | Resize reactivity; measured bar height; reachable desktop Back; bell and account on /chat | Dock state and presentation disagree; desktop /chat has no way back to My World | none | NO | P2 |
| CN-21 | Chat | State continuity /world to /chat | **DISCONNECTED** | SocialPreview.tsx:397-401; ChatSurface.tsx:29-37 | Shared store (prototype) / server state (live) | Phone users lose accepted requests, sent messages, read state and a just-written Response | Live backend persistence | NO | P2 |
| CN-22 | Chat | Shared SYSTEMBOOM session (no second login) | **MISSING** | people-chat-integration.md:54-60; src/app/chat/page.tsx:10-15; my-world-product-completeness.md:27, 48-51 | SSO / trusted session handoff to the live Chat | A second login breaks the one-product model | Live auth infrastructure | NO | P1 |
| CN-23 | Chat | Messaging permission (connected people only) | **BROKEN** | ChatSurface.tsx:51; WorldProvider.tsx:72-79 vs model.ts:20-22 | Client guard (prototype); server enforcement (live) | Messaging strangers or yourself via URL; a removed friend stays messageable | Backend permission; post-unfriend owner decision | YES · D-18 (safe part: C4) | P1 |
| CN-24 | Chat | Failed send keeps text | **MISSING** | model.ts:58-59 unused; Messages.tsx:119-124 | Failure state and retry | Lost words; contradicts people-chat-integration.md:76-77 | none (prototype); socket contract (live) | NO | P2 |
| CN-25 | Chat | Message time and date model | **PARTIAL** | model.ts:56-57; WorldProvider.tsx:41-45 | A dated timestamp; day separation | Threads spanning days read as one day | Chat API timestamp | NO | P2 |
| CN-26 | Chat | Chat localisation | **PARTIAL** | Messages.tsx:128-129, 152-157, 187, 198-204; ChatSurface.tsx:66-68, 88, 92, 103, 107, 122-123; en.ts:290-291 | Catalog routing | English-only Chat in 7 locales | none | NO | P2 |
| CN-27 | Chat | Celestial Quick Resonance and Seal | **PARTIAL** | ChatQuickResonance.tsx:28, 31, 53, 85-101; chat-resonance.ts:26-36; WorldProvider.tsx:80-95; flags.tsx:34 | Session actor id (not 'me'); per-person attribution on Seals; chat-message subject notifications | Live port keys Resonances wrongly; counterpart's Seal is indistinguishable from yours | Celestial flag rollout; live chat identity | NO | P2 |
| CN-28 | Chat | Multi-person chat | **MISSING** | model.ts:70-74 | Group conversation model | Unknown parity with the live Chat | Live Chat capability (unknown) | YES · D-25 | P3 |
| CN-29 | Chat to Moment | Moment deep link or share from Chat | **MISSING** | model.ts:51-68; README-for-developer.md:495 (copy-link placeholder) | Moment reference on ChatMessage; Moment route with audience check | Chat is severed from MEMORY, the central object | Owner decision; Moment permalink | YES · D-25 | P2 |
| CN-30 | Chat to Person | Open the person from a chat header | **DISCONNECTED** | Messages.tsx:194-197; ChatSurface.tsx:29-37, 114-117 | Doorway plus PersonCard mount in /chat | Chat is a dead end for relationship actions | none | NO | P2 |
| CN-31 | Respond to Chat | Message a response author | **PARTIAL** | Moment.tsx:637-640 then PersonCard.tsx:72-76, 131-135; also Moment.tsx:187, 250-260 | Moment context carried into the thread; Human Pulse who-lists as doorways (expressions.tsx:1162-1166; ResonateControl.tsx:359-363) | On a phone the Message tap resets the store and loses the just-written Response | Owner decision on Moment context in Chat and the Boom who-list doorway | YES · D-25 | P2 |
| CN-32 | Harness | Visitor-mode chrome (bell, Messages, People) | **PARTIAL** | store.tsx:90-101; WorldProvider.tsx:117-122; Chrome.tsx:89, 130-133; ProfileHero.tsx:112-113 | Viewer-aware notifications and conversations in visitor modes | Visitor evidence shows the owner's private threads and notifications in a visitor's chrome (prototype only) | none | NO | P3 |
| CN-33 | Chat | Offline / reconnect / delivery states | **OWNER DECISION** | my-world-product-completeness.md:28; people-chat-integration.md:79-81 | Backend socket contract | Undefined behaviour on flaky networks | Live websocket infrastructure | YES · D-31 | P2 |
| **CO** | **COMPOSER · PEOPLE PRESENT · VISIBILITY** | | | | | | | | |
| CO-01 | Composer | Text entry (2,000 limit, counter, labelled textarea, ⌘/Ctrl+Enter) | **COMPLETE** | Composer.tsx:64, 334-349, 421 | Counter counts UTF-16 units (emoji count as 2) | Low | none | NO | P3 |
| CO-02 | Composer | Photos (library pick, reorder, remove, 10 limit) | **PARTIAL** | Composer.tsx:484-520; data.ts:303-323 | Real upload pipeline returning width/height (+takenAt/takenPlace) | Prototype only | Live upload API (social-api-contract.md:130-141) | NO | P1 |
| CO-03 | Composer | Video | **PARTIAL** | Composer.tsx:470-474, 210, 521-534 | Real upload; poster and duration are fixed constants | Prototype stand-in | Live media pipeline | YES · D-20 | P2 |
| CO-04 | Composer | Link preview | **PARTIAL** | Composer.tsx:153, 212, 262-272 | Real preview endpoint; hardcoded English title/description | Fabricated preview content | Live link-preview endpoint | NO | P2 |
| CO-05 | Composer | Mixed media on one Moment | **BROKEN** | Composer.tsx:209-215 vs 502-551; data.ts:35-38 | Exclusivity or multi-media support | Attached media silently discarded | Owner decision on multi-media | YES · D-20 (safe part: A10) | P1 |
| CO-06 | Composer | Place | **PARTIAL** | Composer.tsx:390-395; data.ts:334-349; social-api-contract.md:95 | Place entity / Earth coordinate link | PLACE layer is text only | Earth/Place model | NO | P3 |
| CO-07 | Composer | Date, backdating, day/minute precision on create | **COMPLETE** | Composer.tsx:172, 218, 228-229; Moment.tsx:215; social-api-contract.md:119-121 | Explicit event time for past Moments (documented future) | Low | none | NO | P3 |
| CO-08 | Composer | Photo detection Confirm/Change | **PARTIAL** | Composer.tsx:164-168, 357-372 | Trusted capture time dropped (date only) | Loses available precision | Owner decision on capture-time precision | YES · D-22 | P2 |
| CO-09 | Composer | Before-birth date handling | **BROKEN** | Composer.tsx:169-172, 381; life-time.ts:20-33; CircleView.tsx:130; circle-of-life-spec.md:141 | min bound + honest refusal | Negative age posted into a Life record | none | NO — enforces the existing Life rule (D-17 covers only future ancestral records) | P1 |
| CO-10 | Composer | Edit an own Moment | **BROKEN** | Composer.tsx:118-134, 220, 596-598, 180-183 | Preserve time/precision/sharedAt/media; confirm on close | Invented 12:00 clock; lost link title; silent loss of edits | none | NO | P0 (auditor: P1) |
| CO-11 | Composer | Kind fields scoped to the posted kind | **BROKEN** | Composer.tsx:188-197, 233; Moment.tsx:121, 247; social-api-contract.md:100 | Filter fields to KIND_FIELDS[kind] on post/edit | 'with N' leaks onto Activity/Health Moments | none | NO | P1 |
| CO-12 | Composer | People present — entry | **PARTIAL** | Composer.tsx:80, 101, 659-682 | Kind-independent field; person picker with chips; relationship filter | Plain Moments cannot say who was there | Owner decision on scope/consent | YES · D-11 | P1 |
| CO-13 | Composer | People present — name resolution | **BROKEN** | Composer.tsx:671-675; store.tsx:271; Moment.tsx:59, 121, 260 | Never store raw strings as ids; no fallback to a real person | A Moment names the wrong real person ('M') | none | NO | P1 |
| CO-14 | Moment | People present — rendering | **PARTIAL** | Moment.tsx:89-90, 247-272, 254; prototype-evidence/social-2030-final/41-meeting.png | Meeting rendered twice; English popover label | Duplicate/unlocalised copy | none | NO | P2 |
| CO-15 | Moment / live | People present — consent, notify, self-removal, visibility | **MISSING** | data.ts:755 (fixture only); Moment.tsx:247-272 | Consent state, inclusion notification, untag, visibility rule | Third parties exposed on public Moments without consent | Owner decision; live notifications | YES · D-11 | P1 |
| CO-16 | Composer | Visibility picker Public/Friends/Only me + Health/Problem default | **COMPLETE** | Composer.tsx:115, 185-199, 308-323; en.ts:108-110, 181-184 | — | Low (prototype UI) | Server enforcement | NO | n/a |
| CO-17 | Live integration | Server enforcement of Only me and Friends | **MISSING** | store.tsx:117; Chrome.tsx:253; composer-states.md:67; social-api-contract.md:115-117; view-model.ts:138-139 | Server-side audience filtering; friends audience definition | Health/Problem published if the live system has Public only | Backend privacy + owner decision on friends audience | YES · D-2 | P1 (auditor: P0) |
| CO-18 | Profile / feed | View as public reflects the chosen visibility [see XC-04] | **BROKEN** | SocialPreview.tsx:406, 516, 737-746; store.tsx:117; s2-person-world/33-view-as-public.png | Feed rendered through the public stand-in | Owner sees only-me Moments + exact ages under 'Viewing as public' | none | NO | P0 (auditor: P1) |
| CO-19 | Moment | Change privacy after posting | **COMPLETE** | Moment.tsx:320-332; store.tsx:147-148 | — | Low | Server enforcement | NO | n/a |
| CO-20 | Composer | Drafts (keep/restore/discard) | **PARTIAL** | Composer.tsx:565-571; store.tsx:4-5, 217-218; SocialPreview.tsx:499, 732 | Persistence beyond memory; failure path not stored | Draft lost on reload | Owner decision on draft persistence | YES · D-22 | P2 |
| CO-21 | Composer | Validation | **PARTIAL** | Composer.tsx:175-178, 399-400, 554-555 | Live-region announcement; pre-birth rule; structured-kind rule | Silent errors for screen readers | Owner decision on prose requirement | YES · D-22 | P2 |
| CO-22 | Composer | Posting / failure / retry | **BROKEN** | Composer.tsx:201-246, 556-561; composer-states.md:82-84 | Discard inside the 900 ms posting window still publishes the Moment (default Public) — ✔ runtime-verified 4.3 V4 · Controls disabled while posting; timer cleared on discard | Discarded Moment still posts; edits during posting lost | none | NO | P0 (auditor: P2) |
| CO-23 | Composer | Mobile sheet / desktop modal | **COMPLETE** | SocialPreview.tsx:73, 77; Composer.tsx:564, 579; AGENTS.md S7 rows | — | Low | none | NO | n/a |
| CO-24 | Composer | Keyboard model | **PARTIAL** | Composer.tsx:161, 344, 426-447; composer-states.md:91 | Arrow-key roving in kind group | Spec gap | none | NO | P2 |
| CO-25 | Data model | Present vs Responded vs Expressed vs Resonated are separate | **COMPLETE** | data.ts:43, 55-64, 88, 93, 99; store.tsx:164-189 | Legacy tap responders still in the model, unsurfaced (data.ts:85-87) | Two 'responded' lists disagree | none | NO | P2 |
| CO-26 | Docs | API contract for people present (`with`) | **CONFLICT** | social-api-contract.md:147, 152 vs data.ts:43; Moment.tsx:247-272 | One PersonRef-id shape | Live port builds a count, not people | Doc fix | NO | P1 |
| CO-27 | Docs | API contract Respond shape | **CONFLICT** | social-api-contract.md:103 vs moment-conversation-model.md:113-114; Moment.tsx:293-302 | Remove respond {count, byViewer} | Like-counter ported by mistake | Doc fix | NO | P2 |
| CO-28 | Composer | Structured kind postable without prose | **OWNER DECISION** | Composer.tsx:178; social-interaction-spec.md:47; SOCIAL_BIBLE_AUDIT.md:458-459 | Decision | Health reading needs filler text | Owner | YES · D-22 | P2 |
| **PL** | **PLACE · LIFE · COSMOS SEAMS** | | | | | | | | |
| PL-01 | Moment readout (place) | Click a Moment's Place [Place tap] | **MISSING** | src/components/style-lab/social/Moment.tsx:199-204,221-226; data.ts:78; docs/handover/social-api-contract.md:95 | The place is inert text with no id or coordinates. There is no Place surface and no path to Moments here, people here or Earth. | The PLACE layer of SPACE→PLACE→PERSON has no behaviour, so the Moment cannot connect to Earth or to other lives at the same place. | Owner decision on Place identity; Places API (docs/earth-explorer.md:9); a search/place API | YES · D-16 | P1 |
| PL-02 | Search · Places group | Find a place, see its tally, narrow to it | **PARTIAL** | src/components/style-lab/social/Chrome.tsx:253-260,417-434; data.ts:334-349,534,606,618; store.tsx:117 | Places come from a static list, so 'Bhaktapur' and 'Kathmandu Durbar Square' are unfindable. The tally is an exact string match, Devanagari and Latin forms are counted as different places, and friends-privacy Moments from non-connected people are counted. 'Narrow' re-runs the search; there is no place view. | Tallies disagree with the Moments shown, and the privacy scope of the tally is set by the prototype. | Place normalisation; a friends-privacy backend contract | YES · D-16 (safe part: C12) | P2 |
| PL-03 | My World → Earth | A Moment's place opens on Earth | **DISCONNECTED** | src/components/shell/destinations.ts:57 (EARTH_INTENT, no consumer); src/components/cosmos/CosmosExperience.tsx:179-195; docs/handover/social-shell-spec.md:119-121 | No link from any Social surface. Earth accepts only `to=earth`, with no coordinate. | Earth stays a separate world from the person's Moments. | Owner-authorised change to the frozen Cosmos code to accept coordinates; structured place | YES · D-16 | P2 |
| PL-04 | Moment foot / ⋯ menu | View in Life (Moment → Circle day) [View in Life] | **DISCONNECTED** | src/components/style-lab/social/Moment.tsx:307-310,344,351; src/components/style-lab/circle/model.ts:186-189; CirclePreview.tsx:94; docs/handover/circle-of-life-spec.md:128-134 | Disabled for everyone. For the owner's own Moments the target `/life?c=day:<date>` already works, and only the link is missing. | The Moment ↔ Life two-way link that defines the product exists in one direction only. | None for own Moments. Pre-birth refusal must land first. | YES · D-15 | P1 |
| PL-05 | /life route | Address another person's Life (visitor View in Life) | **OWNER DECISION** | src/components/style-lab/circle/CirclePreview.tsx:87-91; store.tsx:104-110; circle-of-life-spec.md:133 | /life is subject-less and always the signed-in person's own. | 'Visitors resolve to LIFE' has no target; a shared /life link opens the reader's own Circle. | Owner decision on what View in Life means for another person's Moment | YES · D-15 | P2 |
| PL-06 | Life · DayAlmanac | Circle day → the day's Moments | **COMPLETE** | src/components/style-lab/circle/DayAlmanac.tsx:18-71; model.ts:118-121,325-331; CircleView.tsx:249-255 | Nothing for listing (owner, own Moments, filters, record-at-date). | Low. | — | NO | n/a |
| PL-07 | Moment permalink | Open or share one Moment by URL (from Life, notifications, Copy link) [see MC-24] | **MISSING** | src/components/style-lab/social/Moment.tsx:350; src/components/world/focus-moment.ts:11-27 | Copy link targets `systemboom.example/m/<id>`, which has no route. focusMoment works only inside /world. | Circle day → Moment cannot hand off to the stream, and Copy link copies a dead URL. | A Moment route or query decision (e.g. /world?m=<id>) plus a `reveal` fetch (social-api-contract.md:202-203) | YES · D-12 | P1 (auditor: P2) |
| PL-08 | Circle URL `?c=` | Pre-birth / Ancestor boundary on deep links | **BROKEN** | src/components/style-lab/circle/model.ts:146-150,176-184,232,244-263,329-330; src/lib/life-time.ts:20-33; docs/design/circle-of-life.md:236-244 | There is no birth or future bound. A pre-birth day renders with age −9, band −1 (undefined label), 'lived' days and a negative exact age. | Breaks the 'personal life begins at birth' rule. It becomes user-reachable as soon as View in Life is wired. | — | NO — enforces the existing Life rule (D-17 covers only future ancestral records) | P2 |
| PL-09 | Composer date | Pre-birth rule for recorded Moments | **BROKEN** | src/components/style-lab/social/Composer.tsx:169-170,381; src/lib/identity/birth.ts:43-51; DateField.tsx:14; life-time.ts:79-81; view-model.ts:80-85 | No minimum date. A pre-birth Moment posts and shows a negative exact age (owner) or an undefined band (others). | A broken life readout, and the Ancestor boundary is violated at creation. | Owner decision on what a pre-birth Moment is | NO — enforces the existing Life rule (D-17 covers only future ancestral records) | P1 |
| PL-10 | Life (visitor) | Visitor privacy on Life deep links | **COMPLETE** | src/components/style-lab/circle/CircleView.tsx:52-58; CirclePreview.tsx:90-91,208; model.ts:200-226; circle-of-life-spec.md:67-68 | Prototype only. The server-side refusal and route guarding are a live obligation that has not been built. | Enforcement lives only on the client. | Live backend (SOCIAL_BIBLE_ROUTE_MAP.md:148) | NO | P1 |
| PL-11 | Moment readout · Life Cursor · visitor rings | No birth-derived calendar precision for visitors [see ID-01] | **CONFLICT** | src/components/style-lab/social/view-model.ts:110-113,164-171; Moment.tsx:112,194-198; LifeCursor.tsx:76-77; PersonIdentity.tsx:36,63; LifeRing.tsx:129-134; social-api-contract.md:106; circle-of-life.md:97-101; circle-of-life-spec.md:59-62,151; data.ts:138,602-606,667-676 | Each band is computed at the Moment's own date, and visitor rings carry public band density. Together with Moment dates, these narrow a birth date (Sunita's 45th birthday is bounded between 2022-10-17 and 2026-04-13). | A hard-rule privacy leak baked into the data contract (`lifeAtMoment`). | Owner decision; then update the contract | YES · D-1 | P0 |
| PL-12 | Global Brand | Mark → Cosmos; context word | **COMPLETE** | src/components/shell/Brand.tsx:18,29,50-68; WorldShell.tsx:20; Chrome.tsx:127 | The 'Chat' context word is not localized. | Low. | — | NO | P3 |
| PL-13 | Cosmos root / gate | Cosmos → My World / Life entry | **COMPLETE** | src/components/shell/CosmosRoot.tsx:61-79; IdentityGate.tsx:314-347; SocialPreview.tsx:420-429,675 | Gate copy is English-only. | Low. | — | NO | P2 |
| PL-14 | PersonalDestination / intent | A deep link survives identity | **PARTIAL** | src/components/shell/intent.ts:12-18; PersonalDestination.tsx:26-27; IdentityGate.tsx:319; architecture.md:104-108 | The query (`?c=` coordinate or conversation) is dropped, and a chat intent falls back to /world. | A shared Life or Chat link loses its target for a signed-out person. | — | NO | P2 |
| PL-15 | /life frame | Return to My World from Life | **PARTIAL** | src/components/shell/WorldShell.tsx:18-27; CirclePreview.tsx:166; evidence 42-route-life-dark.png | No local return. Only browser Back works, or the mark → Cosmos → Enter my world. | A deep-linked /life leaves the person two hops from My World. | Owner decision | YES · D-32 | P2 |
| PL-16 | Cosmos ↔ My World history | Back restores Cosmos/Earth state | **PARTIAL** | src/components/cosmos/CosmosExperience.tsx:180-195 | Earth/focus state is not kept in history. | Coming back from My World resets exploration. | Frozen-zone authorisation | YES · D-33 | P3 |
| PL-17 | My World → Life transition | Inward scale continuity (ring → Circle) | **PARTIAL** | src/components/style-lab/circle/CirclePreview.tsx:43,48,93,172-211; ProfileHero.tsx:185; CircleModule.tsx:91; SocialPreview.tsx:57,641; social-shell-spec.md:135 | The `?entry=ring` seam is dev-only, product links do a plain route change, and the grounds differ (atmosphere or sky vs flat). | Life feels like a different page, not a deeper resolution. | — | NO | P2 |
| PL-18 | Life surfaces (i18n) | Language continuity Cosmos → My World → Life | **PARTIAL** | src/components/style-lab/circle/CircleView.tsx:129-130,145,175,210,218-237; DayAlmanac.tsx:16,35,47,50; PersonalDestination.tsx:34; IdentityGate.tsx:325-327,344; WorldShell.tsx:22-26; docs/i18n/translation-status.md:54-57 | Circle and gate chrome are English in every locale, and /life has no language control. | A non-English user drops into English inside Life. | — | NO | P2 |
| PL-19 | Theme | One theme across Cosmos / My World / Life | **COMPLETE** | WorldShell.tsx:23-25; docs/design/systemboom-navigation-final.md:72-78; docs/open-issues.md:3-24 | The light-mode Cosmos scene is dark (open owner item). | A luminance jump in light mode. | Owner decision (open-issues options a/b/c) | YES · D-21 | P3 |
| PL-20 | Visitor Circle copy | No style-lab paths or 'Social' label in product | **DISCONNECTED** | src/components/style-lab/circle/CircleView.tsx:235-243; docs/design/systemboom-navigation-final.md:55,103-104 | Links to `/style-lab/social?viewer=visitor` and labels it 'Social'. | Latent today; it becomes live the moment a visitor Life route exists. | — | NO | P2 |
| PL-21 | Destination model | Ancestors as a `later` destination | **CONFLICT** | docs/design/systemboom-application-architecture.md:36,139-141; src/components/shell/destinations.ts:12-14,25-45; AGENTS.md rule 'add it to destinations.ts as `later`' | There is no `later` field and no ancestors entry. | The documented rule cannot be followed. | — | NO | P3 |
| PL-22 | /world hierarchy | WHO AM I | **COMPLETE** | src/components/style-lab/social/ProfileHero.tsx:165-285 | — | — | — | NO | n/a |
| PL-23 | /world hierarchy | WHAT IS HAPPENING (stream scope) [see MC-31] | **PARTIAL** | src/components/style-lab/social/store.tsx:113-119,283; SocialPreview.tsx:737-747; world/model.ts:34-36,43-46; data.ts:479-486,531-537 | The stream includes every author, including non-connected people and friends-privacy content from non-connected authors. No contract defines the home stream's selection. | A live port could copy the prototype's privacy scope. | Owner decision on stream scope; friends-privacy backend contract | YES · D-4 | P1 |
| PL-24 | /world hierarchy | WHO ARE MY PEOPLE / another person's World [see PF-04] | **PARTIAL** | src/components/style-lab/social/Chrome.tsx:130; world/PersonCard.tsx:92-102; SocialPreview.tsx:461-471; social-feature-parity.md:121; social-api-contract.md:204 | People are reachable only through a utility. There is no visitor World route, and the harness visitor feed is not filtered to one author (conflicts with the contract). | Class-A 'visitor profile' has no product surface. | Owner decision on route shape | YES · D-18 | P1 |
| PL-25 | /world hierarchy | WHAT MOMENTS MATTER | **OWNER DECISION** | src/components/style-lab/social/store.tsx:112-119; docs/phase-5-candidates.md:47 | Pure chronology, with no significance mechanism. | Important life Moments get buried by recency. | Owner decision | YES · D-34 | P3 |
| PL-26 | /world hierarchy | WHERE | **PARTIAL** | ProfileHero.tsx:205; Moment.tsx:199-204,221-226; LifeCursor.tsx:88; circle/model.ts:331 | Text only. The Circle day header substitutes home for the day's place. | Place is asserted but never explorable, and can be wrong on a day spent away from home. | Place identity decision | YES · D-16 | P1 |
| PL-27 | /world hierarchy | WHERE IN MY LIFE | **COMPLETE** | ProfileHero.tsx:185-187,259-267; SocialPreview.tsx:693-705,717,729-732; CircleModule.tsx:44-94 | — | — | — | NO | n/a |
| PL-28 | /world hierarchy | WHAT CONVERSATIONS | **PARTIAL** | src/components/style-lab/social/Chrome.tsx:131-133; SocialPreview.tsx:659-662,674 | Reachable only through the Messages utility and per-Moment presence; nothing in the page body. | Low. This is by design (utility layer). | — | NO | P3 |
| PL-29 | Moment foot | Disabled View in Life visibility [doc aspect of PL-04] | **CONFLICT** | src/components/style-lab/social/Moment.tsx:307-310; social-shell-spec.md:49; social-2030-future-seams.md:64-68; social-api-contract.md:107; README-for-developer.md:64-66; DayAlmanac.tsx:60 | No single rule. The disabled pill also shows inside Life itself. | The product's only visible dead control. | Owner decision | YES · D-15 | P3 |
| PL-30 | Cross-route state (prototype) | One Moment source for My World and Life | **DISCONNECTED** | src/components/style-lab/social/SocialPreview.tsx:395-401; CirclePreview.tsx:66-72,114,213-217; store.tsx:262; README-for-developer.md:129-130 | Two in-memory stores, so a Moment recorded in Life is lost in My World. | Prototype-only, but it hides integration behaviour of the two-way link. | Live Moment API | NO | P2 |
| **XC** | **CROSS-CUTTING (privacy · safety · i18n · a11y · mobile · perf · themes · terms · states)** | | | | | | | | |
| XC-01 | Privacy · Life data | Non-owner receives band only (no birth/exact/days/fraction/band years) | **COMPLETE** | view-model.ts:69-113, :176; SocialPreview.tsx:580-588 probe; SOCIAL_BIBLE_PRIVACY_MATRIX.md §3 | Server-side equivalent (visitor payload built server-side) | The live port could subtract fields from the owner shape instead of building the visitor shape | Backend personRef / social-api-contract.md §C | NO | n/a |
| XC-02 | Privacy · Moment scopes | privacy:'friends' gated by relationship in feed + search [friends audience (canonical)] | **PARTIAL** | store.tsx:113-119; Chrome.tsx:251-253; view-model.ts:164-171; data.ts:26 | Any relationship check. Friends Moments render to strangers (6 fixtures measured, SOCIAL_BIBLE_PRIVACY_MATRIX.md:236-256) | A person who picks 'Friends' is exposed publicly | Backend friends-privacy contract | YES · D-2 | P0 |
| XC-03 | Privacy · Visitor feed | Visitor sees only the subject's Moments [see MC-31] | **CONFLICT** | SocialPreview.tsx:738; store.tsx:274, :283 vs social-api-contract.md:204 | Feed scoped to one author for visitors | The live team implements the wrong feed shape | Owner decision on World feed composition | YES · D-4 | P1 |
| XC-04 | Privacy · View as public | Owner previews their World exactly as the public sees it [View as public (canonical)] | **BROKEN** | SocialPreview.tsx:516-519, :704 vs :717, :743; Moment.tsx:103, :112, :194-195; LifeCursor.tsx:76-77; person-life-identity.js:320-343 | Feed and Life Cursor through PUBLIC_VIEWER; only-me exclusion while previewing | The preview shows the owner's exact age and only-me Health/Problem Moments as if public (misleads the owner; nothing leaks to others) | Visitor-feed decision, for author filtering only | NO | P0 (auditor: P1) |
| XC-05 | Privacy · Visitor modes | Chrome data (notifications, conversations, relationships) is relative to the acting viewer | **PARTIAL** | store.tsx:94; Chrome.tsx:89, :459; Messages.tsx:81; WorldProvider.tsx:118-127; model.ts:29-47; ProfileHero.tsx:117 | Viewer-relative relationship map and inbox | The harness misrepresents what a visitor sees; prakashVisitor gets an inverted Accept | Live per-viewer payloads | NO | P2 |
| XC-06 | Privacy · Health/Problem | No conversation on quiet kinds | **CONFLICT** | Moment.tsx:371-395 vs moment-conversation-model.md:103; C-15 | A quiet gate on responses, preview and Notes, or a doc correction | A private health record accepts conversation | Owner decision | YES · D-8 | P1 |
| XC-07 | Safety · Person | Block / mute / report person; report chat message | **MISSING** | No code in src/ (grep); PersonCard.tsx:110-141; my-world-product-completeness.md:34, :50 | UI + data contract | No person-level safety at launch (documented LAUNCH SAFETY P1) | Safety API / live account tools | YES · D-10 | P1 |
| XC-08 | Safety · Moment/Response | Report Moment, Report Response | **PARTIAL** | Moment.tsx:348, :686; en.ts:96; social-api-contract.md:105, :158 | Reason, payload, persistence, API shape; the toast claims a review happens | False reassurance; nothing reaches a moderator | Safety API | YES · D-10 | P1 |
| XC-09 | Safety · Hide | Hide another person's Moment | **PARTIAL** | Moment.tsx:349; store.tsx:116, :190-191 | Persistence, undo, announcement, focus handling | The hidden Moment returns on reload; focus is lost | Per-viewer hide API | YES · D-27 | P2 |
| XC-10 | Safety · Owner controls | Delete own Moment/response; moderate responses on own Moment; remove friend | **PARTIAL** | Moment.tsx:333-343 (confirm), :680-687, :683; store.tsx:145-146, :196-197; PersonCard.tsx:136 | Confirm on response delete (which cascades replies); author moderation; confirm on remove friend | Accidental destructive actions; no owner recourse against abusive responses | Owner decision | YES · D-9 | P2 |
| XC-11 | I18N · Catalogs | 8 locales key-complete | **COMPLETE** | catalogs/*.ts: 363 keys each, 0 missing/0 extra; translation-status.md:17-24 says 319 | Doc update + Celestial native-review flags; 14 orphan keys | Stale QA doc misleads the reviewer | none | NO | P3 |
| XC-12 | I18N · Social/World/Identity | All system strings through t()/tp() | **PARTIAL** | Moment.tsx:195, :197, :254, :281, :644, :648, :675; SocialPreview.tsx:693, :716; Chrome.tsx:304; CircleModule.tsx:87; LifeRing.tsx:185; LifeCursor.tsx:77; ProfileHero.tsx:121; Media.tsx:71; PersonIdentity.tsx:65; IdentityGate.tsx / CreateIdentityForm.tsx (entire) | Keys for the listed strings | English leaks into 7 locales, including screen-reader labels | none | NO | P2 |
| XC-13 | I18N · Chat | Messages / MiniChat / full Chat localized | **PARTIAL** | Messages.tsx:128-204; ChatSurface.tsx:66-123; destinations.ts:44 | chat.* keys for body, dock and /chat | The whole Chat surface is English in every locale | none | NO | P2 |
| XC-14 | I18N · Notifications | Localized day headers and coordinates | **PARTIAL** | store.tsx:307-324; Chrome.tsx:501, :554 | Locale-aware dayLabel / sbDate | 'Today'/'Yesterday'/'SEP' in every locale | none | NO | P2 |
| XC-15 | A11y · Dialogs | Focus trap, Escape, focus return on modal surfaces | **PARTIAL** | Composer.tsx:161 (complete); PersonCard.tsx:48-60, :82 (no trap); Moment.tsx:396, :536-563 (no trap, no return) | Trap for PersonCard and MomentConversation; return focus from MomentConversation | Keyboard and screen-reader users lose their place | none (useFocusTrap exists) | NO | P1 |
| XC-16 | A11y · Menus | role=menu keyboard + focus return | **BROKEN** | Moment.tsx:416-460; Chrome.tsx:150-204 | Arrow roving, focus return, valid menu children | Focus drops to body after every menu | none | NO | P2 |
| XC-17 | A11y · Boom + Celestial pickers | Radiogroup keyboard, Escape, return, live status | **COMPLETE** | expressions.tsx:628-660, :715-725, :920; CelestialField.tsx:200-215, :392-397, :536; ResonateControl.tsx:300-312 | Boom has no Up/Down/Home/End; Celestial removal is re-selecting the checked radio; constellation Escape works only with focus inside | Minor keyboard friction | none | NO | P3 |
| XC-18 | A11y · Announcements | Live regions for outcomes and failures | **PARTIAL** | Present: Moment.tsx:364, :692; expressions.tsx:920; CelestialField.tsx:536. Absent: Composer.tsx:556-561; Moment.tsx:759-764; Chrome.tsx:529; PersonCard.tsx:110 | status/alert on failures and relationship outcomes | Silent failures for screen-reader users | none | NO | P2 |
| XC-19 | Mobile · S7 | 320-430 one-row bar, 44px primary actions, keyboard-short heights, reduced motion | **COMPLETE** | s7-device-mastery.js:35-220; s7-device-responsive-contracts.md:24-56; celestial-s7-constellation.js:260-357 | Physical-device verification; srcset; ChatSurface.tsx:63 hard-coded 57px; secondary targets 28-36px (Moment.tsx:312, :670, :675; ResonateControl.tsx:320, :378) | Simulated safe areas and keyboard only | Live build / device QA | NO | P2 |
| XC-20 | Performance · Images | Right-sized, lazy media | **PARTIAL** | Media.tsx:26, :101 (lazy); LifeRing.tsx:230 (eager); demo-user.ts:16 (1920×2879, 836KB); public/mock/social 19MB, max 1.28MB | srcset/sizes, avatar thumbnails | Heavy decode on phones; the owner avatar appears in most identity instances | Live CDN / image pipeline | NO | P2 |
| XC-21 | Performance · Timers/scroll | No persistent or invisible work | **PARTIAL** | LifeCounter.tsx:69-73 inside a CSS-hidden section (SocialPreview.tsx:695-698); LifeCursor.tsx:41-66; Chrome.tsx:98-110 | Pause the hidden counter; IntersectionObserver for the cursor | 1s re-render loop on phones; O(n) layout reads per scroll frame | none | NO | P2 |
| XC-22 | Performance · Celestial environment | Cheap sticky sky, bounded :has() | **PARTIAL** | CelestialEnvironment.tsx:53-68 (sticky 100lvh, will-change), :82-83, :109-111 (:has on hover attributes), :159, :165 (backdrop-filter); 29 :has() in social/celestial | Measured :has recalculation cost; drop or justify the backdrop-filter | Style recalculation on every Resonate hover; blur over scrolling content | Celestial flag rollout | NO | P2 |
| XC-23 | Performance · Boom/Celestial assets | Idle prefetch without competing with the first photo | **COMPLETE** | expressions.tsx:219-225; SocialPreview.tsx:459; ResonanceMark.tsx:88 (lazy); registry.ts:137 (per-theme sets; event tier up to 142KB) | Celestial has no prefetch (deliberate); a theme switch downloads a second asset set | Low | none | NO | n/a |
| XC-24 | States · Video | Video playback [see MC-11] | **DISCONNECTED** | Media.tsx:78-92 | <video> element / player; the play button has no handler | The control looks functional but does nothing | Live media pipeline | YES · D-20 (safe part: A23) | P1 (auditor: P2) |
| XC-25 | Themes · Dark | Deep Cosmos default, stored preference | **COMPLETE** | layout.tsx:31; use-theme.ts:18, :23; SocialPreview.tsx:54-63; CelestialEnvironment.tsx:41-113 | — | — | none | NO | n/a |
| XC-26 | Themes · Light | Clean premium light, no forced scenery | **CONFLICT** | CelestialEnvironment.tsx:115-176 (uncommitted; environment-solar.svg + frame ribs forced); SocialPreview.tsx:168, :207, :216, :226, :311 (warm paper); en.ts:147; ThemeToggle.tsx:15, :25; evidence phase-4.3-social-audit/02-light-desktop-owner-top.png | Scenery opt-in/removal; one light material language | Light violates the current owner direction whenever Celestial is on | Owner decision | YES · D-21 | P1 |
| XC-27 | Terminology · Feeling systems | Boom vs Celestial clearly distinct at a glance | **CONFLICT** | en.ts:296-330 vs :375-382 (all 8 meaning words shared, resolved by owner decision §1.3); Moment.tsx:371-373; ResonateControl.tsx:286-294; human-pulse-contract.md:69 | One rule for per-type counts; no duplicate '{n} people' on one line | Reads as two competing popularity counters | Owner decision | YES · D-6 | P2 |
| XC-28 | Terminology · Conversation | Respond / Response / Reply only | **PARTIAL** | en.ts:72, :74, :332, :336 (current); en.ts:73, :75 orphans; data.ts:749, :752 'note'; social-api-contract.md:103, :158 respond count | Doc and fixture cleanup | The live API ships a like counter; 'note' stays visible | none (API doc correction per C-2) | NO | P2 |
| XC-29 | Terminology · Labels | Consistent People/Friends, Chat/Messages, Life/band, Moment casing | **PARTIAL** | en.ts:57 vs :288; en.ts:154-158 + chat/page.tsx:6 + destinations.ts:44; en.ts:27, :28, :32 + LifeCursor.tsx:77 + LifeRing.tsx:185; en.ts:38 vs :138 | One casing and one noun per concept | Low; polish | none | NO | P3 |
| XC-30 | States · Empty | Honest empty states | **PARTIAL** | Complete: Moment.tsx:382, :482; Chrome.tsx:341-346, :494; People.tsx:221, :251; Messages.tsx:77-78. Missing: no-Moments (SocialPreview.tsx:737-758; en.ts:81) | A no-Moments state for owner and visitor; a harness toggle for it | A new person sees only 'That's everything shared here so far' | none | NO | P2 |
| XC-31 | States · Errors | Failure states for every write | **PARTIAL** | Harness-only: Composer.tsx:205-207, :556-561; Moment.tsx:712-714, :759-764 (store.tsx:45, :215-216; SocialPreview.tsx:488, :602). Real: Media.tsx:15-27. Missing: ResonateControl.tsx:60-66; WorldProvider.tsx:47-57; ChatSurface.tsx:47-53; focus-moment.ts:14-15. Disconnected: model.ts:57-59; en.ts:170 | Resonance, Expression, friend-action, chat-send, chat-open and notification-target failures | Silent failure once a real network is attached | Live API error contract | NO | P2 |
| XC-32 | States · Copy link | Truthful confirmation | **BROKEN** | Moment.tsx:350 | Toast only after writeText resolves; a real permalink contract | False success; the copied link targets a fake domain | Live permalink / access control | NO | P3 |
| XC-33 | States · Celestial on product route | Resonance available on /world | **DISCONNECTED** | flags.tsx:30-39, :53-77; CelestialEnvironment.tsx:36-38; ResonateControl.tsx:36, :74 | Rollout decision (by design, ships dark) | Tests with ?celestial=1 overstate what the product route shows | Feature-flag rollout | YES · D-3 | n/a |
