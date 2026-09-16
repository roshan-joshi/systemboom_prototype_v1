/* SYSTEMBOOM — R3.5 EMOTION CORE → R3.7 EMOTION CHAMBER: the asset compositor.
   The owner's 3D render is untouched (face, pose, fuse, material). A precision CUTAWAY
   chamber is composited onto the smooth upper-right body panel, revealing a large internal
   EMOTION CORE per quick expression. Rendered in headless Chromium (SVG over the source PNG,
   transparent screenshot), then cut into every tier by sharp. Repeatable and auditable —
   when true per-expression 3D renders land they replace these composites file-for-file.

   R3.7 — the chamber is a BORE SEEN OBLIQUELY, not a badge: the machined lip stays where it
   was, but the actual opening is a smaller circle offset toward the lower-right, so the shell
   wall shows thick on the upper-left and thin on the lower-right (the same cue a real hole
   in a sphere gives). The core sits DEEPER, larger, and partly UNDER the upper-left wall,
   with the wall's cast shadow falling across it and its own light reflecting faintly off the
   lit far wall. No frost, no glow outside the opening, no HUD.
     node prototype-tests/_build-emotion-cores.js [--only care] [--master-only] [--layers] */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { launch, sleep } = require("./lib");

const SRC = "/Users/roshan/SYSTEMBOOM_V2/references/brand/WhatsApp Image 2026-09-15 at 07.40.41.png";
const OUT = "/Users/roshan/SYSTEMBOOM_V2/public/brand/expressions";
const TMP = "/private/tmp/claude-501/-Users-roshan-SYSTEMBOOM-V2/f096ee8b-c6e8-4498-80af-ce16924a15ad/scratchpad/r35";
fs.mkdirSync(TMP, { recursive: true });

/* Geometry in SOURCE pixels (1055×1024; alpha box x231 y90 w594 h841).
   The chamber sits on the smooth upper-right body panel: clear of the collar, the brow,
   the mouth and the fuse — measured from the coordinate grid. */
const CHAMBER = { cx: 694, cy: 581, rx: 90, ry: 99, tilt: -10 };
const W = 1055, H = 1024;

/** Core drawings — each returns SVG inner markup in a local frame where the chamber is a
    circle of radius 100 at (0,0) (we scale/squash to the ellipse outside). Light must live
    INSIDE: every gradient falls to transparent well before the rim. */
