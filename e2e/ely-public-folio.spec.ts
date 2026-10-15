import { test, expect } from "@playwright/test";
for (const width of [390,1440]) test(`Ely Circle 236 folio and return — ${width}px`, async ({page}) => {
  await page.setViewportSize({width,height:900});
  await page.route("**/*", route => {
    const host=new URL(route.request().url()).hostname;
    return ["127.0.0.1","localhost"].includes(host) ? route.continue() : route.fulfill({contentType:"application/json",body:"[]"});
  });
  await page.goto("/review/council/236?mode=2d");
  await expect(page.getByRole("heading",{name:"Circle 236"})).toBeVisible();
  await page.getByRole("link",{name:"Read Ely Plane’s living folio →"}).click();
  await expect(page).toHaveURL(/\/ancient-friends\/ely\/folio/);
  await expect(page.getByRole("heading",{name:"The Great London Plane of Ely"})).toBeVisible();
  await expect(page.getByText(/could not reach the trunk/)).toBeVisible();
  await expect(page.getByRole("link",{name:"Watch this tree live ↗"})).toHaveAttribute("href",/treecouncil\.org\.uk/);
  await page.reload();
  await expect(page.getByRole("heading",{name:"The Great London Plane of Ely"})).toBeVisible();
  await page.getByRole("link",{name:"← Return to Ely in Circle 236"}).first().click();
  await expect(page).toHaveURL(/\/review\/council\/236/);
  await expect(page.getByRole("heading",{name:"Circle 236"})).toBeVisible();
  await expect(page.locator("#ely-plane-companion")).toBeFocused();
});
