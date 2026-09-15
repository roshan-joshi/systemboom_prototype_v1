# SYSTEMBOOM Social — Visual Specification

Version 2.0 · 2026-09-10 · Phase 4 final ("The Almanac", light built on the live
system's foundation). Stack-agnostic: a developer builds Social from this document
without opening the prototype. Companion documents: `social-interaction-spec.md`
(behaviour, keyboard) and `social-content-rules.md` (every sentence).

---

## 0. The idea

Social is a dated ledger of lives. One vertical hairline — the **time rule** — runs
down the left of the reading column; every moment is an **entry** on it, not a
card. The first thing each entry says is where it sits in a human life: the date,
the author's exact age at that instant (own moments) or their 15-year Circle band
(anyone else), the place, and the time. The author is a small face wearing its
**life ring**. Media is the only element that may break the column, and it is
shown at its own aspect ratio — never letterboxed.

**Light mode** is the live system's look, refined: a grey field, one continuous
white sheet holding the feed, white sidebar cards with generous radius and a soft
float, brand red back in the chrome. **Dark mode** is Deep Cosmos: entries on the
page, glass on the top bar only.

Three inherited rules: light has a source (nothing glows); every number is a
measurement (real units, honest precision); chrome recedes, content dominates.

---

## 1. Colour

| Role | Light | Dark |
|---|---|---|
| Page (the grey field) | `#F5F5F6` | `#0A0D14` |
| Sheet (the feed) | `#FDFDFD`, radius 24px, shadow `0 8px 28px -18px rgba(30,45,70,.25)` | transparent — entries sit on the page |
| Cards (hero, sidebar) | `#FDFDFD`, radius 32px hero / 24px sidebar, same shadow, no border | `#10141E`, 1px border `rgba(142,155,176,.18)`, no shadow |
| Raised (fields, menus, thumbnails' ground) | `#FFFFFF` | `#151A27` |
| Nav bar | `#FFFFFF`, flat, 1px bottom hairline `rgba(15,21,32,.06)` | glass: `rgba(15,19,29,.66)` + `backdrop-filter: blur(20px) saturate(1.5)`, 1px edge `rgba(201,216,234,.10)`, radius 16px, floating 12px from the edges |
| Text | `#0F1520` | `#EEF2F8` |
| Secondary text ("muted") | `#5A6880` | `#8E9BB0` |
| Structure ("steel") — ring bands, dashed marks, glyphs | `#55708F` | `#7E93AE` |
| Highlight ("ice") — lived ring bands, focused hairline | `#33517A` | `#C9D8EA` |
| **Brand red** | `#D92A20` (hover `#B91F16`) | `#D92A20` (hover `#F04136`) |
| Red soft (pressed Respond fill, active kind button) | `rgba(217,42,32,.10)` | `rgba(217,42,32,.16)` |
| **Navy** — verified badge, months/minutes digits | `#3D678C` | `#8FB3D9` |
| **Unit grey** — days/seconds digits | `#39454E` | `#C9D8EA` |
| Hairline (rule, separators, field borders) | `rgba(15,21,32,.14)`; the time rule and date rules `rgba(15,21,32,.22)` | `rgba(201,216,234,.14)`; rules `.22` |
| Danger (validation text only) | `#C22026` | `#E5484D` |
| Focus ring | `#1E66D0` | `#7DB8FF` — 2px solid, 2px offset, radius 6px, on everything focusable |
| Media overlays (white text on) | play disc `rgba(10,13,20,.35)` · duration/caption `rgba(10,13,20,.82)` / `.55` · "+N" `.55` | same |

**The red budget in light** — nothing else is red: the logo plate fill · the active
nav item's text · the primary button (Post / Save) · and inside the feed only: the
viewer's life tick, unread dots, the pressed Respond mark, the years/hours digits of
the counter (sanctioned unit colour), the current-kind button fill (soft). Red is
never small body text.

**Unit colours are the ring's legend.** Red = years (the unit that decides the
band) and the tick that marks it on the ring; navy = months (position inside the
band); grey = days. Hours / minutes / seconds repeat the same three.

---

## 2. Type

Family **Geist**; Devanagari partner **Noto Sans Devanagari** with a weight offset
(nominal 400 → variable weight 500, 500 → 600, 600 → 700) so mixed lines carry one
visual weight. Fallback stack: `Geist, "Noto Sans Devanagari", "Kohinoor
Devanagari", "Nirmala UI", sans-serif`. **No monospace anywhere.** Every element
containing a number uses tabular numerals.

| Role | Size / line | Weight | Tracking | Colour |
|---|---|---|---|---|
| Hero name | 24/1.05 (≥672px: 30) | 600 | −0.02em | Text |
| Hero place | 13/1.3 | 400 | 0 | Muted |
| Hero readout (Born, Circle, Contact) | 13/1.35 | 400 | 0 | label Muted / value Text |
| Card title (MY LIFE IN, CIRCLE OF LIFE, NOTIFICATIONS) | 11/1 | 600 | +0.14em uppercase | Muted |
| Counter digits — composite row 1 | 44 (hero ×0.68) | 400 | 0 | unit colour; unit letter 36% size, 500, Muted |
| Counter digits — composite row 2 | 30 (hero ×0.68) | 400 | 0 | unit colour |
| Counter digits — single unit | 56 / 44 / 34 / 26 / 22 by digit count (≤3 / ≤6 / ≤9 / ≤12 / more) | 400 | 0 | unit colour |
| Counter unit control | 12/1 | 500 | +0.02em | Muted → Text on hover |
| Ring centre number | 30/1 | 600 | −0.02em | Text; "DAYS" 11 caps Muted |
| Date rule | 18/1 | 600 | +0.01em | Text; secondary (`shared today`, the full date after TODAY) 12, 500, Muted |
| Entry readout line 1 | 13/1.3 | name & exact age 500; band, place, time 400 | 0 | name/age Text; band/place/time Muted |
| Entry kind line | kind word 11, 600, +0.14em caps Muted; fields 13/1.3 400 Text at 85% (Health/Problem: Muted) |
| Body | 16/1.55 (≥672px: 17/1.6), measure ≤ 66ch | 400 | 0 | Text |
| Foot (Respond, counts) | 13/1 | Respond 500, counts 400 | 0 | Text / Muted |
| Note text | 14/1.45 | author 500 | 0 | Text; time 12 Muted |
| Nav items | 14/1 (phone row 12) | 500 | 0 | Muted; active red (light) / Text + red dot (dark) |
| Search placeholder | 14 | 400 | 0 | Muted |
| Composer text | 16/1.55 (≥672px: 17) | 400 | 0 | Text |
| Composer field labels | 11 caps +0.14em | 600 | | Muted (danger when required and missing after an attempt) |
| Buttons (Post / Save) | 14 | 600 | 0 | white on red |
| Notification row | 13/1.4 | name 500 | 0 | Text; time 12 Muted |

Dates `DD MON YYYY`, times `HH:MM`, ages `34y 10m 06d`, bands `30–45`.

---

## 3. Layout

**Breakpoints** are container widths: phone < 672px · tablet 672–1023px · desktop
≥ 1024px.

**Page.** Content column max 1120px, padding 12px (phone) / 24px. Desktop: hero
spans the column; below it a grid `minmax(0,1fr) 300px`, gap 24px: the sheet left,
the sidebar (sticky under the bar) right. Tablet: hero (carrying the
counter at hero scale — C5.3), then the Circle card, then the sheet. **Phone:
hero (with the counter), then the sheet, then the Circle card** — the stream is
the point of the screen, and the Circle stays as orientation below it. There is
exactly one counter on any screen.

**The sheet.** Padding 16px (phone) / 24px, top 20px, bottom 24px. The time rule is
a 1px hairline at x = 13px (phone) / 19px from the sheet's inner left edge, running
the full height of the entries. Content starts at a gutter of 28px / 40px. Rings
and date labels sit on top of the rule with a 2px sheet-coloured pad, so the line
appears to pass behind them. Entries are separated by a 1px hairline with 24px
above and 24px below.

**Date rule.** 1px hairline from the rule to the right edge, centred on the label's
midline; the label has a sheet-coloured background and 8px right padding.
Consecutive entries on the same day share one date rule (one rule per calendar day,
never repeated lower down). When the first entry of a day is backdated, its rule
carries `shared today` / `shared dd mon yyyy` beside the date.

**Entry rhythm.** Date rule → line 1: 12px · line 1 → place line (phone) / kind
line: 2px · → body: 8px · → media: 12px · → foot: 10px · → notes: 12px.

**Media extent.** Phone: from the sheet's left edge to its right edge (crossing the
rule), radius 0. ≥ 672px: from the gutter to the column's right edge, radius 4px.
Health and Problem media never bleed: inset from the gutter, radius 4px, at any
width.

