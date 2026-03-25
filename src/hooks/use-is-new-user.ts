/**
 * useIsNewUser — returns true until the user has completed their first
 * meaningful interaction (visiting the map, tapping a tree, etc.).
 *
 * Uses localStorage so the "new" state persists across refreshes but
 * graduates permanently once the user has engaged.
 *
 * Other systems check this to decide whether to show reduced / calm UI.
 */
import { useState, useCallback } from "react";

const KEY = "s33d-user-graduated";

export function useIsNewUser() {
  const [isNew, setIsNew] = useState(() => {
    try {
      return localStorage.getItem(KEY) !== "1";
    } catch {
      return true;
    }
  });

  /** Call when the user has completed a meaningful action */
  const graduate = useCallback(() => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setIsNew(false);
  }, []);

  return { isNewUser: isNew, graduate };
}
