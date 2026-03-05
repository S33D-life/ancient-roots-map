export interface MapBBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface RootstoneLike {
  id: string;
  type: "tree" | "grove";
  tags: string[];
  country: string;
  location: {
    lat?: number;
    lng?: number;
  };
  bounds?: MapBBox;
}

export interface RootstoneMapOptions {
  countrySlug?: string;
  researchLayer?: "on" | "off";
  rootstones?: "on" | "off";
}

export const toSlug = (value: string) => value.toLowerCase().trim().replace(/\s+/g, "-");

export function buildRootstoneMapUrl(stone: RootstoneLike, options: RootstoneMapOptions = {}) {
  const params = new URLSearchParams();
  const countrySlug = options.countrySlug || toSlug(stone.country);

  params.set("rootstoneId", stone.id);
  params.set("rootstoneCountry", countrySlug);
  params.set("rootstoneType", stone.type);
  params.set("rootstoneTags", stone.tags.join(","));
  params.set("country", countrySlug);
  params.set("rootstones", options.rootstones ?? "on");
  params.set("research", options.researchLayer ?? "on");

  if (stone.bounds) {
    params.set("bbox", `${stone.bounds.south},${stone.bounds.west},${stone.bounds.north},${stone.bounds.east}`);
    params.set("lat", String((stone.bounds.north + stone.bounds.south) / 2));
    params.set("lng", String((stone.bounds.east + stone.bounds.west) / 2));
    params.set("zoom", "8");
  } else if (stone.location.lat != null && stone.location.lng != null) {
    params.set("lat", String(stone.location.lat));
    params.set("lng", String(stone.location.lng));
    params.set("zoom", stone.type === "tree" ? "12" : "9");
  }

  return `/map?${params.toString()}`;
}

export function buildAreaMapUrl(options: {
  countrySlug: string;
  lat?: number;
  lng?: number;
  zoom?: number;
  bbox?: MapBBox;
  researchLayer?: "on" | "off";
  rootstones?: "on" | "off";
  tags?: string[];
}) {
  const params = new URLSearchParams();
  params.set("country", options.countrySlug);
  if (options.lat != null) params.set("lat", String(options.lat));
  if (options.lng != null) params.set("lng", String(options.lng));
  if (options.zoom != null) params.set("zoom", String(options.zoom));
  if (options.researchLayer) params.set("research", options.researchLayer);
  if (options.rootstones) params.set("rootstones", options.rootstones);
  if (options.tags && options.tags.length > 0) params.set("tags", options.tags.join(","));
  if (options.bbox) {
    params.set("bbox", `${options.bbox.south},${options.bbox.west},${options.bbox.north},${options.bbox.east}`);
  }
  return `/map?${params.toString()}`;
}
