# UNIVERSAL SOCIAL POST COMPOSER — handover

STATUS: **COMPLETE** (prototype). Focused suite `prototype-tests/social-composer.js` 36/36;
every directly affected accepted suite green (list at the bottom); tsc 0 · eslint 0 ·
`next build` passes; catalogs 429 keys × 8, key-complete.

## WHAT EXISTED
The accepted Phase 4 Composer already carried most of the brief: one state machine
(idle/posting/failed/discard), the 900 ms cancellable posting window with inert body (A4),
Keep draft/Discard, the memory-first body (words → one coordinate sentence with DateField +
place instruments → feeling · counter), 7 kinds with per-kind quick fields (KIND_FIELDS),
FROM THE PHOTO date detection off the mock library's `takenAt` (the prototype's EXIF stand-in),
one-media-kind photos/video/link, before-birth refusal, backdate = day-precision noon anchor +
`sharedAt` provenance, edit preserving real media and temporal truth (A2/A3), people-name
resolution that never stores an unmatched name (A12), and — critically — a draft field bag
that already SURVIVES kind switching (A9 scopes at submit, not in state).

## WHAT WAS PRESERVED (everything above), WHAT CHANGED
1. **Opening state is SOCIAL (§6).** The always-visible seven-chip row is superseded by three
   quiet context actions — `media · people · details` (`data-sb-composer-actions`) — and the
   classification row (`data-sb-kind-row`, now 8 chips: `social · life · meal · activity ·
   problem · health · project · meeting`) waits behind **Record details** (`data-sb-record-details`,
   aria-expanded). Same chip language, same ≤36px quiet-chip contract, same sb-reveal.
2. **Record resolution (§28).** `Draft.socialOnly` + `Draft.recordChosen`;
   `resolved = socialOnly ? none : kind ≠ moment ? kind : media || recordChosen ? moment : none`.
   The post/edit payload carries `Moment.record?: "none"` — the prototype stand-in for the live
   "Social Post → zero or one Human Record" link. Explicit specialist choice REPLACES the Life
   Moment default (never Meal + Life Moment). A quiet resolved-state label
   (`data-sb-record-resolved`) states "Life Moment"/"Social only" once there is something to state.
3. **Social-only truth.** `record:"none"` posts never enter Life: excluded in
   `view-model.ts ringViewFor` (density/ticks/probes), `circle/model.ts visibleMoments`
   (full Circle + Day Almanac), `CircleModule` this-month. Feed rendering unchanged.
   The Circle's own "Record here" doorway seeds `recordChosen: true` — recording at a life
   coordinate IS explicit record intent.
4. **People are common (§34).** A People chip (count shown) edits the SAME `fields.with` the
   meal/meeting quick fields use (one input ever on screen: the chip focuses the kind's own
   field when it is visible); `with` travels on ANY post when set; a plain post renders the
   same "with N" doorway Moments already had (extracted `withControl`, now also on kind-less
   Moments). People tagged ≠ friends — nothing else changed.
5. **A little more (§14/§23).** `MORE_FIELDS`: activity → duration, project → since. Every
   required field stays quick; kinds whose schema has no genuinely optional extras carry no
   drawer (nothing invented to fill it). Values persist open or closed.
6. **AI SUGGESTION — PROTOTYPE HEURISTIC** (`social/suggest-record.ts`, replaceable adapter;
   this repo has NO inference/vision/EXIF pipeline — audited, stated, not faked). Debounced
   900 ms behind typing; at most ONE suggestion above a 0.75 floor, silence below it; passive
   row (`data-sb-suggestion`), accept keeps all state and opens Record details, Keep-as-post /
   Keep-as-Life-Moment dismisses for the composition; never in edit, never once classified.
7. **Success (§40).** One quiet localized line + SR announce (`data-sb-post-toast`):
   "Posted" · "Posted · Added to your Life" · "Posted · Recorded as {kind}". The landing on
   the rule stays the real success motion.
8. **Hydration defect fixed (environmental, pre-existing).** The host browser's V8 updated and
   its `Math.cos` now differs from Node's in the last ULP — the frozen LifeRing's engraved-tick
   float attributes stopped matching SSR. `polar()` now rounds to 1e-4 px (invisible;
   deterministic). Proven pre-existing by probing the stashed tree.

## FLOWS (all suite-proven)
TEXT-ONLY → Social Post only, no record. MEDIA → one Life Moment + the social projection,
photo date honored (old photo → old `at`, `sharedAt` = today). SOCIAL-ONLY override → media
stays social, zero Life presence. LIFE MOMENT explicit → real record even with words alone.
MEAL/ACTIVITY/HEALTH/PROBLEM/PROJECT/MEETING → the same composer adapts in place (§24), quick
fields lead, exactly one record each, Health/Problem keep their Only-me default and quiet
rendering; no specialist depth beyond the existing schema is exposed (none exists to leak —
the live system's deeper Health/Meeting/Project data must NEVER be serialized into the Social
projection: `social-api-contract.md` §D rules apply).

## PRIVACY BOUNDARY
Social visibility ≠ record visibility (S1 `canSeeMoment` unchanged). Quiet kinds unchanged.
The composer adds no new exposure: `record:"none"` only ever REMOVES Life presence.

## CIRCLE LINKING
Automatic and invisible (§31): any real record with a date is already in the Circle through
the one canonical Moment set; no confirmation, no duplicate, no UI.

## MOBILE / THEMES / A11Y / LOCALISATION
360 dark+light: no overflow, POST reachable, 36px context actions, the classification rail
scrolls itself; aria-expanded/aria-pressed/real names on every new control; reduced motion
inherits the global rule (sb-reveal collapses). 24 new keys × 8 locales (en byte-identical
where accepted suites look); ne verified visually (मिडिया · मानिस · विवरण / eight Devanagari
classification words).

## FILES CHANGED
`social/Composer.tsx` (the restructure) · `social/suggest-record.ts` (new) · `social/store.tsx`
(Draft +2 fields) · `social/data.ts` (`Moment.record`) · `social/view-model.ts` ·
`circle/model.ts` · `social/CircleModule.tsx` · `circle/CirclePreview.tsx` (Record-here seed) ·
`social/Moment.tsx` (withControl extraction + plain-post doorway) · `social/SocialPreview.tsx`
(PostToast) · `social/LifeRing.tsx` (polar rounding) · catalogs ×8 ·
suites: social-composer.js (new, 36) + recorded supersessions in social-final / s6-motion /
s3-moments / social-4-4a-truth (details in AGENTS.md).

## VERIFICATION (run once, per §54)
social-composer 36 · social-final PASS (184) · social-4-4a-truth 126 · s6-motion PASS ·
s3-moments PASS · circle 132 · s7-device-mastery 56 · person-life-identity 47 ·
my-world-2030 27 · s2-person-world 47 · social-2030 31 · complete-my-world 62 ·
social-s1-trust 24 · tsc 0 · eslint 0 · `next build` ✓.

## OWNER DECISIONS REQUIRED
None new. (BLOCK from the Social Wall program remains open; D-17 ancestral dates unchanged.)

## TRUE REMAINING BLOCKERS
None for the prototype. LIVE-ONLY: real EXIF/upload/vision classification replaces the
heuristic adapter and the mock library `takenAt` seam; the rich Memory surface named in the
brief exists only in the live product — nothing here weakened it because nothing here is it.
