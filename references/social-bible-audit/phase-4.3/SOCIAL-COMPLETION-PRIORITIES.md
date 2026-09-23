# SOCIAL COMPLETION PRIORITIES (§51) · TOP 10 GAPS · WHAT MAY STILL BE REQUIRED (§45)

## Priority definitions (§51, applied strictly)

- **P0 — blocks Social completion.** A Life-privacy hard-rule breach, a flow that corrupts or
  publishes data against the person's intent, the owner's privacy tool lying, or a core loop that
  is dead on the first-class device. P0 is kept small on purpose.
- **P1 — required for a strong Social experience.** The connective tissue (permalink, Life link,
  another person's World, notifications), launch safety, and the live contracts.
- **P2 — important connection and polish.**
- **P3 — future expansion.**

Row IDs point to the master table in [SOCIAL-COMPLETION-AUDIT.md](SOCIAL-COMPLETION-AUDIT.md).
**D-n** points to [OWNER-DECISIONS-REQUIRED.md](OWNER-DECISIONS-REQUIRED.md). ✔ means reproduced
in the browser in 4.3.

## P0 — seven items

| # | Blocker | Why it blocks | Needs a decision? | Rows |
|---|---|---|---|---|
| **P0-1** | **Band at each Moment's date lets anyone narrow another person's birth date.** Visitor rings also carry density, even for strangers | Breaks the Life hard rule ("birth-derived calendar precision"). The fixture proof narrows 15 years to 3.5 | **D-1** (rule choice; a recommended default is given) | MC-03, ID-01, PL-11, ID-10 |
| **P0-2** | **`friends` visibility is never enforced.** Friends-only Moments reach strangers in the feed, search, Photos and Places | A privacy promise the UI makes ("your people") is false | **D-2** (who counts as "your people") | MC-26, PF-01, XC-02 |
| **P0-3** | **View as public is not truthful.** The feed, conversation and Life Cursor stay in the owner's view, showing exact ages and only-me Health/Problem Moments under the "Viewing as public" banner | The owner's own privacy tool misinforms them. `AGENTS.md` documents it as the visitor-safe model | **Part 1 — no decision (4.4-A):** everything renders through the public stand-in; only-me dropped. **Part 2 — D-2 + D-4 (4.4-B):** friends-only and author filtering follow the audience rules once decided | MC-27, RS-37, ID-04, CO-18, XC-04 |
| **P0-4** | **Composer corrupts or publishes against intent.** Edit rewrites the time to 12:00 (precision ignored) and rebuilds link/video media from mock constants. **Discard during Posting still publishes** ✔ | Data truth and consent: a discarded Moment goes out (default Public) | No — safe fix | MC-19, CO-10, CO-22 |
| **P0-5** | **Phone deep conversation: Reply is dead** ✔ (with no composer focus ✔, and a Person card hidden behind it ✔, both P1) | The core conversation loop on the first-class device | No — safe fix | RS-05 (+ RS-02, RS-18) |
| **P0-6** | **With Celestial on, Resonate pushes the ⋯ off the Moment at ≤390** ✔ — Edit, Delete, Privacy, Report, Hide and Copy link become unreachable | Blocks enabling Celestial on phones. Not a blocker while the flag stays off (the product default) | Presentation default proposed; **D-5** may veto | RX-01 |
| **P0-D** | **Four P0 decisions:** D-1 (the P0-1 rule), D-2 (the P0-2 audience), **D-3** (Celestial's launch posture) and **D-4** (whose Moments a World holds) | Without D-1, D-2 and D-4, 4.4-B cannot start. Without D-3, it is unclear whether the feeling-layer P1 items block | D-1 … D-4 | RX-03 (+ rows above) |

**How §45 maps to these tiers.** Social is declared complete when **P0 and P1 are done**. That is
what §45's "REQUIRED FOR SOCIAL COMPLETION" means here. P0 is the subset that has to come first,
because it breaks privacy, data truth, or a core loop.

## P1 — required for a strong Social experience

Grouped by the slice that should carry them (see
[PHASE-4.4-IMPLEMENTATION-PLAN.md](PHASE-4.4-IMPLEMENTATION-PLAN.md)).

- **Moment and Respond truth**
  - Respond focuses the phone composer ✔ (RS-02).
  - The Person card appears above the phone thread ✔ (RS-18).
  - Truthful response dates and fixture clock (RS-23).
  - IME guard and line breaks (RS-29).
  - Kind-field leak (CO-11) and mixed-media silent drop (CO-05).
  - Pre-birth refusal (CO-09, PL-09).
  - Raw-name "with" and the `PEOPLE.m` fallback (CO-13, MC-08).
  - Delete focus and stale landings (MC-20).
- **Privacy scope**
  - Whose Moments a World holds (MC-31, ID-07, XC-03; D-4).
  - Server enforcement of Only me and Friends (CO-17).
  - Client payloads band-only (ID-23).
  - Health/Problem conversation (RS-36, XC-06; D-8).
- **Accessibility**
  - Dialog traps, Escape and focus return on modal surfaces (XC-15).
- **Relationships**
  - Viewer-relative relationship state (PF-03, ID-02, ID-03).
  - The relationship/request contract (PF-02).
  - Chat messaging guard (CN-23, PF-07, ID-16).
  - People ↔ live Friends/Family pages (PF-06; D-18).
- **Connective tissue**
  - Another person's World route (ID-05, PF-04; D-18).
  - Signed-in identity on `/world` (ID-06).
  - View in Life for own Moments (PL-04; D-15).
  - Moment permalink (MC-24, MC-23, PL-07; D-12).
  - Place tap (PL-01; D-16).
- **Notifications**
  - Kind/payload contract (CN-04).
  - Generation by actions (CN-05).
  - Truthful response notifications (CN-06, CN-07, RS-21).
  - Grouping (CN-13; D-13).
  - Content privacy (CN-16).
- **Safety**
  - Moment-owner stewardship (RS-09; D-9).
  - Real Report (RS-08, XC-08, MC-22).
  - Block/mute/report person (XC-07, ID-09, RS-10; D-10).
- **Feeling layers (only if Celestial ships; D-3)**
  - Footer hierarchy (RX-02; D-5).
  - Onboarding (RX-10; D-7).
  - Vocabulary disambiguation (RX-11).
  - Count policy (RX-13, RX-14; D-6).
  - Boom trigger label (RX-04).
- **Live seams**
  - Shared Chat session (CN-22).
  - Conversation pagination (RS-31).
  - Response API entity (RS-40); people-present contract (CO-26).
  - Media alt and photo pipeline (MC-10, MC-13, CO-02).
  - Empty/loading/error states (MC-32).
  - Themes conflict (XC-26; D-21).
  - Governance: Celestial edits to frozen files recorded, Celestial contract in `docs/handover` (RX-27; D-28).

## P2 — connection and polish (selection)

- **Doorways:** people lists → Person (PF-15, ID-17); Chat → Person (CN-30); the request
  notification's read-sync and outcome truth (CN-02, CN-03, PF-13); Search's own row (PF-23).
- **Accessibility:** menus with focus return and arrow keys (XC-16); Escape layering (RS-16); live
  regions (XC-18); label-in-name (RX-29).
- **i18n:** Chat, Moment chrome, notification dates, identity entry (XC-12 … XC-14, CN-17, CN-26).
- **Celestial Field:** remove, dismissal, stage cap (RX-07, RX-08, RX-16). Desktop presence wrap
  (RX-15). Stale `wonder` fixture (RX-26). Boom who-list guard (RX-18, gated on D-26 — inside the Boom boundary).
- **Performance:** image sizes, invisible LifeCounter tick, scroll-time work (XC-20, XC-21, XC-22).
- **Composer:** drafts, validation, keyboard (CO-20, CO-21, CO-24). Response edit, delete and limits
  (RS-06, RS-34).
- **Life:** pre-birth `?c=` bounds (PL-08). Query survives identity (PL-14). Return to My World from
  Life (PL-15; D-32). Visitor Circle link (PL-20).
- **Docs:** stale docs corrected to accepted behaviour (PF-26, ID-24, CO-27).

## P3 — future expansion

Mentions, attachments and links in responses, multi-person chat, Moment in Chat, recent people,
people from Places, shared connections, bio, "what Moments matter" (significance), Ancestors,
Earth deep links, the Place surface, and bookmarks.

## TOP 10 SOCIAL GAPS (§75)

1. **Life-position inference on other people's Moments** — P0-1, D-1.
2. **`friends` audience not enforced** — P0-2, D-2.
3. **View as public lies about the feed** — P0-3.
4. **The Composer corrupts edits and publishes discarded Moments** ✔ — P0-4.
5. **Phone conversation broken** ✔ — Reply dead, no composer focus, Person card hidden. P0-5 / P1.
6. **Celestial on phones hides the ⋯ menu and outshines Respond** ✔ — P0-6, D-3, D-5.
7. **Notifications have no producers.** No response, reply, Boom, Resonance or inclusion creates
   one. The fixtures are untrue. There is no grouping — P1, D-13.
8. **No safety foundation.** The Moment's owner cannot remove a response, Report is a toast, and
   there is no block, mute or report-person — P1, D-9, D-10.
9. **The relationship graph has one side.** Visitor state is inverted, Message goes to yourself,
   and `/chat?c=` opens a thread with anyone — P1.
10. **The Moment has no connective tissue.** No permalink, an inert Place, View in Life disabled,
    and no route to another person's World — P1, D-12, D-15, D-16, D-18.

## §45 — What may still be required

| Item | Classification | Reason |
|---|---|---|
| Reply-to-response | **REQUIRED** (exists; fix the phone surface) | Conversation continuity; one level is enough |
| Edit/delete response | **REQUIRED** (exists; fix line breaks, add a confirm, no cascade) | Ownership of your own words |
| Mentions | **FUTURE** | No model yet. Drop the untrue fixture now (D-24) |
| Attachments in responses | **NOT APPROPRIATE (now)** | Keeps responses as conversation around the Moment's own media (`moment-conversation-model.md:84-97`) |
| Moment people tagging ("people present") | **REQUIRED** (fix the entry) · consent **USEFUL NEXT** | The storage exists and entry is broken. The consent model is D-11 |
| Place linking | **REQUIRED** (step 1: tap → Search narrowed, no new data) · structured place and Place surface **USEFUL NEXT** | A Moment's "where" must lead somewhere (PL-01, P1) |
| Moment deep links | **REQUIRED** | Notifications, Life, Chat and Copy link all need one address (D-12) |
| Copy/share | **REQUIRED to be truthful** — remove Copy link until permalinks exist | No public viral sharing |
| Saved/bookmarked Moments | **FUTURE** | No repository evidence of the need |
| Report/block/mute | **REQUIRED** (Report + Block + owner stewardship) · Mute **USEFUL NEXT** | Minimum safety foundation |
| Visibility controls | **REQUIRED** (exist; enforce `friends`) | P0-2 |
| Notification grouping | **REQUIRED** once notifications are generated | Noise control (§64) |
| Read/unread | **REQUIRED** (exists; fix request sync) | — |
| Private Chat transition | **USEFUL NEXT** (exists via the Person card; add Moment context later) | Never automatic |
| Profile relationship actions | **REQUIRED** (exist; fix the visitor perspective) | — |
| Friend request flow | **REQUIRED** (exists; add the "accepted" signal, contract) | — |
| People filtering | **USEFUL NEXT** (friends vs family) | — |
| Search | **REQUIRED** (exists; gate `friends`) | No universal search engine needed |
| Media viewer | **REQUIRED**: a lightbox, or stop drawing tappable tiles · video: playback, or remove the play affordance (MC-10, MC-11, P1) | D-20 |
| Moment editing/deleting | **REQUIRED** (exists; fix Edit truth) | P0-4 |
| Draft composer | **REQUIRED** (exists) | Persistence policy is D-22 |
| Loading/error states | **REQUIRED** as live seams | Feed, pagination, mutations |
| Pagination | **REQUIRED** (feed exists; conversation missing) | — |
| Empty states | **REQUIRED** (only "no Moments" is missing) | Teach, don't gamify |
