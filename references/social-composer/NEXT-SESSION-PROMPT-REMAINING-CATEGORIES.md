# SYSTEMBOOM — SOCIAL COMPOSER — REMAINING CATEGORIES

Paste everything below this line into a NEW Claude Code conversation opened in `/Users/roshan/SYSTEMBOOM_V2`.

---

SYSTEMBOOM — SOCIAL COMPOSER
PHASE K — REMAINING CATEGORIES (HEALTH · PROBLEM · PROJECT · MEETING · LIFE MOMENT DEPTH)
PROTOTYPE ONLY · ONE CATEGORY AT A TIME · AUDIT FIRST

## WHERE WE ARE (read this before touching anything)

Read `AGENTS.md` fully first — it is the authoritative, dated record of every accepted phase, every frozen zone and every recorded exception. Then read `references/social-composer/UNIVERSAL-SOCIAL-COMPOSER-CANONICAL-HANDOVER.md` and `CANONICAL-COMPOSER-FIELD-CONTRACT.md`.

The Social Composer is `src/components/style-lab/social/composer/` (`UniversalComposer.tsx` orchestration, `domains.tsx` per-kind Quick/More UI, `types.ts` the one `UDraft`, `submit.ts` the Social projection + record fields, `field-contract.ts` the V2 field contract, `activity-fields.ts`, `grouping-model.ts` + `Grouping.tsx`, `media-assets.ts`, `meal-intelligence/`). Record types live in `src/components/style-lab/social/data.ts` (`Moment`, `KindFields`). There is NO real database — everything is local prototype state (`store.tsx`, in-memory `udraft`).

Accepted and working (do not rebuild, do not weaken):
- Meal: V1/V1.1/V2 intelligence (DeepSeek `deepseek-flash` via `/api/analyze-meal`, USDA + Open Food Facts facts, per-photo form, waiting UX, V2 field ownership).
- Activity (V3): `/api/analyze-activity`, `activity-fields.ts` on the V2 contract, category-first (Meal read carries an additive `activityCategory`; Activity reading runs only once Activity is selected), OCR readout suggestions, derived pace, natural-language provenance.
- Mixed media: per-asset readings (`assetObs`/`actObs`), the calm "SYSTEMBOOM organised these photos" card, the grouping model (`grouping-model.ts`, Composer-local, carried by `UDraft.grouping`), ONE Media Organizer sheet (All media / Organise modes; "+N more", Edit, Review & Group all open it), per-asset category correction (`setAssetKind` → `moveToKind` + `assetCategory`), `contextIntent` (the selected asset drives pill/form/cards in a mixed composition; an explicit post-level kind wins), mixed post = the generic Life-Moment shell with `fields.mixedAssets[]` record-only.
- HEIC → JPEG derivative (`heic2any`, original + EXIF kept), video poster frame, media limit 10 with inline refusal, Keep draft / resume, double-post lock, audience, People/Place/When sheets.
- Cross-domain Social publication (one post → several canonical records) is DEFERRED by owner decision ("CROSS-DOMAIN SOCIAL PUBLICATION ARCHITECTURE REQUIRED") — do not build `Moment.records[]`, `SocialPublication`, `HumanRecord[]`, EventGroup.

Verified green on the current working tree (uncommitted since `0f4987e`; the owner has NOT yet decided whether to commit the V3 → Phase A → collage → incremental/category work — ask before any `git commit`, never push):
`activity-intelligence` 273 · `meal-intelligence` 355 · `social-composer` 140 · `social-4-4a-truth` 125 · `social-composer-canonical` 62 (PASS) · `social-final` 194 (PASS) · `media-intelligence` 14 · `field-contract` 24 · `i18n` 45 (PASS) · `tsc` 0 · ESLint 0 on changed files · `next build` 0 · DeepSeek/USDA secret markers NOT FOUND.
Known intermittent: `social-composer` §13 ("one post, one Life Moment") races a fixed 1.3 s read after Post in a long session; the product posts correctly (~1015 ms). Rerun standalone before treating it as a regression; do not edit that accepted suite without owner approval.

Latest audit of the whole composer: the "COMPLETE PROTOTYPE UX CLOSURE AUDIT" in the previous conversation; its category matrix was: Life Moment READY, Meal READY, Activity READY, Health PARTIAL (body area + 17-type picker, severity, private note, sharing note), Problem PARTIAL (words only + More), Project PARTIAL (name/goal + More), Meeting PARTIAL (subject + when-now + More). None are placeholder or broken. Closure phases B (field vocabulary), C (draft observations), D (mobile/a11y polish) from that audit are NOT started — do not start them here unless the owner says so.

## MISSION FOR THIS CONVERSATION

