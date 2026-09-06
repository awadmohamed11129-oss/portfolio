import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { DIRECT } from '../content/links';
import { roles } from '../content/experience';
import { worldReady } from './destination-helpers';

test('placement explains the correction and preserves the other roles', async ({ page }, info) => {
  await page.goto('/experience');
  await worldReady(page, 'experience');
  const visual = page.locator('[data-placement-visual]');
  await expect(visual).toContainText('85%');
  await expect(visual).toContainText('32%');
  await expect(visual).toContainText('one Toronto 311 service-request category');
  await expect(visual).toContainText('No client records are shown');
  const details = page.locator('#data-engineering details');
  await expect(details).not.toHaveAttribute('open', '');
  await details.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  await expect(details.getByRole('listitem')).toHaveText([...roles[0].bullets]);
  await page.keyboard.press('Enter');
  for (const [index, id] of ['campus-operations', 'project-coordination'].entries()) {
    await expect(page.locator(`#${id}`).getByRole('listitem')).toHaveText([...roles[index + 1].bullets]);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const path = `docs/qa/refinement/content/${info.project.name}`;
  mkdirSync(path, { recursive: true });
  await visual.screenshot({ path: `${path}/placement.png` });
});

test('resume retains a usable PDF and contact actions', async ({ page, request }, info) => {
  await page.goto('/resume');
  await worldReady(page, 'resume');
  const downloadLink = page.getByRole('link', { name: 'Download PDF', exact: true });
  await expect(downloadLink).toHaveAttribute('href', DIRECT.resume);
  const [download] = await Promise.all([page.waitForEvent('download'), downloadLink.click()]);
  expect(download.suggestedFilename()).toBe('Mohamad_Awad_Resume.pdf');
  expect(await download.failure()).toBeNull();
  const pdf = await request.get(DIRECT.resume);
  expect(pdf.status()).toBe(200);
  expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');
  await expect(page.getByRole('link', { name: /View PDF/ })).toHaveAttribute('target', '_blank');
  for (const role of roles) await expect(page.getByRole('heading', { name: role.title, exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const path = `docs/qa/refinement/content/${info.project.name}`;
  mkdirSync(path, { recursive: true });
  await page.locator('main .portfolio-page').screenshot({ path: `${path}/resume.png` });
  await page.getByRole('navigation', { name: 'More about my work' }).getByRole('link', { name: 'Get in touch' }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole('link', { name: 'Write an email' })).toHaveAttribute('href', DIRECT.email);
  await expect(page.getByRole('link', { name: /GitHub.*awadmohamed/ })).toHaveAttribute('href', DIRECT.github);
  await expect(page.getByRole('link', { name: /LinkedIn.*Mohamad Awad/ })).toHaveAttribute('href', DIRECT.linkedin);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('main .portfolio-page').screenshot({ path: `${path}/contact.png` });
});

test('copy email reports success and a denied clipboard gives a usable fallback', async ({ page }) => {
  await page.goto('/contact');
  await worldReady(page, 'contact');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { document.documentElement.dataset.copiedEmail = text; } } });
  });
  await page.getByRole('button', { name: 'Copy email', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-copied-email', DIRECT.email.replace('mailto:', ''));
  await expect(page.locator('main .portfolio-page').getByRole('status')).toContainText('Email address copied');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new DOMException('Denied', 'NotAllowedError'); } } });
  });
  await page.getByRole('button', { name: 'Email copied', exact: true }).click();
  await expect(page.locator('main .portfolio-page').getByRole('status')).toContainText('Couldn’t copy automatically');
  await expect(page.getByRole('link', { name: 'Write an email' })).toHaveAttribute('href', DIRECT.email);
  await expect(page.getByRole('button', { name: 'Copy email', exact: true })).toBeVisible();
});
