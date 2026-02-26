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

interface EthiopiaTree {
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
  { key: "church", label: "Church Forest Ecosystems", species: "Juniperus procera, Podocarpus falcatus", color: "270 35% 45%" },
  { key: "highland", label: "Ethiopian Highlands", species: "Juniper, Hagenia", color: "160 40% 38%" },
  { key: "rift", label: "Rift Valley", species: "Sycamore Fig", color: "42 85% 50%" },
  { key: "acacia", label: "Acacia Woodlands & Savannah", species: "Acacia, Boswellia", color: "30 70% 45%" },
  { key: "montane", label: "Bale & Montane Cloud Forest", species: "Podocarpus, Afrocarpus", color: "140 45% 35%" },
];

const TREES: EthiopiaTree[] = [
  { name: "Debre Damo Juniper Elder", species: "African Juniper", scientific: "Juniperus procera", region: "Tigray", lat: 14.3720, lng: 39.2680, biome: "church", context: "Monastic island forest guardian" },
  { name: "Lalibela Church Forest Juniper", species: "African Juniper", scientific: "Juniperus procera", region: "Amhara", lat: 12.0310, lng: 39.0470, biome: "church", context: "Rock-hewn church forest" },
  { name: "Zege Peninsula Sacred Fig", species: "Sycamore Fig", scientific: "Ficus sycomorus", region: "Amhara", lat: 11.6660, lng: 37.3160, biome: "rift", context: "Lake Tana monastery peninsula" },
  { name: "Lake Tana Podocarpus Giant", species: "Podocarpus", scientific: "Podocarpus falcatus", region: "Amhara", lat: 12.0000, lng: 37.3000, biome: "church", context: "Island monastery forest" },
  { name: "Addis Entoto Juniper", species: "African Juniper", scientific: "Juniperus procera", region: "Addis Ababa", lat: 9.0800, lng: 38.7500, biome: "highland", context: "Entoto Hills eucalyptus-juniper mosaic" },
  { name: "Wondo Genet Ancient Podocarpus", species: "Podocarpus", scientific: "Podocarpus falcatus", region: "Oromia", lat: 7.0900, lng: 38.6000, biome: "montane", context: "Hot springs forest remnant" },
  { name: "Bale Mountains Afrocarpus", species: "Afrocarpus", scientific: "Afrocarpus gracilior", region: "Oromia", lat: 6.8400, lng: 39.7000, biome: "montane", context: "Harenna Forest cloud zone" },
  { name: "Konso Sacred Tree", species: "Sycamore Fig", scientific: "Ficus sycomorus", region: "SNNPR", lat: 5.2500, lng: 37.4830, biome: "rift", context: "UNESCO Konso cultural landscape" },
  { name: "Axum Sacred Fig", species: "Sycamore Fig", scientific: "Ficus sycomorus", region: "Tigray", lat: 14.1300, lng: 38.7200, biome: "church", context: "Ancient Aksumite kingdom" },
  { name: "Simien Mountains Juniper", species: "African Juniper", scientific: "Juniperus procera", region: "Amhara", lat: 13.1830, lng: 38.0660, biome: "highland", context: "UNESCO World Heritage mountain range" },
  { name: "Gonder Church Forest Podocarpus", species: "Podocarpus", scientific: "Podocarpus falcatus", region: "Amhara", lat: 12.6000, lng: 37.4660, biome: "church", context: "Royal Fasil Ghebbi precinct" },
  { name: "Jimma Rainforest Fig", species: "Fig", scientific: "Ficus spp.", region: "Oromia", lat: 7.6660, lng: 36.8330, biome: "montane", context: "Birthplace of coffee heritage" },
  { name: "Sheka Forest Podocarpus", species: "Podocarpus", scientific: "Podocarpus falcatus", region: "SNNPR", lat: 7.0000, lng: 35.5000, biome: "montane", context: "UNESCO Biosphere Reserve" },
  { name: "Harar Ancient Acacia", species: "Acacia", scientific: "Vachellia spp.", region: "Harari", lat: 9.3120, lng: 42.1250, biome: "acacia", context: "Walled city of Harar" },
  { name: "Rift Valley Boswellia", species: "Frankincense Tree", scientific: "Boswellia papyrifera", region: "Tigray", lat: 13.5000, lng: 38.2000, biome: "acacia", context: "Ancient frankincense trade route" },
  { name: "Blue Nile Gorge Fig", species: "Sycamore Fig", scientific: "Ficus sycomorus", region: "Amhara", lat: 11.0000, lng: 37.0000, biome: "rift", context: "Dramatic gorge ecosystem" },
  { name: "Debre Libanos Juniper", species: "African Juniper", scientific: "Juniperus procera", region: "Oromia", lat: 9.7000, lng: 38.2000, biome: "church", context: "Historic monastery cliff-forest" },
  { name: "Lalibela Podocarpus", species: "Podocarpus", scientific: "Podocarpus falcatus", region: "Amhara", lat: 12.0320, lng: 39.0480, biome: "church", context: "UNESCO rock-hewn churches" },
  { name: "Awash Acacia Sentinel", species: "Acacia", scientific: "Vachellia spp.", region: "Afar", lat: 8.9000, lng: 40.2000, biome: "acacia", context: "Awash National Park rift floor" },
  { name: "Gambella Forest Fig", species: "Fig", scientific: "Ficus spp.", region: "Gambella", lat: 8.2500, lng: 34.5830, biome: "montane", context: "Western lowland forest" },
  { name: "Kaffa Forest Ancient Podocarpus", species: "Podocarpus", scientific: "Podocarpus falcatus", region: "SNNPR", lat: 7.2500, lng: 36.2000, biome: "montane", context: "Wild coffee origin forest" },
  { name: "Debre Tabor Sacred Fig", species: "Sycamore Fig", scientific: "Ficus sycomorus", region: "Amhara", lat: 11.8500, lng: 38.0160, biome: "church", context: "Medieval royal capital" },
  { name: "Bahir Dar Church Juniper", species: "African Juniper", scientific: "Juniperus procera", region: "Amhara", lat: 11.6000, lng: 37.3830, biome: "church", context: "Lake Tana shore monastery" },
  { name: "Arba Minch Fig Elder", species: "Sycamore Fig", scientific: "Ficus sycomorus", region: "SNNPR", lat: 6.0300, lng: 37.5500, biome: "rift", context: "Forty Springs groundwater forest" },
  { name: "Mekelle Juniper", species: "African Juniper", scientific: "Juniperus procera", region: "Tigray", lat: 13.5000, lng: 39.4700, biome: "highland", context: "Tigray highland capital" },
  { name: "Gheralta Forest Juniper", species: "African Juniper", scientific: "Juniperus procera", region: "Tigray", lat: 14.2500, lng: 39.4500, biome: "church", context: "Sandstone cliff-top churches" },
  { name: "Metema Boswellia", species: "Frankincense Tree", scientific: "Boswellia papyrifera", region: "Amhara", lat: 12.9500, lng: 36.1500, biome: "acacia", context: "Sudan border lowland woodlands" },
  { name: "Wolkite Sacred Fig", species: "Sycamore Fig", scientific: "Ficus sycomorus", region: "SNNPR", lat: 8.2830, lng: 37.7830, biome: "rift", context: "Gurage zone ceremonial tree" },
  { name: "Lake Hawassa Fig", species: "Sycamore Fig", scientific: "Ficus sycomorus", region: "SNNPR", lat: 7.0500, lng: 38.4660, biome: "rift", context: "Rift Valley lakeside" },
  { name: "Tana Monastery Juniper", species: "African Juniper", scientific: "Juniperus procera", region: "Amhara", lat: 11.9000, lng: 37.3000, biome: "church", context: "Lake Tana island monastery" },
  { name: "Borena Acacia Elder", species: "Acacia", scientific: "Vachellia spp.", region: "Oromia", lat: 4.5000, lng: 38.5000, biome: "acacia", context: "Southern pastoral rangelands" },
  { name: "Sidama Podocarpus", species: "Podocarpus", scientific: "Podocarpus falcatus", region: "Sidama", lat: 6.9600, lng: 38.4000, biome: "montane", context: "Sidama agroforestry heritage" },
  { name: "Lalibela Sycamore Guardian", species: "Sycamore Fig", scientific: "Ficus sycomorus", region: "Amhara", lat: 12.0300, lng: 39.0460, biome: "church", context: "Living guardian of the rock churches" },
];

