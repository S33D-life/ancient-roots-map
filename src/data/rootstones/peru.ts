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
  { place: "Manu National Park", region: "Cusco/Madre de Dios", lat: -12.257, lng: -71.765, source: { name: "SERNANP", url: "https://www.sernanp.gob.pe/" } },
  { place: "Huascarán National Park", region: "Áncash", lat: -9.3733, lng: -77.4575, source: { name: "SERNANP", url: "https://www.sernanp.gob.pe/" } },
  { place: "Tambopata National Reserve", region: "Madre de Dios", lat: -12.8304, lng: -69.2861, source: { name: "SERNANP", url: "https://www.sernanp.gob.pe/" } },
  { place: "Yanachaga-Chemillén National Park", region: "Pasco", lat: -10.5505, lng: -75.3049, source: { name: "SERNANP", url: "https://www.sernanp.gob.pe/" } },
  { place: "Pacaya Samiria National Reserve", region: "Loreto", lat: -4.6373, lng: -73.7894, source: { name: "SERNANP", url: "https://www.sernanp.gob.pe/" } },
  { place: "Río Abiseo National Park", region: "San Martín", lat: -7.734, lng: -77.3624, source: { name: "UNESCO", url: "https://whc.unesco.org/" } },
  { place: "Cordillera Azul National Park", region: "Ucayali", lat: -7.8704, lng: -75.9347, source: { name: "SERNANP", url: "https://www.sernanp.gob.pe/" } },
  { place: "Machu Picchu Historic Sanctuary", region: "Cusco", lat: -13.1631, lng: -72.545, source: { name: "UNESCO", url: "https://whc.unesco.org/" } },
  { place: "Amotape Hills National Park", region: "Tumbes/Piura", lat: -3.9, lng: -80.2, source: { name: "SERNANP", url: "https://www.sernanp.gob.pe/" } },
  { place: "Otishi National Park", region: "Junín/Cusco", lat: -12.1024, lng: -73.8938, source: { name: "SERNANP", url: "https://www.sernanp.gob.pe/" } },
  { place: "Alto Mayo Protection Forest", region: "San Martín", lat: -5.5753, lng: -77.2595, source: { name: "SERNANP", url: "https://www.sernanp.gob.pe/" } },
];

const treeSpecies = [
  { common: "Lupuna", scientific: "Ceiba samauma", confidence: "high" as const },
  { common: "Shihuahuaco", scientific: "Dipteryx micrantha", confidence: "medium" as const },
  { common: "Quina", scientific: "Cinchona officinalis", confidence: "medium" as const },
];

const groveKinds = ["Primary Forest Core", "Sacred Watershed Grove", "Conservation Buffer Forest"] as const;

const buildMapsUrl = (place: string, lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place} ${lat},${lng}`)}`;

export const ROOTSTONES_TREES: Rootstone[] = hubs.flatMap((hub) =>
  treeSpecies.map((sp, idx) => ({
    id: `pe-tree-${hub.place.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${idx + 1}`,
    name: `${sp.common} Record — ${hub.place}`,
    type: "tree",
    country: "Peru",
    region: hub.region,
    species: sp.scientific,
    location: {
      lat: Number((hub.lat + (idx - 1) * 0.03).toFixed(5)),
      lng: Number((hub.lng + (idx - 1) * 0.03).toFixed(5)),
      place: hub.place,
      mapsUrl: buildMapsUrl(hub.place, hub.lat, hub.lng),
    },
    lore: `${sp.common} references near ${hub.place}.\nMaintained as a research marker pending local verification and photos.`,
    source: hub.source,
    confidence: sp.confidence,
    tags: ["ancient", "research", idx === 0 ? "champion" : "needs_field_check"],
  })),
);

export const ROOTSTONES_GROVES: Rootstone[] = hubs.flatMap((hub) =>
  groveKinds.map((kind, idx) => ({
    id: `pe-grove-${hub.place.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${idx + 1}`,
    name: `${hub.place} — ${kind}`,
    type: "grove",
    country: "Peru",
    region: hub.region,
    location: {
      lat: hub.lat,
      lng: hub.lng,
      place: hub.place,
      mapsUrl: buildMapsUrl(hub.place, hub.lat, hub.lng),
    },
    bounds: {
      north: Number((hub.lat + 0.18 + idx * 0.01).toFixed(5)),
      south: Number((hub.lat - 0.18 - idx * 0.01).toFixed(5)),
      east: Number((hub.lng + 0.18 + idx * 0.01).toFixed(5)),
      west: Number((hub.lng - 0.18 - idx * 0.01).toFixed(5)),
    },
    lore: `${kind} associated with ${hub.place}.\nRepresents old-growth systems and culturally important forest corridors.`,
    source: hub.source,
    confidence: idx === 0 ? "high" : "medium",
    tags: ["grove", "forest", idx === 2 ? "needs_coords" : "research"],
  })),
);
