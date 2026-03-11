import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useMapFocus } from "@/hooks/use-map-focus";
import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useOfferingCounts } from "@/hooks/use-offering-counts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getHiveBySlug, type HiveInfo } from "@/utils/hiveUtils";
import { matchSpecies } from "@/data/treeSpecies";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TreePine, Heart, Music, Users, Map, Shield, TrendingUp, Lock, Flame, Layers, MapPin } from "lucide-react";
import { useMarkets } from "@/hooks/use-markets";
import MarketCard from "@/components/MarketCard";
import { motion } from "framer-motion";
import SeasonalLensBanner from "@/components/seasonal/SeasonalLensBanner";
import { useSeasonalSummary } from "@/hooks/use-seasonal-summary";
import OfferingList from "@/components/OfferingList";
import HiveSpeciesLeaderboard from "@/components/HiveSpeciesLeaderboard";
import InfluenceWeightedVoting from "@/components/InfluenceWeightedVoting";
import BloomingClock from "@/components/BloomingClock";
import { useHiveSeasonalStatus } from "@/hooks/use-hive-seasonal-status";
import HiveActivityOrb from "@/components/hive/HiveActivityOrb";
import HiveUserBalance from "@/components/hive/HiveUserBalance";
import HiveLeaderboardCard from "@/components/growth/HiveLeaderboardCard";

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

