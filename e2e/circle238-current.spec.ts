import {test,expect} from '@playwright/test';
import manifest from '../public/council/circle-238/companions.json' with {type:'json'};
import {disconnectedTransport} from './fixtures/circle237-disconnected-transport';
test.use({hasTouch:true});
test.beforeEach(async({context,page})=>{
 await context.addInitScript(disconnectedTransport);await context.route('**/*',r=>['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
 await page.emulateMedia({reducedMotion:'reduce'});await page.addInitScript(()=>{window.requestAnimationFrame=cb=>window.setTimeout(()=>cb(performance.now()),250);window.cancelAnimationFrame=id=>clearTimeout(id);});
});
for(const width of [320,390,1440])test(`238 current, 237 previous, ten 2D encounters and history at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:844});await page.goto('/council-of-life');
 await expect(page.getByRole('region',{name:'Current Circle'})).toContainText('Circle 238');
 for(const n of [237,236,235])await expect(page.getByRole('region',{name:`Previous Circle ${n}`})).toBeVisible();
 await page.getByRole('link',{name:'Enter Circle 238 · meet its companions →'}).click();
 await expect(page.getByRole('heading',{name:'Circle 238 · Fig-wood Council'})).toBeVisible();
 await expect(page.getByText('Scene illustration awaiting verification',{exact:true})).toHaveCount(10);
 for(const c of manifest.companions){await page.getByRole('button',{name:'Meet '+c.label,exact:true}).click();await expect(page.getByRole('region',{name:'Companion encounter'})).toContainText(c.accuracyNote);await page.reload();await page.getByRole('button',{name:'Return to Circle 238',exact:true}).click();await expect(page.getByRole('button',{name:'Meet '+c.label,exact:true})).toBeFocused();}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`output/playwright/circle238/2d-${width}.png`,fullPage:true});
 await page.goto('/council/238?companion=private-person&return=https://evil.invalid');await expect(page.getByRole('button',{name:'Meet Fig',exact:true})).toBeVisible();
});
test('original immersive 238 Canopy, mobile sheet, ten encounters, Staff Room and history',async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width:390,height:844});
 await page.goto('/tetol/circle-235/pre-fire/tetol.html?circle=238#croom');
 await expect(page.locator('#brandline')).toContainText('Circle 238 · OPEN');
 const d=await page.evaluate(()=>({active:(window as any).TETOL.council.active,staff:(window as any).TETOL.nodes.staff.name,old:!!(window as any).TETOL.council.circles[233]}));expect(d).toEqual({active:238,staff:'Staff Room',old:true});
 if(await page.locator('body').getAttribute('data-sheet')==='peek'){await page.locator('#grab').tap();await expect(page.locator('body')).toHaveAttribute('data-sheet',/mid|full/);}
 for(const [i,c]of manifest.companions.entries()){
  const door=page.locator('#panel button[data-go="'+c.id+'"]');if(i===0)await door.tap();else await door.evaluate((el:HTMLElement)=>el.click());
  await expect(page.locator('#panel h2')).toHaveText(c.label);await expect(page.locator('#panel [data-artwork-pending]')).toHaveText('Scene illustration awaiting verification');if(i===0){await page.locator('#grab').tap();await expect(page.locator('#panel [data-artwork-pending]')).toBeVisible();}await expect(page.locator('#panel img')).toHaveCount(0);
  await page.locator('#panel button[data-go="croom"]').evaluate((el:HTMLElement)=>el.click());await expect(page.locator('#panel h2')).toHaveText('Fig-wood Council');
 }
 await page.screenshot({path:'output/playwright/circle238/original-tetol-390.png'});
 await page.goto('/tetol/circle-235/pre-fire/tetol.html?circle=238#staff');await expect(page.locator('#panel')).toContainText('Staff Room');
 await page.goto('/tetol/circle-235/pre-fire/tetol.html?circle=237#croom');await expect(page.locator('#brandline')).toContainText('237 · PREVIOUS');await expect(page.locator('#council-return')).toHaveAttribute('href','/council-of-life?from=spatial-council#previous-circle-237');
 await page.goto('/tetol/circle-235/pre-fire/tetol.html?circle=236#croom');await expect(page.locator('#brandline')).toContainText('236');
 await page.goto('/tetol/circle-235/pre-fire/tetol.html#staff');await expect(page.locator('#panel')).toContainText('Staff Room');
});
