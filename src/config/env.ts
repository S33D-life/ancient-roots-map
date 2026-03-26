// ---------------------------------------------------------------------------
// Supabase environment resolution
// ---------------------------------------------------------------------------
// Lovable Cloud provides VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
// via the auto-managed .env file.  However, if the build pipeline ever fails
// to inject them (e.g. first publish, CI edge-case) we fall back to the known
// project credentials.  The anon/publishable key is safe to embed in
// client-side code — it carries no elevated privileges.
// ---------------------------------------------------------------------------

const FALLBACK_SUPABASE_URL = "https://mwzcuczfedrjplndggiv.supabase.co";
const FALLBACK_SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13emN1Y3pmZWRyanBsbmRnZ2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTAyMTEsImV4cCI6MjA3ODQyNjIxMX0.2DMqC3Sh1BSCkeH39GLO9vMqDRKrNTYvk44QnaryWE4";

const envValue = (name: string): string | undefined => {
  const value = import.meta.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
};

const supabaseUrl =
  envValue("VITE_SUPABASE_URL") ?? FALLBACK_SUPABASE_URL;

const resolvedSupabaseKey =
  envValue("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  envValue("VITE_SUPABASE_ANON_KEY") ??
  FALLBACK_SUPABASE_KEY;

export const missingEnvVars: string[] = [];

export const hasMissingEnvVars = false;

export const supabaseEnv = {
  url: supabaseUrl,
  anonKey: resolvedSupabaseKey,
};

export const isSupabaseConfigured = true;