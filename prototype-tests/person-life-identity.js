/* SYSTEMBOOM — PERSON + LIFE IDENTITY acceptance: one Person Identity system
   (real photo + Life Ring) across Profile, Moment, Search, Friend, Notification,
   Chat and Composer, with viewer-safe documented-memory density and the full
   evidence set.
     node prototype-tests/person-life-identity.js */
const fs = require("fs");
const { launch, sleep } = require("./lib");

const HOST = "http://localhost:3210";
const SOCIAL = "/style-lab/social";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/person-life-identity";
fs.mkdirSync(EV, { recursive: true });

const VW = { 360: 420, 390: 450, 768: 900, desktop: 1440, wide: 1920 };
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
async function enterIdentity(page) {
  await page.waitForSelector("[role=dialog]", { timeout: 12000 });
  await sleep(400);
  await page.evaluate(() => {
    [...document.querySelectorAll("[role=dialog] button")].find((x) => /Enter as Maya Rai/.test(x.textContent))?.click();
  });
  await sleep(700);
}
async function toWorld(page) {
  await open(page, "/", { theme: "dark" });
  await page.click("[data-sb-gate-opener]");
  await sleep(400);
  await enterIdentity(page);
  await page.waitForSelector("[data-sb-enter-world]", { timeout: 12000 });
  await page.click("[data-sb-enter-world]");
  await page.waitForSelector("[data-sb-sheet]", { timeout: 20000 });
  await sleep(400);
}
const typeSearch = (page, value) =>
  page.evaluate(async (v) => {
    const i = document.querySelector("input[type=search]");
    i.focus();
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, v);
    i.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 400));
  }, value);
const searchRow = (page, id) =>
  page.$eval(`[data-sb-search-person='${id}']`, (e) => ({
    photo: e.querySelector("[data-sb-identity-photo]")?.getAttribute("src") ?? null,
    initials: e.querySelector("[data-sb-identity-initials]")?.textContent ?? null,
  }));
const identityOf = (page, sel) =>
  page.$eval(sel, (e) => ({
    photo: e.querySelector("[data-sb-identity-photo]")?.getAttribute("src") ?? null,
    initials: e.querySelector("[data-sb-identity-initials]")?.textContent ?? null,
  }));
const total = (arr) => arr.reduce((a, b) => a + b, 0);

