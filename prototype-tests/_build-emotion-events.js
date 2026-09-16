/* SYSTEMBOOM — R3.9 SIGNATURE EMOTION ENGINE: the free ENERGY forms.
   During an emotional event the feeling briefly ESCAPES the chamber into the Moment's local
   space. These are the escaped forms: the same core drawings the chamber uses, rendered
   standalone with soft emission falloff — energy, never stickers. One directional key light
   (upper-left) is baked into the drawings' own gradients, so a form lit from the wrong side
   cannot happen. Built from the shared compositor module; repeatable and auditable.
     node prototype-tests/_build-emotion-events.js */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { launch, sleep } = require("./lib");
const C = require("./_build-emotion-cores");

/** local r=100 frame, centred in 256; a soft emission halo that dies quickly (§6, §16) */
function energySVG(inner, accent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <radialGradient id="halo" cx="50%" cy="46%" r="48%"><stop offset="0%" stop-color="${accent}" stop-opacity=".22"/><stop offset="62%" stop-color="${accent}" stop-opacity=".06"/><stop offset="100%" stop-color="${accent}" stop-opacity="0"/></radialGradient>
  </defs>
  <circle cx="128" cy="124" r="106" fill="url(#halo)"/>
  <g transform="translate(128 128) scale(1.14)">${inner}</g>
</svg>`;
}

/* a single celebrate EMBER (one fragment, so sparks can fly as individuals with real arcs) */
const EMBER = `
  <radialGradient id="em" cx="42%" cy="36%" r="72%"><stop offset="0%" stop-color="#fff3da"/><stop offset="45%" stop-color="#ff9a36"/><stop offset="100%" stop-color="#b53a0c"/></radialGradient>
  <circle r="34" fill="url(#em)"/>
  <circle cx="-10" cy="-12" r="9" fill="#ffffff" opacity=".65"/>`;

/* a single joy RAY (a soft petal of light, rotated per instance in CSS) */
const RAY = `
  <linearGradient id="ray" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#ffdf52" stop-opacity="0"/><stop offset="45%" stop-color="#ffdf52" stop-opacity=".85"/><stop offset="100%" stop-color="#fff7d6"/></linearGradient>
  <path d="M0 40 C -16 6 -12 -46 0 -78 C 12 -46 16 6 0 40 Z" fill="url(#ray)"/>`;

/* one laugh WAVE ring (expanded in CSS; two instances phase the rhythm) */
const WAVE = `
  <radialGradient id="wv" cx="50%" cy="50%" r="50%"><stop offset="58%" stop-color="#ffb13e" stop-opacity="0"/><stop offset="74%" stop-color="#ffb13e" stop-opacity=".85"/><stop offset="86%" stop-color="#fff0cf" stop-opacity=".55"/><stop offset="100%" stop-color="#ffb13e" stop-opacity="0"/></radialGradient>
  <circle r="96" fill="url(#wv)"/>`;

/* Support's embracing ARC — one side; the other is the same asset mirrored in CSS */
const ARC = `
  <linearGradient id="arm" x1="0" y1="1" x2="0.4" y2="0"><stop offset="0%" stop-color="#1e6a4e"/><stop offset="55%" stop-color="#3fae85"/><stop offset="100%" stop-color="#c5f0df"/></linearGradient>
  <path d="M -18 -78 C -66 -58 -78 6 -50 58" stroke="url(#arm)" stroke-width="30" fill="none" stroke-linecap="round"/>
  <circle cx="-18" cy="-78" r="17" fill="url(#arm)"/>`;

const PIECES = {
  "care-energy": energySVG(C.CORES.care, "#ff5f7e"),
  "joy-energy": energySVG(C.CORES.joy, "#ffb63e"),
  "laugh-energy": energySVG(C.CORES.laugh, "#ff9a3e"),
  "wow-energy": energySVG(C.CORES.wow, "#5fa8e6"),
  "celebrate-energy": energySVG(C.CORES.celebrate, "#ff8a2e"),
  "support-energy": energySVG(C.CORES.support, "#3e9e78"),
  "joy-ray": energySVG(RAY, "#ffb63e"),
  "laugh-wave": `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><g transform="translate(128 128)">${WAVE}</g></svg>`,
  "celebrate-ember": energySVG(EMBER, "#ff8a2e"),
  "support-arc": energySVG(ARC, "#3e9e78"),
};

(async () => {
  const { browser, page } = await launch();
  await page.setViewport({ width: 256, height: 256, deviceScaleFactor: 1 });
  for (const [name, svg] of Object.entries(PIECES)) {
    const f = path.join(C.TMP, `ev-${name}.html`);
    fs.writeFileSync(f, `<style>*{margin:0}body{width:256px;height:256px;background:transparent}</style>${svg}`);
    await page.goto("file://" + f, { waitUntil: "networkidle0" });
    await sleep(60);
    const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: 256, height: 256 } });
    const buf = await sharp(png).resize(160, 160).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toBuffer();
    fs.writeFileSync(path.join(C.OUT, `${name}.webp`), buf);
    console.log(`${name}.webp`.padEnd(24), String(buf.length).padStart(6), "B");
  }
  await browser.close();
})();
