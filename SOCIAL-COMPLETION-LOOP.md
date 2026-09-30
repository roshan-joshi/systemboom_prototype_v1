# SOCIAL COMPLETION LOOP — ledger

Working ledger for the SOCIAL WALL COMPLETION MASTER PROGRAM (S1–S8).
One entry per phase; updated as work progresses. Full regression runs ONCE at the end.

## S1 — Social Trust Foundation
STATUS: COMPLETE
CHANGED: view-model.ts (canSeeMoment access matrix · momentLifeFor current-band rule · ring density owner-only) · store.tsx (composeFeed, AudienceScope, canSee, profileId + openWorld, PreviewScope through the stranger seam) · world/model.ts (relationships coherent with §5.4; relationshipBetween/relationshipKeyFor/relationshipEntriesFor — direction-aware single truth) · SocialPreview.tsx (AudienceBridge, hero rel wiring, ?profile= harness, foreign-World empty state) · ProfileHero.tsx (relationshipWith action key) · PersonCard.tsx (pair truth + Open World) · People.tsx (viewer-relative lists) · Chrome.tsx (search + notification landing through canSee; opened-World landing returns home) · LifeCursor.tsx (no other-person life position) · data.ts (n-request → Francesca) · 3 new i18n keys ×8 (387 ea)
VERIFIED: social-s1-trust 24/24 (new) · 4-4a-truth 125 · person-life-identity 47 · social-connection-final 45 · s4-people 20 · s6-motion 53 · s5-discovery 48 · complete-my-world 62 · s3-s4-loops 14 · P0-6 599 — all green; tsc clean
REMAINING: block semantics do not exist in the prototype → OWNER DECISION (see bottom); Circle page's own visitor filter (frozen zone) documented as a live contract — no stranger route exists in the prototype

