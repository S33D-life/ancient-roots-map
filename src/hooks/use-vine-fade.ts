import { useEffect } from "react";

/**
 * Observes all `.vine-divider` elements and adds `.in-view` once visible.
 * Runs once per element (no looping).
 */
export function useVineFade() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll(".vine-divider").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}
