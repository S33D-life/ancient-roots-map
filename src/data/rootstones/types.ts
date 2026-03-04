export type Rootstone = {
  id: string;
  name: string;
  type: "tree" | "grove";
  country: string;
  region?: string;
  species?: string;
  location: { lat?: number; lng?: number; place?: string; mapsUrl?: string };
  bounds?: { north: number; south: number; east: number; west: number };
  lore: string;
  source: { name: string; url: string };
  confidence: "high" | "medium" | "low";
  tags: string[];
};
