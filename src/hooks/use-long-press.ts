/**
 * useLongPress — detects press-and-hold with movement cancellation.
 * Returns pointer event handlers. Calls onLongPress after `duration` ms
 * if the pointer hasn't moved more than `moveThreshold` px.
 */
import { useRef, useCallback } from "react";

interface UseLongPressOptions {
  onLongPress: () => void;
  /** ms to hold before triggering (default 600) */
  duration?: number;
  /** px movement that cancels the press (default 10) */
  moveThreshold?: number;
  /** Called with progress 0→1 during the hold for visual feedback */
  onProgress?: (progress: number) => void;
}

export function useLongPress({
  onLongPress,
  duration = 600,
  moveThreshold = 10,
  onProgress,
}: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const rafRef = useRef<number>(0);
  const startRef = useRef({ x: 0, y: 0, time: 0 });
  const activeRef = useRef(false);
  const firedRef = useRef(false);

  const cancel = useCallback(() => {
    activeRef.current = false;
    firedRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    cancelAnimationFrame(rafRef.current);
    onProgress?.(0);
  }, [onProgress]);

  const startProgress = useCallback(() => {
    if (!onProgress) return;
    const start = Date.now();
    const tick = () => {
      if (!activeRef.current) return;
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / duration);
      onProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [onProgress, duration]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      activeRef.current = true;
      firedRef.current = false;
      startRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      startProgress();
      timerRef.current = setTimeout(() => {
        if (activeRef.current) {
          firedRef.current = true;
          activeRef.current = false;
          onProgress?.(1);
          onLongPress();
        }
      }, duration);
    },
    [onLongPress, duration, startProgress, onProgress],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!activeRef.current) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      if (Math.abs(dx) + Math.abs(dy) > moveThreshold) {
        cancel();
      }
    },
    [moveThreshold, cancel],
  );

  const onPointerUp = useCallback(() => {
    cancel();
  }, [cancel]);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    /** Whether the long-press just fired (use to suppress click) */
    didFire: () => firedRef.current,
    cancel,
  };
}
