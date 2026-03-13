import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMapFocus } from "@/hooks/use-map-focus";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  MapPin, TreeDeciduous, Compass, Mountain, BookOpen, Map as MapIcon,
  Shield, Sparkles, Filter, Droplets, Thermometer, Leaf, Globe, Layers,
  Users, ChevronDown, ArrowRight, Plus, Heart, Navigation, Eye, Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import Header from "@/components/Header";
import AtlasBreadcrumb from "@/components/AtlasBreadcrumb";


/* ━━━ Types ━━━ */
interface BioRegion {
  id: string;
  name: string;
  type: string;
  countries: string[];
  climate_band: string | null;
  elevation_range: string | null;
  dominant_species: string[];
  primary_watersheds: string[];
  biome_description: string | null;
  center_lat: number | null;
  center_lon: number | null;
  governance_status: string;
  parent_id: string | null;
}

interface LinkedTree {
  id: string;
  name: string;
  species: string;
  latitude: number | null;
  longitude: number | null;
  nation: string | null;
}

interface ChildBioRegion {
  id: string;
  name: string;
  type: string;
}

/* ━━━ Type badge color ━━━ */
const typeColor = (t: string) => {
  if (t.includes("Mountain")) return "hsl(var(--primary))";
  if (t.includes("Wetland")) return "hsl(200 55% 50%)";
  if (t.includes("Forest")) return "hsl(140 50% 35%)";
  if (t.includes("Watershed")) return "hsl(210 60% 50%)";
  return "hsl(var(--muted-foreground))";
};

const typeEmoji = (t: string) => {
  if (t.includes("Mountain")) return "🏔️";
  if (t.includes("Wetland")) return "🌊";
  if (t.includes("Forest")) return "🌲";
  if (t.includes("Watershed")) return "💧";
  return "🌍";
};

/* ━━━ Stat tile ━━━ */
const StatTile = ({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent?: string }) => (
  <Card className="border-primary/15 bg-card/60 backdrop-blur-sm">
    <CardContent className="p-3 flex items-center gap-3">
      <div className="p-2 rounded-lg" style={{ background: accent ? `${accent}20` : undefined }}>
        <Icon className="w-4 h-4" style={{ color: accent || "hsl(var(--primary))" }} />
      </div>
      <div>
        <p className="text-lg font-serif font-bold text-foreground">{value}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
      </div>
    </CardContent>
  </Card>
);

