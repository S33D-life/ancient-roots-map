import { expect, test } from '@playwright/test';
import { disconnectedTransport } from './fixtures/circle237-disconnected-transport';

test('the activation build opens Circle 240 with its unscheduled Fire and archive', async ({ page, context, request }) => {
  await context.addInitScript(disconnectedTransport);
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' &&
    route.request().method() === 'GET' ? route.continue() : route.abort());
  await page.goto('/council/240');
  await expect(page.getByRole('heading', { name: 'Circle 240 · Current Council', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Meet The Ginkgo at Rokeby' })).toBeVisible();
  await expect(page.getByText('No live Fire is scheduled.', { exact: false })).toBeVisible();

  const tree = await (await request.get('/council/time-tree.json')).json();
  expect(tree.current).toBe(240);
  expect(tree.editions.map((edition: { number: number }) => edition.number)).toEqual([234, 235, 236, 237, 238, 239, 240]);

  await page.goto('/tetol/circle-235/pre-fire/tetol.html?circle=240#croom');
  await expect(page.locator('#brandline')).toContainText('240 · CURRENT / OPEN');
  await expect(page.locator('three-d-stage')).toHaveCount(1);
});
