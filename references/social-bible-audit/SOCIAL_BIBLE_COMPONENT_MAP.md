# SOCIAL BIBLE AUDIT — COMPONENT MAP

**Phase 0 · evidence audit · 2026-09-16 · read-only.**
Every row is read from source. Line counts from `wc -l`; exports from the files themselves.

---

## 0. Scope and shape of the codebase

`src/**` is **24,602 lines** across 119 TypeScript/CSS files (121 files in total). The Social / My World surface —
everything this audit covers — is:

| Group | Directory | Files | Lines | Status |
|---|---|---|---|---|
| Social (the frozen Phase 4 reference) | `src/components/style-lab/social/**` | 16 | **6,395** | FROZEN (with recorded exceptions) |
| World (People / Chat / relationships) | `src/components/world/**` | 8 | 1,080 | ACCEPTED, not frozen |
| Shell (the one navigation) | `src/components/shell/**` | 6 | 316 | ACCEPTED, not frozen |
| Person identity | `src/components/identity/PersonIdentity.tsx` | 1 | 67 | ACCEPTED (the one identity component) |
| i18n foundation | `src/lib/i18n/**` + `src/components/i18n/**` | 17 | 3,269 | ACCEPTED S1 reference (architecture frozen) |
| Life primitives shared with Social | `src/lib/life-time.ts`, `src/lib/identity/birth.ts`, `src/lib/clock.ts` | 3 | 204 | shared, load-bearing |
| Circle of Life (Phase 5, beside Social) | `src/components/style-lab/circle/**` | 7 | 1,363 | ACCEPTED |
| Out of Social scope | `cosmos/**`, `earth/**`, `StyleLab.tsx`, `demos.tsx` | — | ~8,000 | Phase 1, frozen / deferred |

**Component count relevant to Social/My World: 70 exported React components** across those groups
(Social · World · shell · identity · i18n · ui · circle), plus **22 non-exported internal
components** inside `social/**` and `world/**` (`Notes`, `NoteRow`, `MomentConversation`,
`EmotionEvent`, `SearchField`, `PeopleRow`, …), plus 5 non-component modules that are part of the
contract (`view-model.ts`, `life.ts`, `store.tsx`, `data.ts`, `model.ts`).

**`data-sb-*` hooks: 269 distinct attribute names** across `src` — the test/port contract surface.
Per `README-for-developer.md` §I these are **test hooks**, while `aria-*` and roles **are design**
and must be ported.

---

## 1. The reusable primitives (the ones the Bible must name)

| Primitive | File | Export | What it is | Where it is used |
|---|---|---|---|---|
| **Person Identity** | `identity/PersonIdentity.tsx` (67) | `PersonIdentity` | THE one entry point for "a person". Resolves `personViewFor` + `ringViewFor` + `momentLifeFor` for the (viewer, subject) pair and hands them to `LifeRing`. **There is no second avatar system.** | 18 call sites, §2 |
| **Life Ring** | `social/LifeRing.tsx` (238) | `LifeRing`, `RingAvatar` | Ten 15-year arcs, 150 years, birth at 12 o'clock, clockwise. Draws only from a `RingView`; **nothing here reads a person's birth data**. | via `PersonIdentity` only (plus `CircleModule`) |
| **Moment** | `social/Moment.tsx` (765) | `MomentEntry`, `DateRule`, `Popover`, `MenuItem`, `NoteComposer`, `RespondMark`, `QUIET_KINDS` | One Almanac entry: readout line, kind line, body, media, action row, presence line, conversation | the feed, the Circle's DayAlmanac |
| **Response / conversation** | inside `Moment.tsx` (`Notes`, `NoteRow`, `MomentConversation`) | — | The written conversation attached to a Moment | inline ≤2, focused surface 3+ on phone |
| **Expression** | `social/expressions.tsx` (1,189) | `EXPRESSIONS`, `QUICK`, `LIBRARY`, `BoomLens`, `DormantLens`, `MascotExpression`, `ExpressionControl`, `ExpressionSummary`, `lensClip`, `lensVariant`, `coreSrc`, `expressionEntries`, `prefetchQuickArt` | The 18-expression registry + the Emotion Horizon picker + the Boom Lens + Human Pulse + Spectrum + Who-expressed | `Moment.tsx:303, 366` only |
| **Human Pulse** | `expressions.tsx:1021–1189` | `ExpressionSummary` | The feed aggregate: ≤3 equal XS lenses + "{n} people", 36px at every scale | one per Moment |
| **Navigation** | `shell/Brand.tsx` (69) + `shell/destinations.ts` (57) | `Brand`, `DESTINATIONS`, `byId`, `ROOT`, `EARTH_INTENT` | The whole of global navigation: a mark that goes Home + one context word | `TopBar`, `WorldShell` |
| **Language selector** | `i18n/LanguageMenu.tsx` (87) | `LanguageMenu` | One component, two placements: immersive (Cosmos, signed-out) and inside the Account popover (signed-in) | `CosmosRoot.tsx:57`, `Chrome.tsx:191` |
| **Theme control** | `ui/ThemeToggle.tsx` (30) + `lib/use-theme.ts` (33) | `ThemeToggle`, `useTheme`, `setTheme` | `<html data-theme>` is the store; `localStorage["sb-theme"]` persists | TopBar @2xl, Account menu, WorldShell, harness |
| **Transient surface** | `world/TransientSurface.tsx` (71) | `TransientSurface`, `Scrim` | The one panel language: 220ms `sb-surface-in`, focus enters the container, Escape bubble-phase, one scroll owner | Search, People, Messages, Notifications |

