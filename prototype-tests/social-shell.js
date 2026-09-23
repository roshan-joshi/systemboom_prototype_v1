/* PHASE 4.3 — final Social + SYSTEMBOOM unification suite.
   Route integrity, one navigation grammar, theme continuity, privacy, and the
   final visual evidence set. Run with the dev server on 3210:
     node prototype-tests/social-shell.js */
const fs = require("fs");
const { launch, sleep } = require("./lib");

const HOST = "http://localhost:3210";
const SOCIAL = `${HOST}/style-lab/social`;
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/phase-04-final-social";
fs.mkdirSync(EV, { recursive: true });

const VW = { 360: 420, 390: 450, 768: 900, desktop: 1440 };
let passed = 0;
const failures = [];
const ok = (c, label) => {
  if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); }
};
const shot = (page, name, full = false) => page.screenshot({ path: `${EV}/${name}.png`, fullPage: full });

async function go(page, url, { theme = "light", w = "desktop", harness = "0", extra = {} } = {}) {
  await page.setViewport({ width: VW[w], height: 1100, deviceScaleFactor: 1.5, hasTouch: w === 360 || w === 390 });
  const u = new URL(url);
  u.searchParams.set("theme", theme);
  if (url.includes("style-lab")) {
    u.searchParams.set("harness", harness);
    u.searchParams.set("w", String(w));
  }
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
  await page.goto(u.toString(), { waitUntil: "networkidle2" });
  await sleep(650);
}
const text = (page) => page.evaluate(() => document.body.innerText);
const theme = (page) => page.evaluate(() => document.documentElement.dataset.theme);
const typeSearch = (page, value) =>
  page.evaluate(async (v) => {
    const i = document.querySelector("input[type=search]");
    i.focus();
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, v);
    i.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 450));
  }, value);
const visibleHrefs = (page, sel) =>
  page.$$eval(sel, (n) =>
    n.filter((a) => a.getBoundingClientRect().height > 0).map((a) => ({ label: a.textContent.replace(/\s+/g, " ").trim(), href: a.getAttribute("href"), disabled: a.getAttribute("aria-disabled") === "true", current: a.getAttribute("aria-current") })),
  );
/** The brand: the one persistent global control (final My World model). */
const brand = (page) =>
  page.$eval("[data-sb-brand]", (e) => ({
    at: e.getAttribute("data-sb-brand-at"),
    href: e.getAttribute("href"),
    context: e.querySelector("[data-sb-context]")?.textContent.trim() ?? null,
    label: e.getAttribute("aria-label"),
  }));
const hrefs = (page, sel) => page.$$eval(sel, (n) => n.map((a) => ({ label: a.textContent.replace(/\s+/g, " ").trim(), href: a.getAttribute("href"), disabled: a.getAttribute("aria-disabled") === "true", current: a.getAttribute("aria-current") })));

/** Enter through the real gate so /world has a session (public → authenticated). */
async function enterAsDemo(page) {
  await go(page, `${HOST}/`, { theme: "light" });
  await sleep(2200);
  await page.click("[data-sb-gate-opener]");
  await sleep(700);
  const clicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll("[role=dialog] button")].find((x) => /Enter as Giulia Bianchi/.test(x.textContent));
    if (!b) return false;
    b.click();
    return true;
  });
  await sleep(800);
  return clicked;
}

