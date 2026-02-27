/**
 * AncientFriendPassport — visual species collection showing which of the
 * staff species the user has personally encountered in the wild.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SPECIES_MAP, type SpeciesCode } from "@/config/staffContract";
import { motion } from "framer-motion";
import { TreeDeciduous, Check, Lock } from "lucide-react";

interface Props {
  userId: string;
}

const AncientFriendPassport = ({ userId }: Props) => {
  const [discovered, setDiscovered] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("trees")
        .select("species")
        .eq("created_by", userId);

      if (data) {
        const speciesSet = new Set(
          data.map(t => t.species?.toLowerCase().trim()).filter(Boolean)
        );
        setDiscovered(speciesSet);
      }
      setLoading(false);
    };
    fetch();
  }, [userId]);

  const entries = Object.entries(SPECIES_MAP) as [SpeciesCode, { name: string; image: string }][];
  const discoveredCount = entries.filter(([, { name }]) =>
    discovered.has(name.toLowerCase())
  ).length;

  if (loading) return null;

  return (
    <div className="rounded-xl border p-4 space-y-3" style={{
      background: "hsl(var(--card) / 0.6)",
      borderColor: "hsl(var(--border) / 0.3)",
    }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TreeDeciduous className="w-4 h-4 text-primary" />
          <h3 className="font-serif text-sm text-foreground">Ancient Friend Passport</h3>
        </div>
        <span className="text-xs font-mono text-primary">
          {discoveredCount}/{entries.length}
        </span>
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5">
        {entries.map(([code, { name, image }], i) => {
          const found = discovered.has(name.toLowerCase());
          return (
            <motion.div
              key={code}
              className="relative aspect-square rounded-lg overflow-hidden border"
              style={{
                borderColor: found ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border) / 0.2)",
                opacity: found ? 1 : 0.35,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: found ? 1 : 0.35, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              title={found ? `✓ ${name}` : `${name} — not yet discovered`}
            >
              <img
                src={image}
                alt={name}
                className="w-full h-full object-cover"
                style={{ filter: found ? "none" : "grayscale(1) brightness(0.5)" }}
                loading="lazy"
              />
              {found && (
                <div className="absolute bottom-0 right-0 p-0.5" style={{ background: "hsl(var(--primary) / 0.8)", borderTopLeftRadius: 6 }}>
                  <Check className="w-2 h-2 text-primary-foreground" />
                </div>
              )}
              {!found && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-3 h-3 text-muted-foreground/50" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {discoveredCount >= 10 && (
        <p className="text-[10px] text-center font-serif text-primary/70 tracking-wider">
          🌿 {discoveredCount >= 30 ? "Living Census Elder" : discoveredCount >= 20 ? "Grove Keeper" : "Seedling Explorer"}
        </p>
      )}
    </div>
  );
};

export default AncientFriendPassport;