## S2 — Respond Conversation
STATUS: COMPLETE (accepted-suite batch verification recorded below)
CHANGED: data.ts (Note gains expressions?/removed?/photo?/mentions? — documented; n-rain-1 seeded one Boom) · store.tsx (noteExpress single-active reducer; noteDelete → tombstone when replies exist, prune when the last reply goes) · Moment.tsx (NoteBoom — the ONE expression registry at conversation weight: dormant control → picker (18, canonical order, Remove) → participation count ≤3 lenses → who-felt-this people list; reply-to-reply answers in the parent's composer with the person prefilled AND recorded as a chosen mention; tombstone row "Response removed" with no identity/actions; mention suggestions from this Moment's participants + the viewer's connections only, Enter picks first, ids stored never scanned, rendered as person doorways; one-photo picker/chip/render/fallback; CONV_BATCH=20 + "View N earlier responses" chronological batching; preview shows participation, no control) · 6+3 new i18n keys ×8 (395 ea)
BOUNDARIES HELD: no Like, no ranking/Top/Best, Boom ≠ Respond ≠ Resonate (no Celestial on responses), expressions.tsx byte-untouched, author/time preserved on edit (4.4-A behaviour untouched)
VERIFIED: social-s2-respond 29/29 (new); tsc + eslint clean; batch of social-final · social-shell · social-r2-expression · social-r3-3d-expression · social-4-4a-truth recorded below when finished

## S3 — People + Friends
STATUS: COMPLETE
FINDING: the surfaces were already complete after S1 (PersonCard junction incl. Open World, People panel find/requests/your-people, empty states, viewer-relative truth) — S3's work was VERIFICATION of the full lifecycle, which had never been walked end-to-end in one suite.
VERIFIED: social-s3-people 14/14 (new) — none→Requested→Cancel→none; request-in→Decline→none; friend→Remove→none; card↔People-panel↔World-hero agreement on a pending request; people-present and who-felt-this are identity-only doorways (never relationship actions); empty search state; ne localisation
CHANGED: nothing in src — S3 shipped as tests only

## S4 — Chat + Notifications
STATUS: COMPLETE (accepted-suite batch verification recorded below)
CHANGED: data.ts (kind union + noteId on Notification with the live-contract note; nt4 made TRUTHFUL — n-vid-1 now really mentions Giulia, chosen id + real text, and the event says "in a response"; nt1/nt3/nt5/nt8 gain noteId to their real responses; four new READ fixtures each true against a real fixture: nt-reply (Sofia's n-forty-23 IS a reply to Giulia's n-forty-22), nt-response-boom (Elena's thanks seeded ON n-forty-22), nt-moment-boom (Luca's joy from the R2 seed on m-rain), nt-accepted (Matteo IS a friend); chat deliberately stays OUT of the bell — message-unread keeps its own badge, never a combined total) · focus-moment.ts (focusNote + settleOnNote — the exact-response landing seam) · Moment.tsx (sb-focus-note listener opens the conversation in whichever shape the width would anyway; Notes unfolds; MomentConversation widens its batch window to include a named earlier response; the landing owns focus) · Chrome.tsx (goToMoment carries noteId/kind/whoId: accepted → person surface; noteId → focusNote; removed/stale note → the existing truthful-unavailable announce path)
BOUNDARIES HELD: no notification spam (all new fixtures read, counts contracts untouched), no engagement arithmetic, request row stays first, bell ≠ messages
VERIFIED: social-s4-signal 13/13 (new); tsc + eslint clean; batch (4-4a-truth 125 ✓, s5-discovery 48 ✓, complete-my-world 62 ✓, others pending) recorded on completion

## S5 — Moment Completion
STATUS: COMPLETE
CHANGED: store.tsx (saved: string[] + save/unsave; delete purges bookmarks — no ghost) · Moment.tsx (Save leads both ⋯ menus, paused in preview; Share… via navigator.share only where the platform has it, Copy link universal, NO repost/quote/boost) · Chrome.tsx (account menu gains the real Saved surface, first; data-sb-account-trigger hook) · SocialPreview.tsx (SavedPanel — a TransientSurface in the one exclusivity family; entries land exactly via reveal+focusMoment) · 7+1 i18n keys ×8 (405 ea, key-complete)
RECORDED SUPERSESSIONS (never silent): social-final.js others' menu → "Save|Report|Hide|Copy link|View in Life — later"; social-final.js account menu → "Saved|Statistics|Weather|Exchange|Settings|Appearance|Logout"; social-4-4a-truth.js preview menu includes Save, paused. No check weakened or removed.
VERIFIED: social-s5-moment 15/15 (new); tsc + eslint clean; full-fleet confirmation at the end

## S6 — Search + Safety
STATUS: COMPLETE
CHANGED: PersonCard.tsx (quiet, last Report action — announced, per-person state, a report is NOT a block) · ChatSurface.tsx (verified + documented: an unknown ?c= deep link already lands on the truthful list — comment records it) · 2 i18n keys ×8. Search privacy was S1's canSee (verified there). BLOCK remains the recorded OWNER DECISION — deliberately not invented.
VERIFIED: social-s6-safety 8/8 (new) — report seam, no invented Block, chat/world edges, ne

## S7 — Social UX Completion
STATUS: COMPLETE
FINDING: the accepted device-mastery bar (s7-device-mastery 56) already guards the wall; S7's work was holding the NEW S1–S6 surfaces to that bar + one real fix during S2 (the Boom control's phone hit area yields the strip toward Reply at the gap midline — both 44px targets whole, verified in 4-4a-truth 125).
VERIFIED: social-s7-polish 8/8 (new) — 320 survival (conversation/People/Saved/notifications), dark material from tokens, reduced-motion exact landing with instant settle, keyboard focus return

## S8 — Monetization Foundation
STATUS: COMPLETE
CHANGED: src/lib/entitlements/index.ts (new — Entitlement union, Plan, EntitlementSource, FREE_PLAN, can(); the free core is complete BY CONSTRUCTION: core capabilities are not entitlements at all) · docs/handover/monetization-foundation.md (new — product law, the seam, surface map, live obligations) · plan.free key ×8. NO billing, no checkout, no simulated purchases anywhere.
VERIFIED: tsc + eslint clean; the doc's surface map names mount points only — nothing gated

