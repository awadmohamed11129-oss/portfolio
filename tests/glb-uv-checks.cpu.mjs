import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inspectGlbUv } from './inspect-glb-uv.mjs';

function glb(document) {
  const json = Buffer.from(JSON.stringify(document));
  const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20); json.copy(padded);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(20 + padded.length, 8);
  header.writeUInt32LE(padded.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  return Buffer.concat([header, padded]);
}
function fixture() {
  return { asset: { version: '2.0' }, materials: [{ pbrMetallicRoughness: { baseColorTexture: { index: 0, texCoord: 1 } }, emissiveTexture: { index: 1, texCoord: 2 } }],
    accessors: [{ count: 3, type: 'VEC3', componentType: 5126 }, { count: 3, type: 'VEC2', componentType: 5126 }, { count: 3, type: 'VEC2', componentType: 5126 }],
    meshes: [{ primitives: [{ material: 0, attributes: { POSITION: 0, TEXCOORD_1: 1, TEXCOORD_2: 2 } }] }] };
}
test('reports actual PBR1 and carrier2 channels without assuming receipt channel1', () => {
  const result = inspectGlbUv(glb(fixture()));
  assert.deepEqual(result.materials[0].bindings.map(binding => binding.effectiveTexCoord), [1, 2]);
  assert.deepEqual(result.findings, []);
});
test('honors transform channel override and flags a missing primitive channel', () => {
  const document = fixture();
  document.materials[0].pbrMetallicRoughness.baseColorTexture.extensions = { KHR_texture_transform: { texCoord: 0 } };
  const result = inspectGlbUv(glb(document));
  assert.equal(result.materials[0].bindings[0].effectiveTexCoord, 0);
  assert.equal(result.findings[0].missing, 'TEXCOORD_0');
});
test('omitted textureInfo texCoord means zero, not the first available set', () => {
  const document = fixture();
  delete document.materials[0].pbrMetallicRoughness.baseColorTexture.texCoord;
  assert.equal(inspectGlbUv(glb(document)).findings[0].missing, 'TEXCOORD_0');
});
test('rejects a truncated in-progress export', () => {
  const bytes = glb(fixture());
  assert.throws(() => inspectGlbUv(bytes.subarray(0, bytes.length - 4)), /incomplete/);
});
