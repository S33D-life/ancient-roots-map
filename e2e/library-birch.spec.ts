import { test, expect, type Page, type Route } from "@playwright/test";

/**
 * PLANeTary Library · Birch first vertical slice (production build, mocked Supabase).
 * No live reads or writes: every non-local request is fulfilled here.
 */
const KEY = "betula-pendula";
const T1 = "abb025be-1ea7-48be-8a21-d7daf90e4c21";
const T2 = "a6470bac-a114-4bd6-bc04-d51de580445f";
const SPECIES = {
  id: "00000000-0000-4000-8000-0000000000b1", slug: "silver-birch", species_key: KEY,
  scientific_name: "Betula pendula", canonical_common_name: "Silver Birch", common_name: "Silver Birch",
  family: "Betulaceae", genus: "Betula", rank: "species",
};
const UNKEYED_SILVER = "1163190f-4484-4879-9822-9be59bc8ba56";
const UNKEYED = "1163190f-4484-4879-9822-9be59bc8ba55";
// Shaped like the live records: the pilot Birch has no description and no lore.
const base = { description: null, lore_text: null, latitude: 52.595879, longitude: 0.563677, what3words: null, nation: null, created_at: "2026-02-25T20:42:34Z", updated_at: "2026-04-11T13:06:44Z", photo_status: "none", metadata: {} };
const TREES: Record<string, Record<string, unknown>> = {
  [T1]: { ...base, id: T1, name: "Birch", species: "Birch", species_key: KEY, accessibility_tier: "public" },
  [T2]: { ...base, id: T2, name: "QA Test Birch #6", species: "Silver Birch", species_key: KEY, accessibility_tier: "public" },
  [UNKEYED_SILVER]: { ...base, id: UNKEYED_SILVER, name: "Silver Birch", species: "Silver Birch", species_key: null, accessibility_tier: "public" },
  [UNKEYED]: { ...base, id: UNKEYED, name: "Weeping birch", species: "Birch", species_key: null, accessibility_tier: "public" },
};
const writes: string[] = [];
const pageErrors: string[] = [];
let treePageVisited = false;

function eqParam(url: URL, col: string) {
  const v = url.searchParams.get(col);
  return v?.startsWith("eq.") ? v.slice(3) : null;
}

async function fulfilRest(route: Route) {
  const req = route.request();
  const url = new URL(req.url());
  if (req.method() !== "GET" && req.method() !== "HEAD") writes.push(`${req.method()} ${url.pathname}`);
  const json = (body: unknown) => route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
  if (url.pathname.endsWith("/rest/v1/species_index")) {
    const key = eqParam(url, "species_key");
    const slug = eqParam(url, "slug");
    return json([SPECIES].filter(s => (key === null || s.species_key === key) && (slug === null || s.slug === slug) && (key !== null || slug !== null)));
  }
  if (url.pathname.endsWith("/rest/v1/trees")) {
    const id = eqParam(url, "id");
    return json(id && TREES[id] ? [TREES[id]] : []);
  }
  return json([]);
}

test.use({ serviceWorkers: "block" });
test.beforeEach(async ({ page }) => {
  writes.length = 0;
  treePageVisited = false;
  pageErrors.length = 0;
  page.on("pageerror", e => pageErrors.push(`${e.message}\n${e.stack ?? ""}`.slice(0, 1200)));
  await page.route("**/*", route => {
    const url = new URL(route.request().url());
    if (["127.0.0.1", "localhost"].includes(url.hostname)) return route.continue();
    if (url.hostname === "fonts.googleapis.com") return route.fulfill({ contentType: "text/css", body: "" });
    return fulfilRest(route);
  });
  await page.addInitScript(() => {
    try { localStorage.setItem("entrance_seen_golden-dream", "1"); } catch { /* storage may be blocked */ }
  });
});
test.afterEach(() => {
  expect(pageErrors, "no uncaught page errors").toEqual([]);
  // Library pages make no writes at all. The existing tree page posts its own page-view
  // analytics and read RPCs (fulfilled here, never sent); nothing may touch trees, offerings or species.
  const allowed = treePageVisited ? /^POST \/rest\/v1\/(tree_page_views|rpc\/(get_tree_activity_stats|list_tree_inscriptions))$/ : /$^/;
  expect(writes.filter(w => !allowed.test(w)), "no writes leave the page").toEqual([]);
  expect(writes.filter(w => /\/(trees|offerings|species_index)$/.test(w))).toEqual([]);
});

