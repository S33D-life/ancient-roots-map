#!/usr/bin/env node
/**
 * Build the S33D ↔ TETOL bridge as one standalone ES module.
 *
 *   node scripts/build-tetol-bridge.mjs   →   dist-tetol-bridge/s33d-bridge.js
 *
 * Independent of the main app build: nothing here touches dist/, the PWA
 * service worker or App.tsx. A standalone TETOL prototype can import the
 * output directly. Not wired into release-check; local / preview use only.
 */
import { build } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await build({
  configFile: false,
  root,
  logLevel: "info",
  resolve: { alias: { "@": path.join(root, "src") } },
  build: {
    target: "es2022",
    outDir: path.join(root, "dist-tetol-bridge"),
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
    lib: {
      entry: path.join(root, "src/tetol-bridge/index.ts"),
      formats: ["es"],
      fileName: () => "s33d-bridge.js",
    },
  },
});