Bring the remaining categories to the same standard as Meal and Activity inside the SOCIAL composer only — one category per pass, each pass its own audit → failing tests → implement → regress → report → STOP:

1. HEALTH (private by default; Social audience ≠ record privacy; `recordPrivacy:"private"`; never render record depth socially)
2. PROBLEM
3. PROJECT
4. MEETING
5. LIFE MOMENT depth (the default/general record — must never look like an empty state)

For each category the owner decides whether it gets MEDIA INTELLIGENCE at all. Default assumption: NO new AI category classification for these four (the AI audit rule stands: "do not build a universal seven-domain dispatcher"; Health inference from media is forbidden; Problem/Project/Meeting are mostly words). If a category needs intelligence, it must be the same architecture (one server route under `src/app/api/`, DeepSeek `deepseek-flash`, server-only key, `?mock=` seam, minimal payload, never privacy-broadening) and must JOIN the existing category-first seam, never replace it — STOP and report "ARCHITECTURE BLOCKER" if that is not possible.

Before any edit, run the baseline fleet (the nine suites above + `npx tsc --noEmit`) and report ACTUAL counts; STOP on a genuinely red accepted suite ("BASELINE FAILURE").

## FROZEN — DO NOT CHANGE
Meal AI, Activity AI, DeepSeek prompts, confidence thresholds, USDA/OFF, the V2 field contract semantics, `grouping-model.ts` semantics, the Media Organizer layout and behaviour, `contextIntent`/`selId` selection logic, HEIC/video pipelines, `MEDIA_LIMIT`, draft architecture (small generic extensions only, reported), database/schema (there is none — but `Moment`/`KindFields` additions must be additive and record-only), Circle, My Life, Celestial, every file under `src/components/style-lab/circle/**`, `src/components/celestial/**`, `src/lib/celestial/**`. The Phase 4 frozen zones in `AGENTS.md` apply — a change there needs a recorded exception row.

## CONVENTIONS (follow exactly)
- Tests: Puppeteer suites in `prototype-tests/*.js` against the dev server on `http://localhost:3210` (keep-alive script `.claude/dev-keepalive.sh`). Use `prototype-tests/celestial-lib.js` `launch`/`sleep`. Pin `&mockai=nonfood&mockfacts=miss&mockpackaged=miss` on every page URL so no accepted flow ever reaches the real provider; `?mockactivity=`, `?mockwait=`, `?mockgeo=1` exist. Debug globals: `window.__SB_SOCIAL_STATE`, `__SB_MEAL_ANALYSIS_LOG`, `__SB_MEAL_ASSET_OBS`, `__SB_ACTIVITY_ASSET_OBS`, `__SB_ACTIVITY_CELLS`, `__SB_ASSET_SNAPSHOT()`.
- Failing-first: write the checks, run them BEFORE implementation, classify FAIL-missing-capability vs PASS-pre-existing, keep the raw log under `prototype-evidence/`.
- i18n: every new user-visible string goes into all 8 catalogs (`src/lib/i18n/catalogs/{en,es,hi,it,ne,nl,ru,zh-Hans}.ts`), English byte-identical where accepted suites look; non-English are drafts pending native review.
- Copy: human, calm, no technical words (no classifier/confidence/record ID/domain).
- Record every change as a dated section in `AGENTS.md` (file · reason · behavioural effect · test), including owner-superseded assertions (never silent).
- Verification after each pass: the relevant suites + `npx tsc --noEmit` + ESLint on changed files + `DEEPSEEK_API_KEY=TEST_LEAK_MARKER_xyz123 USDA_FDC_API_KEY=TEST_LEAK_MARKER_usda789 npx next build` + grep `.next/static` for both markers (expect NOT FOUND) with a positive-control grep.
- Do not commit. Do not push. Do not generate screenshots (the owner inspects in the browser). STOP after each category's report and wait for the owner.

## REPORT FORMAT (per category)
SYSTEMBOOM — SOCIAL COMPOSER — {CATEGORY} RESULT
1. Audit (current fields: Quick / More / record-only; what exists, what's missing)
2. Owner decisions needed (if any) — STOP there if a decision gates the work
3. Failing-first evidence (counts, raw log path)
4. Files changed (path · reason · product/test/docs)
5. What the person sees (Quick → More → Post)
6. Privacy / disclosure (what reaches the Social card vs record-only)
7. Regression (exact counts for every suite, tsc, ESLint, build, markers)
8. Frozen areas confirmation
9. Final status: `{CATEGORY} — READY FOR OWNER TESTING` or `{CATEGORY} — REWORK REQUIRED`

Start with HEALTH. Begin with the zero-edit audit and the baseline run; do not implement until both are reported.