---

## 2. `PersonIdentity` — the size ladder, as actually called

18 call sites. This is the compact-identity table §4 of the brief asks for, read from code.

| Surface | File:line | `size` | `at` | `connected` | `moments` | `label` |
|---|---|---|---|---|---|---|
| Profile Hero (owner + visitor) | `ProfileHero.tsx:186, 189` | **168** (`INSTRUMENT`) | ✔ | ✔ | ✔ | localized (`positionLabel`) |
| Person surface (PersonCard) | `PersonCard.tsx:92` | **56** | ✔ | ✔ `world.canMessage(id)` | ✔ | localized `t("life.circleBand")` |
| People panel — request row | `People.tsx:132` | **48** | — | — | — | *(default)* |
| People panel — ordinary row | `People.tsx:132` | **40** | — | — | — | *(default)* |
| Who-expressed list | `expressions.tsx:1160` | **40** | — | — | — | *(default)* |
| Notification — request row | `Chrome.tsx:511` | **32** | ✔ | — | — | *(default)* |
| Account button + Account menu | `Chrome.tsx:146, 152` | **28** | — | — | — | *(default)* |
| Search — People row | `Chrome.tsx:366` | **28** | — | — | — | *(default)* |
| Composer header | `Composer.tsx:301` | **28** | — | — | — | *(default)* |
| Focused conversation header | `Moment.tsx:563` | **28** | ✔ | — | — | *(default)* |
| Messages panel row | `Messages.tsx:87` | **28** | — | — | — | `""` |
| Chat conversation list | `ChatSurface.tsx:84` | **28** | — | — | — | `""` |
| Chat thread header | `ChatSurface.tsx:115` | **26** | — | — | — | `""` |
| Moment readout (the spine) | `Moment.tsx:180` | **24** | ✔ | — | — | *(default)* |
| "with N" people popover | `Moment.tsx:262` | **24** | — | — | — | *(default)* |
| Notification — moment row | `Chrome.tsx:539` | **24** | ✔ | — | — | *(default)* |
| Mini-chat header | `Messages.tsx:192` | **24** | — | — | — | `""` |
| Search — Moment row | `Chrome.tsx:390` | **22** | ✔ | — | — | `""` |
| Note (response) author | `Moment.tsx:625` | **20** | ✔ | — | — | *(default)* |
| Response composer | `Moment.tsx:720` | **20** | — | — | — | *(default)* |

**The rules this table reveals (read, not prescribed):**
- 20–48px: never pass `moments` → the ring carries **position only**, no density. Documented at
  `PersonIdentity.tsx:20–23`: *"Omit `moments` at small/dense sizes … so the ring stays legible."*
- 56px and 168px: the only two tiers that carry documented-memory density.
- `size ≥ 140` switches `LifeRing` into INSTRUMENT treatment (`LifeRing.tsx:33, 66`) — thicker
  machined stroke, radial sheen, raised current band in `--navy`, engraved density marks. **Only
  the Profile Hero reaches it today.** Every other size is bit-for-bit the pre-instrument render.
- `label=""` is passed exactly where the surrounding text already names the person, making the
  ring decorative (7 call sites, all chat/search/messages).
