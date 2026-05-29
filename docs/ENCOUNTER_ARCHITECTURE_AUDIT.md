# Encounter & Check-in Architecture — Audit

> Audit-first, no implementation. Maps the encounter/check-in surface, finds
> duplicate flows, spatial/trust/privacy gaps, and proposes the smallest safe
> convergence path.
>
> Guiding principle: *An encounter should become a trustworthy, evolvable record
> of meaningful presence between people, place, species, and time.*

Last reviewed: 2026-05-29 · against `main` @ `3fccd536`.
Severity: 🔴 user-facing/data-integrity · 🟡 internal drift · 🟢 cosmetic.

---

## 1. Current encounter architecture map

An "encounter" is a row in **`tree_checkins`** attached to an existing `tree_id`.
The table is rich (mostly unused): `tree_id, user_id, latitude, longitude,
accuracy_m, checked_in_at, checkin_method, canopy_proof, confidence_score,
proof_types, privacy, season_stage, weather, weather_snapshot_id, reflection,
mood_score, media_url, birdsong_heard, fungi_present, health_notes,
sky_stamp_id, minted_status`.

Surfaces:
- **`TreeCheckinButton`** — detailed check-in (GPS high-accuracy, inline note, weather, Skystamp).
- **`QuickCheckinButton`** — one-tap check-in (cached low-accuracy GPS, deferred reflection, offers location refinement).
- **`TreeArrivalPanel`** — arrival actions (collect / plant / whispers) — all three render on `TreeDetailPage`.
- **`mapWishHandler`** — a raw-DOM "Check in" button injected into a map popup (no location).
- **`offlineActions.createCheckinOfflineAware`** — offline-aware insert (queues, replays).
- Adjacent: `PostCheckinReflection`, `PostEncounterShare`, `FirstEncounterFunnel`, `CanopyCheckinModal`, `OfflineEncounterPanel`, `EncounterClusterPanel`, `TreeCheckinStatusLight`, `CanopyVisitsTimeline`, `TreesAwaitingVisits`.
- **Co-witness (separate pipeline):** `CoWitnessPanel` + `use-witness-session` + `witness-types` — a two-warden session (QR/link invite → both confirm → `witnessed`, awards `WITNESS_BONUS_HEARTS`). **Not** a `tree_checkins` row.

Location refinement (distinct but coupled): `LocationRefinementFlow` →
`tree_location_refinements`, clustered by `clusterRefinements` → 4-tier confidence
(`approximate/good/refined/trunk_confirmed`).

---

## 2. Current write-path map (the core problem)

Four independent inserts into `tree_checkins`, **no shared builder**:

| Path | GPS | `accuracy_m` | `canopy_proof` | `privacy` | extras |
|------|-----|-------------|----------------|-----------|--------|
| `TreeCheckinButton` | high-accuracy, prompts, 10s | **dropped** (captured, not stored) | `!!lat` | **user-chosen** | weather, Skystamp, inline note, notify creator |
| `QuickCheckinButton` | low-accuracy, cached, silent, 3s | stored | `!!(lat && accuracy<100)` | **hardcoded "public"** | refinement offer (≤30 m), deferred reflection, notify creator |
| `mapWishHandler` | none | none | `false` | hardcoded "public" | raw-DOM button |
| `offlineActions` | caller-supplied | if passed | caller-supplied | (caller) | photo queue |

The `seasonMap` month→stage table is **duplicated verbatim in 3 of the 4 paths**.

---

## 3. Duplicate / convergent systems

- 🔴 **Two check-in buttons with divergent semantics** both on `TreeDetailPage`.
  `canopy_proof` means four different things across paths → the "proof" signal is
  not comparable. `accuracy_m` provenance is inconsistent (TreeCheckinButton
  throws away the accuracy it measured).
- 🟡 **Three encounter surfaces on one page** (Quick + Tree + Arrival) — UX fragmentation.
- 🟡 **Two notions of "together"**: co-witness *sessions* (`witness_session`) vs
  multiple `tree_checkins` / `clusterRefinements.uniqueUsers`. Neither references the other.
- 🟢 **Duplicated `seasonMap`** (3×) and **scattered distance thresholds** with no
  shared constants: similarity bands 15/30/60/100/200 m; canopy_proof <100 m;
  refinement offer ≤30 m; refinement weight steps 5/10/20/50/100 m; relocation
  flag 44 m; merge warning >50 m.

