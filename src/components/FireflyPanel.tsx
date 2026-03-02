/**
 * FireflyPanel — lightweight entry panel for the Firefly contribution system.
 * Refined: softer borders, gentler hover states, breathable spacing.
 */
import { useCallback } from "react";
import { Link } from "react-router-dom";
import { Bug, Sparkles, Lightbulb, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ACTIONS = [
  { type: "bug", icon: Bug, emoji: "🐞", label: "Report a Bug", desc: "Something isn't working", reward: "3–20" },
  { type: "ux_improvement", icon: Sparkles, emoji: "✨", label: "Improve the Flow", desc: "UX refinement idea", reward: "5–15" },
  { type: "insight", icon: Lightbulb, emoji: "💡", label: "Share an Insight", desc: "Propose an evolution", reward: "variable" },
] as const;

interface FireflyPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAction: (type: string) => void;
}

const FireflyPanel = ({ open, onOpenChange, onSelectAction }: FireflyPanelProps) => {
  const handleAction = useCallback((type: string) => {
    console.info("[Firefly] firefly_action_selected", { type });
    onOpenChange(false);
    setTimeout(() => onSelectAction(type), 150);
  }, [onOpenChange, onSelectAction]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[320px] p-0 overflow-hidden rounded-2xl border-border/20 bg-card/95 backdrop-blur-xl">
        <div className="p-5 pb-4">
          <DialogHeader className="mb-5">
            <DialogTitle className="font-serif text-base flex items-center gap-2">
              <span className="text-lg">✦</span>
              Firefly
            </DialogTitle>
            <p className="text-[11px] text-muted-foreground/50 font-serif leading-relaxed mt-1.5">
              Help the grove glow brighter. Earn Hearts when validated.
            </p>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2.5">
            {ACTIONS.map((a) => (
              <button
                key={a.type}
                type="button"
                onClick={() => handleAction(a.type)}
                className="flex flex-col items-start gap-2 p-3.5 rounded-xl border border-border/15 bg-secondary/10
                  hover:border-primary/25 hover:bg-primary/5 active:scale-[0.97] transition-all duration-300 text-left group"
              >
                <span className="text-lg">{a.emoji}</span>
                <span className="text-xs font-serif text-foreground/80 group-hover:text-primary/90 transition-colors duration-300">
                  {a.label}
                </span>
                <span className="text-[9px] text-muted-foreground/40 font-serif leading-snug">
                  {a.desc}
                </span>
                <span className="text-[9px] text-primary/40 font-serif">
                  {a.reward} ❤️
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border/10 px-5 py-3 flex items-center justify-between bg-muted/5">
          <div className="flex gap-3">
            <Link
              to="/support"
              onClick={() => onOpenChange(false)}
              className="text-[10px] font-serif text-muted-foreground/40 hover:text-primary/70 transition-colors duration-300 flex items-center gap-1"
            >
              Support <ExternalLink className="w-2.5 h-2.5" />
            </Link>
            <Link
              to="/value-tree?tab=earn"
              onClick={() => onOpenChange(false)}
              className="text-[10px] font-serif text-muted-foreground/40 hover:text-primary/70 transition-colors duration-300 flex items-center gap-1"
            >
              Value Tree <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
          <span className="text-[9px] text-muted-foreground/30 font-serif">
            Validated = Hearts
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FireflyPanel;
