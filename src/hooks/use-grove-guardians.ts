/**
 * Hook: useGroveGuardians — manage grove guardian relationships.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

export type GuardianRole = "founder" | "guardian" | "steward" | "story_keeper";

export interface GroveGuardian {
  id: string;
  grove_id: string;
  user_id: string;
  role: GuardianRole;
  contribution_score: number;
  visits_count: number;
  offerings_count: number;
  stories_count: number;
  trees_added: number;
  since_date: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const GUARDIAN_ROLE_LABELS: Record<GuardianRole, string> = {
  founder: "Founder",
  guardian: "Guardian",
  steward: "Steward",
  story_keeper: "Story Keeper",
};

export const GUARDIAN_ROLE_ICONS: Record<GuardianRole, string> = {
  founder: "🌱",
  guardian: "🌿",
  steward: "🌳",
  story_keeper: "📜",
};

/** Fetch guardians for a specific grove */
export function useGroveGuardians(groveId: string | undefined) {
  return useQuery({
    queryKey: ["grove-guardians", groveId],
    queryFn: async () => {
      if (!groveId) return [];
      const { data, error } = await supabase
        .from("grove_guardians" as any)
        .select("*")
        .eq("grove_id", groveId)
        .order("since_date", { ascending: true });
      if (error) throw error;

      // Fetch profiles for guardians
      const guardians = (data || []) as any[];
      if (guardians.length === 0) return [] as GroveGuardian[];

      const userIds = guardians.map((g: any) => g.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      return guardians.map((g: any) => ({
        ...g,
        profile: profileMap.get(g.user_id) || null,
      })) as GroveGuardian[];
    },
    enabled: !!groveId,
    staleTime: 2 * 60 * 1000,
  });
}

/** Fetch all groves a user guards */
export function useUserGuardianships(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-guardianships", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("grove_guardians" as any)
        .select("*")
        .eq("user_id", userId)
        .order("since_date", { ascending: true });
      if (error) throw error;

      const guardianships = (data || []) as any[];
      if (guardianships.length === 0) return [];

      // Fetch grove details
      const groveIds = guardianships.map((g: any) => g.grove_id);
      const { data: groves } = await supabase
        .from("groves")
        .select("id, grove_name, grove_type, grove_strength, tree_count, species_common, center_latitude, center_longitude")
        .in("id", groveIds);

      const groveMap = new Map((groves || []).map((g: any) => [g.id, g]));

      return guardianships.map((g: any) => ({
        ...g,
        grove: groveMap.get(g.grove_id) || null,
      }));
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

/** Check if current user is guardian of a grove */
export function useIsGroveGuardian(groveId: string | undefined) {
  const user = useCurrentUser();
  const { data: guardians } = useGroveGuardians(groveId);
  if (!user || !guardians) return { isGuardian: false, role: null };
  const match = guardians.find(g => g.user_id === user.id);
  return { isGuardian: !!match, role: match?.role || null };
  if (!user || !guardians) return { isGuardian: false, role: null };
  const match = guardians.find(g => g.user_id === user.id);
  return { isGuardian: !!match, role: match?.role || null };
}

/** Request to become a grove guardian */
export function useBecomeGuardian() {
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();

  return useMutation({
    mutationFn: async ({ groveId, role }: { groveId: string; role?: GuardianRole }) => {
      if (!user) throw new Error("Must be signed in");

      const { data: existing } = await supabase
        .from("grove_guardians" as any)
        .select("id")
        .eq("grove_id", groveId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) throw new Error("Already a guardian of this grove");

      // Determine role: if no guardians exist, become founder
      const { count } = await supabase
        .from("grove_guardians" as any)
        .select("id", { count: "exact", head: true })
        .eq("grove_id", groveId);

      const assignedRole = (count === 0) ? "founder" : (role || "guardian");

      const { error } = await supabase
        .from("grove_guardians" as any)
        .insert({
          grove_id: groveId,
          user_id: user.id,
          role: assignedRole,
        });
      if (error) throw error;

      return assignedRole;
    },
    onSuccess: (role, { groveId }) => {
      queryClient.invalidateQueries({ queryKey: ["grove-guardians", groveId] });
      queryClient.invalidateQueries({ queryKey: ["user-guardianships"] });
      toast.success(`You are now a ${GUARDIAN_ROLE_LABELS[role as GuardianRole] || "Guardian"} of this grove 🌿`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Could not join grove");
    },
  });
}
