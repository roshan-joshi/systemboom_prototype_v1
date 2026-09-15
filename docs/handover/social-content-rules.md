# SYSTEMBOOM Social — Content rules (copy and language)

Companion to the visual and interaction specifications. Every sentence the
interface speaks is listed here. Implement these strings verbatim; where a value
is inserted it appears in angle brackets.

## 1. Voice

Plain, first-person-adjacent, never chirpy. Sentences are short and end with full
stops. No exclamation marks anywhere in Social. The interface states facts and
offers one action; it does not encourage, congratulate or nag.

Numbers are always real and always full: `12,729 days`, never `~13k days` or
`1.1 billion`. Dates are `DD MON YYYY` with a three-letter uppercase month
(`04 NOV 1991`); times are 24-hour `HH:MM` as displayed (`07:40` — the date-fns
token is `HH:mm`); ages are `34y 10m 06d`; bands are
`30–45` (en dash). Nepali-language content keeps its own script and its own
digits (`भदौ २५, २०८३`); never transliterate a place name the person wrote.

## 2. The composer sentence

The inline bar and the composer placeholder read:

> **What happened at <exact age>?**   e.g. *What happened at 34y 10m 06d?*

It replaces "What's on your mind". It is the differentiator spoken as a question:
the person's exact position in their own life is the prompt, and it changes every
day. When a draft is kept the bar reads **Draft kept — continue your moment**.

Two alternatives were considered and rejected: *Place a moment in your life.*
(imperative; reads as an instruction) and *Where were you today, <name>?*
(place-first; the place is the second fact, not the first).

## 3. The readout grammar

Line one of every moment, in this order, separated by a middle dot:

`<name> · <exact age | band> · <place> · feeling <word> · <privacy> · edited · <time>`

- Exact age (`34y 10m 06d`) appears **only** on the viewer's own moments.
  Everyone else's moment shows the Circle band (`30–45`). No exception.
- The place is omitted when the moment has none. Nothing is invented.
- `feeling <word>` is lowercase and appears only when chosen.
- Privacy: public shows nothing; friends shows a small two-figure glyph; only-me
  shows the words **only you**.
- **edited** appears after any edit, before the time.

Line two (kinds), uppercase word then fields:

| Kind | Line |
|---|---|
| MEAL | `MEAL · <what> · <venue> · with <n>` |
| ACTIVITY | `ACTIVITY · <what> · <measure> · <duration>` |
| PROJECT | `PROJECT · <name> · <progress hairline> <n> of <m> · since <date>` |
| MEETING | `MEETING · with <first names> · <venue> · <duration>` |
| HEALTH | `HEALTH · <measurement> · <value> · only you` (the trailing `only you` appears when privacy is Only me — the default) |
| PROBLEM | `PROBLEM · <title> · <open \| resolved> · only you` (same rule) |

Plain moments have no line two.

## 4. Date rules

- Today: **TODAY** followed by the full date in small type: `TODAY  10 SEP 2026`.
- Any other day: the date alone: `06 FEB 1983`.
- A backdated moment carries a secondary label: **shared today** or
  **shared <dd mon yyyy>** in lowercase. The moment's own date always leads.
- A moment recorded from a date alone shows **no clock time** in its readout (day
  precision). The time appears only when it is real: recorded today, a trusted
  capture time, or a time the person gave.

## 5. The counter (MY LIFE IN)

- Title: **MY LIFE IN** (small capitals).
- Default face: `<years>y <months>m <days>d` over the hourglass over
  `<hours>h <minutes>m <seconds>s`. When the birth time is unknown the second row
  is replaced by **counted in days** and the instrument's single-unit cycle stops
  at days. Nothing is labelled "unavailable"; the instrument simply has fewer
  stops.
- Unit control label: **years · months · days** on the composite face, otherwise
  the unit word (`weeks`). The cycle ends at **seconds**; there is no milliseconds face. Hover/focus hint: **change unit**. Screen-reader
  announcement on change: **Showing <unit>.**
- Optional forward line: **Your <13,000>th day is in <268> days**. Forward only.

## 6. The Circle of Life module

- Title: **CIRCLE OF LIFE**. Centre: `<12,729>` over **DAYS**.
- Band readout: `band <30–45> · <2021>–<2036>`; on hover/focus of another band:
  `band <15–30> · <2006>–<2021> · <n> moments` / `· no moments recorded` /
  `· unwritten`.
- Activity line: **<3> moments recorded this month** / **No moments recorded this
  month yet**.
- Entry to Life: **Open Life** (links to the Circle of Life, Phase 5). The date line
  reads **today · <10 SEP 2026>** and is informational.
- On hover/focus of another band, a visitor's readout reads `band <15–30> · lived` /
  `· unwritten` — never a count.
- Never: "remaining", "left", "years to go", percentages, life expectancy. Time
  not yet lived is **unwritten**.

## 7. Hero

- Owner's contact pill label: **ONLY YOU SEE THIS** (small capitals), then phone
  and email. Never rendered to a visitor.
