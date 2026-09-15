# Circle of Life — live developer contract (Phase 5)

Companion to `README-for-developer.md`, the Social specs and
`social-api-contract.md`. Design rationale: `docs/design/circle-of-life.md`.
Reference build: `/style-lab/circle`; evidence `prototype-evidence/phase-05-circle/`.

## 1. What is real design (build exactly this)

- The temporal hierarchy LIFE → BAND → YEAR → MONTH → DAY → Almanac; the ring
  geometry (ten arcs, birth at 12, clockwise, constant-length gaps, context ring);
  lived / partially lived / unwritten material and its depth values; the single
  red present tick; the one density signal; the centre readout grammar (age
  first, calendar second, measurement third); the breadcrumb as a temporal
  coordinate; the three-verb interaction grammar; the zoom-through-time motion
  and its reduced-motion alternative; keyboard/listbox semantics; the day-level
  handoff to the Phase 4 Moment components; kind filters as filters only; Jump to
  date as a secondary utility; the owner/visitor resolution rule; the language
  (`unwritten`, `No Moments recorded here.`).
- Tokens: `--ice`, `--steel`, `--boom`, `--text`, `--muted`, `--focus`; page
  `--page` (`#F5F5F6` light / `#0A0D14` dark). No new colours.
- Type: Geist, tabular numerals; centre primary 30/40px 600 (−0.02em); caps
  11px 600 +0.14em; labels ~11px 500 (10.5 at MONTH) held constant on screen;
  inspect line 13px; day header 20/24px 600. Noto Sans Devanagari partner for
  Almanac content.

## 2. What is prototype-only (do not copy)

The style-lab harness (`?w=`, `?viewer=`, `?entry=ring`, `?harness=0`), the
Social store as data source, mock identities, the `__SB_CIRCLE` dev hook, the
`data-sb-*` attributes, the duplicated Social token block, the injectable clock,
the `T12:00:00` anchor as a *client* convention (the server should store precision
explicitly), the `systemboom.example` URLs, the CC photography.

## 3. Required data

Owner Circle (self), per request:

```
circleOwner {
  birthDate, birthTime?, birthTimeKnown          // the viewer's own truth — needed to place segments
  moments: MomentRef[]                           // viewer-visible Moments of the subject: { id, at, atPrecision, kind, privacy }
}
```
Everything else — bands, life-years, months, days, lived fractions, the present
tick, counts per segment, the day's Moment list — is derived on the client from
these two inputs and the clock. (A server may pre-aggregate counts per year /
month for performance; if it does, it must aggregate the **viewer-visible** set.)

Visitor Circle (another person): `{ bandIndex, bandLabel }` and nothing else —
identical to `social-api-contract.md` §C/§F. No Moments are needed for a
visitor's Circle because it has no density and no deeper levels.

Moment temporal precision (`social-api-contract.md` §D, amended):
`at` (ISO), `atPrecision: "day" | "minute"`, `sharedAt?` (provenance). The client
displays no clock for `"day"`.

## 4. Privacy-safe server expectations

- A visitor payload for a person carries the band only; no `birthDate`,
  `birthTime`, birth instant, exact age, day count, band calendar years,
  per-band / per-year / per-month / per-day Moment counts, or any count keyed by
  the person's age.
- A subject's only-me Moments are excluded **before** any aggregation reaches a
  viewer who is not the subject. Never "filter after counting".
- Health and Problem records follow the same rule; their existence must not be
  inferable from a visitor's density, counts, indicators or same-day results.
- Deep links (`?c=day:…`) for a non-owner resolve to LIFE at band resolution on
  the client; the server must likewise refuse to serve deeper data.

## 5. Component responsibilities (prototype names; keep the split)

| Prototype | Responsibility |
|---|---|
| `model.ts` | Temporal model: coordinates (`Coord`), normalisation, URL grammar, `circleViewFor(viewer, subject, coord, now, moments)` → segments with state, lived fraction, counts, accessible names; `visibleMoments` (structural privacy); calendar helpers (`addYears` clamps 29 FEB) |
| `geometry.ts` | Arc paths, constant-length gaps, polar helpers |
| `CircleDial.tsx` | SVG renderer for one ring + context ring + tick; pointer turn/tap; wheel-when-focused; keyboard listbox; keyboard-only focus ring; constant on-screen label size (viewBox units per px); zoom motion |
| `Readout.tsx` | Centre content per level; compact day/month at DAY |
| `CircleView.tsx` | Coordinate state, history/URL, direction, breadcrumb + back, inspect line, first-run hint, Jump to date, day header, Almanac mount |
| `DayAlmanac.tsx` | Day handoff: kind filters, Phase 4 `MomentEntry` list, empty state, `Record a moment on this day` (Phase 4 `Composer`) |
| `CirclePreview.tsx` | Page harness; entry from the Life Ring; Social tokens |

