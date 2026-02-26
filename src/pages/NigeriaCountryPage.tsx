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
   NIGERIA NOTABLE TREES DATASET
   ═══════════════════════════════════════════════ */
interface NigeriaTree {
  name: string;
  species: string;
  scientific: string;
  state: string;
  lat: number;
  lng: number;
  biome: string;
  context: string;
}

const BIOMES = [
  { key: "sahel", label: "Sahel & Savannah", species: "Baobab, Tamarind, Shea", color: "42 85% 50%" },
  { key: "rainforest", label: "Rainforest Belt", species: "Iroko, Mahogany, Ceiba", color: "140 45% 35%" },
  { key: "sacred", label: "Sacred Groves", species: "Iroko, Fig", color: "270 40% 45%" },
  { key: "delta", label: "River & Delta Systems", species: "Mangrove", color: "195 55% 40%" },
  { key: "highland", label: "Highland Forest", species: "Juniper, Fig", color: "160 35% 40%" },
];

const TREES: NigeriaTree[] = [
  { name: "Osun-Osogbo Sacred Grove Iroko", species: "Iroko", scientific: "Milicia excelsa", state: "Osun", lat: 7.7596, lng: 4.5560, biome: "sacred", context: "UNESCO-listed sacred forest" },
  { name: "Osun-Osogbo Sacred Grove Baobab", species: "Baobab", scientific: "Adansonia digitata", state: "Osun", lat: 7.7588, lng: 4.5555, biome: "sacred", context: "Within the UNESCO sacred grove complex" },
  { name: "Oke Idanre Silk Cotton Tree", species: "Ceiba", scientific: "Ceiba pentandra", state: "Ondo", lat: 7.0935, lng: 5.1180, biome: "rainforest", context: "Ancient hilltop settlement" },
  { name: "Olumo Rock Iroko", species: "Iroko", scientific: "Milicia excelsa", state: "Ogun", lat: 7.1600, lng: 3.3489, biome: "sacred", context: "Historic rock fortress" },
  { name: "Ogbunike Cave Mahogany", species: "African Mahogany", scientific: "Khaya ivorensis", state: "Anambra", lat: 6.1875, lng: 6.8525, biome: "rainforest", context: "Sacred cave system forest" },
  { name: "Lekki Conservation Mahogany", species: "African Mahogany", scientific: "Khaya ivorensis", state: "Lagos", lat: 6.4352, lng: 3.5355, biome: "rainforest", context: "Coastal conservation zone" },
  { name: "Badagry Ancient Baobab", species: "Baobab", scientific: "Adansonia digitata", state: "Lagos", lat: 6.4150, lng: 2.8890, biome: "sahel", context: "Historic slave route heritage" },
  { name: "Erin Ijesha Sacred Fig", species: "Fig", scientific: "Ficus thonningii", state: "Osun", lat: 7.6250, lng: 4.8910, biome: "sacred", context: "Near Olumirin Waterfalls" },
  { name: "Cross River Iroko Elder", species: "Iroko", scientific: "Milicia excelsa", state: "Cross River", lat: 5.5300, lng: 8.7700, biome: "rainforest", context: "Primary rainforest remnant" },
  { name: "Awhum Waterfall Fig", species: "Fig", scientific: "Ficus spp.", state: "Enugu", lat: 6.5400, lng: 7.4300, biome: "sacred", context: "Sacred waterfall monastery" },
  { name: "Kano Emir's Palace Baobab", species: "Baobab", scientific: "Adansonia digitata", state: "Kano", lat: 12.0022, lng: 8.5920, biome: "sahel", context: "Historic emirate grounds" },
  { name: "Zaria Tamarind", species: "Tamarind", scientific: "Tamarindus indica", state: "Kaduna", lat: 11.0667, lng: 7.7000, biome: "sahel", context: "Ancient walled city" },
  { name: "Gashaka Mahogany Giant", species: "African Mahogany", scientific: "Khaya ivorensis", state: "Taraba", lat: 7.8500, lng: 11.7000, biome: "rainforest", context: "Gashaka-Gumti National Park" },
  { name: "Yankari Baobab", species: "Baobab", scientific: "Adansonia digitata", state: "Bauchi", lat: 9.7500, lng: 10.5000, biome: "sahel", context: "Yankari National Park" },
  { name: "Oyo-Ile Sacred Iroko", species: "Iroko", scientific: "Milicia excelsa", state: "Oyo", lat: 8.0167, lng: 3.9167, biome: "sacred", context: "Capital of the old Oyo Empire" },
  { name: "Ife Sacred Fig", species: "Fig", scientific: "Ficus spp.", state: "Osun", lat: 7.4820, lng: 4.5600, biome: "sacred", context: "Cradle of Yoruba civilisation" },
  { name: "Nsukka Udala Tree", species: "Udala", scientific: "Chrysophyllum albidum", state: "Enugu", lat: 6.8570, lng: 7.3958, biome: "rainforest", context: "University town elder" },
  { name: "Calabar Mahogany", species: "African Mahogany", scientific: "Khaya ivorensis", state: "Cross River", lat: 4.9580, lng: 8.3260, biome: "rainforest", context: "Historic port city" },
  { name: "Lokoja Confluence Baobab", species: "Baobab", scientific: "Adansonia digitata", state: "Kogi", lat: 7.8020, lng: 6.7330, biome: "sahel", context: "Where Niger & Benue rivers meet" },
  { name: "Aso Rock Acacia", species: "Acacia", scientific: "Acacia spp.", state: "FCT", lat: 9.0765, lng: 7.3986, biome: "sahel", context: "Near the seat of government" },
  { name: "Okomu Iroko", species: "Iroko", scientific: "Milicia excelsa", state: "Edo", lat: 6.3600, lng: 5.2000, biome: "rainforest", context: "Okomu National Park" },
  { name: "Ibadan Ceiba", species: "Ceiba", scientific: "Ceiba pentandra", state: "Oyo", lat: 7.4440, lng: 3.9019, biome: "rainforest", context: "One of West Africa's largest cities" },
  { name: "Jos Plateau Juniper", species: "Juniper", scientific: "Juniperus procera", state: "Plateau", lat: 9.9300, lng: 8.8900, biome: "highland", context: "Highland plateau ecosystem" },
  { name: "Bida Sacred Shea", species: "Shea", scientific: "Vitellaria paradoxa", state: "Niger", lat: 9.0800, lng: 6.0100, biome: "sahel", context: "Nupe kingdom heritage" },
  { name: "Epe Lagoon Mangrove", species: "Mangrove", scientific: "Rhizophora spp.", state: "Lagos", lat: 6.5830, lng: 3.9830, biome: "delta", context: "Lagoon ecosystem guardian" },
  { name: "Obudu Forest Fig", species: "Fig", scientific: "Ficus spp.", state: "Cross River", lat: 6.3700, lng: 9.3800, biome: "highland", context: "Obudu Plateau montane forest" },
  { name: "Ilorin Baobab", species: "Baobab", scientific: "Adansonia digitata", state: "Kwara", lat: 8.5000, lng: 4.5500, biome: "sahel", context: "Gateway between north and south" },
  { name: "Ijebu Ode Silk Cotton", species: "Ceiba", scientific: "Ceiba pentandra", state: "Ogun", lat: 6.8170, lng: 3.9200, biome: "rainforest", context: "Historic Ijebu kingdom" },
  { name: "Birnin Kebbi Baobab", species: "Baobab", scientific: "Adansonia digitata", state: "Kebbi", lat: 12.4500, lng: 4.2000, biome: "sahel", context: "Northwestern savannah elder" },
  { name: "Benin Moat Iroko", species: "Iroko", scientific: "Milicia excelsa", state: "Edo", lat: 6.3350, lng: 5.6037, biome: "sacred", context: "Along the ancient Benin city walls" },
  { name: "Aba Udala", species: "Udala", scientific: "Chrysophyllum albidum", state: "Abia", lat: 5.1160, lng: 7.3660, biome: "rainforest", context: "Eastern heartland" },
  { name: "Maiduguri Tamarind", species: "Tamarind", scientific: "Tamarindus indica", state: "Borno", lat: 11.8469, lng: 13.1603, biome: "sahel", context: "Sahel gateway sentinel" },
  { name: "Sagbama Mangrove Guardian", species: "Mangrove", scientific: "Rhizophora spp.", state: "Bayelsa", lat: 5.1667, lng: 6.2667, biome: "delta", context: "Niger Delta waterway guardian" },
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

const BiomeChip = ({ biome, count, active, onClick }: {
  biome: typeof BIOMES[number]; count: number; active: boolean; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-card/60 text-muted-foreground border-border/40 hover:border-primary/40"
    }`}
  >
    {biome.label} <span className="opacity-70">({count})</span>
  </button>
);

const StateChip = ({ name, count, active, onClick }: {
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

/* ─── Tree Card ─── */
const NigeriaTreeCard = ({ tree, onMap }: { tree: NigeriaTree; onMap: () => void }) => {
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
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 shrink-0"
              style={{ borderColor: `hsl(${biome.color} / 0.5)`, color: `hsl(${biome.color})` }}
            >
              {biome.label}
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{tree.state} State</span>
        </p>

        {tree.context && (
          <p className="text-[11px] text-muted-foreground/70 italic">{tree.context}</p>
        )}

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
const NigeriaCountryPage = () => {
  const navigate = useNavigate();
  const [selectedBiome, setSelectedBiome] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("trees");

  const filtered = useMemo(() => {
    let list = TREES;
    if (selectedBiome) list = list.filter(t => t.biome === selectedBiome);
    if (selectedState) list = list.filter(t => t.state === selectedState);
    return list;
  }, [selectedBiome, selectedState]);

  const biomeCounts = useMemo(() => {
    const map = new Map<string, number>();
    TREES.forEach(t => map.set(t.biome, (map.get(t.biome) || 0) + 1));
    return map;
  }, []);

  const stateCounts = useMemo(() => {
    const base = selectedBiome ? TREES.filter(t => t.biome === selectedBiome) : TREES;
    const map = new Map<string, number>();
    base.forEach(t => map.set(t.state, (map.get(t.state) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [selectedBiome]);

  const speciesCounts = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(t => map.set(t.species, (map.get(t.species) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const handleMapNav = (tree: NigeriaTree) => {
    navigate(`/map?lat=${tree.lat}&lng=${tree.lng}&zoom=14&country=nigeria&origin=atlas`);
  };

  return (
    <PageShell>
      <div className="min-h-screen pb-24">

        {/* ═══ HERO ═══ */}
        <section className="relative px-4 pt-12 pb-10 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(35_30%_10%)] via-background to-background opacity-80" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative max-w-2xl mx-auto"
          >
            <p className="text-4xl mb-3">🇳🇬</p>
            <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground mb-2">
              Nigeria
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-serif italic mb-1">
              Savannah Sentinels, Sacred Groves &amp; Rainforest Giants
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
              From the ancient baobabs of the Sahel to the sacred irokos of Osun — a living map of Nigeria's arboreal heritage.
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
              <Button variant="mystical" onClick={() => navigate("/map?country=nigeria&origin=atlas")}>
                <MapPin className="w-4 h-4 mr-1" /> Map an Ancient Friend
              </Button>
              <Button variant="sacred" onClick={() => { setSelectedBiome("sacred"); setActiveTab("trees"); }}>
                <Eye className="w-4 h-4 mr-1" /> Explore Sacred Groves
              </Button>
              <Button variant="outline" onClick={() => navigate("/map?country=nigeria")}>
                <MapIcon className="w-4 h-4 mr-1" /> View Nigeria Tree Map
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
                  Nigeria spans five major ecological zones — from the arid Sahel scrublands in the north to the tropical
                  rainforest belt in the south, with sacred groves, highland plateaus, and the Niger Delta's vast mangrove
                  systems woven between them.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BIOMES.map(b => {
                    const count = biomeCounts.get(b.key) || 0;
                    return (
                      <button
                        key={b.key}
                        onClick={() => { setSelectedBiome(selectedBiome === b.key ? null : b.key); setSelectedState(null); }}
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
            <StatTile label="Nigerian Ancient Friends" value={TREES.length} icon={TreeDeciduous} />
            <StatTile label="Baobabs Mapped" value={TREES.filter(t => t.species === "Baobab").length} icon={Compass} />
            <StatTile label="Irokos Mapped" value={TREES.filter(t => t.species === "Iroko").length} icon={Leaf} />
            <StatTile label="Sacred Grove Trees" value={TREES.filter(t => t.biome === "sacred").length} icon={Heart} />
            <StatTile label="Mangrove Guardians" value={TREES.filter(t => t.biome === "delta").length} icon={Users} />
            <StatTile label="States Represented" value={new Set(TREES.map(t => t.state)).size} icon={BarChart3} />
          </div>
        </section>

        {/* ═══ STATE FILTER CHIPS ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-6">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              <StateChip name="All States" count={selectedBiome ? (biomeCounts.get(selectedBiome) || 0) : TREES.length} active={!selectedState} onClick={() => setSelectedState(null)} />
              {stateCounts.map(([s, cnt]) => (
                <StateChip key={s} name={s} count={cnt} active={selectedState === s} onClick={() => setSelectedState(selectedState === s ? null : s)} />
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
                    <NigeriaTreeCard key={tree.name} tree={tree} onMap={() => handleMapNav(tree)} />
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
                          <div
                            className="h-full bg-primary/70 rounded-full transition-all duration-500"
                            style={{ width: `${(count / speciesCounts[0][1]) * 100}%` }}
                          />
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
              "Become a Guardian of the Baobab.<br />
              Map an Iroko.<br />
              Listen beneath a Sacred Fig."
            </p>
            <Button variant="mystical" size="lg" onClick={() => navigate("/add-tree")}>
              <Plus className="w-4 h-4 mr-2" /> Start Mapping in Nigeria
            </Button>
          </motion.div>
        </section>

      </div>
    </PageShell>
  );
};

export default NigeriaCountryPage;
