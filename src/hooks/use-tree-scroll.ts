import { useEffect, useRef, useState, useCallback } from "react";

export type TreeSection = "golden-dream" | "council" | "heartwood" | "atlas-hero" | "atlas-content";

const SECTION_IDS: TreeSection[] = [
  "golden-dream",
  "council",
  "heartwood",
  "atlas-hero",
  "atlas-content",
];

const SECTION_LABELS: Record<TreeSection, string> = {
  "golden-dream": "Crown",
  council: "Canopy",
  heartwood: "Trunk",
  "atlas-hero": "Threshold",
  "atlas-content": "Roots",
};

/**
 * Manages the "Climb the Tree" scroll state:
 * - Detects which section is active via IntersectionObserver
 * - Updates URL hash for back-button support
 * - Scrolls to atlas-hero on initial load
 */
export function useTreeScroll() {
  const [activeSection, setActiveSection] = useState<TreeSection>("atlas-hero");
  const containerRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);
  const isManualScroll = useRef(false);

  // Scroll to atlas-hero on mount (with retry for SSR/lazy render)
  useEffect(() => {
    if (initialScrollDone.current) return;
    
    // Check if URL has a hash — if so, skip auto-scroll to hero
    const hash = window.location.hash.replace("#", "") as TreeSection;
    if (hash && SECTION_IDS.includes(hash)) return;

    const tryScroll = () => {
      const el = document.getElementById("atlas-hero");
      if (el) {
        el.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
        initialScrollDone.current = true;
        return true;
      }
      return false;
    };

    // Try immediately, then retry with rAF chain
    if (!tryScroll()) {
      requestAnimationFrame(() => {
        if (!tryScroll()) {
          setTimeout(tryScroll, 100);
        }
      });
    }
  }, []);

  // Handle hash on mount — if URL has a hash, scroll there instead
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as TreeSection;
    if (hash && SECTION_IDS.includes(hash)) {
      requestAnimationFrame(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
          setActiveSection(hash);
          initialScrollDone.current = true;
        }
      });
    }
  }, []);

  // IntersectionObserver to detect active section
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
            // Update hash without triggering scroll
            if (!isManualScroll.current) {
              const newHash = id === "atlas-hero" ? "" : `#${id}`;
              const currentHash = window.location.hash;
              if (currentHash !== newHash) {
                window.history.replaceState(null, "", newHash || window.location.pathname);
              }
            }
          }
        },
        {
          threshold: 0.4,
          rootMargin: "-10% 0px -10% 0px",
        }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Handle back/forward navigation
  useEffect(() => {
    const onPopState = () => {
      const hash = window.location.hash.replace("#", "") as TreeSection;
      if (hash && SECTION_IDS.includes(hash)) {
        isManualScroll.current = true;
        const el = document.getElementById(hash);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => { isManualScroll.current = false; }, 1000);
      } else {
        isManualScroll.current = true;
        const el = document.getElementById("atlas-hero");
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => { isManualScroll.current = false; }, 1000);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const scrollToSection = useCallback((section: TreeSection) => {
    isManualScroll.current = true;
    const el = document.getElementById(section);
    if (el) {
      const headerOffset = 64;
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: "smooth" });
      
      const newHash = section === "atlas-hero" ? "" : `#${section}`;
      window.history.pushState(null, "", newHash || window.location.pathname);
      setActiveSection(section);
    }
    setTimeout(() => { isManualScroll.current = false; }, 1200);
  }, []);

  return {
    activeSection,
    scrollToSection,
    containerRef,
    sections: SECTION_IDS,
    labels: SECTION_LABELS,
  };
}
