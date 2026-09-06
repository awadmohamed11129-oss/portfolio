import { chromium, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { assertGpuLease } from './gpu-lease.mjs';

if (process.env.QA_WIRE !== '1') throw new Error('Requires explicit exclusive QA GPU grant.');
const output = process.env.QA_WIRE_OUTPUT || 'docs/qa/realism-runs/first-slice-v2/wire';
await mkdir(output, { recursive: true });
const expectedBuild = (await readFile(`${process.env.QA_SOURCE_ROOT}/.next/BUILD_ID`, 'utf8')).trim();
if (process.env.QA_EXPECTED_BUILD) expect(expectedBuild).toBe(process.env.QA_EXPECTED_BUILD);
const lease = await assertGpuLease();
await writeFile(`${output}/gpu-lease-before.json`, JSON.stringify(lease, null, 2));
const browser = await chromium.launch({ channel: 'msedge', headless: false });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
const requests = new Map(), errors = [], warnings = [], stages = [];
let phase = 'initial', lastEvent = Date.now(), failure = null;
const header = (headers, key) => Object.entries(headers || {}).find(([name]) => name.toLowerCase() === key)?.[1] ?? null;
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 100, downloadThroughput: 1_250_000, uploadThroughput: 1_250_000 });
cdp.on('Network.requestWillBeSent', event => {
  if (!/^https?:/.test(event.request.url)) return;
  lastEvent = Date.now();
  requests.set(event.requestId, { id: event.requestId, url: event.request.url, phase, method: event.request.method, bytes: null, complete: false });
});
cdp.on('Network.responseReceived', event => {
  const request = requests.get(event.requestId); if (!request) return;
  const response = event.response;
  Object.assign(request, { status: response.status, mimeType: response.mimeType, contentEncoding: header(response.headers, 'content-encoding'), contentLength: header(response.headers, 'content-length'), fromDiskCache: !!response.fromDiskCache, fromServiceWorker: !!response.fromServiceWorker });
});
cdp.on('Network.responseReceivedExtraInfo', event => {
  const request = requests.get(event.requestId); if (!request) return;
  request.wireHeaders = { contentEncoding: header(event.headers, 'content-encoding'), contentLength: header(event.headers, 'content-length') };
});
cdp.on('Network.loadingFinished', event => {
  const request = requests.get(event.requestId); if (!request) return;
  Object.assign(request, { bytes: event.encodedDataLength, complete: true }); lastEvent = Date.now();
});
cdp.on('Network.loadingFailed', event => {
  const request = requests.get(event.requestId); if (!request) return;
  Object.assign(request, { error: event.errorText, cancelled: event.canceled, complete: true }); lastEvent = Date.now();
});
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (['warning', 'error'].includes(message.type())) warnings.push({ type: message.type(), text: message.text() }); });
async function metrics() {
  return page.evaluate(() => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Metrics unavailable')), 2000);
    window.addEventListener('portfolio:world-metrics', event => { clearTimeout(timer); resolve(event.detail); }, { once: true });
    window.dispatchEvent(new Event('portfolio:metrics-request'));
  }));
}
async function settled(destination) {
  await expect(page.locator('[data-world-status]')).toHaveAttribute('data-world-status', 'ready', { timeout: 60000 });
  await expect(page.locator('[data-world-status]')).toHaveAttribute('data-world-destination', destination, { timeout: 60000 });
  await expect(page.locator('[data-world-status]')).toHaveAttribute('data-world-flying', 'false', { timeout: 15000 });
}
async function quiet() {
  await expect.poll(() => [...requests.values()].filter(request => !request.complete).length, { timeout: 60000 }).toBe(0);
  await expect.poll(() => Date.now() - lastEvent, { timeout: 60000 }).toBeGreaterThan(1000);
}
function summarize(stage) {
  const records = [...requests.values()].filter(request => request.phase === stage);
  return { stage, bytes: records.reduce((sum, request) => sum + (request.bytes || 0), 0), requests: records.length, incomplete: records.filter(request => !request.complete).length, failures: records.filter(request => request.error), capBytes: 10_000_000 };
}
async function dimensions() {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas'), gl = canvas.getContext('webgl2'), debug = gl.getExtension('WEBGL_debug_renderer_info');
    const box = canvas.getBoundingClientRect();
    return { width: innerWidth, height: innerHeight, dpr: devicePixelRatio, visibility: document.visibilityState,
      renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null, glError: gl.getError(),
      canvasCss: { width: box.width, height: box.height }, drawingBuffer: { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight } };
  });
}
const captures = [];
async function capture(label) {
  const size = await dimensions(); expect(size.width).toBe(2560); expect(size.height).toBe(1440);
  expect(size.dpr).toBe(1); expect(size.canvasCss).toEqual(size.drawingBuffer);
  const png = await page.screenshot({ path: `${output}/${label}.png`, scale: 'css' });
  expect({ width: png.readUInt32BE(16), height: png.readUInt32BE(20) }).toEqual({ width:2560, height:1440 });
  captures.push({ label, dimensions: size, world: await metrics() });
}
let hardware, initialMetrics, aboutMetrics;
try {
  const response = await page.goto(process.env.QA_BASE_URL || 'http://127.0.0.1:5190');
  const html = await response.text();
  expect(html, 'Served document must include the frozen build identity').toContain(expectedBuild);
  await settled('home'); await quiet();
  hardware = await dimensions(); expect(hardware.width).toBe(1440); expect(hardware.height).toBe(900);
  expect(hardware.renderer).toMatch(/Radeon\s+RX\s*9070\s*XT\b/i); expect(hardware.visibility).toBe('visible');
  initialMetrics = await metrics(); stages.push(summarize('initial')); console.log(JSON.stringify(stages.at(-1)));
  phase = 'about';
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'About', exact: true }).click();
  await page.getByRole('button', { name: 'Step into the room' }).click();
  await settled('about'); await quiet();
  aboutMetrics = await metrics(); stages.push(summarize('about')); console.log(JSON.stringify(stages.at(-1)));
  // Wire acquisition is finished before supplemental native reverse captures.
  phase = 'supplemental-motion';
  await page.setViewportSize({ width: 2560, height: 1440 }); await settled('about');
  await page.mouse.move(1280, 720); await page.mouse.wheel(0, -50);
  await expect.poll(async () => (await metrics()).pathProgress).toBeLessThan(.999); await settled('about');
  await capture('desktop-corner-reverse');
  await page.mouse.wheel(0, 50); await expect.poll(async () => (await metrics()).pathProgress).toBeGreaterThan(.999); await settled('about');
  await capture('desktop-corner-return');
  await page.getByRole('link', { name: 'Mohamad Awad, home', exact: true }).click(); await settled('home');
  for (const progress of [.18, .11, .045, 0]) {
    await page.evaluate(fraction => window.scrollTo({ top: fraction * (document.documentElement.scrollHeight - innerHeight), behavior: 'smooth' }), progress);
    await expect.poll(async () => Math.abs((await metrics()).pathProgress - progress)).toBeLessThan(.002); await settled('home');
    await capture(`desktop-opening-reverse-${progress}`);
  }
} catch (error) { failure = { message: error.message, stack: error.stack }; throw error; }
finally {
  const downloads = [...requests.values()];
  await writeFile(`${output}/receipt.json`, JSON.stringify({ recordedAt: new Date().toISOString(), build: expectedBuild, hardware, browser: browser.version(), stages, downloads, initialMetrics, aboutMetrics, captures, errors, warnings, failure,
    method: 'Cold new Edge context, cache disabled, CDP10Mbps/100ms. Each HTTP(S) request belongs to its initiation phase; loadingFinished.encodedDataLength measures transferred bytes including response overhead. Response and extra-info Content-Encoding preserved; blob/data URLs excluded. Initial phase waits ready plus network quiet before About. Supplemental2560 native reverse captures begin after both wire phases. No full performance benchmark; world PMREM driver submission timings are retained explicitly.' }, null, 2));
  await context.close(); await browser.close();
}
