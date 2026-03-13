import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMapFocus } from "@/hooks/use-map-focus";
import { supabase } from "@/integrations/supabase/client";
import { useCountrySpeciesActivity } from "@/hooks/useCountrySpeciesActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  MapPin, ExternalLink, Scroll, TreeDeciduous, Eye, Compass, Heart,
  BookOpen, ChevronRight, Map as MapIcon, Footprints, Shield, BarChart3, Lock, Sparkles,
  Layers, ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import Header from "@/components/Header";

import { SLUG_MAP } from "@/config/countryRegistry";
import { getCitiesByCountry } from "@/config/cityRegistry";
import { getSubRegionsByCountry, getSubRegionLabel } from "@/config/subRegionRegistry";
import AtlasBreadcrumb from "@/components/AtlasBreadcrumb";
import VerificationPipeline from "@/components/VerificationPipeline";
import ImmutableTreeCard from "@/components/ImmutableTreeCard";
import PlaceMapPreview from "@/components/atlas/PlaceMapPreview";
import { getRootstonesByCountrySlug, type Rootstone } from "@/data/rootstones";
import { buildRootstoneMapUrl } from "@/utils/map-link";
import { goToTreeOnMap } from "@/utils/mapNavigation";

const HexConstellationMap = lazy(() => import("@/components/atlas/HexConstellationMap"));

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
  immutable_record_id: string | null;
  immutable_anchor_reference: string | null;
  metadata_hash: string | null;
  anchored_at: string | null;
  verified_by: string | null;
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

/* ─── Species Row ─── */
const SpeciesRow = ({ species, common, count, maxCount, onMapClick }: {
  species: string; common: string | null; count: number; maxCount: number; onMapClick: () => void;
}) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-serif text-foreground truncate">{common || species}</p>
      {common && <p className="text-xs text-muted-foreground italic truncate">{species}</p>}
    </div>
    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden shrink-0">
      <div
        className="h-full bg-primary/70 rounded-full transition-all duration-500"
        style={{ width: `${(count / maxCount) * 100}%` }}
      />
    </div>
    <span className="text-xs font-medium text-muted-foreground w-6 text-right">{count}</span>
    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onMapClick} title="View on map">
      <MapIcon className="w-3.5 h-3.5" />
    </Button>
  </div>
);

