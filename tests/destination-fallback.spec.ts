import { test, expect } from '@playwright/test';
import { assertWidth, attachJson } from './helpers';
import { installFlightRecorder, clickDestination, worldReady, snapshot, finishRecorder } from './destination-helpers';
import { projectsPose } from '../lib/journey/destinations';
import type { StageWindow } from './destination-helpers';

test('P1-G8 renderer initialization failure retains readable route navigation', async ({ page }, info) => {
  const failures: string[] = [];
  page.on('console', message => { if (message.type() === 'error') failures.push(message.text()); });
  // Fail only the renderer's required imagery, leaving real HTML/React/router
  // and every navigation link intact. This is not a mocked provider assertion.
  await page.route('**/media/earth/day-4096.webp', route => route.fulfill({ status: 503, contentType: 'text/plain', body: 'QA intentional unavailable Earth texture' }));
  await page.goto('/');
  await expect(page.locator('#loading')).toContainText(/view is unavailable/i, { timeout: 15000 });
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
  const heading = page.getByRole('heading', { level: 1, name: 'Selected work', exact: true });
  await expect(heading).toBeVisible();
  await expect.poll(() => heading.evaluate(node => {
    let opacity = 1;
    for (let current: Element | null = node; current; current = current.parentElement) opacity *= Number(getComputedStyle(current).opacity);
    return opacity;
  })).toBeGreaterThanOrEqual(.99);
  await expect(page.locator('main')).not.toHaveAttribute('data-phase', /leave|empty/);
  await page.locator('main a[href="/projects/pavescan-ai"]').first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'PaveScan AI', exact: true })).toBeVisible();
  await assertWidth(page, info);
  await attachJson(info, 'initial-failure-fallback', { errors: failures, world: await snapshot(page), phase: await page.locator('main').getAttribute('data-phase') });
});

test('P1-G6 enabling reduced motion during flight removes the remaining tween', async ({ page }, info) => {
  await installFlightRecorder(page);
  await page.goto('/');
  await worldReady(page, 'home');
  await clickDestination(page);
  await page.waitForTimeout(1600);
  expect((await snapshot(page))?.flightActive).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(async () => (await snapshot(page))?.flightActive, { timeout: 200, intervals: [16, 16, 32] }).toBe(false);
  await expect(page).toHaveURL(/\/projects$/);
  await expect.poll(async () => (await snapshot(page))?.body).toBe('moon');
  await page.waitForTimeout(250);
  const record = await finishRecorder(page);
  const finalWorld = await snapshot(page);
  const viewport = info.project.use.viewport!;
  const expectedPose = projectsPose(viewport.width / viewport.height);
  expect(finalWorld?.destination).toBe('projects');
  expect(finalWorld?.body).toBe('moon');
  expect(Number(finalWorld?.altitudeKm)).toBeCloseTo(expectedPose.altitude, 5);
  expect(Number(finalWorld?.targetAltitudeKm)).toBeCloseTo(expectedPose.altitude, 5);
  expect(await page.evaluate(() => window.__portfolioWorld?.navigator.snapshot().active)).toBe(false);
  expect(record.events.some(event => ['snap', 'cancel', 'complete'].includes(String(event.detail.type)) && event.detail.destination === 'projects' && event.detail.active === false)).toBe(true);
  const last = record.frames.at(-1);
  expect(last?.opacity).toBeGreaterThanOrEqual(.99);
  expect(last?.flight).toBe(false);
  await assertWidth(page, info);
  await attachJson(info, 'live-reduced-motion', { emulated: true, nativeOS: 'UNVERIFIED', record, world: await snapshot(page) });
});

test('P1-G8 returning home synchronizes the runway before the first wheel input', async ({ page }, info) => {
  await page.goto('/projects');
  await worldReady(page, 'projects');
  await page.locator('a.site-name[href="/"]').click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(async () => (await snapshot(page))?.flightActive).toBe(false);
  await worldReady(page, 'home');
  const before = await page.evaluate(() => ({ scroll: scrollY, span: document.getElementById('film-runway')!.offsetHeight - innerHeight, state: (window as StageWindow).roomProof?.state }));
  expect(before.state?.progress).toBe(1);
  expect(before.state?.playing).toBe(false);
  expect(Math.abs(before.scroll - before.span), 'Earth endpoint and scroll runway must agree before user input').toBeLessThanOrEqual(2);
  await page.mouse.move(info.project.use.viewport!.width - 16, 400);
  await page.mouse.wheel(0, -80);
  await page.waitForTimeout(150);
  const after = await page.evaluate(() => ({ scroll: scrollY, state: (window as StageWindow).roomProof?.state }));
  expect(after.state?.progress).toBeGreaterThan(.95);
  expect(after.state?.playing).toBe(false);
  expect((await snapshot(page))?.filmProgress).toBeGreaterThan(.95);
  await assertWidth(page, info);
  await attachJson(info, 'home-return-scroll', { before, after, world: await snapshot(page) });
});
