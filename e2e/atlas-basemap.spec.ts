import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "block" });

// All remote traffic is intercepted: these regressions cannot mutate production.
for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`forest background failure and recovery at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    let failTiles = true;
    let cartoRequests = 0;
    await page.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.hostname === "127.0.0.1" || url.hostname === "localhost") return route.continue();
      if (url.hostname.includes("cartocdn")) cartoRequests++;
      if (url.hostname === "tile.openstreetmap.org") {
        if (failTiles) return route.abort();
        return route.fulfill({ contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=", "base64") });
      }
      return route.fulfill({ contentType: "application/json", body: "[]" });
    });
    await page.goto("/atlas");
    const mapToggle = page.getByTitle("Atlas Map", { exact: true });
    await expect(mapToggle).toBeVisible();
    await mapToggle.click();
    await expect(page.getByText("Map background unavailable. You can still explore forest regions.")).toBeVisible();
    const nodes = page.locator(".atlas-canopy-node");
    await expect(nodes.first()).toBeAttached();
    const count = await nodes.count();
    await page.screenshot({ path: test.info().outputPath("forest-failed.png"), fullPage: true });
    const map = page.locator(".leaflet-container");
    const before = await map.locator(".leaflet-map-pane").getAttribute("style");
    const retry = page.getByRole("button", { name: "Retry map background", exact: true });
    const box = await retry.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await retry.focus();
    failTiles = false;
    await page.keyboard.press("Enter");
    await expect(page.getByText("Map background unavailable. You can still explore forest regions.")).toBeHidden();
    await expect(map.locator(".leaflet-tile-loaded").first()).toBeAttached();
    expect(await nodes.count()).toBe(count);
    expect(await map.locator(".leaflet-map-pane").getAttribute("style")).toBe(before);
    expect(cartoRequests).toBe(0);
    await expect(page.getByRole("link", { name: "OpenStreetMap", exact: true })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath("forest-recovered.png"), fullPage: true });
  });
}

for (const [width, height, locationCode] of [[1280, 720, 1], [390, 844, 1], [844, 390, 3]]) {
  test(`tree markers survive background recovery ${width}x${height}, location ${locationCode}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript(code => {
      localStorage.setItem("s33d-map-ritual-seen", "1");
      localStorage.setItem("ancient-friends-tour-seen", "true");
      Object.defineProperty(navigator, "geolocation", { value: {
        getCurrentPosition: (_success: unknown, failure: (error: unknown) => void) => failure({ code, message: code === 1 ? "Permission denied" : "Location timeout" }),
        watchPosition: () => 0, clearWatch: () => {},
      } });
    }, locationCode);
    let failTiles = false;
    await page.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (["127.0.0.1", "localhost"].includes(url.hostname)) return route.continue();
      if (url.hostname === "tile.openstreetmap.org") {
        if (failTiles) return route.abort();
        return route.fulfill({ contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=", "base64") });
      }
      const trees = [{ id: "11111111-1111-4111-8111-111111111111", name: "Atlas regression oak", species: "Quercus robur", latitude: 51.5, longitude: -0.1, nation: "United Kingdom", estimated_age: 300, created_by: null }];
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(url.pathname === "/rest/v1/trees" ? trees : []) });
    });
    await page.goto("/map?lat=51.5&lng=-0.1&zoom=13&species=Quercus%20robur");
    const skip = page.getByRole("button", { name: "Skip introduction", exact: true });
    await skip.focus();
    await page.keyboard.press("Enter");
    await expect(skip).toBeHidden();
    await page.getByRole("button", { name: "Dismiss trail", exact: true }).click();
    const status = page.getByText("Map background unavailable. You can still explore tree markers.");
    await expect(page.locator(".leaflet-tile-loaded").first()).toBeAttached();
    await expect(page.getByText("Loading map background…", { exact: true })).toBeHidden();
    const markers = page.locator(".leaflet-tree-marker");
    await expect(markers.first()).toBeAttached();
    await markers.first().focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".leaflet-popup")).toContainText("Atlas regression oak");
    await expect(page.locator(".leaflet-pan-anim")).toHaveCount(0);
    failTiles = true;
    await page.locator(".leaflet-container").focus();
    await page.keyboard.press("Equal");
    await expect(status).toBeVisible();
    await expect(page.locator(".leaflet-zoom-anim")).toHaveCount(0);
    await expect(page.locator(".leaflet-popup")).toContainText("Atlas regression oak");
    await expect(page.locator(".leaflet-pan-anim")).toHaveCount(0);
    const count = await markers.count();
    const pane = page.locator(".leaflet-map-pane").first();
    const before = await pane.getAttribute("style");
    await page.screenshot({ path: test.info().outputPath("map-failed.png"), fullPage: true });
    failTiles = false;
    await page.getByRole("button", { name: "Retry map background", exact: true }).click();
    await expect(status).toBeHidden();
    await expect(page.getByText("Loading map background…", { exact: true })).toBeHidden();
    await expect(page.locator(".leaflet-tile-loaded").first()).toBeAttached();
    expect(await markers.count()).toBe(count);
    await expect(page.locator(".leaflet-popup")).toContainText("Atlas regression oak");
    expect(new URL(page.url()).searchParams.get("species")).toBe("Quercus robur");
    expect(await pane.getAttribute("style")).toBe(before);
    const attribution = page.getByRole("link", { name: "OpenStreetMap", exact: true });
    await expect(attribution).toBeVisible();
    const attributionHit = await attribution.evaluate(el => {
      const r = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    });
    expect(attributionHit).toBe(true);
    const attributionBox = await attribution.boundingBox();
    if (width < 768) expect(attributionBox!.y + attributionBox!.height).toBeLessThanOrEqual(height - 72);
    const locate = page.getByTitle("Locate me", { exact: true });
    await locate.click();
    await expect(page.locator('button[title^="Location:"]')).toBeVisible();
    await expect(markers.first()).toBeAttached();
    await page.screenshot({ path: test.info().outputPath("map-recovered.png"), fullPage: true });
  });
}

test("live OSM geographic tiles with isolated tree fixtures", async ({ page }) => {
  test.skip(!process.env.ATLAS_LIVE_TILES, "Explicit opt-in for one normal live-provider viewport");
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => {
    localStorage.setItem("s33d-blessing-dismissed", "1");
    localStorage.setItem("s33d-map-ritual-seen", "1");
    localStorage.setItem("ancient-friends-tour-seen", "true");
  });
  let carto = 0;
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (["127.0.0.1", "localhost", "tile.openstreetmap.org"].includes(url.hostname)) return route.continue();
    if (url.hostname.includes("cartocdn")) carto++;
    const trees = [{ id: "11111111-1111-4111-8111-111111111111", name: "Atlas regression oak", species: "Quercus robur", latitude: 51.5, longitude: -0.1, nation: "United Kingdom", created_by: null }];
    return route.fulfill({ contentType: "application/json", body: JSON.stringify(url.pathname === "/rest/v1/trees" ? trees : []) });
  });
  await page.goto("/map?lat=51.5&lng=-0.1&zoom=10");
  await expect(page.locator(".leaflet-tile-loaded").first()).toBeAttached({ timeout: 20000 });
  await expect(page.getByText("Loading map background…", { exact: true })).toBeHidden();
  await expect(page.locator(".leaflet-tree-marker")).toHaveCount(1);
  expect(carto).toBe(0);
  await page.screenshot({ path: test.info().outputPath("live-osm-geography.png"), fullPage: true });
});
