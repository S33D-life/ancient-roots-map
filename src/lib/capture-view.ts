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
  "[data-radix-popper-content-wrapper]", // open popovers / tooltips
].join(", ");

/* ------------------------------------------------------------------ */
/*  Core capture                                                       */
/* ------------------------------------------------------------------ */

export async function captureCurrentView(
  options: CaptureOptions = {},
): Promise<CaptureResult | null> {
  const {
    filename = `s33d-${Date.now()}`,
    scale = Math.min(2, window.devicePixelRatio || 1),
    backgroundColor:
      bgOverride,
    root,
    feedback = true,
  } = options;

  const el = root ?? document.getElementById("s33d-capture-root") ?? document.body;

  const bg =
    bgOverride ??
    getComputedStyle(document.body).backgroundColor ??
    "#0a0907";

  // --- 1. Enter capture mode: hide transient UI ----
  const hidden: { el: HTMLElement; prev: string }[] = [];
  el.querySelectorAll(HIDE_SELECTORS).forEach((node) => {
    const h = node as HTMLElement;
    hidden.push({ el: h, prev: h.style.display });
    h.style.display = "none";
  });
  document.documentElement.dataset.captureMode = "1";

  if (feedback) toast.info("Preparing capture…", { duration: 2500 });

  try {
    // Wait two frames so layout settles
    await new Promise<void>((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r())),
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

    return { blob, filename: `${filename}.png` };
  } catch (err) {
    console.error("[capture]", err);
    if (feedback) toast.error("Capture could not complete — try again");
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
    await navigator.share({ files: [file], title: "S33D" });
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

  // Try native share first (mobile), then clipboard, then download
  const shared = await shareBlob(blob, filename);
  if (shared) {
    toast.success("Shared ✨", { duration: 2000 });
    return;
  }

  const copied = await copyBlobToClipboard(blob);
  if (copied) {
    toast.success("Copied to clipboard ✨", { duration: 2000 });
  }

  // Always download as reliable fallback
  downloadBlob(blob, filename);
  if (!copied) {
    toast.success("Download ready ✨", { duration: 2000 });
  }
}
