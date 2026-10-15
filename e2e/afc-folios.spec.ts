import { test, expect } from '@playwright/test';
for (const width of [320,390,1440]) for (const [key,circle,name] of [['ely',236,'Ely Plane'],['noku',237,'Noku']] as const) {
 test(`${key} folio exact return at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.route('**/*',r=>['localhost','127.0.0.1'].includes(new URL(r.request().url()).hostname)?r.continue():r.fulfill({contentType:'application/json',body:'[]'}));
  await page.goto(`/review/afc/council/${circle}`);
  await page.getByRole('link',{name:`Open ${name}’s living folio →`}).click();
  await expect(page.getByRole('heading',{name:key==='ely'?'The Great London Plane of Ely':'Nokuphila · the Ubuntu Tree',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.reload();
  await expect(page.getByRole('link',{name:`← Return to ${name} in Circle ${circle}`}).first()).toBeVisible();
  if(key==='ely') await expect(page.getByRole('link',{name:'Watch this tree live ↗'})).toHaveAttribute('href','https://treecouncil.org.uk/science-and-research/the-london-plane-of-ely/');
  else await expect(page.getByRole('link',{name:/Watch this tree live/})).toHaveCount(0);
  await page.screenshot({path:test.info().outputPath(`${key}-${width}.png`),fullPage:true});
  await page.getByRole('link',{name:`← Return to ${name} in Circle ${circle}`}).first().click();
  await expect(page.locator(`#${key==='ely'?'ely-plane':'noku'}-companion`)).toBeFocused();
  await page.goBack();await expect(page).toHaveURL(new RegExp(`/review/ancient-friends/${key}`));
 });
}
test.describe('spatial folio frames via touch',()=>{
 test.use({viewport:{width:390,height:844},hasTouch:true});
 for(const [key,circle,name,id] of [['ely',236,'Ely Plane','ely-plane-companion'],['noku',237,'Noku','noku-companion']] as const) test(`${key}: room sheet tap to folio and exact spatial return`,async({page})=>{
  test.setTimeout(120000);
  await page.route('**/*',r=>['localhost','127.0.0.1'].includes(new URL(r.request().url()).hostname)?r.continue():r.fulfill({contentType:'application/json',body:'[]'}));
  await page.goto(`/review/afc/council/${circle}?mode=spatial`);
  await page.getByRole('link',{name:'Open spatial Council full screen →'}).tap();
  const room=page;
  await expect(room.locator('#panel .pname')).toContainText(`Circle ${circle}`,{timeout:60000});
  await expect(room.locator('body')).not.toHaveClass(/g-arriving|moving/,{timeout:60000});
  await room.locator('#grab').tap();
  await expect(room.locator('#panel .pname')).toContainText(`Circle ${circle}`);
  await room.locator(`#panel [data-go="${id}"]`).tap();
  await expect(room.locator('#panel .pname')).toContainText(key==='ely'?'The Great London Plane of Ely':'Nokuphila');
  await room.locator('#grab').tap();
  const link=room.locator('[data-afc-open]');await link.tap();
  await expect(page).toHaveURL(new RegExp(`/review/ancient-friends/${key}`));
  await page.getByRole('link',{name:`← Return to ${name} in Circle ${circle}`}).first().tap();
  await expect(page).toHaveURL(new RegExp(`mode=spatial&returned=1&companion=${id}`));
  await expect(page.frameLocator('iframe.afc-spatial').locator('#panel .pname')).toContainText(key==='ely'?'The Great London Plane of Ely':'Nokuphila',{timeout:60000});
  await page.screenshot({path:test.info().outputPath(`${key}-spatial-390.png`),fullPage:true});
 });
});
for(const [key,circle,name,id] of [['ely',236,'Ely Plane','ely-plane-companion'],['noku',237,'Noku','noku-companion']] as const) test(`${key}: desktop spatial folio doorway and return`,async({page})=>{
 test.setTimeout(120000);await page.setViewportSize({width:1440,height:900});
 await page.route('**/*',r=>['localhost','127.0.0.1'].includes(new URL(r.request().url()).hostname)?r.continue():r.fulfill({contentType:'application/json',body:'[]'}));
 await page.goto(`/tetol/circle-235/pre-fire/tetol.html?circle=236&afcPreview=${circle}#${id}`);
 await expect(page.locator('#panel .pname')).toContainText(key==='ely'?'The Great London Plane of Ely':'Nokuphila',{timeout:60000});
 await page.locator('#panel [data-afc-open]').click();
 await expect(page).toHaveURL(new RegExp(`/review/ancient-friends/${key}`));
 await page.getByRole('link',{name:`← Return to ${name} in Circle ${circle}`}).first().click();
 await expect(page).toHaveURL(new RegExp(`mode=spatial&returned=1&companion=${id}`));
 await expect(page.frameLocator('iframe.afc-spatial').locator('#panel .pname')).toContainText(key==='ely'?'The Great London Plane of Ely':'Nokuphila',{timeout:60000});
 await page.screenshot({path:test.info().outputPath(`${key}-spatial-1440.png`),fullPage:true});
});
