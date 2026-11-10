import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import fronts from '../../public/council/circle-239/companions.json' with {type:'json'};
import held from '../../public/council/circle-239/reverse-folios.json' with {type:'json'};
import {disconnectedTransport} from '../fixtures/circle237-disconnected-transport';
const ROOT='/council/circle-239/';
const privateIntake=process.env.CIRCLE239_PRIVATE_INTAKE;
const synthetic=process.env.CIRCLE239_SYNTHETIC==='1';
const source=privateIntake?JSON.parse(readFileSync(join(privateIntake,'MANIFEST.json'),'utf8')):null;
const items=fronts.companions.map((c,i)=>({...c,artwork:ROOT+'reverses/'+c.key+'.png',width:held.items[i].sourceWidth,height:held.items[i].sourceHeight,sha256:held.items[i].sourceSha256,status:'LOCAL_PRIVATE_REVIEW',factReviewed:false,rightsApproved:false,readableText:privateIntake?'PRIVATE CANDIDATE — human artwork/rights approval pending.\n'+readFileSync(join(privateIntake,source.items[i].filename.replace(/\.png$/,'.txt')),'utf8'):synthetic?'Synthetic text fixture for '+c.label+'. Council role: '+c.kind+'. This is not a species record.':held.items[i].readableText,explore:null}));
test.beforeEach(async({context})=>{
 await context.addInitScript(disconnectedTransport);
 await context.route('**/*',r=>{const q=r.request();return !['127.0.0.1','localhost'].includes(new URL(q.url()).hostname)||!['GET','HEAD'].includes(q.method())?r.abort():r.continue();});
});
// Real PNG fixtures keep WebKit intrinsic-size checks identical to actual artwork checks.
const pngCache=new Map<string,Buffer>();
function edgeMarkedPNG(w:number,h:number){
 const key=w+'x'+h;if(pngCache.has(key))return pngCache.get(key)!;
 const raw=Buffer.alloc((w*3+1)*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const c=y<8?[255,0,0]:y>=h-8?[0,0,255]:x<8?[0,180,0]:x>=w-8?[255,200,0]:[232,219,183];
  const at=y*(w*3+1)+1+x*3;raw[at]=c[0];raw[at+1]=c[1];raw[at+2]=c[2];
 }
 const crc=(b:Buffer)=>{let n=0xffffffff;for(const v of b){n^=v;for(let j=0;j<8;j++)n=(n>>>1)^((n&1)?0xedb88320:0);}return(n^0xffffffff)>>>0;};
 const chunk=(type:string,data:Buffer)=>{const name=Buffer.from(type),size=Buffer.alloc(4),sum=Buffer.alloc(4);size.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([name,data])));return Buffer.concat([size,name,data,sum]);};
 const header=Buffer.alloc(13);header.writeUInt32BE(w);header.writeUInt32BE(h,4);header[8]=8;header[9]=2;
 const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);pngCache.set(key,png);return png;
}
async function review(page){
 if(!privateIntake&&!synthetic)return;
 await page.route('**/circle-239/reverse-folios.json',r=>r.fulfill({json:{circle:239,publicationApproved:false,status:'LOCAL_PRIVATE_REVIEW',items}}));
 await page.route('**/circle-239/reverses/*.png',r=>{
  const key=new URL(r.request().url()).pathname.split('/').pop().replace('.png',''),i=items.findIndex(x=>x.key===key),item=items[i];
  if(privateIntake){const body=readFileSync(join(privateIntake,source.items[i].filename));expect(createHash('sha256').update(body).digest('hex')).toBe(item.sha256);return r.fulfill({contentType:'image/png',body});}
  return r.fulfill({contentType:'image/png',body:edgeMarkedPNG(item.width,item.height)});
 });
}
async function expand(page){if(await page.locator('body').getAttribute('data-sheet')==='peek')await page.locator('#grab').tap();}

