import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  MapPin, ExternalLink, Scroll, TreeDeciduous, Eye, Compass, Heart,
  BookOpen, ChevronRight, Map as MapIcon, Footprints, Shield, BarChart3,
  Users, Award, Plus, Leaf, Crown,
} from "lucide-react";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";

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
const SpeciesRow = ({ species, common, count, maxCount }: {
  species: string; common: string | null; count: number; maxCount: number;
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
    <span className="text-xs font-medium text-muted-foreground w-8 text-right">{count}</span>
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

/* ─── Trail Cards ─── */
const TRAILS = [
  { title: "Champion Trees", desc: "The officially designated mightiest — ancient oaks, record yews, venerable sweet chestnuts.", icon: Crown, color: "42 95% 55%" },
  { title: "Ancient Friends", desc: "Trees verified by wanderers who walked, listened, and left an offering.", icon: Heart, color: "120 45% 45%" },
  { title: "Urban Sentinels", desc: "Street trees standing guard in boroughs and cities — Paul Woods' 1,000 among them.", icon: TreeDeciduous, color: "195 60% 50%" },
];

/* ─── Ecosystem highlights ─── */
const ECOSYSTEMS = [
  { name: "Ancient Woodlands", desc: "Continuously wooded since at least 1600 AD" },
  { name: "Street Trees", desc: "Urban canopy guardians in every borough" },
  { name: "Hedgerows", desc: "Living boundary lines, centuries old" },
  { name: "Churchyard Yews", desc: "Sacred sentinels older than their churches" },
  { name: "Urban Canopies", desc: "City parks, squares, and green corridors" },
];

/* ─── Paul Woods spreadsheet ─── */
const PAUL_WOODS_SHEET = "https://docs.google.com/spreadsheets/d/1Kfud8f85FTHIXY6KKeygubIGosKGQTggupqIZmfzT7w/edit?gid=1465196549#gid=1465196549";

/* ─── Research Card ─── */
const ResearchTreeCard = ({ tree, onNavigate }: { tree: ResearchTree; onNavigate: (t: ResearchTree) => void }) => {
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
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {tree.geo_precision}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{tree.locality_text}</span>
        </p>
        {(tree.height_m || tree.girth_or_stem) && (
          <div className="flex gap-3 text-xs text-muted-foreground">
            {tree.height_m && <span>H: {tree.height_m}m</span>}
            {tree.girth_or_stem && <span>G: {tree.girth_or_stem}</span>}
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
            Source {tree.source_doc_year}
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <div className="flex gap-1.5">
            {tree.latitude && (
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => onNavigate(tree)}>
                <MapIcon className="w-3 h-3 mr-1" /> Map
              </Button>
            )}
            <Button variant="sacred" size="sm" className="h-7 text-xs px-2" asChild>
              <Link to={`/map?lat=${tree.latitude}&lng=${tree.longitude}&zoom=15&research=on`}>
                <Eye className="w-3 h-3 mr-1" /> Verify
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/* ═══════════════════════════════════════════════
   MAIN: UK Country Page
   ═══════════════════════════════════════════════ */
const UKCountryPage = () => {
  const navigate = useNavigate();
  const [trees, setTrees] = useState<ResearchTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  /* Also fetch total mapped trees from the main trees table */
  const [mappedTreeCount, setMappedTreeCount] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [researchRes, mappedRes] = await Promise.all([
        supabase
          .from("research_trees")
          .select("*")
          .eq("country", "United Kingdom")
          .order("species_scientific"),
        supabase
          .from("trees")
          .select("id", { count: "exact", head: true })
          .or("nation.eq.United Kingdom,nation.eq.UK,nation.eq.GB,nation.eq.England,nation.eq.Scotland,nation.eq.Wales"),
      ]);
      if (researchRes.data) setTrees(researchRes.data as ResearchTree[]);
      setMappedTreeCount(mappedRes.count || 0);
      setLoading(false);
    };
    fetchAll();
  }, []);

  /* Computed stats */
  const filteredTrees = useMemo(() => {
    if (!selectedProvince) return trees;
    return trees.filter(t => t.province === selectedProvince);
  }, [trees, selectedProvince]);

  const totalResearch = trees.length;
  const speciesCount = new Set(trees.map(t => t.species_scientific)).size;
  const withCoords = trees.filter(t => t.latitude != null).length;
  const verifiedCount = trees.filter(t => t.status === "verified_linked").length;

  const speciesRanking = useMemo(() => {
    const map = new Map<string, { scientific: string; common: string | null; count: number }>();
    filteredTrees.forEach(t => {
      const key = t.species_scientific;
      const existing = map.get(key);
      if (existing) existing.count++;
      else map.set(key, { scientific: key, common: t.species_common, count: 1 });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredTrees]);

  const provinceCounts = useMemo(() => {
    const map = new Map<string, number>();
    trees.forEach(t => {
      const p = t.province || "Unknown";
      map.set(p, (map.get(p) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [trees]);

  const handleMapNavigate = (tree: ResearchTree) => {
    if (tree.latitude && tree.longitude) {
      navigate(`/map?lat=${tree.latitude}&lng=${tree.longitude}&zoom=15&research=on`);
    }
  };

  return (
    <PageShell>
      <div className="min-h-screen pb-24">

        {/* ═══ HERO ═══ */}
        <section className="relative px-4 pt-12 pb-10 text-center overflow-hidden">
          {/* Subtle texture overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(120_20%_8%)] via-background to-background opacity-80" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative max-w-2xl mx-auto"
          >
            <p className="text-4xl mb-3">🇬🇧</p>
            <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground mb-2">
              United Kingdom
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-serif italic mb-1">
              of Great Britain & Northern Ireland
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
              A living archive of trees, stories and street forests
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <Badge variant="outline" className="text-xs border-primary/30">
                <Scroll className="w-3 h-3 mr-1" /> Research Layer
              </Badge>
              <Badge variant="outline" className="text-xs border-primary/30">
                <BookOpen className="w-3 h-3 mr-1" /> Heritage sources
              </Badge>
              <Badge variant="outline" className="text-xs border-primary/30">
                <Shield className="w-3 h-3 mr-1" /> Provenance preserved
              </Badge>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="mystical" onClick={() => navigate("/map?research=on")}>
                <MapIcon className="w-4 h-4 mr-1" /> Open Map Layer
              </Button>
              <Button variant="sacred" onClick={() => document.getElementById("uk-trails")?.scrollIntoView({ behavior: "smooth" })}>
                <Footprints className="w-4 h-4 mr-1" /> Explore Trails
              </Button>
            </div>
          </motion.div>
        </section>

        {/* ═══ SECTION 1 — Country Overview ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-serif flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-primary" /> Arboreal Heritage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The United Kingdom cradles one of the richest arboreal stories on Earth — from the thousand-year yews
                  of Welsh churchyards to the great oaks of Sherwood, from London's street-lined planes to the ancient
                  Caledonian pine forests of Scotland. Every hedgerow hums with centuries, every park bench sits beneath
                  a living archive.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ECOSYSTEMS.map(e => (
                    <div key={e.name} className="px-3 py-2 rounded-lg bg-muted/40 border border-border/30">
                      <p className="text-xs font-serif font-medium text-foreground">{e.name}</p>
                      <p className="text-[10px] text-muted-foreground">{e.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* ═══ SECTION 2 — Tree Data Summary ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatTile label="Research Records" value={totalResearch} icon={Scroll} />
            <StatTile label="Mapped Trees" value={mappedTreeCount} icon={TreeDeciduous} />
            <StatTile label="Distinct Species" value={speciesCount} icon={BarChart3} />
            <StatTile label="With Coordinates" value={withCoords} icon={MapPin} />
            <StatTile label="Verified by Footsteps" value={verifiedCount} icon={Heart} />
            <StatTile label="Regions" value={provinceCounts.length} icon={Compass} />
          </div>
        </section>

        {/* Province filter chips */}
        {provinceCounts.length > 0 && (
          <section className="px-4 max-w-3xl mx-auto mb-6">
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                <ProvinceChip
                  name="All Regions"
                  count={totalResearch}
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
        )}

        {/* ═══ SECTION 3 — Paul Woods Featured Contribution ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-10">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="border-[hsl(42_88%_45%/0.4)] bg-gradient-to-br from-card via-card to-[hsl(42_30%_14%)] relative overflow-hidden">
              {/* Gold accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[hsl(42_95%_55%)] to-transparent" />

              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[hsl(42_95%_55%/0.15)] border border-[hsl(42_95%_55%/0.3)] flex items-center justify-center">
                    <Award className="w-6 h-6 text-[hsl(42_95%_55%)]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-serif text-foreground">
                      Paul Woods
                    </CardTitle>
                    <p className="text-xs text-[hsl(42_95%_55%)] font-medium">1,000 Street Trees</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Thank you to Paul Woods for the monumental work of recording and sharing <strong className="text-foreground">1,000 UK street trees</strong> — a living testament
                  to urban green guardianship. Each entry is a small act of noticing, an anchor of care planted in data.
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/30">
                    <p className="text-lg font-serif font-bold text-[hsl(42_95%_55%)]">1,000</p>
                    <p className="text-[10px] text-muted-foreground">Trees Recorded</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/30">
                    <p className="text-lg font-serif font-bold text-foreground">Street</p>
                    <p className="text-[10px] text-muted-foreground">Tree Focus</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/30">
                    <p className="text-lg font-serif font-bold text-foreground">Urban</p>
                    <p className="text-[10px] text-muted-foreground">Guardianship</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="mystical" size="sm" asChild>
                    <a href={PAUL_WOODS_SHEET} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Master Spreadsheet
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/map?research=on")}>
                    <MapIcon className="w-3.5 h-3.5 mr-1" /> See on Map
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* ═══ SECTION 4 — Interactive Map Embed ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-10">
          <Card className="border-primary/15 bg-card/40 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-serif flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-primary" /> UK Tree Atlas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Link
                to="/map?research=on&lat=54.5&lng=-2&zoom=5"
                className="block relative group"
              >
                <div className="h-56 md:h-72 bg-gradient-to-br from-[hsl(120_15%_12%)] to-[hsl(195_20%_10%)] flex flex-col items-center justify-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MapIcon className="w-10 h-10 text-primary/50" />
                  </div>
                  <p className="text-sm font-serif text-muted-foreground group-hover:text-primary transition-colors">
                    Enter the UK Atlas →
                  </p>
                  <div className="flex gap-3 text-[10px] text-muted-foreground/60">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(42_95%_55%)]" /> Ancient</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(120_45%_45%)]" /> Storied</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(195_60%_50%)]" /> Notable</span>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* ═══ SECTION 5 — Trails ═══ */}
        <section id="uk-trails" className="px-4 max-w-3xl mx-auto mb-10">
          <h2 className="text-lg font-serif font-bold text-foreground mb-4 flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" /> Highlights & Trails
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TRAILS.map(trail => (
              <Card key={trail.title} className="border-primary/10 hover:border-primary/30 transition-all group cursor-pointer"
                onClick={() => setActiveTab("trees")}>
                <CardContent className="p-5 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                    style={{ background: `hsl(${trail.color} / 0.12)`, border: `1px solid hsl(${trail.color} / 0.25)` }}>
                    <trail.icon className="w-5 h-5" style={{ color: `hsl(${trail.color})` }} />
                  </div>
                  <p className="text-sm font-serif font-semibold text-foreground">{trail.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{trail.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ═══ TABS: Trees / Species ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-10">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-card/50 border border-primary/20 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trees">All Trees</TabsTrigger>
              <TabsTrigger value="species">Species Index</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card className="border-primary/10">
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed font-serif italic">
                    "The oaks of England are not mere wood — they are pages in an unbroken story
                    written in heartwood and leaf. To map a tree is to read that story aloud."
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This portal gathers heritage records, community-mapped trees, and urban forestry contributions
                    into one living archive. Browse the Species Index to discover the UK's botanical richness,
                    or explore individual records in the All Trees tab.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trees">
              {loading ? (
                <p className="text-center py-12 text-muted-foreground">Loading research records…</p>
              ) : filteredTrees.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <TreeDeciduous className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-muted-foreground text-sm">No research records yet for the United Kingdom.</p>
                  <p className="text-xs text-muted-foreground/60">
                    Community-mapped trees and Paul Woods' street trees are available on the Atlas map.
                  </p>
                  <Button variant="sacred" size="sm" asChild>
                    <Link to="/map?research=on&lat=54.5&lng=-2&zoom=5">
                      <MapIcon className="w-3.5 h-3.5 mr-1" /> View on Map
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredTrees.map(tree => (
                    <ResearchTreeCard key={tree.id} tree={tree} onNavigate={handleMapNavigate} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="species">
              {speciesRanking.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">Species data will populate as records grow.</p>
              ) : (
                <Card className="border-primary/10">
                  <CardContent className="p-4">
                    {speciesRanking.slice(0, 20).map(s => (
                      <SpeciesRow
                        key={s.scientific}
                        species={s.scientific}
                        common={s.common}
                        count={s.count}
                        maxCount={speciesRanking[0].count}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* ═══ SECTION 6 — How to Contribute ═══ */}
        <section className="px-4 max-w-3xl mx-auto mb-10">
          <Card className="border-primary/20 bg-gradient-to-br from-card to-[hsl(120_15%_10%)]">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                <Plus className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-serif font-bold text-foreground">Map a Tree in the UK</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Every tree you map becomes part of this living archive. Drop a photo, share a story,
                leave an offering. The Atlas grows one footstep at a time.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="mystical" asChild>
                  <Link to="/map">
                    <Plus className="w-4 h-4 mr-1" /> Map a Tree
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/atlas">
                    <ChevronRight className="w-4 h-4 mr-1" /> Back to World Atlas
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ═══ FOOTER — Credits ═══ */}
        <section className="px-4 max-w-3xl mx-auto pb-8">
          <div className="border-t border-border/30 pt-6 space-y-3 text-center">
            <p className="text-xs text-muted-foreground/60">
              Data sources: Heritage tree registers, community contributions, urban forestry records
            </p>
            <p className="text-xs text-[hsl(42_95%_55%/0.7)] italic">
              Special thanks to Paul Woods — 1,000 Street Trees & his ongoing contribution to urban tree knowledge
            </p>
            <div className="flex justify-center gap-4 text-[10px] text-muted-foreground/40">
              <Link to="/atlas" className="hover:text-primary transition-colors">World Atlas</Link>
              <Link to="/map" className="hover:text-primary transition-colors">Full Map</Link>
              <Link to="/library" className="hover:text-primary transition-colors">Library</Link>
            </div>
          </div>
        </section>

      </div>
    </PageShell>
  );
};

export default UKCountryPage;
