# SOCIAL BIBLE AUDIT — TEST MAP

**Phase 0 · evidence audit · 2026-09-16 · read-only. No suite was executed by this audit.**
Counts marked "AGENTS" are the repository's own recorded verified-green figures. Counts marked
"static" are the number of assertion call-sites read from the file; they are a *floor*, because
most suites loop over viewer × theme × width. **No count in this repository is independently
verifiable without running the suites**, and there is no manifest, snapshot or CI record — the
numbers live only in AGENTS.md prose.

---

## 1. The harness

**64 `.js` files** in `prototype-tests/`, **13,786 lines**. Two are not tests
(`lib.js` = the shared harness, `gate-lib.js` = a gate helper).

| Fact | Value | Evidence |
|---|---|---|
| Driver | **puppeteer-core 25.10.0**, `headless: "new"` | `prototype-tests/lib.js` |
| Browser | the user's system Chrome, **hard-coded macOS path** `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` | `lib.js` (only `social-devanagari-crops.js` allows `process.env.CHROME`) |
| GPU flags | `--enable-gpu --use-angle=metal` — assumes Apple silicon | `lib.js` |
| Dev server | **not spawned by any suite.** Zero `spawn`/`exec`/`next dev` in all 64 files. Every suite assumes `http://localhost:3210` is already listening | `lib.js` `const URL = "http://localhost:3210/"` |
| Runner | **none.** No `run-all`, no shell script; `prototype-tests/package.json` `"test"` is the npm stub. Each file is `node prototype-tests/<x>.js` | `prototype-tests/package.json` |
| Assertion library | **none.** Each modern suite re-declares the same four lines (`let passed = 0; const failures = []; const ok = (c,label) => …`) — copy-pasted across 30+ files | every `social-*`, `s2`–`s7` |
| Dependencies | `puppeteer-core`, `jimp` in `prototype-tests/node_modules`; **`sharp` is undeclared** and resolves only via Next's transitive install in the root `node_modules` | the four `_build-*` and six newer `_capture-r3-*` scripts |
| Evidence paths | hard-coded absolute `/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/...` | all capture scripts |

**Consequence, stated plainly:** the suites are machine-bound. They cannot run on CI, on another
machine, or on a non-macOS host without editing. Seven `_capture-r3*.js` files additionally
hard-code an **expired session scratch directory**
(`/private/tmp/claude-501/-Users-roshan-SYSTEMBOOM-V2/…`) and will not re-run as written.

**How every suite drives the product:** entirely through review query parameters on
`/style-lab/social` — `?viewer=maya|asha|visitor|ashaVisitor|prakashVisitor`, `?theme=`, `?w=`,
`?lang=` (+ cookie `sb-locale`), `?harness=0`, `?rel=`, `?c=`, `?bell=1`, `?notifications=`,
`?pulse=`, `?fail=1`, `?composer=1`, `?profileName=`, `?photo=`, `?wall=`, `?nocover=1`,
`?worldlight=`, `?cosmos=fallback` — plus the `window.__SB_*` dev probes
(`__SB_VM_OTHER_KEYS`, `__SB_RING_DENSITY`, `__SB_RING_DENSITY_SELF`, `__SB_REJ`, `__SB_STATE`,
`__SB_CAM`, `__SB_SLOTS`, `__SB_TRAIL`, `__SB_MAP`, `__SB_IDENTITY`, `__SB_CIRCLE`).

---

## 2. Routes exercised

| Route | Suites |
|---|---|
| `/style-lab/social` | all `social-*`, all `s2`–`s7`, `i18n.js`, every `_capture-*` |
| `/style-lab/circle` | `circle.js` |
| `/world`, `/world?theme=` | `final-app`, `one-application`, `complete-my-world`, `social-shell` |
| `/life` | `final-app`, `one-application`, `social-shell`, `circle` |
| `/social`, `/earth` | `social-shell`, `one-application` (route-integrity / honest-route checks) |
| `/` (3D Cosmos) | `amend-*`, `trail-*`, `gate-*`, `probe-click`, `camera-refocus`, `one-application`, `final-app` |
| **`/chat`** | **none** — `/chat` is never loaded as a route by any suite |
| none (pure Node) | `locale-resolution.js`, `identity-model.js` |

