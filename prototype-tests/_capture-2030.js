/* Evidence capture for the Social 2030 Final visual pass — not an assertion suite. */
const fs = require("fs");
const { launch, sleep } = require("./lib");
const HOST = "http://localhost:3210";
const S = "/style-lab/social";
const EV = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/social-2030-final";
fs.mkdirSync(EV, { recursive: true });
(async () => {
  const { page } = await launch();
  const shot = async (name) => { await page.screenshot({ path: `${EV}/${name}.png` }); console.log("  shot", name); };
  const open = async (w, h, { theme = "light", viewer, extra = {} } = {}) => {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, hasTouch: w < 700 });
    const u = new URL(HOST + S); u.searchParams.set("theme", theme); u.searchParams.set("harness", "0");
    if (viewer) u.searchParams.set("viewer", viewer);
    for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
    await page.goto(u.toString(), { waitUntil: "networkidle2" }); await sleep(650);
  };
  const loadTo = async (id) => { for (let i = 0; i < 6 && !(await page.$(`[data-sb-moment='${id}']`)); i++) { await page.click("[data-sb-load-more]").catch(()=>{}); await sleep(300);} };
  const toMoment = async (id, block="center") => { await loadTo(id); await page.$eval(`[data-sb-moment='${id}']`, (e,b)=>e.scrollIntoView({block:b}), block); await sleep(350); };

  // ---- MOBILE first views ----
  for (const [w,h,tag] of [[360,800,"360"],[390,844,"390"],[412,915,"412"]]) {
    for (const theme of ["light","dark"]) {
      await open(w,h,{theme});
      const n = w===360?`0${theme==="light"?1:2}-owner-360-${theme}-first-view` : `0${w===390?(theme==="light"?3:4):(theme==="light"?5:6)}-owner-${w}-${theme}`;
      await shot(n);
    }
  }
  await open(360,800,{theme:"light",viewer:"ashaVisitor"}); await shot("07-visitor-360-light");
  await open(360,800,{theme:"dark",viewer:"ashaVisitor"}); await shot("08-visitor-360-dark");
  await open(360,800,{theme:"light"}); await page.click("[data-sb-people]"); await sleep(400); await shot("09-people-360");
  await open(360,800,{theme:"light",extra:{composer:"1"}}); await sleep(400); await shot("10-composer-360-keyboard");
  await open(360,800,{theme:"light"}); await page.click("[data-sb-people]"); await sleep(300);
    await page.evaluate(()=>{const i=document.querySelector("[data-sb-people-find]");i.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(i,"Marcus");i.dispatchEvent(new Event("input",{bubbles:true}));}); await sleep(300);
    await page.click("[data-sb-people-row] button").catch(()=>{}); await sleep(400); await shot("11-person-360");
  await open(360,800,{theme:"light"}); await page.click("[data-sb-people]"); await sleep(400); await shot("12-request-360");
  await open(360,800,{theme:"light"}); await page.click("[data-sb-bell]"); await sleep(400); await shot("13-notifications-360");
  await open(360,800,{theme:"light"}); await page.click("[data-sb-view-as-public]").catch(()=>{}); await sleep(400); await shot("14-public-preview-360");
  await open(852,393,{theme:"light"}); await shot("15-phone-landscape");

  // ---- DESKTOP matrix ----
  const dmap = {1280:[16,17],1440:[18,19],1920:[20,21]};
  for (const w of [1280,1440,1920]) { for (const theme of ["light","dark"]) { await open(w,900,{theme}); await shot(`${dmap[w][theme==="light"?0:1]}-owner-${w}-${theme}`);} }
  await open(1440,900,{theme:"light",viewer:"ashaVisitor"}); await shot("22-visitor-desktop");
  await open(1440,1000,{theme:"dark"}); await page.$eval("[data-sb-hero]",(e)=>e.scrollIntoView({block:"start"})); await sleep(300); await shot("23-profile-depth");
  await open(1440,1000,{theme:"light",extra:{nocover:"1"}}); await shot("24-profile-no-wall");
  // 25/26: identity robustness — person card on an ordinary photo (Walt) + initials (Ramesh)
  await open(1440,900,{theme:"light"}); await page.click("[data-sb-people]"); await sleep(300);
    await page.evaluate(()=>{const i=document.querySelector("[data-sb-people-find]");i.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(i,"Walt");i.dispatchEvent(new Event("input",{bubbles:true}));}); await sleep(300);
    await page.click("[data-sb-people-row] button").catch(()=>{}); await sleep(400); await shot("25-profile-bad-photo");
  await open(1440,900,{theme:"light"}); await page.click("[data-sb-people]"); await sleep(300);
    await page.evaluate(()=>{const i=document.querySelector("[data-sb-people-find]");i.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(i,"Ramesh");i.dispatchEvent(new Event("input",{bubbles:true}));}); await sleep(300);
    await page.click("[data-sb-people-row] button").catch(()=>{}); await sleep(400); await shot("26-profile-fallback");

  // ---- FEATURES ----
  await open(1440,900,{theme:"light"}); await page.click("[data-sb-people]"); await sleep(400); await shot("27-people-desktop");
  const searchCap = async (term,name)=>{ await open(1440,900,{theme:"light"}); await page.click("input[type=search]"); await page.type("input[type=search]",term); await sleep(500); await shot(name); await page.keyboard.press("Escape"); };
  await searchCap("Grace","28-search-people");
  await searchCap("scaffolding","29-search-moments");
  const cardCap = async (term,name)=>{ await open(1440,900,{theme:"light"}); await page.click("[data-sb-people]"); await sleep(300); await page.evaluate((t)=>{const i=document.querySelector("[data-sb-people-find]");i.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(i,t);i.dispatchEvent(new Event("input",{bubbles:true}));},term); await sleep(300); await page.click("[data-sb-people-row] button").catch(()=>{}); await sleep(400); await shot(name); };
  await cardCap("Ramesh","30-request-none");
  await cardCap("Nadia","31-request-out");
  await cardCap("Prakash","32-request-in");
  await cardCap("Marcus","33-friend");
  await cardCap("Sunita","34-family-if-real");
  // moment kinds
  await open(1440,1000,{theme:"light"});
  const momentCap = async (id,name)=>{ await toMoment(id); await shot(name); };
  await momentCap("m-one","35-text-moment").catch(async()=>{await shot("35-text-moment");});
  await open(1440,1000,{theme:"light"}); await momentCap("m-tenphotos","36-photo-moment").catch(async()=>{await shot("36-photo-moment");});
  await open(1440,1000,{theme:"light"}); await momentCap("m-video","37-video-moment").catch(async()=>{await shot("37-video-moment");});
  await open(1440,1000,{theme:"light"}); await momentCap("m-meal","38-meal").catch(async()=>{});
  await open(1440,1000,{theme:"light"}); await momentCap("m-activity","39-activity").catch(async()=>{await shot("39-activity");});
  await open(1440,1000,{theme:"light"}); await momentCap("m-project","40-project").catch(async()=>{await shot("40-project");});
  await open(1440,1000,{theme:"light"}); await momentCap("m-meeting","41-meeting").catch(async()=>{await shot("41-meeting");});
  await open(1440,1000,{theme:"light"}); await momentCap("m-health","42-health").catch(async()=>{await shot("42-health");});
  await open(1440,1000,{theme:"light"}); await momentCap("m-problem","43-problem").catch(async()=>{await shot("43-problem");});
  await open(1440,1000,{theme:"light"}); await shot("44-composer-collapsed");
  await open(1440,1000,{theme:"light",extra:{composer:"1"}}); await sleep(400); await shot("45-composer-expanded");
  await open(1440,1000,{theme:"light"}); await shot("46-respond");
  await open(1440,900,{theme:"light"}); await page.click("[data-sb-bell]"); await sleep(400); await shot("47-notifications");
  await open(1440,1000,{theme:"dark"}); await shot("48-life-ring-large");
  await open(1440,1000,{theme:"light"}); await toMoment("m-1983").catch(()=>{}); await shot("49-life-ring-small");
  // Devanagari + a11y
  await open(360,800,{theme:"light"}); await toMoment("m-1983").catch(()=>{}); await shot("50-devanagari-mobile");
  await open(1440,1000,{theme:"light"}); await toMoment("m-1983").catch(()=>{}); await shot("51-devanagari-desktop");
  console.log("CAPTURE DONE");
  process.exit(0);
})();
