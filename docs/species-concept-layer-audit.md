# Species Concept Layer Audit

Status: architecture audit / design proposal only. No schema migration, UI rewrite, route change, or consumer wiring is proposed in this document.

## Principle

One taxonomy trunk. Many interpretive layers. No competing species systems.

Treeasurus remains the exact taxonomy trunk:

- `species_index`
- `species_key`
- scientific name, genus, family, GBIF metadata
- `tree_species_names`
- `tree_species_lore`

The Species Concept Layer should sit above that trunk. It should let Arborium, Quest Cave, Atlas, Hives, and Data Commons share broader human-facing concepts such as `oak`, `willow`, `ancient elders`, `water-loving trees`, and hive concepts without pretending those are exact species.

## Current Duplication Map

| Area | Current source | Level | Notes |
| --- | --- | --- | --- |
| Treeasurus hooks | `src/hooks/use-treeasurus.ts` | exact taxonomy | Uses `species_index`, `tree_species_names`, `tree_species_lore`, and `/species/:slug`. |
| Species page | `src/pages/SpeciesPage.tsx` | exact taxonomy plus lore | Renders one exact species record and mapped `trees.species_key`. |
| Static species list | `src/data/treeSpecies.ts` | mixed exact/fallback | Used for autocomplete, CSV enrichment, hives, rewards, and sync fallback. |
| Species resolver | `src/services/speciesResolver.ts` | exact plus fallback | Async DB lookup falls back to static species list. Sync resolver cannot use DB. |
| Arborium starters | `src/components/arborium/starterSpecies.ts` | learning concepts | `oak`, `willow`, and `hawthorn` are broad genus/concept labels; `yew` and `beech` are closer to exact UK starter taxa. |
| Arborium ID branches | `src/components/arborium/idBranches.ts` | learning concepts | Answers map to starter slugs, not `species_key`. |
| Arborium families | `src/components/arborium/TreeFamiliesStrip.tsx` | learning groups | Broadleaf, conifers, thorn trees, water-loving trees, ancient elders are educational groups. |
| Quest Cave hives | `src/lib/quest-cave/livingPaths.ts` | mythic/hive concepts | Has hardcoded hive ids, genus arrays, and fallback string matchers. |
| Quest seasonal labels | `src/components/library/quest-cave/seasonalQuestsConfig.ts` | mythic concepts | `Oak Hive` and species hearts use display labels, not taxonomy IDs. |
| Dream Trees | `src/components/library/quest-cave/dreamTreesConfig.ts` | mythic/free text | `speciesOrPlace` mixes exact taxa, genus labels, habitats, and emotional categories. |
| Atlas species activity | `src/hooks/useCountrySpeciesActivity.ts` | aggregate display | Has its own `SPECIES_ALIASES` that collapses broad labels to exact species. |
| Add Tree species ID | `src/components/encounter/SpeciesIdentifier.tsx` | capture/fuzzy ID | Manual search and hive guess write raw labels; no canonical concept id or species key is emitted. |
| Add Tree insert | `src/components/AddTreeDialog.tsx` | raw tree data | Inserts `species` only; `species_key` is not populated at add time. |
| GBIF enrichment | `supabase/functions/gbif-enrich/index.ts` | exact taxonomy | Safely creates `gbif-*` species keys only on high-confidence exact GBIF matches. |
| Research conversion | `src/utils/researchTreeToTreeRow.ts` | raw research data | Maps research rows to tree rows with `species_key: null`. |
| Data Commons | `src/hooks/use-data-commons.ts`, `src/pages/TreeDataCommonsPage.tsx` | source metadata | Displays raw `species_keys` by replacing underscores. |
| Hives utility | `src/utils/hiveUtils.ts` | family concepts | Builds family hives from the static species list and curated family metadata. |

## Existing Taxonomy Consumers

### Exact taxonomy consumers

- Treeasurus species lookup, search, names, lore, and species pages.
- Species links when a `trees.species_key` is already present.
- GBIF enrichment and curator species assignment.
- Phenology and bioregion calendar surfaces that already use `species_key`.

### Concept/fuzzy taxonomy consumers

- Arborium starter species and ID clues.
- Arborium family learning groups.
- Quest Cave hives, milestones, seasonal quests, staff resonance, and Dream Trees.
- Atlas country species activity.
- Hives index and species heart rewards.
- Add Tree manual species, AI species, and hive guess flow.
- Data Commons source `species_keys` labels.

## Duplicated Aliases

Aliases currently appear in several independent places:

- `src/data/treeSpecies.ts` aliases.
- `species_index.synonym_names`.
- `tree_species_names`.
- `src/hooks/useCountrySpeciesActivity.ts` `SPECIES_ALIASES`.
- `src/lib/quest-cave/livingPaths.ts` `speciesMatchers`.
- Dream Tree free text.
- Raw `trees.species` and `research_trees.species_common/species_scientific`.