---

## 3. Accepted Social / My World suites

| File | Lines | Type | AGENTS | static `ok()` | What it protects |
|---|---|---|---|---|---|
| `social-final.js` | 659 | e2e-DOM | **180** | 92 | PHASE 4 FINAL. §1 feed/no-escape · **§2 C1 privacy** · §3 counter cycles + honesty · §4 ring tick angle · §5 respond/conversation · §6 ⋯ menus own vs others · §7 load more · §8 notifications · §9 search + account menu · §10 every Composer state · §11 keyboard/Escape/reduced motion · §12 live theme toggle · §14 chronology, date grammar, kind words · plus a **WCAG AA contrast table → `contrast.json`** |
| `circle.js` | 467 | e2e-DOM | **132** | 101 | Phase 5 Circle: 150-year model, Life→Band→Year→Month→Day→Almanac, real month lengths/leap years, breadcrumb/history, jump-to-date, **§9 visitor band-only**, **§10 structural density privacy**, temporal honesty, birth-time-unknown precision, mobile dial, entry from the Life Ring |
| `complete-my-world.js` | 445 | e2e-DOM | 62 | 60 | People, relationship states, requests, Messages/mini-chat, full Chat, empty + error states, privacy through the new surfaces, account/appearance/logout, widths to 1920, performance boundary |
| `person-life-identity.js` | 373 | e2e-DOM | 47 | 41 | One identity system: photo/initials fallback, image failure, identical semantics across 7 contexts, **§5 owner-precise vs visitor band-only**, **§6 density**, §7 ring never encodes relationship, §8 ring→Life keyboard, §9 reduced motion, **§11 View-as-public byte-compared to a real visitor** |
| `social-shell.js` | 355 | e2e-DOM | 68 | 56 | Route integrity, one navigation grammar, theme continuity, Cosmos-3D containment, Health/Problem privacy, composition at 360/390/768/desktop |
| `social-connection-final.js` | 327 | e2e-DOM | 44 | 44 | People discoverability, the full relationship state machine on every surface, owner/visitor header context, Return to My World, Life-only ring, the "old-social" test, Moment → People |
| `social-2030.js` | 269 | e2e-DOM | 31 | 32 | The five category-definition corrections, ProfileHero grammar, Life Cursor, no-regression privacy |
| `final-app.js` | 260 | e2e-DOM | 31 | 30 | The public→personal journey in the dark, naming, My World visual set, Life inside My World, theme persistence, Devanagari, a11y |
| `my-world-2030.js` | 235 | e2e-DOM | 27 | 27 | World Horizon cover, the Life Instrument, current-band geometry, memory material, no glow/HUD, owner/visitor/360, §11 no-regression privacy |
| `one-application.js` | 223 | e2e-DOM | 40 | 32 | ONE PRODUCT: honest routes, one brand, no destination menu, Earth-is-a-state, one theme store, 360, the 3D performance boundary |
| `social-2030-final.js` | 148 | e2e-DOM | 34/35 | 24 | The wider cast, the **viewport matrix with no horizontal overflow**, mobile first-Moment priority, desktop width discipline, performance guards (no WebGL, no persistent loops), the no-hover / motion-off / change-the-logo / old-social tests |
| `social-devanagari-crops.js` | 38 | visual evidence | — | 0 | Devanagari crop captures (no assertions) |

## 4. S-phase suites (all on `/style-lab/social`)

