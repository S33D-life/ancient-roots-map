import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  MapPin, ExternalLink, TreeDeciduous, Eye, Compass, Heart, Mountain,
  BookOpen, Map as MapIcon, Shield, Sparkles, Filter, Droplets, Thermometer,
  ArrowLeft, ArrowRight, Leaf, Navigation, MessageSquare, Plus, AlertTriangle,
  ChevronDown, Globe, Layers, Users,
} from "lucide-react";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import Header from "@/components/Header";
import AtlasBreadcrumb from "@/components/AtlasBreadcrumb";
import BottomNav from "@/components/BottomNav";

/* ━━━ Types ━━━ */
interface NotableTree {
  id: string;
  common_name: string;
  scientific_name: string;
  municipality: string;
  province: string;
  region: string;
  country: string;
  estimated_age_years: number | null;
  estimated_age_label: string | null;
  accessibility: string | null;
  relevance: string | null;
  locality: string | null;
  lat: number | null;
  lon: number | null;
  source_url: string | null;
}

/* ━━━ Hive mapping ━━━ */
const getHive = (species: string): { name: string; color: string; emoji: string; slug: string } => {
  const s = species.toLowerCase();
  if (s.includes("larix"))        return { name: "Larch",      color: "hsl(42 85% 55%)",  emoji: "🌲", slug: "larch" };
  if (s.includes("picea"))        return { name: "Spruce",     color: "hsl(150 50% 35%)", emoji: "🌲", slug: "spruce" };
  if (s.includes("pinus cembra")) return { name: "Stone Pine", color: "hsl(160 40% 40%)", emoji: "🌲", slug: "stone-pine" };
  if (s.includes("pinus"))        return { name: "Pine",       color: "hsl(160 40% 40%)", emoji: "🌲", slug: "pine" };
  if (s.includes("fagus"))        return { name: "Beech",      color: "hsl(100 45% 40%)", emoji: "🍂", slug: "beech" };
  if (s.includes("acer"))         return { name: "Maple",      color: "hsl(20 70% 50%)",  emoji: "🍁", slug: "maple" };
  if (s.includes("taxus"))        return { name: "Yew",        color: "hsl(140 60% 25%)", emoji: "🌿", slug: "yew" };
  if (s.includes("castanea"))     return { name: "Chestnut",   color: "hsl(30 60% 35%)",  emoji: "🌰", slug: "chestnut" };
  if (s.includes("quercus"))      return { name: "Oak",        color: "hsl(30 50% 40%)",  emoji: "🌳", slug: "oak" };
  if (s.includes("juglans"))      return { name: "Walnut",     color: "hsl(35 55% 35%)",  emoji: "🌳", slug: "walnut" };
  if (s.includes("sequoia"))      return { name: "Sequoia",    color: "hsl(15 60% 40%)",  emoji: "🌲", slug: "sequoia" };
  if (s.includes("abies"))        return { name: "Fir",        color: "hsl(155 45% 30%)", emoji: "🌲", slug: "fir" };
  if (s.includes("fraxinus"))     return { name: "Ash",        color: "hsl(80 35% 45%)",  emoji: "🌳", slug: "ash" };
  if (s.includes("cedrus"))       return { name: "Cedar",      color: "hsl(170 40% 35%)", emoji: "🌲", slug: "cedar" };
  if (s.includes("liriodendron")) return { name: "Tulip Tree", color: "hsl(50 60% 50%)",  emoji: "🌷", slug: "tulip-tree" };
  if (s.includes("ulmus"))        return { name: "Elm",        color: "hsl(90 40% 38%)",  emoji: "🌳", slug: "elm" };
  if (s.includes("prunus"))       return { name: "Cherry",     color: "hsl(340 50% 55%)", emoji: "🌸", slug: "cherry" };
  if (s.includes("pyrus"))        return { name: "Pear",       color: "hsl(60 50% 45%)",  emoji: "🍐", slug: "pear" };
  if (s.includes("morus"))        return { name: "Mulberry",   color: "hsl(280 30% 45%)", emoji: "🫐", slug: "mulberry" };
  return { name: "Mixed", color: "hsl(270 25% 55%)", emoji: "🌳", slug: "mixed" };
};

