# SYSTEMBOOM Social — Interaction specification

Every state machine as text, every transition, every keyboard behaviour. Stack-
agnostic; pairs with `social-visual-spec.md` (appearance) and
`social-content-rules.md` (copy). "Phone" is any viewport narrower than 672px.

## 1. Page

States: `viewing-own` (owner) · `viewing-other` (visitor). The owner view shows
the composer bar, the contact pill, the counter and exact ages on own moments; the
visitor view hides the composer bar and contact pill and shows bands only.

Layers, top-most first: composer (modal/sheet) → popovers and menus →
notifications panel → search results → page. **Escape always closes the top-most
layer only.** Opening a layer moves focus into it; closing returns focus to the
control that opened it.

## 2. The composer

```
CLOSED ──tap bar / Enter on bar──────────────────────► OPEN.EMPTY
CLOSED ──"Edit" on own moment────────────────────────► OPEN.EDIT (prefilled; primary reads Save)

OPEN.EMPTY   text="" · kind=none · privacy=Public · media=[] · Post disabled
  type text ─────────────────────────────────────────► OPEN.READY (Post enabled if valid)
  choose kind k ─────────────────────────────────────► OPEN.KIND[k]  (fields appear; choosing k again clears it)
       k ∈ {health, problem} and the person has not chosen a privacy themselves ─► privacy := Only me
       leaving health/problem (privacy still untouched) ─► privacy restored to what it was
  Photos & video ────────────────────────────────────► picker open (grid of the library)
       select photo (n<10) ────────────────────────► thumbs strip, n of 10
       n = 10 ──────────────────────────────────────► "+" disabled, line "10 of 10 — remove one to add another"
       first selected photo carries a file date ────► READOUT.DETECTED
  Video ─────────────────────────────────────────────► preview + duration + "Burn the date and place" toggle → caption field
  Link → paste/type URL ─────────────────────────────► RESOLVING (700 ms) → PREVIEW (editable title, ✕) | PLAIN
  feeling ───────────────────────────────────────────► list; choose → readout gains "· feeling <word>"
  privacy ▾ ─────────────────────────────────────────► list Public / Friends / Only me
  ✕ or Cancel
       nothing entered ────────────────────────────► CLOSED
       content ────────────────────────────────────► CONFIRM.DISCARD → Keep draft (bar: "Draft kept") | Discard | Back

READOUT (always visible)
  MANUAL     today · viewer's home place (or "where was this?")
  DETECTED   date+place from the file; Post disabled until Confirm (adopt) or Change (edit manually)
  BACKDATED  date < today → notice appended; the posted moment carries sharedAt = now and atPrecision = "day" (no clock shown)
  FUTURE     date > today → "That date hasn't happened yet."; Post disabled

VALID when: text or media or link present · no required kind field empty · ≤2,000 chars · not FUTURE · not DETECTED-unconfirmed

Post ──────────────────────────────────────────────► POSTING (button fills left→right, "Posting…", controls disabled, ~900 ms)
  success ─────────────────────────────────────────► CLOSED; the moment appears on the rule at (sharedAt ?? date) with a 220 ms rise; focus → its readout
  failure ─────────────────────────────────────────► FAILED: "Couldn't post. Your draft is kept." · Retry (draft intact)
Save (edit) ───────────────────────────────────────► moment updated; readout shows "edited"
```

Kind field sets (order fixed; * required): MEAL what*, venue, with · ACTIVITY
what*, measure, duration · PROBLEM title*, status(open|resolved) · HEALTH
measurement*, value* · PROJECT name*, progress(n of m), since(date) · MEETING
with*, venue, duration.

Photo limit 10. Reorder: ← → controls on each thumbnail (drag may be added in the
live build; the buttons must exist). Remove: ✕ on each thumbnail. Mixed aspect ratios are shown at their
own aspect in a 96px-tall strip.

Keyboard: focus enters the text area on open. Tab order: close → privacy → text
→ feeling → kind buttons → kind fields → media controls → thumbnails → readout
Change/Confirm → Post → Cancel. ⌘/Ctrl+Enter posts when valid. Escape closes an
open picker first, then the composer (via the discard confirm when content
exists). Focus returns to the composer bar.

## 3. Moment entry

```
foot: [● Respond] [n responses] [n notes ▾ | Write a note] ……… [View in Life (disabled)] [⋯]
Respond (not on HEALTH/PROBLEM) ── tap ─► toggles own state; count ±1; mark fills; press animation ≤160 ms (none under reduced motion)
n responses ── tap ─► popover: list of responders with life-rings; Escape / outside closes
n notes ▾ ── tap ─► thread expands (see §4)
⋯ (own) ── tap ─► Edit · Change privacy ▸ (Public/Friends/Only me — radio) · Delete ▸ inline confirm (Delete/Keep) · View in Life (disabled)
⋯ (other) ── tap ─► Report (confirmation line) · Hide (removes) · Copy link (confirmation line)
body > 420 chars ── "more" ─► expands; "less" collapses
multi-photo > 4 ── tap the +N tile ─► shows all; "Show fewer" collapses
video ── tap poster ─► play (out of scope for the prototype)
```

