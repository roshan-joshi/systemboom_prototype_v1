# UNIVERSAL SOCIAL POST COMPOSER — GREENFIELD HANDOVER

STATUS: **COMPLETE** (prototype). Focused suite `prototype-tests/social-composer.js` 67/67
against the §47 matrix; `social-4-4a-truth` 125/125 and `social-final` 194/194 re-pointed
(every product truth re-proven through the new UI); tsc 0 · eslint 0; full affected-suite
runs recorded at the end. Brief: `references/social-composer/GREENFIELD-BRIEF.md`.

## OLD COMPOSER — what was replaced/removed
`src/components/style-lab/social/Composer.tsx` (795 lines) is **deleted**, together with the
store's old `Draft` type, `draft` state field and `"draft"` action. Gone with it (superseded,
recorded per §48): the "New moment" title, the "What happened at {Life age}?" prompt and
entry bar, the always-visible coordinate sentence (date · exact age · place), the visible
feeling row, the kind-scoped venue/with fields, the required kind fields, the
Health/Problem "Only me" audience auto-default, the burn-date checkbox, and the readout
detection states. What was deliberately CARRIED (product truths, not UX): the cancellable
900 ms pending publication + inert body (A4, incl. Cancel staying live while Posting), edit
temporal/media truth (A2/A3), one-media-kind, the ten-photo limit, before-birth/future
refusals (A11), unmatched-name honesty (A12), the transform-free @2xl shell centring
(S7 §50), the safe-area footer, and the SYSTEMBOOM date grammar.

## NEW ARCHITECTURE — `src/components/style-lab/social/composer/`
- `types.ts` — `UDraft` (the ComposerDraft §6): common text/audience/media/people/place +
  `intent` (`social|moment|meal|activity|health|problem|project|meeting`) + `intentSource`
  (`default|user|media|ai`) + `eventTime {date, precision, provenance}` + per-domain
  `domains` drafts; `resolveIntent` (§31), `emptyUDraft`, `circleUDraft`, `uDraftFromMoment`.
- `domains.tsx` — the adapter registry: per-kind Quick + A-Little-More renderers, occasion/
  context/activity-type/health-type vocabularies, `activityQuickMetrics` (adaptive §15).
- `submit.ts` — `buildSubmission` (the one orchestration §30): minimum content (§20),
  §29 projection allowlist per kind, A3 media truth, §21 time rules, §28 record privacy,
  `successKey` (§45).
- `UniversalComposer.tsx` — the shell: Create post header, identity + Audience listbox,
  adaptive "What's happening?" area, media preview + metadata review, suggestion row,
  common action row (Photo/Video · People · Place · Record Details), intent indicator,
  Record-details panel (Social mode | RECORD AS ×7), domain quick + A little more, Health
  sharing awareness, clear-validation line, POST footer with posting/failed/discard states.
- Reuses: `suggest-record.ts` (PROTOTYPE HEURISTIC — the replaceable AI seam §24–§26),
  `DateField`, `PersonIdentity`, `useFocusTrap`, the mock media library, i18n, theme tokens.

## THE FLOWS (each one suite-proven)
- **DEFAULT (§5)**: Create post · photo+Life Ring+name · Audience ▾ · What's happening? ·
  Photo/Video · People · Place · Record Details · POST. Hidden: categories, date/time,
  Life age, Feeling, Circle vocabulary, every specialist field.
- **TEXT ONLY (§9)**: Social Post only (`record:"none"`), toast "Posted". Never a record.
- **MEDIA (§10)**: intent resolves to Life Moment (`intentSource` stays `"media"`-default —
  shown as "Recording as: Life Moment · Change"); the photo's own date/place surface as
  "From the photo: … · Use / Not this" (§23/§24 — reviewed, never auto-published; POST waits
  for the review); "Social only" keeps media with NO record and NO Circle/density presence.
- **RECORD DETAILS (§8)**: "Social mode" (Social only) clearly apart from "Record as"
  (Life Moment · Meal · Activity · Health · Problem · Project · Meeting) — no Media, no
  Social, no Other in the record list.
- **LIFE MOMENT (§13)**: quick = nothing extra. More: When · Feeling · Milestone.
  (Story/Chapter/Travel/Soundtrack exist only in the live product — not invented here.)
- **MEAL (§14)**: quick = Occasion (Breakfast…Other) + "What did you have?". More: Context
  (Home…Other) · Notes · When. No Venue (Place common), no With (People common). "Pizza at
  Mario's with Sofia" posts without re-entry — structure stays optional.
- **ACTIVITY (§15)**: quick = type (12) + adaptive metrics (Run/Walk/Cycling/Hiking/Swim →
  Distance+Duration; Gym → Workout+Duration; Sport → Sport+Duration; Mind&Body →
  Practice+Duration; others → none). More: Intensity · Route · Goal · Notes · When.
- **HEALTH (§16)**: quick = optional Body area + type (Symptom/Injury/Appointment/Other).
  More: When · severity · PRIVATE note (stated: "never shared"). Above POST: "Sharing with:
  {audience} — only this update…; your detailed Health record remains private."
