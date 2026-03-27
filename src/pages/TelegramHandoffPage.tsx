/**
 * TelegramHandoffPage — dedicated threshold page for Telegram-first entry.
 *
 * Validates the one-time handoff token and routes the user to either:
 *   A. Connect existing account (sign in → link Telegram)
 *   B. Create new Gardener / Wanderer identity
 *
 * Handles expired, invalid, and already-claimed tokens gracefully.
 */
import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolveHandoffToken, type ResolvedHandoff } from "@/hooks/use-bot-handoff";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { TreePine, Compass, Loader2, AlertCircle, ArrowRight, ExternalLink } from "lucide-react";
import { BOT_CONFIG } from "@/config/bot";
import { toast } from "sonner";
import { ROUTES } from "@/lib/routes";

type HandoffFlow = "connect" | "create_gardener" | "create_wanderer";
type PageState = "loading" | "resolved" | "expired" | "invalid" | "already_claimed" | "signing_in" | "creating" | "linking" | "welcome" | "success" | "error";

export default function TelegramHandoffPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useCurrentUser();

  const token = searchParams.get("token");
  const flowParam = searchParams.get("flow") as HandoffFlow | null;

  const [state, setState] = useState<PageState>("loading");
  const [handoff, setHandoff] = useState<ResolvedHandoff | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [identityPath, setIdentityPath] = useState<"gardener" | "wanderer" | null>(null);

  // Resolve the handoff token
  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }

    (async () => {
      const result = await resolveHandoffToken(token);
      if (!result.ok) {
        setState(result.error === "expired" ? "expired" : result.error === "already_claimed" ? "already_claimed" : "invalid");
        return;
      }
      setHandoff(result);
      setState("resolved");
    })();
  }, [token]);

  // If user is already signed in and flow is "connect", auto-link
  useEffect(() => {
    if (state !== "resolved" || authLoading) return;
    if (user && flowParam === "connect" && token) {
      handleLinkAfterSignin();
    }
  }, [state, authLoading, user, flowParam]);

  const handleLinkAfterSignin = useCallback(async () => {
    if (!token) return;
    setState("linking");

    try {
      const { data, error: invokeErr } = await supabase.functions.invoke("telegram-handoff", {
        body: { action: "link_after_signin", token },
      });

      if (invokeErr || !data?.ok) {
        const msg = data?.message || data?.error || "Failed to link Telegram";
        setError(msg);
        setState("error");
        return;
      }

      toast.success("Telegram linked successfully");
      setState("success");
      setTimeout(() => navigate(ROUTES.HEARTH), 2000);
    } catch {
      setError("Connection error. Please try again.");
      setState("error");
    }
  }, [token, navigate]);

  const handleCreateAccount = useCallback(async (path: "gardener" | "wanderer") => {
    if (!token) return;
    setIdentityPath(path);
    setState("creating");

    try {
      const { data, error: invokeErr } = await supabase.functions.invoke("telegram-handoff", {
        body: { action: "create_account", token },
      });

      if (invokeErr || !data?.ok) {
        if (data?.error === "already_linked") {
          setError(data.message || "This Telegram is already connected. Please sign in instead.");
          setState("error");
          return;
        }
        setError(data?.message || data?.error || "Failed to create account");
        setState("error");
        return;
      }

      // Establish session with the tokens
      if (data.access_token && data.refresh_token) {
        const { error: sessionErr } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (sessionErr) {
          console.warn("Session establishment failed:", sessionErr);
          setError("Account created but sign-in failed. Please try signing in.");
          setState("error");
          return;
        }
      }

      setState("welcome");
    } catch {
      setError("Connection error. Please try again.");
      setState("error");
    }
  }, [token]);

  const handleSignInRedirect = useCallback(() => {
    // Store the token so we can complete linking after auth
    if (token) {
      localStorage.setItem("s33d_telegram_handoff_token", token);
      localStorage.setItem("s33d_bot_handoff", JSON.stringify({
        source: "telegram",
        bot: "openclaw",
        handoffToken: token,
        intent: "dashboard",
        invite: null,
        gift: null,
        returnTo: `/telegram-handoff?token=${token}&flow=connect`,
        campaign: null,
      }));
    }
    navigate(ROUTES.AUTH);
  }, [token, navigate]);

  const botLink = BOT_CONFIG.telegramBotLink("start");

  // ── Render states ──

  if (state === "loading" || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground font-serif">Opening the forest gate…</p>
        </div>
      </div>
    );
  }

  if (state === "expired") {
    return (
      <ErrorState
        title="This path has faded"
        message="The link has expired. Return to Telegram and ask the bot for a new one."
        botLink={botLink}
      />
    );
  }

  if (state === "invalid") {
    return (
      <ErrorState
        title="Path not found"
        message="This link isn't valid. Return to Telegram and start fresh with the bot."
        botLink={botLink}
      />
    );
  }

  if (state === "already_claimed") {
    return (
      <ErrorState
        title="Already walked"
        message="This link has already been used. If you need a new path, return to Telegram."
        botLink={botLink}
        showSignIn
        onSignIn={() => navigate(ROUTES.AUTH)}
      />
    );
  }

  if (state === "linking" || state === "creating") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground font-serif">
            {state === "linking" ? "Weaving your Telegram thread…" : "Planting your roots…"}
          </p>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="text-4xl">🌿</div>
          <h1 className="text-xl font-serif text-foreground">Telegram connected</h1>
          <p className="text-sm text-muted-foreground font-serif">
            Your Telegram identity is now woven into your S33D journey.
          </p>
          <p className="text-xs text-muted-foreground">Entering the forest…</p>
        </div>
      </div>
    );
  }

  if (state === "welcome") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="text-5xl">{identityPath === "gardener" ? "🌱" : "🧭"}</div>
          <h1 className="text-2xl font-serif text-foreground">
            Welcome, {identityPath === "gardener" ? "Gardener" : "Wanderer"}
          </h1>
          <p className="text-sm text-muted-foreground font-serif leading-relaxed">
            {identityPath === "gardener"
              ? "You've arrived to plant, tend, and grow. The forest is glad to have you."
              : "You've arrived to explore, discover, and witness. The paths are open."}
          </p>
          <Button
            onClick={() => navigate(identityPath === "gardener" ? ROUTES.ADD_TREE : ROUTES.ATLAS)}
            className="gap-2 font-serif"
          >
            {identityPath === "gardener" ? "Plant your first tree" : "Explore the atlas"}
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.HEARTH)}
            className="text-xs text-muted-foreground font-serif"
          >
            Go to your hearth
          </Button>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <ErrorState
        title="Something went awry"
        message={error || "An unexpected error occurred."}
        botLink={botLink}
        showSignIn
        onSignIn={() => navigate(ROUTES.AUTH)}
      />
    );
  }

  // ── Main resolved state: show flow options ──
  const telegramUsername = (handoff?.payload as any)?.telegram_username;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-sm w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="text-4xl">🌳</div>
          <h1 className="text-2xl font-serif text-foreground">
            Welcome to S33D
          </h1>
          {telegramUsername && (
            <p className="text-sm text-muted-foreground font-serif">
              Arriving as <span className="text-foreground">@{telegramUsername}</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground font-serif leading-relaxed">
            You've been sent here through the forest gate. Choose how you'd like to enter.
          </p>
        </div>

        {/* Flow A: Connect existing account */}
        {(flowParam === "connect" || !flowParam) && (
          <div className="space-y-3">
            <h2 className="text-sm font-serif text-foreground/80 text-center">
              I already have a S33D account
            </h2>
            <Button
              onClick={handleSignInRedirect}
              variant="outline"
              className="w-full gap-2 font-serif h-12"
            >
              Sign in & connect Telegram
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Flow B: Create new identity */}
        {(flowParam === "create_gardener" || flowParam === "create_wanderer" || !flowParam) && (
          <div className="space-y-3">
            <h2 className="text-sm font-serif text-foreground/80 text-center">
              I'm new — create my identity
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleCreateAccount("gardener")}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all text-center"
              >
                <TreePine className="w-6 h-6 text-primary" />
                <span className="text-sm font-serif text-foreground">Gardener</span>
                <span className="text-[10px] text-muted-foreground font-serif">Plant & tend</span>
              </button>
              <button
                onClick={() => handleCreateAccount("wanderer")}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all text-center"
              >
                <Compass className="w-6 h-6 text-primary" />
                <span className="text-sm font-serif text-foreground">Wanderer</span>
                <span className="text-[10px] text-muted-foreground font-serif">Explore & discover</span>
              </button>
            </div>
          </div>
        )}

        {/* Divider if both flows shown */}
        {!flowParam && (
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border/30" />
            <span className="text-[10px] text-muted-foreground font-serif">or</span>
            <div className="h-px flex-1 bg-border/30" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Error state component ── */

function ErrorState({
  title,
  message,
  botLink,
  showSignIn,
  onSignIn,
}: {
  title: string;
  message: string;
  botLink: string | null;
  showSignIn?: boolean;
  onSignIn?: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-sm w-full text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto" />
        <h1 className="text-xl font-serif text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground font-serif leading-relaxed">{message}</p>
        <div className="flex flex-col gap-2 pt-2">
          {botLink && (
            <a href={botLink} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full gap-2 font-serif">
                <ExternalLink className="w-4 h-4" />
                Return to Telegram bot
              </Button>
            </a>
          )}
          {showSignIn && onSignIn && (
            <Button variant="ghost" size="sm" onClick={onSignIn} className="font-serif text-xs">
              Sign in to S33D
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
