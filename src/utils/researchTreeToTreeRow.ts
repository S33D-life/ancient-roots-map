/**
 * Adapter: maps a research_trees row into a trees Row shape
 * so existing tree-detail components can render research trees.
 */
import type { Database } from "@/integrations/supabase/types";

type ResearchTreeRow = Database["public"]["Tables"]["research_trees"]["Row"];
type TreeRow = Database["public"]["Tables"]["trees"]["Row"];

/** Extra metadata preserved from the research record */
export interface ResearchOrigin {
  originType: "research";
  sourceDocTitle: string;
  sourceDocUrl: string;
  sourceDocYear: number;
  sourceProgram: string;
  designationType: string;
  geoPrecision: string;
  recordKind: string;
  heightM: number | null;
  girthOrStem: string | null;
  crownSpread: string | null;
  localityText: string;
  verifiedBy: string | null;
  status: string;
  researchTreeId: string;
}

/**
 * Convert a research_trees row into the shape expected by TreePageHero,
 * TreeStorySection, and other tree-detail components.
 *
 * Fields that don't exist on research_trees get safe defaults.
 */
export function mapResearchTreeToTreeRow(rt: ResearchTreeRow): TreeRow & { __research: ResearchOrigin } {
  const name = rt.tree_name || rt.species_common || rt.species_scientific;
  const species = rt.species_common || rt.species_scientific;

  // Build a lore_text from description + designation
  const loreParts: string[] = [];
  if (rt.designation_type && rt.designation_type !== "Notable Tree") {
    loreParts.push(`Designated as ${rt.designation_type}.`);
  }
  if (rt.description) {
    loreParts.push(rt.description);
  }
  const loreText = loreParts.length > 0 ? loreParts.join(" ") : null;

  const treeRow: TreeRow = {
    id: rt.id,
    name,
    species,
    latitude: rt.latitude,
    longitude: rt.longitude,
    description: rt.description,
    nation: rt.country,
    state: rt.province,
    created_at: rt.created_at,
    updated_at: rt.updated_at,
    // Fields that don't exist on research trees — safe defaults
    archetype: null,
    bioregion: null,
    created_by: null,
    discovery_list: null,
    elemental_signature: null,
    estimated_age: null,
    girth_cm: rt.girth_or_stem ? parseGirthToCm(rt.girth_or_stem) : null,
    grove_scale: rt.record_kind === "grove" ? "local" : null,
    is_anchor_node: false,
    is_churchyard_tree: false,
    lineage: null,
    linked_churchyard_id: null,
    lore_text: loreText,
    project_name: rt.source_program,
    project_url: rt.source_doc_url,
    radio_theme: null,
    seasonal_tone: null,
    source_id: null,
    source_name: rt.source_doc_title,
    source_url: rt.source_doc_url,
    what3words: null,
    wish_tags: null,
  };

  const researchOrigin: ResearchOrigin = {
    originType: "research",
    sourceDocTitle: rt.source_doc_title,
    sourceDocUrl: rt.source_doc_url,
    sourceDocYear: rt.source_doc_year,
    sourceProgram: rt.source_program,
    designationType: rt.designation_type,
    geoPrecision: rt.geo_precision,
    recordKind: rt.record_kind,
    heightM: rt.height_m,
    girthOrStem: rt.girth_or_stem,
    crownSpread: rt.crown_spread,
    localityText: rt.locality_text,
    verifiedBy: rt.verified_by,
    status: rt.status,
    researchTreeId: rt.id,
  };

  return Object.assign(treeRow, { __research: researchOrigin });
}

/** Try to parse girth strings like "5.2m" or "520cm" into cm */
function parseGirthToCm(girth: string): number | null {
  const mMatch = girth.match(/([\d.]+)\s*m/i);
  if (mMatch) return Math.round(parseFloat(mMatch[1]) * 100);
  const cmMatch = girth.match(/([\d.]+)\s*cm/i);
  if (cmMatch) return Math.round(parseFloat(cmMatch[1]));
  return null;
}

/** Generate a URL-safe slug from a research tree */
export function researchTreeSlug(rt: ResearchTreeRow): string {
  const name = rt.tree_name || rt.species_common || rt.species_scientific;
  return name
    .toLowerCase()
    .replace(/[''ʻ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60);
}
