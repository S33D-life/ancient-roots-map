import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getHiveBySlug } from "@/utils/hiveUtils";
import { matchSpecies } from "@/data/treeSpecies";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Heart, Shield, TrendingUp, ArrowRight, BarChart3, Users, Lock, Vote, Flame, Sprout, TreePine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HeartTx {
  id: string;
  user_id: string;
  amount: number;
  action_type: string;
  created_at: string;
  tree_id: string;
}

interface InfluenceTx {
  id: string;
  user_id: string;
  amount: number;
  action_type: string;
  created_at: string;
  reason: string | null;
}

const HiveTreasuryPage = () => {
  const { family } = useParams<{ family: string }>();
  const hive = family ? getHiveBySlug(family) : null;

  const [heartTxs, setHeartTxs] = useState<HeartTx[]>([]);
  const [influenceTxs, setInfluenceTxs] = useState<InfluenceTx[]>([]);
  const [treeCount, setTreeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const hiveFamily = hive?.family;

  useEffect(() => {
    if (!hiveFamily) { setLoading(false); return; }
    const load = async () => {
      const [hRes, iRes, tRes] = await Promise.all([
        supabase.from("species_heart_transactions")
          .select("id, user_id, amount, action_type, created_at, tree_id")
          .eq("species_family", hiveFamily)
          .order("created_at", { ascending: false }).limit(500),
        supabase.from("influence_transactions")
          .select("id, user_id, amount, action_type, created_at, reason")
          .eq("species_family", hiveFamily)
          .order("created_at", { ascending: false }).limit(300),
        supabase.from("trees").select("id, species"),
      ]);
      setHeartTxs(hRes.data || []);
      setInfluenceTxs(iRes.data || []);
      const hiveTrees = (tRes.data || []).filter(t => {
        const m = matchSpecies(t.species);
        return m && m.family === hiveFamily;
      });
      setTreeCount(hiveTrees.length);
      setLoading(false);
    };
    load();
  }, [hiveFamily]);

  const totalHearts = heartTxs.reduce((s, tx) => s + tx.amount, 0);
  const totalInfluence = influenceTxs.reduce((s, tx) => s + tx.amount, 0);
  const uniqueHolders = new Set(heartTxs.map(tx => tx.user_id)).size;
  const uniqueCurators = new Set(influenceTxs.map(tx => tx.user_id)).size;

  const actionBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    heartTxs.forEach(tx => {
      if (!map[tx.action_type]) map[tx.action_type] = { count: 0, total: 0 };
      map[tx.action_type].count++;
      map[tx.action_type].total += tx.amount;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [heartTxs]);

  const weeklyFlow = useMemo(() => {
    const weeks: { label: string; total: number }[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date(now);
      end.setDate(end.getDate() - i * 7);
      const total = heartTxs.filter(tx => {
        const d = new Date(tx.created_at);
        return d >= start && d < end;
      }).reduce((s, tx) => s + tx.amount, 0);
      weeks.push({ label: `W${8 - i}`, total });
    }
    return weeks;
  }, [heartTxs]);

  const maxWeekly = Math.max(...weeklyFlow.map(w => w.total), 1);

  const treeHeartMap = useMemo(() => {
    const m: Record<string, number> = {};
    heartTxs.forEach(tx => { m[tx.tree_id] = (m[tx.tree_id] || 0) + tx.amount; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [heartTxs]);

  const topHolders = useMemo(() => {
    const m: Record<string, number> = {};
    heartTxs.forEach(tx => { m[tx.user_id] = (m[tx.user_id] || 0) + tx.amount; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [heartTxs]);

  const topCurators = useMemo(() => {
    const m: Record<string, number> = {};
    influenceTxs.forEach(tx => { m[tx.user_id] = (m[tx.user_id] || 0) + tx.amount; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [influenceTxs]);

  const infActions = useMemo(() => {
    const m: Record<string, { count: number; total: number }> = {};
    influenceTxs.forEach(tx => {
      if (!m[tx.action_type]) m[tx.action_type] = { count: 0, total: 0 };
      m[tx.action_type].count++;
      m[tx.action_type].total += tx.amount;
    });
    return Object.entries(m).sort((a, b) => b[1].total - a[1].total);
  }, [influenceTxs]);

  if (!hive) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground font-serif">Hive not found</p>
          <Link to="/hives" className="text-primary hover:underline font-serif mt-4 inline-block">Browse all Hives</Link>
        </div>
      </div>
    );
  }

  const accent = `hsl(${hive.accentHsl})`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pb-20 max-w-5xl" style={{ paddingTop: 'var(--content-top)' }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm font-serif text-muted-foreground">
          <Link to="/hives" className="hover:text-primary transition-colors">Species Hives</Link>
          <span>/</span>
          <Link to={`/hive/${family}`} className="hover:text-primary transition-colors">{hive.displayName}</Link>
          <span>/</span>
          <span className="text-foreground">Treasury</span>
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative mb-8 rounded-xl border border-border overflow-hidden"
          style={{ background: `linear-gradient(135deg, hsl(${hive.accentHsl} / 0.12), hsl(var(--background)))` }}>
          <div className="h-1" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
          <div className="p-6 md:p-8 flex items-center gap-4">
            <span className="text-5xl">{hive.icon}</span>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif tracking-wide" style={{ color: accent }}>
                {hive.displayName} Treasury
              </h1>
              <p className="text-muted-foreground font-serif text-sm mt-1">
                Heart flows, holder distribution & Influence governance
              </p>
            </div>
          </div>
        </motion.div>

        {/* Summary bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Species Hearts", value: totalHearts, icon: <Heart className="w-4 h-4" />, color: accent },
            { label: "Influence", value: totalInfluence, icon: <Shield className="w-4 h-4" />, color: "hsl(42, 80%, 50%)" },
            { label: "Holders", value: uniqueHolders, icon: <Users className="w-4 h-4" />, color: accent },
            { label: "Curators", value: uniqueCurators, icon: <Shield className="w-4 h-4" />, color: "hsl(42, 80%, 50%)" },
            { label: "Trees", value: treeCount, icon: <TreePine className="w-4 h-4" />, color: accent },
          ].map(m => (
            <Card key={m.label} className="bg-card/60 backdrop-blur border-border/50">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1 text-muted-foreground">{m.icon}</div>
                <p className="text-xl font-serif font-bold tabular-nums" style={{ color: m.color }}>{m.value}</p>
                <p className="text-[10px] text-muted-foreground font-serif">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="flows">
            <TabsList className="bg-secondary/30 border border-border/50 mb-6 flex-wrap h-auto gap-1 p-1.5">
              <TabsTrigger value="flows" className="font-serif text-xs tracking-wider gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Heart Flows
              </TabsTrigger>
              <TabsTrigger value="governance" className="font-serif text-xs tracking-wider gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Influence & Governance
              </TabsTrigger>
            </TabsList>

            {/* ── Heart Flows Tab ── */}
            <TabsContent value="flows">
              <div className="space-y-6">
                {/* Flow diagram */}
                <Card className="bg-card/60 backdrop-blur border-border/40">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-serif mb-4 uppercase tracking-wider text-muted-foreground">
                      How {hive.family} Hearts Flow
                    </h3>
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center py-4">
                      {[
                        { icon: "🧭", label: "User Action", sub: "map · checkin · offering" },
                        null,
                        { icon: "✅", label: "Verification", sub: "species match" },
                        null,
                        { icon: hive.icon, label: `${hive.family} Heart`, sub: "issued to wallet" },
                        null,
                        { icon: "🏛️", label: "Hive Treasury", sub: "aggregate pool" },
                      ].map((step, i) =>
                        step === null ? (
                          <ArrowRight key={`arrow-${i}`} className="w-5 h-5 text-muted-foreground shrink-0 rotate-90 sm:rotate-0" />
                        ) : (
                          <div key={i} className="flex flex-col items-center text-center min-w-[80px]">
                            <span className="text-2xl mb-1">{step.icon}</span>
                            <p className="text-xs font-serif text-foreground">{step.label}</p>
                            <p className="text-[9px] text-muted-foreground font-serif">{step.sub}</p>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Action breakdown */}
                <Card className="bg-card/60 backdrop-blur border-border/40">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-serif mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" /> Issuance by Action
                    </h3>
                    {actionBreakdown.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-serif text-center py-4">No issuance events yet</p>
                    ) : (
                      <div className="space-y-3">
                        {actionBreakdown.map(([action, data]) => {
                          const pct = totalHearts > 0 ? (data.total / totalHearts) * 100 : 0;
                          return (
                            <div key={action}>
                              <div className="flex items-center justify-between text-xs font-serif mb-1">
                                <span className="capitalize text-foreground">{action.replace(/_/g, " ")}</span>
                                <span className="tabular-nums text-muted-foreground">{data.total} ({data.count}×)</span>
                              </div>
                              <div className="h-2 rounded-full bg-secondary/40 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.6, delay: 0.1 }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: accent }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Weekly flow chart */}
                <Card className="bg-card/60 backdrop-blur border-border/40">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-serif mb-4 uppercase tracking-wider text-muted-foreground">
                      Weekly Issuance (8 weeks)
                    </h3>
                    <div className="flex items-end gap-2 h-32">
                      {weeklyFlow.map((w, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <motion.div
                            className="w-full rounded-t"
                            style={{ backgroundColor: accent, opacity: 0.7 + (w.total / maxWeekly) * 0.3 }}
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max((w.total / maxWeekly) * 100, 4)}%` }}
                            transition={{ duration: 0.4, delay: i * 0.05 }}
                          />
                          <span className="text-[9px] text-muted-foreground font-serif">{w.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top holders + top trees */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-card/60 backdrop-blur border-border/40">
                    <CardContent className="p-5">
                      <h4 className="text-sm font-serif mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" /> Top Holders
                      </h4>
                      {topHolders.length === 0 ? (
                        <p className="text-xs text-muted-foreground font-serif">No holders yet</p>
                      ) : (
                        <div className="space-y-2">
                          {topHolders.map(([uid, amt], i) => (
                            <div key={uid} className="flex items-center gap-2 text-xs font-serif">
                              <span className="text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                              <span className="flex-1 text-muted-foreground truncate">{uid.slice(0, 8)}…</span>
                              <span className="tabular-nums font-bold" style={{ color: accent }}>{amt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-card/60 backdrop-blur border-border/40">
                    <CardContent className="p-5">
                      <h4 className="text-sm font-serif mb-3 flex items-center gap-2">
                        <Flame className="w-4 h-4 text-muted-foreground" /> Top Generating Trees
                      </h4>
                      {treeHeartMap.length === 0 ? (
                        <p className="text-xs text-muted-foreground font-serif">No data yet</p>
                      ) : (
                        <div className="space-y-2">
                          {treeHeartMap.map(([tid, amt], i) => (
                            <Link key={tid} to={`/tree/${tid}`} className="flex items-center gap-2 text-xs font-serif hover:text-primary transition-colors">
                              <span className="text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                              <span className="flex-1 text-muted-foreground truncate">{tid.slice(0, 8)}…</span>
                              <span className="tabular-nums font-bold" style={{ color: accent }}>{amt}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent ledger */}
                <Card className="bg-card/60 backdrop-blur border-border/40">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-serif mb-3 uppercase tracking-wider text-muted-foreground">Recent Heart Issuance</h3>
                    <div className="space-y-1.5 max-h-52 overflow-y-auto">
                      {heartTxs.slice(0, 20).map(tx => (
                        <div key={tx.id} className="flex items-center gap-2 text-xs font-serif">
                          <span>{hive.icon}</span>
                          <span className="flex-1 text-muted-foreground capitalize">{tx.action_type.replace(/_/g, " ")}</span>
                          <span className="tabular-nums font-bold" style={{ color: accent }}>+{tx.amount}</span>
                          <span className="text-[10px] text-muted-foreground/60 w-16 text-right">
                            {new Date(tx.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      ))}
                      {heartTxs.length === 0 && (
                        <p className="text-xs text-muted-foreground font-serif text-center py-4">No issuance events yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Influence & Governance Tab ── */}
            <TabsContent value="governance">
              <div className="space-y-6">
                {/* Influence overview */}
                <Card className="bg-card/60 backdrop-blur border-border/40">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-serif mb-4 flex items-center gap-2" style={{ color: "hsl(42, 80%, 50%)" }}>
                      <Shield className="w-5 h-5" /> {hive.displayName} Council
                    </h3>
                    <p className="text-xs text-muted-foreground font-serif mb-6 max-w-2xl">
                      Influence tokens are soulbound reputation earned through curation. They power governance votes,
                      weight proposals, and determine who shapes the {hive.family} hive's direction.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-2xl font-serif font-bold tabular-nums" style={{ color: "hsl(42, 80%, 50%)" }}>{totalInfluence}</p>
                        <p className="text-[11px] text-muted-foreground font-serif">Total Influence</p>
                      </div>
                      <div>
                        <p className="text-2xl font-serif font-bold tabular-nums text-foreground">{uniqueCurators}</p>
                        <p className="text-[11px] text-muted-foreground font-serif">Active Curators</p>
                      </div>
                      <div>
                        <p className="text-2xl font-serif font-bold tabular-nums text-foreground">{influenceTxs.length}</p>
                        <p className="text-[11px] text-muted-foreground font-serif">Curation Events</p>
                      </div>
                      <div>
                        <p className="text-2xl font-serif font-bold tabular-nums text-foreground">
                          {uniqueCurators > 0 ? Math.round(totalInfluence / uniqueCurators) : 0}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-serif">Avg per Curator</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Influence action breakdown */}
                <Card className="bg-card/60 backdrop-blur border-border/40">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-serif mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" /> Influence Sources
                    </h3>
                    {infActions.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-xs text-muted-foreground font-serif">No influence actions yet</p>
                        <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                          {["Verify trees", "Add metadata", "Quality media", "Curate playlists", "Resolve duplicates", "Tag offerings"].map(a => (
                            <Badge key={a} variant="secondary" className="text-[9px] font-serif">{a}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {infActions.map(([action, data]) => {
                          const pct = totalInfluence > 0 ? (data.total / totalInfluence) * 100 : 0;
                          return (
                            <div key={action}>
                              <div className="flex items-center justify-between text-xs font-serif mb-1">
                                <span className="capitalize text-foreground">{action.replace(/_/g, " ")}</span>
                                <span className="tabular-nums text-muted-foreground">{data.total} ({data.count}×)</span>
                              </div>
                              <div className="h-2 rounded-full bg-secondary/40 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.6 }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: "hsl(42, 80%, 50%)" }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top curators */}
                <Card className="bg-card/60 backdrop-blur border-border/40">
                  <CardContent className="p-5">
                    <h4 className="text-sm font-serif mb-3 flex items-center gap-2">
                      🛡️ Curator Leaderboard
                    </h4>
                    {topCurators.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-serif">No curators yet — be the first!</p>
                    ) : (
                      <div className="space-y-2">
                        {topCurators.map(([uid, inf], i) => {
                          const tier = inf >= 50 ? "Elder" : inf >= 20 ? "Keeper" : inf >= 5 ? "Walker" : "Seedling";
                          return (
                            <div key={uid} className="flex items-center gap-2 text-xs font-serif">
                              <span className="text-muted-foreground w-4 tabular-nums">{i + 1}.</span>
                              <span className="flex-1 text-muted-foreground truncate">{uid.slice(0, 8)}…</span>
                              <Badge variant="outline" className="text-[9px] font-serif" style={{ borderColor: "hsl(42 80% 50% / 0.3)" }}>
                                {tier}
                              </Badge>
                              <span className="tabular-nums font-bold" style={{ color: "hsl(42, 80%, 50%)" }}>{inf}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent influence ledger */}
                <Card className="bg-card/60 backdrop-blur border-border/40">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-serif mb-3 uppercase tracking-wider text-muted-foreground">Recent Curation Actions</h3>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {influenceTxs.slice(0, 15).map(tx => (
                        <div key={tx.id} className="flex items-center gap-2 text-xs font-serif">
                          <Shield className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="flex-1 text-muted-foreground capitalize truncate">
                            {tx.action_type.replace(/_/g, " ")}
                            {tx.reason && <span className="text-muted-foreground/50"> — {tx.reason}</span>}
                          </span>
                          <span className="tabular-nums font-bold" style={{ color: "hsl(42, 80%, 50%)" }}>+{tx.amount}</span>
                          <span className="text-[10px] text-muted-foreground/60 w-16 text-right">
                            {new Date(tx.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      ))}
                      {influenceTxs.length === 0 && (
                        <p className="text-xs text-muted-foreground font-serif text-center py-4">No curation actions yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Governance powers + proposals — coming soon */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="bg-card/60 backdrop-blur border-border/40">
                    <CardContent className="p-5 text-center space-y-2">
                      <Vote className="w-8 h-8 text-muted-foreground mx-auto" />
                      <p className="font-serif text-sm text-foreground">Hive Proposals</p>
                      <p className="text-[10px] text-muted-foreground font-serif max-w-xs mx-auto">
                        Submit and vote on new value branches, staking rules, and curation standards for {hive.family}.
                      </p>
                      <Badge variant="outline" className="text-[10px] font-serif">Coming Soon</Badge>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/60 backdrop-blur border-border/40">
                    <CardContent className="p-5 text-center space-y-2">
                      <Sprout className="w-8 h-8 text-muted-foreground mx-auto" />
                      <p className="font-serif text-sm text-foreground">Species Heart Staking</p>
                      <p className="text-[10px] text-muted-foreground font-serif max-w-xs mx-auto">
                        Stake {hive.family} Hearts to earn drip, boost trees, and unlock governance tiers.
                      </p>
                      <Badge variant="outline" className="text-[10px] font-serif">Coming Soon</Badge>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default HiveTreasuryPage;
