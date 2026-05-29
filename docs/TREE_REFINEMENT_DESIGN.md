# Tree Refinement — Forward Design

> Companion to [`TREE_REFINEMENT_PROTOCOL.md`](./TREE_REFINEMENT_PROTOCOL.md) (the
> current-state audit). This file is the **forward design**: encounter architecture
> audit, review-state machine, trust model, relation maps, and UX flows.
>
> **Design only.** The one shipped piece is the read-only **Refinement Trail**
> (PR #28). Everything below that touches writes/schema is **approval-gated**.

Last reviewed: 2026-05-29 · against `main` @ `70ca7865`.

Guiding principle: *A tree is a living record. Its history should evolve
transparently without losing trust, memory, or stewardship lineage.*

---

## 1. Shipped this sprint

**Unified read-only Refinement Trail** (PR #28): `src/utils/refinementTrail.ts`
(+ hook + component + tests) merges `tree_edit_history`, `tree_change_log`,
`tree_edit_proposals` (non-accepted), `tree_location_history`, and
`tree_merge_history` into one chronological, human-readable view. No writes, no
schema change. Closes audit finding §5.1 (fragmented, single-source history).

---

## 2. Encounter / co-meet architecture — audit

### Surfaces today
- **Two check-in entry points** both writing `tree_checkins`:
  - `QuickCheckinButton` — captures GPS `accuracy_m`, sets `canopy_proof`
    (`lat && accuracy < 100`), and **offers a passive `LocationRefinementFlow`**
    (`source_type:"checkin_passive"`).
  - `TreeCheckinButton` — captures GPS, carries a `sky_stamp_id` + canopy proximity proof.
- `LocationRefinementFlow` — the refinement capture (manual or passive) → writes
  `tree_location_refinements` (lat/lng, `accuracy_m`, `at_trunk`, trunk/context photos, `weight`).
- Supporting UI: `EncounterClusterPanel`, `FirstEncounterFunnel`, `OfflineEncounterPanel`,
  `PostCheckinReflection`, `PostEncounterShare`, `CanopyCheckinModal`, `TreeCheckinStatusLight`.
- `clusterRefinements` (`utils/locationRefinement.ts`) — weighted centroid + 4-tier
  confidence (`approximate → good → refined → trunk_confirmed`).

### Findings
| # | Finding | Severity |
|---|---------|----------|
| E1 | **Duplicate check-in paths.** `QuickCheckinButton` *and* `TreeCheckinButton` both insert `tree_checkins` with divergent extras (`canopy_proof` vs `sky_stamp_id`, passive-refinement offer on one only). Risk: inconsistent encounter records + double check-ins. | 🟡 |
| E2 | **Three ways to move a pin.** (a) `ProposeEditDrawer` manual lat/lng proposal → `tree_edit_proposals`; (b) `LocationRefinementFlow` `manual_refinement`; (c) `checkin_passive`. (a) and (b/c) live in different pipelines + different review queues. | 🟡 |
| E3 | **Nearby-tree ambiguity.** `clusterRefinements` assumes every point belongs to the *same* tree; the only scatter guard is `maxDrift < 50 m`. Two real trees < 50 m apart could cross-contaminate refinements. No "which tree did you mean?" disambiguation. | 🟡 |
| E4 | **Privacy inversion.** Encounters *increase* GPS precision — the opposite of what a sensitive/protected tree needs. No per-tree cap. | 🔴 |
| E5 | **No spatial/3D record.** Encounters capture 2D photos (trunk/context) only; no photogrammetry/point-cloud/model field. Placeholder-only. | 🟢 |
| E6 | **Confidence model is solid.** Weighting by accuracy + `at_trunk` + unique users, with a sensible `suggestedUpdate` gate. Keep as-is. | ✅ |

### Recommendations (design only)
- **Converge check-ins** on one component (keep `QuickCheckinButton`, fold
  `TreeCheckinButton`'s sky-stamp into it) — *separate small PR, not now*.
- **Route position intent by evidence type:** "the pin is off" from a real visit →
  location pipeline (C); an armchair/manual coordinate fix → proposal (B). Make
  `ProposeEditDrawer`'s location field hand off to `LocationRefinementFlow` when the
  user is on-site (has fresh GPS) — unifies E2 without merging the tables.
- **Disambiguation guard (E3):** before accepting a passive refinement, check for
  other trees within the drift radius; if found, flag `nearby_ambiguous` for steward eyes.

---

## 3. Refinement review states (state machine)

One lifecycle, shared vocabulary, regardless of which pipeline produced the change.

```
                         ┌─────────────────────────────────────────────┐
                         │                  (creator/steward,           │
   quick edit ───────────┼──► APPLIED ◄─────  low/med fields)           │
                         │      ▲                                       │
                         │      │ accept                                │
 proposed refinement ──► PENDING ├──► NEEDS_MORE_INFO ──► (resubmit) ──► PENDING
   (contributor)         │      │                                       │
                         │      ├──► REJECTED                            │
 encounter refinement ─► PENDING (clustered) ──► accept ──► APPLIED      │
   (GPS/co-meet)         │                                               │
                         │                                               │
 taxonomy correction ──► PENDING ──► curator-approved ──► APPLIED + species_key set
   (species)            │                                               │
                         │                                               │
 duplicate/merge ──────► REPORTED ──► steward review ──► MERGED / DISMISSED
```

State definitions:

| State | Meaning | Who sets it |
|-------|---------|-------------|
| `applied` | Change is live on the `trees` row | direct edit (immediate) or an accept |
| `pending` | Awaiting review | system on submit |
| `needs_more_info` | Reviewer wants evidence; proposer may resubmit | curator |
| `rejected` | Declined, with reason | curator |
| `merged` / `dismissed` | Duplicate resolved | steward |

What is **immediate** vs **review-gated** (unchanged from audit §6c): creator/steward
low–medium fields are immediate; everything high-impact (coords, species on verified
trees, age claims, sensitive locations, merges, canonical-name, public lore) is gated.

---

## 4. Trust model

Each refinement carries provenance so a reviewer (and the public trail) can weigh it.

```
RefinementEvidence
├── confidence      low | medium | high            (self-asserted by proposer)
├── evidence[]      note | link | visit             (≥1 required for proposals)
├── source-backed?  tree_sources row / research_tree_id / dataset
├── proposer        user id → profile (+ standing: contributions, prior accepts)
├── reviewer        curator/steward id + note + timestamp
├── auto-flags      major_relocation | species_change | nearby_ambiguous | sensitive
└── derived weight  (location only) accuracy + at_trunk + unique-users  → confidence tier
```

Trust signals already in the schema:
- `tree_edit_proposals`: `confidence`, `evidence`, `flags`, `reviewer_id`, `reviewer_note`.
- `tree_location_refinements`: `weight`, `at_trunk`, `accuracy_m`, photos, `reviewed_by`.
- `tree_sources`: `verification_status`, `verified_by`, `research_tree_id`.

Design additions (no schema yet):
- **Proposer standing** (derived, read-only): count of prior accepted refinements →
  surfaced as a soft badge in review, never an auto-accept.
- **Provenance chain in the trail:** the Refinement Trail already links
  `proposal → change_log` via `merged_from_proposal_id`; extend the same linkage to
  location (`refinement_ids`) and merges so every applied change names its evidence.

> **Principle:** trust raises *visibility and reviewer confidence*, never bypasses
> review for high-impact fields. No karma-based auto-merge.

---

## 5. Relation maps

### 5a. Pipelines → tables → trail
```
 Direct edit ───────────► trees + tree_edit_history ─────────┐
 Proposal (accepted) ───► tree_change_log ───────────────────┤
 Proposal (open/closed)► tree_edit_proposals ────────────────┤──► Refinement Trail
 Location refine ───────► tree_location_refinements           │     (read-only,
                          └─ accept ─► tree_location_history ─┤      PR #28)
 Merge ─────────────────► tree_duplicate_reports ─► tree_merge_history ┘
 Sources ───────────────► tree_sources (own verification)
```

### 5b. Species correction → Treeasurus / Species Concept Layer
```
 species text (freeform)         species_index  (Treeasurus canonical trunk)
        │                          ├── canonical_name / scientific_name
 ProposeEditDrawer/DirectEdit     ├── gbif_taxon_id, genus, family
        │  flags: species_change  ├── synonyms[], slug, species_key, rank
        ▼                          ▲
 trees.species  ────────resolve───►│  trees.species_key  (the canonical link)
                                   │
 Species Concept Layer (docs)  ────┘  owns the concept graph; refinement CONSUMES it
                                      (resolve → species_key); never forks taxonomy.
```
**Mapping point only.** A species correction should set `species_key` (canonical),
not just the freeform string. Implementation belongs to the Species Concept Layer, not here.

### 5c. Research Trees / Data Commons
```
 Research record ──► researchTreeToTreeRow / researchConversion ──► trees row
        │                                                            ▲
        └──► tree_sources.research_tree_id  (provenance) ────────────┘
 A research-led correction references the dataset as evidence (Pipeline E),
 not a new field. Data Commons ingestion stays the source of record.
```

---

## 6. UX flows (text)

**A — Creator quick edit (exists, PR #28 surfaces the trail)**
```
/tree/:id → Steward Tools → Edit Details
  edit low/med fields → [sensitive? confirm dialog] → Save
  → trees updated + tree_edit_history row → Refinement Trail shows "Direct edit"
```

**B — Contributor proposal (exists; needs prod review surface)**
```
/tree/:id → Steward Tools → Suggest Edit
  toggle fields + reason + ≥1 evidence + confidence
  → tree_edit_proposals (pending) → Trail shows "Suggestion · awaiting review"
  curator @ /edit-review → accept → trees + tree_change_log → Trail "Suggestion accepted"
                          → reject/needs-info → Trail shows status
```

**C — Encounter / co-meet (exists)**
```
At the tree → Check-in (GPS) → "Help refine this location?"
  → LocationRefinementFlow (manual or passive) → tree_location_refinements (pending, weighted)
  multiple wanderers' points → clusterRefinements → confidence rises (co-meet)
  curator @ /curator/refinements → accept → centroid promoted → tree_location_history
  → Trail shows "Location refined"
```

**D — Steward merge (exists)**
```
Report duplicate → tree_duplicate_reports → DuplicateReviewQueue
  → TreeMergeDialog → tree_merge_history → Trail shows "Merged"
```

---

## 7. Smallest-safe PR plan (updated)

| # | Step | Risk | Status |
|---|------|------|--------|
| 1 | Read-only Refinement Trail | 🟢 none | ✅ **PR #28** |
| 2 | Un-gate `/edit-review` to `curator` role + `ROUTES.EDIT_REVIEW` | 🟢 tiny | next |
| 3 | Cross-write `tree_edit_history` on accept/promote/merge (uses existing `proposal_id`) | 🟡 write change | approval |
| 4 | `trees.is_sensitive` + `location_obscure_m` (additive migration) + honour in map/edit | 🟡 migration | approval |
| 5 | Resolve species → `species_key` in edit/proposal; surface age/girth/height/canopy | 🟡 | approval + Species Concept Layer |
| 6 | Converge the two check-in components (E1) | 🟡 | separate small PR |

---

## 8. What NOT to do yet
- ❌ No new proposals/refinement table — `tree_edit_proposals` is the spine.
- ❌ Do not merge Pipeline B and C tables; only unify the *trail* (done) and route by evidence.
- ❌ No karma/auto-merge; trust raises visibility, never bypasses high-impact review.
- ❌ No Species Concept Layer implementation here — resolve to `species_key` only.
- ❌ No destructive migrations; steps 3–6 are approval-gated.
- ❌ Do not touch Atlas stats, Heartwood nav, or Lovable harmonisation.
- ❌ Do not build a large moderation system — keep the curator queues as they are.
