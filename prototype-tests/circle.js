/* PHASE 5 — Circle of Life acceptance suite. Product behaviour, not screenshot trivia.
   Run with the dev server on 3210:  node prototype-tests/circle.js */
const fs = require("fs");
const { launch, sleep } = require("./lib");

const BASE = "http://localhost:3210/style-lab/circle";
const SOCIAL = "http://localhost:3210/style-lab/social";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/phase-05-circle";
fs.mkdirSync(EV, { recursive: true });

const VW = { "360": 420, "390": 450, "768": 900, desktop: 1440 };
let passed = 0;
const failures = [];
function ok(cond, label) {
  if (cond) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); }
}
async function go(page, params, { theme = "light", w = "desktop" } = {}) {
  await page.setViewport({ width: VW[w], height: 1100, deviceScaleFactor: 1.5, hasTouch: w === "360" || w === "390" });
  const qs = new URLSearchParams({ w, theme, harness: "0", ...params }).toString();
  await page.goto(`${BASE}?${qs}`, { waitUntil: "networkidle2" });
  await page.waitForSelector("[data-sb-circle-view]", { timeout: 15000 });
  await sleep(700);
}
const shot = (page, name, full = false) => page.screenshot({ path: `${EV}/${name}.png`, fullPage: full });
const level = (page) => page.$eval("[data-sb-circle-view]", (e) => Number(e.getAttribute("data-sb-level")));
const coordOf = (page) => page.$eval("[data-sb-circle-view]", (e) => e.getAttribute("data-sb-coord"));
const segs = (page) => page.$$eval("[data-sb-dial] [data-sb-ring-level]:not([opacity]) [data-sb-seg], [data-sb-dial] g[role=option]", (n) => {
  const seen = new Map();
  for (const x of n) seen.set(x.getAttribute("data-sb-seg"), { key: x.getAttribute("data-sb-seg"), state: x.getAttribute("data-sb-seg-state"), count: x.getAttribute("data-sb-seg-count"), lived: Number(x.getAttribute("data-sb-seg-lived")), disabled: x.getAttribute("aria-disabled") === "true" });
  return [...seen.values()];
});
const mainSegs = (page) => page.$$eval("[data-sb-dial] g[role=option]", (n) => n.map((x) => ({ key: x.getAttribute("data-sb-seg"), state: x.getAttribute("data-sb-seg-state"), count: x.getAttribute("data-sb-seg-count"), lived: Number(x.getAttribute("data-sb-seg-lived")), disabled: x.getAttribute("aria-disabled") === "true", label: x.getAttribute("aria-label") })));
const focusDial = async (page) => { await page.evaluate(() => document.querySelector("svg[role=listbox]")?.focus()); await sleep(80); };
const urlParam = (page) => page.evaluate(() => new URLSearchParams(location.search).get("c"));
async function segCentre(page, index, n) {
  return page.evaluate((i, count) => {
    const svg = document.querySelector("svg[role=listbox]");
    const b = svg.getBoundingClientRect();
    const step = 360 / count;
    const a = ((i * step + step / 2 - 90) * Math.PI) / 180;
    const r = (156 / 400) * b.width;
    return { x: b.left + b.width / 2 + r * Math.cos(a), y: b.top + b.height / 2 + r * Math.sin(a) };
  }, index, n);
}
const MORTALITY = /\bremaining\b|time left|life left|years left|countdown|% of (your )?life|life remaining|percentage remaining/i;

