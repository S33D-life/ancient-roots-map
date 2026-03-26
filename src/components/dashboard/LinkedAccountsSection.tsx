/**
 * LinkedAccountsSection — displays connected identity providers
 * and allows linking/unlinking Telegram.
 *
 * Designed for the Hearth / Account & Security area.
 */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BOT_CONFIG } from "@/config/bot";
import {
  getConnectedAccounts,
  unlinkConnectedAccount,
} from "@/services/telegram-auth";
import { User } from "@supabase/supabase-js";
import {
  Link2,
  Link2Off,
  Mail,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";

// Inline icons
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

interface LinkedAccountsSectionProps {
  user: User;
}

interface ConnectedAccount {
  id: string;
  provider: string;
  provider_username: string | null;
  display_name: string | null;
  verified_at: string | null;
  linked_at: string;
}

export default function LinkedAccountsSection({ user }: LinkedAccountsSectionProps) {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    getConnectedAccounts().then((data) => {
      setAccounts(data as ConnectedAccount[]);
      setLoading(false);
    });
  }, []);

  const handleUnlink = async (accountId: string, provider: string) => {
    setUnlinking(accountId);
    const ok = await unlinkConnectedAccount(accountId);
    if (ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      toast({ title: `${provider} unlinked`, description: "Identity disconnected from your account." });
    } else {
      toast({ title: "Unlink failed", description: "Please try again.", variant: "destructive" });
    }
    setUnlinking(null);
  };

  const handleLinkTelegram = () => {
    // TODO: Open Telegram Login Widget or redirect
    toast({
      title: "Coming soon",
      description: "Telegram account linking will be available shortly.",
    });
  };

  const telegramLinked = accounts.some((a) => a.provider === "telegram");

  // Determine Google status from auth provider
  const googleProvider = user.app_metadata?.providers?.includes("google") || user.app_metadata?.provider === "google";

  return (
    <div className="space-y-3 max-w-sm">
      {/* Email identity */}
      <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/10 p-3">
        <Mail className="w-4 h-4 text-primary/70 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-serif text-sm truncate">{user.email}</p>
          <p className="text-[10px] text-muted-foreground">Email</p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-serif bg-primary/15 text-primary">
          <Check className="w-2.5 h-2.5 inline mr-0.5" />Active
        </span>
      </div>

      {/* Google identity */}
      {googleProvider && (
        <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/10 p-3">
          <GoogleIcon className="w-4 h-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-serif text-sm">Google</p>
            <p className="text-[10px] text-muted-foreground">Sign-in provider</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-serif bg-primary/15 text-primary">
            <Link2 className="w-2.5 h-2.5 inline mr-0.5" />Linked
          </span>
        </div>
      )}

      {/* Telegram identity */}
      {telegramLinked ? (
        accounts
          .filter((a) => a.provider === "telegram")
          .map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/10 p-3">
              <TelegramIcon className="w-4 h-4 text-[#229ED9] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-serif text-sm truncate">
                  {a.provider_username ? `@${a.provider_username}` : a.display_name || "Telegram"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {a.verified_at ? "Verified" : "Linked"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={() => handleUnlink(a.id, "Telegram")}
                disabled={unlinking === a.id}
              >
                {unlinking === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2Off className="w-3 h-3" />}
              </Button>
            </div>
          ))
      ) : BOT_CONFIG.hasTelegramAuth ? (
        <div className="flex items-center gap-3 rounded-lg border border-border/30 border-dashed bg-secondary/5 p-3">
          <TelegramIcon className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-serif text-sm text-muted-foreground">Telegram</p>
            <p className="text-[10px] text-muted-foreground">Not linked</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1 font-serif"
            onClick={handleLinkTelegram}
          >
            <Link2 className="w-3 h-3" />
            Link
          </Button>
        </div>
      ) : null}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading connected accounts…
        </div>
      )}
    </div>
  );
}
