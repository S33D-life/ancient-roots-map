import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
const source = new URL("../src/lib/council/staticCouncilAdapter.ts", import.meta.url);
const destination = new URL("../public/tetol/circle-235/pre-fire/runtime/current-circle.js", import.meta.url);
// Evaluate the source at build time; only the filtered projection enters the browser artifact.
const check = await build({ entryPoints: [fileURLToPath(source)], bundle: true, format: "esm", platform: "node", write: false });
const { staticCouncilProjection } = await import(`data:text/javascript;base64,${Buffer.from(check.outputFiles[0].text).toString("base64")}`);
const circle = staticCouncilProjection();
if (!circle) throw new Error("Current Circle is not approved; refuse to generate a public static artifact");
const runtime = `
import { applyStaticCouncil, councilReturnUrl } from ${JSON.stringify(fileURLToPath(source))};
const circle = ${JSON.stringify(circle)};
window.S33D_APPLY_CURRENT_CIRCLE = registry => applyStaticCouncil(registry, circle);
window.addEventListener("tetol:current-circle", () => {
  const href = councilReturnUrl(circle);
  if (!href) return;
  const link = document.createElement("a");
  link.href = href; link.textContent = "Return to Council of Life"; link.className = "home";
  link.id = "council-return";
  // Only this return affordance must remain above the existing stage interception (#79).
  link.style.cssText = "position:fixed;right:16px;bottom:calc(112px + env(safe-area-inset-bottom, 0px));z-index:2147483647;min-height:44px;display:inline-flex;align-items:center;padding:10px 14px;border:1px solid var(--line);border-radius:10px;background:var(--bg, #1a1f14);color:var(--ink, #f0eadb);text-decoration:none;font:13px var(--sans, sans-serif)";
  document.body.appendChild(link);
});`;
const result = await build({ stdin: { contents: runtime, resolveDir: fileURLToPath(new URL("../", import.meta.url)), sourcefile: "static-council-runtime.js" }, bundle: true, format: "iife", platform: "browser", write: false });
const text = "// Generated from approved Current Circle. Run npm run council:static.\n" + result.outputFiles[0].text;
if (process.argv.includes("--check")) {
  if (await readFile(destination, "utf8") !== text) throw new Error("Static Council projection is stale; run npm run council:static");
} else await writeFile(destination, text);
