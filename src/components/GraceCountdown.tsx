/**
 * GraceCountdown — live countdown showing remaining grace window time.
 * Updates every minute. Pulses when under 1 hour to create urgency.
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
  const isUrgent = remaining < 3_600_000; // under 1 hour

  const text = hours > 0
    ? `${hours}h ${mins}m left to collect`
    : `${mins}m left to collect`;

  return (
    <span
      className={`text-[10px] font-serif tracking-wide inline-flex items-center gap-1 ${isUrgent ? "animate-pulse" : ""} ${className}`}
      style={{ color: isUrgent ? "hsl(42 80% 55% / 0.9)" : "hsl(140 40% 55% / 0.7)" }}
    >
      ⏳ {text}
    </span>
  );
}
