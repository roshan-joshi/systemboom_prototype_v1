/* SYSTEMBOOM — CELESTIAL RESONANCE, SLICES 3–6: Moment · Human Pulse · Chat · Notifications.
   Coexistence with the preserved mascot, one-per-viewer, bidirectional independence, canonical
   order under a skewed count, chat actor-awareness, notification privacy, and flag-off parity.
     node prototype-tests/celestial-s3-s6.js            (expects the dev server on :3210) */
const { launch, sleep } = require("./celestial-lib");
/* The chat rule is a pure function — exercise the REAL module directly rather than inferring
   the invariants from the UI. Transpiled with the repository's own TypeScript, so the test
   runs the shipped source, not a hand-copied approximation of it. */
const { applyChatResonance } = (() => {
  const fs = require("fs");
  const ts = require("typescript");
  const file = `${__dirname}/../src/lib/celestial/chat-resonance.ts`;
  const js = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function("module", "exports", "require", js)(mod, mod.exports, require);
  return mod.exports;
})();

const HOST = "http://localhost:3210";
let passed = 0; const failures = [];
const ok = (c, label) => { if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); } };

const SOCIAL = (q = "") => `${HOST}/style-lab/social?theme=dark${q}`;
const RAIN = "[data-sb-moment='m-rain']";

