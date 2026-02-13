import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Heart, Loader2, Trash2, TreeDeciduous, Pencil, MapPin, Globe, User, Users,
  Search, Map, Plus, Wand2, Star,
} from "lucide-react";
import wishingTreeImage from "@/assets/wishing-tree.png";

interface WishlistItem {
  id: string;
  user_id: string;
  tree_id: string;
  notes: string | null;
  created_at: string;
  tree: {
    id: string;
    name: string;
    species: string;
    what3words: string | null;
    state: string | null;
    nation: string | null;
    estimated_age: number | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
}

interface WishingTreeUnifiedProps {
  /** Compact mode hides the painting header and uses smaller cards (for dashboard) */
  compact?: boolean;
  /** Called when wishlist count changes (for dashboard badges) */
  onCountChange?: (count: number) => void;
}

type ViewMode = "collective" | "individual" | "tribe";

const WishingTreeUnified = ({ compact = false, onCountChange }: WishingTreeUnifiedProps) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [tribeUserIds, setTribeUserIds] = useState<string[]>([]);

  // Filters
  const [viewMode, setViewMode] = useState<ViewMode>("individual");
  const [searchQuery, setSearchQuery] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");

  // Edit dialog
  const [editItem, setEditItem] = useState<WishlistItem | null>(null);
  const [editNotes, setEditNotes] = useState("");

