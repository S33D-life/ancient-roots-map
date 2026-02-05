import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AddTreeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latitude: number | null;
  longitude: number | null;
  what3words?: string;
}

const AddTreeDialog = ({ open, onOpenChange, latitude, longitude, what3words: initialW3w }: AddTreeDialogProps) => {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [description, setDescription] = useState("");
  const [what3words, setWhat3words] = useState(initialW3w || "");
  const [loading, setLoading] = useState(false);
  const [fetchingW3w, setFetchingW3w] = useState(false);
  const { toast } = useToast();

  // Fetch what3words from coordinates if not provided
  const fetchWhat3words = async () => {
    if (!latitude || !longitude) return;
    
    setFetchingW3w(true);
    try {
      const { data, error } = await supabase.functions.invoke('convert-what3words', {
        body: { 
          mode: 'coordinates-to-words',
          latitude,
          longitude
        }
      });

      if (error) throw error;
      if (data?.words) {
        setWhat3words(data.words);
      }
    } catch (err) {
      console.error('Failed to fetch what3words:', err);
    } finally {
      setFetchingW3w(false);
    }
  };

  // Auto-fetch what3words when dialog opens with coordinates
  useState(() => {
    if (open && latitude && longitude && !what3words) {
      fetchWhat3words();
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !species.trim() || !what3words.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in name, species, and what3words",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Not authenticated",
          description: "Please sign in to add trees",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from('trees').insert({
        name: name.trim(),
        species: species.trim(),
        description: description.trim() || null,
        what3words: what3words.trim(),
        latitude,
        longitude,
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Tree added!",
        description: `${name} has been added to the map`,
      });

      // Reset form
      setName("");
      setSpecies("");
      setDescription("");
      setWhat3words("");
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Error adding tree",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary font-serif">Add a Tree</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tree Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., The Old Oak"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="species">Species *</Label>
            <Input
              id="species"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="e.g., Quercus robur"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="what3words">
              what3words *
              {fetchingW3w && <Loader2 className="inline ml-2 h-3 w-3 animate-spin" />}
            </Label>
            <Input
              id="what3words"
              value={what3words}
              onChange={(e) => setWhat3words(e.target.value)}
              placeholder="e.g., filled.count.soap"
              required
            />
          </div>

          {latitude && longitude && (
            <div className="text-xs text-muted-foreground">
              📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about this tree..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Tree
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTreeDialog;
