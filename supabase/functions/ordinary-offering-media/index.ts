import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { ordinaryMediaHandler } from '../_shared/ordinaryOfferingMedia.ts';

Deno.serve(req => {
  const projectUrl = Deno.env.get('SUPABASE_URL')!;
  const authorization = req.headers.get('Authorization') ?? '';
  const caller = createClient(projectUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return ordinaryMediaHandler({
    authenticated: async () => {
      if (!authorization.startsWith('Bearer ')) return false;
      const { data, error } = await caller.auth.getUser();
      return !error && !!data.user;
    },
    read: async id => {
      const { data, error } = await caller.from('offerings')
        .select('created_by,tree_id,media_url,photos,thumbnail_url').eq('id', id).maybeSingle();
      return { row: data, error };
    },
    sign: async (path, expires) => {
      const admin = createClient(projectUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await admin.storage.from('offerings-private').createSignedUrl(path, expires);
      return error ? null : data?.signedUrl ?? null;
    },
  }, projectUrl)(req);
});
