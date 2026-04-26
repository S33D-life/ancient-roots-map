#!/usr/bin/env node
/**
 * asset-budget.mjs
 * ────────────────
 * Build hygiene guardrail — fails CI if any file in public/ exceeds the
 * configured byte budget without an explicit allow-list entry.
 *
 * Born from the heart-ledger / performance discovery: PWA icons shipped
 * as 1024×1024 copies (6 MB), vault logos shipped 17 MB of dead weight,
 * and neither was caught by feature testing because asset bloat is a
 * category of bug nothing was watching for.
 *
 * Behaviour
 *   • Errors on any file > maxBytes that is not in allowList.
 *   • Warns (does NOT fail) on any file in public/ that has zero
 *     references in src/. False positives exist (icons referenced from
 *     manifest.webmanifest, _headers, etc.) so this is informational.
 *   • Emits a sorted top-10 size summary for visibility.
 *
 * Run locally: npm run guard:assets
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const PUBLIC_DIR = join(ROOT, "public");
const SRC_DIR = join(ROOT, "src");
const BUDGET_FILE = join(ROOT, "scripts", "asset-budget.json");

const budget = JSON.parse(readFileSync(BUDGET_FILE, "utf8"));
const MAX_BYTES = Number(budget.maxBytes ?? 512000);
const ALLOW_LIST = new Set((budget.allowList ?? []).map((p) => p.replaceAll("\\", "/")));

/** Recursively walk a directory, returning file paths. */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(abs));
    else out.push(abs);
  }
  return out;
}

const files = walk(PUBLIC_DIR).map((abs) => ({
  abs,
  rel: relative(ROOT, abs).split(sep).join("/"),
  size: statSync(abs).size,
}));

// 1. Budget check ─────────────────────────────────────────────────────────
const overBudget = files
  .filter((f) => f.size > MAX_BYTES && !ALLOW_LIST.has(f.rel))
  .sort((a, b) => b.size - a.size);

// 2. Top sizes summary ───────────────────────────────────────────────────
const top = [...files].sort((a, b) => b.size - a.size).slice(0, 10);
const totalKb = Math.round(files.reduce((s, f) => s + f.size, 0) / 1024);

console.log(`asset-budget: ${files.length} files, ${(totalKb / 1024).toFixed(1)} MB total`);
console.log(`asset-budget: budget = ${(MAX_BYTES / 1024).toFixed(0)} KB / file, allow-list = ${ALLOW_LIST.size}`);
console.log("asset-budget: top files —");
for (const f of top) {
  console.log(`  ${(f.size / 1024).toFixed(0).padStart(5)} KB  ${f.rel}`);
}

// 3. Optional unreferenced-asset warning ─────────────────────────────────
//
// Walks src/ once, concatenates all source text, then checks each
// public/-relative asset name for any occurrence. Cheap heuristic; misses
// dynamic refs (`/icons/${id}.png`) — reported as warning only.
function readAllSources(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...readAllSources(abs));
    } else if (/\.(t|j)sx?$|\.css$|\.html$|\.json$/.test(entry.name)) {
      try {
        out.push(readFileSync(abs, "utf8"));
      } catch {
        /* ignore */
      }
    }
  }
  return out;
}
const haystack = readAllSources(SRC_DIR).join("\n") +
  "\n" +
  readFileSync(join(ROOT, "index.html"), "utf8");

const unreferenced = files.filter((f) => {
  const name = f.rel.replace(/^public\//, "");
  // Skip files known to be referenced from manifest / service-worker only.
  if (
    /^(favicon\.ico|robots\.txt|placeholder\.svg|_headers|_redirects|version\.json|pwa-icon-)/.test(
      name
    )
  ) {
    return false;
  }
  return !haystack.includes(name) && !haystack.includes(`/${name}`);
});

if (unreferenced.length > 0) {
  console.log(
    `asset-budget: WARN — ${unreferenced.length} file(s) in public/ have no src/ reference (heuristic; may include dynamic refs):`
  );
  for (const f of unreferenced.slice(0, 20)) {
    console.log(`  - ${f.rel} (${(f.size / 1024).toFixed(0)} KB)`);
  }
  if (unreferenced.length > 20) {
    console.log(`  … and ${unreferenced.length - 20} more`);
  }
}

// 4. Final verdict ───────────────────────────────────────────────────────
if (overBudget.length > 0) {
  console.error(
    `\nasset-budget: FAIL — ${overBudget.length} file(s) exceed ${(
      MAX_BYTES / 1024
    ).toFixed(0)} KB and are not in scripts/asset-budget.json:`
  );
  for (const f of overBudget) {
    console.error(`  ${(f.size / 1024).toFixed(0).padStart(5)} KB  ${f.rel}`);
  }
  console.error(
    "\nFix: compress the asset, or add it to scripts/asset-budget.json with a justification in your PR."
  );
  process.exit(1);
}

console.log("\nasset-budget: passed");
process.exit(0);
