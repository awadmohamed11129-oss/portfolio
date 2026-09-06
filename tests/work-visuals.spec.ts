import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { assertWidth } from './helpers';
import { worldReady, type StageWindow } from './destination-helpers';

test('PaveScan compares matched images with keyboard and switches samples', async ({ page }, info) => {
  await page.goto('/projects/pavescan-ai');
  const slider = page.getByRole('slider', { name: 'Compare original image and model findings' });
  await expect(slider).toBeVisible();
  await assertWidth(page, info);
  await worldReady(page, 'projects');
  await expect.poll(() => page.evaluate(() => (window as StageWindow).__world?.snapshot().body)).toBe('moon');
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'idle');
  await slider.scrollIntoViewIfNeeded();
  await slider.focus();
  await slider.press('Home');
  await expect(slider).toHaveValue('0');
  await slider.press('End');
  await expect(slider).toHaveValue('100');
  const bounds = await slider.boundingBox();
  await page.mouse.move(bounds!.x + bounds!.width * .8, bounds!.y + bounds!.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + bounds!.width * .2, bounds!.y + bounds!.height / 2, { steps: 6 });
  await page.mouse.up();
  expect(Number(await slider.inputValue())).toBeGreaterThanOrEqual(19);
  expect(Number(await slider.inputValue())).toBeLessThanOrEqual(21);
  await page.getByRole('button', { name: 'Clean road', exact: true }).click();
  await expect(page.locator('[data-comparison-result]')).toHaveAttribute('src', /04_dashcam_clean_road-found/);
  const comparison = await page.locator('[data-work-visual="pavescan-ai"]').boundingBox();
  const context = await page.locator('[data-project-hero]').boundingBox();
  expect(comparison!.y).toBeLessThan(context!.y);
});

test('Work visuals expose the deliverables and preserve readable project routes', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const capture = `docs/qa/work-visuals/${info.project.name}`;
  mkdirSync(capture, { recursive: true });
  for (const slug of ['pavescan-ai', 'civic-data-pipeline', 'localflow', 'pop-up-chapel']) {
    await page.goto(`/projects/${slug}`);
    await expect(page.locator(`[data-work-visual="${slug}"]`)).toBeVisible();
    await assertWidth(page, info);
    await worldReady(page, 'projects');
    await expect.poll(() => page.evaluate(() => (window as StageWindow).__world?.snapshot().body)).toBe('moon');
    await expect.poll(() => page.locator('img').evaluateAll(images => images.filter(image => { const rect = image.getBoundingClientRect(); return image instanceof HTMLImageElement && rect.height > 0 && rect.top < innerHeight && rect.bottom > 0 && (!image.complete || image.naturalWidth === 0); }).length)).toBe(0);
    await page.screenshot({ path: `${capture}/${slug}.png` });
    await page.locator(`[data-work-visual="${slug}"]`).screenshot({ path: `${capture}/${slug}-visual.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator('img[src*="michal-balog"], img[src*="micah-sammie"]').count()).toBe(0);
  }
  await page.getByRole('button', { name: 'Vendor run sheet', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open sample PDF' })).toHaveAttribute('href', /vendor-run-sheet.pdf/);
  await page.goto('/projects/localflow');
  await page.getByRole('button', { name: 'Replay saved output' }).click();
  await expect(page.getByTestId('localflow-output')).toContainText("I'm testing my dictation tool today", { timeout: 8000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Replay saved output' }).click();
  await expect(page.getByTestId('localflow-output')).toContainText('does it handle questions properly?');
  await page.goto('/projects/civic-data-pipeline');
  await page.getByRole('button', { name: '311 trends', exact: true }).click();
  await expect(page.getByText('32%', { exact: true })).toBeVisible();
  await page.goto('/projects');
  await expect(page.locator('[data-work-visual]')).toHaveCount(4);
  await worldReady(page, 'projects');
  await page.screenshot({ path: `${capture}/projects.png` });
  const worldId = await page.evaluate(() => (window as StageWindow).__portfolioWorld?.id);
  await page.getByRole('link', { name: /^Explore the project\s*:\s*PaveScan AI$/ }).click();
  await expect(page).toHaveURL(/projects\/pavescan-ai$/);
  expect(await page.evaluate(() => (window as StageWindow).__portfolioWorld?.id)).toBe(worldId);
  await page.getByRole('link', { name: 'All projects', exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
  expect(await page.evaluate(() => (window as StageWindow).__portfolioWorld?.id)).toBe(worldId);
  expect(errors).toEqual([]);
});

test('Touch comparison leaves the page vertically scrollable', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'mobile-390', 'Touch viewport only');
  await page.goto('/projects/pavescan-ai');
  const slider = page.getByRole('slider', { name: 'Compare original image and model findings' });
  await worldReady(page, 'projects');
  await expect.poll(() => page.evaluate(() => (window as StageWindow).__world?.snapshot().body)).toBe('moon');
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'idle');
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  const session = await context.newCDPSession(page);
  const y = box!.y + box!.height / 2;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box!.x + box!.width * .8, y }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box!.x + box!.width * .25, y }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect(Number(await slider.inputValue())).toBeGreaterThanOrEqual(24);
  expect(Number(await slider.inputValue())).toBeLessThanOrEqual(26);
  expect(await slider.evaluate(element => getComputedStyle(element).touchAction)).toBe('pan-y');
  const beforeScroll = await page.evaluate(() => scrollY);
  const x = box!.x + box!.width / 2;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: box!.y + box!.height * .85 }] });
  for (const ratio of [.65, .45, .25]) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: box!.y + box!.height * ratio }] });
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(beforeScroll + 20);
  await session.detach();
});
