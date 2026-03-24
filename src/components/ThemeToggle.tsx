/**
 * ThemeToggle — light/dark mode switch.
 * Persists preference to localStorage.
 */
import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "s33d-theme";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored === "dark";
    return !document.documentElement.classList.contains("light");
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
    localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsDark(prev => !prev)}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="h-8 w-8 md:h-9 md:w-9 shrink-0"
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
