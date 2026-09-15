# Social — wireframes (plain text, binding for the Phase 4 build)

Direction A "The Almanac", as approved, with light mode built on the live system's
white-on-grey foundation. Where the build diverges from these drawings the drawing
is updated and the divergence is reported.

Legend: `│` the vertical time rule · `├─` a date rule · `◎` a 24px life-ring avatar
on the rule · `●` the Respond mark (a small ring that fills) · `▾` disclosure ·
`⋯` more menu · `▮▯` progress hairline.

## 1 · Page — desktop (≥1024px), light mode

```
grey field (#F5F5F6)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  [RED PLATE SYSTEMBOOM]  ⌕ Search photos, people, places…   Home  About  World  Friends  Profile   💬  🔔  ☾  ◎▾ │  flat white nav, active nav red
└────────────────────────────────────────────────────────────────────────────────────────┘
        ┌── hero card, r=32, white, soft float ─────────────────────────────┬─ counter card r=24 ─┐
        │ [cover photo — own aspect, max-h 260]           (👥)(📷) owner only  │   MY LIFE IN         │
        │                                                                   │   34y 10m 06d        │  red · navy · grey
        │  ◎64  Maya Rai ✓navy      ┌ only you see this ──────────────┐    │      ⧗               │
        │       Born 04 NOV 1991 · 06:42 · Kathmandu   │ +977 …  ✉ … │    │   03h 54m 27s        │
        │                                              └──────────────┘    │   [years ▾] ← control│
        └───────────────────────────────────────────────────────────────────┴──────────────────────┘
        ┌── the white sheet, r=24 ──────────────────────────────────┐  ┌─ Circle of Life r=24 ─┐
        │ ◎ What happened at 34y 10m 06d?                            │  │      ╭──────╮          │
        │ ─────────────────────────────────────────────────────────  │  │    ╱  ring   ╲   ten   │
        │ ├─ TODAY  10 SEP 2026 ───────────────────────────────────  │  │   │ ice lived │  bands │
        │ ◎ Maya Rai · 34y 10m 06d · Thamel, Kathmandu       07:40  │  │    ╲ red tick ╱        │
        │   Thamel smelled of rain and juniper before…              │  │      ╰──────╯          │
        │   [photo — own aspect, ≤480 tall, inset, r=4]             │  │   12,732 days          │
        │   ● Respond   3 responses · 1 note ▾      View in Life  ⋯  │  │   3 moments this month │
        │ ─────────────────────────────────────────────── hairline   │  │   [10 SEP 2026 ▾] [⚙] │
        │ ◎ Bikash Shrestha · 30–45 · Bhaktapur              12:15  │  │   Open Life (later)    │
        │   MEAL · Newari khaja set · Nyatapola Café · with 3        │  └────────────────────────┘
        │   Dashain scaffolding is going up on…                     │
        │   ● Respond   5 responses                            ⋯    │
        │ ─────────────────────────────────────────────────────────  │
        │ …                                                          │
        │   Load more                                                │
        │   ─ That's everything shared so far. Earlier moments live in Life. ─ │
        └────────────────────────────────────────────────────────────┘
```

Column widths: sheet 680 max, sidebar 300, gap 24; hero spans both. Sidebar is sticky
below the nav. Dark mode: same structure with no sheet (entries on the page), nav is
glass, sidebar modules are flat `--surface` cards with a 1px edge.

## 2 · Page — 360px, light mode

```
┌──────────────────────────────────────┐
│ [RED PLATE]        ⌕  💬  🔔  ☾  ◎     │  flat white
├──────────────────────────────────────┤  grey field
│ ┌ hero card r=24 ────────────────────┐│
│ │ [cover — own aspect, max-h 160]    ││
│ │ ◎44 Maya Rai ✓                     ││
│ │  Born 04 NOV 1991 · 06:42          ││
│ │  ┌ only you see this ───────────┐  ││
│ │  │ +977 9851 038 796 · ✉ maya…  │  ││
│ │  └──────────────────────────────┘  ││
│ │  ┌ MY LIFE IN (hero scale) ─────┐  ││  C5.3: on phone/tablet the counter
│ │  │ 34y 10m 06d ⧗ 03h 54m 27s    │  ││  lives in the hero; there is no
│ │  │        [years ▾]             │  ││  separate counter card below desktop
│ │  └──────────────────────────────┘  ││
│ └────────────────────────────────────┘│
│ ┌ Circle of Life r=24 ───────────────┐│
│ │ (ring 96)  12,732 days             ││
│ │            3 moments this month    ││
│ │            [10 SEP 2026 ▾] [⚙]     ││
│ └────────────────────────────────────┘│
│ ┌ the sheet, r=24 top ───────────────┐│
│ │ ◎ What happened at 34y 10m 06d?    ││
│ │ ───────────────────────────────────││
│ │ ├─ TODAY  10 SEP 2026 ─────────────││
│ │ ◎ Maya Rai · 34y 10m 06d · Tha… 07:40│  place truncates, time never
│ │   Thamel smelled of rain and…      ││
│ │[photo — bleeds to the SHEET edge, r=0]│
│ │   ● Respond  3 responses · 1 note ▾││
│ │                    View in Life  ⋯ ││  foot wraps: acts, then right group
│ │ ───────────────────────────────────││
│ │ ◎ Bikash Shrestha · 30–45 · Bh… 12:15│
│ │   MEAL · Newari khaja set ·        ││  kind line wraps at "·"
│ │   Nyatapola Café · with 3          ││
│ │   Dashain scaffolding is going…    ││
│ │   ● Respond  5 responses        ⋯  ││
```

Gutter 28px, rule at x=13. Media bleeds to the sheet's edge (not the viewport), radius
0, unless the kind is HEALTH/PROBLEM (inset, r=4, never bleeds).

