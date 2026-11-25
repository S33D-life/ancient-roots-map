import {test,expect} from '@playwright/test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {installBoundedTreeRendering, drawTreeFrame as drawRealFrame} from './fixtures/bounded-tree-rendering';
const circle=JSON.parse(readFileSync('public/council/circle-242/catalogue.json','utf8'));
const assets=JSON.parse(readFileSync('public/council/circle-242/asset-manifest.json','utf8'));
import {disconnectedTransport} from './fixtures/circle237-disconnected-transport';
test.beforeEach(async({context})=>{
 await context.addInitScript(disconnectedTransport);
 await context.route('**/*',r=>['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname)&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
});
for(const width of [320,390,1440])test(`242: ten full pairs and visible readings at ${width}px`,async({page,request})=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/council/circle-242/index.html');await expect(page.locator('#question')).toHaveText(circle.question);
 for(const [i,c] of circle.companions.entries()){
  await page.getByLabel('Choose companion',{exact:true}).selectOption(c.key);
  const f=page.locator('li:visible canopy-folio-frame'),im=f.locator('img');
  await im.evaluate((image:HTMLImageElement)=>image.decode());
  const bounds=await im.boundingBox();expect(bounds!.width/bounds!.height).toBeCloseTo(c.width/c.height,2);
  await f.getByRole('button',{name:'Reveal reverse of '+c.label}).focus();await page.keyboard.press('Space');
  await expect(f.locator('button[aria-pressed=true]')).toBeVisible();await im.evaluate((image:HTMLImageElement)=>image.decode());
  await expect(im).toHaveAttribute('src',c.reverse.artwork);
  await expect(f.getByText('Learning note — '+c.learningNote,{exact:true})).toBeVisible();
  await f.getByText('Read the reverse as text',{exact:true}).click();await expect(f.locator('details').first().locator('pre')).toHaveText(c.reverse.readableText);
  await expect(im).toHaveCSS('animation-name','none');
  const reverse=await im.boundingBox();expect(reverse!.width/reverse!.height).toBeCloseTo(c.reverse.width/c.reverse.height,2);
  await f.getByRole('button',{name:'Return to front of '+c.label}).click();await expect(f.locator('button[aria-pressed=false]')).toBeVisible();
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 for(const asset of assets){const response=await request.get('/council/circle-242/'+asset.file);expect(response.status()).toBe(200);expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(asset.sha256);}
});
// Same bounded real-render pattern as the historical Living Frames acceptance.
// Every tested front and reverse is still painted by the original renderer.
async function verifyAndDrawTexture(page:any,id:string,artwork:string){
 await page.waitForFunction(({id,artwork})=>{const mesh=(document.querySelector('three-d-stage') as any)._scene.getObjectByName(id+'_artwork');return mesh?.material.map?.image?.src?.endsWith(artwork);},{id,artwork});
 await drawRealFrame(page);
}
test('242 original Tree: opening-pause clicks, ten folios, Time Tree and Staff Room',async({page})=>{
 test.setTimeout(90_000);await page.setViewportSize({width:1440,height:1000});
 await installBoundedTreeRendering(page);
 // Keep the established animation cadence; each verified texture is explicitly
 // drawn by the real renderer without saturating CI's software GPU.
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{window.requestAnimationFrame=cb=>window.setTimeout(()=>cb(performance.now()),250);window.cancelAnimationFrame=id=>clearTimeout(id);});
 // Verify a fresh Staff Room deep link first, without a fifth full Tree boot at teardown.
 await page.goto('/tetol/circle-235/pre-fire/tetol.html?circle=242#staff');
 await page.waitForFunction(()=>!!(document.querySelector('three-d-stage') as any)?._renderer);
 await page.waitForFunction(()=>!!(window as any).__tetol);await expect(page.getByRole('heading',{name:'Staff Room',exact:true})).toBeAttached();await drawRealFrame(page);
 await page.evaluate(()=>(window as any).TETOL_NAV.do('goTo','croom'));
 // Keep the actual quiet-pause state active to catch pointer interception, not bypass it.
 await page.evaluate(()=>document.body.dataset.q='question');
 for(const c of circle.companions){
  await page.locator(`#panel button[data-go="${c.id}"]`).click();const f=page.locator('canopy-folio-frame');
  await verifyAndDrawTexture(page,c.id,c.artwork);
  await f.getByRole('button',{name:'Reveal reverse of '+c.label}).click();await expect(f.locator('button[aria-pressed=true]')).toBeVisible();
  await verifyAndDrawTexture(page,c.id,c.reverse.artwork);
  await expect(f.getByText('Learning note — '+c.learningNote,{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Return to gathering',exact:true}).click();
 }
 await page.getByRole('link',{name:'← Previous Circle',exact:true}).click();await expect(page.locator('#brandline')).toContainText('241 · PREVIOUS');await drawRealFrame(page);
 await page.getByRole('link',{name:'Next Circle →',exact:true}).click();await expect(page.locator('#brandline')).toContainText('242 · CURRENT / OPEN');await drawRealFrame(page);
 await page.goBack();await expect(page.locator('#brandline')).toContainText('241 · PREVIOUS');
 await drawRealFrame(page);
});
