/**
 * TreeJourneyInvitations — clear pathways from a tree page
 * to contribution actions and the species hive.
 * Part of the MAP → TREE → HIVE → CONTRIBUTION journey.
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Leaf, Camera, Apple, Eye, Shield, TreePine } from "lucide-react";
import { getHiveForSpecies } from "@/utils/hiveUtils";
import { ROUTES } from "@/lib/routes";

interface Props {
  species: string;
  treeId: string;
  treeName: string;
  onAddOffering?: () => void;
  onLogStewardship?: () => void;
}

const actions = [
  { key: "offering", icon: Camera, label: "Add an offering", desc: "Keep this tree's story alive" },
  { key: "seasonal", icon: Eye, label: "Record a seasonal observation", desc: "Document what you see today" },
  { key: "harvest", icon: Apple, label: "Document a harvest", desc: "Share abundance with the community" },
  { key: "guardian", icon: Shield, label: "Become a guardian", desc: "Care for this tree over time" },
] as const;

const TreeJourneyInvitations = ({ species, treeId, treeName, onAddOffering, onLogStewardship }: Props) => {
  const hive = getHiveForSpecies(species);

  return (
    <section className="space-y-4">
      {/* Hive pathway — prominent */}
      {hive && (
        <Link
          to={ROUTES.HIVE(hive.slug)}
          className="group flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md"
          style={{
            borderColor: `hsl(${hive.accentHsl} / 0.25)`,
            background: `hsl(${hive.accentHsl} / 0.04)`,
          }}
        >
          <span className="text-2xl">{hive.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-serif text-foreground font-medium">
              Explore the {hive.displayName}
            </p>
            <p className="text-[11px] text-muted-foreground font-serif mt-0.5">
              Discover other {species} trees across the atlas
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      )}

      {/* Contribution invitations */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-serif text-muted-foreground uppercase tracking-[0.15em] px-1">
          Ways to contribute
        </p>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((a, i) => {
            const Icon = a.icon;
            const handleClick = () => {
              if (a.key === "offering" && onAddOffering) onAddOffering();
              else if ((a.key === "seasonal" || a.key === "guardian") && onLogStewardship) onLogStewardship();
            };
            return (
              <motion.button
                key={a.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={handleClick}
                className="flex items-start gap-2 p-3 rounded-lg border border-border/30 text-left transition-all hover:border-primary/30 hover:shadow-sm"
                style={{ background: "hsl(var(--card) / 0.5)" }}
              >
                <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-serif text-foreground leading-tight">{a.label}</p>
                  <p className="text-[9px] text-muted-foreground font-serif mt-0.5 leading-tight">{a.desc}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TreeJourneyInvitations;
