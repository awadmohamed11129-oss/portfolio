import assert from 'node:assert/strict';
import { loadTypeScript } from './test-load-ts.mjs';

const { flightPlan, flightPose, contentTiming } = loadTypeScript('lib/journey/flight.ts');
const { destinationFlightDuration, flightArcKm, lerpAltitude, smoothstep } = loadTypeScript('lib/journey/hero/math.ts');
let checks = 0;
function check(name, run) { run(); checks++; console.log(`PASS ${name}`); }
const from = { lat: 0, lon: 0, altitude: 1000 };
const to = { lat: 30, lon: 80, altitude: 2000 };
check('duration uses 2.2 second floor, distance slope and 5 second cap', () => {
  assert.equal(destinationFlightDuration(-10), 2.2);
  assert.equal(destinationFlightDuration(0), 2.2);
  assert.equal(destinationFlightDuration(1400), 3.2);
  assert.equal(destinationFlightDuration(3920), 5);
  assert.equal(destinationFlightDuration(100000), 5);
  const near = flightPlan(from, from);
  assert.equal(near.distance, 0); assert.equal(near.duration, 2200);
  const plan = flightPlan(from, to);
  assert.equal(plan.duration, destinationFlightDuration(plan.distance) * 1000);
  assert.equal(flightPlan(from, to, true).duration, 0);
});
check('flight preserves endpoints, clamps input, and does not mutate caller poses', () => {
  const plan = flightPlan(from, to);
  const start = flightPose(plan, -1);
  assert.equal(start.lat, from.lat); assert.equal(start.lon, from.lon);
  assert.ok(Math.abs(start.altitude - from.altitude) < 1e-8);
  const end = flightPose(plan, 2);
  assert.equal(end.lat, to.lat); assert.equal(end.lon, to.lon);
  assert.ok(Math.abs(end.altitude - to.altitude) < 1e-8);
  assert.notEqual(plan.from, from); assert.notEqual(plan.to, to);
});
check('altitude arc peaks at midpoint and remains bounded', () => {
  assert.equal(flightArcKm(0), 60); assert.equal(flightArcKm(1000), 120); assert.equal(flightArcKm(100000), 900);
  const plan = flightPlan(from, to);
  const arcAt = p => flightPose(plan, p).altitude - lerpAltitude(from.altitude, to.altitude, smoothstep(p));
  assert.ok(Math.abs(arcAt(.5) - plan.arc) < 1e-8);
  assert.ok(arcAt(.49) < arcAt(.5)); assert.ok(arcAt(.51) < arcAt(.5));
  assert.ok(Math.abs(arcAt(0)) < 1e-8); assert.ok(Math.abs(arcAt(1)) < 1e-8);
});
check('look target leads dolly with 1.4 progress and wraps the short longitude path', () => {
  const pose = flightPose(flightPlan(from, to), .25);
  assert.ok(Math.abs(pose.lat / to.lat - smoothstep(.25 * 1.4)) < 1e-9);
  assert.ok(pose.lat / to.lat > smoothstep(.25));
  const crossing = flightPose(flightPlan({ ...from, lon: 170 }, { ...to, lon: -170 }), .5);
  assert.ok(crossing.lon > 170 && crossing.lon <= 190);
});
check('copy timing boundaries retain fade-out and 600ms empty beat', () => {
  assert.equal(contentTiming(299, 5000), 'leave');
  assert.equal(contentTiming(300, 5000), 'empty');
  assert.equal(contentTiming(899, 5000), 'empty');
  assert.equal(contentTiming(900, 5000), 'arrive');
  assert.equal(contentTiming(0, 0), 'arrive');
});
console.log(`${checks} flight checks passed.`);
