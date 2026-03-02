import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Globe, TreeDeciduous, MapPin, Eye, Shield, Scroll, Footprints,
  ChevronRight, Heart, BookOpen, ExternalLink, Sparkles, Compass,
  Leaf, Users, Search, X, Map as MapIcon,
} from "lucide-react";
import { useMapFocus } from "@/hooks/use-map-focus";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ContextualWhisper from "@/components/ContextualWhisper";
import COUNTRY_REGISTRY, { getEntryByCountry } from "@/config/countryRegistry";

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
}

/* ─── Pilgrimage pathways (mirrors PATHWAY_DEFS slugs) ─── */
const PATHWAYS = [
  {
    slug: "champion-trees",
    title: "Champion Trees of the World",
    desc: "Officially designated trees of exceptional size, age, or significance from national registers.",
    icon: TreeDeciduous,
  },
  {
    slug: "oldest-living",
    title: "Oldest Living Trees",
    desc: "Ancient witnesses — trees estimated at hundreds or thousands of years. Precision varies by source.",
    icon: Sparkles,
  },
  {
    slug: "sacred-cultural",
    title: "Sacred & Cultural Trees",
    desc: "Trees woven into spiritual practice, folklore, and community memory across cultures.",
    icon: Heart,
  },
  {
    slug: "by-species",
    title: "By Species Lineage",
    desc: "Follow a single species across continents — oaks, baobabs, yews, eucalyptus, and more.",
    icon: Leaf,
  },
  {
    slug: "verified",
    title: "Verified by Footsteps",
    desc: "Trees already visited and confirmed by wanderers. Living proof that presence matters.",
    icon: Footprints,
  },
];

/* ─── Process steps ─── */
const BLOOM_STEPS = [
  { num: "01", title: "Source", text: "A country's notable trees are gathered from authoritative registers — government, NGOs, academic sources." },
  { num: "02", title: "Research Layer", text: "Trees appear as research records, with citations and uncertainty preserved. Nothing is assumed." },
  { num: "03", title: "Living Verification", text: "Wanderers visit, listen, document, and verify. A tree becomes an Ancient Friend only through presence." },
  { num: "04", title: "Community Stewardship", text: "Stories, offerings, and care accumulate — without ever overwriting the original source truth." },
];

/* ─── Animated globe dots ─── */
const GlobeDots = () => {
  const dots = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      cx: 20 + Math.random() * 60,
      cy: 15 + Math.random() * 70,
      r: 1 + Math.random() * 1.5,
      delay: Math.random() * 4,
      active: i < 4,
    })),
  []);

  return (
    <svg viewBox="0 0 100 100" className="w-40 h-40 md:w-56 md:h-56 mx-auto opacity-60">
      {/* Globe circle */}
      <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary) / 0.15)" strokeWidth="0.5" />
      <ellipse cx="50" cy="50" rx="28" ry="42" fill="none" stroke="hsl(var(--primary) / 0.08)" strokeWidth="0.4" />
      <ellipse cx="50" cy="50" rx="42" ry="20" fill="none" stroke="hsl(var(--primary) / 0.08)" strokeWidth="0.4" />
      {/* Land dots */}
      {dots.map(d => (
        <motion.circle
          key={d.id}
          cx={d.cx}
          cy={d.cy}
          r={d.r}
          fill={d.active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)"}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: d.active ? [0.4, 1, 0.4] : 0.3 }}
          transition={d.active ? { duration: 3, repeat: Infinity, delay: d.delay } : {}}
        />
      ))}
    </svg>
  );
};

