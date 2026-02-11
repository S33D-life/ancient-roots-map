import { useState } from "react";

/**
 * Returns true only the first time per session for the given key.
 * After the entrance completes, call `dismiss()` to mark it as seen.
 */
export function useEntranceOnce(key: string, enabled = true) {
  const storageKey = `entrance_seen_${key}`;
  const alreadySeen = sessionStorage.getItem(storageKey) === "1";
  const [show, setShow] = useState(enabled && !alreadySeen);

  const dismiss = () => {
    sessionStorage.setItem(storageKey, "1");
    setShow(false);
  };

  return { showEntrance: show, dismissEntrance: dismiss };
}
