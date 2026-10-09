import { useEffect, useState } from "react";

export function savedThemeIsDark() {
  const saved = localStorage.getItem("s33d-theme") ?? localStorage.getItem("s33d-parchment-theme");
  return saved === "dark";
}

export function applySiteTheme(dark: boolean) {
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.classList.toggle("light", !dark);
  localStorage.setItem("s33d-theme", dark ? "dark" : "light");
  // Keep older clients compatible; both keys now represent the same preference.
  localStorage.setItem("s33d-parchment-theme", dark ? "dark" : "light");
}

export function useParchmentDark() {
  const [dark, setDark] = useState(savedThemeIsDark);
  useEffect(() => {
    const update = () => setDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const sync = () => applySiteTheme(savedThemeIsDark());
    window.addEventListener("storage", sync);
    update();
    return () => { observer.disconnect(); window.removeEventListener("storage", sync); };
  }, []);
  return dark;
}