---

## 4. UX flow audit

- **Entry fragmentation:** check-in can begin from the detail page (two buttons +
  arrival panel), a map popup (DOM button), or offline replay — each with different
  fields, GPS behaviour, and privacy defaults.
- **Inconsistent reflection capture:** inline (TreeCheckinButton) vs deferred sheet
  (QuickCheckinButton) vs none (map/offline).
- **Inconsistent proof/confidence feedback:** only Quick surfaces accuracy + a
  refinement nudge; the detailed button (which takes *better* GPS) neither stores
  nor shows accuracy.
- **Co-witness is a parallel ceremony** with its own UI, not surfaced alongside check-in.

---

## 5. Trust / provenance audit

Captured today: `checkin_method` (gps/manual), `canopy_proof` (bool, inconsistent),
`accuracy_m` (inconsistent), `privacy`, `season_stage`, `sky_stamp_id` (Skystamp
proof, TreeCheckinButton only), refinement `weight`/confidence (separate table).

Gaps:
- 🔴 `canopy_proof` is not a trustworthy signal (4 formulas). It conflates
  "had any GPS" with "was demonstrably under the canopy."
- 🟡 `confidence_score` and `proof_types` columns exist but are **unused** — the
  schema already anticipates a structured, multi-proof model that no path writes.
- 🟡 `accuracy_m` missing from the highest-accuracy path (TreeCheckinButton) —
  ironic provenance loss.
- 🟡 No link from a check-in to a resulting location refinement except the
  refinement's own `checkin_id` (one-directional).

---

## 6. Spatial / privacy audit

**Spatial / "same tree vs new tree":** determined at *add-tree* time by
`treeSimilarityEngine.calculateSimilarity` — `locationScore` bands
(≤15 m=1.0 … ≤200 m=0.15) + species/name, yielding a similarity score + confidence;
plus `tree_duplicate_reports` + `image_similarity_hash`. **Encounters themselves
do not run a proximity guard** — you check into whatever `tree_id` the UI passed.

- 🔴 **Nearby-tree ambiguity (veteran groves):** when two ancient trees sit <30–50 m
  apart, (a) a check-in attaches to the UI-selected tree with no "did you mean…?"
  guard, and (b) `clusterRefinements` (maxDrift<50 m only) can fold a neighbour's
  GPS into the wrong tree's centroid → **tree identity drift**.
- 🔴 **Privacy not filtered on read:** the presence/timeline hooks
  (`use-single-tree-presence`, `use-tree-presence-window`, `use-trees-presence-lookup`,
  `use-tree-checkins`) don't reference `privacy` — a check-in marked private may
  still surface in presence/timeline UIs *unless* RLS enforces it (RLS not verified
  in this audit — **must confirm before trusting**).
- 🔴 **No per-tree sensitive-location control** (same gap as the refinement audit):
  encounters *increase* precision for rare/protected trees; nothing caps it.
- 🟡 **Privacy default inconsistency:** Quick + map force `"public"`; only
  TreeCheckinButton lets the user choose. A one-tap check-in silently publishes presence.

---

## 7. Co-meet / multi-user encounter audit

- **Co-witness sessions** (`CoWitnessPanel`) = the only first-class co-encounter:
  two wardens, QR/link, mutual confirm, bonus Hearts. Strong provenance, but
  isolated from `tree_checkins` and from the refinement confidence model.
- **Implicit co-meet** = `clusterRefinements.uniqueUsers` raising location
  confidence (`refined`/`trunk_confirmed`). Good signal, but only for *location*,
  not for "we were here together."
- 🟡 No shared concept linking witness sessions ↔ check-ins ↔ refinement
  unique-user counts. A genuine "co-encounter" record doesn't exist.

---

## 8. Future-ready architecture notes (AR / spatial)

- **No AR/spatial groundwork exists** for trees (only decorative `seed-3d` and a
  `candidateDatasets` mention). Greenfield.
- The schema is already friendly to it: `media_url`, `proof_types` (structured),
  `confidence_score`, `sky_stamp_id`, `weather_snapshot_id`. A future
  spatial/photogrammetry proof would slot in as a new `proof_types` entry +
  `media_url`, without a new table.
