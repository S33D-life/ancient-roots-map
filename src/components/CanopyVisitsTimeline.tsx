/**
 * CanopyVisitsTimeline — displays check-in history for a tree.
 * Timeline view with seasonal comparison and visit stats.
 *
 * Visibility pass: each entry now reveals the wanderer who met the tree
 * (avatar + name → /wanderer/:id). A small "Others who met this tree" row
 * shows up to 6 unique recent visitors above the timeline.
 */
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  TreeDeciduous, ChevronDown, MapPin, Leaf, Flame, Loader2,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import type { TreeCheckin } from "@/hooks/use-tree-checkins";
import type { CheckinStats } from "@/hooks/use-tree-checkins";

interface VisitorProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const SEASON_ICONS: Record<string, string> = {
  bud: "🌱", leaf: "🍃", blossom: "🌸", fruit: "🍎", bare: "🪵", other: "🌿",
};
const WEATHER_ICONS: Record<string, string> = {
  sunny: "☀️", cloudy: "☁️", rainy: "🌧️", snowy: "❄️", windy: "💨", misty: "🌫️", stormy: "⛈️",
};
const MOOD_LABELS = ["Quiet", "Gentle", "Present", "Connected", "Transcendent"];

interface Props {
  checkins: TreeCheckin[];
  stats: CheckinStats;
  loading: boolean;
  onCheckin: () => void;
  showCheckinButton?: boolean;
  userId?: string | null;
  onRefresh?: () => void;
}

