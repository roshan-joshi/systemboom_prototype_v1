/**
 * SYSTEMBOOM SIE P2-B1 — the local `heim` database layer (SERVER ONLY — import from route handlers and tests,
 * never from a client component; `pg` must not enter the browser bundle).
 *
 * LOCAL DEVELOPMENT ONLY. The connection is refused unless the host is localhost and the database name ends in
 * `_dev`, so it can never silently point at a shared or production database. `owner_scope_id` is a single-user
 * placeholder, NOT an authenticated identity. Nothing here stores credentials or image bytes, and nothing here
 * ever logs a value: failures are reported by SQLSTATE code only (a constraint-violation message can echo data).
 *
 * Every export degrades quietly: when the database is unreachable the callers (the analysis routes) carry on
 * exactly as before — intelligence routes must never depend on this layer for their P1 behaviour.
 */
import { Pool, type PoolClient } from "pg";

const DEFAULT_URL = "postgresql://localhost:5432/systemboom_intelligence_dev";
export const LOCAL_OWNER_SCOPE = "00000000-0000-0000-0000-000000000001";

/** returns the connection string only if it is a local `_dev` database, else null */
export function localDevUrl(raw: string | undefined): string | null {
  try {
    const u = new URL(raw || DEFAULT_URL);
    const host = u.hostname.replace(/^\[|\]$/g, "");
    const db = decodeURIComponent(u.pathname.replace(/^\//, ""));
    if (!["localhost", "127.0.0.1", "::1"].includes(host)) return null;
    if (!/_dev$/.test(db)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

const g = globalThis as unknown as { __heimPool?: Pool | null; __heimWarned?: boolean };

export function heimPool(): Pool | null {
  if (g.__heimPool !== undefined) return g.__heimPool;
  // a production build needs an explicit, still-local `_dev` URL; nothing is enabled by default there
  const raw = process.env.HEIM_DATABASE_URL || (process.env.NODE_ENV === "production" ? undefined : DEFAULT_URL);
  const url = raw ? localDevUrl(raw) : null;
  if (!url) {
    if (!g.__heimWarned) { g.__heimWarned = true; console.error("[heim] disabled: no local *_dev database configured"); }
    return (g.__heimPool = null);
  }
  const pool = new Pool({ connectionString: url, max: 4, connectionTimeoutMillis: 1500, idleTimeoutMillis: 10_000, statement_timeout: 4000 });
  pool.on("error", (e) => console.error("[heim] pool error", (e as { code?: string }).code ?? ""));
  return (g.__heimPool = pool);
}

export const errCode = (e: unknown): string => (e as { code?: string })?.code ?? "unknown";

async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T | null> {
  const pool = heimPool();
  if (!pool) return null;
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const out = await fn(c);
    await c.query("COMMIT");
    return out;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

export interface MediaRef {
  sessionKey: string;
  prototypeId: string;
  origin: "upload" | "library";
  sha256: string;
  hashBasis: "original" | "representation";
  mimeType?: string | null;
  sizeBytes?: number | null;
}

/**
 * Resolve (or create) the canonical media id for a temporary prototype id.
 * Idempotent and race-safe: an advisory lock serialises everything for one (session, prototype id) pair, the bridge is
 * the first lookup, and identical bytes (same owner scope + SHA-256) reuse one canonical row.
 * An upload first seen through analysis is anchored on the representation hash; if its ORIGINAL hash registers later
 * and no other row owns it, the identity is upgraded in place (observations stay linked).
 */
export async function registerMedia(ref: MediaRef): Promise<{ mediaId: string; created: boolean } | null> {
  return tx(async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`${ref.sessionKey}|${ref.prototypeId}`]);
    const bridged = await c.query<{ media_id: string; content_sha256: string; hash_basis: string }>(
      `SELECT b.media_id, m.content_sha256, m.hash_basis FROM heim.id_bridge b JOIN heim.media_assets m USING (media_id)
        WHERE b.kind='asset' AND b.session_key=$1 AND b.prototype_id=$2`,
      [ref.sessionKey, ref.prototypeId],
    );
    if (bridged.rowCount) {
      const b = bridged.rows[0];
      if (ref.hashBasis === "original" && b.hash_basis === "representation" && b.content_sha256 !== ref.sha256) {
        const owner = await c.query("SELECT 1 FROM heim.media_assets WHERE owner_scope_id=$1 AND content_sha256=$2", [LOCAL_OWNER_SCOPE, ref.sha256]);
        if (!owner.rowCount) await c.query("UPDATE heim.media_assets SET content_sha256=$2, hash_basis='original' WHERE media_id=$1", [b.media_id, ref.sha256]);
      }
      return { mediaId: b.media_id, created: false };
    }
    const ins = await c.query<{ media_id: string; inserted: boolean }>(
      `INSERT INTO heim.media_assets (content_sha256, hash_basis, mime_type, size_bytes, origin)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (owner_scope_id, content_sha256) DO UPDATE
         SET mime_type = coalesce(heim.media_assets.mime_type, excluded.mime_type),
             size_bytes = coalesce(heim.media_assets.size_bytes, excluded.size_bytes),
             hash_basis = CASE WHEN excluded.hash_basis='original' THEN 'original' ELSE heim.media_assets.hash_basis END
       RETURNING media_id, (xmax = 0) AS inserted`,
      [ref.sha256, ref.hashBasis, ref.mimeType ?? null, ref.sizeBytes ?? null, ref.origin],
    );
    const { media_id, inserted } = ins.rows[0];
    await c.query(`INSERT INTO heim.id_bridge (kind, session_key, prototype_id, media_id) VALUES ('asset',$1,$2,$3) ON CONFLICT DO NOTHING`, [ref.sessionKey, ref.prototypeId, media_id]);
    return { mediaId: media_id, created: inserted };
  });
}

export interface InvocationRecord {
  traceId: string;
  requestedProvider: string;
  requestedModel: string;
  observedProvider?: string | null;
  observedModel?: string | null;
  observedModelVerifiable: boolean;
  taskType: string;
  promptId: string;
  promptVersion: string;
  promptDigest?: string | null;
  schemaVersion: string;
  status: "succeeded" | "failed";
  validation: "valid" | "invalid" | "not_applicable";
  finishReason?: string | null;
  attempts: number;
  inputTokens?: number | null;
  outputTokens?: number | null;
  latencyMs?: number | null;
  startedAt: Date;
  finishedAt: Date;
  /** P2-B2 — money attribution: real calls report tokens but no price (no price table) → 'unknown'; mocks → 'not_applicable' */
  costSource?: "provider_reported" | "estimated" | "unknown" | "not_applicable";
}

/** one invocation row + its media links + (optionally) the Pass 1 observation, in a single transaction */
export async function recordRun(input: {
  invocation: InvocationRecord;
  mediaIds: string[];
  observation?: {
    schemaVersion: number;
    primarySubject?: string | null;
    json: unknown;
    /** UHI-MULTI-001 — this photo's own complete, decision-free reading (stored for EVERY observation; reuse is separate) */
    payload?: object | null;
    /** P2-B2 — the compatibility key; `reusable` alone decides whether the observation may answer a later request */
    cache?: { key: string; fields: object; representationSha256: string; reusable: boolean } | null;
  } | null;
}): Promise<{ invocationId: string; observationId: string | null } | null> {
  return tx(async (c) => {
    const inv = input.invocation;
    const prov = await c.query<{ id: string }>(
      `INSERT INTO heim.ai_providers (provider_key, display_name) VALUES ($1,$1) ON CONFLICT (provider_key) DO UPDATE SET provider_key=excluded.provider_key RETURNING id`,
      [inv.requestedProvider],
    );
    const providerId = prov.rows[0].id;
    let model = await c.query<{ id: string }>(
      `SELECT id FROM heim.ai_models WHERE provider_id=$1 AND configured_model_key=$2 AND published_revision IS NULL`,
      [providerId, inv.requestedModel],
    );
    if (!model.rowCount) {
      model = await c.query<{ id: string }>(
        `INSERT INTO heim.ai_models (provider_id, configured_model_key) VALUES ($1,$2)
         ON CONFLICT (provider_id, configured_model_key, coalesce(published_revision, '')) DO UPDATE SET configured_model_key=excluded.configured_model_key RETURNING id`,
        [providerId, inv.requestedModel],
      );
    }
    const row = await c.query<{ id: string }>(
      `INSERT INTO heim.ai_invocations
        (request_trace_id, provider_id, model_id, requested_provider_key, requested_model_key, observed_provider_key, observed_model_key,
         observed_model_verifiable, task_type, prompt_id, prompt_version, prompt_digest, schema_version, status, validation_status,
         finish_reason, attempt_count, input_tokens, output_tokens, latency_ms, started_at, finished_at, cost_source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) RETURNING id`,
      [inv.traceId, providerId, model.rows[0].id, inv.requestedProvider, inv.requestedModel, inv.observedProvider ?? null, inv.observedModel ?? null,
        inv.observedModelVerifiable, inv.taskType, inv.promptId, inv.promptVersion, inv.promptDigest ?? null, inv.schemaVersion, inv.status, inv.validation,
        inv.finishReason ?? null, inv.attempts, inv.inputTokens ?? null, inv.outputTokens ?? null, inv.latencyMs ?? null, inv.startedAt, inv.finishedAt,
        inv.costSource ?? "unknown"],
    );
    const invocationId = row.rows[0].id;
    let ordinal = 0;
    for (const mediaId of input.mediaIds) {
      await c.query(`INSERT INTO heim.ai_invocation_media (invocation_id, media_id, ordinal) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, [invocationId, mediaId, ordinal++]);
    }
    let observationId: string | null = null;
    if (input.observation && input.mediaIds[0]) {
      const o = await c.query<{ observation_id: string }>(
        `INSERT INTO heim.vision_observations (media_id, invocation_id, schema_version, primary_subject, observation,
           cache_key, cache_key_fields, representation_sha256, payload, cacheable)
         VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7::jsonb,$8,$9::jsonb,$10) ON CONFLICT (invocation_id, media_id) DO NOTHING RETURNING observation_id`,
        [input.mediaIds[0], invocationId, input.observation.schemaVersion, input.observation.primarySubject ?? null, JSON.stringify(input.observation.json),
          input.observation.cache?.key ?? null, input.observation.cache ? JSON.stringify(input.observation.cache.fields) : null,
          input.observation.cache?.representationSha256 ?? null, input.observation.payload ? JSON.stringify(input.observation.payload) : null,
          !!input.observation.cache?.reusable && !!input.observation.payload],
      );
      observationId = o.rows[0]?.observation_id ?? null;
    }
    return { invocationId, observationId };
  });
}

/**
 * Delete a canonical media asset. Database cascades remove its bridge rows, its invocation links, its
 * observations (the cached payloads with them), its cache events and any in-flight cache claim. Invocation LEDGER rows are content-free (model, task, tokens, latency) and are deliberately kept
 * for provenance/cost history, now linked to nothing.
 */
export async function deleteMedia(mediaId: string): Promise<{ deleted: boolean; bridges: number; observations: number; invocationLinks: number; cacheEvents: number; cacheClaims: number } | null> {
  return tx(async (c) => {
    const counts = await c.query<{ b: string; o: string; l: string; e: string; k: string }>(
      `SELECT (SELECT count(*) FROM heim.id_bridge WHERE media_id=$1) AS b,
              (SELECT count(*) FROM heim.vision_observations WHERE media_id=$1) AS o,
              (SELECT count(*) FROM heim.ai_invocation_media WHERE media_id=$1) AS l,
              (SELECT count(*) FROM heim.observation_cache_events WHERE media_id=$1) AS e,
              (SELECT count(*) FROM heim.observation_cache_claims WHERE media_id=$1) AS k`,
      [mediaId],
    );
    const del = await c.query("DELETE FROM heim.media_assets WHERE media_id=$1", [mediaId]);
    const r = counts.rows[0];
    return { deleted: (del.rowCount ?? 0) > 0, bridges: Number(r.b), observations: Number(r.o), invocationLinks: Number(r.l), cacheEvents: Number(r.e), cacheClaims: Number(r.k) };
  });
}
