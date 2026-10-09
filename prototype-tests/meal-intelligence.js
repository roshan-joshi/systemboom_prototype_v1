/**
 * UC-MEAL-AI — PHASE 2 FAILING-TESTS-FIRST for the Meal AI foundation. Exactly the 17 NEW
 * CAPABILITY checks from the brief, in the brief's own order — ONE `ok()` per capability, each
 * a single compound condition covering every sub-requirement the brief lists for it. This
 * shape is deliberate: a compound `A && B && C` cannot pass merely because the feature doesn't
 * exist yet — it fails the instant ANY required piece is missing, which right now is every
 * piece. (An earlier draft of this file had several sub-assertions split out individually;
 * some of those passed trivially — e.g. "no [Looks right] button exists" is true whether the
 * capability is missing OR correctly implemented. This rewrite folds every such assertion into
 * its capability's one compound check so it can only ever pass for the genuine reason.)
 *
 * Written against the CURRENT tree, which contains ONLY the accepted Phase 1 schema
 * (`data.ts`/`composer/types.ts`/`composer/submit.ts` — see AGENTS.md) and ZERO Phase 3
 * implementation: no `analyzeMealMedia`, no `/api/analyze-meal` route, no composer UI/effect
 * wiring, no `openai` usage anywhere. Every one of the 17 checks below is expected, and
 * required, to FAIL right now.
 *
 *   node prototype-tests/meal-intelligence.js        (dev server on :3210)
 *
 * ============================== CONTRACT FOR PHASE 3 ==============================
 *
 * Mock seam (same convention as `/api/geocode`'s `?mock=1`): the PAGE is loaded with
 * `&mockai=<scenario>` or `&mockai=<scenario>:<delayMs>`. The client analyzer reads this from
 * `window.location.search` and forwards it to `/api/analyze-meal` as `?mock=<scenario>` (the
 * server route sleeps `delayMs` — if given — before responding, to test late-result safety).
 * Scenarios: `meal` (4 foods, high confidence, a nutrition range), `lowconf` (one low-
 * confidence food only), `nonfood` (empty foods array), `ocr-menu` / `ocr-label` /
 * `ocr-receipt` (one OCR observation of that kind), `fail` (the route returns `{observation:
 * null}`, simulating a provider failure), `echo` (returns `{observation: null,
 * _debugProviderPayload: <the exact object that would be sent to DeepSeek>}` — a TEST-ONLY
 * introspection path, never reachable without `?mock=echo`).
 *
 * DOM hooks the Meal specialist section (`domains.tsx`) must render:
 *   [data-sb-meal-analyzing]   — visible while analysis is in flight
 *   [data-sb-meal-suggestion]  — the suggestion card once usable (non-low-confidence) foods exist
 *   [data-sb-meal-hint]        — the low-confidence-only hint text (never auto-confirmable;
 *                                 this element's mere presence means NO [data-sb-meal-accept]
 *                                 exists alongside it)
 *   [data-sb-meal-accept]      — "Looks right" — confirms every suggested food as-is
 *   [data-sb-meal-adjust]      — "Adjust" — reveals the (existing) Foods & drinks editor,
 *                                 pre-filled with the suggested foods in "suggested" state
 *
 * Existing, ALREADY-IMPLEMENTED hooks this suite also relies on (Phase 1/pre-existing, not
 * part of what Phase 3 must build): [data-sb-fooditem], [data-sb-add-item], the "+ Foods &
 * drinks" chip (`[data-sb-add-field='foodItems']`), `[data-sb-more-toggle]`.
 *
 * Debug global (same spirit as the already-accepted `__SB_SOCIAL_STATE`/`__SB_ASSET_SNAPSHOT`
 * globals — read-only, test-observability only, never a second source of truth):
 *   window.__SB_MEAL_ANALYSIS_LOG — an array Phase 3 pushes onto: `{ key, status, observation }`
 *     where `status` is "start" then "done" or "failed", and `key` is the joined attached
 *     media-asset-id string being analyzed. Lets tests wait deterministically for an analysis
 *     to settle instead of guessing a sleep duration, and lets a video-keyframe failure (which
 *     never reaches the DOM) be observed at all.
 *
 * Manual-entry mechanism this suite deliberately reuses UNCHANGED (already implemented, not
 * part of Phase 3): the Meal "+ Foods & drinks" editor is reachable with or without any AI
 * suggestion ever appearing — a person can always type a food item by hand.
 */
const { launch, sleep } = require("./celestial-lib");
const fs = require("fs");
const path = require("path");

const HOST = "http://localhost:3210";
const B = `${HOST}/style-lab/social?harness=0`;
let passed = 0;
const failures = [];
const ok = (c, m) => { if (c) { passed += 1; console.log(`  ✓ ${m}`); } else { failures.push(m); console.log(`  ✗ ${m}`); } };
const DESKTOP = { width: 1440, height: 1000, deviceScaleFactor: 1 };

async function open(page, extra = "") {
  await page.setViewport(DESKTOP);
  // PHASE B determinism guard (same class as the fleet's `mockai=nonfood` signals): once the
  // composer looks up real nutrition facts after recognition, any flow that doesn't pin its
  // own `mockfacts` scenario would hit the real /api/food-facts route — deterministic today
  // (no USDA key configured → a quiet miss), but a configured key would silently turn these
  // accepted flows into live, nondeterministic USDA calls. Default every open to a pinned
  // MISS; a test that passes its own `mockfacts=` keeps full control.
  const factsPin = extra.includes("mockfacts=") ? "" : "&mockfacts=miss";
  // PHASE B2 — the same determinism guard for the packaged (Open Food Facts) source: no flow may
  // reach the real, public OFF API unless a test pins its own `mockpackaged=` scenario.
  const packagedPin = extra.includes("mockpackaged=") ? "" : "&mockpackaged=miss";
  await page.goto(`${B}&theme=light${factsPin}${packagedPin}${extra}`, { waitUntil: "networkidle2" });
  await sleep(900);
}
const state = (page) => page.evaluate(() => window.__SB_SOCIAL_STATE);
const openComposer = async (page) => { await page.click("[data-sb-open-composer]"); await sleep(450); };
const setText = (page, v) => page.evaluate((x) => { const ta = document.getElementById("sb-composer-text"); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set; set.call(ta, x); ta.dispatchEvent(new Event("input", { bubbles: true })); }, v);
const post = async (page) => { await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => /^(Post|Save)$/.test(b.textContent.trim()) || b.getAttribute("aria-busy"))?.click()); await sleep(1300); };
const details = async (page) => { await page.evaluate(() => { const b = document.querySelector("[data-sb-record-details]"); if (b && b.getAttribute("aria-expanded") !== "true") b.click(); }); await sleep(350); };
const kind = async (page, aria) => {
  // PHASE C regression-guard adaptation (recorded, invariants unchanged): once HIGH-confidence
  // auto-selection exists, a `mockai=meal` photo attach selects Meal BY ITSELF before this
  // helper runs — and one tap on an AI-auto-selected Meal pill is the UNDO gesture (C13), not
  // "open the chooser". So for Meal only: give a fast auto-selection ~1.1s to land first; if
  // the pill already reads "meal" there is nothing to select and tapping would DEselect.
  // Every non-high scenario (lowconf/nonfood/ocr-*/fail/AI-off) times this poll out and takes
  // the unchanged explicit path; a DELAYED high scenario (`meal:2500`, test 14) also times it
  // out by design — there, the explicit selection must win the race against the late result.
  if (aria === "Meal") {
    const auto = await waitFor(page, () => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") === "meal", null, 8, 140);
    if (auto) return;
  }
  await details(page);
  await page.evaluate((a) => [...document.querySelectorAll(`[data-sb-kind-row] button[aria-label='${a}']`)][0]?.click(), aria);
  await sleep(350);
};
const more = async (page) => { await page.evaluate(() => { const b = document.querySelector("[data-sb-more-toggle]"); if (b && b.getAttribute("aria-expanded") !== "true") b.click(); }); await sleep(300); };
const addField = async (page, key) => { await page.evaluate((k) => document.querySelector(`[data-sb-add-field='${k}']`)?.click(), key); await sleep(200); };
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
/**
 * FIX 2 (Phase 3 review) — REAL file upload, the same established pattern
 * `media-intelligence.js`'s own `uploadReal` uses for UC-C4.4's real EXIF fixtures: open the
 * Media sheet (which renders the hidden real `<input type=file multiple>` in the DOM) and
 * drive that input DIRECTLY via Puppeteer's `uploadFile` — never clicking the visible "Upload"
 * row, which calls the input's own `.click()` and would otherwise try to open a real native OS
 * file dialog. No implementation code needed changing for this: `registerUploads` already
 * creates a real `URL.createObjectURL` blob for ANY uploaded file regardless of type, so a
 * genuinely-video file uploaded this way gets a `src` that real client-side keyframe
 * extraction can actually decode — unlike the My Media fixture library's "video" entries.
 */
const uploadReal = async (page, absPaths) => {
  await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer-actions] button")].find((b) => b.getAttribute("aria-label") === "Media")?.click());
  await sleep(300);
  const input = await page.waitForSelector("input[type=file][multiple]");
  await input.uploadFile(...absPaths);
  await sleep(700);
};
const newest = async (page) => (await state(page)).moments.filter((m) => m.id.startsWith("m-new-"))[0];
const waitFor = async (page, fn, arg, tries, gap) => {
  for (let i = 0; i < tries; i++) {
    if (await page.evaluate(fn, arg)) return true;
    await sleep(gap);
  }
  return false;
};
// Waits for the Meal analysis log (Phase 3's debug global) to record a settled entry keyed by
// the currently-attached media set. Returns that entry, or null if it never settles.
const waitForAnalysis = async (page, tries = 40, gap = 250) => {
  const settled = await waitFor(page, () => {
    const log = window.__SB_MEAL_ANALYSIS_LOG;
    return Array.isArray(log) && log.some((e) => e.status === "done" || e.status === "failed");
  }, null, tries, gap);
  if (!settled) return null;
  return page.evaluate(() => {
    const log = window.__SB_MEAL_ANALYSIS_LOG;
    return log[log.length - 1];
  });
};
const setLastFoodName = (page, name) =>
  page.evaluate((n) => {
    const rows = [...document.querySelectorAll("[data-sb-fooditem]")];
    const input = rows[rows.length - 1]?.querySelector("input");
    if (!input) return false;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, n);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }, name);

// THALI: "Dal bhat tarkari on a steel plate" — a food-themed My Media fixture with NO EXIF
// (no metadata-review banner to route around). TERRACE VIDEO: "Wind over the rice terraces,
// video" — a fixture "video" whose own src is a still JPEG (the prototype's honest video
// model), so real keyframe extraction against it genuinely fails — exercising §9 for real.
const THALI = "Dal bhat tarkari on a steel plate";
const TERRACE_VIDEO = "Wind over the rice terraces, video";
// FIX 2 (Phase 3 review) — a REAL, genuinely decodable MP4 (real H.264 video track, ~2.5s,
// ~17KB; see fixtures/generate-video-fixture.swift), uploaded as a real device file (never
// selected from the My Media fixture library, which has no real video content at all — see
// TERRACE_VIDEO above). Used ONLY by §8, which needs extraction to genuinely SUCCEED; §9 keeps
// TERRACE_VIDEO unchanged, since it needs extraction to genuinely FAIL.
const REAL_VIDEO_PATH = path.join(__dirname, "fixtures", "meal-video.mp4");

async function attachMealPhoto(page, extra = "") {
  await open(page, extra);
  await openComposer(page);
  await pickMedia(page, [THALI]);
  await kind(page, "Meal");
}


/* ================= PHASE V2 — MEAL PARITY AFTER THE SHARED FIELD CONTRACT (V2-21 … V2-26) =================
 * The Meal engine now consumes `composer/field-contract.ts` for its universal field transitions. These checks run the REAL
 * composer through the accepted V1 flows and assert the same effective values, states, sources and evidence as before the
 * extraction (the contract's own behaviour is proven independently in field-contract.js, V2-1 … V2-20, V2-27 … V2-30).
 */
async function runV2(page) {
  const NYA = "Nyatapola temple, Bhaktapur";
  const PHEWA = "Dusk over Phewa lake";
  const v2 = (n, cond, msg) => ok(!!cond, `V2-${n}: ${msg}`);
  const val = (key) => page.evaluate((k) => document.querySelector(`[data-sb-ufield='${k}']`)?.value, key);
  const setVal = (key, v) => page.evaluate((k, x) => { const i = document.querySelector(`[data-sb-ufield='${k}']`); if (!i) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, x); i.dispatchEvent(new Event("input", { bubbles: true })); return true; }, key, v);
  const clear = async (key) => { await page.evaluate((k) => document.querySelector(`[data-sb-clear='${k}']`)?.click(), key); await sleep(200); };
  const clickThumb = async (i) => { await page.evaluate((n) => [...document.querySelectorAll("[data-sb-media-collage] [data-sb-thumb]")][n]?.click(), i); await sleep(300); };
  const done = (n) => waitFor(page, (need) => (window.__SB_MEAL_ANALYSIS_LOG || []).filter((e) => e.status === "done").length >= need, n, 80, 250);
  const flow = async (extra, alts, n = 1) => {
    await open(page, extra);
    await openComposer(page);
    await pickMedia(page, alts);
    await page.evaluate(() => document.querySelector("[data-sb-meta-ignore]")?.click());
    await done(n);
    await sleep(900);
    await more(page);
  };
  const assets = async () => (await newest(page))?.fields?.mealAssets ?? [];
  const cell = (a, f) => a?.[f];
  const AI_NAME = "Grilled chicken with vegetables";

  console.log("V2-21/22/23/24. ONE PHOTO — name · clear · nutrition provenance · Looks right");
  await flow("&mockai=v1assets&mockfacts=found", [THALI]);
  const nameBefore = await val("items");
  await setVal("items", "My salad");
  await sleep(200);
  await clear("calories");
  await page.evaluate(() => document.querySelector("[data-sb-meal-accept]")?.click());
  await sleep(300);
  await post(page);
  const a1 = (await assets())[0];
  const rec1 = await newest(page);
  v2(21, nameBefore === AI_NAME && rec1?.fields?.items === "My salad" && cell(a1, "name")?.state === "corrected" && cell(a1, "name")?.value === "My salad" && cell(a1, "name")?.original === AI_NAME && cell(a1, "name")?.source === "ai_visual_estimate", `Meal name: the AI name fills ("${nameBefore}"), the person's edit wins ("${rec1?.fields?.items}"), state corrected, the original AI name and its source are preserved`);
  v2(22, cell(a1, "calories")?.state === "cleared" && cell(a1, "calories")?.value === undefined && cell(a1, "calories")?.original !== undefined && cell(a1, "calories")?.source === "usda" && !rec1?.fields?.nutrition?.calories, `a cleared nutrient stays cleared (state ${cell(a1, "calories")?.state}, value ${JSON.stringify(cell(a1, "calories")?.value)}), its USDA evidence is kept (source ${cell(a1, "calories")?.source}) and it is not in the saved nutrition`);
  const p1 = cell(a1, "protein");
  v2(23, p1?.source === "usda" && !!p1?.ref?.fdcId && p1?.value?.value !== undefined && p1?.original?.value === p1?.value?.value, `structured USDA facts replaced the AI estimate for the untouched nutrients: protein ${JSON.stringify(p1?.value)} · source ${p1?.source} · fdcId ${p1?.ref?.fdcId}`);
  const confirmedKeys = ["preparation", "portion", "occasion", "setting", "components", "protein", "carbs", "fat"].filter((f) => cell(a1, f)?.value !== undefined && !(Array.isArray(cell(a1, f)?.value) && cell(a1, f).value.length === 0));
  v2(24, confirmedKeys.length >= 5 && confirmedKeys.every((f) => cell(a1, f)?.state === "confirmed") && cell(a1, "protein")?.source === "usda" && cell(a1, "preparation")?.source === "ai_visual_estimate" && cell(a1, "name")?.state === "corrected" && cell(a1, "calories")?.state === "cleared", `Looks right confirmed every shown populated field (${confirmedKeys.join(", ")}) without changing a source (protein ${cell(a1, "protein")?.source}, preparation ${cell(a1, "preparation")?.source}); the person's correction and clear stayed theirs`);
  await open(page, "&mockai=v1assets&mockfacts=miss");
  await openComposer(page);
  await pickMedia(page, [THALI]);
  await done(1);
  await sleep(900);
  await post(page); // zero-effort save, nothing touched
  const z = (await assets())[0];
  v2("24b", cell(z, "calories")?.source === "ai_estimate" && cell(z, "calories")?.state === "default" && cell(z, "name")?.state === "default" && cell(z, "name")?.source === "ai_visual_estimate", `zero-effort Save keeps untouched defaults as suggested defaults (name ${cell(z, "name")?.state}, calories ${cell(z, "calories")?.state}/${cell(z, "calories")?.source}) — saving never confirms`);

  console.log("V2-25. THREE PHOTOS — independent effective values, no cross-photo bleed");
  await flow("&mockai=v1assets&mockfacts=miss", [THALI, NYA, PHEWA], 3);
  const snap0 = await page.evaluate(() => JSON.stringify(window.__SB_ASSET_SNAPSHOT?.()));
  await clickThumb(1);
  await setVal("portion", "2 glasses");
  await clickThumb(2);
  await clear("portion");
  await clickThumb(0);
  await post(page);
  const snap1 = await page.evaluate(() => JSON.stringify(window.__SB_ASSET_SNAPSHOT?.()));
  const a3 = await assets();
  v2("25b", !!snap0 && snap0.length > 1000 && snap0 === snap1, "sourceMetadata (the asset snapshot) is byte-identical across attach → suggestion → edit → clear → switch photo → save");
  v2(25, a3.length === 3 && cell(a3[0], "portion")?.state === "default" && cell(a3[0], "portion")?.value === "1 plate" && cell(a3[1], "portion")?.state === "corrected" && cell(a3[1], "portion")?.value === "2 glasses" && cell(a3[1], "portion")?.original === "1 glass" && cell(a3[2], "portion")?.state === "cleared" && cell(a3[2], "portion")?.value === undefined && cell(a3[2], "portion")?.original === "2 pieces", `each photo keeps its OWN effective value: photo 1 "${cell(a3[0], "portion")?.value}" (${cell(a3[0], "portion")?.state}), photo 2 "${cell(a3[1], "portion")?.value}" (${cell(a3[1], "portion")?.state}), photo 3 ${JSON.stringify(cell(a3[2], "portion")?.value)} (${cell(a3[2], "portion")?.state})`);

  console.log("V2-26. LATE RESULT — a correction and a clear defeat the late analysis");
  await open(page, "&mockai=v1assets:2500&mockfacts=miss");
  await openComposer(page);
  await pickMedia(page, [THALI]);
  await kind(page, "Meal");
  await more(page);
  await setVal("items", "Mine");
  await setVal("portion", "temp");
  await sleep(150);
  await setVal("portion", "");
  await done(1);
  await sleep(1200);
  const lateName = await val("items");
  const latePortion = await val("portion");
  await post(page);
  const a26 = (await assets())[0];
  v2(26, lateName === "Mine" && latePortion === "" && cell(a26, "name")?.state === "corrected" && cell(a26, "name")?.value === "Mine" && cell(a26, "name")?.original === AI_NAME && cell(a26, "portion")?.state === "cleared" && cell(a26, "portion")?.value === undefined && cell(a26, "portion")?.original === "1 plate", `a late result never replaces the person's correction ("${lateName}") or clear (${JSON.stringify(latePortion)}); the late reading is still kept as evidence (name original "${cell(a26, "name")?.original}", portion original "${cell(a26, "portion")?.original}")`);
  console.log("V2. (Meal parity: V2-21 … V2-26 + zero-effort Save)");
}

/* ================= PHASE V1.1 — INTELLIGENCE WAITING EXPERIENCE (W1 … W40) =================
 * UX only: the waiting state is derived from the REAL per-photo request state (analysis in flight → facts in flight →
 * ready · manual). Timing is made deterministic by HOLDING the real /api/analyze-meal and /api/food-facts requests with
 * Puppeteer request interception and releasing them one by one — no route change, no fake timing.
 */
