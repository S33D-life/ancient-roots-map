import {test,expect} from '@playwright/test';
import {disconnectedTransport} from './fixtures/circle237-disconnected-transport';
const root='/tetol/circle-235/pre-fire/tetol.html';
test.use({hasTouch:true});
test.beforeEach(async({context,page})=>{
 await context.addInitScript(disconnectedTransport);
 await context.route('**/*',r=>['localhost','127.0.0.1'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{
  window.requestAnimationFrame=cb=>window.setTimeout(()=>cb(performance.now()),250);window.cancelAnimationFrame=id=>clearTimeout(id);
  const original=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(text,...args: [number,number,number?]){((this.canvas as any).__paintedText||=[]).push(text);return original.call(this,text,...args);};
 });
});
async function assertEdition(page:any,n:number){
 await expect(page.locator('#council-time-tree')).toContainText(`Circle ${n}`);
 await expect(page.locator('#panel h2')).toContainText(n===238?'Fig-wood':n===237?'Blooming':`Circle ${n}`);
 const state=await page.evaluate(()=>{const D=(window as any).TETOL,stage=document.querySelector('three-d-stage') as any,groups:any[]=[],signs:any[]=[];stage._scene.traverse((m:any)=>{if(/^circle_\d+_companions$/.test(m.name)&&m.visible)groups.push(m.name);if(m.name==='current_circle_identity_at_doorway')signs.push(m.material.map.image.__paintedText);});return {active:D.council.circles[D.council.active].number,current:D.nodes[D.council.current].name,question:D.nodes.croom.question,groups,signs};});
 if(n===236)expect(state.question).toBeNull();
 expect(state.active).toBe(n);expect(state.current).toBe(`Circle ${n}`);expect(state.groups).toHaveLength(1);expect(state.signs.flat()).toContain(`CIRCLE ${n}`);
}
for(const n of [238,237,236,235,234])test(`Circle ${n}: original sign, companions, legacy current ring, refresh and Staff Room`,async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const failed:string[]=[];page.on('response',r=>{if(r.url().includes('/council/')&&!r.ok())failed.push(r.url())});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${root}?circle=${n}#croom`);await page.waitForFunction(()=>!!(window as any).__tetol);
 await assertEdition(page,n);
 // Native touch opens the actual shared sheet; this is browser emulation, not real iPhone proof.
 if(await page.locator('body').getAttribute('data-sheet')==='peek')await page.locator('#grab').tap();
 await expect(page.locator('body')).toHaveAttribute('data-sheet',/mid|full/);
 await expect(page).toHaveURL(/#croom$/);
 const first=await page.evaluate(()=>{const d=(window as any).TETOL;return d.council.circles[d.council.active].companions[0].id;});
 await page.locator(`#panel [data-go="${first}"]`).tap();
 await expect(page).toHaveURL(new RegExp('#'+first+'$'));
 await expect(page.locator('#panel h2')).not.toBeEmpty();
 await page.goBack();await expect(page).toHaveURL(/#croom$/);await assertEdition(page,n);
 await page.goForward();await expect(page).toHaveURL(new RegExp('#'+first+'$'));
 await page.reload();await page.waitForFunction(()=>!!(window as any).__tetol);await expect(page).toHaveURL(new RegExp('#'+first+'$'));
 // The exact legacy hotspot that used to switch 238 to slot 233 / Circle 235.
 await page.evaluate(()=>(window as any).TETOL_NAV.do('goTo','c233now'));await assertEdition(page,n);
 if(await page.locator('body').getAttribute('data-sheet')==='peek')await page.locator('#grab').tap();
 await expect(page.locator('body')).toHaveAttribute('data-sheet',/mid|full/);
 await expect(page.locator('#council-time-tree select')).toBeVisible();
 await page.screenshot({path:`output/playwright/time-tree/${test.info().project.name}-${n}-390.png`});
 // Bound software rendering only AFTER the real scene, touch, navigation and screenshot.
 await page.evaluate(()=>{(document.querySelector('three-d-stage') as any)._renderer.render=()=>{}});
 await page.evaluate(()=>(window as any).TETOL_NAV.do('goTo','staff'));await expect(page.locator('#panel')).toContainText('Staff Room');
 await page.evaluate(()=>(window as any).TETOL_NAV.do('goTo','croom'));await assertEdition(page,n);
 expect(failed).toEqual([]);expect(errors).toEqual([]);
});
test('Time Tree walks 238 → 234 → 238, with browser Back/Forward and current return',async({page})=>{
 test.setTimeout(180000);await page.setViewportSize({width:390,height:844});await page.goto(`${root}?circle=238#croom`);
 for(const [index,n] of [238,237,236,235,234,235,236,237,238].entries()){
  await page.waitForFunction(()=>!!(window as any).__tetol);await assertEdition(page,n);
  await page.evaluate(()=>{(document.querySelector('three-d-stage') as any)._renderer.render=()=>{}});
  if(await page.locator('body').getAttribute('data-sheet')==='peek')await page.locator('#grab').tap();
  if(n===234){await page.locator('#council-time-tree a[rel=next]').tap();continue;}
  if(index<4)await page.locator('#council-time-tree a[rel=prev]').tap();
  else if(index<8)await page.locator('#council-time-tree a[rel=next]').tap();
 }
 await page.goBack();await page.waitForFunction(()=>!!(window as any).__tetol);await assertEdition(page,237);
 await page.goForward();await page.waitForFunction(()=>!!(window as any).__tetol);await assertEdition(page,238);
});
test('2D entry and selector agree with the original Tree at phone and desktop widths',async({page})=>{
 test.setTimeout(180000);
 for(const width of [320,1440]){
  await page.setViewportSize({width,height:900});await page.goto('/council-of-life');
  await expect(page.getByRole('region',{name:'Current Circle'})).toContainText('Circle 238');
  const entry=page.getByRole('link',{name:'Enter Circle 238 in the original 3D TETOL Council Deck →'});
  await expect(entry).toHaveAttribute('href',`${root}?circle=238#croom`);await entry.click();
  await page.waitForFunction(()=>!!(window as any).__tetol);await assertEdition(page,238);
  await page.goto('/council/238');await page.getByRole('combobox',{name:'Choose a Council Circle'}).selectOption('237');
  await expect(page).toHaveURL(/\/council\/237$/);await expect(page.locator('.council-time-tree')).toContainText('PREVIOUS');
  await page.getByRole('link',{name:'← Previous Circle',exact:true}).click();await expect(page).toHaveURL(/\/review\/council\/236$/);
  await page.getByRole('link',{name:'← Previous Circle',exact:true}).click();await expect(page).toHaveURL(/#previous-circle-235$/);
  await expect(page.locator('.council-time-tree').first().getByRole('combobox')).toHaveValue('235');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Enter the Circle →',exact:true}).click();
  const historical=page.frameLocator('#council-deck-preview iframe');
  await expect(historical.locator('#council-time-tree')).toContainText('Circle 235',{timeout:30000});
  if(await historical.locator('#grab').isVisible())await historical.locator('#grab').click();
  else await historical.locator('#panel').hover();
  await historical.locator('#council-time-tree a[rel=next]').click();
  await expect(page).toHaveURL(/tetol\.html\?circle=236#croom$/);
  await page.waitForFunction(()=>!!(window as any).__tetol);await assertEdition(page,236);

 }
});
test('failed edition manifest is unavailable, never a silent Circle 235 substitute',async({page})=>{
 await page.route('**/council/circle-238/companions.json',r=>r.fulfill({status:503,body:'Unavailable'}));
 await page.goto(`${root}?circle=238#croom`);await expect(page.getByRole('alert')).toContainText('No other edition has been substituted');await expect(page.locator('canvas')).toHaveCount(0);
});

test('loader/runtime version mismatch is unavailable instead of substituting a historical edition',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(window,'S33D_SHEET_GESTURE_READY',{get:()=>false,set:()=>{},configurable:true}));
 await page.goto(`${root}?circle=238#croom`);
 await expect(page.getByRole('alert')).toContainText('No other edition has been substituted');
 expect(await page.evaluate(()=>!!(window as any).__tetol)).toBe(false);
});