## Owner decisions required (so far)
- OWNER DECISION REQUIRED: Block semantics (S6 §10.2). Blocking does not exist anywhere in the prototype or the recorded product decisions.
  OPTIONS: A) full block — invisible both ways (no Moments, no search, no chat, no requests); B) quiet block — no contact (requests/chat/mentions) but public Moments stay mutually visible; C) defer to the live backend entirely.
  RECOMMENDATION: A (full block) — the only posture that cannot surprise a person who blocked someone; but this is a real product decision, not implementable by inference.


## Final adversarial self-audit (TRY TO DISPROVE THE COMPLETION CLAIM · 2026-09-25)

1. PRIVACY BYPASS — attempted via View-as-public writes: the preview dispatch guard is a
   WHITELIST (`PREVIEW_READ_ONLY = {loadMore, reveal, landed}`), so save/unsave/noteExpress/
   noteDelete/note/express are refused by construction, not by enumeration. s1-trust §4 +
   4-4a-truth §3 hold the read side. NOT DISPROVEN.
2. CONTRADICTORY FRIEND STATE — card ↔ People panel ↔ foreign Hero walked on a live pending
   request (s3-people §2). NOT DISPROVEN.
3. DEAD BUTTONS — every new control exercised end-to-end in suites (Save/Unsave, Saved
   entries, Share, Report, Open World, NoteBoom pick/replace/remove/who, mention doorways,
   photo pick/remove, View-earlier, notification landings). NOT DISPROVEN.
4. FAKE SUCCESS — Share confirms nothing itself (the platform sheet is the confirmation;
   a cancel is silent by design); Copy link still only confirms after writeText resolves.
   NOT DISPROVEN.
5. MOBILE OVERFLOW — s7-polish §1 at 320 for conversation/People/Saved/notifications;
   the Reply/Boom 44px contest found by 4-4a-truth was FIXED (midline split), 125/125.
6. UNTRANSLATED STRINGS — catalogs 405 keys × 8, key-parity script-verified; ne spot checks
   in every new suite. Notification EVENT TEXT stays English by the recorded live-contract
   carryover (S5/S6 pass), restated in the handover.
7. DELETED CONTENT REACHABLE — delete purges bookmarks (s5-moment §2); noteId landing skips
   removed responses; MC-20 stale landing announce unchanged; search reads live state.
8. LANDING ON HIDDEN CONTENT — notification landing runs through canSee (s1-trust §4).
9. SEMANTIC MIXING — Respond writes, Boom expresses (same registry at conversation weight —
   explicitly mandated), Resonate untouched (no Celestial file changed; expressions.tsx
   SHA-256 dd78c369…a0194e byte-identical, re-verified).
10. MONETIZATION GATING CORE — zero consumers of `src/lib/entitlements` in product code
    (grep-verified); core capabilities are not members of the Entitlement type at all.
11. FOREIGN-WORLD SAVE — probed live: saving inside Luca's World, then choosing the Saved
    entry, returns to My World and lands focused on the exact Moment.
12. FROZEN ZONES — git status: no celestial/circle/cosmos file changed by this program (the
    only celestial diff is ResonateControl.tsx from the accepted P0-6 pass).


## FINAL VERIFICATION (one full-fleet run · 2026-09-25)

52 suites, sequential, final source. Two suites first ran red on exact-list expectations that
predated S5's Save/Share menu items; both were superseded capability-aware (recorded below)
and re-run solo green. Everything else passed first time.

social-final 180 ✓(re-run) · social-shell 68 · one-application 40 · final-app 31 · circle 132 ·
complete-my-world 62 · person-life-identity 47 · social-2030 31 · my-world-2030 27 ·
social-connection-final 45 · social-2030-final 35 · s2-person-world 47 · locale-resolution 21 ·
i18n 45 · s3-moments 17 · s4-people 20 · s3-s4-loops 14 · s5-discovery 48 · s6-motion 53 ·
s7-device-mastery 56 · social-r2-expression 43 · social-r3-3d-expression 80 ·
social-r3-1 69 · social-r3-2 92 · social-r3-3 102 · social-r3-5 20 · social-r3-6 21 ·
social-r3-7 37 · social-r3-8 34 · social-r3-9 31 · devanagari-crops PASS · celestial-s0 64 ·
celestial-s2-field 40 · celestial-s3-s6 32 · celestial-s7-constellation 114 ·
social-4-4a-truth 125 ✓(re-run) · social-4-4a1-p06 599 · identity-model 13 · gate-desktop ·
gate-mobile · gate-fallback · amend-desktop · amend-mobile · trail-desktop · trail-mobile PASS ·
**social-s1-trust 24 · social-s2-respond 29 · social-s3-people 14 · social-s4-signal 13 ·
social-s5-moment 15 · social-s6-safety 8 · social-s7-polish 8 (all new)**.

