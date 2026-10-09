import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "block" });
test.beforeEach(async ({ page }) => {
  await page.route("**/*", route => {
    const req = route.request(), url = new URL(req.url());
    const local = ["localhost", "127.0.0.1"].includes(url.hostname);
    if (!local && (!["GET", "HEAD"].includes(req.method()) || /\/rpc\/|\/functions\//.test(url.pathname))) {
      return route.fulfill({ contentType: "application/json", body: "[]" });
    }
    return route.continue();
  });
});
for (const width of [1440, 390]) {
  test(`Ancient Friend → Hall → Staff → Hall preserves origin at ${width}`, async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/tree/a1b2c3d4-1111-4aaa-bbbb-000000000001");
    await expect(page.getByRole("heading", { name: "Grandfather Oak", exact: true })).toBeVisible({ timeout: 20000 });
    await page.getByRole("link", { name: "Enter Heartwood Hall →", exact: true }).click();
    const origin = page.getByRole("link", { name: "Back to the Ancient Friend", exact: true });
    await expect(origin).toHaveAttribute("href", "/tree/a1b2c3d4-1111-4aaa-bbbb-000000000001");
    await page.getByRole("button", { name: "Staff Room", exact: true }).click();
    await expect(page.getByRole("tab", { name: "Explorer", exact: true })).toBeVisible({ timeout: 15000 });
    await page.getByRole("link", { name: "Hall", exact: true }).click();
    await expect(origin).toBeVisible();
    await page.reload();
    await expect(origin).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`tree-hall-${width}.png`) });
    await origin.click();
    await expect(page.getByRole("heading", { name: "Grandfather Oak", exact: true })).toBeVisible();
  });
}
