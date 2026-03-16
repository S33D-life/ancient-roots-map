import { useState, useEffect, useRef, useCallback } from "react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TreePine, Wallet, Wand2, Mail, ArrowLeft, Eye, EyeOff, CheckCircle2, KeyRound, Gift } from "lucide-react";
import { z } from "zod";
import WalletConnect from "@/components/WalletConnect";
import teotagLogo from "@/assets/teotag-small.webp";
import { recordReferral } from "@/hooks/use-referrals";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

type AuthView = "login" | "signup" | "forgot" | "magic-sent" | "reset-sent" | "verify-email" | "reset-password";

const AuthPage = () => {
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; confirm?: string; newPassword?: string; confirmNew?: string }>({});
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const resolvePostAuthPath = useCallback(() => {
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

  // Pre-fill invite code from URL, also capture gift param
  useEffect(() => {
    const code = searchParams.get("invite");
    const giftCode = searchParams.get("gift");
    if (code) {
      setInviteCode(code);
      setView("signup"); // auto-switch to signup if arriving via invite
    }
    if (giftCode) {
      localStorage.setItem("s33d_gift_code", giftCode);
      setView("signup");
    }
  }, [searchParams]);

  // Use a ref for view to avoid re-subscribing on every view change
  const viewRef = useRef(view);
  useEffect(() => { viewRef.current = view; }, [view]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle password recovery redirect — show reset form instead of navigating away
      if (event === "PASSWORD_RECOVERY") {
        setView("reset-password");
        return;
      }

      // Handle session expiry gracefully
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        setView("login");
        return;
      }

      if (session && viewRef.current !== "reset-password") {
        // Record referral on first sign-in if invite code was stored
        const storedCode = localStorage.getItem("s33d_invite_code");
        if (storedCode && session.user) {
          await recordReferral(session.user.id, storedCode);
          localStorage.removeItem("s33d_invite_code");
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

            const { data: treeData, error } = await supabase.from("trees").insert({
              ...pendingTree,
              created_by: session.user.id,
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

        navigate(resolvePostAuthPath(), { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
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
          throw new Error("Please verify your email before signing in. Check your inbox.");
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate("signup")) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) {
        if (error.message.includes("User already registered")) {
          throw new Error("An account with this email already exists. Try logging in.");
        }
        throw error;
      }
      // Store invite code so we can record the referral after email verification
      if (inviteCode.trim() && data.user) {
        localStorage.setItem("s33d_invite_code", inviteCode.trim());
      }
      setView("verify-email");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not create account";
      toast({ title: "Sign up failed", description: msg, variant: "destructive" });
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
        redirectTo: `${window.location.origin}/auth`,
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
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
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
      toast({ title: "Password updated", description: "You can now log in with your new password." });
      navigate("/dashboard");
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
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'radial-gradient(ellipse at top, hsl(75 20% 14%), hsl(80 15% 10%))' }}>
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
          </div>
        </div>
      </div>
    );
  }

  // Success / confirmation screens
  if (view === "verify-email" || view === "magic-sent" || view === "reset-sent") {
    const configs = {
      "verify-email": {
        icon: <Mail className="w-8 h-8 text-primary" />,
        title: "Check your inbox",
        desc: `We've sent a verification link to ${email}. Click it to activate your account.`,
        action: "Back to Login",
      },
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
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'radial-gradient(ellipse at top, hsl(75 20% 14%), hsl(80 15% 10%))' }}>
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
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'radial-gradient(ellipse at top, hsl(75 20% 14%), hsl(80 15% 10%))' }}>
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden md:flex md:w-2/5 lg:w-1/3 flex-col items-center justify-center p-10 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, hsl(42 60% 18% / 0.4), hsl(75 20% 10% / 0.8))' }} />
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
                    {isSignup ? "Create your grove account" : "Welcome back, tree guardian"}
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
                    <Gift className="w-3 h-3" /> Invite Code <span className="text-muted-foreground/50">(optional)</span>
                  </Label>
                  <Input
                    id="invite-code"
                    type="text"
                    placeholder="Enter invite code from a friend"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    disabled={isLoading}
                    className="font-mono text-sm"
                  />
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
    </div>
  );
};

export default AuthPage;
