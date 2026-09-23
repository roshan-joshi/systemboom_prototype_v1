# RESPOND / CONVERSATION AUDIT (§8–§12, §63, §73)

**Status: PARTIAL.**
- Desktop and shallow threads are close to complete.
- The phone deep thread has three runtime-verified defects.
- There is no stewardship for the Moment's owner.
- No notifications are generated.
- There is no pagination contract.

Everything here is **prototype** behaviour: `store.tsx` reducer plus `data.ts` fixtures, no server.
The live requirements are in `moment-conversation-model.md:107-115` and `social-api-contract.md:154-162, 206-222`. The API contract still describes the retired Respond tap (Bible C-2).

Vocabulary (R3, accepted):
- **Respond** — the verb. It writes.
- **Response** — the written entry. Stored as `Note`, and the `data-sb-note*` hooks keep that name.
- **Reply** — one level under a response.
- **Note** — retired from the UI.

## 1. Capability audit (§8)

| Capability | Status | Evidence |
|---|---|---|
| Creating a response | **COMPLETE** | `Moment.tsx:730-772`, `store.tsx:192-193` |
| Displaying responses | **COMPLETE** | Response Branch, rows, and the memory header on phones (`Moment.tsx:464-525, 536-614`) |
| Response count | **COMPLETE** | "{n} responses" / "Write a response" (`Moment.tsx:374-384`). The phone threshold counts top-level responses only; the doc says "3+ responses" (RS-14) |
| Replying | **PARTIAL** | One level via `parentId`, inline. **BROKEN on the phone focused surface ✔ V2:** `onReply={() => {}}` at `Moment.tsx:596, 599`, and 27 Reply buttons do nothing |
| Threading | **COMPLETE by design** | One level. Reply appears on depth-1 rows only (`:669-673`) |
| Edit own | **PARTIAL** | Works and shows "edited". The field is a single-line `<input>` (`:661`), so line breaks are lost. No Escape. Saving empty silently cancels. No failure path |
| Delete own | **PARTIAL** | Immediate, with no confirm, no undo, and a **cascade that deletes other people's replies** (`store.tsx:197`) |
| Timestamps | **BROKEN** | `HH:MM` only, never a date. A 2026 response under a 1983 Moment reads "09:40" (`:667`). The fixture clock stores UTC as local (`data.ts:738`), so responses read 11:18–12:04 under a Moment recorded at 16:40 (✔ visible in `evidence/14-*.png`) |
| Person identity | **COMPLETE** | Real photo, Life Ring and name. No Life text (`:632, 637-644`). A screen reader hears the name twice |
| Real profile photo / Life Ring | **COMPLETE** | Through `PersonIdentity`. The ring is drawn at the response's time; see §7 hardening |
| Mentions | **MISSING** | None exist. A fixture notification claims one (`data.ts:752`) |
| Attachments / media / links | **MISSING by design** | `moment-conversation-model.md:84-97`. URLs are not linkified, and long tokens are not wrapped |
| Keyboard | **PARTIAL** | Enter sends and Shift+Enter adds a line, but line breaks are not rendered. There is no IME guard, so confirming a Devanagari or Chinese candidate with Enter can send early (plausible, not verified). The ⋯ menu returns no focus |
| Mobile composer | **PARTIAL** | Sits above the keyboard with the safe-area inset. **Respond does not focus it ✔ V1.** Reply and ⋯ are 28px targets |
| Loading | **MISSING** | No loading state. The whole thread is client-side |
| Pagination / batching | **MISSING** | Desktop inline shows the oldest 3, then "View N more" reveals all. The phone surface renders all 40 with no batching |
| Long conversations | **PARTIAL** | See §4 |
| Empty state | **COMPLETE** | An empty sentence. "Write a response" at zero opens the thread without focusing the composer |
| Error state | **PARTIAL** | A failed send keeps the text and offers Retry (harness `?fail=1`). Edit and delete have no failure path. No length limit, no rate limit |
| Moderation / reporting | **MISSING** | Report is a toast only ("Reported. Thank you — someone will look.") and records nothing. The Moment's owner has no controls over other people's responses |
| Permissions | **CONFLICT** | Anyone who can see the Moment can respond, including on Health/Problem, where the model says "no conversation" (RS-36) |
| Visitor behaviour | **COMPLETE** | Writes, replies, reports; edits and deletes only their own responses |
| Owner behaviour | **MISSING** | Sees "Report" on other people's responses like anyone else |
| Notification generation | **MISSING** | None (§5) |
| Chat seam | **PARTIAL** | Author → Person card → Message, only for connected people. No Moment context. **The Person card is hidden behind the phone thread ✔ V3** |

