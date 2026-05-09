import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listBloomsForTree } from "@/repositories/blooms";
import type { BloomOffering } from "@/lib/blooms/types";

export const bloomsKey = (treeId: string) => ["blooms", treeId] as const;

export function useBlooms(treeId: string | undefined) {
  return useQuery<BloomOffering[]>({
    queryKey: bloomsKey(treeId || ""),
    queryFn: () => listBloomsForTree(treeId!),
    enabled: !!treeId,
    staleTime: 60 * 1000,
  });
}

export function useInvalidateBlooms() {
  const qc = useQueryClient();
  return (treeId: string) => qc.invalidateQueries({ queryKey: bloomsKey(treeId) });
}
