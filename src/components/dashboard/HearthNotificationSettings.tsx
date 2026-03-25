/**
 * HearthNotificationSettings — Notification & experience tuning panel for the Hearth.
 * Groups toggles into: Whispers & Presence, Notifications & Alerts, Experience & Interface.
 */
import { useNotificationPreferences, NotificationPreferences } from "@/hooks/use-notification-preferences";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Wind, Bell, Sparkles, RotateCcw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ToggleRowProps {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (v: boolean) => void;
}

const ToggleRow = ({ label, description, checked, disabled, onCheckedChange }: ToggleRowProps) => (
  <div className="flex items-start justify-between gap-4 py-3">
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

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const Section = ({ icon, title, children }: SectionProps) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2 pt-2 pb-1">
      {icon}
      <h3 className="text-sm font-serif tracking-wider text-foreground/80">{title}</h3>
    </div>
    <div className="divide-y divide-border/20">{children}</div>
  </div>
);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-serif tracking-wide text-foreground">Hearth Settings</h2>
        <p className="text-xs text-muted-foreground font-serif italic">
          Shape how the world speaks to you
        </p>
      </div>

      {/* ── A. Whispers & Presence ── */}
      <Section icon={<Wind className="w-4 h-4 text-primary" />} title="Whispers & Presence">
        <ToggleRow
          label="Enable Whispers"
          description="Receive messages left beneath trees by other wanderers"
          checked={prefs.whispers_enabled}
          onCheckedChange={toggle("whispers_enabled")}
        />
        <ToggleRow
          label="Only near a tree"
          description="Only show whispers when you are physically near an Ancient Friend"
          checked={prefs.whispers_near_tree_only}
          disabled={!prefs.whispers_enabled}
          onCheckedChange={toggle("whispers_near_tree_only")}
        />
        <ToggleRow
          label="Auto-open whisper panel"
          description="Automatically open the whisper panel when you arrive near a tree"
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
      </Section>

      <Separator className="bg-border/30" />

      {/* ── B. Notifications & Alerts ── */}
      <Section icon={<Bell className="w-4 h-4 text-primary" />} title="Notifications & Alerts">
        <ToggleRow
          label="Quiet Mode"
          description="Silence all non-essential notifications — only critical system alerts remain"
          checked={prefs.quiet_mode}
          onCheckedChange={toggle("quiet_mode")}
        />
        <ToggleRow
          label="Tree interactions"
          description="Seeds sprouting, hearts received, offerings acknowledged"
          checked={prefs.notify_tree_interactions}
          disabled={prefs.quiet_mode}
          onCheckedChange={toggle("notify_tree_interactions")}
        />
        <ToggleRow
          label="Nearby Ancient Friends"
          description="Alerts when you're near unmapped or notable trees"
          checked={prefs.notify_nearby_friends}
          disabled={prefs.quiet_mode}
          onCheckedChange={toggle("notify_nearby_friends")}
        />
        <ToggleRow
          label="Council of Life updates"
          description="Gatherings, proposals, and governance activity"
          checked={prefs.notify_council_updates}
          disabled={prefs.quiet_mode}
          onCheckedChange={toggle("notify_council_updates")}
        />
        <ToggleRow
          label="Minting / NFTree events"
          description="On-chain anchoring, NFTree generation, and Staff ceremonies"
          checked={prefs.notify_minting_events}
          disabled={prefs.quiet_mode}
          onCheckedChange={toggle("notify_minting_events")}
        />
        <ToggleRow
          label="System updates"
          description="App updates, new features, and maintenance notices"
          checked={prefs.notify_system_updates}
          disabled={prefs.quiet_mode}
          onCheckedChange={toggle("notify_system_updates")}
        />
      </Section>

      <Separator className="bg-border/30" />

      {/* ── C. Experience & Interface Signals ── */}
      <Section icon={<Sparkles className="w-4 h-4 text-primary" />} title="Experience & Interface">
        <ToggleRow
          label="TEOTAG guidance whispers"
          description="Contextual hints and poetic nudges from the guiding orb"
          checked={(prefs as any).show_teotag_whispers !== false}
          disabled={prefs.quiet_mode}
          onCheckedChange={toggle("show_teotag_whispers" as any)}
        />
        <ToggleRow
          label="Celebration overlays"
          description="Heart-earned animations, reward bursts, and milestone toasts"
          checked={(prefs as any).show_celebrations !== false}
          disabled={prefs.quiet_mode}
          onCheckedChange={toggle("show_celebrations" as any)}
        />
        <ToggleRow
          label="Onboarding nudges"
          description="Gentle prompts like 'Plant a seed' or 'Visit your first tree'"
          checked={prefs.show_onboarding_nudges}
          disabled={prefs.quiet_mode}
          onCheckedChange={toggle("show_onboarding_nudges")}
        />
        <ToggleRow
          label="Floating prompts"
          description="Contextual popups and whisper banners"
          checked={prefs.show_floating_prompts}
          disabled={prefs.quiet_mode}
          onCheckedChange={toggle("show_floating_prompts")}
        />
        <ToggleRow
          label="Companion suggestions"
          description="Scan, verify, and connect prompts from the Companion controller"
          checked={prefs.show_companion_suggestions}
          disabled={prefs.quiet_mode}
          onCheckedChange={toggle("show_companion_suggestions")}
        />
      </Section>

      <Separator className="bg-border/30" />

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
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
