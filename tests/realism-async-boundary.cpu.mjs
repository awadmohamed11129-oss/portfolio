import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import * as three from 'three';

// CPU-only boundary tests. Actual World methods and PreparationBudget run;
// async acquisition and GPU preparation are controlled. No renderer is created.
const root = path.resolve(process.env.QA_SOURCE_ROOT || process.cwd());
function load(relative, dependencies = {}) {
  const filename = path.join(root, relative);
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    exports, require(id) {
      assert.ok(Object.hasOwn(dependencies, id), `Unmapped dependency ${id}; review loader adapter against delivered source`);
      return dependencies[id];
    }, performance, console: { ...console, warn() {} }, setTimeout, clearTimeout, AbortController, AbortSignal, DOMException,
  }, { filename });
  return exports;
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  // An old synchronous consumer may never attach to the new factory promise.
  // Keep its expected red baseline from becoming an unhandled rejection.
  promise.catch(() => {});
  return { promise, resolve, reject };
}
const turn = () => new Promise(resolve => setImmediate(resolve));

function fixture(durationMs = 5000) {
  const acquisition = deferred();
  let currentAcquisition = acquisition.promise;
  const prepared = deferred();
  const about = deferred();
  let currentAbout = about.promise;
  const counts = { creates: 0, disposed: 0, aboutLoads: 0, fallback: 0 };
  const signals = { room: [], about: [] };
  const handle = { group: new three.Group(), anchors: { room: { position: [0, 1.7, 5], target: [0, 1.2, 0] } }, targets: [], dispose() { counts.disposed++; } };
  const { PreparationBudget } = load('lib/world/PreparationBudget.ts');
  const journey = load('lib/world/journey.ts');
  const { WorldRuntime } = load('lib/world/WorldRuntime.ts', {
    three, './journey': journey, './PreparationBudget': { PreparationBudget },
    './art/createWorldArt': {}, './environment': {}, './input': {}, './projection': {},
    // Acquisition tests control preparation; actual filter lifetime has its own suite.
    './windowShadows': { installWindowShadowFilter: () => () => {} },
    '@/components/room/createRoom': { createRoom(options) { counts.creates++; signals.room.push(options.signal); return currentAcquisition; } },
  });
  const budgets = [];
  const statuses = [];
  const runtime = Object.create(WorldRuntime.prototype);
  Object.assign(runtime, {
    state: { destination: 'about', mode: 'content', device: null, navigationToken: 1 },
    disposed: false, ready: true, contextLost: false, room: null, roomPromise: null,
    roomReady: false, quality: 'high', preparation: [], scene: new three.Scene(),
    art: { neighbourhood: new three.Group(), house: new three.Group(), loadAbout(signal) { counts.aboutLoads++; signals.about.push(signal); return currentAbout; } },
    preparedBitmaps: new Set(), uploadedTextures: new WeakSet(), contextGeneration: 0,
    environment: { setRoom() {} },
    beginPreparationBudget() { const budget = new PreparationBudget(durationMs); budgets.push(budget); return budget; },
    finishPreparationBudget(budget) { budget.cancel(); },
    prepareIncoming: stage => stage === 'room' ? prepared.promise : Promise.resolve(true),
    roomAnchor: () => handle.anchors.room,
    callbacks: { status(value) { statuses.push(value); }, fallback() { counts.fallback++; } },
    hideProjection() {}, wake() {},
  });
  return { runtime, handle, acquisition, prepared, about, counts, statuses, signals,
    budgets,
    useNextAcquisition(promise) { currentAcquisition = promise; },
    useNextAbout(promise) { currentAbout = promise; },
    cleanup() { budgets.forEach(budget => budget.cancel()); },
    cancel() { runtime.disposed = true; budgets.forEach(budget => budget.cancel()); } };
}

test('async room acquisition is shared and cannot attach before acquisition/preparation complete', async () => {
  const f = fixture();
  try {
    f.about.resolve();
    const first = f.runtime.ensureRoom();
    const second = f.runtime.ensureRoom();
    assert.equal(first, second, 'Concurrent callers must share one pending room operation');
    await turn();
    assert.equal(f.counts.creates, 1);
    assert.equal(f.counts.fallback, 0, 'An unresolved Promise is loading, not a malformed RoomSceneHandle');
    assert.equal(f.runtime.roomReady, false);
    assert.equal(f.runtime.scene.children.includes(f.handle.group), false);
    f.acquisition.resolve(f.handle); await turn();
    assert.equal(f.runtime.roomReady, false, 'Acquisition alone does not establish render readiness');
    assert.equal(f.runtime.scene.children.includes(f.handle.group), false);
    f.prepared.resolve(true); await first;
    assert.equal(f.runtime.roomReady, true);
    assert.equal(f.runtime.scene.children.includes(f.handle.group), true);
  } finally { f.cleanup(); }
});

test('cancelled acquisition releases a late room handle exactly once without readiness', async () => {
  const f = fixture();
  try {
    f.about.resolve();
    const pending = f.runtime.ensureRoom(); await turn();
    f.cancel(); await pending;
    f.acquisition.resolve(f.handle); await turn();
    assert.equal(f.counts.disposed, 1, 'The cancelled budget must release the late async result');
    assert.equal(f.runtime.roomReady, false);
    assert.equal(f.runtime.scene.children.includes(f.handle.group), false);
  } finally { f.cleanup(); }
});