**Media sizing.** A photo keeps its own aspect ratio inside a 480px maximum height.
Landscape and panorama fill the available width and take the height that follows
(a 3.8:1 panorama is ~170px tall at 640px). Portrait stands at the left edge at
its own width (a 3:4 photo is 360px wide at 480px tall). Never crop a single photo,
never letterbox. Multiple photos: a two-column grid, 2px gaps, each tile at its
own aspect (max 320px tall), the fourth tile overlaid with "+N" when more than
four; tapping shows all. Video: poster at its own aspect (9:16 allowed), 56px play
disc, duration chip bottom-left, burned-in caption chip above it when present.
Link: a 1px-hairline card, 96–128px thumbnail left (cropped — it is a thumbnail),
host in 11px caps, title 14/1.35 500 (two lines), description 13/1.4 Muted (two
lines).

---

## 4. The life ring

Ten arcs (fifteen years each, 150 years), each spanning 36° minus a 4° gap,
drawn clockwise from 12 o'clock. Stroke 2px at 20–32px diameters, 3px at 60–96px,
10px at 220px. Radius = diameter/2 − stroke/2 − (2px on own rings, else 0.5px).

| Band state | Colour | Opacity |
|---|---|---|
| Lived (whole or the lived part of the current band) | Ice | 0.35 + 0.65 × (moments in band ÷ most moments in any band) |
| Unwritten | Steel | 0.18 |

