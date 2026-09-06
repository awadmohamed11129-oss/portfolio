import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

if (process.env.QA_PAGE_CAPTURE !== '1') throw new Error('Requires explicitly assigned page/content GPU slot.');
const output = 'docs/qa/page-evidence';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.QA_BROWSER_CHANNEL || 'msedge', headless: false });
const evidence = [];
try {
  for (const [width, height] of [[390, 844], [768, 1024], [1440, 900], [2560, 1440]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: width === 390 });
    const page = await context.newPage();
    for (const [route, label] of [['/projects', 'projects'], ['/projects/pavescan-ai', 'pavescan']]) {
      await page.goto(`${process.env.QA_BASE_URL || 'http://127.0.0.1:5190'}${route}`);
      await expect(page.locator('main h1')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const img = page.locator('main img[alt*="September 2026 automated demo report"]').first();
      await expect.poll(() => img.evaluate(node => node.complete && node.naturalWidth > 0)).toBe(true);
      await page.screenshot({ path: `${output}/${label}-${width}-top.png`, scale: 'css' });
      await img.scrollIntoViewIfNeeded();
      const image = await img.evaluate(node => {
        const bounds = node.getBoundingClientRect();
        return { currentSrc: node.currentSrc, naturalWidth: node.naturalWidth, naturalHeight: node.naturalHeight, renderedWidth: bounds.width, renderedHeight: bounds.height, caption: node.parentElement.querySelector('figcaption')?.textContent };
      });
      const dimensions = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        const bounds = canvas?.getBoundingClientRect();
        const gl = canvas?.getContext('webgl2');
        return { innerWidth, innerHeight, dpr: devicePixelRatio, userAgent: navigator.userAgent, canvasCss: bounds ? { width: bounds.width, height: bounds.height } : null, canvasAttributes: canvas ? { width: canvas.width, height: canvas.height } : null, drawingBuffer: gl ? { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight } : null };
      });
      const png = await page.screenshot({ path: `${output}/${label}-${width}-report.png`, scale: 'css' });
      const pngDimensions = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
      expect(dimensions.innerWidth).toBe(width);
      expect(dimensions.innerHeight).toBe(height);
      expect(dimensions.dpr).toBe(1);
      expect(pngDimensions).toEqual({ width, height });
      expect(decodeURIComponent(image.currentSrc)).toContain('report-summary-september-2026.png');
      expect(image.caption).toContain('Unreviewed model findings');
      evidence.push({ route, dimensions, pngDimensions, image, browser: browser.version(), scope: 'Native page/content screenshot only. Known GL sampler issue remains open; these frames do not award world/premium acceptance.' });
    }
    await context.close();
  }
} finally {
  await writeFile(`${output}/metadata.json`, JSON.stringify(evidence, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ pageCaptures: evidence.length, screenshots: evidence.length * 2, output }, null, 2));
