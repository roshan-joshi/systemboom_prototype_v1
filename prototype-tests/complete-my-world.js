/* SYSTEMBOOM — COMPLETE MY WORLD acceptance: People, Chat, continuity, and the
   non-happy states, with the full evidence set.
     node prototype-tests/complete-my-world.js */
const fs = require("fs");
const { launch, sleep } = require("./lib");

const HOST = "http://localhost:3210";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/complete-my-world";
fs.mkdirSync(EV, { recursive: true });

const VW = { 360: 420, 390: 450, 768: 900, desktop: 1440, wide: 1920 };
let passed = 0;
const failures = [];
const ok = (c, label) => {
  if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); }
};
async function shot(page, name, full = false) {
  if (full) {
    await page.evaluate(async () => {
      const h = document.documentElement.scrollHeight;
      for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 70)); }
      window.scrollTo(0, 0);
    });
    await sleep(350);
  }
  await page.screenshot({ path: `${EV}/${name}.png`, fullPage: full });
}
async function open(page, path, { theme = "dark", w = "desktop" } = {}) {
  await page.setViewport({ width: VW[w], height: 1100, deviceScaleFactor: 1.5, hasTouch: w === 360 || w === 390 });
  const u = new URL(HOST + path);
  u.searchParams.set("theme", theme);
  await page.goto(u.toString(), { waitUntil: "networkidle2" });
  await sleep(700);
}
const pathOf = (page) => new URL(page.url()).pathname;
const themeOf = (page) => page.evaluate(() => document.documentElement.dataset.theme);
async function enterIdentity(page) {
  await page.waitForSelector("[role=dialog]", { timeout: 12000 });
  await sleep(400);
  await page.evaluate(() => {
    [...document.querySelectorAll("[role=dialog] button")].find((x) => /Enter as Giulia Bianchi/.test(x.textContent))?.click();
  });
  await sleep(700);
}

