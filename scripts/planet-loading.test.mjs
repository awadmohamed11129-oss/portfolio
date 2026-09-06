import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { loadTypeScript } from './test-load-ts.mjs';

for (const failure of ['ring request', 'texture upload', 'shader compilation']) {
  test(`planet loading releases decoded images after ${failure} fails`, async () => {
    let decoded = 0;
    let closed = 0;
    const { GlobeStage } = loadTypeScript('lib/journey/hero/globe.ts', {}, {
      AbortController, setTimeout, clearTimeout,
      fetch: async url => ({ ok: !(failure === 'ring request' && url === '/ring'), status: 404, blob: async () => ({}) }),
      createImageBitmap: async () => { decoded++; return { close() { closed++; } }; },
    });
    const stage = {
      disposed: false,
      renderer: { capabilities: { getMaxAnisotropy: () => 8 }, initTexture() { if (failure === 'texture upload') throw new Error('texture upload'); }, compileAsync: async () => { throw new Error('shader compilation'); } },
      surface: { geometry: new THREE.SphereGeometry() }, camera: new THREE.PerspectiveCamera(), scene: new THREE.Scene(),
    };
    await assert.rejects(GlobeStage.prototype.prepareBody.call(stage, { id: 'saturn', map: '/surface', ringMap: '/ring', displacementScaleKm: 0 }));
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.ok(decoded > 0);
    assert.equal(closed, decoded, 'Every decoded bitmap must be released on a failed preparation');
    stage.surface.geometry.dispose();
  });
}

for (const stalled of ['response', 'body']) {
  test(`planet loading aborts a stalled ${stalled} at its deadline and releases decoded siblings`, async () => {
    let now = 0, next = 0, decoded = 0, closed = 0;
    const timers = new Map();
    const waitForAbort = signal => new Promise((_resolve, reject) => signal?.addEventListener('abort', () => reject(new DOMException('Timed out', 'AbortError')), { once: true }));
    const { GlobeStage } = loadTypeScript('lib/journey/hero/globe.ts', {}, {
      AbortController,
      setTimeout(fn, ms) { const id = ++next; timers.set(id, { fn, at: now + ms }); return id; },
      clearTimeout(id) { timers.delete(id); },
      fetch: async (url, options) => {
        if (url === '/ring' && stalled === 'response') return waitForAbort(options?.signal);
        return { ok: true, blob: () => url === '/ring' ? waitForAbort(options?.signal) : Promise.resolve({}) };
      },
      createImageBitmap: async () => { decoded++; return { close() { closed++; } }; },
    });
    const stage = {
      disposed: false, renderer: { capabilities: { getMaxAnisotropy: () => 8 } },
    };
    const outcome = GlobeStage.prototype.prepareBody.call(stage, { id: 'saturn', map: '/surface', ringMap: '/ring', displacementScaleKm: 0 }).then(() => 'resolved', error => error.name);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(decoded, 1);
    assert.equal(timers.size, 1, 'Only the stalled request should retain its deadline');
    const advance = ms => { now = ms; for (const timer of [...timers.values()]) if (timer.at <= now) timer.fn(); };
    advance(14_999); await new Promise(resolve => setImmediate(resolve));
    assert.equal(closed, 0, 'Successful images remain available before the deadline');
    advance(15_000);
    assert.equal(await outcome, 'AbortError');
    assert.equal(closed, decoded, 'The completed sibling image is released after timeout');
    assert.equal(timers.size, 0, 'Deadline timers are cleared on success and failure');
  });
}

test('returning from Jupiter restores the exact Earth material, shape, lights and atmosphere', () => {
  const { GlobeStage } = loadTypeScript('lib/journey/hero/globe.ts');
  const earthMaterial = new THREE.MeshPhysicalMaterial();
  const stage = {
    surface: new THREE.Mesh(new THREE.SphereGeometry(), earthMaterial), earthMaterial,
    rings: null, earth: new THREE.Group(), clouds: { visible: true }, atmosphere: { visible: true },
    sky: { userData: { material: { uniforms: { uNebula: { value: 1 }, uStars: { value: 1 } } } } },
    sun: new THREE.DirectionalLight(), renderer: { toneMappingExposure: 1.05 },
  };
  const jupiter = new THREE.MeshPhysicalMaterial();
  let closed = 0, disposed = 0;
  jupiter.map = new THREE.Texture({ close() { closed++; } });
  jupiter.map.addEventListener('dispose', () => { disposed++; });
  GlobeStage.prototype.setBody.call(stage, { id: 'jupiter', polarScale: .935, clouds: false, atmosphere: false, sunDir: [.85, .35, .65], exposure: 1 }, jupiter);
  assert.equal(stage.surface.material, jupiter);
  assert.equal(stage.surface.scale.y, .935);
  assert.equal(stage.clouds.visible, false);
  GlobeStage.prototype.setBody.call(stage, null);
  assert.equal(stage.surface.material, earthMaterial);
  assert.equal(stage.surface.scale.y, 1);
  assert.equal(stage.bodyId, 'earth');
  assert.equal(stage.renderer.toneMappingExposure, 1.05);
  assert.deepEqual(stage.sun.position.toArray(), [-9000, 5500, 26000]);
  assert.equal(stage.clouds.visible, true);
  assert.equal(stage.atmosphere.visible, true);
  assert.equal(stage.sky.userData.material.uniforms.uNebula.value, 1);
  assert.equal(closed, 1);
  assert.equal(disposed, 1);
  stage.surface.geometry.dispose(); earthMaterial.dispose();
});
