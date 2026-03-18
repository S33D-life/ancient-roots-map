/**
 * MapTreePanel — Combined floating panel (top-right) with two tabs:
 *   "Recent" (recently added trees) and "Nearby" (trees awaiting visits).
 *   Hides when the map's clear-view (eye) toggle is active.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TreeDeciduous, Compass, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface TreeItem {
  id: string;
  name: string;
  species: string | null;
  created_at: string;
}

type Tab = "recent" | "nearby";

export default function MapTreePanel({ onTreeClick }: { onTreeClick?: (treeId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("recent");
  const [recentTrees, setRecentTrees] = useState<TreeItem[]>([]);
  const [nearbyTrees, setNearbyTrees] = useState<TreeItem[]>([]);
  const [hidden, setHidden] = useState(false);

  // Listen for clear-view toggle from the map
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setHidden(!!detail?.clearView);
    };
    window.addEventListener("s33d-clear-view", handler);
    return () => window.removeEventListener("s33d-clear-view", handler);
  }, []);

  useEffect(() => {
    supabase
      .from("trees")
      .select("id, name, species, created_at")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setRecentTrees(data || []));
  }, []);

  useEffect(() => {
    const fetchAwaiting = async () => {
      const { data: candidates } = await supabase
        .from("trees")
        .select("id, name, species, created_at")
        .order("created_at", { ascending: false })
        .limit(30);

      if (!candidates?.length) return;

      const awaiting: TreeItem[] = [];
      for (const tree of candidates) {
        if (awaiting.length >= 5) break;
        const { count } = await supabase
          .from("offerings")
          .select("*", { count: "exact", head: true })
          .eq("tree_id", tree.id);
        if ((count || 0) === 0) awaiting.push(tree);
      }
      setNearbyTrees(awaiting);
    };
    fetchAwaiting();
  }, []);

  const trees = tab === "recent" ? recentTrees : nearbyTrees;

  if (hidden || (!recentTrees.length && !nearbyTrees.length)) return null;

  return (
    <div
      className="absolute right-3 z-[15] max-w-[240px]"
      style={{ top: "calc(var(--header-height, 3.5rem) + env(safe-area-inset-top, 0px) + 3.5rem)" }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-serif backdrop-blur-md border transition-colors active:scale-95 ml-auto"
        style={{
          background: "hsl(var(--card) / 0.85)",
          borderColor: "hsl(var(--border) / 0.4)",
          color: "hsl(var(--foreground) / 0.8)",
        }}
      >
        {tab === "recent" ? (
          <TreeDeciduous className="w-3 h-3 text-emerald-400" />
        ) : (
          <Compass className="w-3 h-3 text-primary/70" />
        )}
        {tab === "recent" ? "Recently Added" : "Awaiting Visits"}
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5 rounded-xl border backdrop-blur-md overflow-hidden"
            style={{
              background: "hsl(var(--card) / 0.92)",
              borderColor: "hsl(var(--border) / 0.4)",
            }}
          >
            {/* Tabs */}
            <div
              className="flex border-b"
              style={{ borderColor: "hsl(var(--border) / 0.3)" }}
            >
              <TabButton
                active={tab === "recent"}
                onClick={() => setTab("recent")}
                icon={<TreeDeciduous className="w-3 h-3" />}
                label="Recent"
                count={recentTrees.length}
              />
              <TabButton
                active={tab === "nearby"}
                onClick={() => setTab("nearby")}
                icon={<Compass className="w-3 h-3" />}
                label="Nearby"
                count={nearbyTrees.length}
              />
            </div>

            {/* Tree list */}
            <div className="p-1.5 space-y-0.5 max-h-[240px] overflow-y-auto">
              {tab === "nearby" && nearbyTrees.length > 0 && (
                <p className="text-[9px] font-serif text-muted-foreground/50 px-2 py-1">
                  These trees have no offerings yet
                </p>
              )}
              {trees.length === 0 ? (
                <p className="text-[10px] font-serif text-muted-foreground/50 text-center py-4 italic">
                  {tab === "recent" ? "No trees yet" : "All trees have offerings!"}
                </p>
              ) : (
                trees.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onTreeClick?.(t.id)}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-secondary/30 active:bg-secondary/40 transition-colors min-h-[44px]"
                  >
                    <p className="text-[11px] font-serif text-foreground/85 truncate">{t.name}</p>
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground/60 font-mono">
                      {t.species && <span className="italic truncate">{t.species}</span>}
                      <span>{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-serif transition-colors"
      style={{
        color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.6)",
        borderBottom: active ? "2px solid hsl(var(--primary))" : "2px solid transparent",
        background: active ? "hsl(var(--primary) / 0.05)" : "transparent",
      }}
    >
      {icon}
      {label}
      {count > 0 && (
        <span
          className="text-[8px] px-1 rounded-full"
          style={{
            background: active ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted) / 0.5)",
            color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.6)",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
