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
 *   environment-solar-frame-left.svg  one wall of the glass dome — three thin receding ribs,
 *   environment-solar-frame-right.svg silver-white metal with champagne where the sun touches
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
/* LIGHT-MODE CORRECTION: the owner read the previous pass as old paper — a beige marble floor
   band, mustard/brown-gold frame strokes 16px thick with brown shadows, a yellow horizon band.
   The observatory is now DAYLIGHT, PEARL and GLASS: cool sky, a white solar bloom, a polished
   pearl-mineral floor that reflects the sky, and thin receding glass-dome ribs whose metal is
   mostly silver-white with champagne only where the sun touches them. Warmth is a restrained
   accent of light, never a wash over the page. */
const ribDefs = (sunlit) => `
<linearGradient id="rib" x2="0" y2="1">
  ${sunlit
    ? '<stop stop-color="#fffbf2"/><stop offset=".12" stop-color="#efe3c7"/>'
    : '<stop stop-color="#f8fafc"/><stop offset=".12" stop-color="#eef2f7"/>'}<stop offset=".32" stop-color="#ffffff"/><stop offset=".75" stop-color="#f4f7fb"/><stop offset="1" stop-color="#eaeff5"/>
</linearGradient>
<linearGradient id="pane" x2="0" y2="1"><stop stop-color="#ffffff" stop-opacity=".34"/><stop offset=".55" stop-color="#f4f8fc" stop-opacity=".14"/><stop offset="1" stop-color="#ffffff" stop-opacity=".04"/></linearGradient>
<radialGradient id="daylight" cx="50%" cy="50%" r="50%"><stop stop-color="#ffffff" stop-opacity=".95"/><stop offset=".42" stop-color="#fffbf3" stop-opacity=".5"/><stop offset="1" stop-color="#fffbf3" stop-opacity="0"/></radialGradient>
<linearGradient id="glint" x2="1"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
const RIB_DEFS = ribDefs(true);

/* SUNLIGHT, not a sun: white daylight falling from the upper left through the glass, and one
   faint spectral fringe where it refracts at a rib. A disc could be misread as the Sun·Joy
   Resonance; the room's light is never an object. */
const SUN_DEFS = `
<linearGradient id="shaft" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff" stop-opacity=".95"/><stop offset=".5" stop-color="#fffaf0" stop-opacity=".35"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
<linearGradient id="fringe" x2="0" y2="1"><stop stop-color="#ffe2b8" stop-opacity="0"/><stop offset=".22" stop-color="#ffe2b8" stop-opacity=".7"/><stop offset=".46" stop-color="#f6d0e2" stop-opacity=".6"/><stop offset=".7" stop-color="#cfe6ff" stop-opacity=".7"/><stop offset="1" stop-color="#cfe6ff" stop-opacity="0"/></linearGradient>`;
function sunlight(x0, span, floorY, fringeX) {
  const shafts = [[0, 90, 0.26], [120, 60, 0.2], [230, 110, 0.14]].map(([dx, w, o]) =>
    `<path d="M${x0 + dx} -40 L${x0 + dx + w} -40 L${x0 + dx + w + span} ${floorY} L${x0 + dx + span} ${floorY} Z" fill="url(#shaft)" opacity="${o}" filter="url(#sb14)"/>`,
  ).join("\n");
  return `${shafts}
