# Research Ingest for Rootstones

This pipeline adds a safe curator-only queue for importing rootstone candidates from trusted research text snapshots.

## Why this exists

- Compatible with Pinchtab-style HTTP text snapshotters.
- Does **not** require Pinchtab or external fetching in CI.
- Keeps all imported candidates in a review queue before approval.

## Inputs

The server ingest function (`rootstone-research-ingest`) accepts:

- `source_url`
- `fetched_at` (ISO timestamp)
- `raw_text` (snapshot text)

The function parses best-effort candidates and stores each one in `rootstones_staging`.

## Staging model

Table: `public.rootstones_staging`

- `id`
- `country`
- `payload_json` (candidate rootstone record)
- `status` (`new` → `reviewed` → `approved` / `rejected`)
- `created_at`
- `source_url`
- `fetched_at`

Additional audit fields:

- `created_by`
- `reviewed_by`
- `reviewed_at`

## Guardrails

- Curator-only access (role check via `has_role`).
- Domain allowlist enforced (`ROOTSTONE_INGEST_ALLOWLIST` env; safe defaults included).
- Rate limiting:
  - in-memory per-user burst limit
  - DB-backed short-window cap on inserted staging rows
- Citation required in every candidate payload:
  - `source.name`
  - `source.url`
- Missing coordinates are allowed for staging but tagged with `needs_coords` and reduced confidence.

## Curator workflow

1. Open `/curator` and expand **Research Ingest**.
2. Paste `source_url`, `fetched_at`, and raw snapshot text.
3. Click **Ingest Snapshot**.
4. Review queue entries and move status:
   - `new` → `reviewed`
   - `reviewed` → `approved` or `rejected`
5. Export approved records by country as JSON (for generated data files).

### Repo export option

For writing approved staging records directly into generated country files:

```bash
node scripts/export-rootstones-staging.mjs
```

This writes:

- `src/data/rootstones/generated/<country>.json`

## Notes on parsing quality

Parsing is intentionally conservative and best-effort:

- Detects likely names, type (`tree`/`grove`), coordinates if present, place hints.
- Deduplicates within each ingest batch.
- Applies confidence based on evidence (coords/place).
- Always stores citations and provenance metadata.

## Verify quickly

1. Run DB migration.
2. Invoke edge function with sample payload:
   - `action: "ingest"`
   - trusted `source_url`
   - valid ISO `fetched_at`
   - text with a few candidate lines
3. In Curator UI, confirm rows appear in queue.
4. Approve one item.
5. Export approved country JSON and inspect citation fields.
6. (Optional) run `node scripts/export-rootstones-staging.mjs` and confirm generated files update.