/* ━━━ Pill filter ━━━ */
const PillFilter = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-card/60 text-muted-foreground border-border/40 hover:border-primary/40"
    }`}
  >
    {children}
  </button>
);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN — Bio-Region Portal (dynamic by slug)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const BioRegionPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { focusMap } = useMapFocus();
  const [region, setRegion] = useState<BioRegion | null>(null);
  const [loading, setLoading] = useState(true);
  const [ecologyOpen, setEcologyOpen] = useState(false);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [speciesFilter, setSpeciesFilter] = useState<string | null>(null);
  const [linkedTrees, setLinkedTrees] = useState<LinkedTree[]>([]);
  const [childRegions, setChildRegions] = useState<ChildBioRegion[]>([]);
  const [parentRegion, setParentRegion] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Fetch bio-region
      const { data } = await supabase
        .from("bio_regions")
        .select("id, name, type, countries, climate_band, elevation_range, dominant_species, primary_watersheds, biome_description, center_lat, center_lon, governance_status, parent_id")
        .eq("id", slug ?? "")
        .maybeSingle();
      if (data) {
        setRegion(data as unknown as BioRegion);

        // Fetch parent if exists
        if (data.parent_id) {
          const { data: parent } = await supabase
            .from("bio_regions")
            .select("id, name")
            .eq("id", data.parent_id)
            .maybeSingle();
          if (parent) setParentRegion(parent as { id: string; name: string });
        }
      }

      // Fetch child bio-regions
      const { data: children } = await supabase
        .from("bio_regions")
        .select("id, name, type")
        .eq("parent_id", slug ?? "");
      if (children) setChildRegions(children as ChildBioRegion[]);

      // Fetch linked trees via single RPC
      const { data: treesData } = await supabase.rpc("get_bio_region_trees", {
        p_bio_region_id: slug ?? "",
      });
      if (treesData) setLinkedTrees(treesData as LinkedTree[]);

      setLoading(false);
    };
    load();
  }, [slug]);

  // Filtered trees based on active filters
  const filteredTrees = useMemo(() => {
    let result = linkedTrees;
    if (countryFilter) result = result.filter(t => t.nation === countryFilter);
    if (speciesFilter) result = result.filter(t => t.species?.toLowerCase().includes(speciesFilter.toLowerCase()));
    return result;
  }, [linkedTrees, countryFilter, speciesFilter]);

  const treeCount = linkedTrees.length;

  // mapUrl retired — navigation now uses focusMap()

  if (loading) {
    return (
      <PageShell>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground text-sm font-serif">Loading bio-region…</p>
        </div>
      </PageShell>
    );
  }

  if (!region) {
    return (
      <PageShell>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground text-sm">Bio-region not found.</p>
          <Button variant="sacred" asChild><Link to="/atlas/bio-regions">All Bio-Regions</Link></Button>
        </div>
      </PageShell>
    );
  }

  const emoji = typeEmoji(region.type);
  const color = typeColor(region.type);

  return (
    <PageShell>
      <Header />
      <div className="min-h-screen pb-24 pt-16">

        {/* ═══════ HERO ═══════ */}
        <section className="relative px-4 pt-10 pb-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-stone-900/8 to-transparent pointer-events-none" />
          <div
            className="absolute bottom-0 left-0 right-0 h-24 opacity-[0.04] pointer-events-none"
            style={{
              background: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1200 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 120 L100 60 L220 85 L380 15 L500 55 L620 8 L780 42 L900 18 L1020 52 L1120 28 L1200 50 L1200 120Z' fill='white'/%3E%3C/svg%3E\") no-repeat center bottom / cover",
            }}
          />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative max-w-2xl mx-auto text-center">
            <div className="mb-4">
              <AtlasBreadcrumb segments={[
                { label: "🌍 Atlas", to: "/atlas" },
                { label: "Bio-Regions", to: "/atlas/bio-regions" },
                { label: region.name },
              ]} />
            </div>

            <Badge variant="outline" className="mb-3 text-[10px] border-primary/30 text-primary">
              <Layers className="w-3 h-3 mr-1" /> Bio-Region · {region.type}
            </Badge>

            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
              {emoji} {region.name}
            </h1>

            {region.biome_description && (
              <p className="text-sm text-muted-foreground italic mb-5 max-w-lg mx-auto leading-relaxed">
                {region.biome_description.slice(0, 200)}
                {region.biome_description.length > 200 ? "…" : ""}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-2 mb-5">
              {region.countries.map(c => (
                <Badge key={c} variant="outline" className="text-xs border-border/50 text-muted-foreground">
                  <Globe className="w-3 h-3 mr-1" /> {c}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-5">
              {region.elevation_range && (
                <Badge variant="outline" className="text-xs border-amber-400/30 text-amber-300">
                  <Mountain className="w-3 h-3 mr-1" /> {region.elevation_range}
                </Badge>
              )}
              {region.climate_band && (
                <Badge variant="outline" className="text-xs border-sky-400/30 text-sky-300">
                  <Thermometer className="w-3 h-3 mr-1" /> {region.climate_band}
                </Badge>
              )}
              {region.primary_watersheds.length > 0 && (
                <Badge variant="outline" className="text-xs border-blue-400/30 text-blue-300">
                  <Droplets className="w-3 h-3 mr-1" /> {region.primary_watersheds.length} Watersheds
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="mystical" onClick={() => {
                if (region?.center_lat && region?.center_lon) {
                  focusMap({ type: "area", id: slug || "", lat: region.center_lat, lng: region.center_lon, source: "region" });
                }
              }}>
                <MapIcon className="w-4 h-4 mr-1" /> Open Bio-Region Map
              </Button>
              <Button variant="sacred" asChild>
                <Link to="/add-tree"><Plus className="w-4 h-4 mr-1" /> Map an Ancient Friend</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to={`/atlas/bio-regions/${slug}/calendar`}><Calendar className="w-4 h-4 mr-1" /> Bioregional Calendar</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/council"><Users className="w-4 h-4 mr-1" /> Host a Council</Link>
              </Button>
            </div>
          </motion.div>
        </section>

        {/* ═══════ STATS ═══════ */}
        <section className="px-4 max-w-3xl mx-auto mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile label="Countries" value={region.countries.length} icon={Globe} accent="hsl(200 55% 50%)" />
            <StatTile label="Dominant Species" value={region.dominant_species.length} icon={Leaf} accent="hsl(150 40% 35%)" />
            <StatTile label="Trees Mapped" value={treeCount} icon={TreeDeciduous} accent="hsl(42 85% 55%)" />
            <StatTile label="Governance" value={region.governance_status} icon={Shield} accent={color} />
          </div>
        </section>

        {/* ═══════ ECOLOGY SNAPSHOT ═══════ */}
        <section className="px-4 max-w-3xl mx-auto mb-8">
          <Collapsible open={ecologyOpen} onOpenChange={setEcologyOpen}>
            <Card className="border-primary/15 bg-card/60 backdrop-blur-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full p-4 flex items-center justify-between text-left hover:bg-primary/5 transition-colors">
                  <h2 className="text-sm font-serif font-bold text-foreground flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-500" /> Ecology Snapshot
                  </h2>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${ecologyOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-5 px-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {region.elevation_range && (
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Elevation Range</p>
                        <p className="text-sm text-foreground flex items-center gap-1"><Mountain className="w-3.5 h-3.5 text-primary" /> {region.elevation_range}</p>
                      </div>
                    )}
                    {region.climate_band && (
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Climate Band</p>
                        <p className="text-sm text-foreground flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-primary" /> {region.climate_band}</p>
                      </div>
                    )}
                    {region.primary_watersheds.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Watershed Systems</p>
                        <div className="flex flex-wrap gap-1.5">
                          {region.primary_watersheds.map(w => (
                            <Badge key={w} variant="outline" className="text-[10px]"><Droplets className="w-2.5 h-2.5 mr-0.5" /> {w}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Dominant Species</p>
                      <div className="flex flex-wrap gap-1.5">
                        {region.dominant_species.map(sp => (
                          <Badge key={sp} variant="outline" className="text-[10px]">🌿 {sp}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {region.biome_description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{region.biome_description}</p>
                  )}

                  <p className="text-[10px] text-muted-foreground/70 leading-relaxed italic">
                    This Bio-Region is not a political boundary. It is defined by ecology, watershed systems,
                    and shared ecological memory — not by nations or administrations.
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </section>

        {/* ═══════ FILTERS ═══════ */}
        <section className="px-4 max-w-3xl mx-auto mb-6">
          <h2 className="text-sm font-serif font-bold text-foreground mb-3 flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" /> Explore by Filter
          </h2>

          {/* Country filter */}
          {region.countries.length > 1 && (
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Country</p>
              <ScrollArea className="w-full">
                <div className="flex gap-1.5 pb-2">
                  <PillFilter active={!countryFilter} onClick={() => setCountryFilter(null)}>All</PillFilter>
                  {region.countries.map(c => (
                    <PillFilter key={c} active={countryFilter === c} onClick={() => setCountryFilter(countryFilter === c ? null : c)}>{c}</PillFilter>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {/* Species filter */}
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Dominant Species</p>
            <ScrollArea className="w-full">
              <div className="flex gap-1.5 pb-2">
                <PillFilter active={!speciesFilter} onClick={() => setSpeciesFilter(null)}>All</PillFilter>
                {region.dominant_species.map(sp => (
                  <PillFilter key={sp} active={speciesFilter === sp} onClick={() => setSpeciesFilter(speciesFilter === sp ? null : sp)}>{sp}</PillFilter>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </section>

        {/* ═══════ CHILD / PARENT BIO-REGIONS ═══════ */}
        {(parentRegion || childRegions.length > 0) && (
          <section className="px-4 max-w-3xl mx-auto mb-6">
            <Card className="border-primary/15 bg-card/50">
              <CardContent className="p-4 space-y-3">
                {parentRegion && (
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Parent Bio-Region</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/atlas/bio-regions/${parentRegion.id}`}>
                        <Layers className="w-3 h-3 mr-1" /> {parentRegion.name} <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                )}
                {childRegions.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Sub-Regions</p>
                    <div className="flex flex-wrap gap-2">
                      {childRegions.map(cr => (
                        <Button key={cr.id} variant="outline" size="sm" asChild>
                          <Link to={`/atlas/bio-regions/${cr.id}`}>
                            {typeEmoji(cr.type)} {cr.name} <ArrowRight className="w-3 h-3 ml-1" />
                          </Link>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* ═══════ TABS ═══════ */}
        <section className="px-4 max-w-3xl mx-auto">
          <Tabs defaultValue="trees">
            <TabsList className="bg-card/50 border border-primary/20 mb-4">
              <TabsTrigger value="trees">Trees ({filteredTrees.length})</TabsTrigger>
              <TabsTrigger value="countries">Countries</TabsTrigger>
              <TabsTrigger value="species">Species Hives</TabsTrigger>
              <TabsTrigger value="councils">Councils</TabsTrigger>
            </TabsList>

            {/* Trees linked to this bio-region */}
            <TabsContent value="trees">
              {filteredTrees.length === 0 ? (
                <Card className="border-primary/10">
                  <CardContent className="p-6 text-center">
                    <TreeDeciduous className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No trees linked to this bio-region yet.</p>
                    <Button variant="sacred" size="sm" className="mt-3" asChild>
                      <Link to="/add-tree"><Plus className="w-3.5 h-3.5 mr-1" /> Map an Ancient Friend</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredTrees.map(t => (
                    <Card key={t.id} className="border-primary/10 hover:border-primary/30 transition-all cursor-pointer"
                      onClick={() => t.latitude && t.longitude && focusMap({ type: "tree", id: t.id, lat: t.latitude, lng: t.longitude, source: "region" })}>
                      <CardContent className="p-3 space-y-1">
                        <p className="text-sm font-serif font-bold text-foreground">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground italic">{t.species}</p>
                        <div className="flex items-center gap-2">
                          {t.nation && <Badge variant="outline" className="text-[10px]"><Globe className="w-2.5 h-2.5 mr-0.5" /> {t.nation}</Badge>}
                          {t.latitude ? (
                            <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30"><MapPin className="w-2.5 h-2.5 mr-0.5" /> GPS</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-400/30">📍 Needs GPS</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Countries in this bio-region */}
            <TabsContent value="countries">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {region.countries.map(c => {
                  const countrySlug = c.toLowerCase().replace(/\s+/g, "-");
                  return (
                    <Card key={c} className="border-primary/10 hover:border-primary/30 transition-all">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-sm font-serif font-bold text-foreground">{c}</p>
                            <p className="text-[10px] text-muted-foreground">Country Atlas</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/atlas/${countrySlug}`}>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Species distribution */}
            <TabsContent value="species">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {region.dominant_species.map(sp => (
                  <Card key={sp} className="border-primary/10 hover:border-primary/30 transition-all">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Leaf className="w-5 h-5 text-emerald-500" />
                        <div>
                          <p className="text-sm font-serif text-foreground italic">{sp}</p>
                          <p className="text-[10px] text-muted-foreground">Distribution across this bio-region</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/hives`}><Compass className="w-4 h-4" /></Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Councils */}
            <TabsContent value="councils">
              <div className="space-y-4">
                <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="text-sm font-serif font-bold text-foreground flex items-center gap-2">
                      <Heart className="w-4 h-4 text-amber-400" /> Offerings in {region.name}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Share a reflection, photograph, or field recording from this ecological system.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="sacred" size="sm" asChild>
                        <Link to="/whispers"><Heart className="w-3.5 h-3.5 mr-1" /> Leave an Offering</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/library"><BookOpen className="w-3.5 h-3.5 mr-1" /> Browse Library</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/15 bg-gradient-to-br from-indigo-500/5 to-card/80">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="text-sm font-serif font-bold text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" /> Council of Life — {region.name}
                    </h3>
                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                      Gather in the landscape of {region.name}. Who would you bring to a Council
                      where ecology — not politics — shapes the conversation?
                    </p>
                    <div className="flex gap-2">
                      <Button variant="sacred" size="sm" asChild>
                        <Link to="/time-tree"><Sparkles className="w-3.5 h-3.5 mr-1" /> Enter Time Tree</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/council"><Users className="w-3.5 h-3.5 mr-1" /> Host a Council</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* ═══════ ECOLOGICAL STEWARDSHIP ═══════ */}
        <section className="px-4 max-w-3xl mx-auto mt-10 mb-6">
          <Card className="border-primary/15 bg-card/40 border-dashed">
            <CardContent className="p-5 text-center space-y-2">
              <h3 className="text-sm font-serif font-bold text-foreground flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Ecological Stewardship Dashboard
              </h3>
              <p className="text-xs text-muted-foreground">
                Governance status: <Badge variant="outline" className="text-[10px] ml-1">{region.governance_status}</Badge>
              </p>
              <p className="text-[10px] text-muted-foreground/60 italic">
                Coming soon — bio-regional stewardship metrics, delegation, and ecological governance tools.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* ═══════ NAVIGATION ═══════ */}
        <section className="px-4 max-w-3xl mx-auto mb-6">
          <Card className="border-primary/15 bg-card/50">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-serif font-bold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Navigation Layers
              </h3>
              <p className="text-[10px] text-muted-foreground mb-2">
                Bio-Regions are ecological systems — they can span, nest within, or overlap countries.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/atlas/bio-regions"><Layers className="w-3.5 h-3.5 mr-1" /> All Bio-Regions</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/atlas"><Globe className="w-3.5 h-3.5 mr-1" /> Country Atlas</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/hives"><Compass className="w-3.5 h-3.5 mr-1" /> Species Hives</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <BottomNav />
    </PageShell>
  );
};

export default BioRegionPage;
