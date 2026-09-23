# SOCIAL SYSTEM MAP (§47) — current connections

Legend: **[EXIST]** works end to end in the prototype · **[PARTIAL]** works with a named gap ·
**[MISSING]** no connection · **[DISCONNECTED]** both ends exist but are not joined ·
**[BROKEN]** the connection exists and fails · **[CONFLICT]** it contradicts an approved contract ·
✔ runtime-verified in 4.3. Labels follow the canonical master-table rows.
Row IDs refer to the master table in [SOCIAL-COMPLETION-AUDIT.md](SOCIAL-COMPLETION-AUDIT.md).

## 1. The map

```
COSMOS  (/ · Earth is a state inside it, /?to=earth)
  │  [EXIST]  Brand mark → / from every personal route; "Enter my world" chip; identity gate
  │           continues to the remembered destination; one 480 ms arrival resolve
  │  [PARTIAL] a deep link loses its query through identity (?c= on /life and /chat dropped)
  │  [DISCONNECTED] My World → Earth (EARTH_INTENT is exported, with no consumer)
  ▼
MY WORLD  (/world)
  │  [EXIST]   the owner's Hero + Almanac + Life instruments
  │  [DISCONNECTED] always renders fixture Maya, not the signed-in person (ID-06)
  │  [CONFLICT] the stream holds EVERY author's Moments, on anyone's World (MC-31, PF-05)
  ▼
PERSON  (ProfileHero · PersonCard · PersonIdentity everywhere)
  │  [EXIST]   one identity system: real photo → initials, band-only Life Ring for others
  │  [MISSING] another person's World: no product route, the PersonCard is a dead end (ID-05, PF-04)
  │  [BROKEN]  visitor perspective: inverted request direction, Message opens a chat with yourself (ID-02, ID-03)
  ▼
MOMENT  (MomentEntry — the unit of the Almanac)
  ├── PLACE            [MISSING]  plain <span>; tap does nothing; Search Places is a static list (PL-01, PL-02)
  │      └── EARTH     [DISCONNECTED]  no coordinate, no link (PL-03)
  ├── LIFE             Moment → Circle day  [DISCONNECTED]  "View in Life" disabled; coordForDate ready (PL-04)
  │                    Circle day → Moment  [EXIST]  DayAlmanac renders MomentEntry, owner only (PL-06)
  ├── PEOPLE PRESENT   [PARTIAL]  fields.with on meal and meeting only; raw names mis-resolve to "M";
  │                                no consent, notification or self-removal (MC-08, CO-12…15)
  ├── RESPOND          [PARTIAL]  inline: write, one reply level, edit, delete, retry work;
  │                                timestamps BROKEN, delete cascades, edit drops line breaks (RS-23, RS-07, RS-06)
  │                    [BROKEN]   phone deep thread: Reply dead ✔, no composer focus ✔, person hidden ✔ (RS-05, RS-02, RS-18)
  ├── BOOM             [EXIST]    mascot deck/Atlas → Human Pulse → Spectrum → who (MC-16)
  ├── CELESTIAL        [DISCONNECTED] off on /world by default (XC-33)
  │                    flag on: [EXIST] Field + constellation · [BROKEN] phone row pushes ⋯ off ✔ (RX-01)
  ├── MEDIA            [PARTIAL]  photos, grid, fallback, link card; no lightbox; video has no playback (MC-10, MC-11)
  └── URL / SHARE      [MISSING]  no permalink; Copy link writes a fake systemboom.example URL (MC-23, MC-24)

PERSON ⇄ PEOPLE / FRIENDS ⇄ CHAT ⇄ NOTIFICATIONS
  PERSON ↔ PEOPLE/FRIENDS  [PARTIAL]  People utility: Find, Requests, Your people; five states;
                                      one-perspective graph (PF-03); live Friends and Family pages unreachable (PF-06)
  PEOPLE/FRIENDS → CHAT    [PARTIAL]  "Message" for connected people → mini dock (≥1024) or /chat;
                                      the guard is UI-only, /chat?c=<anyone> is sendable (CN-23)
  CHAT → PERSON            [DISCONNECTED]  chat headers are plain text; /chat mounts no PersonCard (CN-30)
  CHAT → MOMENT            [MISSING]  ChatMessage is text-only; no Moment route (CN-29)
  CHAT ↔ NOTIFICATIONS     [EXIST]    separate unread truths by design (Messages dot vs bell) (CN-12)
  SOCIAL ACTIONS → NOTIF.  [MISSING]  no response, reply, Boom, Resonance or inclusion produces one ✔ (CN-05)
  NOTIFICATIONS → MOMENT   [PARTIAL]  lands on the Moment in-stream, not on the response; silent if gone (CN-15)
  NOTIF. (request) ↔ REL.  [PARTIAL]  answered in place; resolving elsewhere leaves it unread; outcome chip can lie (CN-02, CN-03)
  RESPOND → PERSON         [EXIST] inline · [BROKEN] phone surface ✔ (RS-17, RS-18)
  RESPOND → CHAT           [PARTIAL]  via PersonCard → Message, no Moment context (RS-20)
  WHO-LISTS → PERSON       [DISCONNECTED] Boom who-expressed and Celestial who-resonated rows are inert (PF-15)
  SEARCH → PERSON · MOMENT [EXIST]    lands on the Person card / reveals and focuses the Moment (PF-17)
  SEARCH → PLACE           [PARTIAL]  narrows the query only (PL-02)
```

