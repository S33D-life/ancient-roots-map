# S33D Agent Guide

> Ground rules for agents (Claude Code, Codex, Lovable, TEOTAG, future) collaborating on this repo.
> Read this before starting any work. Also read [`PROJECT_MAP.md`](./PROJECT_MAP.md) and [`CURRENT_TASKS.md`](./CURRENT_TASKS.md).

---

## Source of truth

Local repo: `/Users/ed/Documents/S33D CODE/ancient-roots-map`
Remote: `https://github.com/S33D-life/ancient-roots-map`

The local path runs slow under load (see CURRENT_TASKS.md known risks). For releases or any work that needs clean `npm install` / `npm run build` timing, clone to `/tmp/` or another local volume.

---

## Branch + PR rules

- **Never commit directly to `main`.**
- One branch per task.
- Naming: `teotag/<topic>`, `codex/<topic>`, `claude/<topic>`, `ed/<topic>`, `lovable/<topic>`, `chore/<topic>`, `docs/<topic>`.
- Keep PRs small (5–12 files ideal). One conceptual change per PR.
- Open as **draft first**; un-draft only when CI is green or the failures are explicitly accepted as out-of-scope.
- PR description must include: summary, files changed, risks, test plan, merge order if dependent on other PRs.
- Use merge commits (default) when landing — keeps the trunk reading honest.

---

## Lane boundaries

Each agent owns a lane. Don't reach across lanes without coordination.

| Lane | Owner | Files / surfaces |
|---|---|---|
| Heartwood coherence, library room config, navigation harmonisation, security hygiene, doc accuracy | **Claude** | `src/config/heartwoodRooms.ts`, `src/components/library/`, `src/pages/library/`, `src/components/Header.tsx`, `scripts/security-check.mjs`, `*.md` docs |
| Atlas data streams, country stats, dataset watchers, public Atlas RPCs, Codex data lane | **Codex** | `src/hooks/use-atlas-*`, `src/pages/CountryPortalPage.tsx`, `src/pages/WorldAtlasPage.tsx`, `supabase/migrations/*atlas*`, `supabase/functions/*-dataset-*` |
| E2E test infrastructure, Playwright config, CSP-related test stability | **Codex** (current) | `e2e/`, `playwright.config.ts`, CSP config in `vite.config.ts` |
| UI generation experiments, visual prototypes | **Lovable** | always on `lovable/<topic>` branch — never on shared lanes |
| Docs, registry, stabilisation guards, release management | **TEOTAG** | `CURRENT_TASKS.md`, `PROJECT_MAP.md`, `AGENTS.md`, `RELEASE.md`, `scripts/check-*`, `scripts/guard-*` |

When uncertain whose lane a file is in: check `CURRENT_TASKS.md` for in-flight PRs, or ask.

---

## Never co-edit these files

Concurrent edits to these will produce merge conflicts that are painful to resolve:

| File | Owner / rule |
|---|---|
| `src/config/heartwoodRooms.ts` | **Claude only.** Single source of truth for Heartwood rooms. |
| `src/integrations/supabase/client.ts` | Auto-generated — never edited by anyone. |
| `src/integrations/supabase/types.ts` | Auto-generated — regenerated only via Supabase CLI as part of a dedicated chore PR. |
| `package-lock.json` | Only via a deliberate dep-management PR. Regenerate on a clean (non-FUSE) machine via `npm install`. |
| `public/version.json` | Auto-written by `generate-version.mjs` at build time. Slated for `.gitignore`; don't commit drift. |
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

1. **`Lint / Typecheck / Unit / Build`** (`validate`) — runs `npm ci`, security:check, churn guard, dupe guard, asset budget, lint, typecheck, vitest, build. Must pass.
2. **`E2E smoke (Playwright)`** (`e2e-smoke`) — runs Playwright against the built `dist/`. Currently flaky/broken (see CURRENT_TASKS.md). Treat as informational until PR #19 lands.

CI runs against the PR HEAD, not against the simulated merge. If a PR's CI is failing for a reason that's already fixed on main, **update the branch** (`gh pr update-branch <n>`) to merge main in.

---

## Local commands

```bash
git checkout main
git pull origin main
git checkout -b <lane>/<topic>

npm install               # use clean filesystem; FUSE slow + occasionally fills disk
npm run dev               # vite at http://127.0.0.1:8080
npm run typecheck         # tsc --noEmit
npm run lint              # eslint
npm run test              # vitest run (no watch)
npm run build             # writes public/version.json + builds dist/
npm run release-check     # full gate: typecheck → lint → security → duplicates → assets → test → build
```

For the full release gate, run on a non-FUSE clone:

```bash
git clone https://github.com/S33D-life/ancient-roots-map.git /tmp/s33d-check
cd /tmp/s33d-check
npm install
npm run release-check
```

---

## When in doubt

- **If uncertain whose lane**: read `CURRENT_TASKS.md` "Lanes in flight" or ask.
- **If a file is in the "never co-edit" list**: check whether another PR has it open before editing.
- **If CI fails on something pre-existing**: investigate whether it's masked-by-an-earlier-step or net-new. Document the diagnosis in your PR.
- **If FUSE is hanging**: clone to `/tmp/` and work there; report the workspace path is slow.
