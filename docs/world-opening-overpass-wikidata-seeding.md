# Overpass + Wikidata Seeding Adapters

This update wires country seeding to four adapters with provenance-first records:

- `overpassGroves` (Template A): forests / parks / protected areas by country bbox
- `overpassNotableTreesFallback` (Template B): `natural=tree` with monument-style tags
- `wikidataNotableTrees` (SPARQL Template A): tree entities in country
- `wikidataNaturalMonumentsFallback` (SPARQL Template B): natural monuments in country

Every candidate source now includes:

- `source`
- `query`
- `retrieved_at`
- `url`
- `confidence`

Imported nodes remain:

- `status: "research"`
- additive/idempotent
- never overwriting verified/user records (enforced in merge)

## How To Verify

1. Dry run with explicit limits:

```bash
node scripts/seed-country.mjs --country CR --limitGroves 33 --limitTrees 33 --dryRun
```

2. Check output includes all adapters:

- `overpass`
- `wdpa`
- `wikidata_trees`
- `overpass_trees_fallback`
- `wikidata_natural_monuments_fallback`

3. Expected counts when sources are reachable:

- `Selected: groves=33/33, trees=33/33`
- `total=66`

4. If a provider is down/rate-limited, expected behavior:

- command still exits successfully in `--dryRun`
- shows adapter errors and a shortfall warning
- does not write files in dry run mode
