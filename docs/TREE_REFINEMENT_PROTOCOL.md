# Tree Refinement Protocol — Audit & Design

> A living tree card should evolve like a living record — editable, reviewable,
> source-backed, encounter-informed, and trustworthy.
>
> **Status: audit + design only. No implementation beyond tiny/safe doc + glue.**
> This builds on the refinement systems that ALREADY EXIST. It does **not** propose
> a parallel system — it proposes to *unify* what is already there.

Last reviewed: 2026-05-29 · against `main` @ `70ca7865`.

---

## TL;DR

S33D already has **five** refinement pipelines and **ten** supporting tables. The
machinery is largely built. The problem is **not "missing feature" — it is fragmentation**:

- The **audit trail is split across 3 tables** (`tree_edit_history`, `tree_change_log`,
  `tree_location_history`) and the UI surfaces only one of them.
- There are **two proposal pipelines that both touch location** (`tree_edit_proposals`
  vs `tree_location_refinements`).
- The general-proposal **review page is dev-gated** (`/edit-review` behind `ShowDevPanel`).
- `tree_edit_history` already has an **unused `proposal_id` column + `proposal_accepted`
  edit_type** — the linkage was designed but never wired.

The safe next step is a **unification layer**, not new mechanics.

---

## 1. Current state map

Five pipelines exist today:

| # | Pipeline | Entry UI | Writes to | Review UI | Applies to `trees` |
|---|----------|----------|-----------|-----------|--------------------|
| A | **Direct edit** (creator/steward) | `TreeDirectEditPanel` | `trees` + `tree_edit_history` | none (immediate) | ✅ immediate |
| B | **General proposal** (contributor) | `ProposeEditDrawer` | `tree_edit_proposals` | `EditReviewPage` *(dev-gated)* | on accept → writes `tree_change_log` |
| C | **Location refinement** (encounter/GPS) | `LocationRefinementFlow` (+ `QuickCheckinButton`) | `tree_location_refinements` | `CuratorRefinementReview` (`/curator/refinements`) | on accept → clusters → `tree_location_history` |
| D | **Duplicate / merge** | `ReportDuplicateButton` → `TreeMergeDialog` | `tree_duplicate_reports` | `DuplicateReviewQueue` | on merge → `tree_merge_history` |
| E | **Sources / evidence** | `ContributeSourceModal` | `tree_sources` | `SourceReviewPanel` | verification_status workflow |

Permission gate (shared): **`can_edit_tree(_user_id, _tree_id)`** SECURITY DEFINER RPC,
surfaced via `useTreeEditPermission` → roles **creator / steward / contributor / anonymous**.
`canDirectEdit = creator || steward`. `TreeDetailPage` routes creators/stewards to the
direct panel (A) and everyone else to the proposal drawer (B).

---

## 2. Existing refinement UI / components / routes

| Component | Role |
|-----------|------|
| `src/components/TreeDirectEditPanel.tsx` | Creator/steward direct edit; field-sensitivity confirm dialog |
| `src/components/ProposeEditDrawer.tsx` | Contributor proposal (name/species/w3w/lat-lng/access_notes + reason + evidence + confidence) |
| `src/components/LocationRefinementFlow.tsx` | GPS/encounter location refinement (manual or `checkin_passive`) |
| `src/components/QuickCheckinButton.tsx` | Check-in → offers passive location refinement |
| `src/components/StewardToolsSection.tsx` | Steward affordances on a tree (opens edit/refine) |
| `src/components/ReportDuplicateButton.tsx` · `TreeMergeDialog.tsx` · `DuplicateReviewQueue.tsx` | Duplicate report + merge |
| `src/components/ContributeSourceModal.tsx` · `TreeSourcesDisplay.tsx` · `SourceReviewPanel.tsx` | Source/evidence submit + review |
| `src/components/TreeEditHistory.tsx` | "Record History" — **reads only `tree_edit_history`** |
| `src/pages/EditReviewPage.tsx` | Curator review of `tree_edit_proposals` — route `/edit-review` **(behind `ShowDevPanel`)** |
| `src/pages/CuratorRefinementReview.tsx` | Curator review of `tree_location_refinements` — route `/curator/refinements` |
| `src/hooks/use-tree-edit-permission.ts` | Role resolution via `can_edit_tree` |
| `src/utils/locationRefinement.ts` | Weighted clustering + 4-tier confidence model |

---

