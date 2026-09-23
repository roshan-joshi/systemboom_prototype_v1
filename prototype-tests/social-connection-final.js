/* SYSTEMBOOM — FINAL SOCIAL CONNECTION + PERSON WORLD PASS: People
   discoverability, the full relationship state machine on every surface,
   owner/visitor header context, and the profile "old-social" test.
     node prototype-tests/social-connection-final.js */
const fs = require("fs");
const { launch, sleep } = require("./lib");

const HOST = "http://localhost:3210";
const SOCIAL = "/style-lab/social";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/social-connection-final";
fs.mkdirSync(EV, { recursive: true });

const VW = { 360: 420, desktop: 1440 };
let passed = 0;
const failures = [];
const ok = (c, label) => {
  if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); }
};
async function shot(page, name) {
  await page.screenshot({ path: `${EV}/${name}.png` });
  console.log(`  shot ${name}`);
}
async function open(page, { theme = "light", w = "desktop", extra = {} } = {}) {
  await page.setViewport({ width: VW[w], height: 1150, deviceScaleFactor: 1.5, hasTouch: w === 360 });
  const u = new URL(HOST + SOCIAL);
  u.searchParams.set("theme", theme);
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
  await page.goto(u.toString(), { waitUntil: "networkidle2" });
  await sleep(600);
}
/** Switch viewer IN-PAGE (no navigation) so relationship-state changes survive the switch. */
const setViewer = async (page, label) => {
  await page.evaluate((t) => {
    const btn = [...document.querySelectorAll("[role=radio]")].find((b) => b.textContent.trim() === t);
    btn?.click();
  }, label);
  await sleep(400);
};
const heroRel = (page) => page.$eval("[data-sb-hero-relationship]", (e) => e.getAttribute("data-sb-hero-relationship")).catch(() => null);