/* ─── Helpers ─── */
const StatTile = ({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ElementType }) => (
  <Card className="border-primary/15 bg-card/60 backdrop-blur-sm">
    <CardContent className="p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary/10"><Icon className="w-4 h-4 text-primary" /></div>
      <div>
        <p className="text-xl font-serif font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

const RegionChip = ({ name, count, active, onClick }: { name: string; count: number; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card/60 text-muted-foreground border-border/40 hover:border-primary/40"}`}>
    {name} <span className="opacity-70">({count})</span>
  </button>
);

const EthiopiaTreeCard = ({ tree, onMap }: { tree: EthiopiaTree; onMap: () => void }) => {
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
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0" style={{ borderColor: `hsl(${biome.color} / 0.5)`, color: `hsl(${biome.color})` }}>
              {biome.label}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{tree.region}</span></p>
        {tree.context && <p className="text-[11px] text-muted-foreground/70 italic">{tree.context}</p>}
        <div className="flex items-center justify-between pt-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={onMap}><MapIcon className="w-3 h-3 mr-1" /> View on Map</Button>
          <Button variant="sacred" size="sm" className="h-7 text-xs px-2" disabled><Sparkles className="w-3 h-3 mr-1" /> Mint Ancient Friend</Button>
        </div>
      </CardContent>
    </Card>
  );
};

/* ═══ MAIN ═══ */
const EthiopiaCountryPage = () => {
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

  const biomeCounts = useMemo(() => { const m = new Map<string, number>(); TREES.forEach(t => m.set(t.biome, (m.get(t.biome) || 0) + 1)); return m; }, []);
  const regionCounts = useMemo(() => {
    const base = selectedBiome ? TREES.filter(t => t.biome === selectedBiome) : TREES;
    const m = new Map<string, number>(); base.forEach(t => m.set(t.region, (m.get(t.region) || 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [selectedBiome]);
  const speciesCounts = useMemo(() => {
    const m = new Map<string, number>(); filtered.forEach(t => m.set(t.species, (m.get(t.species) || 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const handleMapNav = (tree: EthiopiaTree) => navigate(`/map?lat=${tree.lat}&lng=${tree.lng}&zoom=14&country=ethiopia&origin=atlas`);

  return (
    <PageShell>
      <div className="min-h-screen pb-24">

        {/* HERO */}
        <section className="relative px-4 pt-12 pb-10 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(270_20%_10%)] via-background to-background opacity-80" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative max-w-2xl mx-auto">
            <p className="text-4xl mb-3">🇪🇹</p>
            <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground mb-2">Ethiopia</h1>
            <p className="text-base md:text-lg text-muted-foreground font-serif italic mb-1">Church Forest Guardians, Highland Junipers &amp; Rift Valley Fig Elders</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">From the sacred church forests of Amhara to the frankincense woodlands of Tigray — a living map of Ethiopia's arboreal heritage.</p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <Badge variant="outline" className="text-xs border-primary/30"><TreeDeciduous className="w-3 h-3 mr-1" /> {TREES.length} Notable Trees</Badge>
              <Badge variant="outline" className="text-xs border-primary/30"><Leaf className="w-3 h-3 mr-1" /> {BIOMES.length} Biomes</Badge>
              <Badge variant="outline" className="text-xs border-primary/30"><Shield className="w-3 h-3 mr-1" /> Cultural Heritage</Badge>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="mystical" onClick={() => navigate("/map?country=ethiopia&origin=atlas")}><MapPin className="w-4 h-4 mr-1" /> Map an Ancient Friend</Button>
              <Button variant="sacred" onClick={() => { setSelectedBiome("church"); setActiveTab("trees"); }}><Eye className="w-4 h-4 mr-1" /> Explore Church Forests</Button>
              <Button variant="outline" onClick={() => navigate("/map?country=ethiopia")}><MapIcon className="w-4 h-4 mr-1" /> View Ethiopia Tree Map</Button>
            </div>
          </motion.div>
        </section>

        {/* BIOME OVERVIEW */}
        <section className="px-4 max-w-3xl mx-auto mb-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base font-serif flex items-center gap-2"><Leaf className="w-4 h-4 text-primary" /> Biome Overview</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">Ethiopia's arboreal heritage is unique on Earth — over a thousand church forests survive as sacred green islands, each surrounding an Orthodox church. Beyond these living temples lie the Simien and Bale highlands, the Great Rift Valley, and the frankincense woodlands of the north.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BIOMES.map(b => {
                    const count = biomeCounts.get(b.key) || 0;
                    return (
                      <button key={b.key} onClick={() => { setSelectedBiome(selectedBiome === b.key ? null : b.key); setSelectedRegion(null); }}
                        className={`text-left px-4 py-3 rounded-lg border transition-all ${selectedBiome === b.key ? "border-primary bg-primary/10" : "border-border/30 bg-muted/30 hover:border-primary/40"}`}>
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

        {/* METRICS */}
        <section className="px-4 max-w-3xl mx-auto mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatTile label="Ethiopian Ancient Friends" value={TREES.length} icon={TreeDeciduous} />
            <StatTile label="Church Forest Trees" value={TREES.filter(t => t.biome === "church").length} icon={Heart} />
            <StatTile label="Sacred Figs Mapped" value={TREES.filter(t => t.species.includes("Fig")).length} icon={Compass} />
            <StatTile label="Highland Junipers" value={TREES.filter(t => t.species.includes("Juniper")).length} icon={Leaf} />
            <StatTile label="Montane Guardians" value={TREES.filter(t => t.biome === "montane").length} icon={Users} />
            <StatTile label="Regions Represented" value={new Set(TREES.map(t => t.region)).size} icon={BarChart3} />
          </div>
        </section>

        {/* REGION CHIPS */}
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

        {/* DATA TABS */}
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
                  {filtered.map(tree => <EthiopiaTreeCard key={tree.name} tree={tree} onMap={() => handleMapNav(tree)} />)}
                </div>
              )}
            </TabsContent>
            <TabsContent value="species">
              <Card className="border-primary/10">
                <CardContent className="p-4">
                  {speciesCounts.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No species data for this filter.</p>
                  ) : speciesCounts.map(([species, count]) => (
                    <div key={species} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
                      <p className="flex-1 text-sm font-serif text-foreground truncate">{species}</p>
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden shrink-0">
                        <div className="h-full bg-primary/70 rounded-full transition-all duration-500" style={{ width: `${(count / speciesCounts[0][1]) * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* INVITATION */}
        <section className="px-4 max-w-2xl mx-auto mt-12 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4">
            <p className="text-lg md:text-xl font-serif text-foreground/90 leading-relaxed italic">
              "Walk into a Church Forest.<br />Stand beside a Highland Juniper.<br />Listen where stone churches meet living trees."
            </p>
            <Button variant="mystical" size="lg" onClick={() => navigate("/add-tree")}>
              <Plus className="w-4 h-4 mr-2" /> Start Mapping in Ethiopia
            </Button>
          </motion.div>
        </section>

      </div>
    </PageShell>
  );
};

export default EthiopiaCountryPage;
