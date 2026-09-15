# Circle of Life — design (Phase 5, binding for the prototype build)

Route: `/style-lab/circle`. Source: `src/components/style-lab/circle/`. Suite:
`prototype-tests/circle.js`. Evidence: `prototype-evidence/phase-05-circle/`.

## 1. Product thesis

SYSTEMBOOM is one world at different resolutions: UNIVERSE → EARTH → PERSON →
LIFE → SOCIAL → CIRCLE OF LIFE. Cosmos answers *where am I in space*; the Circle
answers *where am I in my life*; the Almanac answers *what happened there*. The
Circle is related to Cosmos by behaviour, not by decoration: scale, position,
coordinates, measurement, zoom, resolution. There are no stars in it.

**Circle = map of a life. Almanac = street view at one coordinate.**

## 2. The model

- A person's Circle begins at their date of birth and spans **150 years** in
  **ten bands of fifteen**: `0–15 · 15–30 · 30–45 · 45–60 · 60–75 · 75–90 ·
  90–105 · 105–120 · 120–135 · 135–150`.
- **Birth is the origin at 12 o'clock. Time runs clockwise.** At every
  resolution the ring's origin is the start of the unit being shown.
- Lived time and **unwritten** time. Never "remaining", "left", a percentage or
  a countdown. Nothing counts down.
- The present is a **precise boundary**: a red tick where now sits on the ring
  that contains it; the segment containing now is **partially lived**, split at
  the exact position.

## 3. Temporal hierarchy — increase resolution, do not open menus

| Level | Ring | Segments | Origin at 12 | Enter → |
|---|---|---|---|---|
| 0 LIFE | 150 years | 10 bands × 15 years | birth | a lived or partly lived band |
| 1 BAND | 15 years | 15 life-years (birthday → birthday), labelled by **age**, calendar year secondary | the band's first birthday | a lived or partly lived life-year |
| 2 YEAR | one life-year | the 12 **calendar months** beginning with the birth month (`NOV … OCT` for a November birth) | the birth month | a lived or partly lived month |
| 3 MONTH | one calendar month | the real days: 28 / 29 / 30 / 31 | the 1st | a lived day or today |
| 4 DAY | — | the **Almanac**: that day's Moments in the accepted Phase 4 components | — | end of the radial drill |

Why life-years and birth-month origin: a person's 34th year *is* one ring, and
entering it from the band ring is a continuous zoom (the year's start sits where
the year arc started). The year ring shows the twelve calendar months beginning
with the birth month, so the centre reads `AGE 34 · NOV 2025 – OCT 2026`; the
birthday itself falls inside the first month. A month is a calendar object, so
its ring begins at the 1st.

Day is the end. There is no radial menu of kinds under a day: the Circle answers
WHEN, the Moment kind answers WHAT. Kinds appear only as quiet filters over the
day's Almanac, and only when there is more than one kind to filter.

## 4. Geometry

```
                 0 / 150
          135  ╭───────────╮  15          viewBox 400 · main ring r 156
             ╱   ice: lived  ╲            stroke 28 (LIFE) · 24 (BAND, YEAR) · 18 (MONTH)
       120  │  ┃ red tick    │  30        constant-length gaps (5 / 4 / 3 units)
            │  ┃ present     │            labels outside, constant on-screen size
       105   ╲  steel: unwritten ╱  45     context ring (the level above) r 112, stroke 3, 50%
          90   ╰───────────╯  60          centre readout in HTML, ≤ 52% of the diameter
                    75
```

- **Lived**: ice, opacity `0.42 + 0.58 × density`.
- **Partially lived**: split at the exact lived fraction — ice up to the split,
  unwritten after.
- **Unwritten**: steel at 0.20, drawn **thinner** (0.72 × stroke). The future has
  less material; that depth difference, not a colour, is the lived/unwritten
  distinction. It reads in both modes.
- **Present**: one red tick (2.5 units × stroke + 10), on the ring that contains
  now. Nothing else on the ring is red.
- The **same geometry at 24px** is the Life Ring around every photograph (Phase 4
  `LifeRing`): ten arcs, birth at 12, ice lived, steel unwritten, red tick on the
  owner only. The full Circle is that ring expanded; the compressed ring is the
  Circle at its smallest resolution. The circumference around a person's
  photograph belongs to LIFE and to nothing else.

## 5. Red

Red = lived position / present-life measurement. In the Circle it appears as the
present tick and, in the centre at LIFE, the owner's exact measurement
(`34y 10m 07d`). Lived time itself is ice, not red — a red-filled arc would read
as a progress meter and would fight the Life Ring it must match.

## 6. Privacy changes geometric resolution (structural)

- **Owner**: precise self position to the precision SYSTEMBOOM holds — split
  current segment, tick, exact `y m d`, day count, calendar years, density.
- **Another person**: **band resolution only.** Their Circle has one level: ten
  bands, lived through the current band drawn whole, **no tick, no lived
  fraction, no calendar years, no counts, nothing enterable**. The centre reads
  the band. A deep-linked coordinate (`?c=day:…`) for a visitor resolves to
  level 0 — refused by construction, not by hiding.
