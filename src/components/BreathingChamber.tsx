/**
 * BreathingChamber — a single quiet whisper between major sections.
 *
 * Not a divider, not a card, not a section. An emotional inhalation:
 * generous vertical space + one poetic line + reduced particle density.
 *
 * Use sparingly (2–3 per page). Respects prefers-reduced-motion.
 */
import { motion, useReducedMotion } from "framer-motion";

interface BreathingChamberProps {
  whisper: string;
  /** Slight horizontal drift in px (organic asymmetry). Default 0. */
  drift?: number;
  /** Tonal cast — picks up the surrounding ecological zone. */
  tone?: "soil" | "wood" | "moss" | "light";
}

const TONE_COLOR: Record<NonNullable<BreathingChamberProps["tone"]>, string> = {
  soil:  "hsl(28 22% 28% / 0.55)",
  wood:  "hsl(32 24% 32% / 0.55)",
  moss:  "hsl(110 18% 32% / 0.55)",
  light: "hsl(45 30% 45% / 0.55)",
};

const BreathingChamber = ({
  whisper,
  drift = 0,
  tone = "wood",
}: BreathingChamberProps) => {
  const reduced = useReducedMotion();

  return (
    <div
      className="relative py-20 md:py-28 flex justify-center pointer-events-none select-none"
      aria-hidden
    >
      <motion.p
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{ duration: 2.2, ease: "easeOut" }}
        className="font-serif italic text-[13px] md:text-sm tracking-wide text-center max-w-[22ch] leading-relaxed"
        style={{
          color: TONE_COLOR[tone],
          transform: `translateX(${drift}px)`,
        }}
      >
        {whisper}
      </motion.p>
    </div>
  );
};

export default BreathingChamber;
