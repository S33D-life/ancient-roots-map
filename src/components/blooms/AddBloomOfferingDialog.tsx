import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, Loader2, Flower2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { createBloomOffering, uploadBloomPhoto } from "@/repositories/blooms";
import { useInvalidateBlooms } from "@/hooks/use-blooms";

interface Props {
  treeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddBloomOfferingDialog({ treeId, open, onOpenChange }: Props) {
  const { userId } = useCurrentUser();
  const invalidate = useInvalidateBlooms();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [species, setSpecies] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setNote("");
    setSpecies("");
  };

  const onSelectFile = (f: File | null) => {
    setFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const onSubmit = async () => {
    if (!userId) {
      toast.error("Sign in to leave a bloom offering");
      return;
    }
    if (!file) {
      toast.error("Add a photo of the bloom first");
      return;
    }
    setSubmitting(true);
    try {
      let lat: number | null = null;
      let lng: number | null = null;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000, maximumAge: 60000 }),
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          /* optional */
        }
      }

      const url = await uploadBloomPhoto(userId, file);
      const result = await createBloomOffering({
        treeId,
        userId,
        imageUrl: url,
        note,
        speciesGuess: species,
        latitude: lat,
        longitude: lng,
      });

      invalidate(treeId);
      toast.success(
        result.firstOfSeason
          ? `🌸 First bloom of the season — +${result.heartsAwarded} Hearts`
          : `🌿 Bloom offered — +${result.heartsAwarded} Hearts`,
      );
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error("[bloom-offering]", err);
      toast.error("Could not leave the bloom — try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) { onOpenChange(o); if (!o) reset(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl flex items-center gap-2">
            <Flower2 className="h-5 w-5 text-primary" />
            Bloom Offering
          </DialogTitle>
          <DialogDescription>
            Leave a flower nearby as an offering to the seasons surrounding this tree.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onSelectFile(e.target.files?.[0] || null)}
            />
            {preview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="block w-full overflow-hidden rounded-xl border border-primary/20 bg-muted/40"
              >
                <img src={preview} alt="Bloom preview" className="w-full h-56 object-cover" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full h-56 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-muted/30 text-muted-foreground hover:bg-muted/50 transition"
              >
                <Camera className="h-8 w-8" />
                <span className="text-base">Take or choose a photo</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bloom-note">What caught your eye? <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="bloom-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="A small line, if any…"
              rows={2}
              maxLength={280}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bloom-species">Species guess <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="bloom-species"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="e.g. bluebell, hawthorn, primrose"
            />
          </div>

          <Button onClick={onSubmit} disabled={submitting || !file} className="w-full">
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Offering…</> : "Leave Bloom Offering"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
