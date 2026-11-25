import {test,expect} from '@playwright/test';
import current from '../../public/council/circle-242/catalogue.json' with {type:'json'};
import previous from '../../public/council/circle-241/catalogue.json' with {type:'json'};
import {disconnectedTransport} from '../fixtures/circle237-disconnected-transport';
test.use({hasTouch:true});
for(const edition of [current,previous]){
 test(`Circle ${edition.number}: all folios, keyboard, URL history and 2D to 3D context`,async({page},info)=>{
  await page.addInitScript(disconnectedTransport);
  await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
  await page.goto(`/council/canopy.html?circle=${edition.number}`);
  await page.getByRole('button',{name:'Meet the companions →',exact:true}).click();
  const nav=page.getByRole('navigation',{name:'Meet the companions',exact:true});
  for(const [index,c] of edition.companions.entries()){
   await expect(nav.getByRole('status')).toContainText(`Companion ${index+1} of 10`);
   const frame=page.locator('li:visible canopy-folio-frame');await expect(frame).toHaveAttribute('companion-key',c.key);
   const flip=frame.getByRole('button',{name:`Reveal reverse of ${c.label}`,exact:true});await expect(flip).toBeEnabled();await flip.focus();await flip.press('Enter');
   await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','true');
   await frame.getByText('Read the reverse as text',{exact:true}).click();await expect(frame.locator('details').first().locator('pre')).toHaveText(c.reverse.readableText);
   await expect(frame.locator('img')).toHaveAttribute('src',c.reverse.artwork);
   const natural=await frame.locator('img').evaluate((image:HTMLImageElement)=>({w:image.naturalWidth,h:image.naturalHeight}));expect(natural.w/natural.h).toBeCloseTo(c.reverse.width/c.reverse.height,2);
   if(index===0){await page.goBack();await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','false');await page.goForward();await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','true');}
   if(index<9)await nav.getByRole('button',{name:'Next companion →',exact:true}).click();
  }
  await expect(nav.getByRole('button',{name:'Next companion →',exact:true})).toBeDisabled();
  await nav.getByLabel('Choose companion').selectOption(edition.companions[4].key);
  await page.locator('li:visible canopy-folio-frame').getByRole('button').click();
  const link=page.getByRole('link',{name:'Continue in original 3D TETOL',exact:true});await expect(link).toHaveAttribute('href',new RegExp(`circle=${edition.number}.*side=reverse#${edition.companions[4].id}`));
  await page.screenshot({type:'jpeg',quality:90,path:`output/playwright/enduring-canopy/${info.project.name}-${edition.number}-reader.jpg`});
  await nav.getByRole('button',{name:'Return to gathering',exact:true}).click();await expect(page.locator('li:visible canopy-folio-frame')).toHaveCount(10);
 });
 test(`Circle ${edition.number}: original Tree guided navigation and surface continuity`,async({page},info)=>{
  test.setTimeout(90000);
  await page.addInitScript(disconnectedTransport);
  await page.addInitScript(()=>{window.requestAnimationFrame=callback=>window.setTimeout(()=>callback(performance.now()),250);window.cancelAnimationFrame=id=>clearTimeout(id);});
  await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
  await page.goto(`/tetol/circle-235/pre-fire/tetol.html?circle=${edition.number}#croom`);
  await page.waitForFunction(()=>!!(document.querySelector('three-d-stage') as any)?._renderer);
  await page.evaluate(()=>{const r=(document.querySelector('three-d-stage') as any)._renderer,draw=r.render.bind(r);r.render=(...args:any[])=>{if(r.__draw){r.__draw=false;draw(...args);}};r.__draw=true;});
  await page.keyboard.press('Shift');const panel=page.locator('#panel');
  await panel.getByRole('button',{name:'Meet the companions →',exact:true}).click();
  for(const [i,c] of edition.companions.entries()){
   await expect(panel.getByRole('status').first()).toContainText(`Companion ${i+1} of 10`);
   const frame=panel.locator('canopy-folio-frame');await expect(frame).toHaveAttribute('companion-key',c.key);
   await frame.getByRole('button').click();await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','true');
   await page.waitForFunction(({id,artwork})=>(document.querySelector('three-d-stage') as any)._scene.getObjectByName(id+'_artwork')?.material.map?.image?.src?.endsWith(artwork),{id:c.id,artwork:c.reverse.artwork});
   await page.evaluate(()=>(document.querySelector('three-d-stage') as any)._renderer.__draw=true);await page.waitForFunction(()=>(document.querySelector('three-d-stage') as any)._renderer.__draw===false);
   expect(await page.evaluate(id=>{const texture=(document.querySelector('three-d-stage') as any)._scene.getObjectByName(id+'_artwork').material.map;return {repeat:texture.repeat.toArray(),offset:texture.offset.toArray()};},c.id)).toEqual({repeat:[1,1],offset:[0,0]});
   if(i<9)await panel.getByRole('button',{name:'Next companion →',exact:true}).click();
  }
  await panel.getByLabel('Choose companion').selectOption(edition.companions[4].key);
  const frame=panel.locator('canopy-folio-frame');await frame.getByRole('button').click();await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','true');
  await page.goBack();await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','false');await page.goForward();await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','true');
  await page.screenshot({type:'jpeg',quality:90,path:`output/playwright/enduring-canopy/${info.project.name}-${edition.number}-tree.jpg`});
  await panel.getByRole('link',{name:'Continue in 2D Council',exact:true}).click();
  await expect(page.locator('li:visible canopy-folio-frame')).toHaveAttribute('companion-key',edition.companions[4].key);await expect(page.locator('li:visible canopy-folio-frame').getByRole('button')).toHaveAttribute('aria-pressed','true');
  await page.reload();await expect(page.locator('li:visible canopy-folio-frame').getByRole('button')).toHaveAttribute('aria-pressed','true');
 });
}
for(const width of [320,390])test(`${width}px reduced-motion touch-sized controls, gathering return and unknown edition rejection`,async({page},info)=>{
 await page.setViewportSize({width,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/council/circle-242/index.html');await page.getByRole('button',{name:'Meet the companions →',exact:true}).click();
 const nav=page.getByRole('navigation',{name:'Meet the companions',exact:true});await expect(nav.getByRole('button',{name:'← Previous companion',exact:true})).toBeDisabled();await nav.getByRole('button',{name:'Next companion →',exact:true}).tap();
 expect(await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth)).toBe(true);
 for(const b of await nav.getByRole('button').all())expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44);
 await page.screenshot({type:'jpeg',quality:90,path:`output/playwright/enduring-canopy/${info.project.name}-mobile${width}.jpg`});await nav.getByRole('button',{name:'Return to gathering',exact:true}).click();await expect(page.locator('li:visible canopy-folio-frame')).toHaveCount(10);
 await page.goto('/council/canopy.html?circle=999');await expect(page.locator('#notice')).toContainText('unavailable');await expect(page.locator('canopy-folio-frame')).toHaveCount(0);
});

