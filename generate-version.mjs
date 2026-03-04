import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const generated = new Date().toISOString();

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

writeFileSync("public/version.json", `${JSON.stringify(payload, null, 2)}\n`);
console.log(`version.json generated: build=${build} generated=${generated}`);
