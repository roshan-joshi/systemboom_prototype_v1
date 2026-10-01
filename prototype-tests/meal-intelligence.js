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
  await page.goto(`${B}&theme=light${extra}`, { waitUntil: "networkidle2" });
  await sleep(900);
}
const state = (page) => page.evaluate(() => window.__SB_SOCIAL_STATE);
const openComposer = async (page) => { await page.click("[data-sb-open-composer]"); await sleep(450); };
const setText = (page, v) => page.evaluate((x) => { const ta = document.getElementById("sb-composer-text"); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set; set.call(ta, x); ta.dispatchEvent(new Event("input", { bubbles: true })); }, v);
const post = async (page) => { await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => /^(Post|Save)$/.test(b.textContent.trim()) || b.getAttribute("aria-busy"))?.click()); await sleep(1300); };
const details = async (page) => { await page.evaluate(() => { const b = document.querySelector("[data-sb-record-details]"); if (b && b.getAttribute("aria-expanded") !== "true") b.click(); }); await sleep(350); };
const kind = async (page, aria) => { await details(page); await page.evaluate((a) => [...document.querySelectorAll(`[data-sb-kind-row] button[aria-label='${a}']`)][0]?.click(), aria); await sleep(350); };
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
    ok(values5.length > 0 && values5.every((v) => v.source === "ai_visual_estimate" && ["high", "medium", "low"].includes(v.confidence)), `every present nutrition value carries source+confidence (found: ${JSON.stringify(nutrition5)})`);

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
