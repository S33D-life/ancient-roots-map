# S33D Agent Guide
<!-- LOVABLE:BEGIN -->
- Keep the agent connection guide frontend-only and derive its public MCP URL from validated deployment configuration; this avoids changing the existing MCP server.
<!-- LOVABLE:END -->
> Ground rules for agents (Claude Code, Codex, Lovable, TEOTAG, future) collaborating on this repo.
> Read this for stable rules. For current priorities start with the [Notion live Compass](https://app.notion.com/p/35215b58480d8173aacfc41fd9da7134); then verify GitHub PRs and `main` before acting. [`PROJECT_MAP.md`](./PROJECT_MAP.md) is the architecture index and [`CURRENT_TASKS.md`](./CURRENT_TASKS.md) is a dated gateway, not authoritative live task state.

---

## Source of truth

| Question | Authoritative evidence |
| --- | --- |
| Human priorities, approved names, privacy and design decisions | [Current Compass](https://app.notion.com/p/35215b58480d8173aacfc41fd9da7134) and owning Notion branch (dated) |
| Code, branches, PRs, exact SHAs, checks | [GitHub](https://github.com/S33D-life/ancient-roots-map) at time of review |
| Restricted design/code handoff bytes, manifests and checksum receipts | [Handoffs & Recovery](https://drive.google.com/drive/folders/17RPRLYkAHPQ7OaxORXtin3u61Y093Pgr) |
| Actual signed-in data, current RLS and served behaviour | Independently verified running app/backend; source presence is not proof of deployment |
| Claude/Codex/ChatGPT memory | Retrieval hints only, not canonical decisions or release permission |

The [29 Oct 2026 compass](https://app.notion.com/p/35215b58480d8173aacfc41fd9da7134) supersedes the May status paragraphs in old docs. Never carry a cached PR SHA/CI claim to a release decision.

Local repo: `/Users/ed/Documents/S33D CODE/ancient-roots-map`
Remote: `https://github.com/S33D-life/ancient-roots-map`

The FUSE-mounted local path runs slow under load and can occasionally fill the disk. For releases or any work that needs clean `npm ci` / `npm run build` timing, clone to `/tmp/` or another local volume.

---

## Session entry and completion receipt

1. **On entry:** open the [Current Compass](https://app.notion.com/p/35215b58480d8173aacfc41fd9da7134) and the [Active PR & Completion Board](https://app.notion.com/p/40815b58480d81c7be69d49a84aa14b1) in Builder's Bench. Read the row for **your specific task or PR** before editing. Confirm the row's owner, dependency, permitted paths, gate and last-reviewed date; check actual GitHub head/CI and upstream branches, as the board is a dated human-maintained snapshot.
2. **During work:** one agent owns each branch; update the PR description with exact base/head, changed files, tests, blockers and separate release dependencies. Label facts precisely: **DESIGNED**, **CODE PRESENT**, **TESTED LOCALLY**, **CI PASSED AT SHA**, **DEVICE ACCEPTED**, **MERGE APPROVED**, **MERGED**, **PUBLISHED** (frontend), **DEPLOYED** (Edge Function), **MIGRATION APPLIED** (database), **SERVED VERIFIED**; none implies the next.
3. **On exit:** report an actionable **Completion Card**: exact full SHA, PR link, test and device receipts, changed paths, blocker/next action, next owner, and what remains unverified. Update the existing Builder's Bench board **only when authorised and connected**; otherwise include a ready-to-paste board-row update in the handoff for a human/TEOTAG steward. Never silently change canonical Notion decisions.
4. **Before a release decision:** refresh PR head and CI again; the last receipt and board line are historical evidence, not authority. Require Ed's explicit GO for each consequential gate.

This closes the loop between repository work and the existing Notion board without a new status database or unattended synchronisation.

---

## Branch + PR rules

- **Never commit directly to `main`.**
- One branch per task.
- Naming: `teotag/<topic>`, `codex/<topic>`, `claude/<topic>`, `ed/<topic>`, `lovable/<topic>`, `funding/<topic>`, `chore/<topic>`, `docs/<topic>`. Historical branches may use other prefixes; do not rename or delete them merely for style.
- Keep PRs small (5–12 files ideal). One conceptual change per PR.
- Open as **draft first**; un-draft only when CI is green or the failures are explicitly accepted as out-of-scope.
- PR description must include: summary, exact base/head SHA, files changed, risks, tests and exact-head CI, phone/accessibility evidence where relevant, dependency/merge order, rollback and required human gate.
- Include an accurate `Agent: codex|claude|chatgpt|lovable|human|teotag` trailer on new work commits when the producing agent is known. Commit authorship and agent trailer are provenance hints, not substitutes for human code review.
- Use merge commits (default) when landing — keeps the trunk reading honest.

---

## Lane boundaries

Each agent owns a lane. Don't reach across lanes without coordination.

| Lane | Owner | Files / surfaces |
|---|---|---|
| Heartwood coherence, library room config, navigation harmonisation, security hygiene, doc accuracy | **Claude** | `src/config/heartwoodRooms.ts`, `src/components/library/`, `src/pages/library/`, `src/components/Header.tsx`, `scripts/security-check.mjs`, `*.md` docs |
| Atlas data streams, country stats, dataset watchers, public Atlas RPCs, Codex data lane | **Codex** | `src/hooks/use-atlas-*`, `src/pages/CountryPortalPage.tsx`, `src/pages/WorldAtlasPage.tsx`, `supabase/migrations/*atlas*`, `supabase/functions/*-dataset-*` |
| E2E test infrastructure, Playwright config, CSP-related test stability | **Codex** (current) | `e2e/`, `playwright.config.ts`, CSP config in `vite.config.ts` |
| UI generation experiments, visual prototypes | **Lovable** | intended lane `lovable/<topic>`; integration has historically written directly to `main`. **Audit actual Lovable/GitHub settings before any enforcement change**; do not assume repo text changes the integration |
| Docs, registry, stabilisation guards, release management | **TEOTAG** | `CURRENT_TASKS.md`, `PROJECT_MAP.md`, `AGENTS.md`, `RELEASE.md`, `scripts/check-*`, `scripts/guard-*` |

When uncertain whose lane a file is in: check active GitHub PR changed-file lists and the current Notion Compass, then coordinate. Do not rely on May's `CURRENT_TASKS.md`.

---

## Never co-edit these files

Concurrent edits to these will produce merge conflicts that are painful to resolve:

| File | Owner / rule |
|---|---|
| `src/config/heartwoodRooms.ts` | **Claude only.** Single source of truth for Heartwood rooms. |
| `src/integrations/supabase/client.ts` | Auto-generated — never edited by anyone. |
| `src/integrations/supabase/types.ts` | Auto-generated — regenerated only via Supabase CLI as part of a dedicated chore PR. |
| `package-lock.json` | Only via a deliberate dep-management PR. Regenerate on a clean (non-FUSE) machine via `npm install`. |
| `public/version.json` | Auto-written by `generate-version.mjs` at build time; already gitignored. Never force-add it. |
| `src/App.tsx` route table | One agent at a time. Add new route constants to `src/lib/routes.ts` first, then page in `src/pages/`, then route entry in `App.tsx`. |

---

## Merge protocol

Order matters when multiple PRs are stacked:

1. **Lockfile / infra chores** merge first (unblock CI for everything below).
2. **Security / build-gate fixes** next.
3. **Trunk / config PRs** (e.g. Heartwood room config) before consumers.
4. **Feature PRs** consuming the new trunk.
5. **E2E / test stabilisation** can interleave once gates are green.

When merging:
- Squash only if the PR is genuinely one concern.
- Use merge commits for PRs with multiple semantically distinct commits (matches existing repo history).
- Delete the branch on merge (`gh pr merge --delete-branch`).

---

## CI expectations

The CI workflow has two jobs:

1. **`Lint / Typecheck / Unit / Build`** (`validate`) — runs `npm ci`, security:check, config-churn guard, duplicate guard, asset budget, lint, typecheck, council:static:check, council:share:check, vitest, build, then `scripts/check-council-public-bytes.mjs`. Must pass.
2. **`E2E smoke (Playwright)`** (`e2e-smoke`) — runs Chromium against built `dist/` with Circle integration tests. Verify exact-head status in GitHub; software-rendered 3D acceptance is not physical iPhone Safari or VoiceOver.

For `pull_request` events, GitHub Actions' default checkout normally tests the synthetic PR merge commit; the run also identifies the PR head. Record **both** and verify the tested checkout SHA before claiming exact-head or merge readiness. If the PR is stale relative to `main`, update the branch through a reviewed action before retesting.

---

## Release boundaries and preservation

- Separate explicit Ed GO is required for **merge, frontend publish, backend function deployment, database/RLS change, external posting and any private/public visibility change**. A draft PR or passing CI is none of these.
- Treat [issue #103](https://github.com/S33D-life/ancient-roots-map/issues/103) (frontend-only Lovable publish/rollback) as an unresolved release gate until independently proved. Do not use Lovable History Revert on live production as a test.
- Preserve original 3D TETOL, historical Council editions, research/Ancient Friend distinctions, accurate provenance, and private family/person/place/media boundaries. Verify rights and attribution before public art reuse.
- For current Council features: Notion/Time Tree may disagree with the serving MCP, so independently check the active edition and projection. Do not auto-promote an old Circle, fabricate participation/offerings or invent submission persistence.
- Release evidence must identify exact code SHA, full relevant CI, mobile/iPhone Safari, accessibility, privacy/data checks, a safe rollback path and actual served version. Unknown means HOLD, not PASS.
- Do not auto-record private conversations, install broad plugins/MCP hooks, or change Claude memory settings until their own scope and consent review.

---

## Local commands

```bash
git checkout main
git pull origin main
git checkout -b <lane>/<topic>

npm ci                    # lockfile-exact, as CI; use clean filesystem (FUSE is slow)
npm run dev               # vite at http://127.0.0.1:8080
npm run typecheck         # tsc --noEmit
npm run lint              # eslint
npm run test              # vitest run (no watch)
npm run build             # writes public/version.json + builds dist/
npm run release-check     # council static → council share → typecheck → lint → security → duplicates → assets → test → build
```

For the full release gate, run on a non-FUSE clone:

```bash
git clone https://github.com/S33D-life/ancient-roots-map.git /tmp/s33d-check
cd /tmp/s33d-check
npm ci
npm run release-check
```

---

## When in doubt

- **If uncertain whose lane**: check active PR paths, linked Notion Compass and owner before editing.
- **If a file is in the "never co-edit" list**: check whether another PR has it open before editing.
- **If CI fails on something pre-existing**: investigate whether it's masked-by-an-earlier-step or net-new. Document the diagnosis in your PR.
- **If FUSE is hanging**: clone to `/tmp/` and work there; report the workspace path is slow.
