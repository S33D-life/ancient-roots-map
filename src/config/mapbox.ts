// Map configuration — uses MapLibre GL JS with free OpenStreetMap tiles.
// No API token required for the default style.
// Optional: set VITE_MAPTILER_KEY for higher-quality MapTiler vector tiles.

export const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '';

// Free style options (no API key needed)
export const FREE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  name: "Ancient Friends Atlas",
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// If user provides a MapTiler key, use their outdoor style for a richer look
export function getMapStyle(): string | maplibregl.StyleSpecification {
  if (MAPTILER_KEY) {
    return `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`;
  }
  return FREE_STYLE;
}

// Re-export for backward compatibility
import maplibregl from "maplibre-gl";
export { maplibregl };
