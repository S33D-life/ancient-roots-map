import { test, expect, type Page } from "@playwright/test";

// Integration evidence only: real public reads, no production writes or RPC/functions.
test.use({ serviceWorkers: "block" });
const TREE = "a6470bac-a114-4bd6-bc04-d51de580445f";
async function realm(page: Page, width: number, name: string) {
  if (width === 390) {
    await page.getByRole("button", { name: "Open Tree index", exact: true }).click();
    await page.getByRole("navigation", { name: "Tree index" }).getByRole("link", { name: new RegExp(`^${name} `) }).click();
  } else {
    await page.getByRole("navigation", { name: "Tree realms" }).getByRole("link", { name, exact: true }).click();
  }
}
for (const width of [1440, 390]) {
  test(`combined Tree → Birch → Hall → Council → Crown → Home at ${width}`, async ({ page }) => {
    test.setTimeout(120000);
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.route("**/*", route => {
      const req = route.request(), url = new URL(req.url());
      const local = ["localhost", "127.0.0.1"].includes(url.hostname);
      if (!local && (!["GET", "HEAD"].includes(req.method()) || /\/rpc\/|\/functions\//.test(url.pathname))) {
        return route.fulfill({ contentType: "application/json", body: "[]" });
      }
      return route.continue();
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "TETOL", exact: true })).toBeVisible();
    await realm(page, width, "Roots");
    await expect(page.locator(".leaflet-container")).toBeVisible();
    await page.getByRole("button", { name: "Begin the Wander", exact: true }).click();
    await page.getByRole("button", { name: "Search the Tree", exact: true }).click();
    await page.getByRole("combobox", { name: "Search the Tree", exact: true }).fill("QA Test Birch #6");
    await page.getByRole("option", { name: /QA Test Birch #6/ }).click();
    await expect(page).toHaveURL(new RegExp(`/tree/${TREE}`));
    await expect(page.getByRole("heading", { name: "QA Test Birch #6", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Open in Library of Life →", exact: true }).click();
    const lib = page.getByTestId("library-life");
    await expect(lib.getByRole("heading", { name: "Silver Birch", exact: true })).toBeVisible();
    const origin = lib.getByRole("link", { name: "↩ Return to QA Test Birch #6", exact: true }).first();
    await expect(origin).toHaveAttribute("href", `/tree/${TREE}`);
    await lib.getByRole("link", { name: /Species & distribution/ }).click();
    await expect(lib).toContainText("being prepared · not yet approved");
    await page.screenshot({ path: test.info().outputPath(`combined-birch-${width}.png`) });
    await page.reload();
    await expect(origin).toHaveAttribute("href", `/tree/${TREE}`);
    await page.goBack();
    await expect(lib.getByRole("heading", { name: "Silver Birch", exact: true })).toBeVisible();
    await page.goForward();
    await expect(lib.getByRole("heading", { name: "Species & distribution", exact: true })).toBeVisible();
    // No live link opens this unapproved chapter. Direct entry must still gate it.
    await page.goto(`/library/life/betula-pendula/read/species-and-distribution?originType=ancient-friend&originId=${TREE}`);
    await expect(lib.getByRole("heading", { name: "This chapter is not published yet.", exact: true })).toBeVisible();
    await expect(lib.getByRole("article")).toHaveCount(0);
    await origin.click();
    await expect(page.getByRole("heading", { name: "QA Test Birch #6", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Enter Heartwood Hall →", exact: true }).click();
    await expect(page.getByRole("link", { name: "Back to the Ancient Friend", exact: true })).toHaveAttribute("href", `/tree/${TREE}`);
    await page.getByRole("button", { name: "Staff Room", exact: true }).click();
    await expect(page.getByRole("tab", { name: "Explorer", exact: true })).toBeVisible();
    await page.getByText("144 sacred staffs await…", { exact: true }).waitFor({ state: "hidden" });
    await realm(page, width, "Canopy");
    await expect(page.getByRole("heading", { name: "Council of Life", exact: true })).toBeVisible();
    await realm(page, width, "Crown");
    await expect(page.getByRole("heading", { name: "What is asking to grow?", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "S33D — Open the TETOL tree browser", exact: true }).click();
    await expect(page.getByRole("heading", { name: "TETOL", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    await page.screenshot({ path: test.info().outputPath(`combined-homecoming-${width}.png`) });
  });
}
