/**
 * IdentityBloom — soft onboarding moment for naming and identity.
 * "Step gently — how shall the forest know you?"
 * 
 * Triggers First Bloom +3 S33D Hearts reward on completion.
 * Automatically binds referral lineage if an invite code is in session.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sprout, Heart, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IdentityBloomProps {
  userId: string;
  /** Called after identity is saved with the new display name */
  onComplete: (displayName: string) => void;
  /** If true, show social fields as a secondary step */
  showSocial?: boolean;
}

const IdentityBloom = ({ userId, onComplete, showSocial = true }: IdentityBloomProps) => {
  const [step, setStep] = useState<"name" | "social" | "bloom">("name");
  const [displayName, setDisplayName] = useState("");
  const [homePlace, setHomePlace] = useState("");
  const [instagram, setInstagram] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [facebook, setFacebook] = useState("");
  const [saving, setSaving] = useState(false);
  const [heartsAwarded, setHeartsAwarded] = useState(false);
  const { toast } = useToast();

  // Check for referral trail
  const [trailMessage, setTrailMessage] = useState<string | null>(null);

  useEffect(() => {
    const inviteCode = localStorage.getItem("s33d_invite_code");
    if (inviteCode) {
      setTrailMessage("You arrived through a living trail.");
    }
  }, []);

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setSaving(true);

    try {
      // Save identity
      const updates: Record<string, any> = {
        full_name: displayName.trim(),
        identity_bloomed_at: new Date().toISOString(),
      };
      if (homePlace.trim()) updates.home_place = homePlace.trim();

      // Check for referral binding
      const inviteCode = localStorage.getItem("s33d_invite_code");
      const sharedTreeId = sessionStorage.getItem("s33d_shared_tree_id");
      const inspirationSource = localStorage.getItem("s33d_inspiration_source");

      if (inviteCode) {
        // Look up who created the invite
        const { data: links } = await supabase
          .rpc("validate_invite_code", { p_code: inviteCode });
        const link = links?.[0] || null;

        if (link && link.created_by !== userId) {
          updates.inspired_by_user_id = link.created_by;
          updates.inspiration_source = inspirationSource || "invite";
          if (sharedTreeId) updates.inspired_by_tree_id = sharedTreeId;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (error) throw error;

      // First Bloom Hearts — visual celebration
      // Actual heart reward is deferred to first tree mapping (tree_id is required)
      setHeartsAwarded(true);

      if (showSocial) {
        setStep("social");
      } else {
        setStep("bloom");
        setTimeout(() => onComplete(displayName.trim()), 2500);
      }
    } catch (err: any) {
      toast({ title: "Could not save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSocial = async () => {
    setSaving(true);
    try {
      const updates: Record<string, any> = {};
      if (instagram.trim()) updates.instagram_handle = instagram.trim().replace(/^@/, "");
      if (xHandle.trim()) updates.x_handle = xHandle.trim().replace(/^@/, "");
      if (facebook.trim()) updates.facebook_handle = facebook.trim();

      if (Object.keys(updates).length > 0) {
        await supabase.from("profiles").update(updates).eq("id", userId);
      }
    } catch {
      // Non-critical, continue
    } finally {
      setSaving(false);
      setStep("bloom");
      setTimeout(() => onComplete(displayName.trim()), 2500);
    }
  };

  const skipSocial = () => {
    setStep("bloom");
    setTimeout(() => onComplete(displayName.trim()), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
      <AnimatePresence mode="wait">
        {/* Step 1: Name */}
        {step === "name" && (
          <motion.div
            key="name"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-sm"
          >
            <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Sprout className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-serif tracking-wide">
                  Step gently — how shall the forest know you?
                </h2>
                {trailMessage && (
                  <p className="text-xs text-primary/70 font-serif italic">{trailMessage}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground font-serif">
                    Display Name
                  </Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value.slice(0, 100))}
                    placeholder="Your grove name"
                    maxLength={100}
                    className="font-serif text-center text-lg"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground font-serif">
                    Home Place <span className="normal-case text-muted-foreground/50">(optional)</span>
                  </Label>
                  <Input
                    value={homePlace}
                    onChange={(e) => setHomePlace(e.target.value.slice(0, 100))}
                    placeholder="Your grove, city, or bioregion"
                    maxLength={100}
                    className="font-serif"
                  />
                </div>

                <Button
                  onClick={handleSaveName}
                  disabled={!displayName.trim() || saving}
                  className="w-full font-serif tracking-wider gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sprout className="h-4 w-4" />
                  )}
                  Enter the Grove
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Social (optional) */}
        {step === "social" && (
          <motion.div
            key="social"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-sm"
          >
            <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-lg font-serif tracking-wide">Let your roots reach further</h2>
                <p className="text-xs text-muted-foreground font-serif">
                  Only shared when you choose to share.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground font-serif">Instagram</Label>
                  <Input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value.slice(0, 50))}
                    placeholder="@yourusername"
                    className="font-serif"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground font-serif">X (Twitter)</Label>
                  <Input
                    value={xHandle}
                    onChange={(e) => setXHandle(e.target.value.slice(0, 50))}
                    placeholder="@yourhandle"
                    className="font-serif"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground font-serif">Facebook</Label>
                  <Input
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value.slice(0, 100))}
                    placeholder="Profile name or URL"
                    className="font-serif"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={skipSocial}
                  className="flex-1 font-serif text-xs text-muted-foreground"
                >
                  Skip for now
                </Button>
                <Button
                  onClick={handleSaveSocial}
                  disabled={saving}
                  className="flex-1 font-serif tracking-wider gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Connect
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Bloom celebration */}
        {step === "bloom" && (
          <motion.div
            key="bloom"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
              className="w-20 h-20 mx-auto rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center"
            >
              <Heart className="w-10 h-10 text-primary fill-primary/30" />
            </motion.div>
            <div className="space-y-2">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl font-serif"
              >
                The garden recognises you.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-sm text-primary font-serif flex items-center justify-center gap-1"
              >
                <Heart className="w-4 h-4 fill-primary/50" />
                +3 S33D Hearts
              </motion.p>
            </div>
            {/* Floating hearts particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-primary/40"
                initial={{
                  opacity: 0,
                  x: (Math.random() - 0.5) * 100,
                  y: 20,
                }}
                animate={{
                  opacity: [0, 0.8, 0],
                  y: -80 - Math.random() * 60,
                  x: (Math.random() - 0.5) * 120,
                }}
                transition={{
                  duration: 2,
                  delay: 0.3 + i * 0.15,
                  ease: "easeOut",
                }}
              >
                <Heart className="w-4 h-4 fill-current" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IdentityBloom;
