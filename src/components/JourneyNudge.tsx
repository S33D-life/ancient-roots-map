import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

/**
 * JourneyNudge — a subtle inline prompt that connects
 * the current action to the next step in the S33D journey.
 * Appears after meaningful events (e.g. mapping a tree, leaving an offering).
 */

interface JourneyNudgeProps {
  icon: string;
  message: string;
  to: string;
  label: string;
  /** Optional delay before appearing */
  delay?: number;
}

const JourneyNudge = ({ icon, message, to, label, delay = 0 }: JourneyNudgeProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.4, ease: "easeOut" }}
    >
      <Link
        to={to}
        className="group flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-md"
        style={{
          borderColor: "hsl(var(--primary) / 0.2)",
          background: "hsl(var(--primary) / 0.04)",
        }}
      >
        <span className="text-lg">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-serif text-foreground/80 leading-snug">{message}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-primary font-serif opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {label}
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </Link>
    </motion.div>
  );
};

export default JourneyNudge;
