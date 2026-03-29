/**
 * AtlasCountryWallPage — Visual tile-wall for browsing countries.
 * Calm, spacious grid of country portals with tree counts and flags.
 */
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search, TreeDeciduous, Globe, ArrowUpDown, Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import PageShell from "@/components/PageShell";
import COUNTRY_REGISTRY, { getEntryByCountry } from "@/config/countryRegistry";
import { getDatasetsByCountry } from "@/config/datasetIntegration";

/* ─── Types ─── */
interface CountryTile {
  country: string;
  slug: string;
  flag: string;
  descriptor: string;
  treeCount: number;
  verifiedCount: number;
  status: "active" | "growing" | "proposed";
  portalSubtitle?: string;
}

type SortMode = "alpha" | "trees" | "recent";

const SORT_LABELS: Record<SortMode, string> = {
  alpha: "A → Z",
  trees: "Most Trees",
  recent: "Recently Active",
};

/* ─── Country Tile Component ─── */
const CountryTileCard = ({ tile, index }: { tile: CountryTile; index: number }) => {
  const isActive = tile.status === "active" || tile.status === "growing";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.6) }}
    >
      <Link
        to={isActive ? `/atlas/${tile.slug}` : "#"}
        className={`group block rounded-2xl border transition-all duration-300 overflow-hidden ${
          isActive
            ? "border-border/20 hover:border-primary/25 hover:shadow-[0_4px_24px_hsl(var(--primary)/0.06)] cursor-pointer"
            : "border-border/10 opacity-60 cursor-default pointer-events-none"
        }`}
        onClick={e => !isActive && e.preventDefault()}
      >
        {/* Card body */}
        <div className="relative p-5 pb-4 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm">
          {/* Subtle botanical texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.015] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 70% 30%, hsl(var(--primary) / 0.3) 0%, transparent 60%)`,
            }}
          />

          {/* Flag + name */}
          <div className="flex items-start gap-3 mb-3">
            <span
              className="text-3xl shrink-0 block w-10 h-10 flex items-center justify-center rounded-full bg-secondary/30"
              role="img"
              aria-label={`${tile.country} flag`}
            >
              {tile.flag}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="font-serif text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors truncate">
                {tile.country}
              </h3>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">
                {tile.descriptor}
              </p>
            </div>
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
            {tile.treeCount > 0 && (
              <span className="flex items-center gap-1">
                <TreeDeciduous className="w-3 h-3 text-primary/40" />
                {tile.treeCount.toLocaleString()} {tile.treeCount === 1 ? "tree" : "trees"}
              </span>
            )}
            {tile.verifiedCount > 0 && (
              <span className="flex items-center gap-1 text-primary/50">
                ✦ {tile.verifiedCount} verified
              </span>
            )}
            {tile.treeCount === 0 && (
              <span className="italic text-muted-foreground/40 font-serif">Awaiting first seeds…</span>
            )}
          </div>

          {/* Subtitle preview */}
          {tile.portalSubtitle && (
            <p className="mt-2.5 text-[11px] text-muted-foreground/40 font-serif italic leading-relaxed line-clamp-2">
              {tile.portalSubtitle}
            </p>
          )}

          {/* Bottom edge accent */}
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/8 to-transparent" />
        </div>
      </Link>
    </motion.div>
  );
};