/* ━━━ Filters ━━━ */
type AgeBand = "all" | "0-150" | "150-300" | "300-600" | "600+";
const AGE_BANDS: { key: AgeBand; label: string; range: string }[] = [
  { key: "all", label: "All Ages", range: "All" },
  { key: "0-150", label: "Young", range: "0–150y" },
  { key: "150-300", label: "Mature", range: "150–300y" },
  { key: "300-600", label: "Ancient", range: "300–600y" },
  { key: "600+", label: "Primeval", range: "600y+" },
];

type ElevBand = "all" | "valley" | "montane" | "subalpine" | "alpine";
const ELEV_BANDS: { key: ElevBand; label: string; range: string }[] = [
  { key: "all", label: "All", range: "All" },
  { key: "valley", label: "Valley", range: "≤ 800m" },
  { key: "montane", label: "Montane", range: "800–1400m" },
  { key: "subalpine", label: "Subalpine", range: "1400–2000m" },
  { key: "alpine", label: "Alpine", range: "2000m+" },
];

const matchesAgeBand = (age: number | null, band: AgeBand): boolean => {
  if (band === "all") return true;
  if (age == null) return false;
  if (band === "0-150") return age <= 150;
  if (band === "150-300") return age > 150 && age <= 300;
  if (band === "300-600") return age > 300 && age <= 600;
  return age > 600;
};

/* ━━━ Groves ━━━ */
const GROVES = [
  { name: "Cortina Ancients", municipalities: ["Cortina d'Ampezzo"], emoji: "🏔️" },
  { name: "Zoldo Elders", municipalities: ["Val di Zoldo"], emoji: "🌲" },
  { name: "Cadore Belt", municipalities: ["Pieve di Cadore", "Calalzo di Cadore", "Valle di Cadore", "Domegge di Cadore", "Ospitale di Cadore", "Cibiana di Cadore", "Santo Stefano di Cadore", "Comelico Superiore"], emoji: "⛰️" },
  { name: "Longarone Oddities", municipalities: ["Longarone", "Belluno", "Quero Vas"], emoji: "🌿" },
];

/* ━━━ Ecology data ━━━ */
const ECOLOGY = {
  elevation: "300m – 3,200m",
  climate: "Alpine continental · Cold winters, cool summers",
  watersheds: ["Piave River basin", "Boite torrent", "Cordevole"],
  dominantSpecies: [
    { name: "Larix decidua", common: "European Larch", emoji: "🌲" },
    { name: "Picea abies", common: "Norway Spruce", emoji: "🌲" },
    { name: "Pinus cembra", common: "Swiss Stone Pine", emoji: "🌲" },
    { name: "Fagus sylvatica", common: "European Beech", emoji: "🍂" },
    { name: "Taxus baccata", common: "Common Yew", emoji: "🌿" },
  ],
  unescoNote: "Part of the UNESCO Dolomites World Heritage Site (serial property, 2009). Nine component systems protecting outstanding geological and landscape values.",
};

/* ━━━ Pinned GPS trees for the mini-map ━━━ */
const PINNED_TREES = [
  { name: "Larice – Località Noulù", species: "Larix decidua", municipality: "Cortina d'Ampezzo", age: "~255", lat: 46.5276, lon: 12.1315 },
  { name: "Larice (805 yrs)", species: "Larix decidua", municipality: "Val di Zoldo", age: "~805", lat: 46.3403, lon: 12.1462 },
  { name: "Castagno Balech", species: "Castanea sativa", municipality: "Quero Vas", age: "~605", lat: 45.9417, lon: 11.9948 },
  { name: "Tasso", species: "Taxus baccata", municipality: "Valle di Cadore", age: "~505", lat: 46.4198, lon: 12.3249 },
  { name: "Sequoia gigante", species: "Sequoiadendron giganteum", municipality: "Longarone", age: "~168", lat: 46.2661, lon: 12.3007 },
];

/* ━━━ Parallel bio-regions for navigation ━━━ */
const PARALLEL_BIOREGIONS = [
  { name: "Valais", country: "Switzerland", to: "/atlas/switzerland/valais", emoji: "🇨🇭" },
  { name: "Tyrol", country: "Austria", to: "/atlas/austria", emoji: "🇦🇹", coming: true },
  { name: "Bavaria", country: "Germany", to: "/atlas/germany", emoji: "🇩🇪", coming: true },
  { name: "Carpathians", country: "Romania", to: "/atlas/romania", emoji: "🇷🇴", coming: true },
];

