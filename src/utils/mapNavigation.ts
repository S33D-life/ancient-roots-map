type NavigateLike = (to: string, options?: { replace?: boolean }) => void;

export interface GoToTreeOnMapOptions {
  treeId: string;
  lat?: number | null;
  lng?: number | null;
  zoom?: number;
  source?: string;
  countrySlug?: string;
  researchLayer?: "on" | "off";
  tags?: string[];
  w3w?: string;
  journey?: boolean;
}

const isFiniteNumber = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function buildTreeMapUrl(options: GoToTreeOnMapOptions): string {
  const params = new URLSearchParams();
  params.set("tree", options.treeId);
  // Backward compatibility for existing map readers.
  params.set("treeId", options.treeId);

  if (isFiniteNumber(options.lat) && isFiniteNumber(options.lng)) {
    params.set("lat", String(options.lat));
    params.set("lng", String(options.lng));
  }

  params.set("zoom", String(options.zoom ?? 17));
  params.set("arrival", options.source || "tree");
  params.set("journey", options.journey === false ? "0" : "1");

  if (options.countrySlug) {
    params.set("country", options.countrySlug);
  }
  if (options.researchLayer) {
    params.set("research", options.researchLayer);
  }
  if (options.tags && options.tags.length > 0) {
    params.set("tags", options.tags.join(","));
  }
  if (options.w3w) {
    params.set("w3w", options.w3w);
  }

  return `/map?${params.toString()}`;
}

export function goToTreeOnMap(
  navigate: NavigateLike,
  options: GoToTreeOnMapOptions & { replace?: boolean },
) {
  navigate(buildTreeMapUrl(options), options.replace ? { replace: true } : undefined);
}

export function getTreeIdFromMapParams(params: URLSearchParams): string | null {
  return params.get("tree") || params.get("treeId");
}
