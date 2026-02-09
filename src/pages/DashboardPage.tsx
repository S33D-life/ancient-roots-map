import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WalletConnect from "@/components/WalletConnect";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, TreeDeciduous, LogOut, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseCSV, generateCSV, downloadCSV } from "@/utils/csvHandler";
import { convertToCoordinates } from "@/utils/what3words";
import PhotoImport from "@/components/PhotoImport";
import { Progress } from "@/components/ui/progress";

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
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, startTime: 0 });
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

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const startTime = Date.now();

    try {
      const text = await file.text();
      const csvRows = parseCSV(text);

      if (csvRows.length === 0) {
        toast({
          title: "Invalid CSV",
          description: "No valid tree data found in the CSV file",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      const totalTrees = csvRows.length;
      setImportProgress({ current: 0, total: totalTrees, startTime });

      toast({
        title: "Converting coordinates...",
        description: `Processing ${csvRows.length} trees`,
      });

      // Convert coordinates with progress tracking
      const treeData: any[] = [];
      
      for (let i = 0; i < csvRows.length; i++) {
        const row = csvRows[i];
        try {
          const coords = await convertToCoordinates(row.what3words);
          if (coords) {
            treeData.push({
              ...row,
              latitude: coords.coordinates.lat,
              longitude: coords.coordinates.lng,
            });
          }
          
          // Update progress
          setImportProgress({ 
            current: i + 1, 
            total: totalTrees, 
            startTime 
          });
        } catch (error) {
          console.error(`Failed to convert ${row.what3words}:`, error);
        }
      }

      if (treeData.length === 0) {
        toast({
          title: "Conversion failed",
          description: "Could not convert what3words addresses to coordinates",
          variant: "destructive",
        });
        setIsImporting(false);
        setImportProgress({ current: 0, total: 0, startTime: 0 });
        return;
      }

      const treesToInsert = treeData.map(tree => ({
        ...tree,
        created_by: user?.id,
      }));

      const { error } = await supabase
        .from('trees')
        .insert(treesToInsert);

      if (error) throw error;

      toast({
        title: "Import successful",
        description: `Successfully imported ${treeData.length} trees`,
      });

      // Refresh trees list
      if (user) {
        fetchUserTrees(user.id);
      }

      // Reset the input
      event.target.value = '';
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: "An error occurred while importing the CSV",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportProgress({ current: 0, total: 0, startTime: 0 });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const { data: trees, error } = await supabase
        .from('trees')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!trees || trees.length === 0) {
        toast({
          title: "No data to export",
          description: "You don't have any trees to export",
          variant: "destructive",
        });
        setIsExporting(false);
        return;
      }

      const csv = generateCSV(trees);
      const filename = `my-ancient-friends-${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csv, filename);

      toast({
        title: "Export successful",
        description: `Exported ${trees.length} trees to ${filename}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting the CSV",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
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

          {/* Wallet & Staff NFT Section */}
          <Card className="border-mystical bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl font-serif text-mystical">
                Non-Fungible Twig
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WalletConnect />
            </CardContent>
          </Card>

          {/* Import/Export Section */}
          <Card className="border-mystical bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl font-serif text-mystical">
                Import & Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <PhotoImport />
                
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImport}
                    className="hidden"
                    id="csv-upload-dashboard"
                    disabled={isImporting}
                  />
                  <label htmlFor="csv-upload-dashboard">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isImporting}
                      className="cursor-pointer"
                      asChild
                    >
                      <span>
                        {isImporting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Import CSV
                      </span>
                    </Button>
                  </label>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export My Trees
                </Button>
              </div>
              
              {isImporting && importProgress.total > 0 && (
                <div className="mt-4 p-4 border border-mystical rounded-lg bg-background/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">
                      Converting trees: {importProgress.current} / {importProgress.total}
                    </span>
                    <span className="text-muted-foreground">
                      {(() => {
                        const elapsed = (Date.now() - importProgress.startTime) / 1000;
                        const rate = importProgress.current / elapsed;
                        const remaining = (importProgress.total - importProgress.current) / rate;
                        const minutes = Math.floor(remaining / 60);
                        const seconds = Math.floor(remaining % 60);
                        return isFinite(remaining) && remaining > 0
                          ? `Est. ${minutes}m ${seconds}s remaining`
                          : 'Calculating...';
                      })()}
                    </span>
                  </div>
                  <Progress 
                    value={(importProgress.current / importProgress.total) * 100} 
                    className="h-2"
                  />
                </div>
              )}
              
              <p className="text-sm text-muted-foreground mt-3">
                Import trees from CSV files or export your trees to CSV format
              </p>
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