/**
 * OfflineSyncBanner — shows pending offline tree submissions
 * and syncs them when connectivity returns.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Upload, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/config/env";
import { getPendingTrees, removePendingTree, pendingCount, PendingTree } from "@/utils/offlineQueue";
import { toast } from "sonner";

const OfflineSyncBanner = () => {
  const [count, setCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  const refreshCount = useCallback(async () => {
    try {
      const c = await pendingCount();
      setCount(c);
    } catch {
      // IndexedDB not available
    }
  }, []);

  useEffect(() => {
    refreshCount();

    const handleOnline = () => {
      setOnline(true);
      syncPending();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check periodically
    const interval = setInterval(refreshCount, 10_000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [refreshCount]);

  const syncPending = useCallback(async () => {
    if (syncing || !isSupabaseConfigured) return;
    setSyncing(true);

    try {
      const pending = await getPendingTrees();
      if (pending.length === 0) {
        setSyncing(false);
        return;
      }

      let synced = 0;
      for (const tree of pending) {
        try {
          // Upload photo if present
          let photoUrl: string | null = null;
          if (tree.photo_data_url) {
            const blob = await fetch(tree.photo_data_url).then(r => r.blob());
            const fileName = `${tree.created_by || "anon"}/${tree.id}.jpg`;
            const { data: uploadData } = await supabase.storage
              .from("offerings")
              .upload(fileName, blob, { contentType: "image/jpeg" });
            if (uploadData) {
              const { data: urlData } = supabase.storage
                .from("offerings")
                .getPublicUrl(uploadData.path);
              photoUrl = urlData.publicUrl;
            }
          }

          // Insert tree
          const { error } = await supabase.from("trees").insert({
            name: tree.name,
            species: tree.species,
            latitude: tree.latitude,
            longitude: tree.longitude,
            what3words: tree.what3words,
            description: tree.description,
            created_by: tree.created_by,
          });

          if (!error) {
            await removePendingTree(tree.id);
            synced++;
            // Dispatch celebration event
            window.dispatchEvent(new CustomEvent("tree-created", { detail: { treeName: tree.name, species: tree.species } }));
          }
        } catch (err) {
          console.error("Sync failed for tree:", tree.id, err);
        }
      }

      if (synced > 0) {
        toast.success(`🌿 Synced ${synced} offline tree${synced !== 1 ? "s" : ""}!`);
      }
      await refreshCount();
    } finally {
      setSyncing(false);
    }
  }, [syncing, refreshCount]);

  // Auto-sync when coming online
  useEffect(() => {
    if (online && count > 0) {
      syncPending();
    }
  }, [online, count]);

  if (count === 0 && online) return null;

  return (
    <AnimatePresence>
      {(count > 0 || !online) && (
        <motion.div
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[65]"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full border shadow-lg backdrop-blur-lg text-xs font-serif"
            style={{
              background: online ? "hsl(var(--card) / 0.95)" : "hsl(var(--destructive) / 0.15)",
              borderColor: online ? "hsl(var(--border))" : "hsl(var(--destructive) / 0.3)",
              color: online ? "hsl(var(--foreground))" : "hsl(var(--destructive))",
            }}
          >
            {!online ? (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline{count > 0 ? ` · ${count} queued` : ""}</span>
              </>
            ) : syncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing {count} tree{count !== 1 ? "s" : ""}…</span>
              </>
            ) : count > 0 ? (
              <button onClick={syncPending} className="flex items-center gap-2">
                <Upload className="w-3.5 h-3.5" />
                <span>{count} tree{count !== 1 ? "s" : ""} ready to sync</span>
              </button>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineSyncBanner;
