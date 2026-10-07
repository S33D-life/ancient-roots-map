import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
const source = new URL("../src/lib/council/staticCouncilAdapter.ts", import.meta.url);
const destination = new URL("../public/tetol/circle-235/pre-fire/runtime/current-circle.js", import.meta.url);
// Check approval before bundling: never write a public artifact containing draft source text.
const check = await build({ entryPoints: [fileURLToPath(source)], bundle: true, format: "esm", platform: "node", write: false });
const { staticCouncilProjection } = await import(`data:text/javascript;base64,${Buffer.from(check.outputFiles[0].text).toString("base64")}`);
if (!staticCouncilProjection()) throw new Error("Current Circle is not approved; refuse to generate a public static artifact");
const result = await build({ entryPoints: [fileURLToPath(source)], bundle: true, format: "iife", platform: "browser", write: false });
const text = "// Generated from approved Current Circle. Run npm run council:static.\n" + result.outputFiles[0].text;
if (process.argv.includes("--check")) {
  if (await readFile(destination, "utf8") !== text) throw new Error("Static Council projection is stale; run npm run council:static");
} else await writeFile(destination, text);
