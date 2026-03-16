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
  ArrowRight, Layers, Leaf, Flower2,
} from "lucide-react";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import Header from "@/components/Header";
import AtlasBreadcrumb from "@/components/AtlasBreadcrumb";
import PlaceMapPreview from "@/components/atlas/PlaceMapPreview";
import { useDocumentTitle } from "@/hooks/use-document-title";

/* ── Types ── */
interface SGTree {
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
  source_row_ref: string | null;
}

/* ── Circles ── */
const CIRCLES = [
  { key: "botanic", label: "Botanic Garden Elders", icon: "🌿", filter: (t: SGTree) => t.source_row_ref?.startsWith("SG-BG") },
  { key: "temple", label: "Temple Guardians", icon: "🛕", filter: (t: SGTree) => t.source_row_ref?.startsWith("SG-TG") },
  { key: "rainforest", label: "Rainforest Giants", icon: "🌲", filter: (t: SGTree) => t.source_row_ref?.startsWith("SG-RG") },
  { key: "city", label: "City Canopy Trees", icon: "🏙️", filter: (t: SGTree) => t.source_row_ref?.startsWith("SG-CC") },
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

const SingaporeAtlasPage = () => {
  useDocumentTitle("Singapore — City in a Garden Heritage Trees");
  const { focusMap } = useMapFocus();
  const [trees, setTrees] = useState<SGTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("research_trees")
        .select("id,tree_name,species_common,species_scientific,province,locality_text,latitude,longitude,designation_type,description,height_m,source_program,source_row_ref")
        .eq("country", "Singapore")
        .not("latitude", "is", null)
        .order("tree_name");
      setTrees((data as SGTree[]) || []);
      setLoading(false);
    })();
  }, []);

  const speciesCount = useMemo(() => new Set(trees.map(t => t.species_scientific)).size, [trees]);
  const districtCount = useMemo(() => new Set(trees.map(t => t.province).filter(Boolean)).size, [trees]);

  const bbox = { south: 1.15, west: 103.6, north: 1.47, east: 104.1 };

  return (
    <PageShell>
      <Header />
      <div className="min-h-screen bg-background pt-20 pb-24 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Breadcrumb */}
          <AtlasBreadcrumb segments={[
            { label: "Atlas", to: "/atlas" },
            { label: "Singapore" },
          ]} />

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-card via-card/80 to-primary/5 p-8 md:p-12"
          >
            <div className="absolute top-4 right-4">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                🇸🇬 Heritage Trees
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
              Singapore — City in a Garden
            </h1>
            <p className="text-muted-foreground max-w-2xl leading-relaxed">
              Heritage tembusu, rainforest dipterocarps & temple guardians — a living map of Singapore's
              extraordinary urban forest canopy. Where tropical giants meet one of the world's most
              carefully managed city ecosystems.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Button
                size="sm"
                onClick={() => focusMap({
                  type: "area",
                  id: "singapore",
                  center: { lat: 1.3521, lng: 103.8198 },
                  bbox: [1.15, 103.6, 1.47, 104.1],
                  source: "country",
                  countrySlug: "singapore",
                  researchLayer: "on",
                })}
              >
                <MapPin className="w-4 h-4 mr-1" /> Open on Map
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href="https://www.nparks.gov.sg/gardens-parks-and-nature/heritage-trees" target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-1" /> NParks Heritage Trees
                </a>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile label="Heritage Trees" value={trees.length} icon={TreeDeciduous} />
            <StatTile label="Species" value={speciesCount} icon={Flower2} />
            <StatTile label="Planning Areas" value={districtCount} icon={Compass} />
            <StatTile label="Nature Reserves" value={4} icon={Leaf} />
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
              <Card className="border-primary/15 bg-card/70">
                <CardHeader>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-primary" /> City in a Garden
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    Singapore — the Garden City — transformed itself from a colonial port into one of the
                    world's greenest metropolises. Over 50% of the island is covered by vegetation, and
                    NParks manages over 7 million trees across parks, nature reserves, and streetscapes.
                  </p>
                  <p>
                    The Heritage Tree Scheme protects Singapore's most significant mature trees — botanical
                    specimens, cultural landmarks, and ecological anchors that connect the modern city to
                    its primeval rainforest origins.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/15 bg-card/70">
                <CardHeader>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    🌲 Tropical Heritage Trees
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    Singapore's Heritage Trees include some of the last wild dipterocarps in the region —
                    towering Seraya, Mengaris, and Chengal that predate the founding of modern Singapore.
                    The Bukit Timah Nature Reserve alone contains more tree species per hectare than
                    all of North America.
                  </p>
                  <p>
                    Beyond the reserves, Rain Trees (<i>Samanea saman</i>) form green tunnels along
                    major roads, while Tembusu (<i>Cyrtophyllum fragrans</i>) — featured on the $5 note —
                    anchor the Botanic Gardens' UNESCO World Heritage landscape.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/15 bg-card/70">
                <CardHeader>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    🌿 Urban Rainforest Canopy
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    Singapore's urban canopy is deliberately engineered: ecological corridors connect
                    the central nature reserves, park connectors thread through housing estates, and
                    roadside planting programmes ensure every resident lives within 400m of a park.
                  </p>
                  <p>
                    The Heritage Trees within this matrix serve as ecological anchor points — seed
                    sources, wildlife habitats, and cultural landmarks that maintain biodiversity
                    in one of the world's most intensively developed islands.
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
                        <span className="text-lg">🌳</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{t.tree_name || t.species_common}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {t.species_common} · {t.province} · {t.designation_type}
                          </p>
                        </div>
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
                      placeCode="singapore"
                      countrySlug="singapore"
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
                    <Sparkles className="w-5 h-5 text-primary" /> The Tembusu & the Five-Dollar Note
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    The Tembusu (<i>Cyrtophyllum fragrans</i>) on Singapore's five-dollar note stands in the
                    Singapore Botanic Gardens near the main gate. Over 150 years old, its wide-spreading
                    canopy and fragrant nocturnal flowers make it one of the island's most beloved trees.
                  </p>
                  <p>
                    The tree's image was chosen for its representation of strength, stability, and
                    resilience — qualities that mirror the nation's own journey from fishing village
                    to global city.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/15 bg-card/70">
                <CardHeader>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    🌿 Tropical Guardians
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    Singapore sits at the crossroads of the Sundaland biodiversity hotspot — one of the
                    richest concentrations of species on Earth. Despite occupying just 733 km², the island
                    hosts over 2,100 native plant species. Heritage Trees serve as living libraries of
                    this botanical wealth.
                  </p>
                  <p>
                    Each Heritage Tree is a keystone: fruiting figs feed hornbills and flying foxes,
                    dipterocarp canopies shelter epiphytes and mosses, and temple trees anchor cultural
                    landscapes spanning Chinese, Malay, Indian, and Peranakan heritage.
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
                    Records are drawn from the Singapore Heritage Tree Register maintained by the
                    National Parks Board (NParks). Trees are nominated by the public and assessed by
                    a panel of experts before formal gazettal.
                  </p>
                  <p>
                    All trees enter the S33D system as research-layer records with <code>heritage_status = official_register</code>.
                    They become verified Ancient Friends through community visits, photo confirmations, and stewardship.
                  </p>
                  <div className="flex gap-2 flex-wrap mt-2">
                    <Badge variant="outline" className="text-xs">Source: NParks Heritage Trees</Badge>
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

export default SingaporeAtlasPage;
