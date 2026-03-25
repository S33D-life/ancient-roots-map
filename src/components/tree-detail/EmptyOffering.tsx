/**
 * EmptyOffering — Empty state for offering type tabs.
 * Extracted from TreeDetailPage.
 */
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OfferingType } from "@/hooks/use-offerings";

const emptyMessages: Record<string, string> = {
  photo: "Leave the first memory beneath this tree.",
  song: "Be the first to offer a song to this Ancient Friend.",
  poem: "Write the first poem for this tree's story.",
  story: "Share the first musing about this Ancient Friend.",
  voice: "Record the first voice offering for this tree.",
  book: "Offer the first book to this tree's library.",
  nft: "Create the first digital artifact for this tree.",
};

const EmptyOffering = ({ type, label, onAdd }: { type: OfferingType; label: string; onAdd: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="relative rounded-xl border border-dashed border-primary/20 p-10 text-center overflow-hidden"
    style={{ background: "radial-gradient(ellipse at 50% 80%, hsl(var(--primary) / 0.04), transparent 70%)" }}
  >
    <div className="text-4xl mb-3 opacity-30">
      {type === "photo" ? "📷" : type === "song" ? "🎵" : type === "poem" ? "📜" : type === "story" ? "✍️" : type === "book" ? "📖" : type === "voice" ? "🎙️" : "✨"}
    </div>
    <p className="text-muted-foreground font-serif mb-4 text-sm">
      {emptyMessages[type] || `No ${label.toLowerCase()} yet.`}
    </p>
    <Button variant="outline" size="sm" onClick={onAdd} className="font-serif tracking-wider text-xs gap-1.5">
      <Sparkles className="h-3 w-3" />
      Leave the first {label.slice(0, -1).toLowerCase()}
    </Button>
  </motion.div>
);

export default EmptyOffering;
