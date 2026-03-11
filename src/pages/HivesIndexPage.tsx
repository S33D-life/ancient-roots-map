import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import WhyThisMatters from "@/components/WhyThisMatters";
import { useMapFocus } from "@/hooks/use-map-focus";
import { supabase } from "@/integrations/supabase/client";
import { useOfferingCounts } from "@/hooks/use-offering-counts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAllHives, type HiveInfo, getHiveForSpecies } from "@/utils/hiveUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import HexHiveCell from "@/components/hives/HexHiveCell";
import HoneycombGrid from "@/components/hives/HoneycombGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Loader2, Search, MapPin, TreePine, Music, Heart, Users, ArrowRight, X, Sparkles, Filter } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";

interface HiveStats {
  treeCount: number;
  offeringCount: number;
  wandererCount: number;
  heartCount: number;
  topSpecies: string[];
  speciesCounts: Record<string, number>;
  recentTrees: { name: string; id: string }[];
  nations: string[];
}

/** Animated number counter */
const AnimatedStat = ({ value, color }: { value: number; color?: string }) => {
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, { stiffness: 80, damping: 20 });
  const display = useTransform(springVal, v => Math.round(v).toLocaleString());
  
  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);
  
  return <motion.span style={{ color }}>{display}</motion.span>;
};

