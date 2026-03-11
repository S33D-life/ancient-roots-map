/**
 * FireflyPanel — Contribution + Search entry panel.
 * Now includes unified search as a primary action
 * and a daily seed counter for core loop visibility.
 */
import { useCallback, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bug, Sparkles, Lightbulb, ExternalLink, Wind, Search, Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSeedEconomy } from "@/hooks/use-seed-economy";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import GlobalSearch from "@/components/GlobalSearch";

const ACTIONS = [
  { type: "search", icon: Search, emoji: "🔍", label: "Search Everything", desc: "Trees, places, rooms, wanderers", reward: null, isSearch: true },
  { type: "whisper", icon: Wind, emoji: "🌬️", label: "Send a Whisper", desc: "Message through the trees", reward: null, isNav: true },
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
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUserId(session?.user?.id ?? null));
  }, []);

  const { seedsRemaining } = useSeedEconomy(userId);

  const handleAction = useCallback((type: string, flags?: { isNav?: boolean; isSearch?: boolean }) => {
    console.info("[Firefly] firefly_action_selected", { type });
    onOpenChange(false);
    if (flags?.isSearch) {
      setTimeout(() => setSearchOpen(true), 150);
    } else if (flags?.isNav && type === "whisper") {
      setTimeout(() => navigate("/whispers"), 150);
    } else {
      setTimeout(() => onSelectAction(type), 150);
    }
  }, [onOpenChange, onSelectAction, navigate]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[320px] p-0 overflow-hidden rounded-2xl border-border/20 bg-card/95 backdrop-blur-xl">
          <div className="p-5 pb-4">
            <DialogHeader className="mb-5">
              <DialogTitle className="font-serif text-base flex items-center gap-2">
                <span className="text-lg">🍃</span>
                TEOTAG's Orb
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground/50 font-serif leading-relaxed mt-1.5 italic">
                The Echo of the Ancient Grove guides your path. Search, contribute, and explore.
              </p>
            </DialogHeader>

            {/* Search action — full width at top */}
            <button
              type="button"
              onClick={() => handleAction("search", { isSearch: true })}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5
                hover:border-primary/40 hover:bg-primary/10 active:scale-[0.97] transition-all duration-300 text-left group mb-3"
            >
              <span className="text-lg">🔍</span>
              <div className="flex-1">
                <span className="text-xs font-serif text-foreground/80 group-hover:text-primary/90 transition-colors duration-300">
                  Search Everything
                </span>
                <span className="block text-[9px] text-muted-foreground/40 font-serif leading-snug">
                  Trees, places, rooms, wanderers, support
                </span>
              </div>
              <span className="text-[9px] text-muted-foreground/30 font-serif">⌘K</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              {ACTIONS.filter(a => !('isSearch' in a && a.isSearch)).map((a) => (
                <button
                  key={a.type}
                  type="button"
                  onClick={() => handleAction(a.type, { isNav: 'isNav' in a ? a.isNav : false })}
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
                  {a.reward && (
                    <span className="text-[9px] text-primary/40 font-serif">
                      {a.reward} ❤️
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Core loop strip */}
          {userId && (
            <div className="border-t border-border/10 px-5 py-2.5 flex items-center gap-3 bg-primary/3">
              <Sprout className="w-3.5 h-3.5 text-primary/60" />
              <span className="text-[10px] font-serif text-foreground/60">
                {seedsRemaining} seed{seedsRemaining !== 1 ? "s" : ""} remaining today
              </span>
              <span className="text-[9px] text-muted-foreground/30 ml-auto">33/day</span>
            </div>
          )}

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

      {/* Unified search overlay triggered from Firefly */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default FireflyPanel;
