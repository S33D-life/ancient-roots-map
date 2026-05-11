/**
 * useTreeResonance — soft, presence-aware signals for the MemorySeedComposer.
 *
 * Returns gentle hints (never blocks):
 *   • distanceMeters / nearOfferingRange — physical proximity
 *   • visitedBefore                       — did this user walk with this tree
 *   • staffResonance                      — does the borrowed staff archetype
 *                                            resonate with this tree's species
 *   • lifeGroveLink                       — is this tree linked to a Life Grove
 *
 * No schema changes. Read-only Supabase queries gated by `enabled`.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBorrowedStaff } from "@/hooks/use-borrowed-staff";
import { useTreeProximityGate } from "@/hooks/use-tree-proximity-gate";

const VISITS_KEY = "s33d-tree-visits";
const OFFERING_RADIUS_M = 100;

/** Match a tree species against a borrowed staff's archetype species. */
function matchSpecies(staffSpecies: string | null | undefined, treeSpecies: string | null | undefined): string | null {
  if (!staffSpecies || !treeSpecies) return null;
  const a = staffSpecies.toLowerCase().trim();
  const b = treeSpecies.toLowerCase().trim();
  if (!a || !b) return null;
  // Direct overlap on first word (genus or common name)
  const aWord = a.split(/\s|·|,/)[0];
  const bWord = b.split(/\s|·|,/)[0];
  if (aWord && bWord && (a.includes(bWord) || b.includes(aWord) || aWord === bWord)) {
    return aWord; // poetic noun: "oak", "yew", "hazel"
  }
  return null;
}

interface Options {
  treeId: string | undefined;
  treeLat?: number | null;
  treeLng?: number | null;
  treeSpecies?: string | null;
  userId: string | null;
  enabled?: boolean;
}

export function useTreeResonance({
  treeId,
  treeLat,
  treeLng,
  treeSpecies,
  userId,
  enabled = true,
}: Options) {
  const proximity = useTreeProximityGate({
    treeId,
    treeLat,
    treeLng,
    userId,
  });

  const { staff } = useBorrowedStaff();

  // Did this user walk with this tree before? (localStorage visit log)
  const [visitedBefore, setVisitedBefore] = useState(false);
  useEffect(() => {
    if (!treeId) return;
    try {
      const raw = JSON.parse(localStorage.getItem(VISITS_KEY) || "{}");
      setVisitedBefore(typeof raw[treeId] === "number");
    } catch {
      setVisitedBefore(false);
    }
  }, [treeId, proximity.status]);

  // Life Grove link — any grove that lists this tree as its rooted body.
  const lifeGroveQuery = useQuery({
    queryKey: ["tree-resonance-life-grove", treeId],
    enabled: enabled && !!treeId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("life_groves")
        .select("id, name")
        .eq("linked_tree_id", treeId!)
        .limit(1)
        .maybeSingle();
      if (error) return null;
      return data ?? null;
    },
  });

  const staffResonance = useMemo(
    () => matchSpecies(staff?.archetype_species, treeSpecies),
    [staff?.archetype_species, treeSpecies],
  );

  const nearOfferingRange =
    proximity.distanceMeters != null
      ? proximity.distanceMeters <= OFFERING_RADIUS_M
      : proximity.status === "unlocked_present" || proximity.status === "unlocked_grace";

  return {
    distanceMeters: proximity.distanceMeters,
    nearOfferingRange,
    proximityStatus: proximity.status,
    visitedBefore,
    staffResonance,         // string like "oak" or null
    staffName: staff?.temporary_name ?? null,
    lifeGroveLink: lifeGroveQuery.data ?? null,
  };
}

export type TreeResonance = ReturnType<typeof useTreeResonance>;
