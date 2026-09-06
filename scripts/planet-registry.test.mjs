import assert from 'node:assert/strict';
import test from 'node:test';
import { statSync } from 'node:fs';
import sharp from 'sharp';
import { loadTypeScript } from './test-load-ts.mjs';

const { destinations, destinationPose } = loadTypeScript('lib/journey/destinations.ts');
for (const [route, body] of [['experience', 'jupiter'], ['resume', 'mars'], ['contact', 'mercury']]) {
  test(`${route} has its own lazy photographic body and valid mobile/desktop files`, async () => {
    const destination = destinations[route];
    assert.equal(destination.body, body);
    const { moonSpec } = await destination.load();
    for (const phone of [false, true]) {
      const spec = moonSpec(phone);
      assert.equal(spec.id, body);
      const asset = destination.manifest.find(asset => asset.src === spec.map);
      assert.ok(asset, 'Loaded texture must be listed in the incremental manifest');
      assert.equal(statSync(`public${asset.src}`).size, asset.bytes);
      const metadata = await sharp(`public${spec.map}`).metadata();
      assert.equal(metadata.width, phone ? 2048 : body === 'jupiter' ? 3600 : 4096);
      assert.equal(metadata.height, metadata.width / 2);
      const statistics = await sharp(`public${spec.map}`).stats();
      assert.ok(statistics.channels.slice(0, 3).every(channel => channel.max > channel.min), 'Full image decode must contain surface detail');
      assert.equal(spec.clouds, false, 'Earth procedural clouds must not cover spacecraft imagery');
    }
    for (const aspect of [1440 / 900, 768 / 1024, 390 / 844]) {
      const pose = destinationPose(route, aspect);
      assert.deepEqual(pose, destination.arrival.pose(aspect));
      assert.ok(Object.values(pose).every(Number.isFinite));
      assert.ok(pose.altitude > 0);
    }
  });
}