/* ─── Country Card ─── */
const CountryCard = ({ stat, isPioneer }: { stat: CountryStats; isPioneer?: boolean }) => {
  const { focusMap } = useMapFocus();
  const statusColors: Record<string, string> = {
    active: "bg-green-500/15 text-green-400 border-green-500/30",
    growing: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    proposed: "bg-muted text-muted-foreground border-border/40",
  };

  const handleViewOnMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    focusMap({
      type: "area",
      id: stat.slug,
      countrySlug: stat.slug,
      source: "country",
    });
  };

  return (
    <Card className={`border-primary/10 hover:border-primary/30 transition-all group ${isPioneer ? "ring-1 ring-primary/20" : ""}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{stat.flag}</span>
            <div>
              <p className="text-sm font-serif font-semibold text-foreground group-hover:text-primary transition-colors">
                {stat.country}
              </p>
              <p className="text-xs text-muted-foreground">{stat.descriptor}</p>
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColors[stat.status]}`}>
            {stat.status}
          </Badge>
        </div>

        {isPioneer && (
          <p className="text-[10px] text-primary/70 italic">Pioneer Chapter</p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <TreeDeciduous className="w-3 h-3" /> {stat.treeCount} records
          </span>
          <span className="flex items-center gap-1">
            <Scroll className="w-3 h-3" /> {stat.sourceCount} {stat.sourceCount === 1 ? "source" : "sources"}
          </span>
          {stat.verifiedCount > 0 && (
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" /> {stat.verifiedCount} verified
            </span>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          {stat.status === "active" || stat.status === "growing" ? (
            <>
              <Button variant="sacred" size="sm" className="h-7 text-xs flex-1" asChild>
                <Link to={`/atlas/${stat.slug}`}>
                  Open Atlas <ChevronRight className="w-3 h-3 ml-1" />
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
  );
};

/* ─── Main Page ─── */
const WorldAtlasPage = () => {
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [treeResults, setTreeResults] = useState<{ id: string; name: string; species: string; country: string }[]>([]);
  const [treeSearching, setTreeSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from("research_trees")
        .select("country, status, source_program");

      const countryMap = new Map<string, { treeCount: number; verifiedCount: number; sources: Set<string> }>();
      (data || []).forEach((row: any) => {
        const c = row.country;
        if (!countryMap.has(c)) countryMap.set(c, { treeCount: 0, verifiedCount: 0, sources: new Set() });
        const entry = countryMap.get(c)!;
        entry.treeCount++;
        if (row.status === "verified_linked") entry.verifiedCount++;
        entry.sources.add(row.source_program);
      });

      const stats: CountryStats[] = [];

      // Active countries (have data)
      countryMap.forEach((val, country) => {
        const reg = getEntryByCountry(country);
        stats.push({
          country,
          slug: reg?.slug || country.toLowerCase().replace(/\s+/g, "-"),
          flag: reg?.flag || "🌍",
          descriptor: reg?.descriptor || "Notable Trees",
          treeCount: val.treeCount,
          verifiedCount: val.verifiedCount,
          sourceCount: val.sources.size,
          status: "active",
        });
      });

      // Slugs that have dedicated atlas pages built
      const DEDICATED_PAGE_SLUGS = new Set([
        "south-africa", "united-kingdom", "ireland", "australia", "new-zealand",
        "japan", "india", "united-states", "brazil", "zimbabwe", "italy",
        "colombia", "greece", "canada", "china", "russia", "france",
        "nigeria", "kenya", "ethiopia", "tanzania", "dr-congo",
      ]);

      // Proposed countries (in registry but no data yet)
      COUNTRY_REGISTRY.forEach((reg) => {
        if (!countryMap.has(reg.country)) {
          const hasPage = DEDICATED_PAGE_SLUGS.has(reg.slug);
          stats.push({
            country: reg.country,
            slug: reg.slug,
            flag: reg.flag,
            descriptor: reg.descriptor,
            treeCount: 0,
            verifiedCount: 0,
            sourceCount: 0,
            status: hasPage ? "growing" : "proposed",
          });
        }
      });

      stats.sort((a, b) => {
        if (a.status === "active" && b.status !== "active") return -1;
        if (b.status === "active" && a.status !== "active") return 1;
        return b.treeCount - a.treeCount;
      });

      setCountryStats(stats);
      setLoading(false);
    };
    fetchStats();
  }, []);

  const activeCount = countryStats.filter(c => c.status === "active").length;
  const totalRecords = countryStats.reduce((s, c) => s + c.treeCount, 0);

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
    return PATHWAYS.filter(
      p => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
    );
  }, [q]);

  // Debounced tree search from research_trees
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
          id: r.id,
          name: r.tree_name || r.species_common || r.species_scientific,
          species: r.species_scientific,
          country: r.country,
        }))
      );
      setTreeSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [q]);

  const hasResults = filteredCountries.length > 0 || filteredPathways.length > 0 || treeResults.length > 0;
  const showDropdown = q.length > 0;

  return (
    <PageShell>
      <Header />
      <div className="min-h-screen pb-24 pt-16">

        {/* ─── A) Hero / Threshold ─── */}
        <section className="relative px-4 pt-10 pb-6 text-center overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl mx-auto"
          >
            <GlobeDots />

            <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground mt-4 mb-3">
              World Atlas of Notable Trees
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed italic font-serif">
              Each country, a chapter.
              <br />
              Each tree, a living witness.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-4">
              <Button variant="mystical" asChild>
                <Link to="/map">
                  <Globe className="w-4 h-4 mr-1.5" /> Open Map
                </Link>
              </Button>
              <Button variant="sacred" onClick={() => {
                document.getElementById("country-gateways")?.scrollIntoView({ behavior: "smooth" });
              }}>
                <Compass className="w-4 h-4 mr-1.5" /> Begin with a Country
              </Button>
            </div>

            <button
              onClick={() => document.getElementById("how-it-grows")?.scrollIntoView({ behavior: "smooth" })}
              className="text-xs text-muted-foreground/60 hover:text-primary transition-colors"
            >
              How this Atlas Grows ↓
            </button>
          </motion.div>
        </section>

        {/* ─── Search Bar ─── */}
        <section className="px-4 max-w-xl mx-auto mb-6 -mt-1 relative z-20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search countries, pathways, or trees…"
              className="pl-9 pr-8 bg-card/70 backdrop-blur border-primary/15 focus:border-primary/40 font-serif text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Results dropdown */}
            {showDropdown && (
              <Card className="absolute top-full mt-1.5 left-0 right-0 border-primary/20 bg-card/95 backdrop-blur shadow-lg overflow-hidden z-30">
                <CardContent className="p-0 max-h-72 overflow-y-auto">
                  {!hasResults && !treeSearching && (
                    <p className="py-6 text-center text-xs text-muted-foreground italic">No results found</p>
                  )}

                  {/* Countries */}
                  {filteredCountries.length > 0 && (
                    <div>
                      <p className="px-3 pt-2.5 pb-1 text-[10px] font-sans uppercase tracking-wider text-muted-foreground/60">Countries</p>
                      {filteredCountries.map(c => (
                         <Link
                          key={c.country}
                          to={(c.status === "active" || c.status === "growing") ? `/atlas/${c.slug}` : "#"}
                          onClick={() => setSearchQuery("")}
                          className="flex items-center gap-2.5 px-3 py-2 hover:bg-primary/5 transition-colors"
                        >
                          <span className="text-lg">{c.flag}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-serif text-foreground truncate">{c.country}</p>
                            <p className="text-[10px] text-muted-foreground">{c.treeCount} records · {c.status}</p>
                          </div>
                          {c.status === "active" && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />}
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Pathways */}
                  {filteredPathways.length > 0 && (
                    <div>
                      <p className="px-3 pt-2.5 pb-1 text-[10px] font-sans uppercase tracking-wider text-muted-foreground/60">Pathways</p>
                      {filteredPathways.map(p => (
                        <Link
                          key={p.slug}
                          to={`/atlas/pathways/${p.slug}`}
                          onClick={() => setSearchQuery("")}
                          className="flex items-center gap-2.5 px-3 py-2 hover:bg-primary/5 transition-colors"
                        >
                          <div className="p-1 rounded bg-primary/10">
                            <p.icon className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-serif text-foreground truncate">{p.title}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{p.desc}</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Trees */}
                  {treeResults.length > 0 && (
                    <div>
                      <p className="px-3 pt-2.5 pb-1 text-[10px] font-sans uppercase tracking-wider text-muted-foreground/60">Trees</p>
                      {treeResults.map(t => (
                        <Link
                          key={t.id}
                          to={`/discovery?search=${encodeURIComponent(t.name)}`}
                          onClick={() => setSearchQuery("")}
                          className="flex items-center gap-2.5 px-3 py-2 hover:bg-primary/5 transition-colors"
                        >
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

                  {treeSearching && (
                    <p className="py-3 text-center text-[10px] text-muted-foreground animate-pulse">Searching trees…</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* ─── B) Context Panel ─── */}
        <section className="px-4 max-w-2xl mx-auto mb-10">
          <Card className="border-primary/15 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                This atlas weaves together authoritative tree registers, heritage lists,
                and ecological records from around the world. These records live as{" "}
                <span className="text-primary font-medium">Research Layers</span> — a tree
                becomes an Ancient Friend only through in-person presence, photos, and reflection.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                  </div>
                  Provenance preserved
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Eye className="w-3.5 h-3.5 text-primary" />
                  </div>
                  Precision respected
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Footprints className="w-3.5 h-3.5 text-primary" />
                  </div>
                  Living verification
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Whisper: search hint */}
        <ContextualWhisper
          id="atlas-search-hint"
          message="Use the search bar above to find any country, pathway, or tree by name."
          delay={4000}
          position="top-center"
        />

        {/* ─── C + D) Country Gateways ─── */}
        <section id="country-gateways" className="px-4 max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-serif font-bold text-foreground">Country Chapters</h2>
              <p className="text-xs text-muted-foreground">
                {activeCount} active · {totalRecords.toLocaleString()} research records
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-center py-12 text-muted-foreground text-sm">Gathering chapters…</p>
          ) : countryStats.length === 0 ? (
            <Card className="border-primary/10">
              <CardContent className="py-12 text-center">
                <Globe className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground italic font-serif">
                  The atlas is quiet for now. The first chapters are being written.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {countryStats.map(stat => (
                <CountryCard
                  key={stat.country}
                  stat={stat}
                  isPioneer={stat.country === "South Africa" && stat.status === "active"}
                />
              ))}
            </div>
          )}
        </section>

        {/* Whisper: country chapter hint */}
        <ContextualWhisper
          id="atlas-country-hint"
          message="Each country is a chapter. Tap one to explore its trees, sources, and stories."
          delay={10000}
          position="bottom-center"
        />

        {/* ─── E) Pilgrimage Pathways ─── */}
        <section className="px-4 max-w-3xl mx-auto mb-12">
          <h2 className="text-lg font-serif font-bold text-foreground mb-1">
            Paths through the Living World
          </h2>
          <p className="text-xs text-muted-foreground mb-4 italic">
            Global pathways — cross-country, cross-lineage, cross-time
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PATHWAYS.map(p => (
              <Link key={p.slug} to={`/atlas/pathways/${p.slug}`} className="block">
                <Card className="border-primary/10 hover:border-primary/25 transition-all group h-full">
                  <CardContent className="p-4 flex gap-3">
                    <div className="p-2 rounded-lg bg-primary/8 shrink-0 self-start">
                      <p.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-serif font-medium text-foreground mb-0.5 group-hover:text-primary transition-colors">
                        {p.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary shrink-0 self-center transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Whisper: pathways hint */}
        <ContextualWhisper
          id="atlas-pathways-hint"
          message="Pathways cross borders — follow champion trees, sacred groves, or a single species across the world."
          delay={18000}
          position="bottom-left"
        />

        {/* ─── F) How a Country Blooms ─── */}
        <section id="how-it-grows" className="px-4 max-w-2xl mx-auto mb-12">
          <h2 className="text-lg font-serif font-bold text-foreground mb-1">
            How a Country Blooms
          </h2>
          <p className="text-xs text-muted-foreground mb-6 italic">
            From source document to living stewardship
          </p>

          <div className="space-y-4">
            {BLOOM_STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex gap-4"
              >
                <div className="shrink-0 w-8 h-8 rounded-full border border-primary/25 bg-primary/5 flex items-center justify-center">
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

        {/* ─── G) Propose a Country ─── */}
        <section className="px-4 max-w-2xl mx-auto mb-12">
          <Card className="border-primary/15 bg-card/40 text-center">
            <CardContent className="py-8 space-y-3">
              <p className="text-sm font-serif text-muted-foreground italic">
                Not all chapters are written yet.
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                If you know of a national tree register, heritage list, or ecological inventory
                that should appear here, we'd love to hear about it.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Button variant="sacred" size="sm">
                  <Scroll className="w-3.5 h-3.5 mr-1" /> Propose a Country
                </Button>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Contribute a Source
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─── H) Footer Ethos ─── */}
        <section className="px-4 max-w-2xl mx-auto text-center mb-8">
          <p className="text-sm font-serif text-muted-foreground/70 italic leading-relaxed mb-6">
            This atlas does not claim the world.
            <br />
            It listens to it.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/library/resources">
                <BookOpen className="w-3.5 h-3.5 mr-1" /> Tree Resources
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/map">
                <MapPin className="w-3.5 h-3.5 mr-1" /> Ancient Friends Map
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/council-of-life">
                <Users className="w-3.5 h-3.5 mr-1" /> Council of Life
              </Link>
            </Button>
          </div>
        </section>
      </div>
      <BottomNav />
    </PageShell>
  );
};

export default WorldAtlasPage;