tsc --noEmit 0 · eslint src 0 · `next build` passes · catalogs 405 keys × 8, key-complete ·
expressions.tsx SHA-256 dd78c369…a0194e byte-identical · no celestial/circle/cosmos file
changed by this program.

S5 supersessions recorded during the final run (never silent; invariants restated in-file):
- social-final.js others'-menu + social-4-4a-truth.js preview-menu: the expected list is now
  CAPABILITY-AWARE — `Share…` sits between Hide and Copy link exactly when the platform
  itself has `navigator.share` (this headless Chromium does). No item removed.
- social-4-4a-truth.js §7 menu keys: the menu opens on **Save** (the new first item), ↓
  reaches Report; the invariant (first item, arrows, End → last actionable, Escape → trigger)
  is asserted unchanged.

## PROGRAM COMPLETE — completion gate

Every S1–S8 exit condition met except the one true owner decision (BLOCK), recorded above
with options + recommendation. Not committed, not pushed (standing rule: only on explicit
owner request).


## Phase UC — Universal Social Post Composer (owner program · 2026-09-28)
STATUS: COMPLETE. See AGENTS.md "Phase UC" and references/social-composer/UNIVERSAL-SOCIAL-COMPOSER-HANDOVER.md.
VERIFIED (run once, §54): social-composer 36/36 (new) · social-final 184 · social-4-4a-truth 126 · s6-motion 55 · s3-moments 17 · circle 132 · s7-device-mastery 56 · person-life-identity 47 · my-world-2030 27 · s2-person-world 47 · social-2030 31 · complete-my-world 62 · social-s1-trust 24 · tsc 0 · eslint 0 · next build ✓ · catalogs 429×8 · zero hydration/console errors on /world and /life (an environmental V8 Math.cos drift in LifeRing was found, proven pre-existing, and fixed with 1e-4px rounding).


## Phase UC-G — Universal Social Post Composer GREENFIELD (owner master prompt · 2026-09-29)
STATUS: COMPLETE — supersedes Phase UC. Old Composer deleted; new module social/composer/.
VERIFIED: social-composer 67/67 (rewritten to the §47 matrix) · social-4-4a-truth 125 · social-final 194 · s6-motion 55 · s3-moments 17 · social-shell PASS · s3-s4-loops PASS · final-app PASS · circle 132 · s7-device-mastery 56 · complete-my-world 62 · s2-person-world PASS · one-application PASS · social-2030-final PASS · social-s1-trust 24 · person-life-identity PASS · social-s5-moment 15 · tsc 0 · eslint 0 errors · next build ✓ · catalogs 525×8 · ru 320 fits.
Records: AGENTS.md "Phase UC-G"; handover references/social-composer/UNIVERSAL-SOCIAL-COMPOSER-GREENFIELD-HANDOVER.md.


