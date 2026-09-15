/* SYSTEMBOOM — S6 MOTION SYSTEM + CARRYOVER GRAMMAR.
   Semantic outcomes, not pixels: one transient-surface language, every
   animation ends in the right state, reduced motion is complete, nothing loops,
   the Life Ring never animates as a spinner, focus returns, Escape peels one
   layer, and the corrected Composer / People grammar holds at every width.
     node prototype-tests/s6-motion.js */
const { launch, sleep } = require("./lib");
const HOST = "http://localhost:3210";
const S = "/style-lab/social";
let passed = 0; const failures = [];
const ok = (c, label) => { if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); } };
async function open(page, w, h, { theme = "light", viewer = "maya", lang = "en", extra = {} } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: w < 700 });
  await page.setCookie({ name: "sb-locale", value: lang, domain: "localhost", path: "/" });
  const u = new URL(HOST + S); u.searchParams.set("theme", theme); u.searchParams.set("harness", "0"); u.searchParams.set("lang", lang); u.searchParams.set("viewer", viewer);
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, String(v));
  await page.goto(u.toString(), { waitUntil: "networkidle2" }); await sleep(550);
}
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const infinite = (page) => page.evaluate(() => [...document.querySelectorAll("*")].filter((e) => { const s = getComputedStyle(e); return s.animationName !== "none" && s.animationIterationCount === "infinite"; }).map((e) => e.tagName + "." + String(e.className).slice(0, 40)));
const ringsAnimating = (page) => page.evaluate(() => [...document.querySelectorAll("[data-sb-ring]")].filter((r) => !r.closest("[data-sb-hero]")).filter((r) => [r, ...r.querySelectorAll("*")].some((e) => getComputedStyle(e).animationName !== "none")).length);

