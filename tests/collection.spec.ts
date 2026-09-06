import { test, expect } from '@playwright/test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ProjectTeaser } from '../content/types';
import { sourceLoader } from './source-loader';
import { assertWidth, attachJson } from './helpers';

test('20-entry collection fixture remains complete and within viewport', async ({ page }, testInfo) => {
  const loader = sourceLoader();
  const Component = loader.load('components/portfolio/ProjectsContent.tsx').ProjectsContent as React.ComponentType<{ projects: readonly ProjectTeaser[] }>;
  const entries: (ProjectTeaser & { featured?: boolean })[] = Array.from({ length: 20 }, (_, index) => ({
    title: `QA fixture ${String(index + 1).padStart(2, '0')} — not a published project`,
    context: 'Synthetic test data only',
    blurb: 'Collection scalability fixture. This entry exists only in the QA browser and must never be published as real work.',
    chips: ['Test fixture', 'A longer label to test wrapping'],
    href: `/projects/qa-fixture-${index + 1}`,
    featured: index < 2,
  }));
  await page.goto('/projects');
  const styles = await page.locator('head link[rel="stylesheet"], head style').evaluateAll(nodes => nodes.map(node => node.outerHTML).join('\n'));
  const markup = renderToStaticMarkup(React.createElement(Component, { projects: entries }));
  await page.setContent(`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles}<style>${loader.css.join('\n')}</style></head><body data-mode="content"><main>${markup}</main></body></html>`);
  const collection = page.getByRole('region', { name: 'Project collection', exact: true });
  for (const entry of entries) await expect(collection.getByRole('heading', { name: entry.title, exact: true })).toHaveCount(1);
  await expect(collection.getByRole('heading')).toHaveCount(entries.length);
  await expect(page.getByRole('region', { name: 'Featured work' })).toHaveCount(0);
  await assertWidth(page, testInfo);
  await page.getByRole('heading', { name: entries[19].title, exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: entries[19].title, exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('collection-20-bottom.png') });
  await attachJson(testInfo, 'fixture-scope', { count: 20, actualInnerWidth: await page.evaluate(() => innerWidth), source: 'Actual ProjectsContent source, server rendered in test browser', substitutions: ['Next Link → anchor', 'Next Image → img', 'CSS module names → original local names'], limitation: 'Does not prove hydration/filter interactions; published pages receive no fixture data.' });
});
