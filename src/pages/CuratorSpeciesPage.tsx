/**
 * CuratorSpeciesPage — Review and resolve unmatched species strings.
 * Shows trees with null species_key, lets curators assign canonical matches.
 */
import { useState, useEffect, useCallback } from "react";
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
import { Loader2, Search, Check, AlertTriangle, TreeDeciduous } from "lucide-react";
import { toast } from "sonner";
import { useHasRole } from "@/hooks/use-role";

interface UnresolvedTree {
  id: string;
  name: string;
  species: string;
  species_key: string | null;
}

interface SpeciesCandidate {
  species_key: string;
  common_name: string;
  scientific_name: string;
  family: string | null;
}

const CuratorSpeciesPage = () => {
  const { hasRole, loading: roleLoading } = useHasRole("curator");
  const [trees, setTrees] = useState<UnresolvedTree[]>([]);
  const [candidates, setCandidates] = useState<SpeciesCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"unresolved" | "all">("unresolved");
  const [assigning, setAssigning] = useState<string | null>(null);

  const fetchTrees = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("trees")
      .select("id, name, species, species_key")
      .order("species", { ascending: true })
      .limit(200);

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
      .select("species_key, common_name, scientific_name, family")
      .order("common_name", { ascending: true })
      .limit(500);
    setCandidates((data as SpeciesCandidate[]) || []);
  }, []);

  useEffect(() => {
    fetchTrees();
    fetchCandidates();
  }, [fetchTrees, fetchCandidates]);

  const assignSpeciesKey = async (treeId: string, speciesKey: string) => {
    setAssigning(treeId);
    const { error } = await supabase
      .from("trees")
      .update({ species_key: speciesKey })
      .eq("id", treeId);

    if (error) {
      toast.error("Failed to assign species key");
    } else {
      toast.success("Species key assigned");
      setTrees((prev) => prev.filter((t) => t.id !== treeId));
    }
    setAssigning(null);
  };

  // Group unresolved trees by species string
  const grouped = trees.reduce<Record<string, UnresolvedTree[]>>((acc, tree) => {
    const key = tree.species.toLowerCase().trim();
    if (!acc[key]) acc[key] = [];
    acc[key].push(tree);
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

  // Find best candidate match for a species string
  const findBestMatch = (species: string): SpeciesCandidate | null => {
    const norm = species.toLowerCase().trim();
    return (
      candidates.find((c) => c.common_name.toLowerCase() === norm) ||
      candidates.find((c) => c.scientific_name?.toLowerCase() === norm) ||
      candidates.find((c) => c.common_name.toLowerCase().includes(norm) || norm.includes(c.common_name.toLowerCase())) ||
      null
    );
  };

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
        <div className="flex items-center gap-4 text-sm font-serif">
          <Badge variant="outline" className="gap-1.5">
            <TreeDeciduous className="w-3 h-3" />
            {trees.length} {filter === "unresolved" ? "unresolved" : "total"} trees
          </Badge>
          <Badge variant="outline">{sortedGroups.length} unique species strings</Badge>
          <Badge variant="outline">{candidates.length} canonical species available</Badge>
        </div>

        {/* Controls */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search species strings..."
              className="pl-9 font-serif"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as "unresolved" | "all")}>
            <SelectTrigger className="w-40 font-serif">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unresolved">Unresolved only</SelectItem>
              <SelectItem value="all">All trees</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchTrees} className="font-serif">
            Refresh
          </Button>
        </div>

        {/* Species groups */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : sortedGroups.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-serif">
            {filter === "unresolved" ? "All species are resolved! 🌿" : "No trees found."}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedGroups.map(([speciesStr, treesInGroup]) => {
              const bestMatch = findBestMatch(speciesStr);
              return (
                <Card key={speciesStr} className="border-border/30">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-sm text-foreground font-medium">
                            "{treesInGroup[0].species}"
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            {treesInGroup.length} tree{treesInGroup.length !== 1 ? "s" : ""}
                          </Badge>
                          {treesInGroup[0].species_key && (
                            <Badge className="text-[10px] bg-primary/20 text-primary">
                              <Check className="w-2.5 h-2.5 mr-0.5" /> Resolved
                            </Badge>
                          )}
                        </div>
                        {bestMatch && (
                          <p className="text-[11px] text-muted-foreground font-serif">
                            Suggested: <span className="text-primary">{bestMatch.common_name}</span>
                            {bestMatch.scientific_name && (
                              <span className="italic ml-1">({bestMatch.scientific_name})</span>
                            )}
                            {bestMatch.family && <span className="ml-1">· {bestMatch.family}</span>}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {treesInGroup.slice(0, 3).map((t) => (
                            <span key={t.id} className="text-[9px] text-muted-foreground/60 font-serif">
                              {t.name}
                            </span>
                          ))}
                          {treesInGroup.length > 3 && (
                            <span className="text-[9px] text-muted-foreground/40">
                              +{treesInGroup.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {bestMatch && !treesInGroup[0].species_key && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs font-serif gap-1.5 h-8"
                            disabled={assigning === treesInGroup[0].id}
                            onClick={async () => {
                              for (const t of treesInGroup) {
                                await assignSpeciesKey(t.id, bestMatch.species_key);
                              }
                            }}
                          >
                            {assigning ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            Assign match
                          </Button>
                        )}
                        <Select
                          onValueChange={(key) => {
                            treesInGroup.forEach((t) => assignSpeciesKey(t.id, key));
                          }}
                        >
                          <SelectTrigger className="w-44 h-8 text-xs font-serif">
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CuratorSpeciesPage;
