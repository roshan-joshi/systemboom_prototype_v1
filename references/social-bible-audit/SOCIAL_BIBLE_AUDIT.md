# SOCIAL BIBLE AUDIT

**SYSTEMBOOM V2 · Phase 0 · repository archaeology and evidence audit**
**2026-09-16 · read-only. No product code was modified, moved, renamed, refactored, fixed,
committed, pushed or deployed.**

The Bible is **not** built here. This document states what exists, what the code actually does,
what is proven, what is merely described, what contradicts something else, and what is still open.
Where documents disagree, both are reported and neither is silently reconciled.

**Companion documents**

| File | Contents |
|---|---|
| `SOCIAL_BIBLE_ROUTE_MAP.md` | every route, its gate, its components, its risks |
| `SOCIAL_BIBLE_COMPONENT_MAP.md` | the component inventory, the identity size ladder, dead code |
| `SOCIAL_BIBLE_PRIVACY_MATRIX.md` | the owner/visitor data matrix, traced to functions and tests |
| `SOCIAL_BIBLE_TEST_MAP.md` | the 64-file test inventory and the privacy-assertion table |
| `SOCIAL_BIBLE_DECISION_EVIDENCE.md` | 68 decisions + 10 future directions + 12 rejections, each with citation and maturity class |
| `SOCIAL_BIBLE_CONTRADICTIONS.md` | the 24-row contradiction register |
| `SOCIAL_BIBLE_SCREENSHOT_INDEX.md` | 51 captures, the capture method and its honest caveats |
| `evidence/` | the captures themselves |

---

# 1. Executive summary

**What this repository is.** A high-fidelity, local-only Next.js 16 prototype
(`"name": "systemboom-prototype"`, `"private": true`) whose purpose is to be *ported* — it is the
accepted visual and interaction reference from which the developer of `next.systemboom.co.uk`
builds the live Social product. Nothing in it is a draft. It has no backend, no persistence
(`store.tsx:5` — *"nothing is persisted, nothing leaks to localStorage"*), and its identity is a
mock.

**Scale.** 121 files and 24,602 lines in `src/`; 39 documents in `docs/`; 64 scripts in
`prototype-tests/`; 146 files in `public/`; 28 evidence directories; one 1,044-line `AGENTS.md`
that is the repository's real changelog, contract register and supersession log.

**What is genuinely strong.**

1. **The privacy model is the best-built thing in the repository.** It is a *data* contract in one
   module (`view-model.ts`), not a display rule; birth-derivable fields are **absent** from a
   non-owner's object rather than hidden; and it is defended at four independent levels — the
   serialized model, the view-model key set, the aggregate density, and a raw DOM string scan run
   across viewer × theme × width, each with a positive control beside it. Verified in code and in
   captures 10 vs 12.
2. **The supersession discipline is real.** Every owner-directed change this audit checked is
   recorded in AGENTS.md with a date, the file, the behavioural effect, the test that protects it,
   and — where an accepted assertion changed — an explicit "owner-superseded, never silent" entry.
   That is unusually honest engineering practice.
3. **The honesty about blockers is real.** The expression art is reported as ART ASSET BLOCKED with
   a mandatory no-marks proof board; the capability gate was re-tested rather than asserted;
   simulated device conditions are labelled as simulated; "1K" was not invented because no truthful
   compact formatter exists.
4. **The anti-patterns are enforced, not merely stated.** No follower graph exists anywhere in
   `src` (exhaustively grepped — the only hit is the comment forbidding it); no ranking,
   percentages or bars in the Spectrum; no combined unread total; no People or Chat navigation tab;
   no second avatar system.

**What is genuinely weak.**

1. **The documentation has fallen behind the code, inside the frozen set.** 24 contradictions are
   registered. Five are high-risk, and all five sit inside the *frozen accepted Social reference*:
   the Composer's binding body order, the Respond interaction **and its API shape**, whether a
   reaction set is permitted at all, the expression set size and asset budget, and the
   friends-privacy rule. Freezing the documents alongside the code is what made them hard to
   correct when eleven later owner-directed rounds changed what they describe.
2. **One privacy contract is applied asymmetrically.** The `friends` privacy value is deliberately
   withheld from ring density pending backend verification — but the **feed** and **search** apply
   no such caution, so a `friends` Moment is readable by anyone who can see the page while not
   counting toward density. The documented uncertainty reached one surface of three (**C-14**).
3. **The test suites cannot be run by anyone but this machine.** Hard-coded macOS Chrome path,
   `--use-angle=metal`, absolute `/Users/roshan/…` evidence paths, no runner, no CI, no manifest.
   Every count in the repository exists only as prose in AGENTS.md.
4. **`/chat` is the least-finished seam and the least-tested surface.** No suite loads the route.
   Its header height is a magic `57px`, its deep link is read once imperatively, its strings are
   the only un-localised block left in the product, and navigating to it from a phone **resets the
   store** — an accepted request or a just-sent message is gone.
5. **The expression art blocker stands.** All eighteen expressions wear the same face. Six carry a
   composited emotion core; twelve fall back to the neutral vessel. This is stated plainly by the
   code and by AGENTS.md; it is the one thing the product cannot finish without an artist.

**The single most consequential thing for the Bible to inherit:** the repository already contains
its own governing rule — *"Where an older document disagrees, this one and the accepted, tested
behaviour win, **and the older document is corrected**"* (`systemboom-navigation-final.md:5–6`) —
and, in every case this audit checked bar one, the older document was not corrected. The Bible
should be built so that this cannot happen again.

---

# 2. Current product definition (as the code states it)

From `src/components/shell/destinations.ts:1–23`, which is the single source of truth:

> COSMOS `/` — the universal Home, everyone starts here
> MY WORLD `/world` — the personal Home after identity; its stream is MOMENTS
> LIFE `/life` — the Circle of Life, inside the person's World

plus CHAT `/chat`, "a utility surface of My World, never a navigation item", which owns a route so
a Message action can land in a conversation.

Four sentences carry the whole product model, and all four are enforced in code:

1. **Earth is a state inside Cosmos, never a route** (`EARTH_INTENT = "/?to=earth"`).
2. **"Social" is engineering vocabulary**; the UI says MY WORLD and MOMENTS; `/social` is a
   compatibility redirect.
3. **There is no global destination menu.** The mark goes Home; one word states the context.
4. **Ancestors appear nowhere** until a real implementation exists.

A person, in this product, is: **PERSON + RELATIONSHIPS + MOMENTS + PLACE + LIFE POSITION +
MEMORY** (AGENTS.md, Social 2030). Every identity surface renders that same person through one
component.

---

# 3. Route map

Full detail in `SOCIAL_BIBLE_ROUTE_MAP.md`. Summary:

| Route | Status | Gate |
|---|---|---|
| `/` | working (Cosmos, 3D, `ssr:false`) | public |
| `/world` | working — **My World** | identity; remembers the request in `sessionStorage["sb-intent"]` |
| `/life` | working — the Circle of Life | identity |
| `/chat` | working — Chat (`?c=<personId>` deep link) | identity |
| `/social` | server redirect → `/world` | — |
| `/style-lab`, `/style-lab/social`, `/style-lab/circle` | prototype only; `/style-lab/social` carries the review harness | — |

**Verified, not assumed:** there are exactly eight `page.tsx` files, no dynamic segments, no route
handlers, no middleware. **There are no person, profile, search or notification routes** — all of
those are in-page transient surfaces or modals. A single Moment is never addressable; it is
reached by the `reveal` reducer action plus `focusMoment(id)`.

---

# 4. Experience architecture

Only flows supported by evidence are listed. Each was traced in code and, where marked ✅,
confirmed in a capture.

```
Cosmos  /
  ├─ signed out → LanguageMenu (immersive) + the identity gate
  └─ signed in  → "Enter my world" → /world  (or /life if that was the remembered intent) ✅

/world  MY WORLD  ✅ (shots 40, 41)
  ├─ ProfileHero (owner)  ── ring → /life                     ✅ (data-sb-hero-ring-entry)
  │                       ── "band · N days · Life →" → /life ✅ (shot 10)
  │                       ── View as public → the visitor-safe model, in place ✅ (shot 22)
  ├─ Composer entry bar ── "What happened at <age>?" → Composer ✅ (shots 07/16/34)
  │                         └─ post → the Moment lands at its chronological position, focused
  ├─ The Almanac (MOMENTS)
  │   ├─ author name → Person surface (PersonCard)            ✅ (shot 20)
  │   ├─ "with N"    → the referenced people → Person surface
  │   ├─ Respond     → opens the conversation, cursor in the composer ✅ (shot 21)
  │   ├─ Expression  → the Emotion Horizon → commit → the Boom Lens ✅ (shots 08/17/37)
  │   ├─ Human Pulse → the Spectrum → a feeling → its people  ✅ (shots 09, 27)
  │   ├─ a response author → their Person surface
  │   └─ ⋯ → Edit / Change privacy / Delete (own) · Report / Hide / Copy link (others)
  ├─ Sidebar: LifeCounter + CircleModule ── "Open Life" → /life ✅ (shot 10)
  ├─ TopBar utilities (six)
  │   ├─ Search   → Person | Moment | Photo | Place            ✅ (shots 05, 14, 36)
  │   │              person → Person surface;  moment/photo → reveal + land on it
  │   │              place  → narrows the search (does not navigate)
  │   ├─ People   → Find someone | Requests | Your people      ✅ (shots 04, 13, 35)
  │   │              Add friend / Accept / Decline / Cancel / Message
  │   ├─ Messages → conversations → mini dock (≥1024px) or /chat ✅ (shot 18)
  │   ├─ Bell     → notifications → request (Accept/Decline in place) ✅ (shots 06, 15, 38)
  │   │                           → moment row → reveal + land on that Moment
  │   ├─ Theme    (≥@2xl only; also in the Account menu)
  │   └─ Account  → Statistics · Weather · Exchange · Settings · Appearance · Language · Logout ✅ (shot 19)
  └─ visitor mode → "{Name}'S WORLD", relationship state + one action,
                    band-only Life, no composer                 ✅ (shots 03, 12, 32)

/life  ✅ (shot 42)   Life → Band → Year → Month → Day → Almanac; "Record a Moment" at a date
/chat  ✅ (shots 43, 46)  conversation list ↔ thread; ?c= deep link
```

**Flows that do NOT exist** (checked, so the Bible does not assume them): no profile route; no
Moment permalink (the ⋯ "Copy link" writes a **fabricated** `https://systemboom.example/m/<id>`);
no desktop back affordance in `/chat` (the branch exists but is inside an `lg:hidden` element); no
notification produced by an Expression (a documented live seam, correctly not faked).

---

# 5. Identity

**One component.** `identity/PersonIdentity.tsx` (67 lines) is the single entry point every
identity surface renders from — Profile, Moment, Search, Friend, Notification, Chat, Composer,
Responses, the who-expressed list. It resolves `personViewFor` + `ringViewFor` + `momentLifeFor`
for the (viewer, subject) pair and hands the result to `LifeRing`. **There is no second avatar
system in `src`.**

**Fallback hierarchy: real photo → initials.** No illustrated or curated-avatar tier
(`LifeRing.tsx:217–237`). A failed photo swaps `data-sb-identity-photo` for
`data-sb-identity-initials` — never a broken-image icon, and the ring geometry is unaffected, so
identity failure never reads as a missing person.

**Compact identity sizes differ per surface — and the differences are systematic.** The full
18-row ladder is in `SOCIAL_BIBLE_COMPONENT_MAP.md` §2. The pattern:

