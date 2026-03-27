/**
 * GreetingCardDialog — Generate, preview, and share greeting cards from tree data.
 */
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Download, Share2, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GreetingCardPreview, { type CardVariant, getCurrentSeason } from "./GreetingCardPreview";

interface GreetingCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tree: {
    name: string;
    species: string;
    imageUrl?: string | null;
    location?: string | null;
  };
  whispers?: string[];
}

const VARIANTS: { key: CardVariant; label: string; emoji: string }[] = [
  { key: "portrait", label: "Portrait", emoji: "🌳" },
  { key: "whisper", label: "Whisper", emoji: "🍃" },
  { key: "seasonal", label: "Seasonal", emoji: "✨" },
];

const GreetingCardDialog = ({ open, onOpenChange, tree, whispers = [] }: GreetingCardDialogProps) => {
  const [variant, setVariant] = useState<CardVariant>("portrait");
  const [selectedWhisper, setSelectedWhisper] = useState(whispers[0] || "");
  const [customMessage, setCustomMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentIdx = VARIANTS.findIndex((v) => v.key === variant);

  const cycleVariant = useCallback(
    (dir: 1 | -1) => {
      const next = (currentIdx + dir + VARIANTS.length) % VARIANTS.length;
      setVariant(VARIANTS[next].key);
    },
    [currentIdx]
  );

  const handleSave = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "transparent",
        cacheBust: true,
      });
      if (!blob) throw new Error("empty");
      const dl = document.createElement("a");
      dl.download = `${tree.name.replace(/\s+/g, "-").toLowerCase()}-greeting.png`;
      dl.href = URL.createObjectURL(blob);
      dl.click();
      toast({ title: "Card saved! 🌿" });
    } catch {
      // Fallback: copy card text
      const text = `🌳 ${tree.name} · ${tree.species}\n${selectedWhisper || customMessage || "An Ancient Friend awaits."}`;
      await navigator.clipboard.writeText(text).catch(() => {});
      toast({ title: "Card text copied (image save unavailable)" });
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      const text = `🌳 ${tree.name} · ${tree.species}\n${selectedWhisper || customMessage || "An Ancient Friend awaits."}`;
      await navigator.clipboard.writeText(text).catch(() => {});
      toast({ title: "Card text copied!" });
      return;
    }
    try {
      await navigator.share({
        title: `${tree.name} · Ancient Friend`,
        text: `🌳 ${tree.name} · ${tree.species}\n${selectedWhisper || customMessage || "An Ancient Friend awaits."}`,
      });
    } catch {
      /* cancelled */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-xl border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Create Greeting Card
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Variant selector */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => cycleVariant(-1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex gap-1.5">
              {VARIANTS.map((v) => (
                <button
                  key={v.key}
                  onClick={() => setVariant(v.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-serif transition-all ${
                    variant === v.key
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-secondary/20 text-muted-foreground border border-border/30 hover:border-primary/20"
                  }`}
                >
                  {v.emoji} {v.label}
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => cycleVariant(1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Card preview */}
          <div className="flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={variant}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="shadow-2xl rounded-2xl"
              >
                <GreetingCardPreview
                  ref={cardRef}
                  variant={variant}
                  treeName={tree.name}
                  species={tree.species}
                  imageUrl={tree.imageUrl}
                  location={tree.location}
                  whisperText={selectedWhisper || undefined}
                  customMessage={customMessage || undefined}
                  season={getCurrentSeason()}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Whisper selector (for whisper variant) */}
          {variant === "whisper" && whispers.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-serif text-muted-foreground">Choose a whisper</p>
              <div className="flex flex-wrap gap-1.5">
                {whispers.slice(0, 5).map((w, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedWhisper(w)}
                    className={`text-xs font-serif px-3 py-1.5 rounded-full border transition-all max-w-[200px] truncate ${
                      selectedWhisper === w
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/30 text-muted-foreground hover:border-primary/20"
                    }`}
                  >
                    {w.slice(0, 40)}{w.length > 40 ? "…" : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom message (for seasonal and whisper if no whispers) */}
          {(variant === "seasonal" || (variant === "whisper" && whispers.length === 0)) && (
            <div className="space-y-1">
              <Textarea
                value={variant === "whisper" ? selectedWhisper : customMessage}
                onChange={(e) => {
                  const val = e.target.value.slice(0, 150);
                  if (variant === "whisper") setSelectedWhisper(val);
                  else setCustomMessage(val);
                }}
                placeholder={variant === "whisper" ? "Write a whisper..." : "Add a personal message..."}
                rows={2}
                maxLength={150}
                className="font-serif text-sm resize-none"
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {(variant === "whisper" ? selectedWhisper : customMessage).length}/150
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 font-serif text-sm tracking-wider gap-2 min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              {saving ? "Saving…" : "Save Card"}
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex-1 font-serif text-sm tracking-wider gap-2 min-h-[44px]"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GreetingCardDialog;
