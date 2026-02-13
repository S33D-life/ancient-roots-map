import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Shield, Sparkles, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { getHiveInfo } from "@/utils/hiveUtils";
import type { SpeciesBalance } from "@/hooks/use-species-tokens";

type Layer = "global" | "species" | "influence";

interface Props {
  /** S33D Hearts (global) */
  totalHearts: number;
  /** Species token balances */
  speciesBalances: SpeciesBalance[];
  totalSpeciesHearts: number;
  /** Influence */
  globalInfluence: number;
  influenceByHive: Record<string, number>;
}

const TABS: { id: Layer; label: string; icon: typeof Heart; accent: string }[] = [
  { id: "global", label: "S33D Hearts", icon: Heart, accent: "42 95% 55%" },
  { id: "species", label: "Species Hearts", icon: Sparkles, accent: "150 50% 45%" },
  { id: "influence", label: "Influence", icon: Shield, accent: "42 80% 50%" },
];

const VaultTokenLayers = ({
  totalHearts,
  speciesBalances,
  totalSpeciesHearts,
  globalInfluence,
  influenceByHive,
}: Props) => {
  const [active, setActive] = useState<Layer>("global");

  const hiveEntries = Object.entries(influenceByHive)
    .map(([family, amount]) => ({ family, amount, hive: getHiveInfo(family) }))
    .sort((a, b) => b.amount - a.amount);
  const totalInfluence = globalInfluence + hiveEntries.reduce((s, e) => s + e.amount, 0);

  const tier =
    totalInfluence >= 100 ? "Elder Curator" :
    totalInfluence >= 50 ? "Grove Keeper" :
    totalInfluence >= 20 ? "Path Walker" :
    totalInfluence >= 5 ? "Seedling Voice" : "Observer";

  return (
    <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-2">
        <Layers className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-serif tracking-wide text-foreground">Token Vault</h3>
        <span className="text-[10px] text-muted-foreground font-serif ml-auto">3 layers</span>
      </div>

      {/* Tab bar */}
      <div className="px-5 flex gap-1.5">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          const Icon = tab.icon;
          const value = tab.id === "global" ? totalHearts :
            tab.id === "species" ? totalSpeciesHearts : totalInfluence;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-all text-center ${
                isActive
                  ? "border-primary/30 bg-primary/5"
                  : "border-transparent hover:bg-secondary/20"
              }`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: isActive ? `hsl(${tab.accent} / 0.15)` : "hsl(var(--secondary) / 0.4)",
                  boxShadow: isActive ? `0 0 12px hsl(${tab.accent} / 0.2)` : "none",
                }}
              >
                <Icon className="w-4 h-4" style={{ color: isActive ? `hsl(${tab.accent})` : "hsl(var(--muted-foreground))" }} />
              </div>
              <span
                className="text-lg font-serif font-bold tabular-nums"
                style={{ color: isActive ? `hsl(${tab.accent})` : "hsl(var(--foreground))" }}
              >
                {value}
              </span>
              <span className="text-[9px] font-serif text-muted-foreground uppercase tracking-wider leading-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="px-5 pb-5 pt-3"
        >
          {active === "global" && <GlobalPanel total={totalHearts} />}
          {active === "species" && (
            <SpeciesPanel balances={speciesBalances} total={totalSpeciesHearts} />
          )}
          {active === "influence" && (
            <InfluencePanel
              total={totalInfluence}
              global={globalInfluence}
              hiveEntries={hiveEntries}
              tier={tier}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ── Global Panel ── */
const GlobalPanel = ({ total }: { total: number }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card/30">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: "radial-gradient(circle, hsl(42 95% 55% / 0.2), transparent)",
          boxShadow: "0 0 20px hsl(42 95% 55% / 0.15)",
        }}
      >
        <Heart className="w-6 h-6" style={{ color: "hsl(42, 95%, 55%)" }} />
      </div>
      <div>
        <p className="text-2xl font-serif font-bold tabular-nums" style={{ color: "hsl(42, 95%, 55%)" }}>
          {total.toLocaleString()}
        </p>
        <p className="text-[10px] text-muted-foreground font-serif">
          Global currency earned from mapping, offerings & milestones
        </p>
      </div>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {["Tree mapping", "Offerings", "Milestones", "Seed economy", "Windfalls"].map(src => (
        <Badge key={src} variant="secondary" className="text-[9px] font-serif">{src}</Badge>
      ))}
    </div>
    <p className="text-[10px] text-muted-foreground/60 font-serif">
      S33D Hearts flow through the entire ecosystem — used for minting, staking, lotteries & unlocks.
    </p>
  </div>
);

/* ── Species Panel ── */
const SpeciesPanel = ({ balances, total }: { balances: SpeciesBalance[]; total: number }) => {
  if (balances.length === 0) {
    return (
      <div className="py-4 text-center">
        <span className="text-3xl">🌿</span>
        <p className="text-xs text-muted-foreground font-serif mt-2">
          Map trees and make offerings to earn Species Hearts — fractal tokens tied to each botanical family.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-muted-foreground font-serif">
        {total} fractal hearts across {balances.length} {balances.length === 1 ? "lineage" : "lineages"}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
        {balances.map((b, i) => (
          <motion.div
            key={b.family}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Link
              to={`/hive/${b.hive.slug}`}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/40 bg-card/30 hover:border-primary/30 hover:bg-card/60 transition-all group"
            >
              <span className="text-xl">{b.hive.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-serif text-foreground truncate group-hover:text-primary transition-colors">
                  {b.hive.displayName.replace(" Hive", "")}
                </p>
              </div>
              <span className="text-sm font-serif tabular-nums font-bold" style={{ color: `hsl(${b.hive.accentHsl})` }}>
                {b.amount}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

/* ── Influence Panel ── */
const InfluencePanel = ({
  total,
  global,
  hiveEntries,
  tier,
}: {
  total: number;
  global: number;
  hiveEntries: { family: string; amount: number; hive: ReturnType<typeof getHiveInfo> }[];
  tier: string;
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-3">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center border-2 shrink-0"
        style={{
          borderColor: "hsl(42 80% 50% / 0.4)",
          background: "radial-gradient(circle, hsl(42 80% 50% / 0.1), transparent)",
        }}
      >
        <span className="text-lg font-serif font-bold" style={{ color: "hsl(42, 80%, 50%)" }}>{total}</span>
      </div>
      <div>
        <p className="text-sm font-serif text-foreground">{tier}</p>
        <p className="text-[10px] text-muted-foreground font-serif">
          Soulbound curation reputation
          {global > 0 && ` · ${global} global, ${total - global} hive`}
        </p>
      </div>
      <Badge variant="outline" className="text-[9px] font-serif ml-auto shrink-0" style={{ borderColor: "hsl(42 80% 50% / 0.4)" }}>
        Soulbound
      </Badge>
    </div>

    {/* Earned by */}
    <div className="flex flex-wrap gap-1.5">
      {["Verify trees", "Add metadata", "Quality media", "Curate playlists", "Resolve duplicates"].map(a => (
        <Badge key={a} variant="secondary" className="text-[9px] font-serif">{a}</Badge>
      ))}
    </div>

    {/* Per-hive */}
    {hiveEntries.length > 0 && (
      <div className="border-t border-border/30 pt-2 space-y-1">
        <p className="text-[10px] text-muted-foreground font-serif uppercase tracking-wider">By Hive</p>
        {hiveEntries.map(e => (
          <div key={e.family} className="flex items-center gap-2 text-xs font-serif">
            <span>{e.hive.icon}</span>
            <span className="flex-1 text-muted-foreground truncate">{e.hive.displayName}</span>
            <span className="tabular-nums" style={{ color: `hsl(${e.hive.accentHsl})` }}>{e.amount}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default VaultTokenLayers;
