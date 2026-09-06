import { test, expect } from '@playwright/test';
import { assertWidth, attachJson } from './helpers';
import { worldMetrics } from './metrics';

test.beforeEach(() => test.skip(process.env.QA_WORLD !== '1', 'Wait for coordinator to identify integrated world/room slice.'));

test('WebGL unavailable keeps About readable, non-inert, and navigable', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (/webgl/i.test(type)) return null;
      return original.apply(this, [type, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto('/about');
  await expect(page.getByText('Scenery is unavailable. All pages are ready to read.')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-mode', 'content');
  expect(await page.locator('main').evaluate(node => (node as HTMLElement).inert)).toBe(false);
  await expect(page.getByRole('heading', { name: 'About me' })).toBeVisible();
  await page.getByRole('button', { name: 'Step into the room' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-mode', 'content');
  await expect(page.getByRole('heading', { name: 'About me' })).toBeVisible();
  expect(await page.locator('main').evaluate(node => (node as HTMLElement).inert)).toBe(false);
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Projects', exact: true, level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'Mohamad Awad, home', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('body')).toHaveAttribute('data-mode', 'content');
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('.journey-spacer')).toBeHidden();
  await assertWidth(page, testInfo);
});

test('failed texture loads retain navigable HTML and do not leave loading stuck', async ({ page }, testInfo) => {
  const blocked: string[] = [];
  await page.route('**/world/**', route => { blocked.push(route.request().url()); return route.abort('failed'); });
  await page.goto('/');
  await expect(page.locator('[data-world-status]')).not.toHaveAttribute('data-world-status', 'loading', { timeout: 15_000 });
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'About', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'About me' })).toBeVisible();
  expect(await page.locator('main').evaluate(node => (node as HTMLElement).inert)).toBe(false);
  await attachJson(testInfo, 'blocked-textures', blocked);
  expect(blocked.length, 'Must actually exercise a failed load; no request means this gate was not tested').toBeGreaterThan(0);
});

test('real WebGL context loss/restoration recovers content and a single canvas', async ({ page }, testInfo) => {
  await page.goto('/about');
  await expect(page.locator('[data-world-status]')).toHaveAttribute('data-world-status', /ready|preview/);
  await page.getByRole('button', { name: 'Step into the room' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-mode', 'world');
  const supported = await page.evaluate(() => {
    const gl = document.querySelector('canvas')!.getContext('webgl2');
    const extension = gl?.getExtension('WEBGL_lose_context');
    if (!extension) return false;
    extension.loseContext();
    window.setTimeout(() => extension.restoreContext(), 1200);
    return true;
  });
  expect(supported, 'Browser must expose genuine WEBGL_lose_context; synthetic events are insufficient').toBe(true);
  await expect(page.locator('body')).toHaveAttribute('data-mode', 'content');
  await expect(page.locator('main')).toBeVisible();
  expect(await page.locator('main').evaluate(node => (node as HTMLElement).inert)).toBe(false);
  await expect(page.locator('[data-world-status]')).toHaveAttribute('data-world-status', /ready|preview/, { timeout: 10_000 });
  await expect(page.locator('canvas')).toHaveCount(1);
  await page.getByRole('button', { name: 'Step into the room' }).click();
  await expect(page.getByRole('button', { name: 'Open monitor' })).toBeVisible();
  await attachJson(testInfo, 'restored-world-metrics', await worldMetrics(page));
});

test('reduced motion reaches route immediately and stops continuous drawing', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('[data-world-status]')).toHaveAttribute('data-world-status', /ready|preview/);
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Projects', exact: true, level: 1 })).toBeVisible();
  await expect.poll(async () => (await worldMetrics(page)).activeLoop).toBe(false);
  const before = await worldMetrics(page);
  await page.waitForTimeout(600);
  const after = await worldMetrics(page);
  expect(after.frames).toBe(before.frames);
  await attachJson(testInfo, 'reduced-motion-metrics', { before, after });
});

test('resize preserves canvas CSS extent and readable destinations', async ({ page }, testInfo) => {
  await page.goto('/projects');
  await expect(page.locator('canvas')).toHaveCount(1);
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    // Native desktop scrollbars occupy CSS viewport space. A fixed inset:0
    // surface correctly fills clientWidth, while innerWidth includes the gutter.
    await expect.poll(async () => (await page.locator('canvas').boundingBox())?.width).toBe(await page.evaluate(() => document.documentElement.clientWidth));
    expect(await page.evaluate(() => innerWidth)).toBe(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    await expect(page.getByRole('heading', { name: 'Projects', exact: true, level: 1 })).toBeVisible();
  }
  await page.setViewportSize(testInfo.project.use.viewport!);
  await assertWidth(page, testInfo);
});

test('hidden tab suspends world drawing and returns without a flight backlog', async ({ page, context }, testInfo) => {
  test.skip(process.env.QA_HEADED !== '1', 'Natural visibility transitions must be verified in a headed browser.');
  await page.goto('/');
  await expect(page.locator('[data-world-status]')).toHaveAttribute('data-world-status', /ready|preview/);
  const other = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const otherCdp = await context.newCDPSession(other);
  await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: false });
  await otherCdp.send('Emulation.setFocusEmulationEnabled', { enabled: false });
  const windowInfo = await cdp.send('Browser.getWindowForTarget');
  let minimized = false;
  let mechanism = 'native tab activation with focus emulation disabled';
  try {
    await other.goto('about:blank');
    await other.bringToFront();
    let hidden = await page.waitForFunction(() => document.visibilityState === 'hidden', undefined, { timeout: 2000 }).then(() => true, () => false);
    if (!hidden) {
      mechanism = 'native browser-window minimization with focus emulation disabled';
      await cdp.send('Browser.setWindowBounds', { windowId: windowInfo.windowId, bounds: { windowState: 'minimized' } });
      minimized = true;
      hidden = await page.waitForFunction(() => document.visibilityState === 'hidden', undefined, { timeout: 2000 }).then(() => true, () => false);
    }
    if (!hidden) {
      await attachJson(testInfo, 'visibility-unverified', { state: await page.evaluate(() => document.visibilityState), mechanism, reason: 'Neither actual tab activation nor native minimization produced hidden in this automation environment. No synthetic visibility override was used.' });
      test.skip(true, 'UNVERIFIED: actual hidden state could not be induced. This is not a lifecycle pass.');
    }
    const before = await worldMetrics(page);
    await other.waitForTimeout(700);
    const during = await worldMetrics(page);
    expect(during.activeLoop).toBe(false);
    expect(during.frames).toBe(before.frames);
    if (minimized) await cdp.send('Browser.setWindowBounds', { windowId: windowInfo.windowId, bounds: { windowState: 'normal' } });
    await page.bringToFront();
    await expect.poll(() => page.evaluate(() => document.visibilityState)).toBe('visible');
    await expect.poll(async () => (await worldMetrics(page)).frames as number).toBeGreaterThan(during.frames as number);
    await attachJson(testInfo, 'visibility-metrics', { mechanism, before, during, after: await worldMetrics(page) });
  } finally {
    if (minimized) await cdp.send('Browser.setWindowBounds', { windowId: windowInfo.windowId, bounds: { windowState: 'normal' } });
    await other.close();
  }
});
