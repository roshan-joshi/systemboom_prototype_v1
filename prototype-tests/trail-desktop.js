/**
 * PHASE 1.10C — GEOGRAPHIC ADDRESS TRAIL, desktop flows A–G + I + Escape.
 * Click = selection (never repositioning); trail = breadcrumb = back path.
 */
process.env.SB_EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/phase-01-10c";
const { launch, sleep, waitFor, getState, shot, ready, clickButton } = require("./lib");

const passes = [];
const pass = (n, note = "") => { passes.push(n); console.log(`PASS ${n} ${note}`); };

const getTrail = (page) =>
  page.evaluate(() => {
    const t = window.__SB_TRAIL || { entries: null, locating: false };
    return { names: t.entries ? t.entries.map((e) => e.name) : null, locating: t.locating };
  });
const mapInfo = (page) =>
  page.evaluate(() => {
    if (!window.__SB_MAP) return null;
    const c = window.__SB_MAP.getCenter();
    const aside = document.querySelector("aside");
    return {
      lat: c.lat, lng: c.lng, zoom: window.__SB_MAP.getZoom(),
      territory: window.__SB_TERRITORY ?? null,
      card: aside ? aside.innerText.replace(/\n/g, " | ").slice(0, 160) : null,
      ladder: (document.querySelector('nav[aria-label="Geographic scale ladder"]')?.innerText || "").replace(/\n/g, " "),
    };
  });
const waitLive = (page, t = 45000) =>
  waitFor(page, () => window.__SB_STATE.stage === "live" && !!window.__SB_MAP, t, "map live");
const waitLocated = (page, t = 12000) =>
  waitFor(page, () => window.__SB_TRAIL && !window.__SB_TRAIL.locating, t, "resolution settled");
/** Screen point of a lat/lng in the Leaflet container. */
const screenPt = (page, lat, lon) =>
  page.evaluate(({ la, lo }) => {
    const p = window.__SB_MAP.latLngToContainerPoint([la, lo]);
    return { x: p.x, y: p.y };
  }, { la: lat, lo: lon });
const crumbClick = (page, name) =>
  page.evaluate((n) => {
    const b = [...document.querySelectorAll('nav[aria-label="Geographic scale ladder"] button')]
      .find((x) => x.getAttribute("aria-label") === `View ${n}`);
    if (!b) return false;
    b.click();
    return true;
  }, name);
