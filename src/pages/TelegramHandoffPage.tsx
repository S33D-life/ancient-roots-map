/**
 * TelegramHandoffPage — dedicated threshold page for Telegram-first entry.
 *
 * Validates the one-time handoff token and routes the user to either:
 *   A. Connect existing account (sign in → link Telegram)
 *   B. Create a new S33D account (with an optional first-step suggestion)
 *
 * "Gardener" and "Wanderer" are participation modes, not permanent identities.
 * A user may garden one day and wander the next.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolveHandoffToken, type ResolvedHandoff } from "@/hooks/use-bot-handoff";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { TreePine, Compass, Loader2, AlertCircle, ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
import { BOT_CONFIG } from "@/config/bot";
import { toast } from "sonner";
import { ROUTES } from "@/lib/routes";

type HandoffFlow = "connect" | "create" | "create_gardener" | "create_wanderer";
type PageState =
  | "loading"
  | "resolved"
  | "confirm_link"
  | "expired"
  | "invalid"
  | "already_claimed"
  | "creating"
  | "linking"
  | "welcome"
  | "success"
  | "error";

export default function TelegramHandoffPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useCurrentUser();
  const resolveAttempted = useRef(false);

  const token = searchParams.get("token");
  const flowParam = searchParams.get("flow") as HandoffFlow | null;

  const [state, setState] = useState<PageState>("loading");
  const [handoff, setHandoff] = useState<ResolvedHandoff | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [firstStep, setFirstStep] = useState<"tend" | "explore" | null>(null);

  // Resolve the handoff token (once only)
  useEffect(() => {
    if (resolveAttempted.current) return;
    resolveAttempted.current = true;

    if (!token) {
      setState("invalid");
      return;
    }

    (async () => {
      const result = await resolveHandoffToken(token);
      if (!result.ok) {
        setState(
          result.error === "expired" ? "expired"
          : result.error === "already_claimed" ? "already_claimed"
          : "invalid"
        );
        return;
      }
      setHandoff(result);
      setState("resolved");
    })();
  }, [token]);

  // When resolved + user already signed in + connect flow → show confirmation
  useEffect(() => {
    if (state !== "resolved" || authLoading) return;
    if (user && flowParam === "connect" && token) {
      setState("confirm_link");
    }
  }, [state, authLoading, user, flowParam, token]);

  // Check for returning from auth with stored handoff token
  useEffect(() => {
    if (authLoading || !user) return;
    const storedToken = localStorage.getItem("s33d_telegram_handoff_token");
    if (storedToken && storedToken === token && state === "resolved") {
      localStorage.removeItem("s33d_telegram_handoff_token");
      setState("confirm_link");
    }
  }, [authLoading, user, token, state]);

  const handleLinkAfterSignin = useCallback(async () => {
    if (!token) return;
    setState("linking");

    try {
      const { data, error: invokeErr } = await supabase.functions.invoke("telegram-handoff", {
        body: { action: "link_after_signin", token },
      });

      if (invokeErr || !data?.ok) {
        const msg = data?.message || data?.error || "Failed to link Telegram";
        if (data?.error === "already_claimed") {
          setState("already_claimed");
          return;
        }
        setError(msg);
        setState("error");
        return;
      }

      toast.success(
        data.already_linked
          ? "Telegram was already connected"
          : "Telegram linked successfully"
      );
      setState("success");
      setTimeout(() => navigate(ROUTES.HEARTH), 2500);
    } catch {
      setError("Connection error. Please try again.");
      setState("error");
    }
  }, [token, navigate]);

  const handleCreateAccount = useCallback(async (step: "tend" | "explore") => {
    if (!token) return;
    setFirstStep(step);
    setState("creating");

    // Map the soft first-step to the identity_path the server expects
    const identity_path = step === "tend" ? "gardener" : "wanderer";

    try {
      const { data, error: invokeErr } = await supabase.functions.invoke("telegram-handoff", {
        body: {
          action: "create_account",
          token,
          identity_path,
        },
      });

      if (invokeErr || !data?.ok) {
        if (data?.error === "already_linked") {
          setError(data.message || "This Telegram is already connected. Please sign in instead.");
          setState("error");
          return;
        }
        if (data?.error === "already_claimed") {
          setState("already_claimed");
          return;
        }
        if (data?.error === "expired") {
          setState("expired");
          return;
        }
        setError(data?.message || data?.error || "Failed to create account");
        setState("error");
        return;
      }

      // Establish session with the returned tokens
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
      } else if (data.needs_manual_signin) {
        setError(data.message || "Account created. Please sign in to continue.");
        setState("error");
        return;
      }

      setFirstStep(step);
      setState("welcome");
    } catch {
      setError("Connection error. Please try again.");
      setState("error");
    }
  }, [token]);

  const handleSignInRedirect = useCallback(() => {
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
  const telegramUsername = (handoff?.payload as any)?.telegram_username;

  // Determine if the flow is "connect" or "create"
  const isConnectFlow = flowParam === "connect";
  const isCreateFlow = !flowParam || flowParam === "create" || flowParam === "create_gardener" || flowParam === "create_wanderer";

  // Suggested first step from bot command (soft hint, not identity)
  const suggestedStep = flowParam === "create_gardener" ? "tend" as const
    : flowParam === "create_wanderer" ? "explore" as const
    : null;

  // ── Render states ──

  if (state === "loading" || authLoading) {
    return <CenteredLoader text="Opening the forest gate…" />;
  }

  if (state === "expired") {
    return (
      <ErrorState
        title="This path has faded"
        message="The link has expired. Return to Telegram and ask TEOTAG for a new one."
        botLink={botLink}
      />
    );
  }

  if (state === "invalid") {
    return (
      <ErrorState
        title="Path not found"
        message="This link isn't valid. Return to Telegram and start fresh with TEOTAG."
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
    return <CenteredLoader text={state === "linking" ? "Weaving your Telegram thread…" : "Preparing the forest…"} />;
  }

  if (state === "confirm_link") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <ShieldCheck className="w-10 h-10 text-primary mx-auto" />
          <h1 className="text-xl font-serif text-foreground">Confirm Telegram Link</h1>
          <div className="space-y-2 p-4 rounded-xl border border-border/50 bg-card/50">
            <p className="text-xs text-muted-foreground font-serif">Linking Telegram to:</p>
            <p className="text-sm font-serif text-foreground font-medium">
              {user?.email || "Your S33D account"}
            </p>
            {telegramUsername && (
              <>
                <div className="h-px bg-border/30 my-2" />
                <p className="text-xs text-muted-foreground font-serif">Telegram identity:</p>
                <p className="text-sm font-serif text-foreground">@{telegramUsername}</p>
              </>
            )}
          </div>
          <Button onClick={handleLinkAfterSignin} className="w-full gap-2 font-serif">
            Confirm & connect
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              supabase.auth.signOut();
              handleSignInRedirect();
            }}
            className="text-xs text-muted-foreground font-serif"
          >
            Sign in with a different account
          </Button>
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
          <div className="text-5xl">🌳</div>
          <h1 className="text-2xl font-serif text-foreground">
            Welcome to the forest
          </h1>
          <p className="text-sm text-muted-foreground font-serif leading-relaxed">
            Your account is ready. You can tend the garden, wander the roots, or do both — the forest is open to you.
          </p>
          <Button
            onClick={() => navigate(ROUTES.HEARTH)}
            className="gap-2 font-serif"
          >
            Enter your hearth
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(firstStep === "tend" ? ROUTES.ADD_TREE : ROUTES.ATLAS)}
            className="text-xs text-muted-foreground font-serif"
          >
            {firstStep === "tend" ? "Plant your first tree" : "Explore the atlas"}
          </Button>
        </div>
      </div>
    );
  }

  if (state === "error") {
    const isAlreadyLinked = error?.includes("already connected") || error?.includes("already linked");
    const isWrongAccount = error?.includes("different Telegram") || error?.includes("Unlink it first");
    return (
      <ErrorState
        title={isAlreadyLinked ? "Already connected" : isWrongAccount ? "Different Telegram linked" : "Something went awry"}
        message={error || "An unexpected error occurred."}
        botLink={botLink}
        showSignIn={isAlreadyLinked}
        onSignIn={isAlreadyLinked ? () => navigate(ROUTES.AUTH) : undefined}
        extraAction={isWrongAccount ? {
          label: "Open settings",
          onClick: () => navigate(ROUTES.HEARTH),
        } : undefined}
      />
    );
  }

  // ── Main resolved state: show flow options ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-sm w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="text-4xl">🌳</div>
          <h1 className="text-2xl font-serif text-foreground">Welcome to S33D</h1>
          {telegramUsername && (
            <p className="text-sm text-muted-foreground font-serif">
              Arriving as <span className="text-foreground">@{telegramUsername}</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground font-serif leading-relaxed">
            TEOTAG has opened a path for you. Choose how you'd like to enter.
          </p>
        </div>

        {/* Flow A: Connect existing account */}
        {isConnectFlow && (
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

        {/* Neutral divider when showing both */}
        {!flowParam && (
          <>
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

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border/30" />
              <span className="text-[10px] text-muted-foreground font-serif">or</span>
              <div className="h-px flex-1 bg-border/30" />
            </div>
          </>
        )}

        {/* Flow B: Create new account — choose a first step, not a permanent identity */}
        {isCreateFlow && (
          <div className="space-y-3">
            <h2 className="text-sm font-serif text-foreground/80 text-center">
              {flowParam ? "How would you like to begin?" : "I'm new — create my account"}
            </h2>
            <p className="text-[10px] text-muted-foreground/60 font-serif text-center leading-relaxed">
              This is just your first step — you can always do both
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleCreateAccount("tend")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center group ${
                  suggestedStep === "tend"
                    ? "border-primary/50 bg-primary/10 ring-1 ring-primary/20"
                    : "border-border/50 hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                <TreePine className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-serif text-foreground">Tend the garden</span>
                <span className="text-[10px] text-muted-foreground font-serif">Plant & nurture trees</span>
              </button>
              <button
                onClick={() => handleCreateAccount("explore")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center group ${
                  suggestedStep === "explore"
                    ? "border-primary/50 bg-primary/10 ring-1 ring-primary/20"
                    : "border-border/50 hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                <Compass className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-serif text-foreground">Explore the roots</span>
                <span className="text-[10px] text-muted-foreground font-serif">Discover & wander</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Shared components ── */

function CenteredLoader({ text }: { text: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground font-serif">{text}</p>
      </div>
    </div>
  );
}

function ErrorState({
  title,
  message,
  botLink,
  showSignIn,
  onSignIn,
  extraAction,
}: {
  title: string;
  message: string;
  botLink: string | null;
  showSignIn?: boolean;
  onSignIn?: () => void;
  extraAction?: { label: string; onClick: () => void };
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
          {extraAction && (
            <Button variant="ghost" size="sm" onClick={extraAction.onClick} className="font-serif text-xs">
              {extraAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
