# SOCIAL PRIVACY + SAFETY AUDIT (§19, §36–§38, §44, §66)

- **Privacy: CONFLICT.** The data boundary is sound, but two inference/scope rules are not enforced.
- **Safety: MISSING.** Nothing does more than a toast or change in-memory state.

## 1. The Life hard rule (§19)

> Visitors must never receive another person's exact birth date/time, exact age, day count, Life
> fraction, precise Life coordinate, or birth-derived calendar precision. Relationship level must
> not silently increase Life precision.

### 1a. Direct fields — COMPLETE (prototype)

- **`view-model.ts` is the boundary.**
  - `personViewFor` gives contact details to the owner only.
  - `lifeViewFor` returns `{scope:"other", band, bandIndex}` to anyone else.
  - `momentLifeFor` gives an exact age only on your own Moments.
  - `ringViewFor`: the red tick is owner-only, and non-owner density counts `public` Moments only.
  - `FORBIDDEN_ON_OTHER` lists 11 keys.
- **✔ probe J.** Bikash visiting Maya's World sees no birth date, no day count, and no exact age
  other than on his own Moment.
- **Relationship never raises precision.** `connected` is deliberately unused in the density
  filter; PersonCard and the Hero stay band-only in every state.
- **Foot-gun.** `lifePosition()` (`social/life.ts:32-49`), full precision, is still exported and
  unused (ID-23).

### 1b. Inference — CONFLICT, P0 (D-1)

