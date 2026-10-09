import { useEffect, useState } from "react";
export function useParchmentDark() {
  const [dark, setDark] = useState(() => localStorage.getItem("s33d-parchment-theme") === "dark");
  useEffect(() => {
    const update = () => setDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    update();
    return () => observer.disconnect();
  }, []);
  return dark;
}
