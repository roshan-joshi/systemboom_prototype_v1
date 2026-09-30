/**
 * SOCIAL WALL S4 — SIGNAL: NOTIFICATIONS THAT LAND EXACTLY (focused regression suite).
 *
 *   node prototype-tests/social-s4-signal.js        (dev server on :3210)
 *
 * §1 event truth — every seeded event names a real thing that really happened (the mention
 *    text exists on the named response; the reply IS a reply to the owner's own response)
 * §2 exact landing — "responded" lands on THAT response inside the conversation, desktop
 *    (inline) and phone (focused surface) alike; the earlier-batch window widens by itself
 * §3 person events — "accepted your friend request" opens the person, who IS a friend
 * §4 no engagement arithmetic — no combined totals, no "17 engagements", chat stays out of
 *    the bell (message-unread has its own badge; accepted rule)
 */
const { launch, sleep } = require("./celestial-lib");

const HOST = "http://localhost:3210";
const B = `${HOST}/style-lab/social?harness=0&theme=light`;
let passed = 0;
const failures = [];
const ok = (c, m) => { if (c) { passed += 1; console.log(`  ✓ ${m}`); } else { failures.push(m); console.log(`  ✗ ${m}`); } };
const DESKTOP = { width: 1440, height: 950, deviceScaleFactor: 1 };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

async function open(page, vp = DESKTOP, locale = "en") {
  await page.setCookie({ name: "sb-locale", value: locale, url: HOST });
  await page.setViewport(vp);
  await page.goto(B, { waitUntil: "networkidle2" });
  await sleep(900);
}
const bell = async (page) => { await page.click("[data-sb-bell]"); await sleep(400); };
const clickEvent = async (page, re) => { await page.evaluate((r) => [...document.querySelectorAll("[data-sb-notifications] button")].find((b) => new RegExp(r).test(b.textContent))?.click(), re.source); await sleep(1400); };

(async () => {
  const { browser, page } = await launch();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  try {
    /* ---- §1 event truth ---- */
    console.log("§1 every event is true");
    await open(page);
    const st = await page.evaluate(() => window.__SB_SOCIAL_STATE);
    const note = (mid, nid) => st.moments.find((m) => m.id === mid)?.notes.find((x) => x.id === nid);
    const vid = note("m-video", "n-vid-1");
    ok(!!vid && /@Giulia Bianchi/.test(vid.text) && vid.mentions?.[0] === "u-demo-001", "the mention event's response really mentions the owner (chosen id, real text)");
    const reply = note("m-forty", "n-forty-23");
    ok(reply?.parentId === "n-forty-22" && note("m-forty", "n-forty-22")?.authorId === "u-demo-001", "the reply event IS a reply to the owner's own response");
    const boomed = note("m-forty", "n-forty-22");
    ok(boomed?.expressions?.["p-sunita"] === "thanks", "the response-boom event's feeling really sits on that response");
    ok(st.notifications.every((n) => !/engagement|activity on|and \d+ others?/i.test(n.text)), "no aggregated engagement grammar anywhere in the fixtures");

    /* ---- §2 exact landing ---- */
    console.log("§2 exact landing");
    await bell(page);
    await page.evaluate(() => document.querySelector("[data-sb-notification-moment='m-rain']").click());
    await sleep(1200);
    let land = await page.evaluate(() => ({
      panel: !!document.querySelector("[data-sb-notifications]"),
      focused: document.activeElement?.getAttribute("data-sb-note"),
      settled: document.querySelector("[data-sb-note='n-rain-1']")?.hasAttribute("data-sb-focused"),
    }));
    ok(!land.panel && land.focused === "n-rain-1" && land.settled, "desktop: 'responded' lands ON that response, focused and settled, panel closed");

    await open(page, PHONE);
    await bell(page);
    await clickEvent(page, /replied to your response/);
    land = await page.evaluate(() => ({
      surface: !!document.querySelector("[data-sb-conversation-surface]"),
      focused: document.activeElement?.getAttribute("data-sb-note"),
    }));
    ok(land.surface && land.focused === "n-forty-23", "phone: 'replied' opens the focused conversation ON the reply itself");
    // the earlier-batch widening: an event can name a response before the latest 20
    await page.evaluate(() => document.querySelector("[data-sb-conversation-surface] header button")?.click());
    await sleep(400);
    await page.evaluate(() => window.dispatchEvent(new CustomEvent("sb-focus-note", { detail: { momentId: "m-forty", noteId: "n-forty-2" } })));
    await sleep(1200);
    const early = await page.evaluate(() => ({
      top: document.querySelectorAll("[data-sb-conversation-surface] [data-sb-note][data-sb-depth='1']").length,
      focused: document.activeElement?.getAttribute("data-sb-note"),
    }));
    ok(early.top === 27 && early.focused === "n-forty-2", "…a response before the latest batch widens the window by itself and still lands exactly");
    await page.evaluate(() => document.querySelector("[data-sb-conversation-surface] header button")?.click());
    await sleep(300);
    // response-boom lands on the boomed response
    await bell(page);
    await clickEvent(page, /felt thanks about your response/);
    land = await page.evaluate(() => ({ focused: document.activeElement?.getAttribute("data-sb-note") }));
    ok(land.focused === "n-forty-22", "'felt thanks about your response' lands on the exact response that was felt about");
    await page.evaluate(() => document.querySelector("[data-sb-conversation-surface] header button")?.click());
    await sleep(300);
    // moment-boom lands on the Moment (no note)
    await bell(page);
    await clickEvent(page, /felt joy about your Thamel moment/);
    land = await page.evaluate(() => ({ conv: !!document.querySelector("[data-sb-conversation-surface]"), focused: document.activeElement?.closest("[data-sb-moment]")?.getAttribute("data-sb-moment") }));
    ok(!land.conv && land.focused === "m-rain", "'felt joy about your moment' lands on the Moment itself — no conversation forced open");

    /* ---- §3 person events ---- */
    console.log("§3 person events");
    await open(page);
    await bell(page);
    await clickEvent(page, /accepted your friend request/);
    const card = await page.evaluate(() => ({ id: document.querySelector("[data-sb-person-card]")?.getAttribute("data-sb-person-card"), rel: document.querySelector("[data-sb-person-card]")?.getAttribute("data-sb-person-rel") }));
    ok(card.id === "p-marcus" && card.rel === "friend", "'accepted your friend request' opens the person — who really is a friend");
    await page.keyboard.press("Escape");
    await sleep(200);

    /* ---- §4 separation of signals ---- */
    console.log("§4 no engagement arithmetic");
    await bell(page);
    const sep = await page.evaluate(() => ({
      text: document.querySelector("[data-sb-notifications]")?.textContent ?? "",
      chatRows: [...document.querySelectorAll("[data-sb-notifications] button")].filter((b) => /message|chat/i.test(b.textContent)).length,
    }));
    ok(sep.chatRows === 0, "chat stays out of the bell — message-unread keeps its own truthful badge");
    ok(!/\d+ (engagements|interactions|reactions)/i.test(sep.text), "no combined engagement totals anywhere");

    ok(errs.length === 0, `no page errors${errs.length ? ` (${errs[0]})` : ""}`);
  } finally {
    await browser.close();
  }
  console.log(`\nsocial-s4-signal: ${passed} passed, ${failures.length} failed`);
  if (failures.length) { failures.forEach((f) => console.log(`  FAILED: ${f}`)); process.exitCode = 1; }
})();
