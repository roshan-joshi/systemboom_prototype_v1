#!/usr/bin/env node
/**
 * CELESTIAL SOCIAL UNIVERSE — page-environment builder.
 *
 * Generates the page-world assets deterministically (seeded LCG, no Date/Math.random at art
 * time) so the environment is auditable and repeatable like the other _build scripts.
 *
 * THE COMPOSITION PROBLEM, AND WHY THE ASSETS ARE SPLIT. The sky paints a sticky,
 * viewport-sized layer with `background-size: cover`. Cover's crop depends on the window's
 * aspect ratio, so a body placed in the source canvas lands at a different screen position at
 * every desktop size — measured: no single source position keeps a galaxy inside the right
 * gutter at 1280×800, 1440×900, 1440×950, 1536×864 AND 1920×1080. The first desktop capture
 * showed exactly that (crescent sliced by the viewport edge, galaxy cropped away). So the
 * identity-carrying pieces are separate layers the stylesheet anchors to the VIEWPORT EDGES
 * and centres in the real gutter; only the ambient sky is a cover layer:
 *
 *   environment-cosmos.svg            DEEP COSMOS sky (landscape): clustered three-distance
 *                                     star depth, rare bright anchors, edge nebula, the cosmic
 *                                     floor with its luminous horizon. No bodies.
 *   environment-cosmos-crescent.svg   the crescent — a body with a real terminator, lit by the
 *                                     family key light (upper left), atmosphere on the lit limb
 *   environment-cosmos-galaxy.svg     the galaxy — core, disc, two arms: the intentional
 *                                     distant form that replaces the old unexplained r=194 circle
 *   environment-cosmos-portrait.svg   phones: one composition with the bodies at the top
 *   environment-solar.svg             SOLAR OBSERVATORY room (landscape): daylight sky, the
 *                                     sun's light from the upper left, a mountain horizon, a
 *                                     marble floor with dais inlays. No frames.
 *   environment-solar-frame-left.svg  the observatory's window frame — champagne post and
 *   environment-solar-frame-right.svg mullion arching inward, a glass glint — one per wall
 *   environment-solar-portrait.svg    phones: one composition with the frames at the edges
 *
 * Gone: the giant translucent triangles, and the three horizon-wide rib arcs (they read as
 * the "large pale arcs" the owner flagged — architecture now frames the room from its walls
 * instead of crossing behind the content). Key light: upper left. Brand red appears nowhere.
 */
const fs = require("node:fs");
const path = require("node:path");

const OUT = path.join(__dirname, "..", "public", "celestial");

/* Deterministic LCG — same seed, same sky, forever. */
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const r2 = (n) => Math.round(n * 100) / 100;
/* A canvas-wide user-space filter region: a small shape's blur is never clipped square. */
const blur = (id, sd, W, H) =>
  `<filter id="${id}" filterUnits="userSpaceOnUse" x="-300" y="-300" width="${W + 600}" height="${H + 600}"><feGaussianBlur stdDeviation="${sd}"/></filter>`;

/* ─────────────────────────── DEEP COSMOS ─────────────────────────── */
const COSMOS_DEFS = `
<radialGradient id="galaxyCore" cx="50%" cy="50%" r="50%">
  <stop stop-color="#eef3fd" stop-opacity=".95"/><stop offset=".26" stop-color="#c6d3ef" stop-opacity=".6"/><stop offset=".6" stop-color="#8298c9" stop-opacity=".24"/><stop offset="1" stop-color="#5c74a8" stop-opacity="0"/>
</radialGradient>
<radialGradient id="veilB" cx="50%" cy="50%" r="50%"><stop stop-color="#2a3d6e" stop-opacity=".55"/><stop offset="1" stop-color="#2a3d6e" stop-opacity="0"/></radialGradient>
<radialGradient id="veilV" cx="50%" cy="50%" r="50%"><stop stop-color="#3d2c5c" stop-opacity=".46"/><stop offset="1" stop-color="#3d2c5c" stop-opacity="0"/></radialGradient>
<radialGradient id="crescentBody" cx="30%" cy="28%" r="80%">
  <stop stop-color="#d3def2"/><stop offset=".42" stop-color="#94a8cc"/><stop offset="1" stop-color="#3a4866"/>
</radialGradient>`;