/* ─── Province Chip ─── */
const ProvinceChip = ({ name, count, active, onClick }: {
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

/* ─── Pilgrimage Preset ─── */
const PILGRIMAGE_PRESETS = [
  { key: "first-steps", label: "First Steps", icon: Footprints, desc: "5–8 well-documented trees to begin your journey" },
  { key: "great-elders", label: "Great Elders", icon: TreeDeciduous, desc: "The tallest and most storied champions" },
  { key: "by-province", label: "By Province", icon: MapPin, desc: "Explore a local pilgrimage near you" },
  { key: "verified", label: "Verified Bloom Trail", icon: Heart, desc: "Trees already verified by wanderers" },
] as const;

/* ─── Research Card ─── */
const ResearchTreeCard = ({
  tree,
  onNavigate,
  onVerify,
}: {
  tree: ResearchTree;
  onNavigate: (t: ResearchTree) => void;
  onVerify: (t: ResearchTree) => void;
}) => {
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
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: precColor }}
              title={`Precision: ${tree.geo_precision}`}
            />
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {tree.geo_precision}
            </Badge>
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

        <div className="flex items-center justify-between pt-1">
          <a
            href={tree.source_doc_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
          >
            <Scroll className="w-3 h-3" />
            {tree.source_doc_title.length > 25 ? tree.source_doc_title.slice(0, 22) + "…" : tree.source_doc_title} {tree.source_doc_year}
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <div className="flex gap-1.5">
            {tree.latitude != null && tree.longitude != null && (
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => onNavigate(tree)}>
                <MapIcon className="w-3 h-3 mr-1" /> Map
              </Button>
            )}
            {tree.latitude != null && tree.longitude != null && (
              <Button variant="sacred" size="sm" className="h-7 text-xs px-2" onClick={() => onVerify(tree)}>
                <Eye className="w-3 h-3 mr-1" /> Verify
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const RootstoneCard = ({ rootstone, onOpenMap }: { rootstone: Rootstone; onOpenMap: (stone: Rootstone) => void }) => (
  <Card className="border-primary/10 hover:border-primary/30 transition-all">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-serif text-foreground">{rootstone.name}</p>
          <p className="text-xs text-muted-foreground">{rootstone.region || rootstone.location.place}</p>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase">{rootstone.confidence}</Badge>
      </div>
      <p className="text-xs text-muted-foreground whitespace-pre-line">{rootstone.lore}</p>
      <div className="flex flex-wrap gap-1">
        {rootstone.tags.slice(0, 4).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => onOpenMap(rootstone)}>
          <MapIcon className="w-3 h-3 mr-1" /> Open on Map
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs px-2" asChild>
          <a href={rootstone.source.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3 h-3 mr-1" /> Source
          </a>
        </Button>
      </div>
    </CardContent>
  </Card>
);

/* ─── Main Page ─── */
const CountryPortalPage = () => {
  const { countrySlug } = useParams<{ countrySlug: string }>();
  const navigate = useNavigate();
  const entry = SLUG_MAP[countrySlug || ""];

  const config = entry ? {
    country: entry.country,
    countryFlag: entry.flag,
    title: entry.portalTitle,
    subtitle: entry.portalSubtitle,
    sourceLabel: entry.sourceLabel,
    isoCode: entry.isoCode,
    defaultMapFocus: entry.defaultMapFocus,
    defaultFilters: entry.defaultFilters,
    keySources: entry.keySources || [],
  } : {
    country: "",
    countryFlag: "",
    title: "",
    subtitle: "",
    sourceLabel: "",
    isoCode: undefined,
    defaultMapFocus: undefined,
    defaultFilters: undefined,
    keySources: [],
  };

  const [trees, setTrees] = useState<ResearchTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [pilgrimagePreset, setPilgrimagePreset] = useState<string>("first-steps");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [selectedSpiralSpecies, setSelectedSpiralSpecies] = useState<string | null>(null);
  const [researchLayerEnabled, setResearchLayerEnabled] = useState(
    config.defaultFilters?.researchLayer !== "off",
  );
  const [overlappingBioRegions, setOverlappingBioRegions] = useState<Array<{ id: string; name: string; type: string }>>([]);

  // Species activity for the spiral
  const { data: speciesActivity, isLoading: speciesLoading } = useCountrySpeciesActivity(config.country);
  const countryRootstones = useMemo(
    () => getRootstonesByCountrySlug(countrySlug || ""),
    [countrySlug],
  );

  useEffect(() => {
    setResearchLayerEnabled(config.defaultFilters?.researchLayer !== "off");
  }, [config.defaultFilters?.researchLayer]);

  useEffect(() => {
    if (!entry) return;
    const fetchTrees = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("research_trees")
        .select("*")
        .eq("country", config.country)
        .order("species_scientific");
      if (!error && data) setTrees(data as ResearchTree[]);
      setLoading(false);
    };
    fetchTrees();

    // Fetch overlapping bio-regions for this country
    const fetchBioRegions = async () => {
      const { data } = await supabase
        .from("bio_regions")
        .select("id, name, type, countries")
        .order("name");
      if (data) {
        const matching = (data as Array<{ id: string; name: string; type: string; countries: string[] }>)
          .filter(br => br.countries.includes(config.country));
        setOverlappingBioRegions(matching);
      }
    };
    fetchBioRegions();
  }, [config.country, entry]);

  /* ─── Computed stats ─── */
  const filteredTrees = useMemo(() => {
    if (!selectedProvince) return trees;
    return trees.filter(t => t.province === selectedProvince);
  }, [trees, selectedProvince]);

  const totalCount = trees.length;
  const speciesCount = new Set(trees.map(t => t.species_scientific)).size;
  const withCoords = trees.filter(t => t.latitude != null).length;
  const verifiedCount = trees.filter(t => t.status === "verified_linked").length;
  const precisionCounts = useMemo(() => {
    const c = { exact: 0, approx: 0, unknown: 0 };
    trees.forEach(t => { c[t.geo_precision as keyof typeof c] = (c[t.geo_precision as keyof typeof c] || 0) + 1; });
    return c;
  }, [trees]);

  /* Species ranking */
  const speciesRanking = useMemo(() => {
    const map = new Map<string, { scientific: string; common: string | null; count: number }>();
    filteredTrees.forEach(t => {
      const key = t.species_scientific;
      const existing = map.get(key);
      if (existing) { existing.count++; }
      else { map.set(key, { scientific: key, common: t.species_common, count: 1 }); }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredTrees]);

  /* Province counts */
  const provinceCounts = useMemo(() => {
    const map = new Map<string, number>();
    trees.forEach(t => {
      const p = t.province || "Unknown";
      map.set(p, (map.get(p) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [trees]);

  /* Pilgrimage generator */
  const pilgrimageList = useMemo(() => {
    let pool = [...filteredTrees];
    switch (pilgrimagePreset) {
      case "first-steps":
        pool = pool
          .filter(t => t.geo_precision !== "unknown" && (t.description || t.tree_name))
          .slice(0, 8);
        break;
      case "great-elders":
        pool = pool
          .filter(t => t.height_m || t.size_index || (t.description && /largest|oldest|tallest|giant/i.test(t.description)))
          .sort((a, b) => (b.height_m || b.size_index || 0) - (a.height_m || a.size_index || 0))
          .slice(0, 10);
        break;
      case "by-province":
        if (selectedProvince) pool = pool.filter(t => t.province === selectedProvince);
        pool = pool.slice(0, 12);
        break;
      case "verified":
        pool = pool.filter(t => t.status === "verified_linked");
        break;
      default:
        pool = pool.slice(0, 10);
    }
    return pool;
  }, [filteredTrees, pilgrimagePreset, selectedProvince]);

  /* Citations */
  const citations = useMemo(() => {
    const map = new Map<string, { title: string; url: string; year: number }>();
    trees.forEach(t => {
      if (!map.has(t.source_doc_url)) {
        map.set(t.source_doc_url, { title: t.source_doc_title, url: t.source_doc_url, year: t.source_doc_year });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.year - b.year);
  }, [trees]);

  const { focusMap } = useMapFocus();

  // Not-found guard — placed after all hooks
  if (!entry) {
    return (
      <PageShell>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 pb-24 pt-16">
          <p className="text-lg font-serif text-foreground">Country not found</p>
          <p className="text-sm text-muted-foreground">No atlas entry for "{countrySlug}"</p>
          <Button variant="sacred" asChild>
            <Link to="/atlas">← Back to World Atlas</Link>
          </Button>
        </div>
        <BottomNav />
      </PageShell>
    );
  }

  const handleMapNavigate = (tree: ResearchTree) => {
    if (tree.latitude != null && tree.longitude != null) {
      goToTreeOnMap(navigate, {
        treeId: tree.id || `${tree.latitude}-${tree.longitude}`,
        lat: tree.latitude,
        lng: tree.longitude,
        zoom: 15,
        countrySlug: countrySlug || undefined,
        source: "tree",
        researchLayer: researchLayerEnabled ? "on" : "off",
      });
    }
  };

  const handleVerifyTree = (tree: ResearchTree) => {
    if (tree.latitude == null || tree.longitude == null) return;
    goToTreeOnMap(navigate, {
      treeId: tree.id || `${tree.latitude}-${tree.longitude}`,
      lat: tree.latitude,
      lng: tree.longitude,
      zoom: 16,
      countrySlug: countrySlug || undefined,
      source: "tree",
      researchLayer: researchLayerEnabled ? "on" : "off",
    });
  };

  const openMapLayer = () =>
    focusMap({
      type: "area",
      id: countrySlug || "",
      countrySlug,
      source: "country",
      center: config.defaultMapFocus?.center,
      zoom: config.defaultMapFocus?.zoom,
      tags: config.defaultFilters?.tags,
      researchLayer: researchLayerEnabled ? "on" : "off",
    });

  const openRootstoneOnMap = (stone: Rootstone) => {
    navigate(
      buildRootstoneMapUrl(stone, {
        countrySlug: (countrySlug || "").toLowerCase(),
        researchLayer: researchLayerEnabled ? "on" : "off",
      }),
    );
  };

  return (
    <PageShell>
      <Header />
      <div className="min-h-screen pb-24 pt-16">
        {/* ─── A) Hero ─── */}
        <section className="relative px-4 pt-12 pb-8 text-center">
          {/* Breadcrumb */}
          <div className="max-w-3xl mx-auto mb-4 flex justify-center">
            <AtlasBreadcrumb segments={[{ label: `${config.countryFlag} ${config.country}` }]} />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <p className="text-3xl mb-2">{config.countryFlag}</p>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
              {config.title}
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-4 italic">
              {config.subtitle}
            </p>

            {/* Badge row */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <Badge variant="outline" className="text-xs border-primary/30">
                <Scroll className="w-3 h-3 mr-1" /> Research Layer
              </Badge>
              <Badge variant="outline" className="text-xs border-primary/30">
                <BookOpen className="w-3 h-3 mr-1" /> {config.sourceLabel}
              </Badge>
              {config.isoCode && (
                <Badge variant="outline" className="text-xs border-primary/30">
                  ISO: {config.isoCode}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs border-primary/30">
                <Shield className="w-3 h-3 mr-1" /> Provenance preserved
              </Badge>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="mystical" onClick={openMapLayer}>
                <MapIcon className="w-4 h-4 mr-1" /> Explore the Map
              </Button>
              <Button
                variant="outline"
                onClick={() => setResearchLayerEnabled((current) => !current)}
                title="Toggle research layer visibility on map launch"
              >
                <Layers className="w-4 h-4 mr-1" /> Research Layer: {researchLayerEnabled ? "On" : "Off"}
              </Button>
              <Button
                variant="sacred"
                onClick={() => { setActiveTab("pilgrimages"); window.scrollTo({ top: 400, behavior: "smooth" }); }}
              >
                <Footprints className="w-4 h-4 mr-1" /> Start a Pilgrimage
              </Button>
            </div>
          </motion.div>
        </section>

        {/* ─── Sub-region Portals (registry-driven) — moved up ─── */}
        {(() => {
          const regions = getSubRegionsByCountry(countrySlug || "");
          if (!regions.length) return null;
          const label = getSubRegionLabel(countrySlug || "");
          return (
            <section className="px-4 max-w-3xl mx-auto mb-8">
              <h2 className="text-lg font-serif font-bold text-foreground mb-3 flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary" /> Explore {label}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {regions.map(region => (
                  <Card key={region.slug} className="border-primary/15 hover:border-primary/30 transition-all cursor-pointer" onClick={() => navigate(`/atlas/${countrySlug}/${region.slug}`)}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-serif font-bold text-foreground">{region.icon} {region.name}</p>
                        <p className="text-xs text-muted-foreground italic">{region.tagline}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })()}

        {/* ─── City Portals — moved up ─── */}
        {(() => {
          const cities = getCitiesByCountry(countrySlug || "");
          if (!cities.length) return null;
          return (
            <section className="px-4 max-w-3xl mx-auto mb-8">
              <h2 className="text-lg font-serif font-bold text-foreground mb-3 flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary" /> Explore Cities
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cities.map(city => (
                  <Card key={city.slug} className="border-primary/15 hover:border-primary/30 transition-all cursor-pointer" onClick={() => navigate(`/atlas/${countrySlug}/${city.slug}`)}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-serif font-bold text-foreground">{city.name}</p>
                        <p className="text-xs text-muted-foreground italic">{city.tagline}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })()}

        {/* ─── Bio-Regions overlapping this Country ─── */}
        {overlappingBioRegions.length > 0 && (
          <section className="px-4 max-w-3xl mx-auto mb-8">
            <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-serif flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" /> Bio-Regions in {config.country}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  Ecological systems overlapping this country — mountains, watersheds, and forest biomes.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {overlappingBioRegions.map(br => (
                    <Link key={br.id} to={`/atlas/bio-regions/${br.id}`}>
                      <Card className="border-primary/10 hover:border-primary/30 transition-all cursor-pointer">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-primary" />
                            <div>
                              <p className="text-xs font-serif font-bold text-foreground">{br.name}</p>
                              <p className="text-[10px] text-muted-foreground">{br.type}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* ─── Key sources ─── */}
        {config.keySources.length > 0 && (
          <section className="px-4 max-w-3xl mx-auto mb-8">
            <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-serif flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" /> Key Sources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {config.keySources.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 inline mr-1" />
                    {source.label}
                  </a>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        {(countryRootstones.trees.length > 0 || countryRootstones.groves.length > 0) && (
          <section className="px-4 max-w-3xl mx-auto mb-8 space-y-4">
            {countryRootstones.trees.length > 0 && (
              <Card className="border-primary/15 bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-serif flex items-center gap-2">
                    <TreeDeciduous className="w-4 h-4 text-primary" /> 33 Trees
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {countryRootstones.trees.slice(0, 3).map((stone) => (
                    <RootstoneCard key={stone.id} rootstone={stone} onOpenMap={openRootstoneOnMap} />
                  ))}
                </CardContent>
              </Card>
            )}
            {countryRootstones.groves.length > 0 && (
              <Card className="border-primary/15 bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-serif flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" /> 33 Groves & Forests
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {countryRootstones.groves.slice(0, 3).map((stone) => (
                    <RootstoneCard key={stone.id} rootstone={stone} onOpenMap={openRootstoneOnMap} />
                  ))}
                </CardContent>
              </Card>
            )}
          </section>
        )}

        <section className="px-4 max-w-3xl mx-auto mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatTile label="Records" value={totalCount} icon={TreeDeciduous} />
            <StatTile label="Distinct Species" value={speciesCount} icon={BarChart3} />
            <StatTile label="With Coordinates" value={withCoords} icon={MapPin} />
            <StatTile label="Exact Precision" value={precisionCounts.exact} icon={Compass} />
            <StatTile label="Approx Precision" value={precisionCounts.approx} icon={Eye} />
            <StatTile label="Verified Linked" value={verifiedCount} icon={Heart} />
          </div>
        </section>

        {/* ─── Species Spiral + Map Preview ─── */}
        <section className="px-4 max-w-5xl mx-auto mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
              <CardContent className="py-6">
                <Suspense fallback={
                  <div className="py-12 text-center">
                    <p className="text-sm text-muted-foreground font-serif">Mapping the constellation…</p>
                  </div>
                }>
                  <HexConstellationMap
                    species={speciesActivity || []}
                    country={config.country}
                    countrySlug={countrySlug || ""}
                    loading={speciesLoading}
                    onSpeciesSelect={setSelectedSpiralSpecies}
                  />
                </Suspense>
              </CardContent>
            </Card>

            <PlaceMapPreview
              placeType="country"
              placeCode={countrySlug || ""}
              countrySlug={countrySlug || ""}
              bbox={entry.bbox}
              center={config.defaultMapFocus?.center}
              defaultFilters={config.defaultFilters}
              highlightedSpecies={selectedSpiralSpecies}
            />
          </div>
        </section>

        {/* ─── Province filter chips ─── */}
        <section className="px-4 max-w-3xl mx-auto mb-6">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              <ProvinceChip
                name={`All ${getSubRegionLabel(countrySlug || "")}`}
                count={totalCount}
                active={!selectedProvince}
                onClick={() => setSelectedProvince(null)}
              />
              {provinceCounts.map(([prov, cnt]) => (
                <ProvinceChip
                  key={prov}
                  name={prov}
                  count={cnt}
                  active={selectedProvince === prov}
                  onClick={() => setSelectedProvince(selectedProvince === prov ? null : prov)}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>

        {/* ─── Tabs: Overview / Species / Pilgrimages ─── */}
        <section className="px-4 max-w-3xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-card/50 border border-primary/20 mb-4">
              <TabsTrigger value="overview">All Trees</TabsTrigger>
              <TabsTrigger value="immutable" className="gap-1">
                <Lock className="w-3 h-3" /> Immutable
              </TabsTrigger>
              <TabsTrigger value="species">Species</TabsTrigger>
              <TabsTrigger value="pilgrimages">Pilgrimages</TabsTrigger>
            </TabsList>

            {/* ─── All Trees ─── */}
            <TabsContent value="overview">
              {loading ? (
                <p className="text-center py-12 text-muted-foreground">Loading research records…</p>
              ) : filteredTrees.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">No records found for this filter.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredTrees.map(tree => (
                    <div key={tree.id} onClick={() => setSelectedTreeId(selectedTreeId === tree.id ? null : tree.id)} className="cursor-pointer">
                      <ResearchTreeCard tree={tree} onNavigate={handleMapNavigate} onVerify={handleVerifyTree} />
                      {selectedTreeId === tree.id && (
                        <div className="mt-2">
                          <VerificationPipeline
                            tree={{ ...tree, record_status: (tree as any).record_status || "research", verification_score: (tree as any).verification_score || 0 }}
                            onStatusChange={(newStatus) => {
                              setTrees(prev => prev.map(t => t.id === tree.id ? { ...t, record_status: newStatus } as any : t));
                              setSelectedTreeId(null);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ─── Immutable Ancient Friends ─── */}
            <TabsContent value="immutable">
              {(() => {
                const immutableTrees = trees.filter(t => (t as any).record_status === "immutable");
                if (loading) return <p className="text-center py-12 text-muted-foreground">Loading…</p>;
                if (immutableTrees.length === 0) return (
                  <Card className="border-[hsl(42_80%_50%/0.2)] bg-[hsl(42_30%_12%/0.3)]">
                    <CardContent className="py-12 text-center space-y-3">
                      <Sparkles className="w-8 h-8 text-[hsl(42_80%_55%)] mx-auto opacity-60" />
                      <p className="text-sm font-serif text-[hsl(42_80%_55%)]">No Immutable Ancient Friends yet</p>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Research trees become Immutable after verification and anchoring. Browse the "All Trees" tab to begin the pipeline.
                      </p>
                    </CardContent>
                  </Card>
                );
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {immutableTrees.map(tree => (
                      <ImmutableTreeCard key={tree.id} tree={tree as any} onMapNavigate={() => handleMapNavigate(tree)} />
                    ))}
                  </div>
                );
              })()}
            </TabsContent>

            {/* ─── D) Species Index ─── */}
            <TabsContent value="species">
              <Card className="border-primary/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-serif">Top Species by Count</CardTitle>
                </CardHeader>
                <CardContent>
                  {speciesRanking.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No species data available.</p>
                  ) : (
                    speciesRanking.slice(0, 12).map(s => (
                      <SpeciesRow
                        key={s.scientific}
                        species={s.scientific}
                        common={s.common}
                        count={s.count}
                        maxCount={speciesRanking[0].count}
                        onMapClick={() => focusMap({ type: "area", id: s.scientific, countrySlug, source: "country" })}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── F) Pilgrimages ─── */}
            <TabsContent value="pilgrimages">
              <div className="space-y-4">
                {/* Preset selector */}
                <ScrollArea className="w-full">
                  <div className="flex gap-2 pb-2">
                    {PILGRIMAGE_PRESETS.map(p => (
                      <button
                        key={p.key}
                        onClick={() => setPilgrimagePreset(p.key)}
                        className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-all ${
                          pilgrimagePreset === p.key
                            ? "bg-primary/15 border-primary/40 text-foreground"
                            : "bg-card/50 border-border/30 text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        <p.icon className="w-3.5 h-3.5" />
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>

                <p className="text-xs text-muted-foreground italic">
                  {PILGRIMAGE_PRESETS.find(p => p.key === pilgrimagePreset)?.desc}
                </p>

                {pilgrimageList.length === 0 ? (
                  <Card className="border-primary/10">
                    <CardContent className="py-8 text-center text-muted-foreground text-sm">
                      {pilgrimagePreset === "verified"
                        ? "No verified trees yet. Be the first wanderer to verify one!"
                        : "No trees match this quest. Try a different province or preset."
                      }
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pilgrimageList.map(tree => (
                      <ResearchTreeCard key={tree.id} tree={tree} onNavigate={handleMapNavigate} onVerify={handleVerifyTree} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* ─── Lineage & Provenance — moved to bottom ─── */}
        {entry.isCommunitySeeded ? (
          <section className="px-4 max-w-3xl mx-auto mt-10 mb-6">
            <Card className="border-primary/15 bg-primary/5 backdrop-blur-sm">
              <CardContent className="py-5 px-5 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-serif text-foreground mb-1">Community Grove</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {entry.provenanceText || "These seeds were planted by the S33D community. Walk among them and help them grow."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        ) : citations.length > 0 ? (
          <section className="px-4 max-w-3xl mx-auto mt-10 mb-6">
            <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-serif flex items-center gap-2">
                  <Scroll className="w-4 h-4 text-primary" /> Lineage & Provenance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  These entries are sourced from {config.sourceLabel.toLowerCase()}. Locations may be approximate until verified
                  by a wanderer in person. Source data is immutable — your notes and verifications live separately.
                </p>
                <div className="flex flex-wrap gap-2">
                  {citations.map((c, i) => (
                    <a
                      key={i}
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/60 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {c.title.length > 40 ? c.title.slice(0, 37) + "…" : c.title} ({c.year})
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        ) : null}

        {/* ─── H) Footer Bridge ─── */}
        <section className="px-4 max-w-3xl mx-auto mt-12">
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/library/resources">
                <BookOpen className="w-3.5 h-3.5 mr-1" /> Tree Resources
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/map">
                <MapIcon className="w-3.5 h-3.5 mr-1" /> Ancient Friends Map
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/library">
                <TreeDeciduous className="w-3.5 h-3.5 mr-1" /> Heartwood Library
              </Link>
            </Button>
          </div>
        </section>
      </div>
      <BottomNav />
    </PageShell>
  );
};

export default CountryPortalPage;
