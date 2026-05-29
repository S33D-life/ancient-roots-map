/**
 * Species Concept Layer - shared, read-only concept trunk above Treeasurus.
 *
 * Treeasurus / species_index remains the exact taxonomy source of truth.
 * These concepts are human-facing learning, hive, and mythic groupings only.
 */

export type SpeciesConceptType =
  | "exact_species"
  | "genus"
  | "family"
  | "hive"
  | "learning_group"
  | "mythic_group";

/**
 * Describes confidence in a human-facing concept match only.
 * `concept_exact` means the input matched a known concept identifier, not an
 * exact taxonomic species. Exact species confidence still belongs to Treeasurus.
 */
export type SpeciesConceptConfidence = "concept_exact" | "representative" | "broad" | "mythic";

export type SpeciesConceptSourceLayer =
  | "treeasurus"
  | "arborium"
  | "quest_cave"
  | "atlas"
  | "data_commons"
  | "shared_config";

export interface SpeciesConcept {
  readonly concept_id: string;
  readonly label: string;
  readonly public_label: string;
  readonly concept_type: SpeciesConceptType;
  readonly confidence: SpeciesConceptConfidence;
  readonly aliases: readonly string[];
  readonly source_layer: readonly SpeciesConceptSourceLayer[];
  readonly genus_names?: readonly string[];
  readonly family_names?: readonly string[];
  readonly representative_scientific_names?: readonly string[];
  readonly representative_common_names?: readonly string[];
  readonly related_concept_ids?: readonly string[];
  readonly notes: string;
}

