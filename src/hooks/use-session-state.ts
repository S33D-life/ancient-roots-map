import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
export type SessionState = { status: 'INITIALIZING' | 'AUTHENTICATED' | 'UNAUTHENTICATED'; user: User | null };
export function useSessionState(): SessionState {
  const [state, setState] = useState<SessionState>({ status: 'INITIALIZING', user: null });
  useEffect(() => {
    let active = true, initialized = false, revision = 0;
    const apply = (user: User | null) => { if (active) setState({ status: user ? 'AUTHENTICATED' : 'UNAUTHENTICATED', user }); };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      revision++;
      if (initialized) apply(session?.user ?? null);
    });
    void (async () => {
      await supabase.auth.initialize();
      initialized = true;
      const atRead = revision;
      const result = await supabase.auth.getSession();
      if (revision === atRead) apply(result.data.session?.user ?? null);
    })().catch(() => { initialized = true; apply(null); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  return state;
}
