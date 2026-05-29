# Encounter Convergence Plan

> Follow-up to [`ENCOUNTER_ARCHITECTURE_AUDIT.md`](./ENCOUNTER_ARCHITECTURE_AUDIT.md)
> (what exists) — this is the precise divergence map + the canonical-flow decision +
> a staged convergence plan. **Audit-first: no implementation, no schema migration,
> no behaviour change, no flow merging yet.**

Last reviewed: 2026-05-29 · against `main` @ `3fccd536`.

Goal feeling: **one living encounter system, multiple contextual surfaces — not
multiple competing implementations.** Convergence must preserve the *emotional*
difference between a ceremonial arrival and a quick presence ping while removing
the *implementation* divergence beneath them.

---

## 1. Full divergence map — the four write paths

All four insert into `tree_checkins`. None share a builder.

| Dimension | `TreeCheckinButton` | `QuickCheckinButton` | `mapWishHandler` | `offlineActions` |
|---|---|---|---|---|
| **Insert site** | `handleSubmit` | `handleCheckin` (useCallback) | DOM `onclick` in map popup | `createCheckinOfflineAware` |
| **GPS strategy** | high-accuracy, **prompts**, 10s timeout | low-accuracy, **cached** (maxAge 120s), **silent** (only if already granted), 3s | **none** | caller-supplied |
| **lat/lng written** | ✅ if GPS | ✅ if granted | ❌ never | caller |
| **`accuracy_m`** | 🔴 **captured then DROPPED** | ✅ stored | ❌ | ✅ if passed |
| **`canopy_proof`** | `!!lat` | `!!(lat && accuracy<100)` | `false` | caller |
| **`confidence_score`** | ❌ unset | ❌ unset | ❌ unset | ❌ unset |
| **`season_stage`** | ✅ (own seasonMap) | ✅ (own seasonMap) | ✅ (own seasonMap) | caller |
| **`weather`** | ✅ optional summary | ❌ | ❌ | ❌ |
| **`reflection`** | ✅ inline note | ⏳ deferred (`PostCheckinReflection`) | ❌ | caller |
| **proof / media** | **Skystamp** (`sky_stamp_id`, async) | ❌ | ❌ | **photo** (`media_url` + storage path) |
| **`proof_types`** | ❌ (only `canopy_proof` bool) | ❌ | ❌ | ❌ |
| **notification** | ✅ notify creator | ✅ notify creator | ❌ | ❌ |
| **refinement/location** | ❌ | ✅ offers `LocationRefinementFlow` (`checkin_passive`) when acc ≤ 30 | ❌ | ❌ |
| **privacy** | ✅ **user-chosen** | 🔴 hardcoded `"public"` | 🔴 hardcoded `"public"` | caller |
| **offline sync** | ❌ fails when offline | ❌ | ❌ | ✅ **queue + replay** (photos too) |
| **UI entry point** | TreeDetailPage — detailed sheet | TreeDetailPage — one-tap | Map popup (raw DOM) | any flow via util |
| **emotional/UX intent** | **ceremonial arrival** — weather, written reflection, sky-stamp keepsake, privacy choice | **quick presence ping** — "I'm here," minimal friction, nudge to refine GPS | **drive-by** from the map | **resilience** — never lose a moment offline |

Shared, duplicated incidentally: the month→`season_stage` `seasonMap` is copy-pasted
in **3** paths; distance thresholds (30/44/50/100 m) are scattered with no constants.

---

## 2. The TRUE canonical encounter flow

**Neither button is "the trunk" wholesale.** The trunk is an *extracted service* both
call; the buttons become thin emotional surfaces over it.

```
                ┌────────────────────────────────────────────┐
   surfaces  →  │  recordEncounter(input, { surface })        │  ← the trunk (new, pure-ish)
                │   • buildCheckinPayload() — one source of    │
                │     truth for season_stage, canopy_proof,    │
                │     accuracy_m, checkin_method, privacy      │
                │   • routes through offlineActions (resilient)│
                │   • fires creator notification               │
                │   • returns checkinId for follow-ups         │
                └───────────────┬───────────────┬─────────────┘
        ┌───────────────────────┘               └───────────────────────┐
   "ceremonial arrival"                                   "quick presence"
   (TreeCheckinButton surface):                           (QuickCheckinButton surface):
   weather + reflection + Skystamp + privacy choice       one-tap + deferred reflection + refine nudge
```

- **Trunk (should become canonical):** a single `recordEncounter()` /
  `buildCheckinPayload()` service. It owns field discipline, offline routing, and
  notification. It does **not** own UX.