- **10 of 18 call sites pass no `label`** and therefore fall through to
  `PersonIdentity.tsx:65` — `` `Circle band ${pos.band}` `` — **hardcoded English**. Recorded as P-4.

---

## 3. Social components — full inventory

`src/components/style-lab/social/**`. "Frozen" = named in AGENTS.md's accepted Phase 4 reference.

| Component / module | File (lines) | Purpose | Desktop | Phone (<@2xl = 672px) | Key props | Key state | Privacy role | `data-sb-*` hooks (selected) | Tests |
|---|---|---|---|---|---|---|---|---|---|
| `SocialPreview` | `SocialPreview.tsx` (749) | Composition root: scoped tokens, the frame, surface exclusivity, the harness, `SCOPED_CSS` (52 keyframes) | 2-col `@5xl:grid-cols-[minmax(0,1fr)_300px]` | 1 col; sidebar `@max-5xl:order-2` | `product` | `bell/messages/people/search`, `composer`, `previewPublic`, `worldLight`, 5 harness overrides | Hosts `PUBLIC_VIEWER` for View-as-public; gates the entire harness on `product` | `data-sb-social-frame`, `-inner`, `-perspective`, `-worldlight` | `social-final`, `s6-motion`, `s7-device-mastery` |
| `TopBar` | `Chrome.tsx:50` (567 total) | The bar: Brand + search + People/Messages/Bell/Theme/Account; publishes `--sb-bar-h` | full search pill, 40px icons, ThemeToggle visible | icon-only search, 36px icons, brand word truncates first | `search`, `onSearch`, `surface`, `worldLabel`, `onReturnHome` | `menu`, measured bar height | renders the account identity | `data-sb-topbar`, `-brand`, `-context`, `-people`, `-messages`, `-bell`, `-unread-dot`, `-avatar-menu` | `social-shell`, `one-application`, `final-app`, `s7` |
| `SearchField` | `Chrome.tsx:221` | Four-type search surface (People · Moments · Photos · Places) | inline field, 440px results | full-width sheet with Back · field · Clear | `open`, `onOpen` | `q`, `restoring` ref | Only-me withheld from non-authors; life text is band-safe | `data-sb-search-*`, `-search-life`, `-search-person` | `s5-discovery`, `social-final` §9 |
| `NotificationsPanel` | `Chrome.tsx:457` | Day-grouped notifications; request rows resolve in place | anchored 420px panel | full-width under the bar | `onClose` | — | no life precision | `data-sb-notification-request`, `-notification-moment`, `-notif-accept/decline/outcome` | `s5-discovery` §7–§11, `complete-my-world` §3 |
| `ProfileHero` | `ProfileHero.tsx` (350) | The Person World: World Wall, Life Instrument, name, relationship, Born, contact, owner footer | asymmetric left-anchored row, `@2xl:max-w-[760px]` | centred stack; contact + management behind `<details>` | `viewer`, `subject`, `connected`, `moments`, `canPreviewPublic`, `selfPreview`, … | cover `onError` | **the main owner/visitor branch**: Born + contact + View-as-public are owner-only | `data-sb-hero`, `-hero-ring-entry`, `-contact`, `-cover`, `-cover-fallback`, `-owner-manage`, `-owner-footer`, `-view-as-public`, `-hero-relationship` | `s2-person-world` (47), `my-world-2030`, `social-2030`, `person-life-identity` |
| `LifeRing` + `RingAvatar` | `LifeRing.tsx` (238) | The instrument; photo→initials fallback | `size ≥ 140` → instrument treatment | 20–96px identical to pre-instrument | `person`, `ring`, `size`, `positionLabel`, `interactive`, `bandYears`, `animateEntry` | `hover` band | **no birth data reaches it**; tick only when `ring.fraction !== undefined` | `data-sb-ring` (`own`/`other` **only**), `-ring-instrument`, `-tick-angle`, `-band-current`, `-band-engraved`, `-identity-photo`, `-identity-initials` | `person-life-identity`, `circle`, `my-world-2030` |
| `LifeCounter` + `Hourglass` | `LifeCounter.tsx` (206) | "My life in" — 7 unit faces, honesty rule, per-second tick | sidebar card | hidden (`@max-5xl:hidden`); the hero carries the compact Life entry | `person` | `unit`, `tick` (setInterval) | owner-only surface; visitor gets a sentence instead | `aria-label^="Unit"` | `social-final` §3 |
| `CircleModule` | `CircleModule.tsx` (99) | The compact Life instrument in the sidebar + "Open Life" | 300px card | below the feed | `viewer`, `subject`, `moments` | — | `{own && …}` gates the this-month count (a fixed leak) | `data-sb-band-readout`, `-date-display` | `circle` §20, `person-life-identity` §11 |
| `LifeCursor` | `LifeCursor.tsx` (93) | Which part of a recorded life the reader is browsing | sticky 33px row | same | `viewer`, `feed`, `personOf` | `topId` (rAF-throttled scroll) | viewer-safe (`life.exact ?? "Life {band}"`) | `data-sb-life-cursor`, `-life-cursor-year` | `social-2030` §8 |
| `MomentEntry` | `Moment.tsx:101` | One Almanac entry | inline conversation, place in the readout | place/feeling on their own line; deep threads open a focused surface | `moment`, `showDate`, `onEdit` | `notesOpen`, `focusedConv`, `menu`, `expanded` | `quiet` gate; `momentLifeFor` for the age | `data-sb-moment`, `-readout`, `-respond`, `-actions`, `-presence`, `-responses`, `-response-branch`, `-response-preview`, `-note`, `-note-author`, `-kind`, `-moment-with`, `-conversation-surface` | `social-final` (180), `s3-moments`, `social-r2/r3*` |
| `DateRule` | `Moment.tsx:32` | One date heading per calendar day; "shared {date}" for backdated | rule line behind the heading | same | `iso`, `sharedAt` | — | — | — | `social-final` §14 |
| `MediaBlock` + `SafeImg` | `Media.tsx` (113) | photos / video poster / link preview; `onError` fallback keeps the Moment intact | inset | edge-to-edge bleed (`--bleed:16px`) | `media`, `quiet` | `failed` | — | `data-sb-media-fallback` | `complete-my-world` §6, `s3-moments` §7 |
| `Composer` | `Composer.tsx` (697) | Record a Moment — memory-first | centred modal `min(560px,92%)` | full-bleed sheet `inset:0` | `open`, `initial`, `onClose` | `Draft`, `picker`, `phase`, `privacyTouched` | privacy control; Health/Problem default to Only me | `data-sb-composer*`, `-readout-state`, `-open-composer` | `social-final` §10, `s3-moments`, `s6-motion` §5 |
| `DateField` | `DateField.tsx` (37) | SYSTEMBOOM date grammar over a native `<input type=date>` | chip | chip / `quiet` underline | `value`, `max`, `quiet` | — | — | `data-sb-date-display` | `social-final`, `circle` |
| `expressions.tsx` | (1,189) | The whole Expression system (see §5) | horizon: 6 cores @44px, vessel 100px | horizon: 6 cores @36px, vessel 88px | `moment` | `preview`, `performing`, `coreFlight`, `played`, `view` | Health/Problem never mount it; who-list is IDENTITY-ONLY | 50+ hooks, listed in the audit §11 | `social-r2`, `r3`, `r3-1`, `r3-2`, `r3-3`, `r3-5`, `r3-6`, `r3-7`, `r3-8`, `r3-9` |
| `store.tsx` | (288) | The Social reducer: feed window, post/edit/delete, notes, express, reveal, viewer modes | — | — | — | 20 action types | `orderFeed` withholds only-me from non-authors | — | every Social suite |
| `data.ts` | (694) | The fixtures + the data model | — | — | — | — | defines `Privacy`, `Kind` | — | — |
| `view-model.ts` | (176) | **The privacy boundary** | — | — | — | — | see the privacy matrix | `__SB_VM_OTHER_KEYS` probe | `social-final` §2 |
| `life.ts` | (134) | Life geometry + counter arithmetic + the honesty rule | — | — | — | — | `availableUnits` stops at days when the time is unknown | — | `social-final` §3 |

