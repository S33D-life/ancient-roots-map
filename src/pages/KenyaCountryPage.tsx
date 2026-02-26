import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  MapPin, TreeDeciduous, Heart, Map as MapIcon, Compass, BarChart3,
  Leaf, Eye, Sparkles, Shield, Users, Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";

/* ═══════════════════════════════════════════════
   KENYA NOTABLE TREES DATASET
   ═══════════════════════════════════════════════ */
interface KenyaTree {
  name: string;
  species: string;
  scientific: string;
  county: string;
  lat: number;
  lng: number;
  biome: string;
  context: string;
}

const BIOMES = [
  { key: "coastal", label: "Coastal Belt", species: "Baobab, Mangrove", color: "195 55% 40%" },
  { key: "savannah", label: "Savannah & Acacia Plains", species: "Acacia, Fever Tree", color: "42 85% 50%" },
  { key: "highland", label: "Highland Forest", species: "African Cedar, Podocarpus", color: "140 45% 35%" },
  { key: "rift", label: "Rift Valley & Sacred Figs", species: "Mugumo (Sacred Fig)", color: "270 40% 45%" },
  { key: "montane", label: "Montane & Mountain Ecosystems", species: "Juniper, Olive", color: "160 35% 40%" },
];

const TREES: KenyaTree[] = [
  { name: "Kaya Kinondo Sacred Baobab", species: "Baobab", scientific: "Adansonia digitata", county: "Kwale", lat: -4.3660, lng: 39.5000, biome: "coastal", context: "Sacred Mijikenda forest grove" },
  { name: "Lamu Old Town Baobab", species: "Baobab", scientific: "Adansonia digitata", county: "Lamu", lat: -2.2717, lng: 40.9020, biome: "coastal", context: "UNESCO World Heritage coastal town" },
  { name: "Mida Creek Mangrove Elder", species: "Mangrove", scientific: "Rhizophora spp.", county: "Kilifi", lat: -3.3670, lng: 39.9850, biome: "coastal", context: "Tidal creek ecosystem guardian" },
  { name: "Arabuko Sokoke Ancient Cedar", species: "East African Cedar", scientific: "Juniperus procera", county: "Kilifi", lat: -3.3000, lng: 39.9660, biome: "highland", context: "Largest remaining coastal forest" },
  { name: "Mugumo of Mukurwe wa Nyagathanga", species: "Sacred Fig (Mugumo)", scientific: "Ficus sycomorus", county: "Murang'a", lat: -0.7160, lng: 37.1500, biome: "rift", context: "Kikuyu ancestral origin site" },
  { name: "Karura Forest Ancient Fig", species: "Sacred Fig", scientific: "Ficus spp.", county: "Nairobi", lat: -1.2330, lng: 36.8350, biome: "rift", context: "Urban forest sanctuary" },
  { name: "Ngong Hills Sacred Fig", species: "Sacred Fig", scientific: "Ficus spp.", county: "Kajiado", lat: -1.3660, lng: 36.6500, biome: "savannah", context: "Iconic Nairobi skyline hills" },
  { name: "Amboseli Fever Tree Elder", species: "Fever Tree", scientific: "Vachellia xanthophloea", county: "Kajiado", lat: -2.6520, lng: 37.2600, biome: "savannah", context: "Kilimanjaro backdrop wetlands" },
  { name: "Maasai Mara Acacia Giant", species: "Acacia", scientific: "Vachellia spp.", county: "Narok", lat: -1.4060, lng: 35.0100, biome: "savannah", context: "Heart of the great migration" },
  { name: "Mount Kenya Ancient Cedar", species: "Juniper", scientific: "Juniperus procera", county: "Meru", lat: -0.1521, lng: 37.3084, biome: "montane", context: "Afro-alpine zone on Africa's second peak" },
  { name: "Mount Kenya Wild Olive", species: "Wild Olive", scientific: "Olea africana", county: "Nyeri", lat: -0.4160, lng: 36.9510, biome: "montane", context: "Montane forest belt" },
  { name: "Aberdare Podocarpus Giant", species: "Podocarpus", scientific: "Podocarpus latifolius", county: "Nyandarua", lat: -0.4500, lng: 36.7000, biome: "highland", context: "Aberdare Range indigenous forest" },
  { name: "Kakamega Rainforest Fig", species: "Fig", scientific: "Ficus spp.", county: "Kakamega", lat: 0.2830, lng: 34.7500, biome: "highland", context: "Last remnant of Guineo-Congolian forest" },
  { name: "Kakamega Ancient Elgon Teak", species: "Elgon Teak", scientific: "Olea capensis", county: "Kakamega", lat: 0.2890, lng: 34.7530, biome: "highland", context: "Kakamega tropical rainforest" },
  { name: "Mount Elgon Juniper", species: "Juniper", scientific: "Juniperus procera", county: "Bungoma", lat: 1.1500, lng: 34.5500, biome: "montane", context: "Extinct volcano montane zone" },
  { name: "Lake Naivasha Yellow Fever Tree", species: "Fever Tree", scientific: "Vachellia xanthophloea", county: "Nakuru", lat: -0.7167, lng: 36.4333, biome: "savannah", context: "Rift Valley freshwater lake" },
  { name: "Lake Victoria Sacred Fig", species: "Sacred Fig", scientific: "Ficus spp.", county: "Kisumu", lat: -0.1022, lng: 34.7617, biome: "rift", context: "Shores of Africa's largest lake" },
  { name: "Taita Hills Indigenous Fig", species: "Fig", scientific: "Ficus spp.", county: "Taita-Taveta", lat: -3.4000, lng: 38.3660, biome: "highland", context: "Cloud forest biodiversity hotspot" },
  { name: "Tsavo East Baobab", species: "Baobab", scientific: "Adansonia digitata", county: "Taita-Taveta", lat: -2.8660, lng: 38.7500, biome: "savannah", context: "Red-soil wilderness park" },
  { name: "Nairobi Arboretum Cedar", species: "Cedar", scientific: "Juniperus procera", county: "Nairobi", lat: -1.2860, lng: 36.8000, biome: "highland", context: "Urban arboretum heritage collection" },
  { name: "Chyulu Hills Olive", species: "Wild Olive", scientific: "Olea europaea subsp. africana", county: "Makueni", lat: -2.6400, lng: 37.9000, biome: "montane", context: "Young volcanic hills ecosystem" },
  { name: "Loita Forest Sacred Fig", species: "Sacred Fig (Mugumo)", scientific: "Ficus sycomorus", county: "Narok", lat: -1.7000, lng: 35.8500, biome: "rift", context: "Maasai sacred forest" },
  { name: "Marsabit Desert Acacia", species: "Acacia", scientific: "Vachellia spp.", county: "Marsabit", lat: 2.3330, lng: 37.9830, biome: "savannah", context: "Desert mountain oasis" },
  { name: "Turkana Baobab Sentinel", species: "Baobab", scientific: "Adansonia digitata", county: "Turkana", lat: 3.1160, lng: 35.6000, biome: "savannah", context: "Arid Turkana basin" },
  { name: "Nyahururu Cedar", species: "Cedar", scientific: "Juniperus procera", county: "Laikipia", lat: -0.0400, lng: 36.3650, biome: "highland", context: "Near Thomson's Falls" },
  { name: "Kericho Podocarpus", species: "Podocarpus", scientific: "Podocarpus latifolius", county: "Kericho", lat: -0.3700, lng: 35.2800, biome: "highland", context: "Tea highlands indigenous remnant" },
  { name: "Kilimanjaro Border Fig", species: "Fig", scientific: "Ficus spp.", county: "Kajiado", lat: -2.9000, lng: 37.5000, biome: "savannah", context: "Kenya-Tanzania border zone" },
  { name: "Lolgorian Mugumo", species: "Sacred Fig (Mugumo)", scientific: "Ficus sycomorus", county: "Narok", lat: -1.1750, lng: 35.5830, biome: "rift", context: "Maasai-Kipsigis borderlands" },
  { name: "Homa Bay Sacred Fig", species: "Sacred Fig", scientific: "Ficus spp.", county: "Homa Bay", lat: -0.5270, lng: 34.4570, biome: "rift", context: "Luo heritage lakeside" },
  { name: "Garissa Acacia Elder", species: "Acacia", scientific: "Vachellia spp.", county: "Garissa", lat: -0.4530, lng: 39.6400, biome: "savannah", context: "Tana River hinterland" },
  { name: "Wajir Desert Acacia", species: "Acacia", scientific: "Vachellia spp.", county: "Wajir", lat: 1.7500, lng: 40.0570, biome: "savannah", context: "Northern frontier desert" },
  { name: "Tharaka Mugumo", species: "Sacred Fig (Mugumo)", scientific: "Ficus sycomorus", county: "Tharaka-Nithi", lat: -0.3000, lng: 37.8000, biome: "rift", context: "Tharaka ancestral ceremonial tree" },
  { name: "Kwale Coastal Mangrove", species: "Mangrove", scientific: "Rhizophora spp.", county: "Kwale", lat: -4.2830, lng: 39.5830, biome: "coastal", context: "South coast tidal guardian" },
];

