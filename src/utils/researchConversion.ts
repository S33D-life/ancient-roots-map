/**
 * Research Tree Conversion Pipeline
 * ----------------------------------
 * Completeness scoring, field mapping audit, conversion helpers,
 * and status management for research → Ancient Friend promotion.
 */
import type { Database } from "@/integrations/supabase/types";

type ResearchTreeRow = Database["public"]["Tables"]["research_trees"]["Row"];
type TreeRow = Database["public"]["Tables"]["trees"]["Row"];

/* ══════════════════════════════════════════════════════════
   1. CONVERSION STATUS
   ══════════════════════════════════════════════════════════ */

export type ConversionStatus =
  | "research_only"
  | "candidate"
  | "in_conversion"
  | "converted"
  | "featured";

export interface ConversionStatusMeta {
  key: ConversionStatus;
  label: string;
  description: string;
  icon: string;
  color: string; // semantic CSS variable key
}

export const CONVERSION_STATUSES: Record<ConversionStatus, ConversionStatusMeta> = {
  research_only: {
    key: "research_only",
    label: "Research Grove",
    description: "Early record from a research dataset. Not yet reviewed for promotion.",
    icon: "📜",
    color: "muted-foreground",
  },
  candidate: {
    key: "candidate",
    label: "Candidate",
    description: "Identified as a strong candidate for becoming an Ancient Friend page.",
    icon: "🌱",
    color: "primary",
  },
  in_conversion: {
    key: "in_conversion",
    label: "In Conversion",
    description: "Currently being enriched and prepared for full Ancient Friend status.",
    icon: "🔄",
    color: "primary",
  },
  converted: {
    key: "converted",
    label: "Ancient Friend",
    description: "Successfully converted into a full Ancient Friend record.",
    icon: "🌳",
    color: "primary",
  },
  featured: {
    key: "featured",
    label: "Featured",
    description: "A highlighted Ancient Friend with exceptional significance.",
    icon: "✨",
    color: "primary",
  },
};

export function getConversionStatus(rt: ResearchTreeRow): ConversionStatus {
  const raw = (rt as any).conversion_status as string | undefined;
  if (raw && raw in CONVERSION_STATUSES) return raw as ConversionStatus;
  // Fallback inference from existing fields
  if (rt.status === "verified" && rt.record_status === "active") return "converted";
  if (rt.status === "featured") return "candidate";
  return "research_only";
}

/* ══════════════════════════════════════════════════════════
   2. COMPLETENESS SCORING
   ══════════════════════════════════════════════════════════ */

export interface CompletenessField {
  key: string;
  label: string;
  category: "identity" | "location" | "science" | "story" | "media" | "provenance";
  weight: number;
  check: (rt: ResearchTreeRow) => boolean;
  hint: string;
}

