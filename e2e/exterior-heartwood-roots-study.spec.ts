import { test, expect } from '@playwright/test';
test.use({ serviceWorkers: 'block' });
const out = '/Users/ed/.codex/.chatgpt-projects/g-p-683c5647f32881918e942590972e90ee/output/exterior-heartwood-roots-study-20261010';
for (const width of [1440, 390, 320]) test(`Heartwood to Roots exterior ${width}`, async ({ page, context }) => {
  test.setTimeout(150000);
  const errors: string[] = [], blocked: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await context.routeWebSocket(/supabase|s33d\.life/, socket => socket.close());
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname) && (!['GET', 'HEAD'].includes(request.method()) || /\/rpc\/|\/functions\//.test(url.pathname))) {
      blocked.push(`${request.method()} ${url.pathname}`);
      return route.fulfill({ contentType: 'application/json', body: '[]' });
    }
    return route.continue();
  });
  await page.setViewportSize({ width, height:844 });
  await page.addInitScript(() => { localStorage.setItem('s33d-theme','light'); localStorage.setItem('entrance_seen_index','1'); });
  const align = async (selector: string) => {
    await page.locator(selector).evaluate(e => window.scrollTo({ top:e.getBoundingClientRect().top + scrollY - 85, behavior:'instant' }));
    await page.waitForTimeout(700);
  };
  const unmasked = async (selector: string) => {
    const item = page.locator(selector).first();
    await item.evaluate(e => e.scrollIntoView({block:"center",behavior:"instant"}));
    await expect(item).toBeVisible();
    const box = (await item.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(48);
    expect(await item.evaluate(e => {
      const r=e.getBoundingClientRect(), hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      return hit === e || e.contains(hit);
    })).toBe(true);
  };
  // Same width and anchor, exact unchanged starting reference, before evidence.
  await page.goto('http://127.0.0.1:4236/s33d#heartwood');
  await align('#heartwood'); await page.screenshot({path:`${out}/before-heartwood-${width}.png`});
  await page.locator('.roots-reveal').scrollIntoViewIfNeeded(); await page.locator('.roots-reveal').click();
  await page.locator('#roots-discovery figure').waitFor({timeout:20000});
  await align('.roots-life'); await page.screenshot({path:`${out}/before-roots-${width}.png`});
  await page.goto('/s33d#heartwood');
  await expect(page.getByRole('heading',{name:'The Tree remembers.'})).toBeVisible();
  await align('#heartwood'); await page.screenshot({path:`${out}/after-heartwood-${width}.png`});
  expect(await page.evaluate(() => document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  for (const href of ['/library/music-room','/library/scrolls','/library']) await unmasked(`#heartwood a[href="${href}"]`);
  await page.locator('#heartwood a[href="/library/music-room"]').click();
  await expect(page).toHaveURL(/\/library\/music-room$/); await page.reload();
  await expect(page.getByRole('heading',{name:'Music Room',exact:true})).toBeVisible();
  await page.goBack(); await expect(page).toHaveURL(/\/s33d#heartwood$/);
  await page.locator('#heartwood a[href="/library/scrolls"]').click();
  await expect(page).toHaveURL(/\/library\/scrolls$/); await page.reload();
  await expect(page.getByRole('heading',{name:'Scrolls & Records',exact:true})).toBeVisible();
  await page.getByRole('button',{name:/Sturgeon Moon/}).click();
  await expect(page.locator('[aria-disabled="true"]').first()).toBeVisible();
  await page.goBack(); await page.locator('#heartwood a[href="/library"]').click();
  await expect(page).toHaveURL(/\/library$/); await page.reload();
  await page.goBack(); await expect(page).toHaveURL(/\/s33d#heartwood$/);
  await page.locator('.roots-reveal').scrollIntoViewIfNeeded();
  let y=await page.evaluate(() => scrollY);
  await page.locator('.roots-reveal').click();
  const friend=page.locator('#roots-discovery figure a');
  await expect(friend).toBeVisible({timeout:20000});
  await expect(page.locator('#roots-discovery figure img')).toHaveJSProperty('complete',true);
  expect(await page.locator('#roots-discovery figure img').evaluate((e:HTMLImageElement)=>e.naturalWidth)).toBeGreaterThan(0);
  await align('.roots-life'); await page.screenshot({path:`${out}/after-roots-${width}.png`});
  await align('.roots-found-paths'); await page.screenshot({path:`${out}/after-discoveries-${width}.png`});
  for(const href of ['/atlas','/map','/hives']) {
    await unmasked(`#roots-discovery a[href="${href}"]`);
    const link=page.locator(`#roots-discovery a[href="${href}"]`).first();
    await link.click(); await expect(page).toHaveURL(new RegExp(href+'$')); await page.reload();
    if (href === '/map') {
      await expect(page.getByRole('main',{name:'Ancient Friends Atlas map'})).toBeVisible();
      if (width < 1440) {
        const begin=page.getByRole('button',{name:'Begin the Wander',exact:true});
        if(await begin.isVisible()) {
          await expect(page.getByRole('button',{name:'Dismiss trail'})).toHaveCount(0);
          await unmasked('button:has-text("Begin the Wander")');
        }
        const skip=page.getByRole('button',{name:'Skip introduction',exact:true});
        if(await skip.isVisible()) await skip.click();
        await expect(page.getByRole('navigation',{name:'Continue through the Tree'}).getByRole('link',{name:'Tree',exact:true})).toHaveAttribute('href','/s33d#atlas-content');
      }
    }
    else await expect(page.getByRole('heading',{name:href === '/atlas' ? 'World Atlas of Notable Trees' : 'Species Hives',exact:true})).toBeVisible();
    await page.goBack();
    await page.locator('.roots-reveal').scrollIntoViewIfNeeded(); y=await page.evaluate(()=>scrollY);
    await page.locator('.roots-reveal').click(); await expect(friend).toBeVisible({timeout:20000});
  }
  await friend.click(); await expect(page).toHaveURL(/\/tree\/[0-9a-f-]+$/); await page.reload();
  await expect(page.locator('[data-testid="tree-detail"]')).toBeVisible({timeout:20000}); await page.goBack();
  await page.locator('.roots-reveal').scrollIntoViewIfNeeded(); await page.locator('.roots-reveal').focus(); y=await page.evaluate(()=>scrollY);
  await page.locator('.roots-reveal').press('Enter'); await expect(friend).toBeVisible({timeout:20000});
  await page.locator('.roots-fold').click();
  await expect(page.locator('.roots-reveal')).toBeFocused();
  expect(Math.abs(await page.evaluate(()=>scrollY)-y)).toBeLessThan(3);
  await page.locator('.roots-reveal').press('Enter');
  await expect(page.locator('.roots-reveal')).toHaveAttribute('aria-expanded','true');
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await page.locator('.roots-life').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
  expect(await page.locator('.exterior-material').first().locator('.tree-spine-svg').evaluate(e=>getComputedStyle(e).transitionDuration)).toBe('0s');
  await align('#heartwood'); await page.screenshot({path:`${out}/reduced-heartwood-${width}.png`});
  await page.locator('header').first().getByRole('button',{name:/Night Grove|dark mode/i}).click();
  await align('#heartwood'); await page.screenshot({path:`${out}/night-heartwood-${width}.png`});
  await align('.roots-found-paths'); await page.screenshot({path:`${out}/night-roots-${width}.png`});
  await page.route(/fonts\.googleapis|fonts\.gstatic|\.woff2?(\?|$)/, route=>route.abort());
  await page.reload(); await align('#heartwood');
  await expect(page.getByRole('heading',{name:'The Tree remembers.'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({path:`${out}/font-failure-${width}.png`});
  expect(errors).toEqual([]);
  test.info().annotations.push({type:'blocked-external-writes',description:JSON.stringify(blocked)});
});
