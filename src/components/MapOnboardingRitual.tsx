import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TreeDeciduous, MapPin, Sparkles, X } from "lucide-react";

const RITUAL_SEEN_KEY = "s33d-map-ritual-seen";

/**
 * MapOnboardingRitual — a floating, immersive first-visit overlay
 * that guides users to their first tree interaction through action,
 * not instruction. Appears once per device, dissolves after interaction.
 */
const MapOnboardingRitual = () => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(RITUAL_SEEN_KEY)) return;
    } catch {}
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(RITUAL_SEEN_KEY, "1"); } catch {}
  };

  const steps = [
    {
      icon: <MapPin className="w-5 h-5" />,
      title: "You've arrived.",
      message: "Every glowing marker is an Ancient Friend — a tree someone has loved enough to place on this living atlas.",
      cta: "Show me",
    },
    {
      icon: <TreeDeciduous className="w-5 h-5" />,
      title: "Tap any tree.",
      message: "Meet the tree, leave a photo, poem, or song. Your offering becomes part of its living story.",
      cta: "I understand",
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Your actions echo.",
      message: "Every offering plants seeds, grows hearts, and deepens the roots of this world. The atlas changes because of you.",
      cta: "Begin exploring",
    },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 z-[1100] flex items-end justify-center pb-28 px-4 pointer-events-none"
        >
          {/* Soft bottom vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(to top, hsla(30, 15%, 6%, 0.7) 0%, transparent 50%)",
            }}
          />

          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative max-w-sm w-full pointer-events-auto"
          >
            <div
              className="rounded-2xl p-5 border"
              style={{
                background: "hsla(30, 20%, 8%, 0.96)",
                borderColor: "hsla(42, 50%, 35%, 0.4)",
                backdropFilter: "blur(16px)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 20px hsla(42, 60%, 40%, 0.08)",
              }}
            >
              {/* Dismiss */}
              <button
                onClick={dismiss}
                className="absolute top-3 right-3 p-1.5 rounded-full transition-colors"
                style={{ color: "hsl(42, 40%, 45%)" }}
                aria-label="Skip"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                style={{
                  background: "hsla(42, 60%, 40%, 0.15)",
                  color: "hsl(42, 80%, 60%)",
                }}
              >
                {steps[step].icon}
              </div>

              <h3
                className="text-base font-serif tracking-wide mb-1.5"
                style={{ color: "hsl(45, 80%, 65%)" }}
              >
                {steps[step].title}
              </h3>

              <p
                className="text-sm leading-relaxed mb-4"
                style={{ color: "hsl(42, 30%, 60%)", fontFamily: "'Inter', sans-serif" }}
              >
                {steps[step].message}
              </p>

              <div className="flex items-center justify-between">
                {/* Step dots */}
                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        background: i === step ? "hsl(42, 80%, 55%)" : "hsla(42, 40%, 40%, 0.3)",
                        width: i === step ? "12px" : "6px",
                      }}
                    />
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (step < steps.length - 1) {
                      setStep(step + 1);
                    } else {
                      dismiss();
                    }
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-serif tracking-wider transition-all active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, hsl(42, 88%, 50%), hsl(45, 100%, 60%))",
                    color: "hsl(80, 20%, 8%)",
                    fontWeight: 700,
                  }}
                >
                  {steps[step].cta}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MapOnboardingRitual;

export function resetMapRitual() {
  localStorage.removeItem(RITUAL_SEEN_KEY);
}
