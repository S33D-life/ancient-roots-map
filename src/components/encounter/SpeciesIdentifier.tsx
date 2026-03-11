/**
 * SpeciesIdentifier — Three gentle paths to identify a tree:
 * 1. "I know it" → manual species search/autocomplete
 * 2. "Help me" → AI photo identification
 * 3. "Guess the hive" → choose a botanical family
 *
 * Supports uncertainty — never blocks submission.
 */
import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Camera, ImagePlus, HelpCircle, Leaf, ChevronRight,
  Check, Loader2, ArrowLeft, Sparkles,
} from "lucide-react";
import { searchSpecies } from "@/data/treeSpecies";
import { getAllHives, getHiveForSpecies, type HiveInfo } from "@/utils/hiveUtils";
import {
  identifyTreeSpeciesFromPhoto,
  type SpeciesVisionPrediction,
  type SpeciesVisionResult,
} from "@/services/speciesVision";

/* ─── Types ─── */

export type IdentificationMethod = "known" | "ai" | "hive" | null;
export type SpeciesCertainty = "exact" | "ai_confirmed" | "ai_suggested" | "hive_guess" | "uncertain";

export interface SpeciesResult {
  species: string;
  certainty: SpeciesCertainty;
  hiveFamily?: string;
  hiveName?: string;
  aiPrediction?: SpeciesVisionPrediction | null;
  aiResult?: SpeciesVisionResult | null;
}

interface SpeciesIdentifierProps {
  species: string;
  onSpeciesChange: (result: SpeciesResult) => void;
  /** Photo file passed from parent (for AI path) */
  photoFile?: File | null;
  /** Trigger photo capture from parent */
  onRequestPhoto?: () => void;
  /** External AI result passed from parent photo flow */
  externalAiResult?: SpeciesVisionResult | null;
  isIdentifyingSpecies?: boolean;
}

/* ─── Component ─── */

