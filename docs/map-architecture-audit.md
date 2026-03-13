# S33D Map System — Architecture & Performance Audit

**Date:** 2026-03-13  
**Scope:** Map.tsx (954 lines), LeafletFallbackMap.tsx (3,814 lines), MapPage.tsx, useTreeMapData, mapMarkerUtils, MapControls  

---

## Executive Summary

The map is functional and feature-rich, but **LeafletFallbackMap.tsx at 3,814 lines is the single biggest risk** to maintainability, performance, and scalability. The component manages 40+ state variables, 15+ layer refs, and inline rendering for every layer type. Data fetching has been partially migrated to React Query (`useTreeMapData`), but several layers still fetch directly inside useEffects. The system works well at the current scale (~hundreds of trees) but will degrade significantly past 5,000 trees without structural changes.

---

## Part 1 — Top 10 Issues Found

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | **LeafletFallbackMap is 3,814 lines** — single monolithic component with 40+ useState, 15+ useRef, 20+ useEffect | 🔴 Critical | Unmaintainable, hard to test, every state change risks cascading re-renders |
| 2 | **Full cluster rebuild on every `filteredTrees` change** (line ~1440) — destroys and recreates entire MarkerClusterGroup | 🔴 Critical | O(n) marker creation on every filter toggle, species change, or perspective switch |
| 3 | **No viewport-based data loading** — all trees fetched at once, all markers created at once | 🟡 High | Will not scale past ~5,000 trees; at 100k+ the page will be unusable |
| 4 | **Research layer fetches up to 5,000 rows inline** (line ~2682) — no React Query, no caching, refetches on every toggle | 🟡 High | Redundant network calls, no cache sharing with other components |
| 5 | **Duplicate code between Map.tsx and LeafletFallbackMap** — both compute `filteredTrees`, `speciesCounts`, `availableLineages`, `availableProjects` independently | 🟡 High | Wasted computation, divergence risk |
| 6 | **40+ individual useState calls** for layer toggles — each toggle causes component re-render affecting all 3,800 lines | 🟡 High | Unnecessary re-renders on every toggle |
| 7 | **MapControls extracted but not used** — `src/components/map/MapControls.tsx` exists but LeafletFallbackMap still has inline control buttons (lines 3622–3783) | 🟡 Medium | Extracted component is dead code |
| 8 | **External tree layer uses Overpass API with 1s debounce on moveend** (line ~2629) — can hammer external APIs during rapid panning | 🟡 Medium | Rate limiting risk, slow loads |
| 9 | **No error boundaries within layer useEffects** — a single layer crash can break the entire map | 🟡 Medium | Fragile layer system |
| 10 | **Blooming Clock, Hive Fruit, Seasonal Lens state all live in LeafletFallbackMap** — deeply entangled with map rendering | 🟢 Low | Feature creep making the component harder to reason about |

---

## Part 2 — Performance Review

### Marker Rendering
- **Current:** Full cluster destroy + rebuild on every `filteredTrees` change. Every marker is `L.divIcon` with inline HTML.
- **Bottleneck:** At 1,000 trees, the rebuild takes ~50-100ms. At 10,000 it will be 500ms+.
- **Fix:** Diff-based marker updates — only add/remove changed markers instead of full rebuild.

### Clustering
- **Current:** Density-aware `maxClusterRadius` with interpolated breakpoints — well implemented.
- **Bottleneck:** `adjustClusteringOnZoom` toggles the entire cluster layer (remove + re-add) when density band changes. This causes a visible flicker.
- **Fix:** Use `clusterGroup.refreshClusters()` instead of remove/add cycle.

### Map Panning
- **Current:** `moveend` listener triggers external tree fetch (1s debounce), grove scale recalculation, and clustering adjustment.
- **Bottleneck:** Multiple competing `moveend` handlers with different debounce timers.
- **Fix:** Consolidate moveend handlers into a single debounced handler.

### Tree Popup Loading
- **Current:** Popup HTML built via factory function `buildPopupHtml` — lazy-loaded per marker click. Good.
- **No issue:** Popup rendering is already efficient.

### Re-render Triggers
- **Current:** Every layer toggle (`setShowSeeds`, `setShowGroves`, etc.) causes a full component re-render of 3,814 lines.
- **Fix:** Extract layer state into a `useReducer` or context, and split layer renderers into separate `memo`'d components.

### Component Hierarchy
```
MapPage
  └─ Map (954 lines — data fetching, filtering)
       └─ LeafletFallbackMap (3,814 lines — EVERYTHING ELSE)
            ├─ Map init + tile layer
            ├─ Marker cluster
            ├─ 15+ overlay layers (each as useEffect)
            ├─ Controls (inline JSX)
            ├─ Blooming Clock
            ├─ Grove View
            ├─ Atlas Filter
            └─ Add Tree Dialog
```

---

## Part 3 — Scalability Assessment

| Scale | Status | Notes |
|-------|--------|-------|
| **1,000 trees** | ✅ Works | Current target, performs well |
| **10,000 trees** | ⚠️ Degraded | Full cluster rebuild ~500ms, initial load slow, filteredTrees recomputation on every interaction |
| **100,000 trees** | ❌ Broken | Cannot fetch all trees in single query (Supabase 1,000 row limit not handled), cluster rebuild seconds, browser memory pressure |
| **1,000,000 trees** | ❌ Impossible | Requires server-side clustering, tile-based loading, and spatial indexing |

