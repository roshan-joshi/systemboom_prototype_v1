/* Optical export from owner-reference-led transparent masters. No semantic data changes. */
const fs=require('fs'),path=require('path'),sharp=require('sharp');
const evidence=path.resolve('prototype-evidence/celestial-mastering/art-family');
const sources=JSON.parse(fs.readFileSync(path.join(evidence,'sources.json'),'utf8'));
const out=path.resolve('public/celestial/family');fs.mkdirSync(out,{recursive:true});
const compact={venus:.84,jupiter:.76,moon:.90,mercury:.78};
(async()=>{const manifest=[];for(const [object,source] of Object.entries(sources)){
 const meta=await sharp(source).metadata();if(!meta.hasAlpha)throw Error(object+' master must have alpha');
 for(const theme of ['cosmos','solar'])for(const [tier,size]of Object.entries({signal:64,seal:96,object:256,event:512})){
  let art=sharp(source);const fraction=tier==='signal'?(compact[object]||1):1;
  if(fraction<1){const w=Math.round(meta.width*fraction),h=Math.round(meta.height*fraction);art=art.extract({left:Math.round((meta.width-w)/2),top:Math.round((meta.height-h)/2),width:w,height:h});}
  // Compact planets lose satellite filigree; the primary body/core owns the silhouette.
  let buffer=await art.resize(size,size,{fit:'contain',background:'#00000000'}).toBuffer();
  if(tier==='signal'&&compact[object])buffer=await sharp(buffer).composite([{input:Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size*.48}" fill="white"/></svg>`),blend:'dest-in'}]).toBuffer();
  const pad=tier==='object'?Math.round(size*.055):tier==='seal'?Math.round(size*.025):0;
  if(pad)buffer=await sharp(buffer).resize(size-pad*2,size-pad*2).extend({top:pad,bottom:pad,left:pad,right:pad,background:'#00000000'}).toBuffer();
  let processed=sharp(buffer).modulate({saturation:theme==='solar'?1.07:1.02});
  if(tier==='signal')processed=processed.sharpen({sigma:.6,m1:.4,m2:1.3}).linear(1.035,-2);
  if(tier==='seal')processed=processed.sharpen({sigma:.4,m1:.2,m2:.7});
  const file=path.join(out,`${object}-${theme}-${tier}.webp`);await processed.webp({quality:tier==='signal'?95:92,alphaQuality:100}).toFile(file);
  manifest.push({object,theme,tier,size,source,crop:fraction,padding:pad,bytes:fs.statSync(file).size,file});
 }
}fs.writeFileSync(path.join(evidence,'optical-manifest.json'),JSON.stringify(manifest,null,2));console.log(manifest.length+' optical assets exported');})();