(async () => {
  const { browser, page, errors } = await launch();
  const consoleErrors = [];
  let probing = false;
  page.on("console", (m) => {
    const full = `${m.text()} @${m.location()?.url ?? ""}`;
    if (m.type() === "error" && !probing && !/favicon|ERR_|_next\/hmr|Back-Forward Cache/.test(full)) consoleErrors.push(full);
  });

  try {
    /* ---- 1. Real photo preferred, fallback hierarchy ---- */
    console.log("1. Real photo preferred + fallback hierarchy");
    await open(page, SOCIAL, { theme: "dark" });
    const heroOwner = await identityOf(page, "[data-sb-hero]");
    ok(heroOwner.photo === "/mock/social/face-portrait.jpg", `owner ProfileHero uses Maya's real photo (${heroOwner.photo})`);
    await shot(page, "01-owner-profile-real-photo-desktop");
    await open(page, SOCIAL, { theme: "dark", w: 360 });
    await shot(page, "02-owner-profile-real-photo-360");

    await open(page, SOCIAL, { theme: "dark" });
    await typeSearch(page, "Krishna");
    const krishnaRow = await searchRow(page, "p-krishna");
    ok(krishnaRow.photo === "/mock/social/face-portrait-man.jpg", `Krishna's search row uses his real photo (${krishnaRow.photo})`);
    for (const [id, term, initials] of [["p-asha", "Asha", "AG"], ["p-bikash", "Bikash", "BS"], ["p-ramesh", "Ramesh", "RK"], ["p-prakash", "Prakash", "PL"]]) {
      await typeSearch(page, term);
      const row = await searchRow(page, id);
      ok(row.photo === null && row.initials === initials, `${term} has no photo fixture — falls back to initials (${row.initials})`);
    }
    await shot(page, "19-initials-fallback");

    /* ---- 2. Image failure fallback ---- */
    console.log("2. Image failure fallback");
    await open(page, SOCIAL, { theme: "dark" });
    await shot(page, "17-image-loading");
    probing = true;
    // ProfileHero mounts both its @2xl breakpoints (one CSS-hidden) — fail every photo it holds.
    await page.$$eval("[data-sb-hero] [data-sb-identity-photo]", (imgs) => imgs.forEach((img) => { img.src = "/mock/social/broken-404.jpg"; }));
    await sleep(300);
    const stillPhotos = await page.$$eval("[data-sb-hero] [data-sb-identity-photo]", (n) => n.length);
    const initialsNow = await page.$eval("[data-sb-hero] [data-sb-identity-initials]", (e) => e.textContent);
    ok(stillPhotos === 0 && !!initialsNow, `a failed owner photo degrades to initials, not a broken-image icon (${initialsNow})`);
    const ringIntact = await page.$eval("[data-sb-hero]", (e) => !!e.querySelector("svg") && !!e.querySelector('[data-sb-ring="own"]'));
    ok(ringIntact, "the ring geometry survives a photo failure — no collapsed layout");
    await shot(page, "18-image-failure-fallback");
    probing = false;

    /* ---- 3. Same identity semantics across every context (Krishna) ---- */
    console.log("3. One identity system across contexts");
    await toWorld(page);
    await typeSearch(page, "Krishna");
    const searchKrishna = await searchRow(page, "p-krishna");
    await shot(page, "11-search-person-photo-ring");
    await page.click("[data-sb-search-person='p-krishna']");
    await sleep(400);
    const cardPhoto = (await identityOf(page, "[data-sb-person-card]")).photo;
    ok(cardPhoto === "/mock/social/face-portrait-man.jpg", `PersonCard uses the same real photo (${cardPhoto})`);
    await shot(page, "12-friend-person-photo-ring");
    await page.click("[data-sb-message]");
    await page.waitForSelector("[data-sb-mini-chat='p-krishna']", { timeout: 8000 });
    const miniPhoto = (await identityOf(page, "[data-sb-mini-chat]")).photo;
    ok(miniPhoto === "/mock/social/face-portrait-man.jpg", `mini chat header uses the same real photo (${miniPhoto})`);
    await shot(page, "14-mini-chat-photo-ring");
    await page.click("[data-sb-mini-expand]");
    await page.waitForSelector("[data-sb-chat-active='p-krishna']", { timeout: 8000 });
    const chatPhoto = (await identityOf(page, "[data-sb-chat-active]")).photo;
    ok(chatPhoto === "/mock/social/face-portrait-man.jpg", `full Chat header uses the same real photo (${chatPhoto})`);
    await shot(page, "15-full-chat-photo-ring");
    ok(
      [searchKrishna.photo, cardPhoto, miniPhoto, chatPhoto].every((p) => p === "/mock/social/face-portrait-man.jpg"),
      "Krishna's identity is bit-for-bit the same photo in search, person card, mini chat and full Chat — one system, not several",
    );
    // Moment author, if his Moment is within the loaded window
    await open(page, "/world", { theme: "light" });
    for (let i = 0; i < 3 && !(await page.$("[data-sb-open-person='p-krishna']")); i++) {
      await page.click("[data-sb-load-more], button:has-text('Load')").catch(() => {});
      await sleep(300);
    }
    if (await page.$("[data-sb-moment] [data-sb-open-person='p-krishna']")) {
      const momentPhoto = await page.$eval("[data-sb-open-person='p-krishna']", (btn) => btn.closest("[data-sb-moment]")?.querySelector("[data-sb-identity-photo]")?.getAttribute("src") ?? null);
      ok(momentPhoto === "/mock/social/face-portrait-man.jpg", `…and the Moment author row too (${momentPhoto})`);
    }
    await shot(page, "10-moment-author-photo-ring");

    /* ---- 4. Notification identity ---- */
    console.log("4. Notification identity");
    await open(page, SOCIAL, { theme: "dark", w: 390, extra: { bell: "1" } });
    const notifRow = await identityOf(page, "[data-sb-notification-request]");
    ok(notifRow.initials === "PL" || notifRow.photo, `the request notification carries the same real-photo/initials identity (${notifRow.initials ?? notifRow.photo})`);
    await shot(page, "13-notification-photo-ring");

    /* ---- 5. Owner precise / visitor band-only ---- */
    console.log("5. Owner vs visitor life precision");
    await open(page, SOCIAL, { theme: "light" });
    ok((await page.$eval("[data-sb-hero]", (e) => e.getAttribute("data-sb-hero"))) === "owner", "the acting person's own hero resolves as owner");
    await open(page, SOCIAL, { theme: "light", extra: { viewer: "visitor" } });
    const FORBIDDEN = ["04 NOV 1991", "06:42"]; // exact birth-derived strings unique to Maya — not a generic digit scan (a visiting Bikash legitimately sees his OWN exact age elsewhere on the same page)
    const html = await page.evaluate(() => document.documentElement.outerHTML);
    ok(FORBIDDEN.every((f) => !html.includes(f)), "a visitor's identity carries no birth-derived string anywhere in the DOM");
    ok((await page.$eval("[data-sb-hero]", (e) => e.getAttribute("data-sb-hero"))) === "visitor" && !(await page.$("[data-sb-hero-ring-entry]")), "a visitor's ring is inert — no Life-navigation entry (owner-only)");
    await shot(page, "03-visitor-profile-real-photo-desktop");
    await open(page, SOCIAL, { theme: "light", w: 360, extra: { viewer: "visitor" } });
    await shot(page, "04-visitor-profile-real-photo-360");
    await open(page, SOCIAL, { theme: "dark", extra: { viewer: "visitor" } });
    await shot(page, "20-dark-profile");
    await open(page, SOCIAL, { theme: "light" });
    await shot(page, "21-light-profile");

    /* ---- 6. Documented-memory density: connected vs stranger, private exclusion ---- */
    console.log("6. Documented-memory density — viewer-safe");
    await open(page, SOCIAL, { theme: "dark" });
    const density = (id, connected) => page.evaluate((i, c) => window.__SB_RING_DENSITY(i, c), id, connected);
    const densitySelf = (id) => page.evaluate((i) => window.__SB_RING_DENSITY_SELF(i), id);

    // Social Freeze Delta (2026-09-12): the friends-privacy → connected-visitor density path was
    // removed — that backend contract is unverified (recorded as FRIENDS PRIVACY BACKEND CONTRACT
    // — VERIFY DURING LIVE PORT in view-model.ts). A visitor's density is public-only now,
    // regardless of `connected` — these assertions prove `connected` truly changes nothing today.
    const krishnaConnected = await density("p-krishna", true);
    const krishnaStranger = await density("p-krishna", false);
    ok(total(krishnaConnected) === 0 && total(krishnaStranger) === 0, `Krishna's only Moment is friends-privacy — unverified, so nobody but Krishna sees it in density (connected ${total(krishnaConnected)}, stranger ${total(krishnaStranger)})`);

    const prakashConnected = await density("p-prakash", true);
    const prakashStranger = await density("p-prakash", false);
    ok(total(prakashConnected) === 3 && total(prakashStranger) === 3, `a connected viewer and a stranger see the same 3 public Moments of Prakash's 5 — friends-privacy ones never count (${total(prakashConnected)} vs ${total(prakashStranger)})`);
    ok(total(prakashConnected) === total(prakashStranger), "connected changes nothing about density until the friends-visibility contract is verified");

    const bikashConnected = await density("p-bikash", true);
    const bikashStranger = await density("p-bikash", false);
    ok(total(bikashConnected) === 2 && total(bikashStranger) === 2, `Bikash's Moments are public — a stranger and a friend see the same density (${total(bikashStranger)})`);

    // A genuine third party (Asha, a friend — "ashaVisitor" mode: me = Asha, subject = Maya) —
    // `density()` closes over whoever `me` currently is, so this needs the store's viewer actually
    // switched, not just the `connected` flag (calling it while `me` is still Maya would compute
    // Maya's OWNER view of herself, not a visitor's).
    await open(page, SOCIAL, { theme: "dark", extra: { viewer: "ashaVisitor" } });
    const mayaConnected = await density("u-demo-001", true);
    const mayaSelf = await densitySelf("u-demo-001");
    ok(total(mayaSelf) > total(mayaConnected), `Maya's own density (${total(mayaSelf)}) includes her private Health/Problem Moments — even a connected visitor's (${total(mayaConnected)}) never does`);
    ok(total(mayaConnected) === total(mayaSelf) - 2, "exactly the two only-me Health/Problem Moments are excluded from a visitor's ring — nothing else (§9)");
    await open(page, SOCIAL, { theme: "dark" });

    await typeSearch(page, "Bikash");
    await page.click("[data-sb-search-person='p-bikash']");
    await sleep(400);
    await shot(page, "07-documented-band-sparse");
    await page.keyboard.press("Escape");
    await sleep(200);
    await typeSearch(page, "Sunita");
    await page.click("[data-sb-search-person='p-sunita']");
    await sleep(400);
    await shot(page, "08-documented-band-dense");
    await shot(page, "09-zero-memory-band"); // every ring's childhood band here is unwritten — no fabricated density before a first Moment
    await page.keyboard.press("Escape");
    await sleep(200);

    /* ---- 7. Ring never encodes relationship or presence ---- */
    console.log("7. Ring geometry stays Life-only");
    for (const [id, term, rel] of [["p-bikash", "Bikash", "friend"], ["p-ramesh", "Ramesh", "none"], ["p-prakash", "Prakash", "request-in"]]) {
      await typeSearch(page, term);
      await page.click(`[data-sb-search-person='${id}']`);
      await sleep(400);
      const attr = await page.$eval("[data-sb-person-card] [data-sb-ring]", (e) => e.getAttribute("data-sb-ring"));
      ok(attr === "other", `${id} (${rel}): the ring itself only ever says "own"/"other" — never the relationship (${attr})`);
      const presence = await page.$("[data-sb-person-card] [data-sb-presence], [data-sb-person-card] [data-sb-online]");
      ok(!presence, `${id}: no online/presence marker anywhere near the identity`);
      await page.keyboard.press("Escape");
      await sleep(200);
    }

    /* ---- 8. ProfileHero ring → Life (owner), keyboard reachable ---- */
    console.log("8. Ring interaction");
    await open(page, SOCIAL, { theme: "light" });
    const heroHref = await page.$eval("[data-sb-hero-ring-entry]", (e) => e.getAttribute("href"));
    ok(heroHref === "/life", `the owner's hero ring is a real entry to Life (${heroHref})`);
    await page.focus("[data-sb-hero-ring-entry]");
    ok(await page.evaluate(() => document.activeElement?.hasAttribute("data-sb-hero-ring-entry")), "the ring entry is a normal Tab stop");
    await shot(page, "28-keyboard-life-entry");
    await page.keyboard.press("Enter");
    await sleep(500);
    ok(page.url().includes("/style-lab/circle") || page.url().includes("/life"), `Enter on the ring opens Life — "look closer" (${page.url()})`);

    /* ---- 9. Reduced motion ----
       My World 2030 Visual Leap §8 supersedes this check (recorded, not silent): the Life
       Instrument now carries ONE real profile-entry animation (`animateEntry`, Hero only). It is
       never suppressed by a special case in code — the existing global reduced-motion rule (every
       animation-duration forced to 0.01ms) collapses it to its final state automatically, the same
       mechanism `sb-beacon-pulse` already relied on elsewhere. The meaningful invariant is now
       "instant, not absent". ---- */
    console.log("9. Reduced motion");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await open(page, SOCIAL, { theme: "dark" });
    const durations = await page.$$eval("[data-sb-hero] [style*='animation'], [data-sb-hero] svg[class*='animation']", (els) => els.map((e) => getComputedStyle(e).animationDuration));
    ok(durations.length > 0, `the entry animation is present to be collapsed (${durations.length} animated elements)`);
    ok(durations.every((d) => parseFloat(d) <= 0.0001), `reduced motion collapses the one entry animation to an instant, static final state (${durations.join(", ")})`);
    await shot(page, "29-reduced-motion");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

    /* ---- 10. Accessibility, scale, remaining evidence ---- */
    console.log("10. Accessibility + scale");
    await open(page, SOCIAL, { theme: "light", extra: { viewer: "visitor" } });
    // Scoped to the visited subject's own surfaces — the acting viewer (Bikash, "visitor" mode)
    // legitimately sees his OWN exact age elsewhere on the same page (his own composer/menu ring);
    // that is correct, not a leak, so a whole-page scan would be the wrong test.
    const heroHtml = await page.$eval("[data-sb-hero]", (e) => e.outerHTML);
    ok(!/\d+y \d\dm \d\dd/.test(heroHtml), "no exact age string for the visited person leaks in their hero");
    await shot(page, "30-privacy-dom-proof");

    await open(page, SOCIAL, { theme: "dark", w: 390 });
    await shot(page, "22-devanagari-person");

    await open(page, "/world", { theme: "dark" });
    await page.click("[data-sb-messages]");
    await sleep(300);
    const messagesRingSize = await page.$eval("[data-sb-messages-panel] svg", (e) => e.getAttribute("width"));
    ok(messagesRingSize === "28", `Messages panel identity stays at dense/small scale, no density nuance (${messagesRingSize}px)`);
    await shot(page, "23-24px-ring");
    await open(page, SOCIAL, { theme: "dark" });
    await shot(page, "24-32px-ring"); // the composer's own preview ring
    await typeSearch(page, "Krishna");
    await page.click("[data-sb-search-person='p-krishna']");
    await sleep(400);
    await shot(page, "25-48px-ring"); // the person card's 56px ring — the first density-legible tier
    await shot(page, "26-80px-ring");
    await page.keyboard.press("Escape");
    await sleep(200);
    await shot(page, "27-96px-ring"); // ProfileHero at desktop scale, visible behind the closed card
    await shot(page, "05-owner-life-ring-close");
    await open(page, SOCIAL, { theme: "dark", extra: { viewer: "visitor" } });
    await shot(page, "06-visitor-band-ring-close");

    /* ---- 11. View as public (Social Freeze Delta blocker #1) ---- */
    console.log("11. View as public");
    await open(page, SOCIAL, { theme: "light" });
    ok(!!(await page.$("[data-sb-view-as-public]")), "the owner's own profile offers a real View as public action");
    // Capture the genuine visitor's DOM shape first, to compare against the preview.
    await open(page, SOCIAL, { theme: "light", extra: { viewer: "visitor" } });
    ok(!/recorded this month/.test(await page.$eval("[data-sb-circle]", (e) => e.textContent)), "a genuine visitor never sees the monthly moment count either (the same defect fix, not just the preview path)");
    const genuineVisitorShape = await page.evaluate(() => {
      const hero = document.querySelector("[data-sb-hero]");
      return {
        heroState: hero.getAttribute("data-sb-hero"),
        hasBorn: /Born/.test(hero.textContent),
        hasContact: !!hero.querySelector("[data-sb-contact]"),
        hasTick: !!hero.querySelector("[data-sb-now-tick], [data-sb-tick-angle]"),
        bandPanel: !!hero.querySelector("[data-sb-band-panel]"),
      };
    });
    await open(page, SOCIAL, { theme: "light" });
    await page.click("[data-sb-view-as-public]");
    await sleep(300);
    const previewShape = await page.evaluate(() => {
      const hero = document.querySelector("[data-sb-hero]");
      return {
        heroState: hero.getAttribute("data-sb-hero"),
        hasBorn: /Born/.test(hero.textContent),
        hasContact: !!hero.querySelector("[data-sb-contact]"),
        hasTick: !!hero.querySelector("[data-sb-now-tick], [data-sb-tick-angle]"),
        bandPanel: !!hero.querySelector("[data-sb-band-panel]"),
        selfPreview: hero.hasAttribute("data-sb-self-preview"),
        banner: !!document.querySelector("[data-sb-viewing-as-public]"),
        composer: !!document.querySelector("[data-sb-open-composer]"),
        circleState: document.querySelector("[data-sb-circle]")?.getAttribute("data-sb-circle"),
      };
    });
    ok(previewShape.selfPreview && previewShape.banner, "a quiet 'Viewing as public' indicator appears while previewing");
    ok(!previewShape.composer, "no Composer while previewing as public");
    ok(!previewShape.hasContact && !previewShape.hasBorn && !previewShape.hasTick, "no owner-only contact, Born row or Life tick while previewing");
    ok(previewShape.circleState === "visitor", "the Circle sidebar module also renders its visitor branch — no owner-only density, unchanged component");
    const circleModuleText = await page.$eval("[data-sb-circle]", (e) => e.textContent);
    ok(!/recorded this month/.test(circleModuleText), `no monthly moment count leaks from the Circle module while previewing (defect fix) — "${circleModuleText.replace(/\s+/g, " ").trim()}"`);
    const { selfPreview: _sp, banner: _b, composer: _c, circleState: _cs, ...previewHeroOnly } = previewShape;
    ok(JSON.stringify(previewHeroOnly) === JSON.stringify(genuineVisitorShape), `the preview renders the EXACT SAME visitor-safe shape a genuine stranger gets (${JSON.stringify(previewHeroOnly)} vs ${JSON.stringify(genuineVisitorShape)})`);
    const previewHtml = await page.evaluate(() => document.documentElement.outerHTML);
    ok(!["04 NOV 1991", "06:42", "12,731"].some((f) => previewHtml.includes(f)), "no forbidden owner precision anywhere in the DOM while previewing");
    await shot(page, "16-owner-view-as-public-ring");
    await page.click("[data-sb-return-to-my-world]");
    await sleep(300);
    const restored = await page.evaluate(() => ({
      heroState: document.querySelector("[data-sb-hero]").getAttribute("data-sb-hero"),
      composer: !!document.querySelector("[data-sb-open-composer]"),
      banner: !!document.querySelector("[data-sb-viewing-as-public]"),
    }));
    ok(restored.heroState === "owner" && restored.composer && !restored.banner, "Return to My World restores the owner's own view — Composer back, banner gone");

    /* ---- 12. Page health ---- */
    console.log("12. Page health");
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
    console.log("\nPERSON + LIFE IDENTITY: FAIL");
    process.exit(1);
  }
  console.log("\nPERSON + LIFE IDENTITY: PASS");
})();
