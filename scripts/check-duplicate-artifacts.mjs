#!/usr/bin/env node
import { readdirSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "coverage"]);
const DUPLICATE_NAME_RE = / 2(\.[^/]+)?$/;

/**
 * @param {string} dir
 * @returns {{ kind: "file" | "directory"; path: string }[]}
 */
const walk = (dir) => {
  const offenders = [];
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;

    const abs = path.join(dir, entry.name);
    const rel = path.relative(ROOT, abs);

    if (DUPLICATE_NAME_RE.test(entry.name)) {
      offenders.push({
        kind: entry.isDirectory() ? "directory" : "file",
        path: rel,
      });
    }

    if (entry.isDirectory()) {
      offenders.push(...walk(abs));
    }
  }

  return offenders;
};

const offenders = walk(ROOT).sort((a, b) => a.path.localeCompare(b.path));

if (offenders.length === 0) {
  console.log("check-duplicate-artifacts: passed");
  process.exit(0);
}

const fileCount = offenders.filter((item) => item.kind === "file").length;
const directoryCount = offenders.length - fileCount;

console.error("Blocked: duplicate artifacts detected.");
console.error(
  `Found ${offenders.length} offender(s): ${fileCount} file(s), ${directoryCount} director${directoryCount === 1 ? "y" : "ies"}.`,
);
console.error("Rename or remove files/directories ending with \" 2\" before merging.");
for (const offender of offenders) {
  console.error(` - [${offender.kind}] ${offender.path}`);
}

process.exit(1);
