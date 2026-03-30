import { useEffect, useRef, useState, useCallback } from "react";

export type TreeSection = "golden-dream" | "council" | "heartwood" | "atlas-hero" | "ground" | "atlas-content";

const SECTION_IDS: TreeSection[] = [
  "golden-dream",
  "council",
  "heartwood",
  "atlas-hero",
  "ground",
  "atlas-content",
];

const SECTION_LABELS: Record<TreeSection, string> = {
  "golden-dream": "Crown",
  council: "Canopy",
  heartwood: "Trunk",
  "atlas-hero": "Threshold",
  ground: "Ground",
  "atlas-content": "Roots",
};

/**
 * Manages the "Climb the Tree" scroll state:
 * - Detects which section is active via IntersectionObserver
 * - Updates URL hash for back-button support
 * - Scrolls to atlas-hero on initial load
 */
export function useTreeScroll() {
  const [activeSection, setActiveSection] = useState<TreeSection>("ground");
  const containerRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);
  const isManualScroll = useRef(false);

  // Reset scroll state on every mount (new navigation to this page)
  useEffect(() => {
    initialScrollDone.current = false;
  }, []);

  // Scroll to soil level (#ground) on mount — "The Arboreal Atlas of Ancient Friends"
  // is the true anchor and should land at the top of the viewport on every load.
  useEffect(() => {
    if (initialScrollDone.current) return;
    
    // Check if URL has a hash — if so, skip auto-scroll to soil level
    const hash = window.location.hash.replace("#", "") as TreeSection;
    if (hash && SECTION_IDS.includes(hash)) return;

    const doScroll = () => {
      const el = document.getElementById("ground");
      if (!el) return false;
      // Position #ground at the top of the viewport, just below the header
      const headerOffset = 56;
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: Math.max(0, top), behavior: "instant" as ScrollBehavior });
      initialScrollDone.current = true;
      return true;
    };

    if (!doScroll()) {
      const retries = [50, 150, 400, 800, 1500];
      retries.forEach((ms) => {
        setTimeout(() => {
          if (!initialScrollDone.current) doScroll();
        }, ms);
      });
    }

    const safetyTimer = setTimeout(() => {
      if (!initialScrollDone.current) doScroll();
    }, 2000);
    return () => clearTimeout(safetyTimer);
  }, []);

  // Handle hash on mount — if URL has a hash, scroll there instead
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as TreeSection;
    if (hash && SECTION_IDS.includes(hash)) {
      requestAnimationFrame(() => {
        const el = document.getElementById(hash);
        if (el) {
          if (hash === "ground") {
            const headerOffset = 56;
            const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
            window.scrollTo({ top: Math.max(0, top), behavior: "instant" as ScrollBehavior });
          } else {
            el.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
          }
          setActiveSection(hash);
          initialScrollDone.current = true;
        }
      });
    }
  }, []);

  // Sprinkle 4: Apply body-level section class for per-section theming
  useEffect(() => {
    const body = document.body;
    // Remove any previous tetol-* classes
    body.classList.forEach((cls) => {
      if (cls.startsWith("tree-zone-")) body.classList.remove(cls);
    });
    body.classList.add(`tree-zone-${activeSection}`);
    return () => {
      body.classList.remove(`tree-zone-${activeSection}`);
    };
  }, [activeSection]);

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
              const newHash = id === "ground" ? "" : `#${id}`;
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
    const scrollToSoilLevel = (behavior: ScrollBehavior = "smooth") => {
      const el = document.getElementById("ground");
      if (el) {
        const headerOffset = 56;
        const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top: Math.max(0, top), behavior });
      }
    };

    const onPopState = () => {
      const hash = window.location.hash.replace("#", "") as TreeSection;
      if (hash && SECTION_IDS.includes(hash)) {
        isManualScroll.current = true;
        if (hash === "ground") {
          scrollToSoilLevel("smooth");
        } else {
          const el = document.getElementById(hash);
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setTimeout(() => { isManualScroll.current = false; }, 1000);
      } else {
        isManualScroll.current = true;
        scrollToSoilLevel("smooth");
        setTimeout(() => { isManualScroll.current = false; }, 1000);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const scrollToSection = useCallback((section: TreeSection) => {
    isManualScroll.current = true;
    if (section === "ground") {
      const el = document.getElementById("ground");
      if (el) {
        const headerOffset = 56;
        const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      }
    } else {
      const el = document.getElementById(section);
      if (el) {
        const headerOffset = 64;
        const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
    
    const newHash = section === "ground" ? "" : `#${section}`;
    window.history.pushState(null, "", newHash || window.location.pathname);
    setActiveSection(section);
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
