import { useRef, useCallback, useState } from "react";
import { captureAndExport, type CaptureOptions } from "@/lib/capture-view";

/**
 * useCaptureView — React hook wrapping the reusable capture utility.
 * Attach captureRef to the element you want to capture.
 */
export { type CaptureOptions };

export function useCaptureView() {
  const captureRef = useRef<HTMLElement>(null);
  const [capturing, setCapturing] = useState(false);

  const capture = useCallback(
    async (options: CaptureOptions = {}) => {
      if (capturing) return;
      setCapturing(true);
      try {
        await captureAndExport({
          ...options,
          root: captureRef.current ?? undefined,
        });
      } finally {
        setCapturing(false);
      }
    },
    [capturing],
  );

  return { captureRef, capture, capturing };
}