The current band is split at the exact position: lived part ice, the rest steel.
**Own ring only:** a red tick 2px wide (3px at the 220px size), stroke + 4px long,
crossing the ring at angle `days lived ÷ (150 × 365.25) × 360°` from 12 o'clock.
Other people's rings never carry the tick. Inside the ring: the avatar (image, or
initials at 40% of the diameter on Raised) or, in the module, the day count.

Sizes used: 20px (notes), 24px (entry readout, notifications, search), 28px (nav
avatar), 32px (composer author), 72px / 96px (hero, phone / ≥672px), 220px (Circle
module). One component draws all of them.

---

## 5. Components

### 5.1 Top bar
Light: flat white bar, 8px vertical padding, contents, left to right: the
**Brand** — the red SYSTEMBOOM plate (logo 14px, radius 11px) linking Home to
Cosmos, with **MY WORLD** beside it in 11px caps +0.12em — the product's only
global control (`docs/design/systemboom-navigation-final.md`) · search field
(pill, 1px hairline, Raised fill, 360px max, placeholder 14) · chat (hidden
below 672px — it is a later-phase placeholder), bell (8px red dot when unread),
theme, avatar ring 28px with a ▾. Utility targets are 36px on phones, 40px from
672px.

The bar row spans the frame (it is not centred on the content column) so the
brand keeps the same viewport position everywhere. **There is no navigation row
or destination menu at any width**, and MY WORLD stays visible even at 360.
Dark: the same contents in a floating glass bar.

### 5.2 Profile hero
Card, radius 24px / 32px. Cover photo at its own aspect, max height 160px / 260px,
owner-only actions (people, camera) top-right in 36px dark discs. The ring-framed
avatar (72 / 96px) overlaps the cover by 40 / 56px with a 3px card-coloured pad; the
owner's camera badge (32px, hairline, Raised) sits at its bottom-right. Name +
navy verified check (20px). Readout list: Born · Circle · Contact (owner only — a
hairline pill on Raised, the label ONLY YOU SEE THIS in 11px caps, then phone and
email). Right column (≥672px): owner — the counter at hero scale inside a 20px-
radius hairline box **on phone and tablet only** (below 1024px there is no
sidebar, so the hero carries the counter; at desktop the counter lives in the
sidebar module only and the hero shows no counter — C5.3); visitor — a CIRCLE
BAND box with the band in 24px 600 and the sentence "years — the exact age is
theirs to share".

