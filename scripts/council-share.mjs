import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const destination = new URL("../docs/council/Circle-235-Telegram-invitation.md", import.meta.url);
const result = await build({ entryPoints: [fileURLToPath(new URL("../src/lib/council/currentCircleShare.ts", import.meta.url))], bundle: true, platform: "node", format: "esm", write: false });
const { renderCurrentCircleInvitation } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
const text = renderCurrentCircleInvitation();
if (!text) throw new Error("Current Circle is not approved; no public invitation may be generated.");
if (process.argv.includes("--check")) {
  if (await readFile(destination, "utf8") !== text) throw new Error("Invitation is stale. Run npm run council:share.");
} else {
  await writeFile(destination, text);
}
