/**
 * SYSTEMBOOM SIE P2-B1 — client side of canonical media identity (LOCAL DEVELOPMENT ONLY).
 *
 * Prototype asset ids ("up-1-IMG") are temporary: a module counter that restarts on every page load. This module
 *  (1) gives each page load a random `SESSION_KEY` (NOT an identity — it only keeps repeated temporary ids apart),
 *  (2) registers an uploaded file's SHA-256 + mime + size with `/api/media/register` and remembers the returned
 *      canonical id in a module map (deliberately NOT on the asset object, so the accepted asset-immutability checks
 *      stay byte-identical), and
 *  (3) builds the opaque headers the analysis clients attach so the server can link an invocation/observation to the
 *      canonical media row. Headers only: no request body and no provider payload changes.
 * Registration is best effort and never blocks the person: any failure is silent.
 */
export const SESSION_KEY: string = (() => {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch { /* fall through */ }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
})();

export interface AssetRef {
  id: string;
  origin: "upload" | "library";
  /** P2-B2 — which application asked (telemetry only; never part of a cache key) */
  entry?: "social_composer" | "circle_of_life";
}

/** uploads carry the "up-" prefix (see media-assets.ts); everything else is a library fixture */
export const assetRefOf = (id: string, entry?: AssetRef["entry"]): AssetRef => ({ id, origin: id.startsWith("up-") ? "upload" : "library", ...(entry ? { entry } : null) });

const canonical = new Map<string, string>();
export const canonicalIdOf = (assetId: string): string | undefined => canonical.get(assetId);

export function heimHeaders(ref?: AssetRef): Record<string, string> {
  if (!ref) return {};
  return { "X-SB-Session": ref.origin === "upload" ? SESSION_KEY : "library", "X-SB-Asset": ref.id, "X-SB-Asset-Origin": ref.origin, ...(ref.entry ? { "X-SB-Entry": ref.entry } : null) };
}

const MAX_HASH_BYTES = 64 * 1024 * 1024; // larger files are not hashed in memory; the server then falls back to the bytes it receives

/** hash the ORIGINAL file and register it; resolves the canonical media id, or null (silently) on any failure */
export async function registerCanonicalMedia(assetId: string, file: File): Promise<string | null> {
  try {
    if (file.size > MAX_HASH_BYTES || typeof crypto === "undefined" || !crypto.subtle) return null;
    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    const sha256 = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
    const res = await fetch("/api/media/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionKey: SESSION_KEY, assetId, origin: "upload", sha256, mime: file.type || null, size: file.size }),
    });
    if (!res.ok) return null;
    const { mediaId } = (await res.json()) as { mediaId?: string | null };
    if (mediaId) canonical.set(assetId, mediaId);
    return mediaId ?? null;
  } catch {
    return null;
  }
}
