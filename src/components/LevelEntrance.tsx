import { useState, useEffect } from "react";

interface LevelEntranceProps {
  /** Array of splash phases: each has an image and optional style */
  phases: { src: string; alt: string; className?: string }[];
  /** Background color during splash */
  bgColor?: string;
  /** Duration of each phase in ms (default 2000) */
  phaseDuration?: number;
  /** Fade-out duration in ms (default 800) */
  fadeDuration?: number;
  /** Callback when splash completes */
  onComplete: () => void;
}

/**
 * Unified entry ceremony for TETOL levels.
 * Cycles through image phases with crossfade, supports click-to-skip.
 */
const LevelEntrance = ({
  phases,
  bgColor = "hsl(80 15% 10%)",
  phaseDuration = 2000,
  fadeDuration = 800,
  onComplete,
}: LevelEntranceProps) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    phases.forEach((_, i) => {
      if (i < phases.length - 1) {
        timers.push(setTimeout(() => setCurrentPhase(i + 1), phaseDuration * (i + 1)));
      }
    });

    // Start fade after last phase
    const fadeStart = phaseDuration * phases.length;
    timers.push(setTimeout(() => setFading(true), fadeStart));
    timers.push(setTimeout(onComplete, fadeStart + fadeDuration));

    return () => timers.forEach(clearTimeout);
  }, [phases.length, phaseDuration, fadeDuration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 cursor-pointer transition-opacity ${fading ? "opacity-0" : "opacity-100"}`}
      style={{ backgroundColor: bgColor, transitionDuration: `${fadeDuration}ms` }}
      onClick={onComplete}
      role="button"
      aria-label="Skip entrance"
    >
      {phases.map((phase, i) => (
        <div
          key={i}
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
            currentPhase === i && !fading ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={phase.src}
            alt={phase.alt}
            className={phase.className || "max-w-sm w-2/3 rounded-lg animate-fade-in"}
            loading="eager"
            decoding="async"
          />
        </div>
      ))}
    </div>
  );
};

export default LevelEntrance;
