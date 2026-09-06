import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { assertGpuLease } from './gpu-lease.mjs';

if (process.env.QA_VISUAL !== '1') throw new Error('Requires assigned independent World/visual GPU slot.');
const output = process.env.QA_CAPTURE_OUTPUT || 'docs/qa/world-evidence';
const firstSlice = process.env.QA_CAPTURE_SCOPE === 'first-slice';
const viewport = { width: Number(process.env.QA_CAPTURE_WIDTH || 2560), height: Number(process.env.QA_CAPTURE_HEIGHT || 1440) };
const reviewReverse = process.env.QA_CAPTURE_REVERSE === '1';
await mkdir(output, { recursive: true });
const lease = await assertGpuLease();
await writeFile(`${output}/gpu-lease-before.json`, JSON.stringify(lease, null, 2));
const browser = await chromium.launch({ channel: 'msedge', headless: false });
const context = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: viewport.width === 390 });
const page = await context.newPage();
const frames = [];
const consoleEvents = [];
page.on('console', message => { if (['warning', 'error'].includes(message.type())) consoleEvents.push({ type: message.type(), text: message.text() }); });
page.on('pageerror', error => consoleEvents.push({ type: 'exception', text: error.message }));
async function metrics() {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Metrics unavailable')), 2000);
    window.addEventListener('portfolio:world-metrics', event => { clearTimeout(timeout); resolve(event.detail); }, { once: true });
    window.dispatchEvent(new Event('portfolio:metrics-request'));
  }));
}
async function settled(destination) {
  await expect(page.locator('[data-world-status]')).toHaveAttribute('data-world-status', 'ready', { timeout: 15_000 });
  await expect(page.locator('[data-world-status]')).toHaveAttribute('data-world-destination', destination);
  await expect(page.locator('[data-world-status]')).toHaveAttribute('data-world-flying', 'false');
}
async function capture(label) {
  const dimensions = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const box = canvas.getBoundingClientRect();
    const gl = canvas.getContext('webgl2');
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    return { width: innerWidth, height: innerHeight, dpr: devicePixelRatio, canvasCss: { width: box.width, height: box.height }, canvasAttributes: { width: canvas.width, height: canvas.height }, drawingBuffer: { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight }, renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : 'unavailable', vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : 'unavailable', glError: gl.getError(), scrollY };
  });
  const png = await page.screenshot({ path: `${output}/${label}.png`, scale: 'css' });
  const pngDimensions = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
  expect(pngDimensions).toEqual(viewport);
  expect({ width: dimensions.width, height: dimensions.height }).toEqual(viewport);
  expect(dimensions.dpr).toBe(1);
  expect(dimensions.drawingBuffer.width).toBeGreaterThanOrEqual(Math.floor(dimensions.canvasCss.width));
  expect(dimensions.drawingBuffer.height).toBeGreaterThanOrEqual(Math.floor(dimensions.canvasCss.height));
  frames.push({ label, dimensions, pngDimensions, world: await metrics(), browser: browser.version() });
}
try {
  const response = await page.goto(process.env.QA_BASE_URL || 'http://127.0.0.1:5190');
  if (process.env.QA_EXPECTED_BUILD) expect(await response.text()).toContain(process.env.QA_EXPECTED_BUILD);
  await settled('home');
  await page.evaluate(() => {
    window.qaRenderSamples = [];
    window.qaRenderSampler = setInterval(() => {
      window.addEventListener('portfolio:world-metrics', event => {
        const m = event.detail;
        window.qaRenderSamples.push({ at: performance.now(), calls: m.calls, triangles: m.triangles, geometries: m.geometries, textures: m.textures, destination: m.destination, mode: m.mode, progress: m.pathProgress });
      }, { once: true });
      window.dispatchEvent(new Event('portfolio:metrics-request'));
    }, 100);
  });
  await capture('01-toronto');
  for (const [index, fraction] of (firstSlice ? [['independent-a', .045], ['independent-b', .11], [2, .18]] : [[2, .18], [3, .4], [4, .68], [5, 1]])) {
    await page.evaluate(progress => window.scrollTo({ top: progress * (document.documentElement.scrollHeight - innerHeight), behavior: 'smooth' }), fraction);
    await expect.poll(async () => Math.abs((await metrics()).pathProgress - fraction)).toBeLessThan(.002);
    await settled('home');
    await capture(`${String(index).padStart(2, '0')}-ascent-${fraction}`);
  }
  for (const destination of (firstSlice ? [] : ['projects', 'experience'])) {
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: destination === 'projects' ? 'Projects' : 'Experience', exact: true }).click();
    await settled(destination);
    await capture(`06-${destination}`);
  }
  if (firstSlice && reviewReverse) {
    for (const fraction of [.11, .045, 0]) {
      await page.evaluate(progress => window.scrollTo({ top: progress * (document.documentElement.scrollHeight - innerHeight), behavior: 'smooth' }), fraction);
      await expect.poll(async () => Math.abs((await metrics()).pathProgress - fraction)).toBeLessThan(.002);
      await settled('home');
      await capture(`reverse-opening-${fraction}`);
    }
  }
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'About', exact: true }).click();
  await page.getByRole('button', { name: 'Step into the room' }).click();
  await settled('about');
  await capture('07-room');
  for (const device of ['monitor', 'phone']) {
    await page.getByRole('button', { name: `Open ${device}`, exact: true }).click();
    await expect(page.locator('[data-device-scroll]')).toBeVisible();
    await settled('about');
    await capture(`08-${device}`);
    await page.getByRole('button', { name: /Exit device/ }).click();
    await settled('about');
  }
  if (firstSlice && reviewReverse) {
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    await page.mouse.wheel(0, -50);
    await expect.poll(async () => (await metrics()).pathProgress).toBeLessThan(.999);
    await settled('about');
    await capture('09-corner-reverse-intermediate');
    await page.mouse.wheel(0, 50);
    await expect.poll(async () => (await metrics()).pathProgress).toBeGreaterThan(.999);
    await settled('about');
    await capture('09-corner-return');
  }
  if (!firstSlice) {
    await page.getByRole('button', { name: 'Travel back out of the room' }).click();
    await expect.poll(async () => (await metrics()).pathProgress).toBeLessThan(.81);
    await settled('about');
    await capture('09-house-reverse');
    await page.getByRole('button', { name: 'Travel back out of the room' }).click();
    await expect.poll(async () => (await metrics()).pathProgress).toBeLessThan(.61);
    await settled('about');
    await capture('10-neighbourhood-reverse');
  }
} finally {
  const renderSamples = await page.evaluate(() => { clearInterval(window.qaRenderSampler); return window.qaRenderSamples ?? []; }).catch(() => []);
  await writeFile(`${output}/metadata.json`, JSON.stringify({ frames, consoleEvents, renderSamples, firstSlice, viewport, reviewReverse, scope: 'Actual headed connected-world travel and ordinary HTML device views at asserted CSS viewport and native PNG size, no resize/upscale or video. First-slice mode limits review to Toronto opening/near intermediates and room corner/devices; optional reverse includes opening travel and a small room-corner reverse/return. Complete neighbourhood/full bedroom and global transition audit remain pending. Width390 uses touch-enabled desktop Edge CSS emulation, not a physical phone. Render counters sampled every100ms; timing is not performance evidence because screenshots are present.' }, null, 2));
  await context.close();
  await browser.close();
}
console.log(JSON.stringify({ frames: frames.length, consoleEvents, output }, null, 2));
