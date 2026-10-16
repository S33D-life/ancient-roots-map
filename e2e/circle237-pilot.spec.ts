import { test, expect } from '@playwright/test';
import { PerspectiveCamera, Vector3 } from 'three';
const path='/review/circle237.html';
for(const width of [320,390,1440]) {
  test(`two identities, returns, missing art and no external reads at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:900});
    const external:string[]=[];
    page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4237/'))external.push(r.url());});
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
  const box=await canvas.boundingBox(); expect(box).not.toBeNull();
  await page.touchscreen.tap(box!.x+box!.width*.29,box!.y+box!.height*.5);
  await expect(page).toHaveURL(/companion=noku/);
  await page.getByRole('link',{name:'Open enduring Library identity'}).tap();
  await page.getByRole('link',{name:'Explore the experimental twin reference'}).tap();
  await expect(page.getByText('not surveyed field geometry',{exact:false})).toBeVisible();
  await page.getByRole('link',{name:'Return to Circle 237 · Noku / Nokuphila'}).tap();
  await expect(page.getByRole('button',{name:'Meet Noku / Nokuphila',exact:true})).toBeFocused();
  await expect(page.getByText('Spatial study ready',{exact:false})).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();
  const b=await canvas.boundingBox();
  await page.touchscreen.tap(b!.x+b!.width*.71,b!.y+b!.height*.5);
  await expect(page).toHaveURL(/companion=fly-agaric/);
  await page.getByRole('link',{name:'Open enduring Library identity'}).tap();
  await expect(page.getByText('taxonomy-index binding remains unresolved',{exact:false})).toBeVisible();
  await page.getByRole('link',{name:'Return to Circle 237 · Fly Agaric'}).tap();
  await canvas.scrollIntoViewIfNeeded();
  await page.screenshot({path:'test-results-circle237/spatial-390.png',fullPage:true});
  const frame=await canvas.boundingBox();
  const camera=new PerspectiveCamera(42,frame!.width/frame!.height,.1,40);
  camera.position.set(0,2.4,8); camera.lookAt(0,1,0); camera.updateMatrixWorld();
  // Target Noku frame's right wooden edge, away from the tree mesh.
  const edge=new Vector3(-.43,1.35,-.72).project(camera);
  await page.touchscreen.tap(frame!.x+(edge.x+1)*frame!.width/2,frame!.y+(1-edge.y)*frame!.height/2);
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
  for(const [key,x,name] of [['noku',-.43,'Noku / Nokuphila'],['fly-agaric',2.27,'Fly Agaric']] as const){
    await canvas.scrollIntoViewIfNeeded(); const b=(await canvas.boundingBox())!;
    const camera=new PerspectiveCamera(42,b.width/b.height,.1,40); camera.position.set(0,2.4,8); camera.lookAt(0,1,0);camera.updateMatrixWorld();
    const edge=new Vector3(x,1.35,-.72).project(camera);
    await page.mouse.click(b.x+(edge.x+1)*b.width/2,b.y+(1-edge.y)*b.height/2);
    await expect(page).toHaveURL(new RegExp(`companion=${key}`));
    await page.getByRole('link',{name:`Return to Circle 237 · ${name}`}).click();
    await expect(page.getByRole('button',{name:`Meet ${name}`,exact:true})).toBeFocused();
    await expect(page.getByText('Spatial study ready',{exact:false})).toBeVisible();
  }
 });
}
