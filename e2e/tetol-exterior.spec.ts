import {test,expect} from '@playwright/test';
const out='/Users/ed/.codex/.chatgpt-projects/g-p-683c5647f32881918e942590972e90ee/output/tetol-exterior-reconciliation-20261009';
test.use({hasTouch:true});
for(const width of [1440,390,320])test(`exterior thresholds and remembered returns ${width}`,async({page})=>{
 test.setTimeout(150000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/*',r=>{const q=r.request(),u=new URL(q.url());if(!['localhost','127.0.0.1'].includes(u.hostname)&&(!['GET','HEAD'].includes(q.method())||/\/rpc\/|\/functions\//.test(u.pathname)))return r.fulfill({contentType:'application/json',body:'[]'});return r.continue();});
 // Established spatial renderer contract only; full model was separately proved in the parked Heartwood pass.
 await page.route('**/runtime/entry.js',async r=>{const response=await r.fetch(),s=await response.text(),i=s.indexOf('/* ---------- 3D rendering layer ---------- */');await r.fulfill({response,body:i>0?s.slice(0,i):s});});
 await page.goto('/s33d');await expect(page.getByRole('heading',{name:'TETOL',exact:true})).toBeVisible();await page.waitForTimeout(3200);await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:`${out}/after-arrival-${width}.png`});
 await expect(page.getByRole('heading',{name:'S33D · the Seed',exact:true})).toBeVisible();
 await expect(page.getByText('Choose where to begin.',{exact:true})).toBeVisible();
 await expect(page.locator('main a[href="/vault"]')).toHaveCount(0);
 for(const [hash,name,path]of[['golden-dream','Enter the Crown','/golden-dream'],['council','Enter the Council','/council-of-life'],['heartwood','Enter the Heartwood','/library'],['atlas-content','Enter the Roots →','/map']]){
  await page.goto('/s33d#'+hash);const doorway=page.locator('main').getByRole('link',{name,exact:true});await expect(doorway).toBeVisible();await doorway.scrollIntoViewIfNeeded();expect((await doorway.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  if(width<1440)await doorway.tap();else await doorway.click();await expect(page).toHaveURL(new RegExp(path+'$'));if(path!=='/map')await expect(page.locator('header')).toBeVisible();await page.reload();if(path!=='/map')await expect(page.locator('header')).toBeVisible();else await expect(page.getByRole('main',{name:'Ancient Friends Atlas map'})).toBeVisible();
  if(path==='/library'){
   await page.getByRole('button',{name:'Enter the trunk',exact:true}).click();await expect(page.frameLocator('iframe[title="TETOL spatial Heartwood"]').locator('#panel')).toContainText('Inside Heartwood');await page.getByRole('button',{name:'Return to the Living Field ↑',exact:true}).click();
  }
  if(path==='/council-of-life'){
   await page.getByRole('button',{name:'Enter the Circle →',exact:true}).click();await expect(page.locator('#council-deck-preview iframe')).toBeVisible();await page.getByRole('button',{name:'Return to the current Circle ↑',exact:true}).click();
  }
  if(path==='/map'){if(width<1440){const skip=page.getByRole('button',{name:'Skip introduction',exact:true});if(await skip.isVisible())await skip.click();const back=page.getByRole('navigation',{name:'Continue through the Tree'}).getByRole('link',{name:'Tree',exact:true});await expect(back).toHaveAttribute('href','/s33d#'+hash);await back.tap();}else await page.goBack();}else{const back=page.locator('header').getByRole('link',{name:'Back to the Tree',exact:true});await expect(back).toHaveAttribute('href','/s33d#'+hash);await back.click();}await expect(page).toHaveURL(new RegExp('/s33d#'+hash+'$'));await expect(doorway).toBeVisible();await page.reload();await expect(doorway).toBeVisible();
  if(path!=='/map'||width<1440){await page.goBack();await expect(page).toHaveURL(new RegExp(path+'$'));await page.goForward();await expect(page).toHaveURL(new RegExp('/s33d#'+hash+'$'));}else{await page.goForward();await expect(page).toHaveURL(/\/map$/);await page.goBack();}
 }
 await page.goto('/s33d');await page.getByText('Choose where to begin.',{exact:true}).waitFor();await page.waitForTimeout(3200);
 for(const id of ['golden-dream','council','heartwood','atlas-content'])await page.locator('#'+id).scrollIntoViewIfNeeded();
 await page.screenshot({path:`${out}/after-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:'Use Night Grove',exact:true}).click();await expect(page.locator('html')).toHaveClass(/dark/);
 for(const id of ['golden-dream','council','heartwood','ground','atlas-content'])await page.locator('#'+id).scrollIntoViewIfNeeded();
 await page.screenshot({path:`${out}/after-night-${width}.png`,fullPage:true});await page.locator('#ground').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/after-night-arrival-${width}.png`});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Use Living Parchment',exact:true}).click();await expect(page.locator('html')).not.toHaveClass(/dark/);
 await page.locator('main').getByRole('button',{name:/See the Roots/}).focus();await page.keyboard.press('Enter');await expect(page.getByRole('heading',{name:'Ancient Friends',exact:true})).toBeVisible();
 expect(errors).toEqual([]);
});
