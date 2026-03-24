import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Moon, Sun, Check, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ── Moon phase calculation (simplified but accurate enough) ── */
function getMoonPhases(afterDate: Date) {
  // Known new moon: Jan 29 2025 12:36 UTC
  const knownNew = new Date("2025-01-29T12:36:00Z").getTime();
  const synodicMs = 29.53058867 * 24 * 60 * 60 * 1000;

  const results: { newMoon: Date; fullMoon: Date } = { newMoon: new Date(), fullMoon: new Date() };
  let cycleStart = knownNew;

  // Find the next new moon after afterDate
  while (cycleStart + synodicMs < afterDate.getTime()) {
    cycleStart += synodicMs;
  }
  // Next new moon
  let nextNew = cycleStart;
  while (nextNew < afterDate.getTime()) nextNew += synodicMs;
  results.newMoon = new Date(nextNew);

  // Next full moon (half synodic after a new moon)
  let nextFull = knownNew + synodicMs / 2;
  while (nextFull < afterDate.getTime()) nextFull += synodicMs;
  results.fullMoon = new Date(nextFull);

  return results;
}

function formatDateLondon(d: Date) {
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  });
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

const DigitalFireVote = () => {
  const now = useMemo(() => new Date(), []);
  const phases = useMemo(() => getMoonPhases(now), [now]);

  // Use the earlier date as the "event_date" for this voting round
  const eventDate = useMemo(() => {
    const earlier = phases.newMoon < phases.fullMoon ? phases.newMoon : phases.fullMoon;
    return toDateStr(earlier);
  }, [phases]);

  const [userVote, setUserVote] = useState<string | null>(null);
  const [totals, setTotals] = useState({ new_moon: 0, full_moon: 0 });
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Cutoff: 24h before the earlier event
  const cutoff = useMemo(() => {
    const earlier = phases.newMoon < phases.fullMoon ? phases.newMoon : phases.fullMoon;
    return new Date(earlier.getTime() - 24 * 60 * 60 * 1000);
  }, [phases]);
  const votingOpen = now < cutoff;

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id ?? null);
        await fetchVotes(user?.id ?? null);
      } catch (err) {
        console.error("[DigitalFireVote] init failed", err);
      }
      setLoading(false);
    };
    init();
  }, [eventDate]);

  const fetchVotes = async (uid: string | null) => {
    // Get totals
    const { data: allVotes } = await supabase
      .from("digital_fire_votes")
      .select("moon_event")
      .eq("event_date", eventDate);

    const counts = { new_moon: 0, full_moon: 0 };
    (allVotes ?? []).forEach((v: { moon_event: string }) => {
      if (v.moon_event === "new_moon") counts.new_moon++;
      else counts.full_moon++;
    });
    setTotals(counts);

    // Get user vote
    if (uid) {
      const { data: mine } = await supabase
        .from("digital_fire_votes")
        .select("moon_event")
        .eq("user_id", uid)
        .eq("event_date", eventDate)
        .maybeSingle();
      setUserVote(mine?.moon_event ?? null);
    }
  };

  const castVote = async (choice: "new_moon" | "full_moon") => {
    if (!userId) {
      toast.error("Sign in to cast your vote");
      return;
    }
    if (!votingOpen) {
      toast.error("Voting has closed for this cycle");
      return;
    }

    setVoting(true);
    try {
      if (userVote) {
        const { error } = await supabase
          .from("digital_fire_votes")
          .update({ moon_event: choice, updated_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("event_date", eventDate);
        if (error) { toast.error("Could not update vote"); return; }
      } else {
        const { error } = await supabase
          .from("digital_fire_votes")
          .insert({ user_id: userId, moon_event: choice, event_date: eventDate });
        if (error) { toast.error("Could not cast vote"); return; }
      }

      setUserVote(choice);
      toast.success("Your voice has been heard 🔥");
      await fetchVotes(userId);
    } finally {
      setVoting(false);
    }
  };

  const total = totals.new_moon + totals.full_moon;
  const newPct = total > 0 ? Math.round((totals.new_moon / total) * 100) : 50;
  const fullPct = total > 0 ? Math.round((totals.full_moon / total) * 100) : 50;

  if (loading) return null;

  return (
    <Card className="bg-card/70 backdrop-blur-sm border-border/50 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🔥</span>
          <CardTitle className="font-serif text-lg tracking-wide">
            Digital Fire — Lunar Vote
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          Choose when the next Council gathering should be held
        </CardDescription>
      </CardHeader>

      <div className="px-6 pb-6 space-y-4">
        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* New Moon */}
          <button
            onClick={() => castVote("new_moon")}
            disabled={!votingOpen || !userId || voting}
            className={`relative p-4 rounded-lg border text-left transition-all duration-200 ${
              userVote === "new_moon"
                ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                : "border-border/50 hover:border-primary/40 hover:bg-card/80"
            } ${!votingOpen || !userId || voting ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {userVote === "new_moon" && (
              <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
            )}
            <Moon className="h-6 w-6 mb-2 text-muted-foreground" />
            <p className="font-serif text-sm font-medium">New Moon Digital Fire</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDateLondon(phases.newMoon)}
            </p>
          </button>

          {/* Full Moon */}
          <button
            onClick={() => castVote("full_moon")}
            disabled={!votingOpen || !userId || voting}
            className={`relative p-4 rounded-lg border text-left transition-all duration-200 ${
              userVote === "full_moon"
                ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                : "border-border/50 hover:border-primary/40 hover:bg-card/80"
            } ${!votingOpen || !userId || voting ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {userVote === "full_moon" && (
              <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
            )}
            <Sun className="h-6 w-6 mb-2 text-muted-foreground" />
            <p className="font-serif text-sm font-medium">Full Moon Digital Fire</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDateLondon(phases.fullMoon)}
            </p>
          </button>
        </div>

        {/* Results */}
        {total > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>🌑 New Moon — {newPct}%</span>
              <span>🌕 Full Moon — {fullPct}%</span>
            </div>
            <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-secondary">
              <div
                className="bg-primary/80 transition-all duration-500 rounded-l-full"
                style={{ width: `${newPct}%` }}
              />
              <div
                className="bg-accent/80 transition-all duration-500 rounded-r-full"
                style={{ width: `${fullPct}%` }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {total} {total === 1 ? "voice" : "voices"} heard
            </p>
          </div>
        )}

        {/* Status badges */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {!userId && (
            <Badge variant="outline" className="text-xs">Sign in to vote</Badge>
          )}
          {!votingOpen && (
            <Badge variant="secondary" className="text-xs">Voting closed</Badge>
          )}
          {userVote && votingOpen && (
            <Badge variant="outline" className="text-xs gap-1">
              <RefreshCw className="h-3 w-3" /> You can change your vote
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DigitalFireVote;
