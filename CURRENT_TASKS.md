# S33D · Current Tasks — source-linked gateway

> **Reviewed 29 October 2026.** This page is a short *dated index*, not an automatically refreshed authority. Older May 2026 task claims remain in Git history. Always verify current GitHub PR/CI and owning Notion decision before work.

## Where to start

- [Live S33D This Week's Compass](https://app.notion.com/p/35215b58480d8173aacfc41fd9da7134): reviewed human priorities, current owner, holds and next-version backlog.
- [Current Priorities routing page](https://app.notion.com/p/35215b58480d813fa968d84ccb13a791): short Notion doorway.
- [Historical Priority Rings](https://app.notion.com/p/3e315b58480d81f3b99efc3403424172): preserved prior decisions, not today's instructions.
- [GitHub open PRs](https://github.com/S33D-life/ancient-roots-map/pulls) / [issues](https://github.com/S33D-life/ancient-roots-map/issues): implementation and review evidence.
- [S33D Agent Guide](./AGENTS.md), [Project Map](./PROJECT_MAP.md) and [Cross-Agent Handoff Contract](https://app.notion.com/p/3f915b58480d81248a0efa08c6b0d71e).

## Current task focus as of this review

1. **Ship small**: a real private "Recommend a companion for next week" action from the existing Council gallery. Read-only RLS audit before storing personal text; no fake receipt or voting.
2. **Council navigation**: PR [#127](https://github.com/S33D-life/ancient-roots-map/pull/127) first, stacked [#131](https://github.com/S33D-life/ancient-roots-map/pull/131) second. Both draft; mobile/iPhone and release gates apply.
3. **Offerings**: PR [#130](https://github.com/S33D-life/ancient-roots-map/pull/130) is a separate demo-only in-memory fixture, not real saving.
4. **Truth/privacy fixes**: PRs [#128](https://github.com/S33D-life/ancient-roots-map/pull/128) (mock anchoring), [#129](https://github.com/S33D-life/ancient-roots-map/pull/129) (backend attribution) remain reviewed separately.
5. **Release safety**: [issue #103](https://github.com/S33D-life/ancient-roots-map/issues/103) unresolved; investigate Lovable/branch settings before rule changes. No unattended publish.
6. **Funding in parallel**: existing S33D.Life Giveth owner checks via [#121](https://github.com/S33D-life/ancient-roots-map/issues/121).

## Verified checkout snapshot · 29 October 2026

- `main` base at check: `e2f2830f0af383f14d7f0165cd3eb9be4ec9d057` (do not treat as perpetual current HEAD).
- Draft #127 at `d926be72` (CI success); #131 at `9ee4b430` stacked on #127 (CI/adaptive success).
- Draft #130 at `6214b36e` (fixture CI success); #128 at `f1a89682`; #129 at `7c93d670` (CI success).
- These are **test receipts, not accepted/merged/published features**. Recheck exact head and live served version immediately before any human release decision.
- Repo Time Tree says Circle 238 current; connected MCP returned Circle 235. Historical/snapshot source is not published-site proof.
- `AGENTS.md` governs lane and approval rules; ignore the older May "CI broken until #19" text.

## Known holds

- Live frontend served SHA, exact recoverable publish/rollback without backend/DB drift, native iPhone/VoiceOver, branch protection state and deployed RLS all need independent evidence.
- Existing `spark_reports` and `bug_reports` migrations permit broad reads; do not use them for private nominations without deployed permission tests.
- Do not modify original TETOL, Council histories, private media, auth, economics or database as part of a documentation refresh.

## Archive and updates

The former `CURRENT_TASKS.md` dated 29 May 2026 remains recoverable from the Git history on the default branch before this docs PR. The [27 October Agent Skills Audit](https://app.notion.com/p/40615b58480d8168a48efcaea0ad0f35) and [Code Archaeology Register](https://app.notion.com/p/40615b58480d812eae99d4dafc95e31c) provide the repair lineage.

**On entering a new task:** open the current Compass, check live GitHub issue/PR head and changed paths, consult only the relevant owner branch, then record provenance and any unresolved gate. Do not rewrite this doc every time a PR updates.
