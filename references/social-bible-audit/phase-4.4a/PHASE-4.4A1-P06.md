# PHASE 4.4-A.1 — P0-6 RESULT

Mobile Moment action-row containment · 2026-09-24 · follows the accepted Phase 4.4-A
(`PHASE-4.4A-HANDOVER.md`). The frozen-zone record is in `AGENTS.md` → "Phase 4.4-A.1".

**Status: COMPLETE**

## Root cause

With Celestial on, the Moment action row was one `flex` line with `nowrap` and no child that
could shrink: the 28px Almanac gutter, Respond 102px, Boom 44, Resonate 118–121 (the word plus
its mark; the viewer's own seal is 3px wider), ⋯ 44 and three 8px gaps, 363px in all. The phone
Moment column is 304px at 360, 319 at 375 and 334 at 390. So ⋯ ran past the Moment (x 347–391 at
360), and the Moments sheet's clipping content box (`overflow:hidden`, x 12–348 at 360) cut it
off. At 390 its box ended 1px past the screen edge.

The number of people who resonated played no part: 0, 1, 5 and 8 measured identically. In every
locale it was worse than reported: Russian ("Откликнуться", 155px) overflowed by 28px even at
430, and Dutch by 1px. The two words (Respond, Resonate) cannot share a 304px column with Boom
and ⋯ in any locale; they need 311px even without ⋯. So one control had to become compact, and
Resonate was chosen because it is the secondary, flag-gated control.

## Files changed

- `src/components/style-lab/social/Moment.tsx` (frozen Phase 4; recorded in AGENTS.md)
- `src/components/celestial/ResonateControl.tsx` (layout classes and a `title` only)
- `docs/handover/moment-conversation-model.md` (the action-row description)
- `AGENTS.md` (the exception rows), `references/social-bible-audit/phase-4.4a/PHASE-4.4A-HANDOVER.md` (pointer)
- new `prototype-tests/social-4-4a1-p06.js` (the focused regression suite, 599 checks)

## Responsive change

- **Moment row:** a primary cluster (Respond · Boom · Resonate: `flex-1 min-w-0 flex-wrap`) and a
  ⋯ slot at the end (`shrink-0`, as tall as the first line) that nothing can push out. If a
  column is ever too narrow, the cluster wraps inside itself. Respond ellipsizes only when its
  word alone is wider than a line. With the compact Resonate present, the phone gaps are 6px;
  with the flag off, the row keeps its 8px spacing.
- **Resonate:** below the `@lg` container (512px, which covers every portrait phone) the doorway
  is a compact 44×44 aperture. It keeps the same mark or the viewer's seal, and the same light,
  border, halo and motion. From 512px the word returns, where it fits in every locale, with 44px
  touch height until the desktop layout. The accessible name (the `aria-label`) is unchanged, and
  a `title` carries the verb for pointer users, as Boom's does.

## Results

| Check | Result |
|---|---|
| 360px | Respond 56–158, Boom 164–208, Resonate 214–258, ⋯ 288–332 inside the Moment (28–332) and the clipping box (12–348): one line, 44×44 targets. All 8 locales on one line; Nepali, the widest, has 4px spare |
| 390px | ⋯ 318–362 inside the Moment (28–362) and 28px from the screen edge; one line; all 8 locales |
| 375 / 430 | contained, one line, every locale |
| Dark | PASS (every check, all four fixtures) |
| Light | PASS (every check, all four fixtures, compact and expanded) |
| Hit test | ⋯ answers at its centre and at eight points 19px out, covering its whole 44px round target, at 360 and 390 in dark and light. A real tap and a real pointer click (in the in-app browser, at (308, 400) at 360 and (338, 422) at 390) open its menu fully on screen |
| Touch targets | every action ≥ 44×44 on phones; the compact Resonate is 44×44 |
| Focus | Tab reaches ⋯ with a visible 2px ring; the ring stays inside the clipping box |
| Horizontal overflow | **NO**, at any width 320–1440, in any locale |
| Resonance summary | unchanged and still a separate row: `1 person` · `21115 people` · `2211118 people`, with exact per-meaning counts |
| Italian fixture identities | unchanged (who holds Venus/Sun/Saturn/Moon on the 5-person Moment is asserted by name) |
| Celestial implementation semantics changed | **NO** |
| `expressions.tsx` changed | **NO** (SHA-256 `dd78c36970dfa8c766cb196348c8db0293cf80ad5dea2cd31e19de3068a0194e`) |
| P0-3 regression | **PASS** (4.4-A truth §3; plus View as public with Celestial on at 360: Boom and Resonate inert, row contained) |
| P0-4 regression | **PASS** (4.4-A truth §1–§2; 4.3 verify V4 `postedAnyway: false`) |
| P0-5 regression | **PASS** (4.4-A truth §4 at 390/360; 4.3 verify V1–V3) |
| Visitor Life privacy | no change (layout only); `person-life-identity` 49, `social-final` §2 green |

The original Phase 4.3 probe (`social-audit-4-3-verify.cjs`, K) was independent of the fix.
Before, it reported ⋯ outside the column at 390, and Resonate and ⋯ at 360 and 320. Now it
reports **nothing outside the column** with the flag on at 390, 360 and 320.

## Tests

Run against the dev server on :3210, on the final source:

| Suite | Result |
|---|---|
| `social-4-4a1-p06` **(new)** | 599 / 599 |
| `social-4-4a-truth` | 125 / 125 |
| social-final | 180 |
| social-shell | 68 |
| one-application | 40 |
| final-app | 31 |
| circle | 132 |
| complete-my-world | 62 |
| person-life-identity | 49 |
| social-2030 | 31 |
| my-world-2030 | 27 |
| social-connection-final | 44 |
| social-2030-final | 35 |
| s2-person-world | 47 |
| locale-resolution | 21 |
| i18n | 45 |
| s3-moments | 17 |
| s4-people | 20 |
| s3-s4-loops | 14 |
| s5-discovery | 48 |
| s6-motion | 53 |
| s7-device-mastery | 56 |
| social-r2 / r3 / r3.1 / r3.2 | 43 / 80 / 69 / 92 |
| social-r3.3 / r3.5 / r3.6 / r3.7 | 102 / 20 / 21 / 37 |
| social-r3.8 / r3.9 | 34 / 31 |
| devanagari crops | pass |
| celestial-s0 / s2-field / s3-s6 / s7-constellation | 64 / 40 / 32 / 114 |
| identity-model | 13 |
| gate-desktop, gate-mobile, gate-fallback | PASS |
| amend-desktop, amend-mobile, trail-desktop, trail-mobile | PASS |

All 45 suites green. Also:

- `npx tsc --noEmit -p .` clean.
- `npx eslint src` exit 0, and the two changed source files exit 0. The new suite is CommonJS
  like every other suite in `prototype-tests/`, and `eslint src` is the project's gate.
- `npm run build` exit 0, with the dev server still up.

**Review:** a four-lens adversarial review (layout · a11y/scope · regression · test quality, each
checked by a skeptic) found no blocker. Its confirmed findings were fixed before the final run:

- the word's range
- the title hint
- ⋯ alignment when a desktop row wraps under large text
- Respond meeting ⋯ at 320px with 200% text
- coverage of the Circle/Life surface, View as public, quiet Moments, the Boom deck, light-mode
  expanded views, exact counts and a real locale check
- the clipping-box wording

## Screenshot paths

Untouched runtime frames, all in `/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/phase-4.4a1-p06/`:

- `P0-6-CONTACT-SHEET.png` (an index of the frames below)
- DARK: `d-360-compact-5.png` (the owner-review 5-person Moment), `d-360-expanded-5.png`, `d-390-compact-8.png` (rich, 8 people), `d-390-expanded-8.png`, `d-360-compact-0.png` (zero), `d-390-compact-1.png` (one), `t-360-dark-focus-ring.png`
- LIGHT: `l-360-compact-5.png`, `l-390-compact-8.png`, `l-360-expanded-5.png`, `l-390-expanded-8.png`

## Remaining defects (not changed — outside P0-6)

- On the **Circle/Life Day Almanac** (a narrower 296px column at 360), Nepali wraps the
  Respond · Boom · Resonate cluster onto two lines: 222px needed of 218. The ⋯ stays fixed on
  the first line and nothing clips or overlaps. Every other locale and width fits on one line.
- The global `:focus-visible { border-radius: 6px }` in `globals.css` makes every round control
  look like a rounded square while focused. This is pre-existing and affects the whole product.
- At 390 the rich Resonance summary row wraps onto two lines. That is the owner-approved summary,
  untouched.
- Two planet lenses (Meteor Shower, Comet) show dark square backgrounds in the summary row at
  390. This is Celestial artwork, for the Celestial owner.
- Below 360, when the cluster wraps, Resonate sits on line 2 while the tab order stays
  Respond → Boom → Resonate → ⋯.
- The Next.js dev-mode "N" badge appears in the frames. It's a development indicator, not
  product UI.

Not committed or pushed. Phase 4.4-B, D-1 to D-4, relationship work and visual mastering were not started.
