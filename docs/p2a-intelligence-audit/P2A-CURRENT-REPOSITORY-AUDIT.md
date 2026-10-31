# P2-A — Current Repository Audit

Evidence legend: VERIFIED-CODE · VERIFIED-DOC · DEVELOPER-REPORTED · NOT VERIFIED (see START-HERE).
Test counts below are **developer-reported** from `AGENTS.md`; the fleet was not re-run in this read-only phase.

## 1. Summary

The repository is a **Next.js prototype** (App Router). The intelligence layer is real code, but it is **client-orchestrated, stateless on the server, and unauthenticated**. There is no database, no ORM, no migration tool, no server session. State lives in React (`UniversalComposer`), the in-memory `SocialStore`, and `localStorage` (identity, theme, locale, Smart Assist switch).

| Area | Actual state |
|---|---|
| Persistence | None. `package.json` has no `pg`, Prisma, Drizzle, Supabase or SQLite dependency; no `src` file imports one. (VERIFIED-CODE) |
| `localStorage` users | identity (`src/lib/identity/store.ts`), Smart Assist switch (`composer/smart-assist.ts`), theme, locale, Celestial flags, intent. No intelligence data is stored there. (VERIFIED-CODE) |
| Server routes | `/api/analyze-meal`, `analyze-activity`, `analyze-record`, `food-facts`, `food-facts-packaged`, `geocode`. No auth check, no session lookup. (VERIFIED-CODE) |
| Identity | `PrototypeIdentity` (`src/lib/identity/types.ts`): `id` such as `u-demo-001`, client-held. No server principal. (VERIFIED-CODE) |
| Local Postgres | The machine has PostgreSQL 16.14 (Homebrew) **accepting connections on `/tmp:5432`**; `pgcrypto` extension files present; **pgvector is NOT installed**. Not connected to, not queried. (VERIFIED by `pg_isready` and an extension-directory listing only) |
| Secrets | `DEEPSEEK_API_KEY`, `USDA_FDC_API_KEY` server-only; `.env.local` is git-ignored. Controlled-marker leak test reported clean. (DEVELOPER-REPORTED) |

## 2. The P1 implementation, as it actually exists

### 2.1 Pass 1 — category-neutral vision (CMI-shaped)
* `src/lib/ai/vision/universal-visual-observation.ts` — `UniversalVisualObservationV1` (`schemaVersion: 1`, `assetId`, `analyzedAt`, `provider`, objects, scene, actions, text with `legible`, `primarySubject`, `limitations`). `normalizeVision` treats provider output as untrusted. **No category field** — matches Blueprint §4 "Pass 1 remains category-neutral". (VERIFIED-CODE)
* It rides on the **existing `/api/analyze-meal` call** (`route.ts` prompt lines ~77–111), not a dedicated vision service. The Meal reading, `isFood`, the additive `activity` key and the vision block are one provider round-trip. (VERIFIED-CODE)
* DeepSeek via the OpenAI SDK, `baseURL https://api.deepseek.com`, model constant `deepseek-flash`, `max_tokens: 4000`, `thinking: disabled` (best-effort; reasoning tokens still reported). The client is constructed **separately inside each of the three routes**. (VERIFIED-CODE: `analyze-meal/route.ts:723`)

### 2.2 Seven-category classifier (UHI-shaped, deterministic)
* `src/lib/ai/vision/classify.ts` (193 lines) — model's own seven scores lead; Knowledge-Base rule boosts capped by `KB_LIFT_CEILING`; `subjectSupport` (UHI-DEC-014) holds a category below the lead band when its subject is absent; `INCIDENTAL_CEILING` 0.44 < `SUGGEST_FLOOR` 0.45; `AMBIGUITY_BAND` makes a close lead "likely". Output `schemaVersion: 1`. (VERIFIED-CODE, header + AGENTS.md)
* Thresholds (0.45 / 0.3 / 0.75 etc.) are **hand-set constants**, not calibrated. Blueprint §10/§23 already states they must be provisional until a benchmark exists. There is **no labeled benchmark** in the repository. (VERIFIED-CODE / absence)
* `classifier-rules.js` (23, pure Node) asserts the executable code contains no example-specific words. (DEVELOPER-REPORTED)

