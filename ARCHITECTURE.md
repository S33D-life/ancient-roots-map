# Architecture Review: Ancient Roots Map

## 1) Stack Overview

- Frontend runtime: React 18 + TypeScript + Vite 5 (`src/main.tsx`, `src/App.tsx`, `vite.config.ts`)
- UI system: Tailwind CSS + shadcn/radix primitives (`src/components/ui/*`)
- State/data fetching: React Query + React hooks/contexts (`src/hooks/*`, `src/contexts/*`)
- Backend/data: Supabase (Postgres + Auth + Edge Functions) (`src/integrations/supabase/*`, `supabase/functions/*`, `supabase/migrations/*`)
- Mapping: Leaflet + marker clustering (primary), maplibre-gl (deferred/optional paths)
- PWA/offline: `vite-plugin-pwa` service worker config in `vite.config.ts`

## 2) Routing Structure (including country pages)

Primary route orchestration is in `src/App.tsx`.

Key atlas/country routes:
- `/atlas` -> `WorldAtlasPage`
- `/atlas/:countrySlug` -> `CountryPortalPage`
- `/atlas/:countrySlug/:subSlug` -> `AtlasSubResolver` (resolves to sub-region or city page)
- `/country/:countrySlug/:citySlug` -> `CityTemplatePage` (legacy/explicit city path)
- `/atlas/bio-regions/*` -> bioregion index/detail/calendar pages
- `/atlas/pathways/:pathwaySlug` -> cross-country pathway page

Country/subregion registry model:
- Country metadata and slug mapping: `src/config/countryRegistry.ts`
- City metadata: `src/config/cityRegistry.ts`
- Subregion metadata: `src/config/subRegionRegistry.ts`
- Route decision between city vs subregion: `src/pages/AtlasSubResolver.tsx`

## 3) Data Layer

### Backend sources
- Supabase tables are primary runtime source (example reads across `trees`, `research_trees`, `bio_regions`, `councils`, `bookshelf_entries`)
- Supabase Edge Functions provide external integration and data enrichment:
  - Import/ingestion: `supabase/functions/import-paul-wood-trees/index.ts`
  - Media/intelligence helpers: `birdsong-identify`, `extract-what3words-from-image`, `resolve-music-link`, etc.

### Frontend data access
- Supabase client singleton: `src/integrations/supabase/client.ts`
- Query orchestration split across hooks/services and component-level queries
- Global providers in app shell:
  - `TetolLevelProvider`
  - `HiveSeasonProvider`
  - `MapFilterProvider`
  - `UIFlowProvider`

### Local/static datasets
- `src/data/collective-trees.csv`
- `src/data/treeSpecies.ts`

## 4) Map Layer

Primary map architecture:
- Entry page: `src/pages/MapPage.tsx`
- Map orchestrator: `src/components/Map.tsx`
- Leaflet implementation (primary): `src/components/LeafletFallbackMap.tsx`

How markers/layers are assembled:
- Base tree markers come from Supabase `trees` fetch in `Map.tsx`
- Marker styling/tiers/species-driven visuals are built in `LeafletFallbackMap.tsx`
- Cluster behavior via `leaflet.markercluster`
- Additional visual/data layers include:
  - Grove overlays and filters (`GroveViewOverlay`, `MapFilterContext`)
  - Blooming clock layers
  - External sources via `src/utils/externalTreeSources.ts`
  - OSM pull via `src/utils/overpassTrees.ts`

## 5) Search Layer

Unified search architecture:
- Indexing + aggregation + scoring: `src/services/unified-search.ts`
- UI shell for omni-search: `src/components/GlobalSearch.tsx`
- Map-focused what3words search: `src/components/MapSearch.tsx`

Where results are assembled:
- Static search indices are declared in `unified-search.ts` (`HEARTWOOD_ROOMS`, `SUPPORT_PAGES`, `COUNTRY_PAGES`)
- Dynamic Supabase queries run in parallel inside `unifiedSearch()`
- Results are deduped/scored and grouped before render (`groupResults()` path in same service)

