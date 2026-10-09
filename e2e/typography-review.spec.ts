import { test, expect } from "@playwright/test";
test.use({serviceWorkers:'block'});
for(const width of [1440,390,320])test(`editorial type and review-only ink at ${width}`,async({page})=>{
 test.setTimeout(120000);
 const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
 await page.route('**/*',route=>{const r=route.request(),u=new URL(r.url());if(!['localhost','127.0.0.1'].includes(u.hostname)&&(!['GET','HEAD'].includes(r.method())||/\/rpc\/|\/functions\//.test(u.pathname)))return route.abort();return route.continue();});
 await page.setViewportSize({width,height:900});
 for(const route of ['/','/s33d','/map','/tree/a1b2c3d4-1111-4aaa-bbbb-000000000001','/library','/library/staff-room','/library/life/betula-pendula','/council-of-life','/golden-dream','/about','/support','/press']){
  await page.goto(route);const heading=page.locator('h1').first();await expect(heading).toBeVisible();await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect.poll(()=>page.evaluate(()=>[...document.fonts].some(face=>face.family.includes("Cormorant Garamond")&&face.status==="loaded"&&face.unicodeRange==="U+0-10FFFF"))).toBe(true);
  await expect(page.locator('html')).not.toHaveAttribute('data-ink-review');
  const first=(await heading.boundingBox())!;await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  const settled=(await heading.boundingBox())!;expect(Math.abs(first.height-settled.height)).toBeLessThan(1);
  if(['/','/support','/library'].includes(route))await page.screenshot({path:test.info().outputPath(`after-${route==='/'?'home':route.slice(1)}-${width}.png`)});
 }
 await page.goto('/?ink=racing');await expect(page.locator('html')).toHaveAttribute('data-ink-review','racing');
 expect(await page.locator('.tetol-initial').allTextContents()).toEqual(['T','E','T','O','L']);
 await expect(page.locator('.tetol-initial').first()).toHaveCSS('color','rgb(97, 65, 111)');
 await page.screenshot({path:test.info().outputPath(`ink-home-${width}.png`)});
 await page.getByRole('button',{name:'Use Night Grove',exact:true}).click();
 const initial=await page.locator('.tetol-initial').first().evaluate(e=>getComputedStyle(e).color);
 expect(initial).not.toBe('rgb(97, 65, 111)');
 await page.getByRole('button',{name:'Use Living Parchment',exact:true}).click();
 await page.goto('/library?ink=racing');await expect(page.locator('.teotag-signature')).toHaveCSS('color','rgb(97, 65, 111)');
 expect(await page.locator('.teotag-margin p').evaluate(e=>getComputedStyle(e).color)).not.toBe('rgb(97, 65, 111)');
 await page.screenshot({path:test.info().outputPath(`ink-library-${width}.png`)});
 expect(errors).toEqual([]);
 await page.goto('http://127.0.0.1:4202/ink-specimen.html');await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:test.info().outputPath(`ink-specimen-${width}.png`),fullPage:true});
});
