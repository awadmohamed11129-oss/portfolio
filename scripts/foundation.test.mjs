import assert from 'node:assert/strict';
import test from 'node:test';
import { pavescan } from '../content/facts.ts';
import { destinationForPath, destinationForFragment } from '../lib/portfolio/contracts.ts';

test('the public survey facts use the September scored extent and priority counts', () => {
  assert.equal(pavescan.routeKm.value, '3.571 km');
  assert.equal(pavescan.critical.value, '1');
  assert.equal(pavescan.defects.value, '385');
  assert.equal(pavescan.scored.value, '377');
  assert.equal(pavescan.shadowSuspects.value, '275');
  assert.equal(pavescan.sampleUnits.value, '55');
  assert.equal(pavescan.segments.value, '38');
});

test('nested case paths and legacy fragment destinations resolve consistently', () => {
  assert.equal(destinationForPath('/projects/pavescan-ai?view=detail#evidence'), 'projects');
  assert.equal(destinationForPath('/projects-other'), 'home');
  assert.equal(destinationForFragment('#skills'), 'experience');
  assert.equal(destinationForFragment('#contact'), 'contact');
});

test('resume and contact are content destinations with stable direct and legacy routes', () => {
  assert.equal(destinationForPath('/resume'), 'resume');
  assert.equal(destinationForPath('/contact?from=footer'), 'contact');
  assert.equal(destinationForFragment('#resume'), 'resume');
});