export const SPECIES_CONCEPTS = [
  {
    concept_id: "oak",
    label: "Oak",
    public_label: "Oak",
    concept_type: "genus",
    confidence: "broad",
    aliases: ["oak", "oaks", "quercus"],
    source_layer: ["arborium", "quest_cave", "atlas", "data_commons", "shared_config"],
    genus_names: ["Quercus"],
    family_names: ["Fagaceae"],
    representative_scientific_names: ["Quercus robur", "Quercus petraea"],
    representative_common_names: ["English Oak", "Pedunculate Oak", "Sessile Oak"],
    related_concept_ids: ["oak-hive"],
    notes: "A genus-level learning concept. Do not collapse broad Oak to Quercus robur.",
  },
  {
    concept_id: "yew",
    label: "Yew",
    public_label: "Yew",
    concept_type: "genus",
    confidence: "broad",
    aliases: ["yew", "yews", "taxus"],
    source_layer: ["arborium", "quest_cave", "atlas", "data_commons", "shared_config"],
    genus_names: ["Taxus"],
    family_names: ["Taxaceae"],
    representative_scientific_names: ["Taxus baccata"],
    representative_common_names: ["English Yew", "Common Yew", "European Yew"],
    related_concept_ids: ["yew-hive", "ancient-elders"],
    notes: "A genus-level concept with Taxus baccata as a representative, not a forced exact match.",
  },
  {
    concept_id: "willow",
    label: "Willow",
    public_label: "Willow",
    concept_type: "genus",
    confidence: "broad",
    aliases: ["willow", "willows", "salix"],
    source_layer: ["arborium", "atlas", "data_commons", "shared_config"],
    genus_names: ["Salix"],
    family_names: ["Salicaceae"],
    representative_scientific_names: ["Salix alba", "Salix babylonica", "Salix fragilis"],
    representative_common_names: ["White Willow", "Weeping Willow", "Crack Willow"],
    related_concept_ids: ["water-loving-trees"],
    notes: "A genus-level river and wet-ground learning concept.",
  },
  {
    concept_id: "beech",
    label: "Beech",
    public_label: "Beech",
    concept_type: "genus",
    confidence: "broad",
    aliases: ["beech", "beeches", "fagus"],
    source_layer: ["arborium", "quest_cave", "atlas", "data_commons", "shared_config"],
    genus_names: ["Fagus"],
    family_names: ["Fagaceae"],
    representative_scientific_names: ["Fagus sylvatica"],
    representative_common_names: ["Common Beech", "European Beech"],
    notes: "A genus-level learning concept. Fagaceae overlap with Oak Hive is intentional.",
  },
  {
    concept_id: "hawthorn",
    label: "Hawthorn",
    public_label: "Hawthorn",
    concept_type: "genus",
    confidence: "broad",
    aliases: ["hawthorn", "hawthorns", "crataegus", "may", "quickthorn"],
    source_layer: ["arborium", "atlas", "data_commons", "shared_config"],
    genus_names: ["Crataegus"],
    family_names: ["Rosaceae"],
    representative_scientific_names: ["Crataegus monogyna", "Crataegus laevigata"],
    representative_common_names: ["Common Hawthorn", "Midland Hawthorn"],
    notes: "A genus-level hedgerow and threshold-tree learning concept.",
  },
  {
    concept_id: "ancient-elders",
    label: "Ancient Elders",
    public_label: "Ancient elders",
    concept_type: "mythic_group",
    confidence: "mythic",
    aliases: ["ancient elders", "ancient friends", "elder trees", "veteran trees", "notable trees"],
    source_layer: ["quest_cave", "atlas", "data_commons", "shared_config"],
    related_concept_ids: ["oak", "yew"],
    notes: "A mythic/stewardship grouping for aged or notable trees, not a taxonomy concept.",
  },
  {
    concept_id: "water-loving-trees",
    label: "Water-loving Trees",
    public_label: "Water-loving trees",
    concept_type: "learning_group",
    confidence: "broad",
    aliases: ["water loving trees", "water-loving trees", "river trees", "wetland trees", "riparian trees"],
    source_layer: ["arborium", "quest_cave", "atlas", "data_commons", "shared_config"],
    genus_names: ["Salix", "Alnus", "Populus", "Taxodium"],
    family_names: ["Salicaceae", "Betulaceae", "Cupressaceae"],
    representative_scientific_names: ["Salix alba", "Alnus glutinosa", "Populus nigra", "Taxodium distichum"],
    representative_common_names: ["White Willow", "Common Alder", "Black Poplar", "Bald Cypress"],
    related_concept_ids: ["willow"],
    notes: "A habitat concept for learning and discovery. It should not imply a single family or genus.",
  },
  {
    concept_id: "oak-hive",
    label: "Oak Hive",
    public_label: "Oak Hive",
    concept_type: "hive",
    confidence: "broad",
    aliases: ["oak hive", "quercus hive"],
    source_layer: ["quest_cave", "shared_config"],
    genus_names: ["Quercus"],
    family_names: ["Fagaceae"],
    representative_scientific_names: ["Quercus robur", "Quercus petraea"],
    representative_common_names: ["English Oak", "Sessile Oak"],
    related_concept_ids: ["oak"],
    notes: "Quest Cave hive concept keyed to Quercus. It is narrower than the whole Fagaceae family.",
  },
  {
    concept_id: "yew-hive",
    label: "Yew Hive",
    public_label: "Yew Hive",
    concept_type: "hive",
    confidence: "broad",
    aliases: ["yew hive", "taxus hive", "taxaceae hive"],
    source_layer: ["quest_cave", "shared_config"],
    genus_names: ["Taxus"],
    family_names: ["Taxaceae"],
    representative_scientific_names: ["Taxus baccata"],
    representative_common_names: ["English Yew", "Common Yew"],
    related_concept_ids: ["yew", "ancient-elders"],
    notes: "Quest Cave hive concept for yews and sacred/ancient threshold-tree progression.",
  },
] as const satisfies readonly SpeciesConcept[];

export type SpeciesConceptId = (typeof SPECIES_CONCEPTS)[number]["concept_id"];

export type ArboriumStarterSlug = "oak" | "yew" | "willow" | "beech" | "hawthorn";

export const ARBORIUM_STARTER_CONCEPTS = {
  oak: "oak",
  yew: "yew",
  willow: "willow",
  beech: "beech",
  hawthorn: "hawthorn",
} as const satisfies Record<ArboriumStarterSlug, SpeciesConceptId>;
