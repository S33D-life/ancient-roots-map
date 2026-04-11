/**
 * CuratorSpeciesPage — Review and resolve unmatched species strings.
 * Shows trees with null species_key, lets curators assign canonical matches.
 * Includes confidence filtering, bulk actions, and status marking.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Check, AlertTriangle, TreeDeciduous, Database, Code, HelpCircle, Globe, Tag } from "lucide-react";
import { toast } from "sonner";
import { useHasRole } from "@/hooks/use-role";
import { resolveSpeciesSync, enrichFromGBIF, type MatchConfidence } from "@/services/speciesResolver";

type CurationStatus = "unresolved" | "custom_local" | "needs_gbif" | "resolved" | "intentionally_unresolved" | "needs_field_verification" | "resolved_locally";
type ResolutionType = "ambiguous_multi_species" | "generic_common_name" | "unknown" | "custom_poetic" | "genus_level" | null;
type SortMode = "count" | "alpha";
type FilterMode = "all" | "unresolved" | "exact" | "fuzzy" | "ambiguous" | "genus" | "poetic" | "unknown";

interface UnresolvedTree {
  id: string;
  name: string;
  species: string;
  species_key: string | null;
  metadata: { resolution_type?: string } | null;
}

interface SpeciesCandidate {
  species_key: string;
  common_name: string;
  scientific_name: string;
  family: string | null;
  synonym_names: string[] | null;
}

interface GroupMeta {
  speciesStr: string;
  trees: UnresolvedTree[];
  confidence: MatchConfidence;
  source: "db" | "hardcoded" | "unresolved";
  suggestedCandidate: SpeciesCandidate | null;
  curationStatus: CurationStatus;
  resolutionType: ResolutionType;
}

const CONFIDENCE_COLORS: Record<MatchConfidence, string> = {
  exact: "bg-primary/20 text-primary border-primary/30",
  fuzzy: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  unresolved: "bg-destructive/15 text-destructive border-destructive/30",
};

const CONFIDENCE_ICONS: Record<MatchConfidence, React.ReactNode> = {
  exact: <Database className="w-3 h-3" />,
  fuzzy: <Code className="w-3 h-3" />,
  unresolved: <HelpCircle className="w-3 h-3" />,
};

const CuratorSpeciesPage = () => {
  const { hasRole, loading: roleLoading } = useHasRole("curator");
  const [trees, setTrees] = useState<UnresolvedTree[]>([]);
  const [candidates, setCandidates] = useState<SpeciesCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unresolved" | "exact" | "fuzzy">("unresolved");
  const [sortMode, setSortMode] = useState<SortMode>("count");
  const [assigning, setAssigning] = useState<string | null>(null);
  const [markedStatuses, setMarkedStatuses] = useState<Record<string, CurationStatus>>({});

  const fetchTrees = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("trees")
      .select("id, name, species, species_key")
      .order("species", { ascending: true })
      .limit(500);

    if (filter === "unresolved") {
      query = query.is("species_key", null);
    }

    if (search) {
      query = query.ilike("species", `%${search}%`);
    }

    const { data } = await query;
    setTrees((data as UnresolvedTree[]) || []);
    setLoading(false);
  }, [filter, search]);

  const fetchCandidates = useCallback(async () => {
    const { data } = await supabase
      .from("species_index")
      .select("species_key, common_name, scientific_name, family, synonym_names")
      .order("common_name", { ascending: true })
      .limit(1000);
    setCandidates((data as SpeciesCandidate[]) || []);
  }, []);

  useEffect(() => {
    fetchTrees();
    fetchCandidates();
  }, [fetchTrees, fetchCandidates]);

  // Find best candidate match for a species string
  const findBestMatch = useCallback((species: string): SpeciesCandidate | null => {
    const norm = species.toLowerCase().trim();
    return (
      candidates.find((c) => c.common_name.toLowerCase() === norm) ||
      candidates.find((c) => c.scientific_name?.toLowerCase() === norm) ||
      candidates.find((c) => (c.synonym_names as unknown as string[])?.some(s => s.toLowerCase() === norm)) ||
      candidates.find((c) => c.common_name.toLowerCase().includes(norm) || norm.includes(c.common_name.toLowerCase())) ||
      null
    );
  }, [candidates]);

  // Group trees by species string with resolution metadata
  const groups: GroupMeta[] = useMemo(() => {
    const grouped: Record<string, UnresolvedTree[]> = {};
    for (const tree of trees) {
      const key = tree.species.toLowerCase().trim();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(tree);
    }

    return Object.entries(grouped).map(([, treesInGroup]) => {
      const speciesStr = treesInGroup[0].species;
      const resolution = resolveSpeciesSync(speciesStr);
      const suggestedCandidate = findBestMatch(speciesStr);
      const isResolved = treesInGroup.every(t => t.species_key !== null);

      return {
        speciesStr,
        trees: treesInGroup,
        confidence: resolution.confidence,
        source: resolution.source,
        suggestedCandidate,
        curationStatus: markedStatuses[speciesStr.toLowerCase().trim()] || (isResolved ? "resolved" : "unresolved"),
      };
    });
  }, [trees, findBestMatch, markedStatuses]);

  // Apply confidence filter
  const filteredGroups = useMemo(() => {
    let result = groups;
    if (filter === "exact") result = result.filter(g => g.confidence === "exact");
    if (filter === "fuzzy") result = result.filter(g => g.confidence === "fuzzy");
    if (filter === "unresolved") result = result.filter(g => g.confidence === "unresolved" || g.curationStatus === "unresolved");

    if (sortMode === "count") {
      result = [...result].sort((a, b) => b.trees.length - a.trees.length);
    } else {
      result = [...result].sort((a, b) => a.speciesStr.localeCompare(b.speciesStr));
    }
    return result;
  }, [groups, filter, sortMode]);

  const assignSpeciesKey = async (treeIds: string[], speciesKey: string) => {
    setAssigning(treeIds[0]);
    let success = 0;
    for (const id of treeIds) {
      const { error } = await supabase
        .from("trees")
        .update({ species_key: speciesKey })
        .eq("id", id);
      if (!error) success++;
    }
    if (success > 0) {
      toast.success(`Assigned species key to ${success} tree${success > 1 ? "s" : ""}`);
      setTrees((prev) => prev.map(t => treeIds.includes(t.id) ? { ...t, species_key: speciesKey } : t));
    }
    setAssigning(null);
  };

  const markStatus = (speciesStr: string, status: CurationStatus) => {
    setMarkedStatuses(prev => ({ ...prev, [speciesStr.toLowerCase().trim()]: status }));
    toast.success(`Marked "${speciesStr}" as ${status.replace("_", " ")}`);
  };

  // Stats
  const stats = useMemo(() => ({
    total: trees.length,
    resolved: trees.filter(t => t.species_key !== null).length,
    unresolved: trees.filter(t => t.species_key === null).length,
    uniqueStrings: groups.length,
    exactMatches: groups.filter(g => g.confidence === "exact").length,
    fuzzyMatches: groups.filter(g => g.confidence === "fuzzy").length,
    unresolvedMatches: groups.filter(g => g.confidence === "unresolved").length,
  }), [trees, groups]);

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasRole) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-4" />
          <p className="text-muted-foreground font-serif">Curator access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-serif text-primary tracking-wide">Species Curation</h1>
          <p className="text-sm text-muted-foreground font-serif">
            Resolve unmatched species strings to canonical species_index entries
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap items-center gap-2 text-sm font-serif">
          <Badge variant="outline" className="gap-1.5">
            <TreeDeciduous className="w-3 h-3" />
            {stats.total} trees loaded
          </Badge>
          <Badge variant="outline" className={CONFIDENCE_COLORS.exact}>
            {CONFIDENCE_ICONS.exact} {stats.exactMatches} exact
          </Badge>
          <Badge variant="outline" className={CONFIDENCE_COLORS.fuzzy}>
            {CONFIDENCE_ICONS.fuzzy} {stats.fuzzyMatches} fuzzy
          </Badge>
          <Badge variant="outline" className={CONFIDENCE_COLORS.unresolved}>
            {CONFIDENCE_ICONS.unresolved} {stats.unresolvedMatches} unresolved
          </Badge>
          <Badge variant="outline">{stats.uniqueStrings} unique strings</Badge>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search species strings..."
              className="pl-9 font-serif"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-40 font-serif">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unresolved">Unresolved</SelectItem>
              <SelectItem value="fuzzy">Fuzzy matches</SelectItem>
              <SelectItem value="exact">Exact matches</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <SelectTrigger className="w-36 font-serif">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="count">Most trees</SelectItem>
              <SelectItem value="alpha">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchTrees} className="font-serif">
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="font-serif gap-1.5"
            disabled={loading}
            onClick={async () => {
              // Collect unresolved species strings that look like GBIF candidates
              const gbifCandidates = filteredGroups
                .filter(g => g.curationStatus === "unresolved" || g.curationStatus === "needs_gbif")
                .map(g => g.speciesStr)
                .filter(s => {
                  // Has parens with scientific name, or looks like a binomial
                  return /\([A-Z][a-z]+\s+[a-z]+/.test(s) || /^[A-Z][a-z]+\s+[a-z]+$/.test(s);
                });
              if (gbifCandidates.length === 0) {
                toast.info("No GBIF candidates found among unresolved species");
                return;
              }
              toast.loading(`Running GBIF enrichment for ${gbifCandidates.length} species...`, { id: "gbif" });
              const result = await enrichFromGBIF(gbifCandidates);
              if (result) {
                toast.success(
                  `GBIF: ${result.summary.created} created, ${result.summary.trees_linked} trees linked, ${result.summary.low_confidence} need review`,
                  { id: "gbif" }
                );
                fetchTrees();
                fetchCandidates();
              } else {
                toast.error("GBIF enrichment failed", { id: "gbif" });
              }
            }}
          >
            <Globe className="w-3.5 h-3.5" />
            GBIF Enrich
          </Button>
        </div>

        {/* Species groups */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-serif">
            {filter === "unresolved" ? "All species are resolved! 🌿" : "No trees found."}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredGroups.map((group) => (
              <Card key={group.speciesStr} className="border-border/30">
                <CardContent className="py-3 px-4">
                  <div className="flex flex-col gap-2">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif text-sm text-foreground font-medium">
                            "{group.speciesStr}"
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            {group.trees.length} tree{group.trees.length !== 1 ? "s" : ""}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] gap-1 ${CONFIDENCE_COLORS[group.confidence]}`}>
                            {CONFIDENCE_ICONS[group.confidence]}
                            {group.confidence}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] text-muted-foreground/60">
                            src: {group.source}
                          </Badge>
                          {group.curationStatus !== "unresolved" && group.curationStatus !== "resolved" && (
                            <Badge className="text-[10px] bg-accent/20 text-accent">
                              <Tag className="w-2.5 h-2.5 mr-0.5" />
                              {group.curationStatus.replace("_", " ")}
                            </Badge>
                          )}
                        </div>
                        {group.suggestedCandidate && (
                          <div className="space-y-0.5">
                            <p className="text-[11px] text-muted-foreground font-serif">
                              Suggested: <span className="text-primary">{group.suggestedCandidate.common_name}</span>
                              {group.suggestedCandidate.scientific_name && (
                                <span className="italic ml-1">({group.suggestedCandidate.scientific_name})</span>
                              )}
                              {group.suggestedCandidate.family && <span className="ml-1">· {group.suggestedCandidate.family}</span>}
                            </p>
                            {(group.suggestedCandidate.synonym_names as unknown as string[])?.length > 0 && (
                              <p className="text-[10px] text-muted-foreground/50 font-serif">
                                Aliases: {(group.suggestedCandidate.synonym_names as unknown as string[]).join(", ")}
                              </p>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {group.trees.slice(0, 4).map((t) => (
                            <span key={t.id} className="text-[9px] text-muted-foreground/50 font-serif">
                              {t.name}
                            </span>
                          ))}
                          {group.trees.length > 4 && (
                            <span className="text-[9px] text-muted-foreground/30">
                              +{group.trees.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action row */}
                    <div className="flex items-center gap-2 flex-wrap border-t border-border/15 pt-2">
                      {/* Quick assign from suggestion */}
                      {group.suggestedCandidate && group.trees.some(t => !t.species_key) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs font-serif gap-1.5 h-7"
                          disabled={assigning === group.trees[0].id}
                          onClick={() => {
                            const unresolved = group.trees.filter(t => !t.species_key);
                            assignSpeciesKey(unresolved.map(t => t.id), group.suggestedCandidate!.species_key);
                          }}
                        >
                          {assigning === group.trees[0].id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Assign match ({group.trees.filter(t => !t.species_key).length})
                        </Button>
                      )}

                      {/* Manual assign dropdown */}
                      <Select
                        onValueChange={(key) => {
                          const unresolved = group.trees.filter(t => !t.species_key);
                          if (unresolved.length > 0) {
                            assignSpeciesKey(unresolved.map(t => t.id), key);
                          }
                        }}
                      >
                        <SelectTrigger className="w-44 h-7 text-[11px] font-serif">
                          <SelectValue placeholder="Manual assign..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {candidates.map((c) => (
                            <SelectItem key={c.species_key} value={c.species_key} className="text-xs">
                              {c.common_name} — <span className="italic">{c.scientific_name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Status marking buttons */}
                      <div className="flex items-center gap-1 ml-auto">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[10px] h-6 px-2 text-muted-foreground/60 hover:text-foreground"
                          onClick={() => markStatus(group.speciesStr, "custom_local")}
                          title="Mark as custom / local species"
                        >
                          <Tag className="w-3 h-3 mr-0.5" /> Local
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[10px] h-6 px-2 text-muted-foreground/60 hover:text-foreground"
                          onClick={() => markStatus(group.speciesStr, "needs_gbif")}
                          title="Flag for GBIF review"
                        >
                          <Globe className="w-3 h-3 mr-0.5" /> GBIF
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CuratorSpeciesPage;
