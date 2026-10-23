/** Local static frontend replacement/restoration only. No deployment or backend operations.
 * Usage: node scripts/rehearse-circle237-frontend-rollback.mjs BASE_DIST CANDIDATE_DIST
 */
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const [baseline, candidate] = process.argv.slice(2).map(p => resolve(p));
if (!baseline || !candidate || baseline === candidate) throw new Error('Supply distinct immutable baseline and candidate dist directories');
async function files(root, prefix = '') {
  const result = [];
  for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
    const name = join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Artifact may not contain symlinks');
    if (entry.isDirectory()) result.push(...await files(root, name));
    else result.push(name);
  }
  return result.sort();
}
const hash = data => createHash('sha256').update(data).digest('hex');
async function manifest(root) {
  return Object.fromEntries(await Promise.all((await files(root)).map(async file => [file, hash(await readFile(join(root, file)))])));
}
const manifests = { baseline: await manifest(baseline), candidate: await manifest(candidate) };
let active = baseline;
const server = createServer(async (request, response) => {
  try {
    const name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let path = resolve(active, '.' + name);
    if (!path.startsWith(active + '/') && path !== active) { response.writeHead(403).end(); return; }
    if (['/', '/council-of-life', '/council/237'].includes(name)) path = join(active, 'index.html');
    const bytes = await readFile(path);
    response.writeHead(200, { 'Cache-Control': 'no-store', 'Content-Type': path.endsWith('.html') ? 'text/html' : 'application/octet-stream' });
    response.end(bytes);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const results = [];
try {
  for (const state of ['baseline', 'candidate', 'restored-baseline']) {
    const base = state === 'candidate' ? candidate : baseline;
    active = base;
    const expected = state === 'candidate' ? manifests.candidate : manifests.baseline;
    for (const [file, digest] of Object.entries(expected)) {
      const response = await fetch(`${origin}/${file}`);
      assert.equal(response.status, 200);
      assert.equal(hash(Buffer.from(await response.arrayBuffer())), digest, `Served bytes differ: ${state}/${file}`);
    }
    for (const route of ['/council-of-life', '/council/237']) {
      assert.equal(hash(Buffer.from(await (await fetch(origin + route)).arrayBuffer())), expected['index.html']);
    }
    assert.deepEqual(await manifest(base), expected, 'Rehearsal must not rewrite artifacts');
    results.push({ state, filesVerified: Object.keys(expected).length, manifestSha256: hash(JSON.stringify(expected)), routes: 'SPA index fallback byte parity PASS' });
  }
  console.log(JSON.stringify({ result: 'PASS', scope: 'LOCAL static replacement/restoration; not Lovable or service-worker recovery', results }, null, 2));
} finally { await new Promise(resolve => server.close(resolve)); }
