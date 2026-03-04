import type { Rootstone } from "./types";
export type { Rootstone } from "./types";

type Hub = {
  place: string;
  region: string;
  lat: number;
  lng: number;
  source: { name: string; url: string };
};

const hubs: Hub[] = [
  { place: "Gunung Leuser National Park", region: "Sumatra", lat: 3.75, lng: 97.6, source: { name: "KLHK", url: "https://www.menlhk.go.id/" } },
  { place: "Kerinci Seblat National Park", region: "Sumatra", lat: -1.7044, lng: 101.264, source: { name: "KLHK", url: "https://www.menlhk.go.id/" } },
  { place: "Bukit Barisan Selatan National Park", region: "Sumatra", lat: -5.391, lng: 104.194, source: { name: "UNESCO", url: "https://whc.unesco.org/" } },
  { place: "Ujung Kulon National Park", region: "Java", lat: -6.768, lng: 105.395, source: { name: "UNESCO", url: "https://whc.unesco.org/" } },
  { place: "Bromo Tengger Semeru National Park", region: "Java", lat: -8.02, lng: 112.95, source: { name: "KLHK", url: "https://www.menlhk.go.id/" } },
  { place: "Baluran National Park", region: "East Java", lat: -7.85, lng: 114.37, source: { name: "KLHK", url: "https://www.menlhk.go.id/" } },
  { place: "Komodo National Park", region: "Nusa Tenggara", lat: -8.58, lng: 119.49, source: { name: "UNESCO", url: "https://whc.unesco.org/" } },
  { place: "Lore Lindu National Park", region: "Sulawesi", lat: -1.33, lng: 120.06, source: { name: "KLHK", url: "https://www.menlhk.go.id/" } },
  { place: "Tanjung Puting National Park", region: "Kalimantan", lat: -2.88, lng: 111.96, source: { name: "KLHK", url: "https://www.menlhk.go.id/" } },
  { place: "Wasur National Park", region: "Papua", lat: -8.25, lng: 140.55, source: { name: "KLHK", url: "https://www.menlhk.go.id/" } },
  { place: "Lorentz National Park", region: "Papua", lat: -4.95, lng: 137.95, source: { name: "UNESCO", url: "https://whc.unesco.org/" } },
];

const treeSpecies = [
  { common: "Meranti", scientific: "Shorea leprosula", confidence: "high" as const },
  { common: "Banyan", scientific: "Ficus benjamina", confidence: "medium" as const },
  { common: "Ulin", scientific: "Eusideroxylon zwageri", confidence: "medium" as const },
];

const groveKinds = ["Primary Forest Core", "Sacred Grove Network", "Conservation Rainforest Belt"] as const;

const buildMapsUrl = (place: string, lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place} ${lat},${lng}`)}`;

export const ROOTSTONES_TREES: Rootstone[] = hubs.flatMap((hub) =>
  treeSpecies.map((sp, idx) => ({
    id: `id-tree-${hub.place.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${idx + 1}`,
    name: `${sp.common} Elder — ${hub.place}`,
    type: "tree",
    country: "Indonesia",
    region: hub.region,
    species: sp.scientific,
    location: {
      lat: Number((hub.lat + (idx - 1) * 0.04).toFixed(5)),
      lng: Number((hub.lng + (idx - 1) * 0.04).toFixed(5)),
      place: hub.place,
      mapsUrl: buildMapsUrl(hub.place, hub.lat, hub.lng),
    },
    lore: `${sp.common} records associated with ${hub.place}.\nMaintained as rootstone references for future on-site verification.`,
    source: hub.source,
    confidence: sp.confidence,
    tags: ["ancient", "research", idx === 0 ? "champion" : "needs_field_check"],
  })),
);

export const ROOTSTONES_GROVES: Rootstone[] = hubs.flatMap((hub) =>
  groveKinds.map((kind, idx) => ({
    id: `id-grove-${hub.place.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${idx + 1}`,
    name: `${hub.place} — ${kind}`,
    type: "grove",
    country: "Indonesia",
    region: hub.region,
    location: {
      lat: hub.lat,
      lng: hub.lng,
      place: hub.place,
      mapsUrl: buildMapsUrl(hub.place, hub.lat, hub.lng),
    },
    bounds: {
      north: Number((hub.lat + 0.25 + idx * 0.01).toFixed(5)),
      south: Number((hub.lat - 0.25 - idx * 0.01).toFixed(5)),
      east: Number((hub.lng + 0.25 + idx * 0.01).toFixed(5)),
      west: Number((hub.lng - 0.25 - idx * 0.01).toFixed(5)),
    },
    lore: `${kind} represented around ${hub.place}.\nTracks culturally and ecologically significant forest systems across the archipelago.`,
    source: hub.source,
    confidence: idx === 0 ? "high" : "medium",
    tags: ["grove", "forest", idx === 2 ? "needs_coords" : "research"],
  })),
);
