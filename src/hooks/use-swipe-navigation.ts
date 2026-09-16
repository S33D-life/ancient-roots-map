import { useRef, useCallback, useState } from "react";

interface UseSwipeNavigationOptions {
  items: string[];
  activeItem: string;
  onNavigate: (item: string) => void;
  threshold?: number;
  /**
   * If set, room-navigation swipe only triggers when the touch starts
   * within the top `zoneTopPercent`% of the viewport.
   * Swipes outside the zone produce a "blocked" callback instead.
   */
  zoneTopPercent?: number;
  axis?: "horizontal" | "vertical";
}

export function useSwipeNavigation({
  items,
  activeItem,
  onNavigate,
  threshold = 50,
  zoneTopPercent,
  axis = "horizontal",
}: UseSwipeNavigationOptions) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartScreenY = useRef<number | null>(null);
  const [blockedHint, setBlockedHint] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartScreenY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      const startY = touchStartScreenY.current ?? 0;

      // Reset refs
      touchStartX.current = null;
      touchStartY.current = null;
      touchStartScreenY.current = null;

      const primaryDelta = axis === "vertical" ? deltaY : deltaX;
      const crossDelta = axis === "vertical" ? deltaX : deltaY;

      // Only trigger when the configured direction is dominant.
      if (Math.abs(primaryDelta) < threshold || Math.abs(crossDelta) > Math.abs(primaryDelta)) {
        return;
      }

      // Zone restriction: only allow if touch started in top zone
      if (zoneTopPercent != null) {
        const zoneCutoff = window.innerHeight * (zoneTopPercent / 100);
        if (startY > zoneCutoff) {
          // Blocked — show hint briefly
          setBlockedHint(true);
          setTimeout(() => setBlockedHint(false), 2400);
          return;
        }
      }

      const currentIndex = items.indexOf(activeItem);
      if (currentIndex === -1) return;

      if (primaryDelta < -threshold && currentIndex < items.length - 1) {
        onNavigate(items[currentIndex + 1]);
      } else if (primaryDelta > threshold && currentIndex > 0) {
        onNavigate(items[currentIndex - 1]);
      }
    },
    [items, activeItem, onNavigate, threshold, zoneTopPercent, axis]
  );

  return { onTouchStart, onTouchEnd, blockedHint };
}