This is the main architectural drift. Alias normalization should become a shared read model, not a per-room copy.

## Unsafe Exact-Species Assumptions

- `oak -> Quercus robur` is unsafe. Oak is often a genus or cultural concept, not necessarily English oak.
- `willow -> Salix alba` is unsafe. Willow is usually a genus-level or water-loving concept.
- `hawthorn -> Crataegus monogyna` is plausible in UK beginner context but still not universally exact.
- `beech -> Fagus sylvatica` is plausible for a UK starter context but should be marked regional/representative, not universal.
- `yew -> Taxus baccata` is plausible for a UK starter context but should still be marked representative unless confirmed.
- Quest Cave `Oak Hive`, `Ancient Elders`, and `Waterway Ancient Friends` should not resolve to one exact species.
- Atlas species activity should avoid converting broad labels to exact species unless the raw record is exact or already linked by `species_key`.

## Safest Canonical Trunk

The canonical trunk should be:

1. `species_index` for exact species and taxonomic records.
2. `tree_species_names` and `species_index.synonym_names` for names and aliases.
3. `tree_species_lore` for exact-species knowledge and story.
4. A TypeScript Species Concept Layer for broad interpretive labels.
5. Later, only if usage proves stable, a database-backed concept table or view.

The concept layer should reference exact species keys where defensible, but should never require a concept to have an exact species key.

## Shared Concept Model Proposal

Start TypeScript-only.

```ts
export type SpeciesConceptType =
  | "exact_species"
  | "genus"
  | "family"
  | "hive"
  | "learning_group"
  | "mythic_group";

export type SpeciesConceptSourceLayer =
  | "treeasurus"
  | "arborium"
  | "quest_cave"
  | "atlas"
  | "hives"
  | "data_commons";

export type SpeciesConceptConfidence =
  | "exact"
  | "representative"
  | "broad"
  | "mythic";

export interface SpeciesConcept {
  concept_id: string;
  label: string;
  public_label: string;
  concept_type: SpeciesConceptType;
  representative_species_keys: string[];
  genus_keys: string[];
  family_keys: string[];
  aliases: string[];
  source_layers: SpeciesConceptSourceLayer[];
  confidence: SpeciesConceptConfidence;
  notes?: string;
}
```

Suggested starter concepts:

| Concept id | Type | Label | Safe references |
| --- | --- | --- | --- |
| `concept:oak` | genus | Oak | `genus_keys: ["quercus"]`; no exact species by default. |
| `concept:yew` | genus | Yew | `genus_keys: ["taxus"]`; `Taxus baccata` may be representative in UK context. |
| `concept:willow` | genus | Willow | `genus_keys: ["salix"]`; no exact species by default. |
| `concept:beech` | genus | Beech | `genus_keys: ["fagus"]`; `Fagus sylvatica` may be representative in UK context. |
| `concept:hawthorn` | genus | Hawthorn | `genus_keys: ["crataegus"]`; representative exact species only by region. |
| `concept:ancient-elders` | mythic_group | Ancient Elders | Includes yew, oak, sweet chestnut, lime as examples, not exact matches. |
| `concept:water-loving-trees` | learning_group | Water-loving Trees | Includes willow, alder, poplar, mangrove examples. |
| `concept:oak-hive` | hive | Oak Hive | Links to `concept:oak`, not to `Quercus robur` by default. |

## Resolver Architecture Proposal

Keep the current exact resolver. Add a concept resolver above it.

### Exact resolver responsibilities

- Resolve known `species_key`.
- Resolve exact scientific names and confirmed synonyms through `species_index`.
- Return `exact` only when the backing record is exact.
- Preserve current GBIF high-confidence behavior.

### Concept resolver responsibilities

- Normalize broad labels to concept IDs.
- Return genus/family/hive/learning/mythic concepts without fabricating `species_key`.
- Attach representative exact taxa only as hints.
- Return confidence separately from exactness.

Suggested return shape:

```ts
export interface SpeciesConceptResolution {
  input: string;
  concept_id: string | null;
  concept_type: SpeciesConceptType | null;
  public_label: string;
  exact_species_key: string | null;
  genus_keys: string[];
  family_keys: string[];
  confidence: "exact" | "representative" | "broad" | "mythic" | "unresolved";
  reason: string;
}
```

Resolution order:

1. If `species_key` exists, resolve through Treeasurus exact taxonomy.
2. If input is an exact scientific name and Treeasurus/GBIF confirms it, return exact.
3. If input matches a concept alias, return the concept.
4. If input matches a genus token, return a genus concept.
5. If input matches a family/hive, return hive/family concept.
6. Otherwise return unresolved and preserve raw label.

