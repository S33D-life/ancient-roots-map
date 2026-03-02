/**
 * useCountrySpeciesActivity — computes top 33 species by activity score for a country.
 *
 * ActivityScore = (mapped*1.0 + visits*1.5 + offerings*2.0)
 * Recency multiplier: if recent30d activity → ×1.5, if new trees 30d → ×1.25
 *
 * Caches via React Query with 10-minute staleTime.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* ── Species alias normalization ── */
const SPECIES_ALIASES: Record<string, string> = {
  "oak": "Quercus robur",
  "english oak": "Quercus robur",
  "pedunculate oak": "Quercus robur",
  "sessile oak": "Quercus petraea",
  "scots pine": "Pinus sylvestris",
  "scotch pine": "Pinus sylvestris",
  "common beech": "Fagus sylvatica",
  "european beech": "Fagus sylvatica",
  "beech": "Fagus sylvatica",
  "silver birch": "Betula pendula",
  "common lime": "Tilia × europaea",
  "lime": "Tilia × europaea",
  "linden": "Tilia × europaea",
  "horse chestnut": "Aesculus hippocastanum",
  "sweet chestnut": "Castanea sativa",
  "yew": "Taxus baccata",
  "english yew": "Taxus baccata",
  "common ash": "Fraxinus excelsior",
  "ash": "Fraxinus excelsior",
  "sycamore": "Acer pseudoplatanus",
  "field maple": "Acer campestre",
  "hawthorn": "Crataegus monogyna",
  "holly": "Ilex aquifolium",
  "alder": "Alnus glutinosa",
  "common alder": "Alnus glutinosa",
  "wild cherry": "Prunus avium",
  "cedar of lebanon": "Cedrus libani",
  "plane": "Platanus × acerifolia",
  "london plane": "Platanus × acerifolia",
  "black poplar": "Populus nigra",
  "white willow": "Salix alba",
  "crack willow": "Salix fragilis",
  "european larch": "Larix decidua",
  "larch": "Larix decidua",
  "norway spruce": "Picea abies",
  "spruce": "Picea abies",
  "douglas fir": "Pseudotsuga menziesii",
  "stone pine": "Pinus pinea",
  "umbrella pine": "Pinus pinea",
  "swiss stone pine": "Pinus cembra",
  "arolla pine": "Pinus cembra",
};

function normalizeSpecies(raw: string | null): string {
  if (!raw || !raw.trim()) return "Unknown";
  const lower = raw.trim().toLowerCase();
  if (SPECIES_ALIASES[lower]) return SPECIES_ALIASES[lower];
  // Title-case the original
  return raw.trim();
}

export interface SpeciesActivity {
  species: string;
  mapped: number;
  visits: number;
  offerings: number;
  recentActivity: boolean;
  recentTrees: number;
  score: number;
  lastActivity: string | null;
}

