#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateCountrySeedPlan } from "./world-opening/engine.mjs";
import {
  loadCountrySeed,
  makeBatchId,
  mergeNodesIdempotent,
  saveCountrySeed,
  writeImportBatch,
} from "./world-opening/persistence.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = path.resolve(__dirname, "../src/data/countries/registry.json");

const parseArgs = () =>
  Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const [key, value = "true"] = arg.split("=");
      return [key.replace(/^--/, ""), value];
    }),
  );

const toInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const printSummary = (summary) => {
  console.log(`Country: ${summary.country.country_code} (${summary.country.name})`);
  console.log(`Selected: groves=${summary.selected.groves}, trees=${summary.selected.trees}, fallbackGroves=${summary.selected.fallback_groves_used}, fallbackTrees=${summary.selected.fallback_trees_used}, total=${summary.selected.total}`);
  console.log("Adapter results:");
  summary.adapter_results.forEach((result) => {
    console.log(`- ${result.adapter}: count=${result.count}${result.error ? ` error=${result.error}` : ""}`);
  });
};

const main = async () => {
  const args = parseArgs();
  const country = String(args.country || "").toUpperCase();
  if (!country) {
    console.error("Usage: node scripts/seed-country.mjs --country=CR --limitGroves=33 --limitTrees=33 --dryRun");
    process.exit(1);
  }

  const registry = JSON.parse(await fs.readFile(REGISTRY_PATH, "utf8"));
  const entry = registry.find((item) => String(item.country_code || "").toUpperCase() === country);
  if (!entry) {
    console.error(`Country ${country} not found in registry. Run open-country first.`);
    process.exit(1);
  }

  const limitGroves = toInt(args.limitGroves, 33);
  const limitTrees = toInt(args.limitTrees, 33);
  const dryRun = String(args.dryRun || "false") === "true";
  const batchId = makeBatchId(country);

  const plan = await generateCountrySeedPlan({
    countryCode: country,
    wikidataQid: entry.wikidata_qid,
    limitGroves,
    limitTrees,
    batchId,
  });

  printSummary(plan);

  if (dryRun) {
    console.log("Dry run: no files written.");
    return;
  }

  const existing = await loadCountrySeed(country);
  const { merged, inserted, touched } = mergeNodesIdempotent(
    existing.data.nodes || [],
    plan.nodes,
    batchId,
  );
  const outputPath = await saveCountrySeed({
    countryCode: country,
    batchId,
    nodes: merged,
  });

  const batchPath = await writeImportBatch({
    batch_id: batchId,
    created_at: new Date().toISOString(),
    country_code: country,
    limits: { trees: limitTrees, groves: limitGroves },
    selected: plan.selected,
    merged: { inserted, touched, total_after_merge: merged.length },
    adapters: plan.adapter_results,
  });

  console.log(`Wrote seed data: ${outputPath}`);
  console.log(`Wrote batch log: ${batchPath}`);
  console.log(`Merge summary: inserted=${inserted}, touched=${touched}, total=${merged.length}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