- Privacy is not *render precise geometry → hide labels*. The visitor view is
  produced from a view whose data never contains the forbidden precision
  (`circleViewFor` returns segments with no `count`, `lived ∈ {0,1}`, no
  `nowAngle`).
- **Aggregation**: counts of another person's dated Moments per *age* band would
  narrow their birth date (a 2019 Moment in `30–45` means born before 1989).
  Visitors therefore get **no density at all**, in the Circle and — corrected in
  Phase 5 — in the Social compact module and the Life Ring (`ringViewFor`
  produces `momentsByBand` for the owner only).

## 7. Documentation density — not life value

The ring shows where SYSTEMBOOM has recorded material. **One** signal: the depth
(opacity) of lived material, scaled to the busiest sibling on that ring. A year
with nothing recorded is drawn as lived at the floor depth and described as
"no Moments recorded" — never "empty", never a score. No streaks, badges,
completion, or percentages anywhere. If density ever competes with position,
position wins (the tick and the split are drawn above the material).

Density is derived from the **viewer-safe Moment set**: `visibleMoments(viewer,
subject)` excludes another person's only-me Moments *before* anything is counted.
A private Health or Problem record cannot affect a visitor's density, counts,
emphasis, clustering, day indicators, or any future same-day-across-life result,
because it never enters the computation.

## 8. Honest temporal precision

- Birth: `birthInstant()` — minute precision when the birth time is known, day
  precision otherwise (anchored at local midnight *for arithmetic only*, never
  displayed). The Circle shows `y m d` for both; the present tick is placed at the
  precision known.
- The present day at MONTH is split by the real time of day (the clock is known
  regardless of birth precision).
- **Moments**: `atPrecision: "day" | "minute"`. A Moment recorded for a past
  date carries DATE precision: the composer stores `at = date + 12:00` as a sort
  anchor and the readout shows **no clock time**. A Moment recorded for today
  carries the clock. Posting time is provenance (`shared today`), never the
  event time. Trusted media time or an explicit event time may raise precision in
  the live product; the manual path stays date-only. This closes the Phase 4.2
  open question.

## 9. Levels in detail

**LIFE.** Ten bands; boundary ages `0 15 30 … 135` outside; centre `AGE / 34 /
YOUR LIFE / 34y 10m 07d` (visitor: `BAND / 30–45 / <name>'s exact position is
theirs`). Inspect line under the dial: `30–45 · 2021–2036 · partly lived · 6
Moments`. One first-run hint, `Turn · tap to look closer · Esc to come back`,
disappears after the first successful entry.

**BAND.** The chosen band rotates to 12 o'clock as it recedes to the context
ring; its fifteen life-years fill the main ring, labelled `30 31 … 44`. Centre
`30–45 / 2021–2036 / age 34 now`. Inspect: `Age 34 · 2025 · partly lived · 6
Moments`. Completed years lived, current year partial, future years unwritten.

**YEAR.** Twelve calendar months from the birth month. Centre `AGE / 34 / NOV
2025 – OCT 2026 / 34y 10m 07d`. Completed months lived, current partial, later
unwritten; density visible month by month.

**MONTH.** The real days; every fifth day labelled plus the cursor and today.
Centre `SEP 2026 / age 34 / 11 SEP today`. Completed days lived, today split by
time of day, later days unwritten.

**DAY.** The dial shrinks to a compact coordinate (day number over month) and
stops being the primary object. Header: `10 SEP 2026` · `34y 10m 06d · Kathmandu,
Nepal` · `1 Moment recorded`. Then the Almanac sheet: the day's Moments with the
Phase 4 `MomentEntry`, newest first, no date rules (the coordinate is the date).
Empty: `No Moments recorded here.` and, for the owner, `Record a moment on this
day` (opens the accepted composer at that date). Kind filters (`All · 3 / Meal · 1
/ …`) only when two or more kinds are present.

## 10. Interaction grammar

Three verbs at every level: **TURN** (scrub through siblings), **TAP** (look
closer), **BACK** (breadcrumb, ← , Escape, the context ring).

- **Mobile — the Circle is a dial.** Drag around the circumference: the cursor
  snaps to whole segments (a 4 ms vibration where the platform offers it; never
  required). Tap the segment under the finger to enter. Hit areas are the full
  stroke + 22 units; nobody aims at a wedge. The ← button (36px) and the
  breadcrumb are the non-gesture way out.
- **Desktop.** Hover inspects (outline + inspect line), click enters, wheel
  scrubs **only while the dial is focused** (it never captures page scroll),
  Escape goes one level out.
- **Keyboard.** The dial is one Tab stop (`role="listbox"`, segments are
  `option`s, `aria-activedescendant`). ← → ↑ ↓ turn, Home/End, Enter/Space enter,
  Escape/Backspace back. A polite live region names the cursor's segment
  (`Age 34, 2025 to 2026, partly lived, 6 Moments recorded. Enter to look
  closer.`). The focus ring appears for keyboard users only.