### 2.3 Intelligent Automatic Category Selection (UHI-DEC-017)
In `composer/UniversalComposer.tsx`: auto-select only when vision succeeded, primary is its own supported subject, confidence settled, not `noMatch`, no conflict among photos, no human choice, no direct entry, not editing, Smart Assist on. **Health is never auto-selected.** `autoByVision` records which kind SYSTEMBOOM chose; `intentSource` (`default | user | media | ai`) is the authority model. Decision reconciled from the whole readings map (a real race was fixed). (VERIFIED-DOC + partial VERIFIED-CODE)

### 2.4 Human-authority protections
* `IntentSource` + `origin: "circle"` ⇒ user and direct entry outrank AI; per-`(kind, asset)` reading keys prevent a late response from returning to a left-behind category (UHI-UX-134). (DEVELOPER-REPORTED, tested in `vision-intelligence.js` VIS-P1-019)
* V2 field contract (`composer/field-contract.ts`, 24 pure-Node tests): `suggest / supersede / edit / confirmFields`; user-owned cells never overwritten. (DEVELOPER-REPORTED)

### 2.5 Specialist intelligence
* Meal (+USDA/OFF), Activity: separate routes. Project / Problem / Meeting / Health: `/api/analyze-record` with personas in `src/lib/ai/specialists/**`, reasoning policy (`reasoning-policy.ts`), validator (`observation-validator.ts`), 22-rule static Knowledge Base (`src/lib/ai/knowledge/**`), Universal Observation Contract (`universal-observation.ts`: `EvidenceStrength`, `requiresConfirmation`). (VERIFIED-CODE sizes; behaviour DEVELOPER-REPORTED)

### 2.6 Composer, Circle, Organizer
* Social Composer = `UniversalComposer`. Circle direct entry = `initial.origin === "circle"` → `directEntry`. The Media Organizer reads session assets only. (VERIFIED-CODE)
* **ENRICH bypass is partly UI-level.** The analysis effect's `eligible` filter (`UniversalComposer.tsx` ~860) has **no `directEntry` condition**: photos are sent to `/api/analyze-meal` on attach regardless of entry origin. The vision *card* and auto-selection are suppressed for a Circle draft, but the category-bearing provider call is still made (NOT executed in this audit; read from code). Blueprint SIE-056 requires the classifier be bypassed while observation continues. Because Pass 1 and the seven scores arrive in one call there is no extra cost today; the architecture issue appears when Pass 1 and Pass 2 are separated (see central architecture doc).

### 2.7 Public/private intelligence boundary — see `P2A-PRIVACY-AND-AUTHORIZATION.md`
`src/lib/privacy/record-intelligence.ts`: a **key deny-list** (10 `fields` keys + `recordPlace`) applied in `composeFeed` (`store.tsx:168`). It is the *only* enforcement point and it is client-side.

## 3. Identifiers and media

| Concept | Actual | Canonical? |
|---|---|---|
| Moment (post + record) | `m-new-<time36>-<rand>` generated client-side (`store.tsx:368`); fixtures `m-*` | No — prototype ids, in memory |
| Library media asset | fixture ids in `data.ts` `LIBRARY` | Fixture |
| Uploaded asset | `up-<seq>-<sanitised filename≤12>` (`media-assets.ts:99`); module-level counter, reset per page load | **No** — collides across sessions, embeds a filename fragment |
| Content hash | **None.** No SHA-256 or digest anywhere (`schemaVersion` is the only hit for "version/hash" greps) | — |
| Source metadata | `SourceMetadata { schemaVersion:1, normalized:{capturedAt, gps, device, orientation, mimeType, fileSize} }` via `exifr`; lives on the **session asset**, never on the posted Moment | Immutable by convention (`__SB_ASSET_SNAPSHOT` test) |
| Storage of bytes | Browser object URLs. No object storage. | — |
| Event/record relationships | `Moment.fields.mixedAssets`, `Moment.fields.mealAssets` (record-depth, per-asset observations), `recordPlace`. No media↔event link table. | — |

