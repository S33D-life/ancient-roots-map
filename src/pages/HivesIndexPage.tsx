import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAllHives, type HiveInfo, getHiveForSpecies } from "@/utils/hiveUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, MapPin, TreePine, Music, Heart, Users, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HiveStats {
  treeCount: number;
  offeringCount: number;
  wandererCount: number;
  heartCount: number;
  topSpecies: string[];
  recentTrees: { name: string; id: string }[];
  nations: string[];
}

const HivesIndexPage = () => {
  const navigate = useNavigate();
  const allHives = useMemo(() => getAllHives(), []);
  const [hiveStats, setHiveStats] = useState<Record<string, HiveStats>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFamily, setActiveFamily] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"trees" | "offerings" | "name">("trees");

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch trees + offerings in parallel
      const [treesRes, offeringsRes, heartsRes] = await Promise.all([
        supabase.from("trees").select("id, name, species, nation, created_by, created_at").order("created_at", { ascending: false }),
        supabase.from("offerings").select("tree_id, type, created_by"),
        supabase.from("species_heart_transactions").select("species_family, amount"),
      ]);

      const trees = treesRes.data || [];
      const offerings = offeringsRes.data || [];
      const hearts = heartsRes.data || [];

      // Build offering map by tree_id
      const offeringsByTree: Record<string, { count: number; creators: Set<string> }> = {};
      offerings.forEach(o => {
        if (!offeringsByTree[o.tree_id]) offeringsByTree[o.tree_id] = { count: 0, creators: new Set() };
        offeringsByTree[o.tree_id].count++;
        if (o.created_by) offeringsByTree[o.tree_id].creators.add(o.created_by);
      });

      // Build heart totals by family
      const heartsByFamily: Record<string, number> = {};
      hearts.forEach(h => {
        heartsByFamily[h.species_family] = (heartsByFamily[h.species_family] || 0) + h.amount;
      });

      // Build per-hive stats
      const stats: Record<string, HiveStats> = {};
      const hiveTreeMap: Record<string, typeof trees> = {};

      trees.forEach(t => {
        const hive = getHiveForSpecies(t.species);
        if (!hive) return;
        if (!hiveTreeMap[hive.family]) hiveTreeMap[hive.family] = [];
        hiveTreeMap[hive.family].push(t);
      });

      for (const [family, hiveTrees] of Object.entries(hiveTreeMap)) {
        const wanderers = new Set<string>();
        let offeringCount = 0;
        const speciesCounts: Record<string, number> = {};
        const nations = new Set<string>();

        hiveTrees.forEach(t => {
          if (t.created_by) wanderers.add(t.created_by);
          if (t.nation) nations.add(t.nation);
          speciesCounts[t.species] = (speciesCounts[t.species] || 0) + 1;
          const treeOfferings = offeringsByTree[t.id];
          if (treeOfferings) {
            offeringCount += treeOfferings.count;
            treeOfferings.creators.forEach(c => wanderers.add(c));
          }
        });

        const topSpecies = Object.entries(speciesCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([sp]) => sp);

        stats[family] = {
          treeCount: hiveTrees.length,
          offeringCount,
          wandererCount: wanderers.size,
          heartCount: heartsByFamily[family] || 0,
          topSpecies,
          recentTrees: hiveTrees.slice(0, 3).map(t => ({ name: t.name, id: t.id })),
          nations: [...nations].slice(0, 4),
        };
      }

      setHiveStats(stats);
      setLoading(false);
    };
    fetchStats();
  }, []);

  const filteredHives = useMemo(() => {
    let result = allHives;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(h =>
        h.displayName.toLowerCase().includes(q) ||
        h.family.toLowerCase().includes(q) ||
        h.representativeSpecies.some(sp => sp.toLowerCase().includes(q))
      );
    }
    // Only show hives with trees (unless searching)
    if (!search) {
      result = result.filter(h => (hiveStats[h.family]?.treeCount || 0) > 0);
    }
    return result;
  }, [allHives, search, hiveStats]);

  const sortedHives = useMemo(() => {
    return [...filteredHives].sort((a, b) => {
      const sa = hiveStats[a.family];
      const sb = hiveStats[b.family];
      if (sortBy === "trees") return (sb?.treeCount || 0) - (sa?.treeCount || 0);
      if (sortBy === "offerings") return (sb?.offeringCount || 0) - (sa?.offeringCount || 0);
      return a.displayName.localeCompare(b.displayName);
    });
  }, [filteredHives, hiveStats, sortBy]);

  const totalTrees = useMemo(() =>
    Object.values(hiveStats).reduce((s, h) => s + h.treeCount, 0)
  , [hiveStats]);

  const totalHivesActive = useMemo(() =>
    Object.values(hiveStats).filter(h => h.treeCount > 0).length
  , [hiveStats]);

  const handleFilterOnMap = useCallback((hive: HiveInfo) => {
    navigate(`/map?species=${encodeURIComponent(hive.representativeSpecies[0] || hive.family)}`);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif text-primary tracking-wide mb-2">Species Hives</h1>
          <p className="text-muted-foreground font-serif mb-5 max-w-2xl text-sm">
            Living botanical families of the Ancient Friends grove. Each hive holds its own trees, offerings, and ecological wisdom.
          </p>

          {/* Global stats bar */}
          {!loading && (
            <div className="flex flex-wrap items-center gap-4 text-xs font-serif text-muted-foreground mb-5 pb-5 border-b border-border/30">
              <span className="flex items-center gap-1.5"><TreePine className="w-3.5 h-3.5 text-primary" /> {totalTrees} trees</span>
              <span className="flex items-center gap-1.5">🐝 {totalHivesActive} active hives</span>
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {Object.values(hiveStats).reduce((s, h) => s + h.wandererCount, 0)} wanderers</span>
            </div>
          )}

          {/* Search + sort controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search hives or species…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 font-serif text-sm"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <div className="flex gap-1.5">
              {(["trees", "offerings", "name"] as const).map(key => (
                <Button
                  key={key}
                  variant={sortBy === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(key)}
                  className="font-serif text-xs capitalize"
                >
                  {key === "trees" ? "Most Trees" : key === "offerings" ? "Most Offerings" : "A–Z"}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground font-serif">Gathering the grove…</p>
          </div>
        ) : sortedHives.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-serif">No hives match your search.</p>
            <Button variant="ghost" className="mt-3 font-serif text-xs" onClick={() => setSearch("")}>Clear search</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {sortedHives.map((hive, i) => {
                const stats = hiveStats[hive.family];
                const isExpanded = activeFamily === hive.family;

                return (
                  <motion.div
                    key={hive.family}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03, type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Card
                      className="bg-card/70 backdrop-blur border-border/50 hover:border-primary/30 transition-all group cursor-pointer overflow-hidden relative"
                      onClick={() => setActiveFamily(isExpanded ? null : hive.family)}
                    >
                      {/* Accent gradient top edge */}
                      <div
                        className="h-1 w-full"
                        style={{ background: `linear-gradient(90deg, transparent, hsl(${hive.accentHsl}), transparent)` }}
                      />

                      <CardContent className="p-5">
                        {/* Header row */}
                        <div className="flex items-start gap-3 mb-3">
                          <span className="text-3xl">{hive.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-serif text-lg text-foreground group-hover:text-primary transition-colors leading-tight">
                              {hive.displayName}
                            </h3>
                            <p className="text-[11px] text-muted-foreground font-serif mt-0.5 line-clamp-2 leading-snug">
                              {hive.description}
                            </p>
                          </div>
                        </div>

                        {/* Stats row */}
                        {stats && (
                          <div className="grid grid-cols-4 gap-2 mb-3">
                            {[
                              { icon: <TreePine className="w-3 h-3" />, value: stats.treeCount, label: "Trees" },
                              { icon: <Music className="w-3 h-3" />, value: stats.offeringCount, label: "Offerings" },
                              { icon: <Heart className="w-3 h-3" />, value: stats.heartCount, label: "Hearts" },
                              { icon: <Users className="w-3 h-3" />, value: stats.wandererCount, label: "Wanderers" },
                            ].map(m => (
                              <div key={m.label} className="text-center">
                                <div className="flex items-center justify-center text-muted-foreground mb-0.5">{m.icon}</div>
                                <p className="text-sm font-serif tabular-nums" style={{ color: `hsl(${hive.accentHsl})` }}>{m.value}</p>
                                <p className="text-[9px] text-muted-foreground font-serif leading-none">{m.label}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Species chips */}
                        {stats && stats.topSpecies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {stats.topSpecies.slice(0, 4).map(sp => (
                              <Badge
                                key={sp}
                                variant="outline"
                                className="text-[9px] font-serif py-0 px-1.5 cursor-pointer hover:bg-primary/10 transition-colors"
                                style={{ borderColor: `hsl(${hive.accentHsl} / 0.35)` }}
                                onClick={e => {
                                  e.stopPropagation();
                                  navigate(`/map?species=${encodeURIComponent(sp)}`);
                                }}
                              >
                                {sp}
                              </Badge>
                            ))}
                            {stats.topSpecies.length > 4 && (
                              <Badge variant="secondary" className="text-[9px] font-serif py-0 px-1.5">
                                +{hive.representativeSpecies.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Nations */}
                        {stats && stats.nations.length > 0 && (
                          <p className="text-[10px] text-muted-foreground/70 font-serif truncate">
                            🌍 {stats.nations.join(" · ")}
                          </p>
                        )}

                        {/* Expanded detail panel */}
                        <AnimatePresence>
                          {isExpanded && stats && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-border/30 mt-3 pt-3 space-y-3">
                                {/* Recent trees */}
                                {stats.recentTrees.length > 0 && (
                                  <div>
                                    <p className="text-[10px] text-muted-foreground font-serif uppercase tracking-wider mb-1.5">Recent Encounters</p>
                                    <div className="space-y-1">
                                      {stats.recentTrees.map(t => (
                                        <Link
                                          key={t.id}
                                          to={`/tree/${t.id}`}
                                          onClick={e => e.stopPropagation()}
                                          className="block text-xs font-serif text-foreground/80 hover:text-primary transition-colors truncate"
                                        >
                                          🌳 {t.name}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex gap-2">
                                  <Link
                                    to={`/hive/${hive.slug}`}
                                    onClick={e => e.stopPropagation()}
                                    className="flex-1"
                                  >
                                    <Button variant="outline" size="sm" className="w-full font-serif text-xs gap-1.5">
                                      Enter Hive <ArrowRight className="w-3 h-3" />
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="font-serif text-xs gap-1.5"
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleFilterOnMap(hive);
                                    }}
                                  >
                                    <MapPin className="w-3 h-3" /> Atlas
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Collapsed: subtle CTA */}
                        {!isExpanded && (
                          <div className="flex items-center justify-end mt-2">
                            <span className="text-[10px] font-serif text-muted-foreground/50 group-hover:text-primary/60 transition-colors flex items-center gap-1">
                              Tap to explore <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Empty hives — collapsed section */}
        {!loading && !search && (
          (() => {
            const emptyHives = allHives.filter(h => !(hiveStats[h.family]?.treeCount));
            if (emptyHives.length === 0) return null;
            return (
              <details className="mt-10 group">
                <summary className="text-xs font-serif text-muted-foreground/60 cursor-pointer hover:text-muted-foreground transition-colors">
                  {emptyHives.length} hive{emptyHives.length !== 1 ? "s" : ""} awaiting their first Ancient Friend…
                </summary>
                <div className="flex flex-wrap gap-2 mt-3">
                  {emptyHives.map(h => (
                    <Link key={h.family} to={`/hive/${h.slug}`}>
                      <Badge variant="outline" className="font-serif text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors gap-1">
                        {h.icon} {h.displayName}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </details>
            );
          })()
        )}
      </div>
      <Footer />
    </div>
  );
};

export default HivesIndexPage;
