/**
 * capture-view.ts — Reusable screenshot capture utility for S33D.
 *
 * Works across map tiles, WebGL, cross-origin images, and Mobile Safari.
 * Returns a Blob and provides share / copy / download helpers.
 */

import { toBlob } from "html-to-image";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CaptureOptions {
  /** Filename without extension */
  filename?: string;
  /** Pixel ratio (default: capped at 2) */
  scale?: number;
  /** Background colour (default: computed from body or dark fallback) */
  backgroundColor?: string;
  /** Root element to capture — defaults to document.body */
  root?: HTMLElement | null;
  /** Show toast feedback (default true) */
  feedback?: boolean;
  /** Add subtle S33D watermark to bottom-right (default true) */
  watermark?: boolean;
}

export interface CaptureResult {
  blob: Blob;
  filename: string;
}

/* ------------------------------------------------------------------ */
/*  Selectors for elements to hide during capture                      */
/* ------------------------------------------------------------------ */

const HIDE_SELECTORS = [
  "[data-capture-exclude]",
  "[data-capture-hide]",
  '[role="tooltip"]',
  ".debug",
  ".loading-spinner",
  "[data-radix-popper-content-wrapper]",
  "[data-sonner-toaster]",
].join(", ");

/* ------------------------------------------------------------------ */
/*  Context-aware filename                                             */
/* ------------------------------------------------------------------ */

function deriveFilename(): string {
  const path = window.location.pathname;
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  if (path.startsWith("/tree/")) {
    const nameEl = document.querySelector("h1");
    const name = nameEl?.textContent?.trim().replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-").toLowerCase().slice(0, 30);
    return `s33d-tree-${name || "detail"}-${ts}`;
  }
  if (path.startsWith("/map")) return `s33d-atlas-${ts}`;
  if (path.startsWith("/library/staff")) return `s33d-staff-room-${ts}`;
  if (path.startsWith("/library")) return `s33d-heartwood-${ts}`;
  if (path.startsWith("/vault") || path.startsWith("/dashboard")) return `s33d-vault-${ts}`;
  if (path.startsWith("/council")) return `s33d-council-${ts}`;
  if (path === "/") return `s33d-home-${ts}`;
  return `s33d-view-${ts}`;
}

/* ------------------------------------------------------------------ */
/*  Watermark                                                          */
/* ------------------------------------------------------------------ */

function addWatermark(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const text = "s33d.life";
  const fontSize = Math.max(12, Math.round(canvas.width * 0.012));
  ctx.font = `${fontSize}px serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";

  // Subtle semi-transparent watermark
  ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
  ctx.fillText(text, canvas.width - fontSize, canvas.height - fontSize * 0.6);
}

/* ------------------------------------------------------------------ */
/*  Core capture                                                       */
/* ------------------------------------------------------------------ */

export async function captureCurrentView(
  options: CaptureOptions = {},
): Promise<CaptureResult | null> {
  const {
    filename: filenameOverride,
    scale = Math.min(2, window.devicePixelRatio || 1),
    backgroundColor: bgOverride,
    root,
    feedback = true,
    watermark = true,
  } = options;

  const filename = filenameOverride || deriveFilename();
  const el = root ?? document.getElementById("s33d-capture-root") ?? document.body;

  const bg =
    bgOverride ??
    getComputedStyle(document.body).backgroundColor ??
    "#0a0907";

  // --- 1. Enter capture mode: hide transient UI ----
  const hidden: { el: HTMLElement; prev: string }[] = [];
  document.querySelectorAll(HIDE_SELECTORS).forEach((node) => {
    const h = node as HTMLElement;
    hidden.push({ el: h, prev: h.style.display });
    h.style.display = "none";
  });
  document.documentElement.dataset.captureMode = "1";

  if (feedback) toast.info("Preparing capture…", { duration: 2000, id: "capture-progress" });

  try {
    // Wait for layout + tile loading to settle
    await new Promise<void>((r) =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setTimeout(r, 100)),
      ),
    );

    const blob = await toBlob(el, {
      cacheBust: true,
      pixelRatio: scale,
      backgroundColor: bg,
      includeQueryParams: true,
      filter: (node: Node) => {
        if (!(node instanceof HTMLElement)) return true;
        if (node.matches(HIDE_SELECTORS)) return false;
        if (node.closest("[data-capture-hide]")) return false;
        return true;
      },
    });

    if (!blob) throw new Error("Capture returned empty");

    // Apply watermark if requested
    if (watermark) {
      try {
        const img = await createImageBitmap(blob);
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        addWatermark(canvas);
        const watermarkedBlob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, "image/png", 1),
        );
        if (watermarkedBlob) {
          return { blob: watermarkedBlob, filename: `${filename}.png` };
        }
      } catch {
        // Watermark failed — use original blob
      }
    }

    return { blob, filename: `${filename}.png` };
  } catch (err) {
    console.error("[capture]", err);
    if (feedback) {
      toast.dismiss("capture-progress");
      toast.error("Capture could not complete — try again", { duration: 3000 });
    }
    return null;
  } finally {
    // --- Restore hidden elements ---
    delete document.documentElement.dataset.captureMode;
    hidden.forEach(({ el: h, prev }) => {
      h.style.display = prev;
    });
  }
}

/* ------------------------------------------------------------------ */
/*  Export helpers                                                      */
/* ------------------------------------------------------------------ */

/** Download as PNG file */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Copy image to clipboard (returns false if unsupported) */
export async function copyBlobToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (!navigator.clipboard?.write) return false;
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ]);
    return true;
  } catch {
    return false;
  }
}

/** Native share sheet (mobile) — returns false if unavailable */
export async function shareBlob(
  blob: Blob,
  filename: string,
): Promise<boolean> {
  try {
    const file = new File([blob], filename, { type: "image/png" });
    if (!navigator.share || !navigator.canShare?.({ files: [file] }))
      return false;
    await navigator.share({ files: [file], title: "S33D — Ancient Friends" });
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  All-in-one: capture + best export                                  */
/* ------------------------------------------------------------------ */

export async function captureAndExport(
  options: CaptureOptions = {},
): Promise<void> {
  const result = await captureCurrentView(options);
  if (!result) return;

  const { blob, filename } = result;

  // Dismiss the progress toast
  toast.dismiss("capture-progress");

  // Try native share first (mobile), then clipboard, then download
  const shared = await shareBlob(blob, filename);
  if (shared) {
    toast.success("Shared ✨", { duration: 2000 });
    return;
  }

  const copied = await copyBlobToClipboard(blob);
  if (copied) {
    // Clipboard worked — also download as backup but only toast about clipboard
    downloadBlob(blob, filename);
    toast.success("Copied to clipboard & saved ✨", { duration: 2500 });
    return;
  }

  // Download-only fallback
  downloadBlob(blob, filename);
  toast.success("Saved to downloads ✨", { duration: 2000 });
}
