import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, TreeDeciduous, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Tree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  what3words: string;
  created_at: string;
}

interface Profile {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

const DashboardPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        } else {
          // Defer data fetching
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchUserTrees(session.user.id);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else {
        fetchProfile(session.user.id);
        fetchUserTrees(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data);
    }
  };

  const fetchUserTrees = async (userId: string) => {
    const { data, error } = await supabase
      .from("trees")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching trees:", error);
      toast({
        title: "Error loading trees",
        description: "Failed to load your trees",
        variant: "destructive",
      });
    } else {
      setTrees(data || []);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || user?.email?.[0].toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Profile Section */}
          <Card className="border-mystical bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl font-serif text-mystical">
                Personal Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-6">
                  <Avatar className="w-20 h-20 border-2 border-mystical">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-serif text-foreground">
                      {profile?.full_name || "Ancient Friend"}
                    </h2>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Member since {new Date(user?.created_at || "").toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trees Section */}
          <Card className="border-mystical bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-serif text-mystical flex items-center gap-2">
                  <TreeDeciduous className="w-5 h-5" />
                  Your Ancient Friends ({trees.length})
                </CardTitle>
                <Button
                  variant="sacred"
                  size="sm"
                  onClick={() => navigate("/map")}
                >
                  Add Tree
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {trees.length === 0 ? (
                <div className="text-center py-12">
                  <TreeDeciduous className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    You haven't added any trees yet
                  </p>
                  <Button variant="sacred" onClick={() => navigate("/map")}>
                    Explore Map
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trees.map((tree) => (
                    <Card
                      key={tree.id}
                      className="border-border hover:border-mystical transition-all cursor-pointer"
                      onClick={() => navigate(`/map`)}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-serif text-lg text-mystical mb-1">
                          {tree.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {tree.species}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          📍 {tree.what3words}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Added {new Date(tree.created_at).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;