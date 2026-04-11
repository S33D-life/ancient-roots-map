/**
 * OfflineEncounterPanel — Shows queued offline encounters with sync state.
 * Provides visual feedback for each queued item and manual retry.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Upload, Loader2, CheckCircle2, AlertTriangle, TreeDeciduous, Camera, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAllActions, type PendingAction, type SyncStatus } from "@/utils/offlineSync";
import { runSync } from "@/utils/syncEngine";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG: Record<SyncStatus, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: "hsl(42 80% 55%)", label: "Queued" },
  syncing: { icon: Loader2, color: "hsl(200 70% 55%)", label: "Syncing…" },
  synced: { icon: CheckCircle2, color: "hsl(140 50% 50%)", label: "Synced" },
  failed: { icon: AlertTriangle, color: "hsl(0 65% 55%)", label: "Failed" },
};

const TYPE_ICONS = {
  tree: TreeDeciduous,
  offering: Camera,
  checkin: TreeDeciduous,
  note: FileText,
};

export default function OfflineEncounterPanel() {
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const all = await getAllActions();
      setActions(all.sort((a, b) => b.queuedAt.localeCompare(a.queuedAt)));
    } catch { /* IndexedDB unavailable */ }
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("s33d-queue-change", handler);
    return () => window.removeEventListener("s33d-queue-change", handler);
  }, [refresh]);

  const handleSync = async () => {
    setSyncing(true);
    await runSync();
    await refresh();
    setSyncing(false);
  };

  const pending = actions.filter(a => a.status !== "synced");
  if (pending.length === 0) return null;

  return (
    <Card className="border-primary/15 bg-card/60 backdrop-blur-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-serif font-medium text-foreground">
              Offline Encounters ({pending.length})
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing || !navigator.onLine}
            className="text-xs gap-1.5"
          >
            {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            {syncing ? "Syncing…" : "Sync Now"}
          </Button>
        </div>

        <AnimatePresence>
          {pending.map((action) => {
            const config = STATUS_CONFIG[action.status];
            const TypeIcon = TYPE_ICONS[action.type] || FileText;
            const StatusIcon = config.icon;

            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 py-2 px-2 rounded-lg bg-background/40"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `${config.color}15` }}
                >
                  <TypeIcon className="w-3.5 h-3.5" style={{ color: config.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-serif text-foreground truncate">{action.label}</p>
                  <p className="text-[10px] text-muted-foreground/60">
                    {formatDistanceToNow(new Date(action.queuedAt), { addSuffix: true })}
                    {action.lastError && ` · ${action.lastError}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <StatusIcon
                    className={`w-3.5 h-3.5 ${action.status === "syncing" ? "animate-spin" : ""}`}
                    style={{ color: config.color }}
                  />
                  <span className="text-[10px] font-serif" style={{ color: config.color }}>
                    {config.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {!navigator.onLine && (
          <p className="text-[10px] text-muted-foreground/50 text-center font-serif">
            Your encounters are safely held — they'll sync when you reconnect.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
