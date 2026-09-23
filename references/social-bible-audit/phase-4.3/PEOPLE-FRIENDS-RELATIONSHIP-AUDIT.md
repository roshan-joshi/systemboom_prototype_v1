# PEOPLE · FRIENDS · RELATIONSHIPS · PERSON IDENTITY · SEARCH (§16–§18, §24–§27)

**Status: PARTIAL.** Everything below is **prototype** behaviour:
- `world/model.ts` fixtures and the `WorldProvider.tsx` reducer, all in memory.
- **A partial contract.** `docs/handover/people-chat-integration.md` §2 defines the five states and
  their transitions, and marks them unverified. **No directional per-pair API or payload exists**:
  `social-api-contract.md` `PersonRef` is `{ id, name, avatarUrl?, bandIndex, bandLabel }` and
  "nothing else" (PF-02).

## 1. Person identity (§16)

**Owner Hero** (`ProfileHero.tsx`):
- World Horizon cover, with a theme fallback when the image fails.
- "My World" kicker.
- A 168px Life Instrument (116px on phones) that links to `/life`.
- Name, verified badge, home.
- `band 30–45 · N days · Life →`.
- Born `DD MON YYYY · HH:MM`.
- A contact pill ("only you see this"), inline on desktop and inside *Manage profile* on phones.
- *View as public*.
- **Inert:** change photo, change cover, and "Who can see your profile" (ID-08).

**Visitor Hero:**
- Cover and a "{Name}'s World" kicker (the brand agrees).
- An inert band-only ring.
- Name and home.
- The relationship state + one action.
- "Circle band X — the exact age is theirs to share".
- **Absent:** Born, contact, day count, Life link.
- The sidebar card is wrongly headed "MY LIFE IN" (ID-12).

| §16 item | Status |
|---|---|
| Real photo when available | **COMPLETE** (photo → initials, one component) |
| Fallback when absent | **COMPLETE** (initials; `onError` too) |
| Life Ring near identity | **COMPLETE** |
| Owner view | **COMPLETE**, except the inert controls |
| Visitor view | **BROKEN** in visitor modes: inverted request direction; Message opens a chat headed by the visitor themself (ID-02, ID-03) |
| Relationship status | **COMPLETE** for all five states on the Hero; wording drifts across surfaces |
| Bio / about | **MISSING**. `demoUser.bio` exists and is never shown (D-23) |
| Location permissions | **MISSING**. Home is always public; the visibility control is dead (D-23) |
| Contact privacy | **COMPLETE**. Absent from a non-owner's `PersonView` |
| Moment history | **CONFLICT**. A visitor sees every author's Moments, not the subject's (ID-07, D-4) |
| Friends/family list, shared Places/Moments | **MISSING** (D-23) |
| Chat action | **PARTIAL**. Message only when connected; BROKEN in visitor mode |
| Life action | **COMPLETE** for the owner; none for a visitor, by design |
| Another person's World | **MISSING**. No product route; the PersonCard has no "Open {Name}'s World" (ID-05, PF-04) |
| Signed-in identity | **DISCONNECTED**. `/world` always renders fixture Maya (ID-06) |

## 2. Real profile photo rule (§17) and Life Ring identity (§18)

One component, `identity/PersonIdentity.tsx`, is the entry point everywhere. The rule is:
real photo → initials, with no illustrated tier. The matrix below is from code and was
spot-checked in the captures.

| Surface | Real photo | Fallback | Life Ring | Life precision shown |
|---|---|---|---|---|
| Hero (owner, 168/116px) | ✔ | initials | ✔ tick, owner density, engraving, entry animation | owner: band, day count, Born |
| Hero (visitor / View as public) | ✔ | initials | ✔ no tick, **public-only density + engraving** | "Circle band X" |
| Moment author (24px) | ✔ | initials | ✔ **drawn at the Moment's date** | own: exact age; others: **band at the Moment's date** (P0, D-1) |
| Moment "with" people (24px) | ✔ | initials | ✔ current band | none |
| Response author (20px) | ✔ | initials | ✔ at the response's time | none in text |
| People panel (40/48px) | ✔ | initials | ✔ | "Circle band X" (+ town) |
| Search people (28px) | ✔ | initials | ✔ | band + relationship chip, or town |
| Notifications (32/24px) | ✔ | initials | ✔ | none (identity only) |
| Messages / mini chat / Chat (28/24/26px) | ✔ | initials | ✔ | none |
| Celestial who-resonated (20px) | ✔ | initials | ✔ | none. **Row not clickable** |
| Boom who-expressed (40px) | ✔ | initials | ✔ | none. **Row not clickable**; raw-name fallback (RX-18) |
| IdentityGate / Cosmos identity chip | ✔ | initials, **no `onError`** | **✘ legacy `ui/Avatar`** (ID-14) | self |

**Verdict.**
- The real-photo rule is COMPLETE across Social.
- The Life Ring is a real identity primitive everywhere except the pre-login identity chip,
  which sits in the frozen Cosmos (`cosmos/overlays.tsx:198`) and the paused IdentityGate.
- Relationship and presence are never drawn into the ring (COMPLETE).

## 3. Relationship model (§24)

**Semantics: PARTIAL, with CONFLICTS.**

- **States:** `friend · family · request-in · request-out · none`. "Connected" means friend or
  family (`model.ts:27, 49`).
- **Transitions:** add → `request-out`; accept → `friend`; decline, cancel and remove → `none`
  (`WorldProvider.tsx:47-57`).
