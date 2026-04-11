/**
 * TreeStorySection — Lore + History panel for tree profiles.
 * Two-column desktop / stacked mobile: narrative left, structured data right.
 */
import { motion } from "framer-motion";
import TreeLoreSection from "@/components/TreeLoreSection";
import TreeStructuredDataCard from "./TreeStructuredDataCard";
import type { Database } from "@/integrations/supabase/types";
import type { SpeciesResolution } from "@/services/speciesResolver";

type Tree = Database["public"]["Tables"]["trees"]["Row"];

interface TreeStorySectionProps {
  tree: Tree;
  ecoBelonging: Array<{ id: string; name: string; type: string }>;
  speciesResolution?: SpeciesResolution | null;
}

const TreeStorySection = ({ tree, ecoBelonging, speciesResolution }: TreeStorySectionProps) => {
  const hasLore = (tree as any).lore_text || (tree as any).elemental_signature || (tree as any).archetype;
  if (!hasLore && !tree.description) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.3), transparent)" }} />
        <h2 className="text-lg font-serif text-primary tracking-[0.2em] uppercase">Story</h2>
        <div className="h-px flex-1" style={{ background: "linear-gradient(270deg, hsl(var(--primary) / 0.3), transparent)" }} />
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Left: Narrative */}
        <div className="md:col-span-3 space-y-4">
          {/* Lore section (archetype, elements, poetic text) */}
          <TreeLoreSection
            loreText={(tree as any).lore_text}
            elementalSignature={(tree as any).elemental_signature}
            archetype={(tree as any).archetype}
            seasonalTone={(tree as any).seasonal_tone}
          />

          {/* Standard description (if different from lore) */}
          {tree.description && !(tree as any).lore_text && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="border-l-2 border-primary/30 pl-4"
            >
              <p className="text-foreground/70 font-serif leading-relaxed text-sm">
                {tree.description}
              </p>
            </motion.div>
          )}
        </div>

        {/* Right: Structured Data Card */}
        <div className="md:col-span-2">
          <TreeStructuredDataCard tree={tree} ecoBelonging={ecoBelonging} speciesResolution={speciesResolution} />
        </div>
      </div>
    </section>
  );
};

export default TreeStorySection;
