/**
 * useTreeActivityTimeline — merges encounters, offerings, seeds, and whispers
 * into a unified chronological feed for a single tree.
 */
import { useMemo } from "react";
import { useTreeCheckins } from "@/hooks/use-tree-checkins";
import { useOfferings } from "@/hooks/use-offerings";

export interface TimelineEvent {
  id: string;
  type: "checkin" | "offering" | "seed" | "whisper" | "meeting";
  label: string;
  detail?: string;
  timestamp: string;
  userId?: string | null;
}

export function useTreeActivityTimeline(treeId: string | undefined, limit = 5) {
  const { checkins } = useTreeCheckins(treeId);
  const { offerings } = useOfferings({ treeId });

  const events = useMemo<TimelineEvent[]>(() => {
    const items: TimelineEvent[] = [];

    // Checkins → encounters
    (checkins ?? []).forEach((c) => {
      items.push({
        id: `checkin-${c.id}`,
        type: "checkin",
        label: "Visited",
        detail: c.season_stage !== "other" ? c.season_stage : undefined,
        timestamp: c.checked_in_at,
        userId: c.user_id,
      });
    });

    // Offerings
    (offerings ?? []).forEach((o) => {
      const typeLabel =
        o.type === "photo" ? "Shared a memory" :
        o.type === "poem" ? "Left a poem" :
        o.type === "song" ? "Offered a song" :
        o.type === "story" ? "Shared a musing" :
        o.type === "voice" ? "Left a voice note" :
        o.type === "book" ? "Added a book" :
        o.type === "nft" ? "Created an NFT" :
        "Made an offering";

      items.push({
        id: `offering-${o.id}`,
        type: "offering",
        label: typeLabel,
        detail: o.title,
        timestamp: o.created_at,
        userId: o.created_by,
      });
    });

    // Sort newest first
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return limit > 0 ? items.slice(0, limit) : items;
  }, [checkins, offerings, limit]);

  return { events, hasActivity: events.length > 0 };
}
