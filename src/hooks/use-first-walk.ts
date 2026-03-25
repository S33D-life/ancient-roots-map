/**
 * useFirstWalk — tracks a 3-step guided onboarding trail.
 *
 * Steps:
 *  1. Visit the map
 *  2. Explore a tree (view tree detail)
 *  3. Make an offering or add a tree
 *
 * Progress persists in localStorage. After all 3 steps the trail
 * is marked complete and the widget hides permanently.
 */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

export type WalkStep = "visit-map" | "explore-tree" | "contribute";

export interface FirstWalkState {
  /** Ordered step IDs */
  steps: WalkStep[];
  /** Which steps are done */
  completed: Set<WalkStep>;
  /** Is the entire walk finished? */
  finished: boolean;
  /** Has the user permanently dismissed the widget? */
  dismissed: boolean;
  /** Mark a step complete */
  complete: (step: WalkStep) => void;
  /** Permanently hide the widget */
  dismiss: () => void;
  /** Current (first incomplete) step index, or -1 */
  currentIndex: number;
}

const STORAGE_KEY = "s33d_first_walk";

interface Stored {
  completed: WalkStep[];
  dismissed?: boolean;
}

function read(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completed: [] };
    return JSON.parse(raw);
  } catch {
    return { completed: [] };
  }
}

function write(s: Stored) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* noop */ }
}

const ALL_STEPS: WalkStep[] = ["visit-map", "explore-tree", "contribute"];

export function useFirstWalk(): FirstWalkState {
  const location = useLocation();
  const [stored, setStored] = useState<Stored>(read);

  const completed = new Set(stored.completed);
  const finished = ALL_STEPS.every((s) => completed.has(s));
  const dismissed = stored.dismissed === true;

  const complete = useCallback((step: WalkStep) => {
    setStored((prev) => {
      if (prev.completed.includes(step)) return prev;
      const next = { ...prev, completed: [...prev.completed, step] };
      write(next);

      // Graduate user from "new" state after visiting the map
      // This progressively unlocks whispers, celebrations, etc.
      if (step === "visit-map") {
        try { localStorage.setItem("s33d-user-graduated", "1"); } catch {}
      }

      return next;
    });
  }, []);

  const dismiss = useCallback(() => {
    setStored((prev) => {
      const next = { ...prev, dismissed: true };
      write(next);
      return next;
    });
  }, []);

  // Auto-complete steps based on route
  useEffect(() => {
    const path = location.pathname;
    if (path === "/map" || path.startsWith("/map?")) {
      complete("visit-map");
    }
    if (path.startsWith("/tree/")) {
      complete("explore-tree");
    }
    if (path === "/add-tree" || path.startsWith("/add-tree")) {
      complete("contribute");
    }
  }, [location.pathname, complete]);

  // Listen for offering-created event (from Offerings system)
  useEffect(() => {
    const handler = () => complete("contribute");
    window.addEventListener("offering-created", handler);
    return () => window.removeEventListener("offering-created", handler);
  }, [complete]);

  const currentIndex = ALL_STEPS.findIndex((s) => !completed.has(s));

  return {
    steps: ALL_STEPS,
    completed,
    finished,
    dismissed,
    complete,
    dismiss,
    currentIndex,
  };
}
