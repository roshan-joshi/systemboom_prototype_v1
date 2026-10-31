/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS test script (repo pattern) */
/**
 * SYSTEMBOOM UHI-MULTI-001 — Complete Experience and Individual Evidence Preservation (MULTI-001…MULTI-013).
 *
 * Same deterministic harness as `category-order.js`: every `/api/analyze-meal` request the Composer makes is HELD; the test
 * fetches each photo's real server answer (identity headers forwarded, so HEIM stores it) under a chosen fixture and delivers
 * the answers in a scripted order. Mock mode only — no live provider can be reached (MULTI-010 proves it).
 *
 *   node prototype-tests/multi-experience.js
 */
const path = require("path");
const fs = require("fs");
const { Client } = require(path.join(__dirname, "..", "node_modules", "pg"));
const ts = require(path.join(__dirname, "..", "node_modules", "typescript"));
const { launch, sleep } = require("./celestial-lib");

const ROOT = path.join(__dirname, "..");
const HOST = "http://localhost:3210";
const PIN = "harness=0&theme=light&mockfacts=miss&mockpackaged=miss&mockrecord=off&mockactivity=high&mockai=nonfood";
let passed = 0;
const failures = [];
const ok = (c, m) => { if (c) { passed += 1; console.log(`  ✓ ${m}`); } else { failures.push(m); console.log(`  ✗ ${m}`); } };

function loadStore() {
  const dir = path.join(ROOT, "node_modules", ".sb-multi-test");
  fs.mkdirSync(dir, { recursive: true });
  const src = fs.readFileSync(path.join(ROOT, "src/lib/intelligence/heim-store.ts"), "utf8");
  fs.writeFileSync(path.join(dir, "heim-store.js"), ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText);
  return { dir, store: require(path.join(dir, "heim-store.js")) };
}

