# S33D Map UX Review — 2026-03-13

## Part 1 — Exploration Flow Review

### First-time wanderer journey

| Step | Current experience | Friction |
|------|-------------------|----------|
| **Landing** | LevelEntrance animation → PublicTesterBlessing → Map loads underneath | ✅ Cinematic. But blessing + onboarding ritual = two overlays before any interaction. Risk of "click fatigue" before touching a tree. |
| **Understanding** | MapOnboardingRitual (3 steps) appears after 2s delay | The ritual explains poetically but doesn't **point** at anything. User reads "tap any tree" but may not see a marker nearby. No visual arrow or pulse guides the eye. |
| **Discovering nearby** | "Find Me" crosshair button exists but has no label | New users don't know the crosshair icon means "locate me." No auto-locate prompt. The ContextualWhisper about tapping markers fires after 8s — by then many users have already tapped randomly or scrolled away. |
| **Selecting a tree** | Tap marker → popup with photo/name/species/stats | Popup is well-designed but loads inside Leaflet's popup container — no swipe-to-next, no "nearby trees" context. After reading, the only clear action is "View Details" which navigates away entirely. |
| **Exploring story** | Full page navigation to `/tree/:id` | Navigating away from the map loses spatial context. Returning via browser back restores position (sessionStorage) but feels like starting over. No breadcrumb or "return to map" affordance on tree page header. |
| **Returning to explore** | Browser back or header nav | No "continue exploring" prompt. No memory of which trees were already visited. No trail of breadcrumbs. |

### Key friction points
1. **No guided first interaction** — Onboarding tells but doesn't show
2. **No auto-locate on first visit** — Users see the whole world, not their neighbourhood
3. **Dead-end after popup** — "View Details" breaks spatial flow
4. **No visited-tree memory** — Can't tell which markers you've already tapped
5. **Mobile controls unlabelled** — Icon-only buttons require discovery

---

## Part 2 — Discovery Improvements (Ranked)

### 1. "Nearby Ancient Friends" auto-prompt (HIGH IMPACT)
After geolocation succeeds, show a gentle bottom sheet: *"3 Ancient Friends within 2km of you"* with thumbnail cards. Tapping one flies the map to that tree.
- **Why**: Transforms abstract atlas into personal, local experience
- **Complexity**: Low — `filteredTrees` + haversine already available
- **Components**: New `NearbyFriendsSheet.tsx`, hooks into existing `handleFindMe`

### 2. Visited marker dimming / trail (MEDIUM IMPACT)
Track tapped markers in `sessionStorage`. Visited markers get a subtle check badge or 30% opacity reduction. Creates a "collection" feeling.
- **Why**: Encourages completionism and prevents re-tapping
- **Complexity**: Low — CSS class toggle on marker click
- **Components**: `useTreeMarkerLayer` + CSS

### 3. Seasonal highlights on markers (MEDIUM IMPACT)
During blooming season, trees of flowering species get a petal particle ring (CSS only, no canvas). Uses existing `food_cycles` data.
- **Why**: Makes the map feel alive and time-aware
- **Complexity**: Medium — needs species-to-season lookup at marker creation
- **Components**: `mapMarkerUtils.ts`, `map-markers.css`

### 4. "Lonely tree" gentle nudge (LOW-MEDIUM IMPACT)
Trees with 0 offerings get a subtle breathing animation (already partially exists in TreesAwaitingVisits panel). Surface one random lonely tree as a whisper: *"This oak has been waiting 47 days for its first offering."*
- **Why**: Creates empathy and purpose
- **Complexity**: Low — data already fetched
- **Components**: `ContextualWhisper` with dynamic message

### 5. Exploration progress ring (MEDIUM IMPACT)
Small circular progress indicator showing "You've met 3 of 12 Ancient Friends in this area." Updates as user taps markers.
- **Why**: Gentle gamification without pressure
- **Complexity**: Medium — needs viewport tree count + visited tracking
- **Components**: New `ExplorationProgress.tsx`

---

## Part 3 — Tree Interaction Improvements

### Current popup analysis

**Strengths:**
- Beautiful thumbnail with gradient overlay
- Tier badge (Ancient/Storied/Notable) gives instant hierarchy
- Quick-action row (photo, song, birdsong, musing) is excellent
- Popup caching prevents re-render cost

**Weaknesses:**

| Issue | Impact | Fix |
|-------|--------|-----|
| **No "Save to Wishes" button** | Users can't bookmark without navigating away | Add ⭐ toggle to popup action row |
| **What3words address shown but not actionable** | Takes space without utility in popup | Replace with distance from user ("1.2km away") when geolocation available |
| **"View Details" is the only navigation** | Binary choice: stay on map or leave entirely | Add "Fly to Next Nearest" arrow button |
| **Description truncated at 120 chars** | Often cuts mid-sentence with no read-more | Remove description from popup entirely — let it live on tree page. Use space for distance + last-visited instead |
| **No distance indicator** | User doesn't know if tree is walkable | Show "~1.2km · 15 min walk" when geolocated |
| **Action icons have no labels** | 📷🎵🐦💭 require emoji literacy | Add tiny text labels below icons on desktop, keep icon-only on mobile |
| **No "share location" action** | Can't send tree to a friend from popup | Add share icon that copies deep link |

