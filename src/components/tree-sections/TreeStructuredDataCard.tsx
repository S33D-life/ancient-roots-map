/**
 * TreeStructuredDataCard — Minimal sacred card showing structured tree metadata.
 * Reusable across all tree profile pages.
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { TreeDeciduous, MapPin, Globe, Calendar, Leaf, Shield } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import type { SpeciesResolution } from "@/services/speciesResolver";
import SpeciesNameLink from "@/components/treeasurus/SpeciesNameLink";

type Tree = Database["public"]["Tables"]["trees"]["Row"];

interface Props {
  tree: Tree;
  ecoBelonging: Array<{ id: string; name: string; type: string }>;
  speciesResolution?: SpeciesResolution | null;
}

const ROW = "flex items-start justify-between py-2 border-b border-border/20 last:border-b-0";
const LABEL = "text-[11px] text-muted-foreground font-serif tracking-wider uppercase flex items-center gap-1.5";
const VALUE = "text-sm font-serif text-foreground/80 text-right max-w-[60%]";

const TreeStructuredDataCard = ({ tree, ecoBelonging, speciesResolution }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-xl border border-border/30 overflow-hidden"
      style={{
        background: "linear-gradient(160deg, hsl(var(--card) / 0.8), hsl(var(--secondary) / 0.4))",
      }}
    >
      <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)" }} />

      <div className="px-4 py-3 border-b border-border/20">
        <span className="text-[10px] uppercase tracking-[0.3em] text-primary/70 font-serif">Tree Record</span>
      </div>

      <div className="px-4 py-2">
        <div className={ROW}>
          <span className={LABEL}><TreeDeciduous className="w-3 h-3" /> Species</span>
          <span className={`${VALUE} flex flex-col items-end`}>
            <SpeciesNameLink
              speciesKey={(tree as any).species_key}
              fallbackLabel={speciesResolution?.displayName || tree.species}
              showAlternates
            />
            {speciesResolution?.scientificName && speciesResolution.scientificName !== (speciesResolution?.displayName || tree.species) && (
              <span className="text-[10px] italic text-muted-foreground/50">{speciesResolution.scientificName}</span>
            )}
          </span>
        </div>

        {(speciesResolution?.family || tree.lineage) && (
          <div className={ROW}>
            <span className={LABEL}><Leaf className="w-3 h-3" /> Family</span>
            <span className={VALUE}>{speciesResolution?.family || tree.lineage}</span>
          </div>
        )}

        {tree.estimated_age && (
          <div className={ROW}>
            <span className={LABEL}><Calendar className="w-3 h-3" /> Age</span>
            <span className={VALUE}>~{tree.estimated_age} years</span>
          </div>
        )}

        {tree.state && (
          <div className={ROW}>
            <span className={LABEL}><MapPin className="w-3 h-3" /> Location</span>
            <span className={VALUE}>{[tree.state, tree.nation].filter(Boolean).join(", ")}</span>
          </div>
        )}

        {tree.what3words && (
          <div className={ROW}>
            <span className={LABEL}><Globe className="w-3 h-3" /> w3w</span>
            <span className={`${VALUE} font-mono text-xs`}>{tree.what3words}</span>
          </div>
        )}

        {tree.latitude && tree.longitude && (
          <div className={ROW}>
            <span className={LABEL}><MapPin className="w-3 h-3" /> Coords</span>
            <span className={`${VALUE} font-mono text-xs`}>
              {tree.latitude.toFixed(4)}, {tree.longitude.toFixed(4)}
            </span>
          </div>
        )}

        {tree.grove_scale && (
          <div className={ROW}>
            <span className={LABEL}><Shield className="w-3 h-3" /> Grove</span>
            <span className={VALUE}>{tree.grove_scale.replace("_", " ")}</span>
          </div>
        )}

        {ecoBelonging.length > 0 && (
          <div className={`${ROW} flex-col items-start gap-1`}>
            <span className={LABEL}>🌿 Bioregions</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {ecoBelonging.map((br) => (
                <Link
                  key={br.id}
                  to={`/atlas/bio-regions/${br.id}`}
                  className="text-[10px] font-serif px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {br.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {(tree as any).elemental_signature && (
          <div className={`${ROW} flex-col items-start gap-1`}>
            <span className={LABEL}>✦ Elements</span>
            <span className={`${VALUE} text-left`}>
              {((tree as any).elemental_signature as string[]).join(" · ")}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TreeStructuredDataCard;
