import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { snapshot, worldReady, type StageWindow } from './destination-helpers';
import { sourceLoader } from './source-loader';
import { assertWidth, attachJson } from './helpers';

for (const requestedRoom of ['photographic', 'blender']) {
  test(`About photographic (?room=${requestedRoom}) scroll, profile focus and accessible content`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/about?room=${requestedRoom}`);
    const room = page.locator('[data-room-variant]');
    await expect(room).toHaveAttribute('data-room-variant', 'photographic');
    await expect(page.getByTestId('blender-about-room')).toHaveCount(0);
    await assertWidth(page, info);
    const opener = room.getByRole('button', { name: /Open my profile/ });
    const box = (await opener.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    await opener.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(opener).toBeFocused();
    const originalTop = (await room.boundingBox())!.y;
    await page.evaluate(() => scrollTo(0, 600));
    const scroll = await page.evaluate(() => scrollY);
    if (info.project.use.viewport!.width < 1024) {
      expect(Math.abs((await room.boundingBox())!.y - originalTop + scroll), 'Room should scroll away above the biography').toBeLessThan(2);
    }
    await page.getByRole('heading', { name: 'Let’s put it to work.' }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: 'Let’s put it to work.' })).toBeInViewport();
    await page.screenshot({ path: `docs/qa/overnight/photographic-${requestedRoom}-${info.project.name}-scrolled.png` });
    await page.evaluate(() => scrollTo(0, 0));
    const axe = await new AxeBuilder({ page }).analyze();
    await attachJson(info, 'about-axe', { violations: axe.violations });
    expect(axe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    await page.screenshot({ path: `docs/qa/overnight/photographic-${requestedRoom}-${info.project.name}-preview.png` });
    await page.screenshot({ path: `docs/qa/overnight/photographic-${requestedRoom}-${info.project.name}.png`, fullPage: true });
    await opener.click();
    await page.getByRole('dialog').getByRole('link', { name: 'Explore my projects' }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.goBack();
    await expect(room).toHaveAttribute('data-room-variant', 'photographic');
  });
}

test('Jupiter resize, route facts, About suspension and return', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/experience');
  await worldReady(page, 'experience');
  await expect.poll(async () => (await snapshot(page))?.body).toBe('jupiter');
  const source = sourceLoader();
  const roles = source.load('content/experience.ts').roles as { title: string; company: string; dates: string; bullets: string[] }[];
  for (const role of roles) {
    const article = page.locator('article').filter({ has: page.getByRole('heading', { name: role.title, exact: true }) });
    for (const text of [role.company, role.dates, ...role.bullets]) await expect(article).toContainText(text);
  }
  const campus = page.locator('img[alt*="Recreation and Athletic Centre"]');
  await campus.scrollIntoViewIfNeeded();
  await expect.poll(() => campus.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: `docs/qa/overnight/experience-${info.project.name}-preview.png` });
  await page.screenshot({ path: `docs/qa/overnight/experience-${info.project.name}.png`, fullPage: true });
  const viewport = info.project.use.viewport!;
  await page.setViewportSize({ width: viewport.width, height: viewport.height - 120 });
  const destinations = source.load('lib/journey/destinations.ts').destinations as typeof import('../lib/journey/destinations').destinations;
  const arrival = destinations.experience.arrival;
  if (arrival.kind !== 'fly') throw new Error('Experience must have a flight arrival');
  const expected = arrival.pose(viewport.width / (viewport.height - 120)).altitude;
  await expect.poll(async () => (await snapshot(page))?.targetAltitudeKm).toBe(expected);
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'About', exact: true }).click();
  await worldReady(page, 'about');
  await page.waitForTimeout(250);
  const before = await page.evaluate(() => (window as StageWindow).__world!.performance().samples);
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => (window as StageWindow).__world!.performance().samples)).toBe(before);
  expect((await snapshot(page))?.groundAsleep).toBe(true);
  await page.goBack();
  await worldReady(page, 'experience');
  await expect.poll(async () => (await snapshot(page))?.body).toBe('jupiter');
  await expect.poll(() => page.evaluate(() => Number((window as StageWindow).__world!.performance().samples))).toBeGreaterThan(Number(before));
  expect(errors).toEqual([]);
});
