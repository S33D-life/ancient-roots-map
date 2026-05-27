/**
 * useFamilyMode — gentle toggle for the Arborium.
 *
 * When on:
 *   - simplifies language (kid-friendly copy where provided)
 *   - reduces card density (fewer details, larger touch targets)
 *
 * Stored in localStorage so the preference persists across visits.
 */
import { useEffect, useState, useCallback } from "react";

const KEY = "arborium:familyMode";

export function useFamilyMode() {
  const [familyMode, setFamilyMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(KEY) === "1";
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, familyMode ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [familyMode]);

  const toggle = useCallback(() => setFamilyMode((v) => !v), []);

  return { familyMode, setFamilyMode, toggle };
}
