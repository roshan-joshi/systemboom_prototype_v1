/**
 * SYSTEMBOOM SIE P2-B2 · GATE 1 — the ONE outbound-provider boundary (SERVER ONLY).
 *
 * Every server path that can reach an external provider — DeepSeek (Meal/category, Activity, record specialists), USDA
 * FoodData Central, Open Food Facts and Nominatim — goes through this module. The rule is simple and fail-closed:
 *
 *   MOCK (the default for EVERY server)  — no outbound provider request is ever sent. A deterministic `?mock=` fixture may
 *                                          be selected on a local, non-production server; any request WITHOUT one is
 *                                          refused before the network (`LiveProviderBlockedError`) and answered with the
 *                                          route's ordinary "provider unavailable" shape plus an explicit marker.
 *   LIVE (explicit operator intent only) — requires BOTH `SB_PROVIDER_MODE=live` AND
 *                                          `SB_PROVIDER_LIVE_CONFIRM=billed-provider-calls`, and is refused under
 *                                          `NODE_ENV=test`, `CI` or `SB_TEST_RUN`. The existence of an API key never
 *                                          enables it. In LIVE mode the public `?mock=` seam is ignored.
 *
 * Enforcement is at the TRANSPORT: the DeepSeek client is built with a gated `fetch`, and the USDA / Open Food Facts /
 * Nominatim helpers call `assertLiveAllowed` immediately before opening their socket — so even a client constructed
 * elsewhere cannot send. Counters (never content) are kept per provider for test evidence.
 */
import OpenAI from "openai";

export type ProviderName = "deepseek" | "usda" | "openfoodfacts" | "nominatim";
export const LIVE_CONFIRM = "billed-provider-calls";
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

export interface ModeDecision {
  mode: "live" | "mock";
  reason: string;
}

/** pure: decide the execution mode from an environment (exported for tests) */
export function decideMode(env: Record<string, string | undefined>): ModeDecision {
  if (env.SB_PROVIDER_MODE !== "live") return { mode: "mock", reason: "SB_PROVIDER_MODE is not 'live' (default)" };
  if (env.SB_PROVIDER_LIVE_CONFIRM !== LIVE_CONFIRM) return { mode: "mock", reason: "live requested without SB_PROVIDER_LIVE_CONFIRM" };
  if (env.NODE_ENV === "test") return { mode: "mock", reason: "NODE_ENV=test never runs live" };
  if (env.CI) return { mode: "mock", reason: "CI never runs live" };
  if (env.SB_TEST_RUN) return { mode: "mock", reason: "SB_TEST_RUN never runs live" };
  return { mode: "live", reason: "explicit live configuration" };
}

export const providerMode = (): ModeDecision => decideMode(process.env as Record<string, string | undefined>);

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/** pure: may a request select a deterministic fixture? (exported for tests) */
export function mockSeamAllowedFor(env: Record<string, string | undefined>, hostHeader: string | null): boolean {
  if (decideMode(env).mode === "live") return false; // a live server never serves fixtures
  if (env.NODE_ENV === "production") return false; // a production build never honours the public test seam
  const host = (hostHeader ?? "").replace(/:\d+$/, "").toLowerCase();
  return LOCAL_HOSTS.has(host);
}

/** the deterministic-fixture scenario a request asked for, or null when the seam is closed to it */
export function mockScenario(req: { nextUrl: URL; headers: Headers }): string | null {
  const raw = req.nextUrl.searchParams.get("mock");
  if (raw === null) return null;
  return mockSeamAllowedFor(process.env as Record<string, string | undefined>, req.headers.get("host")) ? raw : null;
}

export class LiveProviderBlockedError extends Error {
  readonly code = "LIVE_PROVIDER_BLOCKED";
  constructor(readonly provider: ProviderName, readonly reason: string) {
    super(`live ${provider} call blocked: ${reason}`);
    this.name = "LiveProviderBlockedError";
  }
}

interface NetStats { allowed: Record<string, number>; blocked: Record<string, number>; since: string }
const g = globalThis as unknown as { __sbProviderNet?: NetStats };
const stats = (): NetStats => (g.__sbProviderNet ??= { allowed: {}, blocked: {}, since: new Date().toISOString() });

/** counters only — never a URL, prompt, payload or key */
export const providerNetStats = (): NetStats => JSON.parse(JSON.stringify(stats()));

/** the transport check. Throws (and counts) unless the server is explicitly live. `origin` is a route label for the log. */
export function assertLiveAllowed(provider: ProviderName, origin: string, referer?: string | null): void {
  const d = providerMode();
  if (d.mode === "live") {
    stats().allowed[provider] = (stats().allowed[provider] ?? 0) + 1;
    return;
  }
  stats().blocked[provider] = (stats().blocked[provider] ?? 0) + 1;
  let page = "";
  try {
    page = referer ? new URL(referer).pathname + new URL(referer).search : "";
  } catch { /* unparseable referer — omit */ }
  console.error(`[provider-gate] BLOCKED live ${provider} call from ${origin} (mode=mock: ${d.reason})${page ? ` page=${page.slice(0, 300)}` : ""}`);
  throw new LiveProviderBlockedError(provider, d.reason);
}

/** a fetch that re-checks the gate on EVERY request — the DeepSeek client's transport */
export function gatedFetch(provider: ProviderName, origin: string): typeof fetch {
  return (input, init) => {
    assertLiveAllowed(provider, origin);
    return fetch(input, init);
  };
}

/** the only way to obtain a DeepSeek client. Throws `LiveProviderBlockedError` unless the server is explicitly live. */
export function deepseekClient(apiKey: string, origin: string, referer?: string | null): OpenAI {
  if (providerMode().mode !== "live") assertLiveAllowed("deepseek", origin, referer); // throws + counts; construction itself is not a request
  return new OpenAI({ apiKey, baseURL: DEEPSEEK_BASE_URL, fetch: gatedFetch("deepseek", origin) });
}

/** the marker a blocked route adds to its ordinary "provider unavailable" response */
export const BLOCKED_MARKER = { aiBlocked: "LIVE_PROVIDER_BLOCKED" } as const;
export const BLOCKED_HEADER = "x-sb-provider-blocked";

/** route helper: true (after counting + logging) when the server may not reach `provider`; the caller then returns its
 *  ordinary "provider unavailable" shape with BLOCKED_MARKER and BLOCKED_HEADER */
export function blockedUnlessLive(provider: ProviderName, origin: string, req: { headers: Headers }): boolean {
  try {
    assertLiveAllowed(provider, origin, req.headers.get("referer"));
    return false;
  } catch (e) {
    if (e instanceof LiveProviderBlockedError) return true;
    throw e;
  }
}