/* ─── Helpers ─── */
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

const CountyChip = ({ name, count, active, onClick }: {
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

const KenyaTreeCard = ({ tree, onMap }: { tree: KenyaTree; onMap: () => void }) => {
  const biome = BIOMES.find(b => b.key === tree.biome);
  return (
    <Card className="border-primary/10 hover:border-primary/30 transition-all">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-serif text-foreground truncate">{tree.name}</p>
            <p className="text-xs text-muted-foreground italic truncate">{tree.scientific}</p>
          </div>
          {biome && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0"
              style={{ borderColor: `hsl(${biome.color} / 0.5)`, color: `hsl(${biome.color})` }}>
              {biome.label}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{tree.county} County</span>
        </p>
        {tree.context && <p className="text-[11px] text-muted-foreground/70 italic">{tree.context}</p>}
        <div className="flex items-center justify-between pt-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={onMap}>
            <MapIcon className="w-3 h-3 mr-1" /> View on Map
          </Button>
          <Button variant="sacred" size="sm" className="h-7 text-xs px-2" disabled>
            <Sparkles className="w-3 h-3 mr-1" /> Mint Ancient Friend
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */
const KenyaCountryPage = () => {
  const navigate = useNavigate();
  const [selectedBiome, setSelectedBiome] = useState<string | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("trees");

  const filtered = useMemo(() => {
    let list = TREES;
    if (selectedBiome) list = list.filter(t => t.biome === selectedBiome);
    if (selectedCounty) list = list.filter(t => t.county === selectedCounty);
    return list;
  }, [selectedBiome, selectedCounty]);

  const biomeCounts = useMemo(() => {
    const map = new Map<string, number>();
    TREES.forEach(t => map.set(t.biome, (map.get(t.biome) || 0) + 1));
    return map;
  }, []);

  const countyCounts = useMemo(() => {
    const base = selectedBiome ? TREES.filter(t => t.biome === selectedBiome) : TREES;
    const map = new Map<string, number>();
    base.forEach(t => map.set(t.county, (map.get(t.county) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [selectedBiome]);

  const speciesCounts = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(t => map.set(t.species, (map.get(t.species) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const handleMapNav = (tree: KenyaTree) => {
    navigate(`/map?lat=${tree.lat}&lng=${tree.lng}&zoom=14&country=kenya&origin=atlas`);
  };

  return (
    <PageShell>
      <div className="min-h-screen pb-24">

        {/* ═══ HERO ═══ */}
        <section className="relative px-4 pt-12 pb-10 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(25_30%_10%)] via-background to-background opacity-80" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative max-w-2xl mx-auto"
          >
            <p className="text-4xl mb-3">🇰🇪</p>
            <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground mb-2">Kenya</h1>
            <p className="text-base md:text-lg text-muted-foreground font-serif italic mb-1">
              Rift Valley Figs, Highland Cedars &amp; Coastal Baobabs
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
              From the sacred Mugumo figs of the Central Highlands to the baobab sentinels of the Swahili coast — a living map of Kenya's arboreal heritage.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <Badge variant="outline" className="text-xs border-primary/30">
                <TreeDeciduous className="w-3 h-3 mr-1" /> {TREES.length} Notable Trees
              </Badge>
              <Badge variant="outline" className="text-xs border-primary/30">
                <Leaf className="w-3 h-3 mr-1" /> {BIOMES.length} Biomes
              </Badge>
              <Badge variant="outline" className="text-xs border-primary/30">
                <Shield className="w-3 h-3 mr-1" /> Cultural Heritage
              </Badge>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="mystical" onClick={() => navigate("/map?country=kenya&origin=atlas")}>
                <MapPin className="w-4 h-4 mr-1" /> Map an Ancient Friend
              </Button>
              <Button variant="sacred" onClick={() => { setSelectedBiome("rift"); setActiveTab("trees"); }}>
                <Eye className="w-4 h-4 mr-1" /> Explore Sacred Trees
              </Button>
              <Button variant="outline" onClick={() => navigate("/map?country=kenya")}>
                <MapIcon className="w-4 h-4 mr-1" /> View Kenya Tree Map
              </Button>
            </div>
          </motion.div>
        </section>

        {/* ═══ BIOME OVERVIEW ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-serif flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-primary" /> Biome Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Kenya straddles the equator with astonishing ecological range — from the coral-fringed baobab coast
                  through vast acacia savannahs, up into montane cedar and bamboo forests, and across the Great Rift Valley
                  where sacred Mugumo figs anchor the spiritual landscape.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BIOMES.map(b => {
                    const count = biomeCounts.get(b.key) || 0;
                    return (
                      <button
                        key={b.key}
                        onClick={() => { setSelectedBiome(selectedBiome === b.key ? null : b.key); setSelectedCounty(null); }}
                        className={`text-left px-4 py-3 rounded-lg border transition-all ${
                          selectedBiome === b.key
                            ? "border-primary bg-primary/10"
                            : "border-border/30 bg-muted/30 hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-serif font-medium text-foreground">{b.label}</p>
                          <Badge variant="outline" className="text-[10px]">{count}</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{b.species}</p>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* ═══ COMMUNITY METRICS ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatTile label="Kenyan Ancient Friends" value={TREES.length} icon={TreeDeciduous} />
            <StatTile label="Sacred Mugumo Trees" value={TREES.filter(t => t.species.includes("Mugumo") || t.species.includes("Sacred Fig")).length} icon={Heart} />
            <StatTile label="Baobabs Mapped" value={TREES.filter(t => t.species === "Baobab").length} icon={Compass} />
            <StatTile label="Highland Cedars" value={TREES.filter(t => t.species.includes("Cedar") || t.species === "Juniper").length} icon={Leaf} />
            <StatTile label="Savannah Guardians" value={TREES.filter(t => t.biome === "savannah").length} icon={Users} />
            <StatTile label="Counties Represented" value={new Set(TREES.map(t => t.county)).size} icon={BarChart3} />
          </div>
        </section>

        {/* ═══ COUNTY FILTER CHIPS ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-6">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              <CountyChip name="All Counties" count={selectedBiome ? (biomeCounts.get(selectedBiome) || 0) : TREES.length} active={!selectedCounty} onClick={() => setSelectedCounty(null)} />
              {countyCounts.map(([c, cnt]) => (
                <CountyChip key={c} name={c} count={cnt} active={selectedCounty === c} onClick={() => setSelectedCounty(selectedCounty === c ? null : c)} />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>

        {/* ═══ DATA TABS ═══ */}
        <section className="px-4 max-w-3xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-card/50 border border-primary/20 mb-4">
              <TabsTrigger value="trees">Notable Trees</TabsTrigger>
              <TabsTrigger value="species">Species Index</TabsTrigger>
            </TabsList>

            <TabsContent value="trees">
              {filtered.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground font-serif">No trees match this filter.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filtered.map(tree => (
                    <KenyaTreeCard key={tree.name} tree={tree} onMap={() => handleMapNav(tree)} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="species">
              <Card className="border-primary/10">
                <CardContent className="p-4">
                  {speciesCounts.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No species data for this filter.</p>
                  ) : (
                    speciesCounts.map(([species, count]) => (
                      <div key={species} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-serif text-foreground truncate">{species}</p>
                        </div>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden shrink-0">
                          <div className="h-full bg-primary/70 rounded-full transition-all duration-500"
                            style={{ width: `${(count / speciesCounts[0][1]) * 100}%` }} />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground w-8 text-right">{count}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* ═══ INVITATION ═══ */}
        <section className="px-4 max-w-2xl mx-auto mt-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <p className="text-lg md:text-xl font-serif text-foreground/90 leading-relaxed italic">
              "Stand beneath a Mugumo.<br />
              Guard a Baobab.<br />
              Listen to the Wind in the Cedar."
            </p>
            <Button variant="mystical" size="lg" onClick={() => navigate("/add-tree")}>
              <Plus className="w-4 h-4 mr-2" /> Start Mapping in Kenya
            </Button>
          </motion.div>
        </section>

      </div>
    </PageShell>
  );
};

export default KenyaCountryPage;
