/**
 * Species Media — image metadata model for the Species Library.
 *
 * Part of the Species Library Expansion (PR 2; see
 * docs/SPECIES_LIBRARY_ARCHITECTURE.md §8). TYPES + PURE HELPERS ONLY:
 *   - no DB table, no schema migration
 *   - no live image URLs, no fetching, no uploads, no UI
 *
 * Core rule: every image attaches to exactly ONE subject of the existing trunk —
 * an exact `species_key`, a broad `concept_id`, or a preserved `raw_label`.
 * A concept-level image is NEVER an exact species image. Representativeness is
 * always explicit. Images are the enriched face of Treeasurus, not a detached gallery.
 */

// ── Subject: exactly one trunk anchor (discriminated union) ───────────────────
export type SpeciesMediaSubjectKind = "species_key" | "concept_id" | "raw_label";

export type SpeciesMediaSubject =
  | { kind: "species_key"; speciesKey: string }
  | { kind: "concept_id"; conceptId: string }
  | { kind: "raw_label"; rawLabel: string };

/** Loose shape as it may arrive from a DB row / external source, before validation. */
export interface SpeciesMediaSubjectLike {
  speciesKey?: string | null;
  conceptId?: string | null;
  rawLabel?: string | null;
}

// ── Image kind, status, representativeness ────────────────────────────────────
export type SpeciesImageKind =
  | "hero"
  | "leaf"
  | "bark"
  | "seed"
  | "fruit"
  | "flower"
  | "silhouette"
  | "habitat"
  | "seasonal";

export type SpeciesMediaStatus = "approved" | "pending" | "rejected" | "placeholder";

/**
 * How faithfully this image represents its subject. Explicit by design:
 *   exact          — a photo of the exact species (subject must be species_key)
 *   representative — a real species photo standing in for a broader concept
 *                    (subject is a species_key, but it represents a concept/genus)
 *   concept        — a concept-level image (subject is a concept_id)
 *   broad          — an even looser concept image (family/hive/learning/mythic)
 *   placeholder    — a built-in fallback; no live image, no attribution required
 */
export type SpeciesMediaRepresentativeness =
  | "exact"
  | "representative"
  | "concept"
  | "broad"
  | "placeholder";

export type SeasonStageTag = "bare" | "bud" | "leaf" | "blossom" | "fruit";

/** Licensing/attribution — required for any non-placeholder image. */
export interface SpeciesMediaAttribution {
  /** SPDX-ish license id, e.g. "CC0-1.0", "CC-BY-4.0", "CC-BY-SA-4.0". */
  license: string;
  licenseUrl?: string;
  /** Photographer / creator name. */
  creator?: string;
  /** Provider this came from. */
  sourceProvider?: "gbif" | "wikimedia" | "inaturalist" | "curated" | "community";
  /** Free-text provenance / how it was obtained. */
  provenanceNotes?: string;
}

export interface SpeciesImage {
  id: string;
  subject: SpeciesMediaSubject;
  kind: SpeciesImageKind;
  /** Live image URL. Empty/undefined only for placeholder records. */
  url?: string;
  thumbUrl?: string;
  alt: string;
  representativeness: SpeciesMediaRepresentativeness;
  /** Required for any non-placeholder image; null/undefined only for placeholders. */
  attribution?: SpeciesMediaAttribution | null;
  status: SpeciesMediaStatus;
  /** ISO 3166 country or free region, when the image is regionally specific. */
  region?: string;
  /** Season the image depicts, when relevant (e.g. a seasonal/leaf shot). */
  season?: SeasonStageTag;
  /** 0–1 confidence this image is correct/representative for the subject. */
  confidence?: number;
}

// ── Subject classification / validation ───────────────────────────────────────
export class SpeciesMediaSubjectError extends Error {}

/**
 * Validate that a loose subject sets EXACTLY ONE anchor and return its kind.
 * Throws if zero or more than one anchor is present — an image target cannot be
 * both a species_key and a concept_id.
 */
export function classifyImageTarget(subject: SpeciesMediaSubjectLike): SpeciesMediaSubjectKind {
  const set: SpeciesMediaSubjectKind[] = [];
  if (subject.speciesKey?.trim()) set.push("species_key");
  if (subject.conceptId?.trim()) set.push("concept_id");
  if (subject.rawLabel?.trim()) set.push("raw_label");

  if (set.length === 0) {
    throw new SpeciesMediaSubjectError("Species media subject must set one of speciesKey, conceptId, or rawLabel.");
  }
  if (set.length > 1) {
    throw new SpeciesMediaSubjectError(`Species media subject must set exactly one anchor; got: ${set.join(", ")}.`);
  }
  return set[0];
}

/** Build a validated discriminated-union subject from a loose shape. */
export function toSpeciesMediaSubject(subject: SpeciesMediaSubjectLike): SpeciesMediaSubject {
  switch (classifyImageTarget(subject)) {
    case "species_key":
      return { kind: "species_key", speciesKey: subject.speciesKey!.trim() };
    case "concept_id":
      return { kind: "concept_id", conceptId: subject.conceptId!.trim() };
    case "raw_label":
      return { kind: "raw_label", rawLabel: subject.rawLabel!.trim() };
  }
}

