# Encounter C2 — `buildCheckinPayload()` Before/After Spec

> **Spec only — not implemented.** Approval artifact for convergence step C2 from
> [`ENCOUNTER_CONVERGENCE_PLAN.md`](./ENCOUNTER_CONVERGENCE_PLAN.md). C2 is the first
> step that changes *stored data semantics* (`canopy_proof`, `accuracy_m`), so it is
> approval-gated and documented here before any code.

Against `main` @ `71f3e3ed` (post-C1: `season_stage` already comes from `seasonStage()`).

Goal: one shared composer for the **spatial/method/proof core** of a `tree_checkins`
insert — so the four write paths stop diverging — while each surface keeps its own
emotional extras (weather, reflection, Skystamp, refinement nudge). *One encounter
trunk, many emotional surfaces.*

---

## 1. Current insert payloads (post-C1)

### `TreeCheckinButton` (ceremonial arrival)
```ts
{ tree_id, user_id, latitude: lat, longitude: lng,
  season_stage: seasonStage(), weather: weatherStr,
  reflection: note.trim() || null,
  checkin_method: useGps ? "gps" : "manual",
  privacy,                       // user-chosen (Select)
  canopy_proof: !!lat }          // ← true for ANY GPS fix
// captures `accuracy` from geolocation but DOES NOT write accuracy_m
// + async follow-up: update sky_stamp_id
```

### `QuickCheckinButton` (quick presence) — the reference formula
```ts
{ tree_id, user_id, latitude: lat, longitude: lng,
  accuracy_m: accuracy,
  season_stage: seasonStage(),
  checkin_method: lat ? "gps" : "manual",
  privacy: "public",             // hardcoded
  canopy_proof: !!(lat && accuracy && accuracy < 100) }  // ← accuracy-gated
```

### `mapWishHandler` (map-popup drive-by)
```ts
{ tree_id, user_id,
  season_stage: seasonStage(),
  checkin_method: "manual",
  privacy: "public",             // hardcoded
  canopy_proof: false }          // no GPS
```

### `offlineActions.createCheckinOfflineAware` (resilience layer)
```ts
// inserts the caller-supplied OfflineCheckinInput (minus photoDataUrl):
{ tree_id, user_id, season_stage, mood_score?, reflection?, canopy_proof?, photo_url? }
// no GPS/season logic of its own — caller composes the payload
```

### Fields each path writes today

| field | TreeCheckin | QuickCheckin | mapWish | offline |
|---|:--:|:--:|:--:|:--:|
| `tree_id`, `user_id` | ✅ | ✅ | ✅ | ✅ |
| `latitude` / `longitude` | ✅ | ✅ | ❌ | (caller) |
| `accuracy_m` | ❌ **dropped** | ✅ | ❌ | (caller) |
| `season_stage` | ✅ | ✅ | ✅ | (caller) |
| `checkin_method` | gps/manual | gps/manual | "manual" | (caller) |
| `canopy_proof` | `!!lat` | `acc<100` | `false` | (caller) |
| `privacy` | user-chosen | "public" | "public" | (caller) |
| `weather` | ✅ | ❌ | ❌ | ❌ |
| `reflection` | ✅ inline | ⏳ deferred | ❌ | (caller) |
| `sky_stamp_id` | ✅ async | ❌ | ❌ | ❌ |

---

## 2. Proposed `buildCheckinPayload()` shape

A pure function in `src/lib/encounters/buildCheckinPayload.ts` that composes **only the
spatial/method/proof core**. Surfaces spread its result and add their own extras.

```ts
import { seasonStage } from "@/lib/encounters/encounterSeason";

/** Accuracy (m) at/under which a GPS fix counts as canopy proof. */
export const CANOPY_PROOF_MAX_ACCURACY_M = 100;

export type CheckinPrivacy = "public" | "private"; // mirror existing column values

export interface CheckinCoreInput {
  treeId: string;
  userId: string;
  lat?: number | null;
  lng?: number | null;
  accuracyM?: number | null;
  privacy?: CheckinPrivacy;   // default "public"
  at?: Date;                  // for season_stage; default now
}

export interface CheckinCorePayload {
  tree_id: string;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  accuracy_m: number | null;
  season_stage: string;
  checkin_method: "gps" | "manual";
  canopy_proof: boolean;
  privacy: CheckinPrivacy;
}

export function buildCheckinPayload(input: CheckinCoreInput): CheckinCorePayload {
  const lat = input.lat ?? null;
  const lng = input.lng ?? null;
  const accuracyM = input.accuracyM ?? null;
  const hasFix = lat != null && lng != null;
  return {
    tree_id: input.treeId,
    user_id: input.userId,
    latitude: lat,
    longitude: lng,
    accuracy_m: accuracyM,
    season_stage: seasonStage(input.at),
    checkin_method: hasFix ? "gps" : "manual",
    canopy_proof:
      hasFix && accuracyM != null && accuracyM < CANOPY_PROOF_MAX_ACCURACY_M,
    privacy: input.privacy ?? "public",
  };
}
```

Surfaces then do, e.g. `TreeCheckinButton`:
```ts
.insert({
  ...buildCheckinPayload({ treeId, userId, lat, lng, accuracyM: accuracy, privacy }),
  weather: weatherStr,
  reflection: note.trim() || null,
})
```
`mapWishHandler`: `buildCheckinPayload({ treeId, userId })` (no fix → manual, canopy_proof false — identical to today). `offlineActions`: callers compose via the helper, then queue.

