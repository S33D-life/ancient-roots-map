/**
 * VaultTokenWallet — Three-layer token wallet with "Explore the Living Economy" CTA.
 * Single source for S33D Hearts, Species Hearts, and Influence balances in the Vault.
 */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Shield, Sparkles, Layers, Clock, ChevronRight, ArrowRight, TreePine } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { getHiveInfo } from "@/utils/hiveUtils";
import type { SpeciesBalance, TokenHistoryEntry } from "@/hooks/use-species-tokens";

type Layer = "global" | "species" | "influence";

interface Props {
  totalHearts: number;
  speciesBalances: SpeciesBalance[];
  totalSpeciesHearts: number;
  globalInfluence: number;
  influenceByHive: Record<string, number>;
  history: TokenHistoryEntry[];
}

const TABS: { id: Layer; label: string; icon: typeof Heart; accent: string }[] = [
  { id: "global", label: "S33D Hearts", icon: Heart, accent: "42 95% 55%" },
  { id: "species", label: "Species Hearts", icon: Sparkles, accent: "150 50% 45%" },
  { id: "influence", label: "Influence", icon: Shield, accent: "42 80% 50%" },
];

const TIER_MAP = [
  { min: 100, label: "Elder Curator" },
  { min: 50, label: "Grove Keeper" },
  { min: 20, label: "Path Walker" },
  { min: 5, label: "Seedling Voice" },
  { min: 0, label: "Observer" },
];