**Visitor hero (C1, binding).** No Born row, no day count, no contact pill, no
`<dl>` readout at all: name + verified check, home place in Muted, one line
`Circle band 30–45`, and the CIRCLE BAND box. The avatar ring is drawn at band
level (lived bands, current band whole, **no red tick**). These elements are not
hidden — the visitor view is rendered from a view model in which the birth-derived
fields do not exist (see §10).

### 5.3 MY LIFE IN (counter)
Card, radius 24px, padding 20px × 16px, title centred. Composite face: `34y 10m
06d` (44px, unit letters 16px Muted), an 8px hairline–hourglass–hairline divider
(hourglass 18px, red), `09h 18m 56s` (30px). Unknown birth time: the second row is
replaced by "counted in days" (12px Muted). Beneath the number, and nothing else:
the unit control — a 32px pill button, 12px 500 Muted, reading `years · months ·
days` or the unit word with a ▾; hover/focus reveals "change unit" in 11px below
it. Optional forward line (12px Muted): "Your 13,000th day is in 271 days".

Faces, in order: composite → years → months → weeks → days → hours → minutes →
**seconds** → composite. **There is no milliseconds face** (C5.2); a face that
changes faster than a reader can read is decoration. Unknown birth time: the cycle
stops at days.

Digit roll: a changed digit slides in from −0.55em over 220ms ease-out; unchanged
digits are still. Composite, hours, minutes and seconds tick each second; years…
days re-evaluate each minute. Reduced motion: the seconds face updates without the
roll; values are always live.

**Visitor (desktop sidebar only):** the card keeps its title and shows two lines —
"A person's counter is theirs to see." / "Band 30–45" — no digits, no control.
Below desktop a visitor sees no counter card at all (the hero's CIRCLE BAND box
carries the band).

### 5.4 Circle of Life module
Card as above. **Owner:** title; the 220px ring with the day count inside
(`12,729` 30px 600 over DAYS); the band readout `band 30–45 · 2021–2036` (13px,
current band in Text), swapping to the hovered/focused band with its moment count
or "unwritten"; the activity line "4 moments recorded this month"; an
informational line `today · 10 SEP 2026` (13px, Muted, the date in Text — **not a
picker**: the full Circle owns time navigation, Phase 5 §24) and a 36px settings
disc; **"Open Life"** — a hairline pill linking to the full Circle of Life (Phase 5).
**Visitor:** the same ring at band level (no tick), the centre reads the band
(`30–45` 28px 600 over BAND), the readout reads `band 30–45` with **no calendar
years** (they would reveal the birth year), the activity line, and nothing else —
no day count, no date field, no settings, no "Open Life". Hovered/focused arc: a 1px Text-coloured outline 3px outside it.
Never a percentage, never "remaining".

### 5.5 Moment entry
See §3 for geometry. Line 1 (13px): ring 24px on the rule · name · exact age (own)
or band · place (≥672px) · feeling · privacy glyph / "only you" · "edited" · time
right-aligned. Phone: the place and feeling move to their own line under line 1 so
nothing truncates to a stub. Kind line: word + fields; PROJECT's progress is a
40px hairline with the done fraction in ice followed by `n of m`. Body 16/17px,
≤66ch; over 420 characters truncates with "more". Foot: **Respond** — 36px pill,
1px hairline, 12px padding, a 10px ring mark that fills red when pressed (fill
`rgba(217,42,32,.10/.16)`, border transparent), press scale 0.96 for 160ms; `n
responses` (tap → who list); `n notes ▾` / "Write a note"; right-aligned View in
Life (dashed dot, 60% opacity, ≥672px only — on phones it lives in the ⋯ menu) and
the ⋯ (36px disc). Health and Problem entries have no Respond; when their privacy is
Only me (the default) their kind line ends in "only you" instead of the readout
carrying the word.

