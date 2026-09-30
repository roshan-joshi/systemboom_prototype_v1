# SOCIAL BIBLE AUDIT — LIFE PRIVACY MATRIX

**Phase 0 · evidence audit · 2026-09-16 · read-only.**
Every claim below is traced to a file, a function and (where one exists) the test that protects it.
**No privacy conclusion in this document is drawn from CSS, layout or a screenshot alone** — the
structural claims come from the view-model source and from the `__SB_VM_OTHER_KEYS` probe the
accepted suite reads. Screenshots are corroboration, never proof.

---

## 1. The privacy boundary: one module, one pair of shapes

**File: `src/components/style-lab/social/view-model.ts` (176 lines).** Its own header states the
rule (`:1–15`):

> "Q1 / C1 is a data contract, not a display rule. Every Social surface renders a PersonView +
> LifeView produced HERE for the (viewer, subject) pair. … Those fields are ABSENT, not hidden.
> In the live system this is the server's job: visitor payloads never contain birth-derivable
> fields."

Four exported functions form the whole boundary:

| Function | Line | Signature | Returns |
|---|---|---|---|
| `personViewFor` | 71 | `(viewer, subject) → PersonView` | id, name, home, avatar?, verified?, cover?, **contact only when owner** |
| `lifeViewFor` | 87 | `(viewer, subject, at) → OwnerLife \| OtherLife` | the discriminated union below |
| `momentLifeFor` | 110 | `(viewer, author, at) → { exact?, band }` | exact only when `viewer.id === author.id` |
| `ringViewFor` | 158 | `(viewer, subject, at, moments?, connected?) → RingView` | bandIndex always; fraction owner-only; momentsByBand per the rules in §4 |

The owner test is one line and is used by all four (`:69`):

```ts
const isOwner = (viewer: Person, subject: Person) => viewer.id === subject.id;
```

`isOwnerView` at the page level is derived the same way — `me.id === profile.id`, not an
enumerated list of viewer modes (AGENTS.md records this as a deliberate self-critique fix, so a
future viewer mode cannot be missed).

---

## 2. The two life shapes, verbatim

```ts
export interface OwnerLife {                       // view-model.ts:36–52
  scope: "owner";
  birth: BirthTruth;                               // birthDate, birthTime?, birthTimeKnown
  precision: "day" | "minute";
  exact: string;                                   // "34y 10m 12d"
  years: number; months: number; days: number;
  totalDays: number;
  fraction: number;                                // 0–1 across the 150-year Circle → the red tick
  band: string; bandIndex: number;
  bandYears: (i: number) => [number, number];      // calendar years — reveals the birth year
}

export interface OtherLife {                       // view-model.ts:54–58
  scope: "other";
  band: string;
  bandIndex: number;
}
```

and the enforcement list the suite asserts against (`:175–176`):

```ts
export const FORBIDDEN_ON_OTHER = ["birth","birthDate","birthTime","precision","exact",
  "years","months","days","totalDays","fraction","bandYears"] as const;
```

---

## 3. THE MATRIX — what each viewer actually receives

`OWNER` = the subject looking at their own World. `OTHER` = anyone else, **including the owner's
own "View as public" preview**, which is routed through a technical stand-in viewer
(`PUBLIC_VIEWER`, `SocialPreview.tsx:44`) so it resolves through the identical "other" branch —
there is no second privacy implementation.

