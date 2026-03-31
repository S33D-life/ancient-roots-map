/**
 * RootPulseGlyph — The quiet entry point: a root glyph that breathes.
 */
import { motion } from "framer-motion";

interface Props {
  open: boolean;
  onToggle: () => void;
  prefersReduced: boolean;
}

export default function RootPulseGlyph({ open, onToggle, prefersReduced }: Props) {
  return (
    <motion.button
      onClick={onToggle}
      className="mx-auto flex flex-col items-center gap-1.5 group cursor-pointer bg-transparent border-none outline-none select-none"
      style={{ WebkitTapHighlightColor: "transparent", minHeight: 56, minWidth: 56 }}
      whileHover={prefersReduced ? {} : { scale: 1.05 }}
      whileTap={prefersReduced ? {} : { scale: 0.96 }}
      aria-label={open ? "Close root pulse" : "Sense the roots"}
      aria-expanded={open}
    >
      <svg viewBox="0 0 64 80" className="w-9 h-11" aria-hidden>
        {/* Soft breathing glow */}
        {!open && !prefersReduced && (
          <motion.circle
            cx="32" cy="24" r="14"
            fill="hsl(var(--primary) / 0.05)"
            animate={{ r: [14, 19, 14], opacity: [0.04, 0.1, 0.04] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        {/* Central seed — slightly larger for tap clarity */}
        <circle
          cx="32" cy="24" r="3.5"
          fill={open ? "hsl(var(--primary) / 0.5)" : "hsl(var(--primary) / 0.3)"}
          style={{ transition: "fill 0.4s ease" }}
        />
        {/* Root tendrils */}
        <path
          d="M32 28 Q27 44, 16 62 M32 28 Q32 46, 32 68 M32 28 Q37 44, 48 62"
          fill="none"
          stroke="hsl(var(--primary) / 0.16)"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        {/* Fine root hairs — subtle life */}
        <path
          d="M21 52 Q17 56, 12 58 M43 52 Q47 56, 52 58 M27 58 Q23 63, 18 67 M37 58 Q41 63, 46 67"
          fill="none"
          stroke="hsl(var(--primary) / 0.08)"
          strokeWidth="0.7"
          strokeLinecap="round"
        />
      </svg>

      {/* Invitation text — fades when open */}
      <motion.span
        className="text-[10px] font-serif tracking-[0.18em] uppercase"
        style={{ color: "hsl(var(--muted-foreground) / 0.35)" }}
        animate={
          prefersReduced
            ? { opacity: open ? 0 : 0.35 }
            : { opacity: open ? 0 : [0.25, 0.45, 0.25] }
        }
        transition={
          prefersReduced
            ? { duration: 0.2 }
            : { duration: 5, repeat: Infinity, ease: "easeInOut" }
        }
      >
        beneath the surface
      </motion.span>
    </motion.button>
  );
}
