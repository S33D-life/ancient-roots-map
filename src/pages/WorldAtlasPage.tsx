import { useState, useEffect, useMemo, useRef, lazy, Suspense, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Globe, TreeDeciduous, MapPin, Eye, Shield, Scroll, Footprints,
  ChevronRight, ChevronDown, Heart, BookOpen, ExternalLink, Sparkles, Compass,
  Leaf, Users, Search, X, Map as MapIcon, LayoutGrid, MapPinned,
  Columns, Filter, Network, Earth,
} from "lucide-react";
import { useMapFocus } from "@/hooks/use-map-focus";
import { motion, AnimatePresence } from "framer-motion";
import PageShell from "@/components/PageShell";
import Header from "@/components/Header";
import ContextualWhisper from "@/components/ContextualWhisper";
import Footer from "@/components/Footer";
import COUNTRY_REGISTRY, { getEntryByCountry } from "@/config/countryRegistry";
import { DATASET_CONFIGS, getDatasetsByCountry, type DatasetConfig } from "@/config/datasetIntegration";

import AtlasPerspectiveNav from "@/components/atlas/AtlasPerspectiveNav";

const GlobalForestAtlasMap = lazy(() => import("@/components/atlas/GlobalForestAtlasMap"));
const AtlasDiscoveryPanel = lazy(() => import("@/components/atlas/AtlasDiscoveryPanel"));

/* ─── Types ─── */
interface CountryStats {
  country: string;
  slug: string;
  flag: string;
  descriptor: string;
  treeCount: number;
  verifiedCount: number;
  sourceCount: number;
  status: "active" | "growing" | "proposed";
  groveCount: number;
  dominantSpecies?: string;
  datasets: DatasetConfig[];
  pulseLevel?: "quiet" | "stirring" | "growing" | "vibrant" | "forest_awakened";
  portalSubtitle?: string;
}

type ViewMode = "cards" | "hybrid" | "map";

/* ─── Pulse label & color helpers (import from shared utils) ─── */
import { PULSE_LABELS as SHARED_PULSE_LABELS, PULSE_COLORS as SHARED_PULSE_COLORS } from "@/utils/forestPulse";

const PULSE_LABELS: Record<string, string> = {
  ...SHARED_PULSE_LABELS,
  forest_awakened: "Awakened",
};

const PULSE_COLORS: Record<string, string> = {
  quiet: "text-muted-foreground border-border/40",
  stirring: "text-amber-500/80 border-amber-400/20",
  growing: "text-emerald-500 border-emerald-400/30",
  vibrant: "text-primary border-primary/30",
  forest_awakened: "text-amber-400 border-amber-400/40",
};

const PULSE_GLOW: Record<string, string> = {
  quiet: "",
  stirring: "",
  growing: "shadow-[0_0_8px_hsl(var(--primary)/0.08)]",
  vibrant: "shadow-[0_0_14px_hsl(var(--primary)/0.12)]",
  forest_awakened: "shadow-[0_0_20px_hsl(142,40%,50%,0.15)]",
};

/* ─── Pilgrimage pathways ─── */
const PATHWAYS = [
  { slug: "champion-trees", title: "Champion Trees of the World", desc: "Officially designated trees of exceptional size, age, or significance.", icon: TreeDeciduous },
  { slug: "oldest-living", title: "Oldest Living Trees", desc: "Ancient witnesses — estimated at hundreds or thousands of years.", icon: Sparkles },
  { slug: "sacred-cultural", title: "Sacred & Cultural Trees", desc: "Trees woven into spiritual practice, folklore, and community memory.", icon: Heart },
  { slug: "by-species", title: "By Species Lineage", desc: "Follow a single species across continents.", icon: Leaf },
  { slug: "verified", title: "Verified by Footsteps", desc: "Trees visited and confirmed by wanderers.", icon: Footprints },
];

/* ─── Process steps ─── */
const BLOOM_STEPS = [
  { num: "01", title: "Source", text: "A country's notable trees are gathered from authoritative registers." },
  { num: "02", title: "Research Layer", text: "Trees appear as research records, with citations and uncertainty preserved." },
  { num: "03", title: "Living Verification", text: "Wanderers visit, listen, document, and verify through presence." },
  { num: "04", title: "Community Stewardship", text: "Stories, offerings, and care accumulate around each tree." },
];