type OfferingRow = Database["public"]["Tables"]["offerings"]["Row"];

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
  const { focusMap } = useMapFocus();
  const hive = family ? getHiveBySlug(family) : null;
  const { getStatusForFamily } = useHiveSeasonalStatus();
  const seasonalStatus = hive ? getStatusForFamily(hive.family) : undefined;
  const seasonal = useSeasonalSummary();
  const { userId: currentUserId } = useCurrentUser();
  const [trees, setTrees] = useState<TreeRow[]>([]);
  const [offerings, setOfferings] = useState<OfferingRow[]>([]);
  const [speciesHearts, setSpeciesHearts] = useState<SpeciesHeartTx[]>([]);
  const [influenceTxs, setInfluenceTxs] = useState<InfluenceTx[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, { full_name: string | null; avatar_url: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("trees");
  const [bioRegionDist, setBioRegionDist] = useState<Array<{ id: string; name: string; type: string; count: number }>>([]);
  const { counts: globalOfferingCounts } = useOfferingCounts();
  const { markets: hiveMarkets, loading: loadingMarkets } = useMarkets({ hiveId: family });

  useEffect(() => {
    if (!hive) { setLoading(false); return; }
    const fetchData = async () => {
      // Fetch all trees + research trees in parallel
      const [treesResult, researchResult] = await Promise.all([
        supabase
          .from("trees")
          .select("id, name, species, what3words, latitude, longitude, estimated_age, created_at, nation")
          .order("created_at", { ascending: false }),
        supabase
          .from("research_trees")
          .select("id, tree_name, species_common, species_scientific, country, latitude, longitude, created_at")
          .order("created_at", { ascending: false })
          .limit(1000),
      ]);

      // Filter user trees by hive family
      const hiveTrees = (treesResult.data || []).filter(t => {
        const match = matchSpecies(t.species);
        return match && match.family === hive.family;
      });

      // Filter research trees by hive family and merge
      const researchTrees = (researchResult.data || []).filter(rt => {
        const speciesName = rt.species_common || rt.species_scientific;
        const match = matchSpecies(speciesName);
        return match && match.family === hive.family;
      }).map(rt => ({
        id: rt.id,
        name: rt.tree_name || rt.species_common || rt.species_scientific,
        species: rt.species_common || rt.species_scientific,
        what3words: null,
        latitude: rt.latitude ? Number(rt.latitude) : null,
        longitude: rt.longitude ? Number(rt.longitude) : null,
        estimated_age: null as number | null,
        created_at: rt.created_at,
        nation: rt.country,
      }));

      const allTrees = [...hiveTrees, ...researchTrees];
      setTrees(allTrees);

      // Fetch species heart transactions for this family
      const [offsRes, speciesHeartsRes, influenceRes] = await Promise.all([
        hiveTrees.length > 0
          ? supabase.from("offerings").select("*")
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

      // Resolve user profiles for leaderboard display
      const allUserIds = new Set<string>();
      (speciesHeartsRes.data || []).forEach((tx: any) => allUserIds.add(tx.user_id));
      (influenceRes.data || []).forEach((tx: any) => allUserIds.add(tx.user_id));
      const uniqueIds = Array.from(allUserIds).slice(0, 50);
      if (uniqueIds.length > 0) {
        const { data: profiles } = await supabase.rpc("get_safe_profiles", { p_ids: uniqueIds });
        const pMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
        (profiles || []).forEach((p: any) => { pMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url }; });
        setProfileMap(pMap);
      }

      // Fetch bio-region distribution for this hive's species
      if (hiveTrees.length > 0) {
        const treeIds = hiveTrees.map(t => t.id).slice(0, 500);
        const { data: junctions } = await supabase
          .from("bio_region_trees")
          .select("bio_region_id")
          .in("tree_id", treeIds);
        if (junctions && junctions.length > 0) {
          const regionIds = [...new Set(junctions.map(j => j.bio_region_id))];
          const regionCounts: Record<string, number> = {};
          junctions.forEach(j => { regionCounts[j.bio_region_id] = (regionCounts[j.bio_region_id] || 0) + 1; });
          const { data: regions } = await supabase
            .from("bio_regions")
            .select("id, name, type")
            .in("id", regionIds);
          if (regions) {
            setBioRegionDist(regions.map(r => ({
              id: r.id, name: r.name, type: r.type,
              count: regionCounts[r.id] || 0,
            })).sort((a, b) => b.count - a.count));
          }
        }
      }

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

  // Monthly species hearts for activity orb
  const monthlyHearts = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return speciesHearts
      .filter(tx => tx.created_at >= monthStart)
      .reduce((s, tx) => s + tx.amount, 0);
  }, [speciesHearts]);

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
      <div className="container mx-auto px-4 pt-24 pb-20 max-w-5xl">
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

        {/* Seasonal Status Banner */}
        {seasonalStatus && seasonalStatus.stage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border overflow-hidden"
            style={{
              borderColor: `hsl(${hive.accentHsl} / 0.3)`,
              background: `linear-gradient(90deg, hsl(${hive.accentHsl} / 0.08), hsl(${hive.accentHsl} / 0.03))`,
            }}
          >
            <div className="flex items-center justify-between px-5 py-3.5 gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{seasonalStatus.emoji}</span>
                <div>
                  <p className="font-serif text-sm" style={{ color: `hsl(${hive.accentHsl})` }}>
                    {seasonalStatus.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-serif">
                    {seasonalStatus.matchedFoods.length > 0
                      ? `Based on ${seasonalStatus.matchedFoods.map(f => f.name).slice(0, 3).join(", ")}`
                      : "Seasonal cycle data"
                    }
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="font-serif text-xs gap-1.5"
                style={{ borderColor: `hsl(${hive.accentHsl} / 0.4)`, color: `hsl(${hive.accentHsl})` }}
                onClick={() => focusMap({ type: "area", id: hive.family, source: "hive", hiveSlug: family })}
              >
                <MapPin className="w-3.5 h-3.5" /> View on Map
              </Button>
            </div>
          </motion.div>
        )}
        {/* Seasonal Lens Banner */}
        <div className="mb-4">
          <SeasonalLensBanner context="general" />
        </div>

        {/* Activity Orb + User Balance */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
          <HiveActivityOrb
            monthlyHearts={monthlyHearts}
            accentHsl={hive.accentHsl}
            icon={hive.icon}
            familyLabel={hive.family}
          />
          <HiveUserBalance
            userId={currentUserId}
            family={hive.family}
            accentHsl={hive.accentHsl}
            icon={hive.icon}
          />
        </div>

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
              <TabsTrigger value="markets" className="font-serif text-xs tracking-wider">
                <Flame className="w-3.5 h-3.5 mr-1.5" /> Markets {hiveMarkets.length > 0 && `(${hiveMarkets.length})`}
              </TabsTrigger>
              <TabsTrigger value="lore" className="font-serif text-xs tracking-wider">📜 Lore</TabsTrigger>
              <TabsTrigger value="ecology" className="font-serif text-xs tracking-wider">
                <Layers className="w-3.5 h-3.5 mr-1.5" /> Ecology
              </TabsTrigger>
              <TabsTrigger value="governance" className="font-serif text-xs tracking-wider">🏛️ Council</TabsTrigger>
            </TabsList>

            {/* Trees Tab */}
            <TabsContent value="trees">
              {trees.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground font-serif">No Ancient Friends mapped in this hive yet.</p>
                  <Button onClick={() => focusMap({ type: "area", id: family || "", source: "hive", hiveSlug: family })} variant="outline" className="mt-4 font-serif gap-2">
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

            {/* Markets Tab */}
            <TabsContent value="markets">
              {loadingMarkets ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : hiveMarkets.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">🌀</p>
                  <p className="text-muted-foreground font-serif mb-3">No cycle markets for this hive yet.</p>
                  <Link to="/markets">
                    <Button variant="outline" className="font-serif text-xs gap-1.5">
                      <Flame className="w-3.5 h-3.5" /> Browse All Markets
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hiveMarkets.map((m, i) => (
                    <MarketCard key={m.id} market={m} index={i} />
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

                    {/* Collective Progress Bar */}
                    {totalSpeciesHearts > 0 && (() => {
                      const milestone = Math.ceil(totalSpeciesHearts / 1000) * 1000;
                      const progress = (totalSpeciesHearts / milestone) * 100;
                      return (
                        <div className="mb-6 space-y-1.5">
                          <div className="flex justify-between text-[10px] font-serif text-muted-foreground">
                            <span>Hive Growth</span>
                            <span>{totalSpeciesHearts} / {milestone.toLocaleString()} {hive.icon}</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: `hsl(${hive.accentHsl} / 0.15)` }}>
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: `linear-gradient(90deg, hsl(${hive.accentHsl} / 0.6), hsl(${hive.accentHsl}))` }}
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground/60 font-serif italic">
                            Collective species heart accumulation across all {hive.displayName.replace(" Hive", "")} trees
                          </p>
                        </div>
                      );
                    })()}

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

                {/* Monthly Leaderboard */}
                <HiveLeaderboardCard
                  family={hive.family}
                  accentHsl={hive.accentHsl}
                  icon={hive.icon}
                  compact
                />

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
                              <span className="flex-1 text-foreground truncate">{profileMap[uid]?.full_name || `Wanderer ${uid.slice(0, 6)}`}</span>
                              <span className="tabular-nums" style={{ color: `hsl(${hive.accentHsl})` }}>{hearts} {hive.icon}</span>
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
                      Stake {hive.family} Hearts at individual trees or the collective hive to earn S33D Hearts and species boosts. Staking is part of the broader S33D Heart economy being built in Chapter 3.
                    </p>
                    <Badge variant="outline" className="font-serif text-[10px]">Coming Later — Chapter 3</Badge>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Offerings Tab */}
            <TabsContent value="offerings">
              <OfferingList
                offerings={offerings}
                treeLookup={trees.map(t => ({ id: t.id, name: t.name, species: t.species, nation: t.nation }))}
                pageSize={50}
                emptyMessage="No offerings yet in this hive."
                showTreeLink
                sortable
                variant="full"
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

            {/* Ecology Tab — Bio-Region Distribution */}
            <TabsContent value="ecology">
              <div className="space-y-4">
                <Card className="bg-card/60 backdrop-blur border-border/40">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-serif mb-4 flex items-center gap-2" style={{ color: `hsl(${hive.accentHsl})` }}>
                      <Layers className="w-5 h-5" /> Distribution Across Bio-Regions
                    </h3>
                    {bioRegionDist.length === 0 ? (
                      <p className="text-sm text-muted-foreground font-serif">No bio-region links for this hive's trees yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {bioRegionDist.map(br => (
                          <Link key={br.id} to={`/atlas/bio-regions/${br.id}`}>
                            <Card className="border-primary/10 hover:border-primary/30 transition-all cursor-pointer">
                              <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-serif font-bold text-foreground">{br.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{br.type}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">{br.count} trees</Badge>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
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

                {/* Species Heart Leaderboard */}
                <HiveSpeciesLeaderboard family={hive.family} accentHsl={hive.accentHsl} icon={hive.icon} />

                {/* Blooming Clock for hive species */}
                <BloomingClock />

                {/* Influence-Weighted Proposals */}
                <InfluenceWeightedVoting hiveFamily={hive.family} />
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Continue your journey — loop closure */}
        <div className="mt-12 mb-8 px-4">
          <h3 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-4 text-center">
            Continue your journey
          </h3>
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <button
              onClick={() => focusMap({ type: "area", id: hive.family, source: "hive", hiveSlug: family })}
              className="loop-card font-serif text-left"
            >
              <span className="text-primary flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> View on Map
              </span>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">Find {hive.displayName} trees</p>
            </button>
            <Link to="/blooming-clock" className="loop-card font-serif text-left">
              <span className="text-primary flex items-center gap-1.5">
                🕰️ Blooming Clock
              </span>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">See seasonal rhythms</p>
            </Link>
            <Link to="/atlas" className="loop-card font-serif text-left">
              <span className="text-primary flex items-center gap-1.5">
                🌍 Atlas
              </span>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">Explore territories</p>
            </Link>
            <Link to="/hives" className="loop-card font-serif text-left">
              <span className="text-primary flex items-center gap-1.5">
                🐝 All Hives
              </span>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">Browse species families</p>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HivePage;
