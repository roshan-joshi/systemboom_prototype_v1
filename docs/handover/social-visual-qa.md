# SYSTEMBOOM Social — Visual implementation checklist (QA)

Phase 4.2 · 2026-09-11. Hold this beside the live site. Every line is PASS / FAIL.
Values in backticks are part of the accepted design; a different value is a FAIL
unless the owner has approved an exception recorded in `AGENTS.md`. Reference
captures for each section are indexed in `social-reference-index.md`.

Breakpoints are container widths: phone `< 672px` · tablet `672–1023px` · desktop
`≥ 1024px`. Check at 360, 768 and ≥ 1280.

---

## GLOBAL

- [ ] Family is Geist; Devanagari falls to Noto Sans Devanagari with the weight offset (400→500, 500→600, 600→700). No monospace anywhere in Social.
- [ ] Every number uses tabular numerals (`font-variant-numeric: tabular-nums`).
- [ ] Dates read `DD MON YYYY` (`10 SEP 2026`) everywhere, including the display layer of date inputs. No `10/09/2026`, no `Sep 10, 2026`, no relative "3 hours ago" on moments.
- [ ] Times read 24-hour `HH:MM` (`07:40`).
- [ ] Ages read `34y 10m 06d` (zero-padded month and day). Bands read `30–45` with an en dash.
- [ ] Global navigation is the **Brand** alone — the SYSTEMBOOM mark (a link Home to Cosmos) with one context word, `MY WORLD` or `LIFE`, top-left. No destination menu, no row, no bottom tabs. "Dashboard" and "Social" appear nowhere as user-facing labels.
- [ ] No exclamation mark anywhere in Social copy.
- [ ] The words Like, Post (noun), Comment, Timeline, Feed, Remaining, Left, Countdown appear nowhere in user-facing copy (content rules §12).
- [ ] Time not yet lived is called **unwritten**; no "remaining", no percentage of a life, no life expectancy.
- [ ] Focus ring on every focusable element: 2px solid `#1E66D0` (light) / `#7DB8FF` (dark), 2px offset, radius 6px.
- [ ] Nothing animates on scroll or on entering the viewport.
- [ ] No adverts, system banners or onboarding cards inside the stream.

## LIGHT

- [ ] Page field `#F5F5F6`. The sheet and cards `#FDFDFD`. Raised (fields, menus) `#FFFFFF`.
- [ ] Text `#0F1520`, muted `#5A6880`, steel `#55708F`, ice `#33517A`, navy `#3D678C`, unit grey `#39454E`.
- [ ] Hairlines `rgba(15,21,32,.14)`; the time rule and date rules `rgba(15,21,32,.22)`.
- [ ] Nav is a flat white bar with a 1px bottom hairline `rgba(15,21,32,.06)` — **not glass, no blur, no shadow**.
- [ ] The logo sits on a red plate `#D92A20`, radius 14px.
- [ ] Sheet radius 24px; hero card 32px (24px on phones); sidebar cards 24px; one soft shadow `0 8px 28px -18px rgba(30,45,70,.25)`; no borders on cards.
- [ ] Red budget — red appears ONLY as: logo plate, active nav text, primary button (Post / Save), the viewer's ring tick, unread dots, the pressed Respond mark, the counter's years/hours digits, the active kind button's soft fill `rgba(217,42,32,.10)`. No red headers, links, icons or small text.
- [ ] Nothing glows. No gradient decoration.

## DARK

- [ ] Page `#0A0D14`; no sheet — entries sit on the page. Cards `#10141E` with a 1px `rgba(142,155,176,.18)` edge, no shadow. Raised `#151A27`.
- [ ] Text `#EEF2F8`, muted `#8E9BB0`, steel `#7E93AE`, ice `#C9D8EA`, navy `#8FB3D9`, unit grey `#C9D8EA`.
- [ ] Glass exists on the top bar only: `rgba(15,19,29,.66)` + `blur(20px) saturate(1.5)`, 1px edge `rgba(201,216,234,.10)`, radius 16px, floating 12px from the edges. No glass on cards, menus, composer or media.
- [ ] Active nav item is text-coloured with a 6px red dot (not red text).
- [ ] Red text is never rendered smaller than 20px (contrast 3.77 passes only as large text).
- [ ] No neon, no glow borders, no HUD brackets, no scanlines.

