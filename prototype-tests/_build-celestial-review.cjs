const sharp=require('sharp'),fs=require('fs'),path=require('path');const base=path.resolve('prototype-evidence/celestial-mastering'),ev=base+'/art-family',obj=ev+'/objects';
const ids=['venus-love','sun-joy','meteor-laugh','comet-wow','jupiter-celebrate','saturn-support','moon-touched','mercury-curious'];
const names=['Venus · Love','Sun · Joy','Meteor Shower · Laugh','Comet · Wow','Jupiter · Celebrate','Saturn · Support','Moon · Touched','Mercury · Curious'];
const phrases=['Closer together.','You brightened this.','You made this lighter.',"I didn't expect that.",'This deserves a bigger sky.',"I'm with you.",'This reached me.','Tell me more.'];
const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
function text(s,width,height=55,size=22,bg='#111925'){return Buffer.from(`<svg width="${width}" height="${height}"><rect width="100%" height="100%" fill="${bg}"/><text x="14" y="${Math.min(35,height-8)}" font-family="Arial" font-size="${size}" fill="#e1c591">${escape(s)}</text></svg>`)}
(async()=>{let layers=[],y=75;const W=1920;
layers.push({input:text('CELESTIAL OBJECT FAMILY — exact runtime pixels at native size',W,65,30),top:0,left:0});
for(const [title,prefix]of [['SOLAR OBSERVATORY / Object tier','object-light'],['DEEP COSMOS / Object tier','object-dark'],['SIGNAL 20px + SEAL 30px / both themes','compact'],['FOCUS / all eight / Deep Cosmos','focused-dark']]){
 layers.push({input:text(title,W),top:y,left:0});y+=60;
 for(let i=0;i<8;i++){const x=i*240;const p=prefix==='compact'?`${obj}/compact-light-${ids[i]}.png`:`${obj}/${prefix}-${ids[i]}.png`;const m=await sharp(p).metadata();layers.push({input:p,top:y,left:x+Math.floor((240-m.width)/2)});
 if(prefix==='compact'){const dark=`${obj}/compact-dark-${ids[i]}.png`;layers.push({input:dark,top:y+50,left:x+Math.floor((240-m.width)/2)});}
 layers.push({input:text(names[i],238,36,16),top:y+180,left:x});layers.push({input:text(phrases[i],238,36,13),top:y+217,left:x});}
 y+=268;
}
const objectBoard=base+'/CELESTIAL-OBJECT-REVIEW-BOARD.png';await sharp({create:{width:W,height:y+15,channels:3,background:'#111925'}}).composite(layers).png().toFile(objectBoard);
// Direct reference / page / open-Moment comparison. Runtime screenshots are not retouched.
const reference='references/celestial-resonance-bible/concepts/stage-2-1d/reference/owner-lineup-poster.png';const rm=await sharp(reference).metadata();let boards=[],rowY=100;const BW=2400;
boards.push({input:text('CELESTIAL REFERENCE MASTERING — owner reference and real Social runtime',BW,80,31),top:0,left:0});
for(const [theme,top,height]of [['light',0,432],['dark',432,400]]){
 const ref=await sharp(reference).extract({left:0,top,width:rm.width,height}).resize({width:780}).toBuffer();
 const page=await sharp(`${ev}/social/page-${theme}-desktop.png`).resize({width:780}).toBuffer();const pageMeta=await sharp(page).metadata();
 const open=await sharp(`${ev}/social/open-${theme}-desktop.png`).resize({width:740}).toBuffer();
 boards.push({input:text(`${theme.toUpperCase()} / MASTER REFERENCE`,780),top:rowY,left:10},{input:ref,top:rowY+65,left:10},{input:text('FINAL RUNTIME / closed page',780),top:rowY,left:810},{input:page,top:rowY+65,left:810},{input:text('FINAL RUNTIME / open Moment',780),top:rowY,left:1610},{input:open,top:rowY+65,left:1630});
 // Full reference object line retained so all eight identities can be compared to runtime.
 const objects=await sharp(reference).extract({left:35,top:theme==='light'?120:535,width:1595,height:theme==='light'?215:210}).resize({width:780}).toBuffer();boards.push({input:text('REFERENCE / eight object identities',780),top:rowY+330,left:10},{input:objects,top:rowY+395,left:10});
 rowY+=pageMeta.height+110;
}
boards.push({input:objectBoard,left:240,top:rowY});const bm=await sharp(objectBoard).metadata();
const final=base+'/CELESTIAL-REFERENCE-MASTERING-BOARD.png';await sharp({create:{width:BW,height:rowY+bm.height+20,channels:3,background:'#0c121d'}}).composite(boards).png().toFile(final);await sharp(final).resize({width:1200}).toFile(ev+'/reference-board-preview.png');console.log(objectBoard+'\n'+final);
})();