/* ─── Main Page ─── */
const AtlasCountryWallPage = () => {
  const [tiles, setTiles] = useState<CountryTile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("trees");

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from("research_trees")
        .select("country, status");

      const countryMap = new Map<string, { treeCount: number; verifiedCount: number }>();
      (data || []).forEach((row: any) => {
        const c = row.country;
        if (!countryMap.has(c)) countryMap.set(c, { treeCount: 0, verifiedCount: 0 });
        const entry = countryMap.get(c)!;
        entry.treeCount++;
        if (row.status === "verified_linked") entry.verifiedCount++;
      });

      const result: CountryTile[] = [];

      // Countries with data
      countryMap.forEach((val, country) => {
        const reg = getEntryByCountry(country);
        const slug = reg?.slug || country.toLowerCase().replace(/\s+/g, "-");
        const datasets = getDatasetsByCountry(slug);

        result.push({
          country,
          slug,
          flag: reg?.flag || "🌍",
          descriptor: reg?.descriptor || "Notable Trees",
          treeCount: val.treeCount,
          verifiedCount: val.verifiedCount,
          status: "active",
          portalSubtitle: reg?.portalSubtitle || datasets[0]?.portalSubtitle,
        });
      });

      // Registered countries without data
      COUNTRY_REGISTRY.forEach(reg => {
        if (!countryMap.has(reg.country)) {
          result.push({
            country: reg.country,
            slug: reg.slug,
            flag: reg.flag,
            descriptor: reg.descriptor,
            treeCount: 0,
            verifiedCount: 0,
            status: "growing",
            portalSubtitle: reg.portalSubtitle,
          });
        }
      });

      setTiles(result);
      setLoading(false);
    };
    fetchStats();
  }, []);

  // Filter + sort
  const displayed = useMemo(() => {
    let result = tiles;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        t => t.country.toLowerCase().includes(q) || t.descriptor.toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      // Active before growing/proposed
      if (a.status === "active" && b.status !== "active") return -1;
      if (b.status === "active" && a.status !== "active") return 1;

      switch (sortMode) {
        case "alpha":
          return a.country.localeCompare(b.country);
        case "trees":
          return b.treeCount - a.treeCount;
        case "recent":
          return b.verifiedCount - a.verifiedCount || b.treeCount - a.treeCount;
        default:
          return 0;
      }
    });
  }, [tiles, search, sortMode]);

  const totalCountries = tiles.filter(t => t.status === "active").length;
  const totalTrees = tiles.reduce((s, t) => s + t.treeCount, 0);

  const cycleSortMode = () => {
    const modes: SortMode[] = ["trees", "alpha", "recent"];
    const idx = modes.indexOf(sortMode);
    setSortMode(modes[(idx + 1) % modes.length]);
  };

  return (
    <PageShell>
      <Header />
      <div className="min-h-screen pb-24 pt-16">
        {/* Hero */}
        <section className="px-4 pt-8 pb-2 text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Globe className="w-10 h-10 text-primary/30 mx-auto mb-3" />
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
              Browse by Country
            </h1>
            <p className="text-sm text-muted-foreground/70 max-w-md mx-auto leading-relaxed italic font-serif mb-4">
              Each tile is a portal to a land's arboreal heritage. Enter any country to explore its living atlas.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground/50 mb-6">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-primary/40" /> {totalCountries} countries active
              </span>
              <span className="flex items-center gap-1">
                <TreeDeciduous className="w-3 h-3 text-primary/40" /> {totalTrees.toLocaleString()} records
              </span>
            </div>
          </motion.div>
        </section>

        {/* Controls */}
        <section className="px-4 max-w-5xl mx-auto mb-6">
          <div className="flex items-center gap-3 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search countries…"
                className="pl-9 bg-card/60 border-border/20 focus:border-primary/30 font-serif text-sm h-10"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={cycleSortMode}
              className="h-10 px-3 text-xs text-muted-foreground/60 hover:text-foreground gap-1.5 shrink-0"
              title={`Sort: ${SORT_LABELS[sortMode]}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{SORT_LABELS[sortMode]}</span>
            </Button>
          </div>
        </section>

        {/* Tile Grid */}
        <section className="px-4 max-w-6xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/10 overflow-hidden">
                  <div className="p-5 pb-4 space-y-3 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted/40 shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3.5 w-3/4 rounded bg-muted/40" />
                        <div className="h-2.5 w-1/2 rounded bg-muted/30" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-2.5 w-16 rounded bg-muted/25" />
                      <div className="h-2.5 w-12 rounded bg-muted/25" />
                    </div>
                    <div className="h-2.5 w-full rounded bg-muted/15" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm text-muted-foreground/50 font-serif">No countries match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {displayed.map((tile, i) => (
                <CountryTileCard key={tile.slug} tile={tile} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* Back to Atlas link */}
        <section className="text-center pt-10">
          <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground/40 hover:text-primary">
            <Link to="/atlas">← Back to World Atlas</Link>
          </Button>
        </section>
      </div>
    </PageShell>
  );
};

export default AtlasCountryWallPage;
