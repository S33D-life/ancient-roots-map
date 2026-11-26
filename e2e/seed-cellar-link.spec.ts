import { expect, test } from "@playwright/test";
import { disconnectedTransport } from "./fixtures/circle237-disconnected-transport";

test("Seed Cellar opens the tomato viewer and rejects unknown seed links", async ({ page, context }) => {
  await context.addInitScript(disconnectedTransport);
  await page.route("**/*", route => {
    const request = route.request();
    return new URL(request.url()).hostname === "127.0.0.1" && request.method() === "GET"
      ? route.continue()
      : route.abort();
  });

  await page.goto("/library/seed-cellar?seed=tomato-seed");
  await expect(page.getByRole("tab", { name: /seed life gallery/i })).toHaveAttribute("aria-selected", "true");
  const selector = page.getByRole("radiogroup", { name: /select a seed/i });
  await expect(selector.getByRole("radio", { name: /tomato seed/i })).toHaveAttribute("aria-checked", "true");
  await expect(selector.getByRole("radio")).toHaveCount(4);
  await expect(page.getByRole("tabpanel", { name: /seed life gallery/i }).locator("canvas[data-engine]")).toBeVisible();
  await page.getByRole("button", { name: "Images", exact: true }).click();
  await expect(selector).toHaveCount(0);

  await page.goto("/library/seed-cellar?seed=tomato-seeds");
  await expect(selector.getByRole("radio", { name: /tomato seed/i })).toHaveAttribute("aria-checked", "true");

  await page.goto("/library/seed-cellar?seed=unknown");
  await expect(page.getByText("This seed viewer destination is planned.")).toBeVisible();
  await expect(selector).toHaveCount(0);
});
