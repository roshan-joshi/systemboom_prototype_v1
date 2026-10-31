-- SYSTEMBOOM SIE · P2-B1 · heim foundation (LOCAL DEVELOPMENT ONLY).
-- Dedicated local database `systemboom_intelligence_dev`. Never run against production:
-- db/heim/migrate.mjs refuses any database whose name does not end in `_dev` or any non-localhost host.
--
-- owner_scope_id is a LOCAL SINGLE-USER PLACEHOLDER, not an authenticated identity. It exists so the
-- column shape matches the reference design; real authentication/tenant binding is deferred.
-- Credentials, raw API keys and image bytes are never stored in any table here.

CREATE SCHEMA IF NOT EXISTS heim;

-- ── canonical media identity ──────────────────────────────────────────────────────────────────────
-- One row per distinct content hash per owner scope. Holds identity + fingerprint only, never bytes.
CREATE TABLE heim.media_assets (
  media_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_scope_id  uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  content_sha256  text NOT NULL CHECK (content_sha256 ~ '^[0-9a-f]{64}$'),
  -- 'original' = hash of the file the person chose; 'representation' = hash of the bytes that were
  -- actually sent for analysis (library fixtures, or an upload that was analysed before it registered).
  hash_basis      text NOT NULL CHECK (hash_basis IN ('original','representation')),
  mime_type       text,
  size_bytes      bigint CHECK (size_bytes IS NULL OR size_bytes >= 0),
  origin          text NOT NULL CHECK (origin IN ('upload','library')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_scope_id, content_sha256)
);

-- Temporary prototype/session id → canonical media id. session_key is a random per-page-load token
-- (NOT an identity); library fixtures use the constant key 'library'. Prototype upload ids
-- ("up-1-IMG") repeat across page loads, which is exactly why the session key is part of the key.
CREATE TABLE heim.id_bridge (
  bridge_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind         text NOT NULL DEFAULT 'asset' CHECK (kind IN ('asset')),
  session_key  text NOT NULL CHECK (length(session_key) BETWEEN 1 AND 80),
  prototype_id text NOT NULL CHECK (length(prototype_id) BETWEEN 1 AND 120),
  media_id     uuid NOT NULL REFERENCES heim.media_assets(media_id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, session_key, prototype_id)
);
CREATE INDEX id_bridge_media_idx ON heim.id_bridge(media_id);

-- ── provider / model registry ─────────────────────────────────────────────────────────────────────
CREATE TABLE heim.ai_providers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key    text NOT NULL UNIQUE,
  display_name    text NOT NULL,
  endpoint_family text,                       -- e.g. 'openai-compatible'; never a URL carrying credentials
  enabled         boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE heim.ai_models (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id          uuid NOT NULL REFERENCES heim.ai_providers(id),
  configured_model_key text NOT NULL,
  published_revision   text,                  -- NULL = unknown (never guessed)
  capabilities         jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled              boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now()
);
-- NULL-safe uniqueness (a plain UNIQUE treats NULL revisions as distinct); portable across PG versions.
CREATE UNIQUE INDEX ai_models_unique_idx ON heim.ai_models(provider_id, configured_model_key, coalesce(published_revision, ''));

-- ── invocation ledger ─────────────────────────────────────────────────────────────────────────────
-- One row per intelligence request that reached a provider (or a labelled mock). Content-free by design.
CREATE TABLE heim.ai_invocations (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_scope_id            uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  request_trace_id          text NOT NULL,
  provider_id               uuid REFERENCES heim.ai_providers(id),
  model_id                  uuid REFERENCES heim.ai_models(id),
  requested_provider_key    text NOT NULL,
  requested_model_key       text NOT NULL,
  observed_provider_key     text,
  observed_model_key        text,             -- provider-reported model identifier when supplied
  observed_model_verifiable boolean NOT NULL DEFAULT false,
  task_type                 text NOT NULL,    -- category_pass1 | activity_specialist | record_specialist
  prompt_id                 text NOT NULL,
  prompt_version            text NOT NULL,    -- content-digest label until prompts carry explicit versions
  prompt_digest             text,
  schema_version            text NOT NULL,
  status                    text NOT NULL CHECK (status IN ('started','succeeded','failed','cancelled','unknown')),
  validation_status         text NOT NULL DEFAULT 'not_applicable' CHECK (validation_status IN ('valid','invalid','not_applicable')),
  finish_reason             text,
  attempt_count             integer NOT NULL DEFAULT 1 CHECK (attempt_count >= 0),
  input_tokens              bigint CHECK (input_tokens IS NULL OR input_tokens >= 0),
  output_tokens             bigint CHECK (output_tokens IS NULL OR output_tokens >= 0),
  latency_ms                integer CHECK (latency_ms IS NULL OR latency_ms >= 0),
  started_at                timestamptz NOT NULL DEFAULT now(),
  finished_at               timestamptz,
  CHECK (finished_at IS NULL OR finished_at >= started_at)
);
CREATE INDEX ai_invocations_started_idx ON heim.ai_invocations(owner_scope_id, started_at DESC);

-- Which media an invocation looked at. Deleting the media removes the link; the content-free ledger row stays.
CREATE TABLE heim.ai_invocation_media (
  invocation_id uuid NOT NULL REFERENCES heim.ai_invocations(id) ON DELETE CASCADE,
  media_id      uuid NOT NULL REFERENCES heim.media_assets(media_id) ON DELETE CASCADE,
  ordinal       integer NOT NULL DEFAULT 0,
  PRIMARY KEY (invocation_id, media_id)
);
CREATE INDEX ai_invocation_media_media_idx ON heim.ai_invocation_media(media_id);

-- ── Pass 1 visual observations (storage only — no cache lookup, no reuse in P2-B1) ────────────────
CREATE TABLE heim.vision_observations (
  observation_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_scope_id  uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  media_id        uuid NOT NULL REFERENCES heim.media_assets(media_id) ON DELETE CASCADE,
  invocation_id   uuid NOT NULL REFERENCES heim.ai_invocations(id) ON DELETE RESTRICT,
  schema_version  integer NOT NULL CHECK (schema_version >= 1),
  primary_subject text,
  observation     jsonb NOT NULL CHECK (jsonb_typeof(observation) = 'object'),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (invocation_id, media_id)
);
CREATE INDEX vision_observations_media_idx ON heim.vision_observations(media_id, created_at DESC);

-- ── seed the registry (only provider/model identity, no secrets) ──────────────────────────────────
INSERT INTO heim.ai_providers (provider_key, display_name, endpoint_family) VALUES
  ('deepseek', 'DeepSeek', 'openai-compatible'),
  ('mock',     'Local mock fixtures (test seam)', NULL);
INSERT INTO heim.ai_models (provider_id, configured_model_key)
  SELECT id, 'deepseek-flash' FROM heim.ai_providers WHERE provider_key = 'deepseek';
INSERT INTO heim.ai_models (provider_id, configured_model_key)
  SELECT id, 'mock-fixture' FROM heim.ai_providers WHERE provider_key = 'mock';