const origin = (id: string) => `?originType=ancient-friend&originId=${id}`;
const noOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

async function controlsAtLeast44(page: Page) {
  for (const target of await page.locator(".llp a, .llp button").all()) {
    const box = await target.boundingBox();
    if (box) expect(box.height, await target.innerText()).toBeGreaterThanOrEqual(44);
  }
}

for (const [width, height] of [[1440, 900], [390, 844]] as const) {
  test(`Birch: Library home → Species & distribution → Reader → return at ${width}px`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height });
    await page.goto(`/library/life/${KEY}${origin(T1)}`);
    const lib = page.getByTestId("library-life");
    await expect(lib.getByRole("heading", { level: 1, name: "Silver Birch" })).toBeVisible({ timeout: 15_000 });
    await expect(lib.getByTestId("library-arrival")).toContainText("You came from Birch, an Ancient Friend recorded in S33D as Betula pendula.");
    await expect(lib.getByRole("navigation", { name: "Return", exact: true }).getByRole("link")).toHaveAttribute("href", `/tree/${T1}`);
    await expect(lib).not.toContainText(/genus|Circle|Council/);
    expect(await noOverflow(page)).toBe(true);
    await controlsAtLeast44(page);
    await page.screenshot({ path: test.info().outputPath(`01-library-home-${width}.png`), fullPage: true });

    await lib.getByRole("link", { name: /Species & distribution/ }).click();
    await expect(page).toHaveURL(new RegExp(`/library/life/${KEY}/species-distribution\\?originType=ancient-friend&originId=${T1}$`));
    await expect(lib.getByRole("heading", { level: 1, name: "Species & distribution" })).toBeVisible();
    await expect(lib).toContainText("Betula pendula · species index");
    await expect(lib).toContainText("Betulaceae · species index");
    await expect(lib).toContainText("not yet recorded in S33D");
    await expect(lib).toContainText("Birch · recorded as Betula pendula · one individual, not the species");
    // The pilot chapter is not approved: it shows as being prepared and is not a link.
    await expect(lib).toContainText("being prepared · not yet approved");
    await expect(lib.getByRole("link", { name: /^Species & distribution →$/ })).toHaveCount(0);
    expect(await noOverflow(page)).toBe(true);
    await controlsAtLeast44(page);
    await page.screenshot({ path: test.info().outputPath(`02-species-distribution-${width}.png`), fullPage: true });

    // Refresh keeps the exact origin.
    await page.reload();
    await expect(lib.getByRole("heading", { level: 1, name: "Species & distribution" })).toBeVisible({ timeout: 15_000 });
    await expect(lib.getByRole("link", { name: "↩ Return to Birch" }).first()).toHaveAttribute("href", `/tree/${T1}`);

    // The Reader for an unapproved chapter renders nothing in its place.
    await page.goto(`/library/life/${KEY}/read/species-and-distribution${origin(T1)}`);
    await expect(lib.getByRole("heading", { level: 1, name: "This chapter is not published yet." })).toBeVisible({ timeout: 15_000 });
    await expect(lib.getByRole("article")).toHaveCount(0);
    await expect(lib.getByRole("link", { name: "↩ Return to Birch" }).first()).toHaveAttribute("href", `/tree/${T1}`);
    expect(await noOverflow(page)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`03-reader-unapproved-${width}.png`), fullPage: true });

    await lib.getByRole("link", { name: "↩ Return to Birch" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/tree/${T1}$`));
  });
}

test("Ancient Friend page: the keyed Birch (no story) shows one doorway; an unkeyed Birch shows none", async ({ page }) => {
  test.setTimeout(60_000);
  treePageVisited = true;
  for (const [width, height] of [[1440, 900], [390, 844]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto(`/tree/${T1}`);
    await expect(page.getByTestId("tree-detail")).toBeVisible({ timeout: 15_000 });
    const doorway = page.getByRole("link", { name: "Open in Library of Life →" });
    await expect(doorway).toHaveCount(1);
    await expect(doorway).toHaveAttribute("href", `/library/life/${KEY}${origin(T1)}`);
    const box = (await doorway.boundingBox())!;
    expect(Math.round(box.height), "doorway target height (sub-pixel layout rounding)").toBeGreaterThanOrEqual(44);
    expect(await noOverflow(page)).toBe(true);
    await doorway.scrollIntoViewIfNeeded();
    await page.screenshot({ path: test.info().outputPath(`00-tree-doorway-${width}.png`) });
  }
  await page.getByRole("link", { name: "Open in Library of Life →" }).click();
  await expect(page).toHaveURL(new RegExp(`/library/life/${KEY}\\?originType=ancient-friend&originId=${T1}$`));
  await expect(page.getByTestId("library-arrival")).toContainText("You came from Birch");

  await page.goto(`/tree/${UNKEYED}`);
  await expect(page.getByTestId("tree-detail")).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1500);
  await expect(page.getByRole("link", { name: /Library of Life/ })).toHaveCount(0);
  await page.goto(`/tree/${UNKEYED_SILVER}`);
  await expect(page.getByTestId("tree-detail")).toBeVisible();
  await expect(page.getByTestId("library-doorway")).toHaveCount(0);
});

test("two Ancient Friends of one species open the same identity and each returns to its own tree", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [id, name] of [[T1, "Birch"], [T2, "QA Test Birch #6"]] as const) {
    await page.goto(`/library/life/${KEY}${origin(id)}`);
    const lib = page.getByTestId("library-life");
    await expect(lib.getByRole("heading", { level: 1, name: "Silver Birch" })).toBeVisible({ timeout: 15_000 });
    await expect(lib.getByRole("link", { name: `↩ Return to ${name}` }).first()).toHaveAttribute("href", `/tree/${id}`);
  }
});

test("direct entry without origin and hostile origins fall back to the Library", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const hostile = [
    "",
    "?originType=ancient-friend&originId=not-a-uuid",
    "?originType=ancient-friend&originId=https%3A%2F%2Fevil.example",
    `?originType=ancient-friend&originId=${T1}&originId=${T2}`,
    `?originType=council&originId=${T1}`,
    "?originType=ancient-friend&originId=00000000-0000-4000-8000-000000000000",
  ];
  for (const q of hostile) {
    await page.goto(`/library/life/${KEY}${q}`);
    const lib = page.getByTestId("library-life");
    await expect(lib.getByRole("heading", { level: 1, name: "Silver Birch" })).toBeVisible({ timeout: 15_000 });
    const returns = lib.getByRole("link", { name: /^↩ / });
    await expect(returns.first()).toHaveText("↩ Return to the Library");
    for (const a of await lib.locator("a").all()) {
      expect(await a.getAttribute("href"), q).toMatch(/^\/library(\/life\/betula-pendula(\/species-distribution)?)?$/);
    }
    await expect(lib.getByTestId("library-arrival")).toHaveCount(0);
  }
});

test("a supplied return path is never followed: the return is built from the validated origin", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/library/life/${KEY}${origin(T1)}&returnTo=https%3A%2F%2Fevil.example&return=%2Fadmin`);
  const lib = page.getByTestId("library-life");
  await expect(lib.getByRole("heading", { level: 1, name: "Silver Birch" })).toBeVisible({ timeout: 15_000 });
  for (const a of await lib.locator("a").all()) {
    expect(await a.getAttribute("href")).not.toMatch(/evil|admin|returnTo/);
  }
  await expect(lib.getByRole("link", { name: "↩ Return to Birch" }).first()).toHaveAttribute("href", `/tree/${T1}`);
});

