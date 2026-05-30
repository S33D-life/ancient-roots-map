/**
 * Species certainty — a gentle, read-only formatter that turns the EXISTING
 * resolver/concept signals into human, non-judgmental language for display.
 *
 * First visible Species Experience win (see docs/SPECIES_DEEP_ECOLOGY_AUDIT.md §8:
 * "confidence legibility is the biggest gap"). Pure; reads only — never writes,
 * never changes resolver behaviour, never fabricates precision.
 *
 * Mapping (from signals that already exist):
 *   exact match / has species_key   → "Known"          (identified to an exact species)
 *   broad/mythic concept            → "Broad group"    (a family of trees, not one species)
 *   fuzzy match (plausible name)    → "Likely"         (a likely species, not yet verified)
 *   unresolved / empty              → "Needs refinement"(species not yet known)
 *
 * "Broad group" is checked before "Likely" so genuinely broad labels ("oak",
 * "willow", "ancient elders") read as concepts, not as fake-exact species.
 */
import type { MatchConfidence } from "@/services/speciesResolver";
import { resolveSpeciesConcept } from "@/services/speciesConceptResolver";

export type SpeciesCertainty = "known" | "likely" | "broad" | "unresolved";

export interface SpeciesCertaintyDisplay {
  certainty: SpeciesCertainty;
  /** Short, gentle label for the badge. */
  label: string;
  /** One-line non-judgmental explanation (good for a title/tooltip). */
  hint: string;
}

const DISPLAY: Record<SpeciesCertainty, { label: string; hint: string }> = {
  known: { label: "Known", hint: "Identified to an exact species." },
  likely: { label: "Likely", hint: "A likely species — not yet verified." },
  broad: { label: "Broad group", hint: "A broad group of trees, not one exact species." },
  unresolved: { label: "Needs refinement", hint: "Species not yet known — you can help identify it." },
};

export interface SpeciesCertaintyInput {
  /** Resolver confidence, if known: "exact" | "fuzzy" | "unresolved". */
  confidence?: MatchConfidence | null;
  /** Canonical species_index key, if the tree has one. */
  speciesKey?: string | null;
  /** Raw species label, used only to detect broad/mythic concepts. */
  speciesLabel?: string | null;
}

/**
 * A label is a "broad group" only when it names the CONCEPT itself (matched as a
 * concept id or alias, e.g. "oak", "willow", "ancient elders") and that concept is
 * not an exact species. A representative taxon (e.g. "Pedunculate Oak") names a
 * specific tree, so it is NOT treated as broad.
 */
function isBroadConcept(label: string | null | undefined): boolean {
  if (!label?.trim()) return false;
  const resolution = resolveSpeciesConcept(label);
  if (!resolution.concept || resolution.concept.concept_type === "exact_species") return false;
  return resolution.match_kind === "concept_id" || resolution.match_kind === "alias";
}

export function speciesCertainty(input: SpeciesCertaintyInput): SpeciesCertaintyDisplay {
  const { confidence, speciesKey, speciesLabel } = input;

  let certainty: SpeciesCertainty;
  if (confidence === "exact" || (speciesKey != null && speciesKey.trim() !== "")) {
    certainty = "known";
  } else if (isBroadConcept(speciesLabel)) {
    certainty = "broad";
  } else if (confidence === "fuzzy") {
    certainty = "likely";
  } else {
    certainty = "unresolved";
  }

  return { certainty, ...DISPLAY[certainty] };
}
