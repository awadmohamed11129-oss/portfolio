import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';
import * as three from 'three';

// Actual runtime preparation/recovery/disposal, controlled driver only. No WebGL.
const root = path.resolve(process.env.QA_WORLD_SOURCE_ROOT || process.env.QA_SOURCE_ROOT || process.cwd());
function load(relative, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require(id) {
    assert.ok(Object.hasOwn(dependencies, id), `Unmapped runtime dependency: ${id}`);
    return dependencies[id];
  }, performance, setTimeout, clearTimeout, AbortController, HTMLImageElement: class {},
  console: { ...console, warn() {} }, document: { hidden: false, removeEventListener() {} },
  window: { setTimeout, removeEventListener() {} } });
  return exports;
}
const journey = load('lib/world/journey.ts');
const { PreparationBudget } = load('lib/world/PreparationBudget.ts');
const { WorldRuntime } = load('lib/world/WorldRuntime.ts', {
  three, './journey': journey, './PreparationBudget': { PreparationBudget },
  './art/createWorldArt': {}, './environment': {}, './input': {}, './projection': {},
  // These fixtures contain no acquired Room; real filter lifetime is tested separately.
  './windowShadows': { installWindowShadowFilter: () => () => {} },
});
async function until(predicate) {
  const deadline = performance.now() + 2000;
  while (!predicate()) {
    assert.ok(performance.now() < deadline, 'Controlled recovery did not reach the requested stage');
    await new Promise(resolve => setTimeout(resolve, 5));
  }
}
function fixture() {
  const runtime = Object.create(WorldRuntime.prototype);
  const calls = [], statuses = [];
  const texture = new three.DataTexture(new Uint8Array(4), 1, 1);
  const material = new three.MeshStandardMaterial({ map: texture });
  const geometry = new three.BoxGeometry();
  const live = new three.Group(); live.add(new three.Mesh(geometry, material));
  const atmosphere = new three.Group();
  const detachedAbout = new three.Group(), aboutOwner = new three.Group(); aboutOwner.add(detachedAbout);
  const scene = new three.Scene(); scene.add(live, atmosphere);
  const reflection = new three.Texture();
  Object.assign(runtime, {
    scene, camera: new three.PerspectiveCamera(), art: { toronto: live, dispose() { calls.push('art-dispose'); live.clear(); } },
    environment: { group: atmosphere, reflectionIntensity: .55,
      prepareReflections(_renderer, generation) { calls.push(`environment:${generation}`); return reflection; },
      dispose() { calls.push('environment-dispose'); } },
    renderer: { compile() { calls.push('compile'); }, getContext: () => ({ getExtension: () => null }),
      initTexture(value) { assert.equal(value, texture); calls.push('upload'); },
      dispose() { calls.push('renderer-dispose'); }, forceContextLoss() { calls.push('force-loss'); },
      domElement: { removeEventListener() {}, remove() {} } },
    state: { destination: 'home', mode: 'world', device: null, navigationToken: 1 },
    disposed: false, gpuDisposed: false, ready: true, roomReady: false, artFailed: false, roomFailed: false,
    contextLost: false, contextGeneration: 1, environmentReady: false, environmentRecovery: null,
    quality: 'high', homeProgress: 0, room: null, preparation: [], preparationBudgets: new Set(),
    uploadedTextures: new WeakSet(), bitmapImages: new Map(), resumePreparation: new Set(),
    observer: { disconnect() {} }, reduced: { removeEventListener() {} },
    callbacks: { status(value) { statuses.push(value); }, fallback() { calls.push('fallback'); } },
    flight: { settle() { calls.push('settle'); } },
    stop() {}, hideProjection() {}, resize() {}, wake() {},
    warmScene(pending) { assert.ok(pending.children.includes(live)); assert.ok(calls.includes('upload')); calls.push('warm'); },
  });
  return { runtime, calls, statuses, texture, live, atmosphere, detachedAbout, aboutOwner,
    cleanup() { runtime.preparationBudgets.forEach(budget => budget.cancel()); geometry.dispose(); material.dispose(); texture.dispose(); reflection.dispose(); } };
}

test('repeated context generation during explicit upload restarts shared recovery before readiness', async () => {
  const f = fixture(); let uploads = 0;
  try {
    f.runtime.renderer.initTexture = texture => {
      assert.equal(texture, f.texture); f.calls.push('upload'); uploads++;
      if (uploads === 1) {
        // Driver boundary simulates a second loss/restore generation before return.
        f.runtime.contextGeneration++;
        f.runtime.environmentReady = false; f.runtime.scene.environment = null;
        f.runtime.uploadedTextures = new WeakSet();
      }
    };
    const first = f.runtime.restoreEnvironment();
    assert.equal(f.runtime.restoreEnvironment(), first, 'One operation must own the detached live graph');
    await first;
    assert.equal(uploads, 2);
    assert.equal(f.runtime.preparation[0].restarts, 1);
    assert.deepEqual(f.calls.filter(call => call.startsWith('environment:')), ['environment:1', 'environment:2']);
    assert.deepEqual(f.statuses, ['ready']);
    assert.equal(f.live.parent, f.runtime.scene);
    assert.equal(f.runtime.preparationBudgets.size, 0);
  } finally { f.cleanup(); }
});

