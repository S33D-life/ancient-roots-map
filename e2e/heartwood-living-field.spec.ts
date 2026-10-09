import { test, expect } from '@playwright/test';
const evidence='/Users/ed/.codex/.chatgpt-projects/g-p-683c5647f32881918e942590972e90ee/output/heartwood-reconciliation-20261009';
for(const width of [1440,390,320]) test(`Heartwood Living Field and passages ${width}`,async({page})=>{
  test.setTimeout(120000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:844});await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('**/*',route=>{const r=route.request(),u=new URL(r.url());if(!['localhost','127.0.0.1'].includes(u.hostname)&&(!['GET','HEAD'].includes(r.method())||/\/rpc\/|\/functions\//.test(u.pathname)))return route.fulfill({contentType:'application/json',body:'[]'});return route.continue();});
  if (!process.env.HEARTWOOD_FULL_RENDERER) await page.route('**/runtime/entry.js',async route=>{const response=await route.fetch(),source=await response.text(),boundary=source.indexOf('/* ---------- 3D rendering layer ---------- */');expect(boundary).toBeGreaterThan(0);await route.fulfill({response,body:source.slice(0,boundary)});});
  const arrival=page.getByRole('heading',{name:'What is the Tree remembering now?',exact:true});
  await page.goto('/library');await expect(arrival).toBeVisible();
  const consult=page.getByRole('button',{name:'Consult Heartwood →',exact:true});
  expect((await consult.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  expect((await consult.boundingBox())!.y).toBeLessThan(650);
  await expect(page.locator('iframe')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:`${evidence}/after-${width}.png`,fullPage:true});
  await page.screenshot({path:`${evidence}/arrival-${width}.png`});
  await consult.focus();await page.keyboard.press('Enter');
  const input=page.getByPlaceholder(/Search/i);await expect(input).toBeVisible();await expect(input).toBeFocused();
  await input.fill('music');await expect(page.getByText(/Music Room/).first()).toBeVisible();await page.keyboard.press('Escape');await expect(consult).toBeFocused();
  for(const [href,heading]of[['/library/music-room','Music Room'],['/library/scrolls','Scrolls & Records'],['/library/arborium','The Arborium'],['/library/bookshelf','Bookshelf'],['/library/quest-cave','Quest Cave'],['/library/staff-room','Staff Room']]){
    await page.locator(`main a[href="${href}"]`).first().click();await expect(page.getByRole('heading',{name:heading,exact:true}).first()).toBeVisible();await page.reload();await expect(page.getByRole('heading',{name:heading,exact:true}).first()).toBeVisible();await page.getByRole('link',{name:'Return to Heartwood Hall →',exact:true}).click();await expect(arrival).toBeVisible();
  }
  const quiet=page.locator('details').filter({has:page.locator('summary',{hasText:'Quieter chambers'})});await quiet.locator('summary').click();await expect(quiet.getByRole('button',{name:/Greenhouse/})).toBeVisible();await quiet.getByRole('button',{name:/Greenhouse/}).click();await expect(page.getByRole('heading',{name:'Greenhouse',exact:true}).first()).toBeVisible();await page.goBack();await expect(arrival).toBeVisible();
  const deep=page.locator('details').filter({has:page.locator('summary',{hasText:'Deeper rings'})});await deep.locator('summary').click();await page.screenshot({path:`${evidence}/deeper-${width}.png`,fullPage:true});await deep.locator('a[href="/tree-data-commons"]').click();await expect(page.getByRole('heading',{name:'Tree Data Commons',exact:true})).toBeVisible();await page.goBack();await expect(arrival).toBeVisible();
  await page.getByRole('link',{name:'Silver Birch · a recorded Library identity →',exact:true}).click();await expect(page.getByRole('heading',{name:'Silver Birch',exact:true})).toBeVisible();await page.reload();await page.getByRole('link',{name:'↩ Return to the Library',exact:true}).click();await expect(arrival).toBeVisible();
  await page.getByRole('link',{name:'Follow this Circle →',exact:true}).click();await expect(page.getByRole('heading',{name:'What is already blooming in us that we haven’t noticed yet?',exact:true})).toBeVisible();await page.goBack();await expect(arrival).toBeVisible();await page.goForward();await expect(page.getByRole('heading',{name:'What is already blooming in us that we haven’t noticed yet?',exact:true})).toBeVisible();await page.goBack();await expect(arrival).toBeVisible();
  await page.getByRole('button',{name:'Use Night Grove',exact:true}).click();await expect(page.locator('html')).toHaveClass(/dark/);await expect(arrival).toBeVisible();await page.screenshot({path:`${evidence}/after-night-${width}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const spatial=page.getByRole('button',{name:'Wander into spatial Heartwood →',exact:true});await spatial.click();const frame=page.frameLocator('iframe[title="TETOL spatial Heartwood"]');await expect(frame.locator('#panel')).toContainText('Heartwood',{timeout:process.env.HEARTWOOD_FULL_RENDERER?30000:8000});await expect(frame.locator('#council-return')).toHaveText('Return to Heartwood');await expect(frame.locator('#council-return')).toHaveAttribute('href','/library');await page.screenshot({path:`${evidence}/spatial-${process.env.HEARTWOOD_FULL_RENDERER?'full':'ui'}-${width}.png`});await frame.locator('#council-return').click({timeout:10000});await expect(page.locator('iframe')).toHaveCount(0);await expect(spatial).toBeFocused();await page.reload();await expect(arrival).toBeVisible();
  expect(errors).toEqual([]);
});
test('Holm Oak exact query has mapped trees without HTTP 400',async({page})=>{
  test.setTimeout(60000);const errors:string[]=[];page.on('response',r=>{if(r.url().includes('/rest/v1/trees')&&r.status()>=400)errors.push(String(r.status()));});await page.goto('/species/quercus-ilex');await expect(page.getByRole('heading',{name:'Holm Oak',exact:true})).toBeVisible();await expect(page.getByText('3 mapped trees',{exact:true})).toBeVisible();expect(errors).toEqual([]);
});

test('quiet chambers, deeper rings and Roots remain reachable',async({page})=>{
  test.setTimeout(90000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1440,height:844});await page.emulateMedia({reducedMotion:'reduce'});
  const arrival=page.getByRole('heading',{name:'What is the Tree remembering now?',exact:true});
  for(const [label,path]of[['Wishing Tree','/library/wishlist'],['Star Trail','/library/star-trail']]){
    await page.goto('/library');await expect(arrival).toBeVisible();await page.getByText('Quieter chambers',{exact:true}).click();await page.getByRole('button',{name:new RegExp(label)}).click();await expect(page).toHaveURL(new RegExp(path+'$'));await expect(page.getByRole('heading',{name:label,exact:true}).first()).toBeVisible();await page.goBack();await expect(arrival).toBeVisible();
  }
  for(const [section,path]of[['Quieter chambers','/library/gallery'],['Quieter chambers','/heartwood/life-groves'],['Quieter chambers','/press'],['Quieter chambers','/harvest'],['Deeper rings','/library/seed-cellar'],['Deeper rings','/living-archive'],['Deeper rings','/council/records']]){
    await page.goto('/library');await expect(arrival).toBeVisible();await page.getByText(section,{exact:true}).click();await page.locator(`main a[href="${path}"]`).click();await expect(page).toHaveURL(new RegExp(path+'$'));await expect(page.locator('main').first()).toBeVisible();await page.goBack();await expect(arrival).toBeVisible();
  }
  await page.getByRole('link',{name:/Ancient Friends · Roots/}).click();await expect(page).toHaveURL(/\/map$/);await page.goBack();await expect(arrival).toBeVisible();await page.getByRole('link',{name:/My Hearth/}).click();await expect(page).toHaveURL(/\/auth/);await page.goBack();await expect(page).toHaveURL(/\/auth/);/* Existing Dashboard redirect pushes auth again: isolated held defect. */ await page.evaluate(()=>history.go(-2));await expect(arrival).toBeVisible();expect(errors).toEqual([]);
});
