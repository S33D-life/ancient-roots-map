# MCP SDK / generator alignment · 8 October 2026

Base: `13cca96202d8d6df27de6eb86a63f824b8dbcdca`, the reconciled Living Dream read-layer candidate.
Local branch: `codex/mcp-sdk-alignment-20261008`. No push, PR, merge, deployment, publication, Notion edit, Telegram send or production-data operation.

## Root cause

The source manifest allowed `@lovable.dev/mcp-js: ^0.26.1`, but the npm lockfile explicitly resolved 0.26.1. Canonical CI runs `npm ci`, which installs the locked version rather than selecting the newest permitted patch. The previous candidate checkouts used a locally installed 0.26.3 (the earlier evening checkout reused that dependency directory). The text `bun.lock` independently already resolved 0.26.3, also demonstrating installer disagreement. No global SDK is installed; `npm ls -g @lovable.dev/mcp-js --depth=0` found none.

`vite.config.ts` imports the local package's `mcpPlugin()` without a version override. The generator's `npmSpecifierFor()` emits its own installed package version into the Edge Function. There is no independent generator script, global SDK lookup or hidden runtime-version configuration. Thus a 0.26.1 install emits 0.26.1 imports, while the reviewed source and deployment artifact were generated using 0.26.3.

0.26.3 is supported by concrete evidence: the reviewed Edge artifact already uses it; its generator handles Vite aliases and bundles the Growth model's routes; 0.26.1 emits unresolved `npm:@/lib/routes`. The reviewed HTTP contract also uses 0.26.3 authentication-before-method rejection. This alignment preserves that existing contract, rather than changing the intended runtime.

## Minimal dependency change

- `package.json`: exact `@lovable.dev/mcp-js: 0.26.3`.
- `package-lock.json`: matching root declaration; SDK version, official npm tarball URL and verified integrity updated to 0.26.3.
- `bun.lock`: matching exact root declaration; its existing 0.26.3 resolution/integrity and all transitive entries remain untouched.
- `src/tests/livingDreamMcp.test.ts`: exact manifest/lock/installed-version regression and unsupported-method auth regressions.
- This evidence document.

The npm lock was resolved with `npm install --package-lock-only --ignore-scripts --save-exact @lovable.dev/mcp-js@0.26.3 --registry=https://registry.npmjs.org --no-audit --no-fund`. npm 11 reordered much of the file, but JSON comparison proved only two package records changed: the root declaration and this SDK. The original ordering was preserved while carrying forward those npm-generated changes; the resulting JSON is exactly equal to npm's generated lock. All other package records are byte-equivalent in content. No transitive upgrades, overrides, dependency substitutions, generator hacks or Vite changes.

Both SDK versions declare the same dependencies: MCP protocol SDK 1.28.0, esbuild ^0.27.0 and jose ^6.2.2, with the same Vite/Zod peer ranges. The frozen npm tree was preserved. The historic binary `bun.lockb` predates this MCP dependency and is not used by canonical npm CI; it was not rewritten. `deno.lock` contains no MCP SDK entry. No Bun or Deno install is claimed.

## Fresh install → generation → identical runtime

Created an independent clone at `output/mcp-sdk-alignment-20261008`, directly from the exact reconciled candidate, without `node_modules`. Applied the aligned manifests/lock and ran ordinary `npm ci --no-audit --no-fund`, including normal install scripts. It installed 1,254 packages into a real local dependency directory, not a symlink or a copied candidate installation.

Environment: Node 24.3.0, npm 11.4.2, macOS. `npm ls @lovable.dev/mcp-js --all` reports one direct SDK **0.26.3**; its frozen generator esbuild is **0.27.7**. Public npm/cache integrity validation was retained.

Using that installed generator and the existing root/alias configuration, regenerated the actual `supabase/functions/mcp/index.ts` twice. Both runs are byte-identical to the reviewed artifact, with SHA-256:

`a6dd02322e8ce77bbbeec4e978997b61381086942dd31b384d2eaade10eeb172`

No unresolved alias exists. The production build in the normal release check also uses the repository's real Vite configuration; the artifact remains byte-identical afterward. The existing deterministic-regeneration test separately generates twice into ignored output and compares against this checked-in artifact.

## Runtime and authority regression

No changes to MCP registration, original four tool sources, shared user-scoped Supabase helper, the three Living Dream read tools, Circle/Growth sources, schemas, generated runtime or Vite configuration. They match the reconciled candidate byte-for-byte. The intended SDK/runtime remains 0.26.3; only install resolution is aligned.

The focused suite verifies discovery/schema snapshot equality, approved Circle fidelity/filtering, compact Growth list/detail fidelity, unknown-id failure, source/no-network/no-write boundaries, maturity separation, original tools' payload/scoping, and JWT success/failure. Added regressions prove unauthenticated GET/PUT/DELETE receive **401 / no-store**, while a verified-token GET receives **405 / no-store**, matching reviewed 0.26.3. Signed wrong-audience/wrong-issuer/expired tokens remain rejected. No authority or write path is added.

## Final validation

- Fresh ordinary `npm ci`: passed, exact SDK 0.26.3, no reused/shared dependency directory.
- Focused MCP suite: **30 passed**, including pin alignment, actual discovery/schema equality, two-run deterministic regeneration, approved projections, no-write boundaries, original-tool regression, JWT checks and unsupported-method authentication ordering.
- Normal `npm run release-check`: **passed**, including static/share freshness, typecheck, lint (zero errors; 178 existing warnings), security, duplicate/asset checks, **482 tests across 61 suites** and production build.
- Actual generated runtime after the full build still matches the intended artifact byte-for-byte and retains the SHA-256 above. No SDK/alias/source drift.
- `guard:config-churn`, `crown:growth:check` and `git diff --check`: passed. All other npm package records are unchanged; original four tools also match canonical `da5209fe…` directly.
- No global/indirect SDK dependency, new write path, new authority, live authenticated MCP call or production operation was introduced.

## Separate holds and recommendation

This document supersedes the **dependency/generator HOLD only** in the earlier reconciliation report. Keep the public Folio 404, Current Priorities projection, Holm Oak identity, Staff/Curator authority, Offering persistence and Telegram production sending as separate unchanged holds. Crown maturity remains Growing; no Growth record changes occur here.

Local reproducibility is the acceptance criterion. Successful checks support **GO for a subsequent explicitly authorized push and draft PR**, with remote CI still required before any merge consideration. This recommendation performs no remote action. Existing peer/deprecation/lint/build warnings are outside this exact dependency alignment, and no unrelated upgrade was attempted.