### 5.6 Notes
Indented 14px past the gutter. Row: 20px ring · name 500 · (you) · text · time 12
Muted · edited · Respond (8px mark + count) · Reply (top level only) · ⋯ (28px).
Replies indent a further 32px. Collapsed: three top-level notes; "View n more
notes". Composer row: 20px ring · single-line auto-growing field with a bottom
hairline (Highlight on focus) · feeling and image glyphs (28px) · Send (phone
only) · helper "Enter sends · Shift+Enter for a new line" (≥672px).

### 5.7 Menus and popovers
Raised fill, 1px hairline, radius 14px, 4px padding, shadow `0 12px 32px -16px
rgba(0,0,0,.45)`; items 13px, 8px × 12px padding, radius 10px, hover Steel at 12%.
Radio items carry a 6px dot (red when selected, steel ring otherwise). Delete
confirm is inline inside the menu: sentence, then Delete / Keep pills.

### 5.8 Composer
Desktop: centred modal 560px (92% max), top 32px, radius 24px, shadow `0 24px 64px
-24px rgba(0,0,0,.45)`, scrim `rgba(10,13,20,.42)`. Phone: full-height sheet.
Header 15px 600 title + 36px close. Body (16px padding, 20px ≥672px), in order:
author row (32px ring, name 14 500, privacy pill 28px); **the life readout box**
(1px hairline, radius 14px, label WHERE THIS SITS / FROM THE PHOTO, the sentence
with the age in 500, then date + place fields or Confirm / Change); the text area
(4 rows, no fill, focus ring is the global one); feeling button + counter `0 /
2,000`; seven kind buttons (40px discs, hairline; active: red-soft fill) **each with its
word beneath at every width** — 11px 500 Muted (`meal`, `activity`, …); the row
scrolls horizontally on phones rather than dropping the words (C4; icons-only is
not acceptable); date fields (composer date, project "since") show `DD MON YYYY`
over the native input (C2); kind fields (2 columns ≥672px; fields 36px, radius 10px,
Raised, hairline); the media panel (tabs Photos · Video · Link; a 4/6-column grid of
square thumbnails, selected with a 2px red ring and an order badge; the chosen
strip at 96px tall with arrow/remove controls; `n of 10`). Footer: Post (40px pill,
red; while posting a white 25% fill sweeps left→right over 900ms and the label
reads Posting…) · Cancel · "⌘↵ posts" (≥672px). The discard confirm replaces the
footer row.

### 5.9 Notifications
Card, radius 24px, 12px padding, 420px wide right-aligned (≥672px). Title row with
`n unread` and Mark all read. Groups by day on a 1px rule (6px hollow dots at the
day labels); rows: 24px ring · text · time · 8px dot (red unread, hairline ring
read). Empty: one centred sentence.

### 5.10 Search
Results panel 420px, Raised, hairline, radius 14px: Recent (when empty) · Photos
(4-column square thumbnails) · People (24px rings) · Places; empty sentence.

---

## 6. Responsive summary

| | Phone (<672) | Tablet (672–1023) | Desktop (≥1024) |
|---|---|---|---|
| Layout | single column: hero (with counter) · **sheet** · circle | hero (with counter) · circle · sheet | hero · sheet + sticky 300px sidebar (counter · circle) |
| Gutter / rule x | 28 / 13px | 40 / 19px | 40 / 19px |
| Media | sheet-edge to sheet-edge, r 0 | gutter → edge, r 4 | gutter → edge, r 4 |
| Readout | two lines (place on line 2) | one line | one line |
| View in Life | in ⋯ menu only | foot + menu | foot + menu |
| Hero counter | shown at hero scale (no sidebar) | shown at hero scale | hidden — sidebar module only (C5.3) |
| Nav | row under the bar, 12px | row under the bar | inline in the bar |
| Composer | full-height sheet | modal 560 | modal 560 |
| Kind buttons | glyph + 11px word, row scrolls | glyph + 11px word | glyph + 11px word |

---

## 7. Motion

