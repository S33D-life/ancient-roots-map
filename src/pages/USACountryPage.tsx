import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  MapPin, ExternalLink, Scroll, TreeDeciduous, Eye, Compass, Heart,
  BookOpen, ChevronRight, Map as MapIcon, Footprints, Shield, BarChart3,
  Search, ArrowUpDown, Award, Calculator, Leaf, X,
} from "lucide-react";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";

/* ─── Types ─── */
interface ResearchTree {
  id: string;
  species_scientific: string;
  species_common: string | null;
  tree_name: string | null;
  description: string | null;
  locality_text: string;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  geo_precision: string;
  height_m: number | null;
  girth_or_stem: string | null;
  crown_spread: string | null;
  size_index: number | null;
  source_doc_title: string;
  source_doc_url: string;
  source_doc_year: number;
  designation_type: string;
  status: string;
}

/* ─── Helpers ─── */
const parseNumeric = (s: string | null): number | null => {
  if (!s) return null;
  const m = s.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : null;
};

const computeChampionPoints = (tree: ResearchTree): number | null => {
  const heightFt = tree.height_m ? tree.height_m * 3.28084 : null;
  const girthIn = parseNumeric(tree.girth_or_stem);
  const crownFt = parseNumeric(tree.crown_spread);
  // circumference_in + height_ft + 0.25 * crown_spread_ft
  // We store girth in metres, convert
  const circumIn = girthIn ? girthIn * 39.3701 : null;
  if (circumIn == null && heightFt == null) return null;
  return Math.round((circumIn || 0) + (heightFt || 0) + 0.25 * (crownFt ? crownFt * 3.28084 : 0));
};

/* ─── Stat Tile ─── */
const StatTile = ({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ElementType }) => (
  <Card className="border-primary/15 bg-card/60 backdrop-blur-sm">
    <CardContent className="p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-xl font-serif font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

/* ─── Species Row ─── */
const SpeciesRow = ({ species, common, count, maxCount }: {
  species: string; common: string | null; count: number; maxCount: number;
}) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-serif text-foreground truncate">{common || species}</p>
      {common && <p className="text-xs text-muted-foreground italic truncate">{species}</p>}
    </div>
    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden shrink-0">
      <div className="h-full bg-primary/70 rounded-full transition-all duration-500" style={{ width: `${(count / maxCount) * 100}%` }} />
    </div>
    <span className="text-xs font-medium text-muted-foreground w-8 text-right">{count}</span>
  </div>
);

