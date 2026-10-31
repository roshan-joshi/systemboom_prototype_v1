# P2-A — Requirements and Test Reconciliation

Sources reconciled: Blueprint V1.2 text · `SIE_REQUIREMENTS_REGISTER_V1.2.csv` (92) · `SIE_ACCEPTANCE_TEST_REGISTER_V1.2.csv` (102) · `AGENTS.md` P1 records (UHI-DEC-014/-017, UHI-UX-134, V0.4 P1, SOCIAL-4/V3) · existing P1 suites.
**Not reconcilable (documents absent):** UHI V0.4 specification, HEIM P2 reference SQL/TS contracts. Nothing was invented to fill them; gaps are listed in §6. No requirement has been removed or relabelled as passed.

## 1. Register integrity (computed from the CSVs)

* 92 requirements, 102 tests; every requirement has ≥1 test and no test points at a missing requirement. 10 requirements have 2 tests (SIE-001, -011, -023, -027, -037, -046, -053, -056, -067, -078).
* All 92 requirements are `SPECIFIED / NOT VERIFIED`; all 102 tests `NOT RUN`. Priorities: 82 P1, 10 P0 (the 10 PROV requirements).
* Components: HEIM 22 · UHI 16 · CMI 14 · GATEWAY 10 · PRIVACY 10 · PROV 10 · QUALITY 10.
* **IDs are not contiguous:** SIE-001…082 then SIE-083, 085, 087 … 101 (odd only) for PROV; IDs SIE-084, -086, … are unused. Harmless but should be stated so nobody assumes missing rows.
* **The V1.1 "generic fixtures" defect is not fully fixed in V1.2:** 82 of 102 tests share an identical *Fixture / setup* string ("Given an authorized local test user, controlled image/media/record fixture, and prerequisite application state") and the *Action* column repeats the requirement text; the *Expected* column has two boilerplate variants (48 + 34 of 82). Only the 10 PROV tests have specific fixtures. Blueprint §21 says V1.1 "supersedes" the generic V1.0 registers, but the V1.2 test register is still largely a requirement-restating template. **It is not yet a developer acceptance baseline** (each test needs a named fixture, exact fields and an explicit assertion).
* Phase/Gate values are multi-valued strings (`P2-B2/B3/B4/B5`, `P1/P2-B5`) — not machine-filterable; split into one phase per row when imported.

## 2. Requirement status against the repository

Legend: **P** present in code (developer-reported tested) · **Part** partial · **A** absent · **C** contradicted/at risk · **n/a** non-code.

