import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';

const base = process.env.PORTFOLIO_BASE_URL || 'http://127.0.0.1:5200';
const paths = ['/projects', '/experience', '/about', '/resume', '/contact', '/projects/pavescan-ai', '/projects/civic-data-pipeline', '/projects/pop-up-chapel', '/projects/localflow'];
const checks = [];
const targets = new Set(['/pdfs/Mohamad_Awad_Resume.pdf', '/pdfs/pavescan-sample-report.pdf', '/sitemap.xml']);
for (const path of paths) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `one h1: ${path}`);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#]*)"/g)) {
    const target = match[1].replaceAll('&amp;', '&').split('#')[0];
    if (!target.startsWith('//') && !target.startsWith('/_next/') && !target.startsWith('/go/')) targets.add(target);
  }
  checks.push({ path, status: response.status, h1: 1 });
}
for (const path of targets) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, `linked asset/route: ${path}`);
  if (path.endsWith('.pdf')) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), '%PDF-', path);
    checks.push({ path, status: 200, bytes: bytes.length, pdf: true });
  } else checks.push({ path, status: 200 });
}
const sitemap = await (await fetch(base + '/sitemap.xml')).text();
assert.ok(sitemap.includes('/resume</loc>') && sitemap.includes('/contact</loc>'), 'new destinations in sitemap');
mkdirSync('docs/qa/content-polish', { recursive: true });
const report = { at: new Date().toISOString(), base, status: 'PASS', destinations: paths.length, checks };
writeFileSync('docs/qa/content-polish/http.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ status: report.status, destinations: paths.length, routeAndAssetChecks: checks.length }));