| Tier | px | Passes `moments`? | Surfaces |
|---|---|---|---|
| Profile instrument | **168** | ✔ | ProfileHero only — the only site that reaches `size ≥ 140` and the INSTRUMENT treatment |
| Person surface | **56** | ✔ | PersonCard |
| People rows | **48 / 40** | ✘ | request row / ordinary row; who-expressed is 40 |
| Notification request | **32** | ✘ | |
| Dense chrome | **28** | ✘ | account, search person, composer, conversation header, messages, chat list |
| Chat header | **26** | ✘ | |
| In-stream | **24 / 22** | ✘ | Moment readout, notification moment row, mini-chat, search moment row |
| Response author | **20** | ✘ | notes and the response composer |

**Relationship, presence and verification are never ring geometry.** `data-sb-ring` is only ever
`"own"` or `"other"` — asserted by three suites. The relationship renders beside the ring as a
state chip plus one action.

**Owner vs visitor differences on the Person World** (all verified in shots 10 vs 12):

| | Owner | Visitor |
|---|---|---|
| Brand context word | MY WORLD | **{NAME}'S WORLD** |
| Born line (`<dl>`) | `04 NOV 1991 · 06:42` | absent |
| Contact pill | "ONLY YOU SEE THIS" + phone + email | absent |
| Life line | `band 30–45 · 12,735 days  Life →` | `Circle band 30–45 — the exact age is theirs to share` |
| Ring | instrument, red present tick, engraved density, a real `Link` to `/life` | band-level, no tick, inert |
| Counter | full 7-unit instrument | "A person's counter is theirs to see. Band 30–45" |
| Circle module | `12,735 DAYS`, band + calendar years, "4 moments recorded this month", Open Life | `30–45 BAND` only |
| Composer entry | present | absent |
| Owner footer | View as public · Change cover photo · Who can see your profile | absent |
| Relationship | — | state chip (Friends/Family/Requested/Wants to connect) + one action |

**View as public** renders the owner's own World through a technical stand-in viewer
(`PUBLIC_VIEWER`) so it resolves through the identical "other" branch — there is no second privacy
implementation, and `person-life-identity.js` §11 compares its DOM **byte-for-byte** against a
genuine visitor's.

**Finding (P-4).** `PersonIdentity.tsx:65` builds its default accessible label as
`` `Circle band ${pos.band}` `` — hardcoded English. **10 of 18 call sites pass no `label`**, so on
every non-English locale a non-owner's ring announces an English string.

---

# 6. Life Ring

## 6.1 CURRENT IMPLEMENTATION (read from `LifeRing.tsx`, 238 lines)

| Property | Value |
|---|---|
| Model | **ten 15-year bands = 150 years** (`lib/life-time.ts:63–80`) |
| Origin | birth at 12 o'clock, time runs clockwise |
| Gap | `GAP_DEG = 4` between bands |
| Stroke | instrument: `round(size * 0.095)`; else `3` at ≥60px, `2` below |
| Lived | ice (`--ice`), opacity `0.28 + 0.72 × (count / maxCount)` |
| Unwritten | steel (`--steel`) at opacity `0.18` |
| Present tick | a `var(--boom)` rect rotated to `fraction × 360°`, carrying `data-sb-tick-angle` — **rendered only when `ring.fraction !== undefined`, i.e. owner only** |
| Owner's current band | split at `livedEnd` (lived / unwritten within the band) |
| Visitor's current band | drawn **whole**, slightly lighter — no split, because a split would narrow the birth date |
| Instrument threshold | `INSTRUMENT_MIN = 140` — currently reached only by the Profile Hero (168px) |
| Instrument extras | radial `--ice-hi`/`--steel-hi` sheen; the current band rises 3px in radius with `+3` stroke, its own `drop-shadow` and a dedicated `--navy` accent; a thin highlight arc; **owner-only engraved density marks** (`engrave()`, `:86–98`) |
| Sizes in use | 20 · 22 · 24 · 26 · 28 · 32 · 40 · 48 · 56 · 168 (10 distinct) |
| Navigation | the owner's hero ring is a real `Link` to `/life` (`data-sb-hero-ring-entry`), a normal Tab stop; a visitor's ring is inert |
| Interactive mode | `role="list"` + `role="listitem"` bands with `aria-label="Band X–Y years[, YYYY–YYYY][, N moments recorded \| unwritten]"` — used by the Circle, not the feed |
| Privacy | **nothing in this component reads a person's birth data**; it renders only from a `RingView` |
| Motion | one entry event when `animateEntry` is passed: `sb-instrument-resolve` (420–460ms) + `sb-band-settle` (320ms @160ms, 260ms @380ms) |

## 6.2 FUTURE / DOCUMENTED INTENT (not implemented)

- The full Circle's Phase-6 "View in Life" seam: `coordForDate` → `?c=day:YYYY-MM-DD`
  (`circle-of-life-spec.md` §11). The Moment-level **View in Life** pill exists but is
  `disabled aria-disabled="true"` with the title *"View in Life arrives in a later phase"*.
- A photo timeline as a Circle view mode; "same day across your life" — both banked in
  `phase-5-candidates.md`, explicitly **not built**.

## 6.3 Findings

- **F-Ring-1.** `animateEntry` is passed **unconditionally** by `ProfileHero.tsx:186, 189`, and
  `sb-band-settle`'s inline delays (160ms and 380ms) are **not** cleared under reduced motion. The
  global rule zeroes `animation-duration`, not `animation-delay`; with `both` fill the band holds
  its `from` state (`opacity:0; transform:scale(.85)`) for up to 380ms and then pops in. The
  repository guards this exact hazard for two other keyframes (`sb-tile-in`, `sb-rise-in`) but not
  this one.
- **F-Ring-2.** `person-life-identity.md:98–99` still says the ring has *"no continuous animation,
  ever … reduced motion needs nothing extra to suppress"* — superseded by the above (**C-10**).

---

# 7. Privacy

Full matrix: `SOCIAL_BIBLE_PRIVACY_MATRIX.md`. The essentials:

- **One module is the boundary** — `view-model.ts`, four functions, one `isOwner` test.
- **`OwnerLife` carries 11 birth-derivable fields; `OtherLife` carries exactly two** (`band`,
  `bandIndex`). The 11 are enumerated in `FORBIDDEN_ON_OTHER` and asserted absent from the live
  object via the `__SB_VM_OTHER_KEYS` probe.
- **Density** (`momentsByBand`) is owner-only unless a caller opts in with `connected`; when it
  does, a non-owner's density is built from **public Moments only**, never Health/Problem, never
  only-me — and `connected` is deliberately **unused** in the filter, marked in code as
  *FRIENDS PRIVACY BACKEND CONTRACT — VERIFY DURING LIVE PORT*.
- **Birth truth is enforced at the model**: an unknown time is dropped, not defaulted; a malformed
  time degrades to unknown; day precision anchors at local midnight which "must never be
  displayed"; the counter stops at days when the time is unknown.
- **Health/Problem** are excluded from Respond, the Expression control and the Human Pulse, default
  to Only me, and are never in a visitor's density.

**The eight recorded privacy risks** (P-1 … P-8 in the matrix), briefly:

