/**
 * SpeciesAttestation — crowdsourced species verification micro-task.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { issueRewards } from "@/utils/issueRewards";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertTriangle, Users, Leaf } from "lucide-react";
import { toast } from "sonner";

interface Props {
  treeId: string;
  treeSpecies: string;
  userId: string | null;
}

interface Attestation {
  id: string;
  attested_species: string;
  confidence: string;
  user_id: string;
}

export default function SpeciesAttestation({ treeId, treeSpecies, userId }: Props) {
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [userAttested, setUserAttested] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctedSpecies, setCorrectedSpecies] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAttestations = async () => {
    const { data } = await supabase
      .from("species_attestations" as any)
      .select("id, attested_species, confidence, user_id")
      .eq("tree_id", treeId);
    const rows = (data || []) as unknown as Attestation[];
    setAttestations(rows);
    if (userId) setUserAttested(rows.some(a => a.user_id === userId));
  };

  useEffect(() => { fetchAttestations(); }, [treeId, userId]);

  const confirmCount = attestations.filter(a => a.attested_species === treeSpecies).length;
  const isVerified = confirmCount >= 3;

  const handleAttest = async (species: string, confidence: string) => {
    if (!userId) { toast.error("Please sign in to attest."); return; }
    setSubmitting(true);

    const { error } = await supabase.from("species_attestations" as any).insert({
      tree_id: treeId,
      user_id: userId,
      attested_species: species,
      confidence,
    });

    if (error) {
      if (error.code === "23505") toast.info("You've already attested this tree.");
      else toast.error("Failed to record attestation.");
      setSubmitting(false);
      return;
    }

    await issueRewards({
      userId, treeId, treeSpecies: species,
      actionType: "curation",
      s33dAmount: 1, speciesAmount: 1, influenceAmount: 1,
    });

    toast.success("Species attestation recorded! +1 Heart earned.");
    setUserAttested(true);
    setSubmitting(false);
    setShowCorrection(false);
    fetchAttestations();
  };

  if (!userId) return null;

  return (
    <div className="rounded-xl border border-border/40 p-4 bg-card/40 backdrop-blur space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="h-4 w-4 text-primary/70" />
          <h4 className="font-serif text-sm tracking-wide text-foreground">Species Verification</h4>
        </div>
        {isVerified ? (
          <Badge className="font-serif text-[9px] bg-primary/15 text-primary border-primary/30" variant="outline">
            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Verified
          </Badge>
        ) : (
          <Badge className="font-serif text-[9px]" variant="outline">
            <Users className="h-2.5 w-2.5 mr-0.5" /> {confirmCount}/3 confirmed
          </Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground font-serif">
        Is this tree correctly identified as <strong className="text-foreground">{treeSpecies}</strong>?
      </p>

      {userAttested ? (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-xs font-serif text-primary/70 flex items-center gap-1.5"
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> You've attested this tree's species.
        </motion.p>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              size="sm" variant="outline"
              className="flex-1 font-serif text-xs gap-1.5 border-primary/30 hover:bg-primary/10"
              onClick={() => handleAttest(treeSpecies, "high")}
              disabled={submitting}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Confirm Species
            </Button>
            <Button
              size="sm" variant="outline"
              className="font-serif text-xs gap-1.5"
              onClick={() => setShowCorrection(!showCorrection)}
              disabled={submitting}
            >
              <AlertTriangle className="h-3.5 w-3.5" /> Suggest Correction
            </Button>
          </div>

          <AnimatePresence>
            {showCorrection && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Correct species name…"
                  value={correctedSpecies}
                  onChange={(e) => setCorrectedSpecies(e.target.value)}
                  className="text-xs font-serif"
                />
                <Button
                  size="sm" className="font-serif text-xs shrink-0"
                  disabled={!correctedSpecies.trim() || submitting}
                  onClick={() => handleAttest(correctedSpecies.trim(), "medium")}
                >
                  Submit
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