| Req IDs | Topic | Repo status | Evidence / note |
|---|---|---|---|
| SIE-001, 002 | server authn/authz | **A** | no server session; routes unauthenticated |
| SIE-003 | versioned discover/enrich/reuse API | **A** | three provider-specific routes |
| SIE-004 | stable trace ids | **A** | none |
| SIE-005 | explicit vs AI selection | **Part** | `IntentSource` client-side |
| SIE-006 | stale responses can't change user choices | **P** | per-(kind,asset) keys, UHI-UX-134 (reported) |
| SIE-007 | bounded sizes/limits | **A** | none found (search) |
| SIE-008 | Social vs Circle behaviours | **Part** | UI-level; provider call still made in direct entry |
| SIE-009 | output schemas + redact at public boundary | **Part/C** | deny-list incomplete (privacy P1) |
| SIE-010 | specialist adapters keep record model | **P** | existing routes |
| SIE-011 | one canonical asset id | **A** | per-session ids |
| SIE-012 | SHA-256 + versions | **A** | no hash |
| SIE-013 | capture time + tz + precision | **Part** | `capturedAt` read; timezone handling NOT VERIFIED |
| SIE-014 | GPS only when enabled; place confirmation separate | **Part/C** | place defaults without confirmation (P4) |
| SIE-015 | persist category-neutral objects… | **Part** | contract exists; not persisted |
| SIE-016 | validate against versioned schema | **P** | `normalizeVision`, validator |
| SIE-017 | evidence origin | **Part** | `evidenceStrength`, `source` |
| SIE-018 | per-asset identity in multi-image | **P** | per-asset maps (client) |
| SIE-019 | manual path when provider down | **P** | reported |
| SIE-020 | bounded video frames, no whole-video claim | **Part** | ≤5 keyframes; coverage not recorded on observation |
| SIE-021 | OCR/children/health private | **Part/C** | P1, P3 |
| SIE-022 | no identity inference | **P** | prompts/limitations ("faces not identified") |
| SIE-023 | metadata internal until user chooses | **C** | contradicted by UC-C4.2 default (D3) |
| SIE-024 | reuse interface for all worlds | **A** | |
| SIE-025–030 | persistence, cache key, hit w/o provider, incompatible handling, single-flight, error≠valid | **A** | no persistence/cache |
| SIE-031 | reuse observation, recompute decision | **Part** | classifier deterministic over scores; no stored observation |
| SIE-032–037 | correction ledger, idempotency, scope, no global learning | **A** | |
| SIE-036 | birthday correction ≠ all cakes | **A** (design only) | |
| SIE-038–042 | graph, versions, replay | **Part** | static 22-rule KB only |
| SIE-043 | cache hit-rate measurement | **A** | |
| SIE-044 | tenant isolation | **A** | |
| SIE-045 | retention | **A** | |
| SIE-046 | optional embeddings | **A** (correctly deferred) | pgvector not installed |
| SIE-047–059, 061, 062 | seven-category, auto-select gates, Life Moment vs no-match, incidental demotion, birthday, plain food, construction, override, no restore, multi-image conflict, Health, alternatives, no auto publish, existing specialists | **P** | developer-reported; synthetic fixtures + a few live images; owner acceptance **PENDING** |
| SIE-056 | direct-entry bypass | **Part** | see SIE-008 |
| SIE-060 | correction memory informs ambiguous cases | **A** | |
| SIE-063, 064 | default private raw observations; server projection | **Part/C** | client deny-list |
| SIE-065 | separate permission for metadata | **A** | |
| SIE-066 | scope reads to authenticated principal | **A** | |
| SIE-067 | no implicit global learning | **n/a** (nothing learns) | |
| SIE-068 | deletion/retention | **A** | |
| SIE-069 | no sensitive images/OCR in logs | **C** | P3 |
| SIE-070 | adversarial id guessing | **A** | |
| SIE-071 | review future feed APIs | **n/a** | recorded contract |
| SIE-072 | provider data-handling inventory | **A** | |
| SIE-073 | track exact phase | **Part** | `AGENTS.md` ledger |
| SIE-074 | mock + real image runs for seven categories | **Part** | mocks all seven; real images limited |
| SIE-075 | bypass across seven + racing responses | **Part** | race tests exist for classes; direct-entry only UI-level |
| SIE-076 | mobile widths incl. 375 | **P** | emulation only; physical device NOT RUN |
| SIE-077 | benchmark on owner-approved samples | **A** | no corpus |
| SIE-078 | rollback/migration gating | **A** | |
| SIE-079 | p50/p95 | **A** | |
| SIE-080 | every req has tests | **P (registers)** | tests NOT RUN |
| SIE-081 | mock ≠ live proof | **P (practice)** | `AGENTS.md` separates |
| SIE-082 | block launch on unauthorized access | **n/a** | gate |
| SIE-083…101 (PROV) | provider registry, model registry, invocation ledger, artifact linkage, usage, normalization, retention of old artifacts, no raw logging, lineage honesty, export of migrations | **A** except SIE-093 **Part** (normalizers exist but are provider-shaped), SIE-091 **Part** (usage logged not stored) | |

