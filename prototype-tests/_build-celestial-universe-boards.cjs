#!/usr/bin/env node
/* CELESTIAL SOCIAL UNIVERSE — owner review boards (sharp only, no browser).
     node prototype-tests/_build-celestial-universe-boards.cjs
   Builds, from prototype-evidence/celestial-social-universe/ + accepted before-evidence:
     CELESTIAL-SOCIAL-WORLD-BACKGROUND-REVIEW.png   §71 — the REAL PAGE: old · new · master
     CELESTIAL-SOCIAL-PAGE-STATES.png               §69/§70 — every state as a real page
     CELESTIAL-MULTI-PERSON-RESONANCE-BOARD.png     §72 — the constellation at every scale
     CELESTIAL-CONSTELLATION-MOTION-BOARD.png       §73 — arrival / new type / expand */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const EV = path.join(__dirname, "..", "prototype-evidence");
const SRC = path.join(EV, "celestial-social-universe");
const GAP = 14;
const BG = "#101318";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const P = (f) => path.join(SRC, f);

const caption = (text, w, h = 34, size = 15, fill = "#d7deeb") =>
  sharp(Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${h}" fill="${BG}"/><text x="12" y="${h / 2 + size / 2 - 2}" font-family="Helvetica, Arial" font-size="${size}" fill="${fill}">${esc(text)}</text></svg>`,
  )).png().toBuffer();

async function cell(file, label, width) {
  const buf = await sharp(file).resize({ width }).png().toBuffer();
  const meta = await sharp(buf).metadata();
  const cap = await caption(label, width);
  return sharp({ create: { width, height: meta.height + 34, channels: 4, background: BG } })
    .composite([{ input: cap, top: 0, left: 0 }, { input: buf, top: 34, left: 0 }])
    .png().toBuffer();
}
async function row(cells) {
  const metas = await Promise.all(cells.map((c) => sharp(c).metadata()));
  const h = Math.max(...metas.map((m) => m.height));
  const w = metas.reduce((a, m) => a + m.width, 0) + GAP * (cells.length - 1);
  let x = 0;
  const comps = cells.map((c, i) => { const t = { input: c, top: 0, left: x }; x += metas[i].width + GAP; return t; });
  return sharp({ create: { width: w, height: h, channels: 4, background: BG } }).composite(comps).png().toBuffer();
}
async function stack(rows, title, out, pad = 18) {
  const metas = await Promise.all(rows.map((r) => sharp(r).metadata()));
  const w = Math.max(...metas.map((m) => m.width)) + pad * 2;
  const titleCap = await caption(title, w, 46, 20, "#f0f4fb");
  let y = 46 + pad;
  const comps = [{ input: titleCap, top: 0, left: 0 }];
  rows.forEach((r, i) => { comps.push({ input: r, top: y, left: pad }); y += metas[i].height + GAP; });
  await sharp({ create: { width: w, height: y + pad, channels: 4, background: BG } }).composite(comps).png().toFile(out);
  console.log(path.relative(process.cwd(), out));
}

