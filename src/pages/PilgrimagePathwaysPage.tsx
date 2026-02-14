import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  TreeDeciduous, Sparkles, Heart, Leaf, Footprints,
  ChevronLeft, MapPin, Globe, Filter, ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import COUNTRY_REGISTRY, { getEntryByCountry } from "@/config/countryRegistry";

/* ─── Pathway definitions ─── */
export interface PathwayDef {
  slug: string;
  title: string;
  subtitle: string;
  desc: string;
  icon: React.ElementType;
  filterFn: (row: ResearchRow) => boolean;
  groupBy?: "country" | "species";
}

interface ResearchRow {
  id: string;
  country: string;
  species_common: string | null;
  species_scientific: string;
  designation_type: string;
  status: string;
  tree_name: string | null;
  locality_text: string;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  height_m: number | null;
  girth_or_stem: string | null;
  source_program: string;
  geo_precision: string;
}

export const PATHWAY_DEFS: PathwayDef[] = [
  {
    slug: "champion-trees",
    title: "Champion Trees of the World",
    subtitle: "Officially designated trees of exceptional size, age, or significance",
    desc: "Trees recognised by national champion tree programmes for outstanding physical dimensions or ecological significance.",
    icon: TreeDeciduous,
    filterFn: (r) =>
      r.designation_type.toLowerCase().includes("champion") ||
      r.source_program.toLowerCase().includes("champion"),
    groupBy: "country",
  },
  {
    slug: "oldest-living",
    title: "Oldest Living Trees",
    subtitle: "Ancient witnesses — estimated at hundreds or thousands of years",
    desc: "Records where age, girth, or cultural reputation suggest exceptional longevity. Precision varies by source.",
    icon: Sparkles,
    filterFn: (r) => {
      const girth = r.girth_or_stem;
      if (girth) {
        const match = girth.match(/(\d+[\.,]?\d*)/);
        if (match) {
          const val = parseFloat(match[1].replace(",", "."));
          if (val > 5) return true; // >5m girth suggests ancient
        }
      }
      const name = (r.tree_name || "").toLowerCase();
      const desc = (r.species_common || "").toLowerCase();
      return name.includes("ancient") || name.includes("old") || desc.includes("ancient");
    },
    groupBy: "country",
  },
  {
    slug: "sacred-cultural",
    title: "Sacred & Cultural Trees",
    subtitle: "Trees woven into spiritual practice, folklore, and community memory",
    desc: "Trees with cultural, spiritual, or heritage significance across nations and traditions.",
    icon: Heart,
    filterFn: (r) => {
      const text = `${r.tree_name || ""} ${r.designation_type} ${r.species_common || ""}`.toLowerCase();
      return (
        text.includes("sacred") ||
        text.includes("heritage") ||
        text.includes("cultural") ||
        text.includes("historic") ||
        text.includes("monument")
      );
    },
    groupBy: "country",
  },
  {
    slug: "by-species",
    title: "By Species Lineage",
    subtitle: "Follow a single species across continents",
    desc: "Oaks, baobabs, yews, eucalyptus — trace species lineages across countries and biomes.",
    icon: Leaf,
    filterFn: () => true, // show all, grouped by species
    groupBy: "species",
  },
  {
    slug: "verified",
    title: "Verified by Footsteps",
    subtitle: "Trees confirmed through in-person presence",
    desc: "Research records that have been visited, documented, and verified by wanderers. Living proof that presence matters.",
    icon: Footprints,
    filterFn: (r) => r.status === "verified_linked",
    groupBy: "country",
  },
];

const getPathway = (slug: string) => PATHWAY_DEFS.find((p) => p.slug === slug);