## 3. Duplications between sources
* Blueprint §10 "separate values" (observation quality, experience support, category suitability, calibrated reliability, user intent, eligibility) duplicates what `classify.ts` + policy already separate partially (scores, subject support, ambiguity). Keep one vocabulary: the repo's `subjectSupport`, `SUGGEST_FLOOR`, `AMBIGUITY_BAND` map onto the blueprint's "suitability / eligibility / calibration".
* SIE-009 / SIE-064 / SIE-071 overlap (public serialization) — merge into one gateway requirement with three tests.
* SIE-027 / SIE-043 / SIE-079 overlap (cache effect measurement).

## 4. Contradictions and conflicts
1. **C-1 Blueprint vs UC-C4.2** on metadata-derived place (SIE-014/023/065 vs an accepted owner-directed default). Needs an owner ruling (D3).
2. **C-2 Blueprint V1.2 §5/§13 `SelectionSource {default|ai|user|direct_entry}` vs repo `IntentSource {default|user|media|ai}` + `origin`.** Map, don't duplicate (Blueprint §13 forbids duplicate enums).
3. **C-3 `life_moment` (blueprint) vs `moment` (repo kind id).** Map at the gateway.
4. **C-4 Blueprint says P1 "owner tested birthday, construction, override and ambiguous cake"; `AGENTS.md` says owner acceptance is PENDING for all.** Treat as unverified until the owner confirms.
5. **C-5 SIE-056 (bypass the classifier) vs one combined provider call today.** Compatible only when Pass 1 and Pass 2 are separated (central architecture doc).
6. **C-6 Blueprint §22 "Do not send the same bytes twice (Vision + classifier)" vs the repo's second image send for Project/Problem/Meeting/Health specialists** (cost doc §5.4) — a design tension, resolvable by measurement.
7. **C-7 `ai_invocations.status` has no cache-hit state vs V1.2 "cache hits produce a cache-access event"** — schema gap (database doc §6).
8. **C-8 Blueprint labels:** V1.2 content under "V1.1" headers; duplicate section numbers 21/22.

## 5. Missing tests (beyond the 102 registered)
* Gateway **mode/category validation matrix** (ENRICH must reject a category decision; DISCOVER rejects non-user `selectedCategory`).
* **Provider-switch parity**: identical schema output across DeepSeek/mock/second adapter for the same fixture.
* **Concurrent identical upload** fault-injection (lease expiry, crash between response and persist).
* **Privacy regression oracle**: every `KindFields` key classified public/private, test fails when a new key is added unclassified.
* **Log scrubbing** test (inject parse failure; assert no OCR in logs).
* **Consent revocation** end-to-end (stops processing, triggers deletion).
* **Deletion completeness** (observations, cache, preferences, provenance orphans).
* **Bridge-id stability** (prototype↔canonical mapping across reloads).
* **Real-photograph golden corpus** per category (including negative: empty chair, whiteboard not Meeting).
* Physical-device mobile check (currently NOT RUN).

## 6. Missing implementation detail / unverified assumptions
* HEIM names/ownership vs the missing `heim_schema.sql`/`heim_contracts.ts` (blocker B1).
* Production PostgreSQL schema conventions, ID formats, ORM, tenant column — **unknown**.
* Whether pgvector can be installed locally (not present) and whether production permits it — **unknown**.
* Timezone handling in captured-time extraction — NOT VERIFIED.
* Provider token-usage semantics for image inputs on DeepSeek — NOT VERIFIED; do not assume parity with other vendors (V1.2).
* DeepSeek's `detail: "high"` effect — documented in `AGENTS.md` as unverified.
* Provider data-handling/retention terms (SIE-072/R-07) — not inventoried.

## 7. Phase dependencies
`identity/authorization (D2) → media registry + SHA-256 → provenance ledger → observation store/cache → decisions → correction ledger → graph → classifier integration → hardening`. Privacy fixes P1–P3 are prerequisites to B2, not part of it.
