# Reviewed release / main reconciliation

Inputs verified before modification:
- Main: `85c064114f2c7593f5e7d14eea8e7bcb01273056`
- Reviewed release through PR #88: `db3dfa7a51fb24412cd4e6bfa8630cf9908fef87`
- Common ancestor: `4f394742c4689bc1cdb9c8ac36eeceee1618531d`
- Release-only / main-only commit counts: 37 / 23.

## Main-only audit

The 23 commits collectively change eight files: the auth page, durable OAuth adapter, post-sign-in queue, update hook/button, and their three test suites. They preserve honest sign-in/update error reporting and move post-sign-in processing outside Supabase's synchronous auth callback. Intermediate generated Lovable wrapper edits cancel out; the generated wrapper has no net change. The two named summary commits have no file changes. No main-only database, dependency, Council geometry or Crown change was found.

Exact main-only commits, oldest first:

```
a344c74bc86cd15e76ac0dd7f554e9ba599bc17b Changes
51a64d39cc44e47a9a05fb76f1ae30700fca8017 Changes
64bdd9be6ea62a8ebf544f04b5f6446ff61b33f6 Changes
4be151939ca68202db3bfb9f8754cb88296c59c0 Changes
95a3fdd32a7710fe554405fcbfc96d3b3e4918ad Changes
d74a2db66f51a08068a7d3fb55840ece760729ab Changes
8c2f97fa152b1bc02d5b801570954a1d553a7528 Changes
8aab50107dd0d3b518061387cbe2e15a664a4be5 Changes
5807f705497d1028522be88a98f12e7809b1437c Changes
039605cbdd297a2845e02a16b476f5b418c37b95 Changes
ba917621446949c51d61f30ea7d10432bf09bef4 Added auth error handling & update
03fa4f706215997460ad36fa702a8aabd7fd0f7a Changes
ee84f2b2bf0227040e3a3d9824b27e8671eea712 Changes
991333ca71e88f99879873abe7d2f9fd68ca45e0 Changes
8f8050a8b9b4efc8850e98a8bc16045ba1d58a82 Changes
9a058fd89bf054c2396026468a63ad78fa712175 Changes
d0581276b46d2a3b28376dc75e096672f13bebb6 Changes
6e5f789fb25c1f43928c44a2a072225638bc280c Changes
ce64f71673e9d4dc13a079df68290f0effd0a233 Changes
1e74dfc46fa46ddc9f18f4d47b5c4afa9c2382d7 Changes
5b3be114eb4f353da27eeb94e7736a929720810a Changes
68d33e7c3325b14511821da404e820c66cbbf50a Changes
85c064114f2c7593f5e7d14eea8e7bcb01273056 Hardened auth flow updates
```

## Method and conflict

Fresh branch `codex/reconcile-reviewed-release-main-88` started at verified main. A two-parent merge preserves both legitimate histories; neither line was rewritten or cherry-picked.

One conflicted file, `src/pages/AuthPage.tsx`, contained two conflict regions in its auth effect. Preserve main's `createPostSignInQueue`, synchronous auth-state listener and checked OAuth adapter. Preserve release callback/return-context routing, recovery readiness, and failed recovery on SIGNED_OUT. Added a regression proving an expired ready recovery session disables password mutation and displays the missing-session error.

All seven other main-only net files are byte-identical to main. Static Council package, Crown components/data are byte-identical to the reviewed release. Generated MCP import drift caused by build/preview is restored to the reviewed release version before committing.

## Recorded local validation

Full release-check passed: static Council freshness, invitation freshness, typecheck, lint, security, duplicates, asset budget, 59 test files / 446 unit tests, production build. Crown growth evidence check passed.

Combined Chromium browser suite: 16 passed, 2 opt-in live tests skipped. Covers login, empty callback failure, map loading/recovery, Council, Golden Dream, read-only Growing Folio and no horizontal overflow at 390px, static #croom arrival and return. Auth/network fixtures avoid external writes; this is not evidence of a live OAuth provider round-trip. Actual device smoke remains a release gate. Separate full-renderer static Council checks: 2 passed at 1280px and 390px, including #croom arrival and return to the Current Circle section.

## Boundaries

PR #87 and #88 preserved; Growth maturity remains Growing, not Gold, distinct from implementation state. Existing reviewed security boundaries retained without widening. No new weekly source, new product feature, #79 work, backend publication, Telegram send, merge to main, or deployment performed. This candidate is for review and final device smoke, not permission to publish. Recorded prior production/evidence claims are unchanged.
