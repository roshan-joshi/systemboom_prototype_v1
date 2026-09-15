# SYSTEMBOOM Social — Reference capture index

Phase 4.2 · 2026-09-11. The authoritative evidence for the live developer. Every
capture below was produced by `prototype-tests/social-final.js` or
`prototype-tests/social-devanagari-crops.js` against the accepted 4.1 build on
2026-09-11 (regenerate with `node prototype-tests/social-final.js` while the dev
server runs on port 3210). Paths are under `prototype-evidence/phase-04-final/`
(gitignored; `phase-04-final.zip` is the same set archived).

Viewports: the suite renders the page at 1.5× device scale in a 420px (360 frame),
900px (768 frame) or 1440px window; the design frame is what matters. "Mock" lists
what in the capture is fixture content — copy the structure, never the content.

In every capture the following is **mock and must not be copied**: the names,
photos, places, bodies and counts; the sticky harness strip at the top (Width /
Viewer / Bell / simulate failure / Reset / theme) when present; the round dev badge
bottom-left; the exact numbers in the counter and Circle (they are date-dependent).

---

## A. Page composition

| File | Viewport | Mode | Shows | Copy | Spec |
|---|---|---|---|---|---|
| `feed-light-desktop.png` | desktop (1440) | light | Owner page, full length: top bar, hero, sheet with ledger, sticky sidebar (counter, Circle), Load more | grid, sheet radius/shadow, rule, date rules, readout grammar, media aspect behaviour, sidebar cards | visual §3, §5; wireframes §1 |
| `feed-dark-desktop.png` | desktop | dark | Same page in Deep Cosmos: no sheet, glass bar, flat cards | dark tokens, glass only on the bar, red dot on active nav | visual §1, §5.1 |
| `feed-light-768.png` | 768 | light | Tablet: hero with counter box, Circle card, sheet | single-column order, nav row, gutter 40 | visual §6; QA TABLET |
| `feed-dark-768.png` | 768 | dark | Tablet dark | same | same |
| `feed-light-360.png` | 360 | light | Phone: hero with counter, Circle, sheet; two-line readouts; edge-to-edge media; Respond word visible | everything in QA 360 MOBILE | wireframes §2; visual §6 |
| `feed-dark-360.png` | 360 | dark | Phone dark | same | same |
| `feed-end-light-desktop.png` | desktop | light | Fully loaded ledger down to the 1983 moment and the end sentence | chronology across Load more, "shared …" provenance, end copy | interaction §8; content §8 |
| `theme-toggled-midscroll.png` | desktop | dark (toggled from light) | Theme switched live mid-scroll | tokens swap without reload; scroll kept | interaction §7 |

## B. Profile hero

| File | Viewport | Mode | Shows | Copy | Spec |
|---|---|---|---|---|---|
| `feed-light-desktop.png` (top) | desktop | light | **Owner hero**: cover, ring avatar with tick, name + navy check, Born / Circle / Contact pill, no counter at desktop | owner readout rows, ONLY YOU SEE THIS pill, no hero counter at desktop | visual §5.2; content §7 |
| `corrections/visitor-hero-light-desktop.png` | desktop | light | **Visitor hero** (Bikash viewing Maya): name, place, "Circle band 30–45", CIRCLE BAND box, tick-less ring; sidebar counter card reads the sentence; Circle module band-only | the visitor shape exactly | visual §5.2, §10; wireframes §7; QA PROFILE — VISITOR |
| `corrections/visitor-hero-dark-desktop.png` | desktop | dark | Visitor hero dark | same | same |
| `corrections/visitor-hero-light-360.png` | 360 | light | Visitor hero on a phone; no counter card below | phone visitor composition | same |
| `corrections/visitor-hero-dark-360.png` | 360 | dark | same, dark | same | same |
| `corrections/visitor-circle-module.png` | desktop | light | Visitor Circle module close-up: band in the centre, no tick, no years | visitor module | visual §5.4 |
| `hero-asha-light.png` / `hero-asha-dark.png` | desktop | light / dark | Owner with **unknown birth time**: Born row "birth time unknown"; counter shows "counted in days" | the honesty rule presentation | content §5, §7 |
| `hero-visitor-light.png` / `hero-visitor-dark.png` | desktop | — | **SUPERSEDED — DO NOT IMPLEMENT.** Pre-4.1 visitor hero (2026-09-10) which still carried a Born row. Kept for history; use `corrections/visitor-hero-*`. | nothing | — |

