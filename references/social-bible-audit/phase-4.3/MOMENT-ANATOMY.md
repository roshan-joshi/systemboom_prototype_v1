# MOMENT ANATOMY (§48), INTERACTION MATRIX (§49), COMBINED ACTION EXPERIENCE (§74)

Source of truth for the model: `src/components/style-lab/social/data.ts:25-100` (types), plus
`Moment.tsx`, `Media.tsx`, `Composer.tsx`, `store.tsx` and `expressions.tsx`, and
`src/components/celestial/*`. All behaviour described here is **prototype** unless marked
*contract* or *live*.

## 1. The actual Moment model (§48)

The brief's example (A–I) matches the repository closely. What follows is what exists, with the
additions the code has and the example doesn't: privacy, provenance, and the retired tap fields.

| Layer | Field(s) in `data.ts` | Rendered by | Status |
|---|---|---|---|
| **A. Identity** | `authorId` → `PEOPLE[…]` | 24px `PersonIdentity` (real photo → initials, Life Ring drawn **at the Moment's date**); name opens the Person card (`Moment.tsx:181-192`) | COMPLETE. The ring and the band are drawn at the Moment's date, which is the P0 privacy CONFLICT (MC-03). |
| **B. Event coordinate** | `at` (local ISO, no zone) · `atPrecision` `day\|minute` · `sharedAt` (provenance) · `place?: string` | Date rule + TODAY grouping. The clock is hidden for day precision (`Moment.tsx:33-48, 215`); `shared <when>` appears only on the day's first Moment | PARTIAL: no timezone (MC-05); Edit destroys precision (MC-19); provenance is partial (MC-06); place is free text (MC-07) |
| **C. Human content** | `kind` (moment · meal · activity · problem · health · project · meeting) · `fields` (per kind) · `text` · `feeling` | Kind line, body with 420-char more/less, `feeling …` | COMPLETE. "more/less" is hard-coded English (MC-09, MC-37). |
| **D. Media** | `media`: **one of** photos (≤10 × `{src,w,h,alt}`) · video `{poster,duration,caption?}` · link `{url,title,description,image?,host}` | Own-aspect photo / 2×2 grid +N · poster with a no-op play button · link card (`Media.tsx`) | PARTIAL: no lightbox, no playback, no alt authoring, no srcset (MC-10, MC-11, MC-13) |
| **E. People present** | `fields.with?: string[]` (person ids) on **meal** (optional) and **meeting** (required) only | "with N" → a popover of band-safe identities (`Moment.tsx:247-272`) | BROKEN entry: raw names are stored as ids and resolve to "M". Meeting names people twice. No consent (MC-08, CO-13, CO-15) |
| **F. Action layer** | — | `[Respond] [Boom] [Resonate*] [View in Life (disabled, desktop)] [⋯]` (`Moment.tsx:290-358`); *Resonate only with `?celestial=1` | PARTIAL: phone row BROKEN with Celestial on ✔ (RX-01) |
| **G. Conversation** | `notes: Note[]` (`{id,authorId,text,at,parentId?,edited?}`) — the UI calls them **Responses** | Presence line, one-line preview, inline thread, focused phone surface for 3+ top-level | PARTIAL: see [RESPOND-CONVERSATION-AUDIT.md](RESPOND-CONVERSATION-AUDIT.md) |
| **H. Emotional response** | `expressions?: Record<personId, exprId>` (Boom, 18 ids) · `resonances?: Record<personId, resonanceId>` (Celestial, 8 ids) | Human Pulse + Spectrum; Resonance constellation strip + stage | Boom COMPLETE; Celestial DISCONNECTED (flag) |
| **I. Life / Place seams** | none on the Moment. The seam is `coordForDate(date)` (`circle/model.ts:186-189`) | Disabled "View in Life" pill + menu items; inert place | DISCONNECTED / MISSING (PL-01, PL-04) |
| Privacy | `privacy: public\|friends\|onlyme` | Readout glyph and word; owner "Change privacy" | PARTIAL: only `onlyme` is filtered (MC-26) |
| Identity of the Moment itself | `id` | `data-sb-moment` only | MISSING: no URL (MC-24) |
| Retired | `responses`, `responders[]`, `respondedByViewer` (the old Respond tap); `Note.responses` | Nothing renders them | Should be dropped from the live contract (Bible C-2) |

**Recommended canonical anatomy for the live contract.** Same order as the table, plus three
additive fields:
- `present?: PresentRef[]` — kind-independent (§5).
- a structured place: `{ label, placeId?, lat?, lng?, precision? }` (D-16).
- a permalink identity resolved server-side (D-12).

Drop the retired tap fields. Nothing else changes.

## 2. Interaction matrix (§49)

| Action | Purpose | Current implementation | Data model | Owner / visitor | Mobile | Accessibility | Notification consequence | Chat consequence | Life consequence |
|---|---|---|---|---|---|---|---|---|---|
| **Respond** | Say something | Opens the conversation; cursor in the composer on desktop and shallow threads (`Moment.tsx:162-167, 293-303`) | `notes[]` + `parentId` | Anyone who can see the Moment. Not gated on Health/Problem (CONFLICT, RS-36) | 44px. **Deep thread: no composer focus ✔, Reply dead ✔** | Labelled pill; the focused surface returns no focus on close | **None** (MISSING, RS-21) | Only via author → Person card → Message; no Moment context | None |
| **Boom** | Existing mascot expression | Chamber-lens control → Emotion Horizon deck / Atlas; one per viewer (`expressions.tsx`) | `expressions[personId]` | Anyone. Allowed on your own Moment. Never on Health/Problem | 44px. **Icon-only: no visible word on touch** (RX-04) | Radiogroup, arrows, Escape, focus return, live status (COMPLETE) | None (documented seam) | None | None |
| **Resonate** | How this moved me | Gold pill → inline Celestial Field (8 objects) → constellation (`ResonateControl.tsx`) | `resonances[personId]` | Anyone; allowed on own; never on Health/Problem | **Flag on: pushes ⋯ out at ≤390 ✔**; open Field is a 4×2 stack | Roving radiogroup; the accessible name drops the visible word when selected; Remove works only by re-selecting | Signal row exists but has **no producer** (RX-22) | Chat Quick Resonance exists behind a flag | None |
| **View in Life** | Resolve the Moment to its Life coordinate | Disabled pill (desktop) + disabled menu item: "arrives in a later phase" | none; seam `coordForDate` | — | Hidden below @2xl, menu only | Disabled button with a title | — | — | **Owner could link to `/life?c=day:<date>` today** (PL-04) |
| **Place** | Where it happened | Plain `<span>` | `place?: string` | Everyone sees it | Own line on phones | Not interactive | — | — | Circle day header shows home, not the place |
| **Person / profile** | Who | Name, "with N", response authors → PersonCard (Message, Add, Accept, Remove…) | `authorId`, `fields.with`, `note.authorId` | Same for all; card actions depend on relationship | Card is a bottom sheet. **Hidden behind the phone thread ✔** | Dialog, Escape, return; **no Tab trap** | — | Message → mini dock / `/chat` | Band-only ring |
| **Media** | See the memory | Own-aspect photo, grid with +N, poster, link card | `media` (one type) | Same for all | Edge-to-edge bleed on phones | Alt is the accessible name; grid tiles 1–3 are no-op buttons | — | — | — |
| **⋯ own** | Manage | Edit · Change privacy (Public/Friends/Only me) · Delete (inline confirm) · View in Life (disabled) | reducer `edit`/`privacy`/`delete` | Owner only | 36px; **unreachable when Celestial on at ≤390 ✔** | `role=menu`; no arrow keys, no focus return | Stale notifications stay pointing at a deleted Moment | — | Edit moves the Moment in the chronology (12:00 bug) |
| **⋯ other** | Protect / share | Report (toast only) · Hide (session, no undo) · Copy link (fake URL, always "copied") · View in Life (disabled) | `hidden[]`; nothing recorded for Report | Visitor | same | same; Hide strands focus | — | — | — |

## 3. The combined action experience (§74) — is it too complex?

**Short answer: with Celestial on, yes, for a first-time user. With Celestial off, no.**

- **Discoverability**
  - Respond and Resonate are labelled pills.
  - Boom is an unlabelled 44px dark lens between them. Its name exists only as aria-label and
    hover `title`, so touch users never see it (RX-04).
  - No surface teaches any of the three (RX-10).
- **Overlap**
  - One viewer may hold one Boom + one Resonance + any responses. This is by design, and the
    state stays independent (✔ probe D).
  - The two pickers open differently:
    - The Boom deck is a popover above the control and closes on an outside click.
    - The Celestial Field opens inline below the row and has no outside or scrim dismissal.
  - So both can be open at once, and Fields can stay open on several Moments (RX-07).
- **Visual hierarchy**
  - Resonate's gold border, gradient and glow make it the loudest element in the footer.
  - That inverts `AGENTS.md` R2 ("RESPOND stays the primary visible verb") and
    `moment-conversation-model.md:25` (RX-02; D-5).
- **Selected states.** Two different "mine" languages:
  - Boom: red segment + signet.
  - Celestial: a gold orbit, plus a 22px seal inside a pill that still reads "Resonate".
  - Both are legitimate; they are not unified.
- **Counts.** Opposite rules on one presence line:
  - Boom: ≤3 equal lenses + "{n} people", no per-type counts in the feed.
  - Celestial: every present meaning with a per-type count + "{n} people".
  - Celestial also conflicts with its own `COUNT-TRANSITION-RULES.md`: it shows a total, full
    numerals, omits zeros, and animates other people's commits (RX-13; D-6).
  - Neither ranks, sizes by count, or crowns a winner. The anti-popularity check passes for
    both (§8 below).
- **Multi-person.** COMPLETE: one entry per viewer per system (RX-32).
  - Fixture defect: `m-panorama` carries a stale `wonder` id that is silently dropped (RX-26).
- **Learnability.** See §4.
- **Mobile density.**
  - With 16 resonators at 360, footer chrome is about 200px under a 220px photo.
  - The ⋯ is pushed out ✔.
- **Accessibility.**
  - Both pickers are strong.
  - Label-in-name fails on the selected Resonate button and on the Who button (RX-29).
  - The phrase is announced twice in the Field.
- **Notifications.** None from Boom (documented seam). The Celestial row has no producer.
  Respond has none.
- **Privacy.** Both who-lists are band-only and identity-only (COMPLETE, RX-19).
  - Boom's list falls back to the raw name and to "M" for unknown ids (RX-18).
- **Long feed.** Summaries are static.
  - Exceptions: hovering or opening Resonate shifts the page-wide sky (screen-level feedback for
    a Moment-local act), and a static gold glow repeats on every Moment (RX-31).

## 4. Learnability — Respond vs Boom vs Resonate (§60–61)

Required understanding:
- RESPOND = say something
- BOOM = expressive mascot reaction
- RESONATE = how it moved you

What exists today:

| | Label | Icon | Tooltip | Onboarding | First interaction teaches? |
|---|---|---|---|---|---|
| Respond | "Respond" (visible) | ring glyph | — | none | Yes: a composer opens |
| Boom | **none visible**; aria "Express how this moment felt" | the mascot's chamber lens | desktop hover `title` only | none | Partly: the deck caption "How did this moment feel?" names only the attended core; orbs are unnamed on touch until after commit |
| Resonate | "Resonate" (visible) | orbit glyph | — | none | Yes: the Field labels OBJECT · MEANING and the readout names the phrase |

**Smallest improvements that meet the requirement.** None renames or deletes Boom, and none
reopens Celestial semantics (§61). They are ordered by cost.

1. **Give Boom a visible word on touch.** Show "Express" beside or below the lens. On phones, show
   it only until the person has used Boom once (a per-viewer convenience flag). This is a
   presentation change inside the preservation boundary: owner approval required (D-7).
2. **Put Respond first by weight, not only by order.** Bring Resonate down to Respond's visual
   weight or below (D-5). On phones this also solves the ⋯ overflow: Resonate becomes a 44px
   round doorway with its glyph, and the word stays in the accessible name.
3. **Give each presence summary a system cue.** Neither summary says whose it is ("{n} people"
   twice). Add a small caption-weight word or the system's own mark before each count, e.g.
   Boom pulse "felt" and constellation "resonated". Copy is an owner decision (D-6).
4. **One inline first-use explainer, shown once.** Three lines under the action row of the
   viewer's first Moment:
   - "Respond — say something."
   - "Express — how it felt, with Boom."
   - "Resonate — how it moved you."

   Dismissible, never repeated, no gamification (D-7).
5. **Do not add** tooltips-on-hover as the primary teacher: touch has no hover.

## 5. People present vs responded vs resonated (§65)

The data model keeps them separate (COMPLETE, CO-25):

| Relationship | Field | Who writes it | Shown as |
|---|---|---|---|
| **In the Moment** (was there) | `fields.with: string[]` (meal, meeting only) | the author, in the Composer | "with N" → identity popover |
| **Responded** (said something) | `notes[].authorId` | each responder | the conversation |
| **Expressed** (Boom) | `expressions[personId]` | each viewer | Human Pulse → Spectrum → who |
| **Resonated** (Celestial) | `resonances[personId]` | each viewer | constellation → stage → who |
| *(retired)* | `responders[]`, `responses` | nothing writes them any more | nothing. They disagree with `notes[]` (m-1983: 14 vs 1) |

**Gaps.**
- "Was there" is kind-scoped and cannot be recorded on a plain Moment.
- Raw names become ids and are mis-resolved to "M".
- A named person is never asked, never told, and cannot remove themselves (CO-12…15).

**Recommended additive model.** Owner decision D-11 sets the consent rule.

```
Moment.present?: PresentRef[]
PresentRef { personId?: string; label?: string;          // label = someone with no account ("Aama"), never linked or guessed
             addedBy: string; state: "asserted" | "pending" | "confirmed" | "removed"; addedAt: string }
```

- Band-only PersonRef, never raising Life precision.
- Never inferred (no face recognition).
- Visible only within the Moment's own privacy **and** the named person's consent state.
- A named person can always remove themselves.
- Never counted in any presence or popularity figure.
- One Signal notification: "{name} recorded a Moment with you".
- `fields.with` maps to `present` at the API boundary.

## 6. Density and height (§59, §62)

**Measured worst case.** `m-forty`: large photo, 40 responses (27 top-level + 13 replies), a Boom pulse of 20, an 8-type
constellation, no people present and no Life link.

| | Closed | Constellation open | Screens |
|---|---|---|---|
| Desktop 1440×950 | 673px | 1162px | 1.22 |
| Phone 390×844 | 608px | 1149px | 1.36 |

The closed state is healthy: the conversation already collapses to a count plus a one-line
preview. Height comes from the **opened inline Celestial stage** (uncapped, up to 8 × 24 names)
and the 2×4 per-type strip on phones.

**Recommendation.** Nothing removed; hierarchy only.

| Element | Placement |
|---|---|
| Respond | **Always visible**, primary weight |
| Boom control | **Always visible**, compact 44px |
| Resonate | **Secondary**: visible, at or below Respond's weight; a 44px glyph doorway on phones (D-5) |
| ⋯ overflow | **Always visible, never clipped** |
| View in Life | **Overflow** until it works (it is already in ⋯). Remove the disabled desktop pill (D-15) |
| Place | Stays in the readout (it is the coordinate), becomes tappable (D-16) |
| People present | In the kind line as "with N" → popover (progressive, already) |
| Boom Human Pulse | **Only after activity** (already) |
| Resonance constellation | **Only after activity**. In the feed, show ≤3 seals + "{n} people"; per-type counts only in the opened stage (D-6) |
| Celestial stage / Boom Spectrum | **Progressive**, height-capped with internal scroll (Boom's already is; Celestial's is not, RX-16) |
| "{n} responses" | Visible when ≥1. "Write a response" at zero duplicates Respond: show it only after activity (owner call, accepted behaviour today) |
| Latest-response preview | **Only after activity** (already) |
| Inline thread / focused surface | **Progressive** (already) |

With these, the worst case stays under one screen when closed on both widths; it already does
today. With the stage capped at about 280px and the phone strip collapsed to ≤3 seals, the open
state is *projected* at about one screen (≈890px at 390, ≈950px desktop). That figure is an
estimate, not a measurement.

People present and a Life link add no row: "with N" sits in the kind line, and View in Life is an
action-row pill or a ⋯ item.

## 7. Media (§34) and linking (§35)

- **Photos.** Own aspect, max 480px, 2×2 grid with +N and "Show fewer" (English). Lazy, async
  decode, aspect reserved, and a `data-sb-media-fallback` that keeps the Moment's structure
  (COMPLETE).
  - **Missing:** lightbox/fullscreen, swipe, per-photo captions, alt authoring in the Composer,
    `srcset`. Tiles 1–3 are `<button>`s that do nothing (MC-10, MC-13).
- **Video.** Poster, duration and caption chip. The play button has no action and there is no
  `<video>` element (MC-11, XC-24).
- **Link card.** Opens a new tab with `rel="noreferrer"` (COMPLETE).
- **Download / share controls.** None.
- **Deep links.** A Moment has **no stable URL**. `src/app` has `chat`, `life`, `social`
  (redirect), `style-lab` and `world`.
  - Copy link appears only on *other people's* Moments.
  - It writes `https://systemboom.example/m/<id>`, which resolves nowhere, and it confirms
    "Link copied." even when the clipboard write fails (MC-23).
  - In-app landing (Search, Notifications) is in-page only and is lost on reload.
- **Recommendation (D-12).**
  - A server-resolved permalink (`/world?m=<id>` or `/m/<id>`) that returns nothing for only-me,
    unauthorised `friends`, hidden or deleted Moments, and carries a band-only PersonRef.
  - Logged-out viewers get a sign-in wall, never content.
  - No public viral sharing.
  - Until it exists, **remove Copy link** rather than hand out a fake URL.

## 8. Anti-popularity check on both summaries (§15)

**Boom — pass.**
- Equal lens sizes (22/40/26px).
- No bars, percentages, winner, top or crown.
- Canonical Spectrum order.
- Unranked who-list.

**Celestial — pass.**
- Canonical order.
- Equal 22px seals and equal count typography.
- No winner, top, percent or size-by-count.
- The viewer's own mark is never larger.

**Caveats.**
- The Boom feed picks its three representatives by count (R3.3-sanctioned).
- Celestial shows per-type counts and a total in the feed.
- Celestial animates counts on other people's commits.

None of these is a leaderboard, but the last two contradict the Celestial count rules (RX-13).

## 9. Composer — a memory coordinate, not a post? (§22)

**Largely yes.**
- An exact-age prompt ("What happened at {age}?"), words first.
- A coordinate sentence (today · date · age · place) in which the date and place are the
  instruments.
- Honest day precision when backdating, with `sharedAt` as provenance.
- Photo date detection that must be confirmed.
- Only-me by default on Health/Problem.
- Keep-draft / Discard / Back.
- A 2,000-character counter.
- A full-height phone sheet with a safe-area footer.

**Where it falls short:**

| Defect | Status | Row |
|---|---|---|
| Edit writes `T12:00:00` from both branches of `initialTime`, never updates `atPrecision`; link/video rebuilt from mock constants; photos outside LIBRARY dropped | BROKEN | CO-10 |
| Discard during the 900ms Posting window still publishes (default Public) | BROKEN ✔ | CO-22 |
| Kind fields leak across kinds (`with` posted on Activity/Health) | BROKEN | CO-11 |
| Photos + video + link can all be attached; submit silently keeps one | BROKEN | CO-05 |
| Dates before the author's birth accepted → negative exact age (Circle refuses the same date) | BROKEN | CO-09 |
| Unmatched "with" names stored as ids → "with M" | BROKEN | CO-13 |
| Closing an Edit with changes discards them without asking | PARTIAL | CO-20 |
| Controls stay enabled while posting; no arrow keys in the kind group; failures not announced | PARTIAL | CO-21, CO-24 |
| No explicit time for past Moments; capture time dropped | documented future | CO-07, CO-08 |
| People present only on two kinds; no consent | MISSING | CO-12, CO-15 |
