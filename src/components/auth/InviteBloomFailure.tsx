/**
 * InviteBloomFailure — soft Heartwood-style warning shown when an invite
 * cannot be validated. Replaces the harsh red destructive toast with a
 * calm, ceremonial card that offers three gentle paths forward.
 */
import { Sparkles, RotateCcw, MessageCircleHeart, TreeDeciduous } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface InviteBloomFailureProps {
  /** Re-validate the invite code currently in the form */
  onRetry: () => void;
  /** Open guidance / contact path for requesting a fresh invite */
  onRequestFresh: () => void;
  /** Return to the public Atlas / Grove */
  onReturnToGrove: () => void;
  /** Optional inline detail (e.g. expired, used) */
  reason?: string | null;
}

const InviteBloomFailure = ({
  onRetry,
  onRequestFresh,
  onReturnToGrove,
  reason,
}: InviteBloomFailureProps) => {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-5 space-y-4 shadow-[0_0_30px_-12px_hsl(var(--primary)/0.35)]"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary/80" aria-hidden />
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-base text-foreground">
            This invitation could not bloom
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed font-serif">
            It may have already been planted or the link may have faded.
            Ask your wanderer companion for a fresh invitation.
          </p>
          {reason && (
            <p className="text-[11px] text-muted-foreground/60 font-mono pt-1">
              {reason}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={onRetry}
          className="font-serif gap-1.5 w-full sm:w-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Retry invite
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRequestFresh}
          className="font-serif gap-1.5 w-full sm:w-auto"
        >
          <MessageCircleHeart className="w-3.5 h-3.5" />
          Request fresh invite
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReturnToGrove}
          className="font-serif gap-1.5 w-full sm:w-auto text-muted-foreground hover:text-foreground"
        >
          <TreeDeciduous className="w-3.5 h-3.5" />
          Return to Grove
        </Button>
      </div>
    </div>
  );
};

export default InviteBloomFailure;
