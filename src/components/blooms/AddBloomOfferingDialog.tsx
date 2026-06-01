/**
 * AddBloomOfferingDialog — Single coherent Bloom Offering flow.
 *
 * Hooks: opened both from BloomsNearbySection (Offerings → Blooms tab)
 * AND from OfferingGateway (top-level Make Offering → Bloom). Both
 * entry points land here — Bloom never routes into Musing.
 *
 * Photo input intentionally exposes BOTH camera capture and a separate
 * library/gallery picker. iOS Safari/PWA honours these as distinct
 * inputs: `capture="environment"` opens the camera, the bare picker
 * opens the gallery. Combined into a single input, iOS often forces
 * the camera and the library option becomes unreliable — the bug
 * users were hitting.
 *
 * CTA sits in a sticky footer with `env(safe-area-inset-bottom)` so it
 * stays tappable above the home-indicator and bottom nav on iPhone.
 */
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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
      toast.error("Sign in to leave a blossom");
      return;
    }
    if (!file) {
      toast.error("Add a photo of the blossom first");
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
          ? `🌸 First blossom of the season — +${result.heartsAwarded} Hearts`
          : `🌸 Blossom offered — +${result.heartsAwarded} Hearts`,
      );
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error("[bloom-offering]", err);
      toast.error("Could not leave the blossom — try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) { onOpenChange(o); if (!o) reset(); } }}>
      <DialogContent
        className="max-w-md p-0 gap-0 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]"
      >
        {/* Hidden inputs — split so iOS reliably honours gallery vs camera */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onSelectFile(e.target.files?.[0] || null)}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onSelectFile(e.target.files?.[0] || null)}
        />

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 pt-6 pb-4 space-y-5">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="font-serif text-2xl flex items-center gap-2">
              <span aria-hidden className="text-2xl leading-none">🌸</span>
              Bloom Offering
            </DialogTitle>
            <DialogDescription className="font-serif italic text-muted-foreground">
              A seasonal memory — leave a blossom nearby for the atmosphere
              surrounding this tree.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {preview ? (
              <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-muted/40">
                <img src={preview} alt="Blossom preview" className="w-full h-56 object-cover" />
                <button
                  type="button"
                  onClick={() => onSelectFile(null)}
                  className="absolute top-2 right-2 rounded-full bg-background/80 backdrop-blur p-1.5 text-foreground hover:bg-background transition"
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex w-full h-48 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-muted/20 text-muted-foreground">
                <span aria-hidden className="text-3xl">🌸</span>
                <p className="font-serif text-sm italic">Notice a flower nearby</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                className="font-serif gap-2"
              >
                <Camera className="h-4 w-4" />
                Take photo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => galleryInputRef.current?.click()}
                className="font-serif gap-2"
              >
                <ImagePlus className="h-4 w-4" />
                From library
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bloom-note" className="font-serif">
              What caught your eye? <span className="text-muted-foreground/70">(optional)</span>
            </Label>
            <Textarea
              id="bloom-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="A small line, if any…"
              rows={2}
              maxLength={280}
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bloom-species" className="font-serif">
              Species guess <span className="text-muted-foreground/70">(optional)</span>
            </Label>
            <Input
              id="bloom-species"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="e.g. cherry blossom, bluebell, hawthorn"
              className="text-base"
            />
          </div>
        </div>

        {/* Sticky CTA footer — respects iOS safe-area + bottom nav */}
        <div
          className="border-t border-border/40 bg-background/95 backdrop-blur px-6 pt-3"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
          }}
        >
          <Button
            onClick={onSubmit}
            disabled={submitting || !file}
            className="w-full font-serif text-base h-12"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Offering…</>
            ) : (
              <>🌸 Leave Blossom Nearby</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