const CORES = {
  care: `
    <radialGradient id="amb" cx="50%" cy="45%" r="60%"><stop offset="0%" stop-color="#ff5f7e" stop-opacity=".28"/><stop offset="75%" stop-color="#ff5f7e" stop-opacity="0"/></radialGradient>
    <radialGradient id="core" cx="42%" cy="34%" r="80%"><stop offset="0%" stop-color="#fff1f4"/><stop offset="32%" stop-color="#ff7d96"/><stop offset="70%" stop-color="#e0335f"/><stop offset="100%" stop-color="#8f1038"/></radialGradient>
    <circle r="100" fill="url(#amb)"/>
    <path d="M0 46 C -50 12 -56 -28 -30 -44 C -12 -55 0 -42 0 -30 C 0 -42 12 -55 30 -44 C 56 -28 50 12 0 46 Z" fill="url(#core)"/>
    <ellipse cx="-13" cy="-27" rx="11" ry="7" fill="#ffffff" opacity=".38" transform="rotate(-24)"/>`,
  joy: `
    <radialGradient id="amb" cx="50%" cy="48%" r="62%"><stop offset="0%" stop-color="#ffb63e" stop-opacity=".30"/><stop offset="78%" stop-color="#ffb63e" stop-opacity="0"/></radialGradient>
    <radialGradient id="core" cx="46%" cy="40%" r="70%"><stop offset="0%" stop-color="#fffbe6"/><stop offset="40%" stop-color="#ffdf52"/><stop offset="82%" stop-color="#f0b21e"/><stop offset="100%" stop-color="#a37a08"/></radialGradient>
    <circle r="100" fill="url(#amb)"/>
    ${[0,45,90,135,180,225,270,315].map(a=>`<path d="M0 -36 L 10 -56 L 0 -76 L -10 -56 Z" fill="url(#core)" transform="rotate(${a})"/>`).join("")}
    <circle r="36" fill="url(#core)"/>
    <circle cx="-10" cy="-12" r="10" fill="#ffffff" opacity=".5"/>`,
  laugh: `
    <radialGradient id="amb" cx="50%" cy="48%" r="62%"><stop offset="0%" stop-color="#ff9a3e" stop-opacity=".28"/><stop offset="78%" stop-color="#ff9a3e" stop-opacity="0"/></radialGradient>
    <linearGradient id="core" x1="0" y1="-1" x2="0" y2="1"><stop offset="0%" stop-color="#fff4d0"/><stop offset="60%" stop-color="#ffb13e"/><stop offset="100%" stop-color="#e07414"/></linearGradient>
    <circle r="100" fill="url(#amb)"/>
    <circle cx="0" cy="-34" r="17" fill="#fff3cf"/>
    <path d="M -52 2 A 58 58 0 0 0 52 2" stroke="url(#core)" stroke-width="19" fill="none" stroke-linecap="round"/>
    <path d="M -46 40 A 56 56 0 0 0 46 40" stroke="url(#core)" stroke-width="14" fill="none" stroke-linecap="round" opacity=".85"/>`,
  wow: `
    <radialGradient id="amb" cx="50%" cy="46%" r="62%"><stop offset="0%" stop-color="#5fa8e6" stop-opacity=".30"/><stop offset="78%" stop-color="#5fa8e6" stop-opacity="0"/></radialGradient>
    <radialGradient id="core" cx="46%" cy="38%" r="72%"><stop offset="0%" stop-color="#f2f9ff"/><stop offset="36%" stop-color="#8ecbff"/><stop offset="75%" stop-color="#3b8ada"/><stop offset="100%" stop-color="#164a86"/></radialGradient>
    <circle r="100" fill="url(#amb)"/>
    <path d="M0 -66 L 12 -14 L 62 0 L 12 14 L 0 66 L -12 14 L -62 0 L -12 -14 Z" fill="url(#core)"/>
    <path d="M0 -66 L 12 -14 L 62 0 L 12 14 L 0 66 L -12 14 L -62 0 L -12 -14 Z" fill="url(#core)" transform="rotate(45) scale(.52)" opacity=".9"/>
    <circle cx="-7" cy="-9" r="8" fill="#ffffff" opacity=".6"/>`,
  celebrate: `
    <radialGradient id="amb" cx="50%" cy="50%" r="64%"><stop offset="0%" stop-color="#ff8a2e" stop-opacity=".30"/><stop offset="80%" stop-color="#ff8a2e" stop-opacity="0"/></radialGradient>
    <radialGradient id="core" cx="46%" cy="42%" r="70%"><stop offset="0%" stop-color="#fff0d6"/><stop offset="38%" stop-color="#ff9a36"/><stop offset="100%" stop-color="#d1420c"/></radialGradient>
    <circle r="100" fill="url(#amb)"/>
    <circle r="15" fill="url(#core)"/>
    ${[[-6,-58,4.4],[38,-40,3.8],[58,4,3.4],[40,44,3.2],[-14,56,3.6],[-48,32,3.2],[-56,-18,3.6],[22,-14,2.6],[-24,-30,2.6]].map(([x,y,r])=>`
      <line x1="${x*0.28}" y1="${y*0.28}" x2="${x*0.82}" y2="${y*0.82}" stroke="url(#core)" stroke-width="${r}" stroke-linecap="round" opacity=".85"/>
      <circle cx="${x}" cy="${y}" r="${r+1.6}" fill="url(#core)"/>`).join("")}`,
  support: `
    <radialGradient id="amb" cx="50%" cy="46%" r="62%"><stop offset="0%" stop-color="#3e9e78" stop-opacity=".30"/><stop offset="78%" stop-color="#3e9e78" stop-opacity="0"/></radialGradient>
    <linearGradient id="core" x1="0" y1="1" x2="0" y2="-1"><stop offset="0%" stop-color="#1e6a4e"/><stop offset="55%" stop-color="#3fae85"/><stop offset="100%" stop-color="#c5f0df"/></linearGradient>
    <radialGradient id="orb" cx="44%" cy="38%" r="70%"><stop offset="0%" stop-color="#ffffff"/><stop offset="45%" stop-color="#ffe9c2"/><stop offset="100%" stop-color="#e8a13c"/></radialGradient>
    <circle r="100" fill="url(#amb)"/>
    <circle cx="0" cy="-14" r="26" fill="url(#orb)"/>
    <path d="M -48 -26 C -62 20 -32 52 0 52 C 32 52 62 20 48 -26" stroke="url(#core)" stroke-width="18" fill="none" stroke-linecap="round"/>
    <circle cx="-48" cy="-26" r="12" fill="url(#core)"/>
    <circle cx="48" cy="-26" r="12" fill="url(#core)"/>`,
};

