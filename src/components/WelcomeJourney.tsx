/**
 * WelcomeJourney — A gentle prompt for logged-out / first-time users
 * that surfaces on the Hero section to guide them into the core journey:
 * Map → Tree → Contribute.
 * 
 * Appears below the Hero CTAs. Dismissible and remembers state.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, TreeDeciduous, Heart, ChevronRight, X } from "lucide-react";
import { Link } from "react-router-dom";

const DISMISSED_KEY = "s33d_welcome_journey_dismissed";

const JOURNEY_STEPS = [
  {
    icon: MapPin,
    title: "Explore the Atlas",
    description: "Discover ancient trees mapped by guardians around the world.",
    link: "/map",
    cta: "Open the Map",
  },
  {
    icon: TreeDeciduous,
    title: "Meet a Tree",
    description: "Tap any marker to read its story, see its offerings, and hear its song.",
    link: "/map",
    cta: "Find a Tree",
  },
  {
    icon: Heart,
    title: "Leave Your Mark",
    description: "Add a photo, poem, or observation. Every offering earns S33D Hearts.",
    link: "/add-tree",
    cta: "Map a Tree",
  },
];

interface WelcomeJourneyProps {
  isLoggedIn: boolean;
}

const WelcomeJourney = ({ isLoggedIn }: WelcomeJourneyProps) => {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Only show for logged-out users who haven't dismissed
    if (isLoggedIn) return;
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
    } catch {}
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISSED_KEY, "1"); } catch {}
  };

  if (!visible) return null;

  const current = JOURNEY_STEPS[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm mx-auto"
      >
        <div
          className="rounded-2xl border border-primary/20 backdrop-blur-md overflow-hidden"
          style={{
            background: "hsl(var(--card) / 0.75)",
          }}
        >
          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 pt-3 pb-1">
            {JOURNEY_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "bg-primary w-6" : "bg-muted-foreground/20 w-1.5 hover:bg-muted-foreground/30"
                }`}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>

          <div className="p-4 space-y-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-primary/20 bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-serif font-bold text-foreground">{current.title}</h3>
                  <p className="text-xs text-muted-foreground/70 leading-relaxed mt-0.5">{current.description}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={dismiss}
                className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors font-serif"
              >
                Skip
              </button>
              <div className="flex items-center gap-2">
                <Link
                  to={current.link}
                  onClick={dismiss}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-serif bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                >
                  {current.cta}
                </Link>
                {step < JOURNEY_STEPS.length - 1 && (
                  <button
                    onClick={() => setStep(step + 1)}
                    className="p-1.5 rounded-lg hover:bg-secondary/30 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WelcomeJourney;
