/**
 * useCanCreateGarden — returns true if the current user has the
 * `curator` or `garden_steward` role (invite-only garden creation).
 *
 * RLS still enforces the rule server-side; this hook just decides
 * whether to *show* the "Plant a new garden" button.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCanCreateGarden() {
  return useQuery({
    queryKey: ["can-create-garden"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["curator", "garden_steward"]);
      if (error) return false;
      return (data?.length || 0) > 0;
    },
  });
}
