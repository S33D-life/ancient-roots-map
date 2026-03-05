interface SpeciesPrediction {
  scientificName: string;
  commonName: string | null;
  confidence: number;
  source: "inaturalist" | "plantnet";
  sourceUrl: string;
}

interface SpeciesVisionResult {
  predictions: SpeciesPrediction[];
  provider: "inaturalist" | "plantnet" | "none";
  fallbackUsed: boolean;
  threshold: number;
  identifiedAt: string;
  rawSnapshot: string | null;
}

interface IdentifyTreeSpeciesParams {
  imageData: string;
  topK?: number;
  threshold?: number;
}

const INATURALIST_ENDPOINT =
  Deno.env.get("INATURALIST_VISION_URL") || "https://api.inaturalist.org/v1/computervision/score_image";
const PLANTNET_BASE_URL = Deno.env.get("PLANTNET_API_BASE_URL") || "https://my-api.plantnet.org/v2/identify/all";

const clampConfidence = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  const normalized = value > 1 ? value / 100 : value;
  return Math.max(0, Math.min(1, normalized));
};

const compactSnapshot = (payload: unknown): string | null => {
  try {
    const text = JSON.stringify(payload);
    if (!text) return null;
    return text.length > 1600 ? `${text.slice(0, 1600)}…` : text;
  } catch {
    return null;
  }
};

const toImageBlob = (imageData: string): Blob => {
  const parts = imageData.split(",", 2);
  if (parts.length !== 2 || !parts[0].startsWith("data:")) {
    throw new Error("imageData must be a valid data URL");
  }
  const mimeMatch = parts[0].match(/^data:([^;]+);base64$/i);
  const mime = mimeMatch?.[1] || "image/jpeg";
  const bytes = Uint8Array.from(atob(parts[1]), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: mime });
};

const normalizeINaturalist = (payload: unknown): SpeciesPrediction[] => {
  const data = payload as { results?: Array<Record<string, unknown>> };
  if (!Array.isArray(data?.results)) return [];

  return data.results
    .map((item) => {
      const taxon = (item?.taxon || {}) as Record<string, unknown>;
      const scientificName =
        (typeof taxon.name === "string" && taxon.name.trim()) ||
        (typeof taxon.scientific_name === "string" && taxon.scientific_name.trim()) ||
        "";
      if (!scientificName) return null;

      const commonName =
        (typeof taxon.preferred_common_name === "string" && taxon.preferred_common_name.trim()) ||
        (typeof taxon.english_common_name === "string" && taxon.english_common_name.trim()) ||
        null;
      const rawConfidence =
        typeof item.combined_score === "number"
          ? item.combined_score
          : typeof item.score === "number"
            ? item.score
            : 0;

      return {
        scientificName,
        commonName,
        confidence: clampConfidence(rawConfidence),
        source: "inaturalist" as const,
        sourceUrl: INATURALIST_ENDPOINT,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => b.confidence - a.confidence) as SpeciesPrediction[];
};

const normalizePlantNet = (payload: unknown, sourceUrl: string): SpeciesPrediction[] => {
  const data = payload as { results?: Array<Record<string, unknown>> };
  if (!Array.isArray(data?.results)) return [];

  return data.results
    .map((item) => {
      const species = (item?.species || {}) as Record<string, unknown>;
      const scientificName =
        (typeof species.scientificNameWithoutAuthor === "string" && species.scientificNameWithoutAuthor.trim()) ||
        (typeof species.scientificName === "string" && species.scientificName.trim()) ||
        "";
      if (!scientificName) return null;

      const commonNames = Array.isArray(species.commonNames) ? species.commonNames : [];
      const firstCommonName =
        commonNames.find((value): value is string => typeof value === "string" && value.trim().length > 0) || null;

      return {
        scientificName,
        commonName: firstCommonName,
        confidence: clampConfidence(typeof item.score === "number" ? item.score : 0),
        source: "plantnet" as const,
        sourceUrl,
      };
    })
    .filter((prediction): prediction is SpeciesPrediction => prediction !== null)
    .sort((a, b) => b.confidence - a.confidence);
};

const identifyWithINaturalist = async (blob: Blob): Promise<{ predictions: SpeciesPrediction[]; rawSnapshot: string | null }> => {
  const file = new File([blob], "tree.jpg", { type: blob.type || "image/jpeg" });
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(INATURALIST_ENDPOINT, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`iNaturalist identify failed (${response.status})`);
  }

  const payload = await response.json();
  return {
    predictions: normalizeINaturalist(payload),
    rawSnapshot: compactSnapshot(payload),
  };
};

const identifyWithPlantNet = async (blob: Blob, topK: number): Promise<{ predictions: SpeciesPrediction[]; rawSnapshot: string | null }> => {
  const apiKey = Deno.env.get("PLANTNET_API_KEY");
  if (!apiKey) return { predictions: [], rawSnapshot: null };

  const file = new File([blob], "tree.jpg", { type: blob.type || "image/jpeg" });
  const formData = new FormData();
  formData.append("images", file);
  formData.append("organs", "auto");

  const sourceUrl = `${PLANTNET_BASE_URL}?api-key=${encodeURIComponent(apiKey)}&nb-results=${topK}`;
  const response = await fetch(sourceUrl, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`PlantNet identify failed (${response.status})`);
  }

  const payload = await response.json();
  return {
    predictions: normalizePlantNet(payload, PLANTNET_BASE_URL),
    rawSnapshot: compactSnapshot(payload),
  };
};

export const identifyTreeSpecies = async ({
  imageData,
  topK = 3,
  threshold = 0.6,
}: IdentifyTreeSpeciesParams): Promise<SpeciesVisionResult> => {
  const safeTopK = Math.max(1, Math.min(3, topK));
  const blob = toImageBlob(imageData);
  const identifiedAt = new Date().toISOString();

  let inatPredictions: SpeciesPrediction[] = [];
  let plantNetPredictions: SpeciesPrediction[] = [];
  let inatSnapshot: string | null = null;
  let plantnetSnapshot: string | null = null;

  try {
    const result = await identifyWithINaturalist(blob);
    inatPredictions = result.predictions;
    inatSnapshot = result.rawSnapshot;
  } catch (error) {
    console.warn("[speciesVision] iNaturalist identify failed:", error);
  }

  const topINatConfidence = inatPredictions[0]?.confidence ?? 0;
  const shouldFallback = topINatConfidence < threshold;

  if (shouldFallback) {
    try {
      const result = await identifyWithPlantNet(blob, safeTopK);
      plantNetPredictions = result.predictions;
      plantnetSnapshot = result.rawSnapshot;
    } catch (error) {
      console.warn("[speciesVision] PlantNet identify failed:", error);
    }
  }

  if (plantNetPredictions.length > 0) {
    return {
      predictions: plantNetPredictions.slice(0, safeTopK),
      provider: "plantnet",
      fallbackUsed: true,
      threshold,
      identifiedAt,
      rawSnapshot: plantnetSnapshot,
    };
  }

  if (inatPredictions.length > 0) {
    return {
      predictions: inatPredictions.slice(0, safeTopK),
      provider: "inaturalist",
      fallbackUsed: false,
      threshold,
      identifiedAt,
      rawSnapshot: inatSnapshot,
    };
  }

  return {
    predictions: [],
    provider: "none",
    fallbackUsed: shouldFallback,
    threshold,
    identifiedAt,
    rawSnapshot: plantnetSnapshot || inatSnapshot,
  };
};
