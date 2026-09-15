/* SYSTEMBOOM — ONE PRODUCT suite (final My World model).
   Proves the mechanics of one product: honest routes, one persistent brand and
   no destination menu, one theme store, real browser behaviour, and the 3D
   boundary. The user-facing model: Cosmos (/) is Home; MY WORLD (/world) is the
   personal Home whose stream is Moments; LIFE (/life) is inside it.
     node prototype-tests/one-application.js */
const fs = require("fs");
const { launch, sleep } = require("./lib");

const HOST = "http://localhost:3210";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/one-application";
fs.mkdirSync(EV, { recursive: true });

let passed = 0;
const failures = [];
const ok = (c, label) => {
  if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); }
};
const shot = (page, name, full = false) => page.screenshot({ path: `${EV}/${name}.png`, fullPage: full });
const VW = { 360: 420, desktop: 1440 };

async function open(page, path, { theme = "dark", w = "desktop" } = {}) {
  await page.setViewport({ width: VW[w], height: 1100, deviceScaleFactor: 1.5, hasTouch: w === 360 });
  const u = new URL(HOST + path);
  u.searchParams.set("theme", theme);
  await page.goto(u.toString(), { waitUntil: "networkidle2" });
  await sleep(700);
}
const themeOf = (page) => page.evaluate(() => document.documentElement.dataset.theme);
const pathOf = (page) => new URL(page.url()).pathname;
const brand = (page) =>
  page.$eval("[data-sb-brand]", (e) => ({
    at: e.getAttribute("data-sb-brand-at"),
    href: e.getAttribute("href"),
    context: e.querySelector("[data-sb-context]")?.textContent.trim() ?? null,
  })).catch(() => null);
async function enterIdentity(page) {
  await page.waitForSelector("[role=dialog]", { timeout: 12000 });
  await sleep(400);
  await page.evaluate(() => {
    [...document.querySelectorAll("[role=dialog] button")].find((x) => /Enter as Maya Rai/.test(x.textContent))?.click();
  });
  await sleep(700);
}