## C. Moments, media, foot

| File | Viewport | Mode | Shows | Copy | Spec |
|---|---|---|---|---|---|
| `feed-light-desktop.png` (entries) | desktop | light | Plain, MEAL, ACTIVITY, HEALTH (no Respond, "only you"), video 9:16, PROJECT with progress hairline | readout line 1 / kind line 2, foot layout, media at own aspect | visual §5.5, §3; content §3 |
| `corrections/devanagari-360-light.png` / `-dark.png` | 360 | light / dark | A Devanagari moment at phone width: place line, body, photo edge-to-edge | mixed-script baseline and weight | visual §2; QA DEVANAGARI |
| `corrections/devanagari-360-light-body-crop.png` / `-dark-body-crop.png` | 360 | light / dark | Close crop of the Devanagari body text | glyph rendering reference | same |
| `respond-who-list.png` | desktop | light | Who-responded popover with 24px band-level rings | popover styling, ring-only identity | visual §5.7; interaction §3 |
| `menu-own-privacy.png` | desktop | light | Own ⋯ menu with Change privacy radio open | menu tokens, radio dots, "View in Life — later" disabled | visual §5.7; content §9 |
| `menu-delete-confirm.png` | desktop | light | Inline delete confirm inside the menu | sentence + Delete / Keep pills | interaction §3 |
| `notes-forty-expanded.png` | desktop | light | A 40-note thread fully expanded, replies at depth 2 | note row anatomy, indent, Reply on top level only | visual §5.6; interaction §4 |
| `note-failed.png` | desktop | light | Failed note send with Retry, text kept | failure copy and placement | content §8 |

## D. Composer

| File | Viewport | Mode | Shows | Copy | Spec |
|---|---|---|---|---|---|
| `composer-empty-light-desktop.png` | desktop | light | Open modal, empty: readout box first, text area, feeling + counter, seven kinds with words, footer | body order, modal geometry | visual §5.8; composer-states |
| `composer-empty-dark-360.png` | 360 | dark | Full-height sheet, empty | phone shell | same |
| `corrections/composer-kind-row-360-light.png` / `-dark.png` | 360 | light / dark | Kind row at 360 with the words (row scrolls) | glyph + 11px word at every width | visual §5.8; QA KINDS |
| `corrections/composer-date-closed.png` | 360 | light | Composer with the date field displaying `11 SEP 2026` | date grammar in inputs | visual §11; content §1 |
| `composer-kind-meal.png` … `composer-kind-meeting.png` (6) | desktop | light | Each kind's fields revealed | field sets, order, required marks | interaction §2; content §3 |
| `composer-detected.png` | desktop | light | FROM THE PHOTO readout with Confirm / Change | detection state (optional in live) | composer-states READOUT |
| `composer-thumbs.png` | desktop | light | Three thumbnails at own aspect with reorder/remove | strip anatomy | visual §5.8 |
| `composer-limit.png` | desktop | light | Ten photos: "+" disabled, limit sentence | limit copy | content §10 |
| `composer-video.png` | desktop | light | Video preview with the burn-in toggle | video panel | interaction §2 |
| `composer-link.png` | desktop | light | Resolved link preview card | link card anatomy | visual §3 |
| `composer-feeling.png` | desktop | light | Feeling list open | list styling | interaction §2 |
| `composer-privacy.png` | desktop | light | Privacy options with descriptors | Public / Friends / Only me copy | content §10 |
| `composer-overlimit.png` | desktop | light | Counter in danger colour, Post disabled | validation | content §10 |
| `composer-future.png` | desktop | light | "That date hasn't happened yet." | validation | content §10 |
| `composer-backdated.png` | desktop | light | Past-placement notice | copy | content §10 |
| `corrections/backdated-before-post.png` | desktop | light | Composer with `14 JUL 2019` before posting | the flow's start | interaction §8 |
| `corrections/backdated-after-post.png` | desktop | light | The moment landed at 14 JUL 2019 — "shared today", after 17 OCT 2022, before "Load more · 1 earlier" | chronology landing | interaction §8; wireframes §6 |
| `composer-posted-landed.png` | 360 | dark | A ten-photo moment landed at `03 AUG 2026 · shared today` with focus on its readout | landing on a phone | same |
| `composer-failed.png` | desktop | light | "Couldn't post. Your draft is kept." · Retry | failure state | content §10 |
| `composer-discard.png` | desktop | light | Discard confirm replacing the footer | Keep draft / Discard / Back | content §10 |
| `composer-edit.png` | desktop | light | Edit mode prefilled (Devanagari intact), primary "Save" | edit shell | interaction §2 |

