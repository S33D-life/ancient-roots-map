/**
 * Pure Species Concept resolver helpers.
 *
 * This layer does not query Supabase and does not create species_key values.
 * Exact taxonomy must continue to resolve through Treeasurus / species_index.
 *
 * Future consumer examples only:
 * - Arborium can map STARTER_SPECIES slugs through resolveArboriumStarterConcept.
 * - Atlas can normalize broad labels through resolveSpeciesConcept, then still
 *   use Treeasurus for exact species_key work.
 * - Quest Cave hives can migrate speciesMatchers toward concept IDs over time.
 */
import {
  ARBORIUM_STARTER_CONCEPTS,
  SPECIES_CONCEPTS,
  type ArboriumStarterSlug,
  type SpeciesConcept,
  type SpeciesConceptConfidence,
  type SpeciesConceptId,
} from "@/config/speciesConcepts";

export type SpeciesConceptResolutionConfidence = SpeciesConceptConfidence | "unresolved";

export type SpeciesConceptMatchKind =
  | "concept_id"
  | "alias"
  | "representative_taxon"
  | "genus"
  | "unresolved";

export interface SpeciesConceptResolution {
  raw_label: string;
  preserved_label: string;
  normalized_label: string;
  concept_id: SpeciesConceptId | null;
  concept: SpeciesConcept | null;
  /**
   * Concept-layer confidence only. `concept_exact` means the label matched a
   * concept ID exactly; it does not mean exact taxonomic species confidence.
   */
  confidence: SpeciesConceptResolutionConfidence;
  match_kind: SpeciesConceptMatchKind;
  exact_species_key: string | null;
}

export interface SpeciesConceptTaxonomyHint {
  readonly raw_label?: string | null;
  readonly species_key?: string | null;
  readonly scientific_name?: string | null;
  readonly common_name?: string | null;
  readonly canonical_common_name?: string | null;
  readonly genus?: string | null;
  readonly family?: string | null;
}

interface IndexEntry {
  readonly concept: SpeciesConcept;
  readonly confidence: SpeciesConceptResolutionConfidence;
  readonly match_kind: SpeciesConceptMatchKind;
}

