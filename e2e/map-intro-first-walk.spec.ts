import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "block" });
for (const width of [390, 320]) {
  test(`Map introduction CTA stays clear and First Walk returns at ${width}`, async ({ page }) => {
    await page.route("**/*", route => {
      const req = route.request(), url = new URL(req.url());
      if (!["localhost", "127.0.0.1"].includes(url.hostname) && !["GET", "HEAD"].includes(req.method())) return route.abort();
      return route.continue();
    });
    await page.setViewportSize({ width, height: 844 });
    await page.goto("http://127.0.0.1:4197/map");
    await expect(page.getByRole("button", { name: "Dismiss trail" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Begin the Wander", exact: true })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(`before-${width}.png`) });
    await page.goto("/map");
    const begin = page.getByRole("button", { name: "Begin the Wander", exact: true });
    await expect(begin).toBeVisible();
    await expect(page.getByRole("button", { name: "Dismiss trail" })).toHaveCount(0);
    const rect = await begin.boundingBox();
    expect(rect!.width).toBeGreaterThanOrEqual(48);
    expect(rect!.height).toBeGreaterThanOrEqual(48);
    expect(rect!.y).toBeGreaterThanOrEqual(0);
    expect(rect!.y + rect!.height).toBeLessThanOrEqual(844);
    expect(await begin.evaluate(el => { const r=el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)); })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`after-${width}.png`) });
    await begin.click();
    await expect(begin).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Dismiss trail" })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(`resumed-${width}.png`) });
    await page.reload();
    await expect(begin).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Dismiss trail" })).toBeVisible();
    const buttons = await page.locator('.parchment-bottom-nav a').evaluateAll(es => es.map(e => ({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})));
    expect(buttons.every(r => r.width >= 48 && r.height >= 48)).toBe(true);
  });
}
