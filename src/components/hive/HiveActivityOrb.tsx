/**
 * HiveActivityOrb — a glowing orb whose intensity correlates with
 * species hearts earned this month for a given hive family.
 */
import { motion } from "framer-motion";

interface Props {
  /** Species hearts earned this month */
  monthlyHearts: number;
  /** Hive accent HSL, e.g. "35 65% 45%" */
  accentHsl: string;
  /** Hive emoji icon */
  icon: string;
  /** Family name for label */
  familyLabel: string;
}

const HiveActivityOrb = ({ monthlyHearts, accentHsl, icon, familyLabel }: Props) => {
  // Map monthly hearts to intensity: 0 = dormant, 1-5 = quiet, 6-20 = active, 21+ = thriving
  const level =
    monthlyHearts === 0 ? 0 : monthlyHearts <= 5 ? 1 : monthlyHearts <= 20 ? 2 : 3;

  const labels = ["Dormant", "Quiet", "Active", "Thriving"];
  const glowOpacity = [0.05, 0.15, 0.3, 0.5][level];
  const pulseScale = [1, 1.02, 1.05, 1.08][level];
  const ringSize = [48, 56, 64, 72][level];

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: ringSize,
          height: ringSize,
          background: `radial-gradient(circle, hsl(${accentHsl} / ${glowOpacity * 1.5}), transparent 70%)`,
          boxShadow: `0 0 ${level * 12 + 8}px hsl(${accentHsl} / ${glowOpacity})`,
        }}
        animate={{
          scale: [1, pulseScale, 1],
          boxShadow: [
            `0 0 ${level * 12 + 8}px hsl(${accentHsl} / ${glowOpacity})`,
            `0 0 ${level * 18 + 12}px hsl(${accentHsl} / ${glowOpacity * 1.3})`,
            `0 0 ${level * 12 + 8}px hsl(${accentHsl} / ${glowOpacity})`,
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-2xl">{icon}</span>
      </motion.div>
      <div className="text-center">
        <p className="text-xs font-serif tabular-nums" style={{ color: `hsl(${accentHsl})` }}>
          {monthlyHearts} {familyLabel} Hearts this month
        </p>
        <p className="text-[10px] text-muted-foreground font-serif">{labels[level]}</p>
      </div>
    </div>
  );
};

export default HiveActivityOrb;
