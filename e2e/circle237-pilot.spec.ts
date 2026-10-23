import { test, expect, type Page } from '@playwright/test';
import { PerspectiveCamera, Vector3 } from 'three';
import { roster } from '../src/review/circle237/registry';
const path='/review/circle237.html';
async function point(page:Page,index:number,edge=false){
 const canvas=page.locator('canvas'); await canvas.scrollIntoViewIfNeeded(); const b=(await canvas.boundingBox())!;
 const camera=new PerspectiveCamera(42,b.width/b.height,.1,80);
 camera.position.set(0,1.3,Math.max(9,5.2/Math.tan(21*Math.PI/180)/camera.aspect));camera.lookAt(0,1.3,0);camera.updateMatrixWorld();
 const v=new Vector3((index%5-2)*2+(edge?.86:0),(index<5?2.6:0)+(edge?0:index===0?.46:.25),edge?-.72:0).project(camera);
 return {x:b.x+(v.x+1)*b.width/2,y:b.y+(1-v.y)*b.height/2};
}
for(const width of [320,390,1440]) {
  test(`two identities, returns, missing art and no external reads at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:900});
    const external:string[]=[];
    page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4238/'))external.push(r.url());});
    await page.goto(path);
    await expect(page.getByRole('heading',{name:'Companions, connected'})).toBeVisible();
    await expect(page.getByText('Portrait pending intake',{exact:true})).toHaveCount(10);
    for(const [name,id] of [['Noku / Nokuphila','59eb1fe8-3c29-4696-ae00-f42edeb1c886'],['Fly Agaric','22a15b58-480d-8027-bf5f-ce0841334f10']]) {
      await page.getByRole('button',{name:`Meet ${name}`,exact:true}).click();
      await page.getByRole('link',{name:'Open enduring Library identity'}).click();
      await expect(page.getByText(id,{exact:false}).first()).toBeVisible();
      await page.reload();
      await expect(page.getByText(id,{exact:false}).first()).toBeVisible();
      await page.getByRole('link',{name:'Future Heartwood harvest pathway'}).click();
      await expect(page.getByText('Nothing is saved or published.',{exact:false})).toBeVisible();
      await page.getByRole('link',{name:`Return to Circle 237 · ${name}`}).click();
      await expect(page.getByRole('button',{name:`Meet ${name}`,exact:true})).toBeFocused();
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    expect(external).toEqual([]);
    await page.screenshot({path:`test-results-circle237/council-${width}.png`,fullPage:true});
  });
}
test('spatial presence and frame share identity with touch and refresh-safe return',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const page=await context.newPage(); const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto(path+'?mode=spatial');
  await expect(page.getByText('Spatial study ready',{exact:false})).toBeVisible();
  const canvas=page.locator('canvas');
  // Actual touchscreen events against geometry, not a DOM-dispatched click.
  const noku=await point(page,0);await page.touchscreen.tap(noku.x,noku.y);
  await expect(page).toHaveURL(/companion=noku/);
  await page.getByRole('link',{name:'Open enduring Library identity'}).tap();
  await page.getByRole('link',{name:'Explore the experimental twin reference'}).tap();
  await expect(page.getByText('not surveyed field geometry',{exact:false})).toBeVisible();
  await page.getByRole('link',{name:'Return to Circle 237 · Noku / Nokuphila'}).tap();
  await expect(page.getByRole('button',{name:'Meet Noku / Nokuphila',exact:true})).toBeFocused();
  await expect(page.getByText('Spatial study ready',{exact:false})).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();
  const fly=await point(page,7);await page.touchscreen.tap(fly.x,fly.y);
  await expect(page).toHaveURL(/companion=fly-agaric/);
  await page.getByRole('link',{name:'Open enduring Library identity'}).tap();
  await expect(page.getByText('taxonomy-index binding remains unresolved',{exact:false})).toBeVisible();
  await page.getByRole('link',{name:'Return to Circle 237 · Fly Agaric'}).tap();
  await canvas.scrollIntoViewIfNeeded();
  await page.screenshot({path:'test-results-circle237/spatial-390.png',fullPage:true});
  const frame=await point(page,0,true);await page.touchscreen.tap(frame.x,frame.y);
  await expect(page).toHaveURL(/companion=noku/);
  await page.getByRole('link',{name:'Return to Circle 237 · Noku / Nokuphila'}).tap();
  expect(errors).toEqual([]);
  await context.close();
});
test('malformed private identity fails closed and loaded public projection works offline',async({page,context})=>{
  await page.goto(path+'?view=record&companion=private-family-id&return=https://example.com');
  await expect(page.getByRole('heading',{name:'Companions, connected'})).toBeVisible();
  await context.setOffline(true);
  await page.getByRole('button',{name:'Meet Fly Agaric',exact:true}).click();
  await page.getByRole('link',{name:'Open enduring Library identity'}).click();
  await expect(page.getByText('Offline ·',{exact:false})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Fly Agaric · continuing Library thread'})).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading',{name:'Fly Agaric · Council appearance'})).toBeVisible();
});
for(const width of [320,1440]) {
 test(`spatial frame navigation at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900}); await page.goto(path+'?mode=spatial');
  await expect(page.getByText('Spatial study ready',{exact:false})).toBeVisible();
  const canvas=page.locator('canvas'); await canvas.scrollIntoViewIfNeeded();
  await page.screenshot({path:`test-results-circle237/spatial-${width}.png`,fullPage:true});
  for(const [key,name] of [['noku','Noku / Nokuphila'],['fly-agaric','Fly Agaric']] as const){
    const edge=await point(page,key==='noku'?0:7,true);await page.mouse.click(edge.x,edge.y);
    await expect(page).toHaveURL(new RegExp(`companion=${key}`));
    await page.getByRole('link',{name:`Return to Circle 237 · ${name}`}).click();
    await expect(page.getByRole('button',{name:`Meet ${name}`,exact:true})).toBeFocused();
    await expect(page.getByText('Spatial study ready',{exact:false})).toBeVisible();
  }
 });
}
for(const width of [320,390,1440]){
 test(`ten companion encounters and invitation review at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.goto(path);
  for(const mode of ['2d','spatial'] as const){
   await page.getByRole('link',{name:mode==='2d'?'2D Council':'3D TETOL study',exact:true}).click();
   for(const c of roster){
    await page.getByRole('button',{name:`Meet ${c.name}`,exact:true}).click();
    await expect(page.getByRole('heading',{name:`${c.name} · Council appearance`,exact:true})).toBeVisible();
    await page.reload();
    await page.getByRole('link',{name:`Return to Circle 237 · ${c.name}`,exact:true}).click();
    await expect(page.getByRole('button',{name:`Meet ${c.name}`,exact:true})).toBeFocused();
   }
   await page.getByRole('link',{name:'Read the draft invitation'}).click();
   await expect(page.getByText('Draft for Ed’s approval · not ready to send')).toBeVisible();
   await expect(page.getByText('Friday 23 October 2026',{exact:false})).toBeVisible();
   await expect(page.getByRole('link',{name:'Council community · Telegram'})).toHaveAttribute('href','https://t.me/s33dlife');
   await expect(page.locator('time')).toHaveAttribute('datetime','2026-10-23T15:30:00+01:00');
   await expect(page.getByRole('link',{name:/join|fire/i})).toHaveCount(0);
   await page.screenshot({path:`test-results-circle237/invitation-${mode}-${width}.png`,fullPage:true});
   await page.getByRole('link',{name:'Return to Circle 237',exact:true}).click();
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 });
}
test('all ten spatial frames are real touch doorways at 390px',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const page=await context.newPage();await page.goto(path+'?mode=spatial');
 for(const [index,c] of roster.entries()){
  await expect(page.getByText('Spatial study ready',{exact:false})).toBeVisible();
  const p=await point(page,index,true);await page.touchscreen.tap(p.x,p.y);
  await expect(page.getByRole('heading',{name:`${c.name} · Council appearance`,exact:true})).toBeVisible();
  await page.getByRole('link',{name:`Return to Circle 237 · ${c.name}`,exact:true}).tap();
  await expect(page.getByRole('button',{name:`Meet ${c.name}`,exact:true})).toBeFocused();
 }
 await context.close();
});
test('offline spatial chunk failure keeps all named doorways usable',async({page,context})=>{
 await page.goto(path);await context.setOffline(true);
 await page.getByRole('link',{name:'3D TETOL study',exact:true}).click();
 await expect(page.getByRole('button',{name:/^Meet /})).toHaveCount(10);
 await page.getByRole('button',{name:'Meet Broad Bean',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Broad Bean · Council appearance'})).toBeVisible();
});
