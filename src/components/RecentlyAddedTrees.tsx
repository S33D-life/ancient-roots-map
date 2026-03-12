/**
 * RecentlyAddedTrees — Floating panel for map showing the most recently mapped Ancient Friends.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TreeDeciduous, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface RecentTree {
  id: string;
  name: string;
  species: string | null;
  created_at: string;
}

export default function RecentlyAddedTrees({ onTreeClick }: { onTreeClick?: (treeId: string) => void }) {
  const [trees, setTrees] = useState<RecentTree[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("trees")
      .select("id, name, species, created_at")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setTrees(data || []));
  }, []);

  if (!trees.length) return null;

  return (
    <div className="absolute bottom-24 sm:bottom-20 left-3 z-[15] max-w-[220px]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-serif backdrop-blur-md border transition-colors"
        style={{
          background: "hsl(var(--card) / 0.8)",
          borderColor: "hsl(var(--border) / 0.4)",
          color: "hsl(var(--foreground) / 0.8)",
        }}
      >
        <TreeDeciduous className="w-3 h-3 text-emerald-400" />
        Recently Added
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5 rounded-xl border p-2 space-y-1 backdrop-blur-md"
            style={{
              background: "hsl(var(--card) / 0.9)",
              borderColor: "hsl(var(--border) / 0.4)",
            }}
          >
            {trees.map((t) => (
              <button
                key={t.id}
                onClick={() => onTreeClick?.(t.id)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-secondary/30 transition-colors"
              >
                <p className="text-[11px] font-serif text-foreground/85 truncate">{t.name}</p>
                <div className="flex items-center gap-2 text-[9px] text-muted-foreground/60 font-mono">
                  {t.species && <span className="italic truncate">{t.species}</span>}
                  <span>{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
