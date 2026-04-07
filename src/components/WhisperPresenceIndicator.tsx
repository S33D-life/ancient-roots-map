/**
 * WhisperPresenceIndicator — subtle tree-level whisper indicator.
 * Shows whether whispers can be received at this tree.
 * Used on tree detail pages, preview cards, and map popups.
 */
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useWaitingWhispers } from "@/hooks/use-whispers";
import { canReceiveAtTree, getWhisperGuidance, resolveWhisperState, type WhisperVisibility } from "@/utils/whisperState";
import type { TreeWhisper } from "@/hooks/use-whispers";

interface WhisperPresenceIndicatorProps {
  treeId: string;
  treeSpecies: string;
  userId: string | null;
  isNearTree?: boolean;
  isCheckedIn?: boolean;
  variant?: "badge" | "line" | "minimal";
  className?: string;
}

export default function WhisperPresenceIndicator({
  treeId,
  treeSpecies,
  userId,
  isNearTree = false,
  isCheckedIn = false,
  variant = "line",
  className = "",
}: WhisperPresenceIndicatorProps) {
  const { whispers } = useWaitingWhispers(userId);

  // Filter to whispers receivable at this tree
  const matchingWhispers = useMemo(
    () => whispers.filter(w => canReceiveAtTree(w, treeId, treeSpecies)),
    [whispers, treeId, treeSpecies]
  );

  // Resolve the most relevant state
  const bestState = useMemo<WhisperVisibility | null>(() => {
    if (matchingWhispers.length === 0) return null;

    // Check if any are available_here
    for (const w of matchingWhispers) {
      const state = resolveWhisperState({
        userId,
        whisper: w,
        currentTreeId: treeId,
        currentTreeSpecies: treeSpecies,
        isNearTree,
        isCheckedIn,
      });
      if (state === "available_here") return "available_here";
    }

    return "nearby_eligible";
  }, [matchingWhispers, userId, treeId, treeSpecies, isNearTree, isCheckedIn]);

  if (!bestState || matchingWhispers.length === 0) return null;

  const count = matchingWhispers.length;
  const guidance = bestState === "available_here"
    ? count === 1
      ? "A whisper waits here for you"
      : `${count} whispers wait here`
    : count === 1
      ? "A whisper can be received at this tree"
      : `${count} whispers can be received here`;

  if (variant === "minimal") {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-serif ${className}`}
        style={{ color: "hsl(210 45% 60%)" }}
      >
        🌬️ {count}
      </span>
    );
  }

  if (variant === "badge") {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center gap-1.5 text-[10px] font-serif px-2.5 py-1 rounded-full ${className}`}
        style={{
          background: bestState === "available_here"
            ? "hsl(210 50% 55% / 0.12)"
            : "hsl(210 40% 55% / 0.06)",
          color: "hsl(210 45% 60%)",
          border: `1px solid hsl(210 40% 55% / ${bestState === "available_here" ? "0.2" : "0.1"})`,
        }}
      >
        🌬️ {guidance}
      </motion.span>
    );
  }

  // Default: line variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={`flex items-center gap-2 ${className}`}
    >
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: bestState === "available_here"
            ? "hsl(210 50% 55% / 0.15)"
            : "hsl(210 40% 55% / 0.08)",
        }}
      >
        <span className="text-[10px]">🌬️</span>
      </span>
      <p
        className="text-[11px] font-serif italic"
        style={{ color: "hsl(210 45% 60%)" }}
      >
        {guidance}
      </p>
    </motion.div>
  );
}