---

## 4. World components (People, relationships, Chat)

| Component | File (lines) | Purpose | Desktop | Phone | Notes |
|---|---|---|---|---|---|
| `WorldProvider` | `world/WorldProvider.tsx` (146) | The one truthful relationship + conversation reducer | — | — | 10 actions; `unreadMessages` lives here, notification unread stays in the Social store |
| `People` | `world/People.tsx` (258) | `PeopleButton` + `PeoplePanel` — the People **utility** (not a tab) | 400px anchored panel | full-width sheet; request actions wrap under a 48px face | pending indicator is **steel**, not Boom; one scroll owner |
| `PersonCard` | `world/PersonCard.tsx` (145) | The person surface: 56px identity, band-only life, one primary action | anchored dialog | bottom sheet with safe-area padding | the only surface offering **Remove** (no confirmation) |
| `Messages` | `world/Messages.tsx` (208) | `MessagesButton` / `MessagesPanel` / `ConversationBody` / `MiniChat` | 360px panel + one fixed 320px dock ≥1024px | panel only; Message navigates to `/chat` | dot is message-unread only |
| `ChatSurface` | `world/ChatSurface.tsx` (130) | The `/chat` destination | two-pane | list → thread | `h-[calc(100dvh-57px)]`; `?c=` read once |
| `TransientSurface` / `Scrim` | `world/TransientSurface.tsx` (71) | The panel language + the non-modal scrim | `z-10` surface under the `z-30` bar, scrim `z-20` | same | `touch-action:none` scrim; focus enters the container |
| `focus-moment.ts` | (27) | `focusMoment(id)` — double-rAF, `scrollIntoView`, `data-sb-focused`, 1200ms fallback | — | — | the landing half of Search/Notification → Moment |
| `model.ts` | (95) | `Relationship` union, `RELATIONSHIPS`, `connected()`, `ChatMessage`, `Conversation`, `SEED_CONVERSATIONS` | — | — | `ChatMessage.failed` is declared and **never used** |

