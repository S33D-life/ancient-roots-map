# S33D — Project Map

> First-read orientation for any agent (Claude Code, Codex, future sessions, human contributors).
> This file is an **index**, not a duplicate. For depth, follow the links into the canonical docs.

---

## What this repo is

S33D / Ancient Roots Map — a participatory atlas of remarkable trees ("Ancient Friends"), a stewardship economy (**Hearts**, **Staff NFTs**, **NFTrees**), and a community library + governance layer (Heartwood, Council of Life).

- Source of truth (local): `/Users/ed/Documents/S33D CODE/ancient-roots-map`
- Remote: `https://github.com/S33D-life/ancient-roots-map`
- Hosted publish surface: Lovable (see `README.md` Publish section)

---

## Stack at a glance

- React 18 · TypeScript · Vite 5 · Tailwind · shadcn/ui
- Supabase (Postgres, Auth, Edge Functions, Storage)
- Leaflet + marker-cluster (primary map); maplibre-gl (optional paths)
- Base chain via ethers.js (Staff NFTs, NFTree minting)
- Vitest (unit) · Playwright (smoke)
- PWA via `vite-plugin-pwa`

CI: Node 20, npm. The canonical install is `npm ci`.

---

## Top-level layout

| Path | Role |
|------|------|
| `src/` | Application source — see below |
| `public/` | Static assets, PWA icons, `skills/` knowledge base |
| `supabase/functions/` | Edge Functions (import, identification, link resolution) |
| `supabase/migrations/` | DB schema evolution |
| `scripts/` | Release-gate guards, seed scripts, ops tooling |
| `docs/` | Long-form audits and design memos |
| `e2e/` | Playwright smoke tests |
| `.github/workflows/ci.yml` | CI pipeline (lint, typecheck, test, build, smoke) |
| `.lovable/` | Lovable cloud sync state |

### Inside `src/`

| Path | Role |
|------|------|
| `pages/` | Route components (one per top-level route) |
| `components/` | UI components — `map/`, `tree-sections/`, `dashboard/`, `agent-garden/`, `ui/` (shadcn primitives) |
| `config/` | App constants, environment resolution, country/city/sub-region registries |
| `contexts/` | Global providers (TetolLevel, HiveSeason, MapFilter, UIFlow) |
| `hooks/` | Shared React hooks (tree map data, etc.) |
| `services/` | Cross-cutting services (e.g. unified search) |
| `lib/` | Shared utilities — routes, heart service |
| `integrations/supabase/` | Auto-generated client + types — **do not edit** |
| `data/` | Static datasets (`collective-trees.csv`, `treeSpecies.ts`) |
| `repositories/` | Typed data access (in-progress — see ARCHITECTURE.md item 1) |
| `utils/` | Pure utilities (external sources, Overpass, CSV) |
| `styles/` | Global CSS, map styles |
| `test/` · `tests/` · `__tests__/` | Test files (consolidation pending) |

---

## Routing

- All routes live in `src/lib/routes.ts` — use `ROUTES.MAP` etc., never raw strings.
- Routing tree wired in `src/App.tsx`.

Key public surfaces:

| Route | Page |
|-------|------|
| `/map` | Interactive Leaflet map |
| `/atlas` · `/atlas/:countrySlug` · `/atlas/:countrySlug/:subSlug` | Country & sub-region portals |
| `/country/:countrySlug/:citySlug` | Legacy explicit city path |
| `/library` | Heartwood rooms |
| `/dashboard` | Hearth (personal hub) |
| `/vault` | Wallet, Staff NFTs, NFTree minting |
| `/council-of-life` | Governance |
| `/bug-garden` · `/agent-garden` · `/roadmap` | Community contribution surfaces |

---

## Map system

- Entry: `src/pages/MapPage.tsx`
- Orchestrator: `src/components/Map.tsx`
- Primary renderer: `src/components/LeafletFallbackMap.tsx` *(large, multi-responsibility — split planned)*
- Filters/overlays: `MapFilterContext`, `GroveViewOverlay`, blooming clock layers
- External sources: `src/utils/externalTreeSources.ts`, `src/utils/overpassTrees.ts`

---

## Search system

