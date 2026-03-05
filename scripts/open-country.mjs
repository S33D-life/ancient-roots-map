#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCountryBounds } from "./world-opening/adapters/countryBounds.mjs";
import { slugify } from "./world-opening/utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = path.resolve(__dirname, "../src/data/countries/registry.json");

const parseArgs = () =>
  Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const [key, value = "true"] = arg.split("=");
      return [key.replace(/^--/, ""), value];
    }),
  );

const main = async () => {
  const args = parseArgs();
  const country = String(args.country || "").toUpperCase();
  if (!country) {
    console.error("Usage: node scripts/open-country.mjs --country=CR");
    process.exit(1);
  }

  const bounds = await getCountryBounds(country);
  if (!bounds) {
    console.error(`Country bounds not found for ${country}. Add it to src/data/geo/countries.geojson first.`);
    process.exit(1);
  }

  const raw = await fs.readFile(REGISTRY_PATH, "utf8");
  const registry = JSON.parse(raw);

  const idx = registry.findIndex(
    (entry) => String(entry.country_code || "").toUpperCase() === country,
  );

  const next = {
    country_code: country,
    name: bounds.name,
    slug: slugify(bounds.name),
    center: [bounds.center.lat, bounds.center.lng],
    bbox: bounds.bbox,
    enabled: true,
    priority: 10,
    sources_enabled: ["natural-earth", "overpass", "wikidata", "wdpa", "gbif", "inat"],
    wikidata_qid: idx >= 0 ? registry[idx].wikidata_qid || null : null,
  };

  if (idx >= 0) {
    registry[idx] = { ...registry[idx], ...next, enabled: true };
  } else {
    registry.push(next);
  }

  registry.sort((a, b) => String(a.country_code).localeCompare(String(b.country_code)));
  await fs.writeFile(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`, "utf8");

  console.log(`Country ${country} opened in registry.`);
  console.log(`- name: ${bounds.name}`);
  console.log(`- center: ${bounds.center.lat}, ${bounds.center.lng}`);
  console.log(`- bbox: ${bounds.bbox.join(", ")}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
