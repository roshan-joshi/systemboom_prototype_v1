/**
 * SYSTEMBOOM SIE — the shared CMI/HEIM observation boundary for the analysis routes (SERVER ONLY).
 *
 * P2-B1: `withHeimProvenance` runs the route's EXISTING handler untouched, then — best effort, never throwing — records
 * one content-free invocation row, links the media the request looked at, and (Pass 1 category call) stores the
 * validated visual observation.
 *
 * P2-B2: with a `cache` spec (today: the Pass 1 category call only) the boundary first resolves the canonical media,
 * computes the compatibility key and looks for a valid stored observation. A HIT answers from PostgreSQL with today's
 * decisions recomputed (`spec.fromStored`) and records a cache event — NO provider call, NO invocation row. A MISS takes a
 * lease-based single-flight claim (losers wait for the winner's observation), runs the handler, persists the observation
 * with its key and releases the claim. Lookups happen BEFORE the provider gate, so a valid cached observation is served
 * even when the provider is unavailable or blocked.
 *
 * If the database is unavailable the route behaves exactly as before P2-B1. Media identity arrives only as opaque
 * headers (X-SB-Asset / X-SB-Asset-Origin / X-SB-Session / X-SB-Entry); request bodies and provider payloads are
 * unchanged. No image, filename, OCR text or key is ever written to a log.
 */