/* ─── Tree result card ─── */
const TreeResultCard = ({ row }: { row: ResearchRow }) => {
  const reg = getEntryByCountry(row.country);
  return (
    <Card className="border-primary/10 hover:border-primary/25 transition-all">
      <CardContent className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-serif font-medium text-foreground truncate">
              {row.tree_name || row.species_common || row.species_scientific}
            </p>
            <p className="text-[11px] text-muted-foreground truncate italic">
              {row.species_scientific}
            </p>
          </div>
          <span className="text-base shrink-0">{reg?.flag || "🌍"}</span>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          {row.province && <span>{row.province}, {row.country}</span>}
          {!row.province && <span>{row.country}</span>}
          {row.locality_text && (
            <span className="truncate max-w-[140px]">{row.locality_text}</span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/20 text-primary/70">
            {row.designation_type}
          </Badge>
          {row.girth_or_stem && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
              Girth: {row.girth_or_stem}
            </Badge>
          )}
          {row.height_m && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
              {row.height_m}m
            </Badge>
          )}
          <Badge
            variant="outline"
            className={`text-[9px] px-1.5 py-0 ${
              row.geo_precision === "exact"
                ? "border-green-500/30 text-green-400"
                : row.geo_precision === "approximate"
                ? "border-amber-500/30 text-amber-400"
                : "border-border/40 text-muted-foreground"
            }`}
          >
            {row.geo_precision}
          </Badge>
        </div>

        {row.latitude && row.longitude && (
          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 mt-1" asChild>
            <Link to={`/map?lat=${row.latitude}&lng=${row.longitude}&zoom=14&research=on`}>
              <MapPin className="w-3 h-3 mr-1" /> View on Map
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

/* ─── Group header ─── */
const GroupHeader = ({
  label,
  count,
  flag,
}: {
  label: string;
  count: number;
  flag?: string;
}) => (
  <div className="flex items-center gap-2 pt-4 pb-2 border-b border-border/30">
    {flag && <span className="text-lg">{flag}</span>}
    <h3 className="text-sm font-serif font-semibold text-foreground">{label}</h3>
    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto">
      {count}
    </Badge>
  </div>
);

/* ─── Country filter chips ─── */
const CountryChips = ({
  countries,
  active,
  onSelect,
}: {
  countries: string[];
  active: string;
  onSelect: (c: string) => void;
}) => (
  <ScrollArea className="w-full">
    <div className="flex gap-1.5 pb-2">
      <button
        onClick={() => onSelect("all")}
        className={`shrink-0 px-3 py-1 rounded-full text-xs transition-colors border ${
          active === "all"
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted"
        }`}
      >
        All Countries
      </button>
      {countries.map((c) => {
        const reg = getEntryByCountry(c);
        return (
          <button
            key={c}
            onClick={() => onSelect(c)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs transition-colors border ${
              active === c
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted"
            }`}
          >
            {reg?.flag || "🌍"} {c}
          </button>
        );
      })}
    </div>
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
);

/* ─── Species filter chips ─── */
const SpeciesChips = ({
  species,
  active,
  onSelect,
}: {
  species: string[];
  active: string;
  onSelect: (s: string) => void;
}) => (
  <ScrollArea className="w-full">
    <div className="flex gap-1.5 pb-2">
      <button
        onClick={() => onSelect("all")}
        className={`shrink-0 px-3 py-1 rounded-full text-xs transition-colors border ${
          active === "all"
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted"
        }`}
      >
        All Species
      </button>
      {species.slice(0, 30).map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className={`shrink-0 px-3 py-1 rounded-full text-xs transition-colors border ${
            active === s
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
);

/* ─── Main Page ─── */
const PilgrimagePathwaysPage = () => {
  const { pathwaySlug } = useParams<{ pathwaySlug: string }>();
  const pathway = getPathway(pathwaySlug || "");

  const [rows, setRows] = useState<ResearchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState("all");
  const [speciesFilter, setSpeciesFilter] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("research_trees")
        .select(
          "id, country, species_common, species_scientific, designation_type, status, tree_name, locality_text, province, latitude, longitude, height_m, girth_or_stem, source_program, geo_precision"
        )
        .limit(2000);

      setRows((data as ResearchRow[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  // Reset filters when pathway changes
  useEffect(() => {
    setCountryFilter("all");
    setSpeciesFilter("all");
  }, [pathwaySlug]);

  const filtered = useMemo(() => {
    if (!pathway) return [];
    let result = rows.filter(pathway.filterFn);
    if (countryFilter !== "all") result = result.filter((r) => r.country === countryFilter);
    if (speciesFilter !== "all") {
      result = result.filter(
        (r) => (r.species_common || r.species_scientific) === speciesFilter
      );
    }
    return result;
  }, [rows, pathway, countryFilter, speciesFilter]);

  const countries = useMemo(
    () => [...new Set(rows.filter(pathway?.filterFn || (() => true)).map((r) => r.country))].sort(),
    [rows, pathway]
  );

  const speciesList = useMemo(() => {
    const filtered = rows.filter(pathway?.filterFn || (() => true));
    if (countryFilter !== "all") {
      const countryFiltered = filtered.filter((r) => r.country === countryFilter);
      const counts = new Map<string, number>();
      countryFiltered.forEach((r) => {
        const name = r.species_common || r.species_scientific;
        counts.set(name, (counts.get(name) || 0) + 1);
      });
      return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
    }
    const counts = new Map<string, number>();
    filtered.forEach((r) => {
      const name = r.species_common || r.species_scientific;
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  }, [rows, pathway, countryFilter]);

  // Group results
  const grouped = useMemo(() => {
    const groups = new Map<string, ResearchRow[]>();
    const key = pathway?.groupBy || "country";
    filtered.forEach((r) => {
      const k = key === "species" ? (r.species_common || r.species_scientific) : r.country;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(r);
    });
    return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [filtered, pathway]);

  if (!pathway) {
    return (
      <PageShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-3">
            <Globe className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">Pathway not found</p>
            <Button variant="sacred" size="sm" asChild>
              <Link to="/atlas">
                <ChevronLeft className="w-3 h-3 mr-1" /> Back to Atlas
              </Link>
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  const Icon = pathway.icon;

  return (
    <PageShell>
      <div className="min-h-screen pb-24">
        {/* Header */}
        <section className="px-4 pt-6 pb-4">
          <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-xs" asChild>
            <Link to="/atlas">
              <ChevronLeft className="w-3 h-3 mr-1" /> World Atlas
            </Link>
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground">
                  {pathway.title}
                </h1>
                <p className="text-xs text-muted-foreground italic">{pathway.subtitle}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mt-2">
              {pathway.desc}
            </p>
          </motion.div>
        </section>

        {/* Filters */}
        <section className="px-4 space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Filter className="w-3 h-3" />
            <span>
              {filtered.length} tree{filtered.length !== 1 ? "s" : ""} across{" "}
              {countries.length} {countries.length === 1 ? "country" : "countries"}
            </span>
          </div>

          <CountryChips countries={countries} active={countryFilter} onSelect={setCountryFilter} />

          {pathway.groupBy === "species" && (
            <SpeciesChips
              species={speciesList}
              active={speciesFilter}
              onSelect={setSpeciesFilter}
            />
          )}
        </section>

        {/* Results */}
        <section className="px-4 max-w-3xl mx-auto">
          {loading ? (
            <p className="text-center py-12 text-muted-foreground text-sm">
              Gathering records…
            </p>
          ) : filtered.length === 0 ? (
            <Card className="border-primary/10">
              <CardContent className="py-12 text-center">
                <Icon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground italic font-serif">
                  No trees found on this pathway yet.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try removing filters or exploring other pathways.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {grouped.map(([groupName, groupRows]) => {
                const reg = getEntryByCountry(groupName);
                return (
                  <div key={groupName}>
                    <GroupHeader
                      label={groupName}
                      count={groupRows.length}
                      flag={pathway.groupBy === "country" ? reg?.flag : undefined}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                      {groupRows.slice(0, 20).map((row) => (
                        <TreeResultCard key={row.id} row={row} />
                      ))}
                    </div>
                    {groupRows.length > 20 && (
                      <p className="text-[10px] text-muted-foreground text-center pt-2 italic">
                        Showing 20 of {groupRows.length} — refine with filters above
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Provenance note */}
        <section className="px-4 max-w-2xl mx-auto mt-10 text-center">
          <p className="text-[10px] text-muted-foreground/60 italic">
            All records sourced from authoritative registers. Precision and provenance
            vary by source. A tree becomes an Ancient Friend only through living verification.
          </p>
        </section>
      </div>
    </PageShell>
  );
};

export default PilgrimagePathwaysPage;