<rect x="${fringeX}" y="80" width="4" height="${floorY - 180}" fill="url(#fringe)" opacity=".34" filter="url(#sb2)"/>`;
}

/* One glass-dome rib: rises from the floor and curves overhead toward a vanishing point beyond
   the top of the room. Thin, with a light-side highlight and a cool contact shadow. */
function rib(x, archTo, top, H, w, o, inward) {
  const d = `M${x} ${H + 20} L${x} ${top} C${x} ${r2(top * 0.32)} ${r2(x + (archTo - x) * 0.3)} -50 ${archTo} -110`;
  return (
    `<path d="${d}" fill="none" stroke="#5a7090" stroke-width="${r2(w + 3)}" opacity="${r2(o * 0.08)}" filter="url(#sb4)" transform="translate(3 4)"/>` +
    `<path d="${d}" fill="none" stroke="#8ea2be" stroke-width="1" opacity="${r2(o * 0.55)}" transform="translate(${r2(w / 2 + 0.5)} 0)"/>` +
    `<path d="${d}" fill="none" stroke="url(#rib)" stroke-width="${w}" opacity="${o}"/>` +
    `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="${r2(Math.max(0.8, w * 0.4))}" opacity="${r2(Math.min(1, o * 1.05))}" transform="translate(${r2(-w * 0.28)} 0)"/>`
  );
}
/* A wall of the dome: three ribs receding into depth (each further in, thinner, fainter), a
   translucent glass pane between the first two, and a glint running down the glass. */
function domeWall(F, W, H) {
  const m = (x) => (F.right ? W - x : x);
  const inward = F.right ? -1 : 1;
  const [a, b, c] = F.ribs;
  const pane = `M${m(a.x)} ${H + 20} L${m(a.x)} ${a.top} C${m(a.x)} ${r2(a.top * 0.32)} ${r2(m(a.x) + (m(a.to) - m(a.x)) * 0.3)} -50 ${m(a.to)} -110 L${m(b.to)} -110 C${r2(m(b.x) + (m(b.to) - m(b.x)) * 0.3)} -50 ${m(b.x)} ${r2(b.top * 0.32)} ${m(b.x)} ${b.top} L${m(b.x)} ${H + 20} Z`;
  return (
    `<path d="${pane}" fill="url(#pane)"/>` +
    `<rect x="${r2(m(a.x) + (F.right ? -22 : 10))}" y="40" width="12" height="${F.floorY - 60}" fill="url(#glint)" opacity=".42" filter="url(#sb4)"/>` +
    [a, b, c].map((r) => rib(m(r.x), m(r.to), r.top, H, r.w, r.o, inward)).join("")
  );
}

function buildSolarRoom(L) {
  const { W, H } = L;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
<linearGradient id="sky" x2="0" y2="1">
  <stop stop-color="#bcd6ee"/><stop offset=".3" stop-color="#d8e8f6"/><stop offset=".56" stop-color="#eaf2fa"/><stop offset=".8" stop-color="#f5f8fb"/><stop offset="1" stop-color="#f6f7f9"/>
</linearGradient>
<radialGradient id="bloom" cx="50%" cy="50%" r="50%">
  <stop stop-color="#ffffff" stop-opacity=".95"/><stop offset=".4" stop-color="#fffbf2" stop-opacity=".5"/><stop offset="1" stop-color="#fffbf2" stop-opacity="0"/>
</radialGradient>
<radialGradient id="coolAir" cx="50%" cy="50%" r="50%"><stop stop-color="#cfe2f4" stop-opacity=".6"/><stop offset="1" stop-color="#cfe2f4" stop-opacity="0"/></radialGradient>
<linearGradient id="haze" x2="0" y2="1"><stop stop-color="#ffffff" stop-opacity="0"/><stop offset=".55" stop-color="#ffffff" stop-opacity=".8"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
<linearGradient id="stone" x2="0" y2="1"><stop stop-color="#f7f9fb"/><stop offset=".4" stop-color="#f0f3f7"/><stop offset="1" stop-color="#e9eef4"/></linearGradient>
<linearGradient id="skyReflect" x2="0" y2="1"><stop stop-color="#dae7f3" stop-opacity=".7"/><stop offset="1" stop-color="#dae7f3" stop-opacity="0"/></linearGradient>
<linearGradient id="hairline"><stop stop-color="#ffffff" stop-opacity="0"/><stop offset=".15" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".85" stop-color="#ffffff" stop-opacity=".95"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
${L.frames ? RIB_DEFS + SUN_DEFS : ""}
${L.frames ? blur("sb2", 1.5, W, H) + blur("sb4", 3, W, H) + blur("sb14", 14, W, H) : ""}
${blur("sb6", 6, W, H)}
${blur("sb18", 18, W, H)}
${blur("sb40", 40, W, H)}
</defs>
<rect width="${W}" height="${H}" fill="url(#sky)"/>
<!-- daylight: a white solar bloom upper left, a cool breath of sky opposite -->
<ellipse cx="${L.sun[0]}" cy="${L.sun[1]}" rx="${r2(L.sun[2] * 3)}" ry="${r2(L.sun[2] * 2.1)}" fill="url(#bloom)" filter="url(#sb40)"/>
<circle cx="${L.sun[0]}" cy="${L.sun[1]}" r="${r2(L.sun[2] * 0.6)}" fill="#ffffff" opacity=".9" filter="url(#sb18)"/>
<ellipse cx="${r2(W * 0.86)}" cy="${r2(H * 0.2)}" rx="${r2(W * 0.28)}" ry="${r2(H * 0.24)}" fill="url(#coolAir)" filter="url(#sb40)"/>
<!-- the distant world: a faint silver mountain line under luminous haze -->
<path d="${L.ridgeFar}" fill="#d3deea" opacity=".4" filter="url(#sb6)"/>
<path d="${L.ridgeNear}" fill="#c9d6e5" opacity=".24"/>
<rect x="0" y="${L.floorY - 80}" width="${W}" height="130" fill="url(#haze)" filter="url(#sb18)"/>
<!-- polished pearl stone: the room's ground, with the sky reflected in it -->
<rect x="0" y="${L.floorY}" width="${W}" height="${H - L.floorY}" fill="url(#stone)"/>
<rect x="0" y="${L.floorY}" width="${W}" height="${r2((H - L.floorY) * 0.55)}" fill="url(#skyReflect)"/>
<rect x="0" y="${L.floorY + 1.4}" width="${W}" height="1" fill="#c9d5e3" opacity=".42"/>
<rect x="0" y="${L.floorY}" width="${W}" height="1.4" fill="url(#hairline)"/>
<rect x="0" y="${L.floorY - 6}" width="${W}" height="10" fill="#ffffff" opacity=".85" filter="url(#sb6)"/>
<ellipse cx="${r2(W * 0.16)}" cy="${r2(L.floorY + (H - L.floorY) * 0.35)}" rx="${r2(W * 0.2)}" ry="${r2((H - L.floorY) * 0.3)}" fill="#ffffff" opacity=".6" filter="url(#sb18)"/>
<ellipse cx="${W / 2}" cy="${H + L.daisDrop}" rx="${r2(W * 0.62)}" ry="${L.daisRy}" fill="none" stroke="#ffffff" stroke-width="2" opacity=".95"/>
<ellipse cx="${W / 2}" cy="${H + L.daisDrop + 3}" rx="${r2(W * 0.62)}" ry="${L.daisRy}" fill="none" stroke="#c9d4e1" stroke-width="1" opacity=".45"/>
<ellipse cx="${W / 2}" cy="${H + L.daisDrop}" rx="${r2(W * 0.46)}" ry="${r2(L.daisRy * 0.72)}" fill="none" stroke="#e4d8bd" stroke-width="1" opacity=".5"/>
<ellipse cx="${W / 2}" cy="${H + L.daisDrop - 4}" rx="${r2(W * 0.6)}" ry="${L.daisRy}" fill="none" stroke="#ffffff" stroke-width="14" opacity=".7" filter="url(#sb18)"/>
${L.frames ? sunlight(-10, 260, L.floorY, L.frames.ribs[0].x + 16) : ""}
${L.frames ? domeWall({ ...L.frames, floorY: L.floorY }, W, H) + domeWall({ ...L.frames, floorY: L.floorY, right: true }, W, H) : ""}
</svg>`;
}

