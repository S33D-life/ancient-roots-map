# TEOTAG evidence: reproducible npm installation

## Scope and root cause

Base: `85c064114` (upstream main). Dedicated branch: `codex/reproducible-lockfile`. Atlas behavior and PR #68 are untouched. No merge or deployment.

Commit `14680b3ba163c647da63fd5459e578b5060e2448` added `drizzle-kit`, `drizzle-orm`, and `postgres` to package.json and bun.lock, without updating package-lock.json. CI uses Node 20 and npm ci, so npm rejected the incomplete lockfile before installation. Reproduced on Node 20.20.2/npm 10.9.9 and Node 24.3.0/npm 11.4.2.

## Repair and dependency delta

Ran npm 10.9.9 under Node 20.20.2:

```sh
npm install --package-lock-only --ignore-scripts --no-audit --no-fund
npm ci --no-audit --no-fund
npm run release-check
npm run guard:config-churn
```

No legacy-peer-deps, force, no-save install, or manual dependency supplementation was used for validation. The checkout had no existing node_modules. npm ci installed 1,054 packages and exited 0.

Only the npm lockfile dependency graph changes:

- Existing non-root package records are structurally identical: same versions, resolved URLs, integrity hashes and other metadata. No existing package removed or upgraded/downgraded.
- Root lockfile devDependencies now matches the unchanged package.json.
- 86 package records added, including 74 optional/platform records. The newly locked direct packages are drizzle-kit 0.31.11, drizzle-orm 0.45.3 and postgres 3.4.9.
- Added supporting packages include @drizzle-team/brocli 0.10.2, @esbuild-kit/core-utils 3.3.2, @esbuild-kit/esm-loader 2.6.5, get-tsconfig 4.14.3, resolve-pkg-maps 1.0.0, tsx 4.23.15, and nested esbuild 0.18.20 / 0.25.12 / 0.28.2 with platform packages. tsx and its esbuild are marked devOptional; the other additions are dev records.
- Existing record property order was retained to avoid npm serializer churn. `git diff --histogram` shows the additive 1,616-line lockfile repair more clearly than the default diff algorithm.
- Lockfile SHA-256 before and after clean install and release checks: `fa031900f8f074a975c996707a950482c3edaa69d722e56845ffee55978dc1be`.

The prior temporary install used for Atlas PR #68 was not reproducible and resolved some newer versions. Its results are not the basis of this evidence. This check uses the repaired upstream locked graph, including existing @testing-library/dom 10.4.1; no separate test-library install is necessary.

## Validation result

Node 20.20.2/npm 10.9.9 on macOS arm64:

| Check | Result |
|---|---|
| Original npm ci | FAIL: missing Drizzle/Postgres graph |
| Repaired npm ci, scripts enabled | PASS, 1,054 packages |
| Typecheck | PASS |
| Lint | PASS, 0 errors / 178 warnings |
| Security / duplicate / asset checks | PASS |
| Unit suite | PASS, 42 files / 312 tests |
| Production build + PWA generation | PASS |
| Config churn guard | PASS |
| git diff --check | PASS |

npm still warns about the pre-existing @vitest/mocker 4.0.18 optional Vite peer range versus root Vite 5.4.19. It does not prevent npm ci or the tested release checks. This repair deliberately does not upgrade Vite/Vitest. Build chunk-size and asset/lint warnings remain; no warning cleanup is included.

Linux CI and Playwright smoke status must be read from the draft PR checks; the local validation above does not claim those passed.

## Generated artifacts: explicit accounting

Installation did not rewrite the lockfile. Release checks produced normal ignored dist/ assets, service-worker files and timestamped public/version.json. They are not committed; builds are not claimed byte-identical because version metadata includes build time.

The existing Vite mcpPlugin also rewrote tracked supabase/functions/mcp/index.ts: six npm imports changed from @lovable.dev/mcp-js 0.26.3 to 0.26.1, matching the existing npm lockfile. This is **pre-existing source/lock/generated-output drift**, not a dependency downgrade introduced by the repair. That generated diff was recorded separately and the file restored; it is deliberately excluded from the repair. No Supabase migration, generation command, function deployment or database action was run.

TEOTAG should treat reconciliation of that generated MCP artifact as a separate decision. The dependency installation/release gate can now run reproducibly, but the existing build does not leave every tracked generated artifact unchanged.