export const COMPLETENESS_FIELDS: CompletenessField[] = [
  // Identity (30%)
  {
    key: "name",
    label: "Tree Name",
    category: "identity",
    weight: 10,
    check: (rt) => !!rt.tree_name && rt.tree_name.length > 2,
    hint: "A distinctive name helps visitors connect with this tree.",
  },
  {
    key: "species_scientific",
    label: "Scientific Name",
    category: "identity",
    weight: 8,
    check: (rt) => !!rt.species_scientific && rt.species_scientific.length > 3,
    hint: "The botanical species name (e.g. Quercus robur).",
  },
  {
    key: "species_common",
    label: "Common Name",
    category: "identity",
    weight: 5,
    check: (rt) => !!rt.species_common && rt.species_common.length > 2,
    hint: "A common name like 'English Oak' helps non-specialists.",
  },
  {
    key: "designation",
    label: "Designation Type",
    category: "identity",
    weight: 5,
    check: (rt) => !!rt.designation_type && rt.designation_type !== "Notable Tree",
    hint: "Ancient Tree, Champion Tree, Heritage Tree, etc.",
  },
  // Location (25%)
  {
    key: "coordinates",
    label: "GPS Coordinates",
    category: "location",
    weight: 12,
    check: (rt) => rt.latitude != null && rt.longitude != null,
    hint: "Precise location is essential for map placement.",
  },
  {
    key: "geo_precision",
    label: "Location Precision",
    category: "location",
    weight: 5,
    check: (rt) => rt.geo_precision === "exact",
    hint: "Exact coordinates are preferred over approximate ones.",
  },
  {
    key: "locality",
    label: "Locality Description",
    category: "location",
    weight: 4,
    check: (rt) => !!rt.locality_text && rt.locality_text.length > 5,
    hint: "Where is this tree? A park, forest, roadside?",
  },
  {
    key: "province",
    label: "Region / State",
    category: "location",
    weight: 4,
    check: (rt) => !!rt.province,
    hint: "The province, state, or region where this tree grows.",
  },
  // Science (15%)
  {
    key: "height",
    label: "Height",
    category: "science",
    weight: 4,
    check: (rt) => rt.height_m != null && rt.height_m > 0,
    hint: "Measured or estimated height in metres.",
  },
  {
    key: "girth",
    label: "Girth / Circumference",
    category: "science",
    weight: 4,
    check: (rt) => !!rt.girth_or_stem,
    hint: "Trunk girth at breast height (1.3m).",
  },
  {
    key: "crown",
    label: "Crown Spread",
    category: "science",
    weight: 3,
    check: (rt) => !!rt.crown_spread,
    hint: "The diameter of the tree's canopy.",
  },
  // Story (15%)
  {
    key: "description",
    label: "Description / Story",
    category: "story",
    weight: 10,
    check: (rt) => !!rt.description && rt.description.length >= 30,
    hint: "At least a paragraph about why this tree matters.",
  },
  {
    key: "description_rich",
    label: "Rich Description (100+ chars)",
    category: "story",
    weight: 5,
    check: (rt) => !!rt.description && rt.description.length >= 100,
    hint: "A richer narrative makes for a more compelling page.",
  },
  // Provenance (15%)
  {
    key: "source_title",
    label: "Source Document",
    category: "provenance",
    weight: 5,
    check: (rt) => !!rt.source_doc_title,
    hint: "The document or register this record comes from.",
  },
  {
    key: "source_url",
    label: "Source URL",
    category: "provenance",
    weight: 3,
    check: (rt) => !!rt.source_doc_url,
    hint: "A link back to the original source for verification.",
  },
  {
    key: "source_year",
    label: "Source Year",
    category: "provenance",
    weight: 2,
    check: (rt) => rt.source_doc_year > 0,
    hint: "When was the source data published?",
  },
];

export interface CompletenessResult {
  score: number; // 0–100
  maxScore: number;
  fields: Array<CompletenessField & { passed: boolean }>;
  byCategory: Record<string, { passed: number; total: number; score: number; maxScore: number }>;
  missingCritical: CompletenessField[];
  nextBestAction: string | null;
}

export function calculateCompleteness(rt: ResearchTreeRow): CompletenessResult {
  const fields = COMPLETENESS_FIELDS.map((f) => ({ ...f, passed: f.check(rt) }));
  const maxScore = fields.reduce((sum, f) => sum + f.weight, 0);
  const score = fields.reduce((sum, f) => sum + (f.passed ? f.weight : 0), 0);

  // By category
  const byCategory: Record<string, { passed: number; total: number; score: number; maxScore: number }> = {};
  for (const f of fields) {
    if (!byCategory[f.category]) byCategory[f.category] = { passed: 0, total: 0, score: 0, maxScore: 0 };
    byCategory[f.category].total++;
    byCategory[f.category].maxScore += f.weight;
    if (f.passed) {
      byCategory[f.category].passed++;
      byCategory[f.category].score += f.weight;
    }
  }

  // Missing critical = highest-weight missing fields
  const missingCritical = fields
    .filter((f) => !f.passed)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  // Next best action
  const nextBestAction = missingCritical.length > 0
    ? missingCritical[0].hint
    : null;

  return {
    score: Math.round((score / maxScore) * 100),
    maxScore,
    fields,
    byCategory,
    missingCritical,
    nextBestAction,
  };
}

/* ══════════════════════════════════════════════════════════
   3. CONVERSION FIELD MAPPING
   ══════════════════════════════════════════════════════════ */

export interface FieldMapping {
  researchField: string;
  treeField: string;
  researchValue: string | number | null;
  treeValue: string | number | null;
  status: "mapped" | "missing" | "default" | "transformed";
  note?: string;
}