// Software-GPU runners must not continuously redraw the whole historic Tree while
// checking sheet state. Keep the original renderer and draw each reverse for real.
async function boundContinuousDrawing(page){
 await page.waitForFunction(()=>!!(document.querySelector('three-d-stage') as any)?._renderer);
 await page.evaluate(()=>{const r=(document.querySelector('three-d-stage') as any)._renderer;
  if(r.__livingFrameDraw)return;const render=r.render.bind(r);r.__livingFrameBudget=0;r.__livingFrameCount=0;
  r.__livingFrameDraw=()=>{r.__livingFrameBudget=1;};
  r.render=(...args:any[])=>{if(r.__livingFrameBudget>0){r.__livingFrameBudget--;render(...args);r.__livingFrameCount++;}};
 });
}
async function drawRealFrame(page){
 const before=await page.evaluate(()=>{const r=(document.querySelector('three-d-stage') as any)._renderer;r.__livingFrameDraw();return r.__livingFrameCount;});
 await page.waitForFunction(n=>(document.querySelector('three-d-stage') as any)._renderer.__livingFrameCount>n,before);
}

for(const width of [320,390,1440])test(`all ten2D pairs: keyboard, retained focus, full artwork and text at${width}px`,async({page},info)=>{
 await review(page);await page.setViewportSize({width,height:844});await page.goto('/council/239');
 for(const c of fronts.companions){
  await page.getByRole('button',{name:'Meet '+c.label,exact:true}).click();const frame=page.locator('council-living-frame');const flip=frame.getByRole('button',{name:'Reveal reverse of '+c.label,exact:true});await expect(flip).toBeEnabled();await flip.focus();await flip.press('Enter');
  await expect(frame.getByRole('button',{name:'Return to front of '+c.label,exact:true})).toBeFocused();await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','true');
  const image=frame.getByRole('img');await expect(image).toHaveJSProperty('naturalWidth',items[c.order-1].width);await expect(image).toHaveJSProperty('naturalHeight',items[c.order-1].height);
  await frame.getByText('Read the reverse as text',{exact:true}).click();await expect(frame.locator('pre')).toHaveText(items[c.order-1].readableText);
  await expect(frame.getByRole('link',{name:'Explore deeper',exact:true})).toHaveCount(0);
  if(c.order===9)await page.screenshot({path:`output/playwright/living-frames/${info.project.name}-2d-reverse-${width}.png`,fullPage:true});
  await frame.getByRole('button').click();await expect(image).toHaveAttribute('src',c.artwork);await page.getByRole('button',{name:'Return to Circle 239',exact:true}).click();
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
for(const width of [320,1440])test(`side survives refresh/Back; reduced motion and full image at${width}`,async({page})=>{
 await review(page);await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width,height:844});await page.goto('/council/239?review239=1&companion=ginkgo-leaf');const frame=page.locator('council-living-frame');await frame.getByRole('button').click();await expect(page).toHaveURL(/side=reverse/);await expect(frame.getByRole('img')).toHaveCSS('animation-name','none');await page.reload();await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','true');await frame.getByRole('button').click();await expect(page).not.toHaveURL(/side=reverse/);await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','false');await page.goBack();await expect(page).toHaveURL(/side=reverse/);await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','true');await page.goForward();await expect(page).not.toHaveURL(/side=reverse/);await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','false');
});
// This negative case owns its mocked catalogue response; workers must not bypass routing.
// Positive public-asset journeys keep the normal service-worker setting.
test.describe('held catalogue network fixture',()=>{
 test.use({serviceWorkers:'block'});
 test('held production catalog cannot reveal or request any reverse even with review/side flags',async({page})=>{
 await page.route('**/circle-239/reverse-folios.json',r=>r.fulfill({json:{...held,publicationApproved:false,status:'HOLD_ASSET_REVIEW',items:held.items.map(i=>({...i,status:'HOLD_ASSET_REVIEW',factReviewed:false,rightsApproved:false,artwork:null,readableText:null}))}}));
 const requests:string[]=[];page.on('request',r=>{if(r.url().includes('/reverses/'))requests.push(r.url());});
 for(const c of fronts.companions){await page.goto('/council/239?review239=1&side=reverse&companion='+c.key);const frame=page.locator('council-living-frame');await expect(frame.getByRole('button')).toBeDisabled();await expect(frame.getByRole('status')).toContainText('awaiting editorial approval');await expect(frame.getByRole('img')).toHaveAttribute('src',c.artwork);}
 expect(requests).toEqual([]);
 });
});
test('missing reverse keeps front and truthful status without a fake state change',async({page})=>{
 await review(page);await page.route('**/reverses/ginger.png',r=>r.fulfill({status:503,body:'Unavailable'}));await page.goto('/council/239?review239=1&companion=ginger');const frame=page.locator('council-living-frame');await frame.getByRole('button').click();await expect(frame.getByRole('status')).toContainText('could not be loaded');await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','false');await expect(frame.getByRole('img')).toHaveAttribute('src',fronts.companions[2].artwork);await expect(page).not.toHaveURL(/side=reverse/);
});
for(const width of [320,390])test(`original239 Tree: ten texture pairs, full-image containment, history, quietFire and StaffRoom at${width}px`,async({page},info)=>{
 test.setTimeout(120000);await review(page);await page.setViewportSize({width,height:844});await page.addInitScript(()=>{window.requestAnimationFrame=cb=>window.setTimeout(()=>cb(performance.now()),250);window.cancelAnimationFrame=id=>clearTimeout(id);});
 await page.goto('/tetol/circle-235/pre-fire/tetol.html?circle=239&review239=1#croom');await page.waitForFunction(()=>!!(document.querySelector('three-d-stage') as any)?._scene);await boundContinuousDrawing(page);await drawRealFrame(page);await expand(page);
 for(const c of fronts.companions){
  await page.locator('#panel').getByRole('button',{name:c.label,exact:true}).click();await expand(page);const frame=page.locator('council-living-frame');await expect(frame.getByRole('button')).toBeEnabled();await frame.getByRole('button').tap();await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','true');
  await page.waitForFunction(id=>(document.querySelector('three-d-stage') as any)._scene.getObjectByName(id+'_artwork')?.material.map?.image?.src?.includes('/reverses/'),c.id);await drawRealFrame(page);
  const shape=await page.evaluate(id=>{const m=(document.querySelector('three-d-stage') as any)._scene.getObjectByName(id+'_artwork');return {w:m.geometry.parameters.width,h:m.geometry.parameters.height,repeat:m.material.map.repeat.toArray(),offset:m.material.map.offset.toArray()};},c.id);
  expect(shape.w/shape.h).toBeCloseTo(items[c.order-1].width/items[c.order-1].height);expect(shape.repeat).toEqual([1,1]);expect(shape.offset).toEqual([0,0]);
  if(c.order===1){await page.screenshot({path:`output/playwright/living-frames/${info.project.name}-original-tree-reverse-${width}.png`});await page.reload();await page.waitForFunction(()=>!!(document.querySelector('three-d-stage') as any)?._renderer);await boundContinuousDrawing(page);await drawRealFrame(page);await expand(page);await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','true');}
  await frame.getByRole('button').click();await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','false');if(c.order===1){await page.goBack();await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','true');await page.goForward();await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','false');}await page.getByRole('button',{name:'Return to the Council Deck',exact:true}).click();await expand(page);
 }
 await page.getByRole('link',{name:'← Previous Circle',exact:true}).click();await expect(page.locator('#brandline')).toContainText('238 · HISTORICAL');await expand(page);await expect(page.locator('council-living-frame')).toHaveCount(0);await page.getByRole('link',{name:'Return to current · 240',exact:true}).click();await expect(page.locator('#brandline')).toContainText('240 · CURRENT / OPEN');
 await page.goto('/tetol/circle-235/pre-fire/tetol.html?circle=239&review239=1#live_fire');await expect(page.getByRole('heading',{name:'No scheduled Fire',exact:true})).toBeAttached();await page.goto('/tetol/circle-235/pre-fire/tetol.html?circle=239&review239=1#staff');await expect(page.getByRole('heading',{name:'Staff Room',exact:true})).toBeAttached();
});
