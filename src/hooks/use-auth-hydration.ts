import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Restores authentication without making it part of the public render path.
 * Auth events win over an older getSession result, which avoids stale identity
 * when a refresh/sign-out occurs while persisted-session recovery is pending.
 */
export function useAuthHydration() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let authEventVersion = 0;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventVersion += 1;
      if (active) setCurrentUserId(session?.user?.id ?? null);
    });

    const restoreStartedAtVersion = authEventVersion;
    void supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (active && authEventVersion === restoreStartedAtVersion) {
          setCurrentUserId(session?.user?.id ?? null);
        }
      })
      .catch((error: unknown) => {
        if (import.meta.env.DEV) {
          console.warn("[auth] Session restoration failed; continuing publicly.", error);
        }
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return currentUserId;
}