/* SYSTEMBOOM — R3.8 EMOTION HORIZON: the CORE OBJECTS + the dormant vessel.
   The picker shows ONE mascot (the vessel) and the emotions as small 3D CORE OBJECTS: each core
   is a lit, translucent orb — one directional light from the upper-left, a specular, a dark
   inner rim, the emotion's internal form inside. The quick six use the bespoke R3.5 core
   drawings; the extended twelve are PROVISIONAL family-toned orbs carrying their registry
   glyph as an internal form (stated as provisional, like their mascot art was). Also builds the
   NEUTRAL DORMANT CHAMBER vessel (empty bore) for the closed control and the hero at rest.
     node prototype-tests/_build-emotion-horizon.js */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { launch, sleep } = require("./lib");
const C = require("./_build-emotion-cores");

const FAMILY = { warmth: "#E06A88", energy: "#E8A13C", wonder: "#5FA8E6", connection: "#3E9E78" };
const QUICK = { care: "warmth", joy: "energy", laugh: "energy", wow: "wonder", celebrate: "energy", support: "connection" };
/* registry glyphs (path data copied from expressions.tsx marks; box = viewBox side) */
const EXT = {
  proud: { f: "energy", box: 20, g: `<path d="M4.6 3.4h10.8v6.2a5.4 5.4 0 0 1-10.8 0z" stroke-width="2.1"/><path d="M7.6 15.6h4.8M10 14.9v.7" stroke-width="2.1"/>` },
  speechless: { f: "wonder", box: 20, g: `<path d="M16.6 9.4c0 3.3-2.9 5.9-6.6 5.9-.9 0-1.8-.2-2.6-.5L3.4 16.4l1.2-3.2a5.5 5.5 0 0 1-1.2-3.8C3.4 6.1 6.3 3.5 10 3.5s6.6 2.6 6.6 5.9z" stroke-width="2"/>` },
  love: { f: "warmth", box: 20, g: `<path d="M8.4 17C4 13.9 2 11.7 2 9.2 2 7.4 3.4 6 5.2 6c1.2 0 2.3.7 3.2 1.8C9.3 6.7 10.4 6 11.6 6c1.8 0 3.2 1.4 3.2 3.2 0 2.5-2 4.7-6.4 7.8z" fill="url(#glyph)" stroke="none"/><path d="M14.4 5.4c2.4-.2 4 1.3 4 3.3 0 1.4-.8 2.7-2.3 4.1" stroke-width="1.9"/>` },
  thanks: { f: "warmth", box: 24, g: `<path d="M4.4 15.4c2.2 3 4.8 4.5 7.6 4.5s5.4-1.5 7.6-4.5" stroke-width="2.5"/>` },
  touched: { f: "warmth", box: 20, g: `<circle cx="10" cy="10" r="2" fill="url(#glyph)" stroke="none"/><path d="M14.4 5.6a6.2 6.2 0 0 1 0 8.8M17.6 2.4a10.8 10.8 0 0 1 0 15.2" stroke-width="1.9"/>` },
  withyou: { f: "connection", box: 24, g: `<path d="M2.6 19.4c0-3.4 2.4-5.6 5.4-5.6s5.4 2.2 5.4 5.6M13 19.4c0-3.4 2.2-5.6 4.6-5.6 1.5 0 2.9.6 3.8 1.7" stroke-width="2.4"/>` },
  respect: { f: "connection", box: 24, g: `<path d="M5 19h14M8.2 19c-2.4-1.6-3.6-3.7-3.9-6.4M15.8 19c2.4-1.6 3.6-3.7 3.9-6.4" stroke-width="2.4"/>` },
  inspired: { f: "wonder", box: 20, g: `<path d="M5 11.6 10 6.4l5 5.2M5 17 10 11.8l5 5.2" stroke-width="2.3"/>` },
  curious: { f: "wonder", box: 20, g: `<path d="M5.6 14.6c-2.4-2.4-2.4-6.2 0-8.6M9.4 12.4c-1.2-1.2-1.2-3.2 0-4.4" stroke-width="2.2"/><circle cx="14.4" cy="10.2" r="1.7" fill="url(#glyph)" stroke="none"/>` },
  agree: { f: "connection", box: 20, g: `<path d="M3.6 10.8 8 15.2 16.6 5.4" stroke-width="2.6"/>` },
  thinking: { f: "wonder", box: 20, g: `<circle cx="5.4" cy="14.6" r="1.5" fill="url(#glyph)" stroke="none"/><circle cx="10" cy="11.4" r="2" fill="url(#glyph)" stroke="none"/><circle cx="15" cy="7.2" r="2.6" fill="url(#glyph)" stroke="none"/>` },
  nostalgia: { f: "warmth", box: 20, g: `<path d="M3.4 10a6.6 6.6 0 1 0 2-4.7" stroke-width="2.2"/><path d="M2.6 2.8v3.8h3.8" stroke-width="2.2"/><path d="M10 6.8V10l2.4 1.6" stroke-width="2"/>` },
};

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };

