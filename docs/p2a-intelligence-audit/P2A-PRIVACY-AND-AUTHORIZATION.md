# P2-A — Privacy and Authorization

Blueprint §20: privacy and authorization issues are release blockers. This audit found four in the *existing* code, none of which needs P2 to exist. They are listed first because persistence (P2-B2) will concentrate private data behind these boundaries.

Evidence legend: VERIFIED-CODE = read in this audit; none of these were exercised at runtime (read-only phase).

## 1. Findings in the current repository

### P1 — Public serializer is a deny-list and is incomplete (VERIFIED-CODE)
`src/lib/privacy/record-intelligence.ts` removes 10 `Moment.fields` keys (`visualObservation, mealAIObservation, activityAIObservation, recordAIObservation, recordProvenance, activityProvenance, mealAssets, mixedAssets, mealNutrition, foodItems`) and `Moment.recordPlace`. A key-by-key comparison of `KindFields` (78 keys) against that list shows **68 keys pass through for a non-owner**, including record-depth facts the UC pass documents as "never rendered / record-only": `privateNote, severity, bodyArea, healthType, healthDescription, medication, urgency, attempt, nextAction, story, chapter, activityName, activitySetting, cost, ingredients, experience, route, target, …`.
Today they are not *rendered* (per `AGENTS.md`, `Moment.tsx` reads none of them), and the only serving path is the in-memory feed, so no leak is user-visible in this prototype. The defect is in the **mechanism**: Blueprint §14 requires a strict **allowlist**; a future API built "like composeFeed" would serialize the 68 keys to a friend or public viewer once the owner shares such a post. *Impact:* High for Health/Problem content. *Fix class:* invert to an allowlist per record kind (P2-B1).

### P2 — `recordPrivacy` is written but never enforced (VERIFIED-CODE)
`recordPrivacy: "private"` is set by `submit.ts` for specialist kinds (lines 243/264/301) and declared in `data.ts:572`. A repository-wide search finds **no reader** (not in `store.tsx`, `view-model.ts`, search, or `canSeeMoment`). The comment-level contract "record depth is a separate axis from Social audience" therefore has no enforcement; visibility to others is governed only by the Social `privacy` audience. *Impact:* High — the guard the design relies on is decorative. *Fix class:* enforce at the gateway/serializer, with a test.

### P3 — Raw provider content written to server logs (VERIFIED-CODE)
`analyze-meal/route.ts:200–201`: on `JSON.parse` failure the route logs `"raw content was:"` plus the full provider text. That text can contain OCR transcriptions of private documents, children/health descriptions, or any text read from the image. Blueprint SIE-069/-097 forbid logging raw OCR/images. (The `analyze-record` route logs timing and policy only, deliberately.) *Fix class:* log length + finish reason only; one-line change, but belongs to an approved phase, not P2-A.

### P4 — Metadata-derived place defaults into the Social-visible place (VERIFIED-CODE + VERIFIED-DOC)
`UniversalComposer.tsx` `applyDetectedMetadata` (≈ line 379–422) sets `place`, `recordPlace` and `placeSource: "metadata"` from the asset's EXIF-derived place **without confirmation**; `AGENTS.md` UC-C4.2 records this as an owner-directed supersession of the earlier confirmation gate. Blueprint SIE-014/-023/-065 require: GPS use under a separate permission, extracted metadata internal until the user explicitly chooses a publishable place, public place a separately approved field. These two owner decisions **conflict**. Not a defect in the repo's own terms; a **specification contradiction** to resolve (Owner Decision D3). Mitigating: the geocode route receives only `lat/lon`, never the image or ids (VERIFIED-CODE `geocode/route.ts` header).

### P5 — Mock seams reachable without a build-mode guard (VERIFIED-CODE)
The routes read `?mock=` from the request; a search of `src/app/api/*/route.ts` found no `NODE_ENV` conditions. Mock paths return fixed observations. If the routes ship, an unauthenticated caller can force them. Low direct data risk, but it is a test seam in a security boundary.

### P6 — Routes are unauthenticated and unbounded (VERIFIED-CODE by absence)
No session, rate limit or size cap was found in the three provider routes (search, not exhaustive). Anyone who can reach them can spend the provider budget (cost-abuse) and send arbitrary images. SIE-001/-007.

### P7 — Dev-only globals expose raw state (DEVELOPER-REPORTED, matches code comments)
`__SB_SOCIAL_STATE`, `__SB_MEAL_ASSET_OBS`, `__SB_RECORD_*`, `__SB_ASSET_SNAPSHOT` are exposed under `NODE_ENV !== "production"`. Acceptable for dev; verify the guard in a production build at B6.

## 2. Target authorization model

1. **Gateway authenticates every request**, binds `principal` and `tenant` from the server session (never from the body), authorizes each **asset** and **record** before retrieval, analysis, classification or reuse (SIE-001/002).
2. **Database defence in depth:** RLS keyed on `owner_scope_id`; `heim.*` has no public/anonymous grants.
3. **Purpose-scoped consent** (separate toggles, Blueprint §14): analyze media · extract GPS · suggest private place · attach/share a chosen Social place · contribute to aggregate learning. Revocation stops future processing and starts retention/deletion where applicable. Children's and medical content: stricter defaults and diagnostics.
4. **Private / family-shared / global knowledge scopes never inherit permissions implicitly.**

## 3. Protection plan by data class

| Data | Risk | Plan |
|---|---|---|
| Children's images | exposure, misuse, learning | strongest scope; excluded from correction learning and any aggregate use without explicit consent; diagnostics redacted; no face identification |
| Health information (incl. lab/hospital OCR) | diagnosis inference, leakage | Health never auto-selected (exists); no diagnosis edges; record-depth only; OCR encrypted; gateway allowlist excludes Health intelligence for non-owners |
| Private OCR | leakage via logs / cache / public API | never logged (fix P3); encrypted at rest; retention class; excluded from public projection |
| GPS metadata | location disclosure | stored as private source metadata with separate permission; place sharing is a distinct approved field; resolve P4 via D3 |
| Personal correction history | profiling | owner-only, reviewable, exportable, deletable; never global (correction doc) |
| Embeddings | re-identification via similarity | deferred; when added: scoped, model-versioned, deletable with the observation; no cross-user ANN |
| Internal AI observations | leak via feed/search/API | allowlist serializer at the gateway; `containsPrivateIntelligence` kept as a test oracle |
| Public Social content | over-reach of "shared media implies shared intelligence" | media sharing ≠ intelligence sharing; the observation of a shared photo stays private to the owner |

## 4. Public output rule
The **only** exit for a post to a non-owner is a gateway allowlist per record kind (positive list of fields). The existing deny-list function is retained as a regression oracle, not as the mechanism. Hiding a key in the UI is not sufficient (Blueprint §14).

## 5. Tests required before B2 is accepted
Cross-user observation read denied; asset-id guessing denied (SIE-070); public payload contains none of the 68 record-depth keys and no intelligence; `recordPrivacy` enforced; logs contain no OCR (grep over server log in a failure injection); consent revocation stops processing; deletion removes observations, cache, embeddings, projections and orphan provenance links.
