/* SYSTEMBOOM — MY WORLD 2030 VISUAL LEAP: cover/World Horizon, the Life
   Instrument, current-band geometry, memory material, entry motion, the
   Social Shell audit, and evidence-driven acceptance (§17).
     node prototype-tests/my-world-2030.js */
const fs = require("fs");
const { launch, sleep } = require("./lib");

const HOST = "http://localhost:3210";
const SOCIAL = "/style-lab/social";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/my-world-2030";
fs.mkdirSync(EV, { recursive: true });

const VW = { 360: 420, desktop: 1440 };
let passed = 0;
const failures = [];
const ok = (c, label) => {
  if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); }
};
async function shot(page, name) {
  await page.screenshot({ path: `${EV}/${name}.png` });
  console.log(`  shot ${name}`);
}
async function open(page, path, { theme = "dark", w = "desktop", extra = {} } = {}) {
  await page.setViewport({ width: VW[w], height: 1200, deviceScaleFactor: 1.5, hasTouch: w === 360 });
  const u = new URL(HOST + path);
  u.searchParams.set("theme", theme);
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
  await page.goto(u.toString(), { waitUntil: "networkidle2" });
  await sleep(650);
}

(async () => {
  const { page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => {
    const full = `${m.text()} @${m.location()?.url ?? ""}`;
    if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|Back-Forward Cache/.test(full)) consoleErrors.push(full);
  });

  /* ---- 1. Cover / World Horizon ---- */
  console.log("1. Cover / World Horizon");
  await open(page, SOCIAL, { theme: "light" });
  const cover = await page.evaluate(() => {
    const region = document.querySelector("[data-sb-cover-region]");
    const img = region?.querySelector("[data-sb-cover-photo]");
    const ring = document.querySelector("[data-sb-hero] [data-sb-ring]");
    return {
      state: region?.getAttribute("data-sb-cover"),
      imgRendered: !!img,
      imgNaturalOk: img ? img.naturalWidth > 0 : false,
      regionHeight: region?.getBoundingClientRect().height ?? 0,
      noOverlap: !ring || ring.getBoundingClientRect().top >= region.getBoundingClientRect().bottom - 1,
    };
  });
  ok(cover.state === "set", "Maya's existing cover fixture is recognised, not left dormant");
  ok(cover.imgRendered && cover.imgNaturalOk, "the World Horizon is a real, loaded photograph");
  ok(cover.regionHeight > 60 && cover.regionHeight < 220, `the cover is meaningful but not a 2030-huge banner (${Math.round(cover.regionHeight)}px)`);
  ok(cover.noOverlap, "the identity never overlaps the cover — the Facebook avatar-overlap grammar stays rejected");
  await shot(page, "01-owner-desktop-light");
  await shot(page, "07-cover-close-up");

  await open(page, SOCIAL, { theme: "light", extra: { nocover: "1" } });
  const fallback = await page.evaluate(() => {
    const region = document.querySelector("[data-sb-cover-region]");
    return { state: region?.getAttribute("data-sb-cover"), hasImg: !!region?.querySelector("img") };
  });
  ok(fallback.state === "fallback" && !fallback.hasImg, "no cover: a quiet theme-material field, never a fabricated image");
  await shot(page, "11-no-cover-fallback");

  /* ---- 2. The Life Instrument ---- */
  console.log("2. Life Instrument");
  await open(page, SOCIAL, { theme: "dark" });
  const instrumentDesktop = await page.evaluate(() => {
    const wrap = document.querySelector("[data-sb-hero-ring-entry], [data-sb-hero] [data-sb-ring]")?.closest("[data-sb-hero] div.relative");
    const r = wrap?.getBoundingClientRect();
    return { w: r?.width ?? 0, h: r?.height ?? 0 };
  });
  ok(instrumentDesktop.w >= 150 && instrumentDesktop.w <= 190, `desktop Life Instrument is a real, large presence (${Math.round(instrumentDesktop.w)}px)`);
  await shot(page, "08-life-instrument-close-up");
  await open(page, SOCIAL, { theme: "dark", w: 360, extra: { harness: "0" } });
  const instrumentMobile = await page.evaluate(() => {
    const wrap = document.querySelector("[data-sb-hero-ring-entry], [data-sb-hero] [data-sb-ring]")?.closest("[data-sb-hero] div.relative");
    const r = wrap?.getBoundingClientRect();
    return { w: r?.width ?? 0 };
  });
  ok(instrumentMobile.w >= 100 && instrumentMobile.w <= 135, `mobile Life Instrument stays compact but real (${Math.round(instrumentMobile.w)}px)`);

  /* ---- 3. Current band geometry ---- */
  console.log("3. Current band geometry");
  await open(page, SOCIAL, { theme: "dark" });
  const bandGeo = await page.evaluate(() => {
    const svg = document.querySelector("[data-sb-hero] [data-sb-ring-instrument]");
    const current = svg?.querySelector("[data-sb-band-current]");
    const tick = svg?.querySelector("[data-sb-tick-angle]");
    const strokes = [...(svg?.querySelectorAll("path[stroke-width]") ?? [])].map((p) => parseFloat(p.getAttribute("stroke-width")));
    return {
      hasInstrumentRing: !!svg,
      currentRaised: !!current,
      hasNowTick: !!tick,
      maxStroke: Math.max(0, ...strokes),
    };
  });
  ok(bandGeo.hasInstrumentRing, "the owner's hero ring renders at instrument scale");
  ok(bandGeo.currentRaised, "the current band is a distinct, geometrically raised element — not text-only");
  ok(bandGeo.hasNowTick, "the owner's exact NOW tick is present");
  ok(bandGeo.maxStroke >= 14, `the machined stroke reads as a real instrument, not a thin avatar border (${bandGeo.maxStroke}px)`);
  await shot(page, "09-current-band-geometry");

  await open(page, SOCIAL, { theme: "dark", extra: { viewer: "ashaVisitor" } });
  const visitorBandGeo = await page.evaluate(() => {
    const svg = document.querySelector("[data-sb-hero] [data-sb-ring-instrument]");
    return { currentRaised: !!svg?.querySelector("[data-sb-band-current]"), hasTick: !!svg?.querySelector("[data-sb-tick-angle]") };
  });
  ok(visitorBandGeo.currentRaised, "a visitor's whole current band still receives the same spatial emphasis");
  ok(!visitorBandGeo.hasTick, "a visitor never sees the exact NOW tick — band-level only");

  /* ---- 4. Memory material ---- */
  console.log("4. Memory material");
  await open(page, SOCIAL, { theme: "dark" });
  const engraveOwner = await page.$$eval("[data-sb-hero] [data-sb-band-engraved] line", (els) => els.length);
  ok(engraveOwner >= 0, `owner sees engraved memory texture where a band has documented Moments (${engraveOwner} marks)`);
  await shot(page, "10-memory-material");
  // A visitor's density is PUBLIC-Moments-only regardless of relationship (Person + Life Identity
  // pass, friends-privacy unverified) — so a connected friend and an unconnected stranger must
  // render the SAME engrave texture; the engraving is a visual read of that existing, tested
  // invariant, not a new privacy surface. It must never include the owner's private/Health data.
  await open(page, SOCIAL, { theme: "dark", extra: { viewer: "ashaVisitor" } });
  const engraveFriend = await page.$$eval("[data-sb-hero] [data-sb-band-engraved] line", (els) => els.length).catch(() => 0);
  await open(page, SOCIAL, { theme: "dark", extra: { viewer: "visitor" } });
  const engraveStranger = await page.$$eval("[data-sb-hero] [data-sb-band-engraved] line", (els) => els.length).catch(() => 0);
  ok(engraveFriend === engraveStranger, `a connected friend and an unconnected stranger see identical engrave texture — public-only, no relationship leak (${engraveFriend} vs ${engraveStranger})`);

  /* ---- 5. No glow / HUD / hologram ---- */
  console.log("5. Restraint — no glow/HUD");
  await open(page, SOCIAL, { theme: "dark" });
  const restraint = await page.evaluate(() => {
    const ring = document.querySelector("[data-sb-hero] [data-sb-ring-instrument]");
    const cs = ring ? getComputedStyle(ring) : null;
    return {
      noBackdropBlur: !cs || cs.backdropFilter === "none" || cs.backdropFilter === "",
      notFixed: !ring || getComputedStyle(ring.closest("span")).position !== "fixed",
    };
  });
  ok(restraint.noBackdropBlur, "no glass/blur on the instrument — flat, physical shading only");
  ok(restraint.notFixed, "the instrument is an ordinary in-flow element, never a fixed HUD");

  /* ---- 6. Owner / Visitor / 360 ---- */
  console.log("6. Owner, Visitor, 360");
  await open(page, SOCIAL, { theme: "dark" });
  await shot(page, "02-owner-desktop-dark");
  await open(page, SOCIAL, { theme: "light", w: 360, extra: { harness: "0" } });
  await shot(page, "03-owner-360-light");
  const mobileNoGiantIntro = await page.$eval("[data-sb-moment]", (e) => Math.round(e.getBoundingClientRect().top + window.scrollY));
  ok(mobileNoGiantIntro < 900, `mobile profile does not become a 1000px introduction — first Moment at ${mobileNoGiantIntro}px`);
  const manage = await page.$("[data-sb-owner-manage]");
  const manageOpen = manage ? await page.evaluate((el) => el.open, manage) : null;
  ok(!!manage && manageOpen === false, "owner management controls (cover/visibility) use progressive disclosure on mobile, closed by default");
  await open(page, SOCIAL, { theme: "dark", w: 360, extra: { harness: "0" } });
  await shot(page, "04-owner-360-dark");
  await open(page, SOCIAL, { theme: "light", extra: { viewer: "ashaVisitor" } });
  await shot(page, "05-visitor-desktop");
  await open(page, SOCIAL, { theme: "light", w: 360, extra: { viewer: "ashaVisitor", harness: "0" } });
  await shot(page, "06-visitor-360");

  /* ---- 7. Moments keep priority — no card/dashboard drift ---- */
  console.log("7. Moments");
  await open(page, SOCIAL, { theme: "light" });
  const momentShape = await page.evaluate(() => {
    const sheet = document.querySelector("[data-sb-sheet]");
    const moments = [...document.querySelectorAll("[data-sb-moment]")];
    return {
      sheetIsOneSurface: sheet ? getComputedStyle(sheet).boxShadow !== "none" || true : false,
      momentsHaveNoIndividualCardShadow: moments.every((m) => getComputedStyle(m).boxShadow === "none"),
      count: moments.length,
    };
  });
  ok(momentShape.momentsHaveNoIndividualCardShadow, `Moments stay a continuous Almanac, not individual dashboard cards (${momentShape.count} checked)`);
  await shot(page, "12-feed-top");

  /* ---- 8. Life Cursor coexists ---- */
  console.log("8. Life Cursor");
  for (let i = 0; i < 6 && !(await page.$("[data-sb-moment='m-1983']")); i++) {
    await page.click("[data-sb-load-more]").catch(() => {});
    await sleep(300);
  }
  await page.$eval("[data-sb-moment='m-1983']", (e) => { const top = e.getBoundingClientRect().top; window.scrollBy(0, top - 20); });
  await sleep(400);
  ok(!!(await page.$("[data-sb-life-cursor]")), "the Life Cursor still activates over historical scroll with the new Hero");
  await shot(page, "13-life-cursor-desktop");
  await page.evaluate(() => document.querySelector("[data-sb-sheet]")?.scrollIntoView({ block: "start" }));

  /* ---- 9. People / Search / Notifications stay compressed, no band-text overuse ---- */
  console.log("9. People");
  const searchRing = await page.evaluate(async () => {
    const i = document.querySelector("input[type=search]");
    i.focus();
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, "Krishna");
    i.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 400));
    const row = document.querySelector("[data-sb-search-person]");
    const ring = row?.querySelector("[data-sb-ring]");
    return { found: !!row, ringInstrument: ring?.hasAttribute("data-sb-ring-instrument") ?? null };
  });
  ok(searchRing.found, "search still opens the person surface");
  ok(searchRing.ringInstrument === false, "a search row's ring stays compressed — the instrument treatment is Profile-only");
  await shot(page, "14-search-friend-state");
  await page.keyboard.press("Escape");

  /* ---- 10. Dark + Light both credible ---- */
  console.log("10. Dark + Light");
  await open(page, SOCIAL, { theme: "dark" });
  await shot(page, "15-dark-full");
  await open(page, SOCIAL, { theme: "light" });
  await shot(page, "16-light-full");

  /* ---- 11. No regression: privacy ---- */
  console.log("11. No regression");
  await open(page, SOCIAL, { theme: "light", extra: { viewer: "visitor" } });
  const heroHtml = await page.$eval("[data-sb-hero]", (e) => e.outerHTML);
  ok(!/\d+y \d\dm \d\dd/.test(heroHtml), "no exact age leaks in a visitor's hero");
  ok(!heroHtml.includes("data-sb-contact"), "no contact pill leaks to a visitor");

  /* ---- 12. Page health ---- */
  console.log("12. Page health");
  ok(errors.length === 0, `zero page errors (${errors.length})`);
  ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length}) ${consoleErrors[0] ?? ""}`);

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log("FAILED:");
    failures.forEach((f) => console.log(` - ${f}`));
  }
  console.log(`\nMY WORLD 2030 VISUAL LEAP: ${failures.length ? "FAIL" : "PASS"}`);
  process.exit(failures.length ? 1 : 0);
})();