(async () => {
  const { dir, store } = loadStore();
  const db = new Client({ connectionString: "postgresql://localhost:5432/systemboom_intelligence_dev" });
  await db.connect();
  const q = (s, p) => db.query(s, p);
  const status = async () => (await (await fetch(`${HOST}/api/intelligence/status`)).json()).net;
  const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
  const liveRows = async () => (await q("select count(*)::int n from heim.ai_invocations where requested_provider_key <> 'mock'")).rows[0].n;
  const net0 = await status();
  const live0 = await liveRows();

  const { browser, page } = await launch();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  let held = [];
  const R = { act: 0, rec: 0 };
  await page.setRequestInterception(true);
  page.on("request", (r) => {
    const u = r.url();
    if (u.includes("/api/analyze-meal")) { held.push(r); return; }
    if (u.includes("/api/analyze-activity")) R.act += 1;
    if (u.includes("/api/analyze-record")) R.rec += 1;
    r.continue().catch(() => {});
  });
  const idHeaders = (r) => { const h = { "Content-Type": "application/json" }; for (const [k, v] of Object.entries(r.headers())) if (k.startsWith("x-sb-")) h[k] = v; return h; };
  const answer = async (i, scenario) => {
    const r = held[i];
    const res = await fetch(`${HOST}/api/analyze-meal?mock=${encodeURIComponent(scenario)}`, { method: "POST", headers: idHeaders(r), body: r.postData() });
    const body = await res.text();
    await r.respond({ status: res.status, contentType: "application/json", headers: { "x-sb-observation-cache": res.headers.get("x-sb-observation-cache") ?? "" }, body });
  };
  const mediaOf = async (i) => (await q("select media_id from heim.id_bridge where session_key=$1 and prototype_id=$2", [held[i].headers()["x-sb-session"], held[i].headers()["x-sb-asset"]])).rows[0]?.media_id;
  const forceUncached = async (i) => { const m = await mediaOf(i); if (m) await q("update heim.vision_observations set invalidated_at=now(), invalidation_reason='multi-experience: force miss' where media_id=$1 and invalidated_at is null", [m]); };
  const waitFor = async (fn, arg, tries = 80, gap = 100) => { for (let i = 0; i < tries; i++) { if (await page.evaluate(fn, arg)) return true; await sleep(gap); } return false; };
  const waitSettled = (n) => waitFor((k) => (window.__SB_MEAL_ANALYSIS_LOG ?? []).filter((e) => e.status === "done" || e.status === "failed").length >= k, n);
  const pillState = () => page.evaluate(() => { const p = document.querySelector("[data-sb-record-pill]"); return { kind: p?.getAttribute("data-sb-record-pill") ?? null, commit: p?.getAttribute("data-sb-category-commit") ?? null }; });
  const obsByAsset = () => page.evaluate(() => window.__SB_MEAL_ASSET_OBS ?? {});
  let NAMES = [];
  const open = async (url = `${HOST}/style-lab/social?${PIN}`) => {
    held = []; R.act = 0; R.rec = 0;
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.evaluate(() => { try { window.localStorage.removeItem("sb-smart-assist"); } catch {} });
    await sleep(600);
  };
  const openComposer = async () => { await page.click("[data-sb-open-composer]"); await sleep(450); };
  const pick = async (names) => {
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Media")?.click());
    await sleep(300);
    await page.click("[data-sb-media-source='mymedia']");
    await sleep(350);
    if (!NAMES.length) NAMES = await page.evaluate(() => [...document.querySelectorAll("[data-sb-mymedia-grid] button")].map((b) => b.getAttribute("aria-label")).filter((n) => n && !/video/i.test(n)));
    const want = typeof names === "number" ? NAMES.slice(0, names) : names;
    await page.evaluate((ns) => { const g = document.querySelector("[data-sb-mymedia-grid]"); for (const n of ns) [...g.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === n)?.click(); }, want);
    await sleep(200);
    const before = held.length;
    await page.click("[data-sb-mymedia-add]");
    for (let i = 0; i < 80 && held.length < before + want.length; i++) await sleep(100);
    return want;
  };
  const choose = async (aria) => {
    await page.evaluate(() => { const b = document.querySelector("[data-sb-record-details]"); if (b && b.getAttribute("aria-expanded") !== "true") b.click(); });
    await sleep(350);
    await page.evaluate((a) => [...document.querySelectorAll(`[data-sb-kind-row] button[aria-label='${a}']`)][0]?.click(), aria);
    await sleep(400);
  };
  /** attach `scenarios.length` photos and answer them in `order`; `mid` runs after the first answer while the rest are pending */
  const compose = async (scenarios, order, { mid, prep } = {}) => {
    await open();
    await openComposer();
    const names = await pick(scenarios.length);
    if (prep) await prep();
    let midState = null;
    for (let k = 0; k < order.length; k++) {
      await answer(order[k], scenarios[order[k]]);
      if (k === 0 && order.length > 1) { await waitSettled(1); await sleep(300); midState = { ...(await pillState()), obs: await obsByAsset() }; if (mid) await mid(); }
    }
    await waitSettled(order.length);
    await sleep(900);
    return { names, mid: midState, final: await pillState(), obs: await obsByAsset(), act: R.act, rec: R.rec };
  };
  const BDAY = "vision-birthdayparty";
  const CAKE = "vision-plaincake";

  try {
    console.log("§1 six birthday photographs, one of them food");
    const six = [BDAY, BDAY, CAKE, BDAY, BDAY, BDAY];
    const a = await compose(six, [0, 1, 2, 3, 4, 5]);
    ok(a.final.kind === "moment" && a.final.commit === "auto", `MULTI-001: six birthday photographs including one food photo commit to Life Moment (${a.final.kind}, ${a.final.commit})`);
    const perAsset = Object.values(a.obs).filter((o) => o && o.vision);
    ok(Object.keys(a.obs).length === 6 && perAsset.length === 6 && new Set(perAsset.map((o) => o.vision.primarySubject)).size >= 2, `MULTI-002: every photograph keeps its OWN structured observation in the Composer (${Object.keys(a.obs).length} readings, subjects ${[...new Set(perAsset.map((o) => o.vision.primarySubject))].join("/")})`);
    const media = [];
    for (let i = 0; i < 6; i++) media.push(await mediaOf(i));
    const rows = [];
    for (const m of media) rows.push((await q("select observation, payload, invocation_id from heim.vision_observations where media_id=$1 and payload is not null order by created_at desc limit 1", [m])).rows[0]);
    const fields = rows.every((r) => r && ["objects", "scene", "actions", "text", "primarySubject", "limitations", "provider"].every((k) => k in r.observation) && r.invocation_id);
    ok(media.every(Boolean) && fields, "MULTI-002: every photograph has its OWN stored HEIM observation (objects, scene, actions, OCR text, primary subject, limitations, provider) linked to its producing invocation");
    const cakeObs = Object.entries(a.obs).find(([, o]) => o?.vision?.primarySubject === "food")?.[1];
    // the row produced for THIS photo under the cake fixture (library photos are shared across suites and fixtures)
    const cakeRow = (await q("select payload from heim.vision_observations where media_id=$1 and payload is not null and cache_key_fields->>'promptId' = 'mock:vision-plaincake' order by created_at desc limit 1", [media[2]])).rows[0];
    ok(cakeObs?.isFood === true && cakeObs?.meal?.name && cakeRow?.payload?.observation?.isFood === true && cakeRow.payload.observation.meal?.name === cakeObs.meal.name && a.final.kind === "moment",
      `MULTI-003: the food photo's own evidence stays available (Composer + HEIM: isFood, "${cakeObs?.meal?.name}") while the post is a Life Moment`);
    ok(a.act === 0 && a.rec === 0, "no specialist request was sent for the whole-experience decision");

    console.log("§2 arrival order");
    const rev = await compose(six, [5, 4, 3, 2, 1, 0]);
    const mixedOrder = await compose(six, [2, 0, 5, 1, 4, 3]);
    ok(rev.final.kind === a.final.kind && mixedOrder.final.kind === a.final.kind && rev.final.commit === "auto" && mixedOrder.final.commit === "auto", `MULTI-004: reversed and shuffled arrival orders reach the same category (${a.final.kind} / ${rev.final.kind} / ${mixedOrder.final.kind})`);
    const foodAct = await compose(["meal", "nonfood-act-high"], [0, 1]);
    const actFood = await compose(["meal", "nonfood-act-high"], [1, 0]);
    // the pill's DISPLAYED kind in a mixed composition is the selected photo's own kind (the accepted selected-media rule), so the
    // whole-experience commitment is asserted on the commitment state itself
    ok(foodAct.final.commit === "none" && actFood.final.commit === "none" && foodAct.act === 0 && actFood.act === 0,
      `MULTI-004: a 1-to-1 conflict (food vs Activity) commits nothing in either order — the person chooses (commit ${foodAct.final.commit}/${actFood.final.commit}; activity requests ${foodAct.act}/${actFood.act})`);

    console.log("§3 cached + new vs two uncached");
    const pair = [BDAY, "vision-laptop"];
    const cold = await compose(pair, [0, 1], { prep: async () => { await forceUncached(0); await forceUncached(1); } });
    const warm = await compose(pair, [0, 1], { prep: async () => { await forceUncached(1); } }); // photo 0 is now cached (from `cold`)
    const h0 = await q("select count(*)::int n from heim.observation_cache_events where media_id=$1 and outcome in ('hit','waited_hit') and created_at > now() - interval '30 seconds'", [await mediaOf(0)]);
    ok(h0.rows[0].n >= 1 && warm.final.kind === cold.final.kind && warm.final.commit === cold.final.commit, `MULTI-005: one cached + one new photo give the same result as two uncached photos (${cold.final.kind}/${cold.final.commit} = ${warm.final.kind}/${warm.final.commit}; cache hit recorded)`);

    console.log("§4 preliminary previews vs commitment");
    const pre = await compose([CAKE, BDAY, BDAY], [0, 1, 2]);
    const cakeMid = Object.values(pre.mid?.obs ?? {}).find((o) => o?.isFood === true);
    ok(!!cakeMid && pre.mid.commit === "awaiting" && pre.mid.kind !== "meal" && pre.final.kind === "moment" && pre.final.commit === "auto",
      `MULTI-006: the food photo's early reading is available as a preview (isFood, "${cakeMid?.meal?.name}") but commits nothing while the others are pending (mid: ${pre.mid?.kind}/${pre.mid?.commit} → final ${pre.final.kind}/${pre.final.commit})`);

    console.log("§5 human authority");
    const human = await compose([CAKE, BDAY, BDAY], [0, 1, 2], { mid: () => choose("Project") });
    ok(human.final.kind === "project" && human.final.commit === "person", `MULTI-007: a category the person chose while photos were still being read is never overwritten (${human.final.kind}, ${human.final.commit})`);
    // undo, then a delayed second photo
    await open();
    await openComposer();
    await pick(1);
    await answer(0, "meal");
    await waitSettled(1);
    await sleep(700);
    const auto1 = await pillState();
    await page.evaluate(() => document.querySelector("[data-sb-record-pill]")?.click()); // the one-tap undo
    await sleep(500);
    const undone = await pillState();
    await pick([NAMES[3]]);
    await sleep(1200); // the second photo's reading is held (delayed) while the undo stands
    await answer(1, "meal");
    await waitSettled(2);
    await sleep(900);
    const afterLate = await pillState();
    ok(auto1.kind === "meal" && auto1.commit === "auto" && undone.commit === "none" && afterLate.kind !== "meal" && afterLate.commit === "none", `MULTI-008: a one-tap undo stands after a delayed reading arrives (${auto1.kind}/${auto1.commit} → undo ${undone.kind}/${undone.commit} → late ${afterLate.kind}/${afterLate.commit})`);

    console.log("§6 failure");
    let failMedia = null;
    let failRowsBefore = 0;
    const fl = await compose([BDAY, BDAY, "fail"], [0, 1, 2], { prep: async () => { failMedia = await mediaOf(2); failRowsBefore = failMedia ? (await q("select count(*)::int n from heim.vision_observations where media_id=$1", [failMedia])).rows[0].n : 0; } });
    failMedia = failMedia ?? (await mediaOf(2));
    const failRowsAfter = (await q("select count(*)::int n from heim.vision_observations where media_id=$1", [failMedia])).rows[0].n;
    const failObs = Object.values(fl.obs).filter((o) => o === null).length;
    ok(fl.final.kind === "moment" && fl.final.commit === "auto" && failObs === 1 && failRowsAfter === failRowsBefore, `MULTI-009: a failed reading contributes no evidence and no stored observation (null reading ${failObs}, stored rows ${failRowsBefore}→${failRowsAfter}); the remaining photos still decide (${fl.final.kind})`);

    console.log("§7 Circle of Life — ENRICH");
    await open(`${HOST}/style-lab/circle?c=day:2019-07-14&w=desktop&theme=light&${PIN}`);
    await page.waitForSelector("[data-sb-circle-view]", { timeout: 15000 });
    await page.click("[data-sb-record-here]");
    await page.waitForSelector("[data-sb-composer]");
    await sleep(500);
    const before13 = await pillState();
    await pick(2);
    await answer(0, "meal");
    await answer(1, "meal");
    await waitSettled(2);
    await sleep(900);
    const after13 = await pillState();
    ok(before13.kind === after13.kind && after13.commit === "person" && R.act === 0 && R.rec === 0, `MULTI-013: a Circle direct entry keeps its chosen category (${before13.kind} → ${after13.kind}, ${after13.commit}); no discovery commitment, no specialist request`);

    console.log("§8 deletion");
    const delId = media[2];
    const others = media.filter((m, i) => i !== 2);
    const othersBefore = (await q("select count(*)::int n from heim.vision_observations where media_id = any($1)", [others])).rows[0].n;
    const res = await store.deleteMedia(delId);
    const gone = (await q("select count(*)::int n from heim.vision_observations where media_id=$1", [delId])).rows[0].n;
    const othersAfter = (await q("select count(*)::int n from heim.vision_observations where media_id = any($1)", [others])).rows[0].n;
    ok(res && res.deleted && res.observations >= 1 && gone === 0 && othersAfter === othersBefore, `MULTI-011: deleting one photo removes ITS private observations (${res?.observations}) and leaves the other photos' observations intact (${othersAfter})`);

    const net1 = await status();
    ok(sum(net1.allowed) === sum(net0.allowed) && (await liveRows()) === live0, "MULTI-010: zero live provider requests and zero non-mock ledger rows during the whole suite");
    ok(errs.length === 0, `no page errors${errs.length ? ` — ${errs[0]}` : ""}`);
  } catch (e) {
    failures.push(`suite crashed: ${e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e}`);
    console.log("  ✗ crashed:", e && e.message);
  } finally {
    await browser.close().catch(() => {});
    await db.end().catch(() => {});
    try { const p = store.heimPool(); if (p) await p.end(); } catch {}
    fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log(`\n${failures.length ? "FAIL" : "PASS"} — ${passed} checks passed, ${failures.length} failed`);
  failures.forEach((f) => console.log("  ✗", f));
  process.exit(failures.length ? 1 : 0);
})();