(async () => {
  const { page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { const f = `${m.text()}`; if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|Back-Forward|404/.test(f)) consoleErrors.push(f); });

  /* ---- 1. One transient-surface language ---- */
  console.log("1. One surface family");
  await open(page, 1440, 900);
  const fam = {};
  for (const [btn, sel, key] of [["[data-sb-people]", "[data-sb-surface='people']", "people"], ["[data-sb-bell]", "[data-sb-surface='notifications']", "notifications"], ["[data-sb-messages]", "[data-sb-surface='messages']", "messages"]]) {
    await page.click(btn); await sleep(60);
    fam[key] = await page.$eval(sel, (e) => ({ name: getComputedStyle(e).animationName, dur: parseFloat(getComputedStyle(e).animationDuration) })).catch(() => null);
    await sleep(300);
  }
  await page.focus("input[type=search]"); await sleep(60);
  fam.search = await page.$eval("[data-sb-search-surface]", (e) => ({ name: getComputedStyle(e).animationName, dur: parseFloat(getComputedStyle(e).animationDuration) })).catch(() => null);
  await page.keyboard.press("Escape"); await sleep(200);
  const names = Object.values(fam).map((f) => f?.name);
  ok(names.every((n) => n === "sb-surface-in"), `People, Notifications, Messages and Search results all arrive with the same keyframe (${names.join(", ")})`);
  ok(Object.values(fam).every((f) => f && f.dur >= 0.16 && f.dur <= 0.24), `…in the 160–240ms window (${Object.values(fam).map((f) => f?.dur).join(", ")}s)`);
  await page.click("[data-sb-people]"); await sleep(450);
  const settled = await page.$eval("[data-sb-surface='people']", (e) => ({ opacity: getComputedStyle(e).opacity, transform: getComputedStyle(e).transform }));
  ok(settled.opacity === "1" && (settled.transform === "none" || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(settled.transform)), `a surface is still once it has arrived (${settled.transform})`);

  /* ---- 2. Nothing loops; the Life Ring is an instrument ---- */
  console.log("2. No loops, no ring misuse");
  ok((await infinite(page)).length === 0, `no infinite animation with People open (${(await infinite(page)).join(", ")})`);
  ok((await ringsAnimating(page)) === 0, "no Life Ring animates in People");
  await page.click("[data-sb-bell]"); await sleep(400);
  ok((await ringsAnimating(page)) === 0 && (await infinite(page)).length === 0, "no Life Ring animates in Notifications, nothing loops");
  await page.focus("input[type=search]"); await page.keyboard.type("a"); await sleep(400);
  ok((await ringsAnimating(page)) === 0, "no Life Ring animates in Search results");
  await page.keyboard.press("Escape"); await sleep(200);

  /* ---- 3. Focus enters and returns; Escape peels one layer ---- */
  console.log("3. Focus + Escape");
  await page.evaluate(() => document.querySelector("[data-sb-people]").focus());
  await page.keyboard.press("Enter"); await sleep(350);
  ok(await page.evaluate(() => !!document.activeElement?.closest("[data-sb-surface='people']")), "opening People by keyboard puts focus on the surface");
  await page.keyboard.press("Tab"); await sleep(100);
  ok(await page.evaluate(() => document.activeElement?.hasAttribute("data-sb-people-find")), "Tab reaches the first control inside");
  await page.click("[data-sb-people-yours] [data-sb-people-row] button"); await sleep(400);
  await page.keyboard.press("Escape"); await sleep(350);
  ok(await page.evaluate(() => !document.querySelector("[data-sb-person-card]") && !!document.querySelector("[data-sb-people-panel]")), "Escape closes the Person surface only — People stays");
  await page.keyboard.press("Escape"); await sleep(350);
  ok(await page.evaluate(() => !document.querySelector("[data-sb-people-panel]") && document.activeElement?.hasAttribute("data-sb-people")), "the next Escape closes People and returns focus to its control");
  await page.evaluate(() => document.querySelector("[data-sb-bell]").focus());
  await page.keyboard.press("Enter"); await sleep(350);
  await page.keyboard.press("Escape"); await sleep(350);
  ok(await page.evaluate(() => !document.querySelector("[data-sb-notifications]") && document.activeElement?.hasAttribute("data-sb-bell")), "Notifications: Escape returns focus to the bell");
  await page.click("[data-sb-scrim]").catch(() => {});
  await page.click("[data-sb-people]"); await sleep(300);
  await page.mouse.click(300, 700); await sleep(300);
  ok(!(await page.$("[data-sb-people-panel]")), "touching My World (the scrim) closes the surface");

  /* ---- 4. Relationship motion ends in the right state ---- */
  console.log("4. Relationship final states");
  await page.click("[data-sb-people]"); await sleep(300);
  await page.type("[data-sb-people-find]", "Ramesh"); await sleep(300);
  await page.click("[data-sb-people-add]"); await sleep(350);
  const rel = await page.$eval("[data-sb-people-row]", (e) => ({ rel: e.getAttribute("data-sb-people-rel"), anim: getComputedStyle(e.querySelector("[data-sb-people-requested]")?.parentElement ?? e).animationName, dur: parseFloat(getComputedStyle(e.querySelector("[data-sb-people-requested]")?.parentElement ?? e).animationDuration) }));
  ok(rel.rel === "request-out" && rel.anim === "sb-rel-resolve" && rel.dur <= 0.28, `Add friend → Requested: one ~200ms settle, final state true (${rel.anim} ${rel.dur}s)`);
  await page.evaluate(() => { const i = document.querySelector("[data-sb-people-find]"); i.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, ""); i.dispatchEvent(new Event("input", { bubbles: true })); }); await sleep(250);
  await page.click("[data-sb-people-accept]"); await sleep(350);
  ok(!(await page.$("[data-sb-people-accept]")) && (await page.$$eval("[data-sb-people-yours] [data-sb-people-row]", (n) => n.some((r) => r.getAttribute("data-sb-people-row") === "p-prakash"))), "Accept: pending → connected, and the person now sits among Your people");
  const press = await page.$eval("[data-sb-people-message]", (e) => getComputedStyle(e).transitionDuration);
  ok(/^0\.1[0-5]s/.test(press), `touch/press feedback is immediate (${press})`);
  await page.keyboard.press("Escape");

  /* ---- 5. Composer — memory first, then the coordinate, no boxed form ---- */
  console.log("5. Composer grammar");
  for (const [w, h] of [[360, 800], [1440, 900]]) {
    await open(page, w, h);
    await page.click("[data-sb-open-composer]"); await sleep(450);
    const c = await page.evaluate(() => {
      const ta = document.getElementById("sb-composer-text");
      const ro = document.querySelector("[data-sb-readout-state]");
      const order = ta && ro ? ta.compareDocumentPosition(ro) & Node.DOCUMENT_POSITION_FOLLOWING : 0;
      const boxed = ro ? getComputedStyle(ro).borderTopWidth !== "0px" : true;
      const label = [...document.querySelectorAll("[data-sb-composer] *")].find((e) => e.childNodes.length === 1 && /^Where this sits$/i.test(e.textContent.trim()));
      const kinds = [...document.querySelectorAll("[data-sb-kind-row] button")].map((b) => Math.round(b.getBoundingClientRect().height));
      const words = [...document.querySelectorAll("[data-sb-kind-row] span.text-\\[11px\\]")].map((s) => s.textContent.trim());
      const shell = document.querySelector("[data-sb-composer]");
      return { focused: document.activeElement === ta, order: !!order, boxed, labelHidden: !label || label.className.includes("sr-only"), kinds, words, opacity: getComputedStyle(shell).opacity, hasDate: !!document.querySelector("[data-sb-composer] input[type=date]"), hasPlace: !!document.querySelector("[data-sb-composer] input[list='sb-places']") };
    });
    ok(c.focused && c.order, `${w}: the words come first and hold focus; the coordinate follows`);
    ok(!c.boxed && c.labelHidden, `${w}: the coordinate is a sentence, not a boxed "WHERE THIS SITS" block`);
    ok(c.hasDate && c.hasPlace, `${w}: the date and place instruments are still real and present`);
    ok(c.kinds.length === 7 && c.kinds.every((k) => k <= 36) && c.words.join(",") === "media,meal,activity,problem,health,project,meeting", `${w}: seven quiet kind chips (≤36px), every word intact (${c.kinds.join("/")})`);
    ok(c.opacity === "1", `${w}: the composer has arrived (opacity 1)`);
    await page.click("[data-sb-composer] button[aria-label='Meal']"); await sleep(100);
    const reveal = await page.$eval("[data-sb-kind-fields='meal']", (e) => ({ name: getComputedStyle(e).animationName, dur: parseFloat(getComputedStyle(e).animationDuration) }));
    ok(reveal.name === "sb-reveal" && reveal.dur <= 0.2, `${w}: kind fields reveal as one measured group (${reveal.name} ${reveal.dur}s)`);
    await page.keyboard.press("Escape"); await sleep(300);
  }

  /* ---- 6. People — human first ---- */
  console.log("6. People grammar");
  await open(page, 360, 800);
  await page.click("[data-sb-people]"); await sleep(400);
  const pg = await page.evaluate(() => {
    const req = document.querySelector("[data-sb-people-requests] [data-sb-people-row]");
    const row = document.querySelector("[data-sb-people-yours] [data-sb-people-row]");
    const size = (r) => Math.round(r?.querySelector("[data-sb-ring]")?.getBoundingClientRect().width ?? 0);
    const msg = row?.querySelector("[data-sb-people-message]");
    return { reqRing: size(req), rowRing: size(row), pills: [...document.querySelectorAll("[data-sb-people-message]")].filter((b) => getComputedStyle(b).borderTopWidth !== "0px").length, msgHasWord: /Message/.test(msg?.textContent ?? ""), msgHasGlyph: !!msg?.querySelector("svg"), findBoxed: getComputedStyle(document.querySelector("[data-sb-people-find]").closest("label")).borderRadius };
  });
  ok(pg.reqRing >= 44 && pg.rowRing >= 36 && pg.reqRing > pg.rowRing, `the face + Life Ring lead every row; a person asking to connect has more presence (${pg.reqRing}px vs ${pg.rowRing}px)`);
  ok(pg.pills === 0 && pg.msgHasWord && pg.msgHasGlyph, "Message is a quiet glyph + word on Your people — not a pill column, not hidden");
  ok(pg.findBoxed === "0px", "Find someone is an underline, not a search box");
  ok(await noHScroll(page), "360: People has no horizontal overflow");

  /* ---- 7. Public preview — same World, different viewer ---- */
  console.log("7. Public preview");
  await open(page, 1440, 900);
  await page.evaluate(() => window.scrollTo(0, 120)); await sleep(100);
  // "The page does not travel" = what the reader is looking at stays where it is. The Moments
  // sheet's viewport position is the measure (the Hero itself legitimately changes height as
  // owner controls leave and the preview banner arrives; the browser's scroll anchoring keeps
  // the content below it still — scrollY alone would mis-report that as travel).
  // The person is the anchor: their Life Ring must stay where the reader's eye is while the rows
  // around them change (owner controls leave, the preview banner arrives). Scroll anchoring keeps
  // exactly that stable; scrollY alone would mis-report it as travel.
  const ring0 = await page.$eval("[data-sb-hero] [data-sb-ring]", (e) => Math.round(e.getBoundingClientRect().top));
  await page.click("[data-sb-view-as-public]"); await sleep(350);
  const pv = await page.evaluate(() => ({ perspective: document.querySelector("[data-sb-perspective]")?.getAttribute("data-sb-perspective"), composer: !!document.querySelector("[data-sb-open-composer]"), ring: Math.round(document.querySelector("[data-sb-hero] [data-sb-ring]").getBoundingClientRect().top) }));
  ok(pv.perspective === "public" && !pv.composer && Math.abs(pv.ring - ring0) <= 4, `My view → Public view re-settles in place — the person does not travel (ring top ${ring0} → ${pv.ring})`);

  /* ---- 8. Theme continuity — no reload, surfaces survive ---- */
  console.log("8. Theme continuity");
  await open(page, 1440, 900);
  await page.click("[data-sb-people]"); await sleep(300);
  await page.evaluate(() => document.querySelector("[data-sb-topbar] button[aria-label*='Solar'], [data-sb-topbar] button[aria-label*='Deep'], [data-sb-topbar] button[aria-label*='theme' i]")?.click()); await sleep(300);
  const th = await page.evaluate(() => ({ theme: document.documentElement.getAttribute("data-theme"), panel: !!document.querySelector("[data-sb-people-panel]"), transitions: [...document.querySelectorAll("body, html, .sb-social")].map((e) => getComputedStyle(e).transitionDuration) }));
  ok(th.theme === "dark" && th.panel, `switching theme keeps the open surface and does not reload (${th.theme})`);
  ok(th.transitions.every((t) => t === "0s"), "no global cinematic dark/light crossfade on the page ground");

  /* ---- 9. Reduced motion is complete ---- */
  console.log("9. Reduced motion");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 1440, 900);
  await page.click("[data-sb-people]"); await sleep(80);
  // The global rule sets 0.01ms; computed style reports it in seconds (1e-05s) — parse, don't match strings.
  const rm = await page.$eval("[data-sb-surface='people']", (e) => ({ dur: parseFloat(getComputedStyle(e).animationDuration), opacity: getComputedStyle(e).opacity }));
  ok(rm.dur <= 0.001 && rm.opacity === "1", `a surface arrives instantly, fully present (${rm.dur}s)`);
  await page.click("[data-sb-people-yours] [data-sb-people-row] button"); await sleep(80);
  ok(await page.$eval("[data-sb-person-card] .sb-surface-in", (e) => parseFloat(getComputedStyle(e).animationDuration) <= 0.001 && getComputedStyle(e).opacity === "1"), "the Person surface is complete under reduced motion");
  await page.keyboard.press("Escape"); await page.keyboard.press("Escape"); await sleep(200);
  await page.click("[data-sb-open-composer]"); await sleep(300);
  ok(await page.evaluate(() => document.activeElement?.id === "sb-composer-text" && getComputedStyle(document.querySelector("[data-sb-composer]")).opacity === "1"), "the Composer is complete under reduced motion");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* ---- 10. Device matrix — surfaces open, nothing overflows ---- */
  console.log("10. Device matrix");
  for (const [w, h] of [[360, 800], [375, 812], [390, 844], [393, 852], [412, 915], [430, 932], [844, 390]]) {
    await open(page, w, h);
    await page.click("[data-sb-people]"); await sleep(300);
    const a = await noHScroll(page);
    await page.click("[data-sb-bell]"); await sleep(300);
    const b = await noHScroll(page);
    const inView = await page.evaluate(() => { const r = document.querySelector("[data-sb-notifications]")?.getBoundingClientRect(); return !!r && r.top >= 0 && r.bottom <= window.innerHeight + 1; });
    ok(a && b && inView, `${w}×${h}: People and Notifications open under the bar, within the viewport, no horizontal overflow`);
  }

  /* ---- 10b. Wide desktop — surfaces stay near their invocation point (§85) ---- */
  console.log("10b. Desktop widths");
  for (const w of [1280, 1440, 1920]) {
    await open(page, w, 1000);
    await page.click("[data-sb-people]"); await sleep(300);
    const near = await page.evaluate(() => { const b = document.querySelector("[data-sb-people]").getBoundingClientRect(); const p = document.querySelector("[data-sb-people-panel]").getBoundingClientRect(); return { gap: Math.round(Math.abs(p.right - b.right)), top: Math.round(p.top - b.bottom), width: Math.round(p.width) }; });
    ok(near.gap <= 240 && near.top >= 0 && near.top <= 40 && near.width <= 440, `${w}: People hangs from the bar beside its control, no dashboard expansion (Δright ${near.gap}px, Δtop ${near.top}px, ${near.width}px wide)`);
  }

  /* ---- 10c. Expression — words, responses, emoji as language; no reaction economy ---- */
  console.log("10c. Expression");
  await open(page, 1440, 1000);
  ok(await page.evaluate(() => !document.querySelector("[data-sb-reaction-picker], [aria-label*='React' i], [data-sb-like]") && document.querySelectorAll("[data-sb-moment] [data-sb-respond]").length > 0), "one Respond verb + one Expression control per Moment — no reaction picker, no like economy");
  const EMOJI = "Boudha at dusk 🙏🏽 ☕️ 👨‍👩‍👧 ✨";
  await page.click("[data-sb-open-composer]"); await sleep(400);
  await page.evaluate((v) => { const ta = document.getElementById("sb-composer-text"); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(ta, v); ta.dispatchEvent(new Event("input", { bubbles: true })); }, EMOJI);
  await sleep(150);
  await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] footer button")].find((x) => x.textContent.trim() === "Post")?.click());
  await sleep(1300);
  const posted = await page.evaluate((v) => { const m = document.querySelector("[data-sb-moment^='m-new-']"); return m ? m.textContent.includes(v) : false; }, EMOJI);
  ok(posted, "skin-tone, ZWJ family and multi-codepoint emoji survive posting intact, inside the person's own words");
  await page.evaluate(() => document.querySelector("[data-sb-moment^='m-new-'] [data-sb-express]")?.click()); await sleep(300);
  await page.evaluate(() => document.querySelector("[data-sb-expression-option='care']")?.click()); await sleep(400);
  ok(await page.$eval("[data-sb-moment^='m-new-'] [data-sb-express]", (b) => b.getAttribute("data-sb-express") === "care"), "expressing on it is a plain, truthful state change");

  /* ---- 11. Page health ---- */
  console.log("11. Page health");
  await open(page, 1440, 900);
  ok(errors.length === 0, `zero page errors (${errors.length})`);
  ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length})${consoleErrors[0] ? " — " + consoleErrors[0].slice(0, 80) : ""}`);

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log("S6 MOTION: FAIL"); failures.forEach((f) => console.log("  - " + f)); }
  else console.log("S6 MOTION: PASS");
  process.exit(failures.length ? 1 : 0);
})();
