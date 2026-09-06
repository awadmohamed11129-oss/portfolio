import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { captureSource } from './global-setup.ts';
import { assertGpuLease, leasePath } from './gpu-lease.mjs';

const preflightOnly = process.argv.includes('--preflight-only');
for (const key of ['QA_SOURCE_ROOT', 'QA_BASE_URL', 'QA_EXPECTED_BUILD', 'QA_EXPECTED_SOURCE_HASH', 'QA_RUN_NAME', 'QA_TASK_ID']) assert.ok(process.env[key], `${key} is required`);
const runName = process.env.QA_RUN_NAME;
assert.match(runName, /^[a-z0-9][a-z0-9-]+$/);
const output = path.join('docs/qa/realism-runs', runName);
const before = captureSource();
function assertIdentity(snapshot) {
  assert.equal(snapshot.buildId, process.env.QA_EXPECTED_BUILD, 'Frozen disk build changed');
  assert.equal(snapshot.sourceHash, process.env.QA_EXPECTED_SOURCE_HASH, 'Frozen runtime/public source changed');
}
assertIdentity(before);
assert.ok(!fs.existsSync(output), 'Never overwrite an existing QA run directory');
if (preflightOnly) {
  const lease = JSON.parse(fs.readFileSync(leasePath, 'utf8'));
  console.log(JSON.stringify({ mode:'CPU preflight only; no browser launched or run files written', output, build:before.buildId, sourceHash:before.sourceHash, files:before.entries.length, activeGpuOwner:lease.ownerTaskId, qaMayRender:lease.status === 'active' && lease.ownerTaskId === process.env.QA_TASK_ID }));
} else {
  await assertGpuLease();
  fs.mkdirSync(output, { recursive:true });
  fs.writeFileSync(path.join(output, 'source-before.json'), JSON.stringify(before, null, 2));
  const runs = [];
  let failure = null;
  async function execute(name, script, variables) {
    assertIdentity(captureSource());
    const lease = await assertGpuLease();
    fs.writeFileSync(path.join(output, `${name}-lease.json`), JSON.stringify(lease, null, 2));
    const log = fs.openSync(path.join(output, `${name}.log`), 'w');
    let result;
    try { result = spawnSync(process.execPath, [script], { env:{...process.env,...variables}, stdio:['ignore',log,log] }); }
    finally { fs.closeSync(log); }
    runs.push({name,script,exitCode:result.status,error:result.error?.message || null});
    console.log(JSON.stringify(runs.at(-1)));
    assert.equal(result.status, 0, `${name} failed; preserve its evidence and inspect the log`);
  }
  try {
    for (const [width,height] of [[2560,1440],[390,844],[768,1024]]) {
      await execute(`capture-${width}`, 'tests/capture-world-evidence.mjs', {
        QA_VISUAL:'1',QA_CAPTURE_SCOPE:'first-slice',QA_CAPTURE_WIDTH:String(width),QA_CAPTURE_HEIGHT:String(height),QA_CAPTURE_REVERSE:'1',QA_CAPTURE_OUTPUT:path.join(output,`frames-${width}`),
      });
    }
    await execute('wire', 'tests/realism-wire-slice.mjs', { QA_WIRE:'1',QA_WIRE_OUTPUT:path.join(output,'wire') });
  } catch (error) { failure = {message:error.message}; throw error; }
  finally {
    const after = captureSource();
    fs.writeFileSync(path.join(output, 'source-after.json'), JSON.stringify(after, null, 2));
    fs.writeFileSync(path.join(output, 'runner.json'), JSON.stringify({runs,failure,sourceUnchanged:before.sourceHash === after.sourceHash,buildUnchanged:before.buildId === after.buildId,scope:'First-slice native/motion/devices and wire only; no full performance, Axe or global/physical-device acceptance'}, null, 2));
    assertIdentity(after);
  }
}
