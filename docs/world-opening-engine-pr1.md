# World-Opening Engine (PR1)

PR1 delivers the skeleton pipeline for country opening + seeding:

- country registry (`src/data/countries/registry.json`)
- local country bounds dataset (`src/data/geo/countries.geojson`)
- adapters:
  - `countryBounds`
  - `overpassGroves`
  - `wikidataNotableTrees`
  - `wikidataNotablePlacesFallback`
- scripts:
  - `open-country`
  - `seed-country`

## Provenance and safety guarantees

- every seeded node stores `sources[]` with:
  - `name`
  - `url`
  - `retrieved_at`
  - `license_note`
  - `confidence`
- all imports set:
  - `status = "research"`
  - `created_by = "system_import"`
- idempotent merge:
  - dedupe by `(country, type, normalized name, near coords, source url)`
  - reruns update `last_seen_at` instead of duplicating
- never overwrites verified/user records:
  - records with `status = "verified"` or `created_by = "user"` are preserved

## Commands

```bash
npm run open:country -- --country=CR
npm run seed:country -- --country=CR --limitGroves=33 --limitTrees=33 --dryRun=true
```

Write mode (non-dry):

```bash
npm run seed:country -- --country=CR --limitGroves=33 --limitTrees=33
```

Outputs:

- `src/data/countries/generated/<ISO2>.seed-country.json`
- `src/data/countries/generated/batches/<batch_id>.json`

## Notes

- Adapter failures are isolated. If Overpass/Wikidata fails, other adapters continue.
- PR2 adds WDPA integration and tighter grove candidate ranking.
