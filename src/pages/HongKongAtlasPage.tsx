import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useMapFocus } from "@/hooks/use-map-focus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin, TreeDeciduous, Heart, Eye, Compass, Sparkles, Globe,
  ArrowRight, Layers, Mountain, Anchor, Flower2,
} from "lucide-react";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import Header from "@/components/Header";
import AtlasBreadcrumb from "@/components/AtlasBreadcrumb";
import PlaceMapPreview from "@/components/atlas/PlaceMapPreview";
import { goToTreeOnMap } from "@/utils/mapNavigation";
import { useDocumentTitle } from "@/hooks/use-document-title";

/* ── Types ── */
interface HKTree {
  id: string;
  tree_name: string | null;
  species_common: string | null;
  species_scientific: string;
  province: string | null;
  locality_text: string;
  latitude: number | null;
  longitude: number | null;
  designation_type: string;
  description: string | null;
  height_m: number | null;
  source_program: string;
}

/* ── Circles ── */
const CIRCLES = [
  { key: "stone-wall", label: "Stone Wall Circle", icon: "🧱", filter: (t: HKTree) => t.source_program === "hk-stone-wall-trees" },
  { key: "harbour", label: "Harbour Heritage", icon: "⚓", filter: (t: HKTree) => (t as any).source_row_ref?.startsWith?.("OVT-HH") || t.province === "Yau Tsim Mong" || t.province === "Eastern" || t.province === "Southern" },
  { key: "garden", label: "Garden Elders", icon: "🌺", filter: (t: HKTree) => (t as any).source_row_ref?.startsWith?.("OVT-GE") },
  { key: "threshold", label: "Threshold Trees", icon: "🚪", filter: (t: HKTree) => (t as any).source_row_ref?.startsWith?.("OVT-TT") },
];

/* ── Stat Tile ── */
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