/** R3.6 — FACE support: an emotional eye-light in the big eye's iris, tinted per
    expression, plus a subtle accent tinge over the fuse spark (fuse/spark variation).
    Additive light only — no geometry is touched. */
const ACCENT = { care: "#ff6f8e", joy: "#ffd84a", laugh: "#ffab3a", wow: "#6db8ff", celebrate: "#ff8a36", support: "#43b389" };
function faceSupport(id) {
  const a = ACCENT[id];
  return `
  <radialGradient id="glint" cx="50%" cy="42%" r="60%"><stop offset="0%" stop-color="#ffffff" stop-opacity=".95"/><stop offset="40%" stop-color="${a}" stop-opacity=".7"/><stop offset="100%" stop-color="${a}" stop-opacity="0"/></radialGradient>
  <ellipse cx="414" cy="647" rx="11" ry="8.5" fill="url(#glint)" transform="rotate(-16 414 647)"/>
  <radialGradient id="sparkTinge" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${a}" stop-opacity=".26"/><stop offset="100%" stop-color="${a}" stop-opacity="0"/></radialGradient>
  <circle cx="668" cy="218" r="92" fill="url(#sparkTinge)"/>`;
}

/** Laugh's optional tear cue — a small translucent droplet at the big eye's outer corner. */
const TEAR = `
  <g transform="translate(489 700) rotate(8) scale(1.9)">
    <radialGradient id="tear" cx="40%" cy="30%" r="80%"><stop offset="0%" stop-color="#ffffff" stop-opacity=".95"/><stop offset="45%" stop-color="#bfe0ff" stop-opacity=".9"/><stop offset="100%" stop-color="#5e9ed6" stop-opacity=".85"/></radialGradient>
    <path d="M0 -16 C 7 -4 11 4 11 10 A 11 11 0 1 1 -11 10 C -11 4 -7 -4 0 -16 Z" fill="url(#tear)"/>
    <ellipse cx="-3" cy="4" rx="3" ry="4.5" fill="#ffffff" opacity=".7"/>
  </g>`;

/** R3.7 — the opening (C2) is OFF-CENTRE inside the lip: a bore seen at an angle. Local
    frame: the lip is r=100 at (0,0); the opening is r=84 at (+10,+11). The core is drawn
    around (0,0) at 1.3× so its upper-left is genuinely under the wall. */
const OPENING = { cx: 10, cy: 11, r: 84 };
const CORE_SCALE = 1.3;

/** The chamber itself: lip + oblique bore wall + interior + the core under the wall's
    shadow. `inner` is the expression's core drawing; `mode` picks a layer for the cutaway
    board ("full" | "aperture" | "core"). */
