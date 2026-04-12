/**
 * BotContinuationBanner — a gentle banner shown after auth when the user
 * arrived from Telegram / OpenClaw with a specific intent.
 *
 * Aligned to shared contract:
 * - Routes from RPC-resolved intent, not URL params
 * - Handles expired / invalid / already-claimed states gracefully
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredHandoff, clearStoredHandoff, intentToPath } from "@/hooks/use-bot-handoff";
import { Button } from "@/components/ui/button";
import { ArrowRight, X, AlertCircle } from "lucide-react";

const INTENT_LABELS: Record<string, string> = {
  map: "Open the living map",
  "add-tree": "Plant a new tree",
  tree: "Visit the tree you were sent",
  referrals: "See your grove of wanderers",
  invite: "Accept your invitation",
  gift: "Claim your gifted seed",
  roadmap: "Explore the living roadmap",
  dashboard: "Return to your hearth",
  atlas: "Explore the world atlas",
  library: "Browse the heartwood library",
  council: "Enter the Council of Life",
  journey: "Continue your journey",
  support: "Continue your support journey",
};

export default function BotContinuationBanner() {
  const [handoff, setHandoff] = useState(getStoredHandoff());
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setHandoff(getStoredHandoff());
  }, []);

  if (!handoff || dismissed) return null;
  if (!handoff.intent && !handoff.returnTo) return null;

  const label = handoff.intent
    ? INTENT_LABELS[handoff.intent] || "Continue your journey"
    : "Continue your journey";

  const sourceLabel = handoff.source === "telegram" || handoff.bot === "openclaw" || handoff.bot === "teotag"
    ? "TEOTAG"
    : "your journey";

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="bg-card/95 backdrop-blur border border-primary/20 rounded-2xl p-4 shadow-lg flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-serif">
            Continue from {sourceLabel}
          </p>
          <p className="text-sm font-serif text-foreground truncate">
            {label}
          </p>
        </div>
        <Button
          size="sm"
          className="shrink-0 gap-1 font-serif"
          onClick={() => {
            const path = intentToPath(handoff.intent, handoff.returnTo);
            clearStoredHandoff();
            setDismissed(true);
            navigate(path);
          }}
        >
          Go <ArrowRight className="w-3.5 h-3.5" />
        </Button>
        <button
          onClick={() => {
            clearStoredHandoff();
            setDismissed(true);
          }}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
