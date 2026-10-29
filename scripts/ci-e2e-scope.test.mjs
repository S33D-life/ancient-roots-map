import test from 'node:test';
import assert from 'node:assert/strict';
import { DOCS_ONLY, classifyE2EPaths } from './ci-e2e-scope.mjs';

test('four precisely scoped documentation files may skip Playwright on PRs', () => {
  assert.equal(classifyE2EPaths([...DOCS_ONLY], 'pull_request').runFull, false);
});
test('one shared agent guide edit may skip on a PR', () => {
  assert.equal(classifyE2EPaths(['AGENTS.md'], 'pull_request').runFull, false);
});
test('push to main always runs full browser tests', () => {
  assert.equal(classifyE2EPaths([...DOCS_ONLY], 'push').runFull, true);
});
test('empty or unverified changed-file list fails closed', () => {
  assert.equal(classifyE2EPaths([], 'pull_request').runFull, true);
  assert.equal(classifyE2EPaths(undefined, 'pull_request').runFull, true);
});
test('Council, TETOL and app changes run the full browser tests', () => {
  for (const path of ['src/pages/council/Circle238Page.tsx', 'public/tetol/circle-235/pre-fire/runtime/entry.js', 'supabase/functions/_shared/currentCircle.ts']) {
    assert.equal(classifyE2EPaths(['AGENTS.md', path], 'pull_request').runFull, true, path);
  }
});
test('test scripts, workflow and unknown docs also trigger full suite', () => {
  for (const path of ['.github/workflows/ci.yml', 'scripts/ci-e2e-scope.mjs', 'README.md', 'docs/releases/RELEASE.md', '.github/pull_request_template.yml']) {
    assert.equal(classifyE2EPaths([path], 'pull_request').runFull, true, path);
  }
});
test('never skip on a non-pull_request trigger, even with allowlisted files', () => {
  for (const event of ['workflow_dispatch', 'schedule', undefined]) {
    assert.equal(classifyE2EPaths(['CURRENT_TASKS.md'], event).runFull, true);
  }
});

test('CLI writes a full-run decision in normal relative invocation', async () => {
  const { execFileSync } = await import('node:child_process');
  const { mkdtempSync, readFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = mkdtempSync(join(tmpdir(), 's33d-e2e-gate-'));
  try {
    const output = join(dir, 'github-output');
    execFileSync(process.execPath, ['scripts/ci-e2e-scope.mjs'], {
      cwd: new URL('..', import.meta.url),
      env: { ...process.env, GITHUB_EVENT_NAME: 'push', GITHUB_OUTPUT: output },
    });
    assert.match(readFileSync(output, 'utf8'), /^run_full=true\n$/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
