import {test,expect} from '@playwright/test';
import manifest from '../src/review/circle237/release-manifest.json';
import {roster} from '../src/review/circle237/registry';
test('The ORIGINAL TETOL Tree opens Circle 237 with ten hanging portraits',async({page,context})=>{
 test.setTimeout(120_000);await page.setViewportSize({width:390,height:844});
 await context.route('**/*',r=>['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
 await page.goto('/tetol/circle-235/pre-fire/tetol.html?circle=237#croom');
 await expect(page.locator('#brandline')).toContainText('Circle 237 · OPEN',{timeout:90000});
 await expect(page.locator('#panel')).toContainText('Circle 237');
 const d=await page.evaluate(()=>{const d=(window as any).TETOL;return{active:d?.council?.active,question:d?.nodes?.croom?.question,names:d?.council?.circles?.[237]?.companions.map((x:any)=>x.id),old:!!d?.council?.circles?.[235]};});
 expect(d.active).toBe(237);expect(d.question).toBe(manifest.question);expect(d.names).toEqual(roster.map(x=>x.key+'-companion'));expect(d.old).toBe(true);
 for(const c of roster){await page.locator('#panel button[data-go="'+c.key+'-companion"]').click();await expect(page.locator('#panel img[data-circle-artwork]')).toHaveAttribute('src',manifest.sceneAssets[c.key as keyof typeof manifest.sceneAssets].path);await page.locator('#panel button[data-go="croom"]').click()}
 await expect(page.locator('#council-return')).toHaveAttribute('href','/council-of-life?from=spatial-council#next-gathering');
});
