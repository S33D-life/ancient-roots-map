import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  MapPin, ExternalLink, TreeDeciduous, Eye, Compass, Heart, Mountain,
  BookOpen, ChevronRight, Map as MapIcon, Shield, Sparkles, Filter,
  ArrowLeft, Leaf, Navigation, MessageSquare, Plus, AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import Header from "@/components/Header";
import AtlasBreadcrumb from "@/components/AtlasBreadcrumb";
import BottomNav from "@/components/BottomNav";

/* ─── Types ─── */
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

/* ─── Hive mapping ─── */
const getHive = (species: string): { name: string; color: string; emoji: string } => {
  const s = species.toLowerCase();
  if (s.includes("larix")) return { name: "Larch", color: "hsl(42 85% 55%)", emoji: "🌲" };
  if (s.includes("picea")) return { name: "Spruce", color: "hsl(150 50% 35%)", emoji: "🌲" };
  if (s.includes("pinus")) return { name: "Pine", color: "hsl(160 40% 40%)", emoji: "🌲" };
  if (s.includes("fagus")) return { name: "Beech", color: "hsl(100 45% 40%)", emoji: "🍂" };
  if (s.includes("acer")) return { name: "Maple", color: "hsl(20 70% 50%)", emoji: "🍁" };
  if (s.includes("taxus")) return { name: "Yew", color: "hsl(140 60% 25%)", emoji: "🌿" };
  if (s.includes("castanea")) return { name: "Chestnut", color: "hsl(30 60% 35%)", emoji: "🌰" };
  if (s.includes("quercus")) return { name: "Oak", color: "hsl(30 50% 40%)", emoji: "🌳" };
  if (s.includes("juglans")) return { name: "Walnut", color: "hsl(35 55% 35%)", emoji: "🌳" };
  if (s.includes("sequoia")) return { name: "Sequoia", color: "hsl(15 60% 40%)", emoji: "🌲" };
  if (s.includes("abies")) return { name: "Fir", color: "hsl(155 45% 30%)", emoji: "🌲" };
  if (s.includes("fraxinus")) return { name: "Ash", color: "hsl(80 35% 45%)", emoji: "🌳" };
  if (s.includes("cedrus")) return { name: "Cedar", color: "hsl(170 40% 35%)", emoji: "🌲" };
  if (s.includes("liriodendron")) return { name: "Tulip Tree", color: "hsl(50 60% 50%)", emoji: "🌷" };
  if (s.includes("ulmus")) return { name: "Elm", color: "hsl(90 40% 38%)", emoji: "🌳" };
  if (s.includes("prunus")) return { name: "Cherry", color: "hsl(340 50% 55%)", emoji: "🌸" };
  if (s.includes("pyrus")) return { name: "Pear", color: "hsl(60 50% 45%)", emoji: "🍐" };
  if (s.includes("morus")) return { name: "Mulberry", color: "hsl(280 30% 45%)", emoji: "🫐" };
  return { name: "Mixed", color: "hsl(270 25% 55%)", emoji: "🌳" };
};

/* ─── Age band helper ─── */
type AgeBand = "all" | "0-150" | "150-300" | "300-600" | "600+";
const AGE_BANDS: { key: AgeBand; label: string; range: string }[] = [
  { key: "all", label: "All Ages", range: "All" },
  { key: "0-150", label: "Young", range: "0–150y" },
  { key: "150-300", label: "Mature", range: "150–300y" },
  { key: "300-600", label: "Ancient", range: "300–600y" },
  { key: "600+", label: "Primeval", range: "600y+" },
];

const matchesAgeBand = (age: number | null, band: AgeBand): boolean => {
  if (band === "all") return true;
  if (age == null) return false;
  if (band === "0-150") return age <= 150;
  if (band === "150-300") return age > 150 && age <= 300;
  if (band === "300-600") return age > 300 && age <= 600;
  return age > 600;
};