function chamberSVG(inner, withTear, ID, mode = "full") {
  const { cx, cy, rx, ry, tilt } = CHAMBER;
  const O = OPENING;
  const accent = ACCENT[ID] ?? "#9aa8b8";
  const aperture = mode !== "core";
  const core = mode !== "aperture";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="interior" cx="40%" cy="36%" r="78%"><stop offset="0%" stop-color="#150f16"/><stop offset="100%" stop-color="#050307"/></radialGradient>
    <!-- the bore wall: brushed metal, dark where the lip blocks the key light (upper-left), lit far wall -->
    <linearGradient id="wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0b0809"/><stop offset="42%" stop-color="#2a2124"/><stop offset="78%" stop-color="#6a4a30"/><stop offset="100%" stop-color="#c98f57"/></linearGradient>
    <linearGradient id="lipLight" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#000000" stop-opacity=".8"/><stop offset="55%" stop-color="#3a2c22" stop-opacity=".55"/><stop offset="100%" stop-color="#ffd9a0" stop-opacity=".9"/></linearGradient>
    <radialGradient id="seat" cx="50%" cy="50%" r="50%"><stop offset="78%" stop-color="#000" stop-opacity="0"/><stop offset="92%" stop-color="#000" stop-opacity=".40"/><stop offset="100%" stop-color="#000" stop-opacity="0"/></radialGradient>
    <clipPath id="opening"><circle cx="${O.cx}" cy="${O.cy}" r="${O.r}"/></clipPath>
  </defs>
  ${aperture ? `<g transform="translate(${cx} ${cy}) rotate(${tilt}) scale(${rx / 88} ${ry / 88})"><circle r="112" fill="url(#seat)"/></g>` : ""}
  <g transform="translate(${cx} ${cy}) rotate(${tilt}) scale(${rx / 100} ${ry / 100})">
    ${aperture ? `
    <!-- the bore wall between the lip and the opening — thick upper-left, thin lower-right -->
    <path d="M -100 0 A 100 100 0 1 0 100 0 A 100 100 0 1 0 -100 0 Z M ${O.cx - O.r} ${O.cy} A ${O.r} ${O.r} 0 1 1 ${O.cx + O.r} ${O.cy} A ${O.r} ${O.r} 0 1 1 ${O.cx - O.r} ${O.cy} Z" fill="url(#wall)" fill-rule="evenodd"/>
    <!-- interior floor of the chamber -->
    <circle cx="${O.cx}" cy="${O.cy}" r="${O.r}" fill="url(#interior)"/>` : ""}
    <g clip-path="url(#opening)">
      ${core ? `<g transform="scale(${CORE_SCALE})">${inner}</g>` : ""}
      ${aperture ? `
      <!-- the wall's cast shadow falls across the core along the upper-left -->
      <circle cx="${O.cx}" cy="${O.cy}" r="${O.r}" fill="none" stroke="#000" stroke-opacity=".34" stroke-width="34"/>
      <circle cx="${O.cx}" cy="${O.cy}" r="${O.r}" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="16"/>
      <path d="M ${O.cx - O.r + 2} ${O.cy - 20} A ${O.r} ${O.r} 0 0 1 ${O.cx - 16} ${O.cy - O.r + 2}" stroke="#000" stroke-opacity=".62" stroke-width="30" fill="none" stroke-linecap="round"/>
      <!-- lit far wall + the core's own light reflecting off it -->
      <path d="M ${O.cx + O.r - 3} ${O.cy + 18} A ${O.r} ${O.r} 0 0 1 ${O.cx + 4} ${O.cy + O.r - 3}" stroke="#ffe0b0" stroke-opacity=".22" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M ${O.cx + O.r - 3} ${O.cy + 18} A ${O.r} ${O.r} 0 0 1 ${O.cx + 4} ${O.cy + O.r - 3}" stroke="${accent}" stroke-opacity=".30" stroke-width="6" fill="none" stroke-linecap="round"/>
      <!-- one restrained catch-light on the opening: crystal, not frost -->
      <ellipse cx="${O.cx - 22}" cy="${O.cy - 50}" rx="44" ry="15" fill="#ffffff" opacity=".08" transform="rotate(-18 ${O.cx - 22} ${O.cy - 50})"/>` : ""}
    </g>
    ${aperture ? `
    <!-- the opening's edge: dark on the shadow side, a hair of light on the lit side -->
    <circle cx="${O.cx}" cy="${O.cy}" r="${O.r + 1}" fill="none" stroke="#000" stroke-opacity=".7" stroke-width="2.4"/>
    <path d="M ${O.cx + O.r} ${O.cy + 10} A ${O.r} ${O.r} 0 0 1 ${O.cx + 8} ${O.cy + O.r}" stroke="#ffd9a0" stroke-opacity=".55" stroke-width="1.8" fill="none"/>
    <!-- machined lip -->
    <circle r="100" fill="none" stroke="url(#lipLight)" stroke-width="7"/>
    <circle r="104" fill="none" stroke="#0a0705" stroke-opacity=".85" stroke-width="3"/>
    <path d="M 100 26 A 104 104 0 0 1 6 103" stroke="#ffd9a0" stroke-opacity=".65" stroke-width="2.6" fill="none" transform="scale(1.045)"/>` : ""}
  </g>
  ${mode === "full" && ACCENT[ID] ? faceSupport(ID) : ""}
  ${mode === "full" && withTear ? TEAR : ""}
</svg>`;
}

/* Crop windows as fractions of the alpha box — the R3.5 lens shows HALF FACE + CORE. */
const BOX = { x: 231, y: 90, w: 594, h: 841 };
const FACE = { x0: 0.0, x1: 0.876, y0: 0.357, y1: 0.976 };
/* R3.7 §8–§9 — the Boom Lens leads with the EMOTION CHAMBER: enough brow / eye edge / teeth
   to say SYSTEMBOOM, then the core as the largest object. The chamber sits at x .78 · y .58 of
   the alpha box; these windows put it around two-thirds across and let it fill ~45% of the
   lens diameter at XS/SM, a little less at MD (the Spectrum row still shows more face). */
const LENS35 = {
  // R3.8 §11 — the CORE dominates the compact lens: the opening fills ~55% of the window, and
  // the shell cue that survives is the lip, the brushed body and the lower teeth.
  xs: { x0: 0.55, x1: 1.0, y0: 0.42, y1: 0.76 },
  sm: { x0: 0.55, x1: 1.0, y0: 0.42, y1: 0.76 },
  md: { x0: 0.40, x1: 1.0, y0: 0.36, y1: 0.82 },
};
const LENS_SIZE = { xs: 48, sm: 80, md: 112 };
const win = (f) => ({ left: Math.round(BOX.x + BOX.w * f.x0), top: Math.round(BOX.y + BOX.h * f.y0), width: Math.round(BOX.w * (f.x1 - f.x0)), height: Math.round(BOX.h * (f.y1 - f.y0)) });

async function squareCrop(master, region, size, scale) {
  const r = { left: region.left * scale, top: region.top * scale, width: region.width * scale, height: region.height * scale };
  const cut = await sharp(master).extract(r).png().toBuffer();
  const side = Math.max(r.width, r.height);
  const padded = await sharp({ create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: cut, left: Math.round((side - r.width) / 2), top: Math.round((side - r.height) / 2) }])
    .png().toBuffer();
  return sharp(padded).resize(size, size).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer();
}

module.exports = { CORES, ACCENT, chamberSVG, squareCrop, win, LENS35, LENS_SIZE, FACE, BOX, CHAMBER, OPENING, CORE_SCALE, SRC, OUT, TMP, W, H };

if (require.main === module) (async () => {
  const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
  const masterOnly = process.argv.includes("--master-only");
  const layers = process.argv.includes("--layers");
  const { browser, page } = await launch();
  const SCALE = 2;
  await page.setViewport({ width: W, height: H, deviceScaleFactor: SCALE });
  const srcData = fs.readFileSync(SRC).toString("base64");

  for (const id of Object.keys(CORES)) {
    if (only && id !== only) continue;
    const svg = chamberSVG(CORES[id], id === "laugh", id);
    const html = `<style>*{margin:0}body{width:${W}px;height:${H}px;position:relative;background:transparent}img,svg{position:absolute;inset:0;width:${W}px;height:${H}px}</style>
      <img src="data:image/png;base64,${srcData}"><div>${svg}</div>`;
    const f = path.join(TMP, `page-${id}.html`);
    fs.writeFileSync(f, html);
    await page.goto("file://" + f, { waitUntil: "networkidle0" });
    await sleep(120);
    const master = path.join(TMP, `master-${id}.png`);
    await page.screenshot({ path: master, omitBackground: true, clip: { x: 0, y: 0, width: W, height: H } });
    if (layers) {
      // R3.7 board 06 — the chamber in layers: shell (owner render, untouched) → aperture
      // (lip + bore wall + interior, empty) → core alone → the assembled chamber.
      const R = { x: CHAMBER.cx - 190, y: CHAMBER.cy - 190, width: 380, height: 380 };
      const clip = { x: R.x, y: R.y, width: R.width, height: R.height };
      const layer = async (name, body) => {
        fs.writeFileSync(f, `<style>*{margin:0}body{width:${W}px;height:${H}px;position:relative;background:transparent}img,svg{position:absolute;inset:0;width:${W}px;height:${H}px}</style>${body}`);
        await page.goto("file://" + f, { waitUntil: "networkidle0" });
        await sleep(80);
        await page.screenshot({ path: path.join(TMP, `layer-${id}-${name}.png`), omitBackground: true, clip });
      };
      await layer("shell", `<img src="data:image/png;base64,${srcData}">`);
      await layer("aperture", `<div>${chamberSVG("", false, id, "aperture")}</div>`);
      await layer("core", `<div>${chamberSVG(CORES[id], false, id, "core")}</div>`);
      await layer("final", `<img src="data:image/png;base64,${srcData}"><div>${svg}</div>`);
      console.log("layers", id);
    }
    if (masterOnly) { console.log("master", id); continue; }
    const files = {
      [`${id}-md.webp`]: await squareCrop(master, win({ x0: 0, x1: 1, y0: 0, y1: 1 }), 128, SCALE),
      [`${id}-lg.webp`]: await squareCrop(master, win({ x0: 0, x1: 1, y0: 0, y1: 1 }), 256, SCALE),
      [`${id}-sm.webp`]: await squareCrop(master, win(FACE), 72, SCALE),
      [`${id}-lens-xs.webp`]: await squareCrop(master, win(LENS35.xs), LENS_SIZE.xs, SCALE),
      [`${id}-lens-sm.webp`]: await squareCrop(master, win(LENS35.sm), LENS_SIZE.sm, SCALE),
      [`${id}-lens-md.webp`]: await squareCrop(master, win(LENS35.md), LENS_SIZE.md, SCALE),
    };
    for (const [name, buf] of Object.entries(files)) {
      fs.writeFileSync(path.join(OUT, name), buf);
      console.log(name.padEnd(22), String(buf.length).padStart(6), "B");
    }
  }

  // the NEUTRAL lens tiers move to the same R3.5 window so extended lenses share the framing
  if (!only && !masterOnly) {
    for (const [tier, f] of Object.entries(LENS35)) {
      const buf = await (async () => {
        const region = win(f);
        const cut = await sharp(SRC).extract(region).png().toBuffer();
        const side = Math.max(region.width, region.height);
        const padded = await sharp({ create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
          .composite([{ input: cut, left: Math.round((side - region.width) / 2), top: Math.round((side - region.height) / 2) }]).png().toBuffer();
        return sharp(padded).resize(LENS_SIZE[tier], LENS_SIZE[tier]).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer();
      })();
      fs.writeFileSync(path.join(OUT, `neutral-lens-${tier}.webp`), buf);
      console.log(`neutral-lens-${tier}.webp`.padEnd(22), String(buf.length).padStart(6), "B");
    }
  }
  await browser.close();
})();
