/**
 * useStaffIdentity — single source of truth for a wanderer's staff lineage.
 *
 * Combines:
 *   - Borrowed Staff (from `user_borrowed_staffs` via useBorrowedStaff)
 *   - Permanent Staff (from `ceremony_logs.binding` + `profiles.active_staff_id`)
 *   - Ceremony count + trees mapped (soft proxy for "trees walked with staff")
 *
 * Used by Hearth, Vault, Star Trail, Quest Cave, and Staff Room so every
 * surface speaks the same identity language.
 *
 * Does not own any payment, NFT, or new staff mechanics. Read-only.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBorrowedStaff, type BorrowedStaff } from "./use-borrowed-staff";

export interface PermanentStaff {
  /** Staff code / id (matches `staffs.id` and `/staff/:code` route). */
  code: string;
  /** Best-effort species label, may be null. */
  species: string | null;
  /** Best-effort name, may be null. */
  name: string | null;
}

export interface StaffIdentity {
  borrowed: BorrowedStaff | null;
  permanent: PermanentStaff | null;
  hasBorrowed: boolean;
  hasPermanent: boolean;
  /** A binding ceremony exists in the user's history. */
  hasBinding: boolean;
  /** The first staff that walked with the wanderer (borrowed if present, else permanent). */
  firstGuide: { code: string | null; species: string | null; kind: "borrowed" | "permanent" | null };
  ceremonyCount: number;
  /** Soft proxy: trees mapped by this user (until staff_id is wired into trees). */
  treesMappedWithStaff: number;
  isLoading: boolean;
  error: Error | null;
}

const EMPTY: StaffIdentity = {
  borrowed: null,
  permanent: null,
  hasBorrowed: false,
  hasPermanent: false,
  hasBinding: false,
  firstGuide: { code: null, species: null, kind: null },
  ceremonyCount: 0,
  treesMappedWithStaff: 0,
  isLoading: false,
  error: null,
};

interface ExtraState {
  permanent: PermanentStaff | null;
  hasBinding: boolean;
  ceremonyCount: number;
  treesMappedWithStaff: number;
  loading: boolean;
  error: Error | null;
}

export function useStaffIdentity(userId: string | null | undefined): StaffIdentity {
  const borrowedQuery = useBorrowedStaff();
  const [extra, setExtra] = useState<ExtraState>({
    permanent: null,
    hasBinding: false,
    ceremonyCount: 0,
    treesMappedWithStaff: 0,
    loading: !!userId,
    error: null,
  });

  useEffect(() => {
    if (!userId) {
      setExtra({
        permanent: null,
        hasBinding: false,
        ceremonyCount: 0,
        treesMappedWithStaff: 0,
        loading: false,
        error: null,
      });
      return;
    }
    let cancelled = false;
    setExtra((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        const [profileRes, ceremoniesRes, treeCountRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("active_staff_id")
            .eq("id", userId)
            .maybeSingle(),
          supabase
            .from("ceremony_logs")
            .select("id, ceremony_type, staff_code, staff_name, staff_species, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("trees")
            .select("id", { count: "exact", head: true })
            .eq("created_by", userId),
        ]);

        if (cancelled) return;

        const ceremonies = (ceremoniesRes.data ?? []) as Array<{
          id: string;
          ceremony_type: string | null;
          staff_code: string | null;
          staff_name: string | null;
          staff_species: string | null;
          created_at: string;
        }>;
        const binding = ceremonies.find((c) => c.ceremony_type === "binding");
        const activeStaffId =
          (profileRes.data as { active_staff_id?: string | null } | null)?.active_staff_id ||
          (typeof window !== "undefined"
            ? localStorage.getItem("linked_staff_code")
            : null);

        let permanent: PermanentStaff | null = null;
        if (binding?.staff_code) {
          permanent = {
            code: binding.staff_code,
            species: binding.staff_species ?? null,
            name: binding.staff_name ?? null,
          };
        } else if (activeStaffId) {
          // active staff with no binding ceremony: surface as permanent only if
          // the row exists in `staffs` (otherwise it's likely the borrowed code).
          const { data: staffRow } = await supabase
            .from("staffs")
            .select("id, species, name")
            .eq("id", activeStaffId)
            .maybeSingle();
          if (staffRow) {
            permanent = {
              code: (staffRow as any).id,
              species: (staffRow as any).species ?? null,
              name: (staffRow as any).name ?? null,
            };
          }
        }

        // Enrich permanent species/name from staffs if missing.
        if (permanent && (!permanent.species || !permanent.name)) {
          const { data: staffRow } = await supabase
            .from("staffs")
            .select("species, name")
            .eq("id", permanent.code)
            .maybeSingle();
          if (staffRow) {
            permanent = {
              ...permanent,
              species: permanent.species ?? (staffRow as any).species ?? null,
              name: permanent.name ?? (staffRow as any).name ?? null,
            };
          }
        }

        if (cancelled) return;
        setExtra({
          permanent,
          hasBinding: !!binding,
          ceremonyCount: ceremonies.length,
          treesMappedWithStaff: treeCountRes.count ?? 0,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        setExtra((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err : new Error("Staff identity load failed"),
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId) return EMPTY;

  const borrowed = borrowedQuery.staff;
  const permanent = extra.permanent;
  const hasBorrowed = !!borrowed;
  const hasPermanent = !!permanent;

  // First guide = borrowed if present (always offered first), else permanent.
  const firstGuide: StaffIdentity["firstGuide"] = hasBorrowed
    ? {
        code: borrowed!.id,
        species: borrowed!.archetype_species ?? null,
        kind: "borrowed",
      }
    : hasPermanent
      ? {
          code: permanent!.code,
          species: permanent!.species,
          kind: "permanent",
        }
      : { code: null, species: null, kind: null };

  return {
    borrowed,
    permanent,
    hasBorrowed,
    hasPermanent,
    hasBinding: extra.hasBinding,
    firstGuide,
    ceremonyCount: extra.ceremonyCount,
    treesMappedWithStaff: extra.treesMappedWithStaff,
    isLoading: borrowedQuery.isLoading || extra.loading,
    error: extra.error ?? borrowedQuery.error ?? null,
  };
}