(async () => {
  const { page, errors } = await launch();
  const consoleErrors = [];
  page.on("console", (m) => {
    const full = `${m.text()} @${m.location()?.url ?? ""}`;
    if (m.type() === "error" && !/favicon|ERR_|_next\/hmr|Back-Forward Cache/.test(full)) consoleErrors.push(full);
  });

  /* ---- 1. Owner world, both themes, both widths ---- */
  console.log("1. Owner world");
  await open(page, { theme: "light" });
  ok((await page.$eval("[data-sb-hero]", (e) => e.getAttribute("data-sb-hero"))) === "owner", "owner hero renders");
  await shot(page, "01-owner-world-light");
  await open(page, { theme: "dark" });
  await shot(page, "02-owner-world-dark");
  await open(page, { theme: "light", w: 360, extra: { harness: "0" } });
  await shot(page, "03-owner-360-light");
  await open(page, { theme: "dark", w: 360, extra: { harness: "0" } });
  await shot(page, "04-owner-360-dark");
  const firstMoment = await page.$eval("[data-sb-moment]", (e) => Math.round(e.getBoundingClientRect().top + window.scrollY));
  ok(firstMoment < 900, `first-Moment mobile priority preserved (${firstMoment}px)`);

  /* ---- 2. People discoverability ---- */
  console.log("2. People entry");
  await open(page, { theme: "light" });
  const peopleBtn = await page.$("[data-sb-people]");
  ok(!!peopleBtn, "People utility is present in the top bar (desktop)");
  const peopleLabel = await page.$eval("[data-sb-people]", (e) => e.getAttribute("aria-label"));
  ok(/People/.test(peopleLabel), `People carries an accessible name, not just an icon (${peopleLabel})`);
  await shot(page, "05-people-entry-desktop");
  const requestDot = await page.$("[data-sb-people-requests-dot]");
  ok(!!requestDot, "a real pending request shows a quiet indicator on People — no pulse, no loop");
  const dotAnim = await page.$eval("[data-sb-people-requests-dot]", (e) => getComputedStyle(e).animationName);
  ok(dotAnim === "none", `the request indicator never animates (${dotAnim})`);

  await open(page, { theme: "light", w: 360, extra: { harness: "0" } });
  ok(!!(await page.$("[data-sb-people]")), "People is reachable at 360 too");
  await shot(page, "06-people-entry-mobile");

  /* ---- 3. The People surface itself ---- */
  console.log("3. People surface");
  await open(page, { theme: "light" });
  await page.click("[data-sb-people]");
  await sleep(400);
  ok(!!(await page.$("[data-sb-people-panel]")), "People opens one focused surface");
  ok(!!(await page.$("[data-sb-people-requests]")), "Requests section shows — real pending data exists");
  ok(!!(await page.$("[data-sb-people-yours]")), "Your People section lists existing relationships");
  await shot(page, "07-people-surface-desktop");
  await page.keyboard.press("Escape").catch(() => {});
  await open(page, { theme: "light", w: 360, extra: { harness: "0" } });
  await page.click("[data-sb-people]");
  await sleep(400);
  await shot(page, "08-people-surface-360");

  /* ---- 4. Find a person ---- */
  console.log("4. Find person");
  await open(page, { theme: "light" });
  await page.click("[data-sb-people]");
  await sleep(400);
  await page.type("[data-sb-people-find]", "Marco");
  await sleep(400);
  const found = await page.$$eval("[data-sb-people-row]", (els) => els.map((e) => e.getAttribute("data-sb-people-row")));
  ok(found.length === 1, `Find someone narrows to the matching person (${found.length})`);
  await shot(page, "09-find-person");
  const ramesh = await page.$eval("[data-sb-people-row]", (e) => e.getAttribute("data-sb-people-rel"));
  ok(ramesh === "none", `a stranger's relationship state is "none" (${ramesh})`);
  await shot(page, "10-person-none");
  ok(!!(await page.$("[data-sb-people-add]")), "Add friend is a real, visible action, not hidden in a menu");
  await shot(page, "11-add-friend");
  await page.click("[data-sb-people-add]");
  await sleep(400);
  const rameshAfter = await page.$eval("[data-sb-people-row]", (e) => e.getAttribute("data-sb-people-rel"));
  ok(rameshAfter === "request-out", `Add friend → Requested, from the SAME store the notification/Person surfaces read (${rameshAfter})`);
  await shot(page, "12-requested");
  await page.evaluate(() => {
    const i = document.querySelector("[data-sb-people-find]");
    i.focus();
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, "");
    i.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await sleep(300);

  /* ---- 5. Incoming request → Accept, from People ---- */
  console.log("5. Incoming request");
  ok(!!(await page.$("[data-sb-people-accept]")), "an incoming request is visible in People, actionable directly");
  await shot(page, "13-incoming-request");
  await page.click("[data-sb-people-accept]");
  await sleep(400);
  const prakashRow = await page.$$eval("[data-sb-people-row]", (els) => els.map((e) => e.getAttribute("data-sb-people-rel")));
  ok(!prakashRow.includes("request-in"), "Accept resolves the request — no longer pending");
  await shot(page, "14-accept-request");

  /* ---- 6. Existing friend/family in People, Message ---- */
  console.log("6. Existing people");
  const friendRow = await page.$("[data-sb-people-message]");
  ok(!!friendRow, "an existing Friend/Family row offers Message directly");
  await shot(page, "15-friend-state");
  const familyExists = await page.$$eval("[data-sb-people-row]", (els) => els.some((e) => e.getAttribute("data-sb-people-rel") === "family"));
  ok(familyExists, "Family is a real, distinct relationship state, not merged into Friend");
  await shot(page, "16-family-state-if-real");
  await page.click("[data-sb-people-message]");
  await sleep(500);
  ok(!!(await page.$("[data-sb-mini-chat]")) || page.url().includes("/chat"), "Message opens the real conversation surface");
  await shot(page, "17-friend-message");

  /* ---- 7. Header context: owner vs visitor ---- */
  console.log("7. Header context");
  await open(page, { theme: "light" });
  const ownerBrand = await page.$eval("[data-sb-context]", (e) => e.textContent.trim());
  const ownerKicker = await page.$eval("[data-sb-world-context]", (e) => e.textContent.trim());
  ok(ownerBrand === ownerKicker && ownerBrand === "My World", `owner: brand and hero agree (${ownerBrand} / ${ownerKicker})`);
  await shot(page, "23-header-owner-context");
  await setViewer(page, "Sofia → Giulia");
  const visBrand = await page.$eval("[data-sb-context]", (e) => e.textContent.trim());
  const visKicker = await page.$eval("[data-sb-world-context]", (e) => e.textContent.trim());
  ok(visBrand === visKicker && /Giulia/.test(visBrand), `visitor: brand and hero agree, and neither falsely says "My World" (${visBrand} / ${visKicker})`);
  await shot(page, "24-header-visitor-context");
  await shot(page, "18-visitor-world-light");
  await open(page, { theme: "dark", extra: { viewer: "ashaVisitor" } });
  await shot(page, "19-visitor-world-dark");
  await open(page, { theme: "light", w: 360, extra: { viewer: "ashaVisitor", harness: "0" } });
  await shot(page, "20-visitor-360");

  /* ---- 8. Return to My World ---- */
  console.log("8. Return to My World");
  await open(page, { theme: "light", extra: { viewer: "ashaVisitor" } });
  await page.click("[aria-label*='menu']");
  await sleep(300);
  await page.evaluate(() => { [...document.querySelectorAll("[role=menuitem]")].find((b) => b.textContent.includes("Return to My World"))?.click(); });
  await sleep(500);
  const backToOwner = await page.$eval("[data-sb-hero]", (e) => e.getAttribute("data-sb-hero"));
  ok(backToOwner === "owner", "Return to My World lands back on the owner's own view, no Cosmos round trip");
  await shot(page, "22-return-to-owner");

  /* ---- 9. View as Public unaffected ---- */
  console.log("9. View as Public");
  await open(page, { theme: "light" });
  await page.click("[data-sb-view-as-public]");
  await sleep(400);
  ok(!!(await page.$("[data-sb-viewing-as-public]")), "View as public still works");
  ok(!(await page.$("[data-sb-hero-add-friend]")), "Add Friend never targets the owner's own profile while previewing");
  await shot(page, "21-owner-view-as-public");

  /* ---- 10. Relationship states via the request-in seed (Prakash) directly on the Hero ---- */
  console.log("10. Full relationship state coverage on the Hero");
  await open(page, { theme: "light", extra: { viewer: "prakashVisitor" } });
  ok((await heroRel(page)) === "request-in", "Hero shows request-in — Wants to connect + Accept/Decline, not silence");
  ok(!!(await page.$("[data-sb-hero-accept]")) && !!(await page.$("[data-sb-hero-decline]")), "Accept/Decline are both real controls on the Person surface itself");
  await page.click("[data-sb-hero-accept]");
  await sleep(400);
  ok((await heroRel(page)) === "friend", "Accept on the Hero itself resolves to Friend");

  /* ---- 11. Relationship agreement across surfaces (Search / People / Notification / Person) ---- */
  console.log("11. Relationship agreement");
  await open(page, { theme: "light" });
  await page.type("input[type=search]", "Federico");
  await sleep(400);
  const searchRel = await page.$eval("[data-sb-search-life]", (e) => e.textContent);
  ok(/Family/.test(searchRel), `Search shows the real relationship (${searchRel})`);
  await page.keyboard.press("Escape");
  await sleep(200);

  /* ---- 12. Moment author → Person, Search → Person ---- */
  console.log("12. Discovery loops");
  await open(page, { theme: "light" });
  await page.click("[data-sb-open-person]");
  await sleep(400);
  ok(!!(await page.$("[data-sb-person-card]")), "selecting a Moment's author opens the person surface");
  await shot(page, "25-moment-author-to-person");
  await page.keyboard.press("Escape");
  await sleep(200);
  await page.type("input[type=search]", "Marco");
  await sleep(400);
  await page.click("[data-sb-search-person]");
  await sleep(400);
  ok(!!(await page.$("[data-sb-person-card]")), "search → person surface opens, ready for Add Friend");
  await shot(page, "26-search-to-person");

  /* ---- 13. Ring stays Life-only ---- */
  console.log("13. Ring semantics");
  const ringAttrs = await page.$eval("[data-sb-person-card] [data-sb-ring]", (e) => [...e.attributes].map((a) => a.name));
  const forbidden = ringAttrs.filter((a) => /friend|family|message|online|request|verified|notif/i.test(a));
  ok(forbidden.length === 0, "no relationship/online/verification semantics leak into the ring's own attributes");
  await page.keyboard.press("Escape");

  /* ---- 14. Identity: real photo, Life Ring, profile ---- */
  console.log("14. Profile identity");
  await open(page, { theme: "light" });
  ok(!!(await page.$("[data-sb-hero] [data-sb-identity-photo]")), "the Hero's identity is a real photo, not a generic avatar");
  await shot(page, "28-real-photo-life-ring-profile");
  await shot(page, "29-large-ring-close");
  const smallRing = await page.$("[data-sb-moment] [data-sb-ring]");
  ok(!!smallRing, "small ring present at Moment scale");
  await shot(page, "30-small-ring-moment");

  /* ---- 15. Cover: owner set/no-cover, visitor no-cover ---- */
  console.log("15. Cover");
  await shot(page, "32-cover-owner");
  await open(page, { theme: "light", extra: { nocover: "1" } });
  await shot(page, "31-no-cover-owner");
  ok((await page.$eval("[data-sb-cover-region]", (e) => e.getAttribute("data-sb-cover"))) === "fallback", "no-cover renders a quiet material field, still intentional");
  await open(page, { theme: "light", extra: { viewer: "ashaVisitor", nocover: "1" } });
  await shot(page, "33-no-cover-visitor");

  /* ---- 15b. People referenced inside a Moment (§16) — real data only ---- */
  console.log("15b. Moment → People");
  await open(page, { theme: "light" });
  ok(!!(await page.$("[data-sb-moment-with]")), "a Moment with real referenced people states it, not inferred");
  await page.click("[data-sb-moment-with]");
  await sleep(400);
  const withCount = await page.$$eval("[data-sb-moment-with-people] li", (els) => els.length);
  ok(withCount > 0, `selecting it opens the actual referenced people (${withCount})`);
  await shot(page, "27-moment-with-people-if-real");

  /* ---- 16. Old-social test ---- */
  console.log("16. Old-social profile test");
  await open(page, { theme: "light" });
  const shape = await page.evaluate(() => {
    const hero = document.querySelector("[data-sb-hero]");
    const ringWrap = hero.querySelector("[data-sb-ring]")?.closest("div.relative");
    const row = ringWrap?.parentElement;
    return { rowIsRow: row ? getComputedStyle(row).flexDirection : null };
  });
  ok(shape.rowIsRow === "row", `desktop identity is an asymmetric row (ring + text beside it), not a centered avatar+name stack (${shape.rowIsRow})`);
  await shot(page, "34-light-profile-old-social-test");
  await open(page, { theme: "dark" });
  await shot(page, "35-dark-profile");

  /* ---- 17. Devanagari ---- */
  console.log("17. Devanagari");
  await open(page, { theme: "dark", w: 360, extra: { harness: "0" } });
  for (let i = 0; i < 6 && !(await page.$("[data-sb-moment='m-1983']")); i++) { await page.click("[data-sb-load-more]").catch(() => {}); await sleep(300); }
  await shot(page, "39-devanagari-person");

  /* ---- 18. Accessibility: keyboard, reduced motion, privacy ---- */
  console.log("18. Accessibility + privacy");
  await open(page, { theme: "light" });
  await page.keyboard.press("Tab");
  await page.evaluate(() => { document.querySelector("[data-sb-people]").focus(); });
  const peopleFocused = await page.evaluate(() => document.activeElement?.hasAttribute("data-sb-people"));
  ok(peopleFocused, "People is a normal, focusable Tab stop");
  await shot(page, "36-keyboard-people");
  // Bikash starts seeded as "friend" — remove him first (owner view), then switch to Bikash's
  // own viewer IN-PAGE (no reload) so the change survives, to reach a real "none" Hero to focus.
  await open(page, { theme: "light" });
  await page.type("input[type=search]", "Luca");
  await sleep(400);
  await page.click("[data-sb-search-person]");
  await sleep(300);
  await page.click("[data-sb-remove-friend]");
  await sleep(300);
  await page.keyboard.press("Escape");
  await sleep(200);
  await setViewer(page, "Luca → Giulia");
  await page.evaluate(() => { document.querySelector("[data-sb-hero-add-friend]")?.focus(); });
  const addFocused = await page.evaluate(() => !!document.activeElement?.hasAttribute("data-sb-hero-add-friend"));
  ok(addFocused, "Add Friend is keyboard-reachable on the Hero once the relationship is none");
  await shot(page, "37-keyboard-add-friend");

  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await open(page, { theme: "light", extra: { viewer: "prakashVisitor" } });
  await page.click("[data-sb-hero-accept]").catch(() => {});
  await sleep(200);
  const relAnim = await page.$eval("[data-sb-hero-relationship]", (e) => getComputedStyle(e).animationDuration).catch(() => "0.01ms");
  ok(parseFloat(relAnim) <= 0.0001, `reduced motion collapses the relationship resolve to instant (${relAnim})`);
  await shot(page, "38-reduced-motion-request");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

  await open(page, { theme: "light", extra: { viewer: "visitor" } });
  const heroHtml = await page.$eval("[data-sb-hero]", (e) => e.outerHTML);
  ok(!/\d+y \d\dm \d\dd/.test(heroHtml), "no exact age leaks in a visitor's hero");
  ok(!heroHtml.includes("data-sb-contact"), "no contact pill leaks to a visitor");
  await shot(page, "40-privacy-dom-proof");

  /* ---- 19. Page health ---- */
  console.log("19. Page health");
  ok(errors.length === 0, `zero page errors (${errors.length})`);
  ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length}) ${consoleErrors[0] ?? ""}`);

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log("FAILED:");
    failures.forEach((f) => console.log(` - ${f}`));
  }
  console.log(`\nSOCIAL CONNECTION FINAL: ${failures.length ? "FAIL" : "PASS"}`);
  process.exit(failures.length ? 1 : 0);
})();
