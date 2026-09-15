// Dedicated close crops of a Devanagari moment at 360, light and dark (Phase 4.1 evidence).
const puppeteer = require("puppeteer-core");
const fs = require("fs"); const path = require("path");
const OUT = "/Users/roshan/SYSTEMBOOM_V2/prototype-evidence/phase-04-final/corrections";
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 1200, deviceScaleFactor: 2 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  for (const theme of ["light", "dark"]) {
    await page.goto(`http://localhost:3210/style-lab/social?w=360&theme=${theme}&harness=0`, { waitUntil: "networkidle0" });
    await sleep(600);
    // load more until a Devanagari moment exists
    for (let i = 0; i < 4 && !(await page.$("[data-sb-moment='m-nepali-1']")); i++) {
      const btn = await page.$("button[data-sb-load-more], button::-p-text(Load more)");
      if (!btn) break;
      await btn.click(); await sleep(500);
    }
    const el = await page.$("[data-sb-moment='m-nepali-1']");
    if (!el) throw new Error("m-nepali-1 not found in " + theme);
    await el.evaluate((e) => e.scrollIntoView({ block: "center" }));
    await sleep(700); // fonts + lazy images
    await page.evaluate(() => document.fonts.ready);
    const fontsOk = await page.evaluate(() => document.fonts.check("500 16px 'SB Devanagari'"));
    await el.screenshot({ path: path.join(OUT, `devanagari-360-${theme}.png`) });
    // a tighter crop of the body text only
    const body = await el.$("p.whitespace-pre-line");
    if (body) await body.screenshot({ path: path.join(OUT, `devanagari-360-${theme}-body-crop.png`) });
    const txt = await el.evaluate((e) => e.innerText.slice(0, 160).replace(/\n/g, " | "));
    console.log(theme, "SB Devanagari loaded:", fontsOk, "|", txt);
  }
  console.log("page errors:", errors.length, errors);
  await browser.close();
})().catch((e) => { console.error("CRASH", e); process.exit(1); });
