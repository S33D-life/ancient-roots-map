import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Unified fullscreen hook for S33D immersive experiences.
 *
 * Uses the browser Fullscreen API when available, falls back to
 * CSS-based "visual fullscreen" (fixed overlay + body scroll lock).
 *
 * Works across desktop Chrome/Firefox/Safari and mobile browsers.
 */

function getFullscreenElement(): Element | null {
  return (
    document.fullscreenElement ??
    (document as any).webkitFullscreenElement ??
    null
  );
}

function requestFS(el: Element) {
  if (el.requestFullscreen) return el.requestFullscreen();
  if ((el as any).webkitRequestFullscreen) return (el as any).webkitRequestFullscreen();
  return Promise.reject(new Error("Fullscreen API unavailable"));
}

function exitFS() {
  if (document.exitFullscreen) return document.exitFullscreen();
  if ((document as any).webkitExitFullscreen) return (document as any).webkitExitFullscreen();
  return Promise.reject(new Error("Fullscreen API unavailable"));
}

export interface UseFullscreenOptions {
  /** Use native Fullscreen API when available (default: false — CSS-only mode is more reliable across rooms) */
  useNativeAPI?: boolean;
  /** Called after entering fullscreen */
  onEnter?: () => void;
  /** Called after exiting fullscreen */
  onExit?: () => void;
}

export function useFullscreen(options: UseFullscreenOptions = {}) {
  const { useNativeAPI = false, onEnter, onExit } = options;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  const enterFullscreen = useCallback(
    (element?: HTMLElement) => {
      const el = element ?? containerRef.current;

      if (useNativeAPI && el) {
        requestFS(el).catch(() => {
          // Fallback: CSS-only fullscreen
        });
      }

      setIsFullscreen(true);
      document.body.style.overflow = "hidden";
      onEnter?.();
    },
    [useNativeAPI, onEnter],
  );

  const exitFullscreen = useCallback(() => {
    if (useNativeAPI && getFullscreenElement()) {
      exitFS().catch(() => {});
    }

    setIsFullscreen(false);
    document.body.style.overflow = "";
    onExit?.();
  }, [useNativeAPI, onExit]);

  const toggleFullscreen = useCallback(
    (element?: HTMLElement) => {
      if (isFullscreen) exitFullscreen();
      else enterFullscreen(element);
    },
    [isFullscreen, enterFullscreen, exitFullscreen],
  );

  // ESC key — always works regardless of native API
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitFullscreen();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isFullscreen, exitFullscreen]);

  // Sync with native fullscreenchange events
  useEffect(() => {
    if (!useNativeAPI) return;
    const handler = () => {
      if (!getFullscreenElement() && isFullscreen) {
        setIsFullscreen(false);
        document.body.style.overflow = "";
        onExit?.();
      }
    };
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler);
    };
  }, [useNativeAPI, isFullscreen, onExit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    /** Attach to the element you want to make fullscreen (for native API) */
    containerRef,
  };
}