## E. Counter and Circle

| File | Viewport | Mode | Shows | Copy | Spec |
|---|---|---|---|---|---|
| `feed-light-desktop.png` (sidebar) | desktop | light | Composite face, hourglass, unit control, next-round line; Circle ring with day count, band readout with years, date field `11 SEP 2026`, settings, Open Life — later | both sidebar cards | visual §5.3, §5.4 |
| `counter-days.png` | desktop | light | Single-unit face: days | digit size by count, unit word | visual §5.3 |
| `counter-seconds.png` | desktop | light | Single-unit face: seconds (the last face) | same | same |
| `reduced-motion-seconds.png` | desktop | light | Seconds face under `prefers-reduced-motion` — no roll, values live | reduced-motion behaviour | visual §7 |
| `ring-hover-band.png` | desktop | light | Circle arc hovered: outline + band readout with years and moment count | arc hover state (owner) | visual §5.4; interaction §6 |
| `counter-milliseconds.png` | — | — | **REMOVED** — the milliseconds face no longer exists (C5.2). If you find it in an archive: DO NOT IMPLEMENT. | — | — |

## F. Chrome

| File | Viewport | Mode | Shows | Copy | Spec |
|---|---|---|---|---|---|
| `notifications-seed.png` | desktop | light | Panel with unread dots, grouped by day | panel anatomy | visual §5.9 |
| `notifications-many.png` | desktop | light | Dense panel | scrolling density | same |
| `notifications-empty.png` | desktop | light | Empty sentence | copy | content §11 |
| `notifications-dark-360.png` | 360 | dark | Panel on a phone, dark | full-width panel | visual §5.9 |
| `search-recent.png` | desktop | light | Field focused: Recent list | recent state | visual §5.10 |
| `search-results.png` | desktop | light | Grouped results (Photos · Places) | group headings, thumbnails | same |
| `search-empty.png` | desktop | light | "Nothing for "<term>" yet." | copy | content §11 |
| `avatar-menu.png` | desktop | light | Account menu: Statistics · Weather · Exchange · Settings (later) · Logout | menu, "later" markers | content §9 |

## G. Data

| File | Shows | Use |
|---|---|---|
| `contrast.json` | 38 measured text pairings with ratios, both modes | verify your build against the same pairings; none may fall below AA |

## H. Superseded — historical only

| Path | Status |
|---|---|
| `pass1/`, `pass2/`, `pass3/` | **SUPERSEDED — DO NOT IMPLEMENT.** Iteration crops from the three Phase 4 review passes (2026-09-10): pre-C1 hero, pre-C4 icon-only kind rows, pre-C5.2 counter. Kept to show the reasoning; nothing in them overrides the root captures. |
| `hero-visitor-light.png`, `hero-visitor-dark.png` | **SUPERSEDED — DO NOT IMPLEMENT** (see §B). |
| Any capture dated before 2026-09-11 found in an archive or a chat thread | superseded by the same-named file in this set |

## I. Not capturable

- The **native date picker's open state** (composer date, project since, the Circle's Jump to date):
  headless Chrome renders it outside the page surface. The design is the native picker
  beneath the styled `DD MON YYYY` display; there is deliberately no custom picker
  screenshot to copy.
- Video playback, link unfurling from a real URL, and real photo EXIF detection are
  outside the prototype (see README §C).
