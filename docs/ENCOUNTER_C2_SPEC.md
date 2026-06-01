# Encounter C2 - `buildCheckinPayload()` Decision Reference

Status: implemented in PR `#44`.

This document records the accepted Encounter C2 decision and the current
`buildCheckinPayload()` contract. Code comments in
`src/lib/encounters/buildCheckinPayload.ts` reference this file, so it should be
kept as the human-readable reference for the check-in payload core.

C2 follows C1 from [`ENCOUNTER_CONVERGENCE_PLAN.md`](./ENCOUNTER_CONVERGENCE_PLAN.md):

- C1 extracted shared `seasonStage()` logic.
- C2 extracted the shared spatial / method / proof core for `tree_checkins`.

The goal is one encounter trunk for the canonical insert fields, while each UI
surface keeps its own emotional extras such as reflection, weather, Skystamp,
offline media, or refinement nudges.

## Implemented Helper

File: `src/lib/encounters/buildCheckinPayload.ts`

```ts
import { seasonStage } from "@/lib/encounters/encounterSeason";

export const CANOPY_PROOF_MAX_ACCURACY_M = 100;

export type CheckinMethod = "gps" | "manual";

export interface CheckinCoreInput {
  treeId: string;
  userId: string;
  lat?: number | null;
  lng?: number | null;
  accuracyM?: number | null;
  privacy?: string;
  checkinMethod?: CheckinMethod;
  at?: Date;
}

export interface CheckinCorePayload {
  tree_id: string;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  accuracy_m: number | null;
  season_stage: string;
  checkin_method: CheckinMethod;
  canopy_proof: boolean;
  privacy: string;
}

export function buildCheckinPayload(input: CheckinCoreInput): CheckinCorePayload {
  const latitude = input.lat ?? null;
  const longitude = input.lng ?? null;
  const accuracy_m = input.accuracyM ?? null;
  const hasFix = latitude !== null && longitude !== null;

  return {
    tree_id: input.treeId,
    user_id: input.userId,
    latitude,
    longitude,
    accuracy_m,
    season_stage: seasonStage(input.at),
    checkin_method: input.checkinMethod ?? (hasFix ? "gps" : "manual"),
    canopy_proof:
      hasFix && accuracy_m !== null && accuracy_m < CANOPY_PROOF_MAX_ACCURACY_M,
    privacy: input.privacy ?? "public",
  };
}
```

## Accepted C2 Decisions

### `accuracy_m`

`accuracy_m` is now part of the shared payload core and is written whenever a
caller supplies a measured GPS accuracy.

| Path | C2 behavior |
| --- | --- |
| `TreeCheckinButton` | now stores the GPS accuracy it already captured |
| `QuickCheckinButton` | continues storing GPS accuracy |
| `mapWishHandler` | writes `null`, because map-popup check-ins have no GPS fix |
| offline paths | remain caller-supplied; future convergence can route queued check-ins through the helper |

No schema change was needed. `accuracy_m` already existed on `tree_checkins`.

### `canopy_proof`

C2 adopted one stricter formula:

```ts
hasFix && accuracy_m !== null && accuracy_m < 100
```

This means `canopy_proof` now means "GPS fix near enough to count as proof",
not merely "some GPS value existed".

| Path | Before C2 | After C2 |
| --- | --- | --- |
| `TreeCheckinButton` | any latitude made `canopy_proof: true` | only a fix with accuracy under 100 m is proof |
| `QuickCheckinButton` | already accuracy-gated | unchanged in meaning |
| `mapWishHandler` | `false` | `false` |
| offline paths | caller-supplied | caller-supplied |

Existing rows were not backfilled. The change affects new rows only.

### `checkin_method`

By default, the helper derives:

- `"gps"` when both latitude and longitude are present
- `"manual"` when no fix is present

The helper also accepts `checkinMethod?: "gps" | "manual"`.
`TreeCheckinButton` uses this override to preserve its existing behavior: if the
user chose the GPS path but the optional GPS lookup failed, the row can still
record the user's selected method as `"gps"`.

### `privacy`

`privacy` is intentionally typed as `string` in the helper, matching the current
application call sites and generated Supabase types. The helper defaults to
`"public"` for surfaces that did not previously expose a privacy choice.

`TreeCheckinButton` passes through its user-selected privacy value, so C2 does
not change Tree check-in privacy behavior.

### `season_stage`

The helper delegates to the C1 `seasonStage()` helper. Tests pass an optional
`at?: Date` so seasonal output can be verified deterministically.

## Current Call Sites

### `TreeCheckinButton`

`TreeCheckinButton` spreads the shared core and keeps its surface-specific
fields:

```ts
{
  ...buildCheckinPayload({
    treeId,
    userId,
    lat,
    lng,
    accuracyM: accuracy,
    privacy,
    checkinMethod: useGps ? "gps" : "manual",
  }),
  weather: weatherStr,
  reflection: note.trim() || null,
}
```

The async Skystamp update remains outside the core helper.

### `QuickCheckinButton`

`QuickCheckinButton` now inserts the shared core directly:

```ts
buildCheckinPayload({ treeId, userId, lat, lng, accuracyM: accuracy })
```

This preserves its previous public/privacy behavior and its accuracy-gated
`canopy_proof` semantics.

### `mapWishHandler`

Map-popup check-ins have no GPS fix, so they call:

```ts
buildCheckinPayload({ treeId, userId: user.id })
```

That yields explicit `null` coordinates and accuracy, `checkin_method: "manual"`,
`privacy: "public"`, and `canopy_proof: false`.

### Offline / queued check-ins

`offlineActions` still accepts caller-composed payload fields. C2 did not rewrite
offline replay or create a single `recordEncounter()` service. That remains a
later, approval-gated convergence step because it crosses write-path behavior,
queue semantics, notification timing, and user record handling.

## What C2 Did Not Change

- No schema migration.
- No route or UI redesign.
- No backfill of existing `tree_checkins`.
- No notification behavior changes.
- No Skystamp behavior changes.
- No offline replay behavior changes.
- No refinement-offer behavior changes.
- No Hearts/economy behavior changes.

## Tests

File: `src/tests/buildCheckinPayload.test.ts`

Coverage includes:

- `canopy_proof` boundary: 99 m is true, 100 m is false.
- `canopy_proof` false when accuracy is missing or no fix exists.
- `accuracy_m` passthrough and `null` default.
- default `checkin_method` derivation.
- explicit `checkinMethod` override.
- default and pass-through privacy.
- `season_stage` via injected date.
- parity snapshots for `QuickCheckinButton` and `mapWishHandler` behavior.

## Risk Posture

| Risk | Status |
| --- | --- |
| Fewer future Tree check-ins receive a canopy-proof badge when GPS accuracy is poor | Accepted correctness change |
| `TreeCheckinButton` now stores measured `accuracy_m` | Accepted provenance improvement |
| Privacy regression | Mitigated by explicit pass-through test and call-site usage |
| Offline convergence | Deferred; still approval-gated |

## Rollback

C2 can be rolled back with a normal revert of PR `#44`. There is no data
migration to undo and no backfill to reverse. New rows written during C2 may
contain more accurate `accuracy_m` and stricter `canopy_proof` values; those rows
should generally be left intact because they are more honest provenance.
