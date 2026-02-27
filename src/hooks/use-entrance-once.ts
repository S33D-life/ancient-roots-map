import { useState } from "react";

/**
 * Returns true only the FIRST TIME EVER for the given key.
 * Uses localStorage (persists across sessions) instead of sessionStorage.
 * After the entrance completes, call `dismiss()` to mark it as permanently seen.
 */
export function useEntranceOnce(key: string, enabled = true) {
  const storageKey = `entrance_seen_${key}`;
  const alreadySeen = localStorage.getItem(storageKey) === "1";
  const [show, setShow] = useState(enabled && !alreadySeen);

  const dismiss = () => {
    localStorage.setItem(storageKey, "1");
    setShow(false);
  };

  return { showEntrance: show, dismissEntrance: dismiss };
}
