/**
 * TelegramSettings — Admin panel for configuring Telegram integration.
 * Reads/writes the singleton telegram_settings row.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface TelegramSettingsData {
  enabled: boolean;
  chat_id: string | null;
  bot_username: string | null;
  notify_new_tree: boolean;
  notify_offering: boolean;
  notify_whisper: boolean;
  notify_heart_milestone: boolean;
  notify_council_invite: boolean;
  notify_ecosystem_update: boolean;
  delivery_mode: "immediate" | "digest";
  digest_hour: number | null;
}

const EVENT_TOGGLES: { key: keyof TelegramSettingsData; label: string; emoji: string }[] = [
  { key: "notify_new_tree", label: "New trees mapped", emoji: "🌳" },
  { key: "notify_offering", label: "Offerings made", emoji: "🎁" },
  { key: "notify_whisper", label: "Notable whispers", emoji: "🌬️" },
  { key: "notify_heart_milestone", label: "Heart milestones", emoji: "❤️" },
  { key: "notify_council_invite", label: "Council invitations", emoji: "🌿" },
  { key: "notify_ecosystem_update", label: "Ecosystem updates", emoji: "✨" },
];

export default function TelegramSettings() {
  const [settings, setSettings] = useState<TelegramSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from("telegram_settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (data) setSettings(data as unknown as TelegramSettingsData);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("telegram_settings")
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", 1);

    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Telegram settings saved");
    }
    setSaving(false);
  };

  const sendTest = async () => {
    if (!settings?.chat_id) {
      toast.error("Set a Chat ID first");
      return;
    }
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("telegram-notify", {
        body: {
          event_type: "ecosystem_update",
          data: {
            title: "S33D Connection Test",
            body: "🌱 The roots are connected. This Telegram group is now linked to the S33D ecosystem.",
          },
        },
      });
      if (error || !data?.ok) {
        toast.error("Test message failed — check your Chat ID and bot permissions");
      } else {
        toast.success("Test message sent to Telegram!");
      }
    } catch {
      toast.error("Failed to send test message");
    }
    setTesting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground font-serif">
        <AlertCircle className="w-5 h-5 mx-auto mb-2" />
        Could not load Telegram settings
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Master toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border/30 bg-card/50">
        <div>
          <h4 className="text-sm font-serif font-medium text-foreground">Telegram Integration</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Send ecosystem events to your Telegram group
          </p>
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
        />
      </div>

      {settings.enabled && (
        <>
          {/* Connection */}
          <div className="space-y-3 p-4 rounded-xl border border-border/20 bg-card/30">
            <h5 className="text-xs font-serif text-muted-foreground tracking-wider uppercase">Connection</h5>

            <div className="space-y-2">
              <Label className="text-xs font-serif">Chat ID</Label>
              <Input
                placeholder="-100xxxxxxxxxx"
                value={settings.chat_id || ""}
                onChange={(e) => setSettings({ ...settings, chat_id: e.target.value || null })}
                className="text-sm font-mono bg-background/50"
              />
              <p className="text-[10px] text-muted-foreground">
                Your group or channel Chat ID. Add the bot to your group, then use @userinfobot to find the ID.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-serif">Bot Username</Label>
              <Input
                placeholder="your_bot_name"
                value={settings.bot_username || ""}
                onChange={(e) => setSettings({ ...settings, bot_username: e.target.value || null })}
                className="text-sm font-mono bg-background/50"
              />
            </div>
          </div>

          {/* Event toggles */}
          <div className="space-y-2 p-4 rounded-xl border border-border/20 bg-card/30">
            <h5 className="text-xs font-serif text-muted-foreground tracking-wider uppercase mb-3">
              Event Notifications
            </h5>
            {EVENT_TOGGLES.map(({ key, label, emoji }) => (
              <div key={key} className="flex items-center justify-between py-1.5">
                <span className="text-sm font-serif text-foreground/80">
                  <span className="mr-2">{emoji}</span>
                  {label}
                </span>
                <Switch
                  checked={settings[key] as boolean}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, [key]: checked })
                  }
                />
              </div>
            ))}
          </div>

          {/* Delivery mode */}
          <div className="space-y-2 p-4 rounded-xl border border-border/20 bg-card/30">
            <h5 className="text-xs font-serif text-muted-foreground tracking-wider uppercase mb-2">
              Delivery Mode
            </h5>
            <div className="flex gap-2">
              {(["immediate", "digest"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSettings({ ...settings, delivery_mode: mode })}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-serif capitalize transition-all
                    ${settings.delivery_mode === mode
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-muted/20 text-muted-foreground border border-transparent hover:bg-muted/40"
                    }`}
                >
                  {mode === "immediate" ? "⚡ Immediate" : "📋 Daily Digest"}
                </button>
              ))}
            </div>
            {settings.delivery_mode === "digest" && (
              <div className="mt-2 space-y-1">
                <Label className="text-xs font-serif">Digest Hour (UTC)</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={settings.digest_hour ?? 9}
                  onChange={(e) =>
                    setSettings({ ...settings, digest_hour: parseInt(e.target.value) || 9 })
                  }
                  className="w-20 text-sm font-mono bg-background/50"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={saving} className="flex-1 gap-2 font-serif">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Save Settings
            </Button>
            <Button
              variant="outline"
              onClick={sendTest}
              disabled={testing || !settings.chat_id}
              className="gap-2 font-serif"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Test
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
