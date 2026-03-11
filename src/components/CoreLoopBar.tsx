/**
 * CoreLoopBar — a compact, sticky action bar surfacing the 3 core interactions:
 *   1. Discover Ancient Friends (map link)
 *   2. Plant Seeds (daily counter)
 *   3. Leave Whispers
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sprout, Wind, TreeDeciduous, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CoreLoopBarProps {
  seedsRemaining?: number;
  seedsTotal?: number;
  onTreePage?: boolean;
  onWhisper?: () => void;
  onSeed?: () => void;
  isLoggedIn?: boolean;
}

const CoreLoopBar = ({
  seedsRemaining = 33,
  seedsTotal = 33,
  onTreePage = false,
  onWhisper,
  onSeed,
  isLoggedIn = false,
}: CoreLoopBarProps) => {
  if (!isLoggedIn) return null;

  const seedPct = seedsTotal > 0 ? (seedsRemaining / seedsTotal) * 100 : 0;
  const seedsEmpty = seedsRemaining <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-xl border overflow-hidden"
      style={{
        background: "hsl(var(--card) / 0.6)",
        borderColor: "hsl(var(--border) / 0.2)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Seed progress bar */}
      <div className="h-0.5 w-full" style={{ background: "hsl(var(--muted) / 0.3)" }}>
        <motion.div
          className="h-full"
          style={{ background: "hsl(var(--primary) / 0.6)" }}
          initial={{ width: 0 }}
          animate={{ width: `${seedPct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center divide-x divide-border/15">
        {/* Discover */}
        {!onTreePage && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/map"
                className="flex items-center gap-2 px-3 py-2.5 flex-1 min-w-0 group hover:bg-primary/5 transition-colors"
              >
                <TreeDeciduous className="w-4 h-4 text-primary/70 shrink-0" />
                <span className="text-[11px] font-serif text-foreground/70 group-hover:text-primary truncate">
                  Discover
                </span>
                <ChevronRight className="w-3 h-3 text-muted-foreground/30 shrink-0 ml-auto" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs font-serif">
              Find Ancient Friends on the map
            </TooltipContent>
          </Tooltip>
        )}

        {/* Seeds */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onSeed}
              disabled={seedsEmpty}
              className="flex items-center gap-2 px-3 py-2.5 flex-1 min-w-0 group hover:bg-primary/5 transition-colors disabled:opacity-40"
            >
              <Sprout className="w-4 h-4 text-primary/70 shrink-0" />
              <span className="text-[11px] font-serif text-foreground/70 group-hover:text-primary truncate">
                {seedsEmpty ? "No seeds left" : `${seedsRemaining} seed${seedsRemaining !== 1 ? "s" : ""}`}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs font-serif">
            {seedsEmpty ? "Seeds refresh at midnight" : "Plant a seed at this tree"}
          </TooltipContent>
        </Tooltip>

        {/* Whisper */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onWhisper}
              className="flex items-center gap-2 px-3 py-2.5 flex-1 min-w-0 group hover:bg-primary/5 transition-colors"
            >
              <Wind className="w-4 h-4 text-primary/70 shrink-0" />
              <span className="text-[11px] font-serif text-foreground/70 group-hover:text-primary truncate">
                Whisper
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs font-serif">
            Leave a message through this tree
          </TooltipContent>
        </Tooltip>
      </div>
    </motion.div>
  );
};

export default CoreLoopBar;
