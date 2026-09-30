/**
 * UC-C3 §10–§13 — MEDIA ASSETS for the composer.
 *
 * MEDIA ASSET ≠ HUMAN RECORD ≠ SOCIAL POST. "My Media" is the account's existing asset
 * library (the mock LIBRARY — photos AND fixture videos). "Upload"/"Camera" are REAL in
 * this prototype: files chosen from the device become session-scoped assets via object
 * URLs (drafts and the store are in-memory, so session scope is the honest persistence
 * boundary — durable upload/storage is the live seam). Selecting an existing asset REUSES
 * its reference (§13): nothing is duplicated, re-uploaded or copied.
 *
 * Remove in the composer unlinks from THIS draft only (§17) — a session asset stays
 * registered so re-adding it reuses the same reference.
 *
 * §57 UPLOAD FAILURES — documented honestly, not faked: a device file becomes a local
 * `object URL` synchronously, with no network transfer to fail, so there is no real
 * "upload failed, Retry" state to build here (that is a live-backend seam). What CAN
 * happen in this prototype — a file the browser cannot decode — degrades the SAME quiet
 * way every other media surface in the product does (`Media.tsx`'s `SafeImg`): the
 * composer's `Thumb` component swaps a broken-image icon for a labeled placeholder, and
 * the asset stays selected rather than silently vanishing.
 */
import { LIBRARY, type MediaAsset } from "../data";
import { extractSourceMetadata } from "./media-metadata";
import { reverseGeocode } from "./geocode-client";

/** ONE configurable technical limit (§11) — never a "10" scattered through the UI. */
export const MEDIA_LIMIT = 10;

const session: MediaAsset[] = [];
let seq = 0;

/** Every asset the composer can reference: My Media (account) + this session's uploads. */
export function allAssets(): MediaAsset[] {
  return [...LIBRARY, ...session];
}

export function assetById(id: string): MediaAsset | undefined {
  return LIBRARY.find((a) => a.id === id) ?? session.find((a) => a.id === id);
}

/**
 * §10/§11 — register device files (multi-select, photos and videos mixed) as assets.
 * Dimensions/durations are read from the real file when the browser has decoded it;
 * until then a sane frame ratio stands in (presentation only — never record truth).
 *
 * UC-C4.4 — for a real PHOTO, real EXIF is read here too (the only point the raw `File`
 * reference is still in scope — it is never retained on the asset itself). Extraction is
 * async and best-effort: a photo with no EXIF, or one whose metadata is corrupted, simply
 * never gets `takenAt`/`takenPlace` populated — the SAME quiet, error-free path a fixture
 * asset with no hand-authored metadata already takes. `onMetadataReady` (optional) is
 * called once time resolves and again if/when a place resolves, so the Composer can
 * re-derive its draft state from the now-populated asset — reusing the EXISTING
 * `applyDetectedMetadata` mechanism verbatim; nothing about that logic changes here.
 * Video EXIF/GPS extraction is a documented live seam, not attempted in this pass (see
 * AGENTS.md "Phase UC-C4.4").
 */
export function registerUploads(files: FileList | File[], onMetadataReady?: (id: string) => void): MediaAsset[] {
  const added: MediaAsset[] = [];
  for (const f of Array.from(files)) {
    const isVideo = f.type.startsWith("video/");
    if (!isVideo && !f.type.startsWith("image/")) continue; // §10 — photos/videos here; documents are a live seam
    const url = URL.createObjectURL(f);
    const asset: MediaAsset = {
      id: `up-${++seq}-${f.name.replace(/[^a-z0-9]+/gi, "").slice(0, 12) || "file"}`,
      src: url,
      w: 1600,
      h: 1200,
      alt: f.name,
      mediaKind: isVideo ? "video" : "photo",
      duration: isVideo ? "…" : undefined,
    };
    if (isVideo) {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => {
        asset.w = v.videoWidth || asset.w;
        asset.h = v.videoHeight || asset.h;
        const s = Math.round(v.duration || 0);
        asset.duration = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
      };
      v.src = url;
    } else {
      const img = new Image();
      img.onload = () => {
        asset.w = img.naturalWidth || asset.w;
        asset.h = img.naturalHeight || asset.h;
      };
      img.src = url;
      extractSourceMetadata(f).then((meta) => {
        asset.sourceMetadata = meta;
        if (meta.normalized.capturedAt) asset.takenAt = meta.normalized.capturedAt;
        if (meta.normalized.capturedAt) onMetadataReady?.(asset.id);
        const { gps } = meta.normalized;
        if (gps) {
          reverseGeocode(gps.latitude, gps.longitude).then((place) => {
            if (place) {
              asset.takenPlace = place;
              onMetadataReady?.(asset.id);
            }
          });
        }
      });
    }
    session.push(asset);
    added.push(asset);
  }
  return added;
}
