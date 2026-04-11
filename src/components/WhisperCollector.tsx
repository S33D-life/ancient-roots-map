/**
 * WhisperCollector — Shown after check-in when whispers are available at this tree.
 * Ceremonial reveal with collect action.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TreeWhisper, collectPrivateWhisper, collectSharedWhisper } from "@/hooks/use-whispers";
import { Button } from "@/components/ui/button";
import { TreeDeciduous, MessageCircle, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { VISIBILITY_LABELS, HEARTWOOD_LINE } from "@/lib/heartwood-labels";

interface Props {
  whispers: TreeWhisper[];
  userId: string;
  treeId: string;
  treeName: string;
  onCollected?: () => void;
}

export default function WhisperCollector({ whispers, userId, treeId, treeName, onCollected }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [collecting, setCollecting] = useState(false);
  const [collectedIds, setCollectedIds] = useState<Set<string>>(new Set());

  if (whispers.length === 0) return null;

  const uncollected = whispers.filter(w => !collectedIds.has(w.id));
  if (uncollected.length === 0 && revealed) return null;

  const current = uncollected[currentIndex] || uncollected[0];
  const isHeartwood = current?.recipient_scope !== "PUBLIC";

  const handleCollect = async () => {
    if (!current) return;
    setCollecting(true);

    let error;
    if (current.recipient_scope === "PRIVATE") {
      ({ error } = await collectPrivateWhisper(current.id, treeId));
    } else {
      ({ error } = await collectSharedWhisper(current.id, userId, treeId));
    }

    if (error) {
      toast.error("Could not collect this whisper.");
      console.error(error);
    } else {
      setCollectedIds(prev => new Set([...prev, current.id]));
      toast.success("Whisper collected.", { icon: "🍃" });
      if (currentIndex < uncollected.length - 1) {
        setCurrentIndex(i => i + 1);
      }
      onCollected?.();
    }
    setCollecting(false);
  };

  if (!revealed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl border p-4 backdrop-blur-sm"
        style={{
          borderColor: "hsl(260 40% 55% / 0.15)",
          background: "linear-gradient(135deg, hsl(260 40% 50% / 0.06), hsl(200 40% 50% / 0.04))",
        }}
      >
        <button
          onClick={() => setRevealed(true)}
          className="w-full flex items-center gap-3 text-left"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, hsl(260 40% 50% / 0.15), hsl(200 40% 50% / 0.1))",
            }}
          >
            <MessageCircle className="w-5 h-5" style={{ color: "hsl(260 40% 60%)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-serif" style={{ color: "hsl(260 40% 65%)" }}>
              A whisper waits in this tree…
            </p>
            <p className="text-[11px] text-muted-foreground font-serif mt-0.5">
              {uncollected.length} whisper{uncollected.length !== 1 ? "s" : ""} to receive
            </p>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "hsl(260 40% 55% / 0.4)" }} />
        </button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={current?.id || "done"}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        className="rounded-xl border p-5 backdrop-blur-sm space-y-4"
        style={{
          borderColor: isHeartwood ? "hsl(var(--accent) / 0.15)" : "hsl(260 40% 55% / 0.15)",
          background: isHeartwood
            ? "linear-gradient(135deg, hsl(var(--accent) / 0.04), hsl(var(--muted) / 0.06))"
            : "linear-gradient(135deg, hsl(var(--card) / 0.8), hsl(260 40% 50% / 0.04))",
        }}
      >
        <div className="flex items-center gap-2">
          <TreeDeciduous className="w-4 h-4" style={{ color: "hsl(260 40% 60%)" }} />
          <span className="text-xs font-serif text-muted-foreground tracking-wider uppercase">
            Whisper from the Canopy
          </span>
          <span className="ml-auto text-[9px] font-serif px-2 py-0.5 rounded-full"
            style={{
              background: isHeartwood ? "hsl(var(--accent) / 0.08)" : "hsl(260 40% 55% / 0.08)",
              color: isHeartwood ? "hsl(var(--accent-foreground))" : "hsl(260 40% 60%)",
              border: isHeartwood ? "1px solid hsl(var(--accent) / 0.15)" : "1px solid hsl(260 40% 55% / 0.15)",
            }}
          >
            {current?.recipient_scope === "PUBLIC"
              ? VISIBILITY_LABELS.public
              : VISIBILITY_LABELS.private}
          </span>
        </div>

        {current && !collectedIds.has(current.id) ? (
          <>
            <div className="pl-4" style={{ borderLeft: `2px solid ${isHeartwood ? "hsl(var(--accent) / 0.2)" : "hsl(260 40% 55% / 0.2)"}` }}>
              <p className="text-sm font-serif text-foreground/90 leading-relaxed italic">
                "{current.message_content}"
              </p>
            </div>

            {isHeartwood && (
              <p className="text-[9px] font-serif text-muted-foreground/50 text-center italic leading-relaxed px-2">
                {HEARTWOOD_LINE}
              </p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-serif">
                Through {treeName}
              </span>
              <Button
                onClick={handleCollect}
                disabled={collecting}
                size="sm"
                variant="outline"
                className="font-serif text-xs gap-1.5 border-primary/20"
              >
                {collecting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Receive Whisper
              </Button>
            </div>

            {uncollected.length > 1 && (
              <p className="text-[10px] text-muted-foreground/50 font-serif text-center">
                {currentIndex + 1} of {uncollected.length}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm font-serif text-muted-foreground text-center py-2">
            All whispers collected. 🍃
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
