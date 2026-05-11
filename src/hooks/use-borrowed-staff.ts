/**
 * useBorrowedStaff — fetches the signed-in user's temporary "Borrowed Staff",
 * assigning one randomly from the 144-pool on first use.
 *
 * Safety:
 * - DB has UNIQUE(user_id) + RLS "insert once". A duplicate insert errors
 *   gracefully and we re-fetch.
 * - A module-level in-flight map prevents two BorrowedStaffCard instances
 *   on the same page from firing two parallel inserts.
 * - On error we surface `error`/`retry` so the card can show a soft fallback.
 */
import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./use-current-user";
import {
  buildBorrowedStaffPool,
  getBorrowedStaffArchetype,
  pickRandomStaffNumber,
  type BorrowedStaffArchetype,
} from "@/data/borrowedStaffPool";

export interface BorrowedStaff extends BorrowedStaffArchetype {
  id: string;
  user_id: string;
  assigned_at: string;
  is_active: boolean;
}

// Cross-instance in-flight assignments: keyed by userId.
const inFlight = new Map<string, Promise<BorrowedStaff | null>>();

async function fetchBorrowedStaff(userId: string): Promise<BorrowedStaff | null> {
  const { data, error } = await supabase
    .from("user_borrowed_staffs")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const archetype =
    getBorrowedStaffArchetype(data.staff_number) ?? buildBorrowedStaffPool()[0];
  return {
    id: data.id,
    user_id: data.user_id,
    staff_number: data.staff_number,
    circle_number: data.circle_number,
    circle_type: archetype.circle_type,
    archetype_species: data.archetype_species ?? archetype.archetype_species,
    temporary_name: data.temporary_name ?? archetype.temporary_name,
    blessing: data.blessing ?? archetype.blessing,
    assigned_at: data.assigned_at,
    is_active: data.is_active,
  };
}

async function assignBorrowedStaffOnce(userId: string): Promise<BorrowedStaff | null> {
  const existing = inFlight.get(userId);
  if (existing) return existing;
  const promise = (async () => {
    // Re-check first — another tab may have just inserted.
    const already = await fetchBorrowedStaff(userId);
    if (already) return already;
    const number = pickRandomStaffNumber();
    const archetype = getBorrowedStaffArchetype(number)!;
    const { error } = await supabase.from("user_borrowed_staffs").insert({
      user_id: userId,
      staff_number: archetype.staff_number,
      circle_number: archetype.circle_number,
      circle_type: archetype.circle_type,
      archetype_species: archetype.archetype_species,
      temporary_name: archetype.temporary_name,
      blessing: archetype.blessing,
    });
    if (error) {
      // Unique constraint / RLS deny on second insert → just re-fetch.
      return fetchBorrowedStaff(userId);
    }
    return fetchBorrowedStaff(userId);
  })();
  inFlight.set(userId, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(userId);
  }
}

export function useBorrowedStaff() {
  const { userId, isLoading: userLoading } = useCurrentUser();
  const qc = useQueryClient();
  const [assignError, setAssignError] = useState<Error | null>(null);
  const [assigning, setAssigning] = useState(false);

  const query = useQuery({
    queryKey: ["borrowed-staff", userId],
    queryFn: () => (userId ? fetchBorrowedStaff(userId) : null),
    enabled: !!userId,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  const tryAssign = useCallback(async () => {
    if (!userId) return;
    setAssignError(null);
    setAssigning(true);
    try {
      const staff = await assignBorrowedStaffOnce(userId);
      qc.setQueryData(["borrowed-staff", userId], staff);
    } catch (err) {
      setAssignError(err instanceof Error ? err : new Error("Assignment failed"));
    } finally {
      setAssigning(false);
    }
  }, [userId, qc]);

  // Auto-assign on first successful empty fetch.
  useEffect(() => {
    if (!userId) return;
    if (query.isLoading || query.isFetching) return;
    if (query.data) return;
    if (query.isError) return;
    if (assigning || assignError) return;
    void tryAssign();
  }, [userId, query.isLoading, query.isFetching, query.data, query.isError, assigning, assignError, tryAssign]);

  const retry = useCallback(async () => {
    setAssignError(null);
    await query.refetch();
    if (!query.data) await tryAssign();
  }, [query, tryAssign]);

  return {
    staff: query.data ?? null,
    isLoading: userLoading || query.isLoading || assigning,
    isAnonymous: !userLoading && !userId,
    error: assignError ?? (query.error as Error | null) ?? null,
    retry,
  };
}
