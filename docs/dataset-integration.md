# Dataset Integration Guide

## How to add a new heritage tree dataset

### 1. Register the dataset config

Add an entry to `src/config/datasetIntegration.ts` in `DATASET_CONFIGS`:

```ts
"jp-sacred-trees": {
  key: "jp-sacred-trees",
  name: "Japan Sacred Tree Register",
  countryCode: "JP",
  countryName: "Japan",
  countrySlug: "japan",
  datasetType: "sacred_trees",
  sourceUrl: "https://...",
  sourceOrg: "Agency for Cultural Affairs",
  dataFormat: "manual_curation",
  bbox: [24, 122.9, 45.5, 153.9],
  center: { lat: 36.2, lng: 138.2 },
  defaultZoom: 5,
  flag: "🇯🇵",
  regionType: "country",
  portalTitle: "Japan — Sacred Trees",
  portalSubtitle: "...",
  descriptor: "Natural Monuments",
  sourceLabel: "Cultural Affairs register",
  circles: [
    { key: "shrine", label: "Shrine Elders", icon: "⛩️", refPrefix: "JP-SH" },
    ...
  ],
}
```

### 2. Add country to registries

- `src/config/countryRegistry.ts` — use `buildCountryRegistryEntry(config)`
- `src/data/countries/registry.json` — use `buildRegistryJsonEntry(config)`
- Optionally add sub-regions to `src/config/subRegionRegistry.ts`

### 3. Create seed data

Create two files in `scripts/seeds/`:

**`jp-sacred-trees.config.json`**
```json
{
  "name": "Japan Sacred Tree Register",
  "key": "jp-sacred-trees",
  "countryName": "Japan",
  "sourceUrl": "https://...",
  "sourceYear": 2024
}
```

**`jp-sacred-trees.json`** — Array of `SeedTree` objects

### 4. Run the seed script

```bash
node scripts/seed-dataset.mjs --dataset=jp-sacred-trees --dryRun=true
node scripts/seed-dataset.mjs --dataset=jp-sacred-trees
```

Or use the legacy per-country scripts (e.g. `seed-hong-kong.mjs`).

### 5. Create the atlas page

```tsx
// src/pages/JapanAtlasPage.tsx
import DatasetAtlasPage from "@/components/atlas/DatasetAtlasPage";

const JapanAtlasPage = () => (
  <DatasetAtlasPage
    datasetKey="jp-sacred-trees"
    narrativeSections={[...]}
    storySections={[...]}
  />
);

export default JapanAtlasPage;
```

### 6. Add the route

In `src/App.tsx`:
```tsx
const JapanAtlasPage = lazyImportWithRetry(() => import("./pages/JapanAtlasPage"), "japan-atlas");
// ...
<Route path="/atlas/japan" element={<JapanAtlasPage />} />
```

## Existing tables used

| Table | Purpose |
|-------|---------|
| `tree_data_sources` | Tracks the external source (registry/API) |
| `tree_datasets` | Tracks a specific parsed dataset from a source |
| `research_trees` | Individual tree records (candidate layer) |

## Verification levels

- `official_register` — from an official government/heritage register
- Trees enter as `status = "research"`, `record_status = "draft"`
- Community visits, photos, and offerings promote trees through the verification pipeline

## Circle system

Trees are grouped into thematic circles via `source_row_ref` prefix matching:
- `SG-BG-001` → Botanic Garden Elders circle
- `OVT-SWT-003` → Stone Wall Circle