## DESKTOP (≥ 1024)

- [ ] Content column max 1120px. Hero spans the column; below it a grid `minmax(0,1fr) 300px`, gap 24px — sheet left, sticky sidebar right.
- [ ] Sidebar order: MY LIFE IN, then CIRCLE OF LIFE.
- [ ] The hero shows **no counter** at desktop (the sidebar module is the only counter).
- [ ] The brand sits top-left with MY WORLD beside it; the search field is a pill, max 360px. No navigation row.
- [ ] Composer is a centred modal, 560px (92% max), top 32px, radius 24px, scrim `rgba(10,13,20,.42)`.
- [ ] Readout is one line; place truncates, name / age / time never do. View in Life appears (disabled) in the foot.

## TABLET (672–1023)

- [ ] Single column: hero (carrying the counter at hero scale), then the Circle card, then the sheet.
- [ ] The brand keeps its top-left anchor; there is no navigation row at any width.
- [ ] Gutter 40px, rule at x = 19px; media from the gutter to the column edge, radius 4px.
- [ ] Composer is the 560px modal.
- [ ] Kind buttons carry their words.

## 360 MOBILE

- [ ] Single column: hero (with counter), then the sheet, then the Circle card — the stream starts within the first screen or two. Exactly one counter on the screen.
- [ ] One compact bar reading `SYSTEMBOOM · MY WORLD` plus search, bell, theme and account (36px targets; the inert chat placeholder steps aside below 672px); no navigation row and no horizontal page scroll.
- [ ] Gutter 28px, rule at x = 13px. Media bleeds to the sheet's edges (radius 0) except Health / Problem media (inset, radius 4).
- [ ] Readout is two lines: name · age/band · time on line one; place · feeling on line two. Nothing truncates to a stub.
- [ ] **Respond word is visible** (mark + word), foot wraps: acts left, then the right group (⋯). View in Life is in the ⋯ menu only.
- [ ] Composer is a full-height sheet; the kind row scrolls horizontally and every button keeps its 11px word.
- [ ] Devanagari place names and bodies render without clipping (see DEVANAGARI).
- [ ] The page body never scrolls horizontally.

## NAVIGATION AND SHELL

- [ ] The mark goes Home to Cosmos; the hero's Circle row reads `band 30–45 · 12,731 days · Life →` and enters `/life`; there is no separate home button and no destination menu anywhere.
- [ ] Every navigation link resolves to a real route; nothing points at `#`.
- [ ] Destinations that do not exist are disabled, named and titled — never linked, never invented.
- [ ] The active destination carries `aria-current="page"` and is marked by colour **and** a dot.
- [ ] Nav says World, never Dashboard.
- [ ] World, Social and Life share one shell grammar: mark, primary nav, theme, nothing else.
- [ ] The theme choice survives every move between Social, World, Life and Cosmos; no flash on entry.
- [ ] No WebGL canvas and no three.js bundle behind Social, World or Life.
- [ ] Search results carry dates, place tallies and band-safe life position.
- [ ] Notification rows name the Moment by its own date and place.

## PROFILE — OWNER

- [ ] Cover photo at its own aspect, max height 160px (phone) / 260px; owner actions (people, camera) top-right in 36px dark discs.
- [ ] Ring-framed avatar 72 / 96px overlapping the cover by 40 / 56px, 3px card-coloured pad; camera badge bottom-right.
- [ ] Name 24 / 30px 600 with the navy verified check (20px).
- [ ] Readout rows: **Born** `04 NOV 1991 · 06:42 · Kathmandu` (or `· birth time unknown`) · **Circle** `band 30–45 · 12,729 days` · **Contact** pill labelled `ONLY YOU SEE THIS` with phone and email.
- [ ] The owner's ring has the red now-tick.
- [ ] Below desktop: the counter at hero scale inside a 20px-radius hairline box. At desktop: no counter in the hero.
- [ ] Composer bar is present at the top of the sheet: `What happened at 34y 10m 06d?` (or `Draft kept — continue your moment`).

