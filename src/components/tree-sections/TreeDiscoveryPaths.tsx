/**
 * TreeDiscoveryPaths — Contextual links from a tree outward to the wider atlas.
 * Shows country, hive, and bioregion pathways when data is available.
 * Designed to feel like the tree opening into the forest.
 */
import { Link } from "react-router-dom";
import { Globe, TreeDeciduous, Layers, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { getHiveForSpecies } from "@/utils/hiveUtils";
import { ROUTES } from "@/lib/routes";
import { getEntryByCountry } from "@/config/countryRegistry";

interface Props {
  species: string;
  country?: string | null;
  ecoBelonging?: Array<{ id: string; name: string; type: string }>;
}

const TreeDiscoveryPaths = ({ species, country, ecoBelonging = [] }: Props) => {
  const hive = getHiveForSpecies(species);
  const countryEntry = country ? getEntryByCountry(country) : null;
  const bioregion = ecoBelonging.length > 0 ? ecoBelonging[0] : null;

  const paths: Array<{
    key: string;
    to: string;
    icon: React.ElementType;
    label: string;
    desc: string;
    emoji?: string;
  }> = [];

  if (countryEntry) {
    paths.push({
      key: "country",
      to: ROUTES.COUNTRY(countryEntry.slug),
      icon: Globe,
      label: countryEntry.name,
      desc: "Country atlas",
      emoji: countryEntry.flag,
    });
  }

  if (hive) {
    paths.push({
      key: "hive",
      to: ROUTES.HIVE(hive.slug),
      icon: TreeDeciduous,
      label: hive.displayName,
      desc: "Species hive",
      emoji: hive.icon,
    });
  }

  if (bioregion) {
    paths.push({
      key: "bioregion",
      to: ROUTES.BIO_REGION(bioregion.id),
      icon: Layers,
      label: bioregion.name,
      desc: "Bioregion",
      emoji: "🌿",
    });
  }

  if (paths.length === 0) return null;

  return (
    <section className="space-y-2">
      <p className="text-[10px] font-serif text-muted-foreground uppercase tracking-[0.15em] px-1">
        Explore the wider world
      </p>
      <div className="space-y-1.5">
        {paths.map((p, i) => (
          <motion.div
            key={p.key}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
          >
            <Link
              to={p.to}
              className="group flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/20 transition-all hover:border-primary/25 hover:shadow-sm"
              style={{ background: "hsl(var(--card) / 0.3)" }}
            >
              {p.emoji ? (
                <span className="text-base shrink-0">{p.emoji}</span>
              ) : (
                <p.icon className="w-3.5 h-3.5 text-primary/60 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-serif text-foreground/90 leading-tight truncate">
                  {p.label}
                </p>
                <p className="text-[9px] text-muted-foreground font-serif leading-tight">
                  {p.desc}
                </p>
              </div>
              <ChevronRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary/60 transition-colors shrink-0" />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default TreeDiscoveryPaths;
