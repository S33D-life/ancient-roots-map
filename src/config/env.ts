// ---------------------------------------------------------------------------
// Supabase environment resolution
// ---------------------------------------------------------------------------
// Primary: build-time Vite env injection.
// Fallback: same-origin runtime config from a public backend function.
// No hardcoded URL/key values are committed in source.
// ---------------------------------------------------------------------------

const envValue = (name: string): string | undefined => {
  const value = import.meta.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
};

const supabaseUrl = envValue("VITE_SUPABASE_URL");

const resolvedSupabaseKey =
  envValue("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  envValue("VITE_SUPABASE_ANON_KEY");

export type SupabaseEnv = {
  url: string;
  anonKey: string;
};

const hasBuildTimeConfig = Boolean(supabaseUrl && resolvedSupabaseKey);

export const missingEnvVars: string[] = hasBuildTimeConfig
  ? []
  : ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"];

export const hasMissingEnvVars = missingEnvVars.length > 0;

export const supabaseEnv: SupabaseEnv | null = hasBuildTimeConfig
  ? {
      url: supabaseUrl!,
      anonKey: resolvedSupabaseKey!,
    }
  : null;

let runtimeEnvPromise: Promise<SupabaseEnv | null> | null = null;

const isValidSupabaseEnv = (value: unknown): value is SupabaseEnv => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return typeof candidate.url === "string"
    && candidate.url.startsWith("http")
    && typeof candidate.anonKey === "string"
    && candidate.anonKey.length > 20;
};

export const resolveSupabaseEnv = async (): Promise<SupabaseEnv | null> => {
  if (supabaseEnv) return supabaseEnv;
  if (runtimeEnvPromise) return runtimeEnvPromise;
  if (typeof window === "undefined") return null;

  // Build the direct Supabase edge-function URL from the project ID
  // VITE_SUPABASE_PROJECT_ID is always injected by the platform
  const projectId = envValue("VITE_SUPABASE_PROJECT_ID");
  const baseUrl = supabaseUrl ?? (projectId ? `https://${projectId}.supabase.co` : null);

  if (!baseUrl) {
    runtimeEnvPromise = Promise.resolve(null);
    return runtimeEnvPromise;
  }

  runtimeEnvPromise = fetch(`${baseUrl.replace(/\/+$/, "")}/functions/v1/public-runtime-config`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-store",
    },
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) return null;
      const payload = await response.json();
      return isValidSupabaseEnv(payload) ? payload : null;
    })
    .catch(() => null);

  return runtimeEnvPromise;
};

export const isSupabaseConfigured = true;
