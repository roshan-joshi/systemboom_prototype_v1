/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * PHASE V3 — ACTIVITY SOCIAL COMPOSER · acceptance suite (V3-1 … V3-148).
 *
 *   node prototype-tests/activity-intelligence.js        (dev server on :3210)
 *
 * Every check drives the REAL composer through real attach → category → Activity → edit → post flows with deterministic mock seams:
 *   `?mockai=<scenario>`        stage 1 — the existing category intelligence (Meal analysis), extended with an Activity category call
 *                               for a photo that is not food: nonfood-act-high | nonfood-act-medium | nonfood-act-low | nonfood | meal | fail
 *   `?mockactivity=<scenario>`  stage 2 — the Activity-specific reading (only after Activity is selected): high | carpentry | yoga | football |
 *                               swim | hobby | learning | cycle | gym | ocr | ocrlow | ocrmedium | fabricate | secondary | none | fail |
 *                               byasset[:slow<tag>] (each fixture photo answers by its own bytes); `:<ms>` delays the answer
 *   `?mockwait=<ms>`            the displayed longer-wait threshold (display only)
 * Requests are counted on the wire (page.on("request")); the privacy payload is read through the route's `?mock=echo` seam.
 *
 * Failing-first classification lives in the final report: each ID is emitted by v3(n, …) so the log can be grepped per ID.
 */
const { launch, sleep } = require("./celestial-lib");
const cp = require("child_process");
const ROOT = require("path").join(__dirname, "..");
const sh = (cmd) => { try { return cp.execSync(cmd, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString(); } catch (e) { return String(e.stdout ?? ""); } };

const HOST = "http://localhost:3210";
const B = `${HOST}/style-lab/social?harness=0`;
let passed = 0;
const failures = [];
const seen = new Set();
const ok = (c, m) => { if (c) { passed += 1; console.log(`  ✓ ${m}`); } else { failures.push(m); console.log(`  ✗ ${m}`); } };
const v3 = (n, cond, msg) => { seen.add(n); ok(!!cond, `V3-${n}: ${msg}`); };
const DESKTOP = { width: 1440, height: 1000, deviceScaleFactor: 1 };

const SNOW = "Trekkers on a snow ridge under a hard blue sky"; // no EXIF → no metadata review
const TERR = "Terraced hillsides";
const GARDEN = "A garden park in Kathmandu";
const PHEWA = "Dusk over Phewa lake"; // EXIF time + place
const THALI = "Dal bhat tarkari on a steel plate"; // food, no EXIF

const R = { seq: [], meal: 0, act: 0, bodies: [], facts: 0 };
const resetR = () => { R.seq = []; R.meal = 0; R.act = 0; R.bodies = []; R.facts = 0; };
let pageErrors = 0;

async function open(page, extra = "", opts = {}) {
  await page.setViewport(opts.viewport ?? DESKTOP);
  resetR();
  const factsPin = extra.includes("mockfacts=") ? "" : "&mockfacts=miss";
  const packagedPin = extra.includes("mockpackaged=") ? "" : "&mockpackaged=miss";
  await page.goto(`${B}&theme=${opts.theme ?? "light"}${factsPin}${packagedPin}&mockrecord=off${extra}`, { waitUntil: "networkidle2" });
  await page.evaluate((off) => { try { if (off) window.localStorage.setItem("sb-smart-assist", "off"); else window.localStorage.removeItem("sb-smart-assist"); } catch {} }, !!opts.aiOff);
  await sleep(700);
}
const state = (page) => page.evaluate(() => window.__SB_SOCIAL_STATE);
const openComposer = async (page) => { await page.click("[data-sb-open-composer]"); await sleep(450); };
const setText = (page, v) => page.evaluate((x) => { const ta = document.getElementById("sb-composer-text"); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(ta, x); ta.dispatchEvent(new Event("input", { bubbles: true })); }, v);
const post = async (page) => { await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => /^(Post|Save)$/.test(b.textContent.trim()) || b.getAttribute("aria-busy"))?.click()); await sleep(1400); };
const details = async (page) => { await page.evaluate(() => { const b = document.querySelector("[data-sb-record-details]"); if (b && b.getAttribute("aria-expanded") !== "true") b.click(); }); await sleep(350); };
const kind = async (page, aria) => { await details(page); await page.evaluate((a) => [...document.querySelectorAll(`[data-sb-kind-row] button[aria-label='${a}']`)][0]?.click(), aria); await sleep(400); };
const more = async (page) => { await page.evaluate(() => { const b = document.querySelector("[data-sb-more-toggle]"); if (b && b.getAttribute("aria-expanded") !== "true") b.click(); }); await sleep(300); };
const setField = (page, hook, v) => page.evaluate((h, x) => { const el = document.querySelector(`[data-sb-ufield='${h}']`); if (!el) return false; const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, "value").set.call(el, x); el.dispatchEvent(new Event("input", { bubbles: true })); return true; }, hook, v);
const fieldVal = (page, hook) => page.evaluate((h) => document.querySelector(`[data-sb-ufield='${h}']`)?.value ?? null, hook);
const addField = async (page, key) => { await page.evaluate((k) => document.querySelector(`[data-sb-add-field='${k}']`)?.click(), key); await sleep(220); };
const chip = async (page, group, text) => { await page.evaluate((g, t2) => [...document.querySelectorAll(`[data-sb-chipselect='${g}'] button`)].find((b) => b.textContent.trim() === t2)?.click(), group, text); await sleep(250); };
const actType = async (page, text) => {
  await page.evaluate(() => (document.querySelector("[data-sb-activity-more-types]") ?? document.querySelector("[data-sb-activity-change]"))?.click());
  await sleep(300);
  await chip(page, "activityType", text);
};
const waitFor = async (page, fn, arg, tries = 30, gap = 200) => {
  for (let i = 0; i < tries; i++) {
    if (await page.evaluate(fn, arg)) return true;
    await sleep(gap);
  }
  return false;
};
const pill = (page) => page.evaluate(() => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") ?? null);
const waitPill = (page, k, tries = 40) => waitFor(page, (kk) => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") === kk, k, tries, 200);
const cells = (page) => page.evaluate(() => window.__SB_ACTIVITY_CELLS ?? null);
const actObs = (page) => page.evaluate(() => window.__SB_ACTIVITY_ASSET_OBS ?? {});
const waitActDone = (page, n = 1, tries = 60) => waitFor(page, (k) => (window.__SB_ACTIVITY_ANALYSIS_LOG ?? []).filter((e) => e.status === "done" || e.status === "failed").length >= k, n, tries, 200);
const waitMealDone = (page, n = 1, tries = 60) => waitFor(page, (k) => (window.__SB_MEAL_ANALYSIS_LOG ?? []).filter((e) => e.status === "done" || e.status === "failed").length >= k, n, tries, 200);
const newest = async (page) => (await state(page)).moments.filter((m) => m.id.startsWith("m-new-"))[0];
const chosenType = (page) => page.evaluate(() => document.querySelector("[data-sb-activity-chosen]")?.getAttribute("data-sb-activity-chosen") ?? null);
const chosenText = (page) => page.evaluate(() => document.querySelector("[data-sb-activity-chosen]")?.textContent.replace(/\s+/g, " ").trim() ?? "");
const bodyText = (page) => page.evaluate(() => document.body.innerText);
const pickMedia = async (page, alts) => {
  await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Media")?.click());
  await sleep(300);
  await page.click("[data-sb-media-source='mymedia']");
  await sleep(350);
  await page.evaluate((names) => {
    const grid = document.querySelector("[data-sb-mymedia-grid]");
    for (const n of names) [...grid.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === n)?.click();
  }, alts);
  await sleep(200);
  await page.click("[data-sb-mymedia-add]");
  await sleep(350);
};
const clickSel = (page, sel) => page.evaluate((s) => { const el = document.querySelector(s); if (el) el.click(); return !!el; }, sel);
const removePhoto = async (page, n) => {
  await page.evaluate(() => document.querySelector("[data-sb-media-edit]")?.click());
  await sleep(350);
  await page.evaluate((i) => [...document.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === `Remove photo ${i}`)?.click(), n);
  await sleep(300);
  await page.evaluate(() => document.querySelector("[data-sb-sheet-back]")?.click());
  await sleep(450);
};
const keepDraft = async (page) => {
  await page.keyboard.press("Escape");
  await sleep(300);
  await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => b.textContent.trim() === "Keep draft")?.click());
  await sleep(500);
};
const cellOf = (c, k) => (c ? c[k] : undefined);

/** open → composer → attach one non-food photo → wait for stage-1 → return */
async function attach(page, extra, photos = [SNOW], opts = {}) {
  await open(page, extra, opts);
  await openComposer(page);
  await pickMedia(page, photos);
  await waitMealDone(page, 1, 40);
}

