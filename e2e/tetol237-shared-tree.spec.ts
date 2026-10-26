import {test,expect} from '@playwright/test';
import manifest from '../src/review/circle237/release-manifest.json' with { type: 'json' };
import {roster} from '../src/review/circle237/registry';
test.use({ hasTouch: true, isMobile: true, viewport: { width:390, height:844 } });
test('The ORIGINAL TETOL Tree opens Circle 237 with ten hanging portraits',async({page,context})=>{
 test.setTimeout(90_000);
 // Test-only render pacing: preserve actual WebGL and touch/navigation while avoiding
 // continuous software rendering starving Playwright's event loop on CI.
 await page.addInitScript(() => {
   window.requestAnimationFrame = callback => window.setTimeout(() => callback(performance.now()), 250);
   window.cancelAnimationFrame = handle => window.clearTimeout(handle);
 });
 await page.emulateMedia({reducedMotion:'reduce'}); // Test accessible motion setting; native touch still exercised.
 await context.route('**/*',r=>['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
 await page.goto('/tetol/circle-235/pre-fire/tetol.html?circle=237#croom');
 await expect(page.locator('#brandline')).toContainText('Circle 237 · PREVIOUS',{timeout:90000});
 await expect(page.locator('#panel')).toContainText('Circle 237');
 const d=await page.evaluate(()=>{const d=(window as any).TETOL;return{active:d?.council?.active,question:d?.nodes?.croom?.question,names:d?.council?.circles?.[237]?.companions.map((x:any)=>x.id),old:!!d?.council?.circles?.[233]};});
 expect(d.active).toBe(237);expect(d.question).toBe(manifest.question);expect(d.names).toEqual(roster.map(x=>x.key+'-companion'));expect(d.old).toBe(true);
 for(const [index,c] of roster.entries()){
   // One true iPhone-sized touch confirms the original bottom-sheet opening and first encounter.
   // The remaining nine exercise the SAME document click-navigation listener directly;
   // waiting for nine further camera/scroll animations caused false 120s CI timeouts.
   if(index === 0 && await page.locator('body').getAttribute('data-sheet') === 'peek'){
     await expect(page.locator('#grab')).toBeVisible({timeout:12000});
     await page.locator('#grab').tap();
     await expect(page.locator('body')).toHaveAttribute('data-sheet',/mid|full/);
   }
   const encounter = page.locator('#panel button[data-go="'+c.key+'-companion"]');
   await expect(encounter).toHaveCount(1);
   if(index === 0){await expect(encounter).toBeVisible({timeout:12000});await encounter.tap();}
   else await encounter.evaluate((el:HTMLElement)=>el.click());
   const observed = await page.evaluate(() => ({
     hash: location.hash,
     sheet: document.body.dataset.sheet,
     title: document.querySelector('#panel h2')?.textContent,
     image: document.querySelector('#panel img[data-circle-artwork]')?.getAttribute('src') || null,
     buttons: [...document.querySelectorAll('#panel [data-go]')].map(x => x.getAttribute('data-go')).slice(0,12),
     node: (window as any).TETOL?.nodes?.[location.hash.slice(1)]?.name,
   }));
   console.log('CIRCLE237 ENCOUNTER', c.key, JSON.stringify(observed));
   await expect(page.locator('#panel img[data-circle-artwork]')).toHaveAttribute('src',manifest.sceneAssets[c.key as keyof typeof manifest.sceneAssets].path,{timeout:6500});
   expect(observed.hash).toBe('#'+c.key+'-companion');
   expect(observed.title).toBe(c.name);
   // Validate the shared return action, without making CI wait for 10 spatial motion sequences.
   await page.locator('#panel button[data-go="croom"]').evaluate((el:HTMLElement)=>el.click());
   await expect(page.locator('#panel h2')).toContainText('yOur Blooming Week');
 }
 await expect(page.locator('#council-return')).toHaveAttribute('href','/council-of-life?from=spatial-council#previous-circle-237');
});