## PROFILE — VISITOR

- [ ] No Born row. No birth time. No day count. No contact pill. No definition list at all.
- [ ] Name, verified check, home place, one line `Circle band 30–45`, and the CIRCLE BAND box (`30–45` 24px 600, "years — the exact age is theirs to share").
- [ ] The avatar ring is drawn at band level: lived bands ice, the current band whole, **no red tick**.
- [ ] Circle module centre reads the band over BAND; readout `band 30–45` with **no calendar years** and **no counts** (hover reads `lived` / `unwritten`); no date line, no settings, no "Open Life".
- [ ] Desktop sidebar counter card reads "A person's counter is theirs to see. / Band 30–45" — no digits. Below desktop there is no counter card.
- [ ] No composer bar for a visitor.
- [ ] Search the page source: `04 NOV 1991`, `06:42`, the day count and any DOB never appear in the DOM or in network payloads for another person.

## FEED

- [ ] One continuous white sheet (light) holds the whole ledger; entries are separated by 1px hairlines with 24px above and below. **No card, border, shadow or radius around any moment.**
- [ ] A single 1px vertical time rule runs the full height of the entries; rings and date labels sit on it with a 2px sheet-coloured pad so the line appears to pass behind them. The rule is visually continuous — no gaps between entries.
- [ ] Entries are ordered by the **moment's own date/time, newest first** — never by posting time.
- [ ] One date rule per calendar day; a day never repeats lower in the ledger.
- [ ] Today's rule reads `TODAY` with the full date beside it in 12px; other days read the date alone (18px 600).
- [ ] A backdated moment appears at its own chronological date with `shared today` / `shared dd mon yyyy` beside its date rule.
- [ ] After posting, the ledger settles on the new moment (glide when near, jump when far) and focus lands on its readout.
- [ ] Load more reads `Load more · n earlier`; the end reads `That's everything shared here so far. Earlier moments live in Life.`
- [ ] Other people's Only-me moments and hidden moments never render.

## MOMENT

- [ ] Line 1 (13px): 24px life ring on the rule · name (500) · exact age (own, 500) **or** band (others, muted) · place · `feeling <word>` · privacy (nothing / two-figure glyph / `only you`) · `edited` · time right-aligned.
- [ ] Another person's exact age never appears — on moments, notes, who-lists, notifications or search.
- [ ] Line 2 (kinds): uppercase kind word (11px 600 +0.14em muted) then fields at 13px. PROJECT shows a 40px progress hairline with `n of m`.
- [ ] Body 16/1.55 (17/1.6 ≥ 672px), measure ≤ 66ch; over 420 characters truncates with "more" / "less".
- [ ] Foot: Respond pill (36px, hairline) · `n responses` · `n notes ▾` or `Write a note` · View in Life (disabled, dashed dot, 60%) · ⋯ (36px disc).
- [ ] Own ⋯ menu: Edit · Change privacy (Public / Friends / Only me radio) · Delete (inline confirm: "Delete this moment? It leaves your life record too." Delete / Keep) · View in Life — later.
- [ ] Others' ⋯ menu: Report · Hide · Copy link · View in Life — later.
- [ ] Menus: Raised fill, 1px hairline, radius 14px, shadow `0 12px 32px -16px rgba(0,0,0,.45)`, items 13px.

## MEDIA

- [ ] A single photo keeps its own aspect inside a 480px max height. **Never letterboxed, never cropped.** Portrait stands at its own width on the left; panorama runs wide and short.
- [ ] Multiple photos: two-column grid, 2px gaps, tiles at their own aspect (max 320px tall); the fourth tile overlays `+N` when more than four; tapping shows all; "Show fewer" collapses.
- [ ] Video: poster at its own aspect (9:16 allowed), 56px play disc, duration chip bottom-left, burned-in caption chip when present.
- [ ] Link: hairline card, 96–128px thumbnail left, host in 11px caps, title 14/1.35 500 (two lines), description 13/1.4 muted.
- [ ] Health / Problem media never bleed: inset from the gutter, radius 4px at every width.
- [ ] Phone: photos bleed to the sheet's edges (radius 0). ≥ 672px: gutter → column edge, radius 4px.

