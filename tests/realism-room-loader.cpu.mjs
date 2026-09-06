import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import sharp from 'sharp';

// Actual loader, GLB parser and CPU image codec. Browser bitmap transport and
// public-file fetches are adapted; no renderer/camera or real network is used.
const roomRoot = path.resolve(process.env.QA_ROOM_SOURCE_ROOT || process.env.QA_SOURCE_ROOT || process.cwd());
const worldRoot = path.resolve(process.env.QA_WORLD_SOURCE_ROOT || process.env.QA_SOURCE_ROOT || roomRoot);
const cache = new Map();
function loadTs(filename) {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename).exports;
  const loaded = { exports: {} };
  cache.set(filename, loaded);
  const native = createRequire(filename);
  const requireModule = specifier => {
    if (specifier.startsWith('@/') || specifier.startsWith('.')) {
      const target = specifier.startsWith('@/') ? path.join(roomRoot, specifier.slice(2)) : path.resolve(path.dirname(filename), specifier);
      if (fs.existsSync(`${target}.ts`)) return loadTs(`${target}.ts`);
    }
    return native(specifier);
  };
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', code)(requireModule, loaded, loaded.exports);
  return loaded.exports;
}
const { RoomResources } = loadTs(path.join(roomRoot, 'lib/room/RoomResources.ts'));
const { loadAuthoredRoom, ROOM_ASSETS } = loadTs(path.join(roomRoot, 'lib/room/authoredRoomAsset.ts'));
const { createRoom } = loadTs(path.join(roomRoot, 'components/room/createRoom.ts'));
const { PreparationBudget } = loadTs(path.join(worldRoot, 'lib/world/PreparationBudget.ts'));
const model = fs.readFileSync(path.join(roomRoot, 'public', ROOM_ASSETS.low.model));
const descriptor = fs.readFileSync(path.join(roomRoot, 'public', ROOM_ASSETS.low.info));
const jsonLength = model.readUInt32LE(12);
const document = JSON.parse(model.toString('utf8', 20, 20 + jsonLength));
const expectedImages = new Set((document.textures ?? []).map(texture => texture.source ?? texture.extensions?.EXT_texture_webp?.source)).size;

