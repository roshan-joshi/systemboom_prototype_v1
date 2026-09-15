/* SYSTEMBOOM — S7 DEVICE MASTERY.
   Outcome checks, never pixel-perfect assertions: the phone matrix (320–430 +
   landscape) stays overflow-free with every essential utility live, first-Moment
   budgets hold, keyboard-short heights keep field/results/actions visible,
   tablet recomposes (Moments before the Circle module, anchored surfaces),
   desktop surfaces stay attached to their triggers at 1024–1920, touch targets
   reach 44px on phone, scroll has one owner per surface, safe-area hooks exist,
   200% survives structurally, languages stress-fit, reduced motion is complete.
     node prototype-tests/s7-device-mastery.js */
const { launch, sleep } = require("./lib");
const HOST = "http://localhost:3210";
const S = "/style-lab/social";
let passed = 0; const failures = [];
const ok = (c, label) => { if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); } };
async function open(page, w, h, { theme = "light", viewer = "maya", lang = "en", extra = {} } = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: w < 900 });
  await page.setCookie({ name: "sb-locale", value: lang, domain: "localhost", path: "/" });
  const u = new URL(HOST + S); u.searchParams.set("theme", theme); u.searchParams.set("harness", "0"); u.searchParams.set("lang", lang); u.searchParams.set("viewer", viewer);
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, String(v));
  await page.goto(u.toString(), { waitUntil: "networkidle2" }); await sleep(500);
}
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const ESSENTIALS = ["[data-sb-search-toggle], input[type=search]", "[data-sb-people]", "[data-sb-messages]", "[data-sb-bell]", "button[aria-haspopup=menu]"];
const essentialsVisible = (page) => page.evaluate((sels) => sels.every((s) => [...document.querySelectorAll(s)].some((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right <= window.innerWidth + 1 && r.left >= -1; })), ESSENTIALS);
const firstMoment = (page) => page.evaluate(() => { const el = document.querySelector("[data-sb-moment]"); return el ? Math.round(el.getBoundingClientRect().top + scrollY) : null; });
const barBox = (page) => page.evaluate(() => { const r = document.querySelector("[data-sb-topbar] > div").getBoundingClientRect(); return { h: Math.round(r.height), top: Math.round(r.top) }; });
const typeInto = (page, sel, v) => page.evaluate((s, val) => { const i = document.querySelector(s); i.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, val); i.dispatchEvent(new Event("input", { bubbles: true })); }, sel, v);