- **Specializations (keep — meaningful emotional difference):**
  - `TreeCheckinButton` → the **ceremonial arrival** surface (weather, reflection, Skystamp, privacy).
  - `QuickCheckinButton` → the **quick presence** surface (one-tap, refine nudge).
- **Legacy duplication (retire/redirect):** `mapWishHandler`'s raw-DOM check-in —
  should call the service (or mount the Quick surface in the popup) rather than
  hand-roll an insert with `canopy_proof:false` + forced `"public"`.
- **Resilience layer (route through, don't bypass):** `offlineActions` — the service
  should always go through it so every surface inherits offline safety + media queueing.

### Fields currently silently lost
| Field | Lost by | Consequence |
|---|---|---|
| `accuracy_m` | TreeCheckinButton (captures, never writes) | the *highest-accuracy* path contributes no GPS confidence |
| `confidence_score` | all four | the structured confidence column is dead |
| `proof_types` | all four | only a single ambiguous `canopy_proof` bool; no multi-proof, not AR-ready |
| `media_url` | both buttons | photos only via the offline path |
| `weather_snapshot_id` | all four | structured weather link unused (only freeform `weather` string, Tree only) |
| offline safety | both buttons + map | online-only surfaces drop the moment if the network blips |

---

## 3. Smallest-safe convergence plan (staged)

Each stage is its own tiny PR; the first two are pure/no-behaviour-change.

| Stage | PR | Risk | Behaviour change? |
|---|---|---|---|
| **C1** | `src/utils/encounterSeason.ts` — one `seasonStage(date)` + shared distance constants; replace the 3 duplicated `seasonMap`s. Pure, unit-tested. | 🟢 | None (identical output) |
| **C2** | `buildCheckinPayload()` pure helper; the 4 paths compose their insert through it. Fixes `accuracy_m`-drop + `canopy_proof` divergence by making them consistent. | 🟢→🟡 | Subtle: TreeCheckinButton now *stores* the accuracy it already measured; `canopy_proof` becomes one formula. Document explicitly. |
| **C3** | `recordEncounter()` service wrapping `buildCheckinPayload` + offline routing + notification; surfaces call it. | 🟡 | Behavioural (offline for all) → approval |
| **C4** | Honour `privacy` on read (presence/timeline hooks) after confirming RLS. | 🟡 | Behavioural → approval |
| **C5** | Standardise `proof_types` (`["gps"|"canopy"|"co_witness"]`); keep `canopy_proof` a derived mirror. AR-ready. | 🟡 | Additive write → approval |
| **C6** | Retire `mapWishHandler` raw-DOM insert → mount Quick surface / call service. | 🟡 | UX-adjacent → approval |
| **C7** | Link co-witness sessions ↔ encounter rows (don't merge tables). | 🟡 | New linkage → approval |

**Recommended first build:** C1 only (then C2). Both are pure, unit-testable, and
fix real provenance bugs with zero UX change.

---

## 4. Risk map

| Risk | Likelihood | Mitigation |
|---|---|---|
| C2 changes `canopy_proof` semantics for existing reads | med | choose the stricter formula (`lat && accuracy<100`); document; no backfill |
| Storing `accuracy_m` on TreeCheckinButton shifts refinement weighting | low | it only *improves* provenance; weighting already handles missing accuracy |
| RLS already filters private check-ins (C4 redundant) or doesn't (C4 critical) | unknown | **confirm RLS before C4** — this is a stop-condition |
| Routing all surfaces through offline (C3) changes success/latency feel | med | keep optimistic UI; only the persistence path changes |
| Touching `mapWishHandler` (raw DOM in a Leaflet popup) regresses the map | med | isolate; e2e smoke covers `/map` mount |
| Convergence flattens the emotional distinction | med | **service owns data, surfaces own feeling** — never merge the UIs |

---

## 5. Staged PR sequence (audit-gated)

1. **#(audit)** — this doc + `ENCOUNTER_ARCHITECTURE_AUDIT.md` (#36). *No code.*
2. **C1** — `encounterSeason.ts` (season + constants), pure + tests. 🟢 ready when approved.
3. **C2** — `buildCheckinPayload()`, adopt in 4 paths, tests. 🟢/🟡 (document `accuracy_m`/`canopy_proof`).
4. **C3–C7** — one approval-gated PR each, in order, each with its own audit note.

## What NOT to do yet
No schema migration · no UI redesign · no Hearts/reward change · no flow merge (extract a shared service; keep the two surfaces) · no co-witness merge (link only) · no AR build (keep `proof_types` additive-ready) · no hidden behaviour change (C2+ are explicit, approved).
