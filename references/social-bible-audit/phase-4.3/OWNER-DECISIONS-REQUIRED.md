# OWNER DECISIONS REQUIRED (§55)

These are genuine product decisions, kept separate from implementation problems. Each entry
gives:
- the question;
- the options (today's behaviour is marked "as today");
- a recommendation (never applied silently);
- **Blocks** — what the decision gates;
- the master-table rows it governs.

The master table's OWNER DECISION? column points here as `YES · D-n`.

**Gating.**
- **4.4-A** needs no decision.
- **4.4-B** needs **D-1, D-2 and D-4**.
- **4.4-C** inherits those through its dependency on 4.4-B, and uses the recommended defaults of
  **D-18**.
- A decision is tiered at least as high as the highest-priority work it blocks.

| Priority | Decisions |
|---|---|
| **P0** | D-1 life position on other people's Moments · D-2 `friends` meaning + launch posture · D-3 Celestial launch posture · D-4 whose Moments a World holds |
| **P1** | D-5 footer hierarchy · D-6 count policy + system cue · D-7 learnability aid · D-8 Health/Problem conversation · D-9 owner stewardship + delete cascade · D-10 safety foundation · D-11 people-present consent · D-12 permalinks · D-13 notification kinds + grouping · D-14 who may respond · D-15 View in Life · D-16 Place tap · D-18 relationship details · D-20 media scope · D-21 light theme with Celestial · D-26 feeling-layer details · D-28 governance of Stage 23 edits |
| **P2** | D-19 thread window · D-22 Composer policy · D-27 Delete/Hide undo · D-29 legacy avatar on the Cosmos chip · D-30 real-photo enforcement · D-31 Chat delivery states · D-32 return from Life · D-36 visibility scope set |
| **P3** | D-17 ancestral records · D-23 profile policy · D-24 mentions · D-25 chat scope · D-33 Cosmos/Earth Back · D-34 what Moments matter · D-35 bookmarks |

---

## P0

### D-1 · Life position on other people's Moments
*Rows MC-03, ID-01, PL-11, ID-10, PF-18, RS-26*

**Today.** The app shows the author's band at each Moment's date: in the readout, the author
ring, response rings, the phone thread header, the Life Cursor and Search Moment rows. Visitor
rings also carry public density. Moment dates are visible, so two Moments either side of a band
boundary bracket the birth date. Two of Sunita's four fixture Moments narrow 15 years to about
3.5. One of the two is friends-only, so today's proof also depends on P0-2. Even a single public
Moment at a band edge tightens the bound.

- (a) Keep band-at-date. This breaches the hard rule.
- (b) Show the author's **current** band on all their Moments.
- (c) **Show no life-position text on other people's Moments.** Rings use the current band.
  Visitor rings have no density.

**Recommendation: (c).** The owner's own Moments keep their exact age. Update
`social-api-contract.md:106` (`lifeAtMoment`) and `circle-of-life.md`.

**Blocks:** 4.4-B (P0-1).

### D-2 · What `friends` visibility means, and the launch posture
*Rows MC-26, PF-01, XC-02, CO-17*

**Today.** `friends` is only a glyph; friends-only Moments reach everyone.

**Who counts as "your people":**
- (a) friend + family
- (b) friend only

**Launch posture:**
- (i) enforce server-side for feed, search, notifications and permalinks together
- (ii) ship Public / Only me until the backend is verified, hiding the Friends option

**Recommendation: (a) + (i)** for the prototype and contract. Ring density stays public-only until
the live contract is confirmed.

**Blocks:** 4.4-B (P0-2); part 2 of P0-3 (View as public hides friends-only Moments).

### D-3 · Is Celestial Resonance part of Social completion?
*Rows RX-03, XC-33, MC-17*

- (a) Boom only for completion; Celestial stays flag-off on `/world`.
- (b) Launch both now. RX-01, RX-02, RX-10, RX-11 and RX-13 all become blocking.
- (c) **Staged.** Complete Social with the flag off; enable Celestial after D-5, D-6 and D-7 and
  RX-01.

**Recommendation: (c).**

**Blocks:** 4.4-G, and whether P0-6 is a blocker.

### D-4 · Whose Moments does a World hold?
*Rows MC-31, ID-07, PF-05, XC-03, PL-23*

**Owner's stream:**
- (a) every delivered Moment, as today
- (b) own + connected people's visible Moments

**A visitor on another person's World:**
- (a) the mixed stream, as today
- (b) **that person's Moments only**, as `social-api-contract.md:204` says

**Recommendation:** owner (b), visitor (b).

**Blocks:** 4.4-B; part 2 of P0-3 (what View as public filters).

---

## P1

### D-5 · Which control leads the Moment footer?
*Rows RX-02, RX-01*

- (a) Resonate stays the most prominent, with the gold glow, as today.
- (b) **Respond leads.** Resonate drops to Respond's weight or below; on phones it is a 44px glyph
  doorway with the word kept in its accessible name.

**Recommendation: (b).** This is also the X1 default.

**Blocks:** 4.4-G; X1 (you may veto the default).

### D-6 · One count policy + a system cue on the presence line
*Rows RX-13, RX-14, RX-11, XC-27*

- (a) Keep the divergence: Boom shows no per-type counts, Celestial shows per-type counts in the
  feed.
- (b) **In the feed, Celestial follows Human Pulse:** ≤3 seals + "{n} people", with per-meaning
  counts in the stage.
- (c) One merged sentence.

Plus a quiet system cue on each summary.

**Recommendation: (b)** plus a cue. Presentation only; Celestial semantics are untouched.

**Blocks:** 4.4-G.

### D-7 · The smallest learnability aid
*Rows RX-10, RX-04, RX-05, RX-09*

- (a) Labels only, as today.
- (b) **A visible "Express" word on Boom** (touch, until first use) **plus one dismissible
  three-line explainer.**
- (c) A full onboarding sequence.

**Recommendation: (b).** Boom's control is inside the preservation boundary, so this needs
explicit approval.

**Blocks:** 4.4-G.

### D-8 · May a Health/Problem record carry responses? (Bible C-15)
*Rows MC-29, RS-36, XC-06, RX-25*

- (a) Yes. Correct `moment-conversation-model.md:103` to match the accepted test
  (`social-shell.js:288-289`).
- (b) No. Gate the presence line, responses and composer on `quiet`, and record a supersession of
  that test.

**Recommendation: (a).** It is lower risk, and only-me Health/Problem already has no audience.

**Blocks:** nothing in 4.4-A to 4.4-C; optional in 4.4-B.

### D-9 · Moment-owner stewardship + response delete semantics
*Rows RS-09, RS-07, XC-10*

**Owner stewardship:**
- (a) none, as today
- (b) **hide from everyone, reversible**; the author sees "hidden by {owner}"
- (c) delete
- (d) both

**Deleting a response that has replies:**
- (a) cascade, as today
- (b) **leave a "Response removed" placeholder** that keeps the replies
- (c) disallow

**Confirm before deleting your own response?** Yes.

**Recommendation:** (b) / (b) / yes.

**Blocks:** 4.4-F.

### D-10 · Minimum safety foundation for launch
*Rows XC-07, XC-08, ID-09, RS-08, RS-10, MC-22*

- (a) Build Report (person, Moment, response, message; reasons; review queue; hidden for the
  reporter) + person-level Block. Mute next.
- (b) Map to existing live-backend features. Needs confirmation of what the live product has.
- (c) Defer with a documented risk.

**Recommendation: (a),** or (b) where the live product already has them. Make the Report toast true
now: it currently claims "someone will look".

**Blocks:** 4.4-F.

### D-11 · People present: scope + consent
*Rows MC-08, CO-12, CO-15*

**Scope:**
- (a) meal and meeting only, as today
- (b) every kind, via `present`

**Consent:**
- (a) author-asserted, visible at once, the named person can remove themselves
- (b) pending until confirmed
- (c) linked only for friend/family, a label otherwise

**Health/Problem:** never?

**Non-account labels** ("Aama"): allowed?

**Recommendation:** scope (b); consent (a) with self-removal and a notification; never on
Health/Problem; labels allowed.

**Blocks:** 4.4-H. The A12/A13 entry fixes are safe now.

### D-12 · Moment permalinks
*Rows MC-23, MC-24, PL-07, CN-15*

- **Route:** `/world?m=<id>` or `/m/<id>`.
- **Logged out:** a sign-in wall, never content.
- **Owners:** get Copy link on their own Moments.
- **Until built:** remove Copy link.

**Recommendation:** `/world?m=<id>`, resolved server-side through the audience rule; a sign-in wall;
owner Copy link yes; remove Copy link until then.

**Blocks:** 4.4-D. The honest-landing part C8 and the true-toast part A19 are safe now.

### D-13 · Which human events notify, and how they aggregate
*Rows CN-04 … CN-10, CN-13, RS-21, RX-21*

**Kinds** — for each, choose notify / quiet / never:
- response on your Moment
- reply to your response
- Boom
- Resonance
- inclusion
- request accepted
- mention

**Grouping:**
- (a) one row per person per event
- (b) **one people-first row per Moment per kind**
- (c) a daily digest

**Recommendation:**
- Interrupting: response, reply, inclusion, request/accepted.
- Quiet: Boom and Resonance.
- Grouping: (b).
- Never engagement totals.

**Blocks:** 4.4-E.

### D-14 · Who may respond to a public Moment?
*Row RS-35*

- (a) anyone signed in who can see it, as today
- (b) connected people only
- (c) the author may turn responses off per Moment

**Recommendation: (a) + (c).**

**Blocks:** 4.4-F (the responses-off control).

### D-15 · View in Life
*Rows MC-18, PL-04, PL-05, PL-29, RX-34*

**Own Moments:**
- (a) keep the disabled pill
- (b) **link to `/life?c=day:<date>` now**

**Other people's Moments:**
- (a) nothing
- (b) their Circle at band resolution (a new subject-addressed route)
- (c) the viewer's own Circle at that date

**Recommendation:** own (b); others (a). Remove the disabled pill from other people's Moments.

**Blocks:** 4.4-D.

### D-16 · What tapping a Place does
*Rows MC-07, PL-01, PL-02, PL-03, PL-26*

- (a) nothing, as today
- (b) **Search narrowed to that place**
- (c) a Place surface
- (d) Earth at that place (frozen Cosmos)

Also: a structured place `{label, placeId?, lat?, lng?, precision?}`?

**Recommendation:** (b) now; structured place next; (c) and (d) later.

**Blocks:** 4.4-D. C12 (Places derived from Moments) is safe now.

### D-18 · Relationship details
*Rows PF-06, PF-09, PF-25, ID-05, PF-04, PL-24, PF-07, CN-23*

**Canonical wording** — one term per state: "Add friend" · "Requested" · "Wants to connect" ·
"Friends" · "Family". The en change is recorded as an owner-superseded assertion.

**Family on PersonCard:**
- (a) Remove → none, as today
- (b) **hide Remove**
- (c) Remove → friend

**People vs the live Friends/Family pages:**
- (a) People replaces them
- (b) **People gains "See all"**
- (c) re-skin them

**Another person's World:**
- (a) **"Open {Name}'s World"** + a visitor route (`/world?p=<id>`)
- (b) keep PersonCard terminal

**A conversation after Remove / Decline:**
- (a) sendable, as today
- (b) **read-only**
- (c) hidden

**Recommendation:** the bolded options.

**Blocks:** 4.4-C (with defaults) and 4.4-D (the World route). The C1 perspective fix and the C4
guard are safe regardless.

### D-20 · Media scope for launch
*Rows MC-10, MC-11, XC-24, CO-03, CO-05*

- A lightbox with swipe?
- In-feed video playback (tap to play, never autoplay)?
- Download: none, owner-only, or anyone?
- **Extend** the one-type media contract to several types per Moment? Meanwhile, A10 enforces the
  current contract in the UI.

**Recommendation:** lightbox yes; playback yes; download owner-only; keep one type per Moment.

**Blocks:** 4.4-H. A10 and A23 are safe now.

### D-21 · Light theme when Celestial is on
*Rows XC-26, PL-19*

Your direction is: "clean premium light; do not automatically force large decorative Solar
Observatory scenery". The flag-on light page forces that scenery. Your uncommitted pass made it
pearl. Boom's surfaces are still warm beige.

- (a) **Scenery becomes opt-in** (a World Wall / atmosphere choice). Light stays clean by default.
- (b) Keep it automatic when Celestial is on.
- (c) Remove the scenery.

**Recommendation: (a).** It follows your stated direction and keeps the pearl work as the opt-in
atmosphere. This also settles whether the uncommitted Light pass is committed as-is.

**Blocks:** 4.4-G; every X-series fix (those files carry the uncommitted pass).

### D-26 · Feeling-layer details
*Rows RX-20, RX-24, RX-33, PF-15, RX-18, ID-17*

- **Who-list names on a public Moment:** everyone, or connections by name and "+N" for others?
  *Recommend: connections by name, others as "+N".*
- **Self-expression / self-resonance:** allowed, and counted in "{n} people"?
  *Recommend: allowed, and counted, since it is a person.*
- **Celestial on Health/Problem:** *Recommend: never, as today.*
- **Approve two changes inside the Boom preservation boundary** (`expressions.tsx`):
  - the who-list guard for unknown ids, which today fall back to a raw name or "M" (RX-18);
  - letting who-expressed rows open the Person card.

  *Recommend: approve both. They are defect and doorway fixes; the mascot and semantics are
  untouched.*

**Blocks:** 4.4-G. Without approval, RX-18 stays open.

### D-28 · Governance of the Stage 23 Celestial edits
*Row RX-27*

Stage 23 edited frozen Social files (`Moment.tsx`, `store.tsx`, `data.ts`, `Chrome.tsx`,
`SocialPreview.tsx`) with no `AGENTS.md` exception rows. The Celestial contract lives only in
`references/celestial-resonance-bible/`.

**Recommendation:** record the rows retroactively, and publish a `docs/handover/celestial-resonance-contract.md`.
This phase changes neither.

**Blocks:** 4.4-G; any 4.4 slice that edits those files should add its rows on top of a clean
record.

---

## P2

### D-19 · Collapsed-thread window + reply addressee
*Rows RS-12, RS-04*

- **Window:** (a) the oldest 3, as today; or (b) **the latest 2 + "N earlier responses"**.
- **Reply on a depth-2 row:** writes under the same parent with a "to {name}" addressee?

**Recommendation:** (b); yes.

**Blocks:** nothing (polish in 4.4-A or 4.4-I).

### D-22 · Composer policy
*Rows CO-20, CO-28, CO-08, CO-21*

| Question | Options | Recommendation |
|---|---|---|
| Verb | "Post" or "Record" | No recommendation — your taste. "Post" is understood; "Record" is truer to a memory |
| Default privacy of a new Moment | Public (as today), Friends, or last-used | Keep Public until D-2 is enforced, then revisit |
| Drafts | memory only (as today), device-local, or server | Device-local, excluding Health/Problem |
| A structured kind with fields but no words | postable, or not | Yes, for Health, Problem and Project when the required fields are filled |
| Photo capture time | may raise the Moment to minute precision, or not | Only when the file carries a time-zone offset; otherwise day precision |

**Blocks:** 4.4-H.

### D-27 · Delete and Hide
*Row XC-09 (and the undo part of MC-20)*

- **Undo:** (a) immediate, as today; or (b) **a 5-second undo toast** for Delete and Hide.
- **Hide:** (a) session-only, as today; or (b) **persisted server-side per viewer**.

**Recommendation:** (b) and (b).

**Blocks:** 4.4-F. The focus fixes in A20 are safe now.

### D-29 · Legacy avatar on the Cosmos identity chip
*Row ID-14*

The pre-login chip in frozen `cosmos/overlays.tsx:198` draws the signed-in person with the legacy
`ui/Avatar` (no Life Ring, no `onError`).

- (a) Authorise migrating it to `PersonIdentity`. This is a frozen Phase 1 exception.
- (b) Keep it, and correct the "no second avatar system" claim.

**Recommendation: (a).** The IdentityGate part (C19) is safe now.

**Blocks:** nothing in the next three slices.

### D-30 · Real-photo rule enforcement
*Row ID-22*

- (a) policy text only
- (b) an upload-time check
- (c) a report path only

**Recommendation: (a) + (c)** for launch.

**Blocks:** 4.4-H.

### D-31 · Chat offline / reconnect / delivery states
*Row CN-33*

This depends on the live Chat backend.
- (a) Map the live states.
- (b) Design prototype states now.

**Recommendation: (a).** Confirm with the live team first.

**Blocks:** nothing in 4.4.

### D-32 · A local return from Life to My World
*Row PL-15*

- (a) Back + the brand mark only, as today.
- (b) A quiet local "My World" return on `/life`. This is a local control, not navigation.

**Recommendation: (b).**

**Blocks:** 4.4-D.

### D-36 · The canonical visibility scope set
*§36, §55; no row. Today: Public / Friends / Only me*

- (a) Keep three scopes.
- (b) Add Family.
- (c) Add custom lists.

**Recommendation: (a)** until D-2 is enforced. Family can then be tested as its own audience.

**Blocks:** nothing now.

---

## P3

### D-17 · Pre-birth *ancestral* records
*Future. Today's refusal (A11, C9) enforces the established rule and needs no decision*

- (a) Keep refusing.
- (b) Allow ancestral records with no life position once the Ancestor Tree exists.

**Recommendation:** decide with the Ancestor Tree.

**Blocks:** nothing now.

### D-23 · Profile policy
*Rows ID-08, ID-19 … ID-21, PF-12, PF-21*

| Question | Recommendation |
|---|---|
| Bio | A short owner-edited line with its own visibility |
| Home place visibility | Owner-controlled; city-level by default |
| What "Who can see your profile" controls | Profile-level Public / Friends; hide the control until built |
| Shared connections | Never, for now |
| Recent searches | Device-local |
| Photo and cover change | Build with the upload pipeline (4.4-H) |

**Blocks:** 4.4-I (optional).

### D-24 · Mentions
*Rows RS-27, CN-11, RS-22*

- (a) Build @mentions (only people who can already see the Moment; with a notification).
- (b) **Drop the untrue "mentioned you" fixture now** and build later.

**Recommendation: (b).**

**Blocks:** A25's last part.

### D-25 · Chat scope
*Rows CN-28, CN-29, RS-20, CN-31*

- A Moment reference in Chat, re-checked against the recipient's audience?
- "Continue privately" from a response?
- Group chat?

**Recommendation:** defer all three. Keep "Message" on the Person card.

**Blocks:** nothing in 4.4.

### D-33 · Back restores Cosmos / Earth state
*Row PL-16 · frozen Phase 1*

- (a) No, as today.
- (b) Push Earth/focus into history. This is a frozen `CosmosExperience` exception.

**Recommendation:** (a) until Earth becomes a Social destination.

**Blocks:** nothing.

### D-34 · What Moments matter
*Row PL-25*

- (a) Pure chronology, as today.
- (b) Owner-chosen significance (pinning a Moment to a band).
- (c) "Same day across your life" (banked in `docs/phase-5-candidates.md:47`).

**Recommendation:** (a) for completion; (c) is a natural Life feature later. Never
engagement-based.

**Blocks:** nothing.

### D-35 · Saved / bookmarked Moments
*§45, §55; no row, no repository evidence of need*

- (a) Not now.
- (b) A private "kept" list.

**Recommendation: (a).**

**Blocks:** nothing.
