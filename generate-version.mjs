/**
 * generate-version.js — Run as part of the build to emit public/version.json.
 * Called from package.json build script: "node generate-version.js && vite build"
 */
import { writeFileSync } from "fs";

const buildId = new Date().toISOString().slice(0, 16).replace("T", ".").replace(":", "");

writeFileSync(
  "public/version.json",
  JSON.stringify({ build: buildId, generated: new Date().toISOString() }, null, 2)
);

console.log(`✓ version.json → build ${buildId}`);
