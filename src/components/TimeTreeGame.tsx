import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, TreeDeciduous, Heart, ChevronRight, Sparkles, Star, Send, Scroll, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type MoonPhase = "full" | "new";

interface TimeTreeEntry {
  id: string;
  moon_phase: MoonPhase;
  tree_name: string;
  tree_reference_id: string | null;
  is_tree_real: boolean;
  participant_one: string;
  participant_two: string;
  what_shared: string;
  where_sitting: string | null;
  emotional_tone: string | null;
  hearts_awarded: number;
  pilgrimage_flag: boolean;
  meeting_realised: boolean;
  linked_wish_id: string | null;
  created_at: string;
}

/* ─── Lunar phase detection ─── */
const getCurrentLunarPhase = (): MoonPhase => {
  const synodicMonth = 29.53059;
  const knownNewMoon = new Date(2024, 0, 11, 11, 57);
  const daysSince = (Date.now() - knownNewMoon.getTime()) / 86400000;
  const phase = ((daysSince % synodicMonth) / synodicMonth) * 100;
  // Full moon ~43-56%, rest is "new" side
  return phase >= 43.75 && phase < 56.25 ? "full" : "new";
};

const getLunarEmoji = (phase: MoonPhase) => phase === "full" ? "🌕" : "🌑";

const EMOTIONAL_TONES = [
  "Peaceful", "Grateful", "Curious", "Joyful", "Wistful",
  "Reverent", "Hopeful", "Playful", "Sacred", "Wild",
];

/* ─── Step indicator ─── */
const StepDots = ({ current, total }: { current: number; total: number }) => (
  <div className="flex gap-1.5 justify-center">
    {Array.from({ length: total }, (_, i) => (
      <div
        key={i}
        className={`h-1.5 rounded-full transition-all duration-300 ${
          i === current ? "w-6 bg-primary" : i < current ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted-foreground/20"
        }`}
      />
    ))}
  </div>
);

