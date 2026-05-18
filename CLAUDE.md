# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

S33D / Ancient Roots Map — a participatory atlas of the world's remarkable ancient trees ("Ancient Friends"), a stewardship economy (Hearts, Staff NFTs, NFTrees), and a community library + governance layer (Heartwood, Council of Life). Hosted on Lovable; backend is Supabase.

## Commands

```bash
npm install          # install deps (Node 20, npm is canonical — ignore bun/deno lockfiles)
npm run dev          # dev server at http://127.0.0.1:8080
npm run build        # production build (writes public/version.json first)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint on src/, scripts/, config files
npm run test         # vitest (run once, no watch)
npm run test -- --reporter=verbose   # single test file or verbose output
npm run e2e          # Playwright smoke (requires a built dist/ — run build first)
npm run release-check  # full pre-PR gate: typecheck → lint → security → duplicates → assets → test → build
```

Individual guards (all run as part of `release-check`):
```bash
npm run security:check      # blocks committed .env files and leaked key patterns
npm run guard:config-churn  # detects tools auto-editing .env / vite.config.ts
npm run check:duplicates    # blocks files ending in " 2", " 3" etc.
npm run guard:assets        # asset bundle size budget
```

**`npm run release-check` must pass before opening a PR.** CI runs identical steps.

> Known issue: `security:check` currently fails on `main` because the Supabase anon key fallback in `src/config/env.ts` trips the generic JWT regex. A pragma-based allowlist fix is planned (see CURRENT_TASKS.md Phase 3).

## Branch rules

- Never commit to `main` directly.
- One branch per task. Name convention: `teotag/<topic>`, `codex/<topic>`, `ed/<topic>`, `lovable/<topic>`, `agent/<topic>`.
- PR description must include: files changed, risks, next steps.

## Architecture

### Stack

React 18 · TypeScript · Vite 5 · Tailwind CSS · shadcn/ui (Radix primitives) · React Query · React Router v6 · Supabase (Postgres, Auth, Edge Functions, Storage) · Leaflet + MarkerCluster · Base chain via ethers.js · Vitest · Playwright · PWA via vite-plugin-pwa.

### Routing

- All route constants live in `src/lib/routes.ts` — always use `ROUTES.MAP`, `ROUTES.COUNTRY("slug")` etc., never raw strings.
- Routing tree is wired in `src/App.tsx`. All page components are lazy-loaded via a custom `lazyImportWithRetry` wrapper that handles chunk load errors with a single session-storage-guarded reload.
- Key route groups: `/map`, `/atlas/:countrySlug/:subSlug`, `/library`, `/dashboard`, `/vault`, `/council-of-life`, `/bug-garden`, `/agent-garden`, `/roadmap`.
- Atlas sub-route resolution (city vs sub-region) is handled by `src/pages/AtlasSubResolver.tsx`.

### Data layer

- **Supabase client singleton:** `src/integrations/supabase/client.ts` — auto-generated, never edit.
- **Supabase types:** `src/integrations/supabase/types.ts` — auto-generated, never edit.
- **Env resolution:** `src/config/env.ts` holds fallback Supabase credentials. The anon/publishable key is intentionally client-embeddable.
- **React Query** is the data-fetching layer. Most queries live directly in page/component files (a typed repository layer under `src/repositories/` is an in-progress improvement).
- **Global providers** wrap the app in `src/App.tsx`: `TetolLevelProvider`, `HiveSeasonProvider`, `MapFilterProvider`, `UIFlowProvider`, `TeotagProvider`, `CompanionProvider`, `QuietModeProvider`, `SeasonalLensProvider`.
- **MapFilterContext** persists filter selections in URL search params so they survive navigation and deep-links.

### Map system

- Entry: `src/pages/MapPage.tsx` → orchestrator: `src/components/Map.tsx` → primary renderer: `src/components/LeafletFallbackMap.tsx`.
- `LeafletFallbackMap.tsx` is intentionally large (rendering, filtering, popups, external layers, map memory) — a split is planned but not yet done; be careful editing it.
- External tree sources: `src/utils/externalTreeSources.ts` and `src/utils/overpassTrees.ts` (OSM via Overpass API).
- Visual overlays: `GroveViewOverlay`, blooming clock layers, `MapFilterContext`.

### Search system

- Service: `src/services/unified-search.ts` — aggregates static indices (`HEARTWOOD_ROOMS`, `SUPPORT_PAGES`, `COUNTRY_PAGES`) + dynamic Supabase queries, then dedupes/scores/groups results.
- UI: `src/components/GlobalSearch.tsx` (omni-search), `src/components/MapSearch.tsx` (what3words on map).

### Hearts economy (load-bearing)

- `src/lib/heartService.ts` implements a **dual-write contract**: every heart operation writes to both `heart_ledger` and `heart_transactions`. The legacy `heart_transactions` row fires the `update_heart_balance_on_insert` DB trigger that updates `user_heart_balances`. Do not skip the legacy mirror write.
- Transaction type strings must come from `src/lib/economy-vocabulary.ts` — never inline raw strings.
- This contract is locked in by `src/tests/HeartLedgerDualWrite.test.ts`.

### Configuration registries

| Concern | File |
|---------|------|
| Routes | `src/lib/routes.ts` |
| Countries | `src/config/countryRegistry.ts` |
| Cities | `src/config/cityRegistry.ts` |
| Sub-regions | `src/config/subRegionRegistry.ts` |
| Env / Supabase | `src/config/env.ts` |
| Tailwind | `tailwind.config.ts` |
| Vite / PWA / CSP | `vite.config.ts` |
| ESLint | `eslint.config.js` |

### Edge Functions

`supabase/functions/` contains: tree import (`import-paul-wood-trees`), species vision (`identify-tree`, `birdsong-identify`), what3words (`convert-what3words*`, `extract-what3words-from-image`), IPFS sync, NFTree minting, OG cards, Telegram integration, Stripe webhooks, and others.

### Test layout

Unit tests spread across three directories (consolidation pending): `src/test/`, `src/tests/`, `src/__tests__/`. E2E smoke tests are in `e2e/` and run against the built `dist/` via `vite preview`.

## Conventions

- **Tailwind semantic tokens**, not raw color values.
- **Use `ROUTES.*` constants** for all navigation — never hardcode path strings.
- **Adding a new country:** add to `src/config/countryRegistry.ts`; reuse `CountryPortalPage.tsx` (keyed by slug). Optionally extend `cityRegistry.ts` / `subRegionRegistry.ts` and `AtlasSubResolver.tsx`.
- **Adding a new route:** add constant to `src/lib/routes.ts` first, then create page in `src/pages/`, then wire in `src/App.tsx`.
- **No files ending in `" 2"`, `" 3"` etc.** — the duplicate-artifact guard will block the build.
- **Four lockfiles exist** (`package-lock.json`, `bun.lock`, `bun.lockb`, `deno.lock`) — `package-lock.json` is canonical; CI uses npm. The others are slated for removal.
- Tone across UI copy is ceremonial and nature-rooted — preserve it.
