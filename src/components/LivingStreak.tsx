/**
 * LivingStreak — flame icon + counter in Header showing consecutive days
 * the user has interacted with any Ancient Friend.
 */
import { Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  streak: number;
}

const MILESTONES = [7, 30, 100, 365];

const LivingStreak = ({ streak }: Props) => {
  if (streak <= 0) return null;

  const nextMilestone = MILESTONES.find(m => m > streak);
  const isMilestone = MILESTONES.includes(streak);

  return (
    <AnimatePresence>
      <motion.div
        className="flex items-center gap-1 px-2 py-0.5 rounded-full border"
        style={{
          background: isMilestone
            ? "hsl(25 90% 50% / 0.15)"
            : "hsl(var(--muted) / 0.3)",
          borderColor: isMilestone
            ? "hsl(25 90% 50% / 0.3)"
            : "hsl(var(--border) / 0.3)",
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        title={`${streak}-day streak${nextMilestone ? ` · ${nextMilestone - streak} days to next milestone` : " · Legendary!"}`}
      >
        <Flame
          className="w-3 h-3"
          style={{
            color: streak >= 100 ? "hsl(42 90% 55%)" : streak >= 30 ? "hsl(25 90% 55%)" : "hsl(15 80% 55%)",
            filter: isMilestone ? "drop-shadow(0 0 4px hsl(25 90% 55% / 0.6))" : "none",
          }}
        />
        <span className="text-[10px] font-mono tabular-nums" style={{ color: "hsl(var(--foreground) / 0.8)" }}>
          {streak}
        </span>
      </motion.div>
    </AnimatePresence>
  );
};

export default LivingStreak;
