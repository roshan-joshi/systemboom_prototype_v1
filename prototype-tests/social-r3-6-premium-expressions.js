/* SYSTEMBOOM — R3.6: PREMIUM LIVING EXPRESSIONS.
   The polish round on the Emotion Core system: a premium tray, a real expression library
   with staggered entry, an unmistakable selected state in both themes, light-mode material,
   the anticipation → ignition → response → pulse → settle sequence, and no external badges
   on the tiles — the vessel carries the meaning. Structural checks; the beauty call is the
   owner's, on the evidence boards.
     node prototype-tests/social-r3-6-premium-expressions.js */
const { launch, sleep } = require("./lib");
const HOST = "http://localhost:3210";
const S = "/style-lab/social";
let passed = 0;
const failures = [];
const ok = (c, label) => { if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); } };

const RAIN = "[data-sb-moment='m-rain']";

async function open(page, w, h, { theme = "dark" } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: w < 900 });
  await page.goto(`${HOST}${S}?theme=${theme}&harness=0&viewer=maya`, { waitUntil: "networkidle2" });
  await sleep(450);
}
const toRain = async (page) => { await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain']")?.scrollIntoView({ block: "center" })); await sleep(240); };
const centre = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
const openDeck = async (page) => { await toRain(page); if (await page.$("[data-sb-expression-deck]")) return; const b = await centre(page, `${RAIN} [data-sb-express]`); await page.mouse.click(b.x, b.y); await sleep(380); };

(async () => {
  const { browser, page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { const f = `${m.text()}`; if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|Back-Forward|404/.test(f)) consoleErrors.push(f); });

  /* ---- 1. The tray is an expressive tool, not a settings sheet ---- */
  console.log("1. Quick tray");
  await open(page, 1440, 1000);
  await openDeck(page);
  const tray = await page.evaluate(() => {
    const d = document.querySelector("[data-sb-expression-deck]");
    const seats = [...d.querySelectorAll("[data-sb-expression-option]")];
    const resting = seats.find((x) => x !== document.activeElement && !x.hasAttribute("data-sb-previewing"));
    const cap = d.querySelector("[data-sb-deck-caption]");
    return {
      // Owner-superseded (R3.8 §1): the tray is six CORE objects under ONE vessel
      art: Math.round(resting.querySelector("[data-sb-core]").getBoundingClientRect().width),
      marks: d.querySelectorAll("[data-sb-mark]").length,
      capWeight: Number(getComputedStyle(cap).fontWeight),
      material: getComputedStyle(d).backgroundImage.includes("gradient"),
      hoverTransition: getComputedStyle(resting.querySelector(".sb-core-obj img")).transitionDuration !== "0s",
    };
  });
  ok(tray.art === 44, `the desktop core is a real emotional object (${tray.art}px at rest)`);
  ok(tray.marks === 0, "no external badges anywhere in the tray — the vessel carries the emotion");
  ok(tray.capWeight >= 600 && tray.material, "the semantic caption leads with real weight, on real material");
  ok(tray.hoverTransition, "attention gets a response: the vessel brightens on hover — anticipation, never a performance");

  /* ---- 2. Selected states are unmistakable, in both themes ---- */
  console.log("2. Selected state");
  for (const theme of ["dark", "light"]) {
    await open(page, 1440, 1000, { theme });
    await openDeck(page);
    await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='care']")));
    await sleep(700);
    const ctrl = await page.$eval(`${RAIN} [data-sb-express]`, (e) => ({
      ring: getComputedStyle(e).boxShadow !== "none",
      seat: e.className.includes("sb-seat-own"),
      rim: !!e.querySelector("[data-sb-own-mark]"),
      lens: /-core\.webp$|neutral-chamber-lens-sm\.webp$/.test(e.querySelector("img")?.getAttribute("src") ?? ""),
    }));
    ok(ctrl.ring && ctrl.seat && ctrl.rim && ctrl.lens, `${theme}: the committed control wears the expression's ring + owned seat + Boom rim + its core lens`);
    await openDeck(page);
    const owned = await page.$eval("[data-sb-expression-option][aria-checked=true]", (e) => ({
      insetRing: [...e.children].some((c) => { const b = getComputedStyle(c).boxShadow; return /inset/.test(b) && /0px 0px 0px 2px/.test(b); }),
      notch: !!e.querySelector("[data-sb-own-mark]"),
    }));
    ok(owned.insetRing && owned.notch, `${theme}: the owned seat carries the inset expression ring + Boom notch — never colour alone`);
    await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-remove]")));
    await sleep(300);
  }

  /* ---- 3. Light mode has its own material ---- */
  console.log("3. Light material");
  const bg = {};
  for (const theme of ["dark", "light"]) {
    await open(page, 1440, 1000, { theme });
    await openDeck(page);
    bg[theme] = await page.$eval("[data-sb-expression-deck]", (e) => getComputedStyle(e).backgroundImage);
  }
  ok(bg.light !== bg.dark && bg.light.includes("gradient"), "light mode is a designed warm-paper surface, not the dark theme washed out");

  /* ---- 4. The library: real tiles, attached names, staggered arrival ---- */
  console.log("4. Expression library");
  await open(page, 1440, 1000);
  await openDeck(page);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-more]")));
  await sleep(120);
  const lib = await page.evaluate(() => {
    const p = document.querySelector("[data-sb-expression-library]");
    const tiles = [...p.querySelectorAll("[data-sb-expression-option]")];
    const cs = tiles.map((c) => getComputedStyle(c));
    return {
      entry: cs.every((c) => /sb-tile-in/.test(c.animationName) && c.animationIterationCount === "1"),
      staggered: new Set(cs.map((c) => c.animationDelay)).size >= 6,
      labeled: tiles.every((c) => { const l = [...c.querySelectorAll(":scope > span")].find((x) => (x.textContent ?? "").trim().length > 0); return !!l && Number(getComputedStyle(l).fontWeight) >= 500; }),
      art: Math.round(tiles.find((x) => x !== document.activeElement).querySelector("[data-sb-core]").getBoundingClientRect().width),
      marks: p.querySelectorAll("[data-sb-mark]").length,
    };
  });
  ok(lib.entry && lib.staggered, "tiles arrive with one short staggered rise — then the library is still");
  ok(lib.labeled, "every name is attached directly to its tile");
  ok(lib.art >= 36, `the Atlas core is the main object of each tile (${lib.art}px)`);
  ok(lib.marks === 0, "no external badges in the library either");
  await sleep(700);
  const after = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  ok(after === 0, `the arrival is one-shot — nothing runs afterwards (${after})`);

  /* ---- 5. The full selection sequence, then stillness ---- */
  console.log("5. Motion sequence");
  await open(page, 1440, 1000);
  await openDeck(page);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='celebrate']")));
  // Owner-superseded (R3.8 §9): the one commit performs on the VESSEL (core → chamber → gesture ·
  // ignition · response · Boom Pulse), then the chamber lands on the lens. Same four names.
  await sleep(200);
  const seq = await page.$eval("[data-sb-horizon-stage]", (e) => {
    const names = [];
    e.querySelectorAll("*").forEach((n) => { const cs = getComputedStyle(n); if (cs.animationName !== "none") names.push(cs.animationName); });
    return names.join(" ");
  });
  ok(/sb-g-celebrate/.test(seq) && /sb-core-in/.test(seq) && /sb-boom-pulse/.test(seq) && /sb-mass/.test(seq), "anticipation-bearing gesture + core ignition + physical response + Boom Pulse all fire on one commit");
  await sleep(1100);
  // suite correction: the LifeCounter's accepted per-second `sb-roll` is excluded by name
  const still = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.animationName !== "sb-roll").length);
  ok(still === 0, `…and settle: nothing runs a second later (${still})`);

  /* ---- 6. Reduced motion: final states immediately ---- */
  console.log("6. Reduced motion");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 1440, 1000);
  await openDeck(page);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-more]")));
  await sleep(200);
  const rm = await page.evaluate(() => {
    const tiles = [...document.querySelectorAll("[data-sb-expression-library] [data-sb-expression-option]")];
    return tiles.every((c) => { const cs = getComputedStyle(c); return parseFloat(cs.animationDuration) <= 0.001 && getComputedStyle(c).opacity === "1"; });
  });
  ok(rm, "reduced motion: the library is simply there — final state immediately");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* ---- 7. Mobile ---- */
  console.log("7. Mobile");
  for (const theme of ["light", "dark"]) {
    await open(page, 360, 800, { theme });
    await openDeck(page);
    const m = await page.evaluate(() => {
      const d = document.querySelector("[data-sb-expression-deck]").getBoundingClientRect();
      const seats = [...document.querySelectorAll("[data-sb-expression-option]")];
      const resting = seats.find((x) => x !== document.activeElement && !x.hasAttribute("data-sb-previewing"));
      const hero = document.querySelector("[data-sb-horizon-stage] [data-sb-expression], [data-sb-horizon-stage] [data-sb-vessel-dormant]").getBoundingClientRect();
      return { inFrame: d.left >= -1 && d.right <= innerWidth + 1 && d.top >= 0 && d.bottom <= innerHeight + 1, art: Math.round(resting.querySelector("[data-sb-core]").getBoundingClientRect().width), hero: Math.round(hero.width), n: seats.length };
    });
    // Owner-superseded (R3.8 §22): one vessel + six cores on a phone
    ok(m.inFrame && m.n === 6 && m.art === 36 && m.hero >= 84, `${theme} 360: one ${m.hero}px vessel + six 36px cores, fully on screen`);
  }

  /* ---- 8. Page health ---- */
  console.log("8. Page health");
  ok(errors.length === 0, `zero page errors (${errors.length})`);
  ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length})${consoleErrors[0] ? " — " + consoleErrors[0].slice(0, 90) : ""}`);

  await browser.close();
  console.log(`\n${passed} passed, ${failures.length} failed`);
  console.log(`SOCIAL R3.6 PREMIUM EXPRESSIONS: ${failures.length ? "FAIL" : "PASS"}`);
  failures.forEach((f) => console.log("  - " + f));
  process.exit(failures.length ? 1 : 0);
})();
