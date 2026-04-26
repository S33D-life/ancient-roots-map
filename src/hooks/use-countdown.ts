/**
 * useCountdown — ticks every second toward a target Date.
 * Pauses when the document is hidden (Page Visibility API) to save cycles
 * and avoid drift when tabs are backgrounded.
 */
import { useEffect, useState } from "react";

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isPast: boolean;
}

function compute(target: Date | string | number | null | undefined): Countdown {
  if (!target) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isPast: true };
  }
  const targetMs = typeof target === "object" ? target.getTime() : new Date(target).getTime();
  const diff = targetMs - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isPast: true };
  }
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMs: diff,
    isPast: false,
  };
}

export function useCountdown(target: Date | string | number | null | undefined): Countdown {
  const targetMs =
    target == null ? null : typeof target === "object" ? target.getTime() : new Date(target).getTime();
  const [state, setState] = useState<Countdown>(() => compute(targetMs));

  useEffect(() => {
    setState(compute(targetMs));
    if (targetMs == null) return;

    let interval: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (interval !== null) return;
      interval = setInterval(() => setState(compute(targetMs)), 1000);
    };
    const stop = () => {
      if (interval === null) return;
      clearInterval(interval);
      interval = null;
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else {
        setState(compute(targetMs));
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [targetMs]);

  return state;
}
