import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LocateFixed, Search } from "lucide-react";
import { convertToCoordinates } from "@/utils/what3words";

interface AddTreeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latitude: number | null;
  longitude: number | null;
  what3words?: string;
}

const AddTreeDialog = ({ open, onOpenChange, latitude: initLat, longitude: initLng, what3words: initialW3w }: AddTreeDialogProps) => {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [description, setDescription] = useState("");
  const [what3words, setWhat3words] = useState(initialW3w || "");
  const [lat, setLat] = useState<number | null>(initLat);
  const [lng, setLng] = useState<number | null>(initLng);
  const [loading, setLoading] = useState(false);
  const [fetchingW3w, setFetchingW3w] = useState(false);
  const [findingMe, setFindingMe] = useState(false);
  const [lookingUpW3w, setLookingUpW3w] = useState(false);
  const { toast } = useToast();

  // Fetch what3words from coordinates
  const fetchWhat3words = async (latitude: number, longitude: number) => {
    setFetchingW3w(true);
    try {
      const { data, error } = await supabase.functions.invoke('convert-what3words', {
        body: { mode: 'coordinates-to-words', latitude, longitude }
      });
      if (!error && data?.words) {
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
    if (open && initLat && initLng && !what3words) {
      setLat(initLat);
      setLng(initLng);
      fetchWhat3words(initLat, initLng);
    }
  });

  // Find Me — use geolocation to get current position
  const handleFindMe = () => {
    if (!navigator.geolocation) {
      toast({ title: "Not supported", description: "Your browser doesn't support geolocation", variant: "destructive" });
      return;
    }
    setFindingMe(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        fetchWhat3words(latitude, longitude);
        setFindingMe(false);
        toast({ title: "Location found!", description: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
      },
      (err) => {
        setFindingMe(false);
        toast({ title: "Location error", description: err.message, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Look up what3words address to get coordinates
  const handleLookupW3w = async () => {
    const trimmed = what3words.trim();
    if (!trimmed) return;
    setLookingUpW3w(true);
    try {
      const result = await convertToCoordinates(trimmed);
      if (result?.coordinates) {
        setLat(result.coordinates.lat);
        setLng(result.coordinates.lng);
        setWhat3words(result.words);
        toast({ title: "Location found!", description: `${result.coordinates.lat.toFixed(6)}, ${result.coordinates.lng.toFixed(6)}` });
      } else {
        toast({ title: "Not found", description: "Could not resolve that what3words address", variant: "destructive" });
      }
    } catch (err: any) {
      if (err.message === 'quota_exceeded') {
        toast({ title: "Quota exceeded", description: "what3words API quota reached. Try again later.", variant: "destructive" });
      } else {
        toast({ title: "Lookup failed", description: "Could not look up the address", variant: "destructive" });
      }
    } finally {
      setLookingUpW3w(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !species.trim()) {
      toast({ title: "Missing fields", description: "Please fill in name and species", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({ title: "Not authenticated", description: "Please sign in to add trees", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from('trees').insert({
        name: name.trim(),
        species: species.trim(),
        description: description.trim() || null,
        what3words: what3words.trim() || '',
        latitude: lat,
        longitude: lng,
        created_by: user.id,
      });

      if (error) throw error;

      toast({ title: "Tree added!", description: `${name} has been added to the map` });
      setName("");
      setSpecies("");
      setDescription("");
      setWhat3words("");
      setLat(null);
      setLng(null);
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error adding tree", description: err.message, variant: "destructive" });
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
            <Input id="name" value={name} onChange={(e) => setName(e.target.value.slice(0, 200))} placeholder="e.g., The Old Oak" maxLength={200} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="species">Species *</Label>
            <Input id="species" value={species} onChange={(e) => setSpecies(e.target.value.slice(0, 200))} placeholder="e.g., Quercus robur" maxLength={200} required />
          </div>

          {/* what3words with lookup */}
          <div className="space-y-2">
            <Label htmlFor="what3words">
              what3words
              {fetchingW3w && <Loader2 className="inline ml-2 h-3 w-3 animate-spin" />}
            </Label>
            <div className="flex gap-2">
              <Input
                id="what3words"
                value={what3words}
                onChange={(e) => setWhat3words(e.target.value)}
                placeholder="e.g., filled.count.soap"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleLookupW3w}
                disabled={lookingUpW3w || !what3words.trim()}
                title="Look up what3words address"
              >
                {lookingUpW3w ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Find Me button */}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleFindMe}
            disabled={findingMe}
          >
            {findingMe ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            Find Me — Use My Location
          </Button>

          {lat && lng && (
            <div className="text-xs text-muted-foreground">
              📍 {lat.toFixed(6)}, {lng.toFixed(6)}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value.slice(0, 2000))} placeholder="Tell us about this tree..." maxLength={2000} rows={3} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
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