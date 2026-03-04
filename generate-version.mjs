import { writeFileSync } from "node:fs";

const generatedAt = new Date().toISOString();
const buildId = generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14);

writeFileSync(
  "public/version.json",
  `${JSON.stringify({ build: buildId, generated: generatedAt }, null, 2)}\n`
);

console.log(`version.json generated with build id: ${buildId}`);
