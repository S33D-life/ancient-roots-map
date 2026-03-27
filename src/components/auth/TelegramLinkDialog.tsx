/**
 * TelegramLinkDialog — Bot-assisted Telegram account linking flow.
 *
 * IMPORTANT: This is account LINKING, not login. Requires an active S33D session.
 *
 * Steps:
 * 1. Generate a 6-digit verification code
 * 2. User sends code to the S33D bot on Telegram
 * 3. Poll for verification status (with countdown + network resilience)
 * 4. Claim and complete linking
 *
 * Edge cases handled:
 * - Dialog close mid-poll → cleanup polling interval
 * - Code expiry → show clear expiry message with retry
 * - Network failure during poll → retry silently, show error after 3 failures
 * - Multiple rapid generations → server expires old codes automatically
 * - Collision (Telegram linked to another user) → clear error message
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { BOT_CONFIG } from "@/config/bot";
import {
  generateVerificationCode,
  checkVerificationCode,
  claimVerificationCode,
} from "@/services/telegram-auth";
import type { GenerateCodeResult } from "@/services/telegram-auth";
import {
  Loader2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface TelegramLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinked?: () => void;
}

type LinkStep = "generate" | "waiting" | "verified" | "claiming" | "linked" | "error";

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

/** Format remaining seconds as "M:SS" */
function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TelegramLinkDialog({
  open,
  onOpenChange,
  onLinked,
}: TelegramLinkDialogProps) {
  const [step, setStep] = useState<LinkStep>("generate");
  const [codeData, setCodeData] = useState<GenerateCodeResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedUsername, setVerifiedUsername] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes
  const [pollFailures, setPollFailures] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isOpenRef = useRef(open);

  // Track open state for async callbacks
  useEffect(() => { isOpenRef.current = open; }, [open]);

  // Cleanup all intervals
  const clearAllIntervals = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }, []);

  // Cleanup on unmount
  useEffect(() => clearAllIntervals, [clearAllIntervals]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      clearAllIntervals();
      // Delay reset so close animation completes
      const t = setTimeout(() => {
        setStep("generate");
        setCodeData(null);
        setError(null);
        setCopied(false);
        setVerifiedUsername(null);
        setSecondsLeft(600);
        setPollFailures(0);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open, clearAllIntervals]);

  const handleGenerate = useCallback(async () => {
    setStep("generate");
    setError(null);
    setPollFailures(0);

    const result = await generateVerificationCode();

    // Guard: dialog may have closed during the async call
    if (!isOpenRef.current) return;

    if (!result.ok) {
      setError(result.error || "Could not generate code");
      setStep("error");
      return;
    }

    setCodeData(result);
    setStep("waiting");

    // Calculate seconds until expiry
    if (result.expires_at) {
      const expiresMs = new Date(result.expires_at).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.floor(expiresMs / 1000)));
    } else {
      setSecondsLeft(600);
    }

    // Start countdown
    clearAllIntervals();
    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearAllIntervals();
          setError("Verification code expired. Generate a new one to try again.");
          setStep("error");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start polling every 4 seconds (slightly slower to reduce server load)
    pollRef.current = setInterval(async () => {
      if (!isOpenRef.current) return;

      try {
        const check = await checkVerificationCode(result.code_id!);
        setPollFailures(0); // Reset on success

        if (check.status === "verified") {
          clearAllIntervals();
          setVerifiedUsername(check.telegram_username || null);
          setStep("verified");
        } else if (check.status === "expired" || check.status === "claimed") {
          clearAllIntervals();
          if (check.status === "expired") {
            setError("Verification code expired. Generate a new one to try again.");
            setStep("error");
          }
        }
      } catch {
        // Network failure — retry silently up to a point
        setPollFailures((prev) => {
          const next = prev + 1;
          if (next >= 5) {
            clearAllIntervals();
            setError("Connection lost. Please check your network and try again.");
            setStep("error");
          }
          return next;
        });
      }
    }, 4000);
  }, [clearAllIntervals]);

  // Auto-generate on open
  useEffect(() => {
    if (open && step === "generate") {
      handleGenerate();
    }
  }, [open, step, handleGenerate]);

  const handleClaim = async () => {
    if (!codeData?.code_id) return;
    setStep("claiming");
    const result = await claimVerificationCode(codeData.code_id);
    if (result.ok) {
      setStep("linked");
      toast.success("Telegram account linked to S33D");
      onLinked?.();
    } else {
      setError(result.error || "Linking failed. Please try again.");
      setStep("error");
    }
  };

  const copyCode = () => {
    if (codeData?.code) {
      navigator.clipboard.writeText(codeData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const botLink = codeData?.bot_username
    ? `https://t.me/${codeData.bot_username}`
    : BOT_CONFIG.telegramBotLink("verify");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <TelegramIcon className="w-5 h-5 text-[#229ED9]" />
            Link Telegram Account
          </DialogTitle>
          <DialogDescription className="font-serif text-xs">
            Connect your Telegram identity to your S33D account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Step 1 & 2: Waiting for bot verification */}
          {step === "waiting" && codeData && (
            <>
              {/* Instructions */}
              <div className="space-y-2">
                <p className="text-sm text-foreground/80 font-serif">
                  Send this code to the S33D bot on Telegram to verify your identity:
                </p>
                <ol className="text-[11px] text-muted-foreground font-serif space-y-1 list-decimal list-inside">
                  <li>Copy the code below</li>
                  <li>Open the S33D bot on Telegram</li>
                  <li>Send the code as a message</li>
                  <li>Return here — linking will complete automatically</li>
                </ol>
              </div>

              {/* Code display */}
              <div className="flex items-center justify-center gap-3">
                <div className="text-3xl font-mono tracking-[0.3em] font-bold text-primary bg-primary/5 px-6 py-3 rounded-xl border border-primary/20 select-all">
                  {codeData.code}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyCode}
                  className="shrink-0"
                  title="Copy code"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Bot link */}
              {botLink && (
                <a
                  href={botLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-accent/30 text-foreground hover:bg-accent/50 transition-colors text-sm font-serif border border-border/20"
                >
                  <TelegramIcon className="w-4 h-4" />
                  Open S33D Bot
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {/* Status bar */}
              <div className="flex items-center justify-between text-xs text-muted-foreground font-serif">
                <div className="flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Waiting for bot verification…
                </div>
                <div className="flex items-center gap-1 tabular-nums">
                  <Clock className="w-3 h-3" />
                  {formatCountdown(secondsLeft)}
                </div>
              </div>

              {/* Network warning */}
              {pollFailures > 0 && pollFailures < 5 && (
                <p className="text-[10px] text-amber-500/70 font-serif text-center">
                  Connection unstable — retrying…
                </p>
              )}
            </>
          )}

          {/* Step 3: Verified — confirm claim */}
          {step === "verified" && (
            <>
              <div className="flex flex-col items-center gap-3 py-4">
                <ShieldCheck className="w-10 h-10 text-green-500" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-serif text-foreground/90">
                    Telegram identity verified
                  </p>
                  {verifiedUsername && (
                    <p className="text-primary font-medium font-serif">
                      @{verifiedUsername}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground font-serif">
                    This Telegram account will be linked to your S33D identity.
                  </p>
                </div>
              </div>
              <Button onClick={handleClaim} className="w-full gap-2 font-serif">
                <TelegramIcon className="w-4 h-4" />
                Confirm &amp; Link
              </Button>
            </>
          )}

          {/* Claiming in progress */}
          {step === "claiming" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-serif text-muted-foreground">
                Linking your Telegram account…
              </p>
            </div>
          )}

          {/* Step 4: Linked — success */}
          {step === "linked" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-serif text-foreground/90">
                  Telegram linked successfully
                </p>
                <p className="text-[11px] text-muted-foreground font-serif">
                  Your Telegram identity is now connected to your S33D account.
                  You can manage this in your account settings.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="font-serif mt-2"
              >
                Done
              </Button>
            </div>
          )}

          {/* Error with recovery */}
          {step === "error" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <AlertCircle className="w-8 h-8 text-destructive/70" />
              <p className="text-sm font-serif text-destructive/80 text-center max-w-[280px]">
                {error}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="font-serif text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerate}
                  className="font-serif text-xs gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  New Code
                </Button>
              </div>
            </div>
          )}

          {/* Initial loading */}
          {step === "generate" && (
            <div className="flex flex-col items-center gap-2 py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-serif">
                Generating verification code…
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
