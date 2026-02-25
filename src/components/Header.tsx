import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TreeDeciduous, BookOpen, User, Sunrise, Stars, Sparkles, Leaf, Search, Heart, Flame, Globe, Hexagon } from "lucide-react";
import teotagLogo from "@/assets/teotag.jpeg";
import hearthIcon from "@/assets/hearth-icon.jpeg";
import s33dHearthLogo from "@/assets/s33d-hearth-logo.png";
import headerMossWood from "@/assets/header-moss-wood.jpg";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import TetolMenu from "./TetolMenu";
import TeotagGuide from "./TeotagGuide";


const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [heartsCount, setHeartsCount] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [tetolOpen, setTetolOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideTab, setGuideTab] = useState<"guide" | "search">("guide");
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasPendingActivity, setHasPendingActivity] = useState(false);

  const handleTeotagClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate("/auth"); return; }
    navigate(location.pathname === "/dashboard" ? "/" : "/dashboard");
  }, [user, navigate, location.pathname]);

  // Listen for custom event from Hero Teotag logo — now navigates to Hearth
  useEffect(() => {
    const handler = () => {
      if (!user) { navigate("/auth"); return; }
      navigate(location.pathname === "/dashboard" ? "/" : "/dashboard");
    };
    window.addEventListener("open-tetol", handler);
    return () => window.removeEventListener("open-tetol", handler);
  }, [user, navigate, location.pathname]);

  // Hover no longer opens search automatically — it was too aggressive and obscured the header

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return !document.documentElement.classList.contains('light');
    }
    return true;
  });

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove('dark');
      html.classList.add('light');
    } else {
      html.classList.remove('light');
      html.classList.add('dark');
    }
    setIsDark(!isDark);
  };

  // ⌘K shortcut opens TETOL menu (which now contains search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setTetolOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchHearts(session.user.id);
        fetchAvatar(session.user.id);
        checkPendingActivity(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchHearts(session.user.id);
          fetchAvatar(session.user.id);
          checkPendingActivity(session.user.id);
        } else {
          setHeartsCount(null);
          setAvatarUrl(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkPendingActivity = async (userId: string) => {
    // Check for bloomed seeds not yet collected
    const { count: bloomedSeeds } = await supabase
      .from("planted_seeds")
      .select("*", { count: "exact", head: true })
      .eq("planter_id", userId)
      .is("collected_at", null)
      .lte("blooms_at", new Date().toISOString());
    setHasPendingActivity((bloomedSeeds || 0) > 0);
  };

  const fetchHearts = async (userId: string) => {
    const [treesRes, offeringsRes, plantsRes, wishlistRes, heartTxRes, photoOfferingsRes] = await Promise.all([
      supabase.from("trees").select("*", { count: "exact", head: true }).eq("created_by", userId),
      supabase.from("offerings").select("*", { count: "exact", head: true }).eq("created_by", userId),
      supabase.from("greenhouse_plants").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("tree_wishlist").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("heart_transactions").select("amount").eq("user_id", userId),
      // Count distinct trees with photo offerings by this user
      supabase.from("offerings").select("tree_id").eq("created_by", userId).eq("type", "photo"),
    ]);
    const tc = treesRes.count || 0;
    const oc = offeringsRes.count || 0;
    const pc = plantsRes.count || 0;
    const wc = wishlistRes.count || 0;

    const heartTxTotal = (heartTxRes.data || []).reduce((sum: number, h: any) => sum + (h.amount || 0), 0);

    // Count unique trees with photos
    const photoTreeIds = new Set((photoOfferingsRes.data || []).map((o: any) => o.tree_id));
    const photoTreeCount = photoTreeIds.size;

    let total = tc * 10 + photoTreeCount; // +1 heart per tree mapped with photo
    const milestones: [number, number, string][] = [
      [tc, 1, "10"], [tc, 5, "25"], [tc, 10, "50"], [tc, 25, "100"], [tc, 50, "200"], [tc, 100, "500"], [tc, 250, "1000"],
      [oc, 1, "5"], [oc, 10, "30"], [oc, 25, "75"], [oc, 50, "200"], [oc, 100, "500"],
      [pc, 1, "5"], [pc, 5, "20"], [pc, 15, "60"],
      [wc, 3, "15"], [wc, 10, "50"],
    ];
    for (const [count, threshold, hearts] of milestones) {
      if (count >= threshold) total += parseInt(hearts);
    }
    total += heartTxTotal;
    setHeartsCount(total);
  };

  const fetchAvatar = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("avatar_url").eq("id", userId).maybeSingle();
    if (data?.avatar_url) setAvatarUrl(data.avatar_url);
  };

  const hearthImg = avatarUrl || hearthIcon;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-mystical overflow-hidden"
        style={{
          background: 'hsl(140 30% 10%)',
        }}
      >
      {/* Moss-wood texture background */}
      <div className="absolute inset-0 z-0" aria-hidden="true"
        style={{
          backgroundImage: `url(${headerMossWood})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.35,
        }}
      />
      <div className="absolute inset-0 z-[1]" aria-hidden="true"
        style={{
          background: 'linear-gradient(180deg, hsl(140 30% 10% / 0.7), hsl(145 28% 8% / 0.8))',
        }}
      />
      <style>{`
        .light header { background: hsl(140 20% 92%) !important; border-bottom-color: hsl(140 20% 78%) !important; box-shadow: 0 1px 4px hsl(140 15% 40% / 0.08) !important; }
        .light header > div:first-child { opacity: 0.15 !important; }
        .light header > div:nth-child(2) { background: linear-gradient(180deg, hsl(140 20% 92% / 0.75), hsl(145 18% 88% / 0.85)) !important; }
        @keyframes emberPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
      <div className="container mx-auto px-4 py-2 relative z-[2]">
        <div className="flex items-center justify-between relative">
          {/* Left side: Mobile TEOTAG / Desktop TEOTAG logo */}
          <div className="flex items-center gap-2">
            {/* Mobile TEOTAG logo — top left, navigates to Hearth */}
            <button type="button" className="md:hidden bg-transparent border-none p-0" onClick={handleTeotagClick}>
              <img 
                src={teotagLogo} 
                alt="TEOTAG — Go to Hearth" 
                className="w-10 h-10 rounded-full cursor-pointer hover:shadow-[0_0_20px_hsla(42,95%,55%,0.3)] transition-all duration-300"
              />
            </button>
            {/* Desktop TEOTAG logo — navigates to Hearth */}
            <div className="relative group hidden md:block">
              <button type="button" className="flex items-center gap-3 bg-transparent border-none p-0" onClick={handleTeotagClick}>
                <img 
                  src={teotagLogo} 
                  alt="TEOTAG — Go to Hearth" 
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full cursor-pointer hover:shadow-[0_0_20px_hsla(42,95%,55%,0.3)] transition-all duration-300 hover:scale-105"
                  title="Click to go to Hearth"
                />
              </button>
              <div className="absolute top-1/2 -translate-y-1/2 left-full ml-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 -translate-x-2 group-hover:translate-x-0 z-50">
                <div className="bg-card/95 backdrop-blur border border-mystical rounded-xl p-3 shadow-lg max-w-xs animate-fade-in whitespace-nowrap">
                  <p className="text-sm font-serif text-foreground">
                    <span className="text-primary font-bold">TEOTAG</span> — Go to Hearth
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Center: S33D logo — absolute centered on mobile, opens TETOL nav */}
          <div className="absolute left-1/2 -translate-x-1/2 md:hidden">
            <button
              type="button"
              className="flex items-center bg-transparent border-none p-0 relative"
              onClick={(e) => { e.stopPropagation(); setTetolOpen(true); }}
            >
              <div className="relative">
                <img src={s33dHearthLogo} alt="S33D — Open TETOL navigation" className="w-11 h-11 rounded-full object-cover border-2 border-primary/40 shadow-[0_0_12px_hsla(42,90%,55%,0.25)] hover:shadow-[0_0_20px_hsla(42,90%,55%,0.4)] transition-all duration-300 hover:scale-105" />
                {hasPendingActivity && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full"
                    style={{
                      background: "hsl(25, 90%, 55%)",
                      boxShadow: "0 0 8px hsla(25, 90%, 55%, 0.6)",
                      animation: "emberPulse 2s ease-in-out infinite",
                    }}
                  />
                )}
              </div>
            </button>
          </div>
          
          <nav className="hidden md:flex items-center gap-3 lg:gap-5">
            <div className="relative group">
              <Link to="/map" className="text-foreground hover:text-primary transition-mystical flex items-center gap-1.5 lg:gap-2">
                <TreeDeciduous className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="font-serif text-sm lg:text-base"><span className="hidden lg:inline">Ancient Friends </span>Atlas</span>
                  <span className="text-[9px] lg:text-[10px] font-serif tracking-[0.15em] uppercase text-muted-foreground group-hover:text-primary/70 transition-colors">The Roots</span>
                </div>
              </Link>
              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-popover border border-border rounded-lg shadow-lg py-1.5 min-w-[180px]">
                  <Link to="/atlas" className="flex items-center gap-2 px-4 py-2 text-sm font-serif text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Globe className="w-4 h-4 shrink-0" />
                    <span>Countries</span>
                  </Link>
                  <Link to="/hives" className="flex items-center gap-2 px-4 py-2 text-sm font-serif text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Hexagon className="w-4 h-4 shrink-0" />
                    <span>Hives</span>
                  </Link>
                </div>
              </div>
            </div>
            <Link to="/library" className="text-foreground hover:text-primary transition-mystical flex items-center gap-1.5 lg:gap-2 group">
              <BookOpen className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
              <div className="flex flex-col leading-tight">
                <span className="font-serif text-sm lg:text-base"><span className="hidden lg:inline">HeARTwood </span>Library</span>
                <span className="text-[9px] lg:text-[10px] font-serif tracking-[0.15em] uppercase text-muted-foreground group-hover:text-primary/70 transition-colors">The Heartwood</span>
              </div>
            </Link>
            <Link to="/council-of-life" className="text-foreground hover:text-primary transition-mystical flex items-center gap-1.5 lg:gap-2 group">
              <Leaf className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
              <div className="flex flex-col leading-tight">
                <span className="font-serif text-sm lg:text-base">Council<span className="hidden lg:inline"> of Life</span></span>
                <span className="text-[9px] lg:text-[10px] font-serif tracking-[0.15em] uppercase text-muted-foreground group-hover:text-primary/70 transition-colors">The Canopy</span>
              </div>
            </Link>
            <Link to="/golden-dream" className="text-foreground hover:text-primary transition-mystical flex items-center gap-1.5 lg:gap-2 group">
              <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
              <div className="flex flex-col leading-tight">
                <span className="font-serif text-sm lg:text-base"><span className="hidden lg:inline">yOur </span>Golden Dream</span>
                <span className="text-[9px] lg:text-[10px] font-serif tracking-[0.15em] uppercase text-muted-foreground group-hover:text-primary/70 transition-colors">The Crown</span>
              </div>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} title={isDark ? "Sunrise" : "Starry Night"} className="relative overflow-hidden h-10 w-10">
              <Sunrise className={`w-4 h-4 absolute transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
              <Stars className={`w-4 h-4 absolute transition-all duration-300 ${!isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`} />
            </Button>
            {user ? (
              <button
                type="button"
                onClick={() => setTetolOpen(true)}
                className="hidden md:flex items-center gap-2 text-foreground hover:text-primary transition-mystical bg-transparent border-none p-0 cursor-pointer group"
              >
                <div className="relative">
                  <img src={s33dHearthLogo} alt="S33D — Open TETOL navigation" className="w-8 h-8 rounded-full object-cover border border-primary/30" />
                  {hasPendingActivity && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full"
                      style={{
                        background: "hsl(25, 90%, 55%)",
                        boxShadow: "0 0 8px hsla(25, 90%, 55%, 0.6)",
                        animation: "emberPulse 2s ease-in-out infinite",
                      }}
                    />
                  )}
                </div>
                <span className="font-serif">S33D</span>
                {heartsCount !== null && heartsCount > 0 && (
                  <span className="flex items-center gap-0.5 text-xs font-serif text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                    <Heart className="w-3 h-3 fill-primary/40" />
                    {heartsCount}
                  </span>
                )}
              </button>
            ) : (
              <Button
                variant="sacred"
                size="sm"
                className="hidden md:inline-flex"
                asChild
              >
                <Link to="/auth">Login</Link>
              </Button>
            )}
          </div>
        </div>

      
      </div>
      </header>
      <TetolMenu open={tetolOpen} onClose={() => setTetolOpen(false)} />
      <TeotagGuide open={guideOpen} onClose={() => { setGuideOpen(false); setGuideTab("guide"); }} initialTab={guideTab} />
      
    </>
  );
};

export default Header;
