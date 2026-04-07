/**
 * useWhisperSignals — bridges waiting whispers into the Heart Signal system.
 * Converts uncollected whispers into synthetic HeartSignal-shaped items
 * so they appear naturally in the unified notification panel and orb.
 *
 * Tree names and sender names are resolved in the panel itself via
 * useTreeNames / useSenderNames hooks — this bridge focuses on structure.
 */
import { useMemo } from "react";
import { useWaitingWhispers, type TreeWhisper } from "@/hooks/use-whispers";
import type { HeartSignal } from "@/lib/heart-signal-types";
import { getDeliveryDescription, type WhisperDeliveryInfo } from "@/utils/whisperState";

export interface WhisperSignalItem extends HeartSignal {
  /** Original whisper data for rich rendering */
  _whisper: TreeWhisper;
  _deliveryInfo: WhisperDeliveryInfo;
}

/**
 * Fetches waiting whispers and maps them into HeartSignal shape.
 * These are merged into the signal panel alongside real heart_signals.
 */
export function useWhisperSignals(userId: string | null) {
  const { whispers, loading, refetch } = useWaitingWhispers(userId);

  const whisperSignals = useMemo<WhisperSignalItem[]>(() => {
    return whispers.map((w) => {
      const deliveryInfo: WhisperDeliveryInfo = {
        scope: w.delivery_scope as WhisperDeliveryInfo["scope"],
        treeId: w.delivery_tree_id || undefined,
        speciesKey: w.delivery_species_key || undefined,
      };

      const deliveryText = getDeliveryDescription(deliveryInfo);

      return {
        id: `whisper-${w.id}`,
        user_id: userId || "",
        signal_type: "whisper" as const,
        title: "A whisper waits for you",
        body: deliveryText,
        related_tree_id: w.delivery_tree_id || w.tree_anchor_id,
        related_offering_id: null,
        related_transaction_id: null,
        deep_link: w.delivery_tree_id
          ? `/tree/${w.delivery_tree_id}?whisper=1`
          : w.delivery_scope === "ANY_TREE"
            ? "/map"
            : null,
        // Whisper signals are never "read" via the notification panel.
        // They stay unread until collected at a tree.
        is_read: false,
        dismissed: false,
        metadata: {
          whisper_id: w.id,
          sender_user_id: w.sender_user_id,
          delivery_scope: w.delivery_scope,
          delivery_species_key: w.delivery_species_key,
          delivery_tree_id: w.delivery_tree_id,
        },
        created_at: w.created_at,
        _whisper: w,
        _deliveryInfo: deliveryInfo,
      };
    });
  }, [whispers, userId]);

  return {
    whisperSignals,
    whisperCount: whisperSignals.length,
    loading,
    refetch,
    rawWhispers: whispers,
  };
}