test("the page still renders when the font host is unreachable", async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.abort("internetdisconnected"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/library/life/${KEY}${origin(T1)}`);
  const lib = page.getByTestId("library-life");
  await expect(lib.getByRole("heading", { level: 1, name: "Silver Birch" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Something flickered in the grove")).toHaveCount(0);
});

test("an unknown key stops and offers only the Library", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/library/life/birch${origin(T1)}`);
  const lib = page.getByTestId("library-life");
  await expect(lib.getByRole("heading", { level: 1, name: "This species is not in the Library." })).toBeVisible({ timeout: 15_000 });
  await expect(lib.getByRole("link", { name: /Species & distribution/ })).toHaveCount(0);
});

test("at 390px the return controls and portal stay clear of the fixed TEOTAG orb (geometric)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/library/life/${KEY}${origin(T1)}`);
  const lib = page.getByTestId("library-life");
  await expect(lib.getByRole("heading", { level: 1, name: "Silver Birch" })).toBeVisible({ timeout: 15_000 });
  const orb = page.getByRole("button", { name: /TEOTAG's guiding orb/ });
  const orbPresent = await orb.isVisible().catch(() => false);
  test.info().annotations.push({ type: "orb", description: orbPresent ? "present" : "absent on this route" });
  const targets = [
    lib.getByRole("navigation", { name: "Return", exact: true }).getByRole("link"),
    lib.getByRole("link", { name: /Species & distribution/ }),
    lib.getByTestId("library-arrival"),
    lib.getByRole("navigation", { name: "Return, end of page" }).getByRole("link"),
  ];
  for (const t of targets) {
    await t.scrollIntoViewIfNeeded();
    const box = (await t.boundingBox())!;
    expect(box.x + box.width, "inside the viewport").toBeLessThanOrEqual(390);
    if (!orbPresent) continue;
    const o0 = (await orb.boundingBox())!;
    await page.evaluate(dy => window.scrollBy(0, dy), (box.y + box.height / 2) - (o0.y + o0.height / 2));
    const o = (await orb.boundingBox())!;
    const p = (await t.boundingBox())!;
    const verticalOverlap = p.y < o.y + o.height && o.y < p.y + p.height;
    const intersects = p.x < o.x + o.width && o.x < p.x + p.width && verticalOverlap;
    expect(intersects, `${await t.innerText()} [${p.x},${p.y},${p.width}x${p.height}] vs orb [${o.x},${o.y},${o.width}x${o.height}]`).toBe(false);
  }
  // Every return control and the portal stays reachable by pointer even with the app's
  // fixed chrome open (orb, bottom navigation, first-walk panel): Playwright's hit-target check.
  for (const t of [targets[0], targets[1], targets[3]]) await t.click({ trial: true, timeout: 5_000 });
  await page.screenshot({ path: test.info().outputPath("04-orb-clearance-390.png") });
});

for (const width of [1440, 390]) {
  test(`shared Mantle, history and Night Grove in Library at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/library/life/${KEY}${origin(T2)}`);
    const lib = page.getByTestId("library-life");
    await expect(lib.getByRole("heading", { name: "Silver Birch", exact: true })).toBeVisible();
    await expect(page.locator("header.parchment-header")).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Tree realms" }).getByRole("link", { name: "Heartwood" })).toHaveAttribute("aria-current", "page");
    await lib.getByRole("link", { name: /Species & distribution/ }).click();
    await page.goBack();
    await expect(lib.getByRole("heading", { name: "Silver Birch", exact: true })).toBeVisible();
    await page.goForward();
    await expect(lib.getByRole("heading", { name: "Species & distribution", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Use Night Grove", exact: true }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(lib.getByRole("link", { name: "↩ Return to QA Test Birch #6" }).first()).toHaveAttribute("href", `/tree/${T2}`);
    expect(await noOverflow(page)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`night-species-${width}.png`), fullPage: true });
    await page.getByRole("button", { name: "Use Living Parchment", exact: true }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
}
