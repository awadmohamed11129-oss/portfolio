import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function inspectGlbUv(buffer) {
  if (buffer.length < 20 || buffer.readUInt32LE(0) !== 0x46546c67 || buffer.readUInt32LE(4) !== 2 || buffer.readUInt32LE(8) !== buffer.length) throw new Error('Invalid or incomplete GLB2 header/length');
  let document;
  for (let offset = 12; offset < buffer.length;) {
    if (offset + 8 > buffer.length) throw new Error('Truncated GLB chunk header');
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    offset += 8;
    if (length % 4 || offset + length > buffer.length) throw new Error('Invalid or truncated GLB chunk');
    if (type === 0x4e4f534a) document = JSON.parse(buffer.subarray(offset, offset + length).toString('utf8').replace(/\0+$/, '').trim());
    offset += length;
  }
  if (!document) throw new Error('GLB JSON chunk missing');
  const materials = (document.materials ?? []).map((material, index) => {
    const bindings = [];
    function walk(value, location = '') {
      if (!value || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value)) {
        const slot = location ? `${location}.${key}` : key;
        if (key.endsWith('Texture') && child && Number.isInteger(child.index)) {
          const effectiveTexCoord = child.extensions?.KHR_texture_transform?.texCoord ?? child.texCoord ?? 0;
          bindings.push({ slot, texture: child.index, declaredTexCoord: child.texCoord ?? 0, effectiveTexCoord, transformOverride: child.extensions?.KHR_texture_transform?.texCoord ?? null });
        } else if (key !== 'extras') walk(child, slot);
      }
    }
    walk(material);
    return { index, name: material.name ?? null, bindings };
  });
  const findings = [];
  const primitives = (document.meshes ?? []).flatMap((mesh, meshIndex) => (mesh.primitives ?? []).map((primitive, primitiveIndex) => {
    const attributes = primitive.attributes ?? {};
    const uvSets = Object.entries(attributes).filter(([name]) => name.startsWith('TEXCOORD_')).map(([name, accessor]) => ({ name, accessor, ...(document.accessors?.[accessor] ?? {}) }));
    for (const binding of materials[primitive.material]?.bindings ?? []) {
      const name = `TEXCOORD_${binding.effectiveTexCoord}`;
      if (!(name in attributes)) findings.push({ mesh: meshIndex, primitive: primitiveIndex, material: primitive.material, slot: binding.slot, missing: name });
    }
    return { mesh: meshIndex, meshName: mesh.name ?? null, primitive: primitiveIndex, material: primitive.material ?? null, positionCount: document.accessors?.[attributes.POSITION]?.count ?? null, uvSets };
  }));
  return { sha256: createHash('sha256').update(buffer).digest('hex'), bytes: buffer.length, generator: document.asset?.generator ?? null, materials, primitives, findings,
    scope: 'Exported material textureInfo and primitive UV attributes only. Compare these with the named lightmap-carrier receipt and runtime Texture.channel/geometry attribute adapter. No inferred bake role or visual/UV-scale pass.' };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw new Error('Usage: node tests/inspect-glb-uv.mjs <stable.glb> <docs/qa/output.json>');
  const before = fs.statSync(input);
  const result = inspectGlbUv(fs.readFileSync(input));
  const after = fs.statSync(input);
  if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw new Error('GLB changed while being read; wait for a stable asset receipt');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ sha256: result.sha256, materials: result.materials.length, primitives: result.primitives.length, missingUvBindings: result.findings.length, output }));
  if (result.findings.length) process.exitCode = 1;
}
