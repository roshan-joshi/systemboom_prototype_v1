/**
 * PHASE 4.4-A.1 — P0-6 MOBILE MOMENT ACTION-ROW CONTAINMENT (focused regression suite).
 *
 *   node prototype-tests/social-4-4a1-p06.js        (dev server on :3210)
 *
 * With Celestial on, the Moment's action row (Respond · Boom · Resonate · ⋯) was one non-wrapping
 * line of fixed-width children needing 363px in a 304px (360) / 334px (390) phone column; the
 * Moments sheet's clipping content box (`overflow:hidden`) cut the ⋯ off at 360 and left it on
 * the edge at 390. This suite proves the fix in a real browser, from real layout rectangles —
 * never from CSS declarations:
 *   §1 containment matrix — 360/375/390/430 × dark/light × the 0/1/5/8-resonator Italian
 *      fixtures: all four actions present, visible, one line, inside the Moment AND inside the
 *      real clipping box (with room for the focus ring), no overlap, 44px targets, the 6px
 *      compact spacing, no horizontal page scroll
 *   §2 hit testing and focus — the ⋯ answers across its whole 44px circle and opens its menu on
 *      screen from a real tap; Tab reaches it with a ring that fits the reserved margin
 *   §3 every locale at 360 — the locale really switches, and the fix is not tuned to English
 *   §4 behaviour kept — exact Resonance summary counts and who-resonated names (fixtures
 *      unchanged), expanded constellations (dark + light, 5 and 8 people), Resonate still opens
 *      the field, the Boom deck still opens on screen from the row, quiet Moments, the Resonate
 *      accessible name, title hint and order, View as public with Celestial on (P0-3 part 1)
 *   §5 range — flag off untouched (8px, no Resonate); 512–667 the word returns with 44px
 *      targets; ≥672 the desktop row keeps its 12px spacing, View in Life and one shared centre
 *   §6 the second surface — the Circle/Life Day Almanac renders the same row in a narrower
 *      column: contained in every locale, one line wherever the widths allow it
 *   §7 below the brief's range — 320px and very large text: the cluster wraps, the ⋯ keeps its
 *      first-line slot and nothing overlaps it
 * Evidence: prototype-evidence/phase-4.4a1-p06/ (gitignored), untouched runtime frames.
 */
const fs = require("fs");
const path = require("path");
const { launch, sleep } = require("./celestial-lib");

const ROOT = path.resolve(__dirname, "..");
const EV = path.join(ROOT, "prototype-evidence/phase-4.4a1-p06");
fs.mkdirSync(EV, { recursive: true });
const HOST = "http://localhost:3210";
const BASE = `${HOST}/style-lab/social`;
const LOCALES = ["en", "es", "it", "nl", "ru", "hi", "ne", "zh-Hans"];
// The Italian-circle fixtures by participation: zero · one · five (the owner-review Moment) · eight.
const FIXTURES = [["m-rain", 0], ["m-activity", 1], ["m-sameage", 5], ["m-video", 8]];
// Accepted fixture truth (Phase 4.4-A owner fixture add-on): per-meaning counts then the total,
// as the summary's who-button reads them, and who holds each meaning on the 5-person Moment.
const SUMMARY = { "m-rain": null, "m-activity": "1 person", "m-sameage": "21115 people", "m-video": "2211118 people" };
const SAMEAGE_WHO = { "venus-love": ["Giulia Bianchi", "Sofia Romano"], "sun-joy": ["Elena Ricci"], "saturn-support": ["Luca Rinaldi"], "moon-touched": ["Chiara Conti"] };
const K = ["respond", "boom", "resonate", "more"];

