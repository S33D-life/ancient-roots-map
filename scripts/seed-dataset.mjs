#!/usr/bin/env node
/**
 * seed-dataset.mjs — Generic dataset seeder for S33D heritage tree datasets.
 *
 * Usage:
 *   node scripts/seed-dataset.mjs --dataset=sg-heritage-trees --dryRun=true
 *   node scripts/seed-dataset.mjs --dataset=sg-heritage-trees
 *
 * This script reads a seed data file (JSON) and inserts into research_trees
 * using the dataset integration config pattern.
 *
 * Seed data files should be at: scripts/seeds/{dataset-key}.json
 * Format: Array of SeedTree objects (see src/config/datasetIntegration.ts)
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const parseArgs = () =>
  Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const [key, value = "true"] = arg.split("=");
      return [key.replace(/^--/, ""), value];
    }),
  );

const main = async () => {
  const args = parseArgs();
  const datasetKey = args.dataset;
  const dryRun = args.dryRun === "true";

  if (!datasetKey) {
    console.error("Usage: node scripts/seed-dataset.mjs --dataset=<key> [--dryRun=true]");
    console.error("\nAvailable datasets: place seed files in scripts/seeds/<key>.json");
    process.exit(1);
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing SUPABASE_URL / SUPABASE_KEY env vars.");
    process.exit(1);
  }

  // Load seed data
  const seedPath = path.join(process.cwd(), "scripts", "seeds", `${datasetKey}.json`);
  if (!existsSync(seedPath)) {
    console.error(`Seed file not found: ${seedPath}`);
    console.error(`Create a JSON array of seed trees at scripts/seeds/${datasetKey}.json`);
    process.exit(1);
  }

  const seedTrees = JSON.parse(readFileSync(seedPath, "utf8"));

  // Load dataset config
  const configPath = path.join(process.cwd(), "scripts", "seeds", `${datasetKey}.config.json`);
  if (!existsSync(configPath)) {
    console.error(`Config file not found: ${configPath}`);
    console.error(`Create a config file at scripts/seeds/${datasetKey}.config.json with fields:`);
    console.error(`  { "name", "countryName", "sourceUrl", "key" }`);
    process.exit(1);
  }

  const config = JSON.parse(readFileSync(configPath, "utf8"));

  // Normalise
  const records = seedTrees.map((t) => ({
    tree_name: t.tree_name,
    species_scientific: t.species_scientific,
    species_common: t.species_common,
    designation_type: t.designation_type || "Heritage Tree",
    province: t.province,
    city: t.city || config.countryName,
    country: config.countryName,
    locality_text: t.locality_text,
    latitude: t.latitude,
    longitude: t.longitude,
    height_m: t.height_m || null,
    girth_or_stem: t.girth_or_stem || null,
    crown_spread: t.crown_spread || null,
    age_estimate: t.age_estimate || null,
    description: t.description,
    source_doc_title: config.name,
    source_doc_url: config.sourceUrl,
    source_doc_year: config.sourceYear || new Date().getFullYear(),
    source_program: config.key,
    source_row_ref: t.source_row_ref,
    geo_precision: t.geo_precision || "approx",
    heritage_status: "official_register",
    status: "research",
    record_status: "draft",
    record_kind: "individual_tree",
  }));

  if (dryRun) {
    console.log(`[DRY RUN] Would insert ${records.length} ${config.countryName} trees:`);
    records.forEach((r, i) => console.log(`  ${i + 1}. ${r.tree_name} (${r.species_common || r.species_scientific}) — ${r.province}`));

    // Group by ref prefix
    const prefixes = new Map();
    records.forEach((r) => {
      const prefix = r.source_row_ref?.split("-").slice(0, 2).join("-") || "unknown";
      prefixes.set(prefix, (prefixes.get(prefix) || 0) + 1);
    });
    console.log("\nCircle distribution:");
    for (const [prefix, count] of prefixes) {
      console.log(`  ${prefix}: ${count}`);
    }
    return;
  }

  console.log(`Inserting ${records.length} ${config.countryName} trees...`);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/research_trees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(records),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Insert failed (${res.status}): ${body}`);
    process.exit(1);
  }

  const inserted = await res.json();
  console.log(`✅ Inserted ${inserted.length} ${config.countryName} trees.`);
  inserted.forEach((r) => console.log(`  - ${r.tree_name} (${r.id})`));
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
