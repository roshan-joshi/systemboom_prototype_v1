# CHAT + NOTIFICATIONS — SEAM AUDIT (§28, §29, §64)

**Notifications: DISCONNECTED.** The surface, read state and request answering all work, but no
Social action produces a notification (✔ probe I).

**Chat: PARTIAL.** It exists and carries real identity. The permission guard is UI-only, and Chat
has no doorways to a Person or a Moment.

Nothing here is P0. Both belong to the live-contract P1 set, which matches
`my-world-product-completeness.md:45`.

## 1. Notifications as human events (§28)

The type allows `kind?: "request" | "resonance"` (`data.ts:111`). Everything else is kind-less
English fixture text (`data.ts:748-757`). **`social-api-contract.md` defines no Notification
payload at all.**

| Human event | Status | Evidence |
|---|---|---|
| Someone invited you (friend request) | **COMPLETE** (prototype) | Accept/Decline in the row (`Chrome.tsx:505-533`) |
| Your request was accepted | **MISSING** | no kind; `request-out` never resolves |
| Someone Responded to your Moment | **CONFLICT** (fixture only) | nt3, nt5, nt8 claim responses on Moments with `notes: []`. They come from the retired tap. nt1 says "left a note" |
| Someone replied to your Response | **MISSING** | `Note.parentId` exists and produces nothing |
| Someone Resonated | **DISCONNECTED** | the row renderer exists (`Chrome.tsx:547-551`); its only producer is a harness mode that is never dispatched; the fixture has no `momentId`; `notificationsIntegration` is never read; the test is vacuous (`celestial-s3-s6.js:183`, `ok(notifOk \|\| true)`) |
| Someone used Boom | **MISSING** | a documented seam (`moment-expression-contract.md:75-76`); correctly not faked |
| Someone included you in a Moment | **PARTIAL** | fixture nt7 only; the Composer never produces it |
| Mention | **CONFLICT** | fixture nt4 claims a mention; no mention model exists |
| Someone sent you a Chat message | **COMPLETE by design** | the Messages dot, a separate unread truth from the bell (CN-12) |

- **Read / unread (COMPLETE in memory).** Activating a row marks it read, as does Accept/Decline
  and "Mark all read". The bell dot is driven by notification unread only.
  - BROKEN: resolving a request elsewhere leaves its notification unread (CN-03).
  - BROKEN: the outcome chip is binary and can say "Declined" untruthfully (CN-02).
- **Landing (PARTIAL).**
  - It lands on the Moment in-stream (`reveal` + `focusMoment`), not on the response, and does
    not open the conversation.
  - A deleted, hidden or not-visible target fails silently after the panel has closed.
  - The target lookup uses all client Moments, not the Search visibility rule (CN-15, CN-16).
- **Privacy of text (PARTIAL).**
  - Identity rows are band-only and carry no Life text.
  - There is no audience field and no `privacySafePreview`. No current fixture leaks, but nothing
    structural prevents it.

## 2. Noise control (§64)

**MISSING.**
- Rows are grouped by calendar day only.
- There is no per-Moment or per-actor aggregation, no caps, and no mute. `?notifications=many`
  renders 26 flat rows.

**Recommendation (D-13).** These are not implemented, because they are undefined.

- **One row per Moment per kind**, people-first, in the same grammar as Human Pulse
  ("{n} people"):
  - "Asha, Bikash and 3 others responded to your Mustang Moment."
  - "Maya and 4 others resonated with your Moment."
- **Never counts of engagement.** No "17 new reactions", no totals across Moments.
- **Names only for people the recipient may see.** Everyone else is "{n} others". This reuses the
  Celestial "+N unnamed" rule that already exists.
- **Kinds that interrupt** (the dot): request, a response on your Moment, a reply to your
  response, inclusion in a Moment.
- **Kinds that are quiet** (listed without raising the dot): Boom and Resonance. Or never notify
  them — an owner call.
- If one person Responds + Expresses + Resonates on one Moment, that is **one row** naming the
  most expressive act (the response), not three.

## 3. Chat integration (§29)

| Check | Status | Evidence |
|---|---|---|
| Person identity | **COMPLETE** | real photo + Life Ring, band-only, in the panel, dock, list and thread header |
| Real profile photo / Life Ring | **COMPLETE** | — |
| Moment deep link | **MISSING** | `ChatMessage` is text-only; no Moment route |
| Respond → Chat | **PARTIAL** | via PersonCard → Message (connected people only); no context; hidden behind the phone thread ✔ |
| Notification seam | **COMPLETE** by design | the Messages dot vs the bell. Chat Resonance never reaches Notifications (no chat-message subject) |
| Celestial Seal | **COMPLETE behind a flag** | actor-aware `{resonanceId, at}`, static seals. The actor is hard-coded `"me"`. Seals don't say who; `celestial.chat.who` is orphaned |
| Multi-person chat | **MISSING** | keyed by one `personId` (D-25) |
| Mobile | **PARTIAL** | dock ≥1024px / full `/chat` below. Five one-shot `matchMedia` reads with no resize handling; a hard-coded 57px bar; no desktop Back; no bell or account on `/chat` |
| Messaging permission | **BROKEN** | `/chat?c=<any id>` opens a sendable thread, including strangers and yourself (`ChatSurface.tsx:51`); `send` is unguarded (`WorldProvider.tsx:72-79`) |
| Failed send | **MISSING** | `ChatMessage.failed` unused; the text is always cleared, against `people-chat-integration.md:76-77` |
| Timestamps | **PARTIAL** | `HH:MM` only |
| Localisation | **PARTIAL** | Chat is almost entirely hard-coded English |
| Shared SYSTEMBOOM session | **MISSING** | documented P1 (`people-chat-integration.md:54-60`) |
| State continuity `/world` → `/chat` | **DISCONNECTED** (prototype) | fresh stores: a just-written Response, an accepted request and read state are lost on phone Message → Back |

## 4. Disconnected seams (list)

1. The Celestial notification path: its harness mode is never dispatched, the flag is never read,
   and the mark is not gated.
2. Chat Resonance never reaches Notifications.
3. Notification read state (SocialStore) and relationship state (WorldProvider) have no bridge.
4. `/world` and `/chat` do not share state (prototype).
5. Chat has no doorway to a Person or a Moment.
6. The Human Pulse and Resonance who-lists do not open a Person or a Chat.
7. The `resonance-arrive` harness produces no signal.
8. Notifications land on the Moment, not the Response.
9. A gone target fails silently.

## 5. Doc conflicts to correct (report, then fix the doc)

- `23-CONTROLLED-IMPLEMENTATION.md:16` reports "Notification Signal PASS". The assertion is vacuous.
- `README-for-developer.md:498`, `social-interaction-spec.md:143` and `social-feature-parity.md:34, 116`
  still call Chat a placeholder.
- Stale claims in `SOCIAL_BIBLE_AUDIT.md`:
  - `:75` — no suite loads `/chat`. False: `complete-my-world.js` does.
  - `:765-766` — the kind union is out of date.
  - `:806-808` — the Asha unread arithmetic is wrong; `unread: 2` is consistent.
- `my-world-product-completeness.md:24` rates Notifications "READY". No payload contract exists.
