/**
 * useBorrowedStaff — fetches the signed-in user's temporary "Borrowed Staff",
 * assigning one randomly from the 144-pool on first use.
 *
 * The DB row stores the assignment (RLS: own row only, single insert per user).
 * Archetype detail (species/blessing/etc) is enriched from the local pool so
 * we don't have to seed 144 rows server-side for the prototype.
 */
import { useEffect } from "react";
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

async function assignBorrowedStaff(userId: string): Promise<BorrowedStaff | null> {
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
    // Unique constraint or RLS race: just re-fetch whatever exists.
    return fetchBorrowedStaff(userId);
  }
  return fetchBorrowedStaff(userId);
}

export function useBorrowedStaff() {
  const { userId, isLoading: userLoading } = useCurrentUser();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["borrowed-staff", userId],
    queryFn: () => (userId ? fetchBorrowedStaff(userId) : null),
    enabled: !!userId,
    staleTime: 60 * 60 * 1000,
  });

  // Auto-assign on first fetch when none exists.
  useEffect(() => {
    if (!userId) return;
    if (query.isLoading || query.isFetching) return;
    if (query.data) return;
    if (query.isError) return;
    let cancelled = false;
    (async () => {
      const staff = await assignBorrowedStaff(userId);
      if (!cancelled) {
        qc.setQueryData(["borrowed-staff", userId], staff);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, query.isLoading, query.isFetching, query.data, query.isError]);

  return {
    staff: query.data ?? null,
    isLoading: userLoading || query.isLoading,
    isAnonymous: !userLoading && !userId,
  };
}