**Other people's dated Moments print the author's band at the Moment's own date:**
- the readout (`Moment.tsx:112, 194-198`)
- the author ring (`at = moment`)
- the phone conversation header
- response-author rings (at the response's time)
- the Life Cursor (`LifeCursor.tsx:76-77`)
- Search Moment rows

**Why this breaks the rule.** Moment dates are public, so a band change between two Moments
brackets the birth date. The live contract mandates the same (`lifeAtMoment {bandLabel}`,
`social-api-contract.md:106`).

**Proof from fixtures.** Sunita Tamang (born 1979-11-02) authors four Moments. Two of them:

| Moment date | Band shown |
|---|---|
| 2022-10-17 | 30–45 |
| 2026-04-13 | 45–60 |

Anyone can conclude she was born between 1977-10-17 and 1981-04-13. That narrows a 15-year window
to 3.5 years, and dense Moments near a boundary narrow it to days.

Two caveats, both of which make the rule more important, not less:
- `m-wedding` (2022) is `privacy: "friends"`. Today's stranger-visible proof therefore also rides
  on P0-2, and the bracket stays open to every connected viewer even after `friends` is enforced.
- Even a single public Moment at a band edge tightens the bound. Sunita's public `m-tenphotos`
  (45–60 on 2026-04-13) alone moves her latest possible birth date five months earlier than her
  current band allows.

**The repo's own design names this inference.** `docs/design/circle-of-life.md:96-101` removed
visitor density for exactly this reason. The same class includes **visitor ring density +
engraving** (public-only, drawn even for strangers, since `PersonIdentity` defaults
`connected=false`, not `undefined`). The code comment at `SocialPreview.tsx:504-505` says
otherwise.

**Recommended rule (for D-1):**
- **Other people's Moments carry no life-position text.**
- Their author ring, response-author rings and Life Cursor use the author's **current** band only.
- A visitor's ring carries **no density**.

Why: the Moment's date already situates it. The *owner's* own Moments keep exact age. This
removes every bracket without touching Circle internals.

**Alternative:** show the author's current band on all their Moments. It is also safe, but it
reads oddly on a 1983 Moment.

### 1c. Surface sweep

| Surface | Visitor receives | Status |
|---|---|---|
| Profile Hero | band; no Born, contact or day count | COMPLETE (direct) · density CONFLICT |
| Sidebar counter / Circle module | "theirs to see" + band; month count owner-gated | COMPLETE |
| Moment readout | band at the Moment's date | **CONFLICT (inference)** |
| Response rows | band-only ring at the response's time | hardening (current band) |
| People / Search / PersonCard | band (+ relationship chip) | COMPLETE |
| Notifications | identity only | COMPLETE |
| Chat | identity only | COMPLETE |
| Boom / Celestial who-lists | identity only | COMPLETE |
| Life (`/life`) | never a visitor on the product route; harness visitor forced to band level | COMPLETE |
| Client bundle | every fixture person's birth date is shipped to the client | **prototype only.** The live payload must carry `PersonRef` band fields only (ID-23) |

## 2. Visibility / privacy scopes (§36)

**Current model:** `Privacy = "public" | "friends" | "onlyme"` (`data.ts:26`).
- Labels: Public "anyone" · Friends "your people" · Only me "just you".
- The readout uses "only you" and the aria text "Friends only" — three words for the same values.
- The default is **Public**. Health/Problem switch to **Only me** unless the person chose
  otherwise.
- Privacy can be changed after posting.
- **No `family` scope and no custom scope exist.** None should be invented without a decision.

| Scope | Enforced where | Status |
|---|---|---|
| Only me | feed + search filter other people's `onlyme` (`store.tsx:117`, `Chrome.tsx:253`) | **COMPLETE** (prototype) |
| Friends | **nowhere**. It is a glyph. Friends-only Moments render to strangers in the feed, search, Photos and Places tallies | **P0, D-2** |
| Public | everyone | COMPLETE |
| Live | the server contract for `friends` is **unverified** (`view-model.ts:138-139`); `composer-states.md:67` says the live system exposes Public only | **P1, D-2 launch posture** |

## 3. Owner vs visitor (§38)

| Surface | Owner | Visitor | Status |
|---|---|---|---|
| Profile | exact Life, Born, contact, manage | band, relationship, Message | visitor perspective BROKEN (ID-02, ID-03) |
| Moment | exact age on own | band at date (CONFLICT); Report/Hide/Copy link | CONFLICT |
| Respond | edit/delete own; **no stewardship on own Moment** | write, reply, report | MISSING (RS-09) |
| People | full relationship controls | — (People is the viewer's own utility) | — |
| Resonance / Boom | may express on own Moments (counts toward "{n} people") | same | D-26 |
| Life links | `/life` exact | none (by design) | COMPLETE |
| Contact | owner-only | absent | COMPLETE |
| Place | text | text | same for all |
| Notifications | own | **in visitor harness modes the chrome shows Maya's inbox, conversations and relationships** | prototype-only (XC-05) |

### View as public — BROKEN, P0

**What it promises.** `AGENTS.md` ("rendering through this exact same visitor-safe model") and
`moment-conversation-model.md:104` ("shows exactly what a genuine visitor receives").

**What it does.** `PUBLIC_VIEWER` drives only the Hero, the profile Life and the Circle module
(`SocialPreview.tsx:516-519, 704`). The feed (`:743` → `Moment.tsx:103, 112`), the conversation
and the Life Cursor (`:717`) still render as the owner. Under the "Viewing as public" banner the
owner sees:
- their own exact ages;
- their **only-me Health/Problem Moments**.

**Why it matters.** Nothing leaks to other people, but the owner's own privacy tool gives them a
false picture of their exposure.

**Test gap.** The accepted test compares only the Hero's DOM (`person-life-identity.js` §11).

**Fix in two parts.**
- **Part 1 (4.4-A, no decision).** Everything renders through the public stand-in, and only-me
  Moments are dropped.
- **Part 2 (4.4-B, after D-2 and D-4).** Friends-only Moments and other authors' Moments are
  filtered by the same audience rule a genuine stranger gets.

## 4. Public / unauthenticated experience (§66)

What an unauthenticated person can reach today, as designed:
- **Cosmos.** Everything personal redirects to Cosmos with the requested destination remembered.
  The query is dropped (PL-14).
- **Nothing from My World is public.** There are no Moment permalinks, public profiles or share
  pages.

**Recommendation for the live product (D-12):**
- Keep Social fully authenticated.
- A permalink opened while logged out leads to sign-in and then resolves server-side with the
  audience check.
- Never render content before auth.
- Visitors (signed in, not the owner):

  | Access | Rule |
  |---|---|
  | Moments | Public, plus Friends when the relationship allows (D-2) |
  | Respond | Allowed where they can see the Moment (D-14 decides whether only connections may respond) |
  | Resonance / Boom | Allowed |
  | Chat | Connected people only, enforced server-side |

## 5. Safety — minimum missing foundation (§37)

| Capability | Status | Evidence |
|---|---|---|
| Block person | **MISSING** | no code anywhere in `src` |
| Mute person | **MISSING** | no code |
| Report person | **MISSING** | PersonCard, Hero and People have none |
| Report Moment | **toast only** | `Moment.tsx:348`; `en.ts:96` claims "someone will look" |
| Report Response | **toast only** | `Moment.tsx:686` |
| Report chat message | **MISSING** | — |
| Content removal by the Moment's owner | **MISSING** | the response menu is own-only |
| Owner delete: Moment | **COMPLETE** (confirm) | `Moment.tsx:333-343` |
| Owner delete: own response | **PARTIAL** | no confirm; cascades other people's replies |
| Hide someone's Moment | **PARTIAL** | session-only, no undo, focus lost |
| Remove friend | **PARTIAL** | immediate, no confirm |
| Copy link | **BROKEN** | fake domain, false success |

**Minimum foundation for launch (D-10; P1, not P0 for completion):**
1. **Report** with a target (person · Moment · response · message) and a reason → a review queue.
   The reported item is hidden for the reporter at once. The toast says only what is true.
2. **Block** at person level: both directions stop seeing each other's Moments, responses,
   requests and messages. Existing responses from the blocked person are hidden for the blocker.
3. **Moment-owner stewardship:** hide (reversible) or remove a response on your own Moment (D-9).
4. **Mute** (person-level, silent) is useful next, not required.
5. **Not needed now:** a full moderation platform, trust scores, rate-limit UI.

## 6. Anti-pattern check (§44) — PASS, with two caveats

**Absent from the code:** followers as status, follower or friend counts, likes leaderboards,
reaction ranking, trending, viral scores, streaks, engagement scores, top commenters, top
reactions, popularity badges.
- The only mentions in `src` are comments forbidding them (`People.tsx:17-18`).
- Search order is fixture insertion order.

**Caveats (not leaderboards, but worth deciding):**
- The Celestial constellation shows per-meaning counts and a total in the feed. That contradicts
  Human Pulse's feed rule and Celestial's own count rules (D-6).
- Celestial counts animate on other people's commits.

**Infinite dopamine animation.** None. The LifeCounter's per-second digit roll is the accepted
Life instrument, but it keeps rendering while CSS-hidden below @5xl (XC-21).
