import { isSupabaseConfigured, supabaseEnv } from "@/config/env";
import { supabase } from "@/integrations/supabase/client";

export type SpeciesVisionPrediction = {
  scientificName: string;
  commonName: string | null;
  confidence: number;
  source: "inaturalist" | "plantnet";
  sourceUrl: string;
};

export type SpeciesVisionResult = {
  predictions: SpeciesVisionPrediction[];
  provider: "inaturalist" | "plantnet" | "none";
  fallbackUsed: boolean;
  threshold: number;
  identifiedAt: string;
  rawSnapshot: string | null;
  error?: string;
};

const APP_ENDPOINT = "/api/identify-tree";
const SUPABASE_FALLBACK_ENDPOINT = supabaseEnv
  ? `${supabaseEnv.url}/functions/v1/identify-tree`
  : null;

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read image file"));
    reader.readAsDataURL(file);
  });

const normalizePrediction = (input: unknown): SpeciesVisionPrediction | null => {
  const row = (input ?? {}) as Record<string, unknown>;
  const scientificName = typeof row.scientificName === "string" ? row.scientificName.trim() : "";
  if (!scientificName) return null;

  const commonName = typeof row.commonName === "string" && row.commonName.trim().length > 0
    ? row.commonName.trim()
    : null;
  const rawConfidence = typeof row.confidence === "number" ? row.confidence : 0;
  const confidence = Math.max(0, Math.min(1, rawConfidence > 1 ? rawConfidence / 100 : rawConfidence));
  const source = row.source === "plantnet" ? "plantnet" : "inaturalist";
  const sourceUrl = typeof row.sourceUrl === "string"
    ? row.sourceUrl
    : SUPABASE_FALLBACK_ENDPOINT ?? APP_ENDPOINT;

  return { scientificName, commonName, confidence, source, sourceUrl };
};

export const identifyTreeSpeciesFromPhoto = async (file: File): Promise<SpeciesVisionResult> => {
  if (!isSupabaseConfigured) {
    return {
      predictions: [],
      provider: "none",
      fallbackUsed: false,
      threshold: 0.6,
      identifiedAt: new Date().toISOString(),
      rawSnapshot: null,
      error: "Species identification is unavailable until Supabase environment variables are configured.",
    };
  }

  try {
    const imageData = await fileToDataUrl(file);
    const { data: { session } } = await supabase.auth.getSession();

    const headers = {
      "Content-Type": "application/json",
      ...(supabaseEnv ? { apikey: supabaseEnv.anonKey } : {}),
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    };

    let payload: Record<string, unknown> | null = null;
    let lastError: Error | null = null;
    const endpoints = SUPABASE_FALLBACK_ENDPOINT
      ? [APP_ENDPOINT, SUPABASE_FALLBACK_ENDPOINT]
      : [APP_ENDPOINT];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({ imageData, topK: 3, threshold: 0.6 }),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `identify-tree failed (${response.status})`);
        }
        payload = (await response.json()) as Record<string, unknown>;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("identify-tree failed");
      }
    }
    if (!payload) {
      throw lastError ?? new Error("identify-tree failed");
    }

    const predictions = Array.isArray(payload?.predictions)
      ? payload.predictions
          .map(normalizePrediction)
          .filter((prediction): prediction is SpeciesVisionPrediction => prediction !== null)
          .slice(0, 3)
      : [];

    const provider =
      payload?.provider === "inaturalist" || payload?.provider === "plantnet"
        ? payload.provider
        : "none";

    return {
      predictions,
      provider,
      fallbackUsed: payload?.fallbackUsed === true,
      threshold: typeof payload?.threshold === "number" ? payload.threshold : 0.6,
      identifiedAt: typeof payload?.identifiedAt === "string" && payload.identifiedAt.length > 0
        ? payload.identifiedAt
        : new Date().toISOString(),
      rawSnapshot: typeof payload?.rawSnapshot === "string" ? payload.rawSnapshot : null,
    };
  } catch (error) {
    console.warn("[speciesVision] identifyTreeSpeciesFromPhoto failed:", error);
    return {
      predictions: [],
      provider: "none",
      fallbackUsed: false,
      threshold: 0.6,
      identifiedAt: new Date().toISOString(),
      rawSnapshot: null,
      error: error instanceof Error ? error.message : "Unable to identify species",
    };
  }
};
