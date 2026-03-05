# World-Opening Engine (PR2)

PR2 adds WDPA integration and improves grove candidate ranking quality.

## Additions

- new adapter:
  - `scripts/world-opening/adapters/wdpaProtectedAreas.mjs`
- engine integration:
  - combines Overpass + WDPA grove candidates
  - merges overlapping candidates by name + near-coordinates (provenance preserved)
  - prioritizes WDPA-tagged groves in top-N selection

## Ranking upgrades

- stronger scoring for authoritative protected-area candidates:
  - `wdpa`
  - `national_park`
  - `nature_reserve`
  - candidates with bbox metadata
- improved spatial balancing:
  - grove selection uses tighter per-cell cap while still filling target count

## Safety properties (unchanged)

- status defaults to `research`
- additive imports only
- verified/user rows are never overwritten
- idempotent merge behavior retained

## Verify

```bash
npm run seed:country -- --country=CR --limitGroves=33 --limitTrees=33 --dryRun=true
```

Check summary fields:

- `wdpa_tagged_groves`
- `fallback_groves_used`
- adapter list includes `wdpa`
