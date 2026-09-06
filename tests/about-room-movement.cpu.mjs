import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTypeScript } from '../scripts/test-load-ts.mjs';

const { bindRoomMovement } = loadTypeScript('components/portfolio/roomMovement.ts');

class Surface extends EventTarget {
  dataset = {};
  captured = new Set();
  getBoundingClientRect() { return { width: 500, height: 400 }; }
  setPointerCapture(id) { this.captured.add(id); }
  hasPointerCapture(id) { return this.captured.has(id); }
  releasePointerCapture(id) { this.captured.delete(id); }
}
function event(host, type, values = {}) {
  const e = new Event(type, { cancelable: true });
  Object.assign(e, { pointerId: 1, isPrimary: true, button: 0, pointerType: 'mouse', clientX: 100, clientY: 100, detail: 1, ...values });
  host.dispatchEvent(e);
  return e;
}
function setup() {
  const host = new Surface();
  let position = { x: 0, y: 0 };
  const controller = bindRoomMovement(host, next => { position = next; });
  return { host, controller, get position() { return position; } };
}

test('a long drag is bounded and a drag ending on the computer is not a click', () => {
  const f = setup();
  event(f.host, 'pointerdown');
  event(f.host, 'pointermove', { clientX: 2000, clientY: -2000 });
  event(f.host, 'pointerup', { clientX: 2000, clientY: -2000 });
  assert.equal(f.position.x, 1);
  assert.equal(f.position.y, -1);
  assert.equal(event(f.host, 'click').defaultPrevented, true);
  assert.equal(f.host.captured.size, 0);
});

test('small pointer jitter keeps computer clicks and keyboard activation available', () => {
  const f = setup();
  event(f.host, 'pointerdown');
  event(f.host, 'pointermove', { clientX: 103 });
  event(f.host, 'pointerup');
  assert.equal(event(f.host, 'click').defaultPrevented, false);
  assert.equal(f.position.x, 0);
  event(f.host, 'pointerdown');
  event(f.host, 'pointermove', { clientX: 220 });
  event(f.host, 'pointerup');
  assert.equal(event(f.host, 'click', { detail: 0 }).defaultPrevented, false);
  event(f.host, 'pointerdown');
  event(f.host, 'pointerup');
  assert.equal(event(f.host, 'click').defaultPrevented, false);
});

test('vertical touch gestures scroll; horizontal touch moves the room without vertical drift', () => {
  const f = setup();
  event(f.host, 'pointerdown', { pointerType: 'touch' });
  assert.equal(event(f.host, 'pointermove', { pointerType: 'touch', clientX: 103, clientY: 180 }).defaultPrevented, false);
  assert.equal(f.position.x, 0);
  event(f.host, 'pointercancel', { pointerType: 'touch' });
  event(f.host, 'pointerdown', { pointerType: 'touch' });
  assert.equal(event(f.host, 'pointermove', { pointerType: 'touch', clientX: 180, clientY: 110 }).defaultPrevented, true);
  assert.ok(f.position.x > 0);
  assert.equal(f.position.y, 0);
});

test('arrow keys are bounded, Home and reset restore the initial composition', () => {
  const f = setup();
  for (let i = 0; i < 20; i++) event(f.host, 'keydown', { key: 'ArrowRight' });
  assert.equal(f.position.x, 1);
  event(f.host, 'keydown', { key: 'ArrowUp' });
  assert.ok(f.position.y < 0);
  event(f.host, 'keydown', { key: 'Home' });
  assert.equal(f.position.x, 0);
  assert.equal(f.position.y, 0);
  event(f.host, 'keydown', { key: 'ArrowLeft' });
  f.controller.reset();
  assert.equal(f.position.x, 0);
});

test('secondary input does not take over a drag; disposal removes input listeners', () => {
  const f = setup();
  event(f.host, 'pointerdown', { button: 2 });
  event(f.host, 'pointermove', { clientX: 250 });
  assert.equal(f.position.x, 0);
  event(f.host, 'pointerdown');
  event(f.host, 'pointermove', { pointerId: 2, clientX: 250 });
  assert.equal(f.position.x, 0);
  f.controller.dispose();
  event(f.host, 'pointermove', { clientX: 250 });
  event(f.host, 'keydown', { key: 'ArrowRight' });
  assert.equal(f.position.x, 0);
});

test('leaving before the drag threshold cannot leave the room stuck on an old pointer', () => {
  const f = setup();
  event(f.host, 'pointerdown');
  event(f.host, 'pointerleave');
  event(f.host, 'pointerdown', { pointerId: 3 });
  event(f.host, 'pointermove', { pointerId: 3, clientX: 220 });
  assert.ok(f.position.x > 0);
});
