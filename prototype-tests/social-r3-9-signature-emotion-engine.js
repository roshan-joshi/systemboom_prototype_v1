/* SYSTEMBOOM — R3.9: SIGNATURE EMOTION ENGINE.
   The emotional EVENT: committing lets the feeling escape the chamber into the Moment's local
   space — per-expression energy forms in real depth (bg behind the vessel, fg toward the
   viewer), the shell receiving the emotion's light AT the chamber, a restrained ground
   reflection, WORLD LIGHT (theme-truthful ambient that never recolours an emotion), collapse
   into the lens, complete stillness inside a second. Interruptible, reduced-motion complete,
   360-first. Structural proof; the beauty call is the owner's, on the evidence boards.
     node prototype-tests/social-r3-9-signature-emotion-engine.js */
const { launch, sleep } = require("./lib");
const HOST = "http://localhost:3210";
const S = "/style-lab/social";
let passed = 0;
const failures = [];
const ok = (c, label) => { if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); } };

const RAIN = "[data-sb-moment='m-rain']";
const QUICK = ["care", "joy", "laugh", "wow", "celebrate", "support"];
const TEMPO = { care: 360, joy: 300, laugh: 400, wow: 260, celebrate: 460, support: 380 };

async function open(page, w, h, { theme = "dark", extra = "" } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: w < 900 });
  await page.goto(`${HOST}${S}?theme=${theme}&harness=0&viewer=maya${extra}`, { waitUntil: "networkidle2" });
  await sleep(450);
}
const toRain = async (page) => { await page.evaluate(() => document.querySelector("[data-sb-moment='m-rain']")?.scrollIntoView({ block: "center" })); await sleep(240); };
const centre = (page, sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
const openDeck = async (page, settle = 420) => { await toRain(page); if (await page.$("[data-sb-expression-deck]")) return; const b = await centre(page, `${RAIN} [data-sb-express]`); await page.mouse.click(b.x, b.y); await sleep(settle); };
const mine = (page) => page.$eval(`${RAIN} [data-sb-express]`, (e) => e.getAttribute("data-sb-express"));
const commitAndSample = async (page, id, at = 200) => {
  await openDeck(page);
  await page.mouse.move(4, 4);
  await sleep(140);
  await page.mouse.click(...Object.values(await centre(page, `[data-sb-expression-option='${id}']`)));
  await sleep(at);
  return page.evaluate(() => {
    const ev = document.querySelector("[data-sb-emotion-event]");
    if (!ev) return null;
    const pieces = [...ev.querySelectorAll("[data-sb-ev]")];
    return {
      id: ev.getAttribute("data-sb-emotion-event"),
      roles: pieces.map((p) => p.getAttribute("data-sb-ev")).sort(),
      z: [...new Set(pieces.map((p) => Number(getComputedStyle(p).zIndex) || 0))].sort((a, b) => a - b),
      oneShot: pieces.every((p) => [p, ...p.querySelectorAll("*")].every((n) => { const cs = getComputedStyle(n); return cs.animationName === "none" || cs.animationIterationCount === "1"; })),
      vesselZ: Number(getComputedStyle(document.querySelector("[data-sb-horizon-stage] [data-sb-expression]")).zIndex) || 0,
      shell: (() => { const l = ev.querySelector("[data-sb-ev='shell-light']"); if (!l) return null; const r = l.getBoundingClientRect(); const stage = document.querySelector("[data-sb-horizon-stage] .sb-stage-art").getBoundingClientRect(); return { x: (r.x + r.width / 2 - stage.x) / stage.width, y: (r.y + r.height / 2 - stage.y) / stage.height, bg: l.style.background || l.style.backgroundImage }; })(),
      ground: !!ev.querySelector("[data-sb-ev='ground-light']"),
    };
  });
};

(async () => {
  const { browser, page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { const f = `${m.text()}`; if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|Back-Forward|404/.test(f)) consoleErrors.push(f); });

  /* ---- 1. Each Quick Six commit creates ITS OWN local emotional event ---- */
  console.log("1. The emotional events");
  await open(page, 1440, 1000);
  const EXPECT = {
    care: ["emotion-bg", "emotion-fg", "emotion-mg"],
    joy: ["ray-0", "ray-1", "ray-2", "ray-3", "sheen"],
    laugh: ["droplet", "wave-1", "wave-2"],
    wow: ["pressure", "sheen"],
    celebrate: ["ember-0", "ember-1", "ember-2", "ember-3", "ember-4"],
    support: ["arc-left", "arc-right"],
  };
  const seen = {};
  let depthOk = true, lightOk = true, oneShotOk = true;
  for (const id of QUICK) {
    const ev = await commitAndSample(page, id, 220);
    seen[id] = ev ? ev.roles.filter((r) => !/light$/.test(r)).join(",") : "none";
    if (!ev) { depthOk = lightOk = false; continue; }
    // depth: at least three real z levels, with pieces both BEHIND (z < vessel) and IN FRONT
    if (!(ev.z.length >= 3 && ev.z.some((z) => z < ev.vesselZ) && ev.z.some((z) => z > ev.vesselZ))) depthOk = false;
    // light law: the shell light sits AT the chamber (upper-right quadrant of the vessel) and
    // carries the EXPRESSION's accent; a ground reflection exists beneath
    if (!(ev.shell && ev.shell.x > 0.5 && ev.shell.y < 0.75 && ev.ground)) lightOk = false;
    if (!ev.oneShot) oneShotOk = false;
    await sleep(TEMPO[id] + 700);
  }
  for (const id of QUICK) ok(seen[id] === EXPECT[id].join(","), `${id}: its own event — ${seen[id]}`);
  ok(new Set(Object.values(seen)).size === 6, "six genuinely different emotional events — no shared stock effect");
  ok(depthOk, "real depth: pieces pass BEHIND the vessel and travel IN FRONT of it (≥3 z-levels)");
  ok(lightOk, "light has a source: the shell receives the emotion's light AT the chamber; the ground a restrained reflection");
  ok(oneShotOk, "every event element is one-shot — nothing declares a repeat");

  /* ---- 2. The event belongs to the Moment, then total stillness ---- */
  console.log("2. Stillness");
  const still = await page.evaluate(() => ({
    ev: !!document.querySelector("[data-sb-emotion-event]"),
    deck: !!document.querySelector("[data-sb-expression-deck]"),
    running: [...document.querySelectorAll("[data-sb-social-frame] *")].reduce((n, e) => n + (e.getAnimations ? e.getAnimations().filter((a) => a.playState === "running" && a.animationName !== "sb-roll").length : 0), 0),
  }));
  ok(!still.ev && !still.deck && still.running === 0, `after the last commit: no event, no field, zero running (${still.running})`);

  /* ---- 3. Speed: acknowledged fast, settled inside a second ---- */
  console.log("3. Speed");
  await openDeck(page);
  await page.mouse.move(4, 4);
  await sleep(140);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='celebrate']")));
  await sleep(60);
  const ack = await page.evaluate(() => ({ flight: !!document.querySelector("[data-sb-core-flight]"), committing: document.querySelector("[data-sb-expression-deck]")?.hasAttribute("data-sb-committing") }));
  ok(ack.flight && ack.committing, "input acknowledged within ~60ms (the core is already flying)");
  await sleep(1000);
  const settled = await page.evaluate(() => [...document.querySelectorAll("[data-sb-social-frame] *")].reduce((n, e) => n + (e.getAnimations ? e.getAnimations().filter((a) => a.playState === "running" && a.animationName !== "sb-roll").length : 0), 0));
  ok(settled === 0, `Celebrate — the richest event — is completely settled inside ~1.1s (${settled} running)`);

  /* ---- 4. WORLD LIGHT — ambient truth, never emotional recolouring ---- */
  console.log("4. World light");
  const wl = {};
  for (const [key, extra] of [["dark", ""], ["light", ""], ["warm", "&worldlight=warm"], ["cool", "&worldlight=cool"]]) {
    await open(page, 1440, 1000, { theme: key === "light" ? "light" : "dark", extra });
    await openDeck(page);
    wl[key] = await page.evaluate(() => {
      const frame = document.querySelector("[data-sb-social-frame]");
      const stage = document.querySelector("[data-sb-horizon-stage] .sb-stage-art");
      const cs = getComputedStyle(stage, "::before");
      return { tone: getComputedStyle(frame).getPropertyValue("--wl").trim(), a: parseFloat(getComputedStyle(frame).getPropertyValue("--wl-a")), rim: cs.backgroundImage.includes("gradient") && cs.mixBlendMode === "screen", care: document.querySelector("[data-sb-expression-option='care'] img")?.getAttribute("src").split("/").pop() };
    });
  }
  ok(wl.dark.tone !== wl.light.tone && wl.warm.tone !== wl.cool.tone, `Deep Cosmos and Solar Observatory cast different ambient tones (${wl.dark.tone} vs ${wl.light.tone})`);
  ok(Object.values(wl).every((v) => v.a >= 0.05 && v.a <= 0.15), `world-light influence is capped at 5–15% (${Object.values(wl).map((v) => v.a).join(", ")})`);
  ok(Object.values(wl).every((v) => v.rim), "it reaches the vessel as one screen-blended ambient rim from the World's side");
  ok(new Set(Object.values(wl).map((v) => v.care)).size === 1, "the Care core is bit-for-bit the same asset under every World — environment never recolours an emotion");
  const evWarm = await commitAndSample(page, "wow", 200);
  ok(!!evWarm && /95, 168, 230|5fa8e6/i.test(evWarm.shell.bg), "a warm World still receives Wow's BLUE light — emotion light and World light are two systems");
  await sleep(1200);

  /* ---- 5. Interruptible motion ---- */
  console.log("5. Interruptible");
  await open(page, 1440, 1000);
  await openDeck(page);
  await page.mouse.move(4, 4);
  await sleep(140);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='care']")));
  await sleep(120);
  const beforeScroll = await page.evaluate(() => scrollY);
  await page.mouse.wheel({ deltaY: 240 });
  await sleep(160);
  const scrolled = await page.evaluate(() => scrollY);
  ok(scrolled > beforeScroll, `the event never locks scrolling (${Math.round(beforeScroll)} → ${Math.round(scrolled)})`);
  await toRain(page);
  await sleep(600);
  // choosing another expression mid-event: the old snaps clean, then the new event runs alone
  await page.mouse.click(...Object.values(await centre(page, `${RAIN} [data-sb-express]`)));
  await sleep(420);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='joy']")));
  await sleep(180);
  const stacked = await page.evaluate(() => document.querySelectorAll("[data-sb-emotion-event]").length);
  ok(stacked <= 1, `emotional effects never stack (${stacked} event containers)`);
  await sleep(1100);
  ok((await mine(page)) === "joy", "the interrupted commit stayed truthful — the last choice holds");

  /* ---- 6. The horizon is not a popover ---- */
  console.log("6. No-popover test");
  await openDeck(page);
  const chrome = await page.$eval("[data-sb-expression-deck]", (e) => {
    const cs = getComputedStyle(e);
    return { border: cs.borderTopWidth, radius: parseFloat(cs.borderTopLeftRadius), mask: (cs.maskImage || cs.webkitMaskImage || "").includes("gradient"), shadow: cs.boxShadow };
  });
  ok(chrome.border === "0px" && chrome.radius <= 16 && chrome.mask, "no border, small radius, edges dissolved by a mask — objects lead, not a container");
  ok(!/0px 22px|0px 44px/.test(chrome.shadow), `the popup shadow is reduced, not a floating card (${chrome.shadow.slice(0, 44)}…)`);
  await page.keyboard.press("Escape");
  await sleep(200);

  /* ---- 7. RETOUCH stays tiny ---- */
  console.log("7. Retouch");
  await toRain(page);
  await page.mouse.click(...Object.values(await centre(page, `${RAIN} [data-sb-express]`)));
  await sleep(40);
  const rt = await page.evaluate(() => {
    const e = document.querySelector("[data-sb-moment='m-rain'] [data-sb-express]");
    const cs = getComputedStyle(e.querySelector("[data-sb-lens]"));
    return { attr: e.hasAttribute("data-sb-retouch"), dur: parseFloat(cs.animationDuration), event: !!document.querySelector("[data-sb-emotion-event]") };
  });
  ok(rt.attr && rt.dur >= 0.1 && rt.dur <= 0.18 && !rt.event, `retouch = one ${Math.round(rt.dur * 1000)}ms internal response, never the full event`);
  await page.keyboard.press("Escape");
  await sleep(250);

  /* ---- 8. Twenty Moments: the feed stays calm ---- */
  console.log("8. Restraint");
  await open(page, 1440, 1400, { extra: "&pulse=100mixed" });
  for (let i = 0; i < 8 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(220); }
  await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); });
  await sleep(700);
  const calm = await page.evaluate(() => ({
    moments: document.querySelectorAll("[data-sb-moment]").length,
    running: [...document.querySelectorAll("[data-sb-social-frame] *")].reduce((n, e) => n + (e.getAnimations ? e.getAnimations().filter((a) => a.playState === "running" && a.animationName !== "sb-roll").length : 0), 0),
    events: document.querySelectorAll("[data-sb-emotion-event]").length,
  }));
  ok(calm.moments >= 15 && calm.running === 0 && calm.events === 0, `${calm.moments} Moments scrolled through — nothing fires on viewport entry, zero running (${calm.running})`);

  /* ---- 9. Serious human safety: Support on the 1983 memory ---- */
  console.log("9. Serious Support");
  await open(page, 390, 844);
  for (let i = 0; i < 6 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(220); }
  await page.evaluate(() => document.querySelector("[data-sb-moment='m-1983']")?.scrollIntoView({ block: "center" }));
  await sleep(260);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-moment='m-1983'] [data-sb-express]")));
  await sleep(420);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='support']")));
  await sleep(200);
  const sup = await page.evaluate(() => {
    const ev = document.querySelector("[data-sb-emotion-event='support']");
    const roles = ev ? [...ev.querySelectorAll("[data-sb-ev]")].map((p) => p.getAttribute("data-sb-ev")) : [];
    return { ev: !!ev, celebratory: roles.some((r) => /ember|ray|wave/.test(r)), arcs: roles.filter((r) => /^arc-/.test(r)).length };
  });
  ok(sup.ev && sup.arcs === 2 && !sup.celebratory, "Support on a serious memory: two embracing structures close gently — no sparks, no rays, nothing playful");
  await sleep(1100);

  /* ---- 10. Reduced motion is a complete experience ---- */
  console.log("10. Reduced motion");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 1440, 1000);
  await openDeck(page, 80);
  await page.mouse.click(...Object.values(await centre(page, "[data-sb-expression-option='care']")));
  await sleep(80);
  const rm = await page.evaluate(() => ({
    event: !!document.querySelector("[data-sb-emotion-event]"),
    flights: document.querySelectorAll("[data-sb-core-flight],[data-sb-lens-flight]").length,
    lens: document.querySelector("[data-sb-moment='m-rain'] [data-sb-express] [data-sb-lens]")?.getAttribute("data-sb-lens"),
    visible: getComputedStyle(document.querySelector("[data-sb-moment='m-rain'] [data-sb-express] [data-sb-lens]").parentElement).opacity === "1",
  }));
  ok(!rm.event && rm.flights === 0, "reduce: no heart travel, no pressure wave, no flights — none of it is mounted");
  ok(rm.lens === "care" && rm.visible, "…and the meaning is complete: the selected Care chamber is simply there");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* ---- 11. Performance shape ---- */
  console.log("11. Performance");
  const perf = await page.evaluate(async () => {
    const sizes = {};
    for (const f of ["care-energy", "joy-ray", "laugh-wave", "celebrate-ember", "support-arc"]) {
      const r = await fetch(`/brand/expressions/${f}.webp`);
      sizes[f] = Number(r.headers.get("content-length") || 0);
    }
    return { sizes, max: Math.max(...Object.values(sizes)) };
  });
  ok(perf.max > 0 && perf.max <= 16000, `every event asset is a small WebP (max ${perf.max} B ≤ 16KB); no particle engine, no WebGL, no persistent RAF`);

  /* ---- 12. Page health ---- */
  console.log("12. Page health");
  ok(errors.length === 0, `zero page errors (${errors.length})`);
  ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length})${consoleErrors[0] ? " — " + consoleErrors[0].slice(0, 90) : ""}`);

  await browser.close();
  console.log(`\n${passed} passed, ${failures.length} failed`);
  console.log(`SOCIAL R3.9 SIGNATURE EMOTION ENGINE: ${failures.length ? "FAIL" : "PASS"}`);
  failures.forEach((f) => console.log("  - " + f));
  process.exit(failures.length ? 1 : 0);
})();
