/**
 * Conservative E2E scope decision for the S33D GitHub CI workflow.
 * Only a nonempty, four-path documentation-only pull request may skip Playwright.
 * Any unknown file, event, SHA or git failure runs the full browser suite.
 * This gate never skips validate/security/static-Council/unit/build jobs.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const DOCS_ONLY = new Set([
  'AGENTS.md',
  'CLAUDE.md',
  'CURRENT_TASKS.md',
  '.github/pull_request_template.md',
]);

export function classifyE2EPaths(files, eventName) {
  if (eventName !== 'pull_request') return { runFull: true, why: 'Non-PR event: full coverage' };
  if (!Array.isArray(files) || files.length === 0) return { runFull: true, why: 'No verified changed paths: full coverage' };
  if (files.some((file) => !DOCS_ONLY.has(file))) return { runFull: true, why: 'Code, workflow, unknown or non-allowlisted paths: full coverage' };
  return { runFull: false, why: `Reviewed docs-only path allowlist (${files.length} changed file(s)); no browser tests executed` };
}

function decideFromGit(env) {
  const event = env.GITHUB_EVENT_NAME;
  if (event !== 'pull_request') return classifyE2EPaths([], event);
  const base = env.CI_BASE_SHA || '';
  const merge = env.CI_MERGE_SHA || '';
  const sha = /^[0-9a-f]{40}$/i;
  if (!sha.test(base) || !sha.test(merge)) return { runFull: true, why: 'Unverified base/merge SHA: full coverage' };
  try {
    // NUL-delimited paths; --no-renames makes a rename appear as delete + add.
    const result = execFileSync('git', ['diff', '--name-only', '-z', '--no-renames', base, merge], {
      encoding: 'utf8', maxBuffer: 1024 * 1024, timeout: 15000,
    });
    return classifyE2EPaths(result.split('\0').filter(Boolean), event);
  } catch {
    return { runFull: true, why: 'Git comparison unavailable: full coverage' };
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const { runFull, why } = decideFromGit(process.env);
  const decision = runFull ? 'true' : 'false';
  const { GITHUB_OUTPUT: outputPath, GITHUB_STEP_SUMMARY: summaryPath } = process.env;
  if (outputPath) appendFileSync(outputPath, `run_full=${decision}\n`);
  if (summaryPath) {
    appendFileSync(summaryPath, `### E2E coverage decision\n- Full Playwright run: **${decision}**\n- Reason: ${why}\n- The validate/security/Council/privacy/build job is always required.\n`);
  }
  console.log(`run_full=${decision} · ${why}`);
}