## Phase UC-C — Universal Composer CANONICAL WORKBOOK PASS (owner master prompt · 2026-09-29)
STATUS: COMPLETE — builds on UC-G. Sources: ALL 50 sheets of `references/8 Task details.xlsx`
read in authority order; field contract at
references/social-composer/CANONICAL-COMPOSER-FIELD-CONTRACT.md; completion report at
references/social-composer/UNIVERSAL-SOCIAL-COMPOSER-CANONICAL-HANDOVER.md (incl. the §111
adversarial audit — all 18 questions answered, two closed with live probes: exact-route
privacy, ru-360 layout). Built: §18 time precision (month/year/approximate/unknown ⇒
UNPLACED), §17 place precision, §12 cover, canonical depth labels, Life-Moment Story+Chapter,
Meal canonical 8 contexts + custom occasion + depth + structured MealFoodItems (Advanced),
Activity per-subtype adaptive More fields, Health 17 canonical types + type-adaptive
capture + §22 shared-vs-private grouping, Problem urgency/attempt/next-action, Project
status default + target. 74 new i18n keys ×8 (601/catalog, key-complete; ctxDelivery
retired). Records: AGENTS.md "Phase UC-C". Not committed, not pushed (standing owner rule);
no screenshots generated (owner performs the review).
VERIFIED (one final run): social-composer-canonical 59/59 (new) · social-composer 67 ·
social-4-4a-truth 125 · social-final 194 · s3-moments 17 · s6-motion 55 · circle 132 ·
s3-s4-loops 14 · social-shell 68 · final-app 31 · i18n 45 · person-life-identity PASS ·
complete-my-world 62 · s7-device-mastery 56 · one-application 40 · my-world-2030 PASS ·
social-connection-final PASS · social-2030 PASS · social-2030-final PASS · s2-person-world 47 ·
locale-resolution PASS · s4-people 20 · s5-discovery 48 · social-s1-trust 24 ·
social-s2-respond 29 · social-s3-people 14 · social-s4-signal 13 · social-s5-moment 15 ·
social-s6-safety 8 · social-s7-polish 8 · social-4-4a1-p06 599 · social-r2 43 · r3 80 ·
r3.1 69 · r3.2 92 · r3.3 102 · r3.5 20 · r3.6 21 · r3.7 37 · r3.8 34 · r3.9 31 ·
devanagari crops PASS (0 page errors) · celestial-s0 64 · celestial-s2-field 40 ·
celestial-s3-s6 32 · celestial-s7-constellation 114 · gate-desktop/mobile/fallback PASS ·
identity-model 13 · tsc 0 · eslint 0 errors · next build ✓.
Supersessions (recorded in AGENTS.md, invariants unchanged): social-composer.js +
social-final.js Health types 4 → the canonical 17.


## Phase UC-C3 — Final UX / Media / Smart Assist / Canonical Field Convergence (owner master prompt · 2026-09-29)
STATUS: COMPLETE — interaction-layer redesign over the UC-C canonical data model (no
rebuild). Compact default composer; the record classification moves into a focused
chooser sheet that collapses to one smart pill; real People/Place pickers replace the
comma-separated name field and bare text input; media becomes reusable asset references
with a real device Upload/Camera, a My Media library (multi-select, mixed photos+videos,
reuse never duplication) and a Media organizer (cover/reorder/remove≠delete); every
domain's More-details field is contextual or an addable "+ Field" chip instead of an
always-visible matrix; Health's depth is named "Private health details"; a new Smart
Assist layer (composer/smart-assist.ts) offers one quiet, dismissible, capability-gated
suggestion with a real global on/off — every composer function works identically with it
off. New `CANONICAL-COMPOSER-FIELD-CONTRACT.md` "presentation classification" section
records HOW each canonical field now reaches the screen without changing any field's
tier/status. Full handover: the "UC-C3" section appended to
references/social-composer/UNIVERSAL-SOCIAL-COMPOSER-CANONICAL-HANDOVER.md. Records:
AGENTS.md "Phase UC-C3". Not committed, not pushed (standing owner rule); no screenshots
generated (owner performs the visual review).
VERIFIED (one final run): social-composer 112/112 (rewritten to §71–§84) ·
social-composer-canonical 62/62 (re-pointed wiring) · social-4-4a-truth 125/125 ·
s6-motion 55/55 · s3-moments 17/17 · social-final 194/194 · social-shell 68 ·
s3-s4-loops 14 · final-app 31 · circle 132 · complete-my-world 62 · s7-device-mastery 56 ·
i18n 45 · s2-person-world 47 · person-life-identity 47 · one-application 40 ·
my-world-2030 27 · social-connection-final 45 · social-2030 31 · social-2030-final 35 ·
locale-resolution 21 · s4-people 20 · s5-discovery 48 · social-s1-trust 24 ·
social-s2-respond 29 · social-s3-people 14 · social-s4-signal 13 · social-s5-moment 15 ·
social-s6-safety 8 · social-s7-polish 8 · social-4-4a1-p06 599 · social-r2 43 · r3 80 ·
r3.1 69 · r3.2 92 · r3.3 102 · r3.5 20 · r3.6 21 · r3.7 37 · r3.8 34 · r3.9 31 ·
devanagari crops PASS · celestial-s0 64 · celestial-s2-field 40 · celestial-s3-s6 32 ·
celestial-s7-constellation 114 · gate-desktop/mobile/fallback PASS · identity-model 13 ·
tsc 0 · eslint 0 errors · next build ✓.
Supersessions (recorded in AGENTS.md "UC-C3", invariants unchanged): s6-motion.js §5
(action-word casing + record-row size ≤36px → ≥44px readable rows); social-final.js
§10/§14 (media tabs → sources sheet/My Media/organizer; discard wording → "Keep this
draft?"/Continue editing; date input → the When control); social-4-4a-truth.js §5 (A10
restated for the mixed-media gallery model); s3-moments.js §3–§5 (probe hooks moved to
[data-sb-when-value]/[data-sb-kind-label]).


