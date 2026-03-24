/**
 * DailySeedRitual — once-per-day welcome moment.
 * Shows a gentle overlay: "3 seeds await planting today."
 * Uses localStorage to fire only once per calendar day.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Sprout, MapPin, TreeDeciduous } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "s33d-ritual-date";

const DailySeedRitual = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown === today) return;

    // Only show for logged-in users
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // Small delay so the page loads first
        setTimeout(() => setVisible(true), 600);
      }
    });
  }, []);

  const dismiss = () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(STORAGE_KEY, today);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          style={{ background: "hsl(var(--background) / 0.85)", backdropFilter: "blur(12px)" }}
          onClick={dismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient glow */}
            <div
              className="absolute inset-0 -z-10 rounded-3xl"
              style={{
                background: "radial-gradient(ellipse at 50% 40%, hsl(var(--primary) / 0.08), transparent 70%)",
              }}
            />

            {/* Sprouting icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: "hsl(var(--primary) / 0.1)",
                boxShadow: "0 0 60px 20px hsl(var(--primary) / 0.08)",
              }}
            >
              <Sprout className="w-10 h-10 text-primary" />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-2xl font-serif text-foreground tracking-wide"
            >
              33 seeds await planting today.
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="text-sm font-serif text-muted-foreground/70 mt-3 tracking-wider"
            >
              Plant them where the forest calls you.
            </motion.p>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"
            >
              <Button
                onClick={dismiss}
                className="font-serif tracking-wider gap-2 h-11 px-6"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))",
                  boxShadow: "0 4px 20px hsl(var(--primary) / 0.2)",
                }}
              >
                <TreeDeciduous className="w-4 h-4" />
                Begin exploring
              </Button>
              <Link to="/map" onClick={dismiss}>
                <Button
                  variant="outline"
                  className="font-serif tracking-wider gap-2 h-11 px-6 border-primary/25 hover:bg-primary/5"
                >
                  <MapPin className="w-4 h-4" />
                  Go to the map
                </Button>
              </Link>
            </motion.div>

            {/* Gentle seed counter */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.4 }}
              className="mt-6 text-[11px] text-muted-foreground/40 font-serif tracking-widest"
            >
              🌱 33 / 33
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DailySeedRitual;
