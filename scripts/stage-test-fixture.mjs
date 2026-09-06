import assert from 'node:assert/strict';
import { loadTypeScript } from './test-load-ts.mjs';

export class FakeElement {
  constructor() { this.handlers = new Map(); this.style = {}; this.dataset = {}; this.hidden = false; this.disabled = false; this.offsetHeight = 8000; this.classList = { add() {}, remove() {} }; }
  addEventListener(name, fn, options) {
    this.handlers.set(name, [...(this.handlers.get(name) ?? []), fn]);
    options?.signal?.addEventListener('abort', () => this.handlers.set(name, (this.handlers.get(name) ?? []).filter(handler => handler !== fn)), { once: true });
  }
  removeEventListener(name, fn) { this.handlers.set(name, (this.handlers.get(name) ?? []).filter(handler => handler !== fn)); }
  emit(name, event = {}) { for (const fn of this.handlers.get(name) ?? []) fn(event); }
  dispatchEvent(event) { this.emit(event.type, event); return true; }
  listeners() { return [...this.handlers.values()].reduce((count, list) => count + list.length, 0); }
  setAttribute() {} decode() { return Promise.resolve(); } closest() { return null; }
  hasPointerCapture() { return false; } releasePointerCapture() {} setPointerCapture() {} focus() {}
}
export const flush = () => new Promise(resolve => setImmediate(resolve));
export function stageFixture({ reduced = false, hidden = false, scroll = 0, back = false, pathname = '/', globeReady = true, actualEarth = false, stalledPhoto = false } = {}) {
  const nodes = new Map();
  const get = selector => {
    assert.notEqual(selector, '#pause-motion', 'Removed Pause motion must never be queried');
    if (!nodes.has(selector)) nodes.set(selector, new FakeElement());
    return nodes.get(selector);
  };
  let hasRunway = pathname === '/';
  const document = Object.assign(new FakeElement(), { body: new FakeElement(), hidden, documentElement: new FakeElement(), querySelector: get,
    getElementById: id => id === 'film-runway' ? hasRunway ? get('#film-runway') : null : get('#' + id) });
  const root = Object.assign(new FakeElement(), { querySelector: get, querySelectorAll: () => [get('#space-canvas'), get('#ground-canvas')] });
  const window = new FakeElement();
  const media = Object.assign(new FakeElement(), { matches: reduced });
  const coarse = Object.assign(new FakeElement(), { matches: false });
  let now = 0, next = 0, disposals = 0, starts = 0, resolveWorld, rejectWorld, failWorld;
  const frames = new Map();
  const timers = new Map();
  let resolvePhoto;
  if (stalledPhoto) get('#exterior-photo').decode = () => new Promise(resolve => { resolvePhoto = resolve; });
  const snapshot = { globeReady, sceneAlive: true, canDrag: false, interaction: 'authored', filmProgress: 0, body: 'earth', destination: 'home' };
  const controls = { snapshot: () => snapshot, scrub(p) { snapshot.filmProgress = p; }, endDrag() {}, reset() {}, beginDrag: () => false };
  let disposed = false;
  const world = { prototype: controls, start() { starts++; }, dispose() { if (!disposed) { disposed = true; disposals++; } } };
  const ready = new Promise((resolve, reject) => { resolveWorld = resolve; rejectWorld = reject; });
  const globals = { window, document, root, Element: FakeElement, AbortController, DOMException, crypto: { randomUUID: () => 'qa-stage-id' },
    location: { pathname }, matchMedia: query => query.includes('coarse') ? coarse : media, innerWidth: 1440, innerHeight: 900, scrollY: scroll,
    performance: { now: () => now, getEntriesByType: () => [{ type: back ? 'back_forward' : 'navigate' }] },
    requestAnimationFrame(fn) { const id = ++next; frames.set(id, fn); return id; }, cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout(fn, ms) { const id = ++next; timers.set(id, { fn, at: now + ms }); return id; }, clearTimeout(id) { timers.delete(id); } };
  window.scrollTo = ({ top }) => { globals.scrollY = top; };
  const calls = [];
  const navigator = { async go(id, options) { calls.push({ id, options }); snapshot.destination = id; snapshot.body = id === 'projects' ? 'moon' : 'earth'; }, dispose() {}, subscribe: () => () => {} };
  const overrides = { './navigator': { createNavigator: () => navigator }, './bridge': { publishWorldStage() {}, releaseWorldStage() {}, markWorldUnavailable() {}, worldUnavailable: () => false },
    './hero/world': { createHeroWorld: ({ signal }) => { signal.addEventListener('abort', () => world.dispose(), { once: true }); return ready; } } };
  if (!actualEarth) overrides['./earth'] = { createEarthJourney: () => ({ controls, initEarth(_pause, fail) { failWorld = fail; return ready; }, scrubEarth(p) { snapshot.filmProgress = p; }, earthSnapshot: () => snapshot, dispose: () => world.dispose() }) };
  const stage = loadTypeScript('lib/journey/stage.ts', overrides, globals);
  const cleanup = stage.createWorldStage(root);
  return { window, document, root, globals, nodes, media, coarse, get, controls, snapshot, calls, cleanup,
    state: () => window.roomProof?.state, stage: () => window.__portfolioWorld, disposals: () => disposals, starts: () => starts,
    setRunway(value) { hasRunway = value; },
    click(element = new FakeElement()) { root.emit('click', { button: 0, target: element }); },
    async load() { resolveWorld(world); await flush(); }, async reject() { rejectWorld(new Error('Texture failed')); await flush(); }, fail() { failWorld(); },
    async photoReady() { resolvePhoto?.(); await flush(); },
    async advance(ms) { now += ms; for (const [id, timer] of timers) if (timer.at <= now) { timers.delete(id); timer.fn(); } await flush(); },
    frame(t) { now = t; const pending = [...frames.values()]; frames.clear(); for (const fn of pending) fn(t); },
    assertReleased() { assert.equal(frames.size, 0); for (const element of [root, window, document, media, coarse, ...nodes.values()]) assert.equal(element.listeners(), 0); }
  };
}