---

## 3. How `accuracy_m` would change

| Path | Before | After | Delta |
|---|---|---|---|
| TreeCheckinButton | captured, **not written** (null/absent) | **written** (the value it already measured) | 🟡 **CHANGE** — Tree check-ins now store GPS accuracy |
| QuickCheckinButton | written | written | none |
| mapWishHandler | absent (no GPS) | `null` (explicit) | 🟢 effectively none |
| offlineActions | caller | caller-via-helper | none if caller adopts |

`accuracy_m` on `tree_checkins` is **not** consumed by the location-refinement
clustering (that reads `tree_location_refinements`). Readers of `tree_checkins.accuracy_m`
are display/typing only (`use-tree-checkins`, canopy timeline). So this is additive
provenance with negligible downstream effect.

## 4. How `canopy_proof` would change

Adopt the **single, stricter, more honest formula** (QuickCheckinButton's):
`hasFix && accuracy_m != null && accuracy_m < 100`.

| Path | Before | After | Delta |
|---|---|---|---|
| TreeCheckinButton | `!!lat` (any fix → true) | accuracy-gated (<100 m) | 🟡 **CHANGE** — a Tree check-in with **no/poor GPS (≥100 m)** now records `canopy_proof:false` (was `true`) |
| QuickCheckinButton | `acc<100` | `acc<100` | none (reference) |
| mapWishHandler | `false` | `false` (no fix) | none |
| offlineActions | caller | caller-via-helper | none if caller adopts |

**Read blast radius:** `CanopyVisitsTimeline` renders a 🌳 "canopy proof" badge from
`canopy_proof`; `use-tree-checkins` exposes it. After C2, some *future* TreeCheckinButton
check-ins (poor GPS) won't show that badge. **No backfill** — existing rows are untouched.
This is a correctness fix: `canopy_proof` should mean "demonstrably near," not "had any GPS."

## 5. What remains identical
- `season_stage` (already shared via C1), `latitude`/`longitude`, `checkin_method`
  derivation (`fix ? gps : manual` — same as today for all paths).
- `privacy`: helper takes it as input (default `"public"`); **TreeCheckinButton keeps its
  user-chosen value**; Quick/map keep `"public"`. No privacy behaviour change.
- Surface-only fields untouched: `weather`, `reflection`, `sky_stamp_id` (Tree),
  deferred reflection + refinement nudge (Quick), photo/offline queue (offline).
- Notifications, refinement-offer logic, offline replay, Hearts — all untouched.
- **No schema change** — every field already exists on `tree_checkins`.

## 6. Risks

| Risk | Sev | Mitigation |
|---|---|---|
| `canopy_proof` flips to `false` for poor-GPS Tree check-ins → fewer badges in `CanopyVisitsTimeline` | 🟡 | Intended/honest; no backfill; document in PR; it only affects *new* rows |
| A surface forgets to pass `privacy` → helper defaults `"public"`, regressing Tree's user choice | 🟡 | `privacy` is an explicit input; Tree passes its `privacy` var; unit test asserts pass-through |
| Storing `accuracy_m` on Tree subtly shifts any consumer that aggregates accuracy | 🟢 | clustering uses a different table; readers are display-only |
| Editing 4 insert sites introduces a typo / dropped field | 🟡 | helper returns the full core object; before/after snapshot tests + e2e smoke |
| `offlineActions` payload shape vs helper output mismatch | 🟢 | adopt helper at call sites that compose offline payloads; keep `OfflineCheckinInput` superset |
| Reduced-motion/UX feel | 🟢 | none — payload only, no UX |

## 7. Test plan
- **Unit (`buildCheckinPayload`):**
  - `checkin_method`: fix → `"gps"`; no fix → `"manual"`.
  - `canopy_proof` boundary: acc 99 → true; **100 → false**; 101 → false; accuracy null → false; no lat/lng → false.
  - `accuracy_m` passthrough (incl. null).
  - `privacy`: default `"public"`; explicit `"private"` preserved.
  - `season_stage`: via injected `at` date (reuses C1 helper).
- **Parity snapshots:** for QuickCheckinButton-equivalent inputs, output is **byte-identical** to today's Quick payload (Quick is the reference). For TreeCheckinButton inputs, assert the **documented deltas only** (`accuracy_m` now present; `canopy_proof` now accuracy-gated) and everything else identical.
- **Suite + e2e:** `npm run typecheck / lint / test / build / e2e -- e2e/smoke.spec.ts`.

## 8. Rollback plan
- C2 is **additive + call-site edits**, no schema/migration. Rollback = single `git revert`
  of the C2 merge commit, which restores the four inline payloads exactly (they remain
  independent literals; the helper is a new file). No data migration to undo; existing
  rows were never modified. Safe and immediate.

---

## Decision requested
Approve C2 to implement with the **stricter canopy_proof** (recommended — honest proof
semantics) and **accuracy_m stored on TreeCheckinButton**. If you'd prefer to preserve
TreeCheckinButton's current `canopy_proof: !!lat` semantics, say so and the helper will
take a `canopyProofMode` flag instead — but that perpetuates the divergence C2 exists to remove.
