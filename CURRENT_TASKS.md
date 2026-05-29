# S33D — Current Tasks

> Living index of what's open right now. Updated by TEOTAG as the source-of-truth steward.
> For full architecture or product context, see [`PROJECT_MAP.md`](./PROJECT_MAP.md) and [`ARCHITECTURE.md`](./ARCHITECTURE.md).

Last reviewed: 2026-05-29

---

## 🌳 Trunk state (latest)

`main` HEAD: `9f1d7891` (Merge PR #16). All checks except `e2e-smoke` (Playwright) currently passing in CI.

Recently merged into trunk:

- **PR #18** — `chore(security): pragma exemption for Supabase anon JWT fallback` (also folds PR #17 lockfile sync)
- **PR #16** — `feat(library): Heartwood Trunk Map v1 + Journey Spine config`
- **PR #14** — `feat(arborium): two-step tree ID starter flow`

---

## 🌿 Lanes in flight

| PR | Title | Lane | Status |
|---|---|---|---|
| **#19** | Stabilize E2E smoke CSP and route checks | Codex / E2E | OPEN — fixes pre-existing E2E breakage exposed by passing lint |
| **#15** | [codex] Add public Atlas country stats stream | Codex / Atlas | DRAFT — conflicts after #18 merge; needs rebase onto main |
| **#7** | Telegram/OpenClaw handoff alignment | Telegram | OPEN — older PR, review/close decision pending |

---

## 🌱 Phase 1 — Agent orientation

- [x] `AGENTS.md` lane boundaries + merge protocol — done in `docs/post-trunk-stewardship`
- [x] `PROJECT_MAP.md` — Heartwood Journey Spine + canonical room registry documented
- [x] `CURRENT_TASKS.md` — this file kept current

## 🪵 Phase 2 — Repo stabilisation

- [x] Lockfile sync — `astronomy-engine@2.1.19` added to `package-lock.json` (PR #17/#18)
- [ ] Remove stale duplicate scripts: `scripts/security-check 3.mjs`, `scripts/security-check 4.mjs`
- [ ] Widen the duplicate-artifact regex in `scripts/check-duplicate-artifacts.mjs` to catch ` N` suffixes beyond just ` 2`
- [ ] Lockfile cleanup: keep `package-lock.json`; remove and gitignore `bun.lock`, `bun.lockb`, `deno.lock`
- [ ] Ensure Lovable cloud sync is set to npm so it can't reintroduce `bun.*` lockfiles

## 🛡️ Phase 3 — Security checker (DONE in PR #18)

- [x] Adopt allowlist pragma (`// security-check: allow <reason>`) for the generic JWT pattern in `scripts/security-check.mjs`
- [x] Annotate the Supabase anon fallback in `src/config/env.ts` with the pragma
- [x] Keep service-role and publishable-key assignment patterns **unexemptable** — they always fail loudly
- [x] CI `Security check` gate green on main

## 🧭 Phase 4 — Trunk coherence (in progress)

- [x] Heartwood Trunk Map v1 — canonical config at `src/config/heartwoodRooms.ts` (PR #16)
- [x] Heartwood Journey Spine — Meet → Learn → Walk → Offer → Remember → Steward → Evolve
- [x] Quest Cave canonical route `/library/quest-cave`; orphaned `QuestCavePage.tsx` deleted
- [x] `/heartwood/quest-*` redirects to `/library/quest-cave`
- [ ] Header navigation: surface "Crown" / Golden Dream as 4th TETOL node (PR B)
- [ ] PAGE_CONTEXT: derive library room labels from `ROOM_LABEL_MAP` (PR B)
- [ ] `public/version.json` build-artifact hygiene (PR B)
- [ ] `CompanionController.ROOM_LABELS` either derive from config or document as a separate companion-state taxonomy
- [ ] `LibraryRoomGrid` group keys/labels deriving from config; mobile filter by `getMobileRooms()`
- [ ] `unified-search.ts` HEARTWOOD_ROOMS index deriving from `HEARTWOOD_ROOMS` (currently hand-curated)

---

## ⚠️ Known repo risks

1. **`e2e-smoke` (Playwright) is broken in CI.** The React app shell doesn't mount in the Playwright runner — `header` element never becomes visible. Was masked by lint failures for days; surfaced after PR #18 unblocked lint. PR #19 (Codex) is in flight to fix.
2. **Four lockfiles tracked.** `package-lock.json` (npm — canonical), `bun.lock`, `bun.lockb`, `deno.lock`. Risk of drift across contributors. CI uses npm. (Phase 2 cleanup pending.)
3. **Stale duplicate scripts.** `security-check 3.mjs` and `security-check 4.mjs` are macOS-style duplicates the current dupe-guard regex misses (it only catches ` 2`). Functionally harmless today but reduces signal.
4. **Three test directories under `src/`.** `__tests__/`, `test/`, `tests/`. Convergence on one would simplify discovery. Non-urgent.
5. **FUSE-mounted workspace at `/Users/ed/Documents/S33D CODE/ancient-roots-map` is slow.** Long-running tools (build, npm install) can hang or take 50× normal time. For releases, clone to `/tmp/` or another local path. The disk also occasionally fills — keep `df -h /tmp` ≥ 5 GB before running release-check.

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
- One branch per task; name `teotag/<topic>`, `codex/<topic>`, `ed/<topic>`, `lovable/<topic>`, `claude/<topic>`, `chore/<topic>`, `docs/<topic>`.
- Run `npm run release-check` before requesting review (or run it in CI if FUSE blocks local).
- PR description must include: files changed, risks, next steps.
- Open PRs as **draft first**; un-draft when CI is green.
- Respect lane boundaries (see `AGENTS.md`).

---

## 📓 Recent decisions

- **2026-05-29** — Trunk coherence merged: PR #16 (Heartwood Trunk Map v1 + Journey Spine), PR #18 (lockfile + security pragma). Both `npm ci` and `npm run security:check` now pass in CI for the first time in days.
- **2026-05-29** — Confirmed `e2e-smoke` regression on main is pre-existing (masked by upstream lint failures). PR #19 (Codex) addresses it; treat as known until merged.
- **2026-05-29** — Quest Cave canonical route reversed to `/library/quest-cave`; `/heartwood/quest-*` paths now Navigate-redirect cleanly. Orphan `QuestCavePage.tsx` deleted (zero references).
- **2026-05-16** — Designated `/Users/ed/Documents/S33D CODE/ancient-roots-map` as the single local working trunk; legacy duplicate clones removed.
- **2026-05-16** — npm + Node 20 confirmed canonical; bun and deno lockfiles slated for removal.
