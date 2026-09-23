# SYSTEMBOOM Social — API design contract (front-end needs)

Phase 4.2 · 2026-09-11. This is a **design contract**: the minimum data the Social
front end needs to render the accepted design, and the rules that data must obey.
It is not a NestJS implementation, not a Drizzle schema and not an endpoint list.
Field names are suggestions in `camelCase`; keep your own names, keep the shapes and
the rules. Where the prototype has no design need, no field is listed — do not add
fields "for later".

Companion: `social-interaction-spec.md` §10 (rendering rule), `social-visual-spec.md`
§10 (visual rule), `README-for-developer.md` §F.

---

## A. Current viewer (the signed-in person)

Needed once per session, refreshed on identity change.

```
viewer {
  id
  name
  avatarUrl?                 // absent → initials
  homePlace                  // "Kathmandu, Nepal" — default place for a new moment
  verified: boolean
  lifePosition: OwnerLifePosition   // §E — the viewer's own, exact
  contact { phone?, email? }        // shown to the viewer only (ONLY YOU SEE THIS)
}
```

The viewer's own birth truth (`birthDate`, `birthTime?`, `birthTimeKnown`) is **not
needed by the browser** for Social if `lifePosition` is server-derived (§E). If the
live system already ships the viewer's own birth date to the client for other
features, that is acceptable — it is their own data. It is never acceptable for
anyone else's.

## B. Profile — owner view (viewing oneself)

```
profileOwner {
  person: viewer fields above (id, name, avatarUrl?, coverUrl?, homePlace, verified, contact)
  lifePosition: OwnerLifePosition        // §E
  circle {
    bandIndex (0–9), bandLabel ("30–45"),
    bandCalendarYears: [[y0,y1] × 10]    // owner only — reveals the birth year
    momentsByBand: number[10]            // ring opacity by activity
    momentsThisMonth: number
  }
  canEditCover, canEditAvatar: true
}
```

## C. Profile — visitor view (viewing another person)

```
profileVisitor {
  person { id, name, avatarUrl?, coverUrl?, homePlace, verified }
  circle {
    bandIndex (0–9), bandLabel ("30–45")
    momentsByBand?: number[10]           // optional; ring activity opacity only
    momentsThisMonth: number
  }
}
```

**Birth-derived privacy rule (binding).** For any person other than the signed-in
viewer, the client MUST NOT receive:

- `birthDate`, `birthTime`, `birthTimeKnown`
- any birth instant / timestamp of birth (`birthInstant`, `bornAt`, epoch, ISO)
- the raw DOB in any encoding, including inside nested objects, search results,
  notification payloads, note authors or "people" lists
- exact day count (`totalDays`, "12,729 days"), next-round data
- exact age primitives sufficient to reconstruct the DOB: `years/months/days` at an
  instant, `ageAt(moment)`, seconds lived, `fraction` of the Circle
- the calendar years of any Circle band (`2021–2036` reveals the birth year)

The server computes the 15-year band and ships **`bandIndex` + `bandLabel` only**.
This applies to every payload that carries a person: profile, moment author, note
author, who-responded list, notifications, search "People", mentions.

There is no "friends may see exact age" tier in Phase 4. Do not add one.

## D. Moment

```
moment {
  id
  author: PersonRef                     // §D.1
  at: ISO local date-time               // the moment's OWN date/time — the ordering truth
  atPrecision: "day" | "minute"         // "day": the person gave only a date — the client shows NO clock;
                                        //   store the precision explicitly (the prototype anchors at 12:00 for sorting)
  sharedAt?: ISO                        // present only when the moment was backdated
                                        // (at's calendar day < sharedAt's day) → "shared today"
  place?: string                        // free text; may be Devanagari; absent = omitted, never invented
  feeling?: string                      // lowercase word from the fixed list
  body?: string                         // ≤ 2,000 chars; Devanagari allowed; newlines preserved
  media?: Media                         // §D.2
  kind: "moment" | "meal" | "activity" | "problem" | "health" | "project" | "meeting"
  fields?: KindFields                   // §D.3 — only the keys of that kind
  privacy: "public" | "friends" | "onlyme"
  edited: boolean
  respond { count: number, byViewer: boolean }      // one reaction; no reaction types
  notes   { count: number }                         // thread fetched on expand (§D.4)
  viewer  { canEdit, canDelete, canChangePrivacy, canRespond, canNote, canHide, canReport }
  lifeAtMoment: OwnerLifePosition | { bandLabel }   // §E / §F — exact only when author == viewer
  viewInLife: { available: false }      // reserved slot; Phase 6 — render disabled, honest
}
```

