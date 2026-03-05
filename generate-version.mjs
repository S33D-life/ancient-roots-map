import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const generated = new Date().toISOString();
const VERSION_PATH = path.resolve(process.cwd(), "public/version.json");
const ALLOWED_VERSION_PATH = path.resolve(process.cwd(), "public", "version.json");

if (VERSION_PATH !== ALLOWED_VERSION_PATH) {
  throw new Error("generate-version.mjs may only write public/version.json");
}

function resolveBuildId() {
  const envBuildId =
    process.env.CI_BUILD_ID ||
    process.env.GITHUB_SHA ||
    process.env.CF_PAGES_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.BUILD_ID;

  if (envBuildId) return envBuildId.slice(0, 40);

  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "dev";
  }
}

const build = resolveBuildId();
const payload = { build, generated };

const next = `${JSON.stringify(payload, null, 2)}\n`;
let prev = "";
try {
  prev = readFileSync(VERSION_PATH, "utf8");
} catch {
  // file may not exist yet in a clean workspace
}

if (prev !== next) {
  writeFileSync(VERSION_PATH, next);
}

console.log(`version.json generated: build=${build} generated=${generated}`);
