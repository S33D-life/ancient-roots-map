# TETOL UX Coherence Audit

> Experiential audit of S33D's four living realms and the thresholds between them.
> **No redesign implementation. No giant rewrites.** The aim is to *evolve toward
> coherence while preserving the current soul and atmosphere* — not to import generic
> modern-app UX.
>
> Companion to the encounter audits. Reviewed against `main` @ `3fccd536`.

Guiding image: S33D should feel like **one living tree you move through** — descend to
the roots, rest in the heartwood, rise to the canopy, bloom at the crown — not a set of
pages behind a menu.

---

## The realm machinery (what already creates coherence)

- **`RealmTransition`** wraps every page with a *directional* enter animation by realm:
  roots **descend** (y+18), trunk **inward-zoom** (scale .96), canopy **lift** (y−16),
  crown **soft bloom** (y−20), seed **zoom-into-heart**, tetol-out **zoom-back-out**.
  Respects `prefers-reduced-motion`. → a real, gentle sense of vertical place.
- **`TetolBridge`** offers "rise to the next realm" prompts (s33d → roots → heartwood → …).
  → connective pacing between realms.
- **`Header`** desktop nav completes **Roots → Trunk → Canopy → Crown** (Crown added PR #21).
- **`realm(<Page>, direction)`** in `App.tsx` tags each route to its realm.

These are genuine strengths — the bones of a living-tree journey exist. The fractures
below are mostly *incompleteness* and *inconsistency*, not absence.

---

## Realm-by-realm audit

### 🌱 Roots / Ancient Friends  (`/map`, `/atlas`, `/species`, `/groves`, `/pulse`, `/add-tree`)
- **Strongest:** the living map (presence layers, blooming clock, grove view); the
  "descend into roots" transition; encounter-on-the-ground.
- **Fractured:** four divergent check-in surfaces (see encounter audit) break the
  feeling of *one* way to "be here"; the map popup is raw-DOM with a different look;
  `[MapDebug]` console logs ship in `RealmTransition`.
- **Shallow:** a one-tap quick check-in can feel like a like-button rather than presence;
  no shared "you are beneath this tree" threshold moment across surfaces.
- **Harmonise:** one encounter service (C1–C3) so every surface *feels* like the same
  act; a single "arrival" micro-moment.

### 🪵 Trunk / Heartwood  (`/library`, `/library/:room`, life-groves, ledger)
- **Strongest:** the hearth metaphor (mantle clock, ember drift); per-room atmospheres
  (`RoomParticles` — every room "breathes differently"); the Journey Spine; the unified
  Refinement Trail now reads as living memory.
- **Fractured:** mobile front-loads HEARTWOOD title → clock → 4 near-equal CTAs →
  borrowed-staff → vault preview **before** the rooms (long scroll to the actual doors);
  Crown exists in the desktop header but **not** the mobile bottom nav.
- **Shallow:** four sibling CTAs of equal weight dilute the primary path; some room
  tiles route to non-room surfaces (atlas/press) without a threshold cue.
- **Harmonise:** lift the room grid higher on mobile; give CTAs a primary/secondary
  rhythm; let entering a room feel like crossing a doorway (reuse RealmTransition inward-zoom).

### 🍃 Canopy / Council  (`/council-of-life`, `/council/records`)
- **Strongest:** the "lift upward" transition suits gathering/governance; records as
  canopy memory.
- **Fractured:** Council sits under the same `canopy` realm as governance utilities, but
  the *emotional* shift from personal (trunk) to communal (canopy) isn't marked by copy
  or atmosphere the way roots↔trunk is.
- **Shallow:** governance can read as a utility list rather than a gathering beneath the
  canopy.
- **Harmonise:** a threshold line on entry ("You rise into the shared canopy…"); shared
  canopy atmosphere tokens.

### 👑 Crown / Golden Dream  (`/golden-dream`)
- **Strongest:** the "soft bloom" transition + the Crown nav node complete the metaphor;
  the dream/philosophy space is a fitting apex.
- **Fractured:** **no mobile entry** (BottomNav lacks Crown; `/golden-dream` has no mobile
  active state — harmonisation drift DR1/DR2); reachable on desktop, near-hidden on phones
  — exactly where pilgrimage happens.
- **Shallow:** as the apex it should feel earned/rare; today it's a sibling tab.
- **Harmonise:** give Crown a mobile presence; consider it as a *destination you ascend to*
  rather than a flat tab.

### Cross-cutting
- **Two naming axes collide:** the home (`/`) scrollytelling sections are **Crown / Canopy
  / Trunk / Ground**, while the TETOL realms are **Roots / Trunk / Canopy / Crown**. Two
  different "Crown"s and "Canopy"s with different meanings → conceptual blur for a careful reader.
- **Threshold is enter-only:** `RealmTransition` animates entry but has **no exit**
  (no `AnimatePresence`) — you bloom *into* a realm but don't *leave* one; half a portal.
- **Desktop/mobile nav disharmony:** desktop = Roots/Trunk/Canopy/Crown; mobile =
  Atlas/Value-Tree/Heartwood/Council (+FAB) — different model, no Crown.

---

## 1. Top 10 tiny / high-leverage coherence wins

1. 🟢 Remove the `[MapDebug]` `console.info` logs from `RealmTransition` (cleanliness; they ship to prod).
2. 🟢 Give `/golden-dream` a **mobile active state** (smallest fix for the Crown-on-mobile gap).
3. 🟢 Add a one-line **threshold whisper** on each realm entry ("You descend to the roots…"), reusing existing copy tone.
4. 🟢 Lift the **room grid higher** on mobile `/library` (move it above the borrowed-staff/vault preview).
5. 🟢 Give HeartwoodLanding's **4 CTAs a primary/secondary rhythm** (weight, not new buttons).
6. 🟢 Disambiguate the **two naming axes** (home sections vs realms) in copy/docs so "Crown" means one thing.
7. 🟢 Apply **per-realm accent tokens** consistently so colour signals which realm you're in.
8. 🟢 Ensure **`TetolBridge` appears on every realm page** (some lack the "rise to next" prompt) for continuous pacing.
9. 🟢 Unify the **encounter micro-moment** copy ("beneath {tree}") across the check-in surfaces (pairs with C1).
10. 🟢 Make room-tile taps that leave Heartwood (atlas/press) show a subtle **"leaving the trunk" cue** instead of a silent jump.

## 2. Top 10 medium architectural UX harmonisations

1. 🟡 **One encounter service, two surfaces** (encounter C1–C3) — ceremonial vs quick as *feeling*, not *implementation*.
2. 🟡 **Complete the threshold** — add `AnimatePresence` exit to `RealmTransition` so leaving a realm is felt.
3. 🟡 **Reconcile desktop/mobile nav** to one model (Crown present on both; resolve Value-Tree vs Crown slot).
4. 🟡 **Heartwood room entry as doorway** — reuse the inward-zoom on `/library → /library/:room`.
5. 🟡 **Canopy emotional shift** — atmosphere + copy marking personal→communal on Council entry.
6. 🟡 **Crown as ascent** — treat Golden Dream as a destination you rise to, with a distinct arrival.
7. 🟡 **Privacy-honest presence** (encounter C4) — private encounters never leak into presence/timeline UIs.
8. 🟡 **Living-memory surfacing** — bring the Refinement Trail / encounter memory into the tree's emotional foreground, not just steward tools.
9. 🟡 **Mobile pilgrimage spine** — a coherent first-time path Roots→Trunk→Canopy→Crown on phones (the TetolBridge chain, made mobile-first).
10. 🟡 **Shared realm atmosphere system** — tokens for light/particle/sound per realm so each *place* has a consistent sensory signature.

## 3. Long-term "living organism" evolution ideas

- **Seasonal/diurnal skin:** the whole tree shifts with real season + time-of-day
  (hooks already exist: `useSeasonalTheme`, `useTimeOfDay`) — make it pervasive, not per-page.
- **Presence as ambient life:** other wanderers' presence felt softly across realms (privacy-honest).
- **Encounter → memory → lore:** an encounter can mature into lore on the tree's living record (ties refinement provenance to story).
- **Co-presence rituals:** co-witness sessions become shared moments visible in both pilgrims' trails.
- **Spatial/AR canopy (far future):** `proof_types` + `media_url` groundwork enables an
  AR "stand beneath the tree" presence layer — additive, not a rewrite.
- **The map as the body:** every realm subtly reachable from the living map, so the tree
  is always the spatial home.

---

## Phased roadmap

- **T1 — tiny harmonisations** (this tier; safe, soul-preserving): wins #1–#10 above —
  debug-log cleanup, mobile Crown active-state, threshold whispers, room-grid lift, CTA
  rhythm, naming disambiguation, realm accent tokens, TetolBridge ubiquity, encounter copy.
- **T2 — experiential coherence:** medium harmonisations #1–#6 — one encounter service +
  two surfaces, complete the threshold (exit animation), nav reconciliation, doorway room
  entry, canopy/crown emotional marking.
- **T3 — spatial / living-system evolution:** privacy-honest presence, living-memory
  surfacing, mobile pilgrimage spine, shared realm atmosphere system, seasonal/diurnal skin.
- **T4 — future immersive / AR / presence layer:** co-presence rituals, encounter→lore
  maturation, spatial/AR canopy via the `proof_types`/`media_url` groundwork.

> Each tier is gated on the one before. T1 is mostly tiny PRs that change nothing
> load-bearing; T3–T4 are vision, not commitments. Preserve the soul: ceremonial tone,
> nature-rooted language, the tree-you-move-through. Evolve toward coherence — never
> toward generic app UX.