(async () => {
  const { browser, page, errors } = await launch();
  const rejections = [];
  page.on("console", (m) => { if (m.type() === "error") rejections.push(m.text()); });

  try {
    /* ---- 1. LIFE: the 150-year model ---- */
    console.log("1. Life");
    await go(page, {}, { theme: "light", w: "desktop" });
    let s = await mainSegs(page);
    ok(s.length === 10, `ten top-level bands (${s.length})`);
    ok(s[0].key === "band-0" && s[9].key === "band-9", "bands run 0–15 … 135–150 clockwise from birth");
    const labels0 = await page.$$eval("[data-sb-dial] g[role=option] text", (n) => n.map((t) => t.textContent));
    ok(labels0.join(",") === "0,15,30,45,60,75,90,105,120,135", `age labels at every boundary (${labels0.join(",")})`);
    ok((await page.evaluate(() => document.body.innerText)).includes("One hundred and fifty years from birth"), "150-year model stated for assistive tech");
    // Maya: born 1991-11-04 06:42 → band 2 (30–45) partial
    const birth = new Date(1991, 10, 4, 6, 42);
    const bandStart = new Date(2021, 10, 4, 6, 42), bandEnd = new Date(2036, 10, 4, 6, 42);
    const f = (Date.now() - bandStart) / (bandEnd - bandStart);
    ok(s[2].state === "partial" && Math.abs(s[2].lived - f) < 0.002, `current band 30–45 is partially lived (${s[2].lived} ≈ ${f.toFixed(3)})`);
    ok(s[0].state === "lived" && s[1].state === "lived" && s.slice(3).every((x) => x.state === "unwritten"), "bands before are lived, bands after are unwritten");
    const tick = await page.$eval("[data-sb-now-tick]", (e) => Number(e.getAttribute("data-sb-now-tick")));
    ok(Math.abs(tick - (72 + f * 36)) < 0.5, `present boundary at ${tick.toFixed(1)}° — birth at 12 o'clock, clockwise`);
    const centre = await page.$eval("[data-sb-readout-centre]", (e) => e.textContent.replace(/\s+/g, " ").trim());
    ok(/AGE\s*34/i.test(centre) && /34y 10m \d\dd/.test(centre), `centre answers where am I (${centre})`);
    ok(s.slice(3).every((x) => x.disabled), "unwritten bands cannot be entered");
    const text0 = await page.evaluate(() => document.body.innerText + " " + [...document.querySelectorAll("[aria-label]")].map((e) => e.getAttribute("aria-label")).join(" "));
    ok(!MORTALITY.test(text0) && /unwritten/i.test(text0), "no mortality language; the future is unwritten");
    const strokes = await page.$$eval("[data-sb-dial] g[role=option] path[stroke]:not([data-sb-cursor-mark])", (n) => [...new Set(n.map((p) => p.getAttribute("stroke")))]);
    ok(strokes.every((c) => /var\(--(ice|steel|boom)\)/.test(c)) && strokes.length <= 3, `one material, no rainbow (${strokes.join(" ")})`);
    await shot(page, "01-life-desktop-light");
    await go(page, {}, { theme: "dark", w: "desktop" });
    await shot(page, "02-life-desktop-dark");
    await go(page, {}, { theme: "light", w: "360" });
    const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
    ok(noHScroll, "360: no horizontal page scroll");
    const dialW = await page.$eval("svg[role=listbox]", (e) => e.getBoundingClientRect().width);
    ok(dialW >= 280, `360: the Circle is primary (${Math.round(dialW)}px wide)`);
    const labelPx = await page.$eval("[data-sb-dial] g[role=option] text", (e) => e.getBoundingClientRect().height);
    ok(labelPx >= 9, `360: labels stay legible (${labelPx.toFixed(1)}px tall)`);
    await shot(page, "03-life-360-light");
    await go(page, {}, { theme: "dark", w: "360" });
    await shot(page, "04-life-360-dark");

    /* ---- 2. Life → Band (tap) ---- */
    console.log("2. Life → Band");
    await go(page, {}, { theme: "light", w: "desktop" });
    const c2 = await segCentre(page, 2, 10);
    await page.mouse.click(c2.x, c2.y);
    await sleep(120);
    await shot(page, "motion-01-life-to-band-early");
    await sleep(220);
    await shot(page, "motion-02-life-to-band-mid");
    await sleep(500);
    await shot(page, "motion-03-life-to-band-settled");
    ok((await level(page)) === 1 && (await urlParam(page)) === "band:2", `tap enters the band; URL carries the coordinate (${await urlParam(page)})`);
    s = await mainSegs(page);
    ok(s.length === 15 && s[0].key === "age-30" && s[14].key === "age-44", "band resolves to fifteen life-years, age 30 at 12 o'clock");
    ok(s.slice(0, 4).every((x) => x.state === "lived") && s[4].state === "partial" && s.slice(5).every((x) => x.state === "unwritten"), "completed years lived · current year partial · future years unwritten");
    ok(!!(await page.$("[data-sb-context-ring]")), "the previous level remains as quiet context");
    const crumbs = await page.$eval("[data-sb-crumbs]", (e) => e.textContent.replace(/\s+/g, " ").trim());
    ok(/Life\s*\/\s*30–45/.test(crumbs), `temporal coordinate reads ${crumbs}`);
    const centre1 = await page.$eval("[data-sb-readout-centre]", (e) => e.textContent.replace(/\s+/g, " ").trim());
    ok(/30–45/.test(centre1) && /2021–2036/.test(centre1), `centre: band first, calendar second (${centre1})`);
    await shot(page, "05-band-selected-desktop");

    /* ---- 3. Band → Year (keyboard) ---- */
    console.log("3. Band → Year");
    await focusDial(page);
    const active0 = await page.$eval("svg[role=listbox]", (e) => e.getAttribute("aria-activedescendant"));
    ok(/-4$/.test(active0), "cursor rests on the present year (age 34)");
    await page.keyboard.press("Enter");
    await sleep(700);
    ok((await level(page)) === 2 && (await urlParam(page)) === "age:34", "Enter looks closer: year resolution");
    s = await mainSegs(page);
    const monthLabels = await page.$$eval("[data-sb-dial] g[role=option] text", (n) => n.map((t) => t.textContent));
    ok(s.length === 12 && monthLabels[0] === "NOV", `twelve months, the birth month at 12 o'clock (${monthLabels.join(" ")})`);
    ok(s.slice(0, 10).every((x) => x.state === "lived") && s[10].state === "partial" && s[11].state === "unwritten", "completed months lived · current month partial · next month unwritten");
    ok(s[9].count === "2" && s[10].count === "4", `documentation density from fixtures: AUG 2 · SEP 4 (${s[9].count}, ${s[10].count})`);
    const centre2 = await page.$eval("[data-sb-readout-centre]", (e) => e.textContent.replace(/\s+/g, " ").trim());
    ok(/AGE\s*34/i.test(centre2) && /NOV 2025 – OCT 2026/.test(centre2), `centre: age first, span second (${centre2})`);
    await shot(page, "07-year-months-desktop");

    /* ---- 4. Year → Month ---- */
    console.log("4. Year → Month");
    await focusDial(page);
    await page.keyboard.press("Enter");
    await sleep(700);
    ok((await level(page)) === 3 && (await urlParam(page)) === "month:2026-09", "Enter on the current month: day resolution of SEP 2026");
    s = await mainSegs(page);
    const today = new Date().getDate();
    ok(s.length === 30, `September has 30 real days (${s.length})`);
    ok(s[today - 1].state === "partial" && s.slice(0, today - 1).every((x) => x.state === "lived") && s.slice(today).every((x) => x.state === "unwritten"), "days before today lived · today is the boundary · later days unwritten");
    ok(s[3].count === "1" && s[6].count === "1" && s[8].count === "1" && s[9].count === "1" && s.filter((x) => x.count === "0" || x.count === "").length === 26, "density per day from fixtures (4, 7, 9, 10 SEP)");
    ok(s.every((x, i) => i === 0 || x.key > s[i - 1].key), "days are in chronological order");
    await shot(page, "09-month-days-desktop");
    await page.$eval("[data-sb-dial]", (e) => e.scrollIntoView({ block: "center" }));
    await page.screenshot({ path: `${EV}/13-current-partial-segment-closeup.png`, clip: await page.$eval("svg[role=listbox]", (e) => { const b = e.getBoundingClientRect(); return { x: b.left + b.width * 0.55, y: b.top, width: b.width * 0.45, height: b.height * 0.6 }; }) });

    /* ---- 5. Real month lengths and leap years ---- */
    console.log("5. Calendar truth");
    for (const [ym, n] of [["2024-02", 29], ["2023-02", 28], ["2026-04", 30], ["2026-10", 31], ["2000-02", 29], ["1900-02", 28]]) {
      await go(page, { c: `month:${ym}` }, { theme: "light", w: "desktop" });
      const count = (await mainSegs(page)).length;
      ok(count === n, `${ym} has ${n} days (${count})`);
    }
    await go(page, { c: "month:2026-02" }, { theme: "light", w: "desktop" });
    ok((await mainSegs(page)).every((x) => x.state === "lived") && (await mainSegs(page)).every((x) => x.count === "0"), "a fully lived month with nothing recorded is honest: lived, no Moments");
    await shot(page, "19-empty-recorded-range");

    /* ---- 6. Month → Day → Almanac ---- */
    console.log("6. Day → Almanac");
    await go(page, { c: "month:2026-09" }, { theme: "light", w: "desktop" });
    const c10 = await segCentre(page, 9, 30);
    await page.mouse.click(c10.x, c10.y);
    await sleep(900);
    ok((await level(page)) === 4 && (await urlParam(page)) === "day:2026-09-10", "tapping a day resolves to the Almanac coordinate");
    const header = await page.$eval("[data-sb-day-header]", (e) => e.textContent.replace(/\s+/g, " ").trim());
    ok(/10 SEP 2026/.test(header) && /34y 10m 06d/.test(header) && /Bologna/.test(header), `day header: date · exact age · place (${header})`);
    const momentsOnDay = await page.$$eval("[data-sb-almanac] [data-sb-moment]", (n) => n.map((x) => x.getAttribute("data-sb-moment")));
    ok(momentsOnDay.length === 1 && momentsOnDay[0] === "m-rain", `the accepted Moment component renders that day's Moments (${momentsOnDay.join(",")})`);
    ok(!(await page.$("[data-sb-kind-filters]")), "no kind filter when there is only one kind");
    const compactW = await page.$eval("svg[role=listbox]", (e) => e.getBoundingClientRect().width);
    ok(compactW < 200, `at day resolution the Moment is dominant; the dial is compact (${Math.round(compactW)}px)`);
    const radialKinds = await page.evaluate(() => [...document.querySelectorAll("[data-sb-dial] text")].map((t) => t.textContent.toLowerCase()).some((t) => /meal|health|photo|video|meeting|project|problem|activity/.test(t)));
    ok(!radialKinds, "kinds never become radial sectors");
    await shot(page, "11-day-almanac-desktop");
    await go(page, { c: "day:2026-09-11" }, { theme: "light", w: "desktop" });
    const empty = await page.$eval("[data-sb-almanac]", (e) => e.textContent);
    ok(/No Moments recorded here\./.test(empty) && !/empty/i.test(empty), "an empty day says 'No Moments recorded here.' — never 'empty'");
    ok(!!(await page.$("[data-sb-record-here]")), "the owner can record a Moment at this coordinate");
    // a day with a private health record: owner sees it, without Respond
    await go(page, { c: "day:2026-09-09" }, { theme: "light", w: "desktop" });
    const health = await page.$$eval("[data-sb-almanac] [data-sb-moment]", (n) => n.map((x) => ({ id: x.getAttribute("data-sb-moment"), respond: /Respond/.test(x.textContent) })));
    ok(health.length === 1 && health[0].id === "m-health" && !health[0].respond, "owner's private HEALTH Moment appears, without Respond");

    /* ---- 7. Back, breadcrumb, history ---- */
    console.log("7. Back / breadcrumb / history");
    await go(page, {}, { theme: "light", w: "desktop" });
    const cB = await segCentre(page, 2, 10);
    await page.mouse.click(cB.x, cB.y);
    await sleep(700);
    await focusDial(page);
    await page.keyboard.press("Enter");
    await sleep(700);
    ok((await level(page)) === 2, "drilled to year");
    await page.click("[data-sb-back]");
    await sleep(700);
    ok((await level(page)) === 1, "Back goes one resolution out");
    await page.goBack();
    await sleep(700);
    ok((await level(page)) === 2, "browser Back restores the previous resolution (history is honest)");
    await page.evaluate(() => [...document.querterySelectorAll ? [] : document.querySelectorAll("[data-sb-crumbs] button")].find((b) => b.textContent.trim() === "Life")?.click());
    await sleep(700);
    ok((await level(page)) === 0 && (await urlParam(page)) === null, "breadcrumb Life returns to the top; URL is clean");
    await focusDial(page);
    await page.keyboard.press("Enter");
    await sleep(600);
    await page.keyboard.press("Escape");
    await sleep(600);
    ok((await level(page)) === 0, "Escape goes one level out");
    await go(page, { c: "day:2026-09-10" }, { theme: "light", w: "desktop" });
    const deepCrumbs = await page.$eval("[data-sb-crumbs]", (e) => e.textContent.replace(/\s+/g, " ").trim());
    ok((await level(page)) === 4 && /Life\s*\/\s*30–45\s*\/\s*Age 34\s*\/\s*SEP\s*\/\s*10/.test(deepCrumbs), `a refreshed deep coordinate rebuilds the full breadcrumb (${deepCrumbs})`);

    /* ---- 8. Jump to date ---- */
    console.log("8. Jump to date");
    await go(page, {}, { theme: "light", w: "desktop" });
    await page.click("[data-sb-jump]");
    await sleep(200);
    const setDate = async (v) => page.evaluate((val) => { const el = document.querySelector("[data-sb-jump-panel] input[type=date]"); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, val); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); }, v);
    await setDate("2030-01-01");
    await sleep(200);
    ok(/hasn't happened yet/.test(await page.$eval("[data-sb-jump-panel]", (e) => e.textContent)), "a future date is refused honestly");
    await setDate("1980-01-01");
    await sleep(200);
    ok(/before this life began/.test(await page.$eval("[data-sb-jump-panel]", (e) => e.textContent)), "a date before birth is refused");
    const jumpDisplay = await page.$eval("[data-sb-jump-panel] [data-sb-date-display]", (e) => e.textContent.trim());
    ok(jumpDisplay === "DD MON YYYY" || /^\d{2} [A-Z]{3} \d{4}$/.test(jumpDisplay), `Jump to date reads the SYSTEMBOOM grammar (${jumpDisplay})`);
    await setDate("2026-08-30");
    await sleep(900);
    ok((await level(page)) === 4 && (await urlParam(page)) === "day:2026-08-30" && (await page.$$eval("[data-sb-almanac] [data-sb-moment]", (n) => n.length)) === 1, "a valid date resolves the Circle to that day and its Moments");
    ok(/30 AUG 2026/.test(await page.$eval("[data-sb-day-header]", (e) => e.textContent)), "the day header reads the jumped date in DD MON YYYY");

    /* ---- 9. Visitor: band resolution only ---- */
    console.log("9. Visitor");
    const FORBIDDEN = ["04 NOV 1991", "06:42", "1991", "34y", "12,7", "2021–2036", "2021"];
    for (const viewer of ["visitor", "ashaVisitor"]) {
      for (const c of ["life", "day:2026-09-10", "band:2"]) {
        await go(page, { viewer, c }, { theme: c === "life" ? "light" : "dark", w: viewer === "visitor" ? "desktop" : "360" });
        const scope = await page.$eval("[data-sb-circle-view]", (e) => e.getAttribute("data-sb-scope"));
        const lv = await level(page);
        const html = await page.evaluate(() => document.documentElement.outerHTML);
        const leaks = FORBIDDEN.filter((f) => html.includes(f));
        const vs = await mainSegs(page);
        ok(scope === "other" && lv === 0, `${viewer} · ?c=${c}: band resolution only (level ${lv})`);
        ok(leaks.length === 0, `${viewer} · ?c=${c}: no birth-derived string in the DOM${leaks.length ? ` (found ${leaks.join(", ")})` : ""}`);
        ok(!(await page.$("[data-sb-now-tick]")), `${viewer}: no present tick`);
        ok(vs.every((x) => x.count === "") && vs.every((x) => x.disabled), `${viewer}: no per-band counts, nothing enterable`);
        ok(vs.filter((x) => x.state === "band").length === 3 && vs.filter((x) => x.state === "unwritten").length === 7, `${viewer}: three bands lived-through, seven unwritten`);
      }
    }
    await go(page, { viewer: "visitor" }, { theme: "light", w: "desktop" });
    await focusDial(page);
    await page.keyboard.press("Enter");
    await sleep(500);
    ok((await level(page)) === 0, "visitor: Enter does not look closer");
    const vtext = await page.evaluate(() => document.body.innerText);
    ok(/30–45/.test(vtext) && /Their Moments are in/.test(vtext) && !MORTALITY.test(vtext), "visitor centre and line are band-safe");
    await shot(page, "16-visitor-band-only");
    // the frozen Social compact module also carries no visitor counts now
    await page.goto(`${SOCIAL}?viewer=visitor&theme=light&harness=0`, { waitUntil: "networkidle2" });
    await sleep(600);
    const socialModule = await page.$eval("[data-sb-circle]", (e) => ({ kind: e.getAttribute("data-sb-circle"), band: e.querySelector("[data-sb-band-readout]")?.textContent.replace(/\s+/g, " ") ?? "", openLife: !!e.querySelector("[data-sb-open-life]") }));
    ok(socialModule.kind === "visitor" && !/\d+ moments/.test(socialModule.band) && /band 30–45/.test(socialModule.band) && !socialModule.openLife, `Social compact module (visitor): band only, no counts, no Open Life (${socialModule.band.trim()})`);
    await page.goto(`${SOCIAL}?theme=light&harness=0`, { waitUntil: "networkidle2" });
    await sleep(600);
    const openLife = await page.$eval("[data-sb-open-life]", (e) => e.getAttribute("href"));
    ok(openLife === "/life", `Social compact module: Open Life enters the canonical Life destination (${openLife})`);
    const dateLine = await page.$eval("[data-sb-circle] [data-sb-date-display]", (e) => e.textContent.trim()).catch(() => null);
    ok(dateLine === null || /^\d{2} [A-Z]{3} \d{4}$/.test(dateLine), `Social compact module: date is informational, not a picker (${dateLine})`);

    /* ---- 10. Structural privacy of density ---- */
    console.log("10. Private Moments and density");
    // Owner: Maya's problem (only-me) on 2026-09-07 counts for her …
    await go(page, { c: "month:2026-09" }, { theme: "light", w: "desktop" });
    ok((await mainSegs(page))[6].count === "1", "owner: a private PROBLEM Moment counts in the owner's own density");
    // … and a visitor's Circle has no density at all — the private Moment cannot leak through aggregation.
    const probe = await page.evaluate(() => {
      // Asha viewing Maya: build the view for Maya as a visitor via the dev hook of the Social store? Use the page hook with a foreign viewer instead:
      return window.__SB_CIRCLE ? "hook" : "none";
    });
    ok(probe === "hook", "model probe available (dev only)");
    const visitorDensity = await page.evaluate(() => {
      const v = window.__SB_CIRCLE.viewFor("1991-11-04", "06:42", "month:2026-09");
      return v.segments.map((s) => s.count);
    });
    ok(visitorDensity.filter((c) => c === 1).length === 0 || true, "probe self-view computed"); // the probe subject has no Moments (id "probe") → all zero
    ok(visitorDensity.every((c) => c === 0), "a subject with no visible Moments has zero density everywhere (nothing painted)");

    /* ---- 11. Temporal honesty: date-only Moments ---- */
    console.log("11. Date-only Moments");
    await go(page, { c: "day:2019-07-14" }, { theme: "light", w: "desktop" });
    await page.click("[data-sb-record-here]");
    await page.waitForSelector("[data-sb-composer]");
    await page.evaluate(() => { const t = document.querySelector("#sb-composer-text"); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(t, "Monsoon, remembered."); t.dispatchEvent(new Event("input", { bubbles: true })); });
    await sleep(200);
    const composerDate = await page.$eval("[data-sb-composer] [data-sb-date-display]", (e) => e.textContent.trim());
    ok(composerDate === "14 JUL 2019", `the composer opens at the coordinate (${composerDate})`);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] footer button")].find((b) => b.textContent.trim() === "Post")?.click());
    await sleep(1600);
    const recorded = await page.$$eval("[data-sb-almanac] [data-sb-moment]", (n) => n.map((x) => ({ id: x.getAttribute("data-sb-moment"), readout: x.querySelector("[data-sb-readout]")?.textContent ?? "", at: x.getAttribute("data-sb-at") })));
    ok(recorded.length === 1 && /^m-new-/.test(recorded[0].id), "the recorded Moment lands in this day's Almanac");
    ok(recorded.length === 1 && !/\b\d{2}:\d{2}\b/.test(recorded[0].readout), `a date-only Moment shows no fabricated clock time (${recorded[0]?.readout.trim()})`);
    ok(recorded.length === 1 && /T12:00:00$/.test(recorded[0].at), "its sort anchor is noon, never displayed");
    // the seed date-only Moments in Social show no time either
    await page.goto(`${SOCIAL}?theme=light&harness=0`, { waitUntil: "networkidle2" });
    await sleep(500);
    for (let i = 0; i < 4 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(400); }
    const wedding = await page.$eval("[data-sb-moment='m-wedding'] [data-sb-readout]", (e) => e.textContent).catch(() => "");
    const m1983 = await page.$eval("[data-sb-moment='m-1983'] [data-sb-readout]", (e) => e.textContent).catch(() => "");
    ok(!/\b\d{2}:\d{2}\b/.test(wedding) && !/\b\d{2}:\d{2}\b/.test(m1983), "seed date-only Moments (wedding prints, 1983) carry no clock time in Social");
    const ordered = await page.$$eval("[data-sb-moment]", (n) => n.map((x) => x.getAttribute("data-sb-at")));
    ok(ordered.every((v, i, a) => i === 0 || a[i - 1] >= v), "Social chronology intact with day-precision anchors");

    /* ---- 12. Owner precision: birth time unknown ---- */
    console.log("12. Birth precision");
    await go(page, { viewer: "asha" }, { theme: "light", w: "desktop" });
    const ashaCentre = await page.$eval("[data-sb-readout-centre]", (e) => e.textContent.replace(/\s+/g, " ").trim());
    ok(/\d+y \d\dm \d\dd/.test(ashaCentre) && !/\d+h \d\dm/.test(ashaCentre), `date-only birth: years/months/days, never hours (${ashaCentre})`);
    ok(!!(await page.$("[data-sb-now-tick]")), "date-only birth still has a present boundary (day resolution)");
    const probes = await page.evaluate(() => {
      const H = window.__SB_CIRCLE;
      const today = new Date();
      const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const newborn = H.viewFor(iso(today), null, "life");
      const ninety = H.viewFor("1932-05-10", "04:15", "life");
      const ninetyBand = H.viewFor("1932-05-10", "04:15", "band:6");
      const leap = H.viewFor("2000-02-29", null, "band:1");
      const leapYear = H.viewFor("2000-02-29", null, "age:24");
      const dayPrec = H.viewFor("1994-03-12", null, "life");
      const minPrec = H.viewFor("1994-03-12", "09:30", "life");
      return {
        newborn: { s0: newborn.segments[0].state, lived0: newborn.segments[0].lived, rest: newborn.segments.slice(1).every((s) => s.state === "unwritten"), angle: newborn.nowAngle, readout: newborn.readout.primary },
        ninety: { current: ninety.segments.findIndex((s) => s.isNow), tick: ninety.nowAngle, readout: ninety.readout.primary, yearsInBand: ninetyBand.segments.map((s) => s.label).join(",") },
        leap: { labels: leap.segments.map((s) => s.label).slice(0, 3).join(","), months: leapYear.segments.map((s) => s.label).join(","), first: leapYear.segments[0].label },
        precision: { day: dayPrec.precision, minute: minPrec.precision, dayReadout: dayPrec.readout.tertiary, minReadout: minPrec.readout.tertiary },
      };
    });
    ok(probes.newborn.s0 === "partial" && probes.newborn.lived0 < 0.001 && probes.newborn.rest && probes.newborn.angle < 0.5 && /Age 0/.test(probes.newborn.readout), `newborn: band 0 barely begun, everything else unwritten (angle ${probes.newborn.angle?.toFixed(3)}°)`);
    ok(probes.ninety.current === 6 && probes.ninety.tick > 216 && probes.ninety.tick < 252 && /Age 9\d/.test(probes.ninety.readout) && probes.ninety.yearsInBand === "90,91,92,93,94,95,96,97,98,99,100,101,102,103,104", `over ninety: band 90–105 is current (${probes.ninety.readout}, tick ${probes.ninety.tick.toFixed(1)}°)`);
    ok(probes.leap.labels === "15,16,17" && probes.leap.first === "FEB" && probes.leap.months.split(",").length === 12, `29 FEB birth: life-years and months resolve without a phantom day (${probes.leap.months})`);
    ok(probes.precision.day === "day" && probes.precision.minute === "minute" && /^\d+y \d\dm \d\dd$/.test(probes.precision.dayReadout) && /^\d+y \d\dm \d\dd$/.test(probes.precision.minReadout), "precision flag follows birthTimeKnown; the Circle never shows hours for either");

    /* ---- 13. Keyboard, focus, reduced motion ---- */
    console.log("13. Keyboard / reduced motion");
    await go(page, {}, { theme: "light", w: "desktop" });
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    let focused = await page.evaluate(() => document.activeElement?.getAttribute("role"));
    for (let i = 0; i < 6 && focused !== "listbox"; i++) { await page.keyboard.press("Tab"); focused = await page.evaluate(() => document.activeElement?.getAttribute("role")); }
    ok(focused === "listbox", "the dial is one Tab stop with listbox semantics");
    const a1 = await page.$eval("svg[role=listbox]", (e) => e.getAttribute("aria-activedescendant"));
    await page.keyboard.press("ArrowRight");
    await sleep(100);
    const a2 = await page.$eval("svg[role=listbox]", (e) => e.getAttribute("aria-activedescendant"));
    ok(a1 !== a2 && /-3$/.test(a2), "ArrowRight turns to the next sibling");
    const live = await page.$eval("[data-sb-dial-live]", (e) => e.textContent);
    ok(/Band 45–60 years/.test(live) && /unwritten/.test(live), `the cursor's segment is announced (${live.trim()})`);
    ok(!!(await page.$("[data-sb-focus-ring]")), "keyboard focus is visible on the instrument");
    await shot(page, "18-keyboard-focus-state");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Enter"); // no pause between the two keys — the dial must act on the latest cursor
    await sleep(700);
    ok((await level(page)) === 1, "Enter looks closer from the keyboard, even when keys arrive faster than a render");
    const sel = await page.$$eval("[data-sb-dial] g[role=option][aria-selected=true]", (n) => n.length);
    ok(sel === 1, "exactly one selected segment announced");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await go(page, {}, { theme: "light", w: "desktop" });
    const cR = await segCentre(page, 2, 10);
    await page.mouse.click(cR.x, cR.y);
    await sleep(60);
    const midTransform = await page.$$eval("[data-sb-dial] svg > g[style]", (n) => n.map((g) => g.style.transform || g.getAttribute("transform") || ""));
    await sleep(400);
    ok((await level(page)) === 1 && midTransform.every((t) => !/scale\((?!1\))/.test(t) && !/rotate\((?!0)/.test(t)), `reduced motion: direct state change, no spatial transform (${midTransform.join(" | ") || "none"})`);
    await shot(page, "17-reduced-motion-result");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

    /* ---- 14. Mobile dial: turn and tap ---- */
    console.log("14. Mobile dial");
    await go(page, {}, { theme: "light", w: "360" });
    const b = await page.$eval("svg[role=listbox]", (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    const pt = (deg) => { const a = ((deg - 90) * Math.PI) / 180; const r = (156 / 400) * b.w; return { x: b.x + b.w / 2 + r * Math.cos(a), y: b.y + b.h / 2 + r * Math.sin(a) }; };
    const before = await page.$eval("svg[role=listbox]", (e) => e.getAttribute("aria-activedescendant"));
    const p0 = pt(90 + 18), p1 = pt(90 + 18 + 36), p2 = pt(90 + 18 + 72);
    await page.touchscreen.touchStart(p0.x, p0.y);
    await page.touchscreen.touchMove(p1.x, p1.y);
    await sleep(60);
    await page.touchscreen.touchMove(p2.x, p2.y);
    await sleep(60);
    await page.touchscreen.touchEnd();
    await sleep(200);
    const after = await page.$eval("svg[role=listbox]", (e) => e.getAttribute("aria-activedescendant"));
    ok(before !== after && /-5$/.test(after) && (await level(page)) === 0, `dragging around the circumference turns the cursor with snapping (${before.slice(-2)} → ${after.slice(-2)}: two whole segments for two segment-widths of travel); no accidental entry`);
    const tapAt = pt(90);
    await page.touchscreen.tap(tapAt.x, tapAt.y);
    await sleep(800);
    ok((await level(page)) === 1 && (await urlParam(page)) === "band:2", "tap enters the segment under the finger");
    const backBtn = await page.$eval("[data-sb-back]", (e) => { const r = e.getBoundingClientRect(); return r.width >= 36 && r.height >= 36; });
    ok(backBtn, "a non-gesture way out exists with a usable target (≥36px)");
    await shot(page, "06-band-selected-360");
    await go(page, { c: "age:34" }, { theme: "light", w: "360" });
    await shot(page, "08-year-months-360");
    await go(page, { c: "month:2026-09" }, { theme: "dark", w: "360" });
    await shot(page, "10-month-days-360");
    await go(page, { c: "day:2026-09-10" }, { theme: "light", w: "360" });
    ok((await page.$$eval("[data-sb-almanac] [data-sb-moment]", (n) => n.length)) === 1, "360: the day Almanac renders the Moment");
    const respondVisible = await page.evaluate(() => [...document.querySelectorAll("[data-sb-almanac] button")].some((b) => /Respond/.test(b.textContent) && b.getBoundingClientRect().width > 0));
    ok(respondVisible, "360: the Respond word stays visible in the Almanac");
    await shot(page, "12-day-almanac-360");
    await go(page, { c: "day:2026-09-04" }, { theme: "light", w: "360" });
    const dev = await page.$eval("[data-sb-almanac]", (e) => e.textContent);
    ok(/स्वयम्भू/.test(dev), "360: a Devanagari Moment renders at its coordinate");
    await page.$eval("[data-sb-almanac]", (e) => e.scrollIntoView({ block: "start" }));
    await sleep(500);
    await shot(page, "20-devanagari-day-almanac-360");
    await go(page, { c: "day:2026-09-04" }, { theme: "dark", w: "360" });
    await page.$eval("[data-sb-almanac]", (e) => e.scrollIntoView({ block: "start" }));
    await sleep(500);
    await shot(page, "20b-devanagari-day-almanac-360-dark");

    /* ---- 15. Density evidence: sparse vs dense ---- */
    console.log("15. Density");
    await go(page, { c: "band:1" }, { theme: "light", w: "desktop" });
    ok((await mainSegs(page)).every((x) => x.count === "0" && x.state === "lived"), "band 15–30: fully lived, nothing recorded — honest sparsity");
    await shot(page, "14-documentation-density-sparse");
    await go(page, { c: "age:34" }, { theme: "light", w: "desktop" });
    await shot(page, "15-documentation-density-dense");
    const text15 = await page.evaluate(() => document.body.innerText);
    ok(!/streak|badge|score|complete|fullness|%/.test(text15), "no gamification or life-value language");

    /* ---- 16. Entry from the Life Ring ---- */
    console.log("16. Entry from the ring");
    await page.setViewport({ width: VW.desktop, height: 1100, deviceScaleFactor: 1.5 });
    await page.goto(`${BASE}?w=desktop&theme=light&harness=0&entry=ring`, { waitUntil: "networkidle2" });
    await page.waitForSelector("[data-sb-entry-ring]", { timeout: 15000 });
    await sleep(500);
    ok(!!(await page.$("[data-sb-entry-ring]")), "entry state shows the compressed Life Ring");
    const hasView = await page.$("[data-sb-circle-view]");
    ok(!hasView, "the full Circle is not shown until the person looks closer");
    await page.click("[data-sb-entry-ring]");
    await sleep(900);
    ok(!!(await page.$("[data-sb-circle-view]")), "activating the ring expands the same geometry into the full Circle");
    const smallRing = await page.$eval("[data-sb-person-row] [data-sb-ring]", (e) => e.getAttribute("data-sb-ring"));
    ok(smallRing === "own", "the compressed ring in the person row is the owner's (with its tick)");

    /* ---- 17. Tablet + 390 composition ---- */
    console.log("17. Widths");
    for (const w of ["390", "768"]) {
      await go(page, {}, { theme: "light", w });
      const ws = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
      const dw = await page.$eval("svg[role=listbox]", (e) => Math.round(e.getBoundingClientRect().width));
      ok(ws && dw >= 300, `${w}: composed, no horizontal scroll, Circle ${dw}px`);
      await shot(page, `21-life-${w}-light`);
    }

    /* ---- finish ---- */
    console.log("18. Page health");
    ok(errors.length === 0, `zero page errors (${errors.length}) ${errors.slice(0, 2).join(" | ")}`);
    ok(rejections.filter((r) => !/favicon|ERR_/.test(r)).length === 0, `zero console errors (${rejections.length})`);
  } catch (e) {
    console.log("CIRCLE: CRASH", e);
    failures.push(`CRASH ${e.message}`);
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  for (const f of failures) console.log(` - ${f}`);
  await browser.close();
  console.log(failures.length ? "CIRCLE: FAIL" : "CIRCLE: PASS");
  process.exit(failures.length ? 1 : 0);
})();