## 6. Responsive behaviour

| | 360 / 390 | 768 | ≥ 1024 |
|---|---|---|---|
| Dial | full width minus 20px padding (≥ 280px) | ≤ 560px | 560px centred |
| Labels | ~11px on screen (10.5 at MONTH) | same | same |
| Chrome | person row · coordinate · inspect line | same | same; Jump to date right-aligned |
| DAY | 132px dial beside a 20px header; Almanac full width; Social phone media rules | 168px dial; 24px header | same as 768 |
| Touch | drag = turn, tap = enter, ← = back | — | hover inspect, click, wheel when focused, Esc |

## 7. Motion intent

480 ms, `cubic-bezier(0.32,0.72,0,1)`, no springs. Enter: leaving ring rotates
the chosen segment toward 12 and recedes to the context radius while fading;
arriving ring grows from that radius. Back: reverse. DAY: dial shrinks (layout),
Almanac rises 12px / 300 ms after 180 ms. Turn: instant. Reduced motion: 120 ms
crossfade only. Nothing pulses, orbits, or animates on scroll.

## 8. Accessibility

`role="listbox"` on the dial, `option`s with full names, `aria-activedescendant`,
`aria-disabled` on unwritten segments, polite live region for the cursor, sr-only
statement of the 150-year model, `nav[aria-label="Temporal coordinate"]` with
`aria-current="location"`, back button labelled `Back to <level>`, Escape and
Backspace go out, focus stays on the dial across levels, keyboard-only focus
ring, 36px minimum targets, no colour-only state, reduced-motion path.

## 9. Edge cases the build must honour

Newborn (band 0 barely begun, everything else unwritten); a person over ninety
(band 90–105 current, ages 90–104 in the band ring); 29 FEB birth (life-years
clamp to 28 FEB in non-leap years; the year ring begins in FEB); real month
lengths incl. 1900 (28) and 2000 (29); date-only birth (no hours anywhere, tick
at day precision); date-only Moments (no clock shown); a month fully lived with
no Moments (honest floor depth); dense ranges (deepest sibling sets the scale);
visitor mode (one level, no tick, no counts, refuses deep links); private
Health/Problem (owner sees them without Respond; visitor density unaffected
because none exists); reduced motion; keyboard only; 360px.

## 10. Integration with the Moment system

Moments are the only content objects. The Almanac renders `MomentEntry` unchanged
with `showDate={false}` (the coordinate is the date). Editing uses the Social
composer. Recording at a coordinate opens the composer with that date; the result
has `atPrecision: "day"`. Feed ordering and the Circle share the same `at`.

## 11. Future Phase 6 seam — View in Life

A Moment requests a coordinate: `{ level: 4, date: moment.at.slice(0,10) }`
(`coordForDate`). The Circle page accepts it as `?c=day:YYYY-MM-DD` and rebuilds
the full breadcrumb (`Life / 30–45 / Age 34 / SEP / 10`). No other state is
required. Visitors resolve to LIFE. Do not build the gesture yet; keep the slot
disabled and honest.

## 11b. Before birth — Ancestors (documented, not built)

The Circle holds one person's life from birth. A coordinate earlier than the
birth instant is out of its range and is refused honestly today ("That date is
before this life began."). In the live product that boundary is where the
**Ancestor Tree** begins: `PERSONAL TIME → BIRTH ORIGIN → ANCESTRAL TIME`, a
change of scale rather than an error. Do not extend the Circle's bands
backwards, do not invent negative ages, and do not put Ancestors in utility
navigation — it belongs with Person, Life and Family.

## 12. What NOT to invent

A pie or donut chart; red-filled lived arcs; rainbow or per-kind colours; a radial
menu of kinds under a day; a second "Circle post" type; a date picker as the
primary time control; calendar-year-first labelling; exact ages or ticks for other
people; per-band counts for other people; "friends see more" tiers; invented
birth midnight or noon as displayed time; a clock on date-only Moments; a
tutorial overlay; streaks, badges, completion; "remaining"; glow, glass, HUD
framing; springs and bounces; wheel capture of page scroll.
