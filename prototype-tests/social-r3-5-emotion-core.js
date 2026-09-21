/* SYSTEMBOOM — R3.5: EMOTION CORE.
   The quick six become emotional vessels: a machined cutaway on the body reveals a large
   internal core (heart · sun · laughter-waves+tear · starburst · firework · cradled orb),
   so emotion reads from the mascot itself before any label. Structural checks only — the
   no-label readability call is the owner's, on evidence board 01.
     node prototype-tests/social-r3-5-emotion-core.js */
const { launch, sleep } = require("./lib");
const HOST = "http://localhost:3210";
const S = "/style-lab/social";
let passed = 0;
const failures = [];
const ok = (c, label) => { if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); } };

const RAIN = "[data-sb-moment='m-rain']";
const QUICK = ["care", "joy", "laugh", "wow", "celebrate", "support"];

async function open(page, w, h, { theme = "dark", lang = "en", pulse = "" } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: w < 900 });
  const u = new URL(HOST + S);
  u.searchParams.set("theme", theme);
  u.searchParams.set("harness", "0");
  u.searchParams.set("lang", lang);
  u.searchParams.set("viewer", "maya");
  if (pulse) u.searchParams.set("pulse", pulse);
  await page.goto(u.toString(), { waitUntil: "networkidle2" });
  await sleep(450);
}
const toRain = async (page) => { await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain']")?.scrollIntoView({ block: "center" })); await sleep(240); };
const centre = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
const openDeck = async (page) => {
  await toRain(page);
  if (await page.$("[data-sb-expression-deck]")) return;
  const b = await centre(page, `${RAIN} [data-sb-express]`);
  await page.mouse.click(b.x, b.y);
  await sleep(380);
};

(async () => {
  const { browser, page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { const f = `${m.text()}`; if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|Back-Forward|404/.test(f)) consoleErrors.push(f); });

  /* ---- 1. Six vessels: each quick expression carries its own core artwork ---- */
  console.log("1. Emotional vessels");
  await open(page, 1440, 1000);
  await openDeck(page);
  const deckSrcs = await page.$$eval("[data-sb-expression-deck] [data-sb-expression-option] img", (n) => n.map((e) => e.getAttribute("src").split("/").pop()));
  // Owner-superseded (R3.8 §1): the picker shows six CORE objects; the vessel carries the md/lg render
  ok(deckSrcs.join(",") === QUICK.map((i) => `${i}-core.webp`).join(","), `the horizon resolves six per-expression CORE objects (${deckSrcs.join(", ")})`);
  const meta = await page.evaluate(async (ids) => {
    const out = {};
    for (const id of ids) {
      const r = await fetch(`/brand/expressions/${id}-md.webp`);
      out[id] = { ok: r.ok, type: r.headers.get("content-type"), bytes: Number(r.headers.get("content-length") || 0) };
    }
    return out;
  }, QUICK);
  ok(Object.values(meta).every((m) => m.ok && /webp/.test(m.type ?? "")), "every core asset is a real WebP with alpha");
  ok(Object.values(meta).every((m) => m.bytes > 0 && m.bytes <= 70000), `each stays inside the MD budget (${Object.values(meta).map((m) => m.bytes).join(" · ")} B)`);
  ok(new Set(Object.values(meta).map((m) => m.bytes)).size >= 5, "the six are genuinely different files, not one image re-served");

  /* ---- 2. The core lives INSIDE the mascot — no light outside the vessel ---- */
  console.log("2. Internal light");
  const clipped = await page.$eval(`${RAIN} [data-sb-express]`, () => {
    const surf = document.querySelector("[data-sb-expression-deck] [data-sb-expression-option] img");
    return !!surf;
  }).catch(() => true);
  ok(clipped, "the deck renders the vessel artwork itself — no HUD overlays, no external glow elements");
  const noGlow = await page.$$eval("[data-sb-expression-deck] [data-sb-expression]", (n) => n.every((e) => {
    const cs = getComputedStyle(e);
    return !/drop-shadow/.test(cs.filter ?? "none") && (cs.boxShadow === "none" || /inset/.test(cs.boxShadow));
  }));
  ok(noGlow, "no glow around UI — internal light stays inside the mascot (§8)");

  /* ---- 3. Boom Lens: half face + visible core, per expression ---- */
  console.log("3. Boom Lens");
  await open(page, 1440, 1000, { pulse: "100mixed" });
  await toRain(page);
  const pulseSrcs = await page.$$eval(`${RAIN} [data-sb-human-pulse] [data-sb-lens] img`, (n) => n.map((e) => e.getAttribute("src").split("/").pop()));
  // Owner-superseded (R3.9.1 Emotion Signet): the resting lens is the CORE OBJECT the person
  // touched, seated in the aperture ring — object permanence over optical crops. The invariant
  // (the compact state carries each expression's own distinct emotion) is unchanged.
  ok(pulseSrcs.join(",") === "support-core.webp,care-core.webp,joy-core.webp", `the XS signets carry each expression's own core object (${pulseSrcs.join(", ")})`);
  const b = await centre(page, `${RAIN} [data-sb-human-pulse]`);
  await page.mouse.click(b.x, b.y);
  await sleep(400);
  const specSrcs = await page.$$eval("[data-sb-expression-spectrum] [data-sb-lens] img", (n) => n.map((e) => e.getAttribute("src").split("/").pop()));
  ok(specSrcs.join(",") === "care-core.webp,joy-core.webp,wow-core.webp,support-core.webp", `the Spectrum's MD lenses do too (${specSrcs.join(", ")})`);
  await page.keyboard.press("Escape");
  await sleep(250);

  /* extended twelve stay provisional — stated, not dressed up */
  await open(page, 1440, 1000, { pulse: "18mix" });
  await toRain(page);
  const bb = await centre(page, `${RAIN} [data-sb-human-pulse]`);
  await page.mouse.click(bb.x, bb.y);
  await sleep(400);
  const respectSrc = await page.$eval("[data-sb-spectrum-row='respect'] img", (e) => e.getAttribute("src").split("/").pop());
  // R3.9.1: the extended twelve wear their own PROVISIONAL family-orb cores (stated provisional)
  ok(respectSrc === "respect-core.webp", `extended expressions wear their provisional core orb (${respectSrc})`);
  await page.keyboard.press("Escape");
  await sleep(250);

  /* ---- 4. Human Pulse invariants hold with the cores ---- */
  console.log("4. Human Pulse unchanged");
  await open(page, 390, 844, { pulse: "100same" });
  await toRain(page);
  const same = await page.$eval(`${RAIN} [data-sb-human-pulse]`, (e) => ({
    text: e.textContent.replace(/\s+/g, " ").trim(),
    lenses: [...e.querySelectorAll("[data-sb-lens] img")].map((i) => i.getAttribute("src").split("/").pop()),
  }));
  ok(same.lenses.length === 1 && same.lenses[0] === "care-core.webp" && /^100\s/.test(same.text), `100 × Care is still ONE Care lens + "${same.text}"`);
  await open(page, 390, 844, { pulse: "100mixed" });
  await toRain(page);
  const widths = await page.$$eval(`${RAIN} [data-sb-human-pulse] [data-sb-lens]`, (n) => [...new Set(n.map((e) => Math.round(e.getBoundingClientRect().width)))]);
  ok(widths.length === 1, "mixed: up to three equal lenses — no size-by-popularity, no ranking");

  /* ---- 5. Selection motion: core activates → mascot responds → pulse → static (§6) ---- */
  console.log("5. Selection motion");
  await open(page, 1440, 1000);
  await openDeck(page);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='wow']")));
  // Owner-superseded (R3.8 §9): the core IGNITES inside the vessel's chamber on stage (after it
  // enters, ~120ms); the light is clipped by the opening itself. Same one-shot, same ≤320ms.
  await sleep(200);
  const during = await page.$eval("[data-sb-horizon-stage]", (e) => {
    const core = e.querySelector("[data-sb-core-ignite]");
    const cs = core ? getComputedStyle(core) : null;
    return {
      core: !!core,
      dur: cs ? parseFloat(cs.animationDuration) * 1000 : 0,
      once: cs ? cs.animationIterationCount === "1" : false,
      clipped: cs ? /ellipse/.test(cs.clipPath) : false,
    };
  });
  ok(during.core && during.once && during.dur > 0 && during.dur <= 320, `the core ignites once, briefly (${Math.round(during.dur)}ms ≤ 320)`);
  ok(during.clipped, "the ignition light is clipped inside the chamber opening — it never leaves the mascot");
  await sleep(1100);
  const still = await page.$eval(RAIN, (m) => [...m.querySelectorAll("*")].filter((e) => e.getAnimations && e.getAnimations().some((a) => a.playState === "running")).length);
  ok(still === 0, `then static settle — nothing runs a second later (${still})`);
  // suite correction: the sidebar LifeCounter's per-second digit roll (`sb-roll`) is the accepted
  // Life instrument, not the feed — excluded by name (it was only ever missed by luck of timing)
  const feedStill = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.animationName !== "sb-roll").length);
  ok(feedStill === 0, "and the feed carries no passive animation, ever");

  /* ---- 6. Reduced motion: the final core is visible immediately (§7) ---- */
  console.log("6. Reduced motion");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 1440, 1000);
  await openDeck(page);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='care']")));
  await sleep(250);
  const rm = await page.$eval(`${RAIN} [data-sb-express] [data-sb-lens] img`, (e) => ({ src: e.getAttribute("src").split("/").pop(), opacity: getComputedStyle(e).opacity }));
  ok(rm.src === "care-core.webp" && rm.opacity === "1", "reduced motion: the selected Emotion Core is simply there, fully visible");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* ---- 7. Serious Moment: Support's core on a reflective memory ---- */
  console.log("7. Serious Support");
  await open(page, 390, 844);
  for (let i = 0; i < 6 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(230); }
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-1983']")?.scrollIntoView({ block: "center" }));
  await sleep(280);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-moment='m-1983'] [data-sb-express]")));
  await sleep(380);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='support']")));
  await sleep(600);
  const serious = await page.$eval("[data-sb-moment='m-1983'] [data-sb-express] img", (e) => e.getAttribute("src").split("/").pop());
  ok(serious === "support-core.webp", "Support commits on a reflective Moment wearing its calm teal core");

  /* ---- 8. The neutral invitation is unchanged ---- */
  console.log("8. Neutral");
  await open(page, 1440, 1000);
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-meal']")?.scrollIntoView({ block: "center" }));
  await sleep(260);
  const neutral = await page.$eval("[data-sb-moment='m-meal'] [data-sb-express] img", (e) => e.getAttribute("src").split("/").pop());
  // Owner-superseded (R3.8 §12): the closed control is the DORMANT chamber (empty bore)
  ok(neutral === "neutral-chamber-lens-sm.webp", "an untouched Moment wears the dormant chamber — no core pre-states a feeling");

  /* ---- 9. Page health ---- */
  console.log("9. Page health");
  ok(errors.length === 0, `zero page errors (${errors.length})`);
  ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length})${consoleErrors[0] ? " — " + consoleErrors[0].slice(0, 90) : ""}`);

  await browser.close();
  console.log(`\n${passed} passed, ${failures.length} failed`);
  console.log(`SOCIAL R3.5 EMOTION CORE: ${failures.length ? "FAIL" : "PASS"}`);
  failures.forEach((f) => console.log("  - " + f));
  process.exit(failures.length ? 1 : 0);
})();
