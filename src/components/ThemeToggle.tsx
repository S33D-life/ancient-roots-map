/**
 * ThemeToggle — light/dark mode switch.
 * Persists preference to localStorage.
 */
import { applySiteTheme, useParchmentDark } from "@/hooks/use-parchment-dark";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";



const ThemeToggle = () => {
  const isDark = useParchmentDark();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => applySiteTheme(!isDark)}
      title={isDark ? "Living Parchment" : "Night Grove"}
      aria-label={isDark ? "Use Living Parchment" : "Use Night Grove"}
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