- **PROBLEM (§17)**: quick = the words themselves; Status=Open internal; More: Category ·
  Impact · Related project · Notes · When. No lifecycle at creation.
- **PROJECT (§18)**: quick = Project title + optional Goal (posts on title alone). More:
  Milestone · Notes · Start (When).
- **MEETING (§19)**: quick = Subject + When (visible immediately) + common People. More:
  Purpose · Duration · Related to · Notes · Online.
- **COMMON FIELDS (§7)**: one text, one media set, one People (`fields.with`), one Place,
  one audience, one eventTime — domains reference, never duplicate.
- **SWITCHING (§26)**: all common state + every per-domain draft survives (suite walks
  Meal→Activity→Meal and Run→Gym→Run with values intact).
- **AI (§25)**: one suggestion max above the 0.75 floor, silence below; accept = classify
  only (source `"ai"`); Keep dismisses for the composition. PROTOTYPE HEURISTIC, labeled.
- **TIME (§21/§32)**: postedAt ≠ eventTime; a 2019 event lands at 2019 in feed and Circle
  (noon anchor, day precision, `sharedAt` provenance); an ignored photo date stays unknown
  (post at NOW); clearing When returns to NOW — nothing fabricated, no NaN.
- **PRIVACY (§28)**: `Moment.recordPrivacy:"private"` on every specialist record born in
  Social; `privacy` stays the social audience only; record depth (privateNote, severity,
  bodyArea) is stored on the record and NEVER rendered by the projection.
- **PROJECTIONS (§29)**: `submit.ts` allowlists per kind what the Social card may carry;
  `Moment.tsx`'s kindLine renders occasion/items, activity type + metric, subject, goal —
  never nutrition/routes/labs/transcripts (which don't exist here and now can't leak by
  construction).
- **SUBMISSION (§30/§37)**: one POST, duplicate-locked, 900 ms cancellable, retry keeps the
  draft, failure states its Cancel + Retry.
- **DRAFTS (§27)**: nothing exists before POST; Keep draft (in-memory `state.udraft`)
  restores verbatim; the entry bar says "Draft kept — continue your post".
- **CIRCLE (§32)**: automatic placement by eventTime; "Record here" seeds an explicit Life
  Moment at the coordinate with its When open.
- **STOP SHARING (§36)** / **SHARE LATER (§35)**: `Moment.unshared` — the ⋯ menu's "Stop
  sharing" removes the projection from feed + search; the record stays in Life/Circle/density;
  the Day Almanac offers "Share" on an own unshared record — the SAME record returns, never
  a duplicate.
- **NAVIGATION (§37)**: the feed card is the Social detail; owner ⋯ = Save/Edit/Change
  privacy/Stop sharing/Delete/View-in-Life-seam; visitors get the projection + Respond/Boom/
  Resonate only. "Open in Meal/…" specialist worlds are a documented live seam (they do not
  exist in this repo).

## MOBILE / THEME / A11Y / LOCALIZATION
360 dark: full-viewport sheet, POST reachable, no overflow, 36–44px targets, record rail
scrolls itself; desktop: the 400–560px centred modal (same S7 class). Dialog semantics,
focus trap + return, aria-expanded/aria-pressed/radio records, Escape ladder (panel →
discard). 96 new `ucomposer.*` keys × 8 locales (**525 keys each, key-complete**); ne
verified end-to-end (पोस्ट बनाउनुहोस् · मिडिया/मानिस/स्थान/विवरण · seven Devanagari records).

## FILES CREATED / CHANGED / REMOVED
Created: `social/composer/{types.ts,domains.tsx,submit.ts,UniversalComposer.tsx}`,
this handover. Changed: `data.ts` (KindFields Universal keys · `recordPrivacy` · `unshared`),
`store.tsx` (`udraft` + `shareState`; old Draft purged), `SocialPreview.tsx` (wiring, entry
bar, §45 PostToast), `CirclePreview.tsx` + `DayAlmanac.tsx` (wiring + Share-again),
`Moment.tsx` (Stop sharing; §29 kindLine projections), catalogs ×8.
Removed: `social/Composer.tsx`.

## TESTS
`social-composer.js` **rewritten** to this spec (67). Re-pointed with recorded supersessions
(AGENTS.md "Phase UC-G"): `social-4-4a-truth` (125 — §5 rebuilt on the new contract, every
A-truth kept), `social-final` (194 — §10/§14 rebuilt), `s6-motion` §5, `s3-moments`,
`social-shell`, `s3-s4-loops`, `final-app`. Untouched and expected green: `circle`,
`s7-device-mastery`, `complete-my-world`, identity/preview entry-point suites.

## OWNER DECISIONS REQUIRED
None — §51: nothing in the prototype contradicted the frozen requirements.

## TRUE BLOCKERS
None for the prototype. LIVE-ONLY seams (stated, not faked): real EXIF/OCR/vision
classification behind `suggest-record.ts`'s signature; specialist worlds ("Open in Meal…");
server-side record-privacy enforcement; autosave beyond in-memory; real media upload.
