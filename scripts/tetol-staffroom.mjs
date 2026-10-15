// Restores the TETOL Staff Room interior as a same-origin, CSP-safe page.
//
// Source of truth: the preserved interior asset 5eaf7c1e-… inside the Circle 235 TETOL bundle
// (public/tetol/circle-235/pre-fire/tetol.html). Its bytes are verified against the original
// 0.9.14-dev bundle hash before anything is written. Nothing in the room is redesigned:
// the only changes are the ones the production CSP (script-src 'self', default-src 'self')
// requires, applied mechanically and listed in PRESERVATION_STEPS below, plus one small
// separate weave script (runtime/staffroom/weave.js) that links the room to the canonical
// 2D Staff records.
//
//   node scripts/tetol-staffroom.mjs          write staffroom.html + runtime/staffroom/*
//   node scripts/tetol-staffroom.mjs --check  fail if the generated files are stale
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";

const PRE = new URL("../public/tetol/circle-235/pre-fire/", import.meta.url);
const UUID = "5eaf7c1e-2b0d-4c3a-9f61-7a1d3b8e0c42";
// sha256 of the decompressed interior in TETOL 0.9.14-dev (build/offline/tetol-0.9.14-dev.html, TETOL-Local 34e0feb)
const ORIGINAL_SHA256 = "05fea9eb2e0fc63690845ab81c0420537849d5911ee3a0790248bc84e077c1ab";
const VENDOR = "../../vendor/three/"; // relative to runtime/staffroom/
const SPECIFIERS = {
  three: `${VENDOR}build/three.module.js`,
  "three/addons/controls/OrbitControls.js": `${VENDOR}examples/jsm/controls/OrbitControls.js`,
  "three/addons/exporters/OBJExporter.js": `${VENDOR}examples/jsm/exporters/OBJExporter.js`,
  "three/addons/exporters/GLTFExporter.js": `${VENDOR}examples/jsm/exporters/GLTFExporter.js`,
};
const NAMES = ["1-frame.js", "2-stage.js", "3-collection.js", "4-roundhouse.js", "5-spiral.js"];

export const PRESERVATION_STEPS = [
  "Remove the inline import-map injector (inline scripts are refused by script-src 'self'; its integrity hashes also no longer match the vendored, path-rewritten three.js).",
  "Move each inline script, unchanged, into runtime/staffroom/ and load it with <script src> (type=module kept).",
  "Rewrite bare three.js specifiers to the vendored copy already shipped beside TETOL.",
  "Replace the photograph's inline onerror attribute with data-ph-fallback; weave.js adds the same behaviour.",
  "Load runtime/staffroom/weave.js last (2D record links, deep link, photo fallback).",
];

const once = (text, find, replace, label) => {
  const n = text.split(find).length - 1;
  if (n !== 1) throw new Error(`staffroom: expected exactly one "${label}", found ${n}`);
  return text.replace(find, () => replace);
};

async function interiorSource() {
  const html = await readFile(new URL("tetol.html", PRE), "utf8");
  const m = /<script type="__bundler\/manifest"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!m) throw new Error("staffroom: TETOL manifest not found");
  const entry = JSON.parse(m[1])[UUID];
  if (!entry) throw new Error(`staffroom: interior asset ${UUID} missing from the TETOL manifest`);
  let bytes = Buffer.from(entry.data, "base64");
  if (entry.compressed) bytes = gunzipSync(bytes);
  const sha = createHash("sha256").update(bytes).digest("hex");
  if (sha !== ORIGINAL_SHA256) throw new Error(`staffroom: interior bytes differ from the preserved original (${sha})`);
  return bytes.toString("utf8");
}

function rewriteSpecifiers(code) {
  let out = code;
  for (const [bare, path] of Object.entries(SPECIFIERS)) {
    const q = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    // static `from 'x'` and dynamic `import('x')`, single or double quotes
    out = out.replace(new RegExp(`(from\\s*|import\\(\\s*)(['"])${q(bare)}\\2`, "g"), `$1$2${path}$2`);
  }
  return out;
}

export async function generate() {
  let page = await interiorSource();
  // 1 · the import-map injector
  page = page.replace(/<script>\/\* TETOL offline preservation:[\s\S]*?<\/script>\n?/, (s) => {
    if (!s.includes("importmap")) throw new Error("staffroom: unexpected first script");
    return "";
  });
  if (page.includes("TETOL offline preservation")) throw new Error("staffroom: import-map injector not removed");
  // 4 · inline handler
  page = once(page, ` onerror="this.parentNode.classList.add('fail')"`, " data-ph-fallback", "photo onerror");
  // 2 + 3 · extract scripts
  const files = {};
  let i = 0;
  page = page.replace(/<script(\s+type="module")?>([\s\S]*?)<\/script>/g, (_, mod, body) => {
    const name = NAMES[i++];
    if (!name) throw new Error("staffroom: more inline scripts than expected");
    files[name] = `// Preserved from the TETOL Staff Room interior (${UUID}); see scripts/tetol-staffroom.mjs.\n` + rewriteSpecifiers(body);
    return `<script${mod || ""} src="./runtime/staffroom/${name}"></script>`;
  });
  if (i !== NAMES.length) throw new Error(`staffroom: expected ${NAMES.length} scripts, found ${i}`);
  for (const [n, code] of Object.entries(files)) if (/\bfrom\s*['"]three|import\(\s*['"]three/.test(code)) throw new Error(`staffroom: bare three specifier left in ${n}`);
  page = once(page, "</body>", `<script type="module" src="./runtime/staffroom/weave.js"></script>\n</body>`, "</body>");
  page = once(page, "<head>", `<head>\n<!-- Generated by scripts/tetol-staffroom.mjs from the preserved TETOL Staff Room (${UUID}). Do not edit by hand. -->`, "<head>");
  return { "staffroom.html": page, ...Object.fromEntries(Object.entries(files).map(([n, c]) => [`runtime/staffroom/${n}`, c])) };
}

const check = process.argv.includes("--check");
const out = await generate();
await mkdir(new URL("runtime/staffroom/", PRE), { recursive: true });
for (const [rel, text] of Object.entries(out)) {
  const url = new URL(rel, PRE);
  if (check) {
    const cur = await readFile(url, "utf8").catch(() => null);
    if (cur !== text) throw new Error(`staffroom: ${rel} is stale; run node scripts/tetol-staffroom.mjs`);
  } else await writeFile(url, text);
}
console.log(`${check ? "checked" : "wrote"} ${Object.keys(out).length} Staff Room files`);
