import { useState, useEffect, useCallback } from "react";

/**
 * Hook to manage fullscreen map mode.
 * Handles ESC key, body scroll lock, and state persistence.
 */
export function useFullscreenMap() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreen = useCallback(() => {
    setIsFullscreen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    document.body.style.overflow = "";
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) exitFullscreen();
    else enterFullscreen();
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // ESC key support
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitFullscreen();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isFullscreen, exitFullscreen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { document.body.style.overflow = ""; };
  }, []);

  return { isFullscreen, enterFullscreen, exitFullscreen, toggleFullscreen };
}
