import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  MapPin, ExternalLink, TreeDeciduous, Eye, Compass, Heart, Mountain,
  BookOpen, ChevronRight, Map as MapIcon, Footprints, Shield, Sparkles,
  ArrowLeft, Snowflake, Leaf, Sun,
} from "lucide-react";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

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
  designation_type: string;
  status: string;
  verification_score: number;
  source_doc_title: string;
  source_doc_url: string;
  source_doc_year: number;
}

/* ─── Hive mapping ─── */
const getHive = (species: string): { name: string; color: string } => {
  const s = species.toLowerCase();
  if (s.includes("larix")) return { name: "Larch Hive", color: "hsl(42 85% 55%)" };
  if (s.includes("pinus cembra")) return { name: "Pine Hive", color: "hsl(150 40% 35%)" };
  if (s.includes("quercus")) return { name: "Oak Hive", color: "hsl(30 60% 40%)" };
  return { name: "Mixed Hive", color: "hsl(270 25% 55%)" };
};

/* ─── Elevation band helpers ─── */
type ElevationBand = "all" | "valley" | "mid" | "subalpine" | "high";
const ELEVATION_BANDS: { key: ElevationBand; label: string; icon: React.ElementType; range: string }[] = [
  { key: "all", label: "All Zones", icon: Mountain, range: "All" },
  { key: "valley", label: "Valley", icon: Sun, range: "≤ 800m" },
  { key: "mid", label: "Mid-Mountain", icon: Leaf, range: "800–1,500m" },
  { key: "subalpine", label: "Subalpine", icon: TreeDeciduous, range: "1,500–2,200m" },
  { key: "high", label: "High Alpine", icon: Snowflake, range: "2,200m+" },
];

const guessElevationBand = (tree: ResearchTree): ElevationBand => {
  const desc = (tree.description || "").toLowerCase();
  const loc = tree.locality_text.toLowerCase();
  // Try to parse elevation from description
  const m = desc.match(/(\d[,.]?\d{3})\s*m/);
  if (m) {
    const elev = parseInt(m[1].replace(/[,.]/, ""), 10);
    if (elev >= 2200) return "high";
    if (elev >= 1500) return "subalpine";
    if (elev >= 800) return "mid";
    return "valley";
  }
  // Heuristic from keywords
  if (/high.?alp|2[,.]?[0-9]00/i.test(desc)) return "high";
  if (/subalpine|1[,.]?[5-9]00|aletsch|lötschental|zermatt|saas|simplon|val ferret|engadin|davos|pontresina|arosa|nationalpark/i.test(loc + desc)) return "subalpine";
  if (/sion|brig|leuk|martigny|anniviers|grächen|riederalp/i.test(loc)) return "mid";
  if (/fully|troistorrents|monthey|lower valais/i.test(loc + desc)) return "valley";
  return "mid"; // Default for Valais
};

