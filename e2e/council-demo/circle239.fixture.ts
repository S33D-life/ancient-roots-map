import { test, expect } from '@playwright/test';
import manifest from '../../public/council/circle-239/companions.json' with {type:'json'};
import { disconnectedTransport } from '../fixtures/circle237-disconnected-transport';

const tree = '/tetol/circle-235/pre-fire/tetol.html';
test.beforeEach(async ({context,page}) => {
  await context.addInitScript(disconnectedTransport);
  await context.route('**/*', r => {
    const request=r.request();
    if (!['127.0.0.1','localhost'].includes(new URL(request.url()).hostname) || !['GET','HEAD'].includes(request.method())) return r.abort();
    return r.continue();
  });
  await page.emulateMedia({reducedMotion:'reduce'});
});

for(const width of [320,390,1440]) test(`239 fronts: ten2D encounters, keyboard/Back/refresh and return at ${width}`,async ({page}) => {
  await page.setViewportSize({width,height:844}); await page.goto('/council-of-life');
  await expect(page.getByRole('region',{name:'Current Circle'})).toContainText(manifest.question);
  await expect(page.getByRole('region',{name:'Previous Circle 238'})).toContainText('PREVIOUS');
  await page.getByRole('link',{name:'Enter Circle 239 · meet its companions →'}).click();
  await expect(page.getByRole('heading',{level:1})).toHaveText(manifest.title);
  await expect(page.getByRole('heading',{level:1})).toBeFocused();
  await expect(page.locator('img.companion-scene')).toHaveCount(10);
  for(const c of manifest.companions) {
    const button=page.getByRole('button',{name:'Meet '+c.label,exact:true}); await button.focus(); await button.press('Enter');
    await expect(page.getByRole('heading',{name:c.label,exact:true})).toBeFocused();
    const image=page.getByRole('img',{name:c.alt,exact:true}); await expect(image).toHaveJSProperty('naturalWidth',1536); await expect(image).toHaveJSProperty('naturalHeight',1024);
    await expect(page.getByRole('link',{name:'Meet this companion in the original TETOL →'})).toHaveAttribute('href',`${tree}?circle=239#${c.id}`);
    if(c.order===1) { await page.reload(); await expect(page.getByRole('heading',{name:c.label,exact:true})).toBeFocused(); }
    await page.getByRole('button',{name:'Return to Circle 239',exact:true}).click(); await expect(page.getByRole('button',{name:'Meet '+c.label,exact:true})).toBeFocused();
  }
  await page.goBack(); await expect(page.getByRole('region',{name:'Companion encounter'})).toContainText('The Secret Garden');
  await page.goForward(); await expect(page.getByRole('region',{name:'Ten Council companions'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.getByRole('button',{name:/flip|upload|submit|record|vote/i})).toHaveCount(0);
  await page.screenshot({path:`output/playwright/circle239/${test.info().project.name}-2d-${width}.png`,fullPage:true});
});

test('239 original Tree: real frames, first touch, all ten encounters, hearth, Staff Room and history',async ({page}) => {
  test.setTimeout(120000); await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{window.requestAnimationFrame=cb=>window.setTimeout(()=>cb(performance.now()),250);window.cancelAnimationFrame=id=>clearTimeout(id);});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${tree}?circle=239#croom`);
  await expect(page.locator('#brandline')).toContainText('239 · CURRENT / OPEN');
  await expect(page.locator('#panel')).toContainText(manifest.question);
  await page.waitForFunction(()=>!!(document.querySelector('three-d-stage') as any)?._renderer);
  const frames=await page.evaluate(ids=>{
    const stage=document.querySelector('three-d-stage') as any,meshes:any[]=[];
    stage._scene.traverse((m:any)=>{if(ids.some(id=>m.name===id+'_artwork'))meshes.push({name:m.name,width:m.geometry.parameters.width,height:m.geometry.parameters.height,repeat:m.material.map.repeat.toArray(),offset:m.material.map.offset.toArray()});});return meshes;
  },manifest.companions.map(c=>c.id));
  expect(frames).toHaveLength(10);for(const f of frames){expect(f.width/f.height).toBeCloseTo(1.5);expect(f.repeat).toEqual([1,1]);expect(f.offset).toEqual([0,0]);}
  if(await page.locator('body').getAttribute('data-sheet')==='peek')await page.locator('#grab').tap();
  await expect(page.locator('body')).toHaveAttribute('data-sheet',/mid|full/);
  await page.screenshot({path:`output/playwright/circle239/${test.info().project.name}-original-tree-390.png`});
  for(const [i,c] of manifest.companions.entries()){
    const button=page.locator(`#panel [data-go="${c.id}"]`);if(i===0)await button.tap();else await button.evaluate((el:HTMLElement)=>el.click());
    await expect(page.locator('#panel h2')).toHaveText(c.label); await expect(page.locator('#panel img[data-circle-artwork]')).toHaveAttribute('src',c.artwork);
    await expect(page.locator('#panel a').filter({hasText:'Visit the 2D Circle 239'})).toHaveAttribute('href','/council/239?companion='+c.key);
    if(i===0){
      await page.screenshot({path:`output/playwright/circle239/${test.info().project.name}-encounter-390.png`});
      // Initial WebGL and touch are real. Bound drawing only for the remaining panel checks.
      await page.evaluate(()=>{(document.querySelector('three-d-stage') as any)._renderer.render=()=>{};});
    }
    await page.locator('#panel [data-go="croom"]').evaluate((el:HTMLElement)=>el.click());
  }
  await page.evaluate(()=>(window as any).TETOL_NAV.do('goTo','live_fire'));await expect(page.locator('#panel')).toContainText('No scheduled Fire');
  await expect(page.locator('#panel')).not.toContainText('Circle 235');
  await expect(page.locator('#panel [data-go="@opencircle"]')).toHaveCount(0);
  await page.evaluate(()=>(window as any).TETOL_NAV.do('goTo','seat_you'));await expect(page.locator('#panel h2')).toHaveText('A place to pause');await expect(page.locator('#panel')).toContainText('no offering or attendance is recorded');
  await page.evaluate(()=>(window as any).TETOL_NAV.do('goTo','staff'));await expect(page.locator('#panel')).toContainText('Staff Room');
  await page.evaluate(()=>(window as any).TETOL_NAV.do('goTo','croom'));await expect(page.locator('#council-return')).toHaveAttribute('href','/council-of-life?from=spatial-council&circle=239#next-gathering');
  await page.locator('#council-time-tree a[rel=prev]').evaluate((el:HTMLElement)=>el.click());
  await expect(page).toHaveURL(/circle=238#croom$/);await expect(page.locator('#brandline')).toContainText('238 · PREVIOUS');
  await page.locator('#council-time-tree a').filter({hasText:'Return to current · 239'}).evaluate((el:HTMLElement)=>el.click());
  await expect(page).toHaveURL(/circle=239#croom$/);await expect(page.locator('#brandline')).toContainText('239 · CURRENT / OPEN');
  expect(errors).toEqual([]);
});

test('239 retains the full234–239 Time Tree and correct current return',async ({page}) => {
  await page.goto('/council/239'); const selector=page.getByRole('combobox',{name:'Choose a Council Circle'});
  await expect(selector.locator('option')).toHaveText(['234 · HISTORICAL','235 · HISTORICAL','236 · HISTORICAL','237 · HISTORICAL','238 · PREVIOUS','239 · CURRENT / OPEN']);
  await page.getByRole('link',{name:'← Previous Circle',exact:true}).click();await expect(page).toHaveURL(/\/council\/238$/);
  await page.getByRole('link',{name:'Return to current · 239',exact:true}).click();await expect(page).toHaveURL(/\/council\/239$/);
  await page.goBack();await expect(page).toHaveURL(/\/council\/238$/);await page.goForward();await expect(page).toHaveURL(/\/council\/239$/);
});

test('239 unavailable manifest fails closed without substituting235',async ({page}) => {
  await page.route('**/council/circle-239/companions.json',r=>r.fulfill({status:503,body:'Unavailable'}));
  await page.goto(`${tree}?circle=239#croom`);await expect(page.getByRole('alert')).toContainText('No other edition has been substituted');await expect(page.locator('canvas')).toHaveCount(0);
});
