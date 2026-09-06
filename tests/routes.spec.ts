import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { routes, assertWidth, attachJson, ready } from './helpers';

for (const [route, heading] of routes) {
  test(`direct URL and refresh ${route}`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main').getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await ready(page);
    await assertWidth(page, testInfo);
    await page.reload();
    await expect(page.locator('main').getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await assertWidth(page, testInfo);
    expect(errors).toEqual([]);
  });
}

test('project navigation and browser Back preserve useful destinations', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await page.locator('main').getByRole('link', { name: /PaveScan AI/ }).first().click();
  await expect(page).toHaveURL(/\/projects\/pavescan-ai$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Selected work', exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await assertWidth(page, testInfo);
});

for (const fragment of ['projects', 'experience', 'about', 'skills']) {
  test(`legacy #${fragment} forwards and resolves a readable target`, async ({ page }) => {
    await page.goto(`/#${fragment}`);
    const target = fragment === 'skills' ? '/experience#skills' : `/${fragment}`;
    await expect.poll(() => new URL(page.url()).pathname + new URL(page.url()).hash).toBe(target);
    if (fragment === 'skills') await expect(page.locator('#skills')).toBeVisible();
    else await expect(page.locator('main h1')).toBeVisible();
  });
}

test('rapid navigation leaves the latest route and two persistent world canvases', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await page.evaluate(async () => {
    for (const href of ['/projects', '/about', '/experience', '/projects']) {
      (document.querySelector(`nav[aria-label="Primary"] a[href="${href}"]`) as HTMLAnchorElement).click();
      await new Promise(resolve => setTimeout(resolve, 35));
    }
  });
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator('main[data-destination-column]')).toHaveAttribute('data-destination', 'projects');
  await expect.poll(() => page.evaluate(() => window.__world?.snapshot().sceneAlive)).toBe(true);
  await expect(page.getByRole('heading', { name: 'Selected work', exact: true, level: 1 })).toBeVisible();
  await page.waitForTimeout(3200);
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator('canvas')).toHaveCount(2);
});

test('keyboard skip link reaches meaningful content', async ({ page }) => {
  await page.goto('/projects');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

for (const route of ['/', '/projects', '/experience', '/about', '/projects/pavescan-ai', '/projects/civic-data-pipeline', '/projects/pop-up-chapel', '/projects/localflow']) {
  test(`axe accessible page ${route}`, async ({ page }, testInfo) => {
    await page.goto(route);
    await ready(page);
    // Audit the settled reading state, after finite arrival fades finish.
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})));
    });
    const results = await new AxeBuilder({ page }).analyze();
    await attachJson(testInfo, 'axe-violations-and-incomplete', { violations: results.violations, incomplete: results.incomplete });
    expect(results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
  });
}

test('no JavaScript retains meaningful HTML and direct links', async ({ browser, baseURL }, testInfo) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: testInfo.project.use.viewport, isMobile: testInfo.project.use.isMobile });
  const page = await context.newPage();
  try {
    for (const [route, heading] of routes) {
      const response = await page.goto(`${baseURL}${route}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('main').getByRole('heading', { level: 1, name: heading })).toBeVisible();
      expect((await page.locator('main').innerText()).length).toBeGreaterThan(160);
      await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Resume' })).toBeVisible();
      await assertWidth(page, testInfo);
      if (route === '/') {
        await expect(page.locator('.journey-spacer')).toBeHidden();
        await expect(page.locator('.journey-cue')).toBeHidden();
      }
    }
  } finally { await context.close(); }
});