Privacy semantics: `Only me` moments are visible to their author only (filtered
out of everyone else's feed). `Friends` shows the two-figure glyph. HEALTH and
PROBLEM have no Respond control at any privacy level.

## 4. Notes (comments)

Depth: **one level of replies**. A note may have replies; a reply cannot be
replied to (the Reply affordance appears on top-level notes only). Rationale:
deeper trees lose the moment as the subject and cannot be read at 360px; a reply
to a reply is written under the same parent.

```
collapsed: first 3 top-level notes (+ their replies) · "View n more notes"
expanded:  all · "Collapse"
composer (bottom): [ring] [field ☺ ▣ Send(phone)]  Enter sends · Shift+Enter newline
reply: "Reply" under a top-level note opens an inline reply field beneath its replies
each note: [ring] name (you) text time · edited · Respond (+count) · Reply · ⋯
⋯ (own): Edit (inline field; Enter saves, Cancel) · Delete (removes note and its replies)
⋯ (other): Report
send failure: "Couldn't send. Kept here." · Retry (text preserved)
long note > 280 chars: "more" / "less"
```

Life position on notes: the commenter's **ring** (band-precision) only — no age
text. The moment is the thing positioned in a life; a note is a response.

## 5. Counter (MY LIFE IN)

```
faces: composite → years → months → weeks → days → hours → minutes → seconds → composite …  (no milliseconds — C5.2)
unknown birth time: composite (Y/M/D + "counted in days") → years → months → weeks → days → composite
tap the number or the unit control ── advance one face
ArrowRight / ArrowLeft on the unit control ── next / previous face
announce (polite): "Showing <unit>."
cadence: composite, hours, minutes and seconds tick every 1 s; years…days re-evaluate every 60 s
digit roll: changed digits slide in over 220 ms (ease-out); unchanged digits do not move
reduced motion: the seconds face updates without the roll; every value stays live
digits scale by count: ≤3 → 56px · ≤6 → 44px · ≤9 → 34px · ≤12 → 26px · more → 22px (module scale; hero = ×0.68)
```

## 6. Circle of Life module

```
hover / focus a band arc ── band readout: "band <label> · <y0>–<y1> · <n moments | no moments recorded | unwritten>"
leave ── readout returns to the current band
today line ── informational (Phase 5 §24: the compact module is glanceable; the full Circle navigates time)
settings ⚙ ── reserved
"Open Life" ── opens the full Circle of Life (Phase 5); the ring itself is not a control
keyboard: each arc is focusable (Tab) and announces "Band <label> years, <y0>–<y1>, <n> moments recorded"
```

## 7. Chrome

```
search field: focus → Recent; typing → grouped results (Photos · People · Places) or "Nothing for "<term>" yet."; Escape closes and blurs; outside click closes
bell: toggles the panel; panel: grouped by day; tap a row → marks read and scrolls to the moment; "Mark all read"; unread dot on the bell clears at zero unread
avatar ▾: menu Statistics · Weather · Exchange · Settings · Logout (menu only)
theme: toggles data-theme on the document; colours switch via tokens; no page reload; scroll position preserved
brand (top left): the SYSTEMBOOM mark is a link Home to Cosmos; MY WORLD is stated beside it; there is nothing to open — no menu exists. A personal URL without an identity goes Home, is remembered, and continues after the gate
phone: the bar reads SYSTEMBOOM · MY WORLD with search, bell, theme and account (the inert chat placeholder steps aside); search collapses to an icon that opens the results panel with its own field; there is no navigation row
```

## 8. Feed

```
initial: 8 moments · "Load more · n earlier" appends 8 · when none remain: end sentence
order (C3, binding): by the MOMENT'S OWN date/time, newest first — never by posting time.
one date rule per calendar day; a day never repeats lower in the ledger.
a backdated moment lands at its historical position with "shared <when>" as secondary provenance.
posting a backdated moment: the ledger loads far enough to include it (older entries may stay
  behind "Load more · n earlier"), the view settles on it and focus lands on its readout.
  settle = one motion: the entry's 220 ms rise; the page glides to it when it is within ~2.5
  screens, otherwise it jumps (a ten-screen smooth scroll is a tour, not a settle).
  reduced motion: plain jump, no rise.
hidden moments (Hide) and other people's Only-me moments never render
```

## 9. Reduced motion (global)

Every transition listed in the visual spec has a reduced-motion column. In
summary: no rolls below seconds, no press scale, the composer and the posted
moment appear without movement, hover reveals still work (they are opacity only).


## 10. Privacy data contract (C1 — a server contract, not a styling note)

The browser must never need another person's birth instant to render Social.

**Visitor / other-person payloads** (profile-as-visitor, and every Moment or Note
whose author is not the signed-in person) MUST NOT contain: `birthDate`,
`birthTime`, any birth instant or timestamp of birth, exact age primitives
(years/months/days at an instant), day counts, "next round number" data, the
calendar years of a Circle band, or any field from which the birth date can be
derived. The server computes the permitted **15-year band** (`"30–45"` and its
index) and ships only that. The ring for another person is drawn from the band
index alone: lived bands, the current band whole, no now-tick.

**Own payloads** (the signed-in person's profile and their own Moments) may carry
exact age / life position computed server-side per request from the stored birth
truth (`birthDate`, optional `birthTime`, `birthTimeKnown`), including the day
count and the next-round line.

Rendering rule: hero, Circle module, counter, moment readouts, notes and every
avatar ring render from one view model that takes (viewer, subject) and returns
either the OWNER shape or the OTHER shape. The restricted fields are absent from
the OTHER shape, not hidden by CSS. The prototype mirrors this in
`view-model.ts`; it is not itself security — the real guarantee is the API.

## 11. Live-update notes (C7.4 — port intent only)

Notes arriving, Respond count changes and notification-adjacent Social updates
are candidates for the live system's existing WebSocket channel. The initial feed
page is a candidate for server rendering where the live architecture allows;
subsequent pages (Load more) fit TanStack Query pagination keyed by the moment's
own date cursor (C3 ordering). The developer decides the final wiring.
