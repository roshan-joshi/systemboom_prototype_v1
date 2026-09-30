/**
 * SOCIAL WALL S5 — MOMENT COMPLETION: SAVE + SHARE (focused regression suite).
 *
 *   node prototype-tests/social-s5-moment.js        (dev server on :3210)
 *
 * §1 private Save — a bookmark, not a signal: no counts anywhere, a quiet Saved surface in
 *    the account menu, entries land on the exact Moment
 * §2 the full loop — unsave from the menu; delete leaves no ghost bookmark
 * §3 Share — native share where the platform has it (no repost engine, no quote, no boost);
 *    Copy link stays the universal path
 * §4 View as public — Save pauses with the rest of the stranger's menu
 * §5 mobile + localisation
 */
const { launch, sleep } = require("./celestial-lib");

const HOST = "http://localhost:3210";
const B = `${HOST}/style-lab/social?harness=0&theme=light`;
let passed = 0;
const failures = [];
const ok = (c, m) => { if (c) { passed += 1; console.log(`  ✓ ${m}`); } else { failures.push(m); console.log(`  ✗ ${m}`); } };
const DESKTOP = { width: 1440, height: 950, deviceScaleFactor: 1 };
const PHONE = { width: 360, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

async function open(page, vp = DESKTOP, locale = "en") {
  await page.setCookie({ name: "sb-locale", value: locale, url: HOST });
  await page.setViewport(vp);
  await page.goto(B, { waitUntil: "networkidle2" });
  await sleep(900);
}
const menuOf = async (page, id) => { await page.evaluate((m) => document.querySelector(`[data-sb-moment='${m}'] [data-sb-actions-more] button[aria-expanded]`)?.click(), id); await sleep(300); };
const items = (page, id) => page.evaluate((m) => [...document.querySelectorAll(`[data-sb-moment='${m}'] [role=menu] [role^=menuitem]`)].map((x) => x.textContent.trim()), id);
const clickItem = async (page, id, text) => { await page.evaluate((m, t) => [...document.querySelectorAll(`[data-sb-moment='${m}'] [role=menu] [role^=menuitem]`)].find((x) => x.textContent.trim() === t)?.click(), id, text); await sleep(300); };
const openSaved = async (page) => {
  await page.evaluate(() => document.querySelector("[data-sb-account-trigger]")?.click());
  await sleep(300);
  await page.evaluate(() => [...document.querySelectorAll("[role=menu][aria-label=Account] [role=menuitem]")].find((x) => /^Saved/.test(x.textContent.trim()))?.click());
  await sleep(400);
};

(async () => {
  const { browser, page } = await launch();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  try {
    /* ---- §1 private Save ---- */
    console.log("§1 Save is a private bookmark");
    await open(page);
    await menuOf(page, "m-rain");
    let own = await items(page, "m-rain");
    ok(own[0] === "Save", `Save leads the owner's own menu (${own.join(" · ")})`);
    await clickItem(page, "m-rain", "Save");
    const noCount = await page.evaluate(() => !/saved by|\d+ saves/i.test(document.querySelector("[data-sb-moment='m-rain']").textContent));
    ok(noCount, "no save count appears anywhere on the Moment — a bookmark, never a signal");
    await openSaved(page);
    const panel = await page.evaluate(() => ({
      open: !!document.querySelector("[data-sb-saved-panel]"),
      entry: document.querySelector("[data-sb-saved-entry]")?.getAttribute("data-sb-saved-entry"),
      identity: !!document.querySelector("[data-sb-saved-entry] [data-sb-identity-photo],[data-sb-saved-entry] [data-sb-identity-initials]"),
      date: /\d{2} [A-Z]{3} \d{4}/.test(document.querySelector("[data-sb-saved-entry]")?.textContent ?? ""),
    }));
    ok(panel.open && panel.entry === "m-rain" && panel.identity && panel.date, "the Saved surface lists the entry with its person and date");
    await page.evaluate(() => document.querySelector("[data-sb-saved-entry='m-rain']")?.click());
    await sleep(1200);
    const landed = await page.evaluate(() => ({ panel: !!document.querySelector("[data-sb-saved-panel]"), focused: document.activeElement?.closest("[data-sb-moment]")?.getAttribute("data-sb-moment") }));
    ok(!landed.panel && landed.focused === "m-rain", "choosing a saved entry lands on that exact Moment");

    /* ---- §2 the full loop ---- */
    console.log("§2 unsave + delete honesty");
    await menuOf(page, "m-rain");
    own = await items(page, "m-rain");
    ok(own[0] === "Remove from Saved", "a saved Moment's menu says so truthfully");
    await clickItem(page, "m-rain", "Remove from Saved");
    await openSaved(page);
    ok(!!(await page.$("[data-sb-saved-empty]")), "unsave empties the Saved surface — stated plainly");
    await page.keyboard.press("Escape");
    await sleep(200);
    // delete leaves no ghost
    await page.evaluate(async () => { for (let i = 0; i < 8 && document.querySelector("[data-sb-load-more]"); i++) { document.querySelector("[data-sb-load-more]").click(); await new Promise((r) => setTimeout(r, 250)); } });
    await page.evaluate(() => document.querySelector("[data-sb-moment='m-snow']")?.scrollIntoView({ block: "center" }));
    await sleep(200);
    await menuOf(page, "m-snow");
    await clickItem(page, "m-snow", "Save");
    await menuOf(page, "m-snow");
    await clickItem(page, "m-snow", "Delete");
    await page.evaluate((m) => [...document.querySelectorAll(`[data-sb-moment='${m}'] [role=menu] [role=menuitem]`)].find((x) => x.textContent.trim() === "Delete")?.click(), "m-snow");
    await sleep(500);
    const gone = await page.evaluate(() => window.__SB_SOCIAL_STATE.saved.includes("m-snow"));
    await openSaved(page);
    ok(!gone && !!(await page.$("[data-sb-saved-empty]")), "deleting a Moment leaves no ghost bookmark");
    await page.keyboard.press("Escape");
    await sleep(200);

    /* ---- §3 Share ---- */
    console.log("§3 Share without a repost engine");
    await open(page);
    await menuOf(page, "m-rain");
    let other = await items(page, "m-rain");
    ok(!other.some((x) => /Repost|Quote|Boost|Reshare/i.test(x)), "no repost grammar in any menu");
    // Share… appears exactly when the platform claims navigator.share — no dead item beyond that
    const hasNative = await page.evaluate(() => "share" in navigator);
    ok(other.includes("Share…") === hasNative, `Share… tracks the platform's own capability (navigator.share ${hasNative ? "present" : "absent"})`);
    await page.keyboard.press("Escape");
    await page.evaluate(() => { Object.defineProperty(navigator, "share", { value: (d) => { window.__SHARED = d; return Promise.resolve(); }, configurable: true }); });
    await menuOf(page, "m-rain");
    own = await items(page, "m-rain");
    ok(own.includes("Share…") && own.includes("Copy link"), `with native share available: Share… beside Copy link (${own.join(" · ")})`);
    await clickItem(page, "m-rain", "Share…");
    const shared = await page.evaluate(() => window.__SHARED);
    ok(!!shared && /\/m\/m-rain$/.test(shared.url), `Share hands the platform this Moment's own link (${shared?.url})`);

    /* ---- §4 preview pause ---- */
    console.log("§4 View as public");
    await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /View as public/.test(b.textContent))?.click());
    await sleep(700);
    await menuOf(page, "m-rain");
    const pv = await page.evaluate(() => [...document.querySelectorAll("[data-sb-moment='m-rain'] [role=menu] [role^=menuitem]")].map((x) => ({ t: x.textContent.trim(), off: x.getAttribute("aria-disabled") === "true" || x.disabled })));
    ok(pv[0]?.t === "Save" && pv[0]?.off, "the preview's stranger menu shows Save, paused — a preview writes nothing");
    await page.keyboard.press("Escape");
    await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /Return to My World/.test(b.textContent))?.click());
    await sleep(600);

    /* ---- §5 mobile + ne ---- */
    console.log("§5 mobile + ne");
    await open(page, PHONE);
    await menuOf(page, "m-rain");
    await clickItem(page, "m-rain", "Save");
    await openSaved(page);
    const mob = await page.evaluate(() => {
      const p = document.querySelector("[data-sb-saved-panel]");
      const e = document.querySelector("[data-sb-saved-entry]");
      const r = e?.getBoundingClientRect();
      return { open: !!p, fits: document.documentElement.scrollWidth <= innerWidth, h: r ? Math.round(r.height) : 0 };
    });
    ok(mob.open && mob.fits && mob.h >= 40, `the Saved surface works at 360 (fits, entry ${mob.h}px)`);
    await open(page, DESKTOP, "ne");
    await menuOf(page, "m-rain");
    const ne = await items(page, "m-rain");
    ok(/सुरक्षित/.test(ne[0] ?? ""), `Save speaks the catalog language (ne: “${ne[0]}”)`);

    ok(errs.length === 0, `no page errors${errs.length ? ` (${errs[0]})` : ""}`);
  } finally {
    await browser.close();
  }
  console.log(`\nsocial-s5-moment: ${passed} passed, ${failures.length} failed`);
  if (failures.length) { failures.forEach((f) => console.log(`  FAILED: ${f}`)); process.exitCode = 1; }
})();
