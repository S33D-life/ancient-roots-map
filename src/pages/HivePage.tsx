import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOfferingCounts } from "@/hooks/use-offering-counts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getHiveBySlug, type HiveInfo } from "@/utils/hiveUtils";
import { matchSpecies } from "@/data/treeSpecies";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TreePine, Heart, Music, Users, Map, Shield, TrendingUp, Lock } from "lucide-react";
import { motion } from "framer-motion";
import OfferingList from "@/components/OfferingList";

interface TreeRow {
  id: string;
  name: string;
  species: string;
  what3words: string | null;
  latitude: number | null;
  longitude: number | null;
  estimated_age: number | null;
  created_at: string;
  nation: string | null;
}

interface OfferingRow {
  id: string;
  tree_id: string;
  title: string;
  type: string;
  media_url: string | null;
  created_at: string;
  created_by: string | null;
}

interface SpeciesHeartTx {
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
}

const HivePage = () => {
  const { family } = useParams<{ family: string }>();
  const navigate = useNavigate();
  const hive = family ? getHiveBySlug(family) : null;

  const [trees, setTrees] = useState<TreeRow[]>([]);
  const [offerings, setOfferings] = useState<OfferingRow[]>([]);
  const [speciesHearts, setSpeciesHearts] = useState<SpeciesHeartTx[]>([]);
  const [influenceTxs, setInfluenceTxs] = useState<InfluenceTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("trees");
  const { counts: globalOfferingCounts } = useOfferingCounts();

  useEffect(() => {
    if (!hive) { setLoading(false); return; }
    const fetchData = async () => {
      // Fetch all trees, filter client-side by species family
      const { data: allTrees } = await supabase
        .from("trees")
        .select("id, name, species, what3words, latitude, longitude, estimated_age, created_at, nation")
        .order("created_at", { ascending: false });

      const hiveTrees = (allTrees || []).filter(t => {
        const match = matchSpecies(t.species);
        return match && match.family === hive.family;
      });
      setTrees(hiveTrees);

      // Fetch species heart transactions for this family
      const [offsRes, speciesHeartsRes, influenceRes] = await Promise.all([
        hiveTrees.length > 0
          ? supabase.from("offerings").select("id, tree_id, title, type, media_url, created_at, created_by")
              .in("tree_id", hiveTrees.map(t => t.id).slice(0, 100))
              .order("created_at", { ascending: false }).limit(200)
          : Promise.resolve({ data: [] }),
        supabase.from("species_heart_transactions").select("id, user_id, amount, action_type, created_at, tree_id")
          .eq("species_family", hive.family).order("created_at", { ascending: false }).limit(200),
        supabase.from("influence_transactions").select("id, user_id, amount, action_type, created_at")
          .eq("species_family", hive.family).order("created_at", { ascending: false }).limit(100),
      ]);

      setOfferings(offsRes.data || []);
      setSpeciesHearts(speciesHeartsRes.data || []);
      setInfluenceTxs(influenceRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [hive]);

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

  const totalHearts = trees.length * 10;
  const hiveOfferingCount = trees.reduce((sum, t) => sum + (globalOfferingCounts[t.id] || 0), 0);
  const uniqueContributors = new Set(offerings.map(o => o.created_by).filter(Boolean)).size;
  const totalSpeciesHearts = speciesHearts.reduce((s, tx) => s + tx.amount, 0);
  const totalInfluence = influenceTxs.reduce((s, tx) => s + tx.amount, 0);

  // Top contributing trees (by species hearts)
  const treeHeartMap: Record<string, number> = {};
  speciesHearts.forEach(tx => {
    treeHeartMap[tx.tree_id] = (treeHeartMap[tx.tree_id] || 0) + tx.amount;
  });
  const topTrees = Object.entries(treeHeartMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, hearts]) => ({ id, name: trees.find(t => t.id === id)?.name || "Unknown", hearts }));

  // Top wanderers
  const userHeartMap: Record<string, number> = {};
  speciesHearts.forEach(tx => {
    userHeartMap[tx.user_id] = (userHeartMap[tx.user_id] || 0) + tx.amount;
  });
  const topWanderers = Object.entries(userHeartMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Top curators (influence)
  const curatorMap: Record<string, number> = {};
  influenceTxs.forEach(tx => {
    curatorMap[tx.user_id] = (curatorMap[tx.user_id] || 0) + tx.amount;
  });
  const topCurators = Object.entries(curatorMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm font-serif text-muted-foreground">
          <Link to="/hives" className="hover:text-primary transition-colors">Species Hives</Link>
          <span>/</span>
          <span className="text-foreground">{hive.displayName}</span>
        </div>

        {/* Hive Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8 rounded-xl border border-border overflow-hidden"
          style={{ background: `linear-gradient(135deg, hsl(${hive.accentHsl} / 0.15), hsl(var(--background)))` }}
        >
          <div className="h-1" style={{ background: `linear-gradient(90deg, transparent, hsl(${hive.accentHsl}), transparent)` }} />
          <div className="p-6 md:p-8">
            <div className="flex items-start gap-4">
              <span className="text-5xl">{hive.icon}</span>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-serif tracking-wide" style={{ color: `hsl(${hive.accentHsl})` }}>
                  {hive.displayName}
                </h1>
                <p className="text-muted-foreground font-serif mt-2 max-w-2xl">{hive.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {hive.representativeSpecies.slice(0, 8).map(sp => (
                    <Badge key={sp} variant="outline" className="font-serif text-xs" style={{ borderColor: `hsl(${hive.accentHsl} / 0.4)` }}>{sp}</Badge>
                  ))}
                  {hive.representativeSpecies.length > 8 && (
                    <Badge variant="secondary" className="font-serif text-xs">+{hive.representativeSpecies.length - 8} more</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Metrics — now includes Species Hearts + Influence */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: "Ancient Friends", value: trees.length, icon: <TreePine className="w-4 h-4" /> },
            { label: "Offerings", value: hiveOfferingCount, icon: <Music className="w-4 h-4" /> },
            { label: "S33D Hearts", value: totalHearts, icon: <Heart className="w-4 h-4" /> },
            { label: `${hive.family} Hearts`, value: totalSpeciesHearts, icon: <span className="text-sm">{hive.icon}</span> },
            { label: "Influence", value: totalInfluence, icon: <Shield className="w-4 h-4" /> },
            { label: "Wanderers", value: uniqueContributors, icon: <Users className="w-4 h-4" /> },
          ].map(m => (
            <Card key={m.label} className="bg-card/60 backdrop-blur border-border/50">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1 text-muted-foreground">{m.icon}</div>
                <p className="text-xl font-serif" style={{ color: `hsl(${hive.accentHsl})` }}>{m.value}</p>
                <p className="text-[10px] text-muted-foreground font-serif leading-tight">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-secondary/30 border border-border/50 mb-6 flex-wrap h-auto gap-1 p-1.5">
              <TabsTrigger value="trees" className="font-serif text-xs tracking-wider">
                <TreePine className="w-3.5 h-3.5 mr-1.5" /> Trees ({trees.length})
              </TabsTrigger>
              <TabsTrigger value="treasury" className="font-serif text-xs tracking-wider">
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Treasury
              </TabsTrigger>
              {/* Deep treasury link is at /hive/{family}/treasury */}
              <TabsTrigger value="offerings" className="font-serif text-xs tracking-wider">
                <Music className="w-3.5 h-3.5 mr-1.5" /> Offerings
              </TabsTrigger>
              <TabsTrigger value="lore" className="font-serif text-xs tracking-wider">📜 Lore</TabsTrigger>
              <TabsTrigger value="governance" className="font-serif text-xs tracking-wider">🏛️ Council</TabsTrigger>
            </TabsList>

            {/* Trees Tab */}
            <TabsContent value="trees">
              {trees.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground font-serif">No Ancient Friends mapped in this hive yet.</p>
                  <Button onClick={() => navigate("/map")} variant="outline" className="mt-4 font-serif gap-2">
                    <Map className="w-4 h-4" /> Open Atlas
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trees.slice(0, 60).map((tree, i) => (
                    <motion.div key={tree.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <Link to={`/tree/${tree.id}`}>
                        <Card className="bg-card/60 backdrop-blur border-border/50 hover:border-primary/30 transition-colors cursor-pointer group">
                          <CardContent className="p-4">
                            <h3 className="font-serif text-foreground group-hover:text-primary transition-colors truncate">{tree.name}</h3>
                            <p className="text-xs text-muted-foreground italic font-serif">{tree.species}</p>
                            <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                              {tree.nation && <span>🌍 {tree.nation}</span>}
                              {tree.estimated_age && <span>🕰️ ~{tree.estimated_age}y</span>}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Treasury Tab */}
            <TabsContent value="treasury">
              <div className="space-y-6">
                <div className="flex justify-end">
                  <Link to={`/hive/${family}/treasury`}>
                    <Button variant="outline" size="sm" className="font-serif text-xs gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Full Treasury View
                    </Button>
                  </Link>
                </div>
                {/* Heart Flows */}
                <Card className="bg-card/60 backdrop-blur border-border/40">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-serif mb-4 flex items-center gap-2" style={{ color: `hsl(${hive.accentHsl})` }}>
                      {hive.icon} {hive.family} Heart Flows
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                      <div>
                        <p className="text-2xl font-serif font-bold" style={{ color: `hsl(${hive.accentHsl})` }}>{totalSpeciesHearts}</p>
                        <p className="text-[11px] text-muted-foreground font-serif">Total Circulating</p>
                      </div>
                      <div>
                        <p className="text-2xl font-serif font-bold text-foreground">{speciesHearts.length}</p>
                        <p className="text-[11px] text-muted-foreground font-serif">Issuance Events</p>
                      </div>
                      <div>
                        <p className="text-2xl font-serif font-bold text-foreground">{Object.keys(userHeartMap).length}</p>
                        <p className="text-[11px] text-muted-foreground font-serif">Unique Holders</p>
                      </div>
                    </div>

                    {/* Recent issuance */}
                    {speciesHearts.length > 0 && (
                      <div className="border-t border-border/30 pt-4">
                        <p className="text-xs font-serif text-muted-foreground mb-2 uppercase tracking-wider">Recent Issuance</p>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {speciesHearts.slice(0, 10).map(tx => (
                            <div key={tx.id} className="flex items-center gap-2 text-xs font-serif">
                              <span>{hive.icon}</span>
                              <span className="flex-1 text-muted-foreground">{tx.action_type}</span>
                              <span className="tabular-nums" style={{ color: `hsl(${hive.accentHsl})` }}>+{tx.amount}</span>
                              <span className="text-[10px] text-muted-foreground/60">
                                {new Date(tx.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Trees + Wanderers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-card/60 backdrop-blur border-border/40">
                    <CardContent className="p-5">
                      <h4 className="text-sm font-serif mb-3 text-foreground">🌳 Top Contributing Trees</h4>
                      {topTrees.length === 0 ? (
                        <p className="text-xs text-muted-foreground font-serif">No data yet</p>
                      ) : (
                        <div className="space-y-2">
                          {topTrees.map((t, i) => (
                            <Link key={t.id} to={`/tree/${t.id}`} className="flex items-center gap-2 text-xs font-serif hover:text-primary transition-colors">
                              <span className="text-muted-foreground w-4">{i + 1}.</span>
                              <span className="flex-1 truncate">{t.name}</span>
                              <span className="tabular-nums" style={{ color: `hsl(${hive.accentHsl})` }}>{t.hearts}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-card/60 backdrop-blur border-border/40">
                    <CardContent className="p-5">
                      <h4 className="text-sm font-serif mb-3 text-foreground">🚶 Top Wanderers</h4>
                      {topWanderers.length === 0 ? (
                        <p className="text-xs text-muted-foreground font-serif">No data yet</p>
                      ) : (
                        <div className="space-y-2">
                          {topWanderers.map(([uid, hearts], i) => (
                            <div key={uid} className="flex items-center gap-2 text-xs font-serif">
                              <span className="text-muted-foreground w-4">{i + 1}.</span>
                              <span className="flex-1 text-muted-foreground truncate">{uid.slice(0, 8)}…</span>
                              <span className="tabular-nums" style={{ color: `hsl(${hive.accentHsl})` }}>{hearts}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Staking — Coming Soon */}
                <Card className="bg-card/60 backdrop-blur border-border/40">
                  <CardContent className="p-6 text-center">
                    <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <h4 className="text-sm font-serif text-foreground mb-1">Species Heart Staking</h4>
                    <p className="text-xs text-muted-foreground font-serif mb-3 max-w-md mx-auto">
                      Stake {hive.family} Hearts at individual trees or the collective hive to earn S33D Hearts drip, species boosts, and lottery eligibility.
                    </p>
                    <Badge variant="outline" className="font-serif text-[10px]">Coming Soon</Badge>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Offerings Tab */}
            <TabsContent value="offerings">
              <OfferingList
                offerings={offerings as any}
                treeLookup={trees.map(t => ({ id: t.id, name: t.name }))}
                limit={50}
                emptyMessage="No offerings yet in this hive."
                showTreeLink
              />
            </TabsContent>

            {/* Lore Tab */}
            <TabsContent value="lore">
              <Card className="bg-card/60 backdrop-blur border-border/40">
                <CardContent className="p-6">
                  <h3 className="text-xl font-serif mb-4" style={{ color: `hsl(${hive.accentHsl})` }}>
                    {hive.icon} About the {hive.family} Family
                  </h3>
                  <p className="text-muted-foreground font-serif leading-relaxed mb-4">{hive.description}</p>
                  <div className="border-t border-border/40 pt-4 mt-4">
                    <h4 className="text-sm font-serif text-foreground mb-3 tracking-wider uppercase">Known Species</h4>
                    <div className="flex flex-wrap gap-2">
                      {hive.representativeSpecies.map(sp => (
                        <Badge key={sp} variant="secondary" className="font-serif text-xs">{sp}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Governance Tab */}
            <TabsContent value="governance">
              <div className="space-y-4">
                {/* Influence Overview */}
                <Card className="bg-card/60 backdrop-blur border-border/40">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-serif mb-4 flex items-center gap-2" style={{ color: `hsl(${hive.accentHsl})` }}>
                      <Shield className="w-5 h-5" /> Hive Council
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                      <div>
                        <p className="text-2xl font-serif font-bold" style={{ color: "hsl(42, 80%, 50%)" }}>{totalInfluence}</p>
                        <p className="text-[11px] text-muted-foreground font-serif">Total Influence</p>
                      </div>
                      <div>
                        <p className="text-2xl font-serif font-bold text-foreground">{Object.keys(curatorMap).length}</p>
                        <p className="text-[11px] text-muted-foreground font-serif">Active Curators</p>
                      </div>
                      <div>
                        <p className="text-2xl font-serif font-bold text-foreground">{influenceTxs.length}</p>
                        <p className="text-[11px] text-muted-foreground font-serif">Curation Actions</p>
                      </div>
                    </div>

                    {/* How influence is earned */}
                    <div className="border-t border-border/30 pt-4">
                      <p className="text-xs font-serif text-muted-foreground mb-2 uppercase tracking-wider">How Influence is Earned</p>
                      <div className="flex flex-wrap gap-1.5">
                        {["Verify tree records", "Add missing metadata", "High-quality media", "Resolve duplicates",
                          "Curate playlists", "Tag offerings"].map(a => (
                          <Badge key={a} variant="secondary" className="text-[9px] font-serif">{a}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Curators Leaderboard */}
                <Card className="bg-card/60 backdrop-blur border-border/40">
                  <CardContent className="p-5">
                    <h4 className="text-sm font-serif mb-3 text-foreground flex items-center gap-2">
                      🛡️ Top Curators
                    </h4>
                    {topCurators.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-serif">No curators yet — be the first!</p>
                    ) : (
                      <div className="space-y-2">
                        {topCurators.map(([uid, inf], i) => (
                          <div key={uid} className="flex items-center gap-2 text-xs font-serif">
                            <span className="text-muted-foreground w-4">{i + 1}.</span>
                            <span className="flex-1 text-muted-foreground truncate">{uid.slice(0, 8)}…</span>
                            <span className="tabular-nums" style={{ color: "hsl(42, 80%, 50%)" }}>{inf} influence</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Proposals — Coming Soon */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {["Proposals", "Staking Governance"].map(item => (
                    <Card key={item} className="bg-card/60 backdrop-blur border-border/40">
                      <CardContent className="p-5 text-center">
                        <p className="font-serif text-sm text-foreground mb-1">{item}</p>
                        <Badge variant="outline" className="text-[10px] font-serif">Coming Soon</Badge>
                      </CardContent>
                    </Card>
                  ))}
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

export default HivePage;
