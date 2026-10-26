import { test, expect, type Page } from '@playwright/test';
import { PerspectiveCamera, Vector3 } from 'three';
import { disconnectedTransport } from './fixtures/circle237-disconnected-transport';
import { roster } from '../src/review/circle237/registry';
async function dismissTrail(page:Page){const dismiss=page.getByRole('button',{name:'Dismiss trail',exact:true});if(await dismiss.isVisible())await dismiss.click();}
async function point(page:Page,index:number){
 const canvas=page.locator('.circle237 canvas');await canvas.scrollIntoViewIfNeeded();const b=(await canvas.boundingBox())!;
 const c=new PerspectiveCamera(42,b.width/b.height,.1,80);c.position.set(0,1.3,Math.max(9,5.2/Math.tan(21*Math.PI/180)/c.aspect));c.lookAt(0,1.3,0);c.updateMatrixWorld();
 const v=new Vector3((index%5-2)*2+.86,index<5?2.6:0,-.72).project(c);
 return{x:b.x+(v.x+1)*b.width/2,y:b.y+(1-v.y)*b.height/2};
}
test.beforeEach(async({context})=>{
 await context.addInitScript(disconnectedTransport);
 // No production reads, sign-in or real data: enforce local-only routing as well as server CSP.
 await context.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4240'?route.continue():route.abort());
});
for(const width of [320,390,1440]){
 test(`Open 237 first, ten encounters, invitation preview, refresh and history at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.goto('/council-of-life');
  await expect(page.getByRole('region',{name:'Current Circle'})).toContainText('Circle 237');
  await expect(page.getByRole('region',{name:'Previous Circle 236'})).toContainText('Circle 236');
  await expect(page.getByRole('heading',{name:'Previous Circle · 235'})).toBeVisible();
  await dismissTrail(page);
  await page.getByRole('link',{name:'Enter Circle 237 · meet its companions →'}).click();
  await expect(page).toHaveURL(/\/council\/237$/);
  await expect(page.locator('img.companion-scene')).toHaveCount(10);
  await expect(page.getByText('Portrait withheld pending clearance',{exact:true})).toHaveCount(0);
  for(const image of await page.locator('img.companion-scene').all()) { await image.scrollIntoViewIfNeeded(); await expect(image).toHaveJSProperty('naturalWidth', Number(await image.getAttribute('width'))); await expect(image).toHaveJSProperty('naturalHeight', Number(await image.getAttribute('height'))); }
  for(const c of roster){
   await page.getByRole('button',{name:`Meet ${c.name}`,exact:true}).click();
   await expect(page.getByRole('heading',{name:`${c.name} · Council appearance`,exact:true})).toBeVisible();
   await page.reload();await dismissTrail(page);
   await page.getByRole('link',{name:`Return to Circle 237 · ${c.name}`,exact:true}).click();
   await expect(page.getByRole('button',{name:`Meet ${c.name}`,exact:true})).toBeFocused();
  }
  // The invitation preview remains addressable for editors but is not promoted before sharing approval.
  await page.goto('/council/237?c237view=invitation');
  await expect(page.getByRole('heading',{name:'Our Council question'})).toBeVisible();
  await expect(page.getByText('What is life teaching us through the beings we encounter?',{exact:true})).toBeVisible();
  await expect(page.getByText('No live Fire gathering is scheduled.',{exact:false})).toBeVisible();
  await expect(page.getByText('We will share the illustrated PDF and Telegram invitation after reviewing the open Council.')).toBeVisible();
  await expect(page.getByRole('link',{name:'Council community · Telegram'})).toHaveAttribute('href','https://t.me/s33dlife');
  await page.screenshot({path:`output/playwright/circle237-integration/${test.info().project.name}-invitation-${width}.png`});
  await page.getByRole('link',{name:'Return to Circle 237',exact:true}).click();
  await page.getByRole('button',{name:'Meet Noku / Nokuphila',exact:true}).click();
  await page.goBack();await expect(page.getByRole('button',{name:'Meet Noku / Nokuphila',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`output/playwright/circle237-integration/${test.info().project.name}-2d-${width}.png`});
  await page.getByRole('link',{name:'Return to the Council Canopy'}).click();
  await expect(page.getByRole('region',{name:'Current Circle'})).toContainText('Circle 237');
 });
}
test('TETOL Canopy reaches spatial237 and all ten frames accept real touch',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});
 await context.addInitScript(disconnectedTransport);
 await context.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:4240'?r.continue():r.abort());
 const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.getByRole('button',{name:'Dismiss trail',exact:true}).click({timeout:3000}).catch(()=>{});
 await page.getByRole('button',{name:'Council of Life The Canopy'}).click();
 await expect(page.getByRole('link',{name:'Enter Circle 237 in the original 3D TETOL Council Deck →'})).toHaveAttribute('href','/tetol/circle-235/pre-fire/tetol.html?circle=237#croom');
 await expect(page.getByRole('link',{name:'Remember the historical Circle 235 TETOL →'})).toHaveAttribute('href','/tetol/circle-235/pre-fire/tetol.html#croom');
 await page.goto('/council/237?mode=spatial'); // Legacy experimental study tested separately from real TETOL.
 for(const [index,c] of roster.entries()){
  await expect(page.getByText('This simple 3D frame gallery is an experimental companion study',{exact:false})).toBeVisible();
  await expect(page.getByText('Spatial study ready',{exact:false})).toBeVisible();await dismissTrail(page);
  const p=await point(page,index);await page.touchscreen.tap(p.x,p.y);
  await expect(page.getByRole('heading',{name:`${c.name} · Council appearance`,exact:true})).toBeVisible();
  await page.getByRole('link',{name:`Return to Circle 237 · ${c.name}`,exact:true}).tap();
  await expect(page).toHaveURL(/mode=spatial&returned=/);
 }
 await page.locator('.circle237 canvas').scrollIntoViewIfNeeded();
 await page.screenshot({path:`output/playwright/circle237-integration/${test.info().project.name}-spatial-390.png`});
 expect(errors).toEqual([]);await context.close();
});
test('unknown identity and return URL cannot open private material; loaded2D survives offline',async({page,context})=>{
 await page.goto('/council/237?c237view=record&companion=private-person&return=https://evil.test');
 await expect(page.getByRole('heading',{name:'Companions, connected'})).toBeVisible();await dismissTrail(page);
 await context.setOffline(true);
 await page.getByRole('button',{name:'Meet Fly Agaric',exact:true}).click();
 await page.getByRole('link',{name:'Open enduring Library identity'}).click();
 await expect(page.getByRole('heading',{name:'Fly Agaric · continuing Library thread'})).toBeVisible();
 await expect(page.getByText('Offline ·',{exact:false})).toBeVisible();
 await page.getByRole('link',{name:'Return to Circle 237 · Fly Agaric'}).click();
 await expect(page.getByRole('button',{name:'Meet Fly Agaric',exact:true})).toBeFocused();
});
for (const width of [320,390,1440]) test(`Circle236 remains OPEN with seven companions at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/council-of-life');await dismissTrail(page);
 await expect(page.getByRole('region',{name:'Previous Circle 235'})).toContainText('What is already blooming in us');
 await page.getByRole('link',{name:'Revisit Circle 236 · meet its companions →'}).click();
 await expect(page.getByText('Canopy · OPEN')).toBeVisible();
 await expect(page.locator('.circle-companion-frames figure')).toHaveCount(7);
 await expect(page.getByText('Fire reference · past date.',{exact:false})).toBeVisible();
 await page.reload();await expect(page.getByText('Canopy · OPEN')).toBeVisible();
});
