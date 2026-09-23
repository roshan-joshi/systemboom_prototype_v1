# SYSTEMBOOM — Phase 4.4-A handover: Moment + Respond truth

Date: 2026-09-23 · Baseline: Phase 4.3 audit (`references/social-bible-audit/phase-4.3/`).
The frozen-zone record, with every exception row and every superseded assertion, is in
`AGENTS.md` under "Phase 4.4-A". Evidence frames are local, in `prototype-evidence/` (gitignored).

---

## A. Repository safety

- **Starting branch:** `main`, tracking `origin/main` at `fcf4e1e`.
- **Starting dirty files (owner's, before this slice):** the uncommitted Light-mode work —
  `prototype-tests/_build-celestial-environment.cjs`, `prototype-tests/celestial-s7-constellation.js`,
  `public/celestial/environment-solar{,-frame-left,-frame-right,-portrait}.svg`,
  `src/components/celestial/{CelestialEnvironment,CelestialField,ResonateControl}.tsx`,
  `src/components/celestial/visual.ts` — plus untracked `Claude outputs/`,
  `PHASE-4.3-FINAL-AUDIT-PACKAGE{,.zip}`, `references/celestial-resonance-bible/`,
  `references/social-bible-audit/` (root `SOCIAL_BIBLE_*` files), `prototype-tests/celestial-light-capture.cjs`.
- **Owner changes preserved:** none of the Celestial source/SVG/build files above was edited. One
  owner file was touched: `prototype-tests/celestial-s7-constellation.js` — four name strings only
  (lines 187, 401, 419, 420), because the check names the fixture people. Nothing was reset,
  restored, stashed or cleaned.
- **Ending state:** see J. The owner's Light-mode files and the untracked items above stay
  uncommitted and untouched.

## B. Implemented safe fixes

One row per fix, with its A-ID, audit row, files, behaviour and test, in `AGENTS.md` →
"Phase 4.4-A — Moment + Respond truth". In short:

| A-ID | Fix | Test |
|---|---|---|
| A1 (P0-3 pt 1) | View as public renders the Moments sheet through `PUBLIC_VIEWER` (`PreviewScope`); writes refused; Boom/Resonate inert | `social-4-4a-truth.js` §3 |
| A2 (P0-4) | Same-date edit keeps `at` + `atPrecision`; moved date → day precision, `sharedAt` kept | §1 |
| A3 (P0-4) | Edit keeps the Moment's own media (photos, link, video) | §1 |
| A4 (P0-4) | Discard/Cancel/Escape during Posting cancels the pending post; body inert while posting | §2 |
| A5–A8 (P0-5) | Phone thread: Reply works, Respond focuses composer, layered Escape/Tab, focus return, no background scroll, sent response revealed | §4 at 390 + 360 |
| A7 | PersonCard above the thread (`z-[66]`), Tab trapped | §4 |
| A9–A12, A14 | Kind fields scoped; one media kind; pre-birth refused; unmatched people never stored; edit asks before discarding | §1, §5 |
| A13, A15–A20 | Meeting names once; response dates + local clock; line breaks; IME guard; zero-response writes; menu keyboard + focus; honest Copy link | §6, §7 |
| A21–A26 | 44px phone targets; decorative rings; Media controls honest; 21 keys × 8 locales; fixture truths; failures announced | §4, §7, §8 |
| review fixes | Focus/state gaps a four-lens review of this diff found | §2, §4, §5, §7 |

## C. P0 closure

- **P0-3 PART 1 — COMPLETE.** The feed, conversations, menus and Life Cursor render as the public
  stand-in: no exact age, no only-me Moment, no owner ring, no composer, writes refused; the stand-in
  is never stored, persisted, sent or an author. Part 2 is not settled (D-2 / D-4). §3, frames
  `owner-review/d-light-view-as-public*.png`.
- **P0-4 — COMPLETE.** Edit keeps time + precision + media; Discard during Posting never publishes
  (4.3 verify V4 `postedAnyway: false`). §1–§2, frames `owner-review/e1–e3`, `x1–x3`.
- **P0-5 — COMPLETE** at 390 and 360. 4.3 verify V1–V3 all pass; §4. Frames `owner-review/p390-*`, `p360-*`.

## D. Runtime verification

| Check | Result |
|---|---|
| Discard during Posting | Cancel→Discard, Escape→Discard, Cancel→Keep draft: the Moment never appears; an uninterrupted Post still publishes |
| Phone Reply | Reply opens a composer under its response; the reply is stored with its `parentId`, renders beneath, is revealed; focus returns to that Reply |
| Phone composer focus | Respond lands the cursor in the composer (V1: `TEXTAREA`, `cursorInComposer: true`) |
| PersonCard stacking | On top at three hit-test points; focus inside; Escape closes only the card; the half-written reply survives |
| View as public part 1 | As C above; the pause is stated once |
| 360px | All §4 checks pass; no page scroll behind the thread; 44px targets |
| 390px | All §4 checks pass |

## E. Tests

`node prototype-tests/<suite>.js` against the dev server on :3210, one run on the final source
(↻ = re-run after a test-only correction; source unchanged between):

social-final 180 · social-shell 68 · one-application 40 · final-app 31 · circle 132 ↻ ·
complete-my-world 62 ↻ · person-life-identity 49 · social-2030 31 · my-world-2030 27 ↻ ·
social-connection-final 44 · social-2030-final 35 · s2-person-world 47 · locale-resolution 21 ·
i18n 45 · s3-moments 17 · s4-people 20 ↻ · s3-s4-loops 14 · s5-discovery 48 ↻ · s6-motion 53 ·
s7-device-mastery 56 · social-r2 43 · r3 80 · r3.1 69 · r3.2 92 · r3.3 102 · r3.5 20 · r3.6 21 ·
r3.7 37 · r3.8 34 · r3.9 31 · social-devanagari-crops PASS · celestial-s0 64 · celestial-s2-field 40 ·
celestial-s3-s6 32 · celestial-s7-constellation 114 · **social-4-4a-truth 125 (new)** ·
identity-model 13 (was failing before this pass) · gate-desktop · gate-mobile · gate-fallback ·
amend-desktop · amend-mobile · trail-desktop · trail-mobile — all PASS.

`npx tsc --noEmit -p .` clean · `npx eslint src` clean · `npm run build` passes (11 routes) ·
`node prototype-tests/social-audit-4-3-verify.cjs`: V1–V4 fixed; K (P0-6) unchanged with the flag
on, all controls in-column with it off · `expressions.tsx` SHA-256
`dd78c36970dfa8c766cb196348c8db0293cf80ad5dea2cd31e19de3068a0194e` unchanged.

## F. Screenshots

All under `/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/phase-4.4a-truth/`:

- Suite frames: `01-edit-same-date-keeps-0740.png` … `12-composer-one-media-kind.png`
- Owner review (`owner-review/`): `PHASE-4.4A-CONTACT-SHEET.png`, `d-dark-owner-moment-respond.png`,
  `d-light-owner-moment-respond.png`, `d-light-view-as-public.png`, `d-light-view-as-public-menu.png`,
  `e1-edit-before.png`, `e2-edit-after-same-date.png`, `e3-edit-moved-date.png`, `x1-posting.png`,
  `x2-discard-prompt-during-posting.png`, `x3-feed-after-discard.png`, `c1-pre-birth-refusal.png`,
  `p390-1-moment.png` … `p390-5-personcard-above.png`, `p390-6-conversation-light.png`,
  `p360-1-moment.png` … `p360-5-personcard-above.png`
- Owner fixture: see the fixture section below.

## G. Deferred owner decisions — untouched

D-1 (life position on other people's Moments), D-2 (`friends` meaning), D-3 (Celestial launch
posture — the flag's committed default stays OFF), D-4 (whose Moments a World holds): **untouched.**

## H. Deferred Phase 4.4 work (found, not done)

- **Visitor relationship view is owner-centric (pre-existing).** When a visitor (e.g. Luca) views
  Giulia's World, the hero says "Friends" while Giulia's person card says "Not connected · Add
  Friend": `WorldProvider` stores relationships only from the owner's side. Relationship
  architecture → 4.4-B/C. Frame `owner-fixture/g-7-personcard-as-visitor.png`.
- **P0-6** (Celestial phone action row) unchanged: with the flag on, the Moment ⋯ sits at x 347–391,
  so it's clipped at 360 and at the edge at 390 (`owner-fixture/phone-action-row-metrics.json`). It
  doesn't depend on how many people resonated.
- Carryovers recorded in AGENTS.md: per-response ring at response time (D-1), cascade delete with
  no confirm (D-9), toast-only Report (D-10), unresolvable Copy link URL (D-12), RS-40 contract text.
- Nine more licensed portraits are needed for the Italian circle (below).

## I. Product / backend distinction

- **The prototype now enforces (client reducers + fixtures only):** everything in B.
- **Only documented as live/backend requirements** (`docs/handover/social-api-contract.md` §D/§D.4,
  **not implemented here**): server-side edit temporal truth and media preservation, idempotent
  publish with cancellation, one media kind, the birth-date lower bound, people ids resolved
  server-side, View as public as a server-rendered public projection, response time grammar and
  `parentId` handling. Client filtering in this prototype is not a privacy or authorisation guarantee.

## J. Repository actions

- Commit created: **YES**, at the owner's explicit request in chat after this slice finished
  ("once all above done push in git"). The brief's original "NO COMMIT" was superseded by that
  request.
- Push performed: **YES**, to `origin/main`, same request.
- Deploy performed: **NO** deploy was run from here. If a host such as Vercel is linked to `main`,
  it will build from this push on its own.
- Phase 4.4-B started: **NO** · Stage 24 started: **NO**

---

# OWNER FIXTURE REQUEST — ITALIAN SOCIAL CIRCLE

### Maya replacement

- **Old identity:** Maya Rai, Kathmandu, Nepal (older-woman portrait `face-portrait.jpg`)
- **New identity:** Giulia Bianchi, Bologna, Italy — photographer
- **Stable person ID preserved:** yes — `u-demo-001` (internal key `maya` kept)
- **Profile photo source/asset:** `public/mock/social/cast/giulia-bianchi.jpg`, a face-framed
  crop of the CC0 portrait `cast-nadia.jpg` (Martin Miranda, Unsplash via Wikimedia Commons).
  The person photographed is not Giulia.
- **Age:** band 30–35 (her existing birth data is kept, because accepted Life, Circle and
  day-count assertions depend on it; that's inside the 20–35 brief, not the suggested "late 20s").
- The identity gate now reads "Enter as Giulia Bianchi" from the one demo identity. Her curated
  Earth anchor is the Italy centroid; the frozen geography has no Italian city.

### Italian fixture cast

| Person ID | Name | Approx. fixture age band | Photo | Role/relationship |
| --------- | ---- | ------------------------ | ----- | ----------------- |
| `u-demo-001` | Giulia Bianchi | 30–35 | `cast/giulia-bianchi.jpg` | owner — photographer, Bologna |
| `p-asha` | Sofia Romano | 30–35 | `cast/sofia-romano.jpg` | friend — Firenze; paragliding + Phewa Moments |
| `p-bikash` | Luca Rinaldi | 30–35 | `cast/luca-rinaldi.jpg` | friend — Torino architect; meal + window Moments |
| `p-ramesh` | Marco Bellini | 30–35 | initials MB | not connected — Milano; same birthday as Luca |
| `p-sunita` | Elena Ricci | 30–35 | `cast/elena-ricci.jpg` | family (cousin) — Napoli, married into Ratmate |
| `p-prakash` | Chiara Conti | 25–30 | `cast/chiara-conti.jpg` | incoming friend request — Roman, living in Boudha |
| `p-krishna` | Federico Alessandro Castelbarco Visconti | 30–35 | `cast/federico-castelbarco.jpg` | family — Venezia; the 40-character name fixture |
| `p-m` | M | 25–30 | initials M | request sent — the one-letter name fixture |
| `p-marcus` | Matteo Gallo | 30–35 | initials MG | friend — Bologna |
| `p-grace` | Aurora Ferrari | 30–35 | initials AF | friend — Roma |
| `p-theo` | Andrea Costa | 30–35 | initials AC | friend — Bari |
| `p-hannah` | Camilla Greco | 30–35 | initials CG | friend — Palermo |
| `p-rory` | Francesca Marino | 25–30 | initials FM | not connected — Genova |
| `p-nadia` | Martina Moretti | 25–30 | initials MM | request sent — Verona |
| `p-walt` | Beatrice Esposito | 25–30 | initials BE | not connected — Napoli |
| `p-sofia` | Alice Lombardi | 30–35 | initials AL | request sent — Milano |

Ten women, five men, plus "M". Initials are unique and no first name is part of another, since
Search matches substrings. **Photo assets still required:** nine licensed portraits (CC0/CC BY or
owner-cleared) of adults who read 20–35, natural light, not glamour — Marco Bellini, Matteo Gallo,
Andrea Costa (men); Aurora Ferrari, Camilla Greco, Francesca Marino, Martina Moretti, Beatrice
Esposito, Alice Lombardi (women). Nothing was downloaded or scraped. Each one drops in as
`public/mock/social/cast/<first-last>.jpg` plus one `avatar:` line.

**Coherence:** Chiara lives in Boudha and Elena married into Ratmate, so in late Aug–Sept 2026 the
circle is together in Nepal. Recent Moments keep their Nepali places; personal history is Italian.
`m-1983` (id kept) is re-dated to 14 SEP 1998 in Vomero, Napoli: a Moment before its author's birth
is what the Composer refuses. Its boundary-map scan wasn't a school slip, so it now has no photo.
No fixture text states anyone's age.

### Multi-person Resonance fixtures

| Moment | Author | Participants | Resonance distribution |
| ------ | ------ | -----------: | ---------------------- |
| A `m-sameage` (10 SEP, Patan) | Marco Bellini | 5 | Venus ×2 (Giulia, Sofia), Sun ×1 (Elena), Saturn ×1 (Luca), Moon ×1 (Chiara) |
| B `m-meal` (10 SEP, Bhaktapur) | Luca Rinaldi | 3 | Mercury ×2 (Sofia, Camilla), Comet ×1 (Elena) |
| C `m-video` (09 SEP, Phewa) | Sofia Romano | 8 | Venus ×2 (Giulia, Aurora), Sun ×2 (Luca, Marco), Meteor Shower ×1 (Matteo), Comet ×1 (Chiara), Jupiter ×1 (Federico), Moon ×1 (Elena) |
| D `m-activity` (10 SEP, Sarangkot) | Sofia Romano | 1 | Jupiter ×1 (Luca) |
| `m-panorama` (30 AUG, Mustang) | Giulia Bianchi | 6 | Comet ×2 (Sofia, Luca), Venus ×1 (Elena), Mercury ×1 (Chiara), Saturn ×1 (Federico), Sun ×1 (Camilla) |
| E `m-rain` and all other Moments | — | 0 | none |

These counts are for checking the fixture only; the product ranks, scales and reorders nothing by
count. The feed's first screen reads 5 · 3 · 0 · 1. One Resonance per person, canonical ids only, and
no author resonates on their own Moment. People present, people who responded and people who
resonated are separate lists (e.g. `m-meal` has three present, five responders, three resonators).

**To see it on the normal page:** open `http://localhost:3210/world?celestial=1` once. The owner/dev
flag is stored in the browser, so plain `/world` shows it from then on; `?celestial=0` turns it off.
The committed default stays OFF (D-3).

### Files changed

- Fixture/data: `src/components/style-lab/social/data.ts`, `src/lib/mock/demo-user.ts`
- Assets: `public/mock/social/cast/{giulia-bianchi,sofia-romano,elena-ricci,chiara-conti,luca-rinaldi,federico-castelbarco}.jpg` (new)
- Provenance: `public/mock/social/CREDITS.md`, `public/mock/social/credits.json`, `docs/fixtures/photo-sources.md`
- Identity reading the one demo user: `src/components/identity/IdentityGate.tsx`, `src/lib/identity/demo-seed.ts`
- Harness labels and comments: `src/components/style-lab/social/SocialPreview.tsx`, `src/components/style-lab/circle/CirclePreview.tsx`,
  `src/components/style-lab/social/store.tsx`, `src/components/world/model.ts`, `src/components/identity/IdentityProvider.tsx`, `src/lib/identity/types.ts`
- Docs describing current fixtures: `docs/handover/README-for-developer.md`, `person-life-identity.md`, `human-pulse-contract.md`
- Tests (fixture-vocabulary supersessions, each recorded in AGENTS.md — the suites listed there); new capture `prototype-tests/_capture-4-4a-fixture.cjs`

### Celestial implementation files changed

**NO.** Nothing in `src/components/celestial/**` or `src/lib/celestial/**` was edited. The approved
constellation displays the seeded multi-person data as-is. One Celestial test file,
`prototype-tests/celestial-s7-constellation.js`, had four name strings updated (see A).

### Screenshot paths

All under `/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/phase-4.4a-truth/owner-fixture/`:

- Contact sheet: `OWNER-FIXTURE-CONTACT-SHEET.png`
- Desktop dark: `d-dark-1-zero-resonance.png`, `d-dark-2-one-resonance.png`, `d-dark-3-several-mixed.png`,
  `d-dark-3b-small-multi.png`, `d-dark-4-rich-constellation.png`, `d-dark-5-expanded-rich.png`,
  `d-dark-5b-expanded-A.png`, `d-dark-6-feed-first-screen.png`
- Desktop light: `d-light-1-multi-person.png`, `d-light-2-expanded.png`, `d-light-3-expanded-rich.png`
- Phone 390: `p390-dark-1-multi-person.png`, `p390-dark-2-expanded.png`, `p390-dark-3-rich.png`, `p390-light-1-multi-person.png`
- Phone 360: `p360-dark-1-multi-person.png`, `p360-dark-2-expanded.png`, `p360-dark-3-rich.png`, `p360-light-1-multi-person.png`
- Giulia: `g-0-identity-gate.png`, `g-1-profile-desktop-dark.png`, `g-2-photo-life-ring.png`,
  `g-3-authored-moment.png`, `g-3b-authored-expanded.png`, `g-4-appearance-in-resonance.png`,
  `g-5-appearance-in-responses.png`, `g-6-profile-360-light.png`, `g-7-personcard-as-visitor.png`
- Phone action-row measurements: `phone-action-row-metrics.json`
