import { useRef, useCallback, useState } from "react";
import html2canvas from "html2canvas";
import { toast } from "sonner";

/**
 * useCaptureView — captures a DOM element as a PNG image.
 * Excludes elements with `data-capture-exclude` attribute.
 */

export interface CaptureOptions {
  /** Filename without extension */
  filename?: string;
  /** Scale factor for high-DPI captures (default 2) */
  scale?: number;
  /** Background color (default transparent) */
  backgroundColor?: string;
}

export function useCaptureView() {
  const captureRef = useRef<HTMLElement>(null);
  const [capturing, setCapturing] = useState(false);

  const capture = useCallback(
    async (options: CaptureOptions = {}) => {
      const el = captureRef.current;
      if (!el || capturing) return;

      const {
        filename = `s33d-capture-${Date.now()}`,
        scale = 2,
        backgroundColor = "#0a0907",
      } = options;

      setCapturing(true);
      toast.info("Preparing capture…", { duration: 2000 });

      try {
        // Temporarily hide elements marked for exclusion
        const excluded = el.querySelectorAll("[data-capture-exclude]");
        excluded.forEach((node) => {
          (node as HTMLElement).style.visibility = "hidden";
        });

        const canvas = await html2canvas(el, {
          scale,
          backgroundColor,
          useCORS: true,
          allowTaint: true,
          logging: false,
          removeContainer: true,
        });

        // Restore excluded elements
        excluded.forEach((node) => {
          (node as HTMLElement).style.visibility = "";
        });

        // Trigger download
        const link = document.createElement("a");
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();

        toast.success("Captured ✨", { duration: 2000 });
      } catch (err) {
        console.error("[capture]", err);
        toast.error("Capture failed — try again");
      } finally {
        setCapturing(false);
      }
    },
    [capturing],
  );

  return { captureRef, capture, capturing };
}