## 2. Edge table

| From → To | Status | Evidence | Row |
|---|---|---|---|
| Cosmos → My World | EXIST | `CosmosRoot.tsx:61-79`, `IdentityGate.tsx:314-347`, `SocialPreview.tsx:420-429` | PL-13 |
| My World / Life / Chat → Cosmos (Home) | EXIST | `Brand.tsx:50-68` | PL-12 |
| Deep link → identity → back to the deep link | PARTIAL | `intent.ts:12-18` and `PersonalDestination.tsx:27` drop the query | PL-14 |
| My World → Earth | DISCONNECTED | `destinations.ts:57` EARTH_INTENT has no consumer; Earth accepts no coordinate | PL-03 |
| My World → own Person (Hero) | EXIST | `ProfileHero.tsx:165-285` | PL-22 |
| Any surface → another person's World | MISSING | harness-only viewer modes (`SocialPreview.tsx:461-471`) | ID-05, PF-04 |
| Person → their Moments (visitor) | CONFLICT | no author filter (`store.tsx:113-119`) vs `social-api-contract.md:204` | MC-31, PF-05 |
| Moment → Place | MISSING | `Moment.tsx:199-204, 221-227` | PL-01 |
| Place → Earth | DISCONNECTED | `CosmosExperience.tsx:182` (frozen) | PL-03 |
| Moment → Life day | DISCONNECTED | `Moment.tsx:307-310, 344, 351`; seam `circle/model.ts:186-189` | PL-04 |
| Life day → Moment | EXIST (owner) | `DayAlmanac.tsx:18-71` | PL-06 |
| Moment → people present | PARTIAL | `data.ts:43`, `Moment.tsx:247-272`, `Composer.tsx:671-675` | MC-08, CO-13 |
| Moment → Respond (inline) | PARTIAL (timestamps, delete cascade) | `Moment.tsx:464-525` | RS-01 |
| Moment → Respond (phone deep thread) | BROKEN ✔ | `Moment.tsx:546-548, 596, 599, 609` | RS-02, RS-05 |
| Moment → Boom | EXIST | `Moment.tsx:304, 372` | MC-16 |
| Moment → Celestial | DISCONNECTED (flag off) / BROKEN phone (flag on) ✔ | `flags.tsx:30-39`; K360 | XC-33, RX-01 |
| Moment → Media viewer | MISSING | tiles are no-op buttons; the video play button does nothing (`Media.tsx:54-66, 84-88`) | MC-10, MC-11 |
| Moment → URL | MISSING | `Moment.tsx:350` fake domain; no route in `src/app` | MC-24 |
| Moment author / with / response author → Person card | EXIST (inline) | `Moment.tsx:186-189, 247-270, 637-640` | MC-02 |
| Response author (phone thread) → Person card | BROKEN ✔ | both `z-[60]`, card paints behind (`PersonCard.tsx:82`, `Moment.tsx:555`) | RS-18 |
| Boom / Celestial who-lists → Person | DISCONNECTED | `expressions.tsx:1159-1167` (Boom boundary), `ResonateControl.tsx:359-364` | PF-15 |
| Person card → Chat | EXIST (connected only) | `PersonCard.tsx:72-76, 131-135` | CN-31 |
| Chat deep link permission | BROKEN | `ChatSurface.tsx:51`, `WorldProvider.tsx:58-79` | CN-23 |
| Chat → Person / Moment | DISCONNECTED (Person) · MISSING (Moment) | `Messages.tsx:194-197`, `ChatSurface.tsx:114-117`, `model.ts:51-68` | CN-29, CN-30 |
| Social actions → Notifications | MISSING ✔ | only `read`, `readAll` and `notifications` write them (`store.tsx:211-241`) | CN-05 |
| Notification → Moment | PARTIAL | `Chrome.tsx:471-477`, `focus-moment.ts:14-15` | CN-15 |
| Request notification ↔ relationship | PARTIAL | `Chrome.tsx:524-529` vs `People.tsx:97-101`, `PersonCard.tsx:113-117` | CN-02, CN-03 |
| Search → Person / Moment / Photo | EXIST | `Chrome.tsx:349-434` | PF-17 |
| Search → Place | PARTIAL | `Chrome.tsx:424` narrows only | PL-02 |
| /world ↔ /life ↔ /chat state | DISCONNECTED (prototype) | three fresh stores (`SocialPreview.tsx:397-401`, `CirclePreview.tsx:66-72`, `ChatSurface.tsx:29-37`) | CN-21, PL-30 |

