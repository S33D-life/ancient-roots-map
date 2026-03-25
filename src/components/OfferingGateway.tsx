/**
 * OfferingGateway — Full-screen "choose your offering" entry point.
 * User picks a type, then transitions into the focused offering flow.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type GatewayOfferingType =
  | "photo" | "song" | "book" | "story"
  | "poem" | "quote" | "voice" | "wish"
  | "seasonal_observation" | "encounter" | "gratitude" | "intention"
  | "nft";

interface OfferingOption {
  type: GatewayOfferingType;
  emoji: string;
  label: string;
  subtitle: string;
}

const PRIMARY: OfferingOption[] = [
  { type: "photo", emoji: "📸", label: "Memory", subtitle: "Capture a moment" },
  { type: "song", emoji: "🎵", label: "Song", subtitle: "Offer a sound" },
  { type: "book", emoji: "📚", label: "Book", subtitle: "Share a passage" },
  { type: "story", emoji: "✍️", label: "Musing", subtitle: "Write a thought" },
];

const SECONDARY: OfferingOption[] = [
  { type: "poem", emoji: "📜", label: "Poem", subtitle: "Offer something timeless" },
  { type: "voice", emoji: "🎙️", label: "Voice", subtitle: "Speak your offering" },
];

const LIVING: OfferingOption[] = [
  { type: "gratitude", emoji: "💓", label: "Gratitude", subtitle: "What are you thankful for?" },
  { type: "intention", emoji: "🔥", label: "Intention", subtitle: "What are you planting forward?" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (type: GatewayOfferingType) => void;
  treeName?: string;
}

const OfferingGateway = ({ open, onClose, onSelect, treeName }: Props) => {
  const [showMore, setShowMore] = useState(false);

  const renderCard = (opt: OfferingOption, size: "lg" | "sm" = "lg") => (
    <motion.button
      key={opt.type}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(opt.type)}
      className={cn(
        "relative flex items-center gap-3 w-full rounded-2xl text-left transition-all",
        "border border-border/20 hover:border-primary/30",
        "active:bg-primary/10",
        size === "lg" ? "p-4" : "p-3",
      )}
      style={{
        background: "radial-gradient(ellipse at 30% 50%, hsl(var(--primary) / 0.04), transparent 70%)",
      }}
    >
      <span className={cn("shrink-0", size === "lg" ? "text-3xl" : "text-2xl")}>{opt.emoji}</span>
      <div className="min-w-0">
        <p className={cn("font-serif font-medium text-foreground/90", size === "lg" ? "text-base" : "text-sm")}>
          {opt.label}
        </p>
        <p className="text-xs text-muted-foreground/60 font-serif">{opt.subtitle}</p>
      </div>
    </motion.button>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="offering-gateway"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex flex-col bg-background"
          style={{
            paddingTop: "env(safe-area-inset-top, 0px)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {/* Ambient background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 50% 20%, hsl(var(--primary) / 0.06), transparent 60%)",
            }}
          />

          {/* Header */}
          <div className="relative px-5 pt-4 pb-2 flex items-start gap-3">
            <button
              onClick={onClose}
              className="mt-1 p-2 -ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-xl text-primary tracking-wide">
                What would you like to offer?
              </h2>
              <p className="text-xs text-muted-foreground/60 font-serif mt-1">
                {treeName
                  ? `Each offering becomes part of ${treeName}'s living story`
                  : "Each offering becomes part of this tree's living story"}
              </p>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-2 space-y-3">
            {/* Primary offerings */}
            <div className="grid grid-cols-1 gap-2.5">
              {PRIMARY.map((opt) => renderCard(opt, "lg"))}
            </div>

            {/* Secondary + Living */}
            <button
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-2 w-full py-2 text-xs font-serif text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
            >
              <div className="h-px flex-1 bg-border/15" />
              <ChevronDown className={cn("w-3 h-3 transition-transform", showMore && "rotate-180")} />
              <span>Other ways to offer</span>
              <div className="h-px flex-1 bg-border/15" />
            </button>

            <AnimatePresence>
              {showMore && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-2"
                >
                  {SECONDARY.map((opt) => renderCard(opt, "sm"))}

                  {/* Living / contextual */}
                  <p className="text-[10px] font-serif text-muted-foreground/30 uppercase tracking-widest pt-2 px-1">
                    Living observations
                  </p>
                  {LIVING.map((opt) => renderCard(opt, "sm"))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfferingGateway;
