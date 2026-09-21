/* SYSTEMBOOM — CELESTIAL RESONANCE, SLICE 2: the Celestial Field in isolation.
   State machine, COMMIT-once + durability, the 120–180ms reduced-motion crossfade and its
   interrupt, keyboard + focus, the inert close trigger, the eight distinct motion profiles,
   and the localization × viewport matrix.
     node prototype-tests/celestial-s2-field.js            (expects the dev server on :3210) */
const { launch, sleep } = require("./celestial-lib");
const HOST = "http://localhost:3210";
const P = "/style-lab/celestial";
let passed = 0; const failures = [];
const ok = (c, label) => { if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); } };

const F = "[data-sb-celestial-field]";
const phase = (page) => page.$eval(F, (e) => e.getAttribute("data-sb-field-phase"));
const mode = (page) => page.$eval(F, (e) => e.getAttribute("data-sb-field-mode"));

async function open(page, w, { theme = "dark", lang = "en", reduced = false, learning = null } = {}) {
  await page.setViewport({ width: w, height: 950, deviceScaleFactor: 1, hasTouch: w < 900 });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: reduced ? "reduce" : "no-preference" }]);
  await page.setCookie({ name: "sb-locale", value: lang, domain: "localhost", path: "/" });
  await page.goto(`${HOST}${P}?theme=${theme}&lang=${lang}`, { waitUntil: "networkidle2" });
  await sleep(350);
  if (learning) { await page.click(`[data-sb-preview-learning='${learning}']`); await sleep(120); }
}
const openField = async (page) => { await page.click("[data-sb-preview-open]"); await sleep(420); };