## 3. Existing tables / functions / hooks

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `trees` | Canonical card | `latitude, longitude, location_confidence, refinement_count, what3words, access_notes, accessibility_tier, species, species_key, estimated_age, age_exact/min/max/confidence/source, girth_cm, lore_text, photo_*_url, image_similarity_hash, merged_into_tree_id, parent_tree_id, created_by, metadata` |
| `tree_edit_proposals` | Pipeline B proposals | `proposed_changes(json), reason, evidence(json), confidence, flags[], status, proposed_by, reviewer_id, reviewer_note` |
| `tree_edit_history` | Direct-edit trail | `field_name, old_value, new_value, edit_reason, edit_type, user_id, **proposal_id**` |
| `tree_change_log` | Accepted-proposal trail | `change_set(json), previous_values(json), merged_from_proposal_id, merged_by, merged_at` |
| `tree_location_refinements` | Pipeline C points | `latitude, longitude, accuracy_m, at_trunk, source_type, weight, checkin_id, trunk/context/supporting_photo_url, status, reviewed_by/at, review_note` |
| `tree_location_history` | Accepted-location trail | `old/new_latitude/longitude, old/new_confidence, refinement_ids[], changed_by, reason` |
| `tree_duplicate_reports` | Pipeline D | `tree_a_id, tree_b_id, similarity_score, proposer_id, status, reviewed_by/at` |
| `tree_merge_history` | Merge trail | `primary_tree_id, secondary_tree_id, data_migrated, merge_reason, merged_by` |
| `tree_sources` | Pipeline E | `source_title, source_type, url, description, verification_status, verified_by/at, research_tree_id, tree_id` |
| `species_index` | Treeasurus taxonomy | `canonical_name, scientific_name, gbif_taxon_id, genus, family, synonyms[], slug, species_key, rank` |

Functions / hooks: `can_edit_tree` (RPC), `useTreeEditPermission`, `clusterRefinements` /
`computeRefinementWeight` (`locationRefinement.ts`), `useHasRole("curator")`.

---

## 4. What the current refinement option actually does

- **It is real, not a placeholder.** Two distinct, working models:
  - **Direct edit (A)** writes the `trees` row immediately and logs each field to
    `tree_edit_history` with `edit_type:"direct"`. Sensitive fields (lat/lng/w3w = high,
    name/species = medium) trigger a confirm dialog. **Old values are preserved.**
  - **Proposal (B)** writes a `pending` row to `tree_edit_proposals` with reason +
    ≥1 evidence + confidence; auto-flags `major_relocation` (>44 m haversine) and
    `species_change`. A curator accepts/rejects/needs-info in `EditReviewPage`; accept
    applies the diff to `trees` and logs to `tree_change_log`.
- **Location (C)** captures weighted GPS points (manual or passive from check-in),
  clusters them to a confidence-rated centroid, and a curator promotes the centroid to
  the canonical position, archiving to `tree_location_history`.

---

## 5. Missing / incomplete pieces

1. 🔴 **Fragmented trail.** Three history tables; `TreeEditHistory` UI reads only
   `tree_edit_history`. Accepted proposals (`tree_change_log`), accepted location moves
   (`tree_location_history`), and merges (`tree_merge_history`) are **invisible** in the
   tree's Record History.
2. 🔴 **Designed-but-unused linkage.** `tree_edit_history.proposal_id` + the
   `proposal_accepted` edit_type exist but `EditReviewPage` writes `tree_change_log`
   instead of a history row — so the intended unification was never wired.
3. 🟡 **Two location paths.** `ProposeEditDrawer` lets a contributor propose raw lat/lng
   (B) while `LocationRefinementFlow` captures GPS encounters (C). Overlap → confusion
   about which path is canonical for "the pin is off."
4. 🟡 **General review is dev-gated.** `/edit-review` only mounts when `ShowDevPanel`.
   Contributor proposals can accumulate with no production reviewer surface.
5. 🟡 **No per-tree privacy/sensitive flag.** Privacy is user-level
   (`HearthLocationSettings`) and policy-level (`PrivacyPage`); there is **no**
   `trees.is_sensitive` / location-obscuring column for protected/rare specimens.
6. 🟡 **Structured fields not editable.** `trees` has a rich age model
   (`age_min/max/exact/confidence/source`) and `girth_cm`, but neither edit UI exposes
   them — only freeform `estimated_age` (direct) and nothing for size. No
   `height` / `canopy_spread` columns yet.
