import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCityBySlug, getCitiesByCountry } from "@/config/cityRegistry";
import { useMapFocus } from "@/hooks/use-map-focus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin, TreeDeciduous, Heart, Footprints, MapIcon, Camera, BookOpen,
  Music, FileText, Users, Calendar, Globe, ChevronLeft, Flower2, Sparkles,
  ArrowLeft, Compass, MessageSquare, Eye,
} from "lucide-react";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import Header from "@/components/Header";
import AtlasBreadcrumb from "@/components/AtlasBreadcrumb";

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

/* ─── Main Page ─── */
const CityTemplatePage = () => {
  const { countrySlug, citySlug } = useParams<{ countrySlug: string; citySlug: string }>();
  const navigate = useNavigate();
  const { focusMap } = useMapFocus();
  const city = getCityBySlug(countrySlug || "", citySlug || "");
  const siblingCities = getCitiesByCountry(countrySlug || "").filter((c) => c.slug !== citySlug);

  /* ─── State ─── */
  const [trees, setTrees] = useState<any[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [hearts, setHearts] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("roots");
  const [shelfView, setShelfView] = useState<"public" | "personal">("public");

  /* ─── Data loading ─── */
  useEffect(() => {
    if (!city) return;
    const fetchData = async () => {
      setLoading(true);
      const [south, west, north, east] = city.bbox;

      const { data: treeData } = await supabase
        .from("trees")
        .select("id, name, species, latitude, longitude, created_at")
        .gte("latitude", south)
        .lte("latitude", north)
        .gte("longitude", west)
        .lte("longitude", east);
      const localTrees = treeData || [];
      setTrees(localTrees);

      if (localTrees.length > 0) {
        const treeIds = localTrees.map((t: any) => t.id);

        const { data: offeringData } = await supabase
          .from("offerings")
          .select("id, type, title, tree_id, created_at, media_url")
          .in("tree_id", treeIds.slice(0, 100))
          .order("created_at", { ascending: false })
          .limit(50);
        setOfferings(offeringData || []);

        const { data: checkinData } = await supabase
          .from("tree_checkins")
          .select("id, tree_id, user_id, checked_in_at")
          .in("tree_id", treeIds.slice(0, 100))
          .order("checked_in_at", { ascending: false })
          .limit(100);
        setCheckins(checkinData || []);

        const { data: heartData } = await supabase
          .from("heart_transactions")
          .select("amount")
          .in("tree_id", treeIds.slice(0, 100));
        const total = (heartData || []).reduce((s: number, h: any) => s + (h.amount || 0), 0);
        setHearts(total);
      } else {
        setOfferings([]);
        setCheckins([]);
        setHearts(0);
      }

      setLoading(false);
    };
    fetchData();
  }, [city?.bbox[0], city?.bbox[1], city?.bbox[2], city?.bbox[3]]);

  const uniqueVisitors = useMemo(() => new Set(checkins.map((c) => c.user_id)).size, [checkins]);
  const offeringsByType = useMemo(() => {
    const map: Record<string, any[]> = {};
    offerings.forEach((o) => {
      if (!map[o.type]) map[o.type] = [];
      map[o.type].push(o);
    });
    return map;
  }, [offerings]);

  const openMapFiltered = useCallback(() => {
    if (!city) return;
    focusMap({ type: "area", id: citySlug || "", lat: city.center[0], lng: city.center[1], zoom: 11, source: "county", countrySlug });
  }, [city, focusMap, citySlug, countrySlug]);

  /* ─── Not found guard ─── */
  if (!city) {
    return (
      <PageShell>
        <Header />
        <div className="min-h-screen flex items-center justify-center pb-24 pt-20">
          <Card className="max-w-md mx-auto border-primary/20">
            <CardContent className="p-8 text-center space-y-4">
              <TreeDeciduous className="w-12 h-12 text-primary mx-auto opacity-60" />
              <h2 className="font-serif text-xl text-foreground">City Not Found</h2>
              <p className="text-sm text-muted-foreground">This grove hasn't been planted yet.</p>
              <Button variant="sacred" asChild>
                <Link to={`/atlas/${countrySlug}`}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back to Country
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }



  return (
    <PageShell>
      <Header />
      <div className="min-h-screen pb-24 pt-16">
        {/* ═══ 1️⃣ HERO ═══ */}
        <section className="relative px-4 pt-12 pb-10 text-center overflow-hidden">
          {/* Subtle canopy gradient overlay */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 80%, hsl(var(--primary) / 0.3), transparent 70%)`,
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 max-w-2xl mx-auto"
          >
            {/* Breadcrumb */}
            <div className="mb-3 flex justify-center">
              <AtlasBreadcrumb segments={[
                { label: city.countryName, to: `/atlas/${city.countrySlug}` },
                { label: city.name },
              ]} />
            </div>

            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">
              {city.name}
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto italic mb-1">
              {city.tagline}
            </p>
            {city.waterway && (
              <p className="text-xs text-muted-foreground/60 mb-4">
                Along the {city.waterway}
              </p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <Badge variant="outline" className="text-xs border-primary/30">
                <MapPin className="w-3 h-3 mr-1" /> {city.region}
              </Badge>
              <Badge variant="outline" className="text-xs border-primary/30">
                <TreeDeciduous className="w-3 h-3 mr-1" /> {city.treePalette.join(" · ")}
              </Badge>
              {!loading && (
                <Badge variant="outline" className="text-xs border-primary/30 bg-primary/5">
                  {city.name} Active
                </Badge>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="mystical" size="lg" onClick={openMapFiltered}>
                <Globe className="w-4 h-4 mr-2" /> View {city.name} on Map
              </Button>
              <Button
                variant="sacred"
                size="lg"
                onClick={() => {
                  setActiveTab("roots");
                  window.scrollTo({ top: 600, behavior: "smooth" });
                }}
              >
                <TreeDeciduous className="w-4 h-4 mr-2" /> Meet the Ancient Friends
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate(`/add-tree`)}
              >
                <Heart className="w-4 h-4 mr-2" /> Contribute to the Grove
              </Button>
            </div>
          </motion.div>
        </section>

        {/* ═══ 3️⃣ GROVE PULSE METRICS ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-8">
          <h2 className="text-lg font-serif text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> {city.name} Grove Pulse
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatTile label="Trees Mapped" value={loading ? "…" : trees.length} icon={TreeDeciduous} />
            <StatTile label="Encounters Logged" value={loading ? "…" : checkins.length} icon={Footprints} />
            <StatTile label="S33D Hearts" value={loading ? "…" : hearts} icon={Heart} />
            <StatTile label="Unique Visitors" value={loading ? "…" : uniqueVisitors} icon={Users} />
            <StatTile label="Offerings Added" value={loading ? "…" : offerings.length} icon={Camera} />
            <StatTile label="Species" value={loading ? "…" : new Set(trees.map((t) => t.species)).size} icon={Flower2} />
          </div>
        </section>

        {/* ═══ MAIN TABS ═══ */}
        <section className="px-4 max-w-3xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-card/50 border border-primary/20 mb-4 flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="roots" className="text-xs">🌳 Roots</TabsTrigger>
              <TabsTrigger value="library" className="text-xs">📚 Library</TabsTrigger>
              <TabsTrigger value="council" className="text-xs">🕯️ Council</TabsTrigger>
              <TabsTrigger value="bloom" className="text-xs">🌸 Bloom</TabsTrigger>
            </TabsList>

            {/* ═══ 2️⃣ ROOTS – Ancient Friends ═══ */}
            <TabsContent value="roots">
              <div className="space-y-4">
                {loading ? (
                  <p className="text-center py-12 text-muted-foreground text-sm">Loading trees…</p>
                ) : trees.length === 0 ? (
                  <Card className="border-primary/15">
                    <CardContent className="py-12 text-center space-y-4">
                      <TreeDeciduous className="w-12 h-12 text-primary mx-auto opacity-40" />
                      <p className="font-serif text-foreground">No Ancient Friends mapped in {city.name} yet</p>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Be the first to plant a pin beneath {city.name}'s canopy.
                      </p>
                      <Button variant="mystical" onClick={() => navigate("/add-tree")}>
                        <MapPin className="w-4 h-4 mr-1" /> Claim an Encounter
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {trees.slice(0, 20).map((tree) => (
                      <Card key={tree.id} className="border-primary/10 hover:border-primary/30 transition-all group cursor-pointer"
                        onClick={() => navigate(`/tree/${tree.id}`)}
                      >
                        <CardContent className="p-4 space-y-1">
                          <p className="text-sm font-serif text-foreground truncate">
                            {tree.name || tree.species || "Unnamed Tree"}
                          </p>
                          <p className="text-xs text-muted-foreground italic truncate">{tree.species}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{tree.latitude?.toFixed(4)}, {tree.longitude?.toFixed(4)}</span>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button variant="ghost" size="sm" className="h-7 text-xs px-2"
                              onClick={(e) => { e.stopPropagation(); focusMap({ type: "tree", id: tree.id, lat: tree.latitude, lng: tree.longitude, zoom: 16, source: "search" }); }}
                            >
                              <Eye className="w-3 h-3 mr-1" /> Map
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                {trees.length > 20 && (
                  <p className="text-center text-xs text-muted-foreground">
                    Showing 20 of {trees.length} trees. <button className="text-primary underline" onClick={openMapFiltered}>View all on map →</button>
                  </p>
                )}
              </div>
            </TabsContent>

            {/* ═══ 4️⃣ HEARTWOOD LIBRARY – City Shelf ═══ */}
            <TabsContent value="library">
              <div className="space-y-4">
                {/* Shelf toggle */}
                <div className="flex gap-2 mb-2">
                  <Button
                    variant={shelfView === "public" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShelfView("public")}
                  >
                    Public Grove Shelf
                  </Button>
                  <Button
                    variant={shelfView === "personal" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShelfView("personal")}
                  >
                    My Personal Shelf
                  </Button>
                </div>

                {loading ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">Loading offerings…</p>
                ) : offerings.length === 0 ? (
                  <Card className="border-primary/15">
                    <CardContent className="py-12 text-center space-y-3">
                      <BookOpen className="w-10 h-10 text-primary mx-auto opacity-40" />
                      <p className="font-serif text-foreground">The {city.name} shelf is empty</p>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Leave a story, poem, photo, or song beneath a {city.name} tree.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Tree-Linked Offerings */}
                    <h3 className="text-sm font-serif text-foreground flex items-center gap-2">
                      <TreeDeciduous className="w-4 h-4 text-primary" /> Tree-Linked Offerings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {offerings.filter((o) => o.tree_id).slice(0, 12).map((o) => (
                        <Card key={o.id} className="border-primary/10">
                          <CardContent className="p-3 space-y-1">
                            <div className="flex items-center gap-2">
                              {o.type === "photo" && <Camera className="w-3.5 h-3.5 text-primary" />}
                              {o.type === "story" && <MessageSquare className="w-3.5 h-3.5 text-primary" />}
                              {o.type === "poem" && <FileText className="w-3.5 h-3.5 text-primary" />}
                              {o.type === "song" && <Music className="w-3.5 h-3.5 text-primary" />}
                              {o.type === "voice" && <Music className="w-3.5 h-3.5 text-primary" />}
                              {o.type === "book" && <BookOpen className="w-3.5 h-3.5 text-primary" />}
                              <span className="text-xs font-serif text-foreground truncate">{o.title}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(o.created_at).toLocaleDateString()}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* City-Level summary */}
                    <h3 className="text-sm font-serif text-foreground flex items-center gap-2 mt-4">
                      <Heart className="w-4 h-4 text-primary" /> City Offerings Summary
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(offeringsByType).map(([type, items]) => (
                        <Card key={type} className="border-primary/10">
                          <CardContent className="p-3 text-center">
                            <p className="text-lg font-serif font-bold text-foreground">{items.length}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">{type}s</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* ═══ 5️⃣ COUNCIL OF LIFE ═══ */}
            <TabsContent value="council">
              <Card className="border-primary/15">
                <CardContent className="py-12 text-center space-y-4">
                  <Users className="w-10 h-10 text-primary mx-auto opacity-40" />
                  <p className="font-serif text-foreground">
                    Would you host a Council beneath {city.name}'s branches?
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    No gatherings have been recorded in {city.name} yet.
                    Be the first to light the fire.
                  </p>
                  <Button variant="mystical" asChild>
                    <Link to="/council-of-life">
                      <Calendar className="w-4 h-4 mr-1" /> Start a {city.name} Circle
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══ 6️⃣ BLOOMING CLOCK ═══ */}
            <TabsContent value="bloom">
              <Card className="border-primary/15">
                <CardContent className="py-12 text-center space-y-4">
                  <Flower2 className="w-10 h-10 text-primary mx-auto opacity-40" />
                  <p className="font-serif text-foreground">
                    {city.name} Blooming Clock
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Seasonal blossom and fruit submissions will appear here as wanderers
                    record what blooms beneath {city.name}'s canopy.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                    {city.treePalette.map((sp) => (
                      <Badge key={sp} variant="outline" className="border-primary/20">
                        {sp}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* ═══ 7️⃣ GROVE CONNECTOR PANEL ═══ */}
        <section className="px-4 max-w-3xl mx-auto mt-12">
          <Card className="border-primary/15 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-serif flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary" /> Grove Connector
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/atlas/${city.countrySlug}`}>
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to {city.countryName}
                  </Link>
                </Button>
                {siblingCities.length > 0 && (
                  siblingCities.map((sc) => (
                    <Button key={sc.slug} variant="ghost" size="sm" asChild>
                      <Link to={`/atlas/${sc.countrySlug}/${sc.slug}`}>
                        {sc.name}
                      </Link>
                    </Button>
                  ))
                )}
                <Button variant="ghost" size="sm" onClick={() => navigate("/map")}>
                  <Globe className="w-3.5 h-3.5 mr-1" /> Global Map
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/hives">
                    <Users className="w-3.5 h-3.5 mr-1" /> Nearest Hive
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </PageShell>
  );
};

export default CityTemplatePage;