/**
 * Does this image depict the EXACT species? True only for an exact-species photo
 * anchored to a species_key. A concept image never implies exact species.
 */
export function impliesExactSpecies(image: SpeciesImage): boolean {
  return image.subject.kind === "species_key" && image.representativeness === "exact";
}

// ── Attribution completeness ──────────────────────────────────────────────────
export interface AttributionValidation {
  valid: boolean;
  missing: string[];
}

/**
 * Non-placeholder images require a license and an attributable source
 * (creator or sourceProvider). Placeholders need nothing.
 */
export function validateAttribution(image: SpeciesImage): AttributionValidation {
  if (image.status === "placeholder" || image.representativeness === "placeholder") {
    return { valid: true, missing: [] };
  }
  const missing: string[] = [];
  if (!image.url?.trim()) missing.push("url");
  const a = image.attribution;
  if (!a) {
    missing.push("attribution");
    return { valid: false, missing };
  }
  if (!a.license?.trim()) missing.push("license");
  if (!a.creator?.trim() && !a.sourceProvider) missing.push("creator|sourceProvider");
  return { valid: missing.length === 0, missing };
}

// ── Fallback hierarchy ────────────────────────────────────────────────────────
/**
 * Documented fallback order (most specific → most generic). Consumers that know a
 * concept's type (genus/family/hive) may further order within the "concept"/"broad"
 * tiers using speciesConcepts — that distinction is not knowable from a media record alone.
 */
export const SPECIES_MEDIA_FALLBACK_ORDER = [
  "exact_species",                 // 1. exact species_key image
  "representative_exact_species",  // 2. real species photo representing a concept (marked)
  "concept",                       // 3. concept-level image
  "broad_concept",                 // 4. genus / family / hive image
  "raw_unresolved",                // 5. image attached to a preserved raw label
  "generic_botanical",             // 6. built-in placeholder
] as const;

export type SpeciesMediaFallbackTier = (typeof SPECIES_MEDIA_FALLBACK_ORDER)[number];

export function getSpeciesMediaFallbackOrder(): readonly SpeciesMediaFallbackTier[] {
  return SPECIES_MEDIA_FALLBACK_ORDER;
}

/** Map an image to its fallback tier (lower index in the order = more specific). */
export function mediaFallbackTier(image: SpeciesImage): SpeciesMediaFallbackTier {
  if (image.status === "placeholder" || image.representativeness === "placeholder") {
    return "generic_botanical";
  }
  switch (image.subject.kind) {
    case "species_key":
      return image.representativeness === "exact" ? "exact_species" : "representative_exact_species";
    case "concept_id":
      return image.representativeness === "broad" ? "broad_concept" : "concept";
    case "raw_label":
      return "raw_unresolved";
  }
}

function tierRank(tier: SpeciesMediaFallbackTier): number {
  return SPECIES_MEDIA_FALLBACK_ORDER.indexOf(tier);
}

/** Generic built-in placeholder — always available, never needs attribution, always last. */
export const GENERIC_BOTANICAL_PLACEHOLDER: SpeciesImage = {
  id: "placeholder:generic-botanical",
  subject: { kind: "raw_label", rawLabel: "unknown" },
  kind: "silhouette",
  alt: "A leaf — species image not yet available",
  representativeness: "placeholder",
  status: "placeholder",
};

export interface ChooseBestImageOptions {
  /** Prefer this image kind (e.g. "leaf"); falls back to any kind if none match. */
  kind?: SpeciesImageKind;
  /** Only consider approved (+ placeholder) images. Default true. */
  approvedOnly?: boolean;
}

/**
 * Choose the most specific usable image from a set, honouring the fallback order.
 * Pure: never fetches; returns the generic placeholder if nothing usable is found.
 * Exact species always beats concept; raw labels are preserved (never discarded
 * into a fake exact match).
 */
export function chooseBestImage(
  images: readonly SpeciesImage[],
  options: ChooseBestImageOptions = {},
): SpeciesImage {
  const approvedOnly = options.approvedOnly ?? true;

  const usable = images.filter((img) => {
    if (approvedOnly && img.status !== "approved" && img.status !== "placeholder") return false;
    // A non-placeholder image with incomplete attribution is not usable.
    if (img.status !== "placeholder" && !validateAttribution(img).valid) return false;
    return true;
  });

  const byTier = (a: SpeciesImage, b: SpeciesImage) =>
    tierRank(mediaFallbackTier(a)) - tierRank(mediaFallbackTier(b));

  // Prefer the requested kind if any usable image matches it.
  if (options.kind) {
    const matchingKind = usable.filter((img) => img.kind === options.kind).sort(byTier);
    if (matchingKind.length > 0) return matchingKind[0];
  }

  const sorted = [...usable].sort(byTier);
  return sorted[0] ?? GENERIC_BOTANICAL_PLACEHOLDER;
}
