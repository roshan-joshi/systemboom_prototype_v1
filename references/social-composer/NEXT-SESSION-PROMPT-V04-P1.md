# SYSTEMBOOM — HANDOFF PROMPT (V0.4 P1 · Composer Intelligence)

**How to use this file:** open a NEW Claude Code conversation in `/Users/roshan/SYSTEMBOOM_V2` and paste
everything below the line. Nothing else is needed — the new session will read `AGENTS.md` for the detail.

---

SYSTEMBOOM — CONTINUE V0.4 P1 (Universal Composer Intelligence)

Repository: `/Users/roshan/SYSTEMBOOM_V2`. Read `AGENTS.md` FULLY first — it is the authoritative dated record of
every accepted phase, every frozen zone and every recorded exception. The sections for this work are, in order:
**SOCIAL-4 · SOCIAL-4.1 · V3 (Universal Media Intelligence Engine) · V3.1 · V0.4 P1 · V0.4 P1 Correction Round 1 ·
UHI-DEC-014 · UHI-UX-134 · UHI-DEC-017** (all dated 2026-10-29/30, at the end of the file).

## STANDING RULES (apply to every task unless the owner says otherwise)
- **Do not commit. Do not push. Do not deploy. Do not modify production. Do not generate screenshots** (the owner
  reviews in the browser).
- Do not touch Circle / My Life / Celestial (`src/components/style-lab/circle/**`, `src/components/celestial/**`,
  `src/lib/celestial/**`), the Media Organizer layout, the Vision schema's category-neutrality, or the V2 field
  contract semantics (`src/components/style-lab/social/composer/field-contract.ts`).
- Do not change the DeepSeek provider/model/baseURL (`deepseek-flash`, `https://api.deepseek.com`, server-only
  `DEEPSEEK_API_KEY`, never `NEXT_PUBLIC_`), USDA/Open Food Facts routes or their matching logic.
- **Audit before changing.** The owner expects root causes proven from code and live evidence, never assumed.
- **Record every change** as a dated section/row in `AGENTS.md` (file · reason · behavioural effect · test), and
  record every superseded test assertion explicitly — never silently.
- Report honestly: separate automated results, live-provider results, browser verification and owner acceptance.
  Never claim owner acceptance. Never report PASS for a test that was not executed.
- STOP after the report.

## WHERE THE WORK STANDS
Uncommitted on top of commit `0f4987e` (51 entries, `git status --porcelain`). Nothing in this stream has been
committed; the owner has not yet decided to.

Built and verified in the previous conversation:
- **SOCIAL-4** — specialist AI for Project · Problem · Meeting · Health (`/api/analyze-record`, personas in
  `src/lib/ai/specialists/**`, Knowledge Base in `src/lib/ai/knowledge/**`, validator, Universal Observation
  Contract in `src/lib/ai/universal-observation.ts`).
- **V0.4 P1** — Pass 1 neutral vision (`src/lib/ai/vision/universal-visual-observation.ts`) + the deterministic
  seven-category classifier (`src/lib/ai/vision/classify.ts`), both riding on the existing `/api/analyze-meal`
  call; the SYSTEMBOOM Intelligence card in the Composer.
- **Privacy** — `src/lib/privacy/record-intelligence.ts`: AI observations are stripped for every non-owner at the
  one composition boundary (`composeFeed` in `social/store.tsx`).
- **UHI-DEC-014** — primary experience over incidental objects (a cake at a birthday is not a Meal).
- **UHI-UX-134** — human correction always wins (no stale category recommendation survives a choice).
- **UHI-DEC-017** — intelligent automatic category selection with a conservative evidence gate; Health is
  deliberately suggested, never auto-selected.

## HOW TO RUN TESTS
Dev server already runs on `http://localhost:3210` (keep-alive `.claude/dev-keepalive.sh`). Puppeteer suites:
`node prototype-tests/<suite>.js`. Last verified counts (all green):

| suite | count | | suite | count |
|---|---|---|---|---|
| `vision-intelligence` | 131 | | `social-composer` | 140 |
| `record-intelligence` | 96 | | `social-4-4a-truth` | 125 |
| `classifier-rules` (pure Node) | 23 | | `social-composer-canonical` | PASS (62) |
| `privacy-intelligence` | 19 | | `social-final` | PASS (194) |
| `meal-intelligence` | 355 | | `s7-device-mastery` | PASS (56) |
| `activity-intelligence` | 273 | | `media-intelligence` | 14 |
| `field-contract` (pure Node) | 24 | | `i18n` | PASS (45) |
| `s3-moments` | PASS (17) | | `s6-motion` | PASS (55) |

Also required after changes: `npx tsc --noEmit` · `npx eslint <changed files>` · and
`DEEPSEEK_API_KEY=TEST_LEAK_MARKER_xyz123 USDA_FDC_API_KEY=TEST_LEAK_MARKER_usda789 npx next build` followed by
`grep -R -l TEST_LEAK_MARKER_xyz123 .next/static` (expect NOT FOUND, exit 1) with a positive control
(`grep -R -l sb-smart-assist .next/static`).

Mock seams (so no accepted suite ever reaches the live provider): page params `mockai` · `mockrecord` ·
`mockactivity` · `mockfacts` · `mockpackaged` · `mockwait` · `mockgeo`. Vision fixtures are
`?mockai=vision-<scene>` (`birthdayparty`, `plaincake`, `ambiguouscake`, `wedding`, `construction`, `runner`,
`laptop`, `laptopdesk`, `whiteboard`, `lab`, `chair`, `ambiguous`, `text`, `byasset`). Evidence and raw logs live
in `prototype-evidence/social-4-records/` (~194 files, including the live-provider logs).

**Two environmental flakes are recorded, not fixed:** under a 14–16 suite fleet on the shared dev server,
`activity-intelligence` V3-104 and `meal-intelligence` V1-66 each failed once and were green standalone
immediately after. Re-run standalone before treating either as a regression.

## OPEN / PENDING
- **Owner acceptance is PENDING** for every phase above — including the UHI-DEC-017 birthday case. The owner tests
  on a real phone with real photographs.
- Physical-device verification has never been run (desktop Chromium emulation only, 320–412 px).
- The synthetic test scenes in `prototype-tests/fixtures/scenes/` are flat illustrations the provider sometimes
  reads as graphics; real photographs remain the owner's test.
- Non-English catalog values added in this stream are drafts pending native review.
- There is no live feed/profile/record-detail API in this repository — the live port must serialize every
  non-owner response through `publicPostPayload` (recorded as a live contract, not implemented here).
- P2 and P3 are NOT started and must not be started without the owner's approval.

## WHAT TO DO NEXT
Wait for the owner's next directive. They typically paste a numbered brief (a requirement ID such as
UHI-DEC-0xx / UHI-UX-1xx, an acceptance-test list, and a restrictions section). Follow it exactly: audit first,
implement the focused change, add the named acceptance tests to the existing suites, run the relevant regressions,
verify against the real provider where safe, then report under the headings the brief specifies — and stop.