const TimeTreeGame = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [phase, setPhase] = useState<MoonPhase>(getCurrentLunarPhase());
  const [step, setStep] = useState(0); // 0=intro, 1=tree, 2=people, 3=sharing, 4=tone, 5=submitted
  const [alreadySubmittedToday, setAlreadySubmittedToday] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastEntry, setLastEntry] = useState<TimeTreeEntry | null>(null);
  const [pastEntries, setPastEntries] = useState<TimeTreeEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Form state
  const [treeName, setTreeName] = useState("");
  const [isTreeReal, setIsTreeReal] = useState(phase === "new");
  const [participantOne, setParticipantOne] = useState("");
  const [participantTwo, setParticipantTwo] = useState("");
  const [whatShared, setWhatShared] = useState("");
  const [whereSitting, setWhereSitting] = useState("");
  const [emotionalTone, setEmotionalTone] = useState("");

  // Collective stats
  const [stats, setStats] = useState({ total: 0, full: 0, new_: 0, realised: 0 });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        checkTodaySubmission(user.id);
        fetchPastEntries(user.id);
      }
    });
    fetchCollectiveStats();
  }, []);

  useEffect(() => {
    setIsTreeReal(phase === "new");
  }, [phase]);

  const checkTodaySubmission = async (uid: string) => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("time_tree_entries")
      .select("id, hearts_awarded, reward_timestamp")
      .eq("user_id", uid)
      .gte("created_at", today + "T00:00:00Z")
      .lte("created_at", today + "T23:59:59Z")
      .limit(1);
    if (data && data.length > 0 && data[0].reward_timestamp) {
      setAlreadySubmittedToday(true);
    }
  };

  const fetchPastEntries = async (uid: string) => {
    const { data } = await supabase
      .from("time_tree_entries")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(20);
    setPastEntries((data as TimeTreeEntry[]) || []);
  };

  const fetchCollectiveStats = async () => {
    const [totalRes, fullRes, newRes, realisedRes] = await Promise.all([
      supabase.from("time_tree_entries").select("id", { count: "exact", head: true }),
      supabase.from("time_tree_entries").select("id", { count: "exact", head: true }).eq("moon_phase", "full"),
      supabase.from("time_tree_entries").select("id", { count: "exact", head: true }).eq("moon_phase", "new"),
      supabase.from("time_tree_entries").select("id", { count: "exact", head: true }).eq("meeting_realised", true),
    ]);
    setStats({
      total: totalRes.count ?? 0,
      full: fullRes.count ?? 0,
      new_: newRes.count ?? 0,
      realised: realisedRes.count ?? 0,
    });
  };

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (submitting) return;
    setSaveError(null);

    // Pre-save validation
    const trimmedTree = treeName.trim();
    const trimmedP1 = participantOne.trim();
    const trimmedP2 = participantTwo.trim();
    const trimmedShared = whatShared.trim();

    if (!trimmedTree || !trimmedP1 || !trimmedP2 || !trimmedShared) {
      const missing: string[] = [];
      if (!trimmedTree) missing.push("tree name");
      if (!trimmedP1) missing.push("first participant");
      if (!trimmedP2) missing.push("second participant");
      if (!trimmedShared) missing.push("what was shared");
      setSaveError(`Please complete: ${missing.join(", ")}`);
      return;
    }

    // Auth check — don't lose content
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      setSaveError("Your session expired. Please sign in again — your scroll content is still here.");
      return;
    }
    const activeUserId = session.user.id;

    setSubmitting(true);

    const payload = {
      user_id: activeUserId,
      moon_phase: phase,
      tree_name: trimmedTree,
      is_tree_real: isTreeReal,
      participant_one: trimmedP1,
      participant_two: trimmedP2,
      what_shared: trimmedShared,
      where_sitting: whereSitting.trim() || null,
      emotional_tone: emotionalTone || null,
    };
    console.log("TIME_TREE_SCROLL_PAYLOAD", payload);

    const { data, error } = await supabase
      .from("time_tree_entries")
      .insert(payload)
      .select()
      .single();

    setSubmitting(false);

    if (error) {
      console.error("TIME_TREE_SCROLL_ERROR", error);
      setSaveError(error.message?.includes("duplicate")
        ? "You've already saved a scroll today."
        : "Could not save your scroll. Your content is still here — please retry.");
      return;
    }

    setSaveError(null);
    setLastEntry(data as TimeTreeEntry);
    setStep(5);
    setAlreadySubmittedToday(true);
    fetchCollectiveStats();
    toast.success(`${(data as any).hearts_awarded > 0 ? `+${(data as any).hearts_awarded} Hearts earned` : "Entry saved"}`);

    // Loop closure: if this Time Tree entry references a dreamed tree, notify
    if ((data as any).tree_reference_id && activeUserId) {
      supabase
        .from("tree_wishlist")
        .select("id, trees(name)")
        .eq("user_id", activeUserId)
        .eq("tree_id", (data as any).tree_reference_id)
        .maybeSingle()
        .then(({ data: dream }) => {
          if (dream) {
            toast.success("You've woven a thread to a tree you dreamed of ⭐", {
              description: `Your Time Tree entry connects to ${(dream as any).trees?.name || "a dreamed tree"}.`,
              duration: 6000,
            });
          }
        });
    }
  };

  const convertToDream = async () => {
    if (!lastEntry || !userId) return;
    // For MVP: plant a dream via tree_wishlist if tree_reference_id exists
    // Otherwise just mark with pilgrimage flag
    const { error } = await supabase
      .from("time_tree_entries")
      .update({ pilgrimage_flag: true })
      .eq("id", lastEntry.id);

    if (!error) {
      toast.success("Marked as a dream to make real 🌱");
      setLastEntry({ ...lastEntry, pilgrimage_flag: true });
    }
  };

  const isNewMoon = phase === "new";
  const question = isNewMoon
    ? "If you could sit beneath any living tree on Earth, with any two people alive right now, where would you go, who would you take, and what would you share?"
    : "If you could teleport outside of time to any tree that has ever existed on Earth, and sit beneath it with any two people (living or passed), where would you go, who would you take, and what would you share?";

  const canProceed = useMemo(() => {
    switch (step) {
      case 1: return treeName.trim().length > 0;
      case 2: return participantOne.trim().length > 0 && participantTwo.trim().length > 0;
      case 3: return whatShared.trim().length > 0;
      case 4: return true; // tone is optional
      default: return true;
    }
  }, [step, treeName, participantOne, participantTwo, whatShared]);

  // ─── INTRO STEP ───
  if (step === 0) {
    return (
      <div className="space-y-6">
        {/* Moon phase toggle */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-full border border-border/40 bg-card/60 backdrop-blur p-1 gap-1">
            <button
              onClick={() => setPhase("full")}
              className={`px-4 py-2 rounded-full text-xs font-serif transition-all ${
                phase === "full" ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🌕 Full Moon
            </button>
            <button
              onClick={() => setPhase("new")}
              className={`px-4 py-2 rounded-full text-xs font-serif transition-all ${
                phase === "new" ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🌑 New Moon
            </button>
          </div>
        </div>

        {/* Central ritual card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-primary/20 bg-gradient-to-b from-card/80 to-card/50 backdrop-blur overflow-hidden">
            <CardContent className="py-8 px-6 text-center space-y-6">
              <div className="text-5xl">{getLunarEmoji(phase)}</div>
              <div>
                <Badge variant="outline" className="text-[10px] uppercase tracking-widest mb-3 font-serif">
                  {isNewMoon ? "Inside of Time" : "Outside of Time"}
                </Badge>
                <h2 className="text-xl font-serif text-primary leading-relaxed max-w-md mx-auto">
                  The Time Tree
                </h2>
              </div>
              <p className="text-sm text-card-foreground/70 font-serif leading-relaxed max-w-lg mx-auto italic">
                {question}
              </p>

              {alreadySubmittedToday ? (
                <div className="pt-2 space-y-3">
                  <p className="text-xs text-muted-foreground/60 font-serif">
                    You've already sat beneath the Time Tree today. Return tomorrow.
                  </p>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowHistory(!showHistory)}>
                    <Scroll className="w-3.5 h-3.5 mr-1.5" />
                    {showHistory ? "Hide" : "View"} your scrolls
                  </Button>
                </div>
              ) : userId ? (
                <Button variant="mystical" onClick={() => setStep(1)}>
                  Begin the Ritual <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button variant="mystical" asChild>
                  <Link to="/auth">Sign in to begin</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Past entries */}
        {(showHistory || !alreadySubmittedToday) && pastEntries.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground/60 font-serif text-center">Your Scrolls</h3>
            {pastEntries.slice(0, 5).map(entry => (
              <Card key={entry.id} className="border-border/30 bg-card/40">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{getLunarEmoji(entry.moon_phase)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-serif text-foreground/80">{entry.tree_name}</p>
                      <p className="text-[10px] text-muted-foreground/50">
                        with {entry.participant_one} & {entry.participant_two} ·{" "}
                        {new Date(entry.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </p>
                      {entry.meeting_realised && (
                        <Badge variant="outline" className="text-[9px] mt-1 border-primary/30 text-primary">Dream Embodied</Badge>
                      )}
                      {entry.pilgrimage_flag && !entry.meeting_realised && (
                        <Badge variant="outline" className="text-[9px] mt-1 border-accent/30 text-accent">Making Real</Badge>
                      )}
                    </div>
                    {entry.hearts_awarded > 0 && (
                      <span className="text-[10px] text-primary/60 font-serif flex items-center gap-0.5">
                        <Heart className="w-3 h-3 fill-primary/30" /> {entry.hearts_awarded}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Collective stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Entries", value: stats.total, icon: Scroll },
            { label: "Full Moon", value: stats.full, icon: Sun },
            { label: "New Moon", value: stats.new_, icon: Moon },
            { label: "Embodied", value: stats.realised, icon: Sparkles },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center py-3 rounded-xl bg-card/30 border border-border/20">
              <s.icon className="w-3.5 h-3.5 text-primary/50 mb-1" />
              <span className="text-sm font-serif font-bold text-foreground">{s.value}</span>
              <span className="text-[8px] text-muted-foreground/50 uppercase tracking-wider">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── SUBMITTED STEP ───
  if (step === 5 && lastEntry) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-primary/30 bg-gradient-to-b from-card/80 to-primary/[0.03] backdrop-blur overflow-hidden">
          <CardContent className="py-8 px-6 text-center space-y-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-5xl"
            >
              🌿
            </motion.div>
            <h2 className="text-lg font-serif text-primary">Your scroll is sealed</h2>
            <div className="bg-background/40 rounded-xl p-4 text-left space-y-2 border border-border/20">
              <p className="text-sm font-serif text-foreground/80">
                <span className="text-primary">{getLunarEmoji(lastEntry.moon_phase)}</span> Beneath <strong>{lastEntry.tree_name}</strong>
              </p>
              <p className="text-xs text-muted-foreground/60">
                With {lastEntry.participant_one} & {lastEntry.participant_two}
              </p>
              <p className="text-xs text-card-foreground/70 italic font-serif mt-2">"{lastEntry.what_shared}"</p>
              {lastEntry.emotional_tone && (
                <Badge variant="outline" className="text-[9px] mt-1">{lastEntry.emotional_tone}</Badge>
              )}
            </div>

            {lastEntry.hearts_awarded > 0 && (
              <div className="flex items-center justify-center gap-1.5 text-primary">
                <Heart className="w-4 h-4 fill-primary/30" />
                <span className="text-sm font-serif font-bold">+{lastEntry.hearts_awarded} Hearts</span>
              </div>
            )}

            {/* New Moon: Make This Real */}
            {isNewMoon && !lastEntry.pilgrimage_flag && (
              <div className="pt-2 space-y-2">
                <p className="text-xs text-muted-foreground/60 font-serif italic">Would you like help making this real?</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setStep(0)}>
                    Keep as Dream
                  </Button>
                  <Button variant="mystical" size="sm" className="text-xs h-8" onClick={convertToDream}>
                    <Star className="w-3.5 h-3.5 mr-1" /> Make This Real
                  </Button>
                </div>
              </div>
            )}

            {lastEntry.pilgrimage_flag && (
              <p className="text-xs text-primary/70 font-serif">🌱 Marked as a dream to make real</p>
            )}

            <Button variant="ghost" size="sm" className="text-xs mt-4" onClick={() => setStep(0)}>
              Return to the Time Tree
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ─── RITUAL STEPS 1-4 ───
  const stepTitles = [
    "",
    isNewMoon ? "Which living tree?" : "Which tree from any time?",
    "Who sits beside you?",
    "What do you share?",
    "How does it feel?",
  ];

  const stepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <Input
              placeholder={isNewMoon ? "A living tree, somewhere on Earth…" : "Any tree that ever existed…"}
              value={treeName}
              onChange={(e) => setTreeName(e.target.value)}
              className="font-serif text-sm bg-background/40"
              maxLength={500}
              autoFocus
            />
            {!isNewMoon && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTreeReal}
                  onChange={(e) => setIsTreeReal(e.target.checked)}
                  className="rounded border-border/40"
                />
                <span className="font-serif">This tree exists in the real world</span>
              </label>
            )}
            <Textarea
              placeholder="Describe where you sit beneath it…"
              value={whereSitting}
              onChange={(e) => setWhereSitting(e.target.value)}
              className="font-serif text-sm bg-background/40 min-h-[80px]"
              maxLength={500}
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-serif mb-1.5 block">
                First companion
              </label>
              <Input
                placeholder={isNewMoon ? "Someone alive today…" : "Anyone from any time…"}
                value={participantOne}
                onChange={(e) => setParticipantOne(e.target.value)}
                className="font-serif text-sm bg-background/40"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-serif mb-1.5 block">
                Second companion
              </label>
              <Input
                placeholder={isNewMoon ? "Someone alive today…" : "Anyone from any time…"}
                value={participantTwo}
                onChange={(e) => setParticipantTwo(e.target.value)}
                className="font-serif text-sm bg-background/40"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <Textarea
            placeholder="What do you share together beneath the tree?"
            value={whatShared}
            onChange={(e) => setWhatShared(e.target.value)}
            className="font-serif text-sm bg-background/40 min-h-[120px]"
            maxLength={2000}
            autoFocus
          />
        );
      case 4:
        return (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground/50 font-serif text-center">Choose an emotional tone (optional)</p>
            <div className="flex flex-wrap justify-center gap-2">
              {EMOTIONAL_TONES.map(tone => (
                <button
                  key={tone}
                  onClick={() => setEmotionalTone(emotionalTone === tone ? "" : tone)}
                  className={`px-3 py-1.5 rounded-full text-xs font-serif transition-all border ${
                    emotionalTone === tone
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "border-border/30 text-muted-foreground/60 hover:border-border/50 hover:text-foreground/70"
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-primary/20 bg-gradient-to-b from-card/80 to-card/50 backdrop-blur overflow-hidden">
        <CardContent className="py-6 px-5 space-y-5">
          {/* Header */}
          <div className="text-center space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-serif">
              {getLunarEmoji(phase)} {isNewMoon ? "Inside of Time" : "Outside of Time"} · Step {step} of 4
            </p>
            <h3 className="text-base font-serif text-primary">{stepTitles[step]}</h3>
          </div>

          <StepDots current={step - 1} total={4} />

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {stepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8"
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>

            {step < 4 ? (
              <Button
                variant="mystical"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed}
              >
                Continue <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            ) : (
              <Button
                variant="mystical"
                size="sm"
                className="h-8 text-xs"
                onClick={handleSubmit}
                disabled={submitting || !canProceed}
              >
                {submitting ? (
                  "Sealing…"
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1" /> Seal this Scroll
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TimeTreeGame;
