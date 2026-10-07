import { test, expect } from "@playwright/test";
for (const width of [1280, 390]) test(`static Council Deck arrival and return at ${width}px`, async ({ page }) => {
  // Static bundle unpacking plus the return SPA load exceeded the generic 30s budget in CI.
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
  await page.goto("/tetol/circle-235/pre-fire/tetol.html?welcome=0#croom");
  const back = page.locator("#council-return");
  await expect(back).toHaveAttribute("href", "/council-of-life?from=spatial-council#next-gathering");
  await expect(page.locator("#panel")).toContainText("What is already blooming in us");
  await expect(page).toHaveURL(/#croom$/);
  const join = await page.evaluate(() => (window as any).S33D_COUNCIL.circles[235].join_link.href);
  expect(join).toBeNull();
  await expect(back).toBeVisible();
  await back.click();
  await expect(page).toHaveURL(/council-of-life\?from=spatial-council/);
  await expect(page.locator("#next-gathering")).toBeInViewport();
});
