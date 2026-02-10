import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import Header from "@/components/Header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, TreeDeciduous, Star, Sprout, Settings, LayoutDashboard, Archive, Trophy, ScrollText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseCSV, generateCSV, downloadCSV } from "@/utils/csvHandler";
import { convertToCoordinates } from "@/utils/what3words";
import hearthBg from "@/assets/hearth-bg.jpeg";
import Footer from "@/components/Footer";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import DashboardTrees from "@/components/dashboard/DashboardTrees";
import DashboardWishlist from "@/components/dashboard/DashboardWishlist";
import DashboardProfile from "@/components/dashboard/DashboardProfile";
import Greenhouse from "@/components/Greenhouse";
import DashboardVault from "@/components/dashboard/DashboardVault";
import DashboardLeaderboard from "@/components/dashboard/DashboardLeaderboard";
import PersonalLegend from "@/components/dashboard/PersonalLegend";

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
  avatar_url: string | null;
}

interface Ember {
  x: number; y: number; size: number; speedX: number; speedY: number;
  opacity: number; life: number; maxLife: number; hue: number;
}

const HearthEmbers = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    let embers: Ember[] = [];

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const spawnEmber = (): Ember => ({
      x: canvas.width * 0.3 + Math.random() * canvas.width * 0.4,
      y: canvas.height * 0.75 + Math.random() * canvas.height * 0.15,
      size: Math.random() * 2.5 + 0.8,
      speedX: (Math.random() - 0.5) * 0.6,
      speedY: -(Math.random() * 1.2 + 0.3),
      opacity: Math.random() * 0.7 + 0.3,
      life: 0,
      maxLife: Math.random() * 180 + 80,
      hue: 20 + Math.random() * 30,
    });

    for (let i = 0; i < 25; i++) {
      const e = spawnEmber();
      e.life = Math.random() * e.maxLife;
      embers.push(e);
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      embers.forEach((e, i) => {
        e.life++;
        e.x += e.speedX + Math.sin(e.life * 0.03) * 0.4;
        e.y += e.speedY;
        const progress = e.life / e.maxLife;
        const alpha = progress < 0.1 ? progress * 10 : progress > 0.7 ? (1 - progress) / 0.3 : 1;
        const currentOpacity = e.opacity * alpha;

        if (e.life >= e.maxLife || currentOpacity <= 0) {
          embers[i] = spawnEmber();
          return;
        }

        const glow = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size * 5);
        glow.addColorStop(0, `hsla(${e.hue}, 90%, 55%, ${currentOpacity * 0.3})`);
        glow.addColorStop(1, `hsla(${e.hue}, 80%, 45%, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.size * 5, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = `hsla(${e.hue}, 95%, 65%, ${currentOpacity})`;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2); ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />;
};

const DashboardPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [trees, setTrees] = useState<Tree[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [plantCount, setPlantCount] = useState(0);
  const [offeringCount, setOfferingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, startTime: 0 });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        setTimeout(() => {
          fetchProfile(session.user.id);
          fetchUserTrees(session.user.id);
          fetchPlantCount(session.user.id);
          fetchOfferingCount(session.user.id);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        fetchProfile(session.user.id);
        fetchUserTrees(session.user.id);
        fetchPlantCount(session.user.id);
        fetchOfferingCount(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (data) setProfile(data);
  };

  const fetchUserTrees = async (userId: string) => {
    const { data } = await supabase.from("trees").select("*").eq("created_by", userId).order("created_at", { ascending: false });
    setTrees(data || []);
  };

  const fetchPlantCount = async (userId: string) => {
    const { count } = await supabase.from("greenhouse_plants").select("*", { count: "exact", head: true }).eq("user_id", userId);
    setPlantCount(count || 0);
  };

  const fetchOfferingCount = async (userId: string) => {
    const { count } = await supabase.from("offerings").select("*", { count: "exact", head: true }).eq("created_by", userId);
    setOfferingCount(count || 0);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
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
        toast({ title: "Invalid CSV", description: "No valid tree data found", variant: "destructive" });
        setIsImporting(false);
        return;
      }

      setImportProgress({ current: 0, total: csvRows.length, startTime });
      const treeData: any[] = [];

      for (let i = 0; i < csvRows.length; i++) {
        const row = csvRows[i];
        try {
          const coords = await convertToCoordinates(row.what3words);
          if (coords) {
            treeData.push({ ...row, latitude: coords.coordinates.lat, longitude: coords.coordinates.lng });
          }
          setImportProgress({ current: i + 1, total: csvRows.length, startTime });
        } catch (error) {
          console.error(`Failed to convert ${row.what3words}:`, error);
        }
      }

      if (treeData.length === 0) {
        toast({ title: "Conversion failed", variant: "destructive" });
        setIsImporting(false);
        setImportProgress({ current: 0, total: 0, startTime: 0 });
        return;
      }

      const { error } = await supabase.from("trees").insert(treeData.map(t => ({ ...t, created_by: user?.id })));
      if (error) throw error;

      toast({ title: "Import successful", description: `Imported ${treeData.length} trees` });
      if (user) fetchUserTrees(user.id);
      event.target.value = "";
    } catch (error) {
      toast({ title: "Import failed", variant: "destructive" });
    } finally {
      setIsImporting(false);
      setImportProgress({ current: 0, total: 0, startTime: 0 });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.from("trees").select("*").eq("created_by", user?.id).order("created_at", { ascending: false });
      if (error) throw error;
      if (!data?.length) {
        toast({ title: "No data to export", variant: "destructive" });
        setIsExporting(false);
        return;
      }
      const csv = generateCSV(data);
      downloadCSV(csv, `my-ancient-friends-${new Date().toISOString().split("T")[0]}.csv`);
      toast({ title: "Exported", description: `${data.length} trees` });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
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

  const TAB_ITEMS = [
    { value: "overview", label: "Overview", icon: LayoutDashboard },
    { value: "legend", label: "Legend", icon: ScrollText },
    { value: "trees", label: "My Trees", icon: TreeDeciduous, count: trees.length },
    { value: "leaderboard", label: "Leaderboard", icon: Trophy },
    { value: "vault", label: "Vault", icon: Archive },
    { value: "wishlist", label: "Wishlist", icon: Star, count: wishlistCount },
    { value: "seedpods", label: "Seed Pods", icon: Sprout, count: plantCount },
    { value: "profile", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Hearth background */}
      <div className="fixed inset-0 z-0">
        <img src={hearthBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 75%, hsla(30, 80%, 40%, 0.15), transparent)',
          animation: 'hearthGlow 3s ease-in-out infinite',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 40% 35% at 48% 80%, hsla(20, 90%, 35%, 0.12), transparent)',
          animation: 'hearthFlicker 2.1s ease-in-out infinite 0.5s',
        }} />
        <HearthEmbers />
      </div>
      <style>{`
        @keyframes hearthGlow {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        @keyframes hearthFlicker {
          0%, 100% { opacity: 0.5; }
          20% { opacity: 0.9; }
          40% { opacity: 0.6; }
          60% { opacity: 1; }
          80% { opacity: 0.4; }
        }
      `}</style>
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-serif text-mystical mb-1">Hearth</h1>
            <p className="text-sm text-muted-foreground font-serif">
              Welcome back, {profile?.full_name || "Ancient Friend"}
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            {/* Tab navigation — scrollable on mobile */}
            <TabsList className="w-full justify-start bg-card/50 backdrop-blur border border-border/50 rounded-xl p-1 overflow-x-auto flex-nowrap">
              {TAB_ITEMS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="gap-2 font-serif text-xs tracking-wider whitespace-nowrap data-[state=active]:bg-primary/15 data-[state=active]:text-primary rounded-lg px-4 py-2"
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-1 text-[10px] bg-primary/20 text-primary rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                      {tab.count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview">
              <DashboardOverview
                treeCount={trees.length}
                wishlistCount={wishlistCount}
                plantCount={plantCount}
                offeringCount={offeringCount}
              />
            </TabsContent>
            <TabsContent value="legend">
              {user && <PersonalLegend userId={user.id} />}
            </TabsContent>

            <TabsContent value="trees">
              <DashboardTrees
                trees={trees}
                isImporting={isImporting}
                isExporting={isExporting}
                importProgress={importProgress}
                onImport={handleImport}
                onExport={handleExport}
              />
            </TabsContent>

            <TabsContent value="leaderboard">
              <DashboardLeaderboard currentUserId={user?.id} />
            </TabsContent>

            <TabsContent value="vault">
              {user && <DashboardVault userId={user.id} />}
            </TabsContent>

            <TabsContent value="wishlist">
              {user && (
                <DashboardWishlist userId={user.id} onCountChange={setWishlistCount} />
              )}
            </TabsContent>

            <TabsContent value="seedpods">
              <Greenhouse />
            </TabsContent>

            <TabsContent value="profile">
              {user && (
                <DashboardProfile
                  user={user}
                  profile={profile}
                  onProfileUpdate={setProfile}
                  onSignOut={handleSignOut}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardPage;