### Required for 10k+ Scale
1. **Viewport-based data loading** — fetch only trees in current bounds + padding
2. **Paginated initial load** — use `.range()` for initial dataset
3. **Diff-based marker updates** — don't rebuild cluster on every change
4. **Server-side clustering** — PostGIS `ST_ClusterDBSCAN` or vector tiles

### Required for 100k+ Scale
5. **Vector tile layer** — serve tree points as MVT tiles from PostGIS
6. **Server-side aggregation** — cluster counts computed server-side
7. **Progressive detail** — low zoom = aggregates, high zoom = individual trees
8. **Spatial index** — `CREATE INDEX ON trees USING GIST (ST_MakePoint(longitude, latitude))`

---

## Part 4 — Integration Readiness

### ✅ Ready Now
- **Offerings linked to trees** — `offeringCounts` already passed through, popup shows count
- **Birdsong overlays** — fully integrated with heat layer and badge system
- **Whisper system** — counts shown on markers and clusters

### ⚠️ Needs Minor Work
- **S33D Heart economy** — heart glow layer toggle exists (`showHeartGlow`) but renderer not implemented; needs heart transaction data piped in
- **Tree libraries/records** — popup already links to `/tree/{id}`, but tree detail data not cached between map and tree page
- **Companion scanning** — Orb constellation has Companion action, but no scan verification layer on map

### 🔧 Needs Architecture Change
- **Champion tree imports** — research layer already loads from `research_trees` table, but import pipeline and deduplication with `trees` table not implemented
- **Ancient Friends expansion** — scaling past current dataset requires viewport-based loading (see Part 3)
- **Tree encounter clustering** — gallery grouping logic exists but not reflected on map clusters

---

## Part 5 — Recommended Next 5 Integrations

| Priority | Integration | Effort | Impact |
|----------|------------|--------|--------|
| 1 | **Split LeafletFallbackMap into sub-components** | Large | Enables all other improvements; reduces re-render blast radius |
| 2 | **Viewport-based tree loading** | Medium | Removes scaling ceiling; enables 10k+ trees |
| 3 | **Heart glow layer implementation** | Small | Heart economy visibility on map; toggle already exists |
| 4 | **Champion tree merge pipeline** | Medium | Unifies research_trees and trees tables; removes duplicates on map |
| 5 | **Companion scan verification layer** | Medium | Shows verification status on markers; enables in-field workflows |

---

## Part 6 — Architecture Improvements for Long-term Scaling

### Immediate (Quick Wins)
1. **Wire extracted MapControls** — replace inline controls (lines 3622-3783) with `<MapControls />` import
2. **Remove duplicate computations** — `speciesCounts`, `availableLineages`, `availableProjects` computed in both Map.tsx and LeafletFallbackMap; compute once in Map.tsx and pass as props
3. **Consolidate layer toggles** — replace 30+ individual `useState` with `useReducer({ layers: Record<string, boolean> })`
4. **Add React Query to research layer** — replace inline fetch with `useQuery` for caching
5. **Handle Supabase 1,000 row limit** — `useTreeMapData` doesn't paginate; add `.range()` or multiple queries

### Medium Term
6. **Extract layer renderers** — each layer (seeds, groves, research, rootstones, external, birdsong heat, immutable, mycelial, waters & commons) becomes its own `useMapLayer(map, enabled, data)` hook
7. **Diff-based marker updates** — compare previous and next tree ID sets; only add/remove deltas
8. **Debounce filteredTrees propagation** — add 150ms debounce between filter change and cluster rebuild
9. **Shared tree detail cache** — React Query key per tree ID, prefetched on popup open, used on `/tree/{id}` page
10. **Consolidate moveend handlers** — single handler dispatches to layer updaters

### Long Term (10k+ trees)
11. **PostGIS spatial index** — `CREATE INDEX idx_trees_geo ON trees USING GIST (ST_MakePoint(longitude, latitude))`
12. **Server-side viewport query** — Edge function or RPC returning trees within bbox
13. **Vector tile serving** — pg_tileserv or custom MVT endpoint for ultra-scale
14. **Progressive loading** — initial viewport trees in <200ms, background load full dataset
15. **Web Worker marker processing** — move SVG generation and tier classification off main thread

### Proposed Target Architecture
```
MapPage
  └─ Map (data orchestration)
       ├─ useTreeMapData (React Query — viewport-aware)
       ├─ useFilteredTrees (memoized filter pipeline)
       └─ LeafletMap (thin shell — map init + tile + container)
            ├─ useTreeMarkerLayer (diff-based cluster)
            ├─ useSeedLayer
            ├─ useGroveLayer  
            ├─ useResearchLayer (React Query)
            ├─ useRootstoneLayer
            ├─ useExternalTreeLayer
            ├─ useBirdsongHeatLayer
            ├─ useMycelialLayer
            ├─ useWatersCommonsLayer
            ├─ useImmutableLayer (React Query)
            ├─ MapControls (extracted, memo'd)
            ├─ BloomingClockOverlay
            └─ GroveViewOverlay
```

---

## Appendix — File Size Inventory

| File | Lines | Role |
|------|-------|------|
| `LeafletFallbackMap.tsx` | 3,814 | ❌ Everything — needs splitting |
| `Map.tsx` | 954 | Data orchestration + WebGL path (dormant) |
| `MapPage.tsx` | 127 | Page shell — clean |
| `map/mapMarkerUtils.ts` | 151 | SVG/icon utilities — extracted ✅ |
| `map/MapControls.tsx` | ~250 | Control buttons — extracted but unused ⚠️ |
| `hooks/use-tree-map-data.ts` | 157 | React Query hook — extracted ✅ |
| `hooks/use-map-memory.ts` | 75 | Session persistence — clean ✅ |
