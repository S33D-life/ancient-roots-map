import { useRef, useCallback } from "react";

interface UseSwipeNavigationOptions {
  items: string[];
  activeItem: string;
  onNavigate: (item: string) => void;
  threshold?: number;
}

export function useSwipeNavigation({
  items,
  activeItem,
  onNavigate,
  threshold = 50,
}: UseSwipeNavigationOptions) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;

      // Only trigger if horizontal swipe is dominant
      if (Math.abs(deltaX) < threshold || Math.abs(deltaY) > Math.abs(deltaX)) {
        touchStartX.current = null;
        touchStartY.current = null;
        return;
      }

      const currentIndex = items.indexOf(activeItem);
      if (currentIndex === -1) return;

      if (deltaX < -threshold && currentIndex < items.length - 1) {
        onNavigate(items[currentIndex + 1]);
      } else if (deltaX > threshold && currentIndex > 0) {
        onNavigate(items[currentIndex - 1]);
      }

      touchStartX.current = null;
      touchStartY.current = null;
    },
    [items, activeItem, onNavigate, threshold]
  );

  return { onTouchStart, onTouchEnd };
}
