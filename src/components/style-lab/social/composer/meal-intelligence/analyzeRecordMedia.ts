/**
 * SOCIAL-4 — the ONE boundary between the Composer's PROJECT · PROBLEM · MEETING · HEALTH UI and their specialist reading (same
 * shape as `analyzeMealMedia` / `analyzeActivityMedia`). Components call only this; the provider and the exact
 * `/api/analyze-record` request are invisible above this line. Sends encoded image bytes (or client keyframes for a video), the
 * post's own words and the category — nothing else. Resolves `null` on any failure; never throws, never blocks Save.
 * Test seam: a page loaded with `&mockrecord=<scenario>[:<delayMs>]` asks the route for a canned reading.
 */
import type { RecordAIObservation, RecordKindAI } from "../../data";
import { extractVideoKeyframes } from "./keyframes";

function mockParam(): string | null {
  try {
    return typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("mockrecord") : null;
  } catch {
    return null;
  }
}
const CLIENT_TIMEOUT_MS = 33_000;

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

/**
 * V3 vision input: documents (Meeting · Health) and plans/mockups (Project) keep a long edge of 1792px so headings and
 * tables stay readable; Problem scenes fit 1280px. Smaller images are never upscaled; a failure to draw keeps the original.
 */
const MAX_EDGE: Record<RecordKindAI, number> = { project: 1792, problem: 1280, meeting: 1792, health: 1792 };
async function fitDataUrl(dataUrl: string, maxEdge: number): Promise<string> {
  if (typeof document === "undefined") return dataUrl;
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("decode"));
      img.src = dataUrl;
    });
    const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
    if (scale >= 1) return dataUrl;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.9);
  } catch {
    return dataUrl;
  }
}

export interface AnalyzeRecordInput {
  category: RecordKindAI;
  photoUrls?: string[];
  videoUrl?: string;
  /** the person's own words in this post — primary evidence for these four categories */
  text?: string;
  signal?: AbortSignal;
}

export async function analyzeRecordMedia(input: AnalyzeRecordInput): Promise<RecordAIObservation | null> {
  try {
    const images: string[] = [];
    for (const url of input.photoUrls ?? []) {
      const dataUrl = await urlToDataUrl(url);
      if (dataUrl) images.push(await fitDataUrl(dataUrl, MAX_EDGE[input.category]));
    }
    if (input.videoUrl) images.push(...(await extractVideoKeyframes(input.videoUrl)));
    const text = (input.text ?? "").trim();
    if (images.length === 0 && !text) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
    const onExternalAbort = () => controller.abort();
    input.signal?.addEventListener("abort", onExternalAbort);
    try {
      const mock = mockParam();
      const qs = mock !== null ? `?mock=${encodeURIComponent(mock)}` : "";
      const res = await fetch(`/api/analyze-record${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: input.category, images: images.map((dataUrl) => ({ dataUrl })), text }),
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { observation?: RecordAIObservation | null };
      return data.observation ?? null;
    } finally {
      clearTimeout(timer);
      input.signal?.removeEventListener("abort", onExternalAbort);
    }
  } catch {
    return null;
  }
}