7. 🟡 **Lore/legend/history/story under-modelled.** Only `lore_text` exists;
   `ProposeEditDrawer` omits lore, and `TreeDirectEditPanel` declares `lore_text` but
   renders no field. "legend / history / story" are not distinct fields.
8. 🟢 **Photos & 3D.** Photo correction flows through location refinements + `tree_sources`,
   not as a first-class proposal field; there is **no main-photo proposal path**. No
   3D/spatial-record column exists on `trees` (only decorative seed-library 3D).
9. 🟢 **No notification loop** surfaced for "your proposal was accepted/rejected".

---

## 6. Proposed schema/design — UNIFY, do not duplicate

**Guiding decision: do not add a new proposals table.** Treat `tree_edit_proposals` as
the **one proposal spine**, and `tree_location_refinements` as a *specialised evidence
feed* that can attach to it. Unify the trail behind a single read model.

### 6a. Unified trail (smallest real change, later — needs approval)
Make `tree_edit_history` the **single canonical trail** by:
- Writing a `tree_edit_history` row (`edit_type:"proposal_accepted"`, `proposal_id` set)
  whenever `EditReviewPage` accepts a proposal — **in addition to** today's
  `tree_change_log` write (keep `tree_change_log` as the rich merge record).
- Writing a `tree_edit_history` row (`edit_type:"location_refined"`) when
  `CuratorRefinementReview` promotes a centroid.
- Writing a `tree_edit_history` row (`edit_type:"merge"`) on merge.
- `TreeEditHistory` UI then reflects the *whole* evolution from one table.
> This is the load-bearing fix. It is additive (no destructive migration) but still a
> DB-write change → **requires explicit approval** before implementation.

### 6b. New columns to consider (future, approval-gated)
- `trees.is_sensitive boolean` + `trees.location_obscure_m int` → privacy for protected trees.
- `trees.height_cm`, `trees.canopy_spread_cm` → complete the size model.
- `trees.spatial_record_url` / `trees.model_url` → 3D readiness (nullable, future).
- No new tables required for any of the above.

### 6c. Refinement-type → pipeline routing (design, not code)
| Refinement type | Pipeline | Immediate vs review |
|-----------------|----------|---------------------|
| position / coordinates | C (encounter) or B (manual) | review-gated if >44 m or verified tree |
| location accuracy / GPS confidence | C | derived by `clusterRefinements` |
| tree name | A (creator) / B (others) | A immediate; B review for canonical-name change |
| species | A if unverified / B otherwise | review on verified trees (see §11) |
| age estimate | A (low-sensitivity) / B | review for hard age *claims* with source |
| size / girth / height / canopy | A / B | low-risk; review only if disputed |
| photos (main) | B (new field) | review; auto-accept for creator |
| 3D / spatial record | B + `tree_sources` | review |
| lore / legend / history / story | A (creator) / B | review for public history *claims* |
| source links | E (`tree_sources`) | existing verification workflow |
| duplicate merge | D | always review (steward) |
| privacy / sensitive location | escalate → steward | always steward-gated |
| accessibility / visit notes | A / B | immediate (low risk) |
| health / seasonal observations | C-adjacent (phenology) | append-only, no canonical overwrite |
| encounter quality / co-meet evidence | C | feeds confidence, not direct overwrite |

---

## 7. UX flow — original creator quick edit (exists; refine copy only)
`TreeDetailPage` → `useTreeEditPermission` returns `creator` → `StewardToolsSection`
opens `TreeDirectEditPanel`. Creator edits low/medium fields, confirms sensitive ones,
saves → `trees` updated + `tree_edit_history` logged. **Already works.** Safe polish:
expose `lore_text` and the structured age/size fields here behind the same sensitivity gate.

## 8. UX flow — contributor refinement proposal (exists; needs prod review surface)
`useTreeEditPermission` returns `contributor` → `ProposeEditDrawer` → `tree_edit_proposals`
(`pending`). **Gap:** the reviewer surface (`EditReviewPage`) is dev-gated. Smallest fix:
gate `/edit-review` on the `curator` role instead of `ShowDevPanel` (see §14).

## 9. Encounter / co-meet refinement flow (exists)
`QuickCheckinButton` → on check-in offers `LocationRefinementFlow` with
`source_type:"checkin_passive"`; `tree_location_refinements.checkin_id` links the
encounter. Weighted by GPS accuracy + `at_trunk` + unique users. Co-meet = multiple
users' points raising confidence to `refined` / `trunk_confirmed`. **Already works.**
Design note: route "this is not oak / girth ≈ X / has a hollow" encounter claims into
Pipeline B (proposal) with an evidence item of type `visit`, not into the location feed.

