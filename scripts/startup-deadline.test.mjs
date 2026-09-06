import assert from 'node:assert/strict';
import { stageFixture } from './stage-test-fixture.mjs';

const stalled = stageFixture({ stalledPhoto: true });
await stalled.load();
assert.equal(stalled.state().ready, false);
await stalled.advance(15001);
assert.match(stalled.get('#loading').textContent ?? '', /view is unavailable/);
assert.equal(stalled.disposals(), 1);
await stalled.photoReady();
assert.equal(stalled.state().ready, false, 'Late photograph cannot resurrect timed-out scene');
stalled.cleanup();
console.log('PASS stalled opening photograph reaches fallback and cannot revive');

const ready = stageFixture();
await ready.load();
await ready.advance(15001);
assert.equal(ready.state().ready, true, 'Successful startup clears deadline');
ready.cleanup();
console.log('PASS successful startup clears deadline');

const disposed = stageFixture({ stalledPhoto: true });
disposed.cleanup();
await disposed.advance(15001);
assert.equal(disposed.get('#loading').textContent, undefined, 'Unmount cannot show stale fallback');
console.log('PASS disposed startup clears deadline');
