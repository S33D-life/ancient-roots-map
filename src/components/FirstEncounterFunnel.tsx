import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TreeDeciduous, MapPin, Camera, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface FirstEncounterFunnelProps {
  userId: string;
}

const FUNNEL_DISMISSED_KEY = "s33d_first_encounter_dismissed";

const STEPS = [
  {
    icon: TreeDeciduous,
    title: "Meet an Ancient Friend",
    body: "Every great journey begins beside a tree. An ancient friend is waiting to be discovered — perhaps one you already know.",
    accent: "120 40% 42%",
  },
  {
    icon: MapPin,
    title: "Open the Atlas",
    body: "The living map holds thousands of trees across the world. Find one near you, or drop a pin where you've stood in the shade of an elder.",
    accent: "200 50% 50%",
    cta: { label: "Open the Atlas", to: "/map" },
  },
  {
    icon: Camera,
    title: "Claim Your First Encounter",
    body: "Take a photo, name the species if you can, and mark where it stands. That single act begins your legend in the grove.",
    accent: "30 70% 50%",
    cta: { label: "Map an Ancient Friend", to: "/add-tree" },
  },
];

const FirstEncounterFunnel = ({ userId }: FirstEncounterFunnelProps) => {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Don't show if previously dismissed
    if (localStorage.getItem(FUNNEL_DISMISSED_KEY)) {
      setChecking(false);
      return;
    }

    const check = async () => {
      // Check if user has any trees or check-ins — if so, they've already encountered
      const [treesRes, checkinsRes] = await Promise.all([
        supabase.from("trees").select("id", { count: "exact", head: true }).eq("created_by", userId),
        supabase.from("tree_checkins").select("id", { count: "exact", head: true }).eq("user_id", userId),
      ]);

      const hasActivity = (treesRes.count ?? 0) > 0 || (checkinsRes.count ?? 0) > 0;

      if (!hasActivity) {
        // Small delay so the dashboard renders first
        setTimeout(() => setVisible(true), 600);
      } else {
        // Auto-dismiss for users who already have activity
        localStorage.setItem(FUNNEL_DISMISSED_KEY, "1");
      }
      setChecking(false);
    };
    check();
  }, [userId]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(FUNNEL_DISMISSED_KEY, "1");
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else dismiss();
  };

  if (checking || !visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="rounded-2xl border-2 border-primary/40 overflow-hidden backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, hsl(${current.accent} / 0.08), hsl(var(--card) / 0.9))`,
          }}
        >
          {/* Progress */}
          <div className="h-1 bg-muted/30">
            <motion.div
              className="h-full bg-primary"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <div className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center border border-primary/20"
                  style={{ background: `hsl(${current.accent} / 0.15)` }}
                >
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-serif">
                    First Encounter · Step {step + 1} of {STEPS.length}
                  </p>
                  <h3 className="text-base font-serif font-bold text-primary mt-0.5">{current.title}</h3>
                </div>
              </div>
            </div>

            {/* Body */}
            <AnimatePresence mode="wait">
              <motion.p
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
                className="text-sm text-card-foreground/80 leading-relaxed font-serif"
              >
                {current.body}
              </motion.p>
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              {/* Dots */}
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === step ? "bg-primary w-5" : "bg-muted-foreground/25 w-2 hover:bg-muted-foreground/40"
                    }`}
                    aria-label={`Step ${i + 1}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {"cta" in current && current.cta && (
                  <Button variant="ghost" size="sm" className="text-xs h-8" asChild onClick={dismiss}>
                    <Link to={current.cta.to}>
                      {current.cta.label}
                    </Link>
                  </Button>
                )}
                <Button
                  variant="mystical"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={next}
                >
                  {step < STEPS.length - 1 ? (
                    <>Next <ChevronRight className="w-3.5 h-3.5 ml-0.5" /></>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-1" /> Begin
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Skip */}
            {step === 0 && (
              <p className="text-center text-[10px] text-muted-foreground/40">
                <button onClick={dismiss} className="underline underline-offset-2 hover:text-muted-foreground/60 transition-colors">
                  I already know my way around
                </button>
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FirstEncounterFunnel;
