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

interface DRCTree {
  name: string;
  species: string;
  scientific: string;
  province: string;
  lat: number;
  lng: number;
  biome: string;
  context: string;
}

const BIOMES = [
  { key: "basin", label: "Congo Basin Rainforest", species: "Iroko, Mahogany, Kapok", color: "140 50% 30%" },
  { key: "ituri", label: "Ituri & Okapi Forest", species: "African Teak, Iroko", color: "160 45% 35%" },
  { key: "river", label: "River & Floodplain Systems", species: "Ficus species", color: "195 55% 40%" },
  { key: "montane", label: "Montane & Albertine Rift", species: "Podocarpus, Hagenia", color: "270 40% 45%" },
  { key: "miombo", label: "Miombo Woodland (Southern DRC)", species: "Brachystegia", color: "42 85% 50%" },
];

const TREES: DRCTree[] = [
  { name: "Ituri Forest Iroko Elder", species: "Iroko", scientific: "Milicia excelsa", province: "Ituri", lat: 1.5000, lng: 29.5000, biome: "ituri", context: "Core habitat of the Okapi Reserve" },
  { name: "Okapi Reserve Mahogany Giant", species: "African Mahogany", scientific: "Khaya anthotheca", province: "Ituri", lat: 1.4000, lng: 28.9000, biome: "ituri", context: "UNESCO Okapi Wildlife Reserve" },
  { name: "Virunga Montane Podocarpus", species: "Podocarpus", scientific: "Podocarpus latifolius", province: "North Kivu", lat: -1.4500, lng: 29.5500, biome: "montane", context: "Virunga National Park montane belt" },
  { name: "Mount Nyiragongo Highland Tree", species: "Hagenia", scientific: "Hagenia abyssinica", province: "North Kivu", lat: -1.5200, lng: 29.2500, biome: "montane", context: "Active volcano highland forest" },
  { name: "Salonga Kapok Giant", species: "Kapok", scientific: "Ceiba pentandra", province: "Tshuapa", lat: -1.7500, lng: 21.5000, biome: "basin", context: "Largest tropical forest reserve in Africa" },
  { name: "Salonga Iroko Sentinel", species: "Iroko", scientific: "Milicia excelsa", province: "Tshuapa", lat: -1.9000, lng: 21.3000, biome: "basin", context: "Deep Salonga rainforest interior" },
  { name: "Lomami Forest Teak Elder", species: "African Teak", scientific: "Pericopsis elata", province: "Maniema", lat: -1.3000, lng: 24.5000, biome: "basin", context: "Lomami National Park" },
  { name: "Congo River Fig Guardian", species: "Ficus", scientific: "Ficus spp.", province: "Équateur", lat: 0.5000, lng: 18.5000, biome: "river", context: "Congo River floodplain gallery forest" },
  { name: "Kisangani Rainforest Mahogany", species: "African Mahogany", scientific: "Khaya anthotheca", province: "Tshopo", lat: 0.5200, lng: 25.2000, biome: "basin", context: "Research centre for tropical ecology" },
  { name: "Boyoma Falls Sacred Fig", species: "Ficus", scientific: "Ficus spp.", province: "Tshopo", lat: 0.5700, lng: 25.2000, biome: "river", context: "Sacred fig near Stanley Falls" },
  { name: "Mai-Ndombe Forest Giant", species: "Iroko", scientific: "Milicia excelsa", province: "Mai-Ndombe", lat: -2.0000, lng: 18.0000, biome: "basin", context: "Lake Mai-Ndombe lowland forest" },
  { name: "Yangambi Research Forest Elder", species: "African Mahogany", scientific: "Khaya anthotheca", province: "Tshopo", lat: 0.7700, lng: 24.4700, biome: "basin", context: "UNESCO Biosphere Reserve research station" },
  { name: "Kahuzi-Biéga Montane Podocarpus", species: "Podocarpus", scientific: "Podocarpus latifolius", province: "South Kivu", lat: -2.3000, lng: 28.7500, biome: "montane", context: "Grauer's gorilla habitat" },
  { name: "Lake Kivu Highland Tree", species: "Hagenia", scientific: "Hagenia abyssinica", province: "South Kivu", lat: -2.2000, lng: 28.9000, biome: "montane", context: "Albertine Rift highland lakeshore" },
  { name: "Garamba Savanna Acacia", species: "Acacia", scientific: "Vachellia spp.", province: "Haut-Uélé", lat: 4.1000, lng: 29.2500, biome: "river", context: "Northern savanna-forest mosaic" },
  { name: "Upemba Miombo Giant", species: "Brachystegia", scientific: "Brachystegia spp.", province: "Haut-Katanga", lat: -8.7500, lng: 26.5000, biome: "miombo", context: "Upemba National Park woodland" },
  { name: "Kundelungu Plateau Woodland Elder", species: "Brachystegia", scientific: "Brachystegia spp.", province: "Haut-Katanga", lat: -10.3000, lng: 27.7000, biome: "miombo", context: "Kundelungu Plateau endemic woodland" },
  { name: "Lubumbashi Miombo Sentinel", species: "Brachystegia", scientific: "Brachystegia spp.", province: "Haut-Katanga", lat: -11.6500, lng: 27.4800, biome: "miombo", context: "Southern mining belt woodland" },
  { name: "Basankusu Forest Fig", species: "Ficus", scientific: "Ficus spp.", province: "Équateur", lat: 1.2300, lng: 19.8000, biome: "river", context: "Maringa-Lopori river confluence" },
  { name: "Boma Coastal Mangrove", species: "Mangrove", scientific: "Rhizophora spp.", province: "Kongo Central", lat: -5.8500, lng: 13.0500, biome: "river", context: "Congo estuary mangrove fringe" },
  { name: "Matadi River Fig", species: "Ficus", scientific: "Ficus spp.", province: "Kongo Central", lat: -5.8160, lng: 13.4700, biome: "river", context: "Lower Congo rapids gallery forest" },
  { name: "Kwango Woodland Elder", species: "Brachystegia", scientific: "Brachystegia spp.", province: "Kwango", lat: -6.0000, lng: 17.5000, biome: "miombo", context: "Southern savanna-woodland transition" },
  { name: "Sankuru Rainforest Giant", species: "Iroko", scientific: "Milicia excelsa", province: "Sankuru", lat: -2.5000, lng: 23.5000, biome: "basin", context: "Central basin deep forest" },
  { name: "Uvira Rift Highland Tree", species: "Podocarpus", scientific: "Podocarpus latifolius", province: "South Kivu", lat: -3.4000, lng: 29.1500, biome: "montane", context: "Western shore of Lake Tanganyika" },
  { name: "Gbadolite Forest Sentinel", species: "Mahogany", scientific: "Khaya anthotheca", province: "Nord-Ubangi", lat: 4.2800, lng: 21.0000, biome: "basin", context: "Northern equatorial forest" },
  { name: "Lisala Congo River Fig", species: "Ficus", scientific: "Ficus spp.", province: "Mongala", lat: 2.1500, lng: 21.5000, biome: "river", context: "Congo River bend gallery forest" },
  { name: "Tshikapa Woodland Giant", species: "Brachystegia", scientific: "Brachystegia spp.", province: "Kasaï", lat: -6.4200, lng: 20.8000, biome: "miombo", context: "Diamond country woodland" },
  { name: "Kananga Forest Elder", species: "Iroko", scientific: "Milicia excelsa", province: "Kasaï Central", lat: -5.8900, lng: 22.4100, biome: "basin", context: "Central province forest island" },
  { name: "Beni Ituri Giant", species: "Mahogany", scientific: "Khaya anthotheca", province: "North Kivu", lat: 0.5000, lng: 29.4500, biome: "ituri", context: "Northern Kivu forest corridor" },
  { name: "Mbandaka Floodplain Fig", species: "Ficus", scientific: "Ficus spp.", province: "Équateur", lat: 0.0500, lng: 18.2600, biome: "river", context: "Equator-crossing Congo River port" },
  { name: "Aru Ituri Elder", species: "Iroko", scientific: "Milicia excelsa", province: "Ituri", lat: 2.8300, lng: 30.8700, biome: "ituri", context: "Northeastern Ituri forest fringe" },
  { name: "Bukavu Montane Guardian", species: "Podocarpus", scientific: "Podocarpus latifolius", province: "South Kivu", lat: -2.5000, lng: 28.8600, biome: "montane", context: "Lake Kivu highland guardian" },
  { name: "Congo Basin Kapok Titan", species: "Kapok", scientific: "Ceiba pentandra", province: "Tshuapa", lat: -1.6000, lng: 21.7000, biome: "basin", context: "Emergent canopy giant of the central basin" },
];

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