## 4. Provenance and cost data that exist today

* Observations carry `providerModel` (Meal route) / `provider` (vision) and `analyzedAt`, `schemaVersion: 1`. (VERIFIED-CODE)
* **Missing**: prompt id/version/digest, classifier version, knowledge version, policy version, preprocessing version, request trace id, requested-vs-observed model, status, latency, token counts, pricing snapshot. Token usage is `console.log`-ed (`analyze-meal/route.ts:728`, `usage` JSON) and timing in the record route; **none is stored.** (VERIFIED-CODE)
* Seven mock seams (`mockai`, `mockrecord`, `mockactivity`, `mockfacts`, `mockpackaged`, `mockwait`, `mockgeo`) are read from the request query in the routes with **no `NODE_ENV` condition** (grep of `src/app/api/*/route.ts` found no `NODE_ENV`). If the routes are ever deployed as-is, the mock paths are reachable in production. (VERIFIED-CODE by search)

## 5. Caching that exists today

Only a **client, in-component** de-duplication: `assetRunsRef` (`UniversalComposer.tsx:181`), keyed by asset id, "one call per unchanged asset". It is lost on reload, on unmount, and across tabs; it does not survive "Keep draft → resume" (re-analysis occurs; documented in `AGENTS.md`). `recRunsRef` and `actRunsRef` do the same per kind. There is **no server cache, no content-hash key, no cross-session reuse.** (VERIFIED-CODE)

## 6. Per-asset provider call count today (DEVELOPER-REPORTED + VERIFIED-CODE)

| Situation | Calls |
|---|---|
| Social, photo, no category chosen | 1 `analyze-meal` (Meal reading + Pass 1 + seven scores) |
| …then Activity selected | +1 `analyze-activity` |
| …then Project/Problem/Meeting/Health selected | +1 `analyze-record` |
| Meal selected | 0 extra (Meal reading is in call 1) + USDA/OFF lookups (non-AI) |
| Keep draft → resume | calls repeat (no persisted observation) |
| Smart Assist OFF | 0 |

## 7. Existing tests relevant to P2 (developer-reported counts)

`vision-intelligence` 131 · `record-intelligence` 96 · `classifier-rules` 23 (pure Node) · `privacy-intelligence` 19 · `meal-intelligence` 355 · `activity-intelligence` 273 · `field-contract` 24 · `social-composer` 140 · `social-4-4a-truth` 125 · `social-composer-canonical` 62 · `social-final` 194 · `media-intelligence` 14 · `i18n` 45. Two load-sensitive flakes are recorded (V3-104, V1-66). All suites use **mock seams**; live-provider evidence is a small set of logs in `prototype-evidence/social-4-records/` (synthetic scenes plus a handful of real images). Per SIE-081, mock passes are not live-provider proof.

## 8. Distinguishing actual implementation from reported status

| Claim in handoff / `AGENTS.md` | Audit finding |
|---|---|
| "Specialist AI for Project/Problem/Meeting/Health" | Code present (routes, personas, validator, KB). Behaviour not re-run. |
| "Privacy — AI observations stripped for every non-owner at the one composition boundary" | True for the 10 listed keys, **client-side only**; incomplete (see privacy doc). |
| "Persistent…" anything | Nothing is persisted. Posts are in memory. |
| "Provenance" | Partial: model/time/schema only. |
| "Owner tested birthday, construction, override, ambiguous cake" (Blueprint) | Blueprint-reported; `AGENTS.md` says owner acceptance **PENDING**. Treated as unverified. |
