/**
 * YourRootsPanel — User's personal position in the ecosystem,
 * shown on the Value Tree page. Shows S33D Hearts, Species Hearts,
 * Influence, trees mapped, contributions, and active branches.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Heart, Sprout, Shield, TreePine, BookOpen,
  MapPin, Leaf, ArrowRight, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useHeartBalance } from "@/hooks/use-heart-balance";
import { useSpeciesTokens } from "@/hooks/use-species-tokens";
import { VALUE_BRANCHES } from "@/data/s33dEconomy";

interface Props {
  userId: string;
}

const YourRootsPanel = ({ userId }: Props) => {
  const heartBalance = useHeartBalance(userId);
  const speciesTokens = useSpeciesTokens(userId);
  const [contributionCount, setContributionCount] = useState(0);
  const [loadingExtra, setLoadingExtra] = useState(true);

  useEffect(() => {
    supabase
      .from("tree_contributions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .then(({ count }) => {
        setContributionCount(count || 0);
        setLoadingExtra(false);
      });
  }, [userId]);

  const isLoading = heartBalance.loading || speciesTokens.loading || loadingExtra;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center py-8 gap-3">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Leaf className="w-6 h-6 text-primary/40" />
        </motion.div>
        <p className="text-[10px] font-serif text-muted-foreground/50 italic">
          Tracing your roots…
        </p>
      </div>
    );
  }

  const treesMapped = heartBalance.counts.trees;
  const offerings = heartBalance.counts.offerings;

  // Determine which branches the user has activity in
  const activeBranchIds = new Set<string>();
  if (treesMapped > 0) activeBranchIds.add("ancient-friends");
  if (speciesTokens.speciesBalances.length > 0) activeBranchIds.add("species-hives");
  if (speciesTokens.influenceGlobal > 0) activeBranchIds.add("council");
  if (offerings > 0) activeBranchIds.add("seed-library");
  if (contributionCount > 0) activeBranchIds.add("builder-seasons");

  const balanceItems = [
    {
      icon: <Heart className="w-4 h-4" />,
      label: "S33D Hearts",
      value: heartBalance.totalHearts.toLocaleString(),
      color: "hsl(0, 65%, 55%)",
    },
    {
      icon: <Sprout className="w-4 h-4" />,
      label: "Species Hearts",
      value: speciesTokens.totalSpeciesHearts.toLocaleString(),
      color: "hsl(var(--primary))",
    },
    {
      icon: <Shield className="w-4 h-4" />,
      label: "Influence",
      value: speciesTokens.influenceGlobal.toLocaleString(),
      color: "hsl(42, 80%, 50%)",
    },
    {
      icon: <TreePine className="w-3.5 h-3.5" />,
      label: "Trees Mapped",
      value: treesMapped.toLocaleString(),
      color: "hsl(150, 55%, 45%)",
    },
    {
      icon: <MapPin className="w-3.5 h-3.5" />,
      label: "Contributions",
      value: (offerings + contributionCount).toLocaleString(),
      color: "hsl(280, 50%, 55%)",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      <Card className="bg-card/40 backdrop-blur border-border/30 overflow-hidden">
        <div
          className="h-0.5"
          style={{
            background:
              "linear-gradient(90deg, transparent, hsl(150 55% 45% / 0.5), hsl(42 80% 50% / 0.5), transparent)",
          }}
        />
        <CardContent className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "radial-gradient(circle, hsl(150 55% 45% / 0.15), transparent)",
              }}
            >
              <Leaf className="w-4.5 h-4.5" style={{ color: "hsl(150, 55%, 45%)" }} />
            </div>
            <div>
              <h3 className="text-sm font-serif text-foreground tracking-wide">
                Your Roots
              </h3>
              <p className="text-[10px] text-muted-foreground font-serif">
                Your personal position in the living ecosystem
              </p>
            </div>
          </div>

          {/* Balance grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {balanceItems.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-1 py-2.5 px-1.5 rounded-xl border border-border/15 bg-card/20"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${item.color}12` }}
                >
                  <span style={{ color: item.color }}>{item.icon}</span>
                </div>
                <p className="text-sm font-serif font-bold tabular-nums text-foreground">
                  {item.value}
                </p>
                <p className="text-[8px] font-serif text-muted-foreground text-center leading-tight">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          {/* Active branches */}
          {activeBranchIds.size > 0 && (
            <div>
              <p className="text-[10px] font-serif text-muted-foreground/70 uppercase tracking-wider mb-2">
                Your Active Branches
              </p>
              <div className="flex flex-wrap gap-1.5">
                {VALUE_BRANCHES.filter((b) => activeBranchIds.has(b.id)).map((branch) => (
                  <Link
                    key={branch.id}
                    to={branch.link}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/20 bg-card/20 hover:border-primary/30 transition-all text-[10px] font-serif text-muted-foreground hover:text-foreground"
                  >
                    <span className="text-xs">{branch.icon}</span>
                    {branch.label}
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{
                        backgroundColor: branch.color,
                        boxShadow: `0 0 4px ${branch.color}50`,
                      }}
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Vault + Ledger links */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Link
              to="/vault"
              className="group flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border/20 bg-card/20 hover:border-primary/20 transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🏛️</span>
                <p className="text-[11px] font-serif text-muted-foreground group-hover:text-foreground transition-colors">
                  Heartwood Vault
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </Link>
            <Link
              to="/value-tree?tab=economy#ledger"
              className="group flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border/20 bg-card/20 hover:border-primary/20 transition-all"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-[11px] font-serif text-muted-foreground group-hover:text-foreground transition-colors">
                  Heart Flow Ledger
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default YourRootsPanel;