## Arborium Relation Map

Arborium should consume concepts, not exact taxonomy directly:

| Arborium slug | Concept id | Relationship |
| --- | --- | --- |
| `oak` | `concept:oak` | Starter learning concept, genus-level. |
| `yew` | `concept:yew` | Starter learning concept, genus-level with UK representative exact species. |
| `willow` | `concept:willow` | Starter learning concept, genus-level/water habitat. |
| `beech` | `concept:beech` | Starter learning concept, genus-level with UK representative exact species. |
| `hawthorn` | `concept:hawthorn` | Starter learning concept, genus-level/boundary-tree concept. |
| `Water-loving trees` | `concept:water-loving-trees` | Learning group. |
| `Ancient elders` | `concept:ancient-elders` | Learning/mythic group. |

Do not rewrite Arborium yet. First safe step is to add a mapping object:

```ts
export const ARBORIUM_STARTER_CONCEPTS = {
  oak: "concept:oak",
  yew: "concept:yew",
  willow: "concept:willow",
  beech: "concept:beech",
  hawthorn: "concept:hawthorn",
} as const;
```

## Quest Cave Relation Map

Quest Cave should keep its emotional language, but point to concepts:

| Current Quest Cave item | Concept relation |
| --- | --- |
| `Oak Hive` | `concept:oak-hive` and `concept:oak` |
| `Yew Hive` | `concept:yew-hive` and `concept:yew` |
| `Hazel Hive` | future `concept:hazel` |
| `Apple Hive` | future `concept:apple` |
| `Ash Hive` | future `concept:ash` |
| `Olive Hive` | future `concept:olive` |
| `Beech Hive` | `concept:beech-hive` and `concept:beech` |
| `Ancient Friends / Elders` | `concept:ancient-elders` |
| `Waterway Ancient Friends` | `concept:water-loving-trees` plus future wetland/coastal concepts |
| Dream Tree free text | optional `concept_ids` array, not replacement text |

Do not collapse Dream Tree copy into taxonomy. Add concept IDs alongside the poetry later.

## Atlas Relation Map

Atlas needs two lanes:

- Public exact aggregates from research data and `species_key` when available.
- Public concept aggregates for broad visitor-facing filters and country stories.

Recommended future replacements:

- Replace `SPECIES_ALIASES` with concept resolver normalization.
- Keep exact species display exact when `species_scientific` or `species_key` is exact.
- Derive country species activity through a public aggregate RPC/view, not client-side checkin/offering row reads.
- Allow Atlas filters to pass `concept_id` for broad groups and `species_key` for exact species.

## Data Commons Relation Map

Data Commons currently treats source `species_keys` as display strings. Future behavior:

- If key matches `species_index.species_key`, display Treeasurus label.
- If key matches concept id, display concept public label.
- If key is raw/source-specific, show raw label and mark as unresolved.
- Source contribution stats should distinguish exact species coverage from concept coverage.

## Risks

- False precision is the main risk. Broad labels like oak, willow, ancient elders, and water-loving trees must not become exact species.
- Sync fallback is useful for speed and offline-ish behavior, but it currently competes with Treeasurus.
- Quest Cave is emotional progression, not taxonomy ownership. It should reference concepts without becoming a resolver.
- Atlas public stats must not expose private checkins, offerings, user IDs, or exact sensitive user locations.
- A DB migration too early would lock in vocabulary before the product has stabilized the concept boundaries.
- Representative species are context-dependent. UK defaults should be labeled as representative, not universal.

## Smallest Safe Prototype Path

Recommended next PR: config-only, no consumers.

Files:

- `src/config/speciesConcepts.ts`
- optionally `src/services/speciesConceptResolver.ts`

Contents:

- `SpeciesConcept` types.
- Starter concept constants for oak, yew, willow, beech, hawthorn, ancient elders, water-loving trees.
- Arborium starter slug to concept ID mapping.
- Pure resolver helpers:
  - `normalizeSpeciesConceptInput(input: string): string`
  - `findSpeciesConceptByAlias(input: string): SpeciesConcept | null`
  - `resolveSpeciesConcept(input: string): SpeciesConceptResolution`

No consumers should be migrated in that PR. After typecheck proves the model is stable, follow with narrow consumer PRs:

1. Arborium starter mapping only.
2. Atlas alias replacement.
3. Quest Cave concept IDs alongside existing labels.
4. Public species activity aggregate RPC/view.
5. Research Trees species key backfill or derived view.
6. Data Commons labels from Treeasurus/concepts.

## Docs-Only Decision

This branch should remain docs-only for the first audit PR. The concept model is clear enough to prototype next, but consumer wiring should wait until the config has been reviewed. That keeps Treeasurus safe as the trunk and avoids creating a second hidden taxonomy by accident.