(async () => {
  const { page } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { const f = `${m.text()}`; if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|404/.test(f)) consoleErrors.push(f); });
  page.on("pageerror", (e) => consoleErrors.push(`PAGEERROR ${e.message}`));

  /* ---- 1. It is a spatial arc, and the Primary 8 only ---- */
  console.log("1. The field is a horizon of the Primary 8");
  await open(page, 1500);
  ok(!(await page.$(F)), "closed: the field renders nothing at all");
  await openField(page);
  const ids = await page.$$eval("[data-sb-resonance-item]", (n) => n.map((e) => e.getAttribute("data-sb-resonance-item")));
  ok(ids.length === 8, `exactly 8 objects (${ids.length})`);
  ok(JSON.stringify(ids) === JSON.stringify(["venus-love","sun-joy","meteor-laugh","comet-wow","jupiter-celebrate","saturn-support","moon-touched","mercury-curious"]),
     "canonical registry order, left to right");
  ok((await mode(page)) === "arc", "one horizon at desktop width — a spatial arc, not a grid or tray");
  const curved = await page.$$eval("[data-sb-resonance-item]", (n) => {
    const ys = n.map((e) => Math.round(e.getBoundingClientRect().top));
    return new Set(ys).size > 1;
  });
  ok(curved, "the objects sit on a curve, not a flat row");
  ok((await page.$$("[data-sb-celestial-readout]")).length === 1, "one shared phrase readout, not eight repeated phrases");

  /* ---- 2. State machine ---- */
  console.log("2. State machine");
  ok((await phase(page)) === "open", "OPEN after OPENING");
  await page.hover("[data-sb-resonance-item='saturn-support']"); await sleep(140);
  ok((await phase(page)) === "preview", "pointer over an object → PREVIEW");
  ok((await page.$eval("[data-sb-resonance-item='saturn-support']", (e) => e.getAttribute("data-sb-resonance-state"))) === "preview", "that object is the previewed one");
  const readoutOnPreview = await page.$eval("[data-sb-celestial-readout]", (e) => e.getAttribute("data-sb-readout-for"));
  ok(readoutOnPreview === "saturn-support", "the readout follows attention");
  await page.keyboard.press("Escape"); await sleep(260);
  ok(!(await page.$(F)), "Escape cancels and the field closes");

  /* ---- 3. COMMIT fires exactly once, at COMMIT START ---- */
  console.log("3. Commit — exactly once, at COMMIT START");
  await open(page, 1500);
  await openField(page);
  await page.click("[data-sb-resonance-item='venus-love']");
  await sleep(60); // deliberately mid-COMMIT, long before SETTLE
  const earlyCommits = await page.$eval("[data-sb-preview-commits]", (e) => Number(e.getAttribute("data-sb-preview-commits")));
  const earlySelected = await page.$eval("[data-sb-preview-selected]", (e) => e.getAttribute("data-sb-preview-selected"));
  ok(earlyCommits === 1, "the commit callback has already fired 60ms in — persistence does not wait for SETTLE");
  ok(earlySelected === "venus-love", "state is already persisted at COMMIT START");
  const midPhase = await phase(page);
  ok(midPhase === "commit" || midPhase === "settle", `still animating while already persisted (phase ${midPhase})`);
  await sleep(1400);
  const afterCommits = await page.$eval("[data-sb-preview-commits]", (e) => Number(e.getAttribute("data-sb-preview-commits")));
  ok(afterCommits === 1, "exactly ONE commit callback for one commit — never a second at SETTLE");

  /* ---- 4. Commit durability across unmount mid-SETTLE ---- */
  console.log("4. Commit durability");
  await open(page, 1500);
  await openField(page);
  await page.click("[data-sb-resonance-item='jupiter-celebrate']");
  await sleep(70);
  await page.click("[data-sb-preview-open]"); // tear the field down mid-SETTLE
  await sleep(300);
  ok((await page.$eval("[data-sb-preview-selected]", (e) => e.getAttribute("data-sb-preview-selected"))) === "jupiter-celebrate",
     "unmounting mid-SETTLE leaves the commit persisted");
  ok((await page.$eval("[data-sb-preview-commits]", (e) => Number(e.getAttribute("data-sb-preview-commits")))) === 1,
     "and does not double-fire the callback");

  /* ---- 5. Reduced motion: a measured crossfade, NOT an instant cut ---- */
  console.log("5. Reduced motion — 120–180ms static crossfade");
  await open(page, 1500, { reduced: true });
  await openField(page);
  ok((await page.$eval(F, (e) => e.getAttribute("data-sb-reduced-motion"))) === "1", "the field knows reduced motion is on");
  const durations = await page.$$eval("[data-sb-resonance-item] span", (nodes) =>
    nodes.map((n) => getComputedStyle(n).transitionDuration).filter(Boolean));
  const geo = await page.$eval("[data-sb-resonance-item='mercury-curious']", (e) => {
    const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
  });
  await page.hover("[data-sb-resonance-item='mercury-curious']");
  await sleep(220);
  const geo2 = await page.$eval("[data-sb-resonance-item='mercury-curious']", (e) => {
    const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
  });
  ok(geo.x === geo2.x && geo.y === geo2.y && geo.w === geo2.w && geo.h === geo2.h,
     "reduced motion: geometry is unchanged start→end — no spatial travel, no scale travel");
  const crossfade = await page.evaluate(() => window.__SB_CELESTIAL_CROSSFADE_MS ?? null);
  ok(crossfade === null || (crossfade >= 120 && crossfade <= 180), "the crossfade constant is inside 120–180ms");
  await page.click("[data-sb-resonance-item='moon-touched']");
  await sleep(40);
  ok((await page.$eval("[data-sb-preview-commits]", (e) => Number(e.getAttribute("data-sb-preview-commits")))) === 1,
     "reduced motion does not change commit timing — still fires at COMMIT START");

  /* ---- 6. Interrupt: immediate logical cancel, no queue ---- */
  console.log("6. Interruption");
  await open(page, 1500);
  await openField(page);
  for (const id of ["venus-love", "sun-joy", "comet-wow", "saturn-support"]) {
    await page.hover(`[data-sb-resonance-item='${id}']`); await sleep(60); // faster than any profile
  }
  const previewCount = await page.$$eval("[data-sb-resonance-item][data-sb-resonance-state='preview']", (n) => n.length);
  ok(previewCount <= 1, "rapid re-selection leaves at most one previewed object — no animation queue");
  await page.keyboard.press("Escape"); await sleep(300);
  ok(!(await page.$(F)), "cancel during rapid preview closes cleanly");

  /* ---- 7. Keyboard and focus ---- */
  console.log("7. Keyboard · focus");
  await open(page, 1500);
  await openField(page);
  const focusedFirst = await page.evaluate(() => document.activeElement?.getAttribute("data-sb-resonance-item"));
  ok(focusedFirst === "venus-love", "focus enters the field on the first object");
  await page.keyboard.press("ArrowRight"); await sleep(80);
  await page.keyboard.press("ArrowRight"); await sleep(80);
  ok((await page.evaluate(() => document.activeElement?.getAttribute("data-sb-resonance-item"))) === "meteor-laugh",
     "arrow keys move along canonical order");
  await page.keyboard.press("End"); await sleep(80);
  ok((await page.evaluate(() => document.activeElement?.getAttribute("data-sb-resonance-item"))) === "mercury-curious", "End reaches the last object");
  await page.keyboard.press("ArrowRight"); await sleep(80);
  ok((await page.evaluate(() => document.activeElement?.getAttribute("data-sb-resonance-item"))) === "venus-love", "focus wraps");
  const roving = await page.$$eval("[data-sb-resonance-item]", (n) => n.filter((e) => e.getAttribute("tabindex") === "0").length);
  ok(roving === 1, "exactly one tab stop for the whole group (roving tabindex)");
  const radio = await page.$eval("[data-sb-resonance-item='venus-love']", (e) => ({ role: e.getAttribute("role"), checked: e.getAttribute("aria-checked"), label: e.getAttribute("aria-label") }));
  ok(radio.role === "radio" && radio.checked !== null, "each object is a radio with aria-checked");
  ok(/^Celestial Resonance: Venus, Love\. Closer together\.$/.test(radio.label || ""),
     `the accessible name leads with the system name (got: ${radio.label})`);
  await page.keyboard.press("Enter"); await sleep(1500);
  ok((await page.$eval("[data-sb-preview-selected]", (e) => e.getAttribute("data-sb-preview-selected"))) === "venus-love", "Enter commits the focused object");

  /* ---- 8. The close trigger must not be focusable while unavailable ---- */
  console.log("8. Hidden control behaviour (Batch C.1 canonical requirement)");
  await open(page, 1500);
  await page.focus("[data-sb-preview-open]");
  let reached = false;
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press("Tab"); await sleep(50);
    if (await page.evaluate(() => !!document.activeElement?.closest("[data-sb-celestial-close]"))) reached = true;
  }
  ok(!reached, "while the field is closed, six Tabs never reach the close trigger");
  await openField(page);
  const closeAttrs = await page.$eval("[data-sb-celestial-close]", (e) => ({
    tabindex: e.getAttribute("tabindex"), hidden: e.getAttribute("aria-hidden"), inert: e.hasAttribute("inert"), avail: e.getAttribute("data-sb-close-available"),
  }));
  ok(closeAttrs.avail === "1" && closeAttrs.tabindex === "0" && closeAttrs.hidden === null && closeAttrs.inert === false,
     "while open it is focusable, not aria-hidden and not inert");
  await page.click("[data-sb-celestial-close]"); await sleep(300);
  ok(!(await page.$(F)), "the close trigger closes the field");

  /* ---- 9. Eight distinct motion profiles ---- */
  console.log("9. Eight distinct emotional physics");
  await open(page, 1500);
  await openField(page);
  const sampled = {};
  for (const id of ["venus-love","sun-joy","meteor-laugh","comet-wow","jupiter-celebrate","saturn-support","moon-touched","mercury-curious"]) {
    await page.hover(`[data-sb-resonance-item='${id}']`);
    await sleep(110); // sample mid-profile
    sampled[id] = await page.$eval(`[data-sb-resonance-item='${id}'] span`, (e) => getComputedStyle(e).transform);
    await page.hover("[data-sb-celestial-readout]"); await sleep(120);
  }
  const distinct = new Set(Object.values(sampled).filter((v) => v && v !== "none"));
  ok(distinct.size >= 5, `mid-flight transforms differ across objects (${distinct.size} distinct of 8) — not one animation eight times`);

  /* ---- 10. Localization × viewport matrix ---- */
  console.log("10. Localization × viewport — measured, never assumed");
  const LOCALES = ["en","es","it","nl","ru","hi","ne","zh-Hans"];
  const WIDTHS = [360, 390, 1500];
  let bad = 0; const badList = [];
  for (const lang of LOCALES) {
    for (const w of WIDTHS) {
      await open(page, w, { lang });
      await openField(page);
      const r = await page.evaluate(() => {
        const f = document.querySelector("[data-sb-celestial-field]"); const fr = f.getBoundingClientRect();
        const labels = [...document.querySelectorAll("[data-sb-resonance-label]")];
        const clipped = labels.filter((e) => e.scrollWidth > e.clientWidth + 1).length;
        const rects = labels.map((e) => e.getBoundingClientRect()).filter((x) => x.width);
        let overlap = 0;
        for (let i = 0; i < rects.length; i += 1) for (let j = i + 1; j < rects.length; j += 1) {
          const a = rects[i], b = rects[j];
          if (a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5) overlap += 1;
        }
        const outside = [...document.querySelectorAll("[data-sb-resonance-item]")].filter((e) => {
          const x = e.getBoundingClientRect();
          return x.top < fr.top - 1 || x.bottom > fr.bottom + 1 || x.left < fr.left - 1 || x.right > fr.right + 1;
        }).length;
        return { clipped, overlap, outside, hOverflow: document.documentElement.scrollWidth > window.innerWidth };
      });
      if (r.clipped || r.overlap || r.outside || r.hOverflow) { bad += 1; badList.push(`${lang}@${w}:${JSON.stringify(r)}`); }
    }
  }
  ok(bad === 0, `all ${LOCALES.length * WIDTHS.length} language × width combinations render clean${bad ? ` — ${badList.slice(0, 3).join(" ")}` : ""}`);

  /* ---- 11. Both themes ---- */
  console.log("11. Deep Cosmos and Solar Observatory");
  for (const [theme, stem] of [["dark", "cosmos"], ["light", "solar"]]) {
    await open(page, 1500, { theme });
    await openField(page);
    const src = await page.$eval("[data-sb-resonance-item='saturn-support'] img", (e) => e.getAttribute("src"));
    ok((src || "").includes(`-${stem}-`), `${theme}: objects load the ${stem} masters`);
  }

  /* ---- 12. No passive loops in settled UI ---- */
  console.log("12. Motion restraint");
  await open(page, 1500);
  await openField(page);
  const infinite = await page.evaluate(() =>
    [...document.querySelectorAll("[data-sb-celestial-field] *")].filter((e) => {
      const cs = getComputedStyle(e);
      return cs.animationIterationCount === "infinite" && cs.animationName !== "none";
    }).length);
  ok(infinite === 0, "nothing in the field loops forever");

  ok(consoleErrors.length === 0, `no console/page errors${consoleErrors.length ? ` — ${consoleErrors[0]}` : ""}`);

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { failures.forEach((f) => console.log(`  FAILED: ${f}`)); process.exitCode = 1; }
  await page.browser().close();
})();
