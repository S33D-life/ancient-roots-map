import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEOJSON_PATH = path.resolve(__dirname, "../../../src/data/geo/countries.geojson");

let cached = null;

const loadGeoJson = async () => {
  if (cached) return cached;
  const raw = await fs.readFile(GEOJSON_PATH, "utf8");
  cached = JSON.parse(raw);
  return cached;
};

const bboxFromFeature = (feature) => {
  const propBbox = feature?.properties?.bbox;
  if (Array.isArray(propBbox) && propBbox.length === 4) return propBbox;

  const coords = feature?.geometry?.coordinates;
  if (!Array.isArray(coords)) return null;

  const points = [];
  const walk = (node) => {
    if (!Array.isArray(node)) return;
    if (node.length >= 2 && typeof node[0] === "number" && typeof node[1] === "number") {
      points.push(node);
      return;
    }
    node.forEach(walk);
  };
  walk(coords);
  if (points.length === 0) return null;

  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  for (const [lng, lat] of points) {
    west = Math.min(west, lng);
    east = Math.max(east, lng);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }
  return [south, west, north, east];
};

export const getCountryFeature = async (countryCode) => {
  const data = await loadGeoJson();
  const code = String(countryCode || "").toUpperCase();
  return (data.features || []).find(
    (f) => String(f?.properties?.iso2 || "").toUpperCase() === code,
  );
};

export const getCountryBounds = async (countryCode) => {
  const feature = await getCountryFeature(countryCode);
  if (!feature) return null;

  const bbox = bboxFromFeature(feature);
  if (!bbox) return null;

  const propCenter = feature?.properties?.center;
  const center = Array.isArray(propCenter) && propCenter.length === 2
    ? { lat: Number(propCenter[0]), lng: Number(propCenter[1]) }
    : { lat: (bbox[0] + bbox[2]) / 2, lng: (bbox[1] + bbox[3]) / 2 };

  return {
    country_code: String(feature.properties.iso2 || "").toUpperCase(),
    name: String(feature.properties.name || ""),
    bbox,
    center,
    feature,
  };
};