| | |
|---|---|
| **P-1** | `privacy: "friends"` is enforced **nowhere** — the feed and search withhold only `onlyme`; only the ring withholds `friends`. The documented caution reached one surface of three. **Measured:** a read-only DOM probe at `?viewer=visitor` renders **all six** `friends` fixtures and correctly withholds both `onlyme` ones, with **no** birth-derived string anywhere in the DOM. |
| **P-2** | Identity is client-side only; server-side guarding of `/world` `/life` `/chat` is a stated P1. |
| **P-3** | `lifePosition()` (`life.ts:32`) computes `fraction`/`totalDays` for **any** person and gates only `exact` on `isSelf`. Currently called by nothing — but it is the shape `view-model.ts` exists to prevent. |
| **P-4** | `PersonIdentity`'s default ARIA position label is hardcoded English (`Circle band …`). |
| **P-5** | Two hardcoded English `title` tooltips on the life readout. |
| **P-6** | Two decayed assertions — one recorded (`s2-person-world.js` §70), one **not** (`circle.js`'s `ok(… \|\| true, …)`, which can never fail). |
| **P-7** | `/chat` is never loaded as a route by any suite, so its (correct) absence of life data is untested. |
| **P-8** | `PUBLIC_VIEWER` carries a hardcoded `birthDate: "2000-01-01"`; never rendered or named. |

---

# 8. Moments

## The data model (verbatim, `data.ts:66–94`)

`id · authorId · at · sharedAt? · atPrecision?("day"|"minute") · place? · text? · kind · fields? ·
feeling? · privacy · media? · responses · respondedByViewer? · responders · notes · edited? ·
expressions?`

`Kind = "moment" | "meal" | "activity" | "problem" | "health" | "project" | "meeting"` — **seven**.
`Privacy = "public" | "friends" | "onlyme"` — **three**.
`Media` is a three-arm union: `photos` | `video` | `link`.
`Note = id · authorId · text · at · parentId? · responses · respondedByViewer? · edited?`

**Three fields are in the model and read by no renderer**: `responses`, `respondedByViewer`,
`responders` — deliberate, per R3's retirement of the anonymous tap. `Note.responses` and
`Note.respondedByViewer` are a fourth and fifth.

## Kinds as rendered

`kindLine()` (`Moment.tsx:52–98`) emits a readout for six kinds; plain `moment` returns `null`
(no kind line). MEAL → what · venue; ACTIVITY → what · measure · duration; PROJECT → name ·
an inline progress bar · since; MEETING → with names · venue · duration; HEALTH → measurement ·
value · "only you"; PROBLEM → title · status · "only you". Shot 28.

**The quiet gate**, verbatim:
```ts
export const QUIET_KINDS = new Set(["health", "problem"]);   // Moment.tsx:26
const quiet = QUIET_KINDS.has(moment.kind);                  // :112
{!quiet && ( … data-sb-respond … )}                          // :292
{!quiet && <ExpressionControl moment={moment} />}            // :303
{!quiet && <ExpressionSummary moment={moment} />}            // :366
```

## The Almanac

- **Order** — `orderFeed` (`store.tsx:104–111`) keys on `m.at`, **not** `sharedAt`, so a backdated
  Moment sinks to its true historical position; only-me is filtered out for non-authors; hidden ids
  are removed.
- **Grouping** — one `DateRule` heading per calendar day (`dateKey = iso.slice(0,10)`); every entry
  after the first gets a hairline top border.
- **Date treatment** — `TODAY` plus the real date when today, else `sbDate(locale, iso)` in
  `DD MON YYYY`; a backdated Moment adds *"shared today"* / *"shared {date}"*.
- **Time** — `{moment.atPrecision !== "day" && <span>{formatTime(moment.at)}</span>}` — a
  day-precision Moment **never** shows a clock; the 12:00 anchor is invisible.
- **Place** — inline in the readout at `@2xl`; on its own line on a phone *"so nothing truncates to
  a stub"*. An absent place renders nothing (`m-noplace` exercises it).
- **Life** — from `momentLifeFor`: exact for the viewer's own Moments, the band for everyone
  else's. Both `title` tooltips are hardcoded English.
- **Windowing** — `visible: 8`, `loadMore` +8, control reads `{n} earlier · Load more`; end state
  *"That's everything shared here so far. Earlier moments live in Life."*
- **`reveal`** — widens the window just far enough to include a Moment a Search result or a
  Notification points at; then `focusMoment(id)` scrolls, focuses the readout and sets
  `data-sb-focused` (with a 1200ms clear fallback).

## The Life Cursor

A plain in-flow `position: sticky` row, 33px, **always rendered even when silent** (unmounting a
variable-height row on scroll fed back into the scroll position it was reading — a real measured
bug the component exists not to reintroduce). It shows a real Moment's year + viewer-safe life
position + place only once genuine history has crossed a fixed 88px trigger line, and is silent for
the current year. Against the current fixtures only `m-1983` and `m-wedding` ever activate it.
Shot 25. Its `"Life "` prefix is hardcoded English.

## Fixtures

**23 seed Moments.** 3 backdated (`m-1983`, `m-tenphotos`, `m-wedding`); 2 day-precision
(`m-1983`, `m-wedding`); 16 carry media (14 photos, 1 video, 1 link); 3 carry expressions
(`m-rain`, `m-1983`, `m-panorama`); 2 are Health/Problem (both only-me, both the demo user's);
`m-forty` carries 40 notes; `m-600` a 600-word body; `m-tenphotos` ten photos; `m-noplace` no
place; `m-face` a portrait-aspect photo; `m-sameage` two people in the same band.
`respondedByViewer` is never set on any seed Moment.

**Fixture defect (E-1).** `data.ts:578` seeds `"p-krishna": "wonder"` — **`wonder` is not an
`ExpressionId`**; it was renamed `wow` in R3 and now exists only as a *family* name. It fails
silently because `expressionEntries` (`:483–486`) filters unknown ids, so `m-panorama` renders
**2** expressions, not 3, and Krishna is silently dropped from the who-list.

---

# 9. Composer

**Entry points (5):** the Almanac entry bar (`data-sb-open-composer`, owner-only, pre-fills
`place` with the person's home); the ⋯ **Edit** item; the Circle's DayAlmanac
"Record a Moment at this date" (owner-only, date-seeded); `useComposerSeed()`; and the harness
`?composer=1` (which, unlike the real entry, pre-fills an **empty** place).

**Body order — memory-first** (owner-directed, S5/S6): header (author + privacy beside the title)
→ the words (17/18px, focused) → **one coordinate sentence** `today · DD MON YYYY · <age> · ⌖ place`
where the date and place *are* the instruments → feeling + character counter → seven quiet kind
chips → kind fields → the media panel. **No boxed "WHERE THIS SITS" block** — that heading survives
only as `sr-only`. Shots 07, 16, 34.

**Kinds:** seven chips, and the first chip is `moment` but functions as the **media button**
(aria "Photos & video", visible word "media"). Choosing a kind again clears it back to `moment`.
Health/Problem set privacy to Only me unless the person has touched privacy, and restore the
previous value on leaving.

**Per-kind required fields:** meal `what*`; activity `what*`; problem `title*`; health
`measurement* value*`; project `name*`; meeting `with*`.

**Media:** `PHOTO_LIMIT = 10`, `TEXT_LIMIT = 2000`; the library grid with ordinal badges and
arrow-button reorder (mandatory, not drag-only); a Boom dot on a photo carrying file metadata.
Video is a **checkbox stand-in**, not an upload; link resolution is a 700ms simulation keyed on
`url.includes("example.org")`.

**Backdating — the exact value, verbatim (`Composer.tsx:216–218`):**
```ts
const at = backdated ? `${effDate}T12:00:00`
                     : `${effDate}T${localISO(now()).slice(11, 19)}`;
```
and on post: `sharedAt = backdated ? localISO(now()) : undefined`,
`atPrecision = backdated ? "day" : "minute"`. So a backdated Moment gets **noon as a sort anchor,
day precision, and today as provenance** — and the clock is never displayed. There is **no time
field anywhere in the Composer**.

**Validation:** `canPost = !over && !future && !detectionActive && requiredMissing.length === 0 &&
(text || photos || video || link) && phase !== "posting"`. Sentences: *"That date hasn't happened
yet."*, *"Needed: {fields}."*, *"Add at least one photo — or write it as a plain moment."*

**Drafts:** closing with content offers **Keep draft / Discard / Back**; a kept draft turns the
entry bar into *"Draft kept — continue your moment"*. Memory only — nothing is persisted.

**Mobile:** a full-bleed sheet (`inset:0`) below 42rem; a centred `min(560px,92%)` modal above,
centred by `inset:auto 0; margin-inline:auto` — **never `translateX`**, because Motion animates the
shell's transform and silently replaced the centring (a real captured defect).

**On success:** an artificial 900ms `posting` phase, then the Moment is prepended, `justPosted` is
set, the window widens to include its chronological index, the draft clears, and the entry focuses
its own readout and scrolls into view (`auto` when reduced-motion or >2.5 viewports away).

**Composer defects found:**

- **E-2 (real).** The **edit** path forces `at` to `"T12:00:00"` for every edited Moment, and does
  **not** set `atPrecision`. `initialTime()` (`:596–598`) returns the same string from both
  branches of both ternaries — dead by construction. Consequence: editing a minute-precision
  Moment silently moves its time to 12:00 **and then displays 12:00 as if it were the real event
  time**. The edit path also drops `sharedAt` handling and does not null `fields` when the kind
  returns to plain `moment`.
- **E-3.** `canPost` demands text/photo/video/link even when every required kind field is filled —
  so a Health Moment with a measurement and a value but no prose **cannot be posted**.
- **E-4.** The failure branch prints *"Couldn't post. Your draft is kept."* but never dispatches
  `{type:"draft"}`; the draft survives only because the composer stays mounted.

---

# 10. Responses

**The vocabulary that actually ships** (JSX + the `conv.*` catalog, all 12 keys referenced):

| Word | Where |
|---|---|
| **Respond** | the action-row button (`data-sb-respond`) — it **opens the conversation with the cursor in the composer**; it dispatches nothing |
| **Write a response** / **{n} responses** | the presence line (`data-sb-responses`) |
| **Reply** / **Reply to {name}…** | depth-1 rows only |
| **View {n} more responses** / **Collapse** | the inline overflow control |
| **Response** | the ⋯ popover label; **Edit response** in ARIA |
| **Responses to {name}'s moment** | the focused surface's accessible name |
| *Comment* | **zero occurrences** anywhere in the Social components or `en.ts` |

**Data shape:** `Note`, with `parentId` giving **one** level of replies — a depth-2 row's Reply
targets the parent, so level 3 is unreachable. Delete cascades one level. Replies indent `pl-8`.

**Visual attachment:** one hairline L-stroke from the Almanac spine into the thread
(`data-sb-response-branch`) — *"these people are responding to THIS memory, never a per-comment
tree."* A one-line preview of the most recent top-level response sits under the presence line.

**Adaptive depth:** `INLINE_DEPTH = 2`; 3+ top-level responses on a phone (live-measured frame
width < 672) open a focused `role="dialog" aria-modal` surface carrying a **memory header**
(identity + safe life position + date · place + excerpt + thumbnail), the responses, and a composer
above the keyboard with the home-indicator inset. Desktop stays inline (`SHOW_TOP = 3` with an
overflow control).

**Limits:** `BODY_LIMIT = 420` / `NOTE_LIMIT = 280` are **display truncation only**; the textarea
has no `maxLength`. Blanks and double-sends are blocked. No per-response privacy, no rate limit.

**Emoji:** *"Unicode emoji enter through the person's own keyboard"* — no picker, no attachments.

**Failure:** a simulated 350ms latency; on failure the text is **kept** and
*"Couldn't send. Kept here."* appears with a Retry.

**Response findings:**

- **E-5.** The responses affordance is **not gated by `quiet`** — verified: `Moment.tsx:366` gates
  only `ExpressionSummary`; the button at `:367–378` is its sibling. A Health/Problem record keeps
  "Write a response" and a working composer, contradicting
  `moment-conversation-model.md` §7 (**C-15**).
- **E-6.** The focused phone surface passes `onReply={() => {}}` to every row — so **the one place
  deep threads actually live has no Reply at all**.
- **E-7.** The disclosure chevron is suppressed for deep threads at **all** widths, although desktop
  still discloses inline.
- **E-8.** "NOTE" is still visible in the product: `data.ts:682` *"left a note on your Thamel
  moment"* and `:685` *"mentioned you in a note"*, rendered verbatim — while the sibling fixture at
  `:684` already uses *"responded to your Mustang panorama"*.

---

# 11. Expressions — what CURRENTLY exists

The direction changed across R2 → R3 → R3.1 → R3.2 → R3.3 → R3.5 → R3.6 → R3.7 → R3.8 → R3.9.
**This section documents only the current code.** (`expressions.tsx` still carries an "R3.1" file
header while its inline blocks are annotated R3.7/R3.8/R3.9 — the shipped behaviour is R3.9.)

## Registry — 18 expressions

`ExpressionId` (`:53–55`), `EXPRESSIONS` (`:142–202`) — verified 18 literals.

| Quick six | care · joy · laugh · wow · celebrate · support |
|---|---|
| Extended twelve | love · respect · thanks · proud · inspired · curious · touched · withyou · agree · thinking · nostalgia · speechless |

Each carries `labelKey`, `quick`, `group` (energy/warmth/thought — **orders the library, never
shown as tabs**), `family` (warmth/energy/wonder/connection — **colour only**), `energy`, `mass`,
`accent`, `pose`, `fuse`, `mark`, `markAt`. `group` and `family` genuinely diverge (wow is group
*energy*, family *wonder*), which is stated in only one document (**C-13**).

Per-expression tempos (hand-tuned, `:97–104`): care **360** · joy **300** · laugh **400** ·
wow **260** · celebrate **460** · support **380** ms. Masses: heavy 300ms / normal 360ms /
light 440ms, with pressure-ring scales 1.62 / 1.85 / 2.02.

**No angry, hate, dislike, downvote, mocking or sarcastic. BOOM is reserved.**

## Mascot and art status — stated honestly

- **One source render exists**: `references/brand/WhatsApp Image 2026-09-15 at 07.40.41.png`
  (1055×1024, real alpha) — the owner's 3D bomb, **one pose, a mischievous grin**.
- `public/brand/expressions/` holds **77 WebP files**, of which only the neutral tiers are straight
  crops. Everything else is **script-built composite art**, repeatable and auditable:
  `_build-expression-assets.js` (crops), `_build-emotion-cores.js` (the chamber + six emotion
  cores), `_build-emotion-horizon.js` (18 core orbs + the dormant vessel),
  `_build-emotion-events.js` (10 escaped-energy forms).
- **`RENDERED` = `{care, joy, laugh, wow, celebrate, support}`** (`:74`). The other twelve have **no
  `{id}-sm|md|lg` and no `{id}-lens-*` file at all** and fall back to the neutral vessel and the
  neutral lens.
- **Even for the six, the FACE is identical.** The compositor adds *"additive light only — no
  geometry is touched"*: a per-expression eye glint and a fuse tinge. So **18/18 expressions wear
  the same face.** Six differ by an emotion core inside the chamber; twelve differ only by pose,
  accent, mark and a 128px core orb (and the extended twelve's orbs are stated as **provisional**).
- This is what AGENTS.md calls **ART ASSET BLOCKED**, re-verified in R3.9: *"this environment has
  NO image-generation or image-edit capability … Nothing was faked to close it."* The proof
  artefacts are the no-marks / no-label boards.

## Emotion Core / chamber

A machined bore seen obliquely in the mascot's upper-right body panel, containing a lit core.
It exists at three levels: **baked into the asset** (`_build-emotion-cores.js`, chamber
`cx 694 · cy 581 · rx 90 · ry 99 · tilt −10`, opening `r 84` offset to the lower-right,
`CORE_SCALE 1.3`); **as a real second layer in the component** (`data-sb-core-layer`, the same art
clipped to `ellipse(8.6% 9.5% at 70.8% 59.7%)` so it can lag the shell by ~1.5px on a pointer
preview); and **as a standalone object** (`{id}-core.webp`).

The six core drawings: care a heart · joy an eight-petal sun · laugh two laughter arcs plus a
tear · wow an eight-point starburst · celebrate a firework · support a teal cradle holding a warm
orb.

## The Emotion Horizon (the current picker) — shots 08, 17, 37

A local field growing from the control, holding **ONE vessel** (100px desktop / 88px phone) and
**six core objects** on a shallow horizon (44px orbs in 56px hit targets desktop; 36px in 46px on a
phone — measured at open time against the frame, sized so 6 × 46 + padding fits a 320px frame).
Desktop places them on a shallow symmetric arc; the phone is flat. A caption names whatever is
being attended to; More/Remove sit outside the scroller.

**Preview:** hover / focus / drag raises a core, leans it toward the chamber, plays a ~120ms
chamber wake, and renders that expression in the vessel. Drag falls back to the nearest core within
12px so the gaps between cores are not dead zones.

**Commit — three stages, the store first:**

| t | stage |
|---|---|
| 0 | `dispatch({type:"express"})` — **truth before any animation**; removal and reduced motion short-circuit straight to the final state |
| 0 → 120ms | the chosen core accelerates into the vessel's opening while the others recede |
| 120ms | the shell **locks** it: gesture + mass impulse + fuse + Boom pressure ring + core ignition + the escaped-energy event |
| 120 + 0.7·tempo | the activated chamber collapses into the Boom Lens beside Respond (200ms) while the field fades, inert |
| +220/240ms | the lens lands with one thump and one ring |

Worked: Celebrate ≈ **882ms** total; Wow ≈ **742ms**.

**The Emotion Atlas** ("More") keeps the same vessel on stage and shows all eighteen cores at 40px,
named, in four family bands separated by air and a hairline — never tabs. Scroller height is
clamped to the room actually available above the control. Shot 26.

## Human Pulse (the feed aggregate) — shots 09, 27

One button: **≤3 equal 22px Boom Lenses** (the viewer's first, then the most-represented distinct
types, ties broken canonically) plus **"{n} people"**. `min-h-9` = **36px**, constant from 1 person
to 1,000+ because nothing in the render path scales with the count. **No per-expression counts in
the feed.** Returns `null` when nobody has expressed. The accessible label states presence and
lists which feelings are represented — in canonical order, **without counts**.

## Spectrum and who-expressed

**Spectrum:** canonical `LIBRARY` order (never popularity), truthful counts, 40px equal lenses,
`tabular-nums`. **No bars, no percentages, no ranking graphic** — grep-verified: no `%`-derived
geometry anywhere in `ExpressionSummary`.

**Who expressed:** `PersonIdentity` at 40px with `moments` and `connected` **omitted**, so the ring
carries position only and no density; insertion order, no sort; 24 initially, +48 per press, with
focus handed to Back when the final press unmounts the button. A deterministic ±2.5° lean per
(person · moment · expression) avoids cloned-sticker repetition — the face never varies.

Escape steps **who → spectrum → closed**, one level per press, returning focus to the pulse button.

## Selection model

`Moment.expressions?: Record<personId, expressionId>` — the data shape makes "one per viewer"
**structurally unbreakable** rather than policed. Select / replace / remove are one reducer action;
removing empties the map back to `undefined` so the presence line disappears cleanly. Tapping your
own expression removes it.

## Motion and restraint

~52 keyframes in the scoped CSS. **Nothing animates passively** — every animation class was traced
to a trigger: feed lenses are inert bitmaps (`pulse` and `land` both default false); surface
entries fire on mount of a surface the person just opened; previews require an active pointer or
focus; every event element is inside `EmotionEvent`, mounted only while performing; every timer is
tracked and cleared on unmount. **Reduced motion has four independent mechanisms**, the strongest
being that the whole choreography is simply **never mounted** — and the static per-expression
**pose survives**, so an expression still reads as a distinct posture.

The one documented exception is the LifeCounter's per-second `sb-roll` digit tick — the accepted
Life instrument, excluded by name from the R3.7/R3.8 "nothing running" checks.

## Restrictions (verified)

Health/Problem never mount either component. No like/react/vote/score vocabulary in `en.ts`. No
size-by-popularity — every feed lens is 22px, every Spectrum lens 40px, every who lens 26px.
Ownership is a scarce Boom-red rim segment, never a size or a count.

## Harness-only code — and whether it can leak

`?pulse=` (+ `?pulseMoment=`), `simulateExpressions`, `synthPerson`, the `pulse-sim` reducer action
and `?worldlight=` are review-only, behind the single `if (product) return;` gate, which precedes
every parameter read. **The gate is sound**; `pulse-sim` has one dispatch site behind it, and
`synthPerson` is additionally guarded by `id.startsWith("sim-")`.

Three honest caveats: it is a **runtime** gate, not a build-time exclusion, so the fixtures and ~90
fictional name fragments **ship in the `/world` bundle as dead code** (the codebase does use
`process.env.NODE_ENV` elsewhere, so the tool was available and not applied); the gate depends on
one prop at one call site and **the safe default is the permissive one** (`product = false`); and
`pulse-sim` overwrites a Moment's expression map wholesale — harmless in an in-memory prototype,
but it sits in the same reducer as `express`, distinguished only by a comment.

---

# 12. Human Pulse

Covered in §11. Restated as its own contract because the Bible will treat it separately:

> 100 people choosing Care is **ONE Care lens and "100 people"** — never 100 mascots and never a
> bigger one. ≤3 equal lenses, the viewer's first, on a 36px line that does not change height from
> 1 person to 1,000+. No per-expression counts in the feed. No compact numerals ("1K") were
> invented, because the locale architecture has no truthful compact formatter. Detail lives one
> deliberate step deeper, in the Spectrum.

---

# 13. People, Friends, Family

**Relationship states — five, one union** (`world/model.ts:27`):
`"friend" | "family" | "request-in" | "request-out" | "none"`, with one derived predicate
`connected(r) = r === "friend" || r === "family"`.

**Seed graph:** friend ×6, family ×2, request-in ×1 (Prakash — *deliberately* the only one, so that
surface reads unambiguously), request-out ×3, none ×3. The viewer has no entry; `relationshipOf`
defaults to `"none"`.

**Reducer:** `add → request-out`; `accept → friend`; `decline | cancel | remove → none`.

**The full transition table, and two things it reveals:**
1. **`accept` always produces `friend`, never `family`.** `family` can only exist as seed data, and
   is a one-way trapdoor — remove a family member and no path returns them to `family`.
2. **The reducer is unguarded** — there is no state-machine validation; any action applied to any
   state silently succeeds. No UI path exposes an invalid transition today.

**Per-state UI** (a full matrix is in `SOCIAL_BIBLE_COMPONENT_MAP.md`; summary):

| State | ProfileHero | PersonCard | People row | Search chip | Notification |
|---|---|---|---|---|---|
| none | **Add friend** | "Not connected" + Add friend | red **Add friend** | *(no chip)* | — |
| request-out | "Requested" + Cancel | "Request sent" + Cancel | "Requested" + Cancel | "Requested" | — |
| request-in | "Wants to connect" + **Accept** / Decline | "Asked to be your friend" + Accept / Decline | **Accept** / Decline, row promoted to a 48px tier | "Asked you" | **Accept** / Decline, resolves in place |
| friend | "Friends" + **Message** | "Friends" + Message + **Remove** | Message | "Friends" | → "Now friends" |
| family | "Family" + Message | "Family" + Message + Remove | Message | "Family" | (unreachable) |

**Only PersonCard offers Remove**, and it is **destructive with no confirmation**.

**People is a utility, not a tab** — three sections (Find someone / Requests split into "Wants to
connect" and "Waiting on them" / Your people), one scroll owner, a **steel** (not Boom) pending
indicator with no animation, and rows whose actions wrap under a 48px face on a phone. Every row
reads and writes the same `WorldProvider` map that Search, PersonCard and notifications use, so
accepting in one place is accepting everywhere — **within one route**.

**Follower / following / subscribe: verified absent.** An exhaustive grep of `src` returns exactly
one social-graph hit — the comment in `People.tsx:18` forbidding it. The graph is strictly
symmetric-mutual with a pending direction.

**Findings:**
- **E-9.** The notification outcome chip is binary: `rel === "friend" ? "Now friends" : "Declined"`
  — a row whose person is `family` or `request-out` would read *"Declined"*.
- **E-10.** `ProfileHero` dispatches against **`viewer.id`**, not `subject.id` (documented as
  intentional because the subject is always the profile owner). Correct today; wrong the moment a
  second profile route exists.
- **E-11.** The `1024px` mini-chat breakpoint is an imperative one-shot `matchMedia` read in **five
  places** with no shared constant and no resize reactivity: resize below 1024 with the dock open
  and the dock's CSS hides it while `world.mini` stays set — state and presentation disagree.

---

# 14. Search

**Four object types, fixed order: People · Moments · Photos · Places.**

| Type | Cap | Matches on | Result shape | Destination |
|---|---|---|---|---|
| People | 4 | **name only** | 28px identity + name + safe band + relationship chip (`data-sb-search-life`) | Person surface — no route change |
| Moments | 3 | text **or** place, non-media only | 22px ring + truncated words + `who · date · place` | `reveal` + `focusMoment` |
| Photos | 4 | text **or** place, media only | 4-column thumbnails + date caption | same |
| Places | 4 | substring of `PLACES` | pin + place + "N Moments" / "no Moments recorded" | **narrows the search**; does not navigate |

Matching is one shared helper (`matchPeople`), deliberately de-duplicated from two drifting
implementations. It is **name-substring only** — no place, email or phone matching, no fuzzy, no
diacritic folding, no ranking.

**Privacy:** only `onlyme` is withheld, and only from non-authors — exactly the feed rule, so
search is neither looser nor tighter than the feed. Place tallies are computed over the same
visible set, so only-me content never feeds a count. Life text is band-safe via `momentLifeFor`.

**Zero state:** one hint + **Recent** — and `RECENT_SEARCHES` is a hardcoded fixture that nothing
writes; there is no recent-search history. **No results:** the sentence + one **Clear**. No
suggestions, no trending.

**Phone:** a local sheet with Back · auto-focused field · Clear. Escape is intercepted on both
inputs so the native `type=search` clear does not fire first — *"Escape LEAVES search; it must not
first wipe the words."*

**Finding E-12.** Search does **not** exclude the acting viewer (`excludeId: undefined`), so typing
your own name returns your own row, which renders without a relationship chip and whose click is a
**dead action**. `People.tsx` correctly passes `me.id`. (AGENTS.md records the inclusion as
matching pre-existing behaviour — so this is a *recorded* inconsistency, not an unknown one.)

---

# 15. Notifications

**The type is thin:** `{ id, whoId, text, at, unread, momentId?, kind?: "request" }` — the `kind`
union is **`"request" | undefined`**. There is exactly one named kind; everything else is an
implicit "moment event" whose meaning is carried by **free-text English** in `text`.

**Fixtures:** 9 notifications, 4 unread; one request (Prakash, first). A harness `"many"` mode
synthesises 26 rows.

**Unread** is three derived things from one boolean: the bell dot (Boom red), the header count +
**Mark all read**, and a per-row filled/hollow dot plus 80% opacity. *The request row has no dot* —
only the opacity change.

**Rendering:** grouped by day on a left timeline rule. A request row leads with a 32px identity and
**Accept / Decline at 44px on a phone**, resolving **in place** into an outcome chip — the
notification is never removed and the list never re-sorts. A moment row adds the target Moment's
own date · place and a 36px thumbnail, and lands on **that** Moment (`reveal` + `focusMoment`,
panel closes, marks read).

**Expression activity produces no notifications** — verified: the `express` reducer never touches
`notifications`. It is a documented live seam, correctly not faked.

**Finding E-13.** The event text is untranslated English prose inside an otherwise fully localized
panel, and the day header (`"Today"`/`"Yesterday"`) and the coordinate date use the English
`dayLabel`/`formatDate` rather than `sbDate` — so the row reads half-translated in every non-English
locale. AGENTS.md records the event text as a live-contract carryover; the header and date are not
covered by that note.

---

# 16. Chat seam

**Not redesigned here.** What exists:

- **Five Message entry points**, all the same two-branch shape: `closePerson()`, then
  `matchMedia("(min-width: 1024px)")` ? `openMini` : `router.push("/chat?c=…")`.
- **One mini dock**, bottom-trailing, `hidden … lg:flex`, 320px, safe-area inset, focus to the
  input on open and back to `[data-sb-messages]` on close. Opening a conversation reads it and
  lazily creates an honest empty thread for a person who has none.
- **`/chat`** wears the same Brand, theme and `PersonIdentity` (28 / 26 / 24px, `label=""` so the
  ring is decorative beside the name). No ages, no bands, no place in the thread — bubbles and
  `HH:MM` only.
- **Messages dot is message-unread only**; the bell is notification-unread only; People's is a
  third, deliberately steel. **Never a combined total.** 3 seeded conversations, `unreadMessages` =
  3 — and the unread counts are **hand-set fixture numbers**, not derived (Asha's thread has three
  inbound messages after the viewer's last reply but declares `unread: 2`).

**What is documented but NOT built** — stated plainly because it is the live port's P1:

> *"The live Chat is currently a separately hosted app with its own login. **That is a deployment
> artifact, not the product.** The port must give Chat the shared SYSTEMBOOM session (SSO /
> trusted session handoff) so an authenticated person moves World → conversation with no second
> login … Do not invent client-side security; the prototype's identity is a mock."*
> — `people-chat-integration.md:54–60`

Also not built: offline/reconnect, typing indicators, read receipts, presence.

**Chat findings:** the `57px` magic header height (**R-1**); no `env(safe-area-inset-top)` on
`WorldShell` (**R-2**); the one-shot `?c=` read with no URL write-back (**R-3**); the unreachable
desktop Back branch (**R-4**); the **store reset on navigation** (**R-5**), which is every Message
tap on a phone; `ChatMessage.failed` declared and never used, so the harness failure toggle — which
`Moment` and `Composer` both honour — does nothing in chat, contradicting
`people-chat-integration.md:76–78`; and `/chat` being the only block of un-localised strings left
in the product, duplicating keys (`chat.you`, `chat.noMessagesYet`) that already exist and are used
by `MessagesPanel`.

---

# 17. i18n

**Architecture (accepted S1, frozen).** Eight locales — `en · es · it · nl · ru · hi · ne ·
zh-Hans` — default `en`, stable display order, never reordered by region. One catalog file per
locale; **319 keys × 8, verified key-complete** by count and key-set diff (0 missing, 0 extra),
matching `translation-status.md`.

**Namespaces in `en.ts`:** `composer.` 101 · `moments.` 39 · `expr.` 32 · `life.` 20 · `search.` 14
· `rel.` 14 · `conv.` 12 · `profile.` 10 · `people.` 10 · `account.` 10 · `notif.` 9 · `chat.` 9 ·
`kind.` 8 · `common.` 5 · `world.` 3 · `region.` 3 · `privacy.` 3 · `nav.` 3 · `media.` 3 ·
`lang.` 3 · `settings.` 2 · `relchip.` 2 · `person.` 2 · `error.` 2.

**Resolution priority:** profile → manual device choice → browser → region hint → English.
**"User choice always wins. Location is never proof of language."** No GPS, no precise
geolocation, no third-party lookup. Resolved **server-side** per request and rendered into
`<html lang dir>` — no wrong-language flash, no hydration mismatch, and **no `/[lang]` route**
(a conscious, recorded divergence from the Next.js recommendation).

**Language state:** `localStorage["sb-locale"]` **and** a cookie of the same name, plus
`sb-locale-region-handled`. Pre-login the control is the immersive `LanguageMenu` in Cosmos;
post-login it lives **inside the Account popover**, never as a top-bar icon.

**Determinism — the load-bearing decision.** Month names **ship in the product**
(`SHORT_MONTHS` / `LONG_MONTHS`), not read from `Intl`, and every `Intl` formatter is pinned to
`numberingSystem: "latn"`; times render 24-hour `HH:MM`. The reason is stated in code: a browser's
ICU diverges from the SSR runtime's (Chromium has no Nepali month data and silently renders
English while Node renders Nepali) — an uncorrected divergence is a hydration mismatch. Native
numerals are a future enhancement gated on ICU parity.

**Plurals:** pipe-separated catalog values indexed by CLDR order —
en/es/it/nl/hi/ne `one|other`, **ru `one|few|many`**, zh-Hans `other` only. 16 `tp(` call sites.

**Authored content is never translated and never sent to a translation service.** Enforced
structurally: fixture/user strings render raw; every chrome string goes through `t`/`tp`.

**Script support:** Devanagari ships as a bundled variable font with per-weight aliases — but the
`@font-face` declarations live inside the **scoped** `.sb-social` / `.sb-circle-page` style, so
Cosmos, the World shell and the identity gate fall back to whatever the device has. CJK gets a
dedicated `:lang(zh-Hans)` letter-spacing correction. **RTL is a seam, not a capability**: `dir`
and `script` are plumbed end-to-end, but there are **zero `rtl:` variants** in `src` and layout
uses physical-direction utilities throughout.

**QA state, honestly:** *"We do not claim native review."* All seven non-English catalogs are
**draft**. `expr.*` (all 18 names), the six Human-Pulse keys and four emotionally-nuanced names are
flagged for native review; `expr.care` was re-worded in `nl` and `ne` to stay distinct from the new
`expr.love`.

**Current untranslated / draft areas — verified against code, and visible in one capture (shot 50):**

| Area | Status | Evidence |
|---|---|---|
| The exact-age primitive `"34y 10m 12d"` | **English-only** — Latin `y/m/d` suffixes built by template literal | `view-model.ts:97`, `life.ts:48`, `circle/model.ts:268, 330` |
| The LifeCounter body ("years · months · days", "Your 13,000th day is in 265 days", "change unit", its ARIA labels, the sr-only mirror) | **English-only** (its *title* "My life in" **is** localized) | `LifeCounter.tsx:81, 107, 131, 152, 155, 159, 166–167, 173` |
| Notification event text (9 fixtures) + day header + coordinate date | **English-only** | `data.ts:683–691`; `Chrome.tsx:513, 541, 500, 544` |
| `/chat` micro-copy (`ConversationBody`, `MiniChat`, `ChatSurface`) | **English-only** | `Messages.tsx:128, 149, 154, 195–201`; `ChatSurface.tsx:66, 88, 107–108, 122–123` |
| 11 hardcoded `aria-label`s, incl. two landmark names on the main Social page | **English-only** | `SocialPreview.tsx:653, 676`; `Chrome.tsx:303`; `Moment.tsx:668`; `CircleModule.tsx:87`; `ProfileHero.tsx:121`; `ThemeToggle.tsx:15` |
| `PersonIdentity`'s default ring label | **English-only** | `PersonIdentity.tsx:65` |
| Composer/Moment `title` tooltips, `(you)`, `more`/`less`, `Show fewer`, `Life {band}` | **English-only** | enumerated in the component map |
| The awaiting-identity sentence | **English-only** | `PersonalDestination.tsx:34` |
| The whole identity-creation form | **English-only** | `CreateIdentityForm.tsx` |

**Finding E-14 (new).** `formatInt` in `social/life.ts:134` is
`(n) => n.toLocaleString("en-GB")` — hardcoded English grouping, used for **every large Life
number**, including the screen-reader string. A Russian viewer gets `12,735` where
`formatNumberLocale` would give `12 735`. The correct helper exists and is used elsewhere; this is
an un-migrated call path, not a design decision.

**Finding E-15.** Eight catalog keys ship in all 8 locales with **zero** references outside the
catalogs: `moments.writeNote`, `moments.notesN`, `moments.peopleInMoment`, `kind.photo`,
`kind.video`, `composer.whereWasThis`, `expr.summaryN`, `expr.whoTitle`. Two of them
(`writeNote`, `notesN`) are the retired note vocabulary AGENTS.md records as removed. Verified:
`kindLine` can only ever emit MEAL/ACTIVITY/PROJECT/MEETING/HEALTH/PROBLEM, so `kind.photo` and
`kind.video` are unreachable by construction.

---

# 18. Light / Dark

**Two complete palettes, one attribute.** `:root` (dark) and `[data-theme="light"]` in
`globals.css:10–59`. There is **no `prefers-color-scheme` block** — the attribute is the only
switch, default **dark**, set before paint by a boot script whose priority is `?theme=` → saved →
dark.

| Group | Token | Dark | Light |
|---|---|---|---|
| atmosphere | `--bg` | `#0a0d14` | `#e8ecf3` |
| | `--bg-atmosphere` | radial `#131b2e → #0a0d14` | radial `#f6f9fd → #e8ecf3` |
| surface | `--surface` / `--content` / `--content-raised` | `#10141e` / `#151a27` / `#1a2131` | `#f2f5fa` / `#fcfdff` / `#ffffff` |
| text | `--text` / `--muted` | `#eef2f8` / `#8e9bb0` | `#0f1520` / `#5a6880` |
| hairline | `--edge` / `--divider` | `rgba(142,155,176,.18)` / `.10` | `rgba(15,21,32,.14)` / `.07` |
| **Life materials** | `--steel` / `--ice` | `#7e93ae` / `#c9d8ea` | `#55708f` / `#33517a` |
| accent | `--boom` | `#d92a20` | **`#d92a20` — identical** |
| | `--boom-strong` | `#f04136` | `#b91f16` (darkens) |
| system | `--focus` | `#7db8ff` | `#1e66d0` |
| motion | `--m1…--m4` | 140 / 220 / 360 / 900ms | same |

**Scoped surfaces.** `.sb-surface` (World/Life) adds `--page --hair --rule --card --card-edge
--card-shadow --bar`. `.sb-social` is where the real theme difference lives: **dark is a
transparent sheet on the atmosphere; light is a real white sheet with a 24px radius and a shadow**
(`--sheet-radius: 0px` dark → `24px` light). The secondary ramp is deliberately darkened in light
(`--unit-grey #39454E` vs `#C9D8EA`, `--navy #3D678C` vs `#8FB3D9`) so the counter's coloured
digits clear AA on white.

**World Wall / cover.** On no cover or `onError`, a token-built two-stop gradient at 0.34 opacity
fading into `var(--card)` — *"a broken World Wall must degrade to the theme atmospheric field,
never a broken image."* The cover is shallower than a masthead (`h-[92px]` / `@2xl:h-[150px]`) and
**caps at 56px on a short/landscape viewport** so it can never consume the first screen.

**Boom red is meaningful state only** — 38 `var(--boom)` references across `src`: the single
primary action (Post / Accept / Add friend / Switch), the unread dot, the current-language check,
the **years** unit in the Life counter ("red = years, the unit that decides the band"), the cover
fallback's second stop, `::selection`, and the scarce ownership rim on a Boom Lens.
**Celebrate deliberately left Boom red in R3.3** to keep red the ownership colour.

**Visual verification:** shots 01–09 (light) against 10–28 (dark), plus 30/39 vs 31–38 at 360.
Light-mode expression material was specifically rebuilt in R3.6 (*"light mode was the weakest
surface"*) with warm-paper gradients rather than the dark theme washed out.

---

# 19. Responsive

**The system is Tailwind v4 container queries on stock values.** There is no `tailwind.config.*`
and `globals.css` defines no `--breakpoint-*`/`--container-*` overrides, so:

| Prefix | Value | Occurrences |
|---|---|---|
| `@2xl:` | 42rem = **672px** | 152 |
| `@5xl:` | 64rem = **1024px** | 9 |
| `@max-2xl:` | < 672px | 4 |
| `@max-5xl:` | < 1024px | 3 |

Two container roots only: `SocialPreview` and `CirclePreview`. Stated tiering:
**`<@2xl` phone · `@2xl–@5xl` tablet · `≥@5xl` desktop**. Plain media queries survive in five
places on purpose — the `1024px` chat handoff (JS), `max-height: 520px` for the short-viewport
hero, and the Cosmos/Earth surfaces.

**Per-surface behaviour** (cited class strings are in `SOCIAL_BIBLE_COMPONENT_MAP.md`):

| Surface | Phone 320–430 | Tablet 768–1024 | Desktop 1280+ |
|---|---|---|---|
| TopBar | one non-wrapping row, `gap-1 px-2`, 36px icons, brand word truncates **first**, Messages placeholder and ThemeToggle hidden | `gap-4 px-4`, 40px icons | same |
| Search | icon-only toggle; results full-bleed under the bar with Back · field · Clear | inline pill, 440px anchored results | same |
| ProfileHero | centred stack, cover 92px, instrument CSS-scaled to ~116px, contact + management behind one `<details>` | left-anchored asymmetric row, cover 150px, instrument 168px, capped `max-w-[760px]` | same; `max-height ≤ 520px` compacts everything behind the disclosure |
| Moments sheet | one column, `--bleed:16px` (media bleeds to the sheet edge) | `--bleed:0`, light sheet gains radius + shadow | two columns `[1fr 300px]`, sheet `order-1` |
| Sidebar | `@max-5xl:order-2` — **Moments come first everywhere below `@5xl`** (the S7 tablet fix: first Moment 1152 → 671px) | same | sticky 300px rail |
| Composer | full-height sheet `inset:0`, kind rail scrolls with a fade mask, media grid 4 cols | centred `min(560px,92%)` modal, chips wrap, media 6 cols | same |
| Panels (People/Messages/Notifications/Search) | full-width under the bar | anchored 360–440px | same |
| Mini chat | absent — Message goes to `/chat` | absent | one fixed 320px dock ≥1024px |

**Safe areas:** `env()` appears in **11 places** — the bar's top inset, five panel height formulas,
the Composer footer, the response composer, PersonCard, MiniChat and the LanguageMenu sheet (the
only one without a `0px` fallback). The repository is candid that these are **simulated in
evidence, not verified on a physical notched device**.

**Overflow:** `body { overflow-x: hidden }` is the global backstop. The documented
`overflow-hidden`-defeats-`sticky` fix **is present**: the frame is split into an outer
`@container` div and an inner plain div, and the clip now lives only around the sheet's padded
content — restoring real sticky behaviour for both the Life Cursor and the TopBar. One latent
instance of the same pattern remains on the hero `<section>` (needed for the cover's rounded
corners; nothing sticky lives inside it today).

**Widths captured by this audit:** 1440 (desktop) and the 360 design frame, plus 390×844 for the
two product routes. The repository's own `s7-device-mastery` suite covers
320/360/375/390/393/412/430 + landscape + tablet + 1280–1920; this audit does **not** restate those
measurements as re-verified.

---

# 20. Motion

**Inventory:** 10 keyframes in `globals.css`, ~52 in the scoped `SCOPED_CSS`. Full table in the
subsidiary reports. The four motion families (S6): transient surface 220ms `sb-surface-in`, scrim
220ms, reveal 180ms, target settle 900ms (background only, nothing moves), plus `.sb-press` 140ms.

| Interaction | Trigger | Duration | Purpose | Reduced motion | Passive? |
|---|---|---|---|---|---|
| Surface open (Search/People/Messages/Notifications) | user opens it | 220ms | arrival | collapsed | no |
| Scrim | with the surface | 220ms | ground | collapsed | no |
| Composer context reveal | choosing a kind / opening media | 180ms | disclosure | collapsed | no |
| Moment landing after post | `justPosted` | 220ms rise | "here it is" | collapsed; scroll becomes `auto` | no |
| Search/notification target settle | `focusMoment` | 900ms | "here is that exact thing" — background wash only | collapsed | no |
| Relationship state change | accept/add/cancel | 200ms, keyed remount | the state resolved | collapsed | no |
| Life Instrument entry | profile mount | 420–460ms + 320/260ms staggered | the instrument resolving | **durations collapse, delays do not** (F-Ring-1) | no |
| Expression preview | pointer/focus on a core | ≤140ms transitions + a 120ms chamber wake | anticipation | transitions end instantly; the parallax is scoped inside `no-preference` so there is **no offset at all** | no |
| Expression commit | tap/drag release | 502–882ms total, per-expression tempo | the emotional event | **never mounted** | no |
| Arrival from Cosmos | `sb-arrive` session flag | 480ms | continuity | disabled outright | no |
| Skeleton shimmer | a loading placeholder | 1.8s **infinite** | loading | frozen by iteration-count 1; `aria-hidden` | yes, while mounted |
| Post progress / "resolving" | while a post is in flight | 900ms / 700ms infinite | progress | — | yes, while mounted |
| **LifeCounter digit roll** | a `setInterval` — the only one in `src` outside cosmos/earth | 220ms per changed digit, 1 Hz | the live clock | only the *seconds* glyph stops; **the interval keeps running and values keep updating** — documented as intentional | **yes** |

**The global rule, verbatim:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**What escapes it:** `animation-delay`, `transition-delay` and WAAPI. The repository knows this and
guards the delay for exactly two keyframes (`sb-tile-in`, `sb-rise-in`) plus the perspective
switch, and gates its single `el.animate()` call on `matchMedia`. **The unguarded case is
`sb-band-settle`'s inline 160ms/380ms delays on an ungated `animateEntry`** (F-Ring-1).

**No RAF loop re-schedules itself.** Ten `requestAnimationFrame` sites in Social/World, all
single-frame focus or measure deferrals, plus one self-cancelling scroll throttle in `LifeCursor`.
`MotionConfig reducedMotion="user"` is set at all four Motion-for-React mount points.

**Dead motion:** `sb-drift` (zero references) and `sb-beacon-pulse` (no class binds it in `src`).

---

# 21. Accessibility

**Semantics.** `<h1>`×3, `<h2>`×8, `<h3>`×2; **no `h4`–`h6`**. Landmarks: `<main>`×5, `<header>`×8,
`<nav>`×7, `<section>`×14, `<aside>`×3. Roles: `group` 12 · `dialog` 10 · `status` 5 ·
`listbox` 5 · `radiogroup` 4 · `menu` 4.

**Gaps found:**
- **A-1.** `role="list"` appears **zero** times against 19 `<ul>` and 23 `<li>` — so list semantics
  are lost wherever Tailwind strips `list-style` (Safari/VoiceOver). Notification groups, search
  groups and the expression rails are div-based (`role="radiogroup"` / `role="group"`) by design.
- **A-2.** The Moments sheet is `<section aria-label="Moments">` with **no heading of its own**,
  and individual Moments are not `<article>`s — the outline jumps h1 → h3 with no h2 in the feed
  column.
- **A-3.** The top bar is a plain `<div>`, not `<header>`/`<nav>`, so the six utilities are not in a
  navigation landmark.

**Keyboard.** One focus-trap implementation exists (`useFocusTrap.ts`) and it has **two users**:
the identity gate and the **Composer** (`Composer.tsx:161`, with `initial: textRef`, an Escape
handler that closes an open picker first, and `returnTo="[data-sb-open-composer]"`). It owns
Escape in the capture phase with `stopImmediatePropagation` so the Cosmos Escape ladder never sees
it, and falls back to `[data-sb-gate-opener]` on return. The expression radiogroup is
a full roving-tabindex implementation (Arrow Left/Right wrap, Up/Down by column count, Home/End),
and the LifeCounter unit control handles Left/Right.

**The Escape ladder is one layer per press by design:** `TransientSurface` binds Escape in the
**bubble** phase, `PersonCard` and the expression surfaces bind it in **capture** with
`stopPropagation`, so a layer above closes first.

**Focus discipline:** focus enters a transient surface's **container**, not its first control
(*"a phone must not pop the keyboard for a list"*); return is conditional — skipped if anything
above already claimed focus, which is how a PersonCard opened from a People row keeps focus.
Openers are declared per surface (`returnTo="[data-sb-bell]"` etc.).

**Gap A-4.** Four elements declare `role="dialog" aria-modal="true"`. **Two of them trap focus**
(the identity gate and the Composer, both via `useFocusTrap`). **Two do not** — the **Moment
conversation surface** (`Moment.tsx:554`) and **`PersonCard`** (`PersonCard.tsx:82`): each focuses
its container (or its first control) and handles Escape in the capture phase, but neither traps Tab
nor marks the background `inert`, so Tab can walk out into the page behind while the element claims
modality. `inert` has exactly **one** real use in `src` — the Cosmos subtree while the identity
gate is open (`CosmosEntry.tsx:55`). The identity gate is the only fully-hardened modal.

**Life privacy in ARIA — clean.** A grep for `exact` across the Social components found **no** path
by which a non-owner reaches `life.exact`. Every ARIA consumer picks conditionally
(`owner ? life.exact : t("life.circleBand", …)`). The one blemish is the hardcoded English default
label (**P-4**).

**Live regions:** four (`LifeCounter`, the expression status, `CircleDial`, `IdentityGate`).
`LifeCounter.tsx:173` additionally carries a **non-live `sr-only` mirror that changes every
second** — a chattiness risk for a reader set to announce all changes.

**Forms.** `CreateIdentityForm` is the best case (explicit `htmlFor`/`id`, `aria-invalid`,
`aria-describedby` switching between error and hint) — but **A-5**: with `noValidate` suppressing
native announcement, its error paragraphs carry **no `role="alert"` and are not in a live region**,
so a screen-reader user submitting an invalid form hears nothing. The Composer's textarea is
described but **unlabelled** — a placeholder does label duty.

**Contrast** is machine-asserted: 19 token pairings per theme sampled by selector, alpha-blended
against the resolved ancestor background, with the large-text exemption applied; shipped artefact
`contrast.json` — **38 rows, 0 failures**, minimum 4.80 (light) and 3.77 (dark, passing under the
large-text threshold). **Caveat A-6:** the suite prints "not found for contrast: …" for a missing
selector **without failing**, so a pairing that stops matching silently drops out.

**Touch targets.** `min-h-11` (44px) appears at 17 sites across 11 files — applied to **primary**
actions on phones, relaxing to 36–40px at `@2xl`. **Not universal**: the note ⋯ button is 28px, the
Reply control 28px, the LifeCounter unit control 32px, the top-bar utilities 36px on a phone, the
composer entry bar 36px.

**Zoom:** 200% is verified by the repository's own suite as WCAG-reflow equivalence (a 320px CSS
viewport), explicitly **not** body-zoom inside a fixed frame — and the viewport meta never disables
user scaling.

---

# 22. Tests

Full inventory: `SOCIAL_BIBLE_TEST_MAP.md`. Headlines:

- **64 scripts, 13,786 lines.** 33 are real assertion suites; 4 are asset builders that **write
  into `public/`**; 17 are evidence-capture scripts; 12 are legacy (Cosmos/Earth/gate era).
- **puppeteer-core against the user's system Chrome**, `headless:"new"`, `--use-angle=metal`.
- **No suite starts the dev server**; all assume `localhost:3210`.
- **No runner, no CI, no manifest.** Each suite re-declares the same four-line `ok()` harness.
- **Every route except `/chat` is exercised.**
- **Privacy is asserted at four independent levels**, with positive controls beside every negative.
- **The "Accepted tests and evidence" block in AGENTS.md is stale** — it stops at Phase 4/5 and
  misses 18 live suites (which are each recorded in their own phase sections).
- **24 files exist that AGENTS.md never names**, including `identity-model.js`, the **only**
  model-level assertion of the birth-storage contract.
- Eleven suite-level weaknesses recorded (T-1 … T-11), including one permanently-passing assertion
  in `circle.js` that is not recorded anywhere.

---

# 23. Documentation

**39 documents, 5,650 lines, all read.** Status tally:
**CURRENT 15 · MIXED 12 · STALE 8 · SUPERSEDED 3** (+1 current-with-a-gap).

| Class | Documents |
|---|---|
| **CURRENT** | `systemboom-navigation-map.md`, `circle-of-life-spec.md`, `people-chat-integration.md`, `s5-s6-discovery-motion.md`, `s7-device-responsive-contracts.md`, `social-2030-future-seams.md`, `i18n-live-contract.md`, `expression-render-briefs.md`, `quick-six-render-briefs.md`, `composer-states.md`, `systemboom-application-architecture.md`, `systemboom-navigation-final.md`, `i18n/architecture.md`, `i18n/locale-resolution.md`, `i18n/systemboom-glossary.md`, `fixtures/photo-sources.md`, `open-issues.md`, `earth-explorer.md`, `moment-conversation-model.md` |
| **MIXED** (self-contradictory or partly stale) | `README-for-developer.md`, `social-visual-spec.md`, `social-interaction-spec.md`, `social-content-rules.md`, `social-api-contract.md`, `social-visual-qa.md`, `social-shell-spec.md`, `person-life-identity.md`, `systemboom-expression-language.md`, `human-pulse-contract.md`, `circle-of-life.md`, `translation-status.md`, `phase-5-candidates.md`, `social-feature-parity.md` |
| **STALE** | `social-reference-index.md`, `social-wireframes.md`, `my-world-product-completeness.md` (as a matrix it predates the whole expression system) |
| **SUPERSEDED** | `moment-expression-contract.md` (unmarked — and actively vouched for as "still current" by another live doc), `expression-asset-contract.md` (banner-patched, body untouched), `SYSTEMBOOM-HANDOFF-BRIEF.md` (a status document frozen at ~2026-09-10) |

**Three documentation-health observations the Bible should inherit:**

1. **Two accretion patterns coexist, and only one works.** `quick-six-render-briefs.md` appends
   dated notes that say what they do and do not close — this works.
   `systemboom-expression-language.md` appends new sections *beneath unmarked superseded ones* —
   this does not. `expression-asset-contract.md` patches only the banner and leaves a body full of
   hard numbers — this is the worst pattern, because the body reads as authoritative.
2. **`docs/open-issues.md` is effectively abandoned.** One entry, from 2026-09-10 (a token-drift
   item deliberately parked to Phase 9). The three live blockers AGENTS.md tracks —
   **ART ASSET BLOCKED**, the **FRIENDS PRIVACY BACKEND CONTRACT**, and the English-only
   notification event text — are in AGENTS.md and in individual handover docs but **not in the
   repository's designated issue register**, across nine subsequent accepted rounds.
3. **`SYSTEMBOOM-HANDOFF-BRIEF.md` is the file most likely to mislead a new reader**, because it
   is written for the owner's PM/CTO counterpart and tells them to read it fully before doing
   anything. Its §6 is titled *"What was just sent (the current Claude Code task)"* and describes a
   task completed six days before this audit; it says Phase 4 is "in progress", Phase 5 "not
   started", `/world` a "shell placeholder", Chat/notifications "not started", and it contains the
   corpus's clearest single factual error (the milliseconds counter face). **Its §3 "Binding
   decisions (all still in force)" remains genuinely load-bearing** — which is exactly why the
   document cannot simply be deleted.

---

# 24. Maturity matrix

Classes as defined in `SOCIAL_BIBLE_DECISION_EVIDENCE.md`. **FROZEN is asserted only where
repository documentation or a recorded owner acceptance explicitly supports it.**

| Area | Class | Basis |
|---|---|---|
| One-product model · routes · Earth-as-a-state · `/social` redirect | **FROZEN** | AGENTS.md "FINAL, ACCEPTED AND FROZEN"; `destinations.ts` |
| The privacy view model (owner/other shapes, absent-not-hidden) | **FROZEN** | AGENTS.md; `social-api-contract.md` §C; `social-visual-spec.md` §10 |
| Birth truth (never manufacture a time; the honesty rule) | **FROZEN** | binding decisions "all still in force"; `birth.ts`; `identity-model.js` |
| Ten 15-year bands / 150 years | **FROZEN** | authorised exception + every document |
| No milliseconds face (seven unit stops) | **FROZEN** | six documents + "DO NOT IMPLEMENT" |
| No destination menu; the Brand is the whole of navigation | **FROZEN** | `systemboom-navigation-final.md` — **but four documents still show a nav row** |
| No followers / following / ranking / PYMK | **FROZEN** | `People.tsx`; verified absent in `src` |
| Story/presence/verification/friendship rings | **FROZEN** (forbidden) | `person-life-identity.md` §11 |
| `data-sb-*` are test hooks; `aria-*` is design | **FROZEN** | `README-for-developer.md` §I |
| i18n architecture (8 locales, no route change, shipped months, latn) | **FROZEN** | AGENTS.md S1; `architecture.md` |
| One theme store, default dark | **FROZEN** | `social-shell-spec.md` §90–92 |
| Moments / Almanac / chronology / temporal honesty | **ACCEPTED** | tested + evidenced |
| Composer (memory-first) | **ACCEPTED** | S5/S6 — **four documents still say readout-first** |
| Person Identity (one component, photo→initials) | **ACCEPTED** | `person-life-identity.md` |
| Life Ring at every scale + the instrument treatment | **ACCEPTED** | `my-world-2030.js` |
| Responses (Respond writes; one reply level; adaptive depth) | **ACCEPTED** | `moment-conversation-model.md` — **six documents still specify the retired tap** |
| Expressions (18, single-active, Horizon, Atlas) | **ACCEPTED** | R3.8/R3.9 suites |
| Human Pulse · Spectrum · Who expressed | **ACCEPTED** | `human-pulse-contract.md` |
| People / relationships / Search / Notifications | **ACCEPTED** | S4/S5 suites |
| Device recomposition (S7) | **ACCEPTED** | `s7-device-responsive-contracts.md` |
| Motion system + reduced motion | **ACCEPTED** | S6 + R3.x |
| Contrast (AA, machine-asserted) | **ACCEPTED** | `contrast.json` |
| Chat *inside* the prototype | **ACCEPTED** | `people-chat-integration.md` |
| **Chat shared session / SSO** | **OPEN (P1)** | stated, not built |
| **Server-side identity guarding of `/world` `/life` `/chat`** | **OPEN (P1)** | stated, not built |
| **`friends` privacy contract** | **OPEN** | flagged in code; and applied asymmetrically (**C-14**) |
| **Relationship state machine vs the backend** | **OPEN** | "must be verified against the backend" |
| **Person-level block / report** | **OPEN (P1 launch-safety)** | `my-world-product-completeness.md` |
| **Real unread sources** | **OPEN (P1)** | same |
| **Per-expression facial art** | **OPEN — ART ASSET BLOCKED** | R3.2 §77, re-verified R3.9 |
| Extended-twelve core orbs | **OPEN (provisional)** | stated in the build script |
| Neutral mascot render | **OPEN (wanted)** | `quick-six-render-briefs.md` |
| Native numerals | **FUTURE** (gated on ICU parity) | AGENTS.md S1 |
| RTL | **FUTURE** (seam only) | `config.ts` |
| Ancestors | **FUTURE** | not in `destinations.ts` |
| "View in Life" | **FUTURE** (visibly disabled today) | `Moment.tsx` |
| Moment provenance · Cosmos Knowledge · cited AI research · Life retrieval | **FUTURE** | `social-2030-future-seams.md` |
| `Note.expression` sticker-scale seam | **FUTURE** (documented, not faked) | R2 §38 |
| Native haptics | **FUTURE** (no web fake) | R3.9 |
| World-Wall atmosphere token | **FUTURE (seam)** | `SocialPreview.tsx:203–215` |
| **Celestial Resonance** | **FUTURE / RESEARCH — absent from this repository** | grep: zero occurrences in `src`, `docs`, `prototype-tests` or AGENTS.md |
| Composer body order · Respond semantics · reaction-set permission · expression set size · `friends` density · nav row · Health/Problem conversation · Boom Lens surface · group-vs-family taxonomy | **UNKNOWN / NEEDS OWNER REVIEW** | the sources of record disagree — see the contradictions register |

---

# 25. Contradictions

**24 registered**, in `SOCIAL_BIBLE_CONTRADICTIONS.md`, with columns
ID · Topic · Source A · Source B · Current code · Risk · Recommended owner question.

**The five HIGH-risk rows, all inside the frozen accepted Social reference:**

| ID | In one line |
|---|---|
| **C-1** | Composer body order — memory-first ships; four documents, including a binding drawing and a "Do not change" list, still say readout-first. |
| **C-2** | Respond — the verb writes; six documents, **including the API contract**, still specify the retired anonymous tap as `respond { count, byViewer }`. |
| **C-3** | Reaction sets — four live documents forbid the expression language that ships. |
| **C-4** | Expression set size — six vs twelve vs eighteen across live documents, with conflicting asset budgets (~1.1MB vs ~1.7MB; `sm` 64 vs 72px). |
| **C-5 / C-14** | `friends` privacy — one document states both the old and the new rule unmarked, a third contradicts both; and the caution that governs the ring is **not** applied to the feed or search. |

Two rows are **new findings by this audit**, not previously recorded anywhere:
**C-14** (`friends` unenforced in the feed and search) and **C-15** (Health/Problem carry a working
response composer although the accepted contract says "no conversation").

---

# 26. Open work and technical debt

Separated, per the brief.

## 26.1 PRODUCT OPEN WORK (owner or backend decisions)

| # | Item | Where it is recorded |
|---|---|---|
| PO-1 | **The per-expression facial renders** — eighteen expressions, one face. Six carry a composited emotion core; twelve fall back to the neutral vessel. Briefs exist for all of them; the six quick faces + a neutral pose are the stated priority. | AGENTS.md R3.2 §77 / R3.9 §2; `quick-six-render-briefs.md`, `expression-render-briefs.md` |
| PO-2 | **The `friends` privacy contract** — does a friend/family relationship gate a `privacy:"friends"` Moment? Unanswered, and currently answered *differently* by the ring than by the feed and search. | `view-model.ts:138–150`; **C-14** |
| PO-3 | **The relationship state machine vs the backend** — including whether `accept` can ever yield `family`, and what un-friending means. | `people-chat-integration.md` §2 |
| PO-4 | **Chat shared session (SSO)** — the P1 boundary. | `people-chat-integration.md` §5 |
| PO-5 | **Server-side identity guarding** of `/world` `/life` `/chat`. | `my-world-product-completeness.md` |
| PO-6 | **Person-level block / report** — classified a launch-safety P1 if the live product lacks it. | same |
| PO-7 | **Real unread sources** for messages and notifications (both are hand-set fixtures today). | same |
| PO-8 | **The notification event grammar** — `kind` is `"request" \| undefined` and meaning lives in free English text. The live event contract owns this. | `data.ts:96–105`; AGENTS.md S5/S6 carryover |
| PO-9 | **Life localization** — the exact-age primitive and the LifeCounter body are English-only by decision, deferred to a Life-localization phase. | AGENTS.md S2/S3 carryovers |
| PO-10 | **Native numerals** — gated on SSR/client ICU parity. | AGENTS.md S1 |
| PO-11 | **"View in Life"** — a visibly disabled affordance with two labels. | `Moment.tsx`; **C-12** |
| PO-12 | **The extended twelve's core orbs are provisional**, and the neutral control still wants its own calm render. | `_build-emotion-horizon.js:5–6`; `quick-six-render-briefs.md` |
| PO-13 | **The World-Wall atmosphere token** does not exist; World Light ships on the theme material as a stated fallback. | `SocialPreview.tsx:203–215` |
| PO-14 | **Token convergence (Phase 9)** — `#d92a20`/`#f04136` literals instead of `--boom`, `#e9eff8` vs `--text`, canvas `#04070e` vs `--bg`. Deliberately parked. | `docs/open-issues.md` |

## 26.2 ENGINEERING DEBT

| # | Item | Evidence |
|---|---|---|
| ED-1 | **Zero TODO/FIXME/XXX/HACK markers in all of `src`.** Unfinished work is recorded in prose and in AGENTS.md instead. Excellent discipline in one sense; it also means a grep-based audit finds nothing, and nothing surfaces in an IDE. | verified sweep |
| ED-2 | **The edit path destroys a Moment's clock time** and never updates `atPrecision`; `initialTime()` is dead by construction. | `Composer.tsx:220, 596–598` |
| ED-3 | **A Health Moment with all required fields but no prose cannot be posted.** | `Composer.tsx:174–178` |
| ED-4 | **The responses affordance is not gated by `quiet`.** | `Moment.tsx:367–378` |
| ED-5 | **The focused phone conversation has no Reply** (`onReply={() => {}}`). | `Moment.tsx:595, 599` |
| ED-6 | **A stale expression id in the fixtures** (`"wonder"`), silently dropped — `m-panorama` shows 2 of 3 seeded expressions. | `data.ts:578` |
| ED-7 | **Search does not exclude the acting viewer**; clicking your own row is a dead action. | `Chrome.tsx:256, 356–362` |
| ED-8 | **The notification outcome chip mislabels non-friend outcomes as "Declined".** | `Chrome.tsx:528` |
| ED-9 | **`/world` ↔ `/chat` resets the store** — every phone Message tap loses accepted requests, sent messages and read state. | `store.tsx:5`; `ChatSurface.tsx:30–36` |
| ED-10 | **Five hardcoded `1024px` `matchMedia` reads** with no shared constant and no resize reactivity. | 5 files |
| ED-11 | **`h-[calc(100dvh-57px)]`** — an undeclared header height, where `--sb-bar-h` already solves the problem elsewhere. | `ChatSurface.tsx:63` |
| ED-12 | **`ChatMessage.failed` declared and never used**, so the harness failure toggle silently does nothing in chat. | `world/model.ts:58` |
| ED-13 | **Two reducer cases with no dispatcher** (`respond`, `noteRespond`). | `store.tsx:140–153, 172–176` |
| ED-14 | **`lifePosition()` is exported, unused, and computes `fraction`/`totalDays` for any person.** | `life.ts:32–49` |
| ED-15 | **Eight dead catalog keys × 8 locales**, two of them the retired note vocabulary. | `catalogs/*.ts` |
| ED-16 | **`formatInt` hardcodes `en-GB`** on five Life call sites including the screen-reader string. | `life.ts:134` |
| ED-17 | **11 hardcoded English `aria-label`s**, including two landmark names on the main Social page. | enumerated in §17 |
| ED-18 | **`sb-band-settle` delays escape the reduced-motion rule** on an ungated `animateEntry`. | `LifeRing.tsx:168, 201`; `ProfileHero.tsx:186, 189` |
| ED-19 | **`aria-modal="true"` without a focus trap or `inert`** on the **Moment conversation surface** and **`PersonCard`** (the Composer and the identity gate *do* trap, via `useFocusTrap`). | `Moment.tsx:554`; `PersonCard.tsx:82`; cf. `Composer.tsx:161` |
| ED-20 | **No `role="list"` anywhere**; no h2 in the feed column; the top bar is not a landmark. | §21 |
| ED-21 | **Form errors are not announced** (`noValidate` + no `role="alert"`). | `CreateIdentityForm.tsx:132–134, 155–157` |
| ED-22 | **Superseded R3.1 deck CSS still resident**; `sb-drift` and `sb-beacon-pulse` unbound; `.sb-seat-art` has no JSX user. | `SocialPreview.tsx:159–200`; `globals.css:268, 283` |
| ED-23 | **Twelve glyph path strings hand-duplicated** between `expressions.tsx` and `_build-emotion-horizon.js`; and a `grid-cols-5` / `cols = 5` pair that must be kept in sync by hand. | both files |
| ED-24 | **Harness fixtures ship in the `/world` bundle** as dead code (no build-time exclusion), and `product` defaults to the permissive value. | `SocialPreview.tsx:391, 448` |
| ED-25 | **Prototype-only fabrications shipped as fixtures**: a hardcoded link title in every new composer, a fabricated video poster and link preview, `RECENT_SEARCHES` that nothing writes, a fabricated copy-link host, a `Math.random()` id generator (non-deterministic for tests), and a **module-body `throw`** asserting a fixture name is exactly 40 characters. | `Composer.tsx:148, 207–210`; `data.ts:150, 694`; `Moment.tsx:348`; `store.tsx:236` |
| ED-26 | **The test suites are machine-bound and unrunnable elsewhere**; seven capture scripts point at an expired temp directory; `sharp` is undeclared. | `SOCIAL_BIBLE_TEST_MAP.md` T-1…T-4 |
| ED-27 | **One permanently-passing assertion** (`ok(… \|\| true, …)`) in `circle.js`, unrecorded. | `circle.js` |
| ED-28 | **The dev-mode `?theme=` override reaches the product route** — the pre-paint boot script in `layout.tsx:30` honours `?theme=` on every route, including `/world`. Harmless, but it is a review affordance outside the `product` gate. | `app/layout.tsx:30` |

---

# 27. Risks

Ranked by what could actually go wrong during the live port or the Bible's authorship.

| # | Risk | Why it matters | Mitigation already in the repository |
|---|---|---|---|
| **R-A** | **A developer ships the retired Respond tap as a like counter**, because the API contract still specifies it. | It is the exact thing the product's own model forbids by name, and it would be shipped from the document literally called "the API contract". | `moment-conversation-model.md:114–115` says do not — but it is not the document a developer implementing an API reads. |
| **R-B** | **The `friends` privacy value ships unenforced.** | Measured, not inferred: at `?viewer=visitor` the feed renders all six `friends`-privacy fixtures. If the live backend mirrors the prototype, that is a real disclosure. | The ring's own filter is deliberately cautious and flagged in code; the caution simply was not propagated to the feed or search. |
| **R-C** | **A developer ships a navigation row**, because the binding wireframe draws one and the responsive table specifies one. | It would reinstate exactly the grammar the product spent two rounds removing. | Banned in seven places — three of the files ban it and then show it. |
| **R-D** | **The Bible inherits the documentation drift.** | The Bible is meant to be permanent. If it is built from `docs/` rather than from code + tests + evidence, it will canonise the superseded readings. | AGENTS.md is accurate and complete; the code is the truth; the suites are the proof. |
| **R-E** | **The expression art never lands**, and the twelve extended expressions ship as provisional orbs. | The language is the product's signature interaction; twelve of eighteen currently carry no bespoke art at all. | Briefs are complete, the slot design is a file drop plus one line in `RENDERED`, and partial delivery is supported. |
| **R-F** | **`/chat` is ported from an untested surface.** | No suite loads the route; the store reset on phone navigation is a real, user-visible data loss in the prototype and a design question for the live app. | The contract document is clear about the SSO boundary; the rest is unmeasured. |
| **R-G** | **Nobody can re-run the proof.** | Every count is prose; the suites only run on one machine; there is no CI and no manifest. A future maintainer cannot verify the 180/132/102/… figures. | The suites themselves are thorough and well-written — the packaging is the gap. |
| **R-H** | **A live-clock literal decays into a false assertion.** | Already happened twice (the `12,732` in a test, the `12,731` frozen into `social-shell-spec.md:29`). | One was fixed and recorded; the other is still in prose. |
| **R-I** | **`SYSTEMBOOM-HANDOFF-BRIEF.md` misleads a new owner-side reader.** | It is addressed to exactly that reader and says Phase 4 is in progress, Phase 5 not started, Chat not started, and that the counter has a milliseconds face. | Its §3 binding decisions are still correct — the document needs a status header, not deletion. |
| **R-J** | **The permissive harness default.** | A third route rendering `<SocialPreview />` without `product` re-opens every review parameter, including one that overwrites a Moment's expression map. | The gate itself is sound and correctly placed. |

---

# 28. Evidence index

## 28.1 What was inspected

| Category | Count | Notes |
|---|---|---|
| Source files in `src/` | **121** (119 `.ts`/`.tsx`/`.css`), **24,602 lines** | Social 6,395 · Circle 1,363 · World 1,080 · i18n 3,269 · shell 316 · the rest Cosmos/Earth/lab |
| Documents in `docs/` | **39**, 5,650 lines | all read in full |
| Scripts in `prototype-tests/` | **64**, 13,786 lines | all catalogued; none executed |
| Root instruction / config files | **9** | incl. `AGENTS.md` (1,044 lines) and `CLAUDE.md` (which is one line: `@AGENTS.md`) |
| `public/` assets | **146** enumerated | incl. 77 expression WebP files |
| `prototype-evidence/` directories | **28** listed | gitignored, local-only |
| `references/` | 3 directories | `brand/` is kept in git because the asset pipeline reads the mascot from it |
| **Total repository files inspected or enumerated** | **≈ 387** | |

## 28.2 Live evidence captured by this audit

**51 screenshots** under `references/social-bible-audit/evidence/`, indexed in
`SOCIAL_BIBLE_SCREENSHOT_INDEX.md` with two machine-readable manifests. Desktop light (9), desktop
dark (19), mobile 360 (10), product routes (10), locales (3).

**Capture honesty, restated here because it matters more than the images:** the application was run
unmodified from its own source; only pre-existing review query parameters were used; the data is
the repository's own documented fixtures with **nothing fabricated for a screenshot**; the run was
headless Chromium in the audit sandbox, not on the owner's Mac; the Next.js dev indicator appears
in every frame; the Cosmos shot is the documented no-WebGL fallback; and no physical-device, safe
area, notch or virtual-keyboard behaviour is claimed.

## 28.3 Pre-existing evidence relied on but NOT re-verified

`prototype-evidence/**` (28 directories), `contrast.json` (38 rows, 0 failures), the S7 device
matrix and `layout-metrics.md`, the R2/R3 motion frame strips, and the no-marks / no-label art
boards. These are cited where relevant and are **never restated as re-measured by this audit**.
Two evidence sets are marked SUPERSEDED by AGENTS.md — `prototype-evidence/one-application/**` and
`prototype-evidence/final-systemboom-app/**` (Compass-era) — and must not be implemented from.

## 28.4 Traceability convention used throughout

Every material claim in these seven documents cites `path:line` or `path` + `symbol` — for example
`social/view-model.ts` `ringViewFor()`, not "privacy is handled somewhere". Claims that could not
be traced to a file are stated as questions, not findings.