/** the ORB: a lit translucent sphere, one key light upper-left, containing the emotion form */
function orbSVG(inner, family, { glyph = false } = {}) {
  const light = mix(family, "#ffffff", 0.55);
  const deep = mix(family, "#05040a", 0.72);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <radialGradient id="body" cx="38%" cy="30%" r="76%"><stop offset="0%" stop-color="${light}" stop-opacity=".62"/><stop offset="42%" stop-color="${family}" stop-opacity=".30"/><stop offset="100%" stop-color="${deep}" stop-opacity=".88"/></radialGradient>
    <radialGradient id="spec" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ffffff" stop-opacity=".85"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
    <radialGradient id="floor" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${light}" stop-opacity=".35"/><stop offset="100%" stop-color="${light}" stop-opacity="0"/></radialGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#000000" stop-opacity=".6"/><stop offset="55%" stop-color="${family}" stop-opacity=".25"/><stop offset="100%" stop-color="${light}" stop-opacity=".85"/></linearGradient>
    <linearGradient id="glyph" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="${light}"/></linearGradient>
    <clipPath id="orb"><circle cx="128" cy="128" r="104"/></clipPath>
  </defs>
  <circle cx="128" cy="128" r="104" fill="url(#body)"/>
  <g clip-path="url(#orb)">
    <!-- reflected core light pooling on the sphere floor -->
    <ellipse cx="136" cy="176" rx="70" ry="28" fill="url(#floor)"/>
    <g transform="translate(128 130) scale(${glyph ? 0.80 : 1.0})">${inner}</g>
    <!-- depth: the far inner wall darkens away from the light -->
    <circle cx="128" cy="128" r="104" fill="none" stroke="#000" stroke-opacity=".30" stroke-width="22"/>
    <path d="M 40 170 A 104 104 0 0 0 190 218" stroke="#000" stroke-opacity=".35" stroke-width="22" fill="none" stroke-linecap="round"/>
  </g>
  <circle cx="128" cy="128" r="103" fill="none" stroke="url(#rim)" stroke-width="3"/>
  <!-- one specular from the key light; a fainter secondary on the lit lower-right edge -->
  <ellipse cx="90" cy="76" rx="36" ry="18" fill="url(#spec)" transform="rotate(-30 90 76)"/>
  <ellipse cx="176" cy="196" rx="20" ry="7" fill="url(#spec)" opacity=".35" transform="rotate(-30 176 196)"/>
</svg>`;
}
/** an extended glyph in the r=100 core frame: box → 200 units, centred */
const glyphInner = (e) => `<g fill="none" stroke="url(#glyph)" stroke-linecap="round" stroke-linejoin="round" transform="translate(-100 -100) scale(${200 / e.box})">${e.g}</g>`;

(async () => {
  const { browser, page } = await launch();
  await page.setViewport({ width: 256, height: 256, deviceScaleFactor: 1 });
  const render = async (svg, name, size) => {
    const f = path.join(C.TMP, `orb-${name}.html`);
    fs.writeFileSync(f, `<style>*{margin:0}body{width:256px;height:256px;background:transparent}</style>${svg}`);
    await page.goto("file://" + f, { waitUntil: "networkidle0" });
    await sleep(60);
    const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: 256, height: 256 } });
    const buf = await sharp(png).resize(size, size).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer();
    fs.writeFileSync(path.join(C.OUT, `${name}.webp`), buf);
    console.log(`${name}.webp`.padEnd(26), String(buf.length).padStart(6), "B");
  };
  // quick six — bespoke cores; the drawings live in the compositor
  for (const [id, fam] of Object.entries(QUICK)) await render(orbSVG(C.CORES[id], FAMILY[fam]), `${id}-core`, 128);
  // extended twelve — provisional family orbs carrying their glyph
  for (const [id, e] of Object.entries(EXT)) await render(orbSVG(glyphInner(e), FAMILY[e.f], { glyph: true }), `${id}-core`, 128);

  // the NEUTRAL DORMANT CHAMBER: the vessel with an empty bore — hero at rest, closed control
  await page.setViewport({ width: C.W, height: C.H, deviceScaleFactor: 2 });
  const srcData = fs.readFileSync(C.SRC).toString("base64");
  const f = path.join(C.TMP, "page-neutral-chamber.html");
  fs.writeFileSync(f, `<style>*{margin:0}body{width:${C.W}px;height:${C.H}px;position:relative;background:transparent}img,svg{position:absolute;inset:0;width:${C.W}px;height:${C.H}px}</style><img src="data:image/png;base64,${srcData}"><div>${C.chamberSVG("", false, "neutral", "full")}</div>`);
  await page.goto("file://" + f, { waitUntil: "networkidle0" });
  await sleep(120);
  const master = path.join(C.TMP, "master-neutral-chamber.png");
  await page.screenshot({ path: master, omitBackground: true, clip: { x: 0, y: 0, width: C.W, height: C.H } });
  const files = {
    "neutral-chamber-md.webp": await C.squareCrop(master, C.win({ x0: 0, x1: 1, y0: 0, y1: 1 }), 128, 2),
    "neutral-chamber-lg.webp": await C.squareCrop(master, C.win({ x0: 0, x1: 1, y0: 0, y1: 1 }), 256, 2),
    "neutral-chamber-lens-xs.webp": await C.squareCrop(master, C.win(C.LENS35.xs), C.LENS_SIZE.xs, 2),
    "neutral-chamber-lens-sm.webp": await C.squareCrop(master, C.win(C.LENS35.sm), C.LENS_SIZE.sm, 2),
    "neutral-chamber-lens-md.webp": await C.squareCrop(master, C.win(C.LENS35.md), C.LENS_SIZE.md, 2),
  };
  for (const [name, buf] of Object.entries(files)) { fs.writeFileSync(path.join(C.OUT, name), buf); console.log(name.padEnd(26), String(buf.length).padStart(6), "B"); }
  await browser.close();
})();
