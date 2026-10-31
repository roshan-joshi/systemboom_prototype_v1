-- Rollback of 002_observation_cache (LOCAL DEVELOPMENT ONLY).
DROP VIEW IF EXISTS heim.cache_metrics;
DROP TABLE IF EXISTS heim.observation_cache_events;
DROP TABLE IF EXISTS heim.observation_cache_claims;
ALTER TABLE heim.ai_invocations DROP COLUMN IF EXISTS cost_source;
DROP INDEX IF EXISTS heim.vision_observations_cache_idx;
ALTER TABLE heim.vision_observations
  DROP CONSTRAINT IF EXISTS vision_observations_cacheable_needs_key,
  DROP COLUMN IF EXISTS invalidation_reason,
  DROP COLUMN IF EXISTS invalidated_at,
  DROP COLUMN IF EXISTS cacheable,
  DROP COLUMN IF EXISTS payload,
  DROP COLUMN IF EXISTS representation_sha256,
  DROP COLUMN IF EXISTS cache_key_fields,
  DROP COLUMN IF EXISTS cache_key;
