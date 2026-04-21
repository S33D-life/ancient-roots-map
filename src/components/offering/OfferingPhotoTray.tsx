/**
 * OfferingPhotoTray — horizontal tray for capturing 1–3 photos
 * for an offering. Designed for "moment capture" not gallery — light,
 * fast, sacred. Each slot supports tap-to-preview + remove.
 */
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PhotoSlot {
  id: string;
  file: File;
  previewUrl: string;
}

interface Props {
  photos: PhotoSlot[];
  onAdd: (file: File) => void;
  onRemove: (id: string) => void;
  max?: number;
  disabled?: boolean;
  /** When true, shows per-slot processing state */
  uploadingIds?: Set<string>;
}

const OfferingPhotoTray = ({
  photos,
  onAdd,
  onRemove,
  max = 3,
  disabled = false,
  uploadingIds,
}: Props) => {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const canAdd = photos.length < max && !disabled;
  const isComplete = photos.length === max;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = max - photos.length;
    const list = Array.from(files).slice(0, remaining);
    list.forEach(onAdd);
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-serif text-muted-foreground/60 tracking-wider uppercase">
            {photos.length === 0
              ? "Capture this moment"
              : `${photos.length} of ${max} ${photos.length === 1 ? "photo" : "photos"}`}
          </p>
          {isComplete && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-[10px] font-serif text-primary/70 tracking-wider"
            >
              ✦ moment captured
            </motion.span>
          )}
        </div>

        <div
          className={`flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 transition-all ${
            isComplete ? "ring-1 ring-primary/20 rounded-xl p-1.5" : ""
          }`}
          style={
            isComplete
              ? { background: "radial-gradient(ellipse at 50% 50%, hsl(var(--primary) / 0.06), transparent 70%)" }
              : undefined
          }
        >
          {/* Add tile */}
          {canAdd && (
            <div className="shrink-0 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-primary/25 hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-1 group"
                style={{ background: "hsl(var(--primary) / 0.04)" }}
                aria-label="Add photo from gallery"
              >
                <ImagePlus className="w-4 h-4 text-primary/50 group-hover:text-primary/80 transition-colors" />
                <span className="text-[9px] font-serif text-primary/60 tracking-wider uppercase">Add</span>
              </button>
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="w-20 h-7 rounded-md border border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-1"
                aria-label="Take photo with camera"
              >
                <Camera className="w-3 h-3 text-primary/60" />
                <span className="text-[9px] font-serif text-primary/60 tracking-wider uppercase">Camera</span>
              </button>
            </div>
          )}

          {/* Photo tiles */}
          <AnimatePresence initial={false}>
            {photos.map((p, idx) => {
              const isUploading = uploadingIds?.has(p.id);
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.85, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="shrink-0 relative"
                >
                  <button
                    type="button"
                    onClick={() => setPreview(p.previewUrl)}
                    className="w-20 h-20 rounded-lg overflow-hidden border border-border/40 hover:border-primary/40 transition-all relative group"
                  >
                    <img
                      src={p.previewUrl}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      </div>
                    )}
                  </button>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => onRemove(p.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-background border border-border/60 flex items-center justify-center hover:bg-destructive hover:border-destructive hover:text-destructive-foreground transition-colors shadow-sm"
                      aria-label={`Remove photo ${idx + 1}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            handleFiles(e.target.files);
            if (galleryRef.current) galleryRef.current.value = "";
          }}
          className="hidden"
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            handleFiles(e.target.files);
            if (cameraRef.current) cameraRef.current.value = "";
          }}
          className="hidden"
        />
      </div>

      {/* Fullscreen preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4"
            onClick={() => setPreview(null)}
          >
            <button
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
              onClick={() => setPreview(null)}
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default OfferingPhotoTray;
