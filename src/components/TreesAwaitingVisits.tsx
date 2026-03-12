/**
 * TreesAwaitingVisits — Floating map panel showing trees that need attention.
 * Shows trees with few/no offerings to encourage engagement.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Compass, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface AwaitingTree {
  id: string;
  name: string;
  species: string | null;
  created_at: string;
}

export default function TreesAwaitingVisits({ onTreeClick }: { onTreeClick?: (id: string) => void }) {
  const [trees, setTrees] = useState<AwaitingTree[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchAwaiting = async () => {
      // Fetch recent trees, then check which have 0 offerings
      const { data: recentTrees } = await supabase
        .from("trees")
        .select("id, name, species, created_at")
        .order("created_at", { ascending: false })
        .limit(30);

      if (!recentTrees?.length) return;

      const awaiting: AwaitingTree[] = [];
      for (const tree of recentTrees) {
        if (awaiting.length >= 5) break;
        const { count } = await supabase
          .from("offerings")
          .select("*", { count: "exact", head: true })
          .eq("tree_id", tree.id);
        if ((count || 0) === 0) {
          awaiting.push(tree);
        }
      }
      setTrees(awaiting);
    };
    fetchAwaiting();
  }, []);

  if (!trees.length) return null;

  return (
    <div className="absolute bottom-24 sm:bottom-20 right-3 z-[15] max-w-[220px]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-serif backdrop-blur-md border transition-colors active:scale-95"
        style={{
          background: "hsl(var(--card) / 0.8)",
          borderColor: "hsl(var(--border) / 0.4)",
          color: "hsl(var(--foreground) / 0.8)",
        }}
      >
        <Compass className="w-3 h-3 text-primary/70" />
        Awaiting Visits
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
            <p className="text-[9px] font-serif text-muted-foreground/50 px-2 py-1">
              These trees have no offerings yet
            </p>
            {trees.map((t) => (
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
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
