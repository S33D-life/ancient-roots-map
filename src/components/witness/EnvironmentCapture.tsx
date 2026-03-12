/**
 * EnvironmentCapture — optional sensor capture cards shown during
 * co-witness confirmation. Each signal is opt-in with a single tap.
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Mic, Check, Loader2, TreePine, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { captureCanopyLight, captureAmbientSound } from "@/lib/env-sensors";
import type { CanopyLightReading, AmbientSoundReading } from "@/lib/env-snapshot-types";

interface EnvironmentCaptureProps {
  onLightCaptured: (reading: CanopyLightReading) => void;
  onSoundCaptured: (reading: AmbientSoundReading) => void;
}

export default function EnvironmentCapture({
  onLightCaptured,
  onSoundCaptured,
}: EnvironmentCaptureProps) {
  const [lightState, setLightState] = useState<"idle" | "capturing" | "done">("idle");
  const [soundState, setSoundState] = useState<"idle" | "capturing" | "done">("idle");
  const [lightResult, setLightResult] = useState<CanopyLightReading | null>(null);
  const [soundResult, setSoundResult] = useState<AmbientSoundReading | null>(null);

  const handleLight = useCallback(async () => {
    setLightState("capturing");
    const reading = await captureCanopyLight();
    if (reading) {
      setLightResult(reading);
      onLightCaptured(reading);
      setLightState("done");
    } else {
      setLightState("idle");
    }
  }, [onLightCaptured]);

  const handleSound = useCallback(async () => {
    setSoundState("capturing");
    const reading = await captureAmbientSound(5000);
    if (reading) {
      setSoundResult(reading);
      onSoundCaptured(reading);
      setSoundState("done");
    } else {
      setSoundState("idle");
    }
  }, [onSoundCaptured]);

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-[0.25em] font-serif text-muted-foreground/50 px-1">
        Optional · Tree Health Snapshot
      </p>

      <div className="grid grid-cols-2 gap-2">
        {/* Canopy Light */}
        <SensorCard
          icon={<Sun className="w-4 h-4" />}
          label="Canopy Light"
          state={lightState}
          result={
            lightResult
              ? `${lightResult.canopyCoveragePct}% canopy`
              : undefined
          }
          onCapture={handleLight}
        />

        {/* Ambient Sound */}
        <SensorCard
          icon={<Mic className="w-4 h-4" />}
          label="Forest Sound"
          state={soundState}
          result={
            soundResult
              ? soundResult.birdsongDetected
                ? "🐦 Birdsong detected"
                : "Ambient captured"
              : undefined
          }
          onCapture={handleSound}
          capturingLabel="Listening…"
        />
      </div>

      {/* Summary hint */}
      <AnimatePresence>
        {(lightState === "done" || soundState === "done") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 px-1 pt-1"
          >
            <TreePine className="w-3 h-3 text-primary/50" />
            <span className="text-[10px] font-serif text-muted-foreground">
              Signals will be saved with this tree's record
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SensorCard({
  icon,
  label,
  state,
  result,
  onCapture,
  capturingLabel = "Reading…",
}: {
  icon: React.ReactNode;
  label: string;
  state: "idle" | "capturing" | "done";
  result?: string;
  onCapture: () => void;
  capturingLabel?: string;
}) {
  return (
    <Button
      variant="outline"
      className={`h-auto py-3 px-3 flex flex-col items-center gap-1.5 text-center font-serif transition-all duration-300 ${
        state === "done"
          ? "border-primary/30 bg-primary/5"
          : "border-border/30 bg-secondary/10"
      }`}
      onClick={state === "idle" ? onCapture : undefined}
      disabled={state !== "idle"}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center ${
          state === "done"
            ? "bg-primary/15 text-primary"
            : state === "capturing"
              ? "bg-muted/30 text-muted-foreground"
              : "bg-muted/20 text-muted-foreground"
        }`}
      >
        {state === "capturing" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : state === "done" ? (
          <Check className="w-4 h-4" />
        ) : (
          icon
        )}
      </div>
      <span className="text-[11px] tracking-wide">
        {state === "capturing" ? capturingLabel : label}
      </span>
      {result && (
        <span className="text-[9px] text-primary/70 leading-tight">{result}</span>
      )}
    </Button>
  );
}
