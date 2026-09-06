import assert from 'node:assert/strict';
import { stageFixture, FakeElement, flush } from './stage-test-fixture.mjs';
import { loadTypeScript } from './test-load-ts.mjs';

let checks = 0;
async function check(name, run) { await run(); checks++; console.log(`PASS ${name}`); }
const fixture = options => stageFixture({ ...options, actualEarth: true });
function fallback(f) { assert.equal(f.state().ready, false); assert.equal(f.state().playing, false); assert.equal(f.state().progress, 0); assert.equal(f.get('#loading').hidden, false); }
await check('actual Earth adapter waits for renderer readiness', async () => { const f = fixture(); await flush(); assert.equal(f.state().ready, false); await f.load(); assert.equal(f.state().ready, true); assert.equal(f.starts(), 1); f.cleanup(); f.assertReleased(); });
await check('unready globe and rejected readiness cannot claim a live world', async () => {
  const f = fixture({ globeReady: false }); await f.load(); fallback(f); assert.equal(f.disposals(), 1); f.cleanup();
  const r = fixture(); await r.reject(); fallback(r); assert.equal(r.disposals(), 1); r.cleanup(); assert.equal(r.disposals(), 1);
});
await check('late scene failure crosses both production adapters', async () => { const f = fixture(); await f.load(); f.snapshot.sceneAlive = false; f.frame(500); fallback(f); assert.equal(f.disposals(), 1); f.cleanup(); });
for (const canvas of ['#space-canvas', '#ground-canvas']) await check(`${canvas} context loss is terminal and idempotent`, async () => { const f = fixture(); await f.load(); f.get(canvas).emit('webglcontextlost'); fallback(f); f.get(canvas).emit('webglcontextlost'); assert.equal(f.disposals(), 1); f.cleanup(); f.assertReleased(); });
await check('unmount during readiness ignores late world and removes every listener', async () => { const f = fixture(); f.cleanup(); await f.load(); assert.equal(f.state(), undefined); assert.equal(f.starts(), 0); assert.equal(f.disposals(), 1); f.assertReleased(); });
await check('Earth contact during intro cannot swallow the acceleration click', async () => { const f = fixture(); await f.load(); f.frame(7000); f.get('#hero-scene').emit('pointerdown', { button: 0, pointerType: 'mouse' }); assert.equal(f.state().playing, true); f.click(f.get('#hero-scene')); assert.equal(f.state().playbackRate, 2); f.cleanup(); });

