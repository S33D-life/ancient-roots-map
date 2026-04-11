/**
 * Shared tree data model, tier classification, and species styling
 * used by both the map interface and the gallery.
 */

/* ── Source reference (for research trees) ── */
export interface TreeSource {
  title: string;
  url?: string;
  year?: number;
  program?: string;
}

/* ── Research-specific metadata ── */
export interface ResearchMeta {
  /** true = research/seed tree, false/undefined = mapped Ancient Friend */
  isResearch: true;
  /** Has a wanderer verified this tree in person? */
  verified: boolean;
  /** Geo precision level */
  geoPrecision?: "exact" | "approx" | "locality" | string;
  /** Designation from source register */
  designationType?: string;
  /** Source documents / registers */
  sources: TreeSource[];
  /** Linked mapped-tree id (after verification) */
  linkedTreeId?: string | null;
  /** Record kind: individual_tree, grove, ecology_node, cultural_site */
  recordKind?: string;
}

/* ── Tree entity ── */
export interface TreeCardData {
  id: string;
  name: string;
  species: string;
  species_key?: string | null;
  what3words?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  estimated_age?: number | null;
  lineage?: string | null;
  state?: string | null;
  nation?: string | null;
  grove_scale?: string | null;
  created_at?: string;
  created_by?: string | null;
  project_name?: string | null;
  /** Present only for research/seed trees */
  research?: ResearchMeta;
}

/* ── Offering summary (lightweight) ── */
export interface OfferingSummary {
  id: string;
  tree_id: string;
  title: string;
  type: string;
  content?: string | null;
  media_url?: string | null;
  nft_link?: string | null;
  created_at: string;
}

/* ── Tier classification ── */
export type TreeTier = "ancient" | "storied" | "notable" | "seedling";

export function getTreeTier(age: number, offerings: number): TreeTier {
  if (age >= 100) return "ancient";
  if (offerings >= 3) return "storied";
  if (offerings >= 1 || age >= 50) return "notable";
  return "seedling";
}

export const TIER_LABELS: Record<TreeTier, string> = {
  ancient: "Ancient",
  storied: "Storied",
  notable: "Notable",
  seedling: "Seedling",
};

export const TIER_COLORS: Record<TreeTier, { bg: string; text: string; border: string }> = {
  ancient:  { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  storied:  { bg: "bg-primary/10",   text: "text-primary",   border: "border-primary/25" },
  notable:  { bg: "bg-muted/60",     text: "text-muted-foreground", border: "border-border/40" },
  seedling: { bg: "bg-muted/30",     text: "text-muted-foreground/70", border: "border-border/20" },
};

/* ── Species hue map ── */
export const SPECIES_HUE: Record<string, number> = {
  oak: 120, yew: 145, ash: 110, beech: 130, birch: 90, cherry: 340,
  holly: 150, pine: 155, willow: 100, rowan: 25, hawthorn: 115,
  hazel: 80, sycamore: 105, alder: 135, apple: 95,
};

export function getSpeciesHue(species: string): number {
  return SPECIES_HUE[species.toLowerCase()] ?? 120;
}
