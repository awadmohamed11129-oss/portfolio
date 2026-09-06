import { test, expect } from '@playwright/test';
import { worldReady, snapshot } from './destination-helpers';

test('late planet image failure keeps the requested page and restores a usable Earth', async ({ page }, info) => {
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let requests = 0;
  await page.route('**/media/moon/**', async route => { requests++; await held; await route.abort('failed'); });
  await page.goto('/');
  await worldReady(page, 'home');
  await page.locator('nav[aria-label="Primary"] a[href="/projects"]').click();
  await worldReady(page, 'projects');
  await expect.poll(() => requests).toBeGreaterThan(0);
  await expect.poll(async () => (await snapshot(page))?.flightActive).toBe(false);
  release();
  await expect(page.locator('#loading')).toBeVisible();
  await expect(page.locator('#loading')).toContainText('Showing Earth');
  expect((await snapshot(page))?.body).toBe('earth');
  expect((await snapshot(page))?.sceneAlive).toBe(true);
  await expect(page.getByRole('heading', { level: 1, name: 'Selected work', exact: true })).toBeVisible();
  await expect(page.locator('#main-content')).toHaveAttribute('data-phase', 'arrive');
  await info.attach('late-failure-visible-Earth', { body: await page.screenshot(), contentType: 'image/png' });
  await page.locator('a.site-name[href="/"]').click();
  await worldReady(page, 'home');
  await expect(page.locator('#loading')).toBeHidden();
});

test('direct planet image failure preserves the world and a later retry loads the planet', async ({ page }, info) => {
  let requests = 0;
  await page.route('**/media/moon/**', route => { requests++; return route.abort('failed'); });
  await page.goto('/projects');
  await expect(page.locator('#loading')).toContainText('Showing Earth');
  await worldReady(page, 'projects');
  expect(requests).toBeGreaterThan(0);
  expect((await snapshot(page))?.body).toBe('earth');
  await expect(page.getByRole('heading', { level: 1, name: 'Selected work', exact: true })).toBeVisible();
  await info.attach('direct-failure-visible-Earth', { body: await page.screenshot(), contentType: 'image/png' });
  await page.unroute('**/media/moon/**');
  await page.locator('nav[aria-label="Primary"] a[href="/projects"]').click();
  await expect.poll(async () => (await snapshot(page))?.body).toBe('moon');
  expect((await snapshot(page))?.sceneAlive).toBe(true);
  await expect(page.locator('#loading')).toBeHidden();
});
