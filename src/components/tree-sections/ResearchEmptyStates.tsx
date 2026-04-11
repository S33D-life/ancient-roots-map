/**
 * Beautiful empty states for research-derived tree pages.
 * Intentional, poetic placeholders with guided next actions.
 */
import { Heart, Camera, MessageSquare, TreeDeciduous, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyProps {
  treeName: string;
  onAction?: () => void;
}

const EmptyShell = ({ icon: Icon, message, actionLabel, onAction, secondaryLabel, onSecondary }: {
  icon: typeof Camera;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) => (
  <div
    className="rounded-xl border p-6 text-center space-y-4"
    style={{
      borderColor: "hsl(var(--border) / 0.3)",
      background: "linear-gradient(135deg, hsl(var(--card) / 0.4), hsl(var(--card) / 0.2))",
    }}
  >
    <Icon className="h-6 w-6 mx-auto text-muted-foreground/40" />
    <p className="text-sm font-serif italic text-muted-foreground/60">{message}</p>
    {actionLabel && onAction && (
      <Button variant="outline" size="sm" onClick={onAction} className="font-serif text-xs gap-1.5">
        <Sparkles className="h-3 w-3" />
        {actionLabel}
      </Button>
    )}
    {secondaryLabel && onSecondary && (
      <button onClick={onSecondary} className="block mx-auto text-[11px] text-muted-foreground/50 hover:text-primary transition-colors font-serif">
        {secondaryLabel}
      </button>
    )}
  </div>
);

export const EmptyOfferings = ({ treeName, onAction }: EmptyProps) => (
  <EmptyShell
    icon={Camera}
    message={`No offerings yet — be the first to leave a trace beneath the branches of ${treeName}.`}
    actionLabel="Leave an offering"
    onAction={onAction}
  />
);

export const EmptyWishes = ({ treeName, onAction }: EmptyProps) => (
  <EmptyShell
    icon={Heart}
    message="This Ancient Friend is still emerging from the Research Grove. Leave a wish to welcome it into the living ledger."
    actionLabel="Make a wish"
    onAction={onAction}
  />
);

export const EmptyVisits = ({ treeName }: EmptyProps) => (
  <EmptyShell
    icon={TreeDeciduous}
    message={`Visit records will appear here as ${treeName} enters the wider living ledger.`}
    actionLabel="Visit on Map"
    onAction={() => window.dispatchEvent(new CustomEvent("s33d-navigate", { detail: { to: "/map" } }))}
  />
);

export const EmptyWhispers = ({ treeName, onAction }: EmptyProps) => (
  <EmptyShell
    icon={MessageSquare}
    message={`Whisper to ${treeName} — your words may drift through the canopy and find a kindred wanderer.`}
    actionLabel="Send a whisper"
    onAction={onAction}
  />
);
