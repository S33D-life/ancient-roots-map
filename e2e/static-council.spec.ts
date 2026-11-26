import { test, expect } from "@playwright/test";
import {readFileSync} from "node:fs";
import {installBoundedTreeRendering, drawTreeFrame} from './fixtures/bounded-tree-rendering';
const timeTree=JSON.parse(readFileSync("public/council/time-tree.json","utf8")) as {current:number;editions:{number:number;canopy:string}[]};
for (const width of [1280, 390]) test(`historical Circle 235 arrival and return at ${width}px`, async ({ page }) => {
  // This checks the static data/UI seam; full GPU rendering is a separate local smoke check.
  test.setTimeout(60_000);
  // Reproduce a fragment being cleared during destination startup.
  await page.addInitScript(() => {
    if (location.pathname === "/council-of-life") history.replaceState(null, "", location.pathname + location.search);
  });
  await page.setViewportSize({ width, height: 844 });
  await page.route("**/*", route => {
    const url = new URL(route.request().url());
    return ["127.0.0.1", "localhost"].includes(url.hostname) ? route.continue() : route.abort();
  });
  if (!process.env.STATIC_COUNCIL_FULL_RENDERER) {
    await page.route("**/runtime/entry.js*", async route => {
      const response = await route.fetch();
      const source = await response.text();
      const boundary = source.indexOf("/* ---------- 3D rendering layer ---------- */");
      expect(boundary).toBeGreaterThan(0);
      await route.fulfill({ response, body: source.slice(0, boundary) });
    });
  }
  await page.goto("/tetol/circle-235/pre-fire/tetol.html?circle=235&welcome=0#croom");
  const back = page.locator("#council-return");
  await expect(back).toHaveAttribute("href", "/council-of-life?from=spatial-council&circle=235#previous-circle-235");
  await expect(page.locator("#panel")).toContainText("What is already blooming in us");
  await expect(page).toHaveURL(/#croom$/);
  const join = await page.evaluate(() => (window as any).S33D_COUNCIL.circles[235].join_link.href);
  expect(join).toBeNull();
  await expect(back).toBeVisible();
  await back.click();
  await expect(page).toHaveURL(/council-of-life\?from=spatial-council/);
  await expect(page.locator("#previous-circle-235")).toBeInViewport();
});

test('default original TETOL entrance follows the published Circle',async({page})=>{
 await installBoundedTreeRendering(page);
 await page.route('**/*',r=>['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
 await page.goto('/tetol/circle-235/pre-fire/tetol.html?welcome=0#croom');
 await expect(page.locator('#brandline')).toContainText(`Circle ${timeTree.current}`);
 await expect(page.locator('#council-time-tree select')).toHaveValue(String(timeTree.current));
 const current=timeTree.editions.find(e=>e.number===timeTree.current)!;
 await expect(page.locator('#council-return')).toHaveAttribute('href',current.canopy);
 await drawTreeFrame(page);
});
