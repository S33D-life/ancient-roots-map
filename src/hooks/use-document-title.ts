import { useEffect } from "react";

/**
 * Sets document.title for the current page. Restores default on unmount.
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} · S33D` : "S33D — The Ethereal Tree of Life";
    return () => { document.title = prev; };
  }, [title]);
}