(async () => {
  const { browser, page, errors } = await launch();
  const consoleErrors = [];
  let probing404 = false; // the suite deliberately requests an unbuilt route once
  page.on("console", (m) => { if (m.type() === "error" && !probing404 && !/favicon|ERR_/.test(m.text())) consoleErrors.push(m.text()); });
  const requested = new Set();
  page.on("request", (r) => { if (r.resourceType() === "document") requested.add(new URL(r.url()).pathname); });

  try {
    /* ---- 1. real routes only ---- */
    console.log("1. route integrity");
    const ROUTES = [
      ["/", "Cosmos"],
      ["/world", "World"],
      ["/style-lab", "Style lab"],
      ["/style-lab/social", "Social"],
      ["/style-lab/circle", "Circle"],
    ];
    for (const [route, label] of ROUTES) {
      const res = await page.goto(`${HOST}${route}?theme=light`, { waitUntil: "domcontentloaded" });
      ok(res.status() === 200, `${label} route ${route} answers 200`);
    }
    probing404 = true;
    const missing = await page.goto(`${HOST}/earth`, { waitUntil: "domcontentloaded" });
    ok(missing.status() === 404, "an unbuilt route (/earth) is genuinely absent — nothing links to it");
    await sleep(300);
    probing404 = false;

    /* ---- 2. the entry seam: public Cosmos → authenticated World ---- */
    console.log("2. public → authenticated");
    ok(await enterAsDemo(page), "the identity gate offers the demo entry");
    ok(!!(await page.$("[data-sb-enter-world]")), "the signed-in gate leads to a real World");
    await shot(page, "29-cosmos-world-entry-context");
    const worldHref = await page.$eval("[data-sb-enter-world]", (a) => a.getAttribute("href"));
    ok(worldHref === "/world", `identity enters My World directly (${worldHref})`);
    await go(page, `${HOST}/world`, { theme: "light" });
    const landed = page.url();
    const worldText = await text(page);
    ok(/\/world/.test(landed), `MY WORLD is the personal Home (${landed.replace(HOST, "")})`);
    ok(/Giulia Bianchi/.test(worldText) && /\d+y \d\dm \d\dd/.test(worldText), "…where the person and their exact life position are stated");
    ok(!/remaining|left|countdown|%/.test(worldText), "no mortality or completion language");
    await go(page, `${HOST}/social`, { theme: "light" });
    ok(/\/world/.test(page.url()), `"Social" is capability vocabulary: /social continues to My World (${page.url().replace(HOST, "")})`);
    await shot(page, "22-world-social-context");
    await shot(page, "21-systemboom-global-navigation-desktop");

    /* ---- 3. one navigation grammar, no dead links ---- */
    console.log("3. navigation");
    const b1 = await brand(page);
    ok(b1.href === "/" && /Home/.test(b1.label ?? ""), `the SYSTEMBOOM mark goes Home to Cosmos (${b1.label})`);
    ok(!(await page.$("[data-sb-compass-panel], [data-sb-dest], [data-sb-world-scale]")), "there is no global destination menu and no switchboard");

    /* ---- 4. Social chrome: real links, live vocabulary, no Dashboard ---- */
    console.log("4. Social chrome");
    await go(page, SOCIAL, { theme: "light", w: "desktop" });
    const bSocial = await brand(page);
    ok(bSocial.at === "world" && bSocial.context === "My World", `the bar states the personal Home (${bSocial.context})`);
    ok(!(await page.$("nav[aria-label=Primary]")), "My World carries no navigation row of its own");
    ok(!(await page.evaluate(() => /\bHome\b|\bAbout\b|\bFriends\b/.test(document.body.innerText))), "the old nav vocabulary is gone");
    const anyHash = await page.$$eval("a[href='#']", (n) => n.length);
    ok(anyHash === 0, `no placeholder '#' links remain in Social (${anyHash})`);
    const socialText = await text(page);
    ok(!/Dashboard/.test(socialText), "no 'Dashboard' vocabulary anywhere");
    ok(!/Sponsored|Advertisement|Promoted/i.test(socialText), "no ads or promoted content in the life stream");
    ok(bSocial.href === "/", "Cosmos is one step outward: the mark from inside My World");
    const chat = await page.$eval("[data-sb-messages]", (b) => b.getAttribute("aria-label"));
    ok(/^Messages/.test(chat), `Messages is a real utility now (${chat})`);

    /* ---- 5. Circle entry from Social ---- */
    console.log("5. Life / Circle entry");
    const openLife = await page.$eval("[data-sb-open-life]", (a) => a.getAttribute("href"));
    ok(openLife === "/life", `the compact Circle module opens the Life destination (${openLife})`);
    await page.$eval("[data-sb-circle]", (e) => e.scrollIntoView({ block: "center" }));
    await sleep(300);
    await shot(page, "19-life-circle-entry");
    await page.click("[data-sb-open-life]");
    await page.waitForSelector("[data-sb-circle-view]", { timeout: 15000 });
    await sleep(600);
    ok(!!(await page.$("[data-sb-shell='life']")) && (await brand(page)).context === "Life", "the Circle page wears the same brand, at Life");
    ok((await theme(page)) === "light", "the theme survives the move from Social into Life");

    /* ---- 6. theme continuity across surfaces ---- */
    console.log("6. theme continuity");
    await go(page, SOCIAL, { theme: "dark", w: "desktop" });
    const flash = await page.evaluate(() => new Promise((res) => {
      const seen = [document.documentElement.dataset.theme];
      const mo = new MutationObserver(() => seen.push(document.documentElement.dataset.theme));
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      requestAnimationFrame(() => requestAnimationFrame(() => { mo.disconnect(); res(seen); }));
    }));
    ok(flash.every((t) => t === "dark"), `no theme flash on Social (${flash.join(",")})`);
    await page.evaluate(() => document.querySelector("[data-sb-social-frame] button[aria-label^='Switch to']")?.click());
    await sleep(300);
    ok((await theme(page)) === "light", "the theme control switches the whole document");
    await shot(page, "28-theme-transition");
    await page.goto(`${HOST}/world`, { waitUntil: "networkidle2" });
    await sleep(500);
    ok((await theme(page)) === "light", "the choice persists into World (one theme store)");
    await page.goto(`${HOST}/style-lab/circle?harness=0`, { waitUntil: "networkidle2" });
    await sleep(500);
    ok((await theme(page)) === "light", "and into Life");
    await page.evaluate(() => localStorage.removeItem("sb-theme"));

    /* ---- 7. Cosmos 3D does not follow Social around ---- */
    console.log("7. performance separation");
    await go(page, SOCIAL, { theme: "light", w: "desktop" });
    const canvases = await page.$$eval("canvas", (n) => n.length);
    ok(canvases === 0, `no WebGL canvas mounted behind Social (${canvases})`);
    const heavy = await page.evaluate(() => [...document.querySelectorAll("script[src]")].map((s) => s.src).filter((s) => /three|fiber|drei/i.test(s)).length);
    ok(heavy === 0, `no three.js bundle requested by Social (${heavy})`);
    const worldCanvas = await (async () => { await page.goto(`${HOST}/world?theme=light`, { waitUntil: "networkidle2" }); await sleep(400); return page.$$eval("canvas", (n) => n.length); })();
    ok(worldCanvas === 0, `no WebGL canvas on World (${worldCanvas})`);

    /* ---- 8. the Moment still dominates, privacy intact ---- */
    console.log("8. Moments and privacy");
    await go(page, SOCIAL, { theme: "light", w: "desktop" });
    const first = await page.$eval("[data-sb-moment]", (e) => e.getBoundingClientRect().height);
    const bar = await page.$eval("[data-sb-brand]", (e) => e.closest("div[class*=sticky]")?.getBoundingClientRect().height ?? e.getBoundingClientRect().height);
    ok(first > bar, `a Moment outweighs the chrome (${Math.round(first)}px vs ${Math.round(bar)}px)`);
    const respond = await page.evaluate(() => [...document.querySelectorAll("[data-sb-moment] button")].some((b) => /Respond/.test(b.textContent) && b.getBoundingClientRect().width > 0));
    ok(respond, "the Respond word is visible, not an icon");
    const ownAge = await page.$eval("[data-sb-moment='m-rain'] [data-sb-readout]", (e) => e.textContent);
    ok(/34y 10m \d\dd/.test(ownAge), "the viewer's own Moment shows exact life position");
    const otherAge = await page.$eval("[data-sb-moment='m-meal'] [data-sb-readout]", (e) => e.textContent);
    ok(/30–45/.test(otherAge) && !/\d+y \d\dm/.test(otherAge), "another person's Moment shows the band only");
    await go(page, SOCIAL, { theme: "light", w: "desktop", extra: { viewer: "visitor" } });
    const visitorHtml = await page.evaluate(() => document.documentElement.outerHTML);
    ok(!["04 NOV 1991", "06:42", "12,7"].some((f) => visitorHtml.includes(f)), "a visitor receives no birth-derived data");
    await typeSearch(page, "Giulia");
    const visitorSearch = await page.evaluate(() => document.querySelector("[role=region][aria-label='Search results']")?.innerText ?? "");
    ok(/30–45/.test(visitorSearch) && !/\d+y \d\dm/.test(visitorSearch), `search keeps another person band-only (${visitorSearch.replace(/\n/g, " ").slice(0, 60)})`);

    /* ---- 9. search and notifications carry SYSTEMBOOM context ---- */
    console.log("9. search + notifications");
    await go(page, SOCIAL, { theme: "light", w: "desktop" });
    await typeSearch(page, "Boudha");
    const results = await page.evaluate(() => {
      const panel = document.querySelector("[role=region][aria-label='Search results']");
      return {
        groups: [...panel.querySelectorAll("p.uppercase")].map((p) => p.textContent.trim()),
        photoDates: [...panel.querySelectorAll("[data-sb-search-photo]")].map((b) => b.textContent.trim()),
        places: [...panel.querySelectorAll("[data-sb-search-place]")].map((b) => b.textContent.replace(/\s+/g, " ").trim()),
        rings: panel.querySelectorAll("[data-sb-ring]").length,
      };
    });
    ok(results.groups.includes("Photos") && results.groups.includes("Places"), `results stay grouped (${results.groups.join(", ")})`);
    ok(results.photoDates.every((d) => /^\d{2} [A-Z]{3} \d{4}$/.test(d)), `every photo result states its date (${results.photoDates.join(" | ")})`);
    ok(results.places.every((p) => /Moments? recorded|\d+ Moments?/.test(p)), `places state how much life is recorded there (${results.places.join(" | ")})`);
    await shot(page, "15-search-desktop");
    await typeSearch(page, "Sofia");
    const people = await page.evaluate(() => {
      const panel = document.querySelector("[role=region][aria-label='Search results']");
      return { life: [...panel.querySelectorAll("[data-sb-search-life]")].map((s) => s.textContent.trim()), rings: panel.querySelectorAll("[data-sb-ring]").length };
    });
    ok(people.rings > 0 && people.life.some((l) => /^\d+–\d+/.test(l)), `people carry a life ring and their band (${people.life.join(" | ")})`);
    await go(page, SOCIAL, { theme: "light", w: 360 });
    await page.evaluate(() => document.querySelector("button[aria-label=Search]")?.click());
    await sleep(400);
    await shot(page, "16-search-360");
    await go(page, SOCIAL, { theme: "light", w: "desktop", extra: { bell: "1" } });
    const notif = await page.$$eval("[data-sb-notifications] [data-sb-notification-coord]", (n) => n.map((x) => x.textContent.replace(/\s+/g, " ").trim()));
    ok(notif.length >= 3 && notif.every((t) => /^\d{2} [A-Z]{3} \d{4}/.test(t)), `notifications name which Moment by its own date (${notif.slice(0, 2).join(" | ")})`);
    const days = await page.$$eval("[data-sb-notifications] p.uppercase", (n) => n.map((x) => x.textContent.trim()));
    ok(/^notifications$/i.test(days[0] ?? "") && days.slice(1).some((d) => /yesterday|today|\d{2} [A-Z]{3}/i.test(d)), `notifications are grouped by day (${days.join(", ")})`);
    await shot(page, "17-notifications-desktop");
    await go(page, SOCIAL, { theme: "dark", w: 360, extra: { bell: "1" } });
    await shot(page, "18-notifications-360");

    /* ---- 10. the composition, both modes, every width ---- */
    console.log("10. composition evidence");
    const SHOTS = [
      ["01-social-desktop-light", { theme: "light", w: "desktop" }, true],
      ["02-social-desktop-dark", { theme: "dark", w: "desktop" }, true],
      ["03-social-360-light", { theme: "light", w: 360 }, true],
      ["04-social-360-dark", { theme: "dark", w: 360 }, true],
      ["05-social-390-light", { theme: "light", w: 390 }, true],
      ["06-social-768-light", { theme: "light", w: 768 }, true],
    ];
    for (const [name, opts, full] of SHOTS) {
      await go(page, SOCIAL, opts);
      await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); } window.scrollTo(0, 0); });
      await sleep(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
      ok(overflow, `${name}: no horizontal page scroll`);
      await shot(page, name, full);
    }
    await go(page, SOCIAL, { theme: "light", w: "desktop" });
    await page.$eval("[data-sb-hero]", (e) => e.scrollIntoView({ block: "start" }));
    await sleep(300);
    await shot(page, "07-profile-desktop-light");
    await go(page, SOCIAL, { theme: "dark", w: 360 });
    await shot(page, "08-profile-360-dark");
    for (const [name, w] of [["09-composer-open-desktop", "desktop"], ["10-composer-open-360", 360]]) {
      await go(page, SOCIAL, { theme: w === 360 ? "dark" : "light", w });
      await page.click("[data-sb-open-composer]");
      await page.waitForSelector("[data-sb-composer]");
      await sleep(500);
      ok(await page.evaluate(() => !!document.querySelector("[data-sb-composer] [data-sb-date-display]") && [...document.querySelectorAll("[data-sb-kind-row] span")].some((s) => s.textContent === "meal")), `${name}: the composer keeps its date grammar and kind words`);
      await shot(page, name);
      await page.keyboard.press("Escape");
      await sleep(200);
    }
    await go(page, SOCIAL, { theme: "light", w: "desktop" });
    await page.$eval("[data-sb-moment='m-meal']", (e) => e.scrollIntoView({ block: "center" }));
    await sleep(400);
    await shot(page, "11-media-moment-light");
    await go(page, SOCIAL, { theme: "dark", w: "desktop" });
    await page.$eval("[data-sb-moment='m-meal']", (e) => e.scrollIntoView({ block: "center" }));
    await sleep(400);
    await shot(page, "12-media-moment-dark");
    for (const [name, id] of [["13-health-private", "m-health"], ["14-problem-private", "m-problem"]]) {
      await go(page, SOCIAL, { theme: "light", w: "desktop" });
      for (let i = 0; i < 4 && !(await page.$(`[data-sb-moment='${id}']`)) && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(400); }
      await page.$eval(`[data-sb-moment='${id}']`, (e) => e.scrollIntoView({ block: "center" }));
      await sleep(350);
      const quiet = await page.$eval(`[data-sb-moment='${id}']`, (e) => ({ respond: /Respond/.test(e.textContent), only: /only you/.test(e.textContent), notes: /response/i.test(e.textContent) }));
      ok(!quiet.respond && quiet.only && quiet.notes, `${id}: a record, not a performance — no Respond, marked only you, its responses intact`);
      await shot(page, name);
    }
    await go(page, SOCIAL, { theme: "light", w: "desktop" });
    for (let i = 0; i < 4 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(400); }
    const dev = await page.$eval("[data-sb-moment='m-nepali-1']", (e) => e.textContent);
    ok(/स्वयम्भू/.test(dev), "Devanagari renders in the stream");
    for (const [name, t] of [["23-devanagari-social-360-light", "light"], ["24-devanagari-social-360-dark", "dark"]]) {
      await go(page, SOCIAL, { theme: t, w: 360 });
      for (let i = 0; i < 4 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(350); }
      const el = await page.$("[data-sb-moment='m-nepali-1']");
      await el.evaluate((e) => e.scrollIntoView({ block: "center" }));
      await sleep(600);
      const fontOk = await page.evaluate(() => document.fonts.check("500 16px 'SB Devanagari'"));
      ok(fontOk, `${name}: the Devanagari face is loaded`);
      await el.screenshot({ path: `${EV}/${name}.png` });
    }
    await go(page, SOCIAL, { theme: "light", w: "desktop", extra: { notifications: "empty", bell: "1" } });
    const empty = await page.$eval("[data-sb-notifications]", (e) => e.textContent);
    ok(/Nothing new\. When someone responds or writes, it lands here\./.test(empty) && !/:\(/.test(empty), "empty states stay calm and factual");
    await shot(page, "25-empty-state");
    await go(page, SOCIAL, { theme: "light", w: 360 });
    await shot(page, "20-mobile-navigation");
    const brands = await page.$$eval("[data-sb-brand]", (n) => n.length);
    const navRows = await page.$$eval("nav", (n) => n.filter((x) => x.getBoundingClientRect().height > 0 && !/search|notifications|temporal/i.test(x.getAttribute("aria-label") || "")).length);
    ok(brands === 1 && navRows === 0, `one brand and no navigation rows at 360 (${brands} brand, ${navRows} rows)`);
    ok(await page.evaluate(() => !!document.querySelector("[data-sb-open-composer]")?.getBoundingClientRect().width), "the primary Social action stays reachable on a phone");

    /* ---- 11. keyboard, focus, reduced motion ---- */
    console.log("11. accessibility");
    await go(page, SOCIAL, { theme: "light", w: "desktop" });
    await page.keyboard.press("Tab");
    const firstStop = await page.evaluate(() => document.activeElement?.getAttribute("data-sb-world-control") !== null || document.activeElement?.getAttribute("aria-label"));
    ok(!!firstStop, `the first Tab stop is a named control (${firstStop})`);
    const unnamed = await page.$$eval("button:not([aria-label]):not([title])", (n) => n.filter((b) => !b.textContent.trim()).length);
    ok(unnamed === 0, `every icon-only control has a name (${unnamed} unnamed)`);
    await page.evaluate(() => document.querySelector("[data-sb-brand]").focus());
    await sleep(150);
    const ring = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 1; });
    ok(ring, "focus is visible on the brand");
    await shot(page, "26-keyboard-focus");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await go(page, SOCIAL, { theme: "light", w: "desktop" });
    const reducedFlag = await page.$eval("aside [data-sb-counter]", (e) => e.getAttribute("data-sb-reduced"));
    const scrollAnim = await page.evaluate(() => [...document.querySelectorAll("[data-sb-social-frame] *")].some((e) => { const a = getComputedStyle(e).animationName; return a && a !== "none" && /float|pulse|drift|shimmer/i.test(a); }));
    ok(reducedFlag === "true" && !scrollAnim, `reduced motion: the counter reports the reduced path and nothing drifts (reduced=${reducedFlag})`);
    await shot(page, "27-reduced-motion");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

    /* ---- 12. page health ---- */
    console.log("12. page health");
    ok(errors.length === 0, `zero page errors (${errors.length}) ${errors.slice(0, 2).join(" | ")}`);
    ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length}) ${consoleErrors.slice(0, 2).join(" | ")}`);
    const REAL = ["/", "/world", "/social", "/life", "/style-lab", "/style-lab/social", "/style-lab/circle", "/earth"];
    const fake = [...requested].filter((p) => !REAL.includes(p));
    ok(fake.length === 0, `no navigation to a route outside the real set (${fake.join(", ") || "none"})`);
  } catch (e) {
    console.log("SHELL: CRASH", e);
    failures.push(`CRASH ${e.message}`);
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  for (const f of failures) console.log(` - ${f}`);
  await browser.close();
  console.log(failures.length ? "SOCIAL SHELL: FAIL" : "SOCIAL SHELL: PASS");
  process.exit(failures.length ? 1 : 0);
})();
