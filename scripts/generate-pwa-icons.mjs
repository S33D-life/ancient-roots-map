#!/usr/bin/env node
/**
 * generate-pwa-icons.mjs
 * ──────────────────────
 * Build-time generator for PWA icons.
 *
 * Reads a single source (public/pwa-icon-source.png or .svg) and emits:
 *   • public/pwa-icon-192.png            (192×192, full-bleed)
 *   • public/pwa-icon-512.png            (512×512, full-bleed)
 *   • public/pwa-icon-maskable-512.png   (512×512, with 10% safe-area padding
 *                                         per the maskable-icon spec)
 *
 * Born from the asset-bloat discovery: shipping the same 1024×1024 file
 * three times under different names ate 6 MB and got past every other
 * guard. Making "ship the right icon" the default is the fix.
 *
 * Usage
 *   node scripts/generate-pwa-icons.mjs        — regenerate from source
 *   (no source file present?  → no-op, exit 0; never blocks the build)
 */
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SRC_PNG = join(ROOT, "public", "pwa-icon-source.png");
const SRC_SVG = join(ROOT, "public", "pwa-icon-source.svg");
const SOURCE = existsSync(SRC_PNG) ? SRC_PNG : existsSync(SRC_SVG) ? SRC_SVG : null;

if (!SOURCE) {
  console.log(
    "generate-pwa-icons: no source (public/pwa-icon-source.{png,svg}) — skipping. " +
      "Existing icons in public/ are kept as-is."
  );
  process.exit(0);
}

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.warn(
    "generate-pwa-icons: `sharp` is not installed — skipping. Run `npm i -D sharp` to enable."
  );
  process.exit(0);
}

const targets = [
  { out: "pwa-icon-192.png", size: 192, padding: 0 },
  { out: "pwa-icon-512.png", size: 512, padding: 0 },
  // Maskable spec: ≥10% safe area on every side. We pad transparent.
  { out: "pwa-icon-maskable-512.png", size: 512, padding: 0.1 },
];

for (const t of targets) {
  const out = join(ROOT, "public", t.out);
  const inner = Math.round(t.size * (1 - t.padding * 2));
  const offset = Math.round((t.size - inner) / 2);

  const resized = sharp(SOURCE).resize(inner, inner, { fit: "contain" });

  if (t.padding === 0) {
    await resized.png({ compressionLevel: 9 }).toFile(out);
  } else {
    await sharp({
      create: {
        width: t.size,
        height: t.size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: await resized.toBuffer(), top: offset, left: offset }])
      .png({ compressionLevel: 9 })
      .toFile(out);
  }

  const kb = (statSync(out).size / 1024).toFixed(0);
  console.log(`generate-pwa-icons: wrote ${t.out} (${t.size}×${t.size}, ${kb} KB)`);
}

console.log("generate-pwa-icons: done");
