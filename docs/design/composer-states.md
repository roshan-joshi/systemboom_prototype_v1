# Composer — state machine (plain text, binding for the Phase 4 build)

One machine, two shells: desktop centred modal (max 560px), mobile full-height sheet
from the bottom. **Body order (binding — memory-first since S5/S6, owner-directed,
superseding the Phase 4 readout-first order):** header (author + privacy beside the title)
→ text area (the words, focused) → the coordinate sentence (`today · DD MON YYYY · <age> ·
⌖ place`; the date and place ARE the instruments — the same `data-sb-readout-state` element,
FROM THE PHOTO state included, no boxed block) → feeling + counter → seven quiet kind chips
(glyph + word) → kind fields → media panel. Every state, value, validation sentence and
`data-sb-*`/aria contract below is unchanged. Escape closes the top-most layer. Focus enters
the text area on open and returns to the inline bar on close.

## States

```
CLOSED
  inline bar on the rule: ◎ · "What happened at <age>?"   (the sentence alone — no instrument icons; "Draft kept — continue your moment" when a draft exists)
  tap bar / Enter        → OPEN.EMPTY (focus in the text area; the readout box carries the date and place instruments)
  ⋯ Edit on own moment   → OPEN.EDIT

OPEN.EMPTY
  privacy = Public (HEALTH/PROBLEM → Only me when chosen), kind = none, text = "", media = [], feeling = none
  readout = MANUAL (today · viewer's place or "Where was this?")
  Post disabled
  type text              → OPEN.READY
  choose kind k          → OPEN.KIND[k]
  add photos / video     → MEDIA.*
  paste URL              → LINK.*
  ☺                      → FEELING.OPEN
  privacy ▾              → PRIVACY.OPEN
  ✕ / Cancel             → (nothing entered) CLOSED | (content) CONFIRM.DISCARD

OPEN.READY        text non-empty and every required field valid → Post enabled

OPEN.KIND[k]      k ∈ media(photo/video) · meal · activity · problem · health · project · meeting
  fields appear beneath the text in this order:
    meal      what* · venue · with (people)
    activity  what* · measure (number + unit) · duration
    problem   title* · status (open | resolved)            privacy → Only me by default
    health    measurement* · value* (+ unit) · —           privacy → Only me by default
    project   name* · progress (n of m) · since (date)
    meeting   with (people)* · venue · duration
    media     (no fields; requires ≥1 photo or a video)
  * required → Post disabled until present
  choose the same kind again → kind cleared (fields collapse, values kept in draft)

MEDIA.PICKING     mock library open (photos with file date/place where the file has them)
  select ≤ 10        → MEDIA.THUMBS(n)
MEDIA.THUMBS(n)   strip of thumbnails at their own aspect (96px tall), ← → controls reorder (drag is optional in the live build), ✕ removes
  n = 10             → MEDIA.LIMIT: "+" disabled, line "10 of 10 — remove one to add another"
  first photo with a file date/place → READOUT.DETECTED
MEDIA.VIDEO.PREVIEW   poster at own aspect (9:16 allowed), duration chip; toggle "Burn the date and place into the video" → caption field
LINK.RESOLVING    hairline progress under the field (mock 700ms) → LINK.PREVIEW | LINK.PLAIN
LINK.PREVIEW      title · description · image (editable, ✕ removes card, URL stays text)

READOUT (visible in every OPEN state; the confirmable AI-era element)
  MANUAL     "This moment will sit at <age at date> · <place|Where was this?> · today"
  DETECTED   "This moment will sit at 25y 11m 02d · Bhaktapur · 03 AUG 2026"   Change · Confirm   (heading FROM THE PHOTO)
             Post disabled until Confirm or Change; Change opens the date + place instruments
             [SPEC: detection is OPTIONAL behaviour; the MANUAL path must always exist]
  BACKDATED  date < today → adds "Placed in your past — its own date will lead, with "shared today" beside it."
  FUTURE     date > today → "That date hasn't happened yet."  Post disabled

FEELING.OPEN      list with a "none" row first (calm · grateful · nostalgic · tired · proud · anxious · hopeful · homesick · quiet · restless); not searchable
  choose            → readout gains "· feeling <word>"; the finished entry shows it in line 1 after the place

PRIVACY.OPEN      Public · Friends · Only me   (the live system exposes Public; the other two are the design)
  choose            → indicator on the finished entry: none / two-figure glyph / the word "only you"

VALIDATION (inline, quiet, --danger text only)
  EMPTY                   Post disabled, no message
  OVER_LIMIT              counter "2,000 / 2,000" in --danger, Post disabled
  MEDIA_KIND_NO_MEDIA     "Add at least one photo — or write it as a plain moment."
  REQUIRED_FIELD_EMPTY    field label in --danger
  FUTURE_DATE             as READOUT.FUTURE

CONFIRM.DISCARD   inline two buttons: Keep draft · Discard
  Keep draft        → CLOSED (bar shows "Draft kept"; next open restores)
  Discard           → CLOSED (draft cleared)

SUBMIT
  POSTING           Post fills left→right, label "Posting…", every control disabled (≈ 900ms mock)
  POSTED            shell closes; the new entry rises onto the rule at its date (220ms ease-out; reduced motion: appears); focus lands on its readout
  FAILED            Post returns; "Couldn't post. Your draft is kept." · Retry   (harness: "simulate failure" toggle)

OPEN.EDIT         prefilled from the moment; Post reads "Save"; Save → entry shows "· edited" after the time
```

## Keyboard

Tab order: close ✕ → privacy → text → feeling → kind buttons (arrow keys move within the
group) → kind fields → media add → media thumbs (the ← → buttons reorder, ✕ removes) →
readout Change/Confirm → Post → Cancel. Escape: closes the top-most layer (picker →
kind fields stay; the shell closes only when no picker is open). Enter in a single-line
field does not post; Ctrl/⌘+Enter posts when enabled.
