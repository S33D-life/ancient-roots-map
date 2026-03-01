/**
 * OfferingSortControls — New / Hot / Top sorting for offering feeds.
 */
import { Button } from "@/components/ui/button";
import { Flame, Clock, TrendingUp } from "lucide-react";

export type OfferingSortMode = "new" | "hot" | "top_24h" | "top_7d" | "top_all";

interface OfferingSortControlsProps {
  value: OfferingSortMode;
  onChange: (mode: OfferingSortMode) => void;
}

const modes: { value: OfferingSortMode; label: string; icon: React.ReactNode }[] = [
  { value: "new", label: "New", icon: <Clock className="h-3 w-3" /> },
  { value: "hot", label: "Hot", icon: <Flame className="h-3 w-3" /> },
  { value: "top_all", label: "Top", icon: <TrendingUp className="h-3 w-3" /> },
];

const OfferingSortControls = ({ value, onChange }: OfferingSortControlsProps) => {
  return (
    <div className="flex items-center gap-1 bg-secondary/20 rounded-lg p-0.5 border border-border/30">
      {modes.map((m) => (
        <Button
          key={m.value}
          variant={value === m.value ? "default" : "ghost"}
          size="sm"
          className={`h-6 text-[10px] font-serif gap-1 px-2 tracking-wider ${
            value === m.value
              ? "bg-primary/15 text-primary hover:bg-primary/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => onChange(m.value)}
        >
          {m.icon}
          {m.label}
        </Button>
      ))}
    </div>
  );
};

export default OfferingSortControls;
