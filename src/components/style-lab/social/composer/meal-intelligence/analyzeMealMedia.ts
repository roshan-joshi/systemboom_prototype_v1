/**
 * UC-MEAL-AI — the ONE boundary between Meal UI and Meal AI. Meal components call ONLY this
 * function; DeepSeek, the exact `/api/analyze-meal` request/response shape, and any
 * provider-specific structure are invisible above this line — swapping providers later means
 * changing this file and the server route, never a Meal component (§PROVIDER ABSTRACTION).
 *
 * Takes asset `src` URLs (every Composer media asset — a session upload's object URL, or a My
 * Media asset's static path — is addressable this way once attached), fetches each locally and
 * encodes it as a data URL. Privacy (§SERVER BOUNDARY): the ONLY content sent to the server is
 * that encoded image data. No caption, GPS, filename, asset id, user id, or account
 * information is ever attached here.
 */
import type { MealAIObservation } from "./types";
import { extractVideoKeyframes } from "./keyframes";

/**
 * UC-MEAL-AI test-only determinism seam (same convention as `?mockgeo=1`): a page loaded with
 * `&mockai=<scenario>` or `&mockai=<scenario>:<delayMs>` asks the server route to return a
 * canned, deterministic observation instead of calling DeepSeek — read directly from the URL,
 * never wired through app state/store. Absent in production; the real path never sets this
 * query param. The raw value (scenario, optionally with its delay suffix) is forwarded
 * verbatim to the server, which parses the delay itself.
 */
function mockParam(): string | null {
  try {
    return typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("mockai") : null;
  } catch {
    return null;
  }
}

// Client-side ceilings, deliberately ABOVE the server's own 10s/20s provider timeout
// (§SERVER ROUTE) so the server's own timeout fires first and returns its safe `null` rather
// than the two racing.
const SINGLE_IMAGE_CLIENT_TIMEOUT_MS = 13_000;
const MULTI_IMAGE_CLIENT_TIMEOUT_MS = 23_000;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("blob read failed"));
    reader.readAsDataURL(blob);
  });
}

async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await blobToDataUrl(await res.blob());
  } catch {
    return null; // a decode/network failure for this one asset — skip it, never throw
  }
}

export interface AnalyzeMealMediaInput {
  /** The attached photo assets' own `src` URLs. */
  photoUrls?: string[];
  /** The attached video asset's own `src` URL — keyframes are extracted client-side; the
   *  original file is never sent. */
  videoUrl?: string;
  /** Cancels the in-flight request (unmount/navigation/composition change). */
  signal?: AbortSignal;
}

/**
 * Analyzes attached Meal media and resolves to a normalized `MealAIObservation`, or `null` for
 * ANY reason — no usable media, a non-food image (returns an observation with zero foods, NOT
 * null — only genuine failure resolves to null), a provider/network failure, a timeout, or
 * cancellation. Never throws and never blocks the caller: Meal Save must remain available
 * regardless of what this resolves to (§MEAL SAVE MUST NEVER WAIT FOR AI).
 */
export async function analyzeMealMedia(input: AnalyzeMealMediaInput): Promise<MealAIObservation | null> {
  try {
    const images: string[] = [];
    for (const url of input.photoUrls ?? []) {
      const dataUrl = await urlToDataUrl(url);
      if (dataUrl) images.push(dataUrl);
    }
    if (input.videoUrl) images.push(...(await extractVideoKeyframes(input.videoUrl)));
    if (images.length === 0) return null; // nothing usable to send — a safe, quiet failure

    const controller = new AbortController();
    const clientTimeout = images.length > 1 ? MULTI_IMAGE_CLIENT_TIMEOUT_MS : SINGLE_IMAGE_CLIENT_TIMEOUT_MS;
    const timer = setTimeout(() => controller.abort(), clientTimeout);
    const onExternalAbort = () => controller.abort();
    input.signal?.addEventListener("abort", onExternalAbort);
    try {
      const mock = mockParam();
      const qs = mock !== null ? `?mock=${encodeURIComponent(mock)}` : "";
      const res = await fetch(`/api/analyze-meal${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: images.map((dataUrl) => ({ dataUrl })) }),
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { observation?: MealAIObservation | null };
      return data.observation ?? null;
    } finally {
      clearTimeout(timer);
      input.signal?.removeEventListener("abort", onExternalAbort);
    }
  } catch {
    return null; // network failure, timeout, cancellation — all a normal, quiet outcome
  }
}
