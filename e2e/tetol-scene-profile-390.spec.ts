import { test, expect } from '@playwright/test';
import { disconnectedTransport } from './fixtures/circle237-disconnected-transport';

/**
 * Review-only performance probe for the original TETOL at 390x844.
 * Deliberately does not stub renderer.render, throttle requestAnimationFrame,
 * change app code, persist user data, or replace historical Council assertions.
 * Reported times are diagnostic observations, never native-device evidence.
 */
test.use({ hasTouch: true });

test('390px original Tree scene startup and first companion journey (diagnostic)', async ({ page, context }, testInfo) => {
  test.setTimeout(180_000);

  const t0 = performance.now();
  const elapsed = () => Math.round(performance.now() - t0);
  const marks: Record<string, number | null> = {};
  const mark = (name: string) => { marks[name] = elapsed(); };
  const pageErrors: string[] = [];

  page.on('pageerror', error => pageErrors.push(error.message));
  await context.addInitScript(disconnectedTransport);
  await page.addInitScript(() => {
    const probe = { longTaskCount: 0, longTaskMs: 0, largestLongTaskMs: 0 };
    (window as any).__s33dProfile390 = probe;
    try {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          probe.longTaskCount += 1;
          probe.longTaskMs += entry.duration;
          probe.largestLongTaskMs = Math.max(probe.largestLongTaskMs, entry.duration);
        }
      }).observe({ entryTypes: ['longtask'] });
    } catch {
      // Browser support for Long Tasks API is optional; report only what exists.
    }
  });
  await page.route('**/*', request => {
    const host = new URL(request.request().url()).hostname;
    return ['127.0.0.1', 'localhost'].includes(host) ? request.continue() : request.abort();
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });

  mark('before_navigation');
  await page.goto('/tetol/circle-235/pre-fire/tetol.html?circle=238#croom', { waitUntil: 'domcontentloaded' });
  mark('dom_content_loaded');

  await page.waitForFunction(() => !!(window as any).__tetol, undefined, { timeout: 90_000 });
  mark('tetol_api_available');

  await page.waitForFunction(() => {
    const stage = document.querySelector('three-d-stage') as any;
    return !!(stage?._renderer && stage?._scene);
  }, undefined, { timeout: 90_000 });
  mark('renderer_and_scene_allocated');

  await page.waitForFunction(() =>
    document.body.classList.contains('inroom') &&
    !document.body.classList.contains('moving') &&
    !document.body.dataset.q,
  undefined, { timeout: 90_000 });
  mark('room_ready');

  // Three.js's renderer.info counter is an optional observation, not a
  // substitute for verifying first pixels / real-device visual acceptance.
  const frameCounterObserved = await page.waitForFunction(() => {
    const stage = document.querySelector('three-d-stage') as any;
    const frames = stage?._renderer?.info?.render?.frame;
    return typeof frames === 'number' && frames > 0;
  }, undefined, { timeout: 7_000 }).then(() => true, () => false);
  marks.renderer_frame_counter_observed = frameCounterObserved ? elapsed() : null;

  await expect(page.locator('#grab')).toContainText('Meet the 10 companions');
  await testInfo.attach('original-tree-390-before-sheet.png', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  mark('visual_snapshot_attached');

  const framesBeforeSheet = await page.evaluate(() => {
    const stage = document.querySelector('three-d-stage') as any;
    return stage?._renderer?.info?.render?.frame ?? null;
  });
  await page.locator('#grab').tap();
  await expect(page.locator('body')).toHaveAttribute('data-sheet', 'mid');
  mark('companion_sheet_open');

  await page.locator('#companion-start').tap();
  await expect(page.locator('#panel h2')).not.toBeEmpty();
  mark('first_companion_open');

  const firstCompanionUrl = page.url();
  await page.locator('#companion-next').tap();
  await expect.poll(() => page.url()).not.toBe(firstCompanionUrl);
  mark('second_companion_open');

  await page.locator('#companion-gathering').tap();
  await expect(page).toHaveURL(/#croom$/);
  mark('returned_to_gathering');

  const browserMetrics = await page.evaluate(() => {
    const stage = document.querySelector('three-d-stage') as any;
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const paints = performance.getEntriesByType('paint').map(entry => ({
      name: entry.name, ms: Math.round(entry.startTime),
    }));
    const probe = (window as any).__s33dProfile390;
    return {
      navigationDomContentLoadedMs: navigation ? Math.round(navigation.domContentLoadedEventEnd) : null,
      paints,
      rendererFrameCount: stage?._renderer?.info?.render?.frame ?? null,
      rendererDrawCalls: stage?._renderer?.info?.render?.calls ?? null,
      longTaskCount: probe?.longTaskCount ?? null,
      longTaskTotalMs: probe ? Math.round(probe.longTaskMs) : null,
      largestLongTaskMs: probe ? Math.round(probe.largestLongTaskMs) : null,
    };
  });

  console.log('S33D_TETOL_390_PROFILE ' + JSON.stringify({
    baseline: 'PR #127 candidate d926be725328; new diagnostic branch',
    notes: 'No RAF override or renderer stub; elapsed marks are Node/Playwright wall-clock, browser metrics are separate.',
    marks,
    frameCounterObserved,
    framesBeforeSheet,
    browserMetrics,
    pageErrorCount: pageErrors.length,
  }));
  expect(pageErrors).toEqual([]);
});
