import { test, expect } from "@playwright/test";
test.use({ serviceWorkers: "block" });
for(const width of [390,320]) test(`gold add action and movable guide at ${width}`, async({page})=>{
  await page.route("**/*",route=>{
    const req=route.request(),url=new URL(req.url());
    if(!["localhost","127.0.0.1"].includes(url.hostname)&&(!["GET","HEAD"].includes(req.method())||/\/rpc\/|\/functions\//.test(url.pathname)))return route.abort();
    return route.continue();
  });
  await page.setViewportSize({width,height:844});await page.goto('/golden-dream');
  const nav=page.getByRole('navigation',{name:'Continue through the Tree',exact:true});
  await expect(nav).toBeVisible();
  const controls=await nav.locator('a,button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {name:e.getAttribute('aria-label'),x:r.x,right:r.right,width:r.width,height:r.height};}));
  expect(controls.map(c=>c.name)).toEqual(['Roots','Seed','Heartwood','Canopy','Crown','Add a tree or encounter']);
  expect(controls.every(c=>c.width>=48&&c.height>=48&&c.x>=0&&c.right<=width)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const orb=page.getByRole('button',{name:"TEOTAG's guiding orb — explore, contribute, and discover",exact:true});
  await expect(orb).toBeVisible();const start=(await orb.boundingBox())!;
  const portrait=(await page.getByRole('link',{name:'TEOTAG — Go to your Hearth'}).boundingBox())!;
  expect(start.y).toBeGreaterThan(portrait.y+portrait.height);expect(start.height).toBe(48);
  await page.screenshot({path:test.info().outputPath(`add-gold-${width}.png`)});
  await page.mouse.move(start.x+24,start.y+24);await page.mouse.down();await page.mouse.move(30,start.y+150,{steps:12});await page.mouse.up();
  await expect.poll(async()=> (await orb.boundingBox())!.x).toBeLessThan(40);
  await page.reload();await expect(orb).toBeVisible();await expect.poll(async()=> (await orb.boundingBox())!.x).toBeLessThan(40);
  await nav.getByRole('button',{name:'Add a tree or encounter'}).click();
  await expect(page.getByRole('heading',{name:'You have arrived.',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:/This tree is not here yet|Place this tree on the Atlas/})).toBeVisible();
  await page.screenshot({path:test.info().outputPath(`chooser-${width}.png`)});
});
