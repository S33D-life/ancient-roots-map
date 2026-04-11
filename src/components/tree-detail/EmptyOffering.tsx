/**
 * EmptyOffering — Empty state for offering type tabs.
 * Guides users with clear next action instead of a bare placeholder.
 */
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OfferingType } from "@/hooks/use-offerings";

const emptyMessages: Record<string, { primary: string; secondary: string }> = {
  photo: {
    primary: "Leave the first memory beneath this tree.",
    secondary: "Photos become part of this tree's living story.",
  },
  song: {
    primary: "Be the first to offer a song to this Ancient Friend.",
    secondary: "Songs weave into the tree's presence on Earth Radio.",
  },
  poem: {
    primary: "Write the first poem for this tree's story.",
    secondary: "Poems are preserved in the tree's heartwood forever.",
  },
  story: {
    primary: "Share the first musing about this Ancient Friend.",
    secondary: "Stories give context and meaning to the living ledger.",
  },
  voice: {
    primary: "Record the first voice offering for this tree.",
    secondary: "Your voice becomes a whisper in the canopy.",
  },
  book: {
    primary: "Offer the first book to this tree's library.",
    secondary: "Books connect human knowledge to ancient roots.",
  },
  nft: {
    primary: "Create the first digital artifact for this tree.",
    secondary: "Artifacts anchor this tree's story on-chain.",
  },
};

const emojis: Record<string, string> = {
  photo: "📷", song: "🎵", poem: "📜", story: "✍️", book: "📖", voice: "🎙️", nft: "✨",
};

const EmptyOffering = ({ type, label, onAdd }: { type: OfferingType; label: string; onAdd: () => void }) => {
  const msgs = emptyMessages[type] || { primary: `No ${label.toLowerCase()} yet.`, secondary: "" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-xl border border-dashed border-primary/20 p-10 text-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 80%, hsl(var(--primary) / 0.04), transparent 70%)" }}
    >
      <div className="text-4xl mb-3 opacity-30">{emojis[type] || "✨"}</div>
      <p className="text-muted-foreground font-serif mb-1 text-sm">{msgs.primary}</p>
      {msgs.secondary && (
        <p className="text-muted-foreground/50 font-serif mb-4 text-[11px]">{msgs.secondary}</p>
      )}
      <Button variant="outline" size="sm" onClick={onAdd} className="font-serif tracking-wider text-xs gap-1.5">
        <Sparkles className="h-3 w-3" />
        Leave the first {label.slice(0, -1).toLowerCase()}
      </Button>
    </motion.div>
  );
};

export default EmptyOffering;