| File | Lines | AGENTS | static | Protects |
|---|---|---|---|---|
| `s2-person-world.js` | 177 | 47 | 47 | Owner/visitor context, **desktop left-anchor (ring < 28% into the card)**, relationship OUTSIDE the ring, View-as-public DOM privacy, identity resilience (real/bad/initials/broken/40-char), World Wall image/none/broken, mobile priority, locale-safe strings, **200% zoom** |
| `s5-discovery.js` | 203 | 48 | 48 | Search object-awareness (Person/Moment/Photo/Place), honest no-results, **search keeps privacy**, round-trips, notification event grammar, requests resolve in place, one-surface-at-a-time, mobile search, es/ru/ne |
| `s6-motion.js` | 222 | 53 | 39 | One transient-surface language (160–240ms), **nothing loops / the Life Ring never animates**, focus enter + return, Escape peels one layer, Composer memory-first order, People human-first, public preview, theme continuity, **reduced motion is complete**, device matrix, §10c the like-economy guard |
| `s7-device-mastery.js` | 244 | 56 | 41 | Phone matrix **320/360/375/390/393/412/430** overflow-free, bar ≤64px, first-Moment budgets (owner ≤720, visitor ≤650 at 360×800), 40-char name, landscape, **44px touch targets**, virtual-keyboard heights, tablet recomposition, desktop 1024–1920, surface exclusivity + one scroll owner, safe-area hooks, 200% zoom never disabled |
| `s3-moments.js` | 135 | 17 | 17 | Moment hierarchy + date truth, Almanac continuity, backdated composer date, **Composer fully localised (0 English leakage in `ne`)**, kind fields, **Health/Problem no Respond**, media failure, mobile first-Moment, zh kind word |
| `s4-people.js` | 126 | 20 | 20 | People entry is not a nav tab, Find someone, none→request-out, request-in→Accept, **relationship never in ring geometry**, **friend does not gain exact Life**, es + ru, one-handed mobile, keyboard |
| `s3-s4-loops.js` | 105 | 14 | 15 | Six integrated human loops end-to-end + owner/visitor/public-preview privacy holding across them |

## 5. i18n suites

| File | Lines | Type | AGENTS | static | Notes |
|---|---|---|---|---|---|
| `i18n.js` | 138 | e2e-DOM | 45 | 15 | §1 first paint per locale **in the SSR HTML** (English never paints first) · §2 human content never translated · §3 deterministic own-table formatting · §4 zero hydration/script errors per locale · §5 switching preserves route + context. 8 locales |
| `locale-resolution.js` | 54 | **pure Node unit** | 21 | 12 | Resolution priority + region-suggestion matrix. **Self-declared risk in its own header: it is a hand-maintained 1:1 JS mirror of `src/lib/i18n/resolve.ts`, not the real module** — documented lockstep, "change one, change both" |

## 6. R2 / R3.x expression suites

| File | Lines | AGENTS | static | Protects |
|---|---|---|---|---|
| `social-r2-expression.js` | 239 | 43 | 43 | One Expression per viewer per Moment, quiet aggregate, Health/Problem exclusion, owner/visitor/preview visibility, the Response Branch, keyboard as a composite widget, reduced motion, locales, and the three invariants (no Life mutation, no relationship mutation, no infinite animation) |
| `social-r3-3d-expression.js` | 307 | 80 | 56 | The registry (now 18), single-active invariant, the calm action bar, RESPOND·RESPONSES·REPLY vocabulary, adaptive conversation depth, presence never popularity, no passive animation, 320/360, keyboard/reduced motion/contrast, every name in all 8 locales |
| `social-r3-1-living-expression.js` | 310 | 69 | 49 | Eighteen in emotional groups, the picker's material, owned state, MASS-based motion, shipped 3D artwork + optical crops, **§7 the no-marks honesty test**, device range, reduced motion keeps every POSE, 8 languages |
| `social-r3-2-signature-expression.js` | 341 | 92 | 56 | The Quick Six as committable objects; **§2 asset tiers + byte budgets (sm ≤24KB, md ≤70KB, lg ≤140KB, real WebP alpha)**; one-active/change/remove; all six reachable 320–430; desktop arc; tap-vs-drag; per-expression tempo bands; **§11 Life untouched**; a11y |
| `social-r3-3-human-pulse.js` | 297 | 102 | 54 | Scaling 1 → 1,000+ on one calm line; one type = one lens regardless of count; the Boom Lens as an optical object; the Spectrum (truthful counts, canonical order, **no bars, no ranking**); the who-expressed surface with deterministic micro-variants; §9 the feed never decodes the big tiers |
| `social-r3-5-emotion-core.js` | 185 | 20 | 20 | Six vessels each with its own core artwork; the core lives INSIDE the mascot (no light outside the vessel); half-face + core lens; Human Pulse invariants hold; ≤320ms activation; Support on a serious Moment |
| `social-r3-6-premium-expressions.js` | 173 | 21 | 18 | Premium tray, unmistakable selected states in both themes, light-mode material, staggered library entry, full sequence then stillness, reduced motion, mobile |
| `social-r3-7-gravity-expressions.js` | 303 | 37 | 35 | The Gravity Dock, the Emotion Chamber as a real clipped layer with preview parallax, the five-state motion contract (REVEAL·PREVIEW·COMMIT·SETTLE·RETOUCH), CORE→BOOM LENS flight, family bands, **§8 zero passive motion** |
| `social-r3-8-emotion-horizon.js` | 280 | 34 | 32 | ONE vessel + six CORE OBJECTS (never six clones), the three-stage commit, the dormant closed control, the Emotion Atlas, **§7 Human Pulse architecture untouched**, 360, reduced motion |
| `social-r3-9-signature-emotion-engine.js` | 251 | 31 | 26 | The emotional EVENT in real depth; event then total stillness; **§3 acknowledged ~60ms, settled inside a second**; **§4 WORLD LIGHT never recolours an emotion**; interruptible; **§11 every event asset ≤16KB, no particle engine, no WebGL, no persistent RAF** |

