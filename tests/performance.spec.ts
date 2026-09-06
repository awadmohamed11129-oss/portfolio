import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { attachJson, assertWidth } from './helpers';
import { independentFrames } from './metrics';
import { worldReady, snapshot, type StageWindow } from './destination-helpers';
type PerformanceWindow = StageWindow & { __qaPerformance?: { phase: string; events: unknown[]; snapshots: unknown[]; timer: number } };

// Main alone runs --headed in the exclusive GPU window. Visual capture is separate.
test.use({ trace: 'off', screenshot: 'off', video: 'off' });
test('P1-G7 cold initial, Moon flight and settled desktop budgets', async ({ page, context, browser }, info) => {
  test.skip(process.env.QA_PERFORMANCE !== '1', 'Requires coordinator QA_PERFORMANCE=1, --headed and quiet GPU.');
  test.skip(info.project.name !== 'desktop-1440', 'RX9070XT baseline is actual desktop1440.');
  test.setTimeout(100_000);
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.addInitScript(() => {
    const record = { intervals: [] as number[], active: true, previous: 0 };
    (window as unknown as { __qaStartup: typeof record }).__qaStartup = record;
    const tick = (now: number) => {
      if (!record.active) return;
      if (record.previous) record.intervals.push(now - record.previous);
      record.previous = now; requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const diagnostics = { phase: 'initial-cold', events: [] as unknown[], snapshots: [] as unknown[], timer: 0 };
    (window as PerformanceWindow).__qaPerformance = diagnostics;
    document.addEventListener('stage:flight', event => diagnostics.events.push({ at: performance.now(), detail: (event as CustomEvent).detail }));
    diagnostics.timer = window.setInterval(() => diagnostics.snapshots.push({ at: performance.now(), phase: diagnostics.phase, path: location.pathname, world: (window as StageWindow).__world?.snapshot() }), 500);
  });
  const cdp = await context.newCDPSession(page);
  let phase = 'initial-cold';
  const requests = new Map<string, { url: string; phase: string; startedAt: number }>();
  const inFlight = new Set<string>();
  const requestFailures: unknown[] = [];
  const responseMetadata: unknown[] = [];
  const downloads: { url: string; phase: string; bytes: number; finishedAt: number; durationMs: number | null }[] = [];
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 100, downloadThroughput: 1_250_000, uploadThroughput: 1_250_000 });
  cdp.on('Network.requestWillBeSent', event => { requests.set(event.requestId, { url: event.request.url, phase, startedAt: event.timestamp }); inFlight.add(event.requestId); });
  cdp.on('Network.loadingFinished', event => {
    inFlight.delete(event.requestId);
    const request = requests.get(event.requestId);
    downloads.push({ ...(request ?? { url: event.requestId, phase }), bytes: event.encodedDataLength, finishedAt: event.timestamp, durationMs: request ? (event.timestamp - request.startedAt) * 1000 : null });
  });
  cdp.on('Network.loadingFailed', event => { inFlight.delete(event.requestId); requestFailures.push({ ...requests.get(event.requestId), timestamp: event.timestamp, canceled: event.canceled, errorText: event.errorText, blockedReason: event.blockedReason }); });
  cdp.on('Network.responseReceived', event => responseMetadata.push({ ...requests.get(event.requestId), timestamp: event.timestamp, status: event.response.status, mimeType: event.response.mimeType, fromDiskCache: event.response.fromDiskCache, fromServiceWorker: event.response.fromServiceWorker, headers: event.response.headers }));
  let environment: { width: number; height: number; dpr: number; userAgent: string; visibility: string; renderer: string; vendor: string } | undefined;
  let startup: { intervals: number[]; p95: number; p99: number; maximum: number } | undefined;
  const samples: { phase: string; independent: Awaited<ReturnType<typeof independentFrames>>; world: Record<string, unknown> | undefined; before: unknown; after: unknown }[] = [];
  let failure: string | undefined;
  try {
  await page.goto('/');
  await worldReady(page, 'home');
  await assertWidth(page, info);
  environment = await page.evaluate(() => {
    const canvas = document.querySelector('#space-canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl2');
    const debug = gl?.getExtension('WEBGL_debug_renderer_info');
    return { width: innerWidth, height: innerHeight, dpr: devicePixelRatio, userAgent: navigator.userAgent, visibility: document.visibilityState,
      renderer: debug ? gl!.getParameter(debug.UNMASKED_RENDERER_WEBGL) as string : 'unavailable', vendor: debug ? gl!.getParameter(debug.UNMASKED_VENDOR_WEBGL) as string : 'unavailable' };
  });
  async function sample(name: string, duration: number, action?: () => Promise<unknown>) {
    phase = name;
    await page.evaluate(value => { const record = (window as PerformanceWindow).__qaPerformance; if (record) record.phase = value; }, name);
    const before = await snapshot(page);
    const measurement = independentFrames(page, duration);
    if (action) await action();
    samples.push({ phase: name, independent: await measurement, world: await page.evaluate(() => (window as StageWindow).__world?.performance()), before, after: await snapshot(page) });
  }
  await sample('initial-cold', 15000);
  await expect.poll(async () => (await snapshot(page))?.filmProgress).toBe(1);
  startup = await page.evaluate(() => {
    const record = (window as unknown as { __qaStartup: { active: boolean; intervals: number[] } }).__qaStartup;
    record.active = false;
    const sorted = [...record.intervals].sort((a, b) => a - b);
    const percentile = (q: number) => sorted[Math.max(0, Math.ceil(sorted.length * q) - 1)] || 0;
    return { intervals: record.intervals, p95: percentile(.95), p99: percentile(.99), maximum: sorted.at(-1) || 0 };
  });
  await sample('flight-to-moon', 6500, () => page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Projects', exact: true }).click());
  await worldReady(page, 'projects');
  expect((await snapshot(page))?.body).toBe('moon');
  expect((await snapshot(page))?.groundAsleep).toBe(true);
  await sample('moon-settled', 6500);
  const initialBytes = downloads.filter(item => item.phase === 'initial-cold').reduce((sum, item) => sum + item.bytes, 0);
  const moonBytes = downloads.filter(item => item.phase !== 'initial-cold').reduce((sum, item) => sum + item.bytes, 0);
  expect(environment.visibility).toBe('visible');
  expect(environment.userAgent).not.toMatch(/Headless/i);
  expect(environment.renderer, 'Missing renderer metadata is UNVERIFIED, never hardware PASS').toMatch(/Radeon\s+RX\s*9070\s*XT\b/i);
  expect.soft(initialBytes).toBeLessThanOrEqual(10_000_000);
  expect.soft(moonBytes).toBeLessThanOrEqual(10_000_000);
  expect.soft(startup.p95, 'Document-start cold p95').toBeLessThanOrEqual(20);
  expect.soft(startup.p99, 'Document-start cold p99').toBeLessThanOrEqual(34);
  for (const sample of samples) {
    expect.soft(sample.independent.intervals.length).toBeGreaterThan(100);
    expect.soft(sample.independent.p95, `${sample.phase} p95`).toBeLessThanOrEqual(20);
    expect.soft(sample.independent.p99, `${sample.phase} p99`).toBeLessThanOrEqual(34);
    if (typeof sample.world?.p95 === 'number') expect.soft(sample.world.p95, `${sample.phase} renderer p95`).toBeLessThanOrEqual(20);
    if (typeof sample.world?.p99 === 'number') expect.soft(sample.world.p99, `${sample.phase} renderer p99`).toBeLessThanOrEqual(34);
  }
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    const finalState = await snapshot(page).catch(error => ({ unavailable: String(error) }));
    const diagnostics = await page.evaluate(() => {
      const record = (window as PerformanceWindow).__qaPerformance;
      if (record) clearInterval(record.timer);
      return record;
    }).catch(error => ({ unavailable: String(error) }));
    const initialBytes = downloads.filter(item => item.phase === 'initial-cold').reduce((sum, item) => sum + item.bytes, 0);
    const moonBytes = downloads.filter(item => item.phase !== 'initial-cold').reduce((sum, item) => sum + item.bytes, 0);
    const report = { capturedAt: new Date().toISOString(), browser: browser.version(), failure, assertionErrors: info.errors.map(error => error.message), environment, finalState, diagnostics,
      initialBytes, moonBytes, downloads, responseMetadata, requestFailures, inFlightRequests: [...inFlight].map(id => ({ id, ...requests.get(id) })), pageErrors, consoleErrors, startup, samples,
      method: 'Cold context, cache disabled, CDP encodedDataLength including headers; request-start phase assignment; 10Mbps/100ms. Independent rAF per phase; production metrics cumulative.500ms world snapshots and lifecycle events identify pending loads/cancellation. Reports persist on assertions failing.',
      uncertainty: 'rAF is scheduling, not GPU completion. CPU timings are submission cost. Headed RX9070XT metadata required; coordinator separately attests quiet GPU. Physical phone/native OS reduced motion UNVERIFIED.' };
    mkdirSync('docs/qa/phase1', { recursive: true });
    const attempt = (process.env.QA_PERF_ATTEMPT || new Date().toISOString().replaceAll(/[:.]/g, '-')).replaceAll(/[^a-zA-Z0-9_-]/g, '-');
    writeFileSync(`docs/qa/phase1/performance-${attempt}.json`, JSON.stringify(report, null, 2));
    writeFileSync('docs/qa/phase1/performance.json', JSON.stringify(report, null, 2));
    await attachJson(info, 'phase1-performance', report);
  }
});