## RESPOND

- [ ] One reaction only. The mark is a 10px ring that fills red when pressed; no heart, no thumb, no reaction picker, no reaction set.
- [ ] The word **Respond** is always visible beside the mark, at every width.
- [ ] Pressed state: fill `rgba(217,42,32,.10)` (light) / `.16` (dark), transparent border; press scale 0.96 for 160ms (none under reduced motion).
- [ ] Count reads `n responses` / `1 response`; tapping it opens the who-responded popover with 24px rings (band-level for others).
- [ ] **Health and Problem moments contain no Respond control** and no substitute.

## NOTES

- [ ] Called notes, never comments. Indented 14px past the gutter; rows: 20px ring · name (500) · `(you)` · text · time (12px muted) · `edited` · Respond (8px mark + count) · Reply (top level only) · ⋯.
- [ ] Depth is one level: a reply cannot be replied to. Replies indent a further 32px.
- [ ] Collapsed: three top-level notes; `View n more notes` / `Collapse`.
- [ ] Composer row: 20px ring · auto-growing field with a bottom hairline · feeling and image glyphs · Send (phone only) · helper `Enter sends · Shift+Enter for a new line` (≥ 672px).
- [ ] Empty thread: `Nothing written here yet. A note stays with the moment.`
- [ ] Failed send: `Couldn't send. Kept here.` · Retry, text preserved.
- [ ] Note text over 280 characters truncates with "more".
- [ ] Note authors show a ring only — no age text of any kind.

## COMPOSER

- [ ] Closed: the bar on the rule reads `What happened at <exact age>?` — the sentence alone, no instrument icons.
- [ ] Open, in this order: author row (32px ring, privacy pill) → **the life readout box** (WHERE THIS SITS / FROM THE PHOTO, sentence with the age in 500, date `DD MON YYYY` and place fields) → text area → `feeling` + `0 / 2,000` → seven kind buttons with words → kind fields → media panel (Photos · Video · Link) → footer Post / Cancel / `⌘↵ posts`.
- [ ] Desktop: modal 560px. Phone: full-height sheet. Escape closes the top-most layer only.
- [ ] Post is disabled until valid; while posting a white 25% fill sweeps left→right over 900ms and the label reads `Posting…`.
- [ ] Backdating shows `Placed in your past — its own date will lead, with "shared today" beside it.`; a future date shows `That date hasn't happened yet.` and disables Post.
- [ ] Over 2,000 characters: the counter turns danger-coloured and Post disables.
- [ ] Closing with content asks `Discard this moment?` · Keep draft · Discard · Back; a kept draft changes the bar to `Draft kept — continue your moment`.
- [ ] Failure: `Couldn't post. Your draft is kept.` · Retry.
- [ ] Edit reopens the same composer prefilled; primary reads Save; the moment then shows `edited`.
- [ ] Photo detection (if implemented): heading FROM THE PHOTO, Confirm / Change, Post disabled until one is chosen. The manual path always exists.

## KINDS

- [ ] Seven buttons in this order: media · meal · activity · problem · health · project · meeting. Single-ink glyphs at 17px inside 40px hairline discs; the active one has the red-soft fill.
- [ ] **Every button has its word beneath at every width** (11px 500 muted). Icons-only is a FAIL.
- [ ] Choosing the same kind again clears it.
- [ ] Health and Problem switch privacy to Only me unless the person already chose a privacy; leaving them restores it. Hint: `records a private fact — only you, unless you change it`.
- [ ] Kind fields in the specified order with required marks: MEAL what* · venue · with; ACTIVITY what* · measure · duration; PROBLEM title* · status; HEALTH measurement* · value*; PROJECT name* · progress · since (date, `DD MON YYYY`); MEETING with* · venue · duration.
- [ ] No kind has its own colour. Kind identity is the word; the glyph is secondary.

## COUNTER (MY LIFE IN)

