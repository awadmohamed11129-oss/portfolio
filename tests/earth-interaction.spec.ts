import { test, expect, type Page } from '@playwright/test';
import { worldReady } from './destination-helpers';

type EarthState = { longitude: number; radiusKm: number; interaction: string; sceneTimeSeconds: number; canDrag: boolean };
const earth = (page: Page) => page.evaluate(() => (window.roomProof?.state as { earth: EarthState }).earth);

async function returnHome(page: Page) {
  await page.goto('/projects');
  await worldReady(page, 'projects');
  await page.locator('a.site-name[href="/"]').click();
  await worldReady(page, 'home');
  await expect.poll(async () => (await earth(page)).canDrag).toBe(true);
}

test('home Earth accepts a real pointer drag and resumes its living orbit', async ({ page }, info) => {
  test.skip(Boolean(info.project.use.hasTouch), 'Touch has a dedicated gesture test.');
  await returnHome(page);
  const { width, height } = info.project.use.viewport!;
  const x = width * .72, y = height * .48;
  const hit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id, { x, y });
  expect(hit, 'The transparent home content must not cover the globe interaction surface').toBe('hero-scene');
  await page.mouse.move(x, y);
  await page.mouse.down();
  await expect.poll(async () => (await earth(page)).interaction).toBe('dragging');
  const before = await earth(page);
  await page.mouse.move(x - 90, y - 25, { steps: 8 });
  await expect.poll(async () => Math.abs((await earth(page)).longitude - before.longitude)).toBeGreaterThan(8);
  expect(Math.abs((await earth(page)).radiusKm - before.radiusKm)).toBeLessThan(.01);
  await page.mouse.up();
  await expect.poll(async () => (await earth(page)).interaction).toBe('authored');
  const released = await earth(page);
  await expect.poll(async () => (await earth(page)).sceneTimeSeconds - released.sceneTimeSeconds).toBeGreaterThan(.4);
  expect(Math.abs((await earth(page)).longitude - released.longitude)).toBeGreaterThan(.05);
  await page.locator('#arrival a').click();
  await expect(page).toHaveURL(/\/projects$/);
});

test('home Earth retains keyboard rotation and reset', async ({ page }) => {
  await returnHome(page);
  await page.locator('#hero-scene').focus();
  const before = await earth(page);
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => Math.abs((await earth(page)).longitude - before.longitude)).toBeGreaterThan(1);
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await earth(page)).interaction).toBe('authored');
});

test('home Earth touch rotation keeps its size and returns control to page scrolling', async ({ page, context }, info) => {
  test.skip(!info.project.use.hasTouch, 'Requires a touch viewport.');
  await returnHome(page);
  const host = page.locator('#hero-scene');
  await expect(host).toHaveCSS('touch-action', 'pan-y');
  await page.getByRole('button', { name: 'Rotate Earth', exact: true }).click();
  await expect(host).toHaveCSS('touch-action', 'none');
  const { width, height } = info.project.use.viewport!;
  const x = width * .55, y = height * .45;
  const cdp = await context.newCDPSession(page);
  const scrollBefore = await page.evaluate(() => scrollY);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await expect.poll(async () => (await earth(page)).interaction).toBe('dragging');
  const before = await earth(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 75, y: y - 25 }] });
  await expect.poll(async () => Math.abs((await earth(page)).longitude - before.longitude)).toBeGreaterThan(8);
  expect(Math.abs((await earth(page)).radiusKm - before.radiusKm)).toBeLessThan(.01);
  expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => (await earth(page)).interaction).toBe('authored');
  await page.getByRole('button', { name: 'Done rotating', exact: true }).click();
  await expect(host).toHaveCSS('touch-action', 'pan-y');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + 100 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(scrollBefore);
  await cdp.detach();
});
