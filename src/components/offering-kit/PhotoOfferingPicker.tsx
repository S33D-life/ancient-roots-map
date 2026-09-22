/**
 * PhotoOfferingPicker — shared photo capability for offerings.
 * Choose from the photo library or take a photo, compress it in the
 * browser, upload to the `offerings` bucket, and show a large preview.
 *
 * Used by Life Grove offerings; safe for Ancient Friends reuse later.
 */
import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { uploadOfferingMedia, useOfferingMediaUrl } from "@/utils/offeringMedia";

export interface PhotoOfferingResult {
  url: string;
  width: number;
  height: number;
  bytes: number;
}

interface Props {
  /** Folder segment inside the bucket, e.g. a grove id. */
  pathPrefix: string;
  value: PhotoOfferingResult | null;
  onChange: (photo: PhotoOfferingResult | null) => void;
  label?: string;
  /** Offering visibility — non-public photos go to the private bucket. */
  visibility?: string | null;
}

const MAX_EDGE = 1800;
const QUALITY = 0.82;

async function compress(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the photo");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, "image/jpeg", QUALITY),
  );
  if (!blob) throw new Error("Could not prepare the photo");
  return { blob, width, height };
}

export default function PhotoOfferingPicker({ pathPrefix, value, onChange, label, visibility }: Props) {
  const previewUrl = useOfferingMediaUrl(value?.url ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("That file is not a photograph.");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) throw new Error("Please sign in to add a photograph.");
        const { blob, width, height } = await compress(file);
        const path = `${auth.user.id}/${pathPrefix}/${Date.now()}.jpg`;
        const url = await uploadOfferingMedia(path, blob, visibility, {
          contentType: "image/jpeg",
        });
        onChange({ url, width, height, bytes: blob.size });
      } catch (err) {
        setError(err instanceof Error ? err.message : "The photograph could not be added.");
      } finally {
        setBusy(false);
      }
    },
    [pathPrefix, onChange, visibility],
  );

  if (value) {
    return (
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-2xl overflow-hidden border border-border/30 bg-card/30"
        >
          <img src={previewUrl ?? value.url} alt="Your offering" className="w-full max-h-[52vh] object-contain" />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove photograph"
            className="absolute top-2 right-2 rounded-full bg-background/80 backdrop-blur p-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
        <Button variant="ghost" size="sm" className="font-serif text-xs" onClick={() => onChange(null)}>
          Choose a different photograph
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {label && <p className="font-serif text-sm text-muted-foreground/80">{label}</p>}
      <input ref={libraryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <div className="grid gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => libraryRef.current?.click()}
          className="h-14 font-serif text-sm justify-start gap-3"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          Choose from photo library
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => cameraRef.current?.click()}
          className="h-14 font-serif text-sm justify-start gap-3"
        >
          <Camera className="h-5 w-5" />
          Take a photo
        </Button>
      </div>
      {error && <p className="text-xs font-serif text-destructive/80">{error}</p>}
    </div>
  );
}