- **No follower model** (COMPLETE). The only mentions in `src` are comments forbidding it.
- **Central defect (BROKEN, PF-03).** The map stores **one perspective: Maya's**. Nothing is keyed
  by viewer–subject pair, and no requester/addressee is stored. Consequences in visitor modes:
  - As `prakashVisitor`, the requester sees "Wants to connect" + **Accept** on Maya's World, so
    he can accept his own request. The accepted test asserts this
    (`social-connection-final.js:184-191`), which contradicts `model.ts:16`.
  - As Bikash, the Hero says "Friends" while PersonCard, People and Search call Maya
    "Not connected" + Add friend.
- **Family (PARTIAL).** Family exists only in seed data; Accept never creates it. PersonCard offers
  Remove on family (→ none), which contradicts "tree editing untouched" (PF-09).
- **Fixture contradiction.** Prakash is `request-in`, yet Maya responded to his friends-only
  Moments.

## 4. Friends (§25) — what the prototype disconnected

- **Request flow (prototype, COMPLETE for the owner):**
  - **Send:** Add friend on PersonCard, a People row, or the visitor Hero.
  - **Pending:** "Requested" / "Request sent" + Cancel; the search chip reads "Requested".
  - **Incoming:** four places — the notification row, People "Wants to connect", PersonCard
    "Asked to be your friend", and a steel dot on the People icon.
  - **Resolve:** every surface on the route updates together.
- **Gaps:**
  - The other party is never notified: there is no "accepted your request" kind (PF-14).
  - Resolving outside the notification row leaves that notification unread (CN-03).
  - The outcome chip is binary, so Accept → Remove reads "Declined" (CN-02).
  - Remove has no confirm (PF-10).
- **Disconnected from the live product (PF-06):**
  - The live Friends page (tabs, search, grid, Unfriend) and the Family tree have no entry point
    from People or PersonCard.
  - `social-feature-parity.md:32` ("Friends inside People (not built)") is stale.
  - Person-level block/mute is UNKNOWN on the live side (`my-world-product-completeness.md:34`).
- **Per surface:**

  | Surface | Status |
  |---|---|
  | Profile | state + action (owner perspective only) |
  | Moment | author, "with" and response authors open the card; feeling who-lists do not (PF-15) |
  | Chat | Message for connected people; guard UI-only (CN-23); header doesn't open the person |
  | Notifications | request row answered in place |
  | Search | relationship chip |
  | Privacy | `friends` visibility is **not** gated by the relationship (P0, D-2) |
  | Real photos / Life Ring | COMPLETE |

## 5. People surface (§26)

| Function | Status | Evidence |
|---|---|---|
| Find people | **COMPLETE** | Name substring, excludes self (`People.tsx:172`, `data.ts:277-282`) |
| Friends | **COMPLETE** | "Your people" |
| Family | **PARTIAL** | Present but visually identical to friends (PF-11) |
| Recent people | **MISSING** | — |
| People from Moments | **PARTIAL** | Author / with / response → card; expressers and resonators are inert |
| People from Places | **MISSING** | — |
| Shared connections | **MISSING** | Impossible on a one-perspective graph (D-23) |
| Profile opening | **MISSING** | No World for another person |
| Chat | **COMPLETE** | Message on your people |
| Relationship controls | **COMPLETE** (owner) | Add / Cancel / Accept / Decline; Remove only on the card |
| Filtering | **MISSING** | Text only |
| Popularity / follower metrics | **absent: COMPLETE** | no counts, no suggestions, no ranking (PF-24) |

## 6. Search (§27)

| Aspect | Status | Evidence |
|---|---|---|
| People / Moments / Photos / Places groups | **COMPLETE** | `Chrome.tsx:349-434` |
| Real photo + Life Ring | **COMPLETE** | 28px people, 22px Moment author |
| Life privacy | **COMPLETE** | band only for others |
| Only-me withheld | **COMPLETE** | `Chrome.tsx:253` |
| `friends` content | **CONFLICT** | not gated (Prakash's friends-only Moments are searchable by anyone) |
| Band at the Moment's date on Moment rows | **P0 privacy** | D-1 |
| Keyboard / screen reader | **PARTIAL** | Tab only; no combobox or arrow keys; "Search results" aria-label in English |
| Mobile | **COMPLETE** | Back · auto-focused field · Clear sheet |
| Empty / zero state | **COMPLETE** | one hint + Recent |
| Recent search | **PARTIAL** | a static fixture |
| No-result state | **COMPLETE** | sentence + Clear |
| Own row | **BROKEN** | a dead click (PF-23) |
| Places | **PARTIAL** | a static list; two recorded places can never appear; the same place in two scripts counts twice |
| Conversations / media search | **not built** | appropriate to defer; not needed for completion |

## 7. Owner decisions in this area

- **D-2:** does a friend/family relationship unlock `friends` Moments, and does Family count?
- **D-18:**
  - canonical relationship wording;
  - Family on PersonCard (hide Remove?);
  - People vs the live Friends/Family pages (replace / link / re-skin);
  - a route to another person's World;
  - what happens to a conversation after Remove.
- **D-23:** bio, home visibility, what "Who can see your profile" controls, shared connections,
  and where recent searches are stored.

## 8. Safe fixes in this area (no decision)

One wording per relationship state is **not** here: it is D-18, a decision.

- Derive the request outcome chip from a stored outcome, not the live relationship.
- Mark the request notification read wherever the request is resolved.
- Your own search row: make it non-interactive, or give it a real destination.
- Add the relationship word to "Your people" rows.
- A neutral "unavailable person" instead of the `PEOPLE.m` fallback.
- A prototype chat guard (connected people or an existing conversation only; never yourself).
- One shared 1024px mini-chat breakpoint.
- Search combobox semantics.
- A Tab trap in PersonCard.
- **Viewer-relative relationship state.** A defect fix. It *changes an accepted assertion*
  (`social-connection-final.js:184-191`), so it must be recorded in `AGENTS.md` as a supersession.
  The invariant ("the addressee answers a request") gets stronger, not weaker.
