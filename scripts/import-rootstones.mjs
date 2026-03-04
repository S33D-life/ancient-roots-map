#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const REQUIRED_FIELDS = ["name", "type", "country", "lore", "source_name", "source_url", "confidence"];
const ALLOWED_TYPES = new Set(["tree", "grove"]);
const ALLOWED_CONFIDENCE = new Set(["high", "medium", "low"]);

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseCSV = (text) => {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell);
      if (row.some((value) => value.trim().length > 0)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += ch;
  }

  row.push(cell);
  if (row.some((value) => value.trim().length > 0)) rows.push(row);

  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((values) => {
    const record = {};
    headers.forEach((header, idx) => {
      record[header] = (values[idx] ?? "").trim();
    });
    return record;
  });
};

const parseInput = async (inputPath) => {
  const raw = await fs.readFile(inputPath, "utf8");
  if (inputPath.endsWith(".json")) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.rootstones)) return parsed.rootstones;
    throw new Error("JSON input must be an array or an object with `rootstones` array");
  }

  if (inputPath.endsWith(".csv")) {
    return parseCSV(raw);
  }

  throw new Error("Input file must be .csv or .json");
};

const toOptionalNumber = (value) => {
  if (value == null || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const normalizeTags = (value) =>
  String(value || "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .filter((tag, idx, all) => all.indexOf(tag) === idx);

const ensureLocation = (row) => {
  const lat = toOptionalNumber(row.lat);
  const lng = toOptionalNumber(row.lng);
  const place = String(row.place || "").trim() || undefined;
  const mapsUrl = String(row.mapsUrl || row.maps_url || "").trim() || undefined;

  const hasCoords = lat != null && lng != null;
  const hasPlaceData = Boolean(place || mapsUrl);

  if (!hasCoords && !hasPlaceData) {
    throw new Error("must include either lat+lng or place/mapsUrl");
  }

  return { lat, lng, place, mapsUrl, hasCoords };
};

const normalizeBounds = (row) => {
  const north = toOptionalNumber(row.bounds_north);
  const south = toOptionalNumber(row.bounds_south);
  const east = toOptionalNumber(row.bounds_east);
  const west = toOptionalNumber(row.bounds_west);

  if ([north, south, east, west].every((v) => v != null)) {
    return { north, south, east, west };
  }

  return undefined;
};

const countBy = (items, getKey) =>
  items.reduce((acc, item) => {
    const key = getKey(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

const main = async () => {
  const inputArg = process.argv[2];
  if (!inputArg) {
    console.error("Usage: node scripts/import-rootstones.mjs <input.csv|input.json>");
    process.exit(1);
  }

  const repoRoot = process.cwd();
  const inputPath = path.resolve(repoRoot, inputArg);
  const rows = await parseInput(inputPath);

  const errors = [];
  const warnings = [];
  const seenIds = new Set();
  const seenFallbackKeys = new Set();
  const normalized = [];

  rows.forEach((row, idx) => {
    const line = idx + 2;

    try {
      for (const field of REQUIRED_FIELDS) {
        if (!String(row[field] || "").trim()) {
          throw new Error(`missing required field: ${field}`);
        }
      }

      const type = String(row.type || "").trim().toLowerCase();
      if (!ALLOWED_TYPES.has(type)) {
        throw new Error(`invalid type: ${row.type}`);
      }

      const confidence = String(row.confidence || "").trim().toLowerCase();
      if (!ALLOWED_CONFIDENCE.has(confidence)) {
        throw new Error(`invalid confidence: ${row.confidence}`);
      }

      const country = String(row.country || "").trim();
      const countrySlug = slugify(country);
      const name = String(row.name || "").trim();
      const nameSlug = slugify(name);
      const id = String(row.id || "").trim() || `${countrySlug}-${type}-${nameSlug}`;

      const dedupKey = `${country.toLowerCase()}::${type}::${name.toLowerCase()}`;
      if (seenIds.has(id) || seenFallbackKeys.has(dedupKey)) {
        warnings.push(`line ${line}: skipped duplicate (${id})`);
        return;
      }

      const sourceName = String(row.source_name || "").trim();
      const sourceUrl = String(row.source_url || "").trim();
      if (!sourceUrl) {
        throw new Error("missing source_url");
      }

      const { lat, lng, place, mapsUrl, hasCoords } = ensureLocation(row);
      const bounds = normalizeBounds(row);
      const tags = normalizeTags(row.tags);

      if (!hasCoords) {
        warnings.push(`line ${line}: missing coords; tag needs_coords added`);
        if (!tags.includes("needs_coords")) tags.push("needs_coords");
      }

      const rootstone = {
        id,
        name,
        type,
        country,
        region: String(row.region || "").trim() || undefined,
        species: String(row.species || "").trim() || undefined,
        location: {
          lat,
          lng,
          place,
          mapsUrl,
        },
        bounds,
        lore: String(row.lore || "").trim(),
        source: {
          name: sourceName,
          url: sourceUrl,
        },
        confidence,
        tags,
      };

      seenIds.add(id);
      seenFallbackKeys.add(dedupKey);
      normalized.push(rootstone);
    } catch (error) {
      errors.push(`line ${line}: ${error.message}`);
    }
  });

  if (errors.length > 0) {
    console.error("Import failed with validation errors:\n");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  const outputDir = path.join(repoRoot, "src", "data", "rootstones", "generated");
  await fs.mkdir(outputDir, { recursive: true });

  const byCountry = normalized.reduce((acc, stone) => {
    const key = slugify(stone.country);
    acc[key] = acc[key] || [];
    acc[key].push(stone);
    return acc;
  }, {});

  for (const [countrySlug, stones] of Object.entries(byCountry)) {
    const outputPath = path.join(outputDir, `${countrySlug}.json`);
    await fs.writeFile(
      outputPath,
      `${JSON.stringify({ country: stones[0].country, rootstones: stones }, null, 2)}\n`,
      "utf8",
    );
  }

  const confidenceCounts = countBy(normalized, (stone) => stone.confidence);
  const missingCoords = normalized.filter((stone) => !(stone.location.lat != null && stone.location.lng != null)).length;
  const tagCounts = countBy(normalized.flatMap((stone) => stone.tags), (tag) => tag);
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => `${tag}(${count})`)
    .join(", ");

  console.log("Rootstone import complete");
  console.log(`- total imported: ${normalized.length}`);
  console.log(`- confidence counts: high=${confidenceCounts.high || 0}, medium=${confidenceCounts.medium || 0}, low=${confidenceCounts.low || 0}`);
  console.log(`- missing coords: ${missingCoords}`);
  console.log(`- top tags: ${topTags || "none"}`);

  if (warnings.length > 0) {
    console.log("- warnings:");
    warnings.forEach((warning) => console.log(`  - ${warning}`));
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
