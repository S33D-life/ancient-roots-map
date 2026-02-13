import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useFollows, useCompanions, useWandererSearch, WandererProfile } from "@/hooks/use-fellow-wanderers";
import { useReferrals } from "@/hooks/use-referrals";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, UserPlus, UserMinus, Heart, HeartHandshake, Check, X, Loader2, Users, Copy, TreeDeciduous, Gift, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  userId: string;
}

const WandererCard = ({
  profile,
  userId,
  isFollowing,
  isCompanion,
  pendingCompanion,
  onFollow,
  onUnfollow,
  onCompanionRequest,
}: {
  profile: WandererProfile;
  userId: string;
  isFollowing: boolean;
  isCompanion: boolean;
  pendingCompanion: any;
  onFollow: () => void;
  onUnfollow: () => void;
  onCompanionRequest: () => void;
}) => {
  if (profile.id === userId) return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all">
      <Avatar className="h-10 w-10 border border-primary/20">
        <AvatarImage src={profile.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary font-serif text-sm">
          {(profile.full_name || "?")[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-serif text-sm text-foreground truncate">{profile.full_name || "Wanderer"}</p>
        {profile.bio && <p className="text-[11px] text-muted-foreground truncate">{profile.bio}</p>}
        <div className="flex gap-1 mt-1">
          {isCompanion && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary">
              <HeartHandshake className="w-2.5 h-2.5 mr-0.5" /> Companion
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {isFollowing ? (
          <Button variant="ghost" size="sm" className="h-8 text-xs font-serif gap-1" onClick={onUnfollow}>
            <UserMinus className="w-3.5 h-3.5" /> Unfollow
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="h-8 text-xs font-serif gap-1 border-primary/30 text-primary hover:bg-primary/10" onClick={onFollow}>
            <UserPlus className="w-3.5 h-3.5" /> Follow
          </Button>
        )}
        {!isCompanion && !pendingCompanion && isFollowing && (
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Request Grove Companion" onClick={onCompanionRequest}>
            <HeartHandshake className="w-4 h-4 text-primary/60" />
          </Button>
        )}
        {pendingCompanion && (
          <Badge variant="secondary" className="text-[9px]">Pending</Badge>
        )}
      </div>
    </div>
  );
};

const DashboardWanderers = ({ userId }: Props) => {
  const { following, followers, loading: followLoading, follow, unfollow, isFollowing, refresh: refreshFollows } = useFollows(userId);
  const { companions, loading: compLoading, sendRequest, respond, remove, isCompanion, pendingFor, refresh: refreshCompanions } = useCompanions(userId);
  const { results, searching, search, clearResults } = useWandererSearch();
  const { referrals, referredBy, totalTreesFromReferrals, loading: refLoading } = useReferrals(userId);
  const [searchQuery, setSearchQuery] = useState("");
  const [profiles, setProfiles] = useState<Record<string, WandererProfile>>({});
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const { toast } = useToast();

  // Load existing invite code on mount
  useEffect(() => {
    supabase
      .from("invite_links")
      .select("code")
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setInviteCode(data.code);
      });
  }, [userId]);

  // Fetch profiles for followed/following users
  useEffect(() => {
    const ids = new Set<string>();
    following.forEach((f) => ids.add(f.following_id));
    followers.forEach((f) => ids.add(f.follower_id));
    companions.forEach((c) => { ids.add(c.requester_id); ids.add(c.recipient_id); });
    ids.delete(userId);

    const idsArr = Array.from(ids);
    if (idsArr.length === 0) return;

    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, bio, is_discoverable")
      .in("id", idsArr)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, WandererProfile> = {};
          (data as WandererProfile[]).forEach((p) => (map[p.id] = p));
          setProfiles((prev) => ({ ...prev, ...map }));
        }
      });
  }, [following, followers, companions, userId]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => search(q), 350);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for insecure contexts / permission denied
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch { /* noop */ }
      document.body.removeChild(ta);
      return true;
    }
  };

  const generateInvite = async () => {
    setGeneratingInvite(true);
    // Reuse existing invite link if available
    if (inviteCode) {
      const link = `${window.location.origin}/auth?invite=${inviteCode}`;
      await copyToClipboard(link);
      toast({ title: "Invite link copied!", description: link });
      setGeneratingInvite(false);
      return;
    }
    const { data, error } = await supabase
      .from("invite_links")
      .insert({ created_by: userId })
      .select("code")
      .single();
    if (error) {
      toast({ title: "Error", description: "Could not create invite link", variant: "destructive" });
      setGeneratingInvite(false);
      return;
    }
    if (data) {
      const link = `${window.location.origin}/auth?invite=${data.code}`;
      setInviteCode(data.code);
      await copyToClipboard(link);
      toast({ title: "Invite link copied!", description: link });
    }
    setGeneratingInvite(false);
  };

  const pendingIncoming = companions.filter((c) => c.status === "pending" && c.recipient_id === userId);
  const activeCompanions = companions.filter((c) => c.status === "accepted");

  const getProfile = (id: string): WandererProfile =>
    profiles[id] || { id, full_name: null, avatar_url: null, bio: null, is_discoverable: true };

  return (
    <div className="space-y-6">
      {/* Search wanderers */}
      <Card className="bg-card/50 backdrop-blur border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Find Fellow Wanderers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by name..."
                className="pl-9 font-serif"
              />
            </div>
            <Button variant="outline" size="sm" className="font-serif text-xs gap-1 shrink-0" onClick={generateInvite} disabled={generatingInvite}>
              {generatingInvite ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
              {inviteCode ? "Copy Link" : "Invite Link"}
            </Button>
          </div>

          {searching && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}

          {results.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((p) => (
                <WandererCard
                  key={p.id}
                  profile={p}
                  userId={userId}
                  isFollowing={isFollowing(p.id)}
                  isCompanion={isCompanion(p.id)}
                  pendingCompanion={pendingFor(p.id)}
                  onFollow={() => follow(p.id)}
                  onUnfollow={() => unfollow(p.id)}
                  onCompanionRequest={() => sendRequest(p.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Impact */}
      <Card className="bg-card/50 backdrop-blur border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Referral Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-2xl font-serif text-primary">{referrals.length}</p>
              <p className="text-[10px] text-muted-foreground">Wanderers Invited</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-2xl font-serif text-primary">{totalTreesFromReferrals}</p>
              <p className="text-[10px] text-muted-foreground">Trees They Mapped</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-2xl font-serif text-primary">{totalTreesFromReferrals * 10}</p>
              <p className="text-[10px] text-muted-foreground">Hearts Inspired</p>
            </div>
          </div>
          {referredBy && (
            <p className="text-xs text-muted-foreground font-serif text-center mb-3">
              You were invited by <span className="text-primary">{referredBy.name || "a fellow wanderer"}</span>
            </p>
          )}
          {referrals.length > 0 && (
            <div className="space-y-1.5 max-h-32 overflow-y-auto mb-3">
              {referrals.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-xs">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={r.invitee_avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[8px]">
                      {(r.invitee_name || "?")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-serif text-foreground truncate flex-1">{r.invitee_name || "Wanderer"}</span>
                  <span className="text-muted-foreground flex items-center gap-0.5">
                    <TreeDeciduous className="w-3 h-3" /> {r.invitee_trees}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link to="/referrals">
            <Button variant="outline" size="sm" className="w-full font-serif text-xs gap-1">
              View Full Impact <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Pending companion requests */}
      {pendingIncoming.length > 0 && (
        <Card className="bg-card/50 backdrop-blur border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-primary" />
              Companion Requests
              <Badge className="text-[10px] bg-primary/20 text-primary">{pendingIncoming.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingIncoming.map((req) => {
              const p = getProfile(req.requester_id);
              return (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/30">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={p.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-serif text-xs">
                      {(p.full_name || "?")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <p className="flex-1 font-serif text-sm">{p.full_name || "Wanderer"}</p>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:bg-green-500/10" onClick={() => respond(req.id, true)}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => respond(req.id, false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Following / Followers / Companions tabs */}
      <Tabs defaultValue="following">
        <TabsList className="bg-card/50 backdrop-blur border border-border/40">
          <TabsTrigger value="following" className="font-serif text-xs gap-1">
            Following <Badge variant="secondary" className="text-[9px] ml-1">{following.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="followers" className="font-serif text-xs gap-1">
            Followers <Badge variant="secondary" className="text-[9px] ml-1">{followers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="companions" className="font-serif text-xs gap-1">
            <HeartHandshake className="w-3.5 h-3.5" /> Companions <Badge variant="secondary" className="text-[9px] ml-1">{activeCompanions.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="following" className="space-y-2 mt-4">
          {following.length === 0 ? (
            <p className="text-sm text-muted-foreground font-serif text-center py-8">You're not following anyone yet. Search for wanderers above!</p>
          ) : (
            following.map((f) => {
              const p = getProfile(f.following_id);
              return (
                <WandererCard
                  key={f.id}
                  profile={p}
                  userId={userId}
                  isFollowing={true}
                  isCompanion={isCompanion(f.following_id)}
                  pendingCompanion={pendingFor(f.following_id)}
                  onFollow={() => {}}
                  onUnfollow={() => unfollow(f.following_id)}
                  onCompanionRequest={() => sendRequest(f.following_id)}
                />
              );
            })
          )}
        </TabsContent>

        <TabsContent value="followers" className="space-y-2 mt-4">
          {followers.length === 0 ? (
            <p className="text-sm text-muted-foreground font-serif text-center py-8">No followers yet. Share your profile to grow your grove!</p>
          ) : (
            followers.map((f) => {
              const p = getProfile(f.follower_id);
              return (
                <WandererCard
                  key={f.id}
                  profile={p}
                  userId={userId}
                  isFollowing={isFollowing(f.follower_id)}
                  isCompanion={isCompanion(f.follower_id)}
                  pendingCompanion={pendingFor(f.follower_id)}
                  onFollow={() => follow(f.follower_id)}
                  onUnfollow={() => unfollow(f.follower_id)}
                  onCompanionRequest={() => sendRequest(f.follower_id)}
                />
              );
            })
          )}
        </TabsContent>

        <TabsContent value="companions" className="space-y-2 mt-4">
          {activeCompanions.length === 0 ? (
            <p className="text-sm text-muted-foreground font-serif text-center py-8">No grove companions yet. Follow someone, then request companionship!</p>
          ) : (
            activeCompanions.map((c) => {
              const otherId = c.requester_id === userId ? c.recipient_id : c.requester_id;
              const p = getProfile(otherId);
              return (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
                  <Avatar className="h-10 w-10 border border-primary/30">
                    <AvatarImage src={p.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-serif text-sm">
                      {(p.full_name || "?")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm">{p.full_name || "Wanderer"}</p>
                    <p className="text-[10px] text-muted-foreground">Grove Companion since {new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-destructive/60 hover:text-destructive" onClick={() => remove(c.id)}>
                    Remove
                  </Button>
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardWanderers;
