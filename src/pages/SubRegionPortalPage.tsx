import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMapFocus } from "@/hooks/use-map-focus";
import { supabase } from "@/integrations/supabase/client";
import { getSubRegionBySlug, getSubRegionsByCountry, getSubRegionLabel } from "@/config/subRegionRegistry";
import { SLUG_MAP } from "@/config/countryRegistry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin, TreeDeciduous, Heart, Eye, MapIcon, Compass,
  BookOpen, ChevronRight, Sparkles, ArrowLeft, BarChart3, Scroll, ExternalLink,
  Shield, Footprints,
} from "lucide-react";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import AtlasBreadcrumb from "@/components/AtlasBreadcrumb";

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
  record_status: string;
  verification_score: number;
}

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

/* ─── Tree Card ─── */
const TreeCard = ({ tree, onNavigate }: { tree: ResearchTree; onNavigate: (t: ResearchTree) => void }) => {
  const precColor = tree.geo_precision === "exact"
    ? "hsl(120 45% 45%)"
    : tree.geo_precision === "approx"
      ? "hsl(42 95% 55%)"
      : "hsl(0 0% 50%)";

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
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full" style={{ background: precColor }} title={`Precision: ${tree.geo_precision}`} />
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{tree.geo_precision}</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{tree.locality_text}</span>
        </p>
        {(tree.height_m || tree.girth_or_stem) && (
          <div className="flex gap-3 text-xs text-muted-foreground">
            {tree.height_m && <span>H: {tree.height_m}m</span>}
            {tree.girth_or_stem && <span>G: {tree.girth_or_stem}</span>}
            {tree.crown_spread && <span>C: {tree.crown_spread}</span>}
          </div>
        )}
        {tree.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{tree.description}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          <a
            href={tree.source_doc_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
          >
            <Scroll className="w-3 h-3" />
            {tree.source_doc_title.length > 25 ? tree.source_doc_title.slice(0, 22) + "…" : tree.source_doc_title}
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <div className="flex gap-1.5">
            {tree.latitude && (
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => onNavigate(tree)}>
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
};

/* ═══ Main Page ═══ */
const SubRegionPortalPage = () => {
  const { countrySlug, subSlug: subRegionSlug } = useParams<{ countrySlug: string; subSlug: string }>();
  const navigate = useNavigate();

  const region = getSubRegionBySlug(countrySlug || "", subRegionSlug || "");
  const country = SLUG_MAP[countrySlug || ""];
  const siblingRegions = getSubRegionsByCountry(countrySlug || "").filter(r => r.slug !== subRegionSlug);
  const regionLabel = getSubRegionLabel(countrySlug || "");

  const [trees, setTrees] = useState<ResearchTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("notable");

  useEffect(() => {
    if (!region || !country) return;
    let cancelled = false;
    const fetchTrees = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("research_trees")
        .select("*")
        .eq("country", country.country)
        .eq("province", region.provinceKey)
        .order("tree_name");
      if (!cancelled && !error && data) setTrees(data as ResearchTree[]);
      if (!cancelled) setLoading(false);
    };
    fetchTrees();
    return () => { cancelled = true; };
  }, [region?.provinceKey, country?.country]);

  const speciesCount = useMemo(() => new Set(trees.map(t => t.species_scientific)).size, [trees]);
  const withCoords = useMemo(() => trees.filter(t => t.latitude != null).length, [trees]);

  const { focusMap } = useMapFocus();

  const handleMapNavigate = useCallback((tree: ResearchTree) => {
    if (tree.latitude && tree.longitude) {
      focusMap({
        type: "tree",
        id: tree.id || `${tree.latitude}-${tree.longitude}`,
        lat: tree.latitude,
        lng: tree.longitude,
        zoom: 15,
        countrySlug,
        source: "atlas_card",
      });
    }
  }, [focusMap, countrySlug]);

  const openMapLayer = useCallback(() => {
    focusMap({ type: "area", id: countrySlug || "", countrySlug, source: "atlas_card" });
  }, [focusMap, countrySlug]);

  /* ─── Not found guard ─── */
  if (!region || !country) {
    return (
      <PageShell>
        <Header />
        <div className="min-h-screen flex items-center justify-center pb-24 pt-20">
          <Card className="max-w-md mx-auto border-primary/20">
            <CardContent className="p-8 text-center space-y-4">
              <TreeDeciduous className="w-12 h-12 text-primary mx-auto opacity-60" />
              <h2 className="font-serif text-xl text-foreground">Region Not Found</h2>
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
        {/* ─── Hero ─── */}
        <section className="relative px-4 pt-12 pb-8 text-center">
          <div className="max-w-3xl mx-auto mb-4 flex justify-center">
            <AtlasBreadcrumb segments={[
              { label: `${country.flag} ${country.country}`, to: `/atlas/${countrySlug}` },
              { label: region.name },
            ]} />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <p className="text-3xl mb-2">{region.icon}</p>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
              {region.name}
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-4 italic">
              {region.tagline}
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <Badge variant="outline" className="text-xs border-primary/30">
                <Scroll className="w-3 h-3 mr-1" /> Research Layer
              </Badge>
              <Badge variant="outline" className="text-xs border-primary/30">
                <Shield className="w-3 h-3 mr-1" /> Provenance preserved
              </Badge>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="mystical" onClick={openMapLayer}>
                <MapIcon className="w-4 h-4 mr-1" /> Open Map Layer
              </Button>
              <Button variant="sacred" onClick={() => navigate("/add-tree")}>
                <MapPin className="w-4 h-4 mr-1" /> Map a Tree in {region.name}
              </Button>
            </div>
          </motion.div>
        </section>

        {/* ─── Stats ─── */}
        <section className="px-4 max-w-3xl mx-auto mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatTile label="Notable Trees" value={loading ? "…" : trees.length} icon={TreeDeciduous} />
            <StatTile label="Distinct Species" value={loading ? "…" : speciesCount} icon={BarChart3} />
            <StatTile label="With Coordinates" value={loading ? "…" : withCoords} icon={MapPin} />
          </div>
        </section>

        {/* ─── Tabs ─── */}
        <section className="px-4 max-w-3xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-card/50 border border-primary/20 mb-4">
              <TabsTrigger value="notable">Notable Grove</TabsTrigger>
              <TabsTrigger value="species">Species</TabsTrigger>
            </TabsList>

            <TabsContent value="notable">
              {loading ? (
                <p className="text-center py-12 text-muted-foreground">Loading research records…</p>
              ) : trees.length === 0 ? (
                <Card className="border-primary/15">
                  <CardContent className="py-12 text-center space-y-4">
                    <TreeDeciduous className="w-12 h-12 text-primary mx-auto opacity-40" />
                    <p className="font-serif text-foreground">No notable trees seeded yet</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Be the first to suggest a notable tree in {region.name}.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {trees.map(tree => (
                    <TreeCard key={tree.id} tree={tree} onNavigate={handleMapNavigate} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="species">
              {(() => {
                const speciesMap = new Map<string, { scientific: string; common: string | null; count: number }>();
                trees.forEach(t => {
                  const existing = speciesMap.get(t.species_scientific);
                  if (existing) existing.count++;
                  else speciesMap.set(t.species_scientific, { scientific: t.species_scientific, common: t.species_common, count: 1 });
                });
                const ranking = Array.from(speciesMap.values()).sort((a, b) => b.count - a.count);
                if (ranking.length === 0) return <p className="text-sm text-muted-foreground py-4">No species data available.</p>;
                return (
                  <Card className="border-primary/10">
                    <CardContent className="py-4">
                      {ranking.map(s => (
                        <div key={s.scientific} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-serif text-foreground truncate">{s.common || s.scientific}</p>
                            {s.common && <p className="text-xs text-muted-foreground italic truncate">{s.scientific}</p>}
                          </div>
                          <span className="text-xs font-medium text-muted-foreground">{s.count}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })()}
            </TabsContent>
          </Tabs>
        </section>

        {/* ─── Spark Quick Action ─── */}
        <section className="px-4 max-w-3xl mx-auto mt-8 mb-6">
          <Card className="border-primary/15 bg-primary/5 backdrop-blur-sm">
            <CardContent className="py-5 px-5 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-serif text-foreground mb-1">Know a notable tree in {region.name}?</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  Use the Spark button to suggest a notable tree for this canton. Your contribution helps grow the atlas.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─── Sibling Regions ─── */}
        {siblingRegions.length > 0 && (
          <section className="px-4 max-w-3xl mx-auto mt-6 mb-6">
            <h2 className="text-lg font-serif font-bold text-foreground mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-primary" /> Other {regionLabel}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {siblingRegions.map(r => (
                <Card key={r.slug} className="border-primary/15 hover:border-primary/30 transition-all cursor-pointer" onClick={() => navigate(`/atlas/${countrySlug}/${r.slug}`)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-serif font-bold text-foreground">{r.icon} {r.name}</p>
                      <p className="text-xs text-muted-foreground italic">{r.tagline}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ─── Footer ─── */}
        <section className="px-4 max-w-3xl mx-auto mt-12">
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/atlas/${countrySlug}`}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> {country.country}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/map">
                <MapIcon className="w-3.5 h-3.5 mr-1" /> Ancient Friends Map
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/atlas">
                <BookOpen className="w-3.5 h-3.5 mr-1" /> World Atlas
              </Link>
            </Button>
          </div>
        </section>
      </div>
      <BottomNav />
    </PageShell>
  );
};

export default SubRegionPortalPage;
