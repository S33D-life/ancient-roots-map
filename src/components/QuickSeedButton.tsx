/**
 * QuickSeedButton — A calm, one-tap seed planting action.
 * Renders inline wherever a tree is encountered.
 */
import { useState, useCallback, memo } from "react";
import { Sprout, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useSeedEconomy } from "@/hooks/use-seed-economy";

interface QuickSeedButtonProps {
  treeId: string;
  treeLat: number | null;
  treeLng: number | null;
  userId: string | null;
  /** "icon" = compact circle, "button" = wider with label */
  variant?: "icon" | "button";
  className?: string;
}

const QuickSeedButton = memo(({
  treeId,
  treeLat,
  treeLng,
  userId,
  variant = "icon",
  className = "",
}: QuickSeedButtonProps) => {
  const { seedsRemaining, plantSeed } = useSeedEconomy(userId);
  const [planting, setPlanting] = useState(false);
  const [justPlanted, setJustPlanted] = useState(false);

  const disabled = !userId || seedsRemaining <= 0 || treeLat == null || treeLng == null;

  const handlePlant = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (disabled || planting || treeLat == null || treeLng == null) return;

    setPlanting(true);
    const success = await plantSeed(treeId, treeLat, treeLng);
    setPlanting(false);

    if (success) {
      setJustPlanted(true);
      toast.success("Seed planted 🌱");
      setTimeout(() => setJustPlanted(false), 2200);
    } else {
      if (seedsRemaining <= 0) {
        toast.error("No seeds remaining today");
      } else {
        toast.error("Move closer to plant a seed");
      }
    }
  }, [disabled, planting, plantSeed, treeId, treeLat, treeLng, seedsRemaining]);

  if (!userId) return null;

  if (variant === "icon") {
    return (
      <button
        onClick={handlePlant}
        disabled={disabled || planting}
        aria-label="Plant seed at this tree"
        title={disabled ? "No seeds available" : `Plant seed (${seedsRemaining} left)`}
        className={`
          relative inline-flex items-center justify-center
          w-8 h-8 rounded-full
          border transition-all duration-200
          ${disabled
            ? "border-border/20 bg-muted/10 text-muted-foreground/30 cursor-not-allowed"
            : justPlanted
              ? "border-primary/50 bg-primary/20 text-primary"
              : "border-primary/25 bg-primary/10 text-primary/70 hover:bg-primary/20 hover:text-primary hover:border-primary/40 active:scale-95"
          }
          ${className}
        `}
      >
        <AnimatePresence mode="wait">
          {planting ? (
            <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </motion.span>
          ) : justPlanted ? (
            <motion.span
              key="planted"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="text-sm"
            >
              🌱
            </motion.span>
          ) : (
            <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Sprout className="w-3.5 h-3.5" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    );
  }

  // "button" variant — wider, with label
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePlant}
      disabled={disabled || planting}
      aria-label="Plant seed at this tree"
      className={`
        text-xs gap-1.5 font-serif h-8
        ${disabled
          ? "border-border/20 text-muted-foreground/40"
          : justPlanted
            ? "border-primary/40 text-primary bg-primary/10"
            : "border-primary/25 text-primary/70 hover:bg-primary/10 hover:text-primary"
        }
        ${className}
      `}
    >
      {planting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : justPlanted ? (
        <span className="text-sm">🌱</span>
      ) : (
        <Sprout className="w-3.5 h-3.5" />
      )}
      {justPlanted ? "Planted!" : "Seed"}
    </Button>
  );
});

QuickSeedButton.displayName = "QuickSeedButton";

export default QuickSeedButton;