| Datum | OWNER receives | OTHER receives | In the DOM for OTHER? | In ARIA for OTHER? | Mechanism |
|---|---|---|---|---|---|
| `birthDate` | yes (`life.birth.birthDate`) | **absent from the object** | no | no | `lifeViewFor:88` early-returns the `OtherLife` shape |
| `birthTime` | yes when known | **absent** | no | no | same |
| `birthTimeKnown` / `precision` | yes | **absent** | no | no | same |
| Birth instant (`Date`) | computed locally from `birth` | never computed for a non-owner outside `bandAt()` | no | no | `bandAt:80–85` computes the band and discards the instant |
| Exact age `"34y 10m 12d"` | yes (`life.exact`) | **absent** | no | no | `:97` only inside the owner branch |
| `years` / `months` / `days` | yes | **absent** | no | no | `:98–100` owner branch |
| Day count `totalDays` | yes (12,735 in the capture) | **absent** | no | no | `:91, :101` owner branch |
| `fraction` (0–1) | yes | **absent** | no | no | `:102` owner branch; `ringViewFor:161` sets `ring.fraction` only `if (life.scope === "owner")` |
| Present tick (the red NOW marker) | rendered | **not rendered** | no | no | `LifeRing.tsx:65` `const own = ring.fraction !== undefined;` → `:198` `{own && (<g>…<rect data-sb-tick-angle …/></g>)}` |
| 15-year band label (`"30–45"`) | yes | **yes — this is the one permitted life datum** | yes | yes | `bandAt()` |
| `bandIndex` | yes | yes | as geometry | — | ring fill |
| Band calendar years (`2021–2036`) | yes (`bandYears`) | **absent** | no | no | `:105` owner branch; would reveal the birth year |
| Density `momentsByBand` | own Moments, **all privacies incl. Health/Problem** | see §4 | as opacity + engraving | in the interactive band `aria-label` only on the Circle | `ringViewFor:162–171` |
| Contact (phone, email) | yes | **absent from `PersonView`** | no | no | `personViewFor:76` `if (isOwner(...)) v.contact = {...}` |
| Cover / World Wall | yes | yes | yes | — | `personViewFor:75` |
| Moment age readout | exact for own Moments | band for everyone else's | band text | band text | `momentLifeFor:110–113` |
| "Next round day" sentence | yes | **not rendered at all** | no | no | visitor branch replaces the counter with `"A person's counter is theirs to see. Band 30–45"` (shot 12) |
| `only-me` Moments | own ones visible | **filtered out of the feed before render** | no | no | `store.tsx:104–111` `orderFeed` filters `m.privacy !== "onlyme" \|\| m.authorId === meId` |

**Visual corroboration:** shot `10-desktop-dark-my-world-owner.png` (owner: Born line
`04 NOV 1991 · 06:42`, contact pill, `12,735 days`, red tick, "4 moments recorded this month")
beside shot `12-desktop-dark-person-visitor.png` (visitor: no Born line, no contact pill, no
counter, `Circle band 30–45 — the exact age is theirs to share`, Circle module reads `30–45 BAND`,
no tick, no per-month count). Same two states in light: shots 01 and 03/24.

---

## 4. Documented-memory density — the one conditional rule, and its live-port flag

`ringViewFor(viewer, subject, at, moments?, connected?)` has **three** behaviours, chosen by which
arguments the caller passes (`view-model.ts:158–173`):

| Call shape | Who calls it | Density produced |
|---|---|---|
| `moments` omitted | every small/dense identity (Moment rows, notes, search, notifications, chat, composer, who-expressed) | **none** — no `momentsByBand` at all |
| `moments` passed, `connected` **omitted** | `CircleModule.tsx`, the full Circle (`circle/model.ts`) | **owner only** — Phase 5 §23 behaviour, bit-for-bit unchanged |
| `moments` passed, `connected` **passed** (even `false`) | `PersonIdentity` call sites only: `ProfileHero.tsx:186/189`, `PersonCard.tsx:92` | a non-owner gets density built from **`privacy === "public"` Moments only**, with `kind !== "health"` and `kind !== "problem"` |

The filter, verbatim (`:169`):

```ts
const visible = moments.filter((m) => m.authorId === subject.id
  && m.kind !== "health" && m.kind !== "problem" && m.privacy === "public");
```

> **FRIENDS PRIVACY BACKEND CONTRACT — VERIFY DURING LIVE PORT.**
> `connected` is threaded to every call site but is **deliberately unused inside the filter**
> (`view-model.ts:164–171` says so in code). The Social Freeze Delta (AGENTS.md, 2026-09-12)
> records the owner's ruling: nothing in this repository's handover evidence verifies that the
> live product's friend/family relationship is what gates a `privacy:"friends"` Moment, and an
> unverified relationship must never be assumed to unlock density. Turning it on is a one-line
> change once the backend contract is confirmed.

Two safeguards worth stating plainly, both visible in the code:

