/**
 * Read-only bridge from Arborium starter species to the shared Species Concept trunk.
 *
 * This adapter lets Arborium keep its beginner-friendly starter copy while each
 * doorway has a stable concept root for later Atlas / Quest Cave / Data Commons
 * harmonisation. It does not change starter rendering or mint exact species keys.
 */
import {
  ARBORIUM_STARTER_CONCEPTS,
  type ArboriumStarterSlug,
  type SpeciesConcept,
  type SpeciesConceptId,
} from "@/config/speciesConcepts";
import {
  getSpeciesConcept,
  resolveArboriumStarterConcept,
  type SpeciesConceptResolution,
} from "@/services/speciesConceptResolver";
import { STARTER_SPECIES, type SpeciesSeed } from "./starterSpecies";

export interface ArboriumStarterSpeciesConcept {
  readonly starter: SpeciesSeed;
  readonly concept_id: SpeciesConceptId;
  readonly concept: SpeciesConcept;
  readonly resolution: SpeciesConceptResolution;
}

export function isArboriumStarterSlug(slug: string): slug is ArboriumStarterSlug {
  return slug in ARBORIUM_STARTER_CONCEPTS;
}

export function getArboriumStarterConcept(
  starter: SpeciesSeed,
): ArboriumStarterSpeciesConcept | null {
  if (!isArboriumStarterSlug(starter.slug)) return null;

  const conceptId = ARBORIUM_STARTER_CONCEPTS[starter.slug];
  const concept = getSpeciesConcept(conceptId);
  if (!concept) return null;

  return {
    starter,
    concept_id: conceptId,
    concept,
    resolution: resolveArboriumStarterConcept(starter.slug),
  };
}

function requireArboriumStarterConcept(starter: SpeciesSeed): ArboriumStarterSpeciesConcept {
  const mapped = getArboriumStarterConcept(starter);
  if (!mapped) {
    throw new Error(`Missing Species Concept mapping for Arborium starter: ${starter.slug}`);
  }
  return mapped;
}

export const ARBORIUM_STARTER_SPECIES_CONCEPTS = STARTER_SPECIES.map(requireArboriumStarterConcept);
