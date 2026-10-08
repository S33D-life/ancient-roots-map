import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "block" });
test.beforeEach(async ({ page }) => {
  // No live auth, telemetry, task writes or publishing: Agent Garden reads return an empty list.
  await page.route("**/*", route => {
    const url = new URL(route.request().url());
    if (["127.0.0.1", "localhost", "fonts.googleapis.com", "fonts.gstatic.com"].includes(url.hostname)) return route.continue();
    return route.fulfill({ contentType: "application/json", body: "[]" });
  });
  // Skip the one-time Crown entrance animation so the journey can be read directly.
  await page.addInitScript(() => {
    try { localStorage.setItem("entrance_seen_golden-dream", "1"); } catch { /* storage may be blocked */ }
  });
});

for (const [width, height] of [[1440, 900], [390, 844]] as const) {
  test(`Crown journey: enter, open the Folio, read, return at ${width}px`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height });
    await page.goto("/golden-dream");
    const crown = page.getByRole("region", { name: "What is asking to grow?" });
    await expect(crown).toBeVisible({ timeout: 15_000 });
    await expect(crown).toContainText("Reading here changes nothing and approves nothing.");
    await expect(crown).toContainText("Growing · touches 4 realms · a decision is waiting");
    await page.screenshot({ path: test.info().outputPath(`crown-${width}.png`), fullPage: true });

    await crown.getByRole("link", { name: /One Circle · Many Surfaces/ }).click();
    await expect(page).toHaveURL(/\/golden-dream\/growth\/one-circle-many-surfaces$/);
    const folio = page.locator("article");
    await expect(folio.getByRole("region", { name: "In short" })).toContainText("Growing, fourth of six");
    await expect(folio.getByRole("region", { name: "In short" })).toContainText("8 merged, 1 held");
    await folio.getByRole("button", { name: /How it is held/ }).click();
    await expect(folio).toContainText("The Agent Garden supports tending; it does not decide.");
    await expect(folio.getByRole("region", { name: "What needs deciding" }).getByRole("button")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const target of await folio.locator("button, a").all()) {
      const box = await target.boundingBox();
      if (box) expect(box.height, await target.innerText()).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: test.info().outputPath(`folio-${width}.png`), fullPage: true });

    await folio.getByRole("link", { name: "↩ Return to the Crown" }).click();
    await expect(page).toHaveURL(/\/golden-dream$/);
  });
}

test("unknown growth id reads as not in the Crown", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/golden-dream/growth/no-such-growth");
  await expect(page.getByText("This growth is not in the Crown.")).toBeVisible();
  await expect(page.getByRole("link", { name: "↩ Return to the Crown" })).toHaveAttribute("href", "/golden-dream");
});
