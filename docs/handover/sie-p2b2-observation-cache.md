# SIE P2-B2 · Gates 2–7 — persistent observation cache (local development only)

Companion to `sie-p2b2-provider-isolation.md` (Gate 1). Not built: correction learning (P2-B3), Knowledge Graph (P2-B4), authentication/RLS, cross-user sharing.

## 1. What is cached — and what is not

**Cached:** the validated output of the Pass 1 **category call** (`/api/analyze-meal`) for one media representation — the
category-neutral `vision` observation plus the readings the same call returns (food flag, Meal identity/components,
activity hint) and the model's own category scores. This is what the provider *saw*.

**Never cached:** the seven-category **decision**. `suggestion` is removed before storage; every hit re-runs the
deterministic classifier (`classifyCategories`) with today's rules. A person's category choice lives in the Composer and
is never read or written by the cache. A cached observation never creates or confirms a Human Record.

**Not covered (reported gap):** the Activity specialist (`/api/analyze-activity`) and the four record specialists
(`/api/analyze-record`) have different prompts and response contracts; the Pass 1 observation cannot answer them without
dropping fields they need, so they are **not cached** and still call their provider (and still go through the Gate 1
guard). Cache coverage is therefore the Pass 1 category call only — the first and most frequent call per photo.

## 2. Storage (PostgreSQL is the only source of truth)

Migration `002_observation_cache` (reversible):
* `vision_observations` + `cache_key`, `cache_key_fields` (the audited components — ids and versions only),
  `representation_sha256`, `payload` (the decision-free observation), `cacheable`, `invalidated_at`, `invalidation_reason`;
  partial index on valid, cacheable rows.
* `ai_invocations` + `cost_source` (`unknown` for real calls — tokens are recorded but no price table exists; `not_applicable` for mocks).
* `observation_cache_claims` — single-flight claims with a lease.
* `observation_cache_events` — content-free telemetry; a hit is `provider_called=false, provider_kind='none'` (enforced
  by a CHECK) and points at the ORIGINAL invocation and observation.
* view `cache_metrics` — hits, misses, bypasses, hit ratio, live vs mock provider calls, duplicates prevented, claim
  takeovers, lookup and total latency, and an upper-bound avoided-token estimate taken only from live invocations' own
  reported usage.

## 3. Compatibility key

`sha256` over a canonical JSON of: owner scope · canonical media id · SHA-256 of the exact bytes sent (all keyframes, in
order, for a video) · client preprocessing version · provider · model key · model generation · prompt id · prompt digest ·
analysis-configuration digest (model, max_tokens, response_format, thinking) · observation schema · cache policy version.
UI state, entry context, chosen category and the person's text are never part of it.

**Opaque model alias.** `deepseek-flash` is a mutable alias and DeepSeek reports no revision, so the alias is not proof of
an unchanged model: live entries are reused only while (a) younger than `HEIM_CACHE_MAX_AGE_DAYS` (default 30), (b) the
producing invocation's observed model equals the requested key, and (c) `MODEL_GENERATION` / `CACHE_POLICY_VERSION`
(bump to invalidate everything) are unchanged.

**Mock fixtures** are keyed separately (`provider=mock`, `promptId=mock:<scenario>`); delayed fixtures (`…:ms`) and
`echo` are never reused, so timing tests keep their meaning.

## 4. Flow

```
request → resolve canonical media (headers → id_bridge, or hash of the bytes) → key
        → LOOKUP valid, cacheable, non-invalidated, unexpired, succeeded+valid producing invocation, same media, same scope
             hit  → answer stored observation + decisions recomputed now; event 'hit' (no provider call)
             miss → CLAIM (single-flight)
                      won / took over an expired lease → provider (or fixture) → validate → persist with key → event 'miss' → release
                      held by another → wait for its observation (≤ 40 s) → 'waited_hit'
                                         holder released without a result → claim again and analyse (recovery)
```
* The lookup happens **before** the Gate 1 provider check, so a valid cached observation is served even when the
  provider is unavailable or blocked; with no cached entry the route returns its ordinary safe failure.
* Reusable only when: a Pass 1 vision observation exists, validation is valid, status succeeded and — for a real call —
  `finish_reason` is `stop` (truncated output is never reused). Failed, invalid, empty or invalidated results are never reused.
* Leases are 45 s (longer than the provider timeout); an expired lease is taken over, so a crashed holder never blocks a key permanently. Mock and live never share a claim (the provider is part of the key).
* No database ⇒ the routes behave exactly as before P2-B1 (no cache, no provenance).

## 5. Authorization and privacy

There is no authenticated identity in this prototype, so the scope is the single local development principal
(`LOCAL_OWNER_SCOPE`) and the media id is part of the key. **Cross-user reuse is disabled**: identical bytes in another
owner scope produce another key, and the lookup also filters on scope (tested with a forged same-key row in another scope).
The cache stores what P2-B1 already stored (the observation JSON, which can contain OCR-visible text) plus the Meal
readings of the same call — locally, unencrypted, never returned to anyone but the requester and never placed in a
Social post. Cache keys and telemetry carry no content.

## 6. Deletion and invalidation

* `deleteMedia(mediaId)` now also reports and removes (by cascade) the media's cache events and in-flight claims; cached
  payloads go with their observations.
* `invalidateObservations({mediaId | observationId}, reason)` keeps the row for audit but makes it unusable; a
  re-analysis creates a new row beside it, so older model outputs stay traceable to their own invocation.

## 7. Telemetry / measurement

`select * from heim.cache_metrics;` — per task and application (`social_composer` / `circle_of_life`, from the
`X-SB-Entry` header). Offline benchmark: `node prototype-tests/_cache-benchmark.js` (mock provider; writes
`prototype-evidence/p2b2-observation-cache/benchmark.json`).
