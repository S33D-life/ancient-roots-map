import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useHasRole(role: "curator" | "keeper") {
  const [hasRole, setHasRole] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: role,
      });
      if (!cancelled) {
        setHasRole(!!data);
        setLoading(false);
      }
    };
    check();
    return () => { cancelled = true; };
  }, [role]);

  return { hasRole, loading };
}
