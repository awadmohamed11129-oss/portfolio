import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';
import sharp from 'sharp';

// Coordinator only: this script launches one headed browser. Never run alongside
// the performance test. It captures stills only, never records video.
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:5200';
const output = 'docs/qa/phase1';
const times = [0, 300, 600, 900, 1200, 1600, 2000, 2600, 3200, 4000, 5000, 6500];
const routes = ['/projects', '/projects/pavescan-ai', '/projects/civic-data-pipeline', '/projects/localflow', '/projects/pop-up-chapel'];
mkdirSync(`${output}/flight-frames`, { recursive: true });
const browser = await chromium.launch({ channel: process.env.QA_BROWSER_CHANNEL || 'msedge', headless: false });
const manifest = { at: new Date().toISOString(), base, screenshots: [], flight: [], method: 'Real-time flight; capture-request timestamps recorded alongside requested times. No synthetic seek, no video. Screenshot capture can add latency; timing acceptance comes from separate rAF test.', limitations: ['Physical iPhone and native OS reduced motion UNVERIFIED', 'Main must visually inspect all artifacts and compare reference sheet'] };
try {
  for (const [width, height] of [[390, 844], [768, 1024], [1440, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: width === 390, hasTouch: width === 390 });
    const page = await context.newPage();
    mkdirSync(`${output}/${width}`, { recursive: true });
    for (const route of routes) {
      await page.goto(base + route);
      await page.waitForFunction(() => window.__world?.snapshot().body === 'moon' && window.__world?.snapshot().globeReady);
      assert.equal(await page.evaluate(() => innerWidth), width);
      assert.equal(await page.locator('canvas').count(), 2);
      const path = `${output}/${width}/${route.slice(1).replaceAll('/', '-')}.png`;
      await page.screenshot({ path, fullPage: true });
      manifest.screenshots.push({ route, width, height, innerWidth: await page.evaluate(() => innerWidth), path, bytes: statSync(path).size });
    }
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(base + '/');
  await page.waitForFunction(() => window.__world?.snapshot().sceneAlive && window.roomProof?.state.progress >= 1, undefined, { timeout: 30000 });
  assert.equal(await page.evaluate(() => innerWidth), 1440);
  const started = await page.evaluate(() => {
    window.__qaCaptureEvents = [];
    document.addEventListener('stage:flight', event => window.__qaCaptureEvents.push({ at: performance.now(), detail: event.detail }));
    const now = performance.now();
    document.querySelector('nav[aria-label="Primary"] a[href="/projects"]').click();
    return now;
  });
  for (const target of times) {
    const delay = target - await page.evaluate(start => performance.now() - start, started);
    if (delay > 0) await page.waitForTimeout(delay);
    const state = await page.evaluate(start => {
      const header = document.querySelector('.site-header');
      const nav = header?.querySelector('nav');
      const css = header && getComputedStyle(header);
      const navCss = nav && getComputedStyle(nav);
      return { elapsed: performance.now() - start,
        header: css ? { opacity: css.opacity, visibility: css.visibility, display: css.display, bounds: header.getBoundingClientRect().toJSON() } : null,
        nav: navCss ? { opacity: navCss.opacity, visibility: navCss.visibility, display: navCss.display } : null };
    }, started);
    const actual = state.elapsed;
    const path = `${output}/flight-frames/${String(target).padStart(4, '0')}.png`;
    await page.screenshot({ path });
    manifest.flight.push({ targetMs: target, captureRequestedMs: actual, driftMs: actual - target, header: state.header, nav: state.nav, path, bytes: statSync(path).size });
  }
  manifest.events = await page.evaluate(() => window.__qaCaptureEvents);
  await context.close();
  const tiles = [];
  for (const [index, frame] of manifest.flight.entries()) {
    const thumbnail = await sharp(frame.path).resize(480, 300).toBuffer();
    const label = Buffer.from(`<svg width="480" height="28"><rect width="480" height="28" fill="#071321"/><text x="12" y="19" fill="white" font-family="Arial" font-size="14">${frame.targetMs} ms (capture ${Math.round(frame.captureRequestedMs)} ms)</text></svg>`);
    tiles.push({ input: thumbnail, left: index % 3 * 480, top: Math.floor(index / 3) * 328 });
    tiles.push({ input: label, left: index % 3 * 480, top: Math.floor(index / 3) * 328 + 300 });
  }
  await sharp({ create: { width: 1440, height: 1312, channels: 3, background: '#071321' } }).composite(tiles).jpeg({ quality: 92 }).toFile(`${output}/flight-projects.jpg`);
} finally {
  writeFileSync(`${output}/capture-manifest.json`, JSON.stringify(manifest, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ screenshots: manifest.screenshots.length, flightFrames: manifest.flight.length, sheet: `${output}/flight-projects.jpg`, manifest: `${output}/capture-manifest.json` }));