(async () => {
  const { page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => { const f = `${m.text()}`; if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|Back-Forward|404/.test(f)) consoleErrors.push(f); });

  /* ---- 1. Phone matrix — overflow-free, essentials live, one-row bar ---- */
  console.log("1. Phone matrix");
  for (const [w, h] of [[320, 640], [360, 800], [375, 812], [390, 844], [393, 852], [412, 915], [430, 932]]) {
    await open(page, w, h);
    const bar = await barBox(page);
    ok((await noHScroll(page)) && (await essentialsVisible(page)) && bar.h <= 64, `${w}×${h}: no overflow, every essential utility visible, one-row bar (${bar.h}px)`);
  }
  await open(page, 320, 640);
  ok((await firstMoment(page)) < 800, `320 survival: Moments begin within 1.25 screens (${await firstMoment(page)}px)`);

  /* ---- 2. First-Moment budgets (S2/S6 guard: owner ≤720, visitor ≤650 at 360×800) ---- */
  console.log("2. First-Moment budgets");
  await open(page, 360, 800);
  const fmOwner = await firstMoment(page);
  ok(fmOwner <= 720, `owner first Moment at 360×800: ${fmOwner}px ≤ 720`);
  await open(page, 360, 800, { viewer: "visitor" });
  const fmVisitor = await firstMoment(page);
  ok(fmVisitor <= 650, `visitor first Moment at 360×800: ${fmVisitor}px ≤ 650`);

  /* ---- 3. Long visitor context — the 40-char fixture name in the bar ---- */
  console.log("3. Long visitor context");
  await open(page, 360, 800, { viewer: "visitor", extra: { profileName: "क Krishna Bahadur Gurung Tamang Magar Rana" } });
  ok((await noHScroll(page)) && (await essentialsVisible(page)), "360 visitor with a 40-char Devanagari-lead name: no overflow, utilities intact");
  await open(page, 320, 640, { viewer: "visitor" });
  ok((await noHScroll(page)) && (await essentialsVisible(page)), "320 visitor: the brand word yields before any utility does");

  /* ---- 4. Phone landscape — height is the constraint ---- */
  console.log("4. Landscape");
  for (const [w, h] of [[640, 360], [844, 390]]) {
    await open(page, w, h);
    const wall = await page.$eval("[data-sb-cover-region]", (e) => Math.round(e.getBoundingClientRect().height));
    ok((await noHScroll(page)) && wall <= 80, `${w}×${h}: no overflow, the World Wall stays a band (${wall}px)`);
  }
  await open(page, 844, 390);
  const land = await page.evaluate(() => ({
    contact: !!document.querySelector("[data-sb-contact]")?.getClientRects().length,
    manage: !!document.querySelector("[data-sb-owner-manage]")?.getClientRects().length,
    fm: Math.round(document.querySelector("[data-sb-moment]").getBoundingClientRect().top + scrollY),
  }));
  ok(!land.contact && land.manage && land.fm <= 700, `short landscape compacts the hero — contact behind Manage profile, Moments by ${land.fm}px`);

  /* ---- 5. Touch targets — 44px primaries on phone, no tiny essentials ---- */
  console.log("5. Touch targets");
  await open(page, 360, 800);
  const respond = await page.$eval("[data-sb-moment] [data-sb-respond]", (e) => Math.round(e.getBoundingClientRect().height));
  ok(respond >= 44, `Respond is a 44px thumb target on phone (${respond}px)`);
  await open(page, 360, 800, { extra: { bell: "1" } });
  const acc = await page.$eval("[data-sb-notif-accept]", (e) => Math.round(e.getBoundingClientRect().height));
  ok(acc >= 44, `notification Accept is 44px on phone (${acc}px)`);
  await open(page, 360, 800);
  await page.click("[data-sb-people]"); await sleep(350);
  const pa = await page.$eval("[data-sb-people-accept]", (e) => Math.round(e.getBoundingClientRect().height));
  ok(pa >= 44, `People Accept is 44px on phone (${pa}px)`);
  const utils = await page.$$eval("[data-sb-topbar] button", (n) => n.filter((e) => e.getClientRects().length).map((e) => Math.round(e.getBoundingClientRect().height)));
  ok(utils.every((x) => x >= 28) && utils.filter((x) => x >= 36).length >= 4, `persistent utilities stay touch-reliable (${utils.join("/")})`);
  await open(page, 1440, 900);
  const respondDesk = await page.$eval("[data-sb-moment] [data-sb-respond]", (e) => Math.round(e.getBoundingClientRect().height));
  ok(respondDesk === 36, `…without inflating desktop (Respond back to ${respondDesk}px at 1440)`);

  /* ---- 6. Keyboard-short heights (virtual keyboard simulation) ---- */
  console.log("6. Virtual keyboard");
  await open(page, 360, 420, { extra: { composer: "1" } }); await sleep(300);
  const kbC = await page.evaluate(() => { const ta = document.getElementById("sb-composer-text"); const post = [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => /Post/.test(b.textContent)); const tr = ta.getBoundingClientRect(); const pr = post.getBoundingClientRect(); return { taVisible: tr.top >= 0 && tr.top < window.innerHeight, postVisible: pr.bottom <= window.innerHeight + 1, focused: document.activeElement === ta }; });
  ok(kbC.taVisible && kbC.postVisible && kbC.focused, "composer at 360×420: the words hold focus and stay visible, Post stays reachable");
  await open(page, 360, 420);
  await page.click("[data-sb-search-toggle]"); await sleep(350);
  const kbS = await page.evaluate(() => { const i = document.querySelector("[data-sb-search-input]"); const sheet = document.querySelector("[data-sb-search-surface] > div"); const back = document.querySelector("[data-sb-search-back]"); return { focused: document.activeElement === i, within: sheet.getBoundingClientRect().bottom <= window.innerHeight + 1, back: back.getBoundingClientRect().top >= 0, scrolls: getComputedStyle(sheet).overflowY === "auto" }; });
  ok(kbS.focused && kbS.within && kbS.back && kbS.scrolls, "search at 360×420: typing immediate, results scroll inside the remaining viewport, Back reachable");
  await open(page, 360, 420);
  await page.click("[data-sb-people]"); await sleep(350);
  const kbP = await page.evaluate(() => { const f = document.querySelector("[data-sb-people-find]"); const panel = document.querySelector("[data-sb-people-panel]"); return { findVisible: f.getBoundingClientRect().top < window.innerHeight, within: panel.getBoundingClientRect().bottom <= window.innerHeight + 1 }; });
  ok(kbP.findVisible && kbP.within, "People at 360×420: Find someone visible, the panel caps to the space under the bar");

  /* ---- 7. Tablet recomposition ---- */
  console.log("7. Tablet");
  for (const [w, h] of [[768, 1024], [820, 1180]]) {
    await open(page, w, h);
    const t = await page.evaluate(() => ({
      fm: Math.round(document.querySelector("[data-sb-moment]").getBoundingClientRect().top + scrollY),
      field: !!document.querySelector("input[type=search]")?.getClientRects().length,
      sheetW: Math.round(document.querySelector("[data-sb-sheet]").getBoundingClientRect().width),
      circleBelow: document.querySelector("[data-sb-sheet]").getBoundingClientRect().top < document.querySelector("[data-sb-circle]").getBoundingClientRect().top,
    }));
    ok(t.fm < 900 && t.field && t.circleBelow, `${w} portrait: Moments come before the Circle module (${t.fm}px), the real search field is present`);
    ok(t.sheetW >= 640 && t.sheetW <= 800, `${w} portrait: one-column feed uses the width as a comfortable measure (${t.sheetW}px)`);
  }
  await open(page, 768, 1024, { extra: { composer: "1" } }); await sleep(400);
  const tc = await page.$eval("[data-sb-composer]", (e) => { const r = e.getBoundingClientRect(); return { w: Math.round(r.width), top: Math.round(r.top), offCentre: Math.round(Math.abs((r.left + r.right) / 2 - window.innerWidth / 2)) }; });
  ok(tc.w <= 560 && tc.w >= 480 && tc.top > 0 && tc.offCentre <= 8, `768: the Composer is a centred capture surface, not a stretched phone sheet (${tc.w}px, off-centre ${tc.offCentre}px)`);
  await open(page, 768, 1024);
  await page.click("[data-sb-people]"); await sleep(350);
  const tp = await page.$eval("[data-sb-people-panel]", (e) => ({ w: Math.round(e.getBoundingClientRect().width), r: Math.round(e.getBoundingClientRect().right) }));
  ok(tp.w <= 440 && tp.r <= 768, `768: People is an anchored panel (${tp.w}px), not a full-width sheet`);
  await open(page, 1024, 768);
  const tl = await page.evaluate(() => ({ aside: !!document.querySelector("aside")?.getClientRects().length, sheetW: Math.round(document.querySelector("[data-sb-sheet]").getBoundingClientRect().width) }));
  ok(tl.aside && tl.sheetW >= 600 && tl.sheetW <= 760, `1024 landscape: the support column returns and the feed keeps a readable measure (${tl.sheetW}px)`);

  /* ---- 8. Desktop matrix — surfaces attached to triggers, no dashboard ---- */
  console.log("8. Desktop");
  for (const w of [1024, 1180, 1280, 1366, 1440, 1600, 1920]) {
    await open(page, w, 900);
    await page.click("[data-sb-bell]"); await sleep(300);
    const d = await page.evaluate(() => { const p = document.querySelector("[data-sb-notifications]").getBoundingClientRect(); const bell = document.querySelector("[data-sb-bell]").getBoundingClientRect(); return { w: Math.round(p.width), on: p.right <= window.innerWidth && p.left >= 0, near: Math.abs(p.right - bell.right) <= 260, top: Math.round(p.top - bell.bottom) }; });
    ok(d.on && d.near && d.w <= 440 && d.top >= 0 && d.top <= 40 && (await noHScroll(page)), `${w}: Notifications stays an anchored ${d.w}px surface beside its trigger`);
  }
  await open(page, 1920, 1080);
  const wide = await page.evaluate(() => ({ main: Math.round(document.querySelector("main").getBoundingClientRect().width), asides: document.querySelectorAll("aside").length, sheetW: Math.round(document.querySelector("[data-sb-sheet]").getBoundingClientRect().width) }));
  ok(wide.main <= 1200 && wide.asides === 1 && wide.sheetW <= 800, `1920: extra space stays atmosphere — one support column, human-scale feed (${wide.sheetW}px)`);

  /* ---- 9. Surface exclusivity + scroll ownership ---- */
  console.log("9. Surfaces");
  await open(page, 360, 800);
  await page.click("[data-sb-search-toggle]"); await sleep(250);
  await page.click("[data-sb-people]"); await sleep(250);
  await page.click("[data-sb-bell]"); await sleep(250);
  const excl = await page.evaluate(() => ({ surfaces: document.querySelectorAll("[data-sb-surface], [data-sb-search-surface]").length, scrims: document.querySelectorAll("[data-sb-scrim]").length }));
  ok(excl.surfaces === 1 && excl.scrims === 1, `Search → People → Notifications: one surface, one scrim (${excl.surfaces}/${excl.scrims})`);
  const owners = await page.evaluate(() => { const sec = document.querySelector("[data-sb-notifications]"); const inner = [...sec.querySelectorAll("*")].filter((e) => /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 4); return { secScrolls: /(auto|scroll)/.test(getComputedStyle(sec).overflowY), inner: inner.length, contain: getComputedStyle(sec).overscrollBehaviorY }; });
  ok(owners.secScrolls && owners.inner === 0 && owners.contain === "contain", "one vertical scroll owner inside Notifications, background chained scroll contained");
  const scrimTouch = await page.$eval("[data-sb-scrim]", (e) => getComputedStyle(e).touchAction);
  ok(scrimTouch === "none", `a touch on the scrim never scrolls the World underneath (touch-action ${scrimTouch})`);

  /* ---- 10. Safe areas + dynamic viewport hooks (structural — simulated, not real-device) ---- */
  console.log("10. Safe areas / dynamic viewport");
  const sa = await page.evaluate(() => ({
    bar: (document.querySelector("[data-sb-topbar]").getAttribute("style") || "").includes("safe-area-inset-top"),
    caps: [...document.querySelectorAll("[data-sb-notifications]")].every((e) => e.className.includes("100dvh") && e.className.includes("safe-area-inset-bottom")),
  }));
  ok(sa.bar && sa.caps, "the bar honours the top inset; surface caps use dvh + the bottom inset (keyboard/browser-chrome safe)");
  await open(page, 360, 800, { extra: { composer: "1" } }); await sleep(250);
  ok(await page.$eval("[data-sb-composer] footer", (e) => e.className.includes("safe-area-inset-bottom")), "the Composer's actions clear the home-indicator region");

  /* ---- 11. 200% / zoom ---- */
  console.log("11. Text scale");
  await open(page, 1440, 1200);
  await page.evaluate(() => { document.body.style.zoom = "2"; }); await sleep(300);
  ok((await noHScroll(page)) && (await essentialsVisible(page)), "desktop 200%: structure survives, no horizontal scroll, no control lost");
  await page.evaluate(() => { document.body.style.zoom = "1"; });
  // Phone 200% reflow-equivalent: WCAG reflow is 320 CSS px — asserted in §1 (320 clean).
  await open(page, 360, 800);
  await page.evaluate(() => { document.body.style.zoom = "1.5"; }); await sleep(300);
  const z = await page.evaluate(() => ({ moment: !!document.querySelector("[data-sb-moment]"), respond: [...document.querySelectorAll("[data-sb-moment] button")].some((b) => /Respond/.test(b.textContent) && b.getBoundingClientRect().height > 0) }));
  ok(z.moment && z.respond, "phone 150%: rows grow, nothing clips away Moments or Respond");
  await page.evaluate(() => { document.body.style.zoom = "1"; });
  const viewportMeta = await page.evaluate(() => document.querySelector("meta[name=viewport]")?.getAttribute("content") ?? "");
  ok(!/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0+)?\b/.test(viewportMeta), `browser zoom is never disabled (${viewportMeta || "no viewport meta"})`);

  /* ---- 12. Language stress on devices ---- */
  console.log("12. Languages on devices");
  await open(page, 360, 800, { lang: "ru", extra: { bell: "1" } });
  ok((await noHScroll(page)) && (await page.$eval("[data-sb-notif-accept]", (e) => e.getBoundingClientRect().height >= 44)), "ru 360: long control labels fit, Accept stays 44px");
  await open(page, 360, 800, { lang: "ne" });
  await page.click("[data-sb-people]"); await sleep(350);
  ok(await noHScroll(page), "ne 360: the People panel holds Devanagari without overflow");
  await open(page, 390, 844, { lang: "zh-Hans", extra: { bell: "1" } });
  const zh = await page.evaluate(() => { const el = [...document.querySelectorAll("[data-sb-notifications] p")].find((p) => /通知/.test(p.textContent)); return { ls: parseFloat(getComputedStyle(el).letterSpacing) || 0, overflow: document.documentElement.scrollWidth > window.innerWidth + 1 }; });
  ok(zh.ls < 1 && !zh.overflow, `zh 390: CJK labels are not letter-spaced (${zh.ls}px)`);
  await open(page, 360, 800, { lang: "es" });
  await page.click("[data-sb-people]"); await sleep(300);
  ok(await noHScroll(page), "es 360: People fits");

  /* ---- 13. Reduced motion on a phone ---- */
  console.log("13. Reduced motion");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, 360, 800);
  await page.click("[data-sb-people]"); await sleep(100);
  ok(await page.$eval("[data-sb-people-panel]", (e) => getComputedStyle(e.closest("[data-sb-surface]")).opacity === "1"), "360 reduced motion: the surface is instantly complete");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  /* ---- 14. No hover requirement at touch sizes ---- */
  console.log("14. No hover");
  await open(page, 360, 800);
  const noHover = await page.evaluate(() => {
    const need = ["[data-sb-people]", "[data-sb-bell]", "[data-sb-messages]", "[data-sb-open-composer]", "[data-sb-view-as-public]", "[data-sb-life-entry]", "[data-sb-search-toggle]"];
    return need.every((s) => { const el = document.querySelector(s); return el && el.getBoundingClientRect().height > 0; });
  });
  ok(noHover, "every essential capability is visible without hover on a touch phone");

  /* ---- 15. Orientation change settles — no entry replay ---- */
  console.log("15. Orientation");
  await open(page, 390, 844);
  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 1, hasTouch: true }); await sleep(400);
  const orient = await page.evaluate(() => ({
    running: document.querySelector("[data-sb-hero]").getAnimations({ subtree: true }).filter((a) => a.playState === "running" && a.effect?.getTiming().iterations !== Infinity).length,
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  }));
  ok(orient.running === 0 && !orient.overflow, "rotating the phone settles immediately — no profile-entry replay, no overflow");

  /* ---- 16. Resize continuity 900 → 1600 ---- */
  console.log("16. Resize continuity");
  await open(page, 900, 900);
  let jumps = 0; let prev = null;
  for (let w = 900; w <= 1600; w += 100) {
    await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1 }); await sleep(150);
    const m = await page.evaluate(() => Math.round(document.querySelector("[data-sb-sheet]").getBoundingClientRect().width));
    if (prev !== null && Math.abs(m - prev) > 360) jumps += 1;
    prev = m;
  }
  ok(jumps === 0, "continuous resize 900→1600: the Moment column recomposes without teleporting");

  /* ---- 17. Page health ---- */
  console.log("17. Page health");
  await open(page, 1440, 900);
  ok(errors.length === 0, `zero page errors (${errors.length})`);
  ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length})${consoleErrors[0] ? " — " + consoleErrors[0].slice(0, 80) : ""}`);

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log("S7 DEVICE MASTERY: FAIL"); failures.forEach((f) => console.log("  - " + f)); }
  else console.log("S7 DEVICE MASTERY: PASS");
  process.exit(failures.length ? 1 : 0);
})();
