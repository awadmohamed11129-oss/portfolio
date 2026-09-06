import { test, expect } from '@playwright/test';

test('stalled opening photo releases navigation within the startup deadline', async ({ page }) => {
  await page.route('**/assets/house-exterior-v1.webp', () => new Promise(() => {}));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator('#loading')).toContainText(/view is unavailable/i, { timeout: 18000 });
  const heading = page.getByRole('heading', { level: 1, name: 'Selected work', exact: true });
  await expect(heading).toBeVisible();
  await expect.poll(() => heading.evaluate(node => {
    let opacity = 1;
    for (let current: Element | null = node; current; current = current.parentElement) opacity *= Number(getComputedStyle(current).opacity);
    return opacity;
  })).toBeGreaterThanOrEqual(.99);
  await page.locator('main a[href="/projects/pavescan-ai"]').first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'PaveScan AI', exact: true })).toBeVisible();
});
