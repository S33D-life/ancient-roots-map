/**
 * useTreeCelebration — listens for 'tree-created' custom events and shows celebration.
 * Dispatched from any tree creation flow.
 */
import { useState, useEffect, useCallback } from "react";

export interface CelebrationData {
  treeName: string;
  species?: string;
}

export function useTreeCelebration() {
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<CelebrationData>).detail;
      if (detail?.treeName) setCelebration(detail);
    };
    window.addEventListener("tree-created", handler);
    return () => window.removeEventListener("tree-created", handler);
  }, []);

  const dismiss = useCallback(() => setCelebration(null), []);

  return { celebration, dismiss };
}

/** Dispatch this from any tree creation flow */
export function dispatchTreeCreated(data: CelebrationData) {
  window.dispatchEvent(new CustomEvent("tree-created", { detail: data }));
}