test('rejected room acquisition clears the pending operation and permits retry', async () => {
  const f = fixture();
  try {
    f.about.resolve();
    const pending = f.runtime.ensureRoom(); await turn();
    f.acquisition.reject(new Error('Controlled asset load failure')); await pending;
    assert.equal(f.runtime.roomReady, false);
    assert.equal(f.runtime.roomPromise, null);
    assert.equal(f.counts.fallback, 1);
    f.useNextAcquisition(Promise.resolve(f.handle));
    f.prepared.resolve(true);
    await f.runtime.ensureRoom();
    assert.equal(f.counts.creates, 2);
    assert.equal(f.runtime.roomReady, true);
    assert.equal(f.counts.fallback, 1);
  } finally { f.cleanup(); }
});

test('optional About acquisition completes before About is marked ready', async () => {
  const f = fixture();
  try {
    f.acquisition.resolve(f.handle); f.prepared.resolve(true);
    const pending = f.runtime.ensureRoom(); await turn();
    assert.equal(f.counts.aboutLoads, 1, 'World must invoke the lazy About asset contract');
    assert.equal(f.runtime.roomReady, false);
    f.about.resolve(); await pending;
    assert.equal(f.runtime.roomReady, true);
  } finally { f.cleanup(); }
});

test('actual active deadline releases a late result exactly once and allows a successful retry', async () => {
  const f = fixture(80);
  try {
    f.about.resolve();
    await f.runtime.ensureRoom(); // The real PreparationBudget timer must expire.
    assert.ok(f.budgets[0].activeMs >= 80, 'Failure must come from the actual active-time deadline');
    assert.equal(f.counts.fallback, 1);
    assert.equal(f.runtime.roomPromise, null);
    f.acquisition.resolve(f.handle); await turn();
    assert.equal(f.counts.disposed, 1);
    assert.equal(f.runtime.scene.children.includes(f.handle.group), false);
    const retry = { ...f.handle, group: new three.Group(), dispose() { throw new Error('Live retry must not be disposed as the late failed attempt'); } };
    f.useNextAcquisition(Promise.resolve(retry));
    f.prepared.resolve(true);
    await f.runtime.ensureRoom();
    assert.equal(f.runtime.roomReady, true);
    assert.equal(f.runtime.room, retry);
    assert.equal(f.counts.creates, 2);
    assert.equal(f.counts.disposed, 1);
  } finally { f.cleanup(); }
});

for (const acquiredBeforeFailure of [true, false]) {
  test(`exterior rejection releases ${acquiredBeforeFailure ? 'already acquired' : 'still pending'} Room exactly once and permits retry`, async () => {
    const f = fixture();
    const exteriorRoots = [f.runtime.art.neighbourhood, f.runtime.art.house];
    f.runtime.scene.add(...exteriorRoots);
    try {
      const pending = f.runtime.ensureRoom();
      await turn();
      assert.equal(f.counts.creates, 1, 'Parallel Room acquisition starts while exterior is pending');
      assert.equal(f.counts.aboutLoads, 1);
      assert.ok(f.budgets[0].signal, 'The shared budget must expose an acquisition AbortSignal');
      assert.equal(f.signals.room[0], f.budgets[0].signal);
      assert.equal(f.signals.about[0], f.budgets[0].signal);
      if (acquiredBeforeFailure) { f.acquisition.resolve(f.handle); await turn(); }
      assert.equal(f.counts.disposed, 0);
      f.about.reject(new Error('Controlled exterior dependency failure'));
      await pending;
      assert.equal(f.budgets[0].signal.aborted, true, 'Failed sibling aborts the shared acquisition budget');
      assert.equal(f.runtime.roomPromise, null);
      assert.equal(f.runtime.roomReady, false);
      assert.equal(f.counts.fallback, 1);
      if (!acquiredBeforeFailure) { f.acquisition.resolve(f.handle); await turn(); }
      assert.equal(f.counts.disposed, 1);
      assert.equal(f.runtime.scene.children.includes(f.handle.group), false);
      for (const root of exteriorRoots) assert.equal(root.parent, null, 'Stable exterior roots stay detached after failure');

      const retry = { ...f.handle, group: new three.Group(), dispose() { throw new Error('Successful retry released as failed sibling'); } };
      f.useNextAbout(Promise.resolve());
      f.useNextAcquisition(Promise.resolve(retry));
      f.prepared.resolve(true);
      await f.runtime.ensureRoom();
      assert.equal(f.runtime.roomReady, true);
      assert.equal(f.runtime.room, retry);
      assert.equal(f.runtime.art.neighbourhood, exteriorRoots[0]);
      assert.equal(f.runtime.art.house, exteriorRoots[1]);
      for (const root of exteriorRoots) assert.equal(root.parent, f.runtime.scene);
      assert.equal(f.counts.disposed, 1, 'Late failure cleanup cannot release the successful retry');
      assert.equal(f.counts.creates, 2);
    } finally { f.cleanup(); }
  });
}
