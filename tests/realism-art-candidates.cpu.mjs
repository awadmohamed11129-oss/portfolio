import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { test } from 'node:test';
import ts from 'typescript';
import sharp from 'sharp';
import * as three from 'three';
import * as bufferUtils from 'three/addons/utils/BufferGeometryUtils.js';

const root = path.resolve(process.env.QA_ART_SOURCE_ROOT || process.cwd());
const promoted = process.env.QA_ART_PROMOTED === '1';
assert.ok(!promoted || process.env.QA_ART_BASELINE_ROOT, 'Promoted mode requires explicit preserved QA_ART_BASELINE_ROOT; provenance cannot be skipped');
const baselineRoot = path.resolve(process.env.QA_ART_BASELINE_ROOT || root);
const coastReceiptFile = process.env.QA_COAST_RECEIPT || 'assets-src/world/realism/variants/coast-v3/receipt.json';
const asphaltFile = 'assets-src/world/realism/variants/asphalt-512-v2-margin/receipt.json';
const sha = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
function load(file) {
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require(id) {
    if (id === 'three') return three;
    assert.equal(id, 'three/addons/utils/BufferGeometryUtils.js'); return bufferUtils;
  } });
  return exports;
}
const coastReceipt = JSON.parse(fs.readFileSync(path.join(root, coastReceiptFile)));
const coastFile = coastReceipt.source;
assert.equal(sha(fs.readFileSync(path.join(root, coastFile))), coastReceipt.sha256);
if (promoted) assert.equal(sha(fs.readFileSync(path.join(root, coastReceipt.intendedDestination))), coastReceipt.sha256, 'Promoted coast must equal reviewed candidate');
const { createCoast } = load(promoted ? coastReceipt.intendedDestination : coastFile);
const { ArtResources } = load('lib/world/art/resources.ts');
for (const quality of ['high', 'low']) test(`coast ${quality}: upward triangles, continuous shoreline, no water-side land or shared-material mutation`, () => {
  const resources = new ArtResources();
  const groundMap = resources.texture(new three.Texture()), waterMap = resources.texture(new three.Texture());
  groundMap.repeat.set(8, 8);
  const groundSource = resources.material(new three.MeshStandardMaterial({ map: groundMap, color: '#8e969e' }));
  const waterSource = resources.material(new three.MeshStandardMaterial({ normalMap: waterMap }));
  const material = { ground: groundSource, water: waterSource, maps: new Map([['water-normal', waterMap]]) };
  try {
    const [lake, ground] = createCoast(resources, material, quality);
    assert.notEqual(ground.material, groundSource); assert.notEqual(lake.material, waterSource);
    assert.equal(groundSource.color.getHexString(), '8e969e'); assert.equal(groundSource.transparent, false);
    assert.equal(ground.material.map, groundMap); assert.equal(lake.material.normalMap, waterMap);
    assert.equal(resources.textures.size, 2, 'Coast must not add texture acquisition');
    assert.equal(ground.material.transparent, false); assert.equal(ground.material.depthWrite, true);
    const position = ground.geometry.getAttribute('position'), indices = ground.geometry.index;
    assert.equal(indices.count / 3, 280); assert.equal(position.count, 168);
    const a = new three.Vector3(), b = new three.Vector3(), c = new three.Vector3();
    for (let i = 0; i < indices.count; i += 3) {
      a.fromBufferAttribute(position, indices.getX(i)); b.fromBufferAttribute(position, indices.getX(i + 1)); c.fromBufferAttribute(position, indices.getX(i + 2));
      assert.ok(b.sub(a).cross(c.sub(a)).y > 0, 'No degenerate or downward-facing land triangle');
    }
    ground.updateMatrixWorld(true);
    const ray = new three.Raycaster();
    function covered(x, z) { ray.set(new three.Vector3(x, 10, z), new three.Vector3(0, -1, 0)); return ray.intersectObject(ground).length > 0; }
    for (const x of [-124, -117, -40, 0, 117, 124]) {
      assert.ok(covered(x, 34.99), 'Central land must reach unchanged shore');
      assert.equal(covered(x, 35.01), false, 'Land must not cover the water beyond central shore');
    }
    for (const [x, z] of [[-900,-300],[-400,-200],[400,-200],[900,-300],[0,-1500],[1200,-1000],[-1200,-1000]]) assert.ok(covered(x, z));
    const waterPosition = lake.geometry.getAttribute('position'), uv = lake.geometry.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) {
      assert.ok(Math.abs(uv.getX(i) - (waterPosition.getX(i) / 1400 + .5)) < 1e-6);
      assert.ok(Math.abs(uv.getY(i) - (-waterPosition.getZ(i) / 1400 + .5)) < 1e-6);
    }
    const owned = [...resources.geometries, ...resources.materials, ...resources.textures];
    const disposalCounts = new Map(owned.map(resource => [resource, 0]));
    for (const resource of owned) resource.addEventListener('dispose', () => disposalCounts.set(resource, disposalCounts.get(resource) + 1));
    resources.dispose(); resources.dispose();
    assert.ok([...disposalCounts.values()].every(count => count === 1));
  } finally { resources.dispose(); }
});

