/**
 * Settings section for Notifications, Nearby Mode, and Weather preferences.
 * Renders inside the DashboardProfile / Settings tab.
 */
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, MapPin, Cloud, Send, Loader2 } from "lucide-react";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Props {
  userId: string;
}

const PresenceWeatherSettings = ({ userId }: Props) => {
  const { prefs, loading, saving, save } = useNotificationPreferences(userId);
  const { toast } = useToast();
  const [testSending, setTestSending] = useState(false);

  if (loading) return null;

  const sendTestNotification = async () => {
    setTestSending(true);
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Test notification 🔔",
      body: "If you see this, in-app notifications are working!",
      category: "general",
      priority: "p2",
      deep_link: "/dashboard",
    });
    toast({ title: "Test notification sent!" });
    setTestSending(false);
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <Card className="border-border/50 bg-card/60 backdrop-blur">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h3 className="text-sm uppercase tracking-widest text-primary font-serif">Notifications</h3>
          </div>

          <div className="space-y-3">
            <SettingRow
              label="In-App Notifications"
              description="Receive notifications in the bell menu"
              checked={prefs.push_enabled}
              onToggle={(v) => save({ push_enabled: v })}
            />

            <div className="space-y-1.5">
              <Label className="text-xs font-serif tracking-wider text-muted-foreground">Quiet Hours</Label>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-serif">
                <span>{prefs.quiet_hours_start}</span>
                <span>→</span>
                <span>{prefs.quiet_hours_end}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-serif tracking-wider text-muted-foreground">Digest Mode</Label>
              <Select value={prefs.digest_mode} onValueChange={(v) => save({ digest_mode: v })}>
                <SelectTrigger className="font-serif text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="font-serif">No digest</SelectItem>
                  <SelectItem value="daily" className="font-serif">Daily summary</SelectItem>
                  <SelectItem value="weekly" className="font-serif">Weekly summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-2 font-serif text-xs"
              onClick={sendTestNotification}
              disabled={testSending}
            >
              {testSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Send Test Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Nearby Mode */}
      <Card className="border-border/50 bg-card/60 backdrop-blur">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="text-sm uppercase tracking-widest text-primary font-serif">Nearby Mode</h3>
          </div>

          <SettingRow
            label="Enable Nearby Mode"
            description="S33D checks your approximate location occasionally to show nearby trees. No continuous tracking."
            checked={prefs.nearby_mode}
            onToggle={(v) => save({ nearby_mode: v })}
          />

          {prefs.nearby_mode && (
            <div className="space-y-1.5">
              <Label className="text-xs font-serif tracking-wider text-muted-foreground">Detection Radius</Label>
              <Select
                value={String(prefs.nearby_radius_m)}
                onValueChange={(v) => save({ nearby_radius_m: parseInt(v) })}
              >
                <SelectTrigger className="font-serif text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="250" className="font-serif">250m</SelectItem>
                  <SelectItem value="500" className="font-serif">500m</SelectItem>
                  <SelectItem value="1000" className="font-serif">1km</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weather */}
      <Card className="border-border/50 bg-card/60 backdrop-blur">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-primary" />
            <h3 className="text-sm uppercase tracking-widest text-primary font-serif">Weather</h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-serif tracking-wider text-muted-foreground">Temperature</Label>
              <Select value={prefs.weather_unit} onValueChange={(v) => save({ weather_unit: v })}>
                <SelectTrigger className="font-serif text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="C" className="font-serif">Celsius (°C)</SelectItem>
                  <SelectItem value="F" className="font-serif">Fahrenheit (°F)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-serif tracking-wider text-muted-foreground">Wind Speed</Label>
              <Select value={prefs.wind_unit} onValueChange={(v) => save({ wind_unit: v })}>
                <SelectTrigger className="font-serif text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="km/h" className="font-serif">km/h</SelectItem>
                  <SelectItem value="m/s" className="font-serif">m/s</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topic Subscriptions */}
      <Card className="border-border/50 bg-card/60 backdrop-blur">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h3 className="text-sm uppercase tracking-widest text-primary font-serif">Topic Subscriptions</h3>
          </div>
          <p className="text-xs text-muted-foreground font-serif">
            Subscribe to updates from regions, species hives, and followed trees. Coming soon — your existing follows will auto-map to topics.
          </p>
          <div className="flex flex-wrap gap-2">
            {prefs.topic_countries.length > 0 ? prefs.topic_countries.map(c => (
              <Badge key={c} variant="outline" className="text-[10px] font-serif">🌍 {c}</Badge>
            )) : <Badge variant="outline" className="text-[10px] font-serif text-muted-foreground">No topics yet</Badge>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/** Reusable toggle row */
const SettingRow = ({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between rounded-lg border border-border/40 bg-secondary/10 p-3">
    <div className="flex-1 mr-3">
      <p className="text-xs font-serif">{label}</p>
      <p className="text-[9px] text-muted-foreground leading-relaxed">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onToggle} />
  </div>
);

export default PresenceWeatherSettings;
