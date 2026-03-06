// Environment configuration — vars auto-injected by Lovable Cloud at build time
const REQUIRED_ENV_VARS = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"] as const;

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

const envValue = (name: RequiredEnvVar): string | undefined => {
  const value = import.meta.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
};

// Also accept the common ANON_KEY alias used by some Supabase setups
const resolvedKey =
  envValue("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

const resolvedUrl = envValue("VITE_SUPABASE_URL");

/** True when the runtime has real Supabase credentials */
export const hasSupabaseEnv = !!(resolvedUrl && resolvedKey);

export const missingEnvVars: RequiredEnvVar[] = REQUIRED_ENV_VARS.filter((name) => !envValue(name));
export const hasMissingEnvVars = !hasSupabaseEnv;

export const supabaseEnv = {
  url: resolvedUrl ?? "https://mwzcuczfedrjplndggiv.supabase.co",
  anonKey: resolvedKey ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13emN1Y3pmZWRyanBsbmRnZ2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTAyMTEsImV4cCI6MjA3ODQyNjIxMX0.2DMqC3Sh1BSCkeH39GLO9vMqDRKrNTYvk44QnaryWE4",
};