let passed = 0;
const failures = [];
function ok(cond, msg) {
  if (cond) { passed += 1; console.log(`  ✓ ${msg}`); } else { failures.push(msg); console.log(`  ✗ ${msg}`); }
}
const phone = (w, h = 844) => ({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const desktop = (w) => ({ width: w, height: 950, deviceScaleFactor: 1 });

async function open(page, vp, { theme = "dark", celestial = true, locale = "en", url = BASE, extra = "" } = {}) {
  await page.setCookie({ name: "sb-locale", value: locale, url: HOST });
  await page.setViewport(vp);
  await page.goto(`${url}?harness=0&theme=${theme}&celestial=${celestial ? "1" : "0"}${extra}`, { waitUntil: "networkidle2" });
  await sleep(900);
}
async function toMoment(page, id, offset = 96) {
  await page.evaluate((mid, off) => { const m = document.querySelector(`[data-sb-moment='${mid}']`); m.scrollIntoView({ block: "start" }); window.scrollBy(0, -off); }, id, offset);
  await sleep(300);
}

/** Every rectangle and style the containment rules need, measured in the page. */
function measure(page, id) {
  return page.evaluate((mid) => {
    const m = document.querySelector(`[data-sb-moment='${mid}']`);
    if (!m) return null;
    const row = m.querySelector("[data-sb-actions]");
    const primary = row.querySelector("[data-sb-actions-primary]");
    const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
    const more = row.querySelector("[data-sb-actions-more] button[aria-expanded]");
    const el = { respond: row.querySelector("[data-sb-respond]"), boom: row.querySelector("[data-sb-express]"), resonate: row.querySelector("[data-sb-resonate]"), more };
    // The nearest ancestor of the row that clips — the box that really cuts a control off.
    let clip = null;
    for (let e = row.parentElement; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.overflowX !== "visible" || cs.overflowY !== "visible") { clip = { ...R(e), sel: `${e.tagName.toLowerCase()}.${String(e.className).split(" ").slice(0, 2).join(".")}` }; break; }
    }
    const shown = (e) => { if (!e) return false; const cs = getComputedStyle(e); return cs.visibility === "visible" && parseFloat(cs.opacity) > 0.9 && e.getClientRects().length > 0; };
    // intrinsic widths — to tell a necessary wrap from an unnecessary one
    const need = [el.respond, el.boom, el.resonate].filter(Boolean).reduce((a, e) => a + e.getBoundingClientRect().width, 0) + parseFloat(getComputedStyle(primary).columnGap) * 2;
    return {
      vw: window.innerWidth,
      docW: document.documentElement.scrollWidth,
      lang: document.documentElement.lang,
      moment: R(m),
      row: R(row),
      primaryH: primary.getBoundingClientRect().height,
      primaryW: primary.getBoundingClientRect().width,
      need,
      c: Object.fromEntries(Object.entries(el).map(([k, e]) => [k, R(e)])),
      shown: Object.fromEntries(Object.entries(el).map(([k, e]) => [k, shown(e)])),
      respondText: el.respond?.textContent.trim() ?? null,
      clip,
      resonateName: el.resonate?.getAttribute("aria-label") ?? null,
      resonateTitle: el.resonate?.getAttribute("title") ?? null,
      label: (() => { const l = el.resonate?.querySelector("[data-sb-resonate-label]"); return l && getComputedStyle(l).display !== "none" ? l.textContent : null; })(),
      order: [...m.querySelectorAll("[data-sb-respond],[data-sb-express],[data-sb-resonate]")].map((e) => (e.hasAttribute("data-sb-respond") ? "respond" : e.hasAttribute("data-sb-express") ? "boom" : "resonate")),
      summaryInRow: !!row.querySelector("[data-sb-resonance-summary]"),
      summary: m.querySelector("[data-sb-resonance-summary] [data-sb-resonance-who]")?.textContent.replace(/\s+/g, " ").trim() ?? null,
      gap: getComputedStyle(primary).columnGap,
      centres: Object.fromEntries(Object.entries(el).map(([k, e]) => [k, e ? +(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2).toFixed(1) : null])),
    };
  }, id);
}
const inside = (a, b, pad = 0) => !!a && !!b && a.l >= b.l - 0.5 + pad && a.r <= b.r + 0.5 - pad && a.t >= b.t - 0.5 + pad && a.b <= b.b + 0.5 - pad;
const overlap = (a, b) => !!a && !!b && a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5;
const oneLine = (g) => g.primaryH <= 46 && g.row.h <= 46;
/** The focus ring's reach: the computed outline width + offset (globals.css declares 2px at a 2px
 *  offset; Chromium computes the ⋯'s offset as 1px). §1 reserves 4px round every control. */
const RING_PX = 4;

function containment(g, tag, { compactGap = true } = {}) {
  const present = g && K.every((k) => g.c[k]);
  ok(present && K.every((k) => g.shown[k]), `${tag}: Respond, Boom, Resonate and ⋯ are all present and visible`);
  if (!present) return;
  ok(oneLine(g), `${tag}: one action row, one line (${g.row.h.toFixed(0)}px)`);
  ok(K.every((k) => inside(g.c[k], g.moment)), `${tag}: every action inside the Moment (⋯ ${g.c.more.l.toFixed(0)}–${g.c.more.r.toFixed(0)} of ${g.moment.l.toFixed(0)}–${g.moment.r.toFixed(0)})`);
  const ringed = (b) => ({ l: b.l - RING_PX, r: b.r + RING_PX, t: b.t - RING_PX, b: b.b + RING_PX });
  ok(!!g.clip && K.every((k) => inside(ringed(g.c[k]), g.clip)), `${tag}: every action and its ${RING_PX}px focus ring inside the real clipping box (${g.clip ? `${g.clip.sel} ${g.clip.l.toFixed(0)}–${g.clip.r.toFixed(0)}` : "none found"})`);
  ok(!!g.clip && g.clip.r - g.c.more.r >= 12, `${tag}: ⋯ keeps ≥12px of room inside the clipping box (${g.clip ? (g.clip.r - g.c.more.r).toFixed(0) : "?"}px)`);
  const pairs = [["respond", "boom"], ["boom", "resonate"], ["resonate", "more"], ["respond", "resonate"], ["respond", "more"], ["boom", "more"]];
  ok(pairs.every(([a, b]) => !overlap(g.c[a], g.c[b])), `${tag}: no action overlaps another`);
  ok(K.every((k) => g.c[k].w >= 43.5 && g.c[k].h >= 43.5), `${tag}: every action is at least 44×44 (${K.map((k) => `${g.c[k].w.toFixed(0)}×${g.c[k].h.toFixed(0)}`).join(", ")})`);
  if (compactGap) ok(g.gap === "6px", `${tag}: the compact phone spacing is 6px (${g.gap})`);
  ok(g.docW <= g.vw, `${tag}: no horizontal page scroll (${g.docW}/${g.vw})`);
  ok(!g.summaryInRow, `${tag}: the Resonance summary stays a separate row below the actions`);
}

(async () => {
  const { browser, page } = await launch();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  try {
    /* ---- §1 containment matrix ---- */
    console.log("§1 containment — 360/375/390/430 × dark/light × 0/1/5/8 resonators");
    for (const theme of ["dark", "light"]) {
      for (const w of [360, 375, 390, 430]) {
        await open(page, phone(w), { theme });
        for (const [id, n] of FIXTURES) {
          await toMoment(page, id);
          containment(await measure(page, id), `${w} ${theme} ${id} (${n})`);
        }
      }
    }

    /* ---- §2 hit testing and focus ---- */
    console.log("§2 hit testing and focus on ⋯");
    for (const w of [360, 390]) {
      for (const theme of ["dark", "light"]) {
        await open(page, phone(w), { theme });
        for (const id of ["m-sameage", "m-video"]) {
          await toMoment(page, id);
          const hits = await page.evaluate((mid) => {
            const b = document.querySelector(`[data-sb-moment='${mid}'] [data-sb-actions-more] button[aria-expanded]`);
            const r = b.getBoundingClientRect();
            // The ⋯ is a round 44px button and hit testing follows its rounded shape, so the target
            // is the 44px circle: its centre and eight points 19px out, all round it.
            const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            const pts = [[cx, cy], ...Array.from({ length: 8 }, (_, i) => [cx + 19 * Math.cos((i * Math.PI) / 4), cy + 19 * Math.sin((i * Math.PI) / 4)])];
            return { d: r.width, hits: pts.map(([x, y]) => document.elementFromPoint(x, y)?.closest("button") === b) };
          }, id);
          ok(hits.d >= 43.5 && hits.hits.every(Boolean), `${w} ${theme} ${id}: ⋯ answers across its whole ${hits.d.toFixed(0)}px circle — centre and eight points 19px out (${hits.hits.filter(Boolean).length}/${hits.hits.length})`);
        }
        await toMoment(page, "m-sameage");
        const btn = await page.$("[data-sb-moment='m-sameage'] [data-sb-actions-more] button[aria-expanded]");
        const box = await btn.boundingBox();
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
        await sleep(350);
        const menu = await page.evaluate(() => {
          const m = document.querySelector("[data-sb-moment='m-sameage'] [role=menu]");
          if (!m) return null;
          const r = m.getBoundingClientRect();
          return { l: r.left, r: r.right, vw: window.innerWidth, expanded: document.querySelector("[data-sb-moment='m-sameage'] [data-sb-actions-more] button[aria-expanded]").getAttribute("aria-expanded"), items: m.querySelectorAll("[role^=menuitem]").length };
        });
        ok(!!menu && menu.expanded === "true" && menu.items >= 3 && menu.l >= 0 && menu.r <= menu.vw, `${w} ${theme}: a real tap on ⋯ opens its menu, fully on screen (${menu ? `${menu.l.toFixed(0)}–${menu.r.toFixed(0)} of ${menu.vw}, ${menu.items} items` : "no menu"})`);
        await page.keyboard.press("Escape");
        await sleep(200);
      }
    }
    await open(page, phone(360), { theme: "dark" });
    await toMoment(page, "m-sameage");
    await page.evaluate(() => document.querySelector("[data-sb-moment='m-sameage'] [data-sb-resonate]").focus());
    await page.keyboard.press("Tab");
    await sleep(150);
    const focus = await page.evaluate(() => {
      const b = document.querySelector("[data-sb-moment='m-sameage'] [data-sb-actions-more] button[aria-expanded]");
      const cs = getComputedStyle(b);
      return { focused: document.activeElement === b, visible: b.matches(":focus-visible"), style: cs.outlineStyle, width: parseFloat(cs.outlineWidth), offset: parseFloat(cs.outlineOffset) };
    });
    ok(focus.focused && focus.visible && focus.style !== "none" && focus.width > 0, `360: Tab from Resonate reaches ⋯ with a visible focus ring (${focus.style} ${focus.width}px, offset ${focus.offset}px)`);
    ok(focus.width + focus.offset <= RING_PX, `…and the ring reaches no further than the ${RING_PX}px §1 reserved for it (${focus.width + focus.offset}px)`);
    await page.screenshot({ path: path.join(EV, "t-360-dark-focus-ring.png") });

    /* ---- §3 every locale at 360 ---- */
    console.log("§3 every locale at 360");
    for (const locale of LOCALES) {
      await open(page, phone(360), { theme: "dark", locale });
      for (const id of ["m-sameage", "m-video"]) {
        await toMoment(page, id);
        const g = await measure(page, id);
        ok(g.lang === locale && (locale === "en" ? g.respondText === "Respond" : g.respondText !== "Respond"), `${locale} 360 ${id}: the page really is in ${locale} (lang “${g.lang}”, Respond reads “${g.respondText}”)`);
        containment(g, `${locale} 360 ${id}`);
      }
    }
    await page.setCookie({ name: "sb-locale", value: "en", url: HOST });

    /* ---- §4 behaviour kept ---- */
    console.log("§4 behaviour kept");
    await open(page, phone(360), { theme: "dark" });
    const byId = {};
    for (const [id] of FIXTURES) { await toMoment(page, id); byId[id] = await measure(page, id); }
    ok(FIXTURES.every(([id]) => byId[id].summary === SUMMARY[id]), `the Resonance summaries are exactly as seeded — per-meaning counts and totals (${FIXTURES.map(([id]) => `${id} “${byId[id].summary}”`).join(" · ")})`);
    ok(Object.values(byId).every((g) => JSON.stringify(g.order) === '["respond","boom","resonate"]'), "the order stays Respond → Boom → Resonate on every fixture");
    ok(byId["m-rain"].resonateName === "Resonate" && /Venus/.test(byId["m-sameage"].resonateName ?? ""), `the compact Resonate keeps its accessible name (“${byId["m-rain"].resonateName}” · yours: “${byId["m-sameage"].resonateName}”)`);
    ok(byId["m-rain"].resonateTitle === "Resonate" && byId["m-sameage"].resonateTitle === "Resonate", `the compact aperture carries the verb as its title hint, like Boom beside it (“${byId["m-sameage"].resonateTitle}”)`);
    ok(byId["m-rain"].label === null, "below @lg the word is carried by the accessible name and title; the doorway shows its mark");
    // quiet Moments keep the ⋯ at the right, alone
    await toMoment(page, "m-health");
    const quiet = await measure(page, "m-health");
    ok(!!quiet && !quiet.c.respond && !quiet.c.boom && !quiet.c.resonate && inside(quiet.c.more, quiet.moment) && Math.abs(quiet.c.more.r - quiet.moment.r) < 1, "a quiet Health Moment has only ⋯, at the Moment's right edge");
    // Resonate still opens the field
    await toMoment(page, "m-rain");
    await page.click("[data-sb-moment='m-rain'] [data-sb-resonate]");
    await sleep(700);
    ok(!!(await page.$("[data-sb-celestial-field]")), "tapping the compact Resonate still opens the Celestial field");
    await page.keyboard.press("Escape");
    await sleep(400);
    // the Boom deck still opens from the row, on screen
    await open(page, phone(360), { theme: "dark" });
    await toMoment(page, "m-sameage", 260);
    await page.click("[data-sb-moment='m-sameage'] [data-sb-express]");
    await sleep(700);
    const deck = await page.evaluate(() => {
      const d = document.querySelector("[data-sb-expression-deck]");
      if (!d) return null;
      const r = d.getBoundingClientRect();
      return { l: r.left, r: r.right, vw: window.innerWidth, cores: d.querySelectorAll("[data-sb-horizon-index]").length };
    });
    ok(!!deck && deck.l >= 0 && deck.r <= deck.vw && deck.cores >= 6, `the Boom deck still opens from the row at 360, fully on screen (${deck ? `${deck.l.toFixed(0)}–${deck.r.toFixed(0)}, ${deck.cores} cores` : "no deck"})`);
    await page.keyboard.press("Escape");
    await sleep(300);
    // expanded constellations — dark and light, 5 and 8 people
    for (const theme of ["dark", "light"]) {
      for (const w of [360, 390]) {
        await open(page, phone(w), { theme });
        for (const [id, groups, people] of [["m-sameage", 4, 5], ["m-video", 6, 8]]) {
          await toMoment(page, id);
          await page.click(`[data-sb-moment='${id}'] [data-sb-resonance-who]`);
          await sleep(500);
          const ex = await page.evaluate((mid) => {
            const p = document.querySelector(`[data-sb-moment='${mid}'] [data-sb-resonance-who-panel]`);
            if (!p) return null;
            const r = p.getBoundingClientRect();
            const who = Object.fromEntries([...p.querySelectorAll("[data-sb-resonance-group]")].map((gr) => [gr.getAttribute("data-sb-resonance-group"), [...gr.querySelectorAll("[data-sb-resonance-person]")].map((x) => x.textContent.replace(/You$/, "").replace(/\s+/g, " ").trim())]));
            return { l: r.left, r: r.right, vw: window.innerWidth, groups: p.querySelectorAll("[data-sb-resonance-group]").length, people: p.querySelectorAll("[data-sb-resonance-person]").length, who };
          }, id);
          const g = await measure(page, id);
          ok(!!ex && ex.l >= 0 && ex.r <= ex.vw && ex.groups === groups && ex.people === people && inside(g.c.more, g.moment), `${w} ${theme} ${id}: the expanded constellation fits (${ex?.groups} meanings, ${ex?.people} people) and the row above it stays contained`);
          if (id === "m-sameage" && ex) ok(Object.entries(SAMEAGE_WHO).every(([k, names]) => JSON.stringify(ex.who[k]) === JSON.stringify(names)), `${w} ${theme}: who resonated is the seeded Italian circle (${Object.entries(ex.who).map(([k, v]) => `${k.split("-")[0]}: ${v.join(", ")}`).join(" · ")})`);
        }
      }
    }
    // View as public with Celestial on (P0-3 part 1) — the preview's inert wrappers in the
    // cluster. S1: the preview is the stranger's view of the owner's OWN World (their public
    // Moments only), so the probe uses Giulia's own resonated Moment, m-panorama.
    await open(page, phone(360), { theme: "dark" });
    await page.evaluate(() => document.querySelector("[data-sb-view-as-public]")?.click());
    await sleep(900);
    await toMoment(page, "m-panorama");
    const pv = await measure(page, "m-panorama");
    const pvInert = await page.evaluate(() => {
      const m = document.querySelector("[data-sb-moment='m-panorama']");
      return { viewer: document.querySelector("[data-sb-render-viewer]")?.getAttribute("data-sb-render-viewer"), resonateInert: !!m.querySelector("[data-sb-resonate]")?.closest("[inert]"), boomInert: !!m.querySelector("[data-sb-express]")?.closest("[inert]") };
    });
    ok(pvInert.viewer === "public" && pvInert.resonateInert && pvInert.boomInert, `View as public with Celestial on: the stream renders for the public stand-in, Boom and Resonate inert (${JSON.stringify(pvInert)})`);
    ok(pv && K.every((k) => pv.c[k] && inside(pv.c[k], pv.moment)) && oneLine(pv) && pv.docW <= pv.vw, "View as public with Celestial on: the same four actions, one line, inside the Moment");
    await page.click("[data-sb-moment='m-panorama'] [data-sb-resonate]").catch(() => {});
    await sleep(500);
    ok(!(await page.$("[data-sb-celestial-field]")), "View as public: a tap on the inert Resonate opens nothing");

    /* ---- §5 range ---- */
    console.log("§5 flag off · 512–667 labelled · desktop");
    await open(page, phone(360), { theme: "dark", celestial: false });
    await toMoment(page, "m-sameage");
    const off = await measure(page, "m-sameage");
    ok(!off.c.resonate && !!off.c.respond && !!off.c.boom && !!off.c.more, "flag off: no Resonate control, Respond · Boom · ⋯ as before");
    ok(off.gap === "8px", `flag off: the phone row keeps its 8px spacing — nothing changes for the default product (${off.gap})`);
    ok(oneLine(off) && inside(off.c.more, off.moment), "flag off: one line, ⋯ inside the Moment");
    for (const w of [512, 600, 667]) {
      for (const locale of ["en", "ru"]) {
        await open(page, phone(w, w === 667 ? 375 : 844), { theme: "dark", locale });
        await toMoment(page, "m-sameage", 70);
        const g = await measure(page, "m-sameage");
        ok(!!g.label && g.c.resonate.h >= 43.5 && K.every((k) => g.c[k] && inside(g.c[k], g.moment)) && oneLine(g) && g.gap === "8px", `${locale} ${w}${w === 667 ? "×375" : ""}: the Resonate word returns where it fits (“${g.label}”), still a 44px target, one line, 8px spacing`);
      }
    }
    await page.setCookie({ name: "sb-locale", value: "en", url: HOST });
    for (const w of [672, 1024, 1440]) {
      await open(page, desktop(w), { theme: "dark" });
      await toMoment(page, "m-sameage", 140);
      const g = await measure(page, "m-sameage");
      const vil = await page.evaluate(() => { const b = [...document.querySelectorAll("[data-sb-moment='m-sameage'] [data-sb-actions-more] button")].find((x) => x.disabled); return !!b && b.getBoundingClientRect().width > 0; });
      const cs = Object.values(g.centres).filter((v) => v !== null);
      ok(g.label === "Resonate" && g.gap === "12px" && vil && Math.max(...cs) - Math.min(...cs) < 0.6 && oneLine(g) && g.row.h <= 41, `${w}: the desktop row as before — the word, 12px spacing, View in Life, one shared vertical centre (${cs.join(" · ")})`);
    }

    /* ---- §6 the Circle / Life Day Almanac ---- */
    console.log("§6 the Circle / Life Day Almanac (a narrower column rendering the same row)");
    for (const w of [360, 375, 390]) {
      for (const locale of LOCALES) {
        await open(page, phone(w, 900), { theme: "dark", locale, url: `${HOST}/style-lab/circle`, extra: `&w=${w}&c=day:2026-08-30` });
        const g = await measure(page, "m-panorama");
        if (!g) { ok(false, `${locale} ${w} Almanac: m-panorama is on the day`); continue; }
        const fits = g.need <= g.primaryW + 0.5;
        ok(K.every((k) => g.c[k] && inside(g.c[k], g.moment)) && g.docW <= g.vw && g.c.more.t <= g.c.respond.t + 1 && !overlap(g.c.respond, g.c.more) && !overlap(g.c.resonate, g.c.more),
          `${locale} ${w} Almanac: all four actions inside the Moment, ⋯ on the first line, nothing overlaps it, no page scroll`);
        ok(oneLine(g) === fits, `${locale} ${w} Almanac: ${fits ? "one line — the cluster fits" : "the cluster wraps — only because it must"} (needs ${g.need.toFixed(0)}px of ${g.primaryW.toFixed(0)}px)`);
      }
    }
    await page.setCookie({ name: "sb-locale", value: "en", url: HOST });

    /* ---- §7 below the brief's range ---- */
    console.log("§7 320px and very large text: wrap, never clip or collide");
    await open(page, phone(320, 700), { theme: "dark" });
    for (const id of ["m-sameage", "m-video"]) {
      await toMoment(page, id);
      const g = await measure(page, id);
      ok(K.every((k) => g.c[k] && inside(g.c[k], g.moment)) && g.docW <= g.vw && g.c.more.t <= g.c.respond.t + 1 && !overlap(g.c.respond, g.c.more), `320 ${id}: every action inside the Moment, ⋯ keeps its first-line slot (${oneLine(g) ? "one line" : "the cluster wraps"}), no page scroll`);
    }
    for (const locale of ["ne", "es", "ru"]) {
      await open(page, phone(320, 700), { theme: "dark", locale });
      await page.addStyleTag({ content: "[data-sb-actions]{font-size:26px!important}" }); // ≈200% text on the 13px row
      await sleep(300);
      await toMoment(page, "m-sameage");
      const g = await measure(page, "m-sameage");
      ok(K.every((k) => g.c[k] && inside(g.c[k], g.moment)) && !overlap(g.c.respond, g.c.more) && !overlap(g.c.resonate, g.c.more) && g.docW <= g.vw, `${locale} 320 at ≈200% text: Respond never runs into ⋯ (Respond ends ${g.c.respond.r.toFixed(0)}, ⋯ starts ${g.c.more.l.toFixed(0)})`);
    }
    await page.setCookie({ name: "sb-locale", value: "en", url: HOST });

    /* ---- evidence (untouched runtime frames) ---- */
    console.log("evidence");
    const shot = (name) => page.screenshot({ path: path.join(EV, `${name}.png`) });
    for (const [w, theme, id, name] of [[360, "dark", "m-sameage", "d-360-compact-5"], [390, "dark", "m-video", "d-390-compact-8"], [360, "light", "m-sameage", "l-360-compact-5"], [390, "light", "m-video", "l-390-compact-8"], [360, "dark", "m-rain", "d-360-compact-0"], [390, "dark", "m-activity", "d-390-compact-1"]]) {
      await open(page, phone(w), { theme });
      await toMoment(page, id, id === "m-video" ? -340 : 96); // the video Moment: land on its action row
      await shot(name);
    }
    for (const [w, theme, id, name] of [[360, "dark", "m-sameage", "d-360-expanded-5"], [390, "dark", "m-video", "d-390-expanded-8"], [360, "light", "m-sameage", "l-360-expanded-5"], [390, "light", "m-video", "l-390-expanded-8"]]) {
      await open(page, phone(w), { theme });
      await toMoment(page, id);
      await page.click(`[data-sb-moment='${id}'] [data-sb-resonance-who]`);
      await sleep(500);
      if (id === "m-video") await page.evaluate((mid) => { const r = document.querySelector(`[data-sb-moment='${mid}'] [data-sb-actions]`); window.scrollTo(0, window.scrollY + r.getBoundingClientRect().top - 110); }, id);
      await sleep(300);
      await shot(name);
    }

    ok(pageErrors.length === 0, `no page errors${pageErrors.length ? ` (${pageErrors[0]})` : ""}`);
  } finally {
    await browser.close();
  }
  console.log(`\nsocial-4-4a1-p06: ${passed} passed, ${failures.length} failed`);
  if (failures.length) { failures.forEach((f) => console.log(`  FAILED: ${f}`)); process.exitCode = 1; }
})();
