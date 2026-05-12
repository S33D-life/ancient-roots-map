import { useState, useEffect, useRef, useCallback } from "react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TreePine, Wallet, Wand2, Mail, ArrowLeft, Eye, EyeOff, CheckCircle2, KeyRound, Gift, Sparkles, RefreshCw, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { z } from "zod";
import WalletConnect from "@/components/WalletConnect";
import teotagLogo from "@/assets/teotag-small.webp";
import { recordReferral } from "@/hooks/use-referrals";
import { getStoredHandoff, clearStoredHandoff, intentToPath, claimHandoffToken } from "@/hooks/use-bot-handoff";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import TelegramLoginButton from "@/components/auth/TelegramLoginButton";
import InviteBloomFailure from "@/components/auth/InviteBloomFailure";
import InviteExpiryHint from "@/components/auth/InviteExpiryHint";
import { trackInviteEvent } from "@/lib/invite-analytics";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

type AuthView = "login" | "signup" | "forgot" | "magic-sent" | "reset-sent" | "verify-email" | "reset-password" | "reset-success";

// Persisted across reloads so the verify-email screen can rebuild after refresh.
const PENDING_EMAIL_KEY = "s33d_pending_verify_email";
const UNVERIFIED_EMAIL_KEY = "s33d_unverified_email";
const UNVERIFIED_MODAL_KEY = "s33d_unverified_modal_open";

const readPendingEmail = (): string => {
  try {
    return localStorage.getItem(PENDING_EMAIL_KEY) || sessionStorage.getItem(PENDING_EMAIL_KEY) || "";
  } catch { return ""; }
};
const writePendingEmail = (addr: string) => {
  try {
    localStorage.setItem(PENDING_EMAIL_KEY, addr);
    sessionStorage.setItem(PENDING_EMAIL_KEY, addr);
  } catch {}
};
const clearPendingEmail = () => {
  try {
    localStorage.removeItem(PENDING_EMAIL_KEY);
    sessionStorage.removeItem(PENDING_EMAIL_KEY);
  } catch {}
};

// Persisted "this email exists but isn't verified" state. Survives refresh so the
// resend flow and modal still target the right address after the page reloads.
const readUnverifiedEmail = (): string => {
  try {
    return localStorage.getItem(UNVERIFIED_EMAIL_KEY) || sessionStorage.getItem(UNVERIFIED_EMAIL_KEY) || "";
  } catch { return ""; }
};
const writeUnverifiedEmail = (addr: string) => {
  try {
    localStorage.setItem(UNVERIFIED_EMAIL_KEY, addr);
    sessionStorage.setItem(UNVERIFIED_EMAIL_KEY, addr);
  } catch {}
};
const clearUnverifiedEmail = () => {
  try {
    localStorage.removeItem(UNVERIFIED_EMAIL_KEY);
    sessionStorage.removeItem(UNVERIFIED_EMAIL_KEY);
    sessionStorage.removeItem(UNVERIFIED_MODAL_KEY);
  } catch {}
};
const readUnverifiedModalOpen = (): boolean => {
  try { return sessionStorage.getItem(UNVERIFIED_MODAL_KEY) === "1"; } catch { return false; }
};
const writeUnverifiedModalOpen = (open: boolean) => {
  try {
    if (open) sessionStorage.setItem(UNVERIFIED_MODAL_KEY, "1");
    else sessionStorage.removeItem(UNVERIFIED_MODAL_KEY);
  } catch {}
};

// Dev-only logger — never logs passwords or tokens.
const isDev = (() => { try { return Boolean((import.meta as any)?.env?.DEV); } catch { return false; } })();
const authLog = (...args: unknown[]) => { if (isDev) console.log("[auth]", ...args); };

// Detect recovery from URL hash OR query params before first render
// This must run synchronously before any auth listener fires
const detectRecoveryFromHash = (): AuthView => {
  const hash = window.location.hash;
  const search = window.location.search;
  if (hash.includes("type=recovery") || search.includes("type=recovery")) return "reset-password";
  return "login";
};

// Persistent flag: once we detect recovery, keep it until the flow completes.
// This survives the Supabase SDK consuming the hash fragment.
let _recoveryDetected = detectRecoveryFromHash() === "reset-password";
if (_recoveryDetected) {
  sessionStorage.setItem("s33d_recovery_active", "1");
} else if (sessionStorage.getItem("s33d_recovery_active") === "1") {
  _recoveryDetected = true;
}

