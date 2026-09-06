import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

export const leasePath = 'C:/Garage/civil-drone/archive/personal-portfolio-2026-09-05/realism/GPU-LEASE.json';
export async function assertGpuLease() {
  const lease = JSON.parse(await readFile(leasePath, 'utf8'));
  const task = process.env.QA_TASK_ID;
  assert.ok(task, 'Set QA_TASK_ID to the actual calling QA task');
  assert.equal(lease.status, 'active', 'GPU lease is not active');
  assert.equal(lease.ownerTaskId, task, 'GPU lease belongs to another task; no browser may launch');
  return lease;
}
