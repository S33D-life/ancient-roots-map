import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  KeyRound,
  Mail,
  ShieldCheck,
  Wallet,
  Bell,
  Loader2,
  Check,
  AlertCircle,
  Link2,
  Link2Off,
  Lock,
} from "lucide-react";
import LinkedAccountsSection from "@/components/dashboard/LinkedAccountsSection";

interface HearthAccountSecurityProps {
  user: User;
  walletAddress?: string | null;
}

/* ── Accordion Section Shell ─────────────────────────────── */
const Section = ({
  icon: Icon,
  label,
  description,
  defaultOpen = false,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full group">
        <div className="flex items-center gap-3 py-4 px-4 rounded-lg hover:bg-secondary/20 transition-colors cursor-pointer select-none">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-serif text-sm tracking-wide text-foreground">{label}</p>
            <p className="text-[11px] text-muted-foreground">{description}</p>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4 pt-1">{children}</CollapsibleContent>
    </Collapsible>
  );
};

/* ── A. Change Password ──────────────────────────────────── */
const ChangePasswordSection = () => {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const valid = currentPw.length >= 6 && newPw.length >= 6 && newPw === confirmPw;
  const mismatch = confirmPw.length > 0 && newPw !== confirmPw;

  const handleChange = async () => {
    if (!valid) return;
    setSaving(true);
    // Supabase updateUser only needs the new password; the session token proves current auth
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) {
      toast({ title: "Password change failed", description: error.message, variant: "destructive" });
    } else {
      setDone(true);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      toast({ title: "Password updated", description: "Your flame burns brighter." });
      setTimeout(() => setDone(false), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-3 max-w-sm">
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Current Password</Label>
        <Input
          type="password"
          autoComplete="current-password"
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
          className="font-serif"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground font-serif">New Password</Label>
        <Input
          type="password"
          autoComplete="new-password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          className="font-serif"
        />
        <PasswordStrengthMeter password={newPw} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Confirm New Password</Label>
        <Input
          type="password"
          autoComplete="new-password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          className="font-serif"
        />
        {mismatch && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Passwords do not match
          </p>
        )}
      </div>
      <Button
        onClick={handleChange}
        disabled={!valid || saving}
        size="sm"
        className="gap-2 font-serif text-xs tracking-wider"
      >
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : done ? <Check className="w-3 h-3" /> : <KeyRound className="w-3 h-3" />}
        {done ? "Updated" : "Change Password"}
      </Button>
    </div>
  );
};

