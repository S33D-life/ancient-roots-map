import { test, expect, type Page } from "@playwright/test";

/**
 * Smoke tests — boot the production bundle and assert the four
 * highest-traffic routes render without crashing.
 *
 * "Render without crashing" means:
 *   • HTTP 200 from the dev/preview server
 *   • No `GlobalErrorBoundary` fallback visible
 *   • No uncaught console errors above a low-noise threshold
 *   • Page-specific shell / landmark element present
 *
 * Total target wall-time: < 2 minutes on CI.
 */

const SAMPLE_TREE_ID =
  process.env.PLAYWRIGHT_TREE_ID || "de895aec-556d-4f1a-8b1c-b8dc97185950";

/** Console noise allowlist — known-benign warnings we don't fail on. */
const ALLOWED_CONSOLE_PATTERNS = [
  /favicon/i,
  /Service[- ]Worker/i,
  /workbox/i,
  /sourcemap/i,
  /Failed to load resource.*404/i, // optional assets that may 404 in preview
  /Download the React DevTools/i,
  /\[vite\]/i,
];

function isAllowedConsoleMessage(text: string): boolean {
  return ALLOWED_CONSOLE_PATTERNS.some((re) => re.test(text));
}

/** Capture page errors (uncaught) + console errors. */
function attachErrorTracking(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (err) => {
    errors.push(`pageerror: ${err.message}`);
  });
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (isAllowedConsoleMessage(text)) return;
    errors.push(`console.error: ${text}`);
  });
  return errors;
}

/** Assert the GlobalErrorBoundary fallback is NOT shown. */
async function assertNoCrashFallback(page: Page) {
  // GlobalErrorBoundary fallback contains a "Reload" / "Try again" affordance
  // and a calm header. Match by accessible role to avoid copy churn.
  const crashHeading = page.getByRole("heading", {
    name: /something|wrong|crash|trouble/i,
    level: 1,
  });
  await expect(crashHeading).toHaveCount(0);
}

test.describe("Smoke — public routes render", () => {
  test("/ — home loads", async ({ page }) => {
    const errors = attachErrorTracking(page);
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.ok(), "home returned non-200").toBeTruthy();

    // Header is the most stable landmark on every page.
    await expect(page.locator("header").first()).toBeVisible({ timeout: 10_000 });
    await assertNoCrashFallback(page);

    // Allow lazy chunks a moment to settle.
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    expect(errors, `console / page errors:\n${errors.join("\n")}`).toEqual([]);
  });

  test("/map — atlas loads", async ({ page }) => {
    const errors = attachErrorTracking(page);
    const response = await page.goto("/map", { waitUntil: "domcontentloaded" });
    expect(response?.ok(), "map returned non-200").toBeTruthy();

    await expect(page.getByTestId("map-shell")).toBeVisible({ timeout: 10_000 });
    await assertNoCrashFallback(page);

    // Either the leaflet container OR the map-error fallback should mount.
    // Both are acceptable — what's NOT acceptable is a blank page.
    const mapMounted = page.locator(
      ".leaflet-container, [data-testid='map-error'], [data-testid='map-loading']"
    );
    await expect(mapMounted.first()).toBeVisible({ timeout: 15_000 });

    expect(errors, `console / page errors:\n${errors.join("\n")}`).toEqual([]);
  });

  test("/library — heartwood loads", async ({ page }) => {
    const errors = attachErrorTracking(page);
    const response = await page.goto("/library", { waitUntil: "domcontentloaded" });
    expect(response?.ok(), "library returned non-200").toBeTruthy();

    await expect(page.locator("header").first()).toBeVisible({ timeout: 10_000 });
    await assertNoCrashFallback(page);

    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    expect(errors, `console / page errors:\n${errors.join("\n")}`).toEqual([]);
  });

  test("/tree/:id — detail page loads or 'not found' renders cleanly", async ({
    page,
  }) => {
    const errors = attachErrorTracking(page);
    const response = await page.goto(`/tree/${SAMPLE_TREE_ID}`, {
      waitUntil: "domcontentloaded",
    });
    expect(response?.ok(), "tree detail returned non-200").toBeTruthy();

    await expect(page.locator("header").first()).toBeVisible({ timeout: 10_000 });
    await assertNoCrashFallback(page);

    // The page is healthy if EITHER:
    //   • The tree hero renders (tree exists & loaded), OR
    //   • A "not found" / "loading" state is visible.
    // What we're proving: the page does not crash from hook-order
    // bugs (React #310) on the loading → loaded transition.
    const healthyState = page.locator(
      "main, [data-testid='tree-detail'], [data-testid='tree-hero'], [data-testid='tree-not-found'], [data-testid='tree-loading']"
    );
    await expect(healthyState.first()).toBeVisible({ timeout: 15_000 });

    // Give lazy sections time to mount — this is where #310 used to fire.
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
    await assertNoCrashFallback(page);

    expect(errors, `console / page errors:\n${errors.join("\n")}`).toEqual([]);
  });
});