Rules the front end depends on:

- `canRespond` is **false for `health` and `problem`** at every privacy level; the
  control is not rendered (no substitute).
- `onlyme` moments of other people are never delivered (filtered server-side).
- `privacy` of `health` / `problem` defaults to `onlyme` at creation unless the
  person chose otherwise.
- `at` is what the client sorts and draws date rules by; `sharedAt` is provenance only.
- **Never invent a clock time.** A backdated Moment created from a date alone is
  `atPrecision: "day"`; only a Moment recorded for today, a trusted media capture time,
  or an explicit event time carries `"minute"`. Posting time is not the event time.
- **Edit keeps temporal truth** (Phase 4.4-A). An edit that does not change the date
  sends no `at` / `atPrecision` change at all — the Moment keeps its own instant and
  precision exactly. An edit that deliberately moves the date sets `atPrecision: "day"`
  (the clock part is a sort anchor, never displayed) and keeps sharing provenance:
  `sharedAt` stays what it was, or becomes the Moment's original `at` if it had none.
  *Live requirement:* the server applies the same rule and never rewrites a clock.
- **Edit keeps media.** An edit carries the Moment's existing media object unchanged
  unless the person changed that media (the link's title may be edited in place). The
  client never substitutes placeholder media. *Live requirement:* partial updates must not
  drop media fields the client did not send.
- **A discarded Moment is never created.** The prototype cancels its pending publication
  on Discard / Cancel / Escape and on unmount. *Live requirement:* a create request is sent
  only after the person commits; if a request is in flight when they discard, the client
  must cancel it or delete what it created — a discarded Moment must never appear.
- **One media type per Moment** (`photos` | `video` | `link`, see D.2). The Composer
  enforces it; extending it is owner decision D-20.
- **No Moment before its author's birth.** The Composer refuses it with the Life rule's
  sentence ("That date is before this life began."), as the Circle does. *Live requirement:*
  the server refuses it too; time before birth belongs to the Ancestor context (D-17).
- **"View as public" is a render-time preview** (Phase 4.4-A, part 1). The owner's
  World renders through a technical public stand-in: no exact age, no owner tick, no
  owner menus and no only-me Moment, and nothing can be written while previewing. The
  stand-in is never persisted, never a relationship, never an author and never sent.
  *Live requirement:* the preview must be computed from the same visitor payload a genuine
  stranger receives (server-side), not by client filtering. Which audience `friends`
  means (D-2) and whose Moments a World holds (D-4) are open owner decisions; until they
  are decided the preview does not filter them (part 2, Phase 4.4-B).

### D.1 PersonRef (any author / responder / commenter)

```
personRef { id, name, avatarUrl?, bandIndex, bandLabel }
```
Nothing else. For the viewer themselves the client already holds §A.

### D.2 Media

```
photo  { id, url, width, height, alt? }                 // width/height REQUIRED — own-aspect layout
Media  = { type: "photo", photo }
       | { type: "photos", photos: photo[] }            // ≤ 10, ordered
       | { type: "video", posterUrl, width, height, durationSeconds, caption? }  // caption = burned-in "17 OCT 2022 · Phewa Tal"
       | { type: "link", url, host, title?, description?, imageUrl? }
```
Photo metadata (`takenAt`, `takenPlace`) for the composer's detection state is
**optional**; if the upload pipeline yields it, return it on the upload response so the
composer can offer Confirm / Change. The manual path must always exist.

### D.3 KindFields (only for the moment's kind; `*` required at creation)

| kind | fields |
|---|---|
| meal | `what*`, `venue?`, `with?: number` |
| activity | `what*`, `measure?` (e.g. "1,240 m"), `duration?` |
| problem | `title*`, `status*: "open" \| "resolved"` |
| health | `measurement*`, `value*` |
| project | `name*`, `progress?: { done, total }`, `since?: ISO date` |
| meeting | `with*: string[]` (first names shown), `venue?`, `duration?` |

### D.4 Note (comment) and reply

```
note { id, momentId, parentId?, author: PersonRef, text (≤ 280 shown before "more"), at, edited,
       respond { count, byViewer }, viewer { canEdit, canDelete, canReport },
       replies?: note[] }              // depth is ONE: a reply has no replies
```
Collapsed thread shows the first three top-level notes with their replies; the client
asks for the rest on "View n more notes".

Phase 4.4-A additions (the rest of this section still describes the retired Respond tap —
correcting it to the R3 Response model is tracked separately):
- `at` is a zone-bearing instant. The client shows `HH:MM` for a response from today and
  `DD MON YYYY · HH:MM` otherwise (never relative time, never only a clock for an older day).
- `text` keeps the person's own line breaks (the client renders them; edit is multi-line).
- Replying from the phone's focused conversation writes `parentId` exactly as inline does.

## E. Owner life position (self only, server-derived per request)

```
OwnerLifePosition {
  exact: "34y 10m 06d"                       // or the parts: years, months, days
  precision: "minute" | "day"               // "day" when the birth time is unknown → counter stops at days
  totalDays                                  // Circle centre and Circle row
  nextRound? { targetDays, inDays }          // "Your 13,000th day is in 270 days"
  bandIndex, bandLabel
  fraction                                   // 0–1 across 150 years → the red tick
  composite? { hours, minutes, seconds }     // only when precision = "minute"; the client may tick locally
}
```

The counter ticks in the browser between fetches; it therefore needs a reference: either
the viewer's own birth instant (their own data) or `secondsLived` at server time plus the
server timestamp. Either is acceptable for the **viewer only**.

`exact` at a moment's own date (`lifeAtMoment`) is computed server-side per moment for the
viewer's own moments; the composer's "This moment will sit at …" preview may compute
locally from the viewer's own birth instant.

## F. Other person's life position

```
{ bandIndex, bandLabel }        // "30–45" — and nothing else, ever
```

## G. Pagination (chronology is the product truth)

- The ledger is ordered by **`at` descending** (the moment's own date/time), never by
  `createdAt` / `sharedAt`. A moment backdated to 1983 is on the last page.
- Cursor pagination keyed on `(at, id)` — an opaque cursor is fine; the client only
  needs `nextCursor?` and `remaining?` ("Load more · 15 earlier"). Page size 8 in the
  prototype; any size is acceptable as long as the date rules stay correct across pages
  (the client draws one rule per calendar day; a day split across two pages must not
  produce a second rule — send the page boundary's day complete, or let the client
  merge by date key as the prototype does).
- After posting a backdated moment the client must be able to load "up to and including
  moment X" (a `until` / `aroundId` request, or successive pages) so it can settle on it.
- Visitor profile feeds are the same shape filtered to one author, `onlyme` excluded.

## H. Live updates (candidates for the existing WebSocket channel)

Reasonable candidates, in the order they matter to the design:

1. **Note arrives on a visible moment** → count and thread update in place.
2. **Respond count change** on a visible moment → the number updates (no animation
   unless the viewer pressed it).
3. **Notification** → bell dot and panel row (existing behaviour).
4. **New moment by someone else with `at` today** → may be inserted at its
   chronological position quietly; never animate content into view (visual spec §7).
5. **Edit / delete / privacy change** by the author → update or remove in place.

Not candidates: the counter (local tick), the Circle module, search.

The developer chooses channel and event names; the design only requires that updates
respect chronology and never carry birth-derived data for other people (§C applies to
every socket payload too).