- Born line: `<04 NOV 1991> · <06:42 | birth time unknown> · <city>`.
- Visitor's band panel: **CIRCLE BAND** / `<30–45>` / **years — the exact age is
  theirs to share**. A visitor's hero has **no Born row**; its Circle line reads
  `Circle band <30–45>`; the Circle module centre reads the band over **BAND**.
- Visitor's counter card: **A person's counter is theirs to see.** / **Band
  <30–45>**.

## 8. Feed foot and notes

- The one visible act: **Respond** (mark + word, always both).
- Counts: `<n> responses`, `<n> notes`; singular `1 response`, `1 note`.
- No notes yet: the toggle reads **Write a note**.
- Empty thread sentence: **Nothing written here yet. A note stays with the moment.**
- Note field placeholder: **Write a note…**; reply placeholder: **Reply to <first
  name>…**. Helper (desktop): **Enter sends · Shift+Enter for a new line**.
- Failed note: **Couldn't send. Kept here.** · **Retry**.
- Collapsed thread: **View <n> more notes** / **Collapse**.
- Own note marker: **(you)**. Reserved slot: **View in Life** (disabled; tooltip
  *View in Life arrives in a later phase*).
- Load more: **Load more · <n> earlier**. End: **That's everything shared here so
  far. Earlier moments live in Life.**

## 9. Menus

- Own moment: **Edit** · **Change privacy** (Public / Friends / Only me) ·
  **Delete** · **View in Life — later**.
- Delete confirm: **Delete this moment? It leaves your life record too.** ·
  **Delete** · **Keep**.
- Someone else's moment: **Report** · **Hide** · **Copy link**.
- Confirmations: **Reported. Thank you — someone will look.** · **Link copied.** ·
  **Now <public | friends | only you>.**
- Global navigation is the brand alone. The bar reads **SYSTEMBOOM · MY WORLD**
  (Life reads **LIFE**); the mark's accessible name is "SYSTEMBOOM — Home. You
  are in My World." The hero's Circle row ends **Life →** and enters the Circle.
  The identity gate's action reads **Enter My World** (or **Continue to Life**).
  Never "Dashboard"; never "Social" as a user-facing label; the stream is
  **Moments**.
  Home leads to the person's World; World is this feed. Items without a
  destination are shown once, quietly, and are not links.
- The SYSTEMBOOM mark opens the scales: **Cosmos · World · Social · Life**, each
  with one line of hint, and `you are here` on the current one.
- Account menu: Statistics · Weather · Exchange · Settings (each marked **later**)
  · Logout.

## 10. Composer

- Title: **New moment** / **Edit moment**. Primary: **Post** / **Save**;
  **Posting…** while in progress. Secondary: **Cancel**.
- Privacy options: **Public** *anyone* · **Friends** *your people* · **Only me**
  *just you*.
- Kind hint for Health and Problem: **records a private fact — only you, unless
  you change it**.
- Photos: `<n> of 10`; at the limit: **10 of 10 — remove one to add another**;
  helper: **arrows reorder**.
- Video: `Video · <0:42> · 9:16`; option **Burn the date and place into the
  video**.
- Link: field **Paste a link**; when unresolvable: **No preview for this link — it
  stays as text.**
- The life readout: heading **WHERE THIS SITS** (manual) / **FROM THE PHOTO**
  (detected). Sentence: **This moment will sit at <25y 11m 02d> · <place | where
  was this?> · <today | 03 AUG 2026>**. Detected state: **Confirm** · **Change** ·
  *read from the file — confirm or change*. Backdated: **Placed in your past — its
  own date will lead, with "shared today" beside it.**
- Validation: **That date hasn't happened yet.** · **Add at least one photo — or
  write it as a plain moment.** · **Needed: <fields>.** · counter `<2,010> /
  2,000` turning to the danger colour.
- Failure: **Couldn't post. Your draft is kept.** · **Retry**.
- Discard: **Discard this moment?** · **Keep draft** · **Discard** · **Back**.

## 11. Notifications and search

- Panel title **NOTIFICATIONS**; **<n> unread**; **Mark all read**.
- Empty: **Nothing new. When someone responds or writes, it lands here.**
- Day groups: **Today** · **Yesterday** · otherwise the date.
- Search placeholder: **Search photos, people, places…**; groups **Recent** ·
  **Photos** · **Moments** · **People** · **Places**; empty: **Nothing for
  "<term>" yet.** Every result carries its life context: a photo its date, a
  Moment its date, a person their life ring with exact age (own) or band
  (others) and home city, a place **<n> Moments** / **no Moments recorded**.
- Notification rows read: **<name> <what they did>**, then the Moment's own
  coordinate **<DD MON YYYY> · <place>**, then the time. Never a relative
  "2 hours ago", never a second date inside the sentence.

## 12. Words that never appear

*Like*, *post* as a noun for a moment (it is a **moment**), *comment* (it is a
**note**), *timeline*, *feed* in user-facing copy (it is **your moments** / what
is **shared here**), *remaining*, *left*, *countdown*, *you have N years*, any
security or encryption claim, any exclamation mark.