/* ── B. Email Management ─────────────────────────────────── */
const EmailSection = ({ user }: { user: User }) => {
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const isVerified = !!user.email_confirmed_at;

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || newEmail.length > 255) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) {
      toast({ title: "Email update failed", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Confirmation sent",
        description: "Check both your old and new email to confirm the change.",
      });
      setNewEmail("");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4 max-w-sm">
      <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/10 p-3">
        <Mail className="w-4 h-4 text-primary/70 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-serif text-sm truncate">{user.email}</p>
          <p className="text-[10px] text-muted-foreground">Primary email</p>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-serif ${
            isVerified ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
          }`}
        >
          {isVerified ? "Verified" : "Unverified"}
        </span>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Change Email</Label>
        <Input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value.slice(0, 255))}
          placeholder="new-email@example.com"
          className="font-serif"
        />
        <p className="text-[10px] text-muted-foreground">A confirmation link will be sent to both addresses.</p>
      </div>
      <Button
        onClick={handleChangeEmail}
        disabled={!newEmail.trim() || saving}
        size="sm"
        className="gap-2 font-serif text-xs tracking-wider"
      >
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
        Update Email
      </Button>
    </div>
  );
};

/* ── C. Recovery & Backup (future-ready) ─────────────────── */
const RecoverySection = () => (
  <div className="space-y-4 max-w-sm">
    <div className="flex items-start gap-2 rounded-lg border border-border/30 bg-secondary/5 p-3">
      <Lock className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-serif text-foreground">Two-Factor Authentication</p>
        <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
          2FA will be available soon to further protect your identity. We'll notify you when it's ready.
        </p>
      </div>
    </div>
    <div className="flex items-start gap-2 rounded-lg border border-border/30 bg-secondary/5 p-3">
      <ShieldCheck className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-serif text-foreground">Recovery Phrase</p>
        <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
          For wallet-linked accounts, a recovery phrase backup will be offered here in a future update.
        </p>
      </div>
    </div>
  </div>
);

/* ── D. Wallet Awareness ─────────────────────────────────── */
const WalletSection = ({ walletAddress }: { walletAddress?: string | null }) => {
  const connected = !!walletAddress;
  return (
    <div className="space-y-4 max-w-sm">
      <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/10 p-3">
        {connected ? (
          <Link2 className="w-4 h-4 text-primary shrink-0" />
        ) : (
          <Link2Off className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          {connected ? (
            <>
              <p className="font-serif text-sm truncate">{walletAddress}</p>
              <p className="text-[10px] text-muted-foreground">Wallet connected</p>
            </>
          ) : (
            <>
              <p className="font-serif text-sm text-muted-foreground">No wallet connected</p>
              <p className="text-[10px] text-muted-foreground">Link a wallet to interact with Staffs on-chain</p>
            </>
          )}
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-serif ${
            connected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {connected ? "Connected" : "Inactive"}
        </span>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-border/30 bg-secondary/5 p-3">
        <ShieldCheck className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <strong className="text-foreground">App Account</strong> holds your profile, trees and offerings.{" "}
          <strong className="text-foreground">Wallet Identity</strong> connects to Staffs and on-chain actions. They work together but remain separate.
        </p>
      </div>
    </div>
  );
};

/* ── E. Notification Preferences ─────────────────────────── */
const NOTIFICATION_CHANNELS = [
  { key: "whispers", label: "Ancient Friend whispers" },
  { key: "council", label: "Council invitations" },
  { key: "library", label: "Library interactions" },
  { key: "messages", label: "Direct wanderer messages" },
  { key: "offerings", label: "Public offering alerts" },
] as const;

const NotificationSection = () => {
  // Local-only for now — persisted when backend support is added
  const [prefs, setPrefs] = useState<Record<string, { email: boolean; inApp: boolean }>>(() =>
    Object.fromEntries(NOTIFICATION_CHANNELS.map((c) => [c.key, { email: true, inApp: true }]))
  );

  const toggle = (key: string, channel: "email" | "inApp") =>
    setPrefs((p) => ({ ...p, [key]: { ...p[key], [channel]: !p[key][channel] } }));

  return (
    <div className="space-y-3 max-w-md">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_60px_60px] gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-serif px-1">
        <span />
        <span className="text-center">Email</span>
        <span className="text-center">In-app</span>
      </div>
      {NOTIFICATION_CHANNELS.map((ch) => (
        <div
          key={ch.key}
          className="grid grid-cols-[1fr_60px_60px] gap-2 items-center rounded-lg border border-border/30 bg-secondary/5 px-3 py-2"
        >
          <span className="text-xs font-serif text-foreground">{ch.label}</span>
          <div className="flex justify-center">
            <Switch
              checked={prefs[ch.key].email}
              onCheckedChange={() => toggle(ch.key, "email")}
              className="scale-75"
            />
          </div>
          <div className="flex justify-center">
            <Switch
              checked={prefs[ch.key].inApp}
              onCheckedChange={() => toggle(ch.key, "inApp")}
              className="scale-75"
            />
          </div>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground font-serif">
        Push notifications will be available in a future update.
      </p>
    </div>
  );
};

/* ── Main Component ──────────────────────────────────────── */
const HearthAccountSecurity = ({ user, walletAddress }: HearthAccountSecurityProps) => {
  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur">
      <CardContent className="p-4 md:p-6 space-y-1">
        <div className="mb-4">
          <h2 className="font-serif text-lg text-foreground tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Account & Security
          </h2>
          <p className="text-[11px] text-muted-foreground font-serif mt-1">
            Tend your identity. Protect the flame.
          </p>
        </div>

        <Section icon={KeyRound} label="Change Password" description="Update your login credentials" defaultOpen>
          <ChangePasswordSection />
        </Section>

        <Section icon={Mail} label="Email Management" description="Manage your email addresses">
          <EmailSection user={user} />
        </Section>

        <Section icon={ShieldCheck} label="Recovery & Backup" description="Future security options">
          <RecoverySection />
        </Section>

        <Section icon={Wallet} label="Linked Identities" description="Connected sign-in methods">
          <LinkedAccountsSection user={user} />
        </Section>

        <Section icon={Wallet} label="Wallet Identity" description="On-chain connection status">
          <WalletSection walletAddress={walletAddress} />
        </Section>

        <Section icon={Bell} label="Notification Preferences" description="Choose what reaches you">
          <NotificationSection />
        </Section>
      </CardContent>
    </Card>
  );
};

export default HearthAccountSecurity;