| What | Duration / easing | Reduced motion |
|---|---|---|
| Hover / focus colour and border | 220ms, cubic-bezier(0.22,1,0.36,1) | instant |
| Respond press | scale 0.96, 160ms | no scale |
| Counter digit roll | 220ms ease-out, changed digits only | none below seconds; values still update |
| Composer open / close | opacity + 16px rise, 220ms | instant |
| Posted moment lands on the rule | opacity + 12px rise, 220ms; the page glides to it when within ~2.5 screens, jumps when farther; then focus to its readout | appears; plain jump; focus moves |
| Posting progress | 900ms linear fill in the button | same (it is information) |
| Link resolving | 700ms shimmer in a hairline | static hairline |
| Notes chevron | rotate 180°, 220ms | snaps |

Nothing animates on scroll or on entering the viewport.

---

## 8. Contrast (WCAG 2.1 AA; measured on the built preview)

All 38 measured text pairings pass. Notable values — Light: body text on sheet
17.98; muted on sheet 5.54; kind label 5.54; red active nav on white 4.88; navy
digits on card 5.87; red digits on card 4.80 (large text). Dark: body 17.30; muted
6.91; navy digits 8.43; red digits 3.77 — passes only because the digits are ≥
20px; **do not render red text smaller than 20px in dark mode.**

---

## 9. Five things not to do

1. **Do not box the entries.** No card, border, shadow or radius around a moment.
   The rule, the date hairlines and the separators are the structure; the sheet is
   the only container.
2. **Do not show — or ship — another person's exact age** or anything a reader
   could turn into a date of birth. Others get the band and a tick-less ring.
   Exact `y/m/d`, the day count, the Born row, the band's calendar years and the
   red tick belong to the viewer alone. This is a data rule, not a CSS rule: see §10.
3. **Do not spend red outside the budget.** Chrome (plate, active nav, primary
   button), the counter's years/hours, and in-feed now/unread/pressed marks. No red
   headers, links, icons, or small text.
4. **Do not crop or letterbox a photograph.** Media takes its own aspect within
   the height cap; portrait stands narrow, panorama runs wide and short.
5. **Do not animate content into view, do not use monospace, do not put adverts
   or notices in the stream, and never say "remaining", "left" or a percentage of
   a life.** Time not yet lived is unwritten.

---

## 10. Privacy data contract (C1) — visual rule AND API rule

**Visual rule.** A visitor's view of a person shows: name, verified mark, home
place, cover, the 15-year Circle band (`30–45`) and a band-level ring (no tick).
Never: Born row, birth time, exact age (`34y 10m 06d`), day count, next-round line,
contact, the calendar years of any band, the counter. Every Moment and Note
authored by someone else shows the band, never the exact age.

**API rule.** The payloads that render a visitor's view — profile-as-visitor, and
every Moment / Note whose author is not the signed-in person — MUST NOT contain
`birthDate`, `birthTime`, `birthTimeKnown`, any birth instant, exact-age
primitives, day counts, band calendar years or any field from which a birth date
can be derived. The server computes the band and its index and ships only that.
Own payloads may carry the exact position (computed server-side from the stored
birth truth). The browser must never receive another person's birth instant;
hiding a value with CSS or omitting it in a component is a defect, not a fix.

The prototype mirrors this with a single view model (`view-model.ts`:
`personViewFor`, `lifeViewFor`, `momentLifeFor`, `ringViewFor`) whose OTHER shape
has the restricted fields **absent**; the suite asserts that `04 NOV 1991`,
`06:42` and the day count appear nowhere in the visitor DOM in either mode at
desktop and 360px. Details and the rendering rule: interaction spec §10.

## 11. Chronology (C3) and date grammar (C2)

The ledger orders by the **moment's own date/time**, newest first — never by
posting time; one date rule per calendar day; a backdated moment sits at its
historical position with `shared today` beside its date. Every visible date,
including the display layer of date inputs, is `DD MON YYYY` (`10 SEP 2026`);
times are `HH:mm` and appear only on Moments with minute precision — a
date-only (backdated) Moment shows no time. Interaction spec §8 and content
rules §1, §4.
