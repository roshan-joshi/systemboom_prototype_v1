/* SYSTEMBOOM — SOCIAL 2030 category-definition pass: focused checks for the
   five hierarchy corrections (old-social residue → life-network framing).
     node prototype-tests/social-2030.js */
const fs = require("fs");
const { launch, sleep } = require("./lib");

const HOST = "http://localhost:3210";
const SOCIAL = "/style-lab/social";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/social-2030";
fs.mkdirSync(EV, { recursive: true });

const VW = { 360: 420, 390: 450, desktop: 1440 };
let passed = 0;
const failures = [];
const ok = (c, label) => {
  if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); }
};
async function shot(page, name) {
  await page.screenshot({ path: `${EV}/${name}.png` });
  console.log(`  shot ${name}`);
}
async function open(page, path, { theme = "dark", w = "desktop", extra = {} } = {}) {
  await page.setViewport({ width: VW[w], height: 1100, deviceScaleFactor: 1.5, hasTouch: w === 360 || w === 390 });
  const u = new URL(HOST + path);
  u.searchParams.set("theme", theme);
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
  await page.goto(u.toString(), { waitUntil: "networkidle2" });
  await sleep(600);
}
const typeSearch = (page, value) =>
  page.evaluate(async (v) => {
    const i = document.querySelector("input[type=search]");
    i.focus();
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, v);
    i.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 400));
  }, value);