/* ─── Stat Tile ─── */
const StatTile = ({ label, value, icon: Icon, accent }: { label: string; value: number | string; icon: React.ElementType; accent?: string }) => (
  <Card className="border-primary/15 bg-card/60 backdrop-blur-sm">
    <CardContent className="p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg" style={{ background: accent ? `${accent}20` : undefined }}>
        <Icon className="w-4 h-4" style={{ color: accent || "hsl(var(--primary))" }} />
      </div>
      <div>
        <p className="text-xl font-serif font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

/* ─── Featured Tree Card ─── */
const FeaturedTreeCard = ({ tree, onNavigate }: { tree: ResearchTree; onNavigate: (t: ResearchTree) => void }) => (
  <Card className="border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-card/80 backdrop-blur-sm">
    <CardContent className="p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <Badge className="mb-2 bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
            <Sparkles className="w-3 h-3 mr-1" /> Featured Elder
          </Badge>
          <h3 className="text-lg font-serif font-bold text-foreground">{tree.tree_name}</h3>
          <p className="text-sm text-muted-foreground italic">{tree.species_common} · {tree.species_scientific}</p>
        </div>
        <span className="text-3xl">🏔️</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{tree.description}</p>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {tree.locality_text}</span>
        <Badge variant="outline" className="text-[10px]">~800 years</Badge>
        <Badge variant="outline" className="text-[10px]">~1,600m</Badge>
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        <Button variant="mystical" size="sm" asChild>
          <Link to="/atlas/switzerland/valais/king-of-bavleux">
            <Eye className="w-3.5 h-3.5 mr-1" /> Full Profile
          </Link>
        </Button>
        <Button variant="sacred" size="sm" onClick={() => onNavigate(tree)}>
          <MapIcon className="w-3.5 h-3.5 mr-1" /> View on Map
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/time-tree">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Time Tree
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/whispers">
            <Heart className="w-3.5 h-3.5 mr-1" /> Whisper
          </Link>
        </Button>
      </div>
    </CardContent>
  </Card>
);

/* ─── Tree Card ─── */
const TreeCard = ({ tree, onNavigate }: { tree: ResearchTree; onNavigate: (t: ResearchTree) => void }) => {
  const hive = getHive(tree.species_scientific);
  return (
    <Card className="border-primary/10 hover:border-primary/30 transition-all group">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-serif text-foreground truncate">
              {tree.tree_name || tree.species_common || tree.species_scientific}
            </p>
            <p className="text-xs text-muted-foreground italic truncate">{tree.species_scientific}</p>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0" style={{ borderColor: hive.color, color: hive.color }}>
            {hive.name}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{tree.locality_text}</span>
        </p>
        <div className="flex items-center justify-between pt-1">
          <Badge variant="outline" className="text-[10px]">{tree.designation_type}</Badge>
          <div className="flex gap-1.5">
            {tree.latitude && (
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => onNavigate(tree)}>
                <MapIcon className="w-3 h-3 mr-1" /> Map
              </Button>
            )}
            <Button variant="sacred" size="sm" className="h-7 text-xs px-2" asChild>
              <Link to={`/map?lat=${tree.latitude}&lng=${tree.longitude}&zoom=15`}>
                <Eye className="w-3 h-3 mr-1" /> Verify
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════ */
const ValaisPortalPage = () => {
  const navigate = useNavigate();
  const [trees, setTrees] = useState<ResearchTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("trees");
  const [elevationBand, setElevationBand] = useState<ElevationBand>("all");
  const [speciesFilter, setSpeciesFilter] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("research_trees")
        .select("*")
        .eq("country", "Switzerland")
        .eq("province", "Valais")
        .order("tree_name");
      if (data) setTrees(data as ResearchTree[]);
      setLoading(false);
    };
    fetch();
  }, []);

  /* ─── Computed ─── */
  const filteredTrees = useMemo(() => {
    let pool = trees;
    if (elevationBand !== "all") pool = pool.filter(t => guessElevationBand(t) === elevationBand);
    if (speciesFilter) pool = pool.filter(t => getHive(t.species_scientific).name === speciesFilter);
    return pool;
  }, [trees, elevationBand, speciesFilter]);

  const featuredTree = useMemo(() => trees.find(t => t.tree_name === "King of Bavleux"), [trees]);

  const hiveCounts = useMemo(() => {
    const map: Record<string, { name: string; color: string; count: number }> = {};
    trees.forEach(t => {
      const h = getHive(t.species_scientific);
      if (!map[h.name]) map[h.name] = { ...h, count: 0 };
      map[h.name].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [trees]);

  const speciesCount = new Set(trees.map(t => t.species_scientific)).size;
  const withCoords = trees.filter(t => t.latitude != null).length;

  const handleMapNavigate = (tree: ResearchTree) => {
    if (tree.latitude && tree.longitude) {
      navigate(`/map?lat=${tree.latitude}&lng=${tree.longitude}&zoom=15&country=switzerland&origin=atlas`);
    }
  };

  const openMapLayer = () => navigate("/map?country=switzerland&origin=atlas");

  return (
    <PageShell>
      <Header />
      <div className="min-h-screen pb-24 pt-16">
        {/* ═══ HERO ═══ */}
        <section className="relative px-4 pt-10 pb-8 overflow-hidden">
          {/* Alpine gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-900/20 via-emerald-900/10 to-transparent pointer-events-none" />
          {/* Mountain silhouette */}
          <div className="absolute bottom-0 left-0 right-0 h-16 opacity-[0.07] pointer-events-none"
            style={{
              background: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1200 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 120 L200 40 L350 70 L500 20 L650 55 L800 10 L950 50 L1100 30 L1200 60 L1200 120Z' fill='white'/%3E%3C/svg%3E\") no-repeat center bottom / cover",
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative max-w-2xl mx-auto text-center"
          >
            {/* Breadcrumb */}
            <Link
              to="/atlas/switzerland"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mb-4"
            >
              <ArrowLeft className="w-3 h-3" /> 🇨🇭 Switzerland
            </Link>

            <p className="text-4xl mb-2">🏔️</p>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-1">
              Valais <span className="text-muted-foreground font-normal text-lg">(Wallis)</span>
            </h1>
            <p className="text-sm text-muted-foreground italic mb-4 max-w-md mx-auto">
              Alpine Elders of Stone, Ice & Light
            </p>

            {/* Badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <Badge variant="outline" className="text-xs border-sky-400/30 text-sky-300">
                <Mountain className="w-3 h-3 mr-1" /> 372m – 4,634m
              </Badge>
              <Badge variant="outline" className="text-xs border-amber-400/30 text-amber-300">
                <TreeDeciduous className="w-3 h-3 mr-1" /> Alpine Forest
              </Badge>
              <Badge variant="outline" className="text-xs border-emerald-400/30 text-emerald-300">
                <Shield className="w-3 h-3 mr-1" /> UNESCO Aletsch
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground max-w-lg mx-auto mb-5 leading-relaxed">
              From the chestnut terraces of the Rhône valley to the stone-pine sentinels of the Matterhorn,
              Valais holds the greatest concentration of ancient alpine trees in the Swiss Alps.
              Larch, Swiss Stone Pine, Oak, Beech, and Chestnut weave a vertical tapestry from 372m to the glacier line.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="mystical" onClick={openMapLayer}>
                <MapIcon className="w-4 h-4 mr-1" /> Open Valais Map
              </Button>
              <Button variant="sacred" onClick={() => { setActiveTab("trees"); window.scrollTo({ top: 600, behavior: "smooth" }); }}>
                <TreeDeciduous className="w-4 h-4 mr-1" /> View Ancient Friends
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/hives">
                  <Compass className="w-4 h-4 mr-1" /> Alpine Hives
                </Link>
              </Button>
            </div>
          </motion.div>
        </section>

        {/* ═══ STATS ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile label="Ancient Friends" value={trees.length} icon={TreeDeciduous} accent="hsl(42 85% 55%)" />
            <StatTile label="Species" value={speciesCount} icon={Leaf} accent="hsl(150 40% 35%)" />
            <StatTile label="With Coordinates" value={withCoords} icon={MapPin} accent="hsl(200 60% 50%)" />
            <StatTile label="UNESCO Zone" value="Aletsch" icon={Shield} accent="hsl(270 40% 55%)" />
          </div>
        </section>

        {/* ═══ FEATURED TREE ═══ */}
        {featuredTree && (
          <section className="px-4 max-w-3xl mx-auto mb-8">
            <FeaturedTreeCard tree={featuredTree} onNavigate={handleMapNavigate} />
          </section>
        )}

        {/* ═══ HIVE COUNTERS ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-6">
          <h2 className="text-sm font-serif font-bold text-foreground mb-3 flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" /> Species Hives
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSpeciesFilter(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                !speciesFilter
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card/60 text-muted-foreground border-border/40 hover:border-primary/40"
              }`}
            >
              All ({trees.length})
            </button>
            {hiveCounts.map(h => (
              <button
                key={h.name}
                onClick={() => setSpeciesFilter(speciesFilter === h.name ? null : h.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  speciesFilter === h.name
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card/60 text-muted-foreground border-border/40 hover:border-primary/40"
                }`}
                style={speciesFilter !== h.name ? { borderColor: `${h.color}40` } : {}}
              >
                <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: h.color }} />
                {h.name} ({h.count})
              </button>
            ))}
          </div>
        </section>

        {/* ═══ ELEVATION BANDS ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-6">
          <h2 className="text-sm font-serif font-bold text-foreground mb-3 flex items-center gap-2">
            <Mountain className="w-4 h-4 text-primary" /> Elevation Bands
          </h2>
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {ELEVATION_BANDS.map(b => {
                const Icon = b.icon;
                return (
                  <button
                    key={b.key}
                    onClick={() => setElevationBand(elevationBand === b.key ? "all" : b.key)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      elevationBand === b.key
                        ? "bg-primary/15 border-primary/40 text-foreground"
                        : "bg-card/60 border-border/30 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{b.label}</span>
                    <span className="opacity-60">{b.range}</span>
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>

        {/* ═══ TABS ═══ */}
        <section className="px-4 max-w-3xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-card/50 border border-primary/20 mb-4">
              <TabsTrigger value="trees">Ancient Friends</TabsTrigger>
              <TabsTrigger value="climate">Alpine Future</TabsTrigger>
            </TabsList>

            {/* Trees tab */}
            <TabsContent value="trees">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Loading Valais elders…</div>
              ) : filteredTrees.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No trees match the current filters.
                  <Button variant="link" size="sm" className="ml-2" onClick={() => { setElevationBand("all"); setSpeciesFilter(null); }}>
                    Reset
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredTrees.map(tree => (
                    <TreeCard key={tree.id} tree={tree} onNavigate={handleMapNavigate} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Alpine Future / Climate placeholder */}
            <TabsContent value="climate">
              <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-sm font-serif font-bold text-foreground flex items-center gap-2">
                    <Snowflake className="w-4 h-4 text-sky-400" /> Alpine Climate & Future Layer
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This section will integrate real-time and historical data to monitor the health of Valais's alpine forests.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { title: "Glacier Retreat Tracking", desc: "Monitoring tree-line advance as glaciers recede across the Rhône headwaters.", icon: "🧊" },
                      { title: "Snowline Change Indicator", desc: "Seasonal snowline elevation shifts and their impact on subalpine species.", icon: "❄️" },
                      { title: "Bloom Calendar", desc: "Phenology tracking for larch needle flush, chestnut bloom, and autumn gold.", icon: "🌸" },
                      { title: "Forest Partnerships", desc: "Future integration with Swiss forestry bodies and UNESCO Aletsch monitoring.", icon: "🤝" },
                    ].map((item, i) => (
                      <Card key={i} className="border-border/30">
                        <CardContent className="p-4">
                          <p className="text-lg mb-1">{item.icon}</p>
                          <p className="text-xs font-serif font-bold text-foreground mb-1">{item.title}</p>
                          <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                          <Badge variant="outline" className="mt-2 text-[10px] border-sky-400/30 text-sky-400">Coming soon</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* ═══ TIME TREE PROMPT ═══ */}
        <section className="px-4 max-w-3xl mx-auto mt-10 mb-8">
          <Card className="border-primary/15 bg-gradient-to-br from-indigo-500/5 to-card/80">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-serif font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Time Tree — Valais Edition
              </h3>
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                "If you could sit beneath a high alpine elder in Valais with any two companions — living or beyond time — what would you share?"
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-[10px]">🌑 New Moon — living beings only</Badge>
                <Badge variant="outline" className="text-[10px]">🌕 Full Moon — beyond time allowed</Badge>
              </div>
              <Button variant="sacred" size="sm" asChild>
                <Link to="/time-tree">
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Enter Time Tree
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* ═══ FOOTER BRIDGE ═══ */}
        <section className="px-4 max-w-3xl mx-auto mt-8">
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/atlas/switzerland">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Switzerland
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/atlas">
                <Compass className="w-3.5 h-3.5 mr-1" /> World Atlas
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/map">
                <MapIcon className="w-3.5 h-3.5 mr-1" /> Global Map
              </Link>
            </Button>
          </div>
        </section>
      </div>
      <BottomNav />
    </PageShell>
  );
};

export default ValaisPortalPage;