import { createHash, randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { errCode, heimPool, recordRun, registerMedia } from "./heim-store";
import { mockScenario } from "./provider-gate";
import {
  claimKey, computeCacheKey, lookupObservation, PASS1_PREPROCESSING, recordCacheEvent, releaseClaim, waitForObservation,
  type CacheEvent, type CachedObservation, type CacheKeyFields,
} from "./observation-cache";

export interface ProviderTrace {
  mock: boolean;
  attempts: number;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number | null;
  observedModel: string | null;
  finishReason: string | null;
  promptDigest: string | null;
  error: boolean;
  validation: "valid" | "invalid" | null;
  startedAt: number;
  /** P2-B2 — observation material the response does not carry but a cache hit needs (e.g. the model's category scores) */
  extras: { categoryScores?: Record<string, number> };
}

export const newTrace = (): ProviderTrace => ({
  mock: false, attempts: 0, inputTokens: null, outputTokens: null, latencyMs: null,
  observedModel: null, finishReason: null, promptDigest: null, error: false, validation: null, startedAt: Date.now(), extras: {},
});

interface CompletionLike {
  model?: unknown;
  usage?: { prompt_tokens?: number; completion_tokens?: number } | null;
  choices?: { finish_reason?: string | null }[];
}

/** call after each provider response; accumulates across a bounded retry */
export function fillFromCompletion(trace: ProviderTrace, completion: CompletionLike, payload: { messages?: { role: string; content: unknown }[] }, startedAt: number) {
  trace.attempts += 1;
  trace.latencyMs = (trace.latencyMs ?? 0) + (Date.now() - startedAt);
  if (typeof completion.model === "string" && completion.model) trace.observedModel = completion.model;
  const u = completion.usage;
  if (u) {
    trace.inputTokens = (trace.inputTokens ?? 0) + (u.prompt_tokens ?? 0);
    trace.outputTokens = (trace.outputTokens ?? 0) + (u.completion_tokens ?? 0);
  }
  trace.finishReason = completion.choices?.[0]?.finish_reason ?? trace.finishReason;
  trace.promptDigest = promptDigestOf(payload);
}

export function promptDigestOf(payload: { messages?: { role: string; content: unknown }[] }): string | null {
  const sys = payload.messages?.find((m) => m.role === "system");
  return sys && typeof sys.content === "string" ? createHash("sha256").update(sys.content).digest("hex") : null;
}

export interface ProvenanceTask {
  taskType: "category_pass1" | "activity_specialist" | "record_specialist";
  promptId: string | ((body: Record<string, unknown> | null) => string);
  requestedProvider: string;
  requestedModel: string;
  schemaVersion: string;
}

/** a route's contract with the shared observation cache */
export interface ObservationCacheSpec {
  /** the route-specific compatibility parts for this request, or null when this request must not use the cache */
  keyParts(scenario: string | null): Pick<CacheKeyFields, "provider" | "model" | "promptId" | "promptDigest" | "analysisConfigDigest" | "schema"> | null;
  /** the decision-free observation to store (null = do not make it reusable) */
  toStored(observation: Record<string, unknown>, trace: ProviderTrace): Record<string, unknown> | null;
  /** the response body a hit answers with — stored observation + decisions recomputed NOW */
  fromStored(payload: Record<string, unknown>): Record<string, unknown>;
  /** the route's ordinary "provider unavailable" body */
  unavailable(): Record<string, unknown>;
}

const ID = /^[A-Za-z0-9._:-]{1,120}$/;
const KEY = /^[A-Za-z0-9._:-]{1,80}$/;
const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function imagesOf(body: Record<string, unknown> | null): { bytes: Buffer; mime: string | null }[] {
  const imgs = body?.images;
  if (!Array.isArray(imgs)) return [];
  const out: { bytes: Buffer; mime: string | null }[] = [];
  for (const i of imgs) {
    const url = (i as { dataUrl?: unknown })?.dataUrl;
    if (typeof url !== "string") continue;
    const m = /^data:([^;,]+)?(;base64)?,/.exec(url);
    const payload = url.slice(url.indexOf(",") + 1);
    try {
      out.push({ bytes: m?.[2] ? Buffer.from(payload, "base64") : Buffer.from(decodeURIComponent(payload)), mime: m?.[1] ?? null });
    } catch { /* skip an undecodable image */ }
  }
  return out;
}

const entryOf = (req: NextRequest): CacheEvent["entryContext"] => {
  const e = req.headers.get("x-sb-entry");
  return e === "social_composer" || e === "circle_of_life" ? e : "unknown";
};

/** canonical media + representation fingerprint for this request, from opaque headers + the bytes already in the body */
async function resolveMedia(req: NextRequest, body: Record<string, unknown> | null): Promise<{ mediaId: string; repSha: string } | null> {
  const assetId = req.headers.get("x-sb-asset");
  const origin = req.headers.get("x-sb-asset-origin");
  const session = req.headers.get("x-sb-session");
  if (!assetId || !ID.test(assetId) || (origin !== "upload" && origin !== "library") || !session || !KEY.test(session)) return null;
  const imgs = imagesOf(body).filter((i) => i.bytes.length > 0);
  if (!imgs.length) return null;
  const m = await registerMedia({ sessionKey: session, prototypeId: assetId, origin, sha256: sha(imgs[0].bytes), hashBasis: "representation", mimeType: imgs[0].mime, sizeBytes: imgs[0].bytes.length });
  if (!m) return null;
  // the representation is EVERY image sent, in order (a video is several keyframes)
  const repSha = imgs.length === 1 ? sha(imgs[0].bytes) : sha(Buffer.from(imgs.map((i) => sha(i.bytes)).join(":")));
  return { mediaId: m.mediaId, repSha };
}

export async function withHeimProvenance(req: NextRequest, task: ProvenanceTask, handler: (trace: ProviderTrace) => Promise<Response>, cache?: ObservationCacheSpec): Promise<Response> {
  const t0 = Date.now();
  const trace = newTrace();
  const scenario = mockScenario(req);
  trace.mock = scenario !== null; // a closed seam (production / live / non-local) is NOT a mock
  if (!heimPool()) return handler(trace); // no database → exactly the pre-P2-B1 behaviour

  const body: Record<string, unknown> | null = await req.clone().json().then((b) => (b && typeof b === "object" ? (b as Record<string, unknown>) : null)).catch(() => null);
  const entry = entryOf(req);
  let media: { mediaId: string; repSha: string } | null = null;
  try { media = await resolveMedia(req, body); } catch (e) { console.error("[heim] media resolve skipped:", errCode(e)); }

  let keyInfo: { key: string; fields: CacheKeyFields; lookupMs: number } | null = null;
  let claim: { key: string; claimant: string; takeover: boolean } | null = null;
  let note: string | null = null;
  const hitResponse = async (hit: CachedObservation, outcome: "hit" | "waited_hit", lookupMs: number) => {
    const out = cache!.fromStored(hit.payload);
    await recordCacheEvent({ mediaId: media!.mediaId, observationId: hit.observationId, originalInvocationId: hit.invocationId, cacheKey: keyInfo?.key, outcome, providerCalled: false, providerKind: "none", taskType: task.taskType, entryContext: entry, lookupMs, totalMs: Date.now() - t0 }).catch((e) => console.error("[heim] cache event skipped:", errCode(e)));
    return NextResponse.json(out, { headers: { "x-sb-observation-cache": outcome } });
  };

  if (cache) {
    const parts = cache.keyParts(scenario);
    if (!media) note = "no_authorized_media";
    else if (!parts) note = "uncacheable_request";
    else {
      try {
        const { key, fields } = computeCacheKey({ mediaId: media.mediaId, representationSha256: media.repSha, preprocessing: PASS1_PREPROCESSING, ...parts });
        const l0 = Date.now();
        const hit = await lookupObservation(key, media.mediaId, parts.model);
        keyInfo = { key, fields, lookupMs: Date.now() - l0 };
        if (hit) return hitResponse(hit, "hit", keyInfo.lookupMs);
        let c = await claimKey(key, media.mediaId, trace.mock ? "mock" : "live");
        if (c.state === "held") {
          const w = await waitForObservation(key, media.mediaId, parts.model);
          if (w.hit) return hitResponse(w.hit, "waited_hit", keyInfo.lookupMs);
          if (w.claimGone) c = await claimKey(key, media.mediaId, trace.mock ? "mock" : "live");
          if (c.state === "held") note = "claim_wait_timeout";
        }
        if (c.state !== "held") claim = { key, claimant: c.claimant, takeover: c.state === "takeover" };
      } catch (e) {
        console.error("[heim] cache lookup skipped:", errCode(e));
        note = "cache_error";
      }
    }
  }

  try {
    // deterministic test hooks — honoured ONLY on a request already running on a fixture (seam-gated by mockScenario)
    if (trace.mock && cache) {
      const lat = Number(req.headers.get("x-sb-mock-latency"));
      if (Number.isFinite(lat) && lat > 0) await sleep(Math.min(lat, 5000));
      if (req.headers.get("x-sb-mock-provider-down") === "1") {
        await safeEvent({ mediaId: media?.mediaId ?? null, cacheKey: keyInfo?.key, outcome: keyInfo ? "miss" : "bypass", providerCalled: false, providerKind: "none", taskType: task.taskType, entryContext: entry, note: "provider_unavailable", lookupMs: keyInfo?.lookupMs, totalMs: Date.now() - t0 });
        return NextResponse.json(cache.unavailable(), { headers: { "x-sb-observation-cache": keyInfo ? "miss" : "bypass" } });
      }
    }
    const res = await handler(trace);
    const blocked = !!res.headers.get("x-sb-provider-blocked");
    if (res.status >= 400 || (!trace.mock && trace.attempts === 0)) {
      if (cache) await safeEvent({ mediaId: media?.mediaId ?? null, cacheKey: keyInfo?.key, outcome: keyInfo ? "miss" : "bypass", providerCalled: false, providerKind: "none", taskType: task.taskType, entryContext: entry, note: blocked ? "provider_blocked" : res.status >= 400 ? "bad_request" : "provider_unavailable", lookupMs: keyInfo?.lookupMs, totalMs: Date.now() - t0 });
      return res;
    }
    try {
      await record(task, trace, res, body, media, cache, keyInfo, entry, t0, note, claim?.takeover ?? false);
    } catch (e) {
      console.error("[heim] provenance write skipped:", errCode(e));
    }
    if (cache) {
      try { res.headers.set("x-sb-observation-cache", keyInfo ? "miss" : "bypass"); } catch { /* immutable headers — informational only */ }
    }
    return res;
  } finally {
    if (claim) await releaseClaim(claim.key, claim.claimant).catch((e) => console.error("[heim] claim release skipped:", errCode(e)));
  }
}

async function safeEvent(e: CacheEvent) {
  await recordCacheEvent(e).catch((err) => console.error("[heim] cache event skipped:", errCode(err)));
}

async function record(
  task: ProvenanceTask, trace: ProviderTrace, res: Response, body: Record<string, unknown> | null, media: { mediaId: string; repSha: string } | null,
  cache: ObservationCacheSpec | undefined, keyInfo: { key: string; fields: CacheKeyFields; lookupMs: number } | null,
  entry: CacheEvent["entryContext"], t0: number, note: string | null, takeover: boolean,
) {
  let observation: Record<string, unknown> | null = null;
  try {
    observation = ((await res.clone().json()) as { observation?: Record<string, unknown> | null }).observation ?? null;
  } catch { /* response was not JSON — nothing to store */ }

  const real = !trace.mock;
  const vision = task.taskType === "category_pass1" && observation && typeof observation.vision === "object" && observation.vision ? (observation.vision as { primarySubject?: unknown }) : null;
  const validation = trace.validation ?? (task.taskType === "record_specialist" ? "valid" : observation ? "valid" : "invalid");
  const status = real && trace.error ? "failed" : "succeeded";
  // reusable only when the analysis completed cleanly: valid, untruncated (finish_reason 'stop' for a real call)
  const reusable = !!(cache && keyInfo && vision && observation && validation === "valid" && status === "succeeded" && (!real || trace.finishReason === "stop"));
  // UHI-MULTI-001 — the photo's own decision-free reading is kept whenever its observation is stored (food, Activity and
  // vision evidence stay available per photo); whether it may be REUSED is the separate `reusable` decision above
  const stored = cache && vision && observation ? cache.toStored(observation, trace) : null;
  const promptId = typeof task.promptId === "function" ? task.promptId(body) : task.promptId;
  const mediaIds = media ? [media.mediaId] : [];
  const out = await recordRun({
    invocation: {
      traceId: randomUUID(),
      requestedProvider: real ? task.requestedProvider : "mock",
      requestedModel: real ? task.requestedModel : "mock-fixture",
      observedProvider: real ? task.requestedProvider : null,
      observedModel: real ? trace.observedModel : null,
      observedModelVerifiable: real && !!trace.observedModel,
      taskType: task.taskType,
      promptId,
      promptVersion: trace.promptDigest ? `sha256:${trace.promptDigest.slice(0, 12)}` : real ? "unknown" : "mock",
      promptDigest: trace.promptDigest,
      schemaVersion: task.schemaVersion,
      status,
      validation,
      finishReason: trace.finishReason,
      attempts: Math.max(trace.attempts, real ? 0 : 1),
      inputTokens: trace.inputTokens,
      outputTokens: trace.outputTokens,
      latencyMs: trace.latencyMs,
      startedAt: new Date(trace.startedAt),
      finishedAt: new Date(),
      costSource: real ? "unknown" : "not_applicable",
    },
    mediaIds,
    observation: vision && mediaIds.length
      ? {
          schemaVersion: 1,
          primarySubject: typeof vision.primarySubject === "string" ? vision.primarySubject : null,
          json: observation!.vision,
          payload: stored,
          cache: keyInfo ? { key: keyInfo.key, fields: keyInfo.fields, representationSha256: media!.repSha, reusable } : null,
        }
      : null,
  });
  if (cache) {
    await safeEvent({
      mediaId: media?.mediaId ?? null, observationId: out?.observationId ?? null, originalInvocationId: out?.invocationId ?? null, cacheKey: keyInfo?.key,
      outcome: keyInfo ? "miss" : "bypass", providerCalled: true, providerKind: real ? "live" : "mock", claimTakeover: takeover, taskType: task.taskType,
      entryContext: entry, note: note ?? (keyInfo && !reusable ? "not_reusable" : null), lookupMs: keyInfo?.lookupMs, totalMs: Date.now() - t0,
    });
  }
}
