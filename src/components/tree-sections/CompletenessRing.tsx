/**
 * CompletenessRing — Animated circular progress showing data completeness.
 * Used on research tree pages to show how rich the record is.
 */
import { motion } from "framer-motion";

interface CompletenessRingProps {
  score: number; // 0–100
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

const CompletenessRing = ({
  score,
  size = 72,
  strokeWidth = 5,
  label = "Complete",
  className = "",
}: CompletenessRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);

  // Color shifts by score
  const getColor = () => {
    if (score >= 80) return "hsl(var(--primary))";
    if (score >= 50) return "hsl(var(--primary) / 0.7)";
    return "hsl(var(--muted-foreground))";
  };

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background ring */}
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border) / 0.3)"
            strokeWidth={strokeWidth}
          />
        </svg>
        {/* Progress ring */}
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-serif text-foreground">{score}%</span>
        </div>
      </div>
      <span className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
};

export default CompletenessRing;
