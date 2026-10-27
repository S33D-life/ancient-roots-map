import {companionLore} from '../public/tetol/circle-235/pre-fire/runtime/companion-lore-238.js';
import {test,expect,type Page} from '@playwright/test';
import manifest from '../public/council/circle-238/companions.json' with {type:'json'};
import {disconnectedTransport} from './fixtures/circle237-disconnected-transport';
const route='/tetol/circle-235/pre-fire/tetol.html?circle=238';
test.use({hasTouch:true});test.setTimeout(90_000);
test.beforeEach(async({context,page})=>{
 await context.addInitScript(disconnectedTransport);
 await context.route('**/*',r=>['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{window.requestAnimationFrame=cb=>window.setTimeout(()=>cb(performance.now()),250);window.cancelAnimationFrame=id=>clearTimeout(id);});
});
async function ready(page:Page){await page.waitForFunction(()=>!!(window as any).__tetol);await page.waitForFunction(()=>document.body.classList.contains('inroom')&&!document.body.classList.contains('moving')&&!document.body.dataset.q);}
async function encounter(page:Page,index:number){
 const c=manifest.companions[index];await expect(page).toHaveURL(new RegExp('#'+c.id+'$'));
 await expect(page.locator('#panel h2')).toHaveText(c.label);await expect(page.locator('#panel .psub')).toHaveText(`${index+1} of 10 · ${c.kind} · Illustration`);
 await expect(page.locator('#panel img[data-circle-artwork]')).toHaveAttribute('src',c.artwork);
 await expect(page.locator('#panel')).toContainText(companionLore[c.key].text);await expect(page.locator('body')).toHaveAttribute('data-sheet','mid');
}
for(const [width,height] of [[320,844],[390,844],[430,932],[844,390],[1440,900]])test(`Clear entrance and bounded companion navigation at ${width}×${height}`,async({page},info)=>{
 if(width===390)test.setTimeout(150_000);
 await page.setViewportSize({width,height});await page.goto(route+'#croom');await ready(page);
 await expect(page.locator('#grab')).toContainText('Meet the 10 companions');
 await expect(page.locator('#council-return')).toHaveText('2D Council Canopy');
 await expect(page.locator('.leave')).toBeHidden();
 if(width===390)await page.screenshot({path:`output/playwright/126/${info.project.name}-gathering-390.png`});
 if(width<=600){
  await page.locator('#grab').tap();await expect(page).toHaveURL(/#croom$/);
  await expect(page.locator('body')).toHaveAttribute('data-sheet','mid');
 }else{await page.locator('body').press('Tab');}
 await expect(page.locator('.companion-question')).toHaveText(manifest.question);
 if(width<=600)await expect(page.locator('#grab')).toHaveAttribute('aria-expanded','true');
 if(width===390)await page.screenshot({path:`output/playwright/126/${info.project.name}-invitation-390.png`});
 await page.locator('#companion-start').tap();await encounter(page,0);
 for(const control of await page.locator('.companion-steps button,[data-companion-choice]').all())expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
 await expect(page.locator('#companion-previous')).toBeDisabled();
 if(process.env.CI)await page.evaluate(()=>(document.querySelector('three-d-stage') as any)._renderer.render=()=>{});
 const end=width===390?10:3;
 for(let i=1;i<end;i++){await page.locator('#companion-next').tap();await encounter(page,i);}
 if(width===390){
  await expect(page.locator('#companion-next')).toBeDisabled();
  await page.goBack();await encounter(page,8);await page.goForward();await encounter(page,9);
  await page.reload();await ready(page);await encounter(page,9);
  if(process.env.CI)await page.evaluate(()=>(document.querySelector('three-d-stage') as any)._renderer.render=()=>{});
 }
 await page.locator('#companion-previous').tap();await encounter(page,end-2);
 await page.getByRole('combobox',{name:'Choose a companion',exact:true}).selectOption(manifest.companions[2].id);await encounter(page,2);
 if(width===390)await page.screenshot({path:`output/playwright/126/${info.project.name}-peace-lily-390.png`});
 await page.locator('#companion-next').focus();await page.locator('#companion-next').press('Enter');await encounter(page,3);await expect(page.locator('#companion-next')).toBeFocused();
 await page.locator('#companion-gathering').tap();await expect(page).toHaveURL(/#croom$/);
 await expect(page.locator('[data-companion-choice]')).toBeFocused();await expect(page.locator('[data-companion-choice]')).toHaveValue(manifest.companions[3].id);
 await expect(page.locator('#council-time-tree')).toContainText('CURRENT / OPEN');
 // The one 2D exit never covers the invitation or companion controls.
 const exit=(await page.locator('#council-return').boundingBox())!,grab=(await page.locator(width<=600?'#grab':'#panel').boundingBox())!;
 expect(exit.y+exit.height<=grab.y||exit.x+exit.width<=grab.x||exit.x>=grab.x+grab.width).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#council-return').tap();await expect(page).toHaveURL(/council-of-life\?from=spatial-council&circle=238#next-gathering$/);
});
test('Direct companion deep link and ordered choice work before the 3D rendering layer',async({page})=>{
 await page.route('**/runtime/entry.js*',async r=>{const response=await r.fetch();const source=await response.text();const boundary=source.indexOf('/* ---------- 3D rendering layer ---------- */');expect(boundary).toBeGreaterThan(0);await r.fulfill({response,body:source.slice(0,boundary)});});
 await page.setViewportSize({width:390,height:844});await page.goto(route+'#peace-lily-companion');await encounter(page,2);
 await page.getByRole('combobox',{name:'Choose a companion',exact:true}).selectOption(manifest.companions[9].id);await encounter(page,9);
 await page.locator('#companion-gathering').tap();await expect(page.locator('.companion-question')).toHaveText(manifest.question);
 await page.getByRole('link',{name:'2D companion list →',exact:true}).click();await expect(page).toHaveURL(/\/council\/238$/);
 await expect(page.getByRole('button',{name:'Meet Fig',exact:true})).toBeVisible();
});
test('A real touch on a visible hanging portrait opens its matching recorded companion',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await page.goto(route+'#croom');await ready(page);
 const point=await page.evaluate(ids=>{
  const t=(window as any).__tetol,stage=document.querySelector('three-d-stage') as any;stage._scene.updateMatrixWorld(true);t.cam.updateMatrixWorld();
  const shown=(m:any)=>{for(;m;m=m.parent)if(!m.visible)return false;return true;};
  const picks:any[]=[];stage._scene.traverse((m:any)=>{if(m.isMesh&&m.userData.node&&shown(m))picks.push(m);});
  const canvas=stage.shadowRoot.querySelector('canvas'),box=canvas.getBoundingClientRect();
  for(const id of ids){
   const artwork=stage._scene.getObjectByName(id+'_artwork'),world=artwork.getWorldPosition(new t.THREE.Vector3());
   const normal=new t.THREE.Vector3(0,0,1).transformDirection(artwork.matrixWorld);if(normal.dot(t.cam.position.clone().sub(world))<=0)continue;
   const projected=world.clone().project(t.cam),x=box.left+(projected.x+1)*box.width/2,y=box.top+(1-projected.y)*box.height/2;
   if(projected.z<0||projected.z>1||x<20||x>innerWidth-20||y<90||y>innerHeight-180)continue;
   const ray=new t.THREE.Raycaster();ray.setFromCamera(new t.THREE.Vector2(projected.x,projected.y),t.cam);
   if(ray.intersectObjects(picks,false)[0]?.object.userData.node===id)return{id,x,y};
  }
  return null;
 },manifest.companions.map(c=>c.id));
 expect(point,'An existing front-facing portrait must be reachable without moving the camera').not.toBeNull();
 await page.touchscreen.tap(point!.x,point!.y);await encounter(page,manifest.companions.findIndex(c=>c.id===point!.id));
 await page.screenshot({path:`output/playwright/126/${info.project.name}-portrait-touch-390.png`});
 await page.locator('#companion-gathering').tap();await expect(page).toHaveURL(/#croom$/);await expect(page.locator('[data-companion-choice]')).toHaveValue(point!.id);
});