/* ━━━ Hive links ━━━ */
const HIVE_LINKS = [
  { name: "Larch Hive", slug: "larch", emoji: "🌲", color: "hsl(42 85% 55%)" },
  { name: "Stone Pine Hive", slug: "stone-pine", emoji: "🌲", color: "hsl(160 40% 40%)" },
  { name: "Spruce Hive", slug: "spruce", emoji: "🌲", color: "hsl(150 50% 35%)" },
  { name: "Yew Hive", slug: "yew", emoji: "🌿", color: "hsl(140 60% 25%)" },
];

/* ━━━ Small components ━━━ */
const StatTile = ({ label, value, icon: Icon, accent }: { label: string; value: number | string; icon: React.ElementType; accent?: string }) => (
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

/* ━━━ Tree Card ━━━ */
const TreeCard = ({ tree, onClick }: { tree: NotableTree; onClick: () => void }) => {
  const hive = getHive(tree.scientific_name);
  const isPinned = tree.lat != null && tree.lon != null;
  return (
    <Card className="border-primary/10 hover:border-primary/30 transition-all cursor-pointer group" onClick={onClick}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-serif text-foreground truncate">{hive.emoji} {tree.common_name}</p>
            <p className="text-xs text-muted-foreground italic truncate">{tree.scientific_name}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="outline" className="text-[10px]" style={{ borderColor: hive.color, color: hive.color }}>{hive.name}</Badge>
            {!isPinned && (
              <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400">
                <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Unmapped
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{tree.municipality}{tree.locality ? ` · ${tree.locality}` : ""}</span>
        </p>
        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-1.5">
            {tree.estimated_age_years && <Badge variant="outline" className="text-[10px]">~{tree.estimated_age_years} yrs</Badge>}
            <Badge variant="outline" className="text-[10px]">{tree.relevance}</Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="w-3 h-3 mr-1" /> Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/* ━━━ Detail Modal ━━━ */
const TreeDetailModal = ({ tree, open, onClose }: { tree: NotableTree | null; open: boolean; onClose: () => void }) => {
  const navigate = useNavigate();
  if (!tree) return null;
  const hive = getHive(tree.scientific_name);
  const isPinned = tree.lat != null && tree.lon != null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">{hive.emoji} {tree.common_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground italic">{tree.scientific_name}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs" style={{ borderColor: hive.color, color: hive.color }}>{hive.name} Hive</Badge>
            <Badge variant="outline" className="text-xs">{tree.relevance}</Badge>
            {tree.estimated_age_years && <Badge variant="outline" className="text-xs">~{tree.estimated_age_years} years</Badge>}
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {tree.municipality}, {tree.province}</p>
            {tree.locality && <p className="ml-4 text-muted-foreground/70">Locality: {tree.locality}</p>}
          </div>

          {/* Why Notable */}
          <Card className="border-primary/10">
            <CardContent className="p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground text-[11px]">Why Notable</p>
              <p>
                {tree.relevance === "Internazionale" && "Internationally significant monumental tree — one of few in the global registry."}
                {tree.relevance === "Nazionale" && "Nationally recognised as a monumental tree of Italy (Registro degli Alberi Monumentali)."}
                {tree.relevance === "Regionale" && "Regionally notable specimen within the Veneto monumental tree database."}
                {tree.relevance === "Locale" && "Locally significant tree, valued by the community for its size, age, or cultural meaning."}
                {tree.estimated_age_years && tree.estimated_age_years >= 500 && " A living witness to over five centuries of alpine history."}
                {tree.estimated_age_years && tree.estimated_age_years >= 300 && tree.estimated_age_years < 500 && " A multi-centennial elder shaped by Dolomite geology."}
              </p>
            </CardContent>
          </Card>

          {!isPinned && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-3 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <p className="font-medium mb-1 text-foreground">Unmapped Monumental Tree</p>
                  <p className="text-muted-foreground">No GPS coordinates. Help map this tree by providing coordinates, what3words, or importing from the registry page.</p>
                  <div className="flex gap-2 mt-2">
                    <Button variant="sacred" size="sm" className="h-6 text-[10px]" onClick={() => navigate("/add-tree")}>
                      <Plus className="w-3 h-3 mr-0.5" /> Add GPS / w3w
                    </Button>
                    {tree.source_url && (
                      <Button variant="ghost" size="sm" className="h-6 text-[10px]" asChild>
                        <a href={tree.source_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 mr-0.5" /> Import from Registry
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {isPinned && (
              <Button variant="mystical" size="sm" onClick={() => navigate(`/map?lat=${tree.lat}&lng=${tree.lon}&zoom=16&origin=atlas`)}>
                <Navigation className="w-3.5 h-3.5 mr-1" /> Navigate
              </Button>
            )}
            <Button variant="sacred" size="sm" onClick={() => navigate(isPinned ? `/map?lat=${tree.lat}&lng=${tree.lon}&zoom=16` : "/add-tree")}>
              <Plus className="w-3.5 h-3.5 mr-1" /> {isPinned ? "Check-in" : "Add GPS"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/whispers")}>
              <MessageSquare className="w-3.5 h-3.5 mr-1" /> Leave Whisper
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/hive/${hive.slug}`}><Compass className="w-3.5 h-3.5 mr-1" /> {hive.name} Hive</Link>
            </Button>
            {tree.source_url && (
              <Button variant="ghost" size="sm" asChild>
                <a href={tree.source_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5 mr-1" /> Registry</a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN PAGE — Bio-Region: Dolomiti d'Ampezzo & Cadore
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const DolomitiAmpezzoPage = () => {
  const navigate = useNavigate();
  const [trees, setTrees] = useState<NotableTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("directory");
  const [ageBand, setAgeBand] = useState<AgeBand>("all");
  const [elevBand, setElevBand] = useState<ElevBand>("all");
  const [speciesFilter, setSpeciesFilter] = useState<string | null>(null);
  const [municipalityFilter, setMunicipalityFilter] = useState<string | null>(null);
  const [selectedTree, setSelectedTree] = useState<NotableTree | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [ecologyOpen, setEcologyOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("region_notable_trees")
        .select("*")
        .eq("province", "Belluno")
        .order("estimated_age_years", { ascending: false, nullsFirst: false });
      if (data) setTrees(data as unknown as NotableTree[]);
      setLoading(false);
    };
    load();
  }, []);

  /* Computed */
  const filteredTrees = useMemo(() => {
    let pool = trees;
    if (ageBand !== "all") pool = pool.filter(t => matchesAgeBand(t.estimated_age_years, ageBand));
    if (speciesFilter) pool = pool.filter(t => getHive(t.scientific_name).name === speciesFilter);
    if (municipalityFilter) pool = pool.filter(t => t.municipality === municipalityFilter);
    return pool;
  }, [trees, ageBand, speciesFilter, municipalityFilter]);

  const hiveCounts = useMemo(() => {
    const map: Record<string, { name: string; color: string; emoji: string; slug: string; count: number }> = {};
    trees.forEach(t => {
      const h = getHive(t.scientific_name);
      if (!map[h.name]) map[h.name] = { ...h, count: 0 };
      map[h.name].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [trees]);

  const municipalities = useMemo(() => Array.from(new Set(trees.map(t => t.municipality))).sort(), [trees]);
  const speciesCount = new Set(trees.map(t => t.scientific_name)).size;
  const withCoords = trees.filter(t => t.lat != null).length;
  const oldestAge = trees.reduce((max, t) => Math.max(max, t.estimated_age_years ?? 0), 0);

  const groveCards = useMemo(() =>
    GROVES.map(g => ({ ...g, trees: trees.filter(t => g.municipalities.includes(t.municipality)) })),
    [trees],
  );

  const openTree = (t: NotableTree) => { setSelectedTree(t); setModalOpen(true); };
  const mapUrl = "/map?lat=46.54&lng=12.14&zoom=10&country=italy&origin=atlas";
  const resetFilters = () => { setAgeBand("all"); setElevBand("all"); setSpeciesFilter(null); setMunicipalityFilter(null); };
  const hasFilters = ageBand !== "all" || elevBand !== "all" || !!speciesFilter || !!municipalityFilter;

  return (
    <PageShell>
      <Header />
      <div className="min-h-screen pb-24 pt-16">

        {/* ═══════ 1 · HERO ═══════ */}
        <section className="relative px-4 pt-10 pb-8 overflow-hidden">
          {/* Subtle alpine gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/25 via-stone-900/10 to-transparent pointer-events-none" />
          {/* Mountain silhouette */}
          <div className="absolute bottom-0 left-0 right-0 h-24 opacity-[0.05] pointer-events-none"
            style={{
              background: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1200 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 120 L100 60 L220 85 L380 15 L500 55 L620 8 L780 42 L900 18 L1020 52 L1120 28 L1200 50 L1200 120Z' fill='white'/%3E%3C/svg%3E\") no-repeat center bottom / cover",
            }}
          />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative max-w-2xl mx-auto text-center">
            <div className="mb-4">
              <AtlasBreadcrumb segments={[
                { label: "🌍 Atlas", to: "/atlas" },
                { label: "🇮🇹 Italy", to: "/atlas/italy" },
                { label: "Bio-Region" },
                { label: "Dolomiti d'Ampezzo" },
              ]} />
            </div>

            <Badge variant="outline" className="mb-3 text-[10px] border-primary/30 text-primary">
              <Layers className="w-3 h-3 mr-1" /> Bio-Region · Ecological Governance Layer
            </Badge>

            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
              Dolomites Bio-Region
            </h1>
            <p className="text-base font-serif text-muted-foreground mb-1">
              Ancient Forests of Ampezzo & Cadore
            </p>
            <p className="text-sm text-muted-foreground italic mb-5 max-w-lg mx-auto leading-relaxed">
              A mountain forest bioregion shaped by limestone towers, alpine larch,
              stone pine, and glacial water — where ecology, not borders, defines belonging.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-5">
              <Badge variant="outline" className="text-xs border-amber-400/30 text-amber-300">
                <Mountain className="w-3 h-3 mr-1" /> {ECOLOGY.elevation}
              </Badge>
              <Badge variant="outline" className="text-xs border-emerald-400/30 text-emerald-300">
                <TreeDeciduous className="w-3 h-3 mr-1" /> {trees.length} Monumental Trees
              </Badge>
              <Badge variant="outline" className="text-xs border-sky-400/30 text-sky-300">
                <Shield className="w-3 h-3 mr-1" /> UNESCO Dolomites
              </Badge>
              <Badge variant="outline" className="text-xs border-blue-400/30 text-blue-300">
                <Droplets className="w-3 h-3 mr-1" /> Piave Watershed
              </Badge>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="mystical" onClick={() => navigate(mapUrl)}>
                <MapIcon className="w-4 h-4 mr-1" /> Open Bio-Region Map
              </Button>
              <Button variant="sacred" onClick={() => { setActiveTab("directory"); window.scrollTo({ top: 900, behavior: "smooth" }); }}>
                <TreeDeciduous className="w-4 h-4 mr-1" /> Explore Monumental Trees
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/add-tree"><Plus className="w-4 h-4 mr-1" /> Map an Ancient Friend</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/council"><Users className="w-4 h-4 mr-1" /> Host a Council Here</Link>
              </Button>
            </div>
          </motion.div>
        </section>

        {/* ═══════ STATS ═══════ */}
        <section className="px-4 max-w-3xl mx-auto mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile label="Monumental Trees" value={trees.length} icon={TreeDeciduous} accent="hsl(42 85% 55%)" />
            <StatTile label="Species" value={speciesCount} icon={Leaf} accent="hsl(150 40% 35%)" />
            <StatTile label="Oldest (est.)" value={`~${oldestAge}y`} icon={Sparkles} accent="hsl(30 70% 50%)" />
            <StatTile label="GPS Pinned" value={`${withCoords}/${trees.length}`} icon={MapPin} accent="hsl(200 60% 50%)" />
          </div>
        </section>

        {/* ═══════ 2 · ECOLOGY SNAPSHOT ═══════ */}
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
                  {/* Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Elevation Range</p>
                      <p className="text-sm text-foreground flex items-center gap-1"><Mountain className="w-3.5 h-3.5 text-primary" /> {ECOLOGY.elevation}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Climate Band</p>
                      <p className="text-sm text-foreground flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-primary" /> {ECOLOGY.climate}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Watershed Systems</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ECOLOGY.watersheds.map(w => (
                          <Badge key={w} variant="outline" className="text-[10px]"><Droplets className="w-2.5 h-2.5 mr-0.5" /> {w}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Dominant Species</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ECOLOGY.dominantSpecies.map(sp => (
                          <Badge key={sp.name} variant="outline" className="text-[10px]">{sp.emoji} {sp.common}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* UNESCO note */}
                  <Card className="border-sky-500/20 bg-sky-500/5">
                    <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
                      <Shield className="w-4 h-4 shrink-0 mt-0.5 text-sky-400" />
                      <div>
                        <p className="font-medium text-foreground text-[11px] mb-0.5">UNESCO Dolomites</p>
                        <p>{ECOLOGY.unescoNote}</p>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Bio-region definition */}
                  <p className="text-[10px] text-muted-foreground/70 leading-relaxed italic">
                    This Bio-Region is not a political boundary. It is defined by mountain ecology,
                    watershed systems, alpine forest composition, and the shared cultural memory of the Dolomites.
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </section>

        {/* ═══════ 3 · MAP MODULE ═══════ */}
        <section className="px-4 max-w-3xl mx-auto mb-8">
          <Card className="border-primary/15 bg-card/60 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 border-b border-border/30 flex items-center justify-between">
                <h2 className="text-sm font-serif font-bold text-foreground flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-primary" /> Bio-Region Map
                </h2>
                <Button variant="mystical" size="sm" onClick={() => navigate(mapUrl)}>
                  <MapIcon className="w-3.5 h-3.5 mr-1" /> Full Map
                </Button>
              </div>
              <div className="p-4 space-y-3">
                {/* Pinned trees list as map-preview */}
                <p className="text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {PINNED_TREES.length} confirmed GPS locations · Centered on 46.54°N, 12.14°E
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PINNED_TREES.map(pt => {
                    const hive = getHive(pt.species);
                    return (
                      <button
                        key={pt.name}
                        onClick={() => navigate(`/map?lat=${pt.lat}&lng=${pt.lon}&zoom=15&origin=atlas`)}
                        className="flex items-center gap-2 p-2.5 rounded-lg border border-primary/10 hover:border-primary/30 bg-card/40 transition-all text-left"
                      >
                        <span className="text-lg">{hive.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">{pt.name}</p>
                          <p className="text-[10px] text-muted-foreground">{pt.municipality} · {pt.age}</p>
                        </div>
                        <Navigation className="w-3.5 h-3.5 text-primary shrink-0" />
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground/60 text-center">
                  {trees.length - withCoords} trees still need GPS coordinates · <Link to="/add-tree" className="underline hover:text-primary">Help map them</Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ═══════ 4 · BIO-REGION FILTER SYSTEM ═══════ */}
        <section className="px-4 max-w-3xl mx-auto mb-6">
          <h2 className="text-sm font-serif font-bold text-foreground mb-3 flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" /> Bio-Region Filters
          </h2>

          {/* Species */}
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Species</p>
            <ScrollArea className="w-full">
              <div className="flex gap-1.5 pb-2">
                <PillFilter active={!speciesFilter} onClick={() => setSpeciesFilter(null)}>All ({trees.length})</PillFilter>
                {hiveCounts.map(h => (
                  <PillFilter key={h.name} active={speciesFilter === h.name} onClick={() => setSpeciesFilter(speciesFilter === h.name ? null : h.name)}>
                    {h.emoji} {h.name} ({h.count})
                  </PillFilter>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Municipality */}
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Municipality</p>
            <ScrollArea className="w-full">
              <div className="flex gap-1.5 pb-2">
                <PillFilter active={!municipalityFilter} onClick={() => setMunicipalityFilter(null)}>All</PillFilter>
                {municipalities.map(m => (
                  <PillFilter key={m} active={municipalityFilter === m} onClick={() => setMunicipalityFilter(municipalityFilter === m ? null : m)}>{m}</PillFilter>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Age + Elevation side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Age Band</p>
              <div className="flex flex-wrap gap-1.5">
                {AGE_BANDS.map(b => (
                  <PillFilter key={b.key} active={ageBand === b.key} onClick={() => setAgeBand(ageBand === b.key ? "all" : b.key)}>
                    {b.label} <span className="opacity-60 ml-0.5">{b.range}</span>
                  </PillFilter>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Elevation Band</p>
              <div className="flex flex-wrap gap-1.5">
                {ELEV_BANDS.map(b => (
                  <PillFilter key={b.key} active={elevBand === b.key} onClick={() => setElevBand(elevBand === b.key ? "all" : b.key)}>
                    {b.label} <span className="opacity-60 ml-0.5">{b.range}</span>
                  </PillFilter>
                ))}
              </div>
            </div>
          </div>

          {hasFilters && (
            <Button variant="link" size="sm" className="text-xs" onClick={resetFilters}>Reset all filters</Button>
          )}
        </section>

        {/* ═══════ FEATURED GROVES ═══════ */}
        <section className="px-4 max-w-3xl mx-auto mb-8">
          <h2 className="text-sm font-serif font-bold text-foreground mb-3 flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" /> Featured Groves
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groveCards.map(g => (
              <Card
                key={g.name}
                className="border-primary/10 hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => {
                  const firstM = g.municipalities[0];
                  setMunicipalityFilter(firstM);
                  setActiveTab("directory");
                  window.scrollTo({ top: 1200, behavior: "smooth" });
                }}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-serif font-bold text-foreground">{g.emoji} {g.name}</h3>
                    <Badge variant="outline" className="text-[10px]">{g.trees.length} trees</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {g.trees.slice(0, 3).map(t => (
                      <Badge key={t.id} variant="outline" className="text-[10px] text-muted-foreground">
                        {getHive(t.scientific_name).emoji} {t.common_name}
                      </Badge>
                    ))}
                    {g.trees.length > 3 && <Badge variant="outline" className="text-[10px] text-muted-foreground">+{g.trees.length - 3}</Badge>}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{g.municipalities.join(" · ")}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ═══════ 5 · HIVE INTEGRATION ═══════ */}
        <section className="px-4 max-w-3xl mx-auto mb-8">
          <h2 className="text-sm font-serif font-bold text-foreground mb-3 flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" /> Connected Hives
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Species clusters present in this bio-region. Tap a hive to see all trees of that lineage.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {HIVE_LINKS.map(h => {
              const count = hiveCounts.find(hc => hc.slug === h.slug)?.count ?? 0;
              return (
                <Card
                  key={h.slug}
                  className="border-primary/10 hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => {
                    if (count > 0) {
                      setSpeciesFilter(h.name.replace(" Hive", ""));
                      setActiveTab("directory");
                      window.scrollTo({ top: 1200, behavior: "smooth" });
                    } else {
                      navigate(`/hive/${h.slug}`);
                    }
                  }}
                >
                  <CardContent className="p-3 text-center space-y-1">
                    <p className="text-xl">{h.emoji}</p>
                    <p className="text-xs font-serif font-bold text-foreground">{h.name}</p>
                    <p className="text-[10px] text-muted-foreground">{count} in bio-region</p>
                    <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5" asChild>
                      <Link to={`/hive/${h.slug}`}>Global Hive <ArrowRight className="w-2.5 h-2.5 ml-0.5" /></Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ═══════ TABS: DIRECTORY + COUNCIL ═══════ */}
        <section className="px-4 max-w-3xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-card/50 border border-primary/20 mb-4">
              <TabsTrigger value="directory">Monumental Trees</TabsTrigger>
              <TabsTrigger value="council">Council & Offerings</TabsTrigger>
            </TabsList>

            {/* ─── Directory ─── */}
            <TabsContent value="directory">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Loading Dolomiti elders…</div>
              ) : filteredTrees.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No trees match the current filters.
                  <Button variant="link" size="sm" className="ml-2" onClick={resetFilters}>Reset</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredTrees.map(tree => (
                    <TreeCard key={tree.id} tree={tree} onClick={() => openTree(tree)} />
                  ))}
                </div>
              )}
              <p className="text-center text-[10px] text-muted-foreground mt-4">
                {filteredTrees.length} of {trees.length} trees · Source: Il Registro degli Alberi Monumentali d'Italia
              </p>
            </TabsContent>

            {/* ─── 6 · Council & Offerings ─── */}
            <TabsContent value="council">
              <div className="space-y-4">
                {/* Offerings */}
                <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="text-sm font-serif font-bold text-foreground flex items-center gap-2">
                      <Heart className="w-4 h-4 text-amber-400" /> Dolomiti Heartwood Offerings
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      The ancient trees of Ampezzo and Cadore await your offering.
                      Share a poem, a photograph, a field recording, or a quiet reflection
                      beneath the stone towers of the Dolomites.
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

                {/* Council */}
                <Card className="border-primary/15 bg-gradient-to-br from-indigo-500/5 to-card/80">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="text-sm font-serif font-bold text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" /> Council of Life — Dolomiti
                    </h3>
                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                      "Imagine gathering beneath the oldest larch in Val di Zoldo,
                      where roots grip limestone and time slows to the rhythm of snowmelt.
                      Who would you invite to this Council of Life?"
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-[10px]">🌑 New Moon — living beings</Badge>
                      <Badge variant="outline" className="text-[10px]">🌕 Full Moon — beyond time</Badge>
                    </div>
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

                {/* Species Hives in this region */}
                <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="text-sm font-serif font-bold text-foreground flex items-center gap-2">
                      <Compass className="w-4 h-4 text-primary" /> Local Species Hives
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {hiveCounts.map(h => (
                        <Button
                          key={h.name}
                          variant="outline"
                          size="sm"
                          className="h-auto py-1.5 text-xs"
                          style={{ borderColor: `${h.color}40`, color: h.color }}
                          onClick={() => { setSpeciesFilter(h.name); setActiveTab("directory"); }}
                        >
                          {h.emoji} {h.name} ({h.count})
                        </Button>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/hives"><Compass className="w-3.5 h-3.5 mr-1" /> All Global Hives</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* ═══════ 7 · BIO-REGION NAVIGATION ═══════ */}
        <section className="px-4 max-w-3xl mx-auto mt-10 mb-6">
          <h2 className="text-sm font-serif font-bold text-foreground mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> Bio-Region Navigation
          </h2>

          {/* Vertical hierarchy */}
          <Card className="border-primary/15 bg-card/50 mb-4">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">↑ Above</span>
                <ArrowRight className="w-3 h-3" />
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                  <Link to="/atlas/italy">🇮🇹 Italy Country Atlas</Link>
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-primary">● Current</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-foreground">🏔️ Dolomites Bio-Region</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">↓ Below</span>
                <ArrowRight className="w-3 h-3" />
                <span>Municipal & county pages (Cortina, Cadore, Belluno…)</span>
              </div>
            </CardContent>
          </Card>

          {/* Parallel bio-regions */}
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Parallel Alpine Bio-Regions</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PARALLEL_BIOREGIONS.map(br => (
              <Button
                key={br.name}
                variant="outline"
                size="sm"
                className="h-auto py-2.5 flex-col gap-0.5 text-xs"
                disabled={"coming" in br && br.coming}
                asChild={!("coming" in br && br.coming)}
              >
                {"coming" in br && br.coming ? (
                  <div>
                    <span>{br.emoji} {br.name}</span>
                    <span className="text-[9px] text-muted-foreground/60">Coming soon</span>
                  </div>
                ) : (
                  <Link to={br.to}>
                    <span>{br.emoji} {br.name}</span>
                    <span className="text-[9px] text-muted-foreground">{br.country}</span>
                  </Link>
                )}
              </Button>
            ))}
          </div>
        </section>

        {/* ═══════ FOOTER ═══════ */}
        <section className="px-4 max-w-3xl mx-auto mt-6">
          <Card className="border-primary/15 bg-gradient-to-br from-emerald-950/10 to-card/80">
            <CardContent className="p-5 text-center space-y-3">
              <p className="text-sm font-serif text-foreground">Map another elder in the Dolomites</p>
              <p className="text-xs text-muted-foreground">
                Know an ancient tree in Cortina, Cadore, or anywhere in the Belluno Dolomites?
                Add it to the planetary grove.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="mystical" size="sm" asChild>
                  <Link to="/add-tree"><Plus className="w-3.5 h-3.5 mr-1" /> Map a Tree</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/atlas/italy"><ArrowLeft className="w-3.5 h-3.5 mr-1" /> Italy Atlas</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/atlas"><Globe className="w-3.5 h-3.5 mr-1" /> World Atlas</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/hives"><Compass className="w-3.5 h-3.5 mr-1" /> Species Hives</Link>
                </Button>
              </div>
              <p className="text-[9px] text-muted-foreground/50 italic">
                Bio-Region layer v1 · Prototype for ecological governance navigation
              </p>
            </CardContent>
          </Card>
        </section>
      </div>

      <TreeDetailModal tree={selectedTree} open={modalOpen} onClose={() => setModalOpen(false)} />
      <BottomNav />
    </PageShell>
  );
};

export default DolomitiAmpezzoPage;
