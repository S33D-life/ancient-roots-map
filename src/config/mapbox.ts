// Map configuration — uses MapLibre GL JS with free OpenStreetMap tiles.
// No API token required for the default style.
// Optional: set VITE_MAPTILER_KEY for higher-quality MapTiler vector tiles.

import type { StyleSpecification } from "maplibre-gl";

export const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '';

// Preserve source/layer IDs for consumers; only the provider URL changes.
export function getRasterBasemapStyle(cartoKey?: string): StyleSpecification {
  const key = cartoKey?.trim();
  return {
  version: 8,
  name: "Ancient Friends Atlas",
  sources: {
    carto: {
      type: "raster",
      tiles: key
        ? ["a", "b", "c"].map(host => `https://${host}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${encodeURIComponent(key)}`)
        : ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        + (key ? ' &copy; <a href="https://carto.com/attributions">CARTO</a>' : ''),
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
}

export const FREE_STYLE = getRasterBasemapStyle(import.meta.env.VITE_CARTO_BASEMAP_API_KEY);

// If user provides a MapTiler key, use their outdoor style for a richer look
export function getMapStyle(): string | StyleSpecification {
  if (MAPTILER_KEY) {
    return `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`;
  }
  return FREE_STYLE;
}

// Re-export for backward compatibility
export { default as maplibregl } from "maplibre-gl";