async function stayLive(page, ms = 3000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const st = await getState(page);
    if (st.stage !== "live") throw new Error(`left the map mid-navigation (${st.stage})`);
    await sleep(300);
  }
}
/** Deterministically face a lat/lon on the 3D globe via arrow-key rotation. */
async function faceLatLon(page, lat, lon, tol = 6) {
  const facing = () => page.evaluate(() => window.__SB_FACING.current);
  const norm = (d) => ((d + 540) % 360) - 180;
  await waitFor(page, () => window.__SB_CAM && !window.__SB_CAM.travelling, 20000, "camera settled");
  await sleep(600);
  // calibrate horizontal direction (repeat until a real delta is measured)
  let rightSign = 0;
  for (let c = 0; c < 5 && !rightSign; c++) {
    const f0 = await facing();
    for (let k = 0; k < 3; k++) { await page.keyboard.press("ArrowRight"); await sleep(120); }
    await sleep(900);
    const f1 = await facing();
    const d = norm(f1.lon - f0.lon);
    if (Math.abs(d) > 2) rightSign = Math.sign(d);
  }
  if (!rightSign) return false;
  let upSign = 0;
  for (let c = 0; c < 5 && !upSign; c++) {
    const f0 = await facing();
    for (let k = 0; k < 2; k++) { await page.keyboard.press("ArrowUp"); await sleep(120); }
    await sleep(900);
    const f1 = await facing();
    const d = f1.lat - f0.lat;
    if (Math.abs(d) > 1) upSign = Math.sign(d);
  }
  if (!upSign) return false;
  for (let i = 0; i < 140; i++) {
    const f = await facing();
    const dLon = norm(lon - f.lon);
    const dLat = lat - f.lat;
    if (Math.abs(dLon) <= tol && Math.abs(dLat) <= tol) {
      await sleep(900);
      return true;
    }
    if (Math.abs(dLon) > tol) {
      await page.keyboard.press(dLon * rightSign > 0 ? "ArrowRight" : "ArrowLeft");
    } else {
      await page.keyboard.press(dLat * upSign > 0 ? "ArrowUp" : "ArrowDown");
    }
    await sleep(180);
  }
  return false;
}
async function steerToLabel(page, id, name, maxIter = 26) {
  const visible = () =>
    page.evaluate((n) => {
      const b = [...document.querySelectorAll("button")].find(
        (x) => x.getAttribute("aria-label") === `View ${n}` && !x.closest("nav") && !x.closest("aside"),
      );
      return !!b && parseFloat(getComputedStyle(b.parentElement).opacity || "0") >= 0.25;
    }, name);
  for (let it = 0; it < maxIter; it++) {
    if (await visible()) return true;
    const s = await page.evaluate((i) => {
      const e = (window.__SB_SLOTS || {})[i];
      return e ? { x: e.x, y: e.y } : null;
    }, id);
    const dx = s ? Math.max(-170, Math.min(170, (720 - s.x) * 0.45)) : -130;
    const dy = s ? Math.max(-100, Math.min(100, (450 - s.y) * 0.45)) : 0;
    await page.mouse.move(720, 450);
    await page.mouse.down();
    for (let i = 1; i <= 8; i++) { await page.mouse.move(720 + (dx * i) / 8, 450 + (dy * i) / 8); await sleep(26); }
    await page.mouse.up();
    await sleep(1000);
  }
  return visible();
}

