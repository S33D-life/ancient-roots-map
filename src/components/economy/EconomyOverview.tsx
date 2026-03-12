/**
 * EconomyOverview — Full living economy tab for the Value Tree page.
 * Combines Distribution Compass, channel details, emission curve, and live data.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Shield, Sprout, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CHANNELS, TOTAL_SUPPLY, VALUE_BRANCHES, type DistributionChannel } from "@/data/s33dEconomy";
import DistributionCompass from "./DistributionCompass";
import EmissionCurve from "./EmissionCurve";

interface LiveStats {
  totalHeartsMinted: number;
  totalSpeciesHearts: number;
  totalInfluence: number;
  totalTrees: number;
}

const EconomyOverview = () => {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const [heartsRes, speciesRes, influenceRes, treesRes] = await Promise.all([
      supabase.from("heart_transactions").select("amount"),
      supabase.from("species_heart_transactions").select("amount"),
      supabase.from("influence_transactions").select("amount"),
      supabase.from("trees").select("id", { count: "exact", head: true }),
    ]);

    const totalHeartsMinted = (heartsRes.data || []).reduce((s, r) => s + (r.amount || 0), 0);
    const totalSpeciesHearts = (speciesRes.data || []).reduce((s, r) => s + (r.amount || 0), 0);
    const totalInfluence = (influenceRes.data || []).reduce((s, r) => s + (r.amount || 0), 0);

    setStats({
      totalHeartsMinted,
      totalSpeciesHearts,
      totalInfluence,
      totalTrees: treesRes.count || 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Hero: Three-Layer Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <p className="text-sm font-serif text-muted-foreground italic max-w-md mx-auto">
          Energy → Value → Wisdom — three layers interacting like a living forest.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {[
            {
              icon: <Heart className="w-4 h-4" />,
              label: "Hearts Minted",
              value: stats?.totalHeartsMinted.toLocaleString() || "0",
              color: "hsl(0, 65%, 55%)",
            },
            {
              icon: <Sprout className="w-4 h-4" />,
              label: "Species Hearts",
              value: stats?.totalSpeciesHearts.toLocaleString() || "0",
              color: "hsl(var(--primary))",
            },
            {
              icon: <Shield className="w-4 h-4" />,
              label: "Influence Minted",
              value: stats?.totalInfluence.toLocaleString() || "0",
              color: "hsl(42, 80%, 50%)",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <span style={{ color: item.color }}>{item.icon}</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-serif font-bold tabular-nums text-foreground">
                  {item.value}
                </p>
                <p className="text-[9px] font-serif text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Distribution Compass */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="text-center">
          <h3 className="text-lg font-serif text-foreground">The Living Compass</h3>
          <p className="text-[11px] font-serif text-muted-foreground mt-1">
            777,777,777 hearts distributed across four channels — like sunlight through the canopy
          </p>
        </div>
        <DistributionCompass mintedTotal={stats?.totalHeartsMinted || 0} />
      </motion.section>

      {/* Channel Details */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h3 className="text-base font-serif text-foreground text-center">Distribution Channels</h3>
        {CHANNELS.map((ch, i) => (
          <ChannelCard
            key={ch.id}
            channel={ch}
            index={i}
            expanded={expandedChannel === ch.id}
            onToggle={() => setExpandedChannel(expandedChannel === ch.id ? null : ch.id)}
          />
        ))}
      </motion.section>

      {/* Emission Curve */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-card/40 backdrop-blur border-border/30">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-base font-serif text-foreground text-center">
              Proof of Flow Emission Curve
            </h3>
            <EmissionCurve />
          </CardContent>
        </Card>
      </motion.section>

      {/* Value Tree Branches */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <div className="text-center">
          <h3 className="text-base font-serif text-foreground">Where Hearts Flow</h3>
          <p className="text-[11px] font-serif text-muted-foreground mt-1">
            Hearts enter the ecosystem and flow into living branches
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {VALUE_BRANCHES.map((branch, i) => (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.06 }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/20 bg-card/30 backdrop-blur-sm hover:border-primary/30 transition-all group cursor-pointer"
            >
              <span className="text-2xl">{branch.icon}</span>
              <p className="text-xs font-serif text-foreground text-center group-hover:text-primary transition-colors">
                {branch.label}
              </p>
              <div
                className="w-8 h-0.5 rounded-full opacity-40 group-hover:opacity-80 transition-opacity"
                style={{ backgroundColor: branch.color }}
              />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Council Influence Layer */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-card/40 backdrop-blur border-border/30 overflow-hidden">
          <div className="h-0.5" style={{ background: "linear-gradient(90deg, transparent, hsl(42, 80%, 50%), transparent)" }} />
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "hsl(42 80% 50% / 0.12)" }}
              >
                <Shield className="w-5 h-5" style={{ color: "hsl(42, 80%, 50%)" }} />
              </div>
              <div>
                <h3 className="text-base font-serif text-foreground">Council of Life — Influence Layer</h3>
                <p className="text-[10px] font-serif text-muted-foreground">
                  Non-transferable wisdom tokens · Trust earned, never traded
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Hosting Council gatherings", icon: "🏛️" },
                { label: "Curating plants of the week", icon: "🌿" },
                { label: "Preserving ecological knowledge", icon: "📚" },
                { label: "Long-term stewardship participation", icon: "🌳" },
                { label: "Guiding community proposals", icon: "🗳️" },
                { label: "Governance voting weight", icon: "⚖️" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/15 bg-card/20"
                >
                  <span className="text-sm">{item.icon}</span>
                  <p className="text-[11px] font-serif text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-2">
              <Link
                to="/council-of-life"
                className="text-[11px] font-serif text-primary hover:underline"
              >
                Enter the Council of Life →
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Footer note */}
      <div className="text-center pb-4">
        <p className="text-[10px] font-serif text-muted-foreground/50 italic max-w-md mx-auto">
          This system is designed so future plant-heart economies — Hemp Hearts, Oak Hearts, Yew Hearts — can plug into the same living architecture.
        </p>
      </div>
    </div>
  );
};

/* ─── Channel Card ─── */
const ChannelCard = ({
  channel,
  index,
  expanded,
  onToggle,
}: {
  channel: DistributionChannel;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 + index * 0.06 }}
  >
    <Card className="bg-card/40 backdrop-blur border-border/30 overflow-hidden">
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${channel.color}, transparent)` }} />
      <CardContent className="p-0">
        <button
          onClick={onToggle}
          className="w-full p-4 flex items-center gap-3 text-left hover:bg-card/20 transition-colors"
        >
          <span className="text-xl">{channel.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-serif text-foreground">{channel.label}</h4>
              {channel.status !== "active" && (
                <Badge variant="outline" className="text-[9px] font-serif" style={{ borderColor: `${channel.color}40` }}>
                  {channel.status === "upcoming" ? "Upcoming" : "Future"}
                </Badge>
              )}
            </div>
            <p className="text-[10px] font-serif text-muted-foreground mt-0.5">{channel.description}</p>
          </div>
          <div className="text-right shrink-0 mr-2">
            <p className="text-sm font-serif font-bold tabular-nums" style={{ color: channel.color }}>
              {(channel.hearts / 1_000_000).toFixed(1)}M
            </p>
            <p className="text-[9px] text-muted-foreground">{channel.percentage}%</p>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-1 border-t border-border/20">
                <ul className="space-y-1.5 mt-2">
                  {channel.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2 text-[11px] font-serif text-muted-foreground">
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                        style={{ backgroundColor: channel.color }}
                      />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  </motion.div>
);

export default EconomyOverview;