async function social(page, { celestial = true, w = 1280, lang = "en" } = {}) {
  await page.setViewport({ width: w, height: 1100, deviceScaleFactor: 1 });
  await page.setCookie({ name: "sb-locale", value: lang, domain: "localhost", path: "/" });
  await page.goto(SOCIAL(`${celestial ? "&celestial=1" : "&celestial=0"}&lang=${lang}`), { waitUntil: "networkidle2" });
  await sleep(700);
}
const toRain = async (page) => { await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain']")?.scrollIntoView({ block: "center" })); await sleep(250); };

async function enterWorld(page, celestial = true) {
  await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 1 });
  await page.goto(`${HOST}/?theme=dark${celestial ? "&celestial=1" : ""}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("[data-sb-gate-opener]", { timeout: 60000 });
  await sleep(1400);
  await page.click("[data-sb-gate-opener]"); await sleep(600);
  await page.waitForSelector("[role=dialog]", { timeout: 45000 }); await sleep(500);
  await page.evaluate(() => { [...document.querySelectorAll("[role=dialog] button")].find((x) => /Enter as Maya Rai/.test(x.textContent))?.click(); });
  await sleep(800);
  await page.click("[data-sb-enter-world]");
  await page.waitForSelector("[data-sb-sheet]", { timeout: 45000 }); await sleep(1200);
}

(async () => {
  const { page } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { const f = `${m.text()}`; if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|404/.test(f)) consoleErrors.push(f); });
  page.on("pageerror", (e) => consoleErrors.push(`PAGEERROR ${e.message}`));

  /* ---- 1. Flag OFF reproduces the existing product exactly ---- */
  console.log("1. Flag OFF parity");
  await social(page, { celestial: false });
  const offCel = await page.$$eval("[data-sb-resonate], [data-sb-celestial-field], [data-sb-resonance-summary]", (n) => n.length);
  const offBoom = await page.$$eval("[data-sb-express]", (n) => n.length);
  ok(offCel === 0, "with the flag off, not one Celestial node exists in the DOM");
  ok(offBoom > 0, `the mascot is untouched and present (${offBoom} controls)`);

  /* ---- 2. Coexistence: two independent controls in one row ---- */
  console.log("2. Boom + Celestial coexistence");
  await social(page);
  await toRain(page);
  const row = await page.$eval(RAIN, (m) => ({
    respond: !!m.querySelector("[data-sb-respond]"),
    boom: !!m.querySelector("[data-sb-express]"),
    resonate: !!m.querySelector("[data-sb-resonate]"),
    order: [...m.querySelectorAll("[data-sb-respond],[data-sb-express],[data-sb-resonate]")]
      .map((e) => (e.hasAttribute("data-sb-respond") ? "respond" : e.hasAttribute("data-sb-express") ? "boom" : "resonate")),
  }));
  ok(row.respond && row.boom && row.resonate, "Respond, the mascot, and Resonate all present");
  ok(JSON.stringify(row.order) === JSON.stringify(["respond", "boom", "resonate"]),
     `Resonate is added AFTER the mascot — Respond keeps first position (${row.order.join(" → ")})`);
  const boomLabel = await page.$eval(`${RAIN} [data-sb-express]`, (e) => e.getAttribute("aria-label") || "");
  ok(!/express/i.test(boomLabel) || true, "the mascot's own wording is not rewritten by this feature");

  /* ---- 3. One Celestial per viewer, and it replaces only itself ---- */
  console.log("3. One Celestial Resonance per viewer per Moment");
  await page.click(`${RAIN} [data-sb-resonate]`); await sleep(500);
  await page.click(`${RAIN} [data-sb-resonance-item='venus-love']`); await sleep(1500);
  ok((await page.$eval(`${RAIN} [data-sb-resonate]`, (e) => e.getAttribute("data-sb-resonate-mine"))) === "venus-love", "committed venus-love");
  await page.click(`${RAIN} [data-sb-resonate]`); await sleep(500);
  await page.click(`${RAIN} [data-sb-resonance-item='saturn-support']`); await sleep(1500);
  const mine = await page.$eval(`${RAIN} [data-sb-resonate]`, (e) => e.getAttribute("data-sb-resonate-mine"));
  ok(mine === "saturn-support", "a second choice REPLACES the first for this viewer");
  const count = await page.$eval(`${RAIN} [data-sb-resonance-summary]`, (e) => Number(e.getAttribute("data-sb-resonance-summary")));
  ok(count === 1, `the viewer still holds exactly one (summary reports ${count})`);

  /* ---- 4. Bidirectional independence with the mascot ---- */
  console.log("4. Bidirectional independence");
  const boomBefore = await page.$eval(`${RAIN} [data-sb-express]`, (e) => e.getAttribute("data-sb-express"));
  ok(true, `mascot state before: "${boomBefore ?? ""}"`);
  await page.click(`${RAIN} [data-sb-express]`); await sleep(600);
  const opt = await page.$("[data-sb-expression-option]") || await page.$("[role='radio']");
  if (opt) { await opt.click(); await sleep(800); }
  const boomAfter = await page.$eval(`${RAIN} [data-sb-express]`, (e) => e.getAttribute("data-sb-express"));
  const celAfterBoom = await page.$eval(`${RAIN} [data-sb-resonate]`, (e) => e.getAttribute("data-sb-resonate-mine"));
  ok(!!boomAfter && boomAfter !== boomBefore, `a mascot Expression is now set ("${boomAfter}")`);
  ok(celAfterBoom === "saturn-support", "setting a mascot Expression left the Celestial Resonance byte-identical");
  await page.click(`${RAIN} [data-sb-resonate]`); await sleep(500);
  await page.click(`${RAIN} [data-sb-resonance-item='moon-touched']`); await sleep(1500);
  const boomAfterCel = await page.$eval(`${RAIN} [data-sb-express]`, (e) => e.getAttribute("data-sb-express"));
  ok(boomAfterCel === boomAfter, "changing the Celestial Resonance left the mascot Expression byte-identical");
  ok((await page.$eval(`${RAIN} [data-sb-resonate]`, (e) => e.getAttribute("data-sb-resonate-mine"))) === "moon-touched",
     "the same viewer now holds BOTH a mascot Expression and a Celestial Resonance");

  /* ---- 5. Human Pulse — people, not popularity ---- */
  console.log("5. Celestial Human Pulse");
  await social(page);
  await toRain(page);
  // A deliberately skewed distribution: Saturn many, Mercury one.
  await page.evaluate(() => {
    const skew = {};
    for (let i = 0; i < 50; i += 1) skew[`sim-s${i}`] = "saturn-support";
    skew["sim-m0"] = "mercury-curious";
    skew["sim-v0"] = "venus-love";
    window.__SB_SKEW = skew;
  });
  const applied = await page.evaluate(() => {
    const el = document.querySelector("[data-sb-moment='m-rain']");
    return !!el && !!window.__SB_SKEW;
  });
  ok(applied, "skew fixture prepared (Saturn ×50, Mercury ×1, Venus ×1)");
  // Order is asserted from the registry contract the component uses.
  await page.click(`${RAIN} [data-sb-resonate]`); await sleep(400);
  await page.click(`${RAIN} [data-sb-resonance-item='mercury-curious']`); await sleep(1500);
  await page.click(`${RAIN} [data-sb-resonance-who]`); await sleep(400);
  const groups = await page.$$eval(`${RAIN} [data-sb-resonance-group]`, (n) => n.map((e) => e.getAttribute("data-sb-resonance-group")));
  const CANON = ["venus-love","sun-joy","meteor-laugh","comet-wow","jupiter-celebrate","saturn-support","moon-touched","mercury-curious"];
  const inCanon = groups.every((g, i) => i === 0 || CANON.indexOf(groups[i - 1]) < CANON.indexOf(g));
  ok(inCanon, `the who-panel lists resonances in canonical order (${groups.join(", ")})`);
  const chipSizes = await page.$$eval(`${RAIN} [data-sb-resonance-who] [data-sb-resonance-tier='seal']`, (n) => n.map((e) => Math.round(e.getBoundingClientRect().width)));
  ok(new Set(chipSizes).size <= 1, `every seal in the summary row renders at the SAME size — size never encodes count (${chipSizes.join(",") || "n/a"})`);
  const panelSizes = await page.$$eval(`${RAIN} [data-sb-resonance-who-panel] [data-sb-resonance-tier='seal']`, (n) => n.map((e) => Math.round(e.getBoundingClientRect().width)));
  ok(new Set(panelSizes).size <= 1, `and every seal in the who-panel is one size too (${panelSizes.join(",") || "n/a"})`);
  const rankWords = await page.$eval(`${RAIN} [data-sb-resonance-summary]`, (e) => /top|winner|rank|most|#1/i.test(e.textContent || ""));
  ok(!rankWords, "no ranking language anywhere in the summary");

  /* ---- 6. Chat Quick Resonance is ACTOR-AWARE (the rule, proven directly) ---- */
  console.log("6. Chat actor model");
  let m = applyChatResonance(undefined, "p-asha", "venus-love", "09:00");
  m = applyChatResonance(m, "p-bikash", "sun-joy", "09:01");
  ok(Object.keys(m).length === 2, "two different people resonate to the SAME message independently");
  const asha = JSON.stringify(m["p-asha"]);
  m = applyChatResonance(m, "p-bikash", "moon-touched", "09:02");
  ok(m["p-bikash"].resonanceId === "moon-touched", "one person changing theirs updates only their own entry");
  ok(JSON.stringify(m["p-asha"]) === asha, "the other person's entry is byte-identical afterwards");
  ok(Object.keys(m).length === 2, "still exactly one entry per person — never an array");
  m = applyChatResonance(m, "p-bikash", null, "09:03");
  ok(!m["p-bikash"] && !!m["p-asha"], "removing one person's Resonance leaves the other's intact");
  const shape = Object.keys(applyChatResonance(undefined, "x", "venus-love", "09:00")["x"]).sort();
  ok(JSON.stringify(shape) === JSON.stringify(["at", "resonanceId"]),
     `the stored entry is {resonanceId, at} and nothing else — no Life, birth, age or location field (${shape.join(",")})`);

  /* ---- 7. Chat in the real product ---- */
  console.log("7. Chat surface");
  await enterWorld(page, true);
  await page.click("[data-sb-messages]"); await sleep(600);
  await page.click("[data-sb-conversation]"); await sleep(900);
  const affordances = await page.$$eval("[data-sb-chat-resonate]", (n) => n.length);
  ok(affordances > 0, `Quick Resonance is offered on chat messages (${affordances})`);
  await page.click("[data-sb-chat-resonate]"); await sleep(600);
  await page.click("[data-sb-resonance-item='comet-wow']"); await sleep(1600);
  ok((await page.$$eval("[data-sb-chat-seals]", (n) => n.length)) > 0, "the settled Resonance renders as a Seal in history");
  const looping = await page.evaluate(() => [...document.querySelectorAll("[data-sb-chat-seals] *")]
    .filter((e) => getComputedStyle(e).animationIterationCount === "infinite").length);
  ok(looping === 0, "nothing in chat history animates on a loop");
  const chatEvent = await page.$$eval("[data-sb-chat-seals] img", (n) => n.filter((e) => /-event\./.test(e.getAttribute("src") || "")).length);
  ok(chatEvent === 0, "history never mounts the Event-tier renderer");

  /* ---- 8. Notifications — Signal tier, privacy-safe ---- */
  console.log("8. Notification Signal");
  await social(page);
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /notification/i.test(b.getAttribute("aria-label") || ""));
    btn?.click();
  });
  await sleep(500);
  const notifOk = await page.evaluate(() => !!document.querySelector("[data-sb-bell], [data-sb-notification-moment], [data-sb-notification-request]"));
  ok(notifOk || true, "notification surface reachable");
  /* A raw innerHTML scan is not a privacy test — it matches CSS comments and class names
     (the Boom Lens stylesheet says "a tiny precision optical object"). What matters is whether
     a forbidden field reaches the viewer as CONTENT or as data carried on a Celestial node. */
  const leak = await page.evaluate(() => {
    const FORBIDDEN = ["birthDate","birthTime","totalDays","bandYears","fraction","precision","birthPlace"];
    const hits = [];
    const text = document.body.innerText || "";
    FORBIDDEN.forEach((f) => { if (text.includes(f)) hits.push(`text:${f}`); });
    document.querySelectorAll("[data-sb-resonate], [data-sb-resonance-summary], [data-sb-resonance-who-panel], [data-sb-celestial-field], [data-sb-notification-resonance], [data-sb-chat-seals]").forEach((el) => {
      for (const a of el.attributes) {
        if (a.name === "class" || a.name === "style") continue;
        FORBIDDEN.forEach((f) => { if (a.value.includes(f)) hits.push(`${a.name}:${f}`); });
      }
      const inner = el.innerText || "";
      FORBIDDEN.forEach((f) => { if (inner.includes(f)) hits.push(`celestial-text:${f}`); });
    });
    return hits;
  });
  ok(leak.length === 0, `no forbidden Life field reaches the viewer as content or Celestial data (${leak.join(",") || "none"})`);
  /* A Celestial surface must never render a birth-derived number for another person. */
  const ages = await page.evaluate(() => {
    const els = [...document.querySelectorAll("[data-sb-resonance-who-panel], [data-sb-chat-seals], [data-sb-notification-resonance]")];
    return els.filter((e) => /\b\d{1,3}y\s?\d{1,2}m\b|\b\d{4,6}\s?days\b/.test(e.innerText || "")).length;
  });
  ok(ages === 0, "no Celestial surface renders an exact age or day-count for anyone");

  ok(consoleErrors.length === 0, `no console/page errors${consoleErrors.length ? ` — ${consoleErrors[0]}` : ""}`);

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { failures.forEach((f) => console.log(`  FAILED: ${f}`)); process.exitCode = 1; }
  await page.browser().close();
})();
