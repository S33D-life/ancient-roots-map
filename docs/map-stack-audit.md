# Map Stack Audit (PR0)

## Current stack
- Route: `/map` -> `src/pages/MapPage.tsx`
- Page shell + arrival context: `MapPage` (URL params, journey overlay, arrival banner)
- Core map container: `src/components/Map.tsx`
- Active renderer today: `src/components/LeafletFallbackMap.tsx` (Lite Map)
- Deferred/high renderer path: MapLibre logic remains in `Map.tsx`, but runtime currently defaults to Leaflet.

## Marker + cluster pipeline
- Tree data load in `Map.tsx` (`public.trees` + related overlays).
- Tree markers + popups rendered in `LeafletFallbackMap`.
- Clustering: `leaflet.markercluster` with density-aware radius and zoom thresholds.
- Deep-link focus (`treeId`, lat/lng, bbox, arrival) handled in `LeafletFallbackMap`.

## Filters + layers
- Core filters from `MapFilterContext` + local species/project/lineage filters.
- Layer toggles include seeds, groves, research, rootstones, mycelial, birdsong, etc.
- Atlas/Firefly/map-link actions converge into `/map` URL params.

## Reliability controls
- Global app boundary exists, plus a dedicated map boundary now wraps `Map` in `MapPage`.
- Map fallback path keeps page usable even if map renderer throws.

## Baseline diagnostics added
- Query param gate: `?debug=1`
- Debug panel (Leaflet mode) shows:
  - FPS-ish estimate (rAF delta),
  - marker count,
  - visible cluster count,
  - latest marker render time,
  - active filters.
- Console baseline log in debug mode:
  - `[MapPerf] Leaflet render <ms> | markers=<n> | clusters=<n>`
