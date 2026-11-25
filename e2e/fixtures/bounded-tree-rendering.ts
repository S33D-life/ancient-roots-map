import type { Page } from '@playwright/test';

/** Keep CI's software GPU idle between explicit, real Tree draws.
 * Install before navigation: waiting for the sign first lets an unbounded
 * destination renderer starve the very readiness assertion being awaited.
 * No scene, texture, camera, hit-testing or application state is replaced.
 */
export async function installBoundedTreeRendering(page: Page) {
  await page.addInitScript(() => {
    customElements.whenDefined('three-d-stage').then(() => {
      const Stage = customElements.get('three-d-stage')!;
      Object.defineProperty(Stage.prototype, '_renderer', {
        configurable: true,
        get() { return undefined; },
        set(renderer) {
          const render = renderer.render.bind(renderer);
          renderer.__treeDrawBudget = 0;
          renderer.__treeDrawCount = 0;
          renderer.render = (...args: unknown[]) => {
            if (renderer.__treeDrawBudget > 0) {
              renderer.__treeDrawBudget--;
              render(...args);
              renderer.__treeDrawCount++;
            }
          };
          Object.defineProperty(this, '_renderer', {value: renderer, writable: true, configurable: true});
        },
      });
    });
  });
}

export async function drawTreeFrame(page: Page) {
  await page.waitForFunction(() => !!(window as any).__tetol);
  const before = await page.evaluate(() => {
    const renderer = (document.querySelector('three-d-stage') as any)._renderer;
    if (renderer.__treeDrawCount === undefined) throw new Error('Tree drawing budget was not installed');
    renderer.__treeDrawBudget++;
    return renderer.__treeDrawCount;
  });
  await page.waitForFunction(count => (document.querySelector('three-d-stage') as any)._renderer.__treeDrawCount > count, before);
}
