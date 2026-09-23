# PLACE · LIFE · COSMOS — SEAM AUDIT (§30–§33)

- **Place: MISSING.**
- **Life: PARTIAL.** Life → Moment exists; Moment → Life is disconnected.
- **Cosmos: PARTIAL.** Entry and brand are complete; Earth is not connected.

## 1. Place (§30)

**Does tapping a Moment's Place do anything? No.**
- It is a plain `<span>` in the readout (`Moment.tsx:199-204`, phones `:221-227`), in the phone
  conversation header, in the Life Cursor, in the Hero home and on the PersonCard.
- The data is free text (`place?: string`, `data.ts:78`; the contract makes it text,
  `social-api-contract.md:95`).
- **Search is the only Place behaviour.**
  - A static Places list (`data.ts:334-349`) with an exact-string tally.
  - Choosing a place re-runs the search with the place as the query.
  - "Bhaktapur" and "Kathmandu Durbar Square" are recorded on Moments but can never appear.
  - "Patan Durbar Square" and "पाटन दरबार स्क्वायर" count separately.
- **Earth** is a Cosmos state entered by `/?to=earth` with no coordinate. `EARTH_INTENT` has no
  consumer.

**Minimal seam (define first, build later):**
1. **Step 1 — no data change, no new surface (recommended next).** Tapping the place opens
   Search, narrowed to that place. Reuse the existing narrowing (`Chrome.tsx:424`), and derive
   Places from viewer-visible Moment places instead of the static list. This connects
   Moment → Moments here → people here using only what exists.
2. **Step 2 — additive data (D-16).**
   - `place: { label; placeId?; lat?; lng?; precision? }`.
   - `label` stays the rendered, never-translated text.
   - `placeId` comes from the Places API Earth already uses, and from upload metadata.
3. **Step 3 — a transient Place surface** (the S5 family), via `openPlace(key, opener)` on
   `WorldProvider`, shaped like `openPerson`. It shows:
   - the label;
   - viewer-visible Moments there (each lands through `reveal` + `focusMoment`);
   - people who recorded there (identity-only, band only);
   - a quiet "See on Earth" → `/?to=earth&…`. This extends frozen `CosmosExperience.tsx:182`,
     so it needs owner authorisation.
4. **Privacy.**
   - Aggregate only over the server-authorised set.
   - Exclude only-me, Health and Problem Moments before counting.
   - Never show per-person counts per place: routines are sensitive.

## 2. Life / Circle two-way (§32)

| Direction | Status | Evidence |
|---|---|---|
| Moment → Circle day ("View in Life") | **DISCONNECTED** for everyone | Disabled pill hidden below @2xl, plus disabled ⋯ items (`Moment.tsx:307-310, 344, 351`). **The target already works for the owner:** `/life` reads `?c=day:<date>` on the product route (`CirclePreview.tsx:94`) and `coordForDate` exists (`circle/model.ts:186-189`). For own Moments this is one `Link`. |
| Moment → Life on *another person's* Moment | **MISSING** | `/life` is always the signed-in person's own Circle. The spec's "visitors resolve to LIFE" has no subject-addressed target (D-15) |
| Circle day → Moment | **COMPLETE** (owner) | DayAlmanac renders the accepted `MomentEntry` with kind filters, empty state and "Record a moment on this day" (`DayAlmanac.tsx:18-71`). Visitors never reach day level (by design) |
| Life → the Moment's place in My World | **MISSING** | no permalink; `focusMoment` works only inside `/world` |
| One Moment source | **DISCONNECTED** (prototype) | `/life` and `/world` hold separate stores, so a Moment recorded from the Almanac does not appear in My World (PL-30) |

**Visitor privacy on Life links: structurally sound.**
- A non-owner is forced to level 0, URL sync is off, and the Circle is band-only with no counts.
- The product `/life` is never a visitor.
- Server refusal of deep coordinates for non-owners is an unbuilt P1.

## 3. Pre-birth rule (§33) — do Social links respect it?

The rule: time before a person's birth belongs to the Ancestor context. Only **Jump to date**
respects it (`CircleView.tsx:128-130`). Two paths break it.

- **BROKEN — `/life?c=` deep links are unbounded** (`model.ts:176-184`). For Maya (born
  1991-11-04), `?c=day:1983-02-06` produces:
  - age −9 and band −1, with an undefined breadcrumb label;
  - pre-birth days shown as "lived";
  - a negative exact age.
- **BROKEN — the Composer accepts pre-birth dates.** It checks only "future", and `DateField`
  has no `min`. The result is a negative exact age for the owner, or an undefined band for others.
- **PARTIAL — a future day reached by URL** still offers "Record a moment on this day", which the
  Composer then refuses. A dead end, not a crash.
- There is no Ancestor destination. `architecture.md:139-141` wrongly says one exists in
  `destinations.ts` as `later`.

**Safe fix** (does not alter the rule, it enforces it):
- Bound `decodeCoord` / `normalizeCoord` to [birth, today] and fall back to LIFE with the existing
  sentence "That date is before this life began".
- Give the Composer's `DateField` a `min` and the same refusal.
- Whether pre-birth *ancestral records* should ever be allowed is D-17.

## 4. Cosmos connection (§31)

| Check | Status |
|---|---|
| Brand / Home navigation | **COMPLETE**. The mark links to `/` from My World, Life and Chat |
| Cosmos → My World entry | **COMPLETE**. The chip goes to world or life; the gate continues inward; one 480 ms arrival resolve (none under reduced motion) |
| Earth / map relationship | **MISSING** from My World. Earth is reachable only by exploring Cosmos. The chip does overlay Earth when signed in, so Earth → My World works |
| Visual continuity | **PARTIAL**. Cosmos → My World: dark stays dark and the resolve plays. My World → Life is a plain route change; the ring→Circle expansion (`?entry=ring`) is unreachable from product links; grounds differ (atmosphere radial vs flat `--page`) |
| Language | **PARTIAL**. Cosmos (pre-login) and My World are localized. Circle internals, the gate and the awaiting-identity text are English, and `/life` has no language control (documented deferral) |
| Dark / light | **COMPLETE**. One stored theme; navigation never changes it. Light-mode Cosmos continuity is an open owner item |
| Back navigation | **PARTIAL**. Circle levels use real history. `/life` has no local return to My World. Cosmos/Earth focus is not in history. **Identity deep links drop their query** (`intent.ts:12-18`; `PersonalDestination.tsx:27`), so `/life?c=…` and `/chat?c=…` are lost through sign-in |

**Safe fixes:**
- Keep the full path and query through identity.
- Point the latent visitor Circle link at `/world` / "My World" instead of the style-lab alias
  labelled "Social" (`CircleView.tsx:236-240`).
- Keep the `/social` redirect's query string.
- Localize the Chat context word.

## 5. Recommended order

1. **Now (no decision):**
   - pre-birth bounds (Composer + `?c=`)
   - hide "Record a moment" on future days
   - query survives identity
   - visitor Circle link
   - Search Places derived from Moments
2. **With D-15:** View in Life for **own** Moments → `/life?c=day:<date>`. Remove the disabled
   pill from other people's Moments, where it may never apply.
3. **With D-16:** Place step 1 (tap → Search narrowed), then structured place, then the Place
   surface and Earth.
