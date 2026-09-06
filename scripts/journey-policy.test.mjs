import assert from 'node:assert/strict';
import { stageFixture, FakeElement } from './stage-test-fixture.mjs';

let checks = 0;
async function check(name, run) { await run(); checks++; console.log(`PASS ${name}`); }
await check('visible readiness starts the accepted14000ms home intro', async () => { const f = stageFixture(); await f.load(); assert.equal(f.state().playing, true); assert.equal(f.state().duration, 14000); f.cleanup(); });
await check('reduced motion never autoplays; direct destination snaps', async () => {
  const f = stageFixture({ reduced: true }); await f.load(); assert.equal(f.state().playing, false); f.cleanup();
  const d = stageFixture({ pathname: '/projects' }); await d.load(); assert.equal(d.state().progress, 1); assert.equal(d.state().playing, false); assert.equal(d.calls[0].id, 'projects'); assert.equal(d.calls[0].options.instant, true); d.cleanup();
});
await check('hidden readiness waits for visibility', async () => { const f = stageFixture({ hidden: true }); await f.load(); assert.equal(f.state().playing, false); f.document.hidden = false; f.document.emit('visibilitychange'); assert.equal(f.state().playing, true); f.cleanup(); });
for (const kind of ['wheel', 'touchmove', 'keydown']) await check(`${kind} while loading suppresses autoplay`, async () => { const f = stageFixture(); f.window.emit(kind, { key: 'x' }); await f.load(); assert.equal(f.state().playing, false); f.cleanup(); });
await check('restored nonzero scroll restarts fresh home intro', async () => { const f = stageFixture({ scroll: 800 }); await f.load(); assert.equal(f.state().playing, true); assert.equal(f.state().progress, 0); f.cleanup(); });
await check('Back and BFCache do not replay intro', async () => {
  const f = stageFixture({ back: true }); await f.load(); assert.equal(f.state().playing, false); assert.equal(f.state().progress, 1); f.cleanup();
  const b = stageFixture(); await b.load(); b.window.emit('pagehide', { persisted: true }); b.window.emit('pageshow', { persisted: true }); b.document.emit('visibilitychange'); assert.equal(b.state().playing, false); b.cleanup();
});
await check('authored scrolling continues; actual user scrolling takes over', async () => { const f = stageFixture(); await f.load(); f.frame(1000); f.window.emit('scroll'); assert.equal(f.state().playing, true); f.window.emit('wheel'); f.globals.scrollY += 300; f.window.emit('scroll'); assert.equal(f.state().playing, false); assert.ok(f.state().progress > .07); f.cleanup(); });
await check('no runway: wheel, touchmove, keys and scrolling leave film untouched', async () => {
  const f = stageFixture({ pathname: '/projects' }); await f.load(); const before = f.state().progress;
  f.globals.scrollY = 2000; for (const kind of ['wheel', 'touchmove', 'keydown', 'scroll']) f.window.emit(kind, { key: 'PageDown' });
  assert.equal(f.state().progress, before); assert.equal(f.state().playing, false); f.cleanup();
});
await check('film reverse play reaches0 exactly at4000ms through production render', async () => {
  const f = stageFixture({ pathname: '/projects' }); await f.load();
  const done = f.stage().film.play({ from: 1, to: 0, ms: 4000 });
  f.frame(2000); assert.equal(f.state().progress, .5); f.frame(4000); await done;
  assert.equal(f.state().progress, 0); assert.equal(f.state().playing, false); f.cleanup();
});
await check('unmount aborts listeners and ignores late readiness', async () => {
  for (const early of [true, false]) { const f = stageFixture(); if (!early) await f.load(); f.cleanup(); if (early) await f.load(); assert.equal(f.state(), undefined); assert.equal(f.disposals(), 1); f.assertReleased(); }
});
await check('late scene failure restores useful static fallback once', async () => { const f = stageFixture(); await f.load(); f.frame(5000); f.fail(); assert.equal(f.state().ready, false); assert.equal(f.state().progress, 0); assert.equal(f.state().playing, false); assert.equal(f.get('#loading').hidden, false); f.fail(); assert.equal(f.disposals(), 1); f.cleanup(); });
await check('midpoint and final progress survive viewport resize', async () => {
  for (const progress of [.5, 1]) { const f = stageFixture(); await f.load(); f.frame(progress * 14000); f.globals.innerHeight = 1200; f.get('#film-runway').offsetHeight = 9600; f.window.emit('resize'); assert.equal(f.state().progress, progress); assert.equal(f.globals.scrollY, 8400 * progress); assert.equal(f.state().playing, progress < 1); f.cleanup(); }
});
await check('successive clicks accelerate continuously and land at same endpoint', async () => {
  const f = stageFixture(); await f.load(); f.frame(1000); const before = f.state().progress;
  f.click(); assert.equal(f.state().playbackRate, 2); assert.equal(f.state().progress, before);
  f.frame(2000); assert.ok(Math.abs(f.state().progress - 3 / 14) < 1e-9);
  f.click(); f.frame(3000); assert.equal(f.state().progress, .5); f.click(); f.frame(4000);
  assert.equal(f.state().progress, 1); assert.equal(f.state().playing, false); f.cleanup();
});
await check('touch contact accelerates; touchmove cancels; early clicks cap at8x', async () => {
  const f = stageFixture(); f.window.emit('touchstart'); f.click(); await f.load(); assert.equal(f.state().playbackRate, 2); f.window.emit('touchmove'); assert.equal(f.state().playing, false); f.cleanup();
  const e = stageFixture(); for (let i = 0; i < 8; i++) e.click(); await e.load(); assert.equal(e.state().playbackRate, 8); e.cleanup();
});
await check('interactive controls and reduced motion never accelerate', async () => {
  const f = stageFixture(); await f.load(); const link = new FakeElement(); link.closest = () => ({}); f.click(link); assert.equal(f.state().playbackRate, 1); f.cleanup();
  const r = stageFixture({ reduced: true }); await r.load(); r.click(); assert.equal(r.state().playbackRate, 1); r.cleanup();
});
console.log(`${checks} stage policy checks passed.`);