(async () => {
  const { browser, page, errors } = await launch();
  const consoleErrors = [];
  let probing = false;
  page.on("console", (m) => { if (m.type() === "error" && !probing && !/favicon|ERR_/.test(m.text())) consoleErrors.push(m.text()); });

  try {
    /* ---- 0. enter the product the way a person does ---- */
    console.log("0. entry");
    await open(page, "/");
    await sleep(1800);
    await page.click("[data-sb-gate-opener]");
    await sleep(600);
    await enterIdentity(page);
    ok(!!(await page.$("[data-sb-enter-world]")), "the root experience is where a person enters SYSTEMBOOM");
    await page.keyboard.press("Escape");
    await sleep(300);

    /* ---- 1. honest routes ---- */
    console.log("1. routes");
    for (const [p, want] of [["/", 200], ["/world", 200], ["/life", 200], ["/style-lab/social", 200], ["/style-lab/circle", 200]]) {
      const res = await page.goto(HOST + p, { waitUntil: "domcontentloaded" });
      ok(res.status() === want, `${p} answers ${want}`);
    }
    probing = true;
    const earth404 = await page.goto(`${HOST}/earth`, { waitUntil: "domcontentloaded" });
    ok(earth404.status() === 404, "no /earth route was invented — Earth stays inside Cosmos");
    await sleep(250);
    probing = false;
    await open(page, "/social");
    ok(pathOf(page) === "/world", `"Social" is capability vocabulary: /social continues to /world (${pathOf(page)})`);

    /* ---- 2. one brand, no destination menu ---- */
    console.log("2. one global control");
    for (const [p, id, ctx] of [["/world", "world", "My World"], ["/life", "life", "Life"]]) {
      await open(page, p);
      const b = await brand(page);
      ok(!!b && b.at === id && b.context === ctx && b.href === "/", `${ctx}: the mark goes Home and the context reads ${ctx}`);
      const brands = await page.$$eval("[data-sb-brand]", (n) => n.length);
      const menus = await page.$$eval("[data-sb-compass-panel], [data-sb-dest], [data-sb-appnav], [data-sb-nav]", (n) => n.length);
      const navRows = await page.$$eval("nav", (n) => n.filter((x) => x.getBoundingClientRect().height > 0 && !/search|notifications|temporal/i.test(x.getAttribute("aria-label") || "")).length);
      ok(brands === 1 && menus === 0 && navRows === 0, `${ctx}: one brand, no destination menu, no navigation rows`);
    }
    await open(page, "/");
    await sleep(1800);
    ok(!(await page.$("[data-sb-shell-bar]")) && !(await page.$("[data-sb-brand]")), "Cosmos stays immersive — its own frozen controls, no layered chrome");
    ok(!!(await page.$("[data-sb-gate-opener]")), "Cosmos carries its identity chip");
    await shot(page, "01-cosmos-root-auth-state");
    await shot(page, "02-cosmos-global-control");

    /* ---- 3. Earth is a state, not a URL — the deep link still works ---- */
    console.log("3. Earth");
    await open(page, "/?to=earth");
    await sleep(3200);
    const earthState = await page.evaluate(() => (window.__SB_STATE ? { mode: window.__SB_STATE.mode, selected: window.__SB_STATE.selected } : null));
    ok(!!earthState && earthState.selected === "earth" && earthState.mode === "focus", `the Earth intent still focuses Earth (${JSON.stringify(earthState)})`);
    ok(!/to=earth/.test(page.url()), "the intent is consumed, not left in the URL");
    const earthLinks = await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")).filter((h) => /to=earth|\/earth/.test(h)).length);
    ok(earthLinks === 0, "no signed-in navigation item points at Earth — it belongs to Cosmos exploration");

    /* ---- 4. journeys ---- */
    console.log("4. journeys");
    await open(page, "/");
    await sleep(1800);
    await page.click("[data-sb-enter-world]");
    await page.waitForSelector("[data-sb-sheet]", { timeout: 20000 });
    await sleep(600);
    ok(pathOf(page) === "/world", "Cosmos → Enter my world → MY WORLD, no hub between");
    await shot(page, "10-cosmos-to-social-context");
    await page.click("[data-sb-life-entry]");
    await page.waitForSelector("[data-sb-circle-view]", { timeout: 20000 });
    await sleep(700);
    ok(pathOf(page) === "/life", "My World → Life through the hero's Circle row");
    await shot(page, "07-circle-same-app-shell");
    await page.goBack();
    await page.waitForSelector("[data-sb-sheet]", { timeout: 15000 });
    await sleep(400);
    ok(pathOf(page) === "/world", "browser Back returns to My World");
    await shot(page, "15-browser-back-social-circle");
    await page.goForward();
    await page.waitForSelector("[data-sb-circle-view]", { timeout: 15000 });
    await sleep(400);
    ok(pathOf(page) === "/life", "browser Forward returns to Life");
    await page.reload({ waitUntil: "networkidle2" });
    await sleep(700);
    ok(!!(await page.$("[data-sb-circle-view]")), "refresh keeps the destination");
    await page.click("[data-sb-brand]");
    await sleep(2200);
    ok(pathOf(page) === "/" && !!(await page.$("[data-sb-gate-opener]")), "the SYSTEMBOOM mark returns Home to Cosmos");
    await shot(page, "09-social-to-cosmos");

    /* ---- 5. direct load ---- */
    console.log("5. direct load");
    await open(page, "/world");
    const direct = await brand(page);
    ok(!!(await page.$("[data-sb-sheet]")) && direct.at === "world", "a direct /world URL loads My World and knows where it is");
    await shot(page, "13-direct-social-load");
    await shot(page, "03-social-desktop-one-shell", true);

    /* ---- 6. theme is one store; navigation never changes appearance ---- */
    console.log("6. theme");
    await open(page, "/world", { theme: "dark" });
    await shot(page, "11-dark-continuity");
    await page.click("[data-sb-brand]");
    await sleep(2000);
    ok((await themeOf(page)) === "dark", "My World dark → Cosmos stays dark");
    await page.goBack();
    await page.waitForSelector("[data-sb-sheet]", { timeout: 15000 });
    await sleep(500);
    ok((await themeOf(page)) === "dark", "back to My World: still dark");
    await page.evaluate(() => document.querySelector("[data-sb-social-frame] button[aria-label^='Switch to']")?.click());
    await sleep(400);
    ok((await themeOf(page)) === "light", "one theme control switches the product");
    await page.goto(`${HOST}/life`, { waitUntil: "networkidle2" });
    await sleep(600);
    ok((await themeOf(page)) === "light", "…and Life agrees (one store)");
    await shot(page, "12-light-continuity");
    const flash = await page.evaluate(() => new Promise((res) => {
      const seen = [document.documentElement.dataset.theme];
      const mo = new MutationObserver(() => seen.push(document.documentElement.dataset.theme));
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      requestAnimationFrame(() => requestAnimationFrame(() => { mo.disconnect(); res(seen); }));
    }));
    ok(flash.every((t) => t === "light"), `no flash between destinations (${flash.join(",")})`);
    await page.evaluate(() => localStorage.removeItem("sb-theme"));

    /* ---- 7. 360 — one control, content fast ---- */
    console.log("7. 360");
    for (const [p, label, sel] of [["/world", "My World", "[data-sb-sheet]"], ["/life", "Life", "[data-sb-circle-view]"]]) {
      await open(page, p, { theme: "dark", w: 360 });
      await page.waitForSelector(sel, { timeout: 15000 });
      const brands = await page.$$eval("[data-sb-brand]", (n) => n.length);
      const navRows = await page.$$eval("nav", (n) => n.filter((x) => x.getBoundingClientRect().height > 0 && !/search|notifications|temporal/i.test(x.getAttribute("aria-label") || "")).length);
      const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
      ok(brands === 1 && navRows === 0 && noScroll, `${label} at 360: one brand, no navigation rows, no horizontal scroll`);
    }
    await open(page, "/world", { theme: "dark", w: 360 });
    ok(await page.evaluate(() => !!document.querySelector("[data-sb-open-composer]")?.getBoundingClientRect().width), "360: the composer stays present");
    await shot(page, "04-social-360-one-shell");
    await shot(page, "14-mobile-no-duplicate-nav");

    /* ---- 8. performance boundary ---- */
    console.log("8. performance");
    for (const [p, label] of [["/world", "My World"], ["/life", "Life"]]) {
      await open(page, p);
      const canvases = await page.$$eval("canvas", (n) => n.length);
      const three = await page.evaluate(() => [...document.querySelectorAll("script[src]")].map((s) => s.src).filter((s) => /three|fiber|drei/i.test(s)).length);
      ok(canvases === 0 && three === 0, `${label}: no hidden Cosmos renderer (${canvases} canvas, ${three} three.js scripts)`);
    }
    await open(page, "/");
    await sleep(1800);
    ok((await page.$$eval("[data-sb-sheet]", (n) => n.length)) === 0, "Cosmos carries no hidden Moments stream");

    /* ---- 9. behaviour preserved ---- */
    console.log("9. no regression");
    await open(page, "/world", { theme: "light" });
    const own = await page.$eval("[data-sb-moment='m-rain'] [data-sb-readout]", (e) => e.textContent);
    const other = await page.$eval("[data-sb-moment='m-meal'] [data-sb-readout]", (e) => e.textContent);
    ok(/34y 10m \d\dd/.test(own) && /30–45/.test(other) && !/\d+y \d\dm/.test(other), "privacy unchanged: own exact, other band-only");
    ok(await page.evaluate(() => [...document.querySelectorAll("[data-sb-moment] button")].some((b) => /Respond/.test(b.textContent))), "Respond still reads as a word");
    await open(page, "/life", { theme: "light" });
    ok((await page.$$eval("[data-sb-dial] g[role=option]", (n) => n.length)) === 10, "the Circle is untouched (10 bands)");

    /* ---- 10. page health ---- */
    console.log("10. page health");
    ok(errors.length === 0, `zero page errors (${errors.length}) ${errors.slice(0, 2).join(" | ")}`);
    ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length}) ${consoleErrors.slice(0, 2).join(" | ")}`);
  } catch (e) {
    console.log("ONE PRODUCT: CRASH", e);
    failures.push(`CRASH ${e.message}`);
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  for (const f of failures) console.log(` - ${f}`);
  await browser.close();
  console.log(failures.length ? "ONE APPLICATION: FAIL" : "ONE APPLICATION: PASS");
  process.exit(failures.length ? 1 : 0);
})();
