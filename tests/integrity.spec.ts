import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { sourceLoader, sourceRoot } from './source-loader';
import { routes, attachJson } from './helpers';

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'desktop-1440' && !testInfo.title.startsWith('current report excerpt'), 'Non-visual integrity checks run once; responsive images run at every width.'));

test('security headers and SEO remain on every public route', async ({ request }) => {
  for (const [route] of routes) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
    const headers = response.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toContain('camera=()');
    const html = await response.text();
    expect(html).toMatch(/<html[^>]+lang="en"/);
    expect(html).toMatch(/<title>[^<]+<\/title>/);
    expect(html).toMatch(/name="description" content="[^"]{30,}"/);
    expect(html).toContain('property="og:title"');
  }
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  for (const [route] of routes.slice(1)) expect(await sitemap.text()).toContain(route);
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap:');
  expect((await request.get('/go/not-a-tracked-link')).status()).toBe(404);
  expect((await request.get('/missing-qa-route')).status()).toBe(404);
});

test('all local links and image resources resolve; external tabs are isolated', async ({ page, request }, testInfo) => {
  const urls = new Set<string>();
  for (const [route] of routes) {
    await page.goto(route);
    const links = await page.locator('a[href]').evaluateAll(nodes => nodes.map(node => ({ href: node.getAttribute('href')!, target: node.getAttribute('target'), rel: node.getAttribute('rel') })));
    for (const link of links) {
      if (link.target === '_blank') expect(link.rel, link.href).toMatch(/noopener/);
      if (link.href.startsWith('/') && !link.href.startsWith('//')) urls.add(link.href.split('#')[0]);
    }
    for (const src of await page.locator('main img').evaluateAll(nodes => nodes.map(node => (node as HTMLImageElement).currentSrc))) if (src) urls.add(src);
  }
  const results = [];
  for (const url of urls) {
    const response = await request.get(url);
    results.push({ url, status: response.status(), contentType: response.headers()['content-type'] });
    expect(response.status(), url).toBe(200);
    if (url.endsWith('.pdf')) expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
  }
  await attachJson(testInfo, 'local-link-responses', results);
});

test('tracked links redirect to the allowlisted destination and keep no-JS continuation', async ({ browser, baseURL, request }, testInfo) => {
  const links = sourceLoader().load('content/links.ts').TRACKED as Record<string, { href: string; label: string }>;
  const results = [];
  for (const [slug, link] of Object.entries(links)) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const destination = new URL(link.href, baseURL).href;
    await page.route(destination, route => route.fulfill({ contentType: 'text/html', body: '<title>QA intercepted destination</title><p>Redirect destination reached.</p>' }));
    await page.goto(`${baseURL}/go/${slug}`);
    await expect(page).toHaveURL(destination);
    results.push({ slug, destination, automaticRedirect: true });
    await context.close();
    const raw = await request.get(`/go/${slug}`);
    expect(await raw.text()).toContain('Continue without waiting');
    expect(await raw.text()).toMatch(/name="robots" content="noindex, nofollow"/);
  }
  await attachJson(testInfo, 'tracking-route-checks', { results, note: 'Destinations intercepted after navigation to avoid analytics/external app effects; this verifies routing, not external service availability.' });
});

test('analytics opt-out survives reload and can be reversed', async ({ page }) => {
  await page.goto('/me');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await page.getByRole('button', { name: 'Stop counting my visits' }).click();
  await expect(page.getByText('excluded — visits are not counted')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('va-disable'))).toBe('1');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Count my visits again' })).toBeVisible();
  await page.getByRole('button', { name: 'Count my visits again' }).click();
  expect(await page.evaluate(() => localStorage.getItem('va-disable'))).toBeNull();
});

test('PaveScan public figures retain the export scope and uncertainty', async ({ page }) => {
  await page.goto('/projects/pavescan-ai');
  const body = await page.locator('main').innerText();
  for (const value of ['3.571', '385', '275', '377', '55', '38', '85']) expect(body).toContain(value);
  expect(body).toMatch(/not a count of confirmed|not.*distinct.*defects|not.*confirmed.*defects/i);
  expect(body).toMatch(/historical|August 2026/i);
  expect(body).toMatch(/may lag|can.*sign.in|require.*sign.in/i);
  expect(body).toMatch(/limitation|cannot establish|uncertaint/i);
});

test('current report excerpt is served with its unreviewed-output caption', async ({ page }, testInfo) => {
  const images = [];
  // Phase1 deliberately removes report screenshots from the Projects gallery;
  // the original remains a small, captioned case evidence thumbnail.
  for (const route of ['/projects/pavescan-ai']) {
    await page.goto(route);
    const img = page.locator('main img[alt*="September 2026 automated demo report"]').first();
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0)).toBe(true);
    const evidence = await img.evaluate(node => {
      const image = node as HTMLImageElement;
      const bounds = image.getBoundingClientRect();
      return { currentSrc: image.currentSrc, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, renderedWidth: bounds.width, renderedHeight: bounds.height, dpr: devicePixelRatio, viewport: innerWidth };
    });
    expect(decodeURIComponent(evidence.currentSrc)).toContain('/images/pavescan/report-summary-september-2026.png');
    await expect(img.locator('xpath=ancestor::figure[1]').locator(':scope > figcaption')).toContainText(/Unreviewed model findings and condition estimates require field review/);
    expect(evidence.naturalWidth, 'The source selected for the visible image must not be enlarged').toBeGreaterThanOrEqual(Math.floor(evidence.renderedWidth));
    images.push({ route, ...evidence });
  }
  await attachJson(testInfo, 'report-excerpt-current-src', images);
});

test('source scan finds no credential literals or newly exposed executable sinks', async ({}, testInfo) => {
  const findings: { file: string; rule: string; line: number }[] = [];
  const patterns = [
    ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
    ['cloud-access-key', /\bAKIA[0-9A-Z]{16}\b/],
    ['github-token', /\b(?:ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
    ['api-secret-literal', /(?:api[_-]?key|client[_-]?secret|access[_-]?token)\s*[:=]\s*["'][A-Za-z0-9_\-/]{24,}["']/i],
    ['executable-html-sink', /dangerouslySetInnerHTML|\beval\s*\(|new Function\s*\(/],
  ] as const;
  function walk(dir: string) {
    for (const item of readdirSync(dir)) {
      const file = path.join(dir, item);
      if (statSync(file).isDirectory()) walk(file);
      else if (/\.(tsx?|jsx?|json|svg|html|css|mjs)$/i.test(file)) {
        const lines = readFileSync(file, 'utf8').split('\n');
        lines.forEach((line, index) => patterns.forEach(([rule, pattern]) => {
          if (pattern.test(line)) findings.push({ file: path.relative(sourceRoot, file), rule, line: index + 1 });
        }));
      }
    }
  }
  for (const dir of ['app', 'components', 'content', 'lib', 'public']) walk(path.join(sourceRoot, dir));
  await attachJson(testInfo, 'source-scan', { findings, note: 'Heuristic scan of runtime text/source assets only. Reports locations/rules, never matched credential text. Binary files and unknown credential formats require separate review.' });
  expect(findings).toEqual([]);
});
