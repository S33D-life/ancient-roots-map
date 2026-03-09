/**
 * useConnectivity — reactive online/offline state with pending action counts.
 */
import { useState, useEffect, useCallback } from "react";
import { pendingActionCount, countByType, type PendingActionType } from "@/utils/offlineSync";

export interface ConnectivityState {
  online: boolean;
  pendingCount: number;
  pendingByType: Record<PendingActionType, number>;
  refreshCounts: () => Promise<void>;
}

export function useConnectivity(): ConnectivityState {
  const [online, setOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingByType, setPendingByType] = useState<Record<PendingActionType, number>>({
    tree: 0, offering: 0, checkin: 0, note: 0,
  });

  const refreshCounts = useCallback(async () => {
    try {
      const [count, byType] = await Promise.all([
        pendingActionCount(),
        countByType(),
      ]);
      setPendingCount(count);
      setPendingByType(byType);
    } catch {
      // IndexedDB unavailable
    }
  }, []);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    // Listen for queue changes (custom event from sync engine)
    const onQueueChange = () => refreshCounts();
    window.addEventListener("s33d-queue-change", onQueueChange);

    refreshCounts();
    const interval = setInterval(refreshCounts, 15_000);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("s33d-queue-change", onQueueChange);
      clearInterval(interval);
    };
  }, [refreshCounts]);

  return { online, pendingCount, pendingByType, refreshCounts };
}
