/**
 * SYSTEMBOOM SIE P2-B1 — canonical media registration (LOCAL DEVELOPMENT ONLY).
 *
 * The browser registers an uploaded file's identity here: a SHA-256 of the ORIGINAL bytes plus mime/size and the
 * temporary prototype id. The body never carries the file, its name, GPS, OCR or any observation. The response is the
 * canonical media id; failure is quiet (`mediaId: null`) — registration must never block a person's upload.
 * `session_key` is a random per-page-load token, NOT an authenticated identity.
 */
import { NextRequest, NextResponse } from "next/server";
import { errCode, registerMedia } from "@/lib/intelligence/heim-store";

const ID = /^[A-Za-z0-9._:-]{1,120}$/;
const KEY = /^[A-Za-z0-9._:-]{1,80}$/;
const HEX = /^[0-9a-f]{64}$/;

export async function POST(req: NextRequest) {
  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ mediaId: null }, { status: 400 });
  }
  const { sessionKey, assetId, origin, sha256, mime, size } = b;
  if (typeof sessionKey !== "string" || !KEY.test(sessionKey) || typeof assetId !== "string" || !ID.test(assetId) || origin !== "upload" || typeof sha256 !== "string" || !HEX.test(sha256)) {
    return NextResponse.json({ mediaId: null }, { status: 400 });
  }
  try {
    const r = await registerMedia({
      sessionKey,
      prototypeId: assetId,
      origin: "upload",
      sha256,
      hashBasis: "original",
      mimeType: typeof mime === "string" ? mime.slice(0, 100) : null,
      sizeBytes: typeof size === "number" && Number.isFinite(size) && size >= 0 ? Math.floor(size) : null,
    });
    return NextResponse.json({ mediaId: r?.mediaId ?? null });
  } catch (e) {
    console.error("[heim] media register failed:", errCode(e));
    return NextResponse.json({ mediaId: null });
  }
}
