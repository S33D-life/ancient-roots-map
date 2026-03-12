/**
 * PatronFlowBanner — Shows how staff claims seed the wider economy.
 * Used on the Value Tree / Living Economy tab.
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Wand2 } from "lucide-react";
import {
  PATRON_DONATION_GBP,
  PATRON_STARTING_HEARTS,
  PATRON_INFLUENCE_BONUS,
  PATRON_FLOW_STEPS,
} from "@/data/staffPatronValue";

const PatronFlowBanner = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden"
  >
    {/* Gold accent line */}
    <div
      className="h-0.5"
      style={{
        background: "linear-gradient(90deg, transparent, hsl(42 85% 55% / 0.5), hsl(280 60% 55% / 0.3), transparent)",
      }}
    />

    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Wand2 className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-serif tracking-wide text-foreground">
          Staff Room — Founding Patron Offering
        </h3>
      </div>

      {/* Explanation */}
      <p className="text-[11px] font-serif text-muted-foreground leading-relaxed max-w-2xl">
        Each handcrafted staff claimed through the founding donation of{" "}
        <span className="text-foreground">£{PATRON_DONATION_GBP.toLocaleString()}</span>{" "}
        seeds the ecosystem at its roots. Patrons receive{" "}
        <span className="text-foreground">{PATRON_STARTING_HEARTS.toLocaleString()} S33D Hearts</span>,{" "}
        <span className="text-foreground">{PATRON_INFLUENCE_BONUS} Influence</span>,{" "}
        and a founding role in the Initial Garden Offering channel.
      </p>

      {/* Mini flow */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        {PATRON_FLOW_STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/20 bg-card/20">
              <span className="text-sm">{step.icon}</span>
              <span className="text-[9px] font-serif text-foreground">{step.label}</span>
            </div>
            {i < PATRON_FLOW_STEPS.length - 1 && (
              <span className="text-muted-foreground/20 text-[10px]">→</span>
            )}
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap gap-2">
        <Link
          to="/patron-offering"
          className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all"
        >
          <span className="text-xs font-serif text-foreground group-hover:text-primary transition-colors">
            Founding Patron Offering
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </Link>
        <Link
          to="/library/staff-room"
          className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border/20 bg-card/20 hover:border-primary/20 transition-all"
        >
          <span className="text-xs font-serif text-muted-foreground group-hover:text-foreground transition-colors">
            Enter the Staff Room
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
        </Link>
      </div>
    </div>
  </motion.div>
);

export default PatronFlowBanner;
