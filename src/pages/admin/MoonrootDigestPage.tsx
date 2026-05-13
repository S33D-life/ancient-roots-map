import { useEffect, useState } from "react";
import { useHasRole } from "@/hooks/use-role";
import Header from "@/components/Header";
import { Shield, Loader2, Moon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { fetchAncientFriendsSummary } from "@/lib/moonroot/fetchAncientFriendsSummary";
import {
  emptyCouncilInvitation,
  emptyLedger,
  type CouncilInvitationDetails,
  type LunarLifeLedger,
  type MoonrootDigest,
  type MoonrootDigestType,
} from "@/lib/moonroot/types";
import DigestControls, { presetRange } from "@/components/admin/moonroot/DigestControls";
import DigestSummaryCards from "@/components/admin/moonroot/DigestSummaryCards";
import LunarLifeLedgerFields from "@/components/admin/moonroot/LunarLifeLedgerFields";
import CouncilInvitationFields from "@/components/admin/moonroot/CouncilInvitationFields";
import MoonrootEmailPreview from "@/components/admin/moonroot/MoonrootEmailPreview";
import { toast } from "@/hooks/use-toast";
import { track } from "@/lib/telemetry";

/**
 * Moonroot Digest — admin scroll builder.
 *
 * TODO (future):
 *  - Automated New Moon / Full Moon scheduling
 *  - Actual email sending (edge function)
 *  - Saved digest archive (table)
 *  - User-facing digest page
 *  - Seed / book / foraging / preserving / herbs / garden data tables
 *  - Council record integration (auto-fill invitation from latest cycle)
 *  - Downloadable / mintable scroll version
 */
export default function MoonrootDigestPage() {
  const { hasRole, loading: roleLoading } = useHasRole("curator");

  const initial = presetRange("new_moon");
  const [userId, setUserId] = useState("");
  const [type, setType] = useState<MoonrootDigestType>("new_moon");
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);

  const [ledger, setLedger] = useState<LunarLifeLedger>(emptyLedger());
  const [council, setCouncil] = useState<CouncilInvitationDetails>(emptyCouncilInvitation());

  const [digest, setDigest] = useState<MoonrootDigest | null>(null);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    if (!userId) return;
    setGenerating(true);
    try {
      const startISO = new Date(`${startDate}T00:00:00`).toISOString();
      const endISO = new Date(`${endDate}T23:59:59`).toISOString();

      const summary = await fetchAncientFriendsSummary(userId, startISO, endISO);

      // Best-effort profile read (will succeed only if RLS permits, e.g. self)
      let fullName: string | null = null;
      try {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .maybeSingle();
        fullName = data?.full_name ?? null;
      } catch (err) {
        console.warn("[Moonroot] profile read failed (RLS expected for non-self):", err);
      }

      const next: MoonrootDigest = {
        user: { userId, fullName },
        type,
        startDate: startISO,
        endDate: endISO,
        ancientFriendsSummary: summary,
        lunarLifeLedger: ledger,
        councilInvitation: council,
        generatedAt: new Date().toISOString(),
      };
      setDigest(next);
      toast({ title: "Moonroot Digest gathered", description: "Scroll below to preview & copy." });
    } catch (err) {
      console.error("[Moonroot] generation failed", err);
      toast({
        title: "Could not gather this digest yet",
        description: "Check the user ID and date range.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  // Re-render preview live as ledger / council fields change after first generation
  const liveDigest: MoonrootDigest | null = digest
    ? { ...digest, lunarLifeLedger: ledger, councilInvitation: council }
    : null;

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasRole) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-serif text-foreground mb-2">Curator access required</h1>
          <p className="text-muted-foreground font-serif">Moonroot Digest is reserved for Heartwood Curators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-24 max-w-4xl space-y-6">
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-primary">
            <Moon className="w-5 h-5" />
            <span className="font-serif tracking-widest text-xs uppercase">Moonroot Digest</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-foreground">A scroll for this moon</h1>
          <p className="text-sm text-muted-foreground font-serif italic max-w-xl mx-auto">
            Gather what moved through a Wanderer's grove — to send alongside the Council of Life invitation.
          </p>
        </header>

        <Card className="bg-card/70 border-primary/20">
          <CardHeader><CardTitle className="font-serif text-xl">Compose</CardTitle></CardHeader>
          <CardContent>
            <DigestControls
              userId={userId}
              type={type}
              startDate={startDate}
              endDate={endDate}
              loading={generating}
              onUserId={setUserId}
              onType={setType}
              onStart={setStartDate}
              onEnd={setEndDate}
              onGenerate={generate}
            />
          </CardContent>
        </Card>

        {liveDigest && (
          <>
            <Card className="bg-card/70 border-primary/20">
              <CardHeader><CardTitle className="font-serif text-xl">Ancient Friends</CardTitle></CardHeader>
              <CardContent>
                <DigestSummaryCards summary={liveDigest.ancientFriendsSummary} />
              </CardContent>
            </Card>

            <Card className="bg-card/70 border-primary/20">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Lunar Life Ledger</CardTitle>
                <p className="text-xs text-muted-foreground font-serif italic">
                  Manual for now — future moons will draw from seed, book, garden &amp; foraging tables.
                </p>
              </CardHeader>
              <CardContent>
                <LunarLifeLedgerFields value={ledger} onChange={setLedger} />
              </CardContent>
            </Card>

            <Card className="bg-card/70 border-primary/20">
              <CardHeader><CardTitle className="font-serif text-xl">Council Invitation</CardTitle></CardHeader>
              <CardContent>
                <CouncilInvitationFields value={council} onChange={setCouncil} />
              </CardContent>
            </Card>

            <Card className="bg-card/70 border-primary/20">
              <CardHeader><CardTitle className="font-serif text-xl">Email Preview</CardTitle></CardHeader>
              <CardContent>
                <MoonrootEmailPreview digest={liveDigest} />
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
