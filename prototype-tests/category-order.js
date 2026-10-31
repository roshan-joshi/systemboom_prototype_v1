/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS test script (repo pattern) */
/**
 * SYSTEMBOOM P2-B2.1 — DETERMINISTIC ARRIVAL ORDER for automatic category selection (the MIX-11 investigation).
 *
 * Every `/api/analyze-meal` request the Composer makes is HELD in the browser. The test fetches each photo's real server
 * answer itself (same body + identity headers, the fixture chosen per photo) and then delivers the answers to the
 * Composer in a scripted order — so "which photo's reading lands first" is controlled, not left to timing. The Composer
 * must reach the same result in every order, never auto-select from partial evidence, and never touch a person's choice.
 *
 *   node prototype-tests/category-order.js        (dev server :3210, mock mode; no live provider can be reached)
 */
const path = require("path");
const { Client } = require(path.join(__dirname, "..", "node_modules", "pg"));
const { launch, sleep } = require("./celestial-lib");

const HOST = "http://localhost:3210";
const PIN = "harness=0&theme=light&mockfacts=miss&mockpackaged=miss&mockrecord=off&mockactivity=high&mockai=nonfood";
const THALI = "Dal bhat tarkari on a steel plate";
const SNOW = "Trekkers on a snow ridge under a hard blue sky";
const NYAT = "Nyatapola temple, Bhaktapur";
const GARDEN = "A garden park in Kathmandu";
const TERR = "Terraced hillsides";
let passed = 0;
const failures = [];
const ok = (c, m) => { if (c) { passed += 1; console.log(`  ✓ ${m}`); } else { failures.push(m); console.log(`  ✗ ${m}`); } };

