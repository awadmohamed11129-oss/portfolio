import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export function captureSource() {
  const sourceRoot = path.resolve(process.env.QA_SOURCE_ROOT || process.cwd());
  const entries: { path: string; bytes: number; sha256: string }[] = [];
  function record(relative: string) {
    const full = path.join(sourceRoot, relative);
    if (!existsSync(full)) return;
    if (statSync(full).isDirectory()) {
      for (const name of readdirSync(full).sort()) record(path.join(relative, name));
    } else {
      const data = readFileSync(full);
      entries.push({ path: relative.replaceAll('\\', '/'), bytes: data.byteLength, sha256: createHash('sha256').update(data).digest('hex') });
    }
  }
  for (const root of ['app', 'components', 'content', 'lib', 'public', 'package.json', 'package-lock.json', 'next.config.ts', 'tsconfig.json']) record(root);
  const snapshot = {
    capturedAt: new Date().toISOString(),
    sourceRoot,
    preview: process.env.QA_BASE_URL || 'http://127.0.0.1:5200',
    head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: sourceRoot, encoding: 'utf8' }).trim(),
    branch: execFileSync('git', ['branch', '--show-current'], { cwd: sourceRoot, encoding: 'utf8' }).trim(),
    buildId: existsSync(path.join(sourceRoot, '.next', 'BUILD_ID')) ? readFileSync(path.join(sourceRoot, '.next', 'BUILD_ID'), 'utf8').trim() : null,
    sourceHash: createHash('sha256').update(JSON.stringify(entries)).digest('hex'),
    note: 'Disk source snapshot. A running preview must be rebuilt/restarted from this state for a production-bundle claim; HMR may change during a run.',
    entries,
  };
  return snapshot;
}

export default function globalSetup() {
  const snapshot = captureSource();
  mkdirSync('docs/qa', { recursive: true });
  writeFileSync('docs/qa/source-snapshot.json', JSON.stringify(snapshot, null, 2));
  console.log(`QA source ${snapshot.head} / ${snapshot.sourceHash} (${snapshot.entries.length} files) at ${snapshot.preview}`);
  return () => {
    const ending = captureSource();
    const sourceChanged = ending.sourceHash !== snapshot.sourceHash;
    writeFileSync('docs/qa/source-snapshot-end.json', JSON.stringify({ ...ending, sourceChanged, startHash: snapshot.sourceHash }, null, 2));
    console.log(`QA source at finish ${ending.sourceHash}; changed during run: ${sourceChanged}`);
    if (sourceChanged || ending.buildId !== snapshot.buildId) throw new Error('QA artifact changed during the run; mixed source/build evidence cannot pass the frozen-artifact gate.');
  };
}