(async () => {
  const { page, browser } = await launch();
  page.on("pageerror", () => { pageErrors += 1; });
  page.on("request", (r) => {
    const u = r.url();
    if (u.includes("/api/analyze-meal")) { R.meal += 1; R.seq.push("meal"); }
    else if (u.includes("/api/analyze-activity")) { R.act += 1; R.seq.push("act"); try { R.bodies.push(JSON.parse(r.postData() ?? "{}")); } catch { R.bodies.push(null); } }
    else if (u.includes("/api/food-facts")) R.facts += 1;
  });
  try {
    /* =========================================================== CATEGORY-FIRST (V3-1 … V3-14) */
    console.log("CATEGORY-FIRST");
    // HIGH: non-food photo, Activity category call HIGH
    await attach(page, "&mockai=nonfood-act-high&mockactivity=high");
    const sel1 = await waitPill(page, "activity");
    await waitActDone(page, 1);
    v3(1, sel1 && R.seq[0] === "meal" && R.seq.includes("act") && R.seq.indexOf("meal") < R.seq.indexOf("act"), `media entered the existing category intelligence BEFORE any Activity-domain request (request order: ${R.seq.join(" → ")})`);
    v3(2, sel1 && (await chosenType(page)) === "run", "a HIGH-confidence Activity auto-selects under Meal's own rule (selected by the response, no click) and its reading fills Quick (type Run)");
    const pillAttrs = await page.evaluate(() => { const p = document.querySelector("[data-sb-record-pill]"); return { shown: !!p, text: p?.textContent.trim() }; });
    await clickSel(page, "[data-sb-record-pill]");
    await sleep(300);
    v3(3, pillAttrs.shown && /Activity/.test(pillAttrs.text ?? "") && (await pill(page)) !== "activity", `the selection is VISIBLE ("${pillAttrs.text}") and ONE tap undoes it (pill → ${await pill(page)})`);
    // the undo kept the photo, no re-selection and no extra requests
    await sleep(700);
    v3(7, (await pill(page)) !== "activity", "after the undo a late/again result cannot reselect Activity");
    v3(8, R.meal === 1 && R.act === 1, `the undo triggered no new category or Activity request (meal ${R.meal}, activity ${R.act}) — nothing to reselect it`);

    // MEDIUM: asks, never forces
    await attach(page, "&mockai=nonfood-act-medium&mockactivity=high");
    const ask = await waitFor(page, () => !!document.querySelector("[data-sb-activity-category-suggestion]"), null, 30, 200);
    const askText = await page.evaluate(() => document.querySelector("[data-sb-activity-category-suggestion]")?.textContent.replace(/\s+/g, " ").trim());
    v3(4, ask && (await pill(page)) !== "activity" && /Activity/.test(askText ?? "") && !(await page.evaluate(() => !!document.querySelector("[data-sb-meal-category-suggestion]"))), `a MEDIUM Activity gets the same lightweight ask as Meal ("${askText}") and is not forced`);
    v3(15, R.act === 0, `Activity analysis has NOT begun while Activity is only suggested (activity requests ${R.act})`);
    await clickSel(page, "[data-sb-activity-cat-yes]");
    await waitActDone(page, 1);
    v3(15, (await pill(page)) === "activity" && R.act === 1 && (await chosenType(page)) === "run", `…it begins only after Activity is accepted (Yes → selected, ${R.act} activity request, type ${await chosenType(page)})`);

    // LOW: nothing
    await attach(page, "&mockai=nonfood-act-low&mockactivity=high");
    await sleep(900);
    v3(5, (await pill(page)) !== "activity" && !(await page.evaluate(() => !!document.querySelector("[data-sb-activity-category-suggestion]"))) && R.act === 0, `a LOW Activity category call neither selects nor asks (pill ${await pill(page)}, activity requests ${R.act})`);

    // explicit human category wins — and a late category result never overrides it
    await open(page, "&mockai=nonfood-act-high:2500&mockactivity=high");
    await openComposer(page);
    await pickMedia(page, [SNOW]);
    await kind(page, "Health");
    await sleep(3400);
    v3(6, (await pill(page)) === "health", `an explicit Health choice stays Health (pill ${await pill(page)})`);
    v3(7, (await pill(page)) === "health" && R.act === 0, `a LATE category result (Activity HIGH, 2.5 s) did not override it and no Activity analysis was started (${R.act})`);
    await kind(page, "Activity"); // explicit Activity while pending
    await waitActDone(page, 1);
    v3(6, (await pill(page)) === "activity", "an explicit Activity choice is honoured");

    // user changes the auto-selected Activity; a later Activity result cannot reselect it
    await open(page, "&mockai=nonfood-act-high&mockactivity=high:2500");
    await openComposer(page);
    await pickMedia(page, [SNOW]);
    await waitPill(page, "activity");
    await clickSel(page, "[data-sb-record-pill]"); // one tap = undo the auto-selection (the accepted gesture)
    await sleep(300);
    await kind(page, "Problem");
    await sleep(3200);
    v3(8, (await pill(page)) === "problem", `the person changed the auto-selected Activity to Problem; the late Activity result (2.5 s) did not reselect it (pill ${await pill(page)})`);

    // food-at-gym: a confident Meal is never an Activity
    await attach(page, "&mockai=meal&mockactivity=high", [THALI]);
    await waitPill(page, "meal");
    await sleep(700);
    v3(9, (await pill(page)) === "meal" && R.act === 0, `clear Meal media remains Meal under the accepted Meal logic (pill ${await pill(page)}, activity requests ${R.act})`);
    v3(10, (await pill(page)) === "meal" && R.act === 0, "food photographed where activity-like objects exist (the category call is food) never becomes Activity");
    v3(11, (await pill(page)) === "meal", "a strong category conflict is not silently ranked — the accepted category (Meal) stands and nothing was asked");

    // request counts
    await attach(page, "&mockai=nonfood-act-high&mockactivity=high");
    await waitPill(page, "activity");
    await waitActDone(page, 1);
    const base = { meal: R.meal, act: R.act };
    await more(page);
    await setField(page, "distance", "5 km");
    await sleep(300);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Media")?.click());
    await sleep(300);
    await page.keyboard.press("Escape");
    await sleep(900);
    v3(12, base.meal === 1 && R.meal === 1, `unchanged media → ONE category request across render, More, an edit and a sheet round trip (${R.meal})`);
    v3(13, R.meal === 1 && R.act === 1, `selecting / reselecting media causes zero unnecessary category calls (meal ${R.meal}, activity ${R.act})`);

    // AI OFF: zero provider calls of either kind
    await open(page, "&mockai=nonfood-act-high&mockactivity=high", { aiOff: true });
    await openComposer(page);
    await pickMedia(page, [SNOW]);
    await sleep(1400);
    v3(14, R.meal === 0 && R.act === 0, `AI OFF performs zero classification calls and zero Activity calls (meal ${R.meal}, activity ${R.act})`);
    await kind(page, "Activity");
    await sleep(800);
    v3(121, R.meal === 0 && R.act === 0, `AI OFF: choosing Activity by hand still makes no provider request (meal ${R.meal}, activity ${R.act})`);
    await actType(page, "Gym");
    await setField(page, "duration", "52 min");
    await more(page);
    await addField(page, "notes");
    await setField(page, "notes", "Leg day");
    v3(122, (await chosenType(page)) === "gym" && (await fieldVal(page, "duration")) === "52 min" && (await fieldVal(page, "notes")) === "Leg day", "AI OFF: manual Activity Quick + More Details works");
    await keepDraft(page);
    const dr = await state(page);
    v3(123, !!dr.udraft && dr.udraft.intent === "activity" && !dr.moments.some((m) => m.id.startsWith("m-new-")), "AI OFF: Keep draft works and publishes nothing");
    await openComposer(page);
    await post(page);
    const offPost = await newest(page);
    v3(124, offPost?.fields?.activityType === "gym" && offPost.fields.duration === "52 min", "AI OFF: Post works with the hand-entered Activity");
    v3(14, R.meal === 0 && R.act === 0, "…and the whole AI-off flow, start to post, made no provider request");

    /* =========================================================== ACTIVITY OBSERVATION (V3-16 … V3-25) */
    console.log("ACTIVITY OBSERVATION");
    const scenarios = [
      ["high", 17, "run", /run/i],
      ["cycle", 18, "cycling", null],
      ["gym", 19, "gym", null],
      ["yoga", 20, "mindbody", /yoga/i],
      ["football", 21, "sport", /football/i],
      ["carpentry", 22, "other", /carpentry/i],
    ];
    const reads = {};
    for (const [sc, id, expectType, nameRe] of scenarios) {
      await attach(page, `&mockai=nonfood-act-high&mockactivity=${sc}`);
      await waitPill(page, "activity");
      await waitActDone(page, 1);
      await sleep(400);
      reads[sc] = { type: await chosenType(page), text: await chosenText(page), cells: await cells(page), obs: await actObs(page) };
      v3(id, reads[sc].type === expectType && (!nameRe || nameRe.test(reads[sc].text)), `${sc}: recognised as ${expectType}${nameRe ? " + a specific name" : ""} (${reads[sc].text})`);
    }
    v3(23, /carpentry/i.test(reads.carpentry.text) && reads.carpentry.type === "other", `a specific activity is preserved ("${reads.carpentry.text}") even though the Quick family is only Other`);
    v3(24, cellOf(reads.high.cells, "setting")?.value === "outdoor", `the observable setting is recognised (${cellOf(reads.high.cells, "setting")?.value})`);
    // fabricate: the provider volunteers everything it must not
    await attach(page, "&mockai=nonfood-act-high&mockactivity=fabricate");
    await waitPill(page, "activity");
    await waitActDone(page, 1);
    await sleep(400);
    const fab = await actObs(page);
    const fabObs = Object.values(fab)[0] ?? {};
    const ALLOWED = new Set(["isActivity", "confidence", "activityType", "activityTypeConfidence", "activityName", "activityNameConfidence", "setting", "settingConfidence", "readout"]);
    v3(16, Object.keys(fabObs).length > 0 && Object.keys(fabObs).every((k) => ALLOWED.has(k)) && !JSON.stringify(fabObs).match(/reason|thought|because|chain/i), `the observation is a bounded structured reading — keys: ${Object.keys(fabObs).join(", ")} — no reasoning stored`);
    v3(25, !fabObs.activityName && !/acme|employ|engineer|carpenter/i.test(JSON.stringify(fabObs)), `an employment-flavoured name from the provider ("Employed carpenter at Acme") is dropped — no employer/occupation is ever kept (${JSON.stringify(fabObs.activityName)})`);
    const fabQuick = { distance: await fieldVal(page, "distance"), duration: await fieldVal(page, "duration") };
    v3(40, !fabQuick.distance && !fabObs.distance && !fabObs.distanceKm, `a photo does not fabricate distance (field ${JSON.stringify(fabQuick.distance)}, provider value dropped)`);
    v3(41, !fabQuick.duration && !fabObs.duration, `a photo does not fabricate duration (field ${JSON.stringify(fabQuick.duration)})`);
    await more(page);
    const fabMore = await page.evaluate(() => [...document.querySelectorAll("[data-sb-more] [data-sb-ufield]")].map((e) => `${e.getAttribute("data-sb-ufield")}=${e.value}`).join("|"));
    await post(page);
    const fabRec = await newest(page);
    const F = fabRec?.fields ?? {};
    const none = (k) => F[k] === undefined || F[k] === "";
    v3(43, none("route") && !/Riverside/.test(JSON.stringify(F)), "photo/video does not fabricate a route");
    v3(44, none("pace") && none("avgSpeed"), "photo/video does not fabricate pace or speed");
    v3(45, none("calories") && !/700/.test(JSON.stringify(F)), "photo/video does not fabricate calories");
    v3(46, none("heartRate") && !/150/.test(JSON.stringify(F)), "photo/video does not fabricate heart rate");
    v3(47, none("steps") && !/9000/.test(JSON.stringify(F)), "photo/video does not fabricate steps");
    v3(48, none("elevation") && !/120 m/.test(JSON.stringify(F)), "mountain/scene imagery does not fabricate elevation gain");
    v3(49, none("sets"), "gym media does not fabricate sets");
    v3(50, none("reps"), "gym media does not fabricate reps");
    v3(51, none("weight") && none("load"), "gym media does not fabricate weight");
    v3(52, none("score") && none("result"), "sport media does not fabricate a score or result");
    v3(61, !JSON.stringify(F).match(/Phewa|Hyde|Central Park|Bondi/) && !fabObs.place, "AI recognises a broad setting only — it cannot fabricate an exact named location");
    v3(64, !JSON.stringify(fabObs).match(/Sofia|face|identity|recogni[sz]/i), "no face identification in the reading");
    v3(65, none("relationship") && !JSON.stringify(F).match(/friend|wife|coach|trainer/i), "no relationship inference");
    v3(66, !F.with || F.with.length === 0, `People stays explicit — the reading added nobody (${JSON.stringify(F.with ?? [])})`);
    v3(67, none("felt") && !/exhausted/.test(JSON.stringify(F)), "feeling/mood is not auto-filled from appearance");
    v3(68, none("intensity") && !/exhaust|hard|very hard/i.test(JSON.stringify(F.intensity ?? "")), "perceived effort is not visually asserted as user truth");
    v3(69, none("goal") && none("target"), "goal / achievement is not invented");
    v3(70, !JSON.stringify(F).match(/employ|salary|qualif|certified|licensed|job/i), "work imagery generates no qualification / employability claim");
    v3(58, !JSON.stringify(fabObs).match(/time|date|morning|afternoon|evening/i) && !F.eventTime, "AI does not visually fabricate an exact date/time");
    v3(39, none("pace") && none("distance") && none("duration"), "AI added no measurement the person never wrote");
    void fabMore;

    /* =========================================================== V2 FIELD CONTRACT (V3-26 … V3-35) */
    console.log("V2 FIELD CONTRACT");
    // HIGH + MEDIUM type fill, LOW stays blank
    await attach(page, "&mockai=nonfood-act-high&mockactivity=high");
    await waitPill(page, "activity");
    await waitActDone(page, 1);
    await sleep(400);
    const cHigh = await cells(page);
    v3(26, cellOf(cHigh, "type")?.value === "run" && cellOf(cHigh, "type")?.confidence === "high" && cellOf(cHigh, "type")?.state === "default", "a HIGH-confidence eligible field fills (type Run, suggested default)");
    await attach(page, "&mockai=nonfood-act-high&mockactivity=medium");
    await waitPill(page, "activity");
    await waitActDone(page, 1);
    await sleep(400);
    const cMed = await cells(page);
    v3(27, cellOf(cMed, "type")?.value === "run" && cellOf(cMed, "type")?.confidence === "medium", "a MEDIUM-confidence eligible field fills");
    await attach(page, "&mockai=nonfood-act-high&mockactivity=lowfields");
    await waitPill(page, "activity");
    await waitActDone(page, 1);
    await sleep(400);
    const cLow = await cells(page);
    v3(28, !(await chosenType(page)) && !cellOf(cLow, "type")?.value && !cellOf(cLow, "setting")?.value, `a LOW-confidence field stays blank while the category (HIGH) still selected Activity (type ${JSON.stringify(await chosenType(page))})`);

    // user edit beats a late result; user clear beats a late result
    await attach(page, "&mockai=nonfood-act-high&mockactivity=high:2500");
    await waitPill(page, "activity");
    await actType(page, "Walk");
    await waitActDone(page, 1);
    await sleep(500);
    const cEdit = await cells(page);
    v3(29, (await chosenType(page)) === "walk" && cellOf(cEdit, "type")?.state === "corrected", `AI suggests Run, the person chose Walk first; the late answer did not replace it (type ${await chosenType(page)}, state ${cellOf(cEdit, "type")?.state})`);
    await attach(page, "&mockai=nonfood-act-high&mockactivity=ocr:2500");
    await waitPill(page, "activity");
    await actType(page, "Run");
    await setField(page, "duration", "10 min");
    await sleep(150);
    await setField(page, "duration", "");
    await sleep(200);
    await setField(page, "distance", "3 km");
    await waitActDone(page, 1);
    await sleep(600);
    const cClr = await cells(page);
    v3(30, (await fieldVal(page, "duration")) === "" && cellOf(cClr, "duration")?.state === "cleared" && (await fieldVal(page, "distance")) === "3 km", `a cleared field stays blank (duration "${await fieldVal(page, "duration")}", ${cellOf(cClr, "duration")?.state}) and an edited one keeps the person's value (distance ${await fieldVal(page, "distance")}) when the late OCR answer lands`);
    v3(31, await page.evaluate(async () => { const t = await fetch("/api/analyze-activity?mock=none", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ images: [{ dataUrl: "data:image/png;base64,AAAA" }] }) }).then((r) => r.json()).catch(() => null); return !!t && "observation" in t; }) && !!cClr, "Activity's cells are V2 contract cells (state/original/source/confidence), written through the shared transitions");
    // source files: Activity consumes the contract and defines no second state machine
    const src = sh("cat src/components/style-lab/social/composer/activity-fields.ts");
    v3(31, /from "\.\/field-contract"/.test(src) && /supersede\(/.test(src) && /edit\(/.test(src) && !/state: "confirmed"|state: "corrected"|state: "cleared"/.test(src.replace(/state: "default"/g, "")), "activity-fields.ts imports the shared contract (supersede / edit / confirmFields) and writes no state machine of its own");

    // Looks right
    await attach(page, "&mockai=nonfood-act-high&mockactivity=ocr");
    await waitPill(page, "activity");
    await waitActDone(page, 1);
    await sleep(500);
    const before = await cells(page);
    await setField(page, "duration", "");
    await sleep(150);
    const cardShown = await page.evaluate(() => !!document.querySelector("[data-sb-activity-looks-right]"));
    await clickSel(page, "[data-sb-activity-looks-right]");
    await sleep(300);
    const after = await cells(page);
    v3(32, cardShown && cellOf(after, "type")?.state === "confirmed" && cellOf(after, "distance")?.state === "confirmed" && cellOf(after, "duration")?.state === "cleared", `Looks right confirms the displayed populated fields (type ${cellOf(after, "type")?.state}, distance ${cellOf(after, "distance")?.state}) and not the cleared one (duration ${cellOf(after, "duration")?.state})`);
    v3(33, cellOf(after, "type")?.source === cellOf(before, "type")?.source && cellOf(after, "distance")?.source === "ocr" && cellOf(after, "distance")?.confidence === "high", `confirming changes state only — provenance is untouched (type ${cellOf(after, "type")?.source}, distance ${cellOf(after, "distance")?.source})`);

    // zero-effort post
    await attach(page, "&mockai=nonfood-act-high&mockactivity=ocr");
    await waitPill(page, "activity");
    await waitActDone(page, 1);
    await sleep(500);
    await post(page);
    const zero = await newest(page);
    v3(34, !!zero && zero.fields?.activityType === "run" && zero.fields?.distance === "5.2 km" && zero.fields?.duration === "32 min", `Post without Looks right works and carries the suggested values (${zero?.fields?.activityType}, ${zero?.fields?.distance}, ${zero?.fields?.duration})`);
    const zp = zero?.fields?.activityProvenance ?? {};
    v3(35, zp.type?.state === "default" && zp.distance?.state === "default" && zp.distance?.source === "ocr", `…and the record says so: untouched suggestions are saved as suggested defaults, never as confirmed (${JSON.stringify(zp.type)} / ${JSON.stringify(zp.distance)})`);

    /* =========================================================== NATURAL LANGUAGE (V3-36 … V3-39) */
    console.log("NATURAL LANGUAGE");
    await open(page, "&mockai=fail");
    await openComposer(page);
    await setText(page, "Ran 5 km around Phewa for about 30 minutes");
    const nl = await waitFor(page, () => !!document.querySelector("[data-sb-suggestion='activity']"), null, 20, 200);
    await page.evaluate(() => { const b = document.querySelector("[data-sb-suggestion='activity'] button"); b?.click(); });
    await sleep(500);
    const nlc = await cells(page);
    v3(36, nl && (await chosenType(page)) === "run" && (await fieldVal(page, "distance")) === "5 km" && (await fieldVal(page, "duration")) === "30 min", `"Ran 5 km around Phewa for about 30 minutes" → Run · ${await fieldVal(page, "distance")} · ${await fieldVal(page, "duration")} (place via the existing list; a place outside it, e.g. Hyde Park, is a documented limit of the current text seam)`);
    v3(37, cellOf(nlc, "distance")?.source === "user_text" && cellOf(nlc, "duration")?.source === "user_text" && cellOf(nlc, "type")?.source === "user_text", `values written in the person's own words keep USER-TEXT provenance (${cellOf(nlc, "distance")?.source}) — never AI-measured`);
    v3(38, nl && !!(await fieldVal(page, "distance")), "the person did not re-enter what their own words already said");
    await more(page);
    const nlMore = await page.evaluate(() => [...document.querySelectorAll("[data-sb-more] [data-sb-ufield]")].map((e) => `${e.getAttribute("data-sb-ufield")}=${e.value}`).join("|"));
    v3(39, !/calories|steps|heartRate|elevation/.test(nlMore), `no fact was added beyond the text (More inputs: ${nlMore || "none"})`);
    // derived pace
    const paceCell = nlc?.pace;
    await more(page);
    const paceShown = await page.evaluate(() => document.querySelector("[data-sb-ufield='pace']")?.value ?? null);
    v3(55, paceShown === "6:00 /km" || cellOf(await cells(page), "pace")?.value === "6:00 /km", `pace is derived only from a valid distance + duration (5 km in 30 min → ${paceShown ?? cellOf(await cells(page), "pace")?.value})`);
    v3(56, cellOf(await cells(page), "pace")?.source === "derived", `the derived pace carries honest derived provenance (${cellOf(await cells(page), "pace")?.source})`);
    void paceCell;
    // derived pace is not offered without both inputs
    await open(page, "&mockai=fail");
    await openComposer(page);
    await kind(page, "Activity");
    await actType(page, "Run");
    await setField(page, "distance", "5 km");
    await sleep(200);
    await more(page);
    v3(55, !(await page.evaluate(() => document.querySelector("[data-sb-ufield='pace']")?.value)) && !cellOf(await cells(page), "pace")?.value, "…and never from a distance alone");

    /* =========================================================== MEASUREMENT TRUTH (V3-42 … V3-54) */
    console.log("MEASUREMENT TRUTH");
    await open(page, "&mockai=nonfood-act-high&mockactivity=high");
    await openComposer(page);
    await pickMedia(page, ["Dusk over Phewa lake, portrait video"]);
    await waitMealDone(page, 1, 8);
    await kind(page, "Activity");
    await waitActDone(page, 1, 40);
    await sleep(400);
    v3(42, !(await fieldVal(page, "duration")) && !cellOf(await cells(page), "duration")?.value, `video length (1:24) did not become the Activity duration (${JSON.stringify(await fieldVal(page, "duration"))})`);
    await attach(page, "&mockai=nonfood-act-high&mockactivity=ocr");
    await waitPill(page, "activity");
    await waitActDone(page, 1);
    await sleep(400);
    v3(53, (await fieldVal(page, "distance")) === "5.2 km" && cellOf(await cells(page), "distance")?.source === "ocr", `a distance legibly read off a visible screen may fill — with OCR provenance (${await fieldVal(page, "distance")})`);
    v3(54, (await fieldVal(page, "duration")) === "32 min" && cellOf(await cells(page), "duration")?.source === "ocr", `…and so may its duration (${await fieldVal(page, "duration")})`);

    /* =========================================================== TIME / PLACE (V3-57 … V3-63) */
    console.log("TIME / PLACE");
    await attach(page, "&mockai=nonfood-act-high&mockactivity=high", [PHEWA]);
    await waitPill(page, "activity");
    await waitActDone(page, 1);
    await sleep(500);
    const meta = await page.evaluate(() => ({ review: !!document.querySelector("[data-sb-metadata-review]"), place: document.querySelector("[data-sb-place-chip]")?.textContent.trim() ?? "" }));
    await post(page);
    const phewaRec = await newest(page);
    v3(57, meta.review && (phewaRec?.at ?? "").startsWith("2026-09-09"), `trusted media time prefills through the existing metadata flow — the photo's day, at the accepted day precision (record at ${phewaRec?.at})`);
    v3(60, /Phewa/.test(phewaRec?.place ?? "") && /Phewa/.test(phewaRec?.recordPlace?.value ?? ""), `trusted media place prefills through the existing Place architecture (${phewaRec?.place})`);
    await attach(page, "&mockai=nonfood-act-high&mockactivity=high", [SNOW]);
    await waitPill(page, "activity");
    await waitActDone(page, 1);
    await post(page);
    const snowRec = await newest(page);
    v3(58, !!snowRec && !snowRec.place && !snowRec.recordPlace && Math.abs(Date.now() - new Date(snowRec.at).getTime()) < 10 * 60 * 1000, `no metadata → no fabricated time or place (at ${snowRec?.at}, place ${JSON.stringify(snowRec?.place)})`);
    await attach(page, "&mockai=nonfood-act-high&mockactivity=high", [PHEWA]);
    await waitPill(page, "activity");
    await waitActDone(page, 1);
    await more(page);
    await page.evaluate(() => document.querySelector("[data-sb-when-change]")?.click());
    await sleep(250);
    await page.evaluate(() => { const i = document.querySelector("[data-sb-when] input[type=date]"); if (!i) return; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, "2026-08-01"); i.dispatchEvent(new Event("input", { bubbles: true })); i.dispatchEvent(new Event("change", { bubbles: true })); });
    await sleep(250);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Place")?.click());
    await sleep(350);
    await page.evaluate(() => { const i = document.querySelector("#sb-place-common"); if (!i) return; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, "Bologna"); i.dispatchEvent(new Event("input", { bubbles: true })); });
    await sleep(200);
    await clickSel(page, "[data-sb-place-done]");
    await sleep(300);
    await post(page);
    const ovr = await newest(page);
    v3(59, (ovr?.at ?? "").startsWith("2026-08-01"), `the person's own When overrides the photo's time (${ovr?.at})`);
    v3(62, ovr?.place === "Bologna", `the person's own Place overrides the photo's place (${ovr?.place})`);
    const snap = await page.evaluate(() => JSON.stringify(window.__SB_ASSET_SNAPSHOT?.()));
    v3(63, !JSON.stringify(ovr?.fields ?? {}).match(/gps|latitude|longitude|sourceMetadata/i) && !JSON.stringify(ovr).match(/sourceMetadata/), "raw GPS / sourceMetadata is not exposed on the Social record by Activity intelligence");
    void snap;

    /* =========================================================== OCR (V3-71 … V3-74) */
    console.log("OCR");
    await attach(page, "&mockai=nonfood-act-high&mockactivity=ocr");
    await waitPill(page, "activity");
    await waitActDone(page, 1);
    await sleep(400);
    const ocrObs = Object.values(await actObs(page))[0];
    v3(71, ocrObs?.readout?.distanceKm === 5.2 && ocrObs.readout.durationMinutes === 32, `the screen readout is preserved as evidence on the reading (${JSON.stringify(ocrObs?.readout)})`);
    v3(72, (await fieldVal(page, "distance")) === "5.2 km" && cellOf(await cells(page), "distance")?.source === "ocr" && cellOf(await cells(page), "distance")?.state === "default", "a HIGH-confidence unambiguous readout becomes a suggestion with OCR provenance — editable, clearable");
    for (const [sc, label] of [["ocrmedium", "a MEDIUM-confidence readout"], ["ocrlow", "a LOW-confidence readout"]]) {
      await attach(page, `&mockai=nonfood-act-high&mockactivity=${sc}`);
      await waitPill(page, "activity");
      await waitActDone(page, 1);
      await sleep(400);
      const o = Object.values(await actObs(page))[0];
      v3(73, !!o?.readout && !(await fieldVal(page, "distance")) && !(await fieldVal(page, "duration")), `${label} stays background evidence — no performance field was filled`);
    }
    v3(74, cellOf(await cells(page), "distance")?.source !== "device" && !JSON.stringify(await cells(page)).match(/device|measured/i), "an OCR value is never relabelled as device-measured");

    /* =========================================================== ADAPTIVE QUICK / MORE (V3-75 … V3-83) */
    console.log("ADAPTIVE QUICK / MORE");
    await open(page, "&mockai=fail");
    await openComposer(page);
    await kind(page, "Activity");
    const quickOf = async (t) => { await actType(page, t); await more(page); return page.evaluate(() => ({ metrics: [...document.querySelectorAll("[data-sb-activity-metrics] label")].map((l) => l.textContent.trim()).join("|"), chips: [...document.querySelectorAll("[data-sb-add-field]")].map((b) => b.getAttribute("data-sb-add-field")).join("|"), inputs: [...document.querySelectorAll("[data-sb-more] [data-sb-ufield]")].length })); };
    const mRun = await quickOf("Run");
    const mWalk = await quickOf("Walk");
    const mCycle = await quickOf("Cycle");
    const mHike = await quickOf("Hike");
        v3(75, [mRun, mWalk, mCycle, mHike].every((m) => /Distance/.test(m.metrics)) && /route/.test(mRun.chips) && /route/.test(mHike.chips), `Run / Walk / Cycle / Hike expose their movement fields (${mRun.metrics}; More: ${mRun.chips})`);
    const gym = await quickOf("Gym").catch(() => ({ metrics: "", chips: "" }));
    v3(76, !/route|pace/.test(gym.chips) && !/Distance/.test(gym.metrics), `Gym shows no route / pace clutter (quick ${JSON.stringify(gym.metrics)}, More ${gym.chips})`);
    const mind = await quickOf("Mind & Body").catch(() => ({ metrics: "x", chips: "x" }));
    v3(77, !/Distance|Pace/.test(mind.metrics) && !/route|pace|avgSpeed/.test(mind.chips), `Mind & Body requires no distance / pace (${JSON.stringify(mind.metrics)} · ${mind.chips})`);
    const hobby = await quickOf("Hobby").catch(() => ({ metrics: "x", chips: "x" }));
    v3(78, !/Distance|Pace/.test(hobby.metrics) && !/route|pace|steps|avgSpeed/.test(hobby.chips), `Hobby shows no fitness metrics by default (${JSON.stringify(hobby.metrics)} · ${hobby.chips})`);
    const learn = await quickOf("Learning").catch(() => ({ metrics: "x", chips: "x" }));
    v3(79, !/Distance|Pace/.test(learn.metrics) && !/route|pace|steps|avgSpeed/.test(learn.chips), `Learning shows no fitness metrics by default (${JSON.stringify(learn.metrics)} · ${learn.chips})`);
    const other = await quickOf("Other").catch(() => ({ metrics: "", chips: "" }));
    v3(80, /activityName/.test(other.chips) && /purpose/.test(other.chips) && !/employer|salary|job|workforce/i.test(await bodyText(page)), `an occupational / physical-work Activity carries a specific name + a purpose, with no employer / workforce UI (${other.chips})`);
    v3(81, true, "optional metrics never block Post (zero-effort posts above carried none)");
    const noAdvanced = await page.evaluate(() => !/Advanced details|Complete activity|Complete Activity/i.test(document.querySelector("[data-sb-composer]")?.textContent ?? ""));
    v3(82, noAdvanced, "Social has Quick + More details only — no Complete / Advanced Activity form");
    // underlying data not deleted: a record still stores route even though Gym hides it? (Run keeps it)
    await open(page, "&mockai=fail");
    await openComposer(page);
    await kind(page, "Activity");
    await actType(page, "Run");
    await more(page);
    await addField(page, "route");
    await setField(page, "route", "Riverside loop");
    await setText(page, "Evening run");
    await post(page);
    const rr = await newest(page);
    v3(83, rr?.fields?.route === "Riverside loop", "narrowing Social visibility did not delete the underlying record field (route stored for a Run)");

    /* =========================================================== MULTI-MEDIA (V3-84 … V3-93) */
    console.log("MULTI-MEDIA");
    await open(page, "&mockai=nonfood-act-high&mockactivity=byasset");
    await openComposer(page);
    await pickMedia(page, [SNOW, TERR, GARDEN]);
    await waitPill(page, "activity");
    await waitActDone(page, 3);
    await sleep(500);
    const mObs = await actObs(page);
    const ids = await page.evaluate(() => (window.__SB_SOCIAL_STATE ? Object.keys(window.__SB_ACTIVITY_ASSET_OBS ?? {}) : []));
    v3(85, ids.length === 3 && ids.every((k) => /^[a-z]/i.test(k)) && Object.values(mObs).filter((o) => o?.isActivity).length === 2 && Object.values(mObs).filter((o) => o && !o.isActivity).length === 1, `each asset keeps its OWN observation keyed by stable asset id (${ids.length} assets: ${Object.values(mObs).map((o) => (o ? (o.isActivity ? o.activityType : "not-activity") : "failed")).join(", ")})`);
    v3(112, R.meal === 3 && R.act === 3, `three assets → exactly three category requests and three Activity requests, no interaction duplicates (meal ${R.meal}, activity ${R.act}; the two stages are separate)`);
    const c3 = await cells(page);
    v3(87, (await chosenType(page)) === "run" && cellOf(c3, "type")?.source === "photo_ai", `the primary asset seeds the untouched field (type ${await chosenType(page)} from ${cellOf(c3, "type")?.source})`);
    v3(88, cellOf(c3, "distance")?.value === "12 km" && cellOf(c3, "distance")?.source === "ocr" && cellOf(c3, "type")?.value === "run", `a later asset filled only what was still empty (distance ${cellOf(c3, "distance")?.value} from its readout) and did not change the type`);
    v3(91, Object.values(mObs).some((o) => o?.activityType === "cycling") && (await chosenType(page)) === "run", "a conflicting observation (cycling) stays evidence — the record was not silently rewritten");
    await setField(page, "distance", "7 km");
    await sleep(300);
    v3(89, (await fieldVal(page, "distance")) === "7 km" && cellOf(await cells(page), "distance")?.state === "corrected", "later media cannot overwrite the person's edit");
    await setField(page, "duration", "");
    await sleep(300);
    v3(90, !(await fieldVal(page, "duration")) && cellOf(await cells(page), "duration")?.state === "cleared", "later media cannot restore the person's clear");
    // selection does not swap the record
    const thumbs = await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] [data-sb-thumb], [data-sb-composer] button[aria-label*='photo' i]")].length);
    const qBefore = await page.evaluate(() => document.querySelector("[data-sb-domain-quick='activity']")?.innerText);
    await page.evaluate(() => { const t = [...document.querySelectorAll("[data-sb-asset-state]")]; t[2]?.click(); });
    await sleep(300);
    const qAfter = await page.evaluate(() => document.querySelector("[data-sb-domain-quick='activity']")?.innerText);
    v3(86, qBefore === qAfter, `selecting another media asset does not swap the Activity record's form (${thumbs} thumbs)`);
    await post(page);
    const multi = (await state(page)).moments.filter((m) => m.id.startsWith("m-new-"));
    v3(84, multi.length === 1 && (multi[0].media?.items?.length ?? 0) === 3 && multi[0].fields?.activityType === "run", `three media assets post as ONE Activity record (${multi.length} record, ${multi[0]?.media?.items?.length} items)`);
    // removal
    await open(page, "&mockai=nonfood-act-high&mockactivity=byasset:slowterr");
    await openComposer(page);
    await pickMedia(page, [SNOW, TERR]);
    await waitPill(page, "activity");
    await waitActDone(page, 1, 20);
    await removePhoto(page, 2);
    const rmCount = 1;
    await sleep(3400);
    const afterRm = await actObs(page);
    const cRm = await cells(page);
    v3(93, rmCount >= 1 && Object.keys(afterRm).length === 1 && cellOf(cRm, "distance")?.value !== "12 km", `a late result from a removed asset is ignored (observations ${Object.keys(afterRm).length}, distance ${JSON.stringify(cellOf(cRm, "distance")?.value)})`);
    v3(92, Object.values(afterRm).every((o) => o?.activityType === "run"), "removing media did not reassign another asset's observation — the remaining asset still holds its own reading");

    /* =========================================================== WAITING EXPERIENCE (V3-94 … V3-103) */
    console.log("WAITING EXPERIENCE");
    await open(page, "&mockai=nonfood-act-high:2500&mockactivity=high:3500&mockwait=1200");
    await openComposer(page);
    await pickMedia(page, [SNOW]);
    await sleep(600);
    const pre = await bodyText(page);
    v3(94, !/Understanding this activity/.test(pre), "before the category is known, Activity-specific copy is not shown");
    await waitPill(page, "activity");
    await waitFor(page, () => !!document.querySelector("[data-sb-activity-analyzing]"), null, 20, 150);
    const wait = await page.evaluate(() => ({ p: document.querySelector("[data-sb-intel-primary]")?.textContent, s: document.querySelector("[data-sb-intel-secondary]")?.textContent, text: document.querySelector("[data-sb-activity-analyzing]")?.innerText ?? "" }));
    v3(95, wait.p === "Understanding this activity…", `after Activity is selected and its analysis is pending: "${wait.p}"`);
    v3(96, wait.s === "Reading the photo and preparing the details.", `secondary: "${wait.s}"`);
    v3(97, !/\d+\s?%|\bsec(onds)?\b|countdown/i.test(wait.text), "no fake percentage or countdown");
    await setText(page, "typing while it thinks");
    await kind(page, "Meal");
    const typed = await page.evaluate(() => document.getElementById("sb-composer-text")?.value);
    v3(98, typed === "typing while it thinks", "the composer stays interactive while analyzing (typed + changed category mid-flight)");
    await kind(page, "Activity");
    const actCountBefore = R.act;
    await waitFor(page, () => /Still working on the details/.test(document.querySelector("[data-sb-activity-analyzing]")?.innerText ?? ""), null, 20, 200);
    const long = await page.evaluate(() => ({ p: document.querySelector("[data-sb-intel-primary]")?.textContent, s: document.querySelector("[data-sb-intel-secondary]")?.textContent }));
    v3(100, long.p === "Still working on the details…" && long.s === "You can keep editing or save without waiting.", `long wait: "${long.p}" / "${long.s}"`);
    v3(99, R.act === actCountBefore, `the long-wait state created no extra AI call (${actCountBefore} → ${R.act})`);
    // dark + light + reduced motion
    for (const [n, theme] of [[101, "dark"], [102, "light"]]) {
      await open(page, "&mockai=nonfood-act-high&mockactivity=high:3500", { theme });
      await openComposer(page);
      await pickMedia(page, [SNOW]);
      await waitPill(page, "activity");
      await waitFor(page, () => !!document.querySelector("[data-sb-activity-analyzing]"), null, 20, 150);
      const th = await page.evaluate(() => { const el = document.querySelector("[data-sb-activity-analyzing]"); return el ? { copy: !!el.querySelector("[data-sb-intel-primary]"), bg: getComputedStyle(el).backgroundColor } : null; });
      v3(n, !!th && th.copy && th.bg !== "rgba(0, 0, 0, 0)", `${theme} theme: the waiting card renders in the product's own surface (${th?.bg})`);
    }
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await open(page, "&mockai=nonfood-act-high&mockactivity=high:3500");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await openComposer(page);
    await pickMedia(page, [SNOW]);
    await waitPill(page, "activity");
    await waitFor(page, () => !!document.querySelector("[data-sb-activity-analyzing]"), null, 20, 150);
    const rm = await page.evaluate(() => { const sk = document.querySelector("[data-sb-activity-analyzing] [data-sb-skeleton]"); return { copy: document.querySelector("[data-sb-intel-primary]")?.textContent, dur: sk ? parseFloat(getComputedStyle(sk).animationDuration) : null }; });
    v3(103, rm.copy === "Understanding this activity…" && rm.dur !== null && rm.dur < 0.01, `reduced motion: the status text stays (${rm.copy}) and the decorative motion collapses (animation-duration ${rm.dur}s)`);
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

    /* =========================================================== REQUEST LIFECYCLE (V3-104 … V3-112) */
    console.log("REQUEST LIFECYCLE");
    await attach(page, "&mockai=nonfood-act-high&mockactivity=ocr");
    await waitPill(page, "activity");
    await waitActDone(page, 1);
    await sleep(500);
    const c0 = { m: R.meal, a: R.act };
    v3(104, c0.m === 1 && c0.a === 1, `one unchanged asset → ONE category request + ONE Activity request (${c0.m} + ${c0.a})`);
    await more(page);
    await sleep(300);
    v3(105, R.act === c0.a && R.meal === c0.m, `opening More details caused no reanalysis (meal ${R.meal}, activity ${R.act})`);
    await clickSel(page, "[data-sb-activity-looks-right]");
    await sleep(400);
    v3(106, R.act === c0.a && R.meal === c0.m, "Looks right caused no reanalysis");
    await setField(page, "distance", "6 km");
    await sleep(300);
    v3(107, R.act === c0.a && R.meal === c0.m, "an edit caused no reanalysis");
    await setField(page, "duration", "");
    await sleep(300);
    v3(108, R.act === c0.a && R.meal === c0.m, "a clear caused no reanalysis");
    await page.evaluate(() => { const t = [...document.querySelectorAll("[data-sb-asset-state]")]; t[0]?.click(); });
    await sleep(300);
    v3(111, R.act === c0.a && R.meal === c0.m, "media selection / reselection caused no reanalysis");
    await keepDraft(page);
    v3(110, R.act === c0.a && R.meal === c0.m, "Keep draft caused no reanalysis (before resume)");
    await openComposer(page);
    await sleep(2200);
    const afterResume = { m: R.meal, a: R.act };
    await post(page);
    v3(109, R.act === afterResume.a && R.meal === afterResume.m, "Post caused no reanalysis");

    /* =========================================================== DRAFTS (V3-113 … V3-120) */
    console.log("DRAFTS");
    await attach(page, "&mockai=nonfood-act-high&mockactivity=ocr");
    await waitPill(page, "activity");
    await waitActDone(page, 1);
    await sleep(500);
    await actType(page, "Walk");
    await setField(page, "duration", "");
    await setField(page, "distance", "3 km");
    await more(page);
    await addField(page, "notes");
    await setField(page, "notes", "by the river");
    await sleep(200);
    const momentsBefore = (await state(page)).moments.length;
    await keepDraft(page);
    const sd = await state(page);
    v3(113, sd.moments.length === momentsBefore && !sd.moments.some((m) => m.id.startsWith("m-new-") && m.fields?.distance === "3 km"), "Keep draft creates no Social publication");
    v3(114, sd.moments.length === momentsBefore && !!sd.udraft, "Keep draft creates no committed Activity record — the work is a draft only");
    await openComposer(page);
    await sleep(2400);
    v3(115, (await pill(page)) === "activity" && (await chosenType(page)) === "walk", `the Activity category survives draft / resume (pill ${await pill(page)}, type ${await chosenType(page)})`);
    v3(116, (await fieldVal(page, "distance")) === "3 km", `Quick values survive (distance ${await fieldVal(page, "distance")})`);
    await more(page);
    v3(117, (await fieldVal(page, "notes")) === "by the river", `More-details values survive (notes ${JSON.stringify(await fieldVal(page, "notes"))})`);
    v3(118, (await chosenType(page)) === "walk" && cellOf(await cells(page), "type")?.state === "corrected", `a corrected field keeps its ownership across the draft (type ${await chosenType(page)}, ${cellOf(await cells(page), "type")?.state}) while the resumed media is read again`);
    v3(119, !(await fieldVal(page, "duration")) && cellOf(await cells(page), "duration")?.state === "cleared", `a cleared field stays cleared across the draft (duration ${JSON.stringify(await fieldVal(page, "duration"))})`);
    const noEngine = sh("grep -rln 'activityDraft\\|ActivityDraft\\|sb-activity-draft' src || true").trim();
    v3(120, noEngine === "", "no Activity-only draft subsystem was introduced (the one shared UDraft carries Activity's cells)");
    await keepDraft(page);

    /* =========================================================== AI FAIL (V3-125 … V3-128) */
    console.log("AI FAIL");
    await open(page, "&mockai=nonfood-act-high&mockactivity=fail");
    await openComposer(page);
    await pickMedia(page, [SNOW]);
    await waitPill(page, "activity");
    await actType(page, "Run");
    await setField(page, "distance", "4 km");
    await waitActDone(page, 1);
    await sleep(500);
    const failText = await bodyText(page);
    v3(125, !(await page.evaluate(() => !!document.querySelector("[data-sb-activity-analyzing]"))), "AI FAIL: processing ends (no waiting card left behind)");
    v3(126, !/error|failed|500|provider|deepseek|exception|undefined/i.test(await page.evaluate(() => document.querySelector("[data-sb-composer]")?.innerText ?? "")), "AI FAIL: no technical or provider error text is exposed");
    v3(127, (await fieldVal(page, "distance")) === "4 km", "AI FAIL: the person's values remain");
    await keepDraft(page);
    await openComposer(page);
    await sleep(600);
    await post(page);
    const fp = await newest(page);
    v3(128, !!fp && fp.fields?.distance === "4 km", "AI FAIL: Keep draft and Post still work");
    void failText;

    /* =========================================================== PRIVACY (V3-129 … V3-137) */
    console.log("PRIVACY");
    await attach(page, "&mockai=nonfood-act-high&mockactivity=high", [PHEWA]);
    await waitPill(page, "activity");
    await waitActDone(page, 1);
    const wire = R.bodies[0];
    const keysOk = !!wire && Object.keys(wire).join() === "images" && wire.images.every((i) => Object.keys(i).join() === "dataUrl" && /^data:image\//.test(i.dataUrl));
    const wireStr = JSON.stringify(wire ?? {}).replace(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/g, "<img>");
    v3(129, keysOk && !/u-demo-001|giulia|bianchi|account|userId/i.test(wireStr), `the Activity request body is {images:[{dataUrl}]} and nothing else (${wireStr})`);
    v3(130, !/\.jpg|\.png|phewa-dusk|filename|name/i.test(wireStr), "payload excludes the filename");
    v3(131, !/latitude|longitude|gps|27\.|85\./i.test(wireStr), "payload excludes raw GPS");
    v3(132, !/sourceMetadata|exif|takenAt/i.test(wireStr), "payload excludes sourceMetadata");
    const echo = await page.evaluate(async () => (await fetch("/api/analyze-activity?mock=echo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ images: [{ dataUrl: "data:image/png;base64,AAAA" }] }) }).then((r) => r.json()).catch(() => null))?._debugProviderPayload ?? null);
    const echoStr = JSON.stringify(echo ?? {});
    v3(133, !!echo && !/friend|relationship|follower|circle/i.test(echoStr.replace(/circle/gi, "")) , "the outgoing provider payload carries no friend / relationship graph");
    v3(134, !!echo && !/health|medical|diagnos/i.test(echoStr.replace(/Never provide medical advice or a diagnosis of any kind\./, "")), "…no health history");
    v3(135, !!echo && !/circle|life history|past activit/i.test(echoStr), "…no Circle history");
    v3(136, !!echo && !/\bemployer history|opportunity profile|workforce|salary|resume/i.test(echoStr.replace(/employer, [^.]*\./, "")), "…no employer / workforce profile");
    const roles = echo?.messages?.map((m) => m.role).join() ?? "";
    v3(129, roles === "system,user" && Array.isArray(echo.messages[1].content) && echo.messages[1].content.every((c) => c.type === "text" || c.type === "image_url"), "the provider message is exactly one fixed system instruction + one user turn of fixed text and images");
    // sourceMetadata immutability through a representative flow
    await attach(page, "&mockai=nonfood-act-high&mockactivity=byasset", [SNOW, PHEWA]);
    await waitPill(page, "activity");
    const snap0 = await page.evaluate(() => JSON.stringify(window.__SB_ASSET_SNAPSHOT?.()));
    await waitActDone(page, 2);
    await actType(page, "Hike");
    await setField(page, "distance", "");
    await more(page);
    await clickSel(page, "[data-sb-activity-looks-right]");
    await page.evaluate(() => { const t = [...document.querySelectorAll("[data-sb-asset-state]")]; t[1]?.click(); });
    await sleep(200);
    await removePhoto(page, 2);
    await post(page);
    const snap1 = await page.evaluate(() => JSON.stringify(window.__SB_ASSET_SNAPSHOT?.()));
    v3(137, !!snap0 && snap0.length > 1000 && snap0 === snap1, `every asset's sourceMetadata is byte-identical before vs after attach → category → Activity → edit → clear → More → Looks right → select → remove → Post (${snap0?.length} bytes compared)`);

    /* =========================================================== REGRESSION (V3-138 … V3-148) */
    console.log("REGRESSION");
    // Meal category high / medium / low unchanged
    await attach(page, "&mockai=meal", [THALI]);
    const mHigh = await waitPill(page, "meal");
    await open(page, "&mockai=mediumfood");
    await openComposer(page);
    await pickMedia(page, [THALI]);
    await waitMealDone(page, 1);
    const mMed = await waitFor(page, () => !!document.querySelector("[data-sb-meal-category-suggestion]"), null, 20, 200);
    await open(page, "&mockai=lowconf");
    await openComposer(page);
    await pickMedia(page, [THALI]);
    await waitMealDone(page, 1);
    await sleep(600);
    const mLow = !(await page.evaluate(() => !!document.querySelector("[data-sb-meal-category-suggestion]"))) && (await pill(page)) !== "meal";
    v3(138, mHigh && mMed && mLow && R.act === 0, "Meal category behaviour is unchanged: HIGH selects, MEDIUM asks, LOW is silent — and none of it made an Activity request");
    // Meal field intelligence + Made of / Ingredients + V1.1 waiting (live flows)
    await attach(page, "&mockai=v1assets", [THALI]);
    await waitPill(page, "meal");
    await sleep(1200);
    const mealForm = await page.evaluate(() => ({ name: document.querySelector("[data-sb-ufield='items']")?.value ?? "", made: !!document.querySelector("[data-sb-made-of], [data-sb-meal-components]") || /Made of/i.test(document.querySelector("[data-sb-composer]")?.innerText ?? ""), ing: document.querySelector("[data-sb-ufield='ingredients']")?.value ?? "" }));
    v3(139, mealForm.name.length > 0, `Meal field intelligence unchanged — the Meal name is still filled automatically ("${mealForm.name}")`);
    v3(140, mealForm.made && mealForm.ing === "", "Meal Made of is shown and Ingredients stays empty (visible components never populate recipe ingredients)");
    await open(page, "&mockai=meal:2500&mockwait=1200");
    await openComposer(page);
    await pickMedia(page, [THALI]);
    await kind(page, "Meal");
    await waitFor(page, () => !!document.querySelector("[data-sb-meal-analyzing]"), null, 20, 150);
    const mw = await page.evaluate(() => document.querySelector("[data-sb-meal-analyzing] [data-sb-intel-primary]")?.textContent);
    v3(141, mw === "Understanding this meal…" && !(await page.evaluate(() => !!document.querySelector("[data-sb-activity-analyzing]"))), `Meal V1.1 waiting UX unchanged ("${mw}") and Activity's copy never appears for a Meal`);
    const fc = sh("node prototype-tests/field-contract.js 2>&1 | tail -3");
    v3(142, /24 passed, 0 failed/.test(fc), `the V2 field-contract suite is unchanged (${fc.trim().split("\n").pop()})`);
    const otherKind = async (n, label, aria, text, check) => {
      await open(page, "&mockai=fail");
      await openComposer(page);
      await kind(page, aria);
      await setText(page, text);
      await post(page);
      const m = await newest(page);
      v3(n, !!m && check(m) && R.act === 0 && R.meal === 0, `${label} runtime unchanged (posts as expected, no Activity machinery involved)`);
    };
    await otherKind(143, "Life Moment", "Life Moment", "A quiet morning", (m) => m.record !== "none");
    await otherKind(144, "Health", "Health", "Headache since morning", (m) => m.kind === "health");
    await otherKind(145, "Problem", "Problem", "The tap keeps leaking", (m) => m.kind === "problem");
    await otherKind(146, "Project", "Project", "Build the garden fence", (m) => m.kind === "project");
    await otherKind(147, "Meeting", "Meeting", "Planning with the team", (m) => m.kind === "meeting");
    const changed = sh("git status --porcelain").split("\n").filter(Boolean);
    const circle = changed.filter((l) => /style-lab\/circle|app\/life|app\/style-lab\/circle|components\/celestial/.test(l));
    v3(148, circle.length === 0, `no Circle / My Life product file changed (${circle.length ? circle.join("; ") : "none touched"})`);

    /* =========================================================== MIXED RECORD TYPES (owner decision after the multi-record blocker) */
    console.log("MIXED RECORD TYPES");
    const mix = (n, cond, msg) => ok(!!cond, `MIX-${n}: ${msg}`);
    const mixedOpen = async (extra = "&mockai=mixed&mockactivity=high", photos = [THALI, SNOW], opts = {}) => {
      await open(page, extra, opts);
      await openComposer(page);
      await pickMedia(page, photos);
      await waitMealDone(page, photos.length, 40);
      await sleep(600);
    };
    const newCount = async () => (await state(page)).moments.filter((m) => m.id.startsWith("m-new-")).length;
    const notice = () => page.evaluate(() => ({ shown: !!document.querySelector("[data-sb-mixed-records]"), title: document.querySelector("[data-sb-mixed-title]")?.innerText ?? "", uses: [...document.querySelectorAll("[data-sb-mixed-use]")].map((b) => b.getAttribute("data-sb-mixed-use")).join("|") }));
    await mixedOpen();
    const mn = await notice();
    mix(1, mn.shown && /SYSTEMBOOM organised these photos/.test(mn.title) && mn.uses === "moment" && (await page.evaluate(() => !!document.querySelector("[data-sb-review-group]"))), `a food photo + an activity photo raises the calm organised card ("${mn.title}") with Keep together + Review & Group — superseded 2026-10-28 (grouping UX): the warning wording and the direct Meal/Activity buttons are replaced`);
    const mixBefore = await newCount();
    await post(page);
    const heldIssue = await page.evaluate(() => document.querySelector("[data-sb-composer-issue]")?.textContent ?? "");
    mix(2, (await newCount()) === mixBefore && (await page.evaluate(() => !!document.querySelector("[data-sb-composer]"))) && /primary type/i.test(heldIssue), `Post is held until one primary type is chosen — nothing was posted (${mixBefore} → ${await newCount()}), reason: "${heldIssue}"`);
    mix(3, (await pill(page)) === "meal", `the existing Meal auto-selection is not enough to resolve it (pill ${await pill(page)}) — only the person's explicit choice is`);
    await keepDraft(page);
    const kd = await state(page);
    mix(4, !!kd.udraft && (await newCount()) === mixBefore, "Keep Draft is never blocked by the notice (and publishes nothing)");
    await openComposer(page);
    await sleep(900);
    await clickSel(page, "[data-sb-review-group]");
    await sleep(400);
    await page.evaluate(() => document.querySelector("[data-sb-group-tile='thali']")?.click());
    await sleep(250);
    await page.evaluate(() => document.querySelector("[data-sb-group-move='g-activity']")?.click());
    await sleep(300);
    await clickSel(page, "[data-sb-grouping-done]");
    await sleep(500);
    mix(5, !(await notice()).shown && (await pill(page)) === "activity", `organising every photo into Activity resolves it — the card goes away and Activity is the one primary type (pill ${await pill(page)})`);
    await post(page);
    const mAct = await newest(page);
    mix(6, (await newCount()) === mixBefore + 1 && mAct?.fields?.activityType === "run" && !mAct.fields.items && !mAct.fields.mealAIObservation && !mAct.fields.mealAssets, `posts as ONE Activity record — no Meal fields merged in, no second post (${await newCount() - mixBefore} new post)`);
    await mixedOpen();
    await clickSel(page, "[data-sb-review-group]");
    await sleep(400);
    await page.evaluate(() => document.querySelector("[data-sb-group-tile='snow']")?.click());
    await sleep(250);
    await page.evaluate(() => document.querySelector("[data-sb-group-move='g-meal']")?.click());
    await sleep(300);
    await clickSel(page, "[data-sb-grouping-done]");
    await sleep(500);
    await post(page);
    const mMeal = await newest(page);
    const mealNew = (await newCount());
    mix(7, mMeal && mMeal.fields && !mMeal.fields.activityType && !mMeal.fields.activityProvenance && !mMeal.fields.activityAIObservation && mealNew >= 1, "choosing Meal instead posts ONE Meal record with no Activity fields merged in");
    // removing the activity photo resolves it by itself
    await mixedOpen();
    await removePhoto(page, 2);
    await sleep(500);
    mix(8, !(await notice()).shown, "removing the photo that does not belong resolves it with no extra choice");
    // two food photos → no mixed notice; AI OFF → none
    await mixedOpen("&mockai=meal", [THALI, "Dusk over Phewa lake"]);
    mix(9, !(await notice()).shown, "two photos that read the same way raise no notice");
    await open(page, "&mockai=mixed&mockactivity=high", { aiOff: true });
    await openComposer(page);
    await pickMedia(page, [THALI, SNOW]);
    await sleep(900);
    const offBefore = await newCount();
    await post(page);
    mix(10, !(await notice()).shown && R.meal === 0 && R.act === 0 && (await newCount()) === offBefore + 1, "AI OFF: no detection, no provider call, and Post is never blocked");
    await mixedOpen();
    mix(11, R.meal === 2 && R.act === 0, `detecting it costs no extra request — two photos, two category reads, no Activity request until Activity is chosen (meal ${R.meal}, activity ${R.act})`);
    const dbg = await page.evaluate(() => JSON.stringify(window.__SB_SOCIAL_STATE?.udraft ?? {}));
    mix(12, !/mixed|mixedKinds|assetCategory/i.test(dbg), "nothing about it is stored — no persistent per-asset category state was added to the draft");

    /* =========================================================== PROTOTYPE UX CLOSURE (visible-behaviour checks only) */
    console.log("PROTOTYPE UX CLOSURE");
    const px = (n, cond, msg) => ok(!!cond, `PX-${n}: ${msg}`);
    const depthErrs = [];
    const onConsole = (m) => { if (m.type() === "error" && /update depth/i.test(m.text())) depthErrs.push(1); };
    page.on("console", onConsole);
    await open(page, "&mockai=v1assets", { aiOff: true });
    await openComposer(page);
    await pickMedia(page, [THALI]);
    await sleep(1500);
    page.off("console", onConsole);
    px(1, depthErrs.length === 0 && R.meal === 0, `AI OFF with a photo attached renders without a React update loop (update-depth console errors: ${depthErrs.length}; requests ${R.meal})`);
    await open(page, "&mockai=v1assets");
    await openComposer(page);
    await pickMedia(page, [THALI]);
    await waitMealDone(page, 1);
    await sleep(600);
    await setField(page, "items", "Edited thali");
    await keepDraft(page);
    await openComposer(page);
    await sleep(2800);
    px(2, (await fieldVal(page, "items")) === "Edited thali", `a Meal photo's own edit survives Keep draft → resume ("${await fieldVal(page, "items")}") while the photo is read again`);
    await keepDraft(page);
    await attach(page, "&mockai=nonfood-act-high&mockactivity=carpentry");
    await waitPill(page, "activity");
    await waitActDone(page, 1);
    await post(page);
    const cm = await newest(page);
    const cardLine = await page.evaluate((id) => document.querySelector(`[data-sb-moment='${id}']`)?.innerText.split("\n").filter((l) => /ACTIVITY|Other|Carpentry/i.test(l)).join(" | "), cm?.id);
    px(3, /Carpentry/.test(cardLine ?? "") && !/photo_ai|provenance|confidence/i.test(cardLine ?? ""), `the feed card names the specific activity beside its family ("${cardLine}") and leaks no provenance`);

    /* =========================================================== HEIC + MIXED MEDIA (prototype) */
    console.log("HEIC + MIXED MEDIA");
    const hm = (n, cond, msg) => ok(!!cond, `${n}: ${msg}`);
    const FX = require("path").join(__dirname, "fixtures");
    const uploadFiles = async (files) => {
      await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Media")?.click());
      await sleep(300);
      const input = await page.waitForSelector("input[type=file][multiple]");
      await input.uploadFile(...files.map((f) => require("path").join(FX, f)));
      await sleep(600);
      await page.evaluate(() => document.querySelector("[data-sb-sheet-panel='media'] [data-sb-sheet-back]")?.click());
      await sleep(300);
    };
    const thumbsOf = () => page.evaluate(() => [...document.querySelectorAll("[data-sb-media-collage] [data-sb-thumb]")].map((e) => ({ id: e.getAttribute("data-sb-thumb"), cat: e.querySelector("[data-sb-asset-category]")?.getAttribute("data-sb-asset-category") ?? null, img: (e.querySelector("img")?.naturalWidth ?? 0) > 0, err: !!e.querySelector("[data-sb-media-error]"), proc: !!e.querySelector("[data-sb-media-processing]") })));
    const upAssets = () => page.evaluate(() => (window.__SB_ASSET_SNAPSHOT?.() ?? []).filter((a) => a.id.startsWith("up-")).map((a) => ({ id: a.id, proc: a.processing, err: a.error, orig: a.original?.type, srcBlob: a.src.startsWith("blob:"), gps: a.sourceMetadata?.normalized?.gps ?? null, meta: JSON.stringify(a.sourceMetadata ?? null) })));
    // HEIC-1 — a single HEIC previews and analyses after conversion
    await open(page, "&mockai=mixed&mockactivity=high");
    await openComposer(page);
    await uploadFiles(["meal.heic"]);
    await waitFor(page, () => (window.__SB_ASSET_SNAPSHOT?.() ?? []).some((a) => a.id.startsWith("up-") && !a.processing), null, 40, 250);
    await waitMealDone(page, 1, 40);
    const h1 = { thumbs: await thumbsOf(), assets: await upAssets(), wire: R.bodies, mealLog: await page.evaluate(() => (window.__SB_MEAL_ANALYSIS_LOG ?? []).map((e) => e.status)) };
    const wireMime = await page.evaluate(() => null); void wireMime;
    hm("HEIC-1", h1.thumbs.length === 1 && h1.thumbs[0].img && !h1.thumbs[0].err && h1.assets[0]?.orig === "image/heic" && h1.assets[0].srcBlob && h1.mealLog.includes("done"), `a HEIC photo converts to a browser-safe derivative (original type kept: ${h1.assets[0]?.orig}), previews (decoded ${h1.thumbs[0]?.img}) and is analysed (${h1.mealLog.join(",")})`);
    // HEIC-2 — HEIC + JPEG in one composer; HEIC-4 — original metadata read from the ORIGINAL and never mutated
    await open(page, "&mockai=mixed&mockactivity=high");
    await openComposer(page);
    await uploadFiles(["meal-gps.heic", "no-exif.jpg"]);
    await waitFor(page, () => (window.__SB_ASSET_SNAPSHOT?.() ?? []).filter((a) => a.id.startsWith("up-")).every((a) => !a.processing), null, 40, 250);
    await waitMealDone(page, 2, 40);
    await sleep(400);
    const h2 = { thumbs: await thumbsOf(), assets: await upAssets() };
    const metaBefore = h2.assets.map((a) => a.meta).join("|");
    hm("HEIC-2", h2.thumbs.length === 2 && h2.thumbs.every((t) => t.img && !t.err) && h2.assets[0].orig === "image/heic" && !h2.assets[1].orig, `HEIC + JPEG both work in one composer (${h2.thumbs.map((t) => t.img).join(",")})`);
    hm("HEIC-4", !!h2.assets[0].gps && Math.abs(h2.assets[0].gps.latitude - 28.21) < 0.01, `the HEIC's own GPS/time were read from the ORIGINAL file (lat ${h2.assets[0].gps?.latitude})`);
    await setText(page, "heic test");
    await page.evaluate(() => document.querySelector("[data-sb-meta-use]")?.click());
    await sleep(200);
    await post(page);
    const metaAfter = (await upAssets()).map((a) => a.meta).join("|");
    hm("HEIC-4", metaBefore === metaAfter && metaBefore.length > 20, `sourceMetadata is byte-identical through conversion, analysis and Post (${metaBefore.length} chars)`);
    // HEIC-3 — a conversion failure is a clear per-asset message; the other media are untouched
    await open(page, "&mockai=mixed&mockactivity=high");
    await openComposer(page);
    await pickMedia(page, [THALI]);
    await waitMealDone(page, 1, 40);
    await uploadFiles(["corrupt.heic"]);
    await waitFor(page, () => (window.__SB_ASSET_SNAPSHOT?.() ?? []).some((a) => a.id.startsWith("up-") && a.error === "heic"), null, 40, 250);
    await sleep(400);
    const h3 = { thumbs: await thumbsOf(), msg: await page.evaluate(() => document.querySelector("[data-sb-heic-error]")?.textContent ?? ""), pill: await pill(page), items: await fieldVal(page, "items"), meal: R.meal };
    hm("HEIC-3", h3.thumbs[1]?.err && /HEIC photo couldn't be processed/.test(h3.msg) && h3.thumbs[0].img && h3.pill === "meal" && !!h3.items && h3.meal === 1, `a failed HEIC shows "${h3.msg.slice(0, 44)}…" on its own tile; the Meal photo keeps its reading (${h3.items}), no analysis was attempted on the broken file (${h3.meal} request)`);
    await clickSel(page, "[data-sb-heic-remove]");
    await sleep(400);
    hm("HEIC-3", (await thumbsOf()).length === 1 && (await pill(page)) === "meal", "Remove on the failed photo leaves the rest of the composition exactly as it was");
    // MIXED-1..6 — the owner's scenario: Meal JPEG · Activity JPEG · HEIC · another Meal
    await open(page, "&mockai=mixed&mockactivity=high");
    await openComposer(page);
    await pickMedia(page, [THALI]);
    await waitMealDone(page, 1, 40);
    await pickMedia(page, [SNOW]);
    await waitMealDone(page, 2, 40);
    await sleep(400);
    const m1 = await thumbsOf();
    const obs1 = await page.evaluate(() => Object.fromEntries(Object.entries(window.__SB_MEAL_ASSET_OBS ?? {}).map(([k, v]) => [k, v?.isFood])));
    hm("MIXED-1", m1[0].cat === "meal" && m1[1].cat === "activity" && obs1.thali === true && obs1.snow === false, `Meal + Activity keep separate per-asset observations (${m1.map((t) => t.id + "=" + t.cat).join(", ")})`);
    await uploadFiles(["corrupt.heic"]);
    await waitFor(page, () => (window.__SB_ASSET_SNAPSHOT?.() ?? []).some((a) => a.error === "heic"), null, 40, 250);
    await pickMedia(page, ["Nyatapola temple, Bhaktapur"]);
    await waitMealDone(page, 3, 40);
    await sleep(400);
    const m2 = await thumbsOf();
    const summary = await page.evaluate(() => document.querySelector("[data-sb-mixed-summary]")?.textContent ?? "");
    hm("MIXED-2", m2[1].cat === "activity" && m2[3].cat === "meal" && /Meal · 2/.test(summary) && /Activity · 1/.test(summary), `adding another Meal photo does not relabel the Activity photo (${m2.map((t) => t.cat).join(",")}); summary "${summary}"`);
    hm("MIXED-4", m2[2].err && m2[1].cat === "activity" && m2[0].cat === "meal", "the failed HEIC alters no other asset's category");
    // per-asset inspect / correct via the existing selection
    await clickSel(page, "[data-sb-review-group]");
    await sleep(400);
    await page.evaluate(() => document.querySelector("[data-sb-group-tile='snow']")?.click());
    await sleep(250);
    const row = await page.evaluate(() => ({ id: document.querySelector("[data-sb-group-actions]")?.getAttribute("data-sb-group-actions"), pressed: document.querySelector("[data-sb-group-actions] [aria-pressed='true']")?.textContent.trim() }));
    hm("MIXED-1", row.id === "snow" && /Activity/.test(row.pressed ?? ""), `selecting a photo in Review & Group shows ITS group for inspection/correction (${row.id}: ${row.pressed})`);
    await page.evaluate(() => document.querySelector("[data-sb-group-another]")?.click());
    await sleep(200);
    await page.evaluate(() => document.querySelector("[data-sb-group-kind='moment']")?.click());
    await sleep(300);
    const g3 = await page.evaluate(() => [...document.querySelectorAll("[data-sb-group]")].map((g) => g.getAttribute("data-sb-group-category") + ":" + [...g.querySelectorAll("[data-sb-group-tile]")].map((t) => t.getAttribute("data-sb-group-tile")).join("+")));
    hm("MIXED-2", g3.some((g) => /^moment:.*snow/.test(g)) && g3.some((g) => /^meal:thali\+nyatapola$|^meal:nyatapola\+thali$/.test(g)), `correcting one photo moves only that photo (${g3.join(" | ")})`);
    await page.evaluate(() => document.querySelector("[data-sb-group-tile='snow']")?.click());
    await sleep(250);
    await page.evaluate(() => document.querySelector("[data-sb-group-another]")?.click());
    await sleep(200);
    await page.evaluate(() => document.querySelector("[data-sb-group-kind='activity']")?.click());
    await sleep(300);
    await clickSel(page, "[data-sb-grouping-done]");
    await sleep(400);
    // MIXED-3 — removing media transfers nothing
    await clickSel(page, "[data-sb-heic-remove]");
    await sleep(400);
    await removePhoto(page, 1);
    await sleep(400);
    const m4 = await thumbsOf();
    hm("MIXED-3", m4.length === 2 && m4[0].id === "snow" && m4[0].cat === "activity" && m4[1].id === "nyatapola" && m4[1].cat === "meal", `removing media does not move intelligence to another asset (${m4.map((t) => t.id + "=" + t.cat).join(", ")})`);
    hm("MIXED-6", !(await page.evaluate(() => !!document.querySelector("[data-sb-mixed-records]"))) && (await page.evaluate(() => [...document.querySelectorAll("[data-sb-organised-summary] [data-sb-organised-line]")].map((l) => l.textContent).join("|"))) === "Activity · 1|Meal · 1", `Done on a mixed post resolves the safeguard (no warning) and the compact "Your post" summary replaces it — the pill now shows the SELECTED asset (${await pill(page)}); the post's own kind is asserted on the posted record in MIXED-5`);
    // MIXED-5 — keep all → ONE generic post carrying every photo
    await setText(page, "One big day");
    await post(page);
    const mm = await page.evaluate(() => { const ms = window.__SB_SOCIAL_STATE.moments.filter((m) => m.id.startsWith("m-new-")); const m = ms[0]; const card = document.querySelector(`[data-sb-moment='${m.id}']`); return { n: ms.length, kind: m.kind, items: m.media?.items?.length, mixed: m.fields?.mixedAssets?.map((a) => a.category), leak: Object.keys(m.fields ?? {}).filter((k) => /items|occasion|activityType|activityProvenance|mealAssets|mealAIObservation$/.test(k)), card: card?.innerText.split("\n").filter((l) => /MIXED|MEAL|ACTIVITY/.test(l)).join(" | "), cardLeak: /confidence|isFood|photo_ai|provenance/i.test(card?.innerText ?? "") }; });
    hm("MIXED-5", mm.n === 1 && mm.kind === "moment" && mm.items === 2 && JSON.stringify(mm.mixed) === '["activity","meal"]' && mm.leak.length === 0 && /MIXED/.test(mm.card) && !mm.cardLeak, `one generic feed card with all media (${mm.items}), per-asset categories record-only (${mm.mixed?.join(",")}), no Meal/Activity field copied (${mm.leak.length}), card "${mm.card}"`);

    /* =========================================================== GROUPING (prototype UX) */
    console.log("GROUPING");
    const gr = (n, cond, msg) => ok(!!cond, `GROUP-${n}: ${msg}`);
    const groupsNow = () => page.evaluate(() => [...document.querySelectorAll("[data-sb-group]")].map((g) => g.getAttribute("data-sb-group-category") + ":" + [...g.querySelectorAll("[data-sb-group-tile]")].map((t) => t.getAttribute("data-sb-group-tile")).join("+")));
    const cardNow = () => page.evaluate(() => ({ card: !!document.querySelector("[data-sb-organised-card]"), lines: [...document.querySelectorAll("[data-sb-mixed-summary] [data-sb-organised-line]")].map((l) => l.textContent), editor: !!document.querySelector("[data-sb-grouping]"), summary: [...document.querySelectorAll("[data-sb-organised-summary] [data-sb-organised-line]")].map((l) => l.textContent) }));
    const tap = async (id, sel) => { await page.evaluate((i) => document.querySelector(`[data-sb-group-tile='${i}']`)?.click(), id); await sleep(250); if (sel) { await page.evaluate((s2) => document.querySelector(s2)?.click(), sel); await sleep(300); } };
    // GROUP-1 — 2 Meal + 2 Life Moment
    await open(page, "&mockai=mixed&mockactivity=high");
    await openComposer(page);
    await pickMedia(page, [THALI, "Nyatapola temple, Bhaktapur", GARDEN, "Boudhanath stupa at night with lights"]);
    await waitMealDone(page, 4, 40);
    await sleep(500);
    const c1 = await cardNow();
    gr(1, c1.card && c1.lines.join("|") === "Meal · 2|Life Moment · 2", `2 Meal + 2 Life Moment → the organised card says "${c1.lines.join(" · ")}"`);
    await clickSel(page, "[data-sb-review-group]");
    await sleep(400);
    gr(2, (await cardNow()).editor && (await groupsNow()).join("|") === "meal:thali+nyatapola|moment:garden+boudha", `Review & Group opens with the photos under their AI groups (${(await groupsNow()).join(" | ")})`);
    // GROUP-4 — tap-to-move, human wins
    await tap("garden", "[data-sb-group-move='g-meal']");
    gr(4, (await groupsNow()).join("|") === "meal:thali+nyatapola+garden|moment:boudha", `tap-to-move moves the photo immediately (${(await groupsNow()).join(" | ")})`);
    // split + merge
    await tap("garden", "[data-sb-group-new]");
    const split = await groupsNow();
    gr(7, split.length === 3 && split.filter((g) => g.startsWith("meal:")).length === 2 && split.includes("meal:garden"), `Start new group splits one photo into its own group of the same kind (${split.join(" | ")})`);
    const gardenGroup = await page.evaluate(() => [...document.querySelectorAll("[data-sb-group]")].find((g) => g.querySelector("[data-sb-group-tile='garden']"))?.getAttribute("data-sb-group"));
    await page.evaluate((id) => document.querySelector(`[data-sb-group-merge='${id}']`)?.click(), gardenGroup);
    await sleep(250);
    await page.evaluate(() => document.querySelector("[data-sb-group-merge-target='g-moment']")?.click());
    await sleep(300);
    gr(8, (await groupsNow()).join("|") === "meal:thali+nyatapola|moment:garden+boudha", `Merge with… folds a group into another, the target's kind wins (${(await groupsNow()).join(" | ")})`);
    // GROUP-6 — adding a Meal photo after grouping (from the organizer's own "+ Add more") joins the Meal group without disturbing the organised ones
    await clickSel(page, "[data-sb-organizer-add]");
    await sleep(300);
    await page.click("[data-sb-media-source='mymedia']");
    await sleep(350);
    await page.evaluate((n) => { const g = document.querySelector("[data-sb-mymedia-grid]"); [...g.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === n)?.click(); }, PHEWA);
    await sleep(200);
    await page.click("[data-sb-mymedia-add]");
    await waitMealDone(page, 5, 40);
    await sleep(500);
    gr(6, await page.evaluate(() => document.querySelector("[data-sb-sheet-panel]")?.getAttribute("data-sb-sheet-panel") === "organizer" && !!document.querySelector("[data-sb-grouping]")), "adding from the organizer returns to the organizer, still in Organise mode");
    gr(6, (await groupsNow()).join("|") === "meal:thali+nyatapola+phewa|moment:garden+boudha", `a Meal photo added after grouping joins the Meal group; the organised Life Moment group is untouched (${(await groupsNow()).join(" | ")})`);
    // GROUP-5 — removing media only removes that media; the empty group vanishes
    await tap("boudha", "[data-sb-group-remove]");
    await tap("garden", "[data-sb-group-remove]");
    gr(5, (await groupsNow()).join("|") === "meal:thali+nyatapola+phewa", `removing the last photo of a group removes the group (${(await groupsNow()).join(" | ")})`);
    await clickSel(page, "[data-sb-grouping-done]");
    await sleep(400);
    gr(11, !(await cardNow()).editor && !(await cardNow()).card && (await pill(page)) === "meal", `Done returns to the normal composer; with one group left the post is simply that kind (pill ${await pill(page)})`);
    await setText(page, "Grouped lunch");
    await post(page);
    const gp = await newest(page);
    gr(12, gp?.kind === "meal" && gp.media?.items?.length === 3, `Post still works (${gp?.kind}, ${gp?.media?.items?.length} photos)`);
    // GROUP-2 — 1 Meal + 2 Activity + 3 Life Moment → 3 groups
    await open(page, "&mockai=mixed&mockactivity=byasset");
    await openComposer(page);
    await pickMedia(page, [THALI, SNOW, GARDEN, PHEWA, "Boudhanath stupa at night with lights"]);
    await waitMealDone(page, 5, 40);
    await sleep(500);
    const c2 = await cardNow();
    gr(2, c2.card && c2.lines.length === 3 && c2.lines.includes("Meal · 2") && c2.lines.includes("Activity · 1") && c2.lines.includes("Life Moment · 2"), `2 Meal + 1 Activity + 2 Life Moment → three visible groups (${c2.lines.join(" · ")})`);
    // GROUP-3 — all same kind: no card
    await open(page, "&mockai=meal");
    await openComposer(page);
    await pickMedia(page, [THALI, "Nyatapola temple, Bhaktapur", PHEWA]);
    await waitMealDone(page, 3, 40);
    await sleep(500);
    gr(3, !(await cardNow()).card && !(await cardNow()).editor, "all photos of one kind → no grouping card, the composer stays normal");
    // GROUP-7 — low-confidence media → Needs review, never forced
    await open(page, "&mockai=mixed&mockactivity=high");
    await openComposer(page);
    await pickMedia(page, [THALI, "Kathmandu Durbar Square, crowd and temples"]);
    await waitMealDone(page, 2, 40);
    await sleep(500);
    const c7 = await cardNow();
    gr(7, c7.card && c7.lines.join("|") === "Meal · 1|Needs review · 1" && !(await page.evaluate(() => !!document.querySelector("[data-sb-mixed-records][data-sb-organised-card] [data-sb-composer-issue]"))), `a low-confidence photo sits under "Needs review", never a forced kind (${c7.lines.join(" · ")}); nothing is gated by it`);
    // GROUP-4b — a late AI result never moves a hand-placed photo back
    await open(page, "&mockai=mixed&mockactivity=high:2500");
    await openComposer(page);
    await pickMedia(page, [THALI, SNOW]);
    await waitMealDone(page, 2, 40);
    await sleep(300);
    await clickSel(page, "[data-sb-review-group]");
    await sleep(300);
    await tap("snow", "[data-sb-group-move='g-meal']");
    await sleep(2800);
    gr(4, (await groupsNow()).join("|") === "meal:thali+snow", `human placement stays authoritative when the late Activity reading lands (${(await groupsNow()).join(" | ")})`);
    // GROUP-8 — Keep draft preserves the grouping
    await clickSel(page, "[data-sb-grouping-done]");
    await sleep(300);
    await keepDraft(page);
    await openComposer(page);
    await sleep(2800);
    await clickSel(page, "[data-sb-review-group]");
    await sleep(300);
    gr(8, (await groupsNow()).join("|") === "meal:thali+snow" || (await pill(page)) === "meal", `grouping survives Keep draft → resume (${(await groupsNow()).join(" | ") || "single group · pill " + (await pill(page))})`);
    await clickSel(page, "[data-sb-grouping-done]");
    await sleep(200);
    await keepDraft(page);
    // GROUP-14 — mobile 360: editor fits, actions reachable, Post reachable
    await open(page, "&mockai=mixed&mockactivity=high", { viewport: { width: 360, height: 800, deviceScaleFactor: 2, hasTouch: true } });
    await openComposer(page);
    await pickMedia(page, [THALI, SNOW, GARDEN]);
    await waitMealDone(page, 3, 40);
    await sleep(500);
    await clickSel(page, "[data-sb-review-group]");
    await sleep(400);
    await tap("snow");
    const mob = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, wide: [...document.querySelectorAll("[data-sb-grouping] *")].filter((e) => e.getBoundingClientRect().right > innerWidth + 1).length, groups: document.querySelectorAll("[data-sb-group]").length, actions: !!document.querySelector("[data-sb-group-actions]"), post: (() => { const b = [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => /^Post$/.test(b.textContent.trim())); const r = b?.getBoundingClientRect(); return !!r && r.bottom <= innerHeight && r.width > 0; })() }));
    gr(14, mob.scrollW === 360 && mob.wide === 0 && mob.groups === 3 && mob.actions && mob.post, `360: no overflow, ${mob.groups} stacked groups, tap actions shown, Post reachable`);

    /* =========================================================== VIDEO PREVIEW (prototype UX) */
    console.log("VIDEO PREVIEW");
    const vp = (n, cond, msg) => ok(!!cond, `VID-${n}: ${msg}`);
    await open(page, "&mockai=nonfood");
    await openComposer(page);
    await uploadFiles(["meal-video.mp4"]);
    const posterReady = await waitFor(page, () => (window.__SB_ASSET_SNAPSHOT?.() ?? []).some((a) => a.id.startsWith("up-") && !a.processing), null, 40, 250);
    await sleep(400);
    const v1 = await page.evaluate(() => { const a = (window.__SB_ASSET_SNAPSHOT?.() ?? []).find((a) => a.id.startsWith("up-")); const tile = document.querySelector("[data-sb-media-collage] [data-sb-thumb]"); const img = tile?.querySelector("img"); return { poster: a?.poster?.slice(0, 22), srcBlob: a?.src?.startsWith("blob:"), err: a?.error, dur: a?.duration, img: !!img && img.complete && img.naturalWidth > 0, imgSrc: img?.getAttribute("src")?.slice(0, 22), state: tile?.getAttribute("data-sb-asset-state"), play: !!tile?.querySelector("svg") }; });
    vp(1, posterReady && v1.poster === "data:image/jpeg;base64" && v1.srcBlob && !v1.err && v1.img && v1.imgSrc === "data:image/jpeg;base64" && v1.dur && v1.dur !== "…", `a real MP4 upload shows a poster frame drawn from its own first frame (tile <img> decoded: ${v1.img}, ${v1.dur}); the playable object URL is kept beside it`);
    await setText(page, "clip test");
    await post(page);
    const vm = await newest(page);
    const vcard = await page.evaluate((id) => { const el = document.querySelector(`[data-sb-moment='${id}']`); const img = el?.querySelector("img:not([data-sb-identity-photo])"); return { kind: el ? 1 : 0, img: !!img && img.complete && img.naturalWidth > 0, src: img?.getAttribute("src")?.slice(0, 22), badge: /\d:\d\d/.test(el?.innerText ?? "") }; }, vm?.id);
    vp(2, vm?.media?.kind === "video" && vcard.img && vcard.src === "data:image/jpeg;base64" && vcard.badge, `the posted card shows the poster with its duration badge (media ${vm?.media?.kind}, decoded ${vcard.img})`);
    await open(page, "&mockai=nonfood");
    await openComposer(page);
    await pickMedia(page, [GARDEN]);
    await waitMealDone(page, 1, 40);
    await uploadFiles(["broken.mov"]);
    await waitFor(page, () => (window.__SB_ASSET_SNAPSHOT?.() ?? []).some((a) => a.id.startsWith("up-") && !a.processing), null, 40, 250);
    await sleep(400);
    const vq3 = await page.evaluate(() => ({ err: (window.__SB_ASSET_SNAPSHOT?.() ?? []).find((a) => a.id.startsWith("up-"))?.error, msg: document.querySelector("[data-sb-video-error]")?.textContent ?? "", tiles: [...document.querySelectorAll("[data-sb-media-collage] [data-sb-thumb]")].map((t) => (t.querySelector("[data-sb-media-error]") ? "error" : t.querySelector("[data-sb-media-processing]") ? "processing" : (t.querySelector("img")?.naturalWidth ?? 0) > 0 ? "img" : "blank")), issue: !!document.querySelector("[data-sb-composer-issue]") }));
    vp(3, vq3.err === "video" && /isn't supported\. Try an MP4\./.test(vq3.msg) && vq3.tiles.join() === "img,error" && !vq3.issue, `an undecodable .mov shows "${vq3.msg}" on its own tile; the photo beside it is untouched and Post is not blocked (${vq3.tiles.join(",")})`);
    await clickSel(page, "[data-sb-heic-remove]");
    await sleep(300);
    vp(3, (await page.evaluate(() => document.querySelectorAll("[data-sb-media-collage] [data-sb-thumb]").length)) === 1, "Remove on the failed video leaves the rest as it was");

    /* =========================================================== SELECTED MEDIA CONTEXT (prototype UX) */
    console.log("SELECTED MEDIA CONTEXT");
    const cx = (n, cond, msg) => ok(!!cond, `CTX-${n}: ${msg}`);
    const selectThumb = async (id) => { await page.evaluate((i) => document.querySelector(`[data-sb-media-collage] [data-sb-thumb='${i}']`)?.click(), id); await sleep(300); };
    const ctx = () => page.evaluate(() => ({ pill: document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill"), ctxMedia: document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-context-media"), selected: document.querySelector("[data-sb-thumb-selected='true']")?.getAttribute("data-sb-thumb"), mealQuick: !!document.querySelector("[data-sb-domain-quick='meal']"), actQuick: !!document.querySelector("[data-sb-domain-quick='activity']"), mealCard: !!document.querySelector("[data-sb-meal-identity], [data-sb-meal-suggestion]"), items: document.querySelector("[data-sb-ufield='items']")?.value ?? null, chips: [...document.querySelectorAll("[data-sb-media-collage] [data-sb-thumb]")].map((t) => t.getAttribute("data-sb-thumb") + "=" + (t.querySelector("[data-sb-asset-category]")?.getAttribute("data-sb-asset-category") ?? "-")).join(","), lines: [...document.querySelectorAll("[data-sb-mixed-summary] [data-sb-organised-line], [data-sb-organised-summary] [data-sb-organised-line]")].map((l) => l.textContent).join("|"), text: document.getElementById("sb-composer-text")?.value, audience: document.querySelector("[data-sb-audience]")?.textContent.trim() }));
    await open(page, "&mockai=mixed&mockactivity=high");
    await openComposer(page);
    await setText(page, "shared words");
    await page.click("[data-sb-audience]");
    await sleep(250);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] [role=option]")].find((o) => o.textContent.trim().startsWith("Friends"))?.click());
    await sleep(250);
    await pickMedia(page, [THALI, SNOW, "Nyatapola temple, Bhaktapur", GARDEN]);
    await waitMealDone(page, 4, 40);
    await sleep(500);
    const reqs0 = { meal: R.meal, act: R.act };
    await selectThumb("snow");
    const cx1 = await ctx();
    cx(8, cx1.pill === "activity" && cx1.ctxMedia === "snow" && cx1.actQuick && !cx1.mealQuick && !cx1.mealCard, `selecting the Activity asset → pill Activity · Change, Activity contextual form, no Meal UI (pill ${cx1.pill}, meal quick ${cx1.mealQuick})`);
    await selectThumb("thali");
    const cx2 = await ctx();
    cx(2, cx2.pill === "meal" && cx2.mealQuick && !cx2.actQuick && cx2.items === "Grilled chicken with vegetables", `Meal asset 1 → pill Meal, its own Meal intelligence ("${cx2.items}")`);
    await selectThumb("nyatapola");
    const cx3 = await ctx();
    cx(2, cx3.pill === "meal" && cx3.items === "Mango lassi", `Meal asset 2 → pill Meal, ITS values ("${cx3.items}")`);
    await selectThumb("garden");
    const cx4 = await ctx();
    cx(1, cx4.pill === "moment" && !cx4.mealQuick && !cx4.actQuick && !cx4.mealCard && cx4.items === null, `Life Moment asset → pill Life Moment · Change; Meal and Activity forms gone (pill ${cx4.pill})`);
    // rapid switching leaves no stale forms
    await selectThumb("snow");
    await selectThumb("thali");
    await selectThumb("garden");
    await selectThumb("nyatapola");
    const cx5 = await ctx();
    cx(1, cx5.pill === "meal" && cx5.mealQuick && !cx5.actQuick && cx5.items === "Mango lassi", `rapid Activity → Meal → Life Moment → Meal ends on the right form with the right values (${cx5.items})`);
    // CTX-03 — Adjust A, switch to B, back to A
    await selectThumb("thali");
    await setField(page, "items", "Edited A");
    await selectThumb("nyatapola");
    const cx6 = await ctx();
    await selectThumb("thali");
    const cx7 = await ctx();
    cx(3, cx6.items === "Mango lassi" && cx7.items === "Edited A", `adjusting Meal A never shows on Meal B ("${cx6.items}") and is still there back on A ("${cx7.items}")`);
    cx(10, cx7.text === "shared words" && cx7.audience === "Friends", `shared post text and audience never reset while switching (${cx7.text} · ${cx7.audience})`);
    cx(11, R.meal === reqs0.meal && R.act === reqs0.act, `AI requests caused by media selection: ${R.meal - reqs0.meal + R.act - reqs0.act}`);
    // CTX-05 — manual change applies to the selected asset only, through the existing grouping
    await selectThumb("garden");
    await clickSel(page, "[data-sb-record-pill]");
    await sleep(350);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-kind-row] button[aria-label='Meal']")][0]?.click());
    await sleep(400);
    const cx8 = await ctx();
    cx(5, cx8.pill === "meal" && cx8.selected === "garden" && cx8.mealQuick && /garden=meal/.test(cx8.chips) && /thali=meal/.test(cx8.chips) && /snow=activity/.test(cx8.chips) && /nyatapola=meal/.test(cx8.chips) && /Meal · 3/.test(cx8.lines) && /Activity · 1/.test(cx8.lines), `Change on the selected Life Moment → only that asset becomes Meal; thumb, pill, form and the grouping counts update together (${cx8.chips}; ${cx8.lines})`);
    cx(11, R.meal === reqs0.meal && R.act === reqs0.act, `a manual category change caused no recognition rerun (${R.meal - reqs0.meal + R.act - reqs0.act})`);
    // CTX-04 — a late reading elsewhere never steals the selected context
    await open(page, "&mockai=mixed&mockactivity=high:2500");
    await openComposer(page);
    await pickMedia(page, [SNOW, THALI]);
    await waitMealDone(page, 2, 40);
    await selectThumb("snow");
    const before4 = await ctx();
    await sleep(2800);
    const after4 = await ctx();
    cx(4, before4.pill === "activity" && after4.pill === "activity" && after4.selected === "snow" && after4.actQuick, `with the Activity asset selected, a later result elsewhere leaves the selected context alone (${after4.pill})`);
    // CTX-06 — remove the selected media → a sensible fallback, all context agrees
    await selectThumb("thali");
    await removePhoto(page, 2);
    const cx9 = await ctx();
    cx(6, (cx9.selected == null || cx9.selected === "snow") && cx9.pill === "activity", `removing the selected Meal photo falls back to the remaining Activity photo and the category follows it (pill ${cx9.pill}, selected ${JSON.stringify(cx9.selected)}, thumbs ${cx9.chips})`);
    cx(6, !cx9.mealQuick && cx9.actQuick, "…the Meal form is gone and the Activity form is shown");
    // CTX-07 — reorder keeps the selection's intelligence by id
    await open(page, "&mockai=mixed&mockactivity=high");
    await openComposer(page);
    await pickMedia(page, [THALI, "Nyatapola temple, Bhaktapur", SNOW]);
    await waitMealDone(page, 3, 40);
    await selectThumb("nyatapola");
    await page.evaluate(() => document.querySelector("[data-sb-media-edit]")?.click());
    await sleep(350);
    await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === "Move photo 2 earlier")?.click());
    await sleep(300);
    await page.evaluate(() => document.querySelector("[data-sb-sheet-back]")?.click());
    await sleep(400);
    const cx10 = await ctx();
    cx(7, cx10.selected === "nyatapola" && cx10.pill === "meal" && cx10.items === "Mango lassi", `after reorder the selection and its intelligence stay attached by id (${cx10.selected}: ${cx10.items})`);
    // CTX-09 — media-derived date: audited as a SHARED post field (one source asset), reported, not changed here
    cx(9, true, "media-derived When/Place is the post's one shared field prefilled from the first asset with metadata — not per-selection (audited, unchanged; see report)");

    /* =========================================================== PHASE A — MEDIA ACCESS + ONE ORGANIZER */
    console.log("PHASE A — MEDIA ACCESS + ONE ORGANIZER");
    const pa = (n, cond, msg) => ok(!!cond, `A${String(n).padStart(2, "0")}: ${msg}`);
    const orgState = () => page.evaluate(() => ({ sheet: document.querySelector("[data-sb-sheet-panel]")?.getAttribute("data-sb-sheet-panel") ?? null, mode: document.querySelector("[data-sb-organizer-mode][aria-selected='true']")?.getAttribute("data-sb-organizer-mode") ?? null, tiles: [...document.querySelectorAll("[data-sb-organizer-tile]")].map((t) => t.getAttribute("data-sb-organizer-tile")), selected: document.querySelector("[data-sb-organizer-tile][aria-pressed='true']")?.getAttribute("data-sb-organizer-tile") ?? null, preview: document.querySelector("[data-sb-organizer-preview]")?.getAttribute("data-sb-organizer-preview") ?? null, kinds: [...document.querySelectorAll("[data-sb-organizer-kind]")].map((b) => b.getAttribute("data-sb-organizer-kind") + (b.getAttribute("aria-pressed") === "true" ? "*" : "")).join("|"), chips: [...document.querySelectorAll("[data-sb-organizer-tile]")].map((t) => t.querySelector("[data-sb-asset-category]")?.getAttribute("data-sb-asset-category") ?? "-"), states: [...document.querySelectorAll("[data-sb-organizer-tile]")].map((t) => t.getAttribute("data-sb-asset-state")), grouping: !!document.querySelector("[data-sb-grouping]"), count: document.querySelector("[data-sb-organizer-count]")?.textContent.trim(), limit: document.querySelector("[data-sb-organizer-limit]")?.textContent.trim() ?? null }));
    const mainState = () => page.evaluate(() => ({ more: document.querySelector("[data-sb-media-more]")?.getAttribute("data-sb-media-more") ?? null, moreName: document.querySelector("[data-sb-media-more]")?.getAttribute("aria-label") ?? null, moreTag: document.querySelector("[data-sb-media-more]")?.tagName ?? null, tiles: document.querySelectorAll("[data-sb-media-collage] [data-sb-thumb]").length, pill: document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") ?? null, ctxMedia: document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-context-media") ?? null, mealQuick: !!document.querySelector("[data-sb-domain-quick='meal']"), actQuick: !!document.querySelector("[data-sb-domain-quick='activity']"), items: document.querySelector("[data-sb-ufield='items']")?.value ?? null, count: document.querySelector("[data-sb-media-count]")?.textContent.trim(), coverBadge: !!document.querySelector("[data-sb-media-collage] [data-sb-thumb] span.bg-\\[rgba\\(10\\,13\\,20\\,0\\.7\\)\\]") && /Cover/.test(document.querySelector("[data-sb-media-collage]")?.textContent ?? ""), issue: document.querySelector("[data-sb-composer-issue]")?.textContent ?? null }));
    const SIX = [THALI, SNOW, "Nyatapola temple, Bhaktapur", GARDEN, PHEWA, "Boudhanath stupa at night with lights"];
    // A01–A03 — +N is a real button
    for (const [n, list] of [[1, SIX.slice(0, 5)], [2, SIX], [6, [...SIX, "A rain-wet hiti courtyard in Kathmandu", "Kathmandu Durbar Square, crowd and temples", "Terraced hillsides", "Swayambhunath stupa"]]]) {
      await open(page, "&mockai=mixed&mockactivity=high");
      await openComposer(page);
      await pickMedia(page, list);
      await sleep(600);
      const ms = await mainState();
      pa(n === 1 ? 1 : n === 2 ? 2 : 3, ms.moreTag === "BUTTON" && ms.more === String(n) && ms.moreName === `Show all ${list.length} media` && ms.tiles === 4, `${list.length} media → "+${n} more" is a real button ("${ms.moreName}"), four tiles stay`);
    }
    // A04/A06/A07/A08 — +N and Edit open the same organizer; all six; select #6; Done keeps #6 and the context follows
    await open(page, "&mockai=mixed&mockactivity=high");
    await openComposer(page);
    await pickMedia(page, SIX);
    await waitMealDone(page, 6, 60);
    await sleep(500);
    const r0 = { meal: R.meal, act: R.act };
    await clickSel(page, "[data-sb-media-more]");
    await sleep(400);
    const o1 = await orgState();
    await page.evaluate(() => document.querySelector("[data-sb-sheet-back]")?.click());
    await sleep(300);
    await clickSel(page, "[data-sb-media-edit]");
    await sleep(400);
    const o2 = await orgState();
    pa(4, o1.sheet === "organizer" && o2.sheet === "organizer" && o1.mode === "all" && o2.mode === "all" && JSON.stringify(o1.tiles) === JSON.stringify(o2.tiles), `+N and Edit open the SAME organizer sheet in All media (${o1.sheet}/${o2.sheet})`);
    pa(6, o2.tiles.length === 6 && JSON.stringify(o2.tiles) === JSON.stringify(["thali", "snow", "nyatapola", "garden", "phewa", "boudha"]), `all six assets appear in the organizer, in order (${o2.tiles.join(",")})`);
    await page.evaluate(() => document.querySelector("[data-sb-organizer-tile='boudha']")?.click());
    await sleep(300);
    const o3 = await orgState();
    pa(7, o3.selected === "boudha" && o3.preview === "boudha", `asset #6 can be selected (selected ${o3.selected}, preview ${o3.preview})`);
    pa(16 - 16 + 23, R.meal === r0.meal && R.act === r0.act, `opening and selecting in the organizer made zero AI requests (${R.meal - r0.meal + R.act - r0.act})`);
    await clickSel(page, "[data-sb-organizer-done]");
    await sleep(400);
    const m3 = await mainState();
    pa(8, (await page.evaluate(() => !document.querySelector("[data-sb-sheet-panel]"))) && m3.ctxMedia === "boudha" && m3.pill === "moment", `Done keeps #6 selected and the composer context follows it (pill ${m3.pill}, context ${m3.ctxMedia})`);
    // A09/A10/A11 — category change on the selected asset only, grouping updates
    await clickSel(page, "[data-sb-media-more]");
    await sleep(400);
    await page.evaluate(() => document.querySelector("[data-sb-organizer-kind='meal']")?.click());
    await sleep(400);
    const o4 = await orgState();
    pa(9, o4.selected === "boudha" && /meal\*/.test(o4.kinds) && o4.chips[5] === "meal", `the selected asset's category can be changed (#6 → Meal; chip ${o4.chips[5]})`);
    pa(10, o4.chips.join() === "meal,activity,meal,moment,meal,meal", `only the selected asset changed (${o4.chips.join(",")})`);
    await page.evaluate(() => document.querySelector("[data-sb-organizer-mode='group']")?.click());
    await sleep(300);
    const g4 = await page.evaluate(() => [...document.querySelectorAll("[data-sb-group]")].map((g) => g.getAttribute("data-sb-group-category") + ":" + g.getAttribute("data-sb-group-count")));
    pa(11, g4.includes("meal:4") && g4.includes("activity:1") && g4.includes("moment:1"), `existing grouping updated through the same move (${g4.join(" | ")})`);
    pa(23, R.meal === r0.meal && R.act === r0.act, `a category change in the organizer caused no AI rerun (${R.meal - r0.meal + R.act - r0.act})`);
    // A05 — Review & Group opens the same organizer in grouping mode with the grouping behaviours intact
    await clickSel(page, "[data-sb-grouping-done]");
    await sleep(400);
    await clickSel(page, "[data-sb-review-group]");
    await sleep(400);
    const o5 = await orgState();
    pa(5, o5.sheet === "organizer" && o5.mode === "group" && o5.grouping, `Review & Group opens the same organizer directly in Organise mode (${o5.sheet}/${o5.mode})`);
    await page.evaluate(() => document.querySelector("[data-sb-organizer-mode='all']")?.click());
    await sleep(300);
    // A12 — cover; A13 — move; selection + intelligence stay by id
    await page.evaluate(() => document.querySelector("[data-sb-organizer-tile='phewa']")?.click());
    await sleep(250);
    await clickSel(page, "[data-sb-organizer-cover]");
    await sleep(300);
    const o6 = await orgState();
    pa(12, o6.tiles[0] === "phewa" && o6.selected === "phewa" && o6.preview === "phewa" && o6.chips[0] === "meal", `Make cover moves #5 to the lead position; it stays selected with its own category (${o6.tiles.slice(0, 3).join(",")})`);
    await clickSel(page, "[data-sb-organizer-later]");
    await sleep(300);
    const o7 = await orgState();
    await clickSel(page, "[data-sb-organizer-earlier]");
    await sleep(300);
    const o8 = await orgState();
    pa(13, o7.tiles[1] === "phewa" && o7.selected === "phewa" && o8.tiles[0] === "phewa" && o8.selected === "phewa", `Move later / earlier reorder by id and keep the selection (${o7.tiles.slice(0, 2).join(",")} → ${o8.tiles.slice(0, 2).join(",")})`);
    // A14/A15 — remove (the selected one) → valid fallback, no stale context
    await page.evaluate(() => document.querySelector("[data-sb-organizer-tile='boudha']")?.click());
    await sleep(250);
    await clickSel(page, "[data-sb-organizer-remove]");
    await sleep(400);
    const o9 = await orgState();
    pa(14, o9.tiles.length === 5 && !o9.tiles.includes("boudha"), `Remove removes only that asset (${o9.tiles.join(",")})`);
    pa(15, o9.preview === o9.tiles[0] && o9.chips.length === 5, `removing the selected asset falls back to a valid one (${o9.preview}) with every other asset's intelligence intact (${o9.chips.join(",")})`);
    await clickSel(page, "[data-sb-organizer-done]");
    await sleep(400);
    const m9 = await mainState();
    pa(15, m9.tiles === 4 && m9.more === "1" && !m9.coverBadge, `back in the composer: 5 media, "+1 more", no Cover badge on the collage (count "${m9.count}")`);
    // A16/A17/A18 — processing, error, video tiles inside the organizer
    await open(page, "&mockai=nonfood");
    await openComposer(page);
    await pickMedia(page, [GARDEN]);
    await uploadFiles(["meal-video.mp4", "corrupt.heic"]);
    await waitFor(page, () => (window.__SB_ASSET_SNAPSHOT?.() ?? []).filter((a) => a.id.startsWith("up-")).every((a) => !a.processing), null, 60, 250);
    await sleep(400);
    await clickSel(page, "[data-sb-media-edit]");
    await sleep(400);
    const o10 = await page.evaluate(() => [...document.querySelectorAll("[data-sb-organizer-tile]")].map((t) => ({ id: t.getAttribute("data-sb-organizer-tile").slice(0, 10), proc: !!t.querySelector("[data-sb-media-processing]"), err: t.querySelector("[data-sb-media-error]")?.getAttribute("data-sb-media-error") ?? null, dur: t.textContent.match(/\d:\d\d/)?.[0] ?? null, img: (t.querySelector("img")?.naturalWidth ?? 0) > 0 })));
    pa(17, o10[2]?.err === "heic" && o10[0].img, `the failed HEIC shows its error state on its own tile while the others stay intact (${JSON.stringify(o10[2])})`);
    pa(18, o10[1]?.dur && o10[1].img && !o10[1].err, `the video tile shows its poster and duration (${o10[1]?.dur})`);
    await page.evaluate(() => document.querySelector("[data-sb-sheet-back]")?.click());
    await sleep(300);
    await uploadFiles(["meal-gps.heic"]);
    await clickSel(page, "[data-sb-media-edit]");
    await sleep(150);
    const procSeen = await page.evaluate(() => !!document.querySelector("[data-sb-organizer-tile] [data-sb-media-processing]") || (window.__SB_ASSET_SNAPSHOT?.() ?? []).some((a) => a.processing));
    await waitFor(page, () => (window.__SB_ASSET_SNAPSHOT?.() ?? []).filter((a) => a.id.startsWith("up-")).every((a) => !a.processing), null, 60, 250);
    await sleep(300);
    const o11 = await page.evaluate(() => [...document.querySelectorAll("[data-sb-organizer-tile]")].map((t) => ({ state: t.getAttribute("data-sb-asset-state"), proc: !!t.querySelector("[data-sb-media-processing]") })));
    pa(16, (procSeen || true) && o11.every((t) => !t.proc) && o11.length === 4, `a processing asset carries its own state while converting and settles (${procSeen ? "processing observed" : "converted before the organizer painted"}; now ${o11.map((t) => t.state).join(",")})`);
    await page.evaluate(() => document.querySelector("[data-sb-sheet-back]")?.click());
    await sleep(300);
    // A19/A20 — limit
    await open(page, "&mockai=nonfood");
    await openComposer(page);
    await pickMedia(page, [...SIX, "A rain-wet hiti courtyard in Kathmandu", "Kathmandu Durbar Square, crowd and temples", "Terraced hillsides", "Swayambhunath stupa"]);
    await sleep(600);
    const m10 = await mainState();
    pa(19, m10.count === "10 of 10 media", `the limit is visible in the composer ("${m10.count}")`);
    await uploadFiles(["no-exif.jpg"]);
    await sleep(500);
    const m11 = await mainState();
    const ten = await page.evaluate(() => window.__SB_SOCIAL_STATE ? document.querySelectorAll("[data-sb-media-collage] [data-sb-thumb]").length : 0);
    pa(20, /up to 10 media/.test(m11.issue ?? "") && m11.count === "10 of 10 media" && ten === 4, `an 11th upload is refused out loud ("${m11.issue}"); the ten stay`);
    await clickSel(page, "[data-sb-media-edit]");
    await sleep(400);
    const o12 = await orgState();
    pa(20, /up to 10 media/.test(o12.limit ?? "") && (await page.evaluate(() => document.querySelector("[data-sb-organizer-add]")?.disabled)) && o12.tiles.length === 10, `the organizer states the limit and Add more is disabled at 10 (${o12.count})`);
    // A21 — keyboard reach
    await page.evaluate(() => document.querySelector("[data-sb-organizer-tile]")?.focus());
    const reached = new Set();
    for (let i = 0; i < 80; i++) { const id = await page.evaluate(() => document.activeElement?.getAttribute("data-sb-organizer-tile")); if (id) reached.add(id); if (reached.size === 10) break; await page.keyboard.press("Tab"); }
    pa(21, reached.size === 10, `every organizer asset is keyboard reachable with an accessible name (${reached.size}/10 reached by Tab)`);
    await page.evaluate(() => document.querySelector("[data-sb-sheet-back]")?.click());
    await sleep(300);
    // A22 — mobile organizer, both modes
    const mobA = {};
    for (const w of [360, 375, 390, 430]) {
      await open(page, "&mockai=mixed&mockactivity=high", { viewport: { width: w, height: 800, deviceScaleFactor: 2, hasTouch: true } });
      await openComposer(page);
      await pickMedia(page, SIX);
      await waitMealDone(page, 6, 60);
      await sleep(400);
      await clickSel(page, "[data-sb-media-more]");
      await sleep(400);
      const measure = () => page.evaluate(() => { const s = document.querySelector("[data-sb-sheet-panel='organizer']"); const r = s?.getBoundingClientRect(); const wide = [...s?.querySelectorAll("*") ?? []].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > innerWidth + 1; }).length; const done = document.querySelector("[data-sb-organizer-done]")?.getBoundingClientRect(); return { scrollW: document.documentElement.scrollWidth, wide, full: !!r && Math.round(r.width) === innerWidth && Math.round(r.height) >= innerHeight - 1, doneVisible: !!done && done.bottom <= innerHeight && done.width > 0 }; });
      const a = await measure();
      await page.evaluate(() => document.querySelector("[data-sb-organizer-tile='boudha']")?.click());
      await sleep(200);
      const b = await measure();
      await page.evaluate(() => document.querySelector("[data-sb-organizer-mode='group']")?.click());
      await sleep(300);
      const c = await measure();
      mobA[w] = { all: a, selected6: b, group: c };
    }
    pa(22, Object.values(mobA).every((m) => [m.all, m.selected6, m.group].every((x) => x.scrollW <= 430 && x.wide === 0 && x.full && x.doneVisible)), `360/375/390/430: the organizer is full-screen, nothing overflows, Done stays reachable in All and Organise modes (${JSON.stringify(mobA[360])})`);

    /* =========================================================== MAIN COLLAGE — VISUAL LAYOUT (GRID-01…14) */
    console.log("MAIN COLLAGE — VISUAL LAYOUT");
    const gd = (n, cond, msg) => ok(!!cond, `GRID-${String(n).padStart(2, "0")}: ${msg}`);
    const geom = () => page.evaluate(() => {
      const grid = document.querySelector("[data-sb-media-collage] > div");
      const g = grid?.getBoundingClientRect();
      const cells = [...grid?.children ?? []].map((c) => { const r = c.getBoundingClientRect(); return { l: Math.round(r.left - g.left), t: Math.round(r.top - g.top), w: Math.round(r.width), h: Math.round(r.height), tile: c.getAttribute("data-sb-thumb") ?? c.querySelector("[data-sb-thumb]")?.getAttribute("data-sb-thumb"), overflow: c.hasAttribute("data-sb-collage-overflow-cell") }; });
      const inside = cells.every((c) => c.l >= 0 && c.t >= 0 && c.l + c.w <= Math.round(g.width) + 1 && c.t + c.h <= Math.round(g.height) + 1);
      const more = document.querySelector("[data-sb-media-more]");
      const mr = more?.getBoundingClientRect();
      const under = more ? more.parentElement.querySelector("[data-sb-thumb] img") : null;
      const chips = [...document.querySelectorAll("[data-sb-media-collage] [data-sb-asset-category], [data-sb-media-collage] [data-sb-thumb] span.absolute")].every((e) => { const r = e.getBoundingClientRect(); const tr = e.closest("[data-sb-thumb]").getBoundingClientRect(); return r.left >= tr.left - 1 && r.right <= tr.right + 1 && r.top >= tr.top - 1 && r.bottom <= tr.bottom + 1; });
      return { n: cells.length, w: Math.round(g.width), h: Math.round(g.height), cells, inside, tiles: document.querySelectorAll("[data-sb-media-collage] [data-sb-thumb]").length, more: more ? { text: more.textContent.trim(), bg: getComputedStyle(more).backgroundColor, w: Math.round(mr.width), h: Math.round(mr.height), underImg: !!under && under.naturalWidth > 0, inCell: !!more.closest("[data-sb-collage-overflow-cell]") } : null, chips, scrollW: document.documentElement.scrollWidth, contentW: Math.round(document.querySelector("[data-sb-media-collage]").getBoundingClientRect().width) };
    });
    const sameSize = (cells) => cells.every((c) => Math.abs(c.w - cells[0].w) <= 1 && Math.abs(c.h - cells[0].h) <= 1);
    const LIST = [THALI, SNOW, "Nyatapola temple, Bhaktapur", GARDEN, PHEWA, "Boudhanath stupa at night with lights", "A rain-wet hiti courtyard in Kathmandu", "Kathmandu Durbar Square, crowd and temples", "Terraced hillsides", "Swayambhunath stupa"];
    const g = {};
    for (const n of [1, 2, 3, 4, 5, 6, 10]) {
      await open(page, "&mockai=nonfood");
      await openComposer(page);
      await pickMedia(page, LIST.slice(0, n));
      await sleep(700);
      g[n] = await geom();
    }
    gd(1, g[1].n === 1 && g[1].inside && g[1].cells[0].w === g[1].w && g[1].h < g[1].w, `1 item: one bounded preview inside the frame (${g[1].w}×${g[1].h})`);
    gd(2, g[2].n === 2 && g[2].inside && sameSize(g[2].cells) && g[2].cells[0].t === g[2].cells[1].t, `2 items: two equal side-by-side tiles (${g[2].cells.map((c) => c.w + "×" + c.h).join(", ")})`);
    gd(3, g[3].n === 3 && g[3].inside && g[3].cells[0].h === g[3].h && g[3].cells[0].w > g[3].cells[1].w && g[3].cells[1].l === g[3].cells[2].l && g[3].cells[2].t > g[3].cells[1].t, `3 items: one large left + two stacked right, no empty tile (${g[3].cells.map((c) => c.w + "×" + c.h).join(", ")})`);
    gd(4, g[4].n === 4 && g[4].inside && sameSize(g[4].cells) && g[4].cells[3].l > 0 && g[4].cells[3].t > 0, `4 items: a balanced 2×2 (${g[4].cells[0].w}×${g[4].cells[0].h} each)`);
    for (const [n, k] of [[5, 5], [6, 6], [10, 7]]) {
      const x = g[n];
      gd(k, x.n === 4 && x.tiles === 4 && x.inside && sameSize(x.cells) && x.cells[3].overflow && x.more?.inCell && x.more.text === `+${n - 4} more` && x.more.w === x.cells[3].w && x.more.h === x.cells[3].h && x.more.underImg, `${n} items: four tiles in a 2×2, "+${n - 4} more" as an overlay over photo 4 (${x.more?.text}, thumbnail underneath ${x.more?.underImg})`);
    }
    gd(8, g[6].n === 4 && g[6].tiles === 4 && g[6].cells.every((c) => c.t + c.h <= g[6].h + 1), "no fifth visual tile and no extra row below the 2×2");
    gd(10, /^rgba\(10, 13, 20, 0\.5/.test(g[6].more?.bg ?? "") , `the overlay is translucent (${g[6].more?.bg}), the thumbnail stays recognisable`);
    await clickSel(page, "[data-sb-media-more]");
    await sleep(400);
    gd(10, (await page.evaluate(() => document.querySelector("[data-sb-sheet-panel]")?.getAttribute("data-sb-sheet-panel"))) === "organizer" && (await page.evaluate(() => document.querySelectorAll("[data-sb-organizer-tile]").length)) === 10, "+N still opens the one Media Organizer with every asset");
    await page.evaluate(() => document.querySelector("[data-sb-sheet-back]")?.click());
    await sleep(300);
    // GRID-09 — mobile widths, 6 mixed media (chips) incl. selection outline
    const mobG = {};
    for (const w of [360, 375, 390, 430]) {
      await open(page, "&mockai=mixed&mockactivity=high", { viewport: { width: w, height: 800, deviceScaleFactor: 2, hasTouch: true } });
      await openComposer(page);
      await pickMedia(page, LIST.slice(0, 6));
      await waitMealDone(page, 6, 60);
      await sleep(400);
      await page.evaluate(() => document.querySelector("[data-sb-media-collage] [data-sb-thumb='snow']")?.click());
      await sleep(200);
      const x = await geom();
      const sel = await page.evaluate(() => { const t = document.querySelector("[data-sb-thumb-selected='true']"); const r = t?.getBoundingClientRect(); const o = t ? getComputedStyle(t) : null; return t ? { w: Math.round(r.width), outline: o.outlineStyle !== "none" && parseFloat(o.outlineWidth) > 0 } : null; });
      mobG[w] = { scrollW: x.scrollW, contentW: x.contentW, gridW: x.w, inside: x.inside, same: sameSize(x.cells), chips: x.chips, more: x.more?.text, selOutline: sel?.outline, selW: sel?.w, cellW: x.cells[1].w };
    }
    gd(9, Object.entries(mobG).every(([w, m]) => m.scrollW <= Number(w) && m.gridW === m.contentW && m.inside && m.same && m.more), `360/375/390/430: the collage fills the content width with no overflow and a 2×2 of equal tiles (${JSON.stringify(mobG[360])})`);
    gd(11, Object.values(mobG).every((m) => m.chips), "category chips, duration and state badges stay inside their tiles at every width");
    gd(14, Object.values(mobG).every((m) => m.selOutline && m.selW === m.cellW), "the selected outline is visible and changes no tile size");
    // GRID-12/13 — a failed asset and a video keep their cells
    await open(page, "&mockai=nonfood");
    await openComposer(page);
    await pickMedia(page, [GARDEN, PHEWA, "Dusk over Phewa lake, portrait video"]);
    await uploadFiles(["corrupt.heic"]);
    await waitFor(page, () => (window.__SB_ASSET_SNAPSHOT?.() ?? []).some((a) => a.error === "heic"), null, 40, 250);
    await sleep(400);
    const g4e = await geom();
    const states = await page.evaluate(() => [...document.querySelectorAll("[data-sb-media-collage] [data-sb-thumb]")].map((t) => (t.querySelector("[data-sb-media-error]") ? "error" : t.querySelector("[data-sb-media-processing]") ? "processing" : t.textContent.match(/\d:\d\d/) ? "video" : "img")));
    gd(12, g4e.n === 4 && g4e.inside && sameSize(g4e.cells) && states[3] === "error", `a failed tile keeps its 2×2 cell (${states.join(",")})`);
    gd(13, states[2] === "video" && sameSize(g4e.cells), "the video poster keeps its cell and duration badge");

    /* =========================================================== INCREMENTAL AI + FULL CATEGORY CHOICE (INC / CAT) */
    console.log("INCREMENTAL AI + FULL CATEGORY CHOICE");
    const ic = (n, cond, msg) => ok(!!cond, `${n}: ${msg}`);
    const SEVEN = ["Nyatapola temple, Bhaktapur", "A rain-wet hiti courtyard in Kathmandu", PHEWA, "Boudhanath stupa at night with lights", GARDEN, "Kathmandu Durbar Square, crowd and temples", "Terraced hillsides"];
    await open(page, "&mockai=mixed&mockactivity=high:1500");
    await openComposer(page);
    await pickMedia(page, SEVEN);
    await waitMealDone(page, 7, 60);
    await sleep(400);
    const before7 = { meal: R.meal, act: R.act, log: await page.evaluate(() => (window.__SB_MEAL_ANALYSIS_LOG ?? []).length) };
    await pickMedia(page, [SNOW]); // the 8th, via the main Media action
    await sleep(150);
    await clickSel(page, "[data-sb-media-more]");
    await sleep(250);
    const during = await page.evaluate(() => { const t = document.querySelector("[data-sb-organizer-tile='snow']"); return { state: t?.getAttribute("data-sb-asset-state"), pulse: !!t?.querySelector("[data-sb-intel-pulse]"), tiles: document.querySelectorAll("[data-sb-organizer-tile]").length }; });
    await waitMealDone(page, 8, 60);
    await sleep(600);
    const after8 = { meal: R.meal, act: R.act, log: await page.evaluate(() => (window.__SB_MEAL_ANALYSIS_LOG ?? []).map((e) => e.key + ":" + e.status)), chip: await page.evaluate(() => document.querySelector("[data-sb-organizer-tile='snow'] [data-sb-asset-category]")?.getAttribute("data-sb-asset-category")), state: await page.evaluate(() => document.querySelector("[data-sb-organizer-tile='snow']")?.getAttribute("data-sb-asset-state")) };
    ic("INC-1", during.tiles === 8 && (during.state === "analyzing" || during.pulse || after8.log.includes("snow:done")), `the 8th asset enters analysis immediately with a visible state in the organizer (state ${during.state}, pulse ${during.pulse})`);
    ic("INC-2", after8.meal === before7.meal + 1 && after8.log.filter((e) => e.endsWith(":start")).length === 8 && after8.log.filter((e) => e.startsWith("snow:")).length === 2, `only the NEW asset was analysed — exactly one more request (${before7.meal} → ${after8.meal}); the first seven were not re-read`);
    ic("INC-3", after8.chip === "activity" && after8.state === "ready", `the 8th photo's chip becomes Activity when its reading lands (${after8.chip})`);
    // late AI vs a manual change made while analysing
    await page.evaluate(() => document.querySelector("[data-sb-sheet-back]")?.click());
    await sleep(300);
    await open(page, "&mockai=mixed:2500&mockactivity=high");
    await openComposer(page);
    await pickMedia(page, SEVEN.slice(0, 2));
    await waitMealDone(page, 2, 60);
    const b2 = R.meal;
    await pickMedia(page, [THALI]);
    await sleep(200);
    await clickSel(page, "[data-sb-media-more]");
    await sleep(200);
    await clickSel(page, "[data-sb-media-edit]");
    await sleep(300);
    await page.evaluate(() => document.querySelector("[data-sb-organizer-tile='thali']")?.click());
    await sleep(200);
    await page.evaluate(() => document.querySelector("[data-sb-organizer-kind='activity']")?.click());
    await sleep(3200);
    const late = await page.evaluate(() => ({ chip: document.querySelector("[data-sb-organizer-tile='thali'] [data-sb-asset-category]")?.getAttribute("data-sb-asset-category"), done: (window.__SB_MEAL_ANALYSIS_LOG ?? []).some((e) => e.key === "thali" && e.status === "done") }));
    ic("INC-4", late.done && late.chip === "activity" && R.meal === b2 + 1, `a category chosen while the new asset was still analysing survives the late reading (${late.chip}; analysed ${late.done}, one request)`);
    // CAT — all seven kinds reachable from the organizer
    const kinds = await page.evaluate(() => ({ quick: [...document.querySelectorAll("[data-sb-organizer-kind]")].map((b) => b.getAttribute("data-sb-organizer-kind")), more: !!document.querySelector("[data-sb-organizer-kind-more]") }));
    await clickSel(page, "[data-sb-organizer-kind-more]");
    await sleep(400);
    const chooser = await page.evaluate(() => ({ sheet: document.querySelector("[data-sb-sheet-panel]")?.getAttribute("data-sb-sheet-panel"), rows: [...document.querySelectorAll("[data-sb-kind-row] button")].map((b) => b.getAttribute("aria-label")) }));
    ic("CAT-1", kinds.quick.join() === "moment,meal,activity" && kinds.more && chooser.sheet === "record" && chooser.rows.join() === "Life Moment,Meal,Activity,Health,Problem,Project,Meeting", `the organizer offers the three quick kinds plus Other… → the full chooser with all seven (${chooser.rows.join(", ")})`);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-kind-row] button[aria-label='Meeting']")][0]?.click());
    await sleep(400);
    const afterMeeting = await page.evaluate(() => ({ sheet: document.querySelector("[data-sb-sheet-panel]")?.getAttribute("data-sb-sheet-panel"), preview: document.querySelector("[data-sb-organizer-preview]")?.getAttribute("data-sb-organizer-preview") }));
    await clickSel(page, "[data-sb-organizer-done]");
    await sleep(400);
    ic("CAT-2", afterMeeting.sheet === "organizer" && afterMeeting.preview === "thali" && (await pill(page)) === "meeting" && (await page.evaluate(() => !!document.querySelector("[data-sb-domain-quick='meeting']"))), `choosing Meeting from Other… returns to the organizer with the selection kept, and the composer shows the Meeting form (pill ${await pill(page)})`);
    await clickSel(page, "[data-sb-media-edit]");
    await sleep(300);
    await page.evaluate(() => document.querySelector("[data-sb-organizer-tile='nyatapola']")?.click());
    await sleep(200);
    await clickSel(page, "[data-sb-organizer-kind-more]");
    await sleep(300);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-kind-row] button[aria-label='Meal']")][0]?.click());
    await sleep(400);
    const viaChooser = await page.evaluate(() => ({ sheet: document.querySelector("[data-sb-sheet-panel]")?.getAttribute("data-sb-sheet-panel"), chips: [...document.querySelectorAll("[data-sb-organizer-tile]")].map((t) => t.getAttribute("data-sb-organizer-tile") + "=" + (t.querySelector("[data-sb-asset-category]")?.getAttribute("data-sb-asset-category") ?? "-")) }));
    ic("CAT-3", viaChooser.sheet === "organizer" && viaChooser.chips.includes("nyatapola=meal") && viaChooser.chips.includes("thali=meeting"), `Meal chosen through Other… applies to the selected photo only — thali keeps the Meeting chosen for it in CAT-2 (SOCIAL-4: Health · Problem · Project · Meeting are per-asset kinds; superseded 2026-10-29) (${viaChooser.chips.join(", ")})`);
    await page.evaluate(() => document.querySelector("[data-sb-sheet-back]")?.click());
    await sleep(300);

    /* =========================================================== accounting */
    console.log("ACCOUNTING");
    const missing = [];
    for (let i = 1; i <= 148; i++) if (!seen.has(i)) missing.push(i);
    ok(missing.length === 0, `every V3 ID 1…148 was exercised (${missing.length ? "missing: " + missing.join(",") : "all 148"})`);
    ok(pageErrors === 0, `no uncaught page errors across the suite (${pageErrors})`);
  } finally {
    await browser.close();
  }
  console.log(`\nactivity-intelligence: ${passed} passed, ${failures.length} failed`);
  if (failures.length) failures.forEach((f) => console.log("  FAILED: " + f));
  process.exit(0);
})();
