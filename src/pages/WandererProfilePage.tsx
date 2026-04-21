import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageShell from "@/components/PageShell";
import Header from "@/components/Header";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, MapPin, Compass, Heart, TreePine, Sparkles,
  UserPlus, UserMinus, HeartHandshake, Instagram, Twitter, Facebook,
} from "lucide-react";
import { getHiveInfo } from "@/utils/hiveUtils";
import { useWandererStreak } from "@/hooks/use-wanderer-streak";
import { useSpeciesBadges } from "@/hooks/use-species-badges";
import { useFollows, useCompanions } from "@/hooks/use-fellow-wanderers";
import StreakBadge from "@/components/growth/StreakBadge";
import SpeciesBadgeList from "@/components/growth/SpeciesBadgeList";
import { ROUTES } from "@/lib/routes";

interface VisibleFields {
  bio?: boolean;
  home_place?: boolean;
  instagram_handle?: boolean;
  x_handle?: boolean;
  facebook_handle?: boolean;
}

const initialsOf = (name: string | null | undefined) =>
  (name || "Wanderer")
    .split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

const WandererProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Current viewer (for follow/companion buttons)
  const [viewerId, setViewerId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setViewerId(data.user?.id ?? null));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["wanderer-profile", id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) return null;
      const { data: profile, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, avatar_url, bio, home_place, " +
          "instagram_handle, x_handle, facebook_handle, " +
          "invited_by_user_id, invites_sent, invites_accepted, invites_remaining, " +
          "visible_fields"
        )
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return profile;
    },
  });

  // Lineage — who invited this wanderer
  const inviterId = (data as any)?.invited_by_user_id as string | null | undefined;
  const { data: inviter } = useQuery({
    queryKey: ["wanderer-inviter", inviterId],
    enabled: Boolean(inviterId),
    queryFn: async () => {
      if (!inviterId) return null;
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", inviterId)
        .maybeSingle();
      return prof;
    },
  });

  // Species heart balances
  const { data: speciesBalances } = useQuery({
    queryKey: ["wanderer-species-hearts", id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from("species_heart_transactions")
        .select("species_family, amount")
        .eq("user_id", id);
      const familyMap = new Map<string, number>();
      (data || []).forEach((tx) => {
        familyMap.set(tx.species_family, (familyMap.get(tx.species_family) || 0) + tx.amount);
      });
      return Array.from(familyMap.entries())
        .map(([family, amount]) => ({ family, amount, hive: getHiveInfo(family) }))
        .sort((a, b) => b.amount - a.amount);
    },
  });

  // Growth engine data
  const { data: streak } = useWandererStreak(id);
  const { data: badges } = useSpeciesBadges(id);

  // Recent mapped trees
  const { data: recentTrees } = useQuery({
    queryKey: ["wanderer-recent-trees", id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) return [];
      const { data } = await supabase
        .from("trees")
        .select("id, name, species, created_at")
        .eq("created_by", id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // Connection hooks (only meaningful when viewing someone else's profile)
  const { isFollowing, follow, unfollow } = useFollows(viewerId || undefined);
  const { isCompanion, pendingFor, sendRequest } = useCompanions(viewerId || undefined);
  const isOwnProfile = viewerId && id && viewerId === id;
  const following = !isOwnProfile && id ? isFollowing(id) : false;
  const companion = !isOwnProfile && id ? isCompanion(id) : false;
  const pendingCompanion = !isOwnProfile && id ? pendingFor(id) : undefined;

  const initials = useMemo(() => initialsOf(data?.full_name), [data?.full_name]);

  // Visibility — respect the wanderer's choices
  const visible: VisibleFields = useMemo(
    () => ((data as any)?.visible_fields || {}) as VisibleFields,
    [data]
  );
  const showHandle = (key: keyof VisibleFields, value: string | null | undefined) =>
    Boolean(value && visible[key] !== false);

  const instagram = showHandle("instagram_handle", (data as any)?.instagram_handle)
    ? (data as any).instagram_handle
    : null;
  const xHandle = showHandle("x_handle", (data as any)?.x_handle) ? (data as any).x_handle : null;
  const facebook = showHandle("facebook_handle", (data as any)?.facebook_handle)
    ? (data as any).facebook_handle
    : null;
  const homePlaceVisible =
    (data as any)?.home_place && visible.home_place !== false ? (data as any).home_place : null;
  const bioVisible =
    (data as any)?.bio && visible.bio !== false ? (data as any).bio : null;

  return (
    <PageShell>
      <Header />
      <div className="min-h-screen pt-16 pb-24 px-4">
        <div className="max-w-xl mx-auto mt-6 space-y-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            ← Back
          </Button>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="font-serif text-lg">Wanderer Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading profile...
                </div>
              ) : data ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={data.avatar_url || undefined} alt={data.full_name || "Wanderer"} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-serif text-xl text-foreground">{data.full_name || "Wanderer"}</p>
                      <Badge variant="outline" className="text-[10px] mt-1">Public Profile</Badge>
                    </div>
                  </div>

                  {/* 🧬 Lineage strip */}
                  {inviter && (
                    <Link
                      to={ROUTES.WANDERER(inviter.id)}
                      className="flex items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 hover:border-primary/40 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                      <span className="text-[11px] font-serif text-muted-foreground">Invited by</span>
                      <Avatar className="h-6 w-6 border border-primary/15">
                        <AvatarImage src={inviter.avatar_url || undefined} alt={inviter.full_name || "Wanderer"} />
                        <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-serif">
                          {initialsOf(inviter.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-serif text-foreground hover:text-primary transition-colors truncate">
                        {inviter.full_name || "a wanderer"}
                      </span>
                    </Link>
                  )}

                  {/* 🤝 Connection buttons (only for other wanderers) */}
                  {viewerId && !isOwnProfile && id && (
                    <div className="flex flex-wrap gap-2">
                      {following ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs font-serif gap-1"
                          onClick={() => unfollow(id)}
                        >
                          <UserMinus className="w-3.5 h-3.5" /> Unfollow
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-serif gap-1 border-primary/30 text-primary hover:bg-primary/10"
                          onClick={() => follow(id)}
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Follow
                        </Button>
                      )}
                      {companion ? (
                        <Badge variant="outline" className="h-8 px-2 gap-1 text-[10px] border-primary/30 text-primary">
                          <HeartHandshake className="w-3 h-3" /> Companion
                        </Badge>
                      ) : pendingCompanion ? (
                        <Badge variant="secondary" className="h-8 px-2 text-[10px]">Companion request pending</Badge>
                      ) : following ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs font-serif gap-1"
                          onClick={() => sendRequest(id)}
                        >
                          <HeartHandshake className="w-3.5 h-3.5 text-primary/70" />
                          Request companion
                        </Button>
                      ) : null}
                    </div>
                  )}

                  {homePlaceVisible && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {homePlaceVisible}
                    </p>
                  )}

                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {bioVisible || "This wanderer has not added a biography yet."}
                  </p>

                  {/* 🌐 Social row */}
                  {(instagram || xHandle || facebook) && (
                    <div className="flex items-center gap-2 pt-1">
                      {instagram && (
                        <a
                          href={`https://instagram.com/${String(instagram).replace(/^@/, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="Instagram"
                        >
                          <Instagram className="w-4 h-4" />
                        </a>
                      )}
                      {xHandle && (
                        <a
                          href={`https://x.com/${String(xHandle).replace(/^@/, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="X"
                        >
                          <Twitter className="w-4 h-4" />
                        </a>
                      )}
                      {facebook && (
                        <a
                          href={`https://facebook.com/${String(facebook).replace(/^@/, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="Facebook"
                        >
                          <Facebook className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Mapping Streak */}
                  <StreakBadge streak={streak} />

                  {/* Species Discovery Badges */}
                  <SpeciesBadgeList badges={badges || []} />

                  {/* 🌱 Your path — invite lineage */}
                  {(((data as any)?.invites_sent ?? 0) > 0 ||
                    ((data as any)?.invites_accepted ?? 0) > 0 ||
                    ((data as any)?.invites_remaining ?? 0) > 0) && (
                    <div className="text-[11px] font-serif text-muted-foreground pt-1">
                      <span className="uppercase tracking-wider text-muted-foreground/70">
                        {isOwnProfile ? "Your path" : "Their path"}:
                      </span>{" "}
                      <span>{(data as any)?.invites_sent ?? 0} sent</span>
                      <span className="opacity-60"> · </span>
                      <span>{(data as any)?.invites_accepted ?? 0} accepted</span>
                      <span className="opacity-60"> · </span>
                      <span>{(data as any)?.invites_remaining ?? 0} remaining</span>
                    </div>
                  )}

                  {/* Recent Mapped Trees */}
                  {recentTrees && recentTrees.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-serif text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <TreePine className="w-3 h-3" /> Recently Mapped
                      </p>
                      <div className="space-y-1">
                        {recentTrees.map((t) => (
                          <Link
                            key={t.id}
                            to={ROUTES.TREE(t.id)}
                            className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                          >
                            <span className="font-serif">{t.name || "Unnamed tree"}</span>
                            {t.species && <span className="text-[10px] text-muted-foreground">({t.species})</span>}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Species Hearts Balances */}
                  {speciesBalances && speciesBalances.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-serif text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Heart className="w-3 h-3" /> Species Hearts
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {speciesBalances.slice(0, 8).map((b) => (
                          <Link key={b.family} to={`/hive/${b.hive.slug}`}>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-serif gap-1 cursor-pointer hover:border-primary/40 transition-colors"
                            >
                              <span>{b.hive.icon}</span>
                              <span className="tabular-nums font-bold">{b.amount}</span>
                              <span className="text-muted-foreground">{b.family}</span>
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button variant="sacred" size="sm" asChild>
                      <Link to="/map">
                        <Compass className="w-3.5 h-3.5 mr-1" /> Explore Map
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/discovery">Discover Ancient Trees</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground space-y-3">
                  <p>Wanderer profile not found.</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/discovery">Go to Discovery</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </PageShell>
  );
};

export default WandererProfilePage;
