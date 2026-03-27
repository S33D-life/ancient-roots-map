/**
 * TelegramLinkDialog — Bot-assisted Telegram account linking flow.
 *
 * Steps:
 * 1. Generate a 6-digit verification code
 * 2. User sends code to the S33D bot on Telegram
 * 3. Poll for verification status
 * 4. Claim and complete linking
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import { toast } from "sonner";

interface TelegramLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinked?: () => void;
}

type LinkStep = "generate" | "waiting" | "verified" | "linked" | "error";

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Reset on close
  useEffect(() => {
    if (!open) {
      if (pollRef.current) clearInterval(pollRef.current);
      setStep("generate");
      setCodeData(null);
      setError(null);
      setCopied(false);
      setVerifiedUsername(null);
    }
  }, [open]);

  const handleGenerate = useCallback(async () => {
    setStep("generate");
    setError(null);
    const result = await generateVerificationCode();
    if (!result.ok) {
      setError(result.error || "Could not generate code");
      setStep("error");
      return;
    }
    setCodeData(result);
    setStep("waiting");

    // Start polling every 3 seconds
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const check = await checkVerificationCode(result.code_id!);
      if (check.status === "verified") {
        if (pollRef.current) clearInterval(pollRef.current);
        setVerifiedUsername(check.telegram_username || null);
        setStep("verified");
      } else if (check.status === "expired") {
        if (pollRef.current) clearInterval(pollRef.current);
        setError("Code expired. Please try again.");
        setStep("error");
      }
    }, 3000);
  }, []);

  // Auto-generate on open
  useEffect(() => {
    if (open && step === "generate") {
      handleGenerate();
    }
  }, [open, step, handleGenerate]);

  const handleClaim = async () => {
    if (!codeData?.code_id) return;
    const result = await claimVerificationCode(codeData.code_id);
    if (result.ok) {
      setStep("linked");
      toast.success("Telegram linked successfully");
      onLinked?.();
    } else {
      setError(result.error || "Linking failed");
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
    : BOT_CONFIG.telegramBotLink("verify")
      ? BOT_CONFIG.telegramBotLink("verify")
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <TelegramIcon className="w-5 h-5 text-[#229ED9]" />
            Link Telegram
          </DialogTitle>
          <DialogDescription className="font-serif text-xs">
            Connect your Telegram identity to S33D
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Waiting for verification */}
          {step === "waiting" && codeData && (
            <>
              <p className="text-sm text-foreground/80 font-serif">
                Send this code to the S33D bot on Telegram:
              </p>

              {/* Code display */}
              <div className="flex items-center justify-center gap-3">
                <div className="text-3xl font-mono tracking-[0.3em] font-bold text-primary bg-primary/5 px-6 py-3 rounded-xl border border-primary/20">
                  {codeData.code}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyCode}
                  className="shrink-0"
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
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#229ED9]/10 text-[#229ED9] hover:bg-[#229ED9]/20 transition-colors text-sm font-serif"
                >
                  <TelegramIcon className="w-4 h-4" />
                  Open S33D Bot
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground font-serif">
                <Loader2 className="w-3 h-3 animate-spin" />
                Waiting for verification…
              </div>

              <p className="text-[10px] text-muted-foreground/60 font-serif">
                Code expires in 10 minutes
              </p>
            </>
          )}

          {/* Verified — ready to claim */}
          {step === "verified" && (
            <>
              <div className="flex flex-col items-center gap-3 py-4">
                <ShieldCheck className="w-10 h-10 text-green-500" />
                <p className="text-sm font-serif text-foreground/90 text-center">
                  Telegram identity verified
                  {verifiedUsername && (
                    <>
                      <br />
                      <span className="text-primary font-medium">
                        @{verifiedUsername}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <Button onClick={handleClaim} className="w-full gap-2 font-serif">
                <TelegramIcon className="w-4 h-4" />
                Link this Telegram account
              </Button>
            </>
          )}

          {/* Linked — success */}
          {step === "linked" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Check className="w-10 h-10 text-green-500" />
              <p className="text-sm font-serif text-foreground/90 text-center">
                Telegram is now linked to your S33D account
              </p>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="font-serif"
              >
                Done
              </Button>
            </div>
          )}

          {/* Error */}
          {step === "error" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <p className="text-sm font-serif text-destructive/80 text-center">
                {error}
              </p>
              <Button
                variant="outline"
                onClick={handleGenerate}
                className="font-serif"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Loading / generate */}
          {step === "generate" && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
