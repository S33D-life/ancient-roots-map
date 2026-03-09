const envValue = (name: string): string | undefined => {
  const value = import.meta.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
};

const supabaseUrl = envValue("VITE_SUPABASE_URL");
const supabasePublishableKey = envValue("VITE_SUPABASE_PUBLISHABLE_KEY");
const supabaseAnonKey = envValue("VITE_SUPABASE_ANON_KEY");
const resolvedSupabaseKey = supabasePublishableKey ?? supabaseAnonKey;

export const missingEnvVars = [
  ...(supabaseUrl ? [] : ["VITE_SUPABASE_URL"]),
  ...(resolvedSupabaseKey ? [] : ["VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY"]),
];

export const hasMissingEnvVars = missingEnvVars.length > 0;

export const supabaseEnv = supabaseUrl && resolvedSupabaseKey
  ? {
      url: supabaseUrl,
      anonKey: resolvedSupabaseKey,
    }
  : null;

export const isSupabaseConfigured = supabaseEnv !== null;