### Recommended popup layout v2

```
┌──────────────────────────┐
│ [Photo / Placeholder]    │
│ [Tier Badge]    [⭐ Save]│
├──────────────────────────┤
│ Tree Name                │
│ Species · ~200y          │
│ 1.2km away · 3 offerings │
├──────────────────────────┤
│ [View Details ⟶]        │
├──────────────────────────┤
│ 📷 Photo  🎵 Song  🌬️ Whisper │
│           [↗ Share]      │
└──────────────────────────┘
```

Key changes:
- **Save/Wish star** in header — one tap to bookmark
- **Distance** replaces what3words in popup
- **Fewer, labelled actions** — Photo, Song, Whisper (3 not 4)
- **Share button** — copies `/tree/:id` deep link

---

## Part 4 — Map Controls & Navigation

### Current control audit

| Control | Location | Issue |
|---------|----------|-------|
| Filters (Layers) | Bottom-left | ✅ Good placement, badge shows count |
| Living Earth Mode | Bottom-left | Unclear name — "Living Earth Mode" doesn't communicate what changes |
| Mycelial Network | Bottom-left | Icon (TreePine) doesn't match concept |
| Atlas nav | Bottom-left | Good — provides exit to structured browsing |
| Find Me | Bottom-center | ✅ Good placement, but no label |
| Add Tree | Bottom-center (desktop only) | Hidden on mobile — major gap since mobile is primary use case |
| Reset View | Bottom-center | Globe icon could be confused with Atlas |
| Clear View | Bottom-right | ✅ Excellent feature for photography/appreciation |
| Recently Added | Top-left | Collapsed by default — easy to miss |
| Awaiting Visits | Bottom-right | Overlaps with Clear View button at certain screen sizes |

### Recommendations

1. **Add tooltip labels on first visit** — Show text labels next to icons for the first session, then collapse to icon-only. Uses `sessionStorage` flag.

2. **Mobile "Add Tree" access** — The `+` button is `hidden md:flex`. On mobile, the only way to add a tree is via bottom nav FAB — but there's no map-context awareness. Add a floating `+` that appears after long-press on map (already mentioned in ContextualWhisper but not implemented).

3. **Rename "Living Earth Mode"** → **"Grove View"** — Clearer, matches existing terminology.

4. **Replace Globe reset icon** with a compass (🧭) or home icon to differentiate from Atlas nav.

5. **Consolidate Recently Added + Awaiting Visits** into a single "Discovery Panel" that tabs between them. Reduces clutter.

6. **Filter breadcrumbs** — When filters are active, show a horizontal chip bar below header (ActiveFilterChips exists but may not show all filter types clearly).

---

## Part 5 — Magical Micro-Interactions

### Performance-safe enhancements

| Interaction | Implementation | Cost |
|-------------|---------------|------|
| **Marker pulse on proximity** | When geolocated and within 500m of a tree, that marker gets `animation: proximityPulse 3s ease-in-out infinite` CSS class | Negligible — CSS only, applied to ≤5 markers |
| **"You're near!" toast** | When within 200m of a tree, show a gentle toast: *"You're near [Tree Name]. Say hello?"* | Low — haversine check on `watchPosition` update |
| **Seasonal map tint** | Adjust the CSS `filter` on the tile layer based on month. Spring: slightly warmer. Winter: cooler, lower saturation. | Negligible — single CSS property |
| **Popup entry animation** | Current `popIn` animation is good. Add a subtle leaf-fall SVG particle (2-3 leaves) that plays once on popup open for Ancient tier trees. | Low — CSS animation on pseudo-element |
| **Discovery breadcrumb trail** | As user taps trees, draw a faint golden polyline connecting visited markers in order. Creates a personal "journey line." | Low-medium — Leaflet polyline, updated on popup open |
| **Exploration sound cue** | Optional subtle chime (Web Audio, 50ms sine wave) when tapping an Ancient marker. Respects `prefers-reduced-motion`. | Low — <1KB, opt-in |
| **Gentle canopy sway** | Tree markers have a 20s CSS `transform: rotate(±2deg)` animation. Staggered start via `animation-delay` based on tree ID hash. | Negligible — CSS only |
| **Golden hour tint** | Between 5-7pm local time, map tiles get a warm golden overlay (`mix-blend-mode: soft-light`) | Negligible — CSS only |

---

## Part 6 — Top 10 UX Enhancements (Ranked)