const asphaltReceipt = JSON.parse(fs.readFileSync(path.join(root, asphaltFile)));
for (const record of asphaltReceipt.records) test(`asphalt ${record.kind}: independently reconstruct exact filtered WebP from source`, async () => {
  const source = fs.readFileSync(path.join(root, record.source));
  const candidate = fs.readFileSync(path.join(root, record.path));
  const baseline = fs.readFileSync(path.join(baselineRoot, record.baselinePath));
  if (promoted) assert.equal(sha(fs.readFileSync(path.join(root, record.baselinePath))), record.sha256, 'Promoted public texture must equal reviewed derivative');
  assert.equal(sha(source), record.sourceSha256); assert.equal(sha(candidate), record.sha256); assert.equal(sha(baseline), record.baselineSha256);
  assert.equal(candidate.length, record.bytes); assert.equal(baseline.length - candidate.length, record.savedBytes);
  const decoded = await sharp(source).removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
  assert.deepEqual([decoded.info.width, decoded.info.height, decoded.info.channels], [1024, 1024, 3]);
  if (record.kind !== 'color') {
    const untouchedData = await sharp(source).removeAlpha().raw().toBuffer();
    assert.deepEqual(decoded.data, untouchedData, 'Color-space conversion must not gamma-transform normal/roughness data');
  }
  const result = Buffer.alloc(512 * 512 * 3);
  const toLinear = n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4;
  const toSrgb = n => n <= .0031308 ? n * 12.92 : 1.055 * n ** (1 / 2.4) - .055;
  for (let outputPixel = 0; outputPixel < 512 * 512; outputPixel++) {
    const x = outputPixel % 512, y = Math.floor(outputPixel / 512);
    const average = [0, 0, 0];
    for (const [dx, dy] of [[0,0],[1,0],[0,1],[1,1]]) {
      const offset = ((2 * y + dy) * 1024 + 2 * x + dx) * 3;
      const values = Array.from(decoded.data.subarray(offset, offset + 3), n => n / 255);
      if (record.kind === 'normal') {
        const normal = values.map(n => n * 2 - 1), magnitude = Math.hypot(...normal);
        assert.ok(magnitude > 0);
        for (let channel = 0; channel < 3; channel++) average[channel] += normal[channel] / magnitude / 4;
      } else for (let channel = 0; channel < 3; channel++) average[channel] += (record.kind === 'color' ? toLinear(values[channel]) : values[channel]) / 4;
    }
    const normalLength = record.kind === 'normal' ? Math.hypot(...average) : 1;
    assert.ok(normalLength > 0);
    for (let channel = 0; channel < 3; channel++) {
      const value = record.kind === 'color' ? toSrgb(average[channel]) : record.kind === 'normal' ? (average[channel] / normalLength + 1) / 2 : average[channel];
      result[outputPixel * 3 + channel] = Math.round(255 * Math.min(1, Math.max(0, value)));
    }
  }
  // In-memory encoding only; no owner files or runtime assets are written.
  const encoded = await sharp(result, { raw: { width: 512, height: 512, channels: 3 } }).webp(record.webp).toBuffer();
  assert.equal(sha(encoded), record.sha256, 'Exact reconstruction verifies processing plus codec options');
});

