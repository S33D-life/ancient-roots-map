/**
 * GraceCountdown — live countdown showing remaining grace window time.
 * Updates every minute for efficiency.
 */
import { useState, useEffect } from "react";
import { getGraceTimeRemaining } from "@/utils/heartPoolState";

interface GraceCountdownProps {
  treeId: string;
  className?: string;
}

export default function GraceCountdown({ treeId, className = "" }: GraceCountdownProps) {
  const [remaining, setRemaining] = useState(() => getGraceTimeRemaining(treeId));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getGraceTimeRemaining(treeId));
    }, 60_000);
    return () => clearInterval(interval);
  }, [treeId]);

  if (remaining <= 0) return null;

  const hours = Math.floor(remaining / 3_600_000);
  const mins = Math.floor((remaining % 3_600_000) / 60_000);

  const text = hours > 0
    ? `${hours}h ${mins}m left to collect`
    : `${mins}m left to collect`;

  return (
    <span className={`text-[10px] font-serif tracking-wide ${className}`} style={{ color: "hsl(140 40% 55% / 0.7)" }}>
      ⏳ {text}
    </span>
  );
}
