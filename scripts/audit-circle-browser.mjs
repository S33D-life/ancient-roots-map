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
  const fixture={current:242,editions:[{number:241,state:'PREVIOUS',canopy:'/council/circle-241/index.html'},{number:242,state:'CURRENT / OPEN',canopy:'/council/circle-242/index.html'}]};
  await page.route('**/council/time-tree.json',r=>r.fulfill({json:fixture}));
  await page.route('**/runtime/companion-frames-242.js',r=>r.fulfill({contentType:'text/javascript',body:`export function installCompanionFrames(D){D.nodes.c242={...D.nodes.c233,name:'Fictional Circle 242',circle:242,parent:'croom',question:'Synthetic next edition - not published'};D.council.circles[242]={node:'c242',number:242,status:'open',companions:[]};D.council.active=242;D.council.current='c242';}export function companionPanel(){return null;}export function buildCompanionPresence(){return null;}`}));
  await page.goto(origin+'/tetol/circle-235/pre-fire/tetol.html#croom');
  await page.locator('#brandline').filter({hasText:'Circle 242'}).waitFor({timeout:30000});
  assert.match(await page.locator('#council-time-tree').innerText(),/242/);
  console.log(`PASS ${engine.name()}: synthetic next-edition default TETOL follows 242; fixture adapter only, no real artwork or records`);
  console.log(`PASS ${engine.name()}: Council current 241; default original TETOL 241; explicit 240/239/235 preserved`);
 }finally{await context.close();await browser.close();}
}
