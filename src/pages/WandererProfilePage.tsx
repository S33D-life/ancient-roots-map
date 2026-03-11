import { useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageShell from "@/components/PageShell";
import Header from "@/components/Header";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, Compass, Heart, TreePine } from "lucide-react";
import { getHiveInfo } from "@/utils/hiveUtils";
import { useWandererStreak } from "@/hooks/use-wanderer-streak";
import { useSpeciesBadges } from "@/hooks/use-species-badges";
import StreakBadge from "@/components/growth/StreakBadge";
import SpeciesBadgeList from "@/components/growth/SpeciesBadgeList";
import { ROUTES } from "@/lib/routes";

const WandererProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["wanderer-profile", id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) return null;
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, home_place")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return profile;
    },
  });

  // Fetch species heart balances for this wanderer
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
      (data || []).forEach(tx => {
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

  const initials = useMemo(() => {
    const name = data?.full_name || "Wanderer";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [data?.full_name]);

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

                  {data.home_place && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {data.home_place}
                    </p>
                  )}

                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {data.bio || "This wanderer has not added a biography yet."}
                  </p>

                  {/* Mapping Streak */}
                  <StreakBadge streak={streak} />

                  {/* Species Discovery Badges */}
                  <SpeciesBadgeList badges={badges || []} />

                  {/* Species Hearts Balances */}
                  {speciesBalances && speciesBalances.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-serif text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Heart className="w-3 h-3" /> Species Hearts
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {speciesBalances.slice(0, 8).map(b => (
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
