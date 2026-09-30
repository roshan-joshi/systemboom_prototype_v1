/**
 * SOCIAL WALL S6 — SEARCH + SAFETY EDGES (focused regression suite).
 *
 *   node prototype-tests/social-s6-safety.js        (dev server on :3210)
 *
 * §1 person report — quiet, last, announced; a report is not a block (nothing else changes)
 * §2 block — deliberately ABSENT everywhere (a recorded OWNER DECISION, never invented)
 * §3 chat edges — an unknown deep link lands on the truthful list, never a dead conversation
 * §4 world edges — an unknown ?profile= falls back to the viewer's own World
 * §5 localisation
 */
const { launch, sleep } = require("./celestial-lib");

const HOST = "http://localhost:3210";
let passed = 0;
const failures = [];
const ok = (c, m) => { if (c) { passed += 1; console.log(`  ✓ ${m}`); } else { failures.push(m); console.log(`  ✗ ${m}`); } };
const DESKTOP = { width: 1440, height: 950, deviceScaleFactor: 1 };

async function open(page, path, locale = "en") {
  await page.setCookie({ name: "sb-locale", value: locale, url: HOST });
  await page.setViewport(DESKTOP);
  await page.goto(`${HOST}${path}`, { waitUntil: "networkidle2" });
  await sleep(900);
}
async function openPerson(page, name) {
  await page.evaluate(() => { if (!document.querySelector("[data-sb-people-panel]")) document.querySelector("[data-sb-people]")?.click(); });
  await sleep(350);
  await page.evaluate((v) => { const f = document.querySelector("[data-sb-people-find]"); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(f, v); f.dispatchEvent(new Event("input", { bubbles: true })); }, name);
  await sleep(350);
  await page.evaluate(() => document.querySelector("[data-sb-people-row] button")?.click());
  await sleep(400);
}

(async () => {
  const { browser, page } = await launch();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  try {
    console.log("§1 person report");
    await open(page, "/style-lab/social?harness=0&theme=light");
    await openPerson(page, "beatrice");
    const before = await page.evaluate(() => {
      const c = document.querySelector("[data-sb-person-card]");
      const actions = [...c.querySelectorAll("[data-sb-person-actions] button")].map((b) => b.textContent.trim());
      return { actions, reportLast: actions[actions.length - 1] === "Report" };
    });
    ok(before.reportLast, `Report is the quietest, last action (${before.actions.join(" · ")})`);
    await page.evaluate(() => document.querySelector("[data-sb-person-report]")?.click());
    await sleep(300);
    const after = await page.evaluate(() => ({
      chip: document.querySelector("[data-sb-person-reported]")?.textContent.trim(),
      add: !!document.querySelector("[data-sb-person-card] [data-sb-add-friend]"),
      rel: document.querySelector("[data-sb-person-card]")?.getAttribute("data-sb-person-rel"),
    }));
    ok(after.chip === "Reported." && after.add && after.rel === "none", "reporting states itself and changes nothing else — a report is not a block");
    await page.keyboard.press("Escape");
    await sleep(200);

    console.log("§2 block stays an owner decision");
    const noBlock = await page.evaluate(() => !/(^|\s)Block(\s|$)/.test(document.body.textContent));
    ok(noBlock, "no invented Block control anywhere (recorded OWNER DECISION, options + recommendation in the ledger)");

    console.log("§3 chat edges");
    // chat is a signed-in surface — enter the demo identity first (the accepted gate flow)
    await open(page, "/world");
    const gate = await page.$("[role=dialog]");
    if (gate) {
      await page.evaluate(() => { [...document.querySelectorAll("[role=dialog] button")].find((x) => /Enter as Giulia Bianchi/.test(x.textContent))?.click(); });
      await sleep(800);
    }
    await open(page, "/chat?c=zzz-unknown");
    const chat = await page.evaluate(() => ({
      dead: !!document.querySelector("[data-sb-chat-active]"),
      textareaCount: document.querySelectorAll("textarea").length,
      list: /No conversations yet|conversations/i.test(document.body.textContent),
    }));
    ok(!chat.dead && chat.list, "an unknown chat deep link lands on the truthful conversation list — never a dead conversation");
    await open(page, "/chat?c=p-asha");
    const known = await page.evaluate(() => document.body.textContent.includes("Sofia Romano"));
    ok(known, "a real person's deep link still lands in their conversation");

    console.log("§4 world edges");
    await open(page, "/style-lab/social?harness=0&theme=light&profile=not-a-person");
    const hero = await page.evaluate(() => document.querySelector("[data-sb-hero]")?.getAttribute("data-sb-hero"));
    ok(hero === "owner", "an unknown ?profile= falls back to the viewer's own World, no crash");

    console.log("§5 ne");
    await open(page, "/style-lab/social?harness=0&theme=light", "ne");
    await openPerson(page, "beatrice");
    const ne = await page.evaluate(() => document.querySelector("[data-sb-person-report]")?.textContent.trim() ?? "");
    ok(/रिपोर्ट/.test(ne), `Report speaks the catalog language (ne: “${ne}”)`);

    ok(errs.length === 0, `no page errors${errs.length ? ` (${errs[0]})` : ""}`);
  } finally {
    await browser.close();
  }
  console.log(`\nsocial-s6-safety: ${passed} passed, ${failures.length} failed`);
  if (failures.length) { failures.forEach((f) => console.log(`  FAILED: ${f}`)); process.exitCode = 1; }
})();
