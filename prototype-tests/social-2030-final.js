/* SYSTEMBOOM — SOCIAL 2030 FINAL: the spatial + mobile + desktop + performance
   acceptance for the visual-freeze pass. Viewport matrix, the wider human cast,
   no-overflow, performance guards, and the generic (no-hover / motion-off /
   change-the-logo) tests.
     node prototype-tests/social-2030-final.js */
const fs = require("fs");
const { launch, sleep } = require("./lib");
const HOST = "http://localhost:3210";
const S = "/style-lab/social";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/social-2030-final";
fs.mkdirSync(EV, { recursive: true });
let passed = 0; const failures = [];
const ok = (c, label) => { if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); } };
async function open(page, w, h, { theme = "light", viewer, extra = {} } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: w < 700 });
  const u = new URL(HOST + S); u.searchParams.set("theme", theme); u.searchParams.set("harness", "0");
  if (viewer) u.searchParams.set("viewer", viewer);
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
  await page.goto(u.toString(), { waitUntil: "networkidle2" }); await sleep(500);
}
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2);

(async () => {
  const { page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { const f = `${m.text()}`; if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|Back-Forward/.test(f)) consoleErrors.push(f); });

  /* ---- 1. The wider human cast ---- */
  console.log("1. Human cast");
  await open(page, 1440, 900);
  await page.click("[data-sb-people]"); await sleep(400);
  const yours = await page.$$eval("[data-sb-people-yours] [data-sb-people-row]", (els) => els.length).catch(() => 0);
  ok(yours >= 8, `Your people is a populated network, not a handful (${yours})`);
  const names = await page.evaluate(() => document.querySelector("[data-sb-people-panel]").textContent);
  ok(/Matteo Gallo/.test(names) && /Aurora Ferrari/.test(names) && /Andrea Costa/.test(names), "the wider Italian circle is present alongside the core cast");
  const castPhotos = await page.$$eval("[data-sb-people-panel] [data-sb-identity-photo]", (els) => els.length).catch(() => 0);
  ok(castPhotos >= 5, `real photographs populate the network, not only initials (${castPhotos})`);
  await page.keyboard.press("Escape");

  /* ---- 2. Viewport matrix — no horizontal overflow anywhere ---- */
  console.log("2. Viewport matrix (no horizontal overflow)");
  const phones = [[360,800],[375,812],[390,844],[393,852],[412,915],[430,932]];
  for (const [w, h] of phones) { await open(page, w, h); ok(await noHScroll(page), `owner ${w}×${h}: no horizontal overflow`); }
  await open(page, 852, 393); ok(await noHScroll(page), "phone landscape 852×393: no horizontal overflow");
  for (const [w, h] of [[768,1024],[820,1180],[1024,768]]) { await open(page, w, h); ok(await noHScroll(page), `tablet ${w}×${h}: no horizontal overflow`); }
  for (const w of [1280,1366,1440,1600,1920]) { await open(page, w, 900); ok(await noHScroll(page), `desktop ${w}: no horizontal overflow`); }
  // visitor + a request panel open must also not overflow at 360
  await open(page, 360, 800, { viewer: "ashaVisitor" }); ok(await noHScroll(page), "visitor 360: no horizontal overflow");
  await open(page, 360, 800); await page.click("[data-sb-people]"); await sleep(300); ok(await noHScroll(page), "People panel open at 360: no horizontal overflow");

  /* ---- 3. Mobile first-Moment priority + short-viewport hero ---- */
  console.log("3. Mobile priority + short-viewport hero");
  await open(page, 360, 800);
  const fm = await page.$eval("[data-sb-moment]", (e) => Math.round(e.getBoundingClientRect().top + window.scrollY));
  ok(fm < 820, `360 first Moment begins around the first screen (${fm}px)`);
  await open(page, 852, 393);
  const coverH = await page.$eval("[data-sb-cover-region]", (e) => Math.round(e.getBoundingClientRect().height));
  ok(coverH <= 80, `landscape/short viewport collapses the World Wall so content is reachable (${coverH}px)`);
  const barVisibleLandscape = await page.evaluate(() => { const b = document.querySelector("[data-sb-people]"); const r = b.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; });
  ok(barVisibleLandscape, "landscape: the utility bar (People/Messages/Notifications) is on the first screen");

  /* ---- 4. Desktop width discipline ---- */
  console.log("4. Desktop width discipline");
  await open(page, 1920, 900);
  const mainW = await page.$eval("main", (e) => Math.round(e.getBoundingClientRect().width));
  ok(mainW <= 1160, `human content stays a comfortable column on a wide monitor, not stretched (${mainW}px)`);
  const feedW = await page.$eval("[data-sb-sheet]", (e) => Math.round(e.getBoundingClientRect().width));
  ok(feedW <= 820, `the Moment reading column stays comfortable at 1920 (${feedW}px)`);

  /* ---- 5. Performance guards ---- */
  console.log("5. Performance guards");
  await open(page, 1440, 900);
  const canvases = await page.$$eval("[data-sb-social-frame] canvas", (els) => els.length).catch(() => 0);
  ok(canvases === 0, `no WebGL/canvas Social (${canvases})`);
  const infinite = await page.evaluate(() => {
    const scope = document.querySelector("[data-sb-social-frame]"); if (!scope) return -1;
    let n = 0;
    for (const el of scope.querySelectorAll("*")) { const a = getComputedStyle(el); if (a.animationName !== "none" && a.animationIterationCount === "infinite") n++; }
    return n;
  });
  ok(infinite === 0, `no persistent/looping animation on any Social element (${infinite})`);

  /* ---- 6. Ring stays Life-only (no relationship semantics in geometry) ---- */
  console.log("6. Ring semantics");
  await open(page, 1440, 900); await page.click("[data-sb-people]"); await sleep(300);
  await page.evaluate(() => { const i = document.querySelector("[data-sb-people-find]"); i.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, "Matteo"); i.dispatchEvent(new Event("input", { bubbles: true })); });
  await sleep(300); await page.click("[data-sb-people-row] button").catch(() => {});
  await sleep(300);
  const ringAttrs = await page.$eval("[data-sb-person-card] [data-sb-ring]", (e) => [...e.attributes].map((a) => a.name)).catch(() => []);
  ok(ringAttrs.length > 0 && !ringAttrs.some((a) => /friend|family|online|request|message|verified|notif/i.test(a)), "a person's Life Ring encodes no relationship/online/notification state");
  await page.keyboard.press("Escape");

  /* ---- 7. Generic test — no-hover: primary actions reachable without hover ---- */
  console.log("7. No-hover reachability");
  await open(page, 1440, 900);
  const reachable = await page.evaluate(() => {
    const need = ["[data-sb-people]", "[data-sb-bell]", "[data-sb-messages]", "[data-sb-open-composer]", "[data-sb-view-as-public]"];
    return need.every((s) => { const el = document.querySelector(s); if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  });
  ok(reachable, "People, Notifications, Messages, Composer and View-as-public are all visible without hover");

  /* ---- 8. Generic test — motion-off: still distinctive ---- */
  console.log("8. Motion-off distinctiveness");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 1440, 900);
  const distinct = await page.evaluate(() => ({
    ring: !!document.querySelector("[data-sb-hero] [data-sb-ring-instrument]"),
    almanac: !!document.querySelector("[data-sb-sheet] [data-sb-date-rule]"),
    context: (document.querySelector("[data-sb-world-context]") || {}).textContent || "",
  }));
  ok(distinct.ring && distinct.almanac && /My World/.test(distinct.context), "with motion off, the Life Instrument, Almanac and World context still define the product");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* ---- 9. Generic test — change-the-logo: unmistakable characteristics ---- */
  console.log("9. Change-the-logo");
  await open(page, 1440, 1000);
  const dna = await page.evaluate(() => ({
    lifeRing: !!document.querySelector("[data-sb-hero] [data-sb-ring]"),
    realPhoto: !!document.querySelector("[data-sb-hero] [data-sb-identity-photo]"),
    almanac: !!document.querySelector("[data-sb-sheet] [data-sb-date-rule]"),
    coordinate: !!document.querySelector("[data-sb-readout]"),
    worldContext: !!document.querySelector("[data-sb-world-context]"),
  }));
  ok(Object.values(dna).every(Boolean), `SYSTEMBOOM DNA survives without branding: real-photo + Life Ring, Almanac, life coordinate, World context (${JSON.stringify(dna)})`);

  /* ---- 10. Old-social test — desktop identity is asymmetric, wall is atmosphere ---- */
  console.log("10. Old-social test");
  await open(page, 1440, 1000);
  const shape = await page.evaluate(() => {
    const hero = document.querySelector("[data-sb-hero]");
    const cover = hero.querySelector("[data-sb-cover-region]");
    const ring = hero.querySelector("[data-sb-ring]");
    const row = ring?.closest("div.relative")?.parentElement;
    return { coverH: Math.round(cover.getBoundingClientRect().height), row: row ? getComputedStyle(row).flexDirection : null };
  });
  ok(shape.row === "row", "desktop identity is an asymmetric row, not a centered avatar+name stack");
  ok(shape.coverH <= 160, `the World Wall is atmosphere, not a masthead (${shape.coverH}px)`);

  /* ---- 11. Page health ---- */
  console.log("11. Page health");
  ok(errors.length === 0, `zero page errors (${errors.length})`);
  ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length}) ${consoleErrors[0] ?? ""}`);

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log("FAILED:"); failures.forEach((f) => console.log(" - " + f)); }
  console.log(`\nSOCIAL 2030 FINAL: ${failures.length ? "FAIL" : "PASS"}`);
  process.exit(failures.length ? 1 : 0);
})();
