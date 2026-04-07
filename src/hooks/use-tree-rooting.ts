/**
 * useTreeRooting — React hook for the Heart Rooting system at a specific tree.
 * Wraps rootingService with React Query caching.
 */
import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTreeRoot,
  plantHearts,
  collectGrowth,
  calculateGrowth,
  type TreeRoot,
} from "@/lib/rootingService";
import { isWithinGracePeriod } from "@/utils/heartPoolState";

export function useTreeRooting(
  userId: string | null,
  treeId: string | undefined,
  opts?: { isNearby?: boolean; isCheckedIn?: boolean; hasVisited?: boolean }
) {
  const qc = useQueryClient();

  const rootQuery = useQuery({
    queryKey: ["tree-root", userId, treeId],
    enabled: Boolean(userId && treeId),
    staleTime: 30_000,
    queryFn: () => getTreeRoot(userId!, treeId!),
  });

  const root = rootQuery.data ?? null;
  const growth = root ? calculateGrowth(root) : 0;

  // Eligibility: has visited OR within grace
  const hasVisited = opts?.hasVisited ?? false;
  const inGrace = treeId ? isWithinGracePeriod(treeId) : false;
  const canPlant = Boolean(userId && treeId && (hasVisited || inGrace));

  // Can collect only when at tree or in grace
  const isPresent = opts?.isNearby || opts?.isCheckedIn || false;
  const canCollect = Boolean(root && growth > 0 && (isPresent || inGrace));

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["tree-root", userId, treeId] });
    qc.invalidateQueries({ queryKey: ["heart-balance", userId] });
    qc.invalidateQueries({ queryKey: ["heart-ledger", userId] });
  }, [qc, userId, treeId]);

  const plant = useMutation({
    mutationFn: async (params: { amount: number; speciesKey?: string }) => {
      // If there's pending growth, silently collect it first
      // to prevent retroactive growth on newly planted hearts
      if (root && calculateGrowth(root) > 0) {
        await collectGrowth(userId!, treeId!).catch(() => {});
      }
      return plantHearts({
        userId: userId!,
        treeId: treeId!,
        amount: params.amount,
        speciesKey: params.speciesKey,
      });
    },
    onSuccess: () => {
      invalidate();
    },
  });

  const collect = useMutation({
    mutationFn: () => collectGrowth(userId!, treeId!),
    onSuccess: (result) => {
      invalidate();
      if (result && result.growth > 0) {
        window.dispatchEvent(
          new CustomEvent("s33d-hearts-earned", {
            detail: { amount: result.growth },
          })
        );
      }
    },
  });

  return {
    root,
    growth,
    canPlant,
    canCollect,
    isLoading: rootQuery.isLoading,
    plant: plant.mutateAsync,
    collect: collect.mutateAsync,
    isPlanting: plant.isPending,
    isCollecting: collect.isPending,
  };
}