## 7. Asset-build scripts (not tests — they WRITE into `public/brand/expressions/`)

| File | Lines | Emits |
|---|---|---|
| `_build-expression-assets.js` | 105 | `neutral-{sm,md,lg}.webp`, `neutral-face.webp` — straight crops of the owner's render |
| `_build-emotion-cores.js` | 257 | the six `{id}-{sm,md,lg}` + `{id}-lens-{xs,sm,md}` chamber composites; re-emits `neutral-lens-*` |
| `_build-emotion-horizon.js` | 103 | 18 `{id}-core.webp` orbs + `neutral-chamber-*` |
| `_build-emotion-events.js` | 74 | 10 energy forms (`{id}-energy.webp`, `joy-ray`, `laugh-wave`, `celebrate-ember`, `support-arc`) |

All four require `sharp` (undeclared) and hard-code `/Users/roshan/...` paths.

## 8. Evidence-capture scripts (not tests)

17 files (`_capture-i18n`, `_capture-s2`, `_capture-s3s4`, `_capture-s5s6`, `_capture-s7`,
`_capture-2030`, `_capture-r2`, `_capture-r3`, `_capture-r3-1/2/3/5/6/7/8/9`,
`social-devanagari-crops`). `_capture-s7.js` explicitly **labels safe areas, virtual keyboards and
slow networks as SIMULATED** and never claims a physical-device run. `_capture-r2`/`_capture-r3`
slow playback 5× via the CDP Animation domain and label the real-time equivalents;
`_capture-r3-2` §70 captures motion at **actual speed**; `_capture-r3-9` uses a CDP screencast.

## 9. Legacy suites (Cosmos / Earth / identity gate — pre-Social, Sep 4–11)

`amend-desktop.js` (337) · `amend-mobile.js` (123) · `amend-office.js` (64) ·
`trail-desktop.js` (472) · `trail-mobile.js` (194) · `probe-click.js` (66, **an assertion-free
debugging probe**) · `gate-desktop.js` (198) · `gate-mobile.js` (90) · `gate-fallback.js` (98) ·
`gate-lib.js` (125) · `camera-refocus.js` (138) · `identity-model.js` (242).

Two of these are not disposable:
- **`camera-refocus.js`** is legacy-era but **cited by AGENTS.md** as the verification for the
  `CameraRig` focus-memory hotfix.
- **`identity-model.js`** is the **only** place the birth-truth storage contract is asserted at the
  model level — and **AGENTS.md never names it** (0 mentions).

They use two older idioms (`assert`-throw for `gate-*`/`identity-model`/`camera-refocus`,
log-only `pass()` for `amend-*`/`trail-*` — which can never fail except on an uncaught throw).