export default function CanopyVisitsTimeline({ checkins, stats, loading, onCheckin, showCheckinButton = true, userId, onRefresh }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [witnessingId, setWitnessingId] = useState<string | null>(null);
  const displayCheckins = expanded ? checkins : checkins.slice(0, 3);

  const handleWitness = async (checkinId: string) => {
    if (!userId) {
      toast.error("Please sign in to witness a check-in.");
      return;
    }
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is unavailable on this device.");
      return;
    }

    setWitnessingId(checkinId);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
      );

      const { data, error } = await supabase.functions.invoke("canopy-checkin", {
        body: {
          action: "witness",
          checkin_id: checkinId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
        },
      });

      if (error) {
        toast.error(error.message || "Witness confirmation failed.");
      } else {
        const payload = (data || {}) as { confidence_score?: number };
        toast.success(`Witness confirmed. Confidence now ${payload.confidence_score ?? "updated"}.`);
        onRefresh?.();
      }
    } catch {
      toast.error("Unable to get your location for witness confirmation.");
    } finally {
      setWitnessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary/40" />
      </div>
    );
  }

  if (checkins.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-primary/20 p-8 text-center" style={{ background: "radial-gradient(ellipse at 50% 80%, hsl(var(--primary) / 0.04), transparent 70%)" }}>
        <div className="text-3xl mb-3 opacity-30">🌿</div>
        <p className="text-sm text-muted-foreground font-serif mb-3">
          Be the first wanderer to meet this Ancient Friend.
        </p>
        {showCheckinButton && (
          <Button variant="outline" size="sm" onClick={onCheckin} className="font-serif text-xs gap-1.5">
            <MapPin className="h-3 w-3" />
            Record your visit
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="h-px flex-1"
          style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.3), transparent)" }}
        />
        <div className="flex items-center gap-2">
          <TreeDeciduous className="h-4 w-4 text-primary/70" />
          <h3 className="text-lg font-serif text-primary tracking-widest uppercase">Canopy Visits</h3>
          {stats.totalVisits > 0 && (
            <Badge variant="outline" className="text-[10px] font-mono px-1.5">
              {stats.totalVisits} visit{stats.totalVisits !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <div
          className="h-px flex-1"
          style={{ background: "linear-gradient(270deg, hsl(var(--primary) / 0.3), transparent)" }}
        />
      </div>

      {/* Season coverage bar */}
      {stats.totalVisits > 0 && (
        <div className="mb-4 p-3 rounded-lg border border-border/30 bg-card/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-serif text-muted-foreground">Seasonal Coverage</span>
            <span className="text-xs font-mono text-primary">{stats.seasonPercent}%</span>
          </div>
          <div className="flex gap-1.5">
            {["bud", "leaf", "blossom", "fruit", "bare"].map((s) => (
              <div
                key={s}
                className={`flex-1 h-6 rounded flex items-center justify-center text-xs transition-all ${
                  stats.seasonsCovered.includes(s)
                    ? "bg-primary/20 border border-primary/30"
                    : "bg-secondary/30 border border-border/20 opacity-40"
                }`}
              >
                {SEASON_ICONS[s]}
              </div>
            ))}
          </div>
          {stats.seasonPercent === 100 && (
            <div className="text-[10px] text-center font-serif text-primary mt-2">
              ✨ Four Seasons Witness — you have seen this tree in every season.
            </div>
          )}
        </div>
        )}

        {/* Streak counter */}
        {(stats.currentStreak > 0 || stats.longestStreak > 1) && (
          <div className="flex items-center gap-3 mb-4">
            {stats.currentStreak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <Flame className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-serif text-primary">{stats.currentStreak} day streak</span>
              </div>
            )}
            {stats.longestStreak > 1 && (
              <span className="text-[10px] text-muted-foreground font-serif">
                Best: {stats.longestStreak} days
              </span>
            )}
          </div>
        )}
      {/* Timeline */}
      {displayCheckins.length > 0 && (
        <div className="space-y-2 mb-4">
          {displayCheckins.map((c) => (
            <div
              key={c.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border/30 bg-card/30"
            >
              <div className="text-xl shrink-0 mt-0.5">
                {SEASON_ICONS[c.season_stage] || "🌿"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-xs font-serif text-foreground">
                    {new Date(c.checked_in_at).toLocaleDateString(undefined, {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                  {c.weather && (
                    <span className="text-xs">{WEATHER_ICONS[c.weather] || c.weather}</span>
                  )}
                  {c.canopy_proof && (
                    <Badge variant="outline" className="text-[8px] px-1 py-0 text-primary/60 border-primary/20">
                      <MapPin className="w-2.5 h-2.5 mr-0.5" /> GPS
                    </Badge>
                  )}
                  {(c.confidence_score ?? 0) > 0 && (
                    <Badge variant="outline" className="text-[8px] px-1 py-0 border-primary/20">
                      Confidence {c.confidence_score}
                    </Badge>
                  )}
                  {c.mood_score && (
                    <span className="text-[10px] text-muted-foreground/60 font-serif">
                      {MOOD_LABELS[c.mood_score - 1]}
                    </span>
                  )}
                </div>
                {c.reflection && (
                  <p className="text-xs text-muted-foreground font-serif leading-relaxed line-clamp-2">
                    {c.reflection}
                  </p>
                )}
                <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground/50 font-serif">
                  {c.birdsong_heard && <span>🐦 Birdsong</span>}
                  {c.fungi_present && <span>🍄 Fungi</span>}
                  {c.health_notes && <span>📋 Health note</span>}
                </div>
                {userId && c.user_id !== userId && Date.now() - new Date(c.checked_in_at).getTime() <= 10 * 60 * 1000 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 text-[10px] h-7 px-2"
                    onClick={() => handleWitness(c.id)}
                    disabled={witnessingId === c.id}
                  >
                    {witnessingId === c.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Witness
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show more */}
      {checkins.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-serif transition-colors mb-4"
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "Show less" : `Show all ${checkins.length} visits`}
        </button>
      )}

      {/* Check-in button */}
      {showCheckinButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={onCheckin}
          className="font-serif text-xs tracking-wider gap-1.5 border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground"
        >
          <Leaf className="h-3.5 w-3.5" />
          Sit Beneath This Canopy
        </Button>
      )}

      {checkins.length === 0 && (
        <p className="text-xs text-muted-foreground font-serif text-center py-2">
          No visits recorded yet. Be the first to mark your presence.
        </p>
      )}
    </div>
  );
}
