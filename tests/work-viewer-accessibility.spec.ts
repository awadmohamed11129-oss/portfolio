import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';
import { worldReady, snapshot } from './destination-helpers';

test('Enlarged image viewer has no automated accessibility violations', async ({ page }, info) => {
  await page.goto('/projects/pavescan-ai');
  await worldReady(page, 'projects');
  await expect.poll(async () => (await snapshot(page))?.body).toBe('moon');
  await page.getByRole('button', { name: 'Enlarge images', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'PaveScan image viewer' })).toBeVisible();
  const audit = await new AxeBuilder({ page }).include('dialog[open]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  await info.attach('viewer-accessibility', { body: JSON.stringify(audit), contentType: 'application/json' });
  expect(audit.violations).toEqual([]);
});