(async () => {
  /* ---- A. THE PAGE WORLD — old vs new vs the master reference (§71) ---- */
  const poster = path.join(__dirname, "..", "references", "celestial-resonance-bible", "concepts", "stage-2-1d", "reference", "owner-lineup-poster.png");
  const pm = await sharp(poster).metadata();
  const half = Math.floor(pm.height / 2);
  fs.writeFileSync(P("_poster-light.png"), await sharp(poster).extract({ left: 0, top: 0, width: pm.width, height: half }).png().toBuffer());
  fs.writeFileSync(P("_poster-dark.png"), await sharp(poster).extract({ left: 0, top: half, width: pm.width, height: pm.height - half }).png().toBuffer());
  const R2 = path.join(EV, "celestial-mastering", "experience-round-2");
  const CW = 620;
  await stack([
    await row([
      await cell(path.join(R2, "closed-light.png"), "OLD light (round 2 — its photo also failed to load: a capture flake)", CW),
      await cell(P("world-light-desktop-feed.png"), "NEW Solar Observatory — real page, feed scroll", CW),
      await cell(P("_poster-light.png"), "MASTER — Solar Observatory reference", CW),
    ]),
    await row([
      await cell(path.join(R2, "closed-dark.png"), "OLD dark (round 2) — flat at feed scroll", CW),
      await cell(P("world-dark-desktop-feed.png"), "NEW Deep Cosmos — real page, feed scroll", CW),
      await cell(P("_poster-dark.png"), "MASTER — Deep Cosmos reference", CW),
    ]),
    await row([
      await cell(P("world-light-desktop-nocontrols.png"), "§74 LIGHT — every Celestial control hidden", CW),
      await cell(P("world-dark-desktop-nocontrols.png"), "§74 DARK — every Celestial control hidden", CW),
      await cell(P("page-dark-open.png"), "NEW dark — the Moment's Celestial Field open", CW),
    ]),
    await row([
      await cell(P("world-light-desktop-top.png"), "NEW light — page top: nav · hero · Life", CW),
      await cell(P("world-dark-desktop-top.png"), "NEW dark — page top: nav · hero · Life", CW),
      await cell(P("page-light-open.png"), "NEW light — the Celestial Field open", CW),
    ]),
    await row([
      await cell(P("world-light-1920-feed.png"), "NEW light 1920 — the walls hold at every width", 466),
      await cell(P("world-dark-1920-feed.png"), "NEW dark 1920", 466),
      await cell(P("world-light-1280-feed.png"), "NEW light 1280", 466),
      await cell(P("world-dark-1280-feed.png"), "NEW dark 1280 — narrowest gutter", 466),
    ]),
    await row([
      await cell(P("world-light-390-top.png"), "light 390 top", 300),
      await cell(P("world-dark-390-top.png"), "dark 390 top", 300),
      await cell(P("world-light-360-feed.png"), "light 360 feed", 300),
      await cell(P("world-dark-360-feed.png"), "dark 360 feed", 300),
      await cell(P("world-light-390-nocontrols.png"), "§74 light 390, no controls", 300),
      await cell(P("world-dark-390-nocontrols.png"), "§74 dark 390, no controls", 300),
    ]),
  ], "CELESTIAL SOCIAL WORLD — BACKGROUND REVIEW · the real page (old · new · master reference)", P("CELESTIAL-SOCIAL-WORLD-BACKGROUND-REVIEW.png"));

  /* ---- D. EVERY STATE AS A REAL PAGE (§69 / §70) ---- */
  const PS = [["closed", "closed (0 people)"], ["open", "Moment open"], ["1p", "1 person"], ["multi-8p", "8 people, 5 meanings"], ["all8-16p", "all 8 · 16 people"], ["56p", "all 8 · 56 people"], ["expanded", "expanded constellation"], ["change-before", "viewer's Saturn"], ["change-after", "viewer changed → Venus"]];
  const dRows = [];
  for (const theme of ["dark", "light"]) {
    dRows.push(await row(await Promise.all(PS.slice(0, 5).map(([k, l]) => cell(P(`page-${theme}-${k}.png`), `${theme.toUpperCase()} — ${l}`, 460)))));
    dRows.push(await row([
      ...(await Promise.all(PS.slice(5).map(([k, l]) => cell(P(`page-${theme}-${k}.png`), `${theme.toUpperCase()} — ${l}`, 460)))),
      await cell(P(`page-${theme}-390.png`), `${theme.toUpperCase()} 390`, 220),
      await cell(P(`page-${theme}-360.png`), `${theme.toUpperCase()} 360`, 220),
    ]));
  }
  await stack(dRows, "CELESTIAL SOCIAL — EVERY STATE AS A REAL PAGE (nav · background · hero/Moment · Life panels)", P("CELESTIAL-SOCIAL-PAGE-STATES.png"));

  /* ---- B. MULTI-PERSON RESONANCE (§72) ---- */
  const S = 470;
  const states = [
    ["m0", "0 people — the doorway alone"],
    ["m1-1p", "1 person — one signal"],
    ["m2-3p", "3 people — two meanings"],
    ["m3-8p", "8 people — five meanings"],
    ["m4-16p", "16 people — all eight"],
    ["m5-56p", "56 people — all eight, equal dignity"],
    ["m6-200same", "200 people — one shared meaning"],
    ["m7-mine", "viewer selected — the personal orbit"],
    ["m9-1204p", "1,204 people — locale-grouped, no shorthand"],
    ["expanded", "the expanded constellation"],
  ];
  const bRows = [];
  for (const [key, label] of states) {
    bRows.push(await row([
      await cell(P(`state-dark-${key}.png`), `DARK — ${label}`, S),
      await cell(P(`state-light-${key}.png`), `LIGHT — ${label}`, S),
    ]));
  }
  bRows.push(await row([
    await cell(P("change-dark-before.png"), "DARK — before: mine is Saturn", S),
    await cell(P("change-dark-after.png"), "DARK — after: mine moved to Venus (same 5 people)", S),
  ]));
  bRows.push(await row([
    await cell(P("strip-dark-gateA.png"), "NO-POPULARITY GATE · A: Venus 2 · Moon 2", S),
    await cell(P("strip-dark-gateB.png"), "B: Venus 45 · Moon 2 — only the number changed", S),
  ]));
  bRows.push(await row([
    await cell(P("strip-light-gateA.png"), "LIGHT · A: Venus 2 · Moon 2", S),
    await cell(P("strip-light-gateB.png"), "LIGHT · B: Venus 45 · Moon 2", S),
  ]));
  bRows.push(await row([
    await cell(P("strip-dark-all8-16.png"), "all 8 at 16 people", S),
    await cell(P("strip-dark-all8-56.png"), "all 8 at 56 people — identical geometry and light", S),
  ]));
  bRows.push(await row([
    await cell(P("phone-dark-360.png"), "DARK 360", 236),
    await cell(P("phone-light-360.png"), "LIGHT 360", 236),
    await cell(P("phone-dark-360-expanded.png"), "DARK 360 expanded", 236),
    await cell(P("phone-light-360-expanded.png"), "LIGHT 360 expanded", 236),
  ]));
  bRows.push(await row([
    await cell(P("locale-ne.png"), "ne", 320),
    await cell(P("locale-ru.png"), "ru", 320),
    await cell(P("locale-zh-Hans.png"), "zh-Hans", 320),
  ]));
  await stack(bRows, "CELESTIAL MULTI-PERSON RESONANCE — one Moment, many human signals, no popularity", P("CELESTIAL-MULTI-PERSON-RESONANCE-BOARD.png"));

  /* ---- C. MOTION (§73) ---- */
  const M = 430;
  await stack([
    await row([
      await cell(P("motion-arrival-0-before.png"), "arrival — before (16 people)", M),
      await cell(P("motion-arrival-1-70ms.png"), "+70ms — the count crossfades", M),
      await cell(P("motion-arrival-2-230ms.png"), "+230ms", M),
      await cell(P("motion-arrival-3-settled.png"), "settled (17 people)", M),
    ]),
    await row([
      await cell(P("motion-newtype-0-before.png"), "new meaning — before (2 types)", M),
      await cell(P("motion-newtype-1-90ms.png"), "+90ms — settles into its canonical place", M),
      await cell(P("motion-newtype-2-settled.png"), "settled (3 types)", M),
    ]),
    await row([
      await cell(P("motion-expand-1-60ms.png"), "the constellation opens — +60ms", M),
      await cell(P("motion-expand-2-settled.png"), "settled", M),
    ]),
  ], "RESONANCE CONSTELLATION — MOTION (one-shot, quiet, reduced-motion complete; a bulk load lands still)", P("CELESTIAL-CONSTELLATION-MOTION-BOARD.png"));
})().catch((e) => { console.error(e); process.exitCode = 1; });
