# Navigation and Encounter Editing Refinement

## Goal
Make returning from detail views predictable, let people climb through Heartwood rooms without disrupting scrolling, and make tree corrections easy to find from Encounters while preserving all existing permissions and curator review rules.

## Implementation

### 1. Context-preserving Back navigation
- Add one shared Back control pattern with a 44px mobile tap target and clear accessible label.
- On tree details, return through browser history when the previous entry is inside S33D; otherwise return to the map.
- Preserve map position, filters, and page scroll by using history rather than rebuilding the destination URL.
- Add the same visible treatment to the in-app shared Encounter view, using its existing parent callback.
- Add a visible Back control to Heartwood room views, returning to the prior in-app page or the Heartwood Library when opened directly.
- Do not add a custom horizontal swipe-back gesture; native browser/platform navigation remains untouched.
- Keep the existing discard confirmation inside the unified tree-change dialog, so the page Back control cannot bypass dirty form state while the dialog is open.

### 2. Heartwood “climb the tree” navigation
- Keep `JOURNEY_ROOM_SEQUENCE` as the single room order; do not edit the canonical room registry.
- Replace horizontal room switching with a dedicated vertical room-navigation strip in the shared Heartwood room shell.
- Show the current room plus explicit “Climb to [next room]” and “Descend to [previous room]” controls; disable/omit directions at the ends rather than wrapping.
- Recognize swipe-up/down only inside that dedicated strip, never across room content. Normal page scrolling, maps, galleries, forms, and browser gestures remain unaffected.
- Use vertical entry motion for room changes and render transitions instantly when reduced motion is requested.
- Keep keyboard navigation through explicit controls rather than global arrow-key interception.

### 3. Discoverable tree editing in Encounters
- Add a clearly labelled action beside the current tree’s identity at the top of the Encounters tab.
- Add the corresponding action beside each related tree shown in Shared Encounters, so the target tree is always explicit.
- Resolve each label through the existing server-backed eligibility check: `Edit tree` only for direct-edit eligibility; otherwise `Propose changes`.
- Open the existing `TreeChangeFlow` for Details, Location, and Duplicate/Merge. No second editor or permission path will be introduced.
- Keep the existing discoverable entry on the tree detail page, but make Encounters the primary visible location.
- Leave all write-time permission rechecks and curator workflows unchanged.

## Verification
- Test at a phone-sized viewport that Back returns to the prior in-app view and direct links use the expected parent fallback.
- Confirm the tree-change dialog still warns before discarding unsaved edits.
- Confirm room swipes work only within the navigation strip, normal vertical scrolling remains reliable, controls work without gestures, and first/last rooms do not wrap.
- Confirm every Encounter action names the intended tree, opens the unified three-part change flow, and displays the server-derived `Edit tree` or `Propose changes` label.
- Run focused tests plus the existing test suite; document any pre-existing failures separately.

## Technical notes
- Frontend-only change; no schema, policy, reward, or curator-workflow changes.
- New reusable navigation/control helpers will use existing Button, route constants, semantic tokens, and reduced-motion conventions.
- `src/config/heartwoodRooms.ts` remains untouched because it is the canonical room-order source and owned by the Heartwood lane.
