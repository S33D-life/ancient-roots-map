import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Hook to track user interaction for pausing ambient animations.
 * Returns `isInteracting` (true when user is touching/hovering the spiral)
 * and event handlers to attach to the container.
 */
export function useSpiralInteraction() {
  const [isInteracting, setIsInteracting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const startInteraction = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setIsInteracting(true);
  }, []);

  const endInteraction = useCallback(() => {
    clearTimeout(timeoutRef.current);
    // Resume after 2s of inactivity
    timeoutRef.current = setTimeout(() => setIsInteracting(false), 2000);
  }, []);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const interactionProps = {
    onPointerDown: startInteraction,
    onPointerUp: endInteraction,
    onPointerLeave: endInteraction,
    onWheel: () => {
      startInteraction();
      endInteraction();
    },
  };

  return { isInteracting, interactionProps };
}