/* ─── Groves ─── */
const GROVES = [
  { name: "Cortina Ancients", municipalities: ["Cortina d'Ampezzo"], emoji: "🏔️" },
  { name: "Zoldo Elders", municipalities: ["Val di Zoldo"], emoji: "🌲" },
  { name: "Cadore Belt", municipalities: ["Pieve di Cadore", "Calalzo di Cadore", "Valle di Cadore", "Domegge di Cadore", "Ospitale di Cadore", "Cibiana di Cadore", "Santo Stefano di Cadore", "Comelico Superiore"], emoji: "⛰️" },
  { name: "Longarone & Belluno", municipalities: ["Longarone", "Belluno", "Quero Vas"], emoji: "🌿" },
];

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

/* ─── Tree Card ─── */
const TreeCard = ({ tree, onClick }: { tree: NotableTree; onClick: () => void }) => {
  const hive = getHive(tree.scientific_name);
  const isPinned = tree.lat != null && tree.lon != null;
  return (
    <Card
      className="border-primary/10 hover:border-primary/30 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-serif text-foreground truncate">
              {hive.emoji} {tree.common_name}
            </p>
            <p className="text-xs text-muted-foreground italic truncate">{tree.scientific_name}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="outline" className="text-[10px]" style={{ borderColor: hive.color, color: hive.color }}>
              {hive.name}
            </Badge>
            {!isPinned && (
              <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400">
                <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Needs GPS
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
            {tree.estimated_age_label && (
              <Badge variant="outline" className="text-[10px]">~{tree.estimated_age_years ?? "?"} yrs</Badge>
            )}
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

/* ─── Detail Modal ─── */
const TreeDetailModal = ({ tree, open, onClose }: { tree: NotableTree | null; open: boolean; onClose: () => void }) => {
  const navigate = useNavigate();
  if (!tree) return null;
  const hive = getHive(tree.scientific_name);
  const isPinned = tree.lat != null && tree.lon != null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            {hive.emoji} {tree.common_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground italic">{tree.scientific_name}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs" style={{ borderColor: hive.color, color: hive.color }}>{hive.name} Hive</Badge>
            <Badge variant="outline" className="text-xs">{tree.relevance}</Badge>
            <Badge variant="outline" className="text-xs">{tree.accessibility}</Badge>
            {tree.estimated_age_years && (
              <Badge variant="outline" className="text-xs">~{tree.estimated_age_years} years</Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {tree.municipality}, {tree.province}</p>
            {tree.locality && <p className="ml-4 text-muted-foreground/70">Locality: {tree.locality}</p>}
          </div>
          {!isPinned && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-3 text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Unpinned Seed</p>
                  <p className="text-muted-foreground">This tree has no GPS coordinates yet. Help us map it by providing coordinates or a what3words address.</p>
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
            <Button variant="sacred" size="sm" onClick={() => navigate("/add-tree")}>
              <Plus className="w-3.5 h-3.5 mr-1" /> {isPinned ? "Check-in" : "Add GPS"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/whispers")}>
              <MessageSquare className="w-3.5 h-3.5 mr-1" /> Leave Whisper
            </Button>
            {tree.source_url && (
              <Button variant="ghost" size="sm" asChild>
                <a href={tree.source_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Registry
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════ */
const DolomitiAmpezzoPage = () => {
  const navigate = useNavigate();
  const [trees, setTrees] = useState<NotableTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("directory");
  const [ageBand, setAgeBand] = useState<AgeBand>("all");
  const [speciesFilter, setSpeciesFilter] = useState<string | null>(null);
  const [municipalityFilter, setMunicipalityFilter] = useState<string | null>(null);
  const [relevanceFilter, setRelevanceFilter] = useState<string | null>(null);
  const [selectedTree, setSelectedTree] = useState<NotableTree | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  /* ─── Computed ─── */
  const filteredTrees = useMemo(() => {
    let pool = trees;
    if (ageBand !== "all") pool = pool.filter(t => matchesAgeBand(t.estimated_age_years, ageBand));
    if (speciesFilter) pool = pool.filter(t => getHive(t.scientific_name).name === speciesFilter);
    if (municipalityFilter) pool = pool.filter(t => t.municipality === municipalityFilter);
    if (relevanceFilter) pool = pool.filter(t => t.relevance === relevanceFilter);
    return pool;
  }, [trees, ageBand, speciesFilter, municipalityFilter, relevanceFilter]);

  const hiveCounts = useMemo(() => {
    const map: Record<string, { name: string; color: string; emoji: string; count: number }> = {};
    trees.forEach(t => {
      const h = getHive(t.scientific_name);
      if (!map[h.name]) map[h.name] = { ...h, count: 0 };
      map[h.name].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [trees]);

  const municipalities = useMemo(() => {
    const s = new Set(trees.map(t => t.municipality));
    return Array.from(s).sort();
  }, [trees]);

  const speciesCount = new Set(trees.map(t => t.scientific_name)).size;
  const withCoords = trees.filter(t => t.lat != null).length;
  const oldestAge = trees.reduce((max, t) => Math.max(max, t.estimated_age_years ?? 0), 0);

  const groveCards = useMemo(() =>
    GROVES.map(g => ({
      ...g,
      trees: trees.filter(t => g.municipalities.includes(t.municipality)),
    })), [trees]);

  const openTree = (t: NotableTree) => { setSelectedTree(t); setModalOpen(true); };
  const mapUrl = "/map?lat=46.54&lng=12.14&zoom=10&country=italy&origin=atlas";
  const resetFilters = () => { setAgeBand("all"); setSpeciesFilter(null); setMunicipalityFilter(null); setRelevanceFilter(null); };

  return (
    <PageShell>
      <Header />
      <div className="min-h-screen pb-24 pt-16">
        {/* ═══ HERO ═══ */}
        <section className="relative px-4 pt-10 pb-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/20 via-amber-900/5 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-20 opacity-[0.06] pointer-events-none"
            style={{
              background: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1200 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 120 L150 50 L300 80 L450 20 L550 60 L700 10 L850 45 L1000 25 L1100 55 L1200 35 L1200 120Z' fill='white'/%3E%3C/svg%3E\") no-repeat center bottom / cover",
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative max-w-2xl mx-auto text-center"
          >
            <div className="mb-4">
              <AtlasBreadcrumb segments={[
                { label: "🇮🇹 Italy", to: "/atlas/italy" },
                { label: "Veneto · Belluno" },
                { label: "Dolomiti d'Ampezzo" },
              ]} />
            </div>

            <p className="text-4xl mb-2">🏔️</p>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-1">
              Dolomiti d'Ampezzo & Cadore
            </h1>
            <p className="text-sm text-muted-foreground italic mb-4 max-w-md mx-auto">
              Where ancient larches hold the memory of stone towers and the wind carries whispers through thousand-year forests
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <Badge variant="outline" className="text-xs border-amber-400/30 text-amber-300">
                <Mountain className="w-3 h-3 mr-1" /> Cortina d'Ampezzo
              </Badge>
              <Badge variant="outline" className="text-xs border-emerald-400/30 text-emerald-300">
                <TreeDeciduous className="w-3 h-3 mr-1" /> {trees.length} Notable Trees
              </Badge>
              <Badge variant="outline" className="text-xs border-sky-400/30 text-sky-300">
                <Shield className="w-3 h-3 mr-1" /> UNESCO Dolomites
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground max-w-lg mx-auto mb-5 leading-relaxed">
              From the 800-year-old larches of Val di Zoldo to the ancient yews of Cadore, 
              the Belluno Dolomites shelter some of Italy's most remarkable living elders —
              sentinel trees rooted in limestone, shaped by avalanche, and touched by alpine light.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="mystical" onClick={() => navigate(mapUrl)}>
                <MapIcon className="w-4 h-4 mr-1" /> Open Map (Filtered)
              </Button>
              <Button variant="sacred" onClick={() => { setActiveTab("directory"); window.scrollTo({ top: 800, behavior: "smooth" }); }}>
                <TreeDeciduous className="w-4 h-4 mr-1" /> Explore 33 Trees
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/add-tree">
                  <Plus className="w-4 h-4 mr-1" /> Map a Tree
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/whispers">
                  <Heart className="w-4 h-4 mr-1" /> Leave an Offering
                </Link>
              </Button>
            </div>
          </motion.div>
        </section>

        {/* ═══ STATS ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile label="Notable Trees" value={trees.length} icon={TreeDeciduous} accent="hsl(42 85% 55%)" />
            <StatTile label="Species" value={speciesCount} icon={Leaf} accent="hsl(150 40% 35%)" />
            <StatTile label="Oldest (est.)" value={`~${oldestAge}y`} icon={Sparkles} accent="hsl(30 70% 50%)" />
            <StatTile label="GPS Pinned" value={withCoords} icon={MapPin} accent="hsl(200 60% 50%)" />
          </div>
        </section>

        {/* ═══ QUICK FILTER BAR ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-6">
          <h2 className="text-sm font-serif font-bold text-foreground mb-3 flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" /> Quick Filters
          </h2>

          {/* Species */}
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Species</p>
            <ScrollArea className="w-full">
              <div className="flex gap-1.5 pb-2">
                <button onClick={() => setSpeciesFilter(null)} className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${!speciesFilter ? "bg-primary text-primary-foreground border-primary" : "bg-card/60 text-muted-foreground border-border/40 hover:border-primary/40"}`}>
                  All ({trees.length})
                </button>
                {hiveCounts.map(h => (
                  <button key={h.name} onClick={() => setSpeciesFilter(speciesFilter === h.name ? null : h.name)} className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${speciesFilter === h.name ? "bg-primary text-primary-foreground border-primary" : "bg-card/60 text-muted-foreground border-border/40 hover:border-primary/40"}`}>
                    {h.emoji} {h.name} ({h.count})
                  </button>
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
                <button onClick={() => setMunicipalityFilter(null)} className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${!municipalityFilter ? "bg-primary text-primary-foreground border-primary" : "bg-card/60 text-muted-foreground border-border/40 hover:border-primary/40"}`}>
                  All
                </button>
                {municipalities.map(m => (
                  <button key={m} onClick={() => setMunicipalityFilter(municipalityFilter === m ? null : m)} className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${municipalityFilter === m ? "bg-primary text-primary-foreground border-primary" : "bg-card/60 text-muted-foreground border-border/40 hover:border-primary/40"}`}>
                    {m}
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Age Band */}
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Age Band</p>
            <div className="flex flex-wrap gap-1.5">
              {AGE_BANDS.map(b => (
                <button key={b.key} onClick={() => setAgeBand(ageBand === b.key ? "all" : b.key)} className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${ageBand === b.key ? "bg-primary text-primary-foreground border-primary" : "bg-card/60 text-muted-foreground border-border/40 hover:border-primary/40"}`}>
                  {b.label} <span className="opacity-60 ml-0.5">{b.range}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Relevance */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Relevance</p>
            <div className="flex flex-wrap gap-1.5">
              {["Locale", "Regionale", "Nazionale", "Internazionale"].map(r => (
                <button key={r} onClick={() => setRelevanceFilter(relevanceFilter === r ? null : r)} className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${relevanceFilter === r ? "bg-primary text-primary-foreground border-primary" : "bg-card/60 text-muted-foreground border-border/40 hover:border-primary/40"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {(speciesFilter || municipalityFilter || ageBand !== "all" || relevanceFilter) && (
            <Button variant="link" size="sm" className="mt-2 text-xs" onClick={resetFilters}>
              Reset all filters
            </Button>
          )}
        </section>

        {/* ═══ MAP SECTION ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-8">
          <Card className="border-primary/15 bg-card/60 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 border-b border-border/30 flex items-center justify-between">
                <h2 className="text-sm font-serif font-bold text-foreground flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-primary" /> Regional Map
                </h2>
                <Button variant="mystical" size="sm" onClick={() => navigate(mapUrl)}>
                  <MapIcon className="w-3.5 h-3.5 mr-1" /> Full Map
                </Button>
              </div>
              <div className="aspect-[16/9] bg-gradient-to-br from-emerald-900/20 via-card to-amber-900/10 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <p className="text-3xl">🗺️</p>
                  <p className="text-xs text-muted-foreground">
                    Centered on Cortina d'Ampezzo · Belluno Province
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    {withCoords} of {trees.length} trees have GPS coordinates
                  </p>
                  <Button variant="sacred" size="sm" onClick={() => navigate(mapUrl)}>
                    <MapIcon className="w-3.5 h-3.5 mr-1" /> Open Interactive Map
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ═══ FEATURED GROVES ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-8">
          <h2 className="text-sm font-serif font-bold text-foreground mb-3 flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" /> Featured Groves
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groveCards.map(g => (
              <Card key={g.name} className="border-primary/10 hover:border-primary/30 transition-all cursor-pointer" onClick={() => { setMunicipalityFilter(null); setActiveTab("directory"); }}>
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
                    {g.trees.length > 3 && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        +{g.trees.length - 3} more
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {g.municipalities.join(" · ")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ═══ TABS: DIRECTORY + COUNCIL ═══ */}
        <section className="px-4 max-w-3xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-card/50 border border-primary/20 mb-4">
              <TabsTrigger value="directory">33 Trees Directory</TabsTrigger>
              <TabsTrigger value="council">Council & Offerings</TabsTrigger>
            </TabsList>

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
                {filteredTrees.length} of {trees.length} trees shown · Data: Il Registro degli Alberi
              </p>
            </TabsContent>

            <TabsContent value="council">
              <div className="space-y-4">
                {/* Offerings strip */}
                <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="text-sm font-serif font-bold text-foreground flex items-center gap-2">
                      <Heart className="w-4 h-4 text-amber-400" /> Dolomiti Offerings
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      The ancient trees of Cortina and Cadore await your first offering.
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

                {/* Council prompt */}
                <Card className="border-primary/15 bg-gradient-to-br from-indigo-500/5 to-card/80">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="text-sm font-serif font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Council of Life — Dolomiti Edition
                    </h3>
                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                      "Imagine gathering beneath the oldest larch in Val di Zoldo, 
                      where roots grip stone and time slows to the rhythm of snowmelt.
                      Who would you invite to this Council?"
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-[10px]">🌑 New Moon — living beings only</Badge>
                      <Badge variant="outline" className="text-[10px]">🌕 Full Moon — beyond time</Badge>
                    </div>
                    <Button variant="sacred" size="sm" asChild>
                      <Link to="/time-tree"><Sparkles className="w-3.5 h-3.5 mr-1" /> Enter Time Tree</Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* Hives */}
                <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="text-sm font-serif font-bold text-foreground flex items-center gap-2">
                      <Compass className="w-4 h-4 text-primary" /> Local Species Hives
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {hiveCounts.map(h => (
                        <Badge key={h.name} variant="outline" className="text-xs" style={{ borderColor: h.color, color: h.color }}>
                          {h.emoji} {h.name} ({h.count})
                        </Badge>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/hives"><Compass className="w-3.5 h-3.5 mr-1" /> All Hives</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* ═══ FOOTER ═══ */}
        <section className="px-4 max-w-3xl mx-auto mt-10">
          <Card className="border-primary/15 bg-gradient-to-br from-emerald-900/10 to-card/80">
            <CardContent className="p-5 text-center space-y-3">
              <p className="text-sm font-serif text-foreground">Map another elder in the Dolomites</p>
              <p className="text-xs text-muted-foreground">
                Know an ancient tree in Cortina, Cadore, or Belluno province? Add it to the living atlas.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="mystical" size="sm" asChild>
                  <Link to="/add-tree"><Plus className="w-3.5 h-3.5 mr-1" /> Map a Tree</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/atlas/italy"><ArrowLeft className="w-3.5 h-3.5 mr-1" /> Italy Atlas</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/atlas"><Compass className="w-3.5 h-3.5 mr-1" /> World Atlas</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/hives"><TreeDeciduous className="w-3.5 h-3.5 mr-1" /> Species Hives</Link>
                </Button>
              </div>
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
