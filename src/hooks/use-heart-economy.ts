/**
 * useHeartEconomy — React hook wrapping heartService for components.
 * Provides balance, ledger, claims, and action methods with caching.
 */
import { useCallback, useEffect, useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import {
  getHeartBalance,
  getHeartLedger,
  getClaimableRewards,
  earnHearts,
  spendHearts,
  canSpend,
} from "@/lib/heartService";
import type {
  HeartBalance,
  HeartLedgerEntry,
  HeartClaim,
  HeartTransactionType,
  SpendCheck,
} from "@/lib/heart-economy-types";

export function useHeartEconomy(userId: string | null) {
  const qc = useQueryClient();

  const balanceQuery = useQuery({
    queryKey: ["heart-balance", userId],
    enabled: Boolean(userId),
    staleTime: 30_000,
    queryFn: () => getHeartBalance(userId!),
  });

  const ledgerQuery = useQuery({
    queryKey: ["heart-ledger", userId],
    enabled: Boolean(userId),
    staleTime: 30_000,
    queryFn: () => getHeartLedger(userId!, { limit: 30 }),
  });

  const claimsQuery = useQuery({
    queryKey: ["heart-claims", userId],
    enabled: Boolean(userId),
    staleTime: 60_000,
    queryFn: () => getClaimableRewards(userId!),
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["heart-balance", userId] });
    qc.invalidateQueries({ queryKey: ["heart-ledger", userId] });
  }, [qc, userId]);

  const earn = useMutation({
    mutationFn: (params: {
      amount: number;
      transactionType: HeartTransactionType;
      entityType?: string;
      entityId?: string;
      source?: string;
    }) => earnHearts({ userId: userId!, ...params }),
    onSuccess: (_data, variables) => {
      invalidate();
      window.dispatchEvent(new CustomEvent("s33d-hearts-earned", { detail: { amount: variables.amount } }));
    },
  });

  const spend = useMutation({
    mutationFn: (params: {
      amount: number;
      transactionType: HeartTransactionType;
      entityType?: string;
      entityId?: string;
      destination?: string;
    }) => spendHearts({ userId: userId!, ...params }),
    onSuccess: invalidate,
  });

  const checkSpend = useCallback(
    (amount: number) => (userId ? canSpend(userId, amount) : Promise.resolve({ allowed: false, currentBalance: 0, shortfall: amount } as SpendCheck)),
    [userId]
  );

  return {
    balance: balanceQuery.data ?? { s33d: 0, species: 0, influence: 0, locked: 0, claimable: 0 } as HeartBalance,
    ledger: ledgerQuery.data ?? [] as HeartLedgerEntry[],
    claims: claimsQuery.data ?? [] as HeartClaim[],
    isLoading: balanceQuery.isLoading,
    earn: earn.mutateAsync,
    spend: spend.mutateAsync,
    checkSpend,
    invalidate,
  };
}