test('390px original Tree retains grab gestures, companion touch and side continuity',async({page})=>{
 test.setTimeout(90000);
 await page.setViewportSize({width:390,height:844});await page.addInitScript(disconnectedTransport);
 await page.addInitScript(()=>{window.requestAnimationFrame=callback=>window.setTimeout(()=>callback(performance.now()),250);window.cancelAnimationFrame=id=>clearTimeout(id);});
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
 await page.goto('/tetol/circle-235/pre-fire/tetol.html?circle=242#croom');
 await page.waitForFunction(()=>!!(document.querySelector('three-d-stage') as any)?._renderer);
 await page.evaluate(()=>{const r=(document.querySelector('three-d-stage') as any)._renderer,draw=r.render.bind(r);r.render=(...args:any[])=>{if(r.__draw){r.__draw=false;draw(...args);}};r.__draw=true;});
 await page.keyboard.press('Shift');const panel=page.locator('#panel'),grab=page.locator('#grab');
 await grab.tap();await expect(grab).toHaveAttribute('aria-expanded','true');
 await panel.getByRole('button',{name:'Meet the companions →',exact:true}).tap();
 await expect(panel.getByRole('status').first()).toContainText('Companion 1 of 10');
 await panel.getByRole('button',{name:'Next companion →',exact:true}).tap();await expect(panel.getByRole('status').first()).toContainText('Companion 2 of 10');
 const frame=panel.locator('canopy-folio-frame');await frame.getByRole('button').tap();await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','true');
 await page.goBack();await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','false');await page.goForward();await expect(frame.getByRole('button')).toHaveAttribute('aria-pressed','true');
 await panel.getByRole('button',{name:'Return to gathering',exact:true}).tap();await expect(panel.getByRole('button',{name:'Meet the companions →',exact:true})).toBeVisible();
});
