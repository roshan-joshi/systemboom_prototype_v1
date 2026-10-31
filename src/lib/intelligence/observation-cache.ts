/**
 * SYSTEMBOOM SIE P2-B2 — the persistent observation cache (SERVER ONLY). PostgreSQL (`heim.vision_observations`) is the
 * only source of truth; there is no in-process cache.
 *
 * WHAT IS CACHED: the validated Pass 1 observation of one media representation (what the provider SAW), never a
 * category decision. A hit re-runs the deterministic classifier with today's rules (the route's `fromStored`), so a
 * newer classifier never inherits an old decision, and a person's category choice is never touched by this layer.
 *
 * THE COMPATIBILITY KEY (sha256 over a canonical JSON of):
 *   owner scope (authorization) · canonical media id · SHA-256 of the exact bytes sent (representation) · client
 *   preprocessing version · provider · model key · prompt id + prompt digest · analysis-configuration digest
 *   (max tokens / thinking / response format / detail) · observation schema · cache policy version.
 * Never included: UI state, entry context, chosen category, user text.
 *
 * OPAQUE MODEL REVISIONS: `deepseek-flash` is a mutable alias and DeepSeek reports no revision. It is therefore NOT
 * trusted as proof of an unchanged model: entries expire after `HEIM_CACHE_MAX_AGE_DAYS` (default 30), the observed
 * model of the producing invocation must equal the requested key, and `CACHE_POLICY_VERSION` / `MODEL_GENERATION` can
 * be bumped to invalidate everything at once.
 *
 * AUTHORIZATION: this prototype has no authenticated identity, so the scope is the single local development principal
 * (`LOCAL_OWNER_SCOPE`) and the media id is part of the key; cross-user reuse is impossible by construction (identical
 * bytes in another owner scope produce a different key) and is explicitly NOT enabled.
 */
import { createHash, randomUUID } from "node:crypto";
import { heimPool, LOCAL_OWNER_SCOPE } from "./heim-store";

export const CACHE_POLICY_VERSION = "1";
/** bump when the provider is known to have changed the model behind an alias */
export const MODEL_GENERATION = "deepseek-flash@2026-10";
/** how the Composer turns a chosen file into the bytes it sends (urlToDataUrl of the asset src; HEIC → JPEG derivative) */
export const PASS1_PREPROCESSING = "client-dataurl/1";
export const LEASE_MS = 45_000; // > the route's provider timeout (30 s single / 40 s multi)
export const WAIT_MS = 40_000;
const POLL_MS = 200;
const maxAgeDays = () => {
  const n = Number(process.env.HEIM_CACHE_MAX_AGE_DAYS);
  return Number.isFinite(n) && n > 0 ? n : 30;
};

export interface CacheKeyFields {
  v: string;
  scope: string;
  mediaId: string;
  representationSha256: string;
  preprocessing: string;
  provider: string;
  model: string;
  modelGeneration: string;
  promptId: string;
  promptDigest: string;
  analysisConfigDigest: string;
  schema: string;
}

const canonical = (o: object): string => JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b))));
export const sha256 = (s: string | Buffer): string => createHash("sha256").update(s).digest("hex");

export function computeCacheKey(f: Omit<CacheKeyFields, "v" | "scope" | "modelGeneration"> & { scope?: string }): { key: string; fields: CacheKeyFields } {
  const fields: CacheKeyFields = { v: CACHE_POLICY_VERSION, scope: f.scope ?? LOCAL_OWNER_SCOPE, modelGeneration: f.provider === "mock" ? "mock" : MODEL_GENERATION, ...f } as CacheKeyFields;
  return { key: sha256(canonical(fields)), fields };
}

export interface CachedObservation {
  observationId: string;
  invocationId: string;
  payload: Record<string, unknown>;
}

/** a valid, cacheable, non-invalidated, unexpired observation for exactly this key + media in this scope */
export async function lookupObservation(key: string, mediaId: string, requestedModel: string): Promise<CachedObservation | null> {
  const pool = heimPool();
  if (!pool) return null;
  const r = await pool.query<{ observation_id: string; invocation_id: string; payload: Record<string, unknown> }>(
    `SELECT o.observation_id, o.invocation_id, o.payload
       FROM heim.vision_observations o
       JOIN heim.media_assets m ON m.media_id = o.media_id AND m.owner_scope_id = o.owner_scope_id
       JOIN heim.ai_invocations i ON i.id = o.invocation_id
      WHERE o.owner_scope_id = $1 AND o.cache_key = $2 AND o.media_id = $3
        AND o.cacheable AND o.invalidated_at IS NULL AND o.payload IS NOT NULL
        AND o.created_at > now() - make_interval(days => $4)
        AND i.status = 'succeeded' AND i.validation_status = 'valid'
        AND (i.requested_provider_key = 'mock' OR i.observed_model_key = $5)
      ORDER BY o.created_at DESC LIMIT 1`,
    [LOCAL_OWNER_SCOPE, key, mediaId, maxAgeDays(), requestedModel],
  );
  const row = r.rows[0];
  return row ? { observationId: row.observation_id, invocationId: row.invocation_id, payload: row.payload } : null;
}