function galaxyGroup(g) {
  return `<g transform="rotate(${g.rot} ${g.x} ${g.y})" opacity=".78">
  <ellipse cx="${g.x}" cy="${g.y}" rx="${r2(g.rx * 1.5)}" ry="${r2(g.ry * 1.7)}" fill="url(#veilB)" filter="url(#b16)" opacity=".7"/>
  <ellipse cx="${g.x}" cy="${g.y}" rx="${g.rx}" ry="${g.ry}" fill="url(#galaxyCore)" filter="url(#b12)"/>
  <ellipse cx="${g.x}" cy="${g.y}" rx="${r2(g.rx * 0.45)}" ry="${r2(g.ry * 0.42)}" fill="url(#galaxyCore)" filter="url(#b6)"/>
  <ellipse cx="${g.x}" cy="${g.y}" rx="${r2(g.rx * 0.17)}" ry="${r2(g.ry * 0.24)}" fill="#f4f7fe" opacity=".9" filter="url(#b4)"/>
  <path d="M${r2(g.x - g.rx * 0.95)} ${r2(g.y + g.ry * 0.36)} C${r2(g.x - g.rx * 0.6)} ${r2(g.y + g.ry * 0.95)} ${r2(g.x + g.rx * 0.1)} ${r2(g.y + g.ry)} ${r2(g.x + g.rx * 0.5)} ${r2(g.y + g.ry * 0.55)}" fill="none" stroke="#b4c4e7" stroke-width="${r2(g.ry * 0.14)}" opacity=".34" filter="url(#b6)"/>
  <path d="M${r2(g.x + g.rx * 0.95)} ${r2(g.y - g.ry * 0.36)} C${r2(g.x + g.rx * 0.6)} ${r2(g.y - g.ry * 0.95)} ${r2(g.x - g.rx * 0.1)} ${r2(g.y - g.ry)} ${r2(g.x - g.rx * 0.5)} ${r2(g.y - g.ry * 0.55)}" fill="none" stroke="#98abd4" stroke-width="${r2(g.ry * 0.12)}" opacity=".3" filter="url(#b6)"/>
</g>`;
}
function crescentGroup(c) {
  const night = { x: r2(c.x + c.r * 0.41), y: r2(c.y + c.r * 0.41) };
  return `<mask id="crescent-${c.x}"><rect x="${c.x - c.r * 2}" y="${c.y - c.r * 2}" width="${c.r * 4}" height="${c.r * 4}" fill="#fff"/><circle cx="${night.x}" cy="${night.y}" r="${r2(c.r * 1.03)}" fill="#000"/></mask>
<g opacity=".9">
  <circle cx="${c.x}" cy="${c.y}" r="${r2(c.r * 1.5)}" fill="url(#veilB)" filter="url(#b12)" opacity=".55"/>
  <circle cx="${c.x}" cy="${c.y}" r="${c.r}" fill="#0d1322"/>
  <circle cx="${c.x}" cy="${c.y}" r="${r2(c.r * 0.97)}" fill="url(#crescentBody)" mask="url(#crescent-${c.x})"/>
  <circle cx="${c.x}" cy="${c.y}" r="${r2(c.r * 1.08)}" fill="none" stroke="#a9bde3" stroke-width="${r2(c.r * 0.09)}" opacity=".14" filter="url(#b4)"/>
</g>`;
}
function cosmosFilters(W, H) {
  return [blur("b4", 3, W, H), blur("b6", 5, W, H), blur("b12", 11, W, H), blur("b16", 16, W, H)].join("\n");
}

