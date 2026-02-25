import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHasRole } from "@/hooks/use-role";
import Header from "@/components/Header";
import OptimizedImage from "@/components/OptimizedImage";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Shield, Wand2, Search, UserPlus, X, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { getGridStaffs, type GridStaff } from "@/utils/staffRoomData";
import SourceReviewPanel from "@/components/SourceReviewPanel";

interface WandererOption {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface StaffRow {
  id: string;
  token_id: number;
  species: string;
  species_code: string;
  owner_user_id: string | null;
  is_origin_spiral: boolean;
  image_url: string | null;
  circle_id: number;
  staff_number: number;
}

export default function CuratorPage() {
  const { hasRole, loading: roleLoading } = useHasRole("curator");
  const [staffRows, setStaffRows] = useState<StaffRow[]>([]);
  const [wanderers, setWanderers] = useState<WandererOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "assigned" | "unassigned">("all");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [searchQ, setSearchQ] = useState("");

  // Dialog state
  const [assignDialog, setAssignDialog] = useState<{ staff: StaffRow } | null>(null);
  const [selectedWanderer, setSelectedWanderer] = useState("");
  const [wandererSearch, setWandererSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSourceReview, setShowSourceReview] = useState(false);

  const allGrid = useMemo(() => getGridStaffs(), []);

  // Load staffs from DB and wanderer profiles
  useEffect(() => {
    if (!hasRole) return;
    const load = async () => {
      setLoading(true);
      const [staffRes, profileRes] = await Promise.all([
        supabase.from("staffs").select("id, token_id, species, species_code, owner_user_id, is_origin_spiral, image_url, circle_id, staff_number").order("token_id"),
        supabase.rpc("search_discoverable_profiles", { search_query: "", result_limit: 200 }),
      ]);
      setStaffRows((staffRes.data as StaffRow[]) || []);
      setWanderers((profileRes.data as WandererOption[]) || []);
      setLoading(false);
    };
    load();
  }, [hasRole]);

  // Ensure all 144 staffs exist in DB (seed if missing)
  useEffect(() => {
    if (!hasRole || loading || staffRows.length >= 144) return;
    const seedMissing = async () => {
      const existingIds = new Set(staffRows.map((s) => s.id));
      const toInsert = allGrid
        .filter((g) => !existingIds.has(g.code))
        .map((g) => {
          const isOrigin = g.tokenId <= 36;
          const parts = g.code.match(/^([A-Z]+)(?:-C(\d+)S(\d+))?$/i);
          const speciesCode = parts?.[1]?.toUpperCase() || g.code;
          const circleId = parts?.[2] ? parseInt(parts[2]) : 0;
          const staffNumber = parts?.[3] ? parseInt(parts[3]) : 0;
          return {
            id: g.code,
            token_id: g.tokenId,
            species: g.speciesName,
            species_code: speciesCode,
            species_id: 0,
            circle_id: circleId,
            variant_id: 0,
            staff_number: staffNumber,
            is_origin_spiral: isOrigin,
            image_url: g.img,
          };
        });
      if (toInsert.length > 0) {
        await supabase.from("staffs").insert(toInsert);
        // Reload
        const { data } = await supabase.from("staffs").select("id, token_id, species, species_code, owner_user_id, is_origin_spiral, image_url, circle_id, staff_number").order("token_id");
        setStaffRows((data as StaffRow[]) || []);
      }
    };
    seedMissing();
  }, [hasRole, loading, staffRows.length, allGrid]);

  const ownerMap = useMemo(() => {
    const map: Record<string, WandererOption> = {};
    for (const w of wanderers) map[w.id] = w;
    return map;
  }, [wanderers]);

  const uniqueSpecies = useMemo(() => {
    const set = new Set(staffRows.map((s) => s.species));
    return Array.from(set).sort();
  }, [staffRows]);

  const filtered = useMemo(() => {
    let list = staffRows;
    // Only circle staffs (token > 36) unless "all" shown
    if (filter === "assigned") list = list.filter((s) => s.owner_user_id);
    else if (filter === "unassigned") list = list.filter((s) => !s.owner_user_id);
    if (speciesFilter !== "all") list = list.filter((s) => s.species === speciesFilter);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.species.toLowerCase().includes(q) ||
          (s.owner_user_id && ownerMap[s.owner_user_id]?.full_name?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [staffRows, filter, speciesFilter, searchQ, ownerMap]);

  const handleAssign = async () => {
    if (!assignDialog || !selectedWanderer) return;
    setSaving(true);
    const { error } = await supabase
      .from("staffs")
      .update({ owner_user_id: selectedWanderer })
      .eq("id", assignDialog.staff.id);
    if (error) {
      toast.error("Failed to assign staff: " + error.message);
    } else {
      toast.success(`Staff ${assignDialog.staff.id} assigned!`);
      setStaffRows((prev) =>
        prev.map((s) =>
          s.id === assignDialog.staff.id ? { ...s, owner_user_id: selectedWanderer } : s
        )
      );
    }
    setSaving(false);
    setAssignDialog(null);
    setSelectedWanderer("");
    setWandererSearch("");
  };

  const handleUnassign = async (staffId: string) => {
    const { error } = await supabase
      .from("staffs")
      .update({ owner_user_id: null })
      .eq("id", staffId);
    if (error) {
      toast.error("Failed to unassign: " + error.message);
    } else {
      toast.success("Staff unassigned");
      setStaffRows((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, owner_user_id: null } : s))
      );
    }
  };

  const filteredWanderers = useMemo(() => {
    if (!wandererSearch.trim()) return wanderers;
    const q = wandererSearch.toLowerCase();
    return wanderers.filter((w) => w.full_name?.toLowerCase().includes(q) || w.id.includes(q));
  }, [wanderers, wandererSearch]);

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasRole) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-serif text-foreground mb-2">Curator Access Required</h1>
          <p className="text-muted-foreground font-serif">
            This area is reserved for Heartwood Curators.
          </p>
        </div>
      </div>
    );
  }

  const assignedCount = staffRows.filter((s) => s.owner_user_id).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-serif text-primary tracking-wide">Heartwood Curator</h1>
          <Badge variant="outline" className="ml-auto font-mono text-xs">
            {assignedCount}/{staffRows.length} assigned
          </Badge>
        </div>

        {/* Links to other curator tools */}
        <div className="mb-6 flex flex-wrap gap-3">
          <a href="/edit-review" className="inline-flex items-center gap-2 text-sm font-serif text-primary hover:text-primary/80 transition-colors border border-primary/30 rounded-lg px-4 py-2">
            <Shield className="w-4 h-4" />
            Tree Edit Proposals →
          </a>
          <button
            onClick={() => setShowSourceReview(!showSourceReview)}
            className="inline-flex items-center gap-2 text-sm font-serif text-primary hover:text-primary/80 transition-colors border border-primary/30 rounded-lg px-4 py-2"
          >
            <BookOpen className="w-4 h-4" />
            Source Review {showSourceReview ? "▾" : "→"}
          </button>
        </div>

        {/* Source Review Panel */}
        {showSourceReview && (
          <div className="mb-8 p-4 rounded-xl border border-border/40 bg-card/40">
            <SourceReviewPanel />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search staffs or wanderers…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="pl-9 font-serif text-sm"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-[140px] font-serif text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staffs</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>
          <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
            <SelectTrigger className="w-[160px] font-serif text-sm">
              <SelectValue placeholder="Species" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Species</SelectItem>
              {uniqueSpecies.map((sp) => (
                <SelectItem key={sp} value={sp}>{sp}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Staff grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((staff) => {
              const owner = staff.owner_user_id ? ownerMap[staff.owner_user_id] : null;
              const gridItem = allGrid.find((g) => g.code === staff.id);
              const img = staff.image_url || gridItem?.img || "/images/staffs/oak.jpeg";

              return (
                <Card
                  key={staff.id}
                  className="border-border/40 hover:border-primary/30 transition-all"
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-12 h-16 rounded-lg overflow-hidden border border-border/30 shrink-0">
                      <OptimizedImage src={img} alt={staff.species} className="w-full h-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm text-foreground truncate">
                        {staff.id}
                      </p>
                      <p className="text-xs text-muted-foreground font-serif">{staff.species}</p>
                      <p className="text-[10px] text-muted-foreground/60 font-mono">
                        Token #{String(staff.token_id).padStart(3, "0")}
                      </p>
                      {owner ? (
                        <div className="flex items-center gap-1 mt-1">
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0 font-serif truncate max-w-[120px]">
                            {owner.full_name || "Unnamed"}
                          </Badge>
                          <button
                            onClick={() => handleUnassign(staff.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Unassign"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-1 font-serif text-muted-foreground">
                          Unassigned
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1 text-xs font-serif"
                      onClick={() => {
                        setAssignDialog({ staff });
                        setSelectedWanderer(staff.owner_user_id || "");
                      }}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      {staff.owner_user_id ? "Reassign" : "Assign"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <Wand2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-serif text-muted-foreground">No staffs match your filters.</p>
          </div>
        )}
      </div>

      {/* Assign dialog */}
      <Dialog open={!!assignDialog} onOpenChange={(open) => !open && setAssignDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-primary">
              Assign {assignDialog?.staff.id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search wanderers…"
                value={wandererSearch}
                onChange={(e) => setWandererSearch(e.target.value)}
                className="pl-9 font-serif text-sm"
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1 border border-border/30 rounded-lg p-2">
              {filteredWanderers.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4 font-serif">No wanderers found</p>
              )}
              {filteredWanderers.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelectedWanderer(w.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors text-sm ${
                    selectedWanderer === w.id
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "hover:bg-muted/50"
                  }`}
                >
                  {w.avatar_url ? (
                    <img src={w.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      {(w.full_name || "?")[0]}
                    </div>
                  )}
                  <span className="font-serif truncate">{w.full_name || "Unnamed Wanderer"}</span>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(null)} className="font-serif">
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedWanderer || saving}
              className="gap-2 font-serif"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Assign Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
