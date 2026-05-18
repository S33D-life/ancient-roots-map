# S33D — Current Tasks

> Living index of what's open right now. Updated by TEOTAG as the source-of-truth steward.
> For full architecture or product context, see [`PROJECT_MAP.md`](./PROJECT_MAP.md) and [`ARCHITECTURE.md`](./ARCHITECTURE.md).

Last reviewed: 2026-05-16
Current working branch: `teotag/local-setup`

---

## 🌱 Phase 1 — Agent orientation (active)

- [x] Fix `AGENTS.md` truncation (closing code fence) — done on `teotag/local-setup`
- [x] Scaffold `PROJECT_MAP.md`
- [x] Scaffold `CURRENT_TASKS.md` (this file)
- [ ] Commit Phase 1 docs on `teotag/local-setup` — **awaiting Ed's approval**
- [ ] Open PR → `main`

## 🪵 Phase 2 — Repo stabilisation (pending approval)

- [ ] Remove stale duplicate scripts: `scripts/security-check 3.mjs`, `scripts/security-check 4.mjs`
- [ ] Widen the duplicate-artifact regex in `scripts/check-duplicate-artifacts.mjs` to catch ` N` suffixes beyond just ` 2`
- [ ] Lockfile cleanup: keep `package-lock.json`; remove and gitignore `bun.lock`, `bun.lockb`, `deno.lock`
- [ ] Ensure Lovable cloud sync is set to npm so it can't reintroduce `bun.*` lockfiles

## 🛡️ Phase 3 — Security checker (pending approval)

- [ ] Adopt allowlist pragma (`// security-check: allow <reason>`) for the generic JWT pattern in `scripts/security-check.mjs`
- [ ] Annotate the Supabase anon fallback in `src/config/env.ts` with the pragma
- [ ] Keep service-role and publishable-key assignment patterns **unexemptable** — they should always fail loudly
- [ ] Re-run `npm run release-check` to confirm the gate is green again

---

## ⚠️ Known repo risks

1. **`security:check` is blocked on main.** The Supabase anon JWT fallback in `src/config/env.ts:13` trips the generic JWT regex. Until Phase 3 lands, `npm run release-check` and the CI `Security check` step both fail. Workaround: nothing local; the fix is the pragma plan above.
2. **Four lockfiles tracked.** `package-lock.json` (npm — canonical), `bun.lock`, `bun.lockb`, `deno.lock`. Risk of drift across contributors (Claude / Codex / Lovable / Ed). CI uses npm.
3. **Stale duplicate scripts.** `security-check 3.mjs` and `security-check 4.mjs` are macOS-style duplicates the current dupe-guard regex misses (it only catches ` 2`). Functionally harmless today but reduces signal in script directory.
4. **Three test directories under `src/`.** `__tests__/`, `test/`, `tests/`. Convergence on one would simplify discovery. Non-urgent.
5. **Sandbox can't run `tsc`/`vite` reliably here.** The FUSE-mounted workspace returns "Resource deadlock avoided" on long-running tools. Host-side `npm run release-check` is the trusted baseline.

---

## 🌿 Active product polish (parking lot — from `ARCHITECTURE.md`)

Ranked as in the architecture review. Pick from here when a stabilisation branch isn't already in flight.

1. Typed repository/data-access layer for Supabase queries — `src/repositories/`
2. Split `LeafletFallbackMap.tsx` into focused modules
3. Modularise `unified-search.ts` (index builders + contracts)
4. Runtime validation for external data ingestion
5. Reduce direct fetching inside page components
6. Enforce single canonical route registry usage (`src/lib/routes.ts`)
7. Map performance guardrails for large datasets
8. Tighten lint/type safety in policy tiers
9. Document the import pipeline + operational controls
10. Architecture tests for critical seams (search, map filtering, CSV import)

---

## 🔁 Workflow rules (recap from `AGENTS.md`)

- Never commit directly to `main`.
- One branch per task; name `teotag/<topic>`, `codex/<topic>`, `ed/<topic>`, `lovable/<topic>`.
- Run `npm run release-check` before requesting review.
- PR description must include: files changed, risks, next steps.
- TEOTAG keeps this file and `PROJECT_MAP.md` current — other agents read these first.

---

## 📓 Recent decisions

- **2026-05-16** — Designated `/Users/ed/Documents/S33D CODE/ancient-roots-map` as the single local working trunk; legacy duplicate clones removed.
- **2026-05-16** — Established `teotag/local-setup` as the first stabilisation branch.
- **2026-05-16** — npm + Node 20 confirmed canonical; bun and deno lockfiles slated for removal.