const DRCTreeCard = ({ tree, onMap }: { tree: DRCTree; onMap: () => void }) => {
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
          <span className="truncate">{tree.province} Province</span>
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

const DRCongoCountryPage = () => {
  const navigate = useNavigate();
  const [selectedBiome, setSelectedBiome] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("trees");

  const filtered = useMemo(() => {
    let list = TREES;
    if (selectedBiome) list = list.filter(t => t.biome === selectedBiome);
    if (selectedProvince) list = list.filter(t => t.province === selectedProvince);
    return list;
  }, [selectedBiome, selectedProvince]);

  const biomeCounts = useMemo(() => {
    const map = new Map<string, number>();
    TREES.forEach(t => map.set(t.biome, (map.get(t.biome) || 0) + 1));
    return map;
  }, []);

  const provinceCounts = useMemo(() => {
    const base = selectedBiome ? TREES.filter(t => t.biome === selectedBiome) : TREES;
    const map = new Map<string, number>();
    base.forEach(t => map.set(t.province, (map.get(t.province) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [selectedBiome]);

  const speciesCounts = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(t => map.set(t.species, (map.get(t.species) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const handleMapNav = (tree: DRCTree) => {
    navigate(`/map?lat=${tree.lat}&lng=${tree.lng}&zoom=14&country=dr-congo&origin=atlas`);
  };

  return (
    <PageShell>
      <div className="min-h-screen pb-24">

        {/* ═══ HERO ═══ */}
        <section className="relative px-4 pt-12 pb-10 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(145_40%_10%)] via-background to-background opacity-80" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative max-w-2xl mx-auto"
          >
            <p className="text-4xl mb-3">🇨🇩</p>
            <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground mb-2">Democratic Republic of the Congo</h1>
            <p className="text-base md:text-lg text-muted-foreground font-serif italic mb-1">
              Congo Basin Giants, Okapi Forest Elders &amp; River Guardians
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
              From the world's second-largest rainforest through the Albertine Rift highlands to the mighty Congo River's
              floodplain figs — a living map of DR Congo's arboreal heritage.
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
              <Button variant="mystical" onClick={() => navigate("/map?country=dr-congo&origin=atlas")}>
                <MapPin className="w-4 h-4 mr-1" /> Map an Ancient Friend
              </Button>
              <Button variant="sacred" onClick={() => { setSelectedBiome("basin"); setActiveTab("trees"); }}>
                <Eye className="w-4 h-4 mr-1" /> Explore Congo Basin Giants
              </Button>
              <Button variant="outline" onClick={() => navigate("/map?country=dr-congo")}>
                <MapIcon className="w-4 h-4 mr-1" /> View DR Congo Tree Map
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
                  The Democratic Republic of the Congo holds the heart of the world's second-largest tropical rainforest,
                  spanning from the Albertine Rift's montane highlands through the vast Congo Basin to the miombo
                  woodlands of the south — each biome home to irreplaceable arboreal giants.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BIOMES.map(b => {
                    const count = biomeCounts.get(b.key) || 0;
                    return (
                      <button
                        key={b.key}
                        onClick={() => { setSelectedBiome(selectedBiome === b.key ? null : b.key); setSelectedProvince(null); }}
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
            <StatTile label="DR Congo Ancient Friends" value={TREES.length} icon={TreeDeciduous} />
            <StatTile label="Congo Basin Giants" value={TREES.filter(t => t.biome === "basin").length} icon={Compass} />
            <StatTile label="Montane Rift Trees" value={TREES.filter(t => t.biome === "montane").length} icon={Heart} />
            <StatTile label="River Guardians" value={TREES.filter(t => t.biome === "river").length} icon={Leaf} />
            <StatTile label="Miombo Protectors" value={TREES.filter(t => t.biome === "miombo").length} icon={Users} />
            <StatTile label="Provinces Represented" value={new Set(TREES.map(t => t.province)).size} icon={BarChart3} />
          </div>
        </section>

        {/* ═══ PROVINCE FILTER CHIPS ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-6">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              <ProvinceChip name="All Provinces" count={selectedBiome ? (biomeCounts.get(selectedBiome) || 0) : TREES.length} active={!selectedProvince} onClick={() => setSelectedProvince(null)} />
              {provinceCounts.map(([p, cnt]) => (
                <ProvinceChip key={p} name={p} count={cnt} active={selectedProvince === p} onClick={() => setSelectedProvince(selectedProvince === p ? null : p)} />
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
                    <DRCTreeCard key={tree.name} tree={tree} onMap={() => handleMapNav(tree)} />
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
              "Walk into the Congo Basin.<br />
              Stand beside a Forest Giant.<br />
              Listen where the River breathes."
            </p>
            <Button variant="mystical" size="lg" onClick={() => navigate("/add-tree")}>
              <Plus className="w-4 h-4 mr-2" /> Start Mapping in DR Congo
            </Button>
          </motion.div>
        </section>

      </div>
    </PageShell>
  );
};

export default DRCongoCountryPage;
