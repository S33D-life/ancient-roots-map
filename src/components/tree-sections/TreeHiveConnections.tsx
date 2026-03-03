/**
 * TreeHiveConnections — Shows related hives for the tree.
 * Each hive chip is clickable and softly glowing.
 */
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getHiveForSpecies } from "@/utils/hiveUtils";

interface HiveLink {
  slug: string;
  name: string;
  icon: string;
}

interface Props {
  species: string;
  ecoBelonging: Array<{ id: string; name: string; type: string }>;
  /** Additional custom hives (e.g. cultural, watershed) */
  extraHives?: HiveLink[];
}

const TreeHiveConnections = ({ species, ecoBelonging, extraHives = [] }: Props) => {
  const navigate = useNavigate();
  const speciesHive = getHiveForSpecies(species);

  const hives: HiveLink[] = [];

  if (speciesHive) {
    hives.push({ slug: speciesHive.slug, name: speciesHive.displayName, icon: speciesHive.icon });
  }

  // Add bioregion-based hives
  ecoBelonging.forEach((br) => {
    hives.push({ slug: `bio-region-${br.id}`, name: br.name, icon: "🌿" });
  });

  // Add custom hives
  hives.push(...extraHives);

  if (hives.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.3), transparent)" }} />
        <h2 className="text-lg font-serif text-primary tracking-[0.2em] uppercase">Hives</h2>
        <div className="h-px flex-1" style={{ background: "linear-gradient(270deg, hsl(var(--primary) / 0.3), transparent)" }} />
      </div>

      <motion.div
        className="flex flex-wrap gap-2 justify-center"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      >
        {hives.map((hive) => (
          <motion.button
            key={hive.slug}
            variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}
            onClick={() => navigate(`/hive/${hive.slug}`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-serif tracking-wider border transition-all hover:scale-105"
            style={{
              borderColor: "hsl(var(--primary) / 0.2)",
              background: "hsl(var(--card) / 0.5)",
              boxShadow: "0 0 12px hsl(var(--primary) / 0.05)",
            }}
          >
            <span>{hive.icon}</span>
            <span className="text-foreground/80">{hive.name}</span>
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
};

export default TreeHiveConnections;
