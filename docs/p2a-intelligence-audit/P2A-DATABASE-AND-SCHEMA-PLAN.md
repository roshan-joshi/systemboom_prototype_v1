# P2-A — Database and Schema Plan

**No database, schema, table or migration was created.** This is a plan to be reviewed at Gate C.

## 1. Readiness

| Question | Finding |
|---|---|
| Existing DB client / ORM / migrations | None (VERIFIED-CODE). |
| Canonical users / media / Human Records | Not present in this repo; the production system is stated (brief, Blueprint) to use PostgreSQL but its schema, ID formats and ORM are **not supplied**. |
| Local PostgreSQL | v16.14 running on `/tmp:5432`; `pgcrypto` present (so `gen_random_uuid()` works); **pgvector not installed** (VERIFIED by directory listing; not connected). |
| Schema conventions to follow | Unknown. Needs production developer input (naming, tenant column, soft-delete, timestamps, migration tool). |

## 2. Is a dedicated `heim` schema appropriate? — Yes

Recommendation: **a `heim` schema inside a dedicated local database** (`systemboom_intelligence_dev`), never the production DB, never a table in another schema.
* Matches Blueprint §12 and V1.2 (provenance tables already live in `heim.*`).
* Keeps derived intelligence separately revocable, exportable, deletable and RLS-scoped from canonical records.
* Lets production developers lift the whole schema or map it onto theirs.
* Local-only 2-database-split is a prototype convenience: cross-database FKs are impossible, so **references to canonical ids are stored as opaque keys plus a bridge table, not as FKs** (see §4). In production the same columns can become real FKs.

## 3. The no-duplication rule

HEIM stores: derived observations, decisions, feedback, graph, provenance, cache metadata, content hashes and *references* to media. It does **not** store: media bytes, canonical asset rows, Human Records, users, posts. Fingerprint + representation metadata are allowed (needed for cache keys); the file itself stays in authorized object storage.

## 4. ID bridge (BLOCKING owner decision D2)

The prototype has no canonical ids (audit §3). Proposed local approach, labelled as a bridge per V1.2 §21:

```
heim.id_bridge (
  bridge_id uuid pk, kind text check in ('principal','asset','record'),
  prototype_id text not null,        -- 'u-demo-001', 'up-3-IMG1234', 'm-new-…'
  canonical_id text,                 -- NULL until a canonical system exists
  created_at timestamptz, unique(kind, prototype_id)
)
```
All other `heim.*` tables reference `bridge_id` or the canonical uuid column with `owner_scope_id`. Prototype upload ids are **not** acceptable as keys (counter resets per page load; contain filename fragments) — the registry must issue a stable asset id at ingestion. Who issues it (the intelligence layer or a stand-in media registry) is Decision D2.

## 5. Proposed `heim` relations (names to be finalised after owner review)

From Blueprint §12 + V1.2 provenance, with audit-driven additions:

| Table | Purpose | Notes |
|---|---|---|
| `id_bridge` | prototype↔canonical ids | local only |
| `media_fingerprints` | asset ref → SHA-256, mime, size, representation/preprocessing version, lineage parent | **content hash is the cache anchor**; perceptual hash optional later |
| `ai_providers`, `ai_models`, `ai_pricing_versions`, `ai_invocations`, `ai_artifact_provenance` | provider provenance ledger | from `SIE_PROVIDER_PROVENANCE_REFERENCE.sql`, with fixes in §6 |
| `observation_runs` | one row per analysis attempt incl. failures | status, invocation fk |
| `observations` (+ `evidence_items`) | validated Pass 1 JSONB + schema version | `UniversalVisualObservationV1` as JSONB; indexed columns for key fields only |
| `observation_cache` | compatibility key → observation id, lease/expiry | single-flight (see cache doc) |
| `category_decisions` | versioned Pass 2 result + policy decision + why | references observation ids; never overwritten |
| `correction_events` | append-only feedback ledger | idempotency key = (actor, decision id, client action id) |
| `personal_preference_projection` | bounded, scoped, recomputable view | derived, rebuildable |
| `concept_nodes`, `concept_edges`, `knowledge_releases` | reviewed graph | see KG doc |
| `media_event_links` | possible/confirmed links | hypotheses only until confirmed |
| `consent_policies` | per-purpose consent | analyze / extract GPS / suggest place / share place / aggregate learning |
| `embeddings` | **deferred**, requires pgvector | gated by measured benefit (SIE-046) |
| `evaluation_cases` | golden corpus + frozen replay | for SIE-042/077 |
| `cache_access_events` | **missing from reference SQL, required by V1.2** | see §6 |