  // Pin a wish dialog
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinForm, setPinForm] = useState({ name: "", description: "" });
  const [pinSaving, setPinSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setCurrentUserId(user.id);

    // Fetch all wishlist items (for collective view we need all)
    const { data, error } = await supabase
      .from("tree_wishlist")
      .select("id, user_id, tree_id, notes, created_at, tree:trees(id, name, species, what3words, state, nation, estimated_age, latitude, longitude)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Wishlist fetch error:", error);
    } else {
      const mapped = (data || []).map((d: any) => ({
        ...d,
        tree: Array.isArray(d.tree) ? d.tree[0] || null : d.tree,
      }));
      setItems(mapped);
      const myCount = mapped.filter((i: WishlistItem) => i.user_id === user.id).length;
      onCountChange?.(myCount);
    }

    // Fetch tribe
    const [followsRes, companionsRes] = await Promise.all([
      supabase.from("follows").select("following_id").eq("follower_id", user.id),
      supabase.from("grove_companions").select("requester_id, recipient_id")
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq("status", "accepted"),
    ]);
    const tribeIds = new Set<string>();
    followsRes.data?.forEach(f => tribeIds.add(f.following_id));
    companionsRes.data?.forEach(c => {
      tribeIds.add(c.requester_id === user.id ? c.recipient_id : c.requester_id);
    });
    setTribeUserIds(Array.from(tribeIds));
    setLoading(false);
  }, [onCountChange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived data
  const uniqueSpecies = useMemo(() => {
    const s = new Set<string>();
    items.forEach(i => { if (i.tree?.species) s.add(i.tree.species); });
    return Array.from(s).sort();
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(item => {
      // View mode
      if (viewMode === "individual" && item.user_id !== currentUserId) return false;
      if (viewMode === "tribe" && !tribeUserIds.includes(item.user_id) && item.user_id !== currentUserId) return false;

      // Species
      if (speciesFilter !== "all" && item.tree?.species !== speciesFilter) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = item.tree?.name?.toLowerCase() || "";
        const species = item.tree?.species?.toLowerCase() || "";
        const w3w = item.tree?.what3words?.toLowerCase() || "";
        const notes = item.notes?.toLowerCase() || "";
        if (!name.includes(q) && !species.includes(q) && !w3w.includes(q) && !notes.includes(q)) return false;
      }

      return true;
    });
  }, [items, viewMode, currentUserId, tribeUserIds, speciesFilter, searchQuery]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("tree_wishlist").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove: " + error.message);
    } else {
      toast.success("Removed from wishlist");
      fetchData();
    }
  };

  const handleUpdateNotes = async () => {
    if (!editItem) return;
    const { error } = await supabase
      .from("tree_wishlist")
      .update({ notes: editNotes.trim() || null })
      .eq("id", editItem.id);
    if (error) {
      toast.error("Failed: " + error.message);
    } else {
      toast.success("Notes updated");
      setEditItem(null);
      fetchData();
    }
  };

  const handlePinWish = async () => {
    if (!pinForm.name.trim()) { toast.error("Name is required"); return; }
    if (!currentUserId) { toast.error("Please log in"); return; }
    setPinSaving(true);
    // Create a wishlist entry with no tree_id — stored as a "wish" without a mapped tree
    const { error } = await supabase.from("tree_wishlist").insert({
      user_id: currentUserId,
      tree_id: "00000000-0000-0000-0000-000000000000", // placeholder for unmapped wishes
      notes: `🌟 ${pinForm.name.trim()}${pinForm.description.trim() ? `\n${pinForm.description.trim()}` : ""}`,
    });
    if (error) {
      toast.error("Failed: " + error.message);
    } else {
      toast.success("Wish pinned to the tree! 🌟");
      setPinForm({ name: "", description: "" });
      setShowPinDialog(false);
      fetchData();
    }
    setPinSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header (full mode only) */}
      {!compact && (
        <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden">
          <div className="flex items-center gap-4 p-4 border-b border-border/30">
            <div
              className="relative w-32 h-40 shrink-0 rounded-md overflow-hidden border border-border shadow"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
            >
              <img src={wishingTreeImage} alt="Wishing Tree" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-serif text-primary">Wishing Tree</h2>
              <p className="text-xs font-serif text-muted-foreground">
                Trees you dream of visiting someday
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* View Toggle */}
      <div
        className="flex items-center gap-1 p-1 rounded-lg"
        style={{
          background: "hsla(30, 20%, 15%, 0.6)",
          border: "1px solid hsla(42, 40%, 30%, 0.3)",
        }}
      >
        {([
          { key: "collective" as const, label: "All Wishes", icon: Globe, desc: "Community wishlist" },
          { key: "individual" as const, label: "My Wishes", icon: User, desc: "Your wishlist" },
          { key: "tribe" as const, label: "Tribe", icon: Users, desc: "Tribe wishlist" },
        ]).map(v => (
          <button
            key={v.key}
            onClick={() => setViewMode(v.key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-serif transition-all flex-1 justify-center"
            style={{
              background: viewMode === v.key ? "hsla(42, 70%, 50%, 0.15)" : "transparent",
              color: viewMode === v.key ? "hsl(42, 80%, 60%)" : "hsla(42, 20%, 60%, 0.7)",
              border: viewMode === v.key ? "1px solid hsla(42, 60%, 50%, 0.3)" : "1px solid transparent",
            }}
            title={v.desc}
          >
            <v.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, species, notes…"
            className="pl-9 font-serif"
          />
        </div>
        <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
          <SelectTrigger className="w-full sm:w-[180px] font-serif">
            <SelectValue placeholder="Species" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Species</SelectItem>
            {uniqueSpecies.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!compact && (
          <Button
            variant="outline"
            size="default"
            className="gap-2 font-serif text-xs shrink-0"
            style={{
              borderColor: "hsla(42, 60%, 50%, 0.3)",
              color: "hsl(42, 80%, 60%)",
            }}
            onClick={() => setShowPinDialog(true)}
          >
            <Wand2 className="w-3.5 h-3.5" />
            Pin a Wish
          </Button>
        )}
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground font-serif">
        {filtered.length} wish{filtered.length !== 1 ? "es" : ""}
        {viewMode === "collective" && " across the community"}
        {viewMode === "tribe" && " from your tribe"}
      </p>

      {/* Empty state */}
      {filtered.length === 0 && !loading && (
        <div
          className="rounded-xl border border-dashed border-primary/30 p-12 text-center"
          style={{ background: "radial-gradient(ellipse at 50% 80%, hsl(var(--primary) / 0.06), transparent 70%)" }}
        >
          <Heart className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground font-serif mb-2">
            {viewMode === "individual" ? "Your Wishing Tree is empty" : "No wishes found"}
          </p>
          <p className="text-xs text-muted-foreground">
            {viewMode === "individual"
              ? "Visit the Ancient Friends gallery to add trees to your wishlist"
              : "Try changing filters or switching views"}
          </p>
        </div>
      )}

      {/* Wishlist grid */}
      <div className={compact ? "grid gap-3" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
        {filtered.map(item => (
          <Card
            key={item.id}
            className="border-border/50 bg-card/40 backdrop-blur hover:border-primary/30 transition-colors"
          >
            <CardContent className={compact ? "p-4 flex items-start gap-3" : "p-4 space-y-3"}>
              {compact ? (
                <>
                  <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0 mt-0.5">
                    <TreeDeciduous className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif text-foreground text-sm">{item.tree?.name || "Unknown Tree"}</h4>
                    <p className="text-xs text-muted-foreground italic">{item.tree?.species || "—"}</p>
                    {item.tree?.what3words && (
                      <p className="text-xs text-muted-foreground mt-0.5">📍 {item.tree.what3words}</p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-foreground/70 mt-1.5 bg-secondary/30 rounded px-2 py-1">{item.notes}</p>
                    )}
                    {viewMode !== "individual" && item.user_id !== currentUserId && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                        <User className="w-2.5 h-2.5" /> community
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {item.user_id === currentUserId && (
                      <>
                        <button
                          onClick={() => { setEditItem(item); setEditNotes(item.notes || ""); }}
                          className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded"
                          title="Edit notes"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                        <TreeDeciduous className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h4 className="font-serif text-foreground">{item.tree?.name || "Unknown Tree"}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="font-serif text-[10px]">
                            {item.tree?.species || "—"}
                          </Badge>
                          {item.tree?.estimated_age && (
                            <span className="text-[10px] text-muted-foreground">~{item.tree.estimated_age}y</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {item.user_id === currentUserId && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditItem(item); setEditNotes(item.notes || ""); }}
                          className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {item.tree?.what3words && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>/{item.tree.what3words}</span>
                    </div>
                  )}

                  {item.tree?.state && (
                    <p className="text-xs text-muted-foreground">
                      {item.tree.state}{item.tree.nation ? `, ${item.tree.nation}` : ""}
                    </p>
                  )}

                  {item.notes && (
                    <p className="text-xs text-foreground/70 bg-secondary/30 rounded px-2.5 py-1.5 font-serif">{item.notes}</p>
                  )}

                  {viewMode !== "individual" && item.user_id !== currentUserId && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <User className="w-3 h-3" /> from a fellow wanderer
                    </span>
                  )}

                  <div className="flex gap-2 pt-1">
                    {item.tree?.latitude && item.tree?.longitude && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1.5 font-serif"
                        onClick={() => navigate(`/map?lat=${item.tree!.latitude}&lng=${item.tree!.longitude}&zoom=16`)}
                      >
                        <Map className="w-3.5 h-3.5" /> Atlas
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1.5 font-serif"
                      onClick={() => navigate(`/tree/${item.tree_id}`)}
                    >
                      <TreeDeciduous className="w-3.5 h-3.5" /> Profile
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Notes Dialog */}
      <Dialog open={!!editItem} onOpenChange={v => !v && setEditItem(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary font-serif">Edit Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editNotes}
              onChange={e => setEditNotes(e.target.value.slice(0, 500))}
              placeholder="Why is this tree special to you?"
              maxLength={500}
              rows={4}
              className="font-serif"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button size="sm" onClick={handleUpdateNotes}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pin a Wish Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary font-serif flex items-center gap-2">
              <Wand2 className="w-4 h-4" /> Pin a Wish
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground font-serif">
            Dream of a tree not yet in the gallery? Pin your wish here — it can be matched later.
          </p>
          <div className="space-y-3">
            <Input
              value={pinForm.name}
              onChange={e => setPinForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Tree name or place…"
              className="font-serif"
            />
            <Textarea
              value={pinForm.description}
              onChange={e => setPinForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Why do you wish to find this tree?"
              rows={3}
              className="font-serif"
            />
            <Button className="w-full gap-2 font-serif" onClick={handlePinWish} disabled={pinSaving}>
              {pinSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
              Pin Wish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WishingTreeUnified;
