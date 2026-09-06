import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import path from 'node:path';
import { loadTypeScript } from './test-load-ts.mjs';

const { destinations, destinationForPath } = loadTypeScript('lib/journey/destinations.ts');
const { DESTINATIONS, DESTINATION_PATHS } = loadTypeScript('lib/portfolio/contracts.ts');
let checks = 0;
function check(name, run) { run(); checks++; console.log(`PASS ${name}`); }
check('all canonical destination ids registered and paths round-trip', () => {
  assert.deepEqual(Object.keys(destinations).sort(), [...DESTINATIONS].sort());
  for (const id of DESTINATIONS) {
    assert.equal(destinations[id].id, id);
    assert.equal(destinations[id].path, DESTINATION_PATHS[id]);
    assert.equal(destinationForPath(destinations[id].path), id);
  }
  for (const slug of ['pavescan-ai', 'civic-data-pipeline', 'localflow', 'pop-up-chapel']) {
    assert.equal(destinationForPath(`/projects/${slug}?preview=1#evidence`), 'projects');
  }
});
check('phase1 project Moon loader is lazy and all Moon manifest sizes are actual', () => {
  assert.equal(destinations.projects.body, 'moon');
  assert.equal(typeof destinations.projects.load, 'function');
  assert.ok(destinations.projects.manifest.length >= 2);
  const byBody = new Map();
  for (const spec of Object.values(destinations)) for (const asset of spec.manifest) {
    assert.ok(asset.src.startsWith('/') && !asset.src.startsWith('//'));
    const actual = statSync(path.join('public', asset.src)).size;
    assert.ok(actual > 0);
    assert.equal(asset.bytes, actual, `Manifest must report actual bytes: ${asset.src}`);
    const body = byBody.get(spec.body) ?? new Map();
    body.set(asset.src, actual); byBody.set(spec.body, body);
  }
  for (const [body, assets] of byBody) assert.ok([...assets.values()].reduce((sum, size) => sum + size, 0) <= 10_000_000, `${body} incremental manifest exceeds 10 MB`);
});
check('Moon arrival poses are finite for all acceptance viewport aspects', () => {
  assert.equal(destinations.projects.arrival.kind, 'fly');
  for (const aspect of [1440 / 900, 768 / 1024, 390 / 844]) {
    const pose = destinations.projects.arrival.pose(aspect);
    for (const value of Object.values(pose)) assert.ok(Number.isFinite(value));
    assert.ok(pose.altitude > 0);
  }
});
console.log(`${checks} destination registry checks passed.`);
