

# Pre-Publish Sweep — Stability, Clarity, Readiness

After a thorough audit of the codebase, the app is in strong shape. The previous performance pass (memoization, touch-action, CouncilRoom timeout, svh fix) addressed the major concerns. This sweep focuses on the remaining small, low-risk polish items.

---

## Findings Summary

**Already solid:**
- Error boundaries in place (MapErrorBoundary, SparkErrorBoundary, GlobalErrorBoundary)
- `escapeHtml` used in all popup builders — no XSS via user input
- No service role keys or secrets in client code
- No stray `console.log` in `.tsx` files (only debug-gated logs in hooks)
- Jitsi iframe has correct `allow` permissions
- CouncilRoom has 10s timeout fallback
- Map uses `100svh` (keyboard-safe)
- `touch-action: manipulation` on map controls
- Key components memoized

---

## Fixes to Apply (7 items)

### 1. Fix GroveViewOverlay z-index conflict with AtlasFilter

Both GroveViewOverlay toggle and AtlasFilter top bar use `z-[1001]`. When both are visible, they can overlap in the top-right corner. The Grove Signal dropdown also uses `z-[1001]` while LiteMapSearch uses `z-[1002]`.

**Fix:** Bump GroveViewOverlay container to `z-[1003]` so it stays above the filter panel backdrop (`z-[1000]`) and search (`z-[1002]`), ensuring the dropdown is always accessible.

**File:** `src/components/GroveViewOverlay.tsx` — line 179

### 2. Add missing `aria-label` to map control buttons

Several map buttons (Locate, Add tree, Compass reset, Layers) lack `aria-label`. They have `title` but no explicit aria attributes for screen readers.

**Fix:** Add `aria-label` to the 4 unlabeled buttons in the map control cluster.

**File:** `src/components/LeafletFallbackMap.tsx` — lines ~3048-3091

### 3. Prevent GroveViewOverlay from mounting when inactive

Currently the entire overlay renders `<AnimatePresence>` blocks even when `active` is false (they just animate out). Since the overlay includes two `useEffect` data fetches gated on `active`, the component itself still mounts. Wrapping the outer fragment in a simple `if (!active) return null` early return would prevent the two Supabase queries from even registering their effect hooks.

**Fix:** Add early return `if (!active) return null` at the top of the component, before the render. The `AnimatePresence` exit animations are not critical enough to justify keeping the component mounted.

**File:** `src/components/GroveViewOverlay.tsx`

### 4. Stabilize CouncilRoom timeout with ref

The `iframeLoaded` check inside the timeout closure captures stale state. If the iframe loads at 9.5s but the timeout fires at 10s, it will still see `false`.

**Fix:** Use a ref to track loaded state alongside the state variable, so the timeout always checks the current value.

**File:** `src/components/CouncilRoom.tsx` — lines 44-51

### 5. Add `sandbox` attribute to Jitsi iframe for security hardening

The Jitsi iframe currently has no `sandbox` attribute. Adding a targeted sandbox improves security.

**Fix:** Add `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"` to both Jitsi iframes.

**File:** `src/components/CouncilRoom.tsx` — lines 82-88, 173-181

### 6. Prevent map popup "Plant Seed" button from firing on map drag

The `data-plant-seed` button in map popups intercepts clicks via event delegation. On mobile, a drag that starts on the button could register as a click.

**Fix:** The existing `setupPopupActions` handler should verify the click target more precisely. Check that `e.target.closest('[data-plant-seed]')` exists before proceeding (likely already done — verify and ensure).

**File:** `src/utils/mapWishHandler.ts` — verify existing guard

### 7. Add `loading="lazy"` to CouncilRoom iframes

The Jitsi embed loads immediately even if the user hasn't scrolled to it. Adding lazy loading defers the heavy iframe until visible.

**Fix:** Add `loading="lazy"` to the non-fullscreen Jitsi iframe.

**File:** `src/components/CouncilRoom.tsx` — line 173

---

## Files to modify

| File | Changes |
|---|---|
| `src/components/GroveViewOverlay.tsx` | z-index bump, early return when inactive |
| `src/components/CouncilRoom.tsx` | Ref-based timeout, sandbox attr, lazy loading |
| `src/components/LeafletFallbackMap.tsx` | aria-labels on 4 control buttons |
| `src/utils/mapWishHandler.ts` | Verify plant-seed click guard |

---

## What this does NOT touch

- No new features
- No architecture changes
- No file restructuring
- No removal of existing functionality

## Confidence level for publish

**High.** The app has solid error boundaries, input sanitization, proper auth patterns, graceful fallbacks, and memoized rendering. These 7 fixes address the remaining edge cases for a smooth first-user experience.

## Known minor issues (non-blocking)

- `DatasetAtlasPage` uses `dangerouslySetInnerHTML` but content is hardcoded (not user input) — safe, but could be refactored later
- The `get_trees_without_offerings` RPC may not exist yet — the fallback query handles this gracefully
- Atmosphere overlays (3 radial gradients) render continuously when Grove View is active — minor GPU cost, acceptable for the visual effect

