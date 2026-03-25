

# Performance and Stability Polish Pass

A focused "tighten and tidy" pass targeting the highest-impact, lowest-risk improvements across interaction smoothness, render efficiency, mobile stability, and edge-case resilience.

---

## Changes Overview

### 1. Memoize Map.tsx to prevent re-renders from parent state changes

`src/components/Map.tsx` currently re-renders whenever MapPage state changes (blessing dismiss, journey toggle, etc.). Wrap the component body with `React.memo` and memoize the props object so the heavy `LeafletFallbackMap` subtree is not re-evaluated on unrelated UI toggling.

### 2. Fix GroveViewOverlay N+1 query waterfall

In `src/components/GroveViewOverlay.tsx` (lines 91-112), the "awaiting visits" fetch runs up to 30 sequential single-row queries in a for-loop. Replace with a single query using a left join or subquery approach — fetch trees with zero offerings in one call. This eliminates a significant latency spike when opening the Grove Signal panel.

### 3. Stabilize GroveViewOverlay `onEventPulses` call during render

Line 114-116 calls `onEventPulses(eventPulses)` directly during render (not inside useEffect). Move this into a `useEffect` to prevent triggering parent re-renders during the render phase.

### 4. Tighten animation durations for panel transitions

Across `GroveViewOverlay`, `AddOfferingDialog`, and `MusicOfferingFlow`:
- Ensure `AnimatePresence` transitions use `duration: 0.15` to `0.2` (some currently use longer values like 1.5s for atmosphere overlays — those are fine, but panel open/close should be fast).
- The atmosphere overlays in GroveViewOverlay (lines 126-172) use `duration: 1.5` for fade which is appropriate. No change there.

### 5. Memoize `SongRow` component

`src/components/MusicOfferingFlow.tsx` — `SongRow` is already a standalone component but receives new arrow-function props on each render. Wrap `SongRow` with `React.memo` and stabilize the `onSelect`/`onTogglePreview` callbacks with `useCallback` indexed by song ID where they're passed.

### 6. Add `React.memo` to `QuickSeedButton`

The seed button renders inside every tree card. Memoize it so it doesn't re-render when parent card state changes (e.g. hover, scroll).

### 7. CouncilRoom iframe error handling

`src/components/CouncilRoom.tsx` — add an `onError` handler to the iframe and ensure the fallback "Open directly" button is prominent. Currently `iframeError` state exists but may not trigger on all failure modes. Add a 10-second timeout that shows the fallback if `iframeLoaded` hasn't fired.

### 8. Mobile keyboard: prevent map container from resizing

In `src/components/Map.tsx`, the container uses `height: 100dvh`. On iOS Safari, `dvh` changes when the keyboard opens, causing the map to resize and potentially trigger tile reloads. Change to `height: 100svh` (smallest viewport height) or use a fixed height captured on mount, so keyboard appearance doesn't trigger map relayout.

### 9. Prevent double-tap zoom on map control buttons

All map control buttons (Eye toggle, Layers, Locate, Add, Compass) should have `touch-action: manipulation` to prevent iOS 300ms tap delay and double-tap zoom interference.

### 10. `allResults` memo in MusicOfferingFlow

Line 397: `const allResults = [...catalogResults, ...itunesResults]` creates a new array every render. Wrap in `useMemo` keyed on both result arrays.

---

## Files to modify

| File | Change |
|---|---|
| `src/components/Map.tsx` | Memo wrapper, stable height |
| `src/components/GroveViewOverlay.tsx` | Fix N+1 query, move onEventPulses to useEffect |
| `src/components/MusicOfferingFlow.tsx` | Memo SongRow, memoize allResults |
| `src/components/QuickSeedButton.tsx` | Wrap export with React.memo |
| `src/components/CouncilRoom.tsx` | Add iframe load timeout fallback |
| `src/components/LeafletFallbackMap.tsx` | Add touch-action: manipulation to control buttons |

---

## What this does NOT touch

- No architecture changes
- No file restructuring
- No feature removal
- Console logs are already debug-gated — left as-is
- No new dependencies

## Expected outcome

The app should feel noticeably snappier when:
1. Toggling Grove Signal panel (faster query + no render-phase side effect)
2. Opening/closing offering dialogs (tighter transitions)
3. Scrolling tree cards with seed buttons (memoized)
4. Using the map while keyboard is open on mobile (stable container)
5. Tapping map controls on iOS (no 300ms delay)

