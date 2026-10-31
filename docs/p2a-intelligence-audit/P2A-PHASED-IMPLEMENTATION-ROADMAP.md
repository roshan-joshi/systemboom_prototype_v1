# P2-A — Phased Implementation Roadmap (proposal)

**Nothing below is authorized.** Each phase needs its own owner approval at the gate shown. No commit, push, deploy or production access in any phase.

## 0. Pre-conditions (before B1)

| # | Item | Owner of action |
|---|---|---|
| 0.1 | Supply HEIM `heim_schema.sql`, `heim_contracts.ts`, UHI V0.4 spec (blocker B1) | Owner/CTO |
| 0.2 | Decide D1–D6 (blocking decisions) in `P2A-OWNER-DECISIONS.md` | Owner |
| 0.3 | Approve a **P1-closure micro-phase** for privacy findings P1/P2/P3/P5 (allowlist serializer, enforce `recordPrivacy`, log scrubbing, gate mocks) — these exist today and must not be carried into persistence | Owner |
| 0.4 | Real-photograph evaluation corpus plan (consented, license-clean, per category incl. negatives) | Owner/QA |

## P2-B1 — Media identity + Gateway contracts (Gate B1: contract tests)

* New pure module `src/lib/intelligence/**` (types, runtime schemas, gateway interface, provider interfaces, mode/category validation). No behaviour change to the Composer yet.
* Stable asset id + SHA-256 at ingestion (client WebCrypto preview, server authoritative); registry stand-in with the bridge decision D2.
* `CmiProvider` / `UhiProvider` + `DeepSeekAdapter` wrapping the **existing** route logic; `MockAdapter` replacing in-route `?mock=`; prompts moved to versioned modules with digests.
* Request/response contracts mapped to repo enums (no duplicate enum).
* Tests: mode matrix, provider parity, id stability, authz stub.
* **Package changes** (e.g. `pg`, a migration runner, a zod-like validator) require explicit approval at this gate — none installed in P2-A.

## P2-B2 — Observation persistence + cache (Gate B2: replay + isolation)

* Create dev database `systemboom_intelligence_dev` and `heim` schema (after Gate C). Provenance ledger, `media_fingerprints`, `observations`, `observation_cache`, `cache_access_events`, RLS.
* Single-flight lease; hit ⇒ zero provider call; failure never cached as success.
* **Minimal vertical slice:** upload an unchanged photo, reload, attach again ⇒ same Pass 1 observation, one invocation row, one cache-access event, UI unchanged, zero second provider call. Isolation test: a second principal cannot read it.
* Composer change limited to calling the gateway and rendering `cacheStatus`.

## P2-B3 — Correction ledger (Gate B3: replay + non-overwrite)

* `category_decisions`, `correction_events`, projection; emit events from existing override hooks; idempotent retry; personal scope only; consent switch.
* Frozen-dataset replay; "birthday correction does not move plain cake".

## P2-B4 — Knowledge Graph foundation (Gate B4: reasoning + provenance)

* Concept registry, typed edges, `knowledge_releases`; import the 22-rule KB as `v0-seed`; bounded retrieval; shadow evaluation; keep TS KB as fallback.

## P2-B5 — Classifier integration (Gate B5: full regression)

* Separate Pass 1 from Pass 2 behind the gateway; Pass 2 consumes stored observation + preferences + graph; ENRICH mode truly bypasses category selection; specialists may consume stored Pass 1 where measurement shows no quality loss.
* Full P1 suite regression (vision 131, record 96, classifier-rules 23, privacy 19, meal 355, activity 273, field-contract 24, composer suites) + live-provider and real-photo evidence reported separately from mocks.

## P2-B6 — Hardening (Gate B6: independent verification + owner acceptance)

Performance (p50/p95), privacy/leak tests, retention/deletion, security review, migration + rollback rehearsal, backup/restore, physical-device mobile, dev-global guard check in a production build.

## Later (not P2): video temporal understanding, event relationships, personal agents, timeline intelligence, global learning.

## Cross-phase rules
* Failing-first tests for every new behaviour; independent verification before "PASS".
* Mock, live-provider, browser-emulation, physical-device and owner acceptance reported separately (SIE-081).
* Record every change in `AGENTS.md` (file · reason · behavioural effect · test); record superseded assertions explicitly.
* Frozen zones respected: Circle/Celestial, Phase 4 Social, V2 field contract semantics, Media Organizer layout.
