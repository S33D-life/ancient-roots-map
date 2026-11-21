// Local built artifact only. No production DB requests.
import { chromium,webkit } from '@playwright/test';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:4351';
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true});const context=await browser.newContext({serviceWorkers:'block'});
 await context.route(/supabase\.(?:co|in)/,r=>r.abort());
 const page=await context.newPage();
 try{
  await page.goto(origin+'/council-of-life');await page.getByRole('heading',{name:'Circle 241',exact:true}).waitFor();
  for(const edition of [null,240,239,235]){
   await page.goto(origin+'/tetol/circle-235/pre-fire/tetol.html'+(edition?`?circle=${edition}`:'')+'#croom');
   const n=edition??241;
   await page.locator('#brandline').filter({hasText:`Circle ${n}`}).waitFor({timeout:30000});
   assert.match(await page.locator('#council-time-tree').innerText(),new RegExp(`Circle ${n}`));
  }
  console.log(`PASS ${engine.name()}: Council current 241; default original TETOL 241; explicit 240/239/235 preserved`);
 }finally{await context.close();await browser.close();}
}
