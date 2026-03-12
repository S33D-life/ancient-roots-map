/**
 * EconomyOverview — The Living Economy tab for the Value Tree page.
 *
 * Visual reading order:
 *  1. Poetic intro
 *  2. Live circulation stats
 *  3. Distribution Compass (360°)
 *  4. Four distribution channels (expandable)
 *  5. Emission curve
 *  6. Value Tree branches
 *  7. Council of Life influence layer
 *  8. Canonical note + future plant-heart note
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Shield, Sprout, ChevronDown, ChevronUp, Leaf, TreeDeciduous } from "lucide-react";
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

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Leaf className="w-8 h-8 text-primary/50" />
        </motion.div>
        <p className="text-xs font-serif text-muted-foreground/60 italic">
          The forest is gathering its traces…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">

      {/* ═══ 1. Poetic Intro ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2 max-w-lg mx-auto"
      >
        <p className="text-sm font-serif text-foreground/80 leading-relaxed">
          The S33D ecosystem circulates through three interacting layers —
        </p>
        <p className="text-base font-serif text-foreground tracking-wide">
          <span style={{ color: "hsl(0, 65%, 55%)" }}>Energy</span>
          {" → "}
          <span style={{ color: "hsl(var(--primary))" }}>Value</span>
          {" → "}
          <span style={{ color: "hsl(42, 80%, 50%)" }}>Wisdom</span>
        </p>
        <p className="text-[11px] font-serif text-muted-foreground/70 italic">
          Hearts circulate through action. Value flows through the Value Tree. Wisdom flows through the Council of Life.
        </p>
      </motion.div>

      {/* ═══ 2. Live Circulation Stats ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="flex flex-wrap justify-center gap-3">
          {[
            {
              icon: <Heart className="w-4 h-4" />,
              label: "S33D Hearts",
              sublabel: "currently minted",
              value: stats?.totalHeartsMinted.toLocaleString() || "0",
              color: "hsl(0, 65%, 55%)",
            },
            {
              icon: <Sprout className="w-4 h-4" />,
              label: "Species Hearts",
              sublabel: "currently recorded",
              value: stats?.totalSpeciesHearts.toLocaleString() || "0",
              color: "hsl(var(--primary))",
            },
            {
              icon: <Shield className="w-4 h-4" />,
              label: "Influence",
              sublabel: "currently earned",
              value: stats?.totalInfluence.toLocaleString() || "0",
              color: "hsl(42, 80%, 50%)",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm min-w-[140px]"
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
                <p className="text-[9px] font-serif text-muted-foreground leading-tight">
                  {item.label}
                </p>
                <p className="text-[8px] font-serif text-muted-foreground/50">
                  {item.sublabel}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══ 3. Distribution Compass ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="text-center">
          <h3 className="text-lg font-serif text-foreground">The Living Compass</h3>
          <p className="text-[11px] font-serif text-muted-foreground mt-1 max-w-sm mx-auto">
            777,777,777 hearts distributed across four channels — like sunlight entering the forest canopy.
          </p>
        </div>
        <DistributionCompass mintedTotal={stats?.totalHeartsMinted || 0} />
      </motion.section>

      {/* ═══ 4. Distribution Channels ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        <div className="text-center mb-4">
          <h3 className="text-base font-serif text-foreground">Four Channels of Distribution</h3>
          <p className="text-[10px] font-serif text-muted-foreground mt-1">
            Each channel serves a distinct purpose in the ecosystem's lifecycle.
          </p>
        </div>
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

      {/* ═══ 5. Emission Curve ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card/40 backdrop-blur border-border/30">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="text-center">
              <h3 className="text-base font-serif text-foreground">
                Proof of Flow — Emission Curve
              </h3>
              <p className="text-[10px] font-serif text-muted-foreground mt-1">
                The largest channel follows a long-term curve across four eras.
              </p>
            </div>
            <EmissionCurve />
          </CardContent>
        </Card>
      </motion.section>

      {/* ═══ 6. Value Tree Branches ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-4"
      >
        <div className="text-center">
          <h3 className="text-base font-serif text-foreground">Where Hearts Flow</h3>
          <p className="text-[11px] font-serif text-muted-foreground mt-1">
            Once in circulation, hearts route into these living branches.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {VALUE_BRANCHES.map((branch, i) => {
            const statusConfig = {
              live: { label: "Live", badgeColor: "hsl(150, 60%, 45%)" },
              partial: { label: "Partial", badgeColor: "hsl(42, 80%, 50%)" },
              future: { label: "Coming", badgeColor: "hsl(var(--muted-foreground))" },
            }[branch.status];

            return (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
              >
                <Link
                  to={branch.link}
                  className="group flex items-start gap-3 p-4 rounded-xl border border-border/20 bg-card/30 backdrop-blur-sm hover:border-primary/30 hover:bg-card/50 transition-all"
                >
                  <span className="text-xl mt-0.5">{branch.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-serif text-foreground group-hover:text-primary transition-colors">
                        {branch.label}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[8px] font-serif px-1.5 py-0 h-4"
                        style={{ borderColor: `${statusConfig.badgeColor}50`, color: statusConfig.badgeColor }}
                      >
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <p className="text-[10px] font-serif text-muted-foreground/70 leading-snug">
                      {branch.description}
                    </p>
                  </div>
                  {/* Activity pulse for live branches */}
                  {branch.status === "live" && (
                    <div className="shrink-0 mt-1.5">
                      <div
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: branch.color, boxShadow: `0 0 6px ${branch.color}50` }}
                      />
                    </div>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ═══ 7. Council of Life — Influence Layer ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-card/40 backdrop-blur border-border/30 overflow-hidden">
          <div className="h-0.5" style={{ background: "linear-gradient(90deg, transparent, hsl(42, 80%, 50%), transparent)" }} />
          <CardContent className="p-5 sm:p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "hsl(42 80% 50% / 0.12)" }}
              >
                <Shield className="w-5 h-5" style={{ color: "hsl(42, 80%, 50%)" }} />
              </div>
              <div>
                <h3 className="text-base font-serif text-foreground">Council of Life — Influence Layer</h3>
                <p className="text-[10px] font-serif text-muted-foreground">
                  Non-transferable · Earned through stewardship · Never traded
                </p>
              </div>
            </div>

            {/* Distinction callout */}
            <div className="rounded-lg border border-border/20 bg-card/20 p-3.5">
              <p className="text-[11px] font-serif text-foreground/80 leading-relaxed">
                <span className="font-semibold">Hearts</span> are the ecosystem's <span style={{ color: "hsl(0, 65%, 55%)" }}>energy currency</span> — they circulate, flow, and can be spent.
                <br />
                <span className="font-semibold">Influence</span> is <span style={{ color: "hsl(42, 80%, 50%)" }}>earned wisdom</span> — it reflects trust, care, and long-term stewardship. It can never be transferred or traded.
              </p>
            </div>

            {/* How influence is earned */}
            <div>
              <p className="text-[10px] font-serif text-muted-foreground/70 uppercase tracking-wider mb-2">
                How Influence Is Earned
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: "Hosting Council gatherings", icon: "🏛️" },
                  { label: "Curating ecological knowledge", icon: "🌿" },
                  { label: "Long-term stewardship participation", icon: "🌳" },
                  { label: "Guiding community proposals", icon: "🗳️" },
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
            </div>

            {/* What influence affects */}
            <div>
              <p className="text-[10px] font-serif text-muted-foreground/70 uppercase tracking-wider mb-2">
                What Influence Guides
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { label: "Governance voting weight", icon: "⚖️" },
                  { label: "Proposal credibility", icon: "📜" },
                  { label: "Stewardship roles", icon: "👑" },
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
            </div>

            <div className="flex justify-center pt-1">
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

      {/* ═══ 8. Canonical Note + Future Plant-Heart Note ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="space-y-4 pb-4"
      >
        <div className="rounded-xl border border-border/15 bg-card/20 backdrop-blur-sm px-5 py-4 max-w-lg mx-auto">
          <p className="text-[10px] font-serif text-muted-foreground/70 leading-relaxed text-center">
            The total S33D Hearts model is currently defined as a canonical economic blueprint, while live circulation counters reflect real activity already recorded in the ecosystem.
          </p>
        </div>

        <p className="text-[10px] font-serif text-muted-foreground/40 italic max-w-md mx-auto text-center leading-relaxed">
          This architecture is designed so future plant-heart economies — Hemp Hearts, Oak Hearts, Yew Hearts, Baobab Hearts — can plug into the same living system as sub-networks beneath S33D.
        </p>
      </motion.div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
 * Channel Card — Expanded details show purpose, source,
 * how hearts enter, examples, and horizon.
 * ═══════════════════════════════════════════════════════════════ */
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
}) => {
  const horizonColors = {
    "short-term": "hsl(42, 85%, 55%)",
    "mid-term": "hsl(280, 60%, 55%)",
    "long-term": "hsl(150, 55%, 45%)",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.05 }}
    >
      <Card className="bg-card/40 backdrop-blur border-border/30 overflow-hidden">
        <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${channel.color}, transparent)` }} />
        <CardContent className="p-0">
          <button
            onClick={onToggle}
            className="w-full p-4 flex items-center gap-3 text-left hover:bg-card/20 transition-colors"
          >
            <span className="text-xl shrink-0">{channel.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-serif text-foreground">{channel.label}</h4>
                {channel.status !== "active" && (
                  <Badge variant="outline" className="text-[9px] font-serif" style={{ borderColor: `${channel.color}40` }}>
                    {channel.status === "upcoming" ? "Upcoming" : "Future"}
                  </Badge>
                )}
              </div>
              <p className="text-[10px] font-serif text-muted-foreground mt-0.5 leading-snug">{channel.description}</p>
            </div>
            <div className="text-right shrink-0 ml-1">
              <p className="text-sm font-serif font-bold tabular-nums" style={{ color: channel.color }}>
                {channel.hearts.toLocaleString()}
              </p>
              <p className="text-[9px] text-muted-foreground tabular-nums">
                {channel.percentage}% · {channel.degrees}°
              </p>
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
                <div className="px-4 pb-5 pt-2 border-t border-border/20 space-y-3">
                  {/* Purpose */}
                  <div>
                    <p className="text-[9px] font-serif text-muted-foreground/60 uppercase tracking-wider mb-1">Purpose</p>
                    <p className="text-[11px] font-serif text-foreground/80 leading-relaxed">{channel.detail.purpose}</p>
                  </div>

                  {/* Source + How */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] font-serif text-muted-foreground/60 uppercase tracking-wider mb-1">Source</p>
                      <p className="text-[10px] font-serif text-muted-foreground leading-snug">{channel.detail.source}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-serif text-muted-foreground/60 uppercase tracking-wider mb-1">How Hearts Enter</p>
                      <p className="text-[10px] font-serif text-muted-foreground leading-snug">{channel.detail.howHeartsEnter}</p>
                    </div>
                  </div>

                  {/* Examples */}
                  <div>
                    <p className="text-[9px] font-serif text-muted-foreground/60 uppercase tracking-wider mb-1.5">Examples</p>
                    <ul className="space-y-1">
                      {channel.detail.examples.map((ex) => (
                        <li key={ex} className="flex items-start gap-2 text-[10px] font-serif text-muted-foreground">
                          <div
                            className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                            style={{ backgroundColor: channel.color }}
                          />
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Horizon */}
                  <div className="flex items-center gap-2 pt-1">
                    <Badge
                      variant="outline"
                      className="text-[9px] font-serif"
                      style={{
                        borderColor: `${horizonColors[channel.detail.horizon]}50`,
                        color: horizonColors[channel.detail.horizon],
                      }}
                    >
                      {channel.detail.horizon}
                    </Badge>
                    <span className="text-[9px] font-serif text-muted-foreground/50">
                      {channel.detail.horizonLabel}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EconomyOverview;
