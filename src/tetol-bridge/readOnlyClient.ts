/**
 * Read-only, session-less Supabase client for TETOL.
 *
 * Deliberately NOT the app singleton (src/integrations/supabase/client.ts):
 *   - persistSession / autoRefreshToken off → never reads or refreshes a
 *     Wanderer's stored session, so TETOL cannot disturb the production auth lane;
 *   - detectSessionInUrl off → cannot consume an /auth/callback fragment that the
 *     main app is still parsing (the current iPhone/PWA auth investigation);
 *   - separate storageKey → no shared localStorage entry even if enabled later.
 *
 * It holds only the public anon key, so every request is subject to RLS as `anon`.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabaseEnv } from "@/config/env";

export type S33DReadClient = SupabaseClient<Database>;

export const TETOL_READONLY_AUTH_OPTIONS = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
  storageKey: "s33d-tetol-readonly",
} as const;

export function createReadOnlyClient(
  url: string = supabaseEnv.url,
  anonKey: string = supabaseEnv.anonKey,
): S33DReadClient {
  return createClient<Database>(url, anonKey, {
    auth: { ...TETOL_READONLY_AUTH_OPTIONS },
    global: { headers: { "x-client-info": "s33d-tetol-bridge" } },
  });
}
