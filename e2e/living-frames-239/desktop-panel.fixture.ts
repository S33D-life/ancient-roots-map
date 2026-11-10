import {test,expect} from '@playwright/test';
import companions from '../../public/council/circle-239/companions.json' with {type:'json'};
import {disconnectedTransport} from '../fixtures/circle237-disconnected-transport';
const tree='/tetol/circle-235/pre-fire/tetol.html?circle=239#croom';
async function originalTree(page){
 await page.addInitScript(disconnectedTransport);
 // Keep the same software-renderer pacing as the other living-frame fixtures,
 // including after a full navigation to an archived edition.
 await page.addInitScript(() => {
  window.requestAnimationFrame = callback => window.setTimeout(() => callback(performance.now()), 250);
  window.cancelAnimationFrame = id => clearTimeout(id);
 });
 await page.route('**/*',r=>{const q=r.request();return new URL(q.url()).hostname==='127.0.0.1'&&['GET','HEAD'].includes(q.method())?r.continue():r.abort();});
 await page.goto(tree);
 await page.waitForFunction(()=>!!(document.querySelector('three-d-stage') as any)?._renderer);
 // Preserve the real renderer; bound its continuous software-GPU work, drawing each tested side explicitly.
 await boundDrawing(page);
 await page.keyboard.press('Shift'); // ordinary input ends arrival and wakes the existing interface
}
async function boundDrawing(page){
 await page.evaluate(()=>{const r=(document.querySelector('three-d-stage') as any)._renderer,draw=r.render.bind(r);r.__panelDraw=()=>r.__panelBudget=1;r.render=(...args:any[])=>{if(r.__panelBudget>0){r.__panelBudget--;draw(...args);}};});
}
async function draw(page){await page.evaluate(()=>(document.querySelector('three-d-stage') as any)._renderer.__panelDraw());await page.waitForFunction(()=>(document.querySelector('three-d-stage') as any)._renderer.__panelBudget===0);}

test('desktop panel: idle wake, keyboard reading, all ten reverse pairs and returns',async({page},info)=>{
 // Two real idle intervals and four full Tree boots share this test budget.
 test.setTimeout(180000);
 await page.setViewportSize({width:1440,height:900});await originalTree(page);
 const panel=page.locator('#panel'),first=panel.getByRole('button',{name:companions.companions[0].label,exact:true});
 // The old probe intentionally waited for stillness, then clicked a pointer-disabled element.
 await page.waitForFunction(()=>document.body.classList.contains('g-still'),{},{timeout:20000});
 await expect(panel).toHaveCSS('pointer-events','none');
 await page.mouse.move(720,400);await expect(page.locator('body')).not.toHaveClass(/g-still/);
 await first.focus();await expect(first).toBeFocused();
 // Keep the focused keyboard reading path visible after the real idle timer, without forcing a click.
 await page.waitForFunction(()=>document.body.classList.contains('g-still'),{},{timeout:20000});
 await expect(panel).toHaveCSS('pointer-events','auto');await expect(panel).toHaveCSS('opacity','1');
 await page.screenshot({path:`output/playwright/desktop-panel/${info.project.name}-focused-idle.png`});
 for(const c of companions.companions){
  const choice=panel.getByRole('button',{name:c.label,exact:true});await choice.focus();if(c.order%2)await choice.press('Enter');else await choice.click();
  const frame=page.locator('council-living-frame'),flip=frame.getByRole('button');await expect(flip).toHaveAttribute('aria-pressed','false');
  await flip.focus();await flip.press('Enter');await expect(flip).toHaveAttribute('aria-pressed','true');await expect(flip).toBeFocused();
  await page.waitForFunction(id=>(document.querySelector('three-d-stage') as any)._scene.getObjectByName(id+'_artwork')?.material.map?.image?.src?.includes('/reverses/'),c.id);await draw(page);
  const texture=await page.evaluate(id=>{const m=(document.querySelector('three-d-stage') as any)._scene.getObjectByName(id+'_artwork');return {repeat:m.material.map.repeat.toArray(),offset:m.material.map.offset.toArray()};},c.id);expect(texture).toEqual({repeat:[1,1],offset:[0,0]});
  if(c.order===1){await page.screenshot({path:`output/playwright/desktop-panel/${info.project.name}-reverse.png`});await page.reload();await page.waitForFunction(()=>!!(document.querySelector('three-d-stage') as any)?._renderer);await boundDrawing(page);await page.keyboard.press('Shift');await expect(flip).toHaveAttribute('aria-pressed','true');}
  await flip.press('Enter');await expect(flip).toHaveAttribute('aria-pressed','false');
  if(c.order===1){await page.goBack();await expect(flip).toHaveAttribute('aria-pressed','true');await page.goForward();await expect(flip).toHaveAttribute('aria-pressed','false');}
  // Mouse activation is checked separately: macOS WebKit may intentionally blur a clicked button.
  await flip.click();await expect(flip).toHaveAttribute('aria-pressed','true');await flip.click();await expect(flip).toHaveAttribute('aria-pressed','false');
  await page.getByRole('button',{name:'Return to the Council Deck',exact:true}).click();
 }
 await page.getByRole('link',{name:'← Previous Circle',exact:true}).click();
 await expect(page).toHaveURL(/\?circle=238#croom$/);
 // A committed URL can precede the loader replacing the static prototype label.
 await expect(page.locator('#brandline')).toHaveText('TETOL · Circle 238 · HISTORICAL', {timeout: 20000});
 // The edition label is installed before the Tree has finished booting.
 await page.waitForFunction(() => Boolean((window as any).__tetol));
 await boundDrawing(page);
 await page.keyboard.press('Shift');
 await expect(panel).toHaveCSS('pointer-events', 'auto');
 const returnLink = page.getByRole('link',{name:'Return to current · 240',exact:true});
 await returnLink.focus();
 await expect(returnLink).toBeFocused();
 await returnLink.press('Enter');
 await expect(page).toHaveURL(/\?circle=240#croom$/);
 await expect(page.locator('#brandline')).toHaveText('TETOL · Circle 240 · CURRENT / OPEN', {timeout: 20000});
});