- Convergence should therefore standardise `proof_types` **now** (even if only
  `["gps"]`/`["canopy"]`/`["co_witness"]`) so AR (`["spatial_anchor"]`) is additive later.

---

## 9. Smallest safe convergence plan (ordered, each its own tiny PR)

1. 🟢 **Shared constants + one `seasonStage(date)` helper** — extract the duplicated
   `seasonMap` and the scattered distance thresholds into `src/utils/` (pure,
   unit-tested). No behaviour change. *(Safe first step.)*
2. 🟢 **`buildCheckinPayload()` pure helper** — one function the four paths call to
   compose a `tree_checkins` insert (consistent `checkin_method`, `canopy_proof`,
   `accuracy_m`, `season_stage`, `privacy` default). Pure + tested; callers adopt it
   without changing their UX. Fixes the `accuracy_m`-dropped + `canopy_proof`-divergence bugs.
3. 🟡 **Honour `privacy` on read** — add the `privacy` filter to presence/timeline
   hooks (after confirming RLS posture). Closes the read-side privacy gap. *(behaviour-affecting → approval)*
4. 🟡 **Nearby-tree disambiguation guard** — before a passive refinement is accepted,
   flag `nearby_ambiguous` if another tree is within drift radius (steward sees it).
5. 🟡 **Standardise `proof_types`** — write `["gps"|"canopy"|"co_witness"]` so the
   proof model is structured + AR-ready; keep `canopy_proof` as a derived mirror.
6. 🟡 **UX entry consolidation** — pick one primary check-in component; make the
   other a thin variant. No redesign — just one code path.
7. 🟡 **Link co-witness ↔ check-in** — a co-witness session optionally produces a
   check-in row referencing the session, unifying the "together" signal.

---

## 10. What NOT to do yet

- ❌ No `tree_checkins` schema migration (rich columns already exist — use them).
- ❌ No Hearts economy or encounter-reward changes (witness bonus, check-in rewards untouched).
- ❌ No merging of the co-witness pipeline into check-ins yet (link, don't merge).
- ❌ No AR/spatial implementation — only keep `proof_types` additive-ready.
- ❌ No large UX redesign; converge code paths, not the visual design.
- ❌ No hidden behavioural changes — privacy-on-read and proof_types are
  behaviour-affecting and must be explicit, approved steps.
- ❌ Do not touch Atlas / Quest Cave / Data Commons / Heartwood for this work.

---

## Answers to the 12 questions (quick reference)

1. **Encounter =** a `tree_checkins` row on an existing tree (time + optional GPS + season + optional proof/reflection).
2. **Co-encounter =** a co-witness *session* (`CoWitnessPanel`); implicitly, multiple users' check-ins/refinements. No unified record.
3. **Writes to `tree_checkins`:** `TreeCheckinButton`, `QuickCheckinButton`, `mapWishHandler`, `offlineActions` (+ `TreeMergeDialog` reassigns tree_id).
4. **Duplicate pipelines?** Yes — 4 divergent inserts, no shared builder; 2 buttons on one page; a separate co-witness pipeline.
5. **Same vs new tree:** `treeSimilarityEngine` (distance bands + species/name) at add-time; encounters don't re-check proximity.
6. **Nearby-tree risk:** misattributed check-ins + refinement centroid contamination for trees <50 m apart → identity drift.
7. **Provenance captured:** method, (inconsistent) accuracy, (inconsistent) canopy_proof, privacy, season, Skystamp, refinement weight/confidence.
8. **Missing spatial metadata:** consistent `accuracy_m`, structured `proof_types`/`confidence_score` (unused), no spatial anchor, no nearby-guard flag.
9. **Immediate vs review-gated:** check-ins immediate (presence); location *promotion* already review-gated; sensitive-tree position changes should be gated.
10. **Privacy gaps:** read-side filter missing; inconsistent default ("public" forced on 2 paths); no per-tree sensitive control.
11. **Implied future systems:** structured multi-proof encounters; AR/spatial proof via `proof_types`+`media_url`; unified co-encounter record.
12. **Safest convergence:** shared constants + one `buildCheckinPayload()` pure helper first (steps 1–2) — zero UX change, fixes the divergence/provenance bugs.
