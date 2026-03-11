/**
 * WhisperEchoesFeed — Gentle ambient feed of recent public whispers.
 *
 * Shows messages drifting through the Ancient Friends network.
 * Each whisper links to its tree for organic discovery.
 */
import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, ChevronDown, TreePine } from "lucide-react";
import { useWhisperEchoes, type WhisperEcho } from "@/hooks/use-whisper-echoes";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface WhisperEchoesFeedProps {
  /** Max whispers to display */
  limit?: number;
  /** Compact single-line variant */
  compact?: boolean;
}

const WhisperEchoItem = memo(({ echo, index }: { echo: WhisperEcho; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 8 }}
    transition={{ delay: index * 0.06, duration: 0.4 }}
  >
    <Link
      to={`/tree/${echo.treeId}`}
      className="group block px-4 py-3 rounded-xl hover:bg-primary/5 transition-all duration-300"
    >
      {/* Whisper text */}
      <p className="text-sm font-serif text-foreground/80 leading-relaxed line-clamp-2 group-hover:text-foreground transition-colors">
        "{echo.message}"
      </p>

      {/* Tree attribution */}
      <div className="flex items-center gap-2 mt-1.5">
        <TreePine className="w-3 h-3 text-primary/40 flex-shrink-0" />
        <span className="text-[11px] font-serif text-primary/60 group-hover:text-primary/80 transition-colors truncate">
          {echo.treeName}
        </span>
        {echo.treeSpecies && (
          <span className="text-[10px] font-serif text-muted-foreground/40 truncate hidden sm:inline">
            {echo.treeSpecies}
          </span>
        )}
        <span className="text-[10px] font-serif text-muted-foreground/30 ml-auto flex-shrink-0">
          {echo.relativeTime}
        </span>
      </div>
    </Link>
  </motion.div>
));

WhisperEchoItem.displayName = "WhisperEchoItem";

const WhisperEchoesFeed = ({ limit = 8, compact = false }: WhisperEchoesFeedProps) => {
  const { data: echoes, isLoading } = useWhisperEchoes(30);
  const [expanded, setExpanded] = useState(false);

  const displayEchoes = echoes?.slice(0, expanded ? limit * 2 : limit) || [];

  // Nothing to show
  if (!isLoading && (!echoes || echoes.length === 0)) return null;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-3 px-4 py-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse space-y-1.5">
            <div className="h-3 bg-muted/20 rounded w-4/5" />
            <div className="h-2 bg-muted/10 rounded w-2/5" />
          </div>
        ))}
      </div>
    );
  }

  if (compact) {
    // Single featured whisper
    const featured = displayEchoes[0];
    if (!featured) return null;
    return (
      <Link
        to={`/tree/${featured.treeId}`}
        className="group flex items-start gap-3 px-4 py-3 rounded-xl bg-secondary/10 border border-border/20 hover:border-primary/20 hover:bg-primary/5 transition-all"
      >
        <Wind className="w-4 h-4 text-primary/30 mt-0.5 flex-shrink-0 group-hover:text-primary/50 transition-colors" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-serif text-foreground/70 line-clamp-1 group-hover:text-foreground/90 transition-colors">
            "{featured.message}"
          </p>
          <p className="text-[10px] font-serif text-muted-foreground/40 mt-0.5">
            🌳 {featured.treeName} · {featured.relativeTime}
          </p>
        </div>
      </Link>
    );
  }

  // Full feed
  return (
    <div className="rounded-xl border border-border/30 bg-card/40 backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <Wind className="w-4 h-4 text-primary/40" />
        <h3 className="font-serif text-sm text-foreground/80 tracking-wide">
          Whisper Echoes
        </h3>
        <span className="text-[10px] font-serif text-muted-foreground/40 ml-auto">
          {echoes?.length || 0} recent
        </span>
      </div>

      {/* Whisper list */}
      <div className="divide-y divide-border/10">
        <AnimatePresence mode="popLayout">
          {displayEchoes.map((echo, i) => (
            <WhisperEchoItem key={echo.id} echo={echo} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {/* Show more / fewer */}
      {echoes && echoes.length > limit && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-serif text-muted-foreground/50 hover:text-primary/60 transition-colors border-t border-border/15"
        >
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "Show fewer" : `${echoes.length - limit} more echoes`}
        </button>
      )}
    </div>
  );
};

export default WhisperEchoesFeed;