async function fetchCountrySpeciesActivity(country: string): Promise<SpeciesActivity[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // 1) Fetch trees for this country
  const { data: trees } = await supabase
    .from("trees")
    .select("id, species, created_at")
    .eq("nation", country);

  if (!trees || trees.length === 0) {
    // Also check research_trees
    const { data: researchTrees } = await supabase
      .from("research_trees")
      .select("id, species_common, species_scientific, created_at")
      .eq("country", country);

    if (!researchTrees || researchTrees.length === 0) return [];

    // Build from research trees only (no visits/offerings)
    const speciesMap = new Map<string, SpeciesActivity>();
    for (const rt of researchTrees) {
      const sp = normalizeSpecies(rt.species_common || rt.species_scientific);
      const existing = speciesMap.get(sp) || {
        species: sp, mapped: 0, visits: 0, offerings: 0,
        recentActivity: false, recentTrees: 0, score: 0, lastActivity: null,
      };
      existing.mapped++;
      if (rt.created_at && rt.created_at > thirtyDaysAgo) {
        existing.recentTrees++;
        existing.recentActivity = true;
      }
      if (!existing.lastActivity || (rt.created_at && rt.created_at > existing.lastActivity)) {
        existing.lastActivity = rt.created_at;
      }
      speciesMap.set(sp, existing);
    }

    return scoreAndRank(speciesMap);
  }

  const treeIds = trees.map(t => t.id);

  // 2) Fetch visits (checkins) for these trees
  const { data: checkins } = await supabase
    .from("tree_checkins")
    .select("tree_id, checked_in_at")
    .in("tree_id", treeIds.slice(0, 500));

  // 3) Fetch offerings
  const { data: offerings } = await supabase
    .from("offerings")
    .select("tree_id, created_at")
    .in("tree_id", treeIds.slice(0, 500));

  // Build species map from trees
  const treeSpeciesMap = new Map<string, string>();
  const speciesMap = new Map<string, SpeciesActivity>();

  for (const t of trees) {
    const sp = normalizeSpecies(t.species);
    treeSpeciesMap.set(t.id, sp);
    const existing = speciesMap.get(sp) || {
      species: sp, mapped: 0, visits: 0, offerings: 0,
      recentActivity: false, recentTrees: 0, score: 0, lastActivity: null,
    };
    existing.mapped++;
    if (t.created_at && t.created_at > thirtyDaysAgo) {
      existing.recentTrees++;
      existing.recentActivity = true;
    }
    if (!existing.lastActivity || (t.created_at && t.created_at > existing.lastActivity)) {
      existing.lastActivity = t.created_at;
    }
    speciesMap.set(sp, existing);
  }

  // Add checkins
  if (checkins) {
    for (const c of checkins) {
      const sp = treeSpeciesMap.get(c.tree_id);
      if (!sp) continue;
      const existing = speciesMap.get(sp);
      if (existing) {
        existing.visits++;
        if (c.checked_in_at && c.checked_in_at > thirtyDaysAgo) {
          existing.recentActivity = true;
        }
        if (!existing.lastActivity || (c.checked_in_at && c.checked_in_at > existing.lastActivity)) {
          existing.lastActivity = c.checked_in_at;
        }
      }
    }
  }

  // Add offerings
  if (offerings) {
    for (const o of offerings) {
      const sp = treeSpeciesMap.get(o.tree_id);
      if (!sp) continue;
      const existing = speciesMap.get(sp);
      if (existing) {
        existing.offerings++;
        if (o.created_at && o.created_at > thirtyDaysAgo) {
          existing.recentActivity = true;
        }
        if (!existing.lastActivity || (o.created_at && o.created_at > existing.lastActivity)) {
          existing.lastActivity = o.created_at;
        }
      }
    }
  }

  // Also merge in research_trees
  const { data: researchTrees } = await supabase
    .from("research_trees")
    .select("species_common, species_scientific, created_at")
    .eq("country", country);

  if (researchTrees) {
    for (const rt of researchTrees) {
      const sp = normalizeSpecies(rt.species_common || rt.species_scientific);
      const existing = speciesMap.get(sp) || {
        species: sp, mapped: 0, visits: 0, offerings: 0,
        recentActivity: false, recentTrees: 0, score: 0, lastActivity: null,
      };
      existing.mapped++;
      if (rt.created_at && rt.created_at > thirtyDaysAgo) {
        existing.recentTrees++;
      }
      speciesMap.set(sp, existing);
    }
  }

  return scoreAndRank(speciesMap);
}

function scoreAndRank(speciesMap: Map<string, SpeciesActivity>): SpeciesActivity[] {
  // Cap Unknown at 10% of total mapped
  const totalMapped = Array.from(speciesMap.values()).reduce((s, v) => s + v.mapped, 0);
  const unknownEntry = speciesMap.get("Unknown");
  if (unknownEntry && unknownEntry.mapped > totalMapped * 0.1) {
    unknownEntry.mapped = Math.ceil(totalMapped * 0.1);
  }

  // Compute scores
  for (const entry of speciesMap.values()) {
    let base = entry.mapped * 1.0 + entry.visits * 1.5 + entry.offerings * 2.0;
    if (entry.recentActivity) base *= 1.5;
    if (entry.recentTrees > 0) base *= 1.25;
    entry.score = Math.round(base * 100) / 100;
  }

  return Array.from(speciesMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 33);
}

export function useCountrySpeciesActivity(country: string) {
  return useQuery({
    queryKey: ["country-species-activity", country],
    queryFn: () => fetchCountrySpeciesActivity(country),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!country,
  });
}
