import { useEffect } from "react";

const FONT_LINK_ID = "llp-cormorant-garamond";
const FONT_HREF = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap";

/**
 * Attach the Living Parchment display face once, without blocking the page.
 * If the font host is unreachable the page keeps its Georgia fallback; nothing fails.
 */
export function useParchmentFont() {
  useEffect(() => {
    if (typeof document === "undefined" || document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);
}