---

## 6) Top 10 Improvement Opportunities (Prioritized)

1. Introduce a typed repository/data-access layer for Supabase queries
- Paths: `src/pages/*`, `src/components/*`, `src/services/unified-search.ts`
- Why: queries are duplicated and spread across UI files; changes to schema ripple broadly.
- Difficulty: Medium

2. Split `LeafletFallbackMap.tsx` into focused modules
- Path: `src/components/LeafletFallbackMap.tsx`
- Why: very large multi-responsibility file (rendering, filtering, popups, external layers, map memory).
- Difficulty: High

3. Normalize search indexing into explicit index builders + contracts
- Path: `src/services/unified-search.ts`
- Why: static + dynamic + scoring logic is centralized but monolithic; hard to test and evolve.
- Difficulty: Medium

4. Add runtime validation for external data ingestion
- Paths: `src/utils/externalTreeSources.ts`, `supabase/functions/import-paul-wood-trees/index.ts`
- Why: heavy use of loose/implicit shapes risks silent bad records.
- Difficulty: Medium

5. Reduce direct data fetching inside page components
- Paths: `src/pages/CountryPortalPage.tsx`, `src/pages/WorldAtlasPage.tsx`, others
- Why: UI and data orchestration are tightly coupled, increasing render complexity and test friction.
- Difficulty: Medium

6. Define a single canonical route registry and enforce its usage
- Paths: `src/lib/routes.ts`, `src/App.tsx`, links across components/pages
- Why: route strings are duplicated and prone to drift.
- Difficulty: Low

7. Improve map performance guardrails for large datasets
- Paths: `src/components/Map.tsx`, `src/components/LeafletFallbackMap.tsx`
- Why: client-side filtering/marker generation can spike CPU/memory as records grow.
- Difficulty: Medium

8. Tighten lint/type safety incrementally with policy tiers
- Paths: `eslint.config.js`, broad `src/**/*`
- Why: current codebase contains substantial relaxed typing patterns; latent runtime risk.
- Difficulty: High

9. Create dedicated import pipeline docs and operational controls
- Paths: `supabase/functions/import-paul-wood-trees/index.ts`, `src/components/TreeImportExport.tsx`, `src/utils/csvHandler.ts`
- Why: ingestion exists but lacks clear operational workflow, rollback strategy, and source governance.
- Difficulty: Medium

10. Add architecture tests around critical integration seams
- Paths: `src/services/unified-search.ts`, map filtering flow, import parsing (`csvHandler`)
- Why: low regression confidence for high-impact flows (search/map/import).
- Difficulty: Medium

---

## 7) Where to Add New Work

### A) “Country pages”

Primary insertion points:
- `src/config/countryRegistry.ts`
  - Add new country entry (slug, descriptors, bbox, source text)
- `src/pages/CountryPortalPage.tsx`
  - Reuse existing dynamic portal behavior keyed by slug and `research_trees.country`
- Optional city/subregion expansions:
  - `src/config/cityRegistry.ts`
  - `src/config/subRegionRegistry.ts`
  - `src/pages/AtlasSubResolver.tsx` (already resolves subregion vs city)

### B) “Research map tree sources / datasets”

Primary insertion points:
- `src/utils/externalTreeSources.ts`
  - Add source registry entries and adapter config
- `src/utils/overpassTrees.ts`
  - OSM-specific source behavior
- `src/components/LeafletFallbackMap.tsx`
  - Rendering toggles and visual treatment for external/research layers
- `src/pages/CountryPortalPage.tsx`
  - Country-level consumption/curation of `research_trees`

### C) “Import pipeline / seed data”

Primary insertion points:
- UI/manual import:
  - `src/components/TreeImportExport.tsx`
  - `src/utils/csvHandler.ts`
- Programmatic ingestion:
  - `supabase/functions/import-paul-wood-trees/index.ts`
- Seed/static sources:
  - `src/data/collective-trees.csv`
  - `src/data/treeSpecies.ts`
- Schema evolution and persistence:
  - `supabase/migrations/*`

