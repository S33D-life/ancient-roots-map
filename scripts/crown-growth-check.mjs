// Verifies Crown growth records against git: every referenced commit exists and
// each release line is in true ancestry order. Needs full history, so it is a
// local/TEOTAG check rather than part of the shallow-clone CI gate.
// Usage: npm run crown:growth:check
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const entry = fileURLToPath(new URL("../src/data/crown/growths.ts", import.meta.url));
const result = await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", write: false, logLevel: "silent" });
const { CROWN_GROWTHS } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);

const git = (...args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const exists = sha => { try { git("cat-file", "-e", `${sha}^{commit}`); return true; } catch { return false; } };
const isAncestor = (a, b) => { try { git("merge-base", "--is-ancestor", a, b); return true; } catch { return false; } };

const problems = [];
for (const g of CROWN_GROWTHS) {
  const shas = [...g.releaseLine.points.map(p => p.sha), ...g.seams.flatMap(s => [...s.commits, ...(s.mergeSha ? [s.mergeSha] : [])])];
  for (const sha of new Set(shas)) if (!exists(sha)) problems.push(`${g.id}: commit ${sha} not found (fetch the referenced branches)`);
  const pts = g.releaseLine.points;
  for (let i = 1; i < pts.length; i++) {
    if (exists(pts[i - 1].sha) && exists(pts[i].sha) && !isAncestor(pts[i - 1].sha, pts[i].sha)) {
      problems.push(`${g.id}: ${pts[i - 1].sha} is not an ancestor of ${pts[i].sha}`);
    }
  }
  for (const s of g.seams) if (s.mergeSha && !pts.some(p => p.sha.startsWith(s.mergeSha) || s.mergeSha.startsWith(p.sha))) {
    problems.push(`${g.id}: seam ${s.id} merge ${s.mergeSha} is not a recorded release point`);
  }
}
if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
console.log(`Crown growth records verified against git (${CROWN_GROWTHS.length}).`);
