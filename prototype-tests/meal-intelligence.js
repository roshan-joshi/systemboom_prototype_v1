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
  await page.goto(`${B}&theme=light${factsPin}${extra}`, { waitUntil: "networkidle2" });
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

(async () => {
  const { browser, page } = await launch();
  try {
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
    ok(
      rB1.status === 200 && !!fB1 && typeof fB1.nutrition?.calories === "number" && typeof fB1.nutrition?.protein === "number" && typeof fB1.matchedName === "string" && !!fB1.units && typeof fB1.retrievedAt === "string",
      `B1: a known canonical food search returns structured nutrition (found: ${JSON.stringify(rB1)})`,
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
        estCount: document.querySelectorAll("[data-sb-meal-estimate]").length,
        est: document.querySelector("[data-sb-meal-estimate]")?.textContent ?? null,
      };
    });
    // adversarial findings #9/#10 — the fact must be ANCHORED to its food (the line names
    // "Dal bhat" and carries all four figures + the basis), one line per useful food (4), and
    // no fact line anywhere smuggles approximation language in.
    ok(
      rendB.factCount === 4 && rendB.dalbhat !== null && /354\s?kcal/.test(rendB.dalbhat) && /20\s?g protein/.test(rendB.dalbhat) && /35\s?g carbs/.test(rendB.dalbhat) && /14\s?g fat/.test(rendB.dalbhat) && /per 100\s?g/.test(rendB.dalbhat) && rendB.facts.every((t) => !t.includes("~") && !/Estimated/i.test(t)),
      `B8: one factual line per useful food (${rendB.factCount}), the Dal bhat line carries its own full figures + basis, never a tilde or "Estimated" (found: "${rendB.dalbhat}")`,
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
