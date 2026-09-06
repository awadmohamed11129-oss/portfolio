import assert from 'node:assert/strict';
import { loadTypeScript } from './test-load-ts.mjs';
const { destinations } = loadTypeScript('lib/journey/destinations.ts');
assert.equal(destinations.experience.body, 'jupiter', 'Experience must resolve its photographic Jupiter');
assert.equal(typeof destinations.experience.load, 'function', 'Experience loads its own surface');
for (const aspect of [1.6,.75,.462]) assert.ok(destinations.experience.arrival.pose(aspect).altitude > 0);
console.log('PASS Jupiter destination contract');
