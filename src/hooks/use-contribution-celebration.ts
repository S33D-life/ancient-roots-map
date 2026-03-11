/**
 * use-contribution-celebration — listens for contribution events
 * (tree-mapped, offering-created, harvest-listed) and triggers celebration UI.
 */
import { useEffect, useState, useCallback } from "react";

export interface CelebrationEvent {
  type: "tree" | "offering" | "harvest";
  name: string;
  species?: string;
}

const MESSAGES: Record<string, string> = {
  tree: "You have added a new Ancient Friend to the living atlas.",
  offering: "Your offering has been received by the grove.",
  harvest: "A new harvest has been shared with the community.",
};

export function useCelebrationMessage(type: string): string {
  return MESSAGES[type] || MESSAGES.tree;
}

export function useContributionCelebration() {
  const [event, setEvent] = useState<CelebrationEvent | null>(null);

  const handleTreeMapped = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail || {};
    setEvent({ type: "tree", name: detail.treeName || "Ancient Friend", species: detail.species });
  }, []);

  const handleOfferingCreated = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail || {};
    setEvent({ type: "offering", name: detail.treeName || "Ancient Friend", species: detail.species });
  }, []);

  const handleHarvestListed = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail || {};
    setEvent({ type: "harvest", name: detail.produceName || "Harvest" });
  }, []);

  useEffect(() => {
    window.addEventListener("tree-mapped", handleTreeMapped);
    window.addEventListener("offering-created", handleOfferingCreated);
    window.addEventListener("harvest-listed", handleHarvestListed);
    return () => {
      window.removeEventListener("tree-mapped", handleTreeMapped);
      window.removeEventListener("offering-created", handleOfferingCreated);
      window.removeEventListener("harvest-listed", handleHarvestListed);
    };
  }, [handleTreeMapped, handleOfferingCreated, handleHarvestListed]);

  const dismiss = useCallback(() => setEvent(null), []);

  return { event, dismiss };
}