// Actual camera + world code, stubbing only renderer and photographic tile I/O.
async function orbitFixture() {
  const nodes = new Map();
  const get = id => { if (!nodes.has(id)) nodes.set(id, Object.assign(new FakeElement(), { replaceChildren() {} })); return nodes.get(id); };
  const document = Object.assign(new FakeElement(), { hidden: false, body: get('body'), documentElement: get('html'), getElementById: get, querySelector: () => null, querySelectorAll: () => [] });
  const window = Object.assign(new FakeElement(), { innerWidth: 1440, innerHeight: 900, devicePixelRatio: 1 });
  const media = Object.assign(new FakeElement(), { matches: false });
  let now = 0, frame;
  class GroundStage { setCeiling() {} warm() {} wake() {} sleep() {} dispose() {} tidy() {} render() {} prepare() { return Promise.resolve(); } readiness() { return 1; } activeLayerZoom() { return 0; } pending() { return 0; } isAsleep() { return true; } }
  class GlobeStage { orientSky() {} whenReady() { return Promise.resolve(); } isReady() { return true; } render() {} dispose() {} setBody() {} setComposition() {} }
  const globals = { document, window, AbortController, DOMException, URLSearchParams, location: { search: '', hash: '' }, matchMedia: () => media,
    performance: { now: () => now }, requestAnimationFrame(fn) { frame = fn; return 1; }, cancelAnimationFrame() {}, setTimeout() {} };
  const { createHeroWorld } = loadTypeScript('lib/journey/hero/world.ts', { './ground': { GroundStage }, './globe': { GlobeStage }, './plates': { createPlates: async () => ({ variant: 'a', update() {} }) } }, globals);
  const world = await createHeroWorld({ host: get('hero'), ground: get('ground'), space: get('space'), prototype: { camera: 'earth-drag' } });
  world.prototype.scrub(1); world.start();
  const advance = (seconds = 1) => { for (let i = 0; i < seconds * 20; i++) { now += 50; frame(now); } };
  advance(12);
  return { world, advance, document, media, snapshot: () => world.prototype.snapshot() };
}
await check('Earth orbit resumes after a simple pointer press and release', async () => { const f = await orbitFixture(); assert.equal(f.world.prototype.beginDrag(), true); f.world.prototype.endDrag(); f.advance(2); const before = f.snapshot(); f.advance(2); assert.equal(f.snapshot().interaction, 'authored'); assert.ok(f.snapshot().sceneTimeSeconds > before.sceneTimeSeconds); assert.ok(Math.abs(f.snapshot().longitude - before.longitude) > .1); f.world.dispose(); });
await check('repeated endpoint scrub preserves orbital direction', async () => { const f = await orbitFixture(); f.advance(12); const before = f.snapshot().longitude; for (let i = 0; i < 20; i++) { f.world.prototype.scrub(1); f.advance(.1); } assert.ok(f.snapshot().longitude > before); f.world.dispose(); });
await check('hidden and reduced-motion worlds freeze scene clock', async () => {
  const f = await orbitFixture(); f.document.hidden = true; f.document.emit('visibilitychange'); let before = f.snapshot(); f.advance(2); assert.equal(f.snapshot().sceneTimeSeconds, before.sceneTimeSeconds); assert.equal(f.snapshot().longitude, before.longitude);
  f.document.hidden = false; f.document.emit('visibilitychange'); f.media.matches = true; f.media.emit('change'); f.advance(2); before = f.snapshot(); f.advance(2); assert.equal(f.snapshot().sceneTimeSeconds, before.sceneTimeSeconds); assert.equal(f.snapshot().longitude, before.longitude); f.world.dispose();
});
await check('drag release smoothly returns to automatic orbit', async () => { const f = await orbitFixture(); assert.equal(f.world.prototype.beginDrag(), true); f.world.prototype.drag(180, -50); f.world.prototype.endDrag(); assert.equal(f.snapshot().interaction, 'returning'); f.advance(2); assert.equal(f.snapshot().interaction, 'authored'); const before = f.snapshot(); f.advance(2); assert.ok(f.snapshot().longitude > before.longitude); f.world.dispose(); });
await check('reduced-motion manual scrub still reaches the requested altitude', async () => { const f = await orbitFixture(); f.media.matches = true; f.media.emit('change'); const clock = f.snapshot().sceneTimeSeconds; f.world.prototype.scrub(.6); f.advance(4); const after = f.snapshot(); assert.ok(Math.abs(after.altitudeKm - after.targetAltitudeKm) < .001); assert.equal(after.sceneTimeSeconds, clock); f.world.dispose(); });
await check('cancelling an actual camera flight preserves its current pose', async () => {
  const f = await orbitFixture(); f.world.prototype.fly('projects', { lat: 12, lon: 8, altitude: f.snapshot().altitudeKm * 1.08 }, () => {}); f.advance(1);
  const before = f.snapshot(); assert.equal(before.flightActive, true); f.world.prototype.cancelFlight(); const after = f.snapshot();
  assert.equal(after.flightActive, false); assert.equal(after.altitudeKm, before.altitudeKm); assert.equal(after.latitude, before.latitude); assert.equal(after.longitude, before.longitude);
  assert.equal(after.targetAltitudeKm, before.altitudeKm); f.world.dispose();
});
console.log(`${checks} actual adapter/world checks passed.`);
