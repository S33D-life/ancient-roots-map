import {test,expect} from '@playwright/test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
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
  const f=page.locator('circle-242-preview-frame').nth(i),im=f.locator('img');
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
test('242 original Tree: opening-pause clicks, ten folios, Time Tree and Staff Room',async({page})=>{
 test.setTimeout(90_000);await page.setViewportSize({width:1440,height:1000});
 await page.goto('/tetol/circle-235/pre-fire/tetol.html?circle=242#croom');await page.waitForFunction(()=>!!(window as any).__tetol);
 // Keep the actual quiet-pause state active to catch pointer interception, not bypass it.
 await page.evaluate(()=>document.body.dataset.q='question');
 for(const c of circle.companions){
  await page.locator(`#panel button[data-go="${c.id}"]`).click();const f=page.locator('council-242-frame');
  await f.getByRole('button',{name:'Reveal reverse of '+c.label}).click();await expect(f.locator('button[aria-pressed=true]')).toBeVisible();
  await expect(f.getByText('Learning note — '+c.learningNote,{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Return to the Council Deck',exact:true}).click();
 }
 await page.getByRole('link',{name:'← Previous Circle',exact:true}).click();await expect(page.locator('#brandline')).toContainText('241 · PREVIOUS');
 await page.getByRole('link',{name:'Next Circle →',exact:true}).click();await expect(page.locator('#brandline')).toContainText('242 · CURRENT / OPEN');
 await page.goBack();await expect(page.locator('#brandline')).toContainText('241 · PREVIOUS');
 await page.goto('/tetol/circle-235/pre-fire/tetol.html?circle=242#staff');await expect(page.getByRole('heading',{name:'Staff Room',exact:true})).toBeAttached();
});
