# Hearts + Whisper Evolution — Three Extension Layers

## Approach
All three initiatives reuse existing data (`tree_heart_pools`, `tree_whispers`, check-ins, `heart_transactions`) and existing hooks/components. No new tables, no new polling, no duplicate state.

## 1. Signal Field Layer (Map Extension)
**What**: A soft canvas overlay beneath markers showing signal density as color gradients.
- **Data source**: Existing `heartPoolCounts` and `whisperCounts` refs already in `LeafletFallbackMap`
- **Implementation**: New `useSignalFieldLayer` hook that renders a canvas overlay using tree positions + counts to paint soft radial gradients (green=hearts, blue=whispers, blended=both)
- **Toggle**: Add "Signal Field" to existing layer controls (`useMapLayerState`)
- **Feature flag**: `localStorage` key `s33d-feature-signal-field`
- **Performance**: Renders only on zoom/pan end, uses requestAnimationFrame, skips on mobile if >200 trees visible

## 2. Memory Trails (Personal Overlay)
**What**: Soft polyline connecting the user's recently visited trees.
- **Data source**: Existing `tree_checkins` table (last 20 check-ins)
- **Implementation**: New `useMemoryTrailLayer` hook — fetches recent check-ins on mount, draws a fading polyline with Leaflet
- **Toggle**: Add "My Trail" to layer controls
- **Hearth link**: Add "View my journey" button in Hearth that navigates to map with trail enabled
- **Feature flag**: `localStorage` key `s33d-feature-memory-trails`
- **Performance**: Single query on mount, cached, max 20 points

## 3. Species Resonance (Soft Insights)
**What**: Lightweight per-user species affinity shown in Hearth and tree detail.
- **Data source**: Existing `heart_transactions` + `tree_checkins` joined with `trees.species`
- **Implementation**: New `useSpeciesResonance` hook — single aggregation query, returns top 3 species by interaction count
- **Hearth**: Small "Species Affinity" card in HearthHearts
- **Tree detail**: Subtle line like "You often return to Oaks" when viewing an Oak
- **Feature flag**: `localStorage` key `s33d-feature-species-resonance`
- **Performance**: One query, cached in state, no polling

## Files to Create
- `src/hooks/use-signal-field-layer.ts` — canvas overlay hook
- `src/hooks/use-memory-trail-layer.ts` — polyline overlay hook  
- `src/hooks/use-species-resonance.ts` — aggregation hook
- `src/components/SpeciesResonanceCard.tsx` — Hearth card
- `src/lib/featureFlags.ts` — simple localStorage flag reader

## Files to Modify
- `src/hooks/use-map-layer-state.ts` — add Signal Field + My Trail toggles
- `src/components/LeafletFallbackMap.tsx` — wire new hooks
- `src/components/HearthHearts.tsx` — add Species Resonance card
- `src/components/TreeArrivalPanel.tsx` — add species hint line

## What We Won't Do
- No new database tables
- No new Supabase subscriptions or polling
- No gamification or scoring
- No heavy rendering on mobile
- No changes to orb behavior (phase 1)
