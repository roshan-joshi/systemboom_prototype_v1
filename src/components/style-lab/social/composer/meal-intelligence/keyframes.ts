/**
 * UC-MEAL-AI — client-side video keyframe extraction ONLY. A real video file is NEVER
 * uploaded to the server or any provider (§VIDEO INTELLIGENCE) — a small, representative
 * sample of frames is drawn locally with `<video>` + `<canvas>`, downscaled, and encoded as
 * JPEG data URLs; only those images ever leave the browser.
 *
 * Takes the asset's own `src` (a session upload's local object URL, or a My Media asset's
 * static path) directly — every Composer media asset is addressable this way once attached,
 * so no separate File reference needs to be kept alive past the original attach.
 */

/** Hard ceilings from the brief — never extract more frames, never a larger long edge. */
export const MAX_KEYFRAMES = 5;
export const MAX_KEYFRAME_EDGE = 1024;

function loadVideoMetadata(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("video metadata failed"));
  });
}

function captureFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, time: number): Promise<string | null> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      try {
        const longest = Math.max(video.videoWidth, video.videoHeight) || 1;
        const scale = Math.min(1, MAX_KEYFRAME_EDGE / longest);
        const w = Math.max(1, Math.round(video.videoWidth * scale));
        const h = Math.max(1, Math.round(video.videoHeight * scale));
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(video, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      } catch {
        resolve(null); // a decode/draw failure for this one frame — skip it, never throw
      }
    };
    video.addEventListener("seeked", onSeeked);
    try {
      video.currentTime = time;
    } catch {
      video.removeEventListener("seeked", onSeeked);
      resolve(null);
    }
  });
}

/**
 * Extracts up to MAX_KEYFRAMES frames from the video at `url`, evenly spaced across the clip
 * and pulled slightly inward from both ends (a simple, honest stand-in for scene detection —
 * real scene detection is out of scope for Meal understanding). Resolves to an EMPTY array on
 * ANY failure (corrupted file, unsupported codec, zero duration, no canvas/video support in
 * this environment) — never throws, so a failed extraction never blocks attaching the video or
 * saving the Meal (§VIDEO EXTRACTION FAILURE).
 */
export async function extractVideoKeyframes(url: string): Promise<string[]> {
  if (typeof document === "undefined") return [];
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    video.src = url;
    await loadVideoMetadata(video);
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) return [];
    const count = Math.max(1, Math.min(MAX_KEYFRAMES, Math.ceil(duration)));
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];
    const frames: string[] = [];
    for (let i = 0; i < count; i++) {
      const frac = count === 1 ? 0.5 : (i + 0.5) / count;
      const t = Math.min(Math.max(duration * frac, 0.05), Math.max(duration - 0.05, 0.05));
      const frame = await captureFrame(video, canvas, ctx, t);
      if (frame) frames.push(frame);
    }
    return frames;
  } catch {
    return [];
  }
}