export default function SpeciesIdentifier({
  species,
  onSpeciesChange,
  photoFile,
  onRequestPhoto,
  externalAiResult,
  isIdentifyingSpecies = false,
}: SpeciesIdentifierProps) {
  const [method, setMethod] = useState<IdentificationMethod>(species ? "known" : null);
  const [localSpecies, setLocalSpecies] = useState(species);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedHive, setSelectedHive] = useState<HiveInfo | null>(null);
  const [hiveSpeciesChoice, setHiveSpeciesChoice] = useState<string>("");
  const [confirmedAiPrediction, setConfirmedAiPrediction] = useState<SpeciesVisionPrediction | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => searchSpecies(localSpecies), [localSpecies]);
  const allHives = useMemo(() => {
    const hives = getAllHives();
    // Sort by representative species count (most popular first), then name
    return hives
      .filter(h => h.representativeSpecies.length > 0)
      .sort((a, b) => b.representativeSpecies.length - a.representativeSpecies.length)
      .slice(0, 24); // Show top 24 hives
  }, []);

  const aiPredictions = externalAiResult?.predictions || [];

  // Emit species change
  const emitSpecies = useCallback((
    value: string,
    certainty: SpeciesCertainty,
    hive?: HiveInfo | null,
    aiPred?: SpeciesVisionPrediction | null,
  ) => {
    onSpeciesChange({
      species: value,
      certainty,
      hiveFamily: hive?.family,
      hiveName: hive?.displayName,
      aiPrediction: aiPred,
      aiResult: externalAiResult,
    });
  }, [onSpeciesChange, externalAiResult]);

  const handleSelectSpecies = (name: string) => {
    setLocalSpecies(name);
    setShowSuggestions(false);
    emitSpecies(name, "exact");
  };

  const handleConfirmAi = (prediction: SpeciesVisionPrediction) => {
    setConfirmedAiPrediction(prediction);
    const name = prediction.commonName || prediction.scientificName;
    setLocalSpecies(name);
    emitSpecies(name, "ai_confirmed", null, prediction);
  };

  const handleHiveSelect = (hive: HiveInfo) => {
    setSelectedHive(hive);
    setHiveSpeciesChoice("");
  };

  const handleHiveSpeciesSelect = (speciesName: string) => {
    setHiveSpeciesChoice(speciesName);
    setLocalSpecies(speciesName);
    emitSpecies(speciesName, "hive_guess", selectedHive);
  };

  const handleHiveOnlyConfirm = () => {
    if (!selectedHive) return;
    // Use hive as species placeholder
    const label = `${selectedHive.displayName.replace(" Hive", "")} (unconfirmed)`;
    setLocalSpecies(label);
    emitSpecies(label, "hive_guess", selectedHive);
  };

  const handleUnsure = () => {
    const label = "Unknown species";
    setLocalSpecies(label);
    emitSpecies(label, "uncertain");
  };

  const goBack = () => {
    setMethod(null);
    setSelectedHive(null);
    setHiveSpeciesChoice("");
    setConfirmedAiPrediction(null);
  };

  /* ─── Render: Path chooser ─── */
  if (method === null) {
    return (
      <div className="space-y-3">
        <div className="text-center pb-1">
          <p className="text-xs font-serif" style={{ color: 'hsl(42, 60%, 58%)' }}>
            What kind of tree is this?
          </p>
          <p className="text-[10px] font-serif text-muted-foreground/50 mt-0.5">
            Choose how you'd like to identify it
          </p>
        </div>

        <div className="space-y-2">
          {/* Path 1: I know it */}
          <PathCard
            icon={<Search className="w-4 h-4" />}
            title="I know the species"
            subtitle="Search by name"
            accentHsl="42, 70%, 50%"
            onClick={() => {
              setMethod("known");
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
          />

          {/* Path 2: Help me identify */}
          <PathCard
            icon={<Sparkles className="w-4 h-4" />}
            title="Help me identify it"
            subtitle={photoFile ? "AI suggestions from your photo" : "Take or upload a photo for AI"}
            accentHsl="160, 50%, 45%"
            onClick={() => {
              setMethod("ai");
              if (!photoFile && onRequestPhoto) {
                onRequestPhoto();
              }
            }}
            badge={aiPredictions.length > 0 ? `${aiPredictions.length} suggestions` : undefined}
          />

          {/* Path 3: Guess the hive */}
          <PathCard
            icon={<Leaf className="w-4 h-4" />}
            title="I'm not sure — guess the hive"
            subtitle="Choose a broader family"
            accentHsl="120, 40%, 40%"
            onClick={() => setMethod("hive")}
          />
        </div>

        {/* Quick uncertain option */}
        <button
          type="button"
          className="w-full text-center py-1.5 text-[10px] font-serif text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
          onClick={handleUnsure}
        >
          I really don't know · continue without species
        </button>
      </div>
    );
  }

  /* ─── Render: Path 1 — I know it ─── */
  if (method === "known") {
    return (
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <PathHeader title="Search by species" onBack={goBack} />

        <div className="relative">
          <Input
            ref={inputRef}
            value={localSpecies}
            onChange={(e) => {
              setLocalSpecies(e.target.value.slice(0, 200));
              setShowSuggestions(true);
              // If user types manually, emit as exact
              if (e.target.value.trim()) {
                emitSpecies(e.target.value.trim(), "exact");
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Oak, Yew, Birch, Pine…"
            maxLength={200}
            className="font-serif h-9 text-sm"
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div
              className="absolute left-0 right-0 z-50 mt-1 max-h-40 overflow-y-auto rounded-lg border shadow-lg"
              style={{
                background: "hsl(30, 15%, 12%)",
                borderColor: "hsla(42, 40%, 30%, 0.5)",
              }}
            >
              {suggestions.map((sp) => (
                <button
                  key={sp.scientific}
                  type="button"
                  className="w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-white/5 flex flex-col"
                  onClick={() => handleSelectSpecies(sp.common)}
                >
                  <span className="font-serif" style={{ color: "hsl(42, 75%, 60%)" }}>{sp.common}</span>
                  <span className="text-[10px] italic" style={{ color: "hsla(42, 40%, 55%, 0.7)" }}>
                    {sp.scientific} · {sp.family}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-[10px] font-serif text-muted-foreground/40 text-center">
          You can always refine this later
        </p>
      </motion.div>
    );
  }

  /* ─── Render: Path 2 — AI identify ─── */
  if (method === "ai") {
    return (
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <PathHeader title="AI identification" onBack={goBack} />

        {isIdentifyingSpecies && (
          <div
            className="rounded-lg border px-3 py-3 text-xs font-serif flex items-center gap-2"
            style={{
              borderColor: "hsla(42, 45%, 35%, 0.4)",
              background: "hsla(42, 35%, 12%, 0.5)",
              color: "hsl(42, 70%, 65%)",
            }}
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            AI is identifying species from your photo…
          </div>
        )}

        {!isIdentifyingSpecies && aiPredictions.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-serif" style={{ color: "hsl(160, 50%, 60%)" }}>
              AI suggestions
              {externalAiResult?.provider && externalAiResult.provider !== "none" && (
                <span className="text-muted-foreground/40 ml-1">
                  via {externalAiResult.provider === "plantnet" ? "PlantNet" : "iNaturalist"}
                </span>
              )}
            </p>

            <div className="space-y-1.5">
              {aiPredictions.slice(0, 4).map((prediction, index) => {
                const isSelected =
                  confirmedAiPrediction?.scientificName === prediction.scientificName &&
                  confirmedAiPrediction?.source === prediction.source;
                return (
                  <button
                    key={`${prediction.source}-${prediction.scientificName}-${index}`}
                    type="button"
                    className="w-full text-left rounded-lg border px-3 py-2 transition-all hover:bg-white/5"
                    style={{
                      borderColor: isSelected ? "hsla(120, 45%, 45%, 0.5)" : "hsla(160, 20%, 35%, 0.3)",
                      background: isSelected ? "hsla(120, 35%, 18%, 0.4)" : "hsla(0, 0%, 100%, 0.015)",
                    }}
                    onClick={() => handleConfirmAi(prediction)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-serif truncate" style={{ color: "hsl(42, 76%, 65%)" }}>
                          {prediction.commonName || prediction.scientificName}
                        </p>
                        {prediction.commonName && (
                          <p className="text-[10px] italic truncate text-muted-foreground/60">
                            {prediction.scientificName}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-medium" style={{ color: "hsl(42, 80%, 68%)" }}>
                          {Math.round(prediction.confidence * 100)}%
                        </span>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: 'hsla(120, 40%, 35%, 0.5)' }}
                          >
                            <Check className="w-3 h-3" style={{ color: 'hsl(120, 50%, 65%)' }} />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {!confirmedAiPrediction && (
              <p className="text-[10px] font-serif text-muted-foreground/40 text-center">
                Tap to confirm a suggestion, or go back to try another method
              </p>
            )}
          </div>
        )}

        {!isIdentifyingSpecies && aiPredictions.length === 0 && (
          <div className="text-center py-3 space-y-3">
            {!photoFile ? (
              <>
                <p className="text-xs font-serif text-muted-foreground/60">
                  Add a photo above and AI will suggest likely species
                </p>
                {onRequestPhoto && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs font-serif gap-1.5"
                    onClick={onRequestPhoto}
                  >
                    <Camera className="w-3.5 h-3.5" /> Take or choose a photo
                  </Button>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-serif text-muted-foreground/60">
                  AI couldn't identify this tree right now
                </p>
                <p className="text-[10px] font-serif text-muted-foreground/40">
                  Try searching by name or guessing the hive instead
                </p>
              </div>
            )}
          </div>
        )}

        {/* Fallback to manual or hive */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 text-[11px] font-serif h-8"
            onClick={() => setMethod("known")}
          >
            <Search className="w-3 h-3 mr-1" /> Search manually
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 text-[11px] font-serif h-8"
            onClick={() => setMethod("hive")}
          >
            <Leaf className="w-3 h-3 mr-1" /> Guess the hive
          </Button>
        </div>
      </motion.div>
    );
  }

  /* ─── Render: Path 3 — Guess the hive ─── */
  if (method === "hive") {
    return (
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <PathHeader
          title={selectedHive ? selectedHive.displayName : "Choose a hive"}
          onBack={selectedHive ? () => setSelectedHive(null) : goBack}
        />

        {!selectedHive ? (
          <>
            <p className="text-[10px] font-serif text-muted-foreground/50 text-center">
              Which family does this tree belong to?
            </p>

            <div className="grid grid-cols-2 gap-1.5 max-h-[240px] overflow-y-auto pr-1">
              {allHives.map((hive) => (
                <button
                  key={hive.family}
                  type="button"
                  className="text-left rounded-lg border px-2.5 py-2 transition-all hover:scale-[1.02] hover:bg-white/5"
                  style={{
                    borderColor: `hsla(${hive.accentHsl}, 0.25)`,
                    background: `hsla(${hive.accentHsl}, 0.06)`,
                  }}
                  onClick={() => handleHiveSelect(hive)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{hive.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-serif truncate" style={{ color: `hsl(${hive.accentHsl})` }}>
                        {hive.displayName.replace(" Hive", "")}
                      </p>
                      <p className="text-[9px] text-muted-foreground/40 truncate">
                        {hive.representativeSpecies.slice(0, 2).join(", ")}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="w-full text-center py-1 text-[10px] font-serif text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
              onClick={handleUnsure}
            >
              I really can't tell · continue without
            </button>
          </>
        ) : (
          <>
            {/* Hive selected — show species within */}
            <div
              className="rounded-lg border px-3 py-2 flex items-center gap-2"
              style={{
                borderColor: `hsla(${selectedHive.accentHsl}, 0.3)`,
                background: `hsla(${selectedHive.accentHsl}, 0.08)`,
              }}
            >
              <span className="text-lg">{selectedHive.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-serif" style={{ color: `hsl(${selectedHive.accentHsl})` }}>
                  {selectedHive.displayName}
                </p>
                <p className="text-[10px] font-serif text-muted-foreground/50 truncate">
                  {selectedHive.description}
                </p>
              </div>
            </div>

            {selectedHive.representativeSpecies.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-serif text-muted-foreground/50">
                  Can you narrow it down?
                </p>
                <div className="max-h-[160px] overflow-y-auto space-y-1 pr-1">
                  {selectedHive.representativeSpecies.map((sp) => {
                    const isChosen = hiveSpeciesChoice === sp;
                    return (
                      <button
                        key={sp}
                        type="button"
                        className="w-full text-left rounded-md border px-2.5 py-1.5 text-sm transition-colors hover:bg-white/5 flex items-center justify-between"
                        style={{
                          borderColor: isChosen ? `hsla(${selectedHive.accentHsl}, 0.5)` : "hsla(0, 0%, 100%, 0.06)",
                          background: isChosen ? `hsla(${selectedHive.accentHsl}, 0.12)` : "transparent",
                        }}
                        onClick={() => handleHiveSpeciesSelect(sp)}
                      >
                        <span className="font-serif text-xs" style={{ color: isChosen ? `hsl(${selectedHive.accentHsl})` : "hsl(42, 60%, 60%)" }}>
                          {sp}
                        </span>
                        {isChosen && (
                          <Check className="w-3 h-3 shrink-0" style={{ color: `hsl(${selectedHive.accentHsl})` }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Confirm with just hive, no specific species */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full text-[11px] font-serif h-8"
              style={{
                borderColor: `hsla(${selectedHive.accentHsl}, 0.25)`,
                color: `hsl(${selectedHive.accentHsl})`,
              }}
              onClick={handleHiveOnlyConfirm}
            >
              Not sure which — just use "{selectedHive.displayName.replace(" Hive", "")}"
            </Button>

            <p className="text-[10px] font-serif text-muted-foreground/35 text-center">
              You can always refine the species later
            </p>
          </>
        )}
      </motion.div>
    );
  }

  return null;
}

/* ─── Sub-components ─── */

function PathCard({
  icon,
  title,
  subtitle,
  accentHsl,
  onClick,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accentHsl: string;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      className="w-full text-left rounded-xl border px-3 py-2.5 transition-all hover:scale-[1.01] group"
      style={{
        borderColor: `hsla(${accentHsl}, 0.2)`,
        background: `hsla(${accentHsl}, 0.04)`,
      }}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
          style={{
            background: `hsla(${accentHsl}, 0.15)`,
            border: `1px solid hsla(${accentHsl}, 0.25)`,
            color: `hsl(${accentHsl})`,
          }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-serif" style={{ color: `hsl(${accentHsl})` }}>
            {title}
          </p>
          <p className="text-[10px] font-serif text-muted-foreground/45">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge && (
            <span
              className="text-[9px] font-serif px-1.5 py-0.5 rounded-full"
              style={{
                background: `hsla(${accentHsl}, 0.15)`,
                color: `hsl(${accentHsl})`,
              }}
            >
              {badge}
            </span>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/25 group-hover:text-muted-foreground/50 transition-colors" />
        </div>
      </div>
    </button>
  );
}

function PathHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors shrink-0"
        onClick={onBack}
      >
        <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground/60" />
      </button>
      <p className="text-xs font-serif" style={{ color: 'hsl(42, 60%, 58%)' }}>
        {title}
      </p>
    </div>
  );
}
