#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const outDir = path.join(repoRoot, "src", "data", "rootstones", "generated");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL (or VITE_SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data, error } = await supabase
  .from("rootstones_staging")
  .select("country,payload_json")
  .eq("status", "approved")
  .order("created_at", { ascending: true });

if (error) {
  console.error(error.message);
  process.exit(1);
}

const grouped = new Map();
for (const row of data || []) {
  const country = row.country || "unknown";
  const list = grouped.get(country) || [];
  if (row.payload_json) list.push(row.payload_json);
  grouped.set(country, list);
}

await mkdir(outDir, { recursive: true });

for (const [country, rows] of grouped) {
  const file = path.join(outDir, `${slugify(country)}.json`);
  await writeFile(file, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  console.log(`${country}: ${rows.length} -> ${path.relative(repoRoot, file)}`);
}

console.log(`Countries exported: ${grouped.size}`);
