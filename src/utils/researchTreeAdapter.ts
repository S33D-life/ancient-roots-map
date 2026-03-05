/**
 * Adapter: maps research_trees rows and Rootstone records
 * into the unified TreeCardData model.
 */
import type { TreeCardData, TreeSource } from "@/utils/treeCardTypes";
import type { Rootstone } from "@/data/rootstones/types";
import type { Database } from "@/integrations/supabase/types";

type ResearchTreeRow = Database["public"]["Tables"]["research_trees"]["Row"];

/* ── research_trees → TreeCardData ── */
export function researchTreeToCard(rt: ResearchTreeRow): TreeCardData {
  const source: TreeSource = {
    title: rt.source_doc_title,
    url: rt.source_doc_url,
    year: rt.source_doc_year,
    program: rt.source_program ?? undefined,
  };

  return {
    id: `research:${rt.id}`,
    name: rt.tree_name || rt.species_common || rt.species_scientific,
    species: rt.species_common || rt.species_scientific,
    latitude: rt.latitude,
    longitude: rt.longitude,
    description: rt.description,
    nation: rt.country,
    state: rt.province,
    created_at: rt.created_at,
    research: {
      isResearch: true,
      verified: rt.status === "verified" || !!rt.verified_by,
      geoPrecision: rt.geo_precision,
      designationType: rt.designation_type,
      sources: [source],
      linkedTreeId: rt.linked_tree_id,
      recordKind: rt.record_kind,
    },
  };
}

/* ── Rootstone → TreeCardData ── */
export function rootstoneToCard(rs: Rootstone): TreeCardData {
  const source: TreeSource = {
    title: rs.source.name,
    url: rs.source.url,
  };

  return {
    id: `rootstone:${rs.id}`,
    name: rs.name,
    species: rs.species ?? rs.type,
    latitude: rs.location.lat,
    longitude: rs.location.lng,
    description: rs.lore,
    nation: rs.country,
    state: rs.region,
    research: {
      isResearch: true,
      verified: false,
      geoPrecision: rs.confidence === "high" ? "exact" : "approx",
      sources: [source],
      recordKind: rs.type === "grove" ? "grove" : "individual_tree",
    },
  };
}

/** Batch adapter */
export function researchTreesToCards(rows: ResearchTreeRow[]): TreeCardData[] {
  return rows.map(researchTreeToCard);
}

/** Helper: is this card a research/seed tree? */
export function isResearchCard(card: TreeCardData): boolean {
  return !!card.research?.isResearch;
}
