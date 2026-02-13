import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getHiveBySlug, getAllHives, type HiveInfo } from "@/utils/hiveUtils";
import { matchSpecies } from "@/data/treeSpecies";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TreePine, MapPin, Heart, Music, Users, ArrowLeft, ExternalLink, Map } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const HivePage = () => {
  const { family } = useParams<{ family: string }>();
  const navigate = useNavigate();
  const hive = family ? getHiveBySlug(family) : null;

  const [trees, setTrees] = useState<TreeRow[]>([]);
  const [offerings, setOfferings] = useState<OfferingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("trees");

  // Determine which species names belong to this hive
  const hiveSpeciesNames = useMemo(() => {
    if (!hive) return [];
    return hive.representativeSpecies.map(s => s.toLowerCase());
  }, [hive]);

  useEffect(() => {
    if (!hive) { setLoading(false); return; }
    const fetchData = async () => {
      // Fetch all trees, then filter client-side by species family
      const { data: allTrees } = await supabase
        .from("trees")
        .select("id, name, species, what3words, latitude, longitude, estimated_age, created_at, nation")
        .order("created_at", { ascending: false });

      const hiveTrees = (allTrees || []).filter(t => {
        const match = matchSpecies(t.species);
        return match && match.family === hive.family;
      });
      setTrees(hiveTrees);

      if (hiveTrees.length > 0) {
        const treeIds = hiveTrees.map(t => t.id);
        // Fetch offerings for these trees (batched)
        const { data: offs } = await supabase
          .from("offerings")
          .select("id, tree_id, title, type, media_url, created_at, created_by")
          .in("tree_id", treeIds.slice(0, 100))
          .order("created_at", { ascending: false })
          .limit(200);
        setOfferings(offs || []);
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
  const uniqueContributors = new Set(offerings.map(o => o.created_by).filter(Boolean)).size;
  const photoOfferings = offerings.filter(o => o.type === "photo" && o.media_url);

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
          style={{
            background: `linear-gradient(135deg, hsl(${hive.accentHsl} / 0.15), hsl(var(--background)))`,
          }}
        >
          <div className="h-1" style={{ background: `linear-gradient(90deg, transparent, hsl(${hive.accentHsl}), transparent)` }} />
          <div className="p-6 md:p-8">
            <div className="flex items-start gap-4">
              <span className="text-5xl">{hive.icon}</span>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-serif tracking-wide" style={{ color: `hsl(${hive.accentHsl})` }}>
                  {hive.displayName}
                </h1>
                <p className="text-muted-foreground font-serif mt-2 max-w-2xl">
                  {hive.description}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {hive.representativeSpecies.slice(0, 8).map(sp => (
                    <Badge key={sp} variant="outline" className="font-serif text-xs" style={{ borderColor: `hsl(${hive.accentHsl} / 0.4)` }}>
                      {sp}
                    </Badge>
                  ))}
                  {hive.representativeSpecies.length > 8 && (
                    <Badge variant="secondary" className="font-serif text-xs">
                      +{hive.representativeSpecies.length - 8} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Ancient Friends", value: trees.length, icon: <TreePine className="w-4 h-4" /> },
            { label: "Offerings", value: offerings.length, icon: <Music className="w-4 h-4" /> },
            { label: "Hearts Circulating", value: totalHearts, icon: <Heart className="w-4 h-4" /> },
            { label: "Wanderers", value: uniqueContributors, icon: <Users className="w-4 h-4" /> },
          ].map(m => (
            <Card key={m.label} className="bg-card/60 backdrop-blur border-border/50">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1 text-muted-foreground">{m.icon}</div>
                <p className="text-2xl font-serif" style={{ color: `hsl(${hive.accentHsl})` }}>{m.value}</p>
                <p className="text-[11px] text-muted-foreground font-serif">{m.label}</p>
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
                <TreePine className="w-3.5 h-3.5 mr-1.5" /> Ancient Friends ({trees.length})
              </TabsTrigger>
              <TabsTrigger value="offerings" className="font-serif text-xs tracking-wider">
                <Music className="w-3.5 h-3.5 mr-1.5" /> Offerings ({offerings.length})
              </TabsTrigger>
              <TabsTrigger value="lore" className="font-serif text-xs tracking-wider">
                📜 Species Lore
              </TabsTrigger>
              <TabsTrigger value="governance" className="font-serif text-xs tracking-wider">
                🏛️ Hive Council
              </TabsTrigger>
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
                    <motion.div
                      key={tree.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
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

            {/* Offerings Tab */}
            <TabsContent value="offerings">
              {offerings.length === 0 ? (
                <p className="text-center text-muted-foreground font-serif py-12">No offerings yet in this hive.</p>
              ) : (
                <div className="space-y-3">
                  {offerings.slice(0, 50).map((off, i) => {
                    const tree = trees.find(t => t.id === off.tree_id);
                    return (
                      <motion.div
                        key={off.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                      >
                        <Card className="bg-card/60 backdrop-blur border-border/40">
                          <CardContent className="p-3 flex items-center gap-3">
                            {off.media_url && off.type === "photo" && (
                              <img src={off.media_url} alt={off.title} className="w-12 h-12 rounded object-cover" loading="lazy" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-serif text-sm text-foreground truncate">{off.title}</p>
                              {tree && (
                                <Link to={`/tree/${tree.id}`} className="text-[11px] text-primary/70 hover:text-primary font-serif">
                                  at {tree.name}
                                </Link>
                              )}
                            </div>
                            <Badge variant="outline" className="text-[10px] font-serif shrink-0">{off.type}</Badge>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Lore Tab */}
            <TabsContent value="lore">
              <Card className="bg-card/60 backdrop-blur border-border/40">
                <CardContent className="p-6">
                  <h3 className="text-xl font-serif mb-4" style={{ color: `hsl(${hive.accentHsl})` }}>
                    {hive.icon} About the {hive.family} Family
                  </h3>
                  <p className="text-muted-foreground font-serif leading-relaxed mb-4">
                    {hive.description}
                  </p>
                  <div className="border-t border-border/40 pt-4 mt-4">
                    <h4 className="text-sm font-serif text-foreground mb-3 tracking-wider uppercase">Known Species</h4>
                    <div className="flex flex-wrap gap-2">
                      {hive.representativeSpecies.map(sp => (
                        <Badge key={sp} variant="secondary" className="font-serif text-xs">
                          {sp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-border/40 pt-4 mt-4">
                    <p className="text-xs text-muted-foreground/60 font-serif italic">
                      Species lore, ecological data, and conservation stories will grow here as the community contributes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Governance Tab */}
            <TabsContent value="governance">
              <Card className="bg-card/60 backdrop-blur border-border/40">
                <CardContent className="p-6 text-center">
                  <span className="text-4xl mb-4 block">🏛️</span>
                  <h3 className="text-xl font-serif mb-2" style={{ color: `hsl(${hive.accentHsl})` }}>
                    Hive Council
                  </h3>
                  <p className="text-muted-foreground font-serif text-sm max-w-md mx-auto mb-6">
                    The governance layer for this species hive is being prepared. Soon, curators will be able to propose, vote, and shape the future of this living lineage.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                    {["Proposals", "Curators", "Staking"].map(item => (
                      <div key={item} className="p-3 rounded-lg bg-secondary/20 border border-border/30">
                        <p className="font-serif text-sm text-foreground">{item}</p>
                        <Badge variant="outline" className="text-[10px] mt-1 font-serif">Coming Soon</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default HivePage;
