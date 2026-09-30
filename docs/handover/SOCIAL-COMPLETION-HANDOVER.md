# SOCIAL WALL COMPLETION — master handover (S1–S8)

The one document for the live team covering the Social Wall completion program. It sits
beside — never replaces — the accepted handover set (`social-api-contract.md`,
`moment-conversation-model.md`, `people-chat-integration.md`, `person-life-identity.md`).
Everything here is enforced in the CLIENT PROTOTYPE (reducers + fixtures, no server); each
"LIVE" line is an obligation on the backend, not something this repo implements.

## S1 — Trust foundation
- Relationship states: `none · request-in · request-out · friend · family` (+ documented
  `removed` = `none`; BLOCK is an open owner decision, recorded in the ledger with options).
- ONE relationship truth: `relationshipBetween(map, viewerId, otherId)` in `world/model.ts` —
  direction-aware (pending inverts), owner-anchored storage, `relationshipKeyFor` for writes.
  Every surface (Hero, PersonCard, People, Search, notifications, feed) reads it.
- ONE access seam: `canSeeMoment(m, viewerId, rel)` in `social/view-model.ts`.
  Matrix: owner sees own everything; `public` → everyone; `friends` → friend/family
  (LIVE: verify the friends-privacy backend contract before widening anything);
  `onlyme` → owner only. `composeFeed` builds My World (own + accepted connections' visible
  Moments — no strangers, no ranking) and a person's World (their Moments only).
- Visitor Life privacy: another person's Moment readout states the CURRENT band only —
  never a historical band (it brackets the birth year), never exact age/day-count; ring
  density is owner-only; the Life Cursor names year + place only on foreign Moments.
- View as public renders through the same stranger row (`PUBLIC_VIEWER`, never persisted);
  every write inside the preview is refused.
- LIVE: all of the above must be enforced SERVER-SIDE; the client checks are presentation.

## S2 — Respond conversation
- Response Boom: the ONE expression registry (18, canonical order) at conversation weight —
  `Note.expressions?: Record<personId, expressionId>`, single-active per person, who-list is
  a people list (identity + name, registry order, no ranking). No Like exists.
- Shallow threading: two visual levels; a reply's Reply opens the PARENT's composer with a
  real chosen mention of who is being answered (`initialMention` — recorded like a picked
  suggestion, never scanned).
- Delete with children → tombstone (`removed: true`, text cleared in state, no identity, no
  actions); the tombstone leaves with its last reply. Childless deletes just go.
- Mentions: suggested only from this Moment's participants + the viewer's connections;
  stored as chosen person ids (`Note.mentions`), rendered as doorways to the person.
- Response media: at most ONE image (`Note.photo`), graceful failure to its own words.
- Long conversations: the focused surface opens on the latest 20 (`CONV_BATCH`),
  "View N earlier responses" widens chronologically. No Top/Best/ranking anywhere.
- LIVE: mention notifications, tombstone semantics and the single-active Boom are server
  contracts; event grammar comes from the backend (fixture text stands in).

## S3 — People + friends
- Complete lifecycle verified end-to-end: none→Requested→Cancel→none; request-in→Accept /
  Decline; friend→Remove→none. PersonCard is the junction: state chip + one primary action +
  Message (connected) + Open World + quiet Remove + quiet Report (S6).
- people-present ≠ friends ≠ responders ≠ boomers: all identity-only doorway lists.

## S4 — Signal
- `Notification` gains `noteId?` + kinds `reply · mention · response-boom · moment-boom ·
  accepted` beside `request · resonance`. Every fixture event is TRUE against fixture data.
- Exact landing: a response event lands ON that response (`focusNote` → the Moment opens its
  conversation in the width's own shape; the batch window widens to include an earlier
  response; the landing owns focus). `accepted` opens the person. Deleted/hidden/unseeable
  targets → the truthful announce, panel stays.
- Chat is NOT a bell event: message-unread keeps its own badge (accepted rule).
- LIVE: the event feed supplies kind + momentId/noteId/whoId; unread state is server truth.

## S5 — Moment completion
- Private Save: `state.saved` (viewer's own ids, no counts, invisible to others). Save leads
  both ⋯ menus; the Saved surface lives in the account menu (a bookmark is an account
  concern, not navigation); entries land exactly; delete purges bookmarks (no ghosts);
  the public preview pauses Save like every stranger action.
- Share: `navigator.share` where the platform has it (menu renders post-click, so no SSR
  mismatch), Copy link stays the universal path. NO repost engine, no quote, no boost.
- LIVE: saved ids are per-person server state; share URLs become real permalinks (D-12).

## S6 — Search + safety
- Search runs through `canSee` (S1) — a visitor can never search private words.
- Person Report: quiet, last action on the card; announced; a report is NOT a block.
- BLOCK: deliberately absent — OWNER DECISION recorded in the ledger (options A/B/C,
  recommendation A) — never invented by inference.
- Edge states: unknown chat deep link → truthful list; unknown ?profile= → own World;
  stale notification landing → announce; deleted Moment → no ghost anywhere (feed, saved,
  landing, search all read live state).

## S7 — UX completion
- The new surfaces hold the accepted device bar: 320 survival, dark material from tokens,
  reduced-motion instant landings, keyboard + focus return, 44px targets (a contested strip
  between Reply and the Response Boom is split at the gap midline — both stay whole).

## S8 — Monetization foundation
- `src/lib/entitlements/` + `docs/handover/monetization-foundation.md`. Architecture only:
  the `Entitlement` union (storage/archive/memory/legacy/personalization/export tiers),
  `EntitlementSource`, `FREE_PLAN`, `can()`. The free core is complete by construction —
  core capabilities are not entitlements at all. NO billing exists in this repo.

## Owner decisions still open
1. BLOCK semantics (S6) — options + recommendation in `SOCIAL-COMPLETION-LOOP.md`.
2. D-1/D-2/D-3/D-4 from Phase 4.4 (life position on others' Moments; what `friends` means;
   Celestial launch posture; whose Moments a World holds) — untouched by this program.

## Suites
`social-s1-trust` 24 · `social-s2-respond` 29 · `social-s3-people` 14 · `social-s4-signal`
13 · `social-s5-moment` 15 · `social-s6-safety` 8 · `social-s7-polish` 8 — beside the full
accepted fleet (final counts in `SOCIAL-COMPLETION-LOOP.md`'s verification record).