1. **The aggregation SET is the safeguard, not a post-filter.** The counts are computed over an
   already-restricted list; the product never computes a full count and hides entries after.
   `docs/handover/circle-of-life-spec.md` §4 states the same rule as a live obligation:
   *"Never 'filter after counting'."*
2. **Density cannot narrow a birth date**, because position (`bandIndex`, `fraction`) is unchanged
   by the density path — a visitor still gets no fraction, no tick and no calendar years.

**Tested:** `prototype-tests/person-life-identity.js` §6 asserts, against the live probe
`window.__SB_RING_DENSITY`:
- `total(mayaSelf) === total(mayaConnected) + 2` — exactly the two only-me Health/Problem Moments are excluded, nothing else;
- Krishna's single `friends` Moment yields **0/0** for both a connected friend and a stranger;
- Prakash yields **3/3** (3 public of 5) for both;
- `total(prakashConnected) === total(prakashStranger)` — "connected changes nothing until the contract is verified".

`prototype-tests/my-world-2030.js` adds a rendering-level check:
`engraveFriend === engraveStranger` — "a connected friend and an unconnected stranger see
identical engrave texture — public-only, no relationship leak".

---

## 5. Where the birth truth itself is enforced

`src/lib/identity/birth.ts` is the single place birth truth is normalised. It matters to privacy
because it is what prevents an *invented* precision from existing to leak.

| Rule | Code | Effect |
|---|---|---|
| An unknown time is **dropped, not defaulted** | `normalizeBirth:61–72` — returns `{ birthDate, birthTimeKnown: false }` with **no `birthTime` key** | the serialized JSON never carries a time that was never given |
| A malformed time with `birthTimeKnown: true` degrades to unknown | `:68` `const known = input.birthTimeKnown && isValidBirthTime(time)` | no invented hour is ever stored |
| Day precision anchors at **local midnight**, explicitly not a claim | `birthInstant:91–94` + the doc comment at `:74–78`: *"that midnight is NOT a claim about the time of birth and must never be displayed"* | calendar math works; no fabricated clock is displayable |
| The instrument stops where the truth stops | `social/life.ts:63–65` `availableUnits()` → `precision === "minute" ? all 7 : UNITS.slice(0,4)` | an unknown birth time means the counter ends at **days**, never hours |

The older `parseBirthInstant()` in `lib/life-time.ts:16` *does* default to `"00:00"`; its own
header (`birth.ts:5–9`) records that runtime consumers must use `birthInstant()` instead. That is
a real foot-gun kept for the style-lab demo — recorded, not fixed.

**Tested:** `prototype-tests/identity-model.js` asserts all four at the **serialized-JSON** level
(i.e. exactly what would sit in localStorage), including *"a time supplied WITH
birthTimeKnown:false is dropped, never stored"* and *"unknown time → day precision anchored at
LOCAL midnight (no UTC drift)"*. **AGENTS.md never names this file** — see §8.

---

## 6. Health / Problem — the non-social record

| Gate | Code | Effect |
|---|---|---|
| The kind set | `Moment.tsx:26` `export const QUIET_KINDS = new Set(["health","problem"]);` | one definition |
| The flag | `Moment.tsx:112` `const quiet = QUIET_KINDS.has(moment.kind);` | one read |
| No Respond | `Moment.tsx:292` `{!quiet && ( … data-sb-respond … )}` | verb removed |
| No Expression control | `Moment.tsx:303` `{!quiet && <ExpressionControl moment={moment} />}` | picker never mounts |
| No Human Pulse | `Moment.tsx:366` `{!quiet && <ExpressionSummary moment={moment} />}` | aggregate never mounts |
| Never in a visitor's density | `view-model.ts:169` `m.kind !== "health" && m.kind !== "problem"` | unconditional, regardless of relationship |
| Privacy defaults to Only me | `Composer.tsx:186–198` `if (isQuiet && !wasQuiet && !privacyTouched) privacy = "onlyme";` | and restores the previous privacy on leaving the kind |
| Only-me Moments never reach a non-author's feed or search | `store.tsx:104–111`; `Chrome.tsx:252` | structural |

