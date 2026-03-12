/**
 * StaffPatronValueCard — Four-dimension value display for staff patrons.
 * Shows what patrons receive, seed, grow, and their founding role.
 * Used in Staff Room and Value Tree.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  PATRON_VALUE_DIMENSIONS,
  PATRON_DONATION_GBP,
  PATRON_STARTING_HEARTS,
  PATRON_FLOW_STEPS,
  type PatronValueDimension,
} from "@/data/staffPatronValue";

interface Props {
  /** Compact mode hides the flow visualization */
  compact?: boolean;
}

const StaffPatronValueCard = ({ compact = false }: Props) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Poetic intro */}
      {!compact && (
        <div className="text-center space-y-2 py-3">
          <p className="text-sm font-serif text-muted-foreground italic leading-relaxed max-w-xl mx-auto">
            To claim a staff is not to buy an object — it is to enter a living role
            in the ecosystem. Your donation of{" "}
            <span className="text-foreground font-medium">£{PATRON_DONATION_GBP.toLocaleString()}</span>{" "}
            seeds the forest and begins your journey as a founding patron.
          </p>
        </div>
      )}

      {/* Flow visualization */}
      {!compact && (
        <div className="flex items-center justify-center gap-1 py-4 overflow-x-auto">
          {PATRON_FLOW_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-1 shrink-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl border border-border/30 bg-card/20 min-w-[80px]"
              >
                <span className="text-lg">{step.icon}</span>
                <span className="text-[10px] font-serif text-foreground font-medium leading-tight text-center">
                  {step.label}
                </span>
                <span className="text-[8px] font-serif text-muted-foreground text-center">
                  {step.sublabel}
                </span>
              </motion.div>
              {i < PATRON_FLOW_STEPS.length - 1 && (
                <span className="text-muted-foreground/30 text-xs shrink-0">→</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Four value dimensions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {PATRON_VALUE_DIMENSIONS.map((dim, i) => (
          <DimensionCard
            key={dim.id}
            dimension={dim}
            index={i}
            expanded={expanded === dim.id}
            onToggle={() => setExpanded(expanded === dim.id ? null : dim.id)}
          />
        ))}
      </div>
    </div>
  );
};

const DimensionCard = ({
  dimension, index, expanded, onToggle,
}: {
  dimension: PatronValueDimension; index: number;
  expanded: boolean; onToggle: () => void;
}) => (
  <motion.button
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.06 }}
    onClick={onToggle}
    className="w-full text-left rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm hover:border-primary/20 transition-all overflow-hidden"
  >
    <div className="flex items-center gap-2.5 px-4 py-3">
      <span
        className="text-lg shrink-0"
        style={{ filter: `drop-shadow(0 0 4px ${dimension.color})` }}
      >
        {dimension.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-serif text-foreground font-medium">{dimension.title}</p>
        <p className="text-[9px] font-serif text-muted-foreground">
          {dimension.items.length} aspects
        </p>
      </div>
      {expanded ? (
        <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      ) : (
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      )}
    </div>

    <AnimatePresence>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="px-4 pb-3.5 pt-0.5 space-y-1.5">
            <div
              className="h-px w-full mb-2"
              style={{
                background: `linear-gradient(90deg, transparent, ${dimension.color}, transparent)`,
                opacity: 0.3,
              }}
            />
            {dimension.items.map((item, j) => (
              <div key={j} className="flex items-start gap-2">
                <span
                  className="w-1 h-1 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: dimension.color }}
                />
                <p className="text-[10px] font-serif text-muted-foreground leading-relaxed">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.button>
);

export default StaffPatronValueCard;
