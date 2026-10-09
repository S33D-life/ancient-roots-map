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

test("at 390px the growth row stays clear of the fixed TEOTAG orb (geometric)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/golden-dream");
  const crown = page.getByRole("region", { name: "What is asking to grow?" });
  await expect(crown).toBeVisible({ timeout: 15_000 });
  const orb = page.getByRole("button", { name: /TEOTAG's guiding orb/ });
  await expect(orb).toBeVisible();
  const row = crown.getByRole("link", { name: /One Circle · Many Surfaces/ });
  const parts = row.locator(".lp-row-title, .lp-row-sub, .lp-row-line, .lp-row-open");
  await expect(parts).toHaveCount(4);

  // Scroll so each text line sits in the orb's horizontal band, then require that the two boxes do not intersect.
  for (const part of await parts.all()) {
    const o0 = (await orb.boundingBox())!;
    const p0 = (await part.boundingBox())!;
    const alignment = await page.evaluate(dy => {
      const target = window.scrollY + dy;
      const maximum = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: Math.max(0, Math.min(target, maximum)), behavior: "instant" });
      return target >= 0 && target <= maximum;
    }, (p0.y + p0.height / 2) - (o0.y + o0.height / 2));
    const o = (await orb.boundingBox())!;
    const p = (await part.boundingBox())!;
    const verticalOverlap = p.y < o.y + o.height && o.y < p.y + p.height;
    // A line above the orb at the page's top cannot be moved downward by scrolling.
    // Check its actual non-intersection instead of assuming negative scroll is possible.
    if (alignment) expect(verticalOverlap, "the line was brought level with the orb").toBe(true);
    const intersects = p.x < o.x + o.width && o.x < p.x + p.width && verticalOverlap;
    expect(intersects, `${await part.innerText()} [${p.x},${p.y},${p.width}x${p.height}] vs orb [${o.x},${o.y},${o.width}x${o.height}]`).toBe(false);
  }
});
