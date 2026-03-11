import { useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageShell from "@/components/PageShell";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, Compass, Heart } from "lucide-react";
import { getHiveInfo } from "@/utils/hiveUtils";

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
      <BottomNav />
    </PageShell>
  );
};

export default WandererProfilePage;
