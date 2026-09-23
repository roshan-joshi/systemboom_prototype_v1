/* SYSTEMBOOM — FINAL MY WORLD acceptance (supersedes the Compass-era checks).
   The user-facing model: Cosmos (/) is Home; identity leads directly into
   MY WORLD (/world), whose stream is MOMENTS; LIFE (/life) is inside the
   person's World; Earth stays inside Cosmos. One brand, no destination menu,
   one theme, no flash. Produces the final evidence set.
     node prototype-tests/final-app.js */
const fs = require("fs");
const { launch, sleep } = require("./lib");

const HOST = "http://localhost:3210";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/final-my-world";
fs.mkdirSync(EV, { recursive: true });

const VW = { 360: 420, 390: 450, 768: 900, desktop: 1440, wide: 1920 };
let passed = 0;
const failures = [];
const ok = (c, label) => {
  if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); }
};
async function shot(page, name, full = false) {
  if (full) {
    // lazy media must load before a full-page capture tells the truth
    await page.evaluate(async () => {
      const h = document.documentElement.scrollHeight;
      for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); }
      window.scrollTo(0, 0);
    });
    await sleep(400);
  }
  await page.screenshot({ path: `${EV}/${name}.png`, fullPage: full });
}

async function open(page, path, { theme = "dark", w = "desktop" } = {}) {
  await page.setViewport({ width: VW[w], height: 1100, deviceScaleFactor: 1.5, hasTouch: w === 360 || w === 390 });
  const u = new URL(HOST + path);
  if (theme) u.searchParams.set("theme", theme);
  await page.goto(u.toString(), { waitUntil: "networkidle2" });
  await sleep(700);
}
const themeOf = (page) => page.evaluate(() => document.documentElement.dataset.theme);
const pathOf = (page) => new URL(page.url()).pathname;
const brand = (page) =>
  page.$eval("[data-sb-brand]", (e) => ({ at: e.getAttribute("data-sb-brand-at"), href: e.getAttribute("href"), context: e.querySelector("[data-sb-context]")?.textContent.trim() ?? null, label: e.getAttribute("aria-label") })).catch(() => null);
async function enterIdentity(page) {
  await page.waitForSelector("[role=dialog]", { timeout: 12000 });
  await sleep(400);
  await page.evaluate(() => {
    [...document.querySelectorAll("[role=dialog] button")].find((x) => /Enter as Giulia Bianchi/.test(x.textContent))?.click();
  });
  await sleep(700);
}
const clearIdentity = (page) => page.evaluate(() => { localStorage.removeItem("sb-session"); sessionStorage.removeItem("sb-intent"); });

