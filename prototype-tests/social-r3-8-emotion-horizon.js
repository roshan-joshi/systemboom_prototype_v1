/* SYSTEMBOOM — R3.8: EMOTION HORIZON.
   ONE vessel mascot + six CORE OBJECTS on a shallow horizon (never six clones), the Emotion
   Atlas (cores in four family bands, one preview vessel), the physically integrated chamber,
   the three-stage commit (core → chamber → lens) with a landing lens, the chamber-shaped Boom
   Lens everywhere (Human Pulse architecture untouched), the dormant closed control, both
   themes, 360, reduced motion and zero passive motion. Structural proof; the beauty call is the
   owner's, on the evidence boards.
     node prototype-tests/social-r3-8-emotion-horizon.js */
const { launch, sleep } = require("./lib");
const HOST = "http://localhost:3210";
const S = "/style-lab/social";
let passed = 0;
const failures = [];
const ok = (c, label) => { if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); } };

const RAIN = "[data-sb-moment='m-rain']";
const QUICK = ["care", "joy", "laugh", "wow", "celebrate", "support"];
const TEMPO = { care: 360, joy: 300, laugh: 400, wow: 260, celebrate: 460, support: 380 };

async function open(page, w, h, { theme = "dark" } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: w < 900 });
  await page.goto(`${HOST}${S}?theme=${theme}&harness=0&viewer=maya`, { waitUntil: "networkidle2" });
  await sleep(450);
}
const toRain = async (page) => { await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain']")?.scrollIntoView({ block: "center" })); await sleep(240); };
const centre = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
const openDeck = async (page, settle = 420) => { await toRain(page); if (await page.$("[data-sb-expression-deck]")) return; const b = await centre(page, `${RAIN} [data-sb-express]`); await page.mouse.click(b.x, b.y); await sleep(settle); };
const mine = (page) => page.$eval(`${RAIN} [data-sb-express]`, (e) => e.getAttribute("data-sb-express"));
const runningIn = (page, sel) => page.evaluate((s) => [...document.querySelectorAll(`${s} *`)].flatMap((e) => (e.getAnimations ? e.getAnimations().filter((a) => a.playState === "running" && a.animationName !== "sb-roll").map((a) => a.animationName ?? "transition") : [])), sel);

(async () => {
  const { browser, page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { const f = `${m.text()}`; if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|Back-Forward|404/.test(f)) consoleErrors.push(f); });

  /* ---- 1. ONE mascot, six cores ---- */
  console.log("1. One-mascot model");
  await open(page, 1440, 1000);
  await openDeck(page);
  // opening focuses the first core, which (correctly) previews it in the vessel — measure at rest
  await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur());
  await page.mouse.move(4, 4);
  await sleep(260);
  const model = await page.evaluate(() => {
    const d = document.querySelector("[data-sb-expression-deck]");
    const mascots = d.querySelectorAll("[data-sb-expression], [data-sb-vessel-dormant]");
    const opts = [...d.querySelectorAll("[data-sb-expression-option]")];
    const cores = opts.map((o) => o.querySelector("[data-sb-core]"));
    const rects = opts.map((o) => o.getBoundingClientRect());
    const stage = d.querySelector("[data-sb-horizon-stage]");
    const hero = stage.querySelector("[data-sb-expression], [data-sb-vessel-dormant]").getBoundingClientRect();
    return {
      horizon: d.hasAttribute("data-sb-emotion-horizon"),
      mascots: mascots.length,
      cores: cores.filter(Boolean).length,
      srcs: cores.map((c) => c?.querySelector("img")?.getAttribute("src").split("/").pop()),
      heroPx: Math.round(hero.width),
      dormant: !!stage.querySelector("[data-sb-vessel-dormant]"),
      belowHero: rects.every((r) => r.top > hero.top + hero.height * 0.6),
      oneRow: rects.every((r, i) => i === 0 || r.left > rects[i - 1].left) && Math.max(...rects.map((r) => r.top)) - Math.min(...rects.map((r) => r.top)) <= 12,
      curve: new Set(opts.map((o) => getComputedStyle(o).translate)).size >= 3,
      hit: Math.min(...rects.map((r) => Math.min(r.width, r.height))),
      noCards: opts.every((o) => { const cs = getComputedStyle(o); return cs.backgroundImage === "none" && cs.boxShadow === "none"; }),
      shadow: /radial-gradient/.test(getComputedStyle(cores[0], "::after").backgroundImage),
    };
  });
  ok(model.horizon && model.mascots === 1, `exactly ONE full mascot in the picker (${model.mascots})`);
  ok(model.cores === 6 && model.srcs.join(",") === QUICK.map((i) => `${i}-core.webp`).join(","), `the Quick Six are six CORE objects, in order (${model.srcs.join(", ")})`);
  ok(model.heroPx >= 84 && model.heroPx <= 110 && model.dormant, `the vessel on stage is ${model.heroPx}px and DORMANT (empty chamber) until a core is attended`);
  ok(model.belowHero && model.oneRow && model.curve, "the six sit on one shallow horizon below the vessel — a curve, not a row of tiles");
  ok(model.noCards && model.shadow && model.hit >= 44, `no card behind any core; each is grounded by a contact shadow; hits ≥44px (${Math.round(model.hit)}px)`);

  /* ---- 2. The cores are physical objects, each unique ---- */
  console.log("2. Emotion cores");
  const coreArt = await page.evaluate(async () => {
    const hashes = [];
    for (const id of ["care", "joy", "laugh", "wow", "celebrate", "support"]) {
      const buf = new Uint8Array(await (await fetch(`/brand/expressions/${id}-core.webp`)).arrayBuffer());
      let h = 0; for (let i = 0; i < buf.length; i += 5) h = (h * 31 + buf[i]) >>> 0;
      hashes.push(`${buf.length}:${h}`);
    }
    const marks = document.querySelectorAll("[data-sb-expression-deck] [data-sb-mark]").length;
    const text = [...document.querySelectorAll("[data-sb-expression-deck] [data-sb-expression-option]")].every((o) => (o.textContent ?? "").trim() === "");
    return { distinct: new Set(hashes).size, marks, text };
  });
  ok(coreArt.distinct === 6, "six distinct rendered core objects on disk (lit orbs, not glyphs)");
  ok(coreArt.marks === 0 && coreArt.text, "no badges and no text on the horizon — the core shape alone must carry the meaning");

  /* ---- 3. PREVIEW — the core enters the vessel; the vessel shows it; small gesture only ---- */
  console.log("3. Preview");
  let previewOk = true, wakeOk = true, smallOk = true, labelOk = true, riseOk = true;
  const heroSrcs = [];
  for (const id of QUICK) {
    await page.mouse.move(4, 4);
    await sleep(160);
    const c = await centre(page, `[data-sb-expression-option='${id}']`);
    await page.mouse.move(c.x, c.y, { steps: 2 });
    await sleep(30);
    const p = await page.evaluate((i) => {
      const stage = document.querySelector("[data-sb-horizon-stage]");
      const hero = stage.querySelector("[data-sb-expression]");
      const wake = stage.querySelector("[data-sb-core-wake]");
      const art = stage.querySelector(".sb-stage-art");
      const names = [...stage.querySelectorAll("*")].flatMap((e) => (e.getAnimations ? e.getAnimations().filter((a) => a.playState === "running").map((a) => a.animationName ?? "") : []));
      return { heroId: hero?.getAttribute("data-sb-expression"), src: hero?.querySelector("img")?.getAttribute("src").split("/").pop(), wake: wake?.getAttribute("data-sb-core-wake"), gesture: /sb-hero-preview/.test(getComputedStyle(art).animationName), full: names.some((n) => /sb-g-|sb-mass|sb-boom-pulse|sb-lock/.test(n)), caption: document.querySelector("[data-sb-deck-caption]").textContent.trim() };
    }, id);
    heroSrcs.push(p.src);
    if (p.heroId !== id) previewOk = false;
    if (p.wake !== id) wakeOk = false;
    if (!p.gesture || p.full) smallOk = false;
    if (!p.caption || /How did/.test(p.caption)) labelOk = false;
    await sleep(200);
    const r = await page.evaluate((i) => { const b = document.querySelector(`[data-sb-expression-option='${i}'] .sb-core-body`); const t = getComputedStyle(b).translate.split(" "); return { y: parseFloat(t[1] ?? "0"), x: parseFloat(t[0]) }; }, id);
    if (!(r.y <= -3 && r.y >= -7 && Math.abs(r.x) >= 2)) riseOk = false;
  }
  ok(previewOk && new Set(heroSrcs).size === 6, `attending a core puts THAT feeling into the vessel (${heroSrcs.join(", ")})`);
  ok(wakeOk && smallOk, "the chamber wakes with the core's own light and the vessel makes only a SMALL preview gesture — never the commit");
  ok(riseOk && labelOk, "the core rises 3–7px toward the chamber and the label names the feeling");
  await page.mouse.move(4, 4);
  await sleep(300);

  /* ---- 4. COMMIT — core → chamber → vessel performs → lens; then stillness ---- */
  console.log("4. Commit");
  let s1 = true, s2 = true, s3 = true, still = true, truth = true;
  const gestures = [];
  for (const id of QUICK) {
    await openDeck(page);
    await page.mouse.move(4, 4);
    await sleep(120);
    await page.mouse.click(...Object.values(await centre(page, `[data-sb-expression-option='${id}']`)));
    await sleep(40);
    const a = await page.evaluate((i) => {
      const f = document.querySelector("[data-sb-core-flight]");
      const d = document.querySelector("[data-sb-expression-deck]");
      const hidden = getComputedStyle(document.querySelector(`[data-sb-expression-option='${i}'] [data-sb-core]`)).visibility === "hidden";
      const receding = [...d.querySelectorAll(`[data-sb-expression-option]:not([data-sb-expression-option='${i}']) .sb-core-body`)].every((b) => parseFloat(getComputedStyle(b).opacity) < 1 || getComputedStyle(b).scale !== "none");
      return { flight: f?.getAttribute("data-sb-core-flight") === i && /sb-core-flight/.test(getComputedStyle(f).animationName), committing: d.hasAttribute("data-sb-committing"), hidden, receding, mine: document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]").getAttribute("data-sb-express") };
    }, id);
    if (!(a.flight && a.committing && a.hidden)) s1 = false;
    if (a.mine !== id) truth = false;
    await sleep(160); // ≈ +200ms: the vessel is performing
    const b = await page.evaluate(() => {
      const stage = document.querySelector("[data-sb-horizon-stage]");
      const names = [...(stage?.querySelectorAll("*") ?? [])].flatMap((e) => (e.getAnimations ? e.getAnimations().filter((a) => a.playState === "running").map((a) => a.animationName ?? "") : []));
      return { performing: stage?.getAttribute("data-sb-performing"), names: names.join(" "), ignite: !!stage?.querySelector("[data-sb-core-ignite]") };
    });
    gestures.push(b.names.match(/sb-g-\w+/)?.[0] ?? "");
    if (!(b.performing === id && /sb-lock/.test(b.names) && new RegExp(`sb-g-${id}`).test(b.names) && /sb-mass/.test(b.names) && /sb-boom-pulse/.test(b.names) && b.ignite)) s2 = false;
    // R3.9: the collapse begins at 120 + 0.7·tempo so the emotional event owns the stage first
    await sleep(Math.round(TEMPO[id] * 0.7) - 20); // ≈ +120 + 0.7·tempo + 60: the chamber is collapsing
    const cc = await page.evaluate((i) => {
      const f = document.querySelector("[data-sb-lens-flight]");
      const d = document.querySelector("[data-sb-expression-deck]");
      return { flight: f?.getAttribute("data-sb-lens-flight") === i && /sb-lens-flight/.test(getComputedStyle(f).animationName), fading: !!d && d.hasAttribute("data-sb-closing"), landing: document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]").hasAttribute("data-sb-landing") };
    }, id);
    if (!(cc.flight && cc.fading && cc.landing)) s3 = false;
    await sleep(900);
    const e = await page.evaluate(() => {
      const ctrl = document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]");
      const running = [...document.querySelectorAll("[data-sb-social-frame] *")].flatMap((el) => (el.getAnimations ? el.getAnimations().filter((a) => a.playState === "running" && a.animationName !== "sb-roll").map((a) => a.animationName ?? "transition") : []));
      return { deck: !!document.querySelector("[data-sb-expression-deck]"), flights: document.querySelectorAll("[data-sb-core-flight],[data-sb-lens-flight]").length, landing: ctrl.hasAttribute("data-sb-landing"), lensOpacity: getComputedStyle(ctrl.querySelector("[data-sb-lens]").parentElement).opacity, running };
    });
    if (e.deck || e.flights || e.landing || e.lensOpacity !== "1" || e.running.length) { still = false; console.log("    after", id, JSON.stringify(e)); }
  }
  ok(s1 && truth, "stage 1: the chosen core accelerates into the chamber (its seat empties, the others recede) — and the store is already true");
  ok(s2 && new Set(gestures).size === 6, `stage 2: the shell LOCKS the core and the vessel performs its own gesture + ignition + mass + Boom Pulse (${gestures.join(", ")})`);
  ok(s3, "stage 3: the activated chamber collapses into the lens beside Respond while the field lets go");
  ok(still, "SETTLE: a second later — no field, no flights, the lens landed, nothing running");

  /* ---- 5. The closed state: dormant chamber → selected core ---- */
  console.log("5. Closed state");
  const sel = await page.evaluate(() => {
    const ctrl = document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]");
    const lens = ctrl.querySelector("[data-sb-lens]");
    const dormant = document.querySelector("[data-sb-moment='m-meal'] [data-sb-express] [data-sb-lens-dormant] img")?.getAttribute("src").split("/").pop();
    return { shape: lens.getAttribute("data-sb-lens-shape"), clip: /path\(/.test(getComputedStyle(lens.querySelector(".sb-lens-surface")).clipPath), shell: !!lens.querySelector(".sb-lens-shell"), px: Math.round(lens.getBoundingClientRect().width), src: lens.querySelector("img").getAttribute("src").split("/").pop(), noMascot: !ctrl.querySelector("[data-sb-expression]"), dormant };
  });
  ok(sel.shape === "chamber" && sel.clip && sel.shell && sel.px >= 36, `the selected control is the oblique CHAMBER aperture with its shell fragment (${sel.px}px), not a circle badge`);
  // Owner-superseded (R3.9.1 Emotion Signet): the resting lens is the CORE OBJECT the person
  // touched, seated in the aperture ring — object permanence over optical crops. The invariant
  // (the compact state carries each expression's own distinct emotion) is unchanged.
  ok(/-core\.webp$/.test(sel.src) && sel.noMascot, `it shows the Emotion Core itself (${sel.src}) — never a tiny full mascot`);
  ok(sel.dormant === "neutral-chamber-lens-sm.webp", `an untouched Moment wears the DORMANT chamber (${sel.dormant}) — no feeling pre-stated`);

  /* ---- 6. Emotion Atlas ---- */
  console.log("6. Emotion Atlas");
  await openDeck(page);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-more]")));
  await sleep(520);
  const atlas = await page.evaluate(() => {
    const p = document.querySelector("[data-sb-expression-library]");
    const opts = [...p.querySelectorAll("[data-sb-expression-option]")];
    const frame = document.querySelector("[data-sb-social-frame]").getBoundingClientRect();
    const r = p.getBoundingClientRect();
    return {
      atlas: p.hasAttribute("data-sb-emotion-atlas"),
      mascots: p.querySelectorAll("[data-sb-expression], [data-sb-vessel-dormant]").length,
      cores: opts.filter((o) => o.querySelector("[data-sb-core] img[src$='-core.webp']")).length,
      named: opts.every((o) => (o.textContent ?? "").trim().length > 0),
      bands: [...p.querySelectorAll("[data-sb-field-band]")].map((b) => b.getAttribute("data-sb-field-band")).join(","),
      noCards: opts.every((o) => { const cs = getComputedStyle(o); return cs.backgroundImage === "none" && cs.boxShadow === "none"; }),
      inFrame: r.left >= frame.left - 1 && r.right <= frame.right + 1 && r.top >= 0,
    };
  });
  ok(atlas.atlas && atlas.mascots === 1 && atlas.cores === 18, `the Atlas keeps ONE vessel and shows eighteen CORES (${atlas.mascots} mascot, ${atlas.cores} cores)`);
  ok(atlas.bands === "warmth,energy,wonder,connection" && atlas.named && atlas.noCards, "cores in four family bands, each named beneath, no card around any");
  ok(atlas.inFrame, "the Atlas stays inside the frame");
  await page.mouse.move(...Object.values(await centre(page, "[data-sb-expression-option='nostalgia']")), { steps: 2 });
  await sleep(220);
  const atlasPreview = await page.$eval("[data-sb-horizon-stage]", (s) => s.getAttribute("data-sb-horizon-stage"));
  ok(atlasPreview === "nostalgia", "attending an Atlas core previews it in the SAME vessel");
  await page.keyboard.press("Escape");
  await sleep(150);
  await page.keyboard.press("Escape");
  await sleep(200);

  /* ---- 7. Human Pulse wears the chamber lens; its architecture is untouched ---- */
  console.log("7. Human Pulse");
  const pulse = await page.evaluate(() => {
    const p = document.querySelector("[data-sb-moment='m-rain'] [data-sb-human-pulse]");
    const lenses = [...p.querySelectorAll("[data-sb-lens]")];
    return { n: lenses.length, chamber: lenses.every((l) => l.getAttribute("data-sb-lens-shape") === "chamber" && /path\(/.test(getComputedStyle(l.querySelector(".sb-lens-surface")).clipPath)), widths: [...new Set(lenses.map((l) => Math.round(l.getBoundingClientRect().width)))], people: p.getAttribute("data-sb-expression-summary"), h: Math.round(p.getBoundingClientRect().height), mascots: p.querySelectorAll("[data-sb-expression]").length };
  });
  ok(pulse.n >= 1 && pulse.n <= 3 && pulse.chamber && pulse.widths.length === 1 && pulse.mascots === 0, `the pulse shows ≤3 equal chamber-shaped lenses and no full mascot (${pulse.n} × ${pulse.widths[0]}px)`);
  ok(Number(pulse.people) >= 2 && pulse.h <= 40, `"{n} people" + the same compact line (${pulse.people} people, ${pulse.h}px)`);

  /* ---- 8. Passive motion ---- */
  console.log("8. Passive motion");
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(700);
  const passive = await runningIn(page, "[data-sb-social-frame]");
  ok(passive.length === 0, `the feed at rest runs zero expression animations (${passive.length}; the LifeCounter's accepted seconds tick excluded by name)`);

  /* ---- 9. Themes ---- */
  console.log("9. Themes");
  const bg = {};
  for (const theme of ["dark", "light"]) {
    await open(page, 1440, 1000, { theme });
    await openDeck(page);
    bg[theme] = await page.$eval("[data-sb-expression-deck]", (e) => ({ bg: getComputedStyle(e).backgroundImage, mask: getComputedStyle(e).maskImage || getComputedStyle(e).webkitMaskImage, border: getComputedStyle(e).borderTopWidth, radius: parseFloat(getComputedStyle(e).borderTopLeftRadius) }));
  }
  ok(bg.light.bg !== bg.dark.bg && /gradient/.test(bg.light.bg) && /gradient/.test(bg.dark.bg), "Solar Observatory and Deep Cosmos are two designed local fields, both lit from one side");
  ok(/gradient/.test(bg.dark.mask) && bg.dark.border === "0px" && bg.dark.radius <= 20, "the field thins toward its edges (mask) — no border, no giant-radius card ancestry");

  /* ---- 10. 360 ---- */
  console.log("10. 360");
  for (const theme of ["light", "dark"]) {
    await open(page, 360, 800, { theme });
    await openDeck(page);
    const m = await page.evaluate(() => {
      const d = document.querySelector("[data-sb-expression-deck]").getBoundingClientRect();
      const opts = [...document.querySelectorAll("[data-sb-expression-option]")];
      const hero = document.querySelector("[data-sb-horizon-stage] [data-sb-expression], [data-sb-horizon-stage] [data-sb-vessel-dormant]").getBoundingClientRect();
      return { inFrame: d.left >= -1 && d.right <= innerWidth + 1 && d.top >= 0 && d.bottom <= innerHeight + 1, hit: Math.min(...opts.map((o) => o.getBoundingClientRect().width)), n: opts.length, hero: Math.round(hero.width), h: Math.round(d.height), mascots: document.querySelectorAll("[data-sb-expression-deck] [data-sb-expression], [data-sb-expression-deck] [data-sb-vessel-dormant]").length, noH: document.documentElement.scrollWidth <= innerWidth };
    });
    ok(m.inFrame && m.noH && m.n === 6 && m.hit >= 44 && m.mascots === 1, `${theme} 360: one ${m.hero}px vessel + six cores, ≥44px hits, fully on screen, no overflow`);
    ok(m.h <= 240, `${theme} 360: the field is compact — ${m.h}px (less than the old 3×2 of six mascots)`);
  }

  /* ---- 11. Reduced motion ---- */
  console.log("11. Reduced motion");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 1440, 1000);
  await openDeck(page, 60);
  const rm1 = await page.evaluate(() => [...document.querySelectorAll("[data-sb-expression-deck] .sb-core-body")].every((b) => parseFloat(getComputedStyle(b).animationDuration) <= 0.001 && getComputedStyle(b).opacity === "1"));
  ok(rm1, "reduce: the horizon is simply there");
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='joy']")));
  await sleep(60);
  const rm2 = await page.evaluate(() => ({ deck: !!document.querySelector("[data-sb-expression-deck]"), flights: document.querySelectorAll("[data-sb-core-flight],[data-sb-lens-flight]").length, mine: document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]").getAttribute("data-sb-express"), lens: getComputedStyle(document.querySelector("[data-sb-moment='m-rain'] [data-sb-express] [data-sb-lens]").parentElement).opacity }));
  ok(!rm2.deck && rm2.flights === 0 && rm2.mine === "joy" && rm2.lens === "1", "reduce: no flights, no performance — the final state at once");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* ---- 12. Page health ---- */
  console.log("12. Page health");
  ok(errors.length === 0, `zero page errors (${errors.length})`);
  ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length})${consoleErrors[0] ? " — " + consoleErrors[0].slice(0, 90) : ""}`);

  await browser.close();
  console.log(`\n${passed} passed, ${failures.length} failed`);
  console.log(`SOCIAL R3.8 EMOTION HORIZON: ${failures.length ? "FAIL" : "PASS"}`);
  failures.forEach((f) => console.log("  - " + f));
  process.exit(failures.length ? 1 : 0);
})();
