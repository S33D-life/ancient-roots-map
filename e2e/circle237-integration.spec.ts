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
 test(`Canopy, ten encounters, confirmed invitation, refresh and history at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.goto('/council-of-life');
  await expect(page.getByRole('heading',{name:'Circle 236',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Previous Circle · 235'})).toBeVisible();
  await dismissTrail(page);
  await page.getByRole('link',{name:'Meet the ten proposed companions →'}).click();
  await expect(page).toHaveURL(/\/council\/237$/);
  await expect(page.getByText('Portrait pending intake',{exact:true})).toHaveCount(10);
  for(const c of roster){
   await page.getByRole('button',{name:`Meet ${c.name}`,exact:true}).click();
   await expect(page.getByRole('heading',{name:`${c.name} · Council appearance`,exact:true})).toBeVisible();
   await page.reload();await dismissTrail(page);
   await page.getByRole('link',{name:`Return to Circle 237 · ${c.name}`,exact:true}).click();
   await expect(page.getByRole('button',{name:`Meet ${c.name}`,exact:true})).toBeFocused();
  }
  await page.getByRole('link',{name:'Read the draft invitation'}).click();
  await expect(page.locator('.circle237 time')).toHaveAttribute('datetime','2026-10-20T19:30:00+01:00');
  await expect(page.getByText('19:30 UK (BST)',{exact:false})).toBeVisible();
  await expect(page.getByText('Awaiting Ed’s approval. No approved question has been assigned.')).toBeVisible();
  await expect(page.getByRole('link',{name:'Council community · Telegram'})).toHaveAttribute('href','https://t.me/s33dlife');
  await expect(page.getByText('The community link is not a verified direct Fire-room URL.')).toBeVisible();
  await page.screenshot({path:`output/playwright/circle237-integration/${test.info().project.name}-invitation-${width}.png`});
  await page.getByRole('link',{name:'Return to Circle 237',exact:true}).click();
  await page.getByRole('button',{name:'Meet Noku / Nokuphila',exact:true}).click();
  await page.goBack();await expect(page.getByRole('button',{name:'Meet Noku / Nokuphila',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`output/playwright/circle237-integration/${test.info().project.name}-2d-${width}.png`});
  await page.getByRole('link',{name:'Return to the Council Canopy'}).click();
  await expect(page.getByRole('heading',{name:'Circle 236',exact:true})).toBeVisible();
 });
}
test('TETOL Canopy reaches spatial237 and all ten frames accept real touch',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});
 await context.addInitScript(disconnectedTransport);
 await context.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:4240'?r.continue():r.abort());
 const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.getByRole('button',{name:'Dismiss trail',exact:true}).click({timeout:3000}).catch(()=>{});
 await page.getByRole('button',{name:'Council of Life The Canopy'}).click();
 await page.getByRole('link',{name:'Circle 237 · spatial Council draft →'}).click();
 for(const [index,c] of roster.entries()){
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
 await page.getByRole('link',{name:'Circle 236 · Open · meet its companions →'}).click();
 await expect(page.getByText('Canopy · OPEN')).toBeVisible();
 await expect(page.locator('.circle-companion-frames figure')).toHaveCount(7);
 await expect(page.getByText('Fire reference · past date.',{exact:false})).toBeVisible();
 await page.reload();await expect(page.getByText('Canopy · OPEN')).toBeVisible();
});
