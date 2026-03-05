#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "coverage"]);
const SCAN_EXT = new Set([
  ".js",
  ".cjs",
  ".mjs",
  ".ts",
  ".tsx",
  ".json",
  ".md",
  ".yml",
  ".yaml",
  ".toml",
  ".html",
  ".css",
  ".sql",
]);

const walkFiles = (dir) => {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(abs));
      continue;
    }
    if (!entry.isFile()) continue;
    const rel = path.relative(ROOT, abs);
    const ext = path.extname(entry.name).toLowerCase();
    if (SCAN_EXT.has(ext) || entry.name === ".env.example") {
      files.push(rel);
    }
  }
  return files;
};

const forbiddenEnvFiles = [".env", ".env.local", ".env.production", ".env.development"];
const presentForbidden = forbiddenEnvFiles.filter((file) => existsSync(path.join(ROOT, file)));
if (presentForbidden.length > 0) {
  console.error("Blocked: local env files present in repository root:");
  presentForbidden.forEach((file) => console.error(` - ${file}`));
  console.error("Move secrets to untracked local env files outside git scope before committing.");
  process.exit(1);
}

const secretPatterns = [
  {
    label: "Supabase service role key assignment",
    regex: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*[A-Za-z0-9._-]{20,}/i,
  },
  {
    label: "Supabase publishable key assignment",
    regex: /VITE_SUPABASE_PUBLISHABLE_KEY\s*=\s*[A-Za-z0-9._-]{20,}/i,
  },
  {
    label: "JWT-like token",
    regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  },
];

const allowList = new Set([".env.example"]);
const findings = [];
for (const file of walkFiles(ROOT)) {
  if (allowList.has(path.basename(file))) continue;
  const text = readFileSync(path.join(ROOT, file), "utf8");
  for (const pattern of secretPatterns) {
    if (pattern.regex.test(text)) {
      findings.push({ file, label: pattern.label });
    }
  }
}

if (findings.length > 0) {
  console.error("Blocked: potential committed secrets detected:");
  findings.forEach(({ file, label }) => console.error(` - ${file}: ${label}`));
  process.exit(1);
}

console.log("security-check: passed");
