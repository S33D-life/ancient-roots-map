import { useState, useEffect, useCallback } from "react";
import { useTetolLevel, type TetolLevel } from "@/contexts/TetolLevelContext";
import { Leaf } from "lucide-react";

/**
 * Ambient contextual whispers from TEOTAG that appear based on the current TETOL level.
 * Clicking a whisper opens the TEOTAG guide panel.
 */

const WHISPERS: Record<TetolLevel, string[]> = {
  s33d: [
    "Every ancient forest began with a single seed…",
    "The roots remember what the branches dream…",
    "Welcome to TETOL. Wander freely — every path leads somewhere true.",
  ],
  roots: [
    "Each tree on this map holds a living story…",
    "Have you tried searching by what3words? Every tree has its own place-name.",
    "Leave an offering — a poem, a photo, a song — and the tree remembers.",
  ],
  heartwood: [
    "The Heartwood holds the grove's memory…",
    "Staff bearers carry the spirit of their species. Explore the Staff Room.",
    "Tree Radio plays the songs gifted to the grove…",
  ],
  canopy: [
    "The Council gathers in the canopy, where light meets leaf…",
    "Community wisdom grows like lichen — slowly, beautifully.",
  ],
  crown: [
    "The golden dream is a shared vision taking root…",
    "What grows in the Crown feeds every layer below.",
  ],
  hearth: [
    "Your Hearth is your personal fire in the grove…",
    "Seed pods planted here may grow into ancient friends someday.",
    "The Wishing Tree carries your intentions to the roots.",
  ],
};

interface TeotagWhisperProps {
  onOpenGuide: () => void;
}

const TeotagWhisper = ({ onOpenGuide }: TeotagWhisperProps) => {
  const { level } = useTetolLevel();
  const [whisper, setWhisper] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const showWhisper = useCallback(() => {
    const pool = WHISPERS[level] || WHISPERS.s33d;
    const text = pool[Math.floor(Math.random() * pool.length)];
    setWhisper(text);
    setVisible(true);

    // Auto-dismiss after 8 seconds
    const timer = setTimeout(() => {
      setVisible(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, [level]);

  useEffect(() => {
    // Show a whisper 5 seconds after level change (only if not dismissed)
    if (dismissed) return;
    setVisible(false);
    const timer = setTimeout(showWhisper, 5000);
    return () => clearTimeout(timer);
  }, [level, showWhisper, dismissed]);

  const handleClick = () => {
    setVisible(false);
    setDismissed(true);
    onOpenGuide();
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible(false);
    setDismissed(true);
  };

  if (!visible || !whisper) return null;

  return (
    <div
      onClick={handleClick}
      className="fixed bottom-24 right-4 z-[90] max-w-[280px] cursor-pointer animate-fade-in group"
    >
      <div className="relative bg-card/95 backdrop-blur-md border border-border/60 rounded-2xl rounded-br-md px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30">
        <div className="flex items-start gap-2.5">
          <Leaf className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" />
          <p className="text-sm font-serif text-foreground/80 leading-relaxed italic">
            {whisper}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
        >
          ×
        </button>
        <p className="text-[9px] text-muted-foreground/40 font-serif mt-1.5 text-right">
          — TEOTAG whispers
        </p>
      </div>
    </div>
  );
};

export default TeotagWhisper;
