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
  { place: "Corcovado National Park", region: "Osa", lat: 8.5406, lng: -83.5796, source: { name: "SINAC", url: "https://www.sinac.go.cr/" } },
  { place: "Braulio Carrillo National Park", region: "Central", lat: 10.1473, lng: -84.1078, source: { name: "SINAC", url: "https://www.sinac.go.cr/" } },
  { place: "Monteverde Cloud Forest", region: "Puntarenas", lat: 10.3007, lng: -84.8125, source: { name: "Monteverde Conservation League", url: "https://www.cloudforestmonteverde.com/" } },
  { place: "Tortuguero National Park", region: "Limón", lat: 10.5439, lng: -83.502, source: { name: "SINAC", url: "https://www.sinac.go.cr/" } },
  { place: "Arenal Conservation Area", region: "Alajuela", lat: 10.4623, lng: -84.703, source: { name: "SINAC", url: "https://www.sinac.go.cr/" } },
  { place: "La Amistad International Park", region: "Talamanca", lat: 9.0712, lng: -82.923, source: { name: "UNESCO", url: "https://whc.unesco.org/" } },
  { place: "Santa Rosa National Park", region: "Guanacaste", lat: 10.8389, lng: -85.6148, source: { name: "SINAC", url: "https://www.sinac.go.cr/" } },
  { place: "Rincón de la Vieja", region: "Guanacaste", lat: 10.8315, lng: -85.3232, source: { name: "SINAC", url: "https://www.sinac.go.cr/" } },
  { place: "Manuel Antonio National Park", region: "Quepos", lat: 9.3908, lng: -84.1555, source: { name: "SINAC", url: "https://www.sinac.go.cr/" } },
  { place: "Carara National Park", region: "Tárcoles", lat: 9.7727, lng: -84.6055, source: { name: "SINAC", url: "https://www.sinac.go.cr/" } },
  { place: "Orosi Valley Forest Reserves", region: "Cartago", lat: 9.7964, lng: -83.8532, source: { name: "Costa Rica National Heritage System", url: "https://www.patrimonio.go.cr/" } },
];

const treeSpecies = [
  { common: "Ceiba", scientific: "Ceiba pentandra", confidence: "high" as const },
  { common: "Guanacaste", scientific: "Enterolobium cyclocarpum", confidence: "medium" as const },
  { common: "Almendro", scientific: "Dipteryx panamensis", confidence: "medium" as const },
];

const groveKinds = ["Primary Forest Core", "Watershed Grove", "Community Forest Patch"] as const;

const buildMapsUrl = (place: string, lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place} ${lat},${lng}`)}`;

export const ROOTSTONES_TREES: Rootstone[] = hubs.flatMap((hub) =>
  treeSpecies.map((sp, idx) => ({
    id: `cr-tree-${hub.place.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${idx + 1}`,
    name: `${sp.common} Sentinel — ${hub.place}`,
    type: "tree",
    country: "Costa Rica",
    region: hub.region,
    species: sp.scientific,
    location: {
      lat: Number((hub.lat + (idx - 1) * 0.02).toFixed(5)),
      lng: Number((hub.lng + (idx - 1) * 0.02).toFixed(5)),
      place: hub.place,
      mapsUrl: buildMapsUrl(hub.place, hub.lat, hub.lng),
    },
    lore: `${sp.common} records linked to ${hub.place}.\nSeeded as a research waypoint for future field verification.`,
    source: hub.source,
    confidence: sp.confidence,
    tags: ["ancient", "research", idx === 0 ? "champion" : "needs_field_check"],
  })),
);

export const ROOTSTONES_GROVES: Rootstone[] = hubs.flatMap((hub) =>
  groveKinds.map((kind, idx) => ({
    id: `cr-grove-${hub.place.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${idx + 1}`,
    name: `${hub.place} — ${kind}`,
    type: "grove",
    country: "Costa Rica",
    region: hub.region,
    location: {
      lat: hub.lat,
      lng: hub.lng,
      place: hub.place,
      mapsUrl: buildMapsUrl(hub.place, hub.lat, hub.lng),
    },
    bounds: {
      north: Number((hub.lat + 0.12 + idx * 0.01).toFixed(5)),
      south: Number((hub.lat - 0.12 - idx * 0.01).toFixed(5)),
      east: Number((hub.lng + 0.12 + idx * 0.01).toFixed(5)),
      west: Number((hub.lng - 0.12 - idx * 0.01).toFixed(5)),
    },
    lore: `${kind} within or adjacent to ${hub.place}.\nDesigned for mapping culturally significant forest systems, not only single trees.`,
    source: hub.source,
    confidence: idx === 0 ? "high" : "medium",
    tags: ["grove", "forest", idx === 2 ? "needs_coords" : "research"],
  })),
);
