import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "block" });
for (const width of [1440, 390, 320]) {
  test(`realm navigation follows the Tree with clear active states at ${width}`, async ({ page }) => {
    test.setTimeout(90000);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", route => {
      const req = route.request(), url = new URL(req.url());
      if (!["localhost", "127.0.0.1"].includes(url.hostname) &&
          (!["GET", "HEAD"].includes(req.method()) || /\/rpc\/|\/functions\//.test(url.pathname))) {
        return route.fulfill({ contentType: "application/json", body: "[]" });
      }
      return route.continue();
    });
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/s33d#ground");
    const nav = page.getByRole("navigation", { name: width < 760 ? "Continue through the Tree" : "Tree realms", exact: true });
    await expect(nav).toBeVisible();
    const labels = width < 760 ? ["Roots", "Seed", "Heartwood", "Canopy", "Crown"] : ["Roots", "S33D", "Heartwood", "Canopy", "Crown"];
    expect(await nav.getByRole("link").evaluateAll(es => es.map(e => e.getAttribute("aria-label") || e.textContent))).toEqual(labels);
    await expect(nav.getByRole("link", { name: labels[1], exact: true })).toHaveAttribute("aria-current", "page");
    if (width < 760) {
      const boxes = await nav.getByRole("link").evaluateAll(es => es.map(e => { const r=e.getBoundingClientRect(); return {x:r.x,right:r.right,width:r.width,height:r.height}; }));
      expect(boxes.every(b => b.width >= 44 && b.height >= 44 && b.x >= 0 && b.right <= width)).toBe(true);
      for (let i=1;i<boxes.length;i++) expect(boxes[i].x).toBeGreaterThanOrEqual(boxes[i-1].right);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`nav-${width}.png`) });
    for (const [name, route] of [["Crown","/golden-dream"],["Canopy","/council-of-life"],["Heartwood","/library"],["Roots","/map"]]) {
      await nav.getByRole("link", { name, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${route}$`));
      if (name === "Roots") {
        const trail = page.getByRole("button", { name: "Dismiss trail", exact: true });
        if (width < 760 || await trail.isVisible()) await trail.click();
        await page.getByRole("button", { name: "Begin the Wander", exact: true }).click();
      }
      await expect(nav.getByRole("link", { name, exact: true })).toHaveAttribute("aria-current", "page");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await nav.getByRole("link", { name: labels[1], exact: true }).click();
    await expect(nav.getByRole("link", { name: labels[1], exact: true })).toHaveAttribute("aria-current", "page");
    await page.getByRole("button", { name: "Use Night Grove", exact: true }).click();
    await expect(page.getByRole("button", { name: "Use Living Parchment", exact: true })).toBeVisible();
    await expect(nav).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`nav-night-${width}.png`) });
    expect(errors).toEqual([]);
  });
}