const AuthPage = () => {
  useDocumentTitle("Sign In");
  // Also detect if we landed on /reset-password directly
  const isResetRoute = window.location.pathname === "/reset-password";
  if (isResetRoute && !_recoveryDetected) {
    _recoveryDetected = true;
    sessionStorage.setItem("s33d_recovery_active", "1");
  }
  // If we have a pending email and we're not in recovery, prefer the verification waiting screen.
  const _pendingOnLoad = readPendingEmail();
  const _initialView: AuthView = _recoveryDetected
    ? "reset-password"
    : _pendingOnLoad
      ? "verify-email"
      : "login";

  const [view, setView] = useState<AuthView>(_initialView);
  const [email, setEmail] = useState(_pendingOnLoad);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; confirm?: string; newPassword?: string; confirmNew?: string }>({});
  const [oauthError, setOauthError] = useState<string | null>(null);
  const _persistedUnverified = readUnverifiedEmail();
  const [unverifiedModalOpen, setUnverifiedModalOpen] = useState(
    () => readUnverifiedModalOpen() && !!_persistedUnverified,
  );
  const [unverifiedEmail, setUnverifiedEmail] = useState<string>(_persistedUnverified || _pendingOnLoad);
  const [resending, setResending] = useState(false);
  const [resendCooldownUntil, setResendCooldownUntil] = useState<number>(0);
  const [resendNote, setResendNote] = useState<string | null>(null);
  const [verifyChecking, setVerifyChecking] = useState(false);
  const [tickNow, setTickNow] = useState(() => Date.now());
  const [inviteCode, setInviteCode] = useState("");
  const [inviteBloomFailure, setInviteBloomFailure] = useState<string | null>(null);
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const resolvePostAuthPath = useCallback(() => {
    // Check bot handoff first — it may carry a destination
    const handoff = getStoredHandoff();
    if (handoff?.intent || handoff?.returnTo) {
      return intentToPath(handoff.intent, handoff.returnTo);
    }

    const rawReturnTo = searchParams.get("returnTo");
    if (!rawReturnTo) return "/atlas";

    try {
      const decoded = decodeURIComponent(rawReturnTo);
      const targetUrl = new URL(decoded, window.location.origin);
      const path = `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
      const isSameOrigin = targetUrl.origin === window.location.origin;
      const isInternalPath = path.startsWith("/") && !path.startsWith("//");
      const isBlockedPath = targetUrl.pathname.startsWith("/auth") || targetUrl.pathname.startsWith("/~oauth");

      if (isSameOrigin && isInternalPath && !isBlockedPath) {
        return path;
      }
    } catch {
      const isInternalPath = rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//");
      const isBlockedPath = rawReturnTo.startsWith("/auth") || rawReturnTo.startsWith("/~oauth");
      if (isInternalPath && !isBlockedPath) return rawReturnTo;
    }

    return "/atlas";
  }, [searchParams]);

  const getGoogleErrorMessage = (message?: string) => {
    const raw = message ?? "";
    const lower = raw.toLowerCase();

    if (lower.includes("redirect_uri_mismatch")) {
      return "Google redirect URL mismatch. Add https://www.s33d.life/** and https://s33d.life/** to redirect URLs and whitelist this app callback in Google OAuth.";
    }
    if (lower.includes("unauthorized_client") || lower.includes("invalid_client")) {
      return "Google OAuth client is not authorized for this app. Re-check client ID/secret and allowed redirect URIs.";
    }
    if (lower.includes("pkce")) {
      return "Secure login handshake failed (PKCE). Try again in a fresh tab; if it persists, clear site data and retry.";
    }

    return raw || "Google sign-in could not complete. Check OAuth redirect settings and try again.";
  };

  // Pre-fill invite code from URL, also capture gift param and bot handoff.
  // CRITICAL: persist invite code to BOTH localStorage and sessionStorage as soon
  // as we see it, so it survives OAuth (Google/Apple) redirects, Safari app
  // switching, page reloads, and any redirect chain that drops query params.
  // We do NOT consume the invite here — only the post-signup auth listener does.
  useEffect(() => {
    const code = searchParams.get("invite");
    const giftCode = searchParams.get("gift");
    const source = searchParams.get("source");

    // Fire link_opened once per arrival when the URL carries an invite param.
    if (code) {
      void trackInviteEvent("invite_link_opened", { code, source: "url" });
    }

    // Recover an invite code persisted from a previous arrival (e.g. survived
    // an OAuth roundtrip that stripped the URL param).
    let effectiveCode = code;
    let detectedSource: "url" | "storage" | "oauth_return" = code ? "url" : "storage";
    if (!effectiveCode) {
      try {
        effectiveCode =
          sessionStorage.getItem("s33d_pending_invite_code") ||
          localStorage.getItem("s33d_pending_invite_code");
        // If sessionStorage was wiped but localStorage survived, this is
        // almost certainly an OAuth round-trip.
        if (effectiveCode && !sessionStorage.getItem("s33d_pending_invite_code")) {
          detectedSource = "oauth_return";
        }
      } catch {}
    }

    if (effectiveCode) {
      console.log("[invite] token detected", { source: detectedSource });
      void trackInviteEvent("invite_code_detected", {
        code: effectiveCode,
        source: detectedSource,
      });
      setInviteCode(effectiveCode);
      setView("signup");
      try {
        sessionStorage.setItem("s33d_pending_invite_code", effectiveCode);
        localStorage.setItem("s33d_pending_invite_code", effectiveCode);
      } catch {}
    }
    if (giftCode) {
      localStorage.setItem("s33d_gift_code", giftCode);
      setView("signup");
    }
    // Bot handoff: if arriving from Telegram/OpenClaw, store context
    if (source) {
      const handoffGift = searchParams.get("gift");
      if (handoffGift) localStorage.setItem("s33d_gift_code", handoffGift);
      setView("signup");
    }
  }, [searchParams]);

  // Use a ref for view to avoid re-subscribing on every view change
  const viewRef = useRef(view);
  useEffect(() => { viewRef.current = view; }, [view]);

  // Tick once a second while the resend button is in cooldown so the countdown rerenders.
  useEffect(() => {
    if (resendCooldownUntil <= Date.now()) return;
    const id = window.setInterval(() => setTickNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [resendCooldownUntil, tickNow]);

  // Auto-redirect once the email is confirmed.
  // Supabase syncs sessions across tabs via storage events (so onAuthStateChange
  // fires automatically when the user clicks the link in another tab), but we
  // also poll as a safety net for browsers / webviews where storage events
  // are flaky (Safari private mode, some in-app browsers, BFCache restores).
  // We additionally re-check on tab focus.
  useEffect(() => {
    if (view !== "verify-email") return;

    let cancelled = false;
    const check = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          authLog("verify-email poll detected session — redirecting");
          // onAuthStateChange will handle the warm toast + cleanup;
          // we still navigate here to cover the case where the listener
          // fires before this view mounts.
          clearPendingEmail();
          navigate(resolvePostAuthPath(), { replace: true });
        }
      } catch (e) {
        authLog("verify-email poll error", e);
      }
    };

    // Run once on entry, then every 4s.
    void check();
    const id = window.setInterval(check, 4000);

    const onFocus = () => { void check(); };
    const onVisibility = () => { if (document.visibilityState === "visible") void check(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [view, navigate, resolvePostAuthPath]);


  // Helper: is the current flow a password recovery flow?
  const isRecoveryFlow = () =>
    viewRef.current === "reset-password" || viewRef.current === "reset-success" ||
    sessionStorage.getItem("s33d_recovery_active") === "1";

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      authLog("event", event, "hasSession:", !!session);

      // Handle password recovery redirect — show reset form instead of navigating away
      if (event === "PASSWORD_RECOVERY") {
        sessionStorage.setItem("s33d_recovery_active", "1");
        setView("reset-password");
        return;
      }

      // Handle session expiry gracefully
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        sessionStorage.removeItem("s33d_recovery_active");
        setView("login");
        return;
      }

      // Block all navigation when in recovery flow — user must complete password reset first
      if (isRecoveryFlow()) return;

      if (session) {
        // Verification round-trip success: warm welcome and clean up the pending email.
        const wasPending = !!readPendingEmail();
        if (event === "SIGNED_IN" && wasPending) {
          authLog("verification round-trip complete", { userEmail: session.user?.email });
          toast({ title: "Email confirmed — welcome to the grove 🌱", description: "You're signed in." });
        }
        clearPendingEmail();
        // Consume invitation on first sign-in (assigns lineage + decrements inviter).
        // Read from BOTH legacy and new persistence keys so any prior session can
        // still complete its consumption. We only mark the invite "used" AFTER
        // we have a real authenticated session — never on page load.
        const storedCode =
          localStorage.getItem("s33d_invite_code") ||
          localStorage.getItem("s33d_pending_invite_code") ||
          sessionStorage.getItem("s33d_pending_invite_code");
        if (storedCode && session.user) {
          console.log("[invite] consuming after auth success", { userId: session.user.id });
          const { data: consumeResult, error: consumeError } = await supabase.rpc(
            "consume_invitation",
            { p_invite_code: storedCode, p_new_user_id: session.user.id },
          );
          console.log("[invite] consume result", { consumeResult, consumeError });
          const consumeOk = !!consumeResult && !(consumeResult as any)?.error && !consumeError;
          if (consumeOk) {
            void trackInviteEvent("invite_consumed", {
              code: storedCode,
              source: "system",
              userId: session.user.id,
            });
          } else {
            void trackInviteEvent("invite_consume_failed", {
              code: storedCode,
              source: "system",
              userId: session.user.id,
              metadata: {
                error: consumeError?.message ?? (consumeResult as any)?.error ?? "unknown",
              },
            });
            await recordReferral(session.user.id, storedCode);
          }
          localStorage.removeItem("s33d_invite_code");
          localStorage.removeItem("s33d_pending_invite_code");
          sessionStorage.removeItem("s33d_pending_invite_code");
        }

        // Auto-claim gift seed if arriving via gift link
        const giftCode = localStorage.getItem("s33d_gift_code");
        if (giftCode && session.user) {
          try {
            const { data: gift } = await supabase
              .from("gift_seeds")
              .select("id, seeds_count, sender_id")
              .eq("invite_code", giftCode)
              .is("recipient_id", null)
              .is("activated_at", null)
              .maybeSingle();

            if (gift) {
              await supabase.rpc("claim_gift_seed", {
                p_invite_code: giftCode,
                p_user_id: session.user.id,
              });
            }
          } catch (e) {
            console.error("Gift seed claim error:", e);
          }
          localStorage.removeItem("s33d_gift_code");
        }

        // Save pending tree if one was captured before auth
        const pendingTreeJson = localStorage.getItem("s33d_pending_tree");
        if (pendingTreeJson && session.user) {
          try {
            const pendingTree = JSON.parse(pendingTreeJson);
            // Extract offline-only fields before inserting
            const photoBase64 = pendingTree._photoBase64 as string | undefined;
            const savedPhotoDate = pendingTree._photoDate as string | undefined;
            delete pendingTree._photoBase64;
            delete pendingTree._photoDate;

            // Strip species_ai_* fields that don't exist in the DB schema yet
            delete pendingTree.species_ai_predictions;
            delete pendingTree.species_ai_selected;
            delete pendingTree.species_ai_provider;
            delete pendingTree.species_ai_confidence;
            delete pendingTree.species_ai_confirmed;

            const { data: treeData, error } = await supabase.from("trees").insert({
              ...pendingTree,
              created_by: session.user.id,
              photo_status: photoBase64 ? 'pending' : 'none',
            }).select('id').single();

            if (!error && treeData) {
              localStorage.removeItem("s33d_pending_tree");
              toast({ title: "Tree planted! 🌳", description: `${pendingTree.name} has been saved to the Atlas` });

              // Upload the preserved photo as first offering (best-effort)
              if (photoBase64) {
                try {
                  const blob = await fetch(photoBase64).then(r => r.blob());
                  const filePath = `${session.user.id}/${treeData.id}/photo-${Date.now()}.jpeg`;
                  const { data: uploadData } = await supabase.storage
                    .from("offerings")
                    .upload(filePath, blob, { contentType: "image/jpeg" });
                  if (uploadData) {
                    const { data: urlData } = supabase.storage
                      .from("offerings")
                      .getPublicUrl(uploadData.path);
                    await supabase.from("offerings").insert({
                      tree_id: treeData.id,
                      title: "First encounter",
                      type: "photo",
                      media_url: urlData.publicUrl,
                      created_by: session.user.id,
                      visibility: "public",
                      ...(savedPhotoDate ? { created_at: savedPhotoDate } : {}),
                    } as any);
                  }
                } catch (photoErr) {
                  console.warn("Photo upload after auth failed (tree was saved):", photoErr);
                  toast({ title: "Photo upload skipped", description: "Your tree was saved but the photo could not be uploaded. You can add it later.", variant: "destructive" });
                }
              }
            } else if (error) {
              console.error("Failed to save pending tree:", error);
            }
          } catch (e) {
            console.error("Failed to save pending tree:", e);
          }
        }

        // Claim bot handoff via RPC if present
        const botHandoff = getStoredHandoff();
        if (botHandoff?.handoffToken && session.user) {
          try {
            await claimHandoffToken(botHandoff.handoffToken);
          } catch (e) {
            console.warn("Bot handoff claim failed:", e);
          }
          // Don't clear yet — BotContinuationBanner may still need it
        }

        navigate(resolvePostAuthPath(), { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      // Don't redirect if user arrived via recovery link — they need to reset password first
      if (isRecoveryFlow()) return;
      if (session) {
        navigate(resolvePostAuthPath(), { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast, resolvePostAuthPath]);

  const clearErrors = () => setFieldErrors({});

  const validate = (mode: "login" | "signup" | "forgot") => {
    const errors: typeof fieldErrors = {};
    try { emailSchema.parse(email); } catch { errors.email = "Please enter a valid email"; }

    if (mode !== "forgot") {
      try { passwordSchema.parse(password); } catch { errors.password = "At least 6 characters required"; }
    }

    if (mode === "signup" && password !== confirmPassword) {
      errors.confirm = "Passwords don't match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate("login")) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please try again.");
        }
        if (error.message.includes("Email not confirmed")) {
          // Soft modal flow instead of red inline error.
          setUnverifiedEmail(email);
          setUnverifiedModalOpen(true);
          return;
        }
        if (error.message.includes("rate") || error.status === 429) {
          throw new Error("Too many attempts. Please wait a moment before trying again.");
        }
        throw error;
      }
      toast({ title: "Welcome back!", description: "You've entered the grove" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setFieldErrors(prev => ({ ...prev, password: msg }));
      toast({ title: "Login failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async (target?: string) => {
    const addr = (target ?? unverifiedEmail ?? email).trim();
    if (!addr) {
      toast({ title: "Enter your email first", description: "We need an email to resend the link." });
      return;
    }
    if (Date.now() < resendCooldownUntil) {
      const sec = Math.ceil((resendCooldownUntil - Date.now()) / 1000);
      setResendNote(`Please wait ${sec}s before requesting another email.`);
      return;
    }
    setResending(true);
    setResendNote(null);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: addr,
        options: { emailRedirectTo: `${window.location.origin}/welcome` },
      });
      if (error) throw error;
      writePendingEmail(addr);
      authLog("resend ok", { addr });
      setResendCooldownUntil(Date.now() + 30_000);
      setResendNote("Sent! Check your inbox (and Junk / Spam / Promotions).");
      toast({ title: "Verification email sent 🌱", description: `Sent to ${addr}.` });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Could not resend verification email";
      const isRate = /rate|too many|429/i.test(raw);
      if (isRate) {
        setResendCooldownUntil(Date.now() + 60_000);
        setResendNote("Email service is throttling — please wait a minute and try again.");
      } else {
        setResendNote(raw);
      }
      authLog("resend error", { isRate, raw });
      toast({ title: "Could not resend", description: raw, variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  // "I've verified — continue" button. Try silent sign-in if we still have the password,
  // otherwise drop the user back at the login form with a friendly nudge.
  const handleContinueAfterVerification = async () => {
    const addr = (unverifiedEmail || email || readPendingEmail()).trim();
    authLog("continue-after-verify clicked", { hasPassword: !!password, addr });
    setVerifyChecking(true);
    try {
      // 1. If a session already exists (verification link opened in another tab), go straight in.
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        authLog("continue-after-verify: session found, navigating");
        clearPendingEmail();
        navigate(resolvePostAuthPath(), { replace: true });
        return;
      }

      // 2. Check the user's confirmation status without signing in.
      // getUser() returns null when there's no session, so we rely on a silent sign-in attempt
      // when we still have the password in memory.
      if (addr && password) {
        const { error } = await supabase.auth.signInWithPassword({ email: addr, password });
        if (!error) {
          // onAuthStateChange will fire SIGNED_IN and route the user.
          return;
        }
        if (/Email not confirmed/i.test(error.message)) {
          setResendNote("Still waiting for confirmation — please open the link in your email first.");
          return;
        }
        authLog("silent sign-in failed", error.message);
      }

      // 3. Fallback: send the user to the login form with a friendly nudge.
      setEmail(addr);
      setView("login");
      clearErrors();
      toast({ title: "Great — please sign in to enter the grove." });
    } finally {
      setVerifyChecking(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate("signup")) return;

    // Require a valid invite code to sign up
    const code = inviteCode.trim();
    if (!code) {
      // Use the same soft Heartwood warning rather than a harsh red toast.
      setInviteBloomFailure("No invitation code entered yet.");
      return;
    }

    setInviteBloomFailure(null);
    setIsLoading(true);
    try {
      // Pre-validate via SECURITY DEFINER RPC. The invite_links table has RLS
      // restricting SELECT to the invite creator, so anonymous signup flows
      // CANNOT read the row directly — that's why fresh invites used to look
      // "already used or invalid". The RPC bypasses RLS safely.
      console.log("[invite] validating", { code });
      const { data: validation, error: validationError } = await supabase.rpc(
        "validate_invite_code",
        { p_code: code },
      );
      console.log("[invite] validation response", { validation, validationError });

      const validRow = Array.isArray(validation) ? validation[0] : validation;
      if (validationError || !validRow?.id) {
        void trackInviteEvent("invite_validation_failed", {
          code,
          source: "manual",
          metadata: { error: validationError?.message ?? "no_row" },
        });
        setInviteExpiresAt(null);
        throw new Error("INVITE_BLOOM_FAILED");
      }

      // Surface a soft expiry hint when the backend reports one.
      setInviteExpiresAt((validRow as any)?.expires_at ?? null);
      void trackInviteEvent("invite_validation_success", {
        code,
        source: "manual",
        metadata: { expires_at: (validRow as any)?.expires_at ?? null },
      });

      // Persist the code BEFORE attempting signup so it survives any redirect,
      // OAuth roundtrip, email-verification roundtrip, or Safari app switch.
      try {
        localStorage.setItem("s33d_invite_code", code);
        localStorage.setItem("s33d_pending_invite_code", code);
        sessionStorage.setItem("s33d_pending_invite_code", code);
      } catch {}

      void trackInviteEvent("invite_signup_started", { code, source: "manual" });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/welcome` },
      });
      if (error) {
        if (error.message.includes("User already registered")) {
          throw new Error("An account with this email already exists. Try logging in.");
        }
        throw error;
      }
      console.log("[invite] signup success — code will be consumed on first session", {
        userId: data.user?.id,
      });
      void trackInviteEvent("invite_signup_success", {
        code,
        source: "manual",
        userId: data.user?.id ?? null,
      });
      writePendingEmail(email);
      setUnverifiedEmail(email);
      authLog("signup ok → verify-email", { email });
      setView("verify-email");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not create account";
      if (msg === "INVITE_BLOOM_FAILED") {
        // Soft Heartwood inline state — no destructive red toast.
        setInviteBloomFailure(`code: ${code}`);
      } else {
        // Other signup errors stay as toasts but use a calmer default variant.
        toast({ title: "Sign up could not complete", description: msg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate("forgot")) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setView("reset-sent");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send reset email";
      toast({ title: "Reset failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    try { emailSchema.parse(email); } catch {
      setFieldErrors({ email: "Enter your email first" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/welcome` },
      });
      if (error) throw error;
      setView("magic-sent");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send magic link";
      toast({ title: "Magic link failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setOauthError(null);

    try {
      const redirectPath = resolvePostAuthPath();
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}${redirectPath}`,
      });

      // If redirected, the page will navigate away — don't reset loading
      if (result?.redirected) return;

      if (result?.error) {
        const msg = getGoogleErrorMessage(result.error.message);
        setOauthError(msg);
        toast({ title: "Google login failed", description: msg, variant: "destructive" });
      }
    } catch (err) {
      const msg = getGoogleErrorMessage(err instanceof Error ? err.message : "Google sign-in unavailable");
      setOauthError(msg);
      toast({ title: "Google login failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof fieldErrors = {};
    try { passwordSchema.parse(newPassword); } catch { errors.newPassword = "At least 6 characters required"; }
    if (newPassword !== confirmNewPassword) errors.confirmNew = "Passwords don't match";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      // Clear recovery flag — flow is complete
      sessionStorage.removeItem("s33d_recovery_active");
      setView("reset-success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not update password";
      toast({ title: "Update failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password screen
  if (view === "reset-password") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="w-full max-w-sm">
          <div className="bg-card/80 backdrop-blur border border-border rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                <KeyRound className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-serif">Set New Password</h2>
              <p className="text-muted-foreground text-sm">Choose a new password for your grove account.</p>
            </div>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-xs uppercase tracking-wider text-muted-foreground">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    name="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); if (fieldErrors.newPassword) setFieldErrors(p => ({ ...p, newPassword: undefined })); }}
                    disabled={isLoading}
                    className={`pr-10 ${fieldErrors.newPassword ? "border-destructive" : ""}`}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.newPassword && <p className="text-xs text-destructive">{fieldErrors.newPassword}</p>}
                <PasswordStrengthMeter password={newPassword} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-new-password" className="text-xs uppercase tracking-wider text-muted-foreground">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
                  name="confirm-new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => { setConfirmNewPassword(e.target.value); if (fieldErrors.confirmNew) setFieldErrors(p => ({ ...p, confirmNew: undefined })); }}
                  disabled={isLoading}
                  className={fieldErrors.confirmNew ? "border-destructive" : ""}
                  autoComplete="new-password"
                />
                {fieldErrors.confirmNew && <p className="text-xs text-destructive">{fieldErrors.confirmNew}</p>}
              </div>
              <Button type="submit" className="w-full font-serif" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : "Update Password"}
              </Button>
            </form>
            <button onClick={() => { sessionStorage.removeItem("s33d_recovery_active"); setView("forgot"); }} className="text-xs text-muted-foreground hover:text-primary text-center w-full transition-colors">
              Link expired? Request a new one
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Password reset success screen
  if (view === "reset-success") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="w-full max-w-sm">
          <div className="bg-card/80 backdrop-blur border border-border rounded-2xl p-6 md:p-8 shadow-xl space-y-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-serif">Password Updated 🌿</h2>
            <p className="text-sm text-muted-foreground">Your password has been changed successfully. You're all set.</p>
            <Button onClick={() => navigate("/dashboard")} className="w-full font-serif">
              Enter the Grove
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Dedicated verification waiting screen — feels like progress, not failure.
  if (view === "verify-email") {
    const openMail = () => {
      // mailto: with no recipient opens the default mail app on most mobile OSes.
      window.location.href = "mailto:";
    };
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="w-full max-w-sm">
          <div
            className="rounded-2xl p-6 md:p-8 shadow-xl space-y-5 text-center border"
            style={{
              background: "linear-gradient(160deg, hsl(var(--primary) / 0.08), hsl(var(--card) / 0.95))",
              borderColor: "hsl(var(--primary) / 0.35)",
            }}
          >
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
              style={{
                background: "hsl(var(--primary) / 0.15)",
                border: "1px solid hsl(var(--primary) / 0.4)",
                boxShadow: "0 0 24px hsl(var(--primary) / 0.25)",
              }}
            >
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-serif">🌱 Your account has been created</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We've sent a confirmation email to{" "}
                <span className="text-foreground font-medium">{email || readPendingEmail() || "your inbox"}</span>.
                <br />
                Please open the link in the email to enter the grove.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                onClick={handleContinueAfterVerification}
                disabled={verifyChecking}
                className="w-full font-serif gap-2"
                aria-label="I have verified my email — continue to sign in"
              >
                {verifyChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                I've verified — continue
              </Button>
              <Button
                variant="outline"
                onClick={openMail}
                className="w-full font-serif gap-2"
                aria-label="Open the Mail app on your device"
              >
                <Mail className="w-4 h-4" /> Open Mail App
              </Button>
              {(() => {
                const remaining = Math.max(0, Math.ceil((resendCooldownUntil - tickNow) / 1000));
                const cooling = remaining > 0;
                return (
                  <Button
                    variant="outline"
                    onClick={() => handleResendVerification(email || unverifiedEmail)}
                    disabled={resending || cooling}
                    className="w-full font-serif gap-2"
                    aria-label="Resend the verification email"
                  >
                    {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {cooling ? `Resend available in ${remaining}s` : "Resend Verification Email"}
                  </Button>
                );
              })()}
              <Button
                variant="ghost"
                onClick={() => { clearPendingEmail(); setView("signup"); clearErrors(); }}
                className="w-full font-serif gap-2"
                aria-label="Change the email address used for signup"
              >
                <Pencil className="w-4 h-4" /> Change Email Address
              </Button>
              <button
                onClick={() => { setView("login"); clearErrors(); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full pt-1"
              >
                ← Back to Login
              </button>
            </div>

            {resendNote && (
              <p
                role="status"
                aria-live="polite"
                className="text-xs leading-relaxed text-foreground/80 px-2"
              >
                {resendNote}
              </p>
            )}

            <p
              className="text-[11px] leading-relaxed pt-2 border-t"
              style={{
                color: "hsl(var(--muted-foreground))",
                borderColor: "hsl(var(--primary) / 0.15)",
              }}
            >
              Emails sometimes land in <span className="font-medium">Junk</span>,{" "}
              <span className="font-medium">Spam</span>, or{" "}
              <span className="font-medium">Promotions</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Magic link / reset email confirmation screens
  if (view === "magic-sent" || view === "reset-sent") {
    const configs = {
      "magic-sent": {
        icon: <Wand2 className="w-8 h-8 text-primary" />,
        title: "Magic link sent!",
        desc: `Check ${email} for a login link. It will take you straight to your dashboard.`,
        action: "Back to Login",
      },
      "reset-sent": {
        icon: <KeyRound className="w-8 h-8 text-primary" />,
        title: "Reset email sent",
        desc: `We've sent password reset instructions to ${email}. Check your inbox.`,
        action: "Back to Login",
      },
    };
    const c = configs[view];

    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            {c.icon}
          </div>
          <div>
            <h1 className="text-2xl font-serif mb-2">{c.title}</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">{c.desc}</p>
          </div>
          <Button variant="outline" className="w-full" onClick={() => { setView("login"); clearErrors(); }}>
            {c.action}
          </Button>
        </div>
      </div>
    );
  }

  const isSignup = view === "signup";
  const isForgot = view === "forgot";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden md:flex md:w-2/5 lg:w-1/3 flex-col items-center justify-center p-10 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--background) / 0.8))' }} />
        <div className="relative z-10 text-center space-y-6">
          <img src={teotagLogo} alt="S33D" className="w-24 h-24 rounded-full mx-auto border-2 border-primary/40 glow-subtle" />
          <h2 className="text-3xl font-serif tracking-wider">S33D.life</h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
            Map ancient trees, share stories, and earn S33D Hearts for your contributions.
          </p>
          <div className="flex justify-center gap-6 pt-4">
            <div className="text-center">
              <CheckCircle2 className="w-5 h-5 text-primary mx-auto mb-1" />
              <span className="text-xs text-muted-foreground">Map Trees</span>
            </div>
            <div className="text-center">
              <CheckCircle2 className="w-5 h-5 text-primary mx-auto mb-1" />
              <span className="text-xs text-muted-foreground">Earn Staffs</span>
            </div>
            <div className="text-center">
              <CheckCircle2 className="w-5 h-5 text-primary mx-auto mb-1" />
              <span className="text-xs text-muted-foreground">Join Community</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-0">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="md:hidden text-center mb-8">
            <img src={teotagLogo} alt="S33D" className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-primary/40" />
            <h1 className="text-2xl font-serif">S33D.life</h1>
          </div>

          <div className="bg-card/80 backdrop-blur border border-border rounded-2xl p-6 md:p-8 shadow-xl">
            {/* Header with back arrow for sub-views */}
            <div className="mb-6">
              {isForgot ? (
                <div className="flex items-center gap-3 mb-2">
                  <button onClick={() => { setView("login"); clearErrors(); }} className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-serif">Reset Password</h2>
                </div>
              ) : (
                <>
                  {/* Login / Sign Up tabs */}
                  <div className="flex rounded-xl bg-secondary/50 p-1 mb-4">
                    <button
                      onClick={() => { setView("login"); clearErrors(); }}
                      className={`flex-1 py-2 text-sm font-serif rounded-lg transition-all ${
                        !isSignup ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Login
                    </button>
                    <button
                      onClick={() => { setView("signup"); clearErrors(); }}
                      className={`flex-1 py-2 text-sm font-serif rounded-lg transition-all ${
                        isSignup ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {isSignup ? "Join through an invitation" : "Welcome back, tree guardian"}
                  </p>
                </>
              )}
              {isForgot && (
                <p className="text-muted-foreground text-sm mt-1">Enter your email and we'll send reset instructions.</p>
              )}
            </div>

            {/* Form */}
            <form onSubmit={isForgot ? handleForgotPassword : isSignup ? handleSignup : handleLogin} method="post" action="/auth" className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  placeholder="grove.keeper@s33d.life"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: undefined })); }}
                  disabled={isLoading}
                  className={fieldErrors.email ? "border-destructive" : ""}
                  autoComplete={isSignup ? "email" : "username"}
                />
                {fieldErrors.email && <p className="text-xs text-destructive" role="alert">{fieldErrors.email}</p>}
              </div>

              {!isForgot && (
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(p => ({ ...p, password: undefined })); }}
                      disabled={isLoading}
                      className={`pr-10 ${fieldErrors.password ? "border-destructive" : ""}`}
                      autoComplete={isSignup ? "new-password" : "current-password"}
                      aria-invalid={!!fieldErrors.password}
                      aria-describedby={fieldErrors.password ? "password-error" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {isSignup && <PasswordStrengthMeter password={password} />}
                  {fieldErrors.password && <p id="password-error" className="text-xs text-destructive" role="alert">{fieldErrors.password}</p>}
                </div>
              )}

              {isSignup && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-xs uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    name="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); if (fieldErrors.confirm) setFieldErrors(p => ({ ...p, confirm: undefined })); }}
                    disabled={isLoading}
                    className={fieldErrors.confirm ? "border-destructive" : ""}
                    autoComplete="new-password"
                  />
                  {fieldErrors.confirm && <p className="text-xs text-destructive" role="alert">{fieldErrors.confirm}</p>}
                </div>
               )}

              {isSignup && (
                <div className="space-y-1.5">
                  <Label htmlFor="invite-code" className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Gift className="w-3 h-3" /> Invitation Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="invite-code"
                    type="text"
                    placeholder="Enter your invitation code"
                    value={inviteCode}
                    onChange={(e) => { setInviteCode(e.target.value); if (inviteBloomFailure) setInviteBloomFailure(null); }}
                    disabled={isLoading}
                    className="font-mono text-sm"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground/60 font-serif">
                    S33D is invitation-only. Ask a wanderer for an invite link to join.
                  </p>
                  {inviteExpiresAt && !inviteBloomFailure && (
                    <div className="pt-1">
                      <InviteExpiryHint expiresAt={inviteExpiresAt} />
                    </div>
                  )}
                  {inviteBloomFailure && (
                    <div className="pt-2">
                      <InviteBloomFailure
                        reason={inviteBloomFailure}
                        onRetry={() => {
                          setInviteBloomFailure(null);
                          // Trigger a fresh validation pass with the current code.
                          handleSignup(new Event("submit") as unknown as React.FormEvent);
                        }}
                        onRequestFresh={() => {
                          void trackInviteEvent("invite_request_fresh_clicked", {
                            code: inviteCode || null,
                            source: "manual",
                          });
                          window.open(
                            "https://t.me/s33d_life_bot?start=request_invite",
                            "_blank",
                            "noopener,noreferrer",
                          );
                        }}
                        onReturnToGrove={() => {
                          void trackInviteEvent("invite_return_to_grove", {
                            code: inviteCode || null,
                            source: "manual",
                          });
                          // Clear any persisted invite traces so a clean visit follows.
                          try {
                            localStorage.removeItem("s33d_invite_code");
                            localStorage.removeItem("s33d_pending_invite_code");
                            sessionStorage.removeItem("s33d_pending_invite_code");
                          } catch {}
                          navigate("/atlas");
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {!isSignup && !isForgot && (
                <div className="text-right">
                  <button type="button" onClick={() => { setView("forgot"); clearErrors(); }} className="text-xs text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}

              <Button type="submit" className="w-full font-serif" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isForgot ? "Sending..." : isSignup ? "Creating account..." : "Logging in..."}</>
                ) : (
                  isForgot ? "Send Reset Link" : isSignup ? "Create Account" : "Login"
                )}
              </Button>
            </form>

            {/* Divider & social / alternative logins (not on forgot) */}
            {!isForgot && (
              <div className="mt-6 space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card/80 px-3 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isLoading}>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>

                {oauthError && (
                  <p className="text-xs text-destructive" role="alert">{oauthError}</p>
                )}

                <TelegramLoginButton />

                <Button variant="outline" className="w-full gap-2" onClick={handleMagicLink} disabled={isLoading}>
                  <Wand2 className="h-4 w-4" />
                  Send Magic Link
                </Button>

                <WalletConnect compact />
              </div>
            )}
          </div>

          {/* Return home */}
          <div className="text-center mt-6">
            <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Return to Home
            </button>
          </div>
        </div>
      </div>

      {/* Unverified-account modal — shown when a user tries to log in before confirming their email. */}
      <Dialog
        open={unverifiedModalOpen}
        onOpenChange={(open) => {
          setUnverifiedModalOpen(open);
          if (open) setResendNote(null);
        }}
      >
        <DialogContent
          className="sm:max-w-md border rounded-2xl"
          style={{
            background: "linear-gradient(160deg, hsl(var(--primary) / 0.08), hsl(var(--card)))",
            borderColor: "hsl(var(--primary) / 0.35)",
          }}
          aria-labelledby="unverified-title"
          aria-describedby="unverified-desc"
        >
          <DialogHeader className="items-center text-center space-y-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "hsl(var(--primary) / 0.15)",
                border: "1px solid hsl(var(--primary) / 0.4)",
              }}
              aria-hidden="true"
            >
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <DialogTitle id="unverified-title" className="font-serif text-xl">
              🌱 Almost there — please confirm your email
            </DialogTitle>
            <DialogDescription id="unverified-desc" className="text-sm leading-relaxed">
              An account for <span className="text-foreground font-medium">{unverifiedEmail}</span> already exists,
              but it hasn't been verified yet. Open the confirmation link we sent you to enter the grove.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 pt-2">
            <Button
              onClick={() => { window.location.href = "mailto:"; }}
              className="w-full font-serif gap-2"
              aria-label="Open the Mail app on your device"
              autoFocus
            >
              <Mail className="w-4 h-4" aria-hidden="true" /> Open Mail App
            </Button>
            {(() => {
              const remaining = Math.max(0, Math.ceil((resendCooldownUntil - tickNow) / 1000));
              const cooling = remaining > 0;
              return (
                <Button
                  variant="outline"
                  onClick={() => handleResendVerification(unverifiedEmail)}
                  disabled={resending || cooling}
                  className="w-full font-serif gap-2"
                  aria-label="Resend the verification email"
                >
                  {resending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="w-4 h-4" aria-hidden="true" />}
                  {cooling ? `Resend available in ${remaining}s` : "Resend Verification Email"}
                </Button>
              );
            })()}
          </div>

          {resendNote && (
            <p role="status" aria-live="polite" className="text-xs leading-relaxed text-foreground/80 px-2 text-center">
              {resendNote}
            </p>
          )}

          <p
            className="text-[11px] text-center leading-relaxed pt-2 border-t"
            style={{
              color: "hsl(var(--muted-foreground))",
              borderColor: "hsl(var(--primary) / 0.15)",
            }}
          >
            Emails sometimes land in <span className="font-medium">Junk</span>,{" "}
            <span className="font-medium">Spam</span>, or{" "}
            <span className="font-medium">Promotions</span>.
          </p>

          <DialogFooter className="sm:justify-center">
            <Button
              variant="ghost"
              className="font-serif"
              onClick={() => setUnverifiedModalOpen(false)}
              aria-label="Close this dialog"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuthPage;
