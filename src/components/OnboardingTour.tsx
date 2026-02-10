import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, BookOpen, Leaf, Sparkles, TreeDeciduous, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const TOUR_KEY = "ancient-friends-tour-seen";

const steps = [
  {
    icon: TreeDeciduous,
    title: "Welcome, Ancient Friend",
    description:
      "You've arrived at a living atlas — a place where ancient trees are honoured, mapped, and woven into a planetary web of care.",
    cta: null,
  },
  {
    icon: MapPin,
    title: "The Arboreal Atlas",
    description:
      "Explore our collective map of ancient trees. Add your own encounters, leave offerings of poetry, song, and story at each tree's roots.",
    cta: { label: "Open the Atlas", to: "/map" },
  },
  {
    icon: BookOpen,
    title: "The HeARTwood Library",
    description:
      "Nine rooms of wonder — from the Staff Room's 144 ceremonial staffs to the Music Room's species-tuned radio stations and the Seed Cellar archive.",
    cta: { label: "Enter the Library", to: "/gallery" },
  },
  {
    icon: Leaf,
    title: "Council of Life",
    description:
      "A space for collective governance and ecological dialogue, where voices gather to protect and celebrate the living world.",
    cta: { label: "Join the Council", to: "/council-of-life" },
  },
  {
    icon: Sparkles,
    title: "Join the Grove",
    description:
      "Create your Hearth, claim tree encounters, and become part of a growing community dedicated to the ancient friends who root our world.",
    cta: { label: "Create your Hearth", to: "/auth" },
  },
];

const OnboardingTour = () => {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) {
      const timer = setTimeout(() => setVisible(true), 1800);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(TOUR_KEY, "true");
  };

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else dismiss();
  };

  if (!visible) return null;

  const current = steps[step];
  const Icon = current.icon;
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={dismiss} />

          {/* Card */}
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative w-full max-w-md bg-card border border-primary/30 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Progress bar */}
            <div className="h-1 bg-muted">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Close */}
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label="Close tour"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 pt-5 space-y-4">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h3 className="text-xl font-serif font-bold text-foreground">{current.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i === step ? "bg-primary w-5" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                      aria-label={`Go to step ${i + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {current.cta && (
                    <Button variant="ghost" size="sm" className="text-xs" asChild onClick={dismiss}>
                      <Link to={current.cta.to}>{current.cta.label}</Link>
                    </Button>
                  )}
                  <Button variant="mystical" size="sm" onClick={next}>
                    {step < steps.length - 1 ? (
                      <>
                        Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </>
                    ) : (
                      "Begin your journey"
                    )}
                  </Button>
                </div>
              </div>

              {/* Skip */}
              {step === 0 && (
                <p className="text-center text-[11px] text-muted-foreground/60 pt-1">
                  <button onClick={dismiss} className="underline underline-offset-2 hover:text-muted-foreground transition-colors">
                    Skip tour
                  </button>
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTour;