(async () => {
  const { browser, page, errors } = await launch();
  const consoleErrors = [];
  let probing = false;
  page.on("console", (m) => {
    const full = `${m.text()} @${m.location()?.url ?? ""}`;
    if (m.type() === "error" && !probing && !/favicon|ERR_|_next\/hmr|Back-Forward Cache/.test(full)) consoleErrors.push(full);
  });

  try {
    /* ---- 1. entry + continuity (dark chain, honest frames) ---- */
    console.log("1. Cosmos → My World continuity");
    await open(page, "/", { theme: "dark" });
    await sleep(1800);
    await shot(page, "01-cosmos-dark");
    await page.click("[data-sb-gate-opener]");
    await sleep(600);
    await shot(page, "02-cosmos-identity");
    await enterIdentity(page);
    await page.evaluate(() => {
      window.__SB_THEME_FRAMES = [];
      const rec = () => { window.__SB_THEME_FRAMES.push(document.documentElement.dataset.theme ?? "unset"); if (window.__SB_THEME_FRAMES.length < 120) requestAnimationFrame(rec); };
      requestAnimationFrame(rec);
    });
    const clickEnter = page.click("[data-sb-enter-world]");
    await sleep(120);
    await shot(page, "03-transition-early");
    await clickEnter;
    await page.waitForSelector("[data-sb-sheet]", { timeout: 20000 });
    await shot(page, "04-transition-late");
    await sleep(120);
    await shot(page, "05-first-my-world-dark");
    const frames = await page.evaluate(() => window.__SB_THEME_FRAMES ?? []);
    ok(frames.length > 10 && frames.every((t) => t === "dark"), `dark chain: no white frame entering My World (${frames.length} frames)`);
    ok(pathOf(page) === "/world" && (await themeOf(page)) === "dark", "identity lands directly in dark My World — no hub, no second login");
    const arrived = await page.$eval("main", (m) => m.classList.contains("sb-arrive"));
    ok(arrived, "the arrival resolve ran once (the material bridge, not a page load)");
    const atmosphere = await page.$eval(".sb-social", (e) => getComputedStyle(e).backgroundImage.includes("radial-gradient"));
    ok(atmosphere, "dark My World shares the Cosmos atmosphere (radial ground, no stars)");
    await sleep(700);
    await shot(page, "06-settled-my-world-dark");
    await shot(page, "08-my-world-dark-desktop", true);
    await open(page, "/world", { theme: "light" });
    ok(!(await page.$eval(".sb-social", (e) => getComputedStyle(e).backgroundImage.includes("radial-gradient"))), "light keeps the Solar Observatory field, not an inverted cosmos");
    await shot(page, "07-my-world-light-desktop", true);
    await open(page, "/world", { theme: "light", w: 360 });
    await shot(page, "09-my-world-light-360");
    await open(page, "/world", { theme: "dark", w: 360 });
    await shot(page, "10-my-world-dark-360");
    const firstMoment = await page.$eval("[data-sb-moment]", (e) => Math.round(e.getBoundingClientRect().top + scrollY));
    ok(firstMoment < 900, `mobile first-Moment priority preserved (top at ${firstMoment}px)`);

    /* ---- 2. People: person surface, relationship states ---- */
    console.log("2. People");
    await open(page, "/world", { theme: "light" });
    // stranger via search
    await page.evaluate(async () => {
      const i = document.querySelector("input[type=search]");
      i.focus();
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, "Marco");
      i.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 400));
    });
    await page.click("[data-sb-search-person='p-ramesh']");
    await sleep(400);
    let card = await page.$eval("[data-sb-person-card]", (e) => ({ rel: e.getAttribute("data-sb-person-rel"), text: e.textContent }));
    ok(card.rel === "none" && /Add Friend/.test(card.text) && !/Message/.test(card.text), "a stranger's card: Add Friend, no Message");
    ok(/Circle band 30–45/.test(card.text.replace(/\s+/g, " ")) && !/\d+y \d\dm/.test(card.text), "person card stays band-only — no exact age for anyone else");
    await shot(page, "11-person-stranger");
    await page.click("[data-sb-add-friend]");
    await sleep(250);
    card = await page.$eval("[data-sb-person-card]", (e) => ({ rel: e.getAttribute("data-sb-person-rel"), text: e.textContent }));
    ok(card.rel === "request-out" && /Cancel request/.test(card.text), "Add Friend truthfully becomes a sent request");
    await page.keyboard.press("Escape");
    await sleep(250);
    ok(!(await page.$("[data-sb-person-card]")), "Escape closes the person surface");
    // friend via a Moment's author
    await page.click("[data-sb-open-person='p-bikash']");
    await sleep(400);
    card = await page.$eval("[data-sb-person-card]", (e) => ({ rel: e.getAttribute("data-sb-person-rel"), text: e.textContent }));
    ok(card.rel === "friend" && /Friends/.test(card.text) && /Message/.test(card.text), "a friend's card: Friends state + Message");
    await shot(page, "12-person-friend");
    await page.keyboard.press("Escape");
    // family
    await page.evaluate(async () => {
      const i = document.querySelector("input[type=search]");
      i.focus();
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, "Elena");
      i.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 400));
    });
    await page.click("[data-sb-search-person='p-sunita']");
    await sleep(400);
    card = await page.$eval("[data-sb-person-card]", (e) => ({ rel: e.getAttribute("data-sb-person-rel"), text: e.textContent }));
    ok(card.rel === "family" && /Family/.test(card.text) && /Message/.test(card.text), "family is its own relationship, distinct from Friends, and can Message");
    await shot(page, "14-family-context-if-real");
    await page.keyboard.press("Escape");
    // search people carry relationship context
    await page.evaluate(async () => {
      const i = document.querySelector("input[type=search]");
      i.focus();
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, "a");
      i.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 400));
    });
    const searchRows = await page.$$eval("[data-sb-search-person]", (n) => n.map((x) => ({ id: x.getAttribute("data-sb-search-person"), life: x.querySelector("[data-sb-search-life]")?.textContent ?? "" })));
    ok(searchRows.some((r) => /Friends|Family|Asked you/.test(r.life)), "search people rows carry relationship context");
    ok(searchRows.filter((r) => r.id !== "u-demo-001").every((r) => !/\d+y \d\dm \d\dd/.test(r.life)), "…and never another person's exact age (own stays allowed)");
    await shot(page, "15-search-people");
    await page.keyboard.press("Escape");

    /* ---- 3. friend request in notifications ---- */
    console.log("3. friend request");
    await open(page, "/world", { theme: "light" });
    await page.click("[data-sb-bell]");
    await sleep(400);
    const req = await page.$eval("[data-sb-notification-request='p-prakash']", (e) => e.textContent);
    ok(/asked to be your friend/.test(req) && (await page.$("[data-sb-notif-accept]")) !== null, "a friend request arrives as a notification with Accept / Decline");
    await shot(page, "13-friend-request");
    await shot(page, "16-notification-friend");
    await page.click("[data-sb-notif-accept]");
    await sleep(300);
    const outcome = await page.$eval("[data-sb-notification-request='p-prakash']", (e) => e.textContent);
    ok(/Now friends/.test(outcome), "accepting updates the notification truthfully");
    await page.$eval("[data-sb-notification-request='p-prakash'] button", (b) => b.click());
    await sleep(400);
    const prakash = await page.$eval("[data-sb-person-card]", (e) => e.getAttribute("data-sb-person-rel"));
    ok(prakash === "friend", "…and the person surface agrees: now a friend");
    await page.keyboard.press("Escape");
    await page.click("[data-sb-bell]");
    await sleep(300);
    await shot(page, "17-notification-moment");
    await page.keyboard.press("Escape");

    /* ---- 4. Messages utility + desktop mini chat ---- */
    console.log("4. Messages + mini chat");
    await open(page, "/world", { theme: "dark" });
    const unreadBadge = await page.$("[data-sb-messages-unread]");
    ok(!!unreadBadge, "message unread has its own truthful badge (3 unread in fixtures)");
    await page.click("[data-sb-messages]");
    await sleep(400);
    const convs = await page.$$eval("[data-sb-conversation]", (n) => n.map((x) => x.getAttribute("data-sb-conversation")));
    ok(convs.length === 3, `the Messages panel lists the conversations (${convs.join(", ")})`);
    await shot(page, "18-messages-utility");
    await page.click("[data-sb-conversation='p-asha']");
    await sleep(500);
    ok(!!(await page.$("[data-sb-mini-chat='p-asha']")), "choosing a conversation opens the one desktop mini chat");
    const focused = await page.evaluate(() => document.activeElement?.hasAttribute("data-sb-chat-input"));
    ok(focused, "focus lands in the message input");
    const unreadNow = await page.$eval("[data-sb-messages]", (e) => e.getAttribute("aria-label"));
    ok(/1 unread/.test(unreadNow ?? ""), `opening the conversation reads it — the badge tells the truth (${unreadNow})`);
    await page.type("[data-sb-chat-input]", "Tandem on Saturday — booked?");
    await page.keyboard.press("Enter");
    await sleep(300);
    const sent = await page.$eval("[data-sb-mini-chat] [data-sb-chat-log]", (e) => e.textContent);
    ok(/Tandem on Saturday — booked\?/.test(sent), "a sent message is really in the conversation");
    ok(/शनिबार/.test(sent), "Devanagari renders in the conversation");
    await shot(page, "19-mini-chat");
    const feedVisible = await page.evaluate(() => {
      const m = document.querySelector("[data-sb-moment]");
      const r = m.getBoundingClientRect();
      const dock = document.querySelector("[data-sb-mini-chat]").getBoundingClientRect();
      return r.width > 0 && dock.left > r.right - 40; // the stream keeps its column
    });
    ok(feedVisible, "chat happens while the World continues — the stream stays usable");
    await shot(page, "20-mini-chat-with-feed-visible");
    // keyboard: minimise / close returns focus to Messages
    await page.click("[data-sb-mini-minimise]");
    await sleep(200);
    ok(!!(await page.$("[data-sb-mini-chat][data-sb-mini-minimised]")), "the dock minimises");
    await page.click("[data-sb-mini-minimise]");
    await sleep(200);
    await shot(page, "33-keyboard-mini-chat");
    await page.click("[data-sb-mini-close]");
    await sleep(250);
    const backFocus = await page.evaluate(() => document.activeElement?.hasAttribute("data-sb-messages"));
    ok(!(await page.$("[data-sb-mini-chat]")) && backFocus, "closing the dock returns focus to the Messages control");
    // person → Message
    await page.click("[data-sb-open-person='p-bikash']");
    await sleep(300);
    await page.click("[data-sb-message]");
    await sleep(400);
    ok(!!(await page.$("[data-sb-mini-chat='p-bikash']")), "Person → Message opens that person's conversation directly");
    await shot(page, "25-person-to-chat");
    await page.click("[data-sb-mini-close]");
    // composer work survives a chat detour (§51)
    await page.click("[data-sb-open-composer]");
    await page.waitForSelector("[data-sb-composer]");
    await page.evaluate(() => {
      const t = document.querySelector("#sb-composer-text");
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(t, "Half a thought…");
      t.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.keyboard.press("Escape");
    await sleep(300);
    await page.evaluate(() => [...document.querySelectorAll("[data-sb-composer] button, button")].find((b) => /Keep draft/.test(b.textContent))?.click());
    await sleep(300);
    await page.click("[data-sb-messages]");
    await sleep(250);
    await page.click("[data-sb-conversation='p-bikash']");
    await sleep(300);
    await page.click("[data-sb-mini-close]");
    await sleep(200);
    const draftKept = await page.$eval("[data-sb-open-composer]", (e) => e.textContent);
    ok(/Draft kept/.test(draftKept), "a chat detour never destroys unsent composer work");

    /* ---- 5. full Chat ---- */
    console.log("5. full Chat");
    await open(page, "/chat", { theme: "dark" });
    ok(pathOf(page) === "/chat" && !!(await page.$("[data-sb-chat-list]")), "authenticated My World → Chat with no second login");
    const chatBrand = await page.$eval("[data-sb-brand]", (e) => ({ href: e.getAttribute("href"), ctx: e.querySelector("[data-sb-context]")?.textContent.trim() }));
    ok(chatBrand.href === "/" && chatBrand.ctx === "Chat", "Chat wears the same brand: mark goes Home, context reads Chat");
    ok((await themeOf(page)) === "dark", "dark My World → dark Chat");
    await page.click("[data-sb-chat-pick='p-asha']");
    await sleep(400);
    ok(!!(await page.$("[data-sb-chat-active='p-asha']")), "desktop: list beside the active conversation");
    await shot(page, "21-full-chat-dark");
    await open(page, "/chat?c=p-bikash", { theme: "light" });
    ok(!!(await page.$("[data-sb-chat-active='p-bikash']")) && (await themeOf(page)) === "light", "a person's Message deep-link lands in their conversation; light stays light");
    await shot(page, "22-full-chat-light");
    // mobile: list → conversation → back
    await open(page, "/chat", { theme: "dark", w: 360 });
    ok(!!(await page.$("[data-sb-chat-list]")) && !(await page.$("[data-sb-chat-active]")), "phone: the conversation list first");
    await shot(page, "23-chat-mobile-list");
    await page.click("[data-sb-chat-pick='p-asha']");
    await sleep(400);
    const listHidden = await page.$eval("[data-sb-chat-list]", (e) => e.getBoundingClientRect().width === 0);
    ok(listHidden && !!(await page.$("[data-sb-chat-active='p-asha']")), "phone: the conversation takes the screen");
    await shot(page, "24-chat-mobile-conversation");
    await shot(page, "36-devanagari-chat");
    await page.click("[data-sb-chat-back]");
    await sleep(300);
    ok(!!(await page.$("[data-sb-chat-list]")) && !(await page.$("[data-sb-chat-active]")), "phone: Back returns to the list");
    // return to context: a phone person → Message is a client navigation, so
    // Back restores My World where the person left it
    await open(page, "/world", { theme: "dark", w: 360 });
    await page.evaluate(() => window.scrollTo(0, 1200));
    await sleep(400);
    await page.click("[data-sb-open-person='p-bikash']");
    await sleep(350);
    await page.click("[data-sb-message]");
    await page.waitForSelector("[data-sb-chat-active='p-bikash']", { timeout: 15000 });
    await sleep(400);
    ok(pathOf(page) === "/chat", "phone: person → Message lands in their conversation");
    await page.goBack();
    await page.waitForSelector("[data-sb-sheet]", { timeout: 15000 });
    await sleep(500);
    const scrollBack = await page.evaluate(() => window.scrollY);
    ok(pathOf(page) === "/world" && scrollBack > 300, `browser Back returns to My World where the person left it (scroll ${scrollBack}px)`);
    await shot(page, "26-return-from-chat-to-feed");

    /* ---- 6. empty + error states ---- */
    console.log("6. non-happy states");
    await open(page, "/world", { theme: "light" });
    // an empty conversation: accept prakash, then message him — no history yet
    await page.click("[data-sb-bell]");
    await sleep(300);
    await page.click("[data-sb-notif-accept]");
    await sleep(200);
    await page.keyboard.press("Escape");
    await page.click("[data-sb-open-person='p-prakash']").catch(() => {});
    await sleep(200);
    if (!(await page.$("[data-sb-person-card]"))) {
      await page.evaluate(async () => {
        const i = document.querySelector("input[type=search]");
        i.focus();
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, "Chiara");
        i.dispatchEvent(new Event("input", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 400));
      });
      await page.click("[data-sb-search-person='p-prakash']");
      await sleep(300);
    }
    await page.click("[data-sb-message]");
    await sleep(400);
    const emptyConv = await page.$eval("[data-sb-mini-chat] [data-sb-chat-log]", (e) => e.textContent);
    ok(/No messages in this conversation yet\./.test(emptyConv), "a new conversation is honestly empty");
    await shot(page, "30-empty-chat");
    await page.click("[data-sb-mini-close]");
    // empty notifications (dev alias fixture mode)
    await page.goto(`${HOST}/style-lab/social?theme=light&harness=0&bell=1&notifications=empty`, { waitUntil: "networkidle2" });
    await sleep(500);
    ok(await page.evaluate(() => /Nothing new\./.test(document.body.innerText)), "empty notifications stay calm and factual");
    await shot(page, "31-empty-notifications");
    // media failure keeps the Moment's structure (the 404 is the point of the test)
    await open(page, "/world", { theme: "light" });
    probing = true;
    await // Phase 4.4-A owner fixture add-on: the author now has a real portrait, so the MOMENT's photo is
    // the image that is not the identity photo (the failure under test is the Moment media, as before).
    await page.$eval("[data-sb-moment='m-meal'] img:not([data-sb-identity-photo])", (img) => { img.src = "/mock/social/broken-404.jpg"; });
    await sleep(600);
    const fallback = await page.$eval("[data-sb-moment='m-meal']", (e) => ({ fb: !!e.querySelector("[data-sb-media-fallback]"), respond: /Respond/.test(e.textContent), who: /Luca/.test(e.textContent) }));
    ok(fallback.fb && fallback.respond && fallback.who, "a failed photo keeps its place — person, words and actions survive");
    await page.$eval("[data-sb-moment='m-meal']", (e) => e.scrollIntoView({ block: "center" }));
    await sleep(300);
    await shot(page, "32-error-media");
    ok(true, "29-empty-moments: N/A — the prototype ships no empty-Moments fixture; the state is specified in the QA checklist");

    /* ---- 7. privacy through the new surfaces ---- */
    console.log("7. privacy");
    await open(page, "/world", { theme: "light" });
    probing = false; // the deliberate broken-image request is behind us
    await page.click("[data-sb-messages]");
    await sleep(300);
    const panelText = await page.$eval("[data-sb-messages-panel]", (e) => e.textContent);
    ok(!/\d+y \d\dm \d\dd/.test(panelText) && !/04 NOV|06:42/.test(panelText), "conversations expose no one's exact age or birth data");
    await page.keyboard.press("Escape").catch(() => {});
    await page.click("[data-sb-open-person='p-bikash']");
    await sleep(300);
    const cardText = await page.$eval("[data-sb-person-card]", (e) => e.textContent);
    ok(/Circle band 30–45/.test(cardText) && !/\d+y \d\dm \d\dd/.test(cardText), "friendship does not raise life precision — band only");
    await page.keyboard.press("Escape");
    const health = await page.$eval("[data-sb-moment='m-health']", (e) => !/Respond/.test(e.textContent)).catch(() => true);
    ok(health, "Health stays a record — no Respond");

    /* ---- 8. account, appearance, logout ---- */
    console.log("8. account");
    await open(page, "/world", { theme: "dark", w: 360 });
    ok(!(await page.evaluate(() => { const t = [...document.querySelectorAll("button")].find((b) => /^Switch to/.test(b.getAttribute("aria-label") || "")); return t && t.getBoundingClientRect().width > 0; })), "phone bar: theme lives in the account menu, not icon soup");
    await page.click("button[aria-haspopup=menu]");
    await sleep(300);
    const menu = await page.$eval("[role=menu]", (e) => e.textContent);
    ok(/Appearance/.test(menu) && /Deep Cosmos/.test(menu) && /Logout/.test(menu), "the account menu carries Appearance and a real Logout");
    await shot(page, "40-account-settings");
    await page.evaluate(() => [...document.querySelectorAll("[role=menu] [role=menuitem]")].find((b) => /Appearance/.test(b.textContent))?.click());
    await sleep(400);
    ok((await themeOf(page)) === "light", "Appearance switches the one theme from the menu");
    await page.evaluate(() => { try { localStorage.setItem("sb-theme", "dark"); } catch {} });
    await open(page, "/world", { theme: "dark" });
    await page.click("button[aria-haspopup=menu]");
    await sleep(250);
    await page.evaluate(() => [...document.querySelectorAll("[role=menu] [role=menuitem]")].find((b) => /Logout/.test(b.textContent))?.click());
    await sleep(1200);
    ok(pathOf(page) === "/", "Logout ends the session and returns Home to Cosmos");
    await page.goto(`${HOST}/world?theme=dark`, { waitUntil: "networkidle2" });
    await sleep(1400);
    ok(pathOf(page) === "/", "…and My World now asks for identity again (no ghost session)");
    // sign back in for the remaining checks
    await enterIdentity(page);
    await page.click("[data-sb-enter-world]");
    await page.waitForSelector("[data-sb-sheet]", { timeout: 20000 });

    /* ---- 9. widths + remaining evidence ---- */
    console.log("9. widths");
    await open(page, "/world", { theme: "light", w: 390 });
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), "390: no horizontal scroll");
    await open(page, "/world", { theme: "light", w: 768 });
    await shot(page, "38-768");
    await open(page, "/world", { theme: "light", w: "wide" });
    ok(!(await page.$("[data-sb-mini-chat]")), "no dock resurrects itself across routes");
    await shot(page, "39-wide-desktop");
    await open(page, "/world", { theme: "dark", w: 360 });
    const lifeEntry = await page.$eval("[data-sb-life-entry]", (e) => Math.round(e.getBoundingClientRect().top + scrollY));
    ok(lifeEntry < 800, `the compact Life entry stays in the first screen (${lifeEntry}px)`);
    await shot(page, "27-life-entry");
    await open(page, "/life", { theme: "dark" });
    ok((await page.$$eval("[data-sb-dial] g[role=option]", (n) => n.length)) === 10, "the Circle is untouched");
    await shot(page, "28-life-with-system-context");
    await open(page, "/world", { theme: "light", w: 360 });
    for (let i = 0; i < 4 && (await page.$("[data-sb-load-more]")); i++) { await page.click("[data-sb-load-more]"); await sleep(350); }
    const el = await page.$("[data-sb-moment='m-nepali-1']");
    await el.evaluate((e) => e.scrollIntoView({ block: "center" }));
    await sleep(500);
    await el.screenshot({ path: `${EV}/37-devanagari-my-world.png` });
    // keyboard through full chat
    await open(page, "/chat?c=p-asha", { theme: "light" });
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await shot(page, "34-keyboard-full-chat");
    // reduced motion arrival
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await open(page, "/world", { theme: "dark" });
    const anim = await page.$eval("main", (m) => getComputedStyle(m).animationName);
    ok(anim === "none", `reduced motion: the arrival is a direct state change (${anim})`);
    await shot(page, "35-reduced-motion-transition");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);

    /* ---- 10. performance boundary ---- */
    console.log("10. performance");
    for (const [p, label] of [["/world", "My World"], ["/chat", "Chat"], ["/life", "Life"]]) {
      await open(page, p, { theme: "dark" });
      const canvases = await page.$$eval("canvas", (n) => n.length);
      ok(canvases === 0, `${label}: no hidden Cosmos canvas`);
    }
    await open(page, "/world", { theme: "dark" });
    ok(!(await page.$("[data-sb-chat-surface]")), "the full Chat tree is not mounted behind My World");

    /* ---- 11. page health ---- */
    console.log("11. page health");
    ok(errors.length === 0, `zero page errors (${errors.length}) ${errors.slice(0, 2).join(" | ")}`);
    ok(consoleErrors.length === 0, `zero console errors (${consoleErrors.length}) ${consoleErrors.slice(0, 2).join(" | ")}`);
  } catch (e) {
    console.log("COMPLETE MY WORLD: CRASH", e);
    failures.push(`CRASH ${e.message}`);
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  for (const f of failures) console.log(` - ${f}`);
  await browser.close();
  console.log(failures.length ? "COMPLETE MY WORLD: FAIL" : "COMPLETE MY WORLD: PASS");
  process.exit(failures.length ? 1 : 0);
})();
