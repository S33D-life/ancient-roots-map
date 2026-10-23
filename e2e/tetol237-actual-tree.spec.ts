import {test,expect} from '@playwright/test';
import manifest from '../src/review/circle237/release-manifest.json';
import {roster} from '../src/review/circle237/registry';

// Static-only signed-out integration; no writes, Supabase calls or production credentials.
for(const width of [390,1440]){
 test('Original living TETOL hosts all ten current Circle 237 hanging companion frames at '+width,async({page,context})=>{
   test.setTimeout(120_000);
   await page.setViewportSize({width,height:850});
   await context.route('**/*',r=>['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
   await page.goto('/tetol/circle-237/pre-fire/tetol.html#croom');
   await expect(page.locator('#brandline')).toContainText('Circle 237 · OPEN',{timeout:90_000});
   await expect(page.locator('#panel')).toContainText('Circle 237',{timeout:90_000});
   const snapshot=await page.evaluate(()=>{
     const d=(window as any).TETOL;
     const companions=d?.council?.circles?.[237]?.companions||[];
     return {active:d?.council?.active,question:d?.nodes?.croom?.question,ids:companions.map((c:any)=>c.id),forms:companions.map((c:any)=>c.repr.form),historical:!!d?.council?.circles?.[235],hasScene:!!document.querySelector('three-d-stage')};
   });
   expect(snapshot.active).toBe(237);
   expect(snapshot.question).toBe(manifest.question);
   expect(snapshot.ids).toEqual(roster.map(c=>c.key+'-companion'));
   expect(snapshot.forms).toEqual(Array(10).fill('circleFrame'));
   expect(snapshot.historical).toBe(true);
   expect(snapshot.hasScene).toBe(true); // Same original 3D stage, not substitute 237 gallery.
   for(const companion of roster){
     const button=page.locator('#panel button[data-go="'+companion.key+'-companion"]');
     await expect(button).toHaveCount(1);
     await button.click();
     await expect(page.locator('#panel')).toContainText(companion.name);
     await expect(page.locator('#panel img[data-circle-artwork]')).toHaveAttribute('src',manifest.sceneAssets[companion.key as keyof typeof manifest.sceneAssets].path);
     await page.locator('#panel button[data-go="croom"]').click();
   }
   await expect(page.locator('#panel')).toContainText('yOur Blooming Week');
   await expect(page.locator('#council-return')).toHaveAttribute('href','/council-of-life?from=spatial-council#next-gathering');
 });
}
