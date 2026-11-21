/**
 * useCurrentUser — shared hook for getting the current authenticated user.
 * Replaces scattered `supabase.auth.getUser()` calls across components.
 * Uses React Query for caching so the session is only resolved once.
 */
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CurrentUser {
  id: string;
  email?: string;
}

export function useCurrentUser() {
  const queryClient=useQueryClient();
  useEffect(()=>{
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
      const next=session?.user ? {id:session.user.id,email:session.user.email} : null;
      const previous=queryClient.getQueryData<CurrentUser|null>(["current-user"]);
      if(previous?.id!==next?.id){
        // Invalidate private Grove caches across logout/account switches, never
        // reuse one family's in-memory results for the next authenticated user.
        const filters={predicate:(q:{queryKey:readonly unknown[]})=>String(q.queryKey[0]).includes("grove")};
        void queryClient.cancelQueries(filters);queryClient.removeQueries(filters);
        void queryClient.cancelQueries({queryKey:["current-user"]});
      }
      queryClient.setQueryData(["current-user"],next);
    });
    return ()=>subscription.unsubscribe();
  },[queryClient]);
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