export function normalizeSpeciesConceptAlias(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function addIndexEntry(
  index: Map<string, IndexEntry>,
  raw: string | null | undefined,
  entry: IndexEntry,
) {
  const normalized = normalizeSpeciesConceptAlias(raw);
  if (!normalized || index.has(normalized)) return;
  index.set(normalized, entry);
}

function buildAliasIndex(): Map<string, IndexEntry> {
  const index = new Map<string, IndexEntry>();

  for (const concept of SPECIES_CONCEPTS as readonly SpeciesConcept[]) {
    addIndexEntry(index, concept.concept_id, {
      concept,
      confidence: "concept_exact",
      match_kind: "concept_id",
    });
    addIndexEntry(index, concept.label, {
      concept,
      confidence: concept.confidence,
      match_kind: "alias",
    });
    addIndexEntry(index, concept.public_label, {
      concept,
      confidence: concept.confidence,
      match_kind: "alias",
    });

    for (const alias of concept.aliases) {
      addIndexEntry(index, alias, {
        concept,
        confidence: concept.confidence,
        match_kind: "alias",
      });
    }

    for (const commonName of concept.representative_common_names || []) {
      addIndexEntry(index, commonName, {
        concept,
        confidence: "representative",
        match_kind: "representative_taxon",
      });
    }

    for (const scientificName of concept.representative_scientific_names || []) {
      addIndexEntry(index, scientificName, {
        concept,
        confidence: "representative",
        match_kind: "representative_taxon",
      });
    }
  }

  return index;
}

const ALIAS_INDEX = buildAliasIndex();

function unresolvedResolution(rawLabel: string): SpeciesConceptResolution {
  return {
    raw_label: rawLabel,
    preserved_label: rawLabel,
    normalized_label: normalizeSpeciesConceptAlias(rawLabel),
    concept_id: null,
    concept: null,
    confidence: "unresolved",
    match_kind: "unresolved",
    exact_species_key: null,
  };
}

function toResolution(rawLabel: string, entry: IndexEntry, exactSpeciesKey: string | null = null): SpeciesConceptResolution {
  return {
    raw_label: rawLabel,
    preserved_label: rawLabel,
    normalized_label: normalizeSpeciesConceptAlias(rawLabel),
    concept_id: entry.concept.concept_id as SpeciesConceptId,
    concept: entry.concept,
    confidence: entry.confidence,
    match_kind: entry.match_kind,
    exact_species_key: exactSpeciesKey,
  };
}

function findConceptByGenus(genus: string | null | undefined): SpeciesConcept | null {
  const normalizedGenus = normalizeSpeciesConceptAlias(genus);
  if (!normalizedGenus) return null;

  const concepts = SPECIES_CONCEPTS as readonly SpeciesConcept[];
  const nonHive = concepts.find((concept) =>
    concept.concept_type !== "hive" &&
    (concept.genus_names || []).some((name) => normalizeSpeciesConceptAlias(name) === normalizedGenus),
  );
  if (nonHive) return nonHive;

  return concepts.find((concept) =>
    (concept.genus_names || []).some((name) => normalizeSpeciesConceptAlias(name) === normalizedGenus),
  ) || null;
}

export function isSpeciesConceptId(value: string | null | undefined): value is SpeciesConceptId {
  if (!value) return false;
  return SPECIES_CONCEPTS.some((concept) => concept.concept_id === value);
}

export function getSpeciesConcept(conceptId: string | null | undefined): SpeciesConcept | null {
  if (!isSpeciesConceptId(conceptId)) return null;
  return SPECIES_CONCEPTS.find((concept) => concept.concept_id === conceptId) || null;
}

export function resolveSpeciesConcept(rawLabel: string | null | undefined): SpeciesConceptResolution {
  const preserved = rawLabel?.trim() || "";
  if (!preserved) return unresolvedResolution("");

  const entry = ALIAS_INDEX.get(normalizeSpeciesConceptAlias(preserved));
  if (!entry) return unresolvedResolution(preserved);

  return toResolution(preserved, entry);
}

export function resolveSpeciesConceptFromTaxonomy(
  hint: SpeciesConceptTaxonomyHint,
): SpeciesConceptResolution {
  const rawLabel =
    hint.raw_label ||
    hint.scientific_name ||
    hint.canonical_common_name ||
    hint.common_name ||
    hint.genus ||
    hint.family ||
    "";

  const directCandidates = [
    hint.scientific_name,
    hint.canonical_common_name,
    hint.common_name,
    hint.raw_label,
  ].filter((value): value is string => Boolean(value?.trim()));

  for (const candidate of directCandidates) {
    const resolved = resolveSpeciesConcept(candidate);
    if (resolved.concept) {
      return {
        ...resolved,
        raw_label: rawLabel,
        preserved_label: rawLabel,
        exact_species_key: hint.species_key || null,
      };
    }
  }

  const genusConcept = findConceptByGenus(hint.genus || hint.scientific_name?.split(/\s+/)[0]);
  if (genusConcept) {
    return toResolution(rawLabel, {
      concept: genusConcept,
      confidence: "broad",
      match_kind: "genus",
    }, hint.species_key || null);
  }

  return {
    ...unresolvedResolution(rawLabel),
    exact_species_key: hint.species_key || null,
  };
}

export function resolveArboriumStarterConcept(slug: string | null | undefined): SpeciesConceptResolution {
  if (!slug || !(slug in ARBORIUM_STARTER_CONCEPTS)) {
    return unresolvedResolution(slug || "");
  }

  return resolveSpeciesConcept(ARBORIUM_STARTER_CONCEPTS[slug as ArboriumStarterSlug]);
}