**One inconsistency found — reported, not fixed.** The *responses* affordance at
`Moment.tsx:367–378` is **not** gated by `quiet`. A Health or Problem record therefore still shows
"Write a response" and mounts a working response composer, even though Respond and the whole
Expression system were removed from it. `docs/handover/moment-conversation-model.md` §7 states the
intended rule as *"no Respond, no Expression control, no aggregate, **no conversation**"* — so the
code and the accepted contract disagree. Logged as **C-15** in `SOCIAL_BIBLE_CONTRADICTIONS.md`.

Visual: shot `23-desktop-dark-quiet-kinds.png`.

---

## 7. Where the privacy rule is asserted (four independent levels)

This is the most redundantly-protected invariant in the repository. It is defended at four levels,
each of which would catch a different class of regression:

| Level | What it attacks | Where |
|---|---|---|
| 1 · Serialized model | the stored JSON shape (birth truth) | `prototype-tests/identity-model.js` (pure Node, no browser) |
| 2 · View-model keys | the object a non-owner's branch produces | `social-final.js` §2 reads `window.__SB_VM_OTHER_KEYS` and asserts every one of the 11 `FORBIDDEN_ON_OTHER` keys is absent |
| 3 · Aggregate density | what feeds a non-owner's ring | `person-life-identity.js` §6 (`__SB_RING_DENSITY`), `circle.js` §9–§10, `my-world-2030.js` §11 |
| 4 · Raw DOM string scan | anything that reached the page by any path | `social-final.js` §2, `circle.js` §9, `person-life-identity.js` §11 — scan `document.documentElement.outerHTML` for `"04 NOV 1991"`, `"06:42"`, `"1991-11-04"`, the day count and `/\d+y \d+m \d+d/`, **across viewer × theme × width** |

Level 4 runs for `visitor` and `ashaVisitor`, in light and dark, at desktop and 360 —
16 combinations in `social-final.js` alone. Positive controls run alongside every negative
(`ok(mayaOwn, "Maya sees her own moments with the exact age")`), so the checks cannot pass merely
because the feature is missing.

---

## 8. Privacy risks and weaknesses found (recorded, nothing changed)

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| **P-1** | **Open contract — the asymmetry is the finding** | `privacy: "friends"` is **not gated by relationship anywhere in the product** — not in the feed (`store.tsx:104–111` withholds only `onlyme`), not in search (`Chrome.tsx:252`, same rule), and the ring deliberately withholds it (`view-model.ts:169`, public-only). So the *same* Moment is fully readable by a visitor while not counting toward that person's documented-memory density. The ring's caution is deliberate and flagged in code; the **feed and search are the untested half of the same unverified contract**. The live port must decide and enforce this server-side. **Empirically confirmed** — see below. | `store.tsx:108`, `Chrome.tsx:252`, `view-model.ts:138–150` |
| **P-2** | High (live-port) | Identity is client-side only; `PersonalDestination` is a UX gate. Server-side guarding of `/world` `/life` `/chat` is a stated **P1**. Nothing in the prototype verifies anything. | `shell/PersonalDestination.tsx`, `docs/handover/my-world-product-completeness.md:48–51` |
| **P-3** | Medium | `lifePosition()` in `social/life.ts:32–49` computes `fraction`, `totalDays` and the band for **any** person and gates only `exact` on `isSelf`. It is currently **called by nothing** (grep: zero call sites outside its own file), so it leaks nothing today — but it is an exported function whose shape invites exactly the mistake `view-model.ts` exists to prevent. | `social/life.ts:32–49`; call-site grep |
| **P-4** | Medium | `PersonIdentity.tsx:65` builds its default accessible position label as `` `Circle band ${pos.band}` `` — **hardcoded English, not `t()`**. 10 of the 18 call sites pass no `label`, so on every non-English locale a non-owner's ring announces an English string. Not a data leak (the band is permitted), but it is an untranslated privacy-adjacent label. | `identity/PersonIdentity.tsx:65`; call-site list in `SOCIAL_BIBLE_COMPONENT_MAP.md` |
| **P-5** | Low | `Moment.tsx:194` `title="Your age at this moment"` and `:196` `` title={`Circle band ${pos.band} years`} `` are hardcoded English tooltips on the life readout. | `social/Moment.tsx:193–197` |
| **P-6** | Low (test hygiene) | Two privacy checks have decayed into near-vacuity, one recorded and one not. **Recorded:** `s2-person-world.js` §70's `!/12,732/` is date-fragile against a live clock (AGENTS.md notes it; the exact-age half still asserts). **Not recorded:** `circle.js` contains `ok(visitorDensity.filter(c => c === 1).length === 0 \|\| true, "probe self-view computed")` — the `\|\| true` makes it unconditionally pass. | `s2-person-world.js`; `circle.js` |
| **P-7** | Low | The `/chat` surface carries no life data at all (bubbles + `HH:MM` only, `Messages.tsx:108–160`), which is correct — but it is also **not covered by the DOM string scan**, because no privacy suite loads `/chat`. `complete-my-world.js` scans the *conversation panel* inside `/world`, not the route. | suite route table in `SOCIAL_BIBLE_TEST_MAP.md` |
| **P-8** | Informational | `SocialPreview.tsx:44` `PUBLIC_VIEWER` carries a hardcoded `birthDate: "2000-01-01"` for the technical stand-in. It is never rendered or named, and `person-life-identity.js` §11 compares the preview's DOM byte-for-byte against a genuine visitor's. Recorded so no future reader mistakes it for a person. | `SocialPreview.tsx:37–44` |

