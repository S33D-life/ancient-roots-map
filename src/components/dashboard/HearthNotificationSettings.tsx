/**
 * HearthNotificationSettings — Notification & experience tuning panel for the Hearth.
 * Groups toggles into collapsible sections: essential first, advanced tucked away.
 * Includes Telegram outbound integration settings.
 */
import { useState, lazy, Suspense } from "react";
import { useNotificationPreferences, NotificationPreferences } from "@/hooks/use-notification-preferences";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Wind, Bell, Sparkles, RotateCcw, Loader2, ChevronDown, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TelegramSettings = lazy(() => import("@/components/settings/TelegramSettings"));
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (v: boolean) => void;
}

const ToggleRow = ({ label, description, checked, disabled, onCheckedChange }: ToggleRowProps) => (
  <div className="flex items-start justify-between gap-4 py-2.5">
    <div className="space-y-0.5 flex-1 min-w-0">
      <p className="text-sm font-serif text-foreground">{label}</p>
      {description && <p className="text-[11px] text-muted-foreground leading-snug">{description}</p>}
    </div>
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className="shrink-0"
    />
  </div>
);

/** Collapsible section with consistent pattern */
const SettingsSection = ({
  icon: Icon,
  title,
  defaultOpen = false,
  children,
}: {
  icon: React.ElementType;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full group">
        <div className="flex items-center gap-2 py-3 cursor-pointer select-none">
          <Icon className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-serif tracking-wider text-foreground/80 flex-1 text-left">{title}</h3>
          <ChevronDown className={`w-4 h-4 text-muted-foreground/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-2">
        <div className="divide-y divide-border/20 pl-6">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface Props {
  userId: string;
}

const HearthNotificationSettings = ({ userId }: Props) => {
  const { prefs, loading, saving, save, resetToDefaults } = useNotificationPreferences(userId);
  const { toast } = useToast();

  const toggle = (key: keyof NotificationPreferences) => (v: boolean) => {
    save({ [key]: v });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="space-y-1 mb-4">
        <h2 className="text-xl font-serif tracking-wide text-foreground">Hearth Settings</h2>
        <p className="text-xs text-muted-foreground font-serif italic">
          Shape how the world speaks to you
        </p>
      </div>

      {/* ── Essential: Quiet Mode — always visible ── */}
      <div className="rounded-lg border border-border/30 bg-card/40 p-4 mb-4">
        <ToggleRow
          label="🤫 Quiet Mode"
          description="Silence all non-essential notifications — only critical system alerts remain"
          checked={prefs.quiet_mode}
          onCheckedChange={toggle("quiet_mode")}
        />
      </div>

      {/* ── A. Notifications & Alerts — open by default ── */}
      <SettingsSection icon={Bell} title="Notifications & Alerts" defaultOpen>
        <ToggleRow
          label="Tree interactions"
          description="Seeds sprouting, hearts received, offerings acknowledged"
          checked={prefs.notify_tree_interactions}
          disabled={prefs.quiet_mode}
          onCheckedChange={toggle("notify_tree_interactions")}
        />
        <ToggleRow
          label="Nearby Ancient Friends"
          description="Alerts when near unmapped or notable trees"
          checked={prefs.notify_nearby_friends}
          disabled={prefs.quiet_mode}
          onCheckedChange={toggle("notify_nearby_friends")}
        />
        <ToggleRow
          label="Council of Life updates"
          description="Gatherings, proposals, and governance"
          checked={prefs.notify_council_updates}
          disabled={prefs.quiet_mode}
          onCheckedChange={toggle("notify_council_updates")}
        />
        <ToggleRow
          label="System updates"
          description="App updates, new features, maintenance"
          checked={prefs.notify_system_updates}
          disabled={prefs.quiet_mode}
          onCheckedChange={toggle("notify_system_updates")}
        />
      </SettingsSection>

      {/* ── B. Whispers & Presence — collapsed ── */}
      <SettingsSection icon={Wind} title="Whispers & Presence">
        <ToggleRow
          label="Enable Whispers"
          description="Receive messages left beneath trees by other wanderers"
          checked={prefs.whispers_enabled}
          onCheckedChange={toggle("whispers_enabled")}
        />
        <ToggleRow
          label="Only near a tree"
          description="Only show whispers when physically near an Ancient Friend"
          checked={prefs.whispers_near_tree_only}
          disabled={!prefs.whispers_enabled}
          onCheckedChange={toggle("whispers_near_tree_only")}
        />
        <ToggleRow
          label="Auto-open whisper panel"
          checked={prefs.whispers_auto_open}
          disabled={!prefs.whispers_enabled}
          onCheckedChange={toggle("whispers_auto_open")}
        />
        <ToggleRow
          label="Subtle vibration"
          description="Light haptic feedback when a whisper arrives"
          checked={prefs.whispers_haptic}
          disabled={!prefs.whispers_enabled}
          onCheckedChange={toggle("whispers_haptic")}
        />
      </SettingsSection>

      {/* ── C. Experience & Interface — collapsed ── */}
      <SettingsSection icon={Sparkles} title="Experience & Interface">
        <ToggleRow
          label="TEOTAG guidance whispers"
          description="Contextual hints and poetic nudges"
          checked={(prefs as any).show_teotag_whispers !== false}
          disabled={prefs.quiet_mode}
          onCheckedChange={toggle("show_teotag_whispers" as any)}
        />
        <ToggleRow
          label="Celebration overlays"
          description="Heart animations, reward bursts, milestone toasts"
          checked={(prefs as any).show_celebrations !== false}
          disabled={prefs.quiet_mode}
          onCheckedChange={toggle("show_celebrations" as any)}
        />
        <ToggleRow
          label="Onboarding nudges"
          checked={prefs.show_onboarding_nudges}
          disabled={prefs.quiet_mode}
          onCheckedChange={toggle("show_onboarding_nudges")}
        />
        <ToggleRow
          label="Floating prompts"
          checked={prefs.show_floating_prompts}
          disabled={prefs.quiet_mode}
          onCheckedChange={toggle("show_floating_prompts")}
        />
        <ToggleRow
          label="Minting / NFTree events"
          description="On-chain anchoring, NFTree generation, Staff ceremonies"
          checked={prefs.notify_minting_events}
          disabled={prefs.quiet_mode}
          onCheckedChange={toggle("notify_minting_events")}
        />
        <ToggleRow
          label="Companion suggestions"
          checked={prefs.show_companion_suggestions}
          disabled={prefs.quiet_mode}
          onCheckedChange={toggle("show_companion_suggestions")}
        />
      </SettingsSection>

      {/* Telegram — minimal presence, settings live in Tap Root */}
      <SettingsSection icon={Send} title="TEOTAG · Telegram">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-serif leading-relaxed">
            Connect, ask questions, or continue your journey through TEOTAG on Telegram.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://t.me/s33dlifebot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif min-h-[32px] transition-colors"
              style={{
                background: "hsl(var(--primary) / 0.1)",
                border: "1px solid hsl(var(--primary) / 0.2)",
                color: "hsl(var(--primary))",
              }}
            >
              <Send className="w-3 h-3" /> Open TEOTAG
            </a>
            <Link
              to="/library/tap-root"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif text-muted-foreground min-h-[32px] transition-colors"
              style={{
                background: "hsl(var(--secondary) / 0.15)",
                border: "1px solid hsl(var(--border) / 0.2)",
              }}
            >
              <Settings className="w-3 h-3" /> Manage in Tap Root
            </Link>
          </div>
        </div>
      </SettingsSection>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          variant="outline"
          size="sm"
          className="font-serif text-xs gap-1.5 border-border/40"
          onClick={() => {
            resetToDefaults();
            toast({ title: "Reset complete", description: "All settings restored to defaults" });
          }}
          disabled={saving}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to default
        </Button>
        {saving && (
          <span className="text-[10px] text-muted-foreground font-serif flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Saving…
          </span>
        )}
      </div>
    </div>
  );
};

export default HearthNotificationSettings;
