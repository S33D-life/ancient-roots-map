import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Unified fullscreen hook for S33D immersive experiences.
 *
 * Uses CSS-based "visual fullscreen" (fixed overlay + body scroll lock)
 * by default. Optionally delegates to the browser Fullscreen API.
 *
 * Features:
 *   - ESC key exit
 *   - Route-change auto-exit
 *   - Rapid-toggle debounce
 *   - Safari / iOS compatibility
 *   - Cleanup on unmount
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
  /** Use native Fullscreen API when available (default: false — CSS-only is more reliable) */
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
  const lastToggle = useRef(0);

  const enterFullscreen = useCallback(
    (element?: HTMLElement) => {
      // Rapid-toggle guard (250ms)
      const now = Date.now();
      if (now - lastToggle.current < 250) return;
      lastToggle.current = now;

      const el = element ?? containerRef.current;
      if (useNativeAPI && el) {
        requestFS(el).catch(() => {});
      }

      setIsFullscreen(true);
      document.body.style.overflow = "hidden";
      onEnter?.();
    },
    [useNativeAPI, onEnter],
  );

  const exitFullscreen = useCallback(() => {
    const now = Date.now();
    if (now - lastToggle.current < 250) return;
    lastToggle.current = now;

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

  // Route-change auto-exit
  const location = useLocation();
  useEffect(() => {
    if (isFullscreen) {
      setIsFullscreen(false);
      document.body.style.overflow = "";
      if (useNativeAPI && getFullscreenElement()) exitFS().catch(() => {});
      onExit?.();
    }
    // Only fire when the pathname actually changes — not on every isFullscreen change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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
