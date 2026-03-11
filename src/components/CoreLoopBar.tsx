/**
 * CoreLoopBar — a compact, sticky action bar surfacing the 3 core interactions:
 *   1. Discover Ancient Friends (map link)
 *   2. Plant Seeds (daily counter)
 *   3. Leave Whispers
 *
 * Appears on tree detail pages as an inline summary strip,
 * and can be embedded anywhere the core loop should be visible.
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sprout, Wind, TreeDeciduous, ChevronRight } from "lucide-react";

interface CoreLoopBarProps {
  /** Seeds remaining today (pass from useSeedEconomy) */
  seedsRemaining?: number;
  /** Total seeds per day */
  seedsTotal?: number;
  /** Currently on a tree page? Hides the discover CTA */
  onTreePage?: boolean;
  /** Handler for whisper action */
  onWhisper?: () => void;
  /** Handler for seed action */
  onSeed?: () => void;
  /** Whether user is logged in */
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
      {/* Seed progress bar — ultra thin */}
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
        )}

        {/* Seeds */}
        <button
          onClick={onSeed}
          disabled={seedsRemaining <= 0}
          className="flex items-center gap-2 px-3 py-2.5 flex-1 min-w-0 group hover:bg-primary/5 transition-colors disabled:opacity-40"
        >
          <Sprout className="w-4 h-4 text-primary/70 shrink-0" />
          <span className="text-[11px] font-serif text-foreground/70 group-hover:text-primary truncate">
            {seedsRemaining} seed{seedsRemaining !== 1 ? "s" : ""}
          </span>
        </button>

        {/* Whisper */}
        <button
          onClick={onWhisper}
          className="flex items-center gap-2 px-3 py-2.5 flex-1 min-w-0 group hover:bg-primary/5 transition-colors"
        >
          <Wind className="w-4 h-4 text-primary/70 shrink-0" />
          <span className="text-[11px] font-serif text-foreground/70 group-hover:text-primary truncate">
            Whisper
          </span>
        </button>
      </div>
    </motion.div>
  );
};

export default CoreLoopBar;