/* One wall of the glass dome on a transparent canvas, for an edge-anchored layer. */
const DOME_RIBS = [
  { x: 70, to: 470, top: 360, w: 4.4, o: 0.95 },
  { x: 128, to: 520, top: 410, w: 3, o: 0.76 },
  { x: 196, to: 560, top: 470, w: 2, o: 0.52 },
];
function buildSolarFrame(side) {
  const W = 560;
  const H = 1200;
  const F = { ribs: DOME_RIBS, floorY: 960, right: side === "right" };
  // The sun is upper LEFT (the family key light): only the left wall's glass lets it in.
  const light = side === "left"
    ? `<ellipse cx="150" cy="150" rx="270" ry="210" fill="url(#daylight)" filter="url(#sb14)"/><ellipse cx="128" cy="128" rx="74" ry="58" fill="#ffffff" opacity=".92" filter="url(#sb14)"/>` + sunlight(-20, 300, F.floorY, 86)
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${ribDefs(side === "left")}${SUN_DEFS}
${blur("sb2", 1.5, W, H)}
${blur("sb4", 3, W, H)}
${blur("sb14", 14, W, H)}
</defs>
${light}
${domeWall(F, W, H)}
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
    frames: { ribs: [{ x: 110, to: 330, top: 500, w: 2.6, o: 0.85 }, { x: 150, to: 360, top: 540, w: 1.8, o: 0.62 }, { x: 196, to: 390, top: 590, w: 1.2, o: 0.42 }] },
  }),
};

fs.mkdirSync(OUT, { recursive: true });
for (const [name, svg] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), svg);
  console.log(`${name.padEnd(36)} ${Buffer.byteLength(svg).toLocaleString()} B`);
}