test('real disposal during pending shader recovery cancels work without reattachment or readiness', async () => {
  const f = fixture();
  try {
    f.runtime.renderer.getContext = () => ({ getExtension: () => ({ COMPLETION_STATUS_KHR: 1 }), getProgramParameter: () => false });
    f.runtime.renderer.info = { programs: [{ program: {} }] };
    const pending = f.runtime.restoreEnvironment();
    await until(() => f.calls.includes('compile'));
    assert.notEqual(f.live.parent, f.runtime.scene);
    f.runtime.dispose(); f.runtime.dispose();
    await pending;
    assert.deepEqual(f.statuses, []);
    assert.equal(f.runtime.scene.children.length, 0);
    assert.equal(f.runtime.environmentRecovery, null);
    assert.equal(f.runtime.preparationBudgets.size, 0);
    assert.equal(f.runtime.resumePreparation.size, 0);
    assert.equal(f.calls.includes('upload'), false);
    for (const event of ['art-dispose', 'environment-dispose', 'renderer-dispose', 'force-loss']) assert.equal(f.calls.filter(call => call === event).length, 1);
  } finally { f.cleanup(); }
});

test('recovery uploads invisible live roots while preserving a detached About acquisition owner', async () => {
  const f = fixture();
  try {
    f.live.visible = false;
    await f.runtime.restoreEnvironment();
    assert.equal(f.calls.filter(call => call === 'upload').length, 1);
    assert.equal(f.live.parent, f.runtime.scene);
    assert.equal(f.live.visible, false);
    assert.equal(f.atmosphere.parent, f.runtime.scene);
    assert.equal(f.detachedAbout.parent, f.aboutOwner);
    assert.deepEqual(f.statuses, ['ready']);
  } finally { f.cleanup(); }
});

test('continuous About approach and close-room camera envelope preserve safe near clipping', () => {
  const altitude = p => Math.max(0, Math.hypot(p[0], p[1] + 1800, p[2]) - 1800);
  for (let i = 0; i <= 1000; i++) {
    const anchor = journey.samplePath(journey.ABOUT_PATH, i / 1000);
    const near = journey.nearPlaneForCamera(anchor.position, altitude(anchor.position));
    assert.ok(Number.isFinite(near) && near >= .05 && near <= 20);
    if (i >= 650) assert.equal(near, .05, 'Neighbourhood-to-house-to-doorstep-to-room approach retains close range');
  }
  // Device fits and room orbits remain within this envelope regardless of heading.
  for (const radius of [0, .1, 1, 10, 50, 149.99]) for (let yaw = 0; yaw < 12; yaw++) for (let pitch = -5; pitch <= 5; pitch++) {
    const a = yaw * Math.PI / 6, b = pitch * Math.PI / 12;
    const center = journey.WORLD_PLACEMENT.room;
    const p = [center[0] + radius * Math.cos(b) * Math.cos(a), center[1] + radius * Math.sin(b), center[2] + radius * Math.cos(b) * Math.sin(a)];
    assert.equal(journey.nearPlaneForCamera(p, altitude(p)), .05);
  }
});

test('portrait opening remains visible by local height and does not enter clouds from radial offset', () => {
  const { createEnvironment } = load('lib/world/environment.ts', { three });
  for (const aspect of [375 / 844, 753 / 1024]) {
    const environment = createEnvironment('high');
    try {
      const stops = journey.homePathForAspect(aspect);
      for (const stop of stops.filter(stop => stop.at <= .19)) {
        const p = stop.anchor.position;
        const distance = Math.hypot(...p.map((v, i) => v - journey.WORLD_PLACEMENT.room[i]));
        assert.equal(journey.landVisibility('toronto', 'home', p[1], distance).toronto, true);
      }
      const p = stops[0].anchor.position;
      const radialAltitude = Math.max(0, Math.hypot(p[0], p[1] + 1800, p[2]) - 1800);
      environment.update(radialAltitude, 0, { x:p[0], y:p[1], z:p[2] });
      const clouds = environment.group.children.find(group => group.isGroup && group.children.some(mesh => mesh.material?.uniforms?.opacity));
      assert.ok(clouds);
      assert.equal(clouds.visible, false, 'City camera below cloud deck stays outside clouds after portrait dolly');
    } finally { environment.dispose(); }
  }
});
