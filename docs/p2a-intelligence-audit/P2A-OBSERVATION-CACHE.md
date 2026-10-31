# P2-A — Observation Cache

Flow: `Media upload → Asset fingerprint → Compatible cached observation → Reuse, or call provider → Validate → Persist`.

## 1. Current state (VERIFIED-CODE)
Only an in-component `Map` (`assetRunsRef`, `recRunsRef`, `actRunsRef`) keyed by *session asset id*. No content hash exists; reload, tab change, unmount and draft resume all re-analyse. Cross-user reuse: not applicable (no users server-side).

## 2. Cache key (Blueprint §7 / V1.2, applied)

```
key = ( owner_scope_id,
        content_sha256_of_original_bytes,
        normalized_input_variant,       // which representation was sent: original | derivative lineage id + resize policy
        provider_key + model_key (+ observed revision when known),
        prompt_id + prompt_version/digest,
        observation_schema_version,
        preprocessing_version,
        analysis_policy_version )
```
Anything that changes the pixels the model sees or the contract it answers must change the key. **Classifier and knowledge versions are deliberately NOT in the Pass 1 key** — a cache hit never reuses an old category decision; Pass 2 re-runs under current versions and writes a new decision (SIE-031).

## 3. Design questions answered

| Topic | Position |
|---|---|
| SHA-256 | Computed once at ingestion over **original** bytes (WebCrypto client-side for preview; authoritative server-side). The repo has none today. |
| Same bytes, different users | Identical bytes do **not** grant cross-user sharing: `owner_scope_id` is part of the key. A cross-user dedup optimisation is rejected. |
| Compatibility policy | A successful, schema-valid observation is reusable only when every key component matches. A newer model/prompt = a new row; old rows stay auditable (SIE-095). |
| Concurrent uploads | **Single-flight lease** per key: `INSERT … ON CONFLICT DO NOTHING` a `pending` row with `lease_expires_at`; losers wait/poll or subscribe; winner persists atomically and releases. Crashed winner ⇒ lease expiry ⇒ one retry under a retry budget. |
| Exactly-once billing | **Not guaranteed** across a crash between provider response and persist (Blueprint §7). Target: no repeat call for any *successful persisted* compatible result. Test with fault injection (SIE-029). |
| Provider failures | Failed/transient results are never `COMPLETE` observations (SIE-030). Negative caching only for bounded permanent invalid-input failures (e.g. corrupt image), short TTL, never for 5xx/timeouts. |
| Image editing / crop / resize / HEIC | A derivative is a **new representation** with lineage to its original; it gets its own fingerprint row and cache key. The HEIC→JPEG derivative the repo already makes is exactly this case; the *original's* hash anchors identity, the derivative's hash anchors the cache. |
| Multiple assets | One cache entry per asset; per-asset authorization; conflicts across assets are handled by UHI, never by the cache. |
| Invalidation | Version bump of any key component = natural miss (old rows retained). Explicit invalidation = owner deletion/consent revocation → deletion workflow (SIE-068). TTL only for negative entries. |
| Historical preservation | Observations are immutable; corrections never rewrite them (matches the repo's "AI observation is never mutated" rule). |
| Cross-user isolation | RLS + application check; adversarial id-guessing test (SIE-070) before any B2 acceptance. |
| Storage of sensitive content | OCR text lives inside the observation; encryption at rest and a retention class are required for rows containing OCR/health/children signals (privacy doc). |

## 4. Interaction with the Composer

* On attach: Composer asks the gateway; a cache hit returns `cacheStatus: "hit"` and the existing per-asset UI (waiting skeleton → resolved card) runs with no provider latency.
* The Composer's `assetRunsRef` stays as a UI-level guard against double submit but stops being the system of record.
* "Keep draft → resume" stops re-analysing (current documented limitation closes for free).

## 5. Metrics (all measured, none assumed)
hit/miss per asset, duplicate-provider-call rate (must be 0 for compatible successful entries), lease contention count, p50/p95 with and without hit, cost avoided (estimated from the pricing snapshot).

## 6. Risks
* A cache that serves a stale category: prevented by design (decisions are separate artifacts).
* Cache poisoning via a malformed/forged observation: validate on write *and* on read against the versioned schema.
* Privacy: cache table is the largest concentration of private intelligence — highest RLS/retention scrutiny.