## 2. The owner's questions (§73)

**What already works?**
- Respond writes: it opens the conversation with the cursor in the composer on desktop and in
  shallow threads.
- Multiple people can respond.
- One level of reply works inline.
- Own responses can be edited ("edited" marker) and deleted.
- Report, as a toast.
- Response authors open their Person card.
- Presence line and a one-line preview.
- The phone focused surface with a memory header.
- Retry after a failed send.
- No reaction under a response and no Respond tap: the retired pieces stay retired.

**Can multiple people Respond?**
- Yes. The 40-response fixture has 8 authors.
- The prototype acts as one person at a time.
- Arrival of other people's responses in real time is only a WebSocket candidate in the contract.

**Can someone reply to a Response? How deep?**
- One level: `parentId`, depth 2, and Reply only on depth-1 rows.
- **On a phone thread with 3+ top-level responses, Reply is dead** (✔ V2).

**Can users edit?** Yes, with defects:
- Line breaks are destroyed.
- No Escape.
- Saving empty cancels silently.
- No failure path.

**Can users delete?**
- Yes: immediately, no confirm, no undo.
- It cascades to other people's replies. Whether it should is an owner decision (D-9).

**Can the Moment owner manage inappropriate responses?**
- **No.** The response menu checks only whether you wrote the response (`Moment.tsx:680-687`).
- The owner can only Report (a toast).
- There is no block or mute.

**How are Responses ordered?**
- In the order they were added, oldest to newest.
- No ranking anywhere, and relationship never reorders responses.
- The client does not sort by `at`. The server must return true chronology.

**How are long threads collapsed?** See §4.
- The feed shows the latest top-level response as a preview.
- The desktop inline thread shows the *oldest* 3, then "View N more", which reveals everything.
  The response you just read in the preview is hidden behind "View N more".
- Phones open a focused surface at 3+ top-level responses and render all of them.

**What notifications occur?**
- **None.** Posting a response writes no notification. There is no response or reply kind, and
  no `noteId` to land on.
- The fixtures that look like response notifications are untrue:
  - "responded to your…" on Moments with zero responses (`data.ts:751, 753, 756`).
  - "mentioned you in a note": no mentions exist, and the matching response is Maya's own.
  - "left a note": retired vocabulary.

**Can conversation move to Chat?**
- Indirectly: response author → Person card → Message, connected people only. No Moment context
  travels.
- **On a phone thread the Person card opens behind the surface** (✔ V3: `elementFromPoint` hits
  the thread, focus is not in the card; both layers are `z-[60]`).
- On `/life` (DayAlmanac), response authors are plain text.

**How does it work at 360px?**
- **Works:**
  - the 92dvh bottom sheet
  - the memory header (photo, ring, safe life position, date · place, excerpt, thumbnail)
  - the composer above the keyboard with the home-indicator inset
- **Broken or weak:**
  - Reply dead ✔
  - Respond does not focus the composer ✔. The dialog's own focus effect overrides autoFocus, and the capture scripts have had to force it.
  - Closing returns no focus.
  - Touch-scrolling the scrim can move the page underneath.
  - Escape on a response ⋯ or on a Person card also closes the whole thread.
  - A just-sent response lands off-screen, unrevealed.
  - 28px targets.

**What privacy and security boundary exists?**
- **Life:** author rows are band-only rings with no Life text (COMPLETE). One hardening item:
  - The ring's band is computed at the response's timestamp.
  - Many timestamped responses across a 15-year boundary can bracket a birthday.
  - The live contract should carry the author's current band (RS-26).
- **Visibility:** responses inherit the Moment's visibility. But `friends` is not enforced for
  the Moment itself (P0, D-2), and Health/Problem are not gated (D-8).
- **View as public:** does not switch the conversation to the visitor's view (RS-37, P0).
- **Security:** nothing server-side exists. There are no length or rate limits, and the prototype
  does not escape anything beyond React's defaults (no HTML rendering, so no XSS path in the
  prototype).

**What is genuinely required to call Respond complete?** See §6.

## 3. Recommended conversation model (§9–§11)

- **One truthful chronology.**
  - Oldest to newest, never ranked. No "top", no reaction-sorted replies, no badges.
  - Relationship shows only through each author's photo, Life Ring and name, plus a quiet marker
    when the Moment's author is speaking.
