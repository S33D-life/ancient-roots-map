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
   TANZANIA NOTABLE TREES DATASET
   ═══════════════════════════════════════════════ */
interface TanzaniaTree {
  name: string;
  species: string;
  scientific: string;
  region: string;
  lat: number;
  lng: number;
  biome: string;
  context: string;
}

const BIOMES = [
  { key: "coastal", label: "Coastal & Zanzibar Belt", species: "Baobab, Mangrove", color: "195 55% 40%" },
  { key: "savannah", label: "Savannah & Acacia Plains", species: "Acacia, Baobab", color: "42 85% 50%" },
  { key: "rift", label: "Rift Valley & Inland Lakes", species: "Sycamore Fig", color: "270 40% 45%" },
  { key: "montane", label: "Montane Cloud Forest", species: "Podocarpus, Juniper", color: "160 35% 40%" },
  { key: "miombo", label: "Miombo Woodlands", species: "Brachystegia, Julbernardia", color: "80 40% 35%" },
];

const TREES: TanzaniaTree[] = [
  { name: "Tarangire Baobab Giant", species: "Baobab", scientific: "Adansonia digitata", region: "Manyara", lat: -3.8330, lng: 36.0000, biome: "savannah", context: "Iconic elephant corridor trees" },
  { name: "Lake Manyara Fig Elder", species: "Sycamore Fig", scientific: "Ficus sycomorus", region: "Manyara", lat: -3.5500, lng: 35.8000, biome: "rift", context: "Rift Valley lake ecosystem" },
  { name: "Serengeti Acacia Sentinel", species: "Acacia", scientific: "Vachellia spp.", region: "Mara", lat: -2.3330, lng: 34.8330, biome: "savannah", context: "Heart of the great migration" },
  { name: "Ngorongoro Crater Fig", species: "Fig", scientific: "Ficus spp.", region: "Arusha", lat: -3.1600, lng: 35.5870, biome: "rift", context: "Caldera rim ecosystem" },
  { name: "Kilimanjaro Podocarpus Giant", species: "Podocarpus", scientific: "Podocarpus latifolius", region: "Kilimanjaro", lat: -3.0670, lng: 37.3550, biome: "montane", context: "Africa's highest peak montane belt" },
  { name: "Mount Meru Juniper", species: "Juniper", scientific: "Juniperus procera", region: "Arusha", lat: -3.2500, lng: 36.7500, biome: "montane", context: "Volcanic montane forest" },
  { name: "Usambara Mountain Cedar", species: "East African Cedar", scientific: "Juniperus procera", region: "Tanga", lat: -4.8000, lng: 38.4000, biome: "montane", context: "Eastern Arc biodiversity hotspot" },
  { name: "Udzungwa Podocarpus Elder", species: "Podocarpus", scientific: "Podocarpus latifolius", region: "Morogoro", lat: -7.8000, lng: 36.8500, biome: "montane", context: "Eastern Arc Mountains rainforest" },
  { name: "Mikumi Acacia Giant", species: "Acacia", scientific: "Vachellia spp.", region: "Morogoro", lat: -7.4000, lng: 36.9000, biome: "savannah", context: "Mikumi National Park plains" },
  { name: "Selous Baobab Guardian", species: "Baobab", scientific: "Adansonia digitata", region: "Lindi", lat: -9.0000, lng: 37.5000, biome: "savannah", context: "Largest game reserve in Africa" },
  { name: "Ruaha Baobab Sentinel", species: "Baobab", scientific: "Adansonia digitata", region: "Iringa", lat: -7.7500, lng: 34.7500, biome: "savannah", context: "Ruaha River wilderness" },
  { name: "Lake Victoria Sacred Fig", species: "Sycamore Fig", scientific: "Ficus sycomorus", region: "Mwanza", lat: -2.5160, lng: 32.9000, biome: "rift", context: "Shores of Africa's largest lake" },
  { name: "Zanzibar Stone Town Baobab", species: "Baobab", scientific: "Adansonia digitata", region: "Zanzibar Urban West", lat: -6.1650, lng: 39.2026, biome: "coastal", context: "UNESCO World Heritage spice island" },
  { name: "Jozani Mangrove Elder", species: "Mangrove", scientific: "Rhizophora spp.", region: "Zanzibar South", lat: -6.2500, lng: 39.4500, biome: "coastal", context: "Red colobus monkey habitat" },
  { name: "Pangani Coastal Baobab", species: "Baobab", scientific: "Adansonia digitata", region: "Tanga", lat: -5.4300, lng: 38.9800, biome: "coastal", context: "Historic Swahili coast" },
  { name: "Katavi Miombo Giant", species: "Brachystegia", scientific: "Brachystegia spp.", region: "Katavi", lat: -6.6000, lng: 31.2000, biome: "miombo", context: "Remote western woodland wilderness" },
  { name: "Tabora Miombo Elder", species: "Brachystegia", scientific: "Brachystegia spp.", region: "Tabora", lat: -5.0160, lng: 32.8000, biome: "miombo", context: "Historic caravan route woodlands" },
  { name: "Kigoma Fig Sentinel", species: "Sycamore Fig", scientific: "Ficus sycomorus", region: "Kigoma", lat: -4.8800, lng: 29.6200, biome: "rift", context: "Lake Tanganyika shore" },
  { name: "Mahale Mountain Podocarpus", species: "Podocarpus", scientific: "Podocarpus latifolius", region: "Kigoma", lat: -6.1000, lng: 29.7500, biome: "montane", context: "Wild chimpanzee territory" },
  { name: "Rukwa Valley Acacia", species: "Acacia", scientific: "Vachellia spp.", region: "Rukwa", lat: -8.0000, lng: 31.0000, biome: "savannah", context: "Rift Valley floor savannah" },
  { name: "Lake Natron Fever Tree", species: "Fever Tree", scientific: "Vachellia xanthophloea", region: "Arusha", lat: -2.4500, lng: 36.0000, biome: "rift", context: "Flamingo breeding ground" },
  { name: "Lake Eyasi Fig", species: "Fig", scientific: "Ficus spp.", region: "Manyara", lat: -3.6000, lng: 35.1000, biome: "rift", context: "Hadzabe hunter-gatherer lands" },
  { name: "Morogoro Sacred Fig", species: "Sycamore Fig", scientific: "Ficus sycomorus", region: "Morogoro", lat: -6.8200, lng: 37.6600, biome: "rift", context: "Uluguru mountain foothills" },
  { name: "Dodoma Baobab Elder", species: "Baobab", scientific: "Adansonia digitata", region: "Dodoma", lat: -6.1630, lng: 35.7516, biome: "savannah", context: "National capital hinterland" },
  { name: "Bagamoyo Coastal Baobab", species: "Baobab", scientific: "Adansonia digitata", region: "Pwani", lat: -6.4420, lng: 38.9040, biome: "coastal", context: "Historic slave trade port" },
  { name: "Kilwa Mangrove Guardian", species: "Mangrove", scientific: "Rhizophora spp.", region: "Lindi", lat: -8.9570, lng: 39.5080, biome: "coastal", context: "UNESCO Kilwa Kisiwani ruins" },
  { name: "Mbeya Highland Podocarpus", species: "Podocarpus", scientific: "Podocarpus latifolius", region: "Mbeya", lat: -8.9000, lng: 33.4500, biome: "montane", context: "Southern highlands forest" },
  { name: "Njombe Juniper Elder", species: "Juniper", scientific: "Juniperus procera", region: "Njombe", lat: -9.3500, lng: 34.7700, biome: "montane", context: "Highland tea country" },
  { name: "Tunduru Miombo Giant", species: "Brachystegia", scientific: "Brachystegia spp.", region: "Ruvuma", lat: -11.0500, lng: 37.3500, biome: "miombo", context: "Southern woodland frontier" },
  { name: "Lake Tanganyika Fig", species: "Sycamore Fig", scientific: "Ficus sycomorus", region: "Kigoma", lat: -4.9000, lng: 29.6200, biome: "rift", context: "World's second deepest lake shore" },
  { name: "Shinyanga Acacia Sentinel", species: "Acacia", scientific: "Vachellia spp.", region: "Shinyanga", lat: -3.6600, lng: 33.4200, biome: "savannah", context: "Cotton belt savannah" },
  { name: "Pemba Island Baobab", species: "Baobab", scientific: "Adansonia digitata", region: "Zanzibar North", lat: -5.2400, lng: 39.8000, biome: "coastal", context: "Clove island heritage" },
  { name: "Mafia Island Mangrove Elder", species: "Mangrove", scientific: "Rhizophora spp.", region: "Pwani", lat: -7.9130, lng: 39.6500, biome: "coastal", context: "Marine park mangrove guardian" },
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

const RegionChip = ({ name, count, active, onClick }: {
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

const TanzaniaTreeCard = ({ tree, onMap }: { tree: TanzaniaTree; onMap: () => void }) => {
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
          <span className="truncate">{tree.region} Region</span>
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
const TanzaniaCountryPage = () => {
  const navigate = useNavigate();
  const [selectedBiome, setSelectedBiome] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("trees");

  const filtered = useMemo(() => {
    let list = TREES;
    if (selectedBiome) list = list.filter(t => t.biome === selectedBiome);
    if (selectedRegion) list = list.filter(t => t.region === selectedRegion);
    return list;
  }, [selectedBiome, selectedRegion]);

  const biomeCounts = useMemo(() => {
    const map = new Map<string, number>();
    TREES.forEach(t => map.set(t.biome, (map.get(t.biome) || 0) + 1));
    return map;
  }, []);

  const regionCounts = useMemo(() => {
    const base = selectedBiome ? TREES.filter(t => t.biome === selectedBiome) : TREES;
    const map = new Map<string, number>();
    base.forEach(t => map.set(t.region, (map.get(t.region) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [selectedBiome]);

  const speciesCounts = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(t => map.set(t.species, (map.get(t.species) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const handleMapNav = (tree: TanzaniaTree) => {
    navigate(`/map?lat=${tree.lat}&lng=${tree.lng}&zoom=14&country=tanzania&origin=atlas`);
  };

  return (
    <PageShell>
      <div className="min-h-screen pb-24">

        {/* ═══ HERO ═══ */}
        <section className="relative px-4 pt-12 pb-10 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(30_35%_12%)] via-background to-background opacity-80" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative max-w-2xl mx-auto"
          >
            <p className="text-4xl mb-3">🇹🇿</p>
            <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground mb-2">Tanzania</h1>
            <p className="text-base md:text-lg text-muted-foreground font-serif italic mb-1">
              Baobab Giants, Kilimanjaro Cedars &amp; Rift Valley Fig Elders
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
              From the Serengeti's iconic acacia silhouettes to Zanzibar's coastal baobabs and the cloud forests
              of the Eastern Arc — a living map of Tanzania's arboreal heritage.
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
              <Button variant="mystical" onClick={() => navigate("/map?country=tanzania&origin=atlas")}>
                <MapPin className="w-4 h-4 mr-1" /> Map an Ancient Friend
              </Button>
              <Button variant="sacred" onClick={() => { setSelectedBiome("savannah"); setActiveTab("trees"); }}>
                <Eye className="w-4 h-4 mr-1" /> Explore Baobab Giants
              </Button>
              <Button variant="outline" onClick={() => navigate("/map?country=tanzania")}>
                <MapIcon className="w-4 h-4 mr-1" /> View Tanzania Tree Map
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
                  Tanzania spans from the Indian Ocean's coral mangroves through vast acacia savannahs,
                  up to Africa's highest peak on Kilimanjaro, and across the Great Rift Valley's ancient lake systems
                  — each biome home to irreplaceable arboreal giants.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BIOMES.map(b => {
                    const count = biomeCounts.get(b.key) || 0;
                    return (
                      <button
                        key={b.key}
                        onClick={() => { setSelectedBiome(selectedBiome === b.key ? null : b.key); setSelectedRegion(null); }}
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
            <StatTile label="Tanzanian Ancient Friends" value={TREES.length} icon={TreeDeciduous} />
            <StatTile label="Baobabs Mapped" value={TREES.filter(t => t.species === "Baobab").length} icon={Compass} />
            <StatTile label="Rift Valley Figs" value={TREES.filter(t => t.biome === "rift").length} icon={Heart} />
            <StatTile label="Montane Giants" value={TREES.filter(t => t.biome === "montane").length} icon={Leaf} />
            <StatTile label="Coastal Guardians" value={TREES.filter(t => t.biome === "coastal").length} icon={Users} />
            <StatTile label="Regions Represented" value={new Set(TREES.map(t => t.region)).size} icon={BarChart3} />
          </div>
        </section>

        {/* ═══ REGION FILTER CHIPS ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-6">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              <RegionChip name="All Regions" count={selectedBiome ? (biomeCounts.get(selectedBiome) || 0) : TREES.length} active={!selectedRegion} onClick={() => setSelectedRegion(null)} />
              {regionCounts.map(([r, cnt]) => (
                <RegionChip key={r} name={r} count={cnt} active={selectedRegion === r} onClick={() => setSelectedRegion(selectedRegion === r ? null : r)} />
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
                    <TanzaniaTreeCard key={tree.name} tree={tree} onMap={() => handleMapNav(tree)} />
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
              "Stand beside a Baobab.<br />
              Climb into the Cloud Forest.<br />
              Listen where the Rift opens the Earth."
            </p>
            <Button variant="mystical" size="lg" onClick={() => navigate("/add-tree")}>
              <Plus className="w-4 h-4 mr-2" /> Start Mapping in Tanzania
            </Button>
          </motion.div>
        </section>

      </div>
    </PageShell>
  );
};

export default TanzaniaCountryPage;