---

## 10. Cross-cutting: where PRIVACY is asserted (the strongest invariant in the repo)

The canonical secret is Maya Rai's birth: `1991-11-04` / `04 NOV 1991`, `06:42`, the live day
count, and the exact age `34y 10m __d`.

| Suite | Assertion (verbatim or near) |
|---|---|
| `social-final.js` §2 | `FORBIDDEN = ["04 NOV 1991","06:42","12,729","1991-11-04","12729"]` scanned against `document.documentElement.outerHTML` for `viewer ∈ {visitor, ashaVisitor}` × `theme ∈ {light,dark}` × `w ∈ {desktop,360}` |
| `social-final.js` §2 | `ok(FORBIDDEN_ON_OTHER.every(k => !vm.includes(k)), "non-owner LifeView carries only …")` via `__SB_VM_OTHER_KEYS` |
| `social-final.js` §2 | no `[data-sb-contact]`, no `[data-sb-hero] dt` (no Born row), hero rings all `"other"`, no `[data-sb-tick-angle]`, Circle module reads the band with no day count |
| `social-final.js` §2 | positive control: `ok(mayaOwn, "Maya sees her own moments with the exact age")` |
| `social-final.js` §3 | `units === "years,months,weeks,days"` for an unknown birth time; seven stops when known; `"birth time unknown"` stated on the owner hero |
| `circle.js` §9–§10 | `scope === "other" && level === 0`; no present tick; **no per-band counts, nothing enterable**; three bands lived-through, seven unwritten; `"Their Moments are in"`; deep links resolve to LIFE |
| `person-life-identity.js` §6 | `total(mayaSelf) === total(mayaConnected) + 2`; Krishna 0/0; Prakash 3/3; `connected` changes nothing |
| `person-life-identity.js` §11 | the public preview's DOM shape compared **byte-for-byte** against a genuine visitor's |
| `my-world-2030.js` | `engraveFriend === engraveStranger` — public-only density, no relationship leak |
| `complete-my-world.js` | person card stays band-only; search rows never carry another person's exact age; conversations expose no birth data; **"friendship does not raise life precision"** |
| `s4-people.js` | a friend's row is band-level; **the Life Ring carries no relationship state** |
| `s5-discovery.js` §4 | a person result carries photo + ring + name + safe band + relationship, **no date**; a request row carries no band label |
| `s3-moments.js` | a Health record carries no Respond |
| `social-shell.js` / `final-app.js` | Health/Problem: no Respond, marked "only you", responses intact |
| `social-r3-3-human-pulse.js` | `ok(!who.band, "IDENTITY-ONLY: no band, no exact age in the dense people list")` |
| `identity-model.js` | four model-level birth-truth checks at the **serialized JSON** level |

---

## 11. Reconciliation: AGENTS.md ↔ the filesystem

**(a) Named by AGENTS.md but missing: none.** Every `prototype-tests/*.js` path AGENTS.md
mentions resolves to a real file.

**(b) Exists but AGENTS.md never names it — 24 files:**
`_capture-2030`, `_capture-i18n`, `_capture-r2`, `_capture-r3`, `_capture-r3-1`, `_capture-r3-2`,
`_capture-r3-3`, `_capture-r3-5`, `_capture-r3-6`, `_capture-r3-7`, `_capture-r3-8`,
`_capture-r3-9`, `_capture-s7`, `amend-desktop`, `amend-mobile`, `amend-office`, `gate-desktop`,
`gate-fallback`, `gate-lib`, `gate-mobile`, **`identity-model`**, `probe-click`, `trail-desktop`,
`trail-mobile`.

The documentation of capture scripts is **inconsistent**: `_capture-s2`, `_capture-s3s4`,
`_capture-s5s6` and all four `_build-*` are named; the S7 and every R2/R3 capture script is not —
even though AGENTS.md cites their output boards by number.

