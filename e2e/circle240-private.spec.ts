import { expect, test } from '@playwright/test';
import { disconnectedTransport } from './fixtures/circle237-disconnected-transport';

test('the production build cannot enter the private Circle 240', async ({ page, context, request }) => {
  await context.addInitScript(disconnectedTransport);
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' &&
    route.request().method() === 'GET' ? route.continue() : route.abort());
  await page.goto('/council/240');
  await expect(page.getByRole('heading', { name: '404', exact: true })).toBeVisible();

  const tree = await (await request.get('/council/time-tree.json')).json();
  expect(tree.current).toBe(239);
  expect(tree.editions.map((edition: { number: number }) => edition.number)).toEqual([234, 235, 236, 237, 238, 239]);

  await page.goto('/tetol/circle-235/pre-fire/tetol.html?circle=240&review240=1#croom');
  await expect(page.getByRole('alert')).toContainText('This Council edition is unavailable');
  await expect(page.locator('three-d-stage')).toHaveCount(0);
});
