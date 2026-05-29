# S33D — Harmonisation Audit (running notes)

> Living audit of coherence drift, duplication, route/naming inconsistencies, and
> experiential-flow observations. Maintained during the Public Harmonisation Phase.
> Guiding principle: **Prune. Clarify. Calm. Do not expand.**
>
> Severity key: 🔴 visible to users / disorienting · 🟡 internal drift / will rot · 🟢 cosmetic.
> Status: ✅ fixed · 🛠 safe-to-fix (small) · 🕊 needs design intent (do not hastily fix).

Last reviewed: 2026-05-29 · against `main` post-Lovable-publish.

---

## 0. Shipped this phase

| PR | Change |
|----|--------|
| #22 | Repointed 5 stale `/heartwood/quest-room` links → canonical `/library/quest-cave` (one `<a>`→`<Link>`). |
| #23 | `LibraryRoomGrid` room **names** now derive from `heartwoodRooms.ts` (visual accents stay local). |
| #24 | 5 Heartwood room search results repointed from generic `/library` → canonical room routes. |

---

## 1. Duplication list

Components that still carry their own room label/desc/route data instead of deriving
from `src/config/heartwoodRooms.ts`. Each is a future drift source.

| # | Location | What it duplicates | Severity | Status |
|---|----------|--------------------|----------|--------|
| D1 | `src/components/companion/CompanionController.tsx` (`ROOM_LABELS`) | room key → label map | 🟡 | 🕊 (may be a distinct companion-state taxonomy — confirm before deriving) |
| D2 | `src/components/library/HeartwoodRoomShell.tsx` | room labels/metadata | 🟡 | 🛠 candidate for next PR |
| D3 | `src/services/unified-search.ts` (`HEARTWOOD_ROOMS`) | room title/subtitle/url/emoji | 🟡 | partially addressed (#24 fixed URLs); titles/subtitles still hand-curated |
| D4 | `src/components/TetolQuickShortcuts.tsx` | room label + route | 🟡 | 🛠 |
| D5 | `src/components/library/AncientFriendsRoom.tsx` | room copy | 🟢 | 🕊 |
| D6 | `src/components/LibraryRoomGrid.tsx` | room **names** | ✅ | derived in #23 (emoji/accentH/particle/desc remain intentionally local) |
| D7 | `src/components/Header.tsx` (`PAGE_CONTEXT`) | library room labels | ✅ | derived in PR #21 |

**Recommendation:** treat `heartwoodRooms.ts` as the label source; each remaining
consumer becomes a separate tiny derivation PR. Do **not** batch them — one file per PR.

---

## 2. Drift list

| # | Drift | Detail | Severity | Status |
|---|-------|--------|----------|--------|
| DR1 | **Desktop vs mobile primary nav** | Desktop `Header` has 4 nodes (Atlas/Heartwood/Council/**Crown**, added PR #21). Mobile `BottomNav` has Atlas/**Value Tree**/[Add]/Heartwood/Council — **no Crown**, and surfaces *Value Tree* which desktop folds under Heartwood. The TETOL metaphor (Roots→Trunk→Canopy→Crown) is only complete on desktop. | 🔴 | 🕊 needs design intent — bottom nav slots are full (2+FAB+2); adding Crown is a nav restructure, out of scope this sprint |
| DR2 | **`/golden-dream` has no mobile active state** | `BottomNav` `Council.matchPrefixes` no longer includes `/golden-dream` (and there is no Crown node), so visiting Golden Dream highlights nothing in the bottom nav. | 🟡 | 🕊 (tied to DR1) |
| DR3 | **Room name vs feature name** | "Tree Radio" is a *feature inside* the Music Room, used in places as if it were the room. Aligned in Header page-context (PR #21) and grid (#23) to "Music Room". `unified-search` still subtitles it "Tree Radio" (acceptable as subtitle). | 🟢 | partially addressed |
| DR4 | **Vault label** | Registry label is "Vaults"; some surfaces said "Vault". Grid aligned to "Vaults" (#23). | 🟢 | mostly resolved |
| DR5 | **Spacing rhythm** | Only 1 file uses `BottomNavSpacer`; key pages (`Index`, `HeartwoodLanding`, `GoldenDreamPage`) rely on ad-hoc `pb-12`/`pb-32`/footer for bottom-nav clearance. Inconsistent mobile bottom rhythm. | 🟡 | 🕊 mass-edit = structural; do per-page as touched |

---

## 3. Route inconsistency list

| # | Route issue | Detail | Severity | Status |
|---|-------------|--------|----------|--------|
| R1 | **Search → generic landing** | 5 room results pointed at `/library` not the room. | 🔴 | ✅ fixed in #24 |
| R2 | **`room-gallery` ⇒ Map Room** | In `unified-search`, id `room-gallery` is titled "Map Room" and routes to `/map`. The actual gallery (Ancient Friends) room at `/library/gallery` has **no** search entry. Gallery and Map Room are conflated. | 🟡 | 🕊 needs decision: add a real `/library/gallery` result and/or rename |
| R3 | **`room-press` "Printing Press" ⇒ `/library`** | Creative "Print Press" vs media `/press` are conflated; the search entry lands on the library landing. `LibraryRoomGrid` press tile routes to `/press`. | 🟡 | 🕊 |
| R4 | **`life-groves` route shape** | `HeartwoodLanding.NON_ROOM_ROUTES` maps `life-groves → /heartwood/life-groves`, while `BottomNav` Council prefixes list `/groves`. Two life-grove route shapes coexist. | 🟡 | 🕊 confirm canonical life-groves path |
| R5 | **No `ROUTES.QUEST_CAVE` constant** | Quest-cave links use raw `/library/quest-cave` strings (4 already did; #22 matched them). Convention prefers `ROUTES.*`. | 🟢 | 🛠 add constant + migrate in a small PR |

---

## 4. Naming inconsistency list

| # | Concept | Variants seen | Canonical (per registry) | Status |
|---|---------|---------------|--------------------------|--------|
| N1 | Music room | "Music Room", "Tree Radio" | **Music Room** (room); Tree Radio = feature | aligning |
| N2 | Print/press | "Print Press", "Printing Press", media "Press" | undecided | 🕊 |
| N3 | Vault(s) | "Vault", "Vaults" | **Vaults** | mostly resolved |
| N4 | Wishlist | "Wishing Tree" (label), `wishlist` (key), "Dream Tree" (a *different* map/quest feature) | **Wishing Tree**; Dream Trees is separate — do not merge | clarified |
| N5 | Dev room | "Dev Room", "Tap Root" | **Dev Room** (label), "Tap Root" (subtitle) | consistent |
| N6 | Scrolls | "Scrolls & Records", "ledger" (alias/keyword) | **Scrolls & Records** | consistent |

---

## 5. Mobile orientation audit (task 3 — observations only)

Reviewed: `/`, `/library`, `/library/arborium`, `/library/gallery`, `/library/quest-cave`, `/golden-dream`.

**First-time visitor flow**
- `/` runs a once-only cinematic entrance (`S33dEntrance` via `useEntranceOnce`) then a scroll-driven tree narrative (Crown→Canopy→Trunk→Ground). Strong sense of place; heavy but intentional. No change recommended.
- `/library` (`HeartwoodLanding`) front-loads a lot before rooms: large HEARTWOOD title → mantle clock → 4 CTAs → borrowed-staff card → vault preview → **then** the room grid. On a phone the visitor scrolls a long way before reaching navigable rooms. 🟡 **Consider** (later, with design intent) lifting the room grid higher or collapsing the mantle on mobile. Not done this sprint (structural).

**Room transitions**
- Quest-cave now reached without a redirect hop (#22) — calmer.
- Search now lands in the actual room (#24) — calmer.

**Spacing / bottom-nav clearance**
- `BottomNavSpacer` is used in only 1 file (DR5). Recommend adopting it as the standard bottom clearance on scrollable mobile pages, applied per-page as they're touched (not a mass refactor).

**Bottom-nav clarity**
- Center FAB ("Add Tree") is clear. DR1/DR2 (Crown absent on mobile; `/golden-dream` has no active state) are the main clarity gaps — deferred (need design intent).

**CTA hierarchy**
- `/library` shows 4 sibling CTAs of near-equal weight (Enter the Map / Your Hearth / Companion / Active Opportunities). 🟡 A clearer primary/secondary split would reduce choice overload — copy/weight only, deferred to a focused PR.

**Verdict:** no structural redesign warranted now. The calming wins this sprint were route-level (#22, #24) and label coherence (#23). Remaining items are design-intent calls, captured above.

---

## 6. Loading layer review (task 4 — audit only, do NOT implement yet)

**Current state**
- `index.html` ships an inline splash (`#s33d-splash`): a gold spinner + "Loading Ancient Friends…", on the brand bg `#1a1f14`. Good: instant FCP, no layout shift, replaced on React mount.
- Route-level: `lazyImportWithRetry` + `PageSkeleton` / `SectionShimmer` (small spinners) for lazy chunks.

**Question posed: should loading become TETOL-aware later?**

Recommendation — **yes, later, and cheaply.** A TETOL-aware boot would tint/word the
loader by destination realm (Roots/Trunk/Canopy/Crown), reinforcing the "one living
house" feeling from the very first paint. Concretely, when ready:
1. Keep the inline `index.html` splash as the universal cold-boot (don't make it realm-aware — it must stay dependency-free for FCP).
2. Make the **route-transition** loader realm-aware: `PageSkeleton`/`SectionShimmer` could read the target realm (the `realm(...)` wrapper already tags pages, e.g. Golden Dream = `crown`) and shift hue + a one-line whisper to match.
3. Keep it subtle and motion-safe; respect `prefers-reduced-motion`.

**Effort:** small-to-medium, isolated to the skeleton components + a realm→tint map.
**Risk:** low (visual only). **Not in scope now** — documented for a future sprint.

---

## 7. Next safe PRs (recommended order)

1. **`ROUTES.QUEST_CAVE` constant** (R5) — add to `src/lib/routes.ts`, migrate the raw strings. Tiny.
2. **`HeartwoodRoomShell` label derivation** (D2) — derive from `heartwoodRooms.ts`. One file.
3. **`TetolQuickShortcuts` derivation** (D4) — same pattern. One file.
4. **Search gallery/press conflation** (R2/R3) — needs a quick product decision first, then a tiny fix.
5. *(future sprint)* TETOL-aware route-transition loader (§6); mobile `/library` ordering + CTA hierarchy (§5) — both need design intent.

> Everything above is intentionally small and reversible. No new systems, no schema,
> no Atlas work. Prune, clarify, calm.
