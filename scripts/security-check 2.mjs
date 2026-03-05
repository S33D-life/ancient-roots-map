#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const TEXT_MAX_BYTES = 1_000_000;

const decodeTracked = (raw) =>
  raw
    .toString("utf8")
    .split("\0")
    .map((v) => v.trim())
    .filter(Boolean);

const isBinary = (buf) => {
  for (let i = 0; i < Math.min(buf.length, 2048); i += 1) {
    if (buf[i] === 0) return true;
  }
  return false;
};

const collectFiles = (dir) => {
  const out = [];
  const stack = [dir];
  const skip = new Set([".git", "node_modules", "dist", "coverage"]);

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) break;
    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (skip.has(entry.name)) continue;
      const abs = path.join(current, entry.name);
      const rel = path.relative(process.cwd(), abs);
      if (entry.isDirectory()) {
        stack.push(abs);
      } else if (entry.isFile()) {
        out.push(rel);
      }
    }
  }

  return out;
};

let tracked = [];
try {
  tracked = decodeTracked(
    execSync("git ls-files -z", {
      encoding: "buffer",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 10_000,
    }),
  );
} catch {
  tracked = collectFiles(process.cwd());
}

const forbiddenEnv = tracked.filter((file) => {
  const base = path.basename(file);
  if (!existsSync(file)) return false;
  // .env.example and .env.production (publishable keys only) are safe to commit
  if (base === ".env.example" || base === ".env.production") return false;
  return /^\.env(\..+)?$/.test(base);
});

if (forbiddenEnv.length > 0) {
  console.error("Blocked: committed env files detected:");
  forbiddenEnv.forEach((file) => console.error(` - ${file}`));
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

const allowList = new Set([".env.example", ".env.production"]);
const findings = [];

for (const file of tracked) {
  if (file.startsWith("dist/") || file.startsWith("node_modules/")) continue;
  if (allowList.has(path.basename(file))) continue;

  let buf;
  try {
    buf = readFileSync(file);
  } catch {
    continue;
  }
  if (buf.length === 0 || buf.length > TEXT_MAX_BYTES || isBinary(buf)) continue;
  const st = statSync(file);
  if (!st.isFile()) continue;

  const text = buf.toString("utf8");
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
