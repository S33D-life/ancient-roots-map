import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "block" });
test.beforeEach(async ({ page }) => {
  // No live auth, telemetry, task writes, or publishing during release smoke.
  await page.route("**/*", route => {
    const url = new URL(route.request().url());
    if (["127.0.0.1", "localhost"].includes(url.hostname)) return route.continue();
    return route.fulfill({ contentType: "application/json", body: "[]" });
  });
});
for (const width of [1280, 390]) {
  test(`login and empty callback fail safely at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/auth");
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Update app", exact: true })).toBeVisible();
    await page.goto("/auth/callback?returnTo=%2Fcouncil-of-life");
    await expect(page.getByRole("heading", { name: "Completing sign-in" })).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("Sign-in could not be confirmed");
    await expect(page.getByRole("link", { name: "Try sign-in again" })).toHaveAttribute("href", "/auth");
    await expect(page).toHaveURL(/\/auth\/callback/);
  });
  test(`Council, Golden Dream and read-only Folio at ${width}px`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/council-of-life?from=spatial-council#next-gathering");
    await expect(page.getByRole("region", { name: "Current Circle" })).toContainText("Circle 237");
    await page.getByRole("link", { name: "Revisit Circle 236 · meet its companions →" }).click();
    await expect(page).toHaveURL(/\/review\/council\/236$/);
    await expect(page.getByRole("heading", { name: "Circle 236" })).toBeVisible();
    await expect(page.getByText("Canopy · OPEN")).toBeVisible();
    const fire = page.getByRole("region", { name: "Circle 236 Council Fire" });
    await expect(fire.getByText("Tuesday 13 October · 19:30 UK")).toBeVisible();
    await expect(fire.getByRole("link", { name: "Gather at the Fire · Council group →" })).toBeVisible();
    await page.getByRole("link", { name: "Return to Council" }).click();
    await expect(page).toHaveURL(/\/council-of-life$/);
    await page.goto("/golden-dream");
    await expect(page.getByRole("link", { name: "Growth folio · One Circle · Many Surfaces" })).toBeVisible();
    await page.goto("/golden-dream/growth/one-circle-many-surfaces");
    const folio = page.locator("article");
    await expect(folio.getByRole("heading", { name: "One Circle · Many Surfaces" })).toBeVisible();
    await expect(folio.getByRole("list", { name: "Public maturity: Growing" })).toBeVisible();
    await expect(folio).toContainText("Read-only. Nothing on this page changes anything.");
    await expect(folio).toContainText("#87");
    await expect(folio).toContainText("9055912a");
    await expect(folio.getByRole("button")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`folio-${width}.png`), fullPage: true });
  });
}
