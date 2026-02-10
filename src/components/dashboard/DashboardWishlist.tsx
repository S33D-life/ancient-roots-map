import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Star, Plus, Loader2, Trash2, TreeDeciduous, Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface WishlistItem {
  id: string;
  tree_id: string;
  notes: string | null;
  created_at: string;
  tree?: { name: string; species: string; what3words: string | null } | null;
}

interface DashboardWishlistProps {
  userId: string;
  onCountChange: (count: number) => void;
}

const DashboardWishlist = ({ userId, onCountChange }: DashboardWishlistProps) => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<WishlistItem | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const { toast } = useToast();

  const fetchWishlist = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tree_wishlist")
      .select("*, tree:trees(name, species, what3words)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Wishlist fetch error:", error);
    } else {
      const mapped = (data || []).map((d: any) => ({
        ...d,
        tree: Array.isArray(d.tree) ? d.tree[0] || null : d.tree,
      }));
      setItems(mapped);
      onCountChange(mapped.length);
    }
    setLoading(false);
  };

  useEffect(() => { fetchWishlist(); }, [userId]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("tree_wishlist").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Removed from wishlist" });
      fetchWishlist();
    }
  };

  const handleUpdateNotes = async () => {
    if (!editItem) return;
    const { error } = await supabase
      .from("tree_wishlist")
      .update({ notes: editNotes.trim() || null })
      .eq("id", editItem.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Notes updated" });
      setEditItem(null);
      fetchWishlist();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-primary/30 p-12 text-center" style={{ background: "radial-gradient(ellipse at 50% 80%, hsl(var(--primary) / 0.06), transparent 70%)" }}>
        <Star className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-muted-foreground font-serif mb-2">Your wishlist is empty</p>
        <p className="text-xs text-muted-foreground">Visit the Atlas or Library to add trees to your wishlist</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-serif">{items.length} tree{items.length !== 1 ? "s" : ""} on your wishlist</p>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <Card key={item.id} className="border-border/50 bg-card/40 backdrop-blur hover:border-primary/30 transition-colors">
            <CardContent className="p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <TreeDeciduous className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-serif text-foreground text-sm">{item.tree?.name || "Unknown Tree"}</h4>
                <p className="text-xs text-muted-foreground italic">{item.tree?.species || "—"}</p>
                {item.tree?.what3words && (
                  <p className="text-xs text-muted-foreground mt-0.5">📍 {item.tree.what3words}</p>
                )}
                {item.notes && (
                  <p className="text-xs text-foreground/70 mt-2 bg-secondary/30 rounded px-2 py-1">{item.notes}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  Added {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Notes Dialog */}
      <Dialog open={!!editItem} onOpenChange={(v) => !v && setEditItem(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary font-serif">Edit Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value.slice(0, 500))}
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
    </div>
  );
};

export default DashboardWishlist;
