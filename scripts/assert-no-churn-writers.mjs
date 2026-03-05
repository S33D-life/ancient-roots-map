#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "coverage"]);
const CHECK_EXTS = new Set([".js", ".cjs", ".mjs", ".ts", ".tsx"]);

const walk = (dir) => {
  const out = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(abs));
      continue;
    }
    if (!entry.isFile()) continue;
    if (CHECK_EXTS.has(path.extname(entry.name))) out.push(abs);
  }
  return out;
};

const WRITE_SENSITIVE_RE =
  /(writeFileSync|writeFile|appendFileSync|appendFile|renameSync|rename)\s*\([\s\S]{0,220}['"`][^'"`]*(?:\.env(?:\.[^'"`\s]+)?|vite\.config\.ts)[^'"`]*['"`]/i;
const ALLOWLIST = new Set([
  path.resolve(ROOT, "scripts/assert-no-churn-writers.mjs"),
]);

const violations = [];
for (const file of walk(ROOT)) {
  if (ALLOWLIST.has(file)) continue;
  const text = readFileSync(file, "utf8");
  if (WRITE_SENSITIVE_RE.test(text)) {
    violations.push(path.relative(ROOT, file));
  }
}

if (violations.length > 0) {
  console.error("Blocked: found code that may write .env or vite.config.ts:");
  violations.forEach((v) => console.error(` - ${v}`));
  process.exit(1);
}

console.log("assert-no-churn-writers: passed");