## 3. My World home architecture (§20)

| The question My World should answer | Answered? | Where / why not |
|---|---|---|
| WHO AM I? | **Yes** | The Hero: photo inside the Life Instrument, name, home, Born, contact (owner) |
| WHAT IS HAPPENING? | **Yes, with the wrong scope** | A chronological Almanac with a TODAY rule and the bell. It holds every author's Moments on anyone's World, and friends-privacy content from people who are not connected (MC-31, XC-02) |
| WHO ARE MY PEOPLE? | **Utility only** | The People panel in the bar. No surface on the page, and no route to a person's World (PL-24) |
| WHAT MOMENTS MATTER? | **Not answered** | Pure chronology, by design. Significance is an owner decision (PL-25) |
| WHERE DID THEY HAPPEN? | **Partly** | Place is text only. The Circle day header even substitutes the person's home (PL-26) |
| WHERE DO THEY LIVE IN MY LIFE? | **Yes (owner)** | The Hero Life line, instrument, LifeCounter, Circle module, Life Cursor, "What happened at {age}". The outward link from a Moment is disabled |
| WHAT CONVERSATIONS ARE HAPPENING? | **Utility only** | Messages and the mini chat, plus the per-Moment presence line (PL-28) |

**Hierarchy verdict.** For the owner, the page is coherent. Identity comes first, the Life
instruments sit to the side, and the Almanac holds the stream. It stops being coherent when
anyone else visits: *whose* World it is and *whose* Moments it shows disagree.

## 4. What stops the "one human graph" today

1. **The Moment has no address.** There is no URL. Place, Life, Chat and Notifications all need
   one to land somewhere outside the feed.
2. **The relationship graph has one side.** Everything relational (the visitor Hero, Chat
   permission, `friends` visibility, notifications to the other party) is computed from the
   owner's map.
3. **Nothing emits events.** Respond, reply, Boom, Resonance and inclusion are silent, so the
   graph never tells anyone anything.
4. **People reached from feeling layers are dead ends** (who-expressed, who-resonated), and so is
   Chat (its header opens nothing).
5. **The three routes hold three memories.** This is prototype-only, but it hides whether
   cross-route continuity works: a Response written in `/world` is gone in `/chat`.