function buildCosmosSky(L) {
  const { W, H } = L;
  const rand = lcg(L.seed);
  const parts = [];
  const density = (W * H) / (1920 * 1200);
  const clusters = L.clusters.map(([x, y, s]) => ({ x, y, spread: s }));
  const gauss = () => (rand() + rand() + rand()) / 1.5 - 1;
  const star = (x, y, r, o, c) => parts.push(`<circle cx="${r2(x)}" cy="${r2(y)}" r="${r2(r)}" fill="${c}" opacity="${r2(o)}"/>`);
  const CLASSES = [
    { n: Math.round(170 * density), r: [0.45, 0.7], o: [0.14, 0.3], c: "#ccd8f0" }, // far
    { n: Math.round(110 * density), r: [0.7, 1.15], o: [0.26, 0.52], c: "#dce6fa" }, // mid
    { n: Math.round(50 * density), r: [1.15, 1.9], o: [0.46, 0.76], c: "#eef4ff" }, // near
  ];
  for (const cls of CLASSES) {
    for (let i = 0; i < cls.n; i++) {
      let x, y;
      if (rand() < 0.6) {
        const cl = clusters[Math.floor(rand() * clusters.length)];
        x = cl.x + gauss() * cl.spread;
        y = cl.y + gauss() * cl.spread * 0.8;
      } else {
        x = rand() * W;
        y = rand() * (L.floorY - 20);
      }
      if (x < 4 || x > W - 4 || y < 4 || y > L.floorY + 30) continue;
      star(x, y, cls.r[0] + rand() * (cls.r[1] - cls.r[0]), cls.o[0] + rand() * (cls.o[1] - cls.o[0]), cls.c);
    }
  }
  const anchors = L.anchors.map(([x, y], i) => {
    const rr = 1.8 + ((i * 37) % 10) / 12;
    return (
      `<g opacity="${r2(0.64 + ((i * 13) % 10) / 50)}">` +
      `<circle cx="${x}" cy="${y}" r="${r2(rr)}" fill="#f2f6ff"/>` +
      `<path d="M${r2(x - rr * 4.2)} ${y}H${r2(x + rr * 4.2)}M${x} ${r2(y - rr * 4.2)}V${r2(y + rr * 4.2)}" stroke="#dbe7ff" stroke-width="0.7" opacity="0.55"/>` +
      `</g>`
    );
  });
  const keyX = L.crescent ? (L.crescent.x / W) * 100 : 10;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
<linearGradient id="deep" x2="0" y2="1">
  <stop stop-color="#0C1222"/><stop offset=".4" stop-color="#0A0E18"/><stop offset=".78" stop-color="#090C14"/><stop offset="1" stop-color="#06080F"/>
</linearGradient>
<radialGradient id="keyLift" cx="${r2(keyX)}%" cy="4%" r="75%">
  <stop stop-color="#1e2e55" stop-opacity=".55"/><stop offset=".55" stop-color="#14203c" stop-opacity=".2"/><stop offset="1" stop-color="#14203c" stop-opacity="0"/>
</radialGradient>
${COSMOS_DEFS}
<linearGradient id="floor" x2="0" y2="1">
  <stop stop-color="#0a1220" stop-opacity="0"/><stop offset=".35" stop-color="#080d18" stop-opacity=".6"/><stop offset="1" stop-color="#04060b" stop-opacity=".95"/>
</linearGradient>
<linearGradient id="horizonSheen" x2="0" y2="1"><stop stop-color="#86ace0" stop-opacity="0"/><stop offset=".3" stop-color="#86ace0" stop-opacity=".18"/><stop offset="1" stop-color="#86ace0" stop-opacity="0"/></linearGradient>
${cosmosFilters(W, H)}
${blur("b46", L.veilBlur, W, H)}
</defs>
<rect width="${W}" height="${H}" fill="url(#deep)"/>
<rect width="${W}" height="${H}" fill="url(#keyLift)"/>
<!-- nebular structure: low-frequency, edge-weighted, never a wallpaper behind the reading column -->
${L.veils.map(([id, x, y, rx, ry, o]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#${id})" filter="url(#b46)" opacity="${o}"/>`).join("\n")}
${parts.join("\n")}
${L.galaxy ? galaxyGroup(L.galaxy) : ""}
${L.crescent ? crescentGroup(L.crescent) : ""}
<!-- the cosmic floor: the world has a ground — a faint luminous horizon edge, then depth -->
<rect y="${L.floorY}" width="${W}" height="${H - L.floorY}" fill="url(#floor)"/>
<ellipse cx="${W / 2}" cy="${H - 22}" rx="${W * 0.74}" ry="${r2((H - L.floorY) * 0.9)}" fill="none" stroke="#91b2dc" stroke-width="1.4" opacity=".26"/>
<ellipse cx="${W / 2}" cy="${H - 20}" rx="${W * 0.74}" ry="${r2((H - L.floorY) * 0.9)}" fill="none" stroke="#7ea6d9" stroke-width="13" opacity=".1" filter="url(#b16)"/>
<rect x="0" y="${L.floorY + 14}" width="${W}" height="${r2((H - L.floorY) * 0.46)}" fill="url(#horizonSheen)" opacity=".55"/>
${anchors.join("\n")}
</svg>`;
}

/* A standalone celestial body on a transparent canvas, for an edge-anchored layer. */
function buildBody(kind) {
  const W = kind === "galaxy" ? 320 : 160;
  const H = kind === "galaxy" ? 200 : 160;
  const inner = kind === "galaxy"
    ? galaxyGroup({ x: 160, y: 100, rx: 116, ry: 38, rot: -24 })
    : crescentGroup({ x: 80, y: 80, r: 50 });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${COSMOS_DEFS}
${cosmosFilters(W, H)}
</defs>
${inner}
</svg>`;
}

/* ───────────────────────── SOLAR OBSERVATORY ───────────────────────── */
const SOLAR_DEFS = `
<linearGradient id="metal" x2="0" y2="1">
  <stop stop-color="#e2cc98"/><stop offset=".45" stop-color="#c9a767"/><stop offset=".7" stop-color="#e9d8ae"/><stop offset="1" stop-color="#b8945a"/>
</linearGradient>
<linearGradient id="glass" x2="1"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;

/* SUNLIGHT, not a sun: warm shafts falling from the upper left through the window, and one
   faint spectral fringe where the light refracts at the glass edge. A disc here could be misread
   as the Sun·Joy Resonance; the room's light is never an object. */
const SUN_DEFS = `
<linearGradient id="shaft" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff7e4" stop-opacity=".9"/><stop offset=".55" stop-color="#fff3d8" stop-opacity=".35"/><stop offset="1" stop-color="#fff3d8" stop-opacity="0"/></linearGradient>
<linearGradient id="fringe" x2="0" y2="1"><stop stop-color="#ffd7a3" stop-opacity="0"/><stop offset=".2" stop-color="#ffd7a3" stop-opacity=".8"/><stop offset=".45" stop-color="#f7c6d6" stop-opacity=".7"/><stop offset=".7" stop-color="#c9e2ff" stop-opacity=".75"/><stop offset="1" stop-color="#c9e2ff" stop-opacity="0"/></linearGradient>`;
function sunlight(x0, span, floorY, fringeX) {
  const shafts = [[0, 90, 0.34], [120, 60, 0.26], [230, 110, 0.2]].map(([dx, w, o]) =>
    `<path d="M${x0 + dx} -40 L${x0 + dx + w} -40 L${x0 + dx + w + span} ${floorY} L${x0 + dx + span} ${floorY} Z" fill="url(#shaft)" opacity="${o}" filter="url(#sb14)"/>`,
  ).join("\n");
  return `${shafts}
<rect x="${fringeX}" y="60" width="5" height="${floorY - 140}" fill="url(#fringe)" opacity=".38" filter="url(#sb2)"/>`;
}

/* A window frame: a post rising from the floor that arches inward overhead. */
function frameStroke(x, archTo, top, H, w, o) {
  const d = `M${x} ${H + 20} L${x} ${top} C${x} ${r2(top * 0.35)} ${r2(x + (archTo - x) * 0.35)} -40 ${archTo} -90`;
  const inward = archTo > x ? 1 : -1;
  return (
    `<path d="${d}" fill="none" stroke="#7d6130" stroke-width="${w + 5}" opacity="${r2(o * 0.18)}" filter="url(#sb8)" transform="translate(${6 * inward} 5)"/>` +
    `<path d="${d}" fill="none" stroke="url(#metal)" stroke-width="${w}" opacity="${o}"/>` +
    `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="${r2(Math.max(1, w * 0.12))}" opacity="${r2(o * 0.9)}" transform="translate(${r2(-w * 0.28 * inward)} 0)"/>`
  );
}
function framePair(F, W, H) {
  // F: { post, mullion, postTo, mullionTo, top, postW, floorY }, mirrored when W is given for the right wall
  const mirror = (x) => (F.right ? W - x : x);
  return (
    `<rect x="${r2(mirror(F.post) + (F.right ? -40 : 14))}" y="0" width="26" height="${F.floorY}" fill="url(#glass)" opacity=".5" filter="url(#sb8)"/>` +
    frameStroke(mirror(F.post), mirror(F.postTo), F.top, H, F.postW, 0.92) +
    frameStroke(mirror(F.mullion), mirror(F.mullionTo), F.top, H, r2(F.postW * 0.5), 0.78)
  );
}

function buildSolarRoom(L) {
  const { W, H } = L;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
<linearGradient id="sky" x2="0" y2="1">
  <stop stop-color="#bcd5ec"/><stop offset=".36" stop-color="#e3eff8"/><stop offset=".62" stop-color="#f8f5ec"/><stop offset="1" stop-color="#f5f5f6"/>
</linearGradient>
${SOLAR_DEFS}${L.frames ? SUN_DEFS : ""}
${L.frames ? blur("sb2", 1.5, W, H) + blur("sb14", 14, W, H) : ""}
<radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
  <stop stop-color="#fff6de" stop-opacity=".95"/><stop offset=".45" stop-color="#ffeec6" stop-opacity=".4"/><stop offset="1" stop-color="#ffeec6" stop-opacity="0"/>
</radialGradient>
<linearGradient id="marble" x2="0" y2="1">
  <stop stop-color="#fbf7ee"/><stop offset=".3" stop-color="#f3eee4"/><stop offset="1" stop-color="#e9e3d7"/>
</linearGradient>
<linearGradient id="horizonWarm" x2="0" y2="1"><stop stop-color="#ffe7bb" stop-opacity="0"/><stop offset=".55" stop-color="#ffe7bb" stop-opacity=".55"/><stop offset="1" stop-color="#ffe7bb" stop-opacity="0"/></linearGradient>
${blur("sb8", 8, W, H)}
${blur("sb18", 18, W, H)}
${blur("sb36", 36, W, H)}
</defs>
<rect width="${W}" height="${H}" fill="url(#sky)"/>
<!-- the sun's light, upper left: a warm source the whole room is lit from -->
<ellipse cx="${L.sun[0]}" cy="${L.sun[1]}" rx="${L.sun[2] * 2.6}" ry="${L.sun[2] * 1.8}" fill="url(#sunGlow)" filter="url(#sb36)"/>
<circle cx="${L.sun[0]}" cy="${L.sun[1]}" r="${r2(L.sun[2] * 0.55)}" fill="#fffaec" opacity=".85" filter="url(#sb18)"/>
<!-- the distant world: a soft mountain horizon under warm air -->
<path d="${L.ridgeFar}" fill="#b6c7d9" opacity=".36" filter="url(#sb8)"/>
<path d="${L.ridgeNear}" fill="#a3b6cb" opacity=".3"/>
<rect x="0" y="${L.floorY - 70}" width="${W}" height="110" fill="url(#horizonWarm)" filter="url(#sb18)"/>
<!-- the marble floor: the room has a ground, with the sky's light in it -->
<rect x="0" y="${L.floorY}" width="${W}" height="${H - L.floorY}" fill="url(#marble)"/>
<rect x="0" y="${L.floorY}" width="${W}" height="1.6" fill="#c9a86c" opacity=".55"/>
<ellipse cx="${W / 2}" cy="${H + L.daisDrop}" rx="${W * 0.62}" ry="${L.daisRy}" fill="none" stroke="#c4a468" stroke-width="2" opacity=".42"/>
<ellipse cx="${W / 2}" cy="${H + L.daisDrop}" rx="${W * 0.46}" ry="${r2(L.daisRy * 0.72)}" fill="none" stroke="#c4a468" stroke-width="1.4" opacity=".3"/>
<ellipse cx="${W / 2}" cy="${H + L.daisDrop - 4}" rx="${W * 0.6}" ry="${L.daisRy}" fill="none" stroke="#fff" stroke-width="14" opacity=".5" filter="url(#sb18)"/>
${L.frames ? sunlight(-10, 260, L.floorY, L.frames.post + 20) : ""}
${L.frames ? framePair({ ...L.frames, floorY: L.floorY }, W, H) + framePair({ ...L.frames, floorY: L.floorY, right: true }, W, H) : ""}
</svg>`;
}

/* One wall's window frame on a transparent canvas, for an edge-anchored layer. */
function buildSolarFrame(side) {
  const W = 560;
  const H = 1200;
  const F = { post: 96, mullion: 152, postTo: 520, mullionTo: 560, top: 420, postW: 16, floorY: 960, right: side === "right" };
  // The sun is upper LEFT (the family key light): only the left wall's window lets it in.
  const light = side === "left" ? sunlight(-20, 300, F.floorY, 118) : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${SOLAR_DEFS}${SUN_DEFS}
${blur("sb2", 1.5, W, H)}
${blur("sb8", 8, W, H)}
${blur("sb14", 14, W, H)}
</defs>
${light}
${framePair(F, W, H)}
</svg>`;
}

const ridge = (W, base, amp, seed) => {
  const rand = lcg(seed);
  let d = `M0 ${base}`;
  for (let x = 0; x <= W; x += W / 12) d += ` L${r2(x)} ${r2(base - amp * (0.3 + rand() * 0.7))}`;
  return `${d} L${W} ${base + 60} L0 ${base + 60} Z`;
};

const files = {
  "environment-cosmos.svg": buildCosmosSky({
    W: 1920, H: 1200, seed: 20260923, floorY: 1010, veilBlur: 46,
    clusters: [[160, 420, 150], [1760, 520, 160], [980, 170, 180], [520, 760, 160], [1420, 880, 150], [260, 980, 120]],
    anchors: [[70, 520], [236, 880], [1690, 150], [1860, 700], [610, 90], [1300, 60], [1120, 960]],
    veils: [["veilB", 170, 330, 420, 300, 0.62], ["veilV", 1760, 860, 420, 360, 0.5], ["veilB", 1180, 110, 520, 180, 0.28], ["veilV", 120, 900, 300, 260, 0.34]],
  }),
  "environment-cosmos-crescent.svg": buildBody("crescent"),
  "environment-cosmos-galaxy.svg": buildBody("galaxy"),
  "environment-cosmos-portrait.svg": buildCosmosSky({
    W: 900, H: 1600, seed: 20260924, floorY: 1390, veilBlur: 34,
    clusters: [[220, 360, 120], [680, 520, 130], [450, 180, 150], [300, 900, 140], [640, 1150, 120]],
    anchors: [[150, 620], [760, 300], [330, 110], [700, 980], [210, 1240]],
    veils: [["veilB", 220, 260, 300, 240, 0.6], ["veilV", 700, 1160, 300, 300, 0.48], ["veilB", 560, 120, 300, 140, 0.3]],
    galaxy: { x: 650, y: 240, rx: 110, ry: 36, rot: -28 },
    crescent: { x: 222, y: 172, r: 44 },
  }),
  "environment-solar.svg": buildSolarRoom({
    W: 1920, H: 1200, floorY: 960, daisDrop: 90, daisRy: 200,
    sun: [250, 170, 70],
    ridgeFar: ridge(1920, 930, 70, 7), ridgeNear: ridge(1920, 952, 40, 11),
  }),
  "environment-solar-frame-left.svg": buildSolarFrame("left"),
  "environment-solar-frame-right.svg": buildSolarFrame("right"),
  "environment-solar-portrait.svg": buildSolarRoom({
    W: 900, H: 1600, floorY: 1300, daisDrop: 70, daisRy: 160,
    sun: [230, 170, 58],
    ridgeFar: ridge(900, 1270, 60, 7), ridgeNear: ridge(900, 1292, 34, 11),
    frames: { post: 128, mullion: 170, postTo: 340, mullionTo: 370, top: 520, postW: 12 },
  }),
};

fs.mkdirSync(OUT, { recursive: true });
for (const [name, svg] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), svg);
  console.log(`${name.padEnd(36)} ${Buffer.byteLength(svg).toLocaleString()} B`);
}