test('water alternative preserves alpha/TBN pipeline and reorients its second normal sample safely', async () => {
  const receipt = JSON.parse(fs.readFileSync(path.join(root, 'assets-src/world/realism/variants/coast-v3/water-receipt.json')));
  assert.equal(sha(fs.readFileSync(path.join(root, receipt.source))), receipt.sha256);
  const { createCoast: createWaterCoast } = load(receipt.source);
  const resources = new ArtResources();
  const map = resources.texture(new three.Texture());
  const ground = resources.material(new three.MeshStandardMaterial()), water = resources.material(new three.MeshStandardMaterial());
  try {
    const [lake] = createWaterCoast(resources, { ground, water, maps:new Map([['water-normal',map]]) }, 'high');
    assert.equal(lake.material.normalMap, map); assert.equal(resources.textures.size, 1);
    assert.deepEqual(lake.material.normalScale.toArray(), [.12, .17]);
    const shader = { vertexShader:three.ShaderLib.standard.vertexShader, fragmentShader:three.ShaderLib.standard.fragmentShader };
    lake.material.onBeforeCompile(shader, {});
    assert.ok(shader.vertexShader.includes('vArtPosition = position;'));
    assert.ok(shader.fragmentShader.includes('diffuseColor.a *= 1.0-smoothstep(2600.0,3200.0,length(vArtPosition.xz))'));
    assert.ok(shader.fragmentShader.includes('mapN.xy *= normalScale;'));
    assert.ok(shader.fragmentShader.includes('normal = normalize( tbn * mapN );'));
    assert.ok(shader.fragmentShader.includes('#ifdef USE_NORMALMAP_OBJECTSPACE'));
    assert.ok(shader.fragmentShader.includes('#elif defined( USE_NORMALMAP_TANGENTSPACE )'));
    assert.ok(shader.fragmentShader.includes('#elif defined( USE_BUMPMAP )'));
    assert.equal(shader.fragmentShader.includes('#include <normal_fragment_maps>'), false);
    const match = shader.fragmentShader.match(/mat2 waterRotation = mat2\(([^)]+)\)/);
    const inverseMatch = shader.fragmentShader.match(/waterB\.xy = mat2\(([^)]+)\)/);
    assert.ok(match && inverseMatch);
    const rotation = match[1].split(',').map(Number), inverse = inverseMatch[1].split(',').map(Number);
    const apply = (matrix, x, y) => [matrix[0]*x+matrix[2]*y, matrix[1]*x+matrix[3]*y]; // GLSL column-major.
    const rotated = apply(rotation, 1, 0); assert.ok(rotated[1] < 0, 'UV rotation is clockwise');
    for (const v of [[1,0],[0,1],[.3,-.7]]) {
      const output = apply(inverse, ...apply(rotation, ...v));
      assert.ok(Math.hypot(output[0]-v[0], output[1]-v[1]) < 1e-7);
    }
    const image = await sharp(path.join(root, 'public/world/textures/water-normal.webp')).removeAlpha().raw().toBuffer({resolveWithObject:true});
    let minimumZ = 1;
    for (let i = 0; i < image.data.length; i += image.info.channels) minimumZ = Math.min(minimumZ, image.data[i+2]/255*2-1);
    assert.ok(minimumZ > 0, 'Positive-Z map and bilinear/mip interpolation keep the rotated normal sum nonzero');
  } finally { resources.dispose(); }
});
