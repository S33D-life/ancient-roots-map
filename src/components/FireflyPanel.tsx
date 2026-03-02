/**
 * FireflyPanel — lightweight entry panel for the Firefly contribution system.
 * Shows 4 action cards + links. Opens BugReportDialog with preselected type.
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
    // Small delay so panel closes before heavy dialog opens
    setTimeout(() => onSelectAction(type), 150);
  }, [onOpenChange, onSelectAction]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] p-0 overflow-hidden rounded-2xl border-border/30 bg-card/95 backdrop-blur-xl">
        <div className="p-5 pb-4">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-serif text-base flex items-center gap-2">
              <span className="text-lg">✦</span>
              Firefly
            </DialogTitle>
            <p className="text-[11px] text-muted-foreground font-serif leading-relaxed mt-1">
              Help the grove glow brighter. Earn Hearts when validated.
            </p>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a.type}
                type="button"
                onClick={() => handleAction(a.type)}
                className="flex flex-col items-start gap-1.5 p-3 rounded-xl border border-border/30 bg-secondary/20
                  hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
              >
                <span className="text-xl">{a.emoji}</span>
                <span className="text-xs font-serif text-foreground group-hover:text-primary transition-colors">
                  {a.label}
                </span>
                <span className="text-[9px] text-muted-foreground/60 font-serif leading-tight">
                  {a.desc}
                </span>
                <span className="text-[9px] text-primary/50 font-serif">
                  {a.reward} ❤️
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border/20 px-5 py-3 flex items-center justify-between bg-muted/10">
          <div className="flex gap-3">
            <Link
              to="/support"
              onClick={() => onOpenChange(false)}
              className="text-[10px] font-serif text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              Support <ExternalLink className="w-2.5 h-2.5" />
            </Link>
            <Link
              to="/value-tree?tab=earn"
              onClick={() => onOpenChange(false)}
              className="text-[10px] font-serif text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              Value Tree <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
          <span className="text-[9px] text-muted-foreground/40 font-serif">
            Validated = Hearts
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FireflyPanel;
