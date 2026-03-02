/**
 * ExplorerTable — Block-explorer style table view for the Tree Ledger.
 * Searchable, filterable, paginated.
 */
import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight, TreePine, MapPin, Heart, Eye, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LedgerTree {
  id: string;
  name: string;
  species: string | null;
  w3w: string | null;
  nation: string | null;
  state: string | null;
  created_by: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
}

interface ExplorerTableProps {
  trees: LedgerTree[];
  visitCounts: Record<string, number>;
  heartCounts: Record<string, number>;
  lastVisitDates: Record<string, string>;
  loading: boolean;
  speciesList: string[];
  nationsList: string[];
  currentUserId: string | null;
  onSpeciesFilter?: (species: string) => void;
}

const PAGE_SIZE = 25;

const ExplorerTable = ({
  trees,
  visitCounts,
  heartCounts,
  lastVisitDates,
  loading,
  speciesList,
  nationsList,
  currentUserId,
  onSpeciesFilter,
}: ExplorerTableProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [nationFilter, setNationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [myTreesOnly, setMyTreesOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<"name" | "visits" | "hearts" | "date">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Reset page on filter change
  useEffect(() => { setPage(0); }, [search, speciesFilter, nationFilter, statusFilter, myTreesOnly]);

  const filtered = useMemo(() => {
    let result = [...trees];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        (t.name?.toLowerCase().includes(q)) ||
        (t.w3w?.toLowerCase().includes(q)) ||
        (t.species?.toLowerCase().includes(q)) ||
        (t.nation?.toLowerCase().includes(q)) ||
        (t.state?.toLowerCase().includes(q))
      );
    }

    if (speciesFilter !== "all") {
      result = result.filter(t => t.species === speciesFilter);
    }

    if (nationFilter !== "all") {
      result = result.filter(t => t.nation === nationFilter);
    }

    if (statusFilter === "visited") {
      result = result.filter(t => (visitCounts[t.id] || 0) > 0);
    } else if (statusFilter === "unvisited") {
      result = result.filter(t => (visitCounts[t.id] || 0) === 0);
    }

    if (myTreesOnly && currentUserId) {
      result = result.filter(t => t.created_by === currentUserId);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "name":
          cmp = (a.name || "").localeCompare(b.name || "");
          break;
        case "visits":
          cmp = (visitCounts[a.id] || 0) - (visitCounts[b.id] || 0);
          break;
        case "hearts":
          cmp = (heartCounts[a.id] || 0) - (heartCounts[b.id] || 0);
          break;
        case "date":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [trees, search, speciesFilter, nationFilter, statusFilter, myTreesOnly, currentUserId, sortBy, sortDir, visitCounts, heartCounts]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = useCallback((col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  }, [sortBy]);

  const SortIcon = ({ col }: { col: typeof sortBy }) => (
    sortBy === col ? (
      <span className="ml-1 text-[10px]">{sortDir === "asc" ? "▲" : "▼"}</span>
    ) : null
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search trees, species, locations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={speciesFilter} onValueChange={v => { setSpeciesFilter(v); onSpeciesFilter?.(v); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Species" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Species</SelectItem>
            {speciesList.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={nationFilter} onValueChange={setNationFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Nations</SelectItem>
            {nationsList.map(n => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="visited">Visited</SelectItem>
            <SelectItem value="unvisited">Unvisited</SelectItem>
          </SelectContent>
        </Select>
        {currentUserId && (
          <Button
            variant={myTreesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setMyTreesOnly(!myTreesOnly)}
            className="whitespace-nowrap"
          >
            <User className="w-3.5 h-3.5 mr-1.5" />
            My Trees
          </Button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground font-mono">
        {filtered.length.toLocaleString()} tree{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("name")}>
                <span className="flex items-center gap-1">
                  <TreePine className="w-3.5 h-3.5" /> Tree
                  <SortIcon col="name" />
                </span>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Location
                </span>
              </TableHead>
              <TableHead className="cursor-pointer select-none text-center" onClick={() => toggleSort("visits")}>
                <span className="flex items-center gap-1 justify-center">
                  <Eye className="w-3.5 h-3.5" /> Visits
                  <SortIcon col="visits" />
                </span>
              </TableHead>
              <TableHead className="cursor-pointer select-none text-center hidden sm:table-cell" onClick={() => toggleSort("hearts")}>
                <span className="flex items-center gap-1 justify-center">
                  <Heart className="w-3.5 h-3.5" /> Hearts
                  <SortIcon col="hearts" />
                </span>
              </TableHead>
              <TableHead className="cursor-pointer select-none hidden lg:table-cell" onClick={() => toggleSort("date")}>
                <span className="flex items-center gap-1">
                  Mapped
                  <SortIcon col="date" />
                </span>
              </TableHead>
              <TableHead className="hidden xl:table-cell">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground font-serif">
                  No trees match your search
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map(tree => {
                const visits = visitCounts[tree.id] || 0;
                const hearts = heartCounts[tree.id] || 0;
                const lastVisit = lastVisitDates[tree.id];

                return (
                  <TableRow
                    key={tree.id}
                    className="cursor-pointer hover:bg-primary/5 transition-colors"
                    onClick={() => navigate(`/tree/${tree.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-serif font-medium text-foreground text-sm">
                          {tree.name || "Unnamed Tree"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tree.species || "Unknown species"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-xs">
                        <p className="text-foreground/80">{tree.nation || "—"}{tree.state ? `, ${tree.state}` : ""}</p>
                        {tree.w3w && (
                          <p className="text-muted-foreground font-mono text-[10px]">///{ tree.w3w}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono text-sm text-foreground">{visits}</span>
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <span className="font-mono text-sm text-foreground">{hearts}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <p className="text-xs text-muted-foreground">
                        {new Date(tree.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                      </p>
                      {lastVisit && (
                        <p className="text-[10px] text-muted-foreground">
                          Last visit: {new Date(lastVisit).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {visits > 0 && <Badge variant="secondary" className="text-[10px]">Visited</Badge>}
                        {visits === 0 && <Badge variant="outline" className="text-[10px] opacity-50">Mapped</Badge>}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-mono">
            Page {page + 1} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pageCount - 1}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplorerTable;