const HivesIndexPage = () => {
  const navigate = useNavigate();
  const { focusMap } = useMapFocus();
  const allHives = useMemo(() => getAllHives(), []);
  const [hiveStats, setHiveStats] = useState<Record<string, HiveStats>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFamily, setActiveFamily] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"trees" | "offerings" | "hearts" | "name">("trees");
  const [filterFamily, setFilterFamily] = useState<string | null>(null);
  const [speciesMode, setSpeciesMode] = useState(false);

  const { counts: globalOfferingCounts } = useOfferingCounts();

  useEffect(() => {
    const fetchStats = async () => {
      const [treesRes, heartsRes, researchRes] = await Promise.all([
        supabase.from("trees").select("id, name, species, nation, created_by, created_at").order("created_at", { ascending: false }),
        supabase.from("species_heart_transactions").select("species_family, amount"),
        supabase.from("research_trees").select("id, tree_name, species_common, species_scientific, country, created_at").order("created_at", { ascending: false }).limit(1000),
      ]);

      const trees = treesRes.data || [];
      const hearts = heartsRes.data || [];
      const researchTrees = researchRes.data || [];

      const heartsByFamily: Record<string, number> = {};
      hearts.forEach(h => {
        heartsByFamily[h.species_family] = (heartsByFamily[h.species_family] || 0) + h.amount;
      });

      const stats: Record<string, HiveStats> = {};
      const hiveTreeMap: Record<string, { id: string; name: string; species: string; nation: string | null; created_by: string | null }[]> = {};

      // Map user trees
      trees.forEach(t => {
        const hive = getHiveForSpecies(t.species);
        if (!hive) return;
        if (!hiveTreeMap[hive.family]) hiveTreeMap[hive.family] = [];
        hiveTreeMap[hive.family].push(t);
      });

      // Map research trees (use species_common or species_scientific for matching)
      researchTrees.forEach(rt => {
        const speciesName = rt.species_common || rt.species_scientific;
        const hive = getHiveForSpecies(speciesName);
        if (!hive) return;
        if (!hiveTreeMap[hive.family]) hiveTreeMap[hive.family] = [];
        hiveTreeMap[hive.family].push({
          id: rt.id,
          name: rt.tree_name || speciesName,
          species: speciesName,
          nation: rt.country,
          created_by: null,
        });
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
          offeringCount += globalOfferingCounts[t.id] || 0;
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
          speciesCounts,
          recentTrees: hiveTrees.slice(0, 3).map(t => ({ name: t.name, id: t.id })),
          nations: [...nations].slice(0, 4),
        };
      }

      setHiveStats(stats);
      setLoading(false);
    };
    fetchStats();
  }, [globalOfferingCounts]);

  // Active family chips (hives with trees, sorted by tree count)
  const activeChips = useMemo(() => {
    return allHives
      .filter(h => (hiveStats[h.family]?.treeCount || 0) > 0)
      .sort((a, b) => (hiveStats[b.family]?.treeCount || 0) - (hiveStats[a.family]?.treeCount || 0));
  }, [allHives, hiveStats]);

  // Flat species list for species-mode view
  const allSpeciesFlat = useMemo(() => {
    if (!speciesMode) return [];
    const species: { name: string; family: string; count: number; hive: HiveInfo }[] = [];
    for (const hive of allHives) {
      const st = hiveStats[hive.family];
      if (!st) continue;
      for (const [sp, count] of Object.entries(st.speciesCounts)) {
        species.push({ name: sp, family: hive.family, count, hive });
      }
    }
    return species.sort((a, b) => b.count - a.count);
  }, [speciesMode, allHives, hiveStats]);

  const filteredHives = useMemo(() => {
    let result = allHives;
    if (filterFamily) {
      result = result.filter(h => h.family === filterFamily);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(h =>
        h.displayName.toLowerCase().includes(q) ||
        h.family.toLowerCase().includes(q) ||
        h.representativeSpecies.some(sp => sp.toLowerCase().includes(q))
      );
    }
    if (!search && !filterFamily) {
      result = result.filter(h => (hiveStats[h.family]?.treeCount || 0) > 0);
    }
    return result;
  }, [allHives, search, hiveStats, filterFamily]);

  const sortedHives = useMemo(() => {
    return [...filteredHives].sort((a, b) => {
      const sa = hiveStats[a.family];
      const sb = hiveStats[b.family];
      if (sortBy === "trees") return (sb?.treeCount || 0) - (sa?.treeCount || 0);
      if (sortBy === "offerings") return (sb?.offeringCount || 0) - (sa?.offeringCount || 0);
      if (sortBy === "hearts") return (sb?.heartCount || 0) - (sa?.heartCount || 0);
      return a.displayName.localeCompare(b.displayName);
    });
  }, [filteredHives, hiveStats, sortBy]);

  const totalTrees = useMemo(() =>
    Object.values(hiveStats).reduce((s, h) => s + h.treeCount, 0)
  , [hiveStats]);

  const totalHivesActive = useMemo(() =>
    Object.values(hiveStats).filter(h => h.treeCount > 0).length
  , [hiveStats]);

  const totalHearts = useMemo(() =>
    Object.values(hiveStats).reduce((s, h) => s + h.heartCount, 0)
  , [hiveStats]);

  const totalWanderers = useMemo(() =>
    Object.values(hiveStats).reduce((s, h) => s + h.wandererCount, 0)
  , [hiveStats]);

  const handleFilterOnMap = useCallback((hive: HiveInfo) => {
    focusMap({ type: "area", id: hive.family, source: "hive", hiveSlug: hive.slug });
  }, [focusMap]);

  const filteredSpecies = useMemo(() => {
    if (!speciesMode) return [];
    let result = allSpeciesFlat;
    if (filterFamily) {
      result = result.filter(s => s.family === filterFamily);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.family.toLowerCase().includes(q));
    }
    return result;
  }, [allSpeciesFlat, filterFamily, search, speciesMode]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-20 max-w-6xl">
        {/* Hero header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl md:text-4xl font-serif text-primary tracking-wide mb-2">Species Hives</h1>
          <p className="text-muted-foreground font-serif mb-5 max-w-2xl text-sm">
            Living botanical families of the Ancient Friends grove. Each hive holds its own trees, offerings, and ecological wisdom.
          </p>
          <WhyThisMatters
            id="hives-intro"
            message="Hives group trees by botanical family. Each hive is a living community — the more trees mapped, the stronger the hive grows. Explore one to see its species, offerings, and regional presence."
            delay={2500}
          />

          {/* Live animated global stats */}
          {!loading && (
            <div className="flex flex-wrap items-center gap-5 text-xs font-serif text-muted-foreground mb-5 pb-5 border-b border-border/30">
              <span className="flex items-center gap-1.5">
                <TreePine className="w-3.5 h-3.5 text-primary" />
                <AnimatedStat value={totalTrees} /> trees
              </span>
              <span className="flex items-center gap-1.5">
                🐝 <AnimatedStat value={totalHivesActive} /> active hives
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-destructive/70" />
                <AnimatedStat value={totalHearts} /> hearts
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <AnimatedStat value={totalWanderers} /> wanderers
              </span>
            </div>
          )}

          {/* Quick-filter chips — horizontally scrollable */}
          {!loading && activeChips.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-serif uppercase tracking-wider">Quick Filter</span>
                {filterFamily && (
                  <button
                    onClick={() => setFilterFamily(null)}
                    className="text-[10px] text-primary hover:text-primary/80 font-serif ml-auto flex items-center gap-0.5"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-1.5 pb-2">
                  {activeChips.map(hive => {
                    const isActive = filterFamily === hive.family;
                    const count = hiveStats[hive.family]?.treeCount || 0;
                    return (
                      <button
                        key={hive.family}
                        onClick={() => setFilterFamily(isActive ? null : hive.family)}
                        className={`
                          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif
                          border transition-all shrink-0
                          ${isActive
                            ? "border-primary bg-primary/15 text-primary shadow-sm"
                            : "border-border/50 bg-card/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                          }
                        `}
                      >
                        <span>{hive.icon}</span>
                        <span className="truncate max-w-[100px]">{hive.displayName.replace(" Hive", "")}</span>
                        <span className={`tabular-nums text-[10px] ${isActive ? "text-primary" : "text-muted-foreground/60"}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {/* Search + sort + mode toggle */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={speciesMode ? "Search species…" : "Search hives or species…"}
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
            <div className="flex gap-1.5 flex-wrap">
              {(["trees", "offerings", "hearts", "name"] as const).map(key => (
                <Button
                  key={key}
                  variant={sortBy === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(key)}
                  className="font-serif text-xs capitalize"
                >
                  {key === "trees" ? "Most Trees" : key === "offerings" ? "Most Offerings" : key === "hearts" ? "Most Hearts" : "A–Z"}
                </Button>
              ))}
              <Button
                variant={speciesMode ? "default" : "outline"}
                size="sm"
                onClick={() => setSpeciesMode(!speciesMode)}
                className="font-serif text-xs gap-1"
              >
                <Sparkles className="w-3 h-3" />
                {speciesMode ? "Hive View" : "Species View"}
              </Button>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground font-serif">Gathering the grove…</p>
          </div>
        ) : speciesMode ? (
          /* ── Species Discovery Mode ── */
          filteredSpecies.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground font-serif">No species match your filters.</p>
              <Button variant="ghost" className="mt-3 font-serif text-xs" onClick={() => { setSearch(""); setFilterFamily(null); }}>Clear filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredSpecies.slice(0, 80).map((sp, i) => (
                  <motion.div
                    key={`${sp.family}-${sp.name}`}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.015, type: "spring", stiffness: 350, damping: 30 }}
                  >
                    <Card
                      className="bg-card/60 backdrop-blur border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
                      onClick={() => focusMap({ type: "area", id: sp.name, source: "hive", hiveSlug: sp.hive.slug })}
                    >
                      <div className="h-0.5 w-full" style={{ background: `hsl(${sp.hive.accentHsl})` }} />
                      <CardContent className="p-3">
                        <p className="font-serif text-sm text-foreground group-hover:text-primary transition-colors truncate leading-tight">
                          {sp.name}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-muted-foreground/70 font-serif truncate">{sp.hive.icon} {sp.hive.displayName.replace(" Hive", "")}</span>
                          <Badge variant="secondary" className="text-[9px] font-serif px-1.5 py-0 tabular-nums">
                            {sp.count}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )
        ) : sortedHives.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-serif">No hives match your search.</p>
            <Button variant="ghost" className="mt-3 font-serif text-xs" onClick={() => { setSearch(""); setFilterFamily(null); }}>Clear filters</Button>
          </div>
        ) : (
          /* ── Honeycomb Hive Wall ── */
          <div className="honeycomb-bg relative">
            {/* Pollen particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="pollen-particle absolute w-1 h-1 rounded-full bg-primary/30"
                  style={{
                    left: `${15 + i * 18}%`,
                    top: `${60 + (i % 3) * 15}%`,
                    animationDelay: `${i * 1.2}s`,
                  }}
                />
              ))}
            </div>

            <HoneycombGrid>
              {sortedHives.map((hive, i) => {
                const stats = hiveStats[hive.family];
                return (
                  <motion.div
                    key={hive.family}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <HexHiveCell
                      icon={hive.icon}
                      name={hive.displayName}
                      accentHsl={hive.accentHsl}
                      treeCount={stats?.treeCount || 0}
                      offeringCount={stats?.offeringCount || 0}
                      heartCount={stats?.heartCount || 0}
                      wandererCount={stats?.wandererCount || 0}
                      topSpecies={stats?.topSpecies || []}
                      nations={stats?.nations || []}
                      speciesCounts={stats?.speciesCounts || {}}
                      isExpanded={activeFamily === hive.family}
                      onClick={() => {
                        if (activeFamily === hive.family) {
                          navigate(`/hive/${hive.slug}`);
                        } else {
                          setActiveFamily(hive.family);
                        }
                      }}
                    />
                  </motion.div>
                );
              })}
            </HoneycombGrid>

            {/* Expanded hive detail panel */}
            <AnimatePresence>
              {activeFamily && (() => {
                const hive = allHives.find(h => h.family === activeFamily);
                const stats = hiveStats[activeFamily];
                if (!hive || !stats) return null;
                return (
                  <motion.div
                    key={activeFamily}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="mt-6 mx-auto max-w-md rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 relative"
                  >
                    <button
                      onClick={() => setActiveFamily(null)}
                      className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{hive.icon}</span>
                      <div>
                        <h3 className="font-serif text-lg text-foreground">{hive.displayName}</h3>
                     <p className="text-[11px] text-muted-foreground font-serif">{hive.description}</p>
                       </div>
                     </div>

                     {/* Quick stats row */}
                     <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                       {[
                         { icon: <TreePine className="w-3 h-3" />, val: stats.treeCount, label: "trees" },
                         { icon: <Music className="w-3 h-3" />, val: stats.offeringCount, label: "offerings" },
                         { icon: <Heart className="w-3 h-3" />, val: stats.heartCount, label: "hearts" },
                         { icon: <Users className="w-3 h-3" />, val: stats.wandererCount, label: "wanderers" },
                       ].map(m => (
                         <div key={m.label} className="text-center">
                           <div className="flex items-center justify-center gap-0.5 text-muted-foreground/60 mb-0.5">{m.icon}</div>
                           <p className="text-sm font-serif font-semibold" style={{ color: `hsl(${hive.accentHsl})` }}>{m.val}</p>
                           <p className="text-[8px] text-muted-foreground/50 font-serif">{m.label}</p>
                         </div>
                       ))}
                     </div>

                     {/* Species breakdown mini-bars */}
                     {Object.keys(stats.speciesCounts).length > 0 && (
                       <div className="mb-3">
                         <p className="text-[10px] text-muted-foreground font-serif uppercase tracking-wider mb-1.5">Top Species</p>
                         <div className="space-y-1">
                           {Object.entries(stats.speciesCounts)
                             .sort((a, b) => b[1] - a[1])
                             .slice(0, 4)
                             .map(([sp, count]) => {
                               const pct = Math.min(100, (count / stats.treeCount) * 100);
                               return (
                                 <div key={sp} className="flex items-center gap-2">
                                   <span className="text-[10px] font-serif text-muted-foreground/80 truncate w-24">{sp}</span>
                                   <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `hsl(${hive.accentHsl} / 0.1)` }}>
                                     <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `hsl(${hive.accentHsl} / 0.6)` }} />
                                   </div>
                                   <span className="text-[9px] tabular-nums text-muted-foreground/60 w-5 text-right">{count}</span>
                                 </div>
                               );
                             })}
                         </div>
                       </div>
                     )}

                     {stats.recentTrees.length > 0 && (
                       <div className="mb-3">
                         <p className="text-[10px] text-muted-foreground font-serif uppercase tracking-wider mb-1.5">Recent Encounters</p>
                         <div className="space-y-1">
                           {stats.recentTrees.map(t => (
                             <Link
                               key={t.id}
                               to={`/tree/${t.id}`}
                               className="block text-xs font-serif text-foreground/80 hover:text-primary transition-colors truncate"
                             >
                               🌳 {t.name}
                             </Link>
                           ))}
                         </div>
                       </div>
                     )}

                     {stats.nations.length > 0 && (
                       <p className="text-[10px] text-muted-foreground/70 font-serif mb-3">
                         🌍 {stats.nations.join(" · ")}
                       </p>
                     )}

                     <div className="flex gap-2">
                       <Link to={`/hive/${hive.slug}`} className="flex-1">
                         <Button variant="outline" size="sm" className="w-full font-serif text-xs gap-1.5">
                           Enter Hive <ArrowRight className="w-3 h-3" />
                         </Button>
                       </Link>
                       <Button
                         variant="outline"
                         size="sm"
                         className="font-serif text-xs gap-1.5"
                         onClick={() => handleFilterOnMap(hive)}
                       >
                         <MapPin className="w-3 h-3" /> Atlas
                       </Button>
                     </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>
        )}

        {/* Empty hives — collapsed section */}
        {!loading && !search && !filterFamily && !speciesMode && (
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
