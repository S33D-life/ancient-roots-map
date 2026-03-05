// Environment configuration — vars auto-injected by Lovable Cloud at build time
const REQUIRED_ENV_VARS = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"] as const;

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

const envValue = (name: RequiredEnvVar): string | undefined => {
  const value = import.meta.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
};

export const missingEnvVars: RequiredEnvVar[] = REQUIRED_ENV_VARS.filter((name) => !envValue(name));
export const hasMissingEnvVars = missingEnvVars.length > 0;

export const supabaseEnv = {
  url: envValue("VITE_SUPABASE_URL") ?? "https://missing-env.supabase.co",
  anonKey: envValue("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "missing-env-key",
};