export function auditFieldMapping(rt: ResearchTreeRow): FieldMapping[] {
  const name = rt.tree_name || rt.species_common || rt.species_scientific;
  const species = rt.species_common || rt.species_scientific;

  return [
    { researchField: "tree_name / species_common / species_scientific", treeField: "name", researchValue: name, treeValue: name, status: name ? "mapped" : "missing" },
    { researchField: "species_common || species_scientific", treeField: "species", researchValue: species, treeValue: species, status: species ? "mapped" : "missing" },
    { researchField: "latitude", treeField: "latitude", researchValue: rt.latitude, treeValue: rt.latitude, status: rt.latitude != null ? "mapped" : "missing" },
    { researchField: "longitude", treeField: "longitude", researchValue: rt.longitude, treeValue: rt.longitude, status: rt.longitude != null ? "mapped" : "missing" },
    { researchField: "country", treeField: "nation", researchValue: rt.country, treeValue: rt.country, status: "mapped" },
    { researchField: "province", treeField: "state", researchValue: rt.province, treeValue: rt.province, status: rt.province ? "mapped" : "missing" },
    { researchField: "description", treeField: "description", researchValue: rt.description?.substring(0, 60) ?? null, treeValue: rt.description?.substring(0, 60) ?? null, status: rt.description ? "mapped" : "missing" },
    { researchField: "description + designation", treeField: "lore_text", researchValue: rt.description?.substring(0, 40) ?? null, treeValue: null, status: rt.description ? "transformed" : "missing", note: "Generated from description + designation type" },
    { researchField: "girth_or_stem", treeField: "girth_cm", researchValue: rt.girth_or_stem, treeValue: rt.girth_or_stem ? "parsed" : null, status: rt.girth_or_stem ? "transformed" : "missing", note: "Parsed from text to numeric cm" },
    { researchField: "source_doc_title", treeField: "source_name", researchValue: rt.source_doc_title, treeValue: rt.source_doc_title, status: "mapped" },
    { researchField: "source_doc_url", treeField: "source_url", researchValue: rt.source_doc_url, treeValue: rt.source_doc_url, status: "mapped" },
    { researchField: "source_program", treeField: "project_name", researchValue: rt.source_program, treeValue: rt.source_program, status: "mapped" },
    { researchField: "(none)", treeField: "estimated_age", researchValue: null, treeValue: null, status: "missing", note: "Not available in research schema" },
    { researchField: "(none)", treeField: "what3words", researchValue: null, treeValue: null, status: "missing", note: "Not available in research schema" },
  ];
}

/* ══════════════════════════════════════════════════════════
   4. DUPLICATE DETECTION
   ══════════════════════════════════════════════════════════ */

export interface DuplicateCandidate {
  id: string;
  name: string;
  species: string;
  distance_km: number;
  reason: string;
}

/**
 * Build a query to find potential duplicates in the trees table.
 * Returns Supabase-compatible filter parameters.
 */
export function buildDuplicateCheckParams(rt: ResearchTreeRow) {
  return {
    lat: rt.latitude,
    lng: rt.longitude,
    species: rt.species_common || rt.species_scientific,
    name: rt.tree_name,
    radiusKm: 0.5,
  };
}

/** Haversine distance in km */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ══════════════════════════════════════════════════════════
   5. CONVERSION EXECUTION
   ══════════════════════════════════════════════════════════ */

/**
 * Build the insert payload for the trees table from a research tree.
 * Returns a clean object ready for supabase.from("trees").insert().
 */
export function buildTreeInsertPayload(rt: ResearchTreeRow, overrides?: Partial<TreeRow>): Omit<TreeRow, "id" | "created_at" | "updated_at"> {
  const name = rt.tree_name || rt.species_common || rt.species_scientific;
  const species = rt.species_common || rt.species_scientific;

  // Build lore_text
  const loreParts: string[] = [];
  if (rt.designation_type && rt.designation_type !== "Notable Tree") {
    loreParts.push(`Designated as ${rt.designation_type}.`);
  }
  if (rt.description) loreParts.push(rt.description);

  return {
    name,
    species,
    latitude: rt.latitude,
    longitude: rt.longitude,
    description: rt.description,
    nation: rt.country,
    state: rt.province,
    lore_text: loreParts.join(" ") || null,
    girth_cm: rt.girth_or_stem ? parseGirthToCm(rt.girth_or_stem) : null,
    grove_scale: rt.record_kind === "grove" ? "local" as any : null,
    source_name: rt.source_doc_title,
    source_url: rt.source_doc_url,
    project_name: rt.source_program,
    project_url: rt.source_doc_url,
    // Defaults
    archetype: null,
    bioregion: null,
    created_by: null,
    discovery_list: null,
    elemental_signature: null,
    estimated_age: null,
    is_anchor_node: false,
    is_churchyard_tree: false,
    lineage: null,
    linked_churchyard_id: null,
    radio_theme: null,
    seasonal_tone: null,
    source_id: null,
    what3words: null,
    wish_tags: null,
    ...overrides,
  } as any;
}

function parseGirthToCm(girth: string): number | null {
  const mMatch = girth.match(/([\d.]+)\s*m/i);
  if (mMatch) return Math.round(parseFloat(mMatch[1]) * 100);
  const cmMatch = girth.match(/([\d.]+)\s*cm/i);
  if (cmMatch) return Math.round(parseFloat(cmMatch[1]));
  return null;
}