- [ ] Appears **exactly once** at each breakpoint: hero (phone, tablet) or sidebar module (desktop).
- [ ] Title `MY LIFE IN` (11px caps). Composite face: `34y 10m 06d` (44px; hero ×0.68) · hairline–hourglass–hairline (hourglass 18px, red) · `09h 18m 56s` (30px).
- [ ] Unit colours: years/hours red, months/minutes navy, days/seconds unit grey — the ring's legend.
- [ ] Unit control beneath: 32px pill, `years · months · days` or the unit word with ▾; hover/focus reveals `change unit`.
- [ ] Faces cycle composite → years → months → weeks → days → hours → minutes → **seconds** → composite. **No milliseconds face.**
- [ ] Unknown birth time: second row reads `counted in days`; the cycle stops at days. Nothing says "unavailable".
- [ ] Digit roll 220ms on changed digits only; hours/minutes/seconds tick each second.
- [ ] Optional forward line `Your 13,000th day is in 270 days` — forward only, never "remaining".
- [ ] Numbers are full and real: `12,729`, never `~13k`.

## CIRCLE

- [ ] A ring, not a pie. Ten arcs (36° minus a 4° gap), birth at 12 o'clock, clockwise. Stroke 2px (20–32px rings), 3px (60–96px), 10px (220px).
- [ ] Lived bands ice at opacity `0.35 + 0.65 × (moments in band ÷ max)`; unwritten bands steel at 0.18; the owner's current band split at the exact position.
- [ ] Owner only: red tick (2px, 3px at 220px, stroke + 4px long) at `days lived ÷ (150 × 365.25) × 360°`.
- [ ] Owner module: `12,729` over DAYS in the centre; readout `band 30–45 · 2021–2036`; hover/focus another band → its years and `n moments` / `no moments recorded` / `unwritten`; activity line; informational `today · DD MON YYYY` line (not a picker); settings disc; `Open Life` links to the full Circle of Life.
- [ ] Visitor module: band over BAND in the centre; readout `band 30–45` without years; **no tick**; nothing else.
- [ ] Never a percentage, never "remaining"; ten bands, not eight; no rainbow band colours.
- [ ] The same component draws the 24px avatar rings and the 220px module ring.

## DEVANAGARI

- [ ] Devanagari text (`स्वयम्भू, काठमाडौँ`, `भदौ १९`) renders in Noto Sans Devanagari at the offset weight — conjuncts, matras, chandrabindu and the danda intact; no tofu, no fallback to a system Devanagari of a different weight.
- [ ] Devanagari digits stay Devanagari (`२०८३`); Latin digits stay tabular.
- [ ] Mixed lines (Latin name · Devanagari place) sit on one baseline with one visual weight.
- [ ] Place names written in Devanagari are never transliterated.
- [ ] Editing a Devanagari moment round-trips the text unchanged.

## REDUCED MOTION

- [ ] With `prefers-reduced-motion: reduce`: no digit roll (values still update), no Respond press scale, composer appears without movement, posted moment appears in place (plain jump to it), notes chevron snaps, link resolving shows a static hairline.
- [ ] Hover reveals still work (opacity only).
- [ ] The counter stays live under reduced motion.

## ACCESSIBILITY

- [ ] Every control is reachable by Tab in the documented order; focus is visible everywhere.
- [ ] Composer traps focus; Escape closes the top-most layer; focus returns to the composer bar on close.
- [ ] Menus: arrow keys move, Escape closes, focus returns to ⋯. Change privacy items are `menuitemradio`.
- [ ] Counter unit control: ←/→ cycle faces; polite announcement `Showing <unit>.`
- [ ] Circle arcs are focusable and announce `Band <label> years, <y0>–<y1>, <n> moments recorded` (owner) — years omitted for a visitor.
- [ ] Notes field: Enter sends, Shift+Enter newline; Send button present on phones.
- [ ] Images carry alt text; decorative rings and rules are `aria-hidden`.
- [ ] Contrast: all text pairings ≥ AA (38 measured in the prototype; red small text is never used).
- [ ] The brand's accessible name states both facts ("SYSTEMBOOM — Home. You are in My World."); it is the first named Tab stop with a visible focus ring.
