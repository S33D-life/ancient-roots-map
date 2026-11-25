# 21 November reproducible build receipt

Baseline: main `3f342de360d2a29d91672abc845c49bd6c20a11b`.
Public `/version.json` independently returned `a8cc42b` (19 November build).

Supported environment: Node 20.19.5 / npm 10.8.2 (Node 20 matches CI).

Before: clean `npm ci --ignore-scripts` failed EUSAGE: missing Lovable bridge/HMR packages and tagger 1.1.11 versus required 1.3.5.
Repair: npm-generated lock only; package.json unchanged. npm 10 rehoists transitive dependencies, explaining the large lock diff. No manual lock edits or peer-dependency bypasses.

After: clean `npm ci --no-audit --no-fund` PASS. `npm run release-check` PASS: static/share guards, typecheck, lint, security, duplicate guard, asset budget, 87 test files / 663 tests, production build. Existing chunk-size and peer warnings remain; these do not establish dependency-security clearance.

Reproduce:

```
npx --yes --package=node@20.19.5 --package=npm@10.8.2 -c 'npm ci --no-audit --no-fund && npm run release-check'
```

No production, database, source publication, campaign or invitation action taken.
