/* SYSTEMBOOM — build the shipped mascot assets from the owner's 3D render.
   This is the whole asset pipeline, kept as a file so it is repeatable and auditable when
   the per-expression renders land: drop `{id}.png` beside the source and re-run.

   TIERS (R3.2 §52):
     sm  — the OPTICAL FACE CROP (eyes · brows · mouth + a fuse cue). Summary miniatures and
           the Moment action control. NOT a shrunken whole body (§29, §33).
     md  — the FULL CHARACTER. The Quick deck, where posture is part of the expression.
     lg  — the FULL CHARACTER at review scale. Detail / More / owner review only (§52).

   Geometry is measured from the source's own alpha, then the face window is expressed as
   fractions of that box so a re-render at another resolution still crops correctly.
     node prototype-tests/_build-expression-assets.js */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SRC = "/Users/roshan/SYSTEMBOOM_V2/references/brand/WhatsApp Image 2026-09-15 at 07.40.41.png";
const OUT = "/Users/roshan/SYSTEMBOOM_V2/public/brand/expressions";

/** The face window, as fractions of the alpha box. Measured from the canonical render:
 *  the collar (fuse cue) at the top, both eyes and the brow, the full grin, and the lower
 *  curve of the sphere — nothing above the rope, no empty canvas. */
const FACE = { x0: 0.0, x1: 0.876, y0: 0.357, y1: 0.976 };

async function alphaBox(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/** Fit a region onto a square transparent canvas at `size`, with a little optical padding. */
async function square(file, region, size, pad = 0.03) {
  const p = Math.round(Math.max(region.width, region.height) * pad);
  const cut = await sharp(file).extract(region).png().toBuffer();
  const side = Math.max(region.width, region.height) + p * 2;
  // sharp resizes BEFORE it composites, so the square canvas has to be finished in its own
  // pass and only then scaled — otherwise the patch is pasted onto an already-tiny canvas.
  const padded = await sharp({ create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: cut, left: Math.round((side - region.width) / 2), top: Math.round((side - region.height) / 2) }])
    .png()
    .toBuffer();
  return sharp(padded)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 92, alphaQuality: 100, effort: 6 })
    .toBuffer();
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await alphaBox(SRC);
  console.log("alpha box", b);

  const body = { left: b.minX, top: b.minY, width: b.w, height: b.h };
  const face = {
    left: Math.round(b.minX + b.w * FACE.x0),
    top: Math.round(b.minY + b.h * FACE.y0),
    width: Math.round(b.w * (FACE.x1 - FACE.x0)),
    height: Math.round(b.h * (FACE.y1 - FACE.y0)),
  };
  console.log("face window", face);

  const files = {
    "neutral-sm.webp": await square(SRC, face, 72, 0.02),
    "neutral-md.webp": await square(SRC, body, 128, 0.03),
    "neutral-lg.webp": await square(SRC, body, 256, 0.03),
    // the working reference an artist frames the per-expression faces against
    "neutral-face.webp": await square(SRC, face, 256, 0.02),
  };
  for (const [name, buf] of Object.entries(files)) {
    fs.writeFileSync(path.join(OUT, name), buf);
    console.log(name.padEnd(20), String(buf.length).padStart(7), "bytes");
  }
})();