### 1. Guided First Tap (Quick Win)
**Description**: After onboarding ritual, pulse the nearest 3 markers with a golden ring animation and add an arrow pointing to the closest one. Auto-locate user on first visit.
**Why**: Eliminates the #1 drop-off point — not knowing what to do first.
**Complexity**: Low — CSS pulse class + auto-trigger `handleFindMe` after onboarding dismissal.
**Components**: `MapOnboardingRitual.tsx`, `LeafletFallbackMap.tsx`

### 2. "Save to Wishes" in Popup (Quick Win)
**Description**: Add a ⭐ toggle button in the popup header. One tap saves the tree to the user's wish list without leaving the map.
**Why**: Creates persistent engagement and a reason to return.
**Complexity**: Low — API call to `tree_wishlists` table, optimistic UI.
**Components**: `mapPopups.ts` (add button), new event listener in `LeafletFallbackMap`

### 3. Distance + Walking Time in Popup (Quick Win)
**Description**: Replace what3words in popup with "~1.2km · 15 min walk" when user is geolocated.
**Why**: Transforms abstract location into actionable decision.
**Complexity**: Low — haversine already available, pass `userLatLng` to `buildPopupHtml`.
**Components**: `mapPopups.ts`

### 4. Nearby Ancient Friends Sheet (Medium)
**Description**: After geolocation, show a bottom sheet with 3-5 nearest trees as cards. Tapping flies to tree.
**Why**: Turns "where am I?" into "who's nearby?" — the core S33D discovery moment.
**Complexity**: Medium — new component with sort + fly-to integration.
**Components**: New `NearbyFriendsSheet.tsx`, `LeafletFallbackMap.tsx`

### 5. Visited Marker Memory (Quick Win)
**Description**: Track opened popups in `sessionStorage`. Add subtle ✓ badge or reduce opacity on visited markers.
**Why**: Prevents confusion, encourages completionism.
**Complexity**: Low — CSS class on marker click event.
**Components**: `useTreeMarkerLayer.ts`, `map-markers.css`

### 6. Proximity Glow + Toast (Medium)
**Description**: Markers within 500m of user get a breathing CSS glow. Within 200m triggers a gentle toast.
**Why**: Creates magical "the map knows where I am" feeling.
**Complexity**: Medium — needs `watchPosition` integration + marker class updates.
**Components**: `LeafletFallbackMap.tsx`, `map-markers.css`

### 7. Discovery Breadcrumb Trail (Medium)
**Description**: Golden polyline connecting visited trees in tap order. Personal journey visualization.
**Why**: Creates narrative from exploration — "my path through the forest."
**Complexity**: Medium — Leaflet polyline layer, coordinate array in session state.
**Components**: New layer in `LeafletFallbackMap.tsx`

### 8. Consolidated Discovery Panel (Quick Win)
**Description**: Merge "Recently Added" and "Awaiting Visits" into tabbed panel. Add "Nearest to You" tab.
**Why**: Reduces map clutter, provides structured discovery options.
**Complexity**: Low — UI reorganization of existing components.
**Components**: `RecentlyAddedTrees.tsx`, `TreesAwaitingVisits.tsx` → new `DiscoveryPanel.tsx`

### 9. Seasonal Map Atmosphere (Quick Win)
**Description**: Adjust tile layer CSS filter based on current month/time of day. Golden hour warmth, winter cool tones, spring vibrancy.
**Why**: Makes every visit feel different; reinforces seasonal consciousness.
**Complexity**: Low — single CSS property change.
**Components**: `LeafletFallbackMap.tsx` tile layer init

### 10. Popup Quick-Share (Quick Win)
**Description**: Add share button to popup that copies tree deep link to clipboard with toast confirmation.
**Why**: Viral loop — sharing trees brings new wanderers.
**Complexity**: Low — `navigator.clipboard.writeText` + toast.
**Components**: `mapPopups.ts`

---

## Summary

### 5 Quick Wins (implement immediately)
1. **Guided First Tap** — auto-locate + pulse nearest markers after onboarding
2. **Save to Wishes in popup** — ⭐ toggle without leaving map
3. **Distance in popup** — replace what3words with "1.2km · 15 min walk"
4. **Visited marker memory** — subtle ✓ on tapped markers
5. **Seasonal map tint** — CSS filter based on month/time

### 3 Medium Improvements (significant exploration boost)
1. **Nearby Ancient Friends Sheet** — bottom sheet with nearest trees after locate
2. **Proximity glow + toast** — markers breathe when you're close
3. **Discovery breadcrumb trail** — golden polyline connecting your journey

### 2 Visionary Features (long-term evolution)
1. **"Tree Trail" curated routes** — Editor-curated walking routes connecting 3-7 trees with narrative. Displayed as a named polyline with waypoint markers. Users can "start trail" and get turn-by-turn walking directions via deep link to maps app. Transforms the atlas from reference tool into guided outdoor experience.
2. **Companion AR scan layer** — When within 50m of a tree, the map transitions to an AR-lite camera view (using device camera + compass) that overlays tree information on the real-world view. Tap to verify/check-in. This bridges the digital atlas with physical presence — the core S33D mission.
