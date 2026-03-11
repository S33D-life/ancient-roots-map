/**
 * useCurrentUser — shared hook for getting the current authenticated user.
 * Replaces scattered `supabase.auth.getUser()` calls across components.
 * Uses React Query for caching so the session is only resolved once.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CurrentUser {
  id: string;
  email?: string;
}

export function useCurrentUser() {
  const { data: user = null, isLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: async (): Promise<CurrentUser | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      return { id: user.id, email: user.email ?? undefined };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return { user, userId: user?.id ?? null, isLoading };
}
