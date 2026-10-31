/**
 * V3 — the ONE boundary between the Composer's Activity UI and Activity AI (same shape as `analyzeMealMedia`). Activity components
 * call ONLY this function; the provider and the exact `/api/analyze-activity` request/response are invisible above this line.
 *
 * Privacy: the ONLY content sent is encoded image data — no caption, GPS, filename, asset id, user id or account information.
 * Resolves to a normalized observation, or `null` for ANY failure (network, timeout, cancellation, no usable media); never throws
 * and never blocks the caller — Save must stay available whatever this resolves to.
 *
 * Test seam: a page loaded with `&mockactivity=<scenario>[:<delayMs>]` asks the server route for a canned observation (the Meal
 * seam `mockai` is deliberately NOT reused, so the two analyses stay independently scriptable).
 */
import type { ActivityAIObservation } from "../../data";
import { extractVideoKeyframes } from "./keyframes";
import { heimHeaders, type AssetRef } from "../canonical-media";

function mockParam(): string | null {
  try {
    return typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("mockactivity") : null;
  } catch {
    return null;
  }
}

const SINGLE_IMAGE_CLIENT_TIMEOUT_MS = 33_000;
const MULTI_IMAGE_CLIENT_TIMEOUT_MS = 43_000;

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
    return null;
  }
}

export interface AnalyzeActivityMediaInput {
  photoUrls?: string[];
  /** keyframes are extracted client-side; the original file is never sent */
  videoUrl?: string;
  /** P2-B1 — which asset this reading is FOR; sent as opaque headers only (never in the body or the provider payload) */
  assetRef?: AssetRef;
  signal?: AbortSignal;
}

export async function analyzeActivityMedia(input: AnalyzeActivityMediaInput): Promise<ActivityAIObservation | null> {
  try {
    const images: string[] = [];
    for (const url of input.photoUrls ?? []) {
      const dataUrl = await urlToDataUrl(url);
      if (dataUrl) images.push(dataUrl);
    }
    if (input.videoUrl) images.push(...(await extractVideoKeyframes(input.videoUrl)));
    if (images.length === 0) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), images.length > 1 ? MULTI_IMAGE_CLIENT_TIMEOUT_MS : SINGLE_IMAGE_CLIENT_TIMEOUT_MS);
    const onExternalAbort = () => controller.abort();
    input.signal?.addEventListener("abort", onExternalAbort);
    try {
      const mock = mockParam();
      const qs = mock !== null ? `?mock=${encodeURIComponent(mock)}` : "";
      const res = await fetch(`/api/analyze-activity${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...heimHeaders(input.assetRef) },
        body: JSON.stringify({ images: images.map((dataUrl) => ({ dataUrl })) }),
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { observation?: ActivityAIObservation | null };
      return data.observation ?? null;
    } finally {
      clearTimeout(timer);
      input.signal?.removeEventListener("abort", onExternalAbort);
    }
  } catch {
    return null;
  }
}
