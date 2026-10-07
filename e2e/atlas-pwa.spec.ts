import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

// Explicit opt-in: requires a separately built immutable production baseline.
// No public server, repository or deployment is changed by this local origin swap.
test("installed production worker receives the Atlas candidate", async ({ browser }) => {
  test.skip(!process.env.ATLAS_BASELINE_DIST, "Set ATLAS_BASELINE_DIST to the frozen production build");
  test.setTimeout(120_000);
  const baseline = resolve(process.env.ATLAS_BASELINE_DIST!);
  const candidate = resolve("dist");
  let active = baseline;
  const types: Record<string, string> = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
  const server = createServer(async (req, res) => {
    // Enforce isolation even for service-worker-initiated requests, which page
    // interception alone cannot protect. Only local build assets may be fetched.
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self' data:; worker-src 'self' blob:");
    res.setHeader("Cache-Control", "no-cache");
    const pathname = decodeURIComponent(new URL(req.url!, "http://localhost").pathname);
    const file = resolve(active, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!file.startsWith(active + sep)) { res.writeHead(403).end(); return; }
    try {
      const body = await readFile(file);
      res.setHeader("Content-Type", types[extname(file)] || "application/octet-stream");
      res.end(body);
    } catch {
      if (extname(pathname)) { res.writeHead(404).end(); return; }
      res.setHeader("Content-Type", "text/html");
      res.end(await readFile(resolve(active, "index.html")));
    }
  });
  await new Promise<void>(done => server.listen(0, "127.0.0.1", done));
  const port = (server.address() as { port: number }).port;
  const context = await browser.newContext({ serviceWorkers: "allow" });
  const page = await context.newPage();
  try {
    await page.addInitScript(() => {
      localStorage.setItem("s33d-blessing-dismissed", "1");
      localStorage.setItem("s33d-map-ritual-seen", "1");
      localStorage.setItem("ancient-friends-tour-seen", "true");
    });
    await page.goto(`http://127.0.0.1:${port}/map`);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    const oldBuild = JSON.parse(await readFile(resolve(baseline, "version.json"), "utf8")).build;
    const newBuild = JSON.parse(await readFile(resolve(candidate, "version.json"), "utf8")).build;
    expect(newBuild).not.toBe(oldBuild);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("app-update-installed-build"))).toBe(oldBuild);
    active = candidate;
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())!.update(); });
    await expect(page.getByTitle("Update available", { exact: true })).toBeVisible({ timeout: 60000 });
    await page.getByRole("button", { name: "TEOTAG's guiding orb — explore, contribute, and discover", exact: true }).click();
    await page.getByRole("button", { name: /Update/ }).click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("app-update-installed-build")).catch(() => null), { timeout: 60000 }).toBe(newBuild);
    await expect(page.locator('img.leaflet-tile[src*="tile.openstreetmap.org"]').first()).toBeAttached();
    await expect(page.locator('img.leaflet-tile[src*="cartocdn"]')).toHaveCount(0);
    await page.screenshot({ path: test.info().outputPath("updated-local-pwa.png") });
  } finally {
    await context.close();
    await new Promise<void>(done => server.close(() => done()));
  }
});