- **Breadcrumb / temporal coordinate**: `Life / 30–45 / Age 34 / SEP / 10` —
  each earlier part is a button; the current part is `aria-current="location"`.
  It reads as a coordinate, not site navigation.
- **Jump to date** (owner, secondary utility): a `DD MON YYYY` field bounded by
  birth and today; resolves the Circle to that day. Refusals: `That date hasn't
  happened yet.` / `That date is before this life began.`

## 11. Motion — zoom through time

One orchestrated transformation per interaction, 480 ms, ease
`cubic-bezier(0.32, 0.72, 0, 1)` (the spatial ease), no springs:

- **Enter**: the leaving ring rotates the chosen segment toward 12 o'clock while
  it recedes to the context radius (scale 156 → 112) and fades; the arriving ring
  grows from the context radius to the main radius. The chosen segment therefore
  stays perceptually connected to the ring it becomes.
- **Back**: the reverse — the inner ring grows out, the outer ring arrives from
  slightly beyond (scale 1.18) and settles.
- **Day**: the dial shrinks to the compact coordinate (layout animation) and the
  Almanac rises 12px over 300 ms after a 180 ms hold.
- **Turn**: immediate; the cursor outline and labels change without animation
  (selection feedback must be instant).
- **Reduced motion**: 120 ms opacity crossfade, no scale, no rotation, no layout
  animation; hierarchy and focus preserved.

## 12. Responsive

- **360 / 390**: the Circle is primary (≥ 280px wide, full frame minus 20px
  padding); labels keep ~11px on screen through a viewBox-per-pixel factor; the
  person row, coordinate and inspect line are the only chrome. Day level: 132px
  dial beside the header, Almanac below with Social's phone media rules.
- **768**: the same composition, dial up to 560px.
- **Desktop**: dial 560px centred in the column; no cards around it.

## 13. Accessibility

Listbox semantics with live announcements; every segment has a full accessible
name including lived state and recorded count (owner) or band state (visitor);
disabled unwritten segments are `aria-disabled`; the 150-year model is stated in
an sr-only line; the breadcrumb is a `nav` with `aria-current`; colour is never
the only carrier (state is in text, labels and depth); touch targets ≥ 36px; the
dial never traps Tab.

## 14. Seams

- **From the Life Ring** (`?entry=ring`): the person row shows the 96px ring with
  `Look closer`; activating it expands the same geometry into the Circle
  (layout animation; crossfade under reduced motion). In Social, the compact
  Circle module's `Open Life` links here. The frozen Phase 4 components are used
  as-is.
- **Future View in Life (Phase 6)**: the minimum navigation state is a
  coordinate `{ level, band?, age?, ym?, date? }`, addressable as
  `?c=day:2026-09-10`; `coordForDate(date)` produces it from a Moment's own
  date. A Moment's "View in Life" will request that coordinate; nothing in the
  time model needs to change. Not built.
- **Before birth — the Ancestor Tree (Phase 4.3 product rule, documented only).**
  Personal life begins at birth: the Circle's origin at 12 o'clock is the
  earliest coordinate it can hold. Navigation before that instant does not
  belong to this person's Circle — it crosses into the existing **Ancestor
  Tree**. The eventual feeling is `PERSONAL TIME → BIRTH ORIGIN → ANCESTRAL
  TIME`, a change of scale, not an error state. Nothing is implemented: today a
  date before birth is refused honestly ("That date is before this life
  began."), and that sentence is the placeholder for the crossing. Ancestors
  belongs with Person, Life and Family, never in utility navigation.
- **Same day across your life** (Phase 5.x candidate): at DAY, a deliberate
  secondary action could show `10 SEP · across my life` — every year's 10 SEP.
  The model already answers it (`visibleMoments` filtered by month/day); the
  gesture and presentation are not built. Banked in `phase-5-candidates.md`.
- **Photo Timeline**: the Circle is the primary time scrubber; a photo view can
  later be a content mode at MONTH/DAY resolution. Not built.

## 15. URL and state

`?c=` carries the coordinate. Entering pushes history (browser Back = one level
out); turning never touches the URL; refresh rebuilds the coordinate; unknown
values resolve to LIFE. Native `history.pushState` (integrated with the Next.js
router per the bundled docs); no `useSearchParams` so the static page needs no
Suspense boundary. A visitor's URL is ignored above level 0.

## 16. Banned

Neon, rainbow bands, ten category colours, glowing borders, self-luminous
content, reticles, corner brackets, scanlines, glitch, circuit decoration, hex
grids, fake telemetry, decorative coordinates, monospace, purple/blue gradients,
glass on the Circle, bloom, gamification, streaks, badges, completion
percentages, mortality countdowns, "remaining", fake precision (invented birth
midnight, invented event clock time), radial kind menus, a second Circle-only
post model, a date picker as the primary time control.