const HongKongAtlasPage = () => {
  useDocumentTitle("Hong Kong — Living Walls & Heritage Trees");
  const { focusMap } = useMapFocus();
  const [trees, setTrees] = useState<HKTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("research_trees")
        .select("id,tree_name,species_common,species_scientific,province,locality_text,latitude,longitude,designation_type,description,height_m,source_program")
        .eq("country", "Hong Kong")
        .not("latitude", "is", null)
        .order("tree_name");
      setTrees((data as HKTree[]) || []);
      setLoading(false);
    })();
  }, []);

  const stoneWallCount = useMemo(() => trees.filter(t => t.source_program === "hk-stone-wall-trees").length, [trees]);
  const speciesCount = useMemo(() => new Set(trees.map(t => t.species_scientific)).size, [trees]);
  const districtCount = useMemo(() => new Set(trees.map(t => t.province).filter(Boolean)).size, [trees]);

  const bbox = { south: 22.15, west: 113.83, north: 22.56, east: 114.43 };

  return (
    <PageShell>
      <Header />
      <div className="min-h-screen bg-background pt-20 pb-24 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Breadcrumb */}
          <AtlasBreadcrumb segments={[
            { label: "Atlas", to: "/atlas" },
            { label: "Hong Kong" },
          ]} />

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-card via-card/80 to-primary/5 p-8 md:p-12"
          >
            <div className="absolute top-4 right-4">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                🇭🇰 Heritage Trees
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
              Hong Kong — Living Walls & Heritage Trees
            </h1>
            <p className="text-muted-foreground max-w-2xl leading-relaxed">
              Stone wall survivors, harbour sentinels & garden elders — a living map of Hong Kong's arboreal heritage.
              Where ancient roots grip Victorian masonry and tropical canopies shade the world's densest cityscape.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Button
                size="sm"
                onClick={() => focusMap({
                  type: "area",
                  id: "hong-kong",
                  center: { lat: 22.3193, lng: 114.1694 },
                  bbox: [22.15, 113.83, 22.56, 114.43],
                  source: "country",
                  countrySlug: "hong-kong",
                  researchLayer: "on",
                })}
              >
                <MapPin className="w-4 h-4 mr-1" /> Open on Map
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href="https://www.greening.gov.hk/en/greening-activities/register-ovt.html" target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-1" /> OVT Register
                </a>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile label="Heritage Trees" value={trees.length} icon={TreeDeciduous} />
            <StatTile label="Stone Wall Trees" value={stoneWallCount} icon={Mountain} />
            <StatTile label="Species" value={speciesCount} icon={Flower2} />
            <StatTile label="Districts" value={districtCount} icon={Compass} />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-card/80 border border-border/40">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="circles">Circles</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
              <TabsTrigger value="stories">Stories</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Narrative sections */}
              <Card className="border-primary/15 bg-card/70">
                <CardHeader>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <Mountain className="w-5 h-5 text-primary" /> Urban Forests of Hong Kong
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    Despite being one of the world's most densely populated territories, over 70% of Hong Kong's land
                    area is countryside — steep hillsides clothed in subtropical forest, ancient fung shui woods
                    protecting villages, and pockets of mangrove along the coast.
                  </p>
                  <p>
                    The city's heritage trees are living witnesses to this tension between density and wilderness.
                    Many stand at thresholds — where colonial stone walls meet tropical growth, where harbour
                    promenades border the wild South China Sea.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/15 bg-card/70">
                <CardHeader>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    🧱 Living Walls & Stone Roots
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    Hong Kong's stone wall trees are a globally unique phenomenon — Chinese Banyans (<i>Ficus microcarpa</i>)
                    whose aerial roots have colonised Victorian-era granite retaining walls, creating living bridges
                    between geological and biological time.
                  </p>
                  <p>
                    These trees are structural hybrids — part architecture, part organism. Their roots grip masonry
                    joints, penetrate drainage channels, and eventually become load-bearing elements of the wall itself.
                    They represent a natural archetype found nowhere else on Earth at this scale.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/15 bg-card/70">
                <CardHeader>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <Anchor className="w-5 h-5 text-primary" /> Harbour Canopy Heritage
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    Victoria Harbour — the fragrant harbour that gave Hong Kong its name — is fringed by heritage trees
                    that have watched the skyline transform from colonial waterfront to glass-and-steel metropolis.
                  </p>
                  <p>
                    Flame Trees blaze scarlet against the harbour each June. Rain Trees spread their feathery canopies
                    across promenades. And the ever-present banyans guard the thresholds between land and sea.
                  </p>
                </CardContent>
              </Card>

              {/* Tree list */}
              <Card className="border-primary/15 bg-card/70">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Ancient Friends ({trees.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loading ? (
                    <p className="text-sm text-muted-foreground animate-pulse">Loading heritage trees…</p>
                  ) : trees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No trees seeded yet. Run the seed script to populate.</p>
                  ) : (
                    trees.map((t) => (
                      <Link
                        key={t.id}
                        to={`/tree/research/${t.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/15"
                      >
                        <span className="text-lg">
                          {t.source_program === "hk-stone-wall-trees" ? "🧱" : "🌳"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{t.tree_name || t.species_common}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {t.species_common} · {t.province} · {t.designation_type}
                          </p>
                        </div>
                        {t.designation_type === "Stone Wall Tree" && (
                          <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 shrink-0">
                            Stone Wall
                          </Badge>
                        )}
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Circles */}
            <TabsContent value="circles" className="space-y-6 mt-6">
              {CIRCLES.map((circle) => {
                const circleTrees = trees.filter(circle.filter);
                return (
                  <Card key={circle.key} className="border-primary/15 bg-card/70">
                    <CardHeader>
                      <CardTitle className="font-serif text-lg flex items-center gap-2">
                        <span>{circle.icon}</span> {circle.label}
                        <Badge variant="outline" className="ml-auto text-xs">{circleTrees.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {circleTrees.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No trees in this circle yet.</p>
                      ) : (
                        circleTrees.map((t) => (
                          <Link
                            key={t.id}
                            to={`/tree/research/${t.id}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors"
                          >
                            <TreeDeciduous className="w-4 h-4 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{t.tree_name}</p>
                              <p className="text-xs text-muted-foreground">{t.species_common} · {t.province}</p>
                            </div>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          </Link>
                        ))
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            {/* Map */}
            <TabsContent value="map" className="mt-6">
              <Card className="border-primary/15 bg-card/70 overflow-hidden">
                <CardContent className="p-0">
                  <div className="h-[400px] md:h-[500px]">
                    <PlaceMapPreview
                      bbox={bbox}
                      placeType="city"
                      placeCode="hong-kong"
                      countrySlug="hong-kong"
                      defaultFilters={{ researchLayer: "on" }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stories */}
            <TabsContent value="stories" className="space-y-6 mt-6">
              <Card className="border-primary/15 bg-card/70">
                <CardHeader>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" /> The Incense Tree
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    Hong Kong — 香港 — means "Fragrant Harbour." The name comes from <i>Aquilaria sinensis</i>,
                    the Incense Tree, whose aromatic resin was once Hong Kong's most valuable export,
                    shipped from Aberdeen harbour to incense markets across Asia.
                  </p>
                  <p>
                    Today, wild Incense Trees are critically endangered due to illegal harvesting of their
                    precious agarwood. The few survivors in Sha Lo Tung and other New Territories valleys
                    are among Hong Kong's most significant botanical treasures.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/15 bg-card/70">
                <CardHeader>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" /> Dataset Provenance
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    Records are drawn from the Hong Kong Old and Valuable Trees Register (GLTMS) and
                    the Stone Wall Trees dataset maintained by the Leisure and Cultural Services Department.
                  </p>
                  <p>
                    All trees enter the S33D system as research-layer records with <code>heritage_status = official_register</code>.
                    They become verified Ancient Friends through community visits, photo confirmations, and stewardship.
                  </p>
                  <div className="flex gap-2 flex-wrap mt-2">
                    <Badge variant="outline" className="text-xs">Source: GLTMS / LCSD</Badge>
                    <Badge variant="outline" className="text-xs">Verification: official_register</Badge>
                    <Badge variant="outline" className="text-xs">Initial seed: {trees.length} trees</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageShell>
  );
};

export default HongKongAtlasPage;
