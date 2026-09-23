/* Actual Social runtime evidence. No pixel changes after capture. */
const {launch,sleep}=require('./celestial-lib');
const fs=require('fs');
const out=`prototype-evidence/celestial-mastering/${process.argv[2]||'final'}`;
(async()=>{fs.mkdirSync(out,{recursive:true});const {browser,page}=await launch();
try {for(const theme of ['dark','light']) for(const width of [1440,390,360]) {
const key=`${theme}-${width===1440?'desktop':width}`;
await page.setViewport({width,height:1800,deviceScaleFactor:1});
await page.goto(`http://localhost:3210/style-lab/social?theme=${theme}&celestial=1&lang=en`,{waitUntil:'networkidle2'});await sleep(800);
await page.screenshot({path:`${out}/page-${key}.png`});
const rain="[data-sb-moment='m-rain']";
async function shot(state){await page.$eval(rain,e=>window.scrollTo(0,window.scrollY+e.getBoundingClientRect().top-320));await sleep(200);const clip=await page.$eval(rain,(e,w)=>{const r=e.getBoundingClientRect();const x=w<600?0:Math.max(0,r.left-20);return {x,y:Math.max(0,window.scrollY+r.top-12),width:w<600?w:Math.min(w-x,r.width+40),height:r.height+24};},width);await page.screenshot({path:`${out}/${state}-${key}.png`,clip});}
await shot('closed');await page.click(`${rain} [data-sb-resonate]`);await sleep(1000);await shot('open');
const venus=await page.$(`${rain} [data-sb-resonance-item='venus-love']`);await venus.screenshot({path:`${out}/venus-${key}.png`});
await page.focus(`${rain} [data-sb-resonance-item='saturn-support']`);await sleep(500);if(width===1440)await shot('focus');
await page.click(`${rain} [data-sb-resonance-item='venus-love']`);await sleep(1300);await shot('committed');console.log(key);
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
