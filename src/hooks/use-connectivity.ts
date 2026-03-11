/**
 * useConnectivity — reactive online/offline state with pending action counts.
 *
 * Features:
 * - Debounced online/offline transitions (prevents flicker)
 * - "reconnecting" transitional state
 * - Last-synced timestamp
 * - Efficient event-driven updates
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { pendingActionCount, countByType, failedActionCount, type PendingActionType } from "@/utils/offlineSync";

export type ConnectivityStatus = "online" | "offline" | "reconnecting";

export interface ConnectivityState {
  online: boolean;
  status: ConnectivityStatus;
  pendingCount: number;
  failedCount: number;
  pendingByType: Record<PendingActionType, number>;
  lastSyncedAt: string | null;
  refreshCounts: () => Promise<void>;
}

const DEBOUNCE_MS = 800; // debounce online/offline transitions
const RECONNECTING_DURATION_MS = 3000; // show "reconnecting" briefly

export function useConnectivity(): ConnectivityState {
  const [status, setStatus] = useState<ConnectivityStatus>(
    navigator.onLine ? "online" : "offline"
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [pendingByType, setPendingByType] = useState<Record<PendingActionType, number>>({
    tree: 0, offering: 0, checkin: 0, note: 0,
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    () => localStorage.getItem("s33d_last_synced")
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOfflineRef = useRef(!navigator.onLine);

  const refreshCounts = useCallback(async () => {
    try {
      const [count, byType, failed] = await Promise.all([
        pendingActionCount(),
        countByType(),
        failedActionCount(),
      ]);
      setPendingCount(count);
      setPendingByType(byType);
      setFailedCount(failed);
    } catch {
      // IndexedDB unavailable — silent
    }
  }, []);

  // Update last synced timestamp when counts drop
  useEffect(() => {
    if (pendingCount === 0 && status === "online") {
      const now = new Date().toISOString();
      setLastSyncedAt(now);
      localStorage.setItem("s33d_last_synced", now);
    }
  }, [pendingCount, status]);

  useEffect(() => {
    const handleOnline = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (!navigator.onLine) return; // false positive

        if (wasOfflineRef.current) {
          // Transitional reconnecting state
          setStatus("reconnecting");
          reconnectTimerRef.current = setTimeout(() => {
            if (navigator.onLine) {
              setStatus("online");
            }
          }, RECONNECTING_DURATION_MS);
        } else {
          setStatus("online");
        }
        wasOfflineRef.current = false;
      }, DEBOUNCE_MS);
    };

    const handleOffline = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);

      debounceRef.current = setTimeout(() => {
        if (navigator.onLine) return; // false positive
        wasOfflineRef.current = true;
        setStatus("offline");
      }, DEBOUNCE_MS);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for queue changes (custom event from sync engine)
    const onQueueChange = () => refreshCounts();
    window.addEventListener("s33d-queue-change", onQueueChange);

    refreshCounts();
    const interval = setInterval(refreshCounts, 30_000); // reduced from 15s

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("s33d-queue-change", onQueueChange);
      clearInterval(interval);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [refreshCounts]);

  return {
    online: status !== "offline",
    status,
    pendingCount,
    failedCount,
    pendingByType,
    lastSyncedAt,
    refreshCounts,
  };
}
