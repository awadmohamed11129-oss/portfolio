import { expect, type Page, type TestInfo } from '@playwright/test';
import type { StageWindow } from './destination-helpers';

export const routes = [
  ['/', /Mohamad Awad/],
  ['/projects', /^Selected work$/],
  ['/experience', /^Experience$/],
  ['/about', /^Mohamad Awad\.$/],
  ['/projects/pavescan-ai', /^PaveScan AI$/],
  ['/projects/civic-data-pipeline', /^Civic Data Pipeline$/],
  ['/projects/pop-up-chapel', /Pop-Up Chapel/],
  ['/projects/localflow', /^LocalFlow$/],
] as const;

export async function assertWidth(page: Page, testInfo: TestInfo) {
  const expectedWidth = testInfo.project.use.viewport!.width;
  expect(await page.evaluate(() => innerWidth), 'Actual CSS viewport width, not merely requested emulation').toBe(expectedWidth);
  const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(dimensions.document, JSON.stringify(dimensions)).toBeLessThanOrEqual(expectedWidth + 1);
  expect(dimensions.body, JSON.stringify(dimensions)).toBeLessThanOrEqual(expectedWidth + 1);
}

export async function attachJson(testInfo: TestInfo, name: string, value: unknown) {
  await testInfo.attach(name, { body: JSON.stringify(value, null, 2), contentType: 'application/json' });
}

export async function ready(page: Page) {
  await expect(page.locator('main[data-destination-column]')).toHaveAttribute('data-destination', /home|projects|experience|about|resume|contact/);
  await expect.poll(() => page.evaluate(() => (window as StageWindow).__world?.snapshot().sceneAlive)).toBe(true);
}
