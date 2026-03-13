/**
 * EncounterEconomyManifesto — Philosophical scroll for the Golden Dream page.
 * Expandable manifesto section: "The Living Value Breath Cycle"
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Leaf } from "lucide-react";
import { Link } from "react-router-dom";

const EncounterEconomyManifesto = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div id="encounter-economy" className="space-y-6 scroll-mt-28">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <Leaf className="w-6 h-6 text-primary/60" />
        </div>
        <h2 className="text-2xl md:text-3xl font-serif text-foreground tracking-wide">
          The Encounter Economy
        </h2>
        <p className="text-sm text-muted-foreground font-serif max-w-lg mx-auto leading-relaxed italic">
          A philosophy of value rooted in encounter, not extraction.
        </p>
      </div>

      <div
        className="rounded-2xl border border-border/30 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(42 30% 12% / 0.6), hsl(28 20% 10% / 0.7))",
          boxShadow: "0 0 40px hsl(42 70% 40% / 0.08)",
        }}
      >
        <div className="p-6 md:p-8 space-y-5">
          <p className="text-base md:text-lg font-serif leading-relaxed" style={{ color: "hsl(42 60% 75%)" }}>
            Breath is the only payment required to exist on Earth.
          </p>
          <p className="text-base md:text-lg font-serif leading-relaxed" style={{ color: "hsl(42 50% 70%)" }}>
            Everything else grows from encounter.
          </p>

          <div className="border-t border-border/20 pt-5 space-y-4">
            <p className="text-sm font-serif text-muted-foreground leading-relaxed">
              In the Encounter Economy, value does not begin with a transaction. It begins with presence — the simple act of showing up, of meeting the world as it is.
            </p>
            <p className="text-sm font-serif text-muted-foreground leading-relaxed">
              When you encounter an Ancient Friend — a tree that has witnessed centuries — something shifts. That shift is the seed of all participation.
            </p>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-xs font-serif transition-colors mx-auto"
            style={{ color: "hsl(42 60% 60%)" }}
          >
            <span>{expanded ? "Close the scroll" : "Unfurl the Living Value Breath Cycle"}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6 overflow-hidden"
              >
                <div className="border-t border-border/20 pt-6 space-y-4">
                  <h3 className="text-sm font-serif uppercase tracking-[0.2em]" style={{ color: "hsl(42 60% 60%)" }}>
                    The Living Value Breath Cycle
                  </h3>

                  {[
                    {
                      title: "Breath",
                      text: "Presence precedes all value. Before we map, before we offer, before we exchange — we breathe. The breath is the first and most ancient economy.",
                    },
                    {
                      title: "Encounter",
                      text: "Value begins when we meet something alive. An Ancient Friend. A fellow wanderer. A species we've never seen. Encounter is the spark from which everything else grows.",
                    },
                    {
                      title: "Contribution",
                      text: "Encounters naturally lead to participation. We map. We photograph. We tell stories. We verify. We offer poems, songs, field notes. Contribution is the act of giving back to the commons.",
                    },
                    {
                      title: "Harvest",
                      text: "Contributions accumulate into living knowledge. Tree records grow richer. Cultural memory deepens. Seed libraries expand. The Heartwood Library becomes the harvest of collective stewardship.",
                    },
                    {
                      title: "Exchange",
                      text: "Harvest circulates through the Vault — as S33D Hearts, as Species Hearts, as NFTrees, as rewards. But unlike extractive economies, exchange here is designed to fuel new encounters, not deplete the commons.",
                    },
                  ].map((phase, i) => (
                    <motion.div
                      key={phase.title}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="space-y-1"
                    >
                      <h4 className="text-xs font-serif font-medium" style={{ color: "hsl(42 60% 65%)" }}>
                        {phase.title}
                      </h4>
                      <p className="text-[12px] font-serif text-muted-foreground leading-relaxed">
                        {phase.text}
                      </p>
                    </motion.div>
                  ))}

                  <div className="border-t border-border/20 pt-5">
                    <p className="text-sm font-serif italic text-center" style={{ color: "hsl(42 50% 65%)" }}>
                      Breath → Encounter → Contribution → Harvest → Exchange
                    </p>
                    <p className="text-xs font-serif text-muted-foreground/60 text-center mt-2">
                      The cycle continues. The tree keeps growing.
                    </p>
                  </div>

                  <div className="text-center pt-2">
                    <Link
                      to="/value-tree"
                      className="text-[11px] font-serif text-primary/70 hover:text-primary transition-colors"
                    >
                      See the cycle alive in the Value Tree →
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default EncounterEconomyManifesto;