export type ClaimResult = { state: "won" | "takeover"; claimant: string } | { state: "held" };

/** single-flight: take the claim, take over an EXPIRED one (crash recovery), or report that a live holder exists */
export async function claimKey(key: string, mediaId: string, providerKind: "live" | "mock"): Promise<ClaimResult> {
  const pool = heimPool();
  if (!pool) return { state: "won", claimant: randomUUID() };
  const claimant = randomUUID();
  const ins = await pool.query(
    `INSERT INTO heim.observation_cache_claims (cache_key, media_id, claimant, provider_kind, lease_expires_at)
     VALUES ($1,$2,$3,$4, now() + make_interval(secs => $5)) ON CONFLICT (cache_key) DO NOTHING`,
    [key, mediaId, claimant, providerKind, LEASE_MS / 1000],
  );
  if (ins.rowCount) return { state: "won", claimant };
  const take = await pool.query(
    `UPDATE heim.observation_cache_claims SET claimant=$2, claimed_at=now(), lease_expires_at=now() + make_interval(secs => $3), provider_kind=$4
      WHERE cache_key=$1 AND lease_expires_at < now()`,
    [key, claimant, LEASE_MS / 1000, providerKind],
  );
  return take.rowCount ? { state: "takeover", claimant } : { state: "held" };
}

export async function releaseClaim(key: string, claimant: string): Promise<void> {
  const pool = heimPool();
  if (!pool) return;
  await pool.query("DELETE FROM heim.observation_cache_claims WHERE cache_key=$1 AND claimant=$2", [key, claimant]);
}

/** a loser waits for the winner's observation; returns it, or null when the claim vanished without one / the wait ended */
export async function waitForObservation(key: string, mediaId: string, requestedModel: string, budgetMs = WAIT_MS): Promise<{ hit: CachedObservation | null; claimGone: boolean }> {
  const pool = heimPool();
  if (!pool) return { hit: null, claimGone: true };
  const deadline = Date.now() + budgetMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    const hit = await lookupObservation(key, mediaId, requestedModel);
    if (hit) return { hit, claimGone: false };
    const c = await pool.query("SELECT lease_expires_at < now() AS expired FROM heim.observation_cache_claims WHERE cache_key=$1", [key]);
    if (!c.rowCount || c.rows[0].expired) return { hit: null, claimGone: true };
  }
  return { hit: null, claimGone: false };
}

export interface CacheEvent {
  mediaId: string | null;
  observationId?: string | null;
  originalInvocationId?: string | null;
  cacheKey?: string | null;
  outcome: "hit" | "waited_hit" | "miss" | "bypass";
  providerCalled: boolean;
  providerKind: "live" | "mock" | "none";
  claimTakeover?: boolean;
  taskType: string;
  entryContext: "social_composer" | "circle_of_life" | "unknown";
  note?: string | null;
  lookupMs?: number | null;
  totalMs?: number | null;
}

export async function recordCacheEvent(e: CacheEvent): Promise<void> {
  const pool = heimPool();
  if (!pool) return;
  await pool.query(
    `INSERT INTO heim.observation_cache_events (media_id, observation_id, original_invocation_id, cache_key, outcome, provider_called, provider_kind,
       claim_takeover, task_type, entry_context, note, lookup_ms, total_ms) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [e.mediaId, e.observationId ?? null, e.originalInvocationId ?? null, e.cacheKey ?? null, e.outcome, e.providerCalled, e.providerKind,
      e.claimTakeover ?? false, e.taskType, e.entryContext, e.note ?? null, e.lookupMs ?? null, e.totalMs ?? null],
  );
}

/** mark a media's cached observations unusable (history is kept for audit; deletion still removes everything) */
export async function invalidateObservations(where: { mediaId?: string; observationId?: string }, reason: string): Promise<number> {
  const pool = heimPool();
  if (!pool || (!where.mediaId && !where.observationId)) return 0;
  const r = await pool.query(
    `UPDATE heim.vision_observations SET invalidated_at = now(), invalidation_reason = $3
      WHERE invalidated_at IS NULL AND ($1::uuid IS NULL OR media_id = $1) AND ($2::uuid IS NULL OR observation_id = $2)`,
    [where.mediaId ?? null, where.observationId ?? null, reason.slice(0, 200)],
  );
  return r.rowCount ?? 0;
}
