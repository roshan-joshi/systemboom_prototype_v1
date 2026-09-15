# Social — feature parity classification (Phase 4.2, freeze)

Compiled 2026-09-10 from (a) the 127-second recording of the live system
(`references/cosmos/WhatsApp Video 2026-09-10 at 07.27.16.mp4`, 24 frames sampled),
(b) the three desktop screenshots in `references/social/`, and (c) the accepted
Phase 4 / 4.1 style-lab build at `/style-lab/social`. Reclassified 2026-09-11 for the
live-developer handoff. **This document exists to stop scope creep.**

Every live feature ends in exactly one class:

- **A — MUST MATCH FOR LAUNCH.** Part of this month's port (feed · composer · moment ·
  profile header) in the accepted visual language. Reference: the handover specs.
- **B — FUNCTION STAYS, VISUAL PORT MAY FOLLOW.** Exists in live, keeps working through
  the port with its current function; its re-skin is specified but may land after launch
  if time runs out. Must not regress.
- **C — DEFERRED AFTER SOCIAL LAUNCH.** Exists in live (or is designed as a placeholder);
  its Social presentation is designed only as an entry point; the destination is a later
  phase. Do not build the destination inside this port.
- **D — INTENTIONALLY REMOVED.** Owner decision; must not reappear.
- **E — MOCK / PROTOTYPE ONLY.** Exists in the prototype to make it run or testable;
  never ships.

Counts: **A 44 · B 7 · C 9 · D 6 · E 12** (tally at the end).

---

## 1 · Top bar

| Feature | Class | Note |
|---|---|---|
| Logo on a red plate (light) / wordmark (dark) | A | visual §5.1 |
| Text nav Home · About · Dashboard · Friends · Profile | D | Replaced by the **Brand** — the SYSTEMBOOM mark goes Home to Cosmos and MY WORLD is stated beside it; there is no destination menu. Profile lives with the account control, Friends inside People (not built), About outside the app. "Social" and "Dashboard" are never user-facing. See `docs/design/systemboom-navigation-final.md` |
| Search field + results panel (Recent · Photos · People · Places · empty) | B | field and panel are specified (visual §5.10); the live search API stays. People rows must use the band-only `PersonRef` |
| Chat icon | C | entry icon only; Chat is Phase 7 |
| Notifications bell + unread dot + panel grouped by day | B | panel design specified (visual §5.9); live notification function stays; rows use `PersonRef` |
| Theme toggle | A | live tokens swap without reload (interaction §7) |
| Avatar + ▾ menu: Statistics · Weather · Exchange · Settings · Logout | B | menu re-skinned; items marked "later" in the prototype because their pages are not part of the port; in live they keep linking to their existing pages |

## 2 · Profile hero

| Feature | Class | Note |
|---|---|---|
| Cover image, own aspect, owner can change | A | visual §5.2 |
| Cover actions (people, camera) — owner | A | icons only; existing live functions behind them |
| Ring-framed avatar with camera badge (owner) | A | life ring replaces the plain circle (M1) |
| Name + navy verified check | A | |
| Born row `04 NOV 1991 · 06:42 · Kathmandu` (owner) — replaces the cake-icon birthday | A | |
| Circle row `band 30–45 · 12,729 days` (owner) | A | |
| Contact pill ONLY YOU SEE THIS (owner) | A | never rendered to a visitor |
| Visitor hero: name, place, `Circle band 30–45`, CIRCLE BAND box, tick-less ring | A | C1 binding |
| MY LIFE IN counter in the hero below desktop | A | C5.3; exactly one counter per breakpoint |
| Cake icon birthday | D | replaced by the Born row |

## 3 · Composer