/* ─── State Chip ─── */
const StateChip = ({ name, count, active, onClick }: {
  name: string; count: number; active: boolean; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-card/60 text-muted-foreground border-border/40 hover:border-primary/40"
    }`}
  >
    {name} <span className="opacity-70">({count})</span>
  </button>
);

/* ─── Champion Card (mobile-friendly) ─── */
const ChampionCard = ({ tree, points, onMap }: { tree: ResearchTree; points: number | null; onMap: () => void }) => (
  <Card className="border-primary/10 hover:border-primary/30 transition-all group">
    <CardContent className="p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-serif text-foreground truncate">
            {tree.tree_name || tree.species_common || tree.species_scientific}
          </p>
          <p className="text-xs text-muted-foreground italic truncate">{tree.species_scientific}</p>
        </div>
        {points != null && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[hsl(42_95%_55%/0.4)] text-[hsl(42_95%_55%)]">
            {points} pts
          </Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <MapPin className="w-3 h-3 shrink-0" />
        <span className="truncate">{tree.province || tree.locality_text}</span>
      </p>

      <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
        {tree.height_m && <span>H: {tree.height_m}m ({Math.round(tree.height_m * 3.28084)}ft)</span>}
        {tree.girth_or_stem && <span>G: {tree.girth_or_stem}</span>}
        {tree.crown_spread && <span>C: {tree.crown_spread}</span>}
      </div>

      <div className="flex items-center justify-between pt-1">
        <a
          href={tree.source_doc_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
        >
          <Scroll className="w-3 h-3" /> Source {tree.source_doc_year} <ExternalLink className="w-2.5 h-2.5" />
        </a>
        <div className="flex gap-1.5">
          {tree.latitude && (
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={onMap}>
              <MapIcon className="w-3 h-3 mr-1" /> Map
            </Button>
          )}
          <Button variant="sacred" size="sm" className="h-7 text-xs px-2" asChild>
            <Link to={`/map?lat=${tree.latitude}&lng=${tree.longitude}&zoom=15&research=on`}>
              <Eye className="w-3 h-3 mr-1" /> Verify
            </Link>
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

/* ═══════════════════════════════════════════════
   MAIN: USA Country Page
   ═══════════════════════════════════════════════ */
const USACountryPage = () => {
  const navigate = useNavigate();
  const [trees, setTrees] = useState<ResearchTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("champions");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"points" | "height" | "name">("points");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("research_trees")
        .select("*")
        .eq("country", "United States")
        .order("species_scientific");
      if (data) setTrees(data as ResearchTree[]);
      setLoading(false);
    };
    fetch();
  }, []);

  /* ─── Computed ─── */
  const treesWithPoints = useMemo(() =>
    trees.map(t => ({ tree: t, points: computeChampionPoints(t) })),
  [trees]);

  const q = searchQuery.trim().toLowerCase();

  const filteredSorted = useMemo(() => {
    let list = treesWithPoints;
    if (selectedState) list = list.filter(({ tree }) => tree.province === selectedState);
    if (q) list = list.filter(({ tree }) =>
      (tree.species_common || "").toLowerCase().includes(q) ||
      tree.species_scientific.toLowerCase().includes(q) ||
      (tree.tree_name || "").toLowerCase().includes(q)
    );
    switch (sortField) {
      case "points": return list.sort((a, b) => (b.points || 0) - (a.points || 0));
      case "height": return list.sort((a, b) => (b.tree.height_m || 0) - (a.tree.height_m || 0));
      case "name": return list.sort((a, b) => (a.tree.species_common || a.tree.species_scientific).localeCompare(b.tree.species_common || b.tree.species_scientific));
      default: return list;
    }
  }, [treesWithPoints, selectedState, q, sortField]);

  const totalCount = trees.length;
  const speciesCount = new Set(trees.map(t => t.species_scientific)).size;
  const withCoords = trees.filter(t => t.latitude != null).length;
  const verifiedCount = trees.filter(t => t.status === "verified_linked").length;

  const stateCounts = useMemo(() => {
    const map = new Map<string, number>();
    trees.forEach(t => {
      const p = t.province || "Unknown";
      map.set(p, (map.get(p) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [trees]);

  const speciesRanking = useMemo(() => {
    const filtered = selectedState ? trees.filter(t => t.province === selectedState) : trees;
    const map = new Map<string, { scientific: string; common: string | null; count: number }>();
    filtered.forEach(t => {
      const key = t.species_scientific;
      const existing = map.get(key);
      if (existing) existing.count++;
      else map.set(key, { scientific: key, common: t.species_common, count: 1 });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [trees, selectedState]);

  const handleMapNavigate = (tree: ResearchTree) => {
    if (tree.latitude && tree.longitude) navigate(`/map?lat=${tree.latitude}&lng=${tree.longitude}&zoom=15&research=on`);
  };

  return (
    <PageShell>
      <div className="min-h-screen pb-24">

        {/* ═══ HERO ═══ */}
        <section className="relative px-4 pt-12 pb-10 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(210_25%_8%)] via-background to-background opacity-80" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative max-w-2xl mx-auto"
          >
            <p className="text-4xl mb-3">🇺🇸</p>
            <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground mb-2">
              USA Champion Trees
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4 leading-relaxed">
              The largest known individuals by species — scored by circumference, height, and crown spread
              using the National Champion Tree formula.
            </p>

            {/* Champion Formula card */}
            <Card className="max-w-sm mx-auto border-[hsl(42_95%_55%/0.3)] bg-card/70 backdrop-blur mb-6">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-[hsl(42_95%_55%)]" />
                  <p className="text-xs font-medium text-[hsl(42_95%_55%)]">Champion Score Formula</p>
                </div>
                <p className="text-sm font-serif text-foreground leading-relaxed">
                  Circumference <span className="text-muted-foreground text-xs">(in)</span>
                  {" + "}Height <span className="text-muted-foreground text-xs">(ft)</span>
                  {" + "}¼ Crown Spread <span className="text-muted-foreground text-xs">(ft)</span>
                </p>
                <p className="text-lg font-serif font-bold text-primary mt-1">= Champion Points</p>
              </CardContent>
            </Card>

            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <Badge variant="outline" className="text-xs border-primary/30">
                <Scroll className="w-3 h-3 mr-1" /> Research Layer
              </Badge>
              <Badge variant="outline" className="text-xs border-primary/30">
                <BookOpen className="w-3 h-3 mr-1" /> American Forests register
              </Badge>
              <Badge variant="outline" className="text-xs border-primary/30">
                <Shield className="w-3 h-3 mr-1" /> Provenance preserved
              </Badge>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="mystical" onClick={() => navigate("/map?research=on&country=us")}>
                <MapIcon className="w-4 h-4 mr-1" /> View on Map
              </Button>
              <Button variant="sacred" onClick={() => { setActiveTab("champions"); document.getElementById("usa-data")?.scrollIntoView({ behavior: "smooth" }); }}>
                <Award className="w-4 h-4 mr-1" /> Browse Champions
              </Button>
            </div>
          </motion.div>
        </section>

        {/* ═══ Stats ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatTile label="Champion Records" value={totalCount} icon={Award} />
            <StatTile label="Distinct Species" value={speciesCount} icon={BarChart3} />
            <StatTile label="With Coordinates" value={withCoords} icon={MapPin} />
            <StatTile label="States Represented" value={stateCounts.length} icon={Compass} />
            <StatTile label="Verified" value={verifiedCount} icon={Heart} />
            <StatTile label="Designation Types" value={new Set(trees.map(t => t.designation_type)).size} icon={TreeDeciduous} />
          </div>
        </section>

        {/* ═══ State filter chips ═══ */}
        {stateCounts.length > 0 && (
          <section className="px-4 max-w-3xl mx-auto mb-6">
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                <StateChip name="All States" count={totalCount} active={!selectedState} onClick={() => setSelectedState(null)} />
                {stateCounts.map(([state, cnt]) => (
                  <StateChip key={state} name={state} count={cnt} active={selectedState === state} onClick={() => setSelectedState(selectedState === state ? null : state)} />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>
        )}

        {/* ═══ Data Tabs ═══ */}
        <section id="usa-data" className="px-4 max-w-3xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-card/50 border border-primary/20 mb-4">
              <TabsTrigger value="champions">Champions</TabsTrigger>
              <TabsTrigger value="species">Species Index</TabsTrigger>
              <TabsTrigger value="map">Map View</TabsTrigger>
            </TabsList>

            {/* ─── Champions Table ─── */}
            <TabsContent value="champions">
              {/* Search + Sort bar */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search species or tree name…"
                    className="pl-9 pr-8 bg-card/70 border-primary/15 font-serif text-sm"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1 text-xs"
                  onClick={() => setSortField(prev => prev === "points" ? "height" : prev === "height" ? "name" : "points")}
                >
                  <ArrowUpDown className="w-3 h-3" />
                  {sortField === "points" ? "Points" : sortField === "height" ? "Height" : "Name"}
                </Button>
              </div>

              {loading ? (
                <p className="text-center py-12 text-muted-foreground">Loading champion records…</p>
              ) : filteredSorted.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">No champions found for this filter.</p>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <div className="rounded-lg border border-primary/10 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-card/80 border-b border-primary/10">
                            <th className="text-left p-3 font-serif text-muted-foreground text-xs">Species</th>
                            <th className="text-left p-3 font-serif text-muted-foreground text-xs">State</th>
                            <th className="text-right p-3 font-serif text-muted-foreground text-xs">Points</th>
                            <th className="text-right p-3 font-serif text-muted-foreground text-xs">Height</th>
                            <th className="text-right p-3 font-serif text-muted-foreground text-xs">Girth</th>
                            <th className="p-3 text-xs"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSorted.slice(0, 50).map(({ tree, points }) => (
                            <tr key={tree.id} className="border-b border-border/20 hover:bg-primary/5 transition-colors">
                              <td className="p-3">
                                <p className="font-serif text-foreground truncate max-w-[200px]">{tree.species_common || tree.species_scientific}</p>
                                <p className="text-xs text-muted-foreground italic truncate max-w-[200px]">{tree.species_scientific}</p>
                              </td>
                              <td className="p-3 text-muted-foreground text-xs">{tree.province || "—"}</td>
                              <td className="p-3 text-right font-medium text-[hsl(42_95%_55%)]">{points ?? "—"}</td>
                              <td className="p-3 text-right text-muted-foreground">{tree.height_m ? `${tree.height_m}m` : "—"}</td>
                              <td className="p-3 text-right text-muted-foreground">{tree.girth_or_stem || "—"}</td>
                              <td className="p-3">
                                {tree.latitude && (
                                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => handleMapNavigate(tree)}>
                                    <MapIcon className="w-3 h-3" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filteredSorted.length > 50 && (
                      <p className="text-xs text-muted-foreground text-center mt-3">Showing 50 of {filteredSorted.length} records</p>
                    )}
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden grid grid-cols-1 gap-3">
                    {filteredSorted.slice(0, 30).map(({ tree, points }) => (
                      <ChampionCard key={tree.id} tree={tree} points={points} onMap={() => handleMapNavigate(tree)} />
                    ))}
                    {filteredSorted.length > 30 && (
                      <p className="text-xs text-muted-foreground text-center mt-2">Showing 30 of {filteredSorted.length}</p>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            {/* ─── Species Index ─── */}
            <TabsContent value="species">
              <Card className="border-primary/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-serif flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-primary" /> Species Discovery Index
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {speciesRanking.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground text-sm">No species data yet.</p>
                  ) : (
                    speciesRanking.map(s => (
                      <SpeciesRow key={s.scientific} species={s.scientific} common={s.common} count={s.count} maxCount={speciesRanking[0].count} />
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Map View ─── */}
            <TabsContent value="map">
              <Card className="border-primary/10">
                <CardContent className="p-6 text-center space-y-4">
                  <MapPin className="w-10 h-10 text-primary mx-auto" />
                  <h3 className="text-lg font-serif text-foreground">USA Champion Trees on Map</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    View all {withCoords} mapped champion trees with clustering, research pins, and the "Verify in Person" flow.
                  </p>
                  <Button variant="mystical" onClick={() => navigate("/map?research=on&country=us&lat=39.8&lng=-98.5&zoom=4")}>
                    <MapIcon className="w-4 h-4 mr-1.5" /> Open Full Map
                  </Button>
                </CardContent>
              </Card>

              {/* Phase 2 integrations preview */}
              <div className="mt-6 space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Coming in Phase 2</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Mint NFTree", desc: "Create a digital twin of a verified champion", icon: Award },
                    { label: "Offer Seed / Visit", desc: "Plant a seed and earn hearts through presence", icon: Heart },
                    { label: "Hearts Cycle (0→144)", desc: "Watch the tree economy grow with each visit", icon: Footprints },
                  ].map(item => (
                    <Card key={item.label} className="border-border/30 opacity-60">
                      <CardContent className="p-3 flex items-center gap-2">
                        <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs font-serif text-muted-foreground">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground/60">{item.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* ═══ Provenance ═══ */}
        <section className="px-4 max-w-3xl mx-auto mt-10 mb-8">
          <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-serif flex items-center gap-2">
                <Scroll className="w-4 h-4 text-primary" /> Lineage & Provenance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Champion tree data is sourced from the American Forests National Register and state forestry programmes.
                Locations may be approximate until verified by a wanderer in person. Source data is immutable — your
                notes and verifications live separately.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Champion scoring</strong> uses the official formula:
                trunk circumference (inches) + total height (feet) + one quarter of average crown spread (feet).
                The tree with the highest total points for its species earns the National Champion designation.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </PageShell>
  );
};

export default USACountryPage;
