/**
 * Calendar Settings — Toggle lenses, choose hemisphere, label style.
 */
import { useState, useEffect } from "react";
import { useCalendarLenses, type CalendarLens } from "@/hooks/use-calendar-lenses";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ChevronLeft, Info, Globe, Sparkles, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const CalendarSettingsPage = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [infoLens, setInfoLens] = useState<CalendarLens | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  const { lenses, prefs, loading, toggleLens, savePrefs } = useCalendarLenses(userId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-serif text-sm">Loading…</p>
      </div>
    );
  }

  const isEnabled = (id: string) => prefs.enabled_lens_ids.includes(id);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border/20 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link to="/cosmic" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-serif text-lg tracking-wide text-foreground">Calendar Lenses</h1>
          <div className="w-5" />
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Explanation */}
        <div className="rounded-xl bg-card/40 border border-border/20 p-4">
          <p className="text-xs font-serif text-muted-foreground leading-relaxed">
            Calendar Lenses overlay different systems of meaning onto the same timeline.
            Toggle lenses on or off to customise your Cosmic Calendar. Default lenses (Astronomical, Seasonal) are always available.
            Cultural lenses are offered with respect and attribution.
          </p>
        </div>

        {/* Lens toggles */}
        <div className="space-y-3">
          <h2 className="font-serif text-sm text-foreground/80 tracking-wide">Available Lenses</h2>

          {lenses.map(lens => (
            <div
              key={lens.id}
              className="flex items-center gap-3 p-4 rounded-xl bg-card/60 backdrop-blur border border-border/30"
            >
              <span className="text-xl">{lens.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-serif text-foreground">{lens.name}</p>
                  {lens.lens_type === "cultural" && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent-foreground/60 font-serif">
                      Cultural
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground font-serif leading-relaxed mt-0.5">
                  {lens.description}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setInfoLens(lens)}
                  className="p-1 rounded text-muted-foreground/40 hover:text-muted-foreground"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                <Switch
                  checked={isEnabled(lens.id)}
                  onCheckedChange={() => toggleLens(lens.id)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Region & Style */}
        <div className="space-y-3">
          <h2 className="font-serif text-sm text-foreground/80 tracking-wide">Preferences</h2>

          {/* Hemisphere */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card/60 border border-border/30">
            <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-serif text-foreground">Hemisphere</p>
              <p className="text-[10px] text-muted-foreground">Affects seasonal calculations.</p>
            </div>
            <div className="flex gap-1">
              {(["north", "south"] as const).map(h => (
                <button
                  key={h}
                  onClick={() => savePrefs({ hemisphere: h })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-serif transition-colors ${
                    prefs.hemisphere === h
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-card/40 text-muted-foreground border border-border/20 hover:bg-card/60"
                  }`}
                >
                  {h === "north" ? "North" : "South"}
                </button>
              ))}
            </div>
          </div>

          {/* Label style */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card/60 border border-border/30">
            <Sparkles className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-serif text-foreground">Label Style</p>
              <p className="text-[10px] text-muted-foreground">How calendar entries are worded.</p>
            </div>
            <div className="flex gap-1">
              {(["plain", "poetic"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => savePrefs({ label_style: s })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-serif transition-colors ${
                    prefs.label_style === s
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-card/40 text-muted-foreground border border-border/20 hover:bg-card/60"
                  }`}
                >
                  {s === "plain" ? "Plain" : "Poetic"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lens Info Modal */}
      <Dialog open={!!infoLens} onOpenChange={() => setInfoLens(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <span className="text-xl">{infoLens?.icon}</span>
              {infoLens?.name}
            </DialogTitle>
            <DialogDescription className="font-serif text-xs">
              {infoLens?.lens_type === "cultural" ? "Cultural Calendar Lens" : "Calendar Lens"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {infoLens?.description && (
              <div>
                <p className="text-xs font-serif font-medium text-foreground/80 mb-1">What this is</p>
                <p className="text-xs text-muted-foreground font-serif leading-relaxed">{infoLens.description}</p>
              </div>
            )}
            {infoLens?.lineage && (
              <div>
                <p className="text-xs font-serif font-medium text-foreground/80 mb-1">Lineage</p>
                <p className="text-xs text-muted-foreground font-serif">{infoLens.lineage}</p>
              </div>
            )}
            {infoLens?.attribution && (
              <div>
                <p className="text-xs font-serif font-medium text-foreground/80 mb-1">Attribution</p>
                <p className="text-xs text-muted-foreground font-serif">{infoLens.attribution}</p>
              </div>
            )}
            {infoLens?.disclaimer && (
              <div className="rounded-lg bg-accent/10 border border-accent/20 p-3">
                <p className="text-xs font-serif font-medium text-foreground/80 mb-1">⚠️ Important note</p>
                <p className="text-[10px] text-muted-foreground font-serif leading-relaxed">{infoLens.disclaimer}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-serif font-medium text-foreground/80 mb-1">What this is not</p>
              <p className="text-[10px] text-muted-foreground font-serif leading-relaxed">
                This lens does not claim to represent the definitive or only interpretation of this calendar system.
                It is not a prediction engine or horoscope. Interpretations can and do vary across communities and scholars.
                We present this as one lens of meaning among many.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarSettingsPage;
