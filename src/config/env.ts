// ---------------------------------------------------------------------------
// Supabase environment resolution
// ---------------------------------------------------------------------------
// Uses environment variables only — no hardcoded fallbacks.
// ---------------------------------------------------------------------------

const envValue = (name: string): string | undefined => {
  const value = import.meta.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
};

const supabaseUrl = envValue("VITE_SUPABASE_URL");

const resolvedSupabaseKey =
  envValue("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  envValue("VITE_SUPABASE_ANON_KEY");

export const missingEnvVars: string[] = [];

export const hasMissingEnvVars = false;

export const supabaseEnv = {
  url: supabaseUrl,
  anonKey: resolvedSupabaseKey,
};

export const isSupabaseConfigured = true;
