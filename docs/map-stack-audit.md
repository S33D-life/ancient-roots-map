# Map Stack Audit (PR0) — Updated 2026-03-13

## Current stack
- Route: `/map` -> `src/pages/MapPage.tsx`
- Page shell + arrival context: `MapPage` (URL params, journey overlay, arrival banner)
- Core map container: `src/components/Map.tsx`
- Active renderer: `src/components/LeafletFallbackMap.tsx` (3,814 lines — refactor in progress)

## New extracted hooks (Phase 1 — created, wiring next)

| Hook | File | Purpose | Status |
|------|------|---------|--------|
| `useMapLayerState` | `src/hooks/use-map-layer-state.ts` | Consolidates 34 layer toggle `useState` into single `useReducer` | ✅ Created |
| `useTreeMarkerLayer` | `src/hooks/use-tree-marker-layer.ts` | **Diff-based** marker cluster management — only adds/removes changed markers | ✅ Created |
| `useMapDeepLinks` | `src/hooks/use-map-deep-links.ts` | Country/hive/species/rootstone deep-link handling | ✅ Created |
| `useTreeFocus` | `src/hooks/use-tree-focus.ts` | "View on Map" fly-to, halo, popup focus, fallback marker | ✅ Created |
| `useTreeMapData` | `src/hooks/use-tree-map-data.ts` | React Query tree/birdsong/seed data with realtime invalidation | ✅ Wired |
| `mapMarkerUtils` | `src/components/map/mapMarkerUtils.ts` | SVG icon generation, icon caching, viewport culling | ✅ Wired |
| `MapControls` | `src/components/map/MapControls.tsx` | Bottom control bar (extracted, ready to replace inline JSX) | ✅ Created |

## Performance improvements delivered

### Diff-based marker updates (`useTreeMarkerLayer`)
- **Before**: Full cluster destroy + rebuild on every `filteredTrees` change → O(n)
- **After**: Computes delta (added/removed tree IDs), uses `cluster.addLayers()` / `cluster.removeLayers()` → O(delta)
- Full rebuild only when clustering config changes (lineageFilter, groveScale, showHiveLayer)
- Console logging in debug mode: `[MapPerf] Diff update: +3 -1 (total: 247)`

### Consolidated layer state (`useMapLayerState`)
- **Before**: 34 individual `useState` → each toggle causes full 3,814-line re-render
- **After**: Single `useReducer` with batch updates → single state update per interaction

## Next wiring step (Phase 2)
Replace the following sections in `LeafletFallbackMap.tsx` with hook imports:
1. Lines 262-337 (34 useState) → `useMapLayerState()`
2. Lines 1440-1820 (marker cluster effect) → `useTreeMarkerLayer()`
3. Lines 964-1094 (deep-link effect) → `useMapDeepLinks()`
4. Lines 1822-2029 (tree focus effect) → `useTreeFocus()`
5. Lines 3622-3783 (inline controls) → `<MapControls />`

Estimated reduction: ~800 lines from LeafletFallbackMap.

## Viewport-based loading blockers
1. **Supabase 1,000 row limit** — `useTreeMapData` doesn't paginate; needs `.range()` or RPC
2. **No spatial index** — Need `CREATE INDEX ON trees USING GIST (ST_MakePoint(longitude, latitude))`
3. **No server-side bbox query** — Need Edge Function or RPC: `SELECT * FROM trees WHERE ST_MakePoint(longitude, latitude) && ST_MakeEnvelope($1,$2,$3,$4,4326)`
4. **Cluster group expects full dataset** — Viewport-based loading requires incremental cluster updates (diff-based hook enables this)

## Recommended next integration
**Wire the extracted hooks into LeafletFallbackMap** — this is the critical path to unlocking all subsequent improvements. Once wired:
1. Each layer can be extracted as its own hook independently
2. Viewport-based loading can be added to `useTreeMapData` without touching the renderer
3. MapControls wiring removes 160 lines of duplicate JSX
