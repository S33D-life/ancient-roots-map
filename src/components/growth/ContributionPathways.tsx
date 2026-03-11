/**
 * ContributionPathways — clear action cards encouraging meaningful
 * contributions: mapping, offerings, harvest, seasonal, seeds, stewardship.
 */
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { MapPin, Gift, Apple, Sun, Sprout, BookOpen } from "lucide-react";

const PATHWAYS = [
  {
    key: "mapping",
    label: "Map a Tree",
    desc: "Add an Ancient Friend to the living atlas",
    icon: MapPin,
    to: "/map",
    accentVar: "--primary",
  },
  {
    key: "offering",
    label: "Add an Offering",
    desc: "Share a poem, photo, song, or memory",
    icon: Gift,
    to: "/map",
    accentVar: "--primary",
  },
  {
    key: "harvest",
    label: "Document Harvest",
    desc: "Record available harvests for the community",
    icon: Apple,
    to: "/harvest",
    accentVar: "--accent",
  },
  {
    key: "seasonal",
    label: "Seasonal Observation",
    desc: "Note blossom, fruit, or dormancy cycles",
    icon: Sun,
    to: "/cosmic",
    accentVar: "--accent",
  },
  {
    key: "seeds",
    label: "Collect Seeds",
    desc: "Gather and share seeds from Ancient Friends",
    icon: Sprout,
    to: "/map",
    accentVar: "--primary",
  },
  {
    key: "stewardship",
    label: "Stewardship Notes",
    desc: "Record care observations and protection needs",
    icon: BookOpen,
    to: "/map",
    accentVar: "--accent",
  },
];

const ContributionPathways = () => {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-serif text-muted-foreground uppercase tracking-wider">
        Ways to Contribute
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {PATHWAYS.map((p, i) => (
          <motion.div
            key={p.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to={p.to}>
              <Card className="bg-card/60 backdrop-blur border-border/40 hover:border-primary/30 transition-all group cursor-pointer h-full">
                <CardContent className="p-3 flex flex-col items-center text-center gap-2">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{
                      background: `radial-gradient(circle, hsl(var(${p.accentVar}) / 0.15), transparent 80%)`,
                    }}
                  >
                    <p.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-serif font-medium text-foreground">
                      {p.label}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-serif leading-tight mt-0.5">
                      {p.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ContributionPathways;