| Feature | Class | Note |
|---|---|---|
| Inline bar `What happened at <exact age>?` (replaces "What's on your mind") | A | D-COPY |
| Modal (≥672) / full-height sheet (phone) | A | |
| Header, close, author row, privacy pill Public · Friends · Only me | A | live evidences Public only; Friends / Only me are part of the design — if the backend has no `friends` privacy today, ship Public / Only me and **surface the gap**; do not invent a third semantics |
| The life readout box WHERE THIS SITS with date + place instruments (`DD MON YYYY`) | A | C2 |
| Text area, 2,000 limit, counter | A | |
| Feeling picker → readout word | A | |
| Seven kind buttons with words at every width | A | C4; Reconciliation A below |
| Kind fields per kind (required marks) | A | content §3 |
| Photos: picker, ≤10, thumbnails at own aspect, reorder, remove, limit sentence | A | picker = the live upload flow |
| Video: preview, duration, burn-in toggle → caption | A | playback itself is not part of the composer |
| Link: paste → preview card or plain | B | unfurl only if a live endpoint exists; otherwise plain text (content §10) |
| Photo date/place detection → FROM THE PHOTO · Confirm / Change | B | optional; only if the upload pipeline returns metadata; manual path always exists |
| Backdating with the past-placement notice; `sharedAt` provenance | A | C3 |
| Validation: future date, over-limit, media kind without media, required fields | A | |
| Posting… progress, failure with Retry, discard confirm, kept draft | A | |
| Edit existing moment → Save, `edited` marker | A | |
| ⌘/Ctrl+Enter posts; Escape layer rule; focus return | A | interaction §2 |

## 4 · Feed and moment

| Feature | Class | Note |
|---|---|---|
| One white sheet, one vertical time rule, hairline separators — no cards | A | |
| Ordering by the moment's own date, newest first; one date rule per day; TODAY | A | C3 |
| Readout line 1: name · exact age (own) / band (others) · place · feeling · privacy · edited · time | A | replaces avatar · name · relative time · globe |
| Kind line 2 with fields; PROJECT progress hairline | A | |
| Body 16/17, ≤66ch, "more" over 420 chars | A | |
| Single photo, multi-photo grid (+N), video poster, link card — own aspect, never letterboxed | A | C4 (original) |
| Respond — one reaction, ring mark, word always visible, `n responses`, who-list | A | Reconciliation B below |
| No Respond on HEALTH / PROBLEM | A | C5.4; idea banked in `phase-5-candidates.md` |
| Notes (comments): count, inline composer, one reply level, edit/delete/report, respond on notes, failed send, view more | A | thread nesting deeper than one level is not designed |
| ⋯ own: Edit · Change privacy · Delete (inline confirm) · View in Life — later | A | |
| ⋯ others: Report · Hide · Copy link · View in Life — later | A | Share becomes Copy link; no re-share, no external share sheet in this port |
| Load more · n earlier / end sentence | A | |
| Other people's Only-me moments and hidden moments never render | A | server filter |
| "View in Life" slot | C | ships disabled and honest; Phase 6 |
| Relative time ("3 hours ago") | D | absolute date rule + time |
| Heart-outline / blue-thumbs two-icon reaction | D | one Respond mark |
| Share button (re-share) | D | Copy link only; re-share not designed |
| Advert slots | D | D-ADS |
| System notice banner, "Systemboom Helps" onboarding card in the stream | D | not Social |

## 5 · Sidebar

| Feature | Class | Note |
|---|---|---|
| MY LIFE IN card at desktop: composite, hourglass, seven faces to seconds, honesty rule, next-round line | A | replaces the live card's dot row (meaning unevidenced — not reproduced) |
| Circle of Life module: ten-band ring, day count, band readout with years (owner), activity line | A | ring replaces the 3-D pie |
| Circle date line (`today · DD MON YYYY`) | A | informational only (Phase 5 §24). The live date picker's navigation moves to the full Circle's Jump to date |
| Circle settings gear | B | icon designed; live function stays |
| "Open Life" → the full Circle of Life | C | the link ships with Social; the Circle itself is Phase 5 (`circle-of-life-spec.md`) |
| Ten 15-year bands 2000–2149 (ten, not eight) | A | R3 |

## 6 · Off-screen surfaces (present in live, not in this port)