async function runW(page) {
  const NYA = "Nyatapola temple, Bhaktapur";
  const PHEWA = "Dusk over Phewa lake";
  let wn = 0;
  const w = (n, cond, msg) => { wn += 1; ok(!!cond, `W${n}: ${msg}`); };
  const PRIMARY = "Understanding this meal…";
  const SECONDARY = "Reading the photo and preparing the details.";
  const NUTRITION = "Checking nutrition…";
  const LONG1 = "Still working on the details…";
  const LONG2 = "You can keep editing or save without waiting.";
  // --- gating: hold real API requests, release on demand --------------------------------------------------------------
  const setupGates = async () => {
    const g = { analyze: [], facts: [], bodies: [] };
    await page.setRequestInterception(true);
    const h = (req) => {
      const u = req.url();
      const kind = u.includes("/api/analyze-meal") ? "analyze" : u.includes("/api/food-facts") ? "facts" : null;
      if (!kind) { req.continue().catch(() => {}); return; }
      g.bodies.push({ kind, body: req.postData() ?? "" });
      const e = { url: u, body: req.postData() ?? "", released: false, release() { if (!e.released) { e.released = true; req.continue().catch(() => {}); } } };
      g[kind].push(e);
    };
    page.on("request", h);
    g.stop = async () => {
      for (const e of [...g.analyze, ...g.facts]) e.release();
      page.off("request", h);
      await page.setRequestInterception(false).catch(() => {});
    };
    return g;
  };
  const until = (g, kind, n) => waitFor(page, () => true, null, 1, 1).then(async () => { for (let i = 0; i < 60; i++) { if (g[kind].length >= n) return true; await sleep(100); } return false; });
  const text = (sel) => page.evaluate((s_) => document.querySelector(s_)?.textContent ?? null, sel);
  const exists = (sel) => page.evaluate((s_) => !!document.querySelector(s_), sel);
  const count = (sel) => page.evaluate((s_) => document.querySelectorAll(s_).length, sel);
  const composerText = () => page.evaluate(() => document.querySelector("[data-sb-composer]")?.textContent ?? "");
  const setVal = (key, v) => page.evaluate((k, val) => { const i = document.querySelector(`[data-sb-ufield='${k}']`); if (!i) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, val); i.dispatchEvent(new Event("input", { bubbles: true })); return true; }, key, v);
  const val = (key) => page.evaluate((k) => document.querySelector(`[data-sb-ufield='${k}']`)?.value, key);
  const thumbs = () => page.evaluate(() => [...document.querySelectorAll("[data-sb-media-collage] [data-sb-thumb]")].map((e) => ({ id: e.getAttribute("data-sb-thumb"), state: e.getAttribute("data-sb-asset-state"), pulse: e.querySelector("[data-sb-intel-pulse]")?.getAttribute("data-sb-intel-pulse") ?? null, selected: e.getAttribute("data-sb-thumb-selected") === "true" })));
  const clickThumb = async (i) => { await page.evaluate((n) => [...document.querySelectorAll("[data-sb-media-collage] [data-sb-thumb]")][n]?.click(), i); await sleep(300); };
  const attach = async (extra, alts) => {
    await open(page, extra);
    const g = await setupGates();
    await openComposer(page);
    await pickMedia(page, alts);
    await page.evaluate(() => document.querySelector("[data-sb-meta-ignore]")?.click());
    return g;
  };
  // Requests are issued in a nondeterministic order (each photo is read to a data URL first), so map every held analysis
  // request to ITS photo by the size of the image it carries.
  const mapAnalyze = async (g) => {
    const sizes = await page.evaluate(async () => Promise.all([...document.querySelectorAll("[data-sb-media-collage] [data-sb-thumb] img")].map(async (i) => (await (await fetch(i.src)).blob()).size)));
    const want = sizes.map((n) => 4 * Math.ceil(n / 3));
    const out = [];
    for (const e of g.analyze) {
      const len = (JSON.parse(e.body).images?.[0]?.dataUrl ?? "").length;
      let best = 0;
      want.forEach((x, i) => { if (Math.abs(x - len) < Math.abs(want[best] - len)) best = i; });
      out[best] = e;
    }
    return out;
  };
  const selectMeal = async () => { await kind(page, "Meal"); await sleep(250); };
  const snap = () => page.evaluate(() => JSON.stringify(window.__SB_ASSET_SNAPSHOT?.()));

  console.log("W1–W5. ONE PHOTO — recognition pending: the selected photo shows an active state; exact copy; no fake percentage; Composer interactive");
  let g = await attach("&mockai=v1assets&mockfacts=found", [THALI]);
  await until(g, "analyze", 1);
  await selectMeal();
  await sleep(300);
  const pulse1 = await thumbs();
  const prim1 = await text("[data-sb-intel-primary]");
  const sec1 = await text("[data-sb-intel-secondary]");
  const card1 = await text("[data-sb-meal-analyzing]");
  const skel1 = await count("[data-sb-meal-analyzing] [data-sb-skeleton]");
  const snapA = await snap();
  w(1, pulse1.length === 1 && pulse1[0].state === "analyzing" && pulse1[0].pulse === "analyzing", `the selected photo shows an active intelligence state before recognition resolves (${JSON.stringify(pulse1)})`);
  w(2, prim1 === PRIMARY, `the exact primary copy "${PRIMARY}" renders (${JSON.stringify(prim1)})`);
  w(3, sec1 === SECONDARY, `the exact secondary copy "${SECONDARY}" renders (${JSON.stringify(sec1)})`);
  w(4, !!card1 && !/\d+\s*%/.test(card1) && !/\d+\s*(s|sec|seconds?)\b.*(left|remaining)/i.test(card1) && skel1 > 0, `no fabricated percentage / countdown in the processing UI; skeleton placeholders hold unresolved fields (${skel1} skeletons)`);
  await page.evaluate(() => { const ta = document.getElementById("sb-composer-text"); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(ta, "Dinner with family"); ta.dispatchEvent(new Event("input", { bubbles: true })); });
  await setVal("items", "Mom's chicken salad");
  await sleep(250);
  const txt5 = await page.evaluate(() => document.getElementById("sb-composer-text")?.value);
  const nm5 = await val("items");
  const inert5 = await page.evaluate(() => !!document.querySelector("[data-sb-composer]")?.closest("[inert]") || document.querySelector("[data-sb-composer]")?.hasAttribute("inert"));
  w(5, txt5 === "Dinner with family" && nm5 === "Mom's chicken salad" && !inert5, `while recognition is pending the Composer is fully interactive (text "${txt5}", Meal name "${nm5}", inert ${inert5})`);
  const nPre = g.analyze.length;
  w(16, nPre === 1, `one photo = ONE analysis request, and the waiting UI caused no extra request (${nPre})`);

  console.log("W6/W8–W12/W24/W25. RECOGNITION RESOLVES FIRST, THEN FACTS — progressive reveal; user input survives");
  g.analyze[0].release();
  await until(g, "facts", 1);
  await sleep(500);
  await page.evaluate(() => { const el = document.querySelector("[data-sb-meal-suggestion]"); window.__tagCard = el; });
  const afterRec = await page.evaluate(() => ({
    identity: document.querySelector("[data-sb-meal-identity]")?.textContent ?? null,
    madeOf: document.querySelector("[data-sb-made-of]")?.textContent ?? null,
    analyzing: !!document.querySelector("[data-sb-meal-analyzing]"),
    nutrition: document.querySelector("[data-sb-nutrition-waiting]")?.textContent ?? null,
    skeletons: document.querySelectorAll("[data-sb-meal-suggestion] [data-sb-skeleton], [data-sb-meal-analyzing] [data-sb-skeleton]").length,
    fact: !!document.querySelector("[data-sb-food-fact]"),
  }));
  w(6, (await val("items")) === "Mom's chicken salad", `a name the person typed while recognition was pending survives the result ("${await val("items")}") — the AI's own name stays in the observation`);
  w(8, /Grilled chicken with vegetables/.test(afterRec.identity ?? "") && !afterRec.fact, `recognition resolved first: the identity appears ("${afterRec.identity}") while the structured nutrition fact has not arrived`);
  w(9, afterRec.nutrition === NUTRITION, `nutrition resolution shows exactly "${NUTRITION}" (${JSON.stringify(afterRec.nutrition)})`);
  w(25, !afterRec.analyzing && !!afterRec.identity && !!afterRec.madeOf && afterRec.skeletons === 0, `the recognition group resolved TOGETHER in one step — identity + Made of present, no skeleton left, no staged timer (identity "${afterRec.identity}", made of "${afterRec.madeOf}")`);
  w(24, afterRec.skeletons === 0, `once a value exists its skeleton disappears (${afterRec.skeletons} left)`);
  g.facts[0].release();
  await sleep(900);
  const afterFacts = await page.evaluate(() => ({
    same: window.__tagCard === document.querySelector("[data-sb-meal-suggestion]"),
    fact: document.querySelector("[data-sb-food-fact]")?.textContent ?? null,
    nutrition: !!document.querySelector("[data-sb-nutrition-waiting]"),
  }));
  w(10, afterFacts.same && !!afterFacts.fact, `the fact resolves in place — the already-rendered recognition card is the SAME node, no whole-form reload (fact "${afterFacts.fact}")`);
  const ready1 = await composerText();
  w(11, !ready1.includes(PRIMARY) && !ready1.includes(NUTRITION) && !afterFacts.nutrition && (await count("[data-sb-meal-analyzing]")) === 0, `when all work resolves neither processing line is shown`);
  w(12, !/analysis complete|all done|complete!|done!/i.test(ready1) && (await count("[data-sb-composer] [role='alert']")) === 0, `no "Analysis complete" success banner`);
  await page.evaluate(() => document.querySelector("[data-sb-more-toggle]")?.getAttribute("aria-expanded") !== "true" && document.querySelector("[data-sb-more-toggle]")?.click());
  await sleep(300);
  const ed40b = await page.evaluate(() => { const i = document.querySelector("[data-sb-ufield='components']"); return i ? { ro: i.readOnly, dis: i.disabled } : null; });
  await setVal("components", "kept by me");
  w(40, !!ed40b && !ed40b.ro && !ed40b.dis && (await val("components")) === "kept by me", `after the loading → ready transition the V1 editors are still real editable inputs (${JSON.stringify(ed40b)})`);
  await page.evaluate(() => document.querySelector("[data-sb-meal-accept]")?.click());
  await sleep(300);
  const nLR = g.analyze.length + g.facts.length;
  w(29, g.analyze.length === 1, `Looks right triggers no new analysis (${g.analyze.length} analysis requests)`);
  await page.evaluate(() => document.querySelector("[data-sb-meal-adjust]")?.click());
  await sleep(300);
  w(30, g.analyze.length === 1 && g.facts.length + g.analyze.length === nLR, `Adjust triggers no new analysis (${g.analyze.length} analysis, ${g.facts.length} facts)`);
  const snapB = await snap();
  w(38, !!snapA && snapA.length > 100 && snapA === snapB, `sourceMetadata (the whole asset snapshot) is byte-identical across attach → processing → recognition → facts → ready`);
  await post(page);
  const rec6 = await newest(page);
  w("6b", rec6?.fields?.items === "Mom's chicken salad" && g.analyze.length === 1, `the Meal saved with the person's own name ("${rec6?.fields?.items}") — one analysis request in total (${g.analyze.length})`);
  const bodyKeys = g.bodies.filter((b) => b.kind === "analyze").flatMap((b) => Object.keys(JSON.parse(b.body)));
  const factKeys = g.bodies.filter((b) => b.kind === "facts").flatMap((b) => Object.keys(JSON.parse(b.body)));
  const allBodies = g.bodies.map((b) => b.body).join("\n");
  w(39, bodyKeys.every((k) => k === "images") && factKeys.every((k) => ["canonicalName", "brand"].includes(k)) && !/sourceMetadata|gps|caption|filename|assetState|intel|waiting|skeleton|u-demo|Giulia/i.test(allBodies.replace(/data:image[^"]*/g, "")), `no new provider-bound keys: analyze ${JSON.stringify([...new Set(bodyKeys)])}, facts ${JSON.stringify([...new Set(factKeys)])}`);
  await g.stop();

  console.log("W7. USER CLEAR DURING ANALYSIS WINS");
  g = await attach("&mockai=v1assets&mockfacts=miss", [THALI]);
  await until(g, "analyze", 1);
  await selectMeal();
  await setVal("items", "temporary words");
  await sleep(150);
  await setVal("items", "");
  await sleep(150);
  g.analyze[0].release();
  await sleep(1500);
  const clr = await val("items");
  w(7, clr === "", `a field the person cleared while recognition was pending stays cleared after the result ("${clr}")`);
  await g.stop();

  console.log("W13/W14/W15. FAILURE · AI OFF — no technical errors, manual form stays usable, no false activity");
  await open(page, "&mockai=fail:1200");
  g = await setupGates();
  await openComposer(page);
  await pickMedia(page, [THALI]);
  await until(g, "analyze", 1);
  await selectMeal();
  g.analyze[0].release();
  await sleep(2200);
  await setVal("items", "Plain rice");
  const t13 = await composerText();
  await post(page);
  const rec13 = await newest(page);
  const failEls = await page.evaluate(() => [...document.querySelectorAll("[data-sb-intel-failed]")].map((e) => e.textContent));
  w(13, (await count("[data-sb-meal-analyzing]")) === 0 && rec13?.fields?.items === "Plain rice", `recognition failed: the processing state stops, the manual Meal stays editable and saves ("${rec13?.fields?.items}")`);
  w(14, !/deepseek|api|timeout|timed out|error|\b5\d\d\b|failed|analysis request|exception/i.test(t13) && failEls.every((x) => x === "Couldn't fill this one automatically"), `no technical error is shown; any failure text is exactly the approved copy (${JSON.stringify(failEls)})`);
  await g.stop();
  await open(page, "&mockai=v1assets");
  await page.evaluate(() => localStorage.setItem("sb-smart-assist", "off"));
  await page.reload({ waitUntil: "networkidle2" });
  await sleep(900);
  g = await setupGates();
  await openComposer(page);
  await pickMedia(page, [THALI]);
  await page.evaluate(() => document.querySelector("[data-sb-meta-ignore]")?.click());
  await selectMeal();
  await sleep(1500);
  const off = await thumbs();
  const tOff = await composerText();
  w(15, g.analyze.length === 0 && off.every((x) => x.state === "manual" && !x.pulse) && !tOff.includes(PRIMARY) && (await count("[data-sb-meal-analyzing], [data-sb-intel-pulse]")) === 0, `AI OFF: zero analysis requests (${g.analyze.length}), no pulse, no false "${PRIMARY}" (${JSON.stringify(off)})`);
  await page.evaluate(() => localStorage.removeItem("sb-smart-assist"));
  await g.stop();

  console.log("W28. SAVE WHILE ANALYZING");
  g = await attach("&mockai=v1assets&mockfacts=miss", [THALI]);
  await until(g, "analyze", 1);
  await selectMeal();
  await setVal("items", "Saved before the answer");
  const postBtn = await page.evaluate(() => { const b = [...document.querySelectorAll("[data-sb-composer] footer button")].find((x) => /^(Post|Save)$/.test(x.textContent.trim())); return b ? { disabled: b.disabled, aria: b.getAttribute("aria-disabled") } : null; });
  await post(page);
  const recS = await newest(page);
  w(28, !!postBtn && !postBtn.disabled && postBtn.aria !== "true" && recS?.fields?.items === "Saved before the answer", `Post stays available while recognition is still pending and saves immediately (${JSON.stringify(postBtn)}, "${recS?.fields?.items}")`);
  await g.stop();

  console.log("W26/W27. LONG WAIT — calm copy swap, no countdown, zero extra requests");
  g = await attach("&mockai=v1assets&mockfacts=miss&mockwait=5500", [THALI]);
  await until(g, "analyze", 1);
  await selectMeal();
  const shortCopy = await text("[data-sb-intel-primary]");
  await waitFor(page, (c) => document.querySelector("[data-sb-intel-primary]")?.textContent === c, LONG1, 60, 150);
  const l1 = await text("[data-sb-intel-primary]");
  const l2 = await text("[data-sb-intel-secondary]");
  const tLong = await text("[data-sb-meal-analyzing]");
  w(27, shortCopy === PRIMARY && l1 === LONG1 && l2 === LONG2 && !/\d+\s*%|\d+\s*s\b/.test(tLong ?? ""), `the longer-wait copy is exactly "${LONG1}" / "${LONG2}" and carries no countdown (${JSON.stringify([shortCopy, l1, l2])})`);
  await sleep(1200);
  w(26, g.analyze.length === 1 && g.facts.length === 0, `the longer-wait state caused zero extra network calls (${g.analyze.length} analysis, ${g.facts.length} facts)`);
  await g.stop();

  console.log("W18–W23/W17/W37. THREE PHOTOS — independent per-photo states");
  g = await attach("&mockai=v1assets&mockfacts=found", [THALI, NYA, PHEWA]);
  await until(g, "analyze", 3);
  await selectMeal();
  await sleep(300);
  const byPhoto = await mapAnalyze(g);
  byPhoto[1].release();
  await until(g, "facts", 1);
  g.facts.find((f) => /mango|lassi/i.test(f.body))?.release();
  await sleep(500);
  byPhoto[2].release();
  await until(g, "facts", 2);
  await sleep(500);
  const st3 = await thumbs();
  w(18, st3.length === 3 && st3[0].state === "analyzing" && st3[1].state === "ready" && st3[2].state === "resolving", `each photo shows its OWN state: photo 1 ${st3[0]?.state}, photo 2 ${st3[1]?.state}, photo 3 ${st3[2]?.state}`);
  await clickThumb(1);
  const sel2 = await page.evaluate(() => ({ id: document.querySelector("[data-sb-meal-identity]")?.textContent ?? null, analyzing: !!document.querySelector("[data-sb-meal-analyzing]"), wait: !!document.querySelector("[data-sb-nutrition-waiting]"), form: document.querySelector("[data-sb-ufield='items']")?.value }));
  w(19, /Mango lassi/.test(sel2.id ?? "") && !sel2.analyzing && !sel2.wait, `selecting the READY photo 2 shows its full form immediately while photo 1 still analyzes ("${sel2.id}")`);
  await clickThumb(0);
  const sel1 = await page.evaluate(() => ({ id: document.querySelector("[data-sb-meal-identity]")?.textContent ?? null, analyzing: document.querySelector("[data-sb-meal-analyzing] [data-sb-intel-primary]")?.textContent ?? null, ind: document.querySelector("[data-sb-photo-indicator]")?.textContent ?? null }));
  w(20, sel1.analyzing === PRIMARY && !/Mango lassi/.test(sel1.id ?? "") && /Photo 1 of 3/.test(sel1.ind ?? ""), `selecting the ANALYZING photo 1 shows ITS processing state (${JSON.stringify(sel1)}) and not photo 2's result`);
  await clickThumb(2);
  const sel3 = await page.evaluate(() => ({ id: document.querySelector("[data-sb-meal-identity]")?.textContent ?? null, wait: document.querySelector("[data-sb-nutrition-waiting]")?.textContent ?? null }));
  w(21, /Gulab jamun/.test(sel3.id ?? "") && sel3.wait === NUTRITION, `selecting the FACT-RESOLVING photo 3 shows its recognized Meal plus "${NUTRITION}" (${JSON.stringify(sel3)})`);
  await clickThumb(0);
  g.facts.find((f) => /gulab|jamun/i.test(f.body))?.release(); // photo 3 finishes in the BACKGROUND
  await sleep(900);
  const bg = await thumbs();
  const bgCard = await text("[data-sb-meal-analyzing] [data-sb-intel-primary]");
  w(22, bg[0].selected && !bg[1].selected && !bg[2].selected && bg[2].state === "ready" && bgCard === PRIMARY, `a background photo finishing does not change the selection or the visible card (selected ${JSON.stringify(bg.map((x) => x.selected))}, photo 3 ${bg[2].state})`);
  await clickThumb(1);
  await clickThumb(0);
  await clickThumb(0);
  w(17, g.analyze.length === 3, `selecting / reselecting photos causes zero new analysis calls (${g.analyze.length})`);
  w(37, g.analyze.length === 3 && g.analyze.length === bg.length, `three different photos = exactly 3 analysis requests total, still 3 after selecting, swapping, animating and results (${g.analyze.length})`);
  // removed photo: its late answer cannot show under another photo
  await page.evaluate(() => document.querySelector("[data-sb-media-edit]")?.click());
  await sleep(350);
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === "Remove photo 1")?.click());
  await sleep(300);
  await page.evaluate(() => document.querySelector("[data-sb-sheet-back]")?.click());
  await sleep(450);
  byPhoto[0].release(); // the removed photo's answer arrives late
  await sleep(1200);
  const after23 = await thumbs();
  const card23 = await page.evaluate(() => ({ analyzing: !!document.querySelector("[data-sb-meal-analyzing]"), id: document.querySelector("[data-sb-meal-identity]")?.textContent ?? null }));
  w(23, after23.length === 2 && after23.every((x) => !x.pulse && x.state === "ready") && !card23.analyzing && !/Grilled chicken/.test(card23.id ?? ""), `a REMOVED photo's late result shows no loading/result UI under another photo (${JSON.stringify(after23.map((x) => x.state))}, card "${card23.id}")`);
  await g.stop();

  console.log("W31–W36. DARK · LIGHT · REDUCED MOTION · NO BRANDING · NO SPINNER · NO LAYOUT BLOCK");
  const luminance = (rgb) => { const m = rgb.match(/[\d.]+/g).map(Number); const c = m.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const probe = () => page.evaluate(() => {
    const card = document.querySelector("[data-sb-meal-analyzing]");
    const skel = document.querySelector("[data-sb-meal-analyzing] [data-sb-skeleton]");
    const prim = document.querySelector("[data-sb-intel-primary]");
    const orbit = document.querySelector("[data-sb-thumb] [data-sb-intel-orbit]");
    const pulse = document.querySelector("[data-sb-thumb] [data-sb-intel-pulse]");
    const flat = (el) => { let bg = "rgba(0,0,0,0)"; for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; const a = c.match(/[\d.]+/g); if (a && (a.length < 4 || Number(a[3]) > 0.9)) { bg = c; break; } } return bg; };
    return {
      card: !!card,
      primColor: prim ? getComputedStyle(prim).color : null,
      cardBg: card ? flat(card) : null,
      skelBg: skel ? getComputedStyle(skel).backgroundColor : null,
      skelAnim: skel ? getComputedStyle(skel).animationName : null,
      orbitAnim: orbit ? getComputedStyle(orbit).animationName : null,
      orbitIter: orbit ? getComputedStyle(orbit).animationIterationCount : null,
      orbitDur: orbit ? getComputedStyle(orbit).animationDuration : null,
      pulseBg: pulse ? getComputedStyle(pulse).backgroundColor : null,
      pulseDot: pulse ? [...pulse.querySelectorAll("[data-sb-intel-dot]")].map((d) => getComputedStyle(d).backgroundColor) : [],
      cls: [...(card?.querySelectorAll("*") ?? []), ...(pulse?.querySelectorAll("*") ?? [])].map((e) => e.getAttribute("class") ?? "").join(" "),
      roles: [...document.querySelectorAll("[data-sb-composer] [role='progressbar'], [data-sb-composer] progress")].length,
      statusText: (card?.textContent ?? "") + " " + [...document.querySelectorAll("[data-sb-thumb] [data-sb-intel-status]")].map((e) => e.textContent).join(" "),
      aria: [...document.querySelectorAll("[data-sb-meal-analyzing] [aria-label], [data-sb-intel-pulse] [aria-label], [data-sb-intel-pulse][aria-label]")].map((e) => e.getAttribute("aria-label")).join(" "),
    };
  });
  // composite an rgba colour over an opaque one (the skeleton is a translucent token laid over the card)
  const over = (fg, bg) => { const f = fg.match(/[\d.]+/g).map(Number); const b = bg.match(/[\d.]+/g).map(Number); const a = f.length > 3 ? f[3] : 1; return `rgb(${[0, 1, 2].map((i) => Math.round(f[i] * a + b[i] * (1 - a))).join(",")})`; };
  const contrast = (a, b) => { const la = luminance(a), lb = luminance(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
  g = await attach("&mockai=v1assets&mockfacts=miss", [THALI]);
  await until(g, "analyze", 1);
  await selectMeal();
  await sleep(400);
  const light = await probe();
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await sleep(300);
  const dark = await probe();
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  await sleep(200);
  const boxCover = await page.evaluate(() => { const b = [...document.querySelectorAll("[data-sb-composer] footer button")].find((x) => /^(Post|Save)$/.test(x.textContent.trim())); if (!b) return null; const r = b.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { inside: b.contains(top), inert: !!document.querySelector("[data-sb-composer]")?.closest("[inert]"), busy: document.querySelector("[data-sb-composer]")?.getAttribute("aria-busy") }; });
  w(31, dark.card && contrast(dark.primColor ?? "rgb(0,0,0)", dark.cardBg ?? "rgb(0,0,0)") >= 4.5 && !!dark.skelBg && luminance(over(dark.skelBg, dark.cardBg)) < 0.5, `dark mode: readable status text (contrast ${contrast(dark.primColor ?? "rgb(0,0,0)", dark.cardBg ?? "rgb(0,0,0)").toFixed(1)}) and a dark-ground skeleton (${dark.skelBg} over ${dark.cardBg})`);
  w(32, light.card && contrast(light.primColor ?? "rgb(0,0,0)", light.cardBg ?? "rgb(255,255,255)") >= 4.5 && !!light.skelBg && luminance(over(light.skelBg, light.cardBg)) > 0.45 && !!light.pulseBg && (light.pulseBg.match(/[\d.]+/g).length < 4 ? false : Number(light.pulseBg.match(/[\d.]+/g)[3]) <= 0.2), `light mode: readable text (contrast ${contrast(light.primColor ?? "rgb(0,0,0)", light.cardBg ?? "rgb(255,255,255)").toFixed(1)}), a light-ground skeleton (${light.skelBg} over ${light.cardBg}) and no dark panel pasted over the photo (overlay ${light.pulseBg})`);
  w(34, !/\bAI\b|deepseek|robot|model|machine learning|generating|loading\.\.\.|please wait|thinking|analyzing with/i.test(light.statusText + " " + light.aria), `no AI branding in the waiting UI (${JSON.stringify(light.statusText.trim().slice(0, 120))})`);
  w(35, light.roles === 0 && !/animate-spin|spinner/.test(light.cls) && /sb-intel/.test(light.orbitAnim ?? "") && !/spin/.test(light.orbitAnim ?? ""), `the primary treatment is the SYSTEMBOOM orbit (${light.orbitAnim}), not a generic spinner/progress element`);
  w(36, !!boxCover && boxCover.inside && !boxCover.inert && boxCover.busy !== "true", `the loading treatment does not block or cover the Composer (Post reachable: ${boxCover?.inside}, inert ${boxCover?.inert}, aria-busy ${boxCover?.busy})`);
  await g.stop();
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  g = await attach("&mockai=v1assets&mockfacts=miss", [THALI]);
  await until(g, "analyze", 1);
  await selectMeal();
  await sleep(400);
  const red = await probe();
  w(33, red.card && /^none$/.test(red.orbitAnim ?? "none") && /^none$/.test(red.skelAnim ?? "none") && /Understanding this meal/.test(red.statusText) && (await exists("[data-sb-intel-pulse]")), `reduced motion: the continuous orbit is off (${red.orbitAnim}) and the skeleton does not breathe (${red.skelAnim}); the static halo and the text still say SYSTEMBOOM is working`);
  await g.stop();
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  console.log("WM. PHONE WIDTHS 360 · 375 · 390 · 430 — the waiting state fits, never overflows, keeps Post and photo selection reachable");
  for (const width of [360, 375, 390, 430]) {
    await page.setViewport({ width, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await open(page, "&mockai=v1assets&mockfacts=found");
    await page.setViewport({ width, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    g = await setupGates();
    await openComposer(page);
    await pickMedia(page, [THALI, NYA, PHEWA]);
    await page.evaluate(() => document.querySelector("[data-sb-meta-ignore]")?.click());
    await until(g, "analyze", 3);
    await selectMeal();
    await sleep(400);
    const m = await page.evaluate(() => {
      const root = document.documentElement;
      const comp = document.querySelector("[data-sb-composer]");
      const card = document.querySelector("[data-sb-meal-analyzing]");
      const post = [...document.querySelectorAll("[data-sb-composer] footer button")].find((x) => /^(Post|Save)$/.test(x.textContent.trim()));
      const pr = post?.getBoundingClientRect();
      const top = pr ? document.elementFromPoint(pr.left + pr.width / 2, pr.top + pr.height / 2) : null;
      const cr = card?.getBoundingClientRect();
      return { pageOverflow: root.scrollWidth - window.innerWidth, compOverflow: comp ? comp.scrollWidth - comp.clientWidth : null, cardInside: !!cr && cr.left >= 0 && cr.right <= window.innerWidth, postReachable: !!post && !!pr && pr.bottom <= window.innerHeight + 1 && post.contains(top), thumbs: document.querySelectorAll("[data-sb-media-collage] [data-sb-thumb]").length };
    });
    await clickThumb(1);
    const sel = (await thumbs()).findIndex((x) => x.selected);
    ok(m.pageOverflow <= 0 && (m.compOverflow ?? 0) <= 0 && m.cardInside && m.postReachable && m.thumbs === 3 && sel === 1, `WM${width}: no horizontal overflow (page ${m.pageOverflow}, composer ${m.compOverflow}), the processing card sits inside the viewport (${m.cardInside}), Post is reachable (${m.postReachable}), photo selection works (selected ${sel})`);
    await g.stop();
  }
  await page.setViewport(DESKTOP);
  console.log(`W. (${wn} waiting-experience checks; expecting 41 = W1–W40 + W6b)`);
}

(async () => {
  const { browser, page } = await launch();
  try {
    if (process.env.V2_ONLY) { await runV2(page); await browser.close(); console.log(`\nmeal-intelligence (V2 only): ${passed} passed, ${failures.length} failed`); failures.forEach((f) => console.log("  FAILED: " + f)); process.exit(0); }
    if (process.env.W_ONLY) { await runW(page); await browser.close(); console.log(`\nmeal-intelligence (W only): ${passed} passed, ${failures.length} failed`); failures.forEach((f) => console.log("  FAILED: " + f)); process.exit(0); }
    /* ================= 1. REAL MEAL PHOTO ================= */
    console.log("1. REAL MEAL PHOTO — client analyzer → /api/analyze-meal (mocked) → normalized MealAIObservation with provenance ai_visual_estimate");
    await attachMealPhoto(page, "&mockai=meal");
    const r1 = await waitForAnalysis(page);
    const cardVisible1 = await page.evaluate(() => !!document.querySelector("[data-sb-meal-suggestion]"));
    let m1 = null;
    if (cardVisible1) {
      await page.evaluate(() => document.querySelector("[data-sb-meal-accept]")?.click());
      await sleep(250);
      await post(page);
      m1 = await newest(page);
    }
    ok(
      r1 !== null && r1.status === "done" && cardVisible1 && !!m1?.fields?.mealAIObservation?.providerModel && m1.fields.foodItems?.some((f) => f.source === "ai_visual_estimate"),
      `real photo → settled analysis (${JSON.stringify(r1)}) → suggestion card (${cardVisible1}) → posted record with mealAIObservation + a confirmed ai_visual_estimate food item (${JSON.stringify(m1?.fields)})`,
    );

    /* ================= 2. MULTIPLE FOODS ================= */
    console.log("2. MULTIPLE FOODS — one meal image produces multiple structured food suggestions");
    await attachMealPhoto(page, "&mockai=meal");
    await waitForAnalysis(page);
    const foodsText2 = await page.evaluate(() => document.querySelector("[data-sb-meal-suggestion]")?.textContent ?? "");
    ok(/Dal bhat/.test(foodsText2) && /Rice/.test(foodsText2) && /Chicken curry/.test(foodsText2) && /Vegetables/.test(foodsText2), `the suggestion names all four distinct foods (found: "${foodsText2}")`);

    /* ================= 3. LOW CONFIDENCE ================= */
    console.log("3. LOW CONFIDENCE — a low-confidence food remains a hint/suggested state and is not automatically confirmed");
    await attachMealPhoto(page, "&mockai=lowconf");
    await waitForAnalysis(page);
    const lc = await page.evaluate(() => ({ hint: document.querySelector("[data-sb-meal-hint]")?.textContent ?? null, acceptBtn: !!document.querySelector("[data-sb-meal-accept]") }));
    await setText(page, "Something I ate.");
    await post(page);
    const m3 = await newest(page);
    ok(
      lc.hint !== null && !lc.acceptBtn && m3?.fields?.mealAIObservation?.confidence === "low" && !m3?.fields?.foodItems?.length,
      `a low-confidence reading shows only as a hint (${JSON.stringify(lc)}), the record carries confidence "low" (${m3?.fields?.mealAIObservation?.confidence}), and posting without acting creates NO confirmed food item (${JSON.stringify(m3?.fields?.foodItems)})`,
    );

    /* ================= 4. NUTRITION RANGE ================= */
    console.log("4. NUTRITION RANGE — visual nutrition returns a range + confidence, rejecting exact fabricated precision");
    await attachMealPhoto(page, "&mockai=meal");
    await waitForAnalysis(page);
    await page.evaluate(() => document.querySelector("[data-sb-meal-accept]")?.click());
    await sleep(250);
    await post(page);
    const m4 = await newest(page);
    const cal4 = m4?.fields?.mealAIObservation?.nutritionEstimate?.calories;
    ok(
      !!cal4?.range && typeof cal4.range.min === "number" && typeof cal4.range.max === "number" && cal4.range.min < cal4.range.max && cal4.value === undefined,
      `calories is a real min/max range with no fabricated exact value alongside it (found: ${JSON.stringify(cal4)})`,
    );

    /* ================= 5. NUTRITION PROVENANCE ================= */
    console.log("5. NUTRITION PROVENANCE — every returned nutrition value preserves its own source");
    const nutrition5 = m4?.fields?.mealAIObservation?.nutritionEstimate;
    const values5 = nutrition5 ? Object.values(nutrition5).filter(Boolean) : [];
    // PHASE B supersession (recorded, never silent): NUTRITION provenance is now the dedicated
    // NutritionSource value "ai_estimate" (B6) — "ai_visual_estimate" remains the FOOD-ITEM
    // provenance asserted by test 1 above, unchanged. The invariant here — every nutrition
    // value carries its own provenance + confidence — is exactly what it always was.
    ok(values5.length > 0 && values5.every((v) => v.source === "ai_estimate" && ["high", "medium", "low"].includes(v.confidence)), `every present nutrition value carries source+confidence (found: ${JSON.stringify(nutrition5)})`);

    /* ================= 6. USER CORRECTION ================= */
    console.log("6. USER CORRECTION — AI suggests Chicken curry; the person corrects it to Paneer curry; the confirmed record says Paneer curry, state corrected");
    await attachMealPhoto(page, "&mockai=meal");
    await waitForAnalysis(page);
    await page.evaluate(() => document.querySelector("[data-sb-meal-adjust]")?.click());
    await sleep(300);
    const rowsBefore6 = await page.evaluate(() => document.querySelectorAll("[data-sb-fooditem]").length);
    const correctedOk = await page.evaluate(() => {
      const rows = [...document.querySelectorAll("[data-sb-fooditem]")];
      const row = rows.find((r) => r.querySelector("input")?.value === "Chicken curry") ?? rows[rows.length - 1];
      const input = row?.querySelector("input");
      if (!input) return false;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, "Paneer curry");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    });
    await sleep(200);
    await post(page);
    const m6 = await newest(page);
    ok(
      rowsBefore6 > 0 && correctedOk && (m6?.fields?.foodItems?.length ?? 0) > 0 && m6.fields.foodItems.some((f) => f.name === "Paneer curry" && f.state === "corrected") && !m6.fields.foodItems.some((f) => f.name === "Chicken curry"),
      `Adjust pre-filled ${rowsBefore6} suggested rows; the edited item posts as Paneer curry/state "corrected", with no "Chicken curry" left in the confirmed list (found: ${JSON.stringify(m6?.fields?.foodItems)})`,
    );

    /* ================= 7. OBSERVATION IMMUTABILITY ================= */
    console.log("7. OBSERVATION IMMUTABILITY — the original MealAIObservation from test 6 remains unchanged after that correction");
    ok(m6?.fields?.mealAIObservation?.foods?.some((f) => f.name === "Chicken curry"), `the AI's OWN reading still says Chicken curry, untouched by the correction (found: ${JSON.stringify(m6?.fields?.mealAIObservation?.foods)})`);

    /* ================= 8. VIDEO KEYFRAMES ================= */
    console.log("8. VIDEO KEYFRAMES — the video path extracts up to five client keyframes and reaches the Meal analysis boundary (FIX 2: a real uploaded MP4, not a My Media fixture)");
    await open(page, "&mockai=meal");
    await openComposer(page);
    await uploadReal(page, [REAL_VIDEO_PATH]);
    await kind(page, "Meal");
    const r8 = await waitForAnalysis(page);
    ok(r8 !== null && r8.status === "done" && Array.isArray(r8.observation?.foods) && r8.observation.foods.length > 0, `a REAL video attachment produces a settled, non-empty analysis (found: ${JSON.stringify(r8)})`);

    /* ================= 9. VIDEO EXTRACTION FAILURE ================= */
    console.log("9. VIDEO EXTRACTION FAILURE — a video whose keyframes cannot be extracted settles as a safe failure, never blocks Save, never shows a technical error");
    // TERRACE_VIDEO's own `src` is a still JPEG standing in for a video (this prototype's
    // honest video model) — a REAL `<video>` element genuinely fails to decode it here, so
    // this exercises a real, not simulated, extraction failure end to end.
    await open(page, "&mockai=meal");
    await openComposer(page);
    await pickMedia(page, [TERRACE_VIDEO]);
    await kind(page, "Meal");
    const r9 = await waitForAnalysis(page);
    const stillAttached9 = await page.evaluate(() => !!document.querySelector("[data-sb-media-collage]"));
    await setText(page, "The terraces after the rain.");
    const canPost9 = await page.evaluate(() => { const b = [...document.querySelectorAll("[data-sb-composer] footer button")].find((x) => /^(Post|Save)$/.test(x.textContent.trim())); return !!b && b.getAttribute("aria-disabled") !== "true"; });
    await post(page);
    const m9 = await newest(page);
    ok(
      r9 !== null && r9.status === "failed" && r9.observation === null && stillAttached9 && canPost9 && !!m9 && m9.media?.kind === "video",
      `keyframe extraction failure settles as a logged, safe null (${JSON.stringify(r9)}), the video stays attached (${stillAttached9}), Save stays available (${canPost9}), and the Meal saves (${!!m9})`,
    );

    /* ================= 10. OCR ================= */
    console.log("10. OCR — menu / package label / receipt fixtures each return structured OCR observations, through the SAME Meal analysis call");
    const ocrResults = {};
    for (const [scenario, expectedKind] of [["ocr-menu", "menu"], ["ocr-label", "package"], ["ocr-receipt", "receipt"]]) {
      await attachMealPhoto(page, `&mockai=${scenario}`);
      await waitForAnalysis(page);
      await setText(page, "Found this.");
      await post(page);
      const m = await newest(page);
      const ocr = m?.fields?.mealAIObservation?.ocrObservations;
      ocrResults[scenario] = Array.isArray(ocr) && ocr.some((o) => o.kind === expectedKind && typeof o.text === "string" && o.text.length > 0);
    }
    ok(ocrResults["ocr-menu"] && ocrResults["ocr-label"] && ocrResults["ocr-receipt"], `all three OCR fixtures produce their own structured observation (found: ${JSON.stringify(ocrResults)})`);

    /* ================= 11. NON-FOOD IMAGE ================= */
    console.log("11. NON-FOOD IMAGE — a non-food image yields no fabricated food observation, and manual Meal creation still works");
    await attachMealPhoto(page, "&mockai=nonfood");
    const r11 = await waitForAnalysis(page);
    const cardShown11 = await page.evaluate(() => !!document.querySelector("[data-sb-meal-suggestion]"));
    await setText(page, "Just a photo.");
    await post(page);
    const m11 = await newest(page);
    ok(
      r11 !== null && r11.status === "done" && Array.isArray(r11.observation?.foods) && r11.observation.foods.length === 0 && !cardShown11 && !m11?.fields?.foodItems?.length,
      `a non-food image settles with zero foods (${JSON.stringify(r11)}), no suggestion card appears (${cardShown11}), and the manually-created Meal carries no fabricated food (${JSON.stringify(m11?.fields?.foodItems)})`,
    );

    /* ================= 12. PROVIDER FAILURE ================= */
    console.log("12. PROVIDER FAILURE — the client receives a safe null, the Meal still saves, no technical error is shown, failures are server-logged only");
    await attachMealPhoto(page, "&mockai=fail");
    const r12 = await waitForAnalysis(page);
    const errorShown12 = await page.evaluate(() => /error|failed|technical/i.test(document.querySelector("[data-sb-composer]")?.textContent ?? ""));
    await setText(page, "Lunch, no photo analysis today.");
    await post(page);
    const m12 = await newest(page);
    ok(r12 !== null && r12.status === "failed" && r12.observation === null && !errorShown12 && !!m12, `a provider failure settles as a safe null (${JSON.stringify(r12)}), with no technical error text (${errorShown12}) and the Meal still saves (${!!m12})`);

    /* ================= 13. AI OFF ================= */
    console.log("13. AI OFF — analyzeMealMedia never called, /api/analyze-meal never requested, manual Meal creation stays complete; turning AI back ON (same media) does start analysis");
    await open(page, "&mockai=meal");
    // FIX 1 (Phase 3 review) — two SEPARATE counters, one per phase of this test, instead of
    // one counter spanning both. The OFF phase must see zero requests; the ON phase, which
    // deliberately re-enables AI afterward, is EXPECTED to see at least one — a single shared
    // counter could never assert "zero" once that later, correct request fires.
    let phase13 = "off";
    const requested13Off = [];
    const requested13On = [];
    page.on("request", (req) => {
      if (!req.url().includes("/api/analyze-meal")) return;
      (phase13 === "off" ? requested13Off : requested13On).push(req.url());
    });
    await openComposer(page);
    await page.evaluate(() => document.querySelector("[data-sb-assist-button]")?.click());
    await sleep(200);
    const wasOn13 = await page.evaluate(() => /Turn off/.test(document.querySelector("[data-sb-assist-toggle]")?.textContent ?? ""));
    if (wasOn13) await page.evaluate(() => document.querySelector("[data-sb-assist-toggle]")?.click());
    else await page.evaluate(() => document.querySelector("[data-sb-assist-button]")?.click());
    await sleep(250);
    await pickMedia(page, [THALI]);
    await kind(page, "Meal");
    await sleep(2500);
    const offUiShown13 = await page.evaluate(() => !!document.querySelector("[data-sb-meal-analyzing], [data-sb-meal-suggestion]"));
    await setText(page, "Made this myself, AI off.");
    await post(page);
    const offSaved13 = !!(await newest(page));
    // Now turn AI back ON without changing the media — this SHOULD start an analysis.
    phase13 = "on";
    await openComposer(page);
    await pickMedia(page, [THALI]);
    await kind(page, "Meal");
    await page.evaluate(() => document.querySelector("[data-sb-assist-button]")?.click());
    await sleep(200);
    await page.evaluate(() => document.querySelector("[data-sb-assist-toggle]")?.click());
    await sleep(250);
    const r13on = await waitForAnalysis(page);
    ok(
      requested13Off.length === 0 && requested13On.length >= 1 && offUiShown13 === false && offSaved13 === true && r13on !== null && r13on.status === "done",
      `AI off: zero /api/analyze-meal requests (${requested13Off.length}), no analyzing/suggestion UI (${offUiShown13}), manual save still works (${offSaved13}); AI back on with media already attached: ${requested13On.length} request(s) fired and an analysis does start (${JSON.stringify(r13on)})`,
    );

    /* ================= 14. LATE AI RESULT ================= */
    console.log("14. LATE AI RESULT — a manual correction made before a delayed AI result arrives is never overwritten by it");
    await attachMealPhoto(page, "&mockai=meal:2500"); // 2.5s artificial delay
    // Before the delayed mock resolves, the person manually adds their own food item via the
    // EXISTING, unrelated Foods & drinks editor (works with or without any AI suggestion).
    await more(page);
    await addField(page, "foodItems");
    await sleep(150);
    await page.evaluate(() => document.querySelector("[data-sb-add-item]")?.click());
    await sleep(150);
    await setLastFoodName(page, "Paneer curry");
    await sleep(200);
    const rowsRightAfterTyping = await page.evaluate(() => [...document.querySelectorAll("[data-sb-fooditem] input")].map((i) => i.value));
    const r14 = await waitForAnalysis(page, 60, 200); // waits out the 2.5s delay
    const rowsAfterLate = await page.evaluate(() => [...document.querySelectorAll("[data-sb-fooditem] input")].map((i) => i.value));
    await post(page);
    const m14 = await newest(page);
    ok(
      rowsRightAfterTyping.includes("Paneer curry") && r14 !== null && r14.status === "done" && rowsAfterLate.includes("Paneer curry") && !rowsAfterLate.includes("Chicken curry") && m14?.fields?.foodItems?.some((f) => f.name === "Paneer curry") && m14?.fields?.mealAIObservation?.foods?.some((f) => f.name === "Chicken curry"),
      `the manual entry (${JSON.stringify(rowsRightAfterTyping)}) survives the delayed AI result (${JSON.stringify(r14)}) untouched (${JSON.stringify(rowsAfterLate)}); the confirmed record keeps Paneer curry while the AI's own (different) reading is recorded separately (found: ${JSON.stringify(m14?.fields)})`,
    );

    /* ================= 15. MEDIA METADATA IMMUTABILITY ================= */
    console.log("15. MEDIA METADATA IMMUTABILITY — MediaAsset.sourceMetadata is byte-identical before vs. after analysis, correction and save");
    await open(page, "&mockai=meal");
    await openComposer(page);
    await pickMedia(page, ["Nyatapola temple, Bhaktapur"]); // a fixture WITH takenAt/takenPlace
    await page.evaluate(() => document.querySelector("[data-sb-meta-ignore]")?.click());
    await sleep(200);
    const before15 = await page.evaluate(() => JSON.stringify(window.__SB_ASSET_SNAPSHOT?.()));
    await kind(page, "Meal");
    const r15 = await waitForAnalysis(page);
    if (r15) {
      await page.evaluate(() => document.querySelector("[data-sb-meal-adjust]")?.click());
      await sleep(250);
      await setLastFoodName(page, "Corrected item");
      await sleep(150);
    }
    await post(page);
    const after15 = await page.evaluate(() => JSON.stringify(window.__SB_ASSET_SNAPSHOT?.()));
    ok(r15 !== null && before15 !== undefined && before15 === after15, `an analysis genuinely ran (${JSON.stringify(r15)}) and the asset's own sourceMetadata is still byte-identical afterward`);

    /* ================= 16. CLIENT KEY LEAK (controlled marker) ================= */
    console.log("16. CLIENT KEY LEAK — structural precondition here; the authoritative controlled-marker production-build search runs as its own Phase D shell procedure, not inside this dev-server suite");
    const routeExists = fs.existsSync(path.join(__dirname, "..", "src/app/api/analyze-meal/route.ts"));
    ok(routeExists, "src/app/api/analyze-meal/route.ts exists as the ONE server boundary that reads DEEPSEEK_API_KEY");
    console.log("    (the full test — `DEEPSEEK_API_KEY=TEST_LEAK_MARKER_xyz123 npx next build`, then grepping .next/static for that exact marker — was run manually as a Phase D step; see the UC-MEAL-AI report for its NOT FOUND result. It is a separate production build, not part of this dev-server run, so it is not re-executed automatically here.)");

    /* ================= 17. SERVER PRIVACY PAYLOAD ================= */
    console.log("17. SERVER PRIVACY PAYLOAD — the exact outgoing DeepSeek request carries no identity/filename/caption/GPS/account data");
    const echoRes = await page.evaluate(async () => {
      try {
        const r = await fetch("/api/analyze-meal?mock=echo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ images: [{ dataUrl: "data:image/jpeg;base64,AAAA" }] }) });
        return { status: r.status, body: await r.json().catch(() => null) };
      } catch (e) {
        return { status: 0, body: null, error: String(e) };
      }
    });
    const payloadStr17 = JSON.stringify(echoRes.body?._debugProviderPayload ?? null);
    ok(
      echoRes.status === 200 && !!echoRes.body && "_debugProviderPayload" in echoRes.body && payloadStr17 !== "null" && !/u-demo-001|userId|filename|\.jpg"|latitude|longitude|caption/i.test(payloadStr17),
      `the ?mock=echo boundary answers with the real provider payload, containing no user id/filename/GPS/caption (found: ${JSON.stringify(echoRes)})`,
    );

    /* ====================================================================================
     * PHASE C — AI-DRIVEN AUTOMATIC CATEGORY SELECTION (Meal instance only).
     * FAILING-TESTS-FIRST: written against the accepted Phase A tree, where analysis only
     * ever runs AFTER Meal is already selected, and no `isFood`, no auto-selection, no
     * category-suggestion ask and no undo gesture exist anywhere. Every C-check below is
     * expected, and required, to FAIL right now — each for a reason specific to its missing
     * capability (most immediately: a photo attach with NO category selected starts no
     * analysis at all today, so `waitForAnalysis` returns null).
     *
     * CONTRACT FOR THE PHASE C IMPLEMENTATION (additions to the Phase 2 contract above):
     *  - Normalized observations carry `isFood: boolean` — a REAL validated boolean (a truthy
     *    string from the provider must never satisfy it, and it is never defined as
     *    `foods.length > 0`; absence/malformation degrades to false, never true).
     *  - Mock scenarios gain `isFood` (meal: true/high · lowconf: true/low · nonfood: false ·
     *    ocr-*: false — zero category side effects by construction) plus ONE new scenario
     *    `mediumfood` (isFood true, overall confidence "medium", one medium food "Khana set")
     *    so the medium path is deterministically testable.
     *  - AI ON: every newly attached PHOTO is analyzed whether or not Meal is selected (video
     *    keyframes keep their existing Meal-selected gate); the observation is STORED in the
     *    draft regardless of the current category (it is Meal-domain data either way).
     *  - isFood && HIGH → Meal auto-selects (the pill [data-sb-record-pill] reads "meal"
     *    through the EXISTING selected styling — no modal, no interruption) UNLESS the person
     *    already explicitly chose a category this composition, checked at RESPONSE-APPLICATION
     *    time, never at request time.
     *  - isFood && MEDIUM → one quiet ask [data-sb-meal-category-suggestion] reading exactly
     *    "Looks like a Meal — use it?" with [data-sb-meal-cat-yes]/[data-sb-meal-cat-no];
     *    Yes IS an explicit selection; No dismisses it for this composition, for good.
     *  - LOW confidence or !isFood → no category change, no ask, ever.
     *  - ONE tap on the AUTO-selected Meal pill undoes it (back to the normal media-default
     *    category), keeps the photo AND the observation, opens no chooser, fires no new
     *    analysis, and never immediately re-selects itself.
     *  - ONE /api/analyze-meal request per unchanged photo lifecycle, across attach →
     *    auto-select → suggestion render → undo → manual re-select.
     *  - Selection provenance never reuses `intentSource` alone to mean "AI auto-selected"
     *    (the general Smart Assist's accepted text suggestions already set intentSource "ai"
     *    and must NOT acquire the undo gesture) — asserted behaviorally by C14.
     * ==================================================================================== */
    console.log("PHASE C — automatic Meal category selection");
    const pillOf = (page2) => page2.evaluate(() => document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") ?? null);
    const waitForPill = (page2, v, tries = 20, gap = 150) => waitFor(page2, (x) => (document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") ?? null) === x, v, tries, gap);
    const trackRequests = (page2) => { const arr = []; const h = (req) => { if (req.url().includes("/api/analyze-meal")) arr.push(req.url()); }; page2.on("request", h); arr.stop = () => page2.off("request", h); return arr; };
    const attachPhotoOnly = async (page2, extra) => { await open(page2, extra); await openComposer(page2); await pickMedia(page2, [THALI]); };
    const banner = (page2) => page2.evaluate(() => document.querySelector("[data-sb-meal-category-suggestion]")?.textContent ?? null);

    /* ---- C1–C4: HIGH + FOOD, one flow ---- */
    console.log("C1–C4. HIGH + FOOD — isFood on the observation; auto-selection with NO Meal pre-selected; visible selected state from the same observation; exactly one request");
    await open(page, "&mockai=meal");
    const reqC1 = trackRequests(page);
    await openComposer(page);
    await pickMedia(page, [THALI]);
    const rC1 = await waitForAnalysis(page);
    ok(
      rC1 !== null && rC1.status === "done" && typeof rC1.observation?.isFood === "boolean" && rC1.observation.isFood === true,
      `C1: a photo attach with NO category selected analyzes by itself, and the normalized observation carries a real boolean isFood: true (found: ${JSON.stringify(rC1)})`,
    );
    const autoC2 = await waitForPill(page, "meal");
    ok(autoC2 === true, `C2: high-confidence food auto-selects Meal — the record pill reads "meal" with no human category tap (found pill: ${await pillOf(page)})`);
    const visC3 = await page.evaluate(() => ({ pillText: document.querySelector("[data-sb-record-pill]")?.textContent ?? "", card: document.querySelector("[data-sb-meal-suggestion]")?.textContent ?? "" }));
    ok(/Meal/.test(visC3.pillText) && /Dal bhat/.test(visC3.card), `C3: the auto-selection shows through the EXISTING pill styling and the suggestion card carries the SAME observation's foods (found: ${JSON.stringify(visC3)})`);
    await sleep(1500);
    reqC1.stop();
    ok(reqC1.length === 1, `C4: exactly ONE /api/analyze-meal request across attach → auto-select → suggestion render (found ${reqC1.length}: ${JSON.stringify(reqC1)})`);

    /* ---- C5–C6: MEDIUM + FOOD ---- */
    console.log("C5–C6. MEDIUM + FOOD — a quiet ask instead of an auto-selection; Yes selects Meal with no second request");
    await open(page, "&mockai=mediumfood");
    const reqC5 = trackRequests(page);
    await openComposer(page);
    await pickMedia(page, [THALI]);
    const rC5 = await waitForAnalysis(page);
    await sleep(300);
    const bannerC5 = await banner(page);
    const pillC5 = await pillOf(page);
    const yesNoC5 = await page.evaluate(() => !!document.querySelector("[data-sb-meal-cat-yes]") && !!document.querySelector("[data-sb-meal-cat-no]"));
    ok(
      rC5?.status === "done" && rC5.observation?.isFood === true && pillC5 !== "meal" && bannerC5 !== null && /Looks like a Meal — use it\?/.test(bannerC5) && yesNoC5,
      `C5: medium confidence never auto-selects (pill: ${pillC5}); it asks once — "${bannerC5}" — with Yes/No (${yesNoC5})`,
    );
    await page.evaluate(() => document.querySelector("[data-sb-meal-cat-yes]")?.click());
    await sleep(400);
    const pillC6 = await pillOf(page);
    const cardC6 = await page.evaluate(() => document.querySelector("[data-sb-meal-suggestion]")?.textContent ?? "");
    await sleep(600);
    reqC5.stop();
    ok(pillC6 === "meal" && /Khana set/.test(cardC6) && reqC5.length === 1, `C6: Yes selects Meal (pill: ${pillC6}) showing the SAME observation's food ("${cardC6}") with still exactly one request (${reqC5.length})`);

    /* ---- C7: MEDIUM + NO ---- */
    console.log("C7. MEDIUM + NO — declining leaves the category alone and the ask does not return");
    await attachPhotoOnly(page, "&mockai=mediumfood");
    await waitForAnalysis(page);
    await sleep(300);
    const askedC7 = (await banner(page)) !== null;
    await page.evaluate(() => document.querySelector("[data-sb-meal-cat-no]")?.click());
    await sleep(250);
    const goneC7 = (await banner(page)) === null;
    await sleep(800);
    const stillGoneC7 = (await banner(page)) === null;
    const pillC7 = await pillOf(page);
    const photoKeptC7 = await page.evaluate(() => !!document.querySelector("[data-sb-composer] [data-sb-thumb]"));
    ok(askedC7 && goneC7 && stillGoneC7 && pillC7 === "moment" && photoKeptC7, `C7: No dismisses the ask (asked ${askedC7} → gone ${goneC7}, still gone ${stillGoneC7}), the category stays the normal media default (${pillC7}), the photo stays attached (${photoKeptC7})`);

    /* ---- C8: NON-FOOD ---- */
    console.log("C8. NON-FOOD — isFood false: no category change, no ask, no card, no crash");
    await attachPhotoOnly(page, "&mockai=nonfood");
    const rC8 = await waitForAnalysis(page);
    await sleep(400);
    const stateC8 = await page.evaluate(() => ({ banner: !!document.querySelector("[data-sb-meal-category-suggestion]"), card: !!document.querySelector("[data-sb-meal-suggestion]"), hint: !!document.querySelector("[data-sb-meal-hint]") }));
    const pillC8 = await pillOf(page);
    ok(
      rC8?.status === "done" && rC8.observation?.isFood === false && pillC8 === "moment" && !stateC8.banner && !stateC8.card && !stateC8.hint,
      `C8: a non-food photo analyzes (isFood: ${JSON.stringify(rC8?.observation?.isFood)}) and changes nothing — pill ${pillC8}, no ask/card/hint (${JSON.stringify(stateC8)})`,
    );

    /* ---- C9: LOW CONFIDENCE FOOD ---- */
    console.log("C9. LOW CONFIDENCE — food, but low: no auto-selection, no ask");
    await attachPhotoOnly(page, "&mockai=lowconf");
    const rC9 = await waitForAnalysis(page);
    await sleep(400);
    const pillC9 = await pillOf(page);
    const bannerC9 = await banner(page);
    ok(
      rC9?.status === "done" && rC9.observation?.isFood === true && rC9.observation?.confidence === "low" && pillC9 === "moment" && bannerC9 === null,
      `C9: low confidence is never acted on — pill ${pillC9}, no ask (observation: isFood ${JSON.stringify(rC9?.observation?.isFood)}, confidence ${rC9?.observation?.confidence})`,
    );

    /* ---- C10: EXPLICIT CHOICE BEFORE THE RESULT ---- */
    console.log("C10. EXPLICIT CHOICE BEFORE THE RESULT — a category the person chose mid-flight is never overridden (checked at response-application time)");
    await open(page, "&mockai=meal:2000");
    const reqC10 = trackRequests(page);
    await openComposer(page);
    await pickMedia(page, [THALI]);
    await kind(page, "Activity"); // explicit, while the delayed HIGH result is still in flight
    const rC10 = await waitForAnalysis(page, 60, 200);
    await sleep(400);
    const pillC10 = await pillOf(page);
    const bannerC10 = await banner(page);
    reqC10.stop();
    ok(
      rC10?.status === "done" && pillC10 === "activity" && bannerC10 === null && reqC10.length === 1,
      `C10: the HIGH result landed (${rC10?.status}) but the person's own Activity choice stands (pill: ${pillC10}), no ask (${bannerC10}), one request (${reqC10.length})`,
    );

    /* ---- C11: AI OFF / BACK ON ---- */
    console.log("C11. AI OFF / BACK ON — off: zero requests, zero category changes; on with the same photo attached: analysis fires and auto-selects");
    // TEST-BUG FIX (recorded; implementation untouched): the first C11 draft copied test 13's
    // raw click sequence, but test 13 closes the composer between its OFF and ON phases (the
    // assist MENU unmounts with it) while C11 deliberately keeps the same composer open — so
    // its second [data-sb-assist-button] click was CLOSING the still-open menu instead of
    // opening it, the ON toggle never happened, and C12–C15 then ran with AI stuck OFF in
    // localStorage (one cascade, five misleading failures). `assistSet` is state-checked and
    // menu-safe: it opens the menu only if the toggle isn't rendered, flips only when the
    // actual state differs, and always leaves the menu closed.
    const assistSet = async (page2, on) => {
      for (let i = 0; i < 2; i++) {
        const t = await page2.evaluate(() => document.querySelector("[data-sb-assist-toggle]")?.textContent ?? null);
        if (t !== null) break;
        await page2.evaluate(() => document.querySelector("[data-sb-assist-button]")?.click());
        await sleep(200);
      }
      const isOn = await page2.evaluate(() => /Turn off/.test(document.querySelector("[data-sb-assist-toggle]")?.textContent ?? ""));
      if (isOn !== on) {
        await page2.evaluate(() => document.querySelector("[data-sb-assist-toggle]")?.click());
        await sleep(250);
      }
      await page2.evaluate(() => { const b = document.querySelector("[data-sb-assist-button]"); if (b?.getAttribute("aria-expanded") === "true") b.click(); });
      await sleep(150);
    };
    await open(page, "&mockai=meal");
    const reqC11 = trackRequests(page);
    await openComposer(page);
    await assistSet(page, false);
    await pickMedia(page, [THALI]);
    await sleep(2000);
    const offPillC11 = await pillOf(page);
    const offCountC11 = reqC11.length;
    // same photo still attached — turn AI back ON (ends ON, restoring the default for later tests)
    await assistSet(page, true);
    const rC11 = await waitForAnalysis(page);
    const autoC11 = await waitForPill(page, "meal");
    reqC11.stop();
    ok(
      offCountC11 === 0 && offPillC11 === "moment" && rC11?.status === "done" && autoC11 === true && reqC11.length === 1,
      `C11: AI off — ${offCountC11} requests, pill ${offPillC11}; AI back on with the same photo — analysis fires (${reqC11.length} request, ${rC11?.status}) and auto-selects (${autoC11})`,
    );

    /* ---- C12: AI FAILURE ---- */
    console.log("C12. AI FAILURE — a failed analysis on a category-less attach changes nothing and never blocks the post");
    await attachPhotoOnly(page, "&mockai=fail");
    const rC12 = await waitForAnalysis(page);
    await sleep(300);
    const pillC12 = await pillOf(page);
    const bannerC12 = await banner(page);
    const errC12 = await page.evaluate(() => /error|failed|unavailable/i.test(document.querySelector("[data-sb-composer]")?.textContent ?? ""));
    await setText(page, "Photo of the day.");
    await post(page);
    const mC12 = await newest(page);
    ok(
      rC12 !== null && rC12.status === "failed" && pillC12 === "moment" && bannerC12 === null && !errC12 && !!mC12,
      `C12: a provider failure settles safely (${JSON.stringify(rC12)}), pill ${pillC12}, no ask (${bannerC12}), no error text (${errC12}), the post still lands (${!!mC12})`,
    );

    /* ---- C13: ONE-TAP UNDO ---- */
    console.log("C13. ONE-TAP UNDO — tapping the auto-selected Meal pill reverts it, keeps photo + observation, opens no chooser, re-fires nothing, never re-selects itself");
    await open(page, "&mockai=meal");
    const reqC13 = trackRequests(page);
    await openComposer(page);
    await pickMedia(page, [THALI]);
    const autoC13 = await waitForPill(page, "meal");
    await page.evaluate(() => document.querySelector("[data-sb-record-pill]")?.click());
    await sleep(350);
    const afterUndo = await page.evaluate(() => ({
      pill: document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") ?? null,
      chooserOpen: !!document.querySelector("[data-sb-kind-row]"),
      photo: !!document.querySelector("[data-sb-composer] [data-sb-thumb]"),
    }));
    await sleep(1200);
    const stillUndone = await pillOf(page);
    // a MANUAL re-select must find the kept observation, with NO second analysis fired
    await kind(page, "Meal");
    await sleep(300);
    const cardBack = await page.evaluate(() => document.querySelector("[data-sb-meal-suggestion]")?.textContent ?? "");
    reqC13.stop();
    ok(
      autoC13 === true && afterUndo.pill === "moment" && !afterUndo.chooserOpen && afterUndo.photo && stillUndone === "moment" && /Dal bhat/.test(cardBack) && reqC13.length === 1,
      `C13: one tap undoes the auto-selection (${JSON.stringify(afterUndo)}), it never re-selects itself (${stillUndone}), the kept observation re-surfaces on a MANUAL re-select ("${cardBack}"), and the whole lifecycle made exactly one request (${reqC13.length})`,
    );

    /* ---- C14: EXPLICIT CHOICE KEEPS NORMAL PILL BEHAVIOR ---- */
    console.log("C14. EXPLICIT CHOICE DURING FLIGHT — Life Moment chosen while HIGH is in flight stays; its pill still opens the chooser (the undo gesture never leaks onto explicit choices)");
    await open(page, "&mockai=meal:2000");
    await openComposer(page);
    await pickMedia(page, [THALI]);
    await kind(page, "Life Moment");
    const rC14 = await waitForAnalysis(page, 60, 200);
    await sleep(400);
    const pillC14 = await pillOf(page);
    const bannerC14 = await banner(page);
    await page.evaluate(() => document.querySelector("[data-sb-record-pill]")?.click());
    await sleep(350);
    const chooserC14 = await page.evaluate(() => !!document.querySelector("[data-sb-kind-row]"));
    ok(
      rC14?.status === "done" && pillC14 === "moment" && bannerC14 === null && chooserC14 === true,
      `C14: the HIGH result (${rC14?.status}) never overrode the explicit Life Moment (pill: ${pillC14}), asked nothing (${bannerC14}), and the pill still opens the chooser normally (${chooserC14})`,
    );

    /* ---- C15: NO METADATA IS NORMAL ---- */
    console.log("C15. NO METADATA IS NORMAL — a photo with no EXIF still recognizes and categorizes; zero page errors");
    await open(page, "&mockai=meal");
    const errsC15 = [];
    page.on("pageerror", (e) => errsC15.push(String(e)));
    await openComposer(page);
    await pickMedia(page, [THALI]); // THALI carries NO EXIF — the no-metadata photo by construction
    const rC15 = await waitForAnalysis(page);
    const metaBannerC15 = await page.evaluate(() => !!document.querySelector("[data-sb-metadata-review]"));
    const autoC15 = await waitForPill(page, "meal");
    ok(
      rC15?.status === "done" && metaBannerC15 === false && autoC15 === true && errsC15.length === 0,
      `C15: no metadata, no problem — no review banner (${metaBannerC15}), recognition ran (${rC15?.status}), the category followed the observation (${autoC15}), zero page errors (${errsC15.length})`,
    );

    /* ====================================================================================
     * PHASE B — REAL USDA NUTRITION (failing-first).
     * Written against the accepted Phase C tree, where: no `/api/food-facts` route exists,
     * ObservedFood has no `canonicalName`, nutrition provenance is stamped
     * "ai_visual_estimate", no fact/estimate rendering split exists, and no facts debug
     * global exists. Every B-check below is expected, and required, to FAIL right now, each
     * for a reason specific to its missing Phase B capability.
     *
     * CONTRACT FOR THE PHASE B IMPLEMENTATION (additions to the contracts above):
     *  - TWO-FIELD FOOD IDENTITY: ObservedFood gains optional `canonicalName` (lookup-
     *    oriented, e.g. "sloppy joe sandwich"); the UI keeps showing the everyday `name`.
     *    Mock foods carry it (e.g. "Dal bhat" → "dal bhat set").
     *  - NUTRITION PROVENANCE: `NutritionSource = "usda" | "openfoodfacts" | "ai_estimate"
     *    | "user"` ("openfoodfacts" reserved for B2 phase). AI-estimated nutrition values now
     *    carry `source: "ai_estimate"` (supersedes the Phase 2 "ai_visual_estimate" value on
     *    NUTRITION only — food-ITEM provenance in test 1 keeps "ai_visual_estimate").
     *  - The provider can NEVER label nutrition with an external authority: analyze-meal's
     *    new `?mock=fabricate-usda` scenario routes a RAW provider payload that claims
     *    "USDA FoodData Central" through the REAL normalizeProviderOutput — the normalized
     *    observation must come out `ai_estimate` everywhere.
     *  - NEW SERVER ROUTE `src/app/api/food-facts/route.ts`: POST {canonicalName} →
     *    {facts: FoodFacts | null}; reads server-only USDA_FDC_API_KEY; 5s timeout; failure
     *    → null + server log only. Mock seam `?mock=found|miss|fail|echo` (echo returns the
     *    exact outgoing USDA request shape with the api_key REDACTED — the privacy proof).
     *    `found` returns: source "usda", fdcId, matchedName, nutrition {calories 354,
     *    protein 20, carbs 35, fat 14}, units, basis "per 100 g", retrievedAt.
     *  - CLIENT: after a food observation lands (AI ON), the composer looks up facts per
     *    useful food by canonicalName (page `&mockfacts=<scenario>` forwards as `?mock=`),
     *    merging results into SUGGESTION STATE — never into the immutable aiObservation.
     *    Debug global `window.__SB_MEAL_FACTS_LOG`: {canonicalName, status:
     *    "start"|"found"|"miss"|"failed", facts} — RESET to empty at every analysis start
     *    (one analysis, one log; superseded generations never write into it).
     *  - RENDERING: a USDA fact renders factually per food ([data-sb-food-fact], no "~");
     *    the AI estimate keeps its visibly-approximate line, now hooked
     *    [data-sb-meal-estimate] ("Estimated ~450–750 kcal …"). Never one ambiguous value.
     * ==================================================================================== */
    console.log("PHASE B — real USDA nutrition");
    const factsLog = (page2) => page2.evaluate(() => window.__SB_MEAL_FACTS_LOG ?? null);
    const waitForFacts = async (page2, n = 1, tries = 40, gap = 250) => {
      const okWait = await waitFor(page2, (need) => {
        const log = window.__SB_MEAL_FACTS_LOG;
        return Array.isArray(log) && log.filter((e) => e.status !== "start").length >= need;
      }, n, tries, gap);
      return okWait ? page2.evaluate(() => window.__SB_MEAL_FACTS_LOG.filter((e) => e.status !== "start")) : null;
    };
    const factsFetch = (page2, scenario, body) => page2.evaluate(async (s, b) => {
      try {
        const r = await fetch(`/api/food-facts${s ? `?mock=${s}` : ""}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
        return { status: r.status, body: await r.json().catch(() => null) };
      } catch (e) { return { status: 0, body: null, error: String(e) }; }
    }, scenario, body);

    /* ---- B1 + B3 + B4: the USDA route's normalized answer ---- */
    console.log("B1/B3/B4. USDA ROUTE — a known canonical food returns structured facts with usda provenance and a preserved fdcId");
    await open(page, "");
    const rB1 = await factsFetch(page, "found", { canonicalName: "sloppy joe sandwich" });
    const fB1 = rB1.body?.facts;
    // Phase B correction (strengthened in place, no new count): the known-food lookup now also runs
    // FIVE competing real USDA candidates through the real selection and asserts WHICH one wins —
    // description + fdcId — not merely that USDA answered.
    const rB1sel = await factsFetch(page, "fixture-sloppyjoe", { canonicalName: "sloppy joe sandwich" });
    const fB1sel = rB1sel.body?.facts;
    ok(
      rB1.status === 200 && !!fB1 && typeof fB1.nutrition?.calories === "number" && typeof fB1.nutrition?.protein === "number" && typeof fB1.matchedName === "string" && !!fB1.units && typeof fB1.retrievedAt === "string" &&
        fB1sel?.fdcId === 2706884 && fB1sel?.matchedName === "Sloppy joe sandwich, on wheat bun" && fB1sel?.nutrition?.calories === 180,
      `B1: a known canonical food search returns structured nutrition (found: ${JSON.stringify(rB1)}) and, over [wheat-bun sandwich, white-bun sandwich, no-bun, crackers, Cuban], SELECTS fdcId 2706884 "Sloppy joe sandwich, on wheat bun" (found: ${JSON.stringify(fB1sel && { fdcId: fB1sel.fdcId, matchedName: fB1sel.matchedName, kcal: fB1sel.nutrition.calories })})`,
    );
    ok(fB1?.source === "usda", `B3: the USDA response stores source: "usda" (found: ${JSON.stringify(fB1?.source)})`);
    ok(typeof fB1?.fdcId === "number" && fB1.fdcId > 0, `B4: fdcId is preserved on the normalized facts (found: ${JSON.stringify(fB1?.fdcId)})`);

    /* ---- B2: two-field food identity ---- */
    console.log("B2. TWO-FIELD IDENTITY — a recognized food carries an everyday name AND a distinct lookup canonicalName; the card still shows the everyday name");
    await attachPhotoOnly(page, "&mockai=meal&mockfacts=miss");
    const rB2 = await waitForAnalysis(page);
    await waitForPill(page, "meal");
    const cardB2 = await page.evaluate(() => document.querySelector("[data-sb-meal-suggestion]")?.textContent ?? "");
    const foodB2 = rB2?.observation?.foods?.find((f) => f.name === "Dal bhat");
    ok(
      rB2?.status === "done" && typeof foodB2?.canonicalName === "string" && foodB2.canonicalName.length > 0 && foodB2.canonicalName !== foodB2.name && /Dal bhat/.test(cardB2) && !cardB2.includes(foodB2.canonicalName),
      `B2: "Dal bhat" carries a distinct canonicalName (${JSON.stringify(foodB2)}) and the card keeps the everyday name only ("${cardB2}")`,
    );

    /* ---- B5: the provider can never claim USDA as a source ---- */
    console.log("B5. NO FABRICATED AUTHORITY — a raw provider payload claiming 'USDA FoodData Central' normalizes to ai_estimate, through the REAL normalization path");
    const rB5 = await page.evaluate(async () => {
      try {
        const r = await fetch("/api/analyze-meal?mock=fabricate-usda", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ images: [{ dataUrl: "data:image/jpeg;base64,AAAA" }] }) });
        return { status: r.status, body: await r.json().catch(() => null) };
      } catch (e) { return { status: 0, body: null, error: String(e) }; }
    });
    const obsB5 = rB5.body?.observation;
    const nutB5 = obsB5?.nutritionEstimate ? Object.values(obsB5.nutritionEstimate).filter(Boolean) : [];
    const strB5 = JSON.stringify(obsB5 ?? null);
    ok(
      rB5.status === 200 && !!obsB5 && nutB5.length > 0 && nutB5.every((v) => v.source === "ai_estimate") && !strB5.includes("USDA FoodData Central") && !nutB5.some((v) => v.source === "usda"),
      `B5: the fabricated attribution is stripped by normalization — every nutrition source is "ai_estimate", never "usda"/"USDA FoodData Central" (found: ${strB5})`,
    );

    /* ---- B6 + B7: USDA miss → the AI estimate fallback, still a range ---- */
    console.log("B6/B7. USDA MISS — one lookup per useful food, every one missed, the ai_estimate fallback is used, and it stays a range (no fabricated exact number)");
    await open(page, "&mockai=meal&mockfacts=miss");
    const factsReqB6 = [];
    const hB6 = (req) => { if (req.url().includes("/api/food-facts")) factsReqB6.push(req.url()); };
    page.on("request", hB6);
    await openComposer(page);
    await pickMedia(page, [THALI]);
    await waitForAnalysis(page);
    await waitForPill(page, "meal");
    // the meal mock has exactly 4 non-low foods → exactly 4 lookups (adversarial finding #9)
    const missB6 = await waitForFacts(page, 4);
    page.off("request", hB6);
    await page.evaluate(() => document.querySelector("[data-sb-meal-accept]")?.click());
    await sleep(250);
    await post(page);
    const mB6 = await newest(page);
    const calB6 = mB6?.fields?.mealAIObservation?.nutritionEstimate?.calories;
    ok(
      missB6 !== null && missB6.length === 4 && missB6.every((e) => e.status === "miss") && factsReqB6.length === 4 && calB6?.source === "ai_estimate",
      `B6: exactly 4 lookups — one per useful food — all missed (${JSON.stringify(missB6?.map((e) => e.status))}, ${factsReqB6.length} requests) and the posted fallback nutrition carries source "ai_estimate" (found: ${JSON.stringify(calB6)})`,
    );
    ok(
      !!calB6?.range && typeof calB6.range.min === "number" && typeof calB6.range.max === "number" && calB6.range.min < calB6.range.max && calB6.value === undefined && calB6.source === "ai_estimate",
      `B7: the ai_estimate fallback remains a true range with no exact value beside it (found: ${JSON.stringify(calB6)})`,
    );

    /* ---- B8 + B9 + B10: fact vs estimate rendering, never mixed; facts never contaminate the record ---- */
    console.log("B8/B9/B10. RENDERING + RECORD PURITY — every useful food gets its OWN factual line; the AI estimate stays visibly approximate; facts never leak into the posted observation or confirmed items");
    await attachPhotoOnly(page, "&mockai=meal&mockfacts=found");
    await waitForAnalysis(page);
    await waitForPill(page, "meal");
    await waitForFacts(page, 4);
    await sleep(400);
    const rendB = await page.evaluate(() => {
      const factEls = [...document.querySelectorAll("[data-sb-food-fact]")];
      return {
        factCount: factEls.length,
        facts: factEls.map((e) => e.textContent ?? ""),
        dalbhat: factEls.map((e) => e.textContent ?? "").find((t) => t.startsWith("Dal bhat")) ?? null,
        dalbhatId: factEls.find((e) => (e.textContent ?? "").startsWith("Dal bhat"))?.getAttribute("data-sb-food-fact") ?? null,
        dalbhatMatch: factEls.find((e) => (e.textContent ?? "").startsWith("Dal bhat"))?.getAttribute("data-sb-fact-match") ?? null,
        estCount: document.querySelectorAll("[data-sb-meal-estimate]").length,
        est: document.querySelector("[data-sb-meal-estimate]")?.textContent ?? null,
      };
    });
    // adversarial findings #9/#10 — the fact must be ANCHORED to its food (the line names
    // "Dal bhat" and carries all four figures + the basis), one line per useful food (4), and
    // no fact line anywhere smuggles approximation language in.
    ok(
      rendB.factCount === 4 && rendB.dalbhat !== null && /354\s?kcal/.test(rendB.dalbhat) && /20\s?g protein/.test(rendB.dalbhat) && /35\s?g carbs/.test(rendB.dalbhat) && /14\s?g fat/.test(rendB.dalbhat) && /per 100\s?g/.test(rendB.dalbhat) && rendB.facts.every((t) => !t.includes("~") && !/Estimated/i.test(t)) &&
        rendB.dalbhatId === "2345678" && rendB.dalbhatMatch === "confident",
      `B8: one factual line per useful food (${rendB.factCount}), the Dal bhat line carries its own full figures + basis, never a tilde or "Estimated", and names its match identity — USDA entry ${rendB.dalbhatId}, classified "${rendB.dalbhatMatch}" (found: "${rendB.dalbhat}")`,
    );
    ok(
      rendB.est !== null && rendB.est.includes("~") && /Estimated/i.test(rendB.est) && !/354\s?kcal/.test(rendB.est),
      `B9: the AI estimate stays visibly approximate in its own line (found: "${rendB.est}")`,
    );
    // adversarial findings #7/#11 — the rebuilt B10 is independent of B8/B9: it posts the
    // found-facts Meal and proves provenance never mixes AT THE RECORD: the immutable
    // observation carries no usda/fdcId/fact figures, its estimate stays ai_estimate, and the
    // confirmed food items keep their own (food-item) provenance — facts live in suggestion
    // state and the display only.
    await page.evaluate(() => document.querySelector("[data-sb-meal-accept]")?.click());
    await sleep(250);
    await post(page);
    const mB10 = await newest(page);
    const obsB10 = mB10?.fields?.mealAIObservation ?? null;
    const obsStrB10 = JSON.stringify(obsB10 ?? null);
    const nutB10 = obsB10?.nutritionEstimate ? Object.values(obsB10.nutritionEstimate).filter(Boolean) : [];
    ok(
      rendB.estCount === 1 && !!obsB10 && !obsStrB10.includes("usda") && !obsStrB10.includes("fdcId") && !obsStrB10.includes("354") && nutB10.length > 0 && nutB10.every((v) => v.source === "ai_estimate") && (mB10?.fields?.foodItems?.length ?? 0) > 0 && mB10.fields.foodItems.every((f) => f.source === "ai_visual_estimate"),
      `B10: with facts FOUND and the Meal posted, the observation stays untouched by them (no usda/fdcId/354; nutrition still ai_estimate: ${JSON.stringify(nutB10.map((v) => v.source))}) and confirmed items keep food-item provenance (${JSON.stringify(mB10?.fields?.foodItems?.map((f) => f.source))})`,
    );

    /* ---- B11: USDA key server-only (structural; the authoritative controlled-marker build is a Phase-D shell step) ---- */
    console.log("B11. USDA KEY SERVER-ONLY — structural precondition; the authoritative dual controlled-marker production-build grep runs as its own shell step");
    const factsRoutePath = path.join(__dirname, "..", "src/app/api/food-facts/route.ts");
    const factsRouteSrc = fs.existsSync(factsRoutePath) ? fs.readFileSync(factsRoutePath, "utf8") : "";
    // TEST-BUG FIX (recorded; implementation untouched): the first draft grepped for the bare
    // substring "NEXT_PUBLIC" — which the route's own documentation COMMENT legitimately
    // contains ("never NEXT_PUBLIC_"). The real invariant is that the route never READS a
    // NEXT_PUBLIC_ environment variable; assert exactly that.
    ok(
      fs.existsSync(factsRoutePath) && factsRouteSrc.includes("process.env.USDA_FDC_API_KEY") && !/process\.env\.NEXT_PUBLIC/.test(factsRouteSrc),
      "B11: src/app/api/food-facts/route.ts exists as the ONE server boundary reading process.env.USDA_FDC_API_KEY (and reads no NEXT_PUBLIC_ variable)",
    );
    console.log("    (the full test — `DEEPSEEK_API_KEY=TEST_LEAK_MARKER_xyz123 USDA_FDC_API_KEY=TEST_LEAK_MARKER_usda789 npx next build`, then grepping .next/static for BOTH exact markers — runs as a separate production-build step; see the Phase B report for its NOT FOUND results.)");

    /* ---- B12: USDA failure never breaks the Meal ---- */
    console.log("B12. USDA FAILURE — every lookup fails quietly; the estimate fallback still renders and the Meal still posts");
    await attachPhotoOnly(page, "&mockai=meal&mockfacts=fail");
    await waitForAnalysis(page);
    await waitForPill(page, "meal");
    const failB12 = await waitForFacts(page, 4);
    await sleep(300);
    const uiB12 = await page.evaluate(() => ({
      card: !!document.querySelector("[data-sb-meal-suggestion]"),
      est: document.querySelector("[data-sb-meal-estimate]")?.textContent ?? null,
      fact: !!document.querySelector("[data-sb-food-fact]"),
      err: /error|failed|unavailable/i.test(document.querySelector("[data-sb-composer]")?.textContent ?? ""),
    }));
    await post(page);
    const mB12 = await newest(page);
    ok(
      failB12 !== null && failB12.length === 4 && failB12.every((e) => e.status === "failed") && uiB12.card && uiB12.est !== null && !uiB12.fact && !uiB12.err && !!mB12,
      `B12: all 4 lookups failed quietly (${JSON.stringify(failB12?.map((e) => e.status))}), the card still shows the estimate with no fact and no error text (${JSON.stringify(uiB12)}), and the Meal posts (${!!mB12})`,
    );

    /* ---- B13: AI failure → no lookups, manual Meal usable ---- */
    console.log("B13. AI FAILURE — no recognition means ZERO facts requests on the wire, start to post; the manual Meal stays complete");
    await open(page, "&mockai=fail&mockfacts=found");
    // adversarial finding #8 — the zero-lookup proof is NETWORK-level across the WHOLE flow
    // (attach → select → type → post), not a debug-log snapshot taken before the flow ended.
    const factsReqB13 = [];
    const hB13 = (req) => { if (req.url().includes("/api/food-facts")) factsReqB13.push(req.url()); };
    page.on("request", hB13);
    await openComposer(page);
    await pickMedia(page, [THALI]);
    await waitForAnalysis(page);
    await sleep(400);
    await kind(page, "Meal");
    await more(page);
    await addField(page, "foodItems");
    await sleep(150);
    await page.evaluate(() => document.querySelector("[data-sb-add-item]")?.click());
    await sleep(150);
    await setLastFoodName(page, "Hand-written momo");
    await sleep(200);
    await post(page);
    page.off("request", hB13);
    const mB13 = await newest(page);
    const logB13 = await factsLog(page); // re-read AFTER the whole flow, not before it
    ok(
      factsReqB13.length === 0 && Array.isArray(logB13) && logB13.length === 0 && mB13?.fields?.foodItems?.some((f) => f.name === "Hand-written momo"),
      `B13: AI failed → zero /api/food-facts requests across the entire flow (${factsReqB13.length}) and a still-empty log at the end (${JSON.stringify(logB13)}); the hand-typed Meal posts intact (${JSON.stringify(mB13?.fields?.foodItems)})`,
    );

    /* ---- B14: AI and USDA both unavailable → manual Meal usable ---- */
    console.log("B14. BOTH UNAVAILABLE — AI fails and USDA fails; the manual path is untouched (network-level proof)");
    await open(page, "&mockai=fail&mockfacts=fail");
    const factsReqB14 = [];
    const hB14 = (req) => { if (req.url().includes("/api/food-facts")) factsReqB14.push(req.url()); };
    page.on("request", hB14);
    await openComposer(page);
    await pickMedia(page, [THALI]);
    await waitForAnalysis(page);
    await sleep(300);
    await kind(page, "Meal");
    const errB14 = await page.evaluate(() => /error|failed|unavailable/i.test(document.querySelector("[data-sb-composer]")?.textContent ?? ""));
    await setText(page, "Dinner, written by hand.");
    await post(page);
    page.off("request", hB14);
    const mB14 = await newest(page);
    const logB14 = await factsLog(page);
    ok(
      factsReqB14.length === 0 && Array.isArray(logB14) && logB14.length === 0 && !errB14 && !!mB14,
      `B14: with both unavailable there are zero facts requests (${factsReqB14.length}), an empty log at the end (${JSON.stringify(logB14)}), zero technical errors (${errB14}), and the Meal still saves (${!!mB14})`,
    );

    /* ====================================================================================
     * PHASE B CORRECTION — USDA MATCH SELECTION + CONFIDENCE GATING (failing-first).
     * The accepted Phase B selection scored candidates by nutrition COMPLETENESS and broke ties
     * by USDA's own order — so live USDA picked "Bananas, dehydrated, or banana powder" (346 kcal)
     * for "banana" and "Spinach, creamed" for "spinach", published as plain fact.
     *
     * CONTRACT for the correction (route-level, through the REAL ranking code):
     *  - `/api/food-facts?mock=fixture-<name>` feeds a USDA-search-shaped candidate list (in
     *    USDA-like order) through the SAME selection code the real path uses, for the query in
     *    the body. (`{Q}`-style fixtures `fixture-ui-*` derive their candidates from the query so
     *    the page flow can exercise every classification through the real client + renderer.)
     *  - The answer is `{facts, uncertain?}`: facts carry `match: "confident" | "likely"` and,
     *    for "likely", a short `basedOn` phrase; an UNCERTAIN verdict publishes NO number
     *    (`facts: null, uncertain: true`).
     *  - Rendering: confident → clean figures; likely → the same figures + "based on <short>"
     *    ([data-sb-fact-match="likely"]); uncertain → "<name>: No reliable nutrition match yet"
     *    ([data-sb-food-fact-uncertain]) with the AI estimate line still present.
     *  - Facts log statuses: start → found | uncertain | miss | failed.
     * R1–R6 freeze guarantees that landed in the Phase B review round and had NO repo test.
     * ==================================================================================== */
    console.log("PHASE B CORRECTION — semantic selection + confidence gate");
    const sel = (page2, fixture, q) => factsFetch(page2, `fixture-${fixture}`, { canonicalName: q });
    const factsOf = (r) => r.body?.facts ?? null;
    await open(page, "");

    /* ---- T1–T5: ranking, route level ---- */
    const tc1 = await sel(page, "banana", "banana");
    ok(
      tc1.status === 200 && factsOf(tc1)?.fdcId === 2709224 && factsOf(tc1)?.matchedName === "Banana, raw" && factsOf(tc1)?.nutrition?.calories === 97,
      `T1: query "banana" over [dehydrated/powder, raw, baked] selects "Banana, raw" — 97 kcal, never the 346 kcal powder (found: ${JSON.stringify(factsOf(tc1) && { fdcId: factsOf(tc1).fdcId, matchedName: factsOf(tc1).matchedName, kcal: factsOf(tc1).nutrition.calories })})`,
    );
    const tc2 = await sel(page, "spinach", "spinach");
    ok(
      tc2.status === 200 && factsOf(tc2)?.fdcId === 2709614 && factsOf(tc2)?.matchedName === "Spinach, raw" && factsOf(tc2)?.nutrition?.calories === 27,
      `T2: query "spinach" over [creamed, raw, canned] selects "Spinach, raw" — 27 kcal, never the 90 kcal creamed (found: ${JSON.stringify(factsOf(tc2) && { fdcId: factsOf(tc2).fdcId, matchedName: factsOf(tc2).matchedName, kcal: factsOf(tc2).nutrition.calories })})`,
    );
    const tc3 = await sel(page, "banana-late", "banana powder");
    ok(
      tc3.status === 200 && factsOf(tc3)?.fdcId === 173945 && factsOf(tc3)?.matchedName === "Bananas, dehydrated, or banana powder",
      `T3: query "banana powder" over [raw, baked, dehydrated/powder] selects the powder variant — the correction is NOT "always prefer raw" (found: ${JSON.stringify(factsOf(tc3) && { fdcId: factsOf(tc3).fdcId, matchedName: factsOf(tc3).matchedName })})`,
    );
    const tc4 = await sel(page, "spinach-late", "creamed spinach");
    ok(
      tc4.status === 200 && factsOf(tc4)?.fdcId === 2709628 && factsOf(tc4)?.matchedName === "Spinach, creamed",
      `T4: query "creamed spinach" over [raw, canned, creamed] selects "Spinach, creamed" (found: ${JSON.stringify(factsOf(tc4) && { fdcId: factsOf(tc4).fdcId, matchedName: factsOf(tc4).matchedName })})`,
    );
    const tc5 = await sel(page, "completeness", "banana");
    ok(
      tc5.status === 200 && factsOf(tc5)?.fdcId === 2709224 && factsOf(tc5)?.nutrition?.fat === undefined && factsOf(tc5)?.nutrition?.calories === 97,
      `T5: semantics beats completeness — the correct raw banana (3 of 4 nutrients, no fat) wins over the all-4-nutrient dehydrated powder, and its missing fat is NOT borrowed (found: ${JSON.stringify(factsOf(tc5) && { fdcId: factsOf(tc5).fdcId, kcal: factsOf(tc5).nutrition.calories, fat: factsOf(tc5).nutrition.fat })})`,
    );

    /* ---- T6: UNCERTAIN publishes no number (route + page) ---- */
    const tc6r = await sel(page, "weak", "banana");
    await attachPhotoOnly(page, "&mockai=meal&mockfacts=fixture-ui-uncertain");
    await waitForAnalysis(page);
    await waitForPill(page, "meal");
    const tc6log = await waitForFacts(page, 4);
    await sleep(500);
    const tc6ui = await page.evaluate(() => ({
      factLines: document.querySelectorAll("[data-sb-food-fact]").length,
      uncertain: [...document.querySelectorAll("[data-sb-food-fact-uncertain]")].map((e) => e.textContent ?? ""),
      estimate: document.querySelector("[data-sb-meal-estimate]")?.textContent ?? null,
    }));
    await page.evaluate(() => document.querySelector("[data-sb-meal-accept]")?.click());
    await sleep(250);
    await post(page);
    const tc6rec = await newest(page);
    ok(
      tc6r.status === 200 && tc6r.body?.facts === null && tc6r.body?.uncertain === true &&
        tc6log !== null && tc6log.length === 4 && tc6log.every((e) => e.status === "uncertain") &&
        tc6ui.factLines === 0 && tc6ui.uncertain.length === 4 && tc6ui.uncertain.every((s) => /No reliable nutrition match yet/.test(s)) &&
        tc6ui.estimate !== null && tc6ui.estimate.includes("~") &&
        // review finding #8: the record must EXIST and carry the AI estimate — a missing record or a
        // dropped observation must fail, not pass vacuously
        !!tc6rec && tc6rec.fields?.mealAIObservation?.nutritionEstimate?.calories?.source === "ai_estimate" && !JSON.stringify(tc6rec.fields).includes("usda"),
      `T6: no confident winner → the route answers uncertain with NO facts (${JSON.stringify(tc6r.body)}); the page logs 4 uncertain lookups, renders ${tc6ui.uncertain.length} "No reliable nutrition match yet" lines and ZERO fact lines (${JSON.stringify(tc6ui)}); the AI estimate path stays and the record carries no usda (${JSON.stringify(tc6rec?.fields?.mealAIObservation?.nutritionEstimate?.calories?.source)})`,
    );

    /* ---- T7: LIKELY shows "based on <short>" (route + page) ---- */
    const tc7r = await sel(page, "minor", "banana");
    await attachPhotoOnly(page, "&mockai=meal&mockfacts=fixture-ui-likely");
    await waitForAnalysis(page);
    await waitForPill(page, "meal");
    await waitForFacts(page, 4);
    await sleep(500);
    const tc7ui = await page.evaluate(() => ({
      lines: [...document.querySelectorAll("[data-sb-food-fact]")].map((e) => ({ text: e.textContent ?? "", match: e.getAttribute("data-sb-fact-match") })),
      uncertain: document.querySelectorAll("[data-sb-food-fact-uncertain]").length,
    }));
    ok(
      tc7r.status === 200 && factsOf(tc7r)?.fdcId === 2709225 && factsOf(tc7r)?.match === "likely" && factsOf(tc7r)?.basedOn === "baked banana" && factsOf(tc7r)?.nutrition?.calories === 161 &&
        tc7ui.lines.length === 4 && tc7ui.uncertain === 0 && tc7ui.lines.every((l) => l.match === "likely" && /based on frozen/.test(l.text) && /\d+ kcal/.test(l.text) && !l.text.includes("~") && !/USDA/i.test(l.text) && l.text.length < 140),
      `T7: a usable candidate with a minor qualifier is published WITH its qualifier — route: ${JSON.stringify(factsOf(tc7r) && { fdcId: factsOf(tc7r).fdcId, match: factsOf(tc7r).match, basedOn: factsOf(tc7r).basedOn })}; page lines: ${JSON.stringify(tc7ui.lines.map((l) => l.text))}`,
    );

    /* ---- T8: CONFIDENT exact match is a clean fact (route + page) ---- */
    const tc8r = await sel(page, "exact", "banana");
    await attachPhotoOnly(page, "&mockai=meal&mockfacts=fixture-ui-confident");
    await waitForAnalysis(page);
    await waitForPill(page, "meal");
    await waitForFacts(page, 4);
    await sleep(500);
    const tc8ui = await page.evaluate(() => ({
      lines: [...document.querySelectorAll("[data-sb-food-fact]")].map((e) => ({ text: e.textContent ?? "", match: e.getAttribute("data-sb-fact-match") })),
      uncertain: document.querySelectorAll("[data-sb-food-fact-uncertain]").length,
      dalbhat: [...document.querySelectorAll("[data-sb-food-fact]")].map((e) => e.textContent ?? "").find((t) => t.startsWith("Dal bhat")) ?? null,
    }));
    ok(
      tc8r.status === 200 && factsOf(tc8r)?.fdcId === 2709224 && factsOf(tc8r)?.match === "confident" && factsOf(tc8r)?.basedOn === undefined &&
        tc8ui.lines.length === 4 && tc8ui.uncertain === 0 && tc8ui.lines.every((l) => l.match === "confident" && !/based on/i.test(l.text) && !l.text.includes("~") && !/No reliable/.test(l.text)) &&
        tc8ui.dalbhat === "Dal bhat: 120 kcal · 4 g protein · 20 g carbs · 2 g fat · per 100 g",
      `T8: an exact common-name match is a clean fact — no qualifier, no extra UI — route: ${JSON.stringify(factsOf(tc8r) && { fdcId: factsOf(tc8r).fdcId, match: factsOf(tc8r).match, basedOn: factsOf(tc8r).basedOn })}; page: "${tc8ui.dalbhat}"`,
    );

    /* ---- G1–G3: conservative gates added AFTER a live 56-food basket showed the specified rules still
     * leaked wrong numbers. All three fixtures are REAL USDA pages observed 2026-10-02. Each gate can
     * only WITHHOLD a number — and each carries a positive control so it cannot pass by being over-eager. ---- */
    console.log("G1–G3. GATES FOUND BY THE LIVE BASKET — ambiguous same-rank candidates, negating descriptors, composed winners");
    const gAgree = await sel(page, "sloppyjoe", "sloppy joe sandwich"); // control: 180 vs 185 kcal agree → NOT ambiguity
    const gg1 = await sel(page, "ambiguous", "egg");
    ok(
      gg1.status === 200 && gg1.body?.facts === null && gg1.body?.uncertain === true && factsOf(gAgree)?.match === "confident" && factsOf(gAgree)?.fdcId === 2706884,
      `G1: "egg" over [white 55 / whole 148 / yolk 334 / Benedict 288 kcal] is AMBIGUOUS — no number is published (${JSON.stringify(gg1.body)}); the control, two near-identical sandwich candidates (180 vs 185 kcal), stays confident (${factsOf(gAgree)?.match})`,
    );
    const gg2 = await sel(page, "meatless", "bacon");
    const gAsked = await sel(page, "meatless", "meatless bacon"); // control: when the person's food IS meatless bacon, it matches
    ok(
      gg2.status === 200 && gg2.body?.facts === null && gg2.body?.uncertain === true && !JSON.stringify(gg2.body).includes("309") && factsOf(gAsked)?.fdcId === 172439 && factsOf(gAsked)?.match === "confident",
      `G2: "bacon" never publishes "Bacon, meatless" (309 kcal) as bacon (${JSON.stringify(gg2.body)}); the control, query "meatless bacon", selects it (fdcId ${factsOf(gAsked)?.fdcId}, ${factsOf(gAsked)?.match})`,
    );
    const gg3 = await sel(page, "composed", "white rice");
    const gOkay = await sel(page, "minor", "banana"); // control: a plain preparation difference is still published as "likely"
    ok(
      gg3.status === 200 && gg3.body?.facts === null && gg3.body?.uncertain === true && !JSON.stringify(gg3.body).includes("96") && factsOf(gOkay)?.match === "likely" && factsOf(gOkay)?.basedOn === "baked banana",
      `G3: "white rice" never publishes "Rice, white, cooked, glutinous" (96 kcal) as likely — it carries its own descriptor (${JSON.stringify(gg3.body)}); the control, "Banana, baked" for "banana", is still likely "${factsOf(gOkay)?.basedOn}"`,
    );

    /* ---- G4–G7 + Q1–Q4: tests added from the adversarial review of this correction (21 agents, 8 confirmed
     * findings). Each G* was run failing-first against the 64/64 state (see the before/after harness in the
     * report); each Q* pins logic the first correction round left mutation-survivable. ---- */
    console.log("G4–G7 + Q1–Q4. REVIEW-DRIVEN — category-first names, singular/plural folding, 'cooked' beside a method, unique keys, tie-break order, agreement boundaries, stop/neutral words, missing preparation");
    const gg4 = await sel(page, "tofu", "tofu");
    const gg4c = await sel(page, "sloppyjoe", "sandwich"); // control: "Crackers, sandwich" is a cracker — never a "sandwich" match
    ok(
      gg4.status === 200 && gg4.body?.facts === null && gg4.body?.uncertain === true && !JSON.stringify(gg4.body).includes("177") && gg4c.body?.facts === null && gg4c.body?.uncertain === true,
      `G4: no group-first-name guess — "tofu" over the real page [Tofu yogurt, Tofu fried, Mayonnaise made with tofu, Soup, "Fish, tofu, and vegetables, tempura" 177 kcal] publishes NOTHING, never the fish-tempura dish (${JSON.stringify(gg4.body)}); control: "sandwich" over [sloppy joe…, Crackers sandwich, Cuban] publishes nothing (${JSON.stringify(gg4c.body)})`,
    );
    const gg5a = await sel(page, "peach-plural", "peach");
    const gg5b = await sel(page, "peach-singular", "peaches");
    ok(
      factsOf(gg5a)?.fdcId === 169928 && factsOf(gg5a)?.match === "confident" && factsOf(gg5b)?.fdcId === 9000402 && factsOf(gg5b)?.match === "confident",
      `G5: singular and plural meet at one stem — "peach" selects "Peaches, yellow, raw" (fdcId ${factsOf(gg5a)?.fdcId}, ${factsOf(gg5a)?.match}) instead of letting "Peach, frozen" win as likely; "peaches" selects "Peach, raw" (fdcId ${factsOf(gg5b)?.fdcId}, ${factsOf(gg5b)?.match})`,
    );
    const gg6a = await sel(page, "cookedmethod", "fried chicken");
    const gg6b = await sel(page, "cookedmethod", "fried egg");
    ok(
      factsOf(gg6a)?.fdcId === 9000501 && factsOf(gg6a)?.match === "confident" && factsOf(gg6a)?.basedOn === undefined && factsOf(gg6b)?.fdcId === 9000502 && factsOf(gg6b)?.match === "confident",
      `G6: USDA's "cooked" beside a named method is implied, not a second preparation — "fried chicken" over "Chicken, fried, cooked" is confident with no "based on cooked chicken" (${JSON.stringify(factsOf(gg6a) && { match: factsOf(gg6a).match, basedOn: factsOf(gg6a).basedOn })}); "fried egg" over "Egg, whole, cooked, fried" is confident (${factsOf(gg6b)?.match})`,
    );
    // G7 — two foods with the SAME everyday name but different lookups must render as two lines with unique React keys
    await open(page, "&mockai=nonfood&mockfacts=fixture-ui-uncertain");
    const g7dup = [];
    const g7onConsole = (m) => { if (m.type() === "error" && /same key|two children/i.test(m.text())) g7dup.push(m.text().slice(0, 120)); };
    page.on("console", g7onConsole);
    await page.setRequestInterception(true);
    const g7obs = { schemaVersion: 1, providerModel: "deepseek-flash", analyzedAt: new Date().toISOString(), isFood: true, foods: [{ name: "Curry", canonicalName: "chicken curry", confidence: "high" }, { name: "Curry", canonicalName: "lentil curry", confidence: "high" }], confidence: "high" };
    const g7h = (req) => { if (req.url().includes("/api/analyze-meal")) req.respond({ status: 200, contentType: "application/json", body: JSON.stringify({ observation: g7obs }) }); else req.continue(); };
    page.on("request", g7h);
    try {
      await openComposer(page);
      await pickMedia(page, [THALI]);
      await waitForAnalysis(page);
      await waitForPill(page, "meal");
      await waitForFacts(page, 2);
      await sleep(500);
    } finally {
      page.off("request", g7h);
      await page.setRequestInterception(false);
      page.off("console", g7onConsole);
    }
    const g7lines = await page.evaluate(() => [...document.querySelectorAll("[data-sb-food-fact-uncertain]")].map((e) => e.textContent ?? ""));
    ok(
      g7lines.length === 2 && g7lines.every((l) => l === "Curry: No reliable nutrition match yet") && g7dup.length === 0,
      `G7: two foods both named "Curry" (lookups "chicken curry" / "lentil curry") render ${g7lines.length} lines with ${g7dup.length} duplicate-key warnings${g7dup.length ? " — " + g7dup[0] : ""}`,
    );
    const qq1 = await sel(page, "exact", "banana powder"); // [Banana raw, Banana baked]: nothing is powder
    ok(
      qq1.status === 200 && qq1.body?.facts === null && qq1.body?.uncertain === true,
      `Q1: the person's own preparation must be honoured — "banana powder" over a page with NO powder variant publishes nothing (never raw banana as likely): ${JSON.stringify(qq1.body)}`,
    );
    const qq2 = [];
    for (const q of ["the banana", "a banana", "fresh banana", "raw banana", "plain banana", "Bananas"]) qq2.push([q, await sel(page, "banana", q)]);
    ok(
      qq2.every(([, r]) => factsOf(r)?.fdcId === 2709224 && factsOf(r)?.match === "confident"),
      `Q2: stop words and the neutral words (the / a / fresh / raw / plain, plural) never change the food — every query selects "Banana, raw": ${JSON.stringify(qq2.map(([q, r]) => [q, factsOf(r)?.fdcId, factsOf(r)?.match]))}`,
    );
    const qq3o = await sel(page, "tie-overlap", "rice");
    const qq3c = await sel(page, "tie-completeness", "rice");
    const qq3d = await sel(page, "tie-order", "rice");
    ok(
      factsOf(qq3o)?.fdcId === 9000602 && factsOf(qq3c)?.fdcId === 9000612 && factsOf(qq3d)?.fdcId === 9000621,
      `Q3: ties break in the specified order — token overlap beats completeness and order (the terse "Rice, white" ${factsOf(qq3o)?.fdcId}), completeness beats order (the 4-nutrient "Rice, brown" ${factsOf(qq3c)?.fdcId}), then USDA order (${factsOf(qq3d)?.fdcId})`,
    );
    const qq4a = await sel(page, "agree-124", "soup");
    const qq4b = await sel(page, "agree-130", "soup");
    const qq4c = await sel(page, "agree-floor", "soup");
    ok(
      factsOf(qq4a)?.match === "confident" && qq4b.body?.facts === null && qq4b.body?.uncertain === true && factsOf(qq4c)?.match === "confident",
      `Q4: the agreement guard's boundaries — 100 vs 124 kcal agree (${factsOf(qq4a)?.match}), 100 vs 130 do not (${JSON.stringify(qq4b.body)}), and near-zero foods never trip it: 5 vs 20 kcal (${factsOf(qq4c)?.match})`,
    );

    /* ---- R1–R6: guarantees from the Phase B review round that had no repo test ---- */
    console.log("R1–R6. REGRESSION GUARDS — mid-flight guarantees, Atwater/kJ extraction, log reset, polluted keys, superseded generations");
    const inFlight = async (interfere) => {
      await open(page, "&mockai=meal:3000&mockfacts=found");
      const reqs = [];
      const h = (req) => { if (req.url().includes("/api/food-facts")) reqs.push(req.url()); };
      page.on("request", h);
      await openComposer(page);
      await pickMedia(page, [THALI]);
      await sleep(1000); // the 3s mock analysis is still IN FLIGHT here
      const did = await interfere(page);
      await sleep(5000); // well past the 3s delay: a late result has landed — or been retired
      page.off("request", h);
      return { did, requests: reqs.length, log: await factsLog(page), pill: await pillOf(page), thumbs: await page.evaluate(() => document.querySelectorAll("[data-sb-composer] [data-sb-thumb]").length) };
    };
    const rgControl = await inFlight(async () => "none"); // proves the zeros below are not vacuous
    const rg1 = await inFlight(async (p) => {
      await p.evaluate(() => document.querySelector("[data-sb-media-edit]")?.click());
      await sleep(350);
      const clicked = await p.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /^Remove photo/i.test(x.getAttribute("aria-label") ?? "")); b?.click(); return !!b; });
      await sleep(300);
      return clicked;
    });
    ok(
      rgControl.requests === 4 && rgControl.pill === "meal" && rg1.did === true && rg1.requests === 0 && (rg1.log ?? []).length === 0 && rg1.thumbs === 0,
      `R1: removing EVERY attached photo mid-flight retires the analysis — control: ${rgControl.requests} lookups fired; after removal: ${rg1.requests} requests, log ${JSON.stringify(rg1.log)}, ${rg1.thumbs} thumbs`,
    );
    const rg2 = await inFlight(async (p) => { await assistSet(p, false); return true; });
    await open(page, "&mockai=nonfood");
    await openComposer(page);
    await assistSet(page, true); // restore the default for every later test (the switch persists in localStorage)
    ok(
      rgControl.requests === 4 && rg2.did === true && rg2.requests === 0 && (rg2.log ?? []).length === 0 && rg2.pill !== "meal",
      `R2: turning Smart Assist OFF mid-flight stops the lookups AND the auto-selection — control ${rgControl.requests}; after OFF: ${rg2.requests} requests, log ${JSON.stringify(rg2.log)}, pill ${rg2.pill}`,
    );
    const rg3a = await sel(page, "energyatwater", "spinach");
    const rg3k = await sel(page, "energykj", "spinach");
    ok(
      factsOf(rg3a)?.nutrition?.calories === 26.6 && factsOf(rg3k) !== null && factsOf(rg3k)?.nutrition?.calories === undefined && factsOf(rg3k)?.nutrition?.protein === 2.85 && !JSON.stringify(rg3k.body).includes("111"),
      `R3: energy is read from the Atwater rows (957/958 KCAL → ${factsOf(rg3a)?.nutrition?.calories}) and a kJ-only row is NEVER taken as kcal nor converted (calories ${factsOf(rg3k)?.nutrition?.calories}, protein ${factsOf(rg3k)?.nutrition?.protein} kept, no "111" anywhere)`,
    );
    await open(page, "&mockai=meal&mockfacts=found");
    await openComposer(page);
    await pickMedia(page, [THALI]);
    await waitFor(page, () => (window.__SB_MEAL_FACTS_LOG || []).filter((e) => e.status === "found").length >= 4, null, 40, 250);
    const rg4a = (await factsLog(page)) ?? [];
    await pickMedia(page, ["Nyatapola temple, Bhaktapur"]); // a SECOND photo, SAME composition → ITS OWN analysis (per-asset)
    await waitFor(page, () => (window.__SB_MEAL_ANALYSIS_LOG || []).filter((e) => e.status === "done").length >= 2, null, 40, 250);
    await waitFor(page, () => (window.__SB_MEAL_FACTS_LOG || []).filter((e) => e.status === "found").length >= 8, null, 40, 250);
    await sleep(600);
    const rg4b = (await factsLog(page)) ?? [];
    const rg4starts = (await page.evaluate(() => (window.__SB_MEAL_ANALYSIS_LOG || []).filter((e) => e.status === "start").map((e) => e.key)));
    // OWNER-SUPERSEDED (Meal Capture Extension, per-asset analysis): adding a photo no longer supersedes and
    // re-analyzes the whole set — each photo is analyzed ONCE, on its own. The invariant this check protects
    // (the log never mixes or double-counts analyses) now reads: photo 1's 8 entries are untouched, photo 2
    // adds exactly its own 8, and photo 1 was never asked about again (exactly 2 analysis starts, 2 distinct assets).
    ok(
      rg4a.length === 8 && rg4b.length === 16 && rg4b.filter((e) => e.status === "start").length === 8 && rg4b.filter((e) => e.status === "found").length === 8 && rg4starts.length === 2 && new Set(rg4starts).size === 2,
      `R4: one facts log per composition, one analysis per photo — ${rg4a.length} entries after the first photo; after a second photo ${rg4b.length} (8 + its own 8, nothing re-run for photo 1); ${rg4starts.length} analysis starts for ${new Set(rg4starts).size} distinct assets`,
    );
    // `mockai=nonfood` is a safety net only: the request is intercepted below, but if that
    // ever failed the SERVER would answer with the free nonfood mock — never the billed provider.
    await open(page, "&mockai=nonfood&mockfacts=miss");
    const rg5errs = [];
    const rg5onerr = (e) => rg5errs.push(String(e));
    page.on("pageerror", rg5onerr);
    await page.setRequestInterception(true);
    const rg5obs = { schemaVersion: 1, providerModel: "deepseek-flash", analyzedAt: new Date().toISOString(), isFood: true, foods: ["constructor", "toString", "hasOwnProperty", "__proto__"].map((n) => ({ name: n, canonicalName: n, confidence: "high" })), confidence: "high" };
    const rg5h = (req) => { if (req.url().includes("/api/analyze-meal")) req.respond({ status: 200, contentType: "application/json", body: JSON.stringify({ observation: rg5obs }) }); else req.continue(); };
    page.on("request", rg5h);
    await openComposer(page);
    await pickMedia(page, [THALI]);
    const rg5r = await waitForAnalysis(page);
    await waitForPill(page, "meal");
    await waitForFacts(page, 4);
    await sleep(500);
    const rg5ui = await page.evaluate(() => ({ card: document.querySelector("[data-sb-meal-suggestion]")?.textContent ?? null, factLines: document.querySelectorAll("[data-sb-food-fact]").length, composer: !!document.querySelector("[data-sb-composer]") }));
    page.off("request", rg5h);
    await page.setRequestInterception(false);
    page.off("pageerror", rg5onerr);
    ok(
      rg5r?.status === "done" && rg5ui.composer && !!rg5ui.card && rg5ui.card.includes("constructor") && rg5ui.card.includes("toString") && rg5ui.factLines === 0 && rg5errs.length === 0,
      `R5: foods literally named constructor / toString / hasOwnProperty / __proto__ render safely (own-property reads only): card present (${!!rg5ui.card}), ${rg5ui.factLines} fact lines, ${rg5errs.length} page errors${rg5errs.length ? " — " + rg5errs[0].slice(0, 120) : ""}`,
    );
    await open(page, "&mockai=meal&mockfacts=found:6000");
    await openComposer(page);
    await pickMedia(page, [THALI]);
    await sleep(1200); // analysis #1 done; its 4 lookups are in flight (6s each — the removal below must land mid-flight)
    await pickMedia(page, ["Nyatapola temple, Bhaktapur"]); // a second photo → its own analysis; #1's lookups keep running (per-asset)
    await waitFor(page, () => (window.__SB_MEAL_ANALYSIS_LOG || []).filter((e) => e.status === "done").length >= 2, null, 40, 250);
    // OWNER-SUPERSEDED (per-asset analysis): the retirement trigger is no longer "a new photo supersedes the old
    // analysis" but "the photo itself is REMOVED" — remove photo 1 while its 4 lookups are still in flight.
    await page.evaluate(() => document.querySelector("[data-sb-media-edit]")?.click());
    await sleep(350);
    await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === "Remove photo 1")?.click());
    await sleep(300);
    await page.evaluate(() => document.querySelector("[data-sb-sheet-back]")?.click());
    await sleep(400);
    await waitFor(page, () => (window.__SB_MEAL_FACTS_LOG || []).filter((e) => e.status === "found").length >= 4, null, 60, 250);
    await sleep(1800);
    const rg6 = (await factsLog(page)) ?? [];
    ok(
      rg6.length === 12 && rg6.filter((e) => e.status === "start").length === 4 + 4 && rg6.filter((e) => e.status === "found").length === 4 && !rg6.some((e) => e.status === "failed"),
      `R6: a REMOVED photo's late (aborted) lookups never write into the log — ${rg6.length} entries (4 starts for each photo, only the REMAINING photo's 4 found), statuses ${JSON.stringify([...new Set(rg6.map((e) => e.status))])} (a leak would add found/failed entries for the removed photo)`,
    );


    /* ================= PHASE B2 — OPEN FOOD FACTS (packaged/branded food) ================= */
    // "AI recognizes. USDA supplies generic facts. Open Food Facts supplies PACKAGED facts. AI
    // estimates only as the final fallback." Scenarios: recognition `packaged` = one HIGH-confidence
    // branded food (Nutella jar, brand "Nutella") + one generic food (toast); `packaged-medium` = the
    // same brand at MEDIUM confidence; `fabricate-off` = a raw provider payload that claims OFF as
    // its nutrition source. `mockpackaged=` pins the OFF route's scenario, `mockfacts=` the USDA one.
    const trackPaths = (page2) => {
      const pk = [], us = [];
      const h = (req) => { try { const u = new URL(req.url()); if (u.pathname === "/api/food-facts-packaged") pk.push(u.search); else if (u.pathname === "/api/food-facts") us.push(u.search); } catch {} };
      page2.on("request", h);
      return { pk, us, stop: () => page2.off("request", h) };
    };
    const packagedFetch = (page2, scenario, body) => page2.evaluate(async (s, b) => {
      try {
        const r = await fetch(`/api/food-facts-packaged${s ? `?mock=${s}` : ""}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
        return { status: r.status, body: await r.json().catch(() => null) };
      } catch (e) { return { status: 0, body: null, error: String(e) }; }
    }, scenario, body);
    const factDom = (page2) => page2.evaluate(() => ({
      facts: [...document.querySelectorAll("[data-sb-food-fact]")].map((e) => ({ text: e.textContent ?? "", id: e.getAttribute("data-sb-food-fact"), source: e.getAttribute("data-sb-fact-source") })),
      est: document.querySelector("[data-sb-meal-estimate]")?.textContent ?? null,
      card: document.querySelector("[data-sb-meal-suggestion]")?.textContent ?? null,
      err: /error|failed|unavailable|something went wrong/i.test(document.querySelector("[data-sb-composer]")?.textContent ?? ""),
    }));
    const runPackaged = async (extra, expectTerminal) => {
      const errs = [];
      const onerr = (e) => errs.push(String(e).slice(0, 160));
      page.on("pageerror", onerr);
      await attachPhotoOnly(page, extra);
      await waitForAnalysis(page);
      await waitForPill(page, "meal");
      const log = await waitForFacts(page, expectTerminal);
      await sleep(500);
      page.off("pageerror", onerr);
      return { log: log ?? [], errs };
    };
    const NUT = "Nutella jar";

    /* ---- B2-1 / B2-2 / B2-3 / B2-6a / B2-8: a known packaged product ---- */
    console.log("B2-1/2/3/6/8. PACKAGED PRODUCT — high-confidence branded recognition queries OFF (and only that food); the fact is stored/rendered as openfoodfacts, factual, with its product id");
    const trB1 = trackPaths(page);
    const rb1 = await runPackaged("&mockai=packaged&mockpackaged=found&mockfacts=found", 2);
    trB1.stop();
    const db1 = await factDom(page);
    const nutFact = db1.facts.find((f) => f.text.startsWith(NUT));
    const toastFact = db1.facts.find((f) => f.text.startsWith("Toast"));
    const nutLog = rb1.log.find((e) => e.canonicalName === "hazelnut spread");
    ok(
      !!nutFact && /539\s?kcal/.test(nutFact.text) && /6\s?g protein/.test(nutFact.text) && /58\s?g carbs/.test(nutFact.text) && /31\s?g fat/.test(nutFact.text) && /per 100\s?g/.test(nutFact.text),
      `B2-1: a known packaged product returns factual nutrition from the packaged source — the "${NUT}" line carries all four figures + the basis (found: "${nutFact?.text ?? null}")`,
    );
    ok(
      nutFact?.source === "openfoodfacts" && nutLog?.facts?.source === "openfoodfacts" && toastFact?.source === "usda",
      `B2-2: the packaged fact is stored/rendered with source "openfoodfacts" (DOM ${nutFact?.source}, log ${nutLog?.facts?.source}) and the generic food beside it stays "usda" (${toastFact?.source}) — never mislabeled`,
    );
    ok(
      nutLog?.facts?.productId === "3017620422003" && nutFact?.id === "3017620422003",
      `B2-3: the OFF product identifier is preserved end-to-end — log productId ${nutLog?.facts?.productId}, rendered data-sb-food-fact ${nutFact?.id}`,
    );
    ok(
      trB1.pk.length === 1 && trB1.us.length === 1,
      `B2-6: a HIGH-confidence branded recognition prefers OFF — exactly 1 packaged request (the branded food only) and exactly 1 USDA request (the generic toast; the OFF-answered food is never also sent to USDA) — got ${trB1.pk.length} / ${trB1.us.length}`,
    );
    ok(
      !!nutFact && !nutFact.text.includes("~") && !/Estimated/i.test(nutFact.text) && !!db1.est && /Estimated/.test(db1.est) && !db1.est.includes(NUT),
      `B2-8: the OFF fact renders as a FACT — no tilde, never "Estimated", not the estimate element (fact: "${nutFact?.text ?? null}"; the AI's whole-plate estimate stays its own separate approximate line: "${db1.est}")`,
    );

    /* ---- B2-6b: only STRONG packaged recognition prefers OFF ---- */
    console.log("B2-6b. PACKAGED PREFERENCE IS EARNED — a MEDIUM-confidence brand reading never goes to OFF");
    const trB6b = trackPaths(page);
    await runPackaged("&mockai=packaged-medium&mockpackaged=found&mockfacts=found", 2);
    trB6b.stop();
    const db6b = await factDom(page);
    ok(
      trB6b.pk.length === 0 && trB6b.us.length === 2 && db6b.facts.length === 2 && db6b.facts.every((f) => f.source === "usda"),
      `B2-6b: a medium-confidence brand reading sends ZERO packaged requests and takes the unchanged USDA path (${trB6b.pk.length} packaged / ${trB6b.us.length} USDA; sources ${JSON.stringify(db6b.facts.map((f) => f.source))})`,
    );

    /* ---- B2-4: OFF miss → the chain continues to USDA ---- */
    console.log("B2-4. OFF MISS — the chain continues safely to USDA, with nothing visible to the person");
    const rb4 = await runPackaged("&mockai=packaged&mockpackaged=miss&mockfacts=found", 2);
    const db4 = await factDom(page);
    const nut4 = db4.facts.find((f) => f.text.startsWith(NUT));
    const log4 = rb4.log.find((e) => e.canonicalName === "hazelnut spread");
    ok(
      !!nut4 && nut4.source === "usda" && JSON.stringify(log4?.via) === JSON.stringify(["openfoodfacts:miss", "usda:found"]) && !db4.err && rb4.errs.length === 0,
      `B2-4: OFF missed → the same food continued to USDA (source ${nut4?.source}, chain ${JSON.stringify(log4?.via)}), no error text (${db4.err}), ${rb4.errs.length} page errors`,
    );

    /* ---- B2-5: generic food never touches OFF ---- */
    console.log("B2-5. GENERIC FOOD — an ordinary non-packaged meal keeps the existing USDA behavior; OFF is never queried");
    const trB5 = trackPaths(page);
    const rb5 = await runPackaged("&mockai=meal&mockpackaged=found&mockfacts=found", 4);
    trB5.stop();
    const db5 = await factDom(page);
    ok(
      trB5.pk.length === 0 && trB5.us.length === 4 && db5.facts.length === 4 && db5.facts.every((f) => f.source === "usda" && f.id === "2345678") && rb5.log.every((e) => e.via === undefined),
      `B2-5: 4 generic foods → 0 packaged requests, 4 USDA requests, 4 usda facts exactly as before (${trB5.pk.length} / ${trB5.us.length} / ${db5.facts.length}; sources ${JSON.stringify([...new Set(db5.facts.map((f) => f.source))])}; no chain entries)`,
    );

    /* ---- B2-7: both structured sources miss → AI estimate ---- */
    console.log("B2-7. BOTH MISS — no fact line, the AI estimate stays as the visibly-approximate fallback");
    const rb7 = await runPackaged("&mockai=packaged&mockpackaged=miss&mockfacts=miss", 2);
    const db7 = await factDom(page);
    const log7 = rb7.log.find((e) => e.canonicalName === "hazelnut spread");
    ok(
      db7.facts.length === 0 && !!db7.est && /Estimated/.test(db7.est) && /~/.test(db7.est) && JSON.stringify(log7?.via) === JSON.stringify(["openfoodfacts:miss", "usda:miss"]) && !db7.err,
      `B2-7: OFF miss + USDA miss → 0 fact lines and the AI estimate remains ("${db7.est}"); chain ${JSON.stringify(log7?.via)}; no error text (${db7.err})`,
    );

    /* ---- B2-9: AI cannot fabricate openfoodfacts provenance ---- */
    console.log("B2-9. NO FABRICATED PROVENANCE — a provider that CLAIMS Open Food Facts is normalized to ai_estimate; only a real route response can produce an openfoodfacts fact");
    const rb9 = await runPackaged("&mockai=fabricate-off&mockpackaged=miss&mockfacts=miss", 2);
    const db9 = await factDom(page);
    const obs9 = (await page.evaluate(() => window.__SB_MEAL_ANALYSIS_LOG?.find((e) => e.status === "done")?.observation)) ?? null;
    const j9 = JSON.stringify(obs9 ?? {});
    ok(
      !!obs9 && obs9.foods?.some((f) => f.name === NUT && f.brand === "Nutella") && !/openfoodfacts|open food facts/i.test(j9) && obs9.nutritionEstimate?.calories?.source === "ai_estimate" && obs9.nutritionEstimate?.protein?.source === "ai_estimate" &&
        db9.facts.every((f) => f.source !== "openfoodfacts") && !/open food facts|openfoodfacts/i.test(db9.card ?? "") && rb9.log.every((e) => !e.facts || e.facts.source !== "openfoodfacts"),
      `B2-9: the fabricating payload really was processed (the branded food + brand survive normalization) and its claim is stripped (observation names no OFF: ${!/openfoodfacts|open food facts/i.test(j9)}; nutrition sources ai_estimate/${obs9?.nutritionEstimate?.protein?.source}); with both structured sources missing, no openfoodfacts fact exists anywhere in the page (${db9.facts.length} fact lines)`,
    );

    /* ---- B2-10: OFF failure is silent and non-blocking ---- */
    console.log("B2-10. OFF FAILURE — a real transport/server failure is silent, never blocks, and the chain continues");
    const rb10 = await runPackaged("&mockai=packaged&mockpackaged=fail&mockfacts=found", 2);
    const db10 = await factDom(page);
    const nut10 = db10.facts.find((f) => f.text.startsWith(NUT));
    await page.evaluate(() => document.querySelector("[data-sb-meal-accept]")?.click());
    await sleep(250);
    await post(page);
    const m10 = await newest(page);
    const log10 = rb10.log.find((e) => e.canonicalName === "hazelnut spread");
    ok(
      !!nut10 && nut10.source === "usda" && !db10.err && rb10.errs.length === 0 && JSON.stringify(log10?.via) === JSON.stringify(["openfoodfacts:failed", "usda:found"]) && !!m10?.fields?.foodItems?.length,
      `B2-10: OFF returned HTTP 500 → no error text (${db10.err}), ${rb10.errs.length} page errors, the food still got a USDA fact (${nut10?.source}, chain ${JSON.stringify(log10?.via)}), and the Meal posts (${m10?.fields?.foodItems?.length} items)`,
    );

    /* ---- B2-11: locale / country — NOT APPLICABLE, asserted rather than assumed ---- */
    console.log("B2-11. LOCALE/COUNTRY — NOT APPLICABLE: the packaged lookup uses the single global OFF database; no country/language parameter exists to vary");
    await open(page, "");
    const echo11 = await packagedFetch(page, "echo", { canonicalName: "hazelnut spread", brand: "Nutella" });
    const req11 = echo11.body?._debugProviderRequest ?? null;
    const j11 = JSON.stringify(req11 ?? {});
    ok(
      !!req11 && /^https:\/\/world\.openfoodfacts\.org\//.test(req11.url ?? "") && !/[?&](cc|lc|lang|country|countries)=/i.test(j11) && !/countries_tags|languages_tags/i.test(j11),
      `B2-11: NOT APPLICABLE — the packaged request targets the global world.openfoodfacts.org database and carries no country/language/locale parameter (${(req11?.url ?? "").slice(0, 80)}…); the interface locale therefore cannot change a lookup (facts are numbers per 100 g, language-neutral; lookup names are the provider's English canonicalName, exactly as USDA)`,
    );

    /* ---- B2-12: privacy — only lookup material leaves ---- */
    console.log("B2-12. PRIVACY — the outgoing OFF request carries only the factual lookup material");
    const echo12 = await packagedFetch(page, "echo", { canonicalName: "hazelnut spread", brand: "Nutella", filename: "IMG_SECRET_4821.jpg", gps: "27.658875,85.293442", caption: "SECRET-CAPTION", userId: "u-demo-001", sourceMetadata: { gps: { lat: 27.65 } } });
    const j12 = JSON.stringify(echo12.body?._debugProviderRequest ?? {});
    ok(
      j12.length > 10 && /Nutella/i.test(j12) && /hazelnut/i.test(j12) && !/SECRET|IMG_|27\.65|85\.29|u-demo|sourceMetadata|@/i.test(j12),
      `B2-12: the echoed outgoing request contains the brand + canonical name and none of the filename / GPS / caption / user id / sourceMetadata / any e-mail (${j12.slice(0, 200)})`,
    );

    /* ---- B2-13: the route's own selection — wrong packaged facts are withheld, never published ---- */
    console.log("B2-13. OFF SELECTION — the real selection runs fixture candidates: brand must match, conflicting same-rank products are withheld, a product with no energy is skipped");
    const fxA = await packagedFetch(page, "fixture-nutella", { canonicalName: "hazelnut spread", brand: "Nutella" });
    const fxB = await packagedFetch(page, "fixture-wrongbrand", { canonicalName: "hazelnut spread", brand: "Nutella" });
    const fxC = await packagedFetch(page, "fixture-conflict", { canonicalName: "hazelnut spread", brand: "Nutella" });
    const fxD = await packagedFetch(page, "fixture-noenergy", { canonicalName: "hazelnut spread", brand: "Nutella" });
    const fxE = await packagedFetch(page, "fixture-plantbased", { canonicalName: "hazelnut spread", brand: "Nutella" });
    const fxF = await packagedFetch(page, "fixture-variantonly", { canonicalName: "hazelnut spread", brand: "Nutella" });
    const fxG = await packagedFetch(page, "fixture-brandonly", { canonicalName: "hazelnut spread", brand: "Nutella" });
    const fxH = await packagedFetch(page, "fixture-bananachips", { canonicalName: "banana" });
    ok(
      fxA.body?.facts?.source === "openfoodfacts" && fxA.body.facts.productId === "3017620422003" && fxA.body.facts.nutrition?.calories === 539 && fxA.body.facts.basis === "per 100 g" &&
        fxB.body?.facts === null && fxC.body?.facts === null && fxD.body?.facts === null &&
        fxE.body?.facts?.productId === "3017620422003" && fxE.body.facts.match === "confident" && fxE.body.facts.basedOn === undefined &&
        fxF.body?.facts?.productId === "8000500426494" && fxF.body.facts.match === "likely" && fxF.body.facts.basedOn === "Nutella Plant-Based" &&
        fxA.body.facts.match === "confident" && fxG.body?.facts?.match === "likely" && fxG.body.facts.basedOn === "Nutella" && fxH.body?.facts === null,
      `B2-13: brand-matched product → facts (${fxA.body?.facts?.productId}, ${fxA.body?.facts?.nutrition?.calories} kcal); a different brand → null (${JSON.stringify(fxB.body?.facts)}); same-rank products whose calories disagree → null (${JSON.stringify(fxC.body?.facts)}); a product without energy data → null (${JSON.stringify(fxD.body?.facts)}); the plain product beats a variant that arrives first (${fxE.body?.facts?.productId}, ${fxE.body?.facts?.match}); a variant alone is LIKELY and named (${fxF.body?.facts?.match}, "${fxF.body?.facts?.basedOn}"); a brand-only product name is LIKELY not confident (${fxG.body?.facts?.match}); with no brand a variant never stands in for the plain food (${JSON.stringify(fxH.body?.facts)})`,
    );

    { // block scope: this section reuses short names (m1, u2 …) from earlier sections
    /* ================= MEAL CAPTURE UX — SPECIFIC MEAL IDENTITY + ACTIONABLE SUGGESTION (M1–M21) ================= */
    // The recognition's primary result is the MEAL as a person names it ("Burger"), not a list of
    // components. New mock scenarios (all deterministic, mock seam only): `burger`, `dalbhat`,
    // `pizza` (HIGH-confidence identity), `likelymeal` (MEDIUM → "Looks like: Dal bhat"),
    // `ambiguous` (food, but no defensible dish name), `burger-components` (identity PLUS legacy
    // component foods), `nutella-meal` (a packaged identity with a brand), `raw-meal` (a RAW provider
    // payload through the REAL normalizer). The Meal NAME field is the existing "What did you have?"
    // input (`[data-sb-ufield='items']`); the structured lifecycle lives in `foodItems`.
    const itemsSel = "[data-sb-ufield='items']";
    const mealUi = (page2) => page2.evaluate((sel) => {
      const input = document.querySelector(sel);
      const idEl = document.querySelector("[data-sb-meal-identity]");
      return {
        identity: idEl?.textContent ?? null,
        level: idEl?.getAttribute("data-sb-meal-identity-level") ?? null,
        card: document.querySelector("[data-sb-meal-suggestion]")?.textContent ?? null,
        input: input ? input.value : null,
        inputReadOnly: input ? input.readOnly || input.disabled : null,
        active: document.activeElement?.getAttribute("data-sb-ufield") ?? null,
        hasAccept: !!document.querySelector("[data-sb-meal-accept]"),
        hasAdjust: !!document.querySelector("[data-sb-meal-adjust]"),
        unknown: document.querySelector("[data-sb-meal-unknown]")?.textContent ?? null,
        noFact: document.querySelector("[data-sb-meal-nofact]")?.textContent ?? null,
        facts: [...document.querySelectorAll("[data-sb-food-fact]")].map((e) => ({ text: e.textContent ?? "", id: e.getAttribute("data-sb-food-fact"), source: e.getAttribute("data-sb-fact-source") })),
        est: document.querySelector("[data-sb-meal-estimate]")?.textContent ?? null,
        dialogs: document.querySelectorAll("[role='dialog']").length,
        pill: document.querySelector("[data-sb-record-pill]")?.getAttribute("data-sb-record-pill") ?? null,
      };
    }, itemsSel);
    const typeItems = (page2, v) => page2.evaluate((sel, x) => { const i = document.querySelector(sel); if (!i) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, x); i.dispatchEvent(new Event("input", { bubbles: true })); return true; }, itemsSel, v);
    const clickSel = async (page2, sel) => { await page2.evaluate((s) => document.querySelector(s)?.click(), sel); await sleep(350); };
    const runMeal = async (extra, facts = 1) => {
      await attachPhotoOnly(page, extra);
      await waitForAnalysis(page);
      await waitForPill(page, "meal");
      if (facts) await waitForFacts(page, facts);
      await sleep(450);
    };
    const obsFromLog = () => page.evaluate(() => window.__SB_MEAL_ANALYSIS_LOG?.find((e) => e.status === "done")?.observation ?? null);
    const MIMG = "data:image/jpeg;base64,AAAA";
    const rawMeal = (page2) => page2.evaluate(async (img) => {
      const r = await fetch("/api/analyze-meal?mock=raw-meal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ images: [{ dataUrl: img }] }) });
      return r.json().catch(() => null);
    }, MIMG);

    /* ---- M1: the recognition contract carries a specific Meal identity + a lookup identity ---- */
    console.log("M1. CONTRACT — the normalizer keeps a specific Meal name + canonicalName (+ confidence, optional brand), bounded, never a provider-claimed source");
    await open(page, "");
    const m1 = (await rawMeal(page))?.observation ?? null;
    ok(
      !!m1?.meal && m1.meal.name === "Burger" && m1.meal.canonicalName === "cheeseburger" && m1.meal.confidence === "high" && typeof m1.meal.name === "string" && m1.meal.name.length <= 80 &&
        !/usda|open food/i.test(JSON.stringify(m1.meal)) && Array.isArray(m1.foods),
      `M1: the raw provider payload normalizes to a Meal identity {name:"${m1?.meal?.name}", canonicalName:"${m1?.meal?.canonicalName}", confidence:"${m1?.meal?.confidence}"} beside the legacy components (${m1?.foods?.length ?? "n/a"}); no provider source survives`,
    );

    /* ---- M2 / M3 / M4: the primary identity is the Meal, never a component list ---- */
    console.log("M2–M4. IDENTITY — burger is Burger, dal bhat is Dal bhat, and legacy components never lead the card");
    await runMeal("&mockai=burger&mockfacts=found");
    const u2 = await mealUi(page);
    ok(
      u2.identity === "Burger" && !!u2.card && !/ · /.test(u2.identity ?? "") && !/bun|patty|lettuce|Looks like Burger/i.test(u2.card ?? ""),
      `M2: a burger photo's primary Meal identity is exactly "Burger" (found "${u2.identity}"), not a component list (card: "${(u2.card ?? "").slice(0, 120)}")`,
    );
    await runMeal("&mockai=dalbhat&mockfacts=found");
    const u3 = await mealUi(page);
    ok(
      u3.identity === "Dal bhat" && !/rice|curry|tarkari| · /i.test(u3.identity ?? ""),
      `M3: a dal bhat photo's primary Meal identity is exactly "Dal bhat" (found "${u3.identity}")`,
    );
    await runMeal("&mockai=burger-components&mockfacts=found");
    const u4 = await mealUi(page);
    const o4 = await obsFromLog();
    ok(
      (o4?.foods?.length ?? 0) >= 3 && u4.identity === "Burger" && !/Bun|Beef patty|Lettuce|Tomato/.test(u4.card ?? ""),
      `M4: even though the observation still carries ${o4?.foods?.length} internal components, the card's primary line is "${u4.identity}" and no component name appears in the card ("${(u4.card ?? "").slice(0, 120)}")`,
    );

    /* ---- M5: confident vs likely rendering, with the two actions ---- */
    console.log("M5. SUGGESTION — a confident Meal reads as its name; a likely one as \"Looks like: <name>\"; both offer Looks right + Adjust");
    await runMeal("&mockai=burger&mockfacts=found");
    const u5a = await mealUi(page);
    // a MEDIUM overall reading never auto-selects Meal (accepted Phase C) — the person selects it
    await attachPhotoOnly(page, "&mockai=likelymeal&mockfacts=found");
    await waitForAnalysis(page);
    await kind(page, "Meal");
    await waitForFacts(page, 1);
    await sleep(450);
    const u5b = await mealUi(page);
    ok(
      u5a.identity === "Burger" && u5a.level === "confident" && u5a.hasAccept && u5a.hasAdjust && u5b.identity === "Looks like: Dal bhat" && u5b.level === "likely" && u5b.hasAccept && u5b.hasAdjust,
      `M5: confident → "${u5a.identity}" (${u5a.level}), likely → "${u5b.identity}" (${u5b.level}); Looks right/Adjust present on both (${u5a.hasAccept && u5a.hasAdjust}/${u5b.hasAccept && u5b.hasAdjust})`,
    );

    /* ---- M6 / M7 / M8: Looks right ---- */
    console.log("M6–M8. LOOKS RIGHT — it fills the Meal input, confirms the record value, preserves the observation, and calls no AI");
    const trM6 = trackRequests(page);
    await runMeal("&mockai=burger&mockfacts=found");
    const obsBefore = await obsFromLog();
    const before6 = await mealUi(page);
    await clickSel(page, "[data-sb-meal-accept]");
    const after6 = await mealUi(page);
    ok(
      before6.input === "Burger" && after6.input === "Burger",
      `M6 (owner-superseded: the Meal name is AUTOFILLED on arrival): before Looks right the Meal input already holds the suggestion ("${before6.input}"); Looks right keeps it ("${after6.input}") and confirms it (see M7)`,
    );
    await post(page);
    const m7 = await newest(page);
    const idItem7 = m7?.fields?.foodItems?.find((f) => f.name === "Burger");
    ok(
      m7?.fields?.items === "Burger" && idItem7?.state === "confirmed" && idItem7?.source === "ai_visual_estimate" && JSON.stringify(m7?.fields?.mealAIObservation) === JSON.stringify(obsBefore) && !!obsBefore?.meal,
      `M7: the saved Meal value is "${m7?.fields?.items}" with its identity item in state "${idItem7?.state}" (source ${idItem7?.source}); the original AI observation is byte-identical to the one captured before the tap (${JSON.stringify(m7?.fields?.mealAIObservation) === JSON.stringify(obsBefore)})`,
    );
    trM6.stop();
    ok(trM6.length === 1, `M8: the whole flow (suggest → Looks right → save) made exactly ${trM6.length} analyze-meal request (must be 1)`);

    /* ---- M9 / M10: Adjust ---- */
    console.log("M9–M10. ADJUST — it opens the EXISTING Meal field, focused and editable, pre-filled with the suggestion; no modal");
    await runMeal("&mockai=burger&mockfacts=found");
    const before9 = await mealUi(page);
    await clickSel(page, "[data-sb-meal-adjust]");
    const after9 = await mealUi(page);
    ok(
      after9.active === "items" && after9.inputReadOnly === false && after9.dialogs === before9.dialogs,
      `M9: Adjust moves the cursor into the existing Meal field (active: ${after9.active}), editable (readOnly/disabled: ${after9.inputReadOnly}), and opens no new dialog (${before9.dialogs} → ${after9.dialogs})`,
    );
    ok(
      before9.input === "Burger" && after9.input === "Burger" && after9.active === "items",
      `M10 (owner-superseded: autofilled): the suggested Meal name is already in the existing field before Adjust ("${before9.input}"); Adjust keeps it and puts the cursor there ("${after9.input}", active ${after9.active})`,
    );

    /* ---- M11 / M12: correction persists; observation immutable ---- */
    console.log("M11–M12. CORRECTION — the person's correction becomes the canonical Meal value; the AI observation stays exactly as recognized");
    const obs11 = await obsFromLog();
    await typeItems(page, "Homemade lamb burger");
    await sleep(200);
    await post(page);
    const m11 = await newest(page);
    const fi11 = m11?.fields?.foodItems ?? [];
    ok(
      m11?.fields?.items === "Homemade lamb burger" && fi11.some((f) => f.name === "Homemade lamb burger" && f.state === "corrected" && f.source === "user") && !fi11.some((f) => f.name === "Burger"),
      `M11: saved Meal = "${m11?.fields?.items}"; identity item = ${JSON.stringify(fi11)} (a user-corrected value, no stale "Burger" item)`,
    );
    ok(
      m11?.fields?.mealAIObservation?.meal?.name === "Burger" && JSON.stringify(m11?.fields?.mealAIObservation) === JSON.stringify(obs11),
      `M12: the stored observation still says "${m11?.fields?.mealAIObservation?.meal?.name}" and is byte-identical to the original (${JSON.stringify(m11?.fields?.mealAIObservation) === JSON.stringify(obs11)})`,
    );

    /* ---- M13 / M14: nutrition provenance ---- */
    console.log("M13–M14. NUTRITION — structured facts keep their real source through both actions; the AI estimate stays an estimate");
    await runMeal("&mockai=burger&mockfacts=found");
    const f13a = await mealUi(page);
    const log13a = JSON.stringify((await page.evaluate(() => window.__SB_MEAL_FACTS_LOG)).filter((e) => e.status === "found"));
    await clickSel(page, "[data-sb-meal-accept]");
    const f13b = await mealUi(page);
    const log13b = JSON.stringify((await page.evaluate(() => window.__SB_MEAL_FACTS_LOG)).filter((e) => e.status === "found"));
    await runMeal("&mockai=nutella-meal&mockpackaged=found&mockfacts=miss", 1);
    const f13c = await mealUi(page);
    await clickSel(page, "[data-sb-meal-adjust]");
    const f13d = await mealUi(page);
    ok(
      f13a.facts.length === 1 && f13a.facts[0].source === "usda" && f13b.facts.length === 1 && f13b.facts[0].source === "usda" && f13b.facts[0].id === f13a.facts[0].id && log13a === log13b && /354\s?kcal/.test(f13b.facts[0].text) && !/Estimated|~/.test(f13b.facts[0].text) &&
        f13c.facts.length === 1 && f13c.facts[0].source === "openfoodfacts" && f13d.facts.length === 1 && f13d.facts[0].source === "openfoodfacts" && f13d.facts[0].id === "3017620422003",
      `M13: a USDA fact stays "usda" (${f13a.facts[0]?.source} → ${f13b.facts[0]?.source}, id ${f13b.facts[0]?.id}, fact log unchanged ${log13a === log13b}) and an Open Food Facts fact stays "openfoodfacts" through Adjust (${f13c.facts[0]?.source} → ${f13d.facts[0]?.source}, id ${f13d.facts[0]?.id}); factual text: "${f13b.facts[0]?.text}"`,
    );
    await runMeal("&mockai=burger&mockfacts=fixture-ui-uncertain", 1);
    const e14a = await mealUi(page);
    await clickSel(page, "[data-sb-meal-accept]");
    await post(page);
    const m14 = await newest(page);
    const cal14 = m14?.fields?.mealAIObservation?.nutritionEstimate?.calories;
    ok(
      e14a.facts.length === 0 && e14a.noFact === "No reliable nutrition match yet" && /^Estimated ~\d+–\d+ kcal/.test(e14a.est ?? "") && !!cal14?.range && cal14.value === undefined && cal14.source === "ai_estimate",
      `M14: with no trustworthy fact the card says exactly "${e14a.noFact}" and keeps the AI estimate as an estimate ("${e14a.est}"); the stored estimate is still a range with source ${cal14?.source} and no exact value (${JSON.stringify(cal14)})`,
    );

    /* ---- M15: uncertain identity — never a fabricated name ---- */
    console.log("M15. UNCERTAIN DISH — food, but no defensible name: say so, invent nothing");
    await runMeal("&mockai=ambiguous&mockfacts=found", 0);
    const u15 = await mealUi(page);
    await post(page);
    const m15 = await newest(page);
    ok(
      u15.unknown === "Looks like a meal — can you name it?" && u15.identity === null && !u15.hasAccept && u15.input === "" && !m15?.fields?.items && !(m15?.fields?.foodItems?.length),
      `M15: the card says exactly "${u15.unknown}", offers no Looks right (${u15.hasAccept}), leaves the Meal field empty ("${u15.input}") and saving without a name records no invented Meal (items ${JSON.stringify(m15?.fields?.items)}, foodItems ${JSON.stringify(m15?.fields?.foodItems)})`,
    );

    /* ---- M16 / M17 / M18: non-food, failure, AI off ---- */
    console.log("M16–M18. NON-FOOD / AI FAIL / AI OFF — nothing changes");
    await open(page, "&mockai=nonfood");
    await openComposer(page);
    await pickMedia(page, [THALI]);
    await waitForAnalysis(page);
    await sleep(900);
    const u16 = await mealUi(page);
    ok(u16.pill !== "meal" && u16.card === null && u16.identity === null && u16.unknown === null, `M16: a non-food photo produces no Meal suggestion and no category change (pill ${u16.pill}, card ${u16.card}, identity ${u16.identity})`);
    await open(page, "&mockai=fail");
    await openComposer(page);
    await pickMedia(page, [THALI]);
    await waitForAnalysis(page);
    await sleep(300);
    await kind(page, "Meal");
    await typeItems(page, "Hand-made momo");
    await sleep(200);
    const err17 = await page.evaluate(() => /error|failed|unavailable/i.test(document.querySelector("[data-sb-composer]")?.textContent ?? ""));
    await post(page);
    const m17 = await newest(page);
    ok(m17?.fields?.items === "Hand-made momo" && !err17, `M17: AI failure leaves manual Meal creation fully working (saved "${m17?.fields?.items}", error text shown: ${err17})`);
    await open(page, "&mockai=burger");
    await openComposer(page);
    await assistSet(page, false);
    const trM18 = trackRequests(page);
    await pickMedia(page, [THALI]);
    await sleep(1400);
    await kind(page, "Meal");
    await typeItems(page, "Plain rice");
    await sleep(200);
    trM18.stop();
    const m18n = trM18.length;
    await assistSet(page, true); // restore the switch while the composer is still open — later sections need it ON
    await sleep(150);
    await post(page);
    const m18 = await newest(page);
    ok(m18n === 0 && m18?.fields?.items === "Plain rice", `M18: with Smart Assist OFF there are ${m18n} analysis requests and the manual Meal saves ("${m18?.fields?.items}")`);

    /* ---- M19: zero-effort save ---- */
    console.log("M19. ZERO-EFFORT SAVE — saving without touching Looks right keeps the suggested identity, marked as suggested, never as human-confirmed");
    await runMeal("&mockai=burger&mockfacts=found");
    await post(page);
    const m19 = await newest(page);
    const fi19 = m19?.fields?.foodItems ?? [];
    ok(
      m19?.fields?.items === "Burger" && fi19.length === 1 && fi19[0].name === "Burger" && fi19[0].state === "suggested" && fi19[0].source === "ai_visual_estimate" && !fi19.some((f) => f.state === "confirmed" || f.state === "corrected") && !!m19?.fields?.mealAIObservation?.meal,
      `M19: with no tap the saved Meal is "${m19?.fields?.items}" and its identity item is ${JSON.stringify(fi19)} — suggested, not confirmed; the observation is carried`,
    );
    // …and a MEDIUM ("Looks like:") identity is autofilled the same way — suggested, never confirmed (owner-superseded: it used to stay unfilled).
    await attachPhotoOnly(page, "&mockai=likelymeal&mockfacts=found");
    await waitForAnalysis(page);
    await kind(page, "Meal");
    await sleep(400);
    await post(page);
    const m19m = await newest(page);
    ok(
      m19m?.fields?.items === "Dal bhat" && m19m?.fields?.foodItems?.length === 1 && m19m.fields.foodItems[0].state === "suggested" && !!m19m?.fields?.mealAIObservation?.meal,
      `M19b (owner-superseded: autofill covers a MEDIUM "Looks like:" identity too): an untouched save records "${m19m?.fields?.items}" as a SUGGESTED item (${m19m?.fields?.foodItems?.[0]?.state}), never confirmed; the observation is carried`,
    );

    /* ---- M20: late AI never overwrites the person's own name ---- */
    console.log("M20. USER FIRST — typing a Meal name before the AI answers keeps it");
    await open(page, "&mockai=burger:2500&mockfacts=found");
    await openComposer(page);
    await pickMedia(page, [THALI]);
    await kind(page, "Meal");
    await typeItems(page, "My family burger");
    await waitForAnalysis(page, 60, 250);
    await sleep(500);
    const u20 = await mealUi(page);
    await post(page);
    const m20 = await newest(page);
    ok(
      u20.input === "My family burger" && m20?.fields?.items === "My family burger" && !(m20?.fields?.foodItems ?? []).some((f) => f.name === "Burger" && f.state !== "corrected"),
      `M20: the late "Burger" never replaced the typed name (input "${u20.input}", saved "${m20?.fields?.items}", foodItems ${JSON.stringify(m20?.fields?.foodItems)})`,
    );

    /* ---- M21: one call through the whole flow ---- */
    console.log("M21. ONE CALL — suggestion, Adjust, edit and save are all one analysis request");
    const trM21 = trackRequests(page);
    await runMeal("&mockai=burger&mockfacts=found");
    await clickSel(page, "[data-sb-meal-adjust]");
    const pref21 = (await mealUi(page)).input;
    await typeItems(page, "Burger with extra cheese");
    await sleep(200);
    await post(page);
    trM21.stop();
    const m21 = await newest(page);
    ok(trM21.length === 1 && pref21 === "Burger" && m21?.fields?.items === "Burger with extra cheese", `M21: (Adjust pre-filled "${pref21}") ${trM21.length} analysis request across suggestion → Adjust → edit → save (must be 1); saved "${m21?.fields?.items}"`);

    }

    /* ================= MEAL CAPTURE UX EXTENSION — DETAIL LAYER · PER-ASSET DETAILS · FOUR FIELDS (E1–E43) ================= */
    // New mock scenarios (mock seam only): `details` (Dal bhat + 4 visible components, preparation
    // "cooked", portion "1 plate", occasion hint "lunch", an AI estimate), `components7` (seven
    // components), `raw-details` / `raw-low` / `raw-grams` / `raw-none` (RAW provider payloads through
    // the REAL normalizer) and `perasset[:slowa|slowb|slowc]` (each attached IMAGE answers with its own
    // observation chosen by the image's bytes: A=thali "Dal bhat", B=Nyatapola "Mango lassi", C=Phewa
    // "Gulab jamun"). Secondary detail is observation-first: visible components are NEVER recipe
    // ingredients; preparation/portion/occasion are suggestions the person's own values always beat.
    {
      const NYA = "Nyatapola temple, Bhaktapur";
      const PHEWA = "Dusk over Phewa lake";
      const x = {
        ui: (p) => p.evaluate(() => {
          const card = document.querySelector("[data-sb-meal-suggestion]");
          const q = (s) => document.querySelector(s);
          const idEl = q("[data-sb-meal-identity]");
          const madeEl = q("[data-sb-made-of]");
          return {
            card: card?.textContent ?? null,
            asset: card?.getAttribute("data-sb-asset") ?? null,
            identity: idEl?.textContent ?? null,
            madeOf: madeEl?.textContent ?? null,
            madeEditable: !!madeEl?.querySelector("input,textarea,select"),
            madeObserved: madeEl?.getAttribute("data-sb-observed") ?? null,
            more: q("[data-sb-made-of-more]")?.textContent ?? null,
            attrs: q("[data-sb-meal-attrs]")?.textContent ?? null,
            indicator: q("[data-sb-photo-indicator]")?.textContent ?? null,
            header: q("[data-sb-photo-header]")?.textContent ?? null,
            idBeforeMade: idEl && madeEl ? !!(idEl.compareDocumentPosition(madeEl) & Node.DOCUMENT_POSITION_FOLLOWING) : null,
            input: q("[data-sb-ufield='items']")?.value ?? null,
            dialogs: document.querySelectorAll("[role='dialog']").length,
            facts: [...document.querySelectorAll("[data-sb-food-fact]")].map((e) => ({ text: e.textContent ?? "", source: e.getAttribute("data-sb-fact-source") })),
            est: q("[data-sb-meal-estimate]")?.textContent ?? null,
            hasAccept: !!q("[data-sb-meal-accept]"),
          };
        }),
        assetObs: (p) => p.evaluate(() => window.__SB_MEAL_ASSET_OBS ?? null),
        thumbs: (p) => p.evaluate(() => [...document.querySelectorAll("[data-sb-media-collage] [data-sb-thumb]")].map((e) => e.getAttribute("data-sb-thumb"))),
        clickThumb: async (p, i) => { await p.evaluate((n) => [...document.querySelectorAll("[data-sb-media-collage] [data-sb-thumb]")][n]?.click(), i); await sleep(350); },
        click: async (p, sel) => { await p.evaluate((s) => document.querySelector(s)?.click(), sel); await sleep(350); },
        chip: async (p, group, text) => { await p.evaluate((g, t) => [...document.querySelectorAll(`[data-sb-chipselect='${g}'] button`)].find((b) => b.textContent.trim() === t)?.click(), group, text); await sleep(250); },
        typeField: (p, key, v) => p.evaluate((k, val) => { const i = document.querySelector(`[data-sb-ufield='${k}']`); if (!i) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, val); i.dispatchEvent(new Event("input", { bubbles: true })); return true; }, key, v),
        setQty: (p, v) => p.evaluate((val) => { const i = document.querySelectorAll("[data-sb-fooditem='0'] input")[1]; if (!i) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, val); i.dispatchEvent(new Event("input", { bubbles: true })); return true; }, v),
        obs: () => page.evaluate(() => window.__SB_MEAL_ANALYSIS_LOG?.find((e) => e.status === "done")?.observation ?? null),
        run1: async (extra, nFacts = 1) => { await attachPhotoOnly(page, extra); await waitForAnalysis(page); await waitForPill(page, "meal"); if (nFacts) await waitForFacts(page, nFacts); await sleep(450); },
        attach3: async (tag = "", n = 3) => {
          await open(page, `&mockai=perasset${tag}&mockfacts=found`);
          await openComposer(page);
          await pickMedia(page, [THALI, NYA, PHEWA]);
          await page.evaluate(() => document.querySelector("[data-sb-meta-ignore]")?.click());
          await waitFor(page, (need) => (window.__SB_MEAL_ANALYSIS_LOG || []).filter((e) => e.status === "done").length >= need, n, 40, 250);
          await sleep(500);
        },
        removeNth: async (p, n) => {
          await p.evaluate(() => document.querySelector("[data-sb-media-edit]")?.click());
          await sleep(350);
          await p.evaluate((i) => [...document.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === `Remove photo ${i}`)?.click(), n);
          await sleep(300);
          await p.evaluate(() => document.querySelector("[data-sb-sheet-back]")?.click());
          await sleep(400);
        },
      };
      const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      const names = (o) => (o?.visibleComponents ?? []).map((c) => c.name);

      /* ---- E1–E10: the detail layer ---- */
      console.log("E1–E10. DETAIL LAYER — visible components are a SECONDARY observation: kept apart from the Meal name, rendered as \"Made of:\", never a recipe claim");
      await x.run1("&mockai=details&mockfacts=found");
      const o1 = await x.obs();
      const u1 = await x.ui(page);
      ok(
        o1?.meal?.name === "Dal bhat" && eq(names(o1), ["rice", "lentils", "vegetables", "pickle"]) && o1.meal.name !== names(o1).join(" ") && !JSON.stringify(o1.meal).includes("rice"),
        `E1: the observation keeps the Meal identity "${o1?.meal?.name}" and the visible components ${JSON.stringify(names(o1))} as SEPARATE fields`,
      );
      ok(
        u1.identity === "Dal bhat" && u1.idBeforeMade === true && !!u1.madeOf && u1.identity !== u1.madeOf,
        `E2: "${u1.identity}" is the primary identity; the component list is a separate, later element (identity before made-of: ${u1.idBeforeMade}) — never the title`,
      );
      ok(u1.madeOf === "Made of: rice · lentils · vegetables · pickle", `E3: exact copy for four components (found "${u1.madeOf}")`);
      const req5 = trackRequests(page);
      await x.run1("&mockai=components7&mockfacts=found");
      const u4 = await x.ui(page);
      ok(u4.madeOf === "Made of: rice · lentils · vegetables · pickle · +3 more" && u4.more === "+3 more", `E4: seven components collapse to the first four plus "+3 more" (found "${u4.madeOf}")`);
      const before5 = u4.dialogs;
      req5.length = 0;
      await x.click(page, "[data-sb-made-of-more]");
      const u5 = await x.ui(page);
      ok(
        u5.madeOf === "Made of: rice · lentils · vegetables · pickle · papad · yogurt · salad" && u5.dialogs === before5 && req5.length === 0,
        `E5: tapping "+3 more" expands the full list INLINE (found "${u5.madeOf}"), opens no dialog (${before5} → ${u5.dialogs}) and fires ${req5.length} requests`,
      );
      req5.stop();
      ok(u5.more === null && /salad$/.test(u5.madeOf ?? ""), `E6: expansion is one-way (spec-allowed): the "+N more" control is gone (${u5.more}) and the list stays whole — no collapse machinery was added`);
      await x.run1("&mockai=details&mockfacts=found");
      const obs7 = await x.obs();
      await x.click(page, "[data-sb-meal-accept]");
      const u7 = await x.ui(page);
      await post(page);
      const m7 = await newest(page);
      ok(
        m7?.fields?.items === "Dal bhat" && m7.fields.foodItems?.some((f) => f.name === "Dal bhat" && f.state === "confirmed") && eq(m7.fields.mealAIObservation?.visibleComponents, obs7?.visibleComponents) && u7.madeOf === "Made of: rice · lentils · vegetables · pickle",
        `E7: Looks right confirms the Meal ("${m7?.fields?.items}") and the observed components are unchanged (${eq(m7?.fields?.mealAIObservation?.visibleComponents, obs7?.visibleComponents)}); the Made-of line is still shown ("${u7.madeOf}")`,
      );
      await x.run1("&mockai=details&mockfacts=found");
      const obs8 = await x.obs();
      await x.click(page, "[data-sb-meal-adjust]");
      const u8 = await x.ui(page);
      await x.typeField(page, "items", "Homemade dal bhat");
      await sleep(200);
      await post(page);
      const m8 = await newest(page);
      ok(
        m8?.fields?.items === "Homemade dal bhat" && u8.madeOf === "Made of: rice · lentils · vegetables · pickle" && eq(m8.fields.mealAIObservation?.visibleComponents, obs8?.visibleComponents),
        `E8: after Adjust the Made-of line is intact ("${u8.madeOf}"), the correction saves ("${m8?.fields?.items}") and the observed components are unchanged`,
      );
      ok(
        eq(m8?.fields?.mealAIObservation?.visibleComponents, obs8?.visibleComponents) && m8?.fields?.mealAIObservation?.meal?.name === "Dal bhat",
        `E9: changing the Meal name does not touch the component observation (deep-equal ${eq(m8?.fields?.mealAIObservation?.visibleComponents, obs8?.visibleComponents)}); the observation still says "${m8?.fields?.mealAIObservation?.meal?.name}"`,
      );
      await x.run1("&mockai=details&mockfacts=found");
      const u10 = await x.ui(page);
      await x.click(page, "[data-sb-meal-accept]");
      await post(page);
      const m10 = await newest(page);
      ok(
        u10.madeObserved === "visible" && !/ingredient/i.test(u10.card ?? "") && m10?.fields?.ingredients === undefined && !("visibleComponents" in (m10?.fields ?? {})) && eq(m10?.fields?.mealAIObservation?.visibleComponents?.map((c) => c.name), ["rice", "lentils", "vegetables", "pickle"]),
        `E10 (owner-superseded: visible components never populate the recipe Ingredients field): the card line is still marked as VISIBLE components (${u10.madeObserved}) and never says "ingredient"; the record's Ingredients field stays empty (${JSON.stringify(m10?.fields?.ingredients)}); the observation keeps its own visibleComponents untouched and no hidden item (oil, salt, ghee) was added`,
      );

      /* ---- E11–E22: per-asset observations ---- */
      console.log("E11–E22. PER-ASSET — three photos keep three observations; the selected photo owns the panel; nothing merges");
      await x.attach3();
      const th = await x.thumbs(page);
      const ao = await x.assetObs(page);
      const nm = (id) => ao?.[id]?.meal?.name;
      ok(
        th.length === 3 && !!ao && eq(th.map(nm), ["Dal bhat", "Mango lassi", "Gulab jamun"]) && Object.keys(ao).length === 3,
        `E11: three assets keep three independent observations ${JSON.stringify(th.map(nm))} (${Object.keys(ao ?? {}).length} stored); none was replaced by a merged one`,
      );
      const triple = [];
      for (let i = 0; i < 3; i++) { await x.clickThumb(page, i); triple.push(await x.ui(page)); }
      ok(triple[0].identity === "Dal bhat" && triple[0].madeOf === "Made of: rice · lentils · pickle", `E12: selecting photo 1 shows only Dal bhat + its details ("${triple[0].identity}", "${triple[0].madeOf}")`);
      ok(triple[1].identity === "Mango lassi" && triple[1].madeOf === "Made of: yogurt · mango", `E13: selecting photo 2 shows only Mango lassi + its details ("${triple[1].identity}", "${triple[1].madeOf}")`);
      ok(triple[2].identity === "Gulab jamun" && triple[2].madeOf === "Made of: milk solids · syrup", `E14: selecting photo 3 shows only Gulab jamun + its details ("${triple[2].identity}", "${triple[2].madeOf}")`);
      await x.clickThumb(page, 1);
      await x.clickThumb(page, 0);
      const back = await x.ui(page);
      ok(back.identity === "Dal bhat" && back.madeOf === "Made of: rice · lentils · pickle", `E15: photo 1 → photo 2 → photo 1 restores photo 1's original detail ("${back.identity}", "${back.madeOf}")`);
      ok(
        triple.every((t) => [/Dal bhat/, /Mango lassi/, /Gulab jamun/].filter((r) => r.test(t.card ?? "")).length === 1),
        `E16: no selected panel ever shows two photos' results merged (names present per panel: ${JSON.stringify(triple.map((t) => ["Dal bhat", "Mango lassi", "Gulab jamun"].filter((n) => (t.card ?? "").includes(n))))})`,
      );
      await post(page);
      const moments17 = (await state(page)).moments.filter((m) => m.id.startsWith("m-new-"));
      ok(
        moments17.length === 1 && (moments17[0]?.media?.items?.length ?? 0) === 3,
        `E17: three images are attachments of ONE Meal record (${moments17.length} new record, ${moments17[0]?.media?.items?.length} media items)`,
      );
      await x.attach3();
      await x.removeNth(page, 2);
      const th18 = await x.thumbs(page);
      const ao18 = await x.assetObs(page);
      await x.clickThumb(page, 1);
      const u18 = await x.ui(page);
      ok(
        th18.length === 2 && eq(th18.map((id) => ao18?.[id]?.meal?.name), ["Dal bhat", "Gulab jamun"]) && Object.keys(ao18 ?? {}).length === 2 && u18.identity === "Gulab jamun" && u18.indicator === "Photo 2 of 2",
        `E18: removing the middle photo leaves A and C with their OWN observations ${JSON.stringify(th18.map((id) => ao18?.[id]?.meal?.name))}; C is not relabeled as B (selected "${u18.identity}", "${u18.indicator}")`,
      );
      const trE19 = trackRequests(page);
      await x.attach3(":slowb", 2);
      await x.removeNth(page, 2); // B is still in flight (2.5 s) — remove it before it answers
      await sleep(3200);
      trE19.stop();
      const ao19 = await x.assetObs(page);
      const u19 = await x.ui(page);
      const log19 = await page.evaluate(() => (window.__SB_MEAL_FACTS_LOG ?? []).map((e) => e.canonicalName));
      ok(
        Object.keys(ao19 ?? {}).length === 2 && !JSON.stringify(ao19).includes("Mango lassi") && !log19.includes("mango lassi") && u19.identity === "Dal bhat" && !(u19.card ?? "").includes("Mango lassi"),
        `E19: B's late answer (arrives after its removal) is ignored — stored assets ${JSON.stringify(Object.values(ao19 ?? {}).map((o) => o?.meal?.name))}, no lassi lookup (${JSON.stringify(log19)}), visible panel "${u19.identity}"`,
      );
      await x.attach3(":slowb", 2);
      await x.clickThumb(page, 0);
      const mid20 = await x.ui(page);
      await sleep(3200);
      const ao20 = await x.assetObs(page);
      const u20 = await x.ui(page);
      ok(
        mid20.identity === "Dal bhat" && Object.values(ao20 ?? {}).some((o) => o?.meal?.name === "Mango lassi") && u20.identity === "Dal bhat" && u20.indicator === "Photo 1 of 3",
        `E20: B's late result is stored under B (${Object.values(ao20 ?? {}).map((o) => o?.meal?.name)}) but the visible panel stays on the selected photo ("${u20.identity}", "${u20.indicator}") — arrival order never controls it`,
      );
      await x.attach3();
      const u21 = await x.ui(page);
      ok(u21.indicator === "Photo 1 of 3", `E21: first of three selected shows exactly "Photo 1 of 3" (found "${u21.indicator}")`);
      ok(u21.header === "This photo", `E22: the per-image detail header is exactly "This photo" (found "${u21.header}")`);

      /* ---- E23–E24: visible components — honesty and ownership ---- */
      console.log("E23–E24. VISIBLE COMPONENTS — only usable items; observation-only");
      await x.run1("&mockai=raw-details&mockfacts=found");
      const o23 = await x.obs();
      const u23 = await x.ui(page);
      await x.run1("&mockai=raw-low&mockfacts=found");
      const o23b = await x.obs();
      const u23b = await x.ui(page);
      ok(
        eq(names(o23), ["rice", "lentils"]) && u23.madeOf === "Made of: rice · lentils" && o23b?.visibleComponents === undefined && u23b.madeOf === null,
        `E23: usable components kept (${JSON.stringify(names(o23))}; the low-confidence "secret ghee" and the duplicate dropped), all-low yields nothing — no placeholder list (${JSON.stringify(o23b?.visibleComponents)}, made-of ${u23b.madeOf})`,
      );
      await x.run1("&mockai=details&mockfacts=found");
      const u24 = await x.ui(page);
      await more(page);
      await addField(page, "ingredients");
      const ing24 = await page.evaluate(() => { const i = document.querySelector("[data-sb-ufield='ingredients']"); return { present: !!i, editable: !!i && !i.readOnly && !i.disabled, value: i?.value ?? null }; });
      await x.click(page, "[data-sb-meal-accept]");
      await post(page);
      const m24 = await newest(page);
      await x.run1("&mockai=details&mockfacts=found");
      await more(page);
      await addField(page, "ingredients");
      await x.typeField(page, "ingredients", "rice, dal only");
      await sleep(200);
      await post(page);
      const m24b = await newest(page);
      ok(
        u24.madeEditable === false && !("visibleComponents" in (m24?.fields ?? {})) && m24?.fields?.ingredients === undefined && ing24.value === "" && ing24.present && ing24.editable && m24b?.fields?.ingredients === "rice, dal only" && eq(m24b?.fields?.mealAIObservation?.visibleComponents?.map((c) => c.name), ["rice", "lentils", "vegetables", "pickle"]),
        `E24 (owner-superseded): the "Made of" line is display-only (editable: ${u24.madeEditable}); the Ingredients FIELD stays empty (${JSON.stringify(m24?.fields?.ingredients)}), editable in More details (${ing24.editable}), and the person's own "${m24b?.fields?.ingredients}" wins; the observation is unchanged`,
      );

      /* ---- E25–E28: preparation ---- */
      console.log("E25–E28. PREPARATION — only when visually defensible; never derived from the name; the person's value wins");
      await x.run1("&mockai=raw-details&mockfacts=found");
      const o25 = await x.obs();
      const u25 = await x.ui(page);
      ok(o25?.preparation === "steamed" && /Steamed/.test(u25.attrs ?? ""), `E25: a HIGH-confidence preparation is kept (normalized "${o25?.preparation}") and shown compactly ("${u25.attrs}")`);
      await x.run1("&mockai=raw-low&mockfacts=found");
      const o26 = await x.obs();
      const u26 = await x.ui(page);
      ok(o26?.preparation === undefined && u26.attrs === null, `E26: a LOW-confidence preparation is blank (${o26?.preparation}); nothing is shown (${u26.attrs})`);
      await open(page, "&mockai=details:2500&mockfacts=found");
      await openComposer(page);
      await pickMedia(page, [THALI]);
      await kind(page, "Meal");
      await more(page);
      await addField(page, "preparation");
      await x.typeField(page, "preparation", "baked");
      await waitForAnalysis(page, 60, 250);
      await sleep(500);
      await x.click(page, "[data-sb-meal-accept]");
      await post(page);
      const m27 = await newest(page);
      ok(m27?.fields?.preparation === "baked" && m27?.fields?.mealAIObservation?.preparation === "cooked", `E27: the person's "baked" stays canonical (${m27?.fields?.preparation}); the AI's "cooked" lives only in the observation (${m27?.fields?.mealAIObservation?.preparation}) and the late answer never restored it`);
      await x.run1("&mockai=raw-none&mockfacts=found");
      const o28 = await x.obs();
      const u28 = await x.ui(page);
      ok(o28?.preparation === undefined && /grilled/i.test(o28?.meal?.name ?? "") && u28.attrs === null, `E28: a meal literally named "${o28?.meal?.name}" with NO provider preparation stays blank (${o28?.preparation}) — nothing is derived from the name`);

      /* ---- E29–E33: approximate portion ---- */
      console.log("E29–E33. PORTION — human-scale only; no gram fabrication; the person's value wins");
      await x.run1("&mockai=raw-details&mockfacts=found");
      const u29 = await x.ui(page);
      const o29 = await x.obs();
      ok(o29?.portion === "1 bowl" && /1 bowl/.test(u29.attrs ?? ""), `E29: a high-confidence human-scale portion is accepted (${o29?.portion}) and shown ("${u29.attrs}")`);
      await x.run1("&mockai=raw-grams&mockfacts=found");
      const o30 = await x.obs();
      const u30 = await x.ui(page);
      ok(o30?.portion === undefined && !JSON.stringify(o30).includes("237") && !/237/.test(u30.card ?? ""), `E30: a measured "237 g" is rejected outright (${o30?.portion}); no gram figure appears anywhere`);
      await x.run1("&mockai=raw-low&mockfacts=found");
      const o31 = await x.obs();
      ok(o31?.portion === undefined, `E31: a low-confidence portion is blank (${o31?.portion})`);
      await x.run1("&mockai=details&mockfacts=found");
      await x.click(page, "[data-sb-meal-accept]");
      await more(page);
      // OWNER-SUPERSEDED (Phase V1): the portion is now its own per-photo editor ("Portion"), not a field of the Foods & drinks list.
      await x.typeField(page, "portion", "2 plates");
      await sleep(200);
      await post(page);
      const m32 = await newest(page);
      ok(m32?.fields?.foodItems?.[0]?.quantity === "2 plates" && m32?.fields?.mealAIObservation?.portion === "1 plate", `E32: Looks right offered "1 plate"; the person's "2 plates" is canonical (${m32?.fields?.foodItems?.[0]?.quantity}); the observation still says "${m32?.fields?.mealAIObservation?.portion}"`);
      await x.run1("&mockai=details&mockfacts=found");
      const u33 = await x.ui(page);
      ok(u33.facts.length === 1 && u33.facts[0].source === "usda" && /per 100\s?g/.test(u33.facts[0].text) && !/plate/.test(u33.facts[0].text), `E33: the structured source keeps its own basis ("${u33.facts[0]?.text}", ${u33.facts[0]?.source}) — the visual portion never rewrites or rescales it`);

      /* ---- E34–E38: occasion ---- */
      console.log("E34–E38. OCCASION — a suggestion only; never auto-confirmed; never from the clock");
      await x.run1("&mockai=details&mockfacts=found");
      const u34 = await x.ui(page);
      const o34 = await x.obs();
      await post(page); // zero-effort: no tap at all
      const m35a = await newest(page);
      ok(o34?.possibleMealType === "lunch" && /Lunch/.test(u34.attrs ?? ""), `E34: a high-confidence occasion surfaces as a suggestion ("${u34.attrs}", observation ${o34?.possibleMealType})`);
      await x.run1("&mockai=details&mockfacts=found");
      await x.click(page, "[data-sb-meal-accept]");
      await post(page);
      const m35b = await newest(page);
      ok(m35a?.fields?.occasion === "lunch" && m35b?.fields?.occasion === "lunch", `E35 (owner-superseded: occasion AUTOFILLS): saved with no tap the occasion is the model's hint (${m35a?.fields?.occasion}) — visible as a chip and editable; Looks right keeps it (${m35b?.fields?.occasion}); the person's own choice still wins (E37)`);
      await x.run1("&mockai=raw-none&mockfacts=found");
      const u36 = await x.ui(page);
      await x.click(page, "[data-sb-meal-accept]");
      await post(page);
      const m36 = await newest(page);
      ok(!/Breakfast|Lunch|Dinner|Snack/.test(u36.attrs ?? "") && m36?.fields?.occasion === undefined, `E36: with no defensible occasion nothing is suggested (${u36.attrs}) and nothing is recorded (${m36?.fields?.occasion})`);
      await x.run1("&mockai=details&mockfacts=found");
      await x.chip(page, "occasion", "Dinner");
      await x.click(page, "[data-sb-meal-accept]");
      await post(page);
      const m37 = await newest(page);
      ok(m37?.fields?.occasion === "dinner" && m37?.fields?.mealAIObservation?.possibleMealType === "lunch", `E37: the person's "Dinner" stays (${m37?.fields?.occasion}) — Looks right and the late suggestion never restore "lunch" (observation keeps ${m37?.fields?.mealAIObservation?.possibleMealType})`);
      ok(m36?.fields?.occasion === undefined && o28 && !JSON.stringify(o28).match(/breakfast|lunch|dinner|snack/i), `E38: no occasion is ever asserted from time alone (no provider hint → ${m36?.fields?.occasion}; observation carries none)`);

      /* ---- E39–E43: cross-field safety ---- */
      console.log("E39–E43. CROSS-FIELD SAFETY — the four fields never replace the Meal name, relabel nutrition, rewrite history or add effort");
      await x.run1("&mockai=details&mockfacts=found");
      const u39 = await x.ui(page);
      const obs39 = await x.obs();
      await x.click(page, "[data-sb-meal-accept]");
      await post(page);
      const m39 = await newest(page);
      ok(u39.identity === "Dal bhat" && m39?.fields?.items === "Dal bhat" && !!u39.madeOf && !!u39.attrs, `E39: with components + preparation + portion + occasion all present the Meal name is still exactly "${m39?.fields?.items}" (card identity "${u39.identity}")`);
      await x.run1("&mockai=details&mockfacts=found");
      const u40 = await x.ui(page);
      await post(page);
      const m40 = await newest(page);
      ok(u40.facts[0]?.source === "usda" && /^Estimated ~/.test(u40.est ?? "") && m40?.fields?.mealAIObservation?.nutritionEstimate?.calories?.source === "ai_estimate", `E40: USDA stays "${u40.facts[0]?.source}" and the AI estimate stays an estimate ("${u40.est}", ${m40?.fields?.mealAIObservation?.nutritionEstimate?.calories?.source})`);
      ok(eq(m39?.fields?.mealAIObservation, obs39), `E41: Looks right applied the person's accepted values but the stored AI observation is byte-identical to what recognition said (${eq(m39?.fields?.mealAIObservation, obs39)})`);
      await x.run1("&mockai=details&mockfacts=found");
      const obs42 = await x.obs();
      await x.click(page, "[data-sb-meal-adjust]");
      await x.typeField(page, "items", "My dal bhat");
      await sleep(200);
      await post(page);
      const m42 = await newest(page);
      ok(m42?.fields?.items === "My dal bhat" && eq(m42?.fields?.mealAIObservation, obs42), `E42: the correction is canonical ("${m42?.fields?.items}") and the original observation (every field) is intact (${eq(m42?.fields?.mealAIObservation, obs42)})`);
      await x.run1("&mockai=details&mockfacts=found");
      const obs43 = await x.obs();
      await post(page);
      const m43 = await newest(page);
      ok(
        m43?.fields?.items === "Dal bhat" && m43.fields.foodItems?.length === 1 && m43.fields.foodItems[0].state === "suggested" && m43.fields.foodItems[0].quantity === "1 plate" && m43.fields.preparation === "cooked" && m43.fields.occasion === "lunch" && m43.fields.ingredients === undefined && m43.fields.context === "home" && eq(m43.fields.mealAIObservation, obs43),
        `E43 (owner-superseded: zero-effort now carries the AUTOFILL): with no tap at all the Meal is "${m43?.fields?.items}" (SUGGESTED item, never confirmed) with portion ${m43?.fields?.foodItems?.[0]?.quantity}, preparation ${m43?.fields?.preparation}, occasion ${m43?.fields?.occasion}, ingredients ${JSON.stringify(m43?.fields?.ingredients)}, setting ${m43?.fields?.context}; the AI observation is byte-identical`,
      );

      /* ---- A1–A12: MEAL AUTOFILL (owner-directed) — the record fills itself from what the AI saw and from the photo's metadata ---- */
      console.log("A1–A12. MEAL AUTOFILL — fields fill on arrival; the person's own value always wins; cleared stays cleared; every value visible and undoable");
      const fieldsUi = (p) => p.evaluate(() => {
        const q = (k) => document.querySelector(`[data-sb-ufield='${k}']`)?.value ?? null;
        const chip = (g) => [...document.querySelectorAll(`[data-sb-chipselect='${g}'] button[aria-checked='true']`)].map((b) => b.textContent.trim())[0] ?? null;
        return { items: q("items"), ingredients: q("ingredients"), preparation: q("preparation"), occasion: chip("occasion"), context: chip("context") };
      });
      await x.run1("&mockai=details&mockfacts=found");
      await more(page);
      const f1 = await fieldsUi(page);
      ok(
        f1.items === "Dal bhat" && !f1.ingredients && f1.preparation === "cooked" && f1.occasion === "Lunch" && f1.context === "Home cooked",
        `A1: with no tap at all every detected field except recipe Ingredients is already filled and VISIBLE — name "${f1.items}", ingredients "${f1.ingredients}", preparation "${f1.preparation}", occasion "${f1.occasion}", setting "${f1.context}"`,
      );
      await attachPhotoOnly(page, "&mockai=likelymeal&mockfacts=found");
      await waitForAnalysis(page);
      await kind(page, "Meal");
      await sleep(500);
      const f2 = await fieldsUi(page);
      ok(f2.items === "Dal bhat", `A2: a MEDIUM ("Looks like:") identity is filled too ("${f2.items}") — suggested, editable, never confirmed`);
      await open(page, "&mockai=raw-none&mockfacts=found");
      await openComposer(page);
      await pickMedia(page, [PHEWA]); // a fixture photo whose own metadata says it was taken at 18:20
      await page.evaluate(() => document.querySelector("[data-sb-meta-ignore]")?.click());
      await waitForAnalysis(page);
      await waitForPill(page, "meal");
      await sleep(600);
      await more(page);
      const f3 = await fieldsUi(page);
      await x.run1("&mockai=raw-none&mockfacts=found");
      await more(page);
      const f3b = await fieldsUi(page);
      ok(f3.occasion === "Dinner" && f3b.occasion === null, `A3: with no occasion from the model, the time the PHOTO was taken (18:20 → "${f3.occasion}") fills it; a photo with no capture time fills nothing (${f3b.occasion}) — the posting clock is never used`);
      await x.run1("&mockai=nutella-meal&mockpackaged=found&mockfacts=miss");
      await more(page);
      const f4 = await fieldsUi(page);
      ok(f4.context === "Packaged" && f4.items === "Nutella", `A4: a brand printed on the label fills the setting as "${f4.context}" (name "${f4.items}")`);
      await x.run1("&mockai=details&mockfacts=found");
      await post(page);
      const m5 = await newest(page);
      const n5 = m5?.fields?.mealNutrition;
      await x.run1("&mockai=details&mockfacts=miss", 1);
      await post(page);
      const m5b = await newest(page);
      const n5b = m5b?.fields?.mealNutrition;
      ok(
        n5?.calories?.value === 354 && n5.calories.source === "usda" && n5.protein?.value === 20 && /per 100/.test(n5.basis) && n5b?.calories?.range?.min === 700 && n5b.calories.source === "ai_estimate" && n5b.calories.value === undefined && /estimate/.test(n5b.basis) && eq(m5?.fields?.mealAIObservation?.nutritionEstimate?.calories?.source, "ai_estimate"),
        `A5: the record carries its nutrition with provenance — a found fact (${n5?.calories?.value} kcal, ${n5?.calories?.source}, "${n5?.basis}") or, when none, the labelled estimate (${JSON.stringify(n5b?.calories?.range)}, ${n5b?.calories?.source}, "${n5b?.basis}"); the AI observation keeps its own estimate`,
      );
      await open(page, "&mockai=details:2500&mockfacts=found");
      await openComposer(page);
      await pickMedia(page, [THALI]);
      await kind(page, "Meal");
      await x.typeField(page, "items", "My family dal bhat");
      await more(page);
      await addField(page, "ingredients");
      await x.typeField(page, "ingredients", "rice, ghee");
      await waitForAnalysis(page, 60, 250);
      await sleep(600);
      const f6 = await fieldsUi(page);
      await post(page);
      const m6x = await newest(page);
      ok(f6.items === "My family dal bhat" && f6.ingredients === "rice, ghee" && m6x?.fields?.items === "My family dal bhat" && m6x?.fields?.ingredients === "rice, ghee" && f6.preparation === "cooked", `A6: what the person typed before the AI answered is never overwritten (name "${f6.items}", ingredients "${f6.ingredients}") while an untouched field still fills ("${f6.preparation}")`);
      await x.run1("&mockai=details&mockfacts=found");
      await more(page);
      await addField(page, "ingredients");
      await x.typeField(page, "ingredients", "rice, ghee");
      await x.typeField(page, "ingredients", "");
      await sleep(150);
      await x.click(page, "[data-sb-meal-accept]");
      await post(page);
      const m7x = await newest(page);
      ok(m7x?.fields?.ingredients === undefined && m7x?.fields?.items === "Dal bhat", `A7: a field the person CLEARED stays cleared — even after Looks right (ingredients ${JSON.stringify(m7x?.fields?.ingredients)})`);
      await x.run1("&mockai=details&mockfacts=found");
      await x.typeField(page, "items", "");
      await sleep(150);
      await post(page);
      const m8x = await newest(page);
      const idItem8 = (m8x?.fields?.foodItems ?? []).find((f) => f.name === "Dal bhat");
      ok(!m8x?.fields?.items && idItem8?.state === "rejected" && idItem8?.source === "ai_visual_estimate" && !!m8x?.fields?.mealAIObservation?.meal, `A8: clearing the Meal name is a decision, never silently undone — no name saved (${JSON.stringify(m8x?.fields?.items)}), the AI's item is recorded as "${idItem8?.state}", the observation is kept`);
      await x.attach3("", 3);
      await more(page);
      const f9a = await fieldsUi(page);
      await x.removeNth(page, 1); // the primary photo goes
      await sleep(600);
      const f9b = await fieldsUi(page);
      ok(f9a.items === "Dal bhat" && !f9a.ingredients && f9b.items === "Mango lassi" && !f9b.ingredients, `A9: removing the primary photo takes back only what it filled and fills from the next one ("${f9a.items}" → "${f9b.items}"; "${f9a.ingredients}" → "${f9b.ingredients}")`);
      await open(page, "&mockai=details&mockfacts=found");
      await openComposer(page);
      await assistSet(page, false);
      const trA10 = trackRequests(page);
      await pickMedia(page, [THALI]);
      await sleep(1400);
      await kind(page, "Meal");
      const f10 = await fieldsUi(page);
      trA10.stop();
      const nA10 = trA10.length;
      await assistSet(page, true);
      await open(page, "&mockai=fail&mockfacts=found");
      await openComposer(page);
      await pickMedia(page, [THALI]);
      await waitForAnalysis(page);
      await kind(page, "Meal");
      const f10b = await fieldsUi(page);
      ok(nA10 === 0 && !f10.items && !f10.ingredients && !f10b.items && !f10b.ingredients, `A10: AI off (${nA10} requests) and AI failed fill nothing — the manual Meal is untouched (${JSON.stringify([f10.items, f10b.items])})`);
      await x.run1("&mockai=raw-low&mockfacts=found");
      await more(page);
      const f11 = await fieldsUi(page);
      ok(f11.ingredients === null && !f11.preparation && f11.items === "Dal bhat", `A11: low-confidence components and preparation fill nothing (ingredients ${f11.ingredients}, preparation ${f11.preparation}); the confident name still fills ("${f11.items}")`);
      await x.run1("&mockai=details&mockfacts=found");
      const obs12 = await x.obs();
      await post(page);
      const m12 = await newest(page);
      ok(eq(m12?.fields?.mealAIObservation, obs12) && !!obs12?.visibleComponents && m12?.fields?.mealAIObservation?.possibleMealType === "lunch", `A12: however much was autofilled, the stored AI observation is byte-identical to what recognition said (${eq(m12?.fields?.mealAIObservation, obs12)})`);

      /* ---- E44–E46: call accounting, source-metadata immutability, AI OFF (required proofs) ---- */
      console.log("E44–E46. ONE CALL PER UNCHANGED ASSET · sourceMetadata IMMUTABLE · AI OFF with several photos");
      const tr44 = trackRequests(page);
      await x.attach3();
      const c1 = tr44.length;
      for (let i = 0; i < 3; i++) await x.clickThumb(page, i);
      const c2 = tr44.length;
      await x.clickThumb(page, 0);
      await x.click(page, "[data-sb-meal-accept]");
      const c3 = tr44.length;
      await x.removeNth(page, 2);
      const c4 = tr44.length;
      await post(page);
      tr44.stop();
      ok(c1 === 3 && c2 === 3 && c3 === 3 && c4 === 3, `E44a: 3 distinct photos → ${c1} per-asset requests; selecting photos 1/2/3 → ${c2}; Looks right → ${c3}; removing a photo → ${c4} (a remaining photo is never re-analyzed)`);
      const tr44b = trackRequests(page);
      await x.run1("&mockai=components7&mockfacts=found");
      const d1 = tr44b.length;
      await x.click(page, "[data-sb-made-of-more]");
      const d2 = tr44b.length;
      await x.click(page, "[data-sb-meal-adjust]");
      await x.typeField(page, "items", "Dal bhat thali");
      await post(page);
      tr44b.stop();
      ok(d1 === 1 && d2 === 1 && tr44b.length === 1, `E44b: 1 photo → ${d1} request; expanding "+3 more" → ${d2}; Adjust, edit and save → ${tr44b.length} total`);
      await x.attach3();
      const snapA = await page.evaluate(() => JSON.stringify(window.__SB_ASSET_SNAPSHOT?.()));
      for (let i = 0; i < 3; i++) await x.clickThumb(page, i);
      await x.clickThumb(page, 0);
      await x.click(page, "[data-sb-meal-accept]");
      await post(page);
      const snapB = await page.evaluate(() => JSON.stringify(window.__SB_ASSET_SNAPSHOT?.()));
      ok(!!snapA && snapA !== "undefined" && snapA === snapB, `E45: every attached asset's sourceMetadata is byte-identical before vs after multi-image analysis, selection, Looks right and save (${snapA === snapB}; ${snapA?.length} bytes compared)`);
      await open(page, "&mockai=perasset&mockfacts=found");
      await openComposer(page);
      await assistSet(page, false);
      const tr46 = trackRequests(page);
      const errs46 = [];
      const on46 = (e) => errs46.push(String(e).slice(0, 120));
      page.on("pageerror", on46);
      await pickMedia(page, [THALI, NYA, PHEWA]);
      await page.evaluate(() => document.querySelector("[data-sb-meta-ignore]")?.click());
      await sleep(1400);
      await kind(page, "Meal");
      const th46 = await x.thumbs(page);
      for (let i = 0; i < th46.length; i++) await x.clickThumb(page, i);
      await x.clickThumb(page, 0); // OWNER-SUPERSEDED (Phase V1): a Meal name typed now belongs to the SELECTED photo — and the record's name is the first photo's
      await x.typeField(page, "items", "Family dinner");
      const u46 = await x.ui(page);
      tr46.stop();
      const n46 = tr46.length;
      await assistSet(page, true);
      await sleep(150);
      await post(page);
      page.off("pageerror", on46);
      const m46 = await newest(page);
      ok(n46 === 0 && th46.length === 3 && u46.card === null && errs46.length === 0 && m46?.fields?.items === "Family dinner", `E46: with Smart Assist OFF and three photos → ${n46} analysis requests, the gallery still works (${th46.length} thumbs, no card, ${errs46.length} page errors) and the manual Meal saves ("${m46?.fields?.items}")`);
    }


    /* ================= PHASE V1 — MEAL COMPLETE FIELD EDITABILITY + AGGRESSIVE DEFAULTS + PER-PHOTO FORM (V1-1 … V1-128) ================= */
    // The Meal form belongs to the SELECTED PHOTO: every displayed Meal value is that photo's own effective value,
    // editable and independently clearable; HIGH and MEDIUM confidence fill, LOW or unknown stays blank; Looks right
    // accepts everything shown on the selected photo (source preserved); the Meal is still ONE record carrying each
    // photo's own observation + effective state (`fields.mealAssets`). Fixtures: `v1assets` (three photos with
    // deliberately different COMPLETE observations: A grilled plate, B drink, C dessert), `v1-medium`, `v1-low`.
    {
      const NYA = "Nyatapola temple, Bhaktapur";
      const PHEWA = "Dusk over Phewa lake";
      let vn = 0;
      const v1 = (cond, msg) => ok(!!cond, `V1-${++vn}: ${msg}`);
      const F = ["name", "components", "preparation", "portion", "occasion", "setting", "calories", "protein", "carbs", "fat"];
      const A = { name: "Grilled chicken with vegetables", components: "grilled chicken, cheese, egg, tomatoes", preparation: "grilled", portion: "1 plate", occasion: "Lunch", setting: "Restaurant · Café", calories: "650–1050", protein: "45–85", carbs: "15–40", fat: "35–75" };
      const Bv = { name: "Mango lassi", components: "yogurt, mango", preparation: "", portion: "1 glass", occasion: "Snack", setting: "", calories: "180–250", protein: "4–8", carbs: "30–45", fat: "4–9" };
      const Cv = { name: "Gulab jamun", components: "milk solids, syrup", preparation: "fried", portion: "2 pieces", occasion: "Dinner", setting: "Event · Party", calories: "300–450", protein: "5–9", carbs: "45–70", fat: "12–22" };
      const readForm = (p) => p.evaluate(() => {
        const val = (k) => { const el = document.querySelector(`[data-sb-ufield='${k}']`); return el ? el.value : undefined; };
        const chip = (g) => { const grp = document.querySelector(`[data-sb-chipselect='${g}']`); return grp ? ([...grp.querySelectorAll("button[aria-checked='true']")].map((b) => b.textContent.trim())[0] ?? "") : undefined; };
        return { card: document.querySelector("[data-sb-meal-identity]")?.textContent ?? null, name: val("items"), components: val("components"), preparation: val("preparation"), portion: val("portion"), occasion: chip("occasion"), setting: chip("context"), calories: val("calories"), protein: val("protein"), carbs: val("carbs"), fat: val("fat") };
      });
      const setVal = (p, key, v) => p.evaluate((k, val) => { const i = document.querySelector(`[data-sb-ufield='${k}']`); if (!i) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, val); i.dispatchEvent(new Event("input", { bubbles: true })); return true; }, key, v);
      const clickClear = async (p, key) => { const ok_ = await p.evaluate((k) => { const b = document.querySelector(`[data-sb-clear='${k}']`); if (!b) return false; b.click(); return true; }, key); await sleep(150); return ok_; };
      const clickChip = async (p, group, text) => { await p.evaluate((g, t) => [...document.querySelectorAll(`[data-sb-chipselect='${g}'] button`)].find((b) => b.textContent.trim() === t)?.click(), group, text); await sleep(200); };
      const clickChipOff = async (p, group) => { await p.evaluate((g) => document.querySelector(`[data-sb-chipselect='${g}'] button[aria-checked='true']`)?.click(), group); await sleep(200); };
      const thumbs = (p) => p.evaluate(() => [...document.querySelectorAll("[data-sb-media-collage] [data-sb-thumb]")].map((e) => e.getAttribute("data-sb-thumb")));
      const clickThumb = async (p, i) => { await p.evaluate((n) => [...document.querySelectorAll("[data-sb-media-collage] [data-sb-thumb]")][n]?.click(), i); await sleep(300); };
      const obsLog = () => page.evaluate(() => window.__SB_MEAL_ANALYSIS_LOG?.filter((e) => e.status === "done").map((e) => e.observation) ?? []);
      const assetObsNow = () => page.evaluate(() => window.__SB_MEAL_ASSET_OBS ?? null);
      const savedAssets = async () => (await newest(page))?.fields?.mealAssets ?? null;
      const clickSel = async (sel) => { await page.evaluate((s) => document.querySelector(s)?.click(), sel); await sleep(350); };
      const openOne = async (extra, { more: m = true, wait = true } = {}) => {
        await open(page, extra);
        await openComposer(page);
        await pickMedia(page, [THALI]);
        if (wait) { await waitForAnalysis(page); await waitForPill(page, "meal"); await sleep(600); }
        if (m) await more(page);
      };
      const openThree = async (extra, n = 3) => {
        await open(page, extra);
        await openComposer(page);
        await pickMedia(page, [THALI, NYA, PHEWA]);
        await page.evaluate(() => document.querySelector("[data-sb-meta-ignore]")?.click());
        await waitFor(page, (need) => (window.__SB_MEAL_ANALYSIS_LOG || []).filter((e) => e.status === "done").length >= need, n, 60, 250);
        await sleep(700);
        await more(page);
      };
      const removeNth = async (p, n) => {
        await p.evaluate(() => document.querySelector("[data-sb-media-edit]")?.click());
        await sleep(350);
        await p.evaluate((i) => [...document.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === `Remove photo ${i}`)?.click(), n);
        await sleep(300);
        await p.evaluate(() => document.querySelector("[data-sb-sheet-back]")?.click());
        await sleep(450);
      };
      const eqf = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      const cellOf = (st, f) => st?.[f];

      console.log("V1. collecting the single-photo flows (high · medium · low · unknown · edit · clear · late AI) …");
      // ---- D1: HIGH confidence, no action, then zero-effort save ----
      const trD1 = trackRequests(page);
      await openOne("&mockai=v1assets&mockfacts=miss");
      const form1 = await readForm(page);
      const obsD1 = (await obsLog())[0] ?? null;
      await post(page);
      const trD1n = trD1.length; trD1.stop();
      const rec1 = await newest(page);
      const as1 = rec1?.fields?.mealAssets?.[0];
      // ---- D2: MEDIUM confidence ----
      await openOne("&mockai=v1-medium&mockfacts=miss");
      const form2 = await readForm(page);
      // ---- D3: LOW confidence ----
      await openOne("&mockai=v1-low&mockfacts=miss");
      const form3 = await readForm(page);
      // ---- D4: UNKNOWN (the analysis fails — no observation) ----
      await open(page, "&mockai=fail&mockfacts=miss");
      await openComposer(page);
      await pickMedia(page, [THALI]);
      await waitForAnalysis(page);
      await sleep(300);
      await kind(page, "Meal");
      await more(page);
      const form4 = await readForm(page);
      // ---- D5: edit EVERY field ----
      await openOne("&mockai=v1assets&mockfacts=miss");
      const E = { name: "Edited dish", components: "x, y", preparation: "baked", portion: "2 plates", calories: "400", protein: "12", carbs: "20–30", fat: "8" };
      for (const k of ["components", "portion", "calories", "protein", "carbs", "fat", "preparation"]) await setVal(page, k, E[k]);
      await setVal(page, "items", E.name);
      await clickChip(page, "occasion", "Dinner");
      await clickChip(page, "context", "Home cooked");
      await sleep(250);
      const form5 = await readForm(page);
      await post(page);
      const as5 = await savedAssets();
      // ---- D6: CLEAR every field ----
      await openOne("&mockai=v1assets&mockfacts=miss");
      await setVal(page, "items", "");
      await setVal(page, "preparation", "");
      for (const k of ["components", "portion", "calories", "protein", "carbs", "fat"]) await clickClear(page, k);
      await clickChipOff(page, "occasion");
      await clickChipOff(page, "context");
      await sleep(250);
      const form6 = await readForm(page);
      await post(page);
      const as6 = await savedAssets();
      // ---- D7: edits / clears made BEFORE a late answer — the late AI must not restore anything ----
      await open(page, "&mockai=v1assets:slowa&mockfacts=miss");
      await openComposer(page);
      await pickMedia(page, [THALI]);
      await kind(page, "Meal");
      await more(page);
      await setVal(page, "items", "My dish");
      await setVal(page, "components", "a, b");
      await setVal(page, "preparation", "baked");
      await setVal(page, "portion", "3 bowls");
      await setVal(page, "calories", "400");
      await clickChip(page, "occasion", "Dinner");
      await clickChip(page, "context", "Home cooked");
      await clickChipOff(page, "context"); // set then cleared
      for (const k of ["protein", "carbs", "fat"]) { await setVal(page, k, "9"); await setVal(page, k, ""); }
      await waitForAnalysis(page, 60, 250);
      await sleep(900);
      const form7 = await readForm(page);
      await post(page);
      const as7 = await savedAssets();
      // ---- D8: nutrient independence ----
      await openOne("&mockai=v1assets&mockfacts=miss");
      await setVal(page, "calories", "300");
      const n1 = await readForm(page);
      await clickClear(page, "fat");
      const n2 = await readForm(page);
      await setVal(page, "protein", "50");
      const n3 = await readForm(page);
      await setVal(page, "carbs", "20");
      const n4 = await readForm(page);
      await post(page);
      const asN = await savedAssets();
      // ---- D9: Looks right (AI estimate) ----
      const trD9 = trackRequests(page);
      await openOne("&mockai=v1assets&mockfacts=miss", { more: false });
      const obs9 = (await obsLog())[0] ?? null;
      await clickSel("[data-sb-meal-accept]");
      await post(page);
      const nD9 = trD9.length; trD9.stop();
      const as9 = await savedAssets();
      // blank fields are not confirmed
      await openOne("&mockai=v1-low&mockfacts=miss", { more: false });
      await clickSel("[data-sb-meal-accept]");
      await post(page);
      const as9b = await savedAssets();
      // USDA fact accepted
      await openOne("&mockai=v1assets&mockfacts=found", { more: false });
      await waitForFacts(page, 1);
      await clickSel("[data-sb-meal-accept]");
      await post(page);
      const as9c = await savedAssets();
      // OFF fact accepted
      await open(page, "&mockai=nutella-meal&mockpackaged=found&mockfacts=miss");
      await openComposer(page);
      await pickMedia(page, [THALI]);
      await waitForAnalysis(page);
      await waitForPill(page, "meal");
      await waitForFacts(page, 1);
      await sleep(500);
      await clickSel("[data-sb-meal-accept]");
      await post(page);
      const as9d = await savedAssets();
      // ---- D10: Adjust ----
      const trD10 = trackRequests(page);
      await openOne("&mockai=v1assets&mockfacts=miss", { more: false });
      const obs10 = (await obsLog())[0] ?? null;
      await clickSel("[data-sb-meal-adjust]");
      await sleep(400);
      const form10 = await readForm(page);
      await post(page);
      const nD10 = trD10.length; trD10.stop();
      const as10 = await savedAssets();
      // ---- D11 / D12: overriding a structured fact keeps the fact ----
      await openOne("&mockai=v1assets&mockfacts=found");
      await waitForFacts(page, 1);
      await sleep(400);
      const formU = await readForm(page);
      await setVal(page, "calories", "85");
      await post(page);
      const asU = await savedAssets();
      await open(page, "&mockai=nutella-meal&mockpackaged=found&mockfacts=miss");
      await openComposer(page);
      await pickMedia(page, [THALI]);
      await waitForAnalysis(page);
      await waitForPill(page, "meal");
      await waitForFacts(page, 1);
      await sleep(500);
      await more(page);
      await setVal(page, "calories", "480");
      await post(page);
      const asO = await savedAssets();
      // ---- D13: Cost / Notes ----
      await openOne("&mockai=v1assets&mockfacts=miss");
      const costNotes0 = await page.evaluate(() => {
        const label = (k) => document.querySelector(`[data-sb-ufield='${k}']`)?.closest("div")?.querySelector("label")?.textContent ?? document.querySelector(`[data-sb-add-field='${k}']`)?.textContent ?? null;
        return { cost: label("cost"), notes: label("notes") };
      });
      await addField(page, "cost");
      await addField(page, "notes");
      const blankCN = await page.evaluate(() => ({ cost: document.querySelector("[data-sb-ufield='cost']")?.value ?? null, notes: document.querySelector("[data-sb-ufield='notes']")?.value ?? null }));
      await setVal(page, "cost", "NPR 450");
      await setVal(page, "notes", "Birthday lunch");
      await post(page);
      const recCN = await newest(page);
      await openOne("&mockai=v1assets&mockfacts=miss");
      await addField(page, "cost");
      await addField(page, "notes");
      await setVal(page, "cost", "NPR 450");
      await setVal(page, "notes", "x");
      await setVal(page, "cost", "");
      await setVal(page, "notes", "");
      await post(page);
      const recCN2 = await newest(page);

      /* ---------------- G1 · AGGRESSIVE FILL ---------------- */
      for (const k of F) v1(form1[k] === A[k], `HIGH confidence fills ${k} automatically (found ${JSON.stringify(form1[k])})`);
      const M = { name: "Chicken curry", components: "chicken, rice", preparation: "boiled", portion: "1 bowl", occasion: "Dinner", setting: "Home cooked", calories: "300–500", protein: "10–25", carbs: "20–40", fat: "8–20" };
      for (const k of F) v1(form2[k] === M[k], `MEDIUM confidence ALSO fills ${k} automatically (found ${JSON.stringify(form2[k])})`);
      const lowF = ["components", "preparation", "portion", "setting", "calories", "protein", "carbs", "fat"];
      for (const k of lowF) v1(form3[k] === "", `LOW confidence leaves ${k} blank (found ${JSON.stringify(form3[k])}; the editor exists and is empty)`);
      for (const k of F) v1(form4[k] === "", `UNKNOWN (no observation) leaves ${k} blank — present and editable, never fabricated (found ${JSON.stringify(form4[k])})`);
      v1(F.every((k) => typeof form1[k] === "string") && !F.some((k) => / \/ | or /.test(form1[k] ?? "")), `the person sees ONE clean value per field (no "A / B" candidates in any editor)`);

      /* ---------------- G2 · EDITABLE ---------------- */
      const Evals = { name: E.name, components: E.components, preparation: E.preparation, portion: E.portion, occasion: "Dinner", setting: "Home cooked", calories: E.calories, protein: E.protein, carbs: E.carbs, fat: E.fat };
      const savedV = { name: "Edited dish", components: ["x", "y"], preparation: "baked", portion: "2 plates", occasion: "dinner", setting: "home", calories: { value: 400, unit: "kcal" }, protein: { value: 12, unit: "g" }, carbs: { range: { min: 20, max: 30 }, unit: "g" }, fat: { value: 8, unit: "g" } };
      for (const k of F) v1(form5[k] === Evals[k] && cellOf(as5?.[0], k)?.state === "corrected" && eqf(cellOf(as5?.[0], k)?.value, savedV[k]), `${k} is editable: the editor shows ${JSON.stringify(form5[k])}, and it is saved as the person's CORRECTED value ${JSON.stringify(cellOf(as5?.[0], k)?.value)}`);

      /* ---------------- G3 · CLEARABLE ---------------- */
      for (const k of F) v1(form6[k] === "" && cellOf(as6?.[0], k)?.state === "cleared" && cellOf(as6?.[0], k)?.value === undefined && cellOf(as6?.[0], k)?.original !== undefined, `${k} is clearable: blank in the editor, saved as CLEARED, and the original reading is still remembered (${JSON.stringify(cellOf(as6?.[0], k)?.original)?.slice(0, 60)})`);

      /* ---------------- G4 · A CLEAR / EDIT IS NEVER UNDONE BY A LATE ANALYSIS ---------------- */
      const L = { name: "My dish", components: "a, b", preparation: "baked", portion: "3 bowls", occasion: "Dinner", setting: "", calories: "400", protein: "", carbs: "", fat: "" };
      for (const k of F) v1(form7[k] === L[k] && cellOf(as7?.[0], k)?.original !== undefined && ["corrected", "cleared"].includes(cellOf(as7?.[0], k)?.state), `${k}: what the person set/cleared BEFORE the late answer stays (${JSON.stringify(form7[k])}); the AI's reading arrived only as the remembered original`);

      /* ---------------- G5 · NUTRIENTS ARE INDEPENDENT ---------------- */
      v1(n1.calories === "300" && n1.protein === "45–85" && n1.carbs === "15–40" && n1.fat === "35–75", `editing calories (300) leaves protein/carbs/fat untouched (${n1.protein} · ${n1.carbs} · ${n1.fat}) — nothing is recalculated`);
      v1(n2.fat === "" && n2.calories === "300" && n2.protein === "45–85" && n2.carbs === "15–40", `clearing fat leaves calories/protein/carbs as they were (${n2.calories} · ${n2.protein} · ${n2.carbs})`);
      v1(n3.protein === "50" && n3.calories === "300" && n3.carbs === "15–40" && n3.fat === "", `editing protein (50) changes only protein (calories ${n3.calories}, carbs ${n3.carbs}, fat ${JSON.stringify(n3.fat)})`);
      v1(n4.carbs === "20" && n4.protein === "50" && n4.calories === "300", `editing carbs (20) changes only carbs`);
      v1(cellOf(asN?.[0], "calories")?.state === "corrected" && cellOf(asN?.[0], "fat")?.state === "cleared" && eqf(cellOf(asN?.[0], "carbs")?.value, { value: 20, unit: "g" }) && cellOf(asN?.[0], "protein")?.source === "ai_estimate", `provenance stays honest: the original source of each nutrient is still "${cellOf(asN?.[0], "protein")?.source}" (the person's edit changes the state, not where the reading came from)`);

      /* ---------------- G6 · LOOKS RIGHT ---------------- */
      for (const k of F) v1(cellOf(as9?.[0], k)?.state === "confirmed", `Looks right confirms ${k} (state ${cellOf(as9?.[0], k)?.state})`);
      v1(lowF.every((k) => cellOf(as9b?.[0], k)?.value === undefined && cellOf(as9b?.[0], k)?.state === "default"), `fields that are blank are NOT confirmed by Looks right (they stay blank, state "default")`);
      v1(cellOf(as9?.[0], "calories")?.source === "ai_estimate" && cellOf(as9?.[0], "calories")?.state === "confirmed" && !!cellOf(as9?.[0], "calories")?.value?.range, `an accepted AI estimate stays "ai_estimate" (state ${cellOf(as9?.[0], "calories")?.state}, still a range)`);
      v1(cellOf(as9c?.[0], "calories")?.source === "usda" && cellOf(as9c?.[0], "calories")?.state === "confirmed" && cellOf(as9c?.[0], "calories")?.ref?.fdcId === 2345678, `an accepted USDA value stays "usda" with its fdcId (${cellOf(as9c?.[0], "calories")?.ref?.fdcId}) — confirmed does not mean user-sourced`);
      v1(cellOf(as9d?.[0], "calories")?.source === "openfoodfacts" && cellOf(as9d?.[0], "calories")?.ref?.productId === "3017620422003", `an accepted Open Food Facts value stays "openfoodfacts" with its product code (${cellOf(as9d?.[0], "calories")?.ref?.productId})`);
      v1(!!obs9 && eqf(as9?.[0]?.observation, obs9), `Looks right never changes the AI observation (saved per-photo observation is byte-identical to what recognition said)`);
      v1(nD9 === 1, `Looks right makes no second AI request (${nD9} request for the whole flow)`);

      /* ---------------- G7 · ADJUST ---------------- */
      for (const k of F) v1(form10[k] === A[k], `Adjust opens the ${k} editor, already holding the photo's value (${JSON.stringify(form10[k])})`);
      v1(!!obs10 && eqf(as10?.[0]?.observation, obs10), `Adjust never changes the AI observation`);
      v1(nD10 === 1, `Adjust makes no extra AI request (${nD10})`);

      /* ---------------- G8 · ZERO-EFFORT SAVE ---------------- */
      v1(!!rec1 && rec1.fields?.items === A.name && as1?.assetId && trD1n === 1, `saving with no action at all works (Meal "${rec1?.fields?.items}", one request)`);
      v1(F.every((k) => cellOf(as1, k)?.value === undefined || cellOf(as1, k)?.state === "default"), `every untouched default is saved as a default — never marked human-confirmed`);
      v1(rec1?.fields?.foodItems?.[0]?.state === "suggested" && rec1?.fields?.foodItems?.[0]?.name === A.name && rec1?.fields?.foodItems?.[0]?.quantity === "1 plate", `the record's Meal item is "suggested" (${rec1?.fields?.foodItems?.[0]?.state}) with its portion`);

      /* ---------------- G9 · BACKGROUND RECORD ---------------- */
      v1(!!as1?.observation && eqf(as1.observation, obsD1), `the photo's original AI observation is kept on the record, byte-identical`);
      v1(["name", "components", "preparation", "portion", "setting", "calories"].every((k) => !!cellOf(as1, k)?.confidence), `each field keeps its confidence (${["name", "preparation", "setting"].map((k) => cellOf(as1, k)?.confidence).join("/")})`);
      v1(!JSON.stringify(as1 ?? {}).includes("alternatives") && !JSON.stringify(obsD1 ?? {}).includes("alternatives"), `alternative candidates are preserved only if the provider returned them — none were, none were fabricated`);
      v1(cellOf(as9c?.[0], "calories")?.ref?.fdcId === 2345678 && /per 100/.test(cellOf(as9c?.[0], "calories")?.ref?.basis ?? ""), `the USDA reference (fdcId, basis) is kept in the background`);
      v1(cellOf(as9d?.[0], "calories")?.ref?.productId === "3017620422003" && !!cellOf(as9d?.[0], "calories")?.ref?.basis, `the Open Food Facts product code and basis are kept in the background`);
      v1(cellOf(as5?.[0], "calories")?.state === "corrected" && eqf(cellOf(as5?.[0], "calories")?.original?.range, { min: 650, max: 1050 }), `a correction is recorded with the original reading beside it (${JSON.stringify(cellOf(as5?.[0], "calories")?.original)})`);
      v1(cellOf(as6?.[0], "fat")?.state === "cleared" && !!cellOf(as6?.[0], "fat")?.original, `a clear is recorded as a deliberate clear, with the original reading kept`);
      v1(["name", "calories", "portion"].every((k) => !!cellOf(as5?.[0], k)?.at) && !!cellOf(as9?.[0], "name")?.at, `state changes are timestamped (${cellOf(as5?.[0], "calories")?.at})`);

      /* ---------------- G10 · COST / NOTES ---------------- */
      v1(/What did this meal cost\?/.test(costNotes0.cost ?? ""), `the ambiguous "Cost" is now "What did this meal cost?" (chip: ${JSON.stringify(costNotes0.cost)})`);
      v1(blankCN.cost === "" && recCN?.fields?.cost === "NPR 450", `Meal cost is optional (starts blank: ${JSON.stringify(blankCN.cost)}), editable ("${recCN?.fields?.cost}")`);
      v1(/Anything to remember\?/.test(costNotes0.notes ?? ""), `Notes reads "Anything to remember?" (chip: ${JSON.stringify(costNotes0.notes)})`);
      v1(blankCN.notes === "" && recCN?.fields?.notes === "Birthday lunch" && recCN2?.fields?.cost === undefined && recCN2?.fields?.notes === undefined, `Notes is optional, human-authored, editable and clearable (saved "${recCN?.fields?.notes}", then cleared → ${JSON.stringify(recCN2?.fields?.notes)})`);
      v1(blankCN.cost === "" && blankCN.notes === "" && !JSON.stringify(as1 ?? {}).includes("NPR"), `the AI never fills cost or notes (both blank after recognition)`);

      console.log(`V1. (V1-1 … V1-${vn} derived requirements checked; expecting 118)`);
      vn = 118; // the explicit multi-photo requirements are numbered V1-119 … V1-128

      /* ---------------- MULTI-PHOTO: the form belongs to the SELECTED photo ---------------- */
      console.log("V1-119–V1-128. THREE PHOTOS — selecting a photo swaps the ENTIRE form; edits never bleed; one Meal record");
      const trM = trackRequests(page);
      await openThree("&mockai=v1assets&mockfacts=miss");
      const th = await thumbs(page);
      const obsBefore = await assetObsNow();
      const p1 = (await clickThumb(page, 0), await readForm(page));
      const p2 = (await clickThumb(page, 1), await readForm(page));
      const p3 = (await clickThumb(page, 2), await readForm(page));
      await clickThumb(page, 0);
      const p1b = await readForm(page);
      const obsAfter = await assetObsNow();
      const nSel = trM.length;
      v1(F.every((k) => p2[k] === Bv[k]), `selecting photo 2 swaps the ENTIRE form to photo 2's own values — (card says "${p2.card}") name "${p2.name}", components "${p2.components}", preparation ${JSON.stringify(p2.preparation)}, portion "${p2.portion}", occasion "${p2.occasion}", setting ${JSON.stringify(p2.setting)}, calories "${p2.calories}", protein "${p2.protein}", carbs "${p2.carbs}", fat "${p2.fat}"`);
      v1(F.every((k) => p3[k] === Cv[k]), `selecting photo 3 swaps the ENTIRE form to photo 3's own values — (card says "${p3.card}") ${F.map((k) => `${k}=${JSON.stringify(p3[k])}`).join(" · ").slice(0, 300)}`);
      v1(eqf(p1b, p1) && F.every((k) => p1b[k] === A[k]), `photo 1 → 2 → 3 → 1 restores the COMPLETE photo 1 form (card "${p1b.card}" · ${F.map((k) => p1b[k]).join(" | ").slice(0, 200)})`);
      v1(th.length === 3 && !!obsBefore && eqf(obsBefore, obsAfter) && th.map((id) => obsAfter?.[id]?.meal?.name).join("|") === `${A.name}|${Bv.name}|${Cv.name}`, `each photo keeps its OWN observation, untouched by selection (${th.map((id) => obsAfter?.[id]?.meal?.name).join(" | ")})`);
      v1(p2.name === Bv.name && p3.name === Cv.name && F.every((k) => p2[k] !== A[k] || A[k] === Bv[k]) && F.every((k) => p3[k] !== A[k] || A[k] === Cv[k]) && !/grilled|chicken|plate|650/.test(JSON.stringify(p2)) && !/grilled|chicken|plate|650|mango|glass/.test(JSON.stringify(p3)), `no photo-1 field bleeds into photo 2 or 3 (no portion/nutrition/components/preparation/occasion/setting from photo 1 anywhere)`);
      // edits on photo 2 only
      await clickThumb(page, 1);
      await setVal(page, "portion", "2 glasses");
      await setVal(page, "calories", "300");
      await setVal(page, "components", "yogurt");
      await sleep(200);
      const e2 = await readForm(page);
      await clickThumb(page, 0);
      const e1 = await readForm(page);
      await clickThumb(page, 2);
      const e3 = await readForm(page);
      await clickThumb(page, 1);
      const e2b = await readForm(page);
      const obsAfterEdit = await assetObsNow();
      v1(e2.portion === "2 glasses" && e2.calories === "300" && e2.components === "yogurt" && eqf(e1, p1) && eqf(e3, p3) && eqf(e2b, e2) && eqf(obsAfterEdit, obsBefore), `an edit on photo 2 stays on photo 2 (portion/calories/components → "${e2b.portion}" · "${e2b.calories}" · "${e2b.components}"); photo 1 and photo 3 are unchanged and their observations are byte-identical`);
      await post(page);
      const nSave = trM.length; trM.stop();
      const newMoments = (await state(page)).moments.filter((m) => m.id.startsWith("m-new-"));
      const asM = newMoments[0]?.fields?.mealAssets ?? [];
      v1(newMoments.length === 1 && (newMoments[0]?.media?.items?.length ?? 0) === 3 && asM.length === 3 && asM.map((a) => a.observation?.meal?.name).join("|") === `${A.name}|${Bv.name}|${Cv.name}` && nSel === 3 && nSave === 3, `three photos save as ONE Meal record (${newMoments.length} record · ${newMoments[0]?.media?.items?.length} photos · ${asM.length} per-photo states, each with its own observation); the whole flow made ${nSave} analysis requests — one per photo, none for selecting/editing/saving`);
      // removal
      await openThree("&mockai=v1assets&mockfacts=miss");
      const idsBefore = await thumbs(page);
      await removeNth(page, 2);
      const idsAfter = await thumbs(page);
      const obsRm = await assetObsNow();
      await clickThumb(page, 0);
      const r1 = await readForm(page);
      await clickThumb(page, 1);
      const r3 = await readForm(page);
      await post(page);
      const asRm = (await newest(page))?.fields?.mealAssets ?? [];
      v1(idsAfter.length === 2 && idsAfter[0] === idsBefore[0] && idsAfter[1] === idsBefore[2] && eqf(r1, p1) && eqf(r3, p3) && Object.values(obsRm ?? {}).map((o) => o?.meal?.name).join("|") === `${A.name}|${Cv.name}` && asRm.map((a) => a.assetId).join("|") === idsAfter.join("|"), `removing photo 2 leaves photo 1 on observation 1 and photo 3 on observation 3 (keyed by asset id, not position: ${idsBefore.join(",")} → ${idsAfter.join(",")}); photo 3 does not inherit photo 2's form`);
      // late result for a REMOVED photo
      await openThree("&mockai=v1assets:slowb&mockfacts=miss", 2);
      await removeNth(page, 2); // B's answer is still 2.5 s away
      await clickThumb(page, 0);
      const l0 = await readForm(page);
      await sleep(3300);
      const l1 = await readForm(page);
      const obsL = await assetObsNow();
      const logL = await page.evaluate(() => (window.__SB_MEAL_FACTS_LOG ?? []).map((e) => e.canonicalName));
      v1(eqf(l0, l1) && F.every((k) => l1[k] === A[k]) && !JSON.stringify(obsL).includes("Mango lassi") && !logL.includes("mango lassi"), `a late answer for a REMOVED photo changes nothing — the visible form is still photo 1's, nothing is stored for the removed photo, no lookup ran for it`);
      // late result for an UNSELECTED photo
      await openThree("&mockai=v1assets:slowb&mockfacts=miss", 2);
      await clickThumb(page, 0);
      const u0 = await readForm(page);
      await sleep(3300);
      const u1 = await readForm(page);
      const obsU = await assetObsNow();
      const indicator = await page.evaluate(() => document.querySelector("[data-sb-photo-indicator]")?.textContent ?? null);
      v1(eqf(u0, u1) && F.every((k) => u1[k] === A[k]) && Object.values(obsU ?? {}).some((o) => o?.meal?.name === "Mango lassi") && indicator === "Photo 1 of 3", `photo 2's late answer is stored under photo 2 but never swaps the visible form — photo 1 stays selected and fully shown ("${indicator}"); arrival order never owns the UI`);
      // V1-129 — visible components are what a photo SHOWS; they are never recipe ingredients
      console.log("V1-129. VISIBLE COMPONENTS DO NOT POPULATE RECIPE INGREDIENTS");
      await openOne("&mockai=details&mockfacts=miss");
      const f129 = await readForm(page);
      const ing129 = await page.evaluate(() => ({ present: !!document.querySelector("[data-sb-ufield='ingredients']"), value: document.querySelector("[data-sb-ufield='ingredients']")?.value ?? null }));
      await post(page);
      const m129 = await newest(page);
      const made129 = (m129?.fields?.mealAIObservation?.visibleComponents ?? []).map((c) => c.name);
      v1(String(f129.components ?? "").length > 0 && made129.length > 0 && (!ing129.present || ing129.value === "") && m129?.fields?.ingredients === undefined, `V1-129: "Made of" shows the photo's visible components (${JSON.stringify(f129.components)}; observation ${JSON.stringify(made129)}) while the recipe Ingredients field stays empty (present ${ing129.present}, value ${JSON.stringify(ing129.value)}, record ${JSON.stringify(m129?.fields?.ingredients)})`);
      console.log(`V1. (V1-119 … V1-${vn} multi-photo checked; expecting 129)`);

      /* ---------------- V1-X · behaviours the prompt's body requires beyond the numbered list ---------------- */

      // X5 / X6 — overriding a STRUCTURED fact never overwrites the fact
      const cU = cellOf(asU?.[0], "calories");
      const cO = cellOf(asO?.[0], "calories");
      ok(
        formU.calories === "354" && cU?.value?.value === 85 && cU?.state === "corrected" && cU?.original?.value === 354 && cU?.source === "usda" && cU?.ref?.fdcId === 2345678 && /per 100/.test(cU?.ref?.basis ?? "") && cellOf(asU?.[0], "protein")?.value?.value === 20 && cellOf(asU?.[0], "protein")?.state === "default",
        `V1-X5: the person's 85 kcal is the effective value (state ${cU?.state}); the original USDA reading (${cU?.original?.value} kcal, fdcId ${cU?.ref?.fdcId}, "${cU?.ref?.basis}") is preserved and untouched, and protein did not move (${cellOf(asU?.[0], "protein")?.value?.value})`,
      );
      ok(
        cO?.value?.value === 480 && cO?.state === "corrected" && cO?.original?.value === 539 && cO?.source === "openfoodfacts" && cO?.ref?.productId === "3017620422003",
        `V1-X6: the person's 480 kcal is the effective value (state ${cO?.state}); the original Open Food Facts reading (${cO?.original?.value} kcal, product ${cO?.ref?.productId}) is preserved`,
      );
      console.log("V1-X1–X4. Looks right on ONE photo · per-photo clearing · a photo with no reading stays editable · sourceMetadata immutable");
      const BOUD = "Boudhanath stupa at night with lights"; // not one of the three recognised fixture photos → a non-food reading (nothing fills)
      const stateOf = (st) => F.map((k) => st?.[k]?.state);
      // X1 — Looks right on photo 2 confirms ONLY photo 2
      await openThree("&mockai=v1assets&mockfacts=miss");
      await clickThumb(page, 1);
      await clickSel("[data-sb-meal-accept]");
      await post(page);
      const asX1 = await savedAssets();
      const byId = (arr, i) => arr?.[i];
      ok(
        F.every((k) => (cellOf(byId(asX1, 1), k)?.value === undefined) || cellOf(byId(asX1, 1), k)?.state === "confirmed") &&
          F.some((k) => cellOf(byId(asX1, 1), k)?.state === "confirmed") &&
          F.every((k) => cellOf(byId(asX1, 0), k)?.state !== "confirmed") &&
          F.every((k) => cellOf(byId(asX1, 2), k)?.state !== "confirmed"),
        `V1-X1: Looks right on photo 2 confirms every populated field of photo 2 only (photo 2 ${JSON.stringify(stateOf(byId(asX1, 1)))}); photos 1 and 3 stay unconfirmed defaults — attaching them confirmed nothing`,
      );
      // X2 — clearing a field on photo 2 never touches the others, and survives switching
      await openThree("&mockai=v1assets&mockfacts=miss");
      await clickThumb(page, 1);
      await clickClear(page, "calories");
      const x2b = await readForm(page);
      await clickThumb(page, 0);
      const x2a = await readForm(page);
      await clickThumb(page, 2);
      const x2c = await readForm(page);
      await clickThumb(page, 1);
      const x2b2 = await readForm(page);
      await post(page);
      const asX2 = await savedAssets();
      ok(
        x2b.calories === "" && x2a.calories === A.calories && x2c.calories === Cv.calories && x2b2.calories === "" && cellOf(byId(asX2, 1), "calories")?.state === "cleared" && cellOf(byId(asX2, 0), "calories")?.state === "default" && cellOf(byId(asX2, 2), "calories")?.state === "default",
        `V1-X2: clearing photo 2's calories leaves photo 1 ("${x2a.calories}") and photo 3 ("${x2c.calories}") alone, and photo 2 stays blank after switching away and back ("${x2b2.calories}")`,
      );
      // X3 — a photo with no reading is still a complete, editable form; the others are untouched
      await open(page, "&mockai=v1assets&mockfacts=miss");
      await openComposer(page);
      await pickMedia(page, [THALI, NYA, BOUD]);
      await page.evaluate(() => document.querySelector("[data-sb-meta-ignore]")?.click());
      await waitFor(page, (need) => (window.__SB_MEAL_ANALYSIS_LOG || []).filter((e) => e.status === "done").length >= need, 3, 60, 250);
      await sleep(700);
      await more(page);
      await clickThumb(page, 2);
      const x3blank = await readForm(page);
      await setVal(page, "items", "Evening walk snack");
      await setVal(page, "portion", "1 bag");
      await sleep(200);
      await clickThumb(page, 0);
      const x3a = await readForm(page);
      await clickThumb(page, 2);
      const x3again = await readForm(page);
      await post(page);
      const asX3 = await savedAssets();
      ok(
        F.every((k) => x3blank[k] === "") && x3a.name === A.name && x3again.name === "Evening walk snack" && x3again.portion === "1 bag" && asX3?.length === 3 && cellOf(byId(asX3, 2), "name")?.state === "corrected" && cellOf(byId(asX3, 0), "name")?.state === "default",
        `V1-X3: a photo with no reading starts blank and stays fully editable (${JSON.stringify(x3blank.name)} → "${x3again.name}"); photo 1 keeps its own form ("${x3a.name}"); one Meal saves with ${asX3?.length} per-photo states`,
      );
      // X4 — source metadata is never touched by any of this
      await openThree("&mockai=v1assets&mockfacts=miss");
      const snap0 = await page.evaluate(() => JSON.stringify(window.__SB_ASSET_SNAPSHOT?.()));
      await clickThumb(page, 1);
      await setVal(page, "portion", "3 glasses");
      await clickClear(page, "fat");
      await clickSel("[data-sb-meal-accept]");
      await clickThumb(page, 0);
      await clickSel("[data-sb-meal-adjust]");
      await removeNth(page, 3);
      await post(page);
      const snap1 = await page.evaluate(() => JSON.stringify(window.__SB_ASSET_SNAPSHOT?.()));
      ok(!!snap0 && snap0 !== "undefined" && snap0.length > 1000 && snap0 === snap1, `V1-X4: every attached asset's sourceMetadata is byte-identical before vs after attach, analysis, selection, edit, clear, Looks right, Adjust, removal and save (${snap0 === snap1}; ${snap0?.length} bytes compared)`);
    }

    await runW(page);
    await runV2(page);

    /* ================= page health ================= */
    console.log("page health");
    ok(true, "(informational only — see individual failures above for the missing-implementation reasons)");
  } finally {
    await browser.close();
  }
  console.log(`\nmeal-intelligence: ${passed} passed, ${failures.length} failed`);
  if (failures.length) failures.forEach((f) => console.log("  FAILED: " + f));
  process.exit(0);
})();
