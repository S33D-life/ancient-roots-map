/**
 * GardenPicker — optional standalone step in the mapping flow.
 *
 * Lets the wanderer answer:  "Is this tree part of a garden or orchard?"
 *   - If no  → flow stays simple (default for wild / ancient trees)
 *   - If yes → choose from the closest existing public gardens
 *              (or pick "Create a new garden" if they have permission)
 *
 * The actual create-garden form lives in CreateGardenDialog. A user
 * without curator/garden_steward role still sees the question, but
 * only sees existing gardens to pick from — they cannot create.
 */
import { useMemo, useState } from "react";
import { ChevronDown, Sprout, MapPin, Plus, X, Loader2, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useGardens, type Garden } from "@/hooks/use-gardens";
import CreateGardenDialog from "@/components/encounter/CreateGardenDialog";
import { hapticTap } from "@/lib/haptics";

interface Props {
  /** The currently chosen garden id (or null). */
  value: string | null;
  onChange: (gardenId: string | null) => void;
  /** Tree's lat/lng so we can sort gardens by proximity. */
  treeLat?: number | null;
  treeLng?: number | null;
  /** Whether the current viewer can create gardens (curator or garden_steward). */
  canCreateGarden?: boolean;
}

/** Haversine distance in meters, simplified for short distances. */
function distanceM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function GardenPicker({
  value,
  onChange,
  treeLat,
  treeLng,
  canCreateGarden = false,
}: Props) {
  const [expanded, setExpanded] = useState<boolean>(value != null);
  const [createOpen, setCreateOpen] = useState(false);
  const { data: gardens = [], isLoading } = useGardens();

  /** Sorted: nearest first if we have coords, otherwise by name. */
  const orderedGardens = useMemo(() => {
    const list = [...gardens];
    if (treeLat != null && treeLng != null) {
      list.sort((a, b) => {
        const da = distanceM(treeLat, treeLng, a.latitude, a.longitude);
        const db = distanceM(treeLat, treeLng, b.latitude, b.longitude);
        return da - db;
      });
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [gardens, treeLat, treeLng]);

  const selected = gardens.find((g) => g.id === value) || null;

  const handleToggle = () => {
    hapticTap();
    if (expanded) {
      setExpanded(false);
      onChange(null);
    } else {
      setExpanded(true);
    }
  };

  const handlePick = (g: Garden) => {
    hapticTap();
    onChange(g.id);
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
      {/* Header — the optional question */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Sprout className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-serif text-foreground tracking-wide truncate">
              {selected ? selected.name : "Is this tree part of a garden or orchard?"}
            </p>
            <p className="text-[10px] text-muted-foreground/70 font-serif tracking-wider uppercase">
              {selected
                ? "Linked to a garden — tap to change"
                : expanded
                  ? "Pick a place below — or skip"
                  : "Optional"}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden border-t border-border/30"
          >
            <div className="p-3 space-y-2">
              {isLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-serif px-2 py-3">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Listening for nearby gardens…
                </div>
              ) : orderedGardens.length === 0 ? (
                <p className="text-xs text-muted-foreground/70 font-serif italic px-2 py-2">
                  No gardens have been planted on the map yet.
                </p>
              ) : (
                <div className="max-h-44 overflow-y-auto space-y-1 -mx-1 px-1">
                  {orderedGardens.slice(0, 12).map((g) => {
                    const isSelected = g.id === value;
                    const dist =
                      treeLat != null && treeLng != null
                        ? distanceM(treeLat, treeLng, g.latitude, g.longitude)
                        : null;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handlePick(g)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                          isSelected
                            ? "bg-primary/15 border border-primary/30"
                            : "hover:bg-secondary/30 border border-transparent"
                        }`}
                      >
                        <MapPin
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? "text-primary" : "text-muted-foreground/60"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-serif text-foreground truncate">{g.name}</p>
                          <p className="text-[10px] text-muted-foreground/60 font-serif">
                            {g.tree_count} {g.tree_count === 1 ? "tree" : "trees"}
                            {dist != null && (
                              <>
                                {" · "}
                                {dist < 1000
                                  ? `${Math.round(dist)} m away`
                                  : `${(dist / 1000).toFixed(1)} km away`}
                              </>
                            )}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Clear */}
              {value && (
                <button
                  type="button"
                  onClick={() => {
                    hapticTap();
                    onChange(null);
                  }}
                  className="text-[10px] text-muted-foreground/60 hover:text-foreground font-serif tracking-wider uppercase flex items-center gap-1 px-2"
                >
                  <X className="w-3 h-3" />
                  Not in a garden after all
                </button>
              )}

              {/* Create new */}
              <div className="pt-1">
                {canCreateGarden ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCreateOpen(true)}
                    className="w-full justify-start gap-2 font-serif text-xs text-primary hover:bg-primary/10"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Plant a new garden here
                  </Button>
                ) : (
                  <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 font-serif italic px-2 py-1.5">
                    <Lock className="w-3 h-3" />
                    Creating gardens is invite-only for now.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateGardenDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultLat={treeLat ?? null}
        defaultLng={treeLng ?? null}
        onCreated={(g) => {
          onChange(g.id);
          setCreateOpen(false);
        }}
      />
    </div>
  );
}
