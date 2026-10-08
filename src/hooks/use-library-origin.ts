/**
 * PLANeTary Library · resolve an Ancient Friend origin for the return path.
 *
 * Reads only the fields needed to label the return. A tree the reader cannot
 * load, or one marked private, is treated as unavailable: the return falls back
 * to the Library. Offerings are never read here.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LibraryOrigin } from "@/lib/library/origin";

export interface OriginTree { id: string; name: string; species_key: string | null }

export type OriginState =
  | { status: "none" }
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "available"; tree: OriginTree };

export function useLibraryOrigin(origin: LibraryOrigin | null): OriginState {
  const q = useQuery({
    queryKey: ["library-origin", origin?.id],
    enabled: !!origin,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async (): Promise<OriginTree | null> => {
      const { data, error } = await supabase
        .from("trees")
        .select("id, name, species_key, accessibility_tier")
        .eq("id", origin!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data || data.id !== origin!.id || data.accessibility_tier === "private") return null;
      return { id: data.id, name: data.name, species_key: data.species_key };
    },
  });
  if (!origin) return { status: "none" };
  if (q.isPending) return { status: "loading" };
  if (q.isError || !q.data) return { status: "unavailable" };
  return { status: "available", tree: q.data };
}