| Feature | Class | Note |
|---|---|---|
| Friends page (tabs, search, grid, Unfriend) | C | nav entry only |
| Chat | C | icon only |
| Photo Timeline | C | |
| Circle drill-down pages ("add a memory on this date", per-band views) | C | Phase 5 |
| Family tree | C | |
| Statistics · Weather · Exchange · Settings pages | C | menu entries only |
| Visitor profile page (hero + that person's moments) | A | the visitor hero is class A; the feed filter is the existing profile feed |

## 7 · Prototype-only (never ships)

| Item | Class |
|---|---|
| Harness strip (Width · Viewer · Bell · simulate failure · Reset · theme) and `?w= ?viewer= ?bell= ?notifications= ?fail= ?harness=` | E |
| Mock identities `PEOPLE` and viewer modes `maya · asha · visitor · ashaVisitor` | E |
| In-memory `SocialStore` reducer, Reset, `visible` paging | E |
| `LIBRARY` photo fixtures with hand-written `takenAt` / `takenPlace` | E |
| CC-licensed Wikimedia photography (`public/mock/social/`) | E |
| 700ms link timer / `example.org` canned preview | E |
| 900ms posting timer / `simulateFailure` | E |
| Injectable clock `now()` / `NEXT_PUBLIC_SB_FIXED_NOW` | E |
| Dev hook `window.__SB_VM_OTHER_KEYS` | E |
| `data-sb-*` test attributes | E |
| `systemboom.example` copy-link URL | E |
| Style-lab route `/style-lab/social`, `@container` frame, `--frame-w` | E |

---

## Tally

| Class | Count |
|---|---|
| A — must match for launch | 44 |
| B — function stays, visual port may follow | 7 |
| C — deferred after Social launch | 9 |
| D — intentionally removed | 6 |
| E — mock / prototype only | 12 |

## Resolved question — temporal precision of backdated Moments (owner decision, Phase 5 §6)

A Moment recorded for a past date has **DATE precision**: the person supplied a date,
so the Moment shows **no clock time**. Posting time is provenance (`shared today`),
never the event time. Trusted media time or an explicit event time may raise the
precision in the live product; the manual path stays date-only. Implemented in the
prototype as `Moment.atPrecision: "day" | "minute"` (noon is an internal sort anchor,
never displayed); recorded as an authorised Phase 4 exception in `AGENTS.md`.

---

## Reconciliation A — moment kinds: eight named, seven buttons

**Evidence.** Onboarding card (recording, 7 s): "You got eight tasks on the circle of
life which are photos, video, meal, activity, problem, health, project & meeting" — eight
names. Composer modal (`references/social/Untitled 2.png`, icon row cropped at full
resolution): **seven** circular buttons, left to right —

1. photo (mountain-in-frame glyph) — **Photo / media**
2. bowl glyph — **Meal**
3. running figure — **Activity**
4. triangle with exclamation — **Problem**
5. building with a cross — **Health** (hospital)
6. list with check marks — **Project**
7. handshake — **Meeting**

**Finding.** Video has no button of its own in the composer; the photo button is the
media picker and accepts video too. The Circle-of-Life "add a memory on this date" screen
(recording, 39 s) lists PHOTO and VIDEO as separate tiles because that screen browses by
kind. So: **eight kinds exist as content classifications; the composer exposes seven
entry buttons, with Photo and Video merged into one media button.** The accepted design
keeps seven composer buttons (each with its word) and treats video as media.

## Reconciliation B — reactions: one reaction, inconsistent glyph

**Evidence.** Screenshot action row (`WhatsApp Image … 12.42.57.jpeg`, cropped): heart
outline · speech bubble · share — the unreacted state. Recording at 29 s (cropped):
summary line "👍 2" (filled blue thumbs-up + count) and the action row's first icon is a
**filled blue thumbs-up** — the reacted state. No reaction picker or set of emotions
appears anywhere in 127 seconds of footage or in any screenshot.

**Finding.** The live system has **exactly one reaction** drawn with two icons. The
accepted design keeps a single reaction with one consistent mark (the Respond ring →
filled red), reads "n responses", and adds the who-responded list on tap of the count.
No reaction set is designed because none exists.