function deferred() {
  let resolve;
  const promise = new Promise(yes => { resolve = yes; });
  return { promise, resolve };
}
async function until(predicate, message) {
  const limit = performance.now() + 5000;
  while (!predicate()) {
    if (performance.now() >= limit) throw new Error(message);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

async function environment(run) {
  const original = { fetch: globalThis.fetch, bitmap: globalThis.createImageBitmap, self: globalThis.self, own: RoomResources.prototype.own, error: console.error };
  const stats = { decoded: 0, decodeFinished: 0, decodeFailed: 0, bitmaps: [], resources: new Map(), requests: [], errors: [] };
  let transport = 'valid';
  const stalledInfo = deferred();
  const damaged = Buffer.from(model);
  const imageView = document.bufferViews[document.images[0].bufferView];
  const imageStart = 20 + jsonLength + 8 + (imageView.byteOffset ?? 0);
  damaged.fill(0, imageStart, imageStart + imageView.byteLength);
  globalThis.self = globalThis;
  console.error = (...args) => stats.errors.push(args.map(String).join(' '));
  RoomResources.prototype.own = function (resource) {
    if (!stats.resources.has(resource)) {
      const record = { kind: resource.isTexture ? 'texture' : resource.isMaterial ? 'material' : 'geometry', disposals: 0 };
      stats.resources.set(resource, record);
      resource.addEventListener('dispose', () => record.disposals++);
    }
    return original.own.call(this, resource);
  };
  globalThis.createImageBitmap = async blob => {
    try {
      const raw = await sharp(Buffer.from(await blob.arrayBuffer())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      let pixels = raw.data;
      const record = { width: raw.info.width, height: raw.info.height, closes: 0 };
      stats.bitmaps.push(record); stats.decoded++;
      return { width: raw.info.width, height: raw.info.height, close() { record.closes++; pixels = null; this.width = 0; this.height = 0; }, get hasPixels() { return pixels !== null; } };
    } catch (error) { stats.decodeFailed++; throw error; }
    finally { stats.decodeFinished++; }
  };
  globalThis.fetch = async (input, options) => {
    const url = typeof input === 'string' ? input : input.url ?? String(input);
    if (url.startsWith('blob:') || url.startsWith('data:')) return original.fetch(input, options);
    stats.requests.push({ url, signal: options?.signal });
    if (url === ROOM_ASSETS.low.model) return new Response(transport === 'corrupt' ? damaged : model);
    if (url === ROOM_ASSETS.low.info) return transport === 'stalled' ? stalledInfo.promise : new Response(descriptor);
    throw new Error(`Unexpected asset request in isolated CPU loader test: ${url}`);
  };
  const released = () => stats.bitmaps.every(bitmap => bitmap.closes === 1) && [...stats.resources.values()].every(resource => resource.disposals === 1);
  try { await run({ stats, setTransport(value) { transport = value; }, stalledInfo, released }); }
  finally {
    globalThis.fetch = original.fetch;
    if (original.bitmap === undefined) delete globalThis.createImageBitmap; else globalThis.createImageBitmap = original.bitmap;
    if (original.self === undefined) delete globalThis.self; else globalThis.self = original.self;
    RoomResources.prototype.own = original.own;
    console.error = original.error;
  }
}

test('actual corrected GLB adapts UV1 indirect carrier and releases each bitmap/resource once', async () => environment(async ({ stats, released }) => {
  const scope = new RoomResources();
  const { gltf, info } = await loadAuthoredRoom('low', scope);
  assert.equal(info.bakedIndirect, true, 'This gate requires the delivered baked asset, not an unbaked placeholder');
  let carriers = 0;
  gltf.scene.traverse(object => {
    if (!object.isMesh) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!material.userData.room_indirect_carrier) continue;
      carriers++;
      assert.ok(object.geometry.getAttribute('uv1'));
      assert.equal(material.aoMap, null);
      assert.ok(material.lightMap);
      assert.equal(material.lightMap.channel, info.lightmap.uvChannel);
      assert.equal(material.lightMap.colorSpace, 'srgb');
      assert.equal(material.lightMap.flipY, false);
      assert.equal(material.lightMapIntensity, info.lightmap.gain);
    }
  });
  assert.ok(carriers > 0);
  assert.equal(stats.decoded, expectedImages);
  scope.dispose(); scope.dispose();
  assert.ok(released());
}));

test('async real factory transfers ownership and removes abort disposal after successful handoff', async () => environment(async ({ stats, released }) => {
  const controller = new AbortController();
  const handle = await createRoom({ quality: 'low', signal: controller.signal });
  assert.deepEqual(handle.targets.map(target => target.id), ['monitor', 'phone']);
  for (const name of ['window', 'lamp-diffuser']) assert.ok(handle.group.children.some(child => child.name === name));
  assert.ok(stats.bitmaps.every(bitmap => bitmap.closes === 0));
  controller.abort();
  assert.ok(stats.bitmaps.every(bitmap => bitmap.closes === 0), 'Successful acquisition signal must no longer own the live handle');
  handle.dispose(); handle.dispose();
  assert.equal(handle.group.children.length, 0);
  assert.ok(released());
}));

test('corrupt embedded image rejects the real GLTF parse and releases late successful dependencies', async () => environment(async ({ stats, setTransport, released }) => {
  setTransport('corrupt');
  await assert.rejects(loadAuthoredRoom('low', new RoomResources()), /Required room texture .* failed to decode/);
  await until(() => stats.decodeFinished >= expectedImages && released(), 'Failed GLB parse did not release every completed late dependency');
  assert.ok(stats.decodeFailed > 0, 'The real CPU decoder must actually reject corrupted image bytes');
  assert.ok(stats.decoded > 0, 'Other embedded images must really decode to exercise partial cleanup');
  assert.ok(stats.errors.some(error => /texture/i.test(error)));
}));

test('actual deadline abort frees decoded model while descriptor is stalled, then fresh retry succeeds', async () => environment(async ({ stats, setTransport, stalledInfo, released }) => {
  setTransport('stalled');
  const budget = new PreparationBudget(80);
  budget.setPaused(true); // Ensure model decoding precedes the timed failure.
  assert.ok(budget.signal);
  const loading = loadAuthoredRoom('low', new RoomResources(), budget.signal);
  const loadOutcome = loading.then(() => ({ resolved: true }), error => ({ error }));
  const budgetOutcome = budget.wait(loading).then(() => ({ resolved: true }), error => ({ error }));
  try {
    await until(() => stats.decodeFinished >= expectedImages && [...stats.resources.values()].some(resource => resource.kind === 'geometry'), 'Model did not decode before the stalled companion test');
    assert.ok(stats.bitmaps.every(bitmap => bitmap.closes === 0));
    budget.setPaused(false);
    const outcome = await loadOutcome;
    assert.equal(outcome.error, budget.signal.reason);
    assert.equal(budget.signal.aborted, true);
    await budgetOutcome;
    await until(released, 'Abort did not release the in-flight model before descriptor resolution');
    const closedBeforeLateInfo = stats.bitmaps.reduce((sum, bitmap) => sum + bitmap.closes, 0);
    stalledInfo.resolve(new Response(descriptor));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(stats.bitmaps.reduce((sum, bitmap) => sum + bitmap.closes, 0), closedBeforeLateInfo);
    setTransport('valid');
    const retryScope = new RoomResources();
    const retried = await loadAuthoredRoom('low', retryScope);
    assert.ok(retried.gltf.scene.children.length);
    retryScope.dispose();
    assert.ok(released());
  } finally { budget.cancel(); }
}));

test('already-aborted acquisition performs no model or descriptor transport', async () => environment(async ({ stats }) => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(loadAuthoredRoom('low', new RoomResources(), controller.signal), error => error === controller.signal.reason);
  assert.equal(stats.requests.length, 0);
  assert.equal(stats.decoded, 0);
}));
