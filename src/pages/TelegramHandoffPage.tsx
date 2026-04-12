/**
 * TelegramHandoffPage — dedicated threshold page for Telegram-first entry.
 *
 * Validates the one-time handoff token and routes the user to either:
 *   A. Connect existing account (sign in → link Telegram)
 *   B. Create a new S33D account (with an optional first-step suggestion)
 *
 * Users are free to wander, tend, explore, and contribute in any way —
 * there are no permanent roles, only paths through the forest.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolveHandoffToken, type ResolvedHandoff } from "@/hooks/use-bot-handoff";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { TreePine, Compass, Loader2, AlertCircle, ArrowRight, ExternalLink, ShieldCheck, Map } from "lucide-react";
import { BOT_CONFIG } from "@/config/bot";
import { toast } from "sonner";
import { ROUTES } from "@/lib/routes";

type HandoffFlow = "connect" | "create" | "create_gardener" | "create_wanderer" | "login";
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

/** Compute the best post-auth destination from deep-link params */
function computeDestination(treeId: string | null, room: string | null): string {
  if (treeId) return `/map?tree=${treeId}`;
  if (room === "music" || room === "library") return ROUTES.LIBRARY;
  if (room === "council") return "/council";
  return ROUTES.HEARTH;
}

export default function TelegramHandoffPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useCurrentUser();
  const resolveAttempted = useRef(false);

  const token = searchParams.get("token");
  const flowParam = searchParams.get("flow") as HandoffFlow | null;
  const inviteParam = searchParams.get("invite");
  const treeParam = searchParams.get("tree");
  const roomParam = searchParams.get("room");

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
  // When resolved + login flow → auto-establish session
  useEffect(() => {
    if (state !== "resolved" || authLoading) return;

    // Login flow: auto-establish session (no user needed — the handoff IS the auth)
    if (flowParam === "login" && token && !user) {
      handleLoginViaToken();
      return;
    }

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

  // Login via Telegram — auto-establish session for already-linked accounts
  const handleLoginViaToken = useCallback(async () => {
    if (!token) return;
    setState("creating"); // reuse the "Preparing the forest…" loader

    try {
      const { data, error: invokeErr } = await supabase.functions.invoke("telegram-handoff", {
        body: { action: "login_via_telegram", token },
      });

      if (invokeErr || !data?.ok) {
        if (data?.error === "not_linked") {
          setError("This Telegram is not connected to any S33D account. Sign in with Google or email first, then link Telegram from your Hearth.");
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
        setError(data?.message || data?.error || "Login failed. Please try again.");
        setState("error");
        return;
      }

      if (data.access_token && data.refresh_token) {
        const { error: sessionErr } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (sessionErr) {
          console.warn("Telegram login session failed:", sessionErr);
          setError("Sign-in failed. Please try logging in with Google or email instead.");
          setState("error");
          return;
        }

        toast.success("Welcome back 🌿");
        navigate(computeDestination(treeParam, roomParam), { replace: true });
        return;
      }

      setError("Login could not complete. Please try signing in with Google or email.");
      setState("error");
    } catch {
      setError("Connection error. Please try again.");
      setState("error");
    }
  }, [token, navigate]);

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
          ? "Telegram already woven in"
          : "Your thread is now woven 🌿"
      );
      setState("success");
      setTimeout(() => navigate(computeDestination(treeParam, roomParam)), 2500);
    } catch {
      setError("Connection error. Please try again.");
      setState("error");
    }
  }, [token, navigate]);

  const handleCreateAccount = useCallback(async (step: "tend" | "explore") => {
    if (!token) return;
    setFirstStep(step);
    setState("creating");

    const identity_path = step === "tend" ? "gardener" : "wanderer";

    try {
      const { data, error: invokeErr } = await supabase.functions.invoke("telegram-handoff", {
        body: { action: "create_account", token, identity_path },
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
      // Compute return URL preserving all params
      const returnParams = new URLSearchParams({ token, flow: "connect" });
      if (inviteParam) returnParams.set("invite", inviteParam);
      if (treeParam) returnParams.set("tree", treeParam);
      if (roomParam) returnParams.set("room", roomParam);

      // Compute intent from context
      const resolvedIntent = treeParam ? "tree"
        : roomParam === "music" || roomParam === "library" ? "library"
        : roomParam === "council" ? "dashboard"
        : inviteParam ? "invite"
        : "dashboard";

      localStorage.setItem("s33d_bot_handoff", JSON.stringify({
        source: "telegram",
        bot: "teotag",
        handoffToken: token,
        intent: resolvedIntent,
        invite: inviteParam || null,
        gift: null,
        returnTo: `/telegram-handoff?${returnParams.toString()}`,
        campaign: null,
      }));

      // Also store invite code for onboarding flow
      if (inviteParam) {
        localStorage.setItem("s33d_invite_code", inviteParam);
      }
    }
    navigate(ROUTES.AUTH);
  }, [token, navigate, inviteParam, treeParam, roomParam]);

  const botLink = BOT_CONFIG.telegramBotLink("start");
  const telegramUsername = (handoff?.payload as any)?.telegram_username;

  const isLoginFlow = flowParam === "login";
  const isConnectFlow = flowParam === "connect";
  const isCreateFlow = !flowParam || flowParam === "create" || flowParam === "create_gardener" || flowParam === "create_wanderer";

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
        message="The link has expired. Ask TEOTAG in Telegram for a fresh path."
        botLink={botLink}
      />
    );
  }

  if (state === "invalid") {
    return (
      <ErrorState
        title="Path not found"
        message="This link isn't valid. Ask TEOTAG in Telegram for a fresh path."
        botLink={botLink}
      />
    );
  }

  if (state === "already_claimed") {
    return (
      <ErrorState
        title="Already walked"
        message="This link has already been used. Ask TEOTAG in Telegram for a new one."
        botLink={botLink}
        showSignIn
        onSignIn={() => navigate(ROUTES.AUTH)}
      />
    );
  }

  if (state === "linking" || state === "creating") {
    return <CenteredLoader text={state === "linking" ? "Weaving your thread…" : "Preparing the forest…"} />;
  }

  if (state === "confirm_link") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <ShieldCheck className="w-10 h-10 text-primary mx-auto" />
          <h1 className="text-xl font-serif text-foreground">Confirm Telegram Link</h1>
          <div className="space-y-2 p-4 rounded-xl border border-border/50 bg-card/50">
            <p className="text-xs text-muted-foreground font-serif">Connecting Telegram to:</p>
            <p className="text-sm font-serif text-foreground font-medium">
              {user?.email || "Your S33D account"}
            </p>
            {telegramUsername && (
              <>
                <div className="h-px bg-border/30 my-2" />
                <p className="text-xs text-muted-foreground font-serif">Telegram:</p>
                <p className="text-sm font-serif text-foreground">@{telegramUsername}</p>
              </>
            )}
          </div>
          <Button onClick={handleLinkAfterSignin} className="w-full gap-2 font-serif">
            Weave this thread
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
            Use a different account
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
          <h1 className="text-xl font-serif text-foreground">Your thread is woven</h1>
          <p className="text-sm text-muted-foreground font-serif leading-relaxed">
            Telegram and S33D are now woven together. TEOTAG will guide you from both places.
          </p>
          <p className="text-xs text-muted-foreground/60 font-serif">TEOTAG is opening the gate…</p>
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
            Your account is ready. Wander the roots, tend the garden, share what you find — all paths are open.
          </p>
          <Button
            onClick={() => navigate(computeDestination(treeParam, roomParam))}
            className="gap-2 font-serif"
          >
            Enter your hearth
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div className="flex justify-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(ROUTES.ADD_TREE)}
              className="text-xs text-muted-foreground font-serif gap-1"
            >
              <TreePine className="w-3 h-3" />
              Plant a tree
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(ROUTES.ATLAS)}
              className="text-xs text-muted-foreground font-serif gap-1"
            >
              <Map className="w-3 h-3" />
              Explore the atlas
            </Button>
          </div>
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

  // ── Main resolved state ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-sm w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="text-4xl">🌳</div>
          <h1 className="text-2xl font-serif text-foreground">
            TEOTAG brought you here
          </h1>
          <p className="text-sm text-muted-foreground font-serif leading-relaxed">
            Welcome to S33D — a living map of the world's most ancient trees, tended by people who walk among them.
          </p>
          {telegramUsername && (
            <p className="text-xs text-muted-foreground/60 font-serif">
              Arriving as <span className="text-foreground/80">@{telegramUsername}</span>
            </p>
          )}
        </div>

        {/* Flow A: Connect existing account */}
        {isConnectFlow && (
          <div className="space-y-3">
            <h2 className="text-sm font-serif text-foreground/80 text-center">
              Connect your existing account
            </h2>
            <Button
              onClick={handleSignInRedirect}
              variant="outline"
              className="w-full gap-2 font-serif h-12"
            >
              Sign in & weave Telegram
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Neutral divider when showing both flows */}
        {!flowParam && (
          <>
            <div className="space-y-3">
              <Button
                onClick={handleSignInRedirect}
                variant="outline"
                className="w-full gap-2 font-serif h-11"
              >
                I have an account — sign in
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border/30" />
              <span className="text-[10px] text-muted-foreground/50 font-serif">or begin fresh</span>
              <div className="h-px flex-1 bg-border/30" />
            </div>
          </>
        )}

        {/* Flow B: Create new account — two first-step suggestions, not identities */}
        {isCreateFlow && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground/60 font-serif text-center leading-relaxed">
              Choose a first step — you can always change direction
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleCreateAccount("tend")}
                className={`flex flex-col items-center gap-2.5 p-5 rounded-xl border transition-all text-center group ${
                  suggestedStep === "tend"
                    ? "border-primary/50 bg-primary/10 ring-1 ring-primary/20"
                    : "border-border/40 hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                <TreePine className="w-7 h-7 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-serif text-foreground">Begin by planting</span>
                <span className="text-[10px] text-muted-foreground/60 font-serif leading-relaxed">
                  Map a tree, share its story
                </span>
              </button>
              <button
                onClick={() => handleCreateAccount("explore")}
                className={`flex flex-col items-center gap-2.5 p-5 rounded-xl border transition-all text-center group ${
                  suggestedStep === "explore"
                    ? "border-primary/50 bg-primary/10 ring-1 ring-primary/20"
                    : "border-border/40 hover:border-primary/30 hover:bg-primary/5"
                }`}
              >
                <Compass className="w-7 h-7 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-serif text-foreground">Begin by exploring</span>
                <span className="text-[10px] text-muted-foreground/60 font-serif leading-relaxed">
                  Discover ancient trees nearby
                </span>
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
                Return to TEOTAG
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
