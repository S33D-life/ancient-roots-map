/**
 * SeasonalMomentPanel — "Current Moment" display
 *
 * Shows the active ceremonial timing context: season, lunar phase,
 * active events, and offering prompts. Compact and atmospheric.
 */
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useSeasonalContext, type CeremonialEvent, type OfferingPrompt } from "@/hooks/use-seasonal-offerings";

interface SeasonalMomentPanelProps {
  hemisphere?: "north" | "south";
  includeMayan?: boolean;
  /** Called when user taps a prompt — opens offering dialog with suggested type */
  onPromptSelect?: (prompt: OfferingPrompt) => void;
  /** Compact variant for embedding in dialogs */
  compact?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  solar: "Solar Cycle",
  lunar: "Lunar Phase",
  cross_quarter: "Threshold Day",
  ecological: "Ecological Cycle",
  cultural: "Cultural Celebration",
  mayan: "Mayan Calendar",
  sky: "Sky Event",
};

const SeasonalMomentPanel = ({
  hemisphere,
  includeMayan,
  onPromptSelect,
  compact = false,
}: SeasonalMomentPanelProps) => {
  const ctx = useSeasonalContext({ hemisphere, includeMayan });
  const [expanded, setExpanded] = useState(false);

  // Pick top 2 prompts for compact view
  const topPrompts = ctx.activePrompts.slice(0, compact ? 1 : 3);
  const hasMore = ctx.activePrompts.length > topPrompts.length;

  // Non-season active events (season is always present, so skip it)
  const specialEvents = ctx.activeEvents.filter(
    (e) => e.category !== "solar" || !e.id.startsWith("season-")
  );

  if (compact) {
    // Compact: single-line prompt with seasonal emoji
    const prompt = topPrompts[0];
    if (!prompt) return null;

    return (
      <motion.button
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => onPromptSelect?.(prompt)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/20 border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
      >
        <span className="text-base flex-shrink-0">{prompt.emoji || ctx.seasonEmoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-serif text-foreground/80 truncate">{prompt.text}</p>
          <p className="text-[10px] text-muted-foreground font-serif">
            {ctx.lunarEmoji} {ctx.lunarPhaseName} · {ctx.seasonEmoji} {ctx.seasonLabel}
          </p>
        </div>
        <Sparkles className="w-3.5 h-3.5 text-primary/40 group-hover:text-primary/70 transition-colors flex-shrink-0" />
      </motion.button>
    );
  }

  // Full panel
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/40 bg-card/60 backdrop-blur overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 pb-2 flex items-center gap-2">
        <span className="text-lg">{ctx.seasonEmoji}</span>
        <div className="flex-1">
          <h3 className="font-serif text-sm tracking-wide text-foreground">
            This Moment
          </h3>
          <p className="text-[10px] text-muted-foreground font-serif">
            {ctx.lunarEmoji} {ctx.lunarPhaseName} · {ctx.seasonLabel}
            {ctx.mayan && ` · ${ctx.mayan.signGlyph}`}
          </p>
        </div>
      </div>

      {/* Special events badges */}
      {specialEvents.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {specialEvents.map((ev) => (
            <span
              key={ev.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-serif bg-primary/10 text-primary border border-primary/20"
              title={ev.description}
            >
              {ev.emoji} {ev.name}
            </span>
          ))}
        </div>
      )}

      {/* Offering prompts */}
      <div className="px-4 pb-3 space-y-1.5">
        {topPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onPromptSelect?.(prompt)}
            className={`w-full text-left flex items-start gap-2 px-3 py-2.5 rounded-lg transition-all group ${
              prompt.intensity === "ceremonial"
                ? "bg-primary/10 border border-primary/20 hover:bg-primary/15"
                : "bg-secondary/15 border border-border/20 hover:border-primary/20 hover:bg-primary/5"
            }`}
          >
            <span className="text-sm mt-0.5 flex-shrink-0">{prompt.emoji || "🌿"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-serif text-foreground/85 leading-relaxed">
                {prompt.text}
              </p>
              {prompt.suggestedType && (
                <p className="text-[10px] text-muted-foreground/60 font-serif mt-0.5">
                  Suggested: {prompt.suggestedType}
                </p>
              )}
            </div>
            <Sparkles className="w-3 h-3 text-primary/30 group-hover:text-primary/60 transition-colors mt-1 flex-shrink-0" />
          </button>
        ))}
      </div>

      {/* Expandable: more prompts + upcoming events */}
      {(hasMore || ctx.upcomingEvents.length > 0) && (
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-serif text-muted-foreground hover:text-primary/70 transition-colors border-t border-border/20">
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
            {expanded ? "Show less" : `More prompts & upcoming`}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-3 space-y-1.5">
              {ctx.activePrompts.slice(topPrompts.length).map((prompt, i) => (
                <button
                  key={`more-${i}`}
                  onClick={() => onPromptSelect?.(prompt)}
                  className="w-full text-left flex items-start gap-2 px-3 py-2 rounded-lg bg-secondary/10 border border-border/15 hover:border-primary/20 hover:bg-primary/5 transition-all"
                >
                  <span className="text-sm mt-0.5">{prompt.emoji || "🌿"}</span>
                  <p className="text-xs font-serif text-foreground/70 leading-relaxed flex-1">
                    {prompt.text}
                  </p>
                </button>
              ))}

              {/* Upcoming events */}
              {ctx.upcomingEvents.length > 0 && (
                <div className="pt-2 space-y-1">
                  <p className="text-[10px] font-serif text-muted-foreground/60 uppercase tracking-wider">
                    Coming Soon
                  </p>
                  {ctx.upcomingEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/10 text-xs font-serif text-muted-foreground"
                    >
                      <span>{ev.emoji}</span>
                      <span className="flex-1">{ev.name}</span>
                      <span className="text-[10px] text-muted-foreground/50">
                        {ev.dateRange.start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </motion.div>
  );
};

export default SeasonalMomentPanel;
