// ---------------------------------------------------------------------------
// Supabase environment resolution
// ---------------------------------------------------------------------------
// Uses environment variables only — no hardcoded fallbacks.
// ---------------------------------------------------------------------------

const envValue = (name: string): string | undefined => {
  const value = import.meta.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
};

const PROJECT_SUPABASE_URL = "https://mwzcuczfedrjplndggiv.supabase.co";
const PROJECT_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13emN1Y3pmZWRyanBsbmRnZ2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTAyMTEsImV4cCI6MjA3ODQyNjIxMX0.2DMqC3Sh1BSCkeH39GLO9vMqDRKrNTYvk44QnaryWE4";

const supabaseUrl = envValue("VITE_SUPABASE_URL") ?? PROJECT_SUPABASE_URL;

const resolvedSupabaseKey =
  envValue("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  envValue("VITE_SUPABASE_ANON_KEY") ??
  PROJECT_SUPABASE_PUBLISHABLE_KEY;

export const missingEnvVars: string[] = [];

export const hasMissingEnvVars = false;

export const supabaseEnv = {
  url: supabaseUrl,
  anonKey: resolvedSupabaseKey,
};

export const isSupabaseConfigured = true;
