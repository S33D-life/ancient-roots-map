/**
 * OfferingPhotoTray — horizontal tray for capturing 1–3 photos
 * for an offering. Designed for "moment capture" not gallery — light,
 * fast, sacred. Each slot supports tap-to-preview + remove + drag-to-reorder.
 *
 * The first photo (index 0) is the cover. Drag any tile to reorder.
 */
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ImagePlus, X, Loader2, Star } from "lucide-react";

export interface PhotoSlot {
  id: string;
  file: File;
  previewUrl: string;
}

interface Props {
  photos: PhotoSlot[];
  onAdd: (file: File) => void;
  onRemove: (id: string) => void;
  /** Called with the reordered list when user drops a tile in a new position. */
  onReorder?: (next: PhotoSlot[]) => void;
  max?: number;
  disabled?: boolean;
  /** When true, shows per-slot processing state */
  uploadingIds?: Set<string>;
  /** When provided, shows an overall upload progress bar above the tray. */
  uploadProgress?: {
    /** Total photos being uploaded in this batch. */
    total: number;
    /** Photos finished uploading so far. */
    done: number;
    /** True if any upload in the batch failed. */
    failed?: boolean;
  };
}

const OfferingPhotoTray = ({
  photos,
  onAdd,
  onRemove,
  onReorder,
  max = 3,
  disabled = false,
  uploadingIds,
}: Props) => {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Touch-based drag state (pointer events)
  const touchDragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const canAdd = photos.length < max && !disabled;
  const isComplete = photos.length === max;
  const canReorder = !!onReorder && photos.length > 1 && !disabled;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = max - photos.length;
    const list = Array.from(files).slice(0, remaining);
    list.forEach(onAdd);
  };

  const reorder = (fromId: string, toId: string) => {
    if (!onReorder || fromId === toId) return;
    const fromIdx = photos.findIndex((p) => p.id === fromId);
    const toIdx = photos.findIndex((p) => p.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...photos];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onReorder(next);
  };

  // ---- HTML5 DnD (desktop) ----
  const onDragStart = (e: React.DragEvent, id: string) => {
    if (!canReorder) return;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", id);
    } catch {
      // some browsers throw if called outside dragstart
    }
  };

  const onDragOverTile = (e: React.DragEvent, id: string) => {
    if (!canReorder || !draggingId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overId !== id) setOverId(id);
  };

  const onDropTile = (e: React.DragEvent, id: string) => {
    if (!canReorder) return;
    e.preventDefault();
    const fromId = draggingId || e.dataTransfer.getData("text/plain");
    if (fromId) reorder(fromId, id);
    setDraggingId(null);
    setOverId(null);
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setOverId(null);
  };

  // ---- Pointer-based DnD (touch) ----
  // We use a long-press-ish approach: a small movement threshold cancels tap.
  const onPointerDown = (e: React.PointerEvent, id: string) => {
    if (!canReorder) return;
    if (e.pointerType === "mouse") return; // mouse uses native DnD
    touchDragRef.current = { id, startX: e.clientX, startY: e.clientY, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = touchDragRef.current;
    if (!drag) return;
    const dx = Math.abs(e.clientX - drag.startX);
    const dy = Math.abs(e.clientY - drag.startY);
    if (!drag.moved && (dx > 8 || dy > 8)) {
      drag.moved = true;
      setDraggingId(drag.id);
      try {
        (e.target as Element).setPointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    if (drag.moved) {
      e.preventDefault();
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const tile = el?.closest("[data-photo-id]") as HTMLElement | null;
      const id = tile?.dataset.photoId;
      if (id && id !== overId) setOverId(id);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const drag = touchDragRef.current;
    touchDragRef.current = null;
    if (!drag || !drag.moved) {
      setDraggingId(null);
      setOverId(null);
      return;
    }
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const tile = el?.closest("[data-photo-id]") as HTMLElement | null;
    const targetId = tile?.dataset.photoId;
    if (targetId) reorder(drag.id, targetId);
    setDraggingId(null);
    setOverId(null);
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
          {canReorder && (
            <p className="text-[10px] font-serif text-muted-foreground/50 tracking-wider">
              drag to reorder · first is cover
            </p>
          )}
          {isComplete && !canReorder && (
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
              const isCover = idx === 0;
              const isDragging = draggingId === p.id;
              const isOver = overId === p.id && draggingId && draggingId !== p.id;
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.85, y: 6 }}
                  animate={{
                    opacity: isDragging ? 0.5 : 1,
                    scale: isDragging ? 0.95 : 1,
                    y: 0,
                  }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="shrink-0 relative"
                  data-photo-id={p.id}
                  draggable={canReorder}
                  onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, p.id)}
                  onDragOver={(e) => onDragOverTile(e as unknown as React.DragEvent, p.id)}
                  onDrop={(e) => onDropTile(e as unknown as React.DragEvent, p.id)}
                  onDragEnd={onDragEnd}
                  onPointerDown={(e) => onPointerDown(e, p.id)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={() => {
                    touchDragRef.current = null;
                    setDraggingId(null);
                    setOverId(null);
                  }}
                  style={{ touchAction: canReorder ? "none" : undefined }}
                >
                  {/* Drop indicator */}
                  {isOver && (
                    <div className="absolute inset-0 -m-0.5 rounded-lg ring-2 ring-primary/70 pointer-events-none z-10" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      // Suppress click after drag
                      if (draggingId) return;
                      setPreview(p.previewUrl);
                    }}
                    className={`w-20 h-20 rounded-lg overflow-hidden border transition-all relative group ${
                      isCover ? "border-primary/50" : "border-border/40 hover:border-primary/40"
                    } ${canReorder ? "cursor-grab active:cursor-grabbing" : ""}`}
                  >
                    <img
                      src={p.previewUrl}
                      alt={`Photo ${idx + 1}${isCover ? " (cover)" : ""}`}
                      className="w-full h-full object-cover pointer-events-none select-none"
                      draggable={false}
                    />
                    {isCover && photos.length > 1 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/80 to-transparent px-1 py-0.5 flex items-center justify-center gap-0.5">
                        <Star className="w-2.5 h-2.5 text-primary-foreground fill-primary-foreground" />
                        <span className="text-[8px] font-serif text-primary-foreground tracking-wider uppercase">
                          Cover
                        </span>
                      </div>
                    )}
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
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-background border border-border/60 flex items-center justify-center hover:bg-destructive hover:border-destructive hover:text-destructive-foreground transition-colors shadow-sm z-20"
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