/* ─── Globe animation ─── */
const GlobeDots = () => {
  const dots = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i, cx: 20 + Math.random() * 60, cy: 15 + Math.random() * 70,
      r: 1 + Math.random() * 1.5, delay: Math.random() * 4, active: i < 4,
    })), []);

  return (
    <svg viewBox="0 0 100 100" className="w-32 h-32 md:w-44 md:h-44 mx-auto opacity-60">
      <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary) / 0.15)" strokeWidth="0.5" />
      <ellipse cx="50" cy="50" rx="28" ry="42" fill="none" stroke="hsl(var(--primary) / 0.08)" strokeWidth="0.4" />
      <ellipse cx="50" cy="50" rx="42" ry="20" fill="none" stroke="hsl(var(--primary) / 0.08)" strokeWidth="0.4" />
      {dots.map(d => (
        <motion.circle key={d.id} cx={d.cx} cy={d.cy} r={d.r}
          fill={d.active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)"}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: d.active ? [0.4, 1, 0.4] : 0.3 }}
          transition={d.active ? { duration: 3, repeat: Infinity, delay: d.delay } : {}}
        />
      ))}
    </svg>
  );
};

/* ─── Enhanced Country Card ─── */
const CountryCard = ({ stat, isPioneer }: { stat: CountryStats; isPioneer?: boolean }) => {
  const { focusMap } = useMapFocus();
  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/12 text-emerald-500 border-emerald-500/25",
    growing: "bg-amber-500/12 text-amber-500 border-amber-500/25",
    proposed: "bg-muted text-muted-foreground border-border/30",
  };

  const handleViewOnMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    focusMap({ type: "area", id: stat.slug, countrySlug: stat.slug, source: "country" });
  };

  const pulseGlow = stat.pulseLevel ? PULSE_GLOW[stat.pulseLevel] : "";
  const circles = stat.datasets.flatMap(d => d.circles || []).slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border-primary/8 hover:border-primary/25 transition-all group ${isPioneer ? "ring-1 ring-primary/15" : ""} ${pulseGlow}`}>
        <CardContent className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl shrink-0">{stat.flag}</span>
              <div className="min-w-0">
                <p className="text-sm font-serif font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {stat.country}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{stat.descriptor}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {stat.pulseLevel && stat.pulseLevel !== "quiet" && (
                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${PULSE_COLORS[stat.pulseLevel]}`}>
                  {PULSE_LABELS[stat.pulseLevel]}
                </Badge>
              )}
              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${statusColors[stat.status]}`}>
                {stat.status}
              </Badge>
            </div>
          </div>

          {/* Region story (subtitle) */}
          {stat.portalSubtitle && (
            <p className="text-[11px] text-muted-foreground/70 italic font-serif leading-snug line-clamp-2">
              {stat.portalSubtitle}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <TreeDeciduous className="w-3 h-3 text-primary/50" /> {stat.treeCount} records
            </span>
            <span className="flex items-center gap-1">
              <Scroll className="w-3 h-3 text-primary/50" /> {stat.sourceCount} {stat.sourceCount === 1 ? "source" : "sources"}
            </span>
            {stat.verifiedCount > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-primary/50" /> {stat.verifiedCount} verified
              </span>
            )}
            {stat.groveCount > 0 && (
              <span className="flex items-center gap-1">
                <Network className="w-3 h-3 text-emerald-500/60" /> {stat.groveCount} grove{stat.groveCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Circles (thematic clusters) */}
          {circles.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {circles.map(c => (
                <TooltipProvider key={c.key} delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-muted/40 text-[9px] text-muted-foreground cursor-default hover:bg-primary/8 transition-colors">
                        <span>{c.icon}</span> {c.label}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[10px]">
                      {c.label} circle
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}

          {/* Dominant species */}
          {stat.dominantSpecies && (
            <p className="text-[10px] text-muted-foreground/60">
              🌿 Dominant: <span className="italic">{stat.dominantSpecies}</span>
            </p>
          )}

          {isPioneer && (
            <p className="text-[10px] text-primary/60 italic font-serif">✦ Pioneer Chapter</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {stat.status === "active" || stat.status === "growing" ? (
              <>
                <Button variant="sacred" size="sm" className="h-7 text-xs flex-1" asChild>
                  <Link to={`/atlas/${stat.slug}`}>
                    Explore <ChevronRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleViewOnMap} title="View on Map">
                  <MapIcon className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" disabled>
                Coming soon
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

/* ─── Mini Map Card (for hybrid view) ─── */
const MiniMapCard = ({ stat, onSelect, isSelected }: { stat: CountryStats; onSelect: () => void; isSelected: boolean }) => (
  <button
    onClick={onSelect}
    className={`w-full text-left p-2.5 rounded-lg border transition-all ${
      isSelected
        ? "border-primary/30 bg-primary/5"
        : "border-transparent hover:border-primary/15 hover:bg-card/60"
    }`}
  >
    <div className="flex items-center gap-2">
      <span className="text-lg">{stat.flag}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-serif font-medium text-foreground truncate">{stat.country}</p>
        <p className="text-[9px] text-muted-foreground">{stat.treeCount} records</p>
      </div>
      {stat.pulseLevel && stat.pulseLevel !== "quiet" && (
        <span className={`w-2 h-2 rounded-full shrink-0 ${
          stat.pulseLevel === "vibrant" || stat.pulseLevel === "forest_awakened"
            ? "bg-primary"
            : stat.pulseLevel === "growing"
            ? "bg-emerald-400"
            : "bg-amber-400"
        }`} />
      )}
    </div>
  </button>
);

/* ─── Filter types ─── */
type FilterType = "all" | "active" | "with-groves" | "pulse";

/* ─── Main Page ─── */
const WorldAtlasPage = () => {
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [treeResults, setTreeResults] = useState<{ id: string; name: string; species: string; country: string }[]>([]);
  const [treeSearching, setTreeSearching] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const { focusMap } = useMapFocus();

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch research tree stats
      const { data } = await supabase
        .from("research_trees")
        .select("country, status, source_program, species_common");

      const countryMap = new Map<string, {
        treeCount: number; verifiedCount: number; sources: Set<string>;
        speciesCounts: Map<string, number>;
      }>();
      (data || []).forEach((row: any) => {
        const c = row.country;
        if (!countryMap.has(c)) countryMap.set(c, { treeCount: 0, verifiedCount: 0, sources: new Set(), speciesCounts: new Map() });
        const entry = countryMap.get(c)!;
        entry.treeCount++;
        if (row.status === "verified_linked") entry.verifiedCount++;
        entry.sources.add(row.source_program);
        if (row.species_common) {
          entry.speciesCounts.set(row.species_common, (entry.speciesCounts.get(row.species_common) || 0) + 1);
        }
      });

      // Fetch grove counts by country
      const { data: groveData } = await supabase
        .from("groves")
        .select("country");
      const groveCountMap = new Map<string, number>();
      (groveData || []).forEach((g: any) => {
        if (g.country) groveCountMap.set(g.country, (groveCountMap.get(g.country) || 0) + 1);
      });

      const stats: CountryStats[] = [];

      // Active countries
      countryMap.forEach((val, country) => {
        const reg = getEntryByCountry(country);
        const slug = reg?.slug || country.toLowerCase().replace(/\s+/g, "-");
        const datasets = getDatasetsByCountry(slug);

        // Find dominant species
        let dominantSpecies: string | undefined;
        let maxCount = 0;
        val.speciesCounts.forEach((count, species) => {
          if (count > maxCount) { maxCount = count; dominantSpecies = species; }
        });

        // Compute simple pulse level from tree count + verified
        const velocity = val.verifiedCount + (groveCountMap.get(country) || 0) * 3;
        let pulseLevel: CountryStats["pulseLevel"] = "quiet";
        if (velocity >= 20) pulseLevel = "vibrant";
        else if (velocity >= 10) pulseLevel = "growing";
        else if (velocity >= 3) pulseLevel = "stirring";

        stats.push({
          country, slug,
          flag: reg?.flag || "🌍",
          descriptor: reg?.descriptor || "Notable Trees",
          treeCount: val.treeCount,
          verifiedCount: val.verifiedCount,
          sourceCount: val.sources.size,
          status: "active",
          groveCount: groveCountMap.get(country) || 0,
          dominantSpecies,
          datasets,
          pulseLevel,
          portalSubtitle: reg?.portalSubtitle || datasets[0]?.portalSubtitle,
        });
      });

      // Dedicated page slugs
      const DEDICATED_PAGE_SLUGS = new Set([
        "south-africa", "united-kingdom", "ireland", "australia", "new-zealand",
        "japan", "india", "united-states", "brazil", "zimbabwe", "italy",
        "colombia", "greece", "canada", "china", "russia", "france",
        "nigeria", "kenya", "ethiopia", "tanzania", "dr-congo",
        "costa-rica", "peru", "indonesia", "hong-kong", "singapore",
        "taiwan", "spain", "mexico",
      ]);

      // Proposed/growing countries
      COUNTRY_REGISTRY.forEach((reg) => {
        if (!countryMap.has(reg.country)) {
          const hasPage = DEDICATED_PAGE_SLUGS.has(reg.slug);
          const datasets = getDatasetsByCountry(reg.slug);
          stats.push({
            country: reg.country, slug: reg.slug, flag: reg.flag,
            descriptor: reg.descriptor,
            treeCount: 0, verifiedCount: 0, sourceCount: 0,
            status: hasPage ? "growing" : "proposed",
            groveCount: 0, datasets,
            portalSubtitle: reg.portalSubtitle || datasets[0]?.portalSubtitle,
          });
        }
      });

      stats.sort((a, b) => {
        if (a.status === "active" && b.status !== "active") return -1;
        if (b.status === "active" && a.status !== "active") return 1;
        if (a.status === "growing" && b.status === "proposed") return -1;
        if (b.status === "growing" && a.status === "proposed") return 1;
        return b.treeCount - a.treeCount;
      });

      setCountryStats(stats);
      setLoading(false);
    };
    fetchStats();
  }, []);

  const activeCount = countryStats.filter(c => c.status === "active").length;
  const totalRecords = countryStats.reduce((s, c) => s + c.treeCount, 0);
  const totalGroves = countryStats.reduce((s, c) => s + c.groveCount, 0);

  /* ─── Search logic ─── */
  const q = searchQuery.trim().toLowerCase();

  const filteredCountries = useMemo(() => {
    if (!q) return [];
    return countryStats.filter(
      c => c.country.toLowerCase().includes(q) || c.descriptor.toLowerCase().includes(q)
    );
  }, [q, countryStats]);

  const filteredPathways = useMemo(() => {
    if (!q) return [];
    return PATHWAYS.filter(p => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
  }, [q]);

  useEffect(() => {
    if (!q || q.length < 2) { setTreeResults([]); return; }
    setTreeSearching(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("research_trees")
        .select("id, tree_name, species_common, species_scientific, country")
        .or(`tree_name.ilike.%${q}%,species_common.ilike.%${q}%,species_scientific.ilike.%${q}%`)
        .limit(8);
      setTreeResults(
        (data || []).map(r => ({
          id: r.id, name: r.tree_name || r.species_common || r.species_scientific,
          species: r.species_scientific, country: r.country,
        }))
      );
      setTreeSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [q]);

  const hasResults = filteredCountries.length > 0 || filteredPathways.length > 0 || treeResults.length > 0;
  const showDropdown = q.length > 0;

  /* ─── Filtered stats ─── */
  const displayedStats = useMemo(() => {
    let result = countryStats;
    if (filter === "active") result = result.filter(c => c.status === "active");
    else if (filter === "with-groves") result = result.filter(c => c.groveCount > 0);
    else if (filter === "pulse") result = result.filter(c => c.pulseLevel && c.pulseLevel !== "quiet");
    return result;
  }, [countryStats, filter]);

  const selectedStat = selectedRegion ? countryStats.find(c => c.slug === selectedRegion) : null;

  return (
    <PageShell>
      <Header />
      <div className="min-h-screen pb-24" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 4.5rem)" }}>
        {/* ─── Perspective Nav ─── */}
        <section className="px-4 pt-6 pb-2 max-w-2xl mx-auto">
          <AtlasPerspectiveNav showDescriptions />
        </section>

        {/* ─── Hero (compressed for mobile) ─── */}
        <section className="relative px-4 pt-2 pb-3 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl mx-auto">
            <h1 className="text-xl md:text-3xl font-serif font-bold text-foreground mb-1">
              World Atlas of Notable Trees
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground max-w-sm mx-auto mb-3 leading-relaxed italic font-serif">
              Each country, a chapter. Each tree, a living witness.
            </p>

            {/* Summary stats — compact */}
            <div className="flex flex-wrap justify-center gap-3 mb-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-primary/60" /> {activeCount} countries</span>
              <span className="flex items-center gap-1"><TreeDeciduous className="w-3 h-3 text-primary/60" /> {totalRecords.toLocaleString()} records</span>
              {totalGroves > 0 && <span className="flex items-center gap-1"><Network className="w-3 h-3 text-emerald-500/60" /> {totalGroves} groves</span>}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="mystical" size="sm" asChild>
                <Link to="/map"><Globe className="w-3.5 h-3.5 mr-1" /> Open Map</Link>
              </Button>
              <Button variant="sacred" size="sm" onClick={() => document.getElementById("country-gateways")?.scrollIntoView({ behavior: "smooth" })}>
                <Compass className="w-3.5 h-3.5 mr-1" /> Browse Countries
              </Button>
            </div>
          </motion.div>
        </section>

        {/* ─── Search Bar ─── */}
        <section className="px-4 max-w-xl mx-auto mb-5 relative z-20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search countries, pathways, or trees…"
              className="pl-9 pr-8 bg-card/70 backdrop-blur border-primary/15 focus:border-primary/40 font-serif text-sm"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}

            {showDropdown && (
              <Card className="absolute top-full mt-1.5 left-0 right-0 border-primary/20 bg-card/95 backdrop-blur shadow-lg overflow-hidden z-30">
                <CardContent className="p-0 max-h-72 overflow-y-auto">
                  {!hasResults && !treeSearching && (
                    <p className="py-6 text-center text-xs text-muted-foreground italic">No results found</p>
                  )}
                  {filteredCountries.length > 0 && (
                    <div>
                      <p className="px-3 pt-2.5 pb-1 text-[10px] font-sans uppercase tracking-wider text-muted-foreground/60">Countries</p>
                      {filteredCountries.map(c => (
                        <Link key={c.country} to={(c.status !== "proposed") ? `/atlas/${c.slug}` : "#"}
                          onClick={() => setSearchQuery("")}
                          className="flex items-center gap-2.5 px-3 py-2 hover:bg-primary/5 transition-colors">
                          <span className="text-lg">{c.flag}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-serif text-foreground truncate">{c.country}</p>
                            <p className="text-[10px] text-muted-foreground">{c.treeCount} records · {c.status}</p>
                          </div>
                          {c.status !== "proposed" && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />}
                        </Link>
                      ))}
                    </div>
                  )}
                  {filteredPathways.length > 0 && (
                    <div>
                      <p className="px-3 pt-2.5 pb-1 text-[10px] font-sans uppercase tracking-wider text-muted-foreground/60">Pathways</p>
                      {filteredPathways.map(p => (
                        <Link key={p.slug} to={`/atlas/pathways/${p.slug}`} onClick={() => setSearchQuery("")}
                          className="flex items-center gap-2.5 px-3 py-2 hover:bg-primary/5 transition-colors">
                          <div className="p-1 rounded bg-primary/10"><p.icon className="w-3.5 h-3.5 text-primary" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-serif text-foreground truncate">{p.title}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{p.desc}</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}
                  {treeResults.length > 0 && (
                    <div>
                      <p className="px-3 pt-2.5 pb-1 text-[10px] font-sans uppercase tracking-wider text-muted-foreground/60">Trees</p>
                      {treeResults.map(t => (
                        <Link key={t.id} to={`/discovery?search=${encodeURIComponent(t.name)}`}
                          onClick={() => setSearchQuery("")}
                          className="flex items-center gap-2.5 px-3 py-2 hover:bg-primary/5 transition-colors">
                          <TreeDeciduous className="w-4 h-4 text-primary/60 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-serif text-foreground truncate">{t.name}</p>
                            <p className="text-[10px] text-muted-foreground italic truncate">{t.species} · {t.country}</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}
                  {treeSearching && <p className="py-3 text-center text-[10px] text-muted-foreground animate-pulse">Searching trees…</p>}
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Context panel moved below country list */}

        <ContextualWhisper id="atlas-search-hint" message="Use the search bar above to find any country, pathway, or tree by name." delay={4000} position="top-center" />

        {/* ─── View Toggle + Filters ─── */}
        <section id="country-gateways" className="px-4 max-w-4xl mx-auto mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h2 className="text-lg font-serif font-bold text-foreground">Country Chapters</h2>
              <p className="text-xs text-muted-foreground">
                {activeCount} active · {totalRecords.toLocaleString()} research records
                {totalGroves > 0 && ` · ${totalGroves} groves`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center bg-muted/30 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("map")}
                  className={`p-1.5 rounded-md transition-all ${viewMode === "map" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  title="Atlas Map"
                >
                  <Earth className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("cards")}
                  className={`p-1.5 rounded-md transition-all ${viewMode === "cards" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  title="Card View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("hybrid")}
                  className={`p-1.5 rounded-md transition-all ${viewMode === "hybrid" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  title="Hybrid View"
                >
                  <Columns className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <Filter className="w-3 h-3 text-muted-foreground/50 mr-1" />
            {([
              { key: "all", label: "All Regions" },
              { key: "active", label: "Active" },
              { key: "with-groves", label: "With Groves" },
              { key: "pulse", label: "Pulse Active" },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                  filter === f.key
                    ? "bg-primary/12 text-primary border border-primary/25"
                    : "bg-muted/25 text-muted-foreground border border-transparent hover:border-primary/15"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>

        {/* ─── Country Grid (Map, Cards, or Hybrid) ─── */}
        <section className="px-4 max-w-4xl mx-auto mb-12">
          {loading ? (
            <p className="text-center py-12 text-muted-foreground text-sm font-serif italic">Gathering chapters…</p>
          ) : displayedStats.length === 0 ? (
            <Card className="border-primary/10">
              <CardContent className="py-12 text-center">
                <Globe className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground italic font-serif">
                  {filter !== "all" ? "No regions match this filter." : "The atlas is quiet for now."}
                </p>
              </CardContent>
            </Card>
          ) : viewMode === "map" ? (
            <div className="space-y-6">
              <Suspense fallback={<div className="h-[400px] rounded-xl bg-muted/20 animate-pulse" />}>
                <GlobalForestAtlasMap countryStats={displayedStats} />
              </Suspense>
              <Suspense fallback={null}>
                <AtlasDiscoveryPanel stats={displayedStats} />
              </Suspense>
            </div>
          ) : viewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayedStats.map(stat => (
                <CountryCard key={stat.country} stat={stat}
                  isPioneer={stat.country === "South Africa" && stat.status === "active"} />
              ))}
            </div>
          ) : (
            /* Hybrid View: sidebar list + detail card */
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
              {/* Sidebar list */}
              <div className="bg-card/30 rounded-xl border border-border/20 p-2 max-h-[60vh] overflow-y-auto space-y-0.5">
                {displayedStats.map(stat => (
                  <MiniMapCard
                    key={stat.slug}
                    stat={stat}
                    isSelected={selectedRegion === stat.slug}
                    onSelect={() => {
                      setSelectedRegion(stat.slug);
                      if (stat.status !== "proposed") {
                        const reg = getEntryByCountry(stat.country);
                        if (reg?.defaultMapFocus) {
                          focusMap({ type: "area", id: stat.slug, countrySlug: stat.slug, source: "country" });
                        }
                      }
                    }}
                  />
                ))}
              </div>

              {/* Detail panel */}
              <div className="min-h-[40vh]">
                <AnimatePresence mode="wait">
                  {selectedStat ? (
                    <motion.div
                      key={selectedStat.slug}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CountryCard stat={selectedStat}
                        isPioneer={selectedStat.country === "South Africa" && selectedStat.status === "active"} />

                      {/* Region exploration paths */}
                      {(selectedStat.status === "active" || selectedStat.status === "growing") && (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            { label: "Explore Map", icon: MapPinned, to: "/map" },
                            { label: "View Atlas", icon: BookOpen, to: `/atlas/${selectedStat.slug}` },
                            { label: "View Groves", icon: Network, to: `/groves` },
                          ].map(action => (
                            <Link key={action.label} to={action.to}
                              className="flex items-center gap-1.5 p-2.5 rounded-lg border border-border/20 bg-card/40 hover:border-primary/20 hover:bg-primary/3 transition-all text-xs text-muted-foreground hover:text-foreground">
                              <action.icon className="w-3.5 h-3.5 text-primary/60" />
                              {action.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center h-full text-center"
                    >
                      <div>
                        <Compass className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground/50 font-serif italic">
                          Select a region to explore
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </section>

        <ContextualWhisper id="atlas-country-hint" message="Each country is a chapter. Tap one to explore its trees, sources, and stories." delay={10000} position="bottom-center" />

        {/* ─── Pilgrimage Pathways ─── */}
        <section className="px-4 max-w-3xl mx-auto mb-12">
          <h2 className="text-lg font-serif font-bold text-foreground mb-1">Paths through the Living World</h2>
          <p className="text-xs text-muted-foreground mb-4 italic">Global pathways — cross-country, cross-lineage, cross-time</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PATHWAYS.map(p => (
              <Link key={p.slug} to={`/atlas/pathways/${p.slug}`} className="block">
                <Card className="border-primary/8 hover:border-primary/20 transition-all group h-full">
                  <CardContent className="p-4 flex gap-3">
                    <div className="p-2 rounded-lg bg-primary/6 shrink-0 self-start">
                      <p.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-serif font-medium text-foreground mb-0.5 group-hover:text-primary transition-colors">{p.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary shrink-0 self-center transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <ContextualWhisper id="atlas-pathways-hint" message="Pathways cross borders — follow champion trees, sacred groves, or a single species across the world." delay={18000} position="bottom-left" />

        {/* ─── How a Country Blooms ─── */}
        <section id="how-it-grows" className="px-4 max-w-2xl mx-auto mb-12">
          <h2 className="text-lg font-serif font-bold text-foreground mb-1">How a Country Blooms</h2>
          <p className="text-xs text-muted-foreground mb-6 italic">From source document to living stewardship</p>
          <div className="space-y-4">
            {BLOOM_STEPS.map((step, i) => (
              <motion.div key={step.num} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.4 }} className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center">
                  <span className="text-[10px] font-mono text-primary">{step.num}</span>
                </div>
                <div className="pt-1">
                  <p className="text-sm font-serif font-medium text-foreground mb-0.5">{step.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── Propose ─── */}
        <section className="px-4 max-w-2xl mx-auto mb-12">
          <Card className="border-primary/12 bg-card/40 text-center">
            <CardContent className="py-8 space-y-3">
              <p className="text-sm font-serif text-muted-foreground italic">Not all chapters are written yet.</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                If you know of a national tree register or heritage list that should appear here, we'd love to hear about it.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Button variant="sacred" size="sm"><Scroll className="w-3.5 h-3.5 mr-1" /> Propose a Country</Button>
                <Button variant="ghost" size="sm"><ExternalLink className="w-3.5 h-3.5 mr-1" /> Contribute a Source</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─── Footer ─── */}
        <section className="px-4 max-w-2xl mx-auto text-center mb-8">
          <p className="text-sm font-serif text-muted-foreground/60 italic leading-relaxed mb-6">
            This atlas does not claim the world.<br />It listens to it.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link to="/tree-data-commons"><BookOpen className="w-3.5 h-3.5 mr-1" /> Tree Data Commons</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/map"><MapPin className="w-3.5 h-3.5 mr-1" /> Ancient Friends Map</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/groves"><TreeDeciduous className="w-3.5 h-3.5 mr-1" /> Groves</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/pulse"><Leaf className="w-3.5 h-3.5 mr-1" /> Forest Pulse</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/library/greenhouse"><Leaf className="w-3.5 h-3.5 mr-1" /> Greenhouse</Link></Button>
            <Button variant="ghost" size="sm" asChild><Link to="/council-of-life"><Users className="w-3.5 h-3.5 mr-1" /> Council of Life</Link></Button>
          </div>
        </section>
      </div>
      <Footer />
    </PageShell>
  );
};

export default WorldAtlasPage;