- Service: `src/services/unified-search.ts` (static indices + dynamic Supabase queries, dedupe + score)
- UI: `src/components/GlobalSearch.tsx` (omni-search), `src/components/MapSearch.tsx` (what3words on map)

---

## Data layer (Supabase boundaries)

- Client singleton: `src/integrations/supabase/client.ts` — generated
- Types: `src/integrations/supabase/types.ts` — generated
- Env resolution + fallback: `src/config/env.ts` *(holds the public Supabase anon fallback — see security-check note in `CURRENT_TASKS.md`)*
- Edge Functions: `supabase/functions/` — import, vision (`birdsong-identify`, `extract-what3words-from-image`), link resolution, etc.
- Static datasets sit in `src/data/`.

---

## Important configs

| Concern | File |
|---------|------|
| Routes | `src/lib/routes.ts` |
| Countries | `src/config/countryRegistry.ts` |
| Cities | `src/config/cityRegistry.ts` |
| Sub-regions | `src/config/subRegionRegistry.ts` |
| Environment | `src/config/env.ts` |
| Contracts | `src/config/` + `src/contracts/` |
| Vite / PWA | `vite.config.ts` |
| Tailwind | `tailwind.config.ts` |
| ESLint | `eslint.config.js` |
| TS | `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` |

---

## Major product systems

- **Ancient Friends** — tree atlas, encounters, offerings (root layer)
- **Hearts economy** — `src/lib/heartService.ts`, `src/utils/issueRewards.ts`
- **Staff NFTs / NFTrees** — Base chain, ethers.js, `/vault` route
- **Heartwood Library** — `src/pages/` library routes; markdown rooms in `public/skills/`
- **Council of Life** — governance, digital fire votes
- **Agent Garden / Bug Garden** — contributor-facing intake surfaces
- **Living Forest Roadmap** — `/roadmap` route

---

## Release gate (`npm run release-check`)

Runs in this order — and CI runs the same:

1. `typecheck` — `tsc --noEmit`
2. `lint` — eslint
3. `security:check` — `scripts/security-check.mjs` *(currently blocked — see `CURRENT_TASKS.md`)*
4. `check:duplicates` — `scripts/check-duplicate-artifacts.mjs`
5. `guard:assets` — `scripts/asset-budget.mjs`
6. `test` — vitest
7. `build` — `vite build` (writes `public/version.json`)

A second CI job runs Playwright smoke against the built `dist/`.

---

## Where to add new work

| Goal | Insertion points |
|------|------------------|
| New country page | `src/config/countryRegistry.ts` (+ optional `cityRegistry` / `subRegionRegistry`); reuse `CountryPortalPage.tsx` |
| New external tree source | `src/utils/externalTreeSources.ts` (+ optional `overpassTrees.ts`); rendering toggles in `LeafletFallbackMap.tsx` |
| New import pipeline | `src/components/TreeImportExport.tsx`, `src/utils/csvHandler.ts`, optional Edge Function in `supabase/functions/` |
| New route | `src/lib/routes.ts` (always first), then page in `src/pages/`, then wire in `src/App.tsx` |
| New skill / knowledge | `public/skills/` markdown — index in `SKILL.md` |

---

## Canonical docs (read these for depth)

- [`README.md`](./README.md) — overview, scripts, structure
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — full architectural review + top 10 prioritised improvements
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — contribution principles, code style, release safety
- [`DEV_SETUP.md`](./DEV_SETUP.md) — local env, CSP notes, port troubleshooting, churn/dupe guards
- [`AGENTS.md`](./AGENTS.md) — agent-collaboration ground rules
- [`CURRENT_TASKS.md`](./CURRENT_TASKS.md) — what's open right now
- [`RELEASE.md`](./RELEASE.md) — release procedure
- [`docs/`](./docs/) — long-form audits (map stack, RLS, CSP, dataset integration, telegram handoff, etc.)

---

## Working principles

- `main` is sacred trunk — branches only, PRs always.
- One concern per branch, one branch per task.
- `npm run release-check` is the gate. Never bypass.
- Tone: ceremonial, nature-rooted. Keep the voice.
- Auto-generated files (`integrations/supabase/*`) are read-only to humans.
