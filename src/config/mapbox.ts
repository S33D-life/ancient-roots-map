// Map configuration — uses MapLibre GL JS with free OpenStreetMap tiles.
// No API token required for the default style.
// Optional: set VITE_MAPTILER_KEY for higher-quality MapTiler vector tiles.

import type { StyleSpecification } from "maplibre-gl";

export const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '';

// Free style options (no API key needed)
export const FREE_STYLE: StyleSpecification = {
  version: 8,
  name: "Ancient Friends Atlas",
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>',
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#faf7f0",
      },
    },
    {
      id: "carto-tiles",
      type: "raster",
      source: "carto",
      minzoom: 0,
      maxzoom: 19,
      paint: {
        "raster-opacity": 1,
      },
    },
  ],
};

// If user provides a MapTiler key, use their outdoor style for a richer look
export function getMapStyle(): string | StyleSpecification {
  if (MAPTILER_KEY) {
    return `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`;
  }
  return FREE_STYLE;
}

// Re-export for backward compatibility
export { default as maplibregl } from "maplibre-gl";
