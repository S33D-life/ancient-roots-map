import { test, expect } from "@playwright/test";

// Fictional catalogue responses only. No map records, media or production writes.
test.use({ serviceWorkers: "block", hasTouch: true });
const examples = [
  ["Common Walnut", "Juglans regia"], ["Chestnut-leaved Oak", "Quercus castaneifolia"],
  ["European Hop-Hornbeam", "Ostrya carpinifolia"], ["Wollemi Pine", "Wollemia nobilis"],
  ["Cork Oak", "Quercus suber"], ["Argan", "Argania spinosa"], ["Sausage Tree", "Kigelia africana"],
];

for (const width of [390, 1280]) test(`field mapping at ${width}px: seven Cambridge names, ambiguity, offline and broad identification`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: 844 });
  let unavailable = false;
  let treeWrites = 0;
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (["127.0.0.1", "localhost"].includes(url.hostname)) return route.continue();
    if (url.pathname.endsWith("/rpc/search_species_multilingual")) {
      if (unavailable) return route.abort("internetdisconnected");
      const query = route.request().postDataJSON()?.query || url.searchParams.get("query");
      const match = examples.find(([common, scientific]) => common === query || scientific === query);
      const rows = match ? [{ species_id: `fixture-${examples.indexOf(match)}`, species_key: `fixture-key-${examples.indexOf(match)}`,
        scientific_name: match[1], canonical_common_name: match[0], family: null, matched_name: query,
        matched_language: "en", match_kind: "scientific_prefix", slug: null }] : [];
      return route.fulfill({ json: rows });
    }
    if (url.pathname.endsWith("/trees") && route.request().method() === "POST") treeWrites++;
    return route.fulfill({ json: [] });
  });
  await page.addInitScript(() => localStorage.setItem("s33d_first_walk", JSON.stringify({ completed: [], dismissed: true })));
  await page.goto("/add-tree");
  await page.getByRole("button", { name: /I know the species/ }).click();
  const input = page.getByRole("combobox", { name: "Common or scientific name" });
  for (const [common, scientific] of examples) {
    await input.fill(common);
    const choice = page.getByRole("option").filter({ hasText: scientific });
    await expect(choice).toHaveCount(1);
    // A local hint must be replaced by one canonical catalogue result, never duplicated.
    await expect(choice).not.toContainText("Local suggestion");
    if (width === 390) await choice.tap();
    else await choice.click();
    await expect(input).toHaveValue(common);
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await expect(input).toBeFocused();
  }
  await input.fill("Oak");
  await expect.poll(() => page.getByRole("option").count()).toBeGreaterThan(1);
  await expect(input).toHaveValue("Oak");
  await input.press("ArrowDown");
  await expect(input).toHaveAttribute("aria-activedescendant", /.+/);
  await input.press("Escape");
  await expect(input).toHaveAttribute("aria-expanded", "false");
  await input.fill("Chestnut leaved oak");
  await expect(page.getByRole("option").filter({ hasText: "Quercus castaneifolia" })).toHaveCount(1);
  await expect(page.getByRole("option").filter({ hasText: "Quercus castaneifolia" })).not.toContainText("Local suggestion");
  await page.screenshot({ path: testInfo.outputPath(`cambridge-${width}.png`), fullPage: true });

  unavailable = true;
  await input.fill("Wollemi pine");
  await expect(page.getByRole("status").filter({ hasText: "Catalogue unavailable" })).toBeVisible();
  await expect(page.getByRole("option")).toContainText("Wollemia nobilis");
  await input.fill("My unidentified tree");
  await expect(input).toHaveValue("My unidentified tree");
  await page.getByRole("button", { name: "Back to identification choices" }).click();
  await page.getByRole("button", { name: "I know only the family or genus" }).click();
  await page.getByLabel("Genus name").fill("Quercus");
  await page.getByRole("button", { name: "Use this broad identification" }).click();
  await page.getByRole("button", { name: /^Continue/ }).click();
  await expect(page.getByText("Quercus (genus; species unconfirmed)", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath(`genus-only-${width}.png`), fullPage: true });
  expect(treeWrites).toBe(0);
});