**(c) The "Accepted tests and evidence" block in AGENTS.md (lines ~250–298) is stale.** It stops
at the Phase-4/5 set and never absorbed S1–S7 or R2/R3.x. A reader taking it as the index would
miss **18 live suites**. Those suites are each recorded in their own phase section's
"Verified green" line, so the information exists — it is the *index* that is incomplete.

**(d) Claimed vs static call-site drift** (expected from loops; quantified so the Bible does not
over-claim):

| File | AGENTS | static | ratio |
|---|---|---|---|
| `social-final.js` | 180 | 92 | ~2.0× |
| `i18n.js` | 45 | 15 | ~3.0× |
| `social-r3-3-human-pulse.js` | 102 | 54 | ~1.9× |
| `locale-resolution.js` | 21 | 12 | ~1.8× |
| `social-r3-2-signature-expression.js` | 92 | 56 | ~1.6× |
| `circle.js` | 132 | 101 | ~1.3× |
| `social-2030.js` | 31 | **32** | static exceeds claimed |
| `s3-s4-loops.js` | 14 | **15** | static exceeds claimed |

---

## 12. Test-suite weaknesses found (recorded, nothing changed)

| ID | Finding | Evidence |
|---|---|---|
| T-1 | **No runner, no CI, no manifest.** 62 standalone entry points, each with its own copy-pasted 4-line harness. Counts exist only in prose. | `prototype-tests/package.json` |
| T-2 | **Machine-bound.** Hard-coded macOS Chrome path, `--use-angle=metal`, absolute `/Users/roshan/...` evidence paths. | `lib.js`, every capture script |
| T-3 | **Seven capture scripts point at an expired temp directory** and cannot re-run as written. | `_capture-r3-1/2/3/5/7/8/9.js` |
| T-4 | **Undeclared `sharp` dependency** in the four `_build-*` and six `_capture-r3-*` scripts. | absent from both `package.json` files |
| T-5 | **A permanently-passing assertion**: `circle.js` — `ok(… \|\| true, "probe self-view computed")`. Not recorded anywhere in AGENTS.md. | `circle.js` |
| T-6 | **A knowingly half-vacuous assertion**, recorded: `s2-person-world.js` §70's `!/12,732/` is date-fragile against the live clock. The exact-age half still asserts. | AGENTS.md; `s2-person-world.js` |
| T-7 | **A self-declared drift risk**, recorded: `locale-resolution.js` is a hand-maintained mirror of `resolve.ts`, not the real module. | `locale-resolution.js` header |
| T-8 | **`/chat` is never loaded as a route by any suite.** Chat is exercised only as the mini-dock inside `/world`. Its `100dvh-57px` header assumption, its `?c=` one-shot read, its untranslated strings and its store-reset-on-navigation are all untested. | route table, §2 |
| T-9 | **The contrast suite silently drops missing selectors.** `social-final.js` prints "not found for contrast: …" without failing, so a pairing that stops matching disappears from the assertion. | `social-final.js` |
| T-10 | **Legacy suites are stale, not broken.** All the `window.__SB_*` hooks they need still exist, but `/` has moved on (`one-application.js` now asserts "Earth is a state, not a URL"). `probe-click.js` has no assertions at all. | §9 |
| T-11 | **No test asserts the R3 vocabulary against the *fixtures*.** Two seeded notification strings still say "note" (`data.ts:682, 685`) and are rendered verbatim, while AGENTS.md records NOTE as gone from the UI. No suite scans fixture text for retired vocabulary. | `data.ts:680–692`, `Chrome.tsx:538` |

---

## 13. Shipped test artefacts

| Artefact | Content |
|---|---|
| `prototype-evidence/phase-04-final/contrast.json` | **38 rows** (19 light + 19 dark token pairings), **0 failures**; minimum 4.80 (light), 3.77 (dark, passing under the large-text threshold). The only `contrast.json` in the repo. |
| `prototype-evidence/**` | 28 evidence directories (gitignored, local-only). Two are marked SUPERSEDED in AGENTS.md — `one-application/` and `final-systemboom-app/` (Compass-era). |
| `prototype-evidence/s7-device-mastery/layout-metrics.md` | first-view / surface metrics with the SIMULATED labelling |
