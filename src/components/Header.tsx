import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TreeDeciduous, BookOpen, User, Sunrise, Stars, Sparkles, Leaf, Search, Heart, Flame, Globe, Hexagon, Wand2, Music, Sprout, ScrollText, TreePine, Palette, Lock, BarChart3 } from "lucide-react";
import teotagLogo from "@/assets/teotag-small.webp";
import hearthIcon from "@/assets/hearth-icon.jpeg";
import s33dHearthLogo from "@/assets/s33d-hearth-logo.png";
import headerMossWood from "@/assets/header-moss-wood.jpg";
import { useEffect, useState, useRef, useCallback, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import GlobalSearch from "./GlobalSearch";
import { toast } from "sonner";
import { useHeartBalance } from "@/hooks/use-heart-balance";
import { useSeedEconomy } from "@/hooks/use-seed-economy";
import LivingStreak from "./LivingStreak";
import NotificationBell from "./NotificationBell";
import OfflineIndicator from "./OfflineIndicator";
import DailySeedCounter from "./DailySeedCounter";

const TetolMenu = lazy(() => import("./TetolMenu"));
const TeotagGuide = lazy(() => import("./TeotagGuide"));


const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [tetolOpen, setTetolOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideTab, setGuideTab] = useState<"guide" | "search">("guide");
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasPendingActivity, setHasPendingActivity] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

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

  // ⌘K shortcut opens global search directly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    // Only set dark if no theme preference already exists
    if (!document.documentElement.classList.contains('light')) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    // Set up listener BEFORE getSession to avoid race conditions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchAvatar(session.user.id);
          checkPendingActivity(session.user.id);
        } else {
          setAvatarUrl(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAvatar(session.user.id);
        checkPendingActivity(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Use unified heart balance hook
  const heartBalance = useHeartBalance(user?.id ?? null);
  const heartsCount = heartBalance.loading ? null : heartBalance.totalHearts;
  const { seedsRemaining } = useSeedEconomy(user?.id ?? null);

  // Realtime heart toast — listen for new heart_transactions, group duplicates
  useEffect(() => {
    if (!user) return;

    // Accumulator for grouping rapid heart events
    let pendingHearts: { amount: number; count: number; type: string } = { amount: 0, count: 0, type: '' };
    let flushTimer: ReturnType<typeof setTimeout> | null = null;

    const flushToast = () => {
      if (pendingHearts.count === 0) return;
      const { amount, count, type } = pendingHearts;
      const label = type === 'windfall' ? '🌊 Windfall' : type === 'sower' ? '🌱 Sower' : type === 'wanderer' ? '🚶 Wanderer' : '❤️ Heart';
      const desc = count > 1 ? `${count} check-ins` : "S33D Hearts earned";
      toast(`${label} +${amount}`, { description: desc, duration: 3000 });
      pendingHearts = { amount: 0, count: 0, type: '' };
    };

    const channel = supabase
      .channel('header-hearts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'heart_transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const amount = payload.new?.amount || 0;
          const heartType = payload.new?.heart_type || 'heart';
          if (amount > 0) {
            // If same type, accumulate; otherwise flush previous and start new
            if (pendingHearts.count > 0 && pendingHearts.type !== heartType) {
              flushToast();
            }
            pendingHearts.amount += amount;
            pendingHearts.count += 1;
            pendingHearts.type = heartType;

            // Debounce: flush after 3s of no new events
            if (flushTimer) clearTimeout(flushTimer);
            flushTimer = setTimeout(flushToast, 3000);
          }
        }
      )
      .subscribe();

    return () => {
      if (flushTimer) clearTimeout(flushTimer);
      flushToast(); // flush any pending
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

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

  // fetchHearts removed — unified useHeartBalance hook handles this

  const fetchAvatar = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("avatar_url").eq("id", userId).maybeSingle();
    if (data?.avatar_url) setAvatarUrl(data.avatar_url);
  };

  const hearthImg = avatarUrl || hearthIcon;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-mystical overflow-hidden md:overflow-visible"
        style={{
          background: 'hsl(var(--card))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(16px, env(safe-area-inset-right, 0px))',
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
          background: 'linear-gradient(180deg, hsl(var(--card) / 0.85), hsl(var(--card) / 0.95))',
        }}
      />
      {/* Light mode styles + emberPulse moved to index.css header-theme layer */}
      <div className="relative z-[2] px-0 py-2">
        <div className="flex items-center justify-between relative min-w-0">
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
              <div className="relative pulse-heart">
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
            <div className="relative group focus-within:z-[100]">
              <Link to="/map" className="text-foreground hover:text-primary transition-mystical flex items-center gap-1.5 lg:gap-2 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded">
                <TreeDeciduous className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="font-serif text-sm lg:text-base"><span className="hidden lg:inline">Ancient Friends </span>Atlas</span>
                  <span className="text-[9px] lg:text-[10px] font-serif tracking-[0.15em] uppercase text-muted-foreground group-hover:text-primary/70 transition-colors">The Roots</span>
                </div>
              </Link>
              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-[100]">
                <div className="bg-popover border border-border rounded-lg shadow-xl py-1.5 min-w-[180px]" style={{ background: 'hsl(var(--popover))' }}>
                  <Link to="/map" className="flex items-center gap-2 px-4 py-2 text-sm font-serif text-popover-foreground hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground transition-colors focus-visible:outline-none">
                    <TreeDeciduous className="w-4 h-4 shrink-0" />
                    <span>Map</span>
                  </Link>
                  <Link to="/atlas" className="flex items-center gap-2 px-4 py-2 text-sm font-serif text-popover-foreground hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground transition-colors focus-visible:outline-none">
                    <Globe className="w-4 h-4 shrink-0" />
                    <span>Countries</span>
                  </Link>
                  <Link to="/hives" className="flex items-center gap-2 px-4 py-2 text-sm font-serif text-popover-foreground hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground transition-colors focus-visible:outline-none">
                    <Hexagon className="w-4 h-4 shrink-0" />
                    <span>Hives</span>
                  </Link>
                  <div className="my-1 mx-2 h-px" style={{ background: 'hsl(var(--border) / 0.3)' }} />
                  <Link to="/harvest" className="flex items-center gap-2 px-4 py-2 text-sm font-serif text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none">
                    <Sprout className="w-4 h-4 shrink-0" />
                    <span>Harvest Exchange</span>
                  </Link>
                  <Link to="/cosmic" className="flex items-center gap-2 px-4 py-2 text-sm font-serif text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none">
                    <Stars className="w-4 h-4 shrink-0" />
                    <span>Cosmic Calendar</span>
                  </Link>
                </div>
              </div>
            </div>
            <div className="relative group focus-within:z-[100]">
              <Link to="/library" className="text-foreground hover:text-primary transition-mystical flex items-center gap-1.5 lg:gap-2 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded">
              <BookOpen className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
              <div className="flex flex-col leading-tight">
                <span className="font-serif text-sm lg:text-base"><span className="hidden lg:inline">HeARTwood </span>Library</span>
                <span className="text-[9px] lg:text-[10px] font-serif tracking-[0.15em] uppercase text-muted-foreground group-hover:text-primary/70 transition-colors">The Heartwood</span>
              </div>
            </Link>
              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-[100]">
                <div className="bg-popover border border-border rounded-lg shadow-xl py-1.5 min-w-[200px]" style={{ background: 'hsl(var(--popover))' }}>
                  <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm font-serif text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Heart className="w-4 h-4 shrink-0" />
                    <span>The Hearth</span>
                  </Link>
                  <Link to="/dashboard?tab=journey" className="flex items-center gap-2 px-4 py-2 text-sm font-serif text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                    <BarChart3 className="w-4 h-4 shrink-0" />
                    <span>Journey</span>
                  </Link>
                  <Link to="/vault" className="flex items-center gap-2 px-4 py-2 text-sm font-serif text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>Heartwood Vault</span>
                  </Link>
                  <div className="my-1 mx-2 h-px" style={{ background: 'hsl(var(--border) / 0.3)' }} />
                  <Link to="/library/staff-room" className="flex items-center gap-2 px-4 py-2 text-sm font-serif text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Wand2 className="w-4 h-4 shrink-0" />
                    <span>Staff Room</span>
                  </Link>
                  <Link to="/library/gallery" className="flex items-center gap-2 px-4 py-2 text-sm font-serif text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                    <TreeDeciduous className="w-4 h-4 shrink-0" />
                    <span>Ancient Friends</span>
                  </Link>
                  <Link to="/library/music-room" className="flex items-center gap-2 px-4 py-2 text-sm font-serif text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Music className="w-4 h-4 shrink-0" />
                    <span>Music Room</span>
                  </Link>
                  <Link to="/library/ledger" className="flex items-center gap-2 px-4 py-2 text-sm font-serif text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                    <ScrollText className="w-4 h-4 shrink-0" />
                    <span>Scrolls & Records</span>
                  </Link>
                </div>
              </div>
            </div>
            <div className="relative group focus-within:z-[100]">
              <Link to="/council-of-life" className="text-foreground hover:text-primary transition-mystical flex items-center gap-1.5 lg:gap-2 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded">
                <Leaf className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="font-serif text-sm lg:text-base">Council<span className="hidden lg:inline"> of Life</span></span>
                  <span className="text-[9px] lg:text-[10px] font-serif tracking-[0.15em] uppercase text-muted-foreground group-hover:text-primary/70 transition-colors">The Canopy</span>
                </div>
              </Link>
              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-[100]">
                <div className="bg-popover border border-border rounded-lg shadow-xl py-1.5 min-w-[180px]" style={{ background: 'hsl(var(--popover))' }}>
                  <Link to="/council-of-life" className="flex items-center gap-2 px-4 py-2 text-sm font-serif text-popover-foreground hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground transition-colors focus-visible:outline-none">
                    <Leaf className="w-4 h-4 shrink-0" />
                    <span>Council Portal</span>
                  </Link>
                </div>
              </div>
            </div>
            <div className="relative group focus-within:z-[100]">
              <Link to="/golden-dream" className="text-foreground hover:text-primary transition-mystical flex items-center gap-1.5 lg:gap-2 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded">
                <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="font-serif text-sm lg:text-base"><span className="hidden lg:inline">yOur </span>Golden Dream</span>
                  <span className="text-[9px] lg:text-[10px] font-serif tracking-[0.15em] uppercase text-muted-foreground group-hover:text-primary/70 transition-colors">The Crown</span>
                </div>
              </Link>
              <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-[100]">
                <div className="bg-popover border border-border rounded-lg shadow-xl py-1.5 min-w-[180px]" style={{ background: 'hsl(var(--popover))' }}>
                  <Link to="/golden-dream" className="flex items-center gap-2 px-4 py-2 text-sm font-serif text-popover-foreground hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground transition-colors focus-visible:outline-none">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Vision</span>
                  </Link>
                  <Link to="/docs" className="flex items-center gap-2 px-4 py-2 text-sm font-serif text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                    <ScrollText className="w-4 h-4 shrink-0" />
                    <span>Rewards Guide</span>
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <OfflineIndicator />
            {user && <DailySeedCounter remaining={seedsRemaining} compact />}
            {user && <NotificationBell />}
            <Button variant="ghost" size="icon" onClick={toggleTheme} title={isDark ? "Sunrise" : "Starry Night"} className="relative overflow-hidden h-8 w-8 md:h-10 md:w-10">
              <Sunrise className={`w-3.5 h-3.5 md:w-4 md:h-4 absolute transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
              <Stars className={`w-3.5 h-3.5 md:w-4 md:h-4 absolute transition-all duration-300 ${!isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`} />
            </Button>
            {user ? (
              <button
                type="button"
                onClick={() => setTetolOpen(true)}
                className="hidden md:flex items-center gap-2 text-foreground hover:text-primary transition-mystical bg-transparent border-none p-0 cursor-pointer group"
              >
                <div className="relative pulse-heart">
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
                <LivingStreak streak={heartBalance.streak} />
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
      <Suspense fallback={null}>
        {tetolOpen && <TetolMenu open={tetolOpen} onClose={() => setTetolOpen(false)} />}
        {guideOpen && <TeotagGuide open={guideOpen} onClose={() => { setGuideOpen(false); setGuideTab("guide"); }} initialTab={guideTab} />}
      </Suspense>
      <GlobalSearch open={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} />
    </>
  );
};

export default Header;