## 3 · Single entry — MEAL (768px, light)

```
├─ 09 SEP 2026 ──────────────────────────────────────────────────────────────  date rule (18px 600)
◎ Bikash Shrestha · 30–45 · Bhaktapur Durbar Square                     12:15  line 1: who · life · Earth · when
  MEAL · Newari khaja set · Nyatapola Café · with 3                           line 2: KIND WORD 11px caps + fields 13px
  Dashain scaffolding is going up on the Nyatapola steps already. The whole    body 17/1.6, ≤66ch
  square is holding its breath for the festival.
  [photo 4:3 — own aspect, ≤480 tall, from the gutter to the column edge, r=4]
  ● Respond   5 responses · 2 notes ▾                          View in Life  ⋯  foot 13px
     ◎ Asha Gurung  Save me a plate.                                  12:40    note (depth 1)
        ◎ Bikash Shrestha  Always.                                   12:52    reply (depth 2, flat under parent)
        Reply
     ◎ [you]  Write a note…                              (emoji) (image) ↵
```

Rules: the readout is one line; the place truncates, name/age/time never do. `with 3`
is a link to the who-list. HEALTH/PROBLEM: no `● Respond`; line 2 ends `· only you`.
Own entries show `· edited` after the time when edited. Privacy: public shows nothing,
friends shows a small two-figure glyph after the time, only-me shows the word.

## 4 · The composer on the rule (closed / open)

Closed (a row on the rule — the sentence alone; no instrument icons on the bar):
```
◎  What happened at 34y 10m 06d?
```
Open — desktop modal 560px / mobile full-height sheet; see `composer-states.md`:
```
┌ New moment ─────────────────────────────────────────── ✕ ┐
│ ◎ Maya Rai   [Public ▾]                                     │
│ ┌ WHERE THIS SITS ────────────────────────────────────────┐ │  the life readout leads (readout-first)
│ │ This moment will sit at 34y 10m 06d · Kathmandu · today │ │
│ │ [📅 10 SEP 2026]  [📍 Kathmandu, Nepal]                 │ │  date display DD MON YYYY (C2)
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ What happened at 34y 10m 06d?                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│  ☺ feeling                                        0 / 2,000 │
│  ( 🖼 )( 🍲 )( 🏃 )( ⚠ )( 🏥 )( ☑ )( 🤝 )                     │  seven kind buttons, single ink,
│  media  meal  activity problem health project meeting       │  each with its 11px word (C4)
│  ─ kind fields appear here when a kind is chosen ─          │
│  ─ media panel: Photos · Video · Link → [thumb][thumb] +  (3 of 10) ─ │
│  (detected from a photo: FROM THE PHOTO · 25y 11m 02d · Bhaktapur · 03 AUG 2026 · Change / Confirm) │
│  [ Post ]   Cancel                              ⌘↵ posts    │  red, disabled until valid
└─────────────────────────────────────────────────────────────┘
```

## 5 · Circle of Life module (300px)

```
Circle of Life
        ╭───────────╮      ten arcs, 36° − 4° gap, birth at 12 o'clock, clockwise
      ╱   ice: lived  ╲    lived arcs: ice, opacity by moments recorded (0.35 → 1.0)
     │  ●red tick now  │   unwritten arcs: steel 0.18
      ╲  steel: unwritten╱  hover/focus an arc → "band 30–45 · 2021–2036" (owner; a visitor sees the band only)
        ╰───────────╯
  12,732 days
  3 moments recorded this month
  today · 10 SEP 2026   [ ⚙ ]   informational date (Phase 5 §24) — not a picker
  [ ○ Open Life ]                 the entry to the full Circle of Life (Phase 5)
```
The same component draws the 24px avatar ring (stroke 2) and this 220px ring (stroke 10).


## 6 · Chronology (C3, binding)

The rule is chronology. Entries sort by the **moment's own date/time, newest
first** — never by when they were shared. One date rule per calendar day; a day
never repeats further down the ledger. A backdated moment sits at its historical
position (a 1983 moment is at the bottom of the loaded ledger or behind Load
more), with `shared today` as secondary provenance beside its own date. Posting a
backdated moment is the one orchestrated motion: the page settles on the entry
where it landed (focus on its readout) — a glide when near, a jump when it is more
than ~2.5 screens away, then the entry's 220 ms rise; under reduced motion a plain
jump. Older entries may remain behind "Load more · n earlier".

```
├─ TODAY  10 SEP 2026 ─────────────   (4 entries, one rule)
├─ 09 SEP 2026 ───────────────────
├─ 08 SEP 2026 ───────────────────
…
├─ 13 APR 2026 · shared 02 sep 2026 ─  (backdated ten-photo Jatra)
…  Load more · 8 earlier
├─ 17 OCT 2022 · shared 27 aug 2026 ─
├─ 06 FEB 1983 · shared today ────────  (bottom: the oldest moment)
   That's everything shared here so far. Earlier moments live in Life.
```

## 7 · Visitor hero (C1, binding)

```
┌ hero card ───────────────────────────────────────────────┐
│ [cover]                                                   │
│  ◎ (band-level ring, NO tick)  Maya Rai ✓                 │
│                                Kathmandu, Nepal           │
│  Circle  band 30–45                      ┌ CIRCLE BAND ─┐ │
│                                          │   30–45      │ │
│  (no Born row · no day count · no contact)│ years — the  │ │
│                                          │ exact age is │ │
│                                          │ theirs…      │ │
└──────────────────────────────────────────┴──────────────┘
Circle module (visitor): ring, centre reads "30–45 / BAND", no day count, no tick,
no calendar years, no date field, no "Open Life".
```
