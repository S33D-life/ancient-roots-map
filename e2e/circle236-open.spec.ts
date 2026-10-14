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