## 6. Reconciliation of `SIE_PROVIDER_PROVENANCE_REFERENCE.sql` (VERIFIED-DOC)

The reference SQL is the only HEIM-family SQL supplied. Findings:

1. **Cache-hit events have no home.** V1.2 says a cache hit produces a *cache-access event* linked to the original artifact and *must not impersonate a new invocation*; `ai_invocations.status` allows only `started|succeeded|failed|cancelled|unknown`. → add `heim.cache_access_events(id, owner_scope_id, observation_id, requested_at, requester_context)`.
2. `ai_models UNIQUE(provider_id, configured_model_key, published_revision)` — PostgreSQL treats NULLs as distinct, so the very common "revision unknown" row can be inserted repeatedly. → `UNIQUE NULLS NOT DISTINCT` (PG15+; local is 16) or a partial unique index.
3. `ai_artifact_provenance.artifact_id` is a polymorphic uuid with no FK. Acceptable for a ledger, but then deletion of an observation must be a documented cascade (retention/ deletion policy D5) and an orphan-check test is required.
4. `owner_scope_id uuid NOT NULL` on every table is correct in intent but **cannot be satisfied today** (no principal); reference SQL itself notes RLS/auth must be designed. → blocked by D2.
5. No per-invocation **trace id foreign key to requests**, only `request_trace_id text`; fine for local, but SIE-004 requires the id carry across upload→vision→cache→classifier→specialist: add a `heim.requests` row or make the column indexed and tested.
6. `estimated_cost_usd` + `pricing_version_id` present; **no `actual_cost` field** although the brief asks for "estimated and actual cost when available". Add nullable `billed_cost_usd` plus `cost_source` (`provider_reported|estimated|unknown`).
7. `observed_*` fields exist with `observed_model_verifiable`; good. No column for **normalized finish reason / truncation** (the repo already hit `finish_reason: length` on the thinking model — AGENTS.md). Add `finish_reason`.
8. No `requested_*` for **provider routing/fallback** (e.g. fallback used). Add `fallback_of_invocation_id`.
9. Missing HEIM reference SQL (`heim_schema.sql`) and TypeScript contracts: **cannot reconcile names/ownership** (Blueprint §12 requires it). Blocker B1.

## 7. Authorization at the database

* Every table carries `owner_scope_id`; Row-Level Security policy `owner_scope_id = current_setting('app.owner_scope')::uuid`, set by the gateway per request (defence in depth with application checks).
* Local PostgreSQL parity: RLS and pgvector must be tested on PostgreSQL 16; SQLite is explicitly insufficient (Blueprint §24).
* Public/anonymous roles get **no** privileges on `heim.*`.

## 8. Migration strategy (proposal; not executed)

* A forward-only, reversible migration set under `db/heim/migrations/NNN_*.sql` plus a documented rollback (SIE-078). Tool choice (plain SQL runner vs a library) is for the production developers; adding any package is a P2-B1 approval item — no package was installed in P2-A.
* Migrations run only against the dev database named in an env var that refuses to start if the database name does not contain `_dev` (guard against touching production).
* Order: provenance ledger → fingerprints/observations/cache → decisions/feedback → graph → (later) embeddings.

## 9. Integrating without duplicating canonical data

1. Canonical ids stay authoritative. Until they exist locally, `id_bridge` is the only mapping and is clearly labelled prototype.
2. HEIM never exposes a read of media bytes.
3. A Human Record may link to many assets and an asset to many records; links live in `media_event_links`, never as a column on a canonical table.
4. Record-depth intelligence that today sits inside `Moment.fields` (`visualObservation`, `mealAIObservation`, …) becomes a **reference** to HEIM rows in the production port; the in-memory prototype keeps the embedded copy until B2.