(async () => {
  const { browser, page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|ERR_/.test(m.text())) consoleErrors.push(m.text()); });

  try {
    /* ---- 1. the public → personal journey, in the dark it began in ---- */
    console.log("1. Cosmos → identity → My World (dark, no flash)");
    await open(page, "/", { theme: "dark" });
    await clearIdentity(page);
    await page.reload({ waitUntil: "networkidle2" });
    await sleep(2000);
    ok((await themeOf(page)) === "dark", "Cosmos opens in Deep Cosmos");
    await shot(page, "01-cosmos-dark-prelogin");
    await page.click("[data-sb-gate-opener]");
    await sleep(700);
    await shot(page, "02-cosmos-identity-open");
    await enterIdentity(page);
    const cont = await page.$eval("[data-sb-enter-world]", (a) => ({ href: a.getAttribute("href"), text: a.textContent.trim() }));
    ok(cont.href === "/world" && /Enter My World/i.test(cont.text), `identity leads directly into My World (${cont.text} → ${cont.href})`);
    // Entering My World is a client-side navigation: the document persists, so
    // record the theme attribute every animation frame across the transition
    // and require that not one frame leaves dark.
    await page.evaluate(() => {
      window.__SB_THEME_FRAMES = [];
      const rec = () => { window.__SB_THEME_FRAMES.push(document.documentElement.dataset.theme ?? "unset"); if (window.__SB_THEME_FRAMES.length < 120) requestAnimationFrame(rec); };
      requestAnimationFrame(rec);
    });
    await Promise.all([page.click("[data-sb-enter-world]"), page.waitForSelector("[data-sb-sheet]", { timeout: 20000 })]);
    await sleep(150);
    await shot(page, "03-first-my-world-dark-frame");
    const frames = await page.evaluate(() => window.__SB_THEME_FRAMES ?? []);
    ok(frames.length > 10 && frames.every((t) => t === "dark"), `no white flash entering My World (${frames.length} frames, all dark)`);
    ok(pathOf(page) === "/world" && (await themeOf(page)) === "dark", "dark Cosmos enters dark My World, no hub between");
    const b = await brand(page);
    ok(!!b && b.context === "My World" && b.href === "/", `the bar reads MY WORLD and the mark goes Home (${b.context})`);
    await sleep(600);
    await shot(page, "04-my-world-dark-desktop", true);

    /* ---- 2. naming ---- */
    console.log("2. naming");
    const textWorld = await page.evaluate(() => document.body.innerText);
    ok(!/\bSocial\b/.test(textWorld), '"Social" is no longer user-facing on the personal Home');
    ok(!/Dashboard/i.test(textWorld), "no Dashboard vocabulary");
    ok(/What happened at/.test(textWorld), "the Moments stream leads");

    /* ---- 3. My World visual set ---- */
    console.log("3. My World visuals");
    await open(page, "/world", { theme: "dark", w: 360 });
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), "360 dark: no horizontal scroll");
    await shot(page, "05-my-world-dark-360", true);
    await open(page, "/world", { theme: "light" });
    await shot(page, "06-my-world-light-desktop", true);
    await open(page, "/world", { theme: "light", w: 360 });
    await shot(page, "07-my-world-light-360", true);
    await open(page, "/world", { theme: "light", w: 390 });
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), "390: no horizontal scroll");
    await shot(page, "08-my-world-390");
    await open(page, "/world", { theme: "light", w: 768 });
    await shot(page, "09-my-world-768");
    await open(page, "/world", { theme: "light", w: "wide" });
    const widths = await page.evaluate(() => ({
      sheet: Math.round(document.querySelector("[data-sb-sheet]")?.getBoundingClientRect().width ?? 0),
      aside: Math.round(document.querySelector("aside")?.getBoundingClientRect().width ?? 0),
    }));
    ok(widths.sheet >= 600 && widths.sheet <= 800 && widths.aside >= 260 && widths.aside <= 340, `wide desktop stays restrained (stream ${widths.sheet}px, context ${widths.aside}px)`);
    await shot(page, "10-my-world-wide");
    await open(page, "/world", { theme: "light" });
    await page.$eval("[data-sb-hero]", (e) => e.scrollIntoView({ block: "start" }));
    await sleep(300);
    await shot(page, "11-profile");
    await page.click("[data-sb-open-composer]");
    await page.waitForSelector("[data-sb-composer]");
    await sleep(500);
    await shot(page, "12-composer-open");
    await page.keyboard.press("Escape");
    await sleep(300);
    await page.$eval("[data-sb-moment]", (e) => e.scrollIntoView({ block: "center" }));
    await sleep(400);
    await shot(page, "13-first-moment");
    await page.$eval("[data-sb-moment='m-meal']", (e) => e.scrollIntoView({ block: "center" }));
    await sleep(400);
    await shot(page, "14-photo-moment");
    await page.$eval("[data-sb-moment='m-sameage']", (e) => e.scrollIntoView({ block: "center" }));
    await sleep(300);
    await shot(page, "15-text-moment");
    const health = await page.$eval("[data-sb-moment='m-health']", (e) => ({ respond: /Respond/.test(e.textContent), only: /only you/.test(e.textContent) }));
    ok(!health.respond && health.only, "Health stays a private record: no Respond, marked only you");
    await page.$eval("[data-sb-moment='m-health']", (e) => e.scrollIntoView({ block: "center" }));
    await sleep(300);
    await shot(page, "16-health");
    for (let i = 0; i < 4 && !(await page.$("[data-sb-moment='m-problem']")) && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(400); }
    await page.$eval("[data-sb-moment='m-problem']", (e) => e.scrollIntoView({ block: "center" }));
    await sleep(300);
    await shot(page, "17-problem");
    await open(page, "/world", { theme: "light" });
    await page.evaluate(async () => {
      const i = document.querySelector("input[type=search]");
      i.focus();
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, "Boudha");
      i.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 450));
    });
    await shot(page, "18-search");
    await page.keyboard.press("Escape");
    await page.evaluate(() => document.querySelector("[data-sb-bell]")?.click());
    await sleep(500);
    await shot(page, "19-notifications");

    /* ---- 4. Life inside My World ---- */
    console.log("4. Life");
    await open(page, "/world", { theme: "dark", w: 360 });
    const lifeEntry = await page.$eval("[data-sb-life-entry]", (a) => ({ href: a.getAttribute("href"), y: Math.round(a.getBoundingClientRect().top + scrollY), text: a.textContent.replace(/\s+/g, " ").trim() }));
    ok(lifeEntry.href === "/life" && lifeEntry.y < 800, `the compact Life entry sits in the first screen (${lifeEntry.text} at ${lifeEntry.y}px)`);
    await shot(page, "20-life-entry-mobile");
    await open(page, "/world", { theme: "light" });
    const openLife = await page.$eval("[data-sb-open-life]", (a) => a.getAttribute("href"));
    ok(openLife === "/life", "the desktop Circle module opens Life");
    await page.$eval("[data-sb-circle]", (e) => e.scrollIntoView({ block: "center" }));
    await sleep(300);
    await shot(page, "21-life-module-desktop");
    await page.click("[data-sb-open-life]");
    await page.waitForSelector("[data-sb-circle-view]", { timeout: 20000 });
    await sleep(700);
    ok(pathOf(page) === "/life" && (await brand(page)).context === "Life", "My World → Life, same brand, LIFE context");
    ok((await page.$$eval("nav[aria-label='Temporal coordinate']", (n) => n.length)) === 1, "the Circle's temporal navigation stays local");
    ok((await page.$$eval("[data-sb-dial] g[role=option]", (n) => n.length)) === 10, "the Circle itself is unchanged (10 bands)");
    await open(page, "/life", { theme: "dark" });
    await shot(page, "24-life-dark");
    await open(page, "/life", { theme: "light" });
    await shot(page, "25-life-light");

    /* ---- 5. light persists across the whole product ---- */
    console.log("5. light chain");
    await open(page, "/world", { theme: "light" });
    await page.click("[data-sb-life-entry]");
    await page.waitForSelector("[data-sb-circle-view]", { timeout: 20000 });
    await sleep(500);
    ok((await themeOf(page)) === "light", "My World light → Life stays light");
    await shot(page, "26-light-chain-life");
    await page.click("[data-sb-brand]");
    await sleep(2200);
    ok((await themeOf(page)) === "light" && pathOf(page) === "/", "Life → Cosmos stays light (Solar Observatory)");
    await shot(page, "27-light-chain-cosmos");
    ok(!!(await page.$("[data-sb-enter-world]")), "the signed-in Cosmos offers Enter my world");
    await shot(page, "28-enter-my-world-chip");
    await page.evaluate(() => localStorage.removeItem("sb-theme"));

    /* ---- 6. identity continuation for a public Life request ---- */
    console.log("6. identity continuation");
    await open(page, "/", { theme: "dark" });
    await clearIdentity(page);
    await page.goto(`${HOST}/life?theme=dark`, { waitUntil: "networkidle2" });
    await sleep(1500);
    ok(pathOf(page) === "/", "a personal destination without an identity goes Home, where identity lives");
    ok((await page.evaluate(() => sessionStorage.getItem("sb-intent"))) === "life", "the request is remembered");
    await enterIdentity(page);
    const contLife = await page.$eval("[data-sb-enter-world]", (a) => ({ href: a.getAttribute("href"), text: a.textContent.trim() }));
    ok(contLife.href === "/life" && /Continue to Life/.test(contLife.text), `identity continues to what was asked for (${contLife.text})`);
    await page.click("[data-sb-enter-world]");
    await page.waitForSelector("[data-sb-circle-view]", { timeout: 20000 });
    ok(pathOf(page) === "/life", "…and lands in Life");
    await page.evaluate(() => sessionStorage.removeItem("sb-intent"));

    /* ---- 7. Devanagari ---- */
    console.log("7. Devanagari");
    for (const [name, theme] of [["22-devanagari-light", "light"], ["23-devanagari-dark", "dark"]]) {
      await open(page, "/world", { theme, w: 360 });
      for (let i = 0; i < 4 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(350); }
      const el = await page.$("[data-sb-moment='m-nepali-1']");
      await el.evaluate((e) => e.scrollIntoView({ block: "center" }));
      await sleep(600);
      ok(await page.evaluate(() => document.fonts.check("500 16px 'SB Devanagari'")), `${name}: the Devanagari face is loaded`);
      await el.screenshot({ path: `${EV}/${name}.png` });
    }

    /* ---- 8. accessibility ---- */
    console.log("8. accessibility");
    await open(page, "/world", { theme: "light" });
    let first = null;
    for (let i = 0; i < 3 && !/SYSTEMBOOM/.test(first ?? ""); i++) {
      await page.keyboard.press("Tab");
      first = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
    }
    ok(/SYSTEMBOOM/.test(first ?? "") && /Home/.test(first ?? ""), `the brand is the first named Tab stop and says it goes Home (${first})`);
    const focusRing = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 1; });
    ok(focusRing, "focus is visible on the brand");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await open(page, "/world", { theme: "light" });
    ok((await page.$eval("aside [data-sb-counter]", (e) => e.getAttribute("data-sb-reduced"))) === "true", "reduced motion is respected");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

    /* ---- 9. page health ---- */
    console.log("9. page health");
    ok(errors.length === 0, `zero page errors (${errors.length}) ${errors.slice(0, 2).join(" | ")}`);
    ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length}) ${consoleErrors.slice(0, 2).join(" | ")}`);
  } catch (e) {
    console.log("FINAL MY WORLD: CRASH", e);
    failures.push(`CRASH ${e.message}`);
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  for (const f of failures) console.log(` - ${f}`);
  await browser.close();
  console.log(failures.length ? "FINAL APP: FAIL" : "FINAL APP: PASS");
  process.exit(failures.length ? 1 : 0);
})();
