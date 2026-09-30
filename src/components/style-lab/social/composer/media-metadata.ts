/**
 * UC-C4.4 — AMBIENT MEDIA INTELLIGENCE: real metadata extraction for a freshly attached
 * file (Upload/Camera). This is the ONE place that reads a file's own embedded metadata;
 * everything downstream (recordPlace, Social place, eventTime) derives from what this
 * module produces, never re-parses the file itself.
 *
 * Uses `exifr` (browser-native, zero native deps, actively maintained) — chosen over
 * `exif-js` (unmaintained, callback-only) and a hand-rolled binary parser (no compelling
 * reason to build one). Reading is best-effort and NEVER throws: a photo with no EXIF, a
 * corrupted EXIF segment, or an unsupported format all resolve to "nothing usefully
 * extracted" rather than breaking the attach — no metadata is a completely normal state
 * (§13 of the UC-C4.4 brief), never an error.
 */
import { parse as exifrParse } from "exifr";
import type { SourceMetadata } from "../data";

/**
 * Reads whatever safely-parseable metadata a real file carries. Always resolves (never
 * rejects) — mimeType/fileSize come straight from the File object itself (always
 * available, no parsing needed); everything else is best-effort EXIF.
 */
export async function extractSourceMetadata(file: File): Promise<SourceMetadata> {
  const normalized: SourceMetadata["normalized"] = {
    mimeType: file.type || undefined,
    fileSize: file.size || undefined,
  };
  try {
    // gps:true asks exifr to compute ready-to-use decimal latitude/longitude; omitting a
    // `pick` filter here matters — exifr's derived lat/lon fields are excluded by `pick`.
    const raw = await exifrParse(file, { gps: true });
    if (raw) {
      if (typeof raw.latitude === "number" && typeof raw.longitude === "number") {
        normalized.gps = { latitude: raw.latitude, longitude: raw.longitude };
        if (typeof raw.GPSAltitude === "number") normalized.gps.altitude = raw.GPSAltitude;
      }
      if (raw.DateTimeOriginal instanceof Date && !Number.isNaN(raw.DateTimeOriginal.getTime())) {
        normalized.capturedAt = raw.DateTimeOriginal.toISOString();
      }
      const make = typeof raw.Make === "string" ? raw.Make.trim() : undefined;
      const model = typeof raw.Model === "string" ? raw.Model.trim() : undefined;
      const lens = typeof raw.LensModel === "string" ? raw.LensModel.trim() : undefined;
      if (make || model || lens) normalized.device = { make, model, lens };
      if (typeof raw.Orientation === "number") normalized.orientation = raw.Orientation;
    }
  } catch {
    // A corrupted/unsupported metadata section never breaks attachment (§13/§14) — the
    // media itself stays usable; it simply carries no EXIF-derived facts.
  }
  return { schemaVersion: 1, normalized };
}