- **Read like a table conversation.**
  - The composer sits after the newest response.
  - A collapsed thread shows "N earlier responses" above the latest two, so the feed preview and
    the opened thread agree (D-19).
  - Earlier responses load in pages of about 20 from a server cursor on `(createdAt, id)`.
- **One reply level is enough (§9, §17).**
  - It keeps the Moment as the subject and stays readable at 360.
  - The one refinement worth an owner decision (D-19): let a depth-2 row's Reply write under the
    same parent with a visible "to {name}" addressee. Stored depth stays one. No Reddit tree.
- **Absolute time, never relative.** `HH:MM` today; add the date otherwise (existing `sbDate`
  grammar), inside `<time dateTime>`.
- **Response ownership controls (§10).** Recommend only these:

  | Control | Recommendation |
  |---|---|
  | Edit (own) | Keep. Multi-line, Escape cancels, empty → offer Delete |
  | Delete (own) | Keep. Add a confirm. With replies, leave a "Response removed" placeholder rather than erasing other people's words (D-9) |
  | Reply | Keep. Fix the phone surface |
  | Copy link | **Not needed** until Moment permalinks exist (then anchor `#r-<id>`) |
  | Report | Make it real: target and reason to a review queue, hidden for the reporter (D-10) |
  | Hide by the Moment's owner | **Add** (D-9). Reversible; the author sees "hidden by {owner}" |
  | Block / mute | Person-level, from the Person card, not per response (D-10) |
  | Visibility | Inherited from the Moment; no per-response visibility |

- **Identity (§11).**
  - Keep real photo, Life Ring and name.
  - Add the "author of this Moment" marker.
  - Mark the ring decorative so the name is announced once.
  - Never add relationship text in the row: relationship belongs in the Person card.

## 4. Collapse and expansion (§63)

| Need | Today | Recommendation |
|---|---|---|
| Preview of first/last responses | Latest top-level response, one line, in the feed | Keep |
| "View responses" | "{n} responses" toggle | Keep |
| Collapsed replies | Replies render in full under their parent | Collapse replies beyond 2 to "{n} replies" under the parent |
| Pagination / batching | None; everything is client-side | Latest 2 + "N earlier responses"; pages of ~20; loading and error states |
| Phone deep thread | Focused surface renders all | Same batching inside the surface; reveal a just-sent response |

## 5. Response → Chat seam (§12)

- **Supported today:** PersonCard → Message → the mini dock (≥1024px) or `/chat?c=<id>`, for
  friend/family only.
- **Not supported:** carrying the Moment into the thread (text-only `ChatMessage`, no Moment
  route); opening chat from the phone thread (hidden card ✔).
- **Recommendation.**
  - Never move a public discussion into Chat automatically.
  - Keep "Message" on the Person card.
  - Once permalinks exist, optionally offer "Continue privately" with a quiet Moment reference
    that the server re-checks against the recipient's audience (D-25).

## 6. Definition of COMPLETE for Respond

| Priority | Item | Row |
|---|---|---|
| **P0** | Phone focused surface: working Reply | RS-05 |
| **P0** | View as public covers the conversation | RS-37 |
| **P1** | Respond puts the cursor in the composer on phones ✔ | RS-02 |
| **P1** | The Person card appears above the phone thread ✔ | RS-18 |
| **P1** | Moment-owner stewardship (hide/remove) + a real Report record | RS-08, RS-09 |
| **P1** | Truthful response dates; fix the fixture clock | RS-23 |
| **P1** | Notifications "responded to your Moment" and "replied to your response", landing on that response with the thread open | RS-21 |
| **P1** | Cursor pagination with loading and error states | RS-31 |
| **P1** | Decisions: delete cascade, Health/Problem, who may respond | D-8, D-9, D-14 |
| **P1** | IME guard on Enter; preserve line breaks | RS-29 |
| **P1** | API contract corrected to R3 (drop `respond {count, byViewer}`; add a Response entity) | RS-40 |
| P2 | Escape closes the top-most layer only; focus return; scrim touch isolation; reveal the sent response; 44px phone targets; localise "(you)", "more/less" and the ⋯ label; collapse window matching the preview; current-band author rings; length/rate limits | RS-16, RS-30, RS-38, RS-12, RS-26, RS-34 |
| P3 | Mentions; links; Moment reference in Chat; remove stray sr-only spans | RS-27, RS-28, RS-20, RS-39 |