(async () => {
  const { browser, page, errors } = await launch();
  await ready(page);

  /* ---------- FLOW A part 1: 3D → NEPAL name → Nepal map ---------- */
  await clickButton(page, "Earth");
  await waitFor(page, () => window.__SB_STATE.mode === "focus" && window.__SB_CAM && !window.__SB_CAM.travelling, 25000, "Earth focus");
  await sleep(1600);
  if (!(await faceLatLon(page, 28.6, 83.6))) throw new Error("could not face Nepal");
  await page.mouse.move(720, 450);
  for (let i = 0; i < 40; i++) {
    await page.mouse.wheel({ deltaY: -170 });
    await sleep(220);
    const cam = await page.evaluate(() => window.__SB_CAM);
    if (cam && cam.dist <= 1.95) break;
  }
  await sleep(1200);
  if (!(await steerToLabel(page, "cn-nepal", "Nepal", 12))) throw new Error("Nepal label not found");
  await page.evaluate(() => {
    [...document.querySelectorAll("button")]
      .find((x) => x.getAttribute("aria-label") === "View Nepal" && !x.closest("nav"))?.click();
  });
  await waitLive(page);
  await sleep(4200);
  let t = await getTrail(page);
  console.log("  arrival trail:", JSON.stringify(t.names));
  if (!t.names || t.names.join("/") !== "Earth/Asia/Nepal")
    throw new Error(`semantic arrival trail wrong: ${t.names}`);
  await shot(page, "01-nepal-arrival-trail");

  /* manual zoom toward Kathmandu (wheel at its screen point, to city depth) */
  for (let i = 0; i < 34; i++) {
    const z = await page.evaluate(() => window.__SB_MAP.getZoom());
    if (z >= 13.5) break;
    const kp = await screenPt(page, 27.727, 85.328);
    await page.mouse.move(
      Math.max(20, Math.min(1420, kp.x)),
      Math.max(120, Math.min(880, kp.y)),
    );
    await page.mouse.wheel({ deltaY: -240 });
    await sleep(500);
  }
  await sleep(1600);

  /* ---------- FLOW A/B: click T.U. Teaching Hospital ---------- */
  const zdbg = await page.evaluate(() => ({
    zoom: window.__SB_MAP.getZoom(),
    center: window.__SB_MAP.getCenter(),
  }));
  console.log("  after manual zoom:", JSON.stringify(zdbg));
  const tp = await screenPt(page, 27.7358, 85.3305);
  const at = await page.evaluate(({ x, y }) => {
    const e = document.elementFromPoint(x, y);
    return e ? `${e.tagName}.${String(e.className).slice(0, 60)}` : "none";
  }, tp);
  console.log("  TUTH pt:", JSON.stringify(tp), "element:", at);
  if (tp.x < 0 || tp.y < 0 || tp.x > 1440 || tp.y > 900) throw new Error("TUTH off-screen after manual zoom");
  await page.mouse.click(tp.x, tp.y);
  await sleep(2500);
  const dbg = await page.evaluate(() => ({
    trail: window.__SB_TRAIL,
    aside: document.querySelector("aside")?.innerText.replace(/\n/g, "|").slice(0, 120) ?? null,
    zoom: window.__SB_MAP.getZoom(),
    center: window.__SB_MAP.getCenter(),
  }));
  console.log("  post-click state:", JSON.stringify(dbg));
  await waitFor(page, () => {
    const a = document.querySelector("aside");
    return !!a && a.innerText.includes("T.U. Teaching Hospital");
  }, 20000, "TUTH destination card");
  await sleep(2200);
  t = await getTrail(page);
  let mi = await mapInfo(page);
  console.log("  TUTH trail:", JSON.stringify(t.names));
  console.log("  TUTH card:", mi.card);
  const want = ["Earth", "Asia", "Nepal", "Bagmati", "Kathmandu", "Maharajgunj", "T.U. Teaching Hospital"];
  if (!t.names || t.names.join("/") !== want.join("/"))
    throw new Error(`TUTH trail wrong: ${t.names}`);
  const mascotUsed = await page.evaluate(() => {
    const sel = [...document.querySelectorAll(".sb-lens")];
    return [...document.querySelectorAll(".sb-origin img")].length > 2; // only the two standing office masts
  });
  if (mascotUsed) throw new Error("mascot appeared for a generic place");
  await shot(page, "02-tuth-full-trail");
  pass("FLOW A+B", `known place click → ${t.names.join(" / ")}`);

  /* ---------- FLOW C: every ancestor navigates backward ---------- */
  if (!(await crumbClick(page, "Kathmandu"))) throw new Error("KATHMANDU crumb missing");
  await stayLive(page);
  await sleep(2400);
  mi = await mapInfo(page);
  t = await getTrail(page);
  if (Math.abs(mi.zoom - 11.5) > 1.2) throw new Error(`Kathmandu scale wrong: z=${mi.zoom}`);
  if (t.names[t.names.length - 1] !== "Kathmandu") throw new Error(`trail not truncated: ${t.names}`);
  await shot(page, "03-crumb-kathmandu");
  if (!(await crumbClick(page, "Nepal"))) throw new Error("NEPAL crumb missing");
  await stayLive(page);
  await sleep(2600);
  mi = await mapInfo(page);
  if (mi.zoom < 6 || mi.zoom > 8.4 || mi.territory !== "cn-nepal")
    throw new Error(`Nepal fit wrong: z=${mi.zoom} territory=${mi.territory}`);
  await shot(page, "04-crumb-nepal-fitted");
  if (!(await crumbClick(page, "Asia"))) throw new Error("ASIA crumb missing");
  await stayLive(page);
  await sleep(2600);
  mi = await mapInfo(page);
  if (mi.zoom > 4.8) throw new Error(`Asia extent wrong: z=${mi.zoom}`);
  await shot(page, "05-crumb-asia");
  const beforeExit = await mapInfo(page);
  if (!(await crumbClick(page, "Earth"))) throw new Error("EARTH crumb missing");
  await waitFor(page, () => {
    const st = window.__SB_STATE, cam = window.__SB_CAM;
    return st.stage === "off" && !st.journey && cam && !cam.travelling && cam.dist > 4.5;
  }, 45000, "3D Earth return");
  const facing = await page.evaluate(() => window.__SB_FACING.current);
  if (Math.abs(facing.lat - beforeExit.lat) > 12 || Math.abs(facing.lon - beforeExit.lng) > 16)
    throw new Error("EARTH return faced an unrelated hemisphere");
  await sleep(1200);
  await shot(page, "06-earth-return");
  pass("FLOW C", "hospital → KATHMANDU → NEPAL → ASIA in-map, EARTH → 3D facing map view");

  /* ---------- back into the map for D/E (blocked geocoder) ---------- */
  await page.setRequestInterception(true);
  const pendingResponders = [];
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("nominatim.openstreetmap.org")) {
      const m = /lat=([-\d.]+)/.exec(url);
      const lat = m ? parseFloat(m[1]) : 0;
      pendingResponders.push({ req, lat });
      return; // held — the test decides when/what to answer
    }
    req.continue();
  });

  await faceLatLon(page, 42, 92, 9);
  await steerToLabel(page, "ct-asia", "Asia", 10);
  await page.evaluate(() => {
    [...document.querySelectorAll("button")]
      .find((x) => x.getAttribute("aria-label") === "View Asia" && !x.closest("nav"))?.click();
  });
  await waitLive(page);
  await sleep(4200);
  // fit Nepal for a stable stage
  await page.evaluate(() => {
    [...document.querySelectorAll(".sb-geo-target")]
      .find((el) => el.textContent.trim().toUpperCase() === "NEPAL")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await sleep(4200);

  /* ---------- FLOW D + I: unknown point, geocoder unreachable ---------- */
  const wp = await screenPt(page, 29.4, 82.3); // far-western Nepal wilderness
  await page.mouse.click(wp.x, wp.y);
  await sleep(800);
  t = await getTrail(page);
  console.log("  provisional trail:", JSON.stringify(t));
  if (!t.names || t.names.join("/") !== "Earth/Asia/Nepal")
    throw new Error(`local trail wrong: ${t.names}`);
  await shot(page, "07-unknown-point-locating");
  // fail the held request → honest degradation
  while (pendingResponders.length) pendingResponders.shift().req.abort("failed");
  await waitLocated(page, 15000);
  await sleep(1000);
  t = await getTrail(page);
  mi = await mapInfo(page);
  console.log("  degraded trail:", JSON.stringify(t.names), "card:", mi.card);
  if (t.names.join("/") !== "Earth/Asia/Nepal") throw new Error(`degraded trail wrong: ${t.names}`);
  if (!mi.card || !mi.card.toLowerCase().includes("selected location"))
    throw new Error("coordinates card missing");
  if (!/[NS] · .*[EW]/.test(mi.card)) throw new Error("coordinates not shown");
  await shot(page, "08-unknown-point-honest");
  pass("FLOW D+I", "unknown point → EARTH/ASIA/NEPAL + coordinates, no invented POI, geocoder failure survived");

  /* ---------- FLOW E: request race — latest selection wins ---------- */
  page.on("console", (m) => {
    if (m.text().includes("[SB locate]")) console.log("  page:", m.text());
  });
  const pa = await screenPt(page, 29.8, 81.6);
  const pb = await screenPt(page, 28.9, 83.4);
  await page.mouse.click(pa.x, pa.y);
  await sleep(350);
  await page.mouse.click(pb.x, pb.y);
  await sleep(2500); // both lookups now issued/held (throttled)
  const respond = (r, city) =>
    r.req.respond({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({
        name: "", category: "boundary", type: "administrative",
        address: { country: "Nepal", city, state: city === "AAA-ville" ? "AAA-state" : "BBB-state" },
      }),
    });
  // A's answer arrives LAST — it must not overwrite B.
  const reqA = pendingResponders.find((r) => Math.abs(r.lat - 29.8) < 0.2);
  const reqB = pendingResponders.find((r) => Math.abs(r.lat - 28.9) < 0.2);
  if (reqB) await respond(reqB, "BBB-ville").catch((e) => console.log("  respond B err:", e.message));
  await sleep(900);
  if (reqA) await respond(reqA, "AAA-ville").catch((e) => console.log("  respond A err:", e.message));
  await sleep(1500);
  console.log("  post-race:", JSON.stringify(await getTrail(page)));
  t = await getTrail(page);
  console.log("  race trail:", JSON.stringify(t.names), "reqA:", !!reqA, "reqB:", !!reqB);
  if (t.names.includes("AAA-ville") || t.names.includes("AAA-state"))
    throw new Error("stale lookup overwrote the newer selection");
  if (reqB && !t.names.includes("BBB-ville"))
    throw new Error(`latest selection's resolution missing: ${t.names}`);
  await shot(page, "09-race-latest-wins");
  pass("FLOW E", `latest selection wins (${t.names.join(" / ")})`);

  /* ---------- live enrichment (best-effort, real Nominatim) ---------- */
  await page.setRequestInterception(false);
  page.removeAllListeners("request");
  // manual zoom to city depth so the click is a POINT selection
  for (let i = 0; i < 30; i++) {
    const z = await page.evaluate(() => window.__SB_MAP.getZoom());
    if (z >= 13) break;
    const kp = await screenPt(page, 27.72, 85.33);
    await page.mouse.move(
      Math.max(20, Math.min(1420, kp.x)),
      Math.max(120, Math.min(880, kp.y)),
    );
    await page.mouse.wheel({ deltaY: -240 });
    await sleep(450);
  }
  await sleep(1500);
  const cp = await screenPt(page, 27.725, 85.34); // plain urban point, no markers
  await page.mouse.click(cp.x, cp.y);
  await waitLocated(page, 15000).catch(() => null);
  await sleep(1200);
  t = await getTrail(page);
  console.log("  live enrichment trail:", JSON.stringify(t.names));
  await shot(page, "10-live-enrichment");
  pass("ENRICH", `online resolver ${t.names.length > 5 || t.names.some((n) => !["Earth", "Asia", "Nepal", "Bagmati", "Kathmandu"].includes(n)) ? "deepened the trail" : "unavailable — local answer stood"}`);

  /* ---------- selection vs map view: pan far away collapses leaf ------- */
  for (let d = 0; d < 8; d++) {
    await page.mouse.move(1100, 450);
    await page.mouse.down();
    for (let i = 1; i <= 9; i++) { await page.mouse.move(1100 - i * 100, 450 + i * 4); await sleep(24); }
    await page.mouse.up();
    await sleep(600);
    const gone = await page.evaluate(() => !(window.__SB_TRAIL && window.__SB_TRAIL.entries));
    if (gone) break;
  }
  await sleep(1200);
  t = await getTrail(page);
  if (t.names) throw new Error(`selection did not collapse after panning away: ${t.names}`);
  await shot(page, "11-pan-away-collapse");
  pass("SELECTION vs VIEW", "leaf retires after meaningful pan; view context returns");

  /* ---------- FLOW F: Head Office identity preserved ---------- */
  await page.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === "Search Earth")?.click();
  });
  await sleep(400);
  await page.type('input[placeholder="Where on Earth?"]', "London");
  await sleep(400);
  await page.evaluate(() => {
    [...document.querySelectorAll('ul[role="listbox"] button')]
      .find((b) => b.textContent.includes("London"))?.click();
  });
  await sleep(5200);
  // click 250m from the Head Office → identity snap, address untouched
  const hp = await screenPt(page, 51.5366 + 0.002, -0.0225);
  await page.mouse.click(hp.x, hp.y);
  await sleep(1500);
  t = await getTrail(page);
  mi = await mapInfo(page);
  console.log("  head office trail:", JSON.stringify(t.names));
  console.log("  head office card:", mi.card);
  if (t.names[t.names.length - 1] !== "SYSTEMBOOM Head Office")
    throw new Error(`office leaf wrong: ${t.names}`);
  if (!t.names.includes("United Kingdom") || !t.names.includes("Europe"))
    throw new Error("office trail lacks real geography");
  if (!mi.card.includes("Unit 20-21 Vittoria Worth") || !mi.card.includes("E3 2NT"))
    throw new Error("owner-supplied address was altered");
  await shot(page, "12-head-office-identity");
  pass("FLOW F", "Head Office: owner-supplied address intact, real geography around it");

  /* ---------- FLOW G: Development Office stays city-precision ---------- */
  await page.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === "Search Earth")?.click();
  });
  await sleep(400);
  await page.type('input[placeholder="Where on Earth?"]', "Kathmandu");
  await sleep(400);
  await page.evaluate(() => {
    [...document.querySelectorAll('ul[role="listbox"] button')]
      .find((b) => b.textContent.trim().startsWith("Kathmandu"))?.click();
  });
  await sleep(5200);
  const dev = await page.evaluate(() => {
    const o = window.__SB_STATE; // office coords via slots not available here — use known dev office marker
    const m = document.querySelectorAll(".sb-origin");
    return m.length;
  });
  const dp = await screenPt(page, 27.7172 + 0.0015, 85.324 + 0.0015);
  await page.mouse.click(dp.x, dp.y);
  await sleep(1500);
  t = await getTrail(page);
  mi = await mapInfo(page);
  console.log("  dev office trail:", JSON.stringify(t.names), "card:", mi.card);
  if (t.names[t.names.length - 1] !== "SYSTEMBOOM Development Office")
    throw new Error(`dev office leaf wrong: ${t.names}`);
  if (!mi.card.toLowerCase().includes("approximate — city-level location"))
    throw new Error("dev office precision note missing");
  if (t.names.includes("Thamel"))
    throw new Error("city-precision office falsely claimed a district");
  await shot(page, "13-dev-office-city-precision");
  pass("FLOW G", "Development Office keeps honest city-level precision");

  /* ---------- Escape walks the trail ---------- */
  await page.keyboard.press("Escape"); // close panel
  await sleep(600);
  await page.keyboard.press("Escape"); // office leaf → Kathmandu
  await stayLive(page);
  await sleep(2400);
  t = await getTrail(page);
  if (t.names[t.names.length - 1] !== "Kathmandu") throw new Error(`Escape rung 1 wrong: ${t.names}`);
  await page.keyboard.press("Escape"); // → Bagmati
  await stayLive(page);
  await sleep(2200);
  t = await getTrail(page);
  if (t.names[t.names.length - 1] !== "Bagmati") throw new Error(`Escape rung 2 wrong: ${t.names}`);
  await page.keyboard.press("Escape"); // → Nepal (real bounds)
  await stayLive(page);
  await sleep(2600);
  t = await getTrail(page);
  mi = await mapInfo(page);
  if (t.names[t.names.length - 1] !== "Nepal" || mi.territory !== "cn-nepal")
    throw new Error(`Escape rung 3 wrong: ${t.names} territory=${mi.territory}`);
  await shot(page, "14-escape-ladder-nepal");
  pass("ESCAPE", "panel → office → Kathmandu → Bagmati → Nepal, one rung per Escape");

  /* ---------- day/night trail legibility ---------- */
  await shot(page, "15-trail-night");
  await clickButton(page, "Switch to Solar Observatory (light) mode");
  await sleep(1600);
  await shot(page, "16-trail-day");
  await clickButton(page, "Switch to Deep Cosmos (dark) mode");
  await sleep(900);
  pass("LEGIBILITY", "trail captured on day + night maps");

  console.log("\nPAGE ERRORS:", errors.length ? errors : "none");
  if (errors.length) process.exitCode = 1;
  console.log(`\n${passes.length} desktop trail flows PASS`);
  await browser.close();
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
