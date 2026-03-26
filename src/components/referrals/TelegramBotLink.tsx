/**
 * TelegramBotLink — generates and displays a proper t.me bot deep-link
 * when VITE_TELEGRAM_BOT_USERNAME is configured.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Bot } from "lucide-react";
import { BOT_CONFIG } from "@/config/bot";
import { useToast } from "@/hooks/use-toast";

interface TelegramBotLinkProps {
  inviteCode: string;
}

export default function TelegramBotLink({ inviteCode }: TelegramBotLinkProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!BOT_CONFIG.hasTelegramBot) return null;

  // The start param encodes the invite code so the bot can create a handoff
  const botLink = BOT_CONFIG.telegramBotLink(`invite_${inviteCode}`);
  if (!botLink) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(botLink);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = botLink;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    toast({ title: "Bot link copied!", description: "Share this Telegram link with friends" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-serif flex items-center gap-1.5">
        <Bot className="w-3.5 h-3.5 text-primary/60" />
        Telegram Bot Invite
      </p>
      <div className="flex gap-2">
        <Input
          value={botLink}
          readOnly
          className="font-mono text-xs"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1 font-serif min-h-[44px]"
          onClick={handleCopy}
        >
          <Copy className="w-3.5 h-3.5" />
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
