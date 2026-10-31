-- SYSTEMBOOM SIE · P2-B2 · persistent observation cache (LOCAL DEVELOPMENT ONLY).
-- Reuses heim.vision_observations as the cache's source of truth (no separate cache store). Adds: the compatibility key,
-- the full validated category-call observation needed to answer a cache hit, explicit cacheability and invalidation,
-- a lease-based single-flight claim table, a content-free cache-event ledger (hits are NOT invocations) and a metrics view.

ALTER TABLE heim.vision_observations
  ADD COLUMN cache_key             text CHECK (cache_key IS NULL OR cache_key ~ '^[0-9a-f]{64}$'),
  ADD COLUMN cache_key_fields      jsonb,                         -- the audited components (versions/ids — no content)
  ADD COLUMN representation_sha256 text CHECK (representation_sha256 IS NULL OR representation_sha256 ~ '^[0-9a-f]{64}$'),
  ADD COLUMN payload               jsonb CHECK (payload IS NULL OR jsonb_typeof(payload) = 'object'),
  ADD COLUMN cacheable             boolean NOT NULL DEFAULT false,
  ADD COLUMN invalidated_at        timestamptz,
  ADD COLUMN invalidation_reason   text,
  ADD CONSTRAINT vision_observations_cacheable_needs_key CHECK (NOT cacheable OR (cache_key IS NOT NULL AND payload IS NOT NULL));
CREATE INDEX vision_observations_cache_idx ON heim.vision_observations (owner_scope_id, cache_key, created_at DESC)
  WHERE cacheable AND invalidated_at IS NULL;

-- cost attribution of a REAL invocation: tokens are recorded when reported; no price table exists yet, so money is 'unknown'
ALTER TABLE heim.ai_invocations
  ADD COLUMN cost_source text NOT NULL DEFAULT 'unknown'
    CHECK (cost_source IN ('provider_reported','estimated','unknown','not_applicable'));

-- single-flight: one holder per compatibility key; a lease makes a crashed holder recoverable
CREATE TABLE heim.observation_cache_claims (
  cache_key        text PRIMARY KEY CHECK (cache_key ~ '^[0-9a-f]{64}$'),
  owner_scope_id   uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  media_id         uuid NOT NULL REFERENCES heim.media_assets(media_id) ON DELETE CASCADE,
  claimant         uuid NOT NULL,
  provider_kind    text NOT NULL CHECK (provider_kind IN ('live','mock')),
  claimed_at       timestamptz NOT NULL DEFAULT now(),
  lease_expires_at timestamptz NOT NULL,
  CHECK (lease_expires_at > claimed_at)
);

-- content-free telemetry. A hit records that NO provider call occurred and points at the ORIGINAL producing invocation.
CREATE TABLE heim.observation_cache_events (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_scope_id         uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  media_id               uuid REFERENCES heim.media_assets(media_id) ON DELETE CASCADE,
  observation_id         uuid REFERENCES heim.vision_observations(observation_id) ON DELETE CASCADE,
  original_invocation_id uuid REFERENCES heim.ai_invocations(id) ON DELETE SET NULL,
  cache_key              text,
  outcome                text NOT NULL CHECK (outcome IN ('hit','waited_hit','miss','bypass')),
  provider_called        boolean NOT NULL,
  provider_kind          text NOT NULL CHECK (provider_kind IN ('live','mock','none')),
  claim_takeover         boolean NOT NULL DEFAULT false,
  task_type              text NOT NULL,
  entry_context          text NOT NULL DEFAULT 'unknown' CHECK (entry_context IN ('social_composer','circle_of_life','unknown')),
  note                   text,
  lookup_ms              integer CHECK (lookup_ms IS NULL OR lookup_ms >= 0),
  total_ms               integer CHECK (total_ms IS NULL OR total_ms >= 0),
  created_at             timestamptz NOT NULL DEFAULT now(),
  CHECK (outcome NOT IN ('hit','waited_hit') OR (provider_called = false AND provider_kind = 'none'))
);
CREATE INDEX observation_cache_events_media_idx ON heim.observation_cache_events (media_id);
CREATE INDEX observation_cache_events_created_idx ON heim.observation_cache_events (owner_scope_id, created_at DESC);

-- metrics: hits vs misses vs actual paid (live) calls; avoided tokens are an UPPER-BOUND estimate taken from the original
-- invocation's own reported usage (live only), never invented
CREATE VIEW heim.cache_metrics AS
SELECT e.owner_scope_id, e.task_type, e.entry_context,
       count(*) FILTER (WHERE e.outcome IN ('hit','waited_hit'))                       AS hits,
       count(*) FILTER (WHERE e.outcome = 'miss')                                      AS misses,
       count(*) FILTER (WHERE e.outcome = 'bypass')                                    AS bypasses,
       round(count(*) FILTER (WHERE e.outcome IN ('hit','waited_hit'))::numeric
             / nullif(count(*) FILTER (WHERE e.outcome IN ('hit','waited_hit','miss')), 0), 4) AS hit_ratio,
       count(*) FILTER (WHERE e.provider_called AND e.provider_kind = 'live')          AS live_provider_calls,
       count(*) FILTER (WHERE e.provider_called AND e.provider_kind = 'mock')          AS mock_provider_calls,
       count(*) FILTER (WHERE e.outcome = 'waited_hit')                                AS duplicate_calls_prevented,
       count(*) FILTER (WHERE e.claim_takeover)                                        AS claim_takeovers,
       round(avg(e.lookup_ms))                                                         AS avg_lookup_ms,
       round(avg(e.total_ms) FILTER (WHERE e.outcome IN ('hit','waited_hit')))         AS avg_hit_total_ms,
       round(avg(e.total_ms) FILTER (WHERE e.outcome = 'miss'))                        AS avg_miss_total_ms,
       sum(coalesce(i.input_tokens,0) + coalesce(i.output_tokens,0))
         FILTER (WHERE e.outcome IN ('hit','waited_hit') AND i.requested_provider_key <> 'mock') AS avoided_tokens_estimate_live
FROM heim.observation_cache_events e
LEFT JOIN heim.ai_invocations i ON i.id = e.original_invocation_id
GROUP BY e.owner_scope_id, e.task_type, e.entry_context;
