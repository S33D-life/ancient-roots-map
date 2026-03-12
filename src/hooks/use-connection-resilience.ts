/**
 * useConnectionResilience — monitors online/offline state and shows
 * reconnection toasts. Prevents the app from silently failing on 
 * intermittent connections.
 */
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function useConnectionResilience() {
  const wasOffline = useRef(false);

  useEffect(() => {
    const handleOffline = () => {
      wasOffline.current = true;
      toast.warning("You're offline", {
        description: "Changes will sync when you reconnect.",
        duration: Infinity,
        id: "offline-status",
      });
    };

    const handleOnline = () => {
      toast.dismiss("offline-status");
      if (wasOffline.current) {
        toast.success("Back online", {
          description: "Reconnected — your data is syncing.",
          duration: 3000,
          id: "online-status",
        });
        wasOffline.current = false;
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // Check initial state
    if (!navigator.onLine) handleOffline();

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);
}
