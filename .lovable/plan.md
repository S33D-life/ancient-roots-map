# Ethereal Tree — Full-Screen Immersive Viewing Mode

## What exists today (inspection report)

**A. Current tree components**
- `EtherealOfferingTree.tsx` — the live tree on the Grove page. SVG trunk, one canopy circle, 5 branch strokes, thin threads, plus absolutely-positioned glyph buttons. Exports `OfferingPreviewCard` (small preview under the tree).
- `EtherealTreePreview.tsx` — a simpler decorative tree used in listings/creation. Untouched.
- `LifeGroveOfferingGlyph.tsx` — bespoke SVG glyphs for all ten offering types (leaf, framed leaf, sound-seed, acorn, scroll, letter, fruit, lantern, window, bloom). Already strong; keep and reuse.
- `OfferingLibraryCard.tsx` — per-type rich rendering (photo, song with artwork, book with cover, voice note with audio player, poem, letter). Already the "elevated viewing" logic; reuse rather than rebuild.
- `HangingMemoryTree.tsx` — a legacy grid prototype, superseded by the library tabs. Leave alone.

**B. Enhance vs replace**
- Enhance: `EtherealOfferingTree` visuals (silhouette, luminosity, depth). No replacement, no change to its props contract.
- Reuse unchanged: glyphs, `OfferingLibraryCard`, positions module, offerings query, visibility/stewardship rules, composer.
- New: a full-screen viewing layer and a memory viewer overlay.

**C. How offerings are positioned now**
`src/lib/life-groves/positions.ts` — five quadratic-bezier branches in a 0–400 viewBox. Each offering stores `memory_position_data` (`branch`, `t`, `orbit`, `side`); missing values get a deterministic golden-ratio assignment (least-populated branch, staggered along it). This is good and stays canonical.

**D. Smallest coherent full-screen mode**
One new overlay component rendering the *same* `EtherealOfferingTree` at viewport scale, opened from the Grove page. No routing change, no data change.

**E. Performance**
Pure SVG, ~10–40 nodes. Cheap. Risks: blur filters and infinite animations on low-end phones — so glows use static gradients plus a couple of slow CSS opacity animations, all behind `motion-safe:` / `prefers-reduced-motion`.

**F. Placement** — stays deterministic and data-driven (stored position first, deterministic fallback). No procedural randomness.

**G. Staging** — Phase 1 now; Phases 2–3 listed at the end.

---

## Phase 1 — what gets built

**1. Upgraded tree visual** (`EtherealOfferingTree.tsx`, in place)
- Organic silhouette: tapered trunk with root flare, branches drawn as tapered tapering strokes with secondary twigs, layered canopy clusters rather than one circle.
- Depth: three canopy layers at different opacity/blur, back layer desaturated, front layer catching light.
- Luminosity: a soft inner-light gradient behind the trunk, faint rim light on branch tips.
- Growth response: canopy fullness, glow strength and a small number of ambient motes scale with offering count (0 → sparse and poised; many → fuller, warmer).
- All motion wrapped in `motion-safe:`; durations 6–12s, no fast movement.

**2. Full-screen mode** (`FullscreenTreeView.tsx`, new)
- Fixed overlay, night-sky gradient ground, very light drifting motes, tree centred and scaled to the smaller viewport axis.
- Minimal chrome: close control (top-left), grove/tree name (top centre, small serif), offering-type filter (bottom, horizontal scroll pills), offering count.
- Entered by tapping the tree on the Grove page, or a quiet "Enter the Tree" text action beneath it. Exit: close control, Escape, browser back gesture on mobile is unaffected.
- Body scroll locked while open; focus trapped to the overlay; `role="dialog"`, labelled by the grove name.

**3. Offerings hanging in the branches**
- Same glyph vocabulary, rendered larger in full-screen (44px touch targets) with a gentle per-glyph sway and halo.
- Filtering dims non-matching glyphs to a faint presence instead of removing them — the tree never empties.

**4. Memory viewer** (`OfferingMemoryViewer.tsx`, new)
- Opens over the tree as a calm sheet; the tree stays perceptible behind a soft scrim.
- Body content comes from `OfferingLibraryCard`, so each type keeps its existing elevated presentation.
- Previous / next navigation between offerings (respecting the active filter), attribution line, close control.

**5. Empty state**
- The tree renders quietly with "The branches are waiting" and, for contributors, a single gentle invitation to hang the first offering. Sparse, not blank.

**6. Accessibility**
- Reduced motion removes sway, drift and breathing.
- 44px minimum targets, visible focus rings, arrow-key movement between offerings, Escape closes viewer then tree.

---

## Technical notes

- New files: `src/components/life-groves/FullscreenTreeView.tsx`, `src/components/life-groves/OfferingMemoryViewer.tsx`.
- Edited: `src/components/life-groves/EtherealOfferingTree.tsx` (visual upgrade, optional `scale`/`immersive` props — existing props unchanged), `src/pages/heartwood/LifeGrovePage.tsx` (tap target + "Enter the Tree" + mounts the overlay).
- No database, RLS, RPC, composer, stewardship, invitation or Heartwood Library changes. The overlay consumes the offerings array the page already fetches, so visibility rules are inherited untouched.
- Semantic tokens plus the existing archetype `hueA`/`hueB` values only; no hardcoded colour utilities.

## Deferred

- Phase 2: branch clustering by offering type, cross-fade filter transitions, richer recency radiance.
- Phase 3: ambient audio toggle, deeper parallax, "view in library" jump, shared-link deep focus on one memory.
