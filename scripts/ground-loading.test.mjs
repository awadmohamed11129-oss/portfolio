import assert from 'node:assert/strict';
import * as THREE from 'three';
import { loadTypeScript } from './test-load-ts.mjs';
import { FakeElement, flush } from './stage-test-fixture.mjs';

// Actual GroundStage/Three geometry and tile lifecycle. Only WebGL submission,
// image decode, and fetch are replaced so slow-network concurrency is deterministic.
class Renderer {
  capabilities = { getMaxAnisotropy: () => 4 };
  setClearColor() {} setSize() {} initTexture() {} render() {} dispose() {} forceContextLoss() {}
}
const active = new Map();
const maximum = new Map();
const requests = [];
function fetchTile(url, options = {}) {
  const count = (active.get(url) ?? 0) + 1;
  active.set(url, count); maximum.set(url, Math.max(maximum.get(url) ?? 0, count));
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = () => { if (settled) return false; settled = true; active.set(url, active.get(url) - 1); return true; };
    const request = { url, resolve() { if (finish()) resolve({ status: 200, ok: true, headers: { get: () => 'image/webp' }, blob: async () => ({}) }); } };
    requests.push(request);
    options.signal?.addEventListener('abort', () => { if (finish()) reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
  });
}
const nodes = new Map();
const get = id => { if (!nodes.has(id)) nodes.set(id, Object.assign(new FakeElement(), { replaceChildren() {} })); return nodes.get(id); };
let now = 0, frame;
const globals = { window: Object.assign(new FakeElement(), { innerWidth: 1440, innerHeight: 900, devicePixelRatio: 1 }),
  document: Object.assign(new FakeElement(), { hidden: false, body: get('body'), documentElement: get('html'), getElementById: get, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ getContext: () => null }) }),
  AbortController, DOMException, URLSearchParams, location: { pathname: '/projects', search: '', hash: '' }, matchMedia: () => Object.assign(new FakeElement(), { matches: false }),
  fetch: fetchTile, createImageBitmap: async () => ({ close() {} }), setTimeout: (fn, ms) => ms >= 6000 ? 0 : setTimeout(fn, ms), clearTimeout,
  performance: { now: () => now }, requestAnimationFrame(fn) { frame = fn; return 1; }, cancelAnimationFrame() {} };
const { GroundStage } = loadTypeScript('lib/journey/hero/ground.ts', { three: { ...THREE, WebGLRenderer: Renderer } }, globals);
const stages = [];
class CapturedGround extends GroundStage { constructor(...args) { super(...args); stages.push(this); } }
class GlobeStage { orientSky() {} whenReady() { return Promise.resolve(); } isReady() { return true; } render() {} dispose() {} setBody() {} setComposition() {} }
const transform = (filename, source) => {
  if (process.env.QA_GROUND_MUTATION === '1' && filename.replaceAll('\\', '/').endsWith('/hero/world.ts')) {
    const marker = 'target.altitude = altitudeForProgress(filmProgress, endAltitude);';
    assert.ok(source.includes(marker), 'Mutation must target the real scrub altitude assignment');
    // Reinstate the exact obsolete per-scrub warm behavior in memory only.
    return source.replace(marker, `${marker}\n      if (target.altitude < GROUND_FADE_END_KM) ground?.warm(target.altitude);`);
  }
  return source;
};
const { createHeroWorld } = loadTypeScript('lib/journey/hero/world.ts', { three: { ...THREE, WebGLRenderer: Renderer }, './ground': { GroundStage: CapturedGround }, './globe': { GlobeStage }, './plates': { createPlates: async () => ({ variant: 'a', update() {} }) } }, globals, new Map(), transform);
const { progressForAltitude } = loadTypeScript('lib/journey/prototype/camera.ts');
const world = await createHeroWorld({ host: get('hero'), ground: get('ground'), space: get('space'), prototype: { camera: 'earth-drag' } });
const ground = stages[0];
world.prototype.snap('home', { lat: 43.7969339, lon: -79.2237139, altitude: .35 });
world.start();
const tick = () => { now += 1000 / 240; frame(now); };

try {
  // Establish a ready rendered layer. A damped camera can still be here while
  // its film target has already advanced to a much coarser tile scale.
  tick();
  for (const request of [...requests]) request.resolve();
  await flush();
  for (let index = 0; index < 30; index++) tick();
  assert.ok(ground.readiness() >= .9, 'Fixture must begin with drawable active imagery');
  const before = requests.length;
  for (let index = 0; index < 30; index++) {
    // The production film calls scrub every frame. The real damped camera and
    // GroundStage then decide what to load; the test does not call warm itself.
    world.prototype.scrub(progressForAltitude(1.5 + index * .003, world.prototype.snapshot().endAltitudeKm));
    tick();
  }
  const duplicates = [...maximum].filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1]);
  console.log(JSON.stringify({ requests: requests.length, newRequests: requests.length - before, uniqueUrls: new Set(requests.map(request => request.url)).size, maxConcurrentForOneUrl: Math.max(...maximum.values()), duplicateExamples: duplicates.slice(0, 3) }));
  assert.equal(duplicates.length, 0, 'A warmed layer being retired must not issue another fetch while the same tile URL is still pending');
  console.log('PASS slow film scrubbing does not duplicate pending ground tile requests');
} finally { world.dispose(); }
