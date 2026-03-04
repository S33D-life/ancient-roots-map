# Rootstones Import Schema

Accepted input formats: CSV or JSON.

## Canonical fields
- `id` (optional)
- `name` (required)
- `type` (required): `tree` | `grove`
- `country` (required)
- `region` (optional)
- `species` (optional)
- `lat` (optional)
- `lng` (optional)
- `place` (optional)
- `mapsUrl` (optional)
- `bounds_north` (optional)
- `bounds_south` (optional)
- `bounds_east` (optional)
- `bounds_west` (optional)
- `lore` (required, short)
- `source_name` (required)
- `source_url` (required)
- `confidence` (required): `high` | `medium` | `low`
- `tags` (required, comma-separated)

## Validation rules
- `type` must be `tree` or `grove`.
- `country` must be present.
- Must provide either:
  - `lat` + `lng`, OR
  - `place` and/or `mapsUrl`.
- `source_url` must be present.

## Normalization behavior
- If `id` is missing, it is generated as:
  - `${countrySlug}-${type}-${nameSlug}`
- Whitespace is trimmed.
- Tags are lowercased, de-duplicated.
- If coordinates are missing, importer adds `needs_coords` tag and emits a warning.
- Deduplication:
  - first by `id`
  - then by `(country + type + name)`.

## Output
Importer writes per-country JSON files to:
- `src/data/rootstones/generated/<country>.json`

Each output file shape:

```json
{
  "country": "Costa Rica",
  "rootstones": [
    {
      "id": "costa-rica-tree-ceiba-sentinel",
      "name": "Ceiba Sentinel",
      "type": "tree",
      "country": "Costa Rica",
      "region": "Osa",
      "species": "Ceiba pentandra",
      "location": {
        "lat": 8.54,
        "lng": -83.58,
        "place": "Corcovado National Park",
        "mapsUrl": "https://www.google.com/maps/..."
      },
      "bounds": {
        "north": 8.62,
        "south": 8.46,
        "east": -83.50,
        "west": -83.66
      },
      "lore": "Short provenance note.",
      "source": {
        "name": "SINAC",
        "url": "https://www.sinac.go.cr/"
      },
      "confidence": "high",
      "tags": ["ancient", "research"]
    }
  ]
}
```
