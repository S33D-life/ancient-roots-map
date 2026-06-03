/**
 * MoonGlyph — the single shared rhythm whisper.
 *
 * Reads the current lunar phase and renders it as either a tiny header seal
 * or a one-line atmospheric whisper. Tapping it opens the Cycle Trunk.
 *
 * One component, many surfaces. The shared spine of time across the app.
 */
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { deriveLunarFraming, moonIllumination } from "@/lib/moonroot/lunar";
import { cn } from "@/lib/utils";

interface MoonGlyphProps {
  /** Visual register. `seal` = tiny header chip; `whisper` = one-line subtitle. */
  variant?: "seal" | "whisper";
  className?: string;
}

const POETIC_MOON_NAMES: Record<number, string> = {
  0: "Wolf Moon", 1: "Snow Moon", 2: "Worm Moon", 3: "Pink Moon",
  4: "Flower Moon", 5: "Strawberry Moon", 6: "Buck Moon", 7: "Sturgeon Moon",
  8: "Harvest Moon", 9: "Hunter's Moon", 10: "Beaver Moon", 11: "Cold Moon",
};

function useLunarNow(intervalMs = 60 * 60 * 1000) {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export default function MoonGlyph({ variant = "seal", className }: MoonGlyphProps) {
  const now = useLunarNow();
  // "weekly" routes through the dynamic illumination branch so the glyph
  // reflects the *current* phase rather than a hardcoded full moon.
  const framing = deriveLunarFraming("weekly", now);
  const illum = Math.round(moonIllumination(now) * 100);
  const moonName = POETIC_MOON_NAMES[now.getMonth()];
  const title = `${framing.glyph} ${moonName} · ${illum}% — ${framing.whisper}`;

  if (variant === "whisper") {
    return (
      <Link
        to="/library/scrolls"
        title={title}
        aria-label={`Current ring: ${moonName}. Open the Cycle Trunk.`}
        className={cn(
          "inline-flex items-center gap-2 text-[11px] md:text-xs font-serif italic",
          "text-muted-foreground/70 hover:text-foreground/85 transition-colors",
          "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded",
          className,
        )}
      >
        <span className="text-sm not-italic leading-none motion-safe:animate-[moonBreathe_8s_ease-in-out_infinite]" aria-hidden>
          {framing.glyph}
        </span>
        <span>
          Now beneath the {moonName} — {framing.whisper}
        </span>
        <style>{`
          @keyframes moonBreathe {
            0%, 100% { opacity: 0.85; transform: scale(1); }
            50%      { opacity: 1;    transform: scale(1.06); }
          }
        `}</style>
      </Link>
    );
  }

  // Seal variant — header chip
  return (
    <Link
      to="/library/scrolls"
      title={title}
      aria-label={`Current ring: ${moonName}, ${illum}% illuminated. Open the Cycle Trunk.`}
      className={cn(
        "hidden sm:inline-flex items-center justify-center w-7 h-7 rounded-full",
        "border border-primary/20 bg-background/40 backdrop-blur-sm",
        "text-base leading-none transition-all duration-300",
        "hover:border-primary/45 hover:bg-primary/[0.06] hover:scale-105",
        "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
        "motion-safe:animate-[moonBreathe_8s_ease-in-out_infinite]",
        className,
      )}
    >
      <span aria-hidden>{framing.glyph}</span>
      <style>{`
        @keyframes moonBreathe {
          0%, 100% { opacity: 0.9;  filter: drop-shadow(0 0 0 hsl(var(--primary) / 0)); }
          50%      { opacity: 1;    filter: drop-shadow(0 0 4px hsl(var(--primary) / 0.35)); }
        }
      `}</style>
    </Link>
  );
}
