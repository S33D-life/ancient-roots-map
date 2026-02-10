import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Loader2, Leaf, ImagePlus, X, Share2, Lock, Trash2, Sprout,
} from "lucide-react";

interface Plant {
  id: string;
  user_id: string;
  name: string;
  species: string | null;
  photo_url: string | null;
  is_shared: boolean;
  notes: string | null;
  created_at: string;
}

const Greenhouse = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [communityPlants, setCommunityPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"mine" | "community">("mine");
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      await fetchPlants(user?.id ?? null);
    };
    init();
  }, []);

  const fetchPlants = async (uid: string | null) => {
    setLoading(true);
    try {
      // Fetch user's own plants
      if (uid) {
        const { data } = await supabase
          .from("greenhouse_plants")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false });
        setPlants((data as Plant[]) || []);
      }

      // Fetch community shared plants
      const { data: shared } = await supabase
        .from("greenhouse_plants")
        .select("*")
        .eq("is_shared", true)
        .order("created_at", { ascending: false });
      setCommunityPlants((shared as Plant[]) || []);
    } finally {
      setLoading(false);
    }
  };

  const toggleShare = async (plant: Plant) => {
    const { error } = await supabase
      .from("greenhouse_plants")
      .update({ is_shared: !plant.is_shared })
      .eq("id", plant.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: plant.is_shared ? "Made private" : "Shared with community!" });
      fetchPlants(userId);
    }
  };

  const deletePlant = async (id: string) => {
    const { error } = await supabase.from("greenhouse_plants").delete().eq("id", id);
    if (!error) {
      toast({ title: "Plant removed" });
      fetchPlants(userId);
    }
  };

  const displayPlants = viewMode === "mine" ? plants : communityPlants;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Sprout className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-serif text-primary">🌿 Greenhouse</h2>
            <p className="text-xs text-muted-foreground font-serif">Your houseplants & saplings</p>
          </div>
        </div>
        {userId && (
          <Button onClick={() => setAddOpen(true)} size="sm" className="font-serif text-xs tracking-wider gap-1.5">
            <Plus className="h-3 w-3" />
            Add Plant
          </Button>
        )}
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === "mine" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("mine")}
          className="font-serif text-xs tracking-wider gap-1.5"
        >
          <Lock className="h-3 w-3" />
          My Plants ({plants.length})
        </Button>
        <Button
          variant={viewMode === "community" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("community")}
          className="font-serif text-xs tracking-wider gap-1.5"
        >
          <Share2 className="h-3 w-3" />
          Community ({communityPlants.length})
        </Button>
      </div>

      {/* Plant grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : displayPlants.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-primary/30 p-12 text-center"
          style={{ background: "radial-gradient(ellipse at 50% 80%, hsl(var(--primary) / 0.06), transparent 70%)" }}
        >
          <Leaf className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground font-serif mb-2">
            {viewMode === "mine"
              ? userId
                ? "No plants yet. Add your first houseplant or sapling!"
                : "Log in to start your greenhouse."
              : "No shared plants yet. Be the first to share!"}
          </p>
          {viewMode === "mine" && userId && (
            <Button variant="outline" size="sm" onClick={() => setAddOpen(true)} className="font-serif text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Add Plant
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayPlants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              isOwner={plant.user_id === userId}
              onToggleShare={() => toggleShare(plant)}
              onDelete={() => deletePlant(plant.id)}
            />
          ))}
        </div>
      )}

      {userId && (
        <AddPlantDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          userId={userId}
          onAdded={() => fetchPlants(userId)}
        />
      )}
    </div>
  );
};

/* ---------- Plant Card ---------- */

const PlantCard = ({
  plant,
  isOwner,
  onToggleShare,
  onDelete,
}: {
  plant: Plant;
  isOwner: boolean;
  onToggleShare: () => void;
  onDelete: () => void;
}) => (
  <Card className="border-border/50 bg-card/40 backdrop-blur overflow-hidden group hover:border-primary/40 transition-colors">
    <div className="aspect-square relative bg-secondary/20">
      {plant.photo_url ? (
        <img
          src={plant.photo_url}
          alt={plant.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Leaf className="h-10 w-10 text-muted-foreground/20" />
        </div>
      )}
      {plant.is_shared && (
        <Badge className="absolute top-2 right-2 text-[9px] bg-primary/80 font-serif tracking-wider">
          Shared
        </Badge>
      )}
    </div>
    <CardContent className="p-3">
      <h4 className="font-serif text-sm text-primary truncate">{plant.name}</h4>
      {plant.species && (
        <p className="text-[11px] text-muted-foreground italic truncate">{plant.species}</p>
      )}
      {isOwner && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
          <button
            onClick={onToggleShare}
            className="text-[10px] text-muted-foreground hover:text-primary transition-colors font-serif flex items-center gap-1"
          >
            {plant.is_shared ? <Lock className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
            {plant.is_shared ? "Make Private" : "Share"}
          </button>
          <button
            onClick={onDelete}
            className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </CardContent>
  </Card>
);

/* ---------- Add Plant Dialog ---------- */

const AddPlantDialog = ({
  open,
  onOpenChange,
  userId,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  onAdded: () => void;
}) => {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("greenhouse").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("greenhouse").getPublicUrl(path);
      setPhotoUrl(publicUrl);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("greenhouse_plants").insert({
        user_id: userId,
        name: name.trim(),
        species: species.trim() || null,
        photo_url: photoUrl,
        notes: notes.trim() || null,
      });
      if (error) throw error;
      toast({ title: "Plant added! 🌱" });
      setName("");
      setSpecies("");
      setNotes("");
      setPhotoUrl(null);
      setPreviewUrl(null);
      onOpenChange(false);
      onAdded();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md p-0">
        <div
          className="h-0.5"
          style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), transparent)" }}
        />
        <div className="px-6 pt-5 pb-0">
          <DialogHeader>
            <DialogTitle className="text-primary font-serif text-xl tracking-wide flex items-center gap-2">
              <span className="text-2xl">🌱</span> Add Plant
            </DialogTitle>
            <p className="text-xs text-muted-foreground font-serif tracking-wider mt-1">
              Log a houseplant or sapling in your greenhouse
            </p>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="font-serif text-xs tracking-widest uppercase text-muted-foreground">
              Name *
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 100))}
              placeholder="e.g. Kitchen Fern"
              maxLength={100}
              required
              className="font-serif"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-serif text-xs tracking-widest uppercase text-muted-foreground">
              Species
            </Label>
            <Input
              value={species}
              onChange={(e) => setSpecies(e.target.value.slice(0, 100))}
              placeholder="e.g. Nephrolepis exaltata"
              maxLength={100}
              className="font-serif italic"
            />
          </div>

          {/* Photo */}
          <div className="space-y-1.5">
            <Label className="font-serif text-xs tracking-widest uppercase text-muted-foreground">
              Photo
            </Label>
            {previewUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => { setPreviewUrl(null); setPhotoUrl(null); }}
                >
                  <X className="h-4 w-4" />
                </Button>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-lg border-2 border-dashed border-border/50 hover:border-primary/40 transition-colors p-6 text-center"
              >
                <ImagePlus className="h-6 w-6 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground font-serif">Click to upload a photo</p>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="font-serif text-xs tracking-widest uppercase text-muted-foreground">
              Notes
            </Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              placeholder="Any notes about this plant..."
              maxLength={500}
              className="font-serif"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="font-serif text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading} className="flex-1 font-serif text-xs tracking-wider gap-1.5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sprout className="h-3 w-3" />}
              {uploading ? "Uploading..." : "Add Plant"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Greenhouse;
