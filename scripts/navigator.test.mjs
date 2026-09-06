import assert from 'node:assert/strict';
import { loadTypeScript } from './test-load-ts.mjs';
import { FakeElement, flush } from './stage-test-fixture.mjs';

function fixture({ reduced = false } = {}) {
  const notice = new FakeElement(); notice.hidden = true;
  const document = Object.assign(new FakeElement(), { documentElement: new FakeElement(), getElementById: id => id === 'loading' ? notice : null });
  const window = new FakeElement();
  let now = 0, body = 'earth', destination = 'home', flight = false, progress, resolveMaterial, rejectMaterial, reveal = 1;
  let disposed = 0, prepareCalls = 0;
  const timers = [];
  const events = [];
  const filmPlays = [];
  document.addEventListener('stage:flight', event => events.push(event.detail));
  const material = { map: { dispose() { disposed++; } }, displacementMap: { dispose() { disposed++; } }, dispose() { disposed++; } };
  const world = { snapshot: () => ({ body, destination, flightActive: flight }),
    fly(id, _pose, callback) { destination = id; flight = true; progress = callback; return { duration: 5000 }; },
    cancelFlight() { flight = false; }, setComposition(_amount, shown = 1) { reveal = shown; },
    prepareBody() { prepareCalls++; return new Promise((resolve, reject) => { resolveMaterial = resolve; rejectMaterial = reject; }); },
    setBody(spec) { body = spec?.id ?? 'earth'; }, snap(id) { destination = id; flight = false; } };
  let filmProgress = 1;
  const film = { pause() {}, render(p) { filmProgress = p; }, play: async (options) => { filmPlays.push(options); filmProgress = options.to; }, snapshot: () => ({ progress: filmProgress, playing: false }) };
  const globals = { window, document, Element: FakeElement, AbortController, innerWidth: 1440, innerHeight: 900, performance: { now: () => now }, matchMedia: () => ({ matches: reduced }),
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } }, setTimeout(fn, ms) { timers.push({ fn, at: now + ms }); return timers.length; } };
  const { createNavigator } = loadTypeScript('lib/journey/navigator.ts', { './destinations': { destinations: { projects: { body: 'moon', load: async () => ({ moonSpec: () => ({ id: 'moon' }) }) }, experience: { body: 'jupiter', load: async () => ({ moonSpec: () => ({ id: 'jupiter' }) }) } }, homePose: () => ({}), projectsPose: () => ({}), experiencePose: () => ({}), destinationPose: () => ({}) } }, globals);
  const navigator = createNavigator(world, film);
  return { navigator, window, events, world, filmPlays, notice, state: () => ({ body, destination, flight, filmProgress, reveal }), prepareCalls: () => prepareCalls, disposed: () => disposed,
    async advance(ms) { now = ms; for (const timer of timers.splice(0)) { if (timer.at <= now) timer.fn(); else timers.push(timer); } await flush(); },
    frame(raw) { progress(raw); }, async materialReady() { assert.ok(resolveMaterial, 'body preparation began'); resolveMaterial(material); await flush(); },
    async materialFailed() { assert.ok(rejectMaterial, 'body preparation began'); rejectMaterial(new Error('Image request failed')); await flush(); } };
}
let checks = 0;
async function check(name, run) { await run(); checks++; console.log(`PASS ${name}`); }
await check('early pointer cancellation stops camera immediately but still resolves Moon', async () => {
  const f = fixture(); await f.navigator.go('projects'); await f.advance(100); f.window.emit('pointerdown');
  assert.equal(f.state().flight, false); assert.equal(f.navigator.snapshot().active, false);
  await f.advance(300); assert.equal(f.prepareCalls(), 1); await f.materialReady();
  assert.equal(f.state().body, 'moon'); assert.equal(f.state().destination, 'projects'); assert.equal(f.state().flight, false);
  assert.ok(f.events.some(event => event.type === 'cancel')); f.navigator.dispose();
});
await check('Escape during pending texture preparation does not discard destination body', async () => {
  const f = fixture(); await f.navigator.go('projects'); await f.advance(350); f.window.emit('keydown', { key: 'Escape' }); await f.materialReady();
  assert.equal(f.state().body, 'moon'); assert.equal(f.state().flight, false); f.navigator.dispose();
});
await check('superseded Moon decode cannot replace newer Earth destination and disposes textures', async () => {
  const f = fixture(); await f.navigator.go('projects'); await f.advance(350); await f.navigator.go('home', { instant: true }); await f.materialReady();
  assert.equal(f.state().body, 'earth'); assert.equal(f.state().destination, 'home'); assert.equal(f.disposed(), 3); f.navigator.dispose();
});
await check('superseded pre-load timer cannot start obsolete Moon decode', async () => {
  const f = fixture(); await f.navigator.go('projects'); await f.advance(100); await f.navigator.go('home', { instant: true }); await f.advance(500);
  assert.equal(f.prepareCalls(), 0); assert.equal(f.state().body, 'earth'); f.navigator.dispose();
});
await check('reduced motion decodes then snaps with no live flight event', async () => {
  const f = fixture({ reduced: true }); const completion = f.navigator.go('projects'); await flush(); await f.materialReady(); await completion;
  assert.equal(f.state().body, 'moon'); assert.equal(f.state().flight, false); assert.equal(f.events.some(event => event.type === 'start'), false); f.navigator.dispose();
});
await check('disposal invalidates delayed load and removes cancellation listeners', async () => {
  const f = fixture(); await f.navigator.go('projects'); f.navigator.dispose(); await f.advance(500);
  assert.equal(f.prepareCalls(), 0); assert.equal(f.window.listeners(), 0);
});
await check('Experience loads Jupiter on direct reduced-motion entry', async () => {
  const f = fixture({ reduced: true }); const completion = f.navigator.go('experience'); await flush(); await f.materialReady(); await completion;
  assert.equal(f.state().body, 'jupiter'); assert.equal(f.state().destination, 'experience'); assert.equal(f.state().flight, false); f.navigator.dispose();
});
await check('About returns film to room and invalidates late Moon arrival', async () => {
  const f = fixture(); await f.navigator.go('projects'); await f.advance(350); await f.navigator.go('about', { instant: true }); await f.materialReady();
  assert.equal(f.state().body, 'earth'); assert.equal(f.state().filmProgress, 0); assert.equal(f.navigator.snapshot().destination, 'about'); assert.equal(f.disposed(), 3); f.navigator.dispose();
});
await check('leaving About restores film end and loads correct planet', async () => {
  const f = fixture(); await f.navigator.go('about', { instant: true }); const completion = f.navigator.go('experience', { instant: true }); await flush(); await f.materialReady(); await completion;
  assert.equal(f.state().body, 'jupiter'); assert.equal(f.state().filmProgress, 1); f.navigator.dispose();
});
await check('About navigation plays the return journey before revealing the room', async () => {
  const f = fixture(); await f.navigator.go('about');
  assert.equal(f.filmPlays.length, 1); assert.equal(f.filmPlays[0].from, 1); assert.equal(f.filmPlays[0].to, 0); assert.equal(f.filmPlays[0].ms, 6500);
  assert.equal(f.state().filmProgress, 0); assert.equal(f.navigator.snapshot().active, false);
  assert.ok(f.events.some(event => event.type === 'start' && event.active)); f.navigator.dispose();
});
await check('late texture rejection restores a visible Earth after the flight already completed', async () => {
  const f = fixture(); await f.navigator.go('projects'); await f.advance(350); f.frame(1);
  assert.equal(f.navigator.snapshot().active, false); assert.equal(f.state().reveal, 0);
  await f.materialFailed();
  assert.equal(f.state().reveal, 1); assert.equal(f.state().body, 'earth'); assert.equal(f.state().destination, 'projects');
  assert.equal(f.navigator.snapshot().phase, 'arrive'); assert.equal(f.notice.hidden, false);
  await f.navigator.go('home', { instant: true }); assert.equal(f.notice.hidden, true); f.navigator.dispose();
});
await check('direct texture rejection resolves with readable destination and an honest fallback notice', async () => {
  const f = fixture(); const completion = f.navigator.go('projects', { instant: true }).then(() => 'resolved', () => 'rejected');
  await flush(); await f.materialFailed();
  assert.equal(await completion, 'resolved'); assert.equal(f.state().destination, 'projects');
  assert.equal(f.state().body, 'earth'); assert.equal(f.state().reveal, 1); assert.equal(f.navigator.snapshot().phase, 'arrive');
  assert.equal(f.notice.hidden, false); assert.match(f.notice.textContent, /Earth/); f.navigator.dispose();
});
for (const instant of [false, true]) await check(`superseded ${instant ? 'direct' : 'animated'} texture rejection cannot disturb a newer destination`, async () => {
  const f = fixture(); const completion = f.navigator.go('projects', { instant }).then(() => 'resolved', () => 'rejected');
  await f.advance(350); await f.navigator.go('about', { instant: true }); const before = { ...f.state() };
  await f.materialFailed(); assert.equal(await completion, 'resolved');
  assert.deepEqual(f.state(), before); assert.equal(f.notice.hidden, true); assert.equal(f.navigator.snapshot().destination, 'about'); f.navigator.dispose();
});
console.log(checks + ' navigator race checks passed.');