(async () => {
  const { browser, page } = await launch();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  let held = [];
  const R = { act: 0, rec: 0, meal: 0 };
  await page.setRequestInterception(true);
  page.on("request", (r) => {
    const u = r.url();
    if (u.includes("/api/analyze-meal")) { R.meal += 1; held.push(r); return; }
    if (u.includes("/api/analyze-activity")) R.act += 1;
    if (u.includes("/api/analyze-record")) R.rec += 1;
    r.continue().catch(() => {});
  });
  /** fetch the photo's real server answer under `scenario`, then deliver it to the Composer */
  const answer = async (i, scenario) => {
    const r = held[i];
    const h = r.headers();
    const headers = { "Content-Type": "application/json" };
    for (const [k, v] of Object.entries(h)) if (k.startsWith("x-sb-")) headers[k] = v;
    const res = await fetch(`${HOST}/api/analyze-meal?mock=${encodeURIComponent(scenario)}`, { method: "POST", headers, body: r.postData() });
    const body = await res.text();
    await r.respond({ status: res.status, contentType: "application/json", headers: { "x-sb-observation-cache": res.headers.get("x-sb-observation-cache") ?? "" }, body });
    return res.headers.get("x-sb-observation-cache");
  };
  const waitFor = async (fn, arg, tries = 60, gap = 100) => { for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return true; await sleep(gap); } return false; };
  const waitSettled = (n) => waitFor((k) => (window.__SB_MEAL_ANALYSIS_LOG ?? []).filter((e) => e.status === "done" || e.status === "failed").length >= k, n);
  const pill = () => page.evaluate(() => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") ?? null);
  const mixedShown = () => page.evaluate(() => !!document.querySelector("[data-sb-mixed-records]"));
  const open = async () => {
    held = []; R.act = 0; R.rec = 0; R.meal = 0;
    await page.goto(`${HOST}/style-lab/social?${PIN}`, { waitUntil: "networkidle2" });
    await page.evaluate(() => { try { window.localStorage.removeItem("sb-smart-assist"); } catch {} });
    await sleep(600);
    await page.click("[data-sb-open-composer]");
    await sleep(450);
  };
  const pick = async (names) => {
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Media")?.click());
    await sleep(300);
    await page.click("[data-sb-media-source='mymedia']");
    await sleep(350);
    await page.evaluate((ns) => { const g = document.querySelector("[data-sb-mymedia-grid]"); for (const n of ns) [...g.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === n)?.click(); }, names);
    await sleep(200);
    const before = held.length;
    await page.click("[data-sb-mymedia-add]");
    for (let i = 0; i < 50 && held.length < before + names.length; i++) await sleep(100);
  };
  const choose = async (aria) => {
    await page.evaluate(() => { const b = document.querySelector("[data-sb-record-details]"); if (b && b.getAttribute("aria-expanded") !== "true") b.click(); });
    await sleep(350);
    await page.evaluate((a) => [...document.querySelectorAll(`[data-sb-kind-row] button[aria-label='${a}']`)][0]?.click(), aria);
    await sleep(400);
  };
  /** run one two-photo composition: answers delivered in `order` (indices into the attach order), with optional gaps */
  const run = async (photos, scenarios, order, { gapMs = 0, during } = {}) => {
    await open();
    await pick(photos);
    const out = { duringPill: null, duringAct: null, duringRec: null };
    for (let k = 0; k < order.length; k++) {
      const i = order[k];
      await answer(i, scenarios[i]);
      if (k < order.length - 1) {
        await waitSettled(k + 1);
        await sleep(250);
        if (k === 0) { out.duringPill = await pill(); out.duringAct = R.act; out.duringRec = R.rec; if (during) await during(); }
        if (gapMs) await sleep(gapMs);
      }
    }
    await waitSettled(order.length);
    await sleep(900);
    return { ...out, pill: await pill(), act: R.act, rec: R.rec, mixed: await mixedShown() };
  };

  try {
    /* ---- baseline: a single photo still auto-selects at once (Phase C unchanged) ---- */
    console.log("§0 single photo (baseline)");
    const single = await run([THALI], ["meal"], [0]);
    ok(single.pill === "meal", `a single food photo still auto-selects Meal (pill ${single.pill})`);
    const singleAct = await run([SNOW], ["nonfood-act-high"], [0]);
    ok(singleAct.pill === "activity" && singleAct.act === 1, `a single Activity photo still auto-selects Activity and asks the Activity specialist once (pill ${singleAct.pill}, activity ${singleAct.act})`);

    /* ---- 1 & 2: birthday vs construction, both orders ---- */
    console.log("§1–2 birthday vs construction — order must not matter");
    const bc = await run([GARDEN, NYAT], ["vision-birthdayparty", "vision-construction"], [0, 1]);
    const cb = await run([GARDEN, NYAT], ["vision-birthdayparty", "vision-construction"], [1, 0]);
    ok(bc.pill === cb.pill && bc.rec === cb.rec && bc.act === cb.act, `ORDER-1/2: same final category and same specialist requests in both orders (birthday-first: ${bc.pill}, rec ${bc.rec} · construction-first: ${cb.pill}, rec ${cb.rec})`);
    ok(bc.pill !== "project" && bc.rec === 0, `ORDER-1: conflicting experiences are not auto-organised into Project, and no Project specialist is asked (pill ${bc.pill}, rec ${bc.rec})`);
    ok(cb.duringPill !== "project" && cb.duringRec === 0, `ORDER-2: while the birthday photo is still being read, the construction photo alone does not select Project or call the Project specialist (pill ${cb.duringPill}, rec ${cb.duringRec})`);
    ok(bc.duringPill === cb.duringPill, `ORDER-1/2: while one reading is pending the category is the same whichever photo answered first (during: ${bc.duringPill} / ${cb.duringPill})`);

    /* ---- 3: conflicting Meal + Activity — simultaneous and both orders (the MIX-11 shape) ---- */
    console.log("§3 Meal + Activity conflict");
    const simul = await (async () => {
      await open();
      await pick([THALI, SNOW]);
      await Promise.all([answer(0, "meal"), answer(1, "nonfood-act-high")]);
      await waitSettled(2);
      await sleep(900);
      return { pill: await pill(), act: R.act, mixed: await mixedShown() };
    })();
    const foodFirst = await run([THALI, SNOW], ["meal", "nonfood-act-high"], [0, 1]);
    const actFirst = await run([THALI, SNOW], ["meal", "nonfood-act-high"], [1, 0]);
    ok(simul.mixed && foodFirst.mixed && actFirst.mixed, "ORDER-3: the conflict is detected in every order (mixed notice shown)");
    ok(simul.pill === foodFirst.pill && foodFirst.pill === actFirst.pill, `ORDER-3: the auto category is identical whatever arrives first (simultaneous ${simul.pill} · food-first ${foodFirst.pill} · activity-first ${actFirst.pill})`);
    ok(simul.act === 0 && foodFirst.act === 0 && actFirst.act === 0, `ORDER-3 (MIX-11): no Activity specialist request is made before a person chooses Activity, in any order (${simul.act}/${foodFirst.act}/${actFirst.act})`);
    ok(actFirst.duringPill !== "activity" && actFirst.duringAct === 0, `ORDER-3: the Activity photo answering first does not select Activity while the food photo is still being read (pill ${actFirst.duringPill})`);

    /* ---- 4: one cached, one not ---- */
    console.log("§4 one cached, one not");
    await run([GARDEN], ["vision-birthdayparty"], [0]); // warms the cache for GARDEN under this fixture
    await open();
    await pick([GARDEN, TERR]);
    // make the second photo genuinely UNcached for this fixture (earlier suites may have cached it): invalidate its observations
    const db = new Client({ connectionString: "postgresql://localhost:5432/systemboom_intelligence_dev" });
    await db.connect();
    await db.query(`update heim.vision_observations set invalidated_at = now(), invalidation_reason = 'category-order: force miss'
                     where invalidated_at is null and media_id in (select media_id from heim.id_bridge where session_key = 'library' and prototype_id = $1)`, [held[1].headers()["x-sb-asset"]]);
    await db.end();
    const c0 = await answer(0, "vision-birthdayparty");
    await waitSettled(1);
    await sleep(300);
    const pend = await pill();
    const c1 = await answer(1, "vision-laptop");
    await waitSettled(2);
    await sleep(900);
    const p4 = await pill();
    const rev = await run([GARDEN, TERR], ["vision-birthdayparty", "vision-laptop"], [1, 0]);
    ok(c0 === "hit" && c1 !== "hit", `ORDER-4: one reading is a cache HIT and the other is not (${c0} / ${c1})`);
    ok(p4 === rev.pill, `ORDER-4: a cached and an uncached reading give the same result in either order (pending ${pend}, final ${p4} = reverse ${rev.pill})`);

    /* ---- 5: one result delayed ---- */
    console.log("§5 one result delayed");
    const delayed = await run([THALI, SNOW], ["meal", "nonfood-act-high"], [1, 0], { gapMs: 2500 });
    ok(delayed.duringPill !== "activity" && delayed.duringAct === 0 && delayed.pill === foodFirst.pill && delayed.act === 0, `ORDER-5: a 2.5 s delay on the food reading changes nothing (during ${delayed.duringPill}, final ${delayed.pill}, activity ${delayed.act})`);

    /* ---- 6: one result fails ---- */
    console.log("§6 one result fails");
    const failLast = await run([GARDEN, TERR], ["vision-birthdayparty", "fail"], [0, 1]);
    const failFirst = await run([GARDEN, TERR], ["vision-birthdayparty", "fail"], [1, 0]);
    ok(failLast.pill === failFirst.pill, `ORDER-6: a failed reading leads to the same result in either order (${failLast.pill} / ${failFirst.pill})`);
    ok(failLast.pill === "moment", `ORDER-6: the remaining valid reading still decides once the failure is known (pill ${failLast.pill})`);

    /* ---- 7: person chooses while analysis is in progress ---- */
    console.log("§7 human choice during analysis");
    const human = await run([THALI, SNOW], ["meal", "nonfood-act-high"], [1, 0], { during: () => choose("Meeting") });
    // the person's choice is the POST's kind (intentSource "user"); once both readings make the composition mixed, the pill shows
    // the SELECTED photo's own kind (the accepted selected-media-context rule) — so the authority is proven on what is posted
    await page.evaluate(() => { const ta = document.getElementById("sb-composer-text"); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(ta, "order-7 meeting"); ta.dispatchEvent(new Event("input", { bubbles: true })); });
    const blocked7 = await page.evaluate(() => !!document.querySelector("[data-sb-mixed-records]") && [...document.querySelectorAll("[data-sb-composer] footer button")].some((b) => /^Post$/.test(b.textContent.trim()) && (b.disabled || b.getAttribute("aria-disabled") === "true")));
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => /^Post$/.test(b.textContent.trim()))?.click());
    await sleep(1600);
    const posted7 = await page.evaluate(() => (window.__SB_SOCIAL_STATE?.moments ?? []).find((m) => (m.text ?? "") === "order-7 meeting"));
    ok(!blocked7 && posted7?.kind === "meeting" && human.act === 0, `ORDER-7: a category chosen while readings are still arriving is never overridden — Post is not held and the record posts as ${posted7?.kind} (activity requests ${human.act})`);

    /* ---- 8: person changes category after analysis completes ---- */
    console.log("§8 human change after analysis");
    const after = await run([THALI, SNOW], ["meal", "nonfood-act-high"], [0, 1]);
    await choose("Activity");
    await sleep(1200);
    const p8 = await pill();
    await pick([TERR]);
    await answer(2, "meal");
    await waitSettled(3);
    await sleep(900);
    const p8b = await pill();
    ok(after.pill === foodFirst.pill && p8 === "activity" && p8b === "activity", `ORDER-8: a change made after analysis stands, even when another photo's reading arrives later (${after.pill} → ${p8} → ${p8b})`);

    ok(errs.length === 0, `no page errors${errs.length ? ` — ${errs[0]}` : ""}`);
  } catch (e) {
    failures.push(`suite crashed: ${e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e}`);
    console.log("  ✗ crashed:", e && e.message);
  } finally {
    await browser.close().catch(() => {});
  }
  console.log(`\n${failures.length ? "FAIL" : "PASS"} — ${passed} checks passed, ${failures.length} failed`);
  failures.forEach((f) => console.log("  ✗", f));
  process.exit(failures.length ? 1 : 0);
})();