## 10. Steward review flow (exists, two surfaces)
- Location → `/curator/refinements` (`CuratorRefinementReview`, `useHasRole("curator")`).
- General → `/edit-review` (`EditReviewPage`, `useHasRole("curator")`) — **un-gate from dev**.
High-impact actions (exact coords, species on verified trees, age claims, sensitive
locations, merges, canonical-name changes, public lore) should always land in a review
queue, never immediate — most already flag via `flags[]`.

## 11. Species correction flow & Treeasurus / `species_index` relation
- `trees.species` (freeform) + `trees.species_key` (FK-ish to `species_index.species_key`).
- Direct/proposal edits currently set freeform `species` via `searchSpecies` (local
  `treeSpecies` list). **Design:** a species correction should resolve to a
  `species_index` row and set `species_key` (the Treeasurus canonical id, GBIF-backed),
  not just the string. `ProposeEditDrawer` already auto-flags `species_change`.
- Relation to **Species Concept Layer**: that work owns the canonical concept graph in
  `species_index`. Refinement should *consume* it (resolve → `species_key`) and never
  fork its own species taxonomy. **Mapping point only — do not implement here.**

## 12. Research Trees / Data Commons relation
- `tree_sources.research_tree_id` already links a source to a research tree.
- `researchTreeToTreeRow.ts` / `researchConversion.ts` / `researchTreeAdapter.ts` convert
  research records into `trees` rows (Data Commons ingestion).
- **Design:** an accepted refinement that originates from a research record should record
  provenance via `tree_sources` (Pipeline E) rather than a new field, and a research-led
  species/age correction should reference the dataset as evidence. Mapping point only.

## 13. Privacy & sensitive-location risks
- 🔴 **No per-tree sensitivity flag** → exact coordinates of rare/protected/veteran trees
  are as public as any other. `ProposeEditDrawer` and direct edit both expose raw lat/lng.
- The location pipeline *improves precision*, which is the opposite of what a sensitive
  tree needs. A sensitive tree should be able to **cap** precision (obscure radius) and
  **block** location refinement acceptance.
- Recommendation (approval-gated): `trees.is_sensitive` + `location_obscure_m`; when set,
  hide exact coords from non-stewards, disable Pipeline C promotion, and force any
  position change through steward review.

## 14. Smallest safe PR plan (incremental, each tiny & reversible)
Ordered; none are destructive. **Only #1 is clearly safe to do now without DB approval.**

1. **🟢 Now — Unify the Record History *read*.** Make `TreeEditHistory` also read
   `tree_change_log`, `tree_location_history`, and `tree_merge_history` and merge them
   into one chronological view (read-only; no schema change, no writes). Closes the
   biggest user-visible gap (#5.1) with zero risk.
2. **🟢 Now — Un-gate the review queue.** Route `/edit-review` on `useHasRole("curator")`
   instead of `ShowDevPanel`, and add a `ROUTES.EDIT_REVIEW` constant. Tiny.
3. **🟡 Approval — Cross-write the trail.** On proposal accept + location promote + merge,
   also insert a `tree_edit_history` row (uses the existing `proposal_id` + new edit_types).
   Additive write; needs sign-off because it changes accept handlers.
4. **🟡 Approval — Privacy flag.** Add `trees.is_sensitive` + `location_obscure_m`
   (additive migration) and honour it in map/popup/edit surfaces.
5. **🟡 Approval — Structured fields.** Surface age model + girth/height/canopy in the
   edit UIs; resolve species to `species_key` via Treeasurus.

## 15. What NOT to do yet
- ❌ Do **not** create a new "refinement" table — `tree_edit_proposals` is the spine.
- ❌ Do **not** merge Pipeline B and C into one mechanism; keep the location *evidence*
  feed specialised, just unify the *trail* read.
- ❌ Do **not** implement the Species Concept Layer here — only resolve to `species_key`.
- ❌ Do **not** touch Atlas stats, Heartwood nav, or Lovable visual harmonisation.
- ❌ Do **not** run destructive migrations or rename existing columns.
- ❌ Do **not** auto-accept high-impact changes (coords, species on verified trees, age
  claims, sensitive locations, merges, public lore) — keep them review-gated.
- ❌ Do **not** ship steps 3–5 above without explicit approval.
