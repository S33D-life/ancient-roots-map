import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "block", reducedMotion: "reduce" });
for (const width of [1440, 390, 320]) {
  test(`Crown, Growth Folio and spatial inventory at ${width}`, async ({ page }) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", route => {
      const request = route.request(), url = new URL(request.url());
      if (url.hostname.endsWith("notion.site")) return route.fulfill({ contentType: "text/html", body: "<p>External notebook boundary — content not verified here.</p>" });
      if (!["localhost", "127.0.0.1"].includes(url.hostname) &&
          (!["GET", "HEAD"].includes(request.method()) || /\/rpc\/|\/functions\//.test(url.pathname))) {
        return route.fulfill({ contentType: "application/json", body: "[]" });
      }
      return route.continue();
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/golden-dream");
    const title = page.getByRole("heading", { name: "What is asking to grow?", exact: true });
    await expect(title).toBeVisible();
    await expect(page.getByText("Crown · yOur Golden Dream", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Popular Fruit|Current Version/ })).toHaveCount(0);
    const folio = page.getByRole("link", { name: /One Circle · Many Surfaces/ });
    expect((await folio.boundingBox())!.height).toBeGreaterThanOrEqual(48);
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode().catch(() => {}))); });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`after-crown-${width}.png`) });
    await page.screenshot({ path: test.info().outputPath(`after-crown-full-${width}.png`), fullPage: true });
    await folio.click();
    await expect(page.getByRole("heading", { name: "One Circle · Many Surfaces", exact: true })).toBeVisible();
    await expect(page.getByText("recorded evidence, not proof of deployment", { exact: true })).toBeVisible();
    await expect(page.getByText("Growing, fourth of six", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("link", { name: "↩ Return to the Crown", exact: true })).toHaveAttribute("href", "/golden-dream");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`folio-${width}.png`) });
    await page.getByRole("link", { name: "↩ Return to the Crown", exact: true }).click();
    await page.goBack();
    await expect(page.getByRole("heading", { name: "One Circle · Many Surfaces", exact: true })).toBeVisible();
    await page.goForward();
    await expect(title).toBeVisible();
    await page.getByRole("button", { name: /Dream notes/ }).click();
    await expect(page.locator('iframe[title="Dream notes"]')).toBeVisible();
    await page.getByRole("button", { name: "← Back to Golden Dream", exact: true }).click();
    await expect(title).toBeVisible();
    await page.getByRole("button", { name: "Use Night Grove", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(folio).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(`night-crown-${width}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await folio.click();
    await expect(page.locator(".lp-leaf")).toBeVisible();
    expect(await page.locator(".lp-leaf").evaluate(el => getComputedStyle(el).color)).not.toBe("rgb(255, 255, 255)");
    await page.screenshot({ path: test.info().outputPath(`night-folio-${width}.png`) });
    await page.getByRole("link", { name: "↩ Return to the Crown", exact: true }).click();
    await page.getByRole("button", { name: "Use Living Parchment", exact: true }).click();
    await page.reload();
    await expect(title).toBeVisible();
    await expect(page.getByRole("link", { name: /Descend to the Council of Life/ })).toHaveAttribute("href", "/council-of-life");
    expect(errors).toEqual([]);
    // Read-only spatial data/UI seam, matching the existing static Council tests.
    // Full GPU render and a new reciprocal doorway are separate gates.
    await page.route("**/runtime/entry.js", async route => {
      const response = await route.fetch();
      const source = await response.text();
      const boundary = source.indexOf("/* ---------- 3D rendering layer ---------- */");
      expect(boundary).toBeGreaterThan(0);
      await route.fulfill({ response, body: source.slice(0, boundary) });
    });
    await page.goto("/tetol/circle-235/pre-fire/tetol.html?welcome=0&from=crown#crown");
    await expect(page.locator("#panel")).toContainText("yOur Golden Dream");
    await expect(page).toHaveURL(/#crown$/);
    await expect(page.locator("#crown-return")).toHaveAttribute("href", "/golden-dream");
    await expect(page.locator("#council-return")).toHaveCount(0);
    await page.locator("#crown-return").click();
    await expect(title).toBeVisible();
    await page.goto("/tetol/circle-235/pre-fire/tetol.html?welcome=0&from=https://outside.invalid#crown");
    await expect(page.locator("#council-return")).toHaveAttribute("href", "/council-of-life?from=spatial-council#next-gathering");
    await expect(page.locator("#crown-return")).toHaveCount(0);
    await page.goto("/golden-dream/growth/one-circle-many-surfaces");
    await expect(page.getByRole("heading", { name: "One Circle · Many Surfaces", exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("link", { name: "↩ Return to the Crown", exact: true })).toHaveAttribute("href", "/golden-dream");
    expect(errors).toEqual([]);
  });
}
