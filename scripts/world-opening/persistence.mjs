import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { haversineMeters, makeId, normalizeName, nowIso } from "./utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GENERATED_DIR = path.resolve(__dirname, "../../src/data/countries/generated");
const BATCHES_DIR = path.join(GENERATED_DIR, "batches");

const loadJson = async (filePath, fallback) => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const sourceUrl = (node) => node?.sources?.[0]?.url || "";

const sameNode = (a, b) => {
  const sameType = a.type === b.type;
  const sameCountry = String(a.country_code || "").toUpperCase() === String(b.country_code || "").toUpperCase();
  if (!sameType || !sameCountry) return false;

  const aName = normalizeName(a.name);
  const bName = normalizeName(b.name);
  const namesMatch = aName === bName;
  const distance = haversineMeters({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng });
  const near = Number.isFinite(distance) && distance <= 50;
  const sameSource = sourceUrl(a) && sourceUrl(a) === sourceUrl(b);

  return (namesMatch && near) || (namesMatch && sameSource) || (sameSource && near);
};

export const makeBatchId = (countryCode) =>
  `seed-${String(countryCode || "").toUpperCase()}-${makeId(nowIso(), Math.random().toString(36).slice(2))}`;

export const loadCountrySeed = async (countryCode) => {
  const filePath = path.join(GENERATED_DIR, `${String(countryCode).toUpperCase()}.seed-country.json`);
  const data = await loadJson(filePath, null);
  return {
    filePath,
    data:
      data ||
      {
        country_code: String(countryCode || "").toUpperCase(),
        generated_at: null,
        imported_batch_id: null,
        nodes: [],
      },
  };
};

export const mergeNodesIdempotent = (existingNodes, incomingNodes, batchId) => {
  const merged = [...(existingNodes || [])];
  let inserted = 0;
  let touched = 0;

  for (const candidate of incomingNodes) {
    const hit = merged.find((node) => sameNode(node, candidate));
    if (!hit) {
      merged.push(candidate);
      inserted += 1;
      continue;
    }

    // Never overwrite verified/user content.
    if (hit.status === "verified" || hit.created_by === "user") continue;

    hit.last_seen_at = candidate.last_seen_at;
    hit.imported_batch_id = batchId;
    hit.tags = Array.from(new Set([...(hit.tags || []), ...(candidate.tags || [])]));
    if (Array.isArray(candidate.sources)) {
      const existingUrls = new Set((hit.sources || []).map((s) => s.url));
      for (const source of candidate.sources) {
        if (!existingUrls.has(source.url)) hit.sources.push(source);
      }
    }
    touched += 1;
  }

  return { merged, inserted, touched };
};

export const saveCountrySeed = async ({ countryCode, batchId, nodes }) => {
  await fs.mkdir(GENERATED_DIR, { recursive: true });
  const filePath = path.join(GENERATED_DIR, `${String(countryCode).toUpperCase()}.seed-country.json`);
  const payload = {
    country_code: String(countryCode || "").toUpperCase(),
    generated_at: nowIso(),
    imported_batch_id: batchId,
    nodes,
  };
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return filePath;
};

export const writeImportBatch = async (batch) => {
  await fs.mkdir(BATCHES_DIR, { recursive: true });
  const filePath = path.join(BATCHES_DIR, `${batch.batch_id}.json`);
  await fs.writeFile(filePath, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
  return filePath;
};
