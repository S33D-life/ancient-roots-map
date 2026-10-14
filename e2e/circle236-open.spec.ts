import { test, expect } from "@playwright/test";
for (const width of [320, 390, 1440]) test(`Circle 236 OPEN 2D and spatial at ${width}`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width, height: 900 });
  await page.route("**/*", route => {
    const u = new URL(route.request().url());
    return ["127.0.0.1", "localhost"].includes(u.hostname) ? route.continue() : route.fulfill({ contentType: "application/json", body: "[]" });
  });
  await page.goto("/council-of-life");
  await expect(page.getByRole("region", { name: "Circle 236", exact: true })).toContainText("OPEN");
  await expect(page.getByRole("region", { name: "Previous Circle 235" })).toContainText("What is already blooming in us");
  await page.getByRole("link", { name: "Circle 236 · Open · meet its companions →" }).click();
  await expect(page.getByText("Canopy · OPEN")).toBeVisible();
  await expect(page.locator(".circle-companion-frames figure")).toHaveCount(7);
  await expect(page.getByText("Fire reference · past date.", { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Canopy · OPEN")).toBeVisible();
  await page.getByRole("link", { name: "Enter the spatial Council", exact: true }).click();
  const room = page.frameLocator(".circle-spatial-room");
  await expect(room.locator("#brandline")).toContainText("Circle 236 · OPEN", { timeout: 60000 });
  await expect(room.locator("#panel")).toContainText("OPEN", { timeout: 60000 });
  await expect(room.locator("#panel")).toContainText("Fire reference");
});

test.describe("direct mobile spatial return", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test("return clears title and sheet gestures remain usable", async ({ page }) => {
    test.setTimeout(120000);
    await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.fulfill({ contentType: "application/json", body: "[]" }));
    await page.goto("/tetol/circle-235/pre-fire/tetol.html?circle=236#croom");
    const back = page.locator("#council-return");
    await expect(back).toBeVisible({ timeout: 60000 });
    const title = page.locator("#panel .pname");
    const r = await back.boundingBox(), t = await title.boundingBox();
    expect(r).not.toBeNull(); expect(t).not.toBeNull();
    expect(r!.y + r!.height <= t!.y || t!.y + t!.height <= r!.y).toBe(true);
    const grab = page.locator("#grab");
    await grab.hover(); // Wait for the arriving sheet to become stable before measuring.
    const initialGrab = await grab.boundingBox();
    await page.mouse.move(initialGrab!.x + initialGrab!.width / 2, initialGrab!.y + initialGrab!.height / 2);
    await page.mouse.down();
    await page.mouse.move(initialGrab!.x + initialGrab!.width / 2, initialGrab!.y - 150, { steps: 12 });
    await page.mouse.up();
    await expect(page.locator("body")).not.toHaveAttribute("data-sheet", "peek");
    // A browser pointer drag exercises the actual delegated sheet handlers.
    await grab.hover();
    const g = await grab.boundingBox();
    await page.mouse.move(g!.x + g!.width / 2, g!.y + g!.height / 2);
    await page.mouse.down(); await page.mouse.move(g!.x + g!.width / 2, g!.y + 200, { steps: 12 }); await page.mouse.up();
    await expect(page.locator("body")).toHaveAttribute("data-sheet", "peek");
    await expect(back).toBeVisible();
    await page.screenshot({ path: test.info().outputPath("phone-return.png") });
    await back.tap();
    await expect(page).toHaveURL(/\/review\/council\/236/);
  });
});
