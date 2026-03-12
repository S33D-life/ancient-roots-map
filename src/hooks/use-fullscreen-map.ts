/**
 * @deprecated Use `useFullscreen` from "@/hooks/use-fullscreen" instead.
 * Kept for backward-compatibility — delegates to the unified hook.
 */
import { useFullscreen } from "./use-fullscreen";

export function useFullscreenMap() {
  return useFullscreen();
}
