import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useReferrals } from "@/hooks/use-referrals";
import { useInvitationAllowance } from "@/hooks/use-invitation-allowance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Gift, TreeDeciduous, Heart, Copy, Users, ArrowLeft, Loader2, Sprout, Share2, Milestone,
} from "lucide-react";
import TelegramBotLink from "@/components/referrals/TelegramBotLink";

/* ── Milestones — presented as grove growth, not leaderboard ── */
const MILESTONES = [
  { count: 1, label: "First Seed", emoji: "🌱" },
  { count: 3, label: "Sapling Grove", emoji: "🌿" },
  { count: 7, label: "Young Canopy", emoji: "🌳" },
  { count: 15, label: "Spreading Roots", emoji: "🌲" },
  { count: 30, label: "Ancient Network", emoji: "🏛️" },
];

const ReferralsPage = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate("/auth"); return; }
      setUserId(user.id);
      supabase
        .from("invite_links")
        .select("code")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => { if (data) setInviteCode(data.code); });
    });
  }, [navigate]);

  const { referrals, referredBy, totalTreesFromReferrals, loading } = useReferrals(userId ?? undefined);
  const { allowance } = useInvitationAllowance(userId);

  // Milestone progress
  const currentMilestone = useMemo(() => {
    for (let i = MILESTONES.length - 1; i >= 0; i--) {
      if (referrals.length >= MILESTONES[i].count) return MILESTONES[i];
    }
    return null;
  }, [referrals.length]);

  const nextMilestone = useMemo(() => {
    return MILESTONES.find(m => m.count > referrals.length) || null;
  }, [referrals.length]);

  const milestoneProgress = nextMilestone
    ? Math.min(100, (referrals.length / nextMilestone.count) * 100)
    : 100;

  const heartsFromNetwork = totalTreesFromReferrals * 10;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
      return true;
    }
  };

  const generateInvite = async () => {
    if (!userId) return;
    setGenerating(true);
    const { data, error } = await supabase
      .from("invite_links")
      .insert({ created_by: userId })
      .select("code")
      .single();
    if (data) {
      setInviteCode(data.code);
      const link = `${window.location.origin}/auth?invite=${data.code}`;
      await copyToClipboard(link);
      toast({ title: "Invite link copied!", description: link });
    }
    if (error) {
      toast({ title: "Error", description: "Could not create invite link", variant: "destructive" });
    }
    setGenerating(false);
  };

  const shareLink = inviteCode ? `${window.location.origin}/auth?invite=${inviteCode}` : null;

  const shareVia = (platform: "whatsapp" | "telegram" | "native") => {
    if (!shareLink) return;
    const text = "🌳 Join me in the Living Atlas of Ancient Friends. Map trees, earn hearts, grow a grove.";
    const fullText = `${text}\n\n${shareLink}`;

    if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, "_blank");
    } else if (platform === "telegram") {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(text)}`, "_blank");
    } else if (navigator.share) {
      navigator.share({ title: "S33D.life — Ancient Friends", text, url: shareLink }).catch(() => {});
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl mx-auto px-4 pb-20 space-y-6" style={{ paddingTop: 'var(--content-top)' }}>
        {/* Back */}
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-serif">
          <ArrowLeft className="w-4 h-4" /> Back to Hearth
        </Link>

        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-serif">Your Grove</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            See the living network you've grown. Every wanderer you invite plants seeds in the grove.
          </p>

          {/* Grove Spread Badge */}
          {referrals.length > 0 && (
            <Badge variant="outline" className="text-xs border-primary/40 font-serif gap-1">
              🌿 Grove Spread: {referrals.length}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-card/50 backdrop-blur border-border/40 text-center">
            <CardContent className="p-4">
              <Users className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-3xl font-serif text-foreground">{referrals.length}</p>
              <p className="text-[10px] text-muted-foreground">Wanderers Invited</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/40 text-center">
            <CardContent className="p-4">
              <TreeDeciduous className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-3xl font-serif text-foreground">{totalTreesFromReferrals}</p>
              <p className="text-[10px] text-muted-foreground">Trees Inspired</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/40 text-center">
            <CardContent className="p-4">
              <Heart className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-3xl font-serif text-foreground">{heartsFromNetwork}</p>
              <p className="text-[10px] text-muted-foreground">Hearts from Network</p>
            </CardContent>
          </Card>
        </div>

        {/* Milestone Progress */}
        {nextMilestone && (
          <Card className="bg-card/50 backdrop-blur border-border/40">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-serif">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  {currentMilestone ? (
                    <span>{currentMilestone.emoji} {currentMilestone.label}</span>
                  ) : (
                    <span>🌰 Getting Started</span>
                  )}
                </span>
                <span className="text-primary/70">
                  {nextMilestone.emoji} {nextMilestone.label} ({nextMilestone.count})
                </span>
              </div>
              <Progress value={milestoneProgress} className="h-2" />
              <p className="text-[10px] text-muted-foreground text-center">
                {nextMilestone.count - referrals.length} more wanderer{nextMilestone.count - referrals.length !== 1 ? "s" : ""} to reach {nextMilestone.label}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Referred by */}
        {referredBy && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Sprout className="w-5 h-5 text-primary shrink-0" />
              <p className="text-sm font-serif text-foreground">
                Your journey was sparked by <span className="text-primary font-semibold">{referredBy.name || "a fellow wanderer"}</span>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Invite Link */}
        <Card className="bg-card/50 backdrop-blur border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Invite to the Grove
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {shareLink ? (
              <>
                <div className="flex gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="font-mono text-xs"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1 font-serif min-h-[44px]"
                    onClick={async () => {
                      await copyToClipboard(shareLink);
                      toast({ title: "Copied!", description: "Link copied to clipboard" });
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </Button>
                </div>

                {/* Quick share buttons — 1 tap */}
                <div className="flex gap-2">
                  {typeof navigator !== "undefined" && "share" in navigator && (
                    <Button
                      onClick={() => shareVia("native")}
                      className="flex-1 font-serif text-xs gap-1.5 min-h-[44px]"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => shareVia("whatsapp")}
                    className="flex-1 font-serif text-xs gap-1.5 min-h-[44px]"
                  >
                    💬 WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => shareVia("telegram")}
                    className="flex-1 font-serif text-xs gap-1.5 min-h-[44px]"
                  >
                    ✈️ Telegram
                  </Button>
                </div>
              </>
            ) : (
              <Button onClick={generateInvite} disabled={generating} className="w-full font-serif gap-1 min-h-[44px]">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                Generate Invite Link
              </Button>
            )}
            {inviteCode && <TelegramBotLink inviteCode={inviteCode} />}
            <p className="text-[11px] text-muted-foreground">
              Share this link with friends. When they sign up and map trees, you'll see the impact here.
            </p>
          </CardContent>
        </Card>

        {/* Referred Wanderers */}
        <Card className="bg-card/50 backdrop-blur border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Your Wanderers
              {referrals.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">{referrals.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Gift className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground font-serif">
                  No wanderers invited yet. Share your link to start growing the grove!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {referrals.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/30 hover:border-primary/20 transition-all">
                    <Avatar className="h-9 w-9 border border-primary/20">
                      <AvatarImage src={r.invitee_avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-serif text-xs">
                        {(r.invitee_name || "?")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm truncate">{r.invitee_name || "Wanderer"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Joined {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1">
                        <TreeDeciduous className="w-3.5 h-3.5 text-primary/60" />
                        {r.invitee_trees}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-primary/60 fill-primary/20" />
                        {r.invitee_trees * 10}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ReferralsPage;
