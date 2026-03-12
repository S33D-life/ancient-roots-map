/**
 * VaultEconomyBridge — Economy summary + "Explore the Living Economy" link
 * displayed inside the Heartwood Vault. Connects personal roots to the forest canopy.
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, Sprout, Shield, ArrowRight, Leaf, BookOpen } from "lucide-react";
import { useHeartBalance } from "@/hooks/use-heart-balance";
import { useSpeciesTokens } from "@/hooks/use-species-tokens";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

interface Props {
  userId: string;
}

const VaultEconomyBridge = ({ userId }: Props) => {
  const heartBalance = useHeartBalance(userId);
  const speciesTokens = useSpeciesTokens(userId);

  const stats = [
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
  ];

  // Last 5 combined heart + species + influence activity
  const recentActivity = speciesTokens.history.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="bg-card/40 backdrop-blur border-border/30 overflow-hidden">
        {/* Gold accent line */}
        <div
          className="h-0.5"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(42 80% 50% / 0.6), hsl(0 65% 55% / 0.4), transparent)",
          }}
        />
        <CardContent className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "radial-gradient(circle, hsl(42 80% 50% / 0.15), transparent)" }}
            >
              <Leaf className="w-4.5 h-4.5" style={{ color: "hsl(42, 80%, 50%)" }} />
            </div>
            <div>
              <h3 className="text-sm font-serif text-foreground tracking-wide">Your Living Economy</h3>
              <p className="text-[10px] text-muted-foreground font-serif">
                Your roots in the S33D ecosystem
              </p>
            </div>
          </div>

          {/* Three-column balance */}
          <div className="grid grid-cols-3 gap-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl border border-border/20 bg-card/30"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${s.color}12` }}
                >
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
                <p className="text-sm font-serif font-bold tabular-nums text-foreground">
                  {s.value}
                </p>
                <p className="text-[8px] font-serif text-muted-foreground text-center leading-tight">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div>
              <p className="text-[10px] font-serif text-muted-foreground/70 uppercase tracking-wider mb-2">
                Recent Heart Activity
              </p>
              <div className="space-y-1">
                {recentActivity.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-card/20 border border-border/10"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs">
                        {entry.type === "species_heart" ? "🌿" : "🛡️"}
                      </span>
                      <span className="text-[10px] font-serif text-muted-foreground truncate">
                        {entry.action_type.replace(/_/g, " ")}
                        {entry.species_family ? ` · ${entry.species_family}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-[11px] font-serif font-bold tabular-nums"
                        style={{
                          color: entry.type === "species_heart"
                            ? "hsl(var(--primary))"
                            : "hsl(42, 80%, 50%)",
                        }}
                      >
                        +{entry.amount}
                      </span>
                      <span className="text-[9px] text-muted-foreground/50 font-serif">
                        {format(new Date(entry.created_at), "MMM d")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {recentActivity.length === 0 && !speciesTokens.loading && (
            <p className="text-[10px] font-serif text-muted-foreground/50 italic text-center py-2">
              This branch is waiting for its first flow.
            </p>
          )}

          {/* CTA Links */}
          <div className="flex flex-col gap-2 pt-1">
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
                    See the full Value Tree and 777M supply model
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
            </Link>

            <Link
              to="/value-tree?tab=economy#ledger"
              className="group flex items-center justify-between px-4 py-2.5 rounded-xl border border-border/20 bg-card/20 hover:border-primary/20 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-[11px] font-serif text-muted-foreground group-hover:text-foreground transition-colors">
                  Open Heart Flow Ledger
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default VaultEconomyBridge;