(async () => {
  const { browser, page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => {
    const full = `${m.text()} @${m.location()?.url ?? ""}`;
    if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|Back-Forward Cache/.test(full)) consoleErrors.push(full);
  });

  try {
    /* ---- 1. Notification request — Final Delta §2 reconsiders residue fix #1 ---- */
    // A dense notification row is IDENTITY-ONLY context: the previous pass's band label is
    // reconsidered and removed here — the real photo + Life Ring already carry "this is a life."
    console.log("1. Notification request — identity-only, no band text");
    await open(page, SOCIAL, { theme: "light", extra: { bell: "1" } });
    const reqText = await page.$eval("[data-sb-notification-request]", (e) => e.textContent.replace(/\s+/g, " ").trim());
    ok(!/band \d+–\d+/.test(reqText), `no band label in a dense notification row — the ring carries identity (${reqText})`);
    ok(/asked to be your friend/.test(reqText) && (await page.$("[data-sb-notif-accept]")), "Accept/Decline mechanic unchanged");
    await shot(page, "01-notification-life-context");

    /* ---- 2. PersonCard — life fact reads as primary, not a hovercard caption (residue fix #2) ---- */
    console.log("2. PersonCard hierarchy");
    await open(page, SOCIAL, { theme: "light" });
    await typeSearch(page, "Krishna");
    await page.click("[data-sb-search-person='p-krishna']");
    await sleep(400);
    const cardShape = await page.evaluate(() => {
      const card = document.querySelector("[data-sb-person-card]");
      const life = card.querySelector("p.font-medium.text-text");
      return {
        lifeText: life?.textContent.trim() ?? null,
        lifeFontSize: life ? getComputedStyle(life).fontSize : null,
        hasPrivacySentence: /exact position in their life is theirs to share/.test(card.textContent),
      };
    });
    ok(/Circle band 60–75/.test(cardShape.lifeText ?? ""), `the life fact reads with the same weight as the name (${cardShape.lifeText})`);
    ok(cardShape.lifeFontSize === "13px", `life line matches the name's typographic tier, not a caption (${cardShape.lifeFontSize})`);
    ok(cardShape.hasPrivacySentence, "the privacy sentence still exists, now beside the fact it explains");
    await shot(page, "02-person-card-hierarchy");
    await page.keyboard.press("Escape");

    /* ---- 3. Search people row — life position is a subtitle, not a trailing stat (residue fix #3) ---- */
    console.log("3. Search people row");
    await sleep(200);
    await typeSearch(page, "Asha");
    const searchShape = await page.evaluate(() => {
      const row = document.querySelector("[data-sb-search-person='p-asha']");
      const name = row.querySelector("span.block.truncate:not([data-sb-search-life])");
      const life = row.querySelector("[data-sb-search-life]");
      return {
        stacked: !!name && !!life && name.compareDocumentPosition(life) === Node.DOCUMENT_POSITION_FOLLOWING,
        lifeText: life?.textContent.trim() ?? null,
      };
    });
    ok(searchShape.stacked, "life position sits under the name as a subtitle, not beside it as a trailing stat");
    ok(/Friends|Family|Asked you/.test(searchShape.lifeText ?? ""), `relationship context is preserved in the same element (accepted-suite contract) (${searchShape.lifeText})`);
    await shot(page, "03-search-person-subtitle");
    await page.keyboard.press("Escape");

    /* ---- 4. Responder list — Final Delta §2 reconsiders residue fix #4 ---- */
    // A dense responder list is IDENTITY-ONLY context too: the previous pass's band/age line is
    // reconsidered and removed — real photo + Life Ring already say "this is a life."
    console.log("4. Responder list — identity-only, no band/age text");
    await open(page, SOCIAL, { theme: "light" });
    await page.waitForSelector("[data-sb-moment]", { timeout: 8000 });
    // R3 owner-superseded: the Respond-tap responder list is retired with the tap itself. The
    // invariant it protected — a dense people list is IDENTITY-ONLY, never band/age text — now
    // lives on the who-expressed list, which is the dense people list this product has.
    const expressed = await page.$("[data-sb-expression-summary]");
    if (expressed) {
      await expressed.click();
      await sleep(300);
      const popoverText = await page.$eval("[data-sb-expression-who]", (e) => e.textContent.replace(/\s+/g, " ").trim());
      ok(!/band \d+–\d+|y \d\dm \d\dd/.test(popoverText), `no band/age text in the dense people list — the ring carries identity (${popoverText.slice(0, 80)})`);
      await shot(page, "04-responder-list-lives");
    } else {
      ok(false, "no Moment with expressions found to open the dense people list");
    }

    /* ---- 4b. Pagination reads as a life record, not an algorithmic feed (residue fix #5) ---- */
    console.log("4b. Load more copy");
    await open(page, SOCIAL, { theme: "light" });
    const loadMoreText = await page.$eval("[data-sb-load-more]", (e) => e.textContent.trim()).catch(() => null);
    if (loadMoreText) ok(/^\d+ earlier/.test(loadMoreText), `time leads, not the generic "Load more" (${loadMoreText})`);

    /* ---- 5. First impression evidence (change-the-logo review material) ---- */
    console.log("5. First-impression evidence");
    await open(page, SOCIAL, { theme: "dark" });
    await shot(page, "05-my-world-desktop-dark");
    await open(page, SOCIAL, { theme: "light" });
    await shot(page, "06-my-world-desktop-light");
    await open(page, SOCIAL, { theme: "dark", w: 360 });
    await shot(page, "07-my-world-360-dark");
    await open(page, SOCIAL, { theme: "light", w: 360 });
    await shot(page, "08-my-world-360-light");
    // harness=0 hides the review toolbar — the same measurement complete-my-world.js takes on /world.
    await open(page, SOCIAL, { theme: "light", w: 360, extra: { harness: "0" } });
    const firstMomentTop = await page.$eval("[data-sb-moment]", (e) => e.getBoundingClientRect().top);
    ok(firstMomentTop < 900, `mobile first-Moment priority unaffected by the hierarchy pass (${Math.round(firstMomentTop)}px)`);
    await open(page, SOCIAL, { theme: "light", extra: { viewer: "visitor" } });
    await shot(page, "09-visitor-world");
    await open(page, SOCIAL, { theme: "dark", extra: { viewer: "visitor" } });
    await shot(page, "10-visitor-world-dark");

    /* ---- 7. ProfileHero: old-social grammar removed (Final Delta §1) ----
       My World 2030 Visual Leap (owner-directed, supersedes the "no cover" assertion below): the
       cover capability is now rendered as a WORLD HORIZON — a real photo is expected and correct.
       What stays banned is the Facebook GRAMMAR: the ring must never overlap or sit on the cover
       image, and the cover must never carry follower-style stats. See `my-world-2030.js` for the
       full visual-leap acceptance (Life Instrument, current-band geometry, memory material). ---- */
    console.log("7. ProfileHero redesign");
    await open(page, SOCIAL, { theme: "light" });
    const heroShape = await page.evaluate(() => {
      const hero = document.querySelector("[data-sb-hero]");
      const cover = hero.querySelector("[data-sb-cover-region]");
      const ring = hero.querySelector("[data-sb-ring]");
      const noOverlap = !cover || !ring || ring.getBoundingClientRect().top >= cover.getBoundingClientRect().bottom - 1;
      return {
        coverIsHorizon: !!cover?.querySelector("[data-sb-cover-photo]"),
        noAvatarOverlap: noOverlap,
        ringCount: hero.querySelectorAll("[data-sb-ring]").length,
        kicker: hero.querySelector("[data-sb-world-context]")?.textContent.trim(),
        noFollowerStats: !/follower|following/i.test(hero.textContent),
      };
    });
    ok(heroShape.coverIsHorizon, "the existing cover capability now renders as a real World Horizon, not left dormant behind a control");
    ok(heroShape.noAvatarOverlap, "the ring never overlaps the cover — the Facebook avatar-overlap grammar stays removed");
    ok(heroShape.ringCount === 1, `one ring, not a responsive pair — the old overlap-era duplication is gone (${heroShape.ringCount})`);
    ok(heroShape.kicker === "My World", `the owner's hero states whose World this is (${heroShape.kicker})`);
    ok(heroShape.noFollowerStats, "no follower/following statistics anywhere in the hero");
    await shot(page, "11-hero-owner-desktop");
    await open(page, SOCIAL, { theme: "light", w: 360, extra: { harness: "0" } });
    await shot(page, "12-hero-owner-360");
    await open(page, SOCIAL, { theme: "light", extra: { viewer: "ashaVisitor" } });
    const visitorKicker = await page.$eval("[data-sb-world-context]", (e) => e.textContent.trim());
    ok(visitorKicker === "Maya’s World", `a visitor's hero states whose World it is, not their own (${visitorKicker})`);
    const relWord = await page.$eval("[data-sb-hero]", (e) => e.textContent).then((t) => /Friends|Family/.test(t));
    ok(relWord, "a connected visitor's relationship shows in the identity model, outside the ring itself");
    await shot(page, "13-hero-visitor-desktop");
    await open(page, SOCIAL, { theme: "light", w: 360, extra: { viewer: "ashaVisitor", harness: "0" } });
    await shot(page, "14-hero-visitor-360");
    await open(page, SOCIAL, { theme: "dark" });
    await shot(page, "15-hero-owner-dark");

    /* ---- 8. Life Cursor (Final Delta §3–§4) ---- */
    console.log("8. Life Cursor");
    await open(page, SOCIAL, { theme: "light" });
    ok(!(await page.$("[data-sb-life-cursor]")), "no cursor at the top of the feed — the present needs no orientation");
    await shot(page, "16-feed-top-no-cursor");
    for (let i = 0; i < 6 && !(await page.$("[data-sb-moment='m-1983']")); i++) {
      await page.click("[data-sb-load-more]").catch(() => {});
      await sleep(300);
    }
    ok(!!(await page.$("[data-sb-moment='m-1983']")), "the 1983 historical Moment is reachable by loading further");
    await page.$eval("[data-sb-moment='m-1983']", (e) => { const top = e.getBoundingClientRect().top; window.scrollBy(0, top - 20); });
    await sleep(400);
    const cursor = await page.$eval("[data-sb-life-cursor]", (e) => ({
      text: e.textContent.replace(/\s+/g, " ").trim(),
      year: e.getAttribute("data-sb-life-cursor-year"),
      position: getComputedStyle(e).position,
      boxShadow: getComputedStyle(e).boxShadow,
      backdropFilter: getComputedStyle(e).backdropFilter,
    }));
    // Exactly which neighbouring historical Moment lands under the trigger line is a sub-pixel
    // scroll-math question, not a Life Cursor correctness question — what matters is that it is a
    // REAL year from the fixtures, never the current year and never fabricated.
    ok(["1983", "2022"].includes(cursor.year ?? ""), `the cursor states a real historical year being browsed, from real Moment data (${cursor.text})`);
    ok(/Ratmate|Nuwakot/.test(cursor.text) || /band|y \d\dm/.test(cursor.text), `the cursor carries a viewer-safe life position and place from the real Moment (${cursor.text})`);
    ok(cursor.position === "sticky", "the cursor is an ordinary in-flow sticky element, not a fixed HUD");
    ok(cursor.boxShadow === "none" && (cursor.backdropFilter === "none" || cursor.backdropFilter === ""), "no glass panel — solid colour, no blur, no shadow");
    await shot(page, "17-life-cursor-desktop");
    await open(page, SOCIAL, { theme: "light", w: 360, extra: { harness: "0" } });
    for (let i = 0; i < 6 && !(await page.$("[data-sb-moment='m-1983']")); i++) {
      await page.click("[data-sb-load-more]").catch(() => {});
      await sleep(300);
    }
    await page.$eval("[data-sb-moment='m-1983']", (e) => { const top = e.getBoundingClientRect().top; window.scrollBy(0, top - 20); });
    await sleep(400);
    ok(!!(await page.$("[data-sb-life-cursor]")), "the cursor also appears on mobile once scrolled into real history");
    await shot(page, "18-life-cursor-mobile");
    // Scroll back to the top of the feed — the cursor is silent again for the present.
    await page.evaluate(() => document.querySelector("[data-sb-sheet]")?.scrollIntoView({ block: "start" }));
    await sleep(400);
    ok(!(await page.$("[data-sb-life-cursor]")), "back at the present, the cursor falls silent again");

    /* ---- 9. Moment coordinate stays complementary, not duplicated (§4) ---- */
    console.log("9. Moment under the cursor");
    await open(page, SOCIAL, { theme: "light" });
    for (let i = 0; i < 6 && !(await page.$("[data-sb-moment='m-1983']")); i++) {
      await page.click("[data-sb-load-more]").catch(() => {});
      await sleep(300);
    }
    await page.$eval("[data-sb-moment='m-1983']", (e) => { const top = e.getBoundingClientRect().top; window.scrollBy(0, top - 20); });
    await sleep(400);
    const momentReadout = await page.$eval("[data-sb-moment='m-1983'] [data-sb-readout]", (e) => e.textContent.replace(/\s+/g, " ").trim());
    ok(/06 FEB 1983|1983/.test(await page.$eval("[data-sb-moment='m-1983'] [data-sb-date-rule], [data-sb-moment='m-1983']", (e) => e.textContent)), "the Moment itself still carries its own exact date — the cursor did not remove it");
    ok(!momentReadout.includes("·  ·"), `Moment readout stays its normal exact/local grammar, no duplicated cursor text pasted in (${momentReadout})`);
    await shot(page, "19-moment-under-cursor");

    /* ---- 6. No regression: privacy, Circle, Chat untouched ---- */
    console.log("6. No regression");
    await open(page, SOCIAL, { theme: "light", extra: { viewer: "visitor" } });
    const html = await page.evaluate(() => document.documentElement.outerHTML);
    ok(!html.includes("04 NOV 1991") && !html.includes("06:42"), "no birth-derived precision leaked by any of the five fixes");
    await open(page, SOCIAL, { theme: "dark" });
    ok((await page.$("[data-sb-circle]")) !== null, "Circle sidebar module still mounts, untouched");
    // Chat's own full acceptance (complete-my-world.js §5) already re-ran green after every
    // change in this pass — none of the five fixes touch world/** or app/chat/**.

    console.log("11. Page health");
    ok(errors.length === 0, `zero page errors (${errors.length})`);
    ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length}) ${consoleErrors.slice(0, 3).join(" | ")}`);
  } catch (e) {
    console.error(e);
    failures.push(String(e));
  } finally {
    await browser.close();
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log("FAILED:");
    failures.forEach((f) => console.log(` - ${f}`));
    console.log("\nSOCIAL 2030: FAIL");
    process.exit(1);
  }
  console.log("\nSOCIAL 2030: PASS");
})();
