import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bird, Check, Loader2, HelpCircle, Link2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BirdsongRecorder from "./BirdsongRecorder";
import OfferingCelebration from "./OfferingCelebration";

interface Prediction {
  speciesCommon: string;
  speciesScientific: string;
  ebirdCode: string;
  confidence: number;
}

interface BirdsongOfferingFlowProps {
  treeId: string;
  treeName: string;
  treeLat?: number | null;
  treeLng?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOfferingSaved?: () => void;
}

type Step = "record" | "identify" | "confirm" | "saving" | "done";

const BirdsongOfferingFlow = ({
  treeId,
  treeName,
  treeLat,
  treeLng,
  open,
  onOpenChange,
  onOfferingSaved,
}: BirdsongOfferingFlowProps) => {
  const [step, setStep] = useState<Step>("record");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [modelVersion, setModelVersion] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState<Prediction | null>(null);
  const [isMystery, setIsMystery] = useState(false);
  const [anchorOnChain, setAnchorOnChain] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const resetFlow = useCallback(() => {
    setStep("record");
    setAudioBlob(null);
    setDuration(0);
    setPredictions([]);
    setSelectedSpecies(null);
    setIsMystery(false);
    setAnchorOnChain(false);
    setShowCelebration(false);
  }, []);

  const handleRecordingComplete = useCallback(
    async (blob: Blob, durationSecs: number) => {
      setAudioBlob(blob);
      setDuration(durationSecs);
      setStep("identify");

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error("Please sign in to offer a birdsong");
          setStep("record");
          return;
        }

        const formData = new FormData();
        formData.append("audio", blob, "birdsong.webm");
        if (treeLat) formData.append("latitude", String(treeLat));
        if (treeLng) formData.append("longitude", String(treeLng));

        const response = await supabase.functions.invoke("birdsong-identify", {
          body: formData,
        });

        if (response.error) {
          console.error("Birdsong identification error:", response.error);
          toast.error("Bird identification failed — you can still save as Mystery Bird");
          setPredictions([]);
          setStep("confirm");
          return;
        }

        const data = response.data;
        const preds = data.predictions || [];
        setPredictions(preds);
        setModelVersion(data.modelVersion || "");
        // Auto-select top prediction if confidence is high enough
        if (preds.length > 0 && preds[0].confidence >= 0.5) {
          setSelectedSpecies(preds[0]);
        }
        setStep("confirm");
      } catch (err) {
        console.error("Identification error:", err);
        toast.error("Identification service unavailable — save as Mystery Bird");
        setPredictions([]);
        setStep("confirm");
      }
    },
    [treeLat, treeLng]
  );

  const handleSelectSpecies = (pred: Prediction) => {
    setSelectedSpecies(pred);
    setIsMystery(false);
  };

  const handleMystery = () => {
    setSelectedSpecies(null);
    setIsMystery(true);
  };

  const handleSave = useCallback(async () => {
    if (!audioBlob) return;
    setStep("saving");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in");
        setStep("confirm");
        return;
      }

      // Upload audio to storage
      const fileName = `${user.id}/${Date.now()}-birdsong.webm`;
      const { error: uploadError } = await supabase.storage
        .from("birdsong")
        .upload(fileName, audioBlob, { contentType: "audio/webm" });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Failed to upload audio");
        setStep("confirm");
        return;
      }

      const { data: urlData } = supabase.storage.from("birdsong").getPublicUrl(fileName);
      const audioUrl = urlData.publicUrl;

      // Determine season
      const month = new Date().getMonth();
      const season =
        month >= 2 && month <= 4 ? "spring" : month >= 5 && month <= 7 ? "summer" : month >= 8 && month <= 10 ? "autumn" : "winter";

      // Save offering record
      const record: any = {
        tree_id: treeId,
        user_id: user.id,
        audio_url: audioUrl,
        species_common: isMystery ? "Mystery Bird" : selectedSpecies?.speciesCommon || "Unknown",
        species_scientific: isMystery ? null : selectedSpecies?.speciesScientific || null,
        ebird_code: isMystery ? null : selectedSpecies?.ebirdCode || null,
        confidence: isMystery ? null : selectedSpecies?.confidence || null,
        predictions: predictions,
        model_version: modelVersion || null,
        duration_seconds: duration,
        season,
      };

      const { error: insertError } = await supabase
        .from("birdsong_offerings")
        .insert(record);

      if (insertError) {
        console.error("Insert error:", insertError);
        toast.error("Failed to save offering");
        setStep("confirm");
        return;
      }

      // IPFS pinning (optional, async)
      try {
        const ipfsResponse = await supabase.functions.invoke("ipfs-sync", {
          body: {
            action: "pin",
            content: JSON.stringify({ ...record, audioUrl }),
            name: `birdsong-${treeId}-${Date.now()}`,
          },
        });
        if (ipfsResponse.data?.cid) {
          await supabase
            .from("birdsong_offerings")
            .update({
              metadata_cid: ipfsResponse.data.cid,
              audio_cid: ipfsResponse.data.cid,
            })
            .eq("tree_id", treeId)
            .eq("user_id", user.id)
            .eq("audio_url", audioUrl);
        }
      } catch {
        // IPFS pinning is optional
      }

      setStep("done");
      setShowCelebration(true);
      toast.success("Birdsong offering placed 🐦");
      onOfferingSaved?.();
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Something went wrong");
      setStep("confirm");
    }
  }, [audioBlob, treeId, selectedSpecies, isMystery, predictions, modelVersion, duration, onOfferingSaved]);

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetFlow(); onOpenChange(v); }}>
        <DialogContent className="max-w-md mx-auto bg-card/95 backdrop-blur-xl border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-serif text-primary tracking-widest flex items-center gap-2">
              <Bird className="h-5 w-5" />
              Offer a Birdsong
            </DialogTitle>
            <p className="text-xs text-muted-foreground font-serif">
              for {treeName}
            </p>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === "record" && (
              <motion.div key="record" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <p className="text-sm text-muted-foreground font-serif mb-4 text-center">
                  Hold your device towards the birdsong. Record 10–30 seconds of audio.
                </p>
                <BirdsongRecorder onRecordingComplete={handleRecordingComplete} />
              </motion.div>
            )}

            {step === "identify" && (
              <motion.div key="identify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-8 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-serif animate-pulse">
                  Listening for species…
                </p>
              </motion.div>
            )}

            {step === "confirm" && (
              <motion.div key="confirm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                {predictions.length > 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground font-serif">
                      {selectedSpecies && selectedSpecies.confidence >= 0.5
                        ? "🎯 Auto-identified! Confirm or choose another:"
                        : "Select the species you heard:"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {predictions.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelectSpecies(p)}
                          className={`px-3 py-2 rounded-lg border text-sm font-serif transition-all ${
                            selectedSpecies === p
                              ? "bg-primary/20 border-primary text-primary ring-1 ring-primary/40"
                              : "bg-secondary/30 border-border/50 text-foreground/80 hover:border-primary/40"
                          }`}
                        >
                          <div className="font-medium flex items-center gap-1.5">
                            {selectedSpecies === p && <Check className="h-3.5 w-3.5" />}
                            {p.speciesCommon}
                          </div>
                          <div className="text-[10px] opacity-60 flex items-center gap-1">
                            {p.speciesScientific && <span className="italic">{p.speciesScientific}</span>}
                            <Badge variant="outline" className="text-[9px] h-4 px-1">
                              {Math.round(p.confidence * 100)}%
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground font-serif text-center">
                    No species identified — you can save this as a Mystery Bird.
                  </p>
                )}

                <button
                  onClick={handleMystery}
                  className={`w-full px-3 py-2 rounded-lg border text-sm font-serif transition-all flex items-center justify-center gap-2 ${
                    isMystery
                      ? "bg-accent/20 border-accent text-accent-foreground"
                      : "bg-secondary/20 border-border/50 text-muted-foreground hover:border-accent/40"
                  }`}
                >
                  <HelpCircle className="h-4 w-4" /> Mystery Bird
                </button>

                <div className="flex items-center justify-between py-2 px-1">
                  <span className="text-xs text-muted-foreground font-serif flex items-center gap-1">
                    <Link2 className="h-3 w-3" /> Anchor on-chain
                  </span>
                  <Switch checked={anchorOnChain} onCheckedChange={setAnchorOnChain} />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={!selectedSpecies && !isMystery}
                  className="w-full font-serif tracking-wider gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Place Offering
                </Button>
              </motion.div>
            )}

            {step === "saving" && (
              <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-8 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-serif">
                  Placing your offering…
                </p>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8 gap-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                  className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center"
                >
                  <Check className="h-8 w-8 text-primary" />
                </motion.div>
                <p className="text-lg font-serif text-primary tracking-wide">
                  Birdsong Offered
                </p>
                <p className="text-sm text-muted-foreground font-serif text-center">
                  {isMystery
                    ? "A mystery song has been woven into this tree's story."
                    : `${selectedSpecies?.speciesCommon}'s song now lives with ${treeName}.`}
                </p>
                <Button
                  variant="outline"
                  onClick={() => { resetFlow(); onOpenChange(false); }}
                  className="font-serif"
                >
                  Close
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <OfferingCelebration
        active={showCelebration}
        emoji="🐦"
        message="Birdsong Offered"
        subtitle="A song has been woven into this tree's story"
        onComplete={() => setShowCelebration(false)}
      />
    </>
  );
};

export default BirdsongOfferingFlow;