### P-1, measured against the running prototype

A read-only DOM probe was run against the unmodified application at
`/style-lab/social?viewer=visitor` (Bikash viewing Maya's World), with the feed fully paged in.
The Moments actually rendered, in order:

```
m-sameage · m-meal · m-rain · m-activity · m-video · m-boudha · m-project · m-meeting ·
m-face · m-one · m-600 · m-nepali-2 · m-nepali-1 · m-noplace · m-link · m-forty ·
m-panorama · m-snow · m-tenphotos · m-wedding · m-1983          (21 of 23)
```

- **All six `friends`-privacy fixtures are present** — `m-1983` (Sunita), `m-project` (Prakash),
  `m-meeting` (Sunita), `m-face` (Prakash), `m-nepali-2` (Krishna), `m-wedding` (Sunita) — and
  the code consults no relationship at any point in producing that list.
- **Both `onlyme` fixtures are correctly absent** — `m-health`, `m-problem`.
- **No birth-derived string appears anywhere in the DOM**: `"04 NOV 1991"` false, `"06:42"` false,
  `"1991-11-04"` false.

The birth-privacy invariant therefore holds exactly as designed; the `friends` value is the
unenforced one, and it is unenforced **inconsistently** between the ring and the feed/search.

### One defect this audit re-confirms as *fixed*

The Social Freeze Delta records a real density leak: `CircleModule`'s
*"N moments recorded this month"* line once rendered for **any** viewer, invisible to `circle.js`
because that suite scopes its checks to `[data-sb-band-readout]` only. It is now wrapped in
`{own && (...)}`. Verified present in the current source and visible in the captures: shot 10
(owner) shows *"4 moments recorded this month"*; shot 12 (visitor) shows nothing beyond the band.

---

## 9. What the live port owes this matrix

Stated by the repository's own contracts, restated here so the Bible can inherit it:

1. `docs/handover/social-api-contract.md` §C — the server **must not ship** `birthDate`,
   `birthTime`, `birthTimeKnown`, day counts or band calendar years to a non-owner, and
   *"There is no 'friends may see exact age' tier in Phase 4. Do not add one."*
2. `personRef` is `{ id, name, avatarUrl?, bandIndex, bandLabel }` — *"Nothing else."*
3. `docs/handover/social-visual-spec.md` §10 — *"hiding a value with CSS … is a defect, not a fix."*
4. `README-for-developer.md:428` — `FORBIDDEN_ON_OTHER` is a **test contract**, not a runtime filter:
   the live server builds the visitor shape, it does not subtract from the owner shape.
5. `docs/handover/circle-of-life-spec.md` §4 — a subject's only-me Moments are excluded **before**
   any aggregation, and a non-owner's `?c=day:…` deep link resolves to LIFE, never to a day.
