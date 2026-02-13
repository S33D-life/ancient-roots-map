import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Shield, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHiveInfo } from "@/utils/hiveUtils";
import type { TokenHistoryEntry } from "@/hooks/use-species-tokens";

interface Props {
  history: TokenHistoryEntry[];
}

type FilterType = "all" | "species_heart" | "influence";

const VaultTokenHistory = ({ history }: Props) => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [familyFilter, setFamilyFilter] = useState<string | null>(null);
  const [treeNames, setTreeNames] = useState<Map<string, string>>(new Map());

  // Fetch tree names for history entries
  useEffect(() => {
    const treeIds = [...new Set(history.map(h => h.tree_id).filter(Boolean))];
    if (treeIds.length === 0) return;
    supabase.from("trees").select("id, name").in("id", treeIds.slice(0, 100)).then(({ data }) => {
      const map = new Map((data || []).map(t => [t.id, t.name]));
      setTreeNames(map);
    });
  }, [history]);

  const families = useMemo(() => {
    const fams = new Set(history.map(h => h.species_family).filter(Boolean) as string[]);
    return [...fams].sort();
  }, [history]);

  const filtered = useMemo(() => {
    let items = history;
    if (filter !== "all") items = items.filter(h => h.type === filter);
    if (familyFilter) items = items.filter(h => h.species_family === familyFilter);
    return items;
  }, [history, filter, familyFilter]);

  if (history.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
      <div className="p-5 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-serif tracking-wide text-foreground flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            Token History
          </h3>
          <span className="text-[10px] font-serif text-muted-foreground">{history.length} events</span>
        </div>

        {/* Type filters */}
        <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
          {([
            { value: "all", label: "All" },
            { value: "species_heart", label: "🌿 Species" },
            { value: "influence", label: "🛡️ Influence" },
          ] as { value: FilterType; label: string }[]).map(f => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "ghost"}
              size="sm"
              className={`text-[10px] h-7 px-2.5 font-serif rounded-full shrink-0 ${
                filter === f.value ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground"
              }`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Family filter chips */}
        {families.length > 1 && (
          <div className="flex gap-1 overflow-x-auto pb-2">
            <Button
              variant={!familyFilter ? "default" : "ghost"}
              size="sm"
              className={`text-[9px] h-6 px-2 font-serif rounded-full shrink-0 ${
                !familyFilter ? "bg-secondary/50 text-foreground" : "text-muted-foreground"
              }`}
              onClick={() => setFamilyFilter(null)}
            >
              All Hives
            </Button>
            {families.map(f => {
              const hive = getHiveInfo(f);
              return (
                <Button
                  key={f}
                  variant={familyFilter === f ? "default" : "ghost"}
                  size="sm"
                  className={`text-[9px] h-6 px-2 font-serif rounded-full shrink-0 ${
                    familyFilter === f ? "bg-secondary/50 text-foreground" : "text-muted-foreground"
                  }`}
                  onClick={() => setFamilyFilter(familyFilter === f ? null : f)}
                >
                  {hive.icon} {f}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      <div className="max-h-64 overflow-y-auto px-5 pb-4 space-y-1">
        <AnimatePresence mode="popLayout">
          {filtered.slice(0, 40).map((entry, i) => {
            const hive = entry.species_family ? getHiveInfo(entry.species_family) : null;
            const isSpecies = entry.type === "species_heart";
            return (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.015 }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-card/60 transition-all"
              >
                <span className="text-sm shrink-0">
                  {isSpecies ? (hive?.icon || "🌿") : "🛡️"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-serif text-foreground truncate">
                    {isSpecies ? `${hive?.displayName || entry.species_family} Hearts` : "Influence"}
                    {" · "}
                    <span className="text-muted-foreground">{entry.action_type}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground font-serif truncate">
                    {treeNames.get(entry.tree_id) || "Tree"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className="text-xs font-serif tabular-nums font-bold"
                    style={{ color: isSpecies ? `hsl(${hive?.accentHsl || "120 45% 50%"})` : "hsl(42, 80%, 50%)" }}
                  >
                    +{entry.amount}
                  </span>
                  <p className="text-[9px] text-muted-foreground font-serif">
                    {new Date(entry.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VaultTokenHistory;