---

## 5. The Expression system as one component tree

```
Moment.tsx
├─ {!quiet} ExpressionControl        expressions.tsx:571   the 44/40px control beside Respond
│   ├─ DormantLens | BoomLens(sm,36) the closed state (empty bore | the viewer's chosen core)
│   └─ (open) Emotion Horizon        a local field growing from the control
│       ├─ MascotExpression          ONE vessel (100px desktop / 88px phone)
│       │   ├─ data-sb-core-layer    the same art clipped to the chamber opening (real parallax)
│       │   └─ EmotionEvent          mounted ONLY while performing; never under reduced motion
│       ├─ 6 × core objects          {id}-core.webp, 44/36px in 56/46px hit targets, role=radio
│       └─ (More) Emotion Atlas      all 18 cores in 4 family bands, 40px, named
└─ {!quiet} ExpressionSummary        expressions.tsx:1021  the HUMAN PULSE line (36px, always)
    ├─ ≤3 × BoomLens(xs,22)          viewer first; equal size at 1 person or 1,000
    ├─ "{n} people"                  tp("expr.peopleN") + formatNumberLocale
    └─ (tap) Expression Spectrum     canonical LIBRARY order, truthful counts, no bars
        └─ (tap a feeling) Who expressed   PersonIdentity 40px, 24-batch + Show more (+48)
```

Registry facts read from `expressions.tsx`: **18** expressions; `quick` = 6
(care · joy · laugh · wow · celebrate · support); `group` ∈ {energy, warmth, thought} orders the
library; `family` ∈ {warmth, energy, wonder, connection} is colour only; `RENDERED` (`:74`) = the
same six. Per-expression tempos (`:97–104`): care 360 · joy 300 · laugh 400 · wow 260 ·
celebrate 460 · support 380 ms.

---

## 6. Dependencies on other products (seams, not redesign targets)

| Dependency | Direction | Seam in code | Status |
|---|---|---|---|
| **Cosmos** | Social ← Cosmos | `shell/CosmosRoot.tsx` "Enter my world" → `sessionStorage["sb-arrive"]` → one 480ms `sb-arrive` resolve in `SocialPreview`; the dark `.sb-social` ground is the shared `--bg-atmosphere` radial | working |
| **Circle of Life** | Social ↔ Life | `CircleModule` "Open Life" → `/life`; the hero ring is a real `Link` (`data-sb-hero-ring-entry`); the Circle imports the frozen `MomentEntry`, `Composer`, `LifeRing`, `DateField`, `SocialStore`, `view-model.ts` | working |
| **Chat** | Social → Chat | Message → `openMini` (≥1024px) or `router.push("/chat?c=…")`; `/chat` wears the same Brand, theme and `PersonIdentity` | working in-prototype; **shared session is a P1 live obligation** |
| **Shared identity primitives** | Social ← identity | `lib/identity/birth.ts` (`birthInstant`, `normalizeBirth`), `lib/life-time.ts` (`CIRCLE_BANDS`, `CIRCLE_YEARS`, `computeLifeTime`, `currentBandIndex`), `lib/clock.ts` | frozen contract |
| **Shared navigation** | Social ← shell | `destinations.ts` + `Brand.tsx` + `WorldShell.tsx` + `PersonalDestination.tsx` + `intent.ts` | ACCEPTED |
| **i18n** | Social ← i18n | `useT`/`tp` from `LocaleProvider`; `sbDate`/`sbTime`/`formatNumberLocale` from `lib/i18n/format.ts`; 319 keys × 8 catalogs | architecture frozen |
| **Earth** | none | Social never references Earth; Earth is a state inside Cosmos | no seam |
| **Ancestors** | none | exists only in prose; **not** in `destinations.ts` | not built |

