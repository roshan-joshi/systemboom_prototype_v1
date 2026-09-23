const {launch,sleep}=require('./celestial-lib');const fs=require('fs');
const out='prototype-evidence/celestial-mastering/art-family/objects';fs.mkdirSync(out,{recursive:true});
const ids=['venus-love','sun-joy','meteor-laugh','comet-wow','jupiter-celebrate','saturn-support','moon-touched','mercury-curious'];
(async()=>{const{browser,page}=await launch();const labels={};try{
await page.setViewport({width:1440,height:1800,deviceScaleFactor:1});
for(const theme of ['light','dark']){
 await page.goto(`http://localhost:3210/style-lab/social?theme=${theme}&celestial=1`,{waitUntil:'networkidle2'});
 const root="[data-sb-moment='m-rain']";await page.$eval(root,e=>window.scrollTo(0,window.scrollY+e.getBoundingClientRect().top-300));await page.click(root+' [data-sb-resonate]');await sleep(850);
 for(const id of ids){const selector=`${root} [data-sb-resonance-item='${id}']`;labels[id]=await page.$eval(selector,e=>e.getAttribute('aria-label'));await page.focus(selector);await sleep(500);const clip=await page.$eval(selector,e=>{const r=e.getBoundingClientRect();return{x:r.left-18,y:scrollY+r.top-18,width:r.width+36,height:r.height+92}});await page.screenshot({path:`${out}/focused-${theme}-${id}.png`,clip});await page.hover(selector);await page.mouse.move(0,0);await page.$eval(selector,e=>e.blur());await sleep(300);await page.screenshot({path:`${out}/object-${theme}-${id}.png`,clip});}
 for(const id of ids){const field=await page.$(root+' [data-sb-celestial-field]');if(!field){await page.click(root+' [data-sb-resonate]');await sleep(800);}await page.click(`${root} [data-sb-resonance-item='${id}']`);await sleep(100);const el=await page.$(root+' [data-sb-celestial-field]');if(el)await el.screenshot({path:`${out}/event-${theme}-${id}.png`});await sleep(1500);}
 await page.goto(`http://localhost:3210/style-lab/celestial?theme=${theme}&lang=en`,{waitUntil:'networkidle2'});await sleep(500);await(await page.$('[data-sb-preview-marks]')).screenshot({path:`${out}/marks-${theme}.png`});
 for(const id of ids){const el=await page.$(`[data-sb-preview-marks] [data-sb-resonance='${id}']`);const parent=await el.evaluateHandle(e=>e.parentElement);await parent.screenshot({path:`${out}/compact-${theme}-${id}.png`});}
 console.log(theme+' object/focus/event/compact complete');
}
fs.writeFileSync(`${out}/labels.json`,JSON.stringify(labels,null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
