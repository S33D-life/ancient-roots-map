/**
 * EmptyOffering — Empty state for offering type tabs.
 * Guides users with clear next action instead of a bare placeholder.
 *
 * Labels are singular ("Memory", "Song", "Art", "Prayer", …) — see
 * `offeringLabels` in `src/hooks/use-offerings.ts`. Do NOT trim the
 * label with slice(0, -1); that produced things like "Leave the first
 * memor" once we moved away from plural labels.
 */
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OfferingType } from "@/hooks/use-offerings";

const emptyMessages: Record<string, { primary: string; secondary: string }> = {
  photo: {
    primary: "The branches are bare. Hang the first memory.",
    secondary: "Photos become part of this tree's living story.",
  },
  song: {
    primary: "No song has found this tree yet. Offer the first sound.",
    secondary: "Songs weave into the tree's presence on Earth Radio.",
  },
  poem: {
    primary: "No poem has rooted here yet. Write the first verse.",
    secondary: "Poems are preserved in the tree's heartwood forever.",
  },
  story: {
    primary: "No musing has been left beneath these branches. Share the first thought.",
    secondary: "Stories give context and meaning to the living ledger.",
  },
  voice: {
    primary: "No voice has yet spoken here. Record the first whisper.",
    secondary: "Your voice becomes a whisper in the canopy.",
  },
  book: {
    primary: "No book has been laid at the roots. Offer the first reading.",
    secondary: "Books connect human knowledge to ancient roots.",
  },
  nft: {
    primary: "No digital artifact has been minted for this tree. Create the first.",
    secondary: "Artifacts anchor this tree's story on-chain.",
  },
  art: {
    primary: "No art has been hung in these branches. Leave the first drawing.",
    secondary: "Drawings and creative gifts join the living archive.",
  },
  prayer: {
    primary: "No prayer has been left here yet. Speak the first blessing.",
    secondary: "Prayers are held quietly within the tree's presence.",
  },
};

const emojis: Record<string, string> = {
  photo: "📷", song: "🎵", poem: "📜", story: "✍️", book: "📖",
  voice: "🎙️", nft: "✨", art: "🎨", prayer: "🙏",
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
        Leave the first {label.toLowerCase()}
      </Button>
    </motion.div>
  );
};

export default EmptyOffering;