---

## 7. `View in Life` — the one unimplemented seam that is visible in the UI

`Moment.tsx:307–310` renders a `View in Life` pill and `:341`/`:348` a `View in Life — later`
menu item, both `disabled aria-disabled="true"`, with the title
*"View in Life arrives in a later phase"*. It is visible in every Moment in the captures
(shots 10, 12, 50). Two different labels for one unbuilt destination — logged as **C-12**.

---

## 8. Components that are dead, vestigial or duplicated (recorded, not removed)

| Item | File:line | Finding |
|---|---|---|
| `lifePosition()` | `social/life.ts:32` | exported, **zero call sites**; computes `fraction`/`totalDays` for any person |
| `initialTime()` | `Composer.tsx:596–598` | both branches of both ternaries return `"T12:00:00"` — dead by construction, and the cause of the edit-time defect |
| `respond` reducer case | `store.tsx:140–153` | the retired R2 tap; **no dispatcher anywhere in `src`** |
| `noteRespond` reducer case | `store.tsx:172–176` | per-note acknowledgement removed from the UI in R3; case remains, unreachable |
| `Moment.responses` / `responders` / `respondedByViewer` | `data.ts:85–87` | in the model, **read by no JSX** (deliberate per R3 §41–§44) |
| `Note.responses` / `respondedByViewer` | `data.ts:61–62` | written by the fixtures, read by nothing |
| `ChatMessage.failed` | `world/model.ts:58` | declared and documented, never written or read |
| `PersonCard.tsx:70` | — | `const band = life.scope === "owner" ? life.band : life.band;` — a no-op ternary, residue of a removed branch |
| `Media.tsx:84–88` | — | the video play button has **no click handler** |
| `data.ts:150` | — | a **module-body `throw`** asserting a fixture name is exactly 40 characters — a runtime assertion shipped in the bundle |
| `.sb-seat*`, `.sb-deck`, `.sb-lib` CSS | `SocialPreview.tsx:159–200` | the R3.1 machined-well deck, superseded by the R3.7/R3.8 horizon; `.sb-seat-art` has no JSX user left |
| `sb-drift` keyframe | `globals.css:283` | zero references anywhere in `src` |
| `sb-beacon-pulse` | `globals.css:268` | no class binds it in `src`; only an inline string in the out-of-scope `LeafletEarth.tsx` |
| Dead catalog keys (×8 locales) | `catalogs/en.ts:73, 75, 83, 112, 113, 189` + `expr.summaryN`, `expr.whoTitle` | 8 keys with **zero** references outside the catalogs, incl. the two retired note strings |
| Duplicated glyph paths | `expressions.tsx` marks vs `_build-emotion-horizon.js:18–32` | twelve SVG path strings hand-copied; editing one does not update the other |
| Duplicated `1024` breakpoint | `PersonCard.tsx:74`, `People.tsx:188`, `Messages.tsx:63`, `ProfileHero.tsx:112`, `ChatSurface.tsx:108` | five `window.matchMedia("(min-width: 1024px)")` literals, no shared constant, **no resize reactivity** |

---

## 9. One structural inversion worth the Bible's attention

`ProfileHero.tsx:112–115` dispatches relationship and chat actions against **`viewer.id`**, not
`subject.id`:

```ts
const message   = () => world.dispatch({ type: "openMini", id: viewer.id });
const addFriend = () => world?.dispatch({ type: "add", id: viewer.id });
```

It is documented at `:94–98` as intentional — on this page `subject` is always the profile's owner,
so the counterpart is the acting viewer. It is correct today and **wrong the moment a second
profile route exists**. Recorded here because the Bible will describe a multi-person product.