## Phase UC-C4 — Zero-Effort Capture (owner-directed rule · 2026-09-29)
STATUS: COMPLETE. Audited the composer against the pasted non-negotiable rule ("can
SYSTEMBOOM know or suggest this without making the user type it?", in priority order:
trusted existing Human Record → original media metadata → device data → the person's own
text → AI suggestion → manual entry, the fallback). Two genuine gaps found and fixed:
(1) EXIF date/place now PREFILLS immediately on attach instead of blocking POST until an
explicit Use/Ignore click (superseding my own earlier interpretation of the review gate —
the UC-C3 brief's own §20 already said not to force this confirmation); "Not this" cleanly
reverts exactly what was auto-filled. (2) People/Place "Recent" and Activity's common-four
now derive from the viewer's OWN real posted history (excluding Health/Problem for
privacy) instead of a static fixture-order slice, with a byte-identical fallback when
there's no history yet. Also fixed in passing: the Meal-occasion Smart Assist suggestion
now shows a localized label ("Dinner") instead of a raw enum ("dinner"). New file:
composer/recall.ts. Records: AGENTS.md "Phase UC-C4". Not committed, not pushed; no
screenshots generated.
VERIFIED: social-composer 120/120 (new §13 "Zero-effort capture", 8 checks; former §13
Mobile/A11y/L10n renamed §14) · social-composer-canonical 62/62 · social-4-4a-truth
125/125 · social-final 194/194 · s6-motion 55/55 · s3-moments 17/17 · tsc 0 · eslint 0
errors · next build ✓.

## Phase UC-C4.1 — Metadata Truth + Social Disclosure Hardening (owner-directed · 2026-09-29)
STATUS: COMPLETE. Correction to two UC-C4 semantics: (1) "cleanly reverts exactly what was
auto-filled" above meant, mechanically, a fragile value comparison — reworked into an exact
pre-autofill snapshot (`MetaSnapshot`) taken the instant autofill changes anything, so "Not
this" restores precisely what preceded it (an already-unknown time, an already-approximate
date, an already-set place are never touched by autofill to begin with, and stay untouched).
(2) UC-C4 did not address Social disclosure at all: a metadata-derived Place now quietly
enriches the Human Record/composer (zero-effort, visible immediately, no click) but is
withheld from the posted Social projection until the person deliberately confirms it (typing,
picking, choosing a precision, or "Use") — private record context never silently becomes
social disclosure. New `UDraft.placeConfirmed`. Records: AGENTS.md "Phase UC-C4.1". Files
touched: composer/types.ts, composer/UniversalComposer.tsx only — recall.ts, domains.tsx,
submit.ts's buildSubmission, data.ts's Moment type, Moment.tsx and Circle untouched. Not
committed, not pushed; no screenshots generated.
VERIFIED: social-composer 129/129 (was 120 — §13's two affected checks corrected in place,
9 new regression checks added: an explicit "I don't know" and an already-approximate date
survive a later dated photo; an already-typed place survives a later photo's different
metadata place, including a SECOND later metadata event; postedAt stays independent of a
rejected metadata timestamp; "Use" is shown as the genuine confirmation path) · tsc 0 ·
eslint(composer) 0 · next build ✓. The wider 40+ suite fleet was intentionally not re-run
(no shared primitive beyond the composer's own `UDraft` was touched).