const VaultTokenWallet = ({
  totalHearts,
  speciesBalances,
  totalSpeciesHearts,
  globalInfluence,
  influenceByHive,
  history,
}: Props) => {
  const [active, setActive] = useState<Layer>("global");
  const [selectedHive, setSelectedHive] = useState<string | null>(null);
  const [treeNames, setTreeNames] = useState<Map<string, string>>(new Map());

  const hiveEntries = useMemo(() =>
    Object.entries(influenceByHive)
      .map(([family, amount]) => ({ family, amount, hive: getHiveInfo(family) }))
      .sort((a, b) => b.amount - a.amount),
    [influenceByHive]
  );

  const totalInfluence = globalInfluence + hiveEntries.reduce((s, e) => s + e.amount, 0);
  const tier = TIER_MAP.find(t => totalInfluence >= t.min)?.label || "Observer";

  // Fetch tree names for history
  useEffect(() => {
    const ids = [...new Set(history.map(h => h.tree_id).filter(Boolean))];
    if (!ids.length) return;
    supabase.from("trees").select("id, name").in("id", ids.slice(0, 100)).then(({ data }) => {
      setTreeNames(new Map((data || []).map(t => [t.id, t.name])));
    });
  }, [history]);

  // Filter history based on active layer + selected hive
  const filteredHistory = useMemo(() => {
    let items = history;
    if (active === "species") items = items.filter(h => h.type === "species_heart");
    if (active === "influence") items = items.filter(h => h.type === "influence");
    if (selectedHive) items = items.filter(h => h.species_family === selectedHive);
    return items.slice(0, 30);
  }, [history, active, selectedHive]);

  // Values for each tab
  const values: Record<Layer, number> = {
    global: totalHearts,
    species: totalSpeciesHearts,
    influence: totalInfluence,
  };

  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-2 flex items-center gap-2">
        <Layers className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-serif tracking-wide text-foreground">Your Living Economy</h3>
        <Badge variant="outline" className="text-[9px] font-serif ml-auto border-primary/20">
          3 layers
        </Badge>
      </div>

      {/* Tab bar with values */}
      <div className="px-4 flex gap-1">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActive(tab.id); setSelectedHive(null); }}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-1.5 rounded-xl border transition-all ${
                isActive
                  ? "border-primary/30 bg-primary/5"
                  : "border-transparent hover:bg-secondary/20"
              }`}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: isActive ? `hsl(${tab.accent} / 0.15)` : "hsl(var(--secondary) / 0.4)",
                  boxShadow: isActive ? `0 0 10px hsl(${tab.accent} / 0.2)` : "none",
                }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: isActive ? `hsl(${tab.accent})` : "hsl(var(--muted-foreground))" }} />
              </div>
              <span
                className="text-base font-serif font-bold tabular-nums"
                style={{ color: isActive ? `hsl(${tab.accent})` : "hsl(var(--foreground))" }}
              >
                {values[tab.id].toLocaleString()}
              </span>
              <span className="text-[8px] font-serif text-muted-foreground uppercase tracking-wider leading-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active layer detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active + (selectedHive || "")}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="px-5 pt-3"
        >
          {active === "global" && <GlobalDetail total={totalHearts} />}
          {active === "species" && (
            <SpeciesDetail
              balances={speciesBalances}
              total={totalSpeciesHearts}
              selectedHive={selectedHive}
              onSelectHive={setSelectedHive}
            />
          )}
          {active === "influence" && (
            <InfluenceDetail
              total={totalInfluence}
              global={globalInfluence}
              hiveEntries={hiveEntries}
              tier={tier}
              selectedHive={selectedHive}
              onSelectHive={setSelectedHive}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Inline history feed */}
      {history.length > 0 && (
        <div className="px-5 pb-3 pt-2">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">
              Recent {active === "global" ? "all" : active === "species" ? "species" : "influence"} activity
              {selectedHive && ` · ${getHiveInfo(selectedHive).displayName}`}
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
            <AnimatePresence mode="popLayout">
              {filteredHistory.map((entry, i) => {
                const hive = entry.species_family ? getHiveInfo(entry.species_family) : null;
                const isSpecies = entry.type === "species_heart";
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.01 }}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-card/60 transition-all"
                  >
                    <span className="text-xs shrink-0">{isSpecies ? (hive?.icon || "🌿") : "🛡️"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-serif text-foreground truncate">
                        {isSpecies ? `${hive?.displayName || entry.species_family}` : "Influence"}
                        <span className="text-muted-foreground"> · {entry.action_type}</span>
                      </p>
                      <p className="text-[9px] text-muted-foreground font-serif truncate">
                        {treeNames.get(entry.tree_id) || "Tree"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className="text-[11px] font-serif tabular-nums font-bold"
                        style={{ color: isSpecies ? `hsl(${hive?.accentHsl || "120 45% 50%"})` : "hsl(42, 80%, 50%)" }}
                      >
                        +{entry.amount}
                      </span>
                      <p className="text-[8px] text-muted-foreground font-serif">
                        {new Date(entry.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filteredHistory.length === 0 && (
              <p className="text-[10px] text-muted-foreground/60 font-serif py-3 text-center">
                No activity yet for this layer
              </p>
            )}
          </div>
        </div>
      )}

      {/* ═══ Explore the Living Economy CTA ═══ */}
      <div className="px-5 pb-5 pt-1">
        <Link
          to="/value-tree?tab=economy"
          className="group flex items-center justify-between px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">🌳</span>
            <div>
              <p className="text-xs font-serif text-foreground group-hover:text-primary transition-colors">
                Explore the Living Economy
              </p>
              <p className="text-[9px] font-serif text-muted-foreground">
                See the full Value Tree — 777,777,777 S33D Hearts supply model
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
        </Link>
      </div>
    </div>
  );
};

/* ── Global Detail ── */
const GlobalDetail = ({ total }: { total: number }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-card/20">
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
      style={{
        background: "radial-gradient(circle, hsl(42 95% 55% / 0.2), transparent)",
        boxShadow: "0 0 16px hsl(42 95% 55% / 0.12)",
      }}
    >
      <Heart className="w-5 h-5" style={{ color: "hsl(42, 95%, 55%)" }} />
    </div>
    <div className="min-w-0">
      <p className="text-xl font-serif font-bold tabular-nums" style={{ color: "hsl(42, 95%, 55%)" }}>
        {total.toLocaleString()}
      </p>
      <p className="text-[9px] text-muted-foreground font-serif">
        S33D Hearts · Commons currency · mapping, offerings, milestones & seeds
      </p>
    </div>
  </div>
);

/* ── Species Detail ── */
const SpeciesDetail = ({
  balances, total, selectedHive, onSelectHive,
}: {
  balances: SpeciesBalance[]; total: number;
  selectedHive: string | null; onSelectHive: (f: string | null) => void;
}) => {
  if (balances.length === 0) {
    return (
      <div className="py-3 text-center">
        <span className="text-2xl">🌿</span>
        <p className="text-[10px] text-muted-foreground font-serif mt-1">
          Map trees and make offerings to earn Species Hearts — fractal tokens within each hive
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[9px] text-muted-foreground font-serif">
        {total} Species Hearts · {balances.length} {balances.length === 1 ? "lineage" : "lineages"}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[180px] overflow-y-auto pr-1">
        {balances.map((b, i) => {
          const isSelected = selectedHive === b.family;
          return (
            <motion.button
              key={b.family}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => onSelectHive(isSelected ? null : b.family)}
              className={`flex items-center gap-2 p-2 rounded-xl border transition-all text-left ${
                isSelected
                  ? "border-primary/40 bg-primary/10"
                  : "border-border/30 bg-card/20 hover:border-primary/20"
              }`}
            >
              <span className="text-base">{b.hive.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-serif text-foreground truncate">
                  {b.hive.displayName.replace(" Hive", "")}
                </p>
              </div>
              <span className="text-xs font-serif tabular-nums font-bold" style={{ color: `hsl(${b.hive.accentHsl})` }}>
                {b.amount}
              </span>
            </motion.button>
          );
        })}
      </div>
      {selectedHive && (
        <Link
          to={`/hive/${getHiveInfo(selectedHive).slug}`}
          className="flex items-center gap-1 text-[10px] font-serif text-primary hover:underline"
        >
          View {getHiveInfo(selectedHive).displayName} <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
};

/* ── Influence Detail ── */
const InfluenceDetail = ({
  total, global, hiveEntries, tier, selectedHive, onSelectHive,
}: {
  total: number; global: number;
  hiveEntries: { family: string; amount: number; hive: ReturnType<typeof getHiveInfo> }[];
  tier: string; selectedHive: string | null; onSelectHive: (f: string | null) => void;
}) => (
  <div className="space-y-2.5">
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0"
        style={{
          borderColor: "hsl(42 80% 50% / 0.4)",
          background: "radial-gradient(circle, hsl(42 80% 50% / 0.1), transparent)",
        }}
      >
        <span className="text-sm font-serif font-bold" style={{ color: "hsl(42, 80%, 50%)" }}>{total}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-serif text-foreground">{tier}</p>
        <p className="text-[9px] text-muted-foreground font-serif">
          Influence · Soulbound · {global} global{hiveEntries.length > 0 && `, ${total - global} hive`}
        </p>
      </div>
      <Badge variant="outline" className="text-[8px] font-serif ml-auto shrink-0 border-amber-500/30">
        Non-transferable
      </Badge>
    </div>

    {hiveEntries.length > 0 && (
      <div className="space-y-0.5">
        <p className="text-[9px] text-muted-foreground font-serif uppercase tracking-wider">By Hive</p>
        {hiveEntries.map(e => {
          const isSelected = selectedHive === e.family;
          return (
            <button
              key={e.family}
              onClick={() => onSelectHive(isSelected ? null : e.family)}
              className={`w-full flex items-center gap-2 text-xs font-serif px-2 py-1 rounded-lg transition-all ${
                isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-card/60"
              }`}
            >
              <span>{e.hive.icon}</span>
              <span className="flex-1 text-muted-foreground truncate text-left">{e.hive.displayName}</span>
              <span className="tabular-nums font-bold" style={{ color: `hsl(${e.hive.accentHsl})` }}>{e.amount}</span>
            </button>
          );
        })}
      </div>
    )}
  </div>
);

export default VaultTokenWallet;
