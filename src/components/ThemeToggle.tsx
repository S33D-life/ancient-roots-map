/**
 * ThemeToggle — light/dark mode switch.
 * Persists preference to localStorage.
 */
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { internalRealm } from "@/components/parchment/ParchmentHeader";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";



const ThemeToggle = () => {
  const isParchment = Boolean(internalRealm(useLocation().pathname));
  const storageKey = isParchment ? "s33d-parchment-theme" : "s33d-theme";
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) return stored === "dark";
    return isParchment ? false : !document.documentElement.classList.contains("light");
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
    localStorage.setItem(storageKey, isDark ? "dark" : "light");
  }, [isDark, storageKey]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsDark(prev => !prev)}
      title={isParchment ? (isDark ? "Living Parchment" : "Night Grove") : (isDark ? "Light mode" : "Dark mode")}
      aria-label={isParchment ? (isDark ? "Use Living Parchment" : "Use Night Grove") : (isDark ? "Use light mode" : "Use dark mode")}
      className="h-7 w-7 md:h-8 md:w-8 rounded-full hover:bg-accent/20 shrink-0"
    >
      {isDark ? (
        <Sun className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400" />
      ) : (
        <Moon className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
      )}
    </Button>
  );
};

export default ThemeToggle;